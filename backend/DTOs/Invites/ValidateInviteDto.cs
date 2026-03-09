namespace Backend.DTOs.Invites;

public class ValidateInviteDto
{
    public Guid TeamId { get; set; }
    public string TeamName { get; set; } = string.Empty;
}
