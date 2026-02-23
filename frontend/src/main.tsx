import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Note: Removed StrictMode as it can cause double renders with Cornerstone3D
ReactDOM.createRoot(document.getElementById('root')!).render(
  <App />
)
