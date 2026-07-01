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

function wrapText(text, maxCharsPerLine) {
  const words = String(text || '').split(/\s+/);
  const lines = [];
  let currentLine = '';
  
  for (const word of words) {
    if (!word) continue;
    if ((currentLine + ' ' + word).trim().length <= maxCharsPerLine) {
      currentLine = currentLine ? `${currentLine} ${word}` : word;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }
      currentLine = word;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

function generateRemarkSvg(event) {
  const usernameRaw = event.created_by_display_username || event.created_by_username || 'Anonymous';
  const username = usernameRaw.startsWith('@') ? usernameRaw : `@${usernameRaw}`;

  const hasAvatar = !!event.created_by_avatar && !event.created_by_is_avatar_blurred && !event.created_by_is_restricted;
  const avatarUrl = event.created_by_avatar;
  const userColor = event.created_by_user_color || '#CE93D8';
  const initial = String(usernameRaw).replace(/^@/, '').charAt(0).toUpperCase() || '?';

  let lines = wrapText(event.title || '', 38);
  if (lines.length > 4) {
    lines = lines.slice(0, 4);
    const lastLine = lines[3];
    if (lastLine) {
      lines[3] = lastLine.slice(0, 32) + '...';
    }
  }

  const startY = 345 - ((lines.length - 1) * 24);

  let avatarMarkup = '';
  if (hasAvatar) {
    avatarMarkup = `
      <g clip-path="url(#avatar-clip)">
        <image href="${esc(avatarUrl)}" x="100" y="255" width="120" height="120" preserveAspectRatio="xMidYMid slice" />
      </g>
      <circle cx="160" cy="315" r="60" fill="none" stroke="#CE93D8" stroke-width="4" />
    `;
  } else {
    avatarMarkup = `
      <circle cx="160" cy="315" r="60" fill="${esc(userColor)}" stroke="none" />
      <text x="160" y="333" font-family="'Inter', -apple-system, sans-serif" font-size="56" fill="#ffffff" font-weight="bold" text-anchor="middle">${esc(initial)}</text>
      <circle cx="160" cy="315" r="60" fill="none" stroke="#CE93D8" stroke-width="4" />
    `;
  }

  let textMarkup = '';
  lines.forEach((line, idx) => {
    const y = startY + idx * 48;
    textMarkup += `<text x="310" y="${y}" font-family="'Inter', -apple-system, sans-serif" font-size="36" fill="#ffffff" font-weight="500">${esc(line)}</text>`;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="100%" height="100%">
    <defs>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&amp;display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Lobster&amp;display=swap');
      </style>
      <linearGradient id="bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0a1128" />
        <stop offset="100%" stop-color="#040814" />
      </linearGradient>
      <linearGradient id="bubble-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#14162c" stop-opacity="0.96" />
        <stop offset="100%" stop-color="#0a0b16" stop-opacity="0.96" />
      </linearGradient>
      <clipPath id="avatar-clip">
        <circle cx="160" cy="315" r="60" />
      </clipPath>
      <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="8" dy="10" stdDeviation="12" flood-color="#000" flood-opacity="0.5" />
      </filter>
    </defs>
    <!-- Background -->
    <rect width="1200" height="630" fill="url(#bg-gradient)" />
    
    <!-- Branding -->
    <text x="1100" y="70" font-family="'Lobster', cursive, -apple-system, sans-serif" font-size="32" fill="#CE93D8" text-anchor="end" opacity="0.8">iTimeline</text>

    <!-- Word Bubble Pointer Arrow -->
    <path d="M 262 290 L 230 315 L 262 340" fill="url(#bubble-gradient)" stroke="#CE93D8" stroke-width="4" />

    <!-- Word Bubble Container -->
    <rect x="260" y="210" width="800" height="250" rx="24" ry="24" fill="url(#bubble-gradient)" stroke="#CE93D8" stroke-width="4" filter="url(#shadow)" />
    
    <!-- Cover/hide the bubble border where the pointer connects -->
    <path d="M 262 288 L 262 342" fill="none" stroke="url(#bubble-gradient)" stroke-width="6" />

    <!-- Username & Says Label -->
    <text x="260" y="180" font-family="'Inter', -apple-system, sans-serif" font-size="36" font-weight="700" fill="#58a6ff">
      ${esc(username)}
      <tspan font-weight="400" fill="#8b949e"> Says</tspan>
    </text>

    <!-- Avatar -->
    ${avatarMarkup}

    <!-- Remark Text lines -->
    ${textMarkup}
  </svg>`;
}

export async function onRequestGet(context) {
  const { params, request, env, next } = context;

  const urlObj = new URL(request.url);
  const isImageRequest = urlObj.searchParams.get('img') === 'true' || urlObj.searchParams.get('image') === 'true';

  const ua = request.headers.get('user-agent') || '';
  if (!isBot(ua) && !isImageRequest) return next();

  const eventId = params.eventId;
  const apiBase = env.API_URL || env.VITE_API_URL || 'https://api.i-timeline.com';
  const frontendBase = env.FRONTEND_URL || urlObj.origin || 'https://i-timeline.com';

  let event = null;
  try {
    const res = await fetch(`${apiBase}/api/v1/events/${eventId}`, {
      headers: { 'Accept': 'application/json' },
    });
    if (res.ok) event = await res.json();
  } catch (_) {}

  if (!event) return next();

  if (isImageRequest && event.type === 'remark') {
    const svg = generateRemarkSvg(event);
    return new Response(svg, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=600',
      },
    });
  }

  const pageUrl = `${frontendBase}/share/events/${eventId}`;
  const siteName = 'iTimeline';
  
  let title, description, image;
  if (event.type === 'remark') {
    const usernameRaw = event.created_by_display_username || event.created_by_username || 'Anonymous';
    const username = usernameRaw.startsWith('@') ? usernameRaw : `@${usernameRaw}`;
    title = esc(username);
    description = esc(`“${event.title || ''}”`);
    image = esc(`${frontendBase}/share/events/${eventId}?img=true`);
  } else {
    title = esc(event.title || 'Shared Event');
    description = esc(event.description || 'Check out this event on iTimeline.');
    image = esc(event.media_url || event.mediaUrl || event.url_image || `${frontendBase}/images/og-default.png`);
  }

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
