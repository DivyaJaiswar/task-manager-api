import { Database } from "bun:sqlite";

const db = new Database("tasks.db");

// CREATE TABLES
db.run(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL
);
`);

db.run(`
CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  user_id INTEGER,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
`);

db.run(`
CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  project_id INTEGER,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);
`);

Bun.serve({
  port: 3000,

  async fetch(req) {
    const url = new URL(req.url);
    const method = req.method as string;

    // ================= USERS =================

    if (url.pathname === "/users" && method === "GET") {
      const users = db.query("SELECT * FROM users").all();
      return Response.json(users);
    }

    if (url.pathname === "/users" && method === "POST") {
      const body: any = await req.json();

      if (!body.name || !body.email) {
        return new Response(JSON.stringify({ error: "Name and email required" }), { status: 400 });
      }

      const result = db
        .query("INSERT INTO users (name, email) VALUES (?, ?)")
        .run(body.name, body.email);

      return new Response(
        JSON.stringify({ id: result.lastInsertRowid, name: body.name, email: body.email }),
        { status: 201 }
      );
    }

    if (url.pathname.startsWith("/users/") && method === "GET") {
      const id = Number(url.pathname.split("/")[2]);
      const user = db.query("SELECT * FROM users WHERE id = ?").get(id);

      if (!user) {
        return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
      }

      return Response.json(user);
    }

    if (url.pathname.startsWith("/users/") && method === "PUT") {
      const id = Number(url.pathname.split("/")[2]);
      const body: any = await req.json();

      const result = db
        .query("UPDATE users SET name = ?, email = ? WHERE id = ?")
        .run(body.name, body.email, id);

      if (result.changes === 0) {
        return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
      }

      return new Response(
        JSON.stringify({ id, name: body.name, email: body.email }),
        { status: 200 }
      );
    }

    if (url.pathname.startsWith("/users/") && method === "DELETE") {
      const id = Number(url.pathname.split("/")[2]);

      const result = db.query("DELETE FROM users WHERE id = ?").run(id);

      if (result.changes === 0) {
        return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
      }

      return new Response(JSON.stringify({ message: "User deleted" }), { status: 200 });
    }

    // ================= PROJECTS =================

    if (url.pathname === "/projects" && method === "GET") {
      const projects = db.query("SELECT * FROM projects").all();
      return Response.json(projects);
    }

    if (url.pathname === "/projects" && method === "POST") {
      const body: any = await req.json();

      if (!body.name || !body.user_id) {
        return new Response(JSON.stringify({ error: "Name and user_id required" }), { status: 400 });
      }

      const result = db
        .query("INSERT INTO projects (name, user_id) VALUES (?, ?)")
        .run(body.name, body.user_id);

      return new Response(
        JSON.stringify({ id: result.lastInsertRowid, name: body.name, user_id: body.user_id }),
        { status: 201 }
      );
    }

    if (url.pathname.startsWith("/projects/") && method === "GET") {
      const id = Number(url.pathname.split("/")[2]);
      const project = db.query("SELECT * FROM projects WHERE id = ?").get(id);

      if (!project) {
        return new Response(JSON.stringify({ error: "Project not found" }), { status: 404 });
      }

      return Response.json(project);
    }

    if (url.pathname.startsWith("/projects/") && method === "PUT") {
      const id = Number(url.pathname.split("/")[2]);
      const body: any = await req.json();

      const result = db
        .query("UPDATE projects SET name = ?, user_id = ? WHERE id = ?")
        .run(body.name, body.user_id, id);

      if (result.changes === 0) {
        return new Response(JSON.stringify({ error: "Project not found" }), { status: 404 });
      }

      return new Response(
        JSON.stringify({ id, name: body.name, user_id: body.user_id }),
        { status: 200 }
      );
    }

    if (url.pathname.startsWith("/projects/") && method === "DELETE") {
      const id = Number(url.pathname.split("/")[2]);

      const result = db.query("DELETE FROM projects WHERE id = ?").run(id);

      if (result.changes === 0) {
        return new Response(JSON.stringify({ error: "Project not found" }), { status: 404 });
      }

      return new Response(JSON.stringify({ message: "Project deleted" }), { status: 200 });
    }

    // ================= TASKS =================

    if (url.pathname === "/tasks" && method === "GET") {
      const limit = Number(url.searchParams.get("limit")) || 10;
      const offset = Number(url.searchParams.get("offset")) || 0;
      const status = url.searchParams.get("status");

      let query = "SELECT * FROM tasks";
      let params: any[] = [];

      if (status) {
        query += " WHERE status = ?";
        params.push(status);
      }

      query += " LIMIT ? OFFSET ?";
      params.push(limit, offset);

      const tasks = db.query(query).all(...params);
      return Response.json(tasks);
    }

    if (url.pathname === "/tasks" && method === "POST") {
      const body: any = await req.json();

      if (!body.title) {
        return new Response(JSON.stringify({ error: "Title is required" }), { status: 400 });
      }

      const result = db
        .query("INSERT INTO tasks (title, status, project_id) VALUES (?, ?, ?)")
        .run(body.title, body.status || "pending", body.project_id || null);

      return new Response(
        JSON.stringify({
          id: result.lastInsertRowid,
          title: body.title,
          status: body.status || "pending",
          project_id: body.project_id || null,
        }),
        { status: 201 }
      );
    }

    if (url.pathname.startsWith("/tasks/") && method === "PUT") {
      const id = Number(url.pathname.split("/")[2]);
      const body: any = await req.json();

      const result = db
        .query("UPDATE tasks SET title = ?, status = ? WHERE id = ?")
        .run(body.title, body.status, id);

      if (result.changes === 0) {
        return new Response(JSON.stringify({ error: "Task not found" }), { status: 404 });
      }

      return new Response(
        JSON.stringify({ id, title: body.title, status: body.status }),
        { status: 200 }
      );
    }

    if (url.pathname.startsWith("/tasks/") && method === "DELETE") {
      const id = Number(url.pathname.split("/")[2]);

      const result = db.query("DELETE FROM tasks WHERE id = ?").run(id);

      if (result.changes === 0) {
        return new Response(JSON.stringify({ error: "Task not found" }), { status: 404 });
      }

      return new Response(JSON.stringify({ message: "Task deleted" }), { status: 200 });
    }

    return new Response("Not Found", { status: 404 });
  },
});

console.log("Server running on http://localhost:3000");