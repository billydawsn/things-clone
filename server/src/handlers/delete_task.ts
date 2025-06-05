
import { db } from '../db';
import { tasksTable, taskTagsTable } from '../db/schema';
import { type DeleteInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteTask = async (input: DeleteInput): Promise<void> => {
  try {
    // Delete task-tag relationships first (cascade should handle this, but being explicit)
    await db.delete(taskTagsTable)
      .where(eq(taskTagsTable.task_id, input.id))
      .execute();

    // Delete the task
    await db.delete(tasksTable)
      .where(eq(tasksTable.id, input.id))
      .execute();
  } catch (error) {
    console.error('Task deletion failed:', error);
    throw error;
  }
};
