import { randomUUID } from "crypto";
import { Database } from "./database.js";
import { buildRoutePath } from "./utils/build-route-path.js";

const database = new Database();

export const routes = [
  {
    method: "GET",
    path: buildRoutePath("/tasks"),
    handler: (req, res) => {
      const { search } = req.query;

      const tasks = database.select(
        "tasks",
        search ? { title: search, description: search } : null
      );

      return res.end(JSON.stringify(tasks));
    },
  },
  {
    method: "POST",
    path: buildRoutePath("/tasks"),
    handler: (req, res) => {
      const { title, description } = req.body;

      if (!validateTitle(title)) {
        return res
          .writeHead(400)
          .end(JSON.stringify({ error: 400, message: "Title is required" }));
      }

      if (!validateDescription(description)) {
        return res
          .writeHead(400)
          .end(
            JSON.stringify({ error: 400, message: "Description is required" })
          );
      }

      const newTask = {
        id: randomUUID(),
        title,
        description,
        completed_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      database.insert("tasks", newTask);

      return res.writeHead(201).end(JSON.stringify(newTask));
    },
  },
  {
    method: "PUT",
    path: buildRoutePath("/tasks/:id"),
    handler: async (req, res) => {
      const { id } = req.params;

      const { title, description } = req.body;

      if (!validateTitle(title) && !validateDescription(description)) {
        return res.writeHead(400).end(
          JSON.stringify({
            error: 400,
            message: "Title or Description is required",
          })
        );
      }

      const taskToBeUpdated = database.selectByID("tasks", id);

      if (taskToBeUpdated === null) {
        return res
          .writeHead(404)
          .end(JSON.stringify({ error: 404, message: "Task Not Found" }));
      }

      taskToBeUpdated.title = validateTitle(title)
        ? title
        : taskToBeUpdated.title;

      taskToBeUpdated.description = validateDescription(description)
        ? description
        : taskToBeUpdated.description;
      taskToBeUpdated.updated_at = new Date();

      await database.update("tasks", taskToBeUpdated);
      return res.writeHead(200).end(JSON.stringify(taskToBeUpdated));
    },
  },
  {
    method: "PATCH",
    path: buildRoutePath("/tasks/:id/complete"),
    handler: async (req, res) => {
      const { id } = req.params;

      const taskToBeUpdated = database.selectByID("tasks", id);

      if (taskToBeUpdated === null) {
        return res
          .writeHead(404)
          .end(JSON.stringify({ error: 404, message: "Task Not Found" }));
      }

      taskToBeUpdated.completed_at =
        taskToBeUpdated.completed_at === null ? new Date() : null;

      await database.update("tasks", taskToBeUpdated);
      return res.writeHead(200).end(JSON.stringify(taskToBeUpdated));
    },
  },
  {
    method: "DELETE",
    path: buildRoutePath("/tasks/:id"),
    handler: (req, res) => {
      const { id } = req.params;

      if (database.delete("tasks", id)) {
        res.writeHead(204).end();
      } else {
        res
          .writeHead(404)
          .end(JSON.stringify({ error: 404, message: "Task Not Found" }));
      }
    },
  },
];

function validateTitle(title) {
  return title && title.length > 0 ? true : false;
}

function validateDescription(description) {
  return description && description.length > 0 ? true : false;
}
