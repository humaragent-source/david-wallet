import React, { useEffect, useMemo, useState } from 'react';
import { AssetGlyph, Icon } from '../art';
import { Btn, DemoTag, Header, Processing, Screen, SuccessSheet } from '../ui';
import { ASSETS, go, usd, usd2, useStore, type AssetId } from '../store';

const COLLATERAL: AssetId[] = ['gold', 'silver', 'oil', 'btc'];
const MAX_LTV = 0.5;
const LIQ_LTV = 0.75;
const APR = 6.5;

export function Loans() {
  const { s, set, prices, addActivity } = useStore();
  const [asset, setAsset] = useState<AssetId>('gold');
  const held = asset === 'gold' ? s.goldOz : s.holdings[asset as Exclude<AssetId, 'gold'>];
  const locked = s.loans.filter((l) => l.collateral === asset).reduce((a, l) => a + l.qty, 0);
  const avail = Math.max(0, held - locked);
  const [qtyPct, setQtyPct] = useState(0.6);
  const [ltv, setLtv] = useState(0.3);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<null | number>(null);
  const price = prices[asset].price;
  const qty = avail * qtyPct;
  const value = qty * price;
  const borrow = value * ltv;
  const liq = qty > 0 ? borrow / (qty * LIQ_LTV) : 0;
  const drop = price > 0 ? (1 - liq / price) * 100 : 0;
  const m = ASSETS[asset];

  useEffect(() => { setQtyPct(0.6); setLtv(0.3); }, [asset]);

  const confirm = () => {
    setBusy(true);
    setTimeout(() => {
      set((p) => ({ loans: [{ id: Math.random().toString(36).slice(2), collateral: asset, qty, borrowed: borrow, apr: APR, ts: Date.now() }, ...p.loans], usdt: p.usdt + borrow }));
      addActivity({ kind: 'loan', title: `Borrowed USDT`, sub: `Against ${qty.toFixed(asset === 'btc' ? 5 : 3)} ${m.unit} ${m.name.toLowerCase()}`, amount: `+${usd2(borrow)}`, positive: true });
      setBusy(false); setDone(borrow);
    }, 1800);
  };

  return (
    <Screen tab="borrow" className="loans">
      <Header title="Borrow" onBack={() => go('/gold')} />
      <div className="loans-hero">
        <h1>Borrow against your hard assets</h1>
        <p className="t-muted">Unlock stablecoins without selling. Up to 50% loan-to-value.</p>
      </div>

      <div className="coll-chips">
        {COLLATERAL.map((a) => (
          <button key={a} className={a === asset ? 'on' : ''} onClick={() => setAsset(a)}>
            <AssetGlyph id={a} size={26} /><span>{ASSETS[a].name}</span>
          </button>
        ))}
      </div>

      <div className="card loan-card">
        <div className="row between">
          <span className="t-caption">Collateral</span>
          <span className="t-caption">Available {avail.toFixed(asset === 'btc' ? 5 : 3)} {m.unit}</span>
        </div>
        <div className="loan-amt">{qty.toFixed(asset === 'btc' ? 5 : 3)} <small>{m.unit}</small></div>
        <div className="t-caption">{usd2(value)} at {usd2(price)} / {m.unit} {prices[asset].live ? <span className="live-dot sm">Live</span> : <DemoTag>Demo price</DemoTag>}</div>
        <input type="range" min={0} max={1} step={0.01} value={qtyPct} onChange={(e) => setQtyPct(+e.target.value)} className="slider" />

        <div className="row between mt">
          <span className="t-caption">You borrow (USDT)</span>
          <span className="t-caption">Max {usd(value * MAX_LTV)}</span>
        </div>
        <div className="loan-amt">{usd2(borrow)}</div>
        <input type="range" min={0} max={MAX_LTV} step={0.005} value={ltv} onChange={(e) => setLtv(+e.target.value)} className="slider dark" />

        <div className="ltv">
          <div className="row between"><span className="t-strong-sm">Loan-to-value</span><span className={`ltv-v ${ltv > 0.4 ? 'warn' : ''}`}>{(ltv * 100).toFixed(1)}%</span></div>
          <div className="ltv-bar">
            <div className="ltv-zone safe" style={{ width: '50%' }} />
            <div className="ltv-zone mid" style={{ width: '25%' }} />
            <div className="ltv-zone liq" style={{ width: '25%' }} />
            <div className="ltv-mark max" style={{ left: '50%' }}><span>Max 50%</span></div>
            <div className="ltv-mark liqm" style={{ left: '75%' }}><span>Liq. 75%</span></div>
            <div className="ltv-now" style={{ left: `${ltv * 100}%` }} />
          </div>
        </div>

        <div className="fee-rows">
          <div><span>Liquidation price</span><b>{qty > 0 && borrow > 0 ? `${usd2(liq)} / ${m.unit}` : '—'}</b></div>
          <div><span>Price drop to liquidation</span><b className={drop < 30 ? 'neg' : ''}>{borrow > 0 ? `−${drop.toFixed(1)}%` : '—'}</b></div>
          <div><span>Interest (APR)</span><b>{APR}%</b></div>
          <div><span>Monthly interest</span><b>{usd2((borrow * APR) / 100 / 12)}</b></div>
        </div>
        <Btn className="wide" disabled={borrow < 1} onClick={confirm}>Borrow {usd2(borrow)} USDT</Btn>
        <div className="fine center">Simulated on testnet. Real lending would require an audited lending protocol and oracle.</div>
      </div>

      {s.loans.length > 0 && (
        <div className="activity">
          <h3>Active loans</h3>
          {s.loans.map((l) => {
            const v = l.qty * prices[l.collateral].price;
            const cur = v ? l.borrowed / v : 0;
            return (
              <div key={l.id} className="loan-row">
                <AssetGlyph id={l.collateral} size={34} />
                <div className="act-main"><div className="t-strong-sm">{usd2(l.borrowed)} USDT</div><div className="t-caption">{l.qty.toFixed(l.collateral === 'btc' ? 5 : 3)} {ASSETS[l.collateral].unit} · LTV {(cur * 100).toFixed(1)}%</div></div>
                <button className="btn btn-light btn-sm" onClick={() => set((p) => ({ loans: p.loans.filter((x) => x.id !== l.id), usdt: p.usdt - l.borrowed }))}>Repay</button>
              </div>
            );
          })}
        </div>
      )}
      <Processing open={busy} label="Opening your loan" />
      <SuccessSheet open={done != null} title={<>{usd2(done ?? 0)} USDT borrowed</>} body="Stablecoins added to your demo balance. Keep LTV under 75% to avoid liquidation." onDone={() => setDone(null)} />
    </Screen>
  );
}
