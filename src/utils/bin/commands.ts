// List of commands that do not require API calls

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

// About
export const about = async (_args: string[]): Promise<string> => {
  // TODO: add about me
  return 'About me';
};
(about as any).description = 'See more about me!';

export const cv = async (_args: string[]): Promise<string> => {
  // TODO: add resume
  return 'Opening resume...';
};
(cv as any).description = 'See more about my work!';

// Contact
export const contact = async (_args: string[]): Promise<string> => {
  // TODO: add email
  return 'Email';
};
(contact as any).description = 'Get in touch with me!';

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
