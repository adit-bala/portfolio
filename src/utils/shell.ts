import React from 'react';
import * as bin from './bin';

const aiPlaceholders = [
  "peering into Aditya's deepest darkest secrets...",
  'consulting the neural archives...',
  'brewing some fresh knowledge...',
  'asking the wise owls of the internet...',
  "diving into Aditya's brain dump...",
];
const spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

export const shell = async (
  command: string,
  setHistory: (
    output: string,
    usernameOverride?: string,
    commandOverride?: string,
  ) => void,
  updateLastEntry: (payload: any) => void,
  clearHistory: () => void,
  setCommand: React.Dispatch<React.SetStateAction<string>>,
) => {
  const args = command.split(' ');
  args[0] = args[0].toLowerCase();

  // Handle AI assistant queries starting with '!'
  if (command.trim().startsWith('!')) {
    const { ai } = await import('./bin');

    // 1) Record the user's command line in history (guest user)
    setHistory('', undefined, command);

    // 2) Add AI placeholder line
    let placeholderIndex = 0;
    let spinnerIndex = 0;
    const spinner = spinnerFrames[spinnerIndex];
    setHistory('', 'ai', `${spinner} ${aiPlaceholders[placeholderIndex]}`);

    // Rotate spinner (and occasionally placeholder) while waiting
    const interval = setInterval(() => {
      spinnerIndex = (spinnerIndex + 1) % spinnerFrames.length;
      if (spinnerIndex % 4 === 0) {
        placeholderIndex = (placeholderIndex + 1) % aiPlaceholders.length;
      }
      const frame = spinnerFrames[spinnerIndex];
      const text = aiPlaceholders[placeholderIndex];
      updateLastEntry({ command: `${frame} ${text}` });
    }, 200);

    try {
      const answer = await ai([command.slice(1).trim()]);
      clearInterval(interval);
      updateLastEntry({ command: '', output: answer });
    } catch (e: any) {
      clearInterval(interval);
      updateLastEntry({ command: '', output: `Error: ${e.message}` });
    }

    setCommand('');
    return;
  }

  if (args[0] === 'clear') {
    clearHistory();
  } else if (command === '') {
    setHistory('');
  } else if (Object.keys(bin).indexOf(args[0]) === -1) {
    setHistory(
      `shell: command not found: ${args[0]}. Try 'help' to get started.`,
    );
  } else {
    const output = await (bin as any)[args[0]](args.slice(1));
    setHistory(output);
  }

  setCommand('');
};
