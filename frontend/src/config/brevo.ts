// Brevo (Sendinblue) API configuration
// Used across the application for sending emails (contact forms, purchase notifications, etc.)

export const BREVO_CONFIG = {
  API_KEY: import.meta.env.VITE_BREVO_API_KEY || "",
  API_URL: "https://api.brevo.com/v3/smtp/email",
} as const;
