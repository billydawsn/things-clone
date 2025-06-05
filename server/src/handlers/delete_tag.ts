
import { db } from '../db';
import { tagsTable } from '../db/schema';
import { type DeleteInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteTag = async (input: DeleteInput): Promise<void> => {
  try {
    await db.delete(tagsTable)
      .where(eq(tagsTable.id, input.id))
      .execute();
  } catch (error) {
    console.error('Tag deletion failed:', error);
    throw error;
  }
};
