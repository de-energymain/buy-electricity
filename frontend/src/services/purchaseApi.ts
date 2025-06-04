export const createPurchase = async (purchaseData: any) => {
  try {
    const response = await fetch('http://localhost:5000/api/purchases', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(purchaseData),
    });

    if (!response.ok) {
      throw new Error(`Failed to save purchase: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating purchase:', error);
    throw error;
  }
};

export const getPurchasesByWallet = async (walletAddress: string) => {
  try {
    const response = await fetch(`http://localhost:5000/api/purchases/wallet/${walletAddress}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        // No purchases found - return empty array
        return { data: [] };
      }
      throw new Error(`Failed to fetch purchases: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching purchases by wallet:', error);
    throw error;
  }
};