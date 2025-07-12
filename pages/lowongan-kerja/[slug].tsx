
import { GetStaticProps, GetStaticPaths } from 'next';
import Head from 'next/head';
import { WordPressService } from '@/services/wpService';
import { SupabaseAdminService } from '@/services/supabaseAdminService';
import { getCurrentDomain } from '@/lib/env';
import Header from '@/components/Layout/Header';
import Footer from '@/components/Layout/Footer';
import JobDetailPage from '@/components/pages/JobDetailPage';
import SchemaMarkup from '@/components/SEO/SchemaMarkup';
import { generateJobPostingSchema, generateBreadcrumbSchema } from '@/utils/schemaUtils';
import { Job } from '@/types/job';

interface JobPageProps {
  job: Job | null;
  slug: string;
  settings: any;
  currentUrl: string;
}

export default function JobPage({ job, slug, settings, currentUrl }: JobPageProps) {
  if (!job) {
    return (
      <>
        <Head>
          <title>Job Not Found - Nexjob</title>
          <meta name="description" content="The job you're looking for could not be found." />
          <meta name="robots" content="noindex, nofollow" />
        </Head>
        <Header />
        <main className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Job Not Found</h1>
            <p className="text-gray-600 mb-8">The job you're looking for could not be found.</p>
            <a href="/lowongan-kerja/" className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors">
              Browse All Jobs
            </a>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const pageTitle = job.seo_title || `${job.title} - ${job.company_name} | Nexjob`;
  const pageDescription = job.seo_description || `Lowongan ${job.title} di ${job.company_name}, ${job.lokasi_kota}. Gaji: ${job.gaji}. Lamar sekarang!`;
  const canonicalUrl = `${currentUrl}/lowongan-kerja/${slug}/`;
  const ogImage = settings.default_job_og_image || `${currentUrl}/og-job-default.jpg`;

  const breadcrumbItems = [
    { label: 'Lowongan Kerja', href: '/lowongan-kerja/' },
    { label: job.title }
  ];

  const jobSchema = generateJobPostingSchema(job);
  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbItems);

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="keywords" content={`${job.title}, ${job.company_name}, ${job.lokasi_kota}, ${job.kategori}, lowongan kerja`} />
        <meta name="robots" content="index, follow" />
        
        {/* Open Graph */}
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:site_name" content="Nexjob" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={ogImage} />
        
        {/* Additional SEO */}
        <meta name="author" content="Nexjob" />
        <meta property="article:published_time" content={job.post_date} />
        <meta property="article:modified_time" content={job.post_date} />
        <meta property="article:section" content={job.kategori} />
        <meta property="article:tag" content={job.kategori} />
        
        {/* Canonical URL */}
        <link rel="canonical" href={canonicalUrl} />
      </Head>
      
      <SchemaMarkup schema={[jobSchema, breadcrumbSchema]} />
      
      <Header />
      <main>
        <JobDetailPage job={job} slug={slug} settings={settings} />
      </main>
      <Footer />
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params?.slug as string;
  
  try {
    const [job, settings] = await Promise.all([
      WordPressService.getJobBySlug(slug),
      SupabaseAdminService.getSettingsServerSide()
    ]);

    const currentUrl = getCurrentDomain();

    if (!job) {
      return {
        props: {
          job: null,
          slug,
          settings,
          currentUrl
        },
        revalidate: 3600, // 1 hour
      };
    }

    return {
      props: {
        job,
        slug,
        settings,
        currentUrl
      },
      revalidate: 3600, // 1 hour
    };
  } catch (error) {
    console.error('Error fetching job:', error);
    return {
      props: {
        job: null,
        slug,
        settings: {},
        currentUrl: getCurrentDomain()
      },
      revalidate: 3600,
    };
  }
};

export const getStaticPaths: GetStaticPaths = async () => {
  try {
    // Get some popular jobs for initial static generation
    const jobs = await WordPressService.getJobs(1, 50); // Get first 50 jobs
    const paths = jobs.map(job => ({
      params: { slug: job.slug }
    }));

    return {
      paths,
      fallback: 'blocking' // Generate other pages on-demand
    };
  } catch (error) {
    console.error('Error generating static paths:', error);
    return {
      paths: [],
      fallback: 'blocking'
    };
  }
};
