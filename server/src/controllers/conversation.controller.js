
export const startConversation = async (req, res) => { res.json({ success: true, id: 'mock-conv' }); };
export const getConversations = async (req, res) => { res.json({ success: true, data: [] }); };
export const getMessages = async (req, res) => { res.json({ success: true, data: [] }); };
export const sendMessage = async (req, res) => { res.json({ success: true, message: 'Message sent' }); };
      