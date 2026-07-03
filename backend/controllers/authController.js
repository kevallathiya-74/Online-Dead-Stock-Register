require("dotenv").config();
const getSupabase = require("../config/db");
const { hashPassword, comparePassword } = require("../utils/passwordHelper");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const emailService = require("../utils/emailService");
const logger = require("../utils/logger");

// Password validation - matches express-validator pattern
const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[@$!%*?&]/.test(password);

  return (
    password.length >= minLength &&
    hasUpperCase &&
    hasLowerCase &&
    hasNumbers &&
    hasSpecialChar
  );
};

exports.signup = async (req, res) => {
  try {
    const {
      full_name,
      username,
      email,
      password,
      department,
      role = "AUDITOR",
    } = req.body;

    const supabase = getSupabase();

    // Use full_name if available, otherwise fall back to username
    const name = full_name || username;

    // Map frontend role values to backend enum values
    const roleMap = {
      ADMIN: "ADMIN",
      INVENTORY_MANAGER: "INVENTORY_MANAGER",
      AUDITOR: "AUDITOR",
      VENDOR: "VENDOR",
    };

    const mappedRole = roleMap[role.toUpperCase()] || "AUDITOR";

    // Validate required fields
    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }
    if (!validatePassword(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters long and contain uppercase, lowercase, numbers and special characters",
      });
    }
    if (
      !department ||
      !["INVENTORY", "IT", "ADMIN"].includes(department.toUpperCase())
    ) {
      return res
        .status(400)
        .json({ message: "Department must be one of: INVENTORY, IT, ADMIN" });
    }

    // Convert department to uppercase to match enum
    const normalizedDepartment = department.toUpperCase();

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Hash password
    const hashed = await hashPassword(password);

    const userData = {
      name: name,
      email,
      password: hashed,
      department: normalizedDepartment,
      role: mappedRole,
      employee_id: `EMP-${Date.now()}`,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    // Create user
    const { data: saved, error } = await supabase
      .from("users")
      .insert([userData])
      .select()
      .single();

    if (error) {
      logger.error("Error creating user:", error);
      return res.status(500).json({ message: error.message });
    }

    // Send welcome email (non-blocking - don't wait for it)
    emailService.sendWelcomeEmail(saved.email, saved.name).catch((err) => {
      logger.error("❌ Error sending welcome email:", err);
    });

    // Generate JWT token
    const token = jwt.sign(
      {
        id: saved.id,
        email: saved.email,
        role: saved.role,
        vendor_id: saved.vendor_id || null,
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" },
    );

    res.status(201).json({
      user: {
        id: saved.id,
        email: saved.email,
        role: saved.role,
        name: saved.name,
        full_name: saved.name,
        department: saved.department,
      },
      token,
    });
  } catch (err) {
    logger.error("Signup error", { error: err.message });
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    logger.info("Login attempt", { email: req.body.email });

    const { email, password } = req.body;
    const supabase = getSupabase();

    if (!email || !password) {
      logger.warn("Login failed: Missing credentials");
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // Find user
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !user) {
      logger.warn("Login failed: User not found", { email });
      return res.status(400).json({ message: "Invalid credentials" });
    }

    logger.debug("User found", {
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Verify password
    const valid = await comparePassword(password, user.password);

    if (!valid) {
      logger.warn("Login failed: Invalid password", { email });
      return res.status(400).json({ message: "Invalid credentials" });
    }

    logger.debug("Password verified for user", { email });

    // Update last login
    await supabase
      .from("users")
      .update({ last_login: new Date().toISOString() })
      .eq("id", user.id);

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        vendor_id: user.vendor_id || null,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
    );

    logger.info("User logged in successfully", {
      userId: user.id,
      email: user.email,
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        full_name: user.name,
        department: user.department,
      },
      token,
    });
  } catch (err) {
    logger.error("❌ Login error:", {
      message: err.message,
      stack: err.stack,
      name: err.name,
    });
    res
      .status(500)
      .json({ message: "Server error during login. Please try again." });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const supabase = getSupabase();

    // Find user by email
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !user) {
      return res
        .status(404)
        .json({ message: "No account found with this email" });
    }

    // Generate reset token (unhashed for email)
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    // Hash token before storing in database
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Save HASHED token to database
    await supabase
      .from("users")
      .update({
        reset_password_token: hashedToken,
        reset_password_expires: resetTokenExpiry.toISOString(),
      })
      .eq("id", user.id);

    // Send UNHASHED token via email
    await emailService.sendPasswordResetEmail(user.email, resetToken);

    res.json({
      message:
        "If an account exists with this email, password reset instructions have been sent.",
    });
  } catch (error) {
    logger.error("Forgot password error", { error: error.message });
    res.status(500).json({ message: "Error processing password reset" });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const supabase = getSupabase();

    if (!token || !newPassword) {
      return res
        .status(400)
        .json({ message: "Token and new password are required" });
    }

    // Hash the incoming token to compare with stored hash
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find user with hashed token and unexpired token
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("reset_password_token", hashedToken)
      .gt("reset_password_expires", new Date().toISOString())
      .single();

    if (error || !user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token" });
    }

    // Validate new password
    if (!validatePassword(newPassword)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters and contain uppercase, lowercase, numbers and special characters",
      });
    }

    // Ensure new password is different from current
    const isSamePassword = await comparePassword(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({
        message: "New password must be different from current password",
      });
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update user password and clear reset token
    await supabase
      .from("users")
      .update({
        password: hashedPassword,
        reset_password_token: null,
        reset_password_expires: null,
      })
      .eq("id", user.id);

    // Send confirmation email
    await emailService.sendPasswordChangeConfirmationEmail(user.email);

    res.json({ message: "Password has been reset successfully" });
  } catch (error) {
    logger.error("Reset password error", { error: error.message });
    res.status(500).json({ message: "Error resetting password" });
  }
};

exports.verifyResetToken = async (req, res) => {
  try {
    const { token } = req.params;
    const supabase = getSupabase();

    const { data: user, error } = await supabase
      .from("users")
      .select("id")
      .eq("reset_password_token", token)
      .gt("reset_password_expires", new Date().toISOString())
      .single();

    res.json({ valid: Boolean(user && !error) });
  } catch (error) {
    logger.error("Verify token error", { error: error.message });
    res.status(500).json({ message: "Error verifying reset token" });
  }
};
