namespace Optimus.Infrastructure.Email;

public class AppSettings
{
    public const string SectionName = "App";

    public string PublicUrl { get; set; } = string.Empty;

    public string TrimmedPublicUrl => PublicUrl.TrimEnd('/');
}
