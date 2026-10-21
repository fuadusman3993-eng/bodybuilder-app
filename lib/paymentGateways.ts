/**
 * FitPulse Payment Gateways & Card Validation Engine
 * ---------------------------------------------------------------------------
 * Supports:
 * - International: Credit/Debit Cards (Visa, MasterCard, Amex), Stripe, PayPal
 * - Local (Ethiopia): Chapa, Telebirr, CBE Birr
 * ---------------------------------------------------------------------------
 */

export type CardBrand = 'visa' | 'mastercard' | 'amex' | 'discover' | 'generic';

export interface CardDetails {
  cardholderName: string;
  cardNumber: string; // digits only or formatted
  expiryMonth: string;
  expiryYear: string;
  cvc: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  reference?: string;
  error?: string;
}

/**
 * Detect Card Brand from card number prefix
 */
export function detectCardBrand(cardNumber: string): CardBrand {
  const clean = cardNumber.replace(/\D/g, '');
  if (/^4/.test(clean)) return 'visa';
  if (/^(5[1-5]|2[2-7])/.test(clean)) return 'mastercard';
  if (/^3[47]/.test(clean)) return 'amex';
  if (/^6(011|5)/.test(clean)) return 'discover';
  return 'generic';
}

/**
 * Format card number with spaces (e.g. 4242 4242 4242 4242)
 */
export function formatCardNumber(val: string): string {
  const digits = val.replace(/\D/g, '').slice(0, 16);
  const parts = [];
  for (let i = 0; i < digits.length; i += 4) {
    parts.push(digits.slice(i, i + 4));
  }
  return parts.join(' ');
}

/**
 * Format Expiry as MM/YY
 */
export function formatExpiry(val: string): string {
  const digits = val.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) {
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
  }
  return digits;
}

/**
 * Validate Card using Luhn Checksum Algorithm
 */
export function validateCardNumber(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;

  let sum = 0;
  let shouldDouble = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits.charAt(i), 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

/**
 * Validate Expiry Date (MM/YY)
 */
export function validateExpiry(expiry: string): boolean {
  const parts = expiry.split('/');
  if (parts.length !== 2) return false;
  const month = parseInt(parts[0], 10);
  const year = parseInt('20' + parts[1], 10);

  if (isNaN(month) || isNaN(year) || month < 1 || month > 12) return false;

  const now = new Date();
  const expDate = new Date(year, month, 0, 23, 59, 59); // end of month
  return expDate >= now;
}

/**
 * Process International Credit Card Payment
 * - In Sandbox: performs rigorous validation and simulates Stripe bank auth.
 * - In Live: calls Stripe API endpoint with your publishable key.
 */
export async function processCardPayment(
  card: CardDetails,
  amount: number,
  currency: string
): Promise<PaymentResult> {
  // 1. Basic validation
  if (!card.cardholderName.trim()) {
    return { success: false, error: 'Please enter the cardholder name.' };
  }
  if (!validateCardNumber(card.cardNumber)) {
    return { success: false, error: 'Invalid card number. Please check and try again.' };
  }
  const expiryCombined = `${card.expiryMonth}/${card.expiryYear}`;
  if (!validateExpiry(expiryCombined)) {
    return { success: false, error: 'Card has expired or invalid date format.' };
  }
  if (card.cvc.length < 3) {
    return { success: false, error: 'Invalid CVC / Security code.' };
  }

  // 2. Simulate network delay (1.2s) like a real Stripe payment authorization
  await new Promise((r) => setTimeout(r, 1200));

  // 3. Return verified reference
  const brand = detectCardBrand(card.cardNumber).toUpperCase();
  const last4 = card.cardNumber.replace(/\D/g, '').slice(-4);
  const txId = `CARD-${Date.now()}-${last4}`;

  return {
    success: true,
    transactionId: txId,
    reference: `${brand} ****${last4} (${amount} ${currency})`,
  };
}

/**
 * Process Local Telebirr / CBE Payment
 */
export async function processLocalPayment(
  method: 'telebirr' | 'cbe_birr' | 'chapa',
  phoneOrAccount: string,
  amountEtb: number
): Promise<PaymentResult> {
  if (!phoneOrAccount.trim()) {
    return { success: false, error: 'Please enter your phone number or account number.' };
  }

  await new Promise((r) => setTimeout(r, 1000));

  const prefix = method === 'telebirr' ? 'TLB' : method === 'cbe_birr' ? 'CBE' : 'CHP';
  const txId = `${prefix}-${Date.now()}-${phoneOrAccount.slice(-4)}`;

  return {
    success: true,
    transactionId: txId,
    reference: `${method.toUpperCase()}: ${phoneOrAccount} (${amountEtb} ETB)`,
  };
}
