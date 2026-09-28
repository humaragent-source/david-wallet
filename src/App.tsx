import React, { useEffect, useRef } from 'react';
import { useCreateWallet, usePrivy, useWallets } from '@privy-io/react-auth';
import { StoreProvider, go, useRoute, useStore, type AssetId } from './store';
import { Creating, Onboarding, SignIn } from './screens/Onboarding';
import { Gold } from './screens/Gold';
import { ClaimCoin, Graduate } from './screens/Claim';
import { Tiers } from './screens/Tiers';
import { CardDetails, CardTiers, CardsHome } from './screens/Cards';
import { Leaderboard, Streak } from './screens/Shake';
import { Rush } from './screens/Rush';
import { Loans } from './screens/Loans';
import { AssetPage, AssetsList, Trade } from './screens/Assets';
import { Profile, Receive, Send, Withdraw } from './screens/Wallet';

function WalletSync() {
  const { ready, authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const { createWallet } = useCreateWallet();
  const { s, set } = useStore();
  const tried = useRef(false);
  useEffect(() => {
    if (!ready || !authenticated || !user) return;
    const embedded = wallets.find((w) => w.walletClientType === 'privy')?.address
      ?? (user.linkedAccounts.find((a) => a.type === 'wallet' && (a as { walletClientType?: string }).walletClientType === 'privy') as { address?: string } | undefined)?.address
      ?? user.wallet?.address;
    const email = user.email?.address;
    if (embedded && (embedded !== s.address || s.demoMode)) set(() => ({ address: embedded, demoMode: false, onboarded: true, name: s.name ?? email?.split('@')[0] }));
    if (!embedded && !tried.current) {
      tried.current = true;
      createWallet().then((w) => set(() => ({ address: w.address }))).catch((e) => console.warn('createWallet', e));
    }
  }, [ready, authenticated, user, wallets, s.address, s.demoMode, set, createWallet, s.name]);
  return null;
}

const PUBLIC = new Set(['welcome', 'signin', 'creating']);

function Router() {
  const [path, parts] = useRoute();
  const { ready, authenticated } = usePrivy();
  const { s } = useStore();
  const allowed = authenticated || s.demoMode;
  const head = parts[0] ?? '';
  const q = new URLSearchParams(path.split('?')[1] ?? '');

  useEffect(() => {
    if (!ready) return;
    if (head === '') go(!s.onboarded ? '/welcome' : allowed ? '/gold' : '/signin');
    else if (!PUBLIC.has(head) && !allowed) go(s.onboarded ? '/signin' : '/welcome');
  }, [ready, head, allowed, s.onboarded]);

  if (!ready && !PUBLIC.has(head)) return <Splash />;
  if (!PUBLIC.has(head) && !allowed) return <Splash />;

  switch (head) {
    case 'welcome': return <Onboarding />;
    case 'signin': return <SignIn />;
    case 'creating': return <Creating />;
    case 'gold': return <Gold />;
    case 'claim': return <ClaimCoin key={path} />;
    case 'graduate': return <Graduate key={path} />;
    case 'tiers': return <Tiers />;
    case 'cards': return parts[1] === 'tiers' ? <CardTiers /> : parts[1] === 'details' ? <CardDetails /> : <CardsHome />;
    case 'shake': return <Streak />;
    case 'leaderboard': return <Leaderboard />;
    case 'rush': return <Rush key={path} />;
    case 'loans': return <Loans />;
    case 'assets': return <AssetsList />;
    case 'asset': return <AssetPage id={(parts[1] ?? 'silver') as AssetId} />;
    case 'trade': return <Trade key={path} id={(parts[1] ?? 'gold') as AssetId} side={q.get('side') === 'sell' ? 'sell' : 'buy'} />;
    case 'send': return <Send />;
    case 'withdraw': return <Withdraw />;
    case 'receive': return <Receive />;
    case 'profile': return <Profile />;
    default: return <Splash />;
  }
}

function Splash() {
  return <div className="screen splash"><div className="splash-logo">David</div><div className="spinner dark" /></div>;
}

export default function App() {
  return (
    <StoreProvider>
      <WalletSync />
      <div className="device">
        <div className="testnet-ribbon">TESTNET · demo balances · no real money</div>
        <Router />
      </div>
    </StoreProvider>
  );
}
