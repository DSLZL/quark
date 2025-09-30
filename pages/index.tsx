import Head from 'next/head';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Button, Spinner } from '@heroui/react';
import SearchBar from '@/components/SearchBar';
import BreadcrumbsBar from '@/components/BreadcrumbsBar';
import ViewToggle from '@/components/ViewToggle';
import FileList from '@/components/FileList';
import FileGrid from '@/components/FileGrid';
import { getCachedQuarkFiles } from '@/utils/quark-api';
import { BreadcrumbItemType, FileItem, SearchType } from '@/types/file';
import { useDebounce } from '@/hooks/useDebounce';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';

const PAGE_SIZE = 50;

// 工具函数
const formatBytes = (bytes: number | string | undefined, decimals = 2) => {
  const num = typeof bytes === 'string' ? parseInt(bytes, 10) : (bytes ?? 0);
  if (!+num) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(num) / Math.log(k));
  return `${parseFloat(((num as number) / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

const formatDate = (timestamp?: string | number | Date) => {
  if (!timestamp) return '';
  try {
    const fmt = new Intl.DateTimeFormat('zh-CN', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
    return fmt.format(new Date(timestamp));
  } catch {
    return new Date(timestamp).toISOString().slice(0, 16).replace('T', ' ');
  }
};

export default function HomePage({ initialBreadcrumbs, initialFid, initialError }: {
  initialBreadcrumbs: BreadcrumbItemType[];
  initialFid: string;
  initialError: string | null;
}) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItemType[]>(initialBreadcrumbs || []);
  const [currentFid, setCurrentFid] = useState<string>(initialFid || '');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortConfig, setSortConfig] = useState<{ key: 'file_name' | 'updated_at'; direction: 'asc' | 'desc' }>({ key: 'file_name', direction: 'asc' });
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchType, setSearchType] = useState<SearchType>('mixed');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(initialError || null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // 建议下拉
  const [suggestions, setSuggestions] = useState<{ fid: string; file_name: string }[]>([]);
  const [showSuggest, setShowSuggest] = useState<boolean>(false);

  const loadingRef = useRef<boolean>(false);
  const mountedRef = useRef<boolean>(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  const sortString = useMemo(() => `${sortConfig.key}:${sortConfig.direction}`, [sortConfig]);

  // 输入防抖（通用 Hook）
  const debouncedSearchQuery = useDebounce(searchQuery.trim(), 300);

  // 加载文件列表
  const loadFiles = useCallback(
    async (fid: string, page: number, sort: string, shouldAppend = false) => {
      if (!fid) {
        setIsLoading(false);
        return;
      }
      if (loadingRef.current) return;
      loadingRef.current = true;
      setIsLoading(true);
      setError(null);
      const controller = new AbortController();
      try {
        const url = `/api/files?pdir_fid=${fid}&page=${page}&sort=${sort}`;
        const response = await fetch(url, { signal: controller.signal });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || '网络请求失败');
        if (result.status !== 200) throw new Error(result.message || '获取文件列表失败');
        if (!mountedRef.current) return;
        setFiles((prev) => (shouldAppend ? [...prev, ...result.data.list] : result.data.list));
        setHasMore(result.data.list.length === PAGE_SIZE);
      } catch (e: any) {
        if (e.name !== 'AbortError') {
          if (!mountedRef.current) return;
          setError(e.message);
          if (!shouldAppend) setFiles([]);
          setHasMore(false);
        }
      } finally {
        loadingRef.current = false;
        if (mountedRef.current) setIsLoading(false);
      }
    },
    []
  );

  // 搜索
  useEffect(() => {
    if (!debouncedSearchQuery || !currentFid) return;
    let cancelled = false;
    const controller = new AbortController();
    (async () => {
      setIsSearching(true);
      setError(null);
      setHasMore(false);
      try {
        const url = `/api/search?pdir_fid=${currentFid}&query=${encodeURIComponent(debouncedSearchQuery)}&type=${searchType}`;
        const resp = await fetch(url, { signal: controller.signal });
        if (!resp.ok) {
          const errJson = await resp.json().catch(() => ({}));
          throw new Error(errJson.error || '搜索失败');
        }
        const data = await resp.json();
        if (!cancelled) setFiles(data.data.list || []);
      } catch (e: any) {
        if (e.name !== 'AbortError' && !cancelled) setError(e.message);
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    })();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [debouncedSearchQuery, searchType, currentFid]);

  // 非搜索时加载当前文件夹第一页
  useEffect(() => {
    if (debouncedSearchQuery || !currentFid) return;
    setFiles([]);
    setCurrentPage(1);
    loadFiles(currentFid, 1, sortString, false);
  }, [debouncedSearchQuery, currentFid, sortString, loadFiles]);

  // 建议（最多 10 条）
  useEffect(() => {
    if (!debouncedSearchQuery || !currentFid) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    const controller = new AbortController();
    (async () => {
      try {
        const url = `/api/suggestions?pdir_fid=${currentFid}&query=${encodeURIComponent(debouncedSearchQuery)}&type=${searchType}`;
        const resp = await fetch(url, { signal: controller.signal });
        if (!resp.ok) throw new Error('建议获取失败');
        const data = await resp.json();
        if (!cancelled) setSuggestions((data || []).slice(0, 10));
      } catch (_) {
        if (!cancelled) setSuggestions([]);
      }
    })();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [debouncedSearchQuery, currentFid, searchType]);

  // 无限滚动（通用 Hook）
  // 按需触发加载下一页
  const onIntersect = useCallback(() => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    loadFiles(currentFid, nextPage, sortString, true);
  }, [currentPage, currentFid, sortString, loadFiles]);
  const loadMoreRef = useInfiniteScroll({
    enabled: !isLoading && hasMore && !debouncedSearchQuery && !!currentFid,
    onIntersect,
    rootMargin: '200px',
  });

  const handleSort = (key: 'file_name' | 'updated_at') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const triggerIndexer = useCallback((fid: string) => {
    if (!fid) return;
    fetch(`/api/indexer?pdir_fid=${fid}`).catch((err) => {
      console.error(`Failed to trigger background indexer for ${fid}:`, err);
    });
  }, []);

  const handleFolderClick = (file: FileItem) => {
    setSearchQuery('');
    setBreadcrumbs((prev) => [...prev, { fid: file.fid, name: file.file_name }]);
    setCurrentFid(file.fid);
    triggerIndexer(file.fid);
  };

  const handleBreadcrumbClick = (crumb: BreadcrumbItemType, index: number) => {
    const newTrail = breadcrumbs.slice(0, index + 1);
    setBreadcrumbs(newTrail);
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
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
        <div className="text-center p-8 bg-content1 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-danger mb-2">发生错误</h2>
          <p className="text-foreground/80">{initialError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Head>
        <title>夸克网盘文件浏览器</title>
        <meta name="description" content="A Next.js app to browse Quark Drive files" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        <header className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-5 mb-8 border-b border-divider">
          <BreadcrumbsBar
            breadcrumbs={breadcrumbs}
            onClick={handleBreadcrumbClick}
            canGoBack={breadcrumbs.length > 1}
            onBack={goBack}
          />
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              onEnter={() => setSearchQuery(searchQuery.trim())}
              isSearching={isSearching}
              suggestions={suggestions}
              showSuggest={showSuggest}
              setShowSuggest={setShowSuggest}
              onSelectSuggestion={(name) => { setSearchQuery(name); setShowSuggest(false); }}
            />
            <ViewToggle viewMode={viewMode} setViewMode={setViewMode} searchType={searchType} setSearchType={(v) => setSearchType(v as SearchType)} />
          </div>
        </header>

        {viewMode === 'list' && (
          <FileList
            files={files}
            sortKey={sortConfig.key}
            sortDirection={sortConfig.direction}
            onSort={handleSort}
            onFolderClick={handleFolderClick}
            formatBytes={formatBytes}
            formatDate={formatDate}
          />
        )}

        {viewMode === 'grid' && (
          <FileGrid files={files} onFolderClick={handleFolderClick} />
        )}

        <div ref={loadMoreRef} style={{ height: '100px', margin: '20px 0' }} />

        {isLoading && (
          <div className="text-center py-8 flex flex-col items-center gap-2">
            <Spinner color="primary" />
            <p className="text-foreground/70">正在加载...</p>
          </div>
        )}

        {!isLoading && !isSearching && files.length === 0 && (
          <div className="text-center py-16 text-foreground/60">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium">{debouncedSearchQuery ? '未找到结果' : '文件夹为空'}</h3>
            <p className="mt-1 text-sm">{debouncedSearchQuery ? `没有找到与 "${debouncedSearchQuery}" 匹配的文件。` : '这个文件夹里没有文件或子文件夹。'}</p>
          </div>
        )}

        {error && !isLoading && (
          <div className="text-center py-10 text-danger">加载失败: {error}</div>
        )}
      </main>
    </div>
  );
}

export async function getStaticProps() {
  const cookie = process.env.QUARK_COOKIE;
  if (!cookie) {
    return {
      props: {
        initialBreadcrumbs: [],
        initialFid: '',
        initialError: 'Server misconfiguration: QUARK_COOKIE is not set.',
      },
    };
  }

  try {
    const rootDirData = await getCachedQuarkFiles('0', cookie, 1, 'file_name:asc');
    if (rootDirData.status !== 200) {
      const errorMsg = rootDirData.message === 'require login [guest]' ? 'Cookie已失效' : rootDirData.message;
      throw new Error(errorMsg);
    }
    const gameShareFolder = rootDirData.data.list.find((item: any) => item.dir && item.file_name === '游戏分享');
    if (!gameShareFolder) {
      return {
        props: {
          initialBreadcrumbs: [],
          initialFid: '',
          initialError: '在根目录中未找到 "游戏分享" 文件夹。',
        },
      };
    }
    return {
      props: {
        initialBreadcrumbs: [{ fid: gameShareFolder.fid, name: gameShareFolder.file_name }],
        initialFid: gameShareFolder.fid,
        initialError: null,
      },
      revalidate: 3600,
    };
  } catch (error: any) {
    return {
      props: {
        initialBreadcrumbs: [],
        initialFid: '',
        initialError: error.message || '服务器端渲染时发生未知错误',
      },
    };
  }
}

