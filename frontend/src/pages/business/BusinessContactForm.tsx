import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Select,
  SelectItem,
  Spinner,
  Textarea,
} from "@nextui-org/react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle } from "lucide-react";
import logo from "../../assets/logo.svg";
import { 
  FormContainer, 
  inputClasses, 
  selectClasses, 
  cardClasses,
  formElementTransition
} from "../../shared/styles";

interface FormData {
  name: string;
  email: string;
  company: string;
  title: string;
  country: string;
  state: string;
  city: string;
  phone: string;
  properties: string;
}

type FormState = "idle" | "loading" | "success";

function BusinessContactForm() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    company: "",
    title: "",
    country: "",
    state: "",
    city: "",
    phone: "",
    properties: "",
  });

  const [formState, setFormState] = useState<FormState>("idle");

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormState("loading");
    
    // Simulate API call
    setTimeout(() => {
      console.log("Form submitted:", formData);
      setFormState("success");
    }, 2000);
  };

  return (
    <FormContainer>
      <div className="flex justify-center relative z-10">
        <div className="w-24">
          <img src={logo} alt="logo" />
        </div>
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
                  Your business inquiry has been submitted. Our team will contact you shortly.
                </p>
                <Button 
                  className="bg-[#E9423A] text-white"
                  onPress={() => setFormState("idle")}
                >
                  Submit Another Inquiry
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

                {/* Name and Email - Side by side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                  <div className="relative">
                    <Input
                      type="email"
                      size="lg"
                      placeholder="Email *"
                      variant="faded"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      classNames={inputClasses}
                      isRequired
                      isDisabled={formState === "loading"}
                    />
                  </div>
                </div>

                {/* Company and Title - Side by side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <Input
                      type="text"
                      size="lg"
                      placeholder="Company *"
                      variant="faded"
                      value={formData.company}
                      onChange={(e) =>
                        setFormData({ ...formData, company: e.target.value })
                      }
                      classNames={inputClasses}
                      isRequired
                      isDisabled={formState === "loading"}
                    />
                  </div>

                  <div className="relative">
                    <Input
                      type="text"
                      size="lg"
                      placeholder="Title *"
                      variant="faded"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      classNames={inputClasses}
                      isRequired
                      isDisabled={formState === "loading"}
                    />
                  </div>
                </div>

                {/* Country and State - Side by side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <Select
                      placeholder="Country *"
                      variant="faded"
                      size="lg"
                      selectedKeys={formData.country ? [formData.country] : []}
                      onChange={(e) =>
                        setFormData({ ...formData, country: e.target.value as string })
                      }
                      classNames={selectClasses}
                      isRequired
                      isDisabled={formState === "loading"}
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
                      selectedKeys={formData.state ? [formData.state] : []}
                      onChange={(e) =>
                        setFormData({ ...formData, state: e.target.value as string })
                      }
                      classNames={selectClasses}
                      isRequired
                      isDisabled={formState === "loading"}
                    >
                      {states.map((state) => (
                        <SelectItem key={state.value} value={state.value}>
                          {state.label}
                        </SelectItem>
                      ))}
                    </Select>
                  </div>
                </div>

                {/* City and Phone - Side by side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <Select
                      placeholder="City *"
                      variant="faded"
                      size="lg"
                      selectedKeys={formData.city ? [formData.city] : []}
                      onChange={(e) =>
                        setFormData({ ...formData, city: e.target.value as string })
                      }
                      classNames={selectClasses}
                      isRequired
                      isDisabled={formState === "loading"}
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
                      classNames={inputClasses}
                      isDisabled={formState === "loading"}
                    />
                  </div>
                </div>

                {/* Properties - Full width textarea */}
                <div className="relative">
                  <Textarea
                    placeholder="Tell us about your properties"
                    variant="bordered"
                    value={formData.properties}
                    onChange={(e) =>
                      setFormData({ ...formData, properties: e.target.value })
                    }
                    classNames={{
                      input: "bg-[#333333] text-white placeholder:text-[#E2E2E2]",
                      inputWrapper: "bg-[#333333] border-2 border-[#E2E2E2] min-h-[120px]",
                    }}
                    isDisabled={formState === "loading"}
                    minRows={3}
                    size="lg"
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

export default BusinessContactForm;