import { CdpAgentkit } from "@coinbase/cdp-agentkit-core";
import { CdpToolkit } from "@coinbase/cdp-langchain";
import { MemorySaver } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import * as dotenv from "dotenv";
import * as fs from "fs";
import { createOrLoadWallet } from "./createWallet";

dotenv.config();

const WALLET_DATA_FILE = "wallet_data.txt";

/**
 * Initialize the agent with CDP AgentKit
 *
 * @returns Agent executor and config
 */
export const initializeAgent = async () => {
  const llm = new ChatOpenAI({
    model: "grok-beta",
    apiKey: process.env.XAI_API_KEY,
    configuration: {
      baseURL: "https://api.x.ai/v1",
    },
    temperature: 0.1
  });

  const walletDataStr = await createOrLoadWallet();

  // Configure CDP AgentKit
  const config = {
    cdpWalletData: walletDataStr,
    networkId: process.env.NETWORK_ID || "mainnet",
  };

  // Initialize CDP AgentKit
  const agentkit = await CdpAgentkit.configureWithWallet(config);

  // Initialize CDP AgentKit Toolkit and get tools
  const cdpToolkit = new CdpToolkit(agentkit);
  const tools = cdpToolkit.getTools();

  // Store buffered conversation history in memory
  const memory = new MemorySaver();
  const agentConfig = {
    configurable: { thread_id: "mAxI yield analyser" },
  };

  // Create React Agent using the LLM and CDP AgentKit tools
  const agent = createReactAgent({
    llm,
    tools,
    checkpointSaver: memory,
    messageModifier: `You are an expert crypto portfolio analyst. Your primary responsibility is to analyze user portfolio data and provide actionable insights in the form of a structured JSON object.
  
  CRITICAL RULES:
  - Respond with a JSON object only. No text or explanations outside the JSON object.
  - Start the response with an opening brace { and end with a closing brace }.
  - Ensure the JSON object follows the required structure and is parsable with JSON.parse().
  - Do not include comments, markdown, or any non-JSON content in your response.

  When analyzing user data, evaluate the following:
  - Key Considerations in calculating Unrealised PnL:
    - Use Current Price: Unrealised PnL is based on the current market price compared to the weighted average purchase price (WAC) or initial investment cost.
    - Track Holdings Over Time: Consider the actual balance of the asset and adjust for transactions affecting the portfolio.
    - Avoid Maximum/Minimum Price Differences: Unrealised PnL is not about hypothetical high or low prices but the actual value if the asset were sold now.
  - Missed trading opportunities and timing insights.
  - Portfolio risks including underperforming assets and insufficient staking funds.
  - Actionable trading suggestions derived from market trends.

  Your responses should strictly adhere to the structure outlined in the user's prompt.
  `,
  });

  // Save wallet data
  const exportedWallet = await agentkit.exportWallet();
  fs.writeFileSync(WALLET_DATA_FILE, exportedWallet);

  return { agent, config: agentConfig };
};
