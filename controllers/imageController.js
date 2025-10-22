const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { imageSize } = require("image-size");
const { imageSizeFromFile } = require("image-size/fromFile");

const { successResponse, errorResponse } = require("../utils/response");
const Image = require("../models/image");
const AppError = require("../utils/appError");
const Like = require("../models/Like");
const { default: mongoose } = require("mongoose");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = "public/uploads/images/";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const fileExtension = path.extname(file.originalname);
    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2)}${fileExtension}`;
    cb(null, fileName);
  },
});

// File filter for validation
const fileFilter = (req, file, cb) => {
  // Check file type
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new AppError("Only image files are allowed!", 422));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 3, // Maximum 3 files
  },
  fileFilter: fileFilter,
});

exports.uploadImage = upload.array("images");

exports.imageUpload = async (req, res) => {
  //   console.log(111);

  try {
    const files = req.files;
    const metadata = JSON.parse(req.body.metadata);
    const category = req.body.category;

    const uploadResults = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileMetadata = metadata[i];

      // URL will be relative to your public folder
      const publicUrl = `/uploads/images/${file.filename}`;

      // const dimensions = imageSize(file);
      const dimensions = await imageSizeFromFile(file.path);

      const span = calculateImageSpan(dimensions);

      await Image.create({
        file_name: file.filename,
        file_url: publicUrl,
        tags: fileMetadata.tags,
        category: category,
        size: file.size,
        description: fileMetadata.description,
        span: span,
        user: req.user.id,
      });
    }

    successResponse(res, `${files.length} images uploaded successfully`);
  } catch (error) {
    console.error("Upload error:", error);

    // Clean up on error
    if (req.files) {
      req.files.forEach((file) => {
        fs.unlink(file.path, (err) => {
          if (err) console.error("Error deleting file:", err);
        });
      });
    }

    errorResponse(res, "Something went wrong while upload");
  }
};

function calculateImageSpan(dimensions) {
  let span = 20; //default
  if (dimensions && dimensions.width && dimensions.height) {
    aspectRatio = dimensions.width / dimensions.height;

    // Calculate span based on aspect ratio
    const baseSpan = Math.round(20 / aspectRatio);
    const randomVariation = Math.floor(Math.random() * 4) - 2; // -2 to +2
    // span = Math.max(14, Math.min(26, baseSpan + randomVariation));
    span = baseSpan - 5;
  }

  return span;
}

// In your backend routes
// exports.getImages = async (req, res) => {
//   try {
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 5;
//     const search = req.query.search || "";
//     const category = req.query.category || "";

//     const skip = (page - 1) * limit;

//     // Build query
//     let query = {};

//     if (search) {
//       query.$or = [
//         { description: { $regex: search, $options: "i" } },
//         { category: { $regex: search, $options: "i" } },
//         { tags: { $regex: search, $options: "i" } },
//       ];
//     }

//     if (category) {
//       query.category = category;
//     }

//     const images = await Image.find(query)
//       .populate("user", "name avatar")
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(limit);

//     const total = await Image.countDocuments(query);
//     const hasMore = skip + images.length < total;

//     successResponse(res, "sucess", {
//       images,
//       currentPage: page,
//       totalPages: Math.ceil(total / limit),
//       hasMore,
//     });
//   } catch (error) {
//     console.error("Error fetching images:", error);
//     errorResponse(res, "Failed to fetch images");
//   }
// };

exports.getImages = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const search = req.query.search || "";
    const category = req.query.category || "";
    const userId = req.user?.id;

    const skip = (page - 1) * limit;

    // Build match stage
    let matchStage = {};

    if (search) {
      matchStage.$or = [
        { description: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } },
      ];
    }

    if (category) {
      matchStage.category = category;
    }

    // Aggregation pipeline
    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user",
          pipeline: [{ $project: { name: 1, avatar: 1 } }],
        },
      },
      { $unwind: "$user" },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ];

    // Add like check if user is authenticated
    if (userId) {
      pipeline.push({
        $lookup: {
          from: "likes",
          let: { imageId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$image", "$$imageId"] },
                    { $eq: ["$user", new mongoose.Types.ObjectId(userId)] },
                  ],
                },
              },
            },
          ],
          as: "userLike",
        },
      });

      pipeline.push({
        $addFields: {
          is_liked: { $gt: [{ $size: "$userLike" }, 0] },
        },
      });

      pipeline.push({
        $project: {
          userLike: 0, // Remove the temporary field
        },
      });
    } else {
      // For non-authenticated users
      pipeline.push({
        $addFields: {
          is_liked: false,
        },
      });
    }

    // Execute aggregation
    const images = await Image.aggregate(pipeline);

    // Get total count
    const total = await Image.countDocuments(matchStage);
    const hasMore = skip + images.length < total;

    successResponse(res, "success", {
      images,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      hasMore,
    });
  } catch (error) {
    console.error("Error fetching images:", error);
    errorResponse(res, "Failed to fetch images");
  }
};

exports.likeUnlike = async (req, res, next) => {
  try {
    const imageId = req.params.id;
    const userId = req.user.id;

    // Check if image exists
    const image = await Image.findById(imageId);
    if (!image) {
      return next(new AppError("Image not found", 404));
    }

    // Check if already liked
    const existingLike = await Like.findOne({
      image: imageId,
      user: userId,
    });

    if (!req.body.is_liked && existingLike) {
      // Create like
      await Like.findOneAndDelete({
        image: imageId,
        user: userId,
      });

      // Update image likes count
      await Image.findByIdAndUpdate(imageId, {
        $inc: { likes: -1 },
      });
    } else {
      // Create like
      await Like.create({
        image: imageId,
        user: userId,
      });

      // Update image likes count
      await Image.findByIdAndUpdate(imageId, {
        $inc: { likes: 1 },
      });
    }

    res.status(200).json({
      status: "success",
      message: "Image liked successfully",
    });
  } catch (error) {
    next(new AppError("Failed", 500, error));
    errorResponse(res, "Failed");
  }
};
