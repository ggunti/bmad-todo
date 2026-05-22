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

describe('Todo list region states', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders focused input with required placeholder and aria-label', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ todos: [] }));

    render(<App />, { wrapper: createWrapper() });

    const input = await screen.findByRole('textbox', { name: 'New todo' });
    expect(input).toHaveAttribute('placeholder', 'What needs doing?');
    expect(input).toHaveFocus();
  });

  it('shows validation for empty submission and clears message on typing', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ todos: [] }));

    render(<App />, { wrapper: createWrapper() });

    const input = await screen.findByRole('textbox', { name: 'New todo' });
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(await screen.findByText('Add some text first.')).toBeInTheDocument();
    expect(input).toHaveValue('');
    expect(input).toHaveFocus();

    fireEvent.change(input, { target: { value: 'n' } });
    await waitFor(() => expect(screen.queryByText('Add some text first.')).not.toBeInTheDocument());
  });

  it('shows over-length validation and preserves text for editing', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ todos: [] }));

    render(<App />, { wrapper: createWrapper() });

    const input = await screen.findByRole('textbox', { name: 'New todo' });
    const tooLong = 'x'.repeat(1025);

    fireEvent.change(input, { target: { value: tooLong } });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(await screen.findByText('Max 1024 characters — please shorten.')).toBeInTheDocument();
    expect(input).toHaveValue(tooLong);
    expect(input).toHaveFocus();
  });

  it('uses the same create flow for Enter and Add button', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation((_input, init) => {
      const method = init?.method ?? 'GET';
      if (method === 'GET') {
        return Promise.resolve(jsonResponse({ todos: [] }));
      }

      const body = JSON.parse(String(init?.body ?? '{}')) as { text?: string };
      return Promise.resolve(
        jsonResponse({
          todo: makeTodo({
            id: `todo-${body.text}`,
            text: body.text ?? '',
            sortOrder: 1,
          }),
        }),
      );
    });

    render(<App />, { wrapper: createWrapper() });
    const input = await screen.findByRole('textbox', { name: 'New todo' });

    fireEvent.change(input, { target: { value: 'first entry' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await screen.findByText('first entry');
    expect(input).toHaveFocus();

    fireEvent.change(input, { target: { value: 'second entry' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    await screen.findByText('second entry');
    expect(input).toHaveFocus();

    const postCalls = fetchMock.mock.calls.filter(([, init]) => init?.method === 'POST');
    expect(postCalls).toHaveLength(2);
  });

  it('optimistically inserts todo before POST resolves', async () => {
    const createDeferred = deferredResponse();
    vi.spyOn(globalThis, 'fetch').mockImplementation((_input, init) => {
      const method = init?.method ?? 'GET';
      if (method === 'GET') {
        return Promise.resolve(jsonResponse({ todos: [] }));
      }

      return createDeferred.promise;
    });

    render(<App />, { wrapper: createWrapper() });
    const input = await screen.findByRole('textbox', { name: 'New todo' });

    fireEvent.change(input, { target: { value: 'buy bread' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    const optimisticRow = await screen.findByText('buy bread');
    expect(optimisticRow).toBeInTheDocument();

    createDeferred.resolve(
      jsonResponse({
        todo: makeTodo({
          id: 'todo-buy-bread',
          text: 'buy bread',
          sortOrder: 1,
        }),
      }),
    );

    await waitFor(() => expect(screen.getByText('buy bread')).toBeInTheDocument());
  });

  it('shows row-level failure and supports inline retry recovery', async () => {
    let createAttempts = 0;
    vi.spyOn(globalThis, 'fetch').mockImplementation((_input, init) => {
      const method = init?.method ?? 'GET';
      if (method === 'GET') {
        return Promise.resolve(jsonResponse({ todos: [] }));
      }

      createAttempts += 1;
      if (createAttempts === 1) {
        return Promise.reject(new Error('network down'));
      }

      return Promise.resolve(
        jsonResponse({
          todo: makeTodo({
            id: 'todo-retried',
            text: 'retry me',
            sortOrder: 1,
          }),
        }),
      );
    });

    render(<App />, { wrapper: createWrapper() });
    const input = await screen.findByRole('textbox', { name: 'New todo' });

    fireEvent.change(input, { target: { value: 'retry me' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(await screen.findByText('This item failed to save.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    await waitFor(() => expect(screen.queryByText('This item failed to save.')).not.toBeInTheDocument());
    expect(screen.getByText('retry me')).toBeInTheDocument();
  });

  it('isolates failures during rapid-fire optimistic creates', async () => {
    const firstCreate = deferredResponse();
    const secondCreate = deferredResponse();
    let createCall = 0;

    vi.spyOn(globalThis, 'fetch').mockImplementation((_input, init) => {
      const method = init?.method ?? 'GET';
      if (method === 'GET') {
        return Promise.resolve(jsonResponse({ todos: [] }));
      }

      createCall += 1;
      return createCall === 1 ? firstCreate.promise : secondCreate.promise;
    });

    render(<App />, { wrapper: createWrapper() });
    const input = await screen.findByRole('textbox', { name: 'New todo' });

    fireEvent.change(input, { target: { value: 'first item' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    fireEvent.change(input, { target: { value: 'second item' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    const cards = await screen.findAllByRole('listitem');
    expect(cards[0]).toHaveTextContent('second item');
    expect(cards[1]).toHaveTextContent('first item');

    firstCreate.reject(new Error('first failed'));
    secondCreate.resolve(
      jsonResponse({
        todo: makeTodo({ id: 'todo-second', text: 'second item', sortOrder: 1 }),
      }),
    );

    expect(await screen.findByText('This item failed to save.')).toBeInTheDocument();
    expect(screen.getByText('second item')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Retry' })).toHaveLength(1);
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
