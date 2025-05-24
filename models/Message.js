const mongoose = require('mongoose');

const messageSchema = mongoose.Schema(
    {
        senderName: { type: String, required: true },
        senderEmail: { type: String, required: true },
        subject: { type: String, required: true },
        messageBody: { type: String, required: true },
        status: { type: String, enum: ['new', 'read', 'replied', 'archived'], default: 'new' },
        replyMessage: { type: String }, // For admin replies
        repliedAt: { type: Date },
    },
    { timestamps: true }
);

const Message = mongoose.model('Message', messageSchema);
module.exports = Message;
