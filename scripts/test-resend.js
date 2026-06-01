import { sendEmail } from '../src/mailer.js';

sendEmail({
  to: 'jayrx16@gmail.com',
  subject: 'Jay outreach system — test',
  body: 'Resend is live. Ready to send.',
})
  .then(() => console.log('Test passed.'))
  .catch(err => console.error('Test failed:', err.message));
