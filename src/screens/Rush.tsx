import React, { useEffect, useRef, useState } from 'react';
import { Coin, Icon } from '../art';
import { Btn, Sheet } from '../ui';
import { go, haptic, useStore } from '../store';
import { isTouch, listenShake, motionSupported, requestMotion } from '../motion';

const PER_COIN = 0.001; // oz credited per caught coin
const DURATION = 15;

interface Drop { id: number; x: number; dur: number; size: number; rot: number; caught?: boolean }

export function Rush() {
  const { set, addActivity } = useStore();
  const [phase, setPhase] = useState<'intro' | 'count' | 'play' | 'result'>('intro');
  const [n, setN] = useState(3);
  const [left, setLeft] = useState(DURATION);
  const [drops, setDrops] = useState<Drop[]>([]);
  const [caught, setCaught] = useState(0);
  const [motionOn, setMotionOn] = useState(false);
  const [success, setSuccess] = useState(false);
  const idRef = useRef(0);
  const boost = useRef(0);
  const earned = +(caught * PER_COIN).toFixed(3);

  const spawn = (k = 1) => setDrops((d) => [...d.filter((x) => !x.caught || x.id > idRef.current - 60), ...Array.from({ length: k }).map(() => ({ id: ++idRef.current, x: 4 + Math.random() * 84, dur: 1.9 + Math.random() * 1.6, size: 52 + Math.random() * 56, rot: Math.random() * 360 }))].slice(-45));

  const start = async () => {
    haptic(20);
    const ok = motionSupported() && isTouch() ? await requestMotion() : false;
    setMotionOn(ok);
    setPhase('count');
  };

  useEffect(() => {
    if (phase !== 'count') return;
    setN(3);
    const t = setInterval(() => setN((x) => { if (x <= 1) { clearInterval(t); setPhase('play'); return 0; } haptic(10); return x - 1; }), 750);
    return () => clearInterval(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'play') return;
    setLeft(DURATION); setCaught(0); setDrops([]);
    const sp = setInterval(() => { spawn(boost.current > 0 ? 4 : 2); boost.current = Math.max(0, boost.current - 1); }, 300);
    const tm = setInterval(() => setLeft((l) => { if (l <= 1) { setPhase('result'); return 0; } return l - 1; }), 1000);
    const off = motionOn ? listenShake(() => { boost.current = 4; setCaught((c) => c + 1); haptic(6); }) : () => {};
    return () => { clearInterval(sp); clearInterval(tm); off(); };
  }, [phase, motionOn]);

  const catchDrop = (id: number) => {
    setDrops((d) => d.map((x) => (x.id === id && !x.caught ? { ...x, caught: true } : x)));
    setCaught((c) => c + 1); haptic(8);
  };

  const claim = () => {
    set((p) => ({ goldOz: p.goldOz + earned, earnedOz: p.earnedOz + earned }));
    addActivity({ kind: 'reward', title: 'Gold Rush', sub: `${caught} coins caught`, amount: `+${earned.toFixed(3)} oz`, positive: true });
    setSuccess(true);
  };

  return (
    <div className="screen rush">
      <button className="sq dark rush-back" onClick={() => go('/gold')} aria-label="Close"><Icon.close size={16} /></button>

      {phase === 'intro' && (
        <div className="rush-intro">
          <div className="rays" />
          <div className="vignette" />
          <div className="fly">{Array.from({ length: 10 }).map((_, i) => <span key={i} style={{ ['--a' as string]: `${i * 36 + 10}deg`, ['--d' as string]: `${i * 0.35}s` }}><Coin size={54} shine={false} /></span>)}</div>
          <div className="rush-copy">
            <h1 className="rush-h">IT’S GOLD RUSH TIME</h1>
            <p>Don’t just watch the rush happen… claim your share and rise above the crowd. Every second counts — earn while it’s hot.</p>
            <Btn variant="gold" className="wide" onClick={start}>Shake now <Icon.chev size={14} /></Btn>
            <div className="rush-fine">{isTouch() ? 'Shake your phone or tap the coins' : 'Tap the falling coins to catch them'} · testnet demo</div>
          </div>
        </div>
      )}

      {phase === 'count' && <div className="rush-count" key={n}>{n || 'GO'}</div>}

      {phase === 'play' && (
        <div className="rush-play">
          <div className="rush-timer">{`00:${String(left).padStart(2, '0')}`}</div>
          <div className="rain">
            {drops.map((d) => (
              <button key={d.id} className={`drop ${d.caught ? 'caught' : ''}`} style={{ left: `${d.x}%`, width: d.size, height: d.size, animationDuration: `${d.dur}s`, ['--r' as string]: `${d.rot}deg` }}
                onPointerDown={() => catchDrop(d.id)} onAnimationEnd={(e) => { if (e.animationName === 'fall') setDrops((x) => x.filter((y) => y.id !== d.id)); }}>
                <Coin size={d.size} shine={false} />
                {d.caught && <span className="plus">+{PER_COIN}</span>}
              </button>
            ))}
          </div>
          <div className="rush-counter">
            <div className="rc-oz">{earned.toFixed(3)} <small>Oz</small></div>
            <div className="t-caption">Your earnings · {caught} coins</div>
          </div>
        </div>
      )}

      {phase === 'result' && (
        <div className="rush-result">
          <div className="glow" />
          <div className="coin-pop"><Coin size={200} /></div>
          <div className="rr-oz">{earned.toFixed(3)} Oz</div>
          <div className="t-caption light">Your earnings · {caught} coins caught</div>
          <Btn variant="gold" className="wide rr-btn" onClick={claim}>Claim now</Btn>
          <button className="link light" onClick={() => setPhase('intro')}>Play again</button>
        </div>
      )}

      <Sheet open={success} dark onClose={() => go('/gold')}>
        <div className="success">
          <div className="success-oz">{earned.toFixed(3)} Oz</div>
          <span className="pill pill-green">Successful</span>
          <div className="t-muted center">You have successfully claimed {earned.toFixed(3)} oz and it has been added to your gold balance.</div>
          <Btn variant="white" className="wide" onClick={() => { setSuccess(false); go('/gold'); }}>Done</Btn>
        </div>
      </Sheet>
    </div>
  );
}
