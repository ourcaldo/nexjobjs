import { GetServerSideProps } from 'next';
import Head from 'next/head';
import AdminLayout from '@/components/admin/AdminLayout';
import WordPressSettings from '@/components/admin/WordPressSettings';

export default function AdminWordPress() {
  return (
    <>
      <Head>
        <title>WordPress Settings - Nexjob Admin</title>
        <meta name="description" content="Configure WordPress API settings for Nexjob" />
        <meta name="robots" content="noindex, nofollow, noarchive, nosnippet, noimageindex" />
      </Head>
      
      <AdminLayout currentPage="wordpress">
        <WordPressSettings />
      </AdminLayout>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {}
  };
};