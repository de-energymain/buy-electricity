import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button, Card, CardBody, Spinner, Tooltip } from "@nextui-org/react";
import {
  ArrowLeft,
  Plus,
  Minus,
  LogIn,
  LayoutDashboard,
  Info,
} from "lucide-react";
import { motion } from "framer-motion";
import { useWallet } from "@solana/wallet-adapter-react"; // Import wallet hook
import logo from "../../assets/logo.svg";
import {
  FormContainer,
  cardClasses,
  secondaryButtonClasses,
  formElementTransition,
} from "../../shared/styles";
import {
  PlantAllocationService,
  PlantAllocation,
  PANEL_CAPACITY_KWP,
} from "../../services/plantAllocationService";

interface AllocationPreview {
  allocations: PlantAllocation[];
  totalCapacity: number;
  totalCost: number;
  error?: string;
}

interface Calculations {
  totalCapacity: number;
  dailyOutput: number;
  platformFee: number;
  totalCost: number;
  dailyNRGYield: number;
}

const PanelSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { connected } = useWallet(); // Get wallet connection status
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Panel configuration and allocation preview
  const [panelQuantity, setPanelQuantity] = useState<number>(14); // Default to 14 panels
  const [allocationPreview, setAllocationPreview] = useState<AllocationPreview>(
    {
      allocations: [],
      totalCapacity: 0,
      totalCost: 0,
    }
  );

  // Track total available capacity for display
  const [totalAvailableCapacity, setTotalAvailableCapacity] =
    useState<number>(0);

  // Calculated values for display
  const [calculations, setCalculations] = useState<Calculations>({
    totalCapacity: 0,
    dailyOutput: 0,
    platformFee: 0,
    totalCost: 0,
    dailyNRGYield: 0,
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

    const loadAvailableCapacity = async (): Promise<void> => {
      try {
        // Load total available capacity from dynamic API
        const availableCapacity =
          await PlantAllocationService.getTotalAvailableCapacity();
        setTotalAvailableCapacity(availableCapacity);
      } catch (error) {
        console.error("Error loading available capacity:", error);
        setTotalAvailableCapacity(0);
      }
    };

    checkAuth();
    loadAvailableCapacity();
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

  // Calculate allocation preview when panel quantity changes
  useEffect(() => {
    const calculateAllocation = async () => {
      try {
        const result = await PlantAllocationService.allocatePanels(
          panelQuantity
        );

        setAllocationPreview({
          allocations: result.allocations,
          totalCapacity: result.totalCapacity,
          totalCost: result.totalCost,
          error: result.error,
        });

        // Update calculations for display
        if (result.success) {
          // Calculate estimated daily output (kWh) - using average solar index
          const avgSolarIndex = 4.8; // Average across plants
          const dailyOutput = parseFloat(
            (result.totalCapacity * avgSolarIndex).toFixed(2)
          );

          // Calculate platform fee (10% of total cost)
          const platformFee = result.totalCost * 0.1;

          // Calculate daily NRG yield
          const dailyEnergy = result.totalCapacity * avgSolarIndex;
          const pricePerKWh = 0.15;
          const dailyNRGYield = (dailyEnergy * pricePerKWh) / 0.1;

          setCalculations({
            totalCapacity: result.totalCapacity,
            dailyOutput,
            platformFee,
            totalCost: result.totalCost,
            dailyNRGYield,
          });
        } else {
          // Reset calculations if allocation fails
          setCalculations({
            totalCapacity: 0,
            dailyOutput: 0,
            platformFee: 0,
            totalCost: 0,
            dailyNRGYield: 0,
          });
        }
      } catch (error) {
        console.error("Error calculating allocation:", error);
        setAllocationPreview({
          allocations: [],
          totalCapacity: 0,
          totalCost: 0,
          error: "Error calculating allocation",
        });
        setCalculations({
          totalCapacity: 0,
          dailyOutput: 0,
          platformFee: 0,
          totalCost: 0,
          dailyNRGYield: 0,
        });
      }
    };

    calculateAllocation();
  }, [panelQuantity]);

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 1) {
      // Convert kWp capacity to panel count for maximum allowed
      const maxPanelsFromCapacity = Math.floor(
        totalAvailableCapacity / PANEL_CAPACITY_KWP
      );
      const maxAllowed = maxPanelsFromCapacity; // Enforce strict capacity limits
      const finalValue = Math.min(value, maxAllowed);
      setPanelQuantity(finalValue);
    }
  };

  const handleDecreaseQuantity = (): void => {
    if (panelQuantity > 1) {
      setPanelQuantity((prev) => prev - 1);
    }
  };

  const handleIncreaseQuantity = (): void => {
    // Convert kWp capacity to panel count for maximum allowed
    const maxPanelsFromCapacity = Math.floor(
      totalAvailableCapacity / PANEL_CAPACITY_KWP
    );

    if (panelQuantity < maxPanelsFromCapacity) {
      setPanelQuantity((prev) => prev + 1);
    }
  };

  const handleContinueToPayment = (): void => {
    // Check if allocation is valid
    if (allocationPreview.error) {
      console.error("Cannot proceed: Insufficient capacity");
      return;
    }

    if (allocationPreview.allocations.length === 0) {
      console.error("Cannot proceed: No allocations available");
      return;
    }

    setIsLoading(true);

    // Create query params with plant allocation data
    const queryParams = new URLSearchParams({
      panels: panelQuantity.toString(),
      capacity: calculations.totalCapacity.toString(),
      output: calculations.dailyOutput.toString(),
      cost: calculations.totalCost.toString(),
      allocations: JSON.stringify(allocationPreview.allocations),
    });

    // Add a slight delay for better UX
    setTimeout(() => {
      navigate(`/payment?${queryParams.toString()}`);
    }, 500);
  };

  const handleBack = (): void => {
    navigate(-1);
  };

  const handleAuthButtonClick = (
    e: React.MouseEvent<HTMLAnchorElement>
  ): void => {
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
        </div>{" "}
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
                <h3 className="text-xl font-bold text-white mb-4 font-electrolize">
                  Panel Details
                </h3>

                {/* Panel Quantity Selector */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex flex-col">
                    <div className="text-white font-medium">Panel Quantity</div>
                    {totalAvailableCapacity > 0 && (
                      <div className="text-xs text-gray-400">
                        Available:{" "}
                        {Math.floor(
                          totalAvailableCapacity / PANEL_CAPACITY_KWP
                        )}{" "}
                        panels
                      </div>
                    )}
                  </div>
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
                      max={Math.floor(
                        totalAvailableCapacity / PANEL_CAPACITY_KWP
                      )}
                      value={panelQuantity}
                      onChange={handleQuantityChange}
                      className="mx-4 h-10 w-16 text-center text-xl font-bold text-white bg-[#1e1e1e] border border-gray-700 rounded [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                    />
                    <Button
                      isIconOnly
                      size="sm"
                      className="bg-[#222] text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                      onPress={handleIncreaseQuantity}
                      disabled={
                        panelQuantity >=
                        Math.floor(totalAvailableCapacity / PANEL_CAPACITY_KWP)
                      }
                      title={
                        panelQuantity >=
                        Math.floor(totalAvailableCapacity / PANEL_CAPACITY_KWP)
                          ? "Maximum available capacity reached"
                          : "Increase quantity"
                      }
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
                        <Info
                          size={14}
                          className="text-gray-400 hover:text-white cursor-pointer"
                        />
                      </Tooltip>
                    </div>
                    <div className="text-lg font-bold text-white">
                      {calculations.totalCapacity.toFixed(2)} kW
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      Est. Daily Output
                      <Tooltip
                        content="Your daily output of the purhcased panels. Each panel gives an output of 2.8 kWh."
                        className="bg-[#3b3b3b] text-white text-xs px-3 py-2 rounded shadow-lg font-inter"
                      >
                        <Info
                          size={14}
                          className="text-gray-400 hover:text-white cursor-pointer"
                        />
                      </Tooltip>
                    </div>
                    <div className="text-lg font-bold text-white">
                      {calculations.dailyOutput} kWh
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      Est. Daily Yield
                      <Tooltip
                        content="Your yield generated daily upon purchase of the solar panels."
                        className="bg-[#3b3b3b] text-white text-xs px-3 py-2 rounded shadow-lg font-inter"
                      >
                        <Info
                          size={14}
                          className="text-gray-400 hover:text-white cursor-pointer"
                        />
                      </Tooltip>
                    </div>
                    <div className="text-lg font-bold text-white">
                      {calculations.dailyNRGYield.toFixed(2)} NRG
                    </div>
                  </div>
                </div>

                {/* Cost Breakdown */}
                <div className="space-y-2 border-t border-gray-700 pt-4">
                  <div className="flex justify-between">
                    <div className="text-gray-300">Per Panel Cost</div>
                    <div className="text-white font-medium">$1.00</div>
                  </div>
                  <div className="flex justify-between">
                    <div className="text-gray-300">
                      Total Panel Cost ({panelQuantity} panels)
                    </div>
                    <div className="text-white font-medium">
                      ${calculations.totalCost.toFixed(2)}
                    </div>
                  </div>
                  {/*<div className="flex justify-between">
                    <div className="text-gray-300">Platform Fee (10%)</div>
                    <div className="text-white font-medium">${calculations.platformFee.toFixed(2)}</div>
                  </div>
                  */}
                  <div className="flex justify-between border-t border-gray-700 pt-2 mt-2">
                    <div className="text-white font-bold">Total Amount</div>
                    <div className="text-white font-bold">
                      ${calculations.totalCost}
                    </div>
                  </div>
                </div>

                {/* Capacity Warning Message (when getting close to limit) */}
                {!allocationPreview.error &&
                  totalAvailableCapacity > 0 &&
                  panelQuantity >=
                    Math.floor(
                      (totalAvailableCapacity / PANEL_CAPACITY_KWP) * 0.8
                    ) && (
                    <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-600/30 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                          <span className="text-black text-xs font-bold">
                            !
                          </span>
                        </div>
                        <span className="text-yellow-400 font-medium text-sm">
                          High Demand Alert
                        </span>
                      </div>
                      <p className="text-yellow-200 text-xs">
                        You're purchasing {panelQuantity} panels out of{" "}
                        {Math.floor(
                          totalAvailableCapacity / PANEL_CAPACITY_KWP
                        )}{" "}
                        available. Consider securing your purchase soon as
                        capacity is limited.
                      </p>
                    </div>
                  )}

                {/* Capacity Error Message */}
                {allocationPreview.error && (
                  <div className="mb-4 p-4 bg-red-900/20 border border-red-600/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">!</span>
                      </div>
                      <span className="text-red-400 font-medium">
                        Insufficient Capacity
                      </span>
                    </div>
                    <p className="text-red-300 text-sm mb-2">
                      The requested {panelQuantity} panels exceed our current
                      available capacity.
                    </p>
                    <div className="bg-red-800/30 p-3 rounded text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-red-200">Requested panels:</span>
                        <span className="text-white font-medium">
                          {panelQuantity}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-red-200">
                          Available capacity:
                        </span>
                        <span className="text-white font-medium">
                          {totalAvailableCapacity.toFixed(1)} kWp
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-red-200">
                          Max panels available:
                        </span>
                        <span className="text-green-400 font-medium">
                          ~
                          {Math.floor(
                            totalAvailableCapacity / PANEL_CAPACITY_KWP
                          )}{" "}
                          panels
                        </span>
                      </div>
                    </div>
                    <p className="text-red-200 text-xs mt-3">
                      Please reduce the number of panels or try again later when
                      more capacity becomes available.
                    </p>
                  </div>
                )}
              </div>

              {/* Continue Button */}
              <motion.div {...formElementTransition} className="pt-2">
                <Button
                  className="w-full bg-[#E9423A] text-white font-medium py-6 rounded-none disabled:opacity-50 disabled:cursor-not-allowed"
                  onPress={handleContinueToPayment}
                  disabled={
                    isLoading ||
                    !!allocationPreview.error ||
                    allocationPreview.allocations.length === 0
                  }
                >
                  {isLoading ? (
                    <Spinner color="white" size="sm" />
                  ) : allocationPreview.error ? (
                    "Insufficient Capacity Available"
                  ) : allocationPreview.allocations.length === 0 ? (
                    "No Allocation Available"
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
