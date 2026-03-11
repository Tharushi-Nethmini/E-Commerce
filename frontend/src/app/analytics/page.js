'use client'
import { useState, useEffect } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import api from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { FaShoppingBag, FaUsers, FaDollarSign, FaBoxOpen, FaExclamationTriangle, FaChartBar, FaFilePdf, FaFileExcel, FaSync } from 'react-icons/fa'
import { downloadPDF, downloadExcel } from '@/lib/reportGenerator'
import '@/styles/analytics.css'

function AnalyticsPage() {
  const { user } = useAuth()
  const [orderStats, setOrderStats] = useState(null)
  const [userStats, setUserStats] = useState(null)
  const [lowStockProducts, setLowStockProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [exporting, setExporting] = useState(null) // 'pdf' | 'excel' | null

  useEffect(() => {
    fetchAllStats()
    const interval = setInterval(fetchAllStats, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchAllStats = async () => {
    try {
      const [ordersRes, usersRes, lowStockRes] = await Promise.allSettled([
        api.get(`${process.env.NEXT_PUBLIC_API_ORDER_SERVICE}/api/orders/stats`),
        api.get(`${process.env.NEXT_PUBLIC_API_USER_SERVICE}/api/users/stats`),
        api.get(`${process.env.NEXT_PUBLIC_API_INVENTORY_SERVICE}/api/inventory/products/low-stock`)
      ])

      if (ordersRes.status === 'fulfilled') setOrderStats(ordersRes.value.data)
      if (usersRes.status === 'fulfilled') setUserStats(usersRes.value.data)
      if (lowStockRes.status === 'fulfilled') setLowStockProducts(lowStockRes.value.data)
    } catch (err) {
      setError('Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) =>
    'Rs. ' + Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const handleExport = async (format) => {
    setExporting(format)
    try {
      const payload = { orderStats, userStats, lowStockProducts, generatedAt: new Date() }
      if (format === 'pdf')   await downloadPDF(payload)
      if (format === 'excel') await downloadExcel(payload)
    } catch (err) {
      console.error('Export failed:', err)
      alert('Export failed. Please try again.')
    } finally {
      setExporting(null)
    }
  }

  const STATUS_COLORS = {
    PENDING: '#F59E0B',
    CONFIRMED: '#3B82F6',
    PROCESSING: '#8B5CF6',
    SHIPPED: '#06B6D4',
    DELIVERED: '#10B981',
    CANCELLED: '#EF4444',
    FAILED: '#6B7280'
  }

  if (loading) {
    return (
      <div className="analytics-loading">
        <div className="spinner" />
        <p>Loading analytics...</p>
      </div>
    )
  }

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <div>
          <h1><FaChartBar /> Analytics Dashboard</h1>
          <p>Real-time overview of your e-commerce platform</p>
        </div>
        <div className="analytics-export-group">
          <button
            className="btn-export btn-export-refresh"
            onClick={fetchAllStats}
            title="Refresh data"
          >
            <FaSync />
          </button>
          <button
            className="btn-export btn-export-excel"
            onClick={() => handleExport('excel')}
            disabled={!!exporting}
          >
            <FaFileExcel />
            {exporting === 'excel' ? 'Generating…' : 'Export Excel'}
          </button>
          <button
            className="btn-export btn-export-pdf"
            onClick={() => handleExport('pdf')}
            disabled={!!exporting}
          >
            <FaFilePdf />
            {exporting === 'pdf' ? 'Generating…' : 'Export PDF'}
          </button>
        </div>
      </div>

      {/* Top KPI cards */}
      <div className="analytics-kpi-grid">
        <div className="kpi-card kpi-orders">
          <div className="kpi-icon"><FaShoppingBag /></div>
          <div className="kpi-info">
            <span className="kpi-value">{orderStats?.totalOrders ?? '—'}</span>
            <span className="kpi-label">Total Orders</span>
            <span className="kpi-sub">+{orderStats?.ordersToday ?? 0} today</span>
          </div>
        </div>

        <div className="kpi-card kpi-revenue">
          <div className="kpi-icon"><FaDollarSign /></div>
          <div className="kpi-info">
            <span className="kpi-value">{formatCurrency(orderStats?.totalRevenue)}</span>
            <span className="kpi-label">Total Revenue</span>
            <span className="kpi-sub">Confirmed + Delivered</span>
          </div>
        </div>

        <div className="kpi-card kpi-users">
          <div className="kpi-icon"><FaUsers /></div>
          <div className="kpi-info">
            <span className="kpi-value">{userStats?.totalUsers ?? '—'}</span>
            <span className="kpi-label">Total Users</span>
            <span className="kpi-sub">+{userStats?.newToday ?? 0} new today</span>
          </div>
        </div>

        <div className="kpi-card kpi-lowstock">
          <div className="kpi-icon"><FaExclamationTriangle /></div>
          <div className="kpi-info">
            <span className="kpi-value">{lowStockProducts.length}</span>
            <span className="kpi-label">Low Stock Items</span>
            <span className="kpi-sub">Stock ≤ 10 units</span>
          </div>
        </div>
      </div>

      <div className="analytics-row">
        {/* Orders by Status */}
        <div className="analytics-card">
          <h2><FaShoppingBag /> Orders by Status</h2>
          {orderStats?.byStatus && Object.keys(orderStats.byStatus).length > 0 ? (
            <div className="status-list">
              {Object.entries(orderStats.byStatus).map(([status, count]) => (
                <div key={status} className="status-item">
                  <span
                    className="status-dot"
                    style={{ background: STATUS_COLORS[status] || '#9CA3AF' }}
                  />
                  <span className="status-name">{status}</span>
                  <span className="status-count">{count}</span>
                  <div className="status-bar-wrap">
                    <div
                      className="status-bar"
                      style={{
                        width: `${Math.round((count / (orderStats.totalOrders || 1)) * 100)}%`,
                        background: STATUS_COLORS[status] || '#9CA3AF'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="analytics-empty">No order data yet</p>
          )}
        </div>

        {/* Users by Role */}
        <div className="analytics-card">
          <h2><FaUsers /> Users by Role</h2>
          {userStats?.byRole && Object.keys(userStats.byRole).length > 0 ? (
            <div className="status-list">
              {Object.entries(userStats.byRole).map(([role, count]) => (
                <div key={role} className="role-item">
                  <span className={`role-badge role-${role.toLowerCase()}`}>{role}</span>
                  <span className="status-count">{count}</span>
                  <div className="status-bar-wrap">
                    <div
                      className="status-bar"
                      style={{
                        width: `${Math.round((count / (userStats.totalUsers || 1)) * 100)}%`,
                        background: role === 'ADMIN' ? '#EF4444' : role === 'VENDOR' ? '#10B981' : '#3B82F6'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="analytics-empty">No user data yet</p>
          )}
        </div>
      </div>

      {/* Recent Orders */}
      {orderStats?.recentOrders?.length > 0 && (
        <div className="analytics-card analytics-full">
          <h2><FaShoppingBag /> Recent Orders</h2>
          <div className="analytics-table-wrap">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>User ID</th>
                  <th>Product ID</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {orderStats.recentOrders.map(order => (
                  <tr key={order._id}>
                    <td className="order-id">{order._id?.slice(-8)}</td>
                    <td>{order.userId?.slice(-8)}</td>
                    <td>{order.productId?.slice(-8)}</td>
                    <td>{formatCurrency(order.totalAmount)}</td>
                    <td>
                      <span
                        className="status-badge"
                        style={{ background: STATUS_COLORS[order.status] || '#9CA3AF' }}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Low Stock Products */}
      {lowStockProducts.length > 0 && (
        <div className="analytics-card analytics-full analytics-danger">
          <h2><FaExclamationTriangle /> Low Stock Products</h2>
          <div className="analytics-table-wrap">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Reserved</th>
                  <th>Available</th>
                </tr>
              </thead>
              <tbody>
                {lowStockProducts.map(product => (
                  <tr key={product._id} className={product.quantity === 0 ? 'row-critical' : 'row-warning'}>
                    <td>{product.name}</td>
                    <td>{product.sku}</td>
                    <td>{product.category}</td>
                    <td>{formatCurrency(product.price)}</td>
                    <td>{product.quantity}</td>
                    <td>{product.reservedQuantity}</td>
                    <td>
                      <span className={`stock-badge ${product.quantity === 0 ? 'stock-out' : 'stock-low'}`}>
                        {product.quantity - product.reservedQuantity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Analytics() {
  return (
    <ProtectedRoute adminOnly>
      <AnalyticsPage />
    </ProtectedRoute>
  )
}
