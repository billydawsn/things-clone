
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { areasTable } from '../db/schema';
import { getAreas } from '../handlers/get_areas';

describe('getAreas', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no areas exist', async () => {
    const result = await getAreas();
    
    expect(result).toEqual([]);
  });

  it('should return all areas', async () => {
    // Create test areas
    await db.insert(areasTable)
      .values([
        {
          name: 'Work',
          color: '#ff0000'
        },
        {
          name: 'Personal', 
          color: '#00ff00'
        },
        {
          name: 'Health',
          color: null
        }
      ])
      .execute();

    const result = await getAreas();

    expect(result).toHaveLength(3);
    
    // Check that all areas are returned
    const areaNames = result.map(area => area.name).sort();
    expect(areaNames).toEqual(['Health', 'Personal', 'Work']);
    
    // Check that fields are properly structured
    result.forEach(area => {
      expect(area.id).toBeDefined();
      expect(typeof area.name).toBe('string');
      expect(area.color === null || typeof area.color === 'string').toBe(true);
      expect(area.created_at).toBeInstanceOf(Date);
      expect(area.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should return areas with correct field types', async () => {
    // Create a single test area
    await db.insert(areasTable)
      .values({
        name: 'Test Area',
        color: '#123456'
      })
      .execute();

    const result = await getAreas();

    expect(result).toHaveLength(1);
    
    const area = result[0];
    expect(typeof area.id).toBe('number');
    expect(typeof area.name).toBe('string');
    expect(typeof area.color).toBe('string');
    expect(area.created_at).toBeInstanceOf(Date);
    expect(area.updated_at).toBeInstanceOf(Date);
    
    expect(area.name).toEqual('Test Area');
    expect(area.color).toEqual('#123456');
  });
});
