
import { db } from '../db';
import { areasTable } from '../db/schema';
import { type DeleteInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteArea = async (input: DeleteInput): Promise<void> => {
  try {
    await db.delete(areasTable)
      .where(eq(areasTable.id, input.id))
      .execute();
  } catch (error) {
    console.error('Area deletion failed:', error);
    throw error;
  }
};
