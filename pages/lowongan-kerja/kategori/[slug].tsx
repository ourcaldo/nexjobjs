import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { WordPressService, FilterData } from '@/services/wpService';
import { SupabaseAdminService } from '@/services/supabaseAdminService';
import Header from '@/components/Layout/Header';
import Footer from '@/components/Layout/Footer';
import JobSearchPage from '@/components/pages/JobSearchPage';
import SchemaMarkup from '@/components/SEO/SchemaMarkup';
import { generateBreadcrumbSchema } from '@/utils/schemaUtils';
import { getCurrentDomain } from '@/lib/env';
import { wpCategoryMappings } from '@/utils/urlUtils';
import { renderTemplate } from '@/utils/templateUtils';

interface CategoryJobsPageProps {
  category: string;
  categorySlug: string;
  location?: string;
  settings: any;
  currentUrl: string;
}

export default function CategoryJobs({ category, categorySlug, location, settings, currentUrl }: CategoryJobsPageProps) {
  // Prepare template variables
  const templateVars = {
    kategori: category,
    site_title: settings.site_title,
    lokasi: location || ''
  };

  // Generate dynamic title and description
  const pageTitle = renderTemplate(settings.category_page_title_template || 'Lowongan Kerja {{kategori}} - {{site_title}}', templateVars);
  const pageDescription = renderTemplate(settings.category_page_description_template || 'Temukan lowongan kerja {{kategori}} terbaru. Dapatkan pekerjaan impian Anda dengan gaji terbaik di {{site_title}}.', templateVars);

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
        <link rel="canonical" href={`${currentUrl}/lowongan-kerja/kategori/${categorySlug}/`} />
      </Head>

      <SchemaMarkup schema={generateBreadcrumbSchema(breadcrumbItems)} />

      <Header />
      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <nav className="mb-8">
              <ol className="flex items-center justify-center space-x-2 text-sm text-primary-100">
                <li className="flex items-center">
                  <span className="text-white">Home</span>
                  <span className="mx-2">/</span>
                  <span className="text-white">Lowongan Kerja</span>
                  <span className="mx-2">/</span>
                  <span className="text-white">Kategori: {category}</span>
                </li>
              </ol>
            </nav>

            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                {pageTitle.replace(` - ${templateVars.site_title}`, '') || `Lowongan Kerja ${category}`}
              </h1>
              <p className="text-xl text-primary-100 max-w-3xl mx-auto leading-relaxed">
                {pageDescription}
              </p>
            </div>
          </div>
        </div>

        {/* Job Search Content */}
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