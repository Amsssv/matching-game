import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './app/App'
import { initYSDK } from './ysdk'
import { resolveLang } from './game/settings'
import { LOCALES } from './game/i18n'
import { YSDKProvider } from './YSDKContext'
import { resolveProgress } from './state/progress'

await initYSDK()
const lang = await resolveLang()
await resolveProgress()
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
