using Backend.DTOs.Invites;

namespace Backend.Services;

public interface IInviteService
{
    Task<InviteDto> GenerateInviteAsync(string userId, Guid teamId, CancellationToken ct = default);
    Task<InviteDto?> GetActiveInviteAsync(string userId, Guid teamId, CancellationToken ct = default);
}
