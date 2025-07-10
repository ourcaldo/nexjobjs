
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import AdminLayout from '@/components/admin/AdminLayout';
import ArticleEditor from '@/components/admin/cms/ArticleEditor';

interface EditArticleProps {
  articleId: string;
}

export default function EditArticle({ articleId }: EditArticleProps) {
  return (
    <>
      <Head>
        <title>Edit Article - Nexjob Admin</title>
        <meta name="description" content="Edit article for Nexjob CMS" />
        <meta name="robots" content="noindex, nofollow, noarchive, nosnippet, noimageindex" />
      </Head>
      
      <AdminLayout currentPage="cms">
        <ArticleEditor articleId={articleId} />
      </AdminLayout>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const articleId = params?.id as string;
  
  return {
    props: {
      articleId
    }
  };
};
