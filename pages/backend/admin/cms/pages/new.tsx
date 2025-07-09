import { GetServerSideProps } from 'next';
import Head from 'next/head';
import AdminLayout from '@/components/admin/AdminLayout';
import PageEditor from '@/components/admin/cms/PageEditor';

export default function NewPage() {
  return (
    <>
      <Head>
        <title>Add New Page - Nexjob Admin</title>
        <meta name="description" content="Add new page to Nexjob CMS" />
        <meta name="robots" content="noindex, nofollow, noarchive, nosnippet, noimageindex" />
      </Head>
      
      <AdminLayout currentPage="cms">
        <PageEditor />
      </AdminLayout>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {}
  };
};