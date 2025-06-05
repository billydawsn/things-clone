
import { db } from '../db';
import { areasTable } from '../db/schema';
import { type CreateAreaInput, type Area } from '../schema';

export const createArea = async (input: CreateAreaInput): Promise<Area> => {
  try {
    // Insert area record
    const result = await db.insert(areasTable)
      .values({
        name: input.name,
        color: input.color || null
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Area creation failed:', error);
    throw error;
  }
};
