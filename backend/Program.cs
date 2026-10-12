using CampusCafeApi.Data;
using CampusCafeApi.Services;

var builder = WebApplication.CreateBuilder(args);

// Register OleDb Database Service and Connection Factory
builder.Services.AddSingleton<IDatabaseService, DatabaseService>();
builder.Services.AddSingleton<IDbConnectionFactory, DbConnectionFactory>();

// Add CORS Policy for React Frontend (ports 3000, 5173)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

var app = builder.Build();

// Enable CORS
app.UseCors("AllowAll");

app.UseAuthorization();
app.MapControllers();

Console.WriteLine("==========================================================");
Console.WriteLine("☕ Campus Café ASP.NET Core Web API (.NET 8) Started");
Console.WriteLine("   Database Driver: System.Data.OleDb (OleDbConnection)");
Console.WriteLine("   Health Check: http://localhost:5000/api/health");
Console.WriteLine("==========================================================");

app.Run("http://0.0.0.0:5000");
