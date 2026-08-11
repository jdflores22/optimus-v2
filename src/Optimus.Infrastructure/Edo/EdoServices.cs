using System.Security.Cryptography;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Optimus.Application.Cargo.Interfaces;
using Optimus.Application.Edo.Dtos;
using Optimus.Application.Edo.Interfaces;
using Optimus.Domain.Entities;
using Optimus.Domain.Enums;
using Optimus.Infrastructure.Email;
using Optimus.Infrastructure.Persistence;
using Optimus.Infrastructure.Shipping;
using Optimus.Infrastructure.Storage;
using Optimus.Shared.Constants;
using QRCoder;

namespace Optimus.Infrastructure.Edo;

public class QrCodeService : IQrCodeService
{
    private readonly string _root;

    public QrCodeService(IUploadRootProvider uploads)
    {
        _root = uploads.RootDirectory;
        Directory.CreateDirectory(_root);
    }

    public string CreatePngFile(string category, string payload)
    {
        var dir = Path.Combine(_root, category);
        Directory.CreateDirectory(dir);
        var bytes = CreatePngBytes(payload);
        var file = $"{DateTime.UtcNow:yyyyMMddHHmmss}_{Guid.NewGuid():N}.png";
        var full = Path.Combine(dir, file);
        File.WriteAllBytes(full, bytes);
        return $"/uploads/{category}/{file}";
    }

    public byte[] CreatePngBytes(string payload, int pixelsPerModule = 5)
    {
        using var generator = new QRCodeGenerator();
        using var data = generator.CreateQrCode(payload, QRCodeGenerator.ECCLevel.Q);
        var png = new PngByteQRCode(data);
        return png.GetGraphic(pixelsPerModule);
    }
}

public class EdoService : IEdoService
{
    private readonly OptimusDbContext _db;
    private readonly IDocumentStore _docs;
    private readonly IQrCodeService _qr;
    private readonly IActivityLogService _activity;
    private readonly IPaymentFeeService _fees;
    private readonly IUploadRootProvider _uploads;
    private readonly AppSettings _appSettings;

    public EdoService(
        OptimusDbContext db,
        IDocumentStore docs,
        IQrCodeService qr,
        IActivityLogService activity,
        IPaymentFeeService fees,
        IUploadRootProvider uploads,
        IOptions<AppSettings> appSettings)
    {
        _db = db;
        _docs = docs;
        _qr = qr;
        _activity = activity;
        _fees = fees;
        _uploads = uploads;
        _appSettings = appSettings.Value;
    }

    public async Task<EdoDto> GenerateAsync(GenerateEdoRequest request, Guid actorId, string actorRole, CancellationToken ct = default)
    {
        EnsureRole(actorRole, AppRoles.SlStaff, AppRoles.ShippingLinesAdmin, AppRoles.SystemAdmin);
        var manifest = await _db.Manifests
            .Include(x => x.Broker)
            .Include(x => x.Consignee)
            .Include(x => x.ShippingLine)
            .FirstOrDefaultAsync(x => x.Id == request.ManifestId, ct)
                       ?? throw new KeyNotFoundException("Manifest not found.");

        if (manifest.WorkflowState is not (WorkflowState.PaymentVerified or WorkflowState.EdoGenerated or WorkflowState.EdoReleased))
        {
            throw new InvalidOperationException("Manifest must be PaymentVerified before eDO/CRO generation.");
        }

        var edo = await BuildEdoAsync(manifest, request.ContainerNumber, request.ExpiresAt, request.CyLocation, request.AdditionalNotes, actorId, request.RequirePayment, ct);
        _db.ElectronicDeliveryOrders.Add(edo);

        if (manifest.WorkflowState == WorkflowState.PaymentVerified)
        {
            var from = manifest.WorkflowState;
            manifest.WorkflowState = WorkflowState.EdoGenerated;
            _db.WorkflowStateHistories.Add(new WorkflowStateHistory
            {
                ManifestId = manifest.Id,
                FromState = from,
                ToState = WorkflowState.EdoGenerated,
                ActorId = actorId,
                ActorRole = actorRole,
                TransitionReason = "eDO/CRO generated"
            });
        }

        await _db.SaveChangesAsync(ct);
        await _activity.LogAsync(actorId, "edo.generate", nameof(ElectronicDeliveryOrder), edo.Id, edo.EdoNumber, ct);
        return Map(edo, manifest.ManifestNumber);
    }

    public async Task<GenerationSessionDto> BatchGenerateAsync(BatchGenerateEdoRequest request, Guid actorId, string actorRole, CancellationToken ct = default)
    {
        EnsureRole(actorRole, AppRoles.SlStaff, AppRoles.ShippingLinesAdmin, AppRoles.SystemAdmin);
        var manifest = await _db.Manifests
            .Include(x => x.Broker)
            .Include(x => x.Consignee)
            .Include(x => x.ShippingLine)
            .FirstOrDefaultAsync(x => x.Id == request.ManifestId, ct)
                       ?? throw new KeyNotFoundException("Manifest not found.");
        if (manifest.WorkflowState is not (WorkflowState.PaymentVerified or WorkflowState.EdoGenerated or WorkflowState.EdoReleased))
        {
            throw new InvalidOperationException("Manifest must be PaymentVerified before batch eDO/CRO generation.");
        }

        var containers = request.ContainerNumbers.Where(x => !string.IsNullOrWhiteSpace(x)).Select(x => x.Trim()).Distinct().ToList();
        if (containers.Count == 0)
        {
            containers.Add($"CTR-{manifest.ManifestNumber}");
        }

        var session = new GenerationSession
        {
            SessionId = Guid.NewGuid().ToString("N"),
            ManifestId = manifest.Id,
            InitiatedById = actorId,
            Status = GenerationSessionStatus.InProgress,
            TotalItems = containers.Count,
            ExpirationDate = request.ExpiresAt
        };
        _db.GenerationSessions.Add(session);
        await _db.SaveChangesAsync(ct);

        var failures = new List<string>();
        foreach (var container in containers)
        {
            session.CurrentItem = container;
            try
            {
                var edo = await BuildEdoAsync(manifest, container, request.ExpiresAt, request.CyLocation, null, actorId, true, ct);
                _db.ElectronicDeliveryOrders.Add(edo);
                session.CompletedItems++;
            }
            catch (Exception ex)
            {
                session.FailedItems++;
                failures.Add($"{container}:{ex.Message}");
            }

            await _db.SaveChangesAsync(ct);
        }

        if (manifest.WorkflowState == WorkflowState.PaymentVerified && session.CompletedItems > 0)
        {
            var from = manifest.WorkflowState;
            manifest.WorkflowState = WorkflowState.EdoGenerated;
            _db.WorkflowStateHistories.Add(new WorkflowStateHistory
            {
                ManifestId = manifest.Id,
                FromState = from,
                ToState = WorkflowState.EdoGenerated,
                ActorId = actorId,
                ActorRole = actorRole,
                TransitionReason = "Batch eDO/CRO generated"
            });
        }

        session.Status = session.FailedItems == 0 ? GenerationSessionStatus.Completed :
            session.CompletedItems == 0 ? GenerationSessionStatus.Failed : GenerationSessionStatus.Completed;
        session.CompletedAt = DateTime.UtcNow;
        session.CurrentItem = null;
        session.FailuresJson = failures.Count == 0 ? null : JsonSerializer.Serialize(failures);
        await _db.SaveChangesAsync(ct);
        await _activity.LogAsync(actorId, "edo.batch_generate", nameof(GenerationSession), session.Id, session.SessionId, ct);
        return MapSession(session);
    }

    public async Task<GenerationSessionDto?> GetSessionAsync(Guid sessionId, CancellationToken ct = default)
    {
        var session = await _db.GenerationSessions.AsNoTracking().FirstOrDefaultAsync(x => x.Id == sessionId, ct);
        return session is null ? null : MapSession(session);
    }

    public async Task<EdoDto> GetAsync(Guid id, CancellationToken ct = default)
    {
        var edo = await _db.ElectronicDeliveryOrders.AsNoTracking()
            .Include(x => x.Manifest)
            .Include(x => x.ReleasedBy)
            .FirstOrDefaultAsync(x => x.Id == id, ct)
            ?? throw new KeyNotFoundException("eDO/CRO not found.");
        var payment = await _db.EdoPayments.AsNoTracking()
            .Include(p => p.ValidatedBy)
            .Where(p => p.EdoId == edo.Id)
            .OrderByDescending(p => p.CreatedAt)
            .FirstOrDefaultAsync(ct);
        var preForecast = await _db.TruckerPreForecastSubmissions.AsNoTracking()
            .Where(x => x.NewEdoId == edo.Id)
            .Select(x => new { x.Id })
            .FirstOrDefaultAsync(ct);
        return Map(
            edo,
            edo.Manifest.ManifestNumber,
            payment,
            preForecast?.Id,
            preForecast is not null ? AppRoles.Trucker : null);
    }

