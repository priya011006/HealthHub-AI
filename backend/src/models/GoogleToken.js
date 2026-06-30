const mongoose = require('mongoose');

const googleTokenSchema = new mongoose.Schema(
  {
    ownerId: {
      type: String, // e.g. "system" or Doctor User ID
      required: true,
      unique: true,
    },
    accessToken: {
      type: String,
      required: true,
    },
    refreshToken: {
      type: String,
      required: true,
    },
    expiryDate: {
      type: Number, // Epoch timestamp in ms
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('GoogleToken', googleTokenSchema);
