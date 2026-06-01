// Generates a Calendly scheduling link, pre-filling known customer info.
// If Calendly isn't configured, falls back to the raw BOOKING_URL env var.

const BASE_URL = process.env.CALENDLY_EVENT_URL || process.env.BOOKING_URL || 'https://calendly.com/bellas-salon';

export async function handleBooking(extractedInfo = {}, customerName = '') {
  try {
    const params = new URLSearchParams();

    const name = extractedInfo.name || customerName;
    if (name)                params.set('name',  name);
    if (extractedInfo.email) params.set('email', extractedInfo.email);
    // Calendly accepts date as YYYY-MM-DD via the `date` param on some event types
    if (extractedInfo.date)  params.set('date',  extractedInfo.date);

    const query = params.toString();
    return query ? `${BASE_URL}?${query}` : BASE_URL;

  } catch (err) {
    console.error('[booking-handler] Error building link:', err.message);
    return BASE_URL;
  }
}
