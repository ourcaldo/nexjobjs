// pages/artikel/[category]/[slug].tsx

import { GetServerSideProps, GetServerSideContext } from 'next';
import { ParsedUrlQuery } from 'querystring';

interface Params extends ParsedUrlQuery {
  categorySlug: string;
  slug: string;
}

interface Props {
  categorySlug: string;
  slug: string;
}

const ArticlePage: React.FC<Props> = ({ categorySlug, slug }) => {
  return (
    <div>
      <h1>Article</h1>
      <p>Category: {categorySlug}</p>
      <p>Slug: {slug}</p>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps<Props, Params> = async (context) => {
  const { params } = context;
  const categorySlug = params?.categorySlug as string;
  const slug = params?.slug as string;

  return {
    props: {
      categorySlug,
      slug,
    },
  };
};

export default ArticlePage;