using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs.Invites;

public class RedeemInviteRequest
{
    [Required]
    public string Token { get; set; } = string.Empty;
}
