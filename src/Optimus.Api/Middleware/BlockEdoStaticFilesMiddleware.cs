namespace Optimus.Api.Middleware;

/// <summary>
/// Sensitive files under <c>/uploads</c> must be served through authorized API endpoints.
/// Only public branding assets (logos) remain directly accessible.
/// </summary>
public class BlockEdoStaticFilesMiddleware
{
    private static readonly string[] PublicPrefixes =
    {
        "/uploads/logos/",
        "/uploads/terminal-logos/",
    };

    private readonly RequestDelegate _next;

    public BlockEdoStaticFilesMiddleware(RequestDelegate next) => _next = next;

    public async Task InvokeAsync(HttpContext context)
    {
        var path = context.Request.Path.Value ?? string.Empty;
        if (path.StartsWith("/uploads/", StringComparison.OrdinalIgnoreCase) &&
            !PublicPrefixes.Any(prefix => path.StartsWith(prefix, StringComparison.OrdinalIgnoreCase)))
        {
            context.Response.StatusCode = StatusCodes.Status404NotFound;
            return;
        }

        await _next(context);
    }
}
