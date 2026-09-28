import React, { useMemo, useState } from 'react';
import { AssetGlyph, Icon } from '../art';
import { Btn, Chart, DemoTag, Header, Keypad, Processing, Screen, Sheet, SuccessSheet } from '../ui';
import { ASSETS, back, go, haptic, series, usd, usd2, useStore, type AssetId } from '../store';

const HARD: AssetId[] = ['gold', 'silver', 'oil', 'btc'];
const STOCKS: AssetId[] = ['tsla', 'aapl', 'nvda'];
const SEED: Record<AssetId, number> = { gold: 3, silver: 11, oil: 17, btc: 23, tsla: 31, aapl: 41, nvda: 47 };
const VOL: Record<AssetId, number> = { gold: 0.006, silver: 0.01, oil: 0.012, btc: 0.02, tsla: 0.02, aapl: 0.01, nvda: 0.022 };
const ABOUT: Record<AssetId, string> = {
  gold: 'Tokenised gold backed 1:1 by LBMA bars. Buy with stablecoins, store in a vault, or take delivery.',
  silver: 'Tokenised silver — the industrial precious metal. Each token represents one troy ounce held in custody.',
  oil: 'Tokenised exposure to crude oil (WTI-style benchmark). Demo pricing on testnet — no live oil feed in v1.',
  btc: 'Bitcoin — the hardest digital asset. Price is a live public quote; your balance here is testnet demo.',
  tsla: 'Tokenised Tesla stock (TSLAx). Demo price — not a live market quote.',
  aapl: 'Tokenised Apple stock (AAPLx). Demo price — not a live market quote.',
  nvda: 'Tokenised NVIDIA stock (NVDAx). Demo price — not a live market quote.',
};

export function useHolding(id: AssetId) {
  const { s } = useStore();
  return id === 'gold' ? s.goldOz : s.holdings[id as Exclude<AssetId, 'gold'>];
}
const dp = (id: AssetId) => (id === 'btc' ? 5 : ASSETS[id].kind === 'stock' ? 2 : 3);

export function AssetsList() {
  const { s, prices } = useStore();
  const total = (Object.keys(ASSETS) as AssetId[]).reduce((a, k) => a + (k === 'gold' ? s.goldOz : s.holdings[k as Exclude<AssetId, 'gold'>]) * prices[k].price, 0) + s.usdt;
  return (
    <Screen tab="assets" className="assets">
      <Header left={<button className="avatar" onClick={() => go('/profile')} aria-label="Profile"><Icon.user size={16} /></button>} title="Assets" right={<DemoTag>Testnet</DemoTag>} />
      <section className="reserve">
        <div className="t-caption">Total portfolio</div>
        <div className="balance">{usd(total)}</div>
        <div className="t-caption">Demo balances · live spot for gold, silver, BTC</div>
      </section>
      <div className="card usdt-card">
        <div className="usdt-l"><span className="usdt-ic">₮</span><div><div className="t-strong-sm">Stablecoins</div><div className="t-caption">Test USDT</div></div></div>
        <div className="usdt-r"><div className="t-strong">{usd2(s.usdt)}</div></div>
        <div className="usdt-btns">
          <Btn small variant="dark" onClick={() => go('/trade/gold?side=buy')}>Buy assets</Btn>
          <Btn small variant="light" onClick={() => go('/trade/gold?side=sell')}>Sell to USDT</Btn>
        </div>
      </div>
      <h3 className="list-h">Hard assets</h3>
      <div className="card list">{HARD.map((id) => <AssetRow key={id} id={id} />)}</div>
      <h3 className="list-h">Tokenised stocks</h3>
      <div className="card list">{STOCKS.map((id) => <AssetRow key={id} id={id} />)}</div>
      <p className="fine center">Stock and oil prices are demo data. Nothing here is investment advice.</p>
    </Screen>
  );
}

function AssetRow({ id }: { id: AssetId }) {
  const { prices } = useStore();
  const h = useHolding(id);
  const m = ASSETS[id];
  const p = prices[id];
  const d = series(SEED[id], 30, p.price, VOL[id]);
  const chg = ((d[d.length - 1] - d[0]) / d[0]) * 100;
  return (
    <button className="asset-row" onClick={() => { haptic(); go(id === 'gold' ? '/gold' : `/asset/${id}`); }}>
      <AssetGlyph id={id} size={38} />
      <div className="ar-main"><div className="t-strong-sm">{m.name}</div><div className="t-caption">{h.toFixed(dp(id))} {m.ticker}</div></div>
      <div className="ar-spark"><Chart data={d} color={chg >= 0 ? '#1DB36B' : '#E5484D'} height={28} /></div>
      <div className="ar-right"><div className="t-strong-sm">{usd2(h * p.price)}</div><div className={`t-caption ${chg >= 0 ? 'pos' : 'neg'}`}>{p.live ? '● ' : ''}{usd2(p.price)}</div></div>
    </button>
  );
}

