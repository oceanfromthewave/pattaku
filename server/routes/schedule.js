const express = require("express");
const multer = require("multer");
const auth = require("../middleware/authMiddleware");
const scheduleController = require("../controllers/scheduleController");
const router = express.Router();

const upload = multer({ dest: "uploads/" }); // uploads 폴더에 저장

router.post(
  "/",
  auth,
  upload.array("images", 5), // 최대 5장
  scheduleController.createScheduleWithImages
);

router.get("/", scheduleController.getSchedules);
router.get("/:id", scheduleController.getScheduleDetail);

module.exports = router;
