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
    suggestions: {
        stake: {
            token_name: string;
            amount: string;
        };
        move: {
            token_name: string;
            from: string;
            to: string;
            amount: string;
        };
    };
    market_trend_analysis: {
        top_gainer: {
            token_name: string;
            price_change: string;
        };
        top_loser: {
            token_name: string;
            price_change: string;
        };
    };
}

export const generateAIPrompt = (
    address: string,
    chain: string,
    transactions: any[],
    tokenBalances: any[],
    topTokens: TokenPrice[],
): string => {
    return `
CRITICAL: You must respond with ONLY a JSON object. No other text, no markdown formatting, no explanations before or after. Any text that isn't part of the JSON object will cause a system error.

You are an expert crypto portfolio analyst. You know how to analyse the crypto market. If you are given the data then you can analyse the market according to the required parameters. You are supposed to analyse the user’s given data and generate a report in a well structured manner with proper JSON object mentioned below: 

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
            "asset_token_symbol": "token symbol",
            "reason": "Specific vulnerability: insufficient funds/losses/missed opportunities"
        }
    ],
    "suggestions": "List specific actionable trades based on 7-day price trends"
    "market_trend_analysis": {
        "top_gainer": {
            "token_name": "name",
            "price_change": "change in price"
        },
        "top_loser": {
            "token_name": "name",
            "price_change": "change in price"
        }
    }
}

WALLET DATA:
Wallet Address: ${address}
Chain: ${chain}
Token Balances: ${JSON.stringify(tokenBalances, null, 2)}
Transaction History: ${JSON.stringify(transactions, null, 2)}
Market Trends (7 Days): ${JSON.stringify(topTokens, null, 2)}

ANALYSIS REQUIREMENTS:

1. Identify missed trading opportunities based on price fluctuations
2. Analyze transaction timing against market movements
3. Evaluate portfolio risks including:
   - Insufficient funds for staking
   - Underperforming tokens
   - Missed buy/sell opportunities
4. Provide actionable trading suggestions based on market trends
5. Key Considerations in calculating the unrealised PnL:
    - Use Current Price: Unrealised PnL is based on the current market price compared to the weighted average purchase price (WAC) or initial investment cost.
    - Track Holdings Over Time: Consider the actual balance of the asset and adjust for transactions affecting the portfolio.
    - Avoid Maximum/Minimum Price Differences: Unrealised PnL is not about hypothetical high or low prices but the actual value if the asset were sold now.
6. for user's token/assets you might get the token balance in the form of hexadecimal value, you need to convert it into a the given chain token value.
7. After converting the token value, you can convert the token value into USD using the current price from the market data.
9. For top gainers and losers you can use the data of the top 10 tokens from the market data and then you can find the top gainer and top loser from that data.

RESPONSE RULES:
- Start your response with the opening brace {
- End your response with the closing brace }
- Include no text before the opening brace or after the closing brace
- Ensure the response is valid JSON that can be parsed with JSON.parse()
- Do not use comments or explanations
- Do not use markdown formatting
- Do not hallucinate on your own because the value coming out of this data is of high importance and should have least risk apetite.

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