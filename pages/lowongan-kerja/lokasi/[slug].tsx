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
import { wpLocationMappings } from '@/utils/urlUtils';
import { renderTemplate } from '@/utils/templateUtils';

interface LocationJobsPageProps {
  location: string;
  locationSlug: string;
  locationType: 'province' | 'city';
  category?: string;
  settings: any;
  currentUrl: string;
}

export default function LocationJobs({ location, locationSlug, locationType, category, settings, currentUrl }: LocationJobsPageProps) {
  // Prepare template variables
  const templateVars = {
    lokasi: location,
    site_title: settings.site_title,
    kategori: category || ''
  };

  // Generate dynamic title and description
  const pageTitle = renderTemplate(settings.location_page_title_template, templateVars);
  const pageDescription = renderTemplate(settings.location_page_description_template, templateVars);

  const breadcrumbItems = [
    { label: 'Lowongan Kerja', href: '/lowongan-kerja/' },
    { label: `Lokasi: ${location}` }
  ];

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${currentUrl}/lowongan-kerja/lokasi/${locationSlug}/`} />
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
          initialLocation={location}
          initialCategory={category}
          locationType={locationType}
        />
      </main>
      <Footer />
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ params, query, req }) => {
  const locationSlug = params?.slug as string;
  const category = query?.category as string;
  const settings = await SupabaseAdminService.getSettingsServerSide();

  // Get current URL from request headers
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers.host;
  const currentUrl = `${protocol}://${host}`;

  if (!locationSlug) {
    return { notFound: true };
  }

  try {
    // Get filter data to find the actual location name
    const currentWpService = new WordPressService();
    currentWpService.setBaseUrl(settings.api_url);
    currentWpService.setFiltersApiUrl(settings.filters_api_url);
    currentWpService.setAuthToken(settings.auth_token || '');

    const filterData = await currentWpService.getFiltersData();

    let matchedLocation = '';
    let locationType: 'province' | 'city' = 'city';

    if (filterData.nexjob_lokasi_provinsi) {
      // First check if it's a province
      const provinces = Object.keys(filterData.nexjob_lokasi_provinsi);
      matchedLocation = provinces.find(province => {
        const provinceSlug = province
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');
        return provinceSlug === locationSlug;
      }) || '';

      if (matchedLocation) {
        locationType = 'province';
      } else {
        // Check if it's a city
        for (const [province, cities] of Object.entries(filterData.nexjob_lokasi_provinsi)) {
          const foundCity = cities.find(city => {
            const citySlug = city
              .toLowerCase()
              .replace(/[^a-z0-9\s]/g, '')
              .replace(/\s+/g, '-')
              .replace(/-+/g, '-')
              .replace(/^-|-$/g, '');
            return citySlug === locationSlug;
          });

          if (foundCity) {
            matchedLocation = foundCity;
            locationType = 'city';
            break;
          }
        }
      }
    }

    if (!matchedLocation) {
      return { notFound: true };
    }

    return {
      props: {
        location: matchedLocation,
        locationSlug,
        locationType,
        category: category || null,
        settings,
        currentUrl
      }
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    return { notFound: true };
  }
};