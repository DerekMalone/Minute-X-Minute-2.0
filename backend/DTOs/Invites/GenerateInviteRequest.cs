using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs.Invites;

public class GenerateInviteRequest
{
    [Required]
    public Guid TeamId { get; set; }
}
