export const PRICING = {
  FREE: 0,
  STANDARD: Number(process.env.NEXT_PUBLIC_PRICE_STANDARD) || 10000,
  PREMIUM: Number(process.env.NEXT_PUBLIC_PRICE_PREMIUM) || 20000,
};

export const PRICING_FORMATTED = {
  FREE: '₦0',
  STANDARD: `₦${PRICING.STANDARD.toLocaleString()}`,
  PREMIUM: `₦${PRICING.PREMIUM.toLocaleString()}`,
};
