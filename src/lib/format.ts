export const PLAYER_COLORS = [
  'var(--p1)',
  'var(--p2)',
  'var(--p3)',
  'var(--p4)',
  'var(--p5)',
  'var(--p6)',
  'var(--p7)',
  'var(--p8)',
  'var(--p9)',
];

export function playerColor(index: number): string {
  return PLAYER_COLORS[index % PLAYER_COLORS.length];
}

/** Raw hex-ish values for SVG fills, where CSS vars work but we also need alpha. */
export const PLAYER_SWATCH = [
  '#e2b25a',
  '#5fd0a4',
  '#ef8770',
  '#8db8dd',
  '#b598dc',
  '#e8d391',
  '#79cfd3',
  '#e392ab',
  '#a8c37c',
];

export function swatch(index: number): string {
  return PLAYER_SWATCH[index % PLAYER_SWATCH.length];
}

export function signed(value: number, dashZero = false): string {
  if (value === 0 && dashZero) return '—';
  if (value > 0) return `+${value}`;
  if (value < 0) return `−${Math.abs(value)}`;
  return '0';
}

export function deltaClass(value: number): string {
  if (value > 0) return 'delta-pos';
  if (value < 0) return 'delta-neg';
  return 'delta-nil';
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export function formatDateTime(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return n === 1 ? one : many;
}

export function cardsLabel(n: number): string {
  return `${n} ${plural(n, 'card')}`;
}

export function describeSchedule(schedule: number[]): string {
  if (schedule.length === 0) return 'No rounds';
  const unique = Array.from(new Set(schedule));
  if (unique.length === 1) return `${schedule.length} rounds of ${unique[0]}`;
  const ascending = schedule.every((v, i) => i === 0 || v >= schedule[i - 1]);
  if (ascending && schedule[0] === 1 && schedule[schedule.length - 1] === schedule.length) {
    return `${schedule.length} rounds, 1 → ${schedule[schedule.length - 1]}`;
  }
  return `${schedule.length} rounds`;
}
