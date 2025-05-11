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
  AlertTriangle,
  ChevronDown,
  Download
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
      <DashboardTemplate title="Node Details" activePage="dashboard">
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
    <DashboardTemplate title={nodeData.name} activePage="dashboard">
      <div className="flex items-center mb-6">
        <Button
          className="bg-transparent text-white"
          startContent={<ArrowLeft size={20} />}
          onPress={handleBack}
        >
          Back to Dashboard
        </Button>
        
        <div className="ml-auto flex gap-2">
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
      
      <Tabs 
        aria-label="Node Details Tabs" 
        selectedKey={activeTab}
        onSelectionChange={key => setActiveTab(key as string)}
        color="danger"
        variant="bordered"
        classNames={{
          base: "mb-6",
          tabList: "bg-[#1A1A1A] p-1",
          cursor: "bg-[#E9423A]",
          tab: "text-gray-400 data-[selected=true]:text-white"
        }}
      >
        <Tab key="overview" title="Overview" />
        <Tab key="production" title="Production" />
        <Tab key="maintenance" title="Maintenance" />
        <Tab key="settings" title="Settings" />
      </Tabs>
      
      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card className="bg-[#1A1A1A] border-none mb-6">
              <CardBody className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-medium mb-1">{nodeData.name}</h3>
                    <div className="text-sm text-gray-400">{nodeData.location}</div>
                  </div>
                  <Chip color={getStatusColor(nodeData.status)} size="sm">
                    {nodeData.status.charAt(0).toUpperCase() + nodeData.status.slice(1)}
                  </Chip>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div>
                    <div className="text-xs text-gray-400">Panels</div>
                    <div className="font-medium">{nodeData.panels}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Capacity</div>
                    <div className="font-medium">{nodeData.capacity} kW</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Daily Output</div>
                    <div className="font-medium">{nodeData.dailyOutput} kWh</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Total Generated</div>
                    <div className="font-medium">{nodeData.totalGenerated} kWh</div>
                  </div>
                </div>
                
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-sm">Efficiency</div>
                    <div className="text-sm">{nodeData.efficiency}%</div>
                  </div>
                  <Progress 
                    value={nodeData.efficiency} 
                    maxValue={100}
                    color={nodeData.efficiency > 75 ? "success" : nodeData.efficiency > 65 ? "warning" : "danger"}
                    size="md"
                    className="h-2"
                  />
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-xs text-gray-400">Installed Date</div>
                    <div className="font-medium">{formatDate(nodeData.installedDate)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Last Maintenance</div>
                    <div className="font-medium">{formatDate(nodeData.lastMaintenance)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Next Maintenance</div>
                    <div className="font-medium">{formatDate(nodeData.nextMaintenance)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Type</div>
                    <div className="font-medium capitalize">{nodeData.type}</div>
                  </div>
                </div>
              </CardBody>
            </Card>
            
            <Card className="bg-[#1A1A1A] border-none">
              <CardBody className="p-6">
                <h3 className="text-lg font-medium mb-4">Daily Production</h3>
                
                <div className="h-64 relative">
                  <div className="absolute inset-0 flex items-end">
                    {dailyData.map((item, index) => (
                      <div key={index} className="flex-1 flex flex-col items-center h-full pt-8">
                        <div className="text-xs text-gray-400 mb-1">{item.output} kWh</div>
                        <div 
                          className="w-6 bg-gradient-to-t from-red-800 to-[#E9423A] rounded-sm"
                          style={{ height: `${(item.output / Math.max(...dailyData.map(d => d.output))) * 180}px` }}
                        ></div>
                        <div className="text-xs text-gray-400 mt-2">{item.day.substring(0, 3)}</div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-between mt-6 pt-4 border-t border-gray-800">
                  <div className="text-center">
                    <div className="text-xs text-gray-400">Avg. Daily</div>
                    <div className="font-medium">{Math.round(dailyData.reduce((sum, item) => sum + item.output, 0) / dailyData.length)} kWh</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-400">Peak Output</div>
                    <div className="font-medium">{Math.max(...dailyData.map(item => item.output))} kWh</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-400">Total Week</div>
                    <div className="font-medium">{dailyData.reduce((sum, item) => sum + item.output, 0)} kWh</div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
          
          <div className="md:col-span-1">
            <Card className="bg-[#1A1A1A] border-none mb-6">
              <CardBody className="p-6">
                <h3 className="text-lg font-medium mb-4">Current Conditions</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-[#2A1A1A] rounded-lg">
                    <div className="flex items-center">
                      {getWeatherIcon(nodeData.weatherCondition)}
                      <div className="ml-3">
                        <div className="text-sm">Weather</div>
                      </div>
                    </div>
                    <div className="font-medium capitalize">{nodeData.weatherCondition}</div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-[#2A1A1A] rounded-lg">
                    <div className="flex items-center">
                      <Thermometer size={20} className="text-red-500" />
                      <div className="ml-3">
                        <div className="text-sm">Temperature</div>
                      </div>
                    </div>
                    <div className="font-medium">{nodeData.temperature}°C</div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-[#2A1A1A] rounded-lg">
                    <div className="flex items-center">
                      <Droplets size={20} className="text-blue-500" />
                      <div className="ml-3">
                        <div className="text-sm">Humidity</div>
                      </div>
                    </div>
                    <div className="font-medium">{nodeData.humidity}%</div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-[#2A1A1A] rounded-lg">
                    <div className="flex items-center">
                      <Wind size={20} className="text-blue-300" />
                      <div className="ml-3">
                        <div className="text-sm">Wind Speed</div>
                      </div>
                    </div>
                    <div className="font-medium">{nodeData.windSpeed} km/h</div>
                  </div>
                </div>
              </CardBody>
            </Card>
            
            <Card className="bg-[#1A1A1A] border-none">
              <CardBody className="p-6">
                <h3 className="text-lg font-medium mb-4">System Status</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-[#2A1A1A] rounded-lg">
                    <div className="flex items-center">
                      <Shield size={20} className="text-green-500" />
                      <div className="ml-3">
                        <div className="text-sm">Panel Health</div>
                      </div>
                    </div>
                    <div className="font-medium text-green-500">Good</div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-[#2A1A1A] rounded-lg">
                    <div className="flex items-center">
                      <Shield size={20} className="text-green-500" />
                      <div className="ml-3">
                        <div className="text-sm">Inverter Status</div>
                      </div>
                    </div>
                    <div className="font-medium text-green-500">Operational</div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-[#2A1A1A] rounded-lg">
                    <div className="flex items-center">
                      <Shield size={20} className="text-green-500" />
                      <div className="ml-3">
                        <div className="text-sm">Connection</div>
                      </div>
                    </div>
                    <div className="font-medium text-green-500">Online</div>
                  </div>
                  
                  {nodeData.status === "maintenance" && (
                    <div className="p-4 bg-yellow-900 bg-opacity-30 border border-yellow-600 rounded-lg">
                      <div className="flex items-start">
                        <AlertTriangle size={20} className="text-yellow-500 mr-2 mt-0.5" />
                        <div>
                          <div className="font-medium text-yellow-400">Maintenance In Progress</div>
                          <div className="text-sm text-gray-300 mt-1">Scheduled maintenance is currently in progress. Performance may be temporarily affected.</div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {nodeData.status === "offline" && (
                    <div className="p-4 bg-red-900 bg-opacity-30 border border-red-600 rounded-lg">
                      <div className="flex items-start">
                        <AlertTriangle size={20} className="text-red-500 mr-2 mt-0.5" />
                        <div>
                          <div className="font-medium text-red-400">System Offline</div>
                          <div className="text-sm text-gray-300 mt-1">This node is currently offline. Our technicians have been notified and are working to resolve the issue.</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          </div>
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