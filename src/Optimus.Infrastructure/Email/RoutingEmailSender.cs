using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Optimus.Application.Auth.Interfaces;

namespace Optimus.Infrastructure.Email;

/// <summary>
/// Uses Resend HTTP API when configured (Railway Hobby-compatible).
/// Falls back to SMTP for local dev and Railway Pro.
/// </summary>
public class RoutingEmailSender : IEmailSender
{
    private readonly ResendSettings _resendSettings;
    private readonly ResendEmailSender _resendSender;
    private readonly SmtpEmailSender _smtpSender;
    private readonly ILogger<RoutingEmailSender> _logger;

    public RoutingEmailSender(
        IOptions<ResendSettings> resendSettings,
        ResendEmailSender resendSender,
        SmtpEmailSender smtpSender,
        ILogger<RoutingEmailSender> logger)
    {
        _resendSettings = resendSettings.Value;
        _resendSender = resendSender;
        _smtpSender = smtpSender;
        _logger = logger;
    }

    public Task SendAsync(string toEmail, string subject, string body, CancellationToken cancellationToken = default)
    {
        if (_resendSettings.IsConfigured)
        {
            _logger.LogDebug("Routing email to Resend API for {To}", toEmail);
            return _resendSender.SendAsync(toEmail, subject, body, cancellationToken);
        }

        return _smtpSender.SendAsync(toEmail, subject, body, cancellationToken);
    }
}
