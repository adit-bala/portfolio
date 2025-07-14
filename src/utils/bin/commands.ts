// List of commands that do not require API calls
import { getDatabase, runQuery } from '../sqlite';
import * as bin from './index';

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

// About, Contact, CV from DB
export const about = async () => {
  const rows = await runQuery(
    "SELECT markdown FROM notion WHERE LOWER(title) = 'about' LIMIT 1",
  );
  return rows[0]?.markdown || 'No about article found.';
};
(about as any).description = 'See more about me!';

export const contact = async () => {
  const rows = await runQuery(
    "SELECT markdown FROM notion WHERE LOWER(title) = 'contact' LIMIT 1",
  );
  return rows[0]?.markdown || 'No contact article found.';
};
(contact as any).description = 'Get in touch with me!';

export const cv = async () => {
  const rows = await runQuery(
    "SELECT markdown FROM notion WHERE LOWER(title) = 'cv' LIMIT 1",
  );
  return rows[0]?.markdown || 'No CV article found.';
};
(cv as any).description = 'See more about my work!';

// Blog command
export const blog = async () => {
  const rows = await runQuery(
    `SELECT id, title, description, tags, created_at FROM notion WHERE status = 'published' ORDER BY created_at DESC`,
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