const RANGES = ['1D', '1W', '1M', '1Y'] as const;
export function AssetPage({ id }: { id: AssetId }) {
  const { prices } = useStore();
  const m = ASSETS[id];
  const p = prices[id];
  const h = useHolding(id);
  const [r, setR] = useState<typeof RANGES[number]>('1M');
  const data = useMemo(() => series(SEED[id] + RANGES.indexOf(r) * 5, 50, p.price, VOL[id] * (1 + RANGES.indexOf(r))), [id, r, p.price]);
  const chg = ((data[data.length - 1] - data[0]) / data[0]) * 100;
  if (!m) return null;
  return (
    <Screen className="asset-page">
      <Header title={m.name} onBack={() => go('/assets')} />
      <div className="ap-hero"><div className="hero-float"><AssetGlyph id={id} size={120} /></div></div>
      <div className="center">
        <div className="t-caption">{m.ticker} · per {m.unit === 'sh' ? 'share' : m.unit}</div>
        <div className="balance">{usd2(p.price)}</div>
        <div className="row center-row gap">
          <span className={`chg ${chg >= 0 ? 'up' : 'down'}`}>{chg >= 0 ? '▲' : '▼'} {Math.abs(chg).toFixed(2)}% {r}</span>
          {p.live ? <span className="live-dot">Live</span> : <DemoTag>Demo price</DemoTag>}
        </div>
      </div>
      <div className="card chart-card">
        <Chart data={data} color={m.id === 'oil' ? '#333' : m.color} />
        <div className="seg">{RANGES.map((x) => <button key={x} className={x === r ? 'on' : ''} onClick={() => setR(x)}>{x}</button>)}</div>
        <div className="fine">{p.live ? 'Current price from api.gold-api.com; ' : ''}historical curve is illustrative.</div>
      </div>
      <div className="card hold">
        <div className="row between"><span className="t-caption">Your holdings</span><DemoTag /></div>
        <div className="row between"><span className="t-strong">{h.toFixed(dp(id))} {m.unit}</span><span className="t-strong">{usd2(h * p.price)}</span></div>
      </div>
      <div className="card about"><h4>About</h4><p className="t-muted">{ABOUT[id]}</p>
        {['gold', 'silver', 'oil', 'btc'].includes(id) && <button className="link" onClick={() => go('/loans')}>Borrow against {m.name.toLowerCase()} <Icon.chev size={12} /></button>}
      </div>
      <div className="ap-foot">
        <Btn variant="light" onClick={() => go(`/trade/${id}?side=sell`)}>Sell</Btn>
        <Btn onClick={() => go(`/trade/${id}?side=buy`)}>Buy</Btn>
      </div>
    </Screen>
  );
}

