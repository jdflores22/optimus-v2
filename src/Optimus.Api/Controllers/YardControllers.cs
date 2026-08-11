using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Optimus.Api.Security;
using Optimus.Application.Cargo.Interfaces;
using Optimus.Application.Yard.Dtos;
using Optimus.Application.Yard.Interfaces;
using Optimus.Application.Security;
using Optimus.Domain.Enums;
using Optimus.Infrastructure.Storage;
using Optimus.Shared.Constants;

namespace Optimus.Api.Controllers;

[ApiController]
[Route("api/terminals")]
[Authorize]
public class TerminalsController : ControllerBase
{
    private readonly ITerminalService _terminals;
    private readonly IUploadRootProvider _uploads;

    public TerminalsController(ITerminalService terminals, IUploadRootProvider uploads)
    {
        _terminals = terminals;
        _uploads = uploads;
    }

    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<TerminalDto>>> List([FromQuery] bool? activeOnly, CancellationToken ct)
        => Ok(await _terminals.ListAsync(activeOnly ?? true, ct));

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<TerminalDetailDto>> Get(Guid id, CancellationToken ct)
        => Ok(await _terminals.GetDetailAsync(id, ct));

    [HttpPost]
    [Authorize(Policy = "ShippingAdmin")]
    public async Task<ActionResult<TerminalDto>> Create([FromBody] UpsertTerminalRequest request, CancellationToken ct)
        => Ok(await _terminals.UpsertAsync(null, request, UserId, ct));

    [HttpPut("{id:guid}")]
    [Authorize(Policy = "ShippingAdmin")]
    public async Task<ActionResult<TerminalDto>> Update(Guid id, [FromBody] UpsertTerminalRequest request, CancellationToken ct)
        => Ok(await _terminals.UpsertAsync(id, request, UserId, ct));

    [HttpPost("{id:guid}/toggle-status")]
    [Authorize(Policy = "ShippingAdmin")]
    public async Task<ActionResult<TerminalDto>> ToggleStatus(Guid id, CancellationToken ct)
        => Ok(await _terminals.ToggleStatusAsync(id, UserId, ct));

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "ShippingAdmin")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _terminals.DeleteAsync(id, UserId, ct);
        return NoContent();
    }

    [HttpPost("{id:guid}/logo")]
    [Authorize(Policy = "ShippingAdmin")]
    public async Task<ActionResult<TerminalDto>> UploadLogo(Guid id, IFormFile file, CancellationToken ct)
    {
        UploadGuard.Validate(file, ".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg");

        var uploads = Path.Combine(_uploads.RootDirectory, "terminal-logos");
        Directory.CreateDirectory(uploads);
        var fileName = $"{id:N}{Path.GetExtension(file.FileName).ToLowerInvariant()}";
        var fullPath = Path.Combine(uploads, fileName);
        await using (var stream = System.IO.File.Create(fullPath))
        {
            await file.CopyToAsync(stream, ct);
        }

        var relative = $"/uploads/terminal-logos/{fileName}";
        return Ok(await _terminals.UploadLogoAsync(id, relative, UserId, ct));
    }

    [HttpGet("{id:guid}/slots")]
    public async Task<ActionResult<IReadOnlyList<TerminalSlotDto>>> Slots(Guid id, [FromQuery] DateOnly? from, [FromQuery] DateOnly? to, CancellationToken ct)
        => Ok(await _terminals.ListSlotsAsync(id, from, to, ct));

    [HttpPost("slots")]
    [Authorize(Policy = "YardAdmin")]
    public async Task<ActionResult<TerminalSlotDto>> UpsertSlot([FromBody] UpsertSlotRequest request, CancellationToken ct)
        => Ok(await _terminals.UpsertSlotAsync(request, UserId, ct));
}

[ApiController]
[Route("api/container-catalog")]
[Authorize]
public class ContainerCatalogController : ControllerBase
{
    private readonly IContainerCatalogService _catalog;
    public ContainerCatalogController(IContainerCatalogService catalog) => _catalog = catalog;

    [HttpGet("types")]
    public async Task<ActionResult<IReadOnlyList<ContainerTypeDto>>> Types(CancellationToken ct)
        => Ok(await _catalog.ListTypesAsync(ct));

    [HttpPost("types")]
    [Authorize(Policy = "ShippingAdmin")]
    public async Task<ActionResult<ContainerTypeDto>> UpsertType([FromBody] UpsertContainerTypeRequest request, [FromQuery] Guid? id, CancellationToken ct)
        => Ok(await _catalog.UpsertTypeAsync(id, request, ct));

