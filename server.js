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

// Import User model to manage index cleanup
const User = require('./models/User');

// 2. Destructure & validate critical environment variables.
const {
  PORT = 5000,
  MONGODB_URI, // MongoDB connection string
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

// Critical checks: exit if essential variables are missing
if (!MONGODB_URI) {
  console.error('❌ CRITICAL ERROR: MONGODB_URI is UNDEFINED. Cannot connect to MongoDB.');
  process.exit(1);
}

if (!JWT_SECRET) console.warn('⚠️ WARNING: JWT_SECRET is not set. Authentication may be insecure.');
if (!FRONTEND_URL) console.warn('⚠️ WARNING: FRONTEND_URL is not set. CORS might be too permissive.');

const app = express();

// 3. Middleware Setup (Order matters!)
const allowedOrigins = FRONTEND_URL ? FRONTEND_URL.split(',') : [];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.length === 0) {
      callback(null, true);
    } else {
      callback(new Error(`Not allowed by CORS: ${origin}`));
    }
  },
  credentials: true,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: 'Content-Type,Authorization',
}));
app.use(morgan('dev'));
app.use(cookieParser());

// Flutterwave webhook route needs raw body BEFORE json parser
app.post(
  '/api/payments/flutterwave/webhook',
  express.raw({ type: 'application/json' }),
  flutterwaveWebhookHandler
);

// Body parsers for all other requests
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 4. Configure Cloudinary
const cloudinary = require('cloudinary').v2;
cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

// 5. Connect to MongoDB using Mongoose
mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('✅ MongoDB connected successfully!'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

// 5.a. Automatically drop the old username index once connection is open
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

// Admin Routes
const adminBase = './routes/admin/';
app.use('/api/admin/products', require(`${adminBase}adminProductRoutes`));
app.use('/api/admin/users', require(`${adminBase}adminUserRoutes`));
app.use('/api/admin/orders', require(`${adminBase}adminOrderRoutes`));
app.use('/api/admin/promotions', require(`${adminBase}adminPromoRoutes`));
app.use('/api/admin/messages', require(`${adminBase}adminMessageRoutes`));

// 7. Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

// 8. Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
