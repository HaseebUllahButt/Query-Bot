import express, { Request, Response } from "express";
import { User } from "../database/models/User";
import { Session } from "../database/models/Session";

const router = express.Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    // Find valid session
    const session = await Session.findOne({
      token,
      expiresAt: { $gt: new Date() }, // Check if session is not expired
    });

    if (!session) {
      return res.status(401).json({ message: "Invalid or expired session" });
    }

    // Find user
    const user = await User.findById(session.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    res.json({
      id: user._id,
      email: user.email,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error("Me endpoint error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
