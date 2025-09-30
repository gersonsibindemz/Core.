/**
 * A generic Least Recently Used (LRU) cache implementation.
 * It evicts the least recently used item when the capacity is reached.
 * Accessing an item (get) or updating it (set) marks it as recently used.
 */
export class LRUCache<K, V> {
  private capacity: number;
  private cache: Map<K, V>;

  /**
   * @param capacity The maximum number of items the cache can hold.
   */
  constructor(capacity: number) {
    if (capacity <= 0) {
      throw new Error("Cache capacity must be a positive number.");
    }
    this.capacity = capacity;
    this.cache = new Map<K, V>();
  }

  /**
   * Retrieves an item from the cache. Marks the item as recently used if found.
   * @param key The key of the item to retrieve.
   * @returns The value associated with the key, or undefined if not found.
   */
  get(key: K): V | undefined {
    if (!this.cache.has(key)) {
      return undefined;
    }

    // To mark it as recently used, we remove it and then add it back.
    // In a Map, this moves the item to the "end" of the insertion order.
    const value = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  /**
   * Adds or updates an item in the cache. Marks the item as recently used.
   * If the cache is full, evicts the least recently used item.
   * @param key The key of the item to set.
   * @param value The value of the item.
   */
  set(key: K, value: V): void {
    // If the key already exists, we must delete it first to ensure it's moved to the end.
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } 
    // If the cache is at capacity, evict the least recently used item.
    // The least recently used item is the first one in the Map's insertion order.
    else if (this.cache.size >= this.capacity) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, value);
  }
}
