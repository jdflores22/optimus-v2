using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Optimus.Application.Cargo.Interfaces;
using Optimus.Application.Cargo.Dtos;
using Optimus.Application.Edo.Interfaces;
using Optimus.Application.Yard;
using Optimus.Application.Yard.Dtos;
using Optimus.Application.Yard.Interfaces;
using Optimus.Domain.Entities;
using Optimus.Domain.Enums;
using Optimus.Infrastructure.Persistence;
using Optimus.Infrastructure.Shipping;
using Optimus.Shared.Constants;

namespace Optimus.Infrastructure.Yard;

public class DwellService : IDwellService
{
    private readonly OptimusDbContext _db;
    private readonly IContainerInventoryService _containers;
    private readonly INotificationService _notifications;
    private readonly IActivityLogService _activity;

    public DwellService(
        OptimusDbContext db,
        IContainerInventoryService containers,
        INotificationService notifications,
        IActivityLogService activity)
    {
        _db = db;
        _containers = containers;
        _notifications = notifications;
        _activity = activity;
    }

    public async Task<DwellConfigDto> GetConfigAsync(CancellationToken ct = default)
    {
        var cfg = await EnsureConfigAsync(ct);
        return MapConfig(cfg);
    }

    public async Task<DwellConfigDto> UpsertConfigAsync(UpsertDwellConfigRequest request, Guid actorId, CancellationToken ct = default)
    {
        var cfg = await EnsureConfigAsync(ct);
        cfg.NotificationThresholdDays = Math.Max(0, request.NotificationThresholdDays);
        cfg.AutomaticReturnThresholdDays = Math.Max(cfg.NotificationThresholdDays, request.AutomaticReturnThresholdDays);
        cfg.Timezone = string.IsNullOrWhiteSpace(request.Timezone) ? "Asia/Manila" : request.Timezone;
        cfg.EnableAutomaticReturns = request.EnableAutomaticReturns;
        cfg.EnableNotifications = request.EnableNotifications;
        cfg.IsActive = true;
        await _db.SaveChangesAsync(ct);
        await _activity.LogAsync(actorId, "dwell.config_upsert", nameof(DwellTimeConfiguration), cfg.Id, null, ct);
        return MapConfig(cfg);
    }

    public async Task<ContainerDto> RecordArrivalAsync(Guid containerId, DateTime? arrivalAt, Guid actorId, CancellationToken ct = default)
    {
        var container = await _db.Containers.FirstOrDefaultAsync(x => x.Id == containerId, ct)
                        ?? throw new KeyNotFoundException("Container not found.");
        container.TerminalArrivalDate = arrivalAt ?? DateTime.UtcNow;
        container.Status = ContainerStatus.AtTerminal;
        container.CurrentDwellDays = 0;
        container.LastDwellCalculationAt = DateTime.UtcNow;
        AddEvent(container, DwellEventType.Arrival, actorId, "Terminal arrival");
        await _db.SaveChangesAsync(ct);
        return await _containers.GetAsync(containerId, ct);
    }

    public async Task<ContainerDto> PauseAsync(Guid containerId, PauseResumeDwellRequest request, Guid actorId, CancellationToken ct = default)
    {
        var container = await _db.Containers.FirstOrDefaultAsync(x => x.Id == containerId, ct)
                        ?? throw new KeyNotFoundException("Container not found.");
        if (container.DwellPausedAt is not null)
        {
            throw new InvalidOperationException("Dwell already paused.");
        }

        Recalc(container);
        container.DwellPausedAt = DateTime.UtcNow;
        AddEvent(container, DwellEventType.Pause, actorId, request.Reason ?? "Paused");
        await _db.SaveChangesAsync(ct);
        return await _containers.GetAsync(containerId, ct);
    }

    public async Task<ContainerDto> ResumeAsync(Guid containerId, PauseResumeDwellRequest request, Guid actorId, CancellationToken ct = default)
    {
        var container = await _db.Containers.FirstOrDefaultAsync(x => x.Id == containerId, ct)
                        ?? throw new KeyNotFoundException("Container not found.");
        if (container.DwellPausedAt is null)
        {
            throw new InvalidOperationException("Dwell is not paused.");
        }

        var pausedDays = Math.Max(0, (int)Math.Floor((DateTime.UtcNow - container.DwellPausedAt.Value).TotalDays));
        container.TotalPausedDays += pausedDays;
        container.DwellPausedAt = null;
        Recalc(container);
        AddEvent(container, DwellEventType.Resume, actorId, request.Reason ?? $"Resumed (+{pausedDays}d paused)");
        await _db.SaveChangesAsync(ct);
        return await _containers.GetAsync(containerId, ct);
    }

    public async Task<IReadOnlyList<DwellEventDto>> ListEventsAsync(Guid? containerId, CancellationToken ct = default)
    {
        var q = _db.DwellTimeEvents.AsNoTracking().Include(x => x.Container).AsQueryable();
        if (containerId.HasValue) q = q.Where(x => x.ContainerId == containerId);
        var items = await q.OrderByDescending(x => x.EventDate).Take(200).ToListAsync(ct);
        return items.Select(x => new DwellEventDto(x.Id, x.ContainerId, x.Container.ContainerNumber, x.EventType.ToString(),
            x.EventDate, x.DwellDaysAtEvent, x.Reason)).ToList();
    }

    public async Task<IReadOnlyList<ContainerDto>> MonitorListAsync(CancellationToken ct = default)
    {
        var items = await _db.Containers.AsNoTracking()
            .Include(x => x.ShippingLine)
            .Include(x => x.ContainerType)
            .Include(x => x.ContainerSize)
            .Include(x => x.CyAllocation)!.ThenInclude(a => a!.Terminal)
            .Where(x => x.TerminalArrivalDate != null && x.Status != ContainerStatus.Returned)
            .OrderByDescending(x => x.CurrentDwellDays)
            .Take(200)
            .ToListAsync(ct);
        return items.Select(x => new ContainerDto(
            x.Id, x.ContainerNumber, x.ShippingLineId, x.ShippingLine.BrandName, x.ManifestId,
            x.ContainerType?.Code, x.ContainerSize?.Code, x.Status.ToString(), x.AllocationStatus.ToString(),
            x.CurrentLocation, x.CyAllocationId, x.CyAllocation?.Terminal?.Name, x.CurrentDwellDays,
            x.TerminalArrivalDate, x.DwellPausedAt, x.StackBay, x.StackRow, x.StackTier, x.CreatedAt)).ToList();
    }

    public async Task<int> ProcessMonitoringAsync(CancellationToken ct = default)
    {
        var cfg = await EnsureConfigAsync(ct);
        if (!cfg.IsActive) return 0;

        var containers = await _db.Containers
            .Where(x => x.TerminalArrivalDate != null && x.Status != ContainerStatus.Returned && x.DwellPausedAt == null)
            .ToListAsync(ct);

        var admins = await _db.Users.AsNoTracking()
            .Where(x => x.Role == AppRoles.ShippingLinesAdmin || x.Role == AppRoles.TerminalTeam || x.Role == AppRoles.SystemAdmin)
            .Select(x => x.Id)
            .ToListAsync(ct);

        var actions = 0;
        foreach (var container in containers)
        {
            Recalc(container);
            if (cfg.EnableNotifications && container.CurrentDwellDays >= cfg.NotificationThresholdDays &&
                container.Status != ContainerStatus.Alert)
            {
                container.Status = ContainerStatus.Alert;
                AddEvent(container, DwellEventType.Notification60Day, null, $"Dwell reached {container.CurrentDwellDays} days");
                foreach (var adminId in admins.Take(5))
                {
                    await _notifications.NotifyAsync(adminId, "Dwell threshold",
                        $"Container {container.ContainerNumber} dwell={container.CurrentDwellDays}d",
                        "dwell", nameof(Container), container.Id, ct);
                }

                actions++;
            }

            if (cfg.EnableAutomaticReturns && container.CurrentDwellDays >= cfg.AutomaticReturnThresholdDays)
            {
                container.Status = ContainerStatus.Returned;
                container.AutomaticReturnDate = DateTime.UtcNow;
                AddEvent(container, DwellEventType.AutomaticReturn, null, "Automatic return");
                actions++;
            }
        }

        if (containers.Count > 0)
        {
            await _db.SaveChangesAsync(ct);
        }

        return actions;
    }

    private async Task<DwellTimeConfiguration> EnsureConfigAsync(CancellationToken ct)
    {
        var cfg = await _db.DwellTimeConfigurations.FirstOrDefaultAsync(x => x.IsActive, ct);
        if (cfg is not null) return cfg;
        cfg = new DwellTimeConfiguration();
        _db.DwellTimeConfigurations.Add(cfg);
        await _db.SaveChangesAsync(ct);
        return cfg;
    }

    private void AddEvent(Container container, DwellEventType type, Guid? actorId, string? reason)
    {
        _db.DwellTimeEvents.Add(new DwellTimeEvent
        {
            ContainerId = container.Id,
            EventType = type,
            DwellDaysAtEvent = container.CurrentDwellDays,
            Reason = reason,
            TriggeredById = actorId
        });
    }

    private static void Recalc(Container container)
    {
        if (container.TerminalArrivalDate is null) return;
        var end = container.DwellPausedAt ?? DateTime.UtcNow;
        var days = (int)Math.Floor((end - container.TerminalArrivalDate.Value).TotalDays) - container.TotalPausedDays;
        container.CurrentDwellDays = Math.Max(0, days);
        container.LastDwellCalculationAt = DateTime.UtcNow;
    }

    private static DwellConfigDto MapConfig(DwellTimeConfiguration x) =>
        new(x.Id, x.NotificationThresholdDays, x.AutomaticReturnThresholdDays, x.Timezone,
            x.EnableAutomaticReturns, x.EnableNotifications, x.IsActive);
}

