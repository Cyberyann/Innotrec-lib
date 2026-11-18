import { useId, useMemo, type ReactNode } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { cx } from './cx';

export interface ChartDatum {
  label: string;
  value: number;
  /** Optional color for this datum (bar / donut). */
  color?: string;
}

export interface ChartProps {
  type?: 'bar' | 'line' | 'donut';
  data: ChartDatum[];
  /** Accessible title (also rendered as a heading unless `hideTitle`). */
  title: string;
  hideTitle?: boolean;
  height?: number;
  formatValue?: (value: number) => string;
  className?: string;
}

const WIDTH = 600;
const PADDING = { top: 16, right: 16, bottom: 36, left: 44 };
const PALETTE = Array.from({ length: 6 }, (_, i) => `var(--iu-chart-${i + 1})`);

export function niceMax(value: number): number {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const steps = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];
  const step = steps.find((candidate) => normalized <= candidate) ?? 10;
  return step * magnitude;
}

/**
 * Dependency-free SVG chart (bar, line, donut). Responsive (scales with its container)
 * and accessible: `role="img"` with a title, plus a visually hidden data table.
 */
export function Chart({
  type = 'bar',
  data,
  title,
  hideTitle = false,
  height = 260,
  formatValue = (v) => v.toLocaleString(),
  className,
}: ChartProps) {
  const { t } = useI18n();
  const titleId = useId();
  const max = useMemo(() => niceMax(Math.max(0, ...data.map((d) => d.value))), [data]);
  const innerW = WIDTH - PADDING.left - PADDING.right;
  const innerH = height - PADDING.top - PADDING.bottom;
  const y = (value: number) => PADDING.top + innerH - (value / max) * innerH;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => ratio * max);

  let body: ReactNode = null;
  if (data.length === 0) {
    body = (
      <text x={WIDTH / 2} y={height / 2} textAnchor="middle" className="iu-chart__empty">
        {t('chart.empty')}
      </text>
    );
  } else if (type === 'donut') {
    const total = data.reduce((sum, d) => sum + Math.max(0, d.value), 0) || 1;
    const radius = Math.min(height / 2 - 12, 110);
    const cx0 = radius + 24;
    const cy0 = height / 2;
    let angle = -Math.PI / 2;
    body = (
      <g>
        {data.map((d, i) => {
          const portion = Math.max(0, d.value) / total;
          const start = angle;
          const end = angle + portion * Math.PI * 2;
          angle = end;
          const large = end - start > Math.PI ? 1 : 0;
          const p = (a: number) => `${cx0 + radius * Math.cos(a)} ${cy0 + radius * Math.sin(a)}`;
          const path =
            portion >= 0.9999
              ? `M ${cx0 - radius} ${cy0} a ${radius} ${radius} 0 1 0 ${radius * 2} 0 a ${radius} ${radius} 0 1 0 ${-radius * 2} 0`
              : `M ${cx0} ${cy0} L ${p(start)} A ${radius} ${radius} 0 ${large} 1 ${p(end)} Z`;
          return (
            <path
              key={d.label}
              d={path}
              fill={d.color ?? PALETTE[i % PALETTE.length]}
              className="iu-chart__slice"
            >
              <title>{`${d.label}: ${formatValue(d.value)}`}</title>
            </path>
          );
        })}
        <circle cx={cx0} cy={cy0} r={radius * 0.55} className="iu-chart__hole" />
        {data.map((d, i) => (
          <g
            key={`legend-${d.label}`}
            transform={`translate(${cx0 + radius + 40}, ${24 + i * 26})`}
          >
            <rect width="14" height="14" rx="3" fill={d.color ?? PALETTE[i % PALETTE.length]} />
            <text x="22" y="12" className="iu-chart__legend">
              {d.label} — {formatValue(d.value)}
            </text>
          </g>
        ))}
      </g>
    );
  } else {
    const band = innerW / data.length;
    const points = data.map((d, i) => ({
      x: PADDING.left + band * i + band / 2,
      y: y(d.value),
      d,
      i,
    }));
    body = (
      <g>
        {ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={PADDING.left}
              x2={WIDTH - PADDING.right}
              y1={y(tick)}
              y2={y(tick)}
              className="iu-chart__grid"
            />
            <text x={PADDING.left - 8} y={y(tick) + 4} textAnchor="end" className="iu-chart__axis">
              {formatValue(tick)}
            </text>
          </g>
        ))}
        {type === 'bar' ? (
          points.map(({ x, y: top, d, i }) => {
            const barW = Math.min(band * 0.6, 64);
            return (
              <rect
                key={d.label}
                x={x - barW / 2}
                y={top}
                width={barW}
                height={Math.max(0, PADDING.top + innerH - top)}
                rx="4"
                fill={d.color ?? PALETTE[i % PALETTE.length]}
                className="iu-chart__bar"
              >
                <title>{`${d.label}: ${formatValue(d.value)}`}</title>
              </rect>
            );
          })
        ) : (
          <g>
            <polyline
              points={points.map((pt) => `${pt.x},${pt.y}`).join(' ')}
              fill="none"
              stroke={PALETTE[0]}
              strokeWidth="2.5"
              className="iu-chart__line"
            />
            {points.map(({ x, y: py, d }) => (
              <circle
                key={d.label}
                cx={x}
                cy={py}
                r="4"
                fill={PALETTE[0]}
                className="iu-chart__point"
              >
                <title>{`${d.label}: ${formatValue(d.value)}`}</title>
              </circle>
            ))}
          </g>
        )}
        {points.map(({ x, d }) => (
          <text
            key={`x-${d.label}`}
            x={x}
            y={height - 12}
            textAnchor="middle"
            className="iu-chart__axis"
          >
            {d.label}
          </text>
        ))}
      </g>
    );
  }

  return (
    <figure className={cx('iu-chart', className)}>
      {!hideTitle && <figcaption className="iu-chart__title">{title}</figcaption>}
      <svg
        viewBox={`0 0 ${WIDTH} ${height}`}
        role="img"
        aria-labelledby={titleId}
        preserveAspectRatio="xMidYMid meet"
      >
        <title id={titleId}>{title}</title>
        {body}
      </svg>
      <table className="iu-sr-only">
        <caption>{title}</caption>
        <tbody>
          {data.map((d) => (
            <tr key={d.label}>
              <th scope="row">{d.label}</th>
              <td>{formatValue(d.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
