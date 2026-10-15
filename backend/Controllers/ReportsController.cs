using Microsoft.AspNetCore.Mvc;
using CampusCafeApi.Data;
using CampusCafeApi.Models;
using System.Data.Common;

namespace CampusCafeApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReportsController : ControllerBase
{
    private readonly IDbConnectionFactory _db;

    public ReportsController(IDbConnectionFactory db)
    {
        _db = db;
    }

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary()
    {
        try
        {
            await using var connection = await _db.CreateOpenConnectionAsync();
            var today = DateTime.Now.ToString("yyyy-MM-dd");

            // 1. Sales metrics
            await using var salesCmd = connection.CreateCommand();
            salesCmd.CommandText = @"
                SELECT 
                    COUNT(OrderID) AS totalOrders,
                    COALESCE(SUM(CASE WHEN OrderStatus = 'Paid' THEN TotalAmount ELSE 0 END), 0) AS totalRevenue,
                    COALESCE(SUM(CASE WHEN OrderStatus = 'Paid' AND OrderDate = @today THEN TotalAmount ELSE 0 END), 0) AS todayRevenue,
                    COUNT(CASE WHEN OrderStatus = 'Paid' AND OrderDate = @today THEN 1 END) AS todayOrders,
                    COUNT(CASE WHEN OrderStatus = 'Pending' THEN 1 END) AS pendingOrders
                FROM `Order`";

            AddParam(salesCmd, "@today", today);

            int totalOrders = 0, todayOrders = 0, pendingOrders = 0;
            decimal totalRevenue = 0, todayRevenue = 0;
            await using (var rdr = await salesCmd.ExecuteReaderAsync())
            {
                if (await rdr.ReadAsync())
                {
                    totalOrders = Convert.ToInt32(rdr.GetValue(0));
                    totalRevenue = Convert.ToDecimal(rdr.GetValue(1));
                    todayRevenue = Convert.ToDecimal(rdr.GetValue(2));
                    todayOrders = Convert.ToInt32(rdr.GetValue(3));
                    pendingOrders = Convert.ToInt32(rdr.GetValue(4));
                }
            }

            // 2. Low-stock count
            await using var lowStockCmd = connection.CreateCommand();
            lowStockCmd.CommandText = "SELECT COUNT(*) FROM Ingredient WHERE CurrentQuantity <= MinimumStockLevel";
            int lowStockCount = Convert.ToInt32(await lowStockCmd.ExecuteScalarAsync());

            // 3. Top products
            await using var topCmd = connection.CreateCommand();
            topCmd.CommandText = @"
                SELECT 
                    p.ProductID, p.ProductName, p.Category,
                    COALESCE(SUM(od.Quantity), 0) AS totalSold,
                    COALESCE(SUM(od.Quantity * od.SellingPriceAtOrder), 0) AS totalEarned
                FROM Product p
                LEFT JOIN OrderDetail od ON p.ProductID = od.ProductID
                LEFT JOIN `Order` o ON od.OrderID = o.OrderID AND o.OrderStatus = 'Paid'
                GROUP BY p.ProductID, p.ProductName, p.Category
                ORDER BY totalSold DESC
                LIMIT 5";

            var topProducts = new List<Dictionary<string, object?>>();
            await using (var rdr = await topCmd.ExecuteReaderAsync())
            {
                while (await rdr.ReadAsync())
                {
                    topProducts.Add(new Dictionary<string, object?>
                    {
                        ["ProductID"] = rdr.GetInt32(0),
                        ["ProductName"] = rdr.GetString(1),
                        ["Category"] = rdr.GetString(2),
                        ["totalSold"] = Convert.ToInt32(rdr.GetValue(3)),
                        ["totalEarned"] = Convert.ToDecimal(rdr.GetValue(4))
                    });
                }
            }

            return Ok(new
            {
                success = true,
                data = new
                {
                    totalRevenue,
                    todayRevenue,
                    totalOrders,
                    todayOrders,
                    pendingOrders,
                    lowStockCount,
                    topProducts
                }
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, error = ex.Message });
        }
    }

    [HttpGet("customers")]
    public async Task<IActionResult> GetCustomers()
    {
        try
        {
            await using var connection = await _db.CreateOpenConnectionAsync();
            await using var cmd = connection.CreateCommand();
            cmd.CommandText = "SELECT CustomerID, UnivID, Name, ContactNumber, CustomerType FROM Customer ORDER BY Name";

            var list = new List<Dictionary<string, object?>>();
            await using (var reader = await cmd.ExecuteReaderAsync())
            {
                while (await reader.ReadAsync())
                {
                    list.Add(new Dictionary<string, object?>
                    {
                        ["CustomerID"] = reader.GetInt32(0),
                        ["UnivID"] = reader.IsDBNull(1) ? null : reader.GetString(1),
                        ["Name"] = reader.GetString(2),
                        ["ContactNumber"] = reader.IsDBNull(3) ? null : reader.GetString(3),
                        ["CustomerType"] = reader.GetString(4)
                    });
                }
            }

            return Ok(new { success = true, data = list });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, error = ex.Message });
        }
    }

    [HttpPost("customers")]
    public async Task<IActionResult> AddCustomer([FromBody] AddCustomerRequest req)
    {
        try
        {
            await using var connection = await _db.CreateOpenConnectionAsync();
            await using var cmd = connection.CreateCommand();
            var isSqlite = connection.GetType().Name.Contains("Sqlite", StringComparison.OrdinalIgnoreCase);

            cmd.CommandText = $@"
                INSERT INTO Customer (UnivID, Name, ContactNumber, CustomerType)
                VALUES (@univ, @name, @contact, @type);
                {(isSqlite ? "SELECT last_insert_rowid();" : "SELECT LAST_INSERT_ID();")}";

            AddParam(cmd, "@univ", (object?)req.UnivId ?? DBNull.Value);
            AddParam(cmd, "@name", req.Name);
            AddParam(cmd, "@contact", (object?)req.ContactNumber ?? DBNull.Value);
            AddParam(cmd, "@type", req.CustomerType);

            var idObj = await cmd.ExecuteScalarAsync();
            return StatusCode(201, new { success = true, customerId = Convert.ToInt32(idObj) });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, error = ex.Message });
        }
    }

    [HttpGet("employees")]
    public async Task<IActionResult> GetEmployees()
    {
        try
        {
            await using var connection = await _db.CreateOpenConnectionAsync();
            await using var cmd = connection.CreateCommand();
            cmd.CommandText = "SELECT EmployeeID, Name, ContactNumber, WorkSchedule FROM Employee ORDER BY Name";

            var list = new List<Dictionary<string, object?>>();
            await using (var reader = await cmd.ExecuteReaderAsync())
            {
                while (await reader.ReadAsync())
                {
                    list.Add(new Dictionary<string, object?>
                    {
                        ["EmployeeID"] = reader.GetInt32(0),
                        ["Name"] = reader.GetString(1),
                        ["ContactNumber"] = reader.IsDBNull(2) ? null : reader.GetString(2),
                        ["WorkSchedule"] = reader.IsDBNull(3) ? null : reader.GetString(3)
                    });
                }
            }

            return Ok(new { success = true, data = list });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, error = ex.Message });
        }
    }

    private static void AddParam(DbCommand cmd, string name, object value)
    {
        var p = cmd.CreateParameter();
        p.ParameterName = name;
        p.Value = value;
        cmd.Parameters.Add(p);
    }
}
