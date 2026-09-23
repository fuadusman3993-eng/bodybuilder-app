const SERVICE_ID  = 'service_blxp235';
const TEMPLATE_ID = 'template_siko4mj';
const PUBLIC_KEY  = '4UXLXQLgVE519hR3N';

/** Generate a random 6-digit OTP */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/** Send OTP via EmailJS REST API directly (more reliable on web) */
export async function sendOTPEmail(toEmail: string, toName: string, otp: string): Promise<void> {
  const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      service_id: SERVICE_ID,
      template_id: TEMPLATE_ID,
      user_id: PUBLIC_KEY,
      template_params: {
        email:    toEmail,
        to_name:  toName || 'User',
        passcode: otp,
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('EmailJS REST error:', response.status, errText);
    throw new Error(`Email failed: ${errText}`);
  }
}

