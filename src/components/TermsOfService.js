import React from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Container, Paper, Typography, Box, Button, Divider, useTheme } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { getGlassDialogPaperSx } from '../utils/formStyleGuide';

function TermsOfService() {
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
              Terms of Service
            </Typography>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            Last Updated: November 4, 2026
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, textAlign: 'left', lineHeight: 1.6 }}>
            <Box>
              <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold', mb: 1 }}>
                1. Acceptance of Terms
              </Typography>
              <Typography variant="body1" color="text.primary">
                By registering for an account, accessing, or using iTimeline (the "Service"), you agree to be bound by these Terms of Service ("Terms") and our{' '}
                <Box
                  component={RouterLink}
                  to="/privacy-policy"
                  sx={{ color: 'primary.main', fontWeight: 'bold', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                >
                  Privacy Policy
                </Box>
                . If you do not agree to these Terms, please do not use the Service.
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold', mb: 1 }}>
                2. User Eligibility &amp; Accounts
              </Typography>
              <Typography variant="body1" color="text.primary" sx={{ mb: 1 }}>
                To create an account and register for the Service, you must be at least 13 years old (or the minimum legal age in your country). You agree to provide accurate, current, and complete information during registration.
              </Typography>
              <Typography variant="body1" color="text.primary">
                You are solely responsible for maintaining the confidentiality of your account credentials and password. You accept full responsibility for all activities that occur under your account.
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold', mb: 1 }}>
                3. User-Generated Content, Originality &amp; DMCA Copyright Policy
              </Typography>
              <Typography variant="body1" color="text.primary" sx={{ mb: 1.5 }}>
                iTimeline allows you to create public and private timelines, post events (including text, images, audio, and videos), and share content. You retain ownership of all content you post.
              </Typography>
              <Typography variant="body1" color="text.primary" sx={{ mb: 1.5, fontWeight: 'medium' }}>
                You acknowledge, warrant, and agree that any content you upload, post, or publish on the Service is your own original work, or that you have obtained all necessary licenses, rights, and permissions to publish it. You are strictly prohibited from uploading third-party copyrighted materials (such as full-length movies, television episodes, music tracks, or other proprietary media) that you do not own or have permission to distribute. Infringing copyright laws or uploading illegal materials will result in immediate content removal and account termination for repeat infringers.
              </Typography>
              <Typography variant="body1" color="text.primary" sx={{ mb: 1.5 }}>
                By posting content to public sections of the Service, you grant iTimeline a worldwide, non-exclusive, royalty-free, transferable license to host, store, run, use, distribute, modify, display, and translate your content for the purpose of operating and improving the Service.
              </Typography>
              <Typography variant="body1" color="text.primary" sx={{ mb: 1, fontWeight: 'bold' }}>
                DMCA Takedown Notices (17 U.S.C. § 512):
              </Typography>
              <Typography variant="body1" color="text.primary" sx={{ mb: 1 }}>
                If you are a copyright owner (or authorized agent) and believe that user-submitted material on iTimeline infringes your copyright, please send a written takedown notice to our Designated Copyright Agent at{' '}
                <Box component="span" sx={{ fontWeight: 'bold' }}>support@i-timeline.com</Box>
                {' '}containing:
              </Typography>
              <ul>
                <li>Identification of the copyrighted work claimed to have been infringed.</li>
                <li>Identification of the specific URL or event on iTimeline where the allegedly infringing material is located.</li>
                <li>Your contact information (name, mailing address, telephone number, and email address).</li>
                <li>A statement that you have a good-faith belief that the disputed use is not authorized by the copyright owner, its agent, or the law.</li>
                <li>A statement, made under penalty of perjury, that the information in your notice is accurate and that you are the copyright owner or authorized to act on the copyright owner&apos;s behalf, along with your physical or electronic signature.</li>
              </ul>
            </Box>

            <Divider />

            <Box>
              <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold', mb: 1 }}>
                4. Code of Conduct &amp; Prohibited Content
              </Typography>
              <Typography variant="body1" color="text.primary" sx={{ mb: 1 }}>
                You agree NOT to use the Service to upload, publish, or share any content that:
              </Typography>
              <ul>
                <li>Is unlawful, harmful, threatening, abusive, harassing, defamatory, or hateful.</li>
                <li>Infringes upon any patent, trademark, trade secret, copyright, or privacy rights of others.</li>
                <li>Contains unauthorized advertisements, spam, or promotional material.</li>
                <li>Attempts to bypass or disrupt our security measures, rate-limits, or database integrity.</li>
                <li>Deceives other users or misrepresents timeline facts (malicious or fraudulent content).</li>
              </ul>
            </Box>

            <Divider />

            <Box>
              <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold', mb: 1 }}>
                5. Moderation, Safeguards, &amp; Account Suspension
              </Typography>
              <Typography variant="body1" color="text.primary" sx={{ mb: 1 }}>
                We prioritize community safety and database compliance. iTimeline reserves the right to:
              </Typography>
              <ul>
                <li>Place reported events into "Moderation Review" (safeguarding them from general view).</li>
                <li>Ban or restrict timelines that violate user conduct guidelines.</li>
                <li>Suspend or terminate accounts of repeat violators or users engaged in malicious attacks.</li>
              </ul>
            </Box>

            <Divider />

            <Box>
              <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold', mb: 1 }}>
                6. Disclaimer of Warranties
              </Typography>
              <Typography variant="body1" color="text.primary">
                The Service is provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind. iTimeline does not guarantee that the Service will always be safe, secure, or error-free, or that it will function without disruptions, delays, or imperfections.
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold', mb: 1 }}>
                7. Contact Information
              </Typography>
              <Typography variant="body1" color="text.primary">
                If you have any questions or feedback regarding these Terms, please contact us at support@i-timeline.com.
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

export default TermsOfService;
