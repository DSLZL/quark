import React from 'react';
import { formatBytes, formatDate } from '../utils/formatters';
import {
    GridFolderIcon, GridFileIcon, GridZipIcon,
    ListFolderIcon, ListFileIcon, ListZipIcon,
    SharedIcon, NotSharedIcon
} from './Icons';
import quarkConfig from '../utils/config';

const FileItem = ({ file, viewMode, onFolderClick }) => {
    const isFolder = file.dir === true;
    const isZip = /\.(zip|z\d{2})$/i.test(file.file_name);

    if (viewMode === 'grid') {
        const IconComponent = isFolder ? GridFolderIcon : (isZip ? GridZipIcon : GridFileIcon);
        return (
            <div
                onClick={() => isFolder && onFolderClick(file)}
                className={`flex flex-col items-center justify-center p-4 rounded-lg transition-colors text-center ${isFolder ? 'cursor-pointer hover:bg-gray-800/60' : ''}`}
            >
                <div className="mb-2"><IconComponent /></div>
                <span className="text-sm text-gray-200 break-all line-clamp-2">{file.file_name}</span>
            </div>
        );
    }

    const IconComponent = isFolder ? ListFolderIcon : (isZip ? ListZipIcon : ListFileIcon);
    return (
        <div
            onClick={() => isFolder && onFolderClick(file)}
            className={`block sm:grid sm:grid-cols-12 sm:gap-4 sm:items-center px-4 py-4 sm:px-6 border-b border-gray-700/50 last:border-b-0 transition-colors ${isFolder ? 'cursor-pointer hover:bg-gray-700/50' : ''}`}
        >
            <div className={`flex items-center mb-2 sm:mb-0 ${quarkConfig.enableShareDetection ? 'col-span-12 sm:col-span-6 md:col-span-5' : 'col-span-12 sm:col-span-8 md:col-span-7'}`}>
                <div className="mr-4 flex-shrink-0 w-6 h-6"><IconComponent /></div>
                <span className="font-medium text-gray-100 truncate">{file.file_name}</span>
            </div>
            {quarkConfig.enableShareDetection && (
                <div className="col-span-12 sm:col-span-2 md:col-span-2 flex items-center justify-center mb-2 sm:mb-0">
                    {isFolder && (
                        <>
                            {file.is_shared ? <SharedIcon /> : <NotSharedIcon />}
                        </>
                    )}
                </div>
            )}
            {/* Desktop view */}
            <div className="hidden sm:block col-span-2 md:col-span-2 text-right text-sm text-gray-400">
                {!isFolder ? formatBytes(file.size || 0) : '--'}
            </div>
            <div className="hidden sm:block col-span-2 md:col-span-3 text-right text-sm text-gray-400">
                {formatDate(file.updated_at)}
            </div>

            {/* Mobile view */}
            <div className="sm:hidden col-span-12 flex justify-between text-sm text-gray-400 pl-10">
                <div>
                    <span className="font-semibold mr-2 text-gray-500">大小:</span>
                    {!isFolder ? formatBytes(file.size || 0) : '--'}
                </div>
                <div>
                    <span className="font-semibold mr-2 text-gray-500">修改日期:</span>
                    {formatDate(file.updated_at)}
                </div>
            </div>
        </div>
    );
};

export default FileItem;
