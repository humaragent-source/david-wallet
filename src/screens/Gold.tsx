import React, { useEffect, useMemo, useState } from 'react';
import { Coin, Crown, GoldBar, Icon } from '../art';
import { Chart, DemoTag, Header, Ring, Screen, Sheet, Toast, useToast } from '../ui';
import {
  ASSETS,
  TIERS,
  ago,
  go,
  haptic,
  formatOz,
  formatUsd,
  formatUsd0,
  series,
  useStore,
  type Activity,
} from '../store';
import { goalOzAtPrice, rushAvailableNow as rushAvail, TIER_1_MAX_USD, TIER_2_MAX_USD } from '../spec';

// re-export helpers used elsewhere

const RANGES = ['Live', '4H', '1D', '1W', '1M', 'Max'] as const;
type Range = (typeof RANGES)[number];
const RANGE_CFG: Record<Range, [number, number, number]> = {
  Live: [1, 40, 0.0006],
  '4H': [2, 48, 0.0012],
  '1D': [3, 48, 0.002],
  '1W': [4, 42, 0.006],
  '1M': [5, 40, 0.012],
  Max: [6, 60, 0.03],
};

export function tierState(portfolioUsd: number, tier: number) {
  const t = TIERS[tier - 1];
  const span = t.to === Number.POSITIVE_INFINITY ? Math.max(portfolioUsd - t.from, 1) : t.to - t.from;
  const pct = t.to === Number.POSITIVE_INFINITY ? 1 : Math.max(0, Math.min(1, (portfolioUsd - t.from) / span));
  const ready = t.to === Number.POSITIVE_INFINITY ? false : portfolioUsd >= t.to;
  return { t, pct, ready };
}

