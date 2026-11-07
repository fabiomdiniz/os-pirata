import { useCallback, useEffect, useRef, useState } from 'react';
import type { Session } from './lib/types';
import { createSession, readSessions, writeSessions } from './lib/storage';
import { formatDate } from './lib/format';
import { Home } from './screens/Home';
import { Setup } from './screens/Setup';
import { Game } from './screens/Game';
import { Toast } from './components/ui';

type Route = { name: 'home' } | { name: 'setup' } | { name: 'game'; sessionId: string };

export default function App() {
  const [sessions, setSessions] = useState<Session[]>(() => readSessions());
  const [route, setRoute] = useState<Route>({ name: 'home' });
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    writeSessions(sessions);
  }, [sessions]);

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  }, []);

  const updateSession = useCallback((id: string) => {
    return (updater: (session: Session) => Session) => {
      setSessions((previous) =>
        previous.map((session) => (session.id === id ? { ...updater(session), updatedAt: Date.now() } : session)),
      );
    };
  }, []);

  const removeSession = useCallback(
    (id: string) => {
      const target = sessions.find((session) => session.id === id);
      const label = target ? `“${target.title}”` : 'this game';
      if (!window.confirm(`Delete ${label}? The rounds and scores go with it.`)) return;
      setSessions((previous) => previous.filter((session) => session.id !== id));
      setRoute({ name: 'home' });
      showToast('Game deleted');
    },
    [sessions, showToast],
  );

  const activeSession = route.name === 'game' ? sessions.find((session) => session.id === route.sessionId) : undefined;

  return (
    <>
      {route.name === 'game' && activeSession ? (
        <Game
          session={activeSession}
          onUpdate={updateSession(activeSession.id)}
          onHome={() => setRoute({ name: 'home' })}
          onDelete={() => removeSession(activeSession.id)}
          onToast={showToast}
        />
      ) : null}

      {route.name === 'setup' ? (
        <Setup
          onCancel={() => setRoute({ name: 'home' })}
          onCreate={(input) => {
            const session = createSession({
              ...input,
              title: input.title || `Game of ${formatDate(Date.now())}`,
            });
            setSessions((previous) => [session, ...previous]);
            setRoute({ name: 'game', sessionId: session.id });
            showToast('Game started');
          }}
        />
      ) : null}

      {route.name === 'home' || (route.name === 'game' && !activeSession) ? (
        <Home
          sessions={sessions}
          onNew={() => setRoute({ name: 'setup' })}
          onOpen={(id) => setRoute({ name: 'game', sessionId: id })}
        />
      ) : null}

      <Toast message={toast} />
    </>
  );
}
