using System.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Optimus.Infrastructure.Persistence.Seed;

/// <summary>
/// Aligns <c>__EFMigrationsHistory</c> when the database was created from
/// <c>scripts/optimus-v2-schema.sql</c> (or partial manual setup) so EF does not
/// re-run CREATE TABLE for objects that already exist.
/// </summary>
public static class MigrationHistoryBaseline
{
    private const string ProductVersion = "7.0.20";

    private static readonly (string MigrationId, Func<OptimusDbContext, Task<bool>> IsApplied)[] Markers =
    {
        ("20260806030911_Phase1Identity", db => TableExistsAsync(db, "regions")),
        ("20260806032103_Phase2CargoChain", db => TableExistsAsync(db, "manifests")),
        ("20260806033654_Phase3EdoCro", db => TableExistsAsync(db, "electronic_delivery_orders")),
        ("20260806035052_Phase4YardOps", db => TableExistsAsync(db, "containers")),
        ("20260806040637_Phase5OpsSatellite", db => TableExistsAsync(db, "form_configurations")),
        ("20260806041746_Phase6Platform", db => TableExistsAsync(db, "message_templates")),
        ("20260806043025_Phase7Hardening", db => IndexExistsAsync(db, "manifests", "IX_manifests_WorkflowState")),
        ("20260808140000_DocumentTemplateLayout", db => ColumnExistsAsync(db, "document_templates", "LayoutJson")),
        ("20260808150000_UserProfilePhoto", db => ColumnExistsAsync(db, "users", "ProfilePhotoPath")),
        ("20260808190000_AccreditationSasIdNumber", db => ColumnExistsAsync(db, "accreditation_submissions", "SasIdNumber")),
        ("20260808200000_TerminalLogoPath", db => ColumnExistsAsync(db, "terminals", "LogoPath")),
        ("20260808210000_TerminalLocationLength", TerminalLocationExpandedAsync),
        ("20260808220000_AccreditationCertificate", db => ColumnExistsAsync(db, "accreditation_submissions", "CertificatePdfPath")),
        ("20260808230000_EdoPaymentReceiptReferences", db => ColumnExistsAsync(db, "edo_payments", "PaymentChannel")),
        ("20260808240000_EdoPaymentTransactionAt", db => ColumnExistsAsync(db, "edo_payments", "TransactionAt")),
    };

    public static async Task EnsureAsync(OptimusDbContext db, ILogger logger, CancellationToken cancellationToken = default)
    {
        await EnsureHistoryTableAsync(db, cancellationToken);

        if (!await TableExistsAsync(db, "regions", cancellationToken))
        {
            return;
        }

        var applied = (await db.Database.GetAppliedMigrationsAsync(cancellationToken)).ToHashSet(StringComparer.Ordinal);
        if (applied.Contains(Markers[0].MigrationId))
        {
            return;
        }

        logger.LogWarning(
            "Database has application tables but EF migration history is missing or incomplete. " +
            "Baselining migration history from existing schema before applying pending migrations.");

        var inserted = 0;
        foreach (var (migrationId, isApplied) in Markers)
        {
            if (applied.Contains(migrationId))
            {
                continue;
            }

            if (!await isApplied(db))
            {
                break;
            }

            await InsertHistoryAsync(db, migrationId, cancellationToken);
            applied.Add(migrationId);
            inserted++;
        }

        if (inserted > 0)
        {
            logger.LogInformation("Baselined {Count} EF migration history row(s).", inserted);
        }
    }

    private static async Task EnsureHistoryTableAsync(OptimusDbContext db, CancellationToken cancellationToken)
    {
        await db.Database.ExecuteSqlRawAsync(
            """
            CREATE TABLE IF NOT EXISTS `__EFMigrationsHistory` (
                `MigrationId` varchar(150) NOT NULL,
                `ProductVersion` varchar(32) NOT NULL,
                CONSTRAINT `PK___EFMigrationsHistory` PRIMARY KEY (`MigrationId`)
            );
            """,
            cancellationToken);
    }

    private static async Task InsertHistoryAsync(OptimusDbContext db, string migrationId, CancellationToken cancellationToken)
    {
        await db.Database.ExecuteSqlRawAsync(
            """
            INSERT IGNORE INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
            VALUES ({0}, {1});
            """,
            new object[] { migrationId, ProductVersion },
            cancellationToken);
    }

