
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import { 
  createAreaInputSchema,
  updateAreaInputSchema,
  deleteInputSchema,
  createProjectInputSchema,
  updateProjectInputSchema,
  createTagInputSchema,
  createTaskInputSchema,
  updateTaskInputSchema,
  getTasksByAreaInputSchema,
  getTasksByProjectInputSchema
} from './schema';

// Import handlers
import { createArea } from './handlers/create_area';
import { getAreas } from './handlers/get_areas';
import { updateArea } from './handlers/update_area';
import { deleteArea } from './handlers/delete_area';
import { createProject } from './handlers/create_project';
import { getProjects } from './handlers/get_projects';
import { getProjectsByArea } from './handlers/get_projects_by_area';
import { updateProject } from './handlers/update_project';
import { deleteProject } from './handlers/delete_project';
import { createTag } from './handlers/create_tag';
import { getTags } from './handlers/get_tags';
import { deleteTag } from './handlers/delete_tag';
import { createTask } from './handlers/create_task';
import { getTasks } from './handlers/get_tasks';
import { getTasksByArea } from './handlers/get_tasks_by_area';
import { getTasksByProject } from './handlers/get_tasks_by_project';
import { getTodayTasks } from './handlers/get_today_tasks';
import { updateTask } from './handlers/update_task';
import { deleteTask } from './handlers/delete_task';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Area operations
  createArea: publicProcedure
    .input(createAreaInputSchema)
    .mutation(({ input }) => createArea(input)),
  getAreas: publicProcedure
    .query(() => getAreas()),
  updateArea: publicProcedure
    .input(updateAreaInputSchema)
    .mutation(({ input }) => updateArea(input)),
  deleteArea: publicProcedure
    .input(deleteInputSchema)
    .mutation(({ input }) => deleteArea(input)),

  // Project operations
  createProject: publicProcedure
    .input(createProjectInputSchema)
    .mutation(({ input }) => createProject(input)),
  getProjects: publicProcedure
    .query(() => getProjects()),
  getProjectsByArea: publicProcedure
    .input(getTasksByAreaInputSchema)
    .query(({ input }) => getProjectsByArea(input)),
  updateProject: publicProcedure
    .input(updateProjectInputSchema)
    .mutation(({ input }) => updateProject(input)),
  deleteProject: publicProcedure
    .input(deleteInputSchema)
    .mutation(({ input }) => deleteProject(input)),

  // Tag operations
  createTag: publicProcedure
    .input(createTagInputSchema)
    .mutation(({ input }) => createTag(input)),
  getTags: publicProcedure
    .query(() => getTags()),
  deleteTag: publicProcedure
    .input(deleteInputSchema)
    .mutation(({ input }) => deleteTag(input)),

  // Task operations
  createTask: publicProcedure
    .input(createTaskInputSchema)
    .mutation(({ input }) => createTask(input)),
  getTasks: publicProcedure
    .query(() => getTasks()),
  getTasksByArea: publicProcedure
    .input(getTasksByAreaInputSchema)
    .query(({ input }) => getTasksByArea(input)),
  getTasksByProject: publicProcedure
    .input(getTasksByProjectInputSchema)
    .query(({ input }) => getTasksByProject(input)),
  getTodayTasks: publicProcedure
    .query(() => getTodayTasks()),
  updateTask: publicProcedure
    .input(updateTaskInputSchema)
    .mutation(({ input }) => updateTask(input)),
  deleteTask: publicProcedure
    .input(deleteInputSchema)
    .mutation(({ input }) => deleteTask(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
