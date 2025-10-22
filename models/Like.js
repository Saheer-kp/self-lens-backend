const mongoose = require("mongoose");

const likeSchema = new mongoose.Schema(
  {
    image: {
      type: mongoose.Schema.ObjectId,
      ref: "Image",
      required: true,
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate likes
likeSchema.index({ image: 1, user: 1 }, { unique: true });

module.exports = mongoose.model("Like", likeSchema);
