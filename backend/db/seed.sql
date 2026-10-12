-- =========================================================
-- Campus Café Ordering and Inventory System
-- Seed Data for Testing and Demonstration
-- =========================================================

USE campus_cafe_db;

-- Clear previous data in correct foreign key order
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE Payment;
TRUNCATE TABLE OrderDetail;
TRUNCATE TABLE `Order`;
TRUNCATE TABLE DeliveryDetail;
TRUNCATE TABLE Delivery;
TRUNCATE TABLE ProductIngredient;
TRUNCATE TABLE SupplierIngredient;
TRUNCATE TABLE Product;
TRUNCATE TABLE Ingredient;
TRUNCATE TABLE Supplier;
TRUNCATE TABLE Employee;
TRUNCATE TABLE Customer;
SET FOREIGN_KEY_CHECKS = 1;

-- ============================
-- 1. CUSTOMERS
-- ============================
INSERT INTO Customer (UnivID, Name, ContactNumber, CustomerType) VALUES
('2023-01042', 'Maria Santos', '09171234567', 'Student'),
('2022-09411', 'Juan dela Cruz', '09289876543', 'Student'),
('FAC-1004', 'Dr. Evelyn Garcia', '09195551234', 'Faculty'),
('EMP-2088', 'Arthur Pendelton', '09087778899', 'Employee'),
('VISIT-01', 'Walk-in Guest', '09351112233', 'Other');

-- ============================
-- 2. EMPLOYEES (CASHIERS / STAFF)
-- ============================
INSERT INTO Employee (Name, ContactNumber, WorkSchedule) VALUES
('Chloe Mendoza', '09170001111', 'Morning Shift (7:00 AM - 3:00 PM)'),
('Gabriel Reyes', '09170002222', 'Afternoon Shift (2:00 PM - 10:00 PM)'),
('Sarah Lim', '09170003333', 'Weekend Shift (8:00 AM - 5:00 PM)');

-- ============================
-- 3. SUPPLIERS
-- ============================
INSERT INTO Supplier (CompanyName, ContactPerson, TelephoneNumber, Email, Address) VALUES
('Highland Bean Roasters', 'Marco Tan', '0289112233', 'sales@highlandbeans.com', 'Benguet Highlands, PH'),
('Valley Fresh Dairy Co.', 'Leah Alcantara', '0285443322', 'orders@valleyfresh.com', 'Laguna Agri-Park, PH'),
('SweetCraft Syrups & Flavors', 'Kenji Sato', '0287766554', 'info@sweetcraft.ph', 'Pasig City, Metro Manila'),
('Golden Crust Artisan Bakery', 'Elena Gomez', '0283334455', 'bakes@goldencrust.com', 'Quezon City, Metro Manila');

-- ============================
-- 4. INGREDIENTS
-- ============================
-- CurrentQuantity and MinimumStockLevel are tracked in units (grams, ml, pieces)
INSERT INTO Ingredient (IngredientID, IngredientName, UnitOfMeasurement, CurrentQuantity, MinimumStockLevel) VALUES
(1, 'Espresso Coffee Beans', 'g', 4500.00, 1000.00),
(2, 'Fresh Whole Milk', 'ml', 12000.00, 3000.00),
(3, 'Oat Milk', 'ml', 2500.00, 2000.00),
(4, 'Vanilla Syrup', 'ml', 1800.00, 500.00),
(5, 'Caramel Sauce', 'ml', 350.00, 500.00),      -- Low Stock Alert! (< 500)
(6, 'Condensed Milk', 'ml', 2200.00, 800.00),
(7, 'Matcha Powder', 'g', 60.00, 150.00),          -- Low Stock Alert! (< 150)
(8, 'Croissant Bread', 'pcs', 18.00, 10.00),
(9, 'Eggs', 'pcs', 45.00, 20.00),
(10, 'Cheddar Cheese Slice', 'pcs', 30.00, 15.00),
(11, 'Chicken Breast (Cooked)', 'g', 1800.00, 500.00),
(12, 'Pesto Spread', 'g', 850.00, 300.00),
(13, 'Sourdough Bread Slices', 'pcs', 26.00, 16.00),
(14, 'Cookie Dough (Pre-portioned)', 'pcs', 24.00, 12.00);

-- ============================
-- 5. PRODUCTS
-- ============================
INSERT INTO Product (ProductID, ProductName, Description, Price, Category, AvailabilityStatus, AvailabilityPeriod) VALUES
(1, 'Iced Americano', 'Double espresso shot with filtered chilled water and ice', 110.00, 'Coffee', 'Available', 'All Day'),
(2, 'Caramel Macchiato', 'Espresso layered with steamed milk and drizzled with rich caramel', 145.00, 'Coffee', 'Available', 'All Day'),
(3, 'Spanish Latte', 'Smooth espresso blended with fresh milk and sweet condensed milk', 140.00, 'Coffee', 'Available', 'All Day'),
(4, 'Oat Iced Latte', 'Plant-based creamy espresso latte prepared with barista oat milk', 155.00, 'Coffee', 'Available', 'All Day'),
(5, 'Ceremonial Matcha Latte', 'Japanese stone-ground green tea whisked with silky milk', 150.00, 'Drinks', 'Available', 'All Day'),
(6, 'Egg & Cheese Croissant', 'Buttery flaky croissant toasted with fluffy egg and melted cheddar', 125.00, 'Pastries', 'Available', 'Breakfast/Lunch'),
(7, 'Chicken Pesto Sandwich', 'Grilled chicken tossed in herb pesto on toasted sourdough slices', 165.00, 'Sandwiches', 'Available', 'Lunch/Dinner'),
(8, 'Chocolate Chip Cookie', 'Soft-baked artisanal cookie with gooey semi-sweet chocolate chunks', 75.00, 'Pastries', 'Available', 'All Day');

