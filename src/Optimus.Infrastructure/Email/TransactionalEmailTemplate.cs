using System.Net;
using System.Text;
using Optimus.Shared.Constants;

namespace Optimus.Infrastructure.Email;

public static class TransactionalEmailTemplate
{
    private const string BrandPrimary = "#0B3D5C";
    private const string BrandPrimaryLight = "#1A5A82";
    private const string TextPrimary = "#1f2937";
    private const string TextMuted = "#6b7280";
    private const string Surface = "#ffffff";
    private const string PageBackground = "#f3f5f7";

    public static (string Text, string Html) BuildVerificationEmail(string token, string? publicUrl)
    {
        var hasLink = !string.IsNullOrWhiteSpace(publicUrl);
        var verifyUrl = hasLink
            ? $"{publicUrl!.TrimEnd('/')}/verify-email?token={Uri.EscapeDataString(token)}"
            : null;
        var logoUrl = hasLink ? $"{publicUrl!.TrimEnd('/')}/optimus-logo.png" : null;

        var text = BuildVerificationPlainText(token, verifyUrl);
        var html = BuildVerificationHtml(token, verifyUrl, logoUrl);
        return (text, html);
    }

    public static (string Text, string Html) BuildWelcomeEmail(string firstName, string role, string? publicUrl)
    {
        var displayName = string.IsNullOrWhiteSpace(firstName) ? "there" : firstName.Trim();
        var roleContent = ResolveRoleWelcomeContent(role);
        var loginUrl = string.IsNullOrWhiteSpace(publicUrl) ? null : $"{publicUrl!.TrimEnd('/')}/login";
        var logoUrl = string.IsNullOrWhiteSpace(publicUrl) ? null : $"{publicUrl!.TrimEnd('/')}/optimus-logo.png";

        var text = BuildWelcomePlainText(displayName, roleContent, loginUrl);
        var html = BuildWelcomeHtml(displayName, roleContent, loginUrl, logoUrl);
        return (text, html);
    }

    private sealed record RoleWelcomeContent(string Label, string Intro, IReadOnlyList<string> Highlights);

    private static RoleWelcomeContent ResolveRoleWelcomeContent(string role) =>
        role switch
        {
            AppRoles.Broker => new RoleWelcomeContent(
                "Broker",
                "Your broker account is active. You can now sign in and start managing shipments, manifests, and consignee workspaces on OPTIMUS.",
                new[]
                {
                    "Submit and track manifests for your clients",
                    "Manage accreditation and shipping line relationships",
                    "Switch between consignee workspaces when authorized",
                }),
            AppRoles.Consignee => new RoleWelcomeContent(
                "Consignee",
                "Your consignee account is active. You can now sign in and coordinate cargo, manifests, and broker partnerships from one place.",
                new[]
                {
                    "Create and monitor import shipments and manifests",
                    "Work with accredited brokers on your cargo",
                    "Access documents, payments, and operational updates",
                }),
            AppRoles.Trucker => new RoleWelcomeContent(
                "Trucker",
                "Your trucker account is active. You can now sign in and use OPTIMUS for pre-forecast and yard-related submissions.",
                new[]
                {
                    "Submit pre-forecast for container movements",
                    "Support yard and gate operations digitally",
                    "Keep your company and vehicle details up to date",
                }),
            _ => new RoleWelcomeContent(
                FormatRoleLabel(role),
                "Your OPTIMUS account is active. You can now sign in and start using the platform.",
                new[] { "Secure access to your operational workspace", "Notifications for important account activity" }),
        };

    private static string FormatRoleLabel(string role) =>
        string.IsNullOrWhiteSpace(role) ? "Member" : role;

    private static string BuildWelcomePlainText(string firstName, RoleWelcomeContent roleContent, string? loginUrl)
    {
        var sb = new StringBuilder();
        sb.AppendLine($"Welcome to OPTIMUS, {firstName}!");
        sb.AppendLine();
        sb.AppendLine($"Account type: {roleContent.Label}");
        sb.AppendLine();
        sb.AppendLine(roleContent.Intro);
        sb.AppendLine();
        foreach (var highlight in roleContent.Highlights)
        {
            sb.AppendLine($"- {highlight}");
        }

        sb.AppendLine();
        if (!string.IsNullOrWhiteSpace(loginUrl))
        {
            sb.AppendLine("Sign in:");
            sb.AppendLine(loginUrl);
            sb.AppendLine();
        }

        sb.AppendLine("If you did not create this account, please contact support immediately.");
        sb.AppendLine();
        sb.AppendLine("— OPTIMUS Shipping System");
        return sb.ToString().TrimEnd();
    }

