const paymentService = require('../services/paymentService');

class PaymentController {
  // Process payment
  async processPayment(req, res) {
    try {
      const result = await paymentService.processPayment(req.body);
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  // Get payment by ID
  async getPaymentById(req, res) {
    try {
      const payment = await paymentService.getPaymentById(req.params.id);
      res.status(200).json(payment);
    } catch (error) {
      res.status(404).json({ message: error.message });
    }
  }

  // Get payment by order ID
  async getPaymentByOrderId(req, res) {
    try {
      const payment = await paymentService.getPaymentByOrderId(req.params.orderId);
      res.status(200).json(payment);
    } catch (error) {
      res.status(404).json({ message: error.message });
    }
  }

  // Get all payments
  async getAllPayments(req, res) {
    try {
      const payments = await paymentService.getAllPayments();
      res.status(200).json(payments);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Refund payment
  async refundPayment(req, res) {
    try {
      const result = await paymentService.refundPayment(req.params.id);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  // Get payment status (inter-service endpoint)
  async getPaymentStatus(req, res) {
    try {
      const { orderId } = req.body;
      const result = await paymentService.getPaymentStatus(orderId);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
}

module.exports = new PaymentController();
