import { useEffect, useState } from "react";
import { useWallet } from '@solana/wallet-adapter-react';
import { Card, CardBody, Switch, Input, Button } from "@nextui-org/react";
import { Bell, User, Loader2 } from "lucide-react";
import DashboardTemplate from "../../components/DashboardTemplate";
import { inputClasses } from "../../shared/styles";

interface NotificationPreferences {
  email: boolean;
  push: boolean;
  transactions: boolean;
  marketing: boolean;
}

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("account");
  const { connected, wallet } = useWallet();
  
  // User data states
  const [walletID, setWalletID] = useState<string | null>(null);
  const [email, setEmail] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [originalEmail, setOriginalEmail] = useState<string>('');
  const [originalName, setOriginalName] = useState<string>('');
  
  // Loading and error states
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [updateMessage, setUpdateMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [isLoadingUserData, setIsLoadingUserData] = useState<boolean>(false);
  
  // Notification preferences
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>({
    email: true,
    push: false,
    transactions: true,
    marketing: false
  });
  const [isUpdatingNotifications, setIsUpdatingNotifications] = useState<boolean>(false);

  // Extract wallet ID and user info
  useEffect(() => {
    const session = localStorage.getItem("web3AuthSession");
    if (session) {
      try {
        const data = JSON.parse(session);
        if (data.publicKey) {
          setWalletID(data.publicKey);
        }
        // Don't set name/email from localStorage anymore since we want fresh data from API
      } catch (e) {
        console.error("Error parsing Web3Auth session", e);
      }
    }
    if (connected && wallet) {
      // Handle Solana wallet connection
      const walletPublicKey = (wallet.adapter as { publicKey?: { toString: () => string } }).publicKey?.toString() || "";
      if (walletPublicKey) {
        setWalletID(walletPublicKey);
      }
    }
  }, [connected, wallet]);

  // Fetch user data and notification preferences
  useEffect(() => {
    if (walletID) {
      fetchUserData();
      fetchNotificationPreferences();
    }
  }, [walletID]);

  const fetchUserData = async () => {
    if (!walletID) return;
    
    setIsLoadingUserData(true);
    try {
      // Use the correct endpoint that matches your backend routes
      const response = await fetch(`http://localhost:5000/api/users/${walletID}`);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Fetched user data:', result); // Debug log
        
        if (result.success && result.user) {
          // Use correct field names from your backend response
          const userName = result.user.userName || '';
          const userEmail = result.user.userEmail || '';
          
          setName(userName);
          setEmail(userEmail);
          setOriginalName(userName);
          setOriginalEmail(userEmail);
        }
      } else {
        console.error('Failed to fetch user data:', response.status);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setIsLoadingUserData(false);
    }
  };

  const fetchNotificationPreferences = async () => {
    if (!walletID) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/users/${walletID}/notifications`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setNotificationPrefs(result.notificationPreferences);
        }
      }
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
    }
  };

  const handleUpdateUser = async () => {
    if (!walletID) return;

    // Check if anything changed
    if (name === originalName && email === originalEmail) {
      setUpdateMessage('No changes to save');
      setMessageType('error');
      setTimeout(() => setUpdateMessage(''), 3000);
      return;
    }

    setIsUpdating(true);
    setUpdateMessage('');

    try {
      const response = await fetch(`http://localhost:5000/api/users/${walletID}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
        }),
      });

      const result = await response.json();
      console.log('Update response:', result); // Debug log

      if (response.ok && result.success) {
        setUpdateMessage('Profile updated successfully!');
        setMessageType('success');
        setOriginalName(name);
        setOriginalEmail(email);
        
        // Update localStorage if it's Web3Auth session
        const session = localStorage.getItem("web3AuthSession");
        if (session) {
          try {
            const data = JSON.parse(session);
            if (data.userInfo) {
              data.userInfo.name = name;
              data.userInfo.email = email;
              localStorage.setItem("web3AuthSession", JSON.stringify(data));
            }
          } catch (e) {
            console.error("Error updating session data", e);
          }
        }
        
        // Optionally refresh the data from server to ensure consistency
        setTimeout(() => {
          fetchUserData();
        }, 1000);
        
      } else {
        setUpdateMessage(result.message || 'Failed to update profile');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      setUpdateMessage('Failed to update profile. Please try again.');
      setMessageType('error');
    } finally {
      setIsUpdating(false);
      setTimeout(() => setUpdateMessage(''), 5000);
    }
  };

  const requestNotificationPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      alert('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      alert('Notifications are blocked. Please enable them in your browser settings.');
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  };

  const handleNotificationToggle = async (key: keyof NotificationPreferences, value: boolean) => {
    // If enabling push notifications, request permission first
    if (key === 'push' && value) {
      const hasPermission = await requestNotificationPermission();
      if (!hasPermission) {
        return; // Don't update the state if permission denied
      }
    }

    const updatedPrefs = { ...notificationPrefs, [key]: value };
    setNotificationPrefs(updatedPrefs);

    // Update on server
    if (walletID) {
      setIsUpdatingNotifications(true);
      try {
        const response = await fetch(`http://localhost:5000/api/users/${walletID}/notifications`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedPrefs),
        });

        const result = await response.json();
        if (!response.ok || !result.success) {
          console.error('Failed to update notification preferences');
          // Revert the change
          setNotificationPrefs(notificationPrefs);
        }
      } catch (error) {
        console.error('Error updating notification preferences:', error);
        // Revert the change
        setNotificationPrefs(notificationPrefs);
      } finally {
        setIsUpdatingNotifications(false);
      }
    }
  };

  const hasUnsavedChanges = name !== originalName || email !== originalEmail;

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
                  
                  {updateMessage && (
                    <div className={`p-3 rounded-lg mb-4 ${messageType === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                      {updateMessage}
                    </div>
                  )}
                  
                  {isLoadingUserData ? (
                    <div className="flex items-center justify-center p-8">
                      <Loader2 size={24} className="animate-spin text-[#E9423A] mr-2" />
                      <span className="text-gray-400">Loading user data...</span>
                    </div>
                  ) : (
                    <div className="space-y-4 mb-6">
                      <div>
                        <div className="text-sm text-gray-400 mb-1">Wallet ID</div>
                        <Input
                          value={walletID || ''}
                          isReadOnly
                          classNames={{
                            ...inputClasses,
                            input: "text-gray-500"
                          }}
                        />
                      </div>
                      
                      <div>
                        <div className="text-sm text-gray-400 mb-1">Name</div>
                        <Input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Enter your full name"
                          classNames={inputClasses}
                        />
                      </div>
                      
                      <div>
                        <div className="text-sm text-gray-400 mb-1">Email</div>
                        <Input
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Enter your email address"
                          type="email"
                          classNames={inputClasses}
                        />
                      </div>
                      
                      <Button 
                        className={`${hasUnsavedChanges ? 'bg-[#E9423A]' : 'bg-gray-600'} text-white`}
                        onPress={handleUpdateUser}
                        isDisabled={!hasUnsavedChanges || isUpdating}
                        startContent={isUpdating ? <Loader2 size={16} className="animate-spin" /> : null}
                      >
                        {isUpdating ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  )}
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
                      <Switch 
                        isSelected={notificationPrefs.email}
                        onValueChange={(value) => handleNotificationToggle('email', value)}
                        color="danger" 
                        isDisabled={isUpdatingNotifications}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-[#2A1A1A] rounded-lg">
                      <div>
                        <div className="font-medium text-white">Push Notifications</div>
                        <div className="text-sm text-gray-400">Receive browser push notifications</div>
                      </div>
                      <Switch 
                        isSelected={notificationPrefs.push}
                        onValueChange={(value) => handleNotificationToggle('push', value)}
                        color="danger" 
                        isDisabled={isUpdatingNotifications}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-[#2A1A1A] rounded-lg">
                      <div>
                        <div className="font-medium text-white">Transaction Updates</div>
                        <div className="text-sm text-gray-400">Get notified about transaction status changes</div>
                      </div>
                      <Switch 
                        isSelected={notificationPrefs.transactions}
                        onValueChange={(value) => handleNotificationToggle('transactions', value)}
                        color="danger" 
                        isDisabled={isUpdatingNotifications}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-[#2A1A1A] rounded-lg">
                      <div>
                        <div className="font-medium text-white">Marketing Communications</div>
                        <div className="text-sm text-gray-400">Receive news, offers and updates</div>
                      </div>
                      <Switch 
                        isSelected={notificationPrefs.marketing}
                        onValueChange={(value) => handleNotificationToggle('marketing', value)}
                        color="danger" 
                        isDisabled={isUpdatingNotifications}
                      />
                    </div>
                    
                    {isUpdatingNotifications && (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 size={16} className="animate-spin text-[#E9423A] mr-2" />
                        <span className="text-gray-400">Updating preferences...</span>
                      </div>
                    )}
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