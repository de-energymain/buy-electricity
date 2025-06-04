import { Request, Response } from 'express';
import User, { IUser } from '../models/User';

export const createUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const userData: IUser = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ walletID: userData.walletID });
        if (existingUser) {
            console.log('User with this Wallet ID already exists:', userData.walletID);
            res.status(200).json(existingUser);
            return;
        }

        const newUser = new User(userData);
        const savedUser = await newUser.save();
        res.status(201).json(savedUser);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        const users = await User.find();
        res.status(200).json(users);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const getUserByWalletID = async (req: Request, res: Response): Promise<void> => {
    try {
        const { walletId } = req.params;

        const user = await User.findOne({ walletID: walletId });
        
        if (!user) {
            res.status(404).json({ 
                success: false,
                message: "User not found" 
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "User retrieved successfully",
            user: {
                walletID: user.walletID,
                userEmail: user.userEmail,
                userName: user.userName,
                panelDetails: user.panelDetails 
            }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: (error as Error).message 
        });
    }
};

export const updatePanelDetails = async (req: Request, res: Response): Promise<void> => {
    try {
        const { walletId } = req.params;
        const { panelsPurchased, cost } = req.body;

        if (!panelsPurchased || !cost) {
            res.status(400).json({ 
                success: false,
                message: "panelsPurchased and cost are required" 
            });
            return;
        }

        const updatedUser = await User.findOneAndUpdate(
            { walletID: walletId },
            {
                $inc: {
                    'panelDetails.purchasedPanels': panelsPurchased,
                    'panelDetails.purchasedCost': cost
                }
            },
            { new: true }
        );

        if (!updatedUser) {
            res.status(404).json({ 
                success: false,
                message: "User not found" 
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Panel details updated successfully",
            user: updatedUser
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: (error as Error).message 
        });
    }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { walletId } = req.params;
        const deletedUser = await User.findOneAndDelete({
            walletID: walletId
        });
        
        if (!deletedUser) {
            res.status(404).json({ 
                success: false,
                message: "User not found." 
            });
            return;
        }
        
        res.status(200).json({
            success: true,
            message: "User deletion successful.",
            user: deletedUser
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: (error as Error).message 
        });
    }
};

// Update user information (name and email)
export const updateUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { walletAddress } = req.params;
        const { name, email }: { name?: string; email?: string } = req.body;

        // Validate input
        if (!name && !email) {
            res.status(400).json({
                success: false,
                message: 'At least one field (name or email) is required for update'
            });
            return;
        }

        // Validate email format if provided
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
            return;
        }

        // Find user by wallet address (using walletID field to match your schema)
        const user = await User.findOne({ walletID: walletAddress });

        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found'
            });
            return;
        }

        // Update fields if provided
        if (name) {
            user.userName = name.trim();
        }
        if (email) {
            user.userEmail = email.trim().toLowerCase();
        }

        // Save updated user
        const updatedUser = await user.save();

        res.status(200).json({
            success: true,
            message: 'User updated successfully',
            user: {
                _id: updatedUser._id,
                userName: updatedUser.userName,
                userEmail: updatedUser.userEmail,
                walletID: updatedUser.walletID,
                createdAt: updatedUser.createdAt,
                updatedAt: updatedUser.updatedAt
            }
        });

    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
        });
    }
};

// Get user notification preferences
export const getUserNotificationPreferences = async (req: Request, res: Response): Promise<void> => {
    try {
        const { walletAddress } = req.params;

        const user = await User.findOne({ walletID: walletAddress });

        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found'
            });
            return;
        }

        res.status(200).json({
            success: true,
            notificationPreferences: user.notificationPreferences || {
                email: true,
                push: false,
                transactions: true,
                marketing: false
            }
        });

    } catch (error) {
        console.error('Error fetching notification preferences:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Update user notification preferences
export const updateNotificationPreferences = async (req: Request, res: Response): Promise<void> => {
    try {
        const { walletAddress } = req.params;
        const { 
            email, 
            push, 
            transactions, 
            marketing 
        }: { 
            email?: boolean; 
            push?: boolean; 
            transactions?: boolean; 
            marketing?: boolean; 
        } = req.body;

        const user = await User.findOne({ walletID: walletAddress });

        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found'
            });
            return;
        }

        // Update notification preferences
        user.notificationPreferences = {
            email: email !== undefined ? email : user.notificationPreferences?.email || true,
            push: push !== undefined ? push : user.notificationPreferences?.push || false,
            transactions: transactions !== undefined ? transactions : user.notificationPreferences?.transactions || true,
            marketing: marketing !== undefined ? marketing : user.notificationPreferences?.marketing || false
        };

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Notification preferences updated successfully',
            notificationPreferences: user.notificationPreferences
        });

    } catch (error) {
        console.error('Error updating notification preferences:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};