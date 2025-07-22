import { describe, it, expect } from 'vitest';

import { add } from '../src/main';

describe('add', () => {
  it('adds two numbers', () => {
    expect(add(2, 3)).toBe(5);
    expect(add(-1, 1)).toBe(0);
  });
});