    public async Task<IReadOnlyList<EdoDto>> ListAsync(
        Guid? manifestId,
        string? status,
        Guid actorId,
        string actorRole,
        Guid? brokerId = null,
        Guid? consigneeId = null,
        CancellationToken ct = default)
    {
        var q = _db.ElectronicDeliveryOrders.AsNoTracking().Include(x => x.Manifest).AsQueryable();
        if (manifestId.HasValue)
        {
            q = q.Where(x => x.ManifestId == manifestId);
        }

        switch (actorRole)
        {
            case AppRoles.Broker:
                q = q.Where(x => x.Manifest.BrokerId == actorId);
                break;
            case AppRoles.Consignee:
                q = q.Where(x => x.Manifest.ConsigneeId == actorId);
                break;
            case AppRoles.Trucker:
            {
                var truckerEdoIds = await _db.TruckerPreForecastSubmissions.AsNoTracking()
                    .Where(x => x.TruckerId == actorId)
                    .Select(x => new { x.ExpiredEdoId, x.NewEdoId })
                    .ToListAsync(ct);
                var ids = truckerEdoIds
                    .SelectMany(x => new[] { x.ExpiredEdoId, x.NewEdoId })
                    .Where(id => id.HasValue)
                    .Select(id => id!.Value)
                    .Distinct()
                    .ToList();
                if (ids.Count == 0)
                {
                    return Array.Empty<EdoDto>();
                }

                q = q.Where(x => ids.Contains(x.Id));
                break;
            }
            case AppRoles.SlStaff:
            case AppRoles.ShippingLinesAdmin:
            case AppRoles.TerminalTeam:
            case AppRoles.Evaluator:
            case AppRoles.Accounting:
            {
                var lineId = await SoleShippingLine.ResolveForActorAsync(_db, actorId, actorRole, ct);
                q = q.Where(x => x.ShippingLineId == lineId);
                break;
            }
            case AppRoles.SystemAdmin:
            {
                var lineId = await SoleShippingLine.RequireIdAsync(_db, ct);
                q = q.Where(x => x.ShippingLineId == lineId);
                break;
            }
            default:
                return Array.Empty<EdoDto>();
        }

        if (brokerId.HasValue)
        {
            q = q.Where(x => x.Manifest.BrokerId == brokerId);
        }

        if (consigneeId.HasValue)
        {
            q = q.Where(x => x.Manifest.ConsigneeId == consigneeId);
        }

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<EdoStatus>(status, true, out var st))
        {
            q = q.Where(x => x.Status == st);
        }

