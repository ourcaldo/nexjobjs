import { supabase } from '@/lib/supabase';
import { UserBookmark } from '@/lib/supabase';

class UserBookmarkService {
  // Get user bookmarks
  async getUserBookmarks(userId: string): Promise<UserBookmark[]> {
    try {
      const { data, error } = await supabase
        .from('user_bookmarks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user bookmarks:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching user bookmarks:', error);
      return [];
    }
  }

  // Add bookmark
  async addBookmark(userId: string, jobId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('user_bookmarks')
        .insert({
          user_id: userId,
          job_id: jobId
        });

      if (error) {
        console.error('Error adding bookmark:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error adding bookmark:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to add bookmark' 
      };
    }
  }

  // Remove bookmark
  async removeBookmark(userId: string, jobId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('user_bookmarks')
        .delete()
        .eq('user_id', userId)
        .eq('job_id', jobId);

      if (error) {
        console.error('Error removing bookmark:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error removing bookmark:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to remove bookmark' 
      };
    }
  }

  // Check if job is bookmarked
  async isBookmarked(userId: string, jobId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_bookmarks')
        .select('id')
        .eq('user_id', userId)
        .eq('job_id', jobId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking bookmark:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error checking bookmark:', error);
      return false;
    }
  }

  // Toggle bookmark
  async toggleBookmark(userId: string, jobId: string): Promise<{ success: boolean; isBookmarked: boolean; error?: string }> {
    try {
      const isCurrentlyBookmarked = await this.isBookmarked(userId, jobId);

      if (isCurrentlyBookmarked) {
        const result = await this.removeBookmark(userId, jobId);
        return {
          success: result.success,
          isBookmarked: false,
          error: result.error
        };
      } else {
        const result = await this.addBookmark(userId, jobId);
        return {
          success: result.success,
          isBookmarked: true,
          error: result.error
        };
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      return {
        success: false,
        isBookmarked: false,
        error: error instanceof Error ? error.message : 'Failed to toggle bookmark'
      };
    }
  }

  // Get bookmark count for user
  async getBookmarkCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('user_bookmarks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (error) {
        console.error('Error getting bookmark count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error getting bookmark count:', error);
      return 0;
    }
  }
}

export const userBookmarkService = new UserBookmarkService();