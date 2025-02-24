// import {
//   Button,
//   Card,
//   CardBody,
//   CardHeader,
//   Input,
//   Select,
//   SelectItem,
// } from "@nextui-org/react";
// import { useState } from "react";
// import { useNavigate } from "react-router-dom";

// function ElectricityEstimateForm() {
//   const [formData, setFormData] = useState({
//     kwh: "",
//     city: "Dubai",
//     utility: "",
//   });

//   const cities = [
//     { label: "Mumbai", value: "Mumbai" },
//     { label: "Chennai", value: "Chennai" },
//     { label: "Delhi", value: "Delhi" },
//   ];

//   const navigate = useNavigate();

//   // const handleEstimate = () => {
//   //   navigate("/by-panels");
//   // };

//   const handleEstimate = () => {
//     // if (!formData.kwh) return; // Ensure input is provided
//     navigate(`/by-panels?kwh=${formData.kwh}`);
//   };

//   return (
//     <div className="w-full md:w-1/2 bg-[#202020] p-6 md:p-12 flex flex-col justify-center">
//       <Card className="max-w-md mx-auto w-full shadow-sm bg-[#202020] ">
//         <CardHeader>
//           <div className="mt-3 p-4 bg-[#202020] rounded-lg shadow-inner">
//             <h2 className="text-3xl font-bold text-center text-white mb-2 font-electrolize">
//               Electricity Estimate
//             </h2>
//             <p className="text-sm text-white text-center font-inter">
//               Get an estimate of how many panels you need to offset your
//               electricity bill
//             </p>
//           </div>
//         </CardHeader>
//         <CardBody className="p-6">
//           <div className="space-y-4">
//             <div className="relative">
//               <Input

//                 type="number"
//                 size="lg"
//                 placeholder="Enter usage in kWh"
//                 value={formData.kwh}
//                 variant="faded"
//                 endContent={<div className="text-default-400">kWh</div>}
//                 onChange={(e) =>
//                   setFormData({ ...formData, kwh: e.target.value })
//                 }
//               />
//             </div>

//             <div className="relative">
//               <Select
//                 placeholder="Select a city"
//                 variant="faded"
//                 size="lg"
//                 selectedKeys={[formData.city]}
//                 onChange={(e) =>
//                   setFormData({ ...formData, city: e.target.value })
//                 }
//               >
//                 {cities.map((city) => (
//                   <SelectItem key={city.value} value={city.value}>
//                     {city.label}
//                   </SelectItem>
//                 ))}
//               </Select>
//             </div>

//             <div className="relative">
//               <Input
//                 type="text"
//                 size="lg"
//                 placeholder="Enter utility provider name"
//                 variant="faded"
//                 value={formData.utility}
//                 onChange={(e) =>
//                   setFormData({ ...formData, utility: e.target.value })
//                 }
//               />
//             </div>
//             <Button
//               className="w-full bg-[#E9423A] text-white"
//               onPress={handleEstimate}
//             >
//               Calculate Estimate
//             </Button>

//             <div className="mt-6 text-center">
//               <p className="text-sm text-gray-600 font-inter">
//                 Want to skip the estimate?{" "}
//                 <a
//                   href="#"
//                   onClick={() => navigate("/contact")}
//                   className="text-red-500 hover:underline"
//                 >
//                   Browse panels directly
//                 </a>
//               </p>
//             </div>
//           </div>
//         </CardBody>
//       </Card>
//     </div>
//   );
// }

// export default ElectricityEstimateForm;

// import {
//   Button,
//   Card,
//   CardBody,
//   CardHeader,
//   Input,
//   Select,
//   SelectItem,
// } from "@nextui-org/react";
// import { useState } from "react";
// import { useNavigate } from "react-router-dom";

// function ElectricityEstimateForm() {
//   const [formData, setFormData] = useState({
//     kwh: "",
//     city: "Dubai",
//     utility: "",
//   });

//   const cities = [
//     { label: "Mumbai", value: "Mumbai" },
//     { label: "Chennai", value: "Chennai" },
//     { label: "Delhi", value: "Delhi" },
//   ];

//   const navigate = useNavigate();

//   const handleEstimate = () => {
//     navigate(`/by-panels?kwh=${formData.kwh}`);
//   };

//   return (
//     <div className="w-full md:w-1/2 bg-[#202020] p-6 md:p-12 flex flex-col justify-center">
//       <Card className="max-w-md mx-auto w-full shadow-sm bg-[#202020]">
//         <CardHeader>
//           <div className="mt-3 p-4 bg-[#202020] rounded-lg shadow-inner">
//             <h2 className="text-3xl font-bold text-center text-white mb-2 font-electrolize">
//               Electricity Estimate
//             </h2>
//             <p className="text-sm text-white text-center font-inter">
//               Get an estimate of how many panels you need to offset your
//               electricity bill
//             </p>
//           </div>
//         </CardHeader>
//         <CardBody className="p-6">
//           <div className="space-y-4">
//             <div className="relative">
//               <Input
//                 type="number"
//                 size="lg"
//                 placeholder="Enter usage in kWh"
//                 value={formData.kwh}
//                 variant="bordered"
//                 classNames={{
//                   input: "bg-[#333333] text-white",
//                   inputWrapper: "bg-[#333333] border-2 border-gray-600"
//                 }}
//                 endContent={<div className="text-default-400">kWh</div>}
//                 onChange={(e) =>
//                   setFormData({ ...formData, kwh: e.target.value })
//                 }
//               />
//             </div>

//             <div className="relative">
//               <Select
//                 placeholder="Select a city"
//                 variant="bordered"
//                 size="lg"
//                 selectedKeys={[formData.city]}
//                 classNames={{
//                   trigger: "bg-[#333333] border-2 border-gray-600",
//                   value: "text-white"
//                 }}
//                 onChange={(e) =>
//                   setFormData({ ...formData, city: e.target.value })
//                 }
//               >
//                 {cities.map((city) => (
//                   <SelectItem key={city.value} value={city.value}>
//                     {city.label}
//                   </SelectItem>
//                 ))}
//               </Select>
//             </div>

//             <div className="relative">
//               <Input
//                 type="text"
//                 size="lg"
//                 placeholder="Enter utility provider name"
//                 variant="bordered"
//                 value={formData.utility}
//                 classNames={{
//                   input: "bg-[#333333] text-white",
//                   inputWrapper: "bg-[#333333] border-2 border-gray-600"
//                 }}
//                 onChange={(e) =>
//                   setFormData({ ...formData, utility: e.target.value })
//                 }
//               />
//             </div>
//             <Button
//               className="w-full bg-[#E9423A] text-white"
//               onPress={handleEstimate}
//             >
//               Calculate Estimate
//             </Button>

//             <div className="mt-6 text-center">
//               <p className="text-sm text-white font-inter">
//                 Want to skip the estimate?{" "}
//                 <a
//                   href="#"
//                   onClick={() => navigate("/contact")}
//                   className="text-red-500 hover:underline"
//                 >
//                   Browse panels directly
//                 </a>
//               </p>
//             </div>
//           </div>
//         </CardBody>
//       </Card>
//     </div>
//   );
// }

// export default ElectricityEstimateForm;

import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Select,
  SelectItem,
} from "@nextui-org/react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/logo.svg";

function ElectricityEstimateForm() {
  const [formData, setFormData] = useState({
    kwh: "",
    city: "Dubai",
    utility: "",
  });

  const cities = [
    { label: "Mumbai", value: "Mumbai" },
    { label: "Chennai", value: "Chennai" },
    { label: "Delhi", value: "Delhi" },
  ];

  const navigate = useNavigate();

  const handleEstimate = () => {
    navigate(`/by-panels?kwh=${formData.kwh}`);
  };

  return (
    <div className="w-full md:w-1/2 bg-[#202020] p-6 md:p-12 flex flex-col items-center">
      {/* Logo Section - Now properly centered */}
      <div className="flex justify-center">
        <div className="w-24">
          <img src={logo} alt="logo" />
        </div>
      </div>

      <Card className="max-w-md w-full shadow-sm bg-[#202020]">
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
          <div className="space-y-4">
            <div className="relative font-electrolize">
              <Input
                type="number"
                size="lg"
                placeholder="Enter usage in kWh"
                value={formData.kwh}
                variant="bordered"
                classNames={{
                  input: "bg-[#333333] text-white placeholder:text-[#E2E2E2]",
                  inputWrapper: "bg-[#333333] border-2 border-[#E2E2E2]",
                }}
                endContent={<div className="text-default-400">kWh</div>}
                onChange={(e) =>
                  setFormData({ ...formData, kwh: e.target.value })
                }
              />
            </div>

            <div className="relative font-electrolize">
              <Select
                placeholder="Select a city"
                variant="bordered"
                size="lg"
                selectedKeys={[formData.city]}
                classNames={{
                  trigger: "bg-[#333333] border-2 border-[#E2E2E2] text-white", // Ensure text stays white
                  value: "text-white !text-white", // Force selected value to stay white
                  popoverContent: "bg-[#333333] text-[#E2E2E2]", // Dropdown styling
                }}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
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
                classNames={{
                  input: "bg-[#333333] text-white placeholder:text-[#E2E2E2]",
                  inputWrapper: "bg-[#333333] border-2 border-[#E2E2E2]",
                }}
                onChange={(e) =>
                  setFormData({ ...formData, utility: e.target.value })
                }
              />
            </div>
            <Button
              className="w-full bg-[#E9423A] text-white"
              onPress={handleEstimate}
            >
              Calculate Estimate
            </Button>

            <div className="mt-6 text-center">
              <p className="text-sm text-white font-inter">
                Want to skip the estimate?{" "}
                <a
                  href="#"
                  onClick={() => navigate("/contact")}
                  className="text-red-500 hover:underline"
                >
                  Browse panels directly
                </a>
              </p>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

export default ElectricityEstimateForm;
