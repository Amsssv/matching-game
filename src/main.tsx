import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initYSDK } from './ysdk'
import { resolveLang } from './game/settings'
import { LOCALES } from './game/i18n'
import { YSDKProvider } from './YSDKContext'

await initYSDK()
const lang = await resolveLang()
document.title = LOCALES[lang].title
document.documentElement.lang = lang
document.querySelector<HTMLMetaElement>('meta[name="description"]')?.setAttribute('content', LOCALES[lang].description)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <YSDKProvider>
      <App />
    </YSDKProvider>
  </StrictMode>,
)
