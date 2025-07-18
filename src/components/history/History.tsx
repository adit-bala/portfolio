import React from 'react';
import { History as HistoryInterface } from './interface';
import { Ps1 } from '../Ps1';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { marked } from 'marked';

const Modal = ({ open, onClose, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div
        className="bg-light-background dark:bg-dark-background text-light-foreground dark:text-dark-foreground p-6 rounded shadow-lg border-4 border-blue-500 relative"
        style={{
          width: '90vw',
          height: '80vh',
          maxWidth: '700px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <button
          className="absolute top-3 right-3 text-3xl font-extrabold text-blue-700 hover:text-blue-400 focus:outline-none bg-white/80 rounded-full p-1"
          onClick={onClose}
          aria-label="Close"
          style={{ zIndex: 20 }}
        >
          ×
        </button>
        <div style={{ overflowY: 'auto', flex: 1, marginTop: '2.5rem' }}>
          {children}
        </div>
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

  // Custom components for ReactMarkdown to make links open in new tabs
  const markdownComponents = {
    a: ({ href, children, ...props }: any) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-light-blue dark:text-dark-blue hover:underline"
        {...props}
      >
        {children}
      </a>
    ),
  };

  // Separate component for summary – render markdown inside
  const SummaryComponent = ({ children, ...props }: any) => {
    // children can be array of strings; join them
    const raw = Array.isArray(children) ? children.join('') : children;
    const html = marked.parse(raw || '');
    return <summary dangerouslySetInnerHTML={{ __html: html }} {...props} />;
  };

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

    // Handle modal events from commands
    const modalHandler = async (e: CustomEvent) => {
      const { type } = e.detail;
      const { getDatabase } = await import('../../utils/sqlite');
      const db = await getDatabase();
      const rows = db.exec(
        `SELECT markdown FROM notion WHERE LOWER(title) = '${type}' LIMIT 1`,
      );
      if (rows.length && rows[0].values.length) {
        const [markdown] = rows[0].values[0];
        setModal({ open: true, content: markdown });
      }
    };

    document.addEventListener('click', handler);
    window.addEventListener('openModal', modalHandler as EventListener);

    return () => {
      document.removeEventListener('click', handler);
      window.removeEventListener('openModal', modalHandler as EventListener);
    };
  }, []);

  return (
    <>
      {history.map((entry: HistoryInterface, index: number) => (
        <div key={entry.command + index}>
          <div className="flex flex-col sm:flex-row sm:space-x-2">
            <div className="flex-shrink">
              <Ps1 username={entry.username} />
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
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown
            components={{
              ...markdownComponents,
              summary: SummaryComponent,
            }}
            rehypePlugins={[rehypeRaw as any]}
          >
            {modal.content}
          </ReactMarkdown>
        </div>
      </Modal>
    </>
  );
};

export default History;
