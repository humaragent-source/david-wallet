import React, { useEffect, useState } from 'react';
import { usePrivy, useSignMessage } from '@privy-io/react-auth';
import { QRCodeSVG } from 'qrcode.react';
import { createPublicClient, formatEther, http } from 'viem';
import { baseSepolia } from 'viem/chains';
import { Coin, Icon } from '../art';
import { Btn, DemoTag, Header, Keypad, Processing, Screen, SuccessSheet, Toast, useToast } from '../ui';
import { go, oz, short, usd2, useStore } from '../store';

const client = createPublicClient({ chain: baseSepolia, transport: http('https://sepolia.base.org') });

export function useEthBalance(address?: string) {
  const [bal, setBal] = useState<string | null>(null);
  useEffect(() => {
    if (!address) return;
    let on = true;
    const pull = () => client.getBalance({ address: address as `0x${string}` }).then((b) => on && setBal(formatEther(b))).catch(() => on && setBal(null));
    pull(); const t = setInterval(pull, 20000);
    return () => { on = false; clearInterval(t); };
  }, [address]);
  return bal;
}

/* ---------------- Send (gold) ---------------- */
export function Send() {
  const { s, set, goldPrice, addActivity } = useStore();
  const [to, setTo] = useState('');
  const [amt, setAmt] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const v = parseFloat(amt || '0');
  const charge = v > 0 ? 1 : 0;
  const receive = Math.max(0, v - charge);
  const maxUsd = s.goldOz * goldPrice;
  const validTo = /^0x[a-fA-F0-9]{40}$/.test(to) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to);
  const send = () => {
    setBusy(true);
    setTimeout(() => {
      set((p) => ({ goldOz: Math.max(0, p.goldOz - v / goldPrice) }));
      addActivity({ kind: 'send', title: 'Gold sent', sub: `To ${to.startsWith('0x') ? short(to) : to}`, amount: `−${(v / goldPrice).toFixed(4)} oz` });
      setBusy(false); setDone(true);
    }, 1500);
  };
  return (
    <Screen className="send">
      <Header title="Send gold" onBack={() => go('/gold')} />
      <label className="field compact to-field"><span>To</span><input placeholder="0x… address or email" value={to} onChange={(e) => setTo(e.target.value.trim())} /></label>
      <div className="fee-rows tight">
        <div><span>Charges</span><b>{usd2(charge)}</b></div>
        <div><span>Amount they receive</span><b>{usd2(receive)}</b></div>
      </div>
      <div className="amount"><div className={`amount-v ${v > maxUsd ? 'neg' : ''}`}>${amt || '0'}</div><div className="t-caption">≈ {oz(v / goldPrice, 4)} · available {usd2(maxUsd)}</div></div>
      <Keypad value={amt} onChange={setAmt} />
      <div className="trade-foot"><Btn className="wide" disabled={!v || v > maxUsd || !validTo} onClick={send}>{!validTo && to ? 'Enter a valid address' : 'Send'}</Btn></div>
      <Processing open={busy} label="Sending" />
      <SuccessSheet open={done} title="Gold sent" body={`${usd2(receive)} of gold is on its way (simulated on testnet).`} onDone={() => { setDone(false); go('/gold'); }} />
    </Screen>
  );
}

/* ---------------- Withdrawal (to bank, demo) ---------------- */
export function Withdraw() {
  const { s, set, goldPrice, addActivity } = useStore();
  const [amt, setAmt] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const v = parseFloat(amt || '0');
  const maxUsd = s.goldOz * goldPrice;
  const go2 = () => {
    setBusy(true);
    setTimeout(() => {
      set((p) => ({ goldOz: Math.max(0, p.goldOz - v / goldPrice) }));
      addActivity({ kind: 'withdraw', title: 'Withdrawal', sub: 'To bank •••• 4021', amount: `−${usd2(v)}` });
      setBusy(false); setDone(true);
    }, 1500);
  };
  return (
    <Screen className="send">
      <Header title="Withdrawal" onBack={() => go('/gold')} />
      <div className="bank-row"><span className="action-ic tone-green"><Icon.bank size={16} /></span><div><div className="t-strong-sm">Bank account •••• 4021</div><div className="t-caption">Demo payout rail · 1–2 business days</div></div></div>
      <div className="amount"><div className={`amount-v ${v > maxUsd ? 'neg' : ''}`}>${amt || '0'}</div><div className="t-caption">Sell gold → cash out · available {usd2(maxUsd)}</div></div>
      <Keypad value={amt} onChange={setAmt} />
      <div className="trade-foot"><Btn className="wide" disabled={!v || v > maxUsd} onClick={go2}>Withdraw</Btn></div>
      <Processing open={busy} label="Processing withdrawal" />
      <SuccessSheet open={done} title="Withdrawal requested" body="Simulated — no bank transfer happens on testnet." onDone={() => { setDone(false); go('/gold'); }} />
    </Screen>
  );
}

