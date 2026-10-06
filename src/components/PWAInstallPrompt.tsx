"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowDownTrayIcon, SparklesIcon, XMarkIcon } from "@heroicons/react/24/outline"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

type StandaloneNavigator = Navigator & { standalone?: boolean }

const isStandalone = () => {
  if (typeof window === "undefined") return false
  const browserNavigator = window.navigator as StandaloneNavigator
  return window.matchMedia("(display-mode: standalone)").matches || browserNavigator.standalone === true || document.referrer.includes("android-app://")
}

export default function PWAInstallPrompt() {
  const [visible, setVisible] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showHelp, setShowHelp] = useState(false)
  const [installed, setInstalled] = useState(isStandalone)
  const promptRef = useRef<BeforeInstallPromptEvent | null>(null)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    if (isStandalone() || sessionStorage.getItem("pwa-prompt-dismissed")) return
    const clearTimers = () => { timersRef.current.forEach(clearTimeout); timersRef.current = [] }
    const reveal = () => setVisible(true)
    const handlePrompt = (event: Event) => {
      event.preventDefault()
      const installEvent = event as BeforeInstallPromptEvent
      promptRef.current = installEvent
      setDeferredPrompt(installEvent)
      clearTimers()
      timersRef.current.push(setTimeout(reveal, 1800))
    }
    const handleInstalled = () => {
      clearTimers(); promptRef.current = null; setDeferredPrompt(null); setShowHelp(false); setVisible(false); setInstalled(true)
    }
    window.addEventListener("beforeinstallprompt", handlePrompt)
    window.addEventListener("appinstalled", handleInstalled)
    timersRef.current.push(setTimeout(() => { if (!promptRef.current) reveal() }, 4200))
    return () => {
      clearTimers()
      window.removeEventListener("beforeinstallprompt", handlePrompt)
      window.removeEventListener("appinstalled", handleInstalled)
    }
  }, [])

  const install = async () => {
    if (!deferredPrompt) return
    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      promptRef.current = null
      setDeferredPrompt(null)
      setVisible(false)
      if (outcome === "accepted") setInstalled(true)
    } catch (error) { console.error("[PWA] Error during installation:", error) }
  }

  const dismiss = () => {
    setVisible(false)
    setShowHelp(false)
    sessionStorage.setItem("pwa-prompt-dismissed", "true")
  }

  if (installed || !visible) return null

  return (
    <>
      <aside className="gv-install-v2" role="dialog" aria-modal="true" aria-labelledby="gv-install-title">
        <div className="gv-install-v2__panel">
          <div className="gv-install-v2__grid" aria-hidden="true" />
          <div className="gv-install-v2__scan" aria-hidden="true" />
          <div className="gv-install-v2__bar">
            <span><i /> GROOVEVIE ACCESS</span>
            <button onClick={dismiss} aria-label="Close install prompt"><XMarkIcon /></button>
          </div>
          <div className="gv-install-v2__main">
            <div className="gv-install-v2__badge" aria-hidden="true"><b /><b /><ArrowDownTrayIcon /></div>
            <div><h2 id="gv-install-title">Install GrooveVie</h2><p>Keep your favorite menus one tap away with a faster, app-like experience.</p></div>
          </div>
          <div className="gv-install-v2__actions">
            <button className="gv-install-v2__primary" onClick={install}><ArrowDownTrayIcon />{deferredPrompt ? "Install now" : "Install now"}</button>
            <button className="gv-install-v2__secondary" onClick={dismiss}>Not now</button>
          </div>
          <footer><span>SECURE APP EXPERIENCE</span><em /><span>01</span></footer>
        </div>
      </aside>
      <style>{`
        .gv-install-v2{position:fixed;z-index:100;inset:auto 16px max(16px,env(safe-area-inset-bottom)) 16px;display:flex;justify-content:center;pointer-events:none;animation:gv-v2-in .5s ease both}.gv-install-v2__panel{position:relative;width:min(100%,520px);overflow:hidden;padding:20px 22px 15px;color:#f5f0df;background:linear-gradient(135deg,#142f59,#091a3b 54%,#040d23);border:1px solid rgba(236,193,80,.78);border-radius:20px;box-shadow:0 24px 65px rgba(0,0,0,.55),inset 0 1px rgba(255,229,145,.2),0 0 35px rgba(220,164,45,.14);pointer-events:auto}.gv-install-v2__panel:before,.gv-install-v2__panel:after{position:absolute;width:38px;height:38px;content:"";border-color:rgba(255,218,113,.85);pointer-events:none}.gv-install-v2__panel:before{top:9px;left:9px;border-top:1px solid;border-left:1px solid;border-radius:8px 0 0}.gv-install-v2__panel:after{right:9px;bottom:9px;border-right:1px solid;border-bottom:1px solid;border-radius:0 0 8px}.gv-install-v2__grid{position:absolute;inset:0;opacity:.13;background-image:linear-gradient(rgba(242,205,102,.4) 1px,transparent 1px),linear-gradient(90deg,rgba(242,205,102,.4) 1px,transparent 1px);background-size:25px 25px;mask-image:linear-gradient(125deg,transparent,#000 75%);pointer-events:none}.gv-install-v2__scan{position:absolute;top:0;left:-30%;width:35%;height:1px;background:linear-gradient(90deg,transparent,#ffedac,transparent);animation:gv-v2-scan 4s ease-in-out infinite}.gv-install-v2__bar,.gv-install-v2__main,.gv-install-v2__actions,.gv-install-v2 footer{position:relative;z-index:1}.gv-install-v2__bar{display:flex;align-items:center;justify-content:space-between;margin-bottom:17px;color:#eac96b;font-size:10px;font-weight:800;letter-spacing:.17em}.gv-install-v2__bar span{display:inline-flex;align-items:center;gap:8px}.gv-install-v2__bar i{width:7px;height:7px;background:#f2cf70;border-radius:50%;box-shadow:0 0 12px #f2cf70}.gv-install-v2__bar button{display:grid;width:31px;height:31px;padding:0;color:#d9c57d;background:rgba(255,255,255,.05);border:1px solid rgba(235,204,116,.3);border-radius:50%;place-items:center;cursor:pointer}.gv-install-v2__bar svg{width:17px;height:17px}.gv-install-v2__main{display:flex;align-items:center;gap:15px}.gv-install-v2__badge{position:relative;display:grid;flex:0 0 62px;width:62px;height:62px;color:#f8d982;background:rgba(225,183,66,.12);border:1px solid rgba(245,210,119,.55);border-radius:17px;box-shadow:inset 0 0 20px rgba(222,173,52,.15);place-items:center}.gv-install-v2__badge b{position:absolute;inset:8px;border:1px solid rgba(249,222,139,.52);border-radius:50%;animation:gv-v2-pulse 3s ease-in-out infinite}.gv-install-v2__badge b+b{inset:15px;opacity:.5;animation-delay:-1s}.gv-install-v2__badge svg{position:relative;width:27px;height:27px}.gv-install-v2 h2{margin:0;color:#f5d77e;font-size:clamp(20px,5vw,25px);font-weight:800}.gv-install-v2__main p{max-width:390px;margin:7px 0 0;color:rgba(240,242,237,.78);font-size:14px;line-height:1.45}.gv-install-v2__help{position:relative;z-index:1;margin-top:15px;padding:10px 12px;color:#f7e7ad;font-size:12px;background:rgba(222,177,59,.08);border:1px solid rgba(232,195,102,.3);border-radius:10px}.gv-install-v2__help strong{color:#ffeba5}.gv-install-v2__actions{display:flex;gap:10px;margin-top:20px}.gv-install-v2__primary,.gv-install-v2__secondary{min-height:45px;font:inherit;cursor:pointer;transition:.2s ease}.gv-install-v2__primary{display:inline-flex;flex:1;align-items:center;justify-content:center;gap:8px;padding:0 16px;color:#061633;font-size:14px;font-weight:800;background:linear-gradient(135deg,#f8dc82,#ce9d30);border:1px solid #f8e39f;border-radius:11px;box-shadow:0 8px 20px rgba(207,155,41,.28),inset 0 1px rgba(255,255,255,.65)}.gv-install-v2__primary svg{width:18px;height:18px}.gv-install-v2__primary svg:last-child{width:15px;height:15px;opacity:.65}.gv-install-v2__secondary{padding:0 15px;color:#e1d099;font-size:12px;font-weight:700;background:rgba(255,255,255,.05);border:1px solid rgba(232,202,121,.28);border-radius:11px}.gv-install-v2 footer{display:flex;align-items:center;gap:8px;margin-top:14px;color:rgba(230,207,143,.58);font-size:9px;font-weight:700;letter-spacing:.15em}.gv-install-v2 footer em{flex:1;height:1px;background:rgba(227,195,110,.25)}@keyframes gv-v2-in{from{opacity:0;transform:translateY(22px) scale(.98)}to{opacity:1;transform:none}}@keyframes gv-v2-scan{0%,20%{transform:translateX(0);opacity:0}38%{opacity:1}80%,100%{transform:translateX(400%);opacity:0}}@keyframes gv-v2-pulse{0%,100%{transform:scale(1);opacity:.4}50%{transform:scale(1.08);opacity:1}}@media(max-width:520px){.gv-install-v2__panel{padding:17px 15px 13px;border-radius:17px}.gv-install-v2__main{gap:11px}.gv-install-v2__badge{flex-basis:52px;width:52px;height:52px;border-radius:14px}.gv-install-v2__badge svg{width:23px;height:23px}.gv-install-v2 h2{font-size:19px}.gv-install-v2__main p{font-size:12px}.gv-install-v2__actions{gap:8px;margin-top:17px}.gv-install-v2__primary,.gv-install-v2__secondary{min-height:42px}.gv-install-v2__secondary{padding:0 11px}}@media(prefers-reduced-motion:reduce){.gv-install-v2,.gv-install-v2__scan,.gv-install-v2__badge b{animation:none}}
      `}</style>
    </>
  )
}

