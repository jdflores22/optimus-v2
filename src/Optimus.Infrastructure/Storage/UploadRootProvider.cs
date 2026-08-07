using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;

namespace Optimus.Infrastructure.Storage;

public interface IUploadRootProvider
{
    string RootDirectory { get; }

    string? ResolveExistingFile(string? webPath);
}

public sealed class UploadRootProvider : IUploadRootProvider
{
    public UploadRootProvider(IConfiguration configuration, IHostEnvironment environment)
    {
        RootDirectory = FileStoragePaths.ResolveUploadRoot(configuration, environment);
        Directory.CreateDirectory(RootDirectory);
    }

    public string RootDirectory { get; }

    public string? ResolveExistingFile(string? webPath) =>
        FileStoragePaths.ResolveExistingFile(RootDirectory, webPath);
}
