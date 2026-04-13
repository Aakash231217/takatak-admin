export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function shortId(id: string): string {
  return id.slice(0, 8) + '...';
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
}

export const ROLES = ['USER', 'HOST', 'AGENCY', 'ADMIN'] as const;
export const TRANSACTION_TYPES = [
  'RECHARGE', 'CHAT_PAYMENT', 'GIFT_PAYMENT', 'REFERRAL_REWARD', 'DAILY_BONUS',
  'PROMO', 'COIN_TO_DIAMOND', 'DIAMOND_TO_COIN', 'WITHDRAWAL',
  'AGENCY_COMMISSION', 'HOST_SALARY_BONUS', 'HOST_LIVE_BONUS',
] as const;
export const WITHDRAWAL_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const;
export const FRAUD_TYPES = ['MULTI_ACCOUNT', 'SELF_CHAT', 'RATE_ABUSE', 'DEVICE_ANOMALY', 'SUSPICIOUS_PATTERN'] as const;
export const GIFT_CATEGORIES = ['BASIC', 'PREMIUM', 'EVENT', 'VIP', 'SPONSORED'] as const;
export const GIFT_RARITIES = ['COMMON', 'RARE', 'EPIC', 'LEGENDARY'] as const;
