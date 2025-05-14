import { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  Button,
  Progress,
  Switch,
  Input,
  Divider
} from "@nextui-org/react";
import {
  Search,
  Activity,
  Zap,
  Sun,
  AlertTriangle,
  CheckCircle2,
  ChevronRight
} from "lucide-react";
import DashboardTemplate from "../../components/DashboardTemplate";

interface PanelData {
  id: string;
  name: string;
  farm: string;
  location: string;
  power: number;
  status: "active" | "maintenance" | "offline";
  efficiency: number;
  dailyOutput: number;
  totalGenerated: number;
  lastMaintenance: string;
  warranty: string;
  active: boolean;
}

const PanelsPage: React.FC = () => {
  const [panels, setPanels] = useState<PanelData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredPanels, setFilteredPanels] = useState<PanelData[]>([]);
  const [totalPower, setTotalPower] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [maintenanceCount, setMaintenanceCount] = useState(0);
  const [offlineCount, setOfflineCount] = useState(0);

  // Generate mock data
  useEffect(() => {
    const mockPanels: PanelData[] = Array.from({ length: 15 }, (_, i) => {
      const status: "active" | "maintenance" | "offline" = 
        i % 8 === 0 ? "maintenance" : i % 12 === 0 ? "offline" : "active";
      
      return {
        id: `panel-${i + 1}`,
        name: `Solar Panel ${i + 1}`,
        farm: i < 8 ? "Jaipur Solar Farm" : "Gujarat Solar Park",
        location: i < 8 ? "Jaipur, India" : "Charanka, India",
        power: 450, // Watts
        status,
        efficiency: Math.floor(Math.random() * 15) + 65, // 65-80%
        dailyOutput: Math.floor(Math.random() * 2) + 4, // 4-6 kWh
        totalGenerated: Math.floor(Math.random() * 500) + 1000, // 1000-1500 kWh
        lastMaintenance: "2024-04-15",
        warranty: "2026-12-31",
        active: status === "active"
      };
    });
    
    setPanels(mockPanels);
    setFilteredPanels(mockPanels);
    
    // Calculate stats
    const totalPwr = mockPanels.reduce((sum, panel) => sum + panel.power, 0) / 1000; // Convert to kW
    const activePanels = mockPanels.filter(p => p.status === "active").length;
    const maintenancePanels = mockPanels.filter(p => p.status === "maintenance").length;
    const offlinePanels = mockPanels.filter(p => p.status === "offline").length;
    
    setTotalPower(totalPwr);
    setActiveCount(activePanels);
    setMaintenanceCount(maintenancePanels);
    setOfflineCount(offlinePanels);
  }, []);

  // Search filter
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPanels(panels);
      return;
    }
    
    const filtered = panels.filter(
      panel => 
        panel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        panel.farm.toLowerCase().includes(searchQuery.toLowerCase()) ||
        panel.location.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    setFilteredPanels(filtered);
  }, [searchQuery, panels]);

  // Toggle panel active status
  const handleTogglePanel = (id: string, active: boolean) => {
    setPanels(prevPanels => 
      prevPanels.map(panel => 
        panel.id === id ? { ...panel, active } : panel
      )
    );
    
    setFilteredPanels(prevPanels => 
      prevPanels.map(panel => 
        panel.id === id ? { ...panel, active } : panel
      )
    );
  };

  // Panel health indicator color
  const getHealthColor = (efficiency: number) => {
    if (efficiency >= 75) return "success";
    if (efficiency >= 65) return "warning";
    return "danger";
  };

  // Format date
