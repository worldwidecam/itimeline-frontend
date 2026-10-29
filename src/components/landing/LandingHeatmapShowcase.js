import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  Chip,
  Button,
  useTheme,
  Tooltip,
  Breadcrumbs,
  Stack,
  keyframes
} from '@mui/material';
import {
  ZoomIn as ZoomInIcon,
  RestartAlt as ResetIcon,
  Whatshot as FireIcon,
  Place as PlaceIcon,
  EventNote as EventIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';

const pulseGlow = keyframes`
  0% { transform: scale(0.95); opacity: 0.85; }
  50% { transform: scale(1.15); opacity: 1; filter: drop-shadow(0 0 16px rgba(255, 87, 34, 0.95)); }
  100% { transform: scale(0.95); opacity: 0.85; }
`;

const rippleRing = keyframes`
  0% { transform: scale(0.6); opacity: 0.9; }
  100% { transform: scale(2.2); opacity: 0; }
`;

export default function LandingHeatmapShowcase() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Map zoom level: 0 = World, 1 = USA, 2 = California (Fresno)
  const [zoomLevel, setZoomLevel] = useState(0);

  return (
    <Box sx={{ width: '100%', maxWidth: '1200px', mx: 'auto' }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 4 },
          borderRadius: 3,
          background: isDark
            ? 'linear-gradient(135deg, rgba(22, 27, 34, 0.98), rgba(13, 17, 23, 0.98))'
            : 'linear-gradient(135deg, #ffffff, #f8f9fa)',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
          boxShadow: isDark ? '0 16px 36px rgba(0,0,0,0.5)' : '0 8px 24px rgba(0,0,0,0.06)'
        }}
      >
        <Grid container spacing={4} alignItems="center">
          {/* LEFT COLUMN: 1/3 Width - Organizer & Community Info */}
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              {/* Eyebrow subheader */}
              <Typography
                variant="caption"
                sx={{
                  color: 'primary.main',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  mb: 0.5
                }}
              >
                Community's Heat-Map
              </Typography>

              {/* Community Name */}
              <Typography variant="h5" sx={{ fontWeight: 800, mb: 2, lineHeight: 1.2 }}>
                Coffee Workers Guild
              </Typography>

              {/* Minimalist Line Work Organizer Avatar */}
              <Box
                sx={{
                  position: 'relative',
                  width: { xs: 170, sm: 200, md: 220 },
                  height: { xs: 170, sm: 200, md: 220 },
                  mx: 'auto',
                  mb: 2.5,
                  borderRadius: '50%',
                  p: '4px',
                  background: isDark
                    ? 'linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.06))'
                    : 'linear-gradient(135deg, rgba(0,0,0,0.1), rgba(0,0,0,0.04))',
                  boxShadow: isDark ? '0 8px 24px rgba(0, 0, 0, 0.4)' : '0 8px 24px rgba(0, 0, 0, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden'
                }}
              >
                <Box
                  component="img"
                  src="/organizer_avatar.jpg"
                  alt="Minimalist Line Art Organizer Avatar"
                  sx={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    bgcolor: '#ffffff'
                  }}
                />
              </Box>

              {/* Active Focus Stats Card */}
              <Card
                sx={{
                  p: 2,
                  mb: 2,
                  background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                  borderRadius: 2
                }}
              >
                <Stack spacing={1.2}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PlaceIcon sx={{ color: 'error.main', fontSize: 20 }} />
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {zoomLevel === 0 && 'Global Footprint'}
                        {zoomLevel === 1 && 'United States'}
                        {zoomLevel === 2 && 'Fresno County, CA'}
                      </Typography>
                    </Box>
                    <Chip
                      icon={<FireIcon sx={{ color: '#ff5722 !important' }} />}
                      label={zoomLevel === 2 ? '500 Members' : zoomLevel === 1 ? '2,840 CA' : '14,250 Total'}
                      size="small"
                      sx={{
                        fontWeight: 700,
                        bgcolor: 'rgba(255, 87, 34, 0.15)',
                        color: isDark ? '#ff7043' : '#d84315'
                      }}
                    />
                  </Box>

                  <Typography variant="caption" color="text.secondary">
                    {zoomLevel === 0 && 'Global outline of organizing chapters. Tap the glowing USA region to zoom in.'}
                    {zoomLevel === 1 && 'Heat is heavily concentrated on the West Coast. Tap California to inspect county lines.'}
                    {zoomLevel === 2 && 'Fresno Central #452 has the highest density! 100% of coworkers organizing together.'}
                  </Typography>

                  {zoomLevel === 2 && (
                    <Box sx={{ pt: 0.5, borderTop: `1px dashed ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}` }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <EventIcon fontSize="inherit" /> Scheduled Action: Friday Rally @ 5:00 PM
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </Card>

              {/* Navigation Back / Quick Jump Buttons */}
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  size="small"
                  variant={zoomLevel === 0 ? 'contained' : 'outlined'}
                  onClick={() => setZoomLevel(0)}
                  sx={{ textTransform: 'none', fontSize: '0.75rem', py: 0.4, px: 1.2 }}
                >
                  🌍 World
                </Button>
                <Button
                  size="small"
                  variant={zoomLevel === 1 ? 'contained' : 'outlined'}
                  onClick={() => setZoomLevel(1)}
                  sx={{ textTransform: 'none', fontSize: '0.75rem', py: 0.4, px: 1.2 }}
                >
                  🇺🇸 USA
                </Button>
                <Button
                  size="small"
                  variant={zoomLevel === 2 ? 'contained' : 'outlined'}
                  color="warning"
                  onClick={() => setZoomLevel(2)}
                  sx={{ textTransform: 'none', fontSize: '0.75rem', py: 0.4, px: 1.2 }}
                >
                  📍 California
                </Button>
              </Box>
            </Box>
          </Grid>

          {/* RIGHT COLUMN: 2/3 Width - Accurate SVG Map Canvas */}
          <Grid item xs={12} md={8}>
            <Box
              sx={{
                width: '100%',
                borderRadius: 3,
                overflow: 'hidden',
                background: isDark ? '#080d14' : '#edf2f7',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                p: { xs: 2, sm: 3 },
                position: 'relative'
              }}
            >
              {/* Map Header & Breadcrumbs Trail */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                <Breadcrumbs separator="›" aria-label="heat-map drilldown" sx={{ fontSize: '0.85rem' }}>
                  <Typography
                    onClick={() => setZoomLevel(0)}
                    sx={{
                      cursor: zoomLevel > 0 ? 'pointer' : 'default',
                      fontWeight: zoomLevel === 0 ? 800 : 500,
                      color: zoomLevel === 0 ? 'primary.main' : 'text.secondary',
                      '&:hover': zoomLevel > 0 ? { textDecoration: 'underline' } : {}
                    }}
                  >
                    🌍 World
                  </Typography>
                  {zoomLevel >= 1 && (
                    <Typography
                      onClick={() => setZoomLevel(1)}
                      sx={{
                        cursor: zoomLevel > 1 ? 'pointer' : 'default',
                        fontWeight: zoomLevel === 1 ? 800 : 500,
                        color: zoomLevel === 1 ? 'primary.main' : 'text.secondary',
                        '&:hover': zoomLevel > 1 ? { textDecoration: 'underline' } : {}
                      }}
                    >
                      🇺🇸 United States
                    </Typography>
                  )}
                  {zoomLevel === 2 && (
                    <Typography sx={{ fontWeight: 800, color: '#ff5722' }}>
                      📍 California (Fresno)
                    </Typography>
                  )}
                </Breadcrumbs>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    icon={<ZoomInIcon />}
                    label={zoomLevel === 0 ? 'Click USA to zoom' : zoomLevel === 1 ? 'Click CA to zoom' : 'Fresno County Active'}
                    size="small"
                    variant="outlined"
                    color={zoomLevel === 2 ? 'warning' : 'default'}
                    sx={{ fontSize: '0.75rem', fontWeight: 600 }}
                  />
                  {zoomLevel > 0 && (
                    <Tooltip title="Reset to World View">
                      <Button
                        size="small"
                        onClick={() => setZoomLevel(0)}
                        sx={{ minWidth: 32, p: 0.5 }}
                      >
                        <ResetIcon fontSize="small" />
                      </Button>
                    </Tooltip>
                  )}
                </Box>
              </Box>

              {/* MAP DISPLAY CANVAS */}
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: { xs: '4 / 3', sm: '16 / 10' },
                  maxHeight: '480px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  borderRadius: 2
                }}
              >
                {/* LEVEL 0: REAL WORLD OUTLINE MAP */}
                {zoomLevel === 0 && (
                  <Box
                    sx={{
                      position: 'relative',
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Box
                      component="img"
                      src="/maps/world.svg"
                      alt="World Outline Map"
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        filter: isDark ? 'none' : 'invert(0.7) hue-rotate(180deg)'
                      }}
                    />

                    {/* Glowing Hotspot over USA */}
                    <Box
                      onClick={() => setZoomLevel(1)}
                      sx={{
                        position: 'absolute',
                        left: '21.5%',
                        top: '30%',
                        cursor: 'pointer',
                        transform: 'translate(-50%, -50%)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center'
                      }}
                    >
                      {/* Pulsing Ripple Halo */}
                      <Box
                        sx={{
                          position: 'absolute',
                          width: 48,
                          height: 48,
                          borderRadius: '50%',
                          background: 'rgba(255, 87, 34, 0.35)',
                          animation: `${rippleRing} 2.2s infinite ease-out`
                        }}
                      />
                      {/* Center Glowing Dot */}
                      <Box
                        sx={{
                          width: 18,
                          height: 18,
                          borderRadius: '50%',
                          background: '#ff3d00',
                          border: '2px solid #ffffff',
                          boxShadow: '0 0 14px #ff3d00',
                          animation: `${pulseGlow} 2s infinite ease-in-out`
                        }}
                      />
                      {/* Callout Tooltip Badge */}
                      <Box
                        sx={{
                          mt: 0.8,
                          px: 1.2,
                          py: 0.4,
                          borderRadius: 1.5,
                          bgcolor: '#0f172a',
                          border: '1.5px solid #ff5722',
                          boxShadow: '0 4px 14px rgba(0,0,0,0.5)',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        <Typography variant="caption" sx={{ color: '#ffffff', fontWeight: 800, fontSize: '0.75rem' }}>
                          🔥 USA: 14,250 Members
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                )}

                {/* LEVEL 1: REAL USA 50-STATE OUTLINE MAP */}
                {zoomLevel === 1 && (
                  <Box
                    sx={{
                      position: 'relative',
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Box
                      component="img"
                      src="/maps/usa.svg"
                      alt="USA State Outline Map"
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain'
                      }}
                    />

                    {/* Glowing Hotspot over California */}
                    <Box
                      onClick={() => setZoomLevel(2)}
                      sx={{
                        position: 'absolute',
                        left: '11.5%',
                        top: '49%',
                        cursor: 'pointer',
                        transform: 'translate(-50%, -50%)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center'
                      }}
                    >
                      {/* Pulsing Ripple Halo */}
                      <Box
                        sx={{
                          position: 'absolute',
                          width: 54,
                          height: 54,
                          borderRadius: '50%',
                          background: 'rgba(255, 61, 0, 0.4)',
                          animation: `${rippleRing} 2s infinite ease-out`
                        }}
                      />
                      {/* Center Glowing Dot */}
                      <Box
                        sx={{
                          width: 18,
                          height: 18,
                          borderRadius: '50%',
                          background: '#ff1744',
                          border: '2px solid #ffffff',
                          boxShadow: '0 0 16px #ff1744',
                          animation: `${pulseGlow} 1.8s infinite ease-in-out`
                        }}
                      />
                      {/* California Tooltip Badge */}
                      <Box
                        sx={{
                          mt: 0.8,
                          px: 1.2,
                          py: 0.4,
                          borderRadius: 1.5,
                          bgcolor: '#0f172a',
                          border: '1.5px solid #ff1744',
                          boxShadow: '0 4px 14px rgba(0,0,0,0.5)',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        <Typography variant="caption" sx={{ color: '#ffffff', fontWeight: 800, fontSize: '0.75rem' }}>
                          🔥 California (2,840)
                        </Typography>
                      </Box>
                    </Box>

                    {/* Secondary regional indicators */}
                    <Box sx={{ position: 'absolute', right: '18%', top: '28%', textAlign: 'center' }}>
                      <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: '0.7rem', fontWeight: 600 }}>
                        🗽 NY: 1,800
                      </Typography>
                    </Box>
                  </Box>
                )}

                {/* LEVEL 2: REAL CALIFORNIA COUNTY OUTLINE MAP (FRESNO HIGHLIGHTED) */}
                {zoomLevel === 2 && (
                  <Box
                    sx={{
                      position: 'relative',
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Box
                      component="img"
                      src="/maps/california.svg"
                      alt="California County Outline Map"
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain'
                      }}
                    />

                    {/* Callout Card & Pulse over Fresno County */}
                    <Box
                      sx={{
                        position: 'absolute',
                        left: '52%',
                        top: '52%',
                        transform: 'translate(-50%, -50%)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        pointerEvents: 'none'
                      }}
                    >
                      {/* Pulsing Dot over Fresno */}
                      <Box sx={{ position: 'relative', width: 22, height: 22 }}>
                        <Box
                          sx={{
                            position: 'absolute',
                            width: 44,
                            height: 44,
                            top: -11,
                            left: -11,
                            borderRadius: '50%',
                            background: 'rgba(255, 23, 68, 0.45)',
                            animation: `${rippleRing} 1.8s infinite ease-out`
                          }}
                        />
                        <Box
                          sx={{
                            width: 22,
                            height: 22,
                            borderRadius: '50%',
                            background: '#ff1744',
                            border: '3px solid #ffffff',
                            boxShadow: '0 0 18px #ff1744',
                            animation: `${pulseGlow} 1.6s infinite ease-in-out`
                          }}
                        />
                      </Box>

                      {/* Fresno Information Card */}
                      <Card
                        sx={{
                          p: 1.5,
                          minWidth: 200,
                          bgcolor: '#0f172a',
                          border: '2px solid #ff1744',
                          borderRadius: 2,
                          boxShadow: '0 8px 24px rgba(0,0,0,0.6)'
                        }}
                      >
                        <Typography variant="subtitle2" sx={{ color: '#ffffff', fontWeight: 800, lineHeight: 1.2 }}>
                          🔥 Fresno County Hotspot
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#ff7043', fontWeight: 700, display: 'block', mt: 0.3 }}>
                          Heat Index: 500 Members Active
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.68rem', display: 'block' }}>
                          Fresno Central #452 • 100% Shop Floor Unionized
                        </Typography>
                      </Card>
                    </Box>
                  </Box>
                )}
              </Box>

              {/* Bottom interactive helper note */}
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  {zoomLevel === 0 && '💡 Live simulation: Tap the glowing USA region to drill down into statewide organizing.'}
                  {zoomLevel === 1 && '💡 Tap California to zoom in on county lines and local chapter density.'}
                  {zoomLevel === 2 && '🎉 Reached Local Chapter: Fresno County boasts 500 active working-class members organizing together!'}
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
