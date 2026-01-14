/**
 * Ring Buffer implementation with fixed-size memory management
 * Prevents unbounded memory growth by maintaining a circular buffer
 */
export class RingBuffer {
    buffer;
    head = 0;
    maxSize;
    currentSize = 0;
    constructor(size, defaultValue) {
        this.maxSize = size;
        this.buffer = new Array(size).fill(defaultValue);
    }
    push(value) {
        this.buffer[this.head] = value;
        this.head = (this.head + 1) % this.maxSize;
        if (this.currentSize < this.maxSize) {
            this.currentSize++;
        }
    }
    getLatest(count) {
        const requestedCount = Math.min(count, this.currentSize);
        const result = [];
        for (let i = 0; i < requestedCount; i++) {
            const index = (this.head - 1 - i + this.maxSize) % this.maxSize;
            result.unshift(this.buffer[index]);
        }
        return result;
    }
    size() {
        return this.currentSize;
    }
    clear() {
        this.head = 0;
        this.currentSize = 0;
    }
}
