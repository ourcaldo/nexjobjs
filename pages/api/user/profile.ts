
import { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createServerSupabaseClient();

  // Get the authorization token from headers
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization header provided' });
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    // Verify the session token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid session token' });
    }

    switch (req.method) {
      case 'GET':
        return handleGetProfile(req, res, supabase, user.id);
      case 'PUT':
        return handleUpdateProfile(req, res, supabase, user.id);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in profile API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleGetProfile(req: NextApiRequest, res: NextApiResponse, supabase: any, userId: string) {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return res.status(500).json({ error: 'Failed to fetch profile' });
    }

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    return res.status(200).json({ success: true, data: profile });
  } catch (error) {
    console.error('Error in handleGetProfile:', error);
    return res.status(500).json({ error: 'Failed to fetch profile' });
  }
}

async function handleUpdateProfile(req: NextApiRequest, res: NextApiResponse, supabase: any, userId: string) {
  try {
    const updates = req.body;
    
    // Remove fields that shouldn't be updated via this endpoint
    delete updates.id;
    delete updates.email;
    delete updates.role;
    delete updates.created_at;

    const { data: updatedProfile, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      return res.status(500).json({ error: 'Failed to update profile' });
    }

    return res.status(200).json({ success: true, data: updatedProfile });
  } catch (error) {
    console.error('Error in handleUpdateProfile:', error);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
}
