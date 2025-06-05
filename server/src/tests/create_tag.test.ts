
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tagsTable } from '../db/schema';
import { type CreateTagInput } from '../schema';
import { createTag } from '../handlers/create_tag';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateTagInput = {
  name: 'Test Tag',
  color: '#FF0000'
};

describe('createTag', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a tag with color', async () => {
    const result = await createTag(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Tag');
    expect(result.color).toEqual('#FF0000');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a tag without color', async () => {
    const inputWithoutColor: CreateTagInput = {
      name: 'Tag Without Color'
    };

    const result = await createTag(inputWithoutColor);

    expect(result.name).toEqual('Tag Without Color');
    expect(result.color).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save tag to database', async () => {
    const result = await createTag(testInput);

    // Query using proper drizzle syntax
    const tags = await db.select()
      .from(tagsTable)
      .where(eq(tagsTable.id, result.id))
      .execute();

    expect(tags).toHaveLength(1);
    expect(tags[0].name).toEqual('Test Tag');
    expect(tags[0].color).toEqual('#FF0000');
    expect(tags[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle tag names with special characters', async () => {
    const specialInput: CreateTagInput = {
      name: 'Tag with @#$% characters',
      color: '#00FF00'
    };

    const result = await createTag(specialInput);

    expect(result.name).toEqual('Tag with @#$% characters');
    expect(result.color).toEqual('#00FF00');
  });

  it('should reject duplicate tag names', async () => {
    // Create first tag
    await createTag(testInput);

    // Try to create duplicate tag - should throw error due to unique constraint
    await expect(createTag(testInput)).rejects.toThrow(/duplicate key value/i);
  });

  it('should handle null color properly', async () => {
    const inputWithNullColor: CreateTagInput = {
      name: 'Null Color Tag',
      color: null
    };

    const result = await createTag(inputWithNullColor);

    expect(result.name).toEqual('Null Color Tag');
    expect(result.color).toBeNull();
  });

  it('should handle long tag names', async () => {
    const longInput: CreateTagInput = {
      name: 'A'.repeat(255), // Very long name
      color: '#0000FF'
    };

    const result = await createTag(longInput);

    expect(result.name).toEqual('A'.repeat(255));
    expect(result.color).toEqual('#0000FF');
  });
});
