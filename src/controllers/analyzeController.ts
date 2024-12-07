import { Request, Response } from 'express';
import Analysis from '../models/Analysis';
import { AnalyzeRequest } from '../utils/types';
import { getAlchemyClient, fetchTransactionHistory, fetchTokenBalances, fetchTopTokensByMarketCap } from '../utils/blockchain';
import { generateAIPrompt, getAIAnalysis } from '../utils/ai';

export const analyzeWallet = async (req: Request, res: Response) => {
    try {
        const { address, chain, duration } = req.body as AnalyzeRequest;
        
        const alchemy = getAlchemyClient(chain);
        const currentTimestamp = Math.floor(Date.now() / 1000);
        
        // 1. Fetch user transactions
        const transactions = await fetchTransactionHistory(alchemy, address);

        // 2. Fetch token balances
        const tokenBalances = await fetchTokenBalances(alchemy, address);

        // 3. Fetch top tokens by market cap and price difference
        const topTokens = await fetchTopTokensByMarketCap(duration);

        // 4. Generate AI prompt and get analysis
        const prompt = generateAIPrompt(
            address,
            chain,
            transactions.transfers,
            tokenBalances.tokenBalances,
            topTokens
        );

        // 5. Get AI analysis
        const aiAnalysis = await getAIAnalysis(prompt);

        // 6. Save to MongoDB
        const analysis = new Analysis({
            ...aiAnalysis,
            timestamp: currentTimestamp
        });
        await analysis.save();

        // 7. Send response
        res.status(200).json(aiAnalysis);

    } catch (error) {
        res.status(500).json({ error: 'Failed to analyze wallet' });
    }
};

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