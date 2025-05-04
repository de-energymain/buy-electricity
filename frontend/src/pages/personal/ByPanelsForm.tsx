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
} from "../../shared/styles";

function ByPanelsForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const [panelCount, setPanelCount] = useState(0);
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);
  const [usageInput, setUsageInput] = useState(0); 

  useEffect(() => {
    // Extract monthly usage from query params
    const queryParams = new URLSearchParams(location.search);
    const usage = parseFloat(queryParams.get("kwh") || "0");
    setUsageInput(usage);

    // Show a loading state while calculating
    setIsLoading(true);

    setTimeout(() => {
      if (usage> 0) {
        /*
          Calculation using the formula:
          - 3.75 kWh per kW per day × 80% = 3.0 kWh per day per kW
          - 3 kWh/day → 3 × 30 = 90 kWh/month per kW
          - requiredCapacity (in kW) = monthlyUsage / 90
          - For simplicity, 1 kW = 1 "panel"
        */
        const effectiveMonthlyProduction = 3.75 * 0.8 * 30; // = 90
        const requiredCapacity = usage / effectiveMonthlyProduction;
        const requiredPanels = Math.ceil(requiredCapacity);
        setPanelCount(requiredPanels);

        // Cost = Panels × $525
        const totalCost = requiredPanels * 525;
        setEstimatedCost(totalCost);      
      }
      setIsLoading(false);
    }, 1000); // Slight delay for loading effect
  }, [location.search]);

  const handleBuyPanels = () => {
    setIsNavigating(true);
    setTimeout(() => {
      const queryParams = new URLSearchParams({
        kwh: usageInput.toString(), 
        panels: panelCount.toString(),
        cost: estimatedCost.toString(),
      });
      console.log("Navigating with query params:", queryParams.toString());
      
      // UPDATED HERE - Navigate to the panel selection page instead of contact page
      navigate(`/panel-selection?${queryParams.toString()}`);
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
          <CardHeader className="bg-[#2F2F2F]">
            <div className="mt-3 p-4 bg-[#2F2F2F] rounded-lg shadow-inner">
              <h2 className="text-3xl font-bold text-center text-white mb-2 font-electrolize">
                Electricity Estimate
              </h2>
              <p className="text-sm text-white text-center font-inter">
                Based on your monthly usage and utility service, you need:
              </p>
            </div>
          </CardHeader>
          <CardBody className="p-6 bg-[#2F2F2F]">
            <div className="space-y-4 relative">
              {isLoading && (
                <div className="absolute inset-0 bg-[#2F2F2F] bg-opacity-80 flex flex-col items-center justify-center z-20 rounded-lg">
                  <Spinner size="lg" color="danger" className="mb-4" />
                  <p className="text-white">Calculating your estimate...</p>
                </div>
              )}

              {isNavigating && (
                <div className="absolute inset-0 bg-[#2F2F2F] bg-opacity-80 flex flex-col items-center justify-center z-20 rounded-lg">
                  <Spinner size="lg" color="danger" className="mb-4" />
                  <p className="text-white">Processing...</p>
                </div>
              )}

              <div className="flex gap-4">
                {/* Panels Required */}
                <div className="flex-1 font-electrolize">
                  <Input
                    type="number"
                    size="lg"
                    placeholder="Number of Panels"
                    value={panelCount.toString()}
                    variant="faded"
                    isReadOnly
                    endContent={<div className="text-default-400">Panels</div>}
                    classNames={{
                      ...inputClasses, 
                      inputWrapper: [
                        "rounded-none", 
                        "!border-gray-500",
                        "!bg-[#5E5E5E]",
                        inputClasses.inputWrapper,
                      ].join(" "),
                    }}
                  />
                </div>
                {/* Estimated Cost */}
                <div className="flex-1 font-electrolize">
                  <Input
                    type="text"
                    size="lg"
                    placeholder="Estimated Cost"
                    value={estimatedCost ? `$${estimatedCost}` : ""}
                    variant="faded"
                    isReadOnly
                    classNames={{
                      ...inputClasses, 
                      inputWrapper: [
                        "rounded-none", 
                        "!border-gray-500",
                        "!bg-[#5E5E5E]",
                        inputClasses.inputWrapper, 
                      ].join(" "),
                    }}
                  />
                </div>
              </div>

              <div className="p-6 flex justify-center">       
              <motion.div {...formElementTransition}>
                <Button
                  className="w-full bg-[#E9423A] text-white rounded-none"
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
            </div>
          </CardBody>
        </Card>
      </div>
    </FormContainer>
  );
}

export default ByPanelsForm;