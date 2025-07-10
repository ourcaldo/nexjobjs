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
import { supabaseAdminService } from '@/services/supabaseAdminService';
import { supabaseStorageService } from '@/services/supabaseStorageService';
import { NxdbArticle, NxdbArticleCategory, NxdbArticleTag } from '@/lib/supabase';
import { useToast } from '@/components/ui/ToastProvider';
import TiptapEditor from './TiptapEditor';

interface ArticleEditorProps {
  articleId?: string;
}

const ArticleEditor: React.FC<ArticleEditorProps> = ({ articleId }) => {
  const router = useRouter();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(!!articleId);
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
    schema_types: ['Article'] as string[],
    post_date: new Date().toISOString().slice(0, 16),
    published_at: ''
  });

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [categories, setCategories] = useState<NxdbArticleCategory[]>([]);
  const [tags, setTags] = useState<NxdbArticleTag[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);

  const schemaOptions = [
    'Article',
    'NewsArticle', 
    'BlogPosting',
    'TechArticle',
    'ScholarlyArticle',
    'Review'
  ];

  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      // Load current user
      const user = await supabaseAdminService.getCurrentProfile();
      setCurrentUser(user);

      // Load categories and tags
      const [categoriesData, tagsData] = await Promise.all([
        cmsArticleService.getCategories(),
        cmsArticleService.getTags()
      ]);

      setCategories(categoriesData);
      setTags(tagsData);

      // Load article data if editing
      if (articleId) {
        const article = await cmsArticleService.getArticleById(articleId);
        if (article) {
          setFormData({
            title: article.title,
            slug: article.slug,
            content: article.content,
            excerpt: article.excerpt,
            status: article.status,
            featured_image: article.featured_image || '',
            seo_title: article.seo_title || '',
            meta_description: article.meta_description || '',
            schema_types: article.schema_types,
            post_date: article.post_date.slice(0, 16),
            published_at: article.published_at?.slice(0, 16) || ''
          });

          setSelectedCategories(article.categories?.map(cat => cat.id) || []);
          setSelectedTags(article.tags?.map(tag => tag.id) || []);
        }
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      showToast('error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [articleId, showToast]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const generateSlug = async (title: string) => {
    if (!title) return '';
    const slug = await cmsArticleService.generateUniqueSlug(title, articleId);
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    // Prevent any default behavior
    e.preventDefault();
    e.stopPropagation();

    setUploadingImage(true);
    try {
      const result = await supabaseStorageService.uploadFile(
        file,
        `articles/${Date.now()}-${file.name}`,
        file.type
      );

      if (result.success && result.url) {
        // Update state immediately without reload
        const imageUrl = typeof result.url === 'string' ? result.url : '';
        setFormData(prev => ({ 
          ...prev, 
          featured_image: imageUrl
        }));
        showToast('success', 'Image uploaded successfully');
        
        // Clear the input to allow re-upload of same file if needed
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

  const handleCreateCategory = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!newCategoryName.trim()) return;

    try {
      const result = await cmsArticleService.createCategory(newCategoryName.trim());
      if (result.success && result.category) {
        // Update state immediately without reload
        setCategories(prev => {
          const updated = [...prev, result.category!];
          return updated;
        });
        setSelectedCategories(prev => {
          const updated = [...prev, result.category!.id];
          return updated;
        });
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
      const result = await cmsArticleService.createTag(newTagName.trim());
      if (result.success && result.tag) {
        // Update state immediately without reload
        setTags(prev => {
          const updated = [...prev, result.tag!];
          return updated;
        });
        setSelectedTags(prev => {
          const updated = [...prev, result.tag!.id];
          return updated;
        });
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

    setSaving(true);
    try {
      const articleData = {
        ...formData,
        status,
        author_id: currentUser.id,
        published_at: status === 'published' ? new Date().toISOString() : 
                     status === 'scheduled' ? formData.published_at : undefined,
        category_ids: selectedCategories,
        tag_ids: selectedTags
      };

      let result;
      if (articleId) {
        result = await cmsArticleService.updateArticle({ id: articleId, ...articleData } as UpdateArticleData);
      } else {
        result = await cmsArticleService.createArticle(articleData as CreateArticleData);
      }

      if (result.success) {
        showToast('success', `Article ${articleId ? 'updated' : 'created'} successfully`);
        if (!articleId && result.article) {
          router.push(`/backend/admin/cms/articles/edit/${result.article.id}`);
        }
      } else {
        showToast('error', result.error || `Failed to ${articleId ? 'update' : 'create'} article`);
      }
    } catch (error) {
      console.error('Error saving article:', error);
      showToast('error', `Failed to ${articleId ? 'update' : 'create'} article`);
    } finally {
      setSaving(false);
    }
  };

  const getPreviewUrl = () => {
    if (!formData.slug || formData.status !== 'published') return null;

    const primaryCategory = categories.find(cat => selectedCategories.includes(cat.id));
    const categorySlug = primaryCategory?.slug || 'uncategorized';

    return `/artikel/${categorySlug}/${formData.slug}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading article editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/backend/admin/cms')}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {articleId ? 'Edit Article' : 'Add New Article'}
              </h1>
              <p className="text-gray-600">
                {articleId ? 'Update your article content and settings' : 'Create a new article for your website'}
              </p>
            </div>
          </div>

          {formData.status === 'published' && getPreviewUrl() && (
            <a
              href={getPreviewUrl()!}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </a>
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
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter article title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slug *
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 py-2 border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm rounded-l-lg">
                    /artikel/{selectedCategories.length > 0 ? categories.find(cat => cat.id === selectedCategories[0])?.slug || 'uncategorized' : 'uncategorized'}/
                  </span>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-r-lg focus:ring-primary-500 focus:border-primary-500"
                    placeholder="article-slug"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Excerpt
                </label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Brief description of your article"
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
              placeholder="Write your article content here..."
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
                  onChange={(e) => setFormData(prev => ({ ...prev, seo_title: e.target.value }))}
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
                  onChange={(e) => setFormData(prev => ({ ...prev, meta_description: e.target.value }))}
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
                  {schemaOptions.map((schema) => (
                    <label key={schema} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.schema_types.includes(schema)}
                        onChange={(e) => handleSchemaChange(schema, e.target.checked)}
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
                  onChange={(e) => setFormData(prev => ({ ...prev, post_date: e.target.value }))}
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
                    onChange={(e) => setFormData(prev => ({ ...prev, published_at: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              )}
            </div>

            <div className="mt-6 space-y-2">
              <button
                onClick={() => handleSave('draft')}
                disabled={saving}
                className="w-full px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Save as Draft'}
              </button>

              <button
                onClick={() => handleSave('scheduled')}
                disabled={saving}
                className="w-full px-4 py-2 text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Schedule'}
              </button>

              <button
                onClick={() => handleSave('published')}
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
                      if (e.target.checked) {
                        setSelectedCategories(prev => [...prev, category.id]);
                      } else {
                        setSelectedCategories(prev => prev.filter(id => id !== category.id));
                      }
                    }}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">{category.name}</span>
                </label>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <form onSubmit={handleCreateCategory} className="flex space-x-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="New category name"
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                />
                <button
                  type="submit"
                  className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </form>
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
                      if (e.target.checked) {
                        setSelectedTags(prev => [...prev, tag.id]);
                      } else {
                        setSelectedTags(prev => prev.filter(id => id !== tag.id));
                      }
                    }}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">{tag.name}</span>
                </label>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <form onSubmit={handleCreateTag} className="flex space-x-2">
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="New tag name"
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                />
                <button
                  type="submit"
                  className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </form>
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
                  onClick={() => setFormData(prev => ({ ...prev, featured_image: '' }))}
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
                  onClick={(e) => e.stopPropagation()}
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
  );
};

export default ArticleEditor;