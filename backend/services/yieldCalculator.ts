import cron from 'node-cron';
import dotenv from 'dotenv';
import User from '../models/User';

dotenv.config();

const TOKEN_EXCHANGE_RATE = 0.03; //Static

// cost/30 days
const calculateDailyYield = (purchasedCost : number): number => {
    return (purchasedCost/30) * TOKEN_EXCHANGE_RATE;
};

//15-minute yield increment
const calculateIncrement = (purchasedCost : number) : number => {
    const dailyYield = calculateDailyYield(purchasedCost);
    return dailyYield/96; 
}

const updateUserYields = async () => {
    try {
        const users = await User.find({
            'panelDetails.purchasedCost': { $gt: 0}
        });

        const updatePromises = users.map(user => {
            const increment = calculateIncrement(user.panelDetails.purchasedCost);
            return User.findByIdAndUpdate(
                user._id,
                { $inc: { 'panelDetails.generatedYield': increment } },
                { new: true }
            );
        });

        await Promise.all(updatePromises);
        console.log(`[${new Date().toISOString()}] Yield distribution completed for ${users.length} users`);

    } catch (error) {
        console.error("Error distributing yield.");
    }
};

//Start the scheduler
export const startYieldScheduler = () => {
    cron.schedule('*/15 * * * *', updateUserYields);
    console.log('Yield scheduler started...');
};