using System.Data.Common;
using System.Data.OleDb;

namespace CampusCafeApi.Data;

public interface IDbConnectionFactory
{
    DbConnection CreateConnection();
    Task<DbConnection> CreateOpenConnectionAsync(CancellationToken cancellationToken = default);
    OleDbConnection CreateOleDbConnection();
    OleDbCommand CreateOleDbCommand(string commandText, OleDbConnection connection);
    OleDbDataAdapter CreateOleDbDataAdapter(OleDbCommand command);
    string ActiveProvider { get; }
}
