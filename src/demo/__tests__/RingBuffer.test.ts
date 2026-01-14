/**
 * Property-based tests for RingBuffer utility
 * Feature: rich-audio-demo
 */

import fc from 'fast-check';
import { RingBuffer } from '../utils/RingBuffer';

describe('RingBuffer', () => {
  describe('Unit Tests', () => {
    it('should create buffer with specified size', () => {
      const buffer = new RingBuffer(5, 0);
      expect(buffer.size()).toBe(0);
    });

    it('should handle empty buffer', () => {
      const buffer = new RingBuffer(3, 0);
      expect(buffer.getLatest(1)).toEqual([]);
      expect(buffer.size()).toBe(0);
    });

    it('should handle full buffer', () => {
      const buffer = new RingBuffer(3, 0);
      buffer.push(1);
      buffer.push(2);
      buffer.push(3);
      expect(buffer.size()).toBe(3);
      expect(buffer.getLatest(3)).toEqual([1, 2, 3]);
    });

    it('should handle overflow scenarios', () => {
      const buffer = new RingBuffer(2, 0);
      buffer.push(1);
      buffer.push(2);
      buffer.push(3); // Should overwrite first element
      expect(buffer.size()).toBe(2);
      expect(buffer.getLatest(2)).toEqual([2, 3]);
    });
  });

  describe('Property-Based Tests', () => {
    // This test will be implemented in task 2.2
    it.skip('Property 5: Ring Buffer Memory Bounds - For any sequence of audio data events, the Ring Buffer should maintain a fixed maximum size and never grow beyond its configured capacity', () => {
      // **Feature: rich-audio-demo, Property 5: Ring Buffer Memory Bounds**
      // **Validates: Requirements 3.5**
      
      fc.assert(fc.property(
        fc.integer({ min: 1, max: 100 }), // buffer size
        fc.array(fc.float(), { minLength: 0, maxLength: 1000 }), // data sequence
        (bufferSize, dataSequence) => {
          const buffer = new RingBuffer(bufferSize, 0);
          
          // Push all data
          dataSequence.forEach(value => buffer.push(value));
          
          // Buffer size should never exceed configured capacity
          expect(buffer.size()).toBeLessThanOrEqual(bufferSize);
          
          // Should be able to get latest values without exceeding capacity
          const latest = buffer.getLatest(bufferSize + 10);
          expect(latest.length).toBeLessThanOrEqual(bufferSize);
        }
      ));
    });
  });
});