//   const formatDate = (dateString: string) => {
//     const date = new Date(dateString);
//     return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
//   };

  return (
    <DashboardTemplate title="Solar Panels" activePage="panels">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-[#1A1A1A] border-none">
          <CardBody className="p-4">
            <div className="flex justify-between items-start mb-2">
              <div className="text-sm text-gray-400">Total Panels</div>
              <div className="w-8 h-8 bg-[#2A1A1A] rounded-md flex items-center justify-center text-[#E9423A]">
                <Sun size={16} />
              </div>
            </div>
            <div className="text-2xl font-bold text-white">{panels.length}</div>
            <div className="text-xs text-gray-400">Total Power: {totalPower.toFixed(2)} kW</div>
          </CardBody>
        </Card>
        
        <Card className="bg-[#1A1A1A] border-none">
          <CardBody className="p-4">
            <div className="flex justify-between items-start mb-2">
              <div className="text-sm text-gray-400">Active Panels</div>
              <div className="w-8 h-8 bg-[#2A1A1A] rounded-md flex items-center justify-center text-green-500">
                <CheckCircle2 size={16} />
              </div>
            </div>
            <div className="text-2xl text-white font-bold">{activeCount}</div>
            <div className="text-xs text-green-500">{((activeCount / panels.length) * 100).toFixed(0)}% Online</div>
          </CardBody>
        </Card>
        
        <Card className="bg-[#1A1A1A] border-none">
          <CardBody className="p-4">
            <div className="flex justify-between items-start mb-2">
              <div className="text-sm text-gray-400">Maintenance</div>
              <div className="w-8 h-8 bg-[#2A1A1A] rounded-md flex items-center justify-center text-yellow-500">
                <Activity size={16} />
              </div>
            </div>
            <div className="text-2xl text-white font-bold">{maintenanceCount}</div>
            <div className="text-xs text-yellow-500">{((maintenanceCount / panels.length) * 100).toFixed(0)}% In Maintenance</div>
          </CardBody>
        </Card>
        
        <Card className="bg-[#1A1A1A] border-none">
          <CardBody className="p-4">
            <div className="flex justify-between items-start mb-2">
              <div className="text-sm text-gray-400">Offline</div>
              <div className="w-8 h-8 bg-[#2A1A1A] rounded-md flex items-center justify-center text-red-500">
                <AlertTriangle size={16} />
              </div>
            </div>
            <div className="text-2xl text-white font-bold">{offlineCount}</div>
            <div className="text-xs text-red-500">{((offlineCount / panels.length) * 100).toFixed(0)}% Offline</div>
          </CardBody>
        </Card>
      </div>
      
      {/* Search */}
      <div className="mb-6">
        <Input
          placeholder="Search panels by name, farm, or location..."
          startContent={<Search size={18} />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-md"
          classNames={{
            base: "bg-[#1A1A1A]",
            inputWrapper: "bg-[#1A1A1A] border-1 border-gray-700 hover:border-white focus-within:border-[#E9423A]",
            input: "text-white placeholder:text-gray-400"
          }}
        />
      </div>
      
     {/* Panels List */}
     <Card className="bg-[#1A1A1A] border-none mb-4">
        <CardBody>
          <div className="space-y-4">
            {filteredPanels.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                No panels found matching your search.
              </div>
            ) : (
              filteredPanels.map((panel) => (
                <div key={panel.id}>
                  <div className="flex flex-col md:flex-row md:items-center justify-between p-2 gap-4">
                    <div className="flex items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white mr-3 ${
                        panel.status === 'active' ? 'bg-green-500' : 
                        panel.status === 'maintenance' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}>
                        {panel.status === 'active' ? <Zap size={18} /> : 
                         panel.status === 'maintenance' ? <Activity size={18} /> : <AlertTriangle size={18} />}
                      </div>
                      
                      <div>
                        <div className="text-white font-medium">{panel.name}</div>
                        <div className="text-xs text-gray-400">{panel.farm} • {panel.location}</div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6 w-full md:w-auto">
                      <div className="w-full md:w-auto">
                        <div className="text-xs text-gray-400 mb-1">Efficiency</div>
                        <div className="flex items-center gap-2">
                          <Progress 
                            size="sm" 
                            value={panel.efficiency} 
                            maxValue={100}
                            color={getHealthColor(panel.efficiency)}
                            className="w-24"
                          />
                          <span className="text-sm">{panel.efficiency}%</span>
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-xs text-gray-400 mb-1">Daily Output</div>
                        <div className="text-sm text-white">{panel.dailyOutput} kWh</div>
                      </div>
                      
                      <div>
                        <div className="text-xs text-gray-400 mb-1">Status</div>
                        <div className="flex items-center gap-2">
                          <Switch 
                            size="sm"
                            isSelected={panel.active}
                            isDisabled={panel.status !== 'active'}
                            onChange={(e) => handleTogglePanel(panel.id, e.target.checked)}
                            classNames={{
                              wrapper: "group-data-[selected=true]:bg-[#E9423A]"
                            }}
                          />
                          <span className="text-sm">{panel.active ? 'On' : 'Off'}</span>
                        </div>
                      </div>
                      
                      <Button
                        isIconOnly
                        size="sm"
                        className="ml-auto bg-transparent text-gray-400 hover:text-white"
                      >
                        <ChevronRight size={20} />
                      </Button>
                    </div>
                  </div>
                  <Divider className="my-2 bg-gray-800" />
                </div>
              ))
            )}
          </div>
        </CardBody>
      </Card>
      
      {/* Panel Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-[#1A1A1A] border-none">
          <CardBody className="p-6">
            <h3 className="text-lg text-white font-medium mb-4">Performance by Location</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-white">Jaipur Solar Farm</span>
                  <span className="text-sm text-white">78%</span>
                </div>
                <Progress 
                  value={78} 
                  maxValue={100}
                  size="md"
                  color="danger"
                  className="h-2"
                />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-white">Gujarat Solar Park</span>
                  <span className="text-sm text-white">72%</span>
                </div>
                <Progress 
                  value={72} 
                  maxValue={100}
                  size="md"
                  color="danger"
                  className="h-2"
                />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-white">Maharashtra Array</span>
                  <span className="text-sm text-white">65%</span>
                </div>
                <Progress 
                  value={65} 
                  maxValue={100}
                  size="md"
                  color="danger"
                  className="h-2"
                />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-white">Karnataka Plant</span>
                  <span className="text-sm text-white">81%</span>
                </div>
                <Progress 
                  value={81} 
                  maxValue={100}
                  size="md"
                  color="danger"
                  className="h-2"
                />
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card className="bg-[#1A1A1A] border-none">
          <CardBody className="p-6">
            <h3 className="text-lg text-white font-medium mb-4">Upcoming Maintenance</h3>
            <div className="space-y-4">
              {[
                { panel: "Solar Panel 3", date: "May 20, 2025", farm: "Jaipur Solar Farm", days: 8 },
                { panel: "Solar Panel 9", date: "May 25, 2025", farm: "Gujarat Solar Park", days: 13 },
                { panel: "Solar Panel 12", date: "June 2, 2025", farm: "Gujarat Solar Park", days: 21 },
                { panel: "Solar Panel 6", date: "June 10, 2025", farm: "Jaipur Solar Farm", days: 29 },
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-white">{item.panel}</div>
                    <div className="text-xs text-gray-400">{item.farm}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-white">{item.date}</div>
                    <div className="text-xs text-yellow-400">In {item.days} days</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-800">
              <Button
                className="w-full bg-transparent border border-gray-600 text-white hover:bg-[#2A1A1A]"
              >
                View All Maintenance Schedule
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </DashboardTemplate>
  );
};

export default PanelsPage;