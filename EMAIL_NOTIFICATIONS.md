# Email Notification System

## Overview

The email notification system sends automatic alerts to administrators when purchases are completed successfully. This includes all payment methods (SOL, USDC, NRG).

## Implementation Status

✅ **Frontend Integration**: Complete
✅ **Email Template**: Complete  
✅ **Error Handling**: Complete
🔧 **Backend Setup**: Requires configuration

## How It Works

### 1. Purchase Flow

1. User completes payment (SOL/USDC/NRG)
2. Transaction is confirmed on blockchain
3. `sendAdminNotification()` is called
4. Email is sent to admin
5. User is redirected to success page

### 2. Email Content

Each notification email includes:

- **Purchase Details**: Farm, location, panels, capacity, cost
- **Payment Information**: Method, amount, wallet used, wallet address
- **Transaction Details**: Signature, Solana Explorer link, timestamp
- **Next Steps**: Action items for the admin

### 3. Integration Points

Email notifications are triggered in:

- USDC payments (wallet adapter & Web3Auth)
- NRG payments (wallet adapter & Web3Auth)
- SOL payments (wallet adapter & Web3Auth)

## Configuration Options

### Option 1: Backend API (Recommended)

```typescript
// Frontend calls your backend
const response = await fetch("/api/send-email", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(emailContent),
});
```

**Setup Required:**

1. Implement `/api/send-email` endpoint (see `backend/routes/emailRoutes.ts`)
2. Install: `npm install nodemailer @types/nodemailer`
3. Configure environment variables:
   ```env
   EMAIL_USER=admin@deenergy.com
   EMAIL_PASSWORD=your-app-password
   ```

### Option 2: EmailJS (Client-side)

```typescript
// Install: npm install emailjs-com
import emailjs from "emailjs-com";

await emailjs.send(
  "YOUR_SERVICE_ID",
  "YOUR_TEMPLATE_ID",
  templateParams,
  "YOUR_PUBLIC_KEY"
);
```

**Setup Required:**

1. Create account at https://www.emailjs.com/
2. Create email template
3. Get service ID, template ID, and public key
4. Update `sendPurchaseNotificationEmailViaService()` in `emailApi.ts`

### Option 3: Third-party Services

- **SendGrid**: Enterprise email delivery
- **Mailgun**: Developer-friendly email API
- **AWS SES**: Cost-effective bulk email
- **Resend**: Modern email API

## Email Template Structure

```html
<div style="font-family: Arial, sans-serif; max-width: 600px;">
  <h2 style="color: #E9423A;">🔔 New Purchase Notification</h2>

  <!-- Purchase Details -->
  <div style="background-color: #f5f5f5; padding: 20px;">
    <h3>Purchase Details</h3>
    <p><strong>Farm:</strong> Mantra Essence Cooperative Society</p>
    <p><strong>Solar Panels:</strong> 29</p>
    <p><strong>Total Cost:</strong> $15,225.00 USD</p>
  </div>

  <!-- Payment Information -->
  <div style="background-color: #e8f4fd; padding: 20px;">
    <h3>Payment Information</h3>
    <p><strong>Payment Method:</strong> NRG</p>
    <p><strong>Amount Paid:</strong> 152250.000000 NRG</p>
    <p><strong>Wallet Address:</strong> CiYi...oMF</p>
  </div>

  <!-- Transaction Details -->
  <div style="background-color: #fff3cd; padding: 20px;">
    <h3>🔗 Transaction Details</h3>
    <p><strong>Transaction Signature:</strong> <code>3x7k...9mLs</code></p>
    <p>
      <strong>View on Explorer:</strong>
      <a href="https://explorer.solana.com/tx/...">Explorer Link</a>
    </p>
  </div>
</div>
```

## Testing

### 1. Enable Console Logging

Check browser console for:

```
✅ Admin notification email sent successfully
❌ Failed to send admin notification email: [error]
📧 Email service integration needed - add your email service configuration
```

### 2. Test Flow

1. Complete a test purchase
2. Check console for email notification logs
3. Verify email delivery (if configured)
4. Confirm transaction on Solana Explorer

### 3. Error Handling

- Email failures don't block payment flow
- Errors are logged to console
- Users still reach success page

## Security Considerations

### 1. Sensitive Data

- Transaction signatures are public (safe to include)
- Wallet addresses are public (safe to include)
- Private keys are never included

### 2. Email Security

- Use app passwords instead of account passwords
- Enable 2FA on email accounts
- Consider encrypted email services
- Rotate credentials regularly

### 3. Rate Limiting

- Implement rate limiting on email endpoint
- Monitor for spam/abuse
- Set daily email limits

## Monitoring & Analytics

### 1. Metrics to Track

- Email delivery success rate
- Time from purchase to email
- Admin response time
- Failed notification alerts

### 2. Logging

```typescript
console.log("📧 Admin notification sent:", {
  transactionId: signature,
  paymentMethod: "NRG",
  amount: tokenAmount,
  timestamp: new Date().toISOString(),
  emailDelivered: true,
});
```

### 3. Alerts

- Set up alerts for email delivery failures
- Monitor transaction volume spikes
- Track unusual payment patterns

## Customization

### 1. Email Content

- Update admin email address in `emailApi.ts`
- Customize email template HTML/CSS
- Add company branding
- Include additional transaction data

### 2. Multiple Recipients

```typescript
const emailContent = {
  to: ["admin@deenergy.com", "finance@deenergy.com", "support@deenergy.com"],
  // ... rest of email data
};
```

### 3. Different Templates by Payment Method

```typescript
const getEmailTemplate = (paymentMethod: string) => {
  switch (paymentMethod) {
    case "NRG":
      return "nrg-purchase-template";
    case "USDC":
      return "usdc-purchase-template";
    case "SOL":
      return "sol-purchase-template";
    default:
      return "default-purchase-template";
  }
};
```

## Next Steps

1. **Choose email service** (Backend API, EmailJS, or third-party)
2. **Configure credentials** (API keys, SMTP settings)
3. **Test email delivery** with a test purchase
4. **Monitor and refine** based on usage patterns
5. **Add customer notifications** (optional future enhancement)

## Files Modified

- `frontend/src/services/emailApi.ts` - Email service functions
- `frontend/src/pages/purchase/PaymentMethodPage.tsx` - Integration points
- `backend/routes/emailRoutes.ts` - Backend API example

## Environment Variables Needed

```env
# For backend email service
EMAIL_USER=admin@deenergy.com
EMAIL_PASSWORD=your-app-password

# For EmailJS (alternative)
EMAILJS_SERVICE_ID=your-service-id
EMAILJS_TEMPLATE_ID=your-template-id
EMAILJS_PUBLIC_KEY=your-public-key
```
