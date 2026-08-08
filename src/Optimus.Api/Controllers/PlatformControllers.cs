using System.Net;
using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Optimus.Api.Security;
using Optimus.Application.Cargo.Dtos;
using Optimus.Application.Platform.Dtos;
using Optimus.Application.Platform.Interfaces;
using Optimus.Application.Yard.Dtos;
using Optimus.Application.Yard.Interfaces;

namespace Optimus.Api.Controllers;

[ApiController]
[Route("api/notifications")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _notifications;
    public NotificationsController(INotificationService notifications) => _notifications = notifications;
    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<NotificationDto>>> List(CancellationToken ct)
        => Ok(await _notifications.ListForUserAsync(UserId, ct));

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<NotificationDto>> Get(Guid id, CancellationToken ct)
    {
        var item = await _notifications.GetForUserAsync(UserId, id, ct);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost("read")]
    public async Task<IActionResult> MarkRead([FromBody] MarkReadRequest? request, CancellationToken ct)
    {
        await _notifications.MarkReadAsync(UserId, request?.NotificationId, ct);
        return Ok(new { message = "Marked read." });
    }

    [HttpGet("preferences")]
    public async Task<ActionResult<NotificationPreferenceDto>> GetPreferences(CancellationToken ct)
        => Ok(await _notifications.GetPreferencesAsync(UserId, ct));

    [HttpPut("preferences")]
    public async Task<ActionResult<NotificationPreferenceDto>> UpsertPreferences(
        [FromBody] UpsertNotificationPreferenceRequest request, CancellationToken ct)
        => Ok(await _notifications.UpsertPreferencesAsync(UserId, request, ct));

    [HttpPost("push/subscribe")]
    public async Task<IActionResult> SubscribePush([FromBody] PushSubscribeRequest request, CancellationToken ct)
    {
        await _notifications.SubscribePushAsync(UserId, request, ct);
        return Ok(new { message = "Subscribed." });
    }

    [HttpPost("push/unsubscribe")]
    public async Task<IActionResult> UnsubscribePush([FromBody] PushUnsubscribeRequest request, CancellationToken ct)
    {
        await _notifications.UnsubscribePushAsync(UserId, request.Endpoint, ct);
        return Ok(new { message = "Unsubscribed." });
    }

    [HttpGet("metrics")]
    [Authorize(Policy = "ShippingAdmin")]
    public async Task<ActionResult<NotificationMetricsDto>> Metrics(CancellationToken ct)
        => Ok(await _notifications.GetMetricsAsync(ct));
}

public record MarkReadRequest(Guid? NotificationId);
public record PushUnsubscribeRequest(string Endpoint);

[ApiController]
[Route("api/message-templates")]
[Authorize(Policy = "ShippingAdmin")]
public class MessageTemplatesController : ControllerBase
{
    private readonly IMessageTemplateService _templates;
    public MessageTemplatesController(IMessageTemplateService templates) => _templates = templates;

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<MessageTemplateDto>>> List([FromQuery] string? channel, CancellationToken ct)
        => Ok(await _templates.ListAsync(channel, ct));

    [HttpPost]
    public async Task<ActionResult<MessageTemplateDto>> Upsert([FromBody] UpsertMessageTemplateRequest request, CancellationToken ct)
        => Ok(await _templates.UpsertAsync(request, ct));
}

[ApiController]
[Route("api/system-settings")]
[Authorize(Policy = "SystemAdmin")]
public class SystemSettingsController : ControllerBase
{
    private readonly ISystemSettingsService _settings;
    public SystemSettingsController(ISystemSettingsService settings) => _settings = settings;

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<SystemSettingDto>>> List(CancellationToken ct)
        => Ok(await _settings.ListAsync(ct));

    [HttpPut]
    public async Task<ActionResult<SystemSettingDto>> Upsert([FromBody] UpsertSystemSettingRequest request, CancellationToken ct)
        => Ok(await _settings.UpsertAsync(request, ct));
}

