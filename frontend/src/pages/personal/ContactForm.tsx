import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Select,
  SelectItem,
} from "@nextui-org/react";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import logo from "../../assets/logo.svg";

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

  const handleSubmit = (e: any) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
  };

  // Handler for back button
  const handleBack = () => {
    window.history.back();
  };

  return (
    <div className="w-full md:w-1/2 bg-[#202020] p-6 md:p-12 flex flex-col items-center">
      {/* Back Button */}

      <div className="flex justify-center">
        <div className="w-24">
          <img src={logo} alt="logo" />
        </div>
      </div>
      <div className="max-w-md mx-auto w-full mb-4">
        <Button
          className="mb-4 bg-transparent text-white hover:bg-gray-600"
          onPress={handleBack}
          startContent={<ArrowLeft size={20} />}
        >
          Back to Estimate
        </Button>
      </div>

      <Card className="max-w-md mx-auto w-full shadow-sm bg-[#202020]">
        <CardHeader className="flex justify-center items-center flex-col ">
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
          <form onSubmit={handleSubmit} className="space-y-4">
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
                classNames={{
                  input: "bg-[#333333] text-white",
                  inputWrapper: "bg-[#333333] border-2 border-gray-600",
                }}
                isRequired
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
                isRequired
                classNames={{
                  input: "bg-[#333333] text-white",
                  inputWrapper: "bg-[#333333] border-2 border-gray-600",
                }}
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
                classNames={{
                  trigger: "bg-[#333333] border-2 border-gray-600",
                  value: "text-white",
                }}
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
                classNames={{
                  trigger: "bg-[#333333] border-2 border-gray-600",
                  value: "text-white",
                }}
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
                classNames={{
                  trigger: "bg-[#333333] border-2 border-gray-600",
                  value: "text-white",
                }}
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
                classNames={{
                  input: "bg-[#333333] text-white",
                  inputWrapper: "bg-[#333333] border-2 border-gray-600",
                }}
              />
            </div>

            <Button type="submit" className="w-full bg-[#E9423A] text-white">
              Submit
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}

export default ContactForm;
