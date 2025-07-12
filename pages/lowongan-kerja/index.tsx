
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { WordPressService, FilterData } from '@/services/wpService';
import { SupabaseAdminService } from '@/services/supabaseAdminService';
import { getCurrentDomain } from '@/lib/env';
import { Job } from '@/types/job';
import Header from '@/components/Layout/Header';
import Footer from '@/components/Layout/Footer';
import JobSearchPage from '@/components/pages/JobSearchPage';
import SchemaMarkup from '@/components/SEO/SchemaMarkup';
import { generateJobListingSchema, generateBreadcrumbSchema } from '@/utils/schemaUtils';
import { renderTemplate } from '@/utils/templateUtils';

interface JobIndexPageProps {
  initialJobs: Job[];
  initialFilterData: FilterData;
  settings: any;
  totalJobs: number;
}

export default function JobIndexPage({ initialJobs, initialFilterData, settings, totalJobs }: JobIndexPageProps) {
  const currentUrl = getCurrentDomain();
  const pageTitle = renderTemplate(settings.job_listing_title || 'Lowongan Kerja Terbaru dan Terpercaya - Nexjob', {});
  const pageDescription = renderTemplate(settings.job_listing_description || 'Temukan lowongan kerja terbaru dan terpercaya di Nexjob. Dengan lebih dari {total_jobs} lowongan tersedia, raih karir impianmu sekarang!', {
    total_jobs: totalJobs.toLocaleString()
  });
  const canonicalUrl = `${currentUrl}/lowongan-kerja/`;

  const breadcrumbItems = [
    { label: 'Lowongan Kerja', href: '/lowongan-kerja/' }
  ];

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="robots" content="index, follow" />
        <meta name="keywords" content="lowongan kerja, loker, karir, pekerjaan, jobs, Indonesia" />
        
        {/* Open Graph */}
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={settings.default_job_listing_og_image || `${currentUrl}/og-job-listing.jpg`} />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={settings.default_job_listing_og_image || `${currentUrl}/og-job-listing.jpg`} />
        
        {/* Canonical URL */}
        <link rel="canonical" href={canonicalUrl} />
      </Head>

      <SchemaMarkup schema={generateJobListingSchema(initialJobs)} />
      <SchemaMarkup schema={generateBreadcrumbSchema(breadcrumbItems)} />

      <Header />
      <main>
        <JobSearchPage 
          initialJobs={initialJobs}
          initialFilterData={initialFilterData}
          settings={settings}
          totalJobs={totalJobs}
        />
      </main>
      <Footer />
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ query }) => {
  try {
    const [settings, filterData] = await Promise.all([
      SupabaseAdminService.getSettingsServerSide(),
      WordPressService.getFiltersData()
    ]);

    // Get initial jobs
    const initialJobsResponse = await WordPressService.getJobs({}, 1, 12);
    
    return {
      props: {
        initialJobs: initialJobsResponse.jobs,
        initialFilterData: filterData,
        settings,
        totalJobs: initialJobsResponse.total
      }
    };
  } catch (error) {
    console.error('Error fetching job listing data:', error);
    return {
      props: {
        initialJobs: [],
        initialFilterData: null,
        settings: await SupabaseAdminService.getSettingsServerSide(),
        totalJobs: 0
      }
    };
  }
};