    private static async Task<bool> TerminalLocationExpandedAsync(OptimusDbContext db)
    {
        return await ColumnMaxLengthAsync(db, "terminals", "Location") >= 2000;
    }

    private static async Task<bool> TableExistsAsync(OptimusDbContext db, string tableName, CancellationToken cancellationToken = default)
    {
        var count = await ScalarIntAsync(
            db,
            """
            SELECT COUNT(*)
            FROM information_schema.tables
            WHERE table_schema = DATABASE()
              AND table_name = {0}
            """,
            tableName,
            cancellationToken);
        return count > 0;
    }

    private static async Task<bool> ColumnExistsAsync(
        OptimusDbContext db,
        string tableName,
        string columnName,
        CancellationToken cancellationToken = default)
    {
        var count = await ScalarIntAsync(
            db,
            """
            SELECT COUNT(*)
            FROM information_schema.columns
            WHERE table_schema = DATABASE()
              AND table_name = {0}
              AND column_name = {1}
            """,
            tableName,
            columnName,
            cancellationToken);
        return count > 0;
    }

    private static async Task<bool> IndexExistsAsync(
        OptimusDbContext db,
        string tableName,
        string indexName,
        CancellationToken cancellationToken = default)
    {
        var count = await ScalarIntAsync(
            db,
            """
            SELECT COUNT(*)
            FROM information_schema.statistics
            WHERE table_schema = DATABASE()
              AND table_name = {0}
              AND index_name = {1}
            """,
            tableName,
            indexName,
            cancellationToken);
        return count > 0;
    }

    private static async Task<int> ColumnMaxLengthAsync(
        OptimusDbContext db,
        string tableName,
        string columnName,
        CancellationToken cancellationToken = default)
    {
        var connection = db.Database.GetDbConnection();
        if (connection.State != ConnectionState.Open)
        {
            await connection.OpenAsync(cancellationToken);
        }

        await using var command = connection.CreateCommand();
        command.CommandText = """
            SELECT CHARACTER_MAXIMUM_LENGTH
            FROM information_schema.columns
            WHERE table_schema = DATABASE()
              AND table_name = @tableName
              AND column_name = @columnName
            LIMIT 1
            """;
        AddParameter(command, "@tableName", tableName);
        AddParameter(command, "@columnName", columnName);

        var result = await command.ExecuteScalarAsync(cancellationToken);
        return result is null or DBNull ? 0 : Convert.ToInt32(result);
    }

    private static async Task<int> ScalarIntAsync(
        OptimusDbContext db,
        string sql,
        string arg0,
        CancellationToken cancellationToken)
    {
        var connection = db.Database.GetDbConnection();
        if (connection.State != ConnectionState.Open)
        {
            await connection.OpenAsync(cancellationToken);
        }

        await using var command = connection.CreateCommand();
        command.CommandText = sql.Replace("{0}", "@p0", StringComparison.Ordinal);
        AddParameter(command, "@p0", arg0);

        var result = await command.ExecuteScalarAsync(cancellationToken);
        return result is null or DBNull ? 0 : Convert.ToInt32(result);
    }

    private static async Task<int> ScalarIntAsync(
        OptimusDbContext db,
        string sql,
        string arg0,
        string arg1,
        CancellationToken cancellationToken)
    {
        var connection = db.Database.GetDbConnection();
        if (connection.State != ConnectionState.Open)
        {
            await connection.OpenAsync(cancellationToken);
        }

        await using var command = connection.CreateCommand();
        command.CommandText = sql
            .Replace("{0}", "@p0", StringComparison.Ordinal)
            .Replace("{1}", "@p1", StringComparison.Ordinal);
        AddParameter(command, "@p0", arg0);
        AddParameter(command, "@p1", arg1);

        var result = await command.ExecuteScalarAsync(cancellationToken);
        return result is null or DBNull ? 0 : Convert.ToInt32(result);
    }

    private static void AddParameter(System.Data.Common.DbCommand command, string name, object value)
    {
        var parameter = command.CreateParameter();
        parameter.ParameterName = name;
        parameter.Value = value;
        command.Parameters.Add(parameter);
    }
}
