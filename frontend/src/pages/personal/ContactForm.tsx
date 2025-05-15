import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Select,
  SelectItem,
  Spinner,
  Textarea
} from "@nextui-org/react";
import { ArrowLeft, CheckCircle, LogIn } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "../../assets/logo.svg";
import { useNavigate } from "react-router-dom";
import {
  FormContainer,
  inputClasses,
  selectClasses,
  cardClasses,
  secondaryButtonClasses,
  formElementTransition
} from "../../shared/styles";
import { KeyboardEvent as ReactKeyboardEvent } from "react";

// Define interfaces for type safety
interface FormDataType {
  name: string;
  email: string;
  country: string;
  state: string;
  city: string;
  phoneCode: string;
  phone: string;
  properties: string;
  kwh?: string;
  panels?: string;
  cost?: string;
}

interface ErrorsType {
  [key: string]: string;
}

interface CountryType {
  name: string;
  flag: string;
  callingCode: string;
}

interface CallingCodeType {
  value: string;
  flag: string;
  country: string;
  searchText: string;
}

// Simple email validation
const isValidEmail = (email: string): boolean =>
  /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,})+$/.test(email);

// Brevo API configuration
const BREVO_API_KEY =
  "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"; // Replace with your actual API key
const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

function ContactForm() {
  // Phone code state declared only once
  const [phoneCodeInput, setPhoneCodeInput] = useState("");
  const [showPhoneDropdown, setShowPhoneDropdown] = useState(false);

  // Create a ref for the phone code container
  const phoneContainerRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<FormDataType>({
    name: "",
    email: "",
    country: "",
    state: "",
    city: "",
    phoneCode: "",
    phone: "",
    properties: "",
  });

  const [errors, setErrors] = useState<ErrorsType>({});
  const [formState, setFormState] = useState<"idle" | "loading" | "success">("idle");
  const [emailStatus, setEmailStatus] = useState<null | "sending" | "sent" | "failed">(null);

  // Data from APIs
  const [countries, setCountries] = useState<CountryType[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [isFetchingStates, setIsFetchingStates] = useState(false);

  const navigate = useNavigate();

  // Ensure dropdown is closed on initial mount
  useEffect(() => {
    setShowPhoneDropdown(false);
  }, []);

  // Click-outside handler for phone code dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (phoneContainerRef.current && !phoneContainerRef.current.contains(e.target as Node)) {
        setShowPhoneDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 1) Fetch countries on mount
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const res = await fetch("https://restcountries.com/v3.1/all");
        const data = await res.json();
        // Sort by country name
        const countryList = data
          .map((country: any) => ({
            name: country.name.common,
            flag: country.flags.svg,
            callingCode:
              country.idd && country.idd.root
                ? `${country.idd.root}${country.idd.suffixes ? country.idd.suffixes[0] : ""}`
                : "",
          }))
          .sort((a: CountryType, b: CountryType) => a.name.localeCompare(b.name));
        setCountries(countryList);
      } catch (error) {
        console.error("Error fetching countries:", error);
      }
    };
    fetchCountries();
  }, []);

  // 2) Fetch states after selecting a country
  useEffect(() => {
    if (formData.country) {
      const fetchStates = async () => {
        setIsFetchingStates(true);
        try {
          const res = await fetch("https://countriesnow.space/api/v0.1/countries/states", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ country: formData.country })
          });
          const data = await res.json();
          if (!data.error && data.data && data.data.states) {
            setStates(data.data.states.map((s: any) => s.name));
          } else {
            setStates([]);
          }
        } catch (error) {
          console.error("Error fetching states:", error);
          setStates([]);
        }
        setIsFetchingStates(false);
      };
      fetchStates();
    }
  }, [formData.country]);

  // Prepare calling codes for searching
  const callingCodes: CallingCodeType[] = countries
    .filter(c => c.callingCode)
    .map(country => ({
      value: country.callingCode,
      flag: country.flag,
      country: country.name,
      searchText: `${country.callingCode} ${country.name}`.toLowerCase()
    }))
    .sort((a, b) => {
      const numA = parseInt(a.value.replace(/[^\d]/g, ''), 10);
      const numB = parseInt(b.value.replace(/[^\d]/g, ''), 10);
      return numA - numB;
    });

  // Filter phone codes based on input (compare both country and code in lower case)
  const filteredCodes = phoneCodeInput.trim() === ""
    ? callingCodes
    : callingCodes.filter(code =>
      code.country.toLowerCase().includes(phoneCodeInput.toLowerCase()) ||
      code.value.toLowerCase().includes(phoneCodeInput.toLowerCase())
    );

  // Validate a single field
  const validateField = (field: keyof FormDataType, value: string): string | undefined => {
    switch (field) {
      case "name":
        return !value.trim() ? "Name is required" : undefined;
      case "email":
        return !value.trim()
          ? "Email is required"
          : !isValidEmail(value)
            ? "Valid email is required"
            : undefined;
      case "country":
        return !value ? "Country is required" : undefined;
      case "state":
        return !value ? "State is required" : undefined;
      case "city":
        return !value.trim() ? "City is required" : undefined;
      case "phoneCode":
        return !value ? "Code is required" : undefined;
      case "phone":
        return !value.trim() ? "Phone is required" : undefined;
      default:
        return undefined;
    }
  };

  // Helper to update formData with real-time validation
  const handleInputChange = (field: keyof FormDataType, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    const errorMessage = validateField(field, value);
    setErrors((prev) => {
      const newErrors = { ...prev };
      if (errorMessage) {
        newErrors[field] = errorMessage;
      } else {
        delete newErrors[field];
      }
      return newErrors;
    });
  };

  // Validate all form fields
  const validateForm = (): ErrorsType => {
    const newErrors: ErrorsType = {};
    Object.keys(formData).forEach((key) => {
      if (key === "properties") return;
      if (key === "kwh" || key === "panels" || key === "cost") return;
      const error = validateField(key as keyof FormDataType, formData[key as keyof FormDataType]);
      if (error) {
        newErrors[key] = error;
      }
    });
    return newErrors;
  };

  // Add monthly usage, panel count, and cost to form data from query parameters
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const usageInput = parseFloat(queryParams.get("kwh") || "0");
    const panelCount = parseInt(queryParams.get("panels") || "0", 10);
    const totalCost = parseFloat(queryParams.get("cost") || "0");

    setFormData((prevData) => ({
      ...prevData,
      kwh: usageInput.toString(),
      panels: panelCount.toString(),
      cost: totalCost.toString(),
    }));
  }, [window.location.search]);

  // Send confirmation email with Brevo API
  const sendConfirmationEmail = async () => {
    setEmailStatus("sending");
    try {
      const response = await fetch(BREVO_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": BREVO_API_KEY
        },
        body: JSON.stringify({
          sender: {
            name: "Renrg",
            email: "contact@renrg.io"
          },
          to: [
            {
              email: formData.email,
              name: formData.name
            }
          ],
          subject: "Thank you for your submission",
          htmlContent: `
            <html>
              <head>
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { text-align: center; padding: 20px 0; }
                  .content { background-color: #f9f9f9; padding: 30px; border-radius: 5px; }
                  .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
                  h1 { color: #E9423A; }
                  .button { 
                    background-color: #E9423A; 
                    color: white; 
                    padding: 12px 20px; 
                    text-decoration: none; 
                    border-radius: 4px;
                    display: inline-block;
                    margin-top: 20px;
                  }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <img src="https://pbs.twimg.com/profile_images/1819274578092339200/y18Mi81U_400x400.jpg" alt="Logo" width="120" />
                  </div>
                  <div class="content">
                    <h1>Thank You ${formData.name}!</h1>
                    <p>We've received your inquiry and appreciate your interest in our services.</p>
                    <p>Here's a summary of the information you provided:</p>
                    <ul>
                      <li><strong>Name:</strong> ${formData.name}</li>
                      <li><strong>Email:</strong> ${formData.email}</li>
                      <li><strong>Location:</strong> ${formData.city}, ${formData.state}, ${formData.country}</li>
                      <li><strong>Phone:</strong> ${formData.phoneCode} ${formData.phone}</li>
                      ${formData.properties ? `<li><strong>Property Details:</strong> ${formData.properties}</li>` : ""}
                    </ul>
                    <p>Here are our panel estimates:</p>
                    <ul>
                      <li><strong>Your monthly usage:</strong> ${formData.kwh} kWh</li>
                      <li><strong>Panel Count:</strong> ${formData.panels}</li>
                      <li><strong>Estimated Cost:</strong> $${formData.cost}</li>
                    </ul>
                    <p>Our team will review your information and contact you shortly to discuss how we can assist you.</p>
                    <p>If you have any immediate questions, please don't hesitate to contact us.</p>
                    <a href="https://renrg.io/contact" class="button">Visit Our Website</a>
                  </div>
                  <div class="footer">
                    <p>&copy; ${new Date().getFullYear()} Renrg. All rights reserved.</p>
                    <p>NRG DE Ltd. <br>
                    Aegis Chambers, 1st Floor, Ellen Skelton Building, <br>
                    3076 Sir Francis Drake's Highway, Road Town, Tortola, VG1110,<br>
                    British Virgin Islands
                    </p>
                  </div>
                </div>
              </body>
            </html>
          `
        })
      });

      const result = await response.json();
      console.log("Email sent result:", result);

      if (response.ok) {
        setEmailStatus("sent");
      } else {
        console.error("Failed to send email:", result);
        setEmailStatus("failed");
      }
    } catch (error) {
      console.error("Error sending email:", error);
      setEmailStatus("failed");
    }
  };

  // On form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validateForm();
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      setFormState("loading");
      setTimeout(() => {
        console.log("Form submitted:", formData);
        sendConfirmationEmail();
        setFormState("success");
      }, 1500);
    }
  };

  // Go back to the previous page
  const handleBack = () => {
    window.history.back();
  };

  // Country and state search management
  const [searchCountryQuery, setSearchCountryQuery] = useState("");
  const [searchStateQuery, setSearchStatesQuery] = useState("");
  const [filteredCountries, setFilteredCountries] = useState<CountryType[]>(countries);
  const [filteredStates, setFilteredStates] = useState<string[]>(states);

  useEffect(() => {
    const filtered = countries.filter((country) =>
      country.name.toLowerCase().startsWith(searchCountryQuery.toLowerCase())
    );
    setFilteredCountries(filtered);
  }, [searchCountryQuery, countries]);

  const handleKeyDownCountry = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (/^[a-zA-Z0-9]$/.test(e.key)) {
      setSearchCountryQuery((prev) => prev + e.key);
    } else if (e.key === "Backspace") {
      setSearchCountryQuery("");
    }
  };

  useEffect(() => {
    const filtered = states.filter((state) =>
      state.toLowerCase().startsWith(searchStateQuery.toLowerCase())
    );
    setFilteredStates(filtered);
  }, [searchStateQuery, states]);

  const handleKeyDownStates = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (/^[a-zA-Z0-9]$/.test(e.key)) {
      setSearchStatesQuery((prev) => prev + e.key);
    } else if (e.key === "Backspace") {
      setSearchStatesQuery("");
    }
  };

  return (
    <FormContainer>
      <div className="flex justify-center relative z-10 mb-2">
        <div className="w-24">
          <img src={logo} alt="logo" />
        </div>
      </div>
      <div className="max-w-md mx-auto w-full mb-3 relative z-10">
        <Button
          className={`mb-2 ${secondaryButtonClasses}`}
          onPress={handleBack}
          startContent={<ArrowLeft size={20} />}
          disabled={formState === "loading"}
        >
          Back to Estimate
        </Button>
      </div>
      <Card className={cardClasses}>
        <CardHeader className="flex justify-center items-center flex-col -mb-4">
          <div className="mt-3 p-4 bg-[#2F2F2F] rounded-lg shadow-inner w-full text-center">
            <h2 className="text-3xl font-bold text-white mb-2 font-electrolize">
              Join Waitlist
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
                {emailStatus === "sent" && (
                  <p className="text-green-400 text-center mb-6">
                    We've also sent a confirmation email to {formData.email}.
                  </p>
                )}
                {emailStatus === "failed" && (
                  <p className="text-yellow-400 text-center mb-6">
                    We couldn't send a confirmation email. Please check your inbox later.
                  </p>
                )}
                <Button
                  className="bg-[#E9423A] text-white"
                  onPress={() => {
                    setFormState("idle");
                    setEmailStatus(null);
                    setFormData({
                      name: "",
                      email: "",
                      country: "",
                      state: "",
                      city: "",
                      phoneCode: "",
                      phone: "",
                      properties: "",
                    });
                    setErrors({});
                  }}
                >
                  Submit Another Response
                </Button>
              </motion.div>
            ) : (
              <motion.form
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit}
                className="font-electrolize relative flex flex-col space-y-6"
              >
                {formState === "loading" && (
                  <div className="absolute inset-0 bg-[#202020] bg-opacity-80 flex flex-col items-center justify-center z-20 rounded-lg">
                    <Spinner size="lg" color="danger" className="mb-4" />
                    <p className="text-white">Submitting your request...</p>
                  </div>
                )}
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
                    <Input
                      type="text"
                      size="lg"
                      placeholder="Name *"
                      variant="faded"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      onBlur={(e) => handleInputChange("name", e.target.value)}
                      classNames={inputClasses}
                      isInvalid={!!errors.name}
                      errorMessage={errors.name}
                      isDisabled={formState === "loading"}
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      type="email"
                      size="lg"
                      placeholder="Email *"
                      variant="faded"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      onBlur={(e) => handleInputChange("email", e.target.value)}
                      classNames={inputClasses}
                      isInvalid={!!errors.email}
                      errorMessage={errors.email}
                      isDisabled={formState === "loading"}
                    />
                  </div>
                </div>
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1 min-w-0" onKeyDown={handleKeyDownCountry}>
                    <Select
                      placeholder="Country *"
                      variant="faded"
                      size="lg"
                      isDisabled={formState === "loading"}
                      classNames={selectClasses}
                      selectedKeys={formData.country ? [formData.country] : []}
                      onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0]?.toString() || "";
                        handleInputChange("country", selected);
                        if (selected !== formData.country) {
                          handleInputChange("state", "");
                        }
                      }}
                      isInvalid={!!errors.country}
                      errorMessage={errors.country}
                    >
                      {filteredCountries.map((country) => (
                        <SelectItem key={country.name} textValue={country.name}>
                          <div className="flex items-center gap-2">
                            <img src={country.flag} alt={country.name} className="w-5 h-5" />
                            <span>{country.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </Select>
                  </div>
                  <div className="flex-1 min-w-0" onKeyDown={handleKeyDownStates}>
                    <Select
                      placeholder={isFetchingStates ? "Loading states..." : "State *"}
                      variant="faded"
                      size="lg"
                      isDisabled={formState === "loading" || isFetchingStates || !formData.country}
                      classNames={selectClasses}
                      selectedKeys={formData.state ? [formData.state] : []}
                      onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0]?.toString() || "";
                        handleInputChange("state", selected);
                      }}
                      isInvalid={!!errors.state}
                      errorMessage={errors.state}
                    >
                      {filteredStates.length > 0 ? (
                        filteredStates.map((state) => (
                          <SelectItem key={state}>{state}</SelectItem>
                        ))
                      ) : (
                        <SelectItem key="none">
                          {isFetchingStates ? "Loading states..." : "No states available"}
                        </SelectItem>
                      )}
                    </Select>
                  </div>
                  <div className="flex-1 min-w-0">
                    <Input
                      type="text"
                      size="lg"
                      placeholder="City *"
                      variant="faded"
                      value={formData.city}
                      onChange={(e) => handleInputChange("city", e.target.value)}
                      onBlur={(e) => handleInputChange("city", e.target.value)}
                      classNames={inputClasses}
                      isInvalid={!!errors.city}
                      errorMessage={errors.city}
                      isDisabled={formState === "loading"}
                    />
                  </div>
                </div>
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="md:w-1/3 relative" ref={phoneContainerRef}>
                    <Input
                      id="phone-code-input"
                      type="text"
                      size="lg"
                      placeholder="Code *"
                      variant="faded"
                      value={phoneCodeInput}
                      onChange={(e) => {
                        setPhoneCodeInput(e.target.value);
                        setShowPhoneDropdown(true);
                      }}
                      onClick={() => setShowPhoneDropdown(true)}
                      classNames={inputClasses}
                      isInvalid={!!errors.phoneCode}
                      errorMessage={errors.phoneCode}
                      isDisabled={formState === "loading"}
                    />
                    {showPhoneDropdown && (
                      <div
                        id="phone-code-dropdown"
                        className="absolute z-50 w-full mt-1 bg-[#333] border border-[#444] rounded-lg shadow-lg max-h-[200px] overflow-y-auto"
                      >
                        {filteredCodes.length > 0 ? (
                          filteredCodes.map((code) => (
                            <div
                              key={code.value}
                              className="flex items-center gap-2 p-2 hover:bg-[#444] cursor-pointer"
                              onClick={() => {
                                handleInputChange("phoneCode", code.value);
                                setPhoneCodeInput(code.value);
                                setShowPhoneDropdown(false);
                              }}
                            >
                              <img src={code.flag} alt={code.country} className="w-5 h-5" />
                              <span className="font-medium">{code.value}</span>
                              <span className="text-xs text-gray-400">({code.country})</span>
                            </div>
                          ))
                        ) : (
                          <div className="p-2 text-gray-400">No results found</div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="md:w-2/3">
                    <Input
                      type="tel"
                      size="lg"
                      placeholder="Phone Number *"
                      variant="faded"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      onBlur={(e) => handleInputChange("phone", e.target.value)}
                      classNames={inputClasses}
                      isInvalid={!!errors.phone}
                      errorMessage={errors.phone}
                      isDisabled={formState === "loading"}
                    />
                  </div>
                </div>
                <div>
                  <Textarea
                    size="lg"
                    placeholder="Property Details (Optional)"
                    variant="faded"
                    value={formData.properties}
                    onChange={(e) => handleInputChange("properties", e.target.value)}
                    classNames={{
                      ...inputClasses,
                      input: "bg-[#333] text-white min-h-[50px]"
                    }}
                    isDisabled={formState === "loading"}
                    minRows={2}
                    maxRows={4}
                  />
                </div>
                <motion.div
                  {...formElementTransition}
                  style={{ pointerEvents: formState === "loading" ? "none" : "auto" }}
                >
                  <Button
                    type="submit"
                    className="w-full bg-[#E9423A] text-white rounded-none"
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

      {/* Login icon with text - Same as ElectricityEstimateForm */}
      <div className="flex justify-center w-full mt-10" style={{ position: "relative", zIndex: 10 }}>
        <a
          href="/login"
          onClick={(e) => {
            e.preventDefault();
            navigate("/login");
          }}
          className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors duration-300"
          style={{ width: "fit-content" }}
        >
          <LogIn size={18} />
          <span>Login</span>
        </a>
      </div>

      {/* Business profile text */}
      <div className="absolute bottom-6 text-sm text-white w-full text-center">
        Are you a business? <a href="/business-contact" className="text-[#E9423A] hover:underline">Switch to Business Profile</a>
      </div>
    </FormContainer>
  );
}

export default ContactForm;