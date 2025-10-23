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
router.get(
  "/",
  (req, res, next) => {
    // Check if authorization header exists
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      // Use authentication middleware
      authenticateToken(req, res, next);
    } else {
      // Skip to controller without user data
      req.user = null;
      next();
    }
  },
  imageController.getImages
);

// Like/unlike image (protected)
router.post("/:id/likeUnlike", authenticateToken, imageController.likeUnlike);

module.exports = router;
