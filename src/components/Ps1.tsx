import React from 'react';
import config from '../../config.json';

export const Ps1: React.FC<{ username?: string }> = ({ username }) => {
  const user = username || config.ps1_username;
  const userColorClass =
    user === 'ai'
      ? 'text-light-blue dark:text-dark-blue'
      : 'text-light-yellow dark:text-dark-yellow';

  return (
    <div>
      <span className={userColorClass}>{user}</span>
      <span className="text-light-gray dark:text-dark-gray">@</span>
      <span className="text-light-green dark:text-dark-green">
        {config.ps1_hostname}
      </span>
      <span className="text-light-gray dark:text-dark-gray">:$ ~ </span>
    </div>
  );
};

export default Ps1;
