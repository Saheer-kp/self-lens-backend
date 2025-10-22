const redisDB = require("../config/redis");
const PasswordUtils = require("../utils/passwordUtils");
// const { generateToken } = require("../utils/jwtUtils");

class User {
  constructor() {
    this.redis = redisDB;
    this.userKeyPrefix = "user:";
    this.emailIndexKey = "index:email:";
    this.usernameIndexKey = "index:username:";
    this.usersSetKey = "users:all";
  }

  // Generate user ID
  generateUserId() {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Check if email exists
  async emailExists(email) {
    const client = this.redis.getClient();
    const exists = await client.exists(`${this.emailIndexKey}${email}`);
    return exists === 1;
  }

  // Check if username exists
  async usernameExists(username) {
    const client = this.redis.getClient();
    const exists = await client.exists(`${this.usernameIndexKey}${username}`);
    return exists === 1;
  }

  // Create new user
  // async create(userData) {
  //   const client = this.redis.getClient();
  //   const { username, email, password, first_name, last_name } = userData;

  //   // Check if user already exists
  //   if (await this.emailExists(email)) {
  //     throw new Error("Email already registered");
  //   }

  //   if (await this.usernameExists(username)) {
  //     throw new Error("Username already taken");
  //   }

  //   // Hash password
  //   const hashedPassword = await PasswordUtils.hashPassword(password);

  //   // Create user object
  //   const userId = this.generateUserId();
  //   const user = {
  //     id: userId,
  //     username,
  //     email,
  //     password: hashedPassword,
  //     first_name,
  //     last_name,
  //     isActive: "true", // Store as string for Redis
  //     createdAt: new Date().toISOString(),
  //     updatedAt: new Date().toISOString(),
  //     lastLogin: "null", // Store as string
  //   };

  //   console.log(user, "userredis");

  //   // Start Redis transaction
  //   const multi = client.multi();

  //   // ✅ CORRECT: Store each field separately in Redis hash
  //   multi.hSet(`${this.userKeyPrefix}${userId}`, {
  //     id: user.id,
  //     username: user.username,
  //     email: user.email,
  //     password: user.password,
  //     first_name: user.first_name,
  //     last_name: user.last_name,
  //     isActive: user.isActive,
  //     createdAt: user.createdAt,
  //     updatedAt: user.updatedAt,
  //     lastLogin: user.lastLogin,
  //   });

  //   // Create indexes for quick lookups
  //   multi.set(`${this.emailIndexKey}${email}`, userId);
  //   multi.set(`${this.usernameIndexKey}${username}`, userId);

  //   // Add to users set
  //   multi.sAdd(this.usersSetKey, userId);

  //   // Execute transaction
  //   await multi.exec();

  //   return {
  //     id: user.id,
  //     username: user.username,
  //     email: user.email,
  //     first_name: user.first_name,
  //     last_name: user.last_name,
  //     createdAt: user.createdAt,
  //   };
  // }
  async create(userData) {
    const client = this.redis.getClient();
    const { username, email, password, first_name, last_name } = userData;

    // Check if user already exists
    if (await this.emailExists(email)) {
      throw new Error("Email already registered");
    }

    if (await this.usernameExists(username)) {
      throw new Error("Username already taken");
    }

    // Hash password
    const hashedPassword = await PasswordUtils.hashPassword(password);

    // Create user object
    const userId = this.generateUserId();
    const user = {
      id: userId,
      username,
      email,
      password: hashedPassword,
      first_name,
      last_name,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLogin: null,
    };

    console.log("Creating user:", user);

    // Start Redis transaction
    const multi = client.multi();

    // ✅ Store user as JSON string
    multi.set(`${this.userKeyPrefix}${userId}`, JSON.stringify(user));

    // Create indexes for quick lookups
    multi.set(`${this.emailIndexKey}${email}`, userId);
    multi.set(`${this.usernameIndexKey}${username}`, userId);

    // Add to users set
    multi.sAdd(this.usersSetKey, userId);

    // Create search indexes
    multi.sAdd(`${this.searchIndexKey}email:${email}`, userId);
    multi.sAdd(`${this.searchIndexKey}username:${username}`, userId);
    multi.sAdd(
      `${this.searchIndexKey}first_name:${first_name.toLowerCase()}`,
      userId
    );
    multi.sAdd(
      `${this.searchIndexKey}last_name:${last_name.toLowerCase()}`,
      userId
    );
    multi.sAdd(`${this.searchIndexKey}active:true`, userId);

    // Execute transaction
    await multi.exec();

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  // Find user by ID
  async findById(userId) {
    const client = this.redis.getClient();
    const userData = await client.hGetAll(`${this.userKeyPrefix}${userId}`);

    if (!userData || !userData.id) {
      return null;
    }

    return userData;
  }

  // Find user by email
  async findByEmail(email) {
    const client = this.redis.getClient();
    const userId = await client.get(`${this.emailIndexKey}${email}`);

    if (!userId) {
      return null;
    }

    return await this.findById(userId);
  }

  // Find user by username
  async findByUsername(username) {
    const client = this.redis.getClient();
    const userId = await client.get(`${this.usernameIndexKey}${username}`);

    if (!userId) {
      return null;
    }

    return await this.findById(userId);
  }

  // Verify user credentials
  async verifyCredentials(email, password) {
    const user = await this.findByEmail(email);

    if (!user) {
      throw new Error("User not found");
    }

    if (!user.isActive) {
      throw new Error("Account is deactivated");
    }

    const isPasswordValid = await PasswordUtils.comparePassword(
      password,
      user.password
    );

    if (!isPasswordValid) {
      throw new Error("Invalid password");
    }

    // Update last login
    const client = this.redis.getClient();
    await client.hSet(
      `${this.userKeyPrefix}${user.id}`,
      "lastLogin",
      new Date().toISOString()
    );

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
    };
  }

  // Update user profile
  async updateProfile(userId, updateData) {
    const client = this.redis.getClient();
    const allowedFields = ["first_name", "last_name"];
    const updates = {};

    allowedFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        updates[field] = updateData[field];
      }
    });

    updates.updatedAt = new Date().toISOString();

    if (Object.keys(updates).length > 0) {
      await client.hSet(`${this.userKeyPrefix}${userId}`, updates);
    }

    return await this.findById(userId);
  }

  // Get all users (for admin purposes)
  async getAllUsers() {
    const client = this.redis.getClient();
    const userIds = await client.sMembers(this.usersSetKey);

    const users = [];
    for (const userId of userIds) {
      const user = await this.findById(userId);
      if (user) {
        // Remove password from response
        const { password, ...userWithoutPassword } = user;
        users.push(userWithoutPassword);
      }
    }

    return users;
  }

  // Delete user
  async deleteUser(userId) {
    const client = this.redis.getClient();
    const user = await this.findById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    const multi = client.multi();

    // Remove user data
    multi.del(`${this.userKeyPrefix}${userId}`);

    // Remove indexes
    multi.del(`${this.emailIndexKey}${user.email}`);
    multi.del(`${this.usernameIndexKey}${user.username}`);

    // Remove from users set
    multi.sRem(this.usersSetKey, userId);

    await multi.exec();

    return true;
  }
}

module.exports = new User();
