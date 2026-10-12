using Microsoft.AspNetCore.Mvc;
using CampusCafeApi.Data;
using CampusCafeApi.Models;
using System.Data.Common;

namespace CampusCafeApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InventoryController : ControllerBase
{
    private readonly IDbConnectionFactory _db;

    public InventoryController(IDbConnectionFactory db)
    {
        _db = db;
    }

    [HttpGet("ingredients")]
    public async Task<IActionResult> GetIngredients()
    {
        try
        {
            await using var connection = await _db.CreateOpenConnectionAsync();
            await using var cmd = connection.CreateCommand();
            cmd.CommandText = @"
                SELECT 
                    IngredientID, IngredientName, UnitOfMeasurement, CurrentQuantity, MinimumStockLevel,
                    CASE
                        WHEN CurrentQuantity <= 0 THEN 'Out of Stock'
                        WHEN CurrentQuantity <= MinimumStockLevel THEN 'Low Stock'
                        ELSE 'Healthy'
                    END AS StockStatus
                FROM Ingredient
                ORDER BY 
                    CASE 
                        WHEN CurrentQuantity <= 0 THEN 1
                        WHEN CurrentQuantity <= MinimumStockLevel THEN 2
                        ELSE 3
                    END,
                    IngredientName";

            var list = new List<Dictionary<string, object?>>();
            await using (var reader = await cmd.ExecuteReaderAsync())
            {
                while (await reader.ReadAsync())
                {
                    list.Add(new Dictionary<string, object?>
                    {
                        ["IngredientID"] = reader.GetInt32(0),
                        ["IngredientName"] = reader.GetString(1),
                        ["UnitOfMeasurement"] = reader.GetString(2),
                        ["CurrentQuantity"] = reader.GetDecimal(3),
                        ["MinimumStockLevel"] = reader.GetDecimal(4),
                        ["StockStatus"] = reader.GetString(5)
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

    // Critical Business Rule: Low Stock Alerts
    [HttpGet]
    [HttpGet("low-stock")]
    public async Task<IActionResult> GetLowStock()
    {
        try
        {
            await using var connection = await _db.CreateOpenConnectionAsync();
            await using var cmd = connection.CreateCommand();
            cmd.CommandText = @"
                SELECT 
                    IngredientID, IngredientName, UnitOfMeasurement, CurrentQuantity, MinimumStockLevel,
                    (MinimumStockLevel - CurrentQuantity) AS Shortage,
                    CASE WHEN CurrentQuantity <= 0 THEN 'Out of Stock' ELSE 'Low Stock' END AS Urgency
                FROM Ingredient
                WHERE CurrentQuantity <= MinimumStockLevel
                ORDER BY CurrentQuantity ASC";

            var list = new List<Dictionary<string, object?>>();
            await using (var reader = await cmd.ExecuteReaderAsync())
            {
                while (await reader.ReadAsync())
                {
                    list.Add(new Dictionary<string, object?>
                    {
                        ["IngredientID"] = reader.GetInt32(0),
                        ["IngredientName"] = reader.GetString(1),
                        ["UnitOfMeasurement"] = reader.GetString(2),
                        ["CurrentQuantity"] = reader.GetDecimal(3),
                        ["MinimumStockLevel"] = reader.GetDecimal(4),
                        ["Shortage"] = reader.GetDecimal(5),
                        ["Urgency"] = reader.GetString(6)
                    });
                }
            }

            return Ok(new { success = true, count = list.Count, data = list });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, error = ex.Message });
        }
    }

    [HttpPost("ingredients")]
    public async Task<IActionResult> AddIngredient([FromBody] AddIngredientRequest req)
    {
        try
        {
            await using var connection = await _db.CreateOpenConnectionAsync();
            await using var cmd = connection.CreateCommand();
            var isSqlite = _db.ActiveProvider.Contains("Sqlite", StringComparison.OrdinalIgnoreCase);

            cmd.CommandText = $@"
                INSERT INTO Ingredient (IngredientName, UnitOfMeasurement, CurrentQuantity, MinimumStockLevel)
                VALUES (@name, @unit, @curr, @min);
                {(isSqlite ? "SELECT last_insert_rowid();" : "SELECT LAST_INSERT_ID();")}";

            AddParam(cmd, "@name", req.IngredientName);
            AddParam(cmd, "@unit", req.UnitOfMeasurement);
            AddParam(cmd, "@curr", req.CurrentQuantity);
            AddParam(cmd, "@min", req.MinimumStockLevel);

            var idObj = await cmd.ExecuteScalarAsync();
            return StatusCode(201, new { success = true, ingredientId = Convert.ToInt32(idObj) });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, error = ex.Message });
        }
    }

    [HttpPut("ingredients/{id}")]
    public async Task<IActionResult> UpdateIngredient(int id, [FromBody] UpdateIngredientRequest req)
    {
        try
        {
            await using var connection = await _db.CreateOpenConnectionAsync();
            await using var cmd = connection.CreateCommand();
            cmd.CommandText = @"
                UPDATE Ingredient 
                SET CurrentQuantity = COALESCE(@curr, CurrentQuantity),
                    MinimumStockLevel = COALESCE(@min, MinimumStockLevel)
                WHERE IngredientID = @id";

            AddParam(cmd, "@curr", (object?)req.CurrentQuantity ?? DBNull.Value);
            AddParam(cmd, "@min", (object?)req.MinimumStockLevel ?? DBNull.Value);
            AddParam(cmd, "@id", id);

            await cmd.ExecuteNonQueryAsync();

            // Auto-re-evaluate product availability
            await using var availCmd = connection.CreateCommand();
            availCmd.CommandText = @"
                UPDATE Product 
                SET AvailabilityStatus = 'Available' 
                WHERE ProductID NOT IN (
                    SELECT DISTINCT ProductID 
                    FROM ProductIngredient 
                    WHERE IngredientID IN (SELECT IngredientID FROM Ingredient WHERE CurrentQuantity <= 0)
                )";
            await availCmd.ExecuteNonQueryAsync();

            return Ok(new { success = true, message = "Ingredient updated successfully." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, error = ex.Message });
        }
    }

    [HttpDelete("ingredients/{id}")]
    public async Task<IActionResult> DeleteIngredient(int id)
    {
        await using var connection = await _db.CreateOpenConnectionAsync();
        await using var transaction = await connection.BeginTransactionAsync();
        try
        {
            // 1. Delete associated recipe links
            await using var recCmd = connection.CreateCommand();
            recCmd.Transaction = transaction;
            recCmd.CommandText = "DELETE FROM ProductIngredient WHERE IngredientID = @id";
            AddParam(recCmd, "@id", id);
            await recCmd.ExecuteNonQueryAsync();

            // 2. Delete delivery details if any
            await using var ddCmd = connection.CreateCommand();
            ddCmd.Transaction = transaction;
            ddCmd.CommandText = "DELETE FROM DeliveryDetail WHERE IngredientID = @id";
            AddParam(ddCmd, "@id", id);
            await ddCmd.ExecuteNonQueryAsync();

            // 3. Delete ingredient record
            await using var cmd = connection.CreateCommand();
            cmd.Transaction = transaction;
            cmd.CommandText = "DELETE FROM Ingredient WHERE IngredientID = @id";
            AddParam(cmd, "@id", id);
            var affected = await cmd.ExecuteNonQueryAsync();

            await transaction.CommitAsync();

            if (affected == 0)
            {
                return NotFound(new { success = false, message = "Ingredient not found." });
            }

            return Ok(new { success = true, message = "Ingredient removed successfully." });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return StatusCode(500, new { success = false, error = ex.Message });
        }
    }

    [HttpGet("suppliers")]
    public async Task<IActionResult> GetSuppliers()
    {
        try
        {
            await using var connection = await _db.CreateOpenConnectionAsync();
            await using var cmd = connection.CreateCommand();
            cmd.CommandText = "SELECT SupplierID, CompanyName, ContactPerson, TelephoneNumber, Email, Address FROM Supplier ORDER BY CompanyName";

            var suppliers = new List<Dictionary<string, object?>>();
            await using (var reader = await cmd.ExecuteReaderAsync())
            {
                while (await reader.ReadAsync())
                {
                    suppliers.Add(new Dictionary<string, object?>
                    {
                        ["SupplierID"] = reader.GetInt32(0),
                        ["CompanyName"] = reader.GetString(1),
                        ["ContactPerson"] = reader.IsDBNull(2) ? null : reader.GetString(2),
                        ["TelephoneNumber"] = reader.IsDBNull(3) ? null : reader.GetString(3),
                        ["Email"] = reader.IsDBNull(4) ? null : reader.GetString(4),
                        ["Address"] = reader.IsDBNull(5) ? null : reader.GetString(5)
                    });
                }
            }

            return Ok(new { success = true, data = suppliers });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, error = ex.Message });
        }
    }

