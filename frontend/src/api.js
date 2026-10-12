const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  try {
    const res = await fetch(url, config);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || data.message || `Request failed with status ${res.status}`);
    }
    return data;
  } catch (err) {
    console.error(`API Error on [${options.method || 'GET'} ${endpoint}]:`, err);
    throw err;
  }
}

export const api = {
  // System Health
  checkHealth: () => request('/health'),

  // Products
  getProducts: (category = 'All', availableOnly = false) => 
    request(`/products?category=${encodeURIComponent(category)}&availableOnly=${availableOnly}`),
  getCategories: () => request('/products/categories'),
  createProduct: (data) => 
    request('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProductStatus: (id, status) => 
    request(`/products/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),

  // Orders
  getOrders: (status = 'All') => request(`/orders?status=${encodeURIComponent(status)}`),
  getOrderById: (id) => request(`/orders/${id}`),
  createOrder: ({ customerId, employeeId, items, paymentMethod }) => 
    request('/orders', {
      method: 'POST',
      body: JSON.stringify({ customerId, employeeId, items, paymentMethod })
    }),
  settlePayment: (orderId, { paymentMethod, amountPaid }) => 
    request(`/orders/${orderId}/pay`, {
      method: 'POST',
      body: JSON.stringify({ paymentMethod, amountPaid })
    }),
  cancelOrder: (orderId) => 
    request(`/orders/${orderId}/cancel`, { method: 'PUT' }),

  // Inventory & Deliveries
  getIngredients: () => request('/inventory/ingredients'),
  getLowStock: () => request('/inventory/low-stock'),
  addIngredient: (data) => request('/inventory/ingredients', { method: 'POST', body: JSON.stringify(data) }),
  updateIngredient: (id, data) => request(`/inventory/ingredients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteIngredient: (id) => request(`/inventory/ingredients/${id}`, { method: 'DELETE' }),
  getSuppliers: () => request('/inventory/suppliers'),
  addSupplier: (data) => request('/inventory/suppliers', { method: 'POST', body: JSON.stringify(data) }),
  getDeliveries: () => request('/inventory/deliveries'),
  logDelivery: ({ supplierId, deliveryDate, items }) => 
    request('/inventory/deliveries', {
      method: 'POST',
      body: JSON.stringify({ supplierId, deliveryDate, items })
    }),

  // Reports, Customers & Employees
  getSummary: () => request('/reports/summary'),
  getCustomers: () => request('/reports/customers'),
  addCustomer: (data) => request('/reports/customers', { method: 'POST', body: JSON.stringify(data) }),
  getEmployees: () => request('/reports/employees')
};
