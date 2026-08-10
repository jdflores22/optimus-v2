using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Optimus.Application.Auth.Interfaces;

namespace Optimus.Infrastructure.Email;

public class ResendEmailSender : IEmailSender
{
    private readonly HttpClient _httpClient;
    private readonly ResendSettings _resendSettings;
    private readonly SmtpSettings _smtpSettings;
    private readonly ILogger<ResendEmailSender> _logger;

    public ResendEmailSender(
        HttpClient httpClient,
        IOptions<ResendSettings> resendSettings,
        IOptions<SmtpSettings> smtpSettings,
        ILogger<ResendEmailSender> logger)
    {
        _httpClient = httpClient;
        _resendSettings = resendSettings.Value;
        _smtpSettings = smtpSettings.Value;
        _logger = logger;
    }

    public async Task SendAsync(string toEmail, string subject, string body, CancellationToken cancellationToken = default)
    {
        if (!_resendSettings.IsConfigured)
        {
            throw new InvalidOperationException("Resend API key is not configured.");
        }

        if (string.IsNullOrWhiteSpace(_smtpSettings.FromEmail))
        {
            throw new InvalidOperationException("Smtp:FromEmail is required when using Resend.");
        }

        var from = string.IsNullOrWhiteSpace(_smtpSettings.FromName)
            ? _smtpSettings.FromEmail
            : $"{_smtpSettings.FromName} <{_smtpSettings.FromEmail}>";

        using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.resend.com/emails");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _resendSettings.ApiKey);
        request.Content = JsonContent.Create(new ResendEmailPayload(from, toEmail, subject, body));

        using var response = await _httpClient.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            var errorBody = await response.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogError(
                "Resend API failed status={Status} to={To} body={Body}",
                (int)response.StatusCode,
                toEmail,
                errorBody);
            throw new InvalidOperationException($"Email could not be sent via Resend ({(int)response.StatusCode}).");
        }

        _logger.LogInformation("EMAIL sent via Resend to={To} subject={Subject}", toEmail, subject);
    }

    private sealed record ResendEmailPayload(
        [property: JsonPropertyName("from")] string From,
        [property: JsonPropertyName("to")] string[] To,
        [property: JsonPropertyName("subject")] string Subject,
        [property: JsonPropertyName("text")] string Text)
    {
        public ResendEmailPayload(string from, string to, string subject, string text)
            : this(from, new[] { to }, subject, text)
        {
        }
    }
}
