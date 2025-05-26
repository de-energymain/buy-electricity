import { useState } from "react";
import { 
  Card, 
  CardBody, 
  Input, 
  Accordion, 
  AccordionItem 
} from "@nextui-org/react";
import { 
  Search, 
  Mail, 
  MessageCircle, 
  FileText, 
  ChevronRight, 
  PlayCircle
} from "lucide-react";
import DashboardTemplate from "../../components/DashboardTemplate";

const HelpPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // FAQ data
  const faqs = [
    {
      question: "How do solar panels work?",
      answer: "Solar panels work by allowing photons, or particles of light, to knock electrons free from atoms, generating a flow of electricity. Solar panels are composed of many small units called photovoltaic cells, linked together. Each photovoltaic cell is essentially a sandwich made up of two slices of semi-conducting material, usually silicon."
    },
    {
      question: "How do I earn NRG tokens?",
      answer: "You earn NRG tokens based on the energy production of solar panels you own. These tokens are distributed automatically to your wallet on a daily basis, proportional to the amount of clean energy your panels generate."
    },
    {
      question: "Can I sell my panels?",
      answer: "Yes, you can sell your panels on our marketplace. Navigate to the Panels section in your Dashboard, select the panels you want to sell, and click on 'List for Sale'. You can set your desired price, and once a buyer purchases them, the transfer will be handled automatically."
    },
    {
      question: "How is panel efficiency calculated?",
      answer: "Panel efficiency is calculated by comparing the actual energy output of your panels with their theoretical maximum output under ideal conditions. Factors like weather, panel orientation, cleanliness, and age all affect the efficiency rating."
    },
    {
      question: "What happens if my panels need maintenance?",
      answer: "Our system continuously monitors panel performance. If a maintenance issue is detected, it will be flagged in your dashboard. Our on-site team will perform the necessary maintenance, and you'll be notified when it's complete. There's no additional cost as maintenance is included in the initial purchase."
    },
    {
      question: "Can I track my panel performance?",
      answer: "Yes, you can track your panel performance in real-time through the Analytics section of your dashboard. We provide data on daily energy production, efficiency rates, earnings, and more."
    }
  ];
  
  // Filter FAQs based on search query
  const filteredFaqs = searchQuery.trim()
    ? faqs.filter(faq => 
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : faqs;
  
  return (
    <DashboardTemplate title="Help & Support" activePage="help">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Help</h1>
            <p className="text-gray-400">Need help? Check our FAQs, contact Support, or find Developer Docs and Tutorials.</p>
          </div>         
        </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card className="bg-[#1A1A1A] border-none mb-6">
            <CardBody className="p-6">
              <h3 className="text-xl text-white font-medium mb-4">Frequently Asked Questions</h3>
              
              <div className="mb-6">
                <Input
                  placeholder="Search for help..."
                  startContent={<Search size={18} />}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  classNames={{
                    base: "bg-[#1A1A1A]",
                    inputWrapper: "bg-[#2A1A1A] border-1 border-gray-700 hover:border-white focus-within:border-[#E9423A]",
                    input: "text-white placeholder:text-gray-400"
                  }}
                />
              </div>
              
              {filteredFaqs.length > 0 ? (
                <Accordion variant="splitted">
                  {filteredFaqs.map((faq, index) => (
                    <AccordionItem 
                      key={index} 
                      title={faq.question}
                      classNames={{
                        base: "bg-[#2A1A1A] mb-2",
                        title: "text-white",
                        trigger: "px-4 py-2",
                        content: "text-gray-300 px-4"
                      }}
                    >
                      {faq.answer}
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <div className="text-center py-10 bg-[#2A1A1A] rounded-lg">
                  <div className="text-gray-400">No results found for "{searchQuery}"</div>
                  <div className="text-sm text-gray-500 mt-2">Try different keywords or contact support</div>
                </div>
              )}
            </CardBody>
          </Card>
          
          <Card className="bg-[#1A1A1A] border-none">
            <CardBody className="p-6">
              <h3 className="text-xl text-white font-medium mb-4">Video Tutorials</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-[#2A1A1A] border-none">
                  <div className="h-40 bg-[#3A1A1A] flex items-center justify-center relative">
                    <div className="absolute inset-0 bg-black opacity-50 flex items-center justify-center">
                      <PlayCircle size={48} className="text-white opacity-80 mb-4" />
                    </div>
                    <div className="text-center text-white mt-20">Getting Started Tutorial</div>
                  </div>
                  <CardBody className="p-4">
                    <h4 className="font-medium text-white">Introduction to Solar Panels</h4>
                    <div className="text-xs text-gray-400 mt-1">3:45 • Beginner</div>
                  </CardBody>
                </Card>
                
                <Card className="bg-[#2A1A1A] border-none">
                  <div className="h-40 bg-[#3A1A1A] flex items-center justify-center relative">
                    <div className="absolute inset-0 bg-black opacity-50 flex items-center justify-center">
                      <PlayCircle size={48} className="text-white opacity-80 mb-4" />
                    </div>
                    <div className="text-center text-white mt-20">Dashboard Tutorial</div>
                  </div>
                  <CardBody className="p-4">
                    <h4 className="font-medium text-white">Understanding Your Dashboard</h4>
                    <div className="text-xs text-gray-400 mt-1">5:12 • Beginner</div>
                  </CardBody>
                </Card>
                
                <Card className="bg-[#2A1A1A] border-none">
                <div className="h-40 bg-[#3A1A1A] flex items-center justify-center relative">
                    <div className="absolute inset-0 bg-black opacity-50 flex items-center justify-center">
                      <PlayCircle size={48} className="text-white opacity-80 mb-4" />
                    </div>
                    <div className="text-center text-white mt-20">Analytics Tutorial</div>
                  </div>
                  <CardBody className="p-4">
                    <h4 className="font-medium text-white">Analyzing Your Performance</h4>
                    <div className="text-xs text-gray-400 mt-1">7:23 • Intermediate</div>
                  </CardBody>
                </Card>
                
                <Card className="bg-[#2A1A1A] border-none">
                  <div className="h-40 bg-[#3A1A1A] flex items-center justify-center relative">
                    <div className="absolute inset-0 bg-black opacity-50 flex items-center justify-center">
                      <PlayCircle size={48} className="text-white opacity-80 mb-4" />
                    </div>
                    <div className="text-center text-white mt-20">NRG Token Tutorial</div>
                  </div>
                  <CardBody className="p-4">
                    <h4 className="font-medium text-white">Understanding NRG Tokens</h4>
                    <div className="text-xs text-gray-400 mt-1">6:48 • Intermediate</div>
                  </CardBody>
                </Card>
              </div>
            </CardBody>
          </Card>
        </div>
        
        <div className="md:col-span-1">
          <Card className="bg-[#1A1A1A] border-none mb-6">
            <CardBody className="p-6">
              <h3 className="text-xl text-white font-medium mb-4">Contact Support</h3>
              
              <div className="space-y-4">
                <div className="bg-[#2A1A1A] p-4 rounded-lg flex items-center cursor-pointer hover:bg-[#3A1A1A] transition-colors">
                  <div className="w-10 h-10 rounded-full bg-[#3A1A1A] flex items-center justify-center text-[#E9423A] mr-3">
                    <Mail size={18} />
                  </div>
                  <div>
                    <div className="font-medium text-white">Email Support</div>
                    <div className="text-xs text-gray-400">Response within 24 hours</div>
                  </div>
                  <ChevronRight size={16} className="ml-auto text-gray-400" />
                </div>
                
                <div className="bg-[#2A1A1A] p-4 rounded-lg flex items-center cursor-pointer hover:bg-[#3A1A1A] transition-colors">
                  <div className="w-10 h-10 rounded-full bg-[#3A1A1A] flex items-center justify-center text-[#E9423A] mr-3">
                    <MessageCircle size={18} />
                  </div>
                  <div>
                    <div className="font-medium text-white">Live Chat</div>
                    <div className="text-xs text-gray-400">Available 9am-5pm ET</div>
                  </div>
                  <ChevronRight size={16} className="ml-auto text-gray-400" />
                </div>
              </div>
            </CardBody>
          </Card>
          
          <Card className="bg-[#1A1A1A] border-none">
            <CardBody className="p-6">
              <h3 className="text-xl text-white font-medium mb-4">Documentation</h3>
              
              <div className="space-y-4">
                <div className="bg-[#2A1A1A] p-4 rounded-lg flex items-center cursor-pointer hover:bg-[#3A1A1A] transition-colors">
                  <div className="w-10 h-10 rounded-full bg-[#3A1A1A] flex items-center justify-center text-[#E9423A] mr-3">
                    <FileText size={18} />
                  </div>
                  <div>
                    <div className="font-medium text-white">User Guide</div>
                    <div className="text-xs text-gray-400">Complete platform documentation</div>
                  </div>
                  <ChevronRight size={16} className="ml-auto text-gray-400" />
                </div>
                
                <div className="bg-[#2A1A1A] p-4 rounded-lg flex items-center cursor-pointer hover:bg-[#3A1A1A] transition-colors">
                  <div className="w-10 h-10 rounded-full bg-[#3A1A1A] flex items-center justify-center text-[#E9423A] mr-3">
                    <FileText size={18} />
                  </div>
                  <div>
                    <div className="font-medium text-white">API Documentation</div>
                    <div className="text-xs text-gray-400">For developers</div>
                  </div>
                  <ChevronRight size={16} className="ml-auto text-gray-400" />
                </div>
                
                <div className="bg-[#2A1A1A] p-4 rounded-lg flex items-center cursor-pointer hover:bg-[#3A1A1A] transition-colors">
                  <div className="w-10 h-10 rounded-full bg-[#3A1A1A] flex items-center justify-center text-[#E9423A] mr-3">
                    <FileText size={18} />
                  </div>
                  <div>
                    <div className="font-medium text-white">Legal Documents</div>
                    <div className="text-xs text-gray-400">Terms, privacy, and more</div>
                  </div>
                  <ChevronRight size={16} className="ml-auto text-gray-400" />
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
      </div>
    </DashboardTemplate>
  );
};

export default HelpPage;