'use client'
import { useState, useEffect } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import api from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import '@/styles/payments.css'

function PaymentsPage() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [refunding, setRefunding] = useState(null)
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'

  useEffect(() => {
    fetchPayments()
  }, [isAdmin])

  const fetchPayments = async () => {
    try {
      if (isAdmin) {
        const response = await api.get(`${process.env.NEXT_PUBLIC_API_PAYMENT_SERVICE}/api/payments`)
        setPayments(response.data)
      } else {
        // Fetch user's orders, then get payments for those orders
        const ordersResponse = await api.get(
          `${process.env.NEXT_PUBLIC_API_ORDER_SERVICE}/api/orders?userId=${user?.id}`
        )
        const orders = ordersResponse.data
        if (orders.length === 0) {
          setPayments([])
          return
        }
        const paymentResults = await Promise.allSettled(
          orders.map(order =>
            api.get(`${process.env.NEXT_PUBLIC_API_PAYMENT_SERVICE}/api/payments/order/${order.id}`)
          )
        )
        const userPayments = paymentResults
          .filter(r => r.status === 'fulfilled')
          .map(r => r.value.data)
        setPayments(userPayments)
      }
    } catch (error) {
      console.error('Error fetching payments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefund = async (paymentId) => {
    if (!confirm('Are you sure you want to refund this payment?')) return
    setRefunding(paymentId)
    try {
      await api.post(`${process.env.NEXT_PUBLIC_API_PAYMENT_SERVICE}/api/payments/${paymentId}/refund`)
      fetchPayments()
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to refund payment')
    } finally {
      setRefunding(null)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      PENDING: 'payment-status-pending',
      PROCESSING: 'payment-status-processing',
      COMPLETED: 'payment-status-completed',
      FAILED: 'payment-status-failed',
      REFUNDED: 'payment-status-refunded'
    }
    return colors[status] || 'payment-status-pending'
  }

  if (loading) {
    return <div className="payments-loading">Loading payments...</div>
  }

  return (
    <div>
      <div className="payments-header">
        <h1 className="payments-title">{isAdmin ? 'All Payments' : 'My Payments'}</h1>
      </div>

      <div className="payments-list">
        {payments.map((payment) => (
          <div key={payment._id || payment.id} className="payment-card">
            <div className="payment-header">
              <div className="payment-header-info">
                <div className="payment-title-row">
                  <h3 className="payment-id">Payment #{payment._id || payment.id}</h3>
                  <span className={`payment-status-badge ${getStatusColor(payment.status)}`}>
                    {payment.status}
                  </span>
                </div>
                <div className="payment-details-grid">
                  <p className="payment-detail-item"><span className="payment-detail-label">Order ID:</span> {payment.orderId}</p>
                  <p className="payment-detail-item"><span className="payment-detail-label">Amount:</span> <span className="payment-amount">${payment.amount?.toFixed(2) || '0.00'}</span></p>
                  <p className="payment-detail-item"><span className="payment-detail-label">Method:</span> {payment.paymentMethod}</p>
                  <p className="payment-detail-item"><span className="payment-detail-label">Transaction ID:</span> {payment.transactionId || 'N/A'}</p>
                  <p className="payment-detail-item"><span className="payment-detail-label">Created:</span> {new Date(payment.createdAt).toLocaleString()}</p>
                  {payment.processedAt && (
                    <p className="payment-detail-item"><span className="payment-detail-label">Processed:</span> {new Date(payment.processedAt).toLocaleString()}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Admin: refund button for completed payments */}
            {isAdmin && payment.status === 'COMPLETED' && (
              <div className="payment-admin-actions">
                <button
                  onClick={() => handleRefund(payment._id || payment.id)}
                  disabled={refunding === (payment._id || payment.id)}
                  className="payment-refund-btn"
                >
                  {refunding === (payment._id || payment.id) ? 'Refunding...' : 'Refund Payment'}
                </button>
              </div>
            )}
          </div>
        ))}

        {payments.length === 0 && (
          <div className="payments-empty">
            {isAdmin ? 'No payments found.' : 'No payments found. Place an order to see payments here.'}
          </div>
        )}
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <ProtectedRoute>
      <PaymentsPage />
    </ProtectedRoute>
  )
}

