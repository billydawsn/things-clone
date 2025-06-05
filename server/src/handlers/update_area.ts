
import { db } from '../db';
import { areasTable } from '../db/schema';
import { type UpdateAreaInput, type Area } from '../schema';
import { eq } from 'drizzle-orm';

export const updateArea = async (input: UpdateAreaInput): Promise<Area> => {
  try {
    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date() // Always update the timestamp
    };

    if (input.name !== undefined) {
      updateData.name = input.name;
    }

    if (input.color !== undefined) {
      updateData.color = input.color;
    }

    // Update the area record
    const result = await db.update(areasTable)
      .set(updateData)
      .where(eq(areasTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Area with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Area update failed:', error);
    throw error;
  }
};
