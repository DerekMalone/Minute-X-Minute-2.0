using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs.Drills;

public class CreateDrillRequest
{
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Description { get; set; }

    [MaxLength(100)]
    public string? Category { get; set; }

    [MaxLength(50)]
    public string? Difficulty { get; set; }

    [Range(1, 480)]
    public int? DurationMinutes { get; set; }

    public string[]? PositionTags { get; set; }
}
