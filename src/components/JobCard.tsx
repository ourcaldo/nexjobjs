import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { MapPin, Clock, Briefcase, GraduationCap, ExternalLink, Building, Bookmark, EyeOff, Flame } from 'lucide-react';
import { Job } from '@/types/job';
import { supabase } from '@/lib/supabase';
import { userBookmarkService } from '@/services/userBookmarkService';
import { useToast } from '@/components/ui/ToastProvider';
import BookmarkLoginModal from '@/components/ui/BookmarkLoginModal';

interface JobCardProps {
  job: Job;
  onClick?: (job: Job) => void;
}

const JobCard: React.FC<JobCardProps> = ({ job, onClick }) => {
  const { showToast } = useToast();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showSalaryText, setShowSalaryText] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const cardRef = React.useRef<HTMLDivElement>(null);

  const checkUser = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    } catch (error) {
      console.error('Error checking user:', error);
    }
  }, []);

  const checkBookmarkStatus = useCallback(async () => {
    if (!user) return;

    try {
      const isBookmarked = await userBookmarkService.isBookmarked(user.id, job.id);
      setIsBookmarked(isBookmarked);
    } catch (error) {
      console.error('Error checking bookmark status:', error);
    }
  }, [user, job.id]);

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  useEffect(() => {
    if (user) {
      checkBookmarkStatus();
    }
  }, [user, checkBookmarkStatus]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Baru saja';
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffHours < 24) {
      if (diffHours === 1) return '1 jam lalu';
      return `${diffHours} jam lalu`;
    }

    if (diffDays === 1) return '1 hari lalu';
    if (diffDays < 7) return `${diffDays} hari lalu`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} minggu lalu`;
    return `${Math.ceil(diffDays / 30)} bulan lalu`;
  };

  const isHotJob = (dateStr?: string) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    return diffHours <= 12;
  };

  const getHotJobText = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    return `${diffHours} jam lalu`;
  };

  const isSalaryHidden = (salary: string) => {
    return salary === 'Perusahaan Tidak Menampilkan Gaji';
  };

  const handleBookmarkClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      setShowLoginModal(true);
      return;
    }

    try {
      const result = await userBookmarkService.toggleBookmark(user.id, job.id);

      if (result.success) {
        setIsBookmarked(result.isBookmarked);
        showToast('success', result.isBookmarked ? 'Lowongan berhasil disimpan' : 'Lowongan dihapus dari simpanan');
      } else {
        showToast('error', result.error || 'Gagal menyimpan lowongan');
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      showToast('error', 'Gagal menyimpan lowongan');
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Only open in new tab if clicking anywhere except the buttons
    const target = e.target as HTMLElement;
    if (!target.closest('button') && !target.closest('a')) {
      window.open(`/lowongan-kerja/${job.slug}/`, '_blank');
    }
  };

  const handleLoginModalLogin = () => {
    setShowLoginModal(false);
    window.open('/login/', '_blank');
  };

  const handleLoginModalSignup = () => {
    setShowLoginModal(false);
    window.open('/signup/', '_blank');
  };

  const getJobTags = () => {
    if (!job.tag) return [];

    const tags = job.tag.split(', ').map(tag => tag.trim()).filter(tag => tag.length > 0);

    if (tags.length > 4) {
      const visibleTags = tags.slice(0, 3);
      const remainingCount = tags.length - 3;
      return [...visibleTags, `+${remainingCount} Lainnya`];
    }

    return tags.slice(0, 4);
  };

  const tags = getJobTags();

  const loadBookmarkStatus = useCallback(async () => {
    if (!user) return;

    try {
      const isBookmarked = await userBookmarkService.isJobBookmarked(user.id, job.id);
      setIsBookmarked(isBookmarked);
    } catch (error) {
      console.error('Error checking bookmark status:', error);
    }
  }, [user, job.id]);

  useEffect(() => {
    loadBookmarkStatus();
  }, [loadBookmarkStatus]);

  return (
    <>
      <div 
        ref={cardRef}
        onClick={handleCardClick}
        className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-300 hover:border-primary-200 animate-fade-in cursor-pointer"
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors line-clamp-2">
              {job.title}
            </h2>
            <div className="flex items-center text-primary-600 font-medium mb-2">
              <Building className="h-4 w-4 mr-2" />
              {job.company_name}
            </div>
            <div className="flex items-center text-gray-500 text-sm">
              <MapPin className="h-4 w-4 mr-1" />
              {job.lokasi_kota}, {job.lokasi_provinsi}
            </div>
          </div>
          <div className="text-right">
            {isSalaryHidden(job.gaji) ? (
              <div 
                className="relative"
                onMouseEnter={() => setShowSalaryText(true)}
                onMouseLeave={() => setShowSalaryText(false)}
              >
                <div className="flex items-center justify-end text-gray-400">
                  <EyeOff className="h-5 w-5" />
                </div>
                {showSalaryText && (
                  <div className="absolute right-0 top-full mt-1 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                    Gaji tidak ditampilkan
                  </div>
                )}
              </div>
            ) : (
              <p className="text-lg font-bold text-accent-600">{job.gaji}</p>
            )}
          </div>
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {tags.map((tag, index) => (
              <span
                key={index}
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                  tag.includes('Lainnya') 
                    ? 'bg-gray-100 text-gray-600' 
                    : 'bg-primary-50 text-primary-700 hover:bg-primary-100'
                }`}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Job Details */}
        <div className="grid grid-cols-2 gap-4 mb-4 text-sm text-gray-600">
          <div className="flex items-center">
            <Briefcase className="h-4 w-4 mr-2 text-gray-400" />
            {job.tipe_pekerjaan}
          </div>
          <div className="flex items-center">
            <GraduationCap className="h-4 w-4 mr-2 text-gray-400" />
            {job.pendidikan}
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2 text-gray-400" />
            {job.pengalaman}
          </div>
          <div className="flex items-center">
            <span className="w-4 h-4 mr-2 text-gray-400 text-xs">🏢</span>
            {job.industry}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-2">
            {isHotJob(job.created_at) ? (
              <div className="flex items-center text-orange-600 text-sm font-medium">
                <Flame className="h-4 w-4 mr-1" />
                <span>HOT</span>
                <span className="ml-1 text-gray-500">{getHotJobText(job.created_at)}</span>
              </div>
            ) : (
              <span className="text-sm text-gray-500">
                {formatDate(job.created_at)}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleBookmarkClick}
              className={`p-2 rounded-lg transition-all duration-200 ${
                isBookmarked 
                  ? 'text-primary-600 bg-primary-50 hover:bg-primary-100' 
                  : 'text-gray-400 hover:text-primary-600 hover:bg-primary-50'
              }`}
              title={isBookmarked ? 'Hapus dari bookmark' : 'Simpan ke bookmark'}
            >
              <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
            </button>
            <Link
              href={`/lowongan-kerja/${job.slug}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              onClick={(e) => e.stopPropagation()}
            >
              Lihat Detail
              <ExternalLink className="h-4 w-4 ml-2" />
            </Link>
          </div>
        </div>
      </div>

      {/* Login Modal */}
      <BookmarkLoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={handleLoginModalLogin}
        onSignup={handleLoginModalSignup}
      />
    </>
  );
};

export default JobCard;