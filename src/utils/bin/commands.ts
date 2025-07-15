// List of commands that do not require API calls
import { getDatabase, runQuery } from '../sqlite';
import * as bin from './index';
import axios from 'axios';

// Help
export const help = async (_args: string[]): Promise<string> => {
  const lines = Object.keys(bin)
    .sort()
    .map((cmd) => {
      const desc = (bin as any)[cmd]?.description || '';
      return `${cmd} - ${desc}`.trim();
    })
    .join('\n');

  return `${lines}\n`;
};
(help as any).description = 'Show available commands';

// About, Contact, CV from DB - now trigger modals
export const about = async () => {
  // Trigger modal event
  const event = new CustomEvent('openModal', {
    detail: { type: 'about' }
  });
  window.dispatchEvent(event);
  return 'Opening about page...';
};
(about as any).description = 'See more about me!';

export const contact = async () => {
  // Trigger modal event
  const event = new CustomEvent('openModal', {
    detail: { type: 'contact' }
  });
  window.dispatchEvent(event);
  return 'Opening contact page...';
};
(contact as any).description = 'Get in touch with me!';

export const cv = async () => {
  // Trigger modal event
  const event = new CustomEvent('openModal', {
    detail: { type: 'cv' }
  });
  window.dispatchEvent(event);
  return 'Opening CV page...';
};
(cv as any).description = 'See more about my work!';

// Blog command
export const blog = async () => {
  const prettyDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const rows = await runQuery(
    `SELECT id, title, description, tags, created_at FROM notion WHERE status = 'published' AND LOWER(title) != 'about' AND LOWER(title) != 'contact' AND LOWER(title) != 'cv' ORDER BY created_at DESC LIMIT 10`,
  );
  if (!rows.length) return 'No blog articles found.';
  // Each row: {id, title, description, tags, created_at}
  // tags is JSON string, parse if present
  return (
    rows
      .map((row: any) => {
        const tags = row.tags ? JSON.parse(row.tags) : [];
        return [
          `<span class=\"blog-title\" data-article-id=\"${row.id}\">${row.title}</span>`,
          row.description,
          tags.length ? tags.join(', ') : '',
          row.created_at,
        ]
          .filter(Boolean)
          .join(' | ');
      })
      .join('<br/>') +
    '<br/><span class="blog-hint">Click a title to view the article.</span>'
  );
};
(blog as any).description = 'List all blog articles. Click a title to view.';

// Banner
export const banner = (_args?: string[]): string => {
  return `
               █████  ███   █████     ██                                     █████    
              ░░███  ░░░   ░░███     ███                                    ░░███     
  ██████    ███████  ████  ███████  ░░░   █████     █████ ███ █████  ██████  ░███████ 
 ░░░░░███  ███░░███ ░░███ ░░░███░        ███░░     ░░███ ░███░░███  ███░░███ ░███░░███
  ███████ ░███ ░███  ░███   ░███        ░░█████     ░███ ░███ ░███ ░███████  ░███ ░███
 ███░░███ ░███ ░███  ░███   ░███ ███     ░░░░███    ░░███████████  ░███░░░   ░███ ░███
░░████████░░████████ █████  ░░█████      ██████      ░░████░████   ░░██████  ████████ 
 ░░░░░░░░  ░░░░░░░░ ░░░░░    ░░░░░      ░░░░░░        ░░░░ ░░░░     ░░░░░░  ░░░░░░░░  
                                                                                      
                                                                                      
                                                                                      

Prefix your query with '!' to ask my AI assistant about anything I've written about!
Type 'help' to see the list of available commands.
Type 'clear' to clear the terminal.
`;
};
(banner as any).description = 'Display the welcome banner';

// AI Assistant command: !<query>
export const ai = async (args: string[]): Promise<string> => {
  const question = args.join(' ').trim();
  if (!question) return 'Usage: !<your question>';
  try {
    const response = await axios.post(
      'https://knowledge-base.aditbala.com/ask',
      { question },
      { headers: { 'Content-Type': 'application/json' } },
    );
    // Try to extract a useful answer
    if (response.data?.answer) {
      return response.data.answer;
    }
    return JSON.stringify(response.data, null, 2);
  } catch (err: any) {
    return `Error querying knowledge base: ${
      err?.response?.data?.error || err.message
    }`;
  }
};
(ai as any).description =
  "Prefix your query with '!' to ask my AI assistant about anything I've written about!";
