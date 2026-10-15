using Microsoft.AspNetCore.Mvc;
using CampusCafeApi.Data;
using CampusCafeApi.Models;
using System.Data.Common;

namespace CampusCafeApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly IDbConnectionFactory _db;

    public OrdersController(IDbConnectionFactory db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetOrders([FromQuery] string? status)
    {
        try
        {
            await using var connection = await _db.CreateOpenConnectionAsync();

            var query = @"
                SELECT 
                    o.OrderID, o.OrderDate, o.OrderTime, o.OrderStatus, o.TotalAmount,
                    c.CustomerID, c.Name AS CustomerName, c.CustomerType, c.UnivID,
                    e.EmployeeID, e.Name AS CashierName,
                    p.PaymentID, p.PaymentMethod, p.PaymentDate, p.AmountPaid
                FROM `Order` o
                JOIN Customer c ON o.CustomerID = c.CustomerID
                JOIN Employee e ON o.EmployeeID = e.EmployeeID
                LEFT JOIN Payment p ON o.OrderID = p.OrderID
                WHERE 1=1";

            if (!string.IsNullOrEmpty(status) && !status.Equals("All", StringComparison.OrdinalIgnoreCase))
            {
                query += " AND o.OrderStatus = @status";
            }
            query += " ORDER BY o.OrderID DESC";

            await using var cmd = connection.CreateCommand();
            cmd.CommandText = query;
            if (!string.IsNullOrEmpty(status) && !status.Equals("All", StringComparison.OrdinalIgnoreCase))
            {
                var p = cmd.CreateParameter();
                p.ParameterName = "@status";
                p.Value = status;
                cmd.Parameters.Add(p);
            }

            var orders = new List<Dictionary<string, object?>>();
            await using (var reader = await cmd.ExecuteReaderAsync())
            {
                while (await reader.ReadAsync())
                {
                    orders.Add(new Dictionary<string, object?>
                    {
                        ["OrderID"] = reader.GetInt32(0),
                        ["OrderDate"] = reader.GetValue(1).ToString(),
                        ["OrderTime"] = reader.GetValue(2).ToString(),
                        ["OrderStatus"] = reader.GetString(3),
                        ["TotalAmount"] = reader.GetDecimal(4),
                        ["CustomerID"] = reader.GetInt32(5),
                        ["CustomerName"] = reader.GetString(6),
                        ["CustomerType"] = reader.GetString(7),
                        ["UnivID"] = reader.IsDBNull(8) ? null : reader.GetString(8),
                        ["EmployeeID"] = reader.GetInt32(9),
                        ["CashierName"] = reader.GetString(10),
                        ["PaymentID"] = reader.IsDBNull(11) ? null : reader.GetInt32(11),
                        ["PaymentMethod"] = reader.IsDBNull(12) ? null : reader.GetString(12),
                        ["PaymentDate"] = reader.IsDBNull(13) ? null : reader.GetValue(13).ToString(),
                        ["AmountPaid"] = reader.IsDBNull(14) ? null : reader.GetDecimal(14),
                        ["Items"] = new List<Dictionary<string, object?>>()
                    });
                }
            }

            // Fetch order items
            await using var itemCmd = connection.CreateCommand();
            itemCmd.CommandText = @"
                SELECT od.OrderDetailID, od.OrderID, od.ProductID, od.Quantity, od.SellingPriceAtOrder, pr.ProductName, pr.Category
                FROM OrderDetail od
                JOIN Product pr ON od.ProductID = pr.ProductID";

            var itemsMap = new Dictionary<int, List<Dictionary<string, object?>>>();
            await using (var rdr = await itemCmd.ExecuteReaderAsync())
            {
                while (await rdr.ReadAsync())
                {
                    var oId = rdr.GetInt32(1);
                    if (!itemsMap.ContainsKey(oId)) itemsMap[oId] = new();

                    var price = rdr.GetDecimal(4);
                    var qty = rdr.GetInt32(3);
                    itemsMap[oId].Add(new Dictionary<string, object?>
                    {
                        ["OrderDetailID"] = rdr.GetInt32(0),
                        ["ProductID"] = rdr.GetInt32(2),
                        ["Quantity"] = qty,
                        ["SellingPriceAtOrder"] = price,
                        ["ProductName"] = rdr.GetString(5),
                        ["Category"] = rdr.GetString(6),
                        ["Subtotal"] = price * qty
                    });
                }
            }

            foreach (var ord in orders)
            {
                var id = (int)ord["OrderID"]!;
                if (itemsMap.TryGetValue(id, out var itms))
                {
                    ord["Items"] = itms;
                }
            }

            return Ok(new { success = true, data = orders });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, error = ex.Message });
        }
    }

    [HttpPost]
    public async Task<IActionResult> CreateOrder([FromBody] CreateOrderRequest req)
    {
        if (req.Items == null || req.Items.Count == 0)
        {
            return BadRequest(new { success = false, error = "Order must contain at least one item." });
        }

        await using var connection = await _db.CreateOpenConnectionAsync();
        await using var transaction = await connection.BeginTransactionAsync();
        var isSqlite = connection.GetType().Name.Contains("Sqlite", StringComparison.OrdinalIgnoreCase);

        try
        {
            // 1. Fetch products and check availability
            var productIds = req.Items.Select(i => i.ProductId).Distinct().ToList();
            var inClause = string.Join(",", productIds);

            await using var prodCmd = connection.CreateCommand();
            prodCmd.Transaction = transaction;
            prodCmd.CommandText = $"SELECT ProductID, ProductName, Price, AvailabilityStatus FROM Product WHERE ProductID IN ({inClause})";

            var productMap = new Dictionary<int, (string Name, decimal Price, string Status)>();
            await using (var reader = await prodCmd.ExecuteReaderAsync())
            {
                while (await reader.ReadAsync())
                {
                    productMap[reader.GetInt32(0)] = (reader.GetString(1), reader.GetDecimal(2), reader.GetString(3));
                }
            }

            foreach (var item in req.Items)
            {
                if (!productMap.TryGetValue(item.ProductId, out var prod))
                {
                    await transaction.RollbackAsync();
                    return BadRequest(new { success = false, error = $"Product ID {item.ProductId} not found." });
                }
                if (prod.Status != "Available")
                {
                    await transaction.RollbackAsync();
                    return BadRequest(new { success = false, error = $"'{prod.Name}' is currently marked Unavailable." });
                }
            }

            // 2. Fetch recipes (ProductIngredient) for ordered products
            await using var recipeCmd = connection.CreateCommand();
            recipeCmd.Transaction = transaction;
            recipeCmd.CommandText = $@"
                SELECT pi.ProductID, pi.IngredientID, pi.QuantityRequired, i.IngredientName, i.CurrentQuantity, i.UnitOfMeasurement
                FROM ProductIngredient pi
                JOIN Ingredient i ON pi.IngredientID = i.IngredientID
                WHERE pi.ProductID IN ({inClause})";

            var requiredIngredients = new Dictionary<int, (string Name, string Unit, decimal Available, decimal Needed)>();
            await using (var rdr = await recipeCmd.ExecuteReaderAsync())
            {
                var recipes = new List<(int ProductId, int IngredientId, decimal QtyReq, string Name, decimal Current, string Unit)>();
                while (await rdr.ReadAsync())
                {
                    recipes.Add((rdr.GetInt32(0), rdr.GetInt32(1), rdr.GetDecimal(2), rdr.GetString(3), rdr.GetDecimal(4), rdr.GetString(5)));
                }

                foreach (var item in req.Items)
                {
                    var itemRecipes = recipes.Where(r => r.ProductId == item.ProductId);
                    foreach (var rec in itemRecipes)
                    {
                        var totalNeeded = rec.QtyReq * item.Quantity;
                        if (!requiredIngredients.ContainsKey(rec.IngredientId))
                        {
                            requiredIngredients[rec.IngredientId] = (rec.Name, rec.Unit, rec.Current, totalNeeded);
                        }
                        else
                        {
                            var existing = requiredIngredients[rec.IngredientId];
                            requiredIngredients[rec.IngredientId] = (existing.Name, existing.Unit, existing.Available, existing.Needed + totalNeeded);
                        }
                    }
                }
            }

            // 3. Stock Validation: Check if any ingredient is short
            foreach (var kvp in requiredIngredients)
            {
                var ing = kvp.Value;
                if (ing.Available < ing.Needed)
                {
                    await transaction.RollbackAsync();
                    return BadRequest(new
                    {
                        success = false,
                        error = $"Insufficient stock for '{ing.Name}'. Needed: {ing.Needed} {ing.Unit}, Available: {ing.Available} {ing.Unit}. Transaction rolled back."
                    });
                }
            }

            // 4. Calculate total amount
            decimal totalAmount = 0;
            foreach (var item in req.Items)
            {
                totalAmount += productMap[item.ProductId].Price * item.Quantity;
            }

            var isPaid = !string.IsNullOrWhiteSpace(req.PaymentMethod);
            var initialStatus = isPaid ? "Paid" : "Pending";
            var now = DateTime.Now;

            // 5. Insert Order
            await using var orderCmd = connection.CreateCommand();
            orderCmd.Transaction = transaction;
            orderCmd.CommandText = $@"
                INSERT INTO `Order` (CustomerID, EmployeeID, OrderDate, OrderTime, OrderStatus, TotalAmount)
                VALUES (@cust, @emp, @date, @time, @status, @total);
                {(isSqlite ? "SELECT last_insert_rowid();" : "SELECT LAST_INSERT_ID();")}";

            AddParam(orderCmd, "@cust", req.CustomerId);
            AddParam(orderCmd, "@emp", req.EmployeeId);
            AddParam(orderCmd, "@date", now.ToString("yyyy-MM-dd"));
            AddParam(orderCmd, "@time", now.ToString("HH:mm:ss"));
            AddParam(orderCmd, "@status", initialStatus);
            AddParam(orderCmd, "@total", totalAmount);

            var orderIdObj = await orderCmd.ExecuteScalarAsync();
            int orderId = Convert.ToInt32(orderIdObj);

            // 6. Bulk Insert OrderDetail items (preserving SellingPriceAtOrder)
            foreach (var item in req.Items)
            {
                await using var itemCmd = connection.CreateCommand();
                itemCmd.Transaction = transaction;
                itemCmd.CommandText = @"
                    INSERT INTO OrderDetail (OrderID, ProductID, Quantity, SellingPriceAtOrder)
                    VALUES (@orderId, @prodId, @qty, @price)";

                AddParam(itemCmd, "@orderId", orderId);
                AddParam(itemCmd, "@prodId", item.ProductId);
                AddParam(itemCmd, "@qty", item.Quantity);
                AddParam(itemCmd, "@price", productMap[item.ProductId].Price);

                await itemCmd.ExecuteNonQueryAsync();
            }

            // 7. Deduct stock from Ingredient.CurrentQuantity
            foreach (var kvp in requiredIngredients)
            {
                await using var deductCmd = connection.CreateCommand();
                deductCmd.Transaction = transaction;
                deductCmd.CommandText = "UPDATE Ingredient SET CurrentQuantity = CurrentQuantity - @needed WHERE IngredientID = @ingId";
                AddParam(deductCmd, "@needed", kvp.Value.Needed);
                AddParam(deductCmd, "@ingId", kvp.Key);
                await deductCmd.ExecuteNonQueryAsync();
            }

            // 8. Auto-mark dependent products as 'Unavailable' if any ingredient reached 0
            await using var autoAvailCmd = connection.CreateCommand();
            autoAvailCmd.Transaction = transaction;
            autoAvailCmd.CommandText = @"
                UPDATE Product 
                SET AvailabilityStatus = 'Unavailable' 
                WHERE ProductID IN (
                    SELECT DISTINCT ProductID 
                    FROM ProductIngredient 
                    WHERE IngredientID IN (SELECT IngredientID FROM Ingredient WHERE CurrentQuantity <= 0)
                )";
            await autoAvailCmd.ExecuteNonQueryAsync();

            // 9. If paid immediately, record Payment
            if (isPaid)
            {
                await using var payCmd = connection.CreateCommand();
                payCmd.Transaction = transaction;
                payCmd.CommandText = @"
                    INSERT INTO Payment (OrderID, PaymentDate, AmountPaid, PaymentMethod)
                    VALUES (@ordId, @payDate, @amt, @method)";
                AddParam(payCmd, "@ordId", orderId);
                AddParam(payCmd, "@payDate", now.ToString("yyyy-MM-dd HH:mm:ss"));
                AddParam(payCmd, "@amt", totalAmount);
                AddParam(payCmd, "@method", req.PaymentMethod!);
                await payCmd.ExecuteNonQueryAsync();
            }

            await transaction.CommitAsync();

            return StatusCode(201, new
            {
                success = true,
                message = "Order placed successfully with stock deducted.",
                orderId,
                totalAmount,
                orderStatus = initialStatus
            });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return StatusCode(500, new { success = false, error = ex.Message });
        }
    }

    [HttpPost("{id}/pay")]
    public async Task<IActionResult> SettlePayment(int id, [FromBody] SettlePaymentRequest req)
    {
        await using var connection = await _db.CreateOpenConnectionAsync();
        await using var transaction = await connection.BeginTransactionAsync();

        try
        {
            await using var chkCmd = connection.CreateCommand();
            chkCmd.Transaction = transaction;
            chkCmd.CommandText = "SELECT OrderID, TotalAmount, OrderStatus FROM `Order` WHERE OrderID = @id";
            AddParam(chkCmd, "@id", id);

            decimal totalAmount = 0;
            string status = "";
            await using (var rdr = await chkCmd.ExecuteReaderAsync())
            {
                if (!await rdr.ReadAsync())
                {
                    await transaction.RollbackAsync();
                    return NotFound(new { success = false, message = "Order not found." });
                }
                totalAmount = rdr.GetDecimal(1);
                status = rdr.GetString(2);
            }

            if (status == "Paid")
            {
                await transaction.RollbackAsync();
                return BadRequest(new { success = false, message = "Order is already marked as Paid." });
            }

            if (status == "Cancelled")
            {
                await transaction.RollbackAsync();
                return BadRequest(new { success = false, message = "Cannot pay a cancelled order." });
            }

            var amountToPay = req.AmountPaid ?? totalAmount;
            var nowStr = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss");

            await using var payCmd = connection.CreateCommand();
            payCmd.Transaction = transaction;
            payCmd.CommandText = @"
                INSERT INTO Payment (OrderID, PaymentDate, AmountPaid, PaymentMethod)
                VALUES (@id, @payDate, @amt, @method)";
            AddParam(payCmd, "@id", id);
            AddParam(payCmd, "@payDate", nowStr);
            AddParam(payCmd, "@amt", amountToPay);
            AddParam(payCmd, "@method", req.PaymentMethod);
            await payCmd.ExecuteNonQueryAsync();

            await using var updateCmd = connection.CreateCommand();
            updateCmd.Transaction = transaction;
            updateCmd.CommandText = "UPDATE `Order` SET OrderStatus = 'Paid' WHERE OrderID = @id";
            AddParam(updateCmd, "@id", id);
            await updateCmd.ExecuteNonQueryAsync();

            await transaction.CommitAsync();

            return Ok(new { success = true, message = "Payment recorded successfully.", orderStatus = "Paid" });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return StatusCode(500, new { success = false, error = ex.Message });
        }
    }

    [HttpPut("{id}/cancel")]
    public async Task<IActionResult> CancelOrder(int id)
    {
        await using var connection = await _db.CreateOpenConnectionAsync();
        await using var transaction = await connection.BeginTransactionAsync();

        try
        {
            await using var chkCmd = connection.CreateCommand();
            chkCmd.Transaction = transaction;
            chkCmd.CommandText = "SELECT OrderID, OrderStatus FROM `Order` WHERE OrderID = @id";
            AddParam(chkCmd, "@id", id);

            string status = "";
            await using (var rdr = await chkCmd.ExecuteReaderAsync())
            {
                if (!await rdr.ReadAsync())
                {
                    await transaction.RollbackAsync();
                    return NotFound(new { success = false, message = "Order not found." });
                }
                status = rdr.GetString(1);
            }

            if (status == "Cancelled")
            {
                await transaction.RollbackAsync();
                return BadRequest(new { success = false, message = "Order is already cancelled." });
            }

            // Fetch items to restore ingredient stocks
            await using var itemCmd = connection.CreateCommand();
            itemCmd.Transaction = transaction;
            itemCmd.CommandText = @"
                SELECT od.ProductID, od.Quantity, pi.IngredientID, pi.QuantityRequired
                FROM OrderDetail od
                JOIN ProductIngredient pi ON od.ProductID = pi.ProductID
                WHERE od.OrderID = @id";
            AddParam(itemCmd, "@id", id);

            var restoreItems = new List<(int IngId, decimal RestoreQty)>();
            await using (var rdr = await itemCmd.ExecuteReaderAsync())
            {
                while (await rdr.ReadAsync())
                {
                    var qty = rdr.GetInt32(1);
                    var req = rdr.GetDecimal(3);
                    restoreItems.Add((rdr.GetInt32(2), qty * req));
                }
            }

            foreach (var r in restoreItems)
            {
                await using var restoreCmd = connection.CreateCommand();
                restoreCmd.Transaction = transaction;
                restoreCmd.CommandText = "UPDATE Ingredient SET CurrentQuantity = CurrentQuantity + @qty WHERE IngredientID = @ingId";
                AddParam(restoreCmd, "@qty", r.RestoreQty);
                AddParam(restoreCmd, "@ingId", r.IngId);
                await restoreCmd.ExecuteNonQueryAsync();
            }

            // Update status
            await using var updateCmd = connection.CreateCommand();
            updateCmd.Transaction = transaction;
            updateCmd.CommandText = "UPDATE `Order` SET OrderStatus = 'Cancelled' WHERE OrderID = @id";
            AddParam(updateCmd, "@id", id);
            await updateCmd.ExecuteNonQueryAsync();

            // Re-evaluate product availability
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

            return Ok(new { success = true, message = "Order cancelled and ingredients restored to stock." });
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
