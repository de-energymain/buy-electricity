// Plant API service for backend - fetches plant data from external API
// This service fetches plant data including plantSize for capacity calculations

import fetch from "node-fetch";

export interface PlantData {
  id: string;
  name: string;
  plantSize: number; // Plant capacity in kWp
  location?: string;
  status?: string;
  [key: string]: any; // Allow for additional fields from API
}

// Plant ID mapping (from backend plant IDs to API plant IDs)
const PLANT_ID_MAPPING: { [key: string]: string } = {
  "6750afc5df6b8bbf630e3154": "6750afc5df6b8bbf630e3154", // Mantra Essence Cooperative Society
  "65b1791e7049bd5795c4343a": "65b1791e7049bd5795c4343a", // Green Energy Farm
  "65b1632ba656e2558b1d7f2f": "65b1632ba656e2558b1d7f2f", // Solar Valley Cooperative
};

// Get API plant ID from internal plant ID
export const getPlantApiId = (plantId: string): string => {
  return PLANT_ID_MAPPING[plantId] || plantId;
};

// Fetch plant data from external API
export const fetchPlantData = async (plantId: string): Promise<PlantData> => {
  try {
    const apiPlantId = getPlantApiId(plantId);

    const response = await fetch(
      `https://de-express-backend.onrender.com/api/plant/${apiPlantId}`,
      {
        headers: { accept: "*/*" },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch plant data: ${response.status} ${response.statusText}`
      );
    }

    const plantData = (await response.json()) as any;

    // Ensure we have required fields
    if (!plantData.plantSize) {
      console.warn(`Plant ${plantId} missing plantSize, defaulting to 1 kWp`);
      plantData.plantSize = 1;
    }

    return {
      id: plantId,
      name: plantData.name || `Plant ${plantId}`,
      plantSize: plantData.plantSize,
      location: plantData.location,
      status: plantData.status,
      ...plantData,
    };
  } catch (error) {
    console.error(`Error fetching plant data for ${plantId}:`, error);
    // Return default plant data as fallback
    return {
      id: plantId,
      name: `Plant ${plantId}`,
      plantSize: 1, // Fallback capacity
      location: "Unknown",
      status: "unknown",
    };
  }
};

// Fetch multiple plants data
export const fetchAllPlantsData = async (
  plantIds: string[]
): Promise<PlantData[]> => {
  try {
    const promises = plantIds.map((plantId) => fetchPlantData(plantId));
    return await Promise.all(promises);
  } catch (error) {
    console.error("Error fetching all plants data:", error);
    throw error;
  }
};

// Cache for plant data to avoid repeated API calls
const plantDataCache = new Map<
  string,
  { data: PlantData; timestamp: number }
>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Fetch plant data with caching
export const fetchPlantDataCached = async (
  plantId: string
): Promise<PlantData> => {
  const cached = plantDataCache.get(plantId);
  const now = Date.now();

  if (cached && now - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  const plantData = await fetchPlantData(plantId);
  plantDataCache.set(plantId, { data: plantData, timestamp: now });

  return plantData;
};

// Get all known plant IDs
export const getAllPlantIds = (): string[] => {
  return Object.keys(PLANT_ID_MAPPING);
};
