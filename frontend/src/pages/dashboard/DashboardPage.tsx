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
  ModalFooter
} from "@nextui-org/react";
import { useWallet } from '@solana/wallet-adapter-react';
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

function DashboardPage() {
  const navigate = useNavigate();
  const { disconnect, connected } = useWallet();
  const [activeTab, setActiveTab] = useState("week");
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
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
          // Store user info for potential future use
          console.log("User authenticated:", data.userInfo.name, data.userInfo.email);
          if (data.publicKey) {
            console.log("Public key available:", data.publicKey);
          }
        }
      } catch (e) {
        console.error("Error parsing Web3Auth session", e);
      }
    }
  }, []);

  // Generate mock data on component mount
  useEffect(() => {
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

    generateChartData("week");
  }, []);

  const generateChartData = (period: string) => {
    let data: ChartData[] = [];

    switch (period) {
      case "day":
        const hours = ["12AM", "3AM", "6AM", "9AM", "12PM", "3PM", "6PM", "9PM"];
        data = hours.map(hour => ({
          day: hour,
          value: Math.floor(Math.random() * 6) + 2
        }));
        break;

      case "week":
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
        const weeks = ["Week 1", "Week 2", "Week 3", "Week 4"];
        data = weeks.map(week => ({
          day: week,
          value: Math.floor(Math.random() * 150) + 100
        }));
        break;

      case "year":
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        data = months.map(month => ({
          day: month,
          value: Math.floor(Math.random() * 500) + 300
        }));
        break;
    }

    setChartData(data);
  };

  const handleTabChange = (key: React.Key) => {
    setActiveTab(key as string);
    generateChartData(key as string);
  };

  const handleNodeDetails = (nodeId: string) => {
    console.log(`View details for node: ${nodeId}`);
    navigate(`/dashboard/node/${nodeId}`);
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

  const maxValue = Math.max(...chartData.map(item => item.value));

  return (
    <DashboardTemplate title="Dashboard" activePage="dashboard">
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
                      style={{ height: `${(item.value / maxValue) * 180}px` }}
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