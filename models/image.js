const { default: mongoose } = require("mongoose");

const imageSchema = mongoose.Schema(
  {
    file_name: {
      type: String,
      required: [true, "File name is required"],
    },
    file_url: {
      type: String,
      required: [true, "File url is required"],
    },
    tags: Array,
    category: String,
    description: String,
    size: Number,
    span: Number,
    likes: Number,
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "The image must belongs to a user"],
    },
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt fields
  }
);

const Image = mongoose.model("Image", imageSchema);

module.exports = Image;
