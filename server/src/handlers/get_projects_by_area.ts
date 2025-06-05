
import { db } from '../db';
import { projectsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type GetTasksByAreaInput, type Project } from '../schema';

export const getProjectsByArea = async (input: GetTasksByAreaInput): Promise<Project[]> => {
  try {
    const results = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.area_id, input.area_id))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to get projects by area:', error);
    throw error;
  }
};