    private static string BuildWelcomeHtml(
        string firstName,
        RoleWelcomeContent roleContent,
        string? loginUrl,
        string? logoUrl)
    {
        var encodedName = WebUtility.HtmlEncode(firstName);
        var encodedLabel = WebUtility.HtmlEncode(roleContent.Label);
        var encodedIntro = WebUtility.HtmlEncode(roleContent.Intro);
        var encodedLoginUrl = loginUrl is not null ? WebUtility.HtmlEncode(loginUrl) : null;
        var highlightsHtml = string.Join(
            string.Empty,
            roleContent.Highlights.Select(h =>
                $"""<li style="margin: 0 0 8px; font-size: 14px; line-height: 1.6; color: {TextPrimary};">{WebUtility.HtmlEncode(h)}</li>"""));

        var signInBlock = encodedLoginUrl is not null
            ? $"""
               <tr>
                 <td align="center" style="padding: 8px 32px 28px;">
                   <a href="{encodedLoginUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: {BrandPrimary}; color: #ffffff; font-family: 'Segoe UI', Arial, sans-serif; font-size: 16px; font-weight: 600; line-height: 1; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
                     Sign in to OPTIMUS
                   </a>
                 </td>
               </tr>
               """
            : string.Empty;

        var logoBlock = logoUrl is not null
            ? $"""<img src="{WebUtility.HtmlEncode(logoUrl)}" alt="OPTIMUS" width="72" height="72" style="display: block; margin: 0 auto 12px; border: 0;" />"""
            : $"""<div style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 28px; font-weight: 700; letter-spacing: 0.04em; color: {BrandPrimary}; margin-bottom: 4px;">OPTIMUS</div>""";

        return $"""
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="utf-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <meta name="color-scheme" content="light" />
              <meta name="supported-color-schemes" content="light" />
              <title>Welcome to OPTIMUS</title>
            </head>
            <body style="margin: 0; padding: 0; background-color: {PageBackground};">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: {PageBackground}; padding: 32px 16px;">
                <tr>
                  <td align="center">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 560px; background-color: {Surface}; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 24px rgba(11, 61, 92, 0.08);">
                      <tr>
                        <td style="background: linear-gradient(135deg, {BrandPrimary} 0%, {BrandPrimaryLight} 100%); padding: 28px 32px; text-align: center;">
                          {logoBlock}
                          <div style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(255, 255, 255, 0.92);">
                            Shipping System
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 36px 32px 16px; font-family: 'Segoe UI', Arial, sans-serif;">
                          <h1 style="margin: 0 0 16px; font-size: 24px; line-height: 1.3; font-weight: 700; color: {TextPrimary};">
                            Welcome, {encodedName}!
                          </h1>
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 0 18px;">
                            <tr>
                              <td style="background-color: rgba(11, 61, 92, 0.08); border: 1px solid rgba(11, 61, 92, 0.14); border-radius: 999px; padding: 8px 14px; font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: {BrandPrimary};">
                                {encodedLabel} account
                              </td>
                            </tr>
                          </table>
                          <p style="margin: 0 0 18px; font-size: 15px; line-height: 1.7; color: {TextMuted};">
                            {encodedIntro}
                          </p>
                          <ul style="margin: 0; padding: 0 0 0 18px;">
                            {highlightsHtml}
                          </ul>
                        </td>
                      </tr>
                      {signInBlock}
                      <tr>
                        <td style="padding: 0 32px 32px; font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; line-height: 1.6; color: {TextMuted};">
                          Your email is verified and your account is ready to use.
                          If you did not create this account, please contact support immediately.
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 20px 32px; background-color: #f8fafc; border-top: 1px solid #e5e7eb; font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; line-height: 1.6; color: {TextMuted}; text-align: center;">
                          &copy; {DateTime.UtcNow.Year} OPTIMUS Shipping System<br />
                          Operational platform for consignees, brokers, truckers, and shipping lines.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
            """;
    }

    private static string BuildVerificationPlainText(string token, string? verifyUrl)
    {
        var sb = new StringBuilder();
        sb.AppendLine("Welcome to OPTIMUS");
        sb.AppendLine();
        sb.AppendLine("Thanks for registering. Confirm your email address to activate your account.");
        sb.AppendLine();

        if (!string.IsNullOrWhiteSpace(verifyUrl))
        {
            sb.AppendLine("Verify your email:");
            sb.AppendLine(verifyUrl);
            sb.AppendLine();
        }

        sb.AppendLine("Or paste this verification code on the Verify Email page:");
        sb.AppendLine(token);
        sb.AppendLine();
        sb.AppendLine("This link and code expire in 48 hours.");
        sb.AppendLine();
        sb.AppendLine("If you did not create an OPTIMUS account, you can safely ignore this email.");
        sb.AppendLine();
        sb.AppendLine("— OPTIMUS Shipping System");
        return sb.ToString().TrimEnd();
    }

