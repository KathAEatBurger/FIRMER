const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  labnumber: [String],
  timestamp: { type: Date, default: Date.now },
  request: { method: String, endpoint: String },
  response: { statusCode: String, message: String, timeMs: Number },
  action: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Log', logSchema);