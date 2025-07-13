
import { supabase } from '@/lib/supabase';
import type { AdminSettings } from '@/lib/supabase';

export class AdminSettingsApiService {
  private baseUrl = '/api/admin/settings';
  
  // Cache for settings to avoid unnecessary API calls
  private settingsCache: { data: AdminSettings | null; timestamp: number } | null = null;
  private readonly CACHE_TTL = 2 * 60 * 1000; // 2 minutes cache

  private async getAuthToken(): Promise<string | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token || null;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await this.getAuthToken();
    
    if (!token) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  private isCacheValid(): boolean {
    if (!this.settingsCache) return false;
    return Date.now() - this.settingsCache.timestamp < this.CACHE_TTL;
  }

  async getSettings(forceRefresh: boolean = false): Promise<AdminSettings | null> {
    try {
      // Use cache if valid and not forcing refresh
      if (!forceRefresh && this.isCacheValid() && this.settingsCache) {
        console.log('Using cached admin settings');
        return this.settingsCache.data;
      }

      console.log('Fetching admin settings from API');
      
      const response = await this.makeRequest<{ data: AdminSettings | null }>(`${this.baseUrl}`);
      
      // Update cache
      this.settingsCache = {
        data: response.data,
        timestamp: Date.now()
      };

      return response.data;
    } catch (error) {
      console.error('Error fetching admin settings:', error);
      
      // Return cached data if available
      if (this.settingsCache) {
        console.log('Returning cached settings due to API error');
        return this.settingsCache.data;
      }
      
      return null;
    }
  }

  async saveSettings(settings: Partial<AdminSettings>): Promise<{ success: boolean; error?: string }> {
    try {
      await this.makeRequest<{ data: AdminSettings; success: boolean }>(`${this.baseUrl}`, {
        method: 'POST',
        body: JSON.stringify(settings),
      });

      // Clear cache after successful save
      this.clearCache();

      return { success: true };
    } catch (error) {
      console.error('Error saving admin settings:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save settings';
      return { success: false, error: errorMessage };
    }
  }

  clearCache(): void {
    this.settingsCache = null;
    console.log('Admin settings cache cleared');
  }
}

export const adminSettingsApiService = new AdminSettingsApiService();