        var items = await q.OrderByDescending(x => x.GeneratedAt).ToListAsync(ct);
        var payments = await LoadLatestPaymentsAsync(items.Select(x => x.Id).ToList(), ct);
        return items.Select(x => Map(x, x.Manifest.ManifestNumber, payments.GetValueOrDefault(x.Id))).ToList();
    }

    private async Task<Guid> ResolveActorShippingLineIdAsync(Guid actorId, string actorRole, CancellationToken ct) =>
        await SoleShippingLine.ResolveForActorAsync(_db, actorId, actorRole, ct);

    public async Task<EdoReleaseQueueDto> ListReleaseQueueAsync(Guid? shippingLineId = null, CancellationToken ct = default)
    {
        var q = _db.ElectronicDeliveryOrders.AsNoTracking()
            .Include(x => x.Manifest).ThenInclude(m => m!.Broker)
            .Include(x => x.Manifest).ThenInclude(m => m!.Consignee)
            .Where(x => x.Status == EdoStatus.PendingRelease || x.Status == EdoStatus.PendingValidation);

        if (shippingLineId.HasValue)
        {
            q = q.Where(x => x.ShippingLineId == shippingLineId.Value);
        }

        var items = await q.OrderByDescending(x => x.GeneratedAt).ToListAsync(ct);

        var edoIds = items.Select(x => x.Id).ToList();
        var payments = await _db.EdoPayments.AsNoTracking()
            .Include(x => x.SubmittedBy)
            .Where(p => p.EdoId != null && edoIds.Contains(p.EdoId.Value))
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync(ct);

        var latestPaymentByEdo = payments
            .Where(p => p.EdoId.HasValue)
            .GroupBy(p => p.EdoId!.Value)
            .ToDictionary(g => g.Key, g => g.First());

        var queueItems = items
            .Where(edo => edo.Manifest is not null)
            .Select(edo =>
        {
            latestPaymentByEdo.TryGetValue(edo.Id, out var payment);
            var manifest = edo.Manifest!;
            return new EdoReleaseQueueItemDto(
                edo.Id,
                edo.EdoNumber,
                edo.Status.ToString(),
                manifest.Id,
                manifest.ManifestNumber,
                edo.ContainerNumber,
                manifest.Broker?.FullName,
                manifest.Consignee is Consignee consignee ? consignee.BusinessName : manifest.Consignee?.FullName,
                edo.GeneratedAt,
                payment?.Id,
                payment?.Status.ToString(),
                payment?.Amount,
                payment?.Currency,
                payment?.CreatedAt,
                payment?.SubmittedBy?.FullName);
        }).ToList();

        var pendingValidation = queueItems.Count(x =>
            x.PaymentStatus == PaymentStatus.PendingValidation.ToString());
        var readyToRelease = queueItems.Count(x => x.Status == EdoStatus.PendingRelease.ToString());
        var awaitingPayment = queueItems.Count(x => x.PaymentId is null);

        return new EdoReleaseQueueDto(
            queueItems,
            queueItems.Count,
            pendingValidation,
            readyToRelease,
            awaitingPayment);
    }

    public async Task<IReadOnlyList<EdoReleaseRecordDto>> ListReleaseRecordsAsync(Guid? shippingLineId = null, CancellationToken ct = default)
    {
        var releasedStatuses = new[] { EdoStatus.Released, EdoStatus.Active };
        var q = _db.ElectronicDeliveryOrders.AsNoTracking()
            .Include(x => x.Manifest).ThenInclude(m => m!.Broker)
            .Include(x => x.Manifest).ThenInclude(m => m!.Consignee)
            .Include(x => x.ReleasedBy)
            .Where(x => releasedStatuses.Contains(x.Status) && x.ReleasedAt != null);

        if (shippingLineId.HasValue)
        {
            q = q.Where(x => x.ShippingLineId == shippingLineId.Value);
        }

        var items = await q.OrderByDescending(x => x.ReleasedAt).Take(200).ToListAsync(ct);

        var edoIds = items.Select(x => x.Id).ToList();
        var payments = await _db.EdoPayments.AsNoTracking()
            .Include(x => x.ValidatedBy)
            .Where(p => p.EdoId != null && edoIds.Contains(p.EdoId.Value) && p.Status == PaymentStatus.Verified)
            .OrderByDescending(p => p.ValidatedAt)
            .ToListAsync(ct);

        var verifiedPaymentByEdo = payments
            .Where(p => p.EdoId.HasValue)
            .GroupBy(p => p.EdoId!.Value)
            .ToDictionary(g => g.Key, g => g.First());

        return items.Select(edo =>
        {
            verifiedPaymentByEdo.TryGetValue(edo.Id, out var payment);
            var manifest = edo.Manifest;
            return new EdoReleaseRecordDto(
                edo.Id,
                edo.EdoNumber,
                edo.Status.ToString(),
                manifest.Id,
                manifest.ManifestNumber,
                edo.ContainerNumber,
                manifest.Broker?.FullName,
                manifest.Consignee is Consignee consignee ? consignee.BusinessName : manifest.Consignee?.FullName,
                edo.ReleasedAt,
                edo.ReleasedBy?.FullName,
                payment?.Amount,
                payment?.Currency,
                payment?.ValidatedAt,
                payment?.ValidatedBy?.FullName);
        }).ToList();
    }

    public async Task<EdoGenerationQueueDto> ListGenerationQueueAsync(Guid? shippingLineId, CancellationToken ct = default)
    {
        var eligibleStates = new[]
        {
            WorkflowState.PaymentVerified,
            WorkflowState.EdoGenerated,
            WorkflowState.EdoReleased
        };

        var generatedEdoStatuses = new[]
        {
            EdoStatus.PendingValidation,
            EdoStatus.PendingRelease,
            EdoStatus.Released,
            EdoStatus.Active
        };

        var verifiedManifestIds = await _db.Payments.AsNoTracking()
            .Where(p => p.PaymentType == PaymentType.FinalPayment && p.Status == PaymentStatus.Verified)
            .Select(p => p.ManifestId)
            .Distinct()
            .ToListAsync(ct);

        if (verifiedManifestIds.Count == 0)
        {
            return new EdoGenerationQueueDto(Array.Empty<EdoGenerationGroupDto>(), Array.Empty<EdoGenerationContainerDto>(), 0, 0, 0);
        }

        var containersQuery = _db.Containers.AsNoTracking()
            .Include(c => c.ContainerSize)
            .Include(c => c.ContainerType)
            .Include(c => c.Manifest!).ThenInclude(m => m.Broker)
            .Include(c => c.Manifest!).ThenInclude(m => m.Consignee)
            .Include(c => c.Manifest!).ThenInclude(m => m.ShippingLine)
            .Where(c => c.ManifestId != null
                        && eligibleStates.Contains(c.Manifest!.WorkflowState)
                        && verifiedManifestIds.Contains(c.ManifestId.Value));

        if (shippingLineId.HasValue)
        {
            containersQuery = containersQuery.Where(c => c.Manifest!.ShippingLineId == shippingLineId.Value);
        }

        var containers = await containersQuery
            .OrderBy(c => c.Manifest!.ManifestNumber)
            .ThenBy(c => c.ContainerNumber)
            .ToListAsync(ct);

        if (containers.Count == 0)
        {
            return new EdoGenerationQueueDto(Array.Empty<EdoGenerationGroupDto>(), Array.Empty<EdoGenerationContainerDto>(), 0, 0, 0);
        }

        var manifestIds = containers.Select(c => c.ManifestId!.Value).Distinct().ToList();

        var paymentVerifiedAt = await _db.Payments.AsNoTracking()
            .Where(p => manifestIds.Contains(p.ManifestId)
                        && p.PaymentType == PaymentType.FinalPayment
                        && p.Status == PaymentStatus.Verified)
            .GroupBy(p => p.ManifestId)
            .Select(g => new { ManifestId = g.Key, VerifiedAt = g.Max(p => p.ValidatedAt) })
            .ToDictionaryAsync(x => x.ManifestId, x => x.VerifiedAt, ct);

        var edos = await _db.ElectronicDeliveryOrders.AsNoTracking()
            .Where(e => manifestIds.Contains(e.ManifestId) && generatedEdoStatuses.Contains(e.Status))
            .ToListAsync(ct);

        var edoByManifestContainer = edos
            .Where(e => !string.IsNullOrWhiteSpace(e.ContainerNumber))
            .GroupBy(e => (e.ManifestId, Container: e.ContainerNumber!.Trim().ToUpperInvariant()))
            .ToDictionary(g => g.Key, g => g.OrderByDescending(x => x.GeneratedAt).First());

        var manifestContainerCounts = containers
            .GroupBy(c => c.ManifestId!.Value)
            .ToDictionary(g => g.Key, g => g.Count());

        var manifestEdoCounts = edos
            .Where(e => !string.IsNullOrWhiteSpace(e.ContainerNumber))
            .GroupBy(e => e.ManifestId)
            .ToDictionary(g => g.Key, g => g.Select(x => x.ContainerNumber!.Trim().ToUpperInvariant()).Distinct().Count());

        var pendingRows = new List<EdoGenerationContainerDto>();
        var generatedRows = new List<EdoGenerationContainerDto>();

        foreach (var container in containers)
        {
            var manifest = container.Manifest!;
            var key = (manifest.Id, container.ContainerNumber.Trim().ToUpperInvariant());
            edoByManifestContainer.TryGetValue(key, out var existingEdo);
            paymentVerifiedAt.TryGetValue(manifest.Id, out var verifiedAt);

            var row = new EdoGenerationContainerDto(
                container.Id,
                container.ContainerNumber,
                container.ContainerSize?.Name,
                container.ContainerType?.Name,
                manifest.Id,
                manifest.ManifestNumber,
                manifest.Broker?.FullName,
                manifest.Consignee is Consignee consignee ? consignee.BusinessName : manifest.Consignee?.FullName,
                manifest.ShippingLine?.BrandName,
                verifiedAt,
                existingEdo is not null,
                existingEdo?.Id,
                existingEdo?.EdoNumber,
                existingEdo?.Status.ToString(),
                existingEdo?.GeneratedAt,
                existingEdo?.ExpiresAt);

            if (existingEdo is null)
            {
                pendingRows.Add(row);
            }
            else
            {
                generatedRows.Add(row);
            }
        }

        var pendingGroups = pendingRows
            .GroupBy(r => r.ManifestId)
            .Select(g =>
            {
                var first = g.First();
                var manifestId = g.Key;
                manifestContainerCounts.TryGetValue(manifestId, out var totalInManifest);
                manifestEdoCounts.TryGetValue(manifestId, out var edoCount);
                return new EdoGenerationGroupDto(
                    manifestId,
                    first.ManifestNumber,
                    first.BrokerName ?? "N/A",
                    first.ConsigneeName ?? "N/A",
                    first.ShippingLineName,
                    g.Count(),
                    edoCount,
                    totalInManifest,
                    g.OrderBy(x => x.ContainerNumber).ToList());
            })
            .OrderBy(g => g.ManifestNumber)
            .ToList();

        generatedRows = generatedRows
            .OrderByDescending(r => r.EdoGeneratedAt)
            .ThenBy(r => r.ContainerNumber)
            .ToList();

        var totalEligible = pendingRows.Count + generatedRows.Count;
        return new EdoGenerationQueueDto(
            pendingGroups,
            generatedRows,
            totalEligible,
            pendingRows.Count,
            generatedRows.Count);
    }

    public async Task<EdoDto> ReleaseAsync(Guid id, ReleaseEdoRequest request, Guid actorId, string actorRole, CancellationToken ct = default)
    {
        EnsureRole(actorRole, AppRoles.SlStaff, AppRoles.SystemAdmin, AppRoles.ShippingLinesAdmin, AppRoles.TerminalTeam);
        var edo = await _db.ElectronicDeliveryOrders.Include(x => x.Manifest).FirstOrDefaultAsync(x => x.Id == id, ct)
                  ?? throw new KeyNotFoundException("eDO/CRO not found.");

        if (actorRole == AppRoles.SlStaff)
        {
            var staffLineId = await _db.UserShippingLinePreferences.AsNoTracking()
                .Where(x => x.UserId == actorId)
                .Select(x => x.LastSelectedShippingLineId)
                .FirstOrDefaultAsync(ct);
            if (staffLineId.HasValue && edo.ShippingLineId != staffLineId.Value)
            {
                throw new UnauthorizedAccessException("This eDO belongs to another shipping line.");
            }
        }

        if (edo.Status == EdoStatus.PendingValidation)
        {
            var paid = await _db.EdoPayments.AnyAsync(x => x.EdoId == edo.Id && x.Status == PaymentStatus.Verified, ct);
            if (!paid && request.Approve)
            {
                throw new InvalidOperationException("eDO/CRO payment must be verified before release.");
            }
        }

        if (edo.Status is not (EdoStatus.PendingRelease or EdoStatus.PendingValidation))
        {
            throw new InvalidOperationException($"Cannot release from status {edo.Status}.");
        }

        var from = edo.Status;
        if (request.Approve)
        {
            edo.Status = EdoStatus.Released;
            edo.ReleasedAt = DateTime.UtcNow;
            edo.ReleasedById = actorId;

            var version = await _db.EdoVersions.FirstOrDefaultAsync(x => x.EdoId == edo.Id && x.IsCurrent, ct);
            if (version is not null) version.Status = EdoStatus.Released;

            var manifest = await _db.Manifests
                .Include(x => x.Broker)
                .Include(x => x.Consignee)
                .Include(x => x.ShippingLine)
                .FirstAsync(x => x.Id == edo.ManifestId, ct);
            await ApplyEdoPdfAsync(edo, manifest, actorId, ct);
            if (version is not null) version.PdfPath = edo.PdfPath;

            if (edo.Manifest.WorkflowState == WorkflowState.EdoGenerated)
            {
                var mf = edo.Manifest.WorkflowState;
                edo.Manifest.WorkflowState = WorkflowState.EdoReleased;
                _db.WorkflowStateHistories.Add(new WorkflowStateHistory
                {
                    ManifestId = edo.ManifestId,
                    FromState = mf,
                    ToState = WorkflowState.EdoReleased,
                    ActorId = actorId,
                    ActorRole = actorRole,
                    TransitionReason = "eDO/CRO released"
                });
            }
        }
        else
        {
            if (string.IsNullOrWhiteSpace(request.RejectionReason))
            {
                throw new InvalidOperationException("Rejection reason is required.");
            }

            edo.Status = EdoStatus.Rejected;
            edo.RejectionReason = request.RejectionReason;
        }

        _db.EdoReleaseHistories.Add(new EdoReleaseHistory
        {
            EdoId = edo.Id,
            FromStatus = from,
            ToStatus = edo.Status,
            ActorId = actorId,
            RejectionReason = request.RejectionReason
        });

        await _db.SaveChangesAsync(ct);
        await _activity.LogAsync(actorId, request.Approve ? "edo.release" : "edo.reject", nameof(ElectronicDeliveryOrder), edo.Id, edo.EdoNumber, ct);
        return Map(edo, edo.Manifest.ManifestNumber);
    }

    public async Task<bool> TryAutoReleasePreForecastRenewalAsync(Guid edoId, Guid actorId, CancellationToken ct = default)
    {
        var isPreForecastRenewal = await _db.TruckerPreForecastSubmissions
            .AsNoTracking()
            .AnyAsync(x => x.NewEdoId == edoId, ct);
        if (!isPreForecastRenewal)
        {
            return false;
        }

        var edo = await _db.ElectronicDeliveryOrders
            .Include(x => x.Manifest)
            .FirstOrDefaultAsync(x => x.Id == edoId, ct);
        if (edo is null || edo.Status != EdoStatus.PendingRelease)
        {
            return false;
        }

        var paid = await _db.EdoPayments.AnyAsync(
            x => x.EdoId == edoId && x.Status == PaymentStatus.Verified,
            ct);
        if (!paid)
        {
            return false;
        }

        // Pre-forecast auto-release is triggered by trucker/accounting; PDF signatory must stay shipping-line staff.
        var signatoryId = edo.GeneratedById;
        var triggerActorId = actorId == Guid.Empty ? signatoryId : actorId;
        var from = edo.Status;
        edo.Status = EdoStatus.Released;
        edo.ReleasedAt = DateTime.UtcNow;
        edo.ReleasedById = signatoryId;

        var version = await _db.EdoVersions.FirstOrDefaultAsync(x => x.EdoId == edo.Id && x.IsCurrent, ct);
        if (version is not null)
        {
            version.Status = EdoStatus.Released;
        }

        var manifest = await _db.Manifests
            .Include(x => x.Broker)
            .Include(x => x.Consignee)
            .Include(x => x.ShippingLine)
            .FirstAsync(x => x.Id == edo.ManifestId, ct);
        await ApplyEdoPdfAsync(edo, manifest, signatoryId, ct);
        if (version is not null)
        {
            version.PdfPath = edo.PdfPath;
        }

        if (edo.Manifest.WorkflowState == WorkflowState.EdoGenerated)
        {
            var mf = edo.Manifest.WorkflowState;
            edo.Manifest.WorkflowState = WorkflowState.EdoReleased;
            _db.WorkflowStateHistories.Add(new WorkflowStateHistory
            {
                ManifestId = edo.ManifestId,
                FromState = mf,
                ToState = WorkflowState.EdoReleased,
                ActorId = triggerActorId,
                ActorRole = AppRoles.SystemAdmin,
                TransitionReason = "Pre-forecast renewed eDO auto-released after pay-to-open validation"
            });
        }

        _db.EdoReleaseHistories.Add(new EdoReleaseHistory
        {
            EdoId = edo.Id,
            FromStatus = from,
            ToStatus = edo.Status,
            ActorId = triggerActorId,
            RejectionReason = "Auto-released after pre-forecast pay-to-open validation"
        });

        await _db.SaveChangesAsync(ct);
        await _activity.LogAsync(
            triggerActorId,
            "edo.auto_release_pre_forecast",
            nameof(ElectronicDeliveryOrder),
            edo.Id,
            edo.EdoNumber,
            ct);
        return true;
    }

    public async Task EnsureEdoPdfSignatoryAsync(Guid edoId, CancellationToken ct = default)
    {
        var edo = await _db.ElectronicDeliveryOrders
            .FirstOrDefaultAsync(x => x.Id == edoId, ct);
        if (edo is null || edo.Status != EdoStatus.Released)
        {
            return;
        }

        var needsRepair = !edo.ReleasedById.HasValue;
        if (!needsRepair && edo.ReleasedById.HasValue)
        {
            var releasedByRole = await _db.Users.AsNoTracking()
                .Where(x => x.Id == edo.ReleasedById.Value)
                .Select(x => x.Role)
                .FirstOrDefaultAsync(ct);
            needsRepair = !IsShippingLineSignatory(releasedByRole);
        }

        if (!needsRepair)
        {
            return;
        }

        edo.ReleasedById = edo.GeneratedById;
        var manifest = await _db.Manifests
            .Include(x => x.Broker)
            .Include(x => x.Consignee)
            .Include(x => x.ShippingLine)
            .FirstAsync(x => x.Id == edo.ManifestId, ct);
        await ApplyEdoPdfAsync(edo, manifest, edo.GeneratedById, ct);

        var version = await _db.EdoVersions.FirstOrDefaultAsync(x => x.EdoId == edo.Id && x.IsCurrent, ct);
        if (version is not null)
        {
            version.PdfPath = edo.PdfPath;
        }

        await _db.SaveChangesAsync(ct);
    }

    public async Task<EdoDto> RegeneratePdfAsync(Guid id, Guid actorId, string actorRole, CancellationToken ct = default)
    {
        EnsureRole(actorRole, AppRoles.SlStaff, AppRoles.ShippingLinesAdmin, AppRoles.SystemAdmin);
        var edo = await _db.ElectronicDeliveryOrders.FirstOrDefaultAsync(x => x.Id == id, ct)
                  ?? throw new KeyNotFoundException("eDO/CRO not found.");

        if (actorRole == AppRoles.SlStaff)
        {
            var staffLineId = await _db.UserShippingLinePreferences.AsNoTracking()
                .Where(x => x.UserId == actorId)
                .Select(x => x.LastSelectedShippingLineId)
                .FirstOrDefaultAsync(ct);
            if (staffLineId.HasValue && edo.ShippingLineId != staffLineId.Value)
            {
                throw new UnauthorizedAccessException("This eDO belongs to another shipping line.");
            }
        }

        var manifest = await _db.Manifests
            .Include(x => x.Broker)
            .Include(x => x.Consignee)
            .Include(x => x.ShippingLine)
            .FirstAsync(x => x.Id == edo.ManifestId, ct);

        await ApplyEdoPdfAsync(edo, manifest, actorId, ct);

        var version = await _db.EdoVersions.FirstOrDefaultAsync(x => x.EdoId == edo.Id && x.IsCurrent, ct);
        if (version is not null)
        {
            version.PdfPath = edo.PdfPath;
        }

        await _db.SaveChangesAsync(ct);
        await _activity.LogAsync(actorId, "edo.regenerate_pdf", nameof(ElectronicDeliveryOrder), edo.Id, edo.EdoNumber, ct);
        return Map(edo, manifest.ManifestNumber);
    }

    public async Task<IReadOnlyList<EdoDto>> RegeneratePdfByContainersAsync(
        IReadOnlyList<string> containerNumbers,
        Guid actorId,
        string actorRole,
        CancellationToken ct = default)
    {
        if (containerNumbers.Count == 0)
        {
            throw new InvalidOperationException("At least one container number is required.");
        }

        var normalized = containerNumbers
            .Select(x => x.Trim())
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        var edos = await _db.ElectronicDeliveryOrders.AsNoTracking()
            .Where(x => x.ContainerNumber != null && normalized.Contains(x.ContainerNumber))
            .OrderByDescending(x => x.GeneratedAt)
            .ToListAsync(ct);

        var latestByContainer = edos
            .GroupBy(x => x.ContainerNumber!, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(g => g.Key, g => g.First().Id, StringComparer.OrdinalIgnoreCase);

        var missing = normalized.Where(n => !latestByContainer.ContainsKey(n)).ToList();
        if (missing.Count > 0)
        {
            throw new KeyNotFoundException($"No eDO/CRO found for container(s): {string.Join(", ", missing)}");
        }

        var results = new List<EdoDto>();
        foreach (var container in normalized)
        {
            results.Add(await RegeneratePdfAsync(latestByContainer[container], actorId, actorRole, ct));
        }

        return results;
    }

    public async Task<EdoDto> UnlockAsync(Guid id, UnlockEdoRequest request, Guid actorId, string actorRole, CancellationToken ct = default)
    {
        EnsureRole(actorRole, AppRoles.SystemAdmin, AppRoles.ShippingLinesAdmin);
        var edo = await _db.ElectronicDeliveryOrders.Include(x => x.Manifest).FirstOrDefaultAsync(x => x.Id == id, ct)
                  ?? throw new KeyNotFoundException("eDO/CRO not found.");
        if (edo.Status is not (EdoStatus.Locked or EdoStatus.Expired))
        {
            throw new InvalidOperationException("Only locked/expired eDO/CRO can be unlocked.");
        }

        var from = edo.Status;
        edo.Status = EdoStatus.Active;
        edo.ExpiresAt = request.NewExpiresAt ?? DateTime.UtcNow.AddDays(7);
        edo.AdditionalNotes = string.IsNullOrWhiteSpace(request.Notes)
            ? edo.AdditionalNotes
            : $"{edo.AdditionalNotes}\nUnlock: {request.Notes}".Trim();

        _db.EdoReleaseHistories.Add(new EdoReleaseHistory
        {
            EdoId = edo.Id,
            FromStatus = from,
            ToStatus = EdoStatus.Active,
            ActorId = actorId,
            RejectionReason = request.Notes
        });

        await _db.SaveChangesAsync(ct);
        await _activity.LogAsync(actorId, "edo.unlock", nameof(ElectronicDeliveryOrder), edo.Id, edo.EdoNumber, ct);
        return Map(edo, edo.Manifest.ManifestNumber);
    }

    public async Task<int> ProcessExpirationsAsync(CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var items = await _db.ElectronicDeliveryOrders
            .Where(x => x.ExpiresAt != null && x.ExpiresAt < now &&
                        (x.Status == EdoStatus.Released || x.Status == EdoStatus.Active || x.Status == EdoStatus.PendingRelease))
            .ToListAsync(ct);

        foreach (var edo in items)
        {
            var from = edo.Status;
            edo.Status = EdoStatus.Expired;
            _db.EdoReleaseHistories.Add(new EdoReleaseHistory
            {
                EdoId = edo.Id,
                FromStatus = from,
                ToStatus = EdoStatus.Expired,
                ActorId = edo.GeneratedById,
                RejectionReason = "Automatic expiration"
            });
        }

        if (items.Count > 0)
        {
            await _db.SaveChangesAsync(ct);
        }

        return items.Count;
    }

    private async Task<ElectronicDeliveryOrder> BuildEdoAsync(
        Manifest manifest,
        string? containerNumber,
        DateTime? expiresAt,
        string? cyLocation,
        string? notes,
        Guid actorId,
        bool requirePayment,
        CancellationToken ct)
    {
        var fee = await _fees.GetActiveAsync("edo", ct);
        var token = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
        var container = string.IsNullOrWhiteSpace(containerNumber) ? "GENERAL" : containerNumber.Trim();
        var edoNumber = $"EDO-{DateTime.UtcNow:yyyyMMdd}-{container}-{Random.Shared.Next(100, 999)}";

        var edo = new ElectronicDeliveryOrder
        {
            EdoNumber = edoNumber,
            ManifestId = manifest.Id,
            ShippingLineId = manifest.ShippingLineId,
            ContainerNumber = container,
            FeeAmount = fee.Amount,
            Status = requirePayment ? EdoStatus.PendingValidation : EdoStatus.PendingRelease,
            GeneratedById = actorId,
            GeneratedAt = DateTime.UtcNow,
            ExpiresAt = expiresAt ?? DateTime.UtcNow.AddDays(14),
            CyLocation = cyLocation,
            AdditionalNotes = notes,
            VerificationToken = token,
            Version = 1
        };

        await ApplyEdoPdfAsync(edo, manifest, actorId, ct);

        edo.Versions.Add(new EdoVersion
        {
            VersionNumber = 1,
            PdfPath = edo.PdfPath,
            EdoNumber = edoNumber,
            Status = edo.Status,
            CreatedById = actorId,
            ExpiresAt = edo.ExpiresAt,
            CyLocation = cyLocation,
            IsCurrent = true
        });

        _db.DocumentVerifications.Add(new DocumentVerification
        {
            VerificationToken = token,
            DocumentType = "EDO",
            SubjectType = nameof(ElectronicDeliveryOrder),
            SubjectId = edo.Id,
            DocumentNumber = edoNumber,
            SummaryJson = JsonSerializer.Serialize(new
            {
                edo.EdoNumber,
                manifest.ManifestNumber,
                container,
                Status = edo.Status.ToString(),
                edo.ExpiresAt
            })
        });

        return edo;
    }

    private static bool IsShippingLineSignatory(string? role) =>
        role is AppRoles.SlStaff or AppRoles.ShippingLinesAdmin or AppRoles.Evaluator or AppRoles.SystemAdmin;

    private async Task<User?> ResolveEdoAuthorizedByAsync(ElectronicDeliveryOrder edo, CancellationToken ct)
    {
        async Task<User?> LoadIfSignatory(Guid userId)
        {
            var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(x => x.Id == userId, ct);
            return user is not null && IsShippingLineSignatory(user.Role) ? user : null;
        }

        if (edo.ReleasedById.HasValue)
        {
            var fromReleased = await LoadIfSignatory(edo.ReleasedById.Value);
            if (fromReleased is not null)
            {
                return fromReleased;
            }
        }

        var fromGenerated = await LoadIfSignatory(edo.GeneratedById);
        if (fromGenerated is not null)
        {
            return fromGenerated;
        }

        var evaluator = await (
            from pref in _db.UserShippingLinePreferences.AsNoTracking()
            join user in _db.Users.AsNoTracking() on pref.UserId equals user.Id
            where pref.LastSelectedShippingLineId == edo.ShippingLineId
                  && user.Role == AppRoles.Evaluator
            select user
        ).FirstOrDefaultAsync(ct);
        if (evaluator is not null)
        {
            return evaluator;
        }

        var slStaff = await (
            from pref in _db.UserShippingLinePreferences.AsNoTracking()
            join user in _db.Users.AsNoTracking() on pref.UserId equals user.Id
            where pref.LastSelectedShippingLineId == edo.ShippingLineId
                  && user.Role == AppRoles.SlStaff
            select user
        ).FirstOrDefaultAsync(ct);
        if (slStaff is not null)
        {
            return slStaff;
        }

        return await _db.Users.AsNoTracking()
            .FirstOrDefaultAsync(
                x => x.ManagedShippingLineId == edo.ShippingLineId && x.Role == AppRoles.ShippingLinesAdmin,
                ct);
    }

    private async Task ApplyEdoPdfAsync(
        ElectronicDeliveryOrder edo,
        Manifest manifest,
        Guid actorId,
        CancellationToken ct)
    {
        var shippingLine = manifest.ShippingLine
            ?? await _db.ShippingLines.AsNoTracking().FirstAsync(x => x.Id == manifest.ShippingLineId, ct);

        var preparedBy = await _db.Users.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == edo.GeneratedById, ct);
        var authorizedBy = await ResolveEdoAuthorizedByAsync(edo, ct);

        Container? container = null;
        if (!string.IsNullOrWhiteSpace(edo.ContainerNumber) && !string.Equals(edo.ContainerNumber, "GENERAL", StringComparison.OrdinalIgnoreCase))
        {
            container = await _db.Containers.AsNoTracking()
                .Include(c => c.ContainerSize)
                .Include(c => c.ContainerType)
                .Where(c => c.ContainerNumber == edo.ContainerNumber && c.ManifestId == manifest.Id)
                .FirstOrDefaultAsync(ct);
        }

        var token = edo.VerificationToken
            ?? throw new InvalidOperationException("Missing verification token.");
        var verifyUrl = $"{_appSettings.TrimmedPublicUrl}/verify/document/{token}";
        var qrPayload = $"/verify/document/{token}";
        var qrBytes = _qr.CreatePngBytes(verifyUrl);
        var qrPath = _qr.CreatePngFile("edo-qr", verifyUrl);
        var logoPath = EdoCroPdfBuilder.ResolveLogoPath(_uploads, shippingLine);
        var pdfData = EdoCroPdfBuilder.Build(edo, manifest, shippingLine, container, preparedBy, authorizedBy, qrBytes, logoPath);
        var pdfBytes = EdoCroPdfRenderer.Render(pdfData);
        var pdfPath = _docs.SavePdfBytes("edo", $"CRO-{edo.EdoNumber}.pdf", pdfBytes);

        edo.PdfPath = pdfPath;
        edo.QrImagePath = qrPath;
        edo.QrPayload = qrPayload;
    }

    private static void EnsureRole(string actual, params string[] allowed)
    {
        if (!allowed.Contains(actual))
        {
            throw new UnauthorizedAccessException($"Role {actual} cannot perform this action.");
        }
    }

    private static EdoDto Map(
        ElectronicDeliveryOrder x,
        string manifestNumber,
        EdoPayment? latestPayment = null,
        Guid? preForecastSubmissionId = null,
        string? renewalPayorRole = null)
    {
        var (isRenewed, renewedFrom) = ParseRenewedMeta(x.AdditionalNotes);
        return new(x.Id, x.EdoNumber, x.ManifestId, manifestNumber, x.ShippingLineId, x.ContainerNumber, x.Status.ToString(),
            x.FeeAmount, x.PdfPath, x.QrImagePath, x.VerificationToken, x.GeneratedAt, x.ReleasedAt, x.ExpiresAt,
            x.CyLocation, x.RejectionReason, x.Version,
            latestPayment?.Status.ToString(),
            latestPayment?.CreatedAt,
            x.ReleasedBy?.FullName,
            latestPayment?.ValidatedAt,
            latestPayment?.ValidatedBy?.FullName,
            isRenewed,
            renewedFrom,
            preForecastSubmissionId,
            renewalPayorRole);
    }

    private static (bool IsRenewed, string? RenewedFromEdoNumber) ParseRenewedMeta(string? notes)
    {
        if (string.IsNullOrWhiteSpace(notes))
        {
            return (false, null);
        }

        const string prefix = "Renewed from ";
        if (!notes.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
        {
            return (false, null);
        }

        var firstLine = notes[prefix.Length..].Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .FirstOrDefault();
        return (true, string.IsNullOrWhiteSpace(firstLine) ? null : firstLine);
    }

    private async Task<EdoPayment?> GetLatestPaymentAsync(Guid edoId, CancellationToken ct) =>
        await _db.EdoPayments.AsNoTracking()
            .Where(p => p.EdoId == edoId)
            .OrderByDescending(p => p.CreatedAt)
            .FirstOrDefaultAsync(ct);

    private async Task<Dictionary<Guid, EdoPayment>> LoadLatestPaymentsAsync(IReadOnlyList<Guid> edoIds, CancellationToken ct)
    {
        if (edoIds.Count == 0)
        {
            return new Dictionary<Guid, EdoPayment>();
        }

        var payments = await _db.EdoPayments.AsNoTracking()
            .Where(p => p.EdoId != null && edoIds.Contains(p.EdoId.Value))
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync(ct);

        return payments
            .Where(p => p.EdoId.HasValue)
            .GroupBy(p => p.EdoId!.Value)
            .ToDictionary(g => g.Key, g => g.First());
    }

    private static GenerationSessionDto MapSession(GenerationSession x) =>
        new(x.Id, x.SessionId, x.ManifestId, x.Status.ToString(), x.TotalItems, x.CompletedItems, x.FailedItems,
            x.CurrentItem, x.StartedAt, x.CompletedAt);
}

