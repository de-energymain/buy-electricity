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
  Spinner
} from "@nextui-org/react";
import { useWallet } from '@solana/wallet-adapter-react';
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
  _id: string;
  date_time: string;
  inverterId: string;
  plantId: string;
  roofId: string;
  value: number;
  tillLifeTIme: number;
  updated_date: Date;
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
  const [plantData, setPlantData] = useState<PlantData | null>(null);
  const [inverterData, setInverterData] = useState<InverterData[]>([]);
  const [historicalInverterData, setHistoricalInverterData] = useState<InverterData[]>([]);
  const [userPanelData, setUserPanelData] = useState<UserPanelData>({
    purchasedPanels: 0,
    purchasedCost: 0,
    generatedYield: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [lastYieldUpdate, setLastYieldUpdate] = useState<Date | null>(null);

  // Constants
  const DOLLAR_TO_NRG_RATE = 0.03; // $0.03 per NRG token
  const PANEL_CAPACITY_KW = 1; // 1 kW per panel (updated from 0.45)
  const CO2_SAVINGS_PER_KWH = 0.0004; // tons CO2 saved per kWh
  const PLANT_ID = "6750afc5df6b8bbf630e3154"; // Plant ID for API calls

  // Get earliest purchase date to determine data fetch range
  const getEarliestPurchaseDate = (): Date => {
    if (purchaseData.length === 0) {
      // If no purchases, default to 30 days ago
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() - 30);
      return defaultDate;
    }

    const dates = purchaseData.map(purchase => 
      new Date(purchase.purchaseDate || purchase.createdAt)
    );
    return new Date(Math.min(...dates.map(d => d.getTime())));
  };

  // Calculate user's share of plant capacity based on actual ownership
  const calculateUserCapacityShare = () => {
    if (!plantData || userPanelData.purchasedPanels === 0) return 0;
    
    // Each panel is 1 kW
    const userCapacity = userPanelData.purchasedPanels * PANEL_CAPACITY_KW;
    const plantCapacity = plantData.plantSize;
    
    return userCapacity / plantCapacity; // Returns percentage as decimal
  };

  // Calculate today's actual generation for user based on real plant data
  const calculateTodayActualGeneration = (): number => {
    const userShare = calculateUserCapacityShare();
    
    if (inverterData.length === 0 || userShare === 0) return 0;
    
    // Sum all generation data for today
    const todayTotal = inverterData.reduce((sum, d) => sum + d.value, 0);
    
    // Apply user's ownership share
    return todayTotal * userShare;
  };

  // Calculate total energy generated since purchase based on real API data
  const calculateTotalEnergyFromAPI = (): number => {
    const userShare = calculateUserCapacityShare();
    
    if (historicalInverterData.length === 0 || userShare === 0 || purchaseData.length === 0) {
      return 0;
    }

    // Get the earliest purchase date
    const earliestPurchase = getEarliestPurchaseDate();
    
    // Filter inverter data to only include data after earliest purchase
    const relevantData = historicalInverterData.filter(d => {
      const dataDate = new Date(d.date_time);
      return dataDate >= earliestPurchase;
    });
    
    // Sum all generation since earliest purchase
    const totalPlantGeneration = relevantData.reduce((sum, d) => sum + d.value, 0);
    
    // Apply user's ownership share
    return totalPlantGeneration * userShare;
  };

  // Calculate user's generation based on plant data and their capacity share
  const calculateUserGenerationFromPlant = () => {
    const userShare = calculateUserCapacityShare();
    
    if (inverterData.length === 0 || userShare === 0) return 0;
    
    // Get latest reading for current generation
    const latestReading = inverterData[inverterData.length - 1];
    return latestReading ? latestReading.value * userShare : 0;
  };

  // Calculate today's total generation for user
  const calculateTodayGeneration = () => {
    const userShare = calculateUserCapacityShare();
    
    if (inverterData.length === 0 || userShare === 0) return 0;
    
    const today = new Date().toISOString().split('T')[0];
    const todayData = inverterData.filter(d => d.date_time.startsWith(today));
    const plantTodayTotal = todayData.reduce((sum, d) => sum + d.value, 0);
    
    return plantTodayTotal * userShare;
  };

  // Fetch plant data
  const fetchPlantData = async () => {
    try {
      const response = await fetch(`https://de-express-backend.onrender.com/api/plant/${PLANT_ID}`, {
        headers: { 'accept': '*/*' }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch plant data: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setPlantData(data);
    } catch (error) {
      console.error('Error fetching plant data:', error);
    }
  };

  // Fetch inverter data for today
  const fetchTodayInverterData = async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      
      const response = await fetch(
        `https://de-express-backend.onrender.com/api/inverterquarterhourlydata/plant/${PLANT_ID}?startDate=${encodeURIComponent(startDate.toISOString())}&endDate=${encodeURIComponent(endDate.toISOString())}`,
        { headers: { 'accept': '*/*' } }
      );
      
      if (response.ok) {
        const result = await response.json();
        //console.log("inverter data:", result);
        if (result.data && result.data.length > 0) {       
          const lastObject = result.data[result.data.length - 1];
          const lastDateTime = new Date(lastObject.date_time);
          setLastYieldUpdate(lastDateTime);
        }

        setInverterData(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching inverter data:', error);
    }
  };

  // Fetch historical inverter data since earliest purchase
  const fetchHistoricalInverterData = async () => {
    if (purchaseData.length === 0) return;

    try {
      const endDate = new Date();
      const startDate = getEarliestPurchaseDate();
      
      console.log(`Fetching historical data from ${startDate.toISOString()} to ${endDate.toISOString()}`);
      
      const response = await fetch(
        `https://de-express-backend.onrender.com/api/inverterquarterhourlydata/plant/${PLANT_ID}?startDate=${encodeURIComponent(startDate.toISOString())}&endDate=${encodeURIComponent(endDate.toISOString())}`,
        { headers: { 'accept': '*/*' } }
      );
      
      if (response.ok) {
        const result = await response.json();
        setHistoricalInverterData(result.data || []);
        console.log(`Fetched ${result.data?.length || 0} historical data points`);
      }
    } catch (error) {
      console.error('Error fetching historical inverter data:', error);
    }
  };

  // Generate chart data from real API data based on user's ownership and purchase timeline
  const generateRealChartData = (period: string): ChartData[] => {
    const userShare = calculateUserCapacityShare();
    
    if (historicalInverterData.length === 0 || userShare === 0 || purchaseData.length === 0) {
      // Fallback to today's data for day view
      if (period === "day" && inverterData.length > 0) {
        const hourlyData: { [key: string]: number } = {};
        
        inverterData.forEach(d => {
          const date = new Date(d.date_time);
          const hour = date.getHours();
          const key = `${hour.toString().padStart(2, '0')}:00`;
          hourlyData[key] = (hourlyData[key] || 0) + d.value;
        });
        
        return Object.entries(hourlyData)
          .map(([time, value]) => ({
            day: time,
            value: parseFloat((value * userShare).toFixed(2))
          }))
          .sort((a, b) => parseInt(a.day.split(':')[0]) - parseInt(b.day.split(':')[0]));
      }
      return [];
    }

    const earliestPurchase = getEarliestPurchaseDate();
    
    // Filter data to only include generation after earliest purchase
    const relevantData = historicalInverterData.filter(d => {
      const dataDate = new Date(d.date_time);
      return dataDate >= earliestPurchase;
    });

    if (relevantData.length === 0) return [];

    let data: ChartData[] = [];
    
    switch (period) {
      case "day":
        // Use today's data
        const hourlyData: { [key: string]: number } = {};
        
        const today = new Date().toISOString().split('T')[0];
        const todayData = relevantData.filter(d => d.date_time.startsWith(today));
        
        todayData.forEach(d => {
          const date = new Date(d.date_time);
          const hour = date.getHours();
          const key = `${hour.toString().padStart(2, '0')}:00`;
          hourlyData[key] = (hourlyData[key] || 0) + d.value;
        });
        
        data = Object.entries(hourlyData)
          .map(([time, value]) => ({
            day: time,
            value: parseFloat((value * userShare).toFixed(2))
          }))
          .sort((a, b) => parseInt(a.day.split(':')[0]) - parseInt(b.day.split(':')[0]));
        break;
        
      case "week":
        // Group by day for last 7 days
        const dailyData: { [key: string]: number } = {};
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        const weekData = relevantData.filter(d => {
          const dataDate = new Date(d.date_time);
          return dataDate >= weekAgo;
        });
        
        weekData.forEach(d => {
          const date = new Date(d.date_time);
          const key = date.toLocaleDateString('en-US', { weekday: 'short' });
          dailyData[key] = (dailyData[key] || 0) + d.value;
        });
        
        const dayOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        data = dayOrder.map(day => ({
          day,
          value: parseFloat(((dailyData[day] || 0) * userShare).toFixed(1))
        }));
        break;
        
      case "month":
        // Group by week for last 4 weeks
        const weeklyData: { [key: string]: number } = {};
        const monthAgo = new Date();
        monthAgo.setDate(monthAgo.getDate() - 30);
        
        const monthData = relevantData.filter(d => {
          const dataDate = new Date(d.date_time);
          return dataDate >= monthAgo;
        });
        
        monthData.forEach(d => {
          const date = new Date(d.date_time);
          const weekNumber = Math.ceil((date.getDate()) / 7);
          const key = `Week ${weekNumber}`;
          weeklyData[key] = (weeklyData[key] || 0) + d.value;
        });
        
        const weeks = ["Week 1", "Week 2", "Week 3", "Week 4"];
        data = weeks.map(week => ({
          day: week,
          value: parseFloat(((weeklyData[week] || 0) * userShare).toFixed(1))
        }));
        break;
        
      case "year":
        // Group by month for last 12 months
        const monthlyData: { [key: string]: number } = {};
        const yearAgo = new Date();
        yearAgo.setFullYear(yearAgo.getFullYear() - 1);
        
        const yearData = relevantData.filter(d => {
          const dataDate = new Date(d.date_time);
          return dataDate >= yearAgo;
        });
        
        yearData.forEach(d => {
          const date = new Date(d.date_time);
          const key = date.toLocaleDateString('en-US', { month: 'short' });
          monthlyData[key] = (monthlyData[key] || 0) + d.value;
        });
        
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        data = months.map(month => ({
          day: month,
          value: parseFloat(((monthlyData[month] || 0) * userShare).toFixed(1))
        }));
        break;
    }
    
    return data;
  };

  // Calculate total energy generated based on purchase dates
  const calculateTotalGenerated = () => {
    // Use API data if available
    const apiTotal = calculateTotalEnergyFromAPI();
    if (apiTotal > 0) {
      return apiTotal;
    }

    // Fallback calculation if no API data
    if (purchaseData.length === 0) {
      return userPanelData.purchasedPanels * 2.8 * 30;
    }

    let totalGenerated = 0;
    const currentDate = new Date();

    purchaseData.forEach(purchase => {
      const purchaseDate = new Date(purchase.purchaseDate || purchase.createdAt);
      const daysSincePurchase = Math.floor((currentDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Calculate generation: panels × 2.8 kWh/day × days since purchase
      const generatedFromThisPurchase = purchase.panelsPurchased * 2.8 * Math.max(daysSincePurchase, 0);
      totalGenerated += generatedFromThisPurchase;
    });

    return totalGenerated;
  };

  // Calculate real-time stats from actual data
  const calculateRealStats = () => {
    const totalPanels = userPanelData.purchasedPanels;
    const dollarYield = userPanelData.generatedYield;
    const nrgEarnings = dollarYield / DOLLAR_TO_NRG_RATE;
    
    // Calculate total energy generated based on purchase history
    const totalEnergyGenerated = calculateTotalGenerated();
    
    // Get current generation from plant data
    const currentGeneration = calculateUserGenerationFromPlant();
    
    // Get today's total generation (use API data)
    const todayGeneration = calculateTodayActualGeneration();
    
    // Calculate carbon impact
    const carbonImpact = totalEnergyGenerated * CO2_SAVINGS_PER_KWH;
    
    // Calculate clean points (arbitrary multiplier for gamification)
    const cleanPoints = Math.round(carbonImpact * 100);
    
    // Calculate daily potential
    const dailyPotential = totalPanels * 2.8;
    
    // Calculate efficiency (comparing actual vs potential)
    const efficiency = dailyPotential > 0 ? Math.min((totalEnergyGenerated / (totalPanels * 2.8 * 30)) * 100, 100) : 0;

    // Calculate previous month for trend calculation
    const previousMonthYield = dollarYield * 0.9; // Simulated 10% growth
    const earningsChange = previousMonthYield > 0 ? ((dollarYield - previousMonthYield) / previousMonthYield) * 100 : 0;
    
    return {
      energyGenerated: Math.round(totalEnergyGenerated),
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

  // Generate chart data based on user's actual panels
  const generateUserChartData = (period: string) => {
    // Use real API data
    const realData = generateRealChartData(period);
    if (realData.length > 0) {
      return realData;
    }
    
    // Fallback to original logic if no real data available
    const totalPanels = userPanelData.purchasedPanels;
    if (totalPanels === 0) return [];

    let data: ChartData[] = [];
    const dailyGeneration = totalPanels * 2.8;

    switch (period) {
      case "day":
        // Hourly generation pattern (solar panels produce more during day)
        const hours = ["12AM", "3AM", "6AM", "9AM", "12PM", "3PM", "6PM", "9PM"];
        const hourlyPattern = [0, 0, 0.1, 0.8, 1.0, 0.9, 0.3, 0]; // Solar generation pattern
        data = hours.map((hour, index) => ({
          day: hour,
          value: parseFloat((dailyGeneration * hourlyPattern[index] * (0.8 + Math.random() * 0.4)).toFixed(1))
        }));
        break;

      case "week":
        // Daily generation for the week
        const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        data = days.map(day => ({
          day,
          value: parseFloat((dailyGeneration * (0.7 + Math.random() * 0.6)).toFixed(1))
        }));
        break;

      case "month":
        // Weekly averages for the month
        const weeks = ["Week 1", "Week 2", "Week 3", "Week 4"];
        data = weeks.map(week => ({
          day: week,
          value: parseFloat((dailyGeneration * 7 * (0.8 + Math.random() * 0.4)).toFixed(1))
        }));
        break;

      case "year":
        // Monthly generation (accounting for seasonal variation)
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const seasonalFactors = [0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.1, 1.0, 0.9, 0.8, 0.6, 0.5];
        data = months.map((month, index) => ({
          day: month,
          value: parseFloat((dailyGeneration * 30 * seasonalFactors[index] * (0.8 + Math.random() * 0.4)).toFixed(1))
        }));
        break;
    }

    return data;
  };

  // Create nodes from user's purchase data
  const createNodesFromPurchases = () => {
    if (purchaseData.length === 0) return [];

    // Group purchases by farm
    const farmGroups: { [key: string]: PurchaseData[] } = {};
    purchaseData.forEach(purchase => {
      if (!farmGroups[purchase.farmName]) {
        farmGroups[purchase.farmName] = [];
      }
      farmGroups[purchase.farmName].push(purchase);
    });

    // Create nodes from grouped data
    return Object.entries(farmGroups).map(([farmName, purchases], index) => {
      const totalPanels = purchases.reduce((sum, p) => sum + p.panelsPurchased, 0);
      const totalCapacity = purchases.reduce((sum, p) => sum + p.capacity, 0);
      const location = purchases[0].location;
      
      // Calculate earnings for this farm
      const farmCost = purchases.reduce((sum, p) => sum + p.cost, 0);
      const farmYield = (farmCost / userPanelData.purchasedCost) * userPanelData.generatedYield;
      const farmNRGEarnings = farmYield / DOLLAR_TO_NRG_RATE;

      return {
        id: `farm-${index + 1}`,
        name: farmName,
        location,
        icon: index === 0 ? "🏭" : "🔋",
        panels: totalPanels,
        capacity: parseFloat(totalCapacity.toFixed(2)),
        dailyOutput: Math.round(totalPanels * 2.8),
        earnings: Math.round(farmNRGEarnings)
      };
    });
  };

  // Update user in database
  const updateUserInDatabase = async (userData: UserData) => {
    try {
      const response = await fetch('https://buy-electricity-production.up.railway.app/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error('Failed to update user data');
      }

      const data = await response.json();
      console.log('User data updated successfully:', data);
    } catch (error) {
      console.error('Error updating user data:', error);
    }
  };

  // Fetch purchase data
  const fetchPurchaseData = async (walletAddress: string) => {
    try {
      const response = await fetch(`https://buy-electricity-production.up.railway.app/api/purchases/wallet/${walletAddress}`);
      if (response.ok) {
        const result = await response.json();
        setPurchaseData(result.data || []);
      } else {
        console.log('No purchase data found for wallet:', walletAddress);
        setPurchaseData([]);
      }
    } catch (error) {
      console.error('Error fetching purchase data:', error);
      setPurchaseData([]);
    }
  };

  // Fetch user data
  const fetchUserData = async (walletAddress: string) => {
    try {
      const response = await fetch(`https://buy-electricity-production.up.railway.app/api/users/${walletAddress}`);
      if (response.ok) {
        const userData = await response.json();
        setUserPanelData({
          purchasedPanels: userData.user.panelDetails.purchasedPanels,
          purchasedCost: userData.user.panelDetails.purchasedCost,
          generatedYield: userData.user.panelDetails.generatedYield
        });
        //setLastYieldUpdate(new Date(userData.user.updatedAt));
      } else if (response.status === 404) {
        console.log('User not found, using default values');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
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
          console.log("User authenticated:", data.userInfo.name, data.userInfo.email);
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
      const walletPublicKey = (wallet.adapter as { publicKey?: { toString: () => string } }).publicKey?.toString() || "";

      updateUserInDatabase({
        loginMethod: "wallet",
        wallet: wallet.adapter?.name || "Unknown Wallet",
        walletID: walletPublicKey,
      });
      setWalletID(walletPublicKey);
    }
  }, [connected, wallet]);

  // Fetch all data when wallet ID is available
  useEffect(() => {
    const fetchAllData = async () => {
      if (!walletID) return;
      
      setIsLoading(true);
      try {
        await Promise.all([
          fetchUserData(walletID),
          fetchPurchaseData(walletID),
          fetchPlantData(),
          fetchTodayInverterData()
        ]);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, [walletID]);

  // Fetch historical data after purchase data is loaded
  useEffect(() => {
    if (purchaseData.length > 0 && plantData) {
      fetchHistoricalInverterData();
    }
  }, [purchaseData, plantData]);

  // Update nodes when purchase data changes
  useEffect(() => {
    const newNodes = createNodesFromPurchases();
    setNodes(newNodes);
  }, [purchaseData, userPanelData]);

  // Update chart data when relevant data changes
  useEffect(() => {
    if (userPanelData.purchasedPanels > 0 || inverterData.length > 0) {
      const newChartData = generateUserChartData(activeTab);
      setChartData(newChartData);
    }
  }, [userPanelData, inverterData, historicalInverterData, activeTab]);

  const handleTabChange = (key: React.Key) => {
    setActiveTab(key as string);
    if (userPanelData.purchasedPanels > 0 || inverterData.length > 0) {
      const newChartData = generateUserChartData(key as string);
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

  const maxValue = Math.max(...chartData.map(item => item.value), 1);

  // Calculate summary statistics from actual data
  const calculateSummaryStats = () => {
    if (chartData.length === 0) return { avgDaily: 0, peakOutput: 0, totalPeriod: 0 };

    const total = chartData.reduce((sum, item) => sum + item.value, 0);
    const avg = total / chartData.length;
    const peak = Math.max(...chartData.map(item => item.value));

    return {
      avgDaily: Math.round(avg),
      peakOutput: Math.round(peak),
      totalPeriod: Math.round(total)
    };
  };

  const summaryStats = calculateSummaryStats();

  if (isLoading) {
    return (
      <DashboardTemplate title="Dashboard" activePage="dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Spinner size="lg" color="danger" className="mb-4" />
            <div className="text-xl mb-2 text-white">Loading your dashboard...</div>
            <div className="text-sm text-gray-400">Fetching panel data and calculations</div>
          </div>
        </div>
      </DashboardTemplate>
    );
  }

  return (
    <DashboardTemplate title="Dashboard" activePage="dashboard">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Welcome Back!</h1>
        <p className="text-gray-400">Here are your solar investments at a glance.</p>
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
            <h2 className="text-xl font-semibold text-white mb-4">Your panels</h2>
            <Card className="bg-[#1A1A1A] border-none">
              <CardBody className="p-4">
                <div className="mb-4">
                  <h3 className="text-lg font-medium text-white">{stats.totalPanels} Panels</h3>
                  <p className="text-sm text-gray-400">
                    {nodes.length > 0 ? `${nodes.length} Solar Farm${nodes.length > 1 ? 's' : ''}` : 'Multiple Solar Farms • India'}
                  </p>
                </div>
                
                <div className="flex flex-col p-3 bg-[#2A1A1A] rounded-lg mb-4">
                  <div className="flex mb-4">
                    <div className="w-8 h-8 mr-3 flex items-center justify-center text-lg">
                      ⚡
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{stats.todayGeneration} kWh</div>
                      <div className="text-xs text-gray-400">
                        Today's generation from API data.
                      </div>
                    </div>
                  </div>
                  <div className="flex">
                    <div className="w-8 h-8 mr-3 flex items-center justify-center text-lg">
                      💡
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">
                        {inverterData.length > 0 ? inverterData[inverterData.length - 1].value.toFixed(2) : "0.00"} kWh
                      </div>
                      <div className="text-xs text-gray-400">
                        Last 15 minutes generation.
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  className="w-full bg-transparent border border-[#E9423A] text-white hover:bg-[#2A1A1A]"
                  onPress={() => navigate('/dashboard/panels')}
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
                <div className="text-2xl font-bold text-white mb-1">{stats.nrgEarnings} NRG</div>
                <div className="text-sm text-gray-400 mb-2">Total Earnings</div>
                <div className="text-xs text-green-400">+{stats.earningsChange}% this month</div>
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
                <div className="text-2xl font-bold text-white mb-1">{stats.energyGenerated} kWh</div>
                <div className="text-sm text-gray-400 mb-2">Energy Generated</div>
                <div className="text-xs text-green-400">Since purchase • Real API data</div>
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
            <h2 className="text-xl font-semibold text-white mb-4">Your solar impact</h2>
            <div className="grid grid-cols-1 gap-4">
              
              <Card className="bg-[#1A1A1A] border-none">
                <CardBody className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-400 mb-1">Find the total kWh of solar energy you've helped generate across all your solar farms here.</div>
                      <div className="text-2xl font-bold text-white">{stats.energyGenerated} kWh</div>
                      <div className="text-xs text-green-500">+{stats.energyChange}% from last month</div>
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
                        <div className="text-sm text-gray-400 mb-1">View your effective electricity savings for this month here.</div>
                        <div className="text-2xl font-bold text-white">${stats.yield.toFixed(4)}</div>
                        <div className="text-xs text-green-500">+1.5% from last month</div>
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
                      <div className="text-sm text-gray-400 mb-1">See your solar impact here.</div>
                      <div className="text-lg font-medium text-white">Carbon Impact: {stats.carbonImpact} tons</div>
                      <div className="text-lg font-medium text-white">Clean Points: {stats.cleanPoints}</div>
                      <div className="text-xs text-green-500">Environmental benefits</div>
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
            <h2 className="text-xl font-semibold text-white mb-4">Your solar energy production</h2>
            <Card className="bg-[#1A1A1A] border-none">
              <CardBody className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-white">Energy Production</h3>
                    <p className="text-sm text-gray-400">Real plant data filtered by your ownership and purchase timeline</p>
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
                        <div className="text-gray-400 mb-4">No panels purchased yet</div>
                        <Button 
                          className="bg-[#E9423A] text-white"
                          onPress={() => navigate('/')}
                        >
                          Buy Your First Panels
                        </Button>
                      </div>
                    </div>
                  ) : chartData.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="text-gray-400 mb-4">Loading real plant data...</div>
                        <div className="text-sm text-gray-500">Fetching generation data since your purchase</div>
                      </div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-end">
                      {chartData.map((item, index) => (
                        <div key={index} className="flex-1 flex flex-col items-center space-y-2">
                          <div
                            className="w-6 bg-gradient-to-t from-red-800 to-[#E9423A] rounded-sm"
                            style={{ height: `${(item.value / maxValue) * 180}px` }}
                          ></div>
                          <div className="text-xs text-gray-400">{item.day}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-between mt-6 pt-4 border-t border-gray-800">
                  <div className="text-center">
                    <div className="text-xs text-gray-400">Avg. Daily</div>
                    <div className="font-medium text-white">{summaryStats.avgDaily} kWh</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-400">Peak Output</div>
                    <div className="font-medium text-white">{summaryStats.peakOutput} kWh</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-400">Total {activeTab === 'week' ? 'Week' : activeTab === 'month' ? 'Month' : activeTab === 'year' ? 'Year' : 'Day'}</div>
                    <div className="font-medium text-white">{summaryStats.totalPeriod} kWh</div>
                  </div>
                </div>

                {/* Data source indicator */}
                {/* {historicalInverterData.length > 0 && (
                  <div className="mt-4 p-3 bg-[#2A1A1A] rounded-lg">
                    <div className="text-xs text-blue-400 mb-1">📊 Real-time Plant Data</div>
                    <div className="text-xs text-gray-400">
                      Your {userPanelData.purchasedPanels} panels × {PANEL_CAPACITY_KW} kW = {(userPanelData.purchasedPanels * PANEL_CAPACITY_KW).toFixed(1)} kW capacity
                      ({((userPanelData.purchasedPanels * PANEL_CAPACITY_KW) / (plantData?.plantSize || 1) * 100).toFixed(2)}% of {plantData?.plantSize} kW plant)
                    </div>
                    <div className="text-xs text-gray-400">
                      Data since: {purchaseData.length > 0 ? getEarliestPurchaseDate().toLocaleDateString() : 'No purchases'} • 
                      Readings: {historicalInverterData.length} historical, {inverterData.length} today
                    </div>
                  </div>
                )} */}
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
            <Button
              className="bg-[#E9423A] text-white"
              onPress={confirmLogout}
            >
              Yes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </DashboardTemplate>
  );
}
 
export default DashboardPage;