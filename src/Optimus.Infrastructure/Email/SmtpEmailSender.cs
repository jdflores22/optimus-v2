using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeKit;
using Optimus.Application.Auth.Interfaces;

namespace Optimus.Infrastructure.Email;

public class SmtpEmailSender : IEmailSender
{
    private readonly IOptionsMonitor<SmtpSettings> _settings;
    private readonly IHostEnvironment _environment;
    private readonly ILogger<SmtpEmailSender> _logger;

    public SmtpEmailSender(
        IOptionsMonitor<SmtpSettings> settings,
        IHostEnvironment environment,
        ILogger<SmtpEmailSender> logger)
    {
        _settings = settings;
        _environment = environment;
        _logger = logger;
    }

    public async Task SendAsync(
        string toEmail,
        string subject,
        string textBody,
        string? htmlBody = null,
        CancellationToken cancellationToken = default)
    {
        var settings = _settings.CurrentValue;
        if (!settings.IsConfigured)
        {
            if (_environment.IsDevelopment())
            {
                _logger.LogWarning(
                    "EMAIL not sent (SMTP not configured). to={To} subject={Subject} body={Body}",
                    toEmail,
                    subject,
                    textBody);
                return;
            }

            _logger.LogError(
                "EMAIL not sent — SMTP is not configured in {Environment}. Set Smtp__Password on Railway. to={To} subject={Subject}",
                _environment.EnvironmentName,
                toEmail,
                subject);
            throw new InvalidOperationException("Email could not be sent because SMTP is not configured.");
        }

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(settings.FromName, settings.FromEmail));
        message.To.Add(MailboxAddress.Parse(toEmail));
        message.Subject = subject;
        message.Body = BuildBody(textBody, htmlBody);

        try
        {
            using var client = new SmtpClient();
            var secureSocketOptions = ResolveSecureSocketOptions(settings);

            await client.ConnectAsync(settings.Host, settings.Port, secureSocketOptions, cancellationToken);
            await client.AuthenticateAsync(settings.User, settings.Password, cancellationToken);
            await client.SendAsync(message, cancellationToken);
            await client.DisconnectAsync(true, cancellationToken);

            _logger.LogInformation("EMAIL sent to={To} subject={Subject}", toEmail, subject);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "EMAIL failed to={To} subject={Subject}", toEmail, subject);
            throw new InvalidOperationException("Email could not be sent. Please try again later.", ex);
        }
    }

    private static SecureSocketOptions ResolveSecureSocketOptions(SmtpSettings settings)
    {
        if (!settings.UseSsl)
        {
            return SecureSocketOptions.StartTlsWhenAvailable;
        }

        return settings.Port == 465
            ? SecureSocketOptions.SslOnConnect
            : SecureSocketOptions.StartTls;
    }

    private static MimeEntity BuildBody(string textBody, string? htmlBody)
    {
        if (string.IsNullOrWhiteSpace(htmlBody))
        {
            return new TextPart("plain") { Text = textBody };
        }

        var alternative = new Multipart("alternative")
        {
            new TextPart("plain") { Text = textBody },
            new TextPart("html") { Text = htmlBody },
        };
        return alternative;
    }
}
