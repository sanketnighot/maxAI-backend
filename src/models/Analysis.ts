import mongoose, { Schema, Document } from 'mongoose';

interface IToken {
    token_name: string;
    token_address: string;
    token_balance: string;
    token_price_in_USD: string;
}

interface ITransaction {
    transaction_id: string;
    transaction_type: string;
    transaction_amount: string;
    transaction_time: string;
    transaction_status: string;
}

interface IVulnerableAsset {
    asset_name: string;
    reason: string;
}

export interface IAnalysis extends Document {
    unrealised_pnl: string;
    user_wallet_address: string;
    chain: string;
    tokens: IToken[];
    transaction_history: ITransaction[];
    short_descriptive_analysis_of_portfolio: string;
    vulnerable_assets: IVulnerableAsset[];
    suggestions: string;
    timestamp: number;
}

const AnalysisSchema: Schema = new Schema({
  unrealised_pnl: { type: String }, // Optional to handle clean wallets
  user_wallet_address: { type: String, required: true },
  chain: { type: String, required: true },
  tokens: [
    {
      token_name: { type: String },
      token_address: { type: String },
      token_balance: { type: String },
      token_price_in_USD: { type: String },
    },
  ],
  transaction_history: [
    {
      transaction_id: { type: String },
      transaction_type: { type: String },
      transaction_amount: { type: String },
      transaction_time: { type: String },
      transaction_status: { type: String },
    },
  ],
  short_descriptive_analysis_of_portfolio: { type: String },
  vulnerable_assets: [
    {
      asset_name: { type: String },
      asset_token_symbol: { type: String },
      reason: { type: String },
    },
  ],
  yield_opportunities: [
    {
      token_name: { type: String },
      protocol: { type: String },
      apy: { type: String },
      tvl: { type: String },
      risk_level: { type: String },
    },
  ],
  suggestions: {
    stake: {
      token_name: { type: String },
      amount: { type: String },
      recommended_protocol: { type: String },
      expected_apy: { type: String },
    },
    move: {
      token_name: { type: String },
      from: { type: String },
      to: { type: String },
      amount: { type: String },
    },
  },
  market_trend_analysis: {
    top_gainer: {
      token_name: { type: String },
      price_change: { type: String },
    },
    top_loser: {
      token_name: { type: String },
      price_change: { type: String },
    },
  },
  timestamp: { type: Number, default: Date.now }, // Auto-set timestamp
});

export default mongoose.model<IAnalysis>("Analysis", AnalysisSchema);
