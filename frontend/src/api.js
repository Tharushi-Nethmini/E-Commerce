import axios from 'axios'

const userApi = axios.create({ baseURL: '/api/users' })
const inventoryApi = axios.create({ baseURL: '/api/inventory' })
const orderApi = axios.create({ baseURL: '/api/orders' })
const paymentApi = axios.create({ baseURL: '/api/payments' })

// Attach JWT to every request automatically
const attachToken = (config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
}
;[userApi, inventoryApi, orderApi, paymentApi].forEach((api) =>
  api.interceptors.request.use(attachToken)
)

// ─── Auth ────────────────────────────────────────────────────────────────────
export const register = (data) => userApi.post('/register', data)
export const login = (data) => userApi.post('/login', data)

// ─── Users (admin) ───────────────────────────────────────────────────────────
export const getAllUsers = () => userApi.get('')
export const getUserById = (id) => userApi.get(`/${id}`)
export const deleteUser = (id) => userApi.delete(`/${id}`)
export const updateUser = (id, data) => userApi.patch(`/${id}`, data)

// ─── Inventory ───────────────────────────────────────────────────────────────
export const getProducts = (category) =>
  inventoryApi.get('/products', category ? { params: { category } } : {})
export const getProduct = (id) => inventoryApi.get(`/products/${id}`)
export const createProduct = (data) => inventoryApi.post('/products', data)
export const updateProduct = (id, data) => inventoryApi.put(`/products/${id}`, data)
export const deleteProduct = (id) => inventoryApi.delete(`/products/${id}`)

// ─── Orders ──────────────────────────────────────────────────────────────────
export const placeOrder = (data) => orderApi.post('', data)
export const getOrders = (userId) =>
  orderApi.get('', userId ? { params: { userId } } : {})
export const getOrder = (id) => orderApi.get(`/${id}`)
export const cancelOrder = (id) => orderApi.post(`/${id}/cancel`)
export const deleteOrder = (id) => orderApi.delete(`/${id}`)
export const updateOrderStatus = (id, status) =>
  orderApi.patch(`/${id}/status`, { status })

// ─── Payments ────────────────────────────────────────────────────────────────
export const getPayments = (userId) =>
  paymentApi.get('', userId ? { params: { userId } } : {})
export const getPaymentByOrder = (orderId) => paymentApi.get(`/order/${orderId}`)
export const refundPayment = (id) => paymentApi.post(`/${id}/refund`)
export const deletePayment = (id) => paymentApi.delete(`/${id}`)
