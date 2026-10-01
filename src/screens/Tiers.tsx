import React, { useEffect, useRef, useState } from 'react';
import { Coin, Crown, GoldBar, Icon } from '../art';
import { Header, Screen } from '../ui';
import { TIERS, go, formatUsd0, useStore } from '../store';
import { goalOzAtPrice } from '../spec';

export function Tiers() {
  const { s, portfolioUsd, goldPrice } = useStore();
  const [idx, setIdx] = useState(Math.max(0, s.tier - 1));
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const slide = el.children[s.tier - 1] as HTMLElement | undefined;
    if (slide) el.scrollTo({ left: slide.offsetLeft - 30, behavior: 'instant' as ScrollBehavior });
    setIdx(s.tier - 1);
  }, [s.tier]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (vis) {
          const i = Number((vis.target as HTMLElement).dataset.i);
          if (!Number.isNaN(i)) setIdx(i);
        }
      },
      { root: el, threshold: [0.55] },
    );
    Array.from(el.children).forEach((c) => obs.observe(c));
    return () => obs.disconnect();
  }, []);

  return (
    <Screen className="tiers-screen">
      <Header title="Tiers" onBack={() => go('/gold')} />
      <p className="t-muted center tiers-intro">Grow your total portfolio to unlock deliverable gold and perks.</p>
      <div className="tier-rail" ref={ref}>
        {TIERS.map((t, i) => {
          const unlocked = s.tier >= t.n;
          const span = t.to === Number.POSITIVE_INFINITY ? 1 : t.to - t.from;
          const pct = t.to === Number.POSITIVE_INFINITY ? (portfolioUsd >= t.from ? 1 : 0) : Math.max(0, Math.min(1, (portfolioUsd - t.from) / span));
          const status = s.tier > t.n ? 1 : s.tier === t.n ? pct : 0;
          const range =
            t.to === Number.POSITIVE_INFINITY ? `${formatUsd0(t.from)}+` : `${formatUsd0(t.from)} – ${formatUsd0(t.to)}`;
          const ozHint =
            t.to === Number.POSITIVE_INFINITY
              ? `≈ ${goalOzAtPrice(t.from, goldPrice).toFixed(2)} oz at current price (open-ended)`
              : `≈ ${goalOzAtPrice(t.to, goldPrice).toFixed(3)} oz at current price`;
          return (
            <div className="tier-card-wrap" key={t.n} data-i={i}>
              <div className={`tier-card ${unlocked ? '' : 'locked'} t${t.n}`}>
                <div className={`tier-lock ${unlocked ? 'open' : ''}`}>
                  {unlocked ? 'Unlocked' : 'Locked'} <Icon.lock size={11} />
                </div>
                <div className="tier-art">
                  {t.n === 1 && (
                    <div className="black-coin">
                      <Coin size={130} />
                    </div>
                  )}
                  {t.n === 2 && <GoldBar size={210} />}
                  {t.n === 3 && <Crown size={190} />}
                </div>
                <div className="tier-info">
                  <h2>Tier {t.n}</h2>
                  <span className="tier-chip">{t.name}</span>
                  <p className="t-muted">{t.blurb}</p>
                  <div className="tier-range">{range}</div>
                  <div className="t-caption">{ozHint}</div>
                  <div className="t-caption">
                    APR −{t.perks.aprDiscountPp} pp · storage {t.perks.storageUsdMonth === 0 ? 'free' : `$${t.perks.storageUsdMonth}/mo`} ·
                    handling {t.perks.deliveryHandling === 'waived' ? 'waived' : t.perks.deliveryHandling === 'one_free_year' ? '1 free/yr' : 'full'}
                  </div>
                  <div className="tier-status">
                    <span className="t-caption">Status</span>
                    <div className="track-bar">
                      <div className="track-fill" style={{ width: `${status * 100}%` }} />
                    </div>
                    <span className="t-strong-sm">{Math.round(status * 100)}% complete</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="dots dark center-row">
        {TIERS.map((_, i) => (
          <span key={i} className={i === idx ? 'on' : ''} />
        ))}
      </div>
    </Screen>
  );
}
