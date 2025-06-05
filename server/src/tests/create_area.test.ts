
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { areasTable } from '../db/schema';
import { type CreateAreaInput } from '../schema';
import { createArea } from '../handlers/create_area';
import { eq } from 'drizzle-orm';

describe('createArea', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an area with all fields', async () => {
    const testInput: CreateAreaInput = {
      name: 'Test Area',
      color: '#FF5733'
    };

    const result = await createArea(testInput);

    // Verify returned data
    expect(result.name).toEqual('Test Area');
    expect(result.color).toEqual('#FF5733');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create an area with only required fields', async () => {
    const testInput: CreateAreaInput = {
      name: 'Minimal Area'
    };

    const result = await createArea(testInput);

    // Verify returned data
    expect(result.name).toEqual('Minimal Area');
    expect(result.color).toBeNull();
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create an area with null color explicitly', async () => {
    const testInput: CreateAreaInput = {
      name: 'Null Color Area',
      color: null
    };

    const result = await createArea(testInput);

    // Verify returned data
    expect(result.name).toEqual('Null Color Area');
    expect(result.color).toBeNull();
    expect(result.id).toBeDefined();
  });

  it('should save area to database correctly', async () => {
    const testInput: CreateAreaInput = {
      name: 'Database Test Area',
      color: '#00FF00'
    };

    const result = await createArea(testInput);

    // Query database to verify record was saved
    const areas = await db.select()
      .from(areasTable)
      .where(eq(areasTable.id, result.id))
      .execute();

    expect(areas).toHaveLength(1);
    expect(areas[0].name).toEqual('Database Test Area');
    expect(areas[0].color).toEqual('#00FF00');
    expect(areas[0].id).toEqual(result.id);
    expect(areas[0].created_at).toBeInstanceOf(Date);
    expect(areas[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle multiple area creation', async () => {
    const testInputs: CreateAreaInput[] = [
      { name: 'Area One', color: '#FF0000' },
      { name: 'Area Two', color: '#0000FF' },
      { name: 'Area Three' }
    ];

    const results = [];
    for (const input of testInputs) {
      results.push(await createArea(input));
    }

    // Verify all areas were created with unique IDs
    expect(results).toHaveLength(3);
    const ids = results.map(r => r.id);
    expect(new Set(ids).size).toEqual(3); // All IDs are unique

    // Verify database has all areas
    const allAreas = await db.select()
      .from(areasTable)
      .execute();

    expect(allAreas.length).toBeGreaterThanOrEqual(3);
    
    // Check each created area exists in database
    for (const result of results) {
      const foundArea = allAreas.find(a => a.id === result.id);
      expect(foundArea).toBeDefined();
      expect(foundArea!.name).toEqual(result.name);
      expect(foundArea!.color).toEqual(result.color);
    }
  });

  it('should handle empty string color as null', async () => {
    const testInput: CreateAreaInput = {
      name: 'Empty Color Area',
      color: ''
    };

    const result = await createArea(testInput);

    // Empty string should be converted to null by the handler logic
    expect(result.name).toEqual('Empty Color Area');
    expect(result.color).toBeNull();
  });

  it('should preserve timestamps accurately', async () => {
    const beforeCreation = new Date();
    
    const testInput: CreateAreaInput = {
      name: 'Timestamp Test Area'
    };

    const result = await createArea(testInput);
    
    const afterCreation = new Date();

    // Verify timestamps are within expected range
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.updated_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
  });
});
