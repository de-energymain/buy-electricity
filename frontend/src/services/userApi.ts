export const getUserData = async (walletID: string) => {
  try {
    const response = await fetch(
      `https://kccgg4g8skcsc4cs8owoowc0.13.201.240.77.sslip.io/api/users/${walletID}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch user data: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching user data:", error);
    throw error;
  }
};

export const updateUserPanels = async (
  walletID: string,
  updateData: {
    panelsPurchased: number;
    cost: number;
  }
) => {
  try {
    const response = await fetch(
      `https://kccgg4g8skcsc4cs8owoowc0.13.201.240.77.sslip.io/api/users/${walletID}/panels`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to update user panels: ${response.statusText}`);
    }

    const result = await response.json();
    console.log("User API updated:", result);
    return result;
  } catch (error) {
    console.error("Error updating user panels:", error);
    throw error;
  }
};
