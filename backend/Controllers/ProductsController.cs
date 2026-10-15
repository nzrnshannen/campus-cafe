using Microsoft.AspNetCore.Mvc;
using CampusCafeApi.Data;
using CampusCafeApi.Models;
using System.Data.Common;

namespace CampusCafeApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly IDbConnectionFactory _db;

    public ProductsController(IDbConnectionFactory db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetProducts([FromQuery] string? category, [FromQuery] bool availableOnly = false)
    {
        try
        {
            await using var connection = await _db.CreateOpenConnectionAsync();

            var query = "SELECT ProductID, ProductName, Description, Price, Category, AvailabilityStatus, AvailabilityPeriod FROM Product WHERE 1=1";
            if (!string.IsNullOrEmpty(category) && !category.Equals("All", StringComparison.OrdinalIgnoreCase))
            {
                query += " AND Category = @category";
            }
            if (availableOnly)
            {
                query += " AND AvailabilityStatus = 'Available'";
            }
            query += " ORDER BY Category, ProductName";

            await using var cmd = connection.CreateCommand();
            cmd.CommandText = query;
            if (!string.IsNullOrEmpty(category) && !category.Equals("All", StringComparison.OrdinalIgnoreCase))
            {
                var p = cmd.CreateParameter();
                p.ParameterName = "@category";
                p.Value = category;
                cmd.Parameters.Add(p);
            }

            var products = new List<Dictionary<string, object?>>();
            await using (var reader = await cmd.ExecuteReaderAsync())
            {
                while (await reader.ReadAsync())
                {
                    products.Add(new Dictionary<string, object?>
                    {
                        ["ProductID"] = Convert.ToInt32(reader[0]),
                        ["ProductName"] = reader[1]?.ToString() ?? "",
                        ["Description"] = reader.IsDBNull(2) ? null : reader[2]?.ToString(),
                        ["Price"] = Convert.ToDecimal(reader[3]),
                        ["Category"] = reader[4]?.ToString() ?? "",
                        ["AvailabilityStatus"] = reader[5]?.ToString() ?? "Available",
                        ["AvailabilityPeriod"] = reader.IsDBNull(6) ? null : reader[6]?.ToString(),
                        ["Recipe"] = new List<Dictionary<string, object?>>()
                    });
                }
            }

            // Fetch recipes (ProductIngredient)
            var recipeCmd = connection.CreateCommand();
            recipeCmd.CommandText = @"
                SELECT pi.ProductID, pi.IngredientID, pi.QuantityRequired, i.IngredientName, i.UnitOfMeasurement, i.CurrentQuantity
                FROM ProductIngredient pi
                INNER JOIN Ingredient i ON pi.IngredientID = i.IngredientID";

            var recipeMap = new Dictionary<int, List<Dictionary<string, object?>>>();
            await using (var rdr = await recipeCmd.ExecuteReaderAsync())
            {
                while (await rdr.ReadAsync())
                {
                    var pId = Convert.ToInt32(rdr[0]);
                    if (!recipeMap.ContainsKey(pId)) recipeMap[pId] = new();

                    recipeMap[pId].Add(new Dictionary<string, object?>
                    {
                        ["ProductID"] = pId,
                        ["IngredientID"] = Convert.ToInt32(rdr[1]),
                        ["QuantityRequired"] = Convert.ToDecimal(rdr[2]),
                        ["IngredientName"] = rdr[3]?.ToString() ?? "",
                        ["UnitOfMeasurement"] = rdr[4]?.ToString() ?? "",
                        ["CurrentQuantity"] = Convert.ToDecimal(rdr[5])
                    });
                }
            }

            foreach (var p in products)
            {
                var id = (int)p["ProductID"]!;
                if (recipeMap.TryGetValue(id, out var recs))
                {
                    p["Recipe"] = recs;
                }
            }

            return Ok(new { success = true, data = products });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, error = ex.Message });
        }
    }

    [HttpGet("categories")]
    public async Task<IActionResult> GetCategories()
    {
        try
        {
            await using var connection = await _db.CreateOpenConnectionAsync();
            await using var cmd = connection.CreateCommand();
            cmd.CommandText = "SELECT DISTINCT Category FROM Product ORDER BY Category";

            var categories = new List<string> { "All" };
            await using (var reader = await cmd.ExecuteReaderAsync())
            {
                while (await reader.ReadAsync())
                {
                    categories.Add(reader.GetString(0));
                }
            }

            return Ok(new { success = true, data = categories });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, error = ex.Message });
        }
    }

    [HttpPut("{id}/status")]
    public async Task<IActionResult> ToggleStatus(int id, [FromBody] ToggleProductStatusRequest req)
    {
        if (req.Status != "Available" && req.Status != "Unavailable")
        {
            return BadRequest(new { success = false, message = "Status must be 'Available' or 'Unavailable'." });
        }

        try
        {
            await using var connection = await _db.CreateOpenConnectionAsync();
            await using var cmd = connection.CreateCommand();
            cmd.CommandText = "UPDATE Product SET AvailabilityStatus = @status WHERE ProductID = @id";

            var pStatus = cmd.CreateParameter();
            pStatus.ParameterName = "@status";
            pStatus.Value = req.Status;
            cmd.Parameters.Add(pStatus);

            var pId = cmd.CreateParameter();
            pId.ParameterName = "@id";
            pId.Value = id;
            cmd.Parameters.Add(pId);

            await cmd.ExecuteNonQueryAsync();
            return Ok(new { success = true, message = $"Product status updated to {req.Status}" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, error = ex.Message });
        }
    }

    [HttpPost]
    public async Task<IActionResult> CreateProduct([FromBody] CreateProductRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.ProductName))
        {
            return BadRequest(new { success = false, message = "Product name is required." });
        }

        await using var connection = await _db.CreateOpenConnectionAsync();
        await using var transaction = await connection.BeginTransactionAsync();
        try
        {
            var isSqlite = connection.GetType().Name.Contains("Sqlite", StringComparison.OrdinalIgnoreCase);

            // 1. Insert Product record
            await using var cmd = connection.CreateCommand();
            cmd.Transaction = transaction;
            cmd.CommandText = $@"
                INSERT INTO Product (ProductName, Description, Price, Category, AvailabilityStatus, AvailabilityPeriod)
                VALUES (@name, @desc, @price, @cat, 'Available', @period);
                {(isSqlite ? "SELECT last_insert_rowid();" : "SELECT LAST_INSERT_ID();")}";

            AddParam(cmd, "@name", req.ProductName.Trim());
            AddParam(cmd, "@desc", (object?)req.Description?.Trim() ?? DBNull.Value);
            AddParam(cmd, "@price", req.Price);
            AddParam(cmd, "@cat", req.Category.Trim());
            AddParam(cmd, "@period", (object?)req.AvailabilityPeriod?.Trim() ?? "All Day");

            var newIdObj = await cmd.ExecuteScalarAsync();
            var productId = Convert.ToInt32(newIdObj);

            // 2. Insert recipe items (ProductIngredient)
            if (req.Ingredients != null && req.Ingredients.Count > 0)
            {
                foreach (var item in req.Ingredients)
                {
                    if (item.IngredientId <= 0 || item.QuantityRequired <= 0) continue;

                    await using var recCmd = connection.CreateCommand();
                    recCmd.Transaction = transaction;
                    recCmd.CommandText = @"
                        INSERT INTO ProductIngredient (ProductID, IngredientID, QuantityRequired)
                        VALUES (@pId, @iId, @qty)";

                    AddParam(recCmd, "@pId", productId);
                    AddParam(recCmd, "@iId", item.IngredientId);
                    AddParam(recCmd, "@qty", item.QuantityRequired);

                    await recCmd.ExecuteNonQueryAsync();
                }

                // Check if any ingredient is currently out of stock (CurrentQuantity <= 0)
                await using var checkCmd = connection.CreateCommand();
                checkCmd.Transaction = transaction;
                checkCmd.CommandText = @"
                    SELECT COUNT(*) 
                    FROM ProductIngredient pi
                    JOIN Ingredient i ON pi.IngredientID = i.IngredientID
                    WHERE pi.ProductID = @pId AND i.CurrentQuantity <= 0";

                AddParam(checkCmd, "@pId", productId);
                var outCount = Convert.ToInt32(await checkCmd.ExecuteScalarAsync());

                if (outCount > 0)
                {
                    await using var updateAvailCmd = connection.CreateCommand();
                    updateAvailCmd.Transaction = transaction;
                    updateAvailCmd.CommandText = "UPDATE Product SET AvailabilityStatus = 'Unavailable' WHERE ProductID = @pId";
                    AddParam(updateAvailCmd, "@pId", productId);
                    await updateAvailCmd.ExecuteNonQueryAsync();
                }
            }

            await transaction.CommitAsync();

            return StatusCode(201, new { success = true, productId, message = "Product and recipe created successfully." });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return StatusCode(500, new { success = false, error = ex.Message });
        }
    }

    private static void AddParam(DbCommand cmd, string name, object? value)
    {
        var p = cmd.CreateParameter();
        p.ParameterName = name;
        p.Value = value ?? DBNull.Value;
        cmd.Parameters.Add(p);
    }
}
