
import { db } from '../db';
import { projectsTable, areasTable } from '../db/schema';
import { type CreateProjectInput, type Project } from '../schema';
import { eq } from 'drizzle-orm';

export const createProject = async (input: CreateProjectInput): Promise<Project> => {
  try {
    // Validate area exists if area_id is provided
    if (input.area_id) {
      const area = await db.select()
        .from(areasTable)
        .where(eq(areasTable.id, input.area_id))
        .execute();
      
      if (area.length === 0) {
        throw new Error(`Area with id ${input.area_id} does not exist`);
      }
    }

    // Insert project record
    const result = await db.insert(projectsTable)
      .values({
        name: input.name,
        description: input.description ?? null,
        area_id: input.area_id ?? null,
        color: input.color ?? null
      })
      .returning()
      .execute();

    const project = result[0];
    return {
      ...project,
      created_at: project.created_at,
      updated_at: project.updated_at
    };
  } catch (error) {
    console.error('Project creation failed:', error);
    throw error;
  }
};
