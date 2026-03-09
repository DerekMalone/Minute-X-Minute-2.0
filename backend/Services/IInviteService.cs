using Backend.DTOs.Invites;

namespace Backend.Services;

public interface IInviteService
{
    Task<InviteDto> GenerateInviteAsync(string userId, Guid teamId, CancellationToken ct = default);
    Task<InviteDto?> GetActiveInviteAsync(string userId, Guid teamId, CancellationToken ct = default);
    Task<ValidateInviteDto> ValidateInviteAsync(string token, CancellationToken ct = default);
    Task<Guid> RedeemInviteAsync(string userId, string token, CancellationToken ct = default);
}
