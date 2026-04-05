/**
 * Host Property Verification Controller
 * Handles host account verification and property document submission
 */

export const submitPropertyVerification = async (req, res) => {
  try {
    res.json({ success: true, message: "Property verification submitted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getPropertyVerificationStatus = async (req, res) => {
  try {
    res.json({ success: true, data: { status: "verified" } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
