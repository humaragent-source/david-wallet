import React, { useEffect, useState } from 'react';
import { AssetGlyph, Icon } from '../art';
import { Btn, DemoTag, Header, Processing, Screen, SuccessSheet } from '../ui';
import { ASSETS, go, usd, usd2, useStore, type AssetId } from '../store';
import { accruedDebt, aprForTier, loanTermsFor, LOAN_ALERTS, formatUsd } from '../spec';

const COLLATERAL: AssetId[] = ['gold', 'silver', 'btc'];

export function Loans() {
  const { s, set, prices, addActivity, portfolioUsd } = useStore();
  const [asset, setAsset] = useState<AssetId>('gold');
  const terms = loanTermsFor(asset);
  const apr = aprForTier(s.tier);
  const held = asset === 'gold' ? s.goldOz : s.holdings[asset as Exclude<AssetId, 'gold'>];
  const locked = s.loans.filter((l) => l.collateral === asset).reduce((a, l) => a + l.qty, 0);
  const avail = Math.max(0, held - locked);
  const [qtyPct, setQtyPct] = useState(0.6);
  const [ltv, setLtv] = useState(Math.min(0.3, terms.maxLtv));
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<null | number>(null);
  const price = prices[asset].price;
  const qty = avail * qtyPct;
  const value = qty * price;
  const borrow = value * ltv;
  const liq = qty > 0 ? borrow / (qty * terms.liquidationThreshold) : 0;
  const drop = price > 0 ? (1 - liq / price) * 100 : 0;
  const m = ASSETS[asset];
  const maxPct = terms.maxLtv * 100;
  const liqPct = terms.liquidationThreshold * 100;
  const warn = ltv >= LOAN_ALERTS[0];

  useEffect(() => {
    setQtyPct(0.6);
    setLtv(Math.min(0.3, terms.maxLtv));
  }, [asset, terms.maxLtv]);

  const confirm = () => {
    setBusy(true);
    setTimeout(() => {
      set((p) => ({
        loans: [
          { id: Math.random().toString(36).slice(2), collateral: asset, qty, borrowed: borrow, apr, ts: Date.now() },
          ...p.loans,
        ],
        usdt: p.usdt + borrow,
      }));
      addActivity({
        kind: 'loan',
        title: `Borrowed USDT`,
        sub: `Against ${qty.toFixed(asset === 'btc' ? 5 : 3)} ${m.unit} ${m.name.toLowerCase()}`,
        amount: `+${usd2(borrow)}`,
        positive: true,
      });
      setBusy(false);
      setDone(borrow);
    }, 1800);
  };

  const repay = (id: string) => {
    const l = s.loans.find((x) => x.id === id);
    if (!l) return;
    const debt = accruedDebt(l.borrowed, l.apr, l.ts);
    set((p) => ({
      loans: p.loans.filter((x) => x.id !== id),
      usdt: p.usdt - debt,
    }));
    addActivity({
      kind: 'loan',
      title: 'Loan repaid',
      sub: `Principal ${usd2(l.borrowed)} + interest`,
      amount: `−${usd2(debt)}`,
    });
  };

  return (
    <Screen tab="borrow" className="loans">
      <Header title="Borrow" onBack={() => go('/gold')} />
      <div className="loans-hero">
        <h1>Borrow against your hard assets</h1>
        <p className="t-muted">Unlock stablecoins without selling. Max LTV varies by asset. Oil is not accepted as collateral.</p>
      </div>

      <div className="coll-chips coll-3">
        {COLLATERAL.map((a) => (
          <button key={a} className={a === asset ? 'on' : ''} onClick={() => setAsset(a)}>
            <AssetGlyph id={a} size={26} />
            <span>{ASSETS[a].name.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      <div className="card loan-card">
        <div className="row between">
          <span className="t-caption">Collateral</span>
          <span className="t-caption">
            Available {avail.toFixed(asset === 'btc' ? 5 : 3)} {m.unit}
          </span>
        </div>
        <div className="loan-amt">
          {qty.toFixed(asset === 'btc' ? 5 : 3)} <small>{m.unit}</small>
        </div>
        <div className="t-caption">
          {usd2(value)} at {usd2(price)} / {m.unit}{' '}
          {prices[asset].live && !prices[asset].stale ? (
            <span className="live-dot sm">Live · {prices[asset].source}</span>
          ) : (
            <DemoTag>{prices[asset].stale ? 'Stale last price' : 'Seed price'}</DemoTag>
          )}
        </div>
        <input type="range" min={0} max={1} step={0.01} value={qtyPct} onChange={(e) => setQtyPct(+e.target.value)} className="slider" />

        <div className="row between mt">
          <span className="t-caption">You borrow (USDT)</span>
          <span className="t-caption">Max {usd(value * terms.maxLtv)}</span>
        </div>
        <div className="loan-amt">{usd2(borrow)}</div>
        <input
          type="range"
          min={0}
          max={terms.maxLtv}
          step={0.005}
          value={ltv}
          onChange={(e) => setLtv(+e.target.value)}
          className="slider dark"
        />

        <div className="ltv">
          <div className="row between">
            <span className="t-strong-sm">Loan-to-value</span>
            <span className={`ltv-v ${warn ? 'warn' : ''}`}>{(ltv * 100).toFixed(1)}%</span>
          </div>
          <div className="ltv-bar">
            <div className="ltv-zone safe" style={{ width: `${maxPct}%` }} />
            <div className="ltv-zone mid" style={{ width: `${liqPct - maxPct}%` }} />
            <div className="ltv-zone liq" style={{ width: `${100 - liqPct}%` }} />
            <div className="ltv-mark max" style={{ left: `${maxPct}%` }}>
              <span>Max {maxPct.toFixed(0)}%</span>
            </div>
            <div className="ltv-mark alert" style={{ left: '60%' }}>
              <span>60%</span>
            </div>
            <div className="ltv-mark alert" style={{ left: '70%' }}>
              <span>70%</span>
            </div>
            <div className="ltv-mark liqm" style={{ left: `${liqPct}%` }}>
              <span>Liq. {liqPct.toFixed(0)}%</span>
            </div>
            <div className="ltv-now" style={{ left: `${ltv * 100}%` }} />
          </div>
        </div>

        <div className="fee-rows">
          <div>
            <span>Liquidation price</span>
            <b>{qty > 0 && borrow > 0 ? `${usd2(liq)} / ${m.unit}` : '—'}</b>
          </div>
          <div>
            <span>Price drop to liquidation</span>
            <b className={drop < 30 ? 'neg' : ''}>{borrow > 0 ? `−${drop.toFixed(1)}%` : '—'}</b>
          </div>
          <div>
            <span>Liquidation penalty</span>
            <b>{(terms.liquidationPenalty * 100).toFixed(1)}%</b>
          </div>
          <div>
            <span>Interest (APR, variable)</span>
            <b>{(apr * 100).toFixed(1)}%</b>
          </div>
          <div>
            <span>Est. daily interest</span>
            <b>{usd2((borrow * apr) / 365)}</b>
          </div>
        </div>
        <Btn className="wide loan-cta" disabled={borrow < 1} onClick={confirm}>
          Borrow {usd2(borrow)} USDT
        </Btn>
        <div className="fine center">Simulated on testnet. Tier {s.tier} APR discount applied. Alerts at 60% / 70% LTV.</div>
      </div>

      {s.loans.length > 0 && (
        <div className="activity">
          <h3>Active loans</h3>
          {s.loans.map((l) => {
            const v = l.qty * prices[l.collateral].price;
            const debt = accruedDebt(l.borrowed, l.apr, l.ts);
            const cur = v ? debt / v : 0;
            const lt = loanTermsFor(l.collateral).liquidationThreshold;
            return (
              <div key={l.id} className="loan-row">
                <AssetGlyph id={l.collateral} size={34} />
                <div className="act-main">
                  <div className="t-strong-sm">{usd2(debt)} USDT</div>
                  <div className="t-caption">
                    {l.qty.toFixed(l.collateral === 'btc' ? 5 : 3)} {ASSETS[l.collateral].unit} · LTV {(cur * 100).toFixed(1)}% · Liq{' '}
                    {(lt * 100).toFixed(0)}%
                  </div>
                  <div className="t-caption">Accrued interest {usd2(debt - l.borrowed)} · {(l.apr * 100).toFixed(1)}% APR</div>
                </div>
                <button className="btn btn-light btn-sm" onClick={() => repay(l.id)}>
                  Repay
                </button>
              </div>
            );
          })}
        </div>
      )}
      <Processing open={busy} label="Opening your loan" />
      <SuccessSheet
        open={done != null}
        title={<>{usd2(done ?? 0)} USDT borrowed</>}
        body={`Stablecoins added to your demo balance. Keep LTV under ${(terms.liquidationThreshold * 100).toFixed(0)}% to avoid a ${(terms.liquidationPenalty * 100).toFixed(1)}% liquidation penalty.`}
        onDone={() => setDone(null)}
      />
    </Screen>
  );
}
