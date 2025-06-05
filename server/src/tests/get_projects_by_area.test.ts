
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { areasTable, projectsTable } from '../db/schema';
import { type GetTasksByAreaInput } from '../schema';
import { getProjectsByArea } from '../handlers/get_projects_by_area';

// Test input
const testInput: GetTasksByAreaInput = {
  area_id: 1
};

describe('getProjectsByArea', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return projects for a specific area', async () => {
    // Create test area
    const areaResult = await db.insert(areasTable)
      .values({
        name: 'Test Area',
        color: '#blue'
      })
      .returning()
      .execute();

    const areaId = areaResult[0].id;

    // Create test projects
    await db.insert(projectsTable)
      .values([
        {
          name: 'Project 1',
          description: 'First project',
          area_id: areaId,
          color: '#red',
          is_completed: false
        },
        {
          name: 'Project 2',
          description: 'Second project',
          area_id: areaId,
          color: '#green',
          is_completed: true
        }
      ])
      .execute();

    // Create project in different area
    const otherAreaResult = await db.insert(areasTable)
      .values({
        name: 'Other Area',
        color: '#yellow'
      })
      .returning()
      .execute();

    await db.insert(projectsTable)
      .values({
        name: 'Other Project',
        description: 'Project in different area',
        area_id: otherAreaResult[0].id,
        color: '#purple',
        is_completed: false
      })
      .execute();

    const result = await getProjectsByArea({ area_id: areaId });

    expect(result).toHaveLength(2);
    expect(result[0].name).toEqual('Project 1');
    expect(result[0].area_id).toEqual(areaId);
    expect(result[0].is_completed).toEqual(false);
    expect(result[1].name).toEqual('Project 2');
    expect(result[1].area_id).toEqual(areaId);
    expect(result[1].is_completed).toEqual(true);
  });

  it('should return empty array when no projects exist for area', async () => {
    // Create test area without projects
    const areaResult = await db.insert(areasTable)
      .values({
        name: 'Empty Area',
        color: '#blue'
      })
      .returning()
      .execute();

    const result = await getProjectsByArea({ area_id: areaResult[0].id });

    expect(result).toHaveLength(0);
  });

  it('should return empty array for non-existent area', async () => {
    const result = await getProjectsByArea({ area_id: 999 });

    expect(result).toHaveLength(0);
  });

  it('should return projects with all required fields', async () => {
    // Create test area
    const areaResult = await db.insert(areasTable)
      .values({
        name: 'Test Area',
        color: '#blue'
      })
      .returning()
      .execute();

    // Create test project
    await db.insert(projectsTable)
      .values({
        name: 'Complete Project',
        description: 'A fully specified project',
        area_id: areaResult[0].id,
        color: '#orange',
        is_completed: false
      })
      .execute();

    const result = await getProjectsByArea({ area_id: areaResult[0].id });

    expect(result).toHaveLength(1);
    const project = result[0];
    expect(project.id).toBeDefined();
    expect(project.name).toEqual('Complete Project');
    expect(project.description).toEqual('A fully specified project');
    expect(project.area_id).toEqual(areaResult[0].id);
    expect(project.color).toEqual('#orange');
    expect(project.is_completed).toEqual(false);
    expect(project.completed_at).toBeNull();
    expect(project.created_at).toBeInstanceOf(Date);
    expect(project.updated_at).toBeInstanceOf(Date);
  });
});
