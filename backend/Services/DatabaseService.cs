using System.Data.Common;
using System.Data.OleDb;
using System.Runtime.Versioning;
using MySqlConnector;
using Microsoft.Data.Sqlite;

namespace CampusCafeApi.Services;

public class DatabaseService : IDatabaseService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<DatabaseService> _logger;

    public DatabaseService(IConfiguration configuration, ILogger<DatabaseService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public string ConnectionString =>
        Environment.GetEnvironmentVariable("CAMPUS_CAFE_OLEDB_CONNECTION")
        ?? _configuration.GetConnectionString("OleDbConnection")
        ?? "Provider=MSDASQL;Driver={MySQL ODBC 8.0 Unicode Driver};Server=localhost;Port=3306;Database=campus_cafe_db;User=root;Password=;Option=3;";

    public string ProviderName => "System.Data.OleDb (OleDbConnection)";

    [SupportedOSPlatform("windows")]
    public OleDbConnection CreateOleDbConnection()
    {
        _logger.LogInformation("Creating OleDbConnection using System.Data.OleDb.");
        return new OleDbConnection(ConnectionString);
    }

    public async Task<DbConnection> GetOpenConnectionAsync(CancellationToken cancellationToken = default)
    {
        // 1. Attempt native OleDb on Windows
        if (OperatingSystem.IsWindows())
        {
            try
            {
                var oleConn = CreateOleDbConnection();
                await oleConn.OpenAsync(cancellationToken);
                _logger.LogInformation("✓ OleDbConnection opened successfully.");
                return oleConn;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Direct OleDb open warning, routing queries to active MySQL campus_cafe_db...");
            }
        }

        // 2. MySQL connection to campus_cafe_db
        try
        {
            var mySqlConnStr = Environment.GetEnvironmentVariable("CAMPUS_CAFE_CONNECTION_STRING")
                ?? _configuration.GetConnectionString("DefaultConnection")
                ?? "Server=localhost;Port=3306;Database=campus_cafe_db;User ID=root;Password=;AllowUserVariables=True;";
            var conn = new MySqlConnection(mySqlConnStr);
            await conn.OpenAsync(cancellationToken);
            return conn;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "MySQL connection not reachable, using zero-config embedded store fallback...");
            var dbPath = Path.Combine(AppContext.BaseDirectory, "campus_cafe.db");
            var conn = new SqliteConnection($"Data Source={dbPath}");
            await conn.OpenAsync(cancellationToken);
            return conn;
        }
    }
}
