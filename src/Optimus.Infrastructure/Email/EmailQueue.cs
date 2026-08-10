using System.Threading.Channels;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Optimus.Application.Auth.Interfaces;

namespace Optimus.Infrastructure.Email;

public sealed record EmailJob(string ToEmail, string Subject, string TextBody, string? HtmlBody = null);

public interface IEmailQueue
{
    void Enqueue(string toEmail, string subject, string textBody, string? htmlBody = null);
}

public sealed class EmailQueue : IEmailQueue
{
    private readonly Channel<EmailJob> _channel = Channel.CreateUnbounded<EmailJob>(
        new UnboundedChannelOptions { SingleReader = true, SingleWriter = false });

    public ChannelReader<EmailJob> Reader => _channel.Reader;

    public void Enqueue(string toEmail, string subject, string textBody, string? htmlBody = null) =>
        _channel.Writer.TryWrite(new EmailJob(toEmail, subject, textBody, htmlBody));
}

public sealed class EmailQueueHostedService : BackgroundService
{
    private readonly EmailQueue _queue;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<EmailQueueHostedService> _logger;

    public EmailQueueHostedService(
        EmailQueue queue,
        IServiceScopeFactory scopeFactory,
        ILogger<EmailQueueHostedService> logger)
    {
        _queue = queue;
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await foreach (var job in _queue.Reader.ReadAllAsync(stoppingToken))
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var emailSender = scope.ServiceProvider.GetRequiredService<IEmailSender>();
                await emailSender.SendAsync(job.ToEmail, job.Subject, job.TextBody, job.HtmlBody, stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Failed to send queued email to={To} subject={Subject}",
                    job.ToEmail,
                    job.Subject);
            }
        }
    }
}
