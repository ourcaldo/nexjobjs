
class UserProfileApiService {
  private baseUrl = '/api/user';

  // Get current user profile
  async getProfile(): Promise<any> {
    try {
      const { data: { session } } = await import('@/lib/supabase').then(m => m.supabase.auth.getSession());
      
      if (!session?.access_token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(`${this.baseUrl}/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch profile');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  }

  // Update user profile
  async updateProfile(profileData: any): Promise<any> {
    try {
      const { data: { session } } = await import('@/lib/supabase').then(m => m.supabase.auth.getSession());
      
      if (!session?.access_token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(`${this.baseUrl}/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  // Get user role
  async getUserRole(): Promise<{ role: string; is_super_admin: boolean }> {
    try {
      const { data: { session } } = await import('@/lib/supabase').then(m => m.supabase.auth.getSession());
      
      if (!session?.access_token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(`${this.baseUrl}/role`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch user role');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching user role:', error);
      throw error;
    }
  }
}

export const userProfileApiService = new UserProfileApiService();
