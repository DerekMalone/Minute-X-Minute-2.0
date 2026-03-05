using Backend.DTOs.Teams;

namespace Backend.Services;

public interface ITeamService
{
    Task<TeamDto> CreateTeamAsync(string userId, string name, CancellationToken ct = default);
    Task<TeamDto?> GetMyTeamAsync(string userId, CancellationToken ct = default);
    Task DeleteTeamAsync(string userId, Guid teamId, CancellationToken ct = default);
}
