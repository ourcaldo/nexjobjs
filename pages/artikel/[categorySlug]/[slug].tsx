export const getServerSideProps: GetServerSideProps = async ({ params, query, req }) => {
  const categorySlug = params?.categorySlug as string;
  const articleSlug = params?.slug as string;
};