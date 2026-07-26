import { Schema, model } from "mongoose";

const autoRoleSchema = new Schema(
  {
    channel: { required: true, type: String },
    message: { required: true, type: String },
    role: { required: true, type: String },
  },
  { _id: false },
);

const counterSchema = new Schema(
  {
    channel: { required: true, type: String },
    count: { min: 1, required: true, type: Number },
  },
  { _id: false },
);

const guildSchema = new Schema(
  {
    autoRoleConfig: autoRoleSchema,
    counterConfig: counterSchema,
    guildID: { index: true, required: true, type: String, unique: true },
  },
  { timestamps: true },
);

export default model("guild_schema", guildSchema);
