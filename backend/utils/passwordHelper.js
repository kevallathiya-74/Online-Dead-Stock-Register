const bcrypt = require("bcryptjs");
const crypto = require("crypto");

/**
 * Password utility functions to eliminate duplication across controllers
 */

// Salt rounds for bcrypt hashing (consistent across application)
const SALT_ROUNDS = 10;

/**
 * Hash a password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
exports.hashPassword = async (password) => {
  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    return await bcrypt.hash(password, salt);
  } catch (error) {
    throw new Error("Error hashing password: " + error.message);
  }
};

/**
 * Compare a plain text password with a hashed password
 * @param {string} plainPassword - Plain text password
 * @param {string} hashedPassword - Hashed password from database
 * @returns {Promise<boolean>} True if passwords match
 */
exports.comparePassword = async (plainPassword, hashedPassword) => {
  try {
    return await bcrypt.compare(plainPassword, hashedPassword);
  } catch (error) {
    throw new Error("Error comparing passwords: " + error.message);
  }
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} Validation result with valid flag and message
 */
exports.validatePasswordStrength = (password) => {
  if (!password || password.length < 8) {
    return {
      valid: false,
      message: "Password must be at least 8 characters long",
    };
  }

  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one uppercase letter",
    };
  }

  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one lowercase letter",
    };
  }

  // Check for at least one number
  if (!/[0-9]/.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one number",
    };
  }

  return {
    valid: true,
    message: "Password is strong",
  };
};

/**
 * Generate a random password using cryptographically secure random values
 * @param {number} length - Length of password (default: 12)
 * @returns {string} Random password
 */
exports.generateRandomPassword = (length = 12) => {
  const uppercaseChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercaseChars = "abcdefghijklmnopqrstuvwxyz";
  const numberChars = "0123456789";
  const specialChars = "!@#$%^&*";
  const allChars = uppercaseChars + lowercaseChars + numberChars + specialChars;

  if (length < 4) {
    throw new Error("Password length must be at least 4 characters");
  }

  // Use crypto.randomInt for cryptographically secure random selection
  const getRandomChar = (chars) => {
    const randomIndex = crypto.randomInt(0, chars.length);
    return chars[randomIndex];
  };

  // Ensure at least one of each required character type
  let password = "";
  password += getRandomChar(uppercaseChars);
  password += getRandomChar(lowercaseChars);
  password += getRandomChar(numberChars);
  password += getRandomChar(specialChars);

  // Fill the rest with random characters from all character sets
  for (let i = password.length; i < length; i++) {
    password += getRandomChar(allChars);
  }

  // Shuffle the password using Fisher-Yates algorithm with crypto random
  const passwordArray = password.split("");
  for (let i = passwordArray.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [passwordArray[i], passwordArray[j]] = [passwordArray[j], passwordArray[i]];
  }

  return passwordArray.join("");
};
