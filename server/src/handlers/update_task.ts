
import { db } from '../db';
import { tasksTable, taskTagsTable } from '../db/schema';
import { type UpdateTaskInput, type Task } from '../schema';
import { eq } from 'drizzle-orm';

export const updateTask = async (input: UpdateTaskInput): Promise<Task> => {
  try {
    const { id, tag_ids, ...updateData } = input;

    // Handle completion logic
    const updatePayload: any = {
      ...updateData,
      updated_at: new Date()
    };

    // If is_completed is being set to true and completed_at isn't already set, set it
    if (updateData.is_completed === true) {
      updatePayload.completed_at = new Date();
    }
    // If is_completed is being set to false, clear completed_at
    else if (updateData.is_completed === false) {
      updatePayload.completed_at = null;
    }

    // Update the task
    const result = await db.update(tasksTable)
      .set(updatePayload)
      .where(eq(tasksTable.id, id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Task with id ${id} not found`);
    }

    // Handle tag associations if provided
    if (tag_ids !== undefined) {
      // Remove existing tag associations
      await db.delete(taskTagsTable)
        .where(eq(taskTagsTable.task_id, id))
        .execute();

      // Add new tag associations
      if (tag_ids.length > 0) {
        const tagInserts = tag_ids.map(tag_id => ({
          task_id: id,
          tag_id
        }));

        await db.insert(taskTagsTable)
          .values(tagInserts)
          .execute();
      }
    }

    return result[0];
  } catch (error) {
    console.error('Task update failed:', error);
    throw error;
  }
};
