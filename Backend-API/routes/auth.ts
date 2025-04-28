import express, { Request, Response } from "express";
import { User } from "../database/models/User";
import { Session } from "../database/models/Session";
import crypto from "crypto";

const router = express.Router();

interface SignupBody {
  email: string;
  password: string;
}

interface LoginBody {
  email: string;
  password: string;
}

// Signup route
router.post(
  "/signup",
  async (req: Request<{}, {}, SignupBody>, res: Response) => {
    try {
      const { email, password } = req.body;
      console.log("Signup request:", { email });

      // Validate input
      if (!email || !password) {
        return res
          .status(400)
          .json({ message: "Email and password are required" });
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Create new user
      const user = new User({ email, password });
      await user.save();

      // Generate session token
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

      // Create session
      const session = new Session({
        userId: user._id,
        token,
        expiresAt,
      });
      await session.save();

      res.status(201).json({
        token,
        user: {
          id: user._id,
          email: user.email,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Login route
router.post(
  "/login",
  async (req: Request<{}, {}, LoginBody>, res: Response) => {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Check password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Generate session token
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

      // Create session
      const session = new Session({
        userId: user._id,
        token,
        expiresAt,
      });
      await session.save();

      res.json({
        token,
        user: {
          id: user._id,
          email: user.email,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Logout route
router.post("/logout", async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (token) {
      await Session.deleteOne({ token });
    }
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