public class PreForecastService : IPreForecastService
{
    private readonly OptimusDbContext _db;
    private readonly IDocumentStore _docs;
    private readonly IQrCodeService _qr;
    private readonly INotificationService _notifications;
    private readonly IActivityLogService _activity;

    public PreForecastService(
        OptimusDbContext db,
        IDocumentStore docs,
        IQrCodeService qr,
        INotificationService notifications,
        IActivityLogService activity)
    {
        _db = db;
        _docs = docs;
        _qr = qr;
        _notifications = notifications;
        _activity = activity;
    }

    public async Task<PreForecastDto> SubmitAsync(SubmitPreForecastRequest request, string? photoPath, Guid truckerId, CancellationToken ct = default)
    {
        var trucker = await _db.Truckers.FirstOrDefaultAsync(x => x.Id == truckerId, ct)
                      ?? throw new UnauthorizedAccessException("Trucker account required.");
        var container = await _db.Containers.FirstOrDefaultAsync(x => x.Id == request.ContainerId, ct)
                        ?? throw new KeyNotFoundException("Container not found.");
        if (container.Status != ContainerStatus.AvailableForReturn)
        {
            throw new InvalidOperationException("Container is not available for return.");
        }

        var terminal = await _db.Terminals.FirstOrDefaultAsync(x => x.Id == request.TerminalId && x.IsActive, ct)
                       ?? throw new KeyNotFoundException("Terminal not found or inactive.");

        TerminalSlot? slot = null;
        if (request.SlotId.HasValue)
        {
            slot = await _db.TerminalSlots.FirstOrDefaultAsync(x => x.Id == request.SlotId && x.TerminalId == terminal.Id, ct)
                   ?? throw new KeyNotFoundException("Slot not found.");
            if (slot.Status == SlotStatus.Full || slot.AssignedCount >= slot.Capacity)
            {
                throw new InvalidOperationException("Selected slot is full.");
            }
        }

        if (string.IsNullOrWhiteSpace(photoPath) || request.Latitude is null || request.Longitude is null)
        {
            throw new InvalidOperationException("Geotagged photo with latitude/longitude is required.");
        }

        var entity = new PreForecastRequest
        {
            TruckerId = trucker.Id,
            ContainerId = container.Id,
            TerminalId = terminal.Id,
            AssignedSlotId = slot?.Id,
            ShippingLineId = container.ShippingLineId,
            Status = PreForecastRequestStatus.Pending,
            PaymentReference = request.PaymentReference,
            VerificationToken = Convert.ToHexString(RandomNumberGenerator.GetBytes(16))
        };
        entity.GeotagPhotos.Add(new GeotagPhoto
        {
            FilePath = photoPath,
            OriginalName = Path.GetFileName(photoPath),
            Latitude = request.Latitude,
            Longitude = request.Longitude,
            CapturedAt = DateTime.UtcNow
        });

        if (slot is not null)
        {
            slot.AssignedCount++;
            if (slot.AssignedCount >= slot.Capacity) slot.Status = SlotStatus.Full;
        }

        _db.PreForecastRequests.Add(entity);
        await _db.SaveChangesAsync(ct);

        var terminals = await _db.Users.AsNoTracking().Where(x => x.Role == AppRoles.TerminalTeam).Select(x => x.Id).Take(5).ToListAsync(ct);
        foreach (var tid in terminals)
        {
            await _notifications.NotifyAsync(tid, "New pre-forecast",
                $"Pre-forecast for {container.ContainerNumber} at {terminal.Name}",
                "pre_forecast", nameof(PreForecastRequest), entity.Id, ct);
        }

        await _activity.LogAsync(truckerId, "pre_forecast.submit", nameof(PreForecastRequest), entity.Id, container.ContainerNumber, ct);
        return await GetAsync(entity.Id, ct);
    }

    public async Task<PreForecastDto> VerifyAsync(Guid id, VerifyPreForecastRequest request, Guid actorId, string actorRole, CancellationToken ct = default)
    {
        if (actorRole is not (AppRoles.TerminalTeam or AppRoles.SystemAdmin or AppRoles.ShippingLinesAdmin))
        {
            throw new UnauthorizedAccessException("Terminal team required.");
        }

        var entity = await _db.PreForecastRequests
            .Include(x => x.Container)
            .Include(x => x.AssignedSlot)
            .Include(x => x.GeotagPhotos)
            .FirstOrDefaultAsync(x => x.Id == id, ct)
            ?? throw new KeyNotFoundException("Pre-forecast not found.");
        if (entity.Status != PreForecastRequestStatus.Pending)
        {
            throw new InvalidOperationException("Only pending pre-forecast can be verified.");
        }

        if (request.Approve)
        {
            if (request.SlotId.HasValue && entity.AssignedSlotId != request.SlotId)
            {
                var slot = await _db.TerminalSlots.FirstOrDefaultAsync(x => x.Id == request.SlotId && x.TerminalId == entity.TerminalId, ct)
                           ?? throw new KeyNotFoundException("Slot not found.");
                if (slot.AssignedCount >= slot.Capacity) throw new InvalidOperationException("Slot full.");
                if (entity.AssignedSlot is not null)
                {
                    entity.AssignedSlot.AssignedCount = Math.Max(0, entity.AssignedSlot.AssignedCount - 1);
                    entity.AssignedSlot.Status = SlotStatus.Available;
                }

                slot.AssignedCount++;
                if (slot.AssignedCount >= slot.Capacity) slot.Status = SlotStatus.Full;
                entity.AssignedSlotId = slot.Id;
            }

            foreach (var photo in entity.GeotagPhotos)
            {
                photo.IsVerified = photo.Latitude is not null && photo.Longitude is not null;
                photo.VerificationNotes = request.Notes;
            }

            entity.Status = PreForecastRequestStatus.Verified;
            entity.VerifiedAt = DateTime.UtcNow;
            entity.VerifiedById = actorId;
            entity.Container.Status = ContainerStatus.PreForecastApproved;
        }
        else
        {
            if (string.IsNullOrWhiteSpace(request.RejectionReason))
            {
                throw new InvalidOperationException("Rejection reason required.");
            }

            entity.Status = PreForecastRequestStatus.Rejected;
            entity.RejectionReason = request.RejectionReason;
            entity.VerifiedAt = DateTime.UtcNow;
            entity.VerifiedById = actorId;
            if (entity.AssignedSlot is not null)
            {
                entity.AssignedSlot.AssignedCount = Math.Max(0, entity.AssignedSlot.AssignedCount - 1);
                entity.AssignedSlot.Status = SlotStatus.Available;
            }
        }

        await _db.SaveChangesAsync(ct);
        await _notifications.NotifyAsync(entity.TruckerId, request.Approve ? "Pre-forecast verified" : "Pre-forecast rejected",
            request.Approve ? "Your pre-forecast was verified." : request.RejectionReason!,
            "pre_forecast", nameof(PreForecastRequest), entity.Id, ct);
        return await GetAsync(id, ct);
    }

    public async Task<PreForecastDto> CompleteAsync(Guid id, CompletePreForecastRequest request, Guid actorId, string actorRole, CancellationToken ct = default)
    {
        if (actorRole is not (AppRoles.TerminalTeam or AppRoles.SystemAdmin or AppRoles.ShippingLinesAdmin))
        {
            throw new UnauthorizedAccessException("Terminal team required.");
        }

        var entity = await _db.PreForecastRequests.Include(x => x.Container).Include(x => x.Terminal)
            .FirstOrDefaultAsync(x => x.Id == id, ct)
            ?? throw new KeyNotFoundException("Pre-forecast not found.");
        if (entity.Status != PreForecastRequestStatus.Verified)
        {
            throw new InvalidOperationException("Only verified pre-forecast can be completed.");
        }

        entity.PaymentVerified = true;
        entity.EdoNumber = string.IsNullOrWhiteSpace(request.EdoNumber)
            ? $"PA-{entity.Container.ContainerNumber}-{DateTime.UtcNow:yyyyMMdd}"
            : request.EdoNumber;
        entity.VerificationToken ??= Convert.ToHexString(RandomNumberGenerator.GetBytes(16));
        var verifyUrl = $"/verify/document/{entity.VerificationToken}";
        entity.QrCodePath = _qr.CreatePngFile("preforecast-qr", verifyUrl);
        entity.PackagePdfPath = _docs.CreatePlaceholderPdf("preforecast", $"Pre-Forecast {entity.EdoNumber}",
            $"Container={entity.Container.ContainerNumber}\nTerminal={entity.Terminal.Name}\nVerify={verifyUrl}");
        entity.Status = PreForecastRequestStatus.Completed;
        entity.Container.Status = ContainerStatus.AtTerminal;
        entity.Container.TerminalArrivalDate ??= DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return await GetAsync(id, ct);
    }

    public async Task<PreForecastDto> CancelAsync(Guid id, Guid actorId, string actorRole, CancellationToken ct = default)
    {
        var entity = await _db.PreForecastRequests.Include(x => x.Container).Include(x => x.AssignedSlot)
            .FirstOrDefaultAsync(x => x.Id == id, ct)
            ?? throw new KeyNotFoundException("Pre-forecast not found.");
        if (entity.Status is PreForecastRequestStatus.Completed or PreForecastRequestStatus.Cancelled)
        {
            throw new InvalidOperationException("Cannot cancel in current status.");
        }

        if (actorRole == AppRoles.Trucker && entity.TruckerId != actorId)
        {
            throw new UnauthorizedAccessException("Not your pre-forecast.");
        }

        if (actorRole != AppRoles.Trucker &&
            actorRole is not (AppRoles.TerminalTeam or AppRoles.SlStaff or AppRoles.ShippingLinesAdmin or AppRoles.SystemAdmin))
        {
            throw new UnauthorizedAccessException("Not allowed to cancel this pre-forecast.");
        }

        entity.Status = PreForecastRequestStatus.Cancelled;
        if (entity.Container.Status == ContainerStatus.PreForecastApproved)
        {
            entity.Container.Status = ContainerStatus.AvailableForReturn;
        }

        if (entity.AssignedSlot is not null)
        {
            entity.AssignedSlot.AssignedCount = Math.Max(0, entity.AssignedSlot.AssignedCount - 1);
            entity.AssignedSlot.Status = SlotStatus.Available;
        }

        await _db.SaveChangesAsync(ct);
        return await GetAsync(id, ct);
    }

