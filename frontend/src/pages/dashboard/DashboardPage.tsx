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
import { ArrowRight, CreditCard, Zap, DollarSign } from "lucide-react";
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

function DashboardPage() {
  const navigate = useNavigate();
  const { disconnect, connected, wallet } = useWallet();
  const [activeTab, setActiveTab] = useState("week");
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [nodes, setNodes] = useState<NodeData[]>([]);
  //const [username, setUsername] = useState<string | null>(null);
  const [walletID, setWalletID] = useState<string | null>(null);
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
    highest: 72,
    yield: 55.44,
    totalPanels: 15,
  });

  //Update user in database
  const updateUserInDatabase = async (userData: UserData) => {
    try {
      const response = await fetch('http://localhost:5000/api/users', {
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
          //setUsername(data.userInfo.name);
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

  useEffect(() => {
    const getStats = async() => {
    if (!walletID) {
      console.error("Wallet ID is not available");
      return;
    }
    try {
      console.log(`GET to http://localhost:5000/api/users/${walletID}`)
      const response = await fetch(`http://localhost:5000/api/users/${walletID}`);
      const data = await response.json();

      if(data) {
        const generatedYield = data.user.panelDetails.generatedYield;
        const purchasedPanels = data.user.panelDetails.purchasedPanels;
        setStats(prevStats => ({
          ...prevStats,
          yield: generatedYield,
          totalPanels: purchasedPanels
        }));      
      } 
    } catch (error) {
      console.error('Error fetching panels data:', error);
    }
  };

  getStats();
  }, [walletID]);


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

  /*const handleNodeDetails = (nodeId: string) => {
    console.log(`View details for node: ${nodeId}`);
    navigate(`/dashboard/node/${nodeId}`);
  };*/

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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Welcome Back!</h1>
        <p className="text-gray-400">Here are your solar investments at a glance.</p>
      </div>



      {/* Top Row - Panels and Key Metrics Cards on same line */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
        {/* Left - Your panels section */}
        <div className="lg:col-span-1">
          <h2 className="text-xl font-semibold text-white mb-4">Your panels</h2>
          <Card className="bg-[#1A1A1A] border-none">
            <CardBody className="p-4">
              <div className="mb-4">
                <h3 className="text-lg font-medium text-white">{stats.totalPanels} Panels</h3>
                <p className="text-sm text-gray-400">Multiple Solar Farms • India</p>
              </div>
              
              <div className="flex items-center p-3 bg-[#2A1A1A] rounded-lg mb-4">
                <div className="w-8 h-8 mr-3 flex items-center justify-center text-lg">
                  ⚡
                </div>
                <div>
                  <div className="text-sm font-medium text-white">Active solar farm investments</div>
                  <div className="text-xs text-gray-400">Generating clean energy across {nodes.length} nodes.</div>
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

        {/* Right - Key Metrics Cards */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold text-white mb-4">Key Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* NRG Earnings - Same color as panels */}
            <Card 
              className="bg-[#1A1A1A] border-none cursor-pointer hover:bg-[#2A1A1A] transition-all duration-300"
              isPressable
              onPress={() => navigate("/dashboard/wallet")}
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

            {/* Transactions */}
            <Card 
              className="bg-[#1A1A1A] border-none hover:bg-[#2A1A1A] transition-all duration-300 cursor-pointer"
              isPressable
              onPress={() => navigate("/dashboard/transactions")}
            >
              <CardBody className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <CreditCard size={20} className="text-blue-400" />
                  </div>
                  <ArrowRight size={16} className="text-blue-400" />
                </div>
                <div className="text-2xl font-bold text-white mb-1">${(stats.yield).toFixed(4)}</div>
                <div className="text-sm text-gray-400 mb-2">Monthly Savings</div>
                <div className="text-xs text-green-400">+1.5% this month</div>
              </CardBody>
            </Card>

            {/* Energy Generated */}
            <Card 
              className="bg-[#1A1A1A] border-none hover:bg-[#2A1A1A] transition-all duration-300 cursor-pointer"
              isPressable
              onPress={() => navigate("/dashboard/analytics")}
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
                <div className="text-xs text-green-400">+{stats.energyChange}% this month</div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
        {/* Left Column */}
        <div className="lg:col-span-1 space-y-6">
          <div>
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
                        <div className="text-2xl font-bold text-white">${(stats.yield).toFixed(4)}</div>
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
        <div className="lg:col-span-2 space-y-6">         

          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Your solar energy production</h2>
            <Card className="bg-[#1A1A1A] border-none">
              <CardBody className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-white">Energy Production</h3>
                    <p className="text-sm text-gray-400">Track your energy generation over time</p>
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

                <div className="flex justify-between mt-6 pt-4 border-t border-gray-800">
                  <div className="text-center">
                    <div className="text-xs text-gray-400">Avg. Daily</div>
                    <div className="font-medium text-white">32 kWh</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-400">Peak Output</div>
                    <div className="font-medium text-white">45 kWh</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-400">Total Week</div>
                    <div className="font-medium text-white">224 kWh</div>
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
