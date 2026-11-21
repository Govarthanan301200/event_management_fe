import { useEffect, useState } from 'react';
import { getMessages } from './api';

function App() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getMessages()
      .then(setMessages)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="container">
      <h1>Event Management</h1>
      <p className="subtitle">Data fetched from Supabase via the backend API</p>

      {loading && <p>Loading…</p>}
      {error && <p className="error">Error: {error}</p>}
      {!loading && !error && messages.length === 0 && <p>No messages found.</p>}

      <ul className="list">
        {messages.map((m) => (
          <li key={m.id}>
            <span>{m.text}</span>
            <small>{new Date(m.created_at).toLocaleString()}</small>
          </li>
        ))}
      </ul>
    </main>
  );
}

export default App;
