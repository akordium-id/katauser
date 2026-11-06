import { describe, it, expect } from 'vitest';
import {
  userTraitsSchema,
  widgetIdentifySchema,
  calculateRevenueImpact,
  type VoterWithTraits,
} from '../src';

describe('User Traits & Revenue Calculation', () => {
  it('should validate valid user traits with plan and MRR', () => {
    const validTraits = {
      plan: 'pro',
      mrr: 150,
      company: 'Acme Corp',
      custom: { seats: 10, role: 'owner' },
    };

    const parsed = userTraitsSchema.safeParse(validTraits);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.mrr).toBe(150);
      expect(parsed.data.plan).toBe('pro');
    }
  });

  it('should validate widget identify schema including optional traits', () => {
    const payload = {
      workspaceSlug: 'acme',
      userId: 'usr_123',
      email: 'john@acme.com',
      name: 'John Doe',
      traits: {
        plan: 'enterprise',
        mrr: 1200,
        company: 'Megacorp',
      },
      hmacSignature: 'a8f5c...some_signature...',
    };

    const parsed = widgetIdentifySchema.safeParse(payload);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.traits?.mrr).toBe(1200);
      expect(parsed.data.traits?.plan).toBe('enterprise');
    }
  });

  it('should calculate total revenue impact and breakdown from a list of voters', () => {
    const voters: VoterWithTraits[] = [
      {
        userId: 'u1',
        traits: { plan: 'free', mrr: 0 },
      },
      {
        userId: 'u2',
        traits: { plan: 'starter', mrr: 49 },
      },
      {
        userId: 'u3',
        traits: { plan: 'pro', mrr: 199 },
      },
      {
        userId: 'u4',
        // Voter without traits
      },
    ];

    const result = calculateRevenueImpact(voters);
    expect(result.totalMrr).toBe(248);
    expect(result.payingVotersCount).toBe(2);
    expect(result.totalVotersCount).toBe(4);
    expect(result.formattedMrr).toBe('$248');
  });
});
