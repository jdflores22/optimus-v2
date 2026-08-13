using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Optimus.Infrastructure.Persistence;

namespace Optimus.Infrastructure.Persistence.Seed;

/// <summary>
/// Idempotent repair for trucker pre-forecast intake schema when EF history and Hostinger DB drift.
/// </summary>
public static class PreForecastSchemaRepair
{
    public static async Task EnsureAsync(OptimusDbContext db, ILogger logger, CancellationToken ct = default)
    {
        if (!await MigrationHistoryBaseline.TableExistsAsync(db, "trucker_pre_forecast_submissions", ct))
        {
            logger.LogWarning(
                "trucker_pre_forecast_submissions table is missing; EF migrations should create it on next deploy.");
            return;
        }

        await EnsureColumnAsync(db, "trucker_pre_forecast_submissions", "EdoVerificationToken",
            "ALTER TABLE `trucker_pre_forecast_submissions` ADD COLUMN `EdoVerificationToken` varchar(128) NOT NULL DEFAULT ''",
            ct);
        await EnsureColumnAsync(db, "trucker_pre_forecast_submissions", "AssignedSlotId",
            "ALTER TABLE `trucker_pre_forecast_submissions` ADD COLUMN `AssignedSlotId` char(36) NULL",
            ct);
        await EnsureColumnAsync(db, "trucker_pre_forecast_submissions", "AssignedTerminalId",
            "ALTER TABLE `trucker_pre_forecast_submissions` ADD COLUMN `AssignedTerminalId` char(36) NULL",
            ct);
        await EnsureColumnAsync(db, "trucker_pre_forecast_submissions", "CyConfirmedAt",
            "ALTER TABLE `trucker_pre_forecast_submissions` ADD COLUMN `CyConfirmedAt` datetime(6) NULL",
            ct);
        await EnsureColumnAsync(db, "trucker_pre_forecast_submissions", "CyConfirmedById",
            "ALTER TABLE `trucker_pre_forecast_submissions` ADD COLUMN `CyConfirmedById` char(36) NULL",
            ct);
        await EnsureColumnAsync(db, "trucker_pre_forecast_submissions", "CyConfirmedReturnDate",
            "ALTER TABLE `trucker_pre_forecast_submissions` ADD COLUMN `CyConfirmedReturnDate` datetime(6) NULL",
            ct);
        await EnsureColumnAsync(db, "trucker_pre_forecast_submissions", "CyNotes",
            "ALTER TABLE `trucker_pre_forecast_submissions` ADD COLUMN `CyNotes` varchar(2000) NULL",
            ct);
        await EnsureColumnAsync(db, "trucker_pre_forecast_submissions", "NewEdoId",
            "ALTER TABLE `trucker_pre_forecast_submissions` ADD COLUMN `NewEdoId` char(36) NULL",
            ct);
        await EnsureColumnAsync(db, "trucker_pre_forecast_submissions", "PreferredTerminalId",
            "ALTER TABLE `trucker_pre_forecast_submissions` ADD COLUMN `PreferredTerminalId` char(36) NULL",
            ct);
        await EnsureColumnAsync(db, "trucker_pre_forecast_submissions", "TerminalNotes",
            "ALTER TABLE `trucker_pre_forecast_submissions` ADD COLUMN `TerminalNotes` varchar(2000) NULL",
            ct);
        await EnsureColumnAsync(db, "trucker_pre_forecast_submissions", "DetentionAtPreferredDate",
            "ALTER TABLE `trucker_pre_forecast_submissions` ADD COLUMN `DetentionAtPreferredDate` decimal(18,2) NOT NULL DEFAULT 0",
            ct);
        await EnsureColumnAsync(db, "trucker_pre_forecast_submissions", "ExtraDaysDetentionAmount",
            "ALTER TABLE `trucker_pre_forecast_submissions` ADD COLUMN `ExtraDaysDetentionAmount` decimal(18,2) NOT NULL DEFAULT 0",
            ct);
        await EnsureColumnAsync(db, "trucker_pre_forecast_submissions", "ExtraDaysWaived",
            "ALTER TABLE `trucker_pre_forecast_submissions` ADD COLUMN `ExtraDaysWaived` tinyint(1) NOT NULL DEFAULT 0",
            ct);
        await EnsureColumnAsync(db, "trucker_pre_forecast_submissions", "ScheduleDeltaDays",
            "ALTER TABLE `trucker_pre_forecast_submissions` ADD COLUMN `ScheduleDeltaDays` int NOT NULL DEFAULT 0",
            ct);
        await EnsureColumnAsync(db, "trucker_pre_forecast_submissions", "TruckerPreferredReturnDate",
            "ALTER TABLE `trucker_pre_forecast_submissions` ADD COLUMN `TruckerPreferredReturnDate` datetime(6) NOT NULL DEFAULT '2000-01-01 00:00:00'",
            ct);
        await EnsureColumnAsync(db, "trucker_pre_forecast_submissions", "DetentionRateAtCalculation",
            "ALTER TABLE `trucker_pre_forecast_submissions` ADD COLUMN `DetentionRateAtCalculation` decimal(18,2) NOT NULL DEFAULT 0",
            ct);

        await db.Database.ExecuteSqlRawAsync(
            """
            UPDATE trucker_pre_forecast_submissions
            SET TruckerPreferredReturnDate = ReturnDate
            WHERE TruckerPreferredReturnDate = '2000-01-01 00:00:00'
              OR TruckerPreferredReturnDate IS NULL;
            """,
            ct);

        if (!await MigrationHistoryBaseline.TableExistsAsync(db, "trucker_pre_forecast_photos", ct))
        {
            logger.LogWarning("trucker_pre_forecast_photos table is missing; EF migrations should create it on next deploy.");
        }
    }

    private static async Task EnsureColumnAsync(
        OptimusDbContext db,
        string table,
        string column,
        string alterSql,
        CancellationToken ct)
    {
        if (await MigrationHistoryBaseline.ColumnExistsAsync(db, table, column, ct))
        {
            return;
        }

        await db.Database.ExecuteSqlRawAsync(alterSql, ct);
    }
}
