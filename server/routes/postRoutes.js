const express = require("express");
const router = express.Router();
const postController = require("../controllers/postController");
const authMiddleware = require("../middleware/authMiddleware");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

router.get("/", postController.getAllPosts);
router.get("/:id", postController.getPostById);
router.post(
  "/",
  authMiddleware,
  upload.array("files"),
  postController.createPost
);
router.put("/:id", authMiddleware, postController.updatePost);
router.delete("/:id", authMiddleware, postController.deletePost);

module.exports = router;
