
import { db } from '../db';
import { areasTable } from '../db/schema';
import { type Area } from '../schema';

export const getAreas = async (): Promise<Area[]> => {
  try {
    const result = await db.select()
      .from(areasTable)
      .execute();

    return result;
  } catch (error) {
    console.error('Failed to get areas:', error);
    throw error;
  }
};
