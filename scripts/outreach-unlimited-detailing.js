import { sendEmail } from './send-email.js';

const email = {
  to: 'unlimitedetailing@gmail.com',
  subject: 'Quick idea for Unlimited Detailing',
  body: `Hey,

I came across Unlimited Detailing and wanted to reach out — you've clearly built a solid reputation in Rockville.

I make short motion graphic ads for local businesses — the kind that stop the scroll on Instagram and Google. Auto detailing is one of the best fits for it: before/after shots, ceramic coating reveals, that kind of thing. Done right, it drives real bookings.

I'd put together a 15–30 second spot for you. Quick turnaround, no fluff.

Worth a quick conversation?

— Jay
jayrx16@gmail.com`,
};

sendEmail(email)
  .then(() => console.log('Done.'))
  .catch(err => {
    console.error('Failed:', err.message);
    process.exit(1);
  });
