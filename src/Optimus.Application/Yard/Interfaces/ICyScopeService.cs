namespace Optimus.Application.Yard.Interfaces;

public interface ICyScopeService
{
    Task<IReadOnlyList<Guid>> GetAssignedTerminalIdsAsync(Guid userId, CancellationToken ct = default);

    Task<IReadOnlyList<Guid>> GetCyUserIdsForTerminalAsync(Guid terminalId, CancellationToken ct = default);

    Task EnsureContainerYardAccessAsync(Guid userId, Guid containerId, CancellationToken ct = default);
}