    [HttpGet("deliveries")]
    public async Task<IActionResult> GetDeliveries()
    {
        try
        {
            await using var connection = await _db.CreateOpenConnectionAsync();
            await using var cmd = connection.CreateCommand();
            cmd.CommandText = @"
                SELECT d.DeliveryID, d.DeliveryDate, s.SupplierID, s.CompanyName, s.ContactPerson
                FROM Delivery d
                JOIN Supplier s ON d.SupplierID = s.SupplierID
                ORDER BY d.DeliveryDate DESC, d.DeliveryID DESC";

            var deliveries = new List<Dictionary<string, object?>>();
            await using (var reader = await cmd.ExecuteReaderAsync())
            {
                while (await reader.ReadAsync())
                {
                    deliveries.Add(new Dictionary<string, object?>
                    {
                        ["DeliveryID"] = reader.GetInt32(0),
                        ["DeliveryDate"] = reader.GetValue(1).ToString(),
                        ["SupplierID"] = reader.GetInt32(2),
                        ["CompanyName"] = reader.GetString(3),
                        ["ContactPerson"] = reader.IsDBNull(4) ? null : reader.GetString(4),
                        ["Items"] = new List<Dictionary<string, object?>>()
                    });
                }
            }

            // Fetch delivery details
            await using var detCmd = connection.CreateCommand();
            detCmd.CommandText = @"
                SELECT dd.DeliveryID, dd.IngredientID, dd.QuantityReceived, i.IngredientName, i.UnitOfMeasurement
                FROM DeliveryDetail dd
                JOIN Ingredient i ON dd.IngredientID = i.IngredientID";

            var detailMap = new Dictionary<int, List<Dictionary<string, object?>>>();
            await using (var rdr = await detCmd.ExecuteReaderAsync())
            {
                while (await rdr.ReadAsync())
                {
                    var dId = rdr.GetInt32(0);
                    if (!detailMap.ContainsKey(dId)) detailMap[dId] = new();

                    detailMap[dId].Add(new Dictionary<string, object?>
                    {
                        ["DeliveryID"] = dId,
                        ["IngredientID"] = rdr.GetInt32(1),
                        ["QuantityReceived"] = rdr.GetDecimal(2),
                        ["IngredientName"] = rdr.GetString(3),
                        ["UnitOfMeasurement"] = rdr.GetString(4)
                    });
                }
            }

            foreach (var d in deliveries)
            {
                var id = (int)d["DeliveryID"]!;
                if (detailMap.TryGetValue(id, out var items))
                {
                    d["Items"] = items;
                }
            }

            return Ok(new { success = true, data = deliveries });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, error = ex.Message });
        }
    }

    // Critical Business Rule: Deliveries logging increments Ingredient.CurrentQuantity
    [HttpPost("deliveries")]
    public async Task<IActionResult> LogDelivery([FromBody] LogDeliveryRequest req)
    {
        if (req.Items == null || req.Items.Count == 0)
        {
            return BadRequest(new { success = false, error = "At least one delivery item is required." });
        }

        await using var connection = await _db.CreateOpenConnectionAsync();
        await using var transaction = await connection.BeginTransactionAsync();
        var isSqlite = _db.ActiveProvider.Contains("Sqlite", StringComparison.OrdinalIgnoreCase);

        try
        {
            var deliveryDate = string.IsNullOrWhiteSpace(req.DeliveryDate)
                ? DateTime.Now.ToString("yyyy-MM-dd")
                : req.DeliveryDate;

            // 1. Insert Delivery header
            await using var delCmd = connection.CreateCommand();
            delCmd.Transaction = transaction;
            delCmd.CommandText = $@"
                INSERT INTO Delivery (SupplierID, DeliveryDate)
                VALUES (@suppId, @date);
                {(isSqlite ? "SELECT last_insert_rowid();" : "SELECT LAST_INSERT_ID();")}";

            AddParam(delCmd, "@suppId", req.SupplierId);
            AddParam(delCmd, "@date", deliveryDate);

            var deliveryIdObj = await delCmd.ExecuteScalarAsync();
            int deliveryId = Convert.ToInt32(deliveryIdObj);

            // 2. Insert DeliveryDetail items & increment Ingredient.CurrentQuantity
            foreach (var item in req.Items)
            {
                await using var detailCmd = connection.CreateCommand();
                detailCmd.Transaction = transaction;
                detailCmd.CommandText = @"
                    INSERT INTO DeliveryDetail (DeliveryID, IngredientID, QuantityReceived)
                    VALUES (@delId, @ingId, @qty)";

                AddParam(detailCmd, "@delId", deliveryId);
                AddParam(detailCmd, "@ingId", item.IngredientId);
                AddParam(detailCmd, "@qty", item.QuantityReceived);
                await detailCmd.ExecuteNonQueryAsync();

                // Increment stock
                await using var incCmd = connection.CreateCommand();
                incCmd.Transaction = transaction;
                incCmd.CommandText = @"
                    UPDATE Ingredient 
                    SET CurrentQuantity = CurrentQuantity + @qty 
                    WHERE IngredientID = @ingId";

                AddParam(incCmd, "@qty", item.QuantityReceived);
                AddParam(incCmd, "@ingId", item.IngredientId);
                await incCmd.ExecuteNonQueryAsync();
            }

            // 3. Re-enable products if previously out of stock
            await using var availCmd = connection.CreateCommand();
            availCmd.Transaction = transaction;
            availCmd.CommandText = @"
                UPDATE Product 
                SET AvailabilityStatus = 'Available' 
                WHERE ProductID NOT IN (
                    SELECT DISTINCT ProductID 
                    FROM ProductIngredient 
                    WHERE IngredientID IN (SELECT IngredientID FROM Ingredient WHERE CurrentQuantity <= 0)
                )";
            await availCmd.ExecuteNonQueryAsync();

            await transaction.CommitAsync();

            return StatusCode(201, new
            {
                success = true,
                message = "Delivery logged successfully and inventory stock incremented.",
                deliveryId
            });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
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
