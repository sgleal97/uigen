import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolCallBadge } from "../ToolCallBadge";

afterEach(() => {
  cleanup();
});

// --- Label derivation: str_replace_editor ---

test("str_replace_editor create shows 'Creating {file}'", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "src/components/Card.jsx" }}
      state="call"
    />
  );
  expect(screen.getByText("Creating Card.jsx")).toBeDefined();
});

test("str_replace_editor str_replace shows 'Editing {file}'", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "str_replace", path: "src/App.tsx" }}
      state="call"
    />
  );
  expect(screen.getByText("Editing App.tsx")).toBeDefined();
});

test("str_replace_editor insert shows 'Editing {file}'", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "insert", path: "src/utils.ts" }}
      state="call"
    />
  );
  expect(screen.getByText("Editing utils.ts")).toBeDefined();
});

test("str_replace_editor view shows 'Reading {file}'", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "view", path: "src/index.tsx" }}
      state="call"
    />
  );
  expect(screen.getByText("Reading index.tsx")).toBeDefined();
});

test("str_replace_editor undo_edit shows 'Undoing edit in {file}'", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "undo_edit", path: "src/main.tsx" }}
      state="call"
    />
  );
  expect(screen.getByText("Undoing edit in main.tsx")).toBeDefined();
});

// --- Label derivation: file_manager ---

test("file_manager rename shows 'Renaming {file}'", () => {
  render(
    <ToolCallBadge
      toolName="file_manager"
      args={{ command: "rename", path: "src/old.tsx" }}
      state="call"
    />
  );
  expect(screen.getByText("Renaming old.tsx")).toBeDefined();
});

test("file_manager delete shows 'Deleting {file}'", () => {
  render(
    <ToolCallBadge
      toolName="file_manager"
      args={{ command: "delete", path: "src/temp.js" }}
      state="call"
    />
  );
  expect(screen.getByText("Deleting temp.js")).toBeDefined();
});

// --- Fallback ---

test("unknown tool falls back to raw tool name", () => {
  render(
    <ToolCallBadge
      toolName="some_other_tool"
      args={{}}
      state="call"
    />
  );
  expect(screen.getByText("some_other_tool")).toBeDefined();
});

test("str_replace_editor with unknown command falls back to tool name", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "unknown_cmd", path: "file.tsx" }}
      state="call"
    />
  );
  expect(screen.getByText("str_replace_editor")).toBeDefined();
});

// --- Visual state ---

test("shows spinner when state is 'call'", () => {
  const { container } = render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "Card.jsx" }}
      state="call"
    />
  );
  expect(container.querySelector(".animate-spin")).toBeDefined();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

test("shows spinner when state is 'partial-call'", () => {
  const { container } = render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "Card.jsx" }}
      state="partial-call"
    />
  );
  expect(container.querySelector(".animate-spin")).toBeDefined();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

test("shows green dot when state is 'result'", () => {
  const { container } = render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "Card.jsx" }}
      state="result"
    />
  );
  expect(container.querySelector(".bg-emerald-500")).toBeDefined();
  expect(container.querySelector(".animate-spin")).toBeNull();
});

// --- Path handling ---

test("uses only the filename from a nested path", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "src/components/ui/Button.tsx" }}
      state="call"
    />
  );
  expect(screen.getByText("Creating Button.tsx")).toBeDefined();
});

test("handles a bare filename with no directory", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "str_replace", path: "App.tsx" }}
      state="call"
    />
  );
  expect(screen.getByText("Editing App.tsx")).toBeDefined();
});
