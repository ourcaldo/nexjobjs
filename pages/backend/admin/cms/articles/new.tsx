
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import AdminLayout from '@/components/admin/AdminLayout';
import ArticleEditor from '@/components/admin/cms/ArticleEditor';

export default function NewArticle() {
  return (
    <>
      <Head>
        <title>New Article - Nexjob Admin</title>
        <meta name="description" content="Create new article for Nexjob CMS" />
        <meta name="robots" content="noindex, nofollow, noarchive, nosnippet, noimageindex" />
      </Head>
      
      <AdminLayout currentPage="cms">
        <ArticleEditor />
      </AdminLayout>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {}
  };
};
