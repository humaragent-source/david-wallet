import React, { useEffect, useRef, useState } from 'react';
import { useLoginWithEmail, usePrivy } from '@privy-io/react-auth';
import { Car, Coin, Crown, Eiffel, Flag, GoldBar, House, Icon } from '../art';
import { Btn } from '../ui';
import { go, haptic, useStore } from '../store';

type Group = {
  id: 'gold' | 'transact' | 'save';
  kicker: string;
  title: string;
  sub: string;
  chips: { pill: string; hero: React.ReactNode; caption?: React.ReactNode }[];
};

function Powered() {
  return <div className="powered"><span>Powered by</span><b>Tether Gold</b><Coin size={16} shine={false} /></div>;
}
function Pair({ cur }: { cur: string }) {
  return <div className="pair"><span className="pair-c">{cur}</span><Icon.swap size={14} /><span className="pair-c usdt">₮ USDT</span></div>;
}

const GROUPS: Group[] = [
  {
    id: 'gold',
    kicker: 'Trade Gold',
    title: 'Trade and earn gold daily',
    sub: 'Unlock your financial freedom — welcome to a future that moves at your speed.',
    chips: [
      { pill: 'True Gold Coin', hero: <Coin size={196} />, caption: <Powered /> },
      { pill: 'True Gold Bar', hero: <div className="bar-stand"><GoldBar size={250} /></div>, caption: <Powered /> },
      { pill: 'Vault', hero: <Crown size={210} />, caption: <Powered /> },
    ],
  },
  {
    id: 'transact',
    kicker: 'Transact',
    title: 'Exchange and make transactions fast & easy',
    sub: 'Send and spend with stablecoins — settled on-chain in seconds.',
    chips: [
      { pill: 'EUR', hero: <Flag code="fr" size={168} />, caption: <Pair cur="EUR" /> },
      { pill: 'GBP', hero: <Flag code="gb" size={168} />, caption: <Pair cur="GBP" /> },
      { pill: 'USD', hero: <Flag code="us" size={168} />, caption: <Pair cur="USD" /> },
    ],
  },
  {
    id: 'save',
    kicker: 'Save',
    title: 'Save for your projected life goals',
    sub: 'Put your savings in gold and watch your goals move closer.',
    chips: [
      { pill: 'Housing', hero: <House size={200} /> },
      { pill: 'Travelling', hero: <Eiffel size={200} /> },
      { pill: 'Car', hero: <Car size={230} /> },
    ],
  },
];

export function Onboarding() {
  const [g, setG] = useState(0);
  const [chip, setChip] = useState(0);
  const { set } = useStore();
  const group = GROUPS[g];
  const touch = useRef<number | null>(null);

  useEffect(() => {
    const t = setInterval(() => setChip((c) => (c + 1) % group.chips.length), 2800);
    return () => clearInterval(t);
  }, [g, group.chips.length]);

  const next = () => {
    haptic('selection');
    if (g < GROUPS.length - 1) { setG(g + 1); setChip(0); }
    else { set(() => ({ onboarded: true })); go('/signin'); }
  };
  const prev = () => { if (g > 0) { setG(g - 1); setChip(0); } };
  const c = group.chips[chip];

  return (
    <div className={`screen onb onb-${group.id}`}
      onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
      onTouchEnd={(e) => { if (touch.current == null) return; const dx = e.changedTouches[0].clientX - touch.current; if (dx < -40) next(); if (dx > 40) prev(); touch.current = null; }}>
      <div className="onb-glow" />
      <div className="onb-top">
        <div className="chip-rail">
          {group.chips.map((ch, i) => (
            <button key={ch.pill} className={`onb-pill p-${group.id} ${i === chip ? 'on' : 'faded'}`} onClick={() => setChip(i)}>{ch.pill}</button>
          ))}
        </div>
        <button className="skip" onClick={() => { set(() => ({ onboarded: true })); go('/signin'); }}>Skip</button>
      </div>
      <div className="onb-hero" key={`${g}-${chip}`}>
        <div className="hero-float">{c.hero}</div>
        {c.caption && <div className="onb-caption">{c.caption}</div>}
      </div>
      <div className="onb-copy" key={'c' + g}>
        <div className={`kicker k-${group.id}`}>{group.kicker}</div>
        <h1>{group.title}</h1>
        <p>{group.sub}</p>
      </div>
      <div className="onb-foot">
        <div className="dots">
          {GROUPS.map((_, i) => <span key={i} className={i === g ? 'on' : ''} />)}
        </div>
        <button className="continue" onClick={next}>Continue</button>
      </div>
    </div>
  );
}

