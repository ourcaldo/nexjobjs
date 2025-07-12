import { supabase, createServerSupabaseClient, AdminSettings, Profile } from '@/lib/supabase';
import { env } from '@/lib/env';

export class SupabaseAdminService {
  private defaultSettings: Omit<AdminSettings, 'id' | 'created_at' | 'updated_at'> = {
    api_url: env.WP_API_URL,
    filters_api_url: env.WP_FILTERS_API_URL,
    auth_token: env.WP_AUTH_TOKEN,
    site_title: env.SITE_NAME,
    site_tagline: 'Find Your Dream Job',
    site_description: env.SITE_DESCRIPTION,
    site_url: env.SITE_URL,
    ga_id: env.GA_ID || '',
    gtm_id: env.GTM_ID || '',
    // Supabase Storage Configuration
    supabase_storage_endpoint: 'https://uzlzyosmbxgghhmafidk.supabase.co/storage/v1/s3',
    supabase_storage_region: 'ap-southeast-1',
    supabase_storage_access_key: '642928fa32b65d648ce65ea04c64100e',
    supabase_storage_secret_key: '082c3ce06c08ba1b347af99f16ff634fd12b4949a6cdda16df30dcc5741609dc',
    // WordPress API Configuration
    wp_posts_api_url: 'https://cms.nexjob.tech/wp-json/wp/v2/posts',
    wp_jobs_api_url: 'https://cms.nexjob.tech/wp-json/wp/v2/lowongan-kerja',
    wp_auth_token: env.WP_AUTH_TOKEN,
    // Dynamic SEO Templates
    location_page_title_template: 'Lowongan Kerja di {{lokasi}} - {{site_title}}',
    location_page_description_template: 'Temukan lowongan kerja terbaru di {{lokasi}}. Dapatkan pekerjaan impian Anda dengan gaji terbaik di {{site_title}}.',
    category_page_title_template: 'Lowongan Kerja {{kategori}} - {{site_title}}',
    category_page_description_template: 'Temukan lowongan kerja {{kategori}} terbaru. Dapatkan pekerjaan impian Anda dengan gaji terbaik di {{site_title}}.',
    // Archive Page SEO Settings
    jobs_title: 'Lowongan Kerja Terbaru - {{site_title}}',
    jobs_description: 'Temukan lowongan kerja terbaru dari berbagai perusahaan terpercaya. Dapatkan pekerjaan impian Anda dengan gaji terbaik.',
    articles_title: 'Tips Karir & Panduan Kerja - {{site_title}}',
    articles_description: 'Artikel dan panduan karir terbaru untuk membantu perjalanan karir Anda. Tips interview, CV, dan pengembangan karir.',
    // Auth Pages SEO
    login_page_title: 'Login - {{site_title}}',
    login_page_description: 'Masuk ke akun Nexjob Anda untuk mengakses fitur lengkap pencarian kerja dan menyimpan lowongan favorit.',
    signup_page_title: 'Daftar Akun - {{site_title}}',
    signup_page_description: 'Daftar akun gratis di Nexjob untuk menyimpan lowongan favorit dan mendapatkan notifikasi pekerjaan terbaru.',
    profile_page_title: 'Profil Saya - {{site_title}}',
    profile_page_description: 'Kelola profil dan preferensi akun Nexjob Anda.',
    // SEO Images
    home_og_image: `${env.SITE_URL}/og-home.jpg`,
    jobs_og_image: `${env.SITE_URL}/og-jobs.jpg`,
    articles_og_image: `${env.SITE_URL}/og-articles.jpg`,
    default_job_og_image: `${env.SITE_URL}/og-job-default.jpg`,
    default_article_og_image: `${env.SITE_URL}/og-article-default.jpg`,
    sitemap_update_interval: 300,
    auto_generate_sitemap: true,
    last_sitemap_update: new Date().toISOString(),
    robots_txt: `User-agent: *
Allow: /

# Disallow admin panel
Disallow: /admin/
Disallow: /admin

# Disallow bookmarks (private pages)
Disallow: /bookmarks/
Disallow: /bookmarks

# Allow specific important pages
Allow: /lowongan-kerja/
Allow: /artikel/

# Sitemaps
Sitemap: ${env.SITE_URL}/sitemap.xml`,
    // Advertisement Settings
    popup_ad_code: '',
    sidebar_archive_ad_code: '',
    sidebar_single_ad_code: '',
    single_top_ad_code: '',
    single_bottom_ad_code: '',
    single_middle_ad_code: ''
  };

