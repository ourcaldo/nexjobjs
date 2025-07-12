
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { wpService } from '@/services/wpService';
import { SupabaseAdminService } from '@/services/supabaseAdminService';
import { getCurrentDomain } from '@/lib/env';
import Header from '@/components/Layout/Header';
import Footer from '@/components/Layout/Footer';
import ArticlePage from '@/components/pages/ArticlePage';
import SchemaMarkup from '@/components/SEO/SchemaMarkup';
import { generateBreadcrumbSchema } from '@/utils/schemaUtils';

interface CategoryPageProps {
  articles: any[];
  categories: any[];
  tags: any[];
  category: any | null;
  pagination: {
    page: number;
    totalPages: number;
    totalPosts: number;
    hasMore: boolean;
  };
  settings: any;
  error?: string;
}

export default function CategoryPage({ 
  articles, 
  categories, 
  tags, 
  category, 
  pagination, 
  settings, 
  error 
}: CategoryPageProps) {
  const currentUrl = getCurrentDomain();
  
  if (error || !category) {
    return (
      <>
        <Head>
          <title>Kategori Tidak Ditemukan - Nexjob</title>
          <meta name="description" content="Kategori artikel yang Anda cari tidak tersedia." />
          <meta name="robots" content="noindex, nofollow" />
          <link rel="canonical" href={`${currentUrl}/artikel/`} />
        </Head>
        <Header />
        <main>
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">Kategori Tidak Ditemukan</h1>
              <p className="text-gray-600 mb-6">Kategori artikel yang Anda cari tidak tersedia</p>
              <a 
                href="/artikel/"
                className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
              >
                Kembali ke Artikel
              </a>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const pageTitle = `${category.name} - Tips Karir Nexjob`;
  const pageDescription = category.description || `Artikel tips karir dalam kategori ${category.name} dari Nexjob`;
  const canonicalUrl = `${currentUrl}/artikel/${category.slug}/`;

  const breadcrumbItems = [
    { label: 'Tips Karir', href: '/artikel/' },
    { label: category.name }
  ];

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="robots" content="index, follow" />
        
        {/* Open Graph */}
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={settings.default_article_og_image || `${currentUrl}/og-article-default.jpg`} />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={settings.default_article_og_image || `${currentUrl}/og-article-default.jpg`} />
        
        {/* Canonical URL */}
        <link rel="canonical" href={canonicalUrl} />
        
        {/* Pagination */}
        {pagination.page > 1 && (
          <link rel="prev" href={pagination.page === 2 ? canonicalUrl : `${canonicalUrl}?page=${pagination.page - 1}`} />
        )}
        {pagination.hasMore && (
          <link rel="next" href={`${canonicalUrl}?page=${pagination.page + 1}`} />
        )}
      </Head>
      
      <SchemaMarkup schema={generateBreadcrumbSchema(breadcrumbItems)} />
      
      <Header />
      <main>
        <ArticlePage 
          articles={articles}
          categories={categories}
          tags={tags}
          pagination={pagination}
          settings={settings}
          currentCategory={category}
        />
      </main>
      <Footer />
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ params, query }) => {
  const categorySlug = params?.categorySlug as string;
  const page = parseInt(query.page as string) || 1;
  const perPage = 12;
  
  try {
    const [settings, category] = await Promise.all([
      SupabaseAdminService.getSettingsServerSide(),
      wpService.getCategoryBySlug(categorySlug)
    ]);
    
    if (!category) {
      return {
        props: {
          articles: [],
          categories: [],
          tags: [],
          category: null,
          pagination: { page: 1, totalPages: 0, totalPosts: 0, hasMore: false },
          settings,
          error: 'Category not found'
        }
      };
    }
    
    const [articlesData, categoriesData, tagsData] = await Promise.all([
      wpService.getArticlesByCategory(category.id.toString(), page, perPage),
      wpService.getCategories(),
      wpService.getTags()
    ]);
    
    return {
      props: {
        articles: articlesData.articles,
        categories: categoriesData,
        tags: tagsData,
        category,
        pagination: articlesData.pagination,
        settings
      }
    };
  } catch (error) {
    console.error('Error fetching category articles:', error);
    return {
      props: {
        articles: [],
        categories: [],
        tags: [],
        category: null,
        pagination: { page: 1, totalPages: 0, totalPosts: 0, hasMore: false },
        settings: await SupabaseAdminService.getSettingsServerSide(),
        error: 'Failed to load category'
      }
    };
  }
};