    [HttpGet("sizes")]
    public async Task<ActionResult<IReadOnlyList<ContainerSizeDto>>> Sizes(CancellationToken ct)
        => Ok(await _catalog.ListSizesAsync(ct));

    [HttpPost("sizes")]
    [Authorize(Policy = "ShippingAdmin")]
    public async Task<ActionResult<ContainerSizeDto>> UpsertSize([FromBody] UpsertContainerSizeRequest request, [FromQuery] Guid? id, CancellationToken ct)
        => Ok(await _catalog.UpsertSizeAsync(id, request, ct));
}

[ApiController]
[Route("api/cy-allocations")]
[Authorize]
public class CyAllocationsController : ControllerBase
{
    private readonly ICyAllocationService _cy;
    public CyAllocationsController(ICyAllocationService cy) => _cy = cy;
    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    private string Role => User.FindFirstValue(ClaimTypes.Role)!;
    private Guid? ActiveShippingLineId =>
        Guid.TryParse(User.FindFirstValue("shipping_line_id"), out var id) ? id : null;

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<CyAllocationDto>>> List(
        [FromQuery] Guid? shippingLineId,
        [FromQuery] Guid? terminalId,
        [FromQuery] bool activeTerminalsOnly = true,
        [FromQuery] bool containerYardsOnly = true,
        CancellationToken ct = default)
    {
        var lineId = shippingLineId;
        if (!lineId.HasValue && !string.Equals(Role, AppRoles.SystemAdmin, StringComparison.Ordinal))
        {
            lineId = ActiveShippingLineId;
        }

        return Ok(await _cy.ListAsync(lineId, terminalId, activeTerminalsOnly, containerYardsOnly, ct));
    }

    [HttpPost]
    [Authorize(Policy = "ShippingAdmin")]
    public async Task<ActionResult<CyAllocationDto>> Create([FromBody] UpsertCyAllocationRequest request, CancellationToken ct)
        => Ok(await _cy.UpsertAsync(null, request, UserId, ct));

    [HttpPut("{id:guid}")]
    [Authorize(Policy = "ShippingAdmin")]
    public async Task<ActionResult<CyAllocationDto>> Update(Guid id, [FromBody] UpsertCyAllocationRequest request, CancellationToken ct)
        => Ok(await _cy.UpsertAsync(id, request, UserId, ct));
}

[ApiController]
[Route("api/containers")]
[Authorize]
public class ContainersController : ControllerBase
{
    private readonly IContainerInventoryService _containers;
    private readonly ICyScopeService _cyScope;

    public ContainersController(IContainerInventoryService containers, ICyScopeService cyScope)
    {
        _containers = containers;
        _cyScope = cyScope;
    }

    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    private string Role => User.FindFirstValue(ClaimTypes.Role)!;
    private Guid? ActiveShippingLineId =>
        Guid.TryParse(User.FindFirstValue("shipping_line_id"), out var id) ? id : null;

    private async Task<IReadOnlyList<Guid>?> ResolveCyTerminalScopeAsync(CancellationToken ct)
    {
        if (!string.Equals(Role, AppRoles.CyStaff, StringComparison.Ordinal))
        {
            return null;
        }

        var ids = await _cyScope.GetAssignedTerminalIdsAsync(UserId, ct);
        if (ids.Count == 0)
        {
            throw new UnauthorizedAccessException("No container yard is assigned to your account.");
        }

        return ids;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ContainerDto>>> List(
        [FromQuery] Guid? shippingLineId, [FromQuery] string? status, [FromQuery] string? search, CancellationToken ct)
        => Ok(await _containers.ListAsync(shippingLineId ?? ActiveShippingLineId, status, search, ct));

    [HttpGet("inventory")]
    [Authorize(Policy = "ContainerInventory")]
    public async Task<ActionResult<ContainerInventoryPageDto>> Inventory(
        [FromQuery] string? depot,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] Guid? shippingLineId = null,
        [FromQuery] string? terminalIdentity = null,
        CancellationToken ct = default)
    {
        var terminalScope = await ResolveCyTerminalScopeAsync(ct);
        var lineId = string.Equals(Role, AppRoles.CyStaff, StringComparison.Ordinal)
            ? null
            : shippingLineId ?? ActiveShippingLineId;

        return Ok(await _containers.InventoryPageAsync(
            lineId,
            depot,
            search,
            page,
            pageSize,
            terminalIdentity,
            terminalScope,
            ct));
    }

