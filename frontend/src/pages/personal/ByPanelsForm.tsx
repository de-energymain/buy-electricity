import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button, Card, CardBody, CardHeader, Input, Spinner } from "@nextui-org/react";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import logo from "../../assets/logo.svg";
import { 
  FormContainer, 
  inputClasses, 
  cardClasses,
  secondaryButtonClasses,
  formElementTransition
} from "../../shared/styles.jsx";

function ByPanelsForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const [panelCount, setPanelCount] = useState(0);
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    // Extract kWh from query params
    const queryParams = new URLSearchParams(location.search);
    const kwhInput = parseFloat(queryParams.get("kwh") || "0");

    // Show a loading state while calculating
    setIsLoading(true);
    
    setTimeout(() => {
      if (kwhInput > 0) {
        // Calculation: Panels needed = kWh per day / 3
        const requiredPanels = Math.ceil(kwhInput / 3); // Round up
        setPanelCount(requiredPanels);

        // Calculation: Cost = Panels × $525
        const totalCost = requiredPanels * 525;
        setEstimatedCost(totalCost);
      }
      setIsLoading(false);
    }, 1000); // Add a slight delay for loading effect
  }, [location.search]);

  const handleBuyPanels = () => {
    setIsNavigating(true);
    
    // Add a short delay for visual feedback before navigating
    setTimeout(() => {
      navigate("/contact");
    }, 800);
  };

  return (
    <FormContainer>
      <div className="flex justify-center relative z-10">
        <div className="w-24">
          <img src={logo} alt="logo" />
        </div>
      </div>

      <div className="max-w-md mx-auto w-full relative z-10">
        <Button
          className={`mb-4 ${secondaryButtonClasses}`}
          onPress={() => navigate(-1)}
          startContent={<ArrowLeft size={20} />}
          disabled={isLoading || isNavigating}
        >
          Back to Estimate
        </Button>

        <Card className={cardClasses}>
          <CardHeader>
            <div className="mt-3 p-4 bg-[#202020] rounded-lg shadow-inner">
              <h2 className="text-3xl font-bold text-center text-white mb-2 font-electrolize">
                Electricity Estimate
              </h2>
              <p className="text-sm text-white text-center font-inter">
                Based on your current usage and your city and utility service,
                you need
              </p>
            </div>
          </CardHeader>
          <CardBody className="p-6">
            <div className="space-y-4 relative">
              {isLoading && (
                <div className="absolute inset-0 bg-[#202020] bg-opacity-80 flex flex-col items-center justify-center z-20 rounded-lg">
                  <Spinner size="lg" color="danger" className="mb-4" />
                  <p className="text-white">Calculating your estimate...</p>
                </div>
              )}
              
              {isNavigating && (
                <div className="absolute inset-0 bg-[#202020] bg-opacity-80 flex flex-col items-center justify-center z-20 rounded-lg">
                  <Spinner size="lg" color="danger" className="mb-4" />
                  <p className="text-white">Processing...</p>
                </div>
              )}
              
              <div className="flex gap-4">
                <div className="flex-1 font-electrolize">
                  <Input
                    type="number"
                    size="lg"
                    placeholder="Number of Panels"
                    value={panelCount.toString()}
                    variant="faded"
                    isReadOnly
                    endContent={<div className="text-default-400">Panels</div>}
                    classNames={inputClasses}
                  />
                </div>
                <div className="flex-1">
                  <Input
                    type="text"
                    size="lg"
                    placeholder="Estimated Cost"
                    value={estimatedCost ? `$${estimatedCost}` : ""}
                    variant="faded"
                    isReadOnly
                    startContent={<div className="text-default-400">$</div>}
                    classNames={inputClasses}
                  />
                </div>
              </div>

              <motion.div {...formElementTransition}>
                <Button
                  className="w-full bg-[#E9423A] text-white"
                  onPress={handleBuyPanels}
                  disabled={isLoading || isNavigating}
                >
                  {isNavigating ? (
                    <Spinner color="white" size="sm" />
                  ) : (
                    "Buy Panels"
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

export default ByPanelsForm;