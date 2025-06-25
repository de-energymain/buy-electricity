import { BREVO_CONFIG } from "../config/brevo";

interface PurchaseEmailData {
  orderDetails: {
    farm: string;
    location: string;
    panels: number;
    capacity: number;
    output: number;
    cost: number;
  };
  paymentMethod: string;
  tokenAmount: number;
  walletAddress: string;
  signature: string;
  wallet: string;
  timestamp: string;
}

export const sendPurchaseNotificationEmail = async (
  data: PurchaseEmailData
): Promise<boolean> => {
  try {
    // Get Solana explorer URL based on network (devnet for now)
    const explorerUrl = `https://explorer.solana.com/tx/${data.signature}?cluster=devnet`;

    // Send email via Brevo API
    const response = await fetch(BREVO_CONFIG.API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": BREVO_CONFIG.API_KEY,
      },
      body: JSON.stringify({
        sender: {
          name: "Renrg",
          email: "contact@renrg.io",
        },
        to: [
          {
            email: "sylvesterakon@gmail.com", // Your email for testing
            name: "Sylvester",
          },
        ],
        subject: `New Purchase Alert - ${data.paymentMethod} Payment`,
        htmlContent: `
          <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
                .header { background-color: #E9423A; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background-color: #f9f9f9; padding: 30px; }
                .section { background-color: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #E9423A; }
                .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
                .amount { font-size: 18px; font-weight: bold; color: #E9423A; }
                .signature { background-color: #f8f9fa; padding: 10px; border-radius: 4px; font-family: monospace; word-break: break-all; }
                .explorer-link { background-color: #E9423A; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block; margin-top: 10px; }
                .next-steps { background-color: #d1ecf1; padding: 15px; border-radius: 4px; margin-top: 15px; }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>🔔 New Purchase Notification</h1>
                <p>A customer has completed a purchase on De Energy platform</p>
              </div>
              
              <div class="content">
                <div class="section">
                  <h3>📋 Purchase Details</h3>
                  <p><strong>Farm:</strong> ${data.orderDetails.farm}</p>
                  <p><strong>Location:</strong> ${
                    data.orderDetails.location
                  }</p>
                  <p><strong>Solar Panels:</strong> ${
                    data.orderDetails.panels
                  } panels</p>
                  <p><strong>Total Capacity:</strong> ${data.orderDetails.capacity.toFixed(
                    2
                  )} kW</p>
                  <p><strong>Total Cost:</strong> <span class="amount">$${data.orderDetails.cost.toFixed(
                    2
                  )} USD</span></p>
                </div>

                <div class="section">
                  <h3>💳 Payment Information</h3>
                  <p><strong>Payment Method:</strong> ${data.paymentMethod}</p>
                  <p><strong>Amount Paid:</strong> <span class="amount">${data.tokenAmount.toFixed(
                    6
                  )} ${data.paymentMethod}</span></p>
                  <p><strong>Wallet Used:</strong> ${data.wallet}</p>
                  <p><strong>Wallet Address:</strong> ${data.walletAddress}</p>
                  <p><strong>Transaction Time:</strong> ${new Date(
                    data.timestamp
                  ).toLocaleString()}</p>
                </div>

                <div class="section">
                  <h3>🔗 Transaction Details</h3>
                  <p><strong>Transaction Signature:</strong></p>
                  <div class="signature">${data.signature}</div>
                  <p><strong>View on Solana Explorer:</strong></p>
                  <a href="${explorerUrl}" target="_blank" class="explorer-link">View Transaction</a>
                </div>

                <div class="next-steps">
                  <h3>⚡ Next Steps</h3>
                  <ul>
                    <li>✅ Verify the transaction on Solana Explorer</li>
                    <li>📊 Update the customer's panel allocation in the system</li>
                    <li>📧 Send confirmation email to customer</li>
                    <li>🏗️ Process the solar panel installation request</li>
                    <li>📱 Contact customer if additional information is needed</li>
                  </ul>
                </div>
              </div>

              <div class="footer">
                <p>This is an automated notification from De Energy purchase system.<br>
                Generated at ${new Date(data.timestamp).toLocaleString()}</p>
              </div>
            </body>
          </html>
        `,
        textContent: `
New Purchase Alert - ${data.paymentMethod} Payment

Purchase Details:
- Farm: ${data.orderDetails.farm}
- Location: ${data.orderDetails.location}
- Solar Panels: ${data.orderDetails.panels} panels
- Total Capacity: ${data.orderDetails.capacity.toFixed(2)} kW
- Total Cost: $${data.orderDetails.cost.toFixed(2)} USD

Payment Information:
- Payment Method: ${data.paymentMethod}
- Amount Paid: ${data.tokenAmount.toFixed(6)} ${data.paymentMethod}
- Wallet Used: ${data.wallet}
- Wallet Address: ${data.walletAddress}
- Transaction Time: ${new Date(data.timestamp).toLocaleString()}

Transaction Details:
- Transaction Signature: ${data.signature}
- View on Explorer: ${explorerUrl}

Next Steps:
- Verify the transaction on Solana Explorer
- Update the customer's panel allocation
- Send confirmation email to customer
- Process the solar panel installation request

Generated at ${new Date(data.timestamp).toLocaleString()}
        `,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log("✅ Admin notification email sent successfully via Brevo");
      console.log("📧 Email details:", {
        to: "sylvesterakon@gmail.com",
        subject: `🔔 New Purchase Alert - ${data.paymentMethod} Payment`,
        messageId: result.messageId,
        timestamp: new Date().toISOString(),
      });
      return true;
    } else {
      const errorData = await response.json();
      console.error(
        "❌ Failed to send admin notification email via Brevo:",
        errorData
      );
      return false;
    }
  } catch (error) {
    console.error(
      "❌ Error sending admin notification email via Brevo:",
      error
    );
    return false;
  }
};