  // Cache for settings to avoid unnecessary DB calls
  private settingsCache: { data: AdminSettings; timestamp: number } | null = null;
  private readonly CACHE_TTL = 2 * 60 * 1000; // Reduced to 2 minutes for admin context

  // Authentication state management for production issues
  private authRetryCount = 0;
  private readonly MAX_AUTH_RETRIES = 3;
  private authTimeout: NodeJS.Timeout | null = null;

  // Get current user profile with retry logic for production
  async getCurrentProfile(): Promise<Profile | null> {
    try {
      // Add timeout for production issues
      const timeoutPromise = new Promise<never>((_, reject) => {
        this.authTimeout = setTimeout(() => {
          reject(new Error('Authentication timeout'));
        }, 10000); // 10 second timeout
      });

      const authPromise = supabase.auth.getUser();

      const { data: { user } } = await Promise.race([authPromise, timeoutPromise]);

      if (this.authTimeout) {
        clearTimeout(this.authTimeout);
        this.authTimeout = null;
      }

      if (!user) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      // Reset retry count on success
      this.authRetryCount = 0;
      return data;
    } catch (error) {
      if (this.authTimeout) {
        clearTimeout(this.authTimeout);
        this.authTimeout = null;
      }

      console.error('Error getting current profile:', error);

      // Implement retry logic for production issues
      if (this.authRetryCount < this.MAX_AUTH_RETRIES) {
        this.authRetryCount++;
        console.log(`Retrying authentication (attempt ${this.authRetryCount}/${this.MAX_AUTH_RETRIES})`);

        // Wait before retry with exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, this.authRetryCount) * 1000));
        return this.getCurrentProfile();
      }

      return null;
    }
  }

  // Check if current user is super admin with better error handling
  async isSuperAdmin(): Promise<boolean> {
    try {
      const profile = await this.getCurrentProfile();
      return profile?.role === 'super_admin';
    } catch (error) {
      console.error('Error checking super admin status:', error);
      return false;
    }
  }

  // Check if cache is valid (reduced TTL for admin context)
  private isCacheValid(): boolean {
    if (!this.settingsCache) return false;
    return Date.now() - this.settingsCache.timestamp < this.CACHE_TTL;
  }

  // Get admin settings with enhanced error handling for production
  async getSettings(forceRefresh: boolean = false): Promise<AdminSettings | undefined> {
    try {
      // For admin panel, always force refresh to avoid stale data issues
      const isAdminContext = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');

      // Use cache if valid and not in admin context and not forcing refresh
      if (!forceRefresh && !isAdminContext && this.isCacheValid() && this.settingsCache) {
        console.log('Using cached settings');
        return this.settingsCache.data;
      }

      console.log('Fetching fresh settings from database');

      // Add timeout for production issues
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Database query timeout'));
        }, 15000); // 15 second timeout
      });

      const queryPromise = supabase
        .from('admin_settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

      let settings: AdminSettings;

      if (error) {
        console.warn('Error fetching admin settings:', error.message);

        // For specific errors, try with different approaches
        if (error.code === 'PGRST116' || error.message.includes('406') || error.message.includes('timeout')) {
          console.log('Trying alternative approach for admin settings...');

          try {
            // Try with a simpler query
            const { data: simpleData, error: simpleError } = await supabase
              .from('admin_settings')
              .select('*')
              .limit(1);

            if (simpleError) {
              console.warn('Simple query also failed:', simpleError.message);
              settings = this.defaultSettings as AdminSettings;
            } else if (simpleData && simpleData.length > 0) {
              settings = simpleData[0];
            } else {
              settings = this.defaultSettings as AdminSettings;
            }
          } catch (simpleErr) {
            console.error('Simple query retry failed:', simpleErr);
            settings = this.defaultSettings as AdminSettings;
          }
        } else {
          settings = this.defaultSettings as AdminSettings;
        }
      } else if (!data) {
        console.warn('No admin settings found, using defaults');
        settings = this.defaultSettings as AdminSettings;
      } else {
        settings = data;
      }

      // Update cache only if we got valid data and not in admin context
      if (settings && !isAdminContext) {
        this.settingsCache = {
          data: settings,
          timestamp: Date.now()
        };
      }

      return settings;
    } catch (error) {
      console.error('Error fetching admin settings:', error);

      // Return cached data if available, otherwise defaults
      if (this.settingsCache) {
        console.log('Returning cached settings due to error');
        return this.settingsCache.data;
      }

      console.log('Returning default settings due to error');
      return this.defaultSettings as AdminSettings;
    }
  }

  // Clear settings cache
  clearSettingsCache(): void {
    this.settingsCache = null;
    console.log('Settings cache cleared');
  }

  // Save admin settings with enhanced error handling and retry logic
  async saveSettings(settings: Partial<AdminSettings>): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if user is super admin with timeout
      const timeoutPromise = new Promise<boolean>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Super admin check timeout'));
        }, 10000);
      });

      const adminCheckPromise = this.isSuperAdmin();
      const isSuperAdmin = await Promise.race([adminCheckPromise, timeoutPromise]);

      if (!isSuperAdmin) {
        return { success: false, error: 'Unauthorized: Super admin access required' };
      }

      // Get existing settings with timeout
      const existingQueryPromise = supabase
        .from('admin_settings')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const existingTimeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Existing settings query timeout'));
        }, 10000);
      });

      let existingSettings;
      try {
        const { data } = await Promise.race([existingQueryPromise, existingTimeoutPromise]);
        existingSettings = data;
      } catch (error) {
        console.warn('Error getting existing settings, will try to insert:', error);
        existingSettings = null;
      }

      // Prepare the update/insert operation with timeout
      let result;
      const operationTimeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Save operation timeout'));
        }, 15000);
      });

      if (existingSettings?.id) {
        // Update existing settings
        const updatePromise = supabase
          .from('admin_settings')
          .update({
            ...settings,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingSettings.id)
          .select()
          .single();

        result = await Promise.race([updatePromise, operationTimeoutPromise]);
      } else {
        // Insert new settings
        const insertPromise = supabase
          .from('admin_settings')
          .insert({
            ...this.defaultSettings,
            ...settings
          })
          .select()
          .single();

        result = await Promise.race([insertPromise, operationTimeoutPromise]);
      }

      if (result.error) {
        console.error('Error saving admin settings:', result.error);
        return { success: false, error: result.error.message };
      }

      // Clear cache after successful save
      this.clearSettingsCache();

      console.log('Settings saved successfully');
      return { success: true };
    } catch (error) {
      console.error('Error saving admin settings:', error);

      // Provide more specific error messages for production debugging
      let errorMessage = 'Unknown error occurred';
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          errorMessage = 'Request timeout - please check your connection and try again';
        } else if (error.message.includes('network')) {
          errorMessage = 'Network error - please check your internet connection';
        } else {
          errorMessage = error.message;
        }
      }

      return { success: false, error: errorMessage };
    }
  }

  // Update last sitemap generation timestamp with better error handling
  async updateLastSitemapGeneration(): Promise<void> {
    try {
      const isSuperAdmin = await this.isSuperAdmin();
      if (!isSuperAdmin) return;

      const { data: existingSettings } = await supabase
        .from('admin_settings')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (existingSettings?.id) {
        await supabase
          .from('admin_settings')
          .update({
            last_sitemap_update: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingSettings.id);

        // Clear cache after update
        this.clearSettingsCache();
      }
    } catch (error) {
      console.error('Error updating sitemap timestamp:', error);
    }
  }

  // Authentication methods with enhanced error handling for production
  async signInWithEmail(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Add timeout for production issues
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Sign in timeout - please try again'));
        }, 15000);
      });

      const signInPromise = supabase.auth.signInWithPassword({
        email,
        password
      });

      const { data, error } = await Promise.race([signInPromise, timeoutPromise]);

      if (error) {
        console.error('Sign in error:', error);
        return { success: false, error: error.message };
      }

      // Clear cache on successful login to ensure fresh data
      this.clearSettingsCache();
      this.authRetryCount = 0; // Reset retry count

      console.log('Sign in successful');
      return { success: true };
    } catch (error) {
      console.error('Sign in error:', error);

      let errorMessage = 'Sign in failed';
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          errorMessage = 'Sign in timeout - please check your connection and try again';
        } else {
          errorMessage = error.message;
        }
      }

      return { success: false, error: errorMessage };
    }
  }

  async signInWithMagicLink(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Magic link timeout'));
        }, 10000);
      });

      const magicLinkPromise = supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/admin`
        }
      });

      const { error } = await Promise.race([magicLinkPromise, timeoutPromise]);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Magic link error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Magic link failed' };
    }
  }

  async signOut(): Promise<void> {
    try {
      await supabase.auth.signOut();
      // Clear cache on logout
      this.clearSettingsCache();
      this.authRetryCount = 0; // Reset retry count
      console.log('Sign out successful');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  // Check if user is authenticated with better error handling
  async isAuthenticated(): Promise<boolean> {
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Authentication check timeout'));
        }, 8000);
      });

      const authPromise = supabase.auth.getUser();
      const { data: { user } } = await Promise.race([authPromise, timeoutPromise]);

      return !!user;
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  }

  // Server-side methods for API routes with better error handling
  static async getSettingsServerSide(): Promise<AdminSettings> {
    try {
      const supabaseServer = createServerSupabaseClient();

      const { data, error } = await supabaseServer
        .from('admin_settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.warn('Error fetching admin settings server-side:', error.message);

        // Try with public/anon access if auth fails
        try {
          const { createClient } = await import('@supabase/supabase-js');
          const publicClient = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
          );

          const { data: publicData, error: publicError } = await publicClient
            .from('admin_settings')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (publicError || !publicData) {
            console.warn('Public access also failed, using defaults');
            return SupabaseAdminService.getDefaultSettings();
          }

          return publicData;
        } catch (publicErr) {
          console.error('Public retry failed:', publicErr);
          return SupabaseAdminService.getDefaultSettings();
        }
      }

      if (!data) {
        console.warn('No admin settings found on server, using defaults');
        return SupabaseAdminService.getDefaultSettings();
      }

      return data;
    } catch (error) {
      console.error('Error fetching admin settings server-side:', error);
      return SupabaseAdminService.getDefaultSettings();
    }
  }

  // Get default settings as a static method
  static getDefaultSettings(): AdminSettings {
    return {
      api_url: env.WP_API_URL,
      filters_api_url: env.WP_FILTERS_API_URL,
      auth_token: env.WP_AUTH_TOKEN,
      site_title: env.SITE_NAME,
      site_tagline: 'Find Your Dream Job',
      site_description: env.SITE_DESCRIPTION,
      site_url: env.SITE_URL,
      ga_id: env.GA_ID || '',
      gtm_id: env.GTM_ID || '',
      // Supabase Storage Configuration
      supabase_storage_endpoint: 'https://uzlzyosmbxgghhmafidk.supabase.co/storage/v1/s3',
      supabase_storage_region: 'ap-southeast-1',
      supabase_storage_access_key: '642928fa32b65d648ce65ea04c64100e',
      supabase_storage_secret_key: '082c3ce06c08ba1b347af99f16ff634fd12b4949a6cdda16df30dcc5741609dc',
      // WordPress API Configuration
      wp_posts_api_url: 'https://cms.nexjob.tech/wp-json/wp/v2/posts',
      wp_jobs_api_url: 'https://cms.nexjob.tech/wp-json/wp/v2/lowongan-kerja',
      wp_auth_token: env.WP_AUTH_TOKEN,
      // Dynamic SEO Templates
      location_page_title_template: 'Lowongan Kerja di {{lokasi}} - {{site_title}}',
      location_page_description_template: 'Temukan lowongan kerja terbaru di {{lokasi}}. Dapatkan pekerjaan impian Anda dengan gaji terbaik di {{site_title}}.',
      category_page_title_template: 'Lowongan Kerja {{kategori}} - {{site_title}}',
      category_page_description_template: 'Temukan lowongan kerja {{kategori}} terbaru. Dapatkan pekerjaan impian Anda dengan gaji terbaik di {{site_title}}.',
      // Archive Page SEO Settings
      jobs_title: 'Lowongan Kerja Terbaru - {{site_title}}',
      jobs_description: 'Temukan lowongan kerja terbaru dari berbagai perusahaan terpercaya. Dapatkan pekerjaan impian Anda dengan gaji terbaik.',
      articles_title: 'Tips Karir & Panduan Kerja - {{site_title}}',
      articles_description: 'Artikel dan panduan karir terbaru untuk membantu perjalanan karir Anda. Tips interview, CV, dan pengembangan karir.',
      // Auth Pages SEO
      login_page_title: 'Login - {{site_title}}',
      login_page_description: 'Masuk ke akun Nexjob Anda untuk mengakses fitur lengkap pencarian kerja dan menyimpan lowongan favorit.',
      signup_page_title: 'Daftar Akun - {{site_title}}',
      signup_page_description: 'Daftar akun gratis di Nexjob untuk menyimpan lowongan favorit dan mendapatkan notifikasi pekerjaan terbaru.',
      profile_page_title: 'Profil Saya - {{site_title}}',
      profile_page_description: 'Kelola profil dan preferensi akun Nexjob Anda.',
      // SEO Images
      home_og_image: `${env.SITE_URL}/og-home.jpg`,
      jobs_og_image: `${env.SITE_URL}/og-jobs.jpg`,
      articles_og_image: `${env.SITE_URL}/og-articles.jpg`,
      default_job_og_image: `${env.SITE_URL}/og-job-default.jpg`,
      default_article_og_image: `${env.SITE_URL}/og-article-default.jpg`,
      sitemap_update_interval: 300,
      auto_generate_sitemap: true,
      last_sitemap_update: new Date().toISOString(),
      robots_txt: `User-agent: *
