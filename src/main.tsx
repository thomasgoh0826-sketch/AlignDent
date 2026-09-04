import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import '@fontsource-variable/figtree/wght.css'
import './styles/tokens.css'
import './styles/global.css'

const root = document.getElementById('root')

if (!root) throw new Error('Missing root element')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
