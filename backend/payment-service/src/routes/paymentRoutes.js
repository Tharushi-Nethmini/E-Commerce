const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { validatePayment } = require('../middleware/validation');

/**
 * @swagger
 * components:
 *   schemas:
 *     Payment:
 *       type: object
 *       required:
 *         - orderId
 *         - amount
 *         - paymentMethod
 *       properties:
 *         id:
 *           type: string
 *         orderId:
 *           type: string
 *         amount:
 *           type: number
 *         paymentMethod:
 *           type: string
 *           enum: [CREDIT_CARD, DEBIT_CARD, PAYPAL, CASH_ON_DELIVERY]
 *         transactionId:
 *           type: string
 *         status:
 *           type: string
 *           enum: [PENDING, PROCESSING, COMPLETED, FAILED, REFUNDED]
 */

/**
 * @swagger
 * /api/payments/process:
 *   post:
 *     summary: Process a payment
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Payment'
 *     responses:
 *       200:
 *         description: Payment processed successfully
 *       400:
 *         description: Invalid payment data
 */
router.post('/process', validatePayment, paymentController.processPayment);

/**
 * @swagger
 * /api/payments:
 *   get:
 *     summary: Get all payments
 *     tags: [Payments]
 *     responses:
 *       200:
 *         description: List of all payments
 */
router.get('/', paymentController.getAllPayments);

/**
 * @swagger
 * /api/payments/order/{orderId}:
 *   get:
 *     summary: Get payment by order ID
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment details for order
 *       404:
 *         description: Payment not found
 */
router.get('/order/:orderId', paymentController.getPaymentByOrderId);

/**
 * @swagger
 * /api/payments/{id}:
 *   get:
 *     summary: Get payment by ID
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment details
 *       404:
 *         description: Payment not found
 */
router.get('/:id', paymentController.getPaymentById);

/**
 * @swagger
 * /api/payments/{id}/refund:
 *   post:
 *     summary: Refund a payment
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment refunded successfully
 *       404:
 *         description: Payment not found
 */
router.post('/:id/refund', paymentController.refundPayment);

/**
 * @swagger
 * /api/payments/status:
 *   post:
 *     summary: Get payment status
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paymentId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment status
 */
router.post('/status', paymentController.getPaymentStatus);

module.exports = router;
