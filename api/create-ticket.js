const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      service_type,      // 'advisory' or 'itr'
      user_email,
      itr_form_type,     // only for ITR tickets, e.g. 'ITR-1'
      slot_datetime,      // only for ITR tickets (fixed 30-min slot)
      preferred_date,     // only for advisory tickets (date only)
      amount              // only for ITR tickets at creation; null for advisory
    } = req.body;

    if (!service_type || !user_email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const ticket_number = 'TKT-' + Date.now().toString(36).toUpperCase();

    const { data, error } = await supabase
      .from('tickets')
      .insert([{
        ticket_number,
        service_type,
        user_email,
        itr_form_type: itr_form_type || null,
        slot_datetime: slot_datetime || null,
        preferred_date: preferred_date || null,
        amount: amount || null,
        payment_status: 'unpaid'
      }])
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json(data);
  } catch (err) {
    console.error('Ticket creation failed:', err);
    return res.status(500).json({ error: 'Ticket creation failed' });
  }
};
