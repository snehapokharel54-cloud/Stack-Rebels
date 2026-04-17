
export const googleLogin = async (req, res) => { res.json({ success: true, message: 'Google Auth Successful', token: 'mock_jwt_token' }); };
export const facebookLogin = async (req, res) => { res.json({ success: true, message: 'Facebook Auth Successful', token: 'mock_jwt_token' }); };
export const appleLogin = async (req, res) => { res.json({ success: true, message: 'Apple Auth Successful', token: 'mock_jwt_token' }); };
      