[ApiController]
[Route("api/rate-limits")]
[Authorize(Policy = "SystemAdmin")]
public class RateLimitsController : ControllerBase
{
    private readonly IRateLimitAdminService _rules;
    public RateLimitsController(IRateLimitAdminService rules) => _rules = rules;

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<RateLimitRuleDto>>> List(CancellationToken ct)
        => Ok(await _rules.ListAsync(ct));

    [HttpPost]
    public async Task<ActionResult<RateLimitRuleDto>> Create([FromBody] UpsertRateLimitRuleRequest request, CancellationToken ct)
        => Ok(await _rules.UpsertAsync(null, request, ct));

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<RateLimitRuleDto>> Update(Guid id, [FromBody] UpsertRateLimitRuleRequest request, CancellationToken ct)
        => Ok(await _rules.UpsertAsync(id, request, ct));
}

[ApiController]
[Route("api/document-templates")]
[Authorize(Policy = "ShippingAdmin")]
public class DocumentTemplatesController : ControllerBase
{
    private readonly IDocumentTemplateService _templates;
    public DocumentTemplatesController(IDocumentTemplateService templates) => _templates = templates;
    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<DocumentTemplateDto>>> List(CancellationToken ct)
        => Ok(await _templates.ListAsync(ct));

    [HttpGet("active/{documentType}")]
    public async Task<ActionResult<DocumentTemplateDto>> Active(string documentType, CancellationToken ct)
    {
        var tpl = await _templates.GetActiveAsync(documentType, ct);
        return tpl is null ? NotFound() : Ok(tpl);
    }

    [HttpPost]
    public async Task<ActionResult<DocumentTemplateDto>> Upsert([FromBody] UpsertDocumentTemplateRequest request, CancellationToken ct)
        => Ok(await _templates.UpsertAsync(request, UserId, ct));

    [HttpPost("{id:guid}/activate")]
    public async Task<ActionResult<DocumentTemplateDto>> Activate(Guid id, CancellationToken ct)
        => Ok(await _templates.ActivateAsync(id, ct));

    [HttpPost("{id:guid}/clone")]
    public async Task<ActionResult<DocumentTemplateDto>> Clone(Guid id, CancellationToken ct)
        => Ok(await _templates.CloneVersionAsync(id, UserId, ct));

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _templates.DeleteAsync(id, ct);
        return NoContent();
    }

    [HttpPost("{id:guid}/layout")]
    public async Task<ActionResult<object>> SaveLayout(Guid id, [FromBody] SaveDocumentTemplateLayoutRequest request, CancellationToken ct)
    {
        await _templates.SaveLayoutAsync(id, request, UserId, ct);
        return Ok(new { success = true, message = "Layout saved successfully" });
    }

    [HttpPost("{id:guid}/upload-image")]
    public async Task<ActionResult<object>> UploadImage(Guid id, IFormFile image, CancellationToken ct)
    {
        UploadGuard.Validate(image, ".png", ".jpg", ".jpeg");
        if (image.Length > 2 * 1024 * 1024)
            return BadRequest(new { success = false, message = "Image must be 2 MB or smaller" });

        await using var stream = image.OpenReadStream();
        var url = await _templates.UploadImageAsync(id, stream, image.FileName, ct);
        return Ok(new { success = true, url, path = url });
    }

    [HttpPost("{id:guid}/preview-html")]
    public async Task<IActionResult> PreviewHtml(Guid id, [FromBody] SaveDocumentTemplateLayoutRequest? request, CancellationToken ct)
    {
        var templates = await _templates.ListAsync(ct);
        var template = templates.FirstOrDefault(x => x.Id == id);
        if (template is null) return NotFound();

        var layoutJson = request?.Layout.ValueKind == JsonValueKind.Object
            ? request.Layout.GetRawText()
            : template.LayoutJson ?? "{}";
        var encoded = WebUtility.HtmlEncode(layoutJson);
        var html =
            "<!DOCTYPE html><html><head><meta charset=\"utf-8\"><title>Preview — " + WebUtility.HtmlEncode(template.Name) +
            "</title><style>body{font-family:system-ui,sans-serif;padding:24px;background:#f1f5f9}" +
            "pre{background:#fff;padding:16px;border-radius:8px;overflow:auto;font-size:12px}</style></head><body>" +
            "<h1>" + WebUtility.HtmlEncode(template.Name) + " — Layout Preview</h1>" +
            "<p>Full PDF rendering will use this layout at generation time. Below is the saved layout JSON.</p>" +
            "<pre>" + encoded + "</pre></body></html>";
        return Content(html, "text/html; charset=UTF-8");
    }
}

