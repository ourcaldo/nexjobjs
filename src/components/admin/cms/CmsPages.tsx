import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  MoreVertical,
  FileText,
  Calendar,
  User,
  Tag,
  Folder
} from 'lucide-react';
import { cmsPageService } from '@/services/cmsPageService';
import { NxdbPage } from '@/lib/supabase';
import { useToast } from '@/components/ui/ToastProvider';

const CmsPages: React.FC = () => {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [pages, setPages] = useState<NxdbPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    draft: 0,
    trash: 0,
    scheduled: 0
  });

  useEffect(() => {
    loadPages();
    loadStats();
  }, [statusFilter, searchTerm]);

  const loadPages = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      
      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }
      
      if (searchTerm) {
        filters.search = searchTerm;
      }

      const { pages: pagesData } = await cmsPageService.getPages(filters);
      setPages(pagesData);
    } catch (error) {
      console.error('Error loading pages:', error);
      showToast('error', 'Failed to load pages');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await cmsPageService.getPageStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleDeletePage = async (id: string) => {
    if (!confirm('Are you sure you want to delete this page permanently?')) {
      return;
    }

    try {
      const result = await cmsPageService.deletePage(id);
      if (result.success) {
        showToast('success', 'Page deleted successfully');
        loadPages();
        loadStats();
      } else {
        showToast('error', result.error || 'Failed to delete page');
      }
    } catch (error) {
      console.error('Error deleting page:', error);
      showToast('error', 'Failed to delete page');
    }
  };

  const handleMoveToTrash = async (id: string) => {
    try {
      const result = await cmsPageService.moveToTrash(id);
      if (result.success) {
        showToast('success', 'Page moved to trash');
        loadPages();
        loadStats();
      } else {
        showToast('error', result.error || 'Failed to move page to trash');
      }
    } catch (error) {
      console.error('Error moving page to trash:', error);
      showToast('error', 'Failed to move page to trash');
    }
  };

  const handleRestoreFromTrash = async (id: string) => {
    try {
      const result = await cmsPageService.restoreFromTrash(id);
      if (result.success) {
        showToast('success', 'Page restored from trash');
        loadPages();
        loadStats();
      } else {
        showToast('error', result.error || 'Failed to restore page');
      }
    } catch (error) {
      console.error('Error restoring page:', error);
      showToast('error', 'Failed to restore page');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      published: { color: 'bg-green-100 text-green-800', label: 'Published' },
      draft: { color: 'bg-gray-100 text-gray-800', label: 'Draft' },
      trash: { color: 'bg-red-100 text-red-800', label: 'Trash' },
      scheduled: { color: 'bg-blue-100 text-blue-800', label: 'Scheduled' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <FileText className="h-6 w-6 mr-3 text-primary-600" />
                Pages
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Manage your website pages
              </p>
            </div>
            <button
              onClick={() => router.push('/backend/admin/cms/pages/new')}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Page
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="p-6 border-b border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-500">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.published}</div>
              <div className="text-sm text-gray-500">Published</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{stats.draft}</div>
              <div className="text-sm text-gray-500">Draft</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.scheduled}</div>
              <div className="text-sm text-gray-500">Scheduled</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.trash}</div>
              <div className="text-sm text-gray-500">Trash</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search pages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="trash">Trash</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Pages List */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading pages...</p>
          </div>
        ) : pages.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No pages found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by creating your first page.'
              }
            </p>
            <button
              onClick={() => router.push('/backend/admin/cms/pages/new')}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Page
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Author
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categories
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pages.map((page) => (
                  <tr key={page.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {page.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          /{page.slug}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">
                          {page.author?.full_name || 'Unknown'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {page.categories?.slice(0, 2).map((category) => (
                          <span
                            key={category.id}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {category.name}
                          </span>
                        ))}
                        {page.categories && page.categories.length > 2 && (
                          <span className="text-xs text-gray-500">
                            +{page.categories.length - 2} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(page.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(page.updated_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {page.status === 'published' && (
                          <a
                            href={`/${page.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-gray-600"
                            title="View page"
                          >
                            <Eye className="h-4 w-4" />
                          </a>
                        )}
                        <button
                          onClick={() => router.push(`/backend/admin/cms/pages/edit/${page.id}`)}
                          className="text-primary-600 hover:text-primary-900"
                          title="Edit page"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        {page.status === 'trash' ? (
                          <>
                            <button
                              onClick={() => handleRestoreFromTrash(page.id)}
                              className="text-green-600 hover:text-green-900"
                              title="Restore from trash"
                            >
                              Restore
                            </button>
                            <button
                              onClick={() => handleDeletePage(page.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete permanently"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleMoveToTrash(page.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Move to trash"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CmsPages;