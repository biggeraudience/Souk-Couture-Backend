const mongoose = require('mongoose');

const promotionSchema = mongoose.Schema(
    {
        name: { type: String, required: true },
        type: { type: String, enum: ['banner', 'discount_code', 'flash_sale'], required: true },
        status: { type: String, enum: ['active', 'inactive', 'expired'], default: 'active' },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        details: { 
            discountPercentage: { type: Number, min: 0, max: 100 },
            code: { type: String, unique: true, sparse: true }, 
            bannerImage: { type: String },
            
        },
    },
    { timestamps: true }
);

const Promotion = mongoose.model('Promotion', promotionSchema);
module.exports = Promotion;