    [HttpGet("pre-forecast")]
    [Authorize(Policy = "CyStaff")]
    public async Task<ActionResult<ContainerInventoryPageDto>> PreForecast(
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken ct = default)
    {
        var terminalScope = await _cyScope.GetAssignedTerminalIdsAsync(UserId, ct);
        if (terminalScope.Count == 0)
        {
            return Unauthorized(new { message = "No container yard is assigned to your account." });
        }

        return Ok(await _containers.PreForecastPageAsync(search, page, pageSize, terminalScope, ct));
    }

    [HttpGet("inventory/depots")]
    [Authorize(Policy = "ContainerInventory")]
    public async Task<ActionResult<IReadOnlyList<string>>> InventoryDepots(
        [FromQuery] Guid? shippingLineId = null,
        [FromQuery] string? terminalIdentity = null,
        CancellationToken ct = default)
    {
        var terminalScope = await ResolveCyTerminalScopeAsync(ct);
        var lineId = string.Equals(Role, AppRoles.CyStaff, StringComparison.Ordinal)
            ? null
            : shippingLineId ?? ActiveShippingLineId;

        return Ok(await _containers.ListInventoryDepotsAsync(lineId, terminalIdentity, terminalScope, ct));
    }

    [HttpGet("inventory/{id:guid}")]
    [Authorize(Policy = "ContainerInventory")]
    public async Task<ActionResult<ContainerInventoryItemDto>> InventoryItem(Guid id, CancellationToken ct)
    {
        if (string.Equals(Role, AppRoles.CyStaff, StringComparison.Ordinal))
        {
            await _cyScope.EnsureContainerYardAccessAsync(UserId, id, ct);
        }

        return Ok(await _containers.GetInventoryItemAsync(id, ct));
    }

    [HttpGet("by-number/{containerNumber}/details")]
    [Authorize(Policy = "ContainerInventory")]
    public async Task<ActionResult<ContainerDetailDto>> DetailsByNumber(string containerNumber, CancellationToken ct)
        => Ok(await _containers.GetDetailByNumberAsync(containerNumber, ActiveShippingLineId, ct));

    [HttpGet("search-return")]
    public async Task<ActionResult<IReadOnlyList<ContainerDto>>> SearchReturn([FromQuery] string q, CancellationToken ct)
        => Ok(await _containers.SearchForReturnAsync(q ?? string.Empty, ct));

    [HttpGet("utilization")]
    [Authorize(Policy = "YardAdmin")]
    public async Task<ActionResult<IReadOnlyList<UtilizationReportDto>>> Utilization(
        [FromQuery] string? terminalIdentity,
        [FromQuery] Guid? shippingLineId,
        CancellationToken ct)
    {
        var lineId = shippingLineId;
        if (!lineId.HasValue && !string.Equals(Role, AppRoles.SystemAdmin, StringComparison.Ordinal))
        {
            lineId = ActiveShippingLineId;
        }

        return Ok(await _containers.UtilizationReportAsync(terminalIdentity, lineId, ct));
    }

