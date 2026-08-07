using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;

namespace Optimus.Infrastructure.Storage;

public static class FileStoragePaths
{
    public const string SectionName = "FileStorage";

    public static string ResolveUploadRoot(IConfiguration configuration, IHostEnvironment environment)
    {
        var configured = configuration[$"{SectionName}:UploadPath"];
        if (!string.IsNullOrWhiteSpace(configured) && Path.IsPathRooted(configured))
            return configured;

        if (string.Equals(configured, "uploads", StringComparison.OrdinalIgnoreCase))
            return Path.Combine(environment.ContentRootPath, "uploads");

        if (!string.IsNullOrWhiteSpace(configured))
            return Path.Combine(environment.ContentRootPath, configured);

        return Path.Combine(environment.ContentRootPath, "wwwroot", "uploads");
    }

    public static string? ResolveExistingFile(string uploadRoot, string? webPath)
    {
        if (string.IsNullOrWhiteSpace(webPath))
            return null;

        var normalized = webPath.Trim().Replace('/', Path.DirectorySeparatorChar).TrimStart(Path.DirectorySeparatorChar);
        if (normalized.StartsWith("uploads" + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase))
            normalized = normalized["uploads".Length..].TrimStart(Path.DirectorySeparatorChar);

        var candidates = new[]
        {
            Path.Combine(uploadRoot, normalized),
            Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", normalized),
            Path.Combine(Directory.GetCurrentDirectory(), normalized),
        };

        return candidates.FirstOrDefault(File.Exists);
    }
}
