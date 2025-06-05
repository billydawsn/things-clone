
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { areasTable, projectsTable, tasksTable } from '../db/schema';
import { type DeleteInput, type CreateAreaInput } from '../schema';
import { deleteArea } from '../handlers/delete_area';
import { eq } from 'drizzle-orm';

// Test input
const testInput: DeleteInput = {
  id: 1
};

const testAreaInput: CreateAreaInput = {
  name: 'Test Area',
  color: '#FF0000'
};

describe('deleteArea', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an area', async () => {
    // Create area first
    const [createdArea] = await db.insert(areasTable)
      .values({
        name: testAreaInput.name,
        color: testAreaInput.color
      })
      .returning()
      .execute();

    // Delete the area
    await deleteArea({ id: createdArea.id });

    // Verify area is deleted
    const areas = await db.select()
      .from(areasTable)
      .where(eq(areasTable.id, createdArea.id))
      .execute();

    expect(areas).toHaveLength(0);
  });

  it('should not throw error when deleting non-existent area', async () => {
    // Attempt to delete non-existent area - should complete without error
    await deleteArea({ id: 999 });
    
    // If we reach here, no error was thrown
    expect(true).toBe(true);
  });

  it('should handle area with associated projects (set null)', async () => {
    // Create area
    const [createdArea] = await db.insert(areasTable)
      .values({
        name: testAreaInput.name,
        color: testAreaInput.color
      })
      .returning()
      .execute();

    // Create project associated with area
    const [createdProject] = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        area_id: createdArea.id
      })
      .returning()
      .execute();

    // Delete the area
    await deleteArea({ id: createdArea.id });

    // Verify area is deleted
    const areas = await db.select()
      .from(areasTable)
      .where(eq(areasTable.id, createdArea.id))
      .execute();

    expect(areas).toHaveLength(0);

    // Verify project still exists but area_id is set to null
    const projects = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, createdProject.id))
      .execute();

    expect(projects).toHaveLength(1);
    expect(projects[0].area_id).toBeNull();
  });

  it('should handle area with associated tasks (set null)', async () => {
    // Create area
    const [createdArea] = await db.insert(areasTable)
      .values({
        name: testAreaInput.name,
        color: testAreaInput.color
      })
      .returning()
      .execute();

    // Create task associated with area
    const [createdTask] = await db.insert(tasksTable)
      .values({
        title: 'Test Task',
        area_id: createdArea.id
      })
      .returning()
      .execute();

    // Delete the area
    await deleteArea({ id: createdArea.id });

    // Verify area is deleted
    const areas = await db.select()
      .from(areasTable)
      .where(eq(areasTable.id, createdArea.id))
      .execute();

    expect(areas).toHaveLength(0);

    // Verify task still exists but area_id is set to null
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, createdTask.id))
      .execute();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].area_id).toBeNull();
  });

  it('should handle area with both projects and tasks', async () => {
    // Create area
    const [createdArea] = await db.insert(areasTable)
      .values({
        name: testAreaInput.name,
        color: testAreaInput.color
      })
      .returning()
      .execute();

    // Create project and task associated with area
    const [createdProject] = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        area_id: createdArea.id
      })
      .returning()
      .execute();

    const [createdTask] = await db.insert(tasksTable)
      .values({
        title: 'Test Task',
        area_id: createdArea.id
      })
      .returning()
      .execute();

    // Delete the area
    await deleteArea({ id: createdArea.id });

    // Verify area is deleted
    const areas = await db.select()
      .from(areasTable)
      .where(eq(areasTable.id, createdArea.id))
      .execute();

    expect(areas).toHaveLength(0);

    // Verify both project and task still exist with null area_id
    const projects = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, createdProject.id))
      .execute();

    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, createdTask.id))
      .execute();

    expect(projects).toHaveLength(1);
    expect(projects[0].area_id).toBeNull();
    expect(tasks).toHaveLength(1);
    expect(tasks[0].area_id).toBeNull();
  });
});
