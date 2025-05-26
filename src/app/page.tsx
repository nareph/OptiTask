// Exemple dans src/app/page.tsx
"use client"
import { useEffect, useState } from 'react';

export default function HomePage() {
  const [backendStatus, setBackendStatus] = useState('');

  useEffect(() => {
    fetch('/api/rust/health') // Notez le chemin proxyfié
      .then(res => res.json())
      .then(data => setBackendStatus(data))
      .catch(() => setBackendStatus('Error connecting to backend'));
  }, []);

  return (
    <main>
      <h1>Productivity SaaS</h1>
      <p>Backend Status: {JSON.stringify(backendStatus)}</p>
    </main>
  );
}