import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initYSDK } from './ysdk'
import { resolveLang } from './game/settings'
import { YSDKProvider } from './YSDKContext'

await initYSDK()
await resolveLang()   // auto-detect language from SDK at startup, before Phaser runs

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <YSDKProvider>
      <App />
    </YSDKProvider>
  </StrictMode>,
)
