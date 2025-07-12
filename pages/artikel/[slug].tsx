
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { wpService } from '@/services/wpService';
import { SupabaseAdminService } from '@/services/supabaseAdminService';
import { getCurrentDomain } from '@/lib/env';
import Header from '@/components/Layout/Header';
import Footer from '@/components/Layout/Footer';
import ArticleDetailPage from '@/components/pages/ArticleDetailPage';
import SchemaMarkup from '@/components/SEO/SchemaMarkup';
import { generateArticleSchema, generateBreadcrumbSchema } from '@/utils/schemaUtils';

interface ArticlePageProps {
  article: any | null;
  relatedArticles: any[];
  settings: any;
  error?: string;
}

export default function ArticlePage({ article, relatedArticles, settings, error }: ArticlePageProps) {
  const currentUrl = getCurrentDomain();
  
  if (error || !article) {
    return (
      <>
        <Head>
          <title>Artikel Tidak Ditemukan - Nexjob</title>
          <meta name="description" content="Artikel yang Anda cari tidak tersedia." />
          <meta name="robots" content="noindex, nofollow" />
          <link rel="canonical" href={`${currentUrl}/artikel/`} />
        </Head>
        <Header />
        <main>
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">Artikel Tidak Ditemukan</h1>
              <p className="text-gray-600 mb-6">Artikel yang Anda cari tidak tersedia</p>
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

  const pageTitle = article.seo_title || `${article.title.rendered} - Nexjob`;
  const pageDescription = article.seo_description || article.excerpt?.rendered?.replace(/<[^>]*>/g, '').slice(0, 160) || 'Artikel tips karir dari Nexjob';
  const canonicalUrl = `${currentUrl}/artikel/${article.slug}/`;
  const ogImage = article.featured_media_url || settings.default_article_og_image || `${currentUrl}/og-article-default.jpg`;

  const breadcrumbItems = [
    { label: 'Tips Karir', href: '/artikel/' },
    { label: article.title.rendered }
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
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={ogImage} />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={ogImage} />
        
        {/* Canonical URL */}
        <link rel="canonical" href={canonicalUrl} />
        
        {/* Additional meta tags */}
        <meta name="keywords" content={article.tags_info?.map((tag: any) => tag.name).join(', ') || 'tips karir, panduan karir'} />
        <meta name="author" content={article.author_info?.display_name || 'Nexjob'} />
        <meta property="article:published_time" content={article.date} />
        <meta property="article:modified_time" content={article.modified} />
        <meta property="article:section" content={article.categories_info?.[0]?.name || 'Article'} />
        {article.tags_info?.map((tag: any) => (
          <meta key={tag.id} property="article:tag" content={tag.name} />
        ))}
      </Head>
      
      <SchemaMarkup schema={generateArticleSchema(article)} />
      <SchemaMarkup schema={generateBreadcrumbSchema(breadcrumbItems)} />
      
      <Header />
      <main>
        <ArticleDetailPage 
          article={article}
          relatedArticles={relatedArticles}
          settings={settings}
        />
      </main>
      <Footer />
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const slug = params?.slug as string;
  
  try {
    const [settings, article] = await Promise.all([
      SupabaseAdminService.getSettingsServerSide(),
      wpService.getArticleBySlug(slug)
    ]);
    
    if (!article) {
      return {
        props: {
          article: null,
          relatedArticles: [],
          settings,
          error: 'Article not found'
        }
      };
    }
    
    // Get related articles
    const relatedArticles = await wpService.getRelatedArticles(article.id.toString(), 3);
    
    return {
      props: {
        article,
        relatedArticles,
        settings
      }
    };
  } catch (error) {
    console.error('Error fetching article:', error);
    return {
      props: {
        article: null,
        relatedArticles: [],
        settings: await SupabaseAdminService.getSettingsServerSide(),
        error: 'Failed to load article'
      }
    };
  }
};
