import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Card, 
  CardBody, 
  Button, 
  Tabs, 
  Tab 
} from "@nextui-org/react";
import { 
  BarChart3, 
  Home, 
  PieChart, 
  LineChart, 
  Settings, 
  HelpCircle, 
  RefreshCw, 
  History, 
  Wallet, 
  ShoppingBag, 
  LogOut
} from "lucide-react";
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
  const [activeTab, setActiveTab] = useState("week");
  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [stats, setStats] = useState({
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
        const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
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
    // This would typically navigate to a node details page
    // navigate(`/node/${nodeId}`);
  };

  const handleLogout = () => {
    // In a real app, clear authentication and redirect to login
    navigate("/");
  };

  return (
    <div className="flex h-screen bg-black text-white">
      {/* Sidebar */}
      <div className="w-64 bg-[#0F0F0F] flex flex-col h-full border-r border-gray-800">
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
                  className="w-full justify-start bg-[#1A1A1A] text-white"
                  startContent={<Home size={18} />}
                >
                  Dashboard
                </Button>
              </li>
              <li>
                <Button 
                  className="w-full justify-start bg-transparent text-gray-400 hover:text-white"
                  startContent={<BarChart3 size={18} />}
                >
                  Analytics
                </Button>
              </li>
              <li>
                <Button 
                  className="w-full justify-start bg-transparent text-gray-400 hover:text-white"
                  startContent={<PieChart size={18} />}
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
                >
                  Settings
                </Button>
              </li>
              <li>
                <Button 
                  className="w-full justify-start bg-transparent text-gray-400 hover:text-white"
                  startContent={<HelpCircle size={18} />}
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
          <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
          
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Energy Generated */}
            <Card className="bg-[#1A1A1A] border-none">
              <CardBody className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="text-sm text-gray-400">Energy Generated</div>
                  <div className="w-6 h-6 bg-[#2A1A1A] rounded-full flex items-center justify-center text-[#E9423A]">
                    ⚡
                  </div>
                </div>
                <div className="flex items-baseline">
                  <div className="text-2xl font-bold">{stats.energyGenerated} kWh</div>
                  <div className="ml-2 text-xs text-green-500">+{stats.energyChange}% from last month</div>
                </div>
              </CardBody>
            </Card>
            
            {/* NRG Earnings */}
            <Card className="bg-[#1A1A1A] border-none">
              <CardBody className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="text-sm text-gray-400">NRG Earnings</div>
                  <div className="w-6 h-6 bg-[#2A1A1A] rounded-full flex items-center justify-center text-[#E9423A]">
                    💰
                  </div>
                </div>
                <div className="flex items-baseline">
                  <div className="text-2xl font-bold">{stats.nrgEarnings} NRG</div>
                  <div className="ml-2 text-xs text-green-500">+{stats.earningsChange}% from last month</div>
                </div>
              </CardBody>
            </Card>
            
            {/* Carbon Impact */}
            <Card className="bg-[#1A1A1A] border-none">
              <CardBody className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="text-sm text-gray-400">Carbon Impact</div>
                  <div className="w-6 h-6 bg-[#2A1A1A] rounded-full flex items-center justify-center text-[#E9423A]">
                    🌱
                  </div>
                </div>
                <div className="flex items-baseline">
                  <div className="text-2xl font-bold">{stats.carbonImpact} tons</div>
                  <div className="ml-2 text-xs text-green-500">+{stats.carbonChange}% from last month</div>
                </div>
              </CardBody>
            </Card>
            
            {/* Clean Points */}
            <Card className="bg-[#1A1A1A] border-none">
              <CardBody className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="text-sm text-gray-400">Clean Points</div>
                  <div className="w-6 h-6 bg-[#2A1A1A] rounded-full flex items-center justify-center text-[#E9423A]">
                    ✨
                  </div>
                </div>
                <div className="flex items-baseline">
                  <div className="text-2xl font-bold">{stats.cleanPoints}</div>
                  <div className="ml-2 text-xs text-green-500">+{stats.pointsChange}% from last month</div>
                </div>
              </CardBody>
            </Card>
          </div>
          
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Energy Production Chart */}
            <Card className="bg-[#1A1A1A] border-none lg:col-span-2">
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
                <div className="h-[200px] relative">
                  <div className="absolute inset-0 flex items-end">
                    {chartData.map((item, index) => (
                      <div key={index} className="flex-1 flex flex-col items-center space-y-2">
                        <div 
                          className="w-6 bg-[#E9423A] rounded-sm"
                          style={{ height: `${(item.value / 50) * 100}%`, maxHeight: '100%' }}
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
              <CardBody className="p-6">
                <h3 className="text-lg font-medium mb-4">Efficiency</h3>
                
                {/* Circular Gauge */}
                <div className="relative flex items-center justify-center my-4">
                  <div className="w-40 h-40 rounded-full border-8 border-gray-700"></div>
                  <div 
                    className="absolute top-0 left-0 w-40 h-40 rounded-full border-8 border-transparent"
                    style={{ 
                      clipPath: 'polygon(50% 50%, 50% 0, 100% 0, 100% 100%, 0 100%, 0 0, 50% 0)',
                      borderRightColor: '#E9423A',
                      borderTopColor: '#E9423A',
                      borderLeftColor: '#E9423A',
                      transform: `rotate(${(stats.efficiency / 100) * 360}deg)`
                    }}
                  ></div>
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
            <CardBody className="p-6">
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