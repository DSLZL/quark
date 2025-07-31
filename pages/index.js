import Head from 'next/head';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Combobox, Listbox } from '@headlessui/react';
import { getCachedQuarkFiles } from '../utils/quark-api';

// --- Helper Functions ---
const formatBytes = (bytes, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
};

// --- Icon Components ---
const GridFolderIcon = () => <svg className="w-12 h-12 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path></svg>;
const GridFileIcon = () => <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>;
const GridZipIcon = () => <svg className="w-12 h-12 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4m16 0l-4-4m4 4l-4 4M4 12l4-4m-4 4l4 4m-4-4h16v8a2 2 0 01-2 2H6a2 2 0 01-2-2v-8z"></path></svg>;
const ListFolderIcon = () => <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path></svg>;
const ListFileIcon = () => <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>;
const ListZipIcon = () => <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4m16 0l-4-4m4 4l-4 4M4 12l4-4m-4 4l4 4m-4-4h16v8a2 2 0 01-2 2H6a2 2 0 01-2-2v-8z"></path></svg>;

const SortIcon = ({ direction }) => {
    if (!direction) return null;
    const iconPath = direction === 'asc' ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7";
    return <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={iconPath}></path></svg>;
};

// --- Main Component ---

const searchTypes = [
    { value: 'mixed', label: '混合' },
    { value: 'folder', label: '文件夹' },
    { value: 'file', label: '文件' },
];

export default function HomePage({ initialBreadcrumbs, initialFid, initialError }) {
    const [files, setFiles] = useState([]);
    const [breadcrumbs, setBreadcrumbs] = useState(initialBreadcrumbs);
    const [currentFid, setCurrentFid] = useState(initialFid);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState({ key: 'file_name', direction: 'asc' });
    const [searchQuery, setSearchQuery] = useState('');
    const [searchType, setSearchType] = useState('mixed'); // 'mixed', 'folder', 'file'
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState(initialError);
    const [suggestions, setSuggestions] = useState([]);
    const [viewMode, setViewMode] = useState('list');

    const loadMoreRef = useRef(null);

    // Debounce search query
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 300);
        return () => clearTimeout(handler);
    }, [searchQuery]);

    const loadFiles = useCallback(async (fid, page, sort, shouldAppend = false) => {
        setIsLoading(true);
        setError(null);
        try {
            const url = `/api/files?pdir_fid=${fid}&page=${page}&sort=${sort}`;
            const response = await fetch(url);
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || '网络请求失败');
            if (result.status !== 200) throw new Error(result.message || '获取文件列表失败');
            
            setFiles(prev => shouldAppend ? [...prev, ...result.data.list] : result.data.list);
            setHasMore(result.data.list.length === 50);
        } catch (e) {
            setError(e.message);
            if (!shouldAppend) setFiles([]);
            setHasMore(false);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Effect for search
    useEffect(() => {
        if (debouncedSearchQuery) {
            const performSearch = async () => {
                setIsSearching(true);
                setError(null);
                setHasMore(false);
                const searchUrl = `/api/search?pdir_fid=${currentFid}&query=${debouncedSearchQuery}&type=${searchType}`;
                try {
                    const searchResponse = await fetch(searchUrl);
                    if (!searchResponse.ok) {
                        const errorResult = await searchResponse.json();
                        throw new Error(errorResult.error || '搜索失败');
                    }
                    const searchResult = await searchResponse.json();
                    setFiles(searchResult.data.list);
                } catch (e) {
                    setError(e.message);
                } finally {
                    setIsSearching(false);
                }
            };
            performSearch();
        }
    }, [debouncedSearchQuery, searchType, currentFid]);

    // Effect for loading folder contents when not searching
    useEffect(() => {
        if (!debouncedSearchQuery) {
            setFiles([]); // Clear files before loading new folder
            setCurrentPage(1);
            const sortString = `${sortConfig.key}:${sortConfig.direction}`;
            loadFiles(currentFid, 1, sortString, false);
        }
    }, [debouncedSearchQuery, currentFid, sortConfig, loadFiles]);
    
    // Effect for search suggestions
    useEffect(() => {
        if (debouncedSearchQuery) {
            const fetchSuggestions = async () => {
                const suggestionsUrl = `/api/suggestions?pdir_fid=${currentFid}&query=${debouncedSearchQuery}&type=${searchType}`;
                try {
                    const suggestionsResponse = await fetch(suggestionsUrl);
                    if (suggestionsResponse.ok) {
                        const suggestionsResult = await suggestionsResponse.json();
                        setSuggestions(suggestionsResult);
                    } else {
                        setSuggestions([]);
                    }
                } catch (e) {
                    setSuggestions([]);
                }
            };
            fetchSuggestions();
        } else {
            setSuggestions([]);
        }
    }, [debouncedSearchQuery, currentFid, searchType]);

    // Effect for infinite scrolling
    useEffect(() => {
        if (isLoading || !hasMore || debouncedSearchQuery) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    const nextPage = currentPage + 1;
                    setCurrentPage(nextPage);
                    const sortString = `${sortConfig.key}:${sortConfig.direction}`;
                    loadFiles(currentFid, nextPage, sortString, true);
                }
            },
            { rootMargin: '200px' }
        );

        const node = loadMoreRef.current;
        if (node) {
            observer.observe(node);
        }

        return () => {
            if (node) {
                observer.unobserve(node);
            }
        };
    }, [files, isLoading, hasMore, currentPage, currentFid, sortConfig, debouncedSearchQuery, loadFiles]);


    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const triggerIndexer = useCallback((fid) => {
        fetch(`/api/indexer?pdir_fid=${fid}`).catch(err => {
            console.error(`Failed to trigger background indexer for ${fid}:`, err);
        });
    }, []);

    const handleFolderClick = (file) => {
        setSearchQuery(''); // Clear search when navigating
        setBreadcrumbs(prev => [...prev, { fid: file.fid, name: file.file_name }]);
        setCurrentFid(file.fid);
        triggerIndexer(file.fid);
    };

    const handleBreadcrumbClick = (crumb, index) => {
        setSearchQuery(''); // Clear search when navigating
        setBreadcrumbs(prev => prev.slice(0, index + 1));
        setCurrentFid(crumb.fid);
        triggerIndexer(crumb.fid);
    };
    
    const goBack = () => {
        if (breadcrumbs.length < 2) return;
        const parent = breadcrumbs[breadcrumbs.length - 2];
        handleBreadcrumbClick(parent, breadcrumbs.length - 2);
    };

    if (initialError) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
                <div className="text-center p-8 bg-gray-800 rounded-lg shadow-lg">
                    <h2 className="text-2xl font-bold text-red-500 mb-2">发生错误</h2>
                    <p className="text-gray-300">{initialError}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-gray-200 font-sans">
            <Head>
                <title>夸克网盘文件浏览器</title>
                <meta name="description" content="A Next.js app to browse Quark Drive files" />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <main className="container mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
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
                        <div className="flex-grow sm:flex-grow-0 flex items-center gap-2">
                            <div className="relative w-full sm:w-64">
                                <Combobox value={searchQuery} onChange={setSearchQuery}>
                                    <div className="relative">
                                        <Combobox.Input
                                            className="w-full pl-3 pr-10 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                            <div className="relative">
                                <Listbox value={searchType} onChange={setSearchType}>
                                    <div className="relative">
                                        <Listbox.Button className="w-full sm:w-auto pl-3 pr-10 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-left">
                                            <span className="block truncate">{searchTypes.find(st => st.value === searchType)?.label}</span>
                                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                    <path fillRule="evenodd" d="M10 3a.75.75 0 01.53.22l3.5 3.5a.75.75 0 01-1.06 1.06L10 4.81 7.03 7.78a.75.75 0 01-1.06-1.06l3.5-3.5A.75.75 0 0110 3zm-3.5 9.5a.75.75 0 011.06 0L10 15.19l2.97-2.97a.75.75 0 111.06 1.06l-3.5 3.5a.75.75 0 01-1.06 0l-3.5-3.5a.75.75 0 010-1.06z" clipRule="evenodd" />
                                                </svg>
                                            </span>
                                        </Listbox.Button>
                                        <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                            {searchTypes.map((type) => (
                                                <Listbox.Option
                                                    key={type.value}
                                                    value={type.value}
                                                    className={({ active }) => `relative cursor-default select-none py-2 pl-4 pr-4 ${active ? 'bg-blue-500/30 text-white' : 'text-gray-300'}`}
                                                >
                                                    {({ selected }) => (
                                                        <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                                            {type.label}
                                                        </span>
                                                    )}
                                                </Listbox.Option>
                                            ))}
                                        </Listbox.Options>
                                    </div>
                                </Listbox>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setViewMode('list')} className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-blue-500/30 text-white' : 'text-gray-400 hover:bg-gray-700'}`} aria-label="List view">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg>
                            </button>
                            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-blue-500/30 text-white' : 'text-gray-400 hover:bg-gray-700'}`} aria-label="Grid view">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
                            </button>
                        </div>
                    </div>
                </header>

                {viewMode === 'list' && (
                    <div className="bg-gray-800/50 rounded-lg shadow-lg overflow-hidden ring-1 ring-white/10">
                        <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-3 border-b border-gray-700 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            <button onClick={() => handleSort('file_name')} className="col-span-7 md:col-span-6 flex items-center hover:text-white">文件名 <SortIcon direction={sortConfig.key === 'file_name' ? sortConfig.direction : null} /></button>
                            <div className="col-span-2 md:col-span-3 text-right">大小</div>
                            <button onClick={() => handleSort('updated_at')} className="col-span-3 md:col-span-3 flex items-center justify-end hover:text-white">修改日期 <SortIcon direction={sortConfig.key === 'updated_at' ? sortConfig.direction : null} /></button>
                        </div>
                        <div>
                            {files.map((file) => {
                                const isFolder = file.dir === true;
                                const isZip = /\.(zip|z\d{2})$/i.test(file.file_name);
                                const IconComponent = isFolder ? ListFolderIcon : (isZip ? ListZipIcon : ListFileIcon);
                                return (
                                    <div key={file.fid} onClick={() => isFolder && handleFolderClick(file)} className={`block sm:grid sm:grid-cols-12 sm:gap-4 sm:items-center px-4 py-4 sm:px-6 border-b border-gray-700/50 last:border-b-0 transition-colors ${isFolder ? 'cursor-pointer hover:bg-gray-700/50' : ''}`}>
                                        <div className="col-span-12 sm:col-span-7 md:col-span-6 flex items-center mb-2 sm:mb-0">
                                            <div className="mr-4 flex-shrink-0 w-6 h-6"><IconComponent /></div>
                                            <span className="font-medium text-gray-100 truncate">{file.file_name}</span>
                                        </div>
                                        <div className="col-span-12 sm:col-span-5 md:col-span-6 flex justify-between sm:grid sm:grid-cols-2 sm:gap-4 text-sm text-gray-400 pl-10 sm:pl-0">
                                            <div className="sm:col-span-1 sm:text-right"><span className="sm:hidden font-semibold mr-2 text-gray-500">大小:</span>{!isFolder ? formatBytes(file.size || 0) : '--'}</div>
                                            <div className="sm:col-span-1 sm:text-right"><span className="sm:hidden font-semibold mr-2 text-gray-500">修改日期:</span>{formatDate(file.updated_at)}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {viewMode === 'grid' && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-9 gap-4">
                        {files.map((file) => {
                            const isFolder = file.dir === true;
                            const isZip = /\.(zip|z\d{2})$/i.test(file.file_name);
                            const IconComponent = isFolder ? GridFolderIcon : (isZip ? GridZipIcon : GridFileIcon);
                            return (
                                <div key={file.fid} onClick={() => isFolder && handleFolderClick(file)} className={`flex flex-col items-center justify-center p-4 rounded-lg transition-colors text-center ${isFolder ? 'cursor-pointer hover:bg-gray-800/60' : ''}`}>
                                    <div className="mb-2"><IconComponent /></div>
                                    <span className="text-sm text-gray-200 break-all line-clamp-2">{file.file_name}</span>
                                </div>
                            );
                        })}
                    </div>
                )}

                <div ref={loadMoreRef} style={{ height: '100px', margin: '20px 0' }} />

                {isLoading && (
                     <div className="text-center py-8">
                        <div className="inline-block w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-gray-400 mt-2">正在加载...</p>
                    </div>
                )}

                {!isLoading && !isSearching && files.length === 0 && (
                    <div className="text-center py-16 text-gray-500">
                        <svg className="mx-auto h-12 w-12 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-300">{debouncedSearchQuery ? '未找到结果' : '文件夹为空'}</h3>
                        <p className="mt-1 text-sm text-gray-500">{debouncedSearchQuery ? `没有找到与 "${debouncedSearchQuery}" 匹配的文件。` : '这个文件夹里没有文件或子文件夹。'}</p>
                    </div>
                )}
                
                {error && !isLoading && (
                    <div className="text-center py-10 text-red-500">加载失败: {error}</div>
                )}
            </main>
        </div>
    );
}

export async function getStaticProps() {
    const cookie = process.env.QUARK_COOKIE;
    if (!cookie) {
        return { props: { initialBreadcrumbs: [], initialFid: '', initialError: 'Server misconfiguration: QUARK_COOKIE is not set.' } };
    }

    try {
        const rootDirData = await getCachedQuarkFiles('0', cookie, 1, 'file_name:asc');
        
        if (rootDirData.status !== 200) {
            const errorMsg = rootDirData.message === 'require login [guest]' ? 'Cookie已失效' : rootDirData.message;
            throw new Error(errorMsg);
        }

        const gameShareFolder = rootDirData.data.list.find(item => item.dir && item.file_name === '游戏分享');

        if (!gameShareFolder) {
            return { props: { initialBreadcrumbs: [], initialFid: '', initialError: '在根目录中未找到 "游戏分享" 文件夹。' } };
        }

        return {
            props: {
                initialBreadcrumbs: [{ fid: gameShareFolder.fid, name: gameShareFolder.file_name }],
                initialFid: gameShareFolder.fid,
                initialError: null,
            },
            revalidate: 3600, 
        };
    } catch (error) {
        return {
            props: {
                initialBreadcrumbs: [],
                initialFid: '',
                initialError: error.message || '服务器端渲染时发生未知错误。',
            },
        };
    }
}
