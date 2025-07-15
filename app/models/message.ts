import mongoose, { Schema, Document } from "mongoose";

export interface IMessage extends Document {
  senderId: string;
  senderName: string;
  senderType: "trainer" | "member";
  text: string;
  timestamp: Date;
  roomId: string;
}

const MessageSchema = new Schema<IMessage>({
  senderId: { type: String, required: true },
  senderName: { type: String, required: true },
  senderType: { type: String, required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  roomId: { type: String, required: true },
});

export default mongoose.models.Message || mongoose.model<IMessage>("Message", MessageSchema);
