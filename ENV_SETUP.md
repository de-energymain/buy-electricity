# Environment Variables Setup

This project uses environment variables to securely manage API keys and other sensitive configuration.

## Required Environment Variables

### Frontend (.env)

```bash
# Brevo (Sendinblue) API Configuration
VITE_BREVO_API_KEY=your_brevo_api_key_here
```

## Setup Instructions

1. **Copy the example file:**
   ```bash
   cp .env.example .env
   ```

2. **Get your Brevo API Key:**
   - Go to [Brevo Dashboard](https://app.brevo.com/settings/keys/api)
   - Create a new API key or copy an existing one
   - Update the `VITE_BREVO_API_KEY` in your `.env` file

3. **Deployment:**
   - For Vercel: Add environment variables in your Vercel dashboard
   - For other platforms: Set the environment variables in your deployment configuration

## Security Note

- Never commit `.env` files to version control
- The `.env` file is already added to `.gitignore`
- Use `.env.example` to document required variables without exposing secrets
