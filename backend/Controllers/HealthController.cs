using Microsoft.AspNetCore.Mvc;
using Backend.Data;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    private readonly AppDbContext _context;

    public HealthController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("test")]
    public async Task<IActionResult> TestConnection()
    {
        try
        {
            // Attempt to connect to the database
            await _context.Database.CanConnectAsync();

            return Ok(new
            {
                status = "connected",
                message = "Backend and database are running successfully",
                timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                status = "error",
                message = "Failed to connect to database",
                error = ex.Message,
                timestamp = DateTime.UtcNow
            });
        }
    }
}
