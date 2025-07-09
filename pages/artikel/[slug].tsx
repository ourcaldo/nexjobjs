import { GetServerSideProps } from 'next';
import { SupabaseAdminService } from '@/services/supabaseAdminService';
import Header from '@/components/Layout/Header';
import Footer from '@/components/Layout/Footer';
import ArticleDetailPage from '@/components/pages/ArticleDetailPage';

interface ArticlePageProps {
  slug: string;
  settings: any;
}

export default function ArticlePage({ slug, settings }: ArticlePageProps) {
  return (
    <>
      <Header />
      <main>
        <ArticleDetailPage slug={slug} settings={settings} />
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