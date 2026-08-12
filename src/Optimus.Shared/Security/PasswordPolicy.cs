using System.Text.RegularExpressions;

namespace Optimus.Shared.Security;

public static class PasswordPolicy
{
    public const string RequirementMessage =
        "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.";

    public static bool IsStrong(string? password)
    {
        if (string.IsNullOrEmpty(password) || password.Length < 8)
        {
            return false;
        }

        return Regex.IsMatch(password, "[A-Z]")
            && Regex.IsMatch(password, "[a-z]")
            && Regex.IsMatch(password, "\\d")
            && Regex.IsMatch(password, "[^A-Za-z0-9]");
    }
}
