
import React from 'react';

interface TagProps {
  label: string;
}

const Tag: React.FC<TagProps> = ({ label }) => {
  return (
    <span className="px-2 py-1 bg-light-accent/10 text-light-accent dark:bg-light-accent/20 dark:text-light-accent text-xs font-semibold rounded-full">
      {label}
    </span>
  );
};

export default Tag;