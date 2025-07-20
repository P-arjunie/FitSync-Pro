import mongoose, { Schema, Document, model } from 'mongoose';

export interface IWallet extends Document {
  userId: string;
  balance: number;
  currency: string;
  transactions: Array<{
    type: 'refund' | 'withdrawal' | 'credit';
    amount: number;
    description: string;
    purchaseId?: string;
    status: 'pending' | 'completed' | 'failed';
    createdAt: Date;
  }>;
}

const walletSchema = new Schema<IWallet>(
  {
    userId: { 
      type: String, 
      required: true, 
      unique: true 
    },
    balance: { 
      type: Number, 
      required: true, 
      default: 0 
    },
    currency: { 
      type: String, 
      required: true, 
      default: 'usd' 
    },
    transactions: [{
      type: {
        type: String,
        enum: ['refund', 'withdrawal', 'credit'],
        required: true
      },
      amount: {
        type: Number,
        required: true
      },
      description: {
        type: String,
        required: true
      },
      purchaseId: {
        type: String
      },
      status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  {
    timestamps: true,
    collection: 'user_wallets',
  }
);

delete mongoose.models.Wallet;

const Wallet = mongoose.models.Wallet as mongoose.Model<IWallet> || 
model<IWallet>('Wallet', walletSchema);

export default Wallet; 