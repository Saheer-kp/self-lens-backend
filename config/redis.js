const { createClient } = require("redis");

class RedisDB {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      this.client = createClient({
        username: "default",
        password: process.env.REDIS_DATABASE_PASSWORD,
        socket: {
          host: process.env.REDIS_URL,
          port: 12489,
        },
      });

      this.client.on("error", (err) => {
        console.error("Redis Client Error:", err);
        this.isConnected = false;
      });

      this.client.on("connect", () => {
        console.log("Redis Client Connected");
        this.isConnected = true;
      });

      this.client.on("disconnect", () => {
        console.log("❌ Redis Client Disconnected");
        this.isConnected = false;
      });

      await this.client.connect();
      return this.client;
    } catch (error) {
      console.error("Failed to connect to Redis:", error);
      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.disconnect();
      this.isConnected = false;
      console.log("Redis Client Disconnected");
    }
  }

  getClient() {
    if (!this.client || !this.isConnected) {
      throw new Error("Redis client not connected");
    }
    return this.client;
  }

  // Health check
  async healthCheck() {
    try {
      await this.client.ping();
      return true;
    } catch (error) {
      return false;
    }
  }
}

const redisDB = new RedisDB();
module.exports = redisDB;
