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

    // Look up the ticket's owner (user_id), since files are stored under user_id/ticket_id/
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('user_id')
      .eq('id', ticket_id)
      .single();

    if (ticketError || !ticket) throw ticketError || new Error('Ticket not found');

    const folderPath = `${ticket.user_id}/${ticket_id}`;

    const { data: files, error: listError } = await supabase
      .storage
      .from('documents')
      .list(folderPath);

    if (listError) throw listError;

    // Generate a temporary signed URL for each file (valid 1 hour) so admin can view/download
    const filesWithUrls = await Promise.all(
      (files || []).map(async (f) => {
        const { data: signed } = await supabase
          .storage
          .from('documents')
          .createSignedUrl(`${folderPath}/${f.name}`, 3600);
        return {
          name: f.name.replace(/^\d+_/, ''),
          url: signed?.signedUrl || null
        };
      })
    );

    return res.status(200).json(filesWithUrls);
  } catch (err) {
    console.error('Fetching files failed:', err);
    return res.status(500).json({ error: 'Fetch failed' });
  }
};
