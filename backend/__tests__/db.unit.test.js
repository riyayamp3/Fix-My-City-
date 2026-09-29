// Feature: ai-civic-complaint-capture, Property 3: MONGO_URI always includes required Atlas parameters

import fc from 'fast-check';
import mongoose from 'mongoose';
import { jest } from '@jest/globals';

// Mock mongoose.connect before importing connectDB
jest.spyOn(mongoose, 'connect').mockResolvedValue({});

// Dynamically import connectDB after mocking
const { default: connectDB } = await import('../config/db.js');

/**
 * Validates: Requirements 2.3
 *
 * Property 3: MONGO_URI always includes required Atlas parameters
 *
 * For any MONGO_URI value passed to connectDB, the connection string used by
 * mongoose.connect should always contain both retryWrites=true and w=majority,
 * whether or not they were present in the original string.
 */
describe('Property 3: MONGO_URI always includes required Atlas parameters', () => {
  beforeEach(() => {
    mongoose.connect.mockClear();
  });

  it('always passes retryWrites=true and w=majority to mongoose.connect for any URI input', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate arbitrary URI-like strings (non-empty to avoid undefined behavior)
        fc.string({ minLength: 1 }),
        async (arbitraryUri) => {
          process.env.MONGO_URI = arbitraryUri;
          mongoose.connect.mockClear();

          await connectDB();

          expect(mongoose.connect).toHaveBeenCalledTimes(1);
          const calledUri = mongoose.connect.mock.calls[0][0];

          expect(calledUri).toContain('retryWrites=true');
          expect(calledUri).toContain('w=majority');
        }
      ),
      { numRuns: 100 }
    );
  });
});
