import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  Button, 
  Card, 
  CardBody, 
  Spinner,
} from "@nextui-org/react";
import { ArrowLeft, Plus, Minus } from "lucide-react";
import { motion } from "framer-motion";
import logo from "../../assets/logo.svg";
import { 
  FormContainer, 
  cardClasses,
  secondaryButtonClasses,
  formElementTransition
} from "../../shared/styles";

// Placeholder for solar farm image
// Replace this with actual image in production
//const solarFarmPlaceholder = "https://de.energy/wp-content/uploads/2024/07/Tea-manufacturer.jpeg";

function PanelSelectionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  // Panel configuration and details
  const [panelQuantity, setPanelQuantity] = useState(17);
  const [farmDetails] = useState({
    name: "Jaipur Solar Farm",
    location: "Jaipur, Rajasthan, India",
    solarIndex: 4.8,
    panelPower: 450, // Watts
    efficiency: 98, // Percentage
    pricePerPanel: 1, // USD (changed from 525 to 1)
    networkFee: 0 // USD
  });

  // Calculated values
  const [calculations, setCalculations] = useState({
    totalCapacity: 0,
    dailyOutput: 0,
    totalCost: 0
  });

  // Extract kwh from query params if available
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const kwh = parseFloat(queryParams.get("kwh") || "0");
    
    if (kwh > 0) {
      // Calculate panels needed (simplified version)
      const dailyUsage = kwh / 30; // Convert monthly to daily
      const requiredCapacity = dailyUsage / (farmDetails.solarIndex * 0.8); // Accounting for efficiency
      const panelsNeeded = Math.ceil(requiredCapacity / (farmDetails.panelPower / 1000));
      
      if (panelsNeeded > 0) {
        setPanelQuantity(panelsNeeded);
      }
    }
  }, [location.search, farmDetails.solarIndex, farmDetails.panelPower]);

  // Recalculate whenever panel quantity changes
  useEffect(() => {
    // Calculate total capacity (kW)
    const capacity = (panelQuantity * farmDetails.panelPower) / 1000;
    
    // Calculate estimated daily output (kWh)
    const dailyOutput = Math.floor(capacity * farmDetails.solarIndex * (farmDetails.efficiency / 100));
    
    // Calculate total cost
    const panelCost = panelQuantity * farmDetails.pricePerPanel;
    const totalCost = panelCost + farmDetails.networkFee;
    
    setCalculations({
      totalCapacity: capacity,
      dailyOutput,
      totalCost
    });
  }, [panelQuantity, farmDetails]);

  const handleDecreaseQuantity = () => {
    if (panelQuantity > 1) {
      setPanelQuantity(prev => prev - 1);
    }
  };

  const handleIncreaseQuantity = () => {
    setPanelQuantity(prev => prev + 1);
  };

  const handleContinueToPayment = () => {
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

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <FormContainer>
      {/* Logo */}
      <div className="flex justify-center relative z-10 mb-4">
        <div className="w-24">
          <img src={logo} alt="Renrg logo" />
        </div>
      </div>

      {/* Back Button */}
      <div className="max-w-md mx-auto w-full relative z-10">
        <Button
          className={`mb-4 ${secondaryButtonClasses}`}
          onPress={handleBack}
          startContent={<ArrowLeft size={20} />}
          disabled={isLoading}
        >
          Back
        </Button>

        <Card className={cardClasses}>
          <div className="p-4 bg-[#2F2F2F]">
            <h2 className="text-3xl font-bold text-white mb-2 font-electrolize text-center">
              Panel Selection
            </h2>
            <p className="text-sm text-gray-300 text-center font-inter">
              Review and confirm your selection
            </p>
          </div>
        </Card>       

        <div className="h-4 m-2"></div>
        
        <Card className={cardClasses}>
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
                    <span className="mx-4 text-xl font-bold text-white">{panelQuantity}</span>
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

                {/* Capacity and Output */}
                <div className="flex justify-between mb-6">
                  <div>
                    <div className="text-sm text-gray-400">Total Capacity</div>
                    <div className="text-lg font-bold text-white">{calculations.totalCapacity.toFixed(2)} kW</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Est. Daily Output</div>
                    <div className="text-lg font-bold text-white">{calculations.dailyOutput} kWh</div>
                  </div>
                </div>

                {/* Cost Breakdown */}
                <div className="space-y-2 border-t border-gray-700 pt-4">
                  <div className="flex justify-between">
                    <div className="text-gray-300">Panel Cost ({panelQuantity} × ${farmDetails.pricePerPanel})</div>
                    <div className="text-white font-medium">${panelQuantity * farmDetails.pricePerPanel}</div>
                  </div>
                  <div className="flex justify-between">
                    <div className="text-gray-300">Network Fee</div>
                    <div className="text-white font-medium">${farmDetails.networkFee}</div>
                  </div>
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
}

export default PanelSelectionPage;
