import { useMemo, useState, type CSSProperties } from 'react';
import type { DeckConfig, Round, Rules, Session } from '../lib/types';
import {
  DECK_ITEMS,
  DEFAULT_DECK,
  FULL_DECK,
  cryptoId,
  deckSize,
  isSessionComplete,
  roundLeader,
  roundsTotal,
  scoreRound,
  standings,
} from '../lib/rules';
import { buildRound, downloadJson } from '../lib/storage';
import { cardsLabel, deltaClass, playerColor, plural, signed, swatch } from '../lib/format';
import { ScoreChart, type ChartSeries } from '../components/ScoreChart';
import { RoundSheet } from '../components/RoundSheet';
import { Icon, Sheet, Switch } from '../components/ui';

type Tab = 'table' | 'rounds' | 'setup';
type SheetState =
  | { kind: 'new'; round: Round }
  | { kind: 'edit'; index: number; round: Round }
  | { kind: 'menu' }
  | null;

const TABS: { key: Tab; label: string; icon: 'ledger' | 'chart' | 'gear' }[] = [
  { key: 'table', label: 'Table', icon: 'ledger' },
  { key: 'rounds', label: 'Rounds', icon: 'chart' },
  { key: 'setup', label: 'Setup', icon: 'gear' },
];

export function Game({
  session,
  onUpdate,
  onHome,
  onDelete,
  onToast,
}: {
  session: Session;
  onUpdate: (updater: (session: Session) => Session) => void;
  onHome: () => void;
  onDelete: () => void;
  onToast: (message: string) => void;
}) {
  const [tab, setTab] = useState<Tab>('table');
  const [sheet, setSheet] = useState<SheetState>(null);

  const rows = standings(session);
  const total = roundsTotal(session);
  const played = session.rounds.length;
  const complete = isSessionComplete(session);
  const nextIndex = Math.min(played, total - 1);
  const nextCards = session.schedule[nextIndex] ?? 1;
  const lastRound = session.rounds[played - 1];
  const lastScored = useMemo(
    () => (lastRound ? scoreRound(lastRound, session.rules) : null),
    [lastRound, session.rules],
  );
  const idToIndex = new Map(session.players.map((player, index) => [player.id, index]));
  const hasRoundOverrides = session.rounds.some((round) => Object.keys(round.overrides).length > 0);
  const currentLeader = complete ? undefined : roundLeader(session, played);
  const firstLeader = roundLeader(session, 0);

  const series: ChartSeries[] = session.players.map((player, index) => {
    let running = 0;
    const values = [0];
    for (const round of session.rounds) {
      running += scoreRound(round, session.rules).perPlayer[player.id]?.total ?? 0;
      values.push(running);
    }
    values[values.length - 1] += session.gameOverrides[player.id] ?? 0;
    return { id: player.id, name: player.name, color: swatch(index), values };
  });

  const setRules = (patch: Partial<Rules>) => onUpdate((s) => ({ ...s, rules: { ...s.rules, ...patch } }));
  const setDeck = (patch: Partial<DeckConfig>) => onUpdate((s) => ({ ...s, deck: { ...s.deck, ...patch } }));
  const toggleDeck = (key: keyof DeckConfig) =>
    onUpdate((s) => ({ ...s, deck: { ...s.deck, [key]: !s.deck[key] } }));

  const saveRound = (round: Round) => {
    if (sheet?.kind === 'edit') {
      const index = sheet.index;
      onUpdate((s) => ({ ...s, rounds: s.rounds.map((item, i) => (i === index ? round : item)) }));
      onToast(`Round ${index + 1} updated`);
    } else {
      onUpdate((s) => ({ ...s, rounds: [...s.rounds, round] }));
      onToast(`Round ${played + 1} saved`);
    }
  };

  const removeRound = (index: number) => {
    onUpdate((s) => ({ ...s, rounds: s.rounds.filter((_, i) => i !== index) }));
    onToast(`Round ${index + 1} removed`);
  };

  const addTiebreak = () => {
    const cards = session.schedule[session.schedule.length - 1] ?? 1;
    onUpdate((s) => ({ ...s, schedule: [...s.schedule, cards], status: 'live' }));
    onToast('Tiebreak round added');
  };

  return (
    <>
      <header className="appbar">
        <button type="button" className="icon-btn" onClick={onHome} aria-label="All games">
          <Icon name="back" size={18} />
        </button>
        <img className="brand__logo brand__logo--solo" src="/icon-192.png" alt="" width={24} height={24} />
        <div className="appbar__grow">
          <span className="appbar__title">{session.title}</span>
          <span className="appbar__meta">
            {session.players.length} players · {played}/{total}
          </span>
        </div>
        <nav className="header-tabs" aria-label="Game views">
          {TABS.map((item) => (
            <button
              key={item.key}
              type="button"
              className="header-tabs__btn"
              aria-current={tab === item.key ? 'page' : undefined}
              onClick={() => setTab(item.key)}
            >
              <Icon name={item.icon} size={14} />
              {item.label}
            </button>
          ))}
        </nav>
        <button type="button" className="icon-btn" onClick={() => setSheet({ kind: 'menu' })} aria-label="Game menu">
          <Icon name="more" size={18} />
        </button>
      </header>

      {tab === 'table' ? (
        <main className="page page--table page--dock">
          <div className="table-main">
          <section className="roundhead">
            <div>
              <p className="kicker">{complete ? 'Final tally' : `Round ${played + 1} of ${total}`}</p>
              <h1 className="roundhead__title">
                {complete ? 'As it stands' : `${cardsLabel(nextCards)} each`}
              </h1>
              {currentLeader ? (
                <p className="roundhead__lead">
                  <span className="dot dot--sm" style={{ '--dot': playerColor(idToIndex.get(currentLeader.id) ?? 0) } as CSSProperties} />
                  {currentLeader.name} leads the first trick
                </p>
              ) : null}
            </div>
            <div className="roundhead__aside">
              <span className="tag">{session.rules.scoring === 'rascal' ? 'Rascal' : 'Standard'}</span>
              <span className="tiny num">
                {session.rules.scoring === 'rascal'
                  ? `direct hit ${nextCards * 10}`
                  : `nil pays ${nextCards * 10}`}
              </span>
            </div>
          </section>

          <ol className="table">
            {rows.map((row, index) => {
              const colorIndex = idToIndex.get(row.playerId) ?? index;
              const entry = lastRound?.entries[row.playerId];
              const score = lastScored?.perPlayer[row.playerId];
              return (
                <li key={row.playerId} className={`prow${index === 0 && played > 0 ? ' is-leading' : ''}`}>
                  <span className="prow__rank num">{index + 1}</span>
                  <span className="prow__who">
                    <span className="prow__name">
                      <span className="dot dot--sm" style={{ '--dot': playerColor(colorIndex) } as CSSProperties} />
                      {row.name}
                    </span>
                    <span className="prow__meta">
                      {entry && score ? (
                        <>
                          bid <b>{entry.bid}</b> · won <b>{entry.tricks}</b> ·{' '}
                          <span className={deltaClass(score.total)}>{signed(score.total)}</span>
                          {score.override !== null ? <span className="tag tag--brass">admin</span> : null}
                        </>
                      ) : (
                        'no round logged'
                      )}
                      {row.adjustment !== 0 ? (
                        <span className="tag">admin {signed(row.adjustment)}</span>
                      ) : null}
                    </span>
                  </span>
                  <span className="prow__total num">{row.total}</span>
                </li>
              );
            })}
          </ol>

          <div className="chips">
            <span className="chip chip--static num">{deckSize(session.deck)} cards</span>
            <span className="chip chip--static">{session.rules.bonuses ? 'bonuses on' : 'no bonuses'}</span>
            {session.status !== 'live' ? <span className="chip chip--static">final</span> : null}
          </div>

          <div className="cta-bar cta-bar--dock">
            {complete ? (
              <button type="button" className="btn btn--primary btn--block" onClick={() => setTab('rounds')}>
                See the round log
              </button>
            ) : (
              <button
                type="button"
                className="btn btn--primary btn--block"
                onClick={() => setSheet({ kind: 'new', round: buildRound(session, played) })}
              >
                Log round {played + 1}
              </button>
            )}
          </div>
          </div>

          <aside className="table-side">
            <div className="panel">
              <div className="panel__head">
                <h2 className="panel__title">{complete ? 'Final tally' : `Round ${played + 1}`}</h2>
                <span className="tag">{cardsLabel(nextCards)}</span>
              </div>
              <div className="rail">
                <div className="kv">
                  <span className="kv__k">Leads</span>
                  <span className="kv__v">{currentLeader?.name ?? '—'}</span>
                </div>
                <div className="kv">
                  <span className="kv__k">Cards each</span>
                  <span className="kv__v num">{nextCards}</span>
                </div>
                <div className="kv">
                  <span className="kv__k">Scoring</span>
                  <span className="kv__v">{session.rules.scoring === 'rascal' ? 'Rascal' : 'Standard'}</span>
                </div>
                <div className="kv">
                  <span className="kv__k">{session.rules.scoring === 'rascal' ? 'Direct hit' : 'Nil bid pays'}</span>
                  <span className="kv__v num">{nextCards * 10}</span>
                </div>
                <div className="kv">
                  <span className="kv__k">Bonuses</span>
                  <span className="kv__v">
                    {session.rules.bonuses ? (session.rules.bonusRequiresBid ? 'on bid' : 'always') : 'off'}
                  </span>
                </div>
              </div>
              {complete ? (
                <button type="button" className="btn btn--quiet btn--block" onClick={() => setTab('rounds')}>
                  See the round log
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn--primary btn--block"
                  onClick={() => setSheet({ kind: 'new', round: buildRound(session, played) })}
                >
                  Log round {played + 1}
                </button>
              )}
            </div>

            {lastRound && lastScored ? (
              <div className="panel">
                <div className="panel__head">
                  <h2 className="panel__title">Last round</h2>
                  <span className="block__note num">round {played}</span>
                </div>
                <div className="rail">
                  {session.players.map((player) => {
                    const score = lastScored.perPlayer[player.id];
                    return (
                      <div className="kv" key={player.id}>
                        <span className="kv__k">{player.name}</span>
                        <span className={`kv__v num ${deltaClass(score?.total ?? 0)}`}>
                          {signed(score?.total ?? 0)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </aside>
        </main>
      ) : null}

      {tab === 'rounds' ? (
        <main className="page">
          <section className="block">
            <div className="block__head">
              <h2 className="section-title">Score evolution</h2>
              <span className="block__note num">
                {played} of {total} rounds
              </span>
            </div>
            <div className="chart-card">
              {played === 0 ? (
                <p className="tiny">The chart draws itself once the first round is logged.</p>
              ) : (
                <ScoreChart series={series} rounds={played} />
              )}
              <div className="legend">
                {series.map((line, index) => (
                  <span className="legend__item" key={line.id}>
                    <span
                      className="dot dot--sm"
                      style={{ '--dot': playerColor(index) } as CSSProperties}
                    />
                    {line.name}
                    <b className="num">{rows.find((row) => row.playerId === line.id)?.total ?? 0}</b>
                  </span>
                ))}
              </div>
            </div>
          </section>

          <section className="block">
            <div className="block__head">
              <h2 className="section-title">Round log</h2>
              {complete ? (
                <button type="button" className="linkish" onClick={addTiebreak}>
                  Add tiebreak
                </button>
              ) : null}
            </div>

            {played === 0 ? (
              <p className="tiny">Nothing logged yet. Play the first trick, then come back.</p>
            ) : (
              [...session.rounds].reverse().map((round, reverseIndex) => {
                const index = session.rounds.length - 1 - reverseIndex;
                const scored = scoreRound(round, session.rules);
                return (
                  <article className="logentry" key={round.id}>
                    <header className="logentry__head">
                      <h3 className="logentry__title">Round {index + 1}</h3>
                      <span className="logentry__cards num">
                        {cardsLabel(round.cards)} · {roundLeader(session, index)?.name ?? '—'} led
                      </span>
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm logentry__edit"
                        onClick={() => setSheet({ kind: 'edit', index, round })}
                      >
                        Edit
                      </button>
                    </header>
                    <ul className="logentry__rows">
                      {session.players.map((player) => {
                        const score = scored.perPlayer[player.id];
                        const colorIndex = idToIndex.get(player.id) ?? 0;
                        return (
                          <li className="logentry__row" key={player.id}>
                            <span
                              className="dot dot--sm"
                              style={{ '--dot': playerColor(colorIndex) } as CSSProperties}
                            />
                            <span className="logentry__name">{player.name}</span>
                            <span className={`logentry__pts num ${deltaClass(score?.total ?? 0)}`}>
                              {signed(score?.total ?? 0)}
                              {score?.override !== null ? '*' : ''}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                    {round.note ? <p className="logentry__note">{round.note}</p> : null}
                  </article>
                );
              })
            )}
            {hasRoundOverrides ? <p className="tiny">* points set by hand</p> : null}
          </section>
        </main>
      ) : null}

      {tab === 'setup' ? (
        <main className="page">
          <div className="settings-grid">
            <section className="block">
              <div className="block__head">
                <h2 className="block__title">Crew</h2>
                <span className="block__note">{session.players.length} players</span>
              </div>
              <div className="player-rows">
                {session.players.map((player, index) => (
                  <div className="player-row" key={player.id}>
                    <span className="dot dot--sm" style={{ '--dot': playerColor(index) } as CSSProperties} />
                    <input
                      className="input"
                      value={player.name}
                      aria-label={`Name for player ${index + 1}`}
                      onChange={(event) => {
                        const name = event.target.value;
                        onUpdate((s) => ({
                          ...s,
                          players: s.players.map((p) => (p.id === player.id ? { ...p, name } : p)),
                        }));
                      }}
                    />
                    {played === 0 && session.players.length > 2 ? (
                      <button
                        type="button"
                        className="icon-btn"
                        aria-label={`Remove ${player.name}`}
                        onClick={() =>
                          onUpdate((s) => ({ ...s, players: s.players.filter((p) => p.id !== player.id) }))
                        }
                      >
                        <Icon name="trash" size={16} />
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
              <div className="block__head" style={{ marginTop: '0.35rem' }}>
                <h3 className="block__note">Round 1 lead</h3>
                <span className="block__note">rotates clockwise</span>
              </div>
              <div className="chips" role="group" aria-label="First leader">
                {session.players.map((player, index) => (
                  <button
                    key={player.id}
                    type="button"
                    className="chip"
                    aria-pressed={firstLeader?.id === player.id}
                    onClick={() => onUpdate((s) => ({ ...s, firstLeaderId: player.id }))}
                  >
                    <span className="dot dot--sm" style={{ '--dot': playerColor(index) } as CSSProperties} />
                    {player.name}
                  </button>
                ))}
              </div>
              {played > 0 ? (
                <p className="tiny">Changing this shifts the lead on every round already logged.</p>
              ) : null}
              {played === 0 && session.players.length < 9 ? (
                <button
                  type="button"
                  className="btn btn--quiet btn--sm"
                  onClick={() =>
                    onUpdate((s) => ({
                      ...s,
                      players: [...s.players, { id: `p-${cryptoId().slice(0, 6)}`, name: `Player ${s.players.length + 1}` }],
                    }))
                  }
                >
                  <Icon name="plus" size={13} strokeWidth={2.2} />
                  Add player
                </button>
              ) : null}
            </section>

            <section className="block">
              <h2 className="block__title">Scoring</h2>
              <div className="options" role="group" aria-label="Scoring method">
                <button
                  type="button"
                  className="option"
                  aria-pressed={session.rules.scoring === 'standard'}
                  onClick={() => setRules({ scoring: 'standard' })}
                >
                  <span className="option__top">
                    <span className="option__name">Standard</span>
                    <Icon name="check" size={14} className="option__tick" />
                  </span>
                  <span className="option__note">20 a trick on an exact bid, −10 for every trick off.</span>
                </button>
                <button
                  type="button"
                  className="option"
                  aria-pressed={session.rules.scoring === 'rascal'}
                  onClick={() => setRules({ scoring: 'rascal' })}
                >
                  <span className="option__top">
                    <span className="option__name">Rascal</span>
                    <Icon name="check" size={14} className="option__tick" />
                  </span>
                  <span className="option__note">10 a card on a direct hit, half if one off, nothing beyond.</span>
                </button>
              </div>
              <div>
                <Switch
                  title="Bonus points"
                  checked={session.rules.bonuses}
                  onChange={(value) => setRules({ bonuses: value })}
                />
                <Switch
                  title="Bonuses only when the bid is made"
                  checked={session.rules.bonusRequiresBid}
                  disabled={!session.rules.bonuses}
                  onChange={(value) => setRules({ bonusRequiresBid: value })}
                />
                <Switch
                  title="Pirate abilities"
                  note="Rascal of Roatan’s wager on the round sheet."
                  checked={session.rules.pirateAbilities}
                  onChange={(value) => setRules({ pirateAbilities: value })}
                />
                <Switch
                  title="Cannonball or grapeshot"
                  checked={session.rules.rascalCannons}
                  disabled={session.rules.scoring !== 'rascal'}
                  onChange={(value) => setRules({ rascalCannons: value })}
                />
              </div>
              <p className="notice">
                Rules apply to the whole game — changing one re-scores every round already logged.
              </p>
            </section>

            <section className="block">
              <div className="block__head">
                <h2 className="block__title">Cards in play</h2>
                <span className="block__note num">{deckSize(session.deck)} cards</span>
              </div>
              <div className="chips" role="group" aria-label="Optional cards">
                {DECK_ITEMS.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    className="chip"
                    aria-pressed={session.deck[item.key]}
                    title={item.note}
                    onClick={() => toggleDeck(item.key)}
                  >
                    {session.deck[item.key] ? (
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
            </section>

            <section className="block">
              <div className="block__head">
                <h2 className="block__title">Admin</h2>
                <span className="block__note">game totals</span>
              </div>
              <p className="tiny">
                Add or subtract points from a final total — a ruling, a lost card, a house call. Round-level
                overrides live in each round.
              </p>
              <div className="panel">
                {session.players.map((player, index) => (
                  <div className="adjust-row" key={player.id}>
                    <span className="adjust-row__name">
                      <span className="dot dot--sm" style={{ '--dot': playerColor(index) } as CSSProperties} />
                      {player.name}
                    </span>
                    <input
                      className="input input--num"
                      type="number"
                      inputMode="numeric"
                      aria-label={`Game adjustment for ${player.name}`}
                      defaultValue={session.gameOverrides[player.id] ?? ''}
                      placeholder="0"
                      onBlur={(event) => {
                        const parsed = Number(event.target.value);
                        const value = Number.isFinite(parsed) ? Math.round(parsed) : 0;
                        onUpdate((s) => {
                          const next = { ...s.gameOverrides };
                          if (value === 0) delete next[player.id];
                          else next[player.id] = value;
                          return { ...s, gameOverrides: next };
                        });
                      }}
                    />
                  </div>
                ))}
              </div>
              <div className="chips">
                <button
                  type="button"
                  className="btn btn--quiet btn--sm"
                  onClick={() => {
                    onUpdate((s) => ({ ...s, status: s.status === 'live' ? 'done' : 'live' }));
                    onToast(session.status === 'live' ? 'Game finished' : 'Game reopened');
                  }}
                >
                  {session.status === 'live' ? 'Finish game' : 'Reopen game'}
                </button>
                <button type="button" className="btn btn--quiet btn--sm" onClick={() => downloadJson(session)}>
                  <Icon name="download" size={13} />
                  Export JSON
                </button>
                <button type="button" className="btn btn--danger btn--sm" onClick={onDelete}>
                  <Icon name="trash" size={13} />
                  Delete game
                </button>
              </div>
            </section>
          </div>
        </main>
      ) : null}

      <nav className="tabbar" aria-label="Game views">
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            className="tabbar__btn"
            aria-current={tab === item.key ? 'page' : undefined}
            onClick={() => setTab(item.key)}
          >
            <Icon name={item.icon} size={17} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {sheet?.kind === 'new' || sheet?.kind === 'edit' ? (
        <RoundSheet
          session={session}
          index={sheet.kind === 'edit' ? sheet.index : played}
          round={sheet.round}
          isNew={sheet.kind === 'new'}
          onSave={saveRound}
          onClose={() => setSheet(null)}
          onDelete={sheet.kind === 'edit' ? () => removeRound(sheet.index) : undefined}
        />
      ) : null}

      {sheet?.kind === 'menu' ? (
        <Sheet title="Game" sub={`${session.players.length} ${plural(session.players.length, 'player')} · ${played}/${total} rounds`} onClose={() => setSheet(null)}>
          <div className="sheet-menu">
            <button
              type="button"
              className="sheet-menu__btn"
              onClick={() => {
                setTab('setup');
                setSheet(null);
              }}
            >
              <Icon name="gear" size={16} />
              Rules, cards and crew
            </button>
            <button
              type="button"
              className="sheet-menu__btn"
              onClick={() => {
                setTab('rounds');
                setSheet(null);
              }}
            >
              <Icon name="chart" size={16} />
              Round log and history
            </button>
            <button type="button" className="sheet-menu__btn" onClick={() => downloadJson(session)}>
              <Icon name="download" size={16} />
              Export this game
            </button>
            <button
              type="button"
              className="sheet-menu__btn sheet-menu__btn--danger"
              onClick={() => {
                setSheet(null);
                onDelete();
              }}
            >
              <Icon name="trash" size={16} />
              Delete game
            </button>
          </div>
        </Sheet>
      ) : null}
    </>
  );
}
