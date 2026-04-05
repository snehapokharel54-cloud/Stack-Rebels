import jwt from "jsonwebtoken";

/**
 * Generic JWT verification helper.
 * @param {string} requiredRole - The role claim the token must have
 */
const verifyToken = (requiredRole) => {
  return (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
          success: false,
          message: "Access denied. No token provided.",
          errors: [],
        });
      }

      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (decoded.role !== requiredRole) {
        return res.status(403).json({
          success: false,
          message: "Access denied. Insufficient permissions.",
          errors: [],
        });
      }

      req.user = decoded;
      next();
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Token has expired. Please log in again.",
          errors: [],
        });
      }
      return res.status(401).json({
        success: false,
        message: "Invalid token.",
        errors: [],
      });
    }
  };
};

/** Verify JWT with role: "user" */
const verifyUser = verifyToken("user");

/** Verify JWT with role: "host" */
const verifyHost = verifyToken("host");

/** Verify JWT with role: "admin" */
const verifyAdmin = verifyToken("admin");

export { verifyUser, verifyHost, verifyAdmin };
