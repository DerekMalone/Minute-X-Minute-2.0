using Backend.DTOs.Drills;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DrillsController : ControllerBase
{
    private readonly IDrillService _drillService;

    public DrillsController(IDrillService drillService)
    {
        _drillService = drillService;
    }

    [HttpPost]
    public async Task<IActionResult> CreateDrill([FromQuery] Guid teamId, [FromBody] CreateDrillRequest request, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (userId == null) return Unauthorized();

        try
        {
            var drill = await _drillService.CreateDrillAsync(userId, teamId, request, ct);
            return CreatedAtAction(nameof(GetDrills), new { teamId }, drill);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { detail = ex.Message });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    [HttpGet]
    public async Task<IActionResult> GetDrills([FromQuery] Guid teamId, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (userId == null) return Unauthorized();

        try
        {
            var drills = await _drillService.GetDrillsByTeamAsync(userId, teamId, ct);
            return Ok(drills);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }
}