    public async Task<PreForecastDto> GetAsync(Guid id, CancellationToken ct = default)
    {
        var entity = await Query().FirstOrDefaultAsync(x => x.Id == id, ct)
                     ?? throw new KeyNotFoundException("Pre-forecast not found.");
        return Map(entity);
    }

    public async Task<IReadOnlyList<PreForecastDto>> ListAsync(string? status, Guid? truckerId, CancellationToken ct = default)
    {
        if (!truckerId.HasValue)
        {
            return Array.Empty<PreForecastDto>();
        }

        var q = Query().Where(x => x.TruckerId == truckerId);

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<PreForecastRequestStatus>(status, true, out var st))
        {
            q = q.Where(x => x.Status == st);
        }

        var items = await q.OrderByDescending(x => x.CreatedAt).Take(200).ToListAsync(ct);
        return items.Select(Map).ToList();
    }

    private IQueryable<PreForecastRequest> Query() =>
        _db.PreForecastRequests.AsNoTracking()
            .Include(x => x.Container)
            .Include(x => x.Terminal)
            .Include(x => x.Trucker)
            .Include(x => x.GeotagPhotos);

    private static PreForecastDto Map(PreForecastRequest x) =>
        new(x.Id, x.ContainerId, x.Container.ContainerNumber, x.TerminalId, x.Terminal.Name, x.TruckerId,
            x.Trucker.FullName, x.Status.ToString(), x.AssignedSlotId, x.PaymentReference, x.PaymentVerified,
            x.RejectionReason, x.QrCodePath, x.PackagePdfPath, x.EdoNumber, x.VerificationToken, x.CreatedAt,
            x.GeotagPhotos.Select(p => new GeotagPhotoDto(p.Id, p.FilePath, p.OriginalName, p.Latitude, p.Longitude,
                p.CapturedAt, p.IsVerified)).ToList());
}

public class TruckerTokenService : ITruckerTokenService
{
    private readonly OptimusDbContext _db;

    public TruckerTokenService(OptimusDbContext db) => _db = db;

    public async Task<TruckerTokenDto> GenerateAsync(Guid truckerId, CancellationToken ct = default)
        => await IssueAsync(truckerId, ct);

    public async Task<TruckerTokenDto> RefreshAsync(Guid truckerId, CancellationToken ct = default)
        => await IssueAsync(truckerId, ct);

    public async Task RevokeAsync(Guid truckerId, CancellationToken ct = default)
    {
        var trucker = await _db.Truckers.FirstOrDefaultAsync(x => x.Id == truckerId, ct)
                      ?? throw new KeyNotFoundException("Trucker not found.");
        trucker.ApiTokenHash = null;
        trucker.ApiTokenExpiresAt = null;
        await _db.SaveChangesAsync(ct);
    }

    public async Task<bool> ValidateAsync(Guid truckerId, string rawToken, CancellationToken ct = default)
    {
        var trucker = await _db.Truckers.AsNoTracking().FirstOrDefaultAsync(x => x.Id == truckerId, ct);
        if (trucker?.ApiTokenHash is null || trucker.ApiTokenExpiresAt is null || trucker.ApiTokenExpiresAt < DateTime.UtcNow)
        {
            return false;
        }

        return FixedTimeEquals(trucker.ApiTokenHash, Hash(rawToken));
    }

    private async Task<TruckerTokenDto> IssueAsync(Guid truckerId, CancellationToken ct)
    {
        var trucker = await _db.Truckers.FirstOrDefaultAsync(x => x.Id == truckerId, ct)
                      ?? throw new KeyNotFoundException("Trucker not found.");
        var raw = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
        trucker.ApiTokenHash = Hash(raw);
        trucker.ApiTokenExpiresAt = DateTime.UtcNow.AddDays(30);
        trucker.LastActivityAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return new TruckerTokenDto(raw, trucker.ApiTokenExpiresAt.Value);
    }

    private static string Hash(string raw)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(raw));
        return Convert.ToHexString(bytes);
    }

    private static bool FixedTimeEquals(string a, string b)
    {
        var ba = Encoding.UTF8.GetBytes(a);
        var bb = Encoding.UTF8.GetBytes(b);
        return ba.Length == bb.Length && CryptographicOperations.FixedTimeEquals(ba, bb);
    }
}

public class TruckerPreForecastService : ITruckerPreForecastService
{
    private const int DefaultFreeDays = 7;

    private readonly OptimusDbContext _db;
    private readonly INotificationService _notifications;
    private readonly IActivityLogService _activity;
    private readonly ICyScopeService _cyScope;
    private readonly IDocumentStore _docs;
    private readonly IPaymentFeeService _fees;

    public TruckerPreForecastService(
        OptimusDbContext db,
        INotificationService notifications,
        IActivityLogService activity,
        ICyScopeService cyScope,
        IDocumentStore docs,
        IPaymentFeeService fees)
    {
        _db = db;
        _notifications = notifications;
        _activity = activity;
        _cyScope = cyScope;
        _docs = docs;
        _fees = fees;
    }

    private async Task<decimal> GetDetentionRateAsync(CancellationToken ct)
    {
        var fee = await _fees.GetActiveAsync("detention", ct);
        return fee.Amount > 0 ? fee.Amount : 150m;
    }

    public async Task<IReadOnlyList<TruckerPreForecastSearchResultDto>> SearchAsync(string query, CancellationToken ct = default)
    {
        var q = query.Trim().ToUpperInvariant();
        if (q.Length < 3)
        {
            return Array.Empty<TruckerPreForecastSearchResultDto>();
        }

        var lineId = await SoleShippingLine.RequireIdAsync(_db, ct);
        var containers = await _db.Containers.AsNoTracking()
            .Include(x => x.ContainerType)
            .Include(x => x.ContainerSize)
            .Include(x => x.ShippingLine)
            .Where(x => x.ShippingLineId == lineId && x.ContainerNumber.Contains(q))
            .OrderBy(x => x.ContainerNumber)
            .Take(20)
            .ToListAsync(ct);

        var numbers = containers.Select(x => x.ContainerNumber).ToList();
        var edos = await _db.ElectronicDeliveryOrders.AsNoTracking()
            .Include(x => x.Manifest).ThenInclude(m => m!.Broker)
            .Include(x => x.Manifest).ThenInclude(m => m!.Consignee)
            .Where(x => x.ContainerNumber != null && numbers.Contains(x.ContainerNumber))
            .OrderByDescending(x => x.GeneratedAt)
            .ToListAsync(ct);

        var edoByNumber = edos
            .GroupBy(x => x.ContainerNumber!.Trim().ToUpperInvariant())
            .ToDictionary(g => g.Key, g => g.First());

        var now = DateTime.UtcNow.Date;
        var rate = await GetDetentionRateAsync(ct);
        return containers
            .Select(c =>
            {
                edoByNumber.TryGetValue(c.ContainerNumber, out var edo);
                return MapTruckerPreForecastMatch(c, edo, now, rate);
            })
            .ToList();
    }

    public async Task<TruckerPreForecastVerifyDto> VerifyByTokenAsync(string token, CancellationToken ct = default)
    {
        var normalized = token.Trim();
        if (string.IsNullOrEmpty(normalized))
        {
            return new TruckerPreForecastVerifyDto(false, "Verification token is required.", null, null);
        }

        var resolved = await ResolveEdoFromTokenAsync(normalized, ct);
        if (resolved.Edo is null)
        {
            return new TruckerPreForecastVerifyDto(false, resolved.Error ?? "Invalid or unknown CRO/eDO verification token.", null, null);
        }

        var edo = resolved.Edo;
        if (edo.Status is not (EdoStatus.Expired or EdoStatus.Locked or EdoStatus.Released or EdoStatus.Active))
        {
            return new TruckerPreForecastVerifyDto(
                false,
                $"This CRO/eDO is in status {edo.Status} and cannot be used for pre-forecast.",
                null,
                null);
        }

        var container = await _db.Containers.AsNoTracking()
            .Include(x => x.ContainerType)
            .Include(x => x.ContainerSize)
            .Include(x => x.ShippingLine)
            .Include(x => x.Manifest).ThenInclude(m => m!.Broker)
            .Include(x => x.Manifest).ThenInclude(m => m!.Consignee)
            .FirstOrDefaultAsync(
                x => x.ContainerNumber == edo.ContainerNumber,
                ct);

        if (container is null)
        {
            return new TruckerPreForecastVerifyDto(
                false,
                $"Container {edo.ContainerNumber} from this CRO/eDO was not found in the system.",
                null,
                null);
        }

        var now = DateTime.UtcNow.Date;
        var rate = await GetDetentionRateAsync(ct);
        var match = MapTruckerPreForecastMatch(container, edo, now, rate);

        return new TruckerPreForecastVerifyDto(
            true,
            "CRO/eDO verified. Container details were loaded from the document QR.",
            normalized,
            match);
    }

