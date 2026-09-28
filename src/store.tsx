import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

/* ------------------------------------------------------------------ */
/*  Router: tiny hash router so every screen has a shareable URL       */
/* ------------------------------------------------------------------ */
export function useRoute(): [string, string[]] {
  const get = () => (window.location.hash.replace(/^#/, '') || '/');
  const [path, setPath] = useState(get);
  useEffect(() => {
    const on = () => setPath(get());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  const parts = path.split('?')[0].split('/').filter(Boolean);
  return [path, parts];
}
export const go = (path: string) => {
  if (window.location.hash === '#' + path) return;
  window.location.hash = path;
  window.scrollTo(0, 0);
};
export const back = (fallback = '/gold') => {
  if (window.history.length > 1) window.history.back();
  else go(fallback);
};

/* ------------------------------------------------------------------ */
/*  Tiers                                                              */
/* ------------------------------------------------------------------ */
export const TIERS = [
  { n: 1, name: 'True Gold Coin', from: 0, to: 3586, blurb: 'The coin is yours when you have a Gold Reserve of $0 – $3,586. On completion you can store or deliver to your home.' },
  { n: 2, name: 'True Gold Bar', from: 3586, to: 100000, blurb: 'Ten ounces of vault-grade gold when your Gold Reserve reaches $3,586 – $100,000. Store it or have it delivered to your door.' },
  { n: 3, name: 'True Gold Crown', from: 100000, to: 1000000, blurb: 'A one-kilo cast crown bar for reserves of $100,000 – $1,000,000, with a private vault, concierge delivery and priority liquidity.' },
] as const;

/* ------------------------------------------------------------------ */
/*  Prices: gold, silver, BTC are live public spot quotes              */
/*  (api.gold-api.com). Oil and stocks are clearly-labelled demo data. */
/* ------------------------------------------------------------------ */
export type AssetId = 'gold' | 'silver' | 'oil' | 'btc' | 'tsla' | 'aapl' | 'nvda';
export interface AssetMeta { id: AssetId; name: string; ticker: string; unit: string; live: boolean; demoPrice: number; color: string; kind: 'metal' | 'commodity' | 'crypto' | 'stock'; }
export const ASSETS: Record<AssetId, AssetMeta> = {
  gold:   { id: 'gold',   name: 'Gold',      ticker: 'XAUt',   unit: 'oz',  live: true,  demoPrice: 4190,  color: '#D9A43A', kind: 'metal' },
  silver: { id: 'silver', name: 'Silver',    ticker: 'XAGt',   unit: 'oz',  live: true,  demoPrice: 62,    color: '#9AA3AE', kind: 'metal' },
  oil:    { id: 'oil',    name: 'Crude Oil', ticker: 'OILt',   unit: 'bbl', live: false, demoPrice: 71.4,  color: '#2B2B2B', kind: 'commodity' },
  btc:    { id: 'btc',    name: 'Bitcoin',   ticker: 'BTC',    unit: 'BTC', live: true,  demoPrice: 83400, color: '#F2921B', kind: 'crypto' },
  tsla:   { id: 'tsla',   name: 'Tesla',     ticker: 'TSLAx',  unit: 'sh',  live: false, demoPrice: 248.1, color: '#E31937', kind: 'stock' },
  aapl:   { id: 'aapl',   name: 'Apple',     ticker: 'AAPLx',  unit: 'sh',  live: false, demoPrice: 227.6, color: '#555555', kind: 'stock' },
  nvda:   { id: 'nvda',   name: 'NVIDIA',    ticker: 'NVDAx',  unit: 'sh',  live: false, demoPrice: 131.2, color: '#76B900', kind: 'stock' },
};
const LIVE_SYMBOL: Partial<Record<AssetId, string>> = { gold: 'XAU', silver: 'XAG', btc: 'BTC' };

export interface PriceInfo { price: number; live: boolean; updatedAt?: string; }
export type Prices = Record<AssetId, PriceInfo>;

function initialPrices(): Prices {
  const out = {} as Prices;
  (Object.keys(ASSETS) as AssetId[]).forEach((k) => (out[k] = { price: ASSETS[k].demoPrice, live: false }));
  return out;
}

/* ------------------------------------------------------------------ */
/*  Persistent demo state                                              */
/* ------------------------------------------------------------------ */
export interface Activity { id: string; kind: 'buy' | 'sell' | 'send' | 'receive' | 'withdraw' | 'reward' | 'claim' | 'loan' | 'card'; title: string; sub: string; amount: string; positive?: boolean; ts: number; }
export interface Loan { id: string; collateral: AssetId; qty: number; borrowed: number; apr: number; ts: number; }
export interface State {
  onboarded: boolean;
  demoMode: boolean;
  tier: 1 | 2 | 3;
  goldOz: number;          // demo tokenised gold (XAUt) balance
  holdings: Record<Exclude<AssetId, 'gold'>, number>;
  usdt: number;            // demo test-stablecoin balance
  claimedCoins: number;
  claimedBars: number;
  lastClaim?: { item: 'coin' | 'bar'; method: 'vault' | 'home'; ts: number };
  activity: Activity[];
  loans: Loan[];
  streakDays: string[];    // ISO dates (yyyy-mm-dd) with a completed shake
  totalShakes: number;
  missedDays: number;
  earnedOz: number;        // gold earned from shake + rush
  card?: { tier: string; last4: string; ts: number };
  name?: string;
  address?: string;
}

const KEY = 'david.wallet.v1';
const now = Date.now();
const DEFAULT: State = {
  onboarded: false,
  demoMode: false,
  tier: 1,
  goldOz: 0.6,
  holdings: { silver: 18.5, oil: 12, btc: 0.021, tsla: 2, aapl: 3, nvda: 5 },
  usdt: 5000,
  claimedCoins: 0,
  claimedBars: 0,
  activity: [
    { id: 'a1', kind: 'buy', title: 'Gold bought', sub: 'Paid with USDT', amount: '+0.120 oz', positive: true, ts: now - 3600e3 * 5 },
    { id: 'a2', kind: 'reward', title: 'Shake ’n’ Earn', sub: 'Daily streak reward', amount: '+0.004 oz', positive: true, ts: now - 3600e3 * 29 },
    { id: 'a3', kind: 'receive', title: 'Gold received', sub: 'From 0x8f3…a1C2', amount: '+0.250 oz', positive: true, ts: now - 3600e3 * 52 },
    { id: 'a4', kind: 'buy', title: 'Gold bought', sub: 'Paid with USDT', amount: '+0.226 oz', positive: true, ts: now - 3600e3 * 98 },
  ],
  loans: [],
  streakDays: [],
  totalShakes: 0,
  missedDays: 0,
  earnedOz: 0,
};

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULT, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return DEFAULT;
}

/* date helpers for streaks */
export const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const today = () => iso(new Date());
export function currentStreak(days: string[]): number {
  const set = new Set(days);
  const d = new Date();
  if (!set.has(iso(d))) d.setDate(d.getDate() - 1); // today not done yet: streak survives until midnight
  let n = 0;
  while (set.has(iso(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
export const multiplierFor = (streak: number) => (streak >= 14 ? 3 : streak >= 7 ? 2 : 1);

interface Ctx {
  s: State;
  set: (fn: (s: State) => Partial<State>) => void;
  prices: Prices;
  goldPrice: number;
  goldUsd: number;
  addActivity: (a: Omit<Activity, 'id' | 'ts'>) => void;
  reset: () => void;
}
const StoreCtx = createContext<Ctx>(null as unknown as Ctx);
export const useStore = () => useContext(StoreCtx);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [s, setS] = useState<State>(load);
  const [prices, setPrices] = useState<Prices>(initialPrices);

  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ } }, [s]);

  const set = useCallback((fn: (s: State) => Partial<State>) => setS((p) => ({ ...p, ...fn(p) })), []);
  const addActivity = useCallback((a: Omit<Activity, 'id' | 'ts'>) =>
    setS((p) => ({ ...p, activity: [{ ...a, id: Math.random().toString(36).slice(2), ts: Date.now() }, ...p.activity].slice(0, 40) })), []);
  const reset = useCallback(() => { localStorage.removeItem(KEY); setS({ ...DEFAULT, onboarded: true, demoMode: s.demoMode }); }, [s.demoMode]);

  // live prices
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    const pull = async () => {
      await Promise.all(Object.entries(LIVE_SYMBOL).map(async ([id, sym]) => {
        try {
          const r = await fetch(`https://api.gold-api.com/price/${sym}`, { cache: 'no-store' });
          const j = await r.json();
          if (alive.current && typeof j.price === 'number' && j.price > 0)
            setPrices((p) => ({ ...p, [id]: { price: j.price, live: true, updatedAt: j.updatedAt } }));
        } catch { /* stays on demo fallback, labelled as such */ }
      }));
      // demo drift for oil / stocks so the charts feel alive (clearly labelled "demo")
      setPrices((p) => {
        const n = { ...p };
        (['oil', 'tsla', 'aapl', 'nvda'] as AssetId[]).forEach((k) => {
          n[k] = { price: +(p[k].price * (1 + (Math.random() - 0.5) * 0.002)).toFixed(2), live: false };
        });
        return n;
      });
    };
    pull();
    const t = setInterval(pull, 30000);
    return () => { alive.current = false; clearInterval(t); };
  }, []);

  const goldPrice = prices.gold.price;
  const value = useMemo<Ctx>(() => ({ s, set, prices, goldPrice, goldUsd: s.goldOz * goldPrice, addActivity, reset }), [s, set, prices, goldPrice, addActivity, reset]);
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

/* ------------------------------------------------------------------ */
/*  Formatting                                                         */
/* ------------------------------------------------------------------ */
export const usd = (n: number, dp = 0) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp });
export const usd2 = (n: number) => usd(n, 2);
export const oz = (n: number, dp = 3) => n.toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp }) + ' oz';
export const short = (a?: string) => (a ? a.slice(0, 6) + '…' + a.slice(-4) : '');
export function ago(ts: number) {
  const m = Math.round((Date.now() - ts) / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  return `${d} day${d > 1 ? 's' : ''} ago`;
}

/* Deterministic pseudo-random series for illustrative charts */
export function series(seed: number, n: number, end: number, vol: number): number[] {
  let x = seed;
  const rnd = () => { x = (x * 9301 + 49297) % 233280; return x / 233280; };
  const out: number[] = [end];
  for (let i = 1; i < n; i++) out.unshift(out[0] * (1 + (rnd() - 0.52) * vol));
  return out;
}

export function haptic(ms = 10) { try { navigator.vibrate?.(ms); } catch { /* iOS ignores */ } }
