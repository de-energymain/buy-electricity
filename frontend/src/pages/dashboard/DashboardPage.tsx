import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardBody,
  Button,
  Tabs,
  Tab,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Spinner,
} from "@nextui-org/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { ArrowRight, Zap, DollarSign } from "lucide-react";
import DashboardTemplate from "../../components/DashboardTemplate";

interface NodeData {
  id: string;
  name: string;
  location: string;
  icon: string;
  panels: number;
  capacity: number;
  dailyOutput: number;
  earnings: number;
}

interface ChartData {
  day: string;
  value: number;
}

interface UserData {
  loginMethod: string;
  userEmail?: string;
  userName?: string;
  wallet?: string;
  walletID?: string;
}

interface PlantData {
  _id: string;
  plantName: string;
  gridStatus: string;
  plantLocation: string;
  plantSize: number;
  proposalType: {
    type: string;
    tariff: string;
    tariffEscalation: string;
  };
  projectCode: string;
  plantType: string;
  industryType: string;
  latitude: number;
  longitude: number;
  tenure: number;
  currency: string;
  commissionDate: string;
  completionDate: string;
  estimatedGeneration: {
    [year: string]: {
      [month: string]: number;
    };
  };
  estimatedYield: {
    [year: string]: {
      [month: string]: number;
    };
  };
  degradationFactor: number;
}

interface InverterData {
  _id?: string;
  date_time?: string; // For backward compatibility
  time?: string; // For hourly data (e.g., "22:00")
  date?: string; // For daily aggregated data (e.g., "2025-06-05")
  inverterId?: string;
  plantId?: string;
  roofId?: string;
  value: number;
  cumulativeKWH?: number;
  averageValue?: number;
  recordCount?: number;
  hasData?: boolean;
  tillLifeTIme?: number;
  updated_date?: Date;
}

interface PlantAllocation {
  plantId: string;
  plantName: string;
  panels: number;
  capacity: number;
  cost: number;
}

interface PurchaseData {
  _id: string;
  farmName: string;
  location: string;
  walletAddress: string;
  paymentMethod: string;
  tokenAmount: number;
  panelsPurchased: number;
  cost: number;
  capacity: number;
  output: number;
  transactionHash: string;
  purchaseDate?: string;
  plantAllocations: PlantAllocation[];
  createdAt: string;
  updatedAt: string;
}

interface UserPanelData {
  purchasedPanels: number;
  purchasedCost: number;
  generatedYield: number;
}