public class EdoPaymentService : IEdoPaymentService
{
    private readonly OptimusDbContext _db;
    private readonly IDocumentStore _docs;
    private readonly IActivityLogService _activity;
    private readonly IPaymentFeeService _fees;
    private readonly IEdoService _edoService;

    public EdoPaymentService(
        OptimusDbContext db,
        IDocumentStore docs,
        IActivityLogService activity,
        IPaymentFeeService fees,
        IEdoService edoService)
    {
        _db = db;
        _docs = docs;
        _activity = activity;
        _fees = fees;
        _edoService = edoService;
    }

    public async Task<EdoPaymentDto> SubmitAsync(Guid edoId, SubmitEdoPaymentRequest request, string? receiptPath, Guid actorId, string actorRole, CancellationToken ct = default)
    {
        var edo = await _db.ElectronicDeliveryOrders.Include(x => x.Manifest).FirstOrDefaultAsync(x => x.Id == edoId, ct)
                  ?? throw new KeyNotFoundException("eDO/CRO not found.");

        var preForecastSubmission = await _db.TruckerPreForecastSubmissions
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.NewEdoId == edoId, ct);

        if (actorRole == AppRoles.Trucker)
        {
            if (preForecastSubmission is null || preForecastSubmission.TruckerId != actorId)
            {
                throw new UnauthorizedAccessException("Only the trucker who submitted this pre-forecast can pay to open the renewed eDO.");
            }
        }
        else if (actorRole is not (AppRoles.Broker or AppRoles.Consignee or AppRoles.SystemAdmin))
        {
            throw new UnauthorizedAccessException("Only broker, consignee, or the assigned trucker can submit eDO payments.");
        }
        else if (preForecastSubmission is not null)
        {
            throw new InvalidOperationException("This renewed eDO must be paid by the trucker who submitted the pre-forecast.");
        }

