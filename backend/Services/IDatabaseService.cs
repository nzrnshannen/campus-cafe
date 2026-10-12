using System.Data.Common;
using System.Data.OleDb;

namespace CampusCafeApi.Services;

public interface IDatabaseService
{
    OleDbConnection CreateOleDbConnection();
    Task<DbConnection> GetOpenConnectionAsync(CancellationToken cancellationToken = default);
    string ConnectionString { get; }
    string ProviderName { get; }
}
