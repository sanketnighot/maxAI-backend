import Anthropic from '@anthropic-ai/sdk';
import { TokenPrice } from '../utils/types';

interface AIAnalysisResponse {
  unrealised_pnl: string;
  user_wallet_address: string;
  chain: string;
  tokens: Array<{
    token_name: string;
    token_address: string;
    token_balance: string;
    token_price_in_USD: string;
  }>;
  transaction_history: Array<{
    transaction_id: string;
    transaction_type: string;
    transaction_amount: string;
    transaction_time: string;
    transaction_status: string;
  }>;
  short_descriptive_analysis_of_portfolio: string;
  vulnerable_assets: Array<{
    asset_name: string;
    asset_token_symbol: string;
    reason: string;
  }>;
  suggestions: string;
}

export const generateAIPrompt = (
    address: string,
    chain: string,
    transactions: any[],
    tokenBalances: any[],
    topTokens: TokenPrice[]
): string => {
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

export const getAIAnalysis = async (prompt: string): Promise<AIAnalysisResponse> => {
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

        return JSON.parse(completion.completion) as AIAnalysisResponse;
    } catch (error) {
        throw new Error('Failed to get AI analysis');
    }
}; 