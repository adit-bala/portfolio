import Head from 'next/head';
import React from 'react';
import config from '../../config.json';
import { Input } from '../components/input';
import { useHistory } from '../components/history/hook';
import { History } from '../components/history/History';
import { banner } from '../utils/bin';

interface IndexPageProps {
  inputRef: React.MutableRefObject<HTMLInputElement>;
}

const IndexPage: React.FC<IndexPageProps> = ({ inputRef }) => {
  const containerRef = React.useRef(null);
  const {
    history,
    command,
    lastCommandIndex,
    setCommand,
    setHistory,
    updateLastEntry,
    clearHistory,
    setLastCommandIndex,
  } = useHistory([]);

  const init = React.useCallback(() => setHistory(banner()), []);

  React.useEffect(() => {
    init();
  }, [init]);

  // Enhanced focus and scroll behavior
  React.useEffect(() => {
    if (inputRef.current) {
      // Ensure input is visible and focused
      inputRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
      inputRef.current.focus({ preventScroll: true });
    }
  }, [history, inputRef]);

  return (
    <>
      <Head>
        <title>{config.title}</title>
      </Head>

      <div className="p-2 sm:p-4 md:p-8 overflow-hidden h-full border-2 rounded border-light-yellow dark:border-dark-yellow">
        <div
          ref={containerRef}
          className="overflow-y-auto h-full scroll-smooth"
        >
          <History history={history} />

          <Input
            inputRef={inputRef}
            containerRef={containerRef}
            command={command}
            history={history}
            lastCommandIndex={lastCommandIndex}
            setCommand={setCommand}
            setHistory={setHistory}
            updateLastEntry={updateLastEntry}
            setLastCommandIndex={setLastCommandIndex}
            clearHistory={clearHistory}
          />
        </div>
      </div>
    </>
  );
};

export default IndexPage;