-- ============================
-- 6. PRODUCT INGREDIENTS (RECIPES)
-- ============================
-- 1: Iced Americano (18g beans)
INSERT INTO ProductIngredient (ProductID, IngredientID, QuantityRequired) VALUES
(1, 1, 18.00);

-- 2: Caramel Macchiato (18g beans, 180ml milk, 25ml vanilla syrup, 20ml caramel)
INSERT INTO ProductIngredient (ProductID, IngredientID, QuantityRequired) VALUES
(2, 1, 18.00),
(2, 2, 180.00),
(2, 4, 25.00),
(2, 5, 20.00);

-- 3: Spanish Latte (18g beans, 160ml milk, 30ml condensed milk)
INSERT INTO ProductIngredient (ProductID, IngredientID, QuantityRequired) VALUES
(3, 1, 18.00),
(3, 2, 160.00),
(3, 6, 30.00);

-- 4: Oat Iced Latte (18g beans, 200ml oat milk)
INSERT INTO ProductIngredient (ProductID, IngredientID, QuantityRequired) VALUES
(4, 1, 18.00),
(4, 3, 200.00);

-- 5: Matcha Latte (10g matcha, 200ml milk, 15ml vanilla syrup)
INSERT INTO ProductIngredient (ProductID, IngredientID, QuantityRequired) VALUES
(5, 7, 10.00),
(5, 2, 200.00),
(5, 4, 15.00);

-- 6: Egg & Cheese Croissant (1 croissant, 1 egg, 1 cheddar slice)
INSERT INTO ProductIngredient (ProductID, IngredientID, QuantityRequired) VALUES
(6, 8, 1.00),
(6, 9, 1.00),
(6, 10, 1.00);

-- 7: Chicken Pesto Sandwich (2 sourdough, 100g chicken, 25g pesto)
INSERT INTO ProductIngredient (ProductID, IngredientID, QuantityRequired) VALUES
(7, 13, 2.00),
(7, 11, 100.00),
(7, 12, 25.00);

-- 8: Chocolate Chip Cookie (1 cookie portion)
INSERT INTO ProductIngredient (ProductID, IngredientID, QuantityRequired) VALUES
(8, 14, 1.00);

-- ============================
-- 7. SUPPLIER INGREDIENTS
-- ============================
INSERT INTO SupplierIngredient (SupplierID, IngredientID, UnitPrice) VALUES
(1, 1, 0.95),    -- Highland: Espresso beans per gram
(2, 2, 0.09),    -- Valley Fresh: Whole milk per ml
(2, 3, 0.16),    -- Valley Fresh: Oat milk per ml
(3, 4, 0.45),    -- SweetCraft: Vanilla syrup per ml
(3, 5, 0.50),    -- SweetCraft: Caramel sauce per ml
(3, 6, 0.25),    -- SweetCraft: Condensed milk per ml
(3, 7, 2.80),    -- SweetCraft: Matcha per gram
(4, 8, 45.00),   -- Golden Crust: Croissant per pc
(4, 13, 12.00),  -- Golden Crust: Sourdough per slice
(4, 14, 25.00);  -- Golden Crust: Cookie dough per pc

-- ============================
-- 8. DELIVERIES & DELIVERY DETAILS (Historical)
-- ============================
INSERT INTO Delivery (DeliveryID, SupplierID, DeliveryDate) VALUES
(1, 1, CURDATE() - INTERVAL 3 DAY),
(2, 2, CURDATE() - INTERVAL 2 DAY);

INSERT INTO DeliveryDetail (DeliveryID, IngredientID, QuantityReceived) VALUES
(1, 1, 5000.00), -- 5kg espresso beans
(2, 2, 15000.00),-- 15L fresh milk
(2, 3, 5000.00); -- 5L oat milk

-- ============================
-- 9. PAST ORDERS, LINE ITEMS & PAYMENTS
-- ============================
-- Order 1: Student Maria Santos orders Americano + Cookie (Paid via Cash)
INSERT INTO `Order` (OrderID, CustomerID, EmployeeID, OrderDate, OrderTime, OrderStatus, TotalAmount) VALUES
(1, 1, 1, CURDATE(), '08:30:00', 'Paid', 185.00);

INSERT INTO OrderDetail (OrderDetailID, OrderID, ProductID, Quantity, SellingPriceAtOrder) VALUES
(1, 1, 1, 1, 110.00),
(2, 1, 8, 1, 75.00);

INSERT INTO Payment (OrderID, PaymentDate, AmountPaid, PaymentMethod) VALUES
(1, NOW() - INTERVAL 2 HOUR, 185.00, 'Cash');

-- Order 2: Faculty Dr. Evelyn orders Spanish Latte + Croissant (Paid via Digital Payment)
INSERT INTO `Order` (OrderID, CustomerID, EmployeeID, OrderDate, OrderTime, OrderStatus, TotalAmount) VALUES
(2, 3, 1, CURDATE(), '09:15:00', 'Paid', 265.00);

INSERT INTO OrderDetail (OrderDetailID, OrderID, ProductID, Quantity, SellingPriceAtOrder) VALUES
(3, 2, 3, 1, 140.00),
(4, 2, 6, 1, 125.00);

INSERT INTO Payment (OrderID, PaymentDate, AmountPaid, PaymentMethod) VALUES
(2, NOW() - INTERVAL 1 HOUR, 265.00, 'Digital Payment');
