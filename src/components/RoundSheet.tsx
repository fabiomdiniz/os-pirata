import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { BonusKey, Round, Session } from '../lib/types';
import { BONUS_META, BONUS_ORDER, roundLeader, scoreEntry } from '../lib/rules';
import { cardsLabel, deltaClass, playerColor, signed } from '../lib/format';
import { Counter, Icon, Sheet, Stepper } from './ui';

export function RoundSheet({
  session,
  index,
  round,
  isNew,
  onSave,
  onClose,
  onDelete,
}: {
  session: Session;
  index: number;
  round: Round;
  isNew: boolean;
  onSave: (round: Round) => void;
  onClose: () => void;
  onDelete?: () => void;
}) {
  const [draft, setDraft] = useState<Round>(() => structuredClone(round));
  const [openBonuses, setOpenBonuses] = useState<Record<string, boolean>>({});
  const [overrideFor, setOverrideFor] = useState<string | null>(null);
  const [overrideValue, setOverrideValue] = useState('');
  const overrideRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (overrideFor) overrideRef.current?.focus({ preventScroll: true });
  }, [overrideFor]);

  const availableBonuses = BONUS_ORDER.filter((key) => {
    const needs = BONUS_META[key].needs;
    return needs === 'base' || session.deck[needs];
  });

  const updateEntry = (playerId: string, patch: Partial<Round['entries'][string]>) => {
    setDraft((current) => ({
      ...current,
      entries: {
        ...current.entries,
        [playerId]: { ...current.entries[playerId], ...patch },
      },
    }));
  };

  const bumpEntry = (playerId: string, field: 'bid' | 'tricks', delta: number) => {
    setDraft((current) => {
      const entry = current.entries[playerId];
      const next = Math.max(0, Math.min(current.cards, entry[field] + delta));
      return {
        ...current,
        entries: { ...current.entries, [playerId]: { ...entry, [field]: next } },
      };
    });
  };

  const bumpBonus = (playerId: string, key: BonusKey, delta: number) => {
    setDraft((current) => {
      const entry = current.entries[playerId];
      const value = Math.max(0, Math.min(9, (entry.bonuses[key] ?? 0) + delta));
      const bonuses = { ...entry.bonuses, [key]: value };
      if (value === 0) delete bonuses[key];
      return {
        ...current,
        entries: { ...current.entries, [playerId]: { ...entry, bonuses } },
      };
    });
  };

  const setOverride = (playerId: string, value: number | null) => {
    setDraft((current) => {
      const overrides = { ...current.overrides };
      if (value === null) delete overrides[playerId];
      else overrides[playerId] = value;
      return { ...current, overrides };
    });
  };

  const applyOverrideInput = (playerId: string) => {
    const trimmed = overrideValue.trim();
    if (trimmed === '') {
      setOverride(playerId, null);
    } else {
      const parsed = Number(trimmed);
      if (Number.isFinite(parsed)) setOverride(playerId, Math.round(parsed));
    }
    setOverrideFor(null);
    setOverrideValue('');
  };

  const preview = session.players.map((player) => {
    const entry = draft.entries[player.id];
    const scored = scoreEntry(entry, draft.cards, session.rules);
    const override = draft.overrides[player.id];
    const hasOverride = typeof override === 'number';
    return {
      player,
      entry,
      scored,
      points: hasOverride ? override : scored.computed,
      hasOverride,
    };
  });

  const leader = roundLeader(session, index);
  const roundTotal = preview.reduce((sum, row) => sum + row.points, 0);
  const tricksSum = preview.reduce((sum, row) => sum + row.entry.tricks, 0);

  return (
    <Sheet
      title={`Round ${index + 1}`}
      sub={`${cardsLabel(draft.cards)} each · ${leader?.name ?? '—'} leads`}
      onClose={onClose}
      footer={
        <>
          <span className="sheet__foot-note num">{signed(roundTotal)} pts</span>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => {
              onSave(draft);
              onClose();
            }}
          >
            {isNew ? 'Save round' : 'Update round'}
          </button>
        </>
      }
    >
      <div className="sheet__summary">
        <span>
          Tricks logged <b className="num">{tricksSum}</b> of <b className="num">{draft.cards}</b>
        </span>
        <span className="num">{signed(roundTotal)} pts</span>
      </div>

      {session.rules.scoring === 'rascal' ? (
        <p className="notice">
          Rascal scoring: {10 * draft.cards} points for a direct hit, {Math.floor((10 * draft.cards) / 2)} for one
          off, nothing beyond that.
          {session.rules.rascalCannons ? ' Cannonball pays 15 a card, but only on a direct hit.' : ''}
        </p>
      ) : null}

      {preview.map(({ player, entry, points, hasOverride, scored }, playerIndex) => {
        const bonusCount = Object.values(entry.bonuses).reduce((sum, value) => sum + (value ?? 0), 0);
        const exact = entry.bid === entry.tricks;
        const isOpen = openBonuses[player.id] ?? false;
        return (
          <section className="entry" key={player.id}>
            <header className="entry__head">
              <span className="dot dot--sm" style={{ '--dot': playerColor(playerIndex) } as CSSProperties} />
              <span className="entry__name">{player.name}</span>
              {hasOverride ? <span className="tag tag--brass">override</span> : null}
              <span className={`entry__pts num ${deltaClass(points)}`}>{signed(points)}</span>
            </header>

            <div className="entry__grid">
              <Stepper
                label="Bid"
                value={entry.bid}
                max={draft.cards}
                onStep={(delta) => bumpEntry(player.id, 'bid', delta)}
              />
              <Stepper
                label="Tricks won"
                value={entry.tricks}
                max={draft.cards}
                onStep={(delta) => bumpEntry(player.id, 'tricks', delta)}
              />
            </div>

            {session.rules.scoring === 'rascal' && session.rules.rascalCannons ? (
              <div className="chips" role="group" aria-label={`${player.name} cannon load`}>
                {(['grapeshot', 'cannonball'] as const).map((cannon) => (
                  <button
                    key={cannon}
                    type="button"
                    className="chip"
                    aria-pressed={entry.cannon === cannon}
                    onClick={() => updateEntry(player.id, { cannon })}
                  >
                    {cannon === 'grapeshot' ? 'Grapeshot' : 'Cannonball'}
                  </button>
                ))}
              </div>
            ) : null}

            {session.rules.pirateAbilities ? (
              <div className="chips" role="group" aria-label={`${player.name} Rascal wager`}>
                <span className="chip chip--static">Wager</span>
                {[0, 10, 20].map((wager) => (
                  <button
                    key={wager}
                    type="button"
                    className="chip"
                    aria-pressed={entry.wager === wager}
                    onClick={() => updateEntry(player.id, { wager })}
                  >
                    {wager === 0 ? 'None' : wager}
                  </button>
                ))}
              </div>
            ) : null}

            {session.rules.bonuses ? (
              <>
                <button
                  type="button"
                  className="disclosure"
                  aria-expanded={isOpen}
                  onClick={() => setOpenBonuses((current) => ({ ...current, [player.id]: !isOpen }))}
                >
                  Bonuses
                  <span className="tag">{bonusCount}</span>
                  {!exact && session.rules.bonusRequiresBid ? <span className="tiny">bid missed</span> : null}
                  <Icon name="chevron" size={14} className="disclosure__chev" />
                </button>
                {isOpen ? (
                  <div>
                    {!exact && session.rules.bonusRequiresBid ? (
                      <p className="notice notice--warn" style={{ marginBottom: '0.5rem' }}>
                        No bid, no bonus — these are kept but score nothing this round.
                      </p>
                    ) : null}
                    {availableBonuses.map((key) => {
                      const meta = BONUS_META[key];
                      return (
                        <div className="bonus" key={key}>
                          <div className="bonus__label">
                            <span className="bonus__name">{meta.label}</span>
                            <span className="bonus__value num">
                              {meta.points > 0 ? `+${meta.points}` : `−${Math.abs(meta.points)}`}
                            </span>
                          </div>
                          <Counter
                            label={meta.label}
                            value={entry.bonuses[key] ?? 0}
                            onStep={(delta) => bumpBonus(player.id, key, delta)}
                          />
                        </div>
                      );
                    })}
                    {scored.bonusesIgnored ? (
                      <p className="tiny" style={{ paddingTop: '0.35rem' }}>
                        Bonuses are not counted because the bid failed.
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </>
            ) : null}

            {overrideFor === player.id ? (
              <div className="override-row">
                <input
                  ref={overrideRef}
                  className="input input--num"
                  type="number"
                  inputMode="numeric"
                  value={overrideValue}
                  placeholder={String(points)}
                  aria-label={`Override points for ${player.name}`}
                  onChange={(event) => setOverrideValue(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') applyOverrideInput(player.id);
                  }}
                />
                <button type="button" className="btn btn--sm btn--primary" onClick={() => applyOverrideInput(player.id)}>
                  Apply
                </button>
                <button
                  type="button"
                  className="btn btn--sm btn--ghost"
                  onClick={() => {
                    setOverrideFor(null);
                    setOverrideValue('');
                  }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="override-row">
                <span className="tiny">
                  {hasOverride ? `Admin set ${signed(points)} this round` : 'From the rules in play'}
                </span>
                {hasOverride ? (
                  <button type="button" className="linkish" onClick={() => setOverride(player.id, null)}>
                    Clear override
                  </button>
                ) : (
                  <button
                    type="button"
                    className="linkish"
                    onClick={() => {
                      setOverrideFor(player.id);
                      setOverrideValue(String(points));
                    }}
                  >
                    Override
                  </button>
                )}
              </div>
            )}
          </section>
        );
      })}

      <label className="field">
        <span className="field__label">Table note</span>
        <input
          className="input"
          value={draft.note}
          maxLength={120}
          placeholder="Kraken ate the trick, obviously"
          onChange={(event) => setDraft((current) => ({ ...current, note: event.target.value }))}
        />
      </label>

      {!isNew && onDelete ? (
        <button
          type="button"
          className="btn btn--danger btn--block"
          onClick={() => {
            onDelete();
            onClose();
          }}
        >
          <Icon name="trash" size={14} />
          Remove this round
        </button>
      ) : null}
    </Sheet>
  );
}
