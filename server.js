// server.js

// 1. Load env vars immediately and at the very top.
// This ensures process.env is populated before any other code tries to access them.
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose'); // Mongoose is needed for database connection
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan'); // HTTP request logger

// Error middleware & controllers
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const { flutterwaveWebhookHandler } = require('./controllers/paymentController');

// 2. Destructure & validate critical environment variables.
// Use MONGODB_URI to match common naming conventions and potentially your Render setup.
const {
  PORT = 5000,
  MONGODB_URI, // <--- Using MONGODB_URI as per the suggestion
  JWT_SECRET,
  FRONTEND_URL,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  FLUTTERWAVE_PUBLIC_KEY,
  FLUTTERWAVE_SECRET_KEY,
  FLUTTERWAVE_ENCRYPTION_KEY,
  FLUTTERWAVE_WEBHOOK_SECRET_HASH,
  RESEND_API_KEY,
  RESEND_SENDER_EMAIL
} = process.env;

// Critical checks: exit if essential environment variables are missing
if (!MONGODB_URI) {
  console.error('❌ CRITICAL ERROR: MONGODB_URI is UNDEFINED. Cannot connect to MongoDB. Please set it in your Render environment variables.');
  process.exit(1);
}

// Warnings for non-critical but important variables
if (!JWT_SECRET) {
  console.warn('⚠️ WARNING: JWT_SECRET is not set. Authentication tokens may be insecure.');
}

if (!FRONTEND_URL) {
  console.warn('⚠️ WARNING: FRONTEND_URL is not set. CORS might be too permissive or incorrect for your frontend.');
}

const app = express();

// 3. Middleware Setup (Order matters!)

// CORS configuration - Allow access from your frontend
const allowedOrigins = FRONTEND_URL ? FRONTEND_URL.split(',') : []; // Handle undefined FRONTEND_URL gracefully
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, Postman/Insomnia)
    // Also allow if the origin is in our allowed list, or if no specific origins are defined
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.length === 0) {
      callback(null, true);
    } else {
      callback(new Error(`Not allowed by CORS: ${origin}`));
    }
  },
  credentials: true, // Allow cookies to be sent
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: 'Content-Type,Authorization',
}));

app.use(morgan('dev')); // Log HTTP requests to the console (development format)
app.use(cookieParser()); // Parse cookies from incoming requests

// Important: Flutterwave webhook route needs raw body for signature verification.
// This must come BEFORE app.use(express.json()) for this specific path.
app.post(
  '/api/payments/flutterwave/webhook',
  express.raw({ type: 'application/json' }),
  flutterwaveWebhookHandler
);

// Body parsers for all other incoming requests
app.use(express.json({ limit: '10mb' })); // Parse JSON request bodies, allow larger payloads
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request bodies

// 4. Configure Cloudinary (if you use it for file uploads)
const cloudinary = require('cloudinary').v2; // Ensure cloudinary package is installed (npm install cloudinary)
cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

// 5. Connect to MongoDB using Mongoose
// The connection logic is now directly in server.js for better control and error handling.
// If you had a separate `config/db.js` file with just this connection, you can remove it.
mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,    // Recommended for Mongoose 5.x+
    useUnifiedTopology: true, // Recommended for Mongoose 5.x+
  })
  .then(() => console.log('✅ MongoDB connected successfully!'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1); // Exit the application if DB connection fails
  });

// 6. Define and Mount API Routes
app.get('/', (req, res) => {
  res.send('Souk Couture Backend API is running!');
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend test endpoint is responding!' });
});

// Public/User Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/cart', require('./routes/cartRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/favorites', require('./routes/favoriteRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));

// Admin Routes (group them under /api/admin)
const adminBaseRoutesPath = './routes/admin/'; // Helper for cleaner pathing
app.use('/api/admin/products', require(`${adminBaseRoutesPath}adminProductRoutes`));
app.use('/api/admin/users', require(`${adminBaseRoutesPath}adminUserRoutes`));
app.use('/api/admin/orders', require(`${adminBaseRoutesPath}adminOrderRoutes`));
app.use('/api/admin/promotions', require(`${adminBaseRoutesPath}adminPromoRoutes`));
app.use('/api/admin/messages', require(`${adminBaseRoutesPath}adminMessageRoutes`));

// 7. Error Handling Middleware (MUST BE LAST)
// These catch errors from previous middleware and routes.
app.use(notFound); // Catches 404s (requests to unhandled routes)
app.use(errorHandler); // Catches all other errors

// 8. Start Server
// The PORT is picked from process.env.PORT (provided by Render) or defaults to 5000.
app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});