const asyncHandler = require('../utils/asyncHandler');
const Order = require('../models/Order');
const User = require('../models/User'); // Assuming you might need user details
const Product = require('../models/Product'); // To check product stock, etc.
const Cart = require('../models/Cart'); // To clear cart after order
const sendEmail = require('../utils/emailService'); // Import the email service

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const createOrder = asyncHandler(async (req, res) => {
    const {
        orderItems,
        shippingAddress,
        paymentMethod,
        taxPrice,
        shippingPrice,
        totalPrice,
    } = req.body;

    if (orderItems && orderItems.length === 0) {
        res.status(400);
        throw new Error('No order items');
    } else {
        // Here you would typically:
        // 1. Validate product existence and stock
        // 2. Calculate prices on the backend to prevent tampering
        // 3. Create the order in the database

        const order = new Order({
            user: req.user._id,
            orderItems: orderItems.map(item => ({
                ...item,
                product: item._id, // Map frontend _id to backend product field
                _id: undefined, // Remove frontend _id from subdocument
            })),
            shippingAddress,
            paymentMethod,
            taxPrice,
            shippingPrice,
            totalPrice,
            isPaid: false, // Will be updated by payment gateway webhook/verification
            paidAt: null,
            isDelivered: false,
            deliveredAt: null,
            status: 'pending', // Initial status
        });

        const createdOrder = await order.save();

        // Optionally, clear the user's cart after creating the order
        await Cart.deleteOne({ user: req.user._id });

        // --- Send Order Confirmation Email ---
        const user = await User.findById(req.user._id); // Fetch user for email

        if (user) {
            const orderConfirmationSubject = `Your Souk Couture Order #${createdOrder._id} has been placed!`;
            const orderItemsList = createdOrder.orderItems.map(item => `
                <li>${item.name} (${item.quantity} x NGN${item.price.toFixed(2)}) - Size: ${item.selectedSize}</li>
            `).join('');

            const orderConfirmationHtml = `
                <h1>Order Confirmation for Order #${createdOrder._id}</h1>
                <p>Dear ${user.username},</p>
                <p>Thank you for your purchase from Souk Couture. Your order has been successfully placed and is currently <strong>${createdOrder.status.toUpperCase()}</strong>.</p>
                <h2>Order Details:</h2>
                <ul>
                    <li><strong>Order ID:</strong> ${createdOrder._id}</li>
                    <li><strong>Total Price:</strong> NGN${createdOrder.totalPrice.toFixed(2)}</li>
                    <li><strong>Payment Method:</strong> ${createdOrder.paymentMethod}</li>
                    <li><strong>Shipping Address:</strong><br>
                        ${createdOrder.shippingAddress.address},<br>
                        ${createdOrder.shippingAddress.city}, ${createdOrder.shippingAddress.postalCode}<br>
                        ${createdOrder.shippingAddress.country}
                    </li>
                </ul>
                <h3>Items in Your Order:</h3>
                <ul>${orderItemsList}</ul>
                <p>We will notify you once your order has been processed and shipped.</p>
                <p>You can track your order status by logging into your account or by visiting <a href="${process.env.FRONTEND_URL.split(',')[0]}/order/${createdOrder._id}">your order page</a>.</p>
                <p>Best regards,<br>The Souk Couture Team</p>
            `;

            const orderConfirmationText = `
                Order Confirmation for Order #${createdOrder._id}\n
                Dear ${user.username},\n
                Thank you for your purchase from Souk Couture. Your order has been successfully placed and is currently ${createdOrder.status.toUpperCase()}.\n
                Order ID: ${createdOrder._id}\n
                Total Price: NGN${createdOrder.totalPrice.toFixed(2)}\n
                Payment Method: ${createdOrder.paymentMethod}\n
                Shipping Address:\n
                ${createdOrder.shippingAddress.address},\n
                ${createdOrder.shippingAddress.city}, ${createdOrder.shippingAddress.postalCode}\n
                ${createdOrder.shippingAddress.country}\n
                Items in Your Order:\n
                ${createdOrder.orderItems.map(item => `${item.name} (${item.quantity} x NGN${item.price.toFixed(2)})`).join('\n')}\n
                We will notify you once your order has been processed and shipped.\n
                You can track your order status by visiting: ${process.env.FRONTEND_URL.split(',')[0]}/order/${createdOrder._id}\n
                Best regards,\nThe Souk Couture Team
            `;

            await sendEmail({
                to: user.email,
                subject: orderConfirmationSubject,
                html: orderConfirmationHtml,
                text: orderConfirmationText,
            });
        }
        // ------------------------------------

        res.status(201).json(createdOrder);
    }
});

// @desc    Get user orders
// @route   GET /api/orders
// @access  Private
const getUserOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id).populate('user', 'username email');

    if (order) {
        // Ensure only the user who owns the order or an admin can view it
        if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            res.status(401);
            throw new Error('Not authorized to view this order');
        }
        res.json(order);
    } else {
        res.status(404);
        throw new Error('Order not found');
    }
});

// @desc    Update order to paid (triggered by payment gateway webhook/verification)
// @route   PUT /api/orders/:id/pay
// @access  Private (but ideally handled by webhook, or by verification in paymentController)
const updateOrderToPaid = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (order) {
        order.isPaid = true;
        order.paidAt = req.body.paidAt || Date.now(); // Changed from Date.body.paidAt
        order.paymentResult = {
            id: req.body.id,
            status: req.body.status,
            update_time: req.body.update_time,
            email_address: req.body.email_address,
            reference: req.body.reference, // Custom for Paystack/Flutterwave
        };
        order.status = 'processing'; // Change status after payment

        const updatedOrder = await order.save();

        res.json(updatedOrder);
    } else {
        res.status(404);
        throw new Error('Order not found');
    }
});

module.exports = {
    createOrder,
    getUserOrders,
    getOrderById,
    updateOrderToPaid,
};
