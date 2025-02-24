// // import { Button, Card, CardBody, CardHeader, Input } from "@nextui-org/react";
// // import { useState } from "react";
// // import { useNavigate } from "react-router-dom";
// // import { ArrowLeft } from "lucide-react";

// // function ByPanelsForm() {
// //   const [panelCount, setPanelCount] = useState("");
// //   const [estimatedCost, setEstimatedCost] = useState<number | null>(null);
// //   const navigate = useNavigate();

// //   // const calculateCost = () => {
// //   //   const costPerPanel = 525;
// //   //   const totalCost = parseFloat(panelCount) * costPerPanel;
// //   //   setEstimatedCost(totalCost);
// //   // };

// //   const handleBack = () => {
// //     navigate(-1);
// //   };

// //   return (
// //     <div className="w-full md:w-1/2 bg-slate-50 p-6 md:p-12 flex flex-col justify-center">
// //       <div className="max-w-md mx-auto w-full">
// //         <Button
// //           className="mb-4 bg-transparent text-gray-600 hover:bg-gray-100"
// //           onPress={handleBack}
// //           startContent={<ArrowLeft size={20} />}
// //         >
// //           Back to Estimate
// //         </Button>

// //         <Card className="shadow-sm">
// //           <CardHeader>
// //             <div className="mt-3 p-4 bg-gray-50 rounded-lg shadow-inner">
// //               <h2 className="text-3xl font-bold text-center text-gray-800 mb-2 font-electrolize">
// //                 Electricity Estimate
// //               </h2>
// //               <p className="text-sm text-gray-600 text-center font-inter">
// //                 Based on your current usage and your city and utility service,
// //                 you need
// //               </p>
// //             </div>
// //           </CardHeader>
// //           <CardBody className="p-6">
// //             <div className="space-y-4">
// //               <div className="flex gap-4">
// //                 <div className="flex-1">
// //                   <Input
// //                     type="number"
// //                     size="lg"
// //                     placeholder="Number of Panels"
// //                     value={panelCount}
// //                     variant="faded"
// //                     onChange={(e) => setPanelCount(e.target.value)}
// //                     endContent={<div className="text-default-400">Panels</div>}
// //                   />
// //                 </div>
// //                 <div className="flex-1">
// //                   <Input
// //                     type="text"
// //                     size="lg"
// //                     placeholder="Estimated Cost"
// //                     value={estimatedCost ? `$${estimatedCost}` : ""}
// //                     variant="faded"
// //                     isReadOnly
// //                     startContent={<div className="text-default-400">$</div>}
// //                   />
// //                 </div>
// //               </div>

// //               <Button
// //                 className="w-full bg-[#E9423A] text-white"
// //                 // onPress={calculateCost}
// //                 onPress={() => navigate("/contact")}
// //               >
// //                 Buy Panels
// //               </Button>

// //               {/* <div className="mt-6">
// //                 <div className="bg-gray-100 p-4 rounded-lg">
// //                   <h3 className="font-semibold mb-2">Calculation Details:</h3>
// //                   <p className="text-sm text-gray-600">
// //                     • 3.75 kWHr generated per kW per day of panel
// //                     <br />
// //                     • 80% distributed to owners
// //                     <br />• Cost: $525 per 1kW capacity
// //                   </p>
// //                 </div>
// //               </div> */}
// //             </div>
// //           </CardBody>
// //         </Card>
// //       </div>
// //     </div>
// //   );
// // }

// // export default ByPanelsForm;


import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button, Card, CardBody, CardHeader, Input } from "@nextui-org/react";
import { ArrowLeft } from "lucide-react";
import logo from "../../assets/logo.svg";

function ByPanelsForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const [panelCount, setPanelCount] = useState(0);
  const [estimatedCost, setEstimatedCost] = useState(0);

  useEffect(() => {
    // Extract kWh from query params
    const queryParams = new URLSearchParams(location.search);
    const kwhInput = parseFloat(queryParams.get("kwh") || "0");

    if (kwhInput > 0) {
      // Calculation: Panels needed = kWh per day / 3
      const requiredPanels = Math.ceil(kwhInput / 3); // Round up
      setPanelCount(requiredPanels);

      // Calculation: Cost = Panels × $525
      const totalCost = requiredPanels * 525;
      setEstimatedCost(totalCost);
    }
  }, [location.search]);

  return (
    <div className="w-full md:w-1/2 bg-[#202020] p-6 md:p-12 flex flex-col justify-center">
      <div className="flex justify-center">
        <div className="w-24">
          <img src={logo} alt="logo" />
        </div>
      </div>

      <div className="max-w-md mx-auto w-full">
        <Button
          className="mb-4 bg-transparent text-white hover:bg-gray-600"
          onPress={() => navigate(-1)}
          startContent={<ArrowLeft size={20} />}
        >
          Back to Estimate
        </Button>

        <Card className="shadow-sm bg-[#202020]">
          <CardHeader>
            <div className="mt-3 p-4 bg-[#202020] rounded-lg shadow-inner">
              <h2 className="text-3xl font-bold text-center text-white mb-2 font-electrolize">
                Electricity Estimate
              </h2>
              <p className="text-sm text-white text-center font-inter">
                Based on your current usage and your city and utility service,
                you need
              </p>
            </div>
          </CardHeader>
          <CardBody className="p-6">
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1 font-electrolize">
                  <Input
                    type="number"
                    size="lg"
                    placeholder="Number of Panels"
                    value={panelCount.toString()}
                    variant="faded"
                    isReadOnly
                    endContent={<div className="text-default-400">Panels</div>}
                    classNames={{
                      input: "bg-[#333333] text-white placeholder:text-[#E2E2E2]",
                      inputWrapper: "bg-[#333333] border-2 border-[#E2E2E2]",
                    }}
                  />
                </div>
                <div className="flex-1">
                  <Input
                    type="text"
                    size="lg"
                    placeholder="Estimated Cost"
                    value={estimatedCost ? `$${estimatedCost}` : ""}
                    variant="faded"
                    isReadOnly
                    startContent={<div className="text-default-400">$</div>}
                    classNames={{
                      input: "bg-[#333333] text-white placeholder:text-[#E2E2E2]",
                      inputWrapper: "bg-[#333333] border-2 border-[#E2E2E2]",
                    }}
                  />
                </div>
              </div>

              <Button
                className="w-full bg-[#E9423A] text-white"
                onPress={() => navigate("/contact")}
              >
                Buy Panels
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

export default ByPanelsForm;
