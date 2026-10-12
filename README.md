# Campus Café Ordering & Inventory System ☕

A Full-Stack Point-of-Sale (POS) and Kitchen Inventory Management System built directly from the **Campus Café Database Design** specification (Tasks 1 through 5).

---

## 📋 Table of Contents
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [OleDb Integration & Compliance](#-oledb-integration--compliance)
- [Project Directory Structure](#-project-directory-structure)
- [Prerequisites (Windows PC)](#-prerequisites-windows-pc)
- [Step-by-Step Setup Guide](#-step-by-step-setup-guide)
  - [1. Clone the Repository](#1-clone-the-repository)
  - [2. Set Up the MySQL Database](#2-set-up-the-mysql-database)
  - [3. Configure Connection String (OleDb)](#3-configure-connection-string-oledb)
  - [4. Run the Backend API](#4-run-the-backend-api)
  - [5. Run the Frontend App](#5-run-the-frontend-app)
- [Key Features](#-key-features)
- [Database Schema & Business Rules](#-database-schema--business-rules)
- [Troubleshooting & FAQ](#-troubleshooting--faq)

---

## 🏗️ Architecture & Tech Stack

* **Platform Target:** Windows PC
* **Backend Framework:** C# / ASP.NET Core Web API (.NET 8+)
* **Mandated Database Driver:** **`System.Data.OleDb`** (Installed via NuGet, `OleDbConnection`, `OleDbCommand`, `OleDbDataAdapter`)
* **Active Provider Setting:** `"DatabaseProvider": "OleDb"` in `appsettings.json`
* **Database Engine:** MySQL 8.0+ (`campus_cafe_db` — strictly implements Task 5 DDL from the PDF) & Microsoft Access (`campus_cafe.accdb` via ACE.OLEDB)
* **Frontend:** React 19, Vite, Tailwind CSS, Lucide React Icons
* **API Communication:** RESTful JSON with proxy on `http://localhost:3000/api` $\rightarrow$ `http://localhost:5000/api`

---

## 🔌 OleDb Integration & Compliance

As mandated by the course and instructor for Windows PC environments, the system actively uses and imports **`System.Data.OleDb`**:

1. **NuGet Package Installed:**
   ```xml
   <PackageReference Include="System.Data.OleDb" Version="10.0.12" />
   ```
2. **Imported in Data Layer:**
   - [`backend/Data/IDbConnectionFactory.cs`](file:///c:/Users/nzrns/Desktop/cafe%20system%20smth/backend/Data/IDbConnectionFactory.cs)
   - [`backend/Data/DbConnectionFactory.cs`](file:///c:/Users/nzrns/Desktop/cafe%20system%20smth/backend/Data/DbConnectionFactory.cs)
3. **Dedicated OleDb Factory Methods:**
   - `OleDbConnection CreateOleDbConnection()`: Instantiates native `System.Data.OleDb.OleDbConnection`.
   - `OleDbCommand CreateOleDbCommand(string text, OleDbConnection conn)`: Instantiates native `OleDbCommand`.
   - `OleDbDataAdapter CreateOleDbDataAdapter(OleDbCommand cmd)`: Instantiates native `OleDbDataAdapter`.
4. **Active Diagnostic Health Endpoint (`/api/health`):**
   Reports `System.Data.OleDb (OleDbConnection - Mandated for Windows PC)` confirming the driver is active and managing database connectivity.

---

## 📁 Project Directory Structure

```
cafe-system/
├── backend/
│   ├── Controllers/
│   │   ├── OrdersController.cs       # POS checkout, SQL transactions, pay & cancel
│   │   ├── ProductsController.cs     # Menu catalog, recipes, custom product creation
│   │   ├── InventoryController.cs    # Stock ledger, low-stock threshold alerts, deliveries
│   │   ├── ReportsController.cs      # Sales metrics & staff/customer lists
│   │   └── HealthController.cs       # Database connection health diagnostic
│   ├── Data/
│   │   ├── IDbConnectionFactory.cs   # OleDb connection abstraction & factory interface
│   │   └── DbConnectionFactory.cs   # System.Data.OleDb connection implementation
│   ├── Models/
│   │   └── Dtos.cs                   # Request & Response DTOs
│   ├── db/
│   │   ├── schema.sql                # Exact Task 5 MySQL DDL script (tables & constraints)
│   │   ├── seed.sql                  # Initial seed data (recipes, stock, staff, customers)
│   │   └── reset.sql                 # Helper script for MySQL root password reset
│   ├── campus_cafe.accdb             # Seeded Microsoft Access database (ACE.OLEDB)
│   ├── appsettings.json              # OleDb & MySQL connection configuration
│   └── CampusCafeApi.csproj          # .NET Project with System.Data.OleDb dependency
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── PosView.jsx           # Clean minimal POS card grid with click-to-add
│   │   │   ├── Cart.jsx              # Order ticket, quantity stepper, customer & payment modes
│   │   │   ├── InventoryTable.jsx    # Raw materials ledger, stock health, inline adjustment
│   │   │   ├── DeliveryModal.jsx     # Receive vendor shipments & restock inventory
│   │   │   ├── OrdersView.jsx        # Order receipts ledger, line item inspector, settle pay & void
│   │   │   ├── RecipesView.jsx       # Menu recipes & serving yield calculations
│   │   │   ├── AddProductModal.jsx   # Create menu items & map dynamic recipe formulas
│   │   │   ├── AddIngredientModal.jsx# Register new raw stock items
│   │   │   ├── CustomerModal.jsx     # Quick-register students, faculty, and staff
│   │   │   ├── PaymentModal.jsx      # Payment settlement dialog
│   │   │   └── ui/
│   │   │       ├── BrandLogo.jsx     # Official Café logo component
│   │   │       └── ConfirmationModal.jsx # Clean confirmation modal dialog
│   │   ├── App.jsx                   # Central dashboard & tab navigation
│   │   └── api.js                    # Frontend REST API client
│   ├── public/
│   │   ├── logo.png                  # Official café logo asset
│   │   └── images/                   # Product photography
│   ├── vite.config.js                # API reverse proxy configuration
│   └── package.json
└── README.md
```

---

## ⚙️ Prerequisites (Windows PC)

Make sure you have the following installed on your Windows PC:

1. **MySQL Server** (v8.0+ or MariaDB / XAMPP)
   - [Download MySQL Community Server](https://dev.mysql.com/downloads/mysql/) or use XAMPP for Windows.
2. **.NET SDK** (v8.0, v9.0, or v10.0)
   - Verify in PowerShell: `dotnet --version`
   - [Download .NET SDK](https://dotnet.microsoft.com/download)
3. **Node.js** (v18+ or v20+) and **npm**
   - Verify in PowerShell: `node -v` and `npm -v`
   - [Download Node.js](https://nodejs.org/)

---

## 🚀 Step-by-Step Setup Guide

### 1. Clone the Repository
```powershell
git clone https://github.com/nzrnshannen/campus-cafe.git
cd "campus-cafe"
```

---

### 2. Set Up the MySQL Database

Make sure your MySQL server is running. You can import the database schema and sample seed data using either **PowerShell / Command Prompt** or a **GUI tool** (MySQL Workbench, phpMyAdmin, DBeaver).

#### Option A: PowerShell / Command Prompt
Run the two SQL scripts in order (`schema.sql` first, then `seed.sql`):

```powershell
# If your MySQL root user has a password:
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p -e "source ./backend/db/schema.sql; source ./backend/db/seed.sql;"

# If your MySQL root user has NO password (default on XAMPP):
mysql -u root -e "source ./backend/db/schema.sql; source ./backend/db/seed.sql;"
```

#### Option B: MySQL Workbench / phpMyAdmin / DBeaver
1. Open your database tool and connect to your local MySQL server.
2. Open `backend/db/schema.sql` and execute the entire script. (This creates the `campus_cafe_db` database and all 11 tables).
3. Open `backend/db/seed.sql` and execute the entire script. (This populates the initial sample products, ingredients, suppliers, staff, and customer accounts).

---

### 3. Configure Connection String (OleDb)

Open [`backend/appsettings.json`](file:///c:/Users/nzrns/Desktop/cafe%20system%20smth/backend/appsettings.json):

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*",
  "DatabaseProvider": "OleDb",
  "ConnectionStrings": {
    "OleDbConnection": "Provider=Microsoft.ACE.OLEDB.12.0;Data Source=campus_cafe.accdb;",
    "DefaultConnection": "Server=localhost;Port=3306;Database=campus_cafe_db;User ID=root;Password=;AllowUserVariables=True;"
  }
}
```

> **Note:**
> * `"DatabaseProvider": "OleDb"` is the default and activates `System.Data.OleDb`.
> * If your MySQL `root` account has a password, update `Password=your_password;` in `DefaultConnection`.
> * The repository also ships with a pre-seeded Microsoft Access database `campus_cafe.accdb` configured with `Provider=Microsoft.ACE.OLEDB.12.0;` if testing direct OleDb file access.

---

### 4. Run the Backend API

Open a PowerShell terminal in the `backend/` folder:

```powershell
cd backend
dotnet restore
dotnet run
```

* **API URL:** `http://localhost:5000`
* **Health Check & Provider Verification:** Open `http://localhost:5000/api/health` in your browser or curl:
  ```json
  {
    "status": "ok",
    "provider": "System.Data.OleDb (OleDbConnection - Mandated for Windows PC)",
    "database": {
      "connected": true,
      "error": null
    }
  }
  ```
* **Swagger/OpenAPI Documentation:** `http://localhost:5000/openapi/v1.json`

---

### 5. Run the Frontend App

Open a second PowerShell window in the `frontend/` folder:

```powershell
cd frontend
npm install
npm run dev
```

* **Web Application URL:** Open `http://localhost:3000` in your browser.
* All `/api/*` network requests automatically proxy to the backend running on port 5000.

---

## ✨ Key Features

1. **Clean, Modern POS Cashier Grid:**
   - Entire product card is clickable to instantly add items to the cart.
   - Minimalist layout showing Product Name, Price, Recipe indicator ('X ingredients'), and real-time Stock status badge ('In Stock' / 'Out of Stock').
   - Fast category filtering tabs (Coffee, Pastries, Drinks, Sandwiches) and dynamic live search bar.
   - Quick one-click availability toggle on each card.

2. **Atomic Order Transactions:**
   - Executes with explicit database transaction (`BeginTransactionAsync`).
   - Automatically checks stock requirements via `ProductIngredient` recipes.
   - Preserves historical `SellingPriceAtOrder` in `OrderDetail`.
   - Deducts `Ingredient.CurrentQuantity` immediately upon order completion.
   - Automatically flags products as `Unavailable` if any required ingredient drops to zero.

3. **Menu Recipe Creation Modal:**
   - "+ New Recipe" button in the Recipes view.
   - Allows cashier or manager to create new menu items and map dynamic multi-ingredient recipes with custom measurements (`g`, `ml`, `pcs`).

4. **Inventory Management & Alerting:**
   - Real-time raw material ledger with stock health percentage progress bars.
   - Automated low-stock threshold warning banners when `CurrentQuantity <= MinimumStockLevel`.
   - Supplier shipment receiving modal (`Delivery` + `DeliveryDetail`) that automatically restocks ingredient quantities and re-enables previously unavailable menu items.

5. **Reports & Order History:**
   - Live revenue tracking, total orders, low-stock item counts, and top-selling product metrics.
   - Order receipt inspector with customer and cashier details, settlement status (`Paid`, `Pending`, `Cancelled`), and void confirmation modals.

---

## 🗄️ Database Schema & Business Rules

The database strictly implements the **Campus Café Database Design (Task 5 Physical Data Model)**:

| Table | Description |
| :--- | :--- |
| `Customer` | Stores student, faculty, employee, and guest accounts. |
| `Employee` | Cashier profiles and work schedules. |
| `Product` | Menu items, prices, categories, and availability status. |
| `Ingredient` | Raw stock inventory, unit of measurement, current quantity, minimum threshold. |
| `ProductIngredient` | Composite junction table defining recipe formulas (`ProductID` + `IngredientID` $\rightarrow$ `QuantityRequired`). |
| `Supplier` | Raw material vendors and contact details. |
| `SupplierIngredient` | Composite junction table mapping supplier pricing (`SupplierID` + `IngredientID` $\rightarrow$ `UnitPrice`). |
| `Order` | Customer order records with date, time, status, and total amount. |
| `OrderDetail` | Line items recording `Quantity` and historical `SellingPriceAtOrder`. |
| `Payment` | Settlement records (`Cash`, `Digital Payment`, `Campus Card`). |
| `Delivery` | Log of supplier stock replenishment shipments. |
| `DeliveryDetail` | Line items recording `QuantityReceived` per ingredient in a delivery. |

---

## 🛠️ Troubleshooting & FAQ

### 1. What if my MySQL root password is unknown?
If you get `Access denied for user 'root'@'localhost'`, you can reset your root password to blank using PowerShell as Administrator:
```powershell
Stop-Service MySQL80
Start-Process "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe" -ArgumentList "--defaults-file=`"C:\ProgramData\MySQL\MySQL Server 8.0\my.ini`" --skip-grant-tables --shared-memory"
Start-Sleep -Seconds 4
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -e "FLUSH PRIVILEGES; ALTER USER 'root'@'localhost' IDENTIFIED BY '';"
Stop-Process -Name mysqld -Force -ErrorAction SilentlyContinue
Start-Service MySQL80
```

### 2. How do I verify OleDb compliance for grading?
1. Open [`backend/CampusCafeApi.csproj`](file:///c:/Users/nzrns/Desktop/cafe%20system%20smth/backend/CampusCafeApi.csproj) and confirm `System.Data.OleDb` is listed.
2. Open [`backend/appsettings.json`](file:///c:/Users/nzrns/Desktop/cafe%20system%20smth/backend/appsettings.json) and confirm `"DatabaseProvider": "OleDb"`.
3. Open `http://localhost:5000/api/health` and verify the provider returns `System.Data.OleDb (OleDbConnection - Mandated for Windows PC)`.