export function Gold() {
  const { s, set, prices, goldPrice, goldUsd, portfolioUsd } = useStore();
  const [hide, setHide] = useState(false);
  const [range, setRange] = useState<Range>('1D');
  const [menu, setMenu] = useState(false);
  const [toast, showToast] = useToast();
  const [liveTicks, setLiveTicks] = useState<number[]>([]);
  const { t, pct, ready } = tierState(portfolioUsd, s.tier);
  const gp = prices.gold;
  const goalLabel =
    t.to === Number.POSITIVE_INFINITY
      ? 'Open-ended'
      : `Goal ${formatUsd0(t.to)} (≈ ${formatOz(goalOzAtPrice(t.to, goldPrice), 3)} at current price)`;
  const rushOk = rushAvail(s.lastRushDay).ok || !!s.rushForceOpen;

  useEffect(() => {
    setLiveTicks((l) => [...l, goldPrice].slice(-40));
  }, [goldPrice]);
  const data = useMemo(() => {
    const [seed, n, vol] = RANGE_CFG[range];
    const base = series(seed * 7 + 3, n, goldPrice, vol);
    if (range === 'Live' && liveTicks.length > 1) return [...base.slice(0, Math.max(2, n - liveTicks.length)), ...liveTicks];
    return base;
  }, [range, goldPrice, liveTicks]);
  const change = ((data[data.length - 1] - data[0]) / data[0]) * 100;

  const hero =
    s.tier === 1 ? (
      <button
        className="hero-btn"
        onClick={() => (ready ? go('/claim/coin') : showToast(`${Math.round(pct * 100)}% to your True Gold Coin`))}
      >
        <Coin size={172} fill={pct} className={ready ? 'coin-ready' : 'coin-filling'} />
      </button>
    ) : s.tier === 2 ? (
      <button className="hero-btn" onClick={() => go('/graduate')}>
        <GoldBar size={236} fill={pct} />
        <span className="hero-hint">{ready ? 'Your bar is ready' : `${(pct * 100).toFixed(1)}% cast · tap to watch the pour`}</span>
      </button>
    ) : (
      <Crown size={200} />
    );

  return (
    <Screen tab="gold" className={`gold-home ${ready && s.tier < 3 ? 'has-claim' : ''}`}>
      <Header
        left={
          <button className="avatar" onClick={() => go('/profile')} aria-label="Profile">
            <Icon.user size={16} />
          </button>
        }
        title="Gold"
        right={
          <>
            <button className="flame-btn" onClick={() => go('/shake')} aria-label="Streak">
              <Icon.flame size={15} color="#fff" />
            </button>
            <button className="sq" onClick={() => setMenu(true)} aria-label="More">
              <Icon.dots size={16} />
            </button>
          </>
        }
      />

      <section className="reserve">
        <div className="t-caption">Your Gold Reserve</div>
        <div className="balance">{hide ? '••••••' : formatUsd0(goldUsd)}</div>
        <div className="t-caption">≈ {hide ? '•••' : formatOz(s.goldOz, 3)}</div>
        <div className="tier-row">
          <span className="t-caption">Tier {s.tier}</span>
          <span className="tier-chip">{t.name}</span>
          <button className="eye" onClick={() => setHide(!hide)} aria-label="Hide balance">
            {hide ? <Icon.eyeOff size={14} /> : <Icon.eye size={14} />}
          </button>
        </div>
        <div className="t-caption" style={{ marginTop: 4 }}>
          Portfolio {hide ? '••••' : formatUsd0(portfolioUsd)} · tier from total portfolio
        </div>
      </section>

      <section className="actions">
        <Action tone="purple" label="Buy" icon={<Icon.plus size={18} stroke={2.6} />} onClick={() => go('/trade/gold')} />
        <Action tone="blue" label="Send" icon={<Icon.send size={16} />} onClick={() => go('/send')} />
        <Action tone="green" label="Withdrawal" icon={<Icon.withdraw size={16} />} onClick={() => go('/withdraw')} />
        <Action tone="orange" label="Receive" icon={<Icon.receive size={16} />} onClick={() => go('/receive')} />
      </section>

      <section className="hero">{hero}</section>

      <section className="card progress-card" onClick={() => go('/tiers')}>
        <div className="row between">
          <div>
            <div className="t-strong-sm">Your current progress</div>
            <div className="progress-val">{hide ? '••••' : formatUsd0(portfolioUsd)}</div>
            <div className="t-caption">{t.to === Number.POSITIVE_INFINITY ? 'Vault tier · no upper bound' : `Goal of ${formatUsd0(t.to)}`}</div>
          </div>
          <Ring pct={pct} />
        </div>
        <div className="track">
          <span className="knob start" />
          <div className="track-bar">
            <div className="track-fill" style={{ width: `${pct * 100}%` }} />
          </div>
          <span className={`knob end ${ready ? 'done' : ''}`} />
        </div>
        <div className="row between t-caption2">
          <span>Start</span>
          <span>{goalLabel}</span>
        </div>
        <div className="tiers-link">
          Tiers breakdown <Icon.chev size={12} />
        </div>
      </section>

      <section className="card chart-card">
        <div className="row between">
          <div>
            <div className="t-caption">Gold spot · per troy oz</div>
            <div className="price-big">{formatUsd(gp.price)}</div>
            <div className={`chg ${change >= 0 ? 'up' : 'down'}`}>
              {change >= 0 ? '▲' : '▼'} {Math.abs(change).toFixed(2)}% <span className="t-caption">{range}</span>
            </div>
          </div>
          <div className="src">
            {gp.live && !gp.stale ? <span className="live-dot">Live</span> : <DemoTag>{gp.stale ? 'Stale' : 'Seed'}</DemoTag>}
          </div>
        </div>
        <Chart data={data} live={range === 'Live'} />
        <div className="seg">
          {RANGES.map((r) => (
            <button
              key={r}
              className={r === range ? 'on' : ''}
              onClick={() => {
                haptic('selection');
                setRange(r);
              }}
            >
              {r}
            </button>
          ))}
        </div>
        <div className="fine">{gp.source ? `Spot from ${gp.source}. ` : ''}{gp.stale ? 'Last known price (feed unavailable). ' : ''}Historical curve is illustrative.</div>
      </section>

      <section
        className={`rush-promo ${rushOk ? '' : 'dim'}`}
        onClick={() => {
          if (rushOk || s.demoMode) go('/rush');
          else showToast(rushAvail(s.lastRushDay).reason ?? 'Gold Rush unavailable');
        }}
      >
        <div className="rush-rays" />
        <div>
          <div className="rush-kicker">{rushOk ? 'Live event' : 'Event gated'}</div>
          <div className="rush-title">GOLD RUSH</div>
          <div className="rush-sub">2-min shake · $250 pool · 10 mg cap · 1/day</div>
        </div>
        <Coin size={62} />
      </section>

      <section className="activity">
        <div className="row between">
          <h3>Activity</h3>
          <span className="t-caption">Testnet demo</span>
        </div>
        {s.activity.slice(0, 8).map((a) => (
          <ActivityRow key={a.id} a={a} />
        ))}
      </section>

      {ready && s.tier < 3 && (
        <div className="claim-bar" onClick={() => go(s.tier === 1 ? '/claim/coin' : '/graduate')}>
          <span>
            Your Gold {s.tier === 1 ? 'Coin' : 'Bar'} is Ready <Icon.chev size={12} />
          </span>
          <button className="claim-btn">
            Claim It!!! <span className="claim-dot" />
          </button>
        </div>
      )}

      <Sheet open={menu} onClose={() => setMenu(false)}>
        <div className="sheet-body">
          <h3>Demo controls</h3>
          <p className="t-muted">Everything here is simulated on testnet so you can walk every flow.</p>
          <MenuItem
            icon={<Coin size={26} shine={false} />}
            label="Fill my coin (reach $3,586 portfolio)"
            onClick={() => {
              set(() => ({ tier: 1, goldOz: (TIER_1_MAX_USD / goldPrice) * 1.004 }));
              setMenu(false);
            }}
          />
          <MenuItem
            icon={<GoldBar size={30} />}
            label="Graduate: reach Tier 2 goal (gold pour)"
            onClick={() => {
              set(() => ({ tier: 2, goldOz: (TIER_2_MAX_USD / goldPrice) * 1.02 }));
              setMenu(false);
              go('/graduate');
            }}
          />
          <MenuItem
            icon={<Icon.flame size={20} color="#F2A516" />}
            label="Shake ’n’ Earn"
            onClick={() => {
              setMenu(false);
              go('/shake');
            }}
          />
          <MenuItem
            icon={
              <span className="mini-black">
                <Coin size={18} shine={false} />
              </span>
            }
            label="Force-open Gold Rush (demo)"
            onClick={() => {
              set(() => ({ rushForceOpen: true }));
              setMenu(false);
              go('/rush');
            }}
          />
          <MenuItem
            icon={<Icon.trophy size={20} />}
            label="Tiers"
            onClick={() => {
              setMenu(false);
              go('/tiers');
            }}
          />
          <MenuItem
            icon={<Icon.user size={20} />}
            label="Wallet & account"
            onClick={() => {
              setMenu(false);
              go('/profile');
            }}
          />
          <MenuItem
            icon={<Icon.close size={18} />}
            label="Reset demo balances"
            onClick={() => {
              set(() => ({
                tier: 1,
                goldOz: 0.6,
                claimedCoins: 0,
                claimedBars: 0,
                lastClaim: undefined,
                lastRushDay: undefined,
                lastShakeDay: undefined,
                earnedMg: 0,
                pendingRewardsMg: 0,
              }));
              setMenu(false);
              showToast('Demo balances reset');
            }}
          />
        </div>
      </Sheet>
      <Toast msg={toast} />
    </Screen>
  );
}

