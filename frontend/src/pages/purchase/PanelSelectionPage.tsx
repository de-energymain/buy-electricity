import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Button,
  Card,
  CardBody,
  Spinner,
  Tooltip,
} from "@nextui-org/react";
import { 
  ArrowLeft,
  Plus,
  Minus,
  LogIn,
  LayoutDashboard,
  Info 
} from "lucide-react";
import { motion } from "framer-motion";
import { useWallet } from "@solana/wallet-adapter-react"; // Import wallet hook
import logo from "../../assets/logo.svg";
import {
  FormContainer,
  cardClasses,
  secondaryButtonClasses,
  formElementTransition
} from "../../shared/styles";

interface FarmDetails {
  name: string;
  location: string;
  solarIndex: number;
  panelPower: number;
  efficiency: number;
  pricePerPanel: number;
  networkFee: number;
}

interface Calculations {
  totalCapacity: number;
  dailyOutput: number;
  platformFee: number;
  totalCost: number;
  dailyNRGYield: number; // Changed from perPanelNRGYield to dailyNRGYield
}

const PanelSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { connected } = useWallet(); // Get wallet connection status
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Panel configuration and details
  const [panelQuantity, setPanelQuantity] = useState<number>(14); // Default to 14 panels to match screenshot
  const [farmDetails] = useState<FarmDetails>({
    name: "Jaipur Solar Farm",
    location: "Jaipur, Rajasthan, India",
    solarIndex: 4.8,
    panelPower: 450, // Watts
    efficiency: 98, // Percentage
    pricePerPanel: 1, // USD (changed from 525 to 1)
    networkFee: 0 // USD
  });

  // Calculated values
  const [calculations, setCalculations] = useState<Calculations>({
    totalCapacity: 0,
    dailyOutput: 0,
    platformFee: 0,
    totalCost: 0,
    dailyNRGYield: 0, // Changed from perPanelNRGYield to dailyNRGYield
  });

  // Check authentication status when component mounts and when wallet connection changes
  useEffect(() => {
    const checkAuth = (): void => {
      // Check for wallet connection
      if (connected) {
        setIsAuthenticated(true);
        return;
      }

      // Check for Torus session
      const torusSession = localStorage.getItem("torusSession");
      if (torusSession) {
        setIsAuthenticated(true);
        return;
      }

      setIsAuthenticated(false);
    };

    checkAuth();
  }, [connected]);

  // Extract panels from query params if available, with support for both dollarAmount and kwh
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const panels = parseFloat(queryParams.get("panels") || "0");
    
    // Try to get dollarAmount first (new format), fallback to kwh (old format)
    const dollarAmount = parseFloat(queryParams.get("dollarAmount") || "0");
    const kwh = parseFloat(queryParams.get("kwh") || "0");
    
    if (panels > 0) {
      setPanelQuantity(panels);
    } else if (dollarAmount > 0) {
      // Calculate panels from dollar amount if no panel count is provided
      // Convert dollars to kWh first
      const averageElectricityRate = 0.12;
      const monthlyUsageKWh = dollarAmount / averageElectricityRate;
      // Calculate panels needed
      const effectiveMonthlyProduction = 3.75 * 0.8 * 30; // = 90
      const requiredCapacity = monthlyUsageKWh / effectiveMonthlyProduction;
      const requiredPanels = Math.ceil(requiredCapacity);
      setPanelQuantity(requiredPanels);
    } else if (kwh > 0) {
      // Fallback for old kwh-based calculation
      const effectiveMonthlyProduction = 3.75 * 0.8 * 30; // = 90
      const requiredCapacity = kwh / effectiveMonthlyProduction;
      const requiredPanels = Math.ceil(requiredCapacity);
      setPanelQuantity(requiredPanels);
    }
  }, [location.search]);

  // Recalculate whenever panel quantity changes
  useEffect(() => {
    // Calculate total capacity (kW)
    const capacity = panelQuantity * 1; //Previously (panelQuantity * farmDetails.panelPower) / 1000

    // Calculate estimated daily output (kWh)
    const dailyOutput = parseFloat((capacity * 2.8).toFixed(2)); //Previously Math.round(capacity * farmDetails.solarIndex * (farmDetails.efficiency / 100));

    // Calculate total cost
    const panelCost = panelQuantity * farmDetails.pricePerPanel;
    // Calculate platform fee as exactly 10% without rounding
    const platformFee = panelCost * 0.1;
    const totalCost = panelCost; //Previously included + platformFee;

    // Calculate daily NRG yield (for all panels combined)
    const panelPowerKW = farmDetails.panelPower / 1000;
    const dailyEnergy = panelPowerKW * 3.5 * panelQuantity; // Multiply by panel quantity for total
    const pricePerKWh = 0.15; // Previously assumed as $0.1
    const dailyNRGYield = (dailyEnergy * pricePerKWh) / 0.1;

    setCalculations({
      totalCapacity: capacity,
      dailyOutput,
      platformFee,
      totalCost,
      dailyNRGYield
    });
  }, [panelQuantity, farmDetails]);

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 1) {
      setPanelQuantity(value);
    }
  };

  const handleDecreaseQuantity = (): void => {
    if (panelQuantity > 1) {
      setPanelQuantity(prev => prev - 1);
    }
  };

  const handleIncreaseQuantity = (): void => {
    setPanelQuantity(prev => prev + 1);
  };

  const handleContinueToPayment = (): void => {
    setIsLoading(true);

    // Create query params with all the necessary data
    const queryParams = new URLSearchParams({
      farm: farmDetails.name,
      location: farmDetails.location,
      panels: panelQuantity.toString(),
      capacity: calculations.totalCapacity.toString(),
      output: calculations.dailyOutput.toString(),
      cost: calculations.totalCost.toString()
    });

    // Add a slight delay for better UX
    setTimeout(() => {
      navigate(`/payment?${queryParams.toString()}`);
    }, 500);
  };

  const handleBack = (): void => {
    navigate(-1);
  };

  const handleAuthButtonClick = (e: React.MouseEvent<HTMLAnchorElement>): void => {
    e.preventDefault();
    navigate(isAuthenticated ? "/dashboard" : "/login");
  };

  return (
    <FormContainer>
      {/* Logo */}
      <div className="flex justify-center relative z-10 mb-4">
        <div className="w-24">
          <img src={logo} alt="Renrg logo" />
        </div>
      </div>

      {/* Navigation Bar with Back button and Login/Dashboard link side by side */}
      <div className="max-w-md mx-auto w-full relative z-10">
        <div className="flex justify-between items-center mb-4">
          <Button
            className={secondaryButtonClasses}
            onPress={handleBack}
            startContent={<ArrowLeft size={20} />}
            disabled={isLoading}
          >
            Back
          </Button>

          {/* Conditional Login/Dashboard link aligned to the right */}
          <a
            href={isAuthenticated ? "/dashboard" : "/login"}
            onClick={handleAuthButtonClick}
            className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors duration-300"
          >
            {isAuthenticated ? (
              <>
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </>
            ) : (
              <>
                <LogIn size={18} />
                <span>Login</span>
              </>
            )}
          </a>
        </div>

        <Card className={cardClasses}>
          <div className="mt-3 p-4 bg-[#2F2F2F]">
            <h2 className="text-3xl font-bold text-white mb-2 font-electrolize text-center">
              Select Panels
            </h2>
            <p className="text-sm text-gray-300 text-center font-inter">
              Review and confirm your selection.
            </p>
          </div>

          <CardBody className="bg-[#2F2F2F] p-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-white mb-4 font-electrolize">Panel Details</h3>

                {/* Panel Quantity Selector */}
                <div className="flex items-center justify-between mb-6">
                  <div className="text-white font-medium">Panel Quantity</div>
                  <div className="flex items-center">
                    <Button
                      isIconOnly
                      size="sm"
                      className="bg-[#222] text-white rounded-full"
                      onPress={handleDecreaseQuantity}
                    >
                      <Minus size={16} />
                    </Button>
                    <input
                      type="number"
                      min={1}
                      value={panelQuantity}
                      onChange={handleQuantityChange}
                      className="mx-4 h-10 w-16 text-center text-xl font-bold text-white bg-[#1e1e1e] border border-gray-700 rounded [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                    />
                    <Button
                      isIconOnly
                      size="sm"
                      className="bg-[#222] text-white rounded-full"
                      onPress={handleIncreaseQuantity}
                    >
                      <Plus size={16} />
                    </Button>
                  </div>
                </div>

                {/* Capacity, Daily Output, and NRG Yield - REORDERED as requested */}
                <div className="flex justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      Total Capacity
                      <Tooltip
                        content="Total capacity of your purchased solar panels. Each panel has a capacity of 1.0 kW."
                        className="bg-[#3b3b3b] text-white text-xs px-3 py-2 rounded shadow-lg font-inter"
                      >
                        <Info size={14} className="text-gray-400 hover:text-white cursor-pointer" />
                      </Tooltip>
                    </div>
                    <div className="text-lg font-bold text-white">{calculations.totalCapacity.toFixed(2)} kW</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      Est. Daily Output
                      <Tooltip
                        content="Your daily output of the purhcased panels. Each panel gives an output of 2.8 kWh."
                        className="bg-[#3b3b3b] text-white text-xs px-3 py-2 rounded shadow-lg font-inter"
                      >
                        <Info size={14} className="text-gray-400 hover:text-white cursor-pointer" />
                      </Tooltip>
                    </div>
                    <div className="text-lg font-bold text-white">{calculations.dailyOutput} kWh</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      Est. Daily Yield
                      <Tooltip
                        content="Your yield generated daily upon purchase of the solar panels."
                        className="bg-[#3b3b3b] text-white text-xs px-3 py-2 rounded shadow-lg font-inter"
                      >
                        <Info size={14} className="text-gray-400 hover:text-white cursor-pointer" />
                      </Tooltip>
                    </div>
                    <div className="text-lg font-bold text-white">{calculations.dailyNRGYield.toFixed(2)} NRG</div>
                  </div>
                </div>

                {/* Cost Breakdown */}
                <div className="space-y-2 border-t border-gray-700 pt-4">
                  <div className="flex justify-between">
                    <div className="text-gray-300">Per Panel Cost</div>
                    <div className="text-white font-medium">${farmDetails.pricePerPanel}</div>
                  </div>
                  <div className="flex justify-between">
                    <div className="text-gray-300">Total Panel Cost ({panelQuantity} panels)</div>
                    <div className="text-white font-medium">${panelQuantity * farmDetails.pricePerPanel}</div>
                  </div>
                  {/*<div className="flex justify-between">
                    <div className="text-gray-300">Platform Fee (10%)</div>
                    <div className="text-white font-medium">${calculations.platformFee.toFixed(2)}</div>
                  </div>
                  */}
                  <div className="flex justify-between border-t border-gray-700 pt-2 mt-2">
                    <div className="text-white font-bold">Total Amount</div>
                    <div className="text-white font-bold">${calculations.totalCost}</div>
                  </div>
                </div>
              </div>

              {/* Continue Button */}
              <motion.div
                {...formElementTransition}
                className="pt-2"
              >
                <Button
                  className="w-full bg-[#E9423A] text-white font-medium py-6 rounded-none"
                  onPress={handleContinueToPayment}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Spinner color="white" size="sm" />
                  ) : (
                    "Continue to Payment"
                  )}
                </Button>
              </motion.div>
            </div>
          </CardBody>
        </Card>
      </div>
    </FormContainer>
  );
};

export default PanelSelectionPage;