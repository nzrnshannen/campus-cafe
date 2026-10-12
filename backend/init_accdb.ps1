$dbPath = "C:\Users\nzrns\Desktop\cafe system smth\backend\campus_cafe.accdb"
if (Test-Path $dbPath) {
    Remove-Item $dbPath -Force
}

$cat = New-Object -ComObject ADOX.Catalog
$cat.Create("Provider=Microsoft.ACE.OLEDB.12.0;Data Source=$dbPath;")
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($cat) | Out-Null

$conn = New-Object System.Data.OleDb.OleDbConnection("Provider=Microsoft.ACE.OLEDB.12.0;Data Source=$dbPath;")
$conn.Open()

$tables = @(
    "CREATE TABLE Customer (
        CustomerID AUTOINCREMENT PRIMARY KEY,
        UnivID TEXT(20),
        Name TEXT(100) NOT NULL,
        ContactNumber TEXT(20),
        CustomerType TEXT(50) NOT NULL
    );",
    "CREATE TABLE Employee (
        EmployeeID AUTOINCREMENT PRIMARY KEY,
        Name TEXT(100) NOT NULL,
        ContactNumber TEXT(20),
        WorkSchedule TEXT(100)
    );",
    "CREATE TABLE Product (
        ProductID AUTOINCREMENT PRIMARY KEY,
        ProductName TEXT(100) NOT NULL,
        Description TEXT(255),
        Price CURRENCY NOT NULL,
        Category TEXT(50) NOT NULL,
        AvailabilityStatus TEXT(50) DEFAULT 'Available',
        AvailabilityPeriod TEXT(50)
    );",
    "CREATE TABLE Supplier (
        SupplierID AUTOINCREMENT PRIMARY KEY,
        CompanyName TEXT(100) NOT NULL,
        ContactPerson TEXT(100),
        TelephoneNumber TEXT(20),
        Email TEXT(100),
        Address TEXT(255)
    );",
    "CREATE TABLE Ingredient (
        IngredientID AUTOINCREMENT PRIMARY KEY,
        IngredientName TEXT(100) NOT NULL,
        UnitOfMeasurement TEXT(20) NOT NULL,
        CurrentQuantity DOUBLE DEFAULT 0,
        MinimumStockLevel DOUBLE DEFAULT 0
    );",
    "CREATE TABLE [Order] (
        OrderID AUTOINCREMENT PRIMARY KEY,
        CustomerID INT NOT NULL,
        EmployeeID INT NOT NULL,
        OrderDate TEXT(20) NOT NULL,
        OrderTime TEXT(20) NOT NULL,
        OrderStatus TEXT(50) DEFAULT 'Pending',
        TotalAmount CURRENCY DEFAULT 0
    );",
    "CREATE TABLE OrderDetail (
        OrderDetailID AUTOINCREMENT PRIMARY KEY,
        OrderID INT NOT NULL,
        ProductID INT NOT NULL,
        Quantity INT NOT NULL,
        SellingPriceAtOrder CURRENCY NOT NULL
    );",
    "CREATE TABLE Payment (
        PaymentID AUTOINCREMENT PRIMARY KEY,
        OrderID INT NOT NULL,
        PaymentDate TEXT(30) NOT NULL,
        AmountPaid CURRENCY NOT NULL,
        PaymentMethod TEXT(50) NOT NULL
    );",
    "CREATE TABLE SupplierIngredient (
        SupplierID INT NOT NULL,
        IngredientID INT NOT NULL,
        UnitPrice CURRENCY,
        CONSTRAINT PK_SupplierIngredient PRIMARY KEY (SupplierID, IngredientID)
    );",
    "CREATE TABLE Delivery (
        DeliveryID AUTOINCREMENT PRIMARY KEY,
        SupplierID INT NOT NULL,
        DeliveryDate TEXT(20) NOT NULL
    );",
    "CREATE TABLE DeliveryDetail (
        DeliveryID INT NOT NULL,
        IngredientID INT NOT NULL,
        QuantityReceived DOUBLE NOT NULL,
        CONSTRAINT PK_DeliveryDetail PRIMARY KEY (DeliveryID, IngredientID)
    );",
    "CREATE TABLE ProductIngredient (
        ProductID INT NOT NULL,
        IngredientID INT NOT NULL,
        QuantityRequired DOUBLE NOT NULL,
        CONSTRAINT PK_ProductIngredient PRIMARY KEY (ProductID, IngredientID)
    );"
)