function Action({ tone, label, icon, onClick }: { tone: string; label: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button
      className="action"
      onClick={() => {
        haptic('selection');
        onClick();
      }}
    >
      <span className={`action-ic tone-${tone}`}>{icon}</span>
      <span className="action-l">{label}</span>
    </button>
  );
}

function MenuItem({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      className="menu-item"
      onClick={() => {
        haptic('selection');
        onClick();
      }}
    >
      <span className="mi-ic">{icon}</span>
      <span>{label}</span>
      <Icon.chev size={14} />
    </button>
  );
}

const ACT_TONE: Record<Activity['kind'], string> = {
  buy: 'purple',
  sell: 'purple',
  send: 'blue',
  receive: 'orange',
  withdraw: 'green',
  reward: 'gold',
  claim: 'gold',
  loan: 'dark',
  card: 'dark',
};
export function ActivityRow({ a }: { a: Activity }) {
  const ic = {
    buy: <Icon.plus size={15} />,
    sell: <Icon.swap size={15} />,
    send: <Icon.send size={14} />,
    receive: <Icon.receive size={14} />,
    withdraw: <Icon.withdraw size={14} />,
    reward: <Icon.flame size={14} />,
    claim: <Icon.truck size={14} />,
    loan: <Icon.bank size={14} />,
    card: <Icon.card size={14} />,
  }[a.kind];
  return (
    <div className="act-row">
      <span className={`act-ic tone-${ACT_TONE[a.kind]}`}>{ic}</span>
      <div className="act-main">
        <div className="t-strong-sm">{a.title}</div>
        <div className="t-caption">{a.sub}</div>
      </div>
      <div className="act-right">
        <div className={`t-strong-sm ${a.positive ? 'pos' : ''}`}>{a.amount}</div>
        <div className="t-caption">{ago(a.ts)}</div>
      </div>
    </div>
  );
}
export { ASSETS };
