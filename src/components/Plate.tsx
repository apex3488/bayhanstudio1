import type { ReactNode } from "react";
import type { PlateKind } from "@/content/data";

/**
 * Blueprint plates: architectural drawings with an interface inscribed in them.
 * Stone lines use currentColor, the single line of light uses .pl-a.
 */

const arc = (cx: number, cy: number, r: number, a0: number, a1: number) => {
  const p = (a: number) => [cx + r * Math.cos(a), cy + r * Math.sin(a)].map((n) => n.toFixed(2)).join(" ");
  const large = Math.abs(a1 - a0) > Math.PI ? 1 : 0;
  return `M${p(a0)} A${r} ${r} 0 ${large} ${a1 > a0 ? 1 : 0} ${p(a1)}`;
};

const drawings: Record<PlateKind, () => ReactNode> = {
  /* plan of a round temple */
  tholos: () => (
    <>
      <circle cx="200" cy="150" r="118" />
      <circle cx="200" cy="150" r="104" />
      <circle cx="200" cy="150" r="58" />
      <circle cx="200" cy="150" r="20" />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return <circle key={i} cx={200 + 104 * Math.cos(a)} cy={150 + 104 * Math.sin(a)} r="7" />;
      })}
      <line x1="60" y1="150" x2="340" y2="150" />
      <line x1="200" y1="14" x2="200" y2="286" />
      <path className="pl-a" d={arc(200, 150, 82, -1.2, 0.5)} />
      <line className="pl-a" x1="200" y1="150" x2={200 + 118 * Math.cos(0.5)} y2={150 + 118 * Math.sin(0.5)} />
      <circle className="pl-a pl-f" cx="200" cy="150" r="4" />
    </>
  ),
  /* an arch with a page inside */
  web: () => (
    <>
      <path d="M92 270 V120 A108 108 0 0 1 308 120 V270" />
      <path d="M116 270 V122 A84 84 0 0 1 284 122 V270" />
      <line x1="60" y1="270" x2="340" y2="270" />
      <line x1="76" y1="282" x2="324" y2="282" />
      <line x1="132" y1="112" x2="268" y2="112" />
      <rect x="132" y="126" width="136" height="54" />
      <rect x="132" y="192" width="40" height="52" />
      <rect x="180" y="192" width="40" height="52" />
      <rect x="228" y="192" width="40" height="52" />
      <line className="pl-a" x1="132" y1="98" x2="176" y2="98" />
      <rect className="pl-a" x="146" y="158" width="46" height="12" />
      <circle className="pl-a pl-f" cx="200" cy="38" r="3" />
    </>
  ),
  /* a stele-phone with a dialogue, Hermes' wings */
  bots: () => (
    <>
      <rect x="146" y="34" width="108" height="232" rx="14" />
      <line x1="182" y1="48" x2="218" y2="48" />
      <rect x="160" y="74" width="62" height="22" rx="6" />
      <rect x="178" y="106" width="62" height="30" rx="6" />
      <rect x="160" y="146" width="48" height="22" rx="6" />
      <rect x="160" y="222" width="80" height="26" rx="13" />
      <path d="M134 110 C96 96 66 100 40 124" />
      <path d="M134 132 C100 122 76 126 56 146" />
      <path d="M134 154 C108 148 92 152 78 166" />
      <path d="M266 110 C304 96 334 100 360 124" />
      <path d="M266 132 C300 122 324 126 344 146" />
      <path d="M266 154 C292 148 308 152 322 166" />
      <rect className="pl-a" x="178" y="178" width="62" height="30" rx="6" />
      <path className="pl-a pl-f" d="M222 229 L232 235 L222 241 Z" />
    </>
  ),
  /* an amphitheatre around a phone */
  mobile: () => (
    <>
      {[60, 84, 108, 132, 156].map((r) => (
        <path key={r} d={arc(200, 250, r, Math.PI, Math.PI * 2)} />
      ))}
      {[-0.82, -0.5, -0.18, 0.18, 0.5, 0.82].map((t) => {
        const a = -Math.PI / 2 + t * (Math.PI / 2);
        return (
          <line
            key={t}
            x1={200 + 60 * Math.cos(a)}
            y1={250 + 60 * Math.sin(a)}
            x2={200 + 156 * Math.cos(a)}
            y2={250 + 156 * Math.sin(a)}
          />
        );
      })}
      <line x1="30" y1="250" x2="370" y2="250" />
      <rect x="176" y="176" width="48" height="92" rx="8" />
      <line x1="192" y1="186" x2="208" y2="186" />
      <path className="pl-a" d={arc(200, 250, 120, Math.PI * 1.18, Math.PI * 1.44)} />
      <circle className="pl-a pl-f" cx={200 + 120 * Math.cos(Math.PI * 1.31)} cy={250 + 120 * Math.sin(Math.PI * 1.31)} r="4" />
      <rect className="pl-a" x="184" y="204" width="32" height="20" />
    </>
  ),
  /* golden section */
  design: () => (
    <>
      <rect x="56" y="46" width="288" height="178" />
      <line x1="234" y1="46" x2="234" y2="224" />
      <line x1="234" y1="156" x2="344" y2="156" />
      <line x1="276" y1="156" x2="276" y2="224" />
      <line x1="234" y1="198" x2="276" y2="198" />
      <line x1="56" y1="246" x2="344" y2="246" />
      <line x1="56" y1="240" x2="56" y2="252" />
      <line x1="234" y1="240" x2="234" y2="252" />
      <line x1="344" y1="240" x2="344" y2="252" />
      <circle cx="145" cy="135" r="62" />
      <path
        className="pl-a"
        d="M56 224 A178 178 0 0 1 234 46 A110 110 0 0 1 344 156 A68 68 0 0 1 276 224 A42 42 0 0 1 234 182 A26 26 0 0 1 260 156"
      />
      <circle className="pl-a pl-f" cx="260" cy="156" r="3" />
    </>
  ),
  /* a pipeline built as a colonnade */
  crm: () => (
    <>
      <line x1="40" y1="52" x2="360" y2="52" />
      <line x1="52" y1="66" x2="348" y2="66" />
      <line x1="40" y1="262" x2="360" y2="262" />
      {[64, 124, 184, 244, 304].map((x, i) => (
        <g key={x}>
          <rect x={x} y="78" width="34" height="172" />
          {Array.from({ length: 4 - Math.min(i, 3) + (i === 4 ? 1 : 0) }, (_, k) => (
            <rect key={k} x={x + 6} y={88 + k * 26} width="22" height="16" />
          ))}
        </g>
      ))}
      <polyline className="pl-a" points="81,214 141,196 201,170 261,136 321,96" />
      {[
        [81, 214],
        [141, 196],
        [201, 170],
        [261, 136],
        [321, 96],
      ].map(([x, y]) => (
        <circle key={x} className="pl-a pl-f" cx={x} cy={y} r="3.5" />
      ))}
    </>
  ),
  /* the oracle: a voice inside concentric rings */
  ai: () => (
    <>
      <circle cx="200" cy="150" r="120" />
      <circle cx="200" cy="150" r="92" strokeDasharray="2 7" data-nodraw="" />
      <circle cx="200" cy="150" r="64" />
      <path d="M200 30 L304 210 H96 Z" />
      {Array.from({ length: 23 }, (_, i) => {
        const x = 112 + i * 8;
        const h = 6 + Math.abs(Math.sin(i * 0.9) * Math.cos(i * 0.37)) * 46;
        return <line key={i} className={i > 7 && i < 15 ? "pl-a" : undefined} x1={x} y1={150 - h / 2} x2={x} y2={150 + h / 2} />;
      })}
      <line x1="60" y1="270" x2="340" y2="270" />
      <circle className="pl-a pl-f" cx="200" cy="30" r="4" />
    </>
  ),
};

