import { GetServerSideProps } from 'next';
import Head from 'next/head';
import AdminLayout from '@/components/admin/AdminLayout';
import PageEditor from '@/components/admin/cms/PageEditor';

interface EditPageProps {
  pageId: string;
}

export default function EditPage({ pageId }: EditPageProps) {
  return (
    <>
      <Head>
        <title>Edit Page - Nexjob Admin</title>
        <meta name="description" content="Edit page in Nexjob CMS" />
        <meta name="robots" content="noindex, nofollow, noarchive, nosnippet, noimageindex" />
      </Head>
      
      <AdminLayout currentPage="cms">
        <PageEditor pageId={pageId} />
      </AdminLayout>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const pageId = params?.id as string;
  
  return {
    props: {
      pageId
    }
  };
};