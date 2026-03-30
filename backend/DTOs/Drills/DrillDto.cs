namespace Backend.DTOs.Drills;

public class DrillDto
{
    public Guid Id { get; set; }
    public Guid TeamId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Category { get; set; }
    public string? Difficulty { get; set; }
    public int? DurationMinutes { get; set; }
    public string[] PositionTags { get; set; } = [];
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
