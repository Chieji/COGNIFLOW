import React, { useState } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({ 
  onSearch, 
  placeholder = 'Search notes...' 
}) => {
  const [query, setQuery] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    onSearch(value);
  };

  return (
    <div style={{ padding: '0.5rem' }}>
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '0.5rem',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '4px',
          backgroundColor: 'rgba(255,255,255,0.05)',
          color: 'inherit',
          fontSize: '0.875rem',
        }}
      />
    </div>
  );
};
