const crypto = require('crypto');
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
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, ticket_number } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing payment details' });
    }

    const body = razorpay_order_id + '|' + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    const isValid = expectedSignature === razorpay_signature;

    if (isValid) {
      if (ticket_number) {
        const { error } = await supabase
          .from('tickets')
          .update({
            payment_status: 'paid',
            razorpay_order_id,
            razorpay_payment_id
          })
          .eq('ticket_number', ticket_number);

        if (error) {
          console.error('Failed to update ticket after payment:', error);
        }
      }
      return res.status(200).json({ verified: true });
    } else {
      return res.status(400).json({ verified: false, error: 'Signature mismatch' });
    }
  } catch (err) {
    console.error('Payment verification failed:', err);
    return res.status(500).json({ error: 'Verification failed' });
  }
};
