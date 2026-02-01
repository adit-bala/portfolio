// List of commands that do not require API calls
import { runQuery } from '../sqlite';
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

// About, Contact, CV from DB - now trigger modals
export const about = async () => {
  // Trigger modal event
  const event = new CustomEvent('openModal', {
    detail: { type: 'about' },
  });
  window.dispatchEvent(event);
  return 'Opening about page...';
};
(about as any).description = 'See more about me!';

export const contact = async () => {
  // Trigger modal event
  const event = new CustomEvent('openModal', {
    detail: { type: 'contact' },
  });
  window.dispatchEvent(event);
  return 'Opening contact page...';
};
(contact as any).description = 'Get in touch with me!';

export const cv = async () => {
  // Trigger modal event
  const event = new CustomEvent('openModal', {
    detail: { type: 'cv' },
  });
  window.dispatchEvent(event);
  return 'Opening CV page...';
};
(cv as any).description = 'See more about my work!';

export const projects = async () => {
  // Trigger modal event
  const event = new CustomEvent('openModal', {
    detail: { type: 'projects' },
  });
  window.dispatchEvent(event);
};
(projects as any).description = 'See some of the projects I have created!';

// Twitter
export const twitter = async () => {
  // Trigger modal event
  const event = new CustomEvent('openModal', {
    detail: { type: 'twitter' },
  });
  window.dispatchEvent(event);
};
(twitter as any).description = 'See my tweets!';

// Store selected tags globally for the blog command
export let selectedBlogTags: Set<string> = new Set();

// Track the ID of the current active blog command
let activeBlogCommandId: number | null = null;

// Helper to toggle a tag selection
export const toggleBlogTag = (tag: string) => {
  if (selectedBlogTags.has(tag)) {
    selectedBlogTags.delete(tag);
  } else {
    selectedBlogTags.add(tag);
  }
};

// Reset tag filters (called when a new blog command is run)
export const resetBlogFilters = () => {
  selectedBlogTags.clear();
};

// Set the active blog command ID
export const setActiveBlogCommandId = (id: number | null) => {
  activeBlogCommandId = id;
};

// Get the active blog command ID
export const getActiveBlogCommandId = () => activeBlogCommandId;

