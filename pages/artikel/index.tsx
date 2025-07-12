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
import { renderTemplate } from '@/utils/templateUtils';

interface ArticleIndexPageProps {
  initialArticles: any[];
  settings: any;
  totalArticles: number;
}

export default function ArticleIndexPage({ initialArticles, settings, totalArticles }: ArticleIndexPageProps) {
  const currentUrl = getCurrentDomain();
  const pageTitle = renderTemplate(settings.article_listing_title || 'Tips Karir dan Artikel Terbaru - Nexjob', {});
  const pageDescription = renderTemplate(settings.article_listing_description || 'Baca tips karir, panduan interview, dan artikel terbaru untuk mengembangkan karir Anda. Temukan {total_articles} artikel berguna di Nexjob!', {
    total_articles: totalArticles.toLocaleString()
  });
  const canonicalUrl = `${currentUrl}/artikel/`;

  const breadcrumbItems = [
    { label: 'Tips Karir', href: '/artikel/' }
  ];

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="robots" content="index, follow" />
        <meta name="keywords" content="tips karir, panduan interview, artikel karir, career advice, job tips" />

        {/* Open Graph */}
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={settings.default_article_listing_og_image || `${currentUrl}/og-article-listing.jpg`} />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={settings.default_article_listing_og_image || `${currentUrl}/og-article-listing.jpg`} />

        {/* Canonical URL */}
        <link rel="canonical" href={canonicalUrl} />
      </Head>

      <SchemaMarkup schema={generateBreadcrumbSchema(breadcrumbItems)} />

      <Header />
      <main>
        <ArticlePage 
          initialArticles={initialArticles}
          settings={settings}
          totalArticles={totalArticles}
        />
      </main>
      <Footer />
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    const [settings, articlesResponse] = await Promise.all([
      SupabaseAdminService.getSettingsServerSide(),
      wpService.getArticles(1, 12)
    ]);

    return {
      props: {
        initialArticles: articlesResponse.articles,
        settings,
        totalArticles: articlesResponse.total
      }
    };
  } catch (error) {
    console.error('Error fetching article listing data:', error);
    return {
      props: {
        initialArticles: [],
        settings: await SupabaseAdminService.getSettingsServerSide(),
        totalArticles: 0
      }
    };
  }
};