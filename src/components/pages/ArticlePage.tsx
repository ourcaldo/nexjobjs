
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Calendar, User, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { wpService } from '@/services/wpService';
import { useAnalytics } from '@/hooks/useAnalytics';
import Breadcrumbs from '@/components/Breadcrumbs';
import ArticleSidebar from '@/components/ArticleSidebar';
import AdDisplay from '@/components/Advertisement/AdDisplay';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';

interface ArticlePageProps {
  initialArticles: any[];
  settings: any;
  totalArticles: number;
}

const ArticlePage: React.FC<ArticlePageProps> = ({ initialArticles, settings, totalArticles: initialTotalArticles }) => {
  const router = useRouter();
  const { trackPageView, trackArticleClick } = useAnalytics();

  // State
  const [articles, setArticles] = useState<any[]>(initialArticles);
  const [totalArticles, setTotalArticles] = useState(initialTotalArticles);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialArticles.length < initialTotalArticles);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchKeyword, setSearchKeyword] = useState('');

  // Track initial page view
  useEffect(() => {
    trackPageView({
      page_title: 'Tips Karir',
      content_group1: 'article_listing',
    });
  }, [trackPageView]);

  // Handle search
  const handleSearch = useCallback(async () => {
    setLoading(true);
    try {
      const response = await wpService.getArticles(1, 12, searchKeyword);
      setArticles(response.articles);
      setTotalArticles(response.total);
      setCurrentPage(1);
      setHasMore(response.articles.length < response.total);
    } catch (error) {
      console.error('Error searching articles:', error);
    } finally {
      setLoading(false);
    }
  }, [searchKeyword]);

  // Load more articles
  const loadMoreArticles = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    const nextPage = currentPage + 1;

    try {
      const response = await wpService.getArticles(nextPage, 12, searchKeyword);
      setArticles(prev => [...prev, ...response.articles]);
      setCurrentPage(nextPage);
      setHasMore(response.articles.length === 12 && articles.length + response.articles.length < totalArticles);
    } catch (error) {
      console.error('Error loading more articles:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, currentPage, searchKeyword, articles.length, totalArticles]);

  // Infinite scroll hook
  const { isFetching, setTarget, resetFetching } = useInfiniteScroll(loadMoreArticles, {
    threshold: 0.8,
    rootMargin: '200px'
  });

  // Reset fetching state when loading more is complete
  useEffect(() => {
    if (!loadingMore && isFetching) {
      resetFetching();
    }
  }, [loadingMore, isFetching, resetFetching]);

  const handleArticleClick = (article: any) => {
    trackArticleClick(article.title.rendered, article.id.toString());
    router.push(`/artikel/${article.slug}/`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const breadcrumbItems = [
    { label: 'Tips Karir' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <Breadcrumbs items={breadcrumbItems} />

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tips Karir</h1>
          <p className="text-gray-600">
            Temukan {totalArticles.toLocaleString()} artikel berguna untuk mengembangkan karir Anda
          </p>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari artikel, tips karir, atau topik..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              Cari Artikel
            </button>
          </div>
        </div>

        {/* Top Advertisement */}
        <div className="mb-8">
          <AdDisplay position="listing_top_ad_code" />
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Article List */}
          <div className="lg:col-span-2">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <Loader2 className="h-12 w-12 animate-spin text-primary-600 mx-auto mb-4" />
                  <p className="text-gray-600">Mencari artikel...</p>
                </div>
              </div>
            ) : articles.length > 0 ? (
              <>
                <div className="mb-6">
                  <p className="text-sm text-gray-600">
                    Menampilkan {articles.length} dari {totalArticles.toLocaleString()} artikel
                  </p>
                </div>

                <div className="space-y-8">
                  {articles.map((article, index) => (
                    <article
                      key={article.id}
                      onClick={() => handleArticleClick(article)}
                      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300 cursor-pointer group"
                    >
                      <div className="md:flex">
                        {article.featured_media_url && (
                          <div className="md:w-1/3">
                            <div className="aspect-video md:aspect-square overflow-hidden relative">
                              <Image
                                src={article.featured_media_url}
                                alt={article.title.rendered}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px"
                              />
                            </div>
                          </div>
                        )}
                        <div className={`p-6 ${article.featured_media_url ? 'md:w-2/3' : 'w-full'}`}>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-3">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {formatDate(article.date)}
                            </div>
                            {article.author_info && (
                              <div className="flex items-center">
                                <User className="h-4 w-4 mr-1" />
                                {article.author_info.display_name || article.author_info.name}
                              </div>
                            )}
                          </div>

                          <h2 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary-600 transition-colors line-clamp-2">
                            {article.title.rendered}
                          </h2>

                          {article.excerpt && (
                            <p className="text-gray-600 mb-4 line-clamp-3">
                              {article.excerpt.rendered.replace(/<[^>]*>/g, '')}
                            </p>
                          )}

                          <div className="flex items-center text-primary-600 text-sm font-medium group-hover:text-primary-700">
                            Baca Selengkapnya
                            <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform duration-200" />
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>

                {/* Load More */}
                {hasMore && (
                  <div className="mt-8 text-center">
                    <div ref={setTarget}>
                      {loadingMore ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-primary-600 mr-2" />
                          <span className="text-gray-600">Memuat lebih banyak...</span>
                        </div>
                      ) : (
                        <button
                          onClick={loadMoreArticles}
                          className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
                        >
                          Muat Lebih Banyak
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* End of Results */}
                {!hasMore && articles.length > 0 && (
                  <div className="text-center py-8">
                    <div className="text-gray-500 text-sm">
                      Anda telah melihat semua {totalArticles.toLocaleString()} artikel yang tersedia
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Tidak ada artikel ditemukan</h3>
                <p className="text-gray-600 mb-4">Coba ubah kata kunci pencarian Anda</p>
                <button
                  onClick={() => {
                    setSearchKeyword('');
                    setArticles(initialArticles);
                    setTotalArticles(initialTotalArticles);
                    setHasMore(initialArticles.length < initialTotalArticles);
                  }}
                  className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Reset Pencarian
                </button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <ArticleSidebar relatedArticles={articles.slice(0, 5)} isArchive={true} />
          </div>
        </div>

        {/* Bottom Advertisement */}
        <div className="mt-8">
          <AdDisplay position="listing_bottom_ad_code" />
        </div>
      </div>
    </div>
  );
};

export default ArticlePage;
