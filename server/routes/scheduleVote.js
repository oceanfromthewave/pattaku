const express = require("express");
const router = express.Router();
const {
  voteSchedule,
  getVotes,
} = require("../controllers/scheduleVoteController");
const auth = require("../middleware/authMiddleware");

// 투표 (등록/수정)
router.post("/:id/vote", auth, voteSchedule);

// 일정 별 투표 현황
router.get("/:id/votes", auth, getVotes);

module.exports = router;
