import { adminRoles, permissionsFor } from "../utils/adminAccess.js";
import mongoose from "mongoose";
import Admin from "../models/Admin.js";
import bcrypt from "bcrypt"; // ✅ bcrypt (NOT bcryptjs)
import jwt from "jsonwebtoken";

/* ======================
   ADMIN LOGIN
====================== */
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1️⃣ Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // 2️⃣ Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // 3️⃣ Find admin
    const admin = await Admin.findOne({ email: normalizedEmail });
    if (!admin || admin.active === false) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // 4️⃣ Compare password
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // 5️⃣ Generate JWT (🔥 SAME SECRET USED EVERYWHERE)
    const token = jwt.sign(
        {
          id: admin._id,
          email: admin.email,
          role: "admin",
          adminRole: String(admin.role || "admin").toLowerCase(),
          tokenVersion: admin.tokenVersion || 0,
          purpose: admin.mustChangePassword ? "password_change" : "admin_access",
        },
        process.env.JWT_SECRET,
        { expiresIn: admin.mustChangePassword ? "15m" : "7d" }
      );
      

    // 6️⃣ Success response
    return res.status(200).json({
      success: true,
      token,
      admin: {
        id: admin._id,
        email: admin.email,
        name: admin.name || "",
        phone: admin.phone || "",
        role: admin.role, roles: adminRoles(admin), permissions: admin.mustChangePassword ? [] : permissionsFor(admin),
        mustChangePassword: Boolean(admin.mustChangePassword),
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
