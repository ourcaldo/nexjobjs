
import { Profile } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';

export interface UserProfileResponse {
  success: boolean;
  data?: Profile;
  error?: string;
}

export interface UserRoleResponse {
  success: boolean;
  data?: {
    role: string;
    is_super_admin: boolean;
  };
  error?: string;
}

class UserProfileApiService {
  private async getAuthToken(): Promise<string | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token || null;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  async getCurrentUserProfile(): Promise<UserProfileResponse> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        return { success: false, error: 'No authentication token available' };
      }

      const response = await fetch('/api/user/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { 
          success: false, 
          error: errorData.error || `HTTP ${response.status}` 
        };
      }

      const data = await response.json();
      return {
        success: true,
        data: data.data
      };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch user profile'
      };
    }
  }

  async getCurrentUserRole(): Promise<UserRoleResponse> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        return { success: false, error: 'No authentication token available' };
      }

      const response = await fetch('/api/user/role', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { 
          success: false, 
          error: errorData.error || `HTTP ${response.status}` 
        };
      }

      const data = await response.json();
      return {
        success: true,
        data: data.data
      };
    } catch (error) {
      console.error('Error fetching user role:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch user role'
      };
    }
  }

  async updateUserProfile(profileData: Partial<Profile>): Promise<UserProfileResponse> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        return { success: false, error: 'No authentication token available' };
      }

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { 
          success: false, 
          error: errorData.error || `HTTP ${response.status}` 
        };
      }

      const data = await response.json();
      return {
        success: true,
        data: data.data
      };
    } catch (error) {
      console.error('Error updating user profile:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update user profile'
      };
    }
  }
}

export const userProfileApiService = new UserProfileApiService();
