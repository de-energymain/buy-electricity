import { useState, useEffect } from "react";
import { useWallet } from '@solana/wallet-adapter-react';
import {
  Card,
  CardBody,
  Button,
  Progress,
  Spinner,
  Chip,
  Tabs,
  Tab,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem
} from "@nextui-org/react";
import {
  Activity,
  Zap,
  Sun,
  TrendingUp,
  MapPin,
  Calendar,
  Building,
  Gauge,
  BarChart3,
  Leaf,
  ChevronDown,
  AlertCircle,
  WifiOff
} from "lucide-react";
import LineChart from "../../components/LineChart";
import DashboardTemplate from "../../components/DashboardTemplate";

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
}

interface UserPanelData {
  purchasedPanels: number;
  purchasedCost: number;
  generatedYield: number;
}

interface LoadingState {
  plant: boolean;
  inverter: boolean;
  user: boolean;
}

interface ErrorState {
  plant: string | null;
  inverter: string | null;
  user: string | null;
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
  purchaseDate: string;
  createdAt: string;
  updatedAt: string;
}

const PanelsPage: React.FC = () => {
  const { connected, wallet } = useWallet();
  const [walletID, setWalletID] = useState<string | null>(null);
  const [plantData, setPlantData] = useState<PlantData | null>(null);
  const [inverterData, setInverterData] = useState<InverterData[]>([]);
  const [purchaseData, setPurchaseData] = useState<PurchaseData[]>([]);
  const [userPanelData, setUserPanelData] = useState<UserPanelData>({
    purchasedPanels: 0,
    purchasedCost: 0,
    generatedYield: 0
  });
  
  // Separate loading states
  const [loadingState, setLoadingState] = useState<LoadingState>({
    plant: true,
    inverter: true,
    user: true
  });
  
  // Separate error states
  const [errorState, setErrorState] = useState<ErrorState>({
    plant: null,
    inverter: null,
    user: null
  });
  
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [chartPeriod, setChartPeriod] = useState<string>("today");
  const [hasEmptyData, setHasEmptyData] = useState<boolean>(false);

  // Extract wallet ID
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
        if (data.publicKey) {
          setWalletID(data.publicKey);
        }
      } catch (e) {
        console.error("Error parsing Web3Auth session", e);
      }
    }
    if (connected && wallet) {
      const walletPublicKey = (wallet.adapter as { publicKey?: { toString: () => string } }).publicKey?.toString() || "";
      setWalletID(walletPublicKey);
    }
  }, [connected, wallet]);

  // Fetch inverter data based on period
  const fetchInverterData = async (period: string) => {
    setLoadingState(prev => ({ ...prev, inverter: true }));
    setErrorState(prev => ({ ...prev, inverter: null }));
    
    const endDate = new Date();
    let startDate = new Date();
    
    switch (period) {
      case "today":
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        break;
      case "week":
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "month":
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        break;
      case "3months":
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 90);
        break;
      case "6months":
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 180);
        break;
      default:
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
    }
    
    try {
      console.log(`Fetching inverter data for ${period}:`, {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });
      
      const inverterResponse = await fetch(
        `https://de-express-backend.onrender.com/api/inverterquarterhourlydata/plant/6750afc5df6b8bbf630e3154?startDate=${encodeURIComponent(startDate.toISOString())}&endDate=${encodeURIComponent(endDate.toISOString())}`,
        { headers: { 'accept': '*/*' } }
      );
      
      if (inverterResponse.ok) {
        const inverterResult = await inverterResponse.json();
        const data = inverterResult.data || [];
        
        console.log(`Received ${data.length} data points for ${period}`);
        setInverterData(data);
        setHasEmptyData(data.length === 0);
      } else {
        throw new Error(`API returned ${inverterResponse.status}: ${inverterResponse.statusText}`);
      }
    } catch (error) {
      console.error('Error fetching inverter data:', error);
      setErrorState(prev => ({ 
        ...prev, 
        inverter: error instanceof Error ? error.message : 'Failed to fetch inverter data'
      }));
      setInverterData([]);
      setHasEmptyData(true);
    } finally {
      setLoadingState(prev => ({ ...prev, inverter: false }));
    }
  };

  // Fetch plant data
  const fetchPlantData = async () => {
    setLoadingState(prev => ({ ...prev, plant: true }));
    setErrorState(prev => ({ ...prev, plant: null }));
    
    try {
      const plantResponse = await fetch('https://de-express-backend.onrender.com/api/plant/6750afc5df6b8bbf630e3154', {
        headers: { 'accept': '*/*' }
      });
      
      if (!plantResponse.ok) {
        throw new Error(`Failed to fetch plant data: ${plantResponse.status} ${plantResponse.statusText}`);
      }
      
      const plantData = await plantResponse.json();
      setPlantData(plantData);
    } catch (error) {
      console.error('Error fetching plant data:', error);
      setErrorState(prev => ({ 
        ...prev, 
        plant: error instanceof Error ? error.message : 'Failed to fetch plant data'
      }));
    } finally {
      setLoadingState(prev => ({ ...prev, plant: false }));
    }
  };

  // Fetch user data
  const fetchUserData = async () => {
    if (!walletID) return;
    
    setLoadingState(prev => ({ ...prev, user: true }));
    setErrorState(prev => ({ ...prev, user: null }));
    
    try {
      const userResponse = await fetch(`https://buy-electricity-production.up.railway.app/api/users/${walletID}`);
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUserPanelData({
          purchasedPanels: userData.user.panelDetails.purchasedPanels,
          purchasedCost: userData.user.panelDetails.purchasedCost,
          generatedYield: userData.user.panelDetails.generatedYield
        });
      } else if (userResponse.status === 404) {
        // User not found - this is okay, just use defaults
        console.log('User not found, using default values');
      } else {
        throw new Error(`Failed to fetch user data: ${userResponse.status}`);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setErrorState(prev => ({ 
        ...prev, 
        user: error instanceof Error ? error.message : 'Failed to fetch user data'
      }));
    } finally {
      setLoadingState(prev => ({ ...prev, user: false }));
    }
  };

  const fetchPurchaseData = async () => {
  if (!walletID) return;
  
  try {
    const purchaseResponse = await fetch(`https://buy-electricity-production.up.railway.app/api/purchases/wallet/${walletID}`);
    if (purchaseResponse.ok) {
      const purchaseResult = await purchaseResponse.json();
      setPurchaseData(purchaseResult.data || []);
    } else {
      console.log('No purchase data found for wallet:', walletID);
      setPurchaseData([]);
    }
  } catch (error) {
    console.error('Error fetching purchase data:', error);
    setPurchaseData([]);
  }
};

  // Initial data fetch
  useEffect(() => {
  fetchPlantData();
  fetchUserData();
  fetchPurchaseData();
  fetchInverterData("today");
  }, [walletID]);

  // Refetch inverter data when chart period changes
  useEffect(() => {
    if (plantData) {
      fetchInverterData(chartPeriod);
    }
  }, [chartPeriod, plantData]);

  // Calculate real-time metrics
  const calculateMetrics = () => {
    console.log("inverterData:", inverterData);
    // Always return metrics, even with empty data
    const latestReading = inverterData.length > 0 ? inverterData[inverterData.length - 1] : null;
    const currentGeneration = latestReading?.value || 0;

    // Today's total generation (entire plant)
    const today = new Date().toISOString().split('T')[0];
    const todayData = inverterData.filter(d => d.date_time.startsWith(today));
    const todayTotal = todayData.reduce((sum, d) => sum + d.value, 0);

    // Today's user total generation
    const todayTotalUser = (todayTotal/plantData?.plantSize) * (userPanelData.purchasedPanels * 1.0);

    // Period total
    const periodTotal = inverterData.reduce((sum, d) => sum + d.value, 0);

    // Lifetime total
    const lifetimeTotal = latestReading?.tillLifeTIme || 0;

    // Plant efficiency (current vs rated capacity)
    const plantCapacity = plantData?.plantSize || 1;
    const plantEfficiency = (currentGeneration / plantCapacity) * 100;

    // Monthly estimated vs actual
    const currentMonth = new Date().toLocaleString('default', { month: 'long' });
    const currentYear = new Date().getFullYear().toString();
    const monthlyEstimate = plantData?.estimatedGeneration?.[currentYear]?.[currentMonth] || 0;
    
    // Daily average for month
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const dailyEstimate = monthlyEstimate / daysInMonth;
    const performanceRatio = dailyEstimate > 0 ? (todayTotal / dailyEstimate) * 100 : 0;

    return {
      currentGeneration,
      todayTotal,
      periodTotal,
      lifetimeTotal,
      plantEfficiency,
      performanceRatio,
      dailyEstimate,
      monthlyEstimate,
      todayTotalUser
    };
  };

  const metrics = calculateMetrics();
   
   const calculateTotalGenerated = () => {
  if (purchaseData.length === 0) {
    // Fallback to simple calculation if no purchase data
    return userPanelData.purchasedPanels * 2.8 * 30;
  }

  let totalGenerated = 0;
  const currentDate = new Date();

  purchaseData.forEach(purchase => {
    const purchaseDate = new Date(purchase.purchaseDate);
    const daysSincePurchase = Math.floor((currentDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Calculate generation: panels × 2.8 kWh/day × days since purchase
    const generatedFromThisPurchase = purchase.panelsPurchased * 2.8 * Math.max(daysSincePurchase, 0);
    totalGenerated += generatedFromThisPurchase;
  });

  return totalGenerated;
};

  const totalGenerated = calculateTotalGenerated();
  // Prepare chart data based on period
  const prepareChartData = () => {
    if (inverterData.length === 0) return [];

    console.log(`Preparing chart data for ${chartPeriod} with ${inverterData.length} data points`);
    
    let groupedData: { [key: string]: number } = {};
    
    switch (chartPeriod) {
      case "today":
        inverterData.forEach(d => {
          const date = new Date(d.date_time);
          const hour = date.getHours();
          const key = `${hour.toString().padStart(2, '0')}:00`;
          groupedData[key] = (groupedData[key] || 0) + d.value;
        });
        break;
      
      case "week":
      case "month":
      case "3months":
      case "6months":
        inverterData.forEach(d => {
          const date = new Date(d.date_time);
          const key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          groupedData[key] = (groupedData[key] || 0) + d.value;
        });
        break;
      
      default:
        return [];
    }

    const result = Object.entries(groupedData)
      .map(([time, value]) => ({ time, value }))
      .sort((a, b) => {
        if (chartPeriod === "today") {
          return parseInt(a.time.split(':')[0]) - parseInt(b.time.split(':')[0]);
        }
        return new Date(a.time + ", 2024").getTime() - new Date(b.time + ", 2024").getTime();
      });

    console.log(`Chart data prepared:`, result);
    return result;
  };

  const chartData = prepareChartData();
  const maxChartValue = Math.max(...chartData.map(d => d.value), 1);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getPeriodLabel = () => {
    switch (chartPeriod) {
      case "today": return "Today";
      case "week": return "Last Week";
      case "month": return "Last Month";
      case "3months": return "Last 3 Months";
      case "6months": return "Last 6 Months";
      default: return "Today";
    }
  };

  // Check if we should show loading state
  const isLoading = loadingState.plant || loadingState.inverter || loadingState.user;
  
  // Check if we have critical errors (plant data is most important)
  const hasCriticalError = errorState.plant !== null;

  if (isLoading) {
    return (
      <DashboardTemplate title="Solar Panels" activePage="panels">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Spinner size="lg" color="danger" className="mb-4" />
            <div className="text-xl mb-2 text-white">Loading solar data...</div>
            <div className="text-sm text-gray-400">
              {loadingState.plant && "Fetching plant information..."}
              {loadingState.inverter && "Loading generation data..."}
              {loadingState.user && "Getting your investment details..."}
            </div>
          </div>
        </div>
      </DashboardTemplate>
    );
  }

  if (hasCriticalError) {
    return (
      <DashboardTemplate title="Solar Panels" activePage="panels">
        <div className="text-center py-10">
          <WifiOff size={48} className="text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Unable to Load Plant Data</h3>
          <p className="text-gray-400 mb-4">{errorState.plant}</p>
          <Button 
            className="bg-[#E9423A] text-white"
            onPress={() => fetchPlantData()}
          >
            Retry
          </Button>
        </div>
      </DashboardTemplate>
    );
  }

  return (
    <DashboardTemplate title="Solar Panels" activePage="panels">
      <div className="mb-8">
        {/* Header with Date Dropdown in Top Right */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Panels Dashboard</h1>
              <p className="text-gray-400">Real-time monitoring of your solar panel investment</p>
            </div>
            
            {/* Date Period Selector - Moved to top right */}
            <div className="flex flex-col items-end gap-2">
              {/* <div className="text-sm text-gray-400 font-medium">Data Period</div> */}
              <Dropdown>
                <DropdownTrigger>
                  <Button 
                    className="bg-[#1A1A1A] text-white border-1 border-gray-700 hover:border-[#E9423A] transition-colors min-w-[140px]"
                    endContent={<ChevronDown size={16} />}
                    startContent={<Calendar size={16} />}
                    disabled={loadingState.inverter}
                    size="lg"
                  >
                    {getPeriodLabel()}
                  </Button>
                </DropdownTrigger>
                <DropdownMenu 
                  aria-label="Data Period"
                  selectionMode="single"
                  selectedKeys={[chartPeriod]}
                  onSelectionChange={keys => {
                    const selected = Array.from(keys)[0];
                    if (selected) setChartPeriod(selected.toString());
                  }}
                  className="bg-[#1A1A1A] text-white border border-gray-700"
                >
                  <DropdownItem key="today">Today</DropdownItem>
                  <DropdownItem key="week">Last Week</DropdownItem>
                  <DropdownItem key="month">Last Month</DropdownItem>
                  <DropdownItem key="3months">Last 3 Months</DropdownItem>
                  <DropdownItem key="6months">Last 6 Months</DropdownItem>
                </DropdownMenu>
              </Dropdown>
              {loadingState.inverter && (
                <div className="text-xs text-blue-400 flex items-center gap-1">
                  <Spinner size="sm" />
                  Refreshing data...
                </div>
              )}
            </div>
          </div>
          
          {/* Show data availability status */}
          {errorState.inverter && (
            <div className="p-3 bg-yellow-900/20 border border-yellow-600/30 rounded-lg mb-4">
              <div className="flex items-center gap-2">
                <AlertCircle size={16} className="text-yellow-400" />
                <span className="text-yellow-400 text-sm">Limited data: {errorState.inverter}</span>
              </div>
            </div>
          )}
          
          {hasEmptyData && !errorState.inverter && (
            <div className="p-3 bg-blue-900/20 border border-blue-600/30 rounded-lg mb-4">
              <div className="flex items-center gap-2">
                <AlertCircle size={16} className="text-blue-400" />
                <span className="text-blue-400 text-sm">No generation data available for {getPeriodLabel().toLowerCase()}</span>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs 
          selectedKey={activeTab}
          onSelectionChange={key => setActiveTab(key as string)}
          color="danger"
          variant="underlined"
          classNames={{
            base: "mb-8",
            tabList: "bg-transparent",
            cursor: "bg-[#E9423A]",
            tab: "text-gray-400 data-[selected=true]:text-white px-6 py-3"
          }}
        >
          <Tab key="overview" title="Overview" />
          <Tab key="performance" className="hidden" title="Performance" />
          <Tab key="investment" title="Your Panels" />
        </Tabs>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Plant Information */}
            {plantData && (
              <Card className="bg-[#1A1A1A] border-none">
                <CardBody className="p-6">
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <Building size={24} className="text-[#E9423A]" />
                    {plantData.plantName}
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="px-16 py-12 space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="flex items-start gap-3">
                          <MapPin size={20} className="text-gray-400 mt-1" />
                          <div>
                            <div className="text-sm text-gray-400">Location</div>
                            <div className="text-white font-medium">{plantData.plantLocation}</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Zap size={20} className="text-yellow-500 mt-1" />
                          <div>
                            <div className="text-sm text-gray-400">Total Capacity</div>
                            <div className="text-white font-medium">{plantData.plantSize} kW</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Calendar size={20} className="text-blue-400 mt-1" />
                          <div>
                            <div className="text-sm text-gray-400">Commissioned</div>
                            <div className="text-white font-medium">{formatDate(plantData.commissionDate)}</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="text-gray-400 mt-1 text-[20px] font-bold">#</div>
                          <div>
                            <div className="text-sm text-gray-400">Project Code</div>
                            <div className="text-white font-mono">{plantData.projectCode}</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="text-gray-400 mt-1 text-[20px] font-bold">⚡</div>
                          <div>
                            <div className="text-sm text-gray-400">Grid Status</div>
                            <div className="text-white">{plantData.gridStatus}</div>
                          </div>
                        </div>
                        <div className="hidden flex items-start gap-3">
                          <div className="text-gray-400 mt-1 text-[20px] font-bold">🏭</div>
                          <div>
                            <div className="text-sm text-gray-400">Plant Type</div>
                            <div className="text-white">{plantData.plantType}</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="text-gray-400 mt-1 text-[20px] font-bold">🏢</div>
                          <div>
                            <div className="text-sm text-gray-400">Industry</div>
                            <div className="text-white">{plantData.industryType}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-center">
                      <img 
                        src="https://meil.in/sites/default/files/2024-11/Solar%20Power%20Plant.jpg" 
                        alt="Solar Panel Farm"
                        className="rounded-lg object-cover w-full h-full max-h-[300px]"
                      />
                    </div>
                  </div>
                </CardBody>
              </Card>
            )}


            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="bg-[#1A1A1A] border-none">
                <CardBody className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                      <Gauge size={24} className="text-blue-400" />
                    </div>
                    <Chip size="sm" color="primary" variant="flat">
                      {loadingState.inverter ? "Loading..." : "Live"}
                    </Chip>
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">{metrics.currentGeneration.toFixed(2)} kW</div>
                  <div className="text-blue-400 text-sm">Current Generation</div>
                  <Progress 
                    value={metrics.plantEfficiency} 
                    maxValue={100}
                    color="primary"
                    size="sm"
                    className="mt-2"
                  />
                  <div className="text-xs text-gray-400 mt-1">{metrics.plantEfficiency.toFixed(1)}% of capacity</div>
                </CardBody>
              </Card>

              <Card className="bg-[#1A1A1A] border-none">
                <CardBody className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                      <Sun size={24} className="text-green-400" />
                    </div>
                    <Chip size="sm" color="success" variant="flat">Today</Chip>
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">{metrics.todayTotal.toFixed(1)} kWh</div>
                  <div className="text-green-400 text-sm">Today's Generation</div>
                  <Progress 
                    value={metrics.performanceRatio > 0 ? metrics.performanceRatio : 0} 
                    maxValue={100}
                    color="success"
                    size="sm"
                    className="mt-2"
                  />
                  <div className="text-xs text-gray-400 mt-1">
                    {metrics.performanceRatio > 0 ? `${metrics.performanceRatio.toFixed(1)}% of estimate` : 'No estimate available'}
                  </div>
                </CardBody>
              </Card>

              <Card className="bg-[#1A1A1A] border-none">
                <CardBody className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                      <TrendingUp size={24} className="text-purple-400" />
                    </div>
                    <Chip size="sm" color="secondary" variant="flat">Lifetime</Chip>
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">{metrics.lifetimeTotal.toFixed(0)} kWh</div>
                  <div className="text-purple-400 text-sm">Lifetime Generation</div>
                  <div className="text-xs text-gray-400 mt-2">
                    {plantData ? `Since ${formatDate(plantData.commissionDate)}` : 'Historical data'}
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Generation Chart */}
            <Card className="bg-[#1A1A1A] border-none">
              <CardBody className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <BarChart3 size={20} className="text-[#E9423A]" />
                    Plant Generation Pattern
                  </h3>
                  
                  {/* Show current period instead of dropdown */}
                  <div className="text-sm text-gray-400">
                    Showing data for {getPeriodLabel().toLowerCase()}
                  </div>
                </div>
                
                <div className="h-64 relative">
                  {loadingState.inverter ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <Spinner size="md" color="danger" className="mb-2" />
                        <div className="text-gray-400 text-sm">Loading chart data...</div>
                      </div>
                    </div>
                  ) : chartData.length > 0 ? (
                    <div className="absolute inset-0 flex items-end justify-between">
                      {chartData.map((item, index) => (
                        <div key={index} className="flex flex-col items-center h-full justify-end flex-1 mx-1">
                          <div className="text-xs text-gray-400 mb-1 whitespace-nowrap">
                            {item.value > 0 ? item.value.toFixed(1) : ''}
                          </div>
                          <div 
                            className="w-full bg-gradient-to-t from-[#E9423A] to-red-400 rounded-sm min-h-[2px]"
                            style={{ 
                              height: `${Math.max((item.value / maxChartValue) * 200, 2)}px`,
                              opacity: item.value > 0 ? 1 : 0.3
                            }}
                          ></div>
                          <div className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-top">
                            {item.time}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <BarChart3 size={48} className="text-gray-600 mx-auto mb-4" />
                        <div className="text-gray-400">No generation data available for {getPeriodLabel().toLowerCase()}</div>
                        <div className="text-gray-500 text-sm mt-2">Try selecting a different time period</div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-between mt-4 pt-4 border-t border-gray-800 text-sm">
                  <div className="text-gray-400">
                    Peak: <span className="text-white">{chartData.length > 0 ? Math.max(...chartData.map(d => d.value)).toFixed(2) : '0'} kW</span>
                  </div>
                  <div className="text-gray-400">
                    Average: <span className="text-white">{chartData.length > 0 ? (chartData.reduce((sum, d) => sum + d.value, 0) / chartData.length).toFixed(2) : '0'} kW</span>
                  </div>
                  <div className="text-gray-400">
                    Total: <span className="text-white">{metrics.periodTotal.toFixed(2)} kWh</span>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === "performance" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-[#1A1A1A] border-none">
                <CardBody className="p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Activity size={20} className="text-[#E9423A]" />
                    Performance Metrics
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">Plant Efficiency</span>
                        <span className="text-white">{metrics.plantEfficiency.toFixed(1)}%</span>
                      </div>
                      <Progress value={Math.min(metrics.plantEfficiency, 100)} maxValue={100} color="success" size="sm" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">Daily vs Estimate</span>
                        <span className="text-white">{metrics.performanceRatio.toFixed(1)}%</span>
                      </div>
                      <Progress value={Math.min(metrics.performanceRatio, 100)} maxValue={100} color="primary" size="sm" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">Data Quality</span>
                        <span className="text-white">{hasEmptyData ? '0%' : '100%'}</span>
                      </div>
                      <Progress value={hasEmptyData ? 0 : 100} maxValue={100} color={hasEmptyData ? "danger" : "success"} size="sm" />
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card className="bg-[#1A1A1A] border-none">
                <CardBody className="p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <BarChart3 size={20} className="text-blue-400" />
                    Generation Summary
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Current Output</span>
                      <span className="text-white font-semibold">{metrics.currentGeneration.toFixed(2)} kW</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Today's Total</span>
                      <span className="text-white font-semibold">{metrics.todayTotal.toFixed(2)} kWh</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Period Total ({getPeriodLabel()})</span>
                      <span className="text-white font-semibold">{metrics.periodTotal.toFixed(2)} kWh</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Daily Estimate</span>
                      <span className="text-white font-semibold">
                        {metrics.dailyEstimate > 0 ? `${metrics.dailyEstimate.toFixed(2)} kWh` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Monthly Estimate</span>
                      <span className="text-white font-semibold">
                        {metrics.monthlyEstimate > 0 ? `${metrics.monthlyEstimate.toFixed(0)} kWh` : 'N/A'}
                      </span>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Detailed Performance Analysis */}
            <Card className="bg-[#1A1A1A] border-none">
              <CardBody className="p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <TrendingUp size={20} className="text-green-400" />
                  Performance Analysis
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 bg-[#2A1A1A] rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-500 mb-1">
                      {chartData.length > 0 ? Math.max(...chartData.map(d => d.value)).toFixed(1) : '0'}
                    </div>
                    <div className="text-sm text-gray-400">Peak Generation (kW)</div>
                  </div>
                  <div className="p-4 bg-[#2A1A1A] rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-500 mb-1">
                      {chartData.length > 0 ? (chartData.reduce((sum, d) => sum + d.value, 0) / chartData.length).toFixed(1) : '0'}
                    </div>
                    <div className="text-sm text-gray-400">Average Generation (kW)</div>
                  </div>
                  <div className="p-4 bg-[#2A1A1A] rounded-lg text-center">
                    <div className="text-2xl font-bold text-purple-500 mb-1">
                      {plantData ? ((metrics.lifetimeTotal / (plantData.plantSize * 24 * 365)) * 100).toFixed(1) : '0'}
                    </div>
                    <div className="text-sm text-gray-400">Capacity Factor (%)</div>
                  </div>
                  <div className="p-4 bg-[#2A1A1A] rounded-lg text-center">
                    <div className="text-2xl font-bold text-orange-500 mb-1">
                      {hasEmptyData ? 'No Data' : 'Available'}
                    </div>
                    <div className="text-sm text-gray-400">Data Status ({getPeriodLabel()})</div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        )}

        {/* Your Panels Tab */}
        {activeTab === "investment" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-[#1A1A1A] border-none">
                <CardBody className="p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Sun size={20} className="text-[#E9423A]" />
                    Your Panel Portfolio
                  </h3>
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Panels Owned</span>
                        <span className="text-white font-semibold">{userPanelData.purchasedPanels}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Generated Yield</span>
                        <span className="text-green-500 font-semibold">${userPanelData.generatedYield.toFixed(4)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Capacity</span>
                        <span className="text-white font-semibold">{(userPanelData.purchasedPanels * 1.0).toFixed(2)} kW</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Generated</span>
                        <span className="text-white font-semibold">{totalGenerated.toFixed(0)} kWh</span>
                      </div>
                      <div className="mt-8">
                        <div className="flex justify-center">
                          <span className="text-gray-400">Today's Chart</span>
                        </div>
                        <div className="h-64">
                          <LineChart data={prepareChartData()} />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card className="bg-[#1A1A1A] border-none">
                <CardBody className="p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Leaf size={20} className="text-green-500" />
                    Environmental Impact
                  </h3>
                  <div className="space-y-4">
                    <div className="text-center p-4 bg-[#2A1A1A] rounded-lg">
                      <div className="text-2xl font-bold text-green-500 mb-1">
                        {(metrics.todayTotalUser * 0.0004).toFixed(3)}
                      </div>
                      <div className="text-sm text-gray-400">Tons CO₂ Saved Today</div>
                    </div>
                    <div className="text-center p-4 bg-[#2A1A1A] rounded-lg">
                      <div className="text-2xl font-bold text-blue-500 mb-1">
                        {(metrics.lifetimeTotal * 0.0004).toFixed(1)}
                      </div>
                      <div className="text-sm text-gray-400">Lifetime CO₂ Saved (tons)</div>
                    </div>
                    <div className="text-center p-4 bg-[#2A1A1A] rounded-lg">
                      <div className="text-2xl font-bold text-purple-500 mb-1">
                        {Math.round(metrics.lifetimeTotal * 0.0004 * 2204.62)}
                      </div>
                      <div className="text-sm text-gray-400">Pounds CO₂ Equivalent</div>
                    </div>
                  </div>

                  {/* Environmental Benefits */}
                  <div className="mt-6 p-4 bg-[#2A1A1A] rounded-lg">
                    <div className="text-sm text-gray-400 mb-3">Environmental Equivalents</div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Trees Planted</span>
                        <span className="text-white">{Math.round(metrics.lifetimeTotal * 0.0004 * 16)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Miles Not Driven</span>
                        <span className="text-white">{Math.round(metrics.lifetimeTotal * 0.0004 * 1102)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Coal Avoided (lbs)</span>
                        <span className="text-white">{Math.round(metrics.lifetimeTotal * 0.82)}</span>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>
        )}

        {/* Status Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          {errorState.user && (
            <div className="mb-2 text-yellow-400">
              User data unavailable: {errorState.user}
            </div>
          )}
          {plantData && (
            <div>
              Last updated: {new Date().toLocaleTimeString()} • 
              Plant ID: {plantData._id}
            </div>
          )}
        </div>
      </div>
    </DashboardTemplate>
  );
};

export default PanelsPage;