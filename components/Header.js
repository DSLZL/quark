import React from 'react';
import Link from 'next/link';
import { Combobox } from '@headlessui/react';

const Header = ({
    breadcrumbs,
    goBack,
    handleBreadcrumbClick,
    searchQuery,
    setSearchQuery,
    suggestions,
    isSearching,
    viewMode,
    setViewMode
}) => {
    return (
        <header className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-5 mb-8 border-b border-gray-700">
            <div className="flex-grow flex items-center text-xl font-semibold text-gray-100">
                {breadcrumbs.length > 1 && (
                    <button onClick={goBack} className="mr-4 p-2 rounded-full hover:bg-gray-800 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                    </button>
                )}
                <nav>
                    <ol className="flex items-center flex-wrap">
                        {breadcrumbs.map((crumb, index) => (
                            <li key={crumb.fid} className="flex items-center">
                                {index > 0 && <span className="mx-2 text-gray-500">/</span>}
                                {index < breadcrumbs.length - 1 ? (
                                    <a href="#" onClick={(e) => { e.preventDefault(); handleBreadcrumbClick(crumb, index); }} className="text-blue-400 hover:underline">
                                        {crumb.name}
                                    </a>
                                ) : (
                                    <span className="text-gray-300 font-medium">{crumb.name}</span>
                                )}
                            </li>
                        ))}
                    </ol>
                </nav>
            </div>
            <div className="w-full sm:w-auto flex items-center gap-4">
                <div className="w-full sm:w-64">
                    <Combobox value={searchQuery} onChange={setSearchQuery}>
                        <div className="relative">
                            <Combobox.Input
                                className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                onChange={(event) => setSearchQuery(event.target.value)}
                                placeholder="搜索当前文件夹..."
                                displayValue={searchQuery}
                                autoComplete="off"
                            />
                            {(suggestions.length > 0 || isSearching) && (
                                <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                    {isSearching && (
                                        <div className="relative cursor-default select-none py-2 px-4 text-gray-400">
                                            正在搜索...
                                        </div>
                                    )}
                                    {!isSearching && suggestions.map(file => (
                                        <Combobox.Option
                                            key={file.fid}
                                            value={file.file_name}
                                            className={({ active }) => `relative cursor-default select-none py-2 pl-4 pr-4 ${active ? 'bg-blue-500/30 text-white' : 'text-gray-300'}`}
                                        >
                                            {file.file_name}
                                        </Combobox.Option>
                                    ))}
                                </Combobox.Options>
                            )}
                        </div>
                    </Combobox>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => { console.log('Switching to list view'); setViewMode('list'); }} className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-blue-500/30 text-white' : 'text-gray-400 hover:bg-gray-700'}`} aria-label="List view">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg>
                    </button>
                    <button onClick={() => { console.log('Switching to grid view'); setViewMode('grid'); }} className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-blue-500/30 text-white' : 'text-gray-400 hover:bg-gray-700'}`} aria-label="Grid view">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
                    </button>
                    <Link href="/shares" legacyBehavior>
                        <a className="p-2 rounded-md transition-colors text-gray-400 hover:bg-gray-700" aria-label="Shares page">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6.002l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.368a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"></path></svg>
                        </a>
                    </Link>
                </div>
            </div>
        </header>
    );
};

export default Header;
