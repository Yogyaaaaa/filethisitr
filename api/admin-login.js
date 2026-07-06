module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { password } = req.body;

    if (!password || password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    const crypto = require('crypto');
    const token = crypto
      .createHmac('sha256', process.env.ADMIN_PASSWORD)
      .update('admin-session')
      .digest('hex');

    return res.status(200).json({ token });
  } catch (err) {
    console.error('Admin login failed:', err);
    return res.status(500).json({ error: 'Login failed' });
  }
};
