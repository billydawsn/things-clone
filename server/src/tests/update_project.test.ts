
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { areasTable, projectsTable } from '../db/schema';
import { type UpdateProjectInput } from '../schema';
import { updateProject } from '../handlers/update_project';
import { eq } from 'drizzle-orm';

describe('updateProject', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update project name', async () => {
    // Create test project
    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Original Project',
        description: 'Original description',
        is_completed: false
      })
      .returning()
      .execute();

    const projectId = projectResult[0].id;

    const input: UpdateProjectInput = {
      id: projectId,
      name: 'Updated Project Name'
    };

    const result = await updateProject(input);

    expect(result.id).toEqual(projectId);
    expect(result.name).toEqual('Updated Project Name');
    expect(result.description).toEqual('Original description'); // Should remain unchanged
    expect(result.is_completed).toEqual(false); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update project description', async () => {
    // Create test project
    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        description: 'Original description',
        is_completed: false
      })
      .returning()
      .execute();

    const projectId = projectResult[0].id;

    const input: UpdateProjectInput = {
      id: projectId,
      description: 'Updated description'
    };

    const result = await updateProject(input);

    expect(result.id).toEqual(projectId);
    expect(result.name).toEqual('Test Project'); // Should remain unchanged
    expect(result.description).toEqual('Updated description');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update project area_id', async () => {
    // Create test area
    const areaResult = await db.insert(areasTable)
      .values({
        name: 'Test Area',
        color: '#ff0000'
      })
      .returning()
      .execute();

    const areaId = areaResult[0].id;

    // Create test project
    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        description: 'Test description',
        is_completed: false
      })
      .returning()
      .execute();

    const projectId = projectResult[0].id;

    const input: UpdateProjectInput = {
      id: projectId,
      area_id: areaId
    };

    const result = await updateProject(input);

    expect(result.id).toEqual(projectId);
    expect(result.area_id).toEqual(areaId);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update project color', async () => {
    // Create test project
    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        description: 'Test description',
        is_completed: false
      })
      .returning()
      .execute();

    const projectId = projectResult[0].id;

    const input: UpdateProjectInput = {
      id: projectId,
      color: '#00ff00'
    };

    const result = await updateProject(input);

    expect(result.id).toEqual(projectId);
    expect(result.color).toEqual('#00ff00');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should mark project as completed and set completed_at', async () => {
    // Create test project
    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        description: 'Test description',
        is_completed: false
      })
      .returning()
      .execute();

    const projectId = projectResult[0].id;

    const input: UpdateProjectInput = {
      id: projectId,
      is_completed: true
    };

    const result = await updateProject(input);

    expect(result.id).toEqual(projectId);
    expect(result.is_completed).toEqual(true);
    expect(result.completed_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should mark project as not completed and clear completed_at', async () => {
    // Create test project that's already completed
    const completedAt = new Date();
    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        description: 'Test description',
        is_completed: true,
        completed_at: completedAt
      })
      .returning()
      .execute();

    const projectId = projectResult[0].id;

    const input: UpdateProjectInput = {
      id: projectId,
      is_completed: false
    };

    const result = await updateProject(input);

    expect(result.id).toEqual(projectId);
    expect(result.is_completed).toEqual(false);
    expect(result.completed_at).toBeNull();
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update multiple fields at once', async () => {
    // Create test area
    const areaResult = await db.insert(areasTable)
      .values({
        name: 'Test Area',
        color: '#ff0000'
      })
      .returning()
      .execute();

    const areaId = areaResult[0].id;

    // Create test project
    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Original Project',
        description: 'Original description',
        is_completed: false
      })
      .returning()
      .execute();

    const projectId = projectResult[0].id;

    const input: UpdateProjectInput = {
      id: projectId,
      name: 'Updated Project',
      description: 'Updated description',
      area_id: areaId,
      color: '#0000ff',
      is_completed: true
    };

    const result = await updateProject(input);

    expect(result.id).toEqual(projectId);
    expect(result.name).toEqual('Updated Project');
    expect(result.description).toEqual('Updated description');
    expect(result.area_id).toEqual(areaId);
    expect(result.color).toEqual('#0000ff');
    expect(result.is_completed).toEqual(true);
    expect(result.completed_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save changes to database', async () => {
    // Create test project
    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Original Project',
        description: 'Original description',
        is_completed: false
      })
      .returning()
      .execute();

    const projectId = projectResult[0].id;

    const input: UpdateProjectInput = {
      id: projectId,
      name: 'Database Updated Project'
    };

    await updateProject(input);

    // Verify changes were saved to database
    const projects = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, projectId))
      .execute();

    expect(projects).toHaveLength(1);
    expect(projects[0].name).toEqual('Database Updated Project');
    expect(projects[0].description).toEqual('Original description');
    expect(projects[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent project', async () => {
    const input: UpdateProjectInput = {
      id: 99999,
      name: 'Non-existent Project'
    };

    expect(updateProject(input)).rejects.toThrow(/Project with id 99999 not found/i);
  });

  it('should update area_id to null', async () => {
    // Create test area
    const areaResult = await db.insert(areasTable)
      .values({
        name: 'Test Area',
        color: '#ff0000'
      })
      .returning()
      .execute();

    const areaId = areaResult[0].id;

    // Create test project with area
    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        description: 'Test description',
        area_id: areaId,
        is_completed: false
      })
      .returning()
      .execute();

    const projectId = projectResult[0].id;

    const input: UpdateProjectInput = {
      id: projectId,
      area_id: null
    };

    const result = await updateProject(input);

    expect(result.id).toEqual(projectId);
    expect(result.area_id).toBeNull();
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should handle nullable fields correctly', async () => {
    // Create test project
    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        description: 'Original description',
        color: '#ff0000',
        is_completed: false
      })
      .returning()
      .execute();

    const projectId = projectResult[0].id;

    const input: UpdateProjectInput = {
      id: projectId,
      description: null,
      color: null
    };

    const result = await updateProject(input);

    expect(result.id).toEqual(projectId);
    expect(result.description).toBeNull();
    expect(result.color).toBeNull();
    expect(result.updated_at).toBeInstanceOf(Date);
  });
});
