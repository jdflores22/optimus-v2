using Microsoft.Extensions.Configuration;

namespace Optimus.Infrastructure.Email;

public static class SmtpSettingsConfiguration
{
    public static void Bind(SmtpSettings settings, IConfiguration configuration)
    {
        configuration.GetSection(SmtpSettings.SectionName).Bind(settings);
        ApplyEnvironmentOverrides(settings);
    }

    public static void ApplyEnvironmentOverrides(SmtpSettings settings)
    {
        settings.Host = FirstNonEmpty(settings.Host, Env("Smtp__Host"), Env("SMTP_HOST")) ?? settings.Host;
        settings.User = FirstNonEmpty(settings.User, Env("Smtp__User"), Env("SMTP_USER")) ?? settings.User;
        settings.Password = FirstNonEmpty(settings.Password, Env("Smtp__Password"), Env("SMTP_PASSWORD")) ?? settings.Password;
        settings.FromEmail = FirstNonEmpty(settings.FromEmail, Env("Smtp__FromEmail"), Env("SMTP_FROM")) ?? settings.FromEmail;
        settings.FromName = FirstNonEmpty(settings.FromName, Env("Smtp__FromName")) ?? settings.FromName;

        var port = FirstNonEmpty(Env("Smtp__Port"), Env("SMTP_PORT"));
        if (int.TryParse(port, out var parsedPort))
        {
            settings.Port = parsedPort;
        }

        var useSsl = FirstNonEmpty(Env("Smtp__UseSsl"), Env("SMTP_USE_SSL"));
        if (bool.TryParse(useSsl, out var parsedUseSsl))
        {
            settings.UseSsl = parsedUseSsl;
        }
    }

    private static string? Env(string name) =>
        Environment.GetEnvironmentVariable(name);

    private static string? FirstNonEmpty(params string?[] values)
    {
        foreach (var value in values)
        {
            if (!string.IsNullOrWhiteSpace(value))
            {
                return value.Trim();
            }
        }

        return null;
    }
}
