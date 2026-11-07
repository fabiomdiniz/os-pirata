import type { Session } from '../lib/types';
import { standings, roundsTotal } from '../lib/rules';
import { formatDate, plural } from '../lib/format';
import { Icon } from '../components/ui';

export function Home({
  sessions,
  onNew,
  onOpen,
}: {
  sessions: Session[];
  onNew: () => void;
  onOpen: (id: string) => void;
}) {
  const live = sessions.filter((session) => session.status === 'live');
  const done = sessions.filter((session) => session.status !== 'live');

  return (
    <>
      <header className="appbar">
        <span className="brand">
          <Icon name="mark" size={18} className="brand__mark" />
          <span className="brand__word">os-pirata</span>
          <span className="brand__sub">Skull King</span>
        </span>
        <button type="button" className="btn btn--primary btn--sm" onClick={onNew}>
          <Icon name="plus" size={13} strokeWidth={2.2} />
          New game
        </button>
      </header>

      <main className="page">
        <section className="masthead">
          <div className="masthead__copy">
            <h1 className="display masthead__title">Every trick, accounted for.</h1>
            <p className="lede">
              Score a night of Skull King without the paper pad. Set the rules your table plays, log each round, and
              let the ledger do the arithmetic.
            </p>
          </div>
          <aside className="masthead__aside">
            <p className="kicker">House maths</p>
            <ul className="rule-strip">
              <li>
                <span>Exact bid</span>
                <b className="num">20 / trick</b>
              </li>
              <li>
                <span>Off the mark</span>
                <b className="num">−10 / trick</b>
              </li>
              <li>
                <span>Nil bid made</span>
                <b className="num">10 × cards</b>
              </li>
            </ul>
            <p className="tiny">
              Rascal scoring, bonus points and every expansion card can be switched on per game.
            </p>
          </aside>
        </section>

        <section className="list" aria-labelledby="live-games">
          <header className="list__head">
            <h2 className="section-title" id="live-games">
              In play
            </h2>
            <span className="list__count">{live.length === 0 ? 'nothing afloat' : `${live.length} open`}</span>
          </header>

          {live.length === 0 ? (
            <div className="empty">
              <Icon name="compass" size={44} className="empty__mark" strokeWidth={1.1} />
              <div className="block">
                <h3 className="section-title">No game on the table</h3>
                <p className="tiny">
                  Two to nine players, ten rounds, and a running score that survives a locked phone.
                </p>
              </div>
              <button type="button" className="btn btn--primary" onClick={onNew}>
                Start a game
              </button>
            </div>
          ) : (
            <div className="ledger">
              {live.map((session) => (
                <VoyageRow key={session.id} session={session} onOpen={onOpen} />
              ))}
            </div>
          )}
        </section>

        {done.length > 0 ? (
          <section className="list" aria-labelledby="logged-games">
            <header className="list__head">
              <h2 className="section-title" id="logged-games">
                Logged
              </h2>
              <span className="list__count">{done.length}</span>
            </header>
            <div className="ledger">
              {done.map((session) => (
                <VoyageRow key={session.id} session={session} onOpen={onOpen} />
              ))}
            </div>
          </section>
        ) : null}

        <p className="footer-note">
          <Icon name="ledger" size={14} />
          Saved in this browser only. No account, no server, no sync.
        </p>
      </main>
    </>
  );
}

function VoyageRow({ session, onOpen }: { session: Session; onOpen: (id: string) => void }) {
  const rows = standings(session);
  const leader = rows[0];
  const played = session.rounds.length;
  const total = roundsTotal(session);
  const crew = session.players.length;

  return (
    <button type="button" className="voyage" onClick={() => onOpen(session.id)}>
      <span className="voyage__main">
        <span className="voyage__title">{session.title}</span>
        <span className="voyage__meta">
          {crew} {plural(crew, 'player')} · {played === 0 ? 'not started' : `round ${played} of ${total}`} ·{' '}
          {formatDate(session.updatedAt)}
          {session.status !== 'live' ? ' · final' : ''}
        </span>
      </span>
      <span className="voyage__score">
        <span className="voyage__leader">{played === 0 ? 'scores' : leader.name}</span>
        <span className="voyage__total num">{played === 0 ? '—' : leader.total}</span>
      </span>
    </button>
  );
}