function DashboardPage() {
  const navigate = useNavigate();
  const { disconnect, connected, wallet } = useWallet();
  const [activeTab, setActiveTab] = useState("week");
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [walletID, setWalletID] = useState<string | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [purchaseData, setPurchaseData] = useState<PurchaseData[]>([]);
  const [plantDataMap, setPlantDataMap] = useState<Map<string, PlantData>>(
    new Map()
  );
  const [historicalInverterDataMap, setHistoricalInverterDataMap] = useState<
    Map<string, InverterData[]>
  >(new Map());
  const [todayInverterDataMap, setTodayInverterDataMap] = useState<
    Map<string, InverterData[]>
  >(new Map());
  const [userPanelData, setUserPanelData] = useState<UserPanelData>({
    purchasedPanels: 0,
    purchasedCost: 0,
    generatedYield: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [lastYieldUpdate, setLastYieldUpdate] = useState<Date | null>(null);

  // Constants
  const DOLLAR_TO_NRG_RATE = 0.03; // $0.03 per NRG token
  const PANEL_CAPACITY_KW = 1; // 1 kW per panel (updated from 0.45)
  const CO2_SAVINGS_PER_KWH = 0.0004; // tons CO2 saved per kWh

  // Get all plant IDs from user's purchase allocations
  const getUserPlantIds = (): string[] => {
    const plantIds = new Set<string>();

    purchaseData.forEach((purchase) => {
      if (purchase.plantAllocations) {
        purchase.plantAllocations.forEach((allocation) => {
          plantIds.add(allocation.plantId);
        });
      }
    });

    const ids = Array.from(plantIds);
    console.log("🌱 User's plant IDs:", ids);
    return ids;
  };

  // Helper function to get date/time from inverter data item
  const getDateTimeFromItem = (item: InverterData): Date | null => {
    // Handle different API response structures
    if (item.date_time) {
      return new Date(item.date_time);
    } else if (item.date) {
      return new Date(item.date);
    } else if (item.time) {
      // For hourly data like "22:00", combine with today's date
      const today = new Date();
      const [hours, minutes] = item.time.split(":");
      return new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        parseInt(hours),
        parseInt(minutes)
      );
    }
    return null;
  };

  // Helper function to get time key for grouping
  const getTimeKey = (item: InverterData, period: string): string => {
    const date = getDateTimeFromItem(item);
    if (!date) return "";

    switch (period) {
      case "day":
        if (item.time) {
          return item.time; // Use as-is for hourly data
        }
        return `${date.getHours().toString().padStart(2, "0")}:00`;

      case "week":
      case "month":
      case "year":
        if (item.date) {
          return new Date(item.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
        }
        return date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });

      default:
        return "";
    }
  };

  // Get earliest purchase date to determine data fetch range
  const getEarliestPurchaseDate = (): Date => {
    if (purchaseData.length === 0) {
      // If no purchases, default to 30 days ago
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() - 30);
      return defaultDate;
    }

    const dates = purchaseData.map(
      (purchase) => new Date(purchase.purchaseDate || purchase.createdAt)
    );
    return new Date(Math.min(...dates.map((d) => d.getTime())));
  };

  // Calculate user's capacity share for a specific plant
  const calculateUserCapacityShareForPlant = (plantId: string): number => {
    const plantData = plantDataMap.get(plantId);
    if (!plantData) {
      console.log(`❌ No plant data found for ${plantId}`);
      return 0;
    }

    let userPanelsInPlant = 0;
    purchaseData.forEach((purchase) => {
      if (purchase.plantAllocations) {
        purchase.plantAllocations.forEach((allocation) => {
          if (allocation.plantId === plantId) {
            userPanelsInPlant += allocation.panels;
          }
        });
      }
    });

    if (userPanelsInPlant === 0) {
      console.log(`❌ User has no panels in plant ${plantId}`);
      return 0;
    }

    const userCapacity = userPanelsInPlant * PANEL_CAPACITY_KW;
    const plantCapacity = plantData.plantSize;

    const share = userCapacity / plantCapacity;
    console.log(`🌱 Plant ${plantId} share calculation:`, {
      userPanelsInPlant,
      userCapacity,
      plantCapacity,
      share: share.toFixed(4),
    });

    return share; // Returns percentage as decimal
  };

  // Calculate total energy generated since purchase based on real API data across all plants
  const calculateTotalEnergyFromAPI = (): number => {
    if (purchaseData.length === 0) return 0;

    let totalEnergy = 0;
    const earliestPurchase = getEarliestPurchaseDate();

    // Iterate through each plant the user has allocations in
    const userPlantIds = getUserPlantIds();

    userPlantIds.forEach((plantId) => {
      const userShare = calculateUserCapacityShareForPlant(plantId);
      const historicalData = historicalInverterDataMap.get(plantId) || [];

      if (userShare === 0 || historicalData.length === 0) return;

      // Filter inverter data to only include data after earliest purchase
      const relevantData = historicalData.filter((d) => {
        const dataDate = getDateTimeFromItem(d);
        return dataDate && dataDate >= earliestPurchase;
      });

      // Sum all generation since earliest purchase for this plant
      const plantGeneration = relevantData.reduce((sum, d) => sum + d.value, 0);

      // Apply user's ownership share for this plant
      totalEnergy += plantGeneration * userShare;
    });

    return totalEnergy;
  };

  // Calculate user's current generation based on plant data and their capacity share across all plants
  const calculateUserGenerationFromAllPlants = () => {
    let totalGeneration = 0;
    const userPlantIds = getUserPlantIds();

    console.log("🔥 Debug calculateUserGenerationFromAllPlants:");
    console.log("User plant IDs:", userPlantIds);

    userPlantIds.forEach((plantId) => {
      const userShare = calculateUserCapacityShareForPlant(plantId);
      const todayData = todayInverterDataMap.get(plantId) || [];

      console.log(`Plant ${plantId}:`, {
        userShare,
        todayDataLength: todayData.length,
        latestValue:
          todayData.length > 0
            ? todayData[todayData.length - 1].value
            : "no data",
      });

      if (userShare === 0 || todayData.length === 0) return;

      // Get latest reading for current generation
      const latestReading = todayData[todayData.length - 1];
      if (latestReading) {
        const userPlantGeneration = latestReading.value * userShare;
        totalGeneration += userPlantGeneration;
        console.log(
          `Plant ${plantId} latest generation:`,
          latestReading.value,
          "× user share",
          userShare,
          "=",
          userPlantGeneration
        );
      }
    });

    console.log("Total current generation:", totalGeneration);
    return totalGeneration;
  };

  // Calculate today's actual generation for user based on real plant data across all plants
  const calculateTodayActualGeneration = (): number => {
    let totalTodayGeneration = 0;
    const userPlantIds = getUserPlantIds();

    console.log("🔥 Debug calculateTodayActualGeneration:");
    console.log("User plant IDs:", userPlantIds);
    console.log("Today inverter data map:", todayInverterDataMap);
    console.log("Plant data map:", plantDataMap);

    userPlantIds.forEach((plantId) => {
      const userShare = calculateUserCapacityShareForPlant(plantId);
      const todayData = todayInverterDataMap.get(plantId) || [];

      console.log(`Plant ${plantId}:`, {
        userShare,
        todayDataLength: todayData.length,
        todayData: todayData.slice(-5), // Last 5 readings
      });

      if (userShare === 0 || todayData.length === 0) return;

      // Sum all generation data for today for this plant
      const plantTodayTotal = todayData.reduce((sum, d) => sum + d.value, 0);

      console.log(`Plant ${plantId} total today:`, plantTodayTotal);

      // Apply user's ownership share for this plant
      const userPlantGeneration = plantTodayTotal * userShare;
      totalTodayGeneration += userPlantGeneration;

      console.log(`User's share for plant ${plantId}:`, userPlantGeneration);
    });

    console.log("Total today generation:", totalTodayGeneration);
    return totalTodayGeneration;
  };

  // Fetch plant data
  // Fetch plant data for all user plants
  const fetchAllPlantData = async () => {
    const userPlantIds = getUserPlantIds();
    if (userPlantIds.length === 0) return;

    console.log("🌱 Fetching plant data for plants:", userPlantIds);

    const plantPromises = userPlantIds.map(async (plantId) => {
      try {
        const response = await fetch(
          `https://de-express-backend.onrender.com/api/plant/${plantId}`,
          { headers: { accept: "*/*" } }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch plant data for ${plantId}: ${response.status}`
          );
        }

        const data = await response.json();
        return { plantId, data };
      } catch (error) {
        console.error(`Error fetching plant data for ${plantId}:`, error);
        return { plantId, data: null };
      }
    });

    const results = await Promise.all(plantPromises);
    const newPlantDataMap = new Map<string, PlantData>();

    results.forEach(({ plantId, data }) => {
      if (data) {
        newPlantDataMap.set(plantId, data);
      }
    });

    setPlantDataMap(newPlantDataMap);
    console.log(
      "🌱 Plant data map updated:",
      Array.from(newPlantDataMap.keys())
    );
  };

  // Fetch today's data for all user plants
  const fetchTodayInverterDataForAllPlants = async () => {
    const userPlantIds = getUserPlantIds();
    if (userPlantIds.length === 0) return;

    console.log("📊 Fetching today's inverter data for plants:", userPlantIds);

    const endDate = new Date();
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    const inverterPromises = userPlantIds.map(async (plantId) => {
      try {
        const response = await fetch(
          `https://de-express-backend.onrender.com/api/inverterquarterhourlydata/plant/${plantId}?startDate=${encodeURIComponent(
            startDate.toISOString()
          )}&endDate=${encodeURIComponent(endDate.toISOString())}`,
          { headers: { accept: "*/*" } }
        );

        if (response.ok) {
          const result = await response.json();
          return { plantId, data: result.data || [] };
        }
        return { plantId, data: [] };
      } catch (error) {
        console.error(
          `Error fetching today inverter data for ${plantId}:`,
          error
        );
        return { plantId, data: [] };
      }
    });

    const results = await Promise.all(inverterPromises);
    const newTodayDataMap = new Map<string, InverterData[]>();

    let latestUpdate: Date | null = null;
    results.forEach(({ plantId, data }) => {
      newTodayDataMap.set(plantId, data);

      // Find the latest update time across all plants
      if (data.length > 0) {
        const lastObject = data[data.length - 1];
        if (lastObject.time) {
          const today = new Date();
          const timeString = lastObject.time;
          const [hours, minutes] = timeString.split(":");
          const lastDateTime = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate(),
            parseInt(hours),
            parseInt(minutes)
          );
          if (!latestUpdate || lastDateTime > latestUpdate) {
            latestUpdate = lastDateTime;
          }
        } else if (lastObject.date) {
          const date = new Date(lastObject.date);
          if (!latestUpdate || date > latestUpdate) {
            latestUpdate = date;
          }
        }
      }
    });

    setTodayInverterDataMap(newTodayDataMap);
    if (latestUpdate) {
      setLastYieldUpdate(latestUpdate);
    }
    console.log(
      "📊 Today inverter data map updated:",
      Array.from(newTodayDataMap.keys())
    );
  };

  // Fetch historical inverter data for all user plants since earliest purchase
  const fetchHistoricalInverterDataForAllPlants = async () => {
    const userPlantIds = getUserPlantIds();
    if (userPlantIds.length === 0 || purchaseData.length === 0) return;

    console.log(
      "📈 Fetching historical inverter data for plants:",
      userPlantIds
    );

    const earliestPurchase = getEarliestPurchaseDate();
    const endDate = new Date();

    const inverterPromises = userPlantIds.map(async (plantId) => {
      try {
        const response = await fetch(
          `https://de-express-backend.onrender.com/api/inverterquarterhourlydata/plant/${plantId}?startDate=${encodeURIComponent(
            earliestPurchase.toISOString()
          )}&endDate=${encodeURIComponent(endDate.toISOString())}`,
          { headers: { accept: "*/*" } }
        );

        if (response.ok) {
          const result = await response.json();
          return { plantId, data: result.data || [] };
        }
        return { plantId, data: [] };
      } catch (error) {
        console.error(
          `Error fetching historical inverter data for ${plantId}:`,
          error
        );
        return { plantId, data: [] };
      }
    });

    const results = await Promise.all(inverterPromises);
    const newHistoricalDataMap = new Map<string, InverterData[]>();

    results.forEach(({ plantId, data }) => {
      newHistoricalDataMap.set(plantId, data);
    });

    setHistoricalInverterDataMap(newHistoricalDataMap);
    console.log(
      "📈 Historical inverter data map updated:",
      Array.from(newHistoricalDataMap.keys())
    );
  };

  // Generate chart data from real API data based on user's ownership and purchase timeline
  // Generate chart data from real API data based on user's ownership and purchase timeline across all plants
  const generateRealChartData = (period: string): ChartData[] => {
    if (purchaseData.length === 0) {
      return [];
    }

    const userPlantIds = getUserPlantIds();
    if (userPlantIds.length === 0) {
      return [];
    }

    // Aggregate data across all plants
    const aggregatedData: { [key: string]: number } = {};

    userPlantIds.forEach((plantId) => {
      const userShare = calculateUserCapacityShareForPlant(plantId);
      if (userShare === 0) return;

      // Use appropriate data source based on period
      let dataSource: InverterData[] = [];
      if (period === "day") {
        dataSource = todayInverterDataMap.get(plantId) || [];
      } else {
        dataSource = historicalInverterDataMap.get(plantId) || [];

        // Filter historical data to only include generation after earliest purchase
        const earliestPurchase = getEarliestPurchaseDate();
        dataSource = dataSource.filter((d) => {
          const dataDate = getDateTimeFromItem(d);
          return dataDate && dataDate >= earliestPurchase;
        });
      }

      if (dataSource.length === 0) return;

      dataSource.forEach((d) => {
        const timeKey = getTimeKey(d, period);
        if (timeKey) {
          if (!aggregatedData[timeKey]) {
            aggregatedData[timeKey] = 0;
          }
          aggregatedData[timeKey] += d.value * userShare;
        }
      });
    });

    // Convert to chart format
    return Object.entries(aggregatedData)
      .sort(([a], [b]) => {
        if (period === "day") {
          // Sort by time for hourly data
          return a.localeCompare(b);
        } else {
          // Sort by date for daily data
          return new Date(a).getTime() - new Date(b).getTime();
        }
      })
      .map(([key, value]) => ({
        day: key,
        value: Math.max(0, parseFloat(value.toFixed(2))), // Ensure non-negative values
      }));
  };

  // Calculate real-time stats from actual data (SAME LOGIC AS PANELS PAGE)
  const calculateRealStats = () => {
    const totalPanels = userPanelData.purchasedPanels;
    const dollarYield = userPanelData.generatedYield;
    const nrgEarnings = dollarYield / DOLLAR_TO_NRG_RATE;

    // Calculate total energy generated based on purchase history (SAME AS PANELS PAGE)
    const totalEnergyGenerated = calculateTotalEnergyFromAPI();

    // Get current generation from plant data
    const currentGeneration = calculateUserGenerationFromAllPlants();

    // Get today's total generation (use API data)
    const todayGeneration = calculateTodayActualGeneration();

    // Calculate carbon impact
    const carbonImpact = totalEnergyGenerated * CO2_SAVINGS_PER_KWH;

    // Calculate clean points (arbitrary multiplier for gamification)
    const cleanPoints = Math.round(carbonImpact * 100);

    // Calculate daily potential
    const dailyPotential = totalPanels * 2.8;

    // Calculate efficiency (comparing actual vs potential)
    const efficiency =
      dailyPotential > 0
        ? Math.min((totalEnergyGenerated / (totalPanels * 2.8 * 30)) * 100, 100)
        : 0;

    // Calculate previous month for trend calculation
    const previousMonthYield = dollarYield * 0.9; // Simulated 10% growth
    const earningsChange =
      previousMonthYield > 0
        ? ((dollarYield - previousMonthYield) / previousMonthYield) * 100
        : 0;

    return {
      energyGenerated: Math.round(totalEnergyGenerated), // NOW USES SAME CALCULATION AS PANELS PAGE
      energyChange: Math.round(Math.random() * 15 + 5), // Simulated growth
      nrgEarnings: Math.round(nrgEarnings),
      earningsChange: Math.round(earningsChange),
      carbonImpact: parseFloat(carbonImpact.toFixed(2)),
      carbonChange: Math.round(Math.random() * 20 + 5), // Simulated growth
      cleanPoints,
      pointsChange: Math.round(Math.random() * 10 + 2), // Simulated growth
      efficiency: Math.round(efficiency),
      target: 75,
      lowest: Math.max(Math.round(efficiency - 15), 45),
      highest: Math.min(Math.round(efficiency + 10), 85),
      yield: dollarYield,
      totalPanels,
      currentGeneration: parseFloat(currentGeneration.toFixed(3)), // Real-time generation
      todayGeneration: parseFloat(todayGeneration.toFixed(2)), // Today's total from API
    };
  };

  const stats = calculateRealStats();

  // Create nodes from user's purchase data
  const createNodesFromPurchases = () => {
    if (purchaseData.length === 0) return [];

    // Group purchases by farm
    const farmGroups: { [key: string]: PurchaseData[] } = {};
    purchaseData.forEach((purchase) => {
      if (!farmGroups[purchase.farmName]) {
        farmGroups[purchase.farmName] = [];
      }
      farmGroups[purchase.farmName].push(purchase);
    });

    // Create nodes from grouped data
    return Object.entries(farmGroups).map(([farmName, purchases], index) => {
      const totalPanels = purchases.reduce(
        (sum, p) => sum + p.panelsPurchased,
        0
      );
      const totalCapacity = purchases.reduce((sum, p) => sum + p.capacity, 0);
      const location = purchases[0].location;

      // Calculate earnings for this farm
      const farmCost = purchases.reduce((sum, p) => sum + p.cost, 0);
      const farmYield =
        (farmCost / userPanelData.purchasedCost) * userPanelData.generatedYield;
      const farmNRGEarnings = farmYield / DOLLAR_TO_NRG_RATE;

      return {
        id: `farm-${index + 1}`,
        name: farmName,
        location,
        icon: index === 0 ? "🏭" : "🔋",
        panels: totalPanels,
        capacity: parseFloat(totalCapacity.toFixed(2)),
        dailyOutput: Math.round(totalPanels * 2.8),
        earnings: Math.round(farmNRGEarnings),
      };
    });
  };

  // Update user in database
  const updateUserInDatabase = async (userData: UserData) => {
    try {
      const response = await fetch(
        "https://kccgg4g8skcsc4cs8owoowc0.13.201.240.77.sslip.io/api/users",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userData),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update user data");
      }

      const data = await response.json();
      console.log("User data updated successfully:", data);
    } catch (error) {
      console.error("Error updating user data:", error);
    }
  };

  // Fetch purchase data
  const fetchPurchaseData = async (walletAddress: string) => {
    try {
      console.log("🔍 Fetching purchase data for wallet:", walletAddress);
      const response = await fetch(
        `https://kccgg4g8skcsc4cs8owoowc0.13.201.240.77.sslip.io/api/purchases/wallet/${walletAddress}`
      );
      if (response.ok) {
        const result = await response.json();
        console.log("✅ Purchase data received:", result);
        setPurchaseData(result.data || []);
      } else {
        console.log(
          "❌ No purchase data found for wallet:",
          walletAddress,
          "Status:",
          response.status
        );
        setPurchaseData([]);
      }
    } catch (error) {
      console.error("💥 Error fetching purchase data:", error);
      setPurchaseData([]);
    }
  };

  // Calculate user panel data from purchase data
  const calculateUserPanelDataFromPurchases = () => {
    if (purchaseData.length === 0) {
      return {
        purchasedPanels: 0,
        purchasedCost: 0,
        generatedYield: 0,
      };
    }

    const totals = purchaseData.reduce(
      (acc, purchase) => {
        acc.purchasedPanels += purchase.panelsPurchased || 0;
        acc.purchasedCost += purchase.cost || 0;
        return acc;
      },
      { purchasedPanels: 0, purchasedCost: 0, generatedYield: 0 }
    );

    console.log("📊 Calculated user panel data from purchases:", totals);
    return totals;
  };

  // Update authentication status when wallet connection changes
  useEffect(() => {
    if (connected) {
      localStorage.setItem("walletConnected", "true");
    }
  }, [connected]);

  useEffect(() => {
    const session = localStorage.getItem("web3AuthSession");
    if (session) {
      try {
        const data = JSON.parse(session);
        if (data.userInfo && data.userInfo.email && data.userInfo.name) {
          console.log(
            "User authenticated:",
            data.userInfo.name,
            data.userInfo.email
          );
          localStorage.setItem("username", data.userInfo.name);
          if (data.publicKey) {
            console.log("Public key available:", data.publicKey);
            localStorage.setItem("publicKey", data.publicKey);
            setWalletID(data.publicKey);
          }

          updateUserInDatabase({
            loginMethod: "email",
            userName: data.userInfo.name,
            userEmail: data.userInfo.email,
            walletID: data.publicKey,
          });
        }
      } catch (e) {
        console.error("Error parsing Web3Auth session", e);
      }
    }
    if (connected && wallet) {
      const walletPublicKey =
        (
          wallet.adapter as { publicKey?: { toString: () => string } }
        ).publicKey?.toString() || "";

      updateUserInDatabase({
        loginMethod: "wallet",
        wallet: wallet.adapter?.name || "Unknown Wallet",
        walletID: walletPublicKey,
      });
      setWalletID(walletPublicKey);
    }
  }, [connected, wallet]);

  // Update user panel data whenever purchase data changes
  useEffect(() => {
    const newUserPanelData = calculateUserPanelDataFromPurchases();
    setUserPanelData(newUserPanelData);
  }, [purchaseData]);

  // Fetch purchase data first when wallet ID is available
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!walletID) {
        console.log("⏳ No walletID available yet");
        return;
      }

      console.log("🚀 Starting initial data fetch for walletID:", walletID);
      setIsLoading(true);
      try {
        await fetchPurchaseData(walletID);
      } catch (error) {
        console.error("Error fetching purchase data:", error);
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [walletID]);

  // Fetch plant and inverter data after purchase data is loaded
  useEffect(() => {
    console.log(
      "📊 Purchase data state updated:",
      purchaseData.length,
      "purchases"
    );

    const fetchPlantRelatedData = async () => {
      if (purchaseData.length === 0) {
        console.log("⏳ No purchase data available yet");
        return;
      }

      console.log("🌱 Fetching plant and inverter data based on purchase data");
      try {
        await Promise.all([
          fetchAllPlantData(),
          fetchTodayInverterDataForAllPlants(),
        ]);

        // After plant and inverter data is loaded, fetch historical data
        console.log("📈 Fetching historical inverter data");
        await fetchHistoricalInverterDataForAllPlants();
      } catch (error) {
        console.error("Error fetching plant-related data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlantRelatedData();
  }, [purchaseData]);

  // Update nodes when purchase data changes
  useEffect(() => {
    const newNodes = createNodesFromPurchases();
    setNodes(newNodes);
  }, [purchaseData, userPanelData]);

  // Update chart data when relevant data changes
  useEffect(() => {
    if (
      userPanelData.purchasedPanels > 0 ||
      Array.from(todayInverterDataMap.values()).some((data) => data.length > 0)
    ) {
      const newChartData = generateRealChartData(activeTab);
      setChartData(newChartData);
    }
  }, [
    userPanelData,
    todayInverterDataMap,
    historicalInverterDataMap,
    activeTab,
  ]);

  const handleTabChange = (key: React.Key) => {
    setActiveTab(key as string);
    if (
      userPanelData.purchasedPanels > 0 ||
      Array.from(todayInverterDataMap.values()).some((data) => data.length > 0)
    ) {
      const newChartData = generateRealChartData(key as string);
      setChartData(newChartData);
    }
  };

  const confirmLogout = async () => {
    if (disconnect) {
      await disconnect();
    }

    localStorage.removeItem("web3AuthSession");
    localStorage.setItem("walletConnected", "false");

    navigate("/");
    setIsLogoutModalOpen(false);
  };

  const cancelLogout = () => {
    setIsLogoutModalOpen(false);
  };

  const maxValue = Math.max(...chartData.map((item) => item.value), 1);

  // Calculate summary statistics from actual data
  const calculateSummaryStats = () => {
    if (chartData.length === 0)
      return { avgDaily: 0, peakOutput: 0, totalPeriod: 0 };

    const total = chartData.reduce((sum, item) => sum + item.value, 0);
    const avg = total / chartData.length;
    const peak = Math.max(...chartData.map((item) => item.value));

    return {
      avgDaily: Math.round(avg),
      peakOutput: Math.round(peak),
      totalPeriod: Math.round(total),
    };
  };

  const summaryStats = calculateSummaryStats();

  if (isLoading) {
    return (
      <DashboardTemplate title="Dashboard" activePage="dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Spinner size="lg" color="danger" className="mb-4" />
            <div className="text-xl mb-2 text-white">
              Loading your dashboard...
            </div>
            <div className="text-sm text-gray-400">
              Fetching panel data and calculations
            </div>
          </div>
        </div>
      </DashboardTemplate>
    );
  }

  return (
    <DashboardTemplate title="Dashboard" activePage="dashboard">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Welcome Back!</h1>
        <p className="text-gray-400">
          Here are your solar investments at a glance.
        </p>
        {lastYieldUpdate && (
          <p className="text-xs text-gray-500 mt-1">
            Last updated: {lastYieldUpdate.toLocaleString()}
          </p>
        )}
      </div>

      {/* Top Row - Panels and Key Metrics Cards on same line */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Left - Your panels section */}
        <div className="lg:col-span-1 h-full overflow-y-auto">
          <div className="sticky top-0 z-10">
            <h2 className="text-xl font-semibold text-white mb-4">
              Your panels
            </h2>
            <Card className="bg-[#1A1A1A] border-none">
              <CardBody className="p-4">
                <div className="mb-4">
                  <h3 className="text-lg font-medium text-white">
                    {stats.totalPanels} Panels
                  </h3>
                  <p className="text-sm text-gray-400">
                    {nodes.length > 0
                      ? `${nodes.length} Solar Farm${
                          nodes.length > 1 ? "s" : ""
                        }`
                      : "Multiple Solar Farms • India"}
                  </p>
                </div>

                <div className="flex flex-col p-3 bg-[#2A1A1A] rounded-lg mb-4">
                  <div className="flex mb-4">
                    <div className="w-8 h-8 mr-3 flex items-center justify-center text-lg">
                      ⚡
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">
                        {stats.todayGeneration} kWh
                      </div>
                      <div className="text-xs text-gray-400">
                        Daily generation from all assets.
                      </div>
                    </div>
                  </div>
                  <div className="flex">
                    <div className="w-8 h-8 mr-3 flex items-center justify-center text-lg">
                      💡
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">
                        {calculateUserGenerationFromAllPlants().toFixed(2)} kWh
                      </div>
                      <div className="text-xs text-gray-400">
                        Last 15 minutes generation.
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  className="w-full bg-transparent border border-[#E9423A] text-white hover:bg-[#2A1A1A]"
                  onPress={() => navigate("/dashboard/panels")}
                >
                  View All Panels
                </Button>
              </CardBody>
            </Card>
          </div>
        </div>

        {/* Right - Key Metrics Cards */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold text-white mb-4">Key Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* NRG Earnings */}
            <Card
              className="bg-[#1A1A1A] border-none cursor-pointer hover:bg-[#2A1A1A] transition-all duration-300"
              isPressable
            >
              <CardBody className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-[#E9423A] rounded-lg flex items-center justify-center">
                    <DollarSign size={20} className="text-white" />
                  </div>
                  <ArrowRight size={16} className="text-[#E9423A]" />
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                  {stats.nrgEarnings} NRG
                </div>
                <div className="text-sm text-gray-400 mb-2">Total Earnings</div>
                <div className="text-xs text-green-400">
                  +{stats.earningsChange}% this month
                </div>
              </CardBody>
            </Card>

            {/* Energy Generated */}
            <Card
              className="bg-[#1A1A1A] border-none hover:bg-[#2A1A1A] transition-all duration-300 cursor-pointer"
              isPressable
            >
              <CardBody className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <Zap size={20} className="text-green-400" />
                  </div>
                  <ArrowRight size={16} className="text-green-400" />
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                  {stats.energyGenerated} kWh
                </div>
                <div className="text-sm text-gray-400 mb-2">
                  Energy Generated
                </div>
                <div className="text-xs text-green-400">Lifetime</div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Left Column */}
        <div className="lg:col-span-1 space-y-6">
          <div className="hidden">
            <h2 className="text-xl font-semibold text-white mb-4">
              Your solar impact
            </h2>
            <div className="grid grid-cols-1 gap-4">
              <Card className="bg-[#1A1A1A] border-none">
                <CardBody className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-400 mb-1">
                        Find the total kWh of solar energy you've helped
                        generate across all your solar farms here.
                      </div>
                      <div className="text-2xl font-bold text-white">
                        {stats.energyGenerated} kWh
                      </div>
                      <div className="text-xs text-green-500">
                        +{stats.energyChange}% from last month
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-[#2A1A1A] rounded-lg flex items-center justify-center text-2xl">
                      🔋
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card className="bg-[#1A1A1A] border-none">
                <CardBody className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-400 mb-1">
                        View your effective electricity savings for this month
                        here.
                      </div>
                      <div className="text-2xl font-bold text-white">
                        ${stats.yield.toFixed(4)}
                      </div>
                      <div className="text-xs text-green-500">
                        +1.5% from last month
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-[#2A1A1A] rounded-lg flex items-center justify-center text-2xl">
                      👛
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card className="bg-[#1A1A1A] border-none">
                <CardBody className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-400 mb-1">
                        See your solar impact here.
                      </div>
                      <div className="text-lg font-medium text-white">
                        Carbon Impact: {stats.carbonImpact} tons
                      </div>
                      <div className="text-lg font-medium text-white">
                        Clean Points: {stats.cleanPoints}
                      </div>
                      <div className="text-xs text-green-500">
                        Environmental benefits
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-[#2A1A1A] rounded-lg flex items-center justify-center text-2xl">
                      🌱
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 -mt-20">
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">
              Your solar energy production
            </h2>
            <Card className="bg-[#1A1A1A] border-none">
              <CardBody className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-white">
                      Energy Production
                    </h3>
                    <p className="text-sm text-gray-400">
                      Real plant data filtered by your ownership and purchase
                      timeline
                    </p>
                  </div>
                  <Tabs
                    aria-label="Time Period"
                    selectedKey={activeTab}
                    onSelectionChange={handleTabChange}
                    color="danger"
                    radius="full"
                    size="sm"
                  >
                    <Tab key="day" title="Day" />
                    <Tab key="week" title="Week" />
                    <Tab key="month" title="Month" />
                    <Tab key="year" title="Year" />
                  </Tabs>
                </div>

                <div className="h-64 relative">
                  {stats.totalPanels === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="text-gray-400 mb-4">
                          No panels purchased yet
                        </div>
                        <Button
                          className="bg-[#E9423A] text-white"
                          onPress={() => navigate("/")}
                        >
                          Buy Your First Panels
                        </Button>
                      </div>
                    </div>
                  ) : chartData.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="text-gray-400 mb-4">
                          Loading real plant data...
                        </div>
                        <div className="text-sm text-gray-500">
                          Fetching generation data since your purchase
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-end">
                      {chartData.map((item, index) => (
                        <div
                          key={index}
                          className="flex-1 flex flex-col items-center space-y-2"
                        >
                          <div
                            className="w-6 bg-gradient-to-t from-red-800 to-[#E9423A] rounded-sm"
                            style={{
                              height: `${(item.value / maxValue) * 180}px`,
                            }}
                          ></div>
                          <div className="text-xs text-gray-400">
                            {item.day}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-between mt-6 pt-4 border-t border-gray-800">
                  <div className="text-center">
                    <div className="text-xs text-gray-400">Avg. Daily</div>
                    <div className="font-medium text-white">
                      {summaryStats.avgDaily} kWh
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-400">Peak Output</div>
                    <div className="font-medium text-white">
                      {summaryStats.peakOutput} kWh
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-400">
                      Total{" "}
                      {activeTab === "week"
                        ? "Week"
                        : activeTab === "month"
                        ? "Month"
                        : activeTab === "year"
                        ? "Year"
                        : "Day"}
                    </div>
                    <div className="font-medium text-white">
                      {summaryStats.totalPeriod} kWh
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>

      {/* Logout Modal */}
      <Modal
        isOpen={isLogoutModalOpen}
        onClose={cancelLogout}
        className="bg-[#1A1A1A] text-white"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            Confirm Logout
          </ModalHeader>
          <ModalBody>
            <p>Are you sure do you want to logout?</p>
          </ModalBody>
          <ModalFooter>
            <Button
              className="bg-transparent text-gray-400 hover:bg-[#2A1A1A]"
              onPress={cancelLogout}
            >
              No
            </Button>
            <Button className="bg-[#E9423A] text-white" onPress={confirmLogout}>
              Yes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </DashboardTemplate>
  );
}

export default DashboardPage;
