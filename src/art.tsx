import React, { useId } from 'react';

const uid = () => useId().replace(/:/g, '');

/* ============================ Gold coin ============================ */
/* Tether-gold style coin. `fill` 0..1 fills the coin with molten gold  */
/* from the bottom (animated wave) over a frosted silver shell.         */
export function Coin({ size = 160, fill = 1, shine = true, className = '' }: { size?: number; fill?: number; shine?: boolean; className?: string }) {
  const id = uid();
  const f = Math.max(0, Math.min(1, fill));
  const level = 200 - f * 200; // y of liquid surface (0..200 viewBox)
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 200 200" aria-label="Gold coin">
      <defs>
        <radialGradient id={`g${id}`} cx="35%" cy="28%" r="80%">
          <stop offset="0" stopColor="#FFF4C7" />
          <stop offset=".28" stopColor="#F4CF6A" />
          <stop offset=".62" stopColor="#D69D2C" />
          <stop offset="1" stopColor="#8E5A0E" />
        </radialGradient>
        <linearGradient id={`rim${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFE9A3" />
          <stop offset=".45" stopColor="#C88A1C" />
          <stop offset="1" stopColor="#6E4306" />
        </linearGradient>
        <radialGradient id={`s${id}`} cx="38%" cy="30%" r="80%">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset=".5" stopColor="#D9DCE1" />
          <stop offset="1" stopColor="#9DA3AC" />
        </radialGradient>
        <linearGradient id={`sr${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F4F5F7" />
          <stop offset="1" stopColor="#8E949C" />
        </linearGradient>
        <filter id={`n${id}`}><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" /><feColorMatrix values="0 0 0 0 .5  0 0 0 0 .5  0 0 0 0 .5  0 0 0 .18 0" /><feComposite in2="SourceGraphic" operator="in" /></filter>
        <clipPath id={`c${id}`}><circle cx="100" cy="100" r="92" /></clipPath>
        <clipPath id={`l${id}`}>
          <path className={f < 1 ? 'wave' : ''} d={`M-200 ${level} q25 -7 50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 V260 H-200Z`} />
        </clipPath>
        <linearGradient id={`sh${id}`} x1="0" x2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset=".5" stopColor="#fff" stopOpacity=".55" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <ellipse cx="100" cy="194" rx="62" ry="5" fill="#000" opacity=".10" />
      {/* frosted shell (empty state) */}
      {f < 1 && (
        <g>
          <circle cx="100" cy="100" r="96" fill={`url(#sr${id})`} />
          <circle cx="100" cy="100" r="86" fill={`url(#s${id})`} />
          <circle cx="100" cy="100" r="86" fill="#fff" filter={`url(#n${id})`} />
          <TetherMark color="#AEB3BA" hi="#F5F6F8" />
        </g>
      )}
      {/* gold (clipped by liquid level when partially filled) */}
      <g clipPath={f < 1 ? `url(#l${id})` : undefined}>
        <circle cx="100" cy="100" r="96" fill={`url(#rim${id})`} />
        <circle cx="100" cy="100" r="86" fill={`url(#g${id})`} />
        <circle cx="100" cy="100" r="79" fill="none" stroke="#B57D17" strokeOpacity=".45" strokeWidth="1.5" />
        <circle cx="100" cy="100" r="86" fill="none" stroke="#FFF1BF" strokeOpacity=".6" strokeWidth="1" />
        <TetherMark color="#A86F12" hi="#FFE7A1" />
      </g>
      {shine && f >= 1 && (
        <g clipPath={`url(#c${id})`}>
          <rect className="coin-shine" x="-120" y="-20" width="60" height="240" fill={`url(#sh${id})`} transform="rotate(20 100 100)" />
        </g>
      )}
    </svg>
  );
}

function TetherMark({ color, hi }: { color: string; hi: string }) {
  return (
    <g>
      <g transform="translate(0 1.5)" fill={hi} opacity=".8">
        <path d="M62 62h76v16h-30v10c19 1.3 33 5.6 33 10.8s-14 9.5-33 10.8V144H92v-34.4c-19-1.3-33-5.6-33-10.8S73 89.3 92 88V78H62z" />
      </g>
      <path fill={color} d="M62 62h76v16h-30v10c19 1.3 33 5.6 33 10.8s-14 9.5-33 10.8V144H92v-34.4c-19-1.3-33-5.6-33-10.8S73 89.3 92 88V78H62z" />
      <ellipse cx="100" cy="98.8" rx="30" ry="6.2" fill="none" stroke={hi} strokeOpacity=".75" strokeWidth="2" />
    </g>
  );
}

/* ============================ Gold bar ============================ */
export function GoldBar({ size = 220, fill = 1, className = '', label = 'TRUE GOLD', metal = 'gold' }: { size?: number; fill?: number; className?: string; label?: string; metal?: 'gold' | 'silver' }) {
  const id = uid();
  const G = metal === 'gold'
    ? ['#FFF3C2', '#F2C75C', '#C98D1F', '#7C4D08', '#E7B54A']
    : ['#FFFFFF', '#E3E6EA', '#AEB4BC', '#6F7680', '#CDD2D8'];
  const f = Math.max(0, Math.min(1, fill));
  const h = size * 0.56;
  return (
    <svg className={className} width={size} height={h} viewBox="0 0 250 140" aria-label={`${metal} bar`}>
      <defs>
        <linearGradient id={`t${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={G[0]} /><stop offset=".45" stopColor={G[1]} /><stop offset="1" stopColor={G[2]} />
        </linearGradient>
        <linearGradient id={`f${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={G[4]} /><stop offset="1" stopColor={G[3]} />
        </linearGradient>
        <linearGradient id={`sd${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={G[2]} /><stop offset="1" stopColor={G[3]} />
        </linearGradient>
        <clipPath id={`lv${id}`}><rect x="0" y={124 - f * 102} width="250" height="140" /></clipPath>
        <linearGradient id={`sh${id}`} x1="0" x2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0" /><stop offset=".5" stopColor="#fff" stopOpacity=".6" /><stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <clipPath id={`top${id}`}><path d="M52 22h146l30 58H22z" /></clipPath>
      </defs>
      <ellipse cx="125" cy="130" rx="112" ry="8" fill="#000" opacity=".10" />
      {/* empty mould outline */}
      {f < 1 && <g><path d="M52 22h146l30 58-4 44H26l-4-44z" fill="#F5F1E8" stroke="#E4DAC3" strokeWidth="2" /><path d="M58 28h134l24 48H34z" fill="#EDE6D6" /><path d="M22 80h206" stroke="#E4DAC3" strokeWidth="2" /></g>}
      <g clipPath={f < 1 ? `url(#lv${id})` : undefined}>
        <path d="M22 80h206l-4 44H26z" fill={`url(#f${id})`} />
        <path d="M198 22l30 58-4 44-30-44z" fill={`url(#sd${id})`} opacity=".0" />
        <path d="M52 22h146l30 58H22z" fill={`url(#t${id})`} />
        <path d="M66 32h118l20 40H46z" fill="none" stroke={G[2]} strokeOpacity=".55" strokeWidth="1.5" />
        <text x="125" y="52" textAnchor="middle" fontFamily="Inter Tight, Arial" fontWeight="900" fontSize="15" letterSpacing="3" fill={G[3]} opacity=".75">{label}</text>
        <text x="125" y="67" textAnchor="middle" fontFamily="Inter Tight, Arial" fontWeight="700" fontSize="8" letterSpacing="2" fill={G[3]} opacity=".6">FINE GOLD 999.9 · 10 OZ</text>
        <rect x="22" y="80" width="206" height="3" fill="#fff" opacity=".35" />
        {f >= 1 && <g clipPath={`url(#top${id})`}><rect className="bar-shine" x="-80" y="0" width="50" height="140" fill={`url(#sh${id})`} transform="skewX(-20)" /></g>}
      </g>
    </svg>
  );
}

/* ============================ Crown ============================ */
export function Crown({ size = 190 }: { size?: number }) {
  const id = uid();
  return (
    <svg width={size} height={size * 0.8} viewBox="0 0 240 190" aria-label="Gold crown">
      <defs>
        <linearGradient id={`c${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFF0B8" /><stop offset=".4" stopColor="#EDBE50" /><stop offset="1" stopColor="#8C5A0D" />
        </linearGradient>
        <linearGradient id={`b${id}`} x1="0" x2="1">
          <stop offset="0" stopColor="#8C5A0D" /><stop offset=".5" stopColor="#F6D27A" /><stop offset="1" stopColor="#8C5A0D" />
        </linearGradient>
        <radialGradient id={`r${id}`} cx="35%" cy="35%"><stop offset="0" stopColor="#FFB3B3" /><stop offset="1" stopColor="#9E0B19" /></radialGradient>
        <radialGradient id={`e${id}`} cx="35%" cy="35%"><stop offset="0" stopColor="#B7FFD9" /><stop offset="1" stopColor="#0B7A45" /></radialGradient>
      </defs>
      <ellipse cx="120" cy="178" rx="92" ry="8" fill="#000" opacity=".12" />
      <path d="M28 64l44 38 48-72 48 72 44-38-18 96H46z" fill={`url(#c${id})`} stroke="#9B6512" strokeWidth="2" />
      <path d="M46 138h148l-4 24H50z" fill={`url(#b${id})`} stroke="#9B6512" strokeWidth="2" />
      {[28, 120, 212].map((x, i) => <circle key={i} cx={x} cy={i === 1 ? 26 : 60} r="10" fill={`url(#c${id})`} stroke="#9B6512" strokeWidth="2" />)}
      <circle cx="120" cy="112" r="13" fill={`url(#r${id})`} />
      <circle cx="78" cy="122" r="8" fill={`url(#e${id})`} />
      <circle cx="162" cy="122" r="8" fill={`url(#e${id})`} />
      {[70, 100, 140, 170].map((x) => <circle key={x} cx={x} cy="150" r="4" fill="#FFF6D6" opacity=".9" />)}
    </svg>
  );
}

/* ============================ Flags ============================ */
export function Flag({ code, size = 150 }: { code: 'fr' | 'gb' | 'us'; size?: number }) {
  const id = uid();
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-label={`${code} flag`} className="flag">
      <defs>
        <clipPath id={`c${id}`}><circle cx="50" cy="50" r="46" /></clipPath>
        <radialGradient id={`gl${id}`} cx="35%" cy="25%" r="75%"><stop offset="0" stopColor="#fff" stopOpacity=".55" /><stop offset=".5" stopColor="#fff" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".22" /></radialGradient>
      </defs>
      <circle cx="50" cy="52" r="47" fill="#000" opacity=".08" />
      <g clipPath={`url(#c${id})`}>
        {code === 'fr' && <><rect width="34" height="100" fill="#1F3F9E" /><rect x="33" width="34" height="100" fill="#fff" /><rect x="66" width="34" height="100" fill="#E1253A" /></>}
        {code === 'gb' && <>
          <rect width="100" height="100" fill="#1B2F74" />
          <path d="M0 0L100 100M100 0L0 100" stroke="#fff" strokeWidth="18" />
          <path d="M0 0L100 100M100 0L0 100" stroke="#D5202F" strokeWidth="6" />
          <path d="M50 0V100M0 50H100" stroke="#fff" strokeWidth="26" />
          <path d="M50 0V100M0 50H100" stroke="#D5202F" strokeWidth="14" />
        </>}
        {code === 'us' && <>
          <rect width="100" height="100" fill="#fff" />
          {Array.from({ length: 7 }).map((_, i) => <rect key={i} y={i * 15.4} width="100" height="7.7" fill="#C8213A" />)}
          <rect width="50" height="54" fill="#223B8F" />
          {Array.from({ length: 20 }).map((_, i) => <circle key={i} cx={7 + (i % 5) * 9 + (Math.floor(i / 5) % 2) * 4.5} cy={8 + Math.floor(i / 5) * 12} r="1.9" fill="#fff" />)}
        </>}
        <circle cx="50" cy="50" r="46" fill={`url(#gl${id})`} />
      </g>
      <circle cx="50" cy="50" r="46" fill="none" stroke="#fff" strokeWidth="2.5" />
    </svg>
  );
}

/* ====================== Savings goal objects ====================== */
export function House({ size = 180 }: { size?: number }) {
  const id = uid();
  return (
    <svg width={size} height={size * 0.85} viewBox="0 0 200 170" aria-label="House">
      <defs>
        <linearGradient id={`w${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7FE0A6" /><stop offset="1" stopColor="#1F8E54" /></linearGradient>
        <linearGradient id={`s${id}`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#1F8E54" /><stop offset="1" stopColor="#0E5E35" /></linearGradient>
        <linearGradient id={`r${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3FBF7A" /><stop offset="1" stopColor="#166B3F" /></linearGradient>
      </defs>
      <ellipse cx="100" cy="160" rx="84" ry="7" fill="#000" opacity=".10" />
      <path d="M24 78h110v78H24z" fill={`url(#w${id})`} />
      <path d="M134 78l44-14v80l-44 12z" fill={`url(#s${id})`} />
      <path d="M14 82l66-48 64 48z" fill={`url(#r${id})`} />
      <path d="M80 34l86-10 20 44-42 14z" fill="#2AA864" />
      <rect x="66" y="112" width="26" height="44" rx="2" fill="#0E5E35" />
      {[36, 104].map((x) => <g key={x}><rect x={x} y="96" width="22" height="18" rx="2" fill="#DDFBE9" /><path d={`M${x + 11} 96v18M${x} 105h22`} stroke="#1F8E54" strokeWidth="2" /></g>)}
      <rect x="146" y="92" width="18" height="16" rx="2" fill="#BFF3D5" opacity=".8" />
      <rect x="110" y="16" width="12" height="26" fill="#166B3F" />
    </svg>
  );
}
export function Eiffel({ size = 180 }: { size?: number }) {
  const id = uid();
  return (
    <svg width={size * 0.7} height={size} viewBox="0 0 140 200" aria-label="Eiffel tower">
      <defs><linearGradient id={`e${id}`} x1="0" x2="1"><stop offset="0" stopColor="#7A8089" /><stop offset=".5" stopColor="#E9ECEF" /><stop offset="1" stopColor="#6B7078" /></linearGradient></defs>
      <ellipse cx="70" cy="194" rx="56" ry="5" fill="#000" opacity=".10" />
      <g fill="none" stroke={`url(#e${id})`} strokeLinejoin="round">
        <path d="M70 6v16M64 22h12l4 44h-20z" strokeWidth="4" />
        <path d="M58 66h24l8 50H50z" strokeWidth="4" />
        <path d="M50 116h40l24 74H90l-6-20c-4-12-24-12-28 0l-6 20H26z" strokeWidth="4.5" />
        <path d="M44 66h52M36 116h68M60 30l20 30M80 30L60 60M56 72l28 40M84 72l-28 40" strokeWidth="2" />
        <path d="M46 130l48 40M94 130l-48 40" strokeWidth="1.6" />
      </g>
    </svg>
  );
}
export function Car({ size = 200 }: { size?: number }) {
  const id = uid();
  return (
    <svg width={size} height={size * 0.6} viewBox="0 0 220 130" aria-label="Car">
      <defs>
        <linearGradient id={`b${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FF6B6B" /><stop offset=".6" stopColor="#D61F2C" /><stop offset="1" stopColor="#8E0F18" /></linearGradient>
        <linearGradient id={`g${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#CFE8FF" /><stop offset="1" stopColor="#5B7A99" /></linearGradient>
      </defs>
      <ellipse cx="110" cy="118" rx="96" ry="7" fill="#000" opacity=".14" />
      <path d="M14 86c0-10 8-16 20-18l34-6 28-24c6-5 14-8 22-8h28c10 0 18 4 24 10l20 22 22 6c8 2 14 8 14 16v10c0 4-3 7-7 7H21c-4 0-7-3-7-7z" fill={`url(#b${id})`} />
      <path d="M78 62l24-22c4-3 9-5 14-5h14v27z M138 35h10c7 0 13 3 17 8l16 19h-43z" fill={`url(#g${id})`} />
      <rect x="18" y="82" width="16" height="6" rx="3" fill="#FFE9A8" />
      <rect x="190" y="84" width="14" height="6" rx="3" fill="#FFB3B3" />
      {[58, 164].map((x) => <g key={x}><circle cx={x} cy="104" r="17" fill="#1B1B1B" /><circle cx={x} cy="104" r="8" fill="#BFC4CA" /></g>)}
    </svg>
  );
}

/* ====================== Delivery medallions ====================== */
export function Medallion({ kind, active = false }: { kind: 'vault' | 'truck' | 'home'; active?: boolean }) {
  const id = uid();
  const shape = kind === 'vault'
    ? <path d="M50 4l10 8 13-2 5 12 12 5-2 13 8 10-8 10 2 13-12 5-5 12-13-2-10 8-10-8-13 2-5-12-12-5 2-13-8-10 8-10-2-13 12-5 5-12 13 2z" />
    : kind === 'truck' ? <path d="M50 4l40 23v46L50 96 10 73V27z" /> : <circle cx="50" cy="50" r="46" />;
  return (
    <svg width="64" height="64" viewBox="0 0 100 100" className={`medal ${active ? 'on' : ''}`} aria-label={kind}>
      <defs>
        <linearGradient id={`m${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={active ? '#FFF1BF' : '#FFFFFF'} /><stop offset=".5" stopColor={active ? '#E3AE43' : '#BFC4CB'} /><stop offset="1" stopColor={active ? '#8C5A0D' : '#6E747C'} />
        </linearGradient>
      </defs>
      <g fill={`url(#m${id})`} stroke="#fff" strokeOpacity=".6" strokeWidth="2">{shape}</g>
      <circle cx="50" cy="50" r="30" fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth="2" />
      <g transform="translate(34 34) scale(1.35)" fill="none" stroke={active ? '#6E4306' : '#4B5058'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {kind === 'vault' && <><rect x="2" y="3" width="20" height="18" rx="2" /><circle cx="12" cy="12" r="4" /><path d="M12 8v1M12 15v1M8 12h1M15 12h1" /></>}
        {kind === 'truck' && <><path d="M1 6h13v10H1zM14 9h4l3 3v4h-7" /><circle cx="5" cy="18" r="2" /><circle cx="17" cy="18" r="2" /></>}
        {kind === 'home' && <><path d="M3 11l9-7 9 7v10H3z" /><path d="M9 21v-6h6v6" /></>}
      </g>
    </svg>
  );
}

/* ====================== Asset glyphs ====================== */
export function AssetGlyph({ id, size = 40 }: { id: string; size?: number }) {
  const u = uid();
  if (id === 'gold') return <Coin size={size} shine={false} />;
  if (id === 'silver') return (
    <svg width={size} height={size} viewBox="0 0 100 100"><defs><radialGradient id={`s${u}`} cx="35%" cy="30%"><stop offset="0" stopColor="#fff" /><stop offset=".6" stopColor="#C9CED5" /><stop offset="1" stopColor="#7C838C" /></radialGradient></defs>
      <circle cx="50" cy="50" r="47" fill={`url(#s${u})`} /><circle cx="50" cy="50" r="38" fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth="2" /><text x="50" y="62" textAnchor="middle" fontFamily="Inter Tight,Arial" fontWeight="900" fontSize="32" fill="#6B727B">Ag</text></svg>
  );
  if (id === 'oil') return (
    <svg width={size} height={size} viewBox="0 0 100 100"><defs><linearGradient id={`o${u}`} x1="0" x2="1"><stop offset="0" stopColor="#111" /><stop offset=".45" stopColor="#555" /><stop offset="1" stopColor="#111" /></linearGradient></defs>
      <circle cx="50" cy="50" r="47" fill="#F3F3F3" /><rect x="30" y="22" width="40" height="56" rx="6" fill={`url(#o${u})`} /><path d="M30 38h40M30 62h40" stroke="#888" strokeWidth="2.5" /><path d="M50 43c-5 7-7 10-7 13a7 7 0 0014 0c0-3-2-6-7-13z" fill="#F2C14E" /></svg>
  );
  if (id === 'btc') return (
    <svg width={size} height={size} viewBox="0 0 100 100"><defs><radialGradient id={`b${u}`} cx="35%" cy="30%"><stop offset="0" stopColor="#FFD08A" /><stop offset=".6" stopColor="#F7931A" /><stop offset="1" stopColor="#B8600A" /></radialGradient></defs>
      <circle cx="50" cy="50" r="47" fill={`url(#b${u})`} /><text x="51" y="67" textAnchor="middle" fontFamily="Inter Tight,Arial" fontWeight="900" fontSize="48" fill="#fff" transform="rotate(12 50 50)">₿</text></svg>
  );
  const letter: Record<string, [string, string]> = { tsla: ['T', '#E31937'], aapl: ['A', '#1D1D1F'], nvda: ['N', '#76B900'] };
  const [l, c] = letter[id] ?? ['?', '#999'];
  return (
    <svg width={size} height={size} viewBox="0 0 100 100"><circle cx="50" cy="50" r="47" fill={c} /><text x="50" y="66" textAnchor="middle" fontFamily="Inter Tight,Arial" fontWeight="900" fontSize="44" fill="#fff">{l}</text></svg>
  );
}

/* ====================== Card art ====================== */
export function CardArt({ variant = 'silver', last4 = '3534', name, width = 280 }: { variant?: 'silver' | 'gold' | 'blue' | 'black'; last4?: string; name?: string; width?: number }) {
  return (
    <div className={`card-art card-${variant}`} style={{ width, height: width * 1.42 }}>
      <div className="card-noise" />
      <svg className="card-logo" width="34" height="34" viewBox="0 0 40 40"><path d="M8 30c2-10 6-18 14-22-3 6-3 11 0 14 4-5 9-6 12-6-6 3-9 8-10 14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" /></svg>
      <div className="card-bottom">
        <span className="card-num" style={{ fontSize: Math.max(9, Math.round(width * 0.043)) }}>2345 •••• •••• {last4}</span>
        <span className="card-chip" />
      </div>
      {name && <div className="card-name">{name}</div>}
    </div>
  );
}

/* ============================ Icons ============================ */
type IP = { size?: number; color?: string; stroke?: number };
const I = (d: React.ReactNode) => ({ size = 20, color = 'currentColor', stroke = 2 }: IP) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
export const Icon = {
  back: I(<path d="M15 18l-6-6 6-6" />),
  close: I(<path d="M18 6L6 18M6 6l12 12" />),
  chev: I(<path d="M9 18l6-6-6-6" />),
  dots: I(<><circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" /></>),
  plus: I(<path d="M12 5v14M5 12h14" />),
  send: I(<path d="M22 2L11 13M22 2l-7 20-4-9-9-4z" />),
  withdraw: I(<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M12 13v4M10 15l2 2 2-2" /></>),
  receive: I(<><path d="M20 12V8H6a2 2 0 010-4h12v4" /><path d="M4 6v12a2 2 0 002 2h14v-4" /><path d="M18 12a2 2 0 000 4h4v-4z" /></>),
  eye: I(<><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" /><circle cx="12" cy="12" r="3" /></>),
  eyeOff: I(<><path d="M17.9 17.9A10 10 0 0112 20c-7 0-11-8-11-8a18 18 0 015-5.9M9.9 4.2A9 9 0 0112 4c7 0 11 8 11 8a18 18 0 01-2.2 3.2M1 1l22 22" /></>),
  check: I(<path d="M20 6L9 17l-5-5" />),
  lock: I(<><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" /></>),
  flame: ({ size = 20, color = 'currentColor' }: IP) => <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 2c1 3.5-1.5 5.3-3 7.3C7.6 11.2 7 12.6 7 14.4A5 5 0 0012 19.5a5 5 0 005-5.1c0-2.4-1.2-4.1-2.3-5.3.1 1.6-.6 2.8-1.6 3.3.3-3.6-.8-7.6-1.1-10.4z" /></svg>,
  home: I(<><path d="M3 11l9-8 9 8v10a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z" /></>),
  chart: I(<path d="M3 3v18h18M7 15l4-4 3 3 6-7" />),
  bank: I(<><path d="M3 10h18L12 4zM5 10v8M9 10v8M15 10v8M19 10v8M3 20h18" /></>),
  card: I(<><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20M6 15h4" /></>),
  spark: I(<path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" />),
  user: I(<><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0116 0" /></>),
  copy: I(<><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></>),
  trophy: I(<><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0z" /><path d="M17 5h3v2a3 3 0 01-3 3M7 5H4v2a3 3 0 003 3" /></>),
  gift: I(<><rect x="3" y="8" width="18" height="4" /><path d="M12 8v13M5 12v9h14v-9M12 8S10 3 7.5 4 9 8 12 8zM12 8s2-5 4.5-4S15 8 12 8z" /></>),
  del: I(<><path d="M21 4H8l-7 8 7 8h13a2 2 0 002-2V6a2 2 0 00-2-2z" /><path d="M18 9l-6 6M12 9l6 6" /></>),
  info: I(<><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></>),
  swap: I(<path d="M7 16V4M7 4L3 8M7 4l4 4M17 8v12M17 20l4-4M17 20l-4-4" />),
  vault: I(<><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="12" cy="12" r="4" /><path d="M12 8v1M12 15v1M8 12h1M15 12h1" /></>),
  truck: I(<><path d="M1 6h13v10H1zM14 9h4l3 3v4h-7" /><circle cx="5" cy="18" r="2" /><circle cx="17" cy="18" r="2" /></>),
  phone: I(<><rect x="6" y="2" width="12" height="20" rx="3" /><path d="M11 18h2" /></>),
  logout: I(<><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" /></>),
};
