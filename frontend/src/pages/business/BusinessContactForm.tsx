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
import { CheckCircle } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { KeyboardEvent as ReactKeyboardEvent } from "react";
import logo from "../../assets/logo.svg";
import { 
  FormContainer, 
  inputClasses, 
  selectClasses, 
  cardClasses,
  formElementTransition
} from "../../shared/styles";

// Simple email validation
const isValidEmail = (email: string) =>
  /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,})+$/.test(email);

// Brevo API configuration
const BREVO_API_KEY = "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";
const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

interface FormData {
  name: string;
  email: string;
  company: string;
  title: string;
  country: string;
  state: string;
  city: string;
  phoneCode: string;
  phone: string;
  properties: string;
}

interface ErrorState {
  name?: string;
  email?: string;
  company?: string;
  title?: string;
  country?: string;
  state?: string;
  city?: string;
  phoneCode?: string;
  phone?: string;
}

interface Country {
  name: string;
  flag: string;
  callingCode: string;
}

type FormState = "idle" | "loading" | "success";
type EmailStatus = null | "sending" | "sent" | "failed";

function BusinessContactForm() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    company: "",
    title: "",
    country: "",
    state: "",
    city: "",
    phoneCode: "",
    phone: "",
    properties: "",
  });

  const [errors, setErrors] = useState<ErrorState>({});
  const [formState, setFormState] = useState<FormState>("idle");
  const [emailStatus, setEmailStatus] = useState<EmailStatus>(null);

  // Data from APIs
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [isFetchingStates, setIsFetchingStates] = useState(false);

  // Simplified phone code state
  const [phoneCodeInput, setPhoneCodeInput] = useState("");
  const [showPhoneDropdown, setShowPhoneDropdown] = useState(false);

  // Create a ref for the phone code container
  const phoneCodeRef = useRef<HTMLDivElement>(null);

  // Ensure dropdown is reset on initial mount
  useEffect(() => {
    setShowPhoneDropdown(false);
  }, []);

  // Click outside handler for phone code dropdown using the ref
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (phoneCodeRef.current && !phoneCodeRef.current.contains(e.target as Node)) {
        setShowPhoneDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Update phone code input when form data changes
  useEffect(() => {
    if (formData.phoneCode) {
      setPhoneCodeInput(formData.phoneCode);
    }
  }, [formData.phoneCode]);

  // 1) Fetch countries on mount
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const res = await fetch("https://restcountries.com/v3.1/all");
        const data = await res.json();
        // Sort by country name
        const countryList: Country[] = data
          .map((country: any) => ({
            name: country.name.common,
            flag: country.flags.svg,
            callingCode:
              country.idd && country.idd.root
                ? `${country.idd.root}${country.idd.suffixes ? country.idd.suffixes[0] : ""}`
                : "",
          }))
          .sort((a: Country, b: Country) => a.name.localeCompare(b.name));
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

  // Prepare a list of calling codes with flags and countries
  const phoneCodesList = countries
    .filter(c => c.callingCode)
    .map(country => ({
      value: country.callingCode,
      flag: country.flag,
      country: country.name,
    }))
    .sort((a, b) => {
      // Sort by numeric value
      const numA = parseInt(a.value.replace(/\D/g, ''), 10) || 0;
      const numB = parseInt(b.value.replace(/\D/g, ''), 10) || 0;
      return numA - numB;
    });

  // Validate form fields
  const validateForm = () => {
    const newErrors: ErrorState = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim() || !isValidEmail(formData.email)) {
      newErrors.email = "Valid email is required";
    }
    if (!formData.company.trim()) newErrors.company = "Company is required";
    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.country) newErrors.country = "Country is required";
    if (!formData.state) newErrors.state = "State is required";
    if (!formData.city.trim()) newErrors.city = "City is required";
    if (!formData.phoneCode) newErrors.phoneCode = "Code is required";
    if (!formData.phone.trim()) newErrors.phone = "Phone is required";
    return newErrors;
  };

  // Send confirmation email with Brevo API
  const sendConfirmationEmail = async () => {
    setEmailStatus("sending");
    try {
      const response = await fetch(BREVO_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": BREVO_API_KEY,
        },
        body: JSON.stringify({
          sender: {
            name: "Renrg",
            email: "contact@renrg.io",
          },
          to: [
            {
              email: formData.email,
              name: formData.name,
            },
          ],
          subject: "Thank you for your business inquiry",
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
                    <p>We've received your business inquiry and appreciate your interest in our services.</p>
                    <p>Here's a summary of the information you provided:</p>
                    <ul>
                      <li><strong>Name:</strong> ${formData.name}</li>
                      <li><strong>Email:</strong> ${formData.email}</li>
                      <li><strong>Company:</strong> ${formData.company}</li>
                      <li><strong>Title:</strong> ${formData.title}</li>
                      <li><strong>Location:</strong> ${formData.city}, ${formData.state}, ${formData.country}</li>
                      <li><strong>Phone:</strong> ${formData.phoneCode} ${formData.phone}</li>
                      ${formData.properties ? `<li><strong>Property Details:</strong> ${formData.properties}</li>` : ''}
                    </ul>
                    <p>Our business development team will review your information and contact you shortly.</p>
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
          `,
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

  // Helper to update formData with immediate validation on change
  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    const newErrors = { ...errors };
    switch (field) {
      case "name":
        if (!value.trim()) {
          newErrors.name = "Name is required";
        } else {
          delete newErrors.name;
        }
        break;
      case "email":
        if (!value.trim()) {
          newErrors.email = "Email is required";
        } else if (!isValidEmail(value)) {
          newErrors.email = "Valid email is required";
        } else {
          delete newErrors.email;
        }
        break;
      case "company":
        if (!value.trim()) {
          newErrors.company = "Company is required";
        } else {
          delete newErrors.company;
        }
        break;
      case "title":
        if (!value.trim()) {
          newErrors.title = "Title is required";
        } else {
          delete newErrors.title;
        }
        break;
      case "country":
        if (!value) {
          newErrors.country = "Country is required";
        } else {
          delete newErrors.country;
        }
        break;
      case "state":
        if (!value) {
          newErrors.state = "State is required";
        } else {
          delete newErrors.state;
        }
        break;
      case "city":
        if (!value.trim()) {
          newErrors.city = "City is required";
        } else {
          delete newErrors.city;
        }
        break;
      case "phoneCode":
        if (!value) {
          newErrors.phoneCode = "Code is required";
        } else {
          delete newErrors.phoneCode;
        }
        break;
      case "phone":
        if (!value.trim()) {
          newErrors.phone = "Phone is required";
        } else {
          delete newErrors.phone;
        }
        break;
      default:
        break;
    }
    setErrors(newErrors);
  };

  // For Country dropdown filtering
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredCountries, setFilteredCountries] = useState(countries);
  useEffect(() => {
    const filtered = countries.filter((country) =>
      country.name.toLowerCase().startsWith(searchQuery.toLowerCase())
    );
    setFilteredCountries(filtered);
  }, [searchQuery, countries]);

  const handleKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (/^[a-zA-Z0-9]$/.test(e.key)) {
      setSearchQuery((prev) => prev + e.key);
    } else if (e.key === "Backspace") {
      setSearchQuery("");
    }
  };

  return (
    <FormContainer>
      {/* Logo */}
      <div className="flex justify-center relative z-10 mb-6">
        <div className="w-24">
          <img src={logo} alt="logo" />
        </div>
      </div>

      {/* Card */}
      <Card className={cardClasses}>
        <CardHeader className="flex justify-center items-center flex-col -mb-2">
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
                  Your business inquiry has been successfully submitted. Our team will contact you shortly.
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
                      company: "",
                      title: "",
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
                  Submit Another Inquiry
                </Button>
              </motion.div>
            ) : (
              <motion.form 
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit}
                className="font-electrolize relative flex flex-col space-y-4"
              >
                {/* Loading overlay */}
                {formState === "loading" && (
                  <div className="absolute inset-0 bg-[#202020] bg-opacity-80 flex flex-col items-center justify-center z-20 rounded-lg">
                    <Spinner size="lg" color="danger" className="mb-4" />
                    <p className="text-white">Submitting your request...</p>
                  </div>
                )}

                {/* Row 1: Name & Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Input
                      type="text"
                      size="lg"
                      placeholder="Name *"
                      variant="faded"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      classNames={inputClasses}
                      isInvalid={!!errors.name}
                      errorMessage={errors.name}
                      isDisabled={formState === "loading"}
                    />
                  </div>
                  <div>
                    <Input
                      type="email"
                      size="lg"
                      placeholder="Email *"
                      variant="faded"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      classNames={inputClasses}
                      isInvalid={!!errors.email}
                      errorMessage={errors.email}
                      isDisabled={formState === "loading"}
                    />
                  </div>
                </div>

                {/* Row 2: Company & Title */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Input
                      type="text"
                      size="lg"
                      placeholder="Company *"
                      variant="faded"
                      value={formData.company}
                      onChange={(e) => handleInputChange("company", e.target.value)}
                      classNames={inputClasses}
                      isInvalid={!!errors.company}
                      errorMessage={errors.company}
                      isDisabled={formState === "loading"}
                    />
                  </div>
                  <div>
                    <Input
                      type="text"
                      size="lg"
                      placeholder="Title *"
                      variant="faded"
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      classNames={inputClasses}
                      isInvalid={!!errors.title}
                      errorMessage={errors.title}
                      isDisabled={formState === "loading"}
                    />
                  </div>
                </div>

                {/* Row 3: Country, State & City */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div onKeyDown={handleKeyDown}>
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
                  <div>
                    <Select
                      placeholder={isFetchingStates ? "Loading states..." : "State *"}
                      variant="faded"
                      size="lg"
                      isDisabled={formState === "loading" || isFetchingStates || !formData.country}
                      classNames={selectClasses}
                      selectedKeys={formData.state ? [formData.state] : []}
                      onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0] as string || "";
                        handleInputChange("state", selected);
                      }}
                      isInvalid={!!errors.state}
                      errorMessage={errors.state}
                    >
                      {states.length > 0 ? (
                        states.map((state) => (
                          <SelectItem key={state}>{state}</SelectItem>
                        ))
                      ) : (
                        <SelectItem key="none">
                          {isFetchingStates ? "Loading states..." : "No states available"}
                        </SelectItem>
                      )}
                    </Select>
                  </div>
                  <div>
                    <Input
                      type="text"
                      size="lg"
                      placeholder="City *"
                      variant="faded"
                      value={formData.city}
                      onChange={(e) => handleInputChange("city", e.target.value)}
                      classNames={inputClasses}
                      isInvalid={!!errors.city}
                      errorMessage={errors.city}
                      isDisabled={formState === "loading"}
                    />
                  </div>
                </div>

                {/* Row 4: Phone Code & Phone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative" ref={phoneCodeRef}>
                    <Input
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
                        className="absolute z-50 w-full mt-1 bg-[#333] border border-[#444] rounded-lg shadow-lg max-h-[200px] overflow-y-auto"
                      >
                        {phoneCodesList
                          .filter(code => {
                            const input = phoneCodeInput.trim().toLowerCase();
                            return input === "" || 
                                   code.country.toLowerCase().includes(input) ||
                                   code.value.toLowerCase().includes(input);
                          })
                          .map(code => (
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
                          ))}
                        {phoneCodesList.filter(code => {
                          const input = phoneCodeInput.trim().toLowerCase();
                          return input === "" || 
                                 code.country.toLowerCase().includes(input) ||
                                 code.value.toLowerCase().includes(input);
                        }).length === 0 && (
                          <div className="p-2 text-gray-400">No results found</div>
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <Input
                      type="tel"
                      size="lg"
                      placeholder="Phone Number *"
                      variant="faded"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      classNames={inputClasses}
                      isInvalid={!!errors.phone}
                      errorMessage={errors.phone}
                      isDisabled={formState === "loading"}
                    />
                  </div>
                </div>

                {/* Row 5: Properties Textarea - Keep it large */}
                <div className="mt-2">
                  <Textarea
                    placeholder="Tell us about your properties"
                    variant="bordered"
                    value={formData.properties}
                    onChange={(e) => handleInputChange("properties", e.target.value)}
                    classNames={{
                      ...inputClasses,
                      input: "bg-[#333] text-white min-h-[50px]"
                    }}
                    isDisabled={formState === "loading"}
                    minRows={2}
                    maxRows={4}
                    size="lg"
                  />
                </div>

                {/* Submit Button */}
                <motion.div
                  {...formElementTransition}
                  style={{ pointerEvents: formState === "loading" ? 'none' : 'auto' }}
                  className="mt-2"
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
    </FormContainer>
  );
}

export default BusinessContactForm;
