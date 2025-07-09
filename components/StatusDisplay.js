import React from 'react';

const StatusDisplay = ({ isLoading, isSearching, files, error, debouncedSearchQuery }) => {
    if (isLoading) {
        return (
            <div className="text-center py-8">
                <div className="inline-block w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-400 mt-2">正在加载...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-10 text-red-500">
                加载失败: {error}
            </div>
        );
    }

    if (!isSearching && files.length === 0) {
        return (
            <div className="text-center py-16 text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-300">
                    {debouncedSearchQuery ? '未找到结果' : '文件夹为空'}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                    {debouncedSearchQuery ? `没有找到与 "${debouncedSearchQuery}" 匹配的文件。` : '这个文件夹里没有文件或子文件夹。'}
                </p>
            </div>
        );
    }

    return null;
};

export default StatusDisplay;
