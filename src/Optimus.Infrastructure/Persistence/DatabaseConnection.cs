using Microsoft.Extensions.Configuration;

namespace Optimus.Infrastructure.Persistence;

public static class DatabaseConnection
{
    public const string DefaultConnectionName = "Default";

    public static string? ResolveFromConfiguration(IConfiguration config)
    {
        var connectionString = config.GetConnectionString(DefaultConnectionName);
        if (!string.IsNullOrWhiteSpace(connectionString))
            return connectionString;

        connectionString = BuildFromMysqlConfig(config);
        return string.IsNullOrWhiteSpace(connectionString) ? ResolveFromEnvironment() : connectionString;
    }

    public static string? ResolveFromEnvironment()
    {
        var fromEnv = Environment.GetEnvironmentVariable($"ConnectionStrings__{DefaultConnectionName}");
        if (!string.IsNullOrWhiteSpace(fromEnv))
            return fromEnv;

        var host = Environment.GetEnvironmentVariable("MYSQL_HOST");
        if (string.IsNullOrWhiteSpace(host))
            return null;

        return BuildFromMysqlParts(
            host,
            Environment.GetEnvironmentVariable("MYSQL_PORT"),
            Environment.GetEnvironmentVariable("MYSQL_DATABASE"),
            Environment.GetEnvironmentVariable("MYSQL_USER"),
            Environment.GetEnvironmentVariable("MYSQL_PASSWORD"),
            sslRequired: true);
    }

    public static string? BuildFromMysqlConfig(IConfiguration config)
    {
        var host = config["MYSQL_HOST"];
        if (string.IsNullOrWhiteSpace(host))
            return null;

        return BuildFromMysqlParts(
            host,
            config["MYSQL_PORT"],
            config["MYSQL_DATABASE"],
            config["MYSQL_USER"],
            config["MYSQL_PASSWORD"],
            sslRequired: true);
    }

    public static string? BuildFromMysqlParts(
        string host,
        string? port,
        string? database,
        string? user,
        string? password,
        bool sslRequired)
    {
        if (string.IsNullOrWhiteSpace(database))
            return null;

        var portValue = uint.TryParse(port, out var parsedPort) ? parsedPort : 3306;
        var sslMode = sslRequired ? "Preferred" : "Preferred";

        return
            $"Server={host};Port={portValue};Database={database};User={user};Password={password};CharSet=utf8mb4;SslMode={sslMode};AllowPublicKeyRetrieval=True;Connection Timeout=30;";
    }

    public static string DescribeForLogs(IConfiguration config)
    {
        var host = config["MYSQL_HOST"] ?? Environment.GetEnvironmentVariable("MYSQL_HOST") ?? "(not set)";
        var port = config["MYSQL_PORT"] ?? Environment.GetEnvironmentVariable("MYSQL_PORT") ?? "3306";
        var database = config["MYSQL_DATABASE"] ?? Environment.GetEnvironmentVariable("MYSQL_DATABASE") ?? "(not set)";
        var user = config["MYSQL_USER"] ?? Environment.GetEnvironmentVariable("MYSQL_USER") ?? "(not set)";
        return $"host={host};port={port};database={database};user={user}";
    }
}
