import React from 'react';
import { History } from './interface';

export const useHistory = (defaultValue: Array<History>) => {
  const [history, setHistory] = React.useState<Array<History>>(defaultValue);
  const [command, setCommand] = React.useState<string>('');
  const [lastCommandIndex, setLastCommandIndex] = React.useState<number>(0);

  return {
    history,
    command,
    lastCommandIndex,
    setHistory: (
      output: string,
      usernameOverride?: string,
      commandOverride?: string,
    ) =>
      setHistory((prev) => [
        ...prev,
        {
          id: prev.length,
          date: new Date(),
          command: commandOverride !== undefined ? commandOverride : command,
          output,
          username: usernameOverride,
        },
      ]),
    updateLastEntry: (payload: Partial<History>) =>
      setHistory((prev) => {
        if (!prev.length) return prev;
        const last = { ...prev[prev.length - 1], ...payload };
        return [...prev.slice(0, -1), last];
      }),
    setCommand,
    setLastCommandIndex,
    clearHistory: () => setHistory([]),
  };
};
