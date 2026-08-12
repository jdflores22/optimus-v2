namespace Optimus.Application.Yard.Interfaces;

using Optimus.Application.Yard.Dtos;

public interface ICyScopeService
{
    Task<IReadOnlyList<Guid>> GetAssignedTerminalIdsAsync(Guid userId, CancellationToken ct = default);

    Task<CyStaffScopeDto> GetCyStaffScopeAsync(Guid userId, CancellationToken ct = default);

    Task<IReadOnlyList<Guid>> GetCyUserIdsForTerminalAsync(Guid terminalId, CancellationToken ct = default);

    Task EnsureContainerYardAccessAsync(Guid userId, Guid containerId, CancellationToken ct = default);
}
