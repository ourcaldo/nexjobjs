import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { WordPressService, FilterData } from '@/services/wpService';
import { SupabaseAdminService } from '@/services/supabaseAdminService';
import Header from '@/components/Layout/Header';
import Footer from '@/components/Layout/Footer';
import JobSearchPage from '@/components/pages/JobSearchPage';
import SchemaMarkup from '@/components/SEO/SchemaMarkup';
import { generateBreadcrumbSchema } from '@/utils/schemaUtils';

interface CategoryJobsPageProps {
  category: string;
  categorySlug: string;
  location?: string;
  settings: any;
  currentUrl: string;
}

// Helper function to render dynamic templates
const renderTemplate = (template: string, variables: Record<string, string>): string => {
  let result = template;
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, value);
  });
  return result;
};

export default function CategoryJobs({ category, categorySlug, location, settings, currentUrl }: CategoryJobsPageProps) {
  // Prepare template variables
  const templateVars = {
    kategori: category,
    site_title: settings.site_title,
    lokasi: location || ''
  };

  // Generate dynamic title and description
  const pageTitle = renderTemplate(settings.category_page_title_template, templateVars);
  const pageDescription = renderTemplate(settings.category_page_description_template, templateVars);

  const breadcrumbItems = [
    { label: 'Lowongan Kerja', href: '/lowongan-kerja/' },
    { label: `Kategori: ${category}` }
  ];

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${currentUrl}/lowongan-kerja/kategori/${categorySlug}/`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <link rel="canonical" href={`${currentUrl}/lowongan-kerja/`} />
      </Head>
      
      <SchemaMarkup schema={generateBreadcrumbSchema(breadcrumbItems)} />
      
      <Header />
      <main>
        <JobSearchPage 
          settings={settings} 
          initialCategory={category}
          initialLocation={location}
        />
      </main>
      <Footer />
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ params, query, req }) => {
  const categorySlug = params?.slug as string;
  const location = query?.location as string;
  const settings = await SupabaseAdminService.getSettingsServerSide();
  
  // Get current URL from request headers
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers.host;
  const currentUrl = `${protocol}://${host}`;
  
  if (!categorySlug) {
    return { notFound: true };
  }

  try {
    // Get filter data to find the actual category name
    const currentWpService = new WordPressService();
    currentWpService.setBaseUrl(settings.api_url);
    currentWpService.setFiltersApiUrl(settings.filters_api_url);
    currentWpService.setAuthToken(settings.auth_token || '');
    
    const filterData = await currentWpService.getFiltersData();
    
    // Find matching category by converting slug back to category name
    let matchedCategory = '';
    if (filterData.nexjob_kategori_pekerjaan) {
      matchedCategory = filterData.nexjob_kategori_pekerjaan.find(cat => {
        const catSlug = cat
          .toLowerCase()
          .replace(/[&]/g, '')
          .replace(/[^a-z0-9\s]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');
        return catSlug === categorySlug;
      }) || '';
    }

    if (!matchedCategory) {
      return { notFound: true };
    }

    return {
      props: {
        category: matchedCategory,
        categorySlug,
        location: location || null,
        settings,
        currentUrl
      }
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    return { notFound: true };
  }
};