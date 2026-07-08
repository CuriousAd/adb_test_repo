const API_BASE_URL = 'http://localhost:8000';

export const fetchTodos = async () => {
    const response = await fetch(`${API_BASE_URL}/todos/`);
    if (!response.ok) {
        throw new Error('Failed to fetch todos');
    }
    return response.json();
};

export const createTodo = async (title) => {
    const response = await fetch(`${API_BASE_URL}/todos/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
    });
    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create todo');
    }
    return response.json();
};
