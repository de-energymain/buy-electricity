import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardBody,
  Button,
  Tabs,
  Tab,
  Progress,
  Chip,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem
} from "@nextui-org/react";
import {
  ArrowLeft,
  Settings,
  BarChart3,
  Calendar,
  Sun,
  Cloud,
  Droplets,
  Thermometer,
  Wind,
  Shield,
  ChevronDown,
  Download,
  Activity,
  Zap,
} from "lucide-react";
import DashboardTemplate from "../../components/DashboardTemplate";

// Node data interface
interface NodeData {
  id: string;
  name: string;
  farm: string;
  location: string;
  type: string;
  status: "active" | "maintenance" | "offline";
  panels: number;
  capacity: number;
  efficiency: number;
  dailyOutput: number;
  totalGenerated: number;
  installedDate: string;
  lastMaintenance: string;
  nextMaintenance: string;
  weatherCondition: "sunny" | "cloudy" | "rainy" | "mixed";
  temperature: number;
  humidity: number;
  windSpeed: number;
}

// Daily production data interface
interface DailyProduction {
  day: string;
  output: number;
  efficiency: number;
  earnings: number;
}

const NodeDetailsPage: React.FC = () => {
  const { nodeId } = useParams<{ nodeId: string }>();
  const navigate = useNavigate();
  const [nodeData, setNodeData] = useState<NodeData | null>(null);
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [timeRange, setTimeRange] = useState<string>("week");
  const [dailyData, setDailyData] = useState<DailyProduction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Fetch node data
  useEffect(() => {
    setIsLoading(true);
    
    // This would be an API call in a real app
    setTimeout(() => {
      const mockNode: NodeData = {
        id: nodeId || "unknown",
        name: nodeId === "jaipur-01" ? "Jaipur Solar Farm" : "Gujarat Solar Park",
        farm: nodeId === "jaipur-01" ? "Jaipur Solar Farm" : "Gujarat Solar Park",
        location: nodeId === "jaipur-01" ? "Jaipur, India" : "Charanka, India",
        type: "solar",
        status: "active",
        panels: nodeId === "jaipur-01" ? 17 : 8,
        capacity: nodeId === "jaipur-01" ? 7.65 : 3.44,
        efficiency: nodeId === "jaipur-01" ? 75 : 68,
        dailyOutput: nodeId === "jaipur-01" ? 112 : 48,
        totalGenerated: nodeId === "jaipur-01" ? 15820 : 6740,
        installedDate: "2023-01-15",
        lastMaintenance: "2024-03-10",
        nextMaintenance: "2024-07-10",
        weatherCondition: "sunny",
        temperature: 32,
        humidity: 45,
        windSpeed: 8
      };
      
      setNodeData(mockNode);
      
      // Generate daily production data
      const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
      const mockDailyData: DailyProduction[] = days.map(day => ({
        day,
        output: Math.floor(Math.random() * 20) + (nodeId === "jaipur-01" ? 100 : 40),
        efficiency: Math.floor(Math.random() * 10) + (nodeId === "jaipur-01" ? 70 : 65),
        earnings: Math.floor(Math.random() * 10) + (nodeId === "jaipur-01" ? 25 : 12)
      }));
      
      setDailyData(mockDailyData);
      setIsLoading(false);
    }, 1000);
  }, [nodeId]);

  // Handle back button
  const handleBack = () => {
    navigate("/dashboard");
  };
  
  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "success";
      case "maintenance":
        return "warning";
      case "offline":
        return "danger";
      default:
        return "default";
    }
  };
  
  // Get weather icon
  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case "sunny":
        return <Sun size={20} className="text-yellow-500" />;
      case "cloudy":
        return <Cloud size={20} className="text-gray-400" />;
      case "rainy":
        return <Droplets size={20} className="text-blue-500" />;
      default:
        return <Cloud size={20} className="text-gray-400" />;
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };
  
  if (isLoading || !nodeData) {
    return (
      <DashboardTemplate title="Solar Node Details" activePage="dashboard">
        <div className="flex items-center mb-6">
          <Button
            className="bg-transparent text-white"
            startContent={<ArrowLeft size={20} />}
            onPress={handleBack}
          >
            Back to Dashboard
          </Button>
        </div>
        
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-xl mb-2">Loading node data...</div>
            <div className="text-sm text-gray-400">Please wait</div>
          </div>
        </div>
      </DashboardTemplate>
    );
  }
  
  return (
    <DashboardTemplate title="Solar Node Details" activePage="dashboard">
      <div className="flex items-center justify-between mb-8">
        <Button
          className="bg-transparent text-white"
          startContent={<ArrowLeft size={20} />}
          onPress={handleBack}
        >
          Back to Dashboard
        </Button>
        
        <div className="flex gap-2">
          <Dropdown>
            <DropdownTrigger>
              <Button 
                className="bg-[#1A1A1A] text-white border-1 border-gray-700"
                endContent={<ChevronDown size={16} />}
                startContent={<Calendar size={16} />}
              >
                {timeRange === "day" ? "Today" : 
                 timeRange === "week" ? "This Week" : 
                 timeRange === "month" ? "This Month" : "All Time"}
              </Button>
            </DropdownTrigger>
            <DropdownMenu 
              aria-label="Time Range"
              selectionMode="single"
              selectedKeys={[timeRange]}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0];
                if (selected) setTimeRange(selected.toString());
              }}
            >
              <DropdownItem key="day">Today</DropdownItem>
              <DropdownItem key="week">This Week</DropdownItem>
              <DropdownItem key="month">This Month</DropdownItem>
              <DropdownItem key="all">All Time</DropdownItem>
            </DropdownMenu>
          </Dropdown>
          
          <Button
            className="bg-[#1A1A1A] text-white border-1 border-gray-700"
            startContent={<Download size={16} />}
          >
            Export
          </Button>
          
          <Button
            className="bg-[#1A1A1A] text-white border-1 border-gray-700"
            startContent={<Settings size={16} />}
          >
            Settings
          </Button>
        </div>
      </div>

      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-semibold text-white mb-2">Viewing {nodeData.name}</h1>
            <p className="text-gray-400 font-semibold">{nodeData.location}</p>
            <p className="text-gray-400 text-sm">Installed on {formatDate(nodeData.installedDate)}</p>
          </div>
          <Chip color={getStatusColor(nodeData.status)} size="lg" className="text-sm px-4 py-2">
            {nodeData.status.charAt(0).toUpperCase() + nodeData.status.slice(1)}
          </Chip>
        </div>
      </div>
      
      <Tabs 
        aria-label="Node Details Tabs" 
        selectedKey={activeTab}
        onSelectionChange={key => setActiveTab(key as string)}
        color="danger"
        variant="underlined"
        classNames={{
          base: "mb-6",
          tabList: "bg-transparent",
          cursor: "bg-[#E9423A]",
          tab: "text-gray-400 data-[selected=true]:text-white pb-4",
          panel: "pt-6"
        }}
      >
        <Tab key="overview" title="Overview" />
        <Tab key="production" title="Production" />
        <Tab key="maintenance" title="Maintenance" />
        <Tab key="settings" title="Settings" />
      </Tabs>
      
      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-8">
          <Card className="bg-[#1A1A1A] border-none">
            <CardBody className="p-8">
              <div className="flex items-center justify-center mb-6">
                <div className="flex items-center space-x-4">                  
                  <div className="w-20 h-16 bg-[#E9423A] bg-opacity-20 rounded-lg border-2 border-[#E9423A] flex items-center justify-center">
                    <Sun size={32} className="text-[#E9423A]" />
                  </div>                 
                </div>
              </div>
              
              <div className="text-center mb-6">
                <h2 className="text-2xl font-semibold text-white mb-2">Welcome to your solar node!</h2>
                <p className="text-gray-400 max-w-md mx-auto">
                  Your solar installation is active and generating clean energy. 
                  Check your status below or read our guide to solar monitoring.
                </p>
              </div>

              <div className="bg-[#2A1A1A] rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <div>
                    <div className="text-white font-medium">You're generating power!</div>
                    <div className="text-sm text-gray-400">Currently producing {nodeData.dailyOutput} kWh today</div>
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-gray-400 text-sm">
                <div className="flex items-center">
                  <div className="w-6 h-6 rounded-full border-2 border-green-500 bg-green-500 flex items-center justify-center mr-3">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <span>System is operational and monitoring energy production</span>
                </div>
                <div className="flex items-center">
                  <div className="w-6 h-6 rounded-full border-2 border-gray-600 flex items-center justify-center mr-3">
                    <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                  </div>
                  <span>Performance optimization in progress</span>
                </div>
                <div className="flex items-center">
                  <div className="w-6 h-6 rounded-full border-2 border-gray-600 flex items-center justify-center mr-3">
                    <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                  </div>
                  <span>Monthly performance report will be available soon</span>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-[#1A1A1A] border-none">
              <CardBody className="p-6">
                <div className="flex items-center mb-4">
                  <h3 className="text-lg font-medium text-white">Your solar energy production</h3>
                </div>
                <p className="text-gray-400 text-sm mb-6">
                  Track your daily energy generation and see how your solar installation is performing in real-time.
                </p>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Daily Output</span>
                    <span className="text-white font-medium">{nodeData.dailyOutput} kWh</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Efficiency</span>
                    <span className="text-white font-medium">{nodeData.efficiency}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Total Generated</span>
                    <span className="text-white font-medium">{nodeData.totalGenerated} kWh</span>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card className="bg-[#1A1A1A] border-none">
              <CardBody className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <h3 className="text-lg font-medium text-white">Your solar farm details</h3>
                  </div>
                </div>
                
                <div className="flex items-center mb-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-gray-400">{nodeData.location}</span>
                </div>              

                <div className="bg-[#2A1A1A] rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Panel Count</span>
                    <span className="text-white font-medium">{nodeData.panels} panels</span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-gray-400">Total Capacity</span>
                    <span className="text-white font-medium">{nodeData.capacity} kW</span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-gray-400">Next Maintenance</span>
                    <span className="text-white font-medium">{formatDate(nodeData.nextMaintenance)}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-gray-400">Last Maintenance</span>
                    <span className="text-white font-medium">{formatDate(nodeData.lastMaintenance)}</span>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-[#1A1A1A] border-none">
              <CardBody className="p-6">
                <h3 className="text-lg text-white font-medium mb-4">Current Conditions</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-[#2A1A1A] rounded-lg">
                    <div className="flex items-center">
                      {getWeatherIcon(nodeData.weatherCondition)}
                      <span className="ml-3 text-gray-400">Weather</span>
                    </div>
                    <span className="text-white font-medium capitalize">{nodeData.weatherCondition}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-[#2A1A1A] rounded-lg">
                    <div className="flex items-center">
                      <Thermometer size={18} className="text-red-500" />
                      <span className="ml-3 text-gray-400">Temperature</span>
                    </div>
                    <span className="text-white font-medium">{nodeData.temperature}°C</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-[#2A1A1A] rounded-lg">
                    <div className="flex items-center">
                      <Droplets size={18} className="text-blue-500" />
                      <span className="ml-3 text-gray-400">Humidity</span>
                    </div>
                    <span className="text-white font-medium">{nodeData.humidity}%</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-[#2A1A1A] rounded-lg">
                    <div className="flex items-center">
                      <Wind size={18} className="text-blue-300" />
                      <span className="ml-3 text-gray-400">Wind Speed</span>
                    </div>
                    <span className="text-white font-medium">{nodeData.windSpeed} km/h</span>
                  </div>
                </div>
              </CardBody>
            </Card>
            
            <Card className="bg-[#1A1A1A] border-none">
              <CardBody className="p-6">
                <h3 className="text-lg text-white font-medium mb-4">System Status</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-[#2A1A1A] rounded-lg">
                    <div className="flex items-center">
                      <Shield size={18} className="text-green-500" />
                      <span className="ml-3 text-gray-400">Panel Health</span>
                    </div>
                    <span className="font-medium text-green-500">Excellent</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-[#2A1A1A] rounded-lg">
                    <div className="flex items-center">
                      <Zap size={18} className="text-green-500" />
                      <span className="ml-3 text-gray-400">Inverter Status</span>
                    </div>
                    <span className="font-medium text-green-500">Operational</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-[#2A1A1A] rounded-lg">
                    <div className="flex items-center">
                      <Activity size={18} className="text-green-500" />
                      <span className="ml-3 text-gray-400">Connection</span>
                    </div>
                    <span className="font-medium text-green-500">Online</span>
                  </div>

                  <div className="mt-4 p-3 bg-[#2A1A1A] rounded-lg">
                    <div className="text-sm text-gray-400 mb-2">Efficiency</div>
                    <Progress 
                      value={nodeData.efficiency} 
                      maxValue={100}
                      color={nodeData.efficiency > 75 ? "success" : nodeData.efficiency > 65 ? "warning" : "danger"}
                      size="md"
                      className="mb-2"
                    />
                    <div className="text-right text-sm text-white">{nodeData.efficiency}%</div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          <Card className="bg-[#1A1A1A] border-none">
            <CardBody className="p-6">
              <h3 className="text-lg text-white font-medium mb-6">Daily Production</h3>
              
              <div className="h-64 relative mb-6">
                <div className="absolute inset-0 flex items-end">
                  {dailyData.map((item, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center h-full pt-8">
                      <div className="text-xs text-gray-400 mb-1">{item.output} kWh</div>
                      <div 
                        className="w-8 bg-gradient-to-t from-red-800 to-[#E9423A] rounded-sm"
                        style={{ height: `${(item.output / Math.max(...dailyData.map(d => d.output))) * 180}px` }}
                      ></div>
                      <div className="text-xs text-gray-400 mt-2">{item.day.substring(0, 3)}</div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-800">
                <div className="text-center">
                  <div className="text-sm text-gray-400">Avg. Daily</div>
                  <div className="font-medium text-white">{Math.round(dailyData.reduce((sum, item) => sum + item.output, 0) / dailyData.length)} kWh</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-400">Peak Output</div>
                  <div className="font-medium text-white">{Math.max(...dailyData.map(item => item.output))} kWh</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-400">Total Week</div>
                  <div className="font-medium text-white">{dailyData.reduce((sum, item) => sum + item.output, 0)} kWh</div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
      
      {/* Production Tab */}
      {activeTab === "production" && (
        <Card className="bg-[#1A1A1A] border-none">
          <CardBody className="p-6">
            <div className="text-center py-10 text-gray-400">
              <div className="text-lg mb-2">Production analytics coming soon</div>
              <div className="text-sm mb-4">Detailed production data will be available in a future update.</div>
              <Button 
                className="bg-[#E9423A] text-white"
                startContent={<BarChart3 size={18} />}
              >
                View Basic Analytics
              </Button>
            </div>
          </CardBody>
        </Card>
      )}
      
      {/* Maintenance Tab */}
      {activeTab === "maintenance" && (
        <Card className="bg-[#1A1A1A] border-none">
          <CardBody className="p-6">
            <div className="text-center py-10 text-gray-400">
              <div className="text-lg mb-2">Maintenance records coming soon</div>
              <div className="text-sm mb-4">Detailed maintenance history will be available in a future update.</div>
              <Button 
                className="bg-[#E9423A] text-white"
              >
                Request Maintenance
              </Button>
            </div>
          </CardBody>
        </Card>
      )}
      
      {/* Settings Tab */}
      {activeTab === "settings" && (
        <Card className="bg-[#1A1A1A] border-none">
          <CardBody className="p-6">
            <div className="text-center py-10 text-gray-400">
              <div className="text-lg mb-2">Node settings coming soon</div>
              <div className="text-sm mb-4">Advanced configuration options will be available in a future update.</div>
              <Button 
                className="bg-[#E9423A] text-white"
                startContent={<Settings size={18} />}
              >
                Basic Settings
              </Button>
            </div>
          </CardBody>
        </Card>
      )}
    </DashboardTemplate>
  );
};

export default NodeDetailsPage;