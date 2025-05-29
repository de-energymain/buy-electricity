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