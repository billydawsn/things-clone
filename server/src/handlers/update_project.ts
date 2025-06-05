
import { db } from '../db';
import { projectsTable } from '../db/schema';
import { type UpdateProjectInput, type Project } from '../schema';
import { eq } from 'drizzle-orm';

export const updateProject = async (input: UpdateProjectInput): Promise<Project> => {
  try {
    // Build update object with only provided fields
    const updateData: any = {};
    
    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    
    if (input.area_id !== undefined) {
      updateData.area_id = input.area_id;
    }
    
    if (input.color !== undefined) {
      updateData.color = input.color;
    }
    
    if (input.is_completed !== undefined) {
      updateData.is_completed = input.is_completed;
      // Set completed_at timestamp if marking as completed
      if (input.is_completed) {
        updateData.completed_at = new Date();
      } else {
        updateData.completed_at = null;
      }
    }
    
    // Always update the updated_at timestamp
    updateData.updated_at = new Date();

    // Update project record
    const result = await db.update(projectsTable)
      .set(updateData)
      .where(eq(projectsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Project with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Project update failed:', error);
    throw error;
  }
};
