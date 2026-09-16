/**
 * API Client for POS Backend
 */

const API_BASE = '/api';

async function handleResponse(response) {
  const data = await response.json().catch(() => ({ message: response.statusText }));
  if (!response.ok) {
    const error = new Error(data.message || 'An error occurred');
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}

export const api = {
  // Products
  async getProducts(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/products${query ? `?${query}` : ''}`);
    return handleResponse(res);
  },

  async createProduct(product) {
    const res = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
    return handleResponse(res);
  },

  async updateProduct(id, updates) {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return handleResponse(res);
  },

  async deleteProduct(id) {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(res);
  },

  async seedProducts() {
    const res = await fetch(`${API_BASE}/products/seed`, {
      method: 'POST',
    });
    return handleResponse(res);
  },

  // Orders
  async createOrder({ items, customerName, reservationDurationSec }) {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, customerName, reservationDurationSec }),
    });
    return handleResponse(res);
  },

  async getOrders(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/orders${query ? `?${query}` : ''}`);
    return handleResponse(res);
  },

  async getOrder(id) {
    const res = await fetch(`${API_BASE}/orders/${id}`);
    return handleResponse(res);
  },

  async cancelOrder(id, reason) {
    const res = await fetch(`${API_BASE}/orders/${id}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    return handleResponse(res);
  },

  async expireOrder(id, reason) {
    const res = await fetch(`${API_BASE}/orders/${id}/expire`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    return handleResponse(res);
  },

  // Payments
  async processPayment({ orderId, idempotencyKey, paymentMethod, outcome }) {
    const res = await fetch(`${API_BASE}/payments/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({ orderId, idempotencyKey, paymentMethod, outcome }),
    });
    return handleResponse(res);
  },

  async getPaymentByOrder(orderId) {
    const res = await fetch(`${API_BASE}/payments/order/${orderId}`);
    return handleResponse(res);
  },

  // Health
  async checkHealth() {
    const res = await fetch(`${API_BASE}/health`);
    return handleResponse(res);
  },
};
