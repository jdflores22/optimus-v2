using Microsoft.EntityFrameworkCore;
using Optimus.Application.Security;
using Optimus.Infrastructure.Persistence;
using Optimus.Infrastructure.Shipping;
using Optimus.Shared.Constants;

namespace Optimus.Infrastructure.Security;

public class ResourceAuthorizationService : IResourceAuthorizationService
{
    private readonly OptimusDbContext _db;

    public ResourceAuthorizationService(OptimusDbContext db) => _db = db;

    public async Task EnsureManifestAccessAsync(Guid manifestId, Guid userId, string role, CancellationToken ct = default)
    {
        var m = await _db.Manifests.AsNoTracking()
            .Where(x => x.Id == manifestId)
            .Select(x => new { x.Id, x.BrokerId, x.ConsigneeId, x.ShippingLineId })
            .FirstOrDefaultAsync(ct)
            ?? throw new KeyNotFoundException("Manifest not found.");

        if (role == AppRoles.Broker && m.BrokerId == userId) return;
        if (role == AppRoles.Consignee && m.ConsigneeId == userId) return;

        if (IsOperationalStaff(role))
        {
            var lineId = await SoleShippingLine.ResolveForActorAsync(_db, userId, role, ct);
            SoleShippingLine.EnsureMatches(m.ShippingLineId, lineId);
            return;
        }

        throw new UnauthorizedAccessException("You do not have access to this manifest.");
    }

    public async Task EnsureEdoAccessAsync(Guid edoId, Guid userId, string role, CancellationToken ct = default)
    {
        var edo = await _db.ElectronicDeliveryOrders.AsNoTracking()
            .Where(x => x.Id == edoId)
            .Select(x => new { x.Id, x.ShippingLineId, x.Manifest.BrokerId, x.Manifest.ConsigneeId })
            .FirstOrDefaultAsync(ct)
            ?? throw new KeyNotFoundException("eDO/CRO not found.");

        if (role == AppRoles.Broker && edo.BrokerId == userId) return;
        if (role == AppRoles.Consignee && edo.ConsigneeId == userId) return;

        if (role == AppRoles.Trucker)
        {
            var ownsRenewal = await _db.TruckerPreForecastSubmissions.AsNoTracking()
                .AnyAsync(x => x.NewEdoId == edoId && x.TruckerId == userId, ct);
            if (ownsRenewal) return;
        }

        if (IsOperationalStaff(role))
        {
            var lineId = await SoleShippingLine.ResolveForActorAsync(_db, userId, role, ct);
            SoleShippingLine.EnsureMatches(edo.ShippingLineId, lineId);
            return;
        }

        throw new UnauthorizedAccessException("You do not have access to this eDO/CRO.");
    }

    public async Task EnsurePreForecastAccessAsync(Guid preForecastId, Guid userId, string role, CancellationToken ct = default)
    {
        var pf = await _db.PreForecastRequests.AsNoTracking()
            .Where(x => x.Id == preForecastId)
            .Select(x => new { x.Id, x.TruckerId, x.Container.ShippingLineId })
            .FirstOrDefaultAsync(ct)
            ?? throw new KeyNotFoundException("Pre-forecast not found.");

        if (role == AppRoles.Trucker && pf.TruckerId == userId) return;

        if (IsOperationalStaff(role) || role == AppRoles.TerminalTeam)
        {
            var lineId = await SoleShippingLine.ResolveForActorAsync(_db, userId, role, ct);
            SoleShippingLine.EnsureMatches(pf.ShippingLineId, lineId);
            return;
        }

        throw new UnauthorizedAccessException("You do not have access to this pre-forecast.");
    }

    private static bool IsOperationalStaff(string role) =>
        role is AppRoles.SystemAdmin or AppRoles.ShippingLinesAdmin or AppRoles.SlStaff
            or AppRoles.Evaluator or AppRoles.Accounting or AppRoles.TerminalTeam;
}
