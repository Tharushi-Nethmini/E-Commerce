const Payment = require('../models/Payment');
const { v4: uuidv4 } = require('uuid');

class PaymentService {
  // Process payment (called by Order Service)
  async processPayment(paymentData) {
    try {
      const { orderId, amount, paymentMethod } = paymentData;

      // Create payment record
      const payment = new Payment({
        orderId,
        amount,
        paymentMethod,
        status: 'PROCESSING'
      });

      await payment.save();

      // Simulate payment processing
      // In production, this would integrate with payment gateway (Stripe, PayPal, etc.)
      const paymentResult = await this.simulatePaymentGateway(payment);

      if (paymentResult.success) {
        payment.status = 'COMPLETED';
        payment.transactionId = paymentResult.transactionId;
        payment.processedAt = new Date();
      } else {
        payment.status = 'FAILED';
        payment.failureReason = paymentResult.reason;
      }

      await payment.save();

      return {
        success: paymentResult.success,
        paymentId: payment._id,
        transactionId: payment.transactionId,
        status: payment.status,
        message: paymentResult.success ? 'Payment processed successfully' : paymentResult.reason
      };
    } catch (error) {
      throw error;
    }
  }

  // Simulate payment gateway processing
  async simulatePaymentGateway(payment) {
    return new Promise((resolve) => {
      setTimeout(() => {
        // 90% success rate for simulation
        const success = Math.random() > 0.1;
        
        if (success) {
          resolve({
            success: true,
            transactionId: `TXN-${uuidv4()}`
          });
        } else {
          const reasons = [
            'Insufficient funds',
            'Card declined',
            'Payment gateway timeout',
            'Invalid card details'
          ];
          resolve({
            success: false,
            reason: reasons[Math.floor(Math.random() * reasons.length)]
          });
        }
      }, 1000); // Simulate processing delay
    });
  }

  // Get payment by ID
  async getPaymentById(paymentId) {
    try {
      const payment = await Payment.findById(paymentId);
      if (!payment) {
        throw new Error('Payment not found');
      }
      return payment;
    } catch (error) {
      throw error;
    }
  }

  // Get payment by order ID
  async getPaymentByOrderId(orderId) {
    try {
      const payment = await Payment.findOne({ orderId });
      if (!payment) {
        throw new Error('Payment not found for this order');
      }
      return payment;
    } catch (error) {
      throw error;
    }
  }

  // Get all payments
  async getAllPayments() {
    try {
      return await Payment.find().sort({ createdAt: -1 });
    } catch (error) {
      throw error;
    }
  }

  // Refund payment
  async refundPayment(paymentId) {
    try {
      const payment = await Payment.findById(paymentId);
      
      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status !== 'COMPLETED') {
        throw new Error('Only completed payments can be refunded');
      }

      payment.status = 'REFUNDED';
      payment.updatedAt = new Date();
      await payment.save();

      return {
        success: true,
        message: 'Payment refunded successfully',
        paymentId: payment._id
      };
    } catch (error) {
      throw error;
    }
  }

  // Get payment status (for inter-service communication)
  async getPaymentStatus(orderId) {
    try {
      const payment = await Payment.findOne({ orderId });
      
      if (!payment) {
        return {
          exists: false,
          status: null
        };
      }

      return {
        exists: true,
        status: payment.status,
        paymentId: payment._id,
        transactionId: payment.transactionId,
        amount: payment.amount
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new PaymentService();
