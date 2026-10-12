-- =========================================================
-- Campus Café Ordering and Inventory System
-- Physical Data Model (MySQL DDL - Task 5)
-- =========================================================

CREATE DATABASE IF NOT EXISTS campus_cafe_db;
USE campus_cafe_db;

-- ============================
-- CUSTOMER
-- ============================
CREATE TABLE IF NOT EXISTS Customer (
  CustomerID INT AUTO_INCREMENT PRIMARY KEY,
  UnivID VARCHAR(20) NULL,
  Name VARCHAR(100) NOT NULL,
  ContactNumber VARCHAR(20) NULL,
  CustomerType ENUM('Student','Faculty','Employee','Other') NOT NULL
);

-- ============================
-- EMPLOYEE (CASHIER)
-- ============================
CREATE TABLE IF NOT EXISTS Employee (
  EmployeeID INT AUTO_INCREMENT PRIMARY KEY,
  Name VARCHAR(100) NOT NULL,
  ContactNumber VARCHAR(20) NULL,
  WorkSchedule VARCHAR(100) NULL
);

-- ============================
-- PRODUCT
-- ============================
CREATE TABLE IF NOT EXISTS Product (
  ProductID INT AUTO_INCREMENT PRIMARY KEY,
  ProductName VARCHAR(100) NOT NULL,
  Description VARCHAR(255) NULL,
  Price DECIMAL(10,2) NOT NULL,
  Category VARCHAR(50) NOT NULL,
  AvailabilityStatus ENUM('Available','Unavailable') NOT NULL DEFAULT 'Available',
  AvailabilityPeriod VARCHAR(50) NULL
);

-- ============================
-- SUPPLIER
-- ============================
CREATE TABLE IF NOT EXISTS Supplier (
  SupplierID INT AUTO_INCREMENT PRIMARY KEY,
  CompanyName VARCHAR(100) NOT NULL,
  ContactPerson VARCHAR(100) NULL,
  TelephoneNumber VARCHAR(20) NULL,
  Email VARCHAR(100) NULL,
  Address VARCHAR(255) NULL
);

-- ============================
-- INGREDIENT
-- ============================
CREATE TABLE IF NOT EXISTS Ingredient (
  IngredientID INT AUTO_INCREMENT PRIMARY KEY,
  IngredientName VARCHAR(100) NOT NULL,
  UnitOfMeasurement VARCHAR(20) NOT NULL,
  CurrentQuantity DECIMAL(10,2) NOT NULL DEFAULT 0,
  MinimumStockLevel DECIMAL(10,2) NOT NULL DEFAULT 0
);

-- ============================
-- ORDER
-- ============================
CREATE TABLE IF NOT EXISTS `Order` (
  OrderID INT AUTO_INCREMENT PRIMARY KEY,
  CustomerID INT NOT NULL,
  EmployeeID INT NOT NULL,
  OrderDate DATE NOT NULL,
  OrderTime TIME NOT NULL,
  OrderStatus ENUM('Pending','Paid','Cancelled') NOT NULL DEFAULT 'Pending',
  TotalAmount DECIMAL(10,2) NOT NULL DEFAULT 0,
  CONSTRAINT fk_order_customer FOREIGN KEY (CustomerID) REFERENCES Customer(CustomerID),
  CONSTRAINT fk_order_employee FOREIGN KEY (EmployeeID) REFERENCES Employee(EmployeeID)
);

-- ============================
-- ORDER DETAIL (Order <-> Product)
-- ============================
CREATE TABLE IF NOT EXISTS OrderDetail (
  OrderDetailID INT AUTO_INCREMENT PRIMARY KEY,
  OrderID INT NOT NULL,
  ProductID INT NOT NULL,
  Quantity INT NOT NULL,
  SellingPriceAtOrder DECIMAL(10,2) NOT NULL,
  CONSTRAINT fk_od_order FOREIGN KEY (OrderID) REFERENCES `Order`(OrderID),
  CONSTRAINT fk_od_product FOREIGN KEY (ProductID) REFERENCES Product(ProductID),
  UNIQUE KEY uq_order_product (OrderID, ProductID)
);

-- ============================
-- PAYMENT
-- ============================
CREATE TABLE IF NOT EXISTS Payment (
  PaymentID INT AUTO_INCREMENT PRIMARY KEY,
  OrderID INT NOT NULL,
  PaymentDate DATETIME NOT NULL,
  AmountPaid DECIMAL(10,2) NOT NULL,
  PaymentMethod ENUM('Cash','Debit Card','Credit Card','Digital Payment') NOT NULL,
  CONSTRAINT fk_payment_order FOREIGN KEY (OrderID) REFERENCES `Order`(OrderID)
);

-- ============================
-- SUPPLIER INGREDIENT (Supplier <-> Ingredient)
-- ============================
CREATE TABLE IF NOT EXISTS SupplierIngredient (
  SupplierID INT NOT NULL,
  IngredientID INT NOT NULL,
  UnitPrice DECIMAL(10,2) NULL,
  PRIMARY KEY (SupplierID, IngredientID),
  CONSTRAINT fk_si_supplier FOREIGN KEY (SupplierID) REFERENCES Supplier(SupplierID),
  CONSTRAINT fk_si_ingredient FOREIGN KEY (IngredientID) REFERENCES Ingredient(IngredientID)
);

-- ============================
-- DELIVERY
-- ============================
CREATE TABLE IF NOT EXISTS Delivery (
  DeliveryID INT AUTO_INCREMENT PRIMARY KEY,
  SupplierID INT NOT NULL,
  DeliveryDate DATE NOT NULL,
  CONSTRAINT fk_delivery_supplier FOREIGN KEY (SupplierID) REFERENCES Supplier(SupplierID)
);

-- ============================
-- DELIVERY DETAIL (Delivery <-> Ingredient)
-- ============================
CREATE TABLE IF NOT EXISTS DeliveryDetail (
  DeliveryID INT NOT NULL,
  IngredientID INT NOT NULL,
  QuantityReceived DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (DeliveryID, IngredientID),
  CONSTRAINT fk_dd_delivery FOREIGN KEY (DeliveryID) REFERENCES Delivery(DeliveryID),
  CONSTRAINT fk_dd_ingredient FOREIGN KEY (IngredientID) REFERENCES Ingredient(IngredientID)
);

-- ============================
-- PRODUCT INGREDIENT (Product <-> Ingredient, Recipe)
-- ============================
CREATE TABLE IF NOT EXISTS ProductIngredient (
  ProductID INT NOT NULL,
  IngredientID INT NOT NULL,
  QuantityRequired DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (ProductID, IngredientID),
  CONSTRAINT fk_pi_product FOREIGN KEY (ProductID) REFERENCES Product(ProductID),
  CONSTRAINT fk_pi_ingredient FOREIGN KEY (IngredientID) REFERENCES Ingredient(IngredientID)
);