/* ============================ Email + OTP ============================ */
export function SignIn() {
  const { ready, authenticated } = usePrivy();
  const { set } = useStore();
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [code, setCode] = useState<string[]>(Array(6).fill(''));
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const { sendCode, loginWithCode } = useLoginWithEmail({
    onComplete: () => { set(() => ({ demoMode: false, onboarded: true })); go('/creating'); },
    onError: (e) => { setBusy(false); setErr(explain(String(e))); },
  });

  useEffect(() => { if (ready && authenticated) go('/gold'); }, [ready, authenticated]);

  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const submitEmail = async () => {
    if (!valid) return;
    setErr(null); setBusy(true);
    try { await sendCode({ email }); setStep('code'); setTimeout(() => inputs.current[0]?.focus(), 350); }
    catch (e) { setErr(explain(String((e as Error)?.message ?? e))); }
    finally { setBusy(false); }
  };
  const submitCode = async (digits: string[]) => {
    const c = digits.join('');
    if (c.length !== 6) return;
    setErr(null); setBusy(true);
    try { await loginWithCode({ code: c }); }
    catch (e) { setBusy(false); setErr(explain(String((e as Error)?.message ?? e))); setCode(Array(6).fill('')); inputs.current[0]?.focus(); }
  };
  const onDigit = (k: number, v: string) => {
    const clean = v.replace(/\D/g, '');
    if (clean.length > 1) { // paste / iOS one-time-code autofill
      const arr = clean.slice(0, 6).split('');
      const filled = [...arr, ...Array(6 - arr.length).fill('')];
      setCode(filled); inputs.current[Math.min(arr.length, 5)]?.focus();
      if (arr.length === 6) submitCode(filled);
      return;
    }
    const nextCode = [...code]; nextCode[k] = clean; setCode(nextCode);
    if (clean && k < 5) inputs.current[k + 1]?.focus();
    if (nextCode.every((d) => d)) submitCode(nextCode);
  };

  return (
    <div className="screen signin">
      <div className="aurora"><div className="a1" /><div className="a2" /><div className="a3" /></div>
      <div className="signin-top">
        <button className="sq glass" onClick={() => (step === 'code' ? setStep('email') : go('/welcome'))} aria-label="Back"><Icon.back size={16} /></button>
        <span className="signin-label">{step === 'email' ? 'Creating account' : 'Verify email'}</span>
      </div>
      <div className="signin-body">
        <div className="signin-icon"><Icon.user size={16} /></div>
        {step === 'email' ? (
          <>
            <h2>Enter email</h2>
            <p className="t-muted">We’ll send a 6-digit code to sign you in and create your self-custodial wallet on Base Sepolia testnet.</p>
            <label className="field">
              <span>Email address</span>
              <input type="email" inputMode="email" autoComplete="email" placeholder="you@example.com" value={email}
                onChange={(e) => setEmail(e.target.value.trim())} onKeyDown={(e) => e.key === 'Enter' && submitEmail()} />
            </label>
          </>
        ) : (
          <>
            <h2>Enter code</h2>
            <p className="t-muted">Sent to <b>{email}</b>. Check your inbox (and spam) for a code from Privy.</p>
            <div className="otp">
              {code.map((d, k) => (
                <input key={k} ref={(el) => (inputs.current[k] = el)} value={d} inputMode="numeric" autoComplete={k === 0 ? 'one-time-code' : 'off'}
                  maxLength={k === 0 ? 6 : 1} aria-label={`Digit ${k + 1}`}
                  onChange={(e) => onDigit(k, e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Backspace' && !code[k] && k > 0) inputs.current[k - 1]?.focus(); }} />
              ))}
            </div>
            <button className="link" onClick={submitEmail} disabled={busy}>Resend code</button>
          </>
        )}
        {err && <div className="err">{err}</div>}
      </div>
      <div className="signin-foot">
        <div className="secured"><Icon.lock size={13} /> Secured by Privy · keys never leave your device</div>
        {step === 'email'
          ? <Btn onClick={submitEmail} disabled={!valid || busy || !ready} className="wide">{busy ? 'Sending…' : !ready ? 'Loading…' : 'Continue'}</Btn>
          : <Btn onClick={() => submitCode(code)} disabled={code.join('').length !== 6 || busy} className="wide">{busy ? 'Verifying…' : 'Verify & create wallet'}</Btn>}
        <button className="link muted" onClick={() => { set(() => ({ demoMode: true, onboarded: true })); go('/gold'); }}>Explore in demo mode (no login)</button>
      </div>
    </div>
  );
}

function explain(e: string) {
  const origin = window.location.origin;
  if (/origin|domain|not allowed|cors/i.test(e)) return `Login blocked for ${origin}. Add this domain to the Privy dashboard → Allowed domains. (${e})`;
  if (/invalid.*code|incorrect/i.test(e)) return 'That code didn’t match. Try again or resend.';
  return e.replace(/^Error:\s*/, '');
}

/* Shown after successful OTP while the embedded wallet is created */
export function Creating() {
  const { s } = useStore();
  useEffect(() => { if (s.address) { const t = setTimeout(() => go('/gold'), 1400); return () => clearTimeout(t); } }, [s.address]);
  useEffect(() => { const t = setTimeout(() => go('/gold'), 9000); return () => clearTimeout(t); }, []);
  return (
    <div className="screen creating">
      <div className="aurora"><div className="a1" /><div className="a2" /><div className="a3" /></div>
      <div className="creating-body">
        <div className="vault-spin"><Coin size={120} /></div>
        <h2>{s.address ? 'Your wallet is ready' : 'Creating your wallet'}</h2>
        <p className="t-muted">{s.address ? <>Base Sepolia · <span className="mono">{s.address.slice(0, 6)}…{s.address.slice(-4)}</span></> : 'Generating a self-custodial key on Base Sepolia testnet…'}</p>
      </div>
    </div>
  );
}
