const BOT_UA_PATTERNS = [
  'discordbot',
  'facebookexternalhit',
  'facebot',
  'twitterbot',
  'slackbot',
  'slack-imgproxy',
  'telegrambot',
  'whatsapp',
  'linkedinbot',
  'pinterestbot',
  'googlebot',
  'bingbot',
  'yandexbot',
  'applebot',
  'embedly',
  'iframely',
  'outbrain',
  'rogerbot',
  'showyoubot',
  'ia_archiver',
];

function isBot(userAgent) {
  const ua = (userAgent || '').toLowerCase();
  return BOT_UA_PATTERNS.some((p) => ua.includes(p));
}

function esc(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export async function onRequestGet(context) {
  const { params, request, env, next } = context;

  const ua = request.headers.get('user-agent') || '';
  if (!isBot(ua)) return next();

  const eventId = params.eventId;
  const apiBase = env.API_URL || 'https://api.i-timeline.com';
  const frontendBase = env.FRONTEND_URL || 'https://i-timeline.com';

  let event = null;
  try {
    const res = await fetch(`${apiBase}/api/v1/events/${eventId}`, {
      headers: { 'Accept': 'application/json' },
    });
    if (res.ok) event = await res.json();
  } catch (_) {}

  if (!event) return next();

  const pageUrl = `${frontendBase}/share/events/${eventId}`;
  const title = esc(event.title || 'Shared Event');
  const description = esc(event.description || 'Check out this event on iTimeline.');
  const image = esc(event.media_url || event.mediaUrl || event.url_image || `${frontendBase}/images/og-default.png`);
  const siteName = 'iTimeline';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${title} — ${siteName}</title>
  <meta name="description" content="${description}" />
  <meta property="og:type" content="article" />
  <meta property="og:url" content="${esc(pageUrl)}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:site_name" content="${siteName}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${image}" />
  <link rel="canonical" href="${esc(pageUrl)}" />
</head>
<body>
  <p>Redirecting… <a href="${esc(pageUrl)}">View this event on iTimeline</a></p>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html;charset=UTF-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
}
