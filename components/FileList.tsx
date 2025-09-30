"use client";
import React from 'react';
import { FileItem } from '@/types/file';
import { ListFolderIcon, ListFileIcon, ListZipIcon, SortIcon } from '@/components/Icons';

interface Props {
  files: FileItem[];
  sortKey: 'file_name' | 'updated_at';
  sortDirection: 'asc' | 'desc';
  onSort: (key: 'file_name' | 'updated_at') => void;
  onFolderClick: (file: FileItem) => void;
  formatBytes: (n: number | string | undefined) => string;
  formatDate: (ts?: string | number | Date) => string;
}

export default function FileList({ files, sortKey, sortDirection, onSort, onFolderClick, formatBytes, formatDate }: Props) {
  return (
    <div className="bg-content1 rounded-lg shadow-lg overflow-hidden ring-1 ring-divider">
      <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-3 border-b border-divider text-xs font-semibold text-foreground/70 uppercase tracking-wider">
        <button onClick={() => onSort('file_name')} className="col-span-7 md:col-span-6 flex items-center hover:text-white">
          文件名 <SortIcon direction={sortKey === 'file_name' ? sortDirection : null} />
        </button>
        <div className="col-span-2 md:col-span-3 text-right">大小</div>
        <button onClick={() => onSort('updated_at')} className="col-span-3 md:col-span-3 flex items-center justify-end hover:text-white">
          修改日期 <SortIcon direction={sortKey === 'updated_at' ? sortDirection : null} />
        </button>
      </div>
      <div>
        {files.map((file) => {
          const isFolder = file.dir === true;
          const isZip = /\.(zip|z\d{2})$/i.test(file.file_name || '');
          const IconComponent = isFolder ? ListFolderIcon : isZip ? ListZipIcon : ListFileIcon;
          return (
            <div
              key={file.fid}
              onClick={() => isFolder && onFolderClick(file)}
              className={`block sm:grid sm:grid-cols-12 sm:gap-4 sm:items-center px-4 py-4 sm:px-6 border-b border-divider last:border-b-0 transition-colors ${isFolder ? 'cursor-pointer hover:bg-content2' : ''}`}
            >
              <div className="col-span-7 md:col-span-6 flex items-center gap-3">
                <div className="flex-shrink-0 w-6 h-6">
                  <IconComponent />
                </div>
                <span className="font-medium truncate">{file.file_name}</span>
              </div>
              <div className="col-span-12 sm:col-span-5 md:col-span-6 flex justify-between sm:grid sm:grid-cols-2 sm:gap-4 text-sm text-foreground/70 pl-10 sm:pl-0">
                <div className="sm:col-span-1 sm:text-right">
                  <span className="sm:hidden font-semibold mr-2 text-foreground/50">大小:</span>
                  {!isFolder ? formatBytes(file.size) : '--'}
                </div>
                <div className="sm:col-span-1 sm:text-right">
                  <span className="sm:hidden font-semibold mr-2 text-foreground/50">修改日期:</span>
                  {formatDate(file.updated_at)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

