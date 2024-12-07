import { Request, Response } from 'express';
import Analysis from '../models/Analysis';

export const getAnalysisByAddress = async (req: Request, res: Response) => {
    try {
        const { address } = req.params;
        const limit = parseInt(req.query.limit as string) || 10; // Default to 10 if not specified

        const reports = await Analysis.find({ user_wallet_address: address })
            .sort({ timestamp: -1 })
            .limit(limit);
        
        res.status(200).json({
            success: true,
            count: reports.length,
            data: reports
        });

    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch analysis reports' 
        });
    }
}; 