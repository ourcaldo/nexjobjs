import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { Search, Filter, X, Loader2, AlertCircle } from 'lucide-react';
import { Job } from '@/types/job';
import { FilterData, wpService } from '@/services/wpService';
import { userBookmarkService } from '@/services/userBookmarkService';
import { supabase } from '@/lib/supabase';
import { useAnalytics } from '@/hooks/useAnalytics';
import JobCard from '@/components/JobCard';
import JobSidebar from '@/components/JobSidebar';
import SearchableSelect from '@/components/SearchableSelect';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';

interface JobSearchPageProps {
  initialJobs: Job[];
  initialFilterData: FilterData;
  settings: any;
  totalJobs: number;
  categoryFilter?: string;
  locationFilter?: string;
}

const JobSearchPage: React.FC<JobSearchPageProps> = ({ 
  initialJobs, 
  initialFilterData, 
  settings, 
  totalJobs: initialTotalJobs,
  categoryFilter,
  locationFilter
}) => {
  const router = useRouter();
  const { trackPageView, trackJobSearch, trackFilterUsage } = useAnalytics();

  // State
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [totalJobs, setTotalJobs] = useState(initialTotalJobs);
  const [filterData, setFilterData] = useState<FilterData | null>(initialFilterData);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialJobs.length < initialTotalJobs);
  const [currentPage, setCurrentPage] = useState(1);
  const [userBookmarks, setUserBookmarks] = useState<Set<string>>(new Set());
  const [user, setUser] = useState<any>(null);

  // Search and filter state
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(locationFilter || '');
  const [selectedCategory, setSelectedCategory] = useState(categoryFilter || '');
  const [sortBy, setSortBy] = useState('newest');
  const [sidebarFilters, setSidebarFilters] = useState<any>({});

  // Refs for search management
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const lastSearchRef = useRef<string>('');
  const isSearchingRef = useRef(false);

  // Initialize user and bookmarks
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUser(user);
          await loadUserBookmarks(user.id);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      }
    };

    initializeAuth();
  }, []);

  const loadUserBookmarks = async (userId: string) => {
    try {
      const bookmarks = await userBookmarkService.getUserBookmarks(userId);
      setUserBookmarks(new Set(bookmarks.map(b => b.job_id)));
    } catch (error) {
      console.error('Error loading bookmarks:', error);
    }
  };

  // Track initial page view
  useEffect(() => {
    trackPageView({
      page_title: 'Lowongan Kerja',
      content_group1: 'job_search',
      content_group2: categoryFilter || 'all',
      content_group3: locationFilter || 'all',
    });
  }, [trackPageView, categoryFilter, locationFilter]);

  // Auto-search functionality
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchKeyword.trim() === '') {
      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (!isSearchingRef.current) {
        handleSearch();
      }
    }, 800);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchKeyword]);

  // Handle search
  const handleSearch = useCallback(async () => {
    const searchQuery = searchKeyword.trim();

    if (searchQuery === lastSearchRef.current) {
      return;
    }

    lastSearchRef.current = searchQuery;
    isSearchingRef.current = true;
    setLoading(true);

    try {
      const filters = {
        ...sidebarFilters,
        ...(selectedLocation && { lokasi_kota: [selectedLocation] }),
        ...(selectedCategory && { kategori_pekerjaan: [selectedCategory] }),
      };

      const response = await wpService.getJobs(filters, 1, 12, searchQuery, sortBy);

      setJobs(response.jobs);
      setTotalJobs(response.total);
      setCurrentPage(1);
      setHasMore(response.jobs.length < response.total);

      // Track search
      if (searchQuery) {
        trackJobSearch(searchQuery, response.total);
      }
    } catch (error) {
      console.error('Error searching jobs:', error);
    } finally {
      setLoading(false);
      isSearchingRef.current = false;
    }
  }, [searchKeyword, selectedLocation, selectedCategory, sidebarFilters, sortBy, trackJobSearch]);

  // Handle manual search (button click)
  const handleManualSearch = useCallback(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    handleSearch();
  }, [handleSearch]);

  // Load more jobs
  const loadMoreJobs = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    const nextPage = currentPage + 1;

    try {
      const filters = {
        ...sidebarFilters,
        ...(selectedLocation && { lokasi_kota: [selectedLocation] }),
        ...(selectedCategory && { kategori_pekerjaan: [selectedCategory] }),
      };

      const response = await wpService.getJobs(filters, nextPage, 12, searchKeyword, sortBy);

      setJobs(prev => [...prev, ...response.jobs]);
      setCurrentPage(nextPage);
      setHasMore(response.jobs.length === 12 && jobs.length + response.jobs.length < totalJobs);
    } catch (error) {
      console.error('Error loading more jobs:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, currentPage, sidebarFilters, selectedLocation, selectedCategory, searchKeyword, sortBy, jobs.length, totalJobs]);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setSearchKeyword('');
    setSelectedLocation('');
    setSelectedCategory('');
    setSortBy('newest');
    setSidebarFilters({});
    setJobs(initialJobs);
    setTotalJobs(initialTotalJobs);
    setCurrentPage(1);
    setHasMore(initialJobs.length < initialTotalJobs);
  }, [initialJobs, initialTotalJobs]);

  // Infinite scroll hook
  const { isFetching, setTarget, resetFetching } = useInfiniteScroll(loadMoreJobs, {
    threshold: 0.8,
    rootMargin: '200px'
  });

  // Reset fetching state when loading more is complete
  useEffect(() => {
    if (!loadingMore && isFetching) {
      resetFetching();
    }
  }, [loadingMore, isFetching, resetFetching]);

  // Event handlers
  const handleSidebarFilterChange = useCallback((newFilters: any) => {
    setSidebarFilters(newFilters);

    // Track filter usage
    Object.entries(newFilters).forEach(([filterType, values]) => {
      if (Array.isArray(values) && values.length > 0) {
        values.forEach(value => {
          trackFilterUsage(filterType, value);
        });
      }
    });
  }, [trackFilterUsage]);

  const handleSortChange = useCallback((newSortBy: string) => {
    setSortBy(newSortBy);
  }, []);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleManualSearch();
    }
  }, [handleManualSearch]);

  // Memoized filter options
  const locationOptions = useMemo(() => {
    if (!filterData?.nexjob_lokasi_kota) return [];
    return filterData.nexjob_lokasi_kota.map(city => ({
      value: city,
      label: city
    }));
  }, [filterData]);

  const categoryOptions = useMemo(() => {
    if (!filterData?.nexjob_kategori_pekerjaan) return [];
    return filterData.nexjob_kategori_pekerjaan.map(category => ({
      value: category,
      label: category
    }));
  }, [filterData]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {categoryFilter ? `Lowongan Kerja ${categoryFilter}` : 
             locationFilter ? `Lowongan Kerja di ${locationFilter}` : 
             'Lowongan Kerja'}
          </h1>
          <p className="text-gray-600">
            Temukan {totalJobs.toLocaleString()} lowongan kerja terbaru dan terpercaya
          </p>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari posisi, perusahaan, atau kata kunci..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            <div>
              <SearchableSelect
                options={locationOptions}
                value={selectedLocation}
                onChange={setSelectedLocation}
                placeholder="Pilih Kota"
                className="w-full"
              />
            </div>

            <div>
              <SearchableSelect
                options={categoryOptions}
                value={selectedCategory}
                onChange={setSelectedCategory}
                placeholder="Pilih Kategori"
                className="w-full"
              />
            </div>
          </div>

          <div className="flex justify-between items-center mt-4">
            <button
              onClick={clearAllFilters}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
            >
              <X className="h-4 w-4 mr-1" />
              Reset Filter
            </button>

            <button
              onClick={handleManualSearch}
              disabled={loading}
              className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              Cari Lowongan
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <JobSidebar
              filterData={filterData}
              onFilterChange={handleSidebarFilterChange}
              onSortChange={handleSortChange}
              totalJobs={totalJobs}
              currentSort={sortBy}
            />
          </div>

          {/* Job Results */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <Loader2 className="h-12 w-12 animate-spin text-primary-600 mx-auto mb-4" />
                  <p className="text-gray-600">Mencari lowongan...</p>
                </div>
              </div>
            ) : jobs.length > 0 ? (
              <>
                <div className="mb-6">
                  <p className="text-sm text-gray-600">
                    Menampilkan {jobs.length} dari {totalJobs.toLocaleString()} lowongan
                  </p>
                </div>

                <div className="space-y-6">
                  {jobs.map((job) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      isBookmarked={userBookmarks.has(job.id)}
                      onBookmarkChange={(jobId, isBookmarked) => {
                        const newBookmarks = new Set(userBookmarks);
                        if (isBookmarked) {
                          newBookmarks.add(jobId);
                        } else {
                          newBookmarks.delete(jobId);
                        }
                        setUserBookmarks(newBookmarks);
                      }}
                    />
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
                          onClick={loadMoreJobs}
                          className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
                        >
                          Muat Lebih Banyak
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* End of Results */}
                {!hasMore && jobs.length > 0 && (
                  <div className="text-center py-8">
                    <div className="text-gray-500 text-sm">
                      Anda telah melihat semua {totalJobs.toLocaleString()} lowongan yang tersedia
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Tidak ada lowongan ditemukan</h3>
                <p className="text-gray-600 mb-4">Coba ubah kriteria pencarian Anda</p>
                <button
                  onClick={clearAllFilters}
                  className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Reset Filter
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobSearchPage;