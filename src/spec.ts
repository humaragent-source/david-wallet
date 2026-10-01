/**
 * Vein spec constants (mirrors /workspace/david/spec/*.json).
 * UI and store must import numbers from here so they can't drift.
 */

export const MG_PER_OZ = 31103.5;
export const REF_GOLD_USD_PER_OZ = 4266.12;

/* ---- Tiers (tiers.json) ---- */
export const TIER_1_MAX_USD = 3586;
export const TIER_2_MAX_USD = 100_000;

export const TIERS = [
  {
    n: 1 as const,
    name: 'True Gold Coin',
    veinName: 'coin',
    from: 0,
    to: TIER_1_MAX_USD,
    blurb: 'Build your Gold Reserve from $0 to $3,586. On completion you can store or deliver a True Gold Coin.',
    perks: { aprDiscountPp: 0, feeDiscount: 0, storageUsdMonth: 1, deliveryHandling: 'full' as const },
  },
  {
    n: 2 as const,
    name: 'True Gold Bar',
    veinName: 'bar',
    from: TIER_1_MAX_USD,
    to: TIER_2_MAX_USD,
    blurb: 'Reserve of $3,586 – $100,000. One free delivery handling fee per year; 0.5 pp APR discount.',
    perks: { aprDiscountPp: 0.5, feeDiscount: 0.1, storageUsdMonth: 1, deliveryHandling: 'one_free_year' as const },
  },
  {
    n: 3 as const,
    name: 'Vault',
    veinName: 'vault',
    from: TIER_2_MAX_USD,
    to: Number.POSITIVE_INFINITY,
    blurb: 'Open-ended from $100,000. Free vault storage, waived delivery handling, 1.0 pp APR discount.',
    perks: { aprDiscountPp: 1.0, feeDiscount: 0.25, storageUsdMonth: 0, deliveryHandling: 'waived' as const },
  },
] as const;

export type TierN = 1 | 2 | 3;

export function tierForPortfolioUsd(usd: number): TierN {
  if (usd >= TIER_2_MAX_USD) return 3;
  if (usd >= TIER_1_MAX_USD) return 2;
  return 1;
}

export function tierBounds(n: TierN) {
  const t = TIERS[n - 1];
  return { from: t.from, to: t.to === Number.POSITIVE_INFINITY ? null : t.to };
}

export function goalOzAtPrice(goalUsd: number, goldUsdPerOz: number) {
  if (!goldUsdPerOz || !isFinite(goldUsdPerOz)) return 0;
  return goalUsd / goldUsdPerOz;
}

/* ---- Loans (loans.json) ---- */
export interface LoanTerms {
  maxLtv: number;
  liquidationThreshold: number;
  liquidationPenalty: number;
}

export const LOAN_APR = 0.09; // variable example
export const LOAN_ALERTS = [0.6, 0.7] as const;
export const LOAN_DEFAULT: LoanTerms = { maxLtv: 0.5, liquidationThreshold: 0.75, liquidationPenalty: 0.05 };

/** Oil is excluded as collateral (max_ltv 0). */
export const LOAN_TERMS: Record<string, LoanTerms> = {
  gold: { maxLtv: 0.5, liquidationThreshold: 0.75, liquidationPenalty: 0.05 },
  silver: { maxLtv: 0.4, liquidationThreshold: 0.65, liquidationPenalty: 0.075 },
  btc: { maxLtv: 0.5, liquidationThreshold: 0.75, liquidationPenalty: 0.05 },
  oil: { maxLtv: 0, liquidationThreshold: 0.5, liquidationPenalty: 0.075 },
};

export function loanTermsFor(asset: string): LoanTerms {
  return LOAN_TERMS[asset] ?? LOAN_DEFAULT;
}

export function aprForTier(tier: TierN): number {
  return Math.max(0, LOAN_APR - TIERS[tier - 1].perks.aprDiscountPp / 100);
}

/** Daily-compounding debt: principal × (1 + apr/365)^days */
export function accruedDebt(principal: number, apr: number, openedTs: number, now = Date.now()): number {
  const days = Math.max(0, (now - openedTs) / 86_400_000);
  return principal * Math.pow(1 + apr / 365, days);
}

/* ---- Rewards (rewards.json) ---- */
export const SHAKE_BASE_MG = 0.1;
export const SHAKE_MAX_MG_PER_DAY = 0.3;

export const RUSH_POOL_USD = 250;
export const RUSH_POOL_MG = 1822.7;
export const RUSH_CAP_MG = 10;
export const RUSH_DURATION_SEC = 120;
export const RUSH_MAX_PER_DAY = 1;
export const RUSH_WINDOW_START = 9; // local hour inclusive
export const RUSH_WINDOW_END = 21; // local hour exclusive

/** Client-side share estimate: pro-rata vs a demo peer pool, hard-capped at 10 mg. */
export function rushRewardMg(myShakes: number, peerShakes = 400): number {
  if (myShakes <= 0) return 0;
  const share = RUSH_POOL_MG * (myShakes / (myShakes + peerShakes));
  return Math.min(RUSH_CAP_MG, share);
}

export function rushAvailableNow(lastClaimIso: string | undefined, now = new Date()): { ok: boolean; reason?: string } {
  const h = now.getHours();
  if (h < RUSH_WINDOW_START || h >= RUSH_WINDOW_END) {
    return { ok: false, reason: 'Gold Rush runs 09:00–21:00 local time' };
  }
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  if (lastClaimIso === today) return { ok: false, reason: 'Already claimed today’s Gold Rush' };
  return { ok: true };
}

export function mgToOz(mg: number) {
  return mg / MG_PER_OZ;
}
export function ozToMg(oz: number) {
  return oz * MG_PER_OZ;
}

/* ---- Vault & delivery (vault_and_delivery.json) ---- */
export const VAULT_USD_PER_MONTH = 1;

export interface DeliveryQuote {
  product: string;
  fineOz: number;
  premiumPct: number;
  handlingUsd: number;
}

export const DELIVERY_COIN: DeliveryQuote = {
  product: '1 oz gold sovereign coin',
  fineOz: 1,
  premiumPct: 0.0389,
  handlingUsd: 25,
};
export const DELIVERY_BAR_1OZ: DeliveryQuote = {
  product: '1 oz gold bar',
  fineOz: 1,
  premiumPct: 0.0299,
  handlingUsd: 25,
};

export function deliveryCost(item: 'coin' | 'bar', goldUsdPerOz: number, tier: TierN) {
  const q = item === 'coin' ? DELIVERY_COIN : DELIVERY_BAR_1OZ;
  const metal = q.fineOz * goldUsdPerOz;
  const premiumUsd = metal * q.premiumPct;
  const perks = TIERS[tier - 1].perks;
  let handling = q.handlingUsd;
  if (perks.deliveryHandling === 'waived') handling = 0;
  // Tier 2 one-free-year is modelled as waived handling for the claim UI (demo).
  if (perks.deliveryHandling === 'one_free_year') handling = 0;
  return {
    product: q.product,
    premiumPct: q.premiumPct,
    premiumUsd,
    handlingUsd: handling,
    totalUsd: premiumUsd + handling,
    metalUsd: metal,
  };
}

export function vaultFeeForTier(tier: TierN) {
  return TIERS[tier - 1].perks.storageUsdMonth;
}

/* ---- Formatting ---- */
export function formatOz(n: number, dp = 3): string {
  return (
    n.toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp }) + ' oz'
  );
}

export function formatMg(n: number, dp = 2): string {
  return (
    n.toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp }) + ' mg'
  );
}

export function formatUsd(n: number, dp = 2): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  }).format(n);
}

export function formatUsd0(n: number): string {
  return formatUsd(n, 0);
}

/** Holding period flag for rewards (D18 client approximation). */
export const REWARD_HOLDING_DAYS = 7;
