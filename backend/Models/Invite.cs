namespace Backend.Models;

public class Invite
{
    public Guid Id { get; set; }
    public Guid TeamId { get; set; }
    public required string Token { get; set; }
    public string Role { get; set; } = "Player";
    public DateTime ExpiresAt { get; set; }
    public DateTime? RevokedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public required string CreatedBy { get; set; }

    public Team Team { get; set; } = null!;
}
