using Backend.Data;
using Backend.DTOs.Drills;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services;

public class DrillService : BaseService, IDrillService
{
    public DrillService(AppDbContext context) : base(context)
    {
    }

    public async Task<DrillDto> CreateDrillAsync(string userId, Guid teamId, CreateDrillRequest request, CancellationToken ct)
    {
        await ValidateTeamAccess(userId, teamId, ct);

        var name = request.Name.Trim();
        if (string.IsNullOrEmpty(name))
            throw new ArgumentException("Drill name is required.");

        var drill = new Drill
        {
            Id = Guid.NewGuid(),
            TeamId = teamId,
            Name = name,
            Description = request.Description,
            Category = request.Category,
            Difficulty = request.Difficulty,
            DurationMinutes = request.DurationMinutes,
            PositionTags = request.PositionTags ?? [],
        };

        _context.Drills.Add(drill);
        await _context.SaveChangesAsync(ct);

        return ToDto(drill);
    }

    public async Task<IReadOnlyList<DrillDto>> GetDrillsByTeamAsync(string userId, Guid teamId, CancellationToken ct)
    {
        await ValidateTeamAccess(userId, teamId, ct);

        var drills = await _context.Drills
            .Where(d => d.TeamId == teamId)
            .OrderByDescending(d => d.CreatedAt)
            .ToListAsync(ct);

        return drills.Select(ToDto).ToList();
    }

    private static DrillDto ToDto(Drill drill) => new()
    {
        Id = drill.Id,
        TeamId = drill.TeamId,
        Name = drill.Name,
        Description = drill.Description,
        Category = drill.Category,
        Difficulty = drill.Difficulty,
        DurationMinutes = drill.DurationMinutes,
        PositionTags = drill.PositionTags,
        CreatedAt = drill.CreatedAt,
        UpdatedAt = drill.UpdatedAt,
    };
}