    public async Task<TruckerPreForecastSubmissionDto> SubmitAsync(
        string verificationToken,
        DateTime returnDate,
        string releaseDocumentPath,
        IReadOnlyList<TruckerPreForecastPhotoInput> photos,
        Guid truckerId,
        Guid? preferredTerminalId = null,
        CancellationToken ct = default)
    {
        var missing = ContainerPhotoCatalog.RequiredViews
            .Where(v => !photos.Any(p => p.Category == v))
            .Select(ContainerPhotoCatalog.GetLabel)
            .ToList();
        if (missing.Count > 0)
        {
            throw new InvalidOperationException(
                $"All 7 container identity photos are required. Missing: {string.Join(", ", missing)}");
        }

        var verify = await VerifyByTokenAsync(verificationToken, ct);
        if (!verify.Valid || verify.Match is null || string.IsNullOrEmpty(verify.VerificationToken))
        {
            throw new InvalidOperationException(verify.Message);
        }

        var containerId = verify.Match.ContainerId;
        var expiredEdoId = verify.Match.EdoId
                           ?? throw new InvalidOperationException("Verified CRO/eDO has no linked document id.");

        var trucker = await _db.Truckers.FirstOrDefaultAsync(x => x.Id == truckerId, ct)
                      ?? throw new UnauthorizedAccessException("Trucker account required.");

        var container = await _db.Containers.FirstOrDefaultAsync(x => x.Id == containerId, ct)
                        ?? throw new KeyNotFoundException("Container not found.");

        var edo = await _db.ElectronicDeliveryOrders
            .Include(x => x.Manifest)
            .FirstOrDefaultAsync(x => x.Id == expiredEdoId, ct)
            ?? throw new KeyNotFoundException("eDO/CRO not found.");

        if (!string.Equals(edo.VerificationToken, verify.VerificationToken, StringComparison.Ordinal))
        {
            throw new InvalidOperationException("CRO/eDO verification token does not match the selected document.");
        }

        if (!string.Equals(edo.ContainerNumber?.Trim(), container.ContainerNumber, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("eDO/CRO does not match the verified container.");
        }

        if (edo.Status is not (EdoStatus.Expired or EdoStatus.Locked))
        {
            throw new InvalidOperationException("This eDO/CRO cannot be used for pre-forecast renewal.");
        }

        var activeDuplicate = await _db.TruckerPreForecastSubmissions.AsNoTracking()
            .AnyAsync(x =>
                x.ExpiredEdoId == edo.Id &&
                x.Status != TruckerPreForecastStatus.Completed &&
                x.Status != TruckerPreForecastStatus.Cancelled,
                ct);
        if (activeDuplicate)
        {
            throw new InvalidOperationException("An active pre-forecast submission already exists for this eDO/CRO.");
        }

        if (preferredTerminalId.HasValue)
        {
            var preferred = await _db.Terminals.AsNoTracking()
                .FirstOrDefaultAsync(x => x.Id == preferredTerminalId && x.IsActive, ct)
                ?? throw new KeyNotFoundException("Preferred container yard not found.");
            if (preferred.Identity != TerminalIdentity.ContainerYard)
            {
                throw new InvalidOperationException("Preferred return location must be a container yard (CY).");
            }
        }

        var rate = await GetDetentionRateAsync(ct);
        var (overdueDays, detention) = CalculateDetention(edo, returnDate, rate);
        container.ExpectedReturnDate = returnDate;

        var submission = new TruckerPreForecastSubmission
        {
            TruckerId = trucker.Id,
            ContainerId = container.Id,
            ExpiredEdoId = edo.Id,
            ReturnDate = returnDate,
            TruckerPreferredReturnDate = returnDate,
            ReleaseDocumentPath = releaseDocumentPath,
            EdoVerificationToken = verify.VerificationToken,
            PreferredTerminalId = preferredTerminalId,
            Status = TruckerPreForecastStatus.PendingTerminalAssignment,
            DetentionAmount = detention,
            OverdueDays = overdueDays,
        };
        _db.TruckerPreForecastSubmissions.Add(submission);

        foreach (var photo in photos)
        {
            submission.Photos.Add(new TruckerPreForecastPhoto
            {
                Category = photo.Category,
                FilePath = photo.FilePath,
                OriginalName = photo.OriginalName,
                Comment = photo.Comment,
            });
        }

        await _db.SaveChangesAsync(ct);

        var preferredLabel = preferredTerminalId.HasValue
            ? (await _db.Terminals.AsNoTracking().Where(x => x.Id == preferredTerminalId).Select(x => x.Name).FirstOrDefaultAsync(ct) ?? "CY")
            : null;
        var message = preferredLabel is not null
            ? $"Pre-forecast submitted. Terminal team will assign a CY (your preference: {preferredLabel}). Detention will be computed after the CY confirms the return schedule."
            : "Pre-forecast submitted. Terminal team will assign a container yard with available capacity. Detention will be computed after the CY confirms the return schedule.";

        var terminalUsers = await _db.Users.AsNoTracking()
            .Where(x => x.Role == AppRoles.TerminalTeam || x.Role == AppRoles.ShippingLinesAdmin || x.Role == AppRoles.SlStaff)
            .Select(x => x.Id)
            .Take(10)
            .ToListAsync(ct);
        foreach (var uid in terminalUsers)
        {
            await _notifications.NotifyAsync(
                uid,
                "New pre-forecast intake",
                $"Container {container.ContainerNumber} — assign CY and slot for empty return on {returnDate:yyyy-MM-dd}.",
                "trucker_pre_forecast",
                nameof(TruckerPreForecastSubmission),
                submission.Id,
                ct);
        }

        await _activity.LogAsync(
            truckerId,
            "trucker.pre_forecast.submit",
            nameof(TruckerPreForecastSubmission),
            submission.Id,
            container.ContainerNumber,
            ct);

        return await MapSubmissionAsync(submission.Id, message, ct);
    }

    public async Task<IReadOnlyList<TruckerPreForecastSubmissionDto>> ListAsync(
        string? status,
        Guid actorId,
        string actorRole,
        CancellationToken ct = default)
    {
        var query = SubmissionQuery();

        if (actorRole == AppRoles.Trucker)
        {
            query = query.Where(x => x.TruckerId == actorId);
        }
        else if (actorRole == AppRoles.CyStaff)
        {
            var terminalIds = await _cyScope.GetAssignedTerminalIdsAsync(actorId, ct);
            if (terminalIds.Count == 0)
            {
                return Array.Empty<TruckerPreForecastSubmissionDto>();
            }

            query = query.Where(x =>
                x.AssignedTerminalId != null &&
                terminalIds.Contains(x.AssignedTerminalId.Value));
        }
        else if (actorRole is AppRoles.TerminalTeam or AppRoles.SlStaff or AppRoles.ShippingLinesAdmin)
        {
            var lineId = await SoleShippingLine.ResolveForActorAsync(_db, actorId, actorRole, ct);
            query = query.Where(x => x.ExpiredEdo.ShippingLineId == lineId);
        }
        else if (actorRole == AppRoles.Accounting)
        {
            query = query.Where(x =>
                x.Status == TruckerPreForecastStatus.PendingAccountingReview ||
                x.Status == TruckerPreForecastStatus.AwaitingDetentionPayment);
        }
        else if (actorRole is AppRoles.Broker or AppRoles.Consignee)
        {
            query = query.Where(x =>
                x.Status == TruckerPreForecastStatus.AwaitingDetentionPayment &&
                x.ExpiredEdo.Manifest != null &&
                (actorRole == AppRoles.Broker
                    ? x.ExpiredEdo.Manifest.BrokerId == actorId
                    : x.ExpiredEdo.Manifest.ConsigneeId == actorId));
        }
        else if (actorRole != AppRoles.SystemAdmin)
        {
            throw new UnauthorizedAccessException("Not allowed to list pre-forecast intake.");
        }

        if (!string.IsNullOrWhiteSpace(status) &&
            Enum.TryParse<TruckerPreForecastStatus>(status, true, out var parsed))
        {
            query = query.Where(x => x.Status == parsed);
        }

        var items = await query.OrderByDescending(x => x.CreatedAt).Take(100).ToListAsync(ct);
        var results = new List<TruckerPreForecastSubmissionDto>();
        foreach (var item in items)
        {
            results.Add(await MapSubmissionEntityAsync(item, StatusMessage(item), ct));
        }

        return results;
    }

    public async Task<TruckerPreForecastSubmissionDto> GetAsync(
        Guid id,
        Guid actorId,
        string actorRole,
        CancellationToken ct = default)
    {
        var entity = await SubmissionQuery().FirstOrDefaultAsync(x => x.Id == id, ct)
                     ?? throw new KeyNotFoundException("Pre-forecast submission not found.");
        await EnsureSubmissionAccessAsync(entity, actorId, actorRole, ct);
        return await MapSubmissionEntityAsync(entity, StatusMessage(entity), ct);
    }

    public async Task<TruckerPreForecastSubmissionDto> AssignTerminalAsync(
        Guid id,
        AssignTruckerPreForecastTerminalRequest request,
        Guid actorId,
        string actorRole,
        CancellationToken ct = default)
    {
        EnsureTerminalStaff(actorRole);
        var entity = await SubmissionQuery().FirstOrDefaultAsync(x => x.Id == id, ct)
                     ?? throw new KeyNotFoundException("Pre-forecast submission not found.");
        if (entity.Status != TruckerPreForecastStatus.PendingTerminalAssignment)
        {
            throw new InvalidOperationException("Submission is not awaiting terminal CY assignment.");
        }

        var terminal = await _db.Terminals.FirstOrDefaultAsync(x => x.Id == request.TerminalId && x.IsActive, ct)
                       ?? throw new KeyNotFoundException("Container yard not found.");
        if (terminal.Identity != TerminalIdentity.ContainerYard)
        {
            throw new InvalidOperationException("Assigned location must be a container yard (CY).");
        }

        var cyUserIds = await _cyScope.GetCyUserIdsForTerminalAsync(terminal.Id, ct);
        if (cyUserIds.Count == 0)
        {
            throw new InvalidOperationException(
                $"No container yard staff is linked to {terminal.Name}. Assign a CY contact on the shipping line TEU contract before assigning trucker intake.");
        }

        TerminalSlot? slot = null;
        if (request.SlotId.HasValue)
        {
            slot = await _db.TerminalSlots.FirstOrDefaultAsync(
                x => x.Id == request.SlotId && x.TerminalId == terminal.Id,
                ct) ?? throw new KeyNotFoundException("Slot not found for this CY.");
            if (slot.Status == SlotStatus.Full || slot.AssignedCount >= slot.Capacity)
            {
                throw new InvalidOperationException("Selected slot is full.");
            }

            slot.AssignedCount++;
            if (slot.AssignedCount >= slot.Capacity)
            {
                slot.Status = SlotStatus.Full;
            }
        }

        entity.AssignedTerminalId = terminal.Id;
        entity.AssignedSlotId = slot?.Id;
        entity.TerminalNotes = request.Notes?.Trim();
        entity.Status = TruckerPreForecastStatus.PendingCySchedule;

        await _db.SaveChangesAsync(ct);

        var notifyMessage =
            $"Container {entity.Container.ContainerNumber} assigned to {terminal.Name} for empty return on {entity.ReturnDate:yyyy-MM-dd}. Review and confirm your CY free-day schedule.";
        foreach (var cyUserId in cyUserIds)
        {
            await _notifications.NotifyAsync(
                cyUserId,
                "Confirm empty return schedule",
                notifyMessage,
                "trucker_pre_forecast",
                nameof(TruckerPreForecastSubmission),
                entity.Id,
                ct);
        }

        await _notifications.NotifyAsync(
            entity.TruckerId,
            "Container yard assigned",
            $"Your empty return for {entity.Container.ContainerNumber} was assigned to {terminal.Name}. Requested return date: {entity.ReturnDate:yyyy-MM-dd}. The CY will confirm the schedule.",
            "trucker_pre_forecast",
            nameof(TruckerPreForecastSubmission),
            entity.Id,
            ct);

        await _activity.LogAsync(actorId, "trucker.pre_forecast.assign_terminal", nameof(TruckerPreForecastSubmission), entity.Id, terminal.Name, ct);
        return await MapSubmissionEntityAsync(entity, $"Assigned to {terminal.Name}. CY staff notified to confirm return schedule.", ct);
    }

    public async Task<TruckerPreForecastSubmissionDto> ConfirmCyScheduleAsync(
        Guid id,
        ConfirmCyPreForecastScheduleRequest request,
        Guid actorId,
        string actorRole,
        CancellationToken ct = default)
    {
        if (actorRole is not (AppRoles.CyStaff or AppRoles.SystemAdmin))
        {
            throw new UnauthorizedAccessException("CY staff required.");
        }

        var entity = await SubmissionQuery().FirstOrDefaultAsync(x => x.Id == id, ct)
                     ?? throw new KeyNotFoundException("Pre-forecast submission not found.");
        if (entity.Status != TruckerPreForecastStatus.PendingCySchedule)
        {
            throw new InvalidOperationException("Submission is not awaiting CY schedule confirmation.");
        }

        if (entity.AssignedTerminalId is null)
        {
            throw new InvalidOperationException("Submission has no assigned container yard.");
        }

        if (actorRole != AppRoles.SystemAdmin)
        {
            var terminalIds = await _cyScope.GetAssignedTerminalIdsAsync(actorId, ct);
            if (!terminalIds.Contains(entity.AssignedTerminalId.Value))
            {
                throw new UnauthorizedAccessException("This pre-forecast is not assigned to your container yard.");
            }
        }

        if (!request.Approve)
        {
            entity.Status = TruckerPreForecastStatus.Cancelled;
            entity.CyNotes = request.Notes?.Trim();
            if (entity.AssignedSlot is not null)
            {
                entity.AssignedSlot.AssignedCount = Math.Max(0, entity.AssignedSlot.AssignedCount - 1);
                entity.AssignedSlot.Status = SlotStatus.Available;
            }

            await _db.SaveChangesAsync(ct);
            return await MapSubmissionEntityAsync(entity, "CY declined the assigned return schedule.", ct);
        }

        if (entity.TruckerPreferredReturnDate == default)
        {
            entity.TruckerPreferredReturnDate = entity.ReturnDate;
        }

        entity.CyConfirmedReturnDate = request.ConfirmedReturnDate;
        entity.CyConfirmedById = actorId;
        entity.CyConfirmedAt = DateTime.UtcNow;
        entity.CyNotes = request.Notes?.Trim();
        entity.ReturnDate = request.ConfirmedReturnDate;
        entity.Container.ExpectedReturnDate = request.ConfirmedReturnDate;

        var preferredDate = entity.TruckerPreferredReturnDate.Date;
        var confirmedDate = request.ConfirmedReturnDate.Date;
        entity.ScheduleDeltaDays = Math.Max(0, (confirmedDate - preferredDate).Days);

        var edo = entity.ExpiredEdo;
        var rate = await GetDetentionRateAsync(ct);
        var (_, detentionAtPreferred) = CalculateDetention(edo, entity.TruckerPreferredReturnDate, rate);
        var (overdueDays, detention) = CalculateDetention(edo, request.ConfirmedReturnDate, rate);
        entity.DetentionAtPreferredDate = detentionAtPreferred;
        entity.ExtraDaysDetentionAmount = Math.Max(0, detention - detentionAtPreferred);
        entity.OverdueDays = overdueDays;
        entity.DetentionAmount = detention;
        entity.DetentionRateAtCalculation = rate;
        entity.ExtraDaysWaived = false;

        var edoExpired = edo.Status == EdoStatus.Expired ||
                           (edo.ExpiresAt.HasValue && edo.ExpiresAt.Value.Date < DateTime.UtcNow.Date);

        if (detention > 0)
        {
            entity.Status = TruckerPreForecastStatus.PendingAccountingReview;
            await NotifyAccountingAsync(entity, detention, overdueDays, ct);
        }
        else if (edoExpired)
        {
            var renewal = new EdoRenewalRequest
            {
                ExpiredEdoId = edo.Id,
                RequestedById = entity.TruckerId,
                EmptyContainerReturnDate = request.ConfirmedReturnDate,
                OverdueDays = overdueDays,
                DetentionChargeAmount = 0,
                Status = RenewalRequestStatus.PendingReview,
                AdditionalNotes = $"Pre-forecast intake after CY confirmed schedule at {entity.AssignedTerminal?.Name}.",
            };
            _db.EdoRenewalRequests.Add(renewal);
            await _db.SaveChangesAsync(ct);
            entity.RenewalRequestId = renewal.Id;
            entity.Status = TruckerPreForecastStatus.PendingReview;
            await NotifyStaffRenewalAsync(entity, ct);
        }
        else
        {
            entity.Status = TruckerPreForecastStatus.Completed;
        }

        await _db.SaveChangesAsync(ct);
        await _activity.LogAsync(actorId, "trucker.pre_forecast.cy_confirm", nameof(TruckerPreForecastSubmission), entity.Id, entity.Container.ContainerNumber, ct);
        return await MapSubmissionEntityAsync(entity, StatusMessage(entity), ct);
    }

    public async Task<TruckerPreForecastSubmissionDto> FinalizeAccountingAsync(
        Guid id,
        FinalizePreForecastAccountingRequest request,
        Guid actorId,
        string actorRole,
        CancellationToken ct = default)
    {
        if (actorRole is not (AppRoles.Accounting or AppRoles.SystemAdmin))
        {
            throw new UnauthorizedAccessException("Accounting required.");
        }

        var entity = await SubmissionQuery().FirstOrDefaultAsync(x => x.Id == id, ct)
                     ?? throw new KeyNotFoundException("Pre-forecast submission not found.");
        if (entity.Status != TruckerPreForecastStatus.PendingAccountingReview)
        {
            throw new InvalidOperationException("Submission is not awaiting accounting review.");
        }

        var currentRate = await GetDetentionRateAsync(ct);
        var previousRate = ResolveStoredCalculationRate(entity);
        var waiveExtraDays = request.WaiveExtraDays == true && entity.ScheduleDeltaDays > 0;
        var expected = BuildExpectedDetentionCharges(entity, currentRate, waiveExtraDays);
        var rateChanged = previousRate > 0 && previousRate != currentRate;

        var chargeLines = NormalizeChargeLines(request.ChargeLines);
        if (chargeLines.Count > 0)
        {
            EnsureDetentionChargesMatchRate(chargeLines, expected, currentRate, previousRate, rateChanged);
            if (request.WaiveExtraDays == true && entity.ScheduleDeltaDays > 0)
            {
                entity.ExtraDaysWaived = true;
            }
            else if (request.WaiveExtraDays == false)
            {
                entity.ExtraDaysWaived = false;
            }
        }
        else if (waiveExtraDays && expected.ExtraAmount > 0)
        {
            entity.ExtraDaysWaived = true;
        }
        else
        {
            entity.ExtraDaysWaived = false;
        }

        entity.DetentionAtPreferredDate = expected.PreferredAmount;
        entity.ExtraDaysDetentionAmount = expected.ExtraAmount;
        entity.DetentionRateAtCalculation = currentRate;
        entity.OverdueDays = expected.OverdueCy;

        decimal detention;
        if (chargeLines.Count > 0)
        {
            detention = chargeLines.Sum(x => x.Amount);
        }
        else if (entity.ExtraDaysWaived)
        {
            detention = request.AdjustedDetentionAmount ?? expected.PreferredAmount;
        }
        else
        {
            detention = request.AdjustedDetentionAmount ?? expected.TotalAmount;
        }

        if (detention < 0)
        {
            throw new InvalidOperationException("Detention amount cannot be negative.");
        }

        entity.DetentionAmount = detention;
        var returnDate = entity.CyConfirmedReturnDate ?? entity.ReturnDate;
        var rate = currentRate;
        var overdueDays = expected.OverdueCy;

        var baseLine = chargeLines.Count > 0 ? chargeLines[0].Amount : expected.PreferredAmount;
        var extraLine = chargeLines.Count > 1 ? chargeLines.Skip(1).Sum(x => x.Amount) : expected.ExtraAmount;
        if (entity.ExtraDaysWaived)
        {
            extraLine = chargeLines.Count > 1 ? chargeLines.Skip(1).Sum(x => x.Amount) : 0;
        }

        Billing? detentionBilling = null;
        if (detention > 0)
        {
            var pdfBody = BuildDetentionBillingPdfBody(
                entity,
                chargeLines,
                baseLine,
                extraLine,
                detention,
                overdueDays,
                request.Notes,
                rate);
            var pdf = _docs.CreatePlaceholderPdf(
                "billing",
                $"Detention billing {entity.Container.ContainerNumber}",
                pdfBody);
            detentionBilling = new Billing
            {
                ManifestId = null,
                BillingType = "detention_pre_forecast",
                FreightCharges = Math.Round(baseLine, 2),
                ThcCharges = 0,
                AdditionalCharges = Math.Round(extraLine, 2),
                TotalAmount = Math.Round(detention, 2),
                Currency = "PHP",
                TotalAmountPhp = Math.Round(detention, 2),
                PdfPath = pdf,
                GeneratedById = actorId,
            };
            _db.Billings.Add(detentionBilling);
        }

        if (detention > 0)
        {
            var renewal = new EdoRenewalRequest
            {
                ExpiredEdoId = entity.ExpiredEdoId,
                RequestedById = entity.TruckerId,
                EmptyContainerReturnDate = returnDate,
                OverdueDays = overdueDays,
                DetentionChargeAmount = detention,
                Status = RenewalRequestStatus.AwaitingPayment,
                AdditionalNotes = BuildAccountingNotes(request, entity),
                DetentionBillingId = detentionBilling?.Id,
            };
            _db.EdoRenewalRequests.Add(renewal);
            await _db.SaveChangesAsync(ct);
            entity.RenewalRequestId = renewal.Id;
            entity.Status = TruckerPreForecastStatus.AwaitingDetentionPayment;
            await NotifyBrokerDetentionAsync(entity, detention, ct);
            if (detentionBilling is not null)
            {
                await _activity.LogAsync(
                    actorId,
                    "billing.generate",
                    nameof(Billing),
                    detentionBilling.Id,
                    $"Detention pre-forecast {entity.Container.ContainerNumber} ₱{detention:N2}",
                    ct);
            }
        }
        else
        {
            entity.Status = TruckerPreForecastStatus.PendingReview;
            var renewal = new EdoRenewalRequest
            {
                ExpiredEdoId = entity.ExpiredEdoId,
                RequestedById = entity.TruckerId,
                EmptyContainerReturnDate = returnDate,
                OverdueDays = overdueDays,
                DetentionChargeAmount = 0,
                Status = RenewalRequestStatus.PendingReview,
                AdditionalNotes = BuildAccountingNotes(request, entity),
            };
            _db.EdoRenewalRequests.Add(renewal);
            await _db.SaveChangesAsync(ct);
            entity.RenewalRequestId = renewal.Id;
            await NotifyStaffRenewalAsync(entity, ct);
        }

        await _db.SaveChangesAsync(ct);
        await _activity.LogAsync(actorId, "trucker.pre_forecast.accounting_finalize", nameof(TruckerPreForecastSubmission), entity.Id, $"{detention}", ct);
        return await MapSubmissionEntityAsync(entity, StatusMessage(entity), ct);
    }

    private static string? BuildAccountingNotes(FinalizePreForecastAccountingRequest request, TruckerPreForecastSubmission entity)
    {
        var parts = new List<string>();
        if (entity.ExtraDaysWaived && entity.ScheduleDeltaDays > 0)
        {
            parts.Add(
                $"Waived ₱{entity.ExtraDaysDetentionAmount:N2} detention for {entity.ScheduleDeltaDays} CY schedule day(s) beyond trucker preferred {entity.TruckerPreferredReturnDate:yyyy-MM-dd}.");
        }

        if (!string.IsNullOrWhiteSpace(request.Notes))
        {
            parts.Add(request.Notes.Trim());
        }

        if (parts.Count == 0)
        {
            return $"Detention billing finalized by accounting for pre-forecast {entity.Id}.";
        }

        return string.Join(" ", parts);
    }

    public async Task MarkCompletedWhenEdoPaidAsync(Guid edoId, CancellationToken ct = default)
    {
        var submission = await _db.TruckerPreForecastSubmissions
            .FirstOrDefaultAsync(x => x.NewEdoId == edoId && x.Status == TruckerPreForecastStatus.AwaitingRenewalPayment, ct);
        if (submission is null)
        {
            return;
        }

        submission.Status = TruckerPreForecastStatus.Completed;
        await _db.SaveChangesAsync(ct);
        await _notifications.NotifyAsync(
            submission.TruckerId,
            "Pre-forecast completed",
            "Your pre-forecast is complete — the renewed CRO/eDO payment was verified and the document is ready.",
            "trucker_pre_forecast",
            nameof(TruckerPreForecastSubmission),
            submission.Id,
            ct);
    }

    private IQueryable<TruckerPreForecastSubmission> SubmissionQuery() =>
        _db.TruckerPreForecastSubmissions
            .Include(x => x.Container).ThenInclude(c => c.ContainerSize)
            .Include(x => x.Trucker)
            .Include(x => x.ExpiredEdo).ThenInclude(e => e.Manifest).ThenInclude(m => m!.Broker)
            .Include(x => x.ExpiredEdo).ThenInclude(e => e.Manifest).ThenInclude(m => m!.Consignee)
            .Include(x => x.ExpiredEdo).ThenInclude(e => e.ShippingLine)
            .Include(x => x.RenewalRequest).ThenInclude(r => r!.DetentionBilling)
            .Include(x => x.PreferredTerminal)
            .Include(x => x.AssignedTerminal)
            .Include(x => x.AssignedSlot)
            .Include(x => x.NewEdo).ThenInclude(e => e!.Payments)
            .Include(x => x.Photos);

    private static void EnsureTerminalStaff(string role)
    {
        if (role is not (AppRoles.TerminalTeam or AppRoles.SlStaff or AppRoles.ShippingLinesAdmin or AppRoles.SystemAdmin))
        {
            throw new UnauthorizedAccessException("Terminal or shipping line staff required.");
        }
    }

    private async Task EnsureSubmissionAccessAsync(
        TruckerPreForecastSubmission entity,
        Guid actorId,
        string role,
        CancellationToken ct)
    {
        if (role == AppRoles.SystemAdmin) return;
        if (role == AppRoles.Trucker && entity.TruckerId == actorId) return;
        if (role is AppRoles.TerminalTeam or AppRoles.SlStaff or AppRoles.ShippingLinesAdmin or AppRoles.Accounting)
        {
            var lineId = await SoleShippingLine.ResolveForActorAsync(_db, actorId, role, ct);
            SoleShippingLine.EnsureMatches(entity.ExpiredEdo.ShippingLineId, lineId);
            return;
        }
        if (role == AppRoles.CyStaff)
        {
            if (entity.AssignedTerminalId is null)
            {
                throw new UnauthorizedAccessException("Not allowed to view this submission.");
            }

            var terminalIds = await _cyScope.GetAssignedTerminalIdsAsync(actorId, ct);
            if (!terminalIds.Contains(entity.AssignedTerminalId.Value))
            {
                throw new UnauthorizedAccessException("This submission is not assigned to your container yard.");
            }

            return;
        }

        if (role is AppRoles.Broker or AppRoles.Consignee)
        {
            var manifest = entity.ExpiredEdo.Manifest;
            if (manifest is null)
            {
                throw new UnauthorizedAccessException("Not allowed to view this submission.");
            }

            if (role == AppRoles.Broker && manifest.BrokerId == actorId) return;
            if (role == AppRoles.Consignee && manifest.ConsigneeId == actorId) return;

            throw new UnauthorizedAccessException("Not allowed to view this submission.");
        }

        throw new UnauthorizedAccessException("Not allowed to view this submission.");
    }

    private static string StatusMessage(TruckerPreForecastSubmission x) => x.Status switch
    {
        TruckerPreForecastStatus.PendingTerminalAssignment =>
            "Awaiting terminal team to assign a container yard and slot.",
        TruckerPreForecastStatus.PendingCySchedule =>
            "CY assigned — awaiting container yard to confirm free-day return schedule.",
        TruckerPreForecastStatus.PendingAccountingReview =>
            $"CY confirmed return schedule. Accounting to finalize detention billing (est. ₱{x.DetentionAmount:N2}).",
        TruckerPreForecastStatus.AwaitingDetentionPayment =>
            "Detention billed — broker/consignee must pay and accounting must validate before a new CRO/eDO is generated.",
        TruckerPreForecastStatus.PendingReview =>
            "Awaiting shipping line staff to review and generate renewed CRO/eDO (pay-to-open applies).",
        TruckerPreForecastStatus.AwaitingRenewalPayment =>
            "Renewed CRO/eDO ready — trucker must pay the pay-to-open fee; accounting validates the receipt.",
        TruckerPreForecastStatus.Completed => "Pre-forecast completed.",
        TruckerPreForecastStatus.Cancelled => "Pre-forecast cancelled.",
        _ => "Pre-forecast in progress.",
    };

    private async Task NotifyAccountingAsync(
        TruckerPreForecastSubmission entity,
        decimal detention,
        int overdueDays,
        CancellationToken ct)
    {
        var users = await _db.Users.AsNoTracking()
            .Where(x => x.Role == AppRoles.Accounting)
            .Select(x => x.Id)
            .Take(10)
            .ToListAsync(ct);
        foreach (var uid in users)
        {
            var scheduleNote = entity.ScheduleDeltaDays > 0
                ? $" CY moved return {entity.ScheduleDeltaDays} day(s) after trucker preferred {entity.TruckerPreferredReturnDate:yyyy-MM-dd} — review extra detention (₱{entity.ExtraDaysDetentionAmount:N2})."
                : string.Empty;
            await _notifications.NotifyAsync(
                uid,
                "Finalize detention billing",
                $"Container {entity.Container.ContainerNumber}: CY confirmed return {entity.CyConfirmedReturnDate:yyyy-MM-dd}.{scheduleNote} Est. detention ₱{detention:N2} ({overdueDays} day(s)). Finalize billing for broker/consignee.",
                "trucker_pre_forecast",
                nameof(TruckerPreForecastSubmission),
                entity.Id,
                ct);
        }
    }

    private async Task NotifyBrokerDetentionAsync(
        TruckerPreForecastSubmission entity,
        decimal detention,
        CancellationToken ct)
    {
        var brokerId = entity.ExpiredEdo.Manifest?.BrokerId;
        var consigneeId = entity.ExpiredEdo.Manifest?.ConsigneeId;
        var msg =
            $"Detention of ₱{detention:N2} for container {entity.Container.ContainerNumber}. Submit payment receipt for accounting validation before a new CRO/eDO is issued.";
        if (brokerId is Guid b)
        {
            await _notifications.NotifyAsync(b, "Detention payment required", msg, "trucker_pre_forecast", nameof(TruckerPreForecastSubmission), entity.Id, ct);
        }

        if (consigneeId is Guid c)
        {
            await _notifications.NotifyAsync(c, "Detention payment required", msg, "trucker_pre_forecast", nameof(TruckerPreForecastSubmission), entity.Id, ct);
        }
    }

    private async Task NotifyStaffRenewalAsync(TruckerPreForecastSubmission entity, CancellationToken ct)
    {
        var users = await _db.Users.AsNoTracking()
            .Where(x => x.Role == AppRoles.SlStaff || x.Role == AppRoles.ShippingLinesAdmin)
            .Select(x => x.Id)
            .Take(10)
            .ToListAsync(ct);
        foreach (var uid in users)
        {
            await _notifications.NotifyAsync(
                uid,
                "Generate renewed CRO/eDO",
                $"Pre-forecast for {entity.Container.ContainerNumber} is ready for renewed CRO/eDO generation (pay-to-open).",
                "trucker_pre_forecast",
                nameof(TruckerPreForecastSubmission),
                entity.Id,
                ct);
        }
    }

    private async Task<TruckerPreForecastSubmissionDto> MapSubmissionAsync(Guid id, string message, CancellationToken ct)
    {
        var entity = await SubmissionQuery().FirstAsync(x => x.Id == id, ct);
        return await MapSubmissionEntityAsync(entity, message, ct);
    }

    private async Task<TruckerPreForecastSubmissionDto> MapSubmissionEntityAsync(
        TruckerPreForecastSubmission x,
        string message,
        CancellationToken ct)
    {
        var rate = await GetDetentionRateAsync(ct);
        return MapSubmission(x, message, rate);
    }

    private static TruckerPreForecastSubmissionDto MapSubmission(
        TruckerPreForecastSubmission x,
        string message,
        decimal detentionRatePerDay)
    {
        var edoExpired = x.ExpiredEdo.Status == EdoStatus.Expired ||
                         (x.ExpiredEdo.ExpiresAt.HasValue && x.ExpiredEdo.ExpiresAt.Value.Date < DateTime.UtcNow.Date);
        var preferredReturn = x.TruckerPreferredReturnDate == default ? x.ReturnDate : x.TruckerPreferredReturnDate;
        var cyReturn = x.CyConfirmedReturnDate ?? x.ReturnDate;
        var (overduePreferred, _) = CalculateDetention(x.ExpiredEdo, preferredReturn, detentionRatePerDay);
        var (overdueCy, _) = CalculateDetention(x.ExpiredEdo, cyReturn, detentionRatePerDay);
        var freeUntil = GetFreeTimeUntil(x.ExpiredEdo);
        var edoExpiresAt = x.ExpiredEdo.ExpiresAt;
        return new TruckerPreForecastSubmissionDto(
            x.Id,
            x.ContainerId,
            x.Container.ContainerNumber,
            x.Container.ContainerSize?.Code,
            x.ExpiredEdoId,
            x.ExpiredEdo.EdoNumber,
            x.RenewalRequestId,
            x.Status.ToString(),
            x.ReturnDate,
            x.DetentionAmount,
            x.OverdueDays,
            x.Status == TruckerPreForecastStatus.AwaitingDetentionPayment,
            message,
            x.Photos
                .OrderBy(p => Array.IndexOf(ContainerPhotoCatalog.RequiredViews, p.Category))
                .Select(p => new TruckerPreForecastPhotoDto(
                    p.Id,
                    p.Category.ToString(),
                    ContainerPhotoCatalog.GetLabel(p.Category),
                    p.FilePath,
                    p.OriginalName,
                    p.Comment))
                .ToList(),
            x.TruckerPreferredReturnDate == default ? x.ReturnDate : x.TruckerPreferredReturnDate,
            x.ScheduleDeltaDays,
            x.DetentionAtPreferredDate,
            x.ExtraDaysDetentionAmount,
            x.ExtraDaysWaived,
            x.PreferredTerminalId,
            x.PreferredTerminal?.Name,
            x.AssignedTerminalId,
            x.AssignedTerminal?.Name,
            x.AssignedSlotId,
            x.AssignedSlot is null ? null : x.AssignedSlot.Date,
            x.CyConfirmedReturnDate,
            x.TerminalNotes,
            x.CyNotes,
            x.NewEdoId,
            x.NewEdo?.EdoNumber,
            x.Trucker.FullName,
            x.ExpiredEdo.ShippingLine?.BrandName,
            edoExpired,
            x.ExpiredEdo.Manifest?.ManifestNumber,
            x.ExpiredEdo.Manifest?.Broker?.FullName,
            x.ExpiredEdo.Manifest?.Consignee?.BusinessName,
            x.RenewalRequest?.DetentionBilling?.PdfPath,
            x.RenewalRequest?.DetentionBilling?.FreightCharges,
            x.RenewalRequest?.DetentionBilling?.AdditionalCharges,
            freeUntil,
            edoExpiresAt,
            detentionRatePerDay,
            x.DetentionRateAtCalculation,
            overduePreferred,
            overdueCy,
            !string.IsNullOrWhiteSpace(x.RenewalRequest?.PaymentReceiptPath) &&
            x.RenewalRequest is { PaymentVerified: false },
            x.RenewalRequest?.PaymentReceiptPath,
            x.NewEdo?.Status.ToString(),
            x.NewEdo?.Payments
                .OrderByDescending(p => p.CreatedAt)
                .Select(p => p.Status.ToString())
                .FirstOrDefault());
    }

    private sealed record ExpectedDetentionCharges(
        int OverduePreferred,
        int OverdueCy,
        decimal PreferredAmount,
        decimal ExtraAmount,
        decimal TotalAmount);

    private static ExpectedDetentionCharges BuildExpectedDetentionCharges(
        TruckerPreForecastSubmission entity,
        decimal ratePerDay,
        bool waiveExtraDays)
    {
        var preferredReturn = entity.TruckerPreferredReturnDate == default
            ? entity.ReturnDate
            : entity.TruckerPreferredReturnDate;
        var cyReturn = entity.CyConfirmedReturnDate ?? entity.ReturnDate;
        var (overduePreferred, preferredAmount) = CalculateDetention(entity.ExpiredEdo, preferredReturn, ratePerDay);
        var (overdueCy, cyAmount) = CalculateDetention(entity.ExpiredEdo, cyReturn, ratePerDay);
        var extraAmount = Math.Max(0, cyAmount - preferredAmount);
        if (waiveExtraDays)
        {
            extraAmount = 0;
        }

        return new ExpectedDetentionCharges(
            overduePreferred,
            overdueCy,
            Math.Round(preferredAmount, 2),
            Math.Round(extraAmount, 2),
            Math.Round(preferredAmount + extraAmount, 2));
    }

    private static decimal ResolveStoredCalculationRate(TruckerPreForecastSubmission entity)
    {
        if (entity.DetentionRateAtCalculation > 0)
        {
            return entity.DetentionRateAtCalculation;
        }

        var preferredReturn = entity.TruckerPreferredReturnDate == default
            ? entity.ReturnDate
            : entity.TruckerPreferredReturnDate;
        var (overduePreferred, _) = CalculateDetention(entity.ExpiredEdo, preferredReturn, 1m);
        if (overduePreferred > 0 && entity.DetentionAtPreferredDate > 0)
        {
            return Math.Round(entity.DetentionAtPreferredDate / overduePreferred, 2);
        }

        return 0;
    }

    private static void EnsureDetentionChargesMatchRate(
        IReadOnlyList<BillingChargeLineDto> submitted,
        ExpectedDetentionCharges expected,
        decimal currentRate,
        decimal previousRate,
        bool rateChanged)
    {
        var customLines = submitted.Where(x => !LooksLikeSystemDetentionLine(x.Description)).ToList();
        var systemLines = submitted.Where(x => LooksLikeSystemDetentionLine(x.Description)).ToList();

        var submittedPreferred = systemLines.FirstOrDefault()?.Amount ?? 0;
        var submittedExtra = systemLines.Skip(1).Sum(x => x.Amount);
        var submittedTotal = submitted.Sum(x => x.Amount);
        var expectedTotal = expected.TotalAmount + customLines.Sum(x => x.Amount);

        if (expected.PreferredAmount > 0 && systemLines.Count > 0 &&
            Math.Abs(submittedPreferred - expected.PreferredAmount) > 0.01m)
        {
            throw BuildDetentionRateMismatch(currentRate, previousRate, rateChanged, expected, submittedTotal);
        }

        if (expected.ExtraAmount > 0 && systemLines.Count > 1 &&
            Math.Abs(submittedExtra - expected.ExtraAmount) > 0.01m)
        {
            throw BuildDetentionRateMismatch(currentRate, previousRate, rateChanged, expected, submittedTotal);
        }

        if (Math.Abs(submittedTotal - expectedTotal) > 0.01m)
        {
            throw BuildDetentionRateMismatch(currentRate, previousRate, rateChanged, expected, submittedTotal);
        }
    }

    private static InvalidOperationException BuildDetentionRateMismatch(
        decimal currentRate,
        decimal previousRate,
        bool rateChanged,
        ExpectedDetentionCharges expected,
        decimal submittedTotal)
    {
        var detail = rateChanged
            ? $"Detention rate changed from ₱{previousRate:N2}/day to ₱{currentRate:N2}/day. "
            : $"Charges do not match the current detention rate of ₱{currentRate:N2}/day. ";
        return new InvalidOperationException(
            detail +
            $"Expected ₱{expected.TotalAmount:N2} for detention lines but received ₱{submittedTotal:N2}. " +
            "Refresh the billing page and review recalculated charges before generating.");
    }

    private static bool LooksLikeSystemDetentionLine(string description) =>
        description.Contains("detention", StringComparison.OrdinalIgnoreCase) ||
        description.Contains("overdue", StringComparison.OrdinalIgnoreCase);

    private static List<BillingChargeLineDto> NormalizeChargeLines(IReadOnlyList<BillingChargeLineDto>? lines) =>
        (lines ?? Array.Empty<BillingChargeLineDto>())
            .Where(x => !string.IsNullOrWhiteSpace(x.Description))
            .Select(x => new BillingChargeLineDto(x.Description.Trim(), Math.Round(x.Amount, 2)))
            .Where(x => x.Amount >= 0)
            .ToList();

    private static DateTime GetFreeTimeUntil(ElectronicDeliveryOrder edo)
    {
        if (edo.ExpiresAt.HasValue)
        {
            return edo.ExpiresAt.Value.Date;
        }

        return edo.ReleasedAt?.Date.AddDays(DefaultFreeDays)
               ?? edo.GeneratedAt.Date.AddDays(DefaultFreeDays);
    }

    private static (int OverdueDays, decimal Detention) CalculateDetention(
        ElectronicDeliveryOrder edo,
        DateTime returnDate,
        decimal ratePerDay)
    {
        var freeUntil = GetFreeTimeUntil(edo);
        // Free time covers through freeUntil; detention accrues from the next calendar day.
        var firstDetentionDay = freeUntil.AddDays(1);
        if (returnDate.Date < firstDetentionDay)
        {
            return (0, 0m);
        }

        var overdue = (int)(returnDate.Date - firstDetentionDay).TotalDays + 1;
        return (overdue, overdue * ratePerDay);
    }

    private static string BuildDetentionBillingPdfBody(
        TruckerPreForecastSubmission entity,
        IReadOnlyList<BillingChargeLineDto> chargeLines,
        decimal baseLine,
        decimal extraLine,
        decimal total,
        int overdueDays,
        string? notes,
        decimal ratePerDay)
    {
        var truckerPreferred = entity.TruckerPreferredReturnDate == default
            ? entity.ReturnDate
            : entity.TruckerPreferredReturnDate;
        var cyConfirmed = entity.CyConfirmedReturnDate ?? entity.ReturnDate;
        var freeUntil = GetFreeTimeUntil(entity.ExpiredEdo);
        var (overduePreferred, _) = CalculateDetention(entity.ExpiredEdo, truckerPreferred, ratePerDay);
        var sb = new StringBuilder()
            .AppendLine($"Container: {entity.Container.ContainerNumber}")
            .AppendLine($"Expired CRO/eDO: {entity.ExpiredEdo.EdoNumber}")
            .AppendLine($"Manifest: {entity.ExpiredEdo.Manifest?.ManifestNumber ?? "—"}")
            .AppendLine($"Broker: {entity.ExpiredEdo.Manifest?.Broker?.FullName ?? "—"}")
            .AppendLine($"Consignee: {entity.ExpiredEdo.Manifest?.Consignee?.BusinessName ?? "—"}")
            .AppendLine($"Container yard: {entity.AssignedTerminal?.Name ?? "—"}")
            .AppendLine($"Free time until: {freeUntil:yyyy-MM-dd}")
            .AppendLine($"Detention rate: ₱{ratePerDay:0.00}/day")
            .AppendLine($"Trucker preferred return: {truckerPreferred:yyyy-MM-dd} ({overduePreferred} overdue day(s))")
            .AppendLine($"CY confirmed return: {cyConfirmed:yyyy-MM-dd} ({overdueDays} overdue day(s))")
            .AppendLine("Currency: PHP")
            .AppendLine("Charges:");
        if (chargeLines.Count > 0)
        {
            foreach (var line in chargeLines)
            {
                sb.AppendLine($"  - {line.Description}: {line.Amount:0.00}");
            }
        }
        else
        {
            sb.AppendLine($"  - Base detention (trucker schedule): {baseLine:0.00}")
                .AppendLine(extraLine > 0
                    ? $"  - Extra detention (CY +{entity.ScheduleDeltaDays}d): {extraLine:0.00}"
                    : entity.ExtraDaysWaived && entity.ScheduleDeltaDays > 0
                        ? $"  - Extra detention (CY +{entity.ScheduleDeltaDays}d): WAIVED"
                        : "  - Extra detention (CY schedule): 0.00");
        }

        sb.AppendLine($"Total: {total:0.00} PHP");
        if (!string.IsNullOrWhiteSpace(notes))
        {
            sb.AppendLine($"Notes: {notes.Trim()}");
        }

        return sb.ToString();
    }

    private async Task<(ElectronicDeliveryOrder? Edo, string? Error)> ResolveEdoFromTokenAsync(string token, CancellationToken ct)
    {
        var edo = await _db.ElectronicDeliveryOrders.AsNoTracking()
            .Include(x => x.Manifest).ThenInclude(m => m!.Broker)
            .Include(x => x.Manifest).ThenInclude(m => m!.Consignee)
            .Include(x => x.ShippingLine)
            .FirstOrDefaultAsync(x => x.VerificationToken == token, ct);

        if (edo is not null)
        {
            return (edo, null);
        }

        var row = await _db.DocumentVerifications.AsNoTracking()
            .FirstOrDefaultAsync(x => x.VerificationToken == token, ct);
        if (row is null)
        {
            return (null, "Invalid verification token.");
        }

        edo = await _db.ElectronicDeliveryOrders.AsNoTracking()
            .Include(x => x.Manifest).ThenInclude(m => m!.Broker)
            .Include(x => x.Manifest).ThenInclude(m => m!.Consignee)
            .Include(x => x.ShippingLine)
            .FirstOrDefaultAsync(x => x.Id == row.SubjectId, ct);

        return edo is null
            ? (null, "Document verification record found but eDO/CRO is no longer available.")
            : (edo, null);
    }

    private static TruckerPreForecastSearchResultDto MapTruckerPreForecastMatch(
        Container container,
        ElectronicDeliveryOrder? edo,
        DateTime asOfDate,
        decimal ratePerDay)
    {
        var (overdue, detention) = edo is null ? (0, 0m) : CalculateDetention(edo, asOfDate, ratePerDay);
        var expired = edo is not null &&
                      (edo.Status == EdoStatus.Expired ||
                       (edo.ExpiresAt.HasValue && edo.ExpiresAt.Value.Date < asOfDate));

        var manifest = edo?.Manifest ?? container.Manifest;

        return new TruckerPreForecastSearchResultDto(
            container.Id,
            container.ContainerNumber,
            edo?.Id,
            edo?.EdoNumber,
            edo?.Status.ToString(),
            edo?.ExpiresAt,
            expired,
            overdue,
            detention,
            edo?.ManifestId ?? manifest?.Id,
            manifest?.Broker?.FullName ?? edo?.Manifest?.Broker?.FullName,
            manifest?.Consignee?.FullName ?? edo?.Manifest?.Consignee?.FullName,
            manifest?.BrokerId ?? edo?.Manifest?.BrokerId,
            manifest?.ConsigneeId ?? edo?.Manifest?.ConsigneeId,
            FormatContainerSize(container.ContainerSize),
            FormatContainerType(container.ContainerType),
            container.Status.ToString(),
            edo?.CyLocation ?? container.CurrentLocation,
            manifest?.ManifestNumber,
            manifest?.BlNumber,
            manifest?.VesselName,
            manifest?.VoyageNumber,
            edo?.ShippingLine?.BrandName ?? container.ShippingLine?.BrandName);
    }

    private static string? FormatContainerSize(ContainerSize? size)
    {
        if (size is null) return null;
        if (!string.IsNullOrWhiteSpace(size.Code) && !string.IsNullOrWhiteSpace(size.Name))
        {
            return $"{size.Name} ({size.Code})";
        }

        return string.IsNullOrWhiteSpace(size.Name) ? size.Code : size.Name;
    }

    private static string? FormatContainerType(ContainerType? type)
    {
        if (type is null) return null;
        return string.IsNullOrWhiteSpace(type.Code) ? type.Name : type.Code;
    }
}

public class DwellMonitoringHostedService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<DwellMonitoringHostedService> _logger;

    public DwellMonitoringHostedService(IServiceScopeFactory scopeFactory, ILogger<DwellMonitoringHostedService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var dwell = scope.ServiceProvider.GetRequiredService<IDwellService>();
                var count = await dwell.ProcessMonitoringAsync(stoppingToken);
                if (count > 0)
                {
                    _logger.LogInformation("Dwell monitoring actions: {Count}", count);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Dwell monitoring job failed");
            }

            await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
        }
    }
}
