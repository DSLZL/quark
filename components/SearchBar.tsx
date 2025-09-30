"use client";
import { Input, Spinner } from '@heroui/react';
import React from 'react';

interface Props {
  value: string;
  onChange: (v: string) => void;
  onEnter: () => void;
  isSearching: boolean;
  suggestions: { fid: string; file_name: string }[];
  showSuggest: boolean;
  setShowSuggest: (v: boolean) => void;
  onSelectSuggestion: (name: string) => void;
}

export default function SearchBar({
  value,
  onChange,
  onEnter,
  isSearching,
  suggestions,
  showSuggest,
  setShowSuggest,
  onSelectSuggestion,
}: Props) {
  return (
    <div className="relative flex-grow sm:flex-grow-0 flex items-center gap-2 w-full sm:w-72">
      <Input
        aria-label="搜索当前文件夹"
        variant="bordered"
        size="md"
        value={value}
        onValueChange={(v) => { onChange(v); setShowSuggest(true); }}
        onFocus={() => setShowSuggest(true)}
        onBlur={() => setTimeout(() => setShowSuggest(false), 120)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            onEnter();
            setShowSuggest(false);
          }
        }}
        placeholder="搜索当前文件夹..."
        endContent={isSearching ? <Spinner size="sm" color="primary" /> : null}
      />
      {showSuggest && (suggestions.length > 0 || isSearching) && (
        <div className="absolute z-20 top-full mt-1 w-full rounded-md bg-content1 border border-divider shadow-lg max-h-60 overflow-auto">
          {isSearching && (
            <div className="px-3 py-2 text-foreground/60 text-sm">正在搜索...</div>
          )}
          {!isSearching && suggestions.map((file) => (
            <div
              key={file.fid}
              className="px-3 py-2 text-sm hover:bg-content2 cursor-pointer truncate"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onSelectSuggestion(file.file_name)}
            >
              {file.file_name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

