import React, { useRef, useState } from 'react';
import { Coin, Crown, GoldBar, Icon } from '../art';
import { Header, Screen } from '../ui';
import { TIERS, go, usd, useStore } from '../store';

export function Tiers() {
  const { s, goldUsd } = useStore();
  const [idx, setIdx] = useState(Math.max(0, s.tier - 1));
  const ref = useRef<HTMLDivElement>(null);
  const onScroll = () => {
    const el = ref.current; if (!el) return;
    setIdx(Math.round(el.scrollLeft / (el.firstElementChild as HTMLElement).offsetWidth));
  };
  return (
    <Screen className="tiers-screen">
      <Header title="Tiers" onBack={() => go('/gold')} />
      <p className="t-muted center tiers-intro">Grow your Gold Reserve to unlock real, deliverable gold.</p>
      <div className="tier-rail" ref={ref} onScroll={onScroll}>
        {TIERS.map((t, i) => {
          const unlocked = s.tier >= t.n;
          const pct = Math.max(0, Math.min(1, (goldUsd - t.from) / (t.to - t.from)));
          const status = s.tier > t.n ? 1 : s.tier === t.n ? pct : 0;
          return (
            <div className="tier-card-wrap" key={t.n}>
              <div className={`tier-card ${unlocked ? '' : 'locked'} t${t.n}`}>
                <div className={`tier-lock ${unlocked ? 'open' : ''}`}>{unlocked ? 'Unlocked' : 'Locked'} <Icon.lock size={11} /></div>
                <div className="tier-art">
                  {t.n === 1 && <div className="black-coin"><Coin size={150} /></div>}
                  {t.n === 2 && <GoldBar size={210} />}
                  {t.n === 3 && <Crown size={190} />}
                </div>
                <div className="tier-info">
                  <h2>Tier {t.n}</h2>
                  <span className="tier-chip">{t.name}</span>
                  <p className="t-muted">{t.blurb}</p>
                  <div className="tier-range">{usd(t.from)} – {usd(t.to)}</div>
                  <div className="tier-status">
                    <span className="t-caption">Status</span>
                    <div className="track-bar"><div className="track-fill" style={{ width: `${status * 100}%` }} /></div>
                    <span className="t-strong-sm">{Math.round(status * 100)}% complete</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="dots dark center-row">{TIERS.map((_, i) => <span key={i} className={i === idx ? 'on' : ''} />)}</div>
    </Screen>
  );
}
