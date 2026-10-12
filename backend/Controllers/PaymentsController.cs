using Microsoft.AspNetCore.Mvc;
using CampusCafeApi.Data;
using CampusCafeApi.Services;
using CampusCafeApi.Models;
using System.Data.Common;
using System.Data.OleDb;

namespace CampusCafeApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PaymentsController : ControllerBase
{
    private readonly IDbConnectionFactory _db;

    public PaymentsController(IDbConnectionFactory db)
    {
        _db = db;
    }

    /// <summary>
    /// POST /api/payments: Record payment and update OrderStatus to 'Paid' using OleDbCommand.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> RecordPayment([FromBody] RecordPaymentRequest req)
    {
        if (req.OrderId <= 0 || req.AmountPaid <= 0)
        {
            return BadRequest(new { success = false, message = "Invalid OrderId or AmountPaid." });
        }

        try
        {
            await using var connection = await _db.CreateOpenConnectionAsync();
            await using var transaction = await connection.BeginTransactionAsync();

            try
            {
                // 1. Insert into Payment using OleDb parameterized command
                await using var payCmd = connection.CreateCommand();
                payCmd.Transaction = transaction;
                payCmd.CommandText = @"
                    INSERT INTO Payment (OrderID, PaymentDate, AmountPaid, PaymentMethod)
                    VALUES (@orderId, @paymentDate, @amountPaid, @paymentMethod)";

                var pOrderId = payCmd.CreateParameter();
                pOrderId.ParameterName = "@orderId";
                pOrderId.Value = req.OrderId;
                payCmd.Parameters.Add(pOrderId);

                var pDate = payCmd.CreateParameter();
                pDate.ParameterName = "@paymentDate";
                pDate.Value = req.PaymentDate ?? DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss");
                payCmd.Parameters.Add(pDate);

                var pAmount = payCmd.CreateParameter();
                pAmount.ParameterName = "@amountPaid";
                pAmount.Value = req.AmountPaid;
                payCmd.Parameters.Add(pAmount);

                var pMethod = payCmd.CreateParameter();
                pMethod.ParameterName = "@paymentMethod";
                pMethod.Value = req.PaymentMethod;
                payCmd.Parameters.Add(pMethod);

                await payCmd.ExecuteNonQueryAsync();

                // 2. Update OrderStatus to 'Paid' using OleDb parameterized command
                await using var updateCmd = connection.CreateCommand();
                updateCmd.Transaction = transaction;
                updateCmd.CommandText = "UPDATE `Order` SET OrderStatus = 'Paid' WHERE OrderID = @orderId";

                var pUpOrderId = updateCmd.CreateParameter();
                pUpOrderId.ParameterName = "@orderId";
                pUpOrderId.Value = req.OrderId;
                updateCmd.Parameters.Add(pUpOrderId);

                var rows = await updateCmd.ExecuteNonQueryAsync();
                if (rows == 0)
                {
                    await transaction.RollbackAsync();
                    return NotFound(new { success = false, message = $"Order #{req.OrderId} not found." });
                }

                await transaction.CommitAsync();

                return Ok(new
                {
                    success = true,
                    message = $"Payment of ₱{req.AmountPaid:F2} successfully recorded for Order #{req.OrderId}.",
                    orderId = req.OrderId,
                    amountPaid = req.AmountPaid,
                    paymentMethod = req.PaymentMethod
                });
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, error = ex.Message });
        }
    }
}
