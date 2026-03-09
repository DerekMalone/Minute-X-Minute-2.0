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

    [HttpGet("validate")]
    [AllowAnonymous]
    public async Task<IActionResult> ValidateInvite([FromQuery] string token, CancellationToken ct)
    {
        if (string.IsNullOrEmpty(token)) return BadRequest();

        try
        {
            var dto = await _inviteService.ValidateInviteAsync(token, ct);
            return Ok(dto);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpPost("redeem")]
    public async Task<IActionResult> RedeemInvite([FromBody] RedeemInviteRequest request, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (userId == null) return Unauthorized();

        try
        {
            var teamId = await _inviteService.RedeemInviteAsync(userId, request.Token, ct);
            return Ok(new { teamId });
        }
        catch (InvalidOperationException)
        {
            return Conflict("Invite is no longer valid.");
        }
    }
}
