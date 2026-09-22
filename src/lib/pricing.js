export const PRICING = {
  FREE: 0,
  STANDARD: 5000,
  PREMIUM: 20000,
};

export const PRICING_FORMATTED = {
  FREE: '₦0',
  STANDARD: `₦${PRICING.STANDARD.toLocaleString()}`,
  PREMIUM: `₦${PRICING.PREMIUM.toLocaleString()}`,
};

export const INTERNATIONAL_PRICING = {
  STANDARD: 5,
  PREMIUM: 20,
};

export const INTERNATIONAL_PRICING_FORMATTED = {
  STANDARD: '$5',
  PREMIUM: '$20',
};
