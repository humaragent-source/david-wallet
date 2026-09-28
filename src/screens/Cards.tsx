import React, { useState } from 'react';
import { CardArt, Icon } from '../art';
import { Btn, DemoTag, Header, Processing, Screen, SuccessSheet, Toast, useToast } from '../ui';
import { go, usd, useStore } from '../store';

export function CardsHome() {
  const { s } = useStore();
  return s.card ? <MyCard /> : <CardsWelcome />;
}

function CardsWelcome() {
  return (
    <Screen tab="card" className="cards-welcome">
      <Header title="" onBack={() => go('/gold')} />
      <div className="cw-head">
        <div className="t-caption up">Welcome to</div>
        <h1>David Cards</h1>
      </div>
      <div className="cw-rail">
        <div className="cw-card c1"><CardArt variant="silver" width={230} /></div>
        <div className="cw-card c2"><CardArt variant="blue" width={230} /></div>
        <div className="cw-card c3"><CardArt variant="gold" width={230} /></div>
      </div>
      <p className="t-muted center cw-sub">Shop the world with our cards, we make the world your market place.</p>
      <div className="cw-foot"><Btn onClick={() => go('/cards/tiers')}>Get started</Btn></div>
    </Screen>
  );
}

const CARD_TIERS = [
  { id: 'shepherd', name: 'Shepherd Tier', variant: 'silver' as const, unlocked: true, desc: 'Begin your journey with David’s Shepherd Tier — a starter tier that enables you to carry out card payments.', benefits: 'Spend USDT anywhere Visa is accepted' },
  { id: 'king', name: 'King Tier', variant: 'gold' as const, unlocked: false, desc: 'Metal card with 1% back in gold on every purchase. Unlocks at Gold Tier 2.', benefits: '1% gold back · free ATM withdrawals' },
  { id: 'crown', name: 'Crown Tier', variant: 'black' as const, unlocked: false, desc: 'Private concierge, lounge access and 2% back in gold. Unlocks at Gold Tier 3.', benefits: '2% gold back · concierge · lounges' },
];

export function CardTiers() {
  const [idx, setIdx] = useState(0);
  const [toast, showToast] = useToast();
  const t = CARD_TIERS[idx];
  return (
    <Screen className="card-tiers">
      <Header title="Cards" onBack={() => go('/cards')} />
      <div className="ct-rail" onScroll={(e) => { const el = e.currentTarget; setIdx(Math.round(el.scrollLeft / (el.firstElementChild as HTMLElement).offsetWidth)); }}>
        {CARD_TIERS.map((c) => (
          <div key={c.id} className="ct-slide">
            <div className={`ct-card ${c.unlocked ? '' : 'locked'}`}>
              <div className={`tier-lock ${c.unlocked ? 'open blue' : ''}`}>{c.unlocked ? 'Unlocked' : 'Locked'} <Icon.lock size={11} /></div>
              <CardArt variant={c.variant} width={170} />
              <h3>{c.name}</h3>
              <p className="t-muted center">{c.desc}</p>
              <div className="ct-benefit"><span className="ben-ic"><Icon.gift size={14} /></span><div><b>Card benefits</b><div className="t-caption">{c.benefits}</div></div></div>
            </div>
          </div>
        ))}
      </div>
      <div className="dots dark center-row">{CARD_TIERS.map((_, i) => <span key={i} className={i === idx ? 'on' : ''} />)}</div>
      <div className="cw-foot">
        <Btn onClick={() => (t.unlocked ? go('/cards/details') : showToast(`${t.name} is locked`))} disabled={!t.unlocked}>{t.unlocked ? `Continue with ${t.name}` : 'Locked'}</Btn>
      </div>
      <Toast msg={toast} />
    </Screen>
  );
}

export function CardDetails() {
  const { s, set, addActivity } = useStore();
  const [name, setName] = useState(s.name || 'Andres Lamothe');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const pay = () => {
    setBusy(true);
    setTimeout(() => {
      set((p) => ({ card: { tier: 'Shepherd', last4: String(1000 + Math.floor(Math.random() * 8999)), ts: Date.now() }, usdt: p.usdt - 12, name }));
      addActivity({ kind: 'card', title: 'David Card created', sub: 'Shepherd Tier · creation fee', amount: '−$12.00' });
      setBusy(false); setDone(true);
    }, 2000);
  };
  return (
    <Screen className="card-details">
      <Header title="Card details" onBack={() => go('/cards/tiers')} />
      <div className="cd-card"><CardArt variant="silver" width={300} name={name} /></div>
      <div className="cd-sec">
        <h4>Personal information</h4>
        <div className="kv"><span>Name on card</span><input value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div className="kv"><span>Email</span><b>{s.demoMode ? 'demo@david.app' : (s.name ? s.name : 'Your Privy email')}</b></div>
        <div className="kv"><span>Card type</span><b>Virtual · Visa</b></div>
      </div>
      <div className="cd-sec">
        <h4>Account details</h4>
        <div className="kv"><span>Select account to withdraw from</span><span className="chip-usd"><span className="flag-dot" />USD Wallet</span></div>
      </div>
      <div className="cd-sec">
        <h4>Payment limit</h4>
        <div className="kv"><span>Daily transaction limit</span><b className="pos">$100,000</b></div>
      </div>
      <div className="cd-fees">
        <div className="kv"><span>Creation fee</span><b>$12.0</b></div>
        <div className="kv"><span>Maintenance fee</span><b className="pos">$0.0</b></div>
      </div>
      <div className="cd-foot">
        <DemoTag>Paid from demo test-USDT · {usd(s.usdt, 2)} available</DemoTag>
        <Btn className="wide" onClick={pay}>Pay &amp; Get card</Btn>
      </div>
      <Processing open={busy} label="Processing" />
      <SuccessSheet open={done} title={<>Your card has been <span className="gold-t">created</span> successfully</>} onDone={() => { setDone(false); go('/cards'); }} />
    </Screen>
  );
}

function MyCard() {
  const { s, set } = useStore();
  const [frozen, setFrozen] = useState(false);
  const [toast, showToast] = useToast();
  return (
    <Screen tab="card" className="my-card">
      <Header title="Cards" onBack={() => go('/gold')} />
      <div className={`mc-card ${frozen ? 'frozen' : ''}`}><CardArt variant="silver" width={300} last4={s.card!.last4} name={s.name} /></div>
      <div className="mc-bal"><div className="t-caption">Spendable (test USDT)</div><div className="balance">{usd(s.usdt, 2)}</div></div>
      <div className="mc-actions">
        <button onClick={() => { setFrozen(!frozen); showToast(frozen ? 'Card unfrozen' : 'Card frozen'); }}><span className="action-ic tone-blue"><Icon.lock size={16} /></span>{frozen ? 'Unfreeze' : 'Freeze'}</button>
        <button onClick={() => showToast('Apple Pay needs a live card issuer — not in testnet v1')}><span className="action-ic tone-dark"><Icon.phone size={16} /></span>Apple Pay</button>
        <button onClick={() => go('/trade/gold')}><span className="action-ic tone-purple"><Icon.plus size={16} /></span>Top up</button>
      </div>
      <div className="card cd-sec">
        <div className="kv"><span>Tier</span><b>{s.card!.tier}</b></div>
        <div className="kv"><span>Daily limit</span><b>$100,000</b></div>
        <div className="kv"><span>Status</span><b className={frozen ? '' : 'pos'}>{frozen ? 'Frozen' : 'Active (demo)'}</b></div>
      </div>
      <button className="link muted" onClick={() => { set(() => ({ card: undefined })); }}>Remove demo card</button>
      <Toast msg={toast} />
    </Screen>
  );
}
