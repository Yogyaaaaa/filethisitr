const crypto = require('crypto');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

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
      // Payment is genuine. In the next phase, this is where we'd
      // save the payment record to the database against the Ticket ID.
      return res.status(200).json({ verified: true });
    } else {
      return res.status(400).json({ verified: false, error: 'Signature mismatch' });
    }
  } catch (err) {
    console.error('Payment verification failed:', err);
    return res.status(500).json({ error: 'Verification failed' });
  }
};
