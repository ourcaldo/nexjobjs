import { GetStaticProps } from 'next';
import Head from 'next/head';
import { WordPressService, FilterData } from '@/services/wpService';
import { SupabaseAdminService } from '@/services/supabaseAdminService';
import { getCurrentDomain } from '@/lib/env';
import Header from '@/components/Layout/Header';
import Footer from '@/components/Layout/Footer';
import JobSearchPage from '@/components/pages/JobSearchPage';
import SchemaMarkup from '@/components/SEO/SchemaMarkup';
import { generateJobListingSchema, generateBreadcrumbSchema } from '@/utils/schemaUtils';
import { renderTemplate } from '@/utils/templateUtils';

interface JobsPageProps {
  settings: any;
  currentUrl: string;
}

export default function Jobs({ settings, currentUrl }: JobsPageProps) {
  const breadcrumbItems = [{ label: 'Lowongan Kerja' }];

  return (
    <>
      <Head>
        <title>{settings.jobs_title}</title>
        <meta name="description" content={settings.jobs_description} />
        <meta property="og:title" content={settings.jobs_title} />
        <meta property="og:description" content={settings.jobs_description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${currentUrl}/lowongan-kerja/`} />
        <meta property="og:image" content={settings.jobs_og_image || `${currentUrl}/og-jobs.jpg`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={settings.jobs_title} />
        <meta name="twitter:description" content={settings.jobs_description} />
        <meta name="twitter:image" content={settings.jobs_og_image || `${currentUrl}/og-jobs.jpg`} />
        <link rel="canonical" href={`${currentUrl}/lowongan-kerja/`} />
      </Head>

      <SchemaMarkup schema={generateBreadcrumbSchema(breadcrumbItems)} />

      <Header />
      <main>
        <JobSearchPage settings={settings} />
      </main>
      <Footer />
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const settings = await SupabaseAdminService.getSettingsServerSide();
  const currentUrl = getCurrentDomain();

  // Prepare template variables
  const templateVars = {
    site_title: settings?.site_title || 'Nexjob',
    lokasi: '',
    kategori: ''
  };

  // Get SEO settings with template rendering
  const rawSeoTitle = settings?.jobs_title || 'Lowongan Kerja Terbaru - {{site_title}}';
  const rawSeoDescription = settings?.jobs_description || 'Temukan lowongan kerja terbaru dari berbagai perusahaan terpercaya. Dapatkan pekerjaan impian Anda dengan gaji terbaik.';

  const seoTitle = renderTemplate(rawSeoTitle, templateVars);
  const seoDescription = renderTemplate(rawSeoDescription, templateVars);

  return {
    props: {
      settings,
      currentUrl
    },
    revalidate: 300, // Revalidate every 5 minutes
  };
};