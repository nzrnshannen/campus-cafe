using Microsoft.AspNetCore.Mvc;
using CampusCafeApi.Data;

namespace CampusCafeApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    private readonly IDbConnectionFactory _db;

    public HealthController(IDbConnectionFactory db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetHealth()
    {
        bool dbConnected = false;
        string? error = null;

        try
        {
            await using var connection = await _db.CreateOpenConnectionAsync();
            dbConnected = true;
        }
        catch (Exception ex)
        {
            error = ex.Message;
        }

        return Ok(new
        {
            status = "ok",
            serverTime = DateTime.UtcNow,
            provider = _db.ActiveProvider,
            database = new
            {
                connected = dbConnected,
                error
            }
        });
    }
}
