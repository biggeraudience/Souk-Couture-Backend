
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Category = require('../models/Category'); 
const Subcategory = require('../models/Subcategory'); 


const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected for Subcategory Seeding...');
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};


const dropSpecificIndex = async (collectionName, indexName) => {
  try {
   
    const collection = mongoose.connection.db.collection(collectionName);
    const indexes = await collection.indexes();

    const indexExists = indexes.some(index => index.name === indexName);

    if (indexExists) {
      await collection.dropIndex(indexName);
      console.log(`Dropped old index: '${indexName}' from collection: '${collectionName}'`);
    } else {
      console.log(`Index '${indexName}' not found on collection '${collectionName}'. No action needed.`);
    }
  } catch (error) {
 
    if (error.codeName === 'IndexNotFound') {
      console.log(`Index '${indexName}' was already removed or never existed. No action needed.`);
    } else {
      console.error(`Error dropping index '${indexName}': ${error.message}`);
 
    }
  }
};


const importData = async () => {
  await connectDB();

  try {

    await dropSpecificIndex('subcategories', 'name_1');

    await Subcategory.deleteMany({});
    console.log('Existing subcategories cleared.');

    const categories = await Category.find({});
    if (categories.length === 0) {
      console.error('No categories found. Please run the category seeder first!');
      process.exit(1);
    }

  
    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat.name] = cat._id;
    });

    const subcategoriesToInsert = [];


    const subcategoriesDefinition = {
      "Men's Clothing": [
        { name: 'Kaftan', description: 'Traditional kaftans' },
        { name: 'Thobes', description: 'Traditional Arabian thobes with a casual look and feel.' },
        { name: 'Kandoora', description: 'Traditional Arabian thobes for more formal ocassions' },
        { name: 'Agbada', description: 'Traditional African regalia for big occasions' },
        { name: 'Sets', description: 'Matching top and bottom outfits' },
      ],
      "Men's Shoes": [
        { name: 'Sandals', description: 'Open-toed footwear' }, 
        { name: 'Dress Shoes', description: 'Formal footwear' },
        { name: 'Mules', description: 'Casual footwear' },
      ],
      "Men's Accessories": [
        { name: 'Cufflinks', description: 'Decorative fasteners for shirt cuffs' },
        { name: 'Wallets', description: 'Small cases for money and cards' },
        { name: 'Watches', description: 'Time-telling devices' },
      ],
      "Men's Caps": [
        { name: 'Kufi', description: 'Traditional skullcap' },
        { name: 'Turbans', description: 'Headwear made of wrapped cloth' },
        { name: 'Baseball Caps', description: 'Casual sports caps' },
      ],
      "Men's Bags": [
        { name: 'Briefcases', description: 'Bags for carrying documents' },
        { name: 'Backpacks', description: 'Bags carried on the back' }, 
        { name: 'Travel Bags', description: 'Bags for journeys' },
      ],
      "Men's Perfumes": [
        { name: 'Oud', description: 'Fragrances based on agarwood' },
        { name: 'Musk', description: 'Earthy, animalistic scents' },
        { name: 'Amber', description: 'Warm, resinous scents' },
        { name: 'Fresh Scents', description: 'Clean and invigorating aromas' },
      ],
      "Men's Fabrics": [
        { name: 'Plain Wool & Cotton', description: 'Solid colored wool and cotton fabrics' },
        { name: 'Patterned Weaves', description: 'Fabrics with intricate patterns' },
        { name: 'Linen Blends', description: 'Lightweight and breathable fabrics' },
      ],

      "Women's Clothing": [
        { name: 'Formal Abayas', description: 'Elegant abayas for special occasions' },
        { name: 'Casual Abayas', description: 'Everyday comfortable abayas' },
        { name: 'Open Abayas', description: 'Abayas designed to be worn open' },
        { name: 'Dresses', description: 'Various styles of women\'s dresses' },
        { name: 'Tunics', description: 'Long tops or short dresses' },
        { name: 'Jumpsuits & Rompers', description: 'One-piece outfits' },
      ],
      "Women's Bags": [
        { name: 'Handbags', description: 'Everyday bags for women' },
        { name: 'Clutches', description: 'Small, strapless bags' },
        { name: 'Totes', description: 'Large, open-top bags' },
        { name: 'Evening Bags', description: 'Bags for formal events' },
        { name: 'Backpacks', description: 'Bags carried on the back' }, 
      ],
      "Women's Shoes": [
        { name: 'Heels', description: 'Footwear with elevated heels' },
        { name: 'Flats', description: 'Comfortable flat-soled shoes' },
        { name: 'Sandals', description: 'Open-toed footwear' }, 
        { name: 'Mules', description: 'Open-heeled casual shoes' },
      ],
      "Women's Perfumes": [
        { name: 'Floral Scents', description: 'Fragrances with flower notes' },
        { name: 'Sweet Scents', description: 'Gourmand and sugary perfumes' },
        { name: 'Oriental Scents', description: 'Spicy and warm perfumes' },
        { name: 'Musk', description: 'Earthy, animalistic scents' },
        { name: 'Oud', description: 'Fragrances based on agarwood' },
      ],
      "Women's Accessories": [
        { name: 'Scarves', description: 'Decorative neckwear' },
        { name: 'Belts', description: 'Strips of material worn around the waist' },
        { name: 'Wallets', description: 'Small cases for money and cards' },
        { name: 'Hats', description: 'Headwear for various occasions' },
      ],
      "Women's Jewelry": [
        { name: 'Necklaces', description: 'Ornaments worn around the neck' },
        { name: 'Earrings', description: 'Ornaments worn on the ears' },
        { name: 'Bracelets', description: 'Ornaments worn on the wrist' },
        { name: 'Rings', description: 'Ornaments worn on the fingers' },
      ],
      "Women's Fabrics": [
        { name: 'Silks & Satins', description: 'Smooth, lustrous fabrics' },
        { name: 'Printed Voiles & Chiffons', description: 'Light, sheer, printed fabrics' },
        { name: 'Lace & Embroidery', description: 'Delicate decorative fabrics' },
      ],
      "Women's Veils": [
        { name: 'Hijabs', description: 'Headscarves worn by Muslim women' },
        { name: 'Niqabs', description: 'Face veils worn by some Muslim women' },
        { name: 'Shawls', description: 'Large wraps worn over the head or shoulders' },
      ],
    };

    for (const categoryName in subcategoriesDefinition) {
      if (categoryMap[categoryName]) {
        const categoryId = categoryMap[categoryName];
        const subcategories = subcategoriesDefinition[categoryName];

  
        const operations = subcategories.map(sub => {
          return Subcategory.updateOne(
            { name: sub.name, category: categoryId }, 
            { $set: { name: sub.name, description: sub.description, category: categoryId } }, 
            { upsert: true, new: true, setDefaultsOnInsert: true } 
          );
        });

        await Promise.all(operations);
        console.log(`Subcategories for "${categoryName}" processed.`);

      } else {
        console.warn(`Category "${categoryName}" not found. Skipping subcategories for this category.`);
      }
    }

    console.log('Subcategories imported successfully!');
    process.exit();
  } catch (error) {
    console.error(`Error importing subcategory data: ${error.message}`);
    process.exit(1);
  }
};

const destroyData = async () => {
  await connectDB();
  try {
    await Subcategory.deleteMany({});
    console.log('Subcategories destroyed!');
    process.exit();
  } catch (error) {
    console.error(`Error destroying subcategory data: ${error.message}`);
    process.exit(1);
  }
};

if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}