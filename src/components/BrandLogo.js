import React from 'react';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import brandLogo from 'assests/images/BrandLogo.png';

// BrandLogo prefers raster assets from public/:
// - /brand-logo.png (light)
// - /brand-logo-dark.png (optional dark variant)
// Falls back to the SVG monogram if image is missing.
export default function BrandLogo({ size = 26, withWordmark = true, rounded = false }) {
  const theme = useTheme();
  const [imgOk, setImgOk] = React.useState(true);
  const dark = theme.palette.mode === 'dark';
  const src = brandLogo; // built asset URL handled by bundler

  const color = dark ? theme.palette.common.white : theme.palette.text.primary;

  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, color }}>
      {imgOk ? (
        <img
          src={src}
          alt="Brand logo"
          width={size}
          height={size}
          loading="lazy"
          style={{
            display: 'block',
            width: size,
            height: size,
            objectFit: 'contain',
            imageRendering: 'auto',
            borderRadius: rounded ? 6 : 0,
          }}
          onError={() => setImgOk(false)}
        />
      ) : (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Brand monogram">
          <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M7.5 15.5L12 8l4.5 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 15.5h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )}
      {withWordmark && (
        <Box component="span" sx={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, letterSpacing: 0.4, lineHeight: 1 }}>
          Minimalist Fashion
        </Box>
      )}
    </Box>
  );
}
