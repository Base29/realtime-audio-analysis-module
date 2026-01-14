import { RingBufferInterface } from '../types/interfaces';

/**
 * Ring Buffer implementation with fixed-size memory management
 * Prevents unbounded memory growth by maintaining a circular buffer
 */
export class RingBuffer<T> implements RingBufferInterface<T> {
  private buffer: T[];
  private head: number = 0;
  private maxSize: number;
  private currentSize: number = 0;

  constructor(size: number, defaultValue: T) {
    this.maxSize = size;
    this.buffer = new Array(size).fill(defaultValue);
  }

  push(value: T): void {
    this.buffer[this.head] = value;
    this.head = (this.head + 1) % this.maxSize;
    if (this.currentSize < this.maxSize) {
      this.currentSize++;
    }
  }

  getLatest(count: number): T[] {
    const requestedCount = Math.min(count, this.currentSize);
    const result: T[] = [];
    
    for (let i = 0; i < requestedCount; i++) {
      const index = (this.head - 1 - i + this.maxSize) % this.maxSize;
      result.unshift(this.buffer[index]);
    }
    
    return result;
  }

  size(): number {
    return this.currentSize;
  }

  clear(): void {
    this.head = 0;
    this.currentSize = 0;
  }
}