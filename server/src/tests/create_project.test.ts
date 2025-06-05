
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { projectsTable, areasTable } from '../db/schema';
import { type CreateProjectInput } from '../schema';
import { createProject } from '../handlers/create_project';
import { eq } from 'drizzle-orm';

// Test input with all optional fields
const testInputComplete: CreateProjectInput = {
  name: 'Test Project',
  description: 'A project for testing',
  area_id: 1,
  color: '#FF5733'
};

// Test input with minimal required fields
const testInputMinimal: CreateProjectInput = {
  name: 'Minimal Project'
};

describe('createProject', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a project with all fields', async () => {
    // First create an area for testing area_id relationship
    await db.insert(areasTable)
      .values({
        name: 'Test Area',
        color: '#000000'
      })
      .execute();

    const result = await createProject(testInputComplete);

    // Basic field validation
    expect(result.name).toEqual('Test Project');
    expect(result.description).toEqual('A project for testing');
    expect(result.area_id).toEqual(1);
    expect(result.color).toEqual('#FF5733');
    expect(result.is_completed).toEqual(false);
    expect(result.completed_at).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a project with minimal fields', async () => {
    const result = await createProject(testInputMinimal);

    // Basic field validation
    expect(result.name).toEqual('Minimal Project');
    expect(result.description).toBeNull();
    expect(result.area_id).toBeNull();
    expect(result.color).toBeNull();
    expect(result.is_completed).toEqual(false);
    expect(result.completed_at).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save project to database', async () => {
    const result = await createProject(testInputMinimal);

    // Query using proper drizzle syntax
    const projects = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, result.id))
      .execute();

    expect(projects).toHaveLength(1);
    expect(projects[0].name).toEqual('Minimal Project');
    expect(projects[0].description).toBeNull();
    expect(projects[0].area_id).toBeNull();
    expect(projects[0].color).toBeNull();
    expect(projects[0].is_completed).toEqual(false);
    expect(projects[0].created_at).toBeInstanceOf(Date);
    expect(projects[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle null optional fields correctly', async () => {
    const inputWithNulls: CreateProjectInput = {
      name: 'Project with Nulls',
      description: null,
      area_id: null,
      color: null
    };

    const result = await createProject(inputWithNulls);

    expect(result.name).toEqual('Project with Nulls');
    expect(result.description).toBeNull();
    expect(result.area_id).toBeNull();
    expect(result.color).toBeNull();
  });

  it('should throw error when area_id references non-existent area', async () => {
    const inputWithInvalidArea: CreateProjectInput = {
      name: 'Project with Invalid Area',
      area_id: 999 // Non-existent area ID
    };

    expect(createProject(inputWithInvalidArea)).rejects.toThrow(/Area with id 999 does not exist/i);
  });

  it('should create project successfully when area_id references existing area', async () => {
    // Create an area first
    const areaResult = await db.insert(areasTable)
      .values({
        name: 'Valid Area',
        color: '#123456'
      })
      .returning()
      .execute();

    const inputWithValidArea: CreateProjectInput = {
      name: 'Project with Valid Area',
      area_id: areaResult[0].id
    };

    const result = await createProject(inputWithValidArea);

    expect(result.name).toEqual('Project with Valid Area');
    expect(result.area_id).toEqual(areaResult[0].id);
  });

  it('should set timestamps correctly', async () => {
    const before = new Date();
    const result = await createProject(testInputMinimal);
    const after = new Date();

    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(after.getTime());
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(result.updated_at.getTime()).toBeLessThanOrEqual(after.getTime());
  });
});
