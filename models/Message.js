const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
         userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
         username: { type: String, required: true },
         message: { type: String, required: true },
         timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Message', messageSchema);
