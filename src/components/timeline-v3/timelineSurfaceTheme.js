const TIMELINE_SURFACE_THEMES = Object.freeze({
  light: Object.freeze({
    canvas: 'hsl(41, 44%, 92%)',
    shell: 'hsl(41, 44%, 92%)',
    shellBorder: 'transparent',
    shellBlur: 'none',
    tool: 'hsl(41, 44%, 92%)',
    toolBorder: 'rgba(142, 120, 77, 0.18)',
    toolBlur: 'none',
    panel: 'hsl(41, 44%, 92%)',
    panelBorder: 'transparent',
    panelBlur: 'none',
    glass: 'hsl(41, 44%, 92%)',
    glassBorder: 'rgba(142, 120, 77, 0.2)',
    glassHover: 'hsl(41, 44%, 90%)',
  }),
  dark: Object.freeze({
    canvas: 'linear-gradient(180deg, #000000 0%, #0a1128 50%, #1a2456 100%)',
    shell: 'rgba(8, 12, 24, 0.28)',
    shellBorder: 'transparent',
    shellBlur: 'none',
    tool: 'rgba(10, 18, 40, 0.28)',
    toolBorder: 'rgba(125, 211, 252, 0.24)',
    toolBlur: 'blur(8px)',
    panel: 'rgba(6, 10, 24, 0.18)',
    panelBorder: 'transparent',
    panelBlur: 'blur(8px)',
    glass: 'rgba(11, 18, 32, 0.56)',
    glassBorder: 'rgba(125, 211, 252, 0.24)',
    glassHover: 'rgba(16, 28, 52, 0.7)',
  }),
});

export const getTimelineSurfaceTheme = (themeOrMode) => {
  const mode =
    typeof themeOrMode === 'string'
      ? themeOrMode
      : themeOrMode?.palette?.mode || 'light';

  return mode === 'dark' ? TIMELINE_SURFACE_THEMES.dark : TIMELINE_SURFACE_THEMES.light;
};

export default TIMELINE_SURFACE_THEMES;
