import { GetServerSideProps } from 'next';
import { sitemapService } from '@/services/sitemapService';
import { supabaseAdminService } from '@/services/supabaseAdminService';

const SitemapXml = () => null;

export const getServerSideProps: GetServerSideProps = async ({ res, query }) => {
  try {
    // Generate main sitemap index with ISR-like caching
    const sitemap = await sitemapService.generateMainSitemapIndex();

    // Update last generation timestamp only if not using cache
    if (!query.force) {
      await supabaseAdminService.updateLastSitemapGeneration();
    }

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400'); // ISR-like caching
    res.write(sitemap);
    res.end();
  } catch (error) {
    console.error('Error generating main sitemap:', error);
    res.statusCode = 500;
    res.end('Error generating sitemap');
  }

  return { props: {} };
};

export default SitemapXml;