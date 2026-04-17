
export const getEarnings = async (req, res) => { res.json({ success: true, data: { total: 5000, upcoming: 1200 } }); };
export const requestPayout = async (req, res) => { res.json({ success: true, message: 'Payout requested' }); };
export const getPayoutHistory = async (req, res) => { res.json({ success: true, data: [] }); };
export const setupBankAccount = async (req, res) => { res.json({ success: true, message: 'Bank connected' }); };
export const getBankAccount = async (req, res) => { res.json({ success: true, data: { accountEndsWith: '1234' } }); };
      