export default function Plate({
  kind,
  title,
  draw = true,
  className,
}: {
  kind: PlateKind;
  /** Accessible name. Leave empty for decorative use. */
  title?: string;
  draw?: boolean;
  className?: string;
}) {
  return (
    <svg
      className={`plate ${className ?? ""}`}
      viewBox="0 0 400 300"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      vectorEffect="non-scaling-stroke"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
      {...(draw ? { "data-draw": "" } : {})}
    >
      <g className="plate__frame" data-nodraw="">
        <path d="M8 24 V8 H24 M376 8 H392 V24 M392 276 V292 H376 M24 292 H8 V276" />
      </g>
      {drawings[kind]()}
    </svg>
  );
}

/** The façade raised in the Canon section, in four build stages. */
export function CanonFigure({ label }: { label: string }) {
  const cols = [116, 198, 280, 362, 444, 526];
  return (
    <svg className="canon__svg" viewBox="0 0 640 520" fill="none" stroke="currentColor" strokeWidth="1" role="img" aria-label={label}>
      <g data-build="0">
        <path d="M40 486 H600" />
        <path d="M56 486 V470 H584 V486" />
        <path d="M72 470 V454 H568 V470" />
        <path d="M88 454 V438 H552 V454" />
      </g>
      <g data-build="1">
        {cols.map((x) => (
          <g key={x}>
            <path d={`M${x - 22} 438 L${x - 17} 214`} />
            <path d={`M${x + 22} 438 L${x + 17} 214`} />
            <path d={`M${x - 8} 438 L${x - 6} 214`} />
            <path d={`M${x + 8} 438 L${x + 6} 214`} />
            <path d={`M${x - 17} 214 L${x - 26} 200 H${x + 26} L${x + 17} 214 Z`} />
            <path d={`M${x - 30} 200 V190 H${x + 30} V200`} />
          </g>
        ))}
      </g>
      <g data-build="2">
        <path d="M80 190 V166 H560 V190 Z" />
        <path d="M80 166 V140 H560 V166" />
        {Array.from({ length: 13 }, (_, i) => (
          <path key={i} d={`M${104 + i * 36} 144 V162 M${110 + i * 36} 144 V162 M${116 + i * 36} 144 V162`} />
        ))}
        <path d="M68 140 V130 H572 V140 Z" />
      </g>
      <g data-build="3">
        <path d="M68 130 L320 44 L572 130" />
        <path d="M110 126 L320 56 L530 126" />
        <circle className="pl-a" cx="320" cy="98" r="16" />
        <path className="pl-a" d="M320 74 V62 M298 86 L288 80 M342 86 L352 80 M296 110 L284 114 M344 110 L356 114" />
        <path className="pl-a" d="M94 326 H546" />
        <path className="pl-a" d="M94 330 H546" />
      </g>
    </svg>
  );
}
