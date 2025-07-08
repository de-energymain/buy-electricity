// src/components/ElectricityEstimateForm.tsx
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Spinner,
  Slider
} from "@nextui-org/react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LogIn, LayoutDashboard } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import logo from "../../assets/logo.svg";
import {
  FormContainer,
  inputClasses,
  formElementTransition
} from "../../shared/styles";

interface FormData {
  dollarAmount: string;
}

interface ErrorState {
  dollarAmount: boolean;
}

interface TouchedState {
  dollarAmount: boolean;
}

const ElectricityEstimateForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    dollarAmount: "",
  });

  const [errors, setErrors] = useState<ErrorState>({
    dollarAmount: false,
  });

  const [touched, setTouched] = useState<TouchedState>({
    dollarAmount: false,
  });

  const [isFormValid, setIsFormValid] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  
  // New state for savings slider and real-time calculations
  const [savingsPercentage, setSavingsPercentage] = useState<number>(50);
  const [estimatedPanels, setEstimatedPanels] = useState<number>(0);
  const [estimatedCost, setEstimatedCost] = useState<number>(0);
  const [reservedSolar, setReservedSolar] = useState<number>(0);
  const [monthlyCredits, setMonthlyCredits] = useState<number>(0);
  const [updatedBillAmount, setUpdatedBillAmount] = useState<number>(0);

  const navigate = useNavigate();
  const { connected } = useWallet();

  // Electricity rate (US average)
  const averageElectricityRate = 0.12; // $0.12 per kWh
  const panelCostPerKW = 550; // $550 per kW

  // Check authentication status when component mounts and when wallet connection changes
  useEffect(() => {
    const checkAuth = (): void => {
      if (connected) {
        setIsAuthenticated(true);
        return;
      }

      const web3AuthSession = localStorage.getItem("web3AuthSession");
      if (web3AuthSession) {
        setIsAuthenticated(true);
        return;
      }

      setIsAuthenticated(false);
    };

    checkAuth();
  }, [connected]);

  // Validate form whenever formData changes
  useEffect(() => {
    const newErrors = {
      dollarAmount: !formData.dollarAmount.trim() || parseFloat(formData.dollarAmount) <= 0,
    };

    setErrors(newErrors);
    setIsFormValid(!newErrors.dollarAmount);
  }, [formData]);

  // Real-time calculations when bill amount or savings percentage changes
  useEffect(() => {
    if (formData.dollarAmount && parseFloat(formData.dollarAmount) > 0) {
      const billAmount = parseFloat(formData.dollarAmount);
      
      // Calculate required capacity based on savings percentage
      const targetSavings = billAmount * (savingsPercentage / 100);
      const targetKWh = targetSavings / averageElectricityRate;
      
      // Solar production calculation (3.75 kWh per kW per day × 80% efficiency × 30 days)
      const effectiveMonthlyProduction = 3.75 * 0.8 * 30; // = 90 kWh/month per kW
      const requiredCapacity = targetKWh / effectiveMonthlyProduction;
      
      // Allow fractional panels (no Math.ceil)
      const panelsNeeded = Math.round(requiredCapacity * 10) / 10; // Round to 1 decimal place
      
      // Calculate costs and savings
      const totalCost = requiredCapacity * panelCostPerKW;
      const reservedSolarWatts = requiredCapacity * 1000; // Convert kW to W
      const actualMonthlyCredits = requiredCapacity * effectiveMonthlyProduction * averageElectricityRate;
      const newBillAmount = billAmount - actualMonthlyCredits;
      
      setEstimatedPanels(panelsNeeded);
      setEstimatedCost(Math.round(totalCost));
      setReservedSolar(Math.round(reservedSolarWatts));
      setMonthlyCredits(Math.round(actualMonthlyCredits));
      setUpdatedBillAmount(Math.max(0, Math.round(newBillAmount)));
    } else {
      // Reset calculations when no valid input
      setEstimatedPanels(0);
      setEstimatedCost(0);
      setReservedSolar(0);
      setMonthlyCredits(0);
      setUpdatedBillAmount(0);
    }
  }, [formData.dollarAmount, savingsPercentage, averageElectricityRate, panelCostPerKW]);

  const handleEstimate = (): void => {
    setTouched({ dollarAmount: true });

    if (isFormValid) {
      setIsSubmitting(true);

      setTimeout(() => {
        setIsSubmitting(false);
        // Navigate to panel selection with all the calculated data
        const queryParams = new URLSearchParams({
          dollarAmount: formData.dollarAmount,
          savingsPercentage: savingsPercentage.toString(),
          panels: estimatedPanels.toString(),
          cost: estimatedCost.toString(),
          reservedSolar: reservedSolar.toString(),
          monthlyCredits: monthlyCredits.toString(),
          updatedBill: updatedBillAmount.toString()
        });
        navigate(`/panel-selection?${queryParams.toString()}`);
      }, 800);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string): void => {
    const numericValue = value.replace(/[^0-9.]/g, '');
    const parts = numericValue.split('.');
    const formattedValue = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : numericValue;
    
    setFormData({ ...formData, [field]: formattedValue });
    setTouched({ ...touched, [field]: true });
  };

  const handleAuthButtonClick = (e: React.MouseEvent): void => {
    e.preventDefault();
    navigate(isAuthenticated ? "/dashboard" : "/login");
  };

  return (
    <FormContainer>
      {/* Logo Section */}
      <div className="flex justify-center relative mb-5 z-10">
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3 }}
          className="w-20"
        >
          <img src={logo} alt="logo" />
        </motion.div>
      </div>

      <Card className="max-w-md w-full shadow-sm bg-[#2F2F2F] border-none relative z-10 mb-4">
        <CardHeader className="-mb-4 bg-[#2F2F2F]">
          <div className="mt-3 p-4 bg-[#2F2F2F] rounded-lg shadow-inner w-full">
            <h2 className="text-2xl font-bold text-center text-white mb-2 font-electrolize">
              Electricity Estimate
            </h2>
            <p className="text-sm text-[#7E7E7E] px-3 text-center font-inter">
              Get an estimate of how many panels you need to offset your electricity bill
            </p>
          </div>
        </CardHeader>
        <CardBody className="p-4 bg-[#2F2F2F]">
          <div className="space-y-4 relative">
            {isSubmitting && (
              <div className="absolute inset-0 bg-[#2F2F2F] bg-opacity-80 flex flex-col items-center justify-center z-20 rounded-lg">
                <Spinner size="lg" color="danger" className="mb-4" />
                <p className="text-white">Processing your estimate...</p>
              </div>
            )}

            {/* Bill Amount Input */}
            <div className="relative font-electrolize px-2">
              <Input
                type="text"
                size="lg"
                placeholder="Enter your monthly electricity bill"
                value={formData.dollarAmount}
                variant="flat"
                isInvalid={touched.dollarAmount && errors.dollarAmount}
                errorMessage={touched.dollarAmount && errors.dollarAmount ? "Please enter a valid amount" : ""}
                classNames={{
                  ...inputClasses,
                  input: [
                    "!text-white !bg-[#3A3A3A]",
                    "placeholder:text-[#F0F0F0]",
                    "focus:text-white",
                    "hover:bg-[#3A3A3A] !important",
                  ],
                  inputWrapper: [
                    "!bg-[#5E5E5E]",
                    "border border-gray-600 border-opacity-50",
                    "rounded-none shadow-none",
                    "!data-[invalid=true]:!bg-[#5E5E5E]",
                    "data-[invalid=true]:border-red-500 !important",
                    "before:!bg-[#5E5E5E]",
                    "after:!bg-[#5E5E5E]",
                    "hover:bg-[#5E5E5E] !important",
                    "!data-[invalid=true]:hover:!bg-[#5E5E5E] !important",
                  ],
                  errorMessage: "text-red-500",
                  base: "group"
                }}
                startContent={<div className="text-default-400">$</div>}
                endContent={<div className="text-default-400">/month</div>}
                onChange={(e) => handleInputChange("dollarAmount", e.target.value)}
                onBlur={() => setTouched({ ...touched, dollarAmount: true })}
                isDisabled={isSubmitting}
              />
            </div>

            {/* Savings Percentage Slider */}
            <div className="px-2 py-2">
              <div className="mb-3">
                <label className="text-white text-sm font-electrolize font-medium">
                  Monthly Savings Target: {savingsPercentage}%
                </label>
              </div>
              <div className="px-2">
                <Slider
                  size="lg"
                  step={5}
                  minValue={5}
                  maxValue={100}
                  value={savingsPercentage}
                  onChange={(value) => setSavingsPercentage(Array.isArray(value) ? value[0] : value)}
                  className="max-w-full"
                  classNames={{
                    base: "max-w-full",
                    track: "bg-[#5E5E5E] h-2 !border-none",
                    filler: "bg-[#E9423A] !border-none",
                    thumb: "bg-[#E9423A] border-2 border-white shadow-lg w-6 h-6 !bg-[#E9423A] data-[pressed=true]:bg-[#E9423A] data-[hover=true]:bg-[#E9423A] data-[focus=true]:bg-[#E9423A]",
                    mark: "text-white text-xs font-medium",
                    label: "text-white font-electrolize",
                    step: "!bg-[#5E5E5E]",
                    trackWrapper: "!bg-[#5E5E5E]"
                  }}
                  marks={[
                    { value: 25, label: "25%" },
                    { value: 50, label: "50%" },
                    { value: 75, label: "75%" },
                    { value: 100, label: "100%" }
                  ]}
                />
              </div>
            </div>

            {/* Real-time Estimates */}
            {formData.dollarAmount && parseFloat(formData.dollarAmount) > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-3"
              >
                {/* Solar Capacity and Cost */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#1e1e1e] border border-gray-700 rounded-lg p-3 text-center min-h-[70px] flex flex-col justify-center">
                    <div className="text-xs text-gray-400 mb-1">Reserved Solar</div>
                    <div className="text-base font-bold text-white font-electrolize">
                      {(reservedSolar / 1000).toFixed(1)} kW
                    </div>
                  </div>
                  <div className="bg-[#1e1e1e] border border-gray-700 rounded-lg p-3 text-center min-h-[70px] flex flex-col justify-center">
                    <div className="text-xs text-gray-400 mb-1">Estimated Cost</div>
                    <div className="text-base font-bold text-white font-electrolize">
                      ${estimatedCost}
                    </div>
                  </div>
                </div>

                {/* Monthly Credits and Updated Bill */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#1e1e1e] border border-gray-700 rounded-lg p-3 text-center min-h-[70px] flex flex-col justify-center">
                    <div className="text-xs text-gray-400 mb-1">Monthly Credits</div>
                    <div className="text-base font-bold text-green-400 font-electrolize">
                      ${monthlyCredits}
                    </div>
                  </div>
                  <div className="bg-[#1e1e1e] border border-gray-700 rounded-lg p-3 text-center min-h-[70px] flex flex-col justify-center">
                    <div className="text-xs text-gray-400 mb-1">Updated Bill</div>
                    <div className="text-base font-bold text-white font-electrolize">
                      ${updatedBillAmount}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Continue Button */}
            <div className="pt-3 flex justify-center">
              <motion.div
                {...formElementTransition}
                style={{ pointerEvents: isSubmitting ? 'none' : 'auto' }}
                className="w-full"
              >
                <Button
                  className={`w-full h-12 px-6 ${isFormValid || !Object.values(touched).some(t => t) ? 'bg-[#E9423A] hover:bg-[#D13B34]' : 'bg-[#8F2320] opacity-70'} text-white transition-all duration-300 flex items-center justify-center gap-3 font-electrolize text-base font-medium`}
                  onPress={handleEstimate}
                  disabled={isSubmitting || !isFormValid}
                  style={{ borderRadius: '0' }}
                >
                  {isSubmitting ? (
                    <Spinner color="white" size="sm" />
                  ) : (
                    <>
                      <span>Continue to Panel Selection</span>
                      <div className="bg-white rounded-full p-2 flex items-center justify-center">
                        <svg width="18" height="18" viewBox="0 0 37 37" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M26.4165 17.8659L21.0475 12.4969C20.9028 12.3571 20.7091 12.2798 20.5079 12.2816C20.3068 12.2833 20.1145 12.364 19.9723 12.5062C19.83 12.6484 19.7494 12.8408 19.7476 13.0419C19.7459 13.243 19.8232 13.4368 19.9629 13.5814L24.0227 17.6412H10.5341C10.3307 17.6412 10.1356 17.722 9.99174 17.8658C9.8479 18.0097 9.76709 18.2048 9.76709 18.4082C9.76709 18.6116 9.8479 18.8067 9.99174 18.9505C10.1356 19.0944 10.3307 19.1752 10.5341 19.1752H24.0227L19.9629 23.235C19.8897 23.3057 19.8312 23.3903 19.791 23.4839C19.7508 23.5775 19.7297 23.6782 19.7288 23.78C19.7279 23.8818 19.7473 23.9828 19.7859 24.0771C19.8244 24.1714 19.8814 24.257 19.9534 24.329C20.0254 24.401 20.1111 24.458 20.2053 24.4965C20.2996 24.5351 20.4006 24.5545 20.5024 24.5536C20.6043 24.5528 20.7049 24.5316 20.7985 24.4914C20.8921 24.4512 20.9767 24.3928 21.0475 24.3195L26.4165 18.9505C26.5603 18.8066 26.6411 18.6116 26.6411 18.4082C26.6411 18.2048 26.5603 18.0097 26.4165 17.8659Z" fill="#E9423A" />
                        </svg>
                      </div>
                    </>
                  )}
                </Button>
              </motion.div>
            </div>

            {/* Skip estimate link */}
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-center"
            >
              <p className="text-sm text-white font-inter">
                Want to skip the estimate?{" "}
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate("/panel-selection");
                  }}
                  className="text-red-500 hover:underline"
                >
                  Browse panels directly
                </a>
              </p>
            </motion.div>
          </div>
        </CardBody>
      </Card>

      {/* Conditional Login or Dashboard button */}
      <div className="flex justify-center w-full" style={{ position: "relative", zIndex: 10 }}>
        <a
          href={isAuthenticated ? "/dashboard" : "/login"}
          onClick={handleAuthButtonClick}
          className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors duration-300"
          style={{ width: "fit-content" }}
        >
          {isAuthenticated ? (
            <>
              <LayoutDashboard size={16} />
              <span className="text-sm">Dashboard</span>
            </>
          ) : (
            <>
              <LogIn size={16} />
              <span className="text-sm">Login</span>
            </>
          )}
        </a>
      </div>
    </FormContainer>
  );
};

export default ElectricityEstimateForm;