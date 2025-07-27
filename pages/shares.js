import Head from 'next/head';
import { useState, useEffect } from 'react';
import Header from '../components/Header';
import FileList from '../components/FileList';
import StatusDisplay from '../components/StatusDisplay';

export default function SharesPage() {
    const [files, setFiles] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        const fetchShares = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`/api/shares?page=${page}&size=50`);
                const result = await res.json();

                if (!res.ok) {
                    throw new Error(result.error || 'Failed to fetch shares');
                }
                
                setFiles(result.data.list);
                setHasMore(result.data.list.length === 50);

            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchShares();
    }, [page]);

    const breadcrumbs = [{ fid: 'root', name: '分享列表' }];

    return (
        <div className="min-h-screen bg-gray-900 text-gray-200 font-sans">
            <Head>
                <title>分享列表 - 夸克网盘</title>
                <meta name="description" content="A page to display shared files from Quark Drive" />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <main className="container mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
                <Header
                    breadcrumbs={breadcrumbs}
                    goBack={() => window.history.back()}
                    handleBreadcrumbClick={() => {}}
                    searchQuery=""
                    setSearchQuery={() => {}}
                    suggestions={[]}
                    isSearching={false}
                    viewMode="list"
                    setViewMode={() => {}}
                />

                <FileList
                    files={files}
                    viewMode="list"
                    onFolderClick={(file) => window.open(file.share_url, '_blank')}
                    onSort={() => {}}
                    sortConfig={{ key: 'file_name', direction: 'asc' }}
                    isSharePage={true}
                />

                <div className="flex justify-center items-center mt-8 space-x-4">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1 || loading}
                        className="px-4 py-2 bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
                    >
                        上一页
                    </button>
                    <span className="text-lg font-semibold">{page}</span>
                    <button
                        onClick={() => setPage(p => p + 1)}
                        disabled={!hasMore || loading}
                        className="px-4 py-2 bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
                    >
                        下一页
                    </button>
                </div>

                <StatusDisplay
                    isLoading={loading}
                    isSearching={false}
                    files={files}
                    error={error}
                    debouncedSearchQuery=""
                />
            </main>
        </div>
    );
}
