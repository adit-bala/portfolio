import React from 'react';
import { History as HistoryInterface } from './interface';
import { Ps1 } from '../Ps1';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { marked } from 'marked';
import Image from 'next/image';

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
    img: ({ src, alt, title, ...props }: any) => (
      <div className="my-4">
        <Image
          src={src}
          alt={alt}
          title={title}
          width={800}
          height={600}
          className="max-w-full h-auto rounded-lg shadow-md"
          {...props}
        />
        {alt && (
          <p className="text-xs text-light-gray dark:text-dark-gray mt-2 text-left italic">
            {alt}
          </p>
        )}
      </div>
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
          // Fetch markdown for this article using PGlite
          const { runQuery } = await import('../../utils/sqlite');
          const rows = await runQuery<{ markdown: string; title: string }>(
            `SELECT markdown, title FROM article WHERE id = $1 LIMIT 1`,
            [articleId],
          );
          if (rows.length) {
            setModal({ open: true, content: rows[0].markdown });
          }
        }
      } else if (target.classList.contains('blog-tag-filter')) {
        // Handle tag filter clicks
        const tag = target.getAttribute('data-tag');
        if (tag) {
          // Trigger a new blog command with the tag filter
          const event = new CustomEvent('executeCommand', { detail: { command: `blog ${tag}` } });
          window.dispatchEvent(event);
        }
      }
    };

    // Handle modal events from commands
    const modalHandler = async (e: CustomEvent) => {
      const { type } = e.detail;
      const { runQuery } = await import('../../utils/sqlite');
      const rows = await runQuery<{ markdown: string }>(
        `SELECT markdown FROM article WHERE LOWER(title) = $1 LIMIT 1`,
        [type],
      );
      if (rows.length) {
        setModal({ open: true, content: rows[0].markdown });
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
