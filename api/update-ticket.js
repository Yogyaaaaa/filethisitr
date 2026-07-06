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
    const { ticket_id, amount, meet_sent, payment_status } = req.body;

    const updates = {};
    if (amount !== undefined) updates.amount = amount;
    if (meet_sent !== undefined) updates.meet_sent = meet_sent;
    if (payment_status !== undefined) updates.payment_status = payment_status;

    const { data, error } = await supabase
      .from('tickets')
      .update(updates)
      .eq('id', ticket_id)
      .select()
      .single();

    if (error) throw error;
    return res.status(200).json(data);
  } catch (err) {
    console.error('Ticket update failed:', err);
    return res.status(500).json({ error: 'Update failed' });
  }
};
