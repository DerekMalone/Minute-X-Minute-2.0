using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs.Teams;

public class CreateTeamRequest
{
    [Required]
    [MinLength(1)]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;
}