        if (actorRole == AppRoles.Broker && edo.Manifest.BrokerId != actorId)
        {
            throw new UnauthorizedAccessException("Broker is not assigned to this eDO/CRO.");
        }

        if (actorRole == AppRoles.Consignee && edo.Manifest.ConsigneeId != actorId)
        {
            throw new UnauthorizedAccessException("Consignee is not assigned to this eDO/CRO.");
        }

        if (edo.Status is not (EdoStatus.PendingValidation or EdoStatus.PendingRelease))
        {
            throw new InvalidOperationException("eDO/CRO is not awaiting payment.");
        }

        var hasPendingPayment = await _db.EdoPayments.AnyAsync(
            x => x.EdoId == edo.Id && x.Status == PaymentStatus.PendingValidation,
            ct);
        if (hasPendingPayment)
        {
            throw new InvalidOperationException("Payment has already been submitted and is awaiting validation.");
        }

        if (string.IsNullOrWhiteSpace(receiptPath))
        {
            throw new InvalidOperationException("Payment receipt is required.");
        }

        var fee = await _fees.GetActiveAsync("edo", ct);
        var amount = fee.Amount;
        if (request.Amount > 0 && Math.Abs(request.Amount - amount) > 0.01m)
        {
            throw new InvalidOperationException($"Payment amount must match the active eDO fee ({amount:N2} {request.Currency ?? "PHP"}).");
        }
        var payment = new EdoPayment
        {
            ManifestId = edo.ManifestId,
            EdoId = edo.Id,
            ShippingLineId = edo.ShippingLineId,
            Amount = amount,
            Currency = string.IsNullOrWhiteSpace(request.Currency) ? "PHP" : request.Currency.ToUpperInvariant(),
            ReceiptFilePath = receiptPath,
            Status = PaymentStatus.PendingValidation,
            SubmittedById = actorId
        };
        edo.Status = EdoStatus.PendingValidation;
        edo.FeeAmount = amount;
        _db.EdoPayments.Add(payment);
        await _db.SaveChangesAsync(ct);
        await _activity.LogAsync(actorId, "edo_payment.submit", nameof(EdoPayment), payment.Id, $"{amount}", ct);
        return Map(payment, edo.EdoNumber);
    }

    public async Task<EdoPaymentDto> GetAsync(Guid paymentId, CancellationToken ct = default)
    {
        var payment = await _db.EdoPayments.AsNoTracking()
            .Include(x => x.Edo)
            .Include(x => x.Manifest)
            .Include(x => x.SubmittedBy)
            .Include(x => x.ValidatedBy)
            .FirstOrDefaultAsync(x => x.Id == paymentId, ct)
            ?? throw new KeyNotFoundException("eDO payment not found.");
        return MapDetailed(payment);
    }

    public async Task<EdoPaymentDto> ValidateAsync(Guid paymentId, ValidateEdoPaymentRequest request, Guid actorId, string actorRole, CancellationToken ct = default)
    {
        if (actorRole is not (AppRoles.SystemAdmin or AppRoles.Accounting))
        {
            throw new UnauthorizedAccessException("Accounting or platform admin required to validate eDO payments.");
        }

        var payment = await _db.EdoPayments
            .Include(x => x.Edo)
            .Include(x => x.Manifest)
            .Include(x => x.SubmittedBy)
            .FirstOrDefaultAsync(x => x.Id == paymentId, ct)
                      ?? throw new KeyNotFoundException("eDO payment not found.");
        if (payment.Status != PaymentStatus.PendingValidation)
        {
            throw new InvalidOperationException("Payment is not pending.");
        }

        if (request.Approve)
        {
            if (string.IsNullOrWhiteSpace(payment.ReceiptFilePath))
            {
                throw new InvalidOperationException("Cannot verify payment without a receipt file.");
            }

            payment.Status = PaymentStatus.Verified;
            payment.ValidatedAt = DateTime.UtcNow;
            payment.ValidatedById = actorId;
            payment.OfficialReceiptPath = _docs.CreatePlaceholderPdf("receipts", $"EDO-OR {payment.Id:N}",
                $"Amount={payment.Amount} {payment.Currency}");
            if (payment.Edo is not null)
            {
                payment.Edo.Status = EdoStatus.PendingRelease;
            }
        }
        else
        {
            if (string.IsNullOrWhiteSpace(request.RejectionReason))
            {
                throw new InvalidOperationException("Rejection reason required.");
            }

            payment.Status = PaymentStatus.Rejected;
            payment.RejectionReason = request.RejectionReason;
            payment.ValidatedAt = DateTime.UtcNow;
            payment.ValidatedById = actorId;
        }

        await _db.SaveChangesAsync(ct);
        if (request.Approve && payment.EdoId.HasValue)
        {
            var submission = await _db.TruckerPreForecastSubmissions
                .FirstOrDefaultAsync(
                    x => x.NewEdoId == payment.EdoId &&
                         x.Status == TruckerPreForecastStatus.AwaitingRenewalPayment,
                    ct);
            if (submission is not null)
            {
                submission.Status = TruckerPreForecastStatus.Completed;
            }

            await _db.SaveChangesAsync(ct);

            if (payment.EdoId.HasValue)
            {
                await _edoService.TryAutoReleasePreForecastRenewalAsync(payment.EdoId.Value, actorId, ct);
            }
        }

        await _activity.LogAsync(actorId, request.Approve ? "edo_payment.verify" : "edo_payment.reject", nameof(EdoPayment), payment.Id, request.RejectionReason, ct);
        return MapDetailed(payment);
    }

    public async Task<EdoPaymentDto> SaveReceiptInsightsAsync(
        Guid paymentId,
        SaveEdoPaymentReceiptInsightsRequest request,
        Guid actorId,
        string actorRole,
        CancellationToken ct = default)
    {
        if (actorRole is not AppRoles.SystemAdmin)
        {
            throw new UnauthorizedAccessException("Only the platform admin can save eDO payment receipt insights.");
        }

        var payment = await _db.EdoPayments
            .Include(x => x.Edo)
            .Include(x => x.Manifest)
            .Include(x => x.SubmittedBy)
            .Include(x => x.ValidatedBy)
            .FirstOrDefaultAsync(x => x.Id == paymentId, ct)
            ?? throw new KeyNotFoundException("eDO payment not found.");

        payment.PaymentChannel = NormalizeReceiptField(request.PaymentChannel, 50);
        payment.PaymentReference = NormalizeReceiptField(request.PaymentReference, 100);
        payment.QrphNumber = NormalizeReceiptField(request.QrphNumber, 100);
        payment.TransactionAt = request.TransactionAt;

        await _db.SaveChangesAsync(ct);
        await _activity.LogAsync(actorId, "edo_payment.receipt_insights", nameof(EdoPayment), payment.Id, payment.PaymentReference, ct);
        return MapDetailed(payment);
    }

    private static string? NormalizeReceiptField(string? value, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        var trimmed = value.Trim();
        return trimmed.Length <= maxLength ? trimmed : trimmed[..maxLength];
    }

    public async Task<IReadOnlyList<EdoPaymentDto>> ListPendingAsync(CancellationToken ct = default)
    {
        var items = await _db.EdoPayments.AsNoTracking()
            .Include(x => x.Edo)
            .Include(x => x.Manifest)
            .Include(x => x.SubmittedBy)
            .Where(x => x.Status == PaymentStatus.PendingValidation)
            .OrderBy(x => x.CreatedAt)
            .ToListAsync(ct);
        return items.Select(MapDetailed).ToList();
    }

    public async Task<IReadOnlyList<EdoPaymentDto>> ListReviewedAsync(CancellationToken ct = default)
    {
        var reviewed = new[] { PaymentStatus.Verified, PaymentStatus.Rejected };
        var items = await _db.EdoPayments.AsNoTracking()
            .Include(x => x.Edo)
            .Include(x => x.Manifest)
            .Include(x => x.SubmittedBy)
            .Include(x => x.ValidatedBy)
            .Where(x => reviewed.Contains(x.Status) && x.ValidatedAt != null)
            .OrderByDescending(x => x.ValidatedAt)
            .Take(200)
            .ToListAsync(ct);
        return items.Select(MapDetailed).ToList();
    }

    public async Task<EdoRevenueReportDto> GetRevenueReportAsync(DateOnly? from, DateOnly? to, CancellationToken ct = default)
    {
        var toDate = to ?? DateOnly.FromDateTime(DateTime.UtcNow);
        var fromDate = from ?? toDate.AddDays(-29);
        if (fromDate > toDate)
        {
            (fromDate, toDate) = (toDate, fromDate);
        }

        var fromUtc = DateTime.SpecifyKind(fromDate.ToDateTime(TimeOnly.MinValue), DateTimeKind.Utc);
        var toUtc = DateTime.SpecifyKind(toDate.ToDateTime(new TimeOnly(23, 59, 59)), DateTimeKind.Utc);

        async Task<EdoRevenueBucketDto> BucketAsync(
            PaymentStatus? status,
            bool useValidatedAt,
            bool periodOnly)
        {
            var query = _db.EdoPayments.AsNoTracking().AsQueryable();
            if (status.HasValue)
            {
                query = query.Where(x => x.Status == status.Value);
            }

            if (periodOnly)
            {
                query = useValidatedAt
                    ? query.Where(x => x.ValidatedAt >= fromUtc && x.ValidatedAt <= toUtc)
                    : query.Where(x => x.CreatedAt >= fromUtc && x.CreatedAt <= toUtc);
            }

            var count = await query.CountAsync(ct);
            var amount = count == 0 ? 0m : await query.SumAsync(x => x.Amount, ct);
            return new EdoRevenueBucketDto(amount, count);
        }

        var verified = await BucketAsync(PaymentStatus.Verified, useValidatedAt: true, periodOnly: true);
        var pending = await BucketAsync(PaymentStatus.PendingValidation, useValidatedAt: false, periodOnly: true);
        var rejected = await BucketAsync(PaymentStatus.Rejected, useValidatedAt: true, periodOnly: true);
        var lifetime = await BucketAsync(PaymentStatus.Verified, useValidatedAt: false, periodOnly: false);

        var verifiedInPeriod = await _db.EdoPayments.AsNoTracking()
            .Include(x => x.ShippingLine)
            .Include(x => x.Edo)
            .Include(x => x.Manifest)
            .Include(x => x.SubmittedBy)
            .Include(x => x.ValidatedBy)
            .Where(x => x.Status == PaymentStatus.Verified
                        && x.ValidatedAt >= fromUtc
                        && x.ValidatedAt <= toUtc)
            .OrderByDescending(x => x.ValidatedAt)
            .ToListAsync(ct);

        var dailyRevenue = verifiedInPeriod
            .GroupBy(x => DateOnly.FromDateTime(x.ValidatedAt!.Value).ToString("yyyy-MM-dd"))
            .OrderBy(x => x.Key)
            .Select(g => new EdoRevenueDailyDto(g.Key, g.Sum(p => p.Amount), g.Count()))
            .ToList();

        var byShippingLine = verifiedInPeriod
            .GroupBy(x => new { x.ShippingLineId, x.ShippingLine.BrandName })
            .OrderByDescending(g => g.Sum(p => p.Amount))
            .Select(g => new EdoRevenueByLineDto(
                g.Key.ShippingLineId,
                g.Key.BrandName,
                g.Sum(p => p.Amount),
                g.Count()))
            .ToList();

        var recentVerified = verifiedInPeriod
            .Take(50)
            .Select(x => new EdoRevenuePaymentRowDto(
                x.Id,
                x.Edo?.EdoNumber,
                x.Manifest?.ManifestNumber,
                x.ShippingLine.BrandName,
                x.SubmittedBy?.FullName,
                x.ValidatedBy?.FullName,
                x.Amount,
                x.Currency,
                x.Status.ToString(),
                x.CreatedAt,
                x.ValidatedAt))
            .ToList();

        return new EdoRevenueReportDto(
            fromDate.ToString("yyyy-MM-dd"),
            toDate.ToString("yyyy-MM-dd"),
            verified,
            pending,
            rejected,
            lifetime,
            dailyRevenue,
            byShippingLine,
            recentVerified);
    }

    private static EdoPaymentDto MapDetailed(EdoPayment x) =>
        new(
            x.Id,
            x.ManifestId,
            x.EdoId,
            x.Edo?.EdoNumber,
            x.Amount,
            x.Currency,
            x.Status.ToString(),
            x.ReceiptFilePath,
            x.OfficialReceiptPath,
            x.RejectionReason,
            x.CreatedAt,
            x.Manifest?.ManifestNumber,
            x.Edo?.ContainerNumber,
            x.Edo?.Status.ToString(),
            x.SubmittedBy?.FullName,
            x.ValidatedAt,
            x.ValidatedBy?.FullName,
            x.PaymentChannel,
            x.PaymentReference,
            x.QrphNumber,
            x.TransactionAt);

    private static EdoPaymentDto Map(EdoPayment x, string? edoNumber) =>
        new(x.Id, x.ManifestId, x.EdoId, edoNumber, x.Amount, x.Currency, x.Status.ToString(),
            x.ReceiptFilePath, x.OfficialReceiptPath, x.RejectionReason, x.CreatedAt,
            PaymentChannel: x.PaymentChannel,
            PaymentReference: x.PaymentReference,
            QrphNumber: x.QrphNumber,
            TransactionAt: x.TransactionAt);
}