    private static string BuildVerificationHtml(string token, string? verifyUrl, string? logoUrl)
    {
        var encodedToken = WebUtility.HtmlEncode(token);
        var encodedVerifyUrl = verifyUrl is not null ? WebUtility.HtmlEncode(verifyUrl) : null;

        var ctaBlock = encodedVerifyUrl is not null
            ? $"""
               <tr>
                 <td align="center" style="padding: 12px 32px 8px;">
                   <a href="{encodedVerifyUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: {BrandPrimary}; color: #ffffff; font-family: 'Segoe UI', Arial, sans-serif; font-size: 16px; font-weight: 600; line-height: 1; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
                     Verify email address
                   </a>
                 </td>
               </tr>
               <tr>
                 <td align="center" style="padding: 0 32px 32px; font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; line-height: 1.6; color: {TextMuted};">
                   Button not working?
                   <a href="{encodedVerifyUrl}" target="_blank" rel="noopener noreferrer" style="color: {BrandPrimaryLight}; font-weight: 600; text-decoration: none;">Open verification page</a>
                 </td>
               </tr>
               <tr>
                 <td style="padding: 0 32px 8px; font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: {TextMuted};">
                   Or use this code
                 </td>
               </tr>
               """
            : """
               <tr>
                 <td style="padding: 0 32px 8px; font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #6b7280;">
                   Verification code
                 </td>
               </tr>
               """;

        var logoBlock = logoUrl is not null
            ? $"""<img src="{WebUtility.HtmlEncode(logoUrl)}" alt="OPTIMUS" width="72" height="72" style="display: block; margin: 0 auto 12px; border: 0;" />"""
            : $"""<div style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 28px; font-weight: 700; letter-spacing: 0.04em; color: {BrandPrimary}; margin-bottom: 4px;">OPTIMUS</div>""";

        return $"""
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="utf-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <meta name="color-scheme" content="light" />
              <meta name="supported-color-schemes" content="light" />
              <title>Verify your OPTIMUS email</title>
            </head>
            <body style="margin: 0; padding: 0; background-color: {PageBackground};">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: {PageBackground}; padding: 32px 16px;">
                <tr>
                  <td align="center">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 560px; background-color: {Surface}; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 24px rgba(11, 61, 92, 0.08);">
                      <tr>
                        <td style="background: linear-gradient(135deg, {BrandPrimary} 0%, {BrandPrimaryLight} 100%); padding: 28px 32px; text-align: center;">
                          {logoBlock}
                          <div style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(255, 255, 255, 0.92);">
                            Shipping System
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 36px 32px 8px; font-family: 'Segoe UI', Arial, sans-serif;">
                          <h1 style="margin: 0 0 12px; font-size: 24px; line-height: 1.3; font-weight: 700; color: {TextPrimary};">
                            Verify your email
                          </h1>
                          <p style="margin: 0 0 8px; font-size: 15px; line-height: 1.7; color: {TextMuted};">
                            Thanks for registering with OPTIMUS. Confirm your email address to activate your account and start using the platform.
                          </p>
                        </td>
                      </tr>
                      {ctaBlock}
                      <tr>
                        <td style="padding: 0 32px 24px;">
                          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8fafc; border: 1px solid #e5e7eb; border-radius: 8px;">
                            <tr>
                              <td style="padding: 14px 16px; font-family: 'Consolas', 'Courier New', monospace; font-size: 12px; line-height: 1.5; color: {TextPrimary}; word-break: break-all; text-align: center;">
                                {encodedToken}
                              </td>
                            </tr>
                          </table>
                          <p style="margin: 12px 0 0; font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; line-height: 1.6; color: {TextMuted};">
                            Paste this code on the Verify Email page if needed.
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 0 32px 32px; font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; line-height: 1.6; color: {TextMuted};">
                          This verification link and code expire in <strong style="color: {TextPrimary};">48 hours</strong>.
                          If you did not create an OPTIMUS account, you can safely ignore this email.
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 20px 32px; background-color: #f8fafc; border-top: 1px solid #e5e7eb; font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; line-height: 1.6; color: {TextMuted}; text-align: center;">
                          &copy; {DateTime.UtcNow.Year} OPTIMUS Shipping System<br />
                          Operational platform for consignees, brokers, truckers, and shipping lines.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
            """;
    }
}
