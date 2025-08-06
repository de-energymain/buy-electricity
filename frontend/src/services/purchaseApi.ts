import { API_CONFIG } from '../config/api';

export const createPurchase = async (purchaseData: any) => {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/api/purchases`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(purchaseData),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to save purchase: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating purchase:", error);
    throw error;
  }
};

export const getPurchasesByWallet = async (walletAddress: string) => {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/api/purchases/wallet/${walletAddress}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        // No purchases found - return empty array
        return { data: [] };
      }
      throw new Error(`Failed to fetch purchases: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching purchases by wallet:", error);
    throw error;
  }
};

// New: Get user's plant allocations across all plants
export const getUserPlantAllocations = async (walletAddress: string) => {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/api/users/${walletAddress}/allocations`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return { data: [] };
      }
      throw new Error(
        `Failed to fetch user allocations: ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching user allocations:", error);
    throw error;
  }
};

// New: Get plant capacity allocations
export const getPlantCapacityAllocations = async (plantId: string) => {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/api/plants/${plantId}/allocations`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch plant allocations: ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching plant allocations:", error);
    throw error;
  }
};

// New: Get purchases by plant
export const getPurchasesByPlant = async (plantId: string) => {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/api/purchases/plant/${plantId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return { data: [] };
      }
      throw new Error(
        `Failed to fetch plant purchases: ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching plant purchases:", error);
    throw error;
  }
};
