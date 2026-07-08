import { useState, useEffect, useCallback } from 'react';
import { fetchTodos, createTodo } from './api';
import './App.css';


function App() {
    const [todos, setTodos] = useState([]);
    const [title, setTitle] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadTodos = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await fetchTodos();
            setTodos(data);
        } catch (err) {
            setError('Failed to load todos.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadTodos();
    }, [loadTodos]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim()) return;

        try {
            await createTodo(title.trim());
            setTitle('');
            await loadTodos();
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="App">
            <div>
                <h1>List of TODOs</h1>
                {loading ? (
                    <p>Loading...</p>
                ) : todos.length === 0 ? (
                    <p>No todos yet.</p>
                ) : (
                    <ul>
                        {todos.map((todo) => (
                            <li key={todo._id}>{todo.title}</li>
                        ))}
                    </ul>
                )}
            </div>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <div>
                <h1>Create a ToDo</h1>
                <form onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="todo">ToDo: </label>
                        <input
                            id="todo"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>
                    <div style={{ marginTop: '5px' }}>
                        <button type="submit">Add ToDo!</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default App;
