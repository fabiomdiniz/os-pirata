import { useMemo, useState, type CSSProperties } from 'react';
import type { DeckConfig, Rules } from '../lib/types';
import {
  DECK_ITEMS,
  DEFAULT_DECK,
  DEFAULT_RULES,
  FULL_DECK,
  ROUND_PRESETS,
  deckSize,
  defaultSchedule,
  maxCardsFor,
} from '../lib/rules';
import { describeSchedule, playerColor } from '../lib/format';
import { Counter, Icon, Switch } from '../components/ui';

const STEP_TITLES = ['Crew', 'Rules & cards', 'Rounds'] as const;
const STEP_LEDE = [
  'Who is at the table? Names go straight onto the ledger.',
  'Pick the scoring your table plays and the cards you actually deal.',
  'Choose a round structure, or build your own.',
] as const;

export function Setup({
  onCancel,
  onCreate,
}: {
  onCancel: () => void;
  onCreate: (input: {
    title: string;
    players: string[];
    rules: Rules;
    deck: DeckConfig;
    schedule: number[] | null;
    firstLeaderIndex: number;
  }) => void;
}) {
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState('');
  const [names, setNames] = useState<string[]>(['', '']);
  const [rules, setRules] = useState<Rules>(DEFAULT_RULES);
  const [deck, setDeck] = useState<DeckConfig>(DEFAULT_DECK);
  const [leaderIndex, setLeaderIndex] = useState(0);
  const [plan, setPlan] = useState<{ key: string; cards: number[] | null }>({ key: 'classic', cards: null });
  const [error, setError] = useState('');

  const crewCount = Math.max(2, names.length);
  const safeLeader = Math.min(leaderIndex, names.length - 1);
  const leaderName = (offset: number) => {
    const name = names[(safeLeader + offset) % Math.max(1, names.length)]?.trim();
    return name || `Player ${((safeLeader + offset) % names.length) + 1}`;
  };
  const schedule = useMemo(
    () => plan.cards ?? defaultSchedule(10, crewCount, deck),
    [plan, crewCount, deck],
  );
  const ceiling = maxCardsFor(crewCount, deck);

  const crewReady = names.length >= 2 && names.every((name) => name.trim().length > 0);

  const next = () => {
    if (step === 0 && !crewReady) {
      setError('Every crew member needs a name — at least two of them.');
      return;
    }
    setError('');
    if (step < 2) {
      setStep(step + 1);
      return;
    }
    onCreate({
      title,
      players: names.map((name) => name.trim()),
      rules,
      deck,
      schedule,
      firstLeaderIndex: safeLeader,
    });
  };

  const back = () => {
    if (step === 0) {
      onCancel();
      return;
    }
    setError('');
    setStep(step - 1);
  };

  const bumpCards = (index: number, delta: number) => {
    setPlan((current) => {
      const base = current.cards ?? defaultSchedule(10, crewCount, deck);
      const nextCards = base.map((cards, i) =>
        i === index ? Math.max(1, Math.min(10, cards + delta)) : cards,
      );
      return { key: 'custom', cards: nextCards };
    });
  };

  return (
    <>
      <header className="appbar">
        <button type="button" className="icon-btn" onClick={back} aria-label="Back">
          <Icon name="back" size={18} />
        </button>
        <img className="brand__logo brand__logo--solo" src="/icon-192.png" alt="" width={24} height={24} />
        <div className="appbar__grow">
          <span className="appbar__title">New game</span>
          <span className="appbar__meta">Step {step + 1} of 3</span>
        </div>
      </header>

      <main className="page page--bare page--dock">
        <header className="setup__head">
          <h1 className="setup__title">{STEP_TITLES[step]}</h1>
          <p className="lede">{STEP_LEDE[step]}</p>
          <div className="steps" aria-hidden="true">
            {[0, 1, 2].map((index) => (
              <span key={index} className={`steps__seg${index <= step ? ' is-done' : ''}`} />
            ))}
          </div>
        </header>

        {step === 0 ? (
          <div className="setup__body">
            <div className="block">
              <div className="block__head">
                <h2 className="block__title">At the table</h2>
                <span className="block__note">2–9 players</span>
              </div>
              <div className="player-rows">
                {names.map((name, index) => (
                  <div className="player-row" key={index}>
                    <span className="dot dot--sm" style={{ '--dot': playerColor(index) } as CSSProperties} />
                    <input
                      className="input"
                      value={name}
                      placeholder={`Player ${index + 1}`}
                      aria-label={`Player ${index + 1} name`}
                      autoComplete="off"
                      onChange={(event) => {
                        const nextNames = [...names];
                        nextNames[index] = event.target.value;
                        setNames(nextNames);
                        setError('');
                      }}
                    />
                    {names.length > 2 ? (
                      <button
                        type="button"
                        className="icon-btn"
                        aria-label={`Remove player ${index + 1}`}
                        onClick={() => setNames(names.filter((_, i) => i !== index))}
                      >
                        <Icon name="trash" size={16} />
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
              <div className="cta-bar">
                <button
                  type="button"
                  className="btn btn--quiet btn--block"
                  disabled={names.length >= 9}
                  onClick={() => setNames([...names, ''])}
                >
                  <Icon name="plus" size={13} strokeWidth={2.2} />
                  Add player
                </button>
              </div>
              {error ? <p className="notice notice--warn">{error}</p> : null}
            </div>

            <div className="block">
              <div className="block__head">
                <h2 className="block__title">Who leads first</h2>
                <span className="block__note">round 1</span>
              </div>
              <div className="chips" role="group" aria-label="First leader">
                {names.map((name, index) => (
                  <button
                    key={index}
                    type="button"
                    className="chip"
                    aria-pressed={safeLeader === index}
                    disabled={!name.trim()}
                    onClick={() => setLeaderIndex(index)}
                  >
                    <span className="dot dot--sm" style={{ '--dot': playerColor(index) } as CSSProperties} />
                    {name.trim() || `Player ${index + 1}`}
                  </button>
                ))}
              </div>
              <p className="field__hint">The lead moves one seat clockwise every round.</p>
            </div>

            <label className="field">
              <span className="field__label">Game name (optional)</span>
              <input
                className="input"
                value={title}
                placeholder="Friday at the galley"
                maxLength={40}
                onChange={(event) => setTitle(event.target.value)}
              />
              <span className="field__hint">Shown in your list of games. Defaults to the date.</span>
            </label>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="setup__body">
            <div className="block">
              <h2 className="block__title">Scoring</h2>
              <div className="options" role="group" aria-label="Scoring method">
                <button
                  type="button"
                  className="option"
                  aria-pressed={rules.scoring === 'standard'}
                  onClick={() => setRules({ ...rules, scoring: 'standard' })}
                >
                  <span className="option__top">
                    <span className="option__name">Standard</span>
                    <Icon name="check" size={14} className="option__tick" />
                  </span>
                  <span className="option__note">
                    Exact bid: 20 per trick. Off the mark: −10 for every trick over or short. Nil pays 10 a card.
                  </span>
                </button>
                <button
                  type="button"
                  className="option"
                  aria-pressed={rules.scoring === 'rascal'}
                  onClick={() => setRules({ ...rules, scoring: 'rascal' })}
                >
                  <span className="option__top">
                    <span className="option__name">Rascal</span>
                    <Icon name="check" size={14} className="option__tick" />
                  </span>
                  <span className="option__note">
                    Everyone can score 10 per card. Exact bid takes it all, one off takes half, anything else is
                    nothing.
                  </span>
                </button>
              </div>

              <div>
                <Switch
                  title="Bonus points"
                  note="Colour 14s, black 14, mermaids, pirates and the Skull King."
                  checked={rules.bonuses}
                  onChange={(value) => setRules({ ...rules, bonuses: value })}
                />
                <Switch
                  title="Bonuses only when the bid is made"
                  note="Turn off to award bonuses regardless of the bid — a house rule."
                  checked={rules.bonusRequiresBid}
                  disabled={!rules.bonuses}
                  onChange={(value) => setRules({ ...rules, bonusRequiresBid: value })}
                />
                <Switch
                  title="Pirate abilities"
                  note="Adds Rascal of Roatan’s wager to the round sheet."
                  checked={rules.pirateAbilities}
                  onChange={(value) => setRules({ ...rules, pirateAbilities: value })}
                />
                <Switch
                  title="Cannonball or grapeshot"
                  note="Rascal scoring only: bet 15 a card for a direct hit, or take the half-credit line."
                  checked={rules.rascalCannons}
                  disabled={rules.scoring !== 'rascal'}
                  onChange={(value) => setRules({ ...rules, rascalCannons: value })}
                />
              </div>
            </div>

            <div className="block">
              <div className="block__head">
                <h2 className="block__title">Cards in play</h2>
                <span className="block__note num">{deckSize(deck)} cards</span>
              </div>
              <p className="tiny">
                The base deck is always in: four suits 1–14, five pirates, two mermaids, the Skull King and five
                escapes. Add whatever else you deal.
              </p>
              <div className="chips" role="group" aria-label="Optional cards">
                {DECK_ITEMS.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    className="chip"
                    aria-pressed={deck[item.key]}
                    title={item.note}
                    onClick={() => setDeck((current) => ({ ...current, [item.key]: !current[item.key] }))}
                  >
                    {deck[item.key] ? (
                      <Icon name="check" size={11} strokeWidth={2.4} />
                    ) : (
                      <Icon name="plus" size={11} strokeWidth={2.4} />
                    )}
                    {item.name}
                  </button>
                ))}
              </div>
              <div className="chips">
                <button type="button" className="linkish" onClick={() => setDeck(DEFAULT_DECK)}>
                  Base game
                </button>
                <span className="tiny">·</span>
                <button type="button" className="linkish" onClick={() => setDeck(FULL_DECK)}>
                  Everything
                </button>
              </div>
              <p className="field__hint">
                With {crewCount} players that leaves room for {ceiling} cards each.
              </p>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="setup__body">
            <div className="block">
              <div className="block__head">
                <h2 className="block__title">Format</h2>
                <span className="block__note">{describeSchedule(schedule)}</span>
              </div>
              <div className="chips" role="group" aria-label="Round format">
                {ROUND_PRESETS.map((preset) => (
                  <button
                    key={preset.key}
                    type="button"
                    className="chip"
                    aria-pressed={plan.key === preset.key}
                    title={preset.note}
                    onClick={() => setPlan({ key: preset.key, cards: preset.cards })}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="block">
              <div className="block__head">
                <h2 className="block__title">Cards per round</h2>
                <button
                  type="button"
                  className="linkish"
                  disabled={schedule.length >= 20}
                  onClick={() => setPlan({ key: 'custom', cards: [...schedule, schedule[schedule.length - 1] ?? 1] })}
                >
                  Add round
                </button>
              </div>
              <div className="panel panel--flush">
                <div className="round-editor">
                  {schedule.map((cards, index) => (
                    <div className="adjust-row" key={index}>
                      <span className="adjust-row__name">
                        Round {index + 1}
                        <span className="tiny">{leaderName(index)} leads</span>
                      </span>
                      <Counter
                        label={`round ${index + 1} cards`}
                        value={cards}
                        min={1}
                        max={10}
                        onStep={(delta) => bumpCards(index, delta)}
                      />
                    </div>
                  ))}
                </div>
              </div>
              {schedule.length > 1 ? (
                <button
                  type="button"
                  className="linkish"
                  onClick={() => setPlan({ key: 'custom', cards: schedule.slice(0, -1) })}
                >
                  Remove last round
                </button>
              ) : null}
            </div>

            <div className="block">
              <h2 className="block__title">Ready</h2>
              <div className="panel">
                <div className="kv">
                  <span className="kv__k">Crew</span>
                  <span className="kv__v">{names.map((name) => name.trim()).join(', ')}</span>
                </div>
                <div className="kv">
                  <span className="kv__k">Scoring</span>
                  <span className="kv__v">
                    {rules.scoring === 'standard' ? 'Standard' : 'Rascal'}
                    {rules.rascalCannons ? ' · cannons' : ''}
                  </span>
                </div>
                <div className="kv">
                  <span className="kv__k">Bonuses</span>
                  <span className="kv__v">{rules.bonuses ? (rules.bonusRequiresBid ? 'on bid' : 'always') : 'off'}</span>
                </div>
                <div className="kv">
                  <span className="kv__k">Cards</span>
                  <span className="kv__v num">{deckSize(deck)}</span>
                </div>
                <div className="kv">
                  <span className="kv__k">Rounds</span>
                  <span className="kv__v num">{schedule.length}</span>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <div className="cta-bar cta-bar--dock">
          <button type="button" className="btn btn--ghost" onClick={back}>
            Back
          </button>
          <button type="button" className="btn btn--primary" onClick={next}>
            {step === 2 ? 'Start game' : 'Continue'}
          </button>
        </div>
      </main>
    </>
  );
}
