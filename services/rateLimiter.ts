// A simple token bucket implementation for rate limiting.
class TokenBucket {
  private capacity: number;
  private tokens: number;
  private refillRate: number; // tokens per millisecond
  private lastRefill: number;

  constructor(capacity: number, refillRatePerSecond: number) {
    this.capacity = capacity;
    this.tokens = capacity;
    this.refillRate = refillRatePerSecond / 1000;
    this.lastRefill = Date.now();
  }

  private refill() {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    if (elapsed > 0) {
      const tokensToAdd = elapsed * this.refillRate;
      this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
      this.lastRefill = now;
    }
  }

  consume(cost: number): { allowed: boolean; retryAfter?: number } {
    this.refill();
    if (this.tokens >= cost) {
      this.tokens -= cost;
      return { allowed: true };
    }
    
    const timeToRefill = (cost - this.tokens) / this.refillRate;
    return { allowed: false, retryAfter: Math.ceil(timeToRefill / 1000) }; // in seconds
  }
}

const buckets = new Map<string, TokenBucket>();

// Constants for rate limiting policy
const BUCKET_CAPACITY = 20; // 20 tokens max
const REFILL_RATE_PER_SECOND = 0.5; // 1 token every 2 seconds
export const TEXT_TRANSLATION_COST = 1;
export const VOICE_SESSION_COST = 5;

interface RateLimitResult {
    allowed: boolean;
    retryAfter?: number; // seconds
}

function check(origin: string, cost: number): RateLimitResult {
  if (!buckets.has(origin)) {
    buckets.set(origin, new TokenBucket(BUCKET_CAPACITY, REFILL_RATE_PER_SECOND));
  }
  const bucket = buckets.get(origin)!;
  return bucket.consume(cost);
}

export const rateLimiter = {
    check
};
