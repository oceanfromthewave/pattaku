const express = require("express");
const multer = require("multer");
const path = require("path");
const auth = require("../middleware/authMiddleware");
const scheduleController = require("../controllers/scheduleController");
const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    // 확장자 강제 처리
    let ext = path.extname(file.originalname);
    if (!ext) ext = ".jpg"; // 기본 jpg 처리
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});
const upload = multer({ storage });

router.get("/", scheduleController.getSchedules);
router.get("/:id", scheduleController.getScheduleDetail);

router.post(
  "/",
  auth,
  upload.array("images", 5),
  scheduleController.createScheduleWithImages
);
router.put(
  "/:id",
  auth,
  upload.array("images", 5),
  scheduleController.updateSchedule
);
router.delete("/:id", auth, scheduleController.deleteSchedule);

module.exports = router;
