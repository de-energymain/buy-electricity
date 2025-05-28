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
            <h1 className="text-3xl font-bold text-white mb-2">Help & Support</h1>
            <p className="text-gray-400">Need help? Check our FAQs, contact Support, or find Developer Docs and Tutorials.</p>
          </div>         
        </div>


        <div className="mb-8">
          <Card className="bg-[#1A1A1A] border-gray-800 border">
            <CardBody className="p-8">
              <h2 className="text-2xl text-white font-semibold mb-6">Frequently Asked Questions</h2>
              
              <div className="mb-8">
                <Input
                  placeholder="Search for help..."
                  startContent={<Search size={20} className="text-gray-400" />}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  size="lg"
                  classNames={{
                    base: "max-w-md",
                    inputWrapper: "bg-[#2A1A1A] border-gray-700 hover:border-gray-600 focus-within:border-[#E9423A] transition-colors duration-200",
                    input: "text-white placeholder:text-gray-500"
                  }}
                />
              </div>
              
              {filteredFaqs.length > 0 ? (
                <Accordion 
                  variant="splitted"
                  className="px-0"
                  itemClasses={{
                    base: "bg-[#2A1A1A] border border-gray-800 mb-3 rounded",
                    title: "text-white font-medium",
                    trigger: "px-6 py-4 transition-colors",
                    content: "text-gray-300 px-6 pb-4 leading-relaxed"
                  }}
                >
                  {filteredFaqs.map((faq, index) => (
                    <AccordionItem 
                      key={index} 
                      title={faq.question}
                    >
                      {faq.answer}
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <div className="text-center py-12 bg-[#2A1A1A] rounded-xl border border-gray-800">
                  <Search size={48} className="mx-auto text-gray-600 mb-4" />
                  <div className="text-gray-400 text-lg font-medium mb-2">No results found for "{searchQuery}"</div>
                  <div className="text-gray-500">Try different keywords or contact our support team</div>
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="mb-8">
          <Card className="bg-[#1A1A1A] border-gray-800 border">
            <CardBody className="p-8">
              <h2 className="text-2xl text-white font-semibold mb-6">Video Tutorials</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-[#2A1A1A] border-gray-800 border hover:border-gray-700 transition-colors cursor-pointer group">
                  <div className="relative h-48 bg-gradient-to-br from-[#3A1A1A] to-[#2A1A1A] overflow-hidden">
                    <div className="absolute inset-0 bg-black/60 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-[#E9423A] rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                          <PlayCircle size={32} className="text-white" />
                        </div>
                        <div className="text-white font-medium">Getting Started</div>
                      </div>
                    </div>
                  </div>
                  <CardBody className="p-4">
                    <h4 className="font-semibold text-white mb-1">Introduction to Solar Panels</h4>
                    <div className="text-sm text-gray-400">3:45 • Beginner</div>
                  </CardBody>
                </Card>
                
                <Card className="bg-[#2A1A1A] border-gray-800 border hover:border-gray-700 transition-colors cursor-pointer group">
                  <div className="relative h-48 bg-gradient-to-br from-[#3A1A1A] to-[#2A1A1A] overflow-hidden">
                    <div className="absolute inset-0 bg-black/60 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-[#E9423A] rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                          <PlayCircle size={32} className="text-white" />
                        </div>
                        <div className="text-white font-medium">Dashboard Guide</div>
                      </div>
                    </div>
                  </div>
                  <CardBody className="p-4">
                    <h4 className="font-semibold text-white mb-1">Understanding Your Dashboard</h4>
                    <div className="text-sm text-gray-400">5:12 • Beginner</div>
                  </CardBody>
                </Card>
                
                <Card className="bg-[#2A1A1A] border-gray-800 border hover:border-gray-700 transition-colors cursor-pointer group">
                  <div className="relative h-48 bg-gradient-to-br from-[#3A1A1A] to-[#2A1A1A] overflow-hidden">
                    <div className="absolute inset-0 bg-black/60 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-[#E9423A] rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                          <PlayCircle size={32} className="text-white" />
                        </div>
                        <div className="text-white font-medium">Analytics Deep Dive</div>
                      </div>
                    </div>
                  </div>
                  <CardBody className="p-4">
                    <h4 className="font-semibold text-white mb-1">Analyzing Your Performance</h4>
                    <div className="text-sm text-gray-400">7:23 • Intermediate</div>
                  </CardBody>
                </Card>
                
                <Card className="bg-[#2A1A1A] border-gray-800 border hover:border-gray-700 transition-colors cursor-pointer group">
                  <div className="relative h-48 bg-gradient-to-br from-[#3A1A1A] to-[#2A1A1A] overflow-hidden">
                    <div className="absolute inset-0 bg-black/60 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-[#E9423A] rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                          <PlayCircle size={32} className="text-white" />
                        </div>
                        <div className="text-white font-medium">NRG Tokens</div>
                      </div>
                    </div>
                  </div>
                  <CardBody className="p-4">
                    <h4 className="font-semibold text-white mb-1">Understanding NRG Tokens</h4>
                    <div className="text-sm text-gray-400">6:48 • Intermediate</div>
                  </CardBody>
                </Card>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="bg-[#1A1A1A] border-gray-800 border">
            <CardBody className="p-8">
              <h2 className="text-2xl text-white font-semibold mb-6">Contact Support</h2>
              
              <div className="space-y-4">
                <div className="bg-[#2A1A1A] border border-gray-800 p-6 rounded-xl flex items-center cursor-pointer hover:bg-[#3A2A2A] hover:border-gray-700 transition-all duration-200 group">
                  <div className="w-12 h-12 rounded-xl bg-[#E9423A] flex items-center justify-center mr-4 group-hover:scale-105 transition-transform">
                    <Mail size={20} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-white mb-1">Email Support</div>
                    <div className="text-sm text-gray-400">Response within 24 hours</div>
                  </div>
                  <ChevronRight size={20} className="text-gray-400 group-hover:text-white transition-colors" />
                </div>
                
                <div className="bg-[#2A1A1A] border border-gray-800 p-6 rounded-xl flex items-center cursor-pointer hover:bg-[#3A2A2A] hover:border-gray-700 transition-all duration-200 group">
                  <div className="w-12 h-12 rounded-xl bg-[#E9423A] flex items-center justify-center mr-4 group-hover:scale-105 transition-transform">
                    <MessageCircle size={20} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-white mb-1">Live Chat</div>
                    <div className="text-sm text-gray-400">Available 9am-5pm ET</div>
                  </div>
                  <ChevronRight size={20} className="text-gray-400 group-hover:text-white transition-colors" />
                </div>
              </div>
            </CardBody>
          </Card>
          
          <Card className="bg-[#1A1A1A] border-gray-800 border">
            <CardBody className="p-8">
              <h2 className="text-2xl text-white font-semibold mb-6">Documentation</h2>
              
              <div className="space-y-4">
                <div className="bg-[#2A1A1A] border border-gray-800 p-6 rounded-xl flex items-center cursor-pointer hover:bg-[#3A2A2A] hover:border-gray-700 transition-all duration-200 group">
                  <div className="w-12 h-12 rounded-xl bg-[#E9423A] flex items-center justify-center mr-4 group-hover:scale-105 transition-transform">
                    <FileText size={20} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-white mb-1">User Guide</div>
                    <div className="text-sm text-gray-400">Complete platform documentation</div>
                  </div>
                  <ChevronRight size={20} className="text-gray-400 group-hover:text-white transition-colors" />
                </div>
                
                <div className="bg-[#2A1A1A] border border-gray-800 p-6 rounded-xl flex items-center cursor-pointer hover:bg-[#3A2A2A] hover:border-gray-700 transition-all duration-200 group">
                  <div className="w-12 h-12 rounded-xl bg-[#E9423A] flex items-center justify-center mr-4 group-hover:scale-105 transition-transform">
                    <FileText size={20} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-white mb-1">API Documentation</div>
                    <div className="text-sm text-gray-400">For developers</div>
                  </div>
                  <ChevronRight size={20} className="text-gray-400 group-hover:text-white transition-colors" />
                </div>
                
                <div className="bg-[#2A1A1A] border border-gray-800 p-6 rounded-xl flex items-center cursor-pointer hover:bg-[#3A2A2A] hover:border-gray-700 transition-all duration-200 group">
                  <div className="w-12 h-12 rounded-xl bg-[#E9423A] flex items-center justify-center mr-4 group-hover:scale-105 transition-transform">
                    <FileText size={20} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-white mb-1">Legal Documents</div>
                    <div className="text-sm text-gray-400">Terms, privacy, and more</div>
                  </div>
                  <ChevronRight size={20} className="text-gray-400 group-hover:text-white transition-colors" />
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </DashboardTemplate>
  );
};

export default HelpPage;