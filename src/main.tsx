import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './app/App'
import { initYSDK } from './ysdk'
import { initPayments } from './payments'
import { reconcilePurchases } from './state/purchasesController'
import { resolveLang } from './game/settings'
import { LOCALES } from './game/i18n'
import { YSDKProvider } from './YSDKContext'
import { resolveProgress, ensureTodayQuests } from './state/progress'
import { applyUiPalette } from './state/uiPalette'
import { todayStr } from './state/daily'

await initYSDK()
await initPayments()
const lang = await resolveLang()
const progress = await resolveProgress()
applyUiPalette(progress.equipped.uiPalette)
ensureTodayQuests(todayStr())   // seed today's quest board so the 📋 badge + board are correct on first paint
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

void reconcilePurchases()   // mandatory: process/restore any unprocessed purchases on load
