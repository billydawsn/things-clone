
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { areasTable } from '../db/schema';
import { type UpdateAreaInput, type CreateAreaInput } from '../schema';
import { updateArea } from '../handlers/update_area';
import { eq } from 'drizzle-orm';

// Helper function to create a test area
const createTestArea = async (input: CreateAreaInput = { name: 'Test Area', color: '#FF0000' }) => {
  const result = await db.insert(areasTable)
    .values({
      name: input.name,
      color: input.color || null
    })
    .returning()
    .execute();
  
  return result[0];
};

describe('updateArea', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update area name', async () => {
    // Create test area
    const testArea = await createTestArea();
    
    const updateInput: UpdateAreaInput = {
      id: testArea.id,
      name: 'Updated Area Name'
    };

    const result = await updateArea(updateInput);

    expect(result.id).toEqual(testArea.id);
    expect(result.name).toEqual('Updated Area Name');
    expect(result.color).toEqual(testArea.color);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(testArea.updated_at.getTime());
  });

  it('should update area color', async () => {
    // Create test area
    const testArea = await createTestArea();
    
    const updateInput: UpdateAreaInput = {
      id: testArea.id,
      color: '#00FF00'
    };

    const result = await updateArea(updateInput);

    expect(result.id).toEqual(testArea.id);
    expect(result.name).toEqual(testArea.name);
    expect(result.color).toEqual('#00FF00');
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(testArea.updated_at.getTime());
  });

  it('should update both name and color', async () => {
    // Create test area
    const testArea = await createTestArea();
    
    const updateInput: UpdateAreaInput = {
      id: testArea.id,
      name: 'New Area Name',
      color: '#0000FF'
    };

    const result = await updateArea(updateInput);

    expect(result.id).toEqual(testArea.id);
    expect(result.name).toEqual('New Area Name');
    expect(result.color).toEqual('#0000FF');
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(testArea.updated_at.getTime());
  });

  it('should set color to null', async () => {
    // Create test area with color
    const testArea = await createTestArea({ name: 'Test Area', color: '#FF0000' });
    
    const updateInput: UpdateAreaInput = {
      id: testArea.id,
      color: null
    };

    const result = await updateArea(updateInput);

    expect(result.id).toEqual(testArea.id);
    expect(result.name).toEqual(testArea.name);
    expect(result.color).toBeNull();
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update area in database', async () => {
    // Create test area
    const testArea = await createTestArea();
    
    const updateInput: UpdateAreaInput = {
      id: testArea.id,
      name: 'Database Updated Area',
      color: '#FFFF00'
    };

    await updateArea(updateInput);

    // Verify in database
    const areas = await db.select()
      .from(areasTable)
      .where(eq(areasTable.id, testArea.id))
      .execute();

    expect(areas).toHaveLength(1);
    expect(areas[0].name).toEqual('Database Updated Area');
    expect(areas[0].color).toEqual('#FFFF00');
    expect(areas[0].updated_at).toBeInstanceOf(Date);
    expect(areas[0].updated_at.getTime()).toBeGreaterThan(testArea.updated_at.getTime());
  });

  it('should throw error for non-existent area', async () => {
    const updateInput: UpdateAreaInput = {
      id: 999999,
      name: 'Non-existent Area'
    };

    await expect(updateArea(updateInput)).rejects.toThrow(/Area with id 999999 not found/i);
  });

  it('should only update provided fields', async () => {
    // Create test area
    const testArea = await createTestArea({ name: 'Original Name', color: '#FF0000' });
    
    // Update only name
    const updateInput: UpdateAreaInput = {
      id: testArea.id,
      name: 'New Name Only'
    };

    const result = await updateArea(updateInput);

    expect(result.name).toEqual('New Name Only');
    expect(result.color).toEqual('#FF0000'); // Should remain unchanged
  });

  it('should always update updated_at timestamp', async () => {
    // Create test area
    const testArea = await createTestArea();
    
    // Wait a bit to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const updateInput: UpdateAreaInput = {
      id: testArea.id,
      name: testArea.name // Same name, but should still update timestamp
    };

    const result = await updateArea(updateInput);

    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(testArea.updated_at.getTime());
  });
});
