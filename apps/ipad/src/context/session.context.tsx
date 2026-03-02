import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  sessionEngine,
  type SessionState,
  INITIAL_SESSION_STATE,
} from '../services/session.engine';

const SessionContext = createContext<SessionState>(INITIAL_SESSION_STATE);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SessionState>(sessionEngine.getState());

  useEffect(() => {
    return sessionEngine.subscribe(setState);
  }, []);

  return (
    <SessionContext.Provider value={state}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionState {
  return useContext(SessionContext);
}
