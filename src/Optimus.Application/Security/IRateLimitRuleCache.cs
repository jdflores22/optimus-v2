namespace Optimus.Application.Security;

public record RateLimitRuleSnapshot(
    string Name,
    string PathPrefix,
    string? Role,
    int PermitLimit,
    int WindowSeconds);

public interface IRateLimitRuleCache
{
    RateLimitRuleSnapshot ResolveRule(string path, string? role);
    void Invalidate();
}
