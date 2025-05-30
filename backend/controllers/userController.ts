import { Request, Response } from 'express';
import User, { IUser } from '../models/User';

export const createUser = async (req : Request, res: Response ) => {
    try {
        const userData : IUser = req.body;
        const newUser = new User(userData);
        const savedUser = await newUser.save();
        res.status(201).json(savedUser);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message }); //type assertion 
    }
};

export const getAllUsers = async ( req: Request, res: Response) => {
    try {
        const users = await User.find();
        res.status(200).json(users);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message});
    }
};