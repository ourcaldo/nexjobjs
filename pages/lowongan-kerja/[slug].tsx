import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { SupabaseAdminService } from '@/services/supabaseAdminService';
import Header from '@/components/Layout/Header';
import Footer from '@/components/Layout/Footer';
import JobDetailPage from '@/components/pages/JobDetailPage';
import SchemaMarkup from '@/components/SEO/SchemaMarkup';
import { generateBreadcrumbSchema } from '@/utils/schemaUtils';

interface JobPageProps {
  slug: string;
  settings: any;
}

export default function JobPage({ slug, settings }: JobPageProps) {
  const breadcrumbItems = [
    { label: 'Lowongan Kerja', href: '/lowongan-kerja/' },
    { label: 'Loading...' }
  ];

  return (
    <>
      <Head>
        <title>Loading Job... - Nexjob</title>
        <meta name="description" content="Loading job details..." />
        <meta name="robots" content="noindex, nofollow" />
        <meta property="og:image" content={settings.default_job_og_image || `${process.env.NEXT_PUBLIC_SITE_URL}/og-job-default.jpg`} />
        <meta name="twitter:image" content={settings.default_job_og_image || `${process.env.NEXT_PUBLIC_SITE_URL}/og-job-default.jpg`} />
      </Head>
      
      <SchemaMarkup schema={generateBreadcrumbSchema(breadcrumbItems)} />
      
      <Header />
      <main>
        <JobDetailPage slug={slug} settings={settings} />
      </main>
      <Footer />
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const slug = params?.slug as string;
  const settings = await SupabaseAdminService.getSettingsServerSide();
  
  return {
    props: {
      slug,
      settings
    }
  };
};