import Head from 'next/head';
import { useState, useEffect, useRef, useCallback } from 'react';
import { getCachedQuarkFiles } from '../utils/quark-api';
import Header from '../components/Header';
import FileList from '../components/FileList';
import StatusDisplay from '../components/StatusDisplay';

// --- Main Component ---
export default function HomePage({ initialBreadcrumbs, initialFid, initialError }) {
    const [files, setFiles] = useState([]);
    const [breadcrumbs, setBreadcrumbs] = useState(initialBreadcrumbs);
    const [currentFid, setCurrentFid] = useState(initialFid);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState({ key: 'file_name', direction: 'asc' });
    const [searchQuery, setSearchQuery] = useState('');
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

    // Effect for initial load and changes in folder/sort
    useEffect(() => {
        if (debouncedSearchQuery) {
            const performSearch = async () => {
                setIsSearching(true);
                setError(null);
                setHasMore(false);
                const searchUrl = `/api/search?pdir_fid=${currentFid}&query=${debouncedSearchQuery}`;
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
        } else {
            setFiles([]); // Clear files before loading new folder
            setCurrentPage(1);
            if (currentFid) {
                const sortString = `${sortConfig.key}:${sortConfig.direction}`;
                loadFiles(currentFid, 1, sortString, false);
            }
        }
    }, [debouncedSearchQuery, currentFid, sortConfig, loadFiles]);
    
    // Effect for search suggestions
    useEffect(() => {
        if (debouncedSearchQuery) {
            const fetchSuggestions = async () => {
                const suggestionsUrl = `/api/suggestions?pdir_fid=${currentFid}&query=${debouncedSearchQuery}`;
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
    }, [debouncedSearchQuery, currentFid]);

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
    }, [isLoading, hasMore, currentPage, currentFid, sortConfig, debouncedSearchQuery, loadFiles]);


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
        setBreadcrumbs(prev => [...prev, { fid: file.fid, name: file.file_name }]);
        setCurrentFid(file.fid);
        triggerIndexer(file.fid);
    };

    const handleBreadcrumbClick = (crumb, index) => {
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
                <Header
                    breadcrumbs={breadcrumbs}
                    goBack={goBack}
                    handleBreadcrumbClick={handleBreadcrumbClick}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    suggestions={suggestions}
                    isSearching={isSearching}
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                />

                <FileList
                    files={files}
                    viewMode={viewMode}
                    onFolderClick={handleFolderClick}
                    onSort={handleSort}
                    sortConfig={sortConfig}
                />

                <div ref={loadMoreRef} style={{ height: '100px', margin: '20px 0' }} />

                <StatusDisplay
                    isLoading={isLoading}
                    isSearching={isSearching}
                    files={files}
                    error={error}
                    debouncedSearchQuery={debouncedSearchQuery}
                />
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
