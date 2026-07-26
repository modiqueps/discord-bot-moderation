import mongoose from "mongoose";
import logger from "../core/logger.js";

export async function connectDatabase(uri) {
  mongoose.set("strictQuery", true);

  mongoose.connection.on("error", (error) =>
    logger.error("MongoDB connection error:", error),
  );
  mongoose.connection.on("disconnected", () =>
    logger.warn("MongoDB disconnected; the driver will retry."),
  );

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 });
  logger.success("Connected to MongoDB.");
}

export async function closeDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}
