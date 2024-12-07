import { Request, Response } from "express";
import { HumanMessage } from "@langchain/core/messages";
import {
  getAlchemyClient,
  fetchTransactionHistory,
  fetchTokenBalances,
  fetchTopTokensByMarketCap,
} from "../utils/blockchain";
import { AnalyzeRequest } from "../utils/types";
import { generateAIPrompt } from "../utils/ai";
import { initializeAgent } from "./baseAgent";
import Analysis from "../models/Analysis";

export const portfolioAnalyzer = async (req: Request, res: Response) => {
  try {
    const { address, chain, duration } = req.body as AnalyzeRequest;
    const alchemy = getAlchemyClient(chain);
    const currentTimestamp = Math.floor(Date.now() / 1000);

    // 1. Fetch user transactions
    const transactions = await fetchTransactionHistory(alchemy, address);
    // console.log(transactions);

    // 2. Fetch token balances
    const tokenBalances = await fetchTokenBalances(alchemy, address);
    console.log(tokenBalances);

    // 3. Fetch top tokens by market cap and price difference
    const topTokens = await fetchTopTokensByMarketCap(duration);
    console.log(topTokens);

    // 4. Generate AI prompt and get analysis
    const prompt = generateAIPrompt(
      address,
      chain,
      transactions.transfers,
      tokenBalances.tokenBalances,
      topTokens
    );

    // 5. Initialize the Base onchain agent
    const { agent, config } = await initializeAgent();

    // 6. Get analysis from the agent
    const result = await agent.invoke({
      messages: [new HumanMessage(prompt)]
    }, config);

    // 7. Parse the analysis result
    const aiAnalysis = JSON.parse(result.messages[1].content as string);
    console.log(aiAnalysis);

    // 8. Save to MongoDB
    const analysis = new Analysis({
      ...aiAnalysis,
      timestamp: currentTimestamp,
    });
    await analysis.save();

    // 9. Send response
    res.status(200).json(aiAnalysis);
  } catch (error) {
    console.error("Analysis error:", error);
    res.status(500).json({ error: "Failed to analyze wallet" });
  }
};
