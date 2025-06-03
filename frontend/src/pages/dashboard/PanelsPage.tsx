import { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  Button,
  Progress,
  Input,
  Divider,
  //Chip
} from "@nextui-org/react";
import {
  Search,
  Activity,
  Zap,
  Sun,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
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

  /* Toggle panel active status
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
  */

  /*const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'maintenance': return 'warning';
      case 'offline': return 'danger';
      default: return 'default';
    }
  };*/

  // Format date
//   const formatDate = (dateString: string) => {
//     const date = new Date(dateString);
//     return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
//   };

  return (
    <DashboardTemplate title="Solar Panels" activePage="panels">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Panel Management</h1>
            <p className="text-gray-400">Monitor and manage your solar panel infrastructure.</p>
          </div>         
        </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-[#1A1A1A] to-[#2A1A1A] backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:border-[#E9423A]/30">
          <div className="flex justify-between items-start mb-4">
            <div className="text-sm font-medium text-gray-400 uppercase tracking-wide">Total Panels</div>
            <div className="w-12 h-12 bg-gradient-to-br from-[#E9423A]/20 to-[#E9423A]/10 rounded-xl flex items-center justify-center border border-[#E9423A]/20">
              <Sun size={20} className="text-[#E9423A]" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-2">{panels.length}</div>
          <div className="text-sm text-gray-400">Total Power: <span className="text-white font-semibold">{totalPower.toFixed(2)} kW</span></div>
        </div>
        
        <div className="bg-gradient-to-br from-[#1A1A1A] to-[#2A1A1A] backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:border-green-500/30">
          <div className="flex justify-between items-start mb-4">
            <div className="text-sm font-medium text-gray-400 uppercase tracking-wide">Active Panels</div>
            <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-green-500/10 rounded-xl flex items-center justify-center border border-green-500/20">
              <CheckCircle2 size={20} className="text-green-500" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-2">{activeCount}</div>
          <div className="text-sm text-gray-400"><span className="text-green-500 font-semibold">{((activeCount / panels.length) * 100).toFixed(0)}%</span> Online</div>
        </div>
        
        <div className="bg-gradient-to-br from-[#1A1A1A] to-[#2A1A1A] backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:border-yellow-500/30">
          <div className="flex justify-between items-start mb-4">
            <div className="text-sm font-medium text-gray-400 uppercase tracking-wide">Maintenance</div>
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-500/20 to-yellow-500/10 rounded-xl flex items-center justify-center border border-yellow-500/20">
              <Activity size={20} className="text-yellow-500" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-2">{maintenanceCount}</div>
          <div className="text-sm text-gray-400"><span className="text-yellow-500 font-semibold">{((maintenanceCount / panels.length) * 100).toFixed(0)}%</span> Under Maintenance</div>
        </div>
        
        <div className="bg-gradient-to-br from-[#1A1A1A] to-[#2A1A1A] backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:border-red-500/30">
          <div className="flex justify-between items-start mb-4">
            <div className="text-sm font-medium text-gray-400 uppercase tracking-wide">Offline</div>
            <div className="w-12 h-12 bg-gradient-to-br from-red-500/20 to-red-500/10 rounded-xl flex items-center justify-center border border-red-500/20">
              <AlertTriangle size={20} className="text-red-500" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-2">{offlineCount}</div>
          <div className="text-sm text-gray-400"><span className="text-red-500 font-semibold">{((offlineCount / panels.length) * 100).toFixed(0)}%</span> Offline</div>
        </div>
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
      
     {/* Panels Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
        {filteredPanels.length === 0 ? (
          <div className="col-span-full">
            <Card className="bg-[#1A1A1A] border border-gray-800">
              <CardBody className="text-center py-12">
                <Sun size={48} className="text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No panels found</h3>
                <p className="text-gray-400">Try adjusting your search criteria</p>
              </CardBody>
            </Card>
          </div>
        ) : (
          filteredPanels.map((panel) => (
            <Card key={panel.id} className="bg-gradient-to-br from-[#1A1A1A] to-[#2A1A1A] border border-gray-800 hover:border-gray-700 transition-all duration-200 shadow-lg">
              <CardBody className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      panel.status === 'active' ? 'bg-green-500/20 text-green-400' : 
                      panel.status === 'maintenance' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {panel.status === 'active' ? <Zap size={20} /> : 
                       panel.status === 'maintenance' ? <Activity size={20} /> : <AlertTriangle size={20} />}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{panel.name}</h3>
                      <p className="text-sm text-gray-400">{panel.farm}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {/*<div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Status</span>
                    <Chip
                      size="sm"
                      color={getStatusColor(panel.status)}
                      variant="flat"
                      className="capitalize"
                    >
                      {panel.status}
                    </Chip>
                  </div>*/}
                  
                  {/* <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Efficiency</span>
                    <div className="flex items-center gap-2">
                      <Progress 
                        size="sm" 
                        value={panel.efficiency} 
                        maxValue={100}
                        color={getHealthColor(panel.efficiency)}
                        className="w-16"
                      />
                      <span className="text-sm font-medium text-white">{panel.efficiency}%</span>
                    </div>
                  </div> */}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Daily Output</span>
                    <span className="text-sm font-medium text-white">{panel.dailyOutput} kWh</span>
                  </div>
                </div>
                
                <Divider className="my-4 bg-gray-800" />
                
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    Location: {panel.location}
                  </div>
                  <Button
                    size="sm"
                    endContent={<ChevronRight size={14} />}
                    className="bg-transparent text-[#E9423A] hover:bg-[#E9423A]/10 font-medium"
                  >
                    Details
                  </Button>
                </div>
              </CardBody>
            </Card>
          ))
        )}
      </div>
      
      {/* Panel Stats */}
      <div className="hidden grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-[#1A1A1A] to-[#2A1A1A] border-none">
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
        
        <Card className="bg-gradient-to-br from-[#1A1A1A] to-[#2A1A1A] border-none">
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
      </div>
    </DashboardTemplate>
  );
};

export default PanelsPage;