/* ---------------- Receive (real embedded wallet address) ---------------- */
export function Receive() {
  const { s } = useStore();
  const [toast, showToast] = useToast();
  const bal = useEthBalance(s.address);
  const addr = s.address;
  return (
    <Screen className="receive">
      <Header title="Receive" onBack={() => go('/gold')} />
      <div className="card qr-card">
        {addr ? <QRCodeSVG value={addr} size={196} level="M" fgColor="#111" /> : <div className="qr-empty"><Coin size={80} /><p className="t-muted center">Sign in with email to get your own testnet wallet address.</p></div>}
        <div className="t-caption">Your Base Sepolia address</div>
        <div className="addr mono">{addr ?? 'Demo mode — no wallet'}</div>
        {addr && <Btn small variant="light" onClick={() => { navigator.clipboard?.writeText(addr); showToast('Address copied'); }}><Icon.copy size={14} /> Copy address</Btn>}
      </div>
      <div className="card fee-rows">
        <div><span>Network</span><b>Base Sepolia (testnet)</b></div>
        <div><span>Test ETH balance</span><b>{addr ? (bal == null ? '…' : `${Number(bal).toFixed(5)} ETH`) : '—'}</b></div>
      </div>
      <p className="fine center">Only send testnet tokens. Need test ETH? Use a Base Sepolia faucet, e.g. <a href="https://docs.base.org/tools/network-faucets" target="_blank" rel="noreferrer">docs.base.org/tools/network-faucets</a>.</p>
      <Toast msg={toast} />
    </Screen>
  );
}

/* ---------------- Profile / account ---------------- */
export function Profile() {
  const { s, set, reset } = useStore();
  const { user, authenticated, logout } = usePrivy();
  const { signMessage } = useSignMessage();
  const [sig, setSig] = useState<string | null>(null);
  const [toast, showToast] = useToast();
  const bal = useEthBalance(s.address);
  const email = user?.email?.address;
  return (
    <Screen className="profile">
      <Header title="Account" onBack={() => go('/gold')} />
      <div className="prof-top">
        <div className="prof-av">{(email ?? 'D')[0].toUpperCase()}</div>
        <div className="t-strong">{email ?? (s.demoMode ? 'Demo mode' : 'Not signed in')}</div>
        {s.demoMode && !authenticated ? <DemoTag>No login · local demo</DemoTag> : <span className="pill pill-green">Signed in with Privy</span>}
      </div>
      <div className="card fee-rows">
        <div><span>Wallet</span><b className="mono">{s.address ? short(s.address) : '—'}</b></div>
        <div><span>Type</span><b>{s.address ? 'Privy embedded (self-custodial)' : '—'}</b></div>
        <div><span>Network</span><b>Base Sepolia · chain 84532</b></div>
        <div><span>Test ETH</span><b>{s.address ? (bal == null ? '…' : `${Number(bal).toFixed(5)} ETH`) : '—'}</b></div>
        {s.address && <div><span>Explorer</span><b><a href={`https://sepolia.basescan.org/address/${s.address}`} target="_blank" rel="noreferrer">View on BaseScan</a></b></div>}
      </div>
      {authenticated && s.address && (
        <div className="card">
          <div className="t-strong-sm">Prove wallet control</div>
          <p className="t-muted">Signs a message with your embedded wallet key — real cryptography, no gas.</p>
          <Btn small variant="dark" onClick={async () => {
            try { const r = await signMessage({ message: `David wallet check · ${new Date().toISOString()}` }, { uiOptions: { title: 'Sign a test message' } }); setSig(typeof r === 'string' ? r : (r as { signature: string }).signature); }
            catch (e) { showToast(String((e as Error).message ?? e).slice(0, 80)); }
          }}>Sign test message</Btn>
          {sig && <div className="sig mono">{sig.slice(0, 26)}…{sig.slice(-10)}</div>}
        </div>
      )}
      <div className="card fee-rows">
        <div><span>Gold (demo)</span><b>{oz(s.goldOz, 4)}</b></div>
        <div><span>Test USDT (demo)</span><b>{usd2(s.usdt)}</b></div>
        <div><span>Coins / bars claimed</span><b>{s.claimedCoins} / {s.claimedBars}</b></div>
      </div>
      <div className="prof-actions">
        <Btn variant="light" onClick={() => { reset(); showToast('Demo data reset'); }}>Reset demo data</Btn>
        <Btn variant="light" onClick={() => { set(() => ({ onboarded: false })); go('/welcome'); }}>Replay onboarding</Btn>
        {(authenticated || s.demoMode) && <Btn variant="dark" onClick={async () => { if (authenticated) await logout(); set(() => ({ demoMode: false, address: undefined })); go('/signin'); }}><Icon.logout size={15} /> Log out</Btn>}
      </div>
      <Toast msg={toast} />
    </Screen>
  );
}
