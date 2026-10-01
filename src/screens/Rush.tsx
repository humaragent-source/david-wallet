import React, { useEffect, useRef, useState } from 'react';
import { Coin, Icon } from '../art';
import { Btn, Sheet } from '../ui';
import { go, haptic, useStore, today, formatMg, mgToOz } from '../store';
import { isTouch, listenShake, motionSupported, requestMotion } from '../motion';
import {
  RUSH_DURATION_SEC,
  RUSH_CAP_MG,
  rushRewardMg,
  rushAvailableNow,
  REWARD_HOLDING_DAYS,
} from '../spec';

interface Drop { id: number; x: number; dur: number; size: number; rot: number; caught?: boolean; fading?: boolean }

function prefersReduced() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function Rush() {
  const { s, set, addActivity } = useStore();
  const [phase, setPhase] = useState<'intro' | 'count' | 'play' | 'result' | 'blocked'>('intro');
  const [blockReason, setBlockReason] = useState('');
  const [n, setN] = useState(3);
  const [left, setLeft] = useState(RUSH_DURATION_SEC);
  const [drops, setDrops] = useState<Drop[]>([]);
  const [caught, setCaught] = useState(0);
  const [motionOn, setMotionOn] = useState(false);
  const [success, setSuccess] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [tapCollect, setTapCollect] = useState(0);
  const idRef = useRef(0);
  const boost = useRef(0);
  const rewardMg = rushRewardMg(caught);
  const rewardText = formatMg(rewardMg, 2);

  useEffect(() => {
    setReduced(prefersReduced());
    const avail = rushAvailableNow(s.lastRushDay);
    if (!avail.ok && !s.rushForceOpen && !s.demoMode) {
      setPhase('blocked');
      setBlockReason(avail.reason ?? 'Unavailable');
    } else if (!avail.ok && s.demoMode && !s.rushForceOpen) {
      // Demo: allow practice intro but gate claim later if already claimed today
    }
  }, []);

  const spawn = (k = 1) =>
    setDrops((d) =>
      [
        ...d.filter((x) => !x.caught || x.id > idRef.current - 60),
        ...Array.from({ length: k }).map(() => ({
          id: ++idRef.current,
          x: 4 + Math.random() * 84,
          dur: 1.9 + Math.random() * 1.6,
          size: 52 + Math.random() * 56,
          rot: Math.random() * 360,
        })),
      ].slice(-45),
    );

  const start = async () => {
    const avail = rushAvailableNow(s.lastRushDay);
    if (!avail.ok && !s.rushForceOpen) {
      setPhase('blocked');
      setBlockReason(avail.reason ?? 'Unavailable');
      return;
    }
    haptic('medium');
    const ok = motionSupported() && isTouch() ? await requestMotion() : false;
    setMotionOn(ok);
    setPhase('count');
  };

  useEffect(() => {
    if (phase !== 'count') return;
    setN(3);
    const t = setInterval(() => {
      setN((x) => {
        if (x <= 1) {
          clearInterval(t);
          setPhase('play');
          return 0;
        }
        haptic('selection');
        return x - 1;
      });
    }, prefersReduced() ? 300 : 300);
    return () => clearInterval(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'play') return;
    setLeft(RUSH_DURATION_SEC);
    setCaught(0);
    setDrops([]);
    setTapCollect(0);
    if (reduced) {
      const tm = setInterval(() => {
        setLeft((l) => {
          if (l <= 1) {
            setPhase('result');
            return 0;
          }
          return l - 1;
        });
      }, 1000);
      const off = motionOn
        ? listenShake(() => {
            setCaught((c) => c + 1);
            haptic('light');
          })
        : () => {};
      return () => {
        clearInterval(tm);
        off();
      };
    }
    const sp = setInterval(() => {
      spawn(boost.current > 0 ? 4 : 2);
      boost.current = Math.max(0, boost.current - 1);
    }, 300);
    const tm = setInterval(() => {
      setLeft((l) => {
        if (l <= 1) {
          setPhase('result');
          return 0;
        }
        return l - 1;
      });
    }, 1000);
    const off = motionOn
      ? listenShake(() => {
          boost.current = 4;
          setCaught((c) => c + 1);
          haptic('light');
        })
      : () => {};
    return () => {
      clearInterval(sp);
      clearInterval(tm);
      off();
    };
  }, [phase, motionOn, reduced]);

  const catchDrop = (id: number) => {
    setDrops((d) => d.map((x) => (x.id === id && !x.caught ? { ...x, caught: true, fading: true } : x)));
    setCaught((c) => c + 1);
    haptic('light');
    setTimeout(() => setDrops((d) => d.filter((x) => x.id !== id)), 320);
  };

  const claim = () => {
    if (claimed) return;
    if (s.lastRushDay === today() && !s.rushForceOpen) {
      setBlockReason('Already claimed today’s Gold Rush');
      setPhase('blocked');
      return;
    }
    const mg = rushRewardMg(caught);
    const ozAmt = mgToOz(mg);
    setClaimed(true);
    set((p) => ({
      goldOz: p.goldOz + ozAmt,
      earnedMg: p.earnedMg + mg,
      lastRushDay: today(),
      rushForceOpen: false,
      pendingRewardsMg: p.pendingRewardsMg + mg,
      pendingRewardsSince: p.pendingRewardsSince ?? Date.now(),
    }));
    addActivity({
      kind: 'reward',
      title: 'Gold Rush',
      sub: `${caught} shakes · cap ${formatMg(RUSH_CAP_MG, 0)} · ${REWARD_HOLDING_DAYS}d hold`,
      amount: `+${formatMg(mg, 2)}`,
      positive: true,
    });
    setSuccess(true);
  };

  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');
  const progress = 1 - left / RUSH_DURATION_SEC;

  return (
    <div className="screen rush">
      <button className="sq dark rush-back" onClick={() => go('/gold', { replace: true })} aria-label="Close">
        <Icon.close size={16} />
      </button>

      {phase === 'blocked' && (
        <div className="rush-intro">
          <div className="rays" />
          <div className="vignette" />
          <div className="rush-copy">
            <h1 className="rush-h">GOLD RUSH</h1>
            <p>{blockReason}. Come back tomorrow during 09:00–21:00 local time. Max 1 event per day · $250 pool · 10 mg cap.</p>
            <Btn variant="white" className="wide" onClick={() => go('/gold', { replace: true })}>
              Back to Gold
            </Btn>
            {s.demoMode && (
              <button
                className="link light"
                onClick={() => {
                  set(() => ({ rushForceOpen: true }));
                  setPhase('intro');
                }}
              >
                Demo: open practice round
              </button>
            )}
          </div>
        </div>
      )}

      {phase === 'intro' && (
        <div className="rush-intro">
          <div className="rays" />
          <div className="vignette" />
          <div className="fly">
            {Array.from({ length: 10 }).map((_, i) => (
              <span key={i} style={{ ['--a' as string]: `${i * 36 + 10}deg`, ['--d' as string]: `${i * 0.35}s` }}>
                <Coin size={54} shine={false} />
              </span>
            ))}
          </div>
          <div className="rush-copy">
            <h1 className="rush-h">IT’S GOLD RUSH TIME</h1>
            <p>
              2-minute shake window. Share of a $250 pool, capped at {formatMg(RUSH_CAP_MG, 0)} per user. One claim per day.
            </p>
            <Btn variant="gold" className="wide" onClick={start}>
              Shake now <Icon.chev size={14} />
            </Btn>
            <div className="rush-fine">
              {isTouch() ? 'Shake your phone or tap the coins' : 'Tap the falling coins to catch them'} · testnet demo
            </div>
          </div>
        </div>
      )}

      {phase === 'count' && (
        <div className="rush-count" key={n}>
          {n || 'GO'}
        </div>
      )}

      {phase === 'play' && reduced && (
        <div className="rush-play rush-reduced">
          <div className="rush-timer">{`${mm}:${ss}`}</div>
          <div className="reduced-stage">
            <Coin size={120} />
            <svg className="reduced-ring" width="160" height="160" viewBox="0 0 160 160">
              <circle cx="80" cy="80" r="70" stroke="rgba(255,255,255,.15)" strokeWidth="8" fill="none" />
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="#F6C343"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={440}
                strokeDashoffset={440 * (1 - progress)}
                transform="rotate(-90 80 80)"
              />
            </svg>
            <Btn
              variant="gold"
              onClick={() => {
                setCaught((c) => c + 1);
                setTapCollect((t) => t + 1);
                haptic('light');
              }}
            >
              Tap to collect
            </Btn>
            <div className="t-caption light">Reduce Motion mode · shake or tap still scores</div>
          </div>
          <div className="rush-counter">
            <div className="rc-oz">
              {formatMg(rushRewardMg(caught), 2)}
            </div>
            <div className="t-caption">Est. share · {caught} shakes · cap {formatMg(RUSH_CAP_MG, 0)}</div>
          </div>
        </div>
      )}

      {phase === 'play' && !reduced && (
        <div className="rush-play">
          <div className="rush-timer">{`${mm}:${ss}`}</div>
          <div className="rain">
            {drops.map((d) => (
              <button
                key={d.id}
                className={`drop ${d.caught ? 'caught' : ''} ${d.fading ? 'fading' : ''}`}
                style={{
                  left: `${d.x}%`,
                  width: d.size,
                  height: d.size,
                  animationDuration: `${d.dur}s`,
                  ['--r' as string]: `${d.rot}deg`,
                }}
                onPointerDown={() => catchDrop(d.id)}
                onAnimationEnd={(e) => {
                  if (e.animationName === 'fall') setDrops((x) => x.filter((y) => y.id !== d.id));
                }}
              >
                <Coin size={d.size} shine={false} />
                {d.caught && <span className="plus">+1</span>}
              </button>
            ))}
          </div>
          <div className="rush-counter">
            <div className="rc-oz">{formatMg(rushRewardMg(caught), 2)}</div>
            <div className="t-caption">Est. share · {caught} shakes · cap {formatMg(RUSH_CAP_MG, 0)}</div>
          </div>
        </div>
      )}

      {phase === 'result' && (
        <div className="rush-result">
          <div className="glow" />
          <div className="coin-pop">
            <Coin size={200} />
          </div>
          <div className="rr-oz">{rewardText}</div>
          <div className="t-caption light">Your earnings · {caught} shakes · capped at {formatMg(RUSH_CAP_MG, 0)}</div>
          <Btn variant="gold" className="wide rr-btn" onClick={claim} disabled={claimed}>
            Claim now
          </Btn>
          <div className="t-caption light" style={{ marginTop: 10 }}>
            No free play-again with rewards — one claim per day
          </div>
        </div>
      )}

      <Sheet
        open={success}
        dark
        className="rush-claimed-sheet"
        onClose={() => go('/gold', { replace: true })}
      >
        <div className="success">
          <div className="success-oz">{rewardText}</div>
          <span className="pill pill-green">Successful</span>
          <div className="t-muted center">
            You’ve successfully claimed {rewardText} and it’s been added to your gold balance. Withdrawals of rewards have a{' '}
            {REWARD_HOLDING_DAYS}-day holding period.
          </div>
          <Btn
            variant="white"
            className="wide"
            onClick={() => {
              setSuccess(false);
              go('/gold', { replace: true });
            }}
          >
            Done
          </Btn>
        </div>
      </Sheet>
    </div>
  );
}
