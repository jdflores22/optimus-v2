using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Optimus.Api.Security;
using Optimus.Application.Auth.Dtos;
using Optimus.Application.Auth.Interfaces;
using Optimus.Infrastructure.Persistence;
using Optimus.Infrastructure.Storage;
using Optimus.Shared.Constants;

namespace Optimus.Api.Controllers;

[ApiController]
[Route("api/hierarchy")]
[Authorize(Policy = "StaffHierarchy")]
public class HierarchyController : ControllerBase
{
    private static readonly string[] ShippingAdminInviteRoles =
    {
        AppRoles.SlStaff,
        AppRoles.Evaluator,
        AppRoles.Accounting,
        AppRoles.TerminalTeam,
    };

    private readonly IHierarchyService _hierarchyService;
    private readonly IRoleAcceptanceService _roleAcceptanceService;

    public HierarchyController(IHierarchyService hierarchyService, IRoleAcceptanceService roleAcceptanceService)
    {
        _hierarchyService = hierarchyService;
        _roleAcceptanceService = roleAcceptanceService;
    }

    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    private string Role => User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;

    [HttpGet("users")]
    public async Task<ActionResult<IReadOnlyList<UserDto>>> ListUsers(CancellationToken cancellationToken)
        => Ok(await _hierarchyService.ListUsersAsync(UserId, Role, cancellationToken));

    [HttpPost("users/{id:guid}/unlock")]
    [Authorize(Policy = "SystemAdmin")]
    public async Task<IActionResult> Unlock(Guid id, CancellationToken cancellationToken)
    {
        await _hierarchyService.UnlockUserAsync(id, cancellationToken);
        return NoContent();
    }

    [HttpGet("users/export")]
    [Authorize(Policy = "SystemAdmin")]
    public async Task<IActionResult> Export(CancellationToken cancellationToken)
    {
        var bytes = await _hierarchyService.ExportUsersCsvAsync(cancellationToken);
        return File(bytes, "text/csv", "optimus-users.csv");
    }

    [HttpGet("invitations")]
    [Authorize(Policy = "ShippingAdmin")]
    public async Task<ActionResult<IReadOnlyList<PendingUserDto>>> Invitations(CancellationToken cancellationToken)
        => Ok(await _roleAcceptanceService.ListPendingAsync(cancellationToken));

    [HttpPost("invitations")]
    [Authorize(Policy = "ShippingAdmin")]
    public async Task<ActionResult<PendingUserDto>> Invite([FromBody] InviteUserRequest request, CancellationToken cancellationToken)
    {
        var invite = request;
        if (Role == AppRoles.ShippingLinesAdmin)
        {
            if (!ShippingAdminInviteRoles.Contains(request.Role))
            {
                return BadRequest(new { message = "Shipping Lines Admin can only invite SlStaff, Evaluator, Accounting, or TerminalTeam." });
            }

            var me = await _hierarchyService.ListUsersAsync(UserId, Role, cancellationToken);
            var self = me.FirstOrDefault(u => u.Id == UserId);
            invite = request with
            {
                ShippingLineId = self?.ManagedShippingLineId ?? request.ShippingLineId,
                ShippingLineAdminId = UserId,
            };
        }

        return Ok(await _roleAcceptanceService.InviteAsync(invite, UserId, cancellationToken));
    }
}

[ApiController]
[Route("api/workspace")]
[Authorize(Policy = "Broker")]
public class WorkspaceController : ControllerBase
{
    private readonly IWorkspaceService _workspaceService;

    public WorkspaceController(IWorkspaceService workspaceService)
    {
        _workspaceService = workspaceService;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<WorkspaceDto>>> List(CancellationToken cancellationToken)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        return Ok(await _workspaceService.ListBrokerWorkspacesAsync(userId, cancellationToken));
    }

    [HttpPost("switch")]
    public async Task<ActionResult<AuthResponse>> Switch([FromBody] SwitchWorkspaceRequest request, CancellationToken cancellationToken)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        return Ok(await _workspaceService.SwitchWorkspaceAsync(userId, request, ip, cancellationToken));
    }
}

[ApiController]
[Route("api/me")]
[Authorize]
public class MeController : ControllerBase
{
    private readonly IHierarchyService _hierarchyService;
    private readonly OptimusDbContext _db;
    private readonly IUploadRootProvider _uploads;

    public MeController(
        IHierarchyService hierarchyService,
        OptimusDbContext db,
        IUploadRootProvider uploads)
    {
        _hierarchyService = hierarchyService;
        _db = db;
        _uploads = uploads;
    }

    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<ActionResult<UserDto>> Me(CancellationToken cancellationToken)
    {
        var me = await _hierarchyService.GetUserByIdAsync(UserId, cancellationToken);
        return me is null ? NotFound() : Ok(me);
    }

    [HttpPut]
    public async Task<ActionResult<UserDto>> UpdateProfile(
        [FromBody] UpdateProfileRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await _hierarchyService.UpdateProfileAsync(UserId, request, cancellationToken));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpPost("profile-photo")]
    [RequestSizeLimit(UploadGuard.MaxBytes)]
    public async Task<ActionResult<UserDto>> UploadProfilePhoto(IFormFile file, CancellationToken cancellationToken)
    {
        UploadGuard.Validate(file, ".png", ".jpg", ".jpeg", ".webp", ".gif");

        var user = await _db.Users.FirstOrDefaultAsync(x => x.Id == UserId, cancellationToken);
        if (user is null)
        {
            return NotFound();
        }

        await DeleteProfilePhotoFileAsync(user.ProfilePhotoPath);

        var roleFolder = user.Role.ToLowerInvariant();
        var uploadsDir = Path.Combine(_uploads.RootDirectory, roleFolder, "profile-picture");
        Directory.CreateDirectory(uploadsDir);

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        var fileName = $"{user.Id:N}-{Guid.NewGuid():N}{ext}";
        var fullPath = Path.Combine(uploadsDir, fileName);
        await using (var input = file.OpenReadStream())
        {
            await ProfilePhotoProcessor.SaveAsync(input, fullPath, ext, cancellationToken);
        }

        user.ProfilePhotoPath = $"/uploads/{roleFolder}/profile-picture/{fileName}";
        await _db.SaveChangesAsync(cancellationToken);

        var dto = await _hierarchyService.GetUserByIdAsync(UserId, cancellationToken);
        return dto is null ? NotFound() : Ok(dto);
    }

    [HttpDelete("profile-photo")]
    public async Task<ActionResult<UserDto>> RemoveProfilePhoto(CancellationToken cancellationToken)
    {
        var user = await _db.Users.FirstOrDefaultAsync(x => x.Id == UserId, cancellationToken);
        if (user is null)
        {
            return NotFound();
        }

        if (string.IsNullOrWhiteSpace(user.ProfilePhotoPath))
        {
            return BadRequest(new { message = "No profile photo to remove." });
        }

        await DeleteProfilePhotoFileAsync(user.ProfilePhotoPath);
        user.ProfilePhotoPath = null;
        await _db.SaveChangesAsync(cancellationToken);

        var dto = await _hierarchyService.GetUserByIdAsync(UserId, cancellationToken);
        return dto is null ? NotFound() : Ok(dto);
    }

    private Task DeleteProfilePhotoFileAsync(string? webPath)
    {
        if (string.IsNullOrWhiteSpace(webPath))
        {
            return Task.CompletedTask;
        }

        var fullPath = _uploads.ResolveExistingFile(webPath);
        if (fullPath is not null && System.IO.File.Exists(fullPath))
        {
            System.IO.File.Delete(fullPath);
        }

        return Task.CompletedTask;
    }
}
