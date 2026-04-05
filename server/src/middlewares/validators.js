import { body, validationResult } from "express-validator";
import dns from "dns";

// ─── Domain MX Validator ─────────────────────────────────────────────
/**
 * Custom express-validator function to check if an email's domain
 * actually exists and has mail servers (MX records) configured.
 */
const checkEmailDomain = async (email) => {
  const domain = email.split('@')[1];
  if (!domain) return Promise.reject("Invalid email domain.");
  
  try {
    const addresses = await dns.promises.resolveMx(domain);
    
    // RFC 7505: A null MX record (exchange: '') means the domain explicitly declines all emails!
    const isNullMx = addresses.length === 1 && addresses[0].exchange === '';
    
    if (!addresses || addresses.length === 0 || isNullMx) {
      return Promise.reject("Email domain cannot receive emails.");
    }
  } catch (error) {
    return Promise.reject("Email domain does not exist or is invalid.");
  }
  return true;
};

// ─── Validation Error Handler ────────────────────────────────────────
/**
 * Middleware that checks for validation errors and returns
 * a formatted error response if any are found.
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: formatted,
    });
  }
  next();
};

// ─── User Signup Validation ──────────────────────────────────────────
const validateUserSignup = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("A valid email is required.")
    .custom(checkEmailDomain)
    .normalizeEmail(),
  body("full_name")
    .trim()
    .notEmpty()
    .withMessage("Full name is required.")
    .isLength({ min: 2, max: 255 })
    .withMessage("Full name must be between 2 and 255 characters."),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long.")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter.")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number."),
  body("phone")
    .optional()
    .trim()
    .isMobilePhone("any")
    .withMessage("A valid phone number is required."),
  handleValidationErrors,
];

// ─── Host Signup Validation ──────────────────────────────────────────
const validateHostSignup = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("A valid email is required.")
    .custom(checkEmailDomain)
    .normalizeEmail(),
  body("full_name")
    .trim()
    .notEmpty()
    .withMessage("Full name is required.")
    .isLength({ min: 2, max: 255 })
    .withMessage("Full name must be between 2 and 255 characters."),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long.")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter.")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number."),
  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required for hosts.")
    .isMobilePhone("any")
    .withMessage("A valid phone number is required."),
  handleValidationErrors,
];

// ─── Login Validation ────────────────────────────────────────────────
const validateLogin = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("A valid email is required.")
    .normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required."),
  handleValidationErrors,
];

// ─── Forgot Password Validation ─────────────────────────────────────
const validateForgotPassword = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("A valid email is required.")
    .normalizeEmail(),
  handleValidationErrors,
];

// ─── Reset Password Validation ──────────────────────────────────────
const validateResetPassword = [
  body("token").notEmpty().withMessage("Reset token is required."),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long.")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter.")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number."),
  handleValidationErrors,
];

export {
  handleValidationErrors,
  validateUserSignup,
  validateHostSignup,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
};
