
import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET requests for public data
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Use public/anon client for public data access
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase
      .from('admin_settings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching public settings:', error);
      return res.status(500).json({ error: 'Failed to fetch settings' });
    }

    // If no settings found, return null (client will use defaults)
    if (!data || error?.code === 'PGRST116') {
      return res.status(200).json({ data: null });
    }

    // Only return public-safe fields (exclude sensitive data like API keys, tokens, storage keys)
    const publicSettings = {
      site_title: data.site_title,
      site_tagline: data.site_tagline,
      site_description: data.site_description,
      site_url: data.site_url,
      // SEO Templates
      location_page_title_template: data.location_page_title_template,
      location_page_description_template: data.location_page_description_template,
      category_page_title_template: data.category_page_title_template,
      category_page_description_template: data.category_page_description_template,
      // Archive Page SEO
      jobs_title: data.jobs_title,
      jobs_description: data.jobs_description,
      articles_title: data.articles_title,
      articles_description: data.articles_description,
      // Auth Pages SEO
      login_page_title: data.login_page_title,
      login_page_description: data.login_page_description,
      signup_page_title: data.signup_page_title,
      signup_page_description: data.signup_page_description,
      profile_page_title: data.profile_page_title,
      profile_page_description: data.profile_page_description,
      // SEO Images
      home_og_image: data.home_og_image,
      jobs_og_image: data.jobs_og_image,
      articles_og_image: data.articles_og_image,
      default_job_og_image: data.default_job_og_image,
      default_article_og_image: data.default_article_og_image,
      // Public sitemap settings
      auto_generate_sitemap: data.auto_generate_sitemap,
      robots_txt: data.robots_txt,
      // Advertisement settings (public for display)
      popup_ad_url: data.popup_ad_url,
      popup_ad_enabled: data.popup_ad_enabled,
      popup_ad_load_settings: data.popup_ad_load_settings,
      popup_ad_max_executions: data.popup_ad_max_executions,
      popup_ad_device: data.popup_ad_device,
      sidebar_archive_ad_code: data.sidebar_archive_ad_code,
      sidebar_single_ad_code: data.sidebar_single_ad_code,
      single_top_ad_code: data.single_top_ad_code,
      single_bottom_ad_code: data.single_bottom_ad_code,
      single_middle_ad_code: data.single_middle_ad_code
    };

    return res.status(200).json({ data: publicSettings });
  } catch (error) {
    console.error('Public settings API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
