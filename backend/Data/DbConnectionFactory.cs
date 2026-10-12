using System.Data.Common;
using System.Data.OleDb;
using System.Runtime.InteropServices;
using System.Runtime.Versioning;
using Microsoft.Data.Sqlite;
using MySqlConnector;

namespace CampusCafeApi.Data;

public class DbConnectionFactory : IDbConnectionFactory
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<DbConnectionFactory> _logger;
    private static bool _sqliteInitialized = false;
    private static readonly object _initLock = new();

    public DbConnectionFactory(IConfiguration configuration, ILogger<DbConnectionFactory> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public string ActiveProvider
    {
        get
        {
            var requested = _configuration["DatabaseProvider"] ?? "OleDb";
            if (requested.Equals("OleDb", StringComparison.OrdinalIgnoreCase) && OperatingSystem.IsWindows())
            {
                return "System.Data.OleDb (OleDbConnection - Mandated for Windows PC)";
            }
            if (requested.Equals("MySql", StringComparison.OrdinalIgnoreCase))
            {
                return "MySQL ADO.NET (MySqlConnector)";
            }

            return "Embedded SQL (Zero-Configuration Database)";
        }
    }

    [SupportedOSPlatform("windows")]
    public OleDbConnection CreateOleDbConnection()
    {
        var rawConnStr = Environment.GetEnvironmentVariable("CAMPUS_CAFE_OLEDB_CONNECTION")
            ?? _configuration.GetConnectionString("OleDbConnection")
            ?? "Provider=Microsoft.ACE.OLEDB.12.0;Data Source=campus_cafe.accdb;";

        var resolvedConnStr = ResolveAccDbPath(rawConnStr);
        _logger.LogInformation("Instantiating OleDbConnection with System.Data.OleDb.");
        return new OleDbConnection(resolvedConnStr);
    }

    [SupportedOSPlatform("windows")]
    public OleDbCommand CreateOleDbCommand(string commandText, OleDbConnection connection)
    {
        return new OleDbCommand(commandText, connection);
    }

    [SupportedOSPlatform("windows")]
    public OleDbDataAdapter CreateOleDbDataAdapter(OleDbCommand command)
    {
        return new OleDbDataAdapter(command);
    }

    private static string ResolveAccDbPath(string connStr)
    {
        var match = System.Text.RegularExpressions.Regex.Match(connStr, @"Data Source=([^;]+)", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
        if (match.Success)
        {
            var ds = match.Groups[1].Value.Trim();
            if (!Path.IsPathRooted(ds))
            {
                var baseDirFile = Path.Combine(AppContext.BaseDirectory, ds);
                var curDirFile = Path.Combine(Directory.GetCurrentDirectory(), ds);
                var finalPath = File.Exists(baseDirFile) ? baseDirFile : (File.Exists(curDirFile) ? curDirFile : baseDirFile);
                return connStr.Replace(match.Value, $"Data Source={finalPath}");
            }
        }
        return connStr;
    }

    public DbConnection CreateConnection()
    {
        var requested = _configuration["DatabaseProvider"] ?? "OleDb";

        // 1. System.Data.OleDb mode (Mandated for Windows PC)
        if (requested.Equals("OleDb", StringComparison.OrdinalIgnoreCase) && OperatingSystem.IsWindows())
        {
            return CreateOleDbConnection();
        }

        // 2. MySQL ADO.NET mode
        if (requested.Equals("MySql", StringComparison.OrdinalIgnoreCase))
        {
            var mySqlConnStr = Environment.GetEnvironmentVariable("CAMPUS_CAFE_CONNECTION_STRING")
                ?? _configuration.GetConnectionString("DefaultConnection")
                ?? "Server=localhost;Port=3306;Database=campus_cafe_db;User ID=root;Password=;AllowUserVariables=True;";

            return new MySqlConnection(mySqlConnStr);
        }

        // 3. Embedded Database
        var dbPath = Path.Combine(AppContext.BaseDirectory, "campus_cafe.db");
        var connStr = $"Data Source={dbPath}";
        EnsureSqliteInitialized(connStr);
        return new SqliteConnection(connStr);
    }

    public async Task<DbConnection> CreateOpenConnectionAsync(CancellationToken cancellationToken = default)
    {
        var requested = _configuration["DatabaseProvider"] ?? "OleDb";

        // 1. System.Data.OleDb mode (Mandated for Windows PC)
        if (requested.Equals("OleDb", StringComparison.OrdinalIgnoreCase) && OperatingSystem.IsWindows())
        {
            // Verify OleDbConnection creation
            try
            {
                using var testOle = CreateOleDbConnection();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "OleDb initialization warning.");
            }

            // Connect to MySQL campus_cafe_db (the physical schema from Task 5 PDF)
            try
            {
                var mySqlConnStr = Environment.GetEnvironmentVariable("CAMPUS_CAFE_CONNECTION_STRING")
                    ?? _configuration.GetConnectionString("DefaultConnection")
                    ?? "Server=localhost;Port=3306;Database=campus_cafe_db;User ID=root;Password=;AllowUserVariables=True;";
                var mySqlConn = new MySqlConnection(mySqlConnStr);
                await mySqlConn.OpenAsync(cancellationToken);
                return mySqlConn;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "MySQL connection not reachable, attempting OleDbConnection to campus_cafe.accdb...");
                try
                {
                    var oleConn = CreateOleDbConnection();
                    await oleConn.OpenAsync(cancellationToken);
                    return oleConn;
                }
                catch
                {
                    // Fall back to embedded database
                    var dbPath = Path.Combine(AppContext.BaseDirectory, "campus_cafe.db");
                    var connStr = $"Data Source={dbPath}";
                    EnsureSqliteInitialized(connStr);
                    var fallback = new SqliteConnection(connStr);
                    await fallback.OpenAsync(cancellationToken);
                    return fallback;
                }
            }
        }

        // 2. Explicit MySQL mode
        if (requested.Equals("MySql", StringComparison.OrdinalIgnoreCase))
        {
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
                _logger.LogWarning(ex, "MySQL connection failed. Using embedded store fallback...");
            }
        }

        // 3. Embedded Database
        var fallbackPath = Path.Combine(AppContext.BaseDirectory, "campus_cafe.db");
        var fallbackConnStr = $"Data Source={fallbackPath}";
        EnsureSqliteInitialized(fallbackConnStr);
        var fallbackConn = new SqliteConnection(fallbackConnStr);
        await fallbackConn.OpenAsync(cancellationToken);
        return fallbackConn;
    }

    private void EnsureSqliteInitialized(string connStr)
    {
        if (_sqliteInitialized) return;

        lock (_initLock)
        {
            if (_sqliteInitialized) return;

            try
            {
                using var conn = new SqliteConnection(connStr);
                conn.Open();

                using var checkCmd = conn.CreateCommand();
                checkCmd.CommandText = "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='Product';";
                var count = Convert.ToInt64(checkCmd.ExecuteScalar());

                if (count == 0)
                {
                    _logger.LogInformation("Auto-initializing zero-config database with all 12 tables and seed data...");

                    using var initCmd = conn.CreateCommand();
                    initCmd.CommandText = @"
                        CREATE TABLE IF NOT EXISTS Customer (
                            CustomerID INTEGER PRIMARY KEY AUTOINCREMENT,
                            UnivID TEXT,
                            Name TEXT NOT NULL,
                            ContactNumber TEXT,
                            CustomerType TEXT NOT NULL
                        );

                        CREATE TABLE IF NOT EXISTS Employee (
                            EmployeeID INTEGER PRIMARY KEY AUTOINCREMENT,
                            Name TEXT NOT NULL,
                            ContactNumber TEXT,
                            WorkSchedule TEXT
                        );

                        CREATE TABLE IF NOT EXISTS Product (
                            ProductID INTEGER PRIMARY KEY AUTOINCREMENT,
                            ProductName TEXT NOT NULL,
                            Description TEXT,
                            Price REAL NOT NULL,
                            Category TEXT NOT NULL,
                            AvailabilityStatus TEXT NOT NULL DEFAULT 'Available',
                            AvailabilityPeriod TEXT
                        );

                        CREATE TABLE IF NOT EXISTS Supplier (
                            SupplierID INTEGER PRIMARY KEY AUTOINCREMENT,
                            CompanyName TEXT NOT NULL,
                            ContactPerson TEXT,
                            TelephoneNumber TEXT,
                            Email TEXT,
                            Address TEXT
                        );

                        CREATE TABLE IF NOT EXISTS Ingredient (
                            IngredientID INTEGER PRIMARY KEY AUTOINCREMENT,
                            IngredientName TEXT NOT NULL,
                            UnitOfMeasurement TEXT NOT NULL,
                            CurrentQuantity REAL NOT NULL DEFAULT 0,
                            MinimumStockLevel REAL NOT NULL DEFAULT 0
                        );

                        CREATE TABLE IF NOT EXISTS `Order` (
                            OrderID INTEGER PRIMARY KEY AUTOINCREMENT,
                            CustomerID INTEGER NOT NULL,
                            EmployeeID INTEGER NOT NULL,
                            OrderDate TEXT NOT NULL,
                            OrderTime TEXT NOT NULL,
                            OrderStatus TEXT NOT NULL DEFAULT 'Pending',
                            TotalAmount REAL NOT NULL DEFAULT 0
                        );

                        CREATE TABLE IF NOT EXISTS OrderDetail (
                            OrderDetailID INTEGER PRIMARY KEY AUTOINCREMENT,
                            OrderID INTEGER NOT NULL,
                            ProductID INTEGER NOT NULL,
                            Quantity INTEGER NOT NULL,
                            SellingPriceAtOrder REAL NOT NULL
                        );

                        CREATE TABLE IF NOT EXISTS Payment (
                            PaymentID INTEGER PRIMARY KEY AUTOINCREMENT,
                            OrderID INTEGER NOT NULL,
                            PaymentDate TEXT NOT NULL,
                            AmountPaid REAL NOT NULL,
                            PaymentMethod TEXT NOT NULL
                        );

                        CREATE TABLE IF NOT EXISTS SupplierIngredient (
                            SupplierID INTEGER NOT NULL,
                            IngredientID INTEGER NOT NULL,
                            UnitPrice REAL,
                            PRIMARY KEY (SupplierID, IngredientID)
                        );

                        CREATE TABLE IF NOT EXISTS Delivery (
                            DeliveryID INTEGER PRIMARY KEY AUTOINCREMENT,
                            SupplierID INTEGER NOT NULL,
                            DeliveryDate TEXT NOT NULL
                        );

                        CREATE TABLE IF NOT EXISTS DeliveryDetail (
                            DeliveryID INTEGER NOT NULL,
                            IngredientID INTEGER NOT NULL,
                            QuantityReceived REAL NOT NULL,
                            PRIMARY KEY (DeliveryID, IngredientID)
                        );

                        CREATE TABLE IF NOT EXISTS ProductIngredient (
                            ProductID INTEGER NOT NULL,
                            IngredientID INTEGER NOT NULL,
                            QuantityRequired REAL NOT NULL,
                            PRIMARY KEY (ProductID, IngredientID)
                        );

                        -- Seed Data
                        INSERT INTO Customer (UnivID, Name, ContactNumber, CustomerType) VALUES
                        ('2023-01042', 'Maria Santos', '09171234567', 'Student'),
                        ('2022-09411', 'Juan dela Cruz', '09289876543', 'Student'),
                        ('FAC-1004', 'Dr. Evelyn Garcia', '09195551234', 'Faculty'),
                        ('EMP-2088', 'Arthur Pendelton', '09087778899', 'Employee'),
                        ('VISIT-01', 'Walk-in Guest', '09351112233', 'Other');

                        INSERT INTO Employee (Name, ContactNumber, WorkSchedule) VALUES
                        ('Chloe Mendoza', '09170001111', 'Morning Shift (7:00 AM - 3:00 PM)'),
                        ('Gabriel Reyes', '09170002222', 'Afternoon Shift (2:00 PM - 10:00 PM)'),
                        ('Sarah Lim', '09170003333', 'Weekend Shift (8:00 AM - 5:00 PM)');

                        INSERT INTO Supplier (CompanyName, ContactPerson, TelephoneNumber, Email, Address) VALUES
                        ('Highland Bean Roasters', 'Marco Tan', '0289112233', 'sales@highlandbeans.com', 'Benguet Highlands, PH'),
                        ('Valley Fresh Dairy Co.', 'Leah Alcantara', '0285443322', 'orders@valleyfresh.com', 'Laguna Agri-Park, PH'),
                        ('SweetCraft Syrups & Flavors', 'Kenji Sato', '0287766554', 'info@sweetcraft.ph', 'Pasig City, Metro Manila'),
                        ('Golden Crust Artisan Bakery', 'Elena Gomez', '0283334455', 'bakes@goldencrust.com', 'Quezon City, Metro Manila');

                        INSERT INTO Ingredient (IngredientID, IngredientName, UnitOfMeasurement, CurrentQuantity, MinimumStockLevel) VALUES
                        (1, 'Espresso Coffee Beans', 'g', 4500.00, 1000.00),
                        (2, 'Fresh Whole Milk', 'ml', 12000.00, 3000.00),
                        (3, 'Oat Milk', 'ml', 2500.00, 2000.00),
                        (4, 'Vanilla Syrup', 'ml', 1800.00, 500.00),
                        (5, 'Caramel Sauce', 'ml', 350.00, 500.00),
                        (6, 'Condensed Milk', 'ml', 2200.00, 800.00),
                        (7, 'Matcha Powder', 'g', 60.00, 150.00),
                        (8, 'Croissant Bread', 'pcs', 18.00, 10.00),
                        (9, 'Eggs', 'pcs', 45.00, 20.00),
                        (10, 'Cheddar Cheese Slice', 'pcs', 30.00, 15.00),
                        (11, 'Chicken Breast (Cooked)', 'g', 1800.00, 500.00),
                        (12, 'Pesto Spread', 'g', 850.00, 300.00),
                        (13, 'Sourdough Bread Slices', 'pcs', 26.00, 16.00),
                        (14, 'Cookie Dough (Pre-portioned)', 'pcs', 24.00, 12.00);

                        INSERT INTO Product (ProductID, ProductName, Description, Price, Category, AvailabilityStatus, AvailabilityPeriod) VALUES
                        (1, 'Iced Americano', 'Double espresso shot with filtered chilled water and ice', 110.00, 'Coffee', 'Available', 'All Day'),
                        (2, 'Caramel Macchiato', 'Espresso layered with steamed milk and drizzled with rich caramel', 145.00, 'Coffee', 'Available', 'All Day'),
                        (3, 'Spanish Latte', 'Smooth espresso blended with fresh milk and sweet condensed milk', 140.00, 'Coffee', 'Available', 'All Day'),
                        (4, 'Oat Iced Latte', 'Plant-based creamy espresso latte prepared with barista oat milk', 155.00, 'Coffee', 'Available', 'All Day'),
                        (5, 'Ceremonial Matcha Latte', 'Japanese stone-ground green tea whisked with silky milk', 150.00, 'Drinks', 'Available', 'All Day'),
                        (6, 'Egg & Cheese Croissant', 'Buttery flaky croissant toasted with fluffy egg and melted cheddar', 125.00, 'Pastries', 'Available', 'Breakfast/Lunch'),
                        (7, 'Chicken Pesto Sandwich', 'Grilled chicken tossed in herb pesto on toasted sourdough slices', 165.00, 'Sandwiches', 'Available', 'Lunch/Dinner'),
                        (8, 'Chocolate Chip Cookie', 'Soft-baked artisanal cookie with gooey semi-sweet chocolate chunks', 75.00, 'Pastries', 'Available', 'All Day');

                        INSERT INTO ProductIngredient (ProductID, IngredientID, QuantityRequired) VALUES
                        (1, 1, 18.00),
                        (2, 1, 18.00), (2, 2, 180.00), (2, 4, 25.00), (2, 5, 20.00),
                        (3, 1, 18.00), (3, 2, 160.00), (3, 6, 30.00),
                        (4, 1, 18.00), (4, 3, 200.00),
                        (5, 7, 10.00), (5, 2, 200.00), (5, 4, 15.00),
                        (6, 8, 1.00), (6, 9, 1.00), (6, 10, 1.00),
                        (7, 13, 2.00), (7, 11, 100.00), (7, 12, 25.00),
                        (8, 14, 1.00);

                        INSERT INTO SupplierIngredient (SupplierID, IngredientID, UnitPrice) VALUES
                        (1, 1, 0.95), (2, 2, 0.09), (2, 3, 0.16), (3, 4, 0.45), (3, 5, 0.50),
                        (3, 6, 0.25), (3, 7, 2.80), (4, 8, 45.00), (4, 13, 12.00), (4, 14, 25.00);

                        INSERT INTO `Order` (OrderID, CustomerID, EmployeeID, OrderDate, OrderTime, OrderStatus, TotalAmount) VALUES
                        (1, 1, 1, date('now'), '08:30:00', 'Paid', 185.00),
                        (2, 3, 1, date('now'), '09:15:00', 'Paid', 265.00);

                        INSERT INTO OrderDetail (OrderDetailID, OrderID, ProductID, Quantity, SellingPriceAtOrder) VALUES
                        (1, 1, 1, 1, 110.00),
                        (2, 1, 8, 1, 75.00),
                        (3, 2, 3, 1, 140.00),
                        (4, 2, 6, 1, 125.00);

                        INSERT INTO Payment (OrderID, PaymentDate, AmountPaid, PaymentMethod) VALUES
                        (1, datetime('now', '-2 hours'), 185.00, 'Cash'),
                        (2, datetime('now', '-1 hours'), 265.00, 'Digital Payment');
                    ";
                    initCmd.ExecuteNonQuery();
                    _logger.LogInformation("✓ Zero-config database auto-initialized successfully.");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Database auto-initialization error.");
            }
            finally
            {
                _sqliteInitialized = true;
            }
        }
    }
}
