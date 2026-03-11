import React, { useEffect, useState } from 'react'
import { getPayments, getPaymentByOrder, refundPayment, deletePayment } from '../api'
import { useAuth } from '../context/AuthContext'

const STATUS_COLORS = {
  PENDING: '#f59e0b',
  SUCCESS: '#10b981',
  FAILED: '#ef4444',
  REFUNDED: '#8b5cf6',
}

export default function Payments() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [alert, setAlert] = useState(null)
  const [searchOrderId, setSearchOrderId] = useState('')
  const [searched, setSearched] = useState(null)

  const load = async () => {
    try {
      const { data } = await getPayments(isAdmin ? undefined : user?.userId)
      setPayments(data)
    } catch {
      showAlert('Failed to load payments', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const showAlert = (msg, type = 'success') => {
    setAlert({ msg, type })
    setTimeout(() => setAlert(null), 3000)
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchOrderId) return
    try {
      const { data } = await getPaymentByOrder(searchOrderId)
      setSearched(data)
    } catch {
      showAlert('No payment found for that order ID', 'error')
      setSearched(null)
    }
  }

  const handleRefund = async (id) => {
    if (!window.confirm('Issue a refund for this payment?')) return
    try {
      await refundPayment(id)
      showAlert('Refund issued successfully')
      load()
      setSearched(null)
    } catch (err) {
      showAlert(err.response?.data?.message || 'Refund failed', 'error')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm(`Permanently delete Payment #${id}? This cannot be undone.`)) return
    try {
      await deletePayment(id)
      showAlert(`Payment #${id} deleted`)
      setPayments((prev) => prev.filter((p) => p.id !== id))
      if (searched?.id === id) setSearched(null)
    } catch (err) {
      showAlert(err.response?.data?.message || 'Delete failed', 'error')
    }
  }

  const PaymentRow = ({ p }) => (
    <div className="payment-card">
      <div className="payment-top">
        <div>
          <span className="payment-id">Payment #{p.id}</span>
          <span className="payment-meta"> · Order #{p.orderId} · User #{p.userId}</span>
        </div>
        <span className="status-badge" style={{ background: STATUS_COLORS[p.status] || '#6b7280' }}>
          {p.status}
        </span>
      </div>
      <div className="payment-body">
        <div className="payment-info">
          <span>💳 {p.paymentMethod}</span>
          <span>💰 Rs. {Number(p.amount).toLocaleString()}</span>
          <span>🔖 {p.transactionId}</span>
          <span>📅 {p.createdAt ? new Date(p.createdAt).toLocaleString() : '—'}</span>
        </div>
        {p.message && <p className="payment-message">{p.message}</p>}
      </div>
      {isAdmin && (
        <div className="card-actions">
          {p.status === 'COMPLETED' && (
            <button className="btn btn-sm btn-warning" onClick={() => handleRefund(p.id)}>
              Issue Refund
            </button>
          )}
          <button className="btn btn-sm btn-danger" onClick={() => handleDelete(p.id)}>
            Delete
          </button>
        </div>
      )}
    </div>
  )

  return (
    <div className="page">
      <div className="page-header">
        <h2>💳 Payments</h2>
      </div>

      {alert && <div className={`alert alert-${alert.type}`}>{alert.msg}</div>}

      <div className="search-bar-form">
        <form onSubmit={handleSearch} className="inline-form">
          <input
            type="number"
            placeholder="Search by Order ID..."
            value={searchOrderId}
            onChange={(e) => setSearchOrderId(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="btn btn-secondary">Lookup</button>
          {searched && (
            <button type="button" className="btn btn-ghost" onClick={() => { setSearched(null); setSearchOrderId('') }}>
              Clear
            </button>
          )}
        </form>
      </div>

      {searched && (
        <div className="search-result">
          <h4>Search Result</h4>
          <PaymentRow p={searched} />
        </div>
      )}

      {loading ? (
        <div className="spinner-wrap"><div className="spinner" /></div>
      ) : payments.length === 0 ? (
        <p className="empty-msg">No payments found.</p>
      ) : (
        <div className="payments-list">
          {payments.map((p) => <PaymentRow key={p.id} p={p} />)}
        </div>
      )}
    </div>
  )
}
