import React, { useEffect, useRef, useState } from 'react';
import { Coin, Icon } from '../art';
import { Btn, Header, Screen, Sheet, Toast, useToast } from '../ui';
import { currentStreak, go, haptic, iso, multiplierFor, today, useStore, formatMg, mgToOz } from '../store';
import { isTouch, listenShake, motionSupported, requestMotion } from '../motion';
import { SHAKE_BASE_MG, REWARD_HOLDING_DAYS } from '../spec';

const TARGET = 20;
const SECONDS = 10;

export function Streak() {
  const { s, set, addActivity } = useStore();
  const [sheet, setSheet] = useState(false);
  const [toast, showToast] = useToast();
  const streak = currentStreak(s.streakDays);
  const mult = multiplierFor(streak);
  const doneToday = s.streakDays.includes(today()) || s.lastShakeDay === today();
  const missed = (() => {
    if (!s.streakDays.length) return 0;
    const setD = new Set(s.streakDays);
    const d = new Date([...s.streakDays].sort()[0] + 'T12:00:00');
    const end = new Date();
    end.setDate(end.getDate() - 1);
    let n = 0;
    while (iso(d) <= iso(end)) {
      if (!setD.has(iso(d))) n++;
      d.setDate(d.getDate() + 1);
    }
    return n;
  })();

  const d0 = new Date();
  const dow = (d0.getDay() + 6) % 7;
  d0.setDate(d0.getDate() - dow);
  const week = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(d0);
    d.setDate(d0.getDate() + i);
    return { label: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i], iso: iso(d), future: d > new Date() };
  });

  return (
    <Screen tab="earn" className="streak-screen">
      <Header
        title="Streak activity"
        onBack={() => go('/gold')}
        right={
          <button className="sq" onClick={() => go('/leaderboard')} aria-label="Leaderboard">
            <Icon.trophy size={15} />
          </button>
        }
      />
      <div className="streak-total">
        <div className="streak-oz">{formatMg(s.earnedMg, 2)}</div>
        <div className="t-caption">Your total gold dust earned</div>
        {s.pendingRewardsMg > 0 && (
          <div className="t-caption" style={{ marginTop: 4 }}>
            {formatMg(s.pendingRewardsMg, 2)} pending · {REWARD_HOLDING_DAYS}-day holding period
          </div>
        )}
      </div>
      <div className="flame-orb">
        <Icon.flame size={44} color="#fff" />
      </div>
      <div className="card streak-card">
        <h2>
          {streak} Day{streak === 1 ? '' : 's'} Streak!
        </h2>
        <p className="t-muted center">
          {streak === 0 ? 'Shake today to start your streak' : doneToday ? 'You are on the right track' : 'Shake today to keep it alive'}
        </p>
        <div className="week">
          {week.map((w) => {
            const on = s.streakDays.includes(w.iso);
            return (
              <div key={w.iso} className="wd">
                <span className="t-caption2">{w.label}</span>
                <span className={`wd-dot ${on ? 'on' : ''} ${w.iso === today() ? 'today' : ''}`}>
                  {on && <Icon.flame size={11} color="#fff" />}
                </span>
              </div>
            );
          })}
        </div>
        <div className="stats">
          <div>
            <span className="t-caption2">Streak</span>
            <b>{streak}</b>
          </div>
          <div>
            <span className="t-caption2">Total shakes</span>
            <b>{s.totalShakes}</b>
          </div>
          <div>
            <span className="t-caption2">Missed</span>
            <b>{missed}</b>
          </div>
          <div>
            <span className="t-caption2">Multiplier</span>
            <b>{mult}×</b>
          </div>
        </div>
      </div>
      <div className="mult-card">
        <div className={`mult ${streak >= 7 ? 'on' : ''}`}>
          <b>7 days</b>
          <span>2× rewards</span>
        </div>
        <div className={`mult ${streak >= 14 ? 'on' : ''}`}>
          <b>14 days</b>
          <span>3× rewards</span>
        </div>
        <div className="mult warn">
          <b>Miss a day</b>
          <span>resets to day 1</span>
        </div>
      </div>
      <div className="invite">
        <span className="inv-ic">
          <Icon.gift size={16} />
        </span>
        <div>
          <b>Invite your friends to shake</b>
          <div className="t-caption">Earn gold dust when friends shake</div>
        </div>
        <button
          className="btn btn-light btn-sm"
          onClick={async () => {
            try {
              await navigator.share?.({
                title: 'David',
                text: 'Shake ’n’ Earn gold with me on David (testnet)',
                url: location.origin + location.pathname,
              });
            } catch {
              /* cancelled */
            }
          }}
        >
          Invite
        </button>
      </div>
      <div className="streak-foot">
        <Btn variant="light" onClick={() => go('/leaderboard')}>
          Leaderboard
        </Btn>
        <Btn onClick={() => setSheet(true)}>{doneToday ? 'Come back tomorrow' : 'Shake Now'}</Btn>
      </div>
      <ShakeSheet
        open={sheet}
        onClose={() => setSheet(false)}
        locked={doneToday}
        onReward={(amountMg, shakes) => {
          const t = today();
          const ozAmt = mgToOz(amountMg);
          set((p) => {
            const days = p.streakDays.includes(t) ? p.streakDays : [...p.streakDays, t];
            return {
              streakDays: days,
              lastShakeDay: t,
              totalShakes: p.totalShakes + shakes,
              earnedMg: p.earnedMg + amountMg,
              goldOz: p.goldOz + ozAmt,
              pendingRewardsMg: p.pendingRewardsMg + amountMg,
              pendingRewardsSince: p.pendingRewardsSince ?? Date.now(),
            };
          });
          addActivity({
            kind: 'reward',
            title: 'Shake ’n’ Earn',
            sub: `Daily reward · ${mult}× multiplier · ${REWARD_HOLDING_DAYS}d hold`,
            amount: `+${formatMg(amountMg, 2)}`,
            positive: true,
          });
          showToast(`+${formatMg(amountMg, 2)} gold dust added`);
        }}
        mult={mult}
      />
      <Toast msg={toast} />
    </Screen>
  );
}