public class EdoRenewalService : IEdoRenewalService
{
    private readonly OptimusDbContext _db;
    private readonly IEdoService _edoService;
    private readonly IActivityLogService _activity;
    private readonly IDocumentStore _docs;
    private readonly IPaymentFeeService _fees;

    public EdoRenewalService(
        OptimusDbContext db,
        IEdoService edoService,
        IActivityLogService activity,
        IDocumentStore docs,
        IPaymentFeeService fees)
    {
        _db = db;
        _edoService = edoService;
        _activity = activity;
        _docs = docs;
        _fees = fees;
    }

    public async Task<RenewalDto> RequestAsync(CreateRenewalRequest request, Guid actorId, string actorRole, CancellationToken ct = default)
    {
        if (actorRole is not (AppRoles.Broker or AppRoles.Consignee or AppRoles.SystemAdmin))
        {
            throw new UnauthorizedAccessException("Broker/Consignee required.");
        }

        var expired = await _db.ElectronicDeliveryOrders.Include(x => x.Manifest)
            .FirstOrDefaultAsync(x => x.Id == request.ExpiredEdoId, ct)
                      ?? throw new KeyNotFoundException("eDO/CRO not found.");

        if (actorRole == AppRoles.Broker && expired.Manifest.BrokerId != actorId)
        {
            throw new UnauthorizedAccessException("Broker is not assigned to this eDO/CRO.");
        }

        if (actorRole == AppRoles.Consignee && expired.Manifest.ConsigneeId != actorId)
        {
            throw new UnauthorizedAccessException("Consignee is not assigned to this eDO/CRO.");
        }

        var openRenewal = await _db.EdoRenewalRequests.AsNoTracking()
            .AnyAsync(x => x.ExpiredEdoId == expired.Id &&
                           x.Status != RenewalRequestStatus.Cancelled &&
                           x.Status != RenewalRequestStatus.Completed, ct);
        if (openRenewal)
        {
            throw new InvalidOperationException("An open renewal request already exists for this eDO/CRO.");
        }

        if (expired.Status is not (EdoStatus.Expired or EdoStatus.Locked or EdoStatus.Released or EdoStatus.Active))
        {
            throw new InvalidOperationException("eDO/CRO cannot be renewed in current status.");
        }

        var freeDays = 7;
        var overdue = Math.Max(0, (int)Math.Ceiling((DateTime.UtcNow.Date - request.EmptyContainerReturnDate.Date).TotalDays) - freeDays);
        var detentionFee = await _fees.GetActiveAsync("detention", ct);
        var ratePerDay = detentionFee.Amount > 0 ? detentionFee.Amount : 150m;
        var detention = overdue * ratePerDay;

        var renewal = new EdoRenewalRequest
        {
            ExpiredEdoId = expired.Id,
            RequestedById = actorId,
            EmptyContainerReturnDate = request.EmptyContainerReturnDate,
            OverdueDays = overdue,
            DetentionChargeAmount = detention,
            Status = detention > 0 ? RenewalRequestStatus.AwaitingPayment : RenewalRequestStatus.PendingReview,
            AdditionalNotes = request.AdditionalNotes
        };

        if (detention > 0)
        {
            renewal.AdditionalNotes = string.IsNullOrWhiteSpace(request.AdditionalNotes)
                ? $"Detention billing PDF: {_docs.CreatePlaceholderPdf("billing", $"Detention {expired.EdoNumber}", $"OverdueDays={overdue}; Amount={detention}")}"
                : $"{request.AdditionalNotes}\nDetention={detention} overdue={overdue}";
            // Detention is tracked on the renewal (Billing remains 1:1 with manifest for cargo invoice).
        }

        _db.EdoRenewalRequests.Add(renewal);
        await _db.SaveChangesAsync(ct);
        await _activity.LogAsync(actorId, "edo.renewal_request", nameof(EdoRenewalRequest), renewal.Id, expired.EdoNumber, ct);
        return await MapRenewalAsync(renewal.Id, ct);
    }

