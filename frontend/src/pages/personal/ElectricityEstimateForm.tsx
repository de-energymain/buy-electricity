// src/components/ElectricityEstimateForm.tsx
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Spinner
} from "@nextui-org/react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LogIn, LayoutDashboard } from "lucide-react"; // Added LayoutDashboard icon
import { useWallet } from "@solana/wallet-adapter-react"; // Import wallet hook
import logo from "../../assets/logo.svg";
import { 
  FormContainer, 
  inputClasses, 
  cardClasses,
  formElementTransition
} from "../../shared/styles";

interface FormData {
  kwh: string;
}

interface ErrorState {
  kwh: boolean;
}

interface TouchedState {
  kwh: boolean;
}

const ElectricityEstimateForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    kwh: "",
  });
  
  const [errors, setErrors] = useState<ErrorState>({
    kwh: false,
  });
  
  const [touched, setTouched] = useState<TouchedState>({
    kwh: false,
  });
  
  const [isFormValid, setIsFormValid] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  
  const navigate = useNavigate();
  const { connected } = useWallet(); // Get wallet connection status

  // Check authentication status when component mounts and when wallet connection changes
  useEffect(() => {
    const checkAuth = (): void => {
      // Check for wallet connection
      if (connected) {
        setIsAuthenticated(true);
        return;
      }
      
      // Check for Torus session
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
      kwh: !formData.kwh.trim(),
    };
    
    setErrors(newErrors);
    setIsFormValid(!newErrors.kwh);
  }, [formData]);

  const handleEstimate = (): void => {
    // Mark all fields as touched when attempting to submit
    setTouched({ kwh: true });
    
    if (isFormValid) {
      setIsSubmitting(true);
      
      // Add a subtle loading delay for better UX
      setTimeout(() => {
        setIsSubmitting(false);
        // Pass the monthly usage (kWh) as query parameter
        navigate(`/by-panels?kwh=${formData.kwh}`);
      }, 800);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string): void => {
    setFormData({ ...formData, [field]: value });
    setTouched({ ...touched, [field]: true });
  };

  const handleAuthButtonClick = (e: React.MouseEvent): void => {
    e.preventDefault();
    navigate(isAuthenticated ? "/dashboard" : "/login");
  };

  return (
    <FormContainer>
      {/* Logo Section */}
      <div className="flex justify-center relative mb-10 z-10">
        <motion.div 
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3 }}
          className="w-24"
        >
          <img src={logo} alt="logo" />
        </motion.div>
      </div>

      <Card className={cardClasses}>
        <CardHeader className="-mb-4 bg-[#2F2F2F]">
          <div className="mt-3 p-4 bg-[#2F2F2F] rounded-lg shadow-inner w-full">
            <h2 className="text-[36px] font-bold text-center text-white mb-2 font-electrolize">
              Electricity Estimate
            </h2>
            <p className="text-md text-[#7E7E7E] pl-6 pr-6 text-center font-inter">
              Get an estimate of how many panels you need to offset your
              electricity bill
            </p>
          </div>
        </CardHeader>
        <CardBody className="p-6 bg-[#2F2F2F]">
          <div className="space-y-6 relative">
            {isSubmitting && (
              <div className="absolute inset-0 bg-[#2F2F2F] bg-opacity-80 flex flex-col items-center justify-center z-20 rounded-lg">
                <Spinner size="lg" color="danger" className="mb-4" />
                <p className="text-white">Calculating estimate...</p>
              </div>
            )}
            
            <div className="relative font-electrolize pl-4 pr-4">
              <Input
                type="number"
                size="lg"
                placeholder="Enter your monthly usage in kWh"
                value={formData.kwh}
                variant="flat"
                isInvalid={touched.kwh && errors.kwh}
                errorMessage={touched.kwh && errors.kwh ? "Usage is required" : ""}
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
                    "hover:bg-[#5E5E5E] !important" ,
                    "!data-[invalid=true]:hover:!bg-[#5E5E5E] !important",
                  ],
                  errorMessage: "text-red-500",
                  base: "group"
                }}
                endContent={<div className="text-default-400">kWh</div>}
                onChange={(e) => handleInputChange("kwh", e.target.value)}
                onBlur={() => setTouched({ ...touched, kwh: true })}
                isDisabled={isSubmitting}
              />
            </div>
            
            <div className="pt-1 flex justify-center">
              <motion.div
                {...formElementTransition}
                style={{ pointerEvents: isSubmitting ? 'none' : 'auto' }}
              >
                <Button
                  className={`h-12 px-8 ${isFormValid || !Object.values(touched).some(t => t) ? 'bg-[#E9423A]' : 'bg-[#8F2320] opacity-70'} text-white rounded transition-all duration-300 flex items-center`}
                  onPress={handleEstimate}
                  disabled={isSubmitting}
                  style={{ borderRadius: '0' }}
                >
                  {isSubmitting ? (
                    <Spinner color="white" size="sm" />
                  ) : (
                    <span className="font-electrolize">Calculate Estimate</span>
                  )}
                  <svg width="37" height="37" viewBox="0 0 37 37" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="37" height="37" rx="18.4082" fill="white"/>
                    <path d="M26.4165 17.8659L21.0475 12.4969C20.9028 12.3571 20.7091 12.2798 20.5079 12.2816C20.3068 12.2833 20.1145 12.364 19.9723 12.5062C19.83 12.6484 19.7494 12.8408 19.7476 13.0419C19.7459 13.243 19.8232 13.4368 19.9629 13.5814L24.0227 17.6412H10.5341C10.3307 17.6412 10.1356 17.722 9.99174 17.8658C9.8479 18.0097 9.76709 18.2048 9.76709 18.4082C9.76709 18.6116 9.8479 18.8067 9.99174 18.9505C10.1356 19.0944 10.3307 19.1752 10.5341 19.1752H24.0227L19.9629 23.235C19.8897 23.3057 19.8312 23.3903 19.791 23.4839C19.7508 23.5775 19.7297 23.6782 19.7288 23.78C19.7279 23.8818 19.7473 23.9828 19.7859 24.0771C19.8244 24.1714 19.8814 24.257 19.9534 24.329C20.0254 24.401 20.1111 24.458 20.2053 24.4965C20.2996 24.5351 20.4006 24.5545 20.5024 24.5536C20.6043 24.5528 20.7049 24.5316 20.7985 24.4914C20.8921 24.4512 20.9767 24.3928 21.0475 24.3195L26.4165 18.9505C26.5603 18.8066 26.6411 18.6116 26.6411 18.4082C26.6411 18.2048 26.5603 18.0097 26.4165 17.8659Z" fill="#E9423A"/>
                  </svg>
                </Button>
              </motion.div>
            </div>

            <motion.div 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-6 mb-6 text-center"
            >
              <p className="text-sm mb-6 text-white font-inter">
                Want to skip the estimate?{" "}
                <br className="md:hidden" />
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
      <div className="flex justify-center w-full mt-10" style={{ position: "relative", zIndex: 10 }}>
        <a 
          href={isAuthenticated ? "/dashboard" : "/login"}
          onClick={handleAuthButtonClick}
          className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors duration-300"
          style={{ width: "fit-content" }}
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

      {/* Business profile text */}
      <div className="absolute bottom-6 text-sm text-white w-full text-center">
        Are you a business? <a href="/business-contact" className="text-[#E9423A] hover:underline">Switch to Business Profile</a>
      </div>
    </FormContainer>
  );
};

export default ElectricityEstimateForm;