import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';

const makeTodo = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 'todo-1',
  text: 'First todo',
  completed: false,
  sortOrder: 2,
  createdAt: '2026-05-01T10:00:00.000Z',
  updatedAt: '2026-05-01T10:00:00.000Z',
  ...overrides,
});

const jsonResponse = (body: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    ...init,
  });

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

describe('Todo list region states', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('shows loading state during initial fetch with polite live region', () => {
    vi.spyOn(globalThis, 'fetch').mockReturnValue(new Promise(() => {}) as Promise<Response>);

    render(<App />, { wrapper: createWrapper() });

    const loading = screen.getByText('Loading…');
    expect(loading).toBeInTheDocument();
    expect(loading).toHaveAttribute('aria-live', 'polite');
  });

  it('shows empty state for successful empty response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ todos: [] }));

    render(<App />, { wrapper: createWrapper() });

    expect(await screen.findByText('No todos yet — add one above.')).toBeInTheDocument();
  });

  it('shows todos in API payload order', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({
        todos: [
          makeTodo({ id: 'todo-2', text: 'Second in order', sortOrder: 2 }),
          makeTodo({ id: 'todo-1', text: 'First in order', sortOrder: 1 }),
        ],
      }),
    );

    render(<App />, { wrapper: createWrapper() });

    const cards = await screen.findAllByRole('listitem');
    expect(cards).toHaveLength(2);
    expect(cards[0]).toHaveTextContent('Second in order');
    expect(cards[1]).toHaveTextContent('First in order');
  });

  it('shows error with alert semantics and retry label when fetch fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse(
        {
          error: {
            code: 'TODOS_FETCH_FAILED',
            message: "Couldn't load your todos.",
          },
        },
        { status: 503 },
      ),
    );

    render(<App />, { wrapper: createWrapper() });

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent("Couldn't load your todos.");
    expect(screen.getByRole('button', { name: 'Retry loading todos' })).toBeInTheDocument();
  });

  it('returns to loading state first when retrying after an error', async () => {
    let resolveSecondFetch: ((value: Response | PromiseLike<Response>) => void) | undefined;
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        jsonResponse(
          {
            error: {
              code: 'TODOS_FETCH_FAILED',
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

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry loading todos' }));

    await waitFor(() => expect(screen.getByText('Loading…')).toBeInTheDocument());

    resolveSecondFetch?.(jsonResponse({ todos: [] }));
    await waitFor(() =>
      expect(screen.getByText('No todos yet — add one above.')).toBeInTheDocument(),
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
