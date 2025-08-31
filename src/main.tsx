import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log('⚡ main.tsx: Starting application...');
console.log('⚡ main.tsx: Environment:', {
  NODE_ENV: process.env.NODE_ENV,
  location: window.location.href,
  timestamp: new Date().toISOString()
});

const rootElement = document.getElementById("root");
console.log('⚡ main.tsx: Root element found:', !!rootElement);

if (!rootElement) {
  console.error('⚡ main.tsx: CRITICAL - Root element not found!');
  document.body.innerHTML = '<div style="padding: 20px; color: red; font-family: monospace;">CRITICAL ERROR: Root element #root not found in DOM</div>';
} else {
  console.log('⚡ main.tsx: Creating React root...');
  const root = createRoot(rootElement);
  
  console.log('⚡ main.tsx: Rendering App component...');
  root.render(<App />);
  
  console.log('⚡ main.tsx: App render initiated successfully');
}
