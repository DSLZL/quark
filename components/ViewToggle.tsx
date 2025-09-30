"use client";
import { Button, Select, SelectItem } from '@heroui/react';
import React from 'react';
import { useTheme } from '@/components/ThemeProvider';

interface Props {
  viewMode: 'list' | 'grid';
  setViewMode: (mode: 'list' | 'grid') => void;
  searchType: string;
  setSearchType: (t: string) => void;
}

const searchTypes = [
  { value: 'mixed', label: '混合' },
  { value: 'folder', label: '文件夹' },
  { value: 'file', label: '文件' },
];

export default function ViewToggle({ viewMode, setViewMode, searchType, setSearchType }: Props) {
  const { theme, toggle } = useTheme();

  return (
    <div className="w-full sm:w-auto flex items-center gap-4">
      <div className="w-28">
        <Select
          selectedKeys={new Set([searchType])}
          onSelectionChange={(keys) => {
            const v = Array.from(keys)[0];
            if (typeof v === 'string') setSearchType(v);
          }}
          size="sm"
        >
          {searchTypes.map((type) => (
            <SelectItem key={type.value}>
              {type.label}
            </SelectItem>
          ))}
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <Button isIconOnly variant={viewMode === 'list' ? 'solid' : 'light'} onClick={() => setViewMode('list')} aria-label="列表视图">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg>
        </Button>
        <Button isIconOnly variant={viewMode === 'grid' ? 'solid' : 'light'} onClick={() => setViewMode('grid')} aria-label="网格视图">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
        </Button>
        <Button variant="light" onClick={toggle} aria-label="切换主题">
          {theme === 'dark' ? '深色' : '浅色'}
        </Button>
      </div>
    </div>
  );
}

