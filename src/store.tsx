import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  TIERS,
  TIER_1_MAX_USD,
  TIER_2_MAX_USD,
  formatOz,
  formatUsd,
  formatUsd0,
  formatMg,
  mgToOz,
  tierForPortfolioUsd,
  type TierN,
} from './spec';

export { TIERS, formatOz, formatUsd, formatUsd0, formatMg, mgToOz, TIER_1_MAX_USD, TIER_2_MAX_USD };
export type { TierN };

/* ------------------------------------------------------------------ */
/*  Router                                                             */
/* ------------------------------------------------------------------ */
export function useRoute(): [string, string[]] {
  const get = () => window.location.hash.replace(/^#/, '') || '/';
  const [path, setPath] = useState(get);
  useEffect(() => {
    const on = () => setPath(get());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  const parts = path.split('?')[0].split('/').filter(Boolean);
  return [path, parts];
}

export const go = (path: string, opts?: { replace?: boolean }) => {
  const hash = '#' + path;
  if (window.location.hash === hash) {
    window.scrollTo(0, 0);
    return;
  }
  if (opts?.replace) window.location.replace(hash);
  else window.location.hash = path;
  window.scrollTo(0, 0);
};

export const back = (fallback = '/gold') => {
  if (window.history.length > 1) window.history.back();
  else go(fallback);
};

/* ------------------------------------------------------------------ */
/*  Assets — align with Vein assets.json; mock tokens on Base Sepolia  */
/* ------------------------------------------------------------------ */
export type AssetId = 'gold' | 'silver' | 'oil' | 'btc' | 'aapl' | 'nvda' | 'spy';
export interface AssetMeta {
  id: AssetId;
  name: string;
  ticker: string;
  unit: string;
  live: boolean;
  demoPrice: number;
  color: string;
  kind: 'metal' | 'commodity' | 'crypto' | 'stock';
  mockLabel: string;
  note?: string;
}
export const ASSETS: Record<AssetId, AssetMeta> = {
  gold: {
    id: 'gold',
    name: 'Gold',
    ticker: 'mXAUt',
    unit: 'oz',
    live: true,
    demoPrice: 4266.12,
    color: '#D9A43A',
    kind: 'metal',
    mockLabel: 'Mock XAUt · Base Sepolia',
  },
  silver: {
    id: 'silver',
    name: 'Silver (SLVx)',
    ticker: 'mSLVx',
    unit: 'sh',
    live: true,
    demoPrice: 28.5,
    color: '#9AA3AE',
    kind: 'metal',
    mockLabel: 'Mock SLVx · Base Sepolia',
    note: 'Tokenised iShares SLV ETF share — NOT physical silver',
  },
  oil: {
    id: 'oil',
    name: 'Oil (USOon)',
    ticker: 'mUSOon',
    unit: 'sh',
    live: true,
    demoPrice: 72,
    color: '#2B2B2B',
    kind: 'commodity',
    mockLabel: 'Mock USOon · Base Sepolia · DEMO',
    note: 'USO futures-ETF tracker — NOT spot oil. Demo asset; not loan collateral.',
  },
  btc: {
    id: 'btc',
    name: 'Bitcoin',
    ticker: 'mWBTC',
    unit: 'BTC',
    live: true,
    demoPrice: 95_000,
    color: '#F2921B',
    kind: 'crypto',
    mockLabel: 'Mock WBTC · Base Sepolia',
  },
  aapl: {
    id: 'aapl',
    name: 'Apple',
    ticker: 'mAAPLx',
    unit: 'sh',
    live: true,
    demoPrice: 227.6,
    color: '#555555',
    kind: 'stock',
    mockLabel: 'Mock AAPLx · Base Sepolia',
  },
  nvda: {
    id: 'nvda',
    name: 'NVIDIA',
    ticker: 'mNVDAx',
    unit: 'sh',
    live: true,
    demoPrice: 131.2,
    color: '#76B900',
    kind: 'stock',
    mockLabel: 'Mock NVDAx · Base Sepolia',
  },
  spy: {
    id: 'spy',
    name: 'S&P 500',
    ticker: 'mSPYx',
    unit: 'sh',
    live: true,
    demoPrice: 570,
    color: '#1F4B99',
    kind: 'stock',
    mockLabel: 'Mock SPYx · Base Sepolia',
  },
};


export interface PriceInfo {
  price: number;
  live: boolean;
  stale: boolean;
  source?: string;
  updatedAt?: string;
}
export type Prices = Record<AssetId, PriceInfo>;

function initialPrices(): Prices {
  const out = {} as Prices;
  (Object.keys(ASSETS) as AssetId[]).forEach((k) => {
    out[k] = { price: ASSETS[k].demoPrice, live: false, stale: true, source: 'seed' };
  });
  return out;
}

async function fetchJson(url: string, timeoutMs = 8000): Promise<unknown | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { cache: 'no-store', signal: ctrl.signal });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

async function pullGold(): Promise<Partial<PriceInfo> | null> {
  // Vein primary: Kraken XAUTUSD
  const j = (await fetchJson('https://api.kraken.com/0/public/Ticker?pair=XAUTUSD')) as {
    result?: { XAUTUSD?: { c?: string[] } };
  } | null;
  const p = parseFloat(j?.result?.XAUTUSD?.c?.[0] ?? '');
  if (p > 0) return { price: p, live: true, stale: false, source: 'Kraken XAUTUSD', updatedAt: new Date().toISOString() };
  // Chainlink XAU/USD via public eth RPC (AggregatorV3) — read latestAnswer on mainnet feed
  const chain = await readChainlink('0x214eD9Cf4a3C095adEc5b97634920b4f2BC90E0a'); // XAU/USD proxy on Ethereum (fallback: try another)
  if (chain) return { price: chain, live: true, stale: false, source: 'Chainlink XAU/USD', updatedAt: new Date().toISOString() };
  return null;
}

async function pullSilver(): Promise<Partial<PriceInfo> | null> {
  // xStocks SLVx
  const j = (await fetchJson('https://api.backed.fi/api/v2/public/assets/SLVx/price-data')) as {
    data?: { price?: number; lastPrice?: number };
    price?: number;
  } | null;
  const p = Number(j?.data?.price ?? j?.data?.lastPrice ?? j?.price);
  if (p > 0) return { price: p, live: true, stale: false, source: 'xStocks SLVx', updatedAt: new Date().toISOString() };
  const chain = await readChainlink('0x379589227c1F6b5b9744f5b5Cd356eA8d6569359'); // placeholder may fail
  if (chain) return { price: chain, live: true, stale: false, source: 'Chainlink XAG/USD', updatedAt: new Date().toISOString() };
  return null;
}

async function pullBtc(): Promise<Partial<PriceInfo> | null> {
  const j = (await fetchJson('https://api.kraken.com/0/public/Ticker?pair=WBTCUSD')) as {
    result?: Record<string, { c?: string[] }>;
  } | null;
  const key = j?.result ? Object.keys(j.result)[0] : null;
  const p = key ? parseFloat(j!.result![key].c?.[0] ?? '') : NaN;
  if (p > 0) return { price: p, live: true, stale: false, source: 'Kraken WBTCUSD', updatedAt: new Date().toISOString() };
  const j2 = (await fetchJson('https://api.kraken.com/0/public/Ticker?pair=XBTUSD')) as {
    result?: Record<string, { c?: string[] }>;
  } | null;
  const key2 = j2?.result ? Object.keys(j2.result)[0] : null;
  const p2 = key2 ? parseFloat(j2!.result![key2].c?.[0] ?? '') : NaN;
  if (p2 > 0) return { price: p2, live: true, stale: false, source: 'Kraken XBTUSD', updatedAt: new Date().toISOString() };
  return null;
}

async function pullOil(): Promise<Partial<PriceInfo> | null> {
  // GeckoTerminal simple token price — USOon on ethereum if known; fall back to seed (stale, no invent)
  const j = (await fetchJson(
    'https://api.geckoterminal.com/api/v2/simple/networks/eth/token_price/0x8d09d4759e5596a9f25c4c4ca37274ef8f7e8b5a',
  )) as { data?: { attributes?: { token_prices?: Record<string, string> } } } | null;
  const prices = j?.data?.attributes?.token_prices;
  if (prices) {
    const first = Object.values(prices)[0];
    const p = parseFloat(first);
    if (p > 0) return { price: p, live: true, stale: false, source: 'GeckoTerminal USOon', updatedAt: new Date().toISOString() };
  }
  return null;
}

async function pullXStock(sym: 'AAPLx' | 'NVDAx' | 'SPYx'): Promise<Partial<PriceInfo> | null> {
  const j = (await fetchJson(`https://api.backed.fi/api/v2/public/assets/${sym}/price-data`)) as {
    data?: { price?: number; lastPrice?: number };
    price?: number;
  } | null;
  const p = Number(j?.data?.price ?? j?.data?.lastPrice ?? j?.price);
  if (p > 0) return { price: p, live: true, stale: false, source: `xStocks ${sym}`, updatedAt: new Date().toISOString() };
  return null;
}

/** Minimal eth_call to Chainlink AggregatorV3Interface.latestRoundData — returns USD with 8 decimals. */
async function readChainlink(feed: string): Promise<number | null> {
  // latestRoundData() selector 0xfeaf968c
  const body = {
    jsonrpc: '2.0',
    id: 1,
    method: 'eth_call',
    params: [{ to: feed, data: '0xfeaf968c' }, 'latest'],
  };
  try {
    const r = await fetch('https://eth.drpc.org', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    const j = (await r.json()) as { result?: string };
    if (!j.result || j.result === '0x') return null;
    // answer is the second int256 in the return (roundId, answer, ...)
    const hex = j.result.slice(2);
    const answerHex = hex.slice(64, 128);
    const raw = BigInt('0x' + answerHex);
    // handle signed
    const signed = raw > BigInt('0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff') ? raw - (BigInt(1) << BigInt(256)) : raw;
    const price = Number(signed) / 1e8;
    return price > 0 && isFinite(price) ? price : null;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Persistent state                                                   */
/* ------------------------------------------------------------------ */
export interface Activity {
  id: string;
  kind: 'buy' | 'sell' | 'send' | 'receive' | 'withdraw' | 'reward' | 'claim' | 'loan' | 'card';
  title: string;
  sub: string;
  amount: string;
  positive?: boolean;
  ts: number;
}
export interface Loan {
  id: string;
  collateral: AssetId;
  qty: number;
  borrowed: number;
  apr: number; // decimal, e.g. 0.09
  ts: number;
}
export interface State {
  onboarded: boolean;
  demoMode: boolean;
  tier: TierN;
  goldOz: number;
  holdings: Record<Exclude<AssetId, 'gold'>, number>;
  usdt: number;
  claimedCoins: number;
  claimedBars: number;
  lastClaim?: { item: 'coin' | 'bar'; method: 'vault' | 'home'; ts: number };
  activity: Activity[];
  loans: Loan[];
  streakDays: string[];
  totalShakes: number;
  missedDays: number;
  earnedMg: number;
  /** ISO yyyy-mm-dd of last Gold Rush claim */
  lastRushDay?: string;
  /** ISO yyyy-mm-dd of last shake claim */
  lastShakeDay?: string;
  /** Rewards pending holding period (D18 client approx) */
  pendingRewardsMg: number;
  pendingRewardsSince?: number;
  card?: { tier: string; last4: string; ts: number };
  name?: string;
  email?: string;
  address?: string;
  /** Force-open rush for demo screenshots */
  rushForceOpen?: boolean;
}

const KEY = 'david.wallet.v2';
const now = Date.now();
const DEFAULT: State = {
  onboarded: false,
  demoMode: false,
  tier: 1,
  goldOz: 0.6,
  holdings: { silver: 18.5, oil: 12, btc: 0.021, aapl: 3, nvda: 5, spy: 2 },
  usdt: 5000,
  claimedCoins: 0,
  claimedBars: 0,
  activity: [
    { id: 'a1', kind: 'buy', title: 'Gold bought', sub: 'Paid with USDT', amount: '+0.120 oz', positive: true, ts: now - 3600e3 * 5 },
    { id: 'a2', kind: 'reward', title: 'Shake ’n’ Earn', sub: 'Daily streak reward', amount: '+0.10 mg', positive: true, ts: now - 3600e3 * 29 },
    { id: 'a3', kind: 'receive', title: 'Gold received', sub: 'From 0x8f3…a1C2', amount: '+0.250 oz', positive: true, ts: now - 3600e3 * 52 },
    { id: 'a4', kind: 'buy', title: 'Gold bought', sub: 'Paid with USDT', amount: '+0.226 oz', positive: true, ts: now - 3600e3 * 98 },
  ],
  loans: [],
  streakDays: [],
  totalShakes: 0,
  missedDays: 0,
  earnedMg: 0,
  pendingRewardsMg: 0,
};

function migrate(raw: Partial<State> & { earnedOz?: number; holdings?: Record<string, number> }): State {
  const h = raw.holdings ?? DEFAULT.holdings;
  const holdings: State['holdings'] = {
    silver: h.silver ?? 0,
    oil: h.oil ?? 0,
    btc: h.btc ?? 0,
    aapl: h.aapl ?? 0,
    nvda: h.nvda ?? 0,
    spy: h.spy ?? (h as { tsla?: number }).tsla ?? 0,
  };
  const earnedMg = raw.earnedMg ?? (typeof raw.earnedOz === 'number' ? raw.earnedOz * 31103.5 : 0);
  return { ...DEFAULT, ...raw, holdings, earnedMg, pendingRewardsMg: raw.pendingRewardsMg ?? 0 };
}

function load(): State {
  try {
    const raw = localStorage.getItem(KEY) ?? localStorage.getItem('david.wallet.v1');
    if (raw) return migrate(JSON.parse(raw));
  } catch {
    /* ignore */
  }
  return { ...DEFAULT };
}

export const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const today = () => iso(new Date());

/** Missed day resets streak to 1 (Vein D21), not 0. */
export function currentStreak(days: string[]): number {
  const set = new Set(days);
  const d = new Date();
  if (!set.has(iso(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (set.has(iso(d))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}
export const multiplierFor = (streak: number) => (streak >= 14 ? 3 : streak >= 7 ? 2 : 1);

interface Ctx {
  s: State;
  set: (fn: (s: State) => Partial<State>) => void;
  prices: Prices;
  goldPrice: number;
  goldUsd: number;
  portfolioUsd: number;
  addActivity: (a: Omit<Activity, 'id' | 'ts'>) => void;
  reset: () => void;
}
const StoreCtx = createContext<Ctx>(null as unknown as Ctx);
export const useStore = () => useContext(StoreCtx);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [s, setS] = useState<State>(load);
  const [prices, setPrices] = useState<Prices>(initialPrices);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(s));
    } catch {
      /* ignore */
    }
  }, [s]);

  const set = useCallback((fn: (s: State) => Partial<State>) => setS((p) => ({ ...p, ...fn(p) })), []);
  const addActivity = useCallback(
    (a: Omit<Activity, 'id' | 'ts'>) =>
      setS((p) => ({
        ...p,
        activity: [{ ...a, id: Math.random().toString(36).slice(2), ts: Date.now() }, ...p.activity].slice(0, 40),
      })),
    [],
  );
  const reset = useCallback(() => {
    localStorage.removeItem(KEY);
    localStorage.removeItem('david.wallet.v1');
    setS({ ...DEFAULT, onboarded: true, demoMode: s.demoMode });
  }, [s.demoMode]);

  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    const apply = (id: AssetId, info: Partial<PriceInfo> | null) => {
      if (!alive.current) return;
      if (info && typeof info.price === 'number' && info.price > 0) {
        setPrices((p) => ({ ...p, [id]: { ...p[id], ...info, live: true, stale: false } as PriceInfo }));
      } else {
        // Keep last known, mark stale — never invent / drift
        setPrices((p) => ({ ...p, [id]: { ...p[id], live: false, stale: true } }));
      }
    };
    const pull = async () => {
      const [g, ag, b, o, aapl, nvda, spy] = await Promise.all([
        pullGold(),
        pullSilver(),
        pullBtc(),
        pullOil(),
        pullXStock('AAPLx'),
        pullXStock('NVDAx'),
        pullXStock('SPYx'),
      ]);
      apply('gold', g);
      apply('silver', ag);
      apply('btc', b);
      apply('oil', o);
      apply('aapl', aapl);
      apply('nvda', nvda);
      apply('spy', spy);
    };
    pull();
    const t = setInterval(pull, 60_000);
    return () => {
      alive.current = false;
      clearInterval(t);
    };
  }, []);

  const goldPrice = prices.gold.price;
  const goldUsd = s.goldOz * goldPrice;
  const portfolioUsd = useMemo(() => {
    let total = s.usdt + s.goldOz * goldPrice;
    (Object.keys(s.holdings) as Exclude<AssetId, 'gold'>[]).forEach((k) => {
      total += s.holdings[k] * prices[k].price;
    });
    return total;
  }, [s, prices, goldPrice]);

  const value = useMemo<Ctx>(
    () => ({ s, set, prices, goldPrice, goldUsd, portfolioUsd, addActivity, reset }),
    [s, set, prices, goldPrice, goldUsd, portfolioUsd, addActivity, reset],
  );
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

/* ------------------------------------------------------------------ */
/*  Formatting aliases (prefer formatOz / formatUsd from spec)         */
/* ------------------------------------------------------------------ */
export const usd = (n: number, dp = 0) => formatUsd(n, dp);
export const usd2 = (n: number) => formatUsd(n, 2);
export const oz = (n: number, dp = 3) => formatOz(n, dp);
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

export function series(seed: number, n: number, end: number, vol: number): number[] {
  let x = seed;
  const rnd = () => {
    x = (x * 9301 + 49297) % 233280;
    return x / 233280;
  };
  const out: number[] = [end];
  for (let i = 1; i < n; i++) out.unshift(out[0] * (1 + (rnd() - 0.52) * vol));
  return out;
}

/** Haptics: try Capacitor, then Vibration API, then iOS AudioContext tick. */
export type HapticKind = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'selection';
export function haptic(kind: HapticKind | number = 'light') {
  try {
    const cap = (window as unknown as { Capacitor?: { Plugins?: { Haptics?: { impact: (o: { style: string }) => void; notification: (o: { type: string }) => void; selectionChanged: () => void } } } }).Capacitor?.Plugins?.Haptics;
    if (cap) {
      if (typeof kind === 'number') {
        cap.impact({ style: kind >= 30 ? 'HEAVY' : kind >= 15 ? 'MEDIUM' : 'LIGHT' });
        return;
      }
      if (kind === 'success' || kind === 'warning') {
        cap.notification({ type: kind === 'success' ? 'SUCCESS' : 'WARNING' });
        return;
      }
      if (kind === 'selection') {
        cap.selectionChanged();
        return;
      }
      cap.impact({ style: kind === 'heavy' ? 'HEAVY' : kind === 'medium' ? 'MEDIUM' : 'LIGHT' });
      return;
    }
  } catch {
    /* fall through */
  }
  const ms = typeof kind === 'number' ? kind : kind === 'heavy' ? 30 : kind === 'medium' || kind === 'success' ? 20 : 10;
  try {
    if (navigator.vibrate) {
      navigator.vibrate(ms);
      return;
    }
  } catch {
    /* iOS web */
  }
  // Soft audio tick as last-resort feedback on iOS Safari (where vibrate is ignored)
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = kind === 'success' ? 880 : 180;
    g.gain.value = 0.0008;
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.03);
    o.stop(ctx.currentTime + 0.04);
    setTimeout(() => ctx.close(), 80);
  } catch {
    /* silent */
  }
}

export function portfolioTier(portfolioUsd: number): TierN {
  return tierForPortfolioUsd(portfolioUsd);
}
