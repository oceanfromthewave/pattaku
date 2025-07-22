const express = require("express");
const router = express.Router();
const postController = require("../controllers/postController");
const authMiddleware = require("../middleware/authMiddleware");
const multer = require("multer");
const upload = require("../middleware/upload"); // 위에서 만든 upload.js

router.get("/", postController.getAllPosts);
router.get("/:id", postController.getPostById);
router.post(
  "/",
  authMiddleware,
  upload.array("files"),
  postController.createPost
);
router.delete("/:id", authMiddleware, postController.deletePost);
router.put(
  "/:id",
  authMiddleware,
  upload.array("files"),
  postController.updatePost
);
router.post("/:id/like", authMiddleware, postController.likePost);
router.post("/:id/dislike", authMiddleware, postController.dislikePost);

module.exports = router;
