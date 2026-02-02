const mongoose = require('mongoose');


const userSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  code: { 
    type: String 
  },
  prefix: { 
    type: String 
  },
  firstname: { 
    type: String, 
    required: true 
  },
  lastname: { 
    type: String, 
    required: true 
  },
  level: { 
    type: String, 
    enum: ['admin', 'user'], 
    default: 'user' 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  isDel: { 
    type: Boolean, 
    default: false 
  }
}, { 
  timestamps: true 
});


userSchema.virtual('fullName').get(function() {
  return `${this.prefix} ${this.firstname} ${this.lastname}`;
});

module.exports = mongoose.model('User', userSchema);