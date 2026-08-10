using System.Reflection;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.FileProviders;
using Microsoft.OpenApi.Models;
using Optimus.Application;
using Optimus.Application.Platform.Interfaces;
using Optimus.Infrastructure;
using Optimus.Infrastructure.Email;
using Optimus.Infrastructure.Persistence;
using Optimus.Infrastructure.Persistence.Seed;
using Optimus.Infrastructure.Storage;
using Optimus.Api;
using Optimus.Api.Middleware;
using Serilog;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);

    var envName = builder.Environment.EnvironmentName;
    builder.Configuration.AddJsonFile($"appsettings.{envName}.local.json", optional: true, reloadOnChange: true);

    builder.Host.UseSerilog((context, services, configuration) => configuration
        .ReadFrom.Configuration(context.Configuration)
        .ReadFrom.Services(services)
        .Enrich.FromLogContext()
        .WriteTo.Console());

    builder.Services.AddApplication();
    builder.Services.AddInfrastructure(builder.Configuration);

    builder.Services.AddControllers()
        .AddJsonOptions(options =>
        {
            options.JsonSerializerOptions.Converters.Add(new UtcDateTimeJsonConverter());
            options.JsonSerializerOptions.Converters.Add(new UtcNullableDateTimeJsonConverter());
        });
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(options =>
    {
        options.SwaggerDoc("v1", new OpenApiInfo
        {
            Title = "Optimus V2 API",
            Version = "v1",
            Description = "OPTIMUS Shipping Portal V2 — Phase 0 Foundation"
        });

        options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
        {
            Description = "JWT Authorization header using the Bearer scheme. Example: Bearer {token}",
            Name = "Authorization",
            In = ParameterLocation.Header,
            Type = SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT"
        });

        options.AddSecurityRequirement(new OpenApiSecurityRequirement
        {
            {
                new OpenApiSecurityScheme
                {
                    Reference = new OpenApiReference
                    {
                        Type = ReferenceType.SecurityScheme,
                        Id = "Bearer"
                    }
                },
                Array.Empty<string>()
            }
        });
    });

    builder.Services.AddCors(options =>
    {
        options.AddPolicy("Frontend", policy =>
        {
            var configured = builder.Configuration.GetSection("Cors:Origins").Get<string[]>() ?? Array.Empty<string>();
            var origins = configured
                .Concat(new[]
                {
                    "https://indigo-buffalo-715579.hostingersite.com",
                    "https://www.indigo-buffalo-715579.hostingersite.com",
                    "http://localhost:5173",
                    "http://127.0.0.1:5173",
                })
                .Where(o => !string.IsNullOrWhiteSpace(o))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToArray();

            policy.WithOrigins(origins)
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();
        });
    });

    builder.Services.AddRateLimiter(options =>
    {
        options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
        options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
        {
            if (HttpMethods.IsOptions(httpContext.Request.Method))
            {
                return RateLimitPartition.GetNoLimiter("options");
            }

            var key = httpContext.User.Identity?.Name
                      ?? httpContext.Connection.RemoteIpAddress?.ToString()
                      ?? "anon";
            return RateLimitPartition.GetFixedWindowLimiter(key, _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 180,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            });
        });
    });

    var app = builder.Build();

    app.UseCors("Frontend");
    app.UseSerilogRequestLogging();

    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI();
    }

    app.UseMiddleware<ExceptionHandlingMiddleware>();
    app.UseRateLimiter();
    app.UseMiddleware<BlockEdoStaticFilesMiddleware>();

    var uploadRoot = FileStoragePaths.ResolveUploadRoot(app.Configuration, app.Environment);
    Directory.CreateDirectory(uploadRoot);
    app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = new PhysicalFileProvider(uploadRoot),
        RequestPath = "/uploads"
    });
    app.UseStaticFiles();
    app.UseAuthentication();
    app.UseAuthorization();

    app.MapControllers();
    app.MapGet("/health/live", () => Results.Ok(new { status = "live" }));
    app.MapHealthChecks("/health");
    app.MapGet("/", () => Results.Ok(new
    {
        app = "Optimus V2 API",
        phase = 7,
        status = "hardening-parity-signoff",
        version = Assembly.GetExecutingAssembly().GetName().Version?.ToString() ?? "0.0.1"
    }));

    if (args.Contains("--reset-transactions", StringComparer.OrdinalIgnoreCase))
    {
        Log.Information("MySQL target: {DbTarget}", DatabaseConnection.DescribeForLogs(app.Configuration));
        Log.Warning("Running transactional data reset (preserves users and platform config)...");
        using var scope = app.Services.CreateScope();
        var reset = scope.ServiceProvider.GetRequiredService<ITransactionResetService>();
        var result = await reset.ResetAsync();
        Log.Warning(
            "Transaction reset complete. Tables cleared: {Tables}, terminal slots reset: {Slots}",
            result.TablesCleared,
            result.TerminalSlotsReset);
        Log.Information("Re-seeding demo yard/ops data...");
        await DbSeeder.SeedAsync(app.Services);
        Log.Information("Reset and seed completed.");
        return;
    }

    if (args.Contains("--migrate-only", StringComparer.OrdinalIgnoreCase))
    {
        Log.Information("MySQL target: {DbTarget}", DatabaseConnection.DescribeForLogs(app.Configuration));
        Log.Information("Running database migrations and seed (migrate-only)...");
        await DbSeeder.SeedAsync(app.Services);
        Log.Information("Database migrations and seed completed.");
        return;
    }

    Log.Information("MySQL target: {DbTarget}", DatabaseConnection.DescribeForLogs(app.Configuration));
    var smtpConfigured = app.Configuration.GetSection(SmtpSettings.SectionName).Get<SmtpSettings>()?.IsConfigured == true;
    Log.Information("SMTP email: {Mode}", smtpConfigured ? "Hostinger (live send)" : "logging only (set Smtp__Password on Railway)");
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Optimus V2 API terminated unexpectedly");
    Environment.ExitCode = 1;
}
finally
{
    Log.CloseAndFlush();
}

public partial class Program
{
}

