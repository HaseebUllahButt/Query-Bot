import express from "express";
const router = express.Router();

// TODO: Implement schema routes
router.get("/", (req, res) => {
  res.json({ message: "Schema routes will be implemented here" });
});

export default router;
