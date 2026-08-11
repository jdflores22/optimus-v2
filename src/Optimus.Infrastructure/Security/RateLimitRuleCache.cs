using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Optimus.Application.Security;
using Optimus.Infrastructure.Persistence;

namespace Optimus.Infrastructure.Security;

public sealed class RateLimitRuleCache : IRateLimitRuleCache
{
    private static readonly RateLimitRuleSnapshot Fallback = new(
        "Global API",
        "/api",
        null,
        PermitLimit: 180,
        WindowSeconds: 60);

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly object _lock = new();
    private RateLimitRuleSnapshot[] _rules = new[] { Fallback };
    private DateTime _loadedAtUtc = DateTime.MinValue;
    private static readonly TimeSpan CacheTtl = TimeSpan.FromMinutes(1);

    public RateLimitRuleCache(IServiceScopeFactory scopeFactory) => _scopeFactory = scopeFactory;

    public RateLimitRuleSnapshot ResolveRule(string path, string? role)
    {
        EnsureLoaded();
        var normalizedPath = string.IsNullOrWhiteSpace(path) ? "/" : path;

        var match = _rules
            .Where(r =>
                normalizedPath.StartsWith(r.PathPrefix, StringComparison.OrdinalIgnoreCase) &&
                (string.IsNullOrWhiteSpace(r.Role) ||
                 string.Equals(r.Role, role, StringComparison.OrdinalIgnoreCase)))
            .OrderByDescending(r => r.PathPrefix.Length)
            .FirstOrDefault();

        return match ?? _rules.OrderByDescending(r => r.PathPrefix.Length).FirstOrDefault() ?? Fallback;
    }

    public void Invalidate() => _loadedAtUtc = DateTime.MinValue;

    private void EnsureLoaded()
    {
        if (DateTime.UtcNow - _loadedAtUtc < CacheTtl)
        {
            return;
        }

        lock (_lock)
        {
            if (DateTime.UtcNow - _loadedAtUtc < CacheTtl)
            {
                return;
            }

            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<OptimusDbContext>();
            var rows = db.RateLimitRules.AsNoTracking()
                .Where(x => x.IsActive)
                .OrderByDescending(x => x.PathPrefix.Length)
                .ToList();

            _rules = rows.Count == 0
                ? new[] { Fallback }
                : rows.Select(x => new RateLimitRuleSnapshot(
                    x.Name,
                    x.PathPrefix,
                    x.Role,
                    Math.Max(1, x.PermitLimit),
                    Math.Max(1, x.WindowSeconds))).ToArray();

            _loadedAtUtc = DateTime.UtcNow;
        }
    }
}
