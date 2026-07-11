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

  try {
    const { ticket_id } = req.query;
    if (!ticket_id) return res.status(400).json({ error: 'ticket_id required' });

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('ticket_id', ticket_id)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return res.status(200).json(data);
  } catch (err) {
    console.error('Fetching messages failed:', err);
    return res.status(500).json({ error: 'Fetch failed' });
  }
};
