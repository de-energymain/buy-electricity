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
  const [isDataLoading, setIsDataLoading] = useState<boolean>(true); // Loading state for panel/capacity data
  const [isCapacityLoaded, setIsCapacityLoaded] = useState<boolean>(false); // Track if capacity is loaded
  const [isAllocationLoaded, setIsAllocationLoaded] = useState<boolean>(false); // Track if allocation is loaded
  const [isUrlParamsProcessed, setIsUrlParamsProcessed] = useState<boolean>(false); // Track if URL params are processed
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
        setIsCapacityLoaded(false);
        // Load total available capacity from dynamic API
        const availableCapacity =
          await PlantAllocationService.getTotalAvailableCapacity();
        //console.log("🌞 Available Capacity:", availableCapacity);
        setTotalAvailableCapacity(availableCapacity);
        setIsCapacityLoaded(true);
      } catch (error) {
        console.error("Error loading available capacity:", error);
        setTotalAvailableCapacity(0);
        setIsCapacityLoaded(true); // Set to true even on error to prevent infinite loading
      }
    };

    checkAuth();
    loadAvailableCapacity();
  }, [connected]);

  // Extract panels from query params if available, with support for both dollarAmount and kwh
  useEffect(() => {
    console.log("🔗 Processing URL params...");
    const queryParams = new URLSearchParams(location.search);
    const panels = parseFloat(queryParams.get("panels") || "0");

    // Try to get dollarAmount first (new format), fallback to kwh (old format)
    const dollarAmount = parseFloat(queryParams.get("dollarAmount") || "0");
    const kwh = parseFloat(queryParams.get("kwh") || "0");

    // Only reset allocation state if a param is actually changing the panel quantity
    let didSet = false;
    if (panels > 0) {
      console.log("📊 Setting panels from URL:", panels);
      setPanelQuantity(panels);
      didSet = true;
    } else if (dollarAmount > 0) {
      // Calculate panels from dollar amount if no panel count is provided
      // Convert dollars to kWh first
      const averageElectricityRate = 0.12;
      const monthlyUsageKWh = dollarAmount / averageElectricityRate;
      // Calculate panels needed
      const effectiveMonthlyProduction = 3.75 * 0.8 * 30; // = 90
      const requiredCapacity = monthlyUsageKWh / effectiveMonthlyProduction;
      const requiredPanels = Math.ceil(requiredCapacity);
      console.log("💰 Calculated panels from dollarAmount:", requiredPanels);
      setPanelQuantity(requiredPanels);
      didSet = true;
    } else if (kwh > 0) {
      // Fallback for old kwh-based calculation
      const effectiveMonthlyProduction = 3.75 * 0.8 * 30; // = 90
      const requiredCapacity = kwh / effectiveMonthlyProduction;
      const requiredPanels = Math.ceil(requiredCapacity);
      console.log("⚡ Calculated panels from kWh:", requiredPanels);
      setPanelQuantity(requiredPanels);
      didSet = true;
    } else {
      console.log("📋 Using default panel quantity:", panelQuantity);
    }
    if (didSet) setIsAllocationLoaded(false);
    // Mark URL params as processed
    console.log("✅ URL params processed");
    setIsUrlParamsProcessed(true);
  }, [location.search]);

  // Calculate allocation preview when panel quantity changes (only after URL params are processed)
  useEffect(() => {
    // Don't calculate allocation until URL params are processed
    if (!isUrlParamsProcessed) {
      console.log("⏳ Waiting for URL params to be processed before calculating allocation");
      return;
    }

    console.log("🧮 Starting allocation calculation for", panelQuantity, "panels");

    const calculateAllocation = async () => {
      try {
        setIsAllocationLoaded(false);
        const result = await PlantAllocationService.allocatePanels(
          Math.round(panelQuantity * 10) / 10
        );

        console.log("📊 Allocation result:", result);

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
          const dailyNRGYield = (dailyEnergy * pricePerKWh) / 0.03;

          const newCalculations = {
            totalCapacity: result.totalCapacity,
            dailyOutput,
            platformFee,
            totalCost: result.totalCost,
            dailyNRGYield,
          };

          console.log("💰 Final calculations:", newCalculations);
          setCalculations(newCalculations);
        } else {
          // Only reset calculations if allocation fails, not on every load
          setCalculations({
            totalCapacity: 0,
            dailyOutput: 0,
            platformFee: 0,
            totalCost: 0,
            dailyNRGYield: 0,
          });
        }
        console.log("✅ Allocation calculation complete");
        setIsAllocationLoaded(true);
      } catch (error) {
        console.error("❌ Error calculating allocation:", error);
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
        setIsAllocationLoaded(true); // Set to true even on error to prevent infinite loading
      }
    };

    calculateAllocation();
  }, [panelQuantity, isUrlParamsProcessed]);

  // Update overall loading state based on capacity, allocation loading, and URL params processing
  useEffect(() => {
    const newLoadingState = !(isCapacityLoaded && isAllocationLoaded && isUrlParamsProcessed);
    console.log("🔄 Loading state check:", {
      isCapacityLoaded,
      isAllocationLoaded,
      isUrlParamsProcessed,
      newLoadingState
    });
    setIsDataLoading(newLoadingState);
  }, [isCapacityLoaded, isAllocationLoaded, isUrlParamsProcessed]);

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= 1) {
      // Convert kWp capacity to panel count for maximum allowed
      const maxPanelsFromCapacity = Math.floor(
        totalAvailableCapacity / PANEL_CAPACITY_KWP
      );
      const maxAllowed = maxPanelsFromCapacity; // Enforce strict capacity limits
      const finalValue = Math.min(value, maxAllowed);
      // Round to one decimal place to prevent floating-point precision issues
      const roundedValue = Math.round(finalValue * 10) / 10;
      setIsAllocationLoaded(false); // Reset allocation state when quantity changes
      setPanelQuantity(roundedValue);
    }
  };

  const handleDecreaseQuantity = (): void => {
    if (panelQuantity > 1) {
      setIsAllocationLoaded(false); // Reset allocation state when quantity changes
      setPanelQuantity((prev) => Math.round((prev - 0.1) * 10) / 10);
    }
  };

  const handleIncreaseQuantity = (): void => {
    // Convert kWp capacity to panel count for maximum allowed
    const maxPanelsFromCapacity = Math.floor(
      totalAvailableCapacity / PANEL_CAPACITY_KWP
    );

    if (panelQuantity < maxPanelsFromCapacity) {
      setIsAllocationLoaded(false); // Reset allocation state when quantity changes
      setPanelQuantity((prev) => Math.round((prev + 0.1) * 10) / 10);
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
      panels: (Math.round(panelQuantity * 10) / 10).toString(),
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

  if (isDataLoading) {
    return (
      <FormContainer>
        <div className="flex flex-col items-center justify-center min-h-[80vh]">
          <Spinner color="danger" size="lg" />
          <p className="text-gray-300 text-sm mt-4">Loading panel data and calculations...</p>
        </div>
      </FormContainer>
    );
  }

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
                        {
                          totalAvailableCapacity / PANEL_CAPACITY_KWP
                        }{" "}
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
                      step="0.1"
                      min={1}
                      max={Math.floor(
                        totalAvailableCapacity / PANEL_CAPACITY_KWP
                      )}
                      value={Math.round(panelQuantity * 10) / 10}
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
                    <div className="text-white font-medium">$550.00</div>
                  </div>
                  <div className="flex justify-between">
                    <div className="text-gray-300">
                      Total Panel Cost ({(Math.round(panelQuantity * 10) / 10).toFixed(1)} panels)
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
              </div>

              {/* Continue Button */}
              <motion.div {...formElementTransition} className="pt-2">
                <Button
                  className="w-full bg-[#E9423A] text-white font-medium py-6 rounded-none disabled:opacity-50 disabled:cursor-not-allowed"
                  onPress={handleContinueToPayment}
                  disabled={
                    isLoading ||
                    isDataLoading ||
                    !!allocationPreview.error ||
                    allocationPreview.allocations.length === 0
                  }
                >
                  {isLoading ? (
                    <Spinner color="white" size="sm" />
                  ) : isDataLoading ? (
                    "Loading..."
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
