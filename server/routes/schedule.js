const express = require("express");
const multer = require("multer");
const auth = require("../middleware/authMiddleware");
const scheduleController = require("../controllers/scheduleController");
const router = express.Router();

const upload = multer({ dest: "uploads/" });

router.get("/", scheduleController.getSchedules);
router.get("/:id", scheduleController.getScheduleDetail);

router.post(
  "/",
  auth,
  upload.array("images", 5),
  scheduleController.createScheduleWithImages
);
router.put("/:id", auth, scheduleController.updateSchedule);
router.delete("/:id", auth, scheduleController.deleteSchedule);

module.exports = router;