foreach ($sql in $tables) {
    $cmd = $conn.CreateCommand()
    $cmd.CommandText = $sql
    $cmd.ExecuteNonQuery() | Out-Null
}

$seeds = @(
    "INSERT INTO Customer (UnivID, Name, ContactNumber, CustomerType) VALUES ('2023-01042', 'Maria Santos', '09171234567', 'Student');",
    "INSERT INTO Customer (UnivID, Name, ContactNumber, CustomerType) VALUES ('2022-09411', 'Juan dela Cruz', '09289876543', 'Student');",
    "INSERT INTO Customer (UnivID, Name, ContactNumber, CustomerType) VALUES ('FAC-1004', 'Dr. Evelyn Garcia', '09195551234', 'Faculty');",
    "INSERT INTO Customer (UnivID, Name, ContactNumber, CustomerType) VALUES ('EMP-2088', 'Arthur Pendelton', '09087778899', 'Employee');",
    "INSERT INTO Customer (UnivID, Name, ContactNumber, CustomerType) VALUES ('VISIT-01', 'Walk-in Guest', '09351112233', 'Other');",

    "INSERT INTO Employee (Name, ContactNumber, WorkSchedule) VALUES ('Chloe Mendoza', '09170001111', 'Morning Shift (7:00 AM - 3:00 PM)');",
    "INSERT INTO Employee (Name, ContactNumber, WorkSchedule) VALUES ('Gabriel Reyes', '09170002222', 'Afternoon Shift (2:00 PM - 10:00 PM)');",
    "INSERT INTO Employee (Name, ContactNumber, WorkSchedule) VALUES ('Sarah Lim', '09170003333', 'Weekend Shift (8:00 AM - 5:00 PM)');",

    "INSERT INTO Supplier (CompanyName, ContactPerson, TelephoneNumber, Email, Address) VALUES ('Highland Bean Roasters', 'Marco Tan', '0289112233', 'sales@highlandbeans.com', 'Benguet Highlands, PH');",
    "INSERT INTO Supplier (CompanyName, ContactPerson, TelephoneNumber, Email, Address) VALUES ('Valley Fresh Dairy Co.', 'Leah Alcantara', '0285443322', 'orders@valleyfresh.com', 'Laguna Agri-Park, PH');",
    "INSERT INTO Supplier (CompanyName, ContactPerson, TelephoneNumber, Email, Address) VALUES ('SweetCraft Syrups & Flavors', 'Kenji Sato', '0287766554', 'info@sweetcraft.ph', 'Pasig City, Metro Manila');",
    "INSERT INTO Supplier (CompanyName, ContactPerson, TelephoneNumber, Email, Address) VALUES ('Golden Crust Artisan Bakery', 'Elena Gomez', '0283334455', 'bakes@goldencrust.com', 'Quezon City, Metro Manila');",

    "INSERT INTO Ingredient (IngredientName, UnitOfMeasurement, CurrentQuantity, MinimumStockLevel) VALUES ('Espresso Coffee Beans', 'g', 4500.00, 1000.00);",
    "INSERT INTO Ingredient (IngredientName, UnitOfMeasurement, CurrentQuantity, MinimumStockLevel) VALUES ('Fresh Whole Milk', 'ml', 12000.00, 3000.00);",
    "INSERT INTO Ingredient (IngredientName, UnitOfMeasurement, CurrentQuantity, MinimumStockLevel) VALUES ('Oat Milk', 'ml', 2500.00, 2000.00);",
    "INSERT INTO Ingredient (IngredientName, UnitOfMeasurement, CurrentQuantity, MinimumStockLevel) VALUES ('Vanilla Syrup', 'ml', 1800.00, 500.00);",
    "INSERT INTO Ingredient (IngredientName, UnitOfMeasurement, CurrentQuantity, MinimumStockLevel) VALUES ('Caramel Sauce', 'ml', 350.00, 500.00);",
    "INSERT INTO Ingredient (IngredientName, UnitOfMeasurement, CurrentQuantity, MinimumStockLevel) VALUES ('Condensed Milk', 'ml', 2200.00, 800.00);",
    "INSERT INTO Ingredient (IngredientName, UnitOfMeasurement, CurrentQuantity, MinimumStockLevel) VALUES ('Matcha Powder', 'g', 60.00, 150.00);",
    "INSERT INTO Ingredient (IngredientName, UnitOfMeasurement, CurrentQuantity, MinimumStockLevel) VALUES ('Croissant Bread', 'pcs', 18.00, 10.00);",
    "INSERT INTO Ingredient (IngredientName, UnitOfMeasurement, CurrentQuantity, MinimumStockLevel) VALUES ('Eggs', 'pcs', 45.00, 20.00);",
    "INSERT INTO Ingredient (IngredientName, UnitOfMeasurement, CurrentQuantity, MinimumStockLevel) VALUES ('Cheddar Cheese Slice', 'pcs', 30.00, 15.00);",
    "INSERT INTO Ingredient (IngredientName, UnitOfMeasurement, CurrentQuantity, MinimumStockLevel) VALUES ('Chicken Breast (Cooked)', 'g', 1800.00, 500.00);",
    "INSERT INTO Ingredient (IngredientName, UnitOfMeasurement, CurrentQuantity, MinimumStockLevel) VALUES ('Pesto Spread', 'g', 850.00, 300.00);",
    "INSERT INTO Ingredient (IngredientName, UnitOfMeasurement, CurrentQuantity, MinimumStockLevel) VALUES ('Sourdough Bread Slices', 'pcs', 26.00, 16.00);",
    "INSERT INTO Ingredient (IngredientName, UnitOfMeasurement, CurrentQuantity, MinimumStockLevel) VALUES ('Cookie Dough (Pre-portioned)', 'pcs', 24.00, 12.00);",

    "INSERT INTO Product (ProductName, Description, Price, Category, AvailabilityStatus, AvailabilityPeriod) VALUES ('Iced Americano', 'Double espresso shot with filtered chilled water and ice', 110.00, 'Coffee', 'Available', 'All Day');",
    "INSERT INTO Product (ProductName, Description, Price, Category, AvailabilityStatus, AvailabilityPeriod) VALUES ('Caramel Macchiato', 'Espresso layered with steamed milk and drizzled with rich caramel', 145.00, 'Coffee', 'Available', 'All Day');",
    "INSERT INTO Product (ProductName, Description, Price, Category, AvailabilityStatus, AvailabilityPeriod) VALUES ('Spanish Latte', 'Smooth espresso blended with fresh milk and sweet condensed milk', 140.00, 'Coffee', 'Available', 'All Day');",
    "INSERT INTO Product (ProductName, Description, Price, Category, AvailabilityStatus, AvailabilityPeriod) VALUES ('Oat Iced Latte', 'Plant-based creamy espresso latte prepared with barista oat milk', 155.00, 'Coffee', 'Available', 'All Day');",
    "INSERT INTO Product (ProductName, Description, Price, Category, AvailabilityStatus, AvailabilityPeriod) VALUES ('Ceremonial Matcha Latte', 'Japanese stone-ground green tea whisked with silky milk', 150.00, 'Drinks', 'Available', 'All Day');",
    "INSERT INTO Product (ProductName, Description, Price, Category, AvailabilityStatus, AvailabilityPeriod) VALUES ('Egg & Cheese Croissant', 'Buttery flaky croissant toasted with fluffy egg and melted cheddar', 125.00, 'Pastries', 'Available', 'Breakfast/Lunch');",
    "INSERT INTO Product (ProductName, Description, Price, Category, AvailabilityStatus, AvailabilityPeriod) VALUES ('Chicken Pesto Sandwich', 'Grilled chicken tossed in herb pesto on toasted sourdough slices', 165.00, 'Sandwiches', 'Available', 'Lunch/Dinner');",
    "INSERT INTO Product (ProductName, Description, Price, Category, AvailabilityStatus, AvailabilityPeriod) VALUES ('Chocolate Chip Cookie', 'Soft-baked artisanal cookie with gooey semi-sweet chocolate chunks', 75.00, 'Pastries', 'Available', 'All Day');",

    "INSERT INTO ProductIngredient (ProductID, IngredientID, QuantityRequired) VALUES (1, 1, 18.00);",
    "INSERT INTO ProductIngredient (ProductID, IngredientID, QuantityRequired) VALUES (2, 1, 18.00);",
    "INSERT INTO ProductIngredient (ProductID, IngredientID, QuantityRequired) VALUES (2, 2, 180.00);",
    "INSERT INTO ProductIngredient (ProductID, IngredientID, QuantityRequired) VALUES (2, 4, 25.00);",
    "INSERT INTO ProductIngredient (ProductID, IngredientID, QuantityRequired) VALUES (2, 5, 20.00);",
    "INSERT INTO ProductIngredient (ProductID, IngredientID, QuantityRequired) VALUES (3, 1, 18.00);",
    "INSERT INTO ProductIngredient (ProductID, IngredientID, QuantityRequired) VALUES (3, 2, 160.00);",
    "INSERT INTO ProductIngredient (ProductID, IngredientID, QuantityRequired) VALUES (3, 6, 30.00);",
    "INSERT INTO ProductIngredient (ProductID, IngredientID, QuantityRequired) VALUES (4, 1, 18.00);",
    "INSERT INTO ProductIngredient (ProductID, IngredientID, QuantityRequired) VALUES (4, 3, 200.00);",
    "INSERT INTO ProductIngredient (ProductID, IngredientID, QuantityRequired) VALUES (5, 7, 10.00);",
    "INSERT INTO ProductIngredient (ProductID, IngredientID, QuantityRequired) VALUES (5, 2, 200.00);",
    "INSERT INTO ProductIngredient (ProductID, IngredientID, QuantityRequired) VALUES (5, 4, 15.00);",
    "INSERT INTO ProductIngredient (ProductID, IngredientID, QuantityRequired) VALUES (6, 8, 1.00);",
    "INSERT INTO ProductIngredient (ProductID, IngredientID, QuantityRequired) VALUES (6, 9, 1.00);",
    "INSERT INTO ProductIngredient (ProductID, IngredientID, QuantityRequired) VALUES (6, 10, 1.00);",
    "INSERT INTO ProductIngredient (ProductID, IngredientID, QuantityRequired) VALUES (7, 13, 2.00);",
    "INSERT INTO ProductIngredient (ProductID, IngredientID, QuantityRequired) VALUES (7, 11, 100.00);",
    "INSERT INTO ProductIngredient (ProductID, IngredientID, QuantityRequired) VALUES (7, 12, 25.00);",
    "INSERT INTO ProductIngredient (ProductID, IngredientID, QuantityRequired) VALUES (8, 14, 1.00);",

    "INSERT INTO SupplierIngredient (SupplierID, IngredientID, UnitPrice) VALUES (1, 1, 0.95);",
    "INSERT INTO SupplierIngredient (SupplierID, IngredientID, UnitPrice) VALUES (2, 2, 0.09);",
    "INSERT INTO SupplierIngredient (SupplierID, IngredientID, UnitPrice) VALUES (2, 3, 0.16);",
    "INSERT INTO SupplierIngredient (SupplierID, IngredientID, UnitPrice) VALUES (3, 4, 0.45);",
    "INSERT INTO SupplierIngredient (SupplierID, IngredientID, UnitPrice) VALUES (3, 5, 0.50);",
    "INSERT INTO SupplierIngredient (SupplierID, IngredientID, UnitPrice) VALUES (3, 6, 0.25);",
    "INSERT INTO SupplierIngredient (SupplierID, IngredientID, UnitPrice) VALUES (3, 7, 2.80);",
    "INSERT INTO SupplierIngredient (SupplierID, IngredientID, UnitPrice) VALUES (4, 8, 45.00);",
    "INSERT INTO SupplierIngredient (SupplierID, IngredientID, UnitPrice) VALUES (4, 13, 12.00);",
    "INSERT INTO SupplierIngredient (SupplierID, IngredientID, UnitPrice) VALUES (4, 14, 25.00);"
)

foreach ($sql in $seeds) {
    $cmd = $conn.CreateCommand()
    $cmd.CommandText = $sql
    $cmd.ExecuteNonQuery() | Out-Null
}

$checkCmd = $conn.CreateCommand()
$checkCmd.CommandText = "SELECT COUNT(*) FROM Product;"
$cnt = $checkCmd.ExecuteScalar()
Write-Host "OleDb Success: campus_cafe.accdb seeded with $cnt products!"

$conn.Close()