    public async Task<RenewalDto> ReviewAsync(Guid id, ReviewRenewalRequest request, Guid actorId, string actorRole, CancellationToken ct = default)
    {
        EnsureStaff(actorRole);
        var renewal = await _db.EdoRenewalRequests.Include(x => x.ExpiredEdo).FirstOrDefaultAsync(x => x.Id == id, ct)
                      ?? throw new KeyNotFoundException("Renewal not found.");

        if (request.Approve)
        {
            renewal.Status = renewal.DetentionChargeAmount > 0 && !renewal.PaymentVerified
                ? RenewalRequestStatus.AwaitingPayment
                : RenewalRequestStatus.ReadyForGeneration;
        }
        else
        {
            renewal.Status = RenewalRequestStatus.Cancelled;
            renewal.AdditionalNotes = $"{renewal.AdditionalNotes}\nRejected: {request.Notes}".Trim();
        }

        await _db.SaveChangesAsync(ct);
        return await MapRenewalAsync(renewal.Id, ct);
    }

    public async Task<RenewalDto> MarkPaymentVerifiedAsync(Guid id, Guid actorId, string actorRole, CancellationToken ct = default)
    {
        if (actorRole is not (AppRoles.Accounting or AppRoles.SystemAdmin))
        {
            throw new UnauthorizedAccessException("Accounting required.");
        }

        var renewal = await _db.EdoRenewalRequests.Include(x => x.ExpiredEdo).FirstOrDefaultAsync(x => x.Id == id, ct)
                      ?? throw new KeyNotFoundException("Renewal not found.");
        if (string.IsNullOrWhiteSpace(renewal.PaymentReceiptPath))
        {
            throw new InvalidOperationException("Detention payment receipt must be uploaded before verification.");
        }

        renewal.PaymentVerified = true;
        renewal.PaymentVerifiedAt = DateTime.UtcNow;
        renewal.PaymentVerifiedById = actorId;
        renewal.Status = RenewalRequestStatus.ReadyForGeneration;

        var submission = await _db.TruckerPreForecastSubmissions
            .FirstOrDefaultAsync(x => x.RenewalRequestId == renewal.Id, ct);
        if (submission is not null &&
            submission.Status == TruckerPreForecastStatus.AwaitingDetentionPayment)
        {
            submission.Status = TruckerPreForecastStatus.PendingReview;
        }

        await _db.SaveChangesAsync(ct);
        return await MapRenewalAsync(renewal.Id, ct);
    }

