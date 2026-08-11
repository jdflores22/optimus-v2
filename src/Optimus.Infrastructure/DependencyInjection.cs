using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using Optimus.Application.Auth.Interfaces;
using Optimus.Application.Cargo.Interfaces;
using Optimus.Application.Edo.Interfaces;
using Optimus.Application.Ops.Interfaces;
using Optimus.Application.Platform.Interfaces;
using Optimus.Application.Security;
using Optimus.Application.ShippingAdmin.Interfaces;
using Optimus.Application.Yard.Interfaces;
using Optimus.Infrastructure.Auth;
using Optimus.Infrastructure.Email;
using Optimus.Infrastructure.Cargo;
using Optimus.Infrastructure.Edo;
using Optimus.Infrastructure.Identity;
using Optimus.Infrastructure.Ops;
using Optimus.Infrastructure.Persistence;
using Optimus.Infrastructure.Persistence.Seed;
using Optimus.Infrastructure.Platform;
using Optimus.Infrastructure.Storage;
using Optimus.Infrastructure.ShippingAdmin;
using Optimus.Infrastructure.Security;
using Optimus.Infrastructure.Yard;
using Optimus.Shared.Constants;

namespace Optimus.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<JwtSettings>(configuration.GetSection(JwtSettings.SectionName));
        services.Configure<SmtpSettings>(options => SmtpSettingsConfiguration.Bind(options, configuration));
        services.Configure<ResendSettings>(configuration.GetSection(ResendSettings.SectionName));
        services.AddOptions<AppSettings>().Bind(configuration.GetSection(AppSettings.SectionName));

        services.AddHttpClient<ResendEmailSender>();
        services.AddScoped<SmtpEmailSender>();
        services.AddScoped<RoutingEmailSender>();
        services.AddScoped<IEmailSender, RoutingEmailSender>();

        services.AddSingleton<EmailQueue>();
        services.AddSingleton<IEmailQueue>(sp => sp.GetRequiredService<EmailQueue>());
        services.AddHostedService<EmailQueueHostedService>();

        var connectionString = DatabaseConnection.ResolveFromConfiguration(configuration)
            ?? throw new InvalidOperationException(
                "Set ConnectionStrings__Default or MYSQL_HOST/MYSQL_DATABASE/MYSQL_USER/MYSQL_PASSWORD.");

        var serverVersion = new MySqlServerVersion(new Version(8, 0, 36));
        services.AddDbContext<OptimusDbContext>(options =>
            options.UseMySql(connectionString, serverVersion, mySqlOptions =>
                mySqlOptions.EnableRetryOnFailure(maxRetryCount: 3, maxRetryDelay: TimeSpan.FromSeconds(5), errorNumbersToAdd: null)));

        var redisConnection = configuration.GetConnectionString("Redis");
        if (!string.IsNullOrWhiteSpace(redisConnection))
        {
            services.AddStackExchangeRedisCache(options =>
            {
                options.Configuration = redisConnection;
                options.InstanceName = "optimus-v2:";
            });
        }
        else
        {
            services.AddDistributedMemoryCache();
        }

        var jwt = configuration.GetSection(JwtSettings.SectionName).Get<JwtSettings>()
                  ?? throw new InvalidOperationException("Jwt settings are missing.");

        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateIssuerSigningKey = true,
                    ValidateLifetime = true,
                    ValidIssuer = jwt.Issuer,
                    ValidAudience = jwt.Audience,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Key)),
                    ClockSkew = TimeSpan.FromMinutes(1)
                };
            });

        services.AddAuthorization(options =>
        {
            options.AddPolicy("SystemAdmin", p => p.RequireRole(AppRoles.SystemAdmin));
            options.AddPolicy("ShippingAdmin", p => p.RequireRole(AppRoles.SystemAdmin, AppRoles.ShippingLinesAdmin));
            options.AddPolicy("ShippingLineManagement", p => p.RequireRole(AppRoles.ShippingLinesAdmin));
            options.AddPolicy("StaffHierarchy", p => p.RequireRole(
                AppRoles.SystemAdmin,
                AppRoles.ShippingLinesAdmin,
                AppRoles.SlStaff,
                AppRoles.Evaluator,
                AppRoles.Accounting));
            options.AddPolicy("Broker", p => p.RequireRole(AppRoles.Broker));
            options.AddPolicy("SlStaff", p => p.RequireRole(AppRoles.SlStaff, AppRoles.ShippingLinesAdmin, AppRoles.SystemAdmin));
            options.AddPolicy("Accounting", p => p.RequireRole(AppRoles.Accounting, AppRoles.SystemAdmin));
            options.AddPolicy("BrokerOrConsignee", p => p.RequireRole(AppRoles.Broker, AppRoles.Consignee, AppRoles.SystemAdmin));
            options.AddPolicy("EdoPayToOpen", p => p.RequireRole(
                AppRoles.Broker, AppRoles.Consignee, AppRoles.Trucker, AppRoles.SystemAdmin));
            options.AddPolicy("EdoRelease", p => p.RequireRole(
                AppRoles.SlStaff, AppRoles.ShippingLinesAdmin, AppRoles.TerminalTeam, AppRoles.SystemAdmin));
            options.AddPolicy("EdoPaymentAdmin", p => p.RequireRole(AppRoles.Accounting, AppRoles.SystemAdmin));
            options.AddPolicy("TerminalTeam", p => p.RequireRole(
                AppRoles.TerminalTeam, AppRoles.SystemAdmin, AppRoles.ShippingLinesAdmin));
            options.AddPolicy("CyStaff", p => p.RequireRole(AppRoles.CyStaff, AppRoles.SystemAdmin));
            options.AddPolicy("LockContainerAllocation", p => p.RequireRole(
                AppRoles.SlStaff, AppRoles.CyStaff, AppRoles.ShippingLinesAdmin, AppRoles.SystemAdmin));
            options.AddPolicy("Trucker", p => p.RequireRole(AppRoles.Trucker, AppRoles.SystemAdmin));
            options.AddPolicy("YardAdmin", p => p.RequireRole(
                AppRoles.SystemAdmin, AppRoles.ShippingLinesAdmin, AppRoles.SlStaff, AppRoles.TerminalTeam));
            options.AddPolicy("ContainerInventory", p => p.RequireRole(
                AppRoles.SystemAdmin,
                AppRoles.ShippingLinesAdmin,
                AppRoles.SlStaff,
                AppRoles.Accounting,
                AppRoles.TerminalTeam,
                AppRoles.CyStaff));
            options.AddPolicy("Evaluator", p => p.RequireRole(AppRoles.Evaluator, AppRoles.SystemAdmin));
            options.AddPolicy("Consignee", p => p.RequireRole(AppRoles.Consignee, AppRoles.SystemAdmin));
        });

        services.AddScoped<IJwtTokenService, JwtTokenService>();
        services.AddScoped<IPasswordHasher, BcryptPasswordHasher>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IResourceAuthorizationService, ResourceAuthorizationService>();
        services.AddScoped<IRoleAcceptanceService, RoleAcceptanceService>();
        services.AddScoped<IShippingLineService, ShippingLineService>();
        services.AddScoped<IWorkspaceService, WorkspaceService>();
        services.AddScoped<IHierarchyService, HierarchyService>();
        services.AddScoped<IShippingAdminPartnerService, ShippingAdminPartnerService>();
        services.AddSingleton<IUploadRootProvider, UploadRootProvider>();
        services.AddScoped<IDocumentStore, DocumentStore>();
        services.AddScoped<IActivityLogService, ActivityLogService>();
        services.AddScoped<IExchangeRateService, ExchangeRateService>();
        services.AddScoped<IPaymentFeeService, PaymentFeeService>();
        services.AddScoped<IManifestWorkflowService, ManifestWorkflowService>();
        services.AddScoped<IPaymentService, PaymentService>();
        services.AddScoped<IQrCodeService, QrCodeService>();
        services.AddScoped<IEdoService, EdoService>();
        services.AddScoped<IEdoPaymentService, EdoPaymentService>();
        services.AddScoped<IEdoRenewalService, EdoRenewalService>();
        services.AddScoped<IDocumentVerificationService, DocumentVerificationService>();
        services.AddScoped<ISmsSender, LoggingSmsSender>();
        services.AddScoped<IPushSender, LoggingPushSender>();
        services.AddScoped<IMessageTemplateService, MessageTemplateService>();
        services.AddScoped<INotificationService, EnhancedNotificationService>();
        services.AddScoped<ISystemSettingsService, SystemSettingsService>();
        services.AddSingleton<IRateLimitRuleCache, RateLimitRuleCache>();
        services.AddScoped<IRateLimitAdminService, RateLimitAdminService>();
        services.AddScoped<IDocumentTemplateService, DocumentTemplateService>();
        services.AddScoped<IScheduledReportService, ScheduledReportService>();
        services.AddScoped<IReportsService, ReportsService>();
        services.AddScoped<IAuditTrailService, AuditTrailService>();
        services.AddScoped<IPlatformActivityService, PlatformActivityService>();
        services.AddScoped<IMaintenanceService, MaintenanceService>();
        services.AddScoped<ITransactionResetService, TransactionResetService>();
        services.AddScoped<ITerminalService, TerminalService>();
        services.AddScoped<IContainerCatalogService, ContainerCatalogService>();
        services.AddScoped<ICyAllocationService, CyAllocationService>();
        services.AddScoped<ICyScopeService, CyScopeService>();
        services.AddScoped<IContainerInventoryService, ContainerInventoryService>();
        services.AddScoped<IDwellService, DwellService>();
        services.AddScoped<IPreForecastService, PreForecastService>();
        services.AddScoped<ITruckerPreForecastService, TruckerPreForecastService>();
        services.AddScoped<ITruckerTokenService, TruckerTokenService>();
        services.AddScoped<IFormBuilderService, FormBuilderService>();
        services.AddScoped<ILocationService, LocationService>();
        services.AddScoped<IAccreditationService, AccreditationService>();
        services.AddScoped<IBrokerTransferService, BrokerTransferService>();
        services.AddScoped<ISuspensionAppealService, SuspensionAppealService>();
        services.AddScoped<IRepositioningService, RepositioningService>();
        services.AddScoped<IReferralService, ReferralService>();
        services.AddScoped<IOnboardingService, OnboardingService>();
        services.AddHostedService<EdoExpirationHostedService>();
        services.AddHostedService<DwellMonitoringHostedService>();
        services.AddHostedService<PlatformHostedService>();
        services.AddHttpClient();

        var healthChecks = services.AddHealthChecks()
            .AddMySql(connectionString, name: "mysql");

        if (!string.IsNullOrWhiteSpace(redisConnection))
        {
            healthChecks.AddRedis(redisConnection, name: "redis");
        }

        return services;
    }
}
