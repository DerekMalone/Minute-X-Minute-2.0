using Backend.Data;
using Backend.DTOs.Drills;
using Backend.Models;
using Backend.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Backend.Tests.Services;

public class DrillServiceTests
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

    // --- CreateDrillAsync tests ---

    [Fact]
    public async Task CreateDrillAsync_CreatesDrill_WhenValidRequest()
    {
        using var ctx = CreateContext(nameof(CreateDrillAsync_CreatesDrill_WhenValidRequest));
        var svc = new DrillService(ctx);
        var (team, _) = await SeedTeamWithHeadCoach(ctx);
        var request = new CreateDrillRequest { Name = "Box Drill" };

        var dto = await svc.CreateDrillAsync("coach-1", team.Id, request, CancellationToken.None);

        Assert.NotNull(dto);
        Assert.Equal("Box Drill", dto.Name);
        Assert.Equal(team.Id, dto.TeamId);
        Assert.NotEqual(Guid.Empty, dto.Id);

        var saved = await ctx.Drills.FindAsync(dto.Id);
        Assert.NotNull(saved);
        Assert.Equal("Box Drill", saved.Name);
    }

    [Fact]
    public async Task CreateDrillAsync_ThrowsArgumentException_WhenNameEmpty()
    {
        using var ctx = CreateContext(nameof(CreateDrillAsync_ThrowsArgumentException_WhenNameEmpty));
        var svc = new DrillService(ctx);
        var (team, _) = await SeedTeamWithHeadCoach(ctx);
        var request = new CreateDrillRequest { Name = "" };

        await Assert.ThrowsAsync<ArgumentException>(() =>
            svc.CreateDrillAsync("coach-1", team.Id, request, CancellationToken.None));
    }

    [Fact]
    public async Task CreateDrillAsync_ThrowsArgumentException_WhenNameWhitespace()
    {
        using var ctx = CreateContext(nameof(CreateDrillAsync_ThrowsArgumentException_WhenNameWhitespace));
        var svc = new DrillService(ctx);
        var (team, _) = await SeedTeamWithHeadCoach(ctx);
        var request = new CreateDrillRequest { Name = "   " };

        await Assert.ThrowsAsync<ArgumentException>(() =>
            svc.CreateDrillAsync("coach-1", team.Id, request, CancellationToken.None));
    }

    [Fact]
    public async Task CreateDrillAsync_ThrowsUnauthorized_WhenNotTeamMember()
    {
        using var ctx = CreateContext(nameof(CreateDrillAsync_ThrowsUnauthorized_WhenNotTeamMember));
        var svc = new DrillService(ctx);
        var (team, _) = await SeedTeamWithHeadCoach(ctx);
        var request = new CreateDrillRequest { Name = "Box Drill" };

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            svc.CreateDrillAsync("non-member", team.Id, request, CancellationToken.None));
    }

    [Fact]
    public async Task CreateDrillAsync_TrimsName_WhenLeadingTrailingSpaces()
    {
        using var ctx = CreateContext(nameof(CreateDrillAsync_TrimsName_WhenLeadingTrailingSpaces));
        var svc = new DrillService(ctx);
        var (team, _) = await SeedTeamWithHeadCoach(ctx);
        var request = new CreateDrillRequest { Name = "  Box Drill  " };

        var dto = await svc.CreateDrillAsync("coach-1", team.Id, request, CancellationToken.None);

        Assert.Equal("Box Drill", dto.Name);
    }

    // --- GetDrillsByTeamAsync tests ---

    [Fact]
    public async Task GetDrillsByTeamAsync_ReturnsEmpty_WhenNoDrills()
    {
        using var ctx = CreateContext(nameof(GetDrillsByTeamAsync_ReturnsEmpty_WhenNoDrills));
        var svc = new DrillService(ctx);
        var (team, _) = await SeedTeamWithHeadCoach(ctx);

        var result = await svc.GetDrillsByTeamAsync("coach-1", team.Id, CancellationToken.None);

        Assert.Empty(result);
    }

    [Fact]
    public async Task GetDrillsByTeamAsync_ReturnsDrills_OrderedByCreatedAtDesc()
    {
        using var ctx = CreateContext(nameof(GetDrillsByTeamAsync_ReturnsDrills_OrderedByCreatedAtDesc));
        var svc = new DrillService(ctx);
        var (team, _) = await SeedTeamWithHeadCoach(ctx);

        // Seed two drills with distinct timestamps
        var drill1 = new Drill { Id = Guid.NewGuid(), TeamId = team.Id, Name = "Drill A", CreatedAt = DateTime.UtcNow.AddMinutes(-5), UpdatedAt = DateTime.UtcNow.AddMinutes(-5) };
        var drill2 = new Drill { Id = Guid.NewGuid(), TeamId = team.Id, Name = "Drill B", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        ctx.Drills.AddRange(drill1, drill2);
        await ctx.SaveChangesAsync();

        var result = await svc.GetDrillsByTeamAsync("coach-1", team.Id, CancellationToken.None);

        Assert.Equal(2, result.Count);
        Assert.Equal("Drill B", result[0].Name); // newer first
        Assert.Equal("Drill A", result[1].Name);
    }

    [Fact]
    public async Task GetDrillsByTeamAsync_ThrowsUnauthorized_WhenNotTeamMember()
    {
        using var ctx = CreateContext(nameof(GetDrillsByTeamAsync_ThrowsUnauthorized_WhenNotTeamMember));
        var svc = new DrillService(ctx);
        var (team, _) = await SeedTeamWithHeadCoach(ctx);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            svc.GetDrillsByTeamAsync("non-member", team.Id, CancellationToken.None));
    }

    [Fact]
    public async Task GetDrillsByTeamAsync_ExcludesSoftDeletedDrills()
    {
        using var ctx = CreateContext(nameof(GetDrillsByTeamAsync_ExcludesSoftDeletedDrills));
        var svc = new DrillService(ctx);
        var (team, _) = await SeedTeamWithHeadCoach(ctx);

        var activeDrill = new Drill { Id = Guid.NewGuid(), TeamId = team.Id, Name = "Active Drill", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        var deletedDrill = new Drill { Id = Guid.NewGuid(), TeamId = team.Id, Name = "Deleted Drill", CreatedAt = DateTime.UtcNow.AddMinutes(-10), UpdatedAt = DateTime.UtcNow.AddMinutes(-10), DeletedAt = DateTime.UtcNow.AddMinutes(-5) };
        ctx.Drills.AddRange(activeDrill, deletedDrill);
        await ctx.SaveChangesAsync();

        var result = await svc.GetDrillsByTeamAsync("coach-1", team.Id, CancellationToken.None);

        Assert.Single(result);
        Assert.Equal("Active Drill", result[0].Name);
    }
}
