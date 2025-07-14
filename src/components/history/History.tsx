import React from 'react';
import { History as HistoryInterface } from './interface';
import { Ps1 } from '../Ps1';
import ReactMarkdown from 'react-markdown';

const Modal = ({ open, onClose, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-light-background dark:bg-dark-background text-light-foreground dark:text-dark-foreground p-6 rounded shadow-lg max-w-2xl w-full relative">
        <button
          className="absolute top-2 right-2 text-lg font-bold"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
};

export const History: React.FC<{ history: Array<HistoryInterface> }> = ({
  history,
}) => {
  const [modal, setModal] = React.useState<{ open: boolean; content: string }>({
    open: false,
    content: '',
  });

  React.useEffect(() => {
    const handler = async (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('blog-title')) {
        const articleId = target.getAttribute('data-article-id');
        if (articleId) {
          // Fetch markdown for this article
          const { getDatabase } = await import('../../utils/sqlite');
          const db = await getDatabase();
          const rows = db.exec(
            `SELECT markdown, title FROM notion WHERE id = '${articleId}' LIMIT 1`,
          );
          if (rows.length && rows[0].values.length) {
            const [markdown, title] = rows[0].values[0];
            setModal({ open: true, content: markdown });
          }
        }
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  return (
    <>
      {history.map((entry: HistoryInterface, index: number) => (
        <div key={entry.command + index}>
          <div className="flex flex-row space-x-2">
            <div className="flex-shrink">
              <Ps1 />
            </div>

            <div className="flex-grow">{entry.command}</div>
          </div>

          <p
            className="whitespace-pre-wrap mb-2"
            style={{ lineHeight: 'normal' }}
            dangerouslySetInnerHTML={{ __html: entry.output }}
          />
        </div>
      ))}
      <Modal
        open={modal.open}
        onClose={() => setModal({ open: false, content: '' })}
      >
        <ReactMarkdown>{modal.content}</ReactMarkdown>
      </Modal>
    </>
  );
};

export default History;
