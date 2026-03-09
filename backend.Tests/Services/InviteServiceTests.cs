using Backend.Data;
using Backend.Models;
using Backend.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Backend.Tests.Services;

public class InviteServiceTests
{
    private static AppDbContext CreateContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;
        return new AppDbContext(options);
    }

    private static async Task<(Team team, TeamMember member)> SeedTeamWithHeadCoach(AppDbContext ctx, string userId = "coach-1")
    {
        var team = new Team { Id = Guid.NewGuid(), Name = "Test Team", CreatedBy = userId };
        ctx.Teams.Add(team);
        var member = new TeamMember { Id = Guid.NewGuid(), TeamId = team.Id, UserId = userId, Role = MemberRole.HeadCoach };
        ctx.TeamMembers.Add(member);
        await ctx.SaveChangesAsync();
        return (team, member);
    }

    [Fact]
    public async Task GenerateInviteAsync_CreatesInviteWithCorrectExpiry()
    {
        using var ctx = CreateContext(nameof(GenerateInviteAsync_CreatesInviteWithCorrectExpiry));
        var svc = new InviteService(ctx);
        var (team, _) = await SeedTeamWithHeadCoach(ctx);

        var before = DateTime.UtcNow;
        var dto = await svc.GenerateInviteAsync("coach-1", team.Id);
        var after = DateTime.UtcNow;

        Assert.NotNull(dto);
        Assert.NotEmpty(dto.Token);
        Assert.True(dto.ExpiresAt >= before.AddDays(7));
        Assert.True(dto.ExpiresAt <= after.AddDays(7).AddSeconds(1));
    }

    [Fact]
    public async Task GenerateInviteAsync_RevokesExistingTokens()
    {
        using var ctx = CreateContext(nameof(GenerateInviteAsync_RevokesExistingTokens));
        var svc = new InviteService(ctx);
        var (team, _) = await SeedTeamWithHeadCoach(ctx);

        var existing = new Invite
        {
            Id = Guid.NewGuid(),
            TeamId = team.Id,
            Token = "oldtoken",
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            CreatedBy = "coach-1"
        };
        ctx.Invites.Add(existing);
        await ctx.SaveChangesAsync();

        await svc.GenerateInviteAsync("coach-1", team.Id);

        var revoked = await ctx.Invites.FindAsync(existing.Id);
        Assert.NotNull(revoked!.RevokedAt);
    }

    [Fact]
    public async Task GenerateInviteAsync_ThrowsUnauthorized_WhenNotHeadCoach()
    {
        using var ctx = CreateContext(nameof(GenerateInviteAsync_ThrowsUnauthorized_WhenNotHeadCoach));
        var svc = new InviteService(ctx);
        var (team, _) = await SeedTeamWithHeadCoach(ctx);

        var player = new TeamMember { Id = Guid.NewGuid(), TeamId = team.Id, UserId = "player-1", Role = MemberRole.Player };
        ctx.TeamMembers.Add(player);
        await ctx.SaveChangesAsync();

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            svc.GenerateInviteAsync("player-1", team.Id));
    }

    [Fact]
    public async Task GenerateInviteAsync_ThrowsUnauthorized_WhenNotTeamMember()
    {
        using var ctx = CreateContext(nameof(GenerateInviteAsync_ThrowsUnauthorized_WhenNotTeamMember));
        var svc = new InviteService(ctx);
        var (team, _) = await SeedTeamWithHeadCoach(ctx);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            svc.GenerateInviteAsync("nobody", team.Id));
    }

    [Fact]
    public async Task GetActiveInviteAsync_ReturnsNull_WhenNoActiveInvite()
    {
        using var ctx = CreateContext(nameof(GetActiveInviteAsync_ReturnsNull_WhenNoActiveInvite));
        var svc = new InviteService(ctx);
        var (team, _) = await SeedTeamWithHeadCoach(ctx);

        var result = await svc.GetActiveInviteAsync("coach-1", team.Id);

        Assert.Null(result);
    }

    [Fact]
    public async Task GetActiveInviteAsync_ReturnsNull_WhenInviteExpired()
    {
        using var ctx = CreateContext(nameof(GetActiveInviteAsync_ReturnsNull_WhenInviteExpired));
        var svc = new InviteService(ctx);
        var (team, _) = await SeedTeamWithHeadCoach(ctx);

        ctx.Invites.Add(new Invite
        {
            Id = Guid.NewGuid(),
            TeamId = team.Id,
            Token = "expiredtoken",
            ExpiresAt = DateTime.UtcNow.AddDays(-1),
            CreatedBy = "coach-1"
        });
        await ctx.SaveChangesAsync();

        var result = await svc.GetActiveInviteAsync("coach-1", team.Id);

        Assert.Null(result);
    }

    [Fact]
    public async Task GetActiveInviteAsync_ReturnsNull_WhenInviteRevoked()
    {
        using var ctx = CreateContext(nameof(GetActiveInviteAsync_ReturnsNull_WhenInviteRevoked));
        var svc = new InviteService(ctx);
        var (team, _) = await SeedTeamWithHeadCoach(ctx);

        ctx.Invites.Add(new Invite
        {
            Id = Guid.NewGuid(),
            TeamId = team.Id,
            Token = "revokedtoken",
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            RevokedAt = DateTime.UtcNow,
            CreatedBy = "coach-1"
        });
        await ctx.SaveChangesAsync();

        var result = await svc.GetActiveInviteAsync("coach-1", team.Id);

        Assert.Null(result);
    }

    [Fact]
    public async Task GetActiveInviteAsync_ReturnsDto_WhenActiveInviteExists()
    {
        using var ctx = CreateContext(nameof(GetActiveInviteAsync_ReturnsDto_WhenActiveInviteExists));
        var svc = new InviteService(ctx);
        var (team, _) = await SeedTeamWithHeadCoach(ctx);

        ctx.Invites.Add(new Invite
        {
            Id = Guid.NewGuid(),
            TeamId = team.Id,
            Token = "activetoken",
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            CreatedBy = "coach-1"
        });
        await ctx.SaveChangesAsync();

        var result = await svc.GetActiveInviteAsync("coach-1", team.Id);

        Assert.NotNull(result);
        Assert.Equal("activetoken", result.Token);
    }

    // --- ValidateInviteAsync tests ---

    [Fact]
    public async Task ValidateInviteAsync_ReturnsDto_WhenTokenValid()
    {
        using var ctx = CreateContext(nameof(ValidateInviteAsync_ReturnsDto_WhenTokenValid));
        var svc = new InviteService(ctx);
        var (team, _) = await SeedTeamWithHeadCoach(ctx);

        ctx.Invites.Add(new Invite
        {
            Id = Guid.NewGuid(),
            TeamId = team.Id,
            Token = "validtoken",
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            CreatedBy = "coach-1"
        });
        await ctx.SaveChangesAsync();

        var result = await svc.ValidateInviteAsync("validtoken");

        Assert.Equal(team.Id, result.TeamId);
        Assert.Equal("Test Team", result.TeamName);
    }

    [Fact]
    public async Task ValidateInviteAsync_ThrowsKeyNotFound_WhenTokenExpired()
    {
        using var ctx = CreateContext(nameof(ValidateInviteAsync_ThrowsKeyNotFound_WhenTokenExpired));
        var svc = new InviteService(ctx);
        var (team, _) = await SeedTeamWithHeadCoach(ctx);

        ctx.Invites.Add(new Invite
        {
            Id = Guid.NewGuid(),
            TeamId = team.Id,
            Token = "expiredtoken",
            ExpiresAt = DateTime.UtcNow.AddDays(-1),
            CreatedBy = "coach-1"
        });
        await ctx.SaveChangesAsync();

        await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            svc.ValidateInviteAsync("expiredtoken"));
    }

    [Fact]
    public async Task ValidateInviteAsync_ThrowsKeyNotFound_WhenTokenRevoked()
    {
        using var ctx = CreateContext(nameof(ValidateInviteAsync_ThrowsKeyNotFound_WhenTokenRevoked));
        var svc = new InviteService(ctx);
        var (team, _) = await SeedTeamWithHeadCoach(ctx);

        ctx.Invites.Add(new Invite
        {
            Id = Guid.NewGuid(),
            TeamId = team.Id,
            Token = "revokedtoken",
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            RevokedAt = DateTime.UtcNow,
            CreatedBy = "coach-1"
        });
        await ctx.SaveChangesAsync();

        await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            svc.ValidateInviteAsync("revokedtoken"));
    }

    [Fact]
    public async Task ValidateInviteAsync_ThrowsKeyNotFound_WhenTokenNotFound()
    {
        using var ctx = CreateContext(nameof(ValidateInviteAsync_ThrowsKeyNotFound_WhenTokenNotFound));
        var svc = new InviteService(ctx);
        await SeedTeamWithHeadCoach(ctx);

        await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            svc.ValidateInviteAsync("doesnotexist"));
    }

    // --- RedeemInviteAsync tests ---

    [Fact]
    public async Task RedeemInviteAsync_AddsPlayerMembership_WhenValidToken()
    {
        using var ctx = CreateContext(nameof(RedeemInviteAsync_AddsPlayerMembership_WhenValidToken));
        var svc = new InviteService(ctx);
        var (team, _) = await SeedTeamWithHeadCoach(ctx);

        ctx.Invites.Add(new Invite
        {
            Id = Guid.NewGuid(),
            TeamId = team.Id,
            Token = "validtoken",
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            CreatedBy = "coach-1"
        });
        await ctx.SaveChangesAsync();

        var result = await svc.RedeemInviteAsync("player-1", "validtoken");

        Assert.Equal(team.Id, result);
        var member = await ctx.TeamMembers
            .FirstOrDefaultAsync(tm => tm.UserId == "player-1" && tm.TeamId == team.Id);
        Assert.NotNull(member);
        Assert.Equal(MemberRole.Player, member.Role);
    }

    [Fact]
    public async Task RedeemInviteAsync_IsIdempotent_WhenAlreadyMember()
    {
        using var ctx = CreateContext(nameof(RedeemInviteAsync_IsIdempotent_WhenAlreadyMember));
        var svc = new InviteService(ctx);
        var (team, _) = await SeedTeamWithHeadCoach(ctx);

        ctx.Invites.Add(new Invite
        {
            Id = Guid.NewGuid(),
            TeamId = team.Id,
            Token = "validtoken",
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            CreatedBy = "coach-1"
        });
        ctx.TeamMembers.Add(new TeamMember
        {
            Id = Guid.NewGuid(),
            TeamId = team.Id,
            UserId = "player-1",
            Role = MemberRole.Player
        });
        await ctx.SaveChangesAsync();

        var result = await svc.RedeemInviteAsync("player-1", "validtoken");

        Assert.Equal(team.Id, result);
        var memberCount = await ctx.TeamMembers.CountAsync(tm => tm.UserId == "player-1" && tm.TeamId == team.Id);
        Assert.Equal(1, memberCount);
    }

    [Fact]
    public async Task RedeemInviteAsync_ThrowsInvalidOp_WhenTokenExpired()
    {
        using var ctx = CreateContext(nameof(RedeemInviteAsync_ThrowsInvalidOp_WhenTokenExpired));
        var svc = new InviteService(ctx);
        var (team, _) = await SeedTeamWithHeadCoach(ctx);

        ctx.Invites.Add(new Invite
        {
            Id = Guid.NewGuid(),
            TeamId = team.Id,
            Token = "expiredtoken",
            ExpiresAt = DateTime.UtcNow.AddDays(-1),
            CreatedBy = "coach-1"
        });
        await ctx.SaveChangesAsync();

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            svc.RedeemInviteAsync("player-1", "expiredtoken"));
    }

    [Fact]
    public async Task RedeemInviteAsync_ThrowsInvalidOp_WhenTokenRevoked()
    {
        using var ctx = CreateContext(nameof(RedeemInviteAsync_ThrowsInvalidOp_WhenTokenRevoked));
        var svc = new InviteService(ctx);
        var (team, _) = await SeedTeamWithHeadCoach(ctx);

        ctx.Invites.Add(new Invite
        {
            Id = Guid.NewGuid(),
            TeamId = team.Id,
            Token = "revokedtoken",
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            RevokedAt = DateTime.UtcNow,
            CreatedBy = "coach-1"
        });
        await ctx.SaveChangesAsync();

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            svc.RedeemInviteAsync("player-1", "revokedtoken"));
    }
}
