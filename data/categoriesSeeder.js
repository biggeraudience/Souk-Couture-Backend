const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') }); 


console.log('Attempting to load MONGODB_URI...');
if (process.env.MONGODB_URI) {
    console.log('✅ MONGODB_URI loaded successfully (first few chars):', process.env.MONGODB_URI.substring(0, 10) + '...');
} else {
    console.error('❌ MONGODB_URI is still undefined after dotenv.config()');
    console.error('Current working directory:', process.cwd());
    console.error('Resolved .env path used:', path.resolve(__dirname, '../.env'));
}



const mongoose = require('mongoose'); 
const Category = require('../models/Category'); 


const categories = [
  { name: 'Men\'s Clothing', gender: 'men', description: 'Traditional and contemporary menswear.' },
  { name: 'Men\'s Shoes', gender: 'men', description: 'Formal and casual footwear for men.' },
  { name: 'Men\'s Accessories', gender: 'men', description: 'Cufflinks, watches, and other men\'s accessories.' },
  { name: 'Men\'s Caps', gender: 'men', description: 'Traditional and modern caps for men.' },
  { name: 'Men\'s Bags', gender: 'men', description: 'Luxury and travel bags for men.' },
  { name: 'Men\'s Perfumes', gender: 'men', description: 'Fresh, aquatic, intense, and evening scents for men.' },
  { name: 'Men\'s Fabrics', gender: 'men', description: 'High-quality plain and patterned fabrics for men.' },

  { name: 'Women\'s Clothing', gender: 'women', description: 'Casual and formal abayas and other women\'s wear.' },
  { name: 'Women\'s Bags', gender: 'women', description: 'Handbags, totes, clutches, and evening bags for women.' },
  { name: 'Women\'s Shoes', gender: 'women', description: 'Heels and flats for women.' },
  { name: 'Women\'s Perfumes', gender: 'women', description: 'Floral and sweet scents for women.' },
  { name: 'Women\'s Accessories', gender: 'women', description: 'Scarves, watches, and other women\'s accessories.' },
  { name: 'Women\'s Jewelry', gender: 'women', description: 'Necklaces, earrings, and other jewelry for women.' },
  { name: 'Women\'s Fabrics', gender: 'women', description: 'Silks, satins, printed voiles, and chiffons for women.' },
  { name: 'Women\'s Veils', gender: 'women', description: 'Everyday and occasion veils for women.' },
];

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI); 
    console.log('MongoDB Connected for Seeding...');
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const importData = async () => {
  await connectDB(); 

  try {
    await Category.deleteMany({});
    console.log('Existing categories cleared.');

    await Category.insertMany(categories);
    console.log('Categories imported successfully!');
    process.exit();
  } catch (error) {
    console.error(`Error importing data: ${error.message}`);
    process.exit(1);
  }
};

const destroyData = async () => {
  await connectDB(); 

  try {
    await Category.deleteMany({});
    console.log('Categories destroyed!');
    process.exit();
  } catch (error) {
    console.error(`Error destroying data: ${error.message}`);
    process.exit(1);
  }
};

if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}