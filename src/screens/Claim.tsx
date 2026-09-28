import React, { useEffect, useState } from 'react';
import { Coin, GoldBar, Icon, Medallion } from '../art';
import { Btn, Header, Processing, Sheet, SuccessSheet } from '../ui';
import { go, haptic, oz, useStore } from '../store';

type Item = 'coin' | 'bar';

/* ---------------- Delivery / vault sheet (shared by coin + bar) ---------------- */
export function DeliverySheet({ open, item, onClose }: { open: boolean; item: Item; onClose?: () => void }) {
  const { s, set, addActivity } = useStore();
  const [stop, setStop] = useState<0 | 1 | 2>(0);
  const [form, setForm] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [done, setDone] = useState<null | 'vault' | 'home'>(null);
  const [addr, setAddr] = useState({ name: s.name ?? '', line1: '', city: '', zip: '', country: 'United States' });
  const label = item === 'coin' ? 'True Gold Coin' : 'True Gold Bar';

  useEffect(() => { if (!open) return; const t = setInterval(() => setStop((x) => ((x + 1) % 3) as 0 | 1 | 2), 1100); return () => clearInterval(t); }, [open]);

  const finish = (method: 'vault' | 'home') => {
    setBusy(method === 'vault' ? 'Moving to your vault' : 'Scheduling insured delivery');
    setTimeout(() => {
      set((p) => ({
        lastClaim: { item, method, ts: Date.now() },
        claimedCoins: p.claimedCoins + (item === 'coin' ? 1 : 0),
        claimedBars: p.claimedBars + (item === 'bar' ? 1 : 0),
        tier: item === 'coin' ? 2 : 3,
      }));
      addActivity({ kind: 'claim', title: `${label} claimed`, sub: method === 'vault' ? 'Stored in personal vault' : 'Insured delivery to your door', amount: item === 'coin' ? '1 coin' : '1 bar' });
      setBusy(null); setForm(false); setDone(method);
    }, 1700);
  };

  return (
    <>
      <Sheet open={open && !form && !busy && !done} dark onClose={onClose} className="deliver-sheet">
        <div className="deliver">
          <span className="pill pill-gold">{item === 'coin' ? 'Gold coin ready' : 'Gold bar ready'}</span>
          <h2 className="deliver-title">{label}</h2>
          <div className="deliver-hero">{item === 'coin' ? <Coin size={92} /> : <GoldBar size={150} />}</div>
          <div className="route">
            <div className="route-title">Deliver To Your Doorstep</div>
            <div className="route-line">
              {(['vault', 'truck', 'home'] as const).map((k, i) => (
                <React.Fragment key={k}>
                  <span className={`route-stop ${stop >= i ? 'on' : ''}`}>{k === 'vault' ? <Icon.vault size={12} /> : k === 'truck' ? <Icon.truck size={12} /> : <Icon.home size={12} />}</span>
                  {i < 2 && <span className={`route-seg ${stop > i ? 'on' : ''}`}><i /></span>}
                </React.Fragment>
              ))}
            </div>
            <div className="route-labels"><span>Vault</span><span>Truck</span><span>Home</span></div>
            <div className="medals">
              <Medallion kind="vault" active={stop === 0} />
              <Medallion kind="truck" active={stop === 1} />
              <Medallion kind="home" active={stop === 2} />
            </div>
          </div>
          <Btn variant="white" className="wide" onClick={() => setForm(true)}><Icon.truck size={16} /> Deliver to your door</Btn>
          <button className="vault-opt" onClick={() => { haptic(); finish('vault'); }}>
            <span>Store in your personal vault · <b>$1</b></span>
            <small>Insured, audited, and earning interest on your gold</small>
          </button>
        </div>
      </Sheet>

      <Sheet open={form && !busy} onClose={() => setForm(false)}>
        <div className="sheet-body">
          <h3>Delivery address</h3>
          <p className="t-muted">Insured, signature-on-delivery courier. Demo only — nothing ships from testnet.</p>
          {([['name', 'Full name'], ['line1', 'Street address'], ['city', 'City'], ['zip', 'Postcode'], ['country', 'Country']] as const).map(([k, ph]) => (
            <label key={k} className="field compact"><span>{ph}</span><input value={addr[k]} placeholder={ph} onChange={(e) => setAddr({ ...addr, [k]: e.target.value })} /></label>
          ))}
          <div className="fee-rows">
            <div><span>Insured shipping</span><b>$0.00 (demo)</b></div>
            <div><span>Estimated arrival</span><b>3–5 business days</b></div>
          </div>
          <Btn className="wide" onClick={() => finish('home')}>Confirm delivery</Btn>
        </div>
      </Sheet>

      <Processing open={!!busy} label={busy ?? ''} />
      <SuccessSheet open={!!done}
        title={done === 'vault' ? `${label} is in your vault` : `${label} is on its way`}
        body={done === 'vault' ? 'Stored for $1 and earning interest (simulated on testnet).' : `Arriving at ${addr.line1 || 'your door'} in 3–5 business days (simulated).`}
        onDone={() => { setDone(null); onClose?.(); go('/gold'); }} />
    </>
  );
}

/* ---------------- Coin ready → shell cracks → claim ---------------- */
export function ClaimCoin() {
  const { goldPrice } = useStore();
  const [phase, setPhase] = useState<'shell' | 'crack' | 'reveal'>('shell');
  const [sheet, setSheet] = useState(false);
  useEffect(() => {
    const a = setTimeout(() => { setPhase('crack'); haptic(20); }, 700);
    const b = setTimeout(() => { setPhase('reveal'); haptic(40); }, 2300);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, []);
  return (
    <div className="screen claim-screen">
      <Header title="Gold" onBack={() => go('/gold')} />
      <div className={`claim-stage ${phase}`}>
        <div className="burst" />
        <div className="sparkles">{Array.from({ length: 14 }).map((_, i) => <i key={i} style={{ ['--a' as string]: `${i * 26}deg`, ['--d' as string]: `${(i % 5) * 0.08}s` }} />)}</div>
        <div className="coin-core"><Coin size={210} /></div>
        <div className="shell">
          <svg viewBox="0 0 220 220" width="232" height="232">
            <defs>
              <radialGradient id="shellG" cx="38%" cy="30%" r="80%"><stop offset="0" stopColor="#fff" /><stop offset=".55" stopColor="#D6DAE0" /><stop offset="1" stopColor="#8F959E" /></radialGradient>
              <clipPath id="shL"><path d="M0 0H112L100 40L118 72L96 110L114 150L98 190L110 220H0Z" /></clipPath>
              <clipPath id="shR"><path d="M112 0H220V220H110L98 190L114 150L96 110L118 72L100 40Z" /></clipPath>
            </defs>
            <g className="half left" clipPath="url(#shL)"><circle cx="110" cy="110" r="106" fill="url(#shellG)" /></g>
            <g className="half right" clipPath="url(#shR)"><circle cx="110" cy="110" r="106" fill="url(#shellG)" /></g>
            <path className="crack" d="M112 4L100 40L118 72L96 110L114 150L98 190L110 216M118 72L150 60M96 110L62 122M114 150L150 164" fill="none" stroke="#5E646C" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </div>
      </div>
      <div className={`claim-copy ${phase === 'reveal' ? 'in' : ''}`}>
        <span className="pill pill-gold">Tier 1 complete</span>
        <h1>Your True Gold Coin is ready</h1>
        <p className="t-muted">1 coin ≈ {oz(3586 / goldPrice, 3)} of tokenised gold. Claim it to store it in your vault or have it delivered.</p>
        <Btn variant="gold" className="wide" onClick={() => setSheet(true)}>Claim It <Icon.chev size={14} /></Btn>
      </div>
      <DeliverySheet open={sheet} item="coin" onClose={() => setSheet(false)} />
    </div>
  );
}

/* ---------------- Graduation: gold pours into the bar mould ---------------- */
export function Graduate() {
  const { s, set, goldPrice, goldUsd } = useStore();
  const [run, setRun] = useState(0);
  const liveTarget = s.tier === 2 ? Math.max(0.14, Math.min(1, (goldUsd - 3586) / (100000 - 3586))) : 1;
  const [target, setTarget] = useState(liveTarget);
  useEffect(() => { setTarget(liveTarget); }, [run]); // snapshot per run so live price ticks don't restart the pour
  const complete = target >= 1;
  const [phase, setPhase] = useState<'pour' | 'set' | 'ready'>('pour');
  const [fill, setFill] = useState(0);
  const [sheet, setSheet] = useState(false);
  useEffect(() => {
    setPhase('pour'); setFill(0);
    let raf = 0; const t0 = performance.now();
    const dur = 1200 + 2400 * target;
    const tick = (t: number) => {
      const p = Math.min(1, Math.max(0, (t - t0 - 600) / dur));
      setFill(p * target);
      if (p < 1) raf = requestAnimationFrame(tick); else { setPhase('set'); haptic(30); setTimeout(() => setPhase('ready'), 900); }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run, target]);
  const pct = Math.round(fill * 100);
  return (
    <div className="screen grad-screen">
      <Header title="Tier 2" onBack={() => go('/gold')} />
      <div className="grad-top">
        <span className="pill pill-gold">{complete ? 'Graduation' : 'Tier 2 unlocked'}</span>
        <h1>{phase === 'ready' ? (complete ? 'Your True Gold Bar is ready' : `Your bar is ${pct}% cast`) : 'Pouring your True Gold Bar'}</h1>
        <p className="t-muted">{phase === 'ready' ? (complete ? 'Tier 2 complete. Claim it to vault or deliver.' : 'Keep stacking gold — the bar is yours at $100,000.') : 'Your reserve is being cast into a 10 oz bar…'}</p>
      </div>
      <div className={`pour-stage ${phase}`}>
        <div className="crucible">
          <svg width="120" height="90" viewBox="0 0 120 90">
            <defs><linearGradient id="cru" x1="0" x2="1"><stop offset="0" stopColor="#3A3A3A" /><stop offset=".5" stopColor="#777" /><stop offset="1" stopColor="#2A2A2A" /></linearGradient></defs>
            <path d="M10 10h90l-12 70H22z" fill="url(#cru)" />
            <ellipse cx="55" cy="12" rx="45" ry="7" fill="#F6C343" />
            <path d="M98 10l18 6-6 6" fill="#F6C343" />
          </svg>
        </div>
        <div className="stream" style={{ opacity: phase === 'pour' ? 1 : 0 }} />
        <div className="pour-splash" style={{ opacity: phase === 'pour' && fill > 0 ? 1 : 0 }} />
        <div className="mould"><GoldBar size={280} fill={fill} /></div>
        {phase !== 'pour' && complete && <div className="sparkles gold">{Array.from({ length: 16 }).map((_, i) => <i key={i} style={{ ['--a' as string]: `${i * 22.5}deg`, ['--d' as string]: `${(i % 4) * 0.06}s` }} />)}</div>}
      </div>
      <div className="grad-meter">
        <div className="track-bar"><div className="track-fill" style={{ width: `${fill * 100}%` }} /></div>
        <div className="row between t-caption2"><span>$3,586</span><span>{pct}% cast</span><span>$100,000</span></div>
      </div>
      <div className="grad-foot">
        {complete
          ? <Btn variant="gold" className="wide" disabled={phase !== 'ready'} onClick={() => setSheet(true)}>Claim It <Icon.chev size={14} /></Btn>
          : <>
              <Btn variant="dark" className="wide" onClick={() => go('/trade/gold')}>Buy more gold</Btn>
              <button className="link muted wide" onClick={() => { set(() => ({ tier: 2, goldOz: (100000 / goldPrice) * 1.02 })); setRun((r) => r + 1); }}>Demo: jump to the $100,000 goal</button>
            </>}
      </div>
      <DeliverySheet open={sheet} item="bar" onClose={() => setSheet(false)} />
    </div>
  );
}
