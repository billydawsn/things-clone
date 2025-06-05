
import { db } from '../db';
import { projectsTable } from '../db/schema';
import { type DeleteInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteProject = async (input: DeleteInput): Promise<void> => {
  try {
    await db.delete(projectsTable)
      .where(eq(projectsTable.id, input.id))
      .execute();
  } catch (error) {
    console.error('Project deletion failed:', error);
    throw error;
  }
};
