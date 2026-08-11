namespace Optimus.Application.Security;

public interface IResourceAuthorizationService
{
    Task EnsureManifestAccessAsync(Guid manifestId, Guid userId, string role, CancellationToken ct = default);
    Task EnsureEdoAccessAsync(Guid edoId, Guid userId, string role, CancellationToken ct = default);
    Task EnsurePreForecastAccessAsync(Guid preForecastId, Guid userId, string role, CancellationToken ct = default);
}
