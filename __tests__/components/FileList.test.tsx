import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import FileList from '@/components/FileList';

const files = [
  { fid: 'f1', pdir_fid: '0', file_name: 'A.txt', size: 100, dir: false, updated_at: Date.now() },
  { fid: 'd1', pdir_fid: '0', file_name: 'Folder', dir: true, size: 0, updated_at: Date.now() },
];

describe('FileList', () => {
  it('renders and triggers sort callback', () => {
    const onSort = jest.fn();
    const onFolderClick = jest.fn();

    render(
      <FileList
        files={files as any}
        sortKey="file_name"
        sortDirection="asc"
        onSort={onSort}
        onFolderClick={onFolderClick}
        formatBytes={(n) => String(n ?? 0)}
        formatDate={() => '2020-01-01 00:00'}
      />
    );

    fireEvent.click(screen.getByText('文件名'));
    expect(onSort).toHaveBeenCalledWith('file_name');
  });
});

