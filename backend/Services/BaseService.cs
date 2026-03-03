using Backend.Data;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services;

public abstract class BaseService
{
    protected readonly AppDbContext _context;

    protected BaseService(AppDbContext context)
    {
        _context = context;
    }

    protected async Task ValidateTeamAccess(string userId, Guid teamId, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrEmpty(userId))
            throw new UnauthorizedAccessException("Invalid user identity.");

        var isMember = await _context.TeamMembers
            .AnyAsync(tm => tm.UserId == userId && tm.TeamId == teamId, cancellationToken);

        if (!isMember)
            throw new UnauthorizedAccessException("User is not a member of this team.");
    }
}
