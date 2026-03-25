import { alpha } from '@mui/material/styles';

export const getGlassDialogPaperSx = (theme) => ({
  borderRadius: 3.2,
  overflow: 'hidden',
  border: '1px solid',
  borderColor: theme.palette.mode === 'dark' ? alpha('#7dd3fc', 0.2) : alpha('#0369a1', 0.2),
  background: theme.palette.mode === 'dark'
    ? `linear-gradient(150deg, ${alpha('#0b1220', 0.96)} 0%, ${alpha('#111827', 0.94)} 100%)`
    : `linear-gradient(150deg, ${alpha('#ffffff', 0.97)} 0%, ${alpha('#f0f9ff', 0.94)} 100%)`,
  backdropFilter: 'blur(10px)',
});

export const getGlassInputSx = (theme) => ({
  '& .MuiInputLabel-root': {
    color: theme.palette.mode === 'dark' ? alpha('#e2e8f0', 0.9) : alpha('#0f172a', 0.75),
  },
  '& .MuiOutlinedInput-root': {
    borderRadius: 2.2,
    background: theme.palette.mode === 'dark'
      ? `linear-gradient(135deg, ${alpha('#0f172a', 0.64)} 0%, ${alpha('#1e293b', 0.48)} 100%)`
      : `linear-gradient(135deg, ${alpha('#ffffff', 0.86)} 0%, ${alpha('#f0f9ff', 0.86)} 100%)`,
    transition: 'border-color 220ms ease, box-shadow 220ms ease, background 220ms ease',
    '& fieldset': {
      borderColor: theme.palette.mode === 'dark' ? alpha('#cbd5e1', 0.24) : alpha('#0f172a', 0.2),
    },
    '&:hover fieldset': {
      borderColor: theme.palette.mode === 'dark' ? alpha('#bae6fd', 0.58) : alpha('#0284c7', 0.42),
    },
    '&.Mui-focused': {
      boxShadow: theme.palette.mode === 'dark'
        ? '0 0 0 3px rgba(14, 165, 233, 0.2)'
        : '0 0 0 3px rgba(14, 116, 144, 0.16)',
      '& fieldset': {
        borderColor: theme.palette.mode === 'dark' ? alpha('#7dd3fc', 0.72) : alpha('#0369a1', 0.55),
      },
    },
  },
});

export const getGlassSquareActionButtonSx = (theme) => ({
  minWidth: 44,
  width: 44,
  height: 44,
  borderRadius: 1,
  p: 0,
  bgcolor: theme.palette.mode === 'dark' ? '#0284c7' : '#0ea5e9',
  color: '#ffffff',
  transition: 'transform 180ms ease, box-shadow 220ms ease, background 220ms ease',
  '&:hover': {
    bgcolor: theme.palette.mode === 'dark' ? '#0369a1' : '#0284c7',
    boxShadow: theme.palette.mode === 'dark'
      ? '0 10px 22px rgba(2, 132, 199, 0.3)'
      : '0 10px 22px rgba(14, 116, 144, 0.2)',
    transform: 'translateY(-1px)',
  },
});

export const getGlassPillActionButtonSx = (theme) => ({
  borderRadius: '999px',
  px: 2.2,
  py: 0.75,
  fontWeight: 800,
  letterSpacing: '0.02em',
  textTransform: 'none',
  color: theme.palette.mode === 'dark' ? '#f8fafc' : '#0f172a',
  borderColor: theme.palette.mode === 'dark'
    ? alpha('#f8fafc', 0.36)
    : alpha('#0f172a', 0.3),
  background: theme.palette.mode === 'dark'
    ? `linear-gradient(135deg, ${alpha('#38bdf8', 0.22)} 0%, ${alpha('#0ea5e9', 0.12)} 100%)`
    : `linear-gradient(135deg, ${alpha('#ffffff', 0.84)} 0%, ${alpha('#e0f2fe', 0.84)} 100%)`,
  boxShadow: theme.palette.mode === 'dark'
    ? '0 10px 22px rgba(2, 132, 199, 0.22)'
    : '0 10px 22px rgba(14, 116, 144, 0.16)',
  transition: 'transform 180ms ease, box-shadow 220ms ease, border-color 220ms ease, background 220ms ease',
  '&:hover': {
    borderColor: theme.palette.mode === 'dark'
      ? alpha('#e0f2fe', 0.7)
      : alpha('#0369a1', 0.55),
    background: theme.palette.mode === 'dark'
      ? `linear-gradient(135deg, ${alpha('#38bdf8', 0.3)} 0%, ${alpha('#0284c7', 0.16)} 100%)`
      : `linear-gradient(135deg, ${alpha('#f0f9ff', 0.95)} 0%, ${alpha('#bae6fd', 0.9)} 100%)`,
    boxShadow: theme.palette.mode === 'dark'
      ? '0 14px 28px rgba(2, 132, 199, 0.3)'
      : '0 14px 28px rgba(14, 116, 144, 0.2)',
    transform: 'translateY(-1px)',
  },
});
