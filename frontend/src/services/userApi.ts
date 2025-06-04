export const updateUserPanels = async (walletID: string, updateData: { 
  panelsPurchased: number;
  cost: number;
}) => {
  try {
    const response = await fetch(`https://buy-electricity-production.up.railway.app/api/users/${walletID}/panels`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      throw new Error(`Failed to update user panels: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating user panels:', error);
    throw error;
  }
  
};