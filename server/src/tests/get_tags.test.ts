
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tagsTable } from '../db/schema';
import { type CreateTagInput } from '../schema';
import { getTags } from '../handlers/get_tags';

describe('getTags', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no tags exist', async () => {
    const result = await getTags();
    expect(result).toEqual([]);
  });

  it('should return all tags when tags exist', async () => {
    // Create test tags
    const testTags = [
      { name: 'Work', color: '#ff0000' },
      { name: 'Personal', color: '#00ff00' },
      { name: 'Urgent', color: null }
    ];

    for (const tag of testTags) {
      await db.insert(tagsTable)
        .values(tag)
        .execute();
    }

    const result = await getTags();

    expect(result).toHaveLength(3);
    
    // Check that all tags are returned
    const tagNames = result.map(tag => tag.name).sort();
    expect(tagNames).toEqual(['Personal', 'Urgent', 'Work']);

    // Check specific tag properties
    const workTag = result.find(tag => tag.name === 'Work');
    expect(workTag).toBeDefined();
    expect(workTag!.color).toEqual('#ff0000');
    expect(workTag!.id).toBeDefined();
    expect(workTag!.created_at).toBeInstanceOf(Date);

    const urgentTag = result.find(tag => tag.name === 'Urgent');
    expect(urgentTag).toBeDefined();
    expect(urgentTag!.color).toBeNull();
  });

  it('should return tags in creation order', async () => {
    // Create tags in specific order
    const firstTag = await db.insert(tagsTable)
      .values({ name: 'First', color: '#111111' })
      .returning()
      .execute();

    const secondTag = await db.insert(tagsTable)
      .values({ name: 'Second', color: '#222222' })
      .returning()
      .execute();

    const result = await getTags();

    expect(result).toHaveLength(2);
    // Tags should be returned in the order they were created (by ID)
    expect(result[0].name).toEqual('First');
    expect(result[1].name).toEqual('Second');
    expect(result[0].id).toBeLessThan(result[1].id);
  });

  it('should handle tags with various color formats', async () => {
    // Create tags with different color formats
    const testTags = [
      { name: 'Hex', color: '#ff0000' },
      { name: 'RGB', color: 'rgb(255, 0, 0)' },
      { name: 'Named', color: 'red' },
      { name: 'Empty', color: '' },
      { name: 'Null', color: null }
    ];

    for (const tag of testTags) {
      await db.insert(tagsTable)
        .values(tag)
        .execute();
    }

    const result = await getTags();

    expect(result).toHaveLength(5);

    const hexTag = result.find(tag => tag.name === 'Hex');
    expect(hexTag!.color).toEqual('#ff0000');

    const rgbTag = result.find(tag => tag.name === 'RGB');
    expect(rgbTag!.color).toEqual('rgb(255, 0, 0)');

    const namedTag = result.find(tag => tag.name === 'Named');
    expect(namedTag!.color).toEqual('red');

    const emptyTag = result.find(tag => tag.name === 'Empty');
    expect(emptyTag!.color).toEqual('');

    const nullTag = result.find(tag => tag.name === 'Null');
    expect(nullTag!.color).toBeNull();
  });

  it('should return correct tag properties', async () => {
    await db.insert(tagsTable)
      .values({ name: 'Test Tag', color: '#123456' })
      .execute();

    const result = await getTags();

    expect(result).toHaveLength(1);
    const tag = result[0];

    // Check all expected properties exist
    expect(tag.id).toBeDefined();
    expect(typeof tag.id).toBe('number');
    expect(tag.name).toEqual('Test Tag');
    expect(tag.color).toEqual('#123456');
    expect(tag.created_at).toBeInstanceOf(Date);

    // Verify created_at is recent
    const now = new Date();
    const timeDiff = now.getTime() - tag.created_at.getTime();
    expect(timeDiff).toBeLessThan(1000); // Within 1 second
  });
});
