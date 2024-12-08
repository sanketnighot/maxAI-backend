import axios from "axios";

interface YieldPool {
  pool: string;
  chain: string;
  project: string;
  symbol: string;
  tvlUsd: number;
  apy: number;
  rewardTokens: string[];
  underlyingTokens: string[];
}

export const fetchYieldOpportunities = async (
  userTokens: string[]
): Promise<YieldPool[]> => {
  try {
    if (!userTokens || !Array.isArray(userTokens)) {
      return [];
    }

    const response = await axios.get("https://yields.llama.fi/pools");
    const pools = response.data.data;

    // Filter pools that match user's tokens and have significant TVL
    return pools
      .filter((pool: YieldPool) => {
        const hasUserToken =
          pool.underlyingTokens?.some(
            (token) => token && userTokens.includes(token.toLowerCase())
          ) || false; // Ensure token is not null/undefined
        const hasSignificantTVL = pool.tvlUsd > 100000; // $100k minimum TVL
        return hasUserToken && hasSignificantTVL;
      })
      .slice(0, 25); // Limit to first 25 results
  } catch (error) {
    console.error("Error fetching yield opportunities:", error);
    return [];
  }
};
