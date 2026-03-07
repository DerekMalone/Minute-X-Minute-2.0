namespace Backend.Models;

public class Team
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public string Sport { get; set; } = "lacrosse";
    public required string CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public ICollection<TeamMember> TeamMembers { get; set; } = [];
    public ICollection<Drill> Drills { get; set; } = [];
    public ICollection<Invite> Invites { get; set; } = [];
}
