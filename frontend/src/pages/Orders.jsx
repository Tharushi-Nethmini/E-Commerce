import React, { useEffect, useState } from 'react'
import { getOrders, getProducts, placeOrder, cancelOrder, deleteOrder, updateOrderStatus } from '../api'
import { useAuth } from '../context/AuthContext'

const STATUS_COLORS = {
  PENDING: '#f59e0b',
  CONFIRMED: '#3b82f6',
  PROCESSING: '#8b5cf6',
  SHIPPED: '#06b6d4',
  DELIVERED: '#10b981',
  CANCELLED: '#ef4444',
}

export default function Orders() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [alert, setAlert] = useState(null)
  const [expandedOrder, setExpandedOrder] = useState(null)
  const [orderForm, setOrderForm] = useState({
    shippingAddress: '',
    items: [{ productId: '', quantity: 1 }],
  })

  const load = async () => {
    try {
      const params = isAdmin ? {} : { userId: user?.userId }
      const [ordersRes, productsRes] = await Promise.all([
        getOrders(isAdmin ? undefined : user?.userId),
        getProducts(),
      ])
      setOrders(ordersRes.data)
      setProducts(productsRes.data)
    } catch {
      showAlert('Failed to load orders', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const showAlert = (msg, type = 'success') => {
    setAlert({ msg, type })
    setTimeout(() => setAlert(null), 4000)
  }

  const handlePlaceOrder = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        userId: user?.userId,
        shippingAddress: orderForm.shippingAddress,
        items: orderForm.items
          .filter((i) => i.productId)
          .map((i) => ({ productId: Number(i.productId), quantity: Number(i.quantity) })),
      }
      await placeOrder(payload)
      showAlert('Order placed successfully! Payment is being processed.')
      setShowModal(false)
      setOrderForm({ shippingAddress: '', items: [{ productId: '', quantity: 1 }] })
      load()
    } catch (err) {
      showAlert(err.response?.data?.message || 'Order failed', 'error')
    }
  }

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this order? Stock will be released.')) return
    try {
      await cancelOrder(id)
      showAlert('Order cancelled')
      load()
    } catch (err) {
      showAlert(err.response?.data?.message || 'Cancel failed', 'error')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Permanently delete this order?')) return
    try {
      await deleteOrder(id)
      showAlert('Order deleted')
      load()
    } catch {
      showAlert('Delete failed', 'error')
    }
  }

  const handleStatusUpdate = async (id, status) => {
    try {
      await updateOrderStatus(id, status)
      showAlert(`Status updated to ${status}`)
      load()
    } catch {
      showAlert('Status update failed', 'error')
    }
  }

  const addItem = () =>
    setOrderForm({ ...orderForm, items: [...orderForm.items, { productId: '', quantity: 1 }] })

  const removeItem = (idx) =>
    setOrderForm({ ...orderForm, items: orderForm.items.filter((_, i) => i !== idx) })

  const setItem = (idx, field, val) => {
    const items = [...orderForm.items]
    items[idx] = { ...items[idx], [field]: val }
    setOrderForm({ ...orderForm, items })
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>📦 Orders</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Place Order
        </button>
      </div>

      {alert && <div className={`alert alert-${alert.type}`}>{alert.msg}</div>}

      {loading ? (
        <div className="spinner-wrap"><div className="spinner" /></div>
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <p>No orders yet.</p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>Place your first order</button>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order.id} className="order-card">
              <div className="order-header" onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}>
                <div className="order-meta">
                  <span className="order-id">Order #{order.id}</span>
                  <span className="order-date">{new Date(order.createdAt).toLocaleDateString()}</span>
                  {!isAdmin && <span className="order-user-label">User: {order.userId}</span>}
                  {isAdmin && <span className="order-user-label">User ID: {order.userId}</span>}
                </div>
                <div className="order-right">
                  <span className="order-amount">Rs. {Number(order.totalAmount).toLocaleString()}</span>
                  <span className="status-badge" style={{ background: STATUS_COLORS[order.status] || '#6b7280' }}>
                    {order.status}
                  </span>
                  <span className="expand-icon">{expandedOrder === order.id ? '▲' : '▼'}</span>
                </div>
              </div>

              {expandedOrder === order.id && (
                <div className="order-details">
                  <p><strong>Shipping:</strong> {order.shippingAddress}</p>
                  <table className="items-table">
                    <thead>
                      <tr><th>Product ID</th><th>Qty</th><th>Unit Price</th><th>Subtotal</th></tr>
                    </thead>
                    <tbody>
                      {order.items?.map((item, i) => (
                        <tr key={i}>
                          <td>{item.productId}</td>
                          <td>{item.quantity}</td>
                          <td>Rs. {Number(item.unitPrice).toLocaleString()}</td>
                          <td>Rs. {Number(item.subtotal).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="order-actions">
                    {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
                      <button className="btn btn-sm btn-warning" onClick={() => handleCancel(order.id)}>
                        Cancel Order
                      </button>
                    )}
                    {isAdmin && (
                      <>
                        <select
                          className="status-select"
                          value={order.status}
                          onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                        >
                          {Object.keys(STATUS_COLORS).map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(order.id)}>
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Place New Order</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handlePlaceOrder}>
              <div className="form-group">
                <label>Shipping Address *</label>
                <input
                  value={orderForm.shippingAddress}
                  onChange={(e) => setOrderForm({ ...orderForm, shippingAddress: e.target.value })}
                  placeholder="Enter delivery address"
                  required
                />
              </div>
              <div className="form-group">
                <label>Order Items</label>
                {orderForm.items.map((item, idx) => (
                  <div key={idx} className="item-row">
                    <select
                      value={item.productId}
                      onChange={(e) => setItem(idx, 'productId', e.target.value)}
                      required
                    >
                      <option value="">Select product...</option>
                      {products.filter((p) => p.stockQuantity > 0).map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} — Rs. {Number(p.price).toLocaleString()} ({p.stockQuantity} left)
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => setItem(idx, 'quantity', e.target.value)}
                      className="qty-input"
                    />
                    {orderForm.items.length > 1 && (
                      <button type="button" className="btn btn-sm btn-danger" onClick={() => removeItem(idx)}>✕</button>
                    )}
                  </div>
                ))}
                <button type="button" className="btn btn-sm btn-secondary" onClick={addItem}>
                  + Add Item
                </button>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Place Order</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