/* ------------------------- Stablecoin buy / sell ticket ------------------------- */
export function Trade({ id, side: initial }: { id: AssetId; side: 'buy' | 'sell' }) {
  const { s, set, prices, addActivity } = useStore();
  const [side, setSide] = useState<'buy' | 'sell'>(initial);
  const [asset, setAsset] = useState<AssetId>(id in ASSETS ? id : 'gold');
  const [coin, setCoin] = useState<'USDT' | 'USDC'>('USDT');
  const [amt, setAmt] = useState('');
  const [review, setReview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [pick, setPick] = useState(false);
  const m = ASSETS[asset];
  const price = prices[asset].price;
  const held = asset === 'gold' ? s.goldOz : s.holdings[asset as Exclude<AssetId, 'gold'>];
  const value = parseFloat(amt || '0');
  const fee = value * 0.005;
  const units = side === 'buy' ? (value - fee) / price : value / price;
  const maxUsd = side === 'buy' ? s.usdt : held * price;
  const over = value > maxUsd + 0.001;

  const execute = () => {
    setReview(false); setBusy(true);
    setTimeout(() => {
      set((p) => {
        const delta = side === 'buy' ? units : -units;
        const usdtDelta = side === 'buy' ? -value : value - fee;
        if (asset === 'gold') return { goldOz: Math.max(0, p.goldOz + delta), usdt: p.usdt + usdtDelta };
        return { holdings: { ...p.holdings, [asset]: Math.max(0, p.holdings[asset as Exclude<AssetId, 'gold'>] + delta) }, usdt: p.usdt + usdtDelta };
      });
      addActivity({ kind: side, title: `${m.name} ${side === 'buy' ? 'bought' : 'sold'}`, sub: `${side === 'buy' ? 'Paid with' : 'Received'} ${coin}`, amount: `${side === 'buy' ? '+' : '−'}${units.toFixed(dp(asset))} ${m.unit}`, positive: side === 'buy' });
      setBusy(false); setDone(true);
    }, 1600);
  };

  return (
    <Screen className="trade">
      <Header title={<div className="seg seg-top">{(['buy', 'sell'] as const).map((x) => <button key={x} className={x === side ? 'on' : ''} onClick={() => setSide(x)}>{x === 'buy' ? 'Buy' : 'Sell'}</button>)}</div>} onBack={() => back('/assets')} />
      <button className="asset-pick" onClick={() => setPick(true)}><AssetGlyph id={asset} size={26} /><span>{m.name}</span><span className="t-caption">{m.ticker}</span><Icon.chev size={12} /></button>
      <div className="amount">
        <div className={`amount-v ${over ? 'neg' : ''}`}>${amt || '0'}</div>
        <div className="t-caption">≈ {isFinite(units) && units > 0 ? units.toFixed(dp(asset)) : '0'} {m.unit} at {usd2(price)} {prices[asset].live ? '(live)' : '(demo)'}</div>
      </div>
      <div className="quick">{[50, 100, 500].map((q) => <button key={q} onClick={() => setAmt(String(q))}>${q}</button>)}<button onClick={() => setAmt(String(Math.floor(maxUsd * 100) / 100))}>Max</button></div>
      <div className="pay-with">
        <span className="t-caption">{side === 'buy' ? 'Pay with' : 'Receive'}</span>
        <div className="seg small">{(['USDT', 'USDC'] as const).map((c) => <button key={c} className={c === coin ? 'on' : ''} onClick={() => setCoin(c)}>{c}</button>)}</div>
        <span className="t-caption">{side === 'buy' ? `Bal ${usd2(s.usdt)}` : `Hold ${held.toFixed(dp(asset))}`}</span>
      </div>
      <Keypad value={amt} onChange={setAmt} />
      <div className="trade-foot">
        <Btn className="wide" disabled={!value || over} onClick={() => setReview(true)}>{over ? 'Insufficient balance' : `Review ${side}`}</Btn>
      </div>

      <Sheet open={review} onClose={() => setReview(false)}>
        <div className="sheet-body">
          <h3>Review order</h3>
          <div className="review-hero"><AssetGlyph id={asset} size={56} /><div><div className="t-strong">{side === 'buy' ? 'Buy' : 'Sell'} {units.toFixed(dp(asset))} {m.unit}</div><div className="t-caption">{m.name} · {m.ticker}</div></div></div>
          <div className="fee-rows">
            <div><span>Price</span><b>{usd2(price)} / {m.unit}</b></div>
            <div><span>{side === 'buy' ? 'You pay' : 'You sell'}</span><b>{usd2(value)} {side === 'buy' ? coin : ''}</b></div>
            <div><span>Fee (0.5%)</span><b>{usd2(fee)}</b></div>
            <div><span>{side === 'buy' ? 'You receive' : 'You get'}</span><b>{side === 'buy' ? `${units.toFixed(dp(asset))} ${m.unit}` : `${usd2(value - fee)} ${coin}`}</b></div>
            <div><span>Network</span><b>Base Sepolia (testnet)</b></div>
          </div>
          <Btn className="wide" onClick={execute}>Confirm {side}</Btn>
          <p className="fine center">Simulated fill — no real funds or tokens move.</p>
        </div>
      </Sheet>
      <Sheet open={pick} onClose={() => setPick(false)}>
        <div className="sheet-body">
          <h3>Choose asset</h3>
          {(Object.keys(ASSETS) as AssetId[]).map((a) => (
            <button key={a} className="menu-item" onClick={() => { setAsset(a); setPick(false); }}><span className="mi-ic"><AssetGlyph id={a} size={28} /></span><span>{ASSETS[a].name} <span className="t-caption">{ASSETS[a].ticker}</span></span><span className="t-caption">{usd2(prices[a].price)}</span></button>
          ))}
        </div>
      </Sheet>
      <Processing open={busy} label={side === 'buy' ? 'Buying' : 'Selling'} />
      <SuccessSheet open={done} title={<>{side === 'buy' ? 'Bought' : 'Sold'} {units.toFixed(dp(asset))} {m.unit} {m.name.toLowerCase()}</>} body="Your demo balance has been updated." onDone={() => { setDone(false); go(asset === 'gold' ? '/gold' : `/asset/${asset}`); }} />
    </Screen>
  );
}