Allow: /

# Disallow admin panel
Disallow: /admin/
Disallow: /admin

# Disallow bookmarks (private pages)
Disallow: /bookmarks/
Disallow: /bookmarks

# Allow specific important pages
Allow: /lowongan-kerja/
Allow: /artikel/

# Sitemaps
Sitemap: ${env.SITE_URL}/sitemap.xml`,
    // Advertisement Settings
    popup_ad_code: '',
    sidebar_archive_ad_code: '',
    sidebar_single_ad_code: '',
    single_top_ad_code: '',
    single_bottom_ad_code: '',
    single_middle_ad_code: ''
    } as AdminSettings;
  }

  static async updateSettingsServerSide(settings: Partial<AdminSettings>): Promise<{ success: boolean; error?: string }> {
    try {
      const supabaseServer = createServerSupabaseClient();

      // Get existing settings
      const { data: existingSettings } = await supabaseServer
        .from('admin_settings')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      let result;
      if (existingSettings?.id) {
        // Update existing settings
        result = await supabaseServer
          .from('admin_settings')
          .update({
            ...settings,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingSettings.id)
          .select()
          .single();
      } else {
        // Insert new settings
        result = await supabaseServer
          .from('admin_settings')
          .insert(settings)
          .select()
          .single();
      }

      if (result.error) {
        console.error('Error saving admin settings server-side:', result.error);
        return { success: false, error: result.error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error saving admin settings server-side:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

export const supabaseAdminService = new SupabaseAdminService();