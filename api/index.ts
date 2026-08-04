// Unified API handler - routes all requests internally
// This reduces serverless functions from 15+ to just 1
// All handlers are in _handlers/ directory (Vercel ignores directories starting with _)
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const path = req.url?.split('?')[0] || '';
  const method = req.method || 'GET';

  console.log('[API Router]', method, req.url);
  console.log('[API Router] Parsed path:', path);
  console.log('[API Router] Query params:', req.query);

  try {
    // Route to appropriate handler (all handlers in _handlers directory)
    if (path.startsWith('/api/auth/login')) {
      const { default: loginHandler } = await import('./_handlers/auth/login');
      return loginHandler(req, res);
    }

    if (path.startsWith('/api/auth/google')) {
      const { default: googleHandler } = await import('./_handlers/auth/google');
      return googleHandler(req, res);
    }

    if (path.startsWith('/api/auth/verify')) {
      const { default: verifyHandler } = await import('./_handlers/auth/verify');
      return verifyHandler(req, res);
    }

    if (path.match(/^\/api\/events\/[^/]+\/register$/)) {
      // Extract event ID from path
      const eventId = path.split('/')[3];
      req.query = { ...req.query, id: eventId };
      const { default: registerHandler } = await import('./_handlers/events/[id]/register');
      return registerHandler(req, res);
    }

    if (path.match(/^\/api\/events\/[^/]+$/) && !path.endsWith('/register')) {
      // Extract event ID from path
      const eventId = path.split('/')[3];
      req.query = { ...req.query, id: eventId };
      const { default: eventHandler } = await import('./_handlers/events/[id]');
      return eventHandler(req, res);
    }

    if (path === '/api/events') {
      const { default: eventsHandler } = await import('./_handlers/events/index');
      return eventsHandler(req, res);
    }

    if (path.match(/^\/api\/meetups\/[^/]+\/register$/)) {
      // Extract meetup ID from path
      const meetupId = path.split('/')[3];
      req.query = { ...req.query, id: meetupId };
      const { default: registerHandler } = await import('./_handlers/meetups/[id]/register');
      return registerHandler(req, res);
    }

    if (path.match(/^\/api\/meetups\/[^/]+$/) && !path.endsWith('/register')) {
      // Extract meetup ID from path
      const meetupId = path.split('/')[3];
      req.query = { ...req.query, id: meetupId };
      const { default: meetupHandler } = await import('./_handlers/meetups/[id]');
      return meetupHandler(req, res);
    }

    if (path === '/api/meetups') {
      const { default: meetupsHandler } = await import('./_handlers/meetups/index');
      return meetupsHandler(req, res);
    }

    if (path === '/api/admin/upload') {
      const { default: uploadHandler } = await import('./_handlers/admin/upload');
      return uploadHandler(req, res);
    }

    if (path === '/api/upload') {
      const { default: uploadHandler } = await import('./_handlers/upload');
      return uploadHandler(req, res);
    }

    if (path === '/api/google-forms/schema') {
      const { default: schemaHandler } = await import('./_handlers/google-forms/schema');
      return schemaHandler(req, res);
    }

    if (path === '/api/google-forms/submit') {
      const { default: submitHandler } = await import('./_handlers/google-forms/submit');
      return submitHandler(req, res);
    }

    if (path === '/api/admin/analytics') {
      const { default: analyticsHandler } = await import('./_handlers/admin/analytics');
      return analyticsHandler(req, res);
    }

    if (path.startsWith('/api/admin/media')) {
      // Extract query params for media ID
      const url = new URL(req.url || '', 'http://localhost');
      const mediaId = url.searchParams.get('id');
      if (mediaId) {
        req.query = { ...req.query, id: mediaId };
      }
      const { default: mediaHandler } = await import('./_handlers/admin/media');
      return mediaHandler(req, res);
    }

    if (path.match(/^\/api\/communities\/[^/]+$/)) {
      const communityId = path.split('/')[3];
      req.query = { ...req.query, id: communityId };
      const { default: communityHandler } = await import('./_handlers/communities/[id]');
      return communityHandler(req, res);
    }

    if (path === '/api/communities') {
      const { default: communitiesHandler } = await import('./_handlers/communities/index');
      return communitiesHandler(req, res);
    }

    if (path.match(/^\/api\/council\/team\/[^/]+$/)) {
      const teamName = path.split('/')[4];
      const url = new URL(req.url || '', 'http://localhost');
      url.searchParams.set('team', teamName);
      req.query = { ...req.query, team: teamName };
      const { default: councilTeamHandler } = await import('./_handlers/council/team');
      return councilTeamHandler(req, res);
    }

    if (path === '/api/council/sync-yaml') {
      const { default: syncYamlHandler } = await import('./_handlers/council/sync-yaml');
      return syncYamlHandler(req, res);
    }

    if (path.match(/^\/api\/council\/[^/]+$/)) {
      const councilId = path.split('/')[3];
      req.query = { ...req.query, id: councilId };
      const { default: councilHandler } = await import('./_handlers/council/[id]');
      return councilHandler(req, res);
    }

    if (path === '/api/council') {
      const { default: councilHandler } = await import('./_handlers/council/index');
      return councilHandler(req, res);
    }

    if (path.match(/^\/api\/achievements\/[^/]+$/)) {
      const achievementId = path.split('/')[3];
      req.query = { ...req.query, id: achievementId };
      const { default: achievementHandler } = await import('./_handlers/achievements/[id]');
      return achievementHandler(req, res);
    }

    if (path === '/api/achievements') {
      const { default: achievementsHandler } = await import('./_handlers/achievements/index');
      return achievementsHandler(req, res);
    }

    if (path.match(/^\/api\/links\/[^/]+$/)) {
      const linkId = path.split('/')[3];
      req.query = { ...req.query, id: linkId };
      const { default: linkHandler } = await import('./_handlers/links/[id]');
      return linkHandler(req, res);
    }

    if (path === '/api/links') {
      const { default: linksHandler } = await import('./_handlers/links/index');
      return linksHandler(req, res);
    }

    if (path === '/api/logs/log') {
      const { default: logHandler } = await import('./_handlers/logs/log');
      return logHandler(req, res);
    }

    return res.status(404).json({ error: 'Not found' });
  } catch (error: any) {
    console.error('API routing error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
