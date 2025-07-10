
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { 
  Save, 
  Eye, 
  Calendar, 
  User, 
  Tag, 
  Folder, 
  ImageIcon,
  ArrowLeft,
  Loader2,
  Plus,
  X
} from 'lucide-react';
import { cmsArticleService, CreateArticleData, UpdateArticleData } from '@/services/cmsArticleService';
import { cmsPageService, CreatePageData, UpdatePageData } from '@/services/cmsPageService';
import { supabaseAdminService } from '@/services/supabaseAdminService';
import { supabaseStorageService } from '@/services/supabaseStorageService';
import { NxdbArticle, NxdbPage, NxdbArticleCategory, NxdbArticleTag, NxdbPageCategory, NxdbPageTag } from '@/lib/supabase';
import { useToast } from '@/components/ui/ToastProvider';
import TiptapEditor from './TiptapEditor';

interface UnifiedEditorProps {
  contentType: 'articles' | 'pages' | 'jobs';
  itemId?: string;
}

type ContentItem = NxdbArticle | NxdbPage;
type Category = NxdbArticleCategory | NxdbPageCategory;
type Tag = NxdbArticleTag | NxdbPageTag;

const UnifiedEditor: React.FC<UnifiedEditorProps> = ({ contentType, itemId }) => {
  const router = useRouter();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(!!itemId);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    status: 'draft' as 'draft' | 'published' | 'scheduled' | 'trash',
    featured_image: '',
    seo_title: '',
    meta_description: '',
    schema_types: contentType === 'articles' ? ['Article'] : contentType === 'pages' ? ['WebPage'] : [] as string[],
    post_date: new Date().toISOString().slice(0, 16),
    published_at: ''
  });

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);

  const getSchemaOptions = () => {
    switch (contentType) {
      case 'articles':
        return ['Article', 'NewsArticle', 'BlogPosting', 'TechArticle', 'ScholarlyArticle', 'Review'];
      case 'pages':
        return ['WebPage', 'Article', 'Product', 'FAQPage', 'LocalBusiness', 'Event'];
      case 'jobs':
        return ['JobPosting', 'Article', 'WebPage'];
      default:
        return [];
    }
  };

  const getService = () => {
    switch (contentType) {
      case 'articles':
        return cmsArticleService;
      case 'pages':
        return cmsPageService;
      case 'jobs':
        // For now, return article service as placeholder until jobs service is implemented
        return cmsArticleService;
      default:
        return cmsArticleService;
    }
  };

  const getPreviewUrl = () => {
    if (!formData.slug || formData.status !== 'published') return null;

    switch (contentType) {
      case 'articles':
        const primaryCategory = categories.find(cat => selectedCategories.includes(cat.id));
        const categorySlug = primaryCategory?.slug || 'uncategorized';
        return `/artikel/${categorySlug}/${formData.slug}`;
      case 'pages':
        return `/${formData.slug}`;
      case 'jobs':
        return `/lowongan-kerja/${formData.slug}`;
      default:
        return null;
    }
  };

  const getContentTypeName = () => {
    switch (contentType) {
      case 'articles':
        return 'Article';
      case 'pages':
        return 'Page';
      case 'jobs':
        return 'Job';
      default:
        return 'Content';
    }
  };

  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      // Load current user
      const user = await supabaseAdminService.getCurrentProfile();
      setCurrentUser(user);

      const service = getService();

      // Load categories and tags
      const [categoriesData, tagsData] = await Promise.all([
        service.getCategories(),
        service.getTags()
      ]);

      setCategories(categoriesData);
      setTags(tagsData);

      // Load content data if editing
      if (itemId) {
        let item: ContentItem | null = null;

        if (contentType === 'articles') {
          item = await cmsArticleService.getArticleById(itemId);
        } else if (contentType === 'pages') {
          item = await cmsPageService.getPageById(itemId);
        }
        // Add jobs handling when implemented

        if (item) {
          setFormData({
            title: item.title,
            slug: item.slug,
            content: item.content,
            excerpt: item.excerpt,
            status: item.status,
            featured_image: item.featured_image || '',
            seo_title: item.seo_title || '',
            meta_description: item.meta_description || '',
            schema_types: item.schema_types,
            post_date: item.post_date.slice(0, 16),
            published_at: item.published_at?.slice(0, 16) || ''
          });

          setSelectedCategories(item.categories?.map(cat => cat.id) || []);
          setSelectedTags(item.tags?.map(tag => tag.id) || []);
        }
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      showToast('error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [itemId, contentType, showToast]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const generateSlug = async (title: string) => {
    if (!title) return '';
    const service = getService();
    const slug = await service.generateUniqueSlug(title, itemId);
    return slug;
  };

  const handleTitleChange = async (title: string) => {
    setFormData(prev => ({ ...prev, title }));

    // Auto-generate slug if it's empty or matches the previous title's slug
    if (!formData.slug || formData.slug === await generateSlug(formData.title)) {
      const newSlug = await generateSlug(title);
      setFormData(prev => ({ ...prev, slug: newSlug }));
    }
  };

  const handleSlugChange = (slug: string) => {
    // Clean slug
    const cleanSlug = slug
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    setFormData(prev => ({ ...prev, slug: cleanSlug }));
  };

  const handleSchemaChange = (schema: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        schema_types: [...prev.schema_types, schema]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        schema_types: prev.schema_types.filter(s => s !== schema)
      }));
    }
  };

  const handleCreateCategory = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!newCategoryName.trim()) return;

    try {
      const service = getService();
      const result = await service.createCategory(newCategoryName.trim());
      if (result.success && result.category) {
        setCategories(prev => [...prev, result.category!]);
        setSelectedCategories(prev => [...prev, result.category!.id]);
        setNewCategoryName('');
        showToast('success', 'Category created successfully');
      } else {
        showToast('error', result.error || 'Failed to create category');
      }
    } catch (error) {
      console.error('Error creating category:', error);
      showToast('error', 'Failed to create category');
    }
  };

  const handleCreateTag = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!newTagName.trim()) return;

    try {
      const service = getService();
      const result = await service.createTag(newTagName.trim());
      if (result.success && result.tag) {
        setTags(prev => [...prev, result.tag!]);
        setSelectedTags(prev => [...prev, result.tag!.id]);
        setNewTagName('');
        showToast('success', 'Tag created successfully');
      } else {
        showToast('error', result.error || 'Failed to create tag');
      }
    } catch (error) {
      console.error('Error creating tag:', error);
      showToast('error', 'Failed to create tag');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    setUploadingImage(true);
    try {
      const result = await supabaseStorageService.uploadFile(
        file,
        `${contentType}/${Date.now()}-${file.name}`,
        file.type
      );

      if (result.success && result.url) {
        const imageUrl = typeof result.url === 'string' ? result.url : '';
        setFormData(prev => ({ 
          ...prev, 
          featured_image: imageUrl
        }));
        showToast('success', 'Image uploaded successfully');
        // Clear the input value properly
        e.target.value = '';
      } else {
        showToast('error', result.error || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      showToast('error', 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async (status: 'draft' | 'published' | 'scheduled' | 'trash') => {
    if (!formData.title.trim()) {
      showToast('error', 'Title is required');
      return;
    }

    if (!formData.slug.trim()) {
      showToast('error', 'Slug is required');
      return;
    }

    if (!currentUser) {
      showToast('error', 'User not authenticated');
      return;
    }

    // Check if jobs functionality is implemented
    if (contentType === 'jobs') {
      showToast('info', 'Jobs CMS functionality is under development');
      return;
    }

    setSaving(true);
    try {
      const contentData = {
        ...formData,
        status,
        author_id: currentUser.id,
        published_at: status === 'published' ? new Date().toISOString() : 
                     status === 'scheduled' ? formData.published_at : undefined,
        category_ids: selectedCategories,
        tag_ids: selectedTags
      };

      let result;
      if (itemId) {
        if (contentType === 'articles') {
          result = await cmsArticleService.updateArticle({ id: itemId, ...contentData } as UpdateArticleData);
        } else if (contentType === 'pages') {
          result = await cmsPageService.updatePage({ id: itemId, ...contentData } as UpdatePageData);
        }
      } else {
        if (contentType === 'articles') {
          result = await cmsArticleService.createArticle(contentData as CreateArticleData);
        } else if (contentType === 'pages') {
          result = await cmsPageService.createPage(contentData as CreatePageData);
        }
      }

      if (result?.success) {
        showToast('success', `${getContentTypeName()} ${itemId ? 'updated' : 'created'} successfully`);

        // For new content creation, update the URL without reload
        if (!itemId && result.article) {
          // Update URL without navigation to avoid reload
          const newUrl = `/backend/admin/cms/${contentType}/edit/${result.article.id}`;
          window.history.replaceState({}, '', newUrl);
          // Update the itemId so subsequent saves will be updates
          router.query.id = result.article.id;
        } else if (!itemId && result.page) {
          // Update URL without navigation to avoid reload
          const newUrl = `/backend/admin/cms/${contentType}/edit/${result.page.id}`;
          window.history.replaceState({}, '', newUrl);
          // Update the itemId so subsequent saves will be updates
          router.query.id = result.page.id;
        }
      } else {
        showToast('error', result?.error || `Failed to ${itemId ? 'update' : 'create'} ${getContentTypeName().toLowerCase()}`);
      }
    } catch (error) {
      console.error('Error saving content:', error);
      showToast('error', `Failed to ${itemId ? 'update' : 'create'} ${getContentTypeName().toLowerCase()}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading editor...</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  router.push('/backend/admin/cms');
                }}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {itemId ? `Edit ${getContentTypeName()}` : `Add New ${getContentTypeName()}`}
                </h1>
                <p className="text-gray-600">
                  {itemId ? `Update your ${getContentTypeName().toLowerCase()} content and settings` : `Create a new ${getContentTypeName().toLowerCase()}`}
                </p>
              </div>
            </div>

            {formData.status === 'published' && getPreviewUrl() && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.open(getPreviewUrl()!, '_blank', 'noopener,noreferrer');
                }}
                className="inline-flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-7 space-y-6">
            {/* Title and Slug */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleTitleChange(e.target.value);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        e.stopPropagation();
                      }
                    }}
                    autoComplete="off"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    placeholder={`Enter ${getContentTypeName().toLowerCase()} title`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Slug *
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 py-2 border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm rounded-l-lg">
                      {contentType === 'articles' ? `/artikel/${selectedCategories.length > 0 ? categories.find(cat => cat.id === selectedCategories[0])?.slug || 'uncategorized' : 'uncategorized'}/` : 
                       contentType === 'pages' ? '/' : 
                       contentType === 'jobs' ? '/lowongan-kerja/' : '/'}
                    </span>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSlugChange(e.target.value);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          e.stopPropagation();
                        }
                      }}
                      autoComplete="off"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-r-lg focus:ring-primary-500 focus:border-primary-500"
                      placeholder={`${getContentTypeName().toLowerCase()}-slug`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Excerpt
                  </label>
                  <textarea
                    value={formData.excerpt}
                    onChange={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setFormData(prev => ({ ...prev, excerpt: e.target.value }));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                        e.preventDefault();
                        e.stopPropagation();
                      }
                    }}
                    autoComplete="off"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    placeholder={`Brief description of your ${getContentTypeName().toLowerCase()}`}
                  />
                </div>
              </div>
            </div>

            {/* Rich Text Editor */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content
              </label>
              <TiptapEditor
                value={formData.content}
                onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                placeholder={`Write your ${getContentTypeName().toLowerCase()} content here...`}
                className="w-full"
              />
              <p className="mt-2 text-xs text-gray-500">
                Use the visual editor to format your content. You can switch to preview mode to see how it will look.
              </p>
            </div>

            {/* SEO Settings */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">SEO Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SEO Title
                  </label>
                  <input
                    type="text"
                    value={formData.seo_title}
                    onChange={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setFormData(prev => ({ ...prev, seo_title: e.target.value }));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        e.stopPropagation();
                      }
                    }}
                    autoComplete="off"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Custom SEO title (optional)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meta Description
                  </label>
                  <textarea
                    value={formData.meta_description}
                    onChange={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setFormData(prev => ({ ...prev, meta_description: e.target.value }));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                        e.preventDefault();
                        e.stopPropagation();
                      }
                    }}
                    autoComplete="off"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Brief description for search engines"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Schema Types
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {getSchemaOptions().map((schema) => (
                      <label key={schema} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.schema_types.includes(schema)}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleSchemaChange(schema, e.target.checked);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              e.stopPropagation();
                            }
                          }}
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{schema}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-3 space-y-6">
            {/* Publish Box */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Publish</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Author
                  </label>
                  <div className="flex items-center">
                    <User className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">
                      {currentUser?.full_name || currentUser?.email || 'Current User'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Post Date
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.post_date}
                    onChange={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setFormData(prev => ({ ...prev, post_date: e.target.value }));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        e.stopPropagation();
                      }
                    }}
                    autoComplete="off"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                {formData.status === 'scheduled' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Publish Date
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.published_at}
                      onChange={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setFormData(prev => ({ ...prev, published_at: e.target.value }));
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          e.stopPropagation();
                        }
                      }}
                      autoComplete="off"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                )}
              </div>

              <div className="mt-6 space-y-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSave('draft');
                  }}
                  disabled={saving}
                  className="w-full px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Save as Draft'}
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSave('scheduled');
                  }}
                  disabled={saving}
                  className="w-full px-4 py-2 text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Schedule'}
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSave('published');
                  }}
                  disabled={saving}
                  className="w-full px-4 py-2 text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Publish'}
                </button>
              </div>
            </div>

            {/* Categories */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Folder className="h-5 w-5 mr-2" />
                Categories
              </h3>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {categories.map((category) => (
                  <label key={category.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        if (e.target.checked) {
                          setSelectedCategories(prev => [...prev, category.id]);
                        } else {
                          setSelectedCategories(prev => prev.filter(id => id !== category.id));
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          e.stopPropagation();
                        }
                      }}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{category.name}</span>
                  </label>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setNewCategoryName(e.target.value);
                    }}
                    placeholder="New category name"
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        e.stopPropagation();
                        handleCreateCategory();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleCreateCategory();
                    }}
                    className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Tag className="h-5 w-5 mr-2" />
                Tags
              </h3>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {tags.map((tag) => (
                  <label key={tag.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedTags.includes(tag.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        if (e.target.checked) {
                          setSelectedTags(prev => [...prev, tag.id]);
                        } else {
                          setSelectedTags(prev => prev.filter(id => id !== tag.id));
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          e.stopPropagation();
                        }
                      }}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{tag.name}</span>
                  </label>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newTagName}
                    onChange={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setNewTagName(e.target.value);
                    }}
                    placeholder="New tag name"
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        e.stopPropagation();
                        handleCreateTag();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleCreateTag();
                    }}
                    className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Featured Image */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <ImageIcon className="h-5 w-5 mr-2" />
                Featured Image
              </h3>

              {formData.featured_image ? (
                <div className="space-y-4">
                  <Image
                    src={formData.featured_image}
                    alt="Featured image preview"
                    width={400}
                    height={192}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setFormData(prev => ({ ...prev, featured_image: '' }));
                    }}
                    className="w-full px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Remove Image
                  </button>
                </div>
              ) : (
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="featured-image"
                    disabled={uploadingImage}
                  />
                  <label
                    htmlFor="featured-image"
                    className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:border-primary-500 transition-colors block"
                  >
                    {uploadingImage ? (
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    ) : (
                      <ImageIcon className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                    )}
                    <span className="text-sm text-gray-600">
                      {uploadingImage ? 'Uploading...' : 'Click to upload image'}
                    </span>
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};

export default UnifiedEditor;
