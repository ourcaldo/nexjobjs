import { GetStaticProps } from 'next';
import Head from 'next/head';
import { WordPressService, FilterData } from '@/services/wpService';
import { SupabaseAdminService } from '@/services/supabaseAdminService';
import { getCurrentDomain } from '@/lib/env';
import Header from '@/components/Layout/Header';
import Footer from '@/components/Layout/Footer';
import HomePage from '@/components/pages/HomePage';
import SchemaMarkup from '@/components/SEO/SchemaMarkup';
import { generateWebsiteSchema, generateOrganizationSchema } from '@/utils/schemaUtils';

interface HomePageProps {
  articles: any[];
  filterData: FilterData | null;
  settings: any;
}

export default function Home({ articles, filterData, settings }: HomePageProps) {
  const currentUrl = getCurrentDomain();
  const pageTitle = `${settings.site_title} - ${settings.site_tagline}`;

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={settings.site_description} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={settings.site_description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${currentUrl}/`} />
        <meta property="og:image" content={settings.home_og_image || `${currentUrl}/og-home.jpg`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={settings.site_description} />
        <meta name="twitter:image" content={settings.home_og_image || `${currentUrl}/og-home.jpg`} />
        <link rel="canonical" href={`${currentUrl}/`} />
      </Head>
      
      <SchemaMarkup schema={generateWebsiteSchema(settings)} />
      <SchemaMarkup schema={generateOrganizationSchema()} />
      
      <Header />
      <main>
        <HomePage 
          initialArticles={articles} 
          initialFilterData={filterData}
          settings={settings}
        />
      </main>
      <Footer />
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  try {
    const settings = await SupabaseAdminService.getSettingsServerSide();
    
    // Create isolated wpService instance for this request
    const currentWpService = new WordPressService();
    currentWpService.setBaseUrl(settings.api_url);
    currentWpService.setFiltersApiUrl(settings.filters_api_url);
    currentWpService.setAuthToken(settings.auth_token || '');
    
    // Fetch data
    const [articles, filterData] = await Promise.all([
      currentWpService.getArticles(3),
      currentWpService.getFiltersData()
    ]);

    return {
      props: {
        articles,
        filterData,
        settings
      },
      revalidate: 86400, // ISR: Revalidate every 24 hours
    };
  } catch (error) {
    console.error('Error in getStaticProps:', error);
    
    return {
      props: {
        articles: [],
        filterData: null,
        settings: await SupabaseAdminService.getSettingsServerSide()
      },
      revalidate: 300, // ISR: Retry in 5 minutes on error
    };
  }
};