import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from '../utils/supabase';
import { requireRole, AuthRequest } from '../utils/auth';

export default requireRole(['secretary', 'webadmin'])(async function handler(
  req: AuthRequest,
  res: VercelResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { startDate, endDate } = req.query;

    // Build date filter
    let dateFilter = '';
    if (startDate && endDate) {
      dateFilter = `timestamp >= '${startDate}' AND timestamp <= '${endDate}'`;
    }

    // Get page views
    let pageViewsQuery = supabaseAdmin
      .from('page_views')
      .select('*', { count: 'exact' });

    if (dateFilter) {
      pageViewsQuery = pageViewsQuery.filter('timestamp', 'gte', startDate as string)
        .filter('timestamp', 'lte', endDate as string);
    }

    const { data: pageViews, error: pageViewsError } = await pageViewsQuery;

    if (pageViewsError) {
      throw pageViewsError;
    }

    // Get page views by path
    const { data: viewsByPath, error: viewsByPathError } = await supabaseAdmin
      .from('page_views')
      .select('page_path')
      .select('*', { count: 'exact', head: false });

    // Get event registrations count
    const { count: eventRegistrations, error: eventRegError } = await supabaseAdmin
      .from('event_registrations')
      .select('*', { count: 'exact', head: true });

    // Get meetup registrations count
    const { count: meetupRegistrations, error: meetupRegError } = await supabaseAdmin
      .from('meetup_registrations')
      .select('*', { count: 'exact', head: true });

    // Get popular events (by registration count)
    const { data: popularEvents, error: popularEventsError } = await supabaseAdmin
      .from('event_registrations')
      .select('event_id, events(title)')
      .select('*', { count: 'exact' })
      .limit(10);

    // Get popular meetups
    const { data: popularMeetups, error: popularMeetupsError } = await supabaseAdmin
      .from('meetup_registrations')
      .select('meetup_id, meetups(title)')
      .select('*', { count: 'exact' })
      .limit(10);

    return res.status(200).json({
      pageViews: {
        total: pageViews?.length || 0,
        data: pageViews || []
      },
      registrations: {
        events: eventRegistrations || 0,
        meetups: meetupRegistrations || 0
      },
      popular: {
        events: popularEvents || [],
        meetups: popularMeetups || []
      }
    });
  } catch (error: any) {
    console.error('Error fetching analytics:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch analytics' });
  }
});