    [HttpGet("utilization/export")]
    [Authorize(Policy = "YardAdmin")]
    public async Task<ActionResult<object>> Export(
        [FromQuery] string? terminalIdentity,
        [FromQuery] Guid? shippingLineId,
        CancellationToken ct)
    {
        var lineId = shippingLineId;
        if (!lineId.HasValue && !string.Equals(Role, AppRoles.SystemAdmin, StringComparison.Ordinal))
        {
            lineId = ActiveShippingLineId;
        }

        var (csv, pdf) = await _containers.ExportUtilizationAsync(terminalIdentity, lineId, ct);
        return Ok(new { csv, pdfPath = pdf });
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ContainerDto>> Get(Guid id, CancellationToken ct)
    {
        await _containers.EnsureAccessAsync(id, UserId, Role, ct);
        return Ok(await _containers.GetAsync(id, ct));
    }

    [HttpPost]
    [Authorize(Policy = "SlStaff")]
    public async Task<ActionResult<ContainerDto>> Create([FromBody] CreateContainerRequest request, CancellationToken ct)
        => Ok(await _containers.CreateAsync(request, UserId, Role, ct));

    [HttpPost("{id:guid}/allocate")]
    [Authorize(Policy = "SlStaff")]
    public async Task<ActionResult<ContainerDto>> Allocate(Guid id, [FromBody] AllocateContainerRequest request, CancellationToken ct)
        => Ok(await _containers.AllocateAsync(id, request, UserId, Role, ct));

    [HttpPut("{id:guid}/reallocate")]
    [Authorize(Policy = "SlStaff")]
    public async Task<ActionResult<ContainerDto>> Reallocate(Guid id, [FromBody] ReallocateContainerRequest request, CancellationToken ct)
        => Ok(await _containers.ReallocateAsync(id, request, UserId, Role, ct));

    [HttpPost("{id:guid}/lock-allocation")]
    [Authorize(Policy = "LockContainerAllocation")]
    public async Task<ActionResult<ContainerDto>> Lock(Guid id, CancellationToken ct)
        => Ok(await _containers.LockAllocationAsync(id, UserId, Role, ct));

    [HttpPut("{id:guid}/stack")]
    [Authorize(Policy = "YardAdmin")]
    public async Task<ActionResult<ContainerDto>> Stack(Guid id, [FromBody] UpdateStackRequest request, CancellationToken ct)
        => Ok(await _containers.UpdateStackAsync(id, request, UserId, ct));

    [HttpPost("{id:guid}/available-for-return")]
    [Authorize(Policy = "SlStaff")]
    public async Task<ActionResult<ContainerDto>> Available(Guid id, CancellationToken ct)
        => Ok(await _containers.MarkAvailableForReturnAsync(id, UserId, ct));
}

[ApiController]
[Route("api/dwell")]
[Authorize]
public class DwellController : ControllerBase
{
    private readonly IDwellService _dwell;
    public DwellController(IDwellService dwell) => _dwell = dwell;
    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet("config")]
    public async Task<ActionResult<DwellConfigDto>> Config(CancellationToken ct)
        => Ok(await _dwell.GetConfigAsync(ct));

    [HttpPut("config")]
    [Authorize(Policy = "ShippingAdmin")]
    public async Task<ActionResult<DwellConfigDto>> UpsertConfig([FromBody] UpsertDwellConfigRequest request, CancellationToken ct)
        => Ok(await _dwell.UpsertConfigAsync(request, UserId, ct));

    [HttpGet("monitor")]
    [Authorize(Policy = "YardAdmin")]
    public async Task<ActionResult<IReadOnlyList<ContainerDto>>> Monitor(CancellationToken ct)
        => Ok(await _dwell.MonitorListAsync(ct));

    [HttpGet("events")]
    [Authorize(Policy = "YardAdmin")]
    public async Task<ActionResult<IReadOnlyList<DwellEventDto>>> Events([FromQuery] Guid? containerId, CancellationToken ct)
        => Ok(await _dwell.ListEventsAsync(containerId, ct));

    [HttpPost("containers/{id:guid}/arrival")]
    [Authorize(Policy = "YardAdmin")]
    public async Task<ActionResult<ContainerDto>> Arrival(Guid id, CancellationToken ct)
        => Ok(await _dwell.RecordArrivalAsync(id, null, UserId, ct));

    [HttpPost("containers/{id:guid}/pause")]
    [Authorize(Policy = "YardAdmin")]
    public async Task<ActionResult<ContainerDto>> Pause(Guid id, [FromBody] PauseResumeDwellRequest request, CancellationToken ct)
        => Ok(await _dwell.PauseAsync(id, request, UserId, ct));

    [HttpPost("containers/{id:guid}/resume")]
    [Authorize(Policy = "YardAdmin")]
    public async Task<ActionResult<ContainerDto>> Resume(Guid id, [FromBody] PauseResumeDwellRequest request, CancellationToken ct)
        => Ok(await _dwell.ResumeAsync(id, request, UserId, ct));

    [HttpPost("process")]
    [Authorize(Policy = "ShippingAdmin")]
    public async Task<ActionResult<object>> Process(CancellationToken ct)
        => Ok(new { actions = await _dwell.ProcessMonitoringAsync(ct) });
}

[ApiController]
[Route("api/v1/pre-forecast")]
[Authorize]
public class PreForecastController : ControllerBase
{
    private readonly IPreForecastService _preForecast;
    private readonly IDocumentStore _docs;
    private readonly IResourceAuthorizationService _access;

    public PreForecastController(IPreForecastService preForecast, IDocumentStore docs, IResourceAuthorizationService access)
    {
        _preForecast = preForecast;
        _docs = docs;
        _access = access;
    }

    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    private string Role => User.FindFirstValue(ClaimTypes.Role)!;

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<PreForecastDto>>> List([FromQuery] string? status, CancellationToken ct)
    {
        if (Role != AppRoles.Trucker)
        {
            return Ok(Array.Empty<PreForecastDto>());
        }

        return Ok(await _preForecast.ListAsync(status, UserId, ct));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<PreForecastDto>> Get(Guid id, CancellationToken ct)
    {
        await _access.EnsurePreForecastAccessAsync(id, UserId, Role, ct);
        return Ok(await _preForecast.GetAsync(id, ct));
    }

    [HttpPost]
    [Authorize(Policy = "Trucker")]
    public ActionResult<PreForecastDto> Submit(
        [FromForm] Guid containerId,
        [FromForm] Guid terminalId,
        [FromForm] Guid? slotId,
        [FromForm] string? paymentReference,
        [FromForm] double latitude,
        [FromForm] double longitude,
        IFormFile photo,
        CancellationToken ct)
        => StatusCode(StatusCodes.Status410Gone, new
        {
            message = "Legacy pre-forecast is retired. Use trucker intake at /api/v1/pre-forecast/intake.",
        });

    [HttpPost("{id:guid}/verify")]
    [Authorize(Policy = "TerminalTeam")]
    public ActionResult<PreForecastDto> Verify(Guid id, [FromBody] VerifyPreForecastRequest request, CancellationToken ct)
        => StatusCode(StatusCodes.Status410Gone, new
        {
            message = "Legacy pre-forecast is retired. Use trucker intake at /api/v1/pre-forecast/intake.",
        });

    [HttpPost("{id:guid}/complete")]
    [Authorize(Policy = "TerminalTeam")]
    public ActionResult<PreForecastDto> Complete(Guid id, [FromBody] CompletePreForecastRequest request, CancellationToken ct)
        => StatusCode(StatusCodes.Status410Gone, new
        {
            message = "Legacy pre-forecast is retired. Use trucker intake at /api/v1/pre-forecast/intake.",
        });

    [HttpPost("{id:guid}/cancel")]
    public async Task<ActionResult<PreForecastDto>> Cancel(Guid id, CancellationToken ct)
        => Ok(await _preForecast.CancelAsync(id, UserId, Role, ct));
}

[ApiController]
[Route("api/v1/pre-forecast/intake")]
[Authorize]
public class TruckerPreForecastController : ControllerBase
{
    private readonly ITruckerPreForecastService _preforecast;
    private readonly IDocumentStore _docs;

    public TruckerPreForecastController(ITruckerPreForecastService preforecast, IDocumentStore docs)
    {
        _preforecast = preforecast;
        _docs = docs;
    }

    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    private string Role => User.FindFirstValue(ClaimTypes.Role)!;

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<TruckerPreForecastSubmissionDto>>> List(
        [FromQuery] string? status,
        CancellationToken ct)
        => Ok(await _preforecast.ListAsync(status, UserId, Role, ct));

    [HttpGet("search")]
    [Authorize(Policy = "Trucker")]
    public async Task<ActionResult<IReadOnlyList<TruckerPreForecastSearchResultDto>>> Search(
        [FromQuery] string q,
        CancellationToken ct)
        => Ok(await _preforecast.SearchAsync(q ?? string.Empty, ct));

    [HttpGet("verify/{token}")]
    [Authorize(Policy = "Trucker")]
    public async Task<ActionResult<TruckerPreForecastVerifyDto>> Verify(string token, CancellationToken ct)
        => Ok(await _preforecast.VerifyByTokenAsync(token, ct));

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<TruckerPreForecastSubmissionDto>> Get(Guid id, CancellationToken ct)
        => Ok(await _preforecast.GetAsync(id, UserId, Role, ct));

