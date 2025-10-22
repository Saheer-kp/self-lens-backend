const express = require("express");
const router = express.Router();
const imageController = require("../controllers/imageController");
const { authenticateToken } = require("../middlewares/authMiddleware");

// Upload images (protected)
router.post(
  "/image-upload",
  authenticateToken,
  imageController.uploadImage,
  imageController.imageUpload
);

// Get images (public and authed users)
router.get("/", imageController.getImages);

// Like/unlike image (protected)
router.post("/:id/likeUnlike", authenticateToken, imageController.likeUnlike);

module.exports = router;