// Blog command
export const blog = async (args: string[]) => {
  // Generate a unique ID for this blog command instance
  const commandId = Date.now();
  setActiveBlogCommandId(commandId);

  const prettyDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Query for all articles
  const allRows = await runQuery(
    `SELECT id, title, description, tags, created_at FROM article WHERE status = 'published' AND NOT ('metadata' = ANY(tags)) ORDER BY created_at DESC`,
  );
  if (!allRows.length) return 'No blog articles found.';

  // Get all unique tags
  const allTags = new Set<string>();
  allRows.forEach((row: any) => {
    const tags = Array.isArray(row.tags) ? row.tags : [];
    tags.forEach((tag: string) => {
      if (tag !== 'metadata') {
        allTags.add(tag);
      }
    });
  });

  // Build tag filter UI with multi-select support
  const tagBubbles = Array.from(allTags).sort().map((tag) => {
    const isSelected = selectedBlogTags.has(tag);
    const style = isSelected
      ? 'background-color: #4a9eff; color: #000; padding: 2px 8px; border-radius: 4px; cursor: pointer;'
      : 'border: 1px solid currentColor; padding: 2px 8px; border-radius: 4px; cursor: pointer;';
    return `<span class="blog-tag-filter" data-tag="${tag}" data-command-id="${commandId}" style="${style}">${tag}</span>`;
  }).join(' ');

  const tagFilterSection = `TAGS: ${tagBubbles}<br/><br/>`;

  // Filter rows by selected tags if any
  const rows = selectedBlogTags.size > 0
    ? allRows.filter((row: any) => {
        const tags = Array.isArray(row.tags) ? row.tags : [];
        // Article must have at least one of the selected tags
        return tags.some((tag: string) => selectedBlogTags.has(tag));
      }).slice(0, 20)
    : allRows.slice(0, 20);

  if (!rows.length) {
    return tagFilterSection + `No articles found with selected tags.`;
  }

  // Helper to truncate strings
  const truncate = (str: string, maxLen: number) => {
    if (str.length <= maxLen) return str;
    return str.slice(0, maxLen - 3) + '...';
  };

  const pad = (str: string, len: number) => {
    return str + ' '.repeat(Math.max(0, len - str.length));
  };

  // Helper to wrap text to multiple lines
  const wrapText = (text: string, maxWidth: number): string[] => {
    if (text.length <= maxWidth) return [text];

    const lines: string[] = [];
    let currentLine = '';
    const words = text.split(' ');

    for (const word of words) {
      if (currentLine.length === 0) {
        currentLine = word;
      } else if (currentLine.length + 1 + word.length <= maxWidth) {
        currentLine += ' ' + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }

    if (currentLine.length > 0) {
      lines.push(currentLine);
    }

    return lines;
  };

  // Column widths
  const titleWidth = 25;
  const descWidth = 50;
  const tagsWidth = 20;
  const dateWidth = 18;

  // Build header
  const header =
    pad('TITLE', titleWidth) + ' │ ' +
    pad('DESCRIPTION', descWidth) + ' │ ' +
    pad('TAGS', tagsWidth) + ' │ ' +
    'DATE';

  const separator =
    '─'.repeat(titleWidth) + '─┼─' +
    '─'.repeat(descWidth) + '─┼─' +
    '─'.repeat(tagsWidth) + '─┼─' +
    '─'.repeat(dateWidth);

  // Build rows
  const tableRows = rows.map((row: any, index: number) => {
    const tags = Array.isArray(row.tags) ? row.tags : [];
    const dateStr = prettyDate(row.created_at);

    // Format tags as text with brackets (will be styled later)
    const tagsText = tags.map(tag => `[${tag}]`).join(' ');

    // Wrap description and tags to multiple lines
    const descLines = wrapText(row.description, descWidth);
    const tagLines = wrapText(tagsText, tagsWidth);

    // For title, truncate if needed but only wrap the actual text in the link
    const titleText = row.title;
    const truncatedTitle = truncate(titleText, titleWidth);
    const titlePadding = ' '.repeat(Math.max(0, titleWidth - truncatedTitle.length));
    const titleWithLink = `<span class="blog-title" data-article-id="${row.id}">${truncatedTitle}</span>${titlePadding}`;

    // Build multi-line row
    const lines: string[] = [];

    // Determine max lines needed
    const maxLines = Math.max(descLines.length, tagLines.length);

    // First line has all columns
    lines.push(
      titleWithLink + ' │ ' +
      pad(descLines[0] || '', descWidth) + ' │ ' +
      pad(tagLines[0] || '', tagsWidth) + ' │ ' +
      dateStr
    );

    // Additional lines for wrapped content
    for (let i = 1; i < maxLines; i++) {
      lines.push(
        ' '.repeat(titleWidth) + ' │ ' +
        pad(descLines[i] || '', descWidth) + ' │ ' +
        pad(tagLines[i] || '', tagsWidth) + ' │ ' +
        ' '.repeat(dateWidth)
      );
    }

    // Add row separator after each entry (except the last one)
    if (index < rows.length - 1) {
      const rowSeparator =
        '─'.repeat(titleWidth) + '─┼─' +
        '─'.repeat(descWidth) + '─┼─' +
        '─'.repeat(tagsWidth) + '─┼─' +
        '─'.repeat(dateWidth);
      lines.push(rowSeparator);
    }

    return lines.join('<br/>');
  }).join('<br/>');

  return (
    tagFilterSection +
    header + '<br/>' +
    separator + '<br/>' +
    tableRows + '<br/><br/>' +
    '<span class="blog-hint">Click a title to view the article. Click a tag to filter.</span>'
  );
};
(blog as any).description = 'List all blog articles. Click a title to view.';

// Banner
export const banner = (_args?: string[]): string => {
  // Detect if mobile based on window width (if available)
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  if (isMobile) {
    // Mobile-friendly compact banner
    return `
   ___       _ _ _
  / _ \\  __| (_) |_
 / /_\\ \\/ _\` | | __|
/  _  \\ (_| | | |_
\\_/ \\_/\\__,_|_|\\__|

        _      __   _
 __      _____| |__
 \\ \\ /\\ / / _ \\ '_ \\
  \\ V  V /  __/ |_) |
   \\_/\\_/ \\___|_.__/

Type 'help' for commands
Type 'clear' to clear

Ask AI: !<your question>
Example: !What does Aditya do?
`;
  }

  // Desktop banner (original)
  return `
               █████  ███   █████     ██                                     █████
              ░░███  ░░░   ░░███     ███                                    ░░███
  ██████    ███████  ████  ███████  ░░░   █████     █████ ███ █████  ██████  ░███████
 ░░░░░███  ███░░███ ░░███ ░░░███░        ███░░     ░░███ ░███░░███  ███░░███ ░███░░███
  ███████ ░███ ░███  ░███   ░███        ░░█████     ░███ ░███ ░███ ░███████  ░███ ░███
 ███░░███ ░███ ░███  ░███   ░███ ███     ░░░░███    ░░███████████  ░███░░░   ░███ ░███
░░████████░░████████ █████  ░░█████      ██████      ░░████░████   ░░██████  ████████
 ░░░░░░░░  ░░░░░░░░ ░░░░░    ░░░░░      ░░░░░░        ░░░░ ░░░░     ░░░░░░  ░░░░░░░░




Type 'help' to see the list of available commands.
Type 'clear' to clear the terminal.

Prefix your query with '!' to find the most relevant articles using AI!

For example, try \`!What does Aditya like to do?\`
`;
};
(banner as any).description = 'Display the welcome banner';

// AI Assistant command: !<query>
// Uses retrieve-then-rerank: hybrid search + Jina Reranker v2 cross-encoder
export const ai = async (args: string[]): Promise<string> => {
  const question = args.join(' ').trim();
  if (!question) return 'Usage: !<your question>';

  try {
    // Dynamically import embeddings and reranker to avoid SSR issues
    const { generateEmbedding, rerank } = await import('../embeddings');

    // Generate embedding for the query using Transformers.js
    const queryEmbedding = await generateEmbedding(question);

    // Step 1: Retrieve top 20 candidates using hybrid search
    // Combines vector similarity (60%) + full-text search (40%)
    const candidates = await runQuery<{
      id: string;
      title: string;
      description: string;
      vector_score: number;
      fts_rank: number;
      hybrid_score: number;
    }>(
      `
      WITH vector_search AS (
        SELECT
          a.id,
          a.title,
          a.description,
          1 - (e.embedding <=> $1::vector) as vector_score,
          ROW_NUMBER() OVER (ORDER BY e.embedding <=> $1::vector) as vector_rank
        FROM embedding e
        JOIN article a ON e.article_id = a.id
        WHERE a.status = 'published'
      ),
      fts_search AS (
        SELECT
          a.id,
          ts_rank(to_tsvector('english', e.content), plainto_tsquery('english', $2)) as fts_rank,
          ROW_NUMBER() OVER (ORDER BY ts_rank(to_tsvector('english', e.content), plainto_tsquery('english', $2)) DESC) as text_rank
        FROM embedding e
        JOIN article a ON e.article_id = a.id
        WHERE a.status = 'published'
      )
      SELECT
        v.id,
        v.title,
        v.description,
        v.vector_score,
        COALESCE(f.fts_rank, 0) as fts_rank,
        (0.6 * (1.0 / (60 + v.vector_rank)) + 0.4 * (1.0 / (60 + COALESCE(f.text_rank, 1000)))) as hybrid_score
      FROM vector_search v
      LEFT JOIN fts_search f ON v.id = f.id
      ORDER BY hybrid_score DESC
      LIMIT 20
      `,
      [JSON.stringify(queryEmbedding), question],
    );

    if (candidates.length === 0) {
      return `No articles found. Try a different query!`;
    }

    // Step 2: Rerank top candidates using Jina Reranker v2 cross-encoder
    // If reranking fails or takes too long, fall back to hybrid search results
    let results = candidates.slice(0, 5); // Default to top 5 from hybrid search

    try {
      const documents = candidates.map((c) => `${c.title}. ${c.description}`);

      // Race between reranker and 5-second timeout
      const rerankerPromise = rerank(question, documents);
      const timeoutPromise = new Promise<null>((resolve) =>
        setTimeout(() => resolve(null), 5000)
      );

      const rerankerScores = await Promise.race([rerankerPromise, timeoutPromise]);

      // If timeout occurred, use hybrid search results
      if (rerankerScores === null) {
        console.warn('Reranker timeout, using hybrid search results');
      } else {
        // Combine candidates with reranker scores and sort
        results = candidates
          .map((candidate, i) => ({
            ...candidate,
            reranker_score: rerankerScores[i],
          }))
          .sort((a, b) => b.reranker_score - a.reranker_score)
          .slice(0, 5); // Take top 5 after reranking
      }
    } catch (rerankerErr) {
      // Silently fall back to hybrid search results
      console.warn('Reranker failed, using hybrid search results:', rerankerErr);
    }

    // Format output with article titles and descriptions
    const output = results
      .map((row, i) => {
        const title = `<span class="blog-title" data-article-id="${row.id}">${row.title}</span>`;
        return `${i + 1}. ${title}\n   ${row.description}`;
      })
      .join('\n\n');

    return `Found ${results.length} relevant article${results.length > 1 ? 's' : ''}:\n\n${output}`;
  } catch (err: any) {
    return `Error searching knowledge base: ${err?.message || 'Unknown error'}`;
  }
};
(
  ai as any
).description = `Prefix your query with '!' to search for relevant articles!

ex. !What does Aditya like to do?`;

// Theme switcher command
export const theme = async (args: string[]): Promise<string> => {
  // Dynamically import the theme palette so it is only bundled once and remains tree-shakable
  const themesModule = await import('../../../themes.json');
  // .default for ESM / raw object for CJS
  const themes: Record<string, any> =
    (themesModule as any).default || themesModule;

  const availableThemes = Object.keys(themes);
  const requested = (args[0] || '').toLowerCase();
  const isLightMode = args.includes('-l');

  // If no theme requested or user asked for list, show available options
  if (!requested || requested === 'list') {
    return `Available themes: ${availableThemes.join(
      ', ',
    )}\n\nUse -l flag for light mode variant (e.g., theme dracula -l)`;
  }

  // Find case-insensitive match
  const matchedKey = availableThemes.find((t) => t.toLowerCase() === requested);
  if (!matchedKey) {
    return `Theme "${
      args[0]
    }" not found. Available themes: ${availableThemes.join(', ')}`;
  }

  const selectedTheme = themes[matchedKey];

  // Helper to generate CSS that overrides the existing Tailwind-generated classes
  const generateCss = (themeObj: any, forceLight: boolean = false): string => {
    let css = '';

    if (forceLight && themeObj.light) {
      // Force light mode - apply light colors regardless of system preference
      Object.entries(themeObj.light).forEach(([name, hex]) => {
        css += `\n.bg-light-${name}{background-color:${hex} !important;}\n`;
        css += `.text-light-${name}{color:${hex} !important;}\n`;
        css += `.border-light-${name}{border-color:${hex} !important;}\n`;
        // Override dark mode classes to use light colors
        css += `.dark\\:bg-dark-${name}{background-color:${hex} !important;}\n`;
        css += `.dark\\:text-dark-${name}{color:${hex} !important;}\n`;
        css += `.dark\\:border-dark-${name}{border-color:${hex} !important;}\n`;
      });
    } else {
      // Normal behavior - light colors for light mode, dark colors for dark mode
      if (themeObj.light) {
        Object.entries(themeObj.light).forEach(([name, hex]) => {
          css += `\n.bg-light-${name}{background-color:${hex} !important;}\n`;
          css += `.text-light-${name}{color:${hex} !important;}\n`;
          css += `.border-light-${name}{border-color:${hex} !important;}\n`;
        });
      }

      // Dark palette overrides (inside media-query so light mode is unaffected)
      if (themeObj.dark) {
        css += '\n@media (prefers-color-scheme: dark){';
        Object.entries(themeObj.dark).forEach(([name, hex]) => {
          css += `\n.dark\\:bg-dark-${name}{background-color:${hex} !important;}\n`;
          css += `.dark\\:text-dark-${name}{color:${hex} !important;}\n`;
          css += `.dark\\:border-dark-${name}{border-color:${hex} !important;}\n`;
        });
        css += '}';
      }
    }
    return css;
  };

  // Inject (or replace) the <style> block that contains the generated overrides
  const styleId = 'dynamic-theme';
  let styleEl = document.getElementById(styleId) as HTMLStyleElement;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }
  styleEl.innerHTML = generateCss(selectedTheme, isLightMode);

  // Persist the selection so it can be restored on reload (optional)
  try {
    localStorage.setItem('selectedTheme', matchedKey);
    localStorage.setItem('themeLightMode', isLightMode.toString());
  } catch (_e) {
    // Ignore if browser storage is unavailable (e.g., privacy mode)
  }

  const modeText = isLightMode ? ' (light mode)' : '';
  return `Theme changed to ${matchedKey}${modeText}.`;
};
(theme as any).description =
  "Change the site's colour theme. Usage: theme <theme_name> | theme <theme_name> -l";
