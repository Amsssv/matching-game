import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initYSDK } from './ysdk'
import { YSDKProvider } from './YSDKContext'

await initYSDK()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <YSDKProvider>
      <App />
    </YSDKProvider>
  </StrictMode>,
)
