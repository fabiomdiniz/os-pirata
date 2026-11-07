import { useEffect, useRef, useState } from 'react';

export type ChartSeries = {
  id: string;
  name: string;
  color: string;
  values: number[];
};

function niceStep(raw: number): number {
  if (raw <= 0) return 10;
  const power = Math.pow(10, Math.floor(Math.log10(raw)));
  const normalized = raw / power;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * power;
}

export function ScoreChart({ series, rounds }: { series: ChartSeries[]; rounds: number }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(320);

  useEffect(() => {
    const element = hostRef.current;
    if (!element) return;
    setWidth(element.clientWidth);
    const observer = new ResizeObserver((entries) => {
      const next = entries[0]?.contentRect.width ?? element.clientWidth;
      setWidth(next);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const height = 196;
  const padL = 32;
  const padR = 10;
  const padT = 12;
  const padB = 20;
  const innerW = Math.max(20, width - padL - padR);
  const innerH = height - padT - padB;

  const all = series.flatMap((line) => line.values);
  const rawMin = Math.min(0, ...all);
  const rawMax = Math.max(0, ...all);
  const step = niceStep(Math.max(10, (rawMax - rawMin) / 4));
  const yMin = Math.floor(rawMin / step) * step;
  const yMax = Math.ceil(Math.max(rawMax, step) / step) * step;
  const span = yMax - yMin || 1;

  const points = rounds + 1;
  const x = (index: number) => padL + (points <= 1 ? innerW / 2 : (index / (points - 1)) * innerW);
  const y = (value: number) => padT + innerH - ((value - yMin) / span) * innerH;

  const ticks: number[] = [];
  for (let value = yMin; value <= yMax; value += step) ticks.push(value);

  const showEvery = points > 12 ? 2 : 1;

  return (
    <div ref={hostRef} style={{ width: '100%' }}>
      <svg
        className="chart"
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        role="img"
        aria-label={`Score evolution over ${rounds} rounds for ${series.map((line) => line.name).join(', ')}`}
      >
        {ticks.map((tick) => (
          <g key={tick}>
            <line
              className={tick === 0 ? 'chart__zero' : 'chart__grid'}
              x1={padL}
              x2={width - padR}
              y1={y(tick)}
              y2={y(tick)}
            />
            <text x={padL - 6} y={y(tick)} textAnchor="end" dominantBaseline="middle">
              {tick}
            </text>
          </g>
        ))}

        {Array.from({ length: points }, (_, index) => index)
          .filter((index) => index % showEvery === 0 || index === points - 1)
          .map((index) => (
            <text key={index} x={x(index)} y={height - 5} textAnchor="middle">
              {index === 0 ? '' : index}
            </text>
          ))}

        {series.map((line) => {
          const d = line.values
            .map((value, index) => `${index === 0 ? 'M' : 'L'}${x(index).toFixed(1)} ${y(value).toFixed(1)}`)
            .join(' ');
          return (
            <g key={line.id}>
              <path className="chart__line" d={d} stroke={line.color} />
              {line.values.map((value, index) => (
                <circle
                  key={index}
                  className="chart__dot"
                  cx={x(index)}
                  cy={y(value)}
                  r={index === line.values.length - 1 ? 2.8 : 1.9}
                  fill={line.color}
                />
              ))}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