    public async Task<RenewalDto> SubmitPaymentAsync(
        Guid id,
        SubmitRenewalPaymentRequest request,
        string? receiptPath,
        Guid actorId,
        string actorRole,
        CancellationToken ct = default)
    {
        if (actorRole is not (AppRoles.Broker or AppRoles.Consignee or AppRoles.SystemAdmin))
        {
            throw new UnauthorizedAccessException("Broker or consignee required.");
        }

        var renewal = await _db.EdoRenewalRequests.Include(x => x.ExpiredEdo).ThenInclude(e => e.Manifest)
            .FirstOrDefaultAsync(x => x.Id == id, ct)
            ?? throw new KeyNotFoundException("Renewal not found.");
        if (renewal.Status != RenewalRequestStatus.AwaitingPayment)
        {
            throw new InvalidOperationException("Renewal is not awaiting detention payment.");
        }

        if (actorRole == AppRoles.Broker && renewal.ExpiredEdo.Manifest?.BrokerId != actorId)
        {
            throw new UnauthorizedAccessException("Not authorized for this renewal.");
        }

        if (actorRole == AppRoles.Consignee && renewal.ExpiredEdo.Manifest?.ConsigneeId != actorId)
        {
            throw new UnauthorizedAccessException("Not authorized for this renewal.");
        }

        if (string.IsNullOrWhiteSpace(receiptPath))
        {
            throw new InvalidOperationException("Payment receipt is required.");
        }

        if (!string.IsNullOrWhiteSpace(renewal.PaymentReceiptPath) && !renewal.PaymentVerified)
        {
            throw new InvalidOperationException("Payment receipt already submitted and awaiting accounting validation.");
        }

        renewal.PaymentReceiptPath = receiptPath;
        renewal.PaymentReference = request.PaymentReference?.Trim();
        renewal.AdditionalNotes = string.IsNullOrWhiteSpace(request.PaymentChannel)
            ? renewal.AdditionalNotes
            : $"{renewal.AdditionalNotes}\nPayment channel: {request.PaymentChannel}".Trim();

        await _db.SaveChangesAsync(ct);
        await _activity.LogAsync(actorId, "edo.renewal_payment.submit", nameof(EdoRenewalRequest), renewal.Id, $"{request.Amount}", ct);
        return await MapRenewalAsync(renewal.Id, ct);
    }

    public async Task<EdoDto> GenerateRenewedAsync(Guid renewalId, Guid actorId, string actorRole, CancellationToken ct = default)
    {
        EnsureStaff(actorRole);
        var renewal = await _db.EdoRenewalRequests.Include(x => x.ExpiredEdo).FirstOrDefaultAsync(x => x.Id == renewalId, ct)
                      ?? throw new KeyNotFoundException("Renewal not found.");
        if (renewal.Status != RenewalRequestStatus.ReadyForGeneration)
        {
            throw new InvalidOperationException("Renewal is not ready for generation.");
        }

        if (renewal.DetentionChargeAmount > 0 && !renewal.PaymentVerified)
        {
            throw new InvalidOperationException("Detention payment not verified.");
        }

        renewal.ExpiredEdo.Status = EdoStatus.Superseded;
        var cyLocation = renewal.ExpiredEdo.CyLocation;
        var submission = await _db.TruckerPreForecastSubmissions
            .Include(x => x.AssignedTerminal)
            .FirstOrDefaultAsync(x => x.RenewalRequestId == renewal.Id, ct);
        if (submission?.AssignedTerminal is not null)
        {
            cyLocation = submission.AssignedTerminal.Name;
        }

        var created = await _edoService.GenerateAsync(new GenerateEdoRequest(
            renewal.ExpiredEdo.ManifestId,
            renewal.ExpiredEdo.ContainerNumber,
            DateTime.UtcNow.AddDays(14),
            cyLocation,
            $"Renewed from {renewal.ExpiredEdo.EdoNumber}",
            RequirePayment: true), actorId, actorRole, ct);

        renewal.NewEdoId = created.Id;
        renewal.Status = RenewalRequestStatus.Completed;
        renewal.CompletedAt = DateTime.UtcNow;

        if (submission is not null)
        {
            submission.NewEdoId = created.Id;
            submission.Status = TruckerPreForecastStatus.AwaitingRenewalPayment;
        }

        await _db.SaveChangesAsync(ct);
        return created;
    }

    public async Task<IReadOnlyList<RenewalDto>> ListAsync(Guid actorId, string actorRole, CancellationToken ct = default)
    {
        var q = _db.EdoRenewalRequests.AsNoTracking()
            .Include(x => x.ExpiredEdo).ThenInclude(e => e.Manifest)
            .Include(x => x.NewEdo)
            .AsQueryable();

        q = FilterRenewalsForRole(q, actorId, actorRole);

        if (actorRole is AppRoles.SystemAdmin or AppRoles.SlStaff or AppRoles.ShippingLinesAdmin or AppRoles.Accounting)
        {
            var lineId = await SoleShippingLine.ResolveForActorAsync(_db, actorId, actorRole, ct);
            q = q.Where(x => x.ExpiredEdo.ShippingLineId == lineId);
        }

        var items = await q.OrderByDescending(x => x.RequestedAt).ToListAsync(ct);
        if (items.Count == 0)
        {
            return Array.Empty<RenewalDto>();
        }

        var renewalIds = items.Select(x => x.Id).ToList();
        var submissions = await _db.TruckerPreForecastSubmissions.AsNoTracking()
            .Where(s => s.RenewalRequestId != null && renewalIds.Contains(s.RenewalRequestId.Value))
            .ToDictionaryAsync(s => s.RenewalRequestId!.Value, ct);

        return items.Select(x =>
        {
            submissions.TryGetValue(x.Id, out var submission);
            return MapRenewalEntity(
                x,
                x.ExpiredEdo.EdoNumber,
                x.NewEdo?.EdoNumber,
                x.NewEdo?.ContainerNumber ?? x.ExpiredEdo.ContainerNumber,
                submission is not null,
                submission?.Id);
        }).ToList();
    }

    private IQueryable<EdoRenewalRequest> FilterRenewalsForRole(
        IQueryable<EdoRenewalRequest> q,
        Guid actorId,
        string role)
    {
        if (role is AppRoles.SystemAdmin or AppRoles.SlStaff or AppRoles.ShippingLinesAdmin or AppRoles.Accounting)
        {
            return q;
        }

        if (role == AppRoles.Trucker)
        {
            return q.Where(x =>
                x.RequestedById == actorId ||
                _db.TruckerPreForecastSubmissions.Any(s => s.RenewalRequestId == x.Id && s.TruckerId == actorId));
        }

        if (role == AppRoles.Broker)
        {
            return q.Where(x =>
                x.RequestedById == actorId ||
                (x.ExpiredEdo.Manifest != null && x.ExpiredEdo.Manifest.BrokerId == actorId));
        }

        if (role == AppRoles.Consignee)
        {
            return q.Where(x =>
                x.RequestedById == actorId ||
                (x.ExpiredEdo.Manifest != null && x.ExpiredEdo.Manifest.ConsigneeId == actorId));
        }

        return q.Where(_ => false);
    }

    private async Task<RenewalDto> MapRenewalAsync(Guid renewalId, CancellationToken ct)
    {
        var renewal = await _db.EdoRenewalRequests.AsNoTracking()
            .Include(x => x.ExpiredEdo)
            .Include(x => x.NewEdo)
            .FirstAsync(x => x.Id == renewalId, ct);
        var submission = await _db.TruckerPreForecastSubmissions.AsNoTracking()
            .FirstOrDefaultAsync(s => s.RenewalRequestId == renewalId, ct);
        return MapRenewalEntity(
            renewal,
            renewal.ExpiredEdo.EdoNumber,
            renewal.NewEdo?.EdoNumber,
            renewal.NewEdo?.ContainerNumber ?? renewal.ExpiredEdo.ContainerNumber,
            submission is not null,
            submission?.Id);
    }

    private static RenewalDto MapRenewalEntity(
        EdoRenewalRequest x,
        string expiredNumber,
        string? newEdoNumber,
        string? containerNumber,
        bool isPreForecast,
        Guid? preForecastSubmissionId) =>
        new(
            x.Id,
            x.ExpiredEdoId,
            expiredNumber,
            x.NewEdoId,
            newEdoNumber,
            containerNumber,
            isPreForecast,
            preForecastSubmissionId,
            x.Status.ToString(),
            x.OverdueDays,
            x.DetentionChargeAmount,
            x.PaymentVerified,
            !string.IsNullOrWhiteSpace(x.PaymentReceiptPath),
            x.PaymentReceiptPath,
            x.RequestedAt,
            x.CompletedAt);

    private static void EnsureStaff(string role)
    {
        if (role is not (AppRoles.SlStaff or AppRoles.ShippingLinesAdmin or AppRoles.SystemAdmin))
        {
            throw new UnauthorizedAccessException("Staff role required.");
        }
    }

}

public class DocumentVerificationService : IDocumentVerificationService
{
    private readonly OptimusDbContext _db;

    public DocumentVerificationService(OptimusDbContext db) => _db = db;

    public async Task<DocumentVerifyDto> VerifyAsync(string token, CancellationToken ct = default)
    {
        var normalized = token.Trim();
        if (normalized.Length < 16 || normalized.Length > 128 ||
            !normalized.All(static c => char.IsLetterOrDigit(c) || c is '-' or '_'))
        {
            return Invalid("Invalid verification token.");
        }

        var row = await _db.DocumentVerifications.AsNoTracking()
            .FirstOrDefaultAsync(x => x.VerificationToken == normalized, ct);
        if (row is null)
        {
            return Invalid("Invalid verification token.");
        }

        var edo = await _db.ElectronicDeliveryOrders.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == row.SubjectId || x.VerificationToken == normalized, ct);

        if (edo is null)
        {
            return new DocumentVerifyDto(
                true,
                row.DocumentType,
                row.DocumentNumber,
                null,
                null,
                null,
                null,
                "Document record verified.");
        }

        return new DocumentVerifyDto(
            true,
            "EDO",
            edo.EdoNumber,
            edo.Status.ToString(),
            null,
            null,
            edo.ExpiresAt,
            "Document verified.");
    }

    private static DocumentVerifyDto Invalid(string message) =>
        new(false, null, null, null, null, null, null, message);
}

public class EdoExpirationHostedService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<EdoExpirationHostedService> _logger;

    public EdoExpirationHostedService(IServiceScopeFactory scopeFactory, ILogger<EdoExpirationHostedService> logger)
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
                var edo = scope.ServiceProvider.GetRequiredService<IEdoService>();
                var count = await edo.ProcessExpirationsAsync(stoppingToken);
                if (count > 0)
                {
                    _logger.LogInformation("Expired {Count} eDO/CRO documents", count);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "eDO expiration job failed");
            }

            await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
        }
    }
}
