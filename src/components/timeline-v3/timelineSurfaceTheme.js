const TIMELINE_SURFACE_THEMES = Object.freeze({
  light: Object.freeze({
    canvas: 'linear-gradient(180deg, #ffc272af 0%, #efe4cd 52%, #f7f2e7 100%)',
    shell: 'rgba(255, 248, 235, 0.74)',
    shellBorder: 'transparent',
    shellBlur: 'none',
    tool: 'rgba(255, 251, 242, 0.8)',
    toolBorder: 'rgba(142, 120, 77, 0.28)',
    toolBlur: 'blur(6px)',
    panel: 'rgba(255, 252, 246, 0.82)',
    panelBorder: 'rgba(142, 120, 77, 0.2)',
    panelBlur: 'blur(8px)',
    glass: 'rgba(255, 253, 248, 0.9)',
    glassBorder: 'rgba(142, 120, 77, 0.32)',
    glassHover: 'rgba(255, 248, 233, 0.96)',
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
