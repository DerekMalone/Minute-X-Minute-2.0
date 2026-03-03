namespace Backend.Models;

// Minimal stub — full Drill properties (Description, DurationMinutes, etc.) added in Story 3.1
public class Drill
{
    public Guid Id { get; set; }
    public Guid TeamId { get; set; }
    public Team Team { get; set; } = null!;
    public required string Name { get; set; }
    public DateTime? DeletedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
