
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { projectsTable, areasTable, tasksTable } from '../db/schema';
import { type DeleteInput, type CreateProjectInput } from '../schema';
import { deleteProject } from '../handlers/delete_project';
import { eq } from 'drizzle-orm';

// Test input for project deletion
const testDeleteInput: DeleteInput = {
  id: 1
};

describe('deleteProject', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a project', async () => {
    // Create a test area first (for foreign key constraint)
    const areaResult = await db.insert(areasTable)
      .values({
        name: 'Test Area',
        color: '#FF0000'
      })
      .returning()
      .execute();

    // Create a test project
    const projectInput: CreateProjectInput = {
      name: 'Test Project',
      description: 'A project for testing deletion',
      area_id: areaResult[0].id,
      color: '#00FF00'
    };

    const projectResult = await db.insert(projectsTable)
      .values({
        name: projectInput.name,
        description: projectInput.description,
        area_id: projectInput.area_id,
        color: projectInput.color
      })
      .returning()
      .execute();

    const projectId = projectResult[0].id;

    // Delete the project
    await deleteProject({ id: projectId });

    // Verify project was deleted
    const projects = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, projectId))
      .execute();

    expect(projects).toHaveLength(0);
  });

  it('should not affect other projects when deleting one', async () => {
    // Create a test area
    const areaResult = await db.insert(areasTable)
      .values({
        name: 'Test Area',
        color: '#FF0000'
      })
      .returning()
      .execute();

    // Create two test projects
    const project1Result = await db.insert(projectsTable)
      .values({
        name: 'Project One',
        description: 'First project',
        area_id: areaResult[0].id
      })
      .returning()
      .execute();

    const project2Result = await db.insert(projectsTable)
      .values({
        name: 'Project Two',
        description: 'Second project',
        area_id: areaResult[0].id
      })
      .returning()
      .execute();

    // Delete only the first project
    await deleteProject({ id: project1Result[0].id });

    // Verify first project was deleted
    const deletedProjects = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, project1Result[0].id))
      .execute();
    expect(deletedProjects).toHaveLength(0);

    // Verify second project still exists
    const remainingProjects = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, project2Result[0].id))
      .execute();
    expect(remainingProjects).toHaveLength(1);
    expect(remainingProjects[0].name).toEqual('Project Two');
  });

  it('should handle deleting non-existent project gracefully', async () => {
    // Attempt to delete a project that doesn't exist - should not throw
    try {
      await deleteProject({ id: 999 });
      // If we reach here, the operation completed without throwing
      expect(true).toBe(true);
    } catch (error) {
      // If an error is thrown, fail the test
      expect(error).toBeUndefined();
    }

    // Verify no projects exist in database
    const allProjects = await db.select()
      .from(projectsTable)
      .execute();
    expect(allProjects).toHaveLength(0);
  });

  it('should set task project_id to null when project is deleted', async () => {
    // Create a test area
    const areaResult = await db.insert(areasTable)
      .values({
        name: 'Test Area',
        color: '#FF0000'
      })
      .returning()
      .execute();

    // Create a test project
    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        description: 'A project with tasks',
        area_id: areaResult[0].id
      })
      .returning()
      .execute();

    // Create a task associated with the project
    const taskResult = await db.insert(tasksTable)
      .values({
        title: 'Test Task',
        notes: 'A task in the project',
        project_id: projectResult[0].id,
        area_id: areaResult[0].id
      })
      .returning()
      .execute();

    // Delete the project
    await deleteProject({ id: projectResult[0].id });

    // Verify task still exists but project_id is set to null
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskResult[0].id))
      .execute();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].project_id).toBeNull();
    expect(tasks[0].title).toEqual('Test Task');
    expect(tasks[0].area_id).toEqual(areaResult[0].id); // area_id should remain unchanged
  });
});
