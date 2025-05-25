// server.js

// 1. Must come first—loads all env vars into process.env
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan'); // Adding morgan for logging requests, useful for debugging

// Assuming these are still needed and correctly implemented
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const { flutterwaveWebhookHandler } = require('./controllers/paymentController');

// Import User model to manage index cleanup (kept this as it was in your original,
// but the new version removed it - if you need it, keep it. Otherwise, remove it)
const User = require('./models/User');

// 2. Destructure and validate your critical vars
const {
  PORT = 5000, // Render provides this, fallback to 5000
  MONGODB_URI, 
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

// Guard against missing critical environment variables
if (!MONGODB_URI) {
  console.error('❌ CRITICAL ERROR: MONGODB_URI is UNDEFINED. Cannot connect to MongoDB.');
  process.exit(1); // Exit the process if the database URI is missing
}

if (!JWT_SECRET) {
  console.warn('⚠️ WARNING: JWT_SECRET not set. Authentication may be insecure.');
}

if (!FRONTEND_URL) {
  console.warn('⚠️ WARNING: FRONTEND_URL not set. CORS might be too permissive or incorrect.');
}

const app = express();

// 3. Middleware
// CORS configuration comes before other middleware if it's the first thing you want to handle.
const allowedOrigins = FRONTEND_URL ? FRONTEND_URL.split(',') : []; // Handle if FRONTEND_URL is undefined

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, Postman/Insomnia, or curl)
    // Also allow if the origin is in our allowed list
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.length === 0) {
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
app.use(morgan('dev')); // Logger for HTTP requests, useful for seeing what's happening
app.use(cookieParser()); // Parses cookies attached to the request object

// Important: Flutterwave webhook route needs raw body for signature verification.
// Place this BEFORE app.use(express.json()) for the webhook path.
app.post('/api/payments/flutterwave/webhook', express.raw({ type: 'application/json' }), flutterwaveWebhookHandler);

// Body parsers for incoming requests. These will now run AFTER the webhook handler.
app.use(express.json({ limit: '10mb' })); // Parses JSON request bodies with a larger limit
app.use(express.urlencoded({ extended: true })); // Parses URL-encoded request bodies

// 4. Configure Cloudinary (if you use it in your routes)
const cloudinary = require('cloudinary').v2;
cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

// 5. Connect to MongoDB
mongoose
  .connect(MONGODB_URI, {
    // Removed useNewUrlParser and useUnifiedTopology as they are default in Mongoose 6+
  })
  .then(() => console.log('✅ MongoDB connected successfully!'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1); // Exit the process on a critical DB connection failure
  });

// 5.a. Automatically drop the old username index once connection is open
// This was in your original code, and seems like a specific cleanup task.
// If you no longer need this, you can remove this block.
mongoose.connection.once('open', async () => {
  try {
    await User.collection.dropIndex('username_1');
    console.log('✅ Dropped stale username_1 index');
  } catch (err) {
    if (err.codeName === 'IndexNotFound') {
      console.log('⚠️  username_1 index not found—already removed');
    } else {
      console.error('❌ Error dropping username_1 index:', err);
    }
  }
});

// 6. Your routes
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


// 7. Start server
// Use the destructured PORT
app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});