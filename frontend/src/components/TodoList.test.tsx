import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "../App";

const makeTodo = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: "todo-1",
  text: "First todo",
  completed: false,
  sortOrder: 2,
  createdAt: "2026-05-01T10:00:00.000Z",
  updatedAt: "2026-05-01T10:00:00.000Z",
  ...overrides,
});

const jsonResponse = (body: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
    ...init,
  });

const deferredResponse = () => {
  let resolve: ((value: Response | PromiseLike<Response>) => void) | undefined;
  let reject: ((reason?: unknown) => void) | undefined;

  const promise = new Promise<Response>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return {
    promise,
    resolve: (value: Response) => resolve?.(value),
    reject: (reason?: unknown) => reject?.(reason),
  };
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("Todo list region states", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders focused input with required placeholder and aria-label", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ todos: [] }),
    );

    render(<App />, { wrapper: createWrapper() });

    const input = await screen.findByRole("textbox", { name: "New todo" });
    expect(input).toHaveAttribute("placeholder", "What needs doing?");
    expect(input).toHaveFocus();
  });

  it("shows validation for empty submission and clears message on typing", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ todos: [] }),
    );

    render(<App />, { wrapper: createWrapper() });

    const input = await screen.findByRole("textbox", { name: "New todo" });
    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(await screen.findByText("Add some text first.")).toBeInTheDocument();
    expect(input).toHaveValue("");
    expect(input).toHaveFocus();

    fireEvent.change(input, { target: { value: "n" } });
    await waitFor(() =>
      expect(
        screen.queryByText("Add some text first."),
      ).not.toBeInTheDocument(),
    );
  });

  it("shows over-length validation and preserves text for editing", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ todos: [] }),
    );

    render(<App />, { wrapper: createWrapper() });

    const input = await screen.findByRole("textbox", { name: "New todo" });
    const tooLong = "x".repeat(1025);

    fireEvent.change(input, { target: { value: tooLong } });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    expect(
      await screen.findByText("Max 1024 characters — please shorten."),
    ).toBeInTheDocument();
    expect(input).toHaveValue(tooLong);
    expect(input).toHaveFocus();
  });

  it("uses the same create flow for Enter and Add button", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation((_input, init) => {
        const method = init?.method ?? "GET";
        if (method === "GET") {
          return Promise.resolve(jsonResponse({ todos: [] }));
        }

        const body = JSON.parse(String(init?.body ?? "{}")) as {
          text?: string;
        };
        return Promise.resolve(
          jsonResponse({
            todo: makeTodo({
              id: `todo-${body.text}`,
              text: body.text ?? "",
              sortOrder: 1,
            }),
          }),
        );
      });

    render(<App />, { wrapper: createWrapper() });
    const input = await screen.findByRole("textbox", { name: "New todo" });

    fireEvent.change(input, { target: { value: "first entry" } });
    fireEvent.keyDown(input, { key: "Enter" });

    await screen.findByText("first entry");
    expect(input).toHaveFocus();

    fireEvent.change(input, { target: { value: "second entry" } });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    await screen.findByText("second entry");
    expect(input).toHaveFocus();

    const postCalls = fetchMock.mock.calls.filter(
      ([, init]) => init?.method === "POST",
    );
    expect(postCalls).toHaveLength(2);
  });

  it("optimistically inserts todo before POST resolves", async () => {
    const createDeferred = deferredResponse();
    vi.spyOn(globalThis, "fetch").mockImplementation((_input, init) => {
      const method = init?.method ?? "GET";
      if (method === "GET") {
        return Promise.resolve(jsonResponse({ todos: [] }));
      }

      return createDeferred.promise;
    });

    render(<App />, { wrapper: createWrapper() });
    const input = await screen.findByRole("textbox", { name: "New todo" });

    fireEvent.change(input, { target: { value: "buy bread" } });
    fireEvent.keyDown(input, { key: "Enter" });

    const optimisticRow = await screen.findByText("buy bread");
    expect(optimisticRow).toBeInTheDocument();

    createDeferred.resolve(
      jsonResponse({
        todo: makeTodo({
          id: "todo-buy-bread",
          text: "buy bread",
          sortOrder: 1,
        }),
      }),
    );

    await waitFor(() =>
      expect(screen.getByText("buy bread")).toBeInTheDocument(),
    );
  });

  it("shows row-level failure and supports inline retry recovery", async () => {
    let createAttempts = 0;
    vi.spyOn(globalThis, "fetch").mockImplementation((_input, init) => {
      const method = init?.method ?? "GET";
      if (method === "GET") {
        return Promise.resolve(jsonResponse({ todos: [] }));
      }

      createAttempts += 1;
      if (createAttempts === 1) {
        return Promise.reject(new Error("network down"));
      }

      return Promise.resolve(
        jsonResponse({
          todo: makeTodo({
            id: "todo-retried",
            text: "retry me",
            sortOrder: 1,
          }),
        }),
      );
    });

    render(<App />, { wrapper: createWrapper() });
    const input = await screen.findByRole("textbox", { name: "New todo" });

    fireEvent.change(input, { target: { value: "retry me" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(
      await screen.findByText("This item failed to save."),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    await waitFor(() =>
      expect(
        screen.queryByText("This item failed to save."),
      ).not.toBeInTheDocument(),
    );
    expect(screen.getByText("retry me")).toBeInTheDocument();
  });

  it("isolates failures during rapid-fire optimistic creates", async () => {
    const firstCreate = deferredResponse();
    const secondCreate = deferredResponse();
    let createCall = 0;

    vi.spyOn(globalThis, "fetch").mockImplementation((_input, init) => {
      const method = init?.method ?? "GET";
      if (method === "GET") {
        return Promise.resolve(jsonResponse({ todos: [] }));
      }

      createCall += 1;
      return createCall === 1 ? firstCreate.promise : secondCreate.promise;
    });

    render(<App />, { wrapper: createWrapper() });
    const input = await screen.findByRole("textbox", { name: "New todo" });

    fireEvent.change(input, { target: { value: "first item" } });
    fireEvent.keyDown(input, { key: "Enter" });
    fireEvent.change(input, { target: { value: "second item" } });
    fireEvent.keyDown(input, { key: "Enter" });

    const cards = await screen.findAllByRole("listitem");
    expect(cards[0]).toHaveTextContent("second item");
    expect(cards[1]).toHaveTextContent("first item");

    firstCreate.reject(new Error("first failed"));
    secondCreate.resolve(
      jsonResponse({
        todo: makeTodo({
          id: "todo-second",
          text: "second item",
          sortOrder: 1,
        }),
      }),
    );

    expect(
      await screen.findByText("This item failed to save."),
    ).toBeInTheDocument();
    expect(screen.getByText("second item")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Retry" })).toHaveLength(1);
  });

  it("optimistically toggles completion on click and preserves row order", async () => {
    const toggleDeferred = deferredResponse();
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation((input, init) => {
        const method = init?.method ?? "GET";
        if (method === "GET") {
          return Promise.resolve(
            jsonResponse({
              todos: [
                makeTodo({
                  id: "todo-1",
                  text: "First in list",
                  sortOrder: 1,
                  completed: false,
                }),
                makeTodo({
                  id: "todo-2",
                  text: "Second in list",
                  sortOrder: 2,
                  completed: false,
                }),
              ],
            }),
          );
        }

        if (method === "PATCH" && String(input).endsWith("/api/todos/todo-1")) {
          return toggleDeferred.promise;
        }

        return Promise.resolve(
          jsonResponse(
            { error: { code: "UNEXPECTED", message: "Unexpected call" } },
            { status: 500 },
          ),
        );
      });

    render(<App />, { wrapper: createWrapper() });
    const firstCheckbox = await screen.findByRole("checkbox", {
      name: "Mark complete: First in list",
    });
    fireEvent.click(firstCheckbox);

    const toggledCheckbox = await screen.findByRole("checkbox", {
      name: "Mark incomplete: First in list",
    });
    expect(toggledCheckbox).toHaveAttribute("aria-checked", "true");

    const cards = screen.getAllByRole("listitem");
    expect(cards[0]).toHaveTextContent("First in list");
    expect(cards[1]).toHaveTextContent("Second in list");

    toggleDeferred.resolve(
      jsonResponse({
        todo: makeTodo({
          id: "todo-1",
          text: "First in list",
          sortOrder: 1,
          completed: true,
        }),
      }),
    );

    await waitFor(() => {
      expect(
        screen.getByRole("checkbox", {
          name: "Mark incomplete: First in list",
        }),
      ).toBeInTheDocument();
    });

    const patchCalls = fetchMock.mock.calls.filter(
      ([, init]) => init?.method === "PATCH",
    );
    expect(patchCalls).toHaveLength(1);
  });

  it("supports keyboard Space toggle and exposes checkbox aria state", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation((_input, init) => {
      const method = init?.method ?? "GET";
      if (method === "GET") {
        return Promise.resolve(
          jsonResponse({
            todos: [
              makeTodo({
                id: "todo-a11y",
                text: "Keyboard todo",
                completed: false,
              }),
            ],
          }),
        );
      }

      return Promise.resolve(
        jsonResponse({
          todo: makeTodo({
            id: "todo-a11y",
            text: "Keyboard todo",
            completed: true,
          }),
        }),
      );
    });

    render(<App />, { wrapper: createWrapper() });

    const checkbox = await screen.findByRole("checkbox", {
      name: "Mark complete: Keyboard todo",
    });
    checkbox.focus();
    fireEvent.keyDown(checkbox, { key: " " });
    fireEvent.keyUp(checkbox, { key: " " });

    await waitFor(() => {
      expect(
        screen.getByRole("checkbox", {
          name: "Mark incomplete: Keyboard todo",
        }),
      ).toHaveAttribute("aria-checked", "true");
    });
  });

  it("keeps toggle failures row-local with inline retry", async () => {
    const patchAttempts = new Map<string, number>();
    vi.spyOn(globalThis, "fetch").mockImplementation((input, init) => {
      const method = init?.method ?? "GET";
      if (method === "GET") {
        return Promise.resolve(
          jsonResponse({
            todos: [
              makeTodo({
                id: "todo-1",
                text: "First toggled todo",
                completed: false,
              }),
              makeTodo({
                id: "todo-2",
                text: "Second toggled todo",
                completed: false,
              }),
            ],
          }),
        );
      }

      if (method === "PATCH") {
        const requestUrl = String(input);
        const todoId = requestUrl.split("/").pop() ?? "";
        const attempts = (patchAttempts.get(todoId) ?? 0) + 1;
        patchAttempts.set(todoId, attempts);

        if (todoId === "todo-1" && attempts === 1) {
          return Promise.reject(new Error("toggle failed"));
        }

        return Promise.resolve(
          jsonResponse({
            todo: makeTodo({
              id: todoId,
              text:
                todoId === "todo-1"
                  ? "First toggled todo"
                  : "Second toggled todo",
              completed: true,
            }),
          }),
        );
      }

      return Promise.resolve(
        jsonResponse(
          { error: { code: "UNEXPECTED", message: "Unexpected call" } },
          { status: 500 },
        ),
      );
    });

    render(<App />, { wrapper: createWrapper() });

    fireEvent.click(
      await screen.findByRole("checkbox", {
        name: "Mark complete: First toggled todo",
      }),
    );
    expect(
      await screen.findByText("This item failed to update."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", {
        name: "Mark incomplete: First toggled todo",
      }),
    ).toHaveAttribute("aria-checked", "true");

    fireEvent.click(
      screen.getByRole("checkbox", {
        name: "Mark complete: Second toggled todo",
      }),
    );
    await waitFor(() =>
      expect(
        screen.getByRole("checkbox", {
          name: "Mark incomplete: Second toggled todo",
        }),
      ).toHaveAttribute("aria-checked", "true"),
    );

    const failureCard = screen
      .getAllByRole("listitem")
      .find((item) => item.textContent?.includes("First toggled todo"));
    expect(failureCard).toHaveTextContent("This item failed to update.");

    const retryButton = failureCard?.querySelector("button.todo-inline-retry");
    expect(retryButton).toBeTruthy();
    if (retryButton) {
      fireEvent.click(retryButton);
    }

    await waitFor(() =>
      expect(
        screen.queryByText("This item failed to update."),
      ).not.toBeInTheDocument(),
    );
  });

  it("optimistically removes a todo on delete and reflows remaining rows", async () => {
    const deleteDeferred = deferredResponse();
    vi.spyOn(globalThis, "fetch").mockImplementation((input, init) => {
      const method = init?.method ?? "GET";
      if (method === "GET") {
        return Promise.resolve(
          jsonResponse({
            todos: [
              makeTodo({
                id: "todo-1",
                text: "First delete target",
                sortOrder: 1,
              }),
              makeTodo({ id: "todo-2", text: "Second row", sortOrder: 2 }),
            ],
          }),
        );
      }

      if (method === "DELETE" && String(input).endsWith("/api/todos/todo-1")) {
        return deleteDeferred.promise;
      }

      return Promise.resolve(
        jsonResponse(
          { error: { code: "UNEXPECTED", message: "Unexpected call" } },
          { status: 500 },
        ),
      );
    });

    render(<App />, { wrapper: createWrapper() });
    fireEvent.click(
      await screen.findByRole("button", {
        name: "Delete: First delete target",
      }),
    );

    await waitFor(() =>
      expect(screen.queryByText("First delete target")).not.toBeInTheDocument(),
    );
    const cards = screen.getAllByRole("listitem");
    expect(cards).toHaveLength(1);
    expect(cards[0]).toHaveTextContent("Second row");

    deleteDeferred.resolve(jsonResponse({ success: true }));
    await waitFor(() =>
      expect(screen.getByText("Second row")).toBeInTheDocument(),
    );
  });

  it("moves focus after optimistic delete to next row then to input fallback", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation((_input, init) => {
      const method = init?.method ?? "GET";
      if (method === "GET") {
        return Promise.resolve(
          jsonResponse({
            todos: [
              makeTodo({
                id: "todo-focus-1",
                text: "First focus row",
                sortOrder: 1,
              }),
              makeTodo({
                id: "todo-focus-2",
                text: "Second focus row",
                sortOrder: 2,
              }),
            ],
          }),
        );
      }

      if (method === "DELETE") {
        return Promise.resolve(jsonResponse({ success: true }));
      }

      return Promise.resolve(
        jsonResponse(
          { error: { code: "UNEXPECTED", message: "Unexpected call" } },
          { status: 500 },
        ),
      );
    });

    render(<App />, { wrapper: createWrapper() });

    const firstDeleteButton = await screen.findByRole("button", {
      name: "Delete: First focus row",
    });
    fireEvent.click(firstDeleteButton);

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Delete: Second focus row" }),
      ).toHaveFocus(),
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Delete: Second focus row" }),
    );
    await waitFor(() =>
      expect(screen.getByRole("textbox", { name: "New todo" })).toHaveFocus(),
    );
  });

  it("restores failed delete row in original position with inline retry and no modal", async () => {
    const deleteAttempts = new Map<string, number>();
    vi.spyOn(globalThis, "fetch").mockImplementation((input, init) => {
      const method = init?.method ?? "GET";
      if (method === "GET") {
        return Promise.resolve(
          jsonResponse({
            todos: [
              makeTodo({
                id: "todo-delete-1",
                text: "Delete fail row",
                sortOrder: 1,
              }),
              makeTodo({
                id: "todo-delete-2",
                text: "Neighbor row",
                sortOrder: 2,
              }),
            ],
          }),
        );
      }

      if (method === "DELETE") {
        const todoId = String(input).split("/").pop() ?? "";
        const attempts = (deleteAttempts.get(todoId) ?? 0) + 1;
        deleteAttempts.set(todoId, attempts);
        if (todoId === "todo-delete-1" && attempts === 1) {
          return Promise.reject(new Error("delete failed"));
        }

        return Promise.resolve(jsonResponse({ success: true }));
      }

      return Promise.resolve(
        jsonResponse(
          { error: { code: "UNEXPECTED", message: "Unexpected call" } },
          { status: 500 },
        ),
      );
    });

    render(<App />, { wrapper: createWrapper() });

    fireEvent.click(
      await screen.findByRole("button", { name: "Delete: Delete fail row" }),
    );

    expect(
      await screen.findByText("Couldn't delete — try again."),
    ).toBeInTheDocument();
    const cardsAfterFailure = screen.getAllByRole("listitem");
    expect(cardsAfterFailure[0]).toHaveTextContent("Delete fail row");
    expect(cardsAfterFailure[1]).toHaveTextContent("Neighbor row");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Retry delete: Delete fail row" }),
    );
    await waitFor(() =>
      expect(
        screen.queryByText("Couldn't delete — try again."),
      ).not.toBeInTheDocument(),
    );
    expect(screen.queryByText("Delete fail row")).not.toBeInTheDocument();
    expect(screen.getByText("Neighbor row")).toBeInTheDocument();
  });

  it("shows loading state during initial fetch with polite live region", () => {
    vi.spyOn(globalThis, "fetch").mockReturnValue(
      new Promise(() => {}) as Promise<Response>,
    );

    render(<App />, { wrapper: createWrapper() });

    const loading = screen.getByText("Loading…");
    expect(loading).toBeInTheDocument();
    expect(loading).toHaveAttribute("aria-live", "polite");
  });

  it("shows empty state for successful empty response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ todos: [] }),
    );

    render(<App />, { wrapper: createWrapper() });

    expect(
      await screen.findByText("No todos yet — add one above."),
    ).toBeInTheDocument();
  });

  it("shows todos in API payload order", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({
        todos: [
          makeTodo({ id: "todo-2", text: "Second in order", sortOrder: 2 }),
          makeTodo({ id: "todo-1", text: "First in order", sortOrder: 1 }),
        ],
      }),
    );

    render(<App />, { wrapper: createWrapper() });

    const cards = await screen.findAllByRole("listitem");
    expect(cards).toHaveLength(2);
    expect(cards[0]).toHaveTextContent("Second in order");
    expect(cards[1]).toHaveTextContent("First in order");
  });

  it("shows error with alert semantics and retry label when fetch fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse(
        {
          error: {
            code: "TODOS_FETCH_FAILED",
            message: "Couldn't load your todos.",
          },
        },
        { status: 503 },
      ),
    );

    render(<App />, { wrapper: createWrapper() });

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Couldn't load your todos.");
    expect(
      screen.getByRole("button", { name: "Retry loading todos" }),
    ).toBeInTheDocument();
  });

  it("returns to loading state first when retrying after an error", async () => {
    let resolveSecondFetch:
      | ((value: Response | PromiseLike<Response>) => void)
      | undefined;
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        jsonResponse(
          {
            error: {
              code: "TODOS_FETCH_FAILED",
              message: "Couldn't load your todos.",
            },
          },
          { status: 503 },
        ),
      )
      .mockImplementationOnce(
        () =>
          new Promise<Response>((resolve) => {
            resolveSecondFetch = resolve;
          }),
      );

    render(<App />, { wrapper: createWrapper() });

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Retry loading todos" }),
    );

    await waitFor(() =>
      expect(screen.getByText("Loading…")).toBeInTheDocument(),
    );

    resolveSecondFetch?.(jsonResponse({ todos: [] }));
    await waitFor(() =>
      expect(
        screen.getByText("No todos yet — add one above."),
      ).toBeInTheDocument(),
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
