using Microsoft.Extensions.Logging;
using Optimus.Application.Auth.Interfaces;

namespace Optimus.Infrastructure.Email;

public class LoggingEmailSender : IEmailSender
{
    private readonly ILogger<LoggingEmailSender> _logger;

    public LoggingEmailSender(ILogger<LoggingEmailSender> logger) => _logger = logger;

    public Task SendAsync(string toEmail, string subject, string body, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("EMAIL (not sent — SMTP not configured) to={To} subject={Subject} body={Body}", toEmail, subject, body);
        return Task.CompletedTask;
    }
}
