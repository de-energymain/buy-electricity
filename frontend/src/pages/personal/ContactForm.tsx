import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Select,
  SelectItem,
  Spinner,
} from "@nextui-org/react";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "../../assets/logo.svg";
import { 
  FormContainer, 
  inputClasses, 
  selectClasses, 
  cardClasses,
  secondaryButtonClasses,
  formElementTransition
} from "../../shared/styles.jsx";

function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    country: "",
    state: "",
    city: "",
    phone: "",
    properties: "",
  });

  const [formState, setFormState] = useState("idle"); // idle, loading, success

  const countries = [
    { label: "United States", value: "USA" },
    { label: "India", value: "India" },
    { label: "United Arab Emirates", value: "UAE" },
  ];

  const states = [
    { label: "California", value: "California" },
    { label: "Maharashtra", value: "Maharashtra" },
    { label: "Dubai", value: "Dubai" },
  ];

  const cities = [
    { label: "Los Angeles", value: "Los Angeles" },
    { label: "Mumbai", value: "Mumbai" },
    { label: "Dubai", value: "Dubai" },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Start loading state
    setFormState("loading");
    
    // Simulate API call with setTimeout
    setTimeout(() => {
      console.log("Form submitted:", formData);
      setFormState("success");
    }, 2000);
  };

  // Handler for back button
  const handleBack = () => {
    window.history.back();
  };

  return (
    <FormContainer>
      <div className="flex justify-center relative z-10">
        <div className="w-24">
          <img src={logo} alt="logo" />
        </div>
      </div>
      <div className="max-w-md mx-auto w-full mb-4 relative z-10">
        <Button
          className={`mb-4 ${secondaryButtonClasses}`}
          onPress={handleBack}
          startContent={<ArrowLeft size={20} />}
          disabled={formState === "loading"}
        >
          Back to Estimate
        </Button>
      </div>

      <Card className={cardClasses}>
        <CardHeader className="flex justify-center items-center flex-col">
          <div className="mt-3 p-4 bg-[#202020] rounded-lg shadow-inner w-full text-center">
            <h2 className="text-3xl font-bold text-white mb-2 font-electrolize">
              Get in Touch
            </h2>
            <p className="text-sm text-white font-inter">
              Fill out this quick form and our team will be in touch.
            </p>
          </div>
        </CardHeader>
        <CardBody className="p-6">
          <AnimatePresence mode="wait">
            {formState === "success" ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center justify-center py-12"
              >
                <CheckCircle size={80} className="text-[#E9423A] mb-6" />
                <h3 className="text-2xl font-bold text-white mb-2 text-center">
                  Thank You!
                </h3>
                <p className="text-white text-center mb-6">
                  Your form has been successfully submitted. Our team will contact you shortly.
                </p>
                <Button 
                  className="bg-[#E9423A] text-white"
                  onPress={() => setFormState("idle")}
                >
                  Submit Another Response
                </Button>
              </motion.div>
            ) : (
              <motion.form 
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit} 
                className="space-y-4 font-electrolize relative"
              >
                {formState === "loading" && (
                  <div className="absolute inset-0 bg-[#202020] bg-opacity-80 flex flex-col items-center justify-center z-20 rounded-lg">
                    <Spinner size="lg" color="danger" className="mb-4" />
                    <p className="text-white">Submitting your request...</p>
                  </div>
                )}

                <div className="relative">
                  <Input
                    type="text"
                    size="lg"
                    placeholder="Name *"
                    variant="faded"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    classNames={inputClasses}
                    isRequired
                    isDisabled={formState === "loading"}
                  />
                </div>

                <div className="relative font-electrolize">
                  <Input
                    type="email"
                    size="lg"
                    placeholder="Email *"
                    variant="faded"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    isRequired
                    isDisabled={formState === "loading"}
                    classNames={inputClasses}
                  />
                </div>

                <div className="relative">
                  <Select
                    placeholder="Country *"
                    variant="faded"
                    size="lg"
                    selectedKeys={[formData.country]}
                    onChange={(e) =>
                      setFormData({ ...formData, country: e.target.value })
                    }
                    isRequired
                    isDisabled={formState === "loading"}
                    classNames={selectClasses}
                  >
                    {countries.map((country) => (
                      <SelectItem key={country.value} value={country.value}>
                        {country.label}
                      </SelectItem>
                    ))}
                  </Select>
                </div>

                <div className="relative">
                  <Select
                    placeholder="State *"
                    variant="faded"
                    size="lg"
                    selectedKeys={[formData.state]}
                    onChange={(e) =>
                      setFormData({ ...formData, state: e.target.value })
                    }
                    isRequired
                    isDisabled={formState === "loading"}
                    classNames={selectClasses}
                  >
                    {states.map((state) => (
                      <SelectItem key={state.value} value={state.value}>
                        {state.label}
                      </SelectItem>
                    ))}
                  </Select>
                </div>

                <div className="relative">
                  <Select
                    placeholder="City *"
                    variant="faded"
                    size="lg"
                    selectedKeys={[formData.city]}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    isRequired
                    isDisabled={formState === "loading"}
                    classNames={selectClasses}
                  >
                    {cities.map((city) => (
                      <SelectItem key={city.value} value={city.value}>
                        {city.label}
                      </SelectItem>
                    ))}
                  </Select>
                </div>

                <div className="relative">
                  <Input
                    type="tel"
                    size="lg"
                    placeholder="Phone"
                    variant="faded"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    isDisabled={formState === "loading"}
                    classNames={inputClasses}
                  />
                </div>

                <motion.div
                  {...formElementTransition}
                  style={{ pointerEvents: formState === "loading" ? 'none' : 'auto' }}
                >
                  <Button 
                    type="submit" 
                    className="w-full bg-[#E9423A] text-white"
                    disabled={formState === "loading"}
                  >
                    {formState === "loading" ? (
                      <Spinner color="white" size="sm" />
                    ) : (
                      "Submit"
                    )}
                  </Button>
                </motion.div>
              </motion.form>
            )}
          </AnimatePresence>
        </CardBody>
      </Card>
    </FormContainer>
  );
}

export default ContactForm;