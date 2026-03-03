using Backend.Data;
using Backend.DTOs.Teams;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services;

public class TeamService : BaseService, ITeamService
{
    public TeamService(AppDbContext context) : base(context) { }

    public async Task<TeamDto> CreateTeamAsync(string userId, string name, CancellationToken ct = default)
    {
        var trimmedName = name.Trim();
        if (string.IsNullOrEmpty(trimmedName))
            throw new ArgumentException("Team name is required.");

        var alreadyHasTeam = await _context.TeamMembers
            .AnyAsync(tm => tm.UserId == userId && tm.Role == MemberRole.HeadCoach, ct);
        if (alreadyHasTeam)
            throw new InvalidOperationException("Coach already has a team.");

        var team = new Team
        {
            Id = Guid.NewGuid(),
            Name = trimmedName,
            Sport = "lacrosse",
            CreatedBy = userId
        };
        _context.Teams.Add(team);

        var member = new TeamMember
        {
            Id = Guid.NewGuid(),
            TeamId = team.Id,
            UserId = userId,
            Role = MemberRole.HeadCoach
        };
        _context.TeamMembers.Add(member);

        await _context.SaveChangesAsync(ct);

        return new TeamDto
        {
            Id = team.Id,
            Name = team.Name,
            Sport = team.Sport,
            Role = "HeadCoach",
            CreatedAt = team.CreatedAt
        };
    }

    public async Task<TeamDto?> GetMyTeamAsync(string userId, CancellationToken ct = default)
    {
        return await _context.TeamMembers
            .Where(tm => tm.UserId == userId)
            .Include(tm => tm.Team)
            .Select(tm => new TeamDto
            {
                Id = tm.Team.Id,
                Name = tm.Team.Name,
                Sport = tm.Team.Sport,
                Role = tm.Role.ToString(),
                CreatedAt = tm.Team.CreatedAt
            })
            .FirstOrDefaultAsync(ct);
    }

    public async Task DeleteTeamAsync(string userId, Guid teamId, CancellationToken ct = default)
    {
        var isHeadCoach = await _context.TeamMembers
            .AnyAsync(tm => tm.UserId == userId && tm.TeamId == teamId && tm.Role == MemberRole.HeadCoach, ct);
        if (!isHeadCoach)
            throw new UnauthorizedAccessException("Only the head coach can delete a team.");

        var drills = await _context.Drills
            .IgnoreQueryFilters()
            .Where(d => d.TeamId == teamId)
            .ToListAsync(ct);
        _context.Drills.RemoveRange(drills);

        var team = await _context.Teams.FindAsync([teamId], ct);
        if (team != null)
            _context.Teams.Remove(team);

        await _context.SaveChangesAsync(ct);
    }
}