[ApiController]
[Route("api/scheduled-reports")]
[Authorize(Policy = "ShippingAdmin")]
public class ScheduledReportsController : ControllerBase
{
    private readonly IScheduledReportService _reports;
    public ScheduledReportsController(IScheduledReportService reports) => _reports = reports;

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ScheduledReportDto>>> List(CancellationToken ct)
        => Ok(await _reports.ListAsync(ct));

    [HttpPost]
    public async Task<ActionResult<ScheduledReportDto>> Create([FromBody] UpsertScheduledReportRequest request, CancellationToken ct)
        => Ok(await _reports.UpsertAsync(null, request, ct));

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ScheduledReportDto>> Update(Guid id, [FromBody] UpsertScheduledReportRequest request, CancellationToken ct)
        => Ok(await _reports.UpsertAsync(id, request, ct));

    [HttpPost("process")]
    public async Task<IActionResult> Process(CancellationToken ct)
        => Ok(new { processed = await _reports.ProcessDueAsync(ct) });
}

[ApiController]
[Route("api/reports")]
[Authorize(Policy = "ShippingAdmin")]
public class ReportsController : ControllerBase
{
    private readonly IReportsService _reports;
    public ReportsController(IReportsService reports) => _reports = reports;

    [HttpGet("edo-release")]
    public async Task<ActionResult<EdoReleaseMetricsDto>> EdoRelease(CancellationToken ct)
        => Ok(await _reports.GetEdoReleaseMetricsAsync(ct));

    [HttpGet("edo-release/export")]
    public async Task<IActionResult> EdoReleaseExport(CancellationToken ct)
    {
        var (csv, pdf) = await _reports.ExportEdoReleaseMetricsAsync(ct);
        return Ok(new { csv, pdfPath = pdf });
    }
}

[ApiController]
[Route("api/audit")]
[Authorize(Policy = "StaffHierarchy")]
public class AuditController : ControllerBase
{
    private readonly IAuditTrailService _audit;
    public AuditController(IAuditTrailService audit) => _audit = audit;

    [HttpGet("manifest/{manifestId:guid}")]
    public async Task<ActionResult<IReadOnlyList<AuditTrailDto>>> Manifest(Guid manifestId, CancellationToken ct)
        => Ok(await _audit.GetManifestAuditAsync(manifestId, ct));

    [HttpGet("edo/{edoId:guid}")]
    public async Task<ActionResult<IReadOnlyList<AuditTrailDto>>> Edo(Guid edoId, CancellationToken ct)
        => Ok(await _audit.GetEdoAuditAsync(edoId, ct));
}

[ApiController]
[Route("api/activity")]
[Authorize(Policy = "StaffHierarchy")]
public class PlatformActivityController : ControllerBase
{
    private readonly IPlatformActivityService _activity;
    public PlatformActivityController(IPlatformActivityService activity) => _activity = activity;

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ActivityLogDto>>> List(
        [FromQuery] string? entityType,
        [FromQuery] Guid? entityId,
        [FromQuery] int take = 100,
        CancellationToken ct = default)
        => Ok(await _activity.ListAsync(entityType, entityId, take, ct));
}

[ApiController]
[Route("api/maintenance")]
[Authorize(Policy = "SystemAdmin")]
public class MaintenanceController : ControllerBase
{
    private readonly IMaintenanceService _maintenance;
    public MaintenanceController(IMaintenanceService maintenance) => _maintenance = maintenance;

    [HttpPost("run")]
    public async Task<ActionResult<MaintenanceResultDto>> Run(CancellationToken ct)
        => Ok(await _maintenance.RunAsync(ct));
}
