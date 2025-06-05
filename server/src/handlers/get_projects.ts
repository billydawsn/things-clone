
import { db } from '../db';
import { projectsTable, areasTable } from '../db/schema';
import { type Project } from '../schema';
import { eq } from 'drizzle-orm';

export const getProjects = async (): Promise<Project[]> => {
  try {
    // Use left join to include area information for projects that have areas
    const results = await db.select({
      id: projectsTable.id,
      name: projectsTable.name,
      description: projectsTable.description,
      area_id: projectsTable.area_id,
      color: projectsTable.color,
      is_completed: projectsTable.is_completed,
      completed_at: projectsTable.completed_at,
      created_at: projectsTable.created_at,
      updated_at: projectsTable.updated_at
    })
      .from(projectsTable)
      .leftJoin(areasTable, eq(projectsTable.area_id, areasTable.id))
      .execute();

    return results.map(result => ({
      id: result.id,
      name: result.name,
      description: result.description,
      area_id: result.area_id,
      color: result.color,
      is_completed: result.is_completed,
      completed_at: result.completed_at,
      created_at: result.created_at,
      updated_at: result.updated_at
    }));
  } catch (error) {
    console.error('Failed to get projects:', error);
    throw error;
  }
};
