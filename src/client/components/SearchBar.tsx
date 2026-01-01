import React, { useState, useEffect, useCallback } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

export interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isLoading = false }) => {
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(inputValue);
    }, 300);

    return () => clearTimeout(timer);
  }, [inputValue, onSearch]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  }, []);

  const handleClear = useCallback(() => {
    setInputValue('');
  }, []);

  return (
    <div className="relative group">
      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
        <FiSearch className="text-zinc-400 text-lg group-focus-within:text-white transition-colors" />
      </div>
      <input
        type="text"
        value={inputValue}
        onChange={handleChange}
        placeholder="What do you want to listen to?"
        className="w-full py-3 pl-12 pr-12 text-base rounded-full bg-zinc-800 text-white placeholder-zinc-500 outline-none border-2 border-transparent focus:border-zinc-600 focus:bg-zinc-700/50 transition-all"
        aria-label="Search for songs"
      />
      <div className="absolute inset-y-0 right-4 flex items-center gap-2">
        {isLoading && (
          <AiOutlineLoading3Quarters className="text-purple-500 text-lg animate-spin" />
        )}
        {inputValue && !isLoading && (
          <button
            onClick={handleClear}
            className="text-zinc-400 hover:text-white transition-colors p-1"
            aria-label="Clear search"
          >
            <FiX className="text-lg" />
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
