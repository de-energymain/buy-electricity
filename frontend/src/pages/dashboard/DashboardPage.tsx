import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Card, 
  CardBody, 
  Button, 
  Tabs, 
  Tab,
  Tooltip
} from "@nextui-org/react";
import { 
  BarChart3, 
  Home, 
  PieChart, 
  Settings, 
  HelpCircle, 
  History, 
  Wallet, 
  ShoppingBag, 
  LogOut,
  ExternalLink,
  Plus
} from "lucide-react";
import { useWallet } from '@solana/wallet-adapter-react'; // Import wallet hook
import logo from "../../assets/logo.svg";

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

function DashboardPage() {
  const navigate = useNavigate();
  const { publicKey, wallet, disconnect, connected } = useWallet(); // Get wallet info
  const [activeTab, setActiveTab] = useState("week");
  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [stats] = useState({
    energyGenerated: 900,
    energyChange: 12,
    nrgEarnings: 613,
    earningsChange: 9,
    carbonImpact: 4.93,
    carbonChange: 15,
    cleanPoints: 437,
    pointsChange: 5,
    efficiency: 68,
    target: 75,
    lowest: 59,
    highest: 72
  });

  // Update authentication status when wallet connection changes
  useEffect(() => {
    // When wallet is connected, set the flag in localStorage
    if (connected) {
      localStorage.setItem("walletConnected", "true");
    }
  }, [connected]);

  // Generate mock data on component mount
  useEffect(() => {
    // Nodes data
    const mockNodes: NodeData[] = [
      {
        id: "jaipur-01",
        name: "Jaipur Solar Farm",
        location: "Jaipur, India",
        icon: "🏭",
        panels: 17,
        capacity: 7.65,
        dailyOutput: 112,
        earnings: 434
      },
      {
        id: "gujarat-01",
        name: "Gujarat Solar Park",
        location: "Charanka, India",
        icon: "🔋",
        panels: 8,
        capacity: 3.44,
        dailyOutput: 48,
        earnings: 179
      }
    ];
    setNodes(mockNodes);

    // Set initial chart data for week view
    generateChartData("week");
  }, []);

  // Generate chart data based on selected time period
  const generateChartData = (period: string) => {
    let data: ChartData[] = [];
    
    switch (period) {
      case "day":
        // Hourly data for a day
        const hours = ["12AM", "3AM", "6AM", "9AM", "12PM", "3PM", "6PM", "9PM"];
        data = hours.map(hour => ({
          day: hour,
          value: Math.floor(Math.random() * 6) + 2
        }));
        break;
      
      case "week":
        // Daily data for a week
        // const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        data = [
          { day: "Mon", value: 20 },
          { day: "Tue", value: 30 },
          { day: "Wed", value: 35 },
          { day: "Thu", value: 45 },
          { day: "Fri", value: 40 },
          { day: "Sat", value: 28 },
          { day: "Sun", value: 25 }
        ];
        break;
      
      case "month":
        // Weekly data for a month
        const weeks = ["Week 1", "Week 2", "Week 3", "Week 4"];
        data = weeks.map(week => ({
          day: week,
          value: Math.floor(Math.random() * 150) + 100
        }));
        break;
      
      case "year":
        // Monthly data for a year
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        data = months.map(month => ({
          day: month,
          value: Math.floor(Math.random() * 500) + 300
        }));
        break;
    }
    
    setChartData(data);
  };

  // Handle tab change
  const handleTabChange = (key: React.Key) => {
    setActiveTab(key as string);
    generateChartData(key as string);
  };

  // Navigate to node details
  const handleNodeDetails = (nodeId: string) => {
    console.log(`View details for node: ${nodeId}`);
    navigate(`/dashboard/node/${nodeId}`);
  };

  // Navigate to buy panels page
  const handleBuyPanels = () => {
    navigate("/");
  };

  const handleLogout = async () => {
    // Disconnect wallet if connected
    if (disconnect) {
      await disconnect();
    }
    
    // Clear authentication state in localStorage
    localStorage.removeItem("torusSession");
    localStorage.setItem("walletConnected", "false");
    
    // Redirect to home page
    navigate("/");
  };

  // Truncate wallet address for display
  const truncateAddress = (address: string) => {
    if (!address) return "";
    return address.length <= 8 ? address : `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const maxValue = Math.max(...chartData.map(item => item.value));

  return (
    <div className="flex w-full h-screen bg-black text-white">
      {/* Sidebar */}
      <div className="hidden md:flex w-64 bg-[#0F0F0F] flex flex-col h-full border-r border-gray-800">
        {/* Logo */}
        <div className="p-4 flex justify-center border-b border-gray-800">
          <div className="w-10 h-10 flex items-center justify-center">
            <img src={logo} alt="Renrg logo" />
          </div>
        </div>
        
        {/* Navigation */}
        <div className="flex-1 flex flex-col">
          <div className="p-4">
            <div className="text-xs text-gray-500 mb-2">OVERVIEW</div>
            <ul className="space-y-1">
              <li>
                <Button 
                  className="w-full justify-start bg-red-500 text-white"
                  startContent={<Home size={18} />}
                >
                  Dashboard
                </Button>
              </li>
              <li>
                <Button 
                  className="w-full justify-start bg-transparent text-gray-400 hover:text-white"
                  startContent={<BarChart3 size={18} />}
                  onPress={() => navigate("/dashboard/analytics")}
                >
                  Analytics
                </Button>
              </li>
              <li>
                <Button 
                  className="w-full justify-start bg-transparent text-gray-400 hover:text-white"
                  startContent={<PieChart size={18} />}
                  onPress={() => navigate("/dashboard/panels")}
                >
                  Panels
                </Button>
              </li>
            </ul>
          </div>
          
          <div className="p-4">
            <div className="text-xs text-gray-500 mb-2">MANAGEMENT</div>
            <ul className="space-y-1">
              <li>
                <Button 
                  className="w-full justify-start bg-transparent text-gray-400 hover:text-white"
                  startContent={<History size={18} />}
                  onPress={() => navigate("/dashboard/transactions")}
                >
                  Transactions
                </Button>
              </li>
              <li>
                <Button 
                  className="w-full justify-start bg-transparent text-gray-400 hover:text-white"
                  startContent={<Wallet size={18} />}
                >
                  Wallet
                </Button>
              </li>
              <li>
                <Button 
                  className="w-full justify-start bg-transparent text-gray-400 hover:text-white"
                  startContent={<ShoppingBag size={18} />}
                  onPress={() => navigate("/dashboard/marketplace")}
                >
                  Marketplace
                </Button>
              </li>
            </ul>
          </div>
          
          <div className="p-4">
            <div className="text-xs text-gray-500 mb-2">ACCOUNT</div>
            <ul className="space-y-1">
              <li>
                <Button 
                  className="w-full justify-start bg-transparent text-gray-400 hover:text-white"
                  startContent={<Settings size={18} />}
                  onPress={() => navigate("/dashboard/settings")}
                >
                  Settings
                </Button>
              </li>
              <li>
                <Button 
                  className="w-full justify-start bg-transparent text-gray-400 hover:text-white"
                  startContent={<HelpCircle size={18} />}
                  onPress={() => navigate("/dashboard/help")}
                >
                  Help
                </Button>
              </li>
            </ul>
          </div>
          
          <div className="mt-auto p-4 border-t border-gray-800">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-[#E9423A] flex items-center justify-center mr-2">
                JD
              </div>
              <div>
                <div className="text-sm font-medium">John Doe</div>
                <div className="text-xs text-gray-500">Personal Account</div>
              </div>
              <Button 
                isIconOnly
                className="ml-auto bg-transparent text-gray-400 hover:text-white"
                onPress={handleLogout}
              >
                <LogOut size={18} />
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6 bg-[#0A0A0A]">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            
            {/* Wallet & Buy Panels Section - UPDATED */}
            <div className="flex items-center space-x-4">
              {/* Connected Wallet Display */}
              {publicKey && (
                <div className="flex items-center bg-[#1A1A1A] rounded-lg p-2 pr-3">
                  <div className="w-8 h-8 bg-[#2A1A1A] rounded-full flex items-center justify-center text-[#E9423A] mr-2">
                    <Wallet size={16} />
                  </div>
                  <div className="flex flex-col">
                    <div className="text-xs text-gray-400">{wallet?.adapter.name || "Wallet"}</div>
                    <div className="flex items-center">
                      <span className="text-sm font-mono">{truncateAddress(publicKey.toString())}</span>
                      <Tooltip content="View on Explorer">
                        <Button
                          isIconOnly
                          size="sm"
                          className="ml-1 bg-transparent min-w-0 w-5 h-5 p-0"
                          onPress={() => window.open(`https://explorer.solana.com/address/${publicKey.toString()}?cluster=devnet`, '_blank')}
                        >
                          <ExternalLink size={12} className="text-gray-400" />
                        </Button>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Buy Panels Button */}
              <Button 
                className="bg-[#E9423A] text-white"
                startContent={<Plus size={18} />}
                onPress={handleBuyPanels}
              >
                Buy Panels
              </Button>
            </div>
          </div>
          
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Energy Generated */}
            <Card className="bg-[#1A1A1A] border-none">
              <CardBody className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="text-sm text-gray-400">Energy Generated</div>
                  <div className="w-8 h-8 bg-[#2A1A1A] rounded-md flex items-center justify-center text-[#E9423A]">
                    ⚡
                  </div>
                </div>
                <div className="flex flex-col items-baseline">
                  <div className="text-2xl text-white font-bold">{stats.energyGenerated} kWh</div>
                  <div className="ml-2 text-xs text-green-500">+{stats.energyChange}% from last month</div>
                </div>
              </CardBody>
            </Card>
            
            {/* NRG Earnings */}
            <Card className="bg-[#1A1A1A] border-none">
              <CardBody className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="text-sm text-gray-400">NRG Earnings</div>
                  <div className="w-8 h-8 bg-[#2A1A1A] rounded-md flex items-center justify-center text-[#E9423A]">
                    💰
                  </div>
                </div>
                <div className="flex flex-col items-baseline">
                  <div className="text-2xl text-white font-bold">{stats.nrgEarnings} NRG</div>
                  <div className="ml-2 text-xs text-green-500">+{stats.earningsChange}% from last month</div>
                </div>
              </CardBody>
            </Card>
            
            {/* Carbon Impact */}
            <Card className="bg-[#1A1A1A] border-none">
              <CardBody className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="text-sm text-gray-400">Carbon Impact</div>
                  <div className="w-8 h-8 bg-[#2A1A1A] rounded-md flex items-center justify-center text-[#E9423A]">
                    🌱
                  </div>
                </div>
                <div className="flex flex-col items-baseline">
                  <div className="text-2xl text-white font-bold">{stats.carbonImpact} tons</div>
                  <div className="ml-2 text-xs text-green-500">+{stats.carbonChange}% from last month</div>
                </div>
              </CardBody>
            </Card>
            
            {/* Clean Points */}
            <Card className="bg-[#1A1A1A] border-none">
              <CardBody className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="text-sm text-gray-400">Clean Points</div>
                  <div className="w-8 h-8 bg-[#2A1A1A] rounded-md flex items-center justify-center text-[#E9423A]">
                    ✨
                  </div>
                </div>
                <div className="flex flex-col items-baseline">
                  <div className="text-2xl text-white font-bold">{stats.cleanPoints}</div>
                  <div className="ml-2 text-xs text-green-500">+{stats.pointsChange}% from last month</div>
                </div>
              </CardBody>
            </Card>
          </div>
          
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Energy Production Chart */}
            <Card className="bg-[#1A1A1A] border-none lg:col-span-2 text-white">
              <CardBody className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Energy Production</h3>
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
                
                {/* Bar Chart */}
                <div className="h-64 relative">
                  <div className="absolute inset-0 flex items-end">
                    {chartData.map((item, index) => (
                      <div key={index} className="flex-1 flex flex-col items-center space-y-2">
                        <div 
                          className="w-6 bg-gradient-to-t from-red-800 to-[#E9423A] rounded-sm"
                          style={{  height: `${(item.value / maxValue) * 180}px` }}
                        ></div>
                        <div className="text-xs text-gray-400">{item.day}</div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Chart Summary */}
                <div className="flex justify-between mt-6 pt-4 border-t border-gray-800">
                  <div className="text-center">
                    <div className="text-xs text-gray-400">Avg. Daily</div>
                    <div className="font-medium">32 kWh</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-400">Peak Output</div>
                    <div className="font-medium">45 kWh</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-400">Total Week</div>
                    <div className="font-medium">224 kWh</div>
                  </div>
                </div>
              </CardBody>
            </Card>
            
            {/* Efficiency Gauge */}
            <Card className="bg-[#1A1A1A] border-none">
              <CardBody className="p-6 text-white">
                <h3 className="text-lg font-medium mb-4">Efficiency</h3>
                
                {/* Circular Gauge */}
                <div className="relative flex items-center justify-center my-4">
                  <svg width="160" height="160" viewBox="0 0 160 160" className="transform -rotate-90">
                    <defs>
                      <linearGradient id="efficiencyGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#E9423A" />
                        <stop offset="100%" stopColor="#c62828" /> 
                      </linearGradient>
                     </defs>
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      stroke="#333"
                      strokeWidth="12"
                      fill="none"
                    />
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      stroke="url(#efficiencyGradient)"
                      strokeWidth="12"
                      fill="none"
                      strokeDasharray={2 * Math.PI * 70}
                      strokeDashoffset={(1 - stats.efficiency / 100) * 2 * Math.PI * 70}
                      strokeLinecap="round"
                      transform="rotate (75, 80, 80) scale(-1, 1) translate(-160, 0)"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-3xl font-bold">{stats.efficiency}%</div>
                    <div className="text-xs text-gray-400">Current</div>
                  </div>
                </div>
                
                {/* Efficiency Stats */}
                <div className="grid grid-cols-3 gap-2 text-center mt-6">
                  <div>
                    <div className="text-xs text-gray-400">Target</div>
                    <div className="font-medium">{stats.target}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Lowest</div>
                    <div className="font-medium">{stats.lowest}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Highest</div>
                    <div className="font-medium">{stats.highest}%</div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
          
          {/* Solar Nodes Table */}
          <Card className="bg-[#1A1A1A] border-none">
            <CardBody className="p-6 text-white">
              <h3 className="text-lg font-medium mb-4">Your Solar Nodes</h3>
              
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="py-3 text-left text-xs text-gray-400 font-normal">Node</th>
                      <th className="py-3 text-center text-xs text-gray-400 font-normal">Panels</th>
                      <th className="py-3 text-center text-xs text-gray-400 font-normal">Capacity</th>
                      <th className="py-3 text-center text-xs text-gray-400 font-normal">Daily Output</th>
                      <th className="py-3 text-center text-xs text-gray-400 font-normal">Earnings (NRG)</th>
                      <th className="py-3 text-right text-xs text-gray-400 font-normal">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nodes.map((node) => (
                      <tr key={node.id} className="border-b border-gray-800">
                        <td className="py-4">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-[#2A1A1A] rounded-md flex items-center justify-center text-[#E9423A] mr-2">
                              {node.icon}
                            </div>
                            <div>
                              <div className="font-medium">{node.name}</div>
                              <div className="text-xs text-gray-400">{node.location}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 text-center">{node.panels}</td>
                        <td className="py-4 text-center">{node.capacity.toFixed(2)} kW</td>
                        <td className="py-4 text-center">{node.dailyOutput} kWh</td>
                        <td className="py-4 text-center">{node.earnings}</td>
                        <td className="py-4 text-right">
                          <Button 
                            size="sm" 
                            className="text-white bg-transparent border border-[#E9423A] hover:bg-[#2A1A1A]"
                            onPress={() => handleNodeDetails(node.id)}
                          >
                            Details
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;