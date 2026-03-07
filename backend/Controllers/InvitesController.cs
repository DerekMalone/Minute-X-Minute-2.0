using Backend.DTOs.Invites;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class InvitesController : ControllerBase
{
    private readonly IInviteService _inviteService;

    public InvitesController(IInviteService inviteService)
    {
        _inviteService = inviteService;
    }

    [HttpPost]
    public async Task<IActionResult> GenerateInvite([FromBody] GenerateInviteRequest request, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (userId == null) return Unauthorized();

        try
        {
            var invite = await _inviteService.GenerateInviteAsync(userId, request.TeamId, ct);
            return CreatedAtAction(nameof(GetActiveInvite), new { teamId = request.TeamId }, invite);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    [HttpGet("active")]
    public async Task<IActionResult> GetActiveInvite([FromQuery] Guid teamId, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (userId == null) return Unauthorized();

        try
        {
            var invite = await _inviteService.GetActiveInviteAsync(userId, teamId, ct);
            return invite == null ? NotFound() : Ok(invite);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }
}
