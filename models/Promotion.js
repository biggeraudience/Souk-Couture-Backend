const mongoose = require('mongoose');

const promotionSchema = mongoose.Schema(
    {
        name: { type: String, required: true },
        type: { type: String, enum: ['banner', 'discount_code', 'flash_sale'], required: true },
        status: { type: String, enum: ['active', 'inactive', 'expired'], default: 'active' },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        details: { // Flexible field for different promo types
            discountPercentage: { type: Number, min: 0, max: 100 },
            code: { type: String, unique: true, sparse: true }, // Sparse allows null values for non-code promos
            bannerImage: { type: String }, // URL for banner promos
            // ... other specific promo details
        },
    },
    { timestamps: true }
);

const Promotion = mongoose.model('Promotion', promotionSchema);
module.exports = Promotion;
