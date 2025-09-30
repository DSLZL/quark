"use client";
import React from 'react';
import { FileItem } from '@/types/file';
import { GridFolderIcon, GridFileIcon, GridZipIcon } from '@/components/Icons';

interface Props {
  files: FileItem[];
  onFolderClick: (file: FileItem) => void;
}

export default function FileGrid({ files, onFolderClick }: Props) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-9 gap-4">
      {files.map((file) => {
        const isFolder = file.dir === true;
        const isZip = /\.(zip|z\d{2})$/i.test(file.file_name || '');
        const IconComponent = isFolder ? GridFolderIcon : isZip ? GridZipIcon : GridFileIcon;
        return (
          <div key={file.fid} onClick={() => isFolder && onFolderClick(file)} className={`flex flex-col items-center justify-center p-4 rounded-lg transition-colors text-center ${isFolder ? 'cursor-pointer hover:bg-content2' : ''}`}>
            <div className="mb-2">
              <IconComponent />
            </div>
            <span className="text-sm break-all line-clamp-2">{file.file_name}</span>
          </div>
        );
      })}
    </div>
  );
}

