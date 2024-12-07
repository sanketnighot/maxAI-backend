import { Request, Response } from 'express';
import { Alchemy, Network, AssetTransfersCategory } from 'alchemy-sdk';
import axios from 'axios';
import Anthropic from '@anthropic-ai/sdk';
import Analysis, { IAnalysis } from '../models/Analysis';

interface AnalyzeRequest {
    address: string;
    chain: string;
    duration: number;
}

interface TokenPrice {
    id: string;
    symbol: string;
    current_price: number;
    market_cap: number;
    price_change_percentage_24h: number;
}

const getAlchemyNetwork = (chain: string): Network => {
    switch (chain.toLowerCase()) {
        case 'base':
            return Network.BASE_MAINNET;
        case 'ethereum':
            return Network.ETH_MAINNET;
        default:
            throw new Error('Unsupported chain');
    }
};

const generateAIPrompt = (
    address: string,
    chain: string,
    transactions: any[],
    tokenBalances: any[],
    topTokens: TokenPrice[]
) => {
    return `CRITICAL: You must respond with ONLY a JSON object. No other text, no markdown formatting, no explanations before or after. Any text that isn't part of the JSON object will cause a system error.

You are an expert crypto portfolio analyst. Your task is to analyze the following data and respond with a structured JSON analysis.

WALLET DATA:
Wallet Address: ${address}
Chain: ${chain}
Token Balances: ${JSON.stringify(tokenBalances, null, 2)}
Transaction History: ${JSON.stringify(transactions, null, 2)}
Market Trends (7 Days): ${JSON.stringify(topTokens, null, 2)}

ANALYSIS REQUIREMENTS:
1. Calculate unrealized PnL using exact token prices from the 7-day market data
2. Identify missed trading opportunities based on price fluctuations
3. Analyze transaction timing against market movements
4. Evaluate portfolio risks including:
   - Insufficient funds for staking
   - Underperforming tokens
   - Missed buy/sell opportunities
5. Provide actionable trading suggestions based on market trends

RESPONSE RULES:
- Start your response with the opening brace {
- End your response with the closing brace }
- Include no text before the opening brace or after the closing brace
- Ensure the response is valid JSON that can be parsed with JSON.parse()
- Do not use comments or explanations
- Do not use markdown formatting

REQUIRED JSON STRUCTURE:
{
    "unrealised_pnl": "calculated value in USD using exact prices from market data",
    "user_wallet_address": "${address}",
    "chain": "${chain}",
    "tokens": [
        {
            "token_name": "name",
            "token_address": "address",
            "token_balance": "balance",
            "token_price_in_USD": "current price from market data"
        }
    ],
    "transaction_history": [
        {
            "transaction_id": "tx hash",
            "transaction_type": "type",
            "transaction_amount": "amount",
            "transaction_time": "timestamp",
            "transaction_status": "status"
        }
    ],
    "short_descriptive_analysis_of_portfolio": "Include: 1) Overall portfolio health 2) Major price movements 3) Trading pattern analysis",
    "vulnerable_assets": [
        {
            "asset_name": "token name",
            "reason": "Specific vulnerability: insufficient funds/losses/missed opportunities"
        }
    ],
    "suggestions": "List specific actionable trades based on 7-day price trends"
}

REMEMBER: Your response must be a valid JSON object only. No other text. Start with { and end with }`;
};

async function getAIAnalysis(prompt: string) {
    const client = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
    });

    try {
        const completion = await client.completions.create({
            model: "claude-2",
            prompt: `\n\nHuman: ${prompt}\n\nAssistant:`,
            max_tokens_to_sample: 4000,
            temperature: 0.1
        });

        // Parse the response to ensure it's valid JSON
        const analysisData = JSON.parse(completion.completion);
        return analysisData;
    } catch (error) {
        throw new Error('Failed to get AI analysis');
    }
}

export const analyzeWallet = async (req: Request, res: Response) => {
    try {
        const { address, chain, duration } = req.body as AnalyzeRequest;
        
        const config = {
            apiKey: process.env.ALCHEMY_API_KEY,
            network: getAlchemyNetwork(chain)
        };
        
        const alchemy = new Alchemy(config);
        const currentTimestamp = Math.floor(Date.now() / 1000);
        
        // 1. Fetch user transactions
        const transactions = await alchemy.core.getAssetTransfers({
          fromBlock: "0x0",
          fromAddress: address,
          category: [
            AssetTransfersCategory.EXTERNAL,
            AssetTransfersCategory.INTERNAL,
            AssetTransfersCategory.ERC20,
          ],
          maxCount: 10,
        });

        // 2. Fetch token balances
        const tokenBalances = await alchemy.core.getTokenBalances(address);

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

async function fetchTopTokensByMarketCap(duration: number): Promise<TokenPrice[]> {
    try {
        const response = await axios.get(
            'https://api.coingecko.com/api/v3/coins/markets', {
                params: {
                    vs_currency: 'usd',
                    order: 'market_cap_desc',
                    per_page: 100,
                    page: 1,
                    sparkline: false,
                    price_change_percentage: '24h'
                }
            }
        );

        const MIN_MARKET_CAP = 10000000; // $10M minimum market cap
        
        const filteredTokens = response.data
            .filter((token: TokenPrice) => token.market_cap >= MIN_MARKET_CAP)
            .sort((a: TokenPrice, b: TokenPrice) => 
                Math.abs(b.price_change_percentage_24h) - Math.abs(a.price_change_percentage_24h)
            )
            .slice(0, 10);

        return filteredTokens;
    } catch (error) {
        return [];
    }
}

export const getAnalysisByAddress = async (req: Request, res: Response) => {
    try {
        const { address } = req.params;

        const reports = await Analysis.find({ user_wallet_address: address })
            .sort({ timestamp: -1 });
        
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