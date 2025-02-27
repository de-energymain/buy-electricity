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
import { ArrowLeft, CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "../../assets/logo.svg";
import { 
  FormContainer, 
  inputClasses, 
  selectClasses, 
  cardClasses,
  secondaryButtonClasses,
  formElementTransition
} from "../../shared/styles";

// Simple email validation
const isValidEmail = (email: string) =>
  /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email);

// Brevo API configuration
const BREVO_API_KEY = "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"; // Replace with your actual API key
const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

type ContactFormData = {
  name: string;
  email: string;
  country: string;
  state: string;
  city: string;
  phoneCode: string;
  phone: string;
  properties?: string; // Optional field
};

// Add a matching error type
type ContactFormErrors = {
  name?: string;
  email?: string;
  country?: string;
  state?: string;
  city?: string;
  phoneCode?: string;
  phone?: string;
  properties?: string;
};

// Country type
type Country = {
  name: string;
  flag: string;
  callingCode: string;
};

type FormState = "idle" | "loading" | "success";
type EmailStatus = null | "sending" | "sent" | "failed";

function ContactForm() {
  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    email: "",
    country: "",
    state: "",
    city: "",
    phoneCode: "",
    phone: "",
    properties: "",
  });

  const [errors, setErrors] = useState<ContactFormErrors>({});
  const [formState, setFormState] = useState<FormState>("idle");
  const [emailStatus, setEmailStatus] = useState<EmailStatus>(null);

  // Data from APIs
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [isFetchingStates, setIsFetchingStates] = useState(false);

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

  // Clear errors when field values change
  useEffect(() => {
    // Create a new errors object without properties that are now valid
    const newErrors = { ...errors };
    
    if (formData.name.trim()) delete newErrors.name;
    if (formData.email.trim() && isValidEmail(formData.email)) delete newErrors.email;
    if (formData.country) delete newErrors.country;
    if (formData.state) delete newErrors.state;
    if (formData.city.trim()) delete newErrors.city;
    if (formData.phoneCode) delete newErrors.phoneCode;
    if (formData.phone.trim()) delete newErrors.phone;
    
    // Only update if errors have changed
    if (Object.keys(newErrors).length !== Object.keys(errors).length) {
      setErrors(newErrors);
    }
  }, [formData, errors]);

  // Validate form fields
  const validateForm = (): ContactFormErrors => {
    const newErrors: ContactFormErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim() || !isValidEmail(formData.email)) {
      newErrors.email = "Valid email is required";
    }
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
                    <img src="https://renrg.io/wp-content/uploads/2025/02/nrg-logo-icon.svg" alt="Logo" width="120" />
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
                      ${formData.properties ? `<li><strong>Property Details:</strong> ${formData.properties}</li>` : ''}
                    </ul>
                    <p>Our team will review your information and contact you shortly to discuss how we can assist you.</p>
                    <p>If you have any immediate questions, please don't hesitate to contact us.</p>
                    <a href="https://renrg.io/contact" class="button">Visit Our Website</a>
                  </div>
                  <div class="footer">
                    <p>&copy; ${new Date().getFullYear()} Your Company Name. All rights reserved.</p>
                    <p>123 Company Street, City, Country</p>
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
      
      // Simulate API call for form submission
      setTimeout(() => {
        console.log("Form submitted:", formData);
        
        // After form is submitted, send confirmation email
        sendConfirmationEmail();
        
        setFormState("success");
      }, 1500);
    }
  };

  // Go back to the previous page
  const handleBack = () => {
    window.history.back();
  };

  // Helper to update formData
  const handleInputChange = (field: keyof ContactFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <FormContainer>
      {/* Logo */}
      <div className="flex justify-center relative z-10 mb-4">
        <div className="w-24">
          <img src={logo} alt="logo" />
        </div>
      </div>

      {/* Back Button */}
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

      {/* Card */}
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
              // Success Screen
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
                    // Reset to initial
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
              // Form Screen
              <motion.form 
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit}
                className="font-electrolize relative flex flex-col space-y-6"
              >
                {/* Loading overlay */}
                {formState === "loading" && (
                  <div className="absolute inset-0 bg-[#202020] bg-opacity-80 flex flex-col items-center justify-center z-20 rounded-lg">
                    <Spinner size="lg" color="danger" className="mb-4" />
                    <p className="text-white">Submitting your request...</p>
                  </div>
                )}

                {/* Row 1: Name & Email */}
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
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
                  <div className="flex-1">
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

                {/* Row 2: Country & State */}
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
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
                        // Clear state when country changes
                        if (selected !== formData.country) {
                          handleInputChange("state", "");
                        }
                      }}
                    >
                      {countries.map((country) => (
                        <SelectItem key={country.name} textValue={country.name}>
                          <div className="flex items-center gap-2">
                            <img
                              src={country.flag}
                              alt={country.name}
                              className="w-5 h-5"
                            />
                            <span>{country.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </Select>
                    {errors.country && (
                      <p className="text-xs text-red-500 mt-1">{errors.country}</p>
                    )}
                  </div>

                  <div className="flex-1">
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
                    >
                      {states.length > 0 ? (
                        states.map((state) => (
                          <SelectItem key={state}>{state}</SelectItem>
                        ))
                      ) : (
                        <SelectItem key="none">
                          {isFetchingStates
                            ? "Loading states..."
                            : "No states available"}
                        </SelectItem>
                      )}
                    </Select>
                    {errors.state && (
                      <p className="text-xs text-red-500 mt-1">{errors.state}</p>
                    )}
                  </div>
                </div>

                {/* Row 3: City */}
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

                {/* Row 4: Phone Code & Phone (separate row for better visibility) */}
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Phone code */}
                  <div className="md:w-1/3">
                    <Select
                      placeholder="Phone Code *"
                      variant="faded"
                      size="lg"
                      isDisabled={formState === "loading"}
                      classNames={selectClasses}
                      selectedKeys={formData.phoneCode ? [formData.phoneCode] : []}
                      onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0]?.toString() || "";
                        handleInputChange("phoneCode", selected);
                      }}
                    >
                      {countries
                        .filter((c) => c.callingCode)
                        .map((country) => (
                          <SelectItem key={country.callingCode}>
                            <div className="flex items-center gap-2">
                              <img
                                src={country.flag}
                                alt={country.name}
                                className="w-5 h-5"
                              />
                              <span>{country.callingCode}</span>
                            </div>
                          </SelectItem>
                        ))}
                    </Select>
                    {errors.phoneCode && (
                      <p className="text-xs text-red-500 mt-1">{errors.phoneCode}</p>
                    )}
                  </div>
                  {/* Phone number */}
                  <div className="md:w-2/3">
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

                {/* Row 5: Property Details (Optional) */}
                <div>
                  <Input
                    type="text"
                    size="lg"
                    placeholder="Property Details (Optional)"
                    variant="faded"
                    value={formData.properties}
                    onChange={(e) => handleInputChange("properties", e.target.value)}
                    classNames={inputClasses}
                    isDisabled={formState === "loading"}
                  />
                </div>

                {/* Submit Button */}
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
