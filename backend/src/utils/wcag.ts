import { WcagLevel } from '../types';

/**
 * Convert HEX color to relative luminance (WCAG 2.1 formula)
 */
export function hexToRelativeLuminance(hex: string): number {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;

  const toLinear = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/**
 * Calculate contrast ratio between two HEX colors
 */
export function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = hexToRelativeLuminance(hex1);
  const l2 = hexToRelativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return parseFloat(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}

/**
 * Determine WCAG level from contrast ratio
 * Normal text: AA = 4.5:1, AAA = 7:1
 * Large text:  AA = 3:1,   AAA = 4.5:1
 */
export function getWcagLevel(contrast: number, largeText = false): WcagLevel {
  if (largeText) {
    if (contrast >= 4.5) return 'AAA';
    if (contrast >= 3.0) return 'AA';
    return 'Fail';
  }
  if (contrast >= 7.0) return 'AAA';
  if (contrast >= 4.5) return 'AA';
  if (contrast >= 3.0) return 'A';
  return 'Fail';
}

/**
 * Find the nearest accessible color by adjusting HSL lightness
 */
export function findAccessibleColor(
  foregroundHex: string,
  backgroundHex: string,
  targetLevel: 'AA' | 'AAA' = 'AA'
): { hex: string; contrast: number; deltaLightness: number } | null {
  const targetContrast = targetLevel === 'AAA' ? 7.0 : 4.5;
  const originalL = hexToHsl(foregroundHex).l;

  // Try increasing and decreasing lightness in steps
  for (let delta = 1; delta <= 100; delta++) {
    for (const direction of [1, -1]) {
      const newL = Math.max(0, Math.min(100, originalL + delta * direction));
      const { h, s } = hexToHsl(foregroundHex);
      const newHex = hslToHex(h, s, newL);
      const contrast = getContrastRatio(newHex, backgroundHex);
      if (contrast >= targetContrast) {
        return {
          hex: newHex,
          contrast,
          deltaLightness: Math.round((newL - originalL) * 10) / 10,
        };
      }
    }
  }
  return null;
}

// ─── Color space helpers ───────────────────────────────────────────────────────

export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const clean = hex.replace('#', '');
  let r = parseInt(clean.substring(0, 2), 16) / 255;
  let g = parseInt(clean.substring(2, 4), 16) / 255;
  let b = parseInt(clean.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

export function hslToHex(h: number, s: number, l: number): string {
  const sn = s / 100;
  const ln = l / 100;
  const a = sn * Math.min(ln, 1 - ln);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = ln - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function isValidHex(hex: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(hex);
}
