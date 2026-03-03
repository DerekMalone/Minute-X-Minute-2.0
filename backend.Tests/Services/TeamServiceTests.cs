using Backend.Data;
using Backend.Models;
using Backend.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Backend.Tests.Services;

public class TeamServiceTests
{
    private static AppDbContext CreateContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task CreateTeamAsync_CreatesTeamAndHeadCoachMember()
    {
        using var ctx = CreateContext(nameof(CreateTeamAsync_CreatesTeamAndHeadCoachMember));
        var svc = new TeamService(ctx);

        var dto = await svc.CreateTeamAsync("user-1", "Test Team");

        Assert.Equal("Test Team", dto.Name);
        Assert.Equal("HeadCoach", dto.Role);
        Assert.Equal(1, await ctx.Teams.CountAsync());
        Assert.Equal(1, await ctx.TeamMembers.CountAsync());
        var member = await ctx.TeamMembers.FirstAsync();
        Assert.Equal(MemberRole.HeadCoach, member.Role);
        Assert.Equal("user-1", member.UserId);
    }

    [Fact]
    public async Task CreateTeamAsync_TrimsAndRejectsWhitespaceName()
    {
        using var ctx = CreateContext(nameof(CreateTeamAsync_TrimsAndRejectsWhitespaceName));
        var svc = new TeamService(ctx);

        await Assert.ThrowsAsync<ArgumentException>(() => svc.CreateTeamAsync("user-1", "   "));
    }

    [Fact]
    public async Task CreateTeamAsync_ThrowsWhenCoachAlreadyHasTeam()
    {
        using var ctx = CreateContext(nameof(CreateTeamAsync_ThrowsWhenCoachAlreadyHasTeam));
        var svc = new TeamService(ctx);
        await svc.CreateTeamAsync("user-1", "First Team");

        await Assert.ThrowsAsync<InvalidOperationException>(() => svc.CreateTeamAsync("user-1", "Second Team"));
    }

    [Fact]
    public async Task GetMyTeamAsync_ReturnsNullWhenNoTeam()
    {
        using var ctx = CreateContext(nameof(GetMyTeamAsync_ReturnsNullWhenNoTeam));
        var svc = new TeamService(ctx);

        var result = await svc.GetMyTeamAsync("user-1");

        Assert.Null(result);
    }

    [Fact]
    public async Task GetMyTeamAsync_ReturnsDtoWhenTeamExists()
    {
        using var ctx = CreateContext(nameof(GetMyTeamAsync_ReturnsDtoWhenTeamExists));
        var svc = new TeamService(ctx);
        await svc.CreateTeamAsync("user-1", "My Team");

        var result = await svc.GetMyTeamAsync("user-1");

        Assert.NotNull(result);
        Assert.Equal("My Team", result.Name);
        Assert.Equal("HeadCoach", result.Role);
    }

    [Fact]
    public async Task DeleteTeamAsync_ThrowsWhenUserIsNotHeadCoach()
    {
        using var ctx = CreateContext(nameof(DeleteTeamAsync_ThrowsWhenUserIsNotHeadCoach));
        var svc = new TeamService(ctx);
        var team = await svc.CreateTeamAsync("coach-1", "Team");

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            svc.DeleteTeamAsync("player-1", team.Id, default));
    }

    [Fact]
    public async Task DeleteTeamAsync_DeletesTeamAndMembers()
    {
        using var ctx = CreateContext(nameof(DeleteTeamAsync_DeletesTeamAndMembers));
        var svc = new TeamService(ctx);
        var team = await svc.CreateTeamAsync("coach-1", "Team");

        await svc.DeleteTeamAsync("coach-1", team.Id, default);

        Assert.Equal(0, await ctx.Teams.CountAsync());
        Assert.Equal(0, await ctx.TeamMembers.CountAsync());
    }

    [Fact]
    public async Task DeleteTeamAsync_DeletesDrillsIncludingSoftDeleted()
    {
        using var ctx = CreateContext(nameof(DeleteTeamAsync_DeletesDrillsIncludingSoftDeleted));
        var svc = new TeamService(ctx);
        var teamDto = await svc.CreateTeamAsync("coach-1", "Team");

        var team = await ctx.Teams.FindAsync(teamDto.Id);
        ctx.Drills.Add(new Drill { Id = Guid.NewGuid(), TeamId = teamDto.Id, Name = "Active Drill", Team = team! });
        ctx.Drills.Add(new Drill { Id = Guid.NewGuid(), TeamId = teamDto.Id, Name = "Deleted Drill", Team = team!, DeletedAt = DateTime.UtcNow });
        await ctx.SaveChangesAsync();

        await svc.DeleteTeamAsync("coach-1", teamDto.Id, default);

        Assert.Equal(0, await ctx.Drills.IgnoreQueryFilters().CountAsync());
    }
}
