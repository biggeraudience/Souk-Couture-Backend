const mongoose = require('mongoose');

const orderItemSchema = mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Product',
    },
    name: { type: String, required: true },
    images: [{ type: String }],
    price: { type: Number, required: true },
    selectedSize: { type: String, required: true },
    selectedColors: [{ type: String }],
    quantity: { type: Number, required: true },
});

const shippingAddressSchema = mongoose.Schema({
    address: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
});

const paymentResultSchema = mongoose.Schema({
    id: { type: String },
    status: { type: String },
    update_time: { type: String },
    email_address: { type: String },
});

const orderSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        orderItems: [orderItemSchema],
        shippingAddress: shippingAddressSchema,
        paymentMethod: { type: String, required: true },
        paymentResult: paymentResultSchema,
        taxPrice: { type: Number, required: true, default: 0.0 },
        shippingPrice: { type: Number, required: true, default: 0.0 },
        totalPrice: { type: Number, required: true, default: 0.0 },
        isPaid: { type: Boolean, required: true, default: false },
        paidAt: { type: Date },
        isDelivered: { type: Boolean, required: true, default: false },
        deliveredAt: { type: Date },
        status: { // Custom status for order tracking
            type: String,
            enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
            default: 'pending',
        }
    },
    { timestamps: true }
);

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
