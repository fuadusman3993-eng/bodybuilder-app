/**
 * FitPulse Global Currency & Exchange Rate Service
 * ---------------------------------------------------------------------------
 * Supports: ETB, USD, EUR, GBP, AED
 * Standard baseline: 1 ETB = 1 Coin | 1 USD = 100 Coins ($0.01/coin)
 * ---------------------------------------------------------------------------
 */

export type CurrencyCode = 'ETB' | 'USD' | 'EUR' | 'GBP' | 'AED';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  flag: string;
  // How many coins 1 unit of this currency buys
  coinsPerUnit: number;
  decimals: number;
  symbolPosition: 'before' | 'after';
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  ETB: {
    code: 'ETB',
    symbol: 'ETB',
    name: 'Ethiopian Birr',
    flag: '🇪🇹',
    coinsPerUnit: 1, // 1 ETB = 1 Coin
    decimals: 0,
    symbolPosition: 'after',
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    flag: '🇺🇸',
    coinsPerUnit: 100, // $1.00 = 100 Coins ($0.01 per coin)
    decimals: 2,
    symbolPosition: 'before',
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    flag: '🇪🇺',
    coinsPerUnit: 108, // €1.00 = 108 Coins
    decimals: 2,
    symbolPosition: 'before',
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    flag: '🇬🇧',
    coinsPerUnit: 128, // £1.00 = 128 Coins
    decimals: 2,
    symbolPosition: 'before',
  },
  AED: {
    code: 'AED',
    symbol: 'AED',
    name: 'UAE Dirham',
    flag: '🇦🇪',
    coinsPerUnit: 27, // 1 AED = 27 Coins
    decimals: 2,
    symbolPosition: 'before',
  },
};

export interface InternationalCoinBundle {
  id: string;
  label: string;
  coins: number;
  price: number;
  currency: CurrencyCode;
  badge?: string;
}

/**
 * Detect currency from user profile country or device
 */
export function detectDefaultCurrency(country?: string): CurrencyCode {
  if (!country) return 'ETB';
  const c = country.toLowerCase();
  if (c.includes('ethiopia') || c.includes('et')) return 'ETB';
  if (c.includes('usa') || c.includes('united states') || c.includes('canada') || c.includes('australia')) return 'USD';
  if (c.includes('uk') || c.includes('united kingdom') || c.includes('england') || c.includes('britain')) return 'GBP';
  if (c.includes('uae') || c.includes('emirates') || c.includes('dubai')) return 'AED';
  if (c.includes('germany') || c.includes('france') || c.includes('italy') || c.includes('spain') || c.includes('europe')) return 'EUR';
  return 'ETB';
}

/**
 * Convert coins to equivalent fiat amount
 */
export function coinsToFiat(coins: number, currency: CurrencyCode): number {
  const config = CURRENCIES[currency];
  if (!config) return coins;
  const fiat = coins / config.coinsPerUnit;
  return Number(fiat.toFixed(config.decimals));
}

/**
 * Convert fiat amount to coins
 */
export function fiatToCoins(fiat: number, currency: CurrencyCode): number {
  const config = CURRENCIES[currency];
  if (!config) return Math.floor(fiat);
  return Math.floor(fiat * config.coinsPerUnit);
}

/**
 * Format money with currency symbol
 */
export function formatCurrency(amount: number, currency: CurrencyCode): string {
  const config = CURRENCIES[currency];
  if (!config) return `${amount} ${currency}`;

  const formattedNum = config.decimals === 0
    ? Math.round(amount).toLocaleString()
    : amount.toLocaleString(undefined, {
        minimumFractionDigits: config.decimals,
        maximumFractionDigits: config.decimals,
      });

  if (config.symbolPosition === 'before') {
    return `${config.symbol}${formattedNum}`;
  }
  return `${formattedNum} ${config.symbol}`;
}

/**
 * Get header rate display text (e.g. "1 Coin = 1 ETB" or "100 Coins = $1.00")
 */
export function getRateDisplay(currency: CurrencyCode): string {
  if (currency === 'ETB') return '1 Coin = 1 ETB';
  if (currency === 'USD') return '100 Coins = $1.00';
  if (currency === 'EUR') return '108 Coins = €1.00';
  if (currency === 'GBP') return '128 Coins = £1.00';
  if (currency === 'AED') return '27 Coins = 1 AED';
  return `100 Coins = 1 ${currency}`;
}

/**
 * Get dynamic coin top-up bundles adjusted for selected currency
 */
export function getCoinBundles(currency: CurrencyCode): InternationalCoinBundle[] {
  if (currency === 'ETB') {
    return [
      { id: 'starter', label: 'Starter', coins: 100, price: 100, currency: 'ETB' },
      { id: 'athlete', label: 'Pro Athlete', coins: 500, price: 500, currency: 'ETB', badge: 'Popular' },
      { id: 'champion', label: 'Champion', coins: 1200, price: 1200, currency: 'ETB', badge: 'Best Value' },
    ];
  }

  if (currency === 'USD') {
    return [
      { id: 'starter', label: 'Starter', coins: 100, price: 1.00, currency: 'USD' },
      { id: 'athlete', label: 'Pro Athlete', coins: 500, price: 4.99, currency: 'USD', badge: 'Popular' },
      { id: 'champion', label: 'Champion', coins: 1200, price: 9.99, currency: 'USD', badge: 'Best Value' },
    ];
  }

  if (currency === 'EUR') {
    return [
      { id: 'starter', label: 'Starter', coins: 100, price: 0.95, currency: 'EUR' },
      { id: 'athlete', label: 'Pro Athlete', coins: 500, price: 4.60, currency: 'EUR', badge: 'Popular' },
      { id: 'champion', label: 'Champion', coins: 1200, price: 9.20, currency: 'EUR', badge: 'Best Value' },
    ];
  }

  if (currency === 'GBP') {
    return [
      { id: 'starter', label: 'Starter', coins: 100, price: 0.80, currency: 'GBP' },
      { id: 'athlete', label: 'Pro Athlete', coins: 500, price: 3.90, currency: 'GBP', badge: 'Popular' },
      { id: 'champion', label: 'Champion', coins: 1200, price: 7.80, currency: 'GBP', badge: 'Best Value' },
    ];
  }

  // AED
  return [
    { id: 'starter', label: 'Starter', coins: 100, price: 3.70, currency: 'AED' },
    { id: 'athlete', label: 'Pro Athlete', coins: 500, price: 18.50, currency: 'AED', badge: 'Popular' },
    { id: 'champion', label: 'Champion', coins: 1200, price: 37.00, currency: 'AED', badge: 'Best Value' },
  ];
}
