using Microsoft.EntityFrameworkCore;
using Optimus.Infrastructure.Persistence;
using Optimus.Shared.Constants;

namespace Optimus.Infrastructure.Shipping;

/// <summary>
/// OPTIMUS is single-shipping-line. Resolve the sole configured line id and scope actors to it.
/// </summary>
public static class SoleShippingLine
{
    public static async Task<Guid> RequireIdAsync(OptimusDbContext db, CancellationToken ct = default)
    {
        var id = await db.ShippingLines.AsNoTracking()
            .Where(x => x.IsActive)
            .OrderBy(x => x.BrandName)
            .Select(x => x.Id)
            .FirstOrDefaultAsync(ct);

        if (id == Guid.Empty)
        {
            id = await db.ShippingLines.AsNoTracking()
                .OrderBy(x => x.BrandName)
                .Select(x => x.Id)
                .FirstOrDefaultAsync(ct);
        }

        if (id == Guid.Empty)
        {
            throw new InvalidOperationException("No shipping line is configured. Seed or create the single shipping line.");
        }

        return id;
    }

    /// <summary>
    /// Resolve the shipping line an operational actor belongs to. Falls back to the sole configured line.
    /// </summary>
    public static async Task<Guid> ResolveForActorAsync(
        OptimusDbContext db,
        Guid actorId,
        string actorRole,
        CancellationToken ct = default)
    {
        if (actorRole == AppRoles.SystemAdmin)
        {
            return await RequireIdAsync(db, ct);
        }

        var actor = await db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == actorId, ct)
                    ?? throw new UnauthorizedAccessException("User not found.");

        if (actor.ManagedShippingLineId.HasValue)
        {
            return actor.ManagedShippingLineId.Value;
        }

        if (actor.ShippingLineAdminId.HasValue)
        {
            var adminLine = await db.Users.AsNoTracking()
                .Where(u => u.Id == actor.ShippingLineAdminId)
                .Select(u => u.ManagedShippingLineId)
                .FirstOrDefaultAsync(ct);
            if (adminLine.HasValue)
            {
                return adminLine.Value;
            }
        }

        var pref = await db.UserShippingLinePreferences.AsNoTracking()
            .FirstOrDefaultAsync(p => p.UserId == actorId, ct);
        if (pref?.LastSelectedShippingLineId is Guid lineId)
        {
            return lineId;
        }

        return await RequireIdAsync(db, ct);
    }

    public static void EnsureMatches(Guid resourceShippingLineId, Guid actorShippingLineId)
    {
        if (resourceShippingLineId != actorShippingLineId)
        {
            throw new UnauthorizedAccessException("You do not have access to this shipping line resource.");
        }
    }
}
