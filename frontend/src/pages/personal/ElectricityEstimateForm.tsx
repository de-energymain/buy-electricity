import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Select,
  SelectItem,
  Spinner
} from "@nextui-org/react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import logo from "../../assets/logo.svg";
import { 
  FormContainer, 
  inputClasses, 
  selectClasses, 
  cardClasses,
  formElementTransition
} from "../../shared/styles";

function ElectricityEstimateForm() {
  const [formData, setFormData] = useState({
    kwh: "",
    city: "Dubai",
    utility: "",
  });
  
  const [errors, setErrors] = useState({
    kwh: false,
    utility: false
  });
  
  const [touched, setTouched] = useState({
    kwh: false,
    utility: false
  });
  
  const [isFormValid, setIsFormValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cities = [
    { label: "Mumbai", value: "Mumbai" },
    { label: "Chennai", value: "Chennai" },
    { label: "Delhi", value: "Delhi" },
  ];

  const navigate = useNavigate();

  // Validate form whenever formData changes
  useEffect(() => {
    const newErrors = {
      kwh: !formData.kwh.trim(),
      utility: !formData.utility.trim()
    };
    
    setErrors(newErrors);
    setIsFormValid(!newErrors.kwh && !newErrors.utility);
  }, [formData]);

  const handleEstimate = () => {
    // Mark all fields as touched when attempting to submit
    const allTouched = { kwh: true, utility: true };
    setTouched(allTouched);
    
    if (isFormValid) {
      setIsSubmitting(true);
      
      // Add a subtle loading delay for better UX
      setTimeout(() => {
        setIsSubmitting(false);
        navigate(`/by-panels?kwh=${formData.kwh}`);
      }, 800);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    // Mark field as touched when user interacts with it
    setTouched({ ...touched, [field]: true });
  };

  return (
    <FormContainer>
      {/* Logo Section */}
      <div className="flex justify-center relative z-10">
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
        <CardHeader>
          <div className="mt-3 p-4 bg-[#202020] rounded-lg shadow-inner w-full">
            <h2 className="text-3xl font-bold text-center text-white mb-2 font-electrolize">
              Electricity Estimate
            </h2>
            <p className="text-sm text-white text-center font-inter">
              Get an estimate of how many panels you need to offset your
              electricity bill
            </p>
          </div>
        </CardHeader>
        <CardBody className="p-6">
          <div className="space-y-4 relative">
            {isSubmitting && (
              <div className="absolute inset-0 bg-[#202020] bg-opacity-80 flex flex-col items-center justify-center z-20 rounded-lg">
                <Spinner size="lg" color="danger" className="mb-4" />
                <p className="text-white">Calculating estimate...</p>
              </div>
            )}
            
            <div className="relative font-electrolize">
              <Input
                type="number"
                size="lg"
                placeholder="Enter usage in kWh"
                value={formData.kwh}
                variant="bordered"
                isInvalid={touched.kwh && errors.kwh}
                errorMessage={touched.kwh && errors.kwh ? "kWh is required" : ""}
                classNames={inputClasses}
                endContent={<div className="text-default-400">kWh</div>}
                onChange={(e) => handleInputChange("kwh", e.target.value)}
                onBlur={() => setTouched({ ...touched, kwh: true })}
                isDisabled={isSubmitting}
              />
            </div>

            <div className="relative font-electrolize">
              <Select
                placeholder="Select a city"
                variant="bordered"
                size="lg"
                selectedKeys={[formData.city]}
                classNames={selectClasses}
                onChange={(e) => handleInputChange("city", e.target.value)}
                isDisabled={isSubmitting}
              >
                {cities.map((city) => (
                  <SelectItem key={city.value} value={city.value}>
                    {city.label}
                  </SelectItem>
                ))}
              </Select>
            </div>
            
            <div className="relative font-electrolize">
              <Input
                type="text"
                size="lg"
                placeholder="Enter utility provider name"
                variant="bordered"
                value={formData.utility}
                isInvalid={touched.utility && errors.utility}
                errorMessage={touched.utility && errors.utility ? "Utility provider is required" : ""}
                classNames={inputClasses}
                onChange={(e) => handleInputChange("utility", e.target.value)}
                onBlur={() => setTouched({ ...touched, utility: true })}
                isDisabled={isSubmitting}
              />
            </div>
            
            <motion.div
              {...formElementTransition}
              style={{ pointerEvents: isSubmitting ? 'none' : 'auto' }}
            >
              <Button
                className={`w-full ${isFormValid || !Object.values(touched).some(t => t) ? 'bg-[#E9423A]' : 'bg-[#8F2320] opacity-70'} text-white transition-all duration-300`}
                onPress={handleEstimate}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Spinner color="white" size="sm" />
                ) : (
                  "Calculate Estimate"
                )}
              </Button>
            </motion.div>

            <motion.div 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-6 text-center"
            >
              <p className="text-sm text-white font-inter">
                Want to skip the estimate?{" "}
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate("/contact");
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
    </FormContainer>
  );
}

export default ElectricityEstimateForm;