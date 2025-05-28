require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const { flutterwaveWebhookHandler } = require('./controllers/paymentController');
const User = require('./models/User');

const {
  PORT = 5000, 
  MONGODB_URI, 
  JWT_SECRET,
  FRONTEND_URL,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
 
} = process.env;

if (!MONGODB_URI) {
  console.error('❌ CRITICAL ERROR: MONGODB_URI is UNDEFINED. Cannot connect to MongoDB.');
  process.exit(1);
}

if (!JWT_SECRET) {
  console.warn('⚠️ WARNING: JWT_SECRET not set. Authentication may be insecure.');
}

if (!FRONTEND_URL) {
  console.warn('⚠️ WARNING: FRONTEND_URL not set. CORS might be too permissive or incorrect.');
}

const app = express();

const allowedOrigins = FRONTEND_URL ? FRONTEND_URL.split(',') : []; 

const corsOptions = {
  origin: (origin, callback) => {
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
app.use(morgan('dev')); 
app.use(cookieParser()); 

app.post('/api/payments/flutterwave/webhook', express.raw({ type: 'application/json' }), flutterwaveWebhookHandler);

app.use(express.json({ limit: '10mb' })); 
app.use(express.urlencoded({ extended: true })); 

const cloudinary = require('cloudinary').v2;
cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

mongoose
  .connect(MONGODB_URI, {
  })
  .then(() => console.log('✅ MongoDB connected successfully!'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1); 
  });
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

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const uploadRoutes = require('./routes/uploadRoutes'); 
const paymentRoutes = require('./routes/paymentRoutes'); 
const adminProductRoutes = require('./routes/admin/adminProductRoutes');
const adminUserRoutes = require('./routes/admin/adminUserRoutes');
const adminOrderRoutes = require('./routes/admin/adminOrderRoutes');
const adminPromoRoutes = require('./routes/admin/adminPromoRoutes');
const adminMessageRoutes = require('./routes/admin/adminMessageRoutes');
const subcategoryRoutes = require('./routes/subcategoryRoutes');
app.get('/', (req, res) => {
  res.send('Souk Couture Backend API is running!');
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend test endpoint is responding!' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/subcategories', subcategoryRoutes); 
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/upload', uploadRoutes); 
app.use('/api/payments', paymentRoutes); 
app.use('/api/admin/products', adminProductRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/admin/orders', adminOrderRoutes);
app.use('/api/admin/promotions', adminPromoRoutes);
app.use('/api/admin/messages', adminMessageRoutes);
app.use(notFound);
app.use(errorHandler);
app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});