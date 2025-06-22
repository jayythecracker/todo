# Senior Developer Architecture Patterns

## 🎯 **Your Question: Should I Do Like That?**

You asked about moving cookie logic into JWT utilities. Here's how **senior developers** actually handle this:

## ❌ **What You Were Thinking (Not Recommended)**

```typescript
// Mixing concerns - JWT utility depends on Express Response
export const generateAccessToken = (res: Response, payload: object) => {
  const token = jwt.sign(payload, SECRET, { expiresIn: "15m" });
  res.cookie("accessToken", token, { httpOnly: true }); // ❌ Side effect
  return token;
};
```

**Problems:**
- JWT utility now depends on Express
- Hard to test in isolation
- Less flexible (what if you want tokens without cookies?)
- Violates Single Responsibility Principle

## ✅ **Senior Developer Approach: Separation of Concerns**

### **1. Pure Functions (No Side Effects)**

```typescript
// ✅ Pure JWT functions - no dependencies, easy to test
export const generateAccessToken = (payload: object) => {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: "15m" });
};

export const generateRefreshToken = (payload: object) => {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: "7d" });
};
```

### **2. Configuration Constants**

```typescript
// ✅ Centralized configuration
export const COOKIE_OPTIONS = {
  ACCESS_TOKEN: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    maxAge: 15 * 60 * 1000,
  },
  REFRESH_TOKEN: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", 
    sameSite: "strict" as const,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
};
```

### **3. Dedicated Helper Functions**

```typescript
// ✅ Single-purpose functions
export const setAuthCookies = (res: Response, accessToken: string, refreshToken: string) => {
  res.cookie("accessToken", accessToken, COOKIE_OPTIONS.ACCESS_TOKEN);
  res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS.REFRESH_TOKEN);
};

export const clearAuthCookies = (res: Response) => {
  res.clearCookie("accessToken", { httpOnly: true, secure: isProduction, sameSite: "strict" });
  res.clearCookie("refreshToken", { httpOnly: true, secure: isProduction, sameSite: "strict" });
};
```

### **4. Convenience Functions**

```typescript
// ✅ Convenience function for common use case
export const generateTokensWithCookies = (res: Response, payload: object) => {
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);
  
  setAuthCookies(res, accessToken, refreshToken);
  
  return { accessToken, refreshToken };
};
```

## 🏗️ **Architecture Benefits**

### **Modularity**
```typescript
// Can use JWT functions anywhere
const token = generateAccessToken({ userId: 123 });

// Can use cookie helpers anywhere  
setAuthCookies(res, token1, token2);

// Can combine when needed
const tokens = generateTokensWithCookies(res, payload);
```

### **Testability**
```typescript
// Easy to test pure functions
describe('JWT Utils', () => {
  it('should generate valid access token', () => {
    const token = generateAccessToken({ userId: 123 });
    expect(jwt.verify(token, ACCESS_SECRET)).toBeTruthy();
  });
});
```

### **Flexibility**
```typescript
// Different use cases
const tokens1 = generateTokensWithCookies(res, payload);     // Web app
const tokens2 = { 
  accessToken: generateAccessToken(payload),                 // Mobile app
  refreshToken: generateRefreshToken(payload) 
};
```

## 🎨 **Usage in Controllers**

### **Before (Your Approach)**
```typescript
// ❌ Tightly coupled
export const login = async (req, res) => {
  // ... validation
  const accessToken = generateAccessToken(res, payload); // Side effect!
  const refreshToken = generateRefreshToken(payload);
  // Manual cookie setting...
};
```

### **After (Senior Approach)**
```typescript
// ✅ Clean and flexible
export const login = async (req, res) => {
  // ... validation
  const { accessToken, refreshToken } = generateTokensWithCookies(res, payload);
  
  res.json({
    message: "Login successful",
    accessToken,
    refreshToken,
    user: userData
  });
};
```

## 🔧 **Advanced Patterns**

### **Strategy Pattern for Different Clients**
```typescript
interface AuthStrategy {
  setTokens(res: Response, tokens: TokenPair): void;
}

class WebAuthStrategy implements AuthStrategy {
  setTokens(res: Response, tokens: TokenPair) {
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
  }
}

class MobileAuthStrategy implements AuthStrategy {
  setTokens(res: Response, tokens: TokenPair) {
    // Just return tokens, no cookies
  }
}
```

### **Factory Pattern**
```typescript
export const createAuthResponse = (strategy: AuthStrategy, res: Response, payload: object) => {
  const tokens = {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload)
  };
  
  strategy.setTokens(res, tokens);
  return tokens;
};
```

## 📊 **Comparison: Your Way vs Senior Way**

| Aspect | Your Approach | Senior Approach |
|--------|---------------|-----------------|
| **Coupling** | High (JWT ↔ Express) | Low (Separated) |
| **Testability** | Hard | Easy |
| **Reusability** | Limited | High |
| **Flexibility** | Low | High |
| **Maintainability** | Poor | Excellent |
| **Single Responsibility** | Violated | Followed |

## 🎯 **Key Takeaways**

1. **Keep utilities pure** - No side effects in utility functions
2. **Separate concerns** - JWT logic ≠ Cookie logic ≠ HTTP logic  
3. **Use helper functions** - For common operations
4. **Provide convenience functions** - For frequent use cases
5. **Think about testing** - Pure functions are easier to test
6. **Consider flexibility** - Different clients, different needs

## 🚀 **Senior Developer Mindset**

Senior developers ask:
- "Can I test this easily?"
- "What if requirements change?"
- "Is this function doing one thing well?"
- "Can I reuse this elsewhere?"
- "Is this coupled to things it shouldn't be?"

Your instinct to organize code was good, but the **separation of concerns** approach is what makes code maintainable at scale! 🎉
