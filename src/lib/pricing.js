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
