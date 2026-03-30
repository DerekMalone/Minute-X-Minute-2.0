using Backend.DTOs.Drills;

namespace Backend.Services;

public interface IDrillService
{
    Task<DrillDto> CreateDrillAsync(string userId, Guid teamId, CreateDrillRequest request, CancellationToken ct);
    Task<IReadOnlyList<DrillDto>> GetDrillsByTeamAsync(string userId, Guid teamId, CancellationToken ct);
}