    [HttpPost]
    [Authorize(Policy = "Trucker")]
    [RequestSizeLimit(52_428_800)]
    public async Task<ActionResult<TruckerPreForecastSubmissionDto>> Submit(
        [FromForm] string verificationToken,
        [FromForm] DateTime returnDate,
        [FromForm] Guid? preferredTerminalId,
        IFormFile releaseDocument,
        IFormFile photoFlooring,
        IFormFile photoRightSideIn,
        IFormFile photoLeftSideIn,
        IFormFile photoBack,
        IFormFile photoFront,
        IFormFile photoLeftSideOut,
        IFormFile photoRightSideOut,
        IFormFile? photoOthers,
        CancellationToken ct)
    {
        UploadGuard.Validate(releaseDocument, ".pdf", ".png", ".jpg", ".jpeg", ".webp");
        await using var releaseStream = releaseDocument.OpenReadStream();
        var releasePath = await _docs.SaveAsync("pre-forecast-release", releaseDocument.FileName, releaseStream, ct);

        var photoInputs = new List<TruckerPreForecastPhotoInput>();
        await AddPhotoAsync(photoInputs, ContainerPhotoCategory.Flooring, photoFlooring, ct);
        await AddPhotoAsync(photoInputs, ContainerPhotoCategory.RightSideIn, photoRightSideIn, ct);
        await AddPhotoAsync(photoInputs, ContainerPhotoCategory.LeftSideIn, photoLeftSideIn, ct);
        await AddPhotoAsync(photoInputs, ContainerPhotoCategory.Back, photoBack, ct);
        await AddPhotoAsync(photoInputs, ContainerPhotoCategory.Front, photoFront, ct);
        await AddPhotoAsync(photoInputs, ContainerPhotoCategory.LeftSideOut, photoLeftSideOut, ct);
        await AddPhotoAsync(photoInputs, ContainerPhotoCategory.RightSideOut, photoRightSideOut, ct);
        if (photoOthers is not null)
        {
            await AddPhotoAsync(photoInputs, ContainerPhotoCategory.Others, photoOthers, ct);
        }

        return Ok(await _preforecast.SubmitAsync(
            verificationToken,
            returnDate,
            releasePath,
            photoInputs,
            UserId,
            preferredTerminalId,
            ct));
    }

    [HttpPost("{id:guid}/assign-terminal")]
    [Authorize(Policy = "YardAdmin")]
    public async Task<ActionResult<TruckerPreForecastSubmissionDto>> AssignTerminal(
        Guid id,
        [FromBody] AssignTruckerPreForecastTerminalRequest request,
        CancellationToken ct)
        => Ok(await _preforecast.AssignTerminalAsync(id, request, UserId, Role, ct));

    [HttpPost("{id:guid}/confirm-cy-schedule")]
    [Authorize(Policy = "CyStaff")]
    public async Task<ActionResult<TruckerPreForecastSubmissionDto>> ConfirmCySchedule(
        Guid id,
        [FromBody] ConfirmCyPreForecastScheduleRequest request,
        CancellationToken ct)
        => Ok(await _preforecast.ConfirmCyScheduleAsync(id, request, UserId, Role, ct));

    [HttpPost("{id:guid}/finalize-accounting")]
    [Authorize(Policy = "Accounting")]
    public async Task<ActionResult<TruckerPreForecastSubmissionDto>> FinalizeAccounting(
        Guid id,
        [FromBody] FinalizePreForecastAccountingRequest request,
        CancellationToken ct)
        => Ok(await _preforecast.FinalizeAccountingAsync(id, request, UserId, Role, ct));

    private async Task AddPhotoAsync(
        List<TruckerPreForecastPhotoInput> list,
        ContainerPhotoCategory category,
        IFormFile file,
        CancellationToken ct)
    {
        UploadGuard.Validate(file, ".png", ".jpg", ".jpeg", ".webp");
        await using var stream = file.OpenReadStream();
        var path = await _docs.SaveAsync("pre-forecast-photos", file.FileName, stream, ct);
        list.Add(new TruckerPreForecastPhotoInput(category, path, file.FileName, null));
    }
}

[ApiController]
[Route("api/v1/token")]
[Authorize(Policy = "Trucker")]
public class TruckerTokenController : ControllerBase
{
    private readonly ITruckerTokenService _tokens;
    public TruckerTokenController(ITruckerTokenService tokens) => _tokens = tokens;
    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpPost("generate")]
    public async Task<ActionResult<TruckerTokenDto>> Generate(CancellationToken ct)
        => Ok(await _tokens.GenerateAsync(UserId, ct));

    [HttpPost("refresh")]
    public async Task<ActionResult<TruckerTokenDto>> Refresh(CancellationToken ct)
        => Ok(await _tokens.RefreshAsync(UserId, ct));

    [HttpPost("revoke")]
    public async Task<IActionResult> Revoke(CancellationToken ct)
    {
        await _tokens.RevokeAsync(UserId, ct);
        return Ok(new { message = "API token revoked." });
    }
}

