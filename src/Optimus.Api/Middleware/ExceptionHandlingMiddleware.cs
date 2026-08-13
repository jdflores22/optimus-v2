using System.Data.Common;
using System.Net;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;

namespace Optimus.Api.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var (status, message) = exception switch
        {
            UnauthorizedAccessException => (
                context.User.Identity?.IsAuthenticated == true
                    ? HttpStatusCode.Forbidden
                    : HttpStatusCode.Unauthorized,
                exception.Message),
            FluentValidation.ValidationException validation => (HttpStatusCode.BadRequest, string.Join("; ", validation.Errors.Select(e => e.ErrorMessage))),
            KeyNotFoundException => (HttpStatusCode.NotFound, exception.Message),
            InvalidOperationException => (HttpStatusCode.BadRequest, exception.Message),
            DbException db when IsSchemaDrift(db) => (
                HttpStatusCode.ServiceUnavailable,
                "Database schema is out of date for pre-forecast intake. Please retry after the platform migration completes."),
            _ => (HttpStatusCode.InternalServerError, "An unexpected error occurred.")
        };

        if (status == HttpStatusCode.InternalServerError)
        {
            _logger.LogError(exception, "Unhandled exception");
        }
        else
        {
            _logger.LogWarning(exception, "Handled exception: {Message}", message);
        }

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)status;

        var payload = JsonSerializer.Serialize(new
        {
            error = message,
            status = (int)status,
            traceId = context.TraceIdentifier
        });

        await context.Response.WriteAsync(payload);
    }

    private static bool IsSchemaDrift(DbException exception)
    {
        var message = exception.Message;
        return message.Contains("Unknown column", StringComparison.OrdinalIgnoreCase)
               || message.Contains("doesn't exist", StringComparison.OrdinalIgnoreCase)
               || message.Contains("does not exist", StringComparison.OrdinalIgnoreCase);
    }
}
