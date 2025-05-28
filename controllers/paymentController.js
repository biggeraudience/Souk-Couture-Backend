const asyncHandler = require('../utils/asyncHandler');
const Order = require('../models/Order');
const axios = require('axios'); 
const crypto = require('crypto'); 


const initializeFlutterwavePayment = asyncHandler(async (req, res) => {
    const { orderId } = req.body;
    const user = req.user;

    const order = await Order.findById(orderId);

    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    if (order.user.toString() !== user._id.toString()) {
        res.status(401);
        throw new Error('Not authorized to access this order');
    }

    if (order.isPaid) {
        res.status(400);
        throw new Error('Order already paid');
    }

  
    const txRef = `SOUKCOUTURE_${order._id.toString()}_${Date.now()}`;

    try {
        const flutterwaveResponse = await axios.post(
            'https://api.flutterwave.com/v3/payments',
            {
                tx_ref: txRef,
                amount: order.totalPrice,
                currency: 'NGN',
                redirect_url: `${process.env.FRONTEND_URL.split(',')[0]}/order/${orderId}/payment-success?tx_ref=${txRef}`, // Use the first URL from comma-separated list
                customer: {
                    email: user.email,
                    phonenumber: user.phoneNumber || 'N/A', 
                    name: user.name,
                },
                customizations: {
                    title: 'Souk Couture Payment',
                    description: `Payment for Order ${order._id}`,
                    logo: 'https://your-logo-url.com/logo.png', 
                },
                meta: { 
                    order_id: order._id.toString(),
                    user_id: user._id.toString(),
                },
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        if (flutterwaveResponse.data && flutterwaveResponse.data.status === 'success') {
            res.json({
                status: 'success',
                link: flutterwaveResponse.data.data.link, 
            });
        } else {
            res.status(400);
            throw new Error(`Flutterwave initialization failed: ${flutterwaveResponse.data.message || 'Unknown error'}`);
        }

    } catch (error) {
        console.error('Flutterwave initialization error:', error.response ? error.response.data : error.message);
        res.status(500);
        throw new Error(`Flutterwave initialization failed: ${error.response ? error.response.data.data.message : error.message}`);
    }
});


const verifyFlutterwavePayment = asyncHandler(async (req, res) => {
    const { txRef } = req.params;
    const user = req.user;

    if (!txRef) {
        res.status(400);
        throw new Error('Transaction reference is required for verification.');
    }

    try {
        const flutterwaveResponse = await axios.get(
            `https://api.flutterwave.com/v3/transactions/${txRef}/verify`, 
            {
                headers: {
                    Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
                },
            }
        );

        const data = flutterwaveResponse.data.data;

        if (data && data.status === 'successful') {
            const orderId = data.meta.order_id;
            const order = await Order.findById(orderId);

            if (!order) {
                res.status(404);
                throw new Error('Order not found (from Flutterwave verification)');
            }

            if (order.user.toString() !== user._id.toString()) {
                res.status(401);
                throw new Error('Not authorized to update this order');
            }

            if (order.isPaid) {
                res.status(400);
                throw new Error('Order already paid');
            }

            
            if (data.currency !== 'NGN' || data.amount !== order.totalPrice) {
                 console.warn(`Amount mismatch for order ${orderId}. Expected: ${order.totalPrice}, Received: ${data.amount}. Transaction Reference: ${txRef}`);
                 res.status(400);
                 throw new Error('Payment amount mismatch or currency not NGN. Possible fraud attempt.');
            }

            
            order.isPaid = true;
            order.paidAt = Date.now();
            order.paymentMethod = 'Flutterwave';
            order.paymentResult = {
                id: data.id,
                status: data.status,
                reference: data.tx_ref,
                channel: data.payment_type, 
                amount: data.amount,
                currency: data.currency,
                email_address: data.customer.email,
                paidAt: data.created_at, 
            };
            order.status = 'processing';

            const updatedOrder = await order.save();

            res.json({
                message: 'Payment verified and order updated successfully',
                order: updatedOrder,
            });
        } else {
            res.status(400);
            throw new Error(`Payment not successful: ${data ? data.status : 'Unknown status'}`);
        }

    } catch (error) {
        console.error('Flutterwave verification error:', error.response ? error.response.data : error.message);
        res.status(500);
        throw new Error(`Flutterwave verification failed: ${error.response ? error.response.data.message : error.message}`);
    }
});



const flutterwaveWebhookHandler = asyncHandler(async (req, res) => {
  
    const hash = req.headers['verif-hash']; 
    if (!hash) {
        console.warn('Webhook: Missing verif-hash header.');
        return res.status(401).send('Unauthorized');
    }

    if (hash !== process.env.FLUTTERWAVE_WEBHOOK_SECRET_HASH) {
        console.warn('Webhook signature mismatch. Possible fraudulent request.');
        return res.status(400).send('Invalid signature');
    }

  
    const event = req.body;
    console.log('Flutterwave Webhook Event Received:', event.event);

    switch (event.event) {
        case 'charge.completed':
        case 'transfer.completed': 
            const data = event.data;
            const orderId = data.meta ? data.meta.order_id : null;

            if (!orderId) {
                console.error('Webhook: Order ID missing from metadata for charge.completed event.');
                return res.status(400).send('Order ID missing');
            }

         
            const verifyResponse = await axios.get(
                `https://api.flutterwave.com/v3/transactions/${data.id}/verify`, 
                {
                    headers: {
                        Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
                    },
                }
            );
            const verifiedData = verifyResponse.data.data;

            if (verifiedData.status === 'successful' && verifiedData.amount === data.amount && verifiedData.currency === data.currency) {
                const order = await Order.findById(orderId);

                if (!order) {
                    console.error(`Webhook: Order not found for ID: ${orderId}`);
                    return res.status(404).send('Order not found');
                }

                if (order.isPaid) {
                    console.log(`Webhook: Order ${orderId} already marked as paid.`);
                    return res.status(200).send('Order already paid');
                }

               
                order.isPaid = true;
                order.paidAt = Date.now();
                order.paymentMethod = 'Flutterwave'; 
                order.paymentResult = {
                    id: verifiedData.id,
                    status: verifiedData.status,
                    reference: verifiedData.tx_ref,
                    channel: verifiedData.payment_type,
                    amount: verifiedData.amount,
                    currency: verifiedData.currency,
                    email_address: verifiedData.customer.email,
                    paidAt: verifiedData.created_at,
                };
                order.status = 'processing';

                await order.save();
                console.log(`Webhook: Order ${orderId} updated to paid and processing by webhook.`);
            } else {
                console.warn(`Webhook: Verification failed for transaction ID ${data.id}. Status: ${verifiedData.status}, Amount: ${verifiedData.amount}. Data: ${JSON.stringify(verifiedData)}`);
            }
            break;
        case 'charge.failed':
        case 'transfer.failed':
            console.log('Payment or Transfer failed:', event.data.tx_ref, event.data.status, event.data.processor_response);
         
            break;
        case 'transaction.dispute':
            console.log('Dispute received for transaction:', event.data.tx_ref);
          
            break;
      
        default:
            console.log(`Unhandled Flutterwave event type: ${event.event}`);
    }

    res.status(200).send('Webhook received successfully');
});

module.exports = {
    initializeFlutterwavePayment,
    verifyFlutterwavePayment,
    flutterwaveWebhookHandler,
};
