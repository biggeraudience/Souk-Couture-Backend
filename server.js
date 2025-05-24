// server.js
const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const cors = require('cors');
const cookieParser = require('cookie-parser');

// Load environment variables from .env file
dotenv.config();

// Connect to MongoDB database
connectDB();

const app = express();

// --- Import Webhook Handler ---
// This needs to be imported directly for its specific middleware setup
// ONLY ONE IMPORT IS NEEDED!
const { flutterwaveWebhookHandler } = require('./controllers/paymentController');


// Important: Flutterwave webhook route needs raw body for signature verification.
// Place this BEFORE app.use(express.json()) for the webhook path.
app.post('/api/payments/flutterwave/webhook', express.raw({ type: 'application/json' }), flutterwaveWebhookHandler);


// --- Middleware Setup ---
// Body parsers for incoming requests. These will now run AFTER the webhook handler.
app.use(express.json()); // Parses JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parses URL-encoded request bodies
app.use(cookieParser()); // Parses cookies attached to the request object

// CORS configuration - Crucial for frontend communication
const allowedOrigins = process.env.FRONTEND_URL.split(','); // Split by comma

const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        // Also allow if the origin is in our allowed list
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type,Authorization',
};
app.use(cors(corsOptions));

// --- Route Imports ---
// Public/User Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const uploadRoutes = require('./routes/uploadRoutes'); // For image uploads
const paymentRoutes = require('./routes/paymentRoutes'); // Payment routes import

// Admin Routes (group them under /api/admin)
const adminProductRoutes = require('./routes/admin/adminProductRoutes');
const adminUserRoutes = require('./routes/admin/adminUserRoutes');
const adminOrderRoutes = require('./routes/admin/adminOrderRoutes');
const adminPromoRoutes = require('./routes/admin/adminPromoRoutes');
const adminMessageRoutes = require('./routes/admin/adminMessageRoutes');


// --- API Endpoints ---
app.get('/', (req, res) => {
    res.send('Souk Couture Backend API is running!');
});

app.get('/api/test', (req, res) => {
    res.json({ message: 'Backend test endpoint is responding!' });
});

// Mount Public/User Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/upload', uploadRoutes); // Image upload route
app.use('/api/payments', paymentRoutes); // Mount payment routes

// Mount Admin Routes
app.use('/api/admin/products', adminProductRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/admin/orders', adminOrderRoutes);
app.use('/api/admin/promotions', adminPromoRoutes);
app.use('/api/admin/messages', adminMessageRoutes);


// --- Error Handling Middleware (MUST BE LAST) ---
// Catches requests to undefined routes (404 Not Found)
app.use(notFound);
// Handles all other errors (e.g., from controllers/middleware)
app.use(errorHandler);


// --- Start Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});