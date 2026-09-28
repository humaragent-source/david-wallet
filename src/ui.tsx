import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from './art';
import { back, go, haptic } from './store';

export function Header({ title, onBack, right, left, dark = false }: { title?: React.ReactNode; onBack?: (() => void) | false; right?: React.ReactNode; left?: React.ReactNode; dark?: boolean }) {
  return (
    <div className={`hdr ${dark ? 'dark' : ''}`}>
      <div className="hdr-side">
        {left ?? (onBack !== false && (
          <button className="sq" aria-label="Back" onClick={() => (onBack ? onBack() : back())}><Icon.back size={16} /></button>
        ))}
      </div>
      <div className="hdr-title">{title}</div>
      <div className="hdr-side right">{right}</div>
    </div>
  );
}

export function Screen({ children, className = '', tab }: { children: React.ReactNode; className?: string; tab?: string }) {
  return (
    <div className={`screen ${className} ${tab ? 'with-tabs' : ''}`}>
      {children}
      {tab && <TabBar active={tab} />}
    </div>
  );
}

export function TabBar({ active }: { active: string }) {
  const tabs = [
    { id: 'gold', label: 'Gold', icon: <span className="tab-coin" />, path: '/gold' },
    { id: 'assets', label: 'Assets', icon: <Icon.chart size={20} />, path: '/assets' },
    { id: 'borrow', label: 'Borrow', icon: <Icon.bank size={20} />, path: '/loans' },
    { id: 'earn', label: 'Earn', icon: <Icon.flame size={20} />, path: '/shake' },
    { id: 'card', label: 'Card', icon: <Icon.card size={20} />, path: '/cards' },
  ];
  return (
    <nav className="tabs">
      {tabs.map((t) => (
        <button key={t.id} className={active === t.id ? 'on' : ''} onClick={() => { haptic(); go(t.path); }}>
          {t.icon}
          <span>{t.label}</span>
        </button>
      ))}
    </nav>
  );
}

export function Sheet({ open, onClose, children, dark = false, className = '' }: { open: boolean; onClose?: () => void; children: React.ReactNode; dark?: boolean; className?: string }) {
  const [mounted, setMounted] = useState(open);
  useEffect(() => { if (open) setMounted(true); else { const t = setTimeout(() => setMounted(false), 320); return () => clearTimeout(t); } }, [open]);
  if (!mounted) return null;
  return (
    <div className={`sheet-wrap ${open ? 'in' : 'out'}`}>
      <div className="scrim" onClick={onClose} />
      <div className={`sheet ${dark ? 'dark' : ''} ${className}`} role="dialog">
        <div className="grab" />
        {children}
      </div>
    </div>
  );
}

export function Btn({ children, onClick, variant = 'dark', disabled, className = '', small }: { children: React.ReactNode; onClick?: () => void; variant?: 'dark' | 'gold' | 'light' | 'ghost' | 'white'; disabled?: boolean; className?: string; small?: boolean }) {
  return (
    <button className={`btn btn-${variant} ${small ? 'btn-sm' : ''} ${className}`} disabled={disabled} onClick={() => { haptic(); onClick?.(); }}>
      {children}
    </button>
  );
}

export function Pill({ children, tone = 'gold' }: { children: React.ReactNode; tone?: 'gold' | 'blue' | 'green' | 'gray' | 'dark' | 'red' }) {
  return <span className={`pill pill-${tone}`}>{children}</span>;
}

export function DemoTag({ children = 'Testnet demo' }: { children?: React.ReactNode }) {
  return <span className="demo-tag">{children}</span>;
}

export function Keypad({ value, onChange, max = 9 }: { value: string; onChange: (v: string) => void; max?: number }) {
  const press = (k: string) => {
    haptic(6);
    if (k === 'del') return onChange(value.slice(0, -1));
    if (k === '.' && value.includes('.')) return;
    if (value.includes('.') && value.split('.')[1].length >= 2) return;
    if (value.replace('.', '').length >= max) return;
    if (value === '0' && k !== '.') return onChange(k);
    onChange((value || (k === '.' ? '0' : '')) + k);
  };
  return (
    <div className="keypad">
      {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'del'].map((k) => (
        <button key={k} onClick={() => press(k)} aria-label={k === 'del' ? 'Delete' : k}>{k === 'del' ? <Icon.del size={22} /> : k}</button>
      ))}
    </div>
  );
}

/* Smooth line chart with gradient area */
export function Chart({ data, color = '#D9A43A', height = 150, live = false }: { data: number[]; color?: string; height?: number; live?: boolean }) {
  const w = 350;
  const h = height;
  const { d, area, lastX, lastY, min, max } = useMemo(() => {
    const min = Math.min(...data), max = Math.max(...data);
    const pad = (max - min) * 0.12 || 1;
    const sx = (i: number) => (i / (data.length - 1)) * w;
    const sy = (v: number) => h - 8 - ((v - (min - pad)) / (max - min + 2 * pad)) * (h - 16);
    let d = `M0 ${sy(data[0])}`;
    for (let i = 1; i < data.length; i++) {
      const x0 = sx(i - 1), y0 = sy(data[i - 1]), x1 = sx(i), y1 = sy(data[i]);
      const cx = (x0 + x1) / 2;
      d += ` C${cx} ${y0} ${cx} ${y1} ${x1} ${y1}`;
    }
    return { d, area: `${d} L${w} ${h} L0 ${h} Z`, lastX: sx(data.length - 1), lastY: sy(data[data.length - 1]), min, max };
  }, [data, h]);
  const id = useRef('c' + Math.random().toString(36).slice(2)).current;
  return (
    <svg className="chart" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ height }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={color} stopOpacity=".28" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="2.2" vectorEffect="non-scaling-stroke" className="chart-line" />
      <circle cx={lastX} cy={lastY} r="4" fill={color} className={live ? 'pulse-dot' : ''} />
      <title>{`${min.toFixed(2)} – ${max.toFixed(2)}`}</title>
    </svg>
  );
}

export function Processing({ open, label = 'Processing', dark = true }: { open: boolean; label?: string; dark?: boolean }) {
  return (
    <Sheet open={open} dark={dark}>
      <div className="processing">
        <div className="spinner" />
        <div className="t-strong">{label}</div>
        <div className="t-muted">Simulated on testnet — no real funds move</div>
      </div>
    </Sheet>
  );
}

export function SuccessSheet({ open, title, body, onDone, dark = true, doneLabel = 'Done' }: { open: boolean; title: React.ReactNode; body?: React.ReactNode; onDone: () => void; dark?: boolean; doneLabel?: string }) {
  return (
    <Sheet open={open} dark={dark} onClose={onDone}>
      <div className="success">
        <div className="check-burst"><Icon.check size={34} stroke={2.6} /></div>
        <div className="success-title">{title}</div>
        {body && <div className="t-muted center">{body}</div>}
        <Btn variant={dark ? 'white' : 'dark'} onClick={onDone} className="wide">{doneLabel}</Btn>
      </div>
    </Sheet>
  );
}

export function Toast({ msg }: { msg: string | null }) {
  return <div className={`toast ${msg ? 'in' : ''}`}>{msg}</div>;
}
export function useToast(): [string | null, (m: string) => void] {
  const [m, setM] = useState<string | null>(null);
  const t = useRef<number>();
  return [m, (msg: string) => { setM(msg); clearTimeout(t.current); t.current = window.setTimeout(() => setM(null), 2200); }];
}

export function Ring({ pct, size = 44, stroke = 4, color = '#D9A43A', label }: { pct: number; size?: number; stroke?: number; color?: string; label?: React.ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#EFEAE0" strokeWidth={stroke} fill="none" strokeDasharray="3 2.2" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(1, pct))} strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ transition: 'stroke-dashoffset 1s ease' }} />
      </svg>
      <span>{label ?? `${Math.round(pct * 100)}%`}</span>
    </div>
  );
}
