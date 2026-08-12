using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Optimus.Application.Yard.Dtos;
using Optimus.Application.Yard.Interfaces;
using Optimus.Infrastructure.Persistence;

namespace Optimus.Infrastructure.Yard;

public class CyScopeService : ICyScopeService
{
    private readonly OptimusDbContext _db;

    public CyScopeService(OptimusDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<Guid>> GetAssignedTerminalIdsAsync(Guid userId, CancellationToken ct = default)
    {
        var ids = new HashSet<Guid>();

        var cyUser = await _db.ContainerYardUsers.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == userId, ct);
        if (cyUser?.AssignedTerminalIdsJson is not null)
        {
            foreach (var id in ParseTerminalIds(cyUser.AssignedTerminalIdsJson))
            {
                ids.Add(id);
            }
        }

        var fromAllocations = await _db.ShippingLineTerminalAllocations.AsNoTracking()
            .Where(x => x.StaffUserId == userId)
            .Select(x => x.TerminalId)
            .ToListAsync(ct);
        foreach (var id in fromAllocations)
        {
            ids.Add(id);
        }

        return ids.ToList();
    }

    public async Task<CyStaffScopeDto> GetCyStaffScopeAsync(Guid userId, CancellationToken ct = default)
    {
        var terminalIds = await GetAssignedTerminalIdsAsync(userId, ct);
        if (terminalIds.Count == 0)
        {
            return new CyStaffScopeDto(false, Array.Empty<CyStaffScopeTerminalDto>());
        }

        var terminals = await _db.Terminals.AsNoTracking()
            .Where(x => terminalIds.Contains(x.Id))
            .OrderBy(x => x.Name)
            .Select(x => new CyStaffScopeTerminalDto(x.Id, x.Name, x.Code))
            .ToListAsync(ct);

        return new CyStaffScopeDto(terminals.Count > 0, terminals);
    }

    public async Task<IReadOnlyList<Guid>> GetCyUserIdsForTerminalAsync(Guid terminalId, CancellationToken ct = default)
    {
        var ids = new HashSet<Guid>();

        var fromAllocations = await _db.ShippingLineTerminalAllocations.AsNoTracking()
            .Where(x => x.TerminalId == terminalId && x.StaffUserId != null)
            .Select(x => x.StaffUserId!.Value)
            .ToListAsync(ct);
        foreach (var id in fromAllocations)
        {
            ids.Add(id);
        }

        var cyUsers = await _db.ContainerYardUsers.AsNoTracking()
            .Where(x => x.IsActive)
            .Select(x => new { x.Id, x.AssignedTerminalIdsJson })
            .ToListAsync(ct);
        foreach (var cy in cyUsers)
        {
            if (cy.AssignedTerminalIdsJson is not null &&
                ParseTerminalIds(cy.AssignedTerminalIdsJson).Contains(terminalId))
            {
                ids.Add(cy.Id);
            }
        }

        return ids.ToList();
    }

    public async Task EnsureContainerYardAccessAsync(Guid userId, Guid containerId, CancellationToken ct = default)
    {
        var terminalIds = await GetAssignedTerminalIdsAsync(userId, ct);
        if (terminalIds.Count == 0)
        {
            throw new UnauthorizedAccessException("No container yard is assigned to your account.");
        }

        var containerTerminalId = await _db.Containers.AsNoTracking()
            .Where(x => x.Id == containerId)
            .Select(x => x.CyAllocation != null ? (Guid?)x.CyAllocation.TerminalId : null)
            .FirstOrDefaultAsync(ct);

        if (containerTerminalId is null || !terminalIds.Contains(containerTerminalId.Value))
        {
            throw new UnauthorizedAccessException("This container is not assigned to your container yard.");
        }
    }

    internal static IEnumerable<Guid> ParseTerminalIds(string json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return Array.Empty<Guid>();
        }

        try
        {
            using var doc = JsonDocument.Parse(json);
            if (doc.RootElement.ValueKind != JsonValueKind.Array)
            {
                return Array.Empty<Guid>();
            }

            var ids = new List<Guid>();
            foreach (var element in doc.RootElement.EnumerateArray())
            {
                if (element.ValueKind == JsonValueKind.String &&
                    Guid.TryParse(element.GetString(), out var id))
                {
                    ids.Add(id);
                }
            }

            return ids;
        }
        catch (JsonException)
        {
            return Array.Empty<Guid>();
        }
    }
}
