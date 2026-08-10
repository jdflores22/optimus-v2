using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Optimus.Application.Platform.Interfaces;

namespace Optimus.Infrastructure.Persistence.Seed;

/// <summary>
/// Clears operational/transactional data while preserving users, master data, and platform config.
/// </summary>
public class TransactionResetService : ITransactionResetService
{
    private static readonly string[] TransactionTables = new[]
    {
        "geotag_photos",
        "pre_advice_requests",
        "dwell_time_events",
        "container_allocation_audits",
        "repositioning_request_items",
        "repositioning_requests",
        "edo_access_logs",
        "edo_release_history",
        "edo_payments",
        "edo_renewal_requests",
        "edo_versions",
        "electronic_delivery_orders",
        "edo_generation_sessions",
        "document_verifications",
        "workflow_state_histories",
        "payments",
        "billings",
        "noas",
        "manifests",
        "bulk_import_jobs",
        "activity_logs",
        "containers",
        "accreditation_submissions",
        "broker_transfer_requests",
        "suspension_appeals",
        "in_app_notifications",
        "notification_deliveries",
        "refresh_tokens",
        "pending_users",
    };

    private readonly OptimusDbContext _db;
    private readonly ILogger<TransactionResetService> _logger;

    public TransactionResetService(OptimusDbContext db, ILogger<TransactionResetService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<TransactionResetResultDto> ResetAsync(CancellationToken ct = default)
    {
        _logger.LogWarning("Resetting all transactional data (preserving users, terminals, platform config)...");

        await _db.Database.ExecuteSqlRawAsync("SET FOREIGN_KEY_CHECKS = 0;", ct);

        var cleared = 0;
        foreach (var table in TransactionTables)
        {
            await _db.Database.ExecuteSqlRawAsync($"DELETE FROM `{table}`;", ct);
            cleared++;
            _logger.LogInformation("Cleared table {Table}", table);
        }

        var slotsReset = await _db.Database.ExecuteSqlRawAsync(
            "UPDATE terminal_slots SET AssignedCount = 0;",
            ct);

        await _db.Database.ExecuteSqlRawAsync("SET FOREIGN_KEY_CHECKS = 1;", ct);

        _logger.LogWarning(
            "Transaction reset complete. Tables cleared: {Tables}, terminal slot rows updated: {Slots}",
            cleared,
            slotsReset);

        return new TransactionResetResultDto(cleared, slotsReset);
    }
}
