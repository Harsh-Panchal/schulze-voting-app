// App-wide constants

export const APP_NAME = "Schulze Vote";
export const APP_DESCRIPTION =
  "A fair voting platform using the Schulze beatpath method with rating intensity.";

// Rating scale
export const MIN_RATING = 0;
export const MAX_RATING = 10;

// Default algorithm parameters
export const DEFAULT_ALPHA = 0.5;
export const DEFAULT_BETA = 1.0;

// API base URL (injected at runtime via env variable)
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