function ShakeSheet({
  open,
  onClose,
  onReward,
  mult,
  locked,
}: {
  open: boolean;
  onClose: () => void;
  onReward: (mg: number, shakes: number) => void;
  mult: number;
  locked: boolean;
}) {
  const [phase, setPhase] = useState<'intro' | 'play' | 'done'>('intro');
  const [count, setCount] = useState(0);
  const [left, setLeft] = useState(SECONDS);
  const [motion, setMotion] = useState<'unknown' | 'on' | 'off'>('unknown');
  const [wiggle, setWiggle] = useState(0);
  const countRef = useRef(0);
  useEffect(() => {
    if (!open) {
      setPhase('intro');
      setCount(0);
      countRef.current = 0;
      setLeft(SECONDS);
    }
  }, [open]);

  const bump = () => {
    countRef.current = Math.min(TARGET, countRef.current + 1);
    setCount(countRef.current);
    setWiggle((w) => w + 1);
    haptic('light');
    if (countRef.current >= TARGET) setPhase('done');
  };

  useEffect(() => {
    if (phase !== 'play') return;
    const off = motion === 'on' ? listenShake(() => bump()) : () => {};
    const t = setInterval(() => {
      setLeft((l) => {
        if (l <= 1) {
          setPhase('done');
          return 0;
        }
        return l - 1;
      });
    }, 1000);
    return () => {
      off();
      clearInterval(t);
    };
  }, [phase, motion]);

  const start = async () => {
    if (locked) return;
    const ok = motionSupported() && isTouch() ? await requestMotion() : false;
    setMotion(ok ? 'on' : 'off');
    setPhase('play');
  };
  const rewardMg = +((SHAKE_BASE_MG * mult * (count / TARGET)).toFixed(4));

  return (
    <Sheet open={open} onClose={onClose} className="shake-sheet">
      {phase === 'intro' && (
        <div className="shake-intro">
          <div className="rays-bg" />
          <div className="phone-wiggle">
            <PhoneGlyph />
          </div>
          <h2>It’s time to Shake ’n’ Earn</h2>
          <p className="t-muted center">
            Earn {formatMg(SHAKE_BASE_MG, 1)} gold dust daily (base). Keep a 7 day streak for a 2× multiplier, 14 days for a 3×
            multiplier. Missing a day resets the streak to day 1.
          </p>
          {locked ? (
            <>
              <p className="t-caption center">You’ve already claimed today’s shake. Come back tomorrow.</p>
              <Btn variant="light" onClick={onClose}>
                Close
              </Btn>
            </>
          ) : (
            <Btn variant="gold" onClick={start}>
              Shake now <Icon.chev size={14} />
            </Btn>
          )}
        </div>
      )}
      {phase === 'play' && (
        <div className="shake-play">
          <div className="timer">{`00:${String(left).padStart(2, '0')}`}</div>
          <div className="meter">
            <svg width="190" height="190" viewBox="0 0 190 190">
              <circle cx="95" cy="95" r="84" stroke="#F3EEE2" strokeWidth="10" fill="none" />
              <circle
                cx="95"
                cy="95"
                r="84"
                stroke="url(#mg)"
                strokeWidth="10"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={528}
                strokeDashoffset={528 * (1 - count / TARGET)}
                transform="rotate(-90 95 95)"
                style={{ transition: 'stroke-dashoffset .25s' }}
              />
              <defs>
                <linearGradient id="mg">
                  <stop offset="0" stopColor="#F9D46B" />
                  <stop offset="1" stopColor="#E29A1E" />
                </linearGradient>
              </defs>
            </svg>
            <div className="meter-in" key={wiggle}>
              <PhoneGlyph />
            </div>
          </div>
          <div className="t-strong">
            {count} / {TARGET} shakes
          </div>
          <div className="t-muted">{motion === 'on' ? 'Shake your phone!' : 'Motion unavailable here — tap to shake'}</div>
          <Btn variant={motion === 'on' ? 'light' : 'dark'} onClick={bump}>
            {motion === 'on' ? 'Or tap to shake' : 'Tap to shake'}
          </Btn>
        </div>
      )}
      {phase === 'done' && (
        <div className="shake-done">
          <div className="coin-pop">
            <Coin size={110} />
          </div>
          <h2>+{formatMg(rewardMg, 2)}</h2>
          <p className="t-muted center">
            {count} shakes · {mult}× streak multiplier. Gold dust is credited to your testnet gold balance.
          </p>
          <Btn
            variant="gold"
            className="wide"
            onClick={() => {
              if (rewardMg > 0 && !locked) onReward(rewardMg, count);
              onClose();
            }}
          >
            {rewardMg > 0 && !locked ? 'Claim' : 'Close'}
          </Btn>
        </div>
      )}
    </Sheet>
  );
}

function PhoneGlyph() {
  return (
    <svg width="86" height="96" viewBox="0 0 86 96">
      <defs>
        <linearGradient id="ph" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7CC8FF" />
          <stop offset="1" stopColor="#2A6CF0" />
        </linearGradient>
      </defs>
      <path
        d="M10 30c-5 6-5 30 0 36M4 24c-8 10-8 38 0 48M76 30c5 6 5 30 0 36M82 24c8 10 8 38 0 48"
        stroke="#9C7CF6"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      <rect x="24" y="8" width="38" height="80" rx="9" fill="url(#ph)" transform="rotate(-12 43 48)" />
      <rect x="29" y="15" width="28" height="64" rx="5" fill="#BFE4FF" opacity=".6" transform="rotate(-12 43 48)" />
    </svg>
  );
}

const BOARD = [
  ['Lionel Stephen', 2.9],
  ['Sabena Isabel', 2.72],
  ['Sarah Paddock', 2.53],
  ['Stella Ideris', 2.04],
  ['Thor Anderson', 1.86],
  ['Simila Mingo', 1.59],
  ['Lewis Stephen', 1.39],
  ['Maya Okafor', 1.22],
] as const;
const HUES = [38, 265, 20, 200, 150, 330, 10, 180];

export function Leaderboard() {
  const { s } = useStore();
  const me = { name: 'You', v: s.earnedMg };
  const rows = [...BOARD.map(([n, v]) => ({ name: n as string, v: v as number })), me].sort((a, b) => b.v - a.v);
  const top = rows.slice(0, 3);
  return (
    <Screen className="board-screen">
      <Header title="Leaderboard" onBack={() => go('/shake')} />
      <div className="card board">
        <h3 className="center">Leaderboard</h3>
        <div className="podium">
          {[1, 0, 2].map((i) => (
            <div key={i} className={`pod p${i + 1}`}>
              <Avatar name={top[i].name} hue={HUES[i]} big={i === 0} />
              <div className="pod-name">{top[i].name}</div>
              <span className={`pod-v v${i + 1}`}>{formatMg(top[i].v, 2)}</span>
              <div className="pod-block">
                <span>{i + 1}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="board-list">
          {rows.map((r, i) => (
            <div key={r.name} className={`board-row r${Math.min(i + 1, 4)} ${r.name === 'You' ? 'me' : ''}`}>
              <span className="rank">{i + 1}</span>
              <Avatar name={r.name} hue={HUES[i % HUES.length]} />
              <span className="bn">{r.name}</span>
              <span className="bv">{formatMg(r.v, 2)}</span>
            </div>
          ))}
        </div>
        <p className="t-caption center">Other players are demo data · amounts in mg gold dust.</p>
      </div>
    </Screen>
  );
}
function Avatar({ name, hue, big }: { name: string; hue: number; big?: boolean }) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2);
  return (
    <span className={`av ${big ? 'big' : ''}`} style={{ background: `linear-gradient(135deg, hsl(${hue} 80% 70%), hsl(${hue} 60% 45%))` }}>
      {initials}
    </span>
  );
}
