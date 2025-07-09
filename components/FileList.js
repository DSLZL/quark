import React from 'react';
import FileItem from './FileItem';
import { SortIcon } from './Icons';
import quarkConfig from '../utils/config';

const FileList = ({ files, viewMode, onFolderClick, onSort, sortConfig }) => {
    if (viewMode === 'grid') {
        return (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-9 gap-4">
                {files.map((file) => (
                    <FileItem key={file.fid} file={file} viewMode="grid" onFolderClick={onFolderClick} />
                ))}
            </div>
        );
    }

    return (
        <div className="bg-gray-800/50 rounded-lg shadow-lg overflow-hidden ring-1 ring-white/10">
            <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-3 border-b border-gray-700 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {quarkConfig.enableSorting ? (
                    <button onClick={() => onSort('file_name')} className={`flex items-center hover:text-white ${quarkConfig.enableShareDetection ? 'col-span-6 md:col-span-5' : 'col-span-8 md:col-span-7'}`}>
                        文件名 <SortIcon direction={sortConfig.key === 'file_name' ? sortConfig.direction : null} />
                    </button>
                ) : (
                    <div className={`${quarkConfig.enableShareDetection ? 'col-span-6 md:col-span-5' : 'col-span-8 md:col-span-7'}`}>文件名</div>
                )}
                {quarkConfig.enableShareDetection && (
                    <div className="col-span-2 md:col-span-2 text-center">分享状态</div>
                )}
                <div className="col-span-2 md:col-span-2 text-right">大小</div>
                {quarkConfig.enableSorting ? (
                    <button onClick={() => onSort('updated_at')} className="col-span-2 md:col-span-3 flex items-center justify-end hover:text-white">
                        修改日期 <SortIcon direction={sortConfig.key === 'updated_at' ? sortConfig.direction : null} />
                    </button>
                ) : (
                    <div className="col-span-2 md:col-span-3 text-right">修改日期</div>
                )}
            </div>
            {files.map((file) => (
                <FileItem key={file.fid} file={file} viewMode="list" onFolderClick={onFolderClick} />
            ))}
        </div>
    );
};

export default FileList;
