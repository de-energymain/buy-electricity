import { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  Tabs,
  Tab,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button
} from "@nextui-org/react";
import { Calendar, ChevronDown, Download, Filter } from "lucide-react";
import DashboardTemplate from "../../components/DashboardTemplate";

interface AnalyticsData {
  day: string;
  energyProduced: number;
  earnings: number;
  efficiency: number;
}

const AnalyticsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("production");
  const [timeRange, setTimeRange] = useState<string>("month");
  const [analytics, setAnalytics] = useState<AnalyticsData[]>([]);
  const [totalStats, setTotalStats] = useState({
    totalEnergy: 0,
    totalEarnings: 0,
    averageEfficiency: 0
  });

  // Generate mock data
  useEffect(() => {
    generateAnalyticsData(timeRange);
  }, [timeRange]);

  const generateAnalyticsData = (range: string) => {
    let data: AnalyticsData[] = [];
    let days: string[] = [];
    let totalEnergy = 0;
    let totalEarnings = 0;
    let efficiencySum = 0;

    switch (range) {
      case "week":
        days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
        break;
      case "month":
        days = Array.from({ length: 30 }, (_, i) => `Day ${i + 1}`);
        break;
      case "year":
        days = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        break;
      default:
        days = Array.from({ length: 30 }, (_, i) => `Day ${i + 1}`);
    }

    data = days.map(day => {
      const energyProduced = Math.floor(Math.random() * 50) + 20; // 20-70 kWh
      const earnings = +(energyProduced * 0.12).toFixed(2); // $0.12 per kWh
      const efficiency = Math.floor(Math.random() * 20) + 60; // 60-80%
      
      totalEnergy += energyProduced;
      totalEarnings += earnings;
      efficiencySum += efficiency;
      
      return {
        day,
        energyProduced,
        earnings,
        efficiency
      };
    });

    setAnalytics(data);
    setTotalStats({
      totalEnergy,
      totalEarnings,
      averageEfficiency: +(efficiencySum / days.length).toFixed(1)
    });
  };

  // Charts data preparation
  const maxEnergy = Math.max(...analytics.map(item => item.energyProduced));
  const maxEarnings = Math.max(...analytics.map(item => item.earnings));

  return (
    <DashboardTemplate title="Analytics" activePage="analytics">
      <div className="mb-6">
        <Card className="bg-[#1A1A1A] border-none">
          <CardBody className="p-6">
            <div className="flex justify-between items-center mb-6">
              <Tabs 
                aria-label="Analytics Tabs" 
                selectedKey={activeTab}
                onSelectionChange={key => setActiveTab(key as string)}
                color="danger"
                variant="bordered"
              >
                <Tab key="production" title="Energy Production" />
                <Tab key="earnings" title="Earnings" />
                <Tab key="efficiency" title="Efficiency" />
              </Tabs>
              
              <div className="flex items-center gap-2">
                <Dropdown>
                  <DropdownTrigger>
                    <Button 
                      className="bg-[#2A2A2A] text-white border-none"
                      endContent={<ChevronDown size={16} />}
                      startContent={<Calendar size={16} />}
                    >
                      {timeRange === "week" ? "Last Week" : timeRange === "month" ? "Last Month" : "This Year"}
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu 
                    aria-label="Time Range"
                    selectionMode="single"
                    selectedKeys={[timeRange]}
                    onSelectionChange={keys => {
                      const selected = Array.from(keys)[0];
                      if (selected) setTimeRange(selected.toString());
                    }}
                  >
                    <DropdownItem key="week">Last Week</DropdownItem>
                    <DropdownItem key="month">Last Month</DropdownItem>
                    <DropdownItem key="year">This Year</DropdownItem>
                  </DropdownMenu>
                </Dropdown>
                
                <Button 
                  isIconOnly 
                  className="bg-[#2A2A2A] text-white"
                >
                  <Filter size={16} />
                </Button>
                
                <Button 
                  isIconOnly 
                  className="bg-[#2A2A2A] text-white"
                >
                  <Download size={16} />
                </Button>
              </div>
            </div>

            <div className="h-[400px] relative mb-8">
              {/* Energy Production Chart */}
              {activeTab === "production" && (
                <div className="absolute inset-0 flex items-end">
                  {analytics.map((item, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center h-full pt-8">
                      <div className="text-xs text-gray-400 mb-1">{item.energyProduced} kWh</div>
                      <div 
                        className="w-6 bg-gradient-to-t from-red-800 to-[#E9423A] rounded-sm"
                        style={{ height: `${(item.energyProduced / maxEnergy) * 300}px` }}
                      ></div>
                      <div className="text-xs text-gray-400 mt-2 transform -rotate-45 origin-top-left">{timeRange === "year" ? item.day : index % 3 === 0 ? item.day : ""}</div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Earnings Chart */}
              {activeTab === "earnings" && (
                <div className="absolute inset-0 flex items-end">
                  {analytics.map((item, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center h-full pt-8">
                      <div className="text-xs text-gray-400 mb-1">${item.earnings}</div>
                      <div 
                        className="w-6 bg-gradient-to-t from-green-800 to-green-500 rounded-sm"
                        style={{ height: `${(item.earnings / maxEarnings) * 300}px` }}
                      ></div>
                      <div className="text-xs text-gray-400 mt-2 transform -rotate-45 origin-top-left">{timeRange === "year" ? item.day : index % 3 === 0 ? item.day : ""}</div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Efficiency Chart */}
              {activeTab === "efficiency" && (
                <div className="absolute inset-0 flex items-end">
                  {analytics.map((item, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center h-full pt-8">
                      <div className="text-xs text-gray-400 mb-1">{item.efficiency}%</div>
                      <div 
                        className="w-6 bg-gradient-to-t from-blue-800 to-blue-500 rounded-sm"
                        style={{ height: `${(item.efficiency / 100) * 300}px` }}
                      ></div>
                      <div className="text-xs text-gray-400 mt-2 transform -rotate-45 origin-top-left">{timeRange === "year" ? item.day : index % 3 === 0 ? item.day : ""}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-[#2A2A2A] p-4 rounded-lg">
                <div className="text-sm text-gray-400">Total Energy</div>
                <div className="text-2xl font-bold">{totalStats.totalEnergy} kWh</div>
              </div>
              <div className="bg-[#2A2A2A] p-4 rounded-lg">
                <div className="text-sm text-gray-400">Total Earnings</div>
                <div className="text-2xl font-bold">${totalStats.totalEarnings.toFixed(2)}</div>
              </div>
              <div className="bg-[#2A2A2A] p-4 rounded-lg">
                <div className="text-sm text-gray-400">Avg. Efficiency</div>
                <div className="text-2xl font-bold">{totalStats.averageEfficiency}%</div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
      
      {/* Detailed Analytics Table */}
      <Card className="bg-[#1A1A1A] border-none">
        <CardBody>
          <Table 
            aria-label="Analytics data table"
            removeWrapper
            classNames={{
              base: "bg-[#1A1A1A] text-white",
              thead: "bg-[#2A2A2A]",
              th: "text-gray-400 text-xs font-normal py-3",
              td: "text-white border-t border-gray-800"
            }}
          >
            <TableHeader>
              <TableColumn>DATE</TableColumn>
              <TableColumn>ENERGY PRODUCED</TableColumn>
              <TableColumn>EARNINGS</TableColumn>
              <TableColumn>EFFICIENCY</TableColumn>
            </TableHeader>
            <TableBody>
              {analytics.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.day}</TableCell>
                  <TableCell>{item.energyProduced} kWh</TableCell>
                  <TableCell>${item.earnings}</TableCell>
                  <TableCell>{item.efficiency}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>
    </DashboardTemplate>
  );
};

export default AnalyticsPage;