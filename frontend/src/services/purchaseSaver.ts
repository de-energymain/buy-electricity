// Improved savePurchase function with better error handling and logging
const savePurchaseImproved = async (
  paymentMethod: PaymentMethod,
  tokenAmount: number,
  walletName: string,
  signature: string,
  orderDetails: OrderDetails,
  walletAddress: string
): Promise<{ success: boolean; error?: string; dbId?: string }> => {
  
  console.log('🔄 Starting purchase save process', {
    signature,
    walletAddress,
    paymentMethod,
    tokenAmount,
    panels: orderDetails.panels,
    allocationsCount: orderDetails.plantAllocations.length
  });

  // Input validation
  if (!walletAddress || walletAddress === "Unknown") {
    const error = "Invalid wallet address provided";
    console.error('❌ ' + error, { walletAddress });
    return { success: false, error };
  }

  if (!signature) {
    const error = "Transaction signature is required";
    console.error('❌ ' + error);
    return { success: false, error };
  }

  if (!orderDetails.plantAllocations || orderDetails.plantAllocations.length === 0) {
    const error = "Plant allocations are required";
    console.error('❌ ' + error, { orderDetails });
    return { success: false, error };
  }

  try {
    // 1. Update User API (non-critical, can fail without blocking)
    try {
      console.log('📝 Updating user panel details...');
      await updateUserPanels(walletAddress, {
        panelsPurchased: orderDetails.panels,
        cost: orderDetails.cost
      });
      console.log('✅ User panel details updated successfully');
    } catch (error) {
      console.warn('⚠️  Failed to update user panel details (non-critical)', error);
      // Continue with purchase save even if this fails
    }

    // 2. Create purchase record for backend API (CRITICAL)
    const purchaseData = {
      walletAddress: walletAddress, // Use consistent wallet address
      paymentMethod,
      tokenAmount: tokenAmount,
      panelsPurchased: orderDetails.panels,
      cost: orderDetails.cost,
      capacity: orderDetails.capacity,
      output: orderDetails.output,
      transactionHash: signature,
      farmName: "Multi-Plant Purchase",
      location: "Multiple Locations", 
      plantAllocations: orderDetails.plantAllocations,
      // Add metadata for debugging
      metadata: {
        walletName,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      }
    };

    console.log('💾 Saving purchase to database...', {
      signature,
      allocationsCount: purchaseData.plantAllocations.length,
      totalCost: purchaseData.cost
    });

    const response = await fetch(`${API_CONFIG.BASE_URL}/api/purchases`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(purchaseData),
    });

    const responseData = await response.json();

    if (!response.ok) {
      const error = `Database save failed: ${responseData.message || response.statusText}`;
      console.error('❌ ' + error, {
        status: response.status,
        responseData,
        purchaseData
      });
      return { success: false, error };
    }

    console.log("✅ Purchase saved successfully to database:", responseData);

    // 3. Save to local storage for backup (non-critical)
    try {
      const purchase = {
        id: Date.now().toString(),
        walletAddress: walletAddress,
        totalPanels: orderDetails.panels,
        totalCapacity: orderDetails.capacity,
        totalCost: orderDetails.cost,
        paymentMethod,
        signature,
        timestamp: new Date().toISOString(),
        plantAllocations: orderDetails.plantAllocations,
      };
      PlantAllocationService.savePurchase(purchase);
      console.log('📱 Purchase saved to local storage as backup');
    } catch (error) {
      console.warn('⚠️  Failed to save to local storage (non-critical)', error);
    }

    return { 
      success: true, 
      dbId: responseData._id || responseData.id 
    };

  } catch (error: any) {
    const errorMessage = `Purchase save failed: ${error.message}`;
    console.error('❌ ' + errorMessage, {
      error,
      signature,
      walletAddress,
      orderDetails
    });
    return { success: false, error: errorMessage };
  }
};
