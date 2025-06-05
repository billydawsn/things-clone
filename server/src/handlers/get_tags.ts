
import { db } from '../db';
import { tagsTable } from '../db/schema';
import { type Tag } from '../schema';

export const getTags = async (): Promise<Tag[]> => {
  try {
    const result = await db.select()
      .from(tagsTable)
      .execute();

    return result;
  } catch (error) {
    console.error('Get tags failed:', error);
    throw error;
  }
};
