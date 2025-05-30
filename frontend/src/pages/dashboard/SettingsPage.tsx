import { useState } from "react";
import { Card, CardBody, Switch, Input, Button, Divider, Tabs, Tab } from "@nextui-org/react";
import { Bell, Lock, Globe, User, Shield, Check, Eye, EyeOff } from "lucide-react";
import DashboardTemplate from "../../components/DashboardTemplate";
import { inputClasses } from "../../shared/styles";

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("account");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  
  return (
    <DashboardTemplate title="Settings" activePage="settings">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
            <p className="text-gray-400">Effortlessly configure, customise and personalise your dashboard.</p>
          </div>         
        </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card className="bg-[#1A1A1A] border-none h-min sticky top-6">
            <CardBody className="p-0 text-white">
              <div className="p-4 border-b border-gray-800">
                <h3 className="text-lg font-medium">Settings</h3>
              </div>
              <div className="p-0">
                <Button 
                  className={`w-full justify-start rounded-none p-4 text-white ${activeTab === 'account' ? 'bg-[#2A1A1A] border-l-4 border-[#E9423A]' : 'bg-transparent hover:bg-[#2A1A1A]'}`}
                  onPress={() => setActiveTab("account")}
                  startContent={<User size={16} />}
                >
                  Account
                </Button>
                <Button 
                  className={`w-full justify-start rounded-none p-4 text-white ${activeTab === 'notifications' ? 'bg-[#2A1A1A] border-l-4 border-[#E9423A]' : 'bg-transparent hover:bg-[#2A1A1A]'}`}
                  onPress={() => setActiveTab("notifications")}
                  startContent={<Bell size={16} />}
                >
                  Notifications
                </Button>
                <Button 
                  className={`hidden w-full justify-start rounded-none p-4 text-white ${activeTab === 'security' ? 'bg-[#2A1A1A] border-l-4 border-[#E9423A]' : 'bg-transparent hover:bg-[#2A1A1A]'}`}
                  onPress={() => setActiveTab("security")}
                  startContent={<Lock size={16} />}
                >
                  Security
                </Button>
                <Button 
                  className={`hidden w-full justify-start rounded-none p-4 text-white ${activeTab === 'language' ? 'bg-[#2A1A1A] border-l-4 border-[#E9423A]' : 'bg-transparent hover:bg-[#2A1A1A]'}`}
                  onPress={() => setActiveTab("language")}
                  startContent={<Globe size={16} />}
                >
                  Language
                </Button>
                <Button 
                  className={`hidden w-full justify-start rounded-none p-4 text-white ${activeTab === 'privacy' ? 'bg-[#2A1A1A] border-l-4 border-[#E9423A]' : 'bg-transparent hover:bg-[#2A1A1A]'}`}
                  onPress={() => setActiveTab("privacy")}
                  startContent={<Shield size={16} />}
                >
                  Privacy
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
        
        <div className="md:col-span-2">
          {/* Account Tab */}
          {activeTab === "account" && (
            <Card className="bg-[#1A1A1A] border-none">
              <CardBody className="p-6">
                <h3 className="text-xl font-medium mb-4 text-white">Account Information</h3>
                
                <div className="space-y-4 mb-6">
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Name</div>
                    <Input
                      defaultValue="John Doe"
                      classNames={inputClasses}
                    />
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Email</div>
                    <Input
                      defaultValue="john.doe@example.com"
                      classNames={inputClasses}
                    />
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Username</div>
                    <Input
                      defaultValue="johndoe"
                      classNames={inputClasses}
                    />
                  </div>
                  
                  <Button className="bg-[#E9423A] text-white">
                    Save Changes
                  </Button>
                </div>
                
                <Divider className="hidden my-6 bg-gray-800" />
                
                <h3 className=" hidden text-xl font-medium mb-4 text-white">Wallet Information</h3>
                
                <div className="hidden p-4 bg-[#2A1A1A] rounded-lg mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-400">Connected Wallet</div>
                      <div className="font-medium text-slate-500">Phantom Wallet</div>
                    </div>
                    <Button 
                      className="text-white bg-[#3A1A1A] border border-[#E9423A]"
                      size="sm"
                    >
                      Disconnect
                    </Button>
                  </div>
                </div>
                
                <div className="hidden p-4 bg-[#2A1A1A] rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-400">Google Account</div>
                      <div className="font-medium text-slate-500">john.doe@gmail.com</div>
                    </div>
                    <Button 
                      className="text-white bg-[#3A1A1A] border border-[#E9423A]"
                      size="sm"
                    >
                      Disconnect
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}
          
          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <Card className="bg-[#1A1A1A] border-none">
              <CardBody className="p-6">
                <h3 className="text-xl font-medium mb-4 text-white">Notification Preferences</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-[#2A1A1A] rounded-lg">
                    <div>
                      <div className="font-medium text-white">Email Notifications</div>
                      <div className="text-sm text-gray-400">Receive notifications via email</div>
                    </div>
                    <Switch defaultSelected color="danger" />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-[#2A1A1A] rounded-lg">
                    <div>
                      <div className="font-medium text-white">Transaction Updates</div>
                      <div className="text-sm text-gray-400">Get notified about transaction status changes</div>
                    </div>
                    <Switch defaultSelected color="danger" />
                  </div>
                  
                  <div className="hidden flex items-center justify-between p-4 bg-[#2A1A1A] rounded-lg">
                    <div>
                      <div className="font-medium text-white">Performance Alerts</div>
                      <div className="text-sm text-gray-400">Receive alerts about panel performance</div>
                    </div>
                    <Switch defaultSelected color="danger" />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-[#2A1A1A] rounded-lg">
                    <div>
                      <div className="font-medium text-white">Marketing Communications</div>
                      <div className="text-sm text-gray-400">Receive news, offers and updates</div>
                    </div>
                    <Switch color="danger" />
                  </div>
                  
                  <Button className="bg-[#E9423A] text-white">
                    Save Preferences
                  </Button>
                </div>
              </CardBody>
            </Card>
          )}
          
          {/* Security Tab */}
          {activeTab === "security" && (
            <Card className="bg-[#1A1A1A] border-none">
              <CardBody className="p-6">
                <h3 className="text-xl font-medium mb-4 text-white">Security Settings</h3>
                
                <div className="space-y-4 mb-6">
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Current Password</div>
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter current password"
                      classNames={{
                        base: "bg-[#1A1A1A]",
                        inputWrapper: "bg-[#2A1A1A] border-1 border-gray-700 hover:border-white focus-within:border-[#E9423A]",
                        input: "text-white"
                      }}
                      endContent={
                        <Button
                          isIconOnly
                          className="bg-transparent"
                          onPress={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff size={16} className="text-gray-400" /> : <Eye size={16} className="text-gray-400" />}
                        </Button>
                      }
                    />
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-400 mb-1">New Password</div>
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      classNames={{
                        base: "bg-[#1A1A1A]",
                        inputWrapper: "bg-[#2A1A1A] border-1 border-gray-700 hover:border-white focus-within:border-[#E9423A]",
                        input: "text-white"
                      }}
                      endContent={
                        <Button
                          isIconOnly
                          className="bg-transparent"
                          onPress={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff size={16} className="text-gray-400" /> : <Eye size={16} className="text-gray-400" />}
                        </Button>
                      }
                    />
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Confirm New Password</div>
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      classNames={{
                        base: "bg-[#1A1A1A]",
                        inputWrapper: "bg-[#2A1A1A] border-1 border-gray-700 hover:border-white focus-within:border-[#E9423A]",
                        input: "text-white"
                      }}
                      endContent={
                        <Button
                          isIconOnly
                          className="bg-transparent"
                          onPress={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff size={16} className="text-gray-400" /> : <Eye size={16} className="text-gray-400" />}
                        </Button>
                      }
                    />
                  </div>
                  
                  <Button className="bg-[#E9423A] text-white">
                    Update Password
                  </Button>
                </div>
                
                <Divider className="my-6 bg-gray-800" />
                
                <h3 className="text-xl font-medium mb-4 text-white">Two-Factor Authentication</h3>
                
                <div className="p-4 bg-[#2A1A1A] rounded-lg mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-white">2FA Status</div>
                      <div className="text-sm text-gray-400">Add an extra layer of security</div>
                    </div>
                    <Switch color="danger" />
                  </div>
                </div>
              </CardBody>
            </Card>
          )}
          
          {/* Language Tab */}
          {activeTab === "language" && (
            <Card className="bg-[#1A1A1A] border-none">
              <CardBody className="p-6">
                <h3 className="text-xl font-medium mb-4 text-white">Language Settings</h3>
                
                <div className="space-y-4">
                  <Tabs 
                    color="danger"
                    variant="bordered"
                  >
                    <Tab key="english" title="English" />
                    <Tab key="hindi" title="Hindi" />
                    <Tab key="spanish" title="Spanish" />
                    <Tab key="french" title="French" />
                  </Tabs>
                  
                  <div className="p-4 bg-[#2A1A1A] rounded-lg flex items-center">
                    <Check size={16} className="text-green-500 mr-2" />
                    <div className="text-sm text-gray-400">English is currently selected as your display language</div>
                  </div>
                  
                  <Button className="bg-[#E9423A] text-white">
                    Save Language Preference
                  </Button>
                </div>
              </CardBody>
            </Card>
          )}
          
          {/* Privacy Tab */}
          {activeTab === "privacy" && (
            <Card className="bg-[#1A1A1A] border-none">
              <CardBody className="p-6">
                <h3 className="text-xl font-medium mb-4 text-white">Privacy Settings</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-[#2A1A1A] rounded-lg">
                    <div>
                      <div className="font-medium text-white">Activity Tracking</div>
                      <div className="text-sm text-gray-400">Allow us to track your activity for better recommendations</div>
                    </div>
                    <Switch defaultSelected color="danger" />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-[#2A1A1A] rounded-lg">
                    <div>
                      <div className="font-medium text-white">Data Sharing</div>
                      <div className="text-sm text-gray-400">Share anonymized data to improve our services</div>
                    </div>
                    <Switch defaultSelected color="danger" />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-[#2A1A1A] rounded-lg">
                    <div>
                      <div className="font-medium text-white">Profile Visibility</div>
                      <div className="text-sm text-gray-400">Make your profile visible to other users</div>
                    </div>
                    <Switch color="danger" />
                  </div>
                  
                  <Button className="bg-[#E9423A] text-white">
                    Save Privacy Settings
                  </Button>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
      </div>
    </DashboardTemplate>
  );
};

export default SettingsPage;