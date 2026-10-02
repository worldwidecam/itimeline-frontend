import React from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Container, Paper, Typography, Box, Button, Divider, useTheme } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { getGlassDialogPaperSx } from '../utils/formStyleGuide';

function PrivacyPolicy() {
  const theme = useTheme();
  const navigate = useNavigate();
  const isDark = theme.palette.mode === 'dark';

  const pageBackground = isDark
    ? 'linear-gradient(180deg, #000000 0%, #0a1128 50%, #1a2456 100%)'
    : 'linear-gradient(180deg, #ffb199 0%, #ffd5c8 20%, #ffeae0 45%, #f7f4ea 75%, #f5f1e4 90%, #ffffff 100%)';

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        background: pageBackground,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        pt: 12,
        pb: 6,
        px: 3,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Container maxWidth="md">
        <Paper
          elevation={3}
          sx={{
            ...getGlassDialogPaperSx(theme),
            p: { xs: 3, md: 5 },
            boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.3)' : '0 8px 32px rgba(0,0,0,0.1)',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
          }}
        >
          <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              onClick={() => navigate(-1)}
              variant="outlined"
              size="small"
              startIcon={<ArrowBackIcon />}
              sx={{
                borderRadius: '999px',
                textTransform: 'none',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)',
                color: 'text.primary',
                '&:hover': {
                  borderColor: 'primary.main',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                }
              }}
            >
              Back
            </Button>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
              Privacy Policy
            </Typography>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            Last Updated: October 1, 2026
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, textAlign: 'left', lineHeight: 1.6 }}>

            <Box>
              <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold', mb: 1 }}>
                1. Who We Are
              </Typography>
              <Typography variant="body1" color="text.primary">
                iTimeline is a platform that lets you create, share, and explore timelines — from personal memories to community history boards. We care about keeping your data safe and being upfront about how we use it. If you ever have a question about your data, just ask us at{' '}
                <Box component="span" sx={{ fontWeight: 'bold' }}>support@i-timeline.com</Box>.
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold', mb: 1 }}>
                2. What Information We Collect
              </Typography>
              <Typography variant="body1" color="text.primary" sx={{ mb: 1.5 }}>
                We only collect what we need to make iTimeline work for you:
              </Typography>
              <ul>
                <li><strong>Account info</strong> — your username, email address, and hashed password when you register.</li>
                <li><strong>Profile content</strong> — any avatar, bio, or profile information you choose to add.</li>
                <li><strong>Timeline &amp; event content</strong> — timelines, events, comments, and media (images, videos, audio) that you create or upload.</li>
                <li><strong>IP address</strong> — temporarily logged during login and registration to protect the platform from abuse and excessive automated requests. We do not sell or share this.</li>
                <li><strong>Usage signals</strong> — basic interaction data (like which timelines you follow) used to power your personalized feed and recommendations.</li>
              </ul>
              <Typography variant="body1" color="text.primary" sx={{ mt: 1 }}>
                We do <strong>not</strong> collect payment information, location data, or anything from your device beyond what is listed above.
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold', mb: 1 }}>
                3. Why We Collect It
              </Typography>
              <Typography variant="body1" color="text.primary" sx={{ mb: 1 }}>
                Everything we collect has a clear purpose:
              </Typography>
              <ul>
                <li><strong>Email &amp; password</strong> — so you can log in and recover your account if you forget your password.</li>
                <li><strong>Username</strong> — your identity on the platform; how others find and mention you.</li>
                <li><strong>IP address</strong> — to enforce rate limits and protect everyone from spam, bots, and brute-force attacks. We don't use it to identify or track you personally.</li>
                <li><strong>Uploaded media</strong> — to display your content on your timelines and event cards exactly as you intended.</li>
                <li><strong>Social graph (follows, friends)</strong> — to show you relevant content from people and timelines you care about.</li>
              </ul>
            </Box>

            <Divider />

            <Box>
              <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold', mb: 1 }}>
                4. How Long We Keep Your Data
              </Typography>
              <Typography variant="body1" color="text.primary" sx={{ mb: 1.5 }}>
                We keep your data for as long as your account is active. When you delete your account:
              </Typography>
              <ul>
                <li>Your profile, username, email, and account credentials are permanently removed.</li>
                <li>Media files (images, videos, audio) you uploaded that are not shared across other timelines are permanently deleted from our storage.</li>
                <li>Content shared or re-posted to community timelines by others may remain, attributed to a deleted/anonymous account, to preserve community context.</li>
              </ul>
              <Typography variant="body1" color="text.primary" sx={{ mt: 1 }}>
                IP log entries used for rate limiting are not permanently stored — they expire automatically on a short rolling window.
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold', mb: 1 }}>
                5. Who We Share Your Data With
              </Typography>
              <Typography variant="body1" color="text.primary" sx={{ mb: 1.5 }}>
                We do <strong>not</strong> sell your data. We do <strong>not</strong> run ads. The only third party involved in storing or processing your data is <strong>Cloudflare</strong>, the infrastructure provider that powers iTimeline:
              </Typography>
              <ul>
                <li><strong>Cloudflare D1</strong> — our database (accounts, timelines, events, comments).</li>
                <li><strong>Cloudflare R2</strong> — our file storage (uploaded images, videos, audio).</li>
                <li><strong>Cloudflare KV</strong> — fast cache used for session data and rate limiting counters.</li>
                <li><strong>Cloudflare Pages &amp; Workers</strong> — the servers that run iTimeline's backend and serve the frontend.</li>
              </ul>
              <Typography variant="body1" color="text.primary" sx={{ mt: 1 }}>
                Cloudflare operates under their own{' '}
                <Box
                  component="a"
                  href="https://www.cloudflare.com/privacypolicy/"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ color: 'primary.main', fontWeight: 'bold', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                >
                  Privacy Policy
                </Box>
                . No other third parties have access to your data.
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold', mb: 1 }}>
                6. Your Rights &amp; Choices
              </Typography>
              <Typography variant="body1" color="text.primary" sx={{ mb: 1 }}>
                You're always in control of your data:
              </Typography>
              <ul>
                <li><strong>Delete your account</strong> — you can permanently delete your account anytime from your Profile Settings. This triggers a full data scrub as described in Section 4.</li>
                <li><strong>Edit or remove content</strong> — you can edit or delete your own timeline events and comments at any time.</li>
                <li><strong>Request information</strong> — if you want to know exactly what data we hold about you, email us at <strong>support@i-timeline.com</strong> and we'll respond within a reasonable timeframe.</li>
              </ul>
            </Box>

            <Divider />

            <Box>
              <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold', mb: 1 }}>
                7. Children's Privacy
              </Typography>
              <Typography variant="body1" color="text.primary">
                iTimeline is not directed at children under the age of 13. We do not knowingly collect personal information from anyone under 13. If we become aware that a child under 13 has created an account, we will delete that account and its associated data promptly. If you believe a child has registered, please contact us at <strong>support@i-timeline.com</strong>.
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold', mb: 1 }}>
                8. Changes to This Policy
              </Typography>
              <Typography variant="body1" color="text.primary">
                If we ever make meaningful changes to how we handle your data, we'll update this page and revise the "Last Updated" date at the top. For significant changes, we may also notify you via email or an in-app notice.
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold', mb: 1 }}>
                9. Contact Us
              </Typography>
              <Typography variant="body1" color="text.primary">
                Have a question, concern, or data request? We're happy to help — reach out at{' '}
                <Box component="span" sx={{ fontWeight: 'bold' }}>support@i-timeline.com</Box>.
                {' '}You can also review our{' '}
                <Box
                  component={RouterLink}
                  to="/terms"
                  sx={{ color: 'primary.main', fontWeight: 'bold', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                >
                  Terms of Service
                </Box>
                {' '}for more about your rights and responsibilities on the platform.
              </Typography>
            </Box>

          </Box>

          <Box sx={{ mt: 5 }}>
            <Button
              component={RouterLink}
              to="/register"
              variant="contained"
              color="primary"
              sx={{
                borderRadius: '999px',
                px: 5,
                py: 1.3,
                fontWeight: 'bold',
                textTransform: 'none',
                boxShadow: '0 4px 14px 0 rgba(0,0,0,0.1)',
              }}
            >
              Back to Registration
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

export default PrivacyPolicy;
