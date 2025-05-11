import { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  CardFooter,
  Button,
  Input,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Tabs,
  Tab,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Chip
} from "@nextui-org/react";
import {
  Search,
  Filter,
  SlidersHorizontal,
  Sun,
  Wind,
  Droplets,
  Zap,
  Globe,
  Info,
} from "lucide-react";
import DashboardTemplate from "../../components/DashboardTemplate";

// Farm interface
interface Farm {
  id: string;
  name: string;
  location: string;
  type: "solar" | "wind" | "hydro";
  capacity: number;
  panelPrice: number;
  roi: number;
  panelsAvailable: number;
  energyPerPanel: number;
  image: string;
  latitude: number;
  longitude: number;
  efficiency: number;
  inauguration: string;
  description: string;
}

// Panel purchase interface
interface PanelPurchase {
  farmId: string;
  farmName: string;
  panelCount: number;
  pricePerPanel: number;
  totalPrice: number;
}

const MarketplacePage: React.FC = () => {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [filteredFarms, setFilteredFarms] = useState<Farm[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [energyTypeFilter, setEnergyTypeFilter] = useState<Set<string>>(new Set(["all"]));
  const [sortOption, setSortOption] = useState<string>("roi-desc");
  const [activeTab, setActiveTab] = useState<string>("buy");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [panelCount, setPanelCount] = useState<number>(1);
  const [purchase, setPurchase] = useState<PanelPurchase | null>(null);
  
  // Generate mock data
  useEffect(() => {
    const mockFarms: Farm[] = [
      {
        id: "jaipur-01",
        name: "Jaipur Solar Farm",
        location: "Jaipur, Rajasthan, India",
        type: "solar",
        capacity: 250,
        panelPrice: 525,
        roi: 12.5,
        panelsAvailable: 1240,
        energyPerPanel: 1.8,
        image: "https://via.placeholder.com/600x400/FF5733/FFFFFF?text=Jaipur+Solar+Farm",
        latitude: 26.9124,
        longitude: 75.7873,
        efficiency: 22.4,
        inauguration: "2023-08-15",
        description: "Located in the sunny desert region of Rajasthan, the Jaipur Solar Farm harnesses India's abundant solar energy. Each panel contains premium monocrystalline cells with advanced sun-tracking technology."
      },
      {
        id: "gujarat-01",
        name: "Gujarat Solar Park",
        location: "Charanka, Gujarat, India",
        type: "solar",
        capacity: 600,
        panelPrice: 495,
        roi: 11.8,
        panelsAvailable: 3500,
        energyPerPanel: 1.65,
        image: "https://via.placeholder.com/600x400/33A8FF/FFFFFF?text=Gujarat+Solar+Park",
        latitude: 23.5880,
        longitude: 72.5795,
        efficiency: 21.2,
        inauguration: "2022-04-20",
        description: "One of India's largest solar installations, the Gujarat Solar Park generates clean electricity at an impressive scale. The panels use anti-reflective coating to maximize light absorption."
      },
      {
        id: "kerala-01",
        name: "Kerala Wind Farm",
        location: "Palakkad, Kerala, India",
        type: "wind",
        capacity: 150,
        panelPrice: 650,
        roi: 13.2,
        panelsAvailable: 850,
        energyPerPanel: 2.2,
        image: "https://via.placeholder.com/600x400/33FF57/000000?text=Kerala+Wind+Farm",
        latitude: 10.7867,
        longitude: 76.6548,
        efficiency: 42.5,
        inauguration: "2023-01-10",
        description: "Set in the windy passes of the Western Ghats, the Kerala Wind Farm utilizes constant air currents to generate renewable energy. Each turbine is designed to operate efficiently even at lower wind speeds."
      },
      {
        id: "uttarakhand-01",
        name: "Himalayan Hydro Plant",
        location: "Tehri, Uttarakhand, India",
        type: "hydro",
        capacity: 400,
        panelPrice: 720,
        roi: 14.5,
        panelsAvailable: 1600,
        energyPerPanel: 2.8,
        image: "https://via.placeholder.com/600x400/5733FF/FFFFFF?text=Himalayan+Hydro+Plant",
        latitude: 30.3741,
        longitude: 78.4305,
        efficiency: 85.6,
        inauguration: "2021-11-02",
        description: "Powered by the pristine waters of the Himalayan rivers, this hydro plant provides consistent renewable energy. Advanced turbines capture energy with minimal environmental impact."
      },
      {
        id: "karnataka-01",
        name: "Bangalore Tech Solar",
        location: "Bangalore, Karnataka, India",
        type: "solar",
        capacity: 180,
        panelPrice: 530,
        roi: 12.1,
        panelsAvailable: 920,
        energyPerPanel: 1.75,
        image: "https://via.placeholder.com/600x400/A833FF/FFFFFF?text=Bangalore+Tech+Solar",
        latitude: 12.9716,
        longitude: 77.5946,
        efficiency: 23.1,
        inauguration: "2023-05-28",
        description: "Located near India's Silicon Valley, this solar farm combines cutting-edge technology with sustainable energy production. The panels include smart monitoring systems to optimize performance."
      },
      {
        id: "tamilnadu-01",
        name: "Chennai Coastal Wind",
        location: "Chennai, Tamil Nadu, India",
        type: "wind",
        capacity: 220,
        panelPrice: 680,
        roi: 13.8,
        panelsAvailable: 1080,
        energyPerPanel: 2.3,
        image: "https://via.placeholder.com/600x400/FF33A8/FFFFFF?text=Chennai+Coastal+Wind",
        latitude: 13.0827,
        longitude: 80.2707,
        efficiency: 45.2,
        inauguration: "2022-07-15",
        description: "Taking advantage of strong coastal winds, this farm produces reliable green energy. The turbines incorporate anti-corrosion materials to withstand the salty sea air."
      }
    ];
    
    setFarms(mockFarms);
    setFilteredFarms(mockFarms);
  }, []);

  // Apply search and filters
  useEffect(() => {
    let filtered = [...farms];
    
    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(farm => 
        farm.name.toLowerCase().includes(query) ||
        farm.location.toLowerCase().includes(query)
      );
    }
    
    // Apply energy type filter
    if (!energyTypeFilter.has("all")) {
      filtered = filtered.filter(farm => energyTypeFilter.has(farm.type));
    }
    
    // Apply sorting
    switch (sortOption) {
      case "roi-desc":
        filtered.sort((a, b) => b.roi - a.roi);
        break;
      case "roi-asc":
        filtered.sort((a, b) => a.roi - b.roi);
        break;
      case "price-desc":
        filtered.sort((a, b) => b.panelPrice - a.panelPrice);
        break;
      case "price-asc":
        filtered.sort((a, b) => a.panelPrice - b.panelPrice);
        break;
      case "energy-desc":
        filtered.sort((a, b) => b.energyPerPanel - a.energyPerPanel);
        break;
      case "energy-asc":
        filtered.sort((a, b) => a.energyPerPanel - b.energyPerPanel);
        break;
    }
    
    setFilteredFarms(filtered);
  }, [searchQuery, energyTypeFilter, sortOption, farms]);

  // Energy type icon
  const getEnergyTypeIcon = (type: string) => {
    switch (type) {
      case "solar":
        return <Sun size={20} className="text-yellow-500" />;
      case "wind":
        return <Wind size={20} className="text-blue-400" />;
      case "hydro":
        return <Droplets size={20} className="text-blue-600" />;
      default:
        return <Zap size={20} />;
    }
  };

  // Format energy type
  const formatEnergyType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  // Handle view farm details
  const handleViewFarm = (farm: Farm) => {
    setSelectedFarm(farm);
    setPanelCount(1);
    onOpen();
  };

  // Handle panel count change
  const handlePanelCountChange = (count: number) => {
    if (selectedFarm) {
      const validCount = Math.max(1, Math.min(count, selectedFarm.panelsAvailable));
      setPanelCount(validCount);
    }
  };

  // Handle buy panels
  const handleBuyPanels = () => {
    if (selectedFarm && panelCount > 0) {
      setPurchase({
        farmId: selectedFarm.id,
        farmName: selectedFarm.name,
        panelCount,
        pricePerPanel: selectedFarm.panelPrice,
        totalPrice: panelCount * selectedFarm.panelPrice
      });
      onClose();
      setActiveTab("checkout");
    }
  };

  // Handle cancel purchase
  const handleCancelPurchase = () => {
    setPurchase(null);
    setActiveTab("buy");
  };

  // Handle confirm purchase
  const handleConfirmPurchase = () => {
    // Here you would typically integrate with payment processing
    // and blockchain transactions
    alert(`Purchase of ${purchase?.panelCount} panels from ${purchase?.farmName} completed successfully!`);
    setPurchase(null);
    setActiveTab("buy");
  };

  return (
    <DashboardTemplate title="Marketplace" activePage="marketplace">
      <Tabs 
        aria-label="Marketplace Tabs" 
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
        <Tab key="buy" title="Buy Panels" />
        <Tab key="checkout" title="Checkout" isDisabled={!purchase} />
        <Tab key="mybids" title="My Bids" />
      </Tabs>
      
      {activeTab === "buy" && (
        <>
          {/* Filters */}
          <div className="mb-6 flex flex-col md:flex-row gap-4">
            <Input
              placeholder="Search farms..."
              startContent={<Search size={18} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="md:max-w-xs"
              classNames={{
                base: "bg-[#1A1A1A]",
                inputWrapper: "bg-[#1A1A1A] border-1 border-gray-700 hover:border-white focus-within:border-[#E9423A]",
                input: "text-white placeholder:text-gray-400"
              }}
            />
            
            <div className="flex flex-wrap gap-2 md:ml-auto">
              <Dropdown>
                <DropdownTrigger>
                  <Button 
                    className="bg-[#1A1A1A] text-white border-1 border-gray-700"
                    startContent={<Filter size={16} />}
                  >
                    Energy Type: {energyTypeFilter.has("all") ? "All" : Array.from(energyTypeFilter).map(formatEnergyType).join(", ")}
                  </Button>
                </DropdownTrigger>
                <DropdownMenu 
                  aria-label="Energy Type Filter"
                  closeOnSelect={false}
                  selectedKeys={energyTypeFilter}
                  selectionMode="multiple"
                  onSelectionChange={(keys) => {
                    if (keys.size === 0) {
                      setEnergyTypeFilter(new Set(["all"]));
                    } else {
                      setEnergyTypeFilter(keys as Set<string>);
                    }
                  }}
                  className="bg-[#1A1A1A] text-white border border-gray-700"
                >
                  <DropdownItem key="all">All</DropdownItem>
                  <DropdownItem key="solar" startContent={<Sun size={16} className="text-yellow-500" />}>Solar</DropdownItem>
                  <DropdownItem key="wind" startContent={<Wind size={16} className="text-blue-400" />}>Wind</DropdownItem>
                  <DropdownItem key="hydro" startContent={<Droplets size={16} className="text-blue-600" />}>Hydro</DropdownItem>
                </DropdownMenu>
              </Dropdown>
              
              <Dropdown>
                <DropdownTrigger>
                  <Button 
                    className="bg-[#1A1A1A] text-white border-1 border-gray-700"
                    startContent={<SlidersHorizontal size={16} />}
                  >
                    Sort By: {
                      sortOption === "roi-desc" ? "Highest ROI" :
                      sortOption === "roi-asc" ? "Lowest ROI" :
                      sortOption === "price-desc" ? "Highest Price" :
                      sortOption === "price-asc" ? "Lowest Price" :
                      sortOption === "energy-desc" ? "Most Energy" :
                      "Least Energy"
                    }
                  </Button>
                </DropdownTrigger>
                <DropdownMenu 
                  aria-label="Sort Options"
                  selectedKeys={[sortOption]}
                  selectionMode="single"
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0];
                    if (selected) setSortOption(selected.toString());
                  }}
                  className="bg-[#1A1A1A] text-white border border-gray-700"
                >
                  <DropdownItem key="roi-desc">Highest ROI</DropdownItem>
                  <DropdownItem key="roi-asc">Lowest ROI</DropdownItem>
                  <DropdownItem key="price-desc">Highest Price</DropdownItem>
                  <DropdownItem key="price-asc">Lowest Price</DropdownItem>
                  <DropdownItem key="energy-desc">Most Energy</DropdownItem>
                  <DropdownItem key="energy-asc">Least Energy</DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </div>
          </div>
          
          {/* Farms Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {filteredFarms.length > 0 ? (
              filteredFarms.map(farm => (
                <Card key={farm.id} className="bg-[#1A1A1A] border-none">
                  <div 
                    className="w-full h-40 bg-cover bg-center relative"
                    style={{ backgroundImage: `url(${farm.image})` }}
                  >
                    <div className="absolute top-2 right-2">
                      <Chip 
                        className={`${
                          farm.type === 'solar' ? 'bg-yellow-900 text-yellow-400' :
                          farm.type === 'wind' ? 'bg-blue-900 text-blue-400' :
                          'bg-blue-950 text-blue-500'
                        }`}
                        startContent={getEnergyTypeIcon(farm.type)}
                      >
                        {formatEnergyType(farm.type)}
                      </Chip>
                    </div>
                  </div>
                  <CardBody className="p-4">
                    <h3 className="text-lg font-bold mb-1">{farm.name}</h3>
                    <div className="flex items-center text-gray-400 text-sm mb-3">
                      <Globe className="mr-1" size={14} />
                      {farm.location}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <div className="text-xs text-gray-400">Panel Price</div>
                        <div className="font-medium">${farm.panelPrice}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">Annual ROI</div>
                        <div className="font-medium text-green-500">{farm.roi}%</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">Energy per Panel</div>
                        <div className="font-medium">{farm.energyPerPanel} kWh/day</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">Available</div>
                        <div className="font-medium">{farm.panelsAvailable} panels</div>
                      </div>
                    </div>
                  </CardBody>
                  <CardFooter className="pt-0 pb-4 px-4">
                    <Button
                      className="w-full bg-[#E9423A] text-white"
                      onPress={() => handleViewFarm(farm)}
                    >
                      View Details
                    </Button>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-10 text-gray-400">
                No farms match your search criteria.
              </div>
            )}
          </div>
        </>
      )}
      
      {activeTab === "checkout" && purchase && (
        <Card className="bg-[#1A1A1A] border-none">
          <CardBody className="p-6">
            <h3 className="text-xl font-bold mb-6">Complete Your Purchase</h3>
            
            <div className="mb-6 p-4 bg-[#2A1A1A] rounded-lg">
              <div className="text-lg font-medium mb-4">Order Summary</div>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <div className="text-gray-400">Farm</div>
                  <div>{purchase.farmName}</div>
                </div>
                <div className="flex justify-between">
                  <div className="text-gray-400">Number of Panels</div>
                  <div>{purchase.panelCount}</div>
                </div>
                <div className="flex justify-between">
                  <div className="text-gray-400">Price per Panel</div>
                  <div>${purchase.pricePerPanel}</div>
                </div>
              </div>
              
              <div className="flex justify-between pt-4 border-t border-gray-800">
                <div className="text-lg font-medium">Total</div>
                <div className="text-lg font-bold">${purchase.totalPrice}</div>
              </div>
            </div>
            
            <div className="mb-6 p-4 bg-[#2A1A1A] rounded-lg">
              <div className="text-lg font-medium mb-4">Payment Method</div>
              
              <div className="flex flex-col md:flex-row gap-4">
                <Card className="bg-[#3A1A1A] border-2 border-[#E9423A] flex-1">
                  <CardBody className="p-4 flex items-center">
                    <div className="w-10 h-10 rounded-full bg-[#2A1A1A] flex items-center justify-center text-[#E9423A] mr-3">
                      <Zap size={20} />
                    </div>
                    <div>
                      <div className="font-medium">Pay with NRG</div>
                      <div className="text-xs text-gray-400">Using wallet balance</div>
                    </div>
                  </CardBody>
                </Card>
                
                <Card className="bg-[#2A2A2A] border border-gray-700 flex-1">
                  <CardBody className="p-4 flex items-center opacity-50">
                    <div className="w-10 h-10 rounded-full bg-[#2A1A1A] flex items-center justify-center text-gray-400 mr-3">
                      <Globe size={20} />
                    </div>
                    <div>
                      <div className="font-medium">Credit Card</div>
                      <div className="text-xs text-gray-400">Coming soon</div>
                    </div>
                  </CardBody>
                </Card>
              </div>
            </div>
            
            <div className="flex gap-4">
              <Button 
                className="flex-1 bg-transparent border border-gray-600 text-white"
                onPress={handleCancelPurchase}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1 bg-[#E9423A] text-white"
                onPress={handleConfirmPurchase}
              >
                Confirm Purchase
              </Button>
            </div>
          </CardBody>
        </Card>
      )}
      
      {activeTab === "mybids" && (
        <Card className="bg-[#1A1A1A] border-none">
          <CardBody className="p-6">
            <div className="text-center py-10 text-gray-400">
              <div className="text-lg mb-2">No active bids</div>
              <div className="text-sm mb-4">You haven't placed any bids in the marketplace yet.</div>
              <Button 
                className="bg-[#E9423A] text-white"
                onPress={() => setActiveTab("buy")}
              >
                Browse Farms
              </Button>
            </div>
          </CardBody>
        </Card>
      )}
      
      {/* Farm Details Modal */}
      <Modal 
        isOpen={isOpen} 
        onClose={onClose}
        size="lg"
        backdrop="blur"
        classNames={{
          base: "bg-[#1A1A1A] text-white",
          closeButton: "text-white bg-[#2A1A1A] hover:bg-[#3A1A1A]"
        }}
      >
        {selectedFarm && (
          <ModalContent>
            <ModalHeader className="border-b border-gray-800">{selectedFarm.name}</ModalHeader>
            <ModalBody>
              <div 
                className="w-full h-48 bg-cover bg-center rounded-lg mb-4"
                style={{ backgroundImage: `url(${selectedFarm.image})` }}
              />
              
              <div className="flex items-center mb-4">
                <Chip 
                  className={`mr-2 ${
                    selectedFarm.type === 'solar' ? 'bg-yellow-900 text-yellow-400' :
                    selectedFarm.type === 'wind' ? 'bg-blue-900 text-blue-400' :
                    'bg-blue-950 text-blue-500'
                  }`}
                  startContent={getEnergyTypeIcon(selectedFarm.type)}
                >
                  {formatEnergyType(selectedFarm.type)}
                </Chip>
                <div className="text-gray-400 text-sm flex items-center">
                  <Globe className="mr-1" size={14} />
                  {selectedFarm.location}
                </div>
              </div>
              
              <p className="text-gray-300 mb-6">
                {selectedFarm.description}
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <div className="text-xs text-gray-400">Capacity</div>
                  <div className="font-medium">{selectedFarm.capacity} MW</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Panel Price</div>
                  <div className="font-medium">${selectedFarm.panelPrice}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Annual ROI</div>
                  <div className="font-medium text-green-500">{selectedFarm.roi}%</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Energy per Panel</div>
                  <div className="font-medium">{selectedFarm.energyPerPanel} kWh/day</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Efficiency</div>
                  <div className="font-medium">{selectedFarm.efficiency}%</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Inauguration</div>
                  <div className="font-medium">{new Date(selectedFarm.inauguration).toLocaleDateString()}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Available</div>
                  <div className="font-medium">{selectedFarm.panelsAvailable} panels</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Coordinates</div>
                  <div className="font-medium">{selectedFarm.latitude.toFixed(4)}, {selectedFarm.longitude.toFixed(4)}</div>
                </div>
              </div>
              
              <div className="p-4 bg-[#2A1A1A] rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <div className="font-medium">Number of Panels</div>
                  <div className="flex items-center">
                    <Button
                      isIconOnly
                      size="sm"
                      className="bg-[#3A1A1A] text-white min-w-8 w-8 h-8"
                      onPress={() => handlePanelCountChange(panelCount - 1)}
                      isDisabled={panelCount <= 1}
                    >
                      -
                    </Button>
                    <div className="w-16 text-center font-bold mx-2">{panelCount}</div>
                    <Button
                      isIconOnly
                      size="sm"
                      className="bg-[#3A1A1A] text-white min-w-8 w-8 h-8"
                      onPress={() => handlePanelCountChange(panelCount + 1)}
                      isDisabled={panelCount >= selectedFarm.panelsAvailable}
                    >
                      +
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-xs text-gray-400">Total Price</div>
                    <div className="font-medium">${(panelCount * selectedFarm.panelPrice).toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Est. Daily Generation</div>
                    <div className="font-medium">{(panelCount * selectedFarm.energyPerPanel).toFixed(2)} kWh</div>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Info size={14} className="text-blue-400 mr-2 mt-0.5" />
                  <div className="text-xs text-gray-300">
                    Purchasing panels from this farm is estimated to earn you approximately ${(panelCount * selectedFarm.energyPerPanel * 0.12 * 365).toFixed(2)} annually.
                  </div>
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button 
                className="bg-transparent text-white"
                onPress={onClose}
              >
                Cancel
              </Button>
              <Button 
                className="bg-[#E9423A] text-white"
                onPress={handleBuyPanels}
              >
                Buy Panels
              </Button>
            </ModalFooter>
          </ModalContent>
        )}
      </Modal>
    </DashboardTemplate>
  );
};

export default MarketplacePage;