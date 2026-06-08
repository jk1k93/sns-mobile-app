/**
 * App-wide brand and UI colors (shared across screens and components).
 */
export const AppColors = {
  primary: "#52B69A",
  primaryDark: "#3D9A82",
  primaryDisabled: "#B2DFDB",
  surfaceMuted: "#E0F2F1",
  textMuted: "#546E7A",
  textDark: "#263238",
  placeholder: "#90A4AE",
  white: "#FFFFFF",
  onPrimaryDisabledLabel: "rgba(255, 255, 255, 0.75)",
  error: "#C62828",
  success: "#2E7D32",
} as const;

export type AppColorKey = keyof typeof AppColors;
