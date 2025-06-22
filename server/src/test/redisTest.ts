import { redisClient, RedisService } from "../config/redis";

// ✅ Simple Redis test function
async function testRedis() {
  console.log("🧪 Testing Redis connection...");
  
  try {
    // Connect to Redis
    await redisClient.connect();
    console.log("✅ Redis connected successfully");

    // Test basic operations
    console.log("🧪 Testing basic Redis operations...");
    
    // Set a value
    await RedisService.set("test:key", "Hello Redis!", 60);
    console.log("✅ SET operation successful");

    // Get the value
    const value = await RedisService.get("test:key");
    console.log("✅ GET operation successful:", value);

    // Test with JSON data
    const testData = { name: "John", age: 30, todos: ["Learn Redis", "Build app"] };
    await RedisService.set("test:json", testData, 60);
    const jsonValue = await RedisService.get("test:json");
    console.log("✅ JSON operations successful:", jsonValue);

    // Test increment (for rate limiting)
    const count1 = await RedisService.increment("test:counter", 60);
    const count2 = await RedisService.increment("test:counter", 60);
    console.log("✅ INCREMENT operations successful:", count1, count2);

    // Test exists
    const exists = await RedisService.exists("test:key");
    console.log("✅ EXISTS operation successful:", exists);

    // Clean up test data
    await RedisService.del("test:key");
    await RedisService.del("test:json");
    await RedisService.del("test:counter");
    console.log("✅ Cleanup successful");

    console.log("🎉 All Redis tests passed!");

  } catch (error) {
    console.error("❌ Redis test failed:", error);
    
    if (error instanceof Error) {
      if (error.message.includes("ECONNREFUSED")) {
        console.log("\n💡 Redis server is not running. Please start Redis:");
        console.log("   macOS: brew services start redis");
        console.log("   Ubuntu: sudo systemctl start redis-server");
        console.log("   Docker: docker run -d -p 6379:6379 redis:alpine");
      }
    }
  } finally {
    // Disconnect
    await redisClient.disconnect();
    console.log("🔌 Redis disconnected");
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testRedis().then(() => {
    console.log("Test completed");
    process.exit(0);
  }).catch((error) => {
    console.error("Test failed:", error);
    process.exit(1);
  });
}

export { testRedis };
