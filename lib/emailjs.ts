import emailjs from '@emailjs/browser';

const SERVICE_ID  = 'service_blxp235';
const TEMPLATE_ID = 'template_siko4mj';
const PUBLIC_KEY  = '4UXLXQLgVE519hR3N';

/** Generate a cryptographically random 6-digit OTP */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/** Send OTP to the given email address */
export async function sendOTPEmail(toEmail: string, toName: string, otp: string): Promise<void> {
  await emailjs.send(
    SERVICE_ID,
    TEMPLATE_ID,
    {
      to_email: toEmail,
      to_name:  toName  || 'User',
      passcode: otp,
    },
    PUBLIC_KEY,
  );
}
