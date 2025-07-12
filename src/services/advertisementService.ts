
import { supabaseAdminService } from './supabaseAdminService';

export interface AdvertisementConfig {
  popup_ad_code?: string;
  sidebar_archive_ad_code?: string;
  sidebar_single_ad_code?: string;
  single_top_ad_code?: string;
  single_bottom_ad_code?: string;
  single_middle_ad_code?: string;
}

class AdvertisementService {
  private adConfig: AdvertisementConfig | null = null;
  private configLoaded = false;

  async loadAdConfig(): Promise<AdvertisementConfig> {
    if (this.configLoaded && this.adConfig) {
      return this.adConfig;
    }

    try {
      const settings = await supabaseAdminService.getSettings();
      this.adConfig = {
        popup_ad_code: settings?.popup_ad_code || '',
        sidebar_archive_ad_code: settings?.sidebar_archive_ad_code || '',
        sidebar_single_ad_code: settings?.sidebar_single_ad_code || '',
        single_top_ad_code: settings?.single_top_ad_code || '',
        single_bottom_ad_code: settings?.single_bottom_ad_code || '',
        single_middle_ad_code: settings?.single_middle_ad_code || ''
      };
      this.configLoaded = true;
      return this.adConfig;
    } catch (error) {
      console.error('Error loading advertisement config:', error);
      return {};
    }
  }

  async getAdCode(position: keyof AdvertisementConfig): Promise<string> {
    const config = await this.loadAdConfig();
    return config[position] || '';
  }

  // Clear cache when settings are updated
  clearCache(): void {
    this.adConfig = null;
    this.configLoaded = false;
  }

  // Force refresh of ad config
  async refreshConfig(): Promise<AdvertisementConfig> {
    this.clearCache();
    return await this.loadAdConfig();
  }

  // Insert ad in content at H2 tags (for middle ads)
  insertMiddleAd(content: string, adCode: string): string {
    if (!adCode || !content) return content;

    // Find H2 tags in content
    const h2Regex = /<h2[^>]*>/gi;
    const matches = [...content.matchAll(h2Regex)];
    
    if (matches.length === 0) return content;

    // Insert ad before the middle H2 tag
    const middleIndex = Math.floor(matches.length / 2);
    const middleH2Match = matches[middleIndex];
    
    if (middleH2Match && middleH2Match.index !== undefined) {
      const beforeMiddleH2 = content.substring(0, middleH2Match.index);
      const afterMiddleH2 = content.substring(middleH2Match.index);
      
      const adHtml = `
        <div class="advertisement-middle my-6">
          <div class="text-xs text-gray-500 mb-2 text-center">Advertisement</div>
          ${adCode}
        </div>
      `;
      
      return beforeMiddleH2 + adHtml + afterMiddleH2;
    }

    return content;
  }
}

export const advertisementService = new AdvertisementService();
