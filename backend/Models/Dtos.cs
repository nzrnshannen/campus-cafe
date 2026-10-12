using System.ComponentModel.DataAnnotations;

namespace CampusCafeApi.Models;

public class CreateOrderRequest
{
    [Required]
    public int CustomerId { get; set; }

    [Required]
    public int EmployeeId { get; set; }

    [Required]
    [MinLength(1, ErrorMessage = "Order must contain at least one item.")]
    public List<OrderItemDto> Items { get; set; } = new();

    public string? PaymentMethod { get; set; }
}

public class OrderItemDto
{
    [Required]
    public int ProductId { get; set; }

    [Range(1, 1000)]
    public int Quantity { get; set; }
}

public class SettlePaymentRequest
{
    [Required]
    public string PaymentMethod { get; set; } = "Cash";

    public decimal? AmountPaid { get; set; }
}

public class LogDeliveryRequest
{
    [Required]
    public int SupplierId { get; set; }

    public string? DeliveryDate { get; set; }

    [Required]
    [MinLength(1, ErrorMessage = "At least one delivery item is required.")]
    public List<DeliveryItemDto> Items { get; set; } = new();
}

public class DeliveryItemDto
{
    [Required]
    public int IngredientId { get; set; }

    [Range(0.01, 100000)]
    public decimal QuantityReceived { get; set; }
}

public class AddIngredientRequest
{
    [Required]
    public string IngredientName { get; set; } = string.Empty;

    [Required]
    public string UnitOfMeasurement { get; set; } = "g";

    public decimal CurrentQuantity { get; set; } = 0;
    public decimal MinimumStockLevel { get; set; } = 0;
}

public class UpdateIngredientRequest
{
    public decimal? CurrentQuantity { get; set; }
    public decimal? MinimumStockLevel { get; set; }
}

public class AddCustomerRequest
{
    public string? UnivId { get; set; }

    [Required]
    public string Name { get; set; } = string.Empty;

    public string? ContactNumber { get; set; }

    [Required]
    public string CustomerType { get; set; } = "Student";
}

public class ToggleProductStatusRequest
{
    [Required]
    public string Status { get; set; } = "Available";
}

public class CreateProductRequest
{
    [Required]
    public string ProductName { get; set; } = string.Empty;

    public string? Description { get; set; }

    [Range(0.01, 100000)]
    public decimal Price { get; set; }

    [Required]
    public string Category { get; set; } = "Coffee";

    public string? AvailabilityPeriod { get; set; } = "All Day";

    public List<ProductRecipeItemDto> Ingredients { get; set; } = new();
}

public class ProductRecipeItemDto
{
    [Required]
    public int IngredientId { get; set; }

    [Range(0.001, 100000)]
    public decimal QuantityRequired { get; set; }
}

public class RecordPaymentRequest
{
    [Required]
    public int OrderId { get; set; }

    [Required]
    [Range(0.01, 1000000)]
    public decimal AmountPaid { get; set; }

    [Required]
    public string PaymentMethod { get; set; } = "Cash";

    public string? PaymentDate { get; set; }
}

