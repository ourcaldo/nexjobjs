
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { WordPressService } from '@/services/wpService';
import { SupabaseAdminService } from '@/services/supabaseAdminService';
import { Job } from '@/types/job';
import Header from '@/components/Layout/Header';
import Footer from '@/components/Layout/Footer';
import JobDetailPage from '@/components/pages/JobDetailPage';
import SchemaMarkup from '@/components/SEO/SchemaMarkup';
import { generateJobPostingSchema, generateBreadcrumbSchema } from '@/utils/schemaUtils';
import { getCurrentDomain } from '@/lib/env';

interface JobPageProps {
  job: Job | null;
  relatedJobs: Job[];
  settings: any;
  error?: string;
}

export default function JobPage({ job, relatedJobs, settings, error }: JobPageProps) {
  const currentUrl = getCurrentDomain();
  
  if (error || !job) {
    return (
      <>
        <Head>
          <title>Lowongan Tidak Ditemukan - Nexjob</title>
          <meta name="description" content="Lowongan kerja yang Anda cari tidak tersedia." />
          <meta name="robots" content="noindex, nofollow" />
          <link rel="canonical" href={`${currentUrl}/lowongan-kerja/`} />
        </Head>
        <Header />
        <main>
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">Lowongan Tidak Ditemukan</h1>
              <p className="text-gray-600 mb-6">Lowongan yang Anda cari tidak tersedia</p>
              <a 
                href="/lowongan-kerja/"
                className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
              >
                Kembali ke Pencarian
              </a>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const pageTitle = job.seo_title || `${job.title} - ${job.company_name} | Nexjob`;
  const pageDescription = job.seo_description || `Lowongan ${job.title} di ${job.company_name}, ${job.lokasi_kota}. Gaji: ${job.gaji}. Lamar sekarang!`;
  const canonicalUrl = `${currentUrl}/lowongan-kerja/${job.slug}/`;
  const ogImage = settings.default_job_og_image || `${currentUrl}/og-job-default.jpg`;

  const breadcrumbItems = [
    { label: 'Lowongan Kerja', href: '/lowongan-kerja/' },
    { label: job.title }
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
        <meta name="keywords" content={`${job.title}, ${job.company_name}, ${job.lokasi_kota}, ${job.kategori_pekerjaan}, lowongan kerja`} />
        <meta name="author" content="Nexjob" />
        <meta property="article:published_time" content={job.created_at} />
        <meta property="article:section" content={job.kategori_pekerjaan} />
        <meta property="article:tag" content={job.kategori_pekerjaan} />
      </Head>
      
      <SchemaMarkup schema={generateJobPostingSchema(job)} />
      <SchemaMarkup schema={generateBreadcrumbSchema(breadcrumbItems)} />
      
      <Header />
      <main>
        <JobDetailPage job={job} relatedJobs={relatedJobs} settings={settings} />
      </main>
      <Footer />
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const slug = params?.slug as string;
  
  try {
    const [settings, job] = await Promise.all([
      SupabaseAdminService.getSettingsServerSide(),
      WordPressService.getJobBySlug(slug)
    ]);
    
    if (!job) {
      return {
        props: {
          job: null,
          relatedJobs: [],
          settings,
          error: 'Job not found'
        }
      };
    }
    
    // Get related jobs
    const relatedJobs = await WordPressService.getRelatedJobs(job.id, job.kategori_pekerjaan, 4);
    
    return {
      props: {
        job,
        relatedJobs,
        settings
      }
    };
  } catch (error) {
    console.error('Error fetching job:', error);
    return {
      props: {
        job: null,
        relatedJobs: [],
        settings: await SupabaseAdminService.getSettingsServerSide(),
        error: 'Failed to load job'
      }
    };
  }
};
