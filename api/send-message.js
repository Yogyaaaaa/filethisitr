const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

function validToken(token) {
  const expected = crypto
    .createHmac('sha256', process.env.ADMIN_PASSWORD)
    .update('admin-session')
    .digest('hex');
  return token === expected;
}

module.exports = async (req, res) => {
  const token = req.headers['x-admin-token'];
  if (!validToken(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { ticket_id, message } = req.body;
    if (!ticket_id || !message) {
      return res.status(400).json({ error: 'ticket_id and message required' });
    }

    const { data, error } = await supabase
      .from('messages')
      .insert([{ ticket_id, sender: 'admin', message }])
      .select()
      .single();

    if (error) throw error;
    return res.status(200).json(data);
  } catch (err) {
    console.error('Sending message failed:', err);
    return res.status(500).json({ error: 'Send failed' });
  }
};
