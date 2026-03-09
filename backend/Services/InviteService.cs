using System.Security.Cryptography;
using Backend.Data;
using Backend.DTOs.Invites;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services;

public class InviteService : BaseService, IInviteService
{
    public InviteService(AppDbContext context) : base(context) { }

    public async Task<InviteDto?> GetActiveInviteAsync(string userId, Guid teamId, CancellationToken ct = default)
    {
        await ValidateTeamAccess(userId, teamId, ct);

        var invite = await _context.Invites
            .Where(i => i.TeamId == teamId && i.RevokedAt == null && i.ExpiresAt > DateTime.UtcNow)
            .FirstOrDefaultAsync(ct);

        if (invite == null) return null;

        return new InviteDto
        {
            Id = invite.Id,
            Token = invite.Token,
            ExpiresAt = invite.ExpiresAt,
            CreatedAt = invite.CreatedAt
        };
    }

    public async Task<ValidateInviteDto> ValidateInviteAsync(string token, CancellationToken ct = default)
    {
        var invite = await _context.Invites
            .Include(i => i.Team)
            .Where(i => i.Token == token && i.RevokedAt == null && i.ExpiresAt > DateTime.UtcNow)
            .FirstOrDefaultAsync(ct);

        if (invite == null)
            throw new KeyNotFoundException("Invite not found or expired.");

        return new ValidateInviteDto
        {
            TeamId = invite.TeamId,
            TeamName = invite.Team.Name
        };
    }

    public async Task<Guid> RedeemInviteAsync(string userId, string token, CancellationToken ct = default)
    {
        var invite = await _context.Invites
            .Where(i => i.Token == token && i.RevokedAt == null && i.ExpiresAt > DateTime.UtcNow)
            .FirstOrDefaultAsync(ct);

        if (invite == null)
            throw new InvalidOperationException("Invite is invalid or has expired.");

        var alreadyMember = await _context.TeamMembers
            .AnyAsync(tm => tm.UserId == userId && tm.TeamId == invite.TeamId, ct);

        if (alreadyMember)
            return invite.TeamId;

        _context.TeamMembers.Add(new TeamMember
        {
            Id = Guid.NewGuid(),
            TeamId = invite.TeamId,
            UserId = userId,
            Role = MemberRole.Player
        });

        await _context.SaveChangesAsync(ct);

        return invite.TeamId;
    }

    public async Task<InviteDto> GenerateInviteAsync(string userId, Guid teamId, CancellationToken ct = default)
    {
        await ValidateTeamAccess(userId, teamId, ct);

        var isHeadCoach = await _context.TeamMembers
            .AnyAsync(tm => tm.UserId == userId && tm.TeamId == teamId && tm.Role == MemberRole.HeadCoach, ct);
        if (!isHeadCoach)
            throw new UnauthorizedAccessException("Only the head coach can generate invite links.");

        var existingInvites = await _context.Invites
            .Where(i => i.TeamId == teamId && i.RevokedAt == null)
            .ToListAsync(ct);

        foreach (var invite in existingInvites)
            invite.RevokedAt = DateTime.UtcNow;

        var token = Convert.ToHexString(RandomNumberGenerator.GetBytes(32)).ToLowerInvariant();

        var newInvite = new Invite
        {
            Id = Guid.NewGuid(),
            TeamId = teamId,
            Token = token,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            CreatedBy = userId
        };
        _context.Invites.Add(newInvite);

        await _context.SaveChangesAsync(ct);

        return new InviteDto
        {
            Id = newInvite.Id,
            Token = newInvite.Token,
            ExpiresAt = newInvite.ExpiresAt,
            CreatedAt = newInvite.CreatedAt
        };
    }
}
