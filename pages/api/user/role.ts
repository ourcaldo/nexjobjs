
import { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

    // Get user role
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching user role:', error);
      return res.status(500).json({ error: 'Failed to fetch user role' });
    }

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    return res.status(200).json({ 
      success: true, 
      data: { 
        role: profile.role,
        is_super_admin: profile.role === 'super_admin'
      } 
    });
  } catch (error) {
    console.error('Error in role API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
