import mongoose, { Document, Schema } from "mongoose";

// Interface for notification preferences
export interface INotificationPreferences {
    email: boolean;
    push: boolean;
    transactions: boolean;
    marketing: boolean;
}

// Interface for panel details
export interface IPanelDetails {
    purchasedPanels: number;
    purchasedCost: number;
    generatedYield: number; // Fixed typo from "generaterdYield"
}

// Main User interface
export interface IUser extends Document {
    loginMethod: string;
    userEmail: string;
    userName: string;
    wallet: string;
    walletID: string;
    panelDetails: IPanelDetails;
    notificationPreferences?: INotificationPreferences;
    createdAt: Date;
    updatedAt: Date;
}

// Mongoose schema
const UserSchema: Schema = new Schema({
    loginMethod: { 
        type: String, 
        required: true,
        enum: ['web3auth', 'wallet', 'email'], // Add enum for valid login methods
        trim: true
    },
    userEmail: { 
        type: String,
        match: [/.+\@.+\..+/, 'E-mail address is invalid.'],
        lowercase: true,
        trim: true,
        sparse: true // Allows multiple documents with null/undefined email
    },
    userName: { 
        type: String,
        trim: true,
        maxlength: [100, 'Username cannot be more than 100 characters']
    },
    wallet: { 
        type: String,
        trim: true
    },
    walletID: { 
        type: String, 
        unique: true,
        required: true,
        trim: true,
        index: true // Add index for faster queries
    },
    panelDetails: {
        purchasedPanels: { 
            type: Number, 
            default: 0,
            min: [0, 'Purchased panels cannot be negative']
        },
        purchasedCost: { 
            type: Number, 
            default: 0,
            min: [0, 'Purchased cost cannot be negative']
        },
        generatedYield: { 
            type: Number, 
            default: 0,
            min: [0, 'Generated yield cannot be negative']
        }
    },
    notificationPreferences: {
        email: {
            type: Boolean,
            default: true
        },
        push: {
            type: Boolean,
            default: false
        },
        transactions: {
            type: Boolean,
            default: true
        },
        marketing: {
            type: Boolean,
            default: false
        }
    }
}, {
    timestamps: true,
    // Add some useful schema options
    toJSON: {
        transform: function(doc, ret) {
            // Remove sensitive fields when converting to JSON
            delete ret.__v;
            return ret;
        }
    },
    toObject: {
        transform: function(doc, ret) {
            delete ret.__v;
            return ret;
        }
    }
});

// Add indexes for better performance
UserSchema.index({ userEmail: 1 });
UserSchema.index({ createdAt: -1 });

// Add pre-save middleware for data validation
UserSchema.pre('save', function(next) {
    // Ensure walletID is always present
    if (!this.walletID) {
        return next(new Error('WalletID is required'));
    }
    
    // Set default notification preferences if not provided
    if (!this.notificationPreferences) {
        this.notificationPreferences = {
            email: true,
            push: false,
            transactions: true,
            marketing: false
        };
    }
    
    next();
});

// Add static methods for common queries
UserSchema.statics.findByWalletID = function(walletID: string) {
    return this.findOne({ walletID });
};

UserSchema.statics.findByEmail = function(email: string) {
    return this.findOne({ userEmail: email.toLowerCase() });
};

// Add instance methods
UserSchema.methods.updatePanelDetails = function(panels: number, cost: number) {
    this.panelDetails.purchasedPanels += panels;
    this.panelDetails.purchasedCost += cost;
    return this.save();
};

UserSchema.methods.updateYield = function(yieldAmount: number) {
    this.panelDetails.generatedYield += yieldAmount;
    return this.save();
};

UserSchema.methods.updateNotificationPreferences = function(preferences: Partial<INotificationPreferences>) {
    this.notificationPreferences = { ...this.notificationPreferences, ...preferences };
    return this.save();
};

// Extend the model interface to include static methods
export interface IUserModel extends mongoose.Model<IUser> {
    findByWalletID(walletID: string): Promise<IUser | null>;
    findByEmail(email: string): Promise<IUser | null>;
}

export default mongoose.model<IUser, IUserModel>('User', UserSchema);