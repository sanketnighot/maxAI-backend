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
    unrealised_pnl: { type: String, required: true },
    user_wallet_address: { type: String, required: true },
    chain: { type: String, required: true },
    tokens: [{
        token_name: { type: String, required: true },
        token_address: { type: String, required: true },
        token_balance: { type: String, required: true },
        token_price_in_USD: { type: String, required: true }
    }],
    transaction_history: [{
        transaction_id: { type: String, required: true },
        transaction_type: { type: String, required: true },
        transaction_amount: { type: String, required: true },
        transaction_time: { type: String, required: true },
        transaction_status: { type: String, required: true }
    }],
    short_descriptive_analysis_of_portfolio: { type: String, required: true },
    vulnerable_assets: [{
        asset_name: { type: String, required: true },
        reason: { type: String, required: true }
    }],
    suggestions: { type: String, required: true },
    timestamp: { type: Number, required: true }
});

export default mongoose.model<IAnalysis>('Analysis', AnalysisSchema); 