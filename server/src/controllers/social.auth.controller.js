/**
 * Social Auth Controller — placeholder stubs
 * These will be implemented when OAuth providers are configured.
 */

export const googleLogin = async (req, res) => {
  res.status(501).json({
    success: false,
    message: "Google login is not yet implemented. Coming soon!",
  });
};

export const facebookLogin = async (req, res) => {
  res.status(501).json({
    success: false,
    message: "Facebook login is not yet implemented. Coming soon!",
  });
};

export const appleLogin = async (req, res) => {
  res.status(501).json({
    success: false,
    message: "Apple login is not yet implemented. Coming soon!",
  });
};
