
import { db } from '../db';
import { tagsTable } from '../db/schema';
import { type CreateTagInput, type Tag } from '../schema';

export const createTag = async (input: CreateTagInput): Promise<Tag> => {
  try {
    // Insert tag record
    const result = await db.insert(tagsTable)
      .values({
        name: input.name,
        color: input.color
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Tag creation failed:', error);
    throw error;
  }
};
