"use client"

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useDailySpinWheel, type RewardType } from '@/hooks/useDailySpinWheel'
import { getCustomerId } from '@/lib/device-identity'

interface DailySpinWheelProps {
  isOpen: boolean
  onClose: () => void
  themeColor?: string
}

const REWARD_ORDER: RewardType[] = ['greenBeer', 'blackBeer', 'tryAgain', 'cashback200', 'cashback50', 'discount10']

const SEGMENT = 360 / REWARD_ORDER.length
const POINTER_ANGLE = 270 // SVG angle (0deg = 3 o'clock) that sits under the pointer (12 o'clock)
const SPIN_MS = 5200
const BULB_COUNT = 18
const EXTRUSION_LAYERS = 12
const CONFETTI_COLORS = ['#fbbf24', '#f59e0b', '#fde68a', '#34d399', '#60a5fa', '#f472b6', '#ffffff']

const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4)
const mod = (n: number, m: number) => ((n % m) + m) % m

export default function DailySpinWheel({
  isOpen,
  onClose,
  themeColor = '#fbbf24',
}: DailySpinWheelProps) {
  const customerId = getCustomerId() ?? undefined
  const { canSpinToday, timeUntilNextSpin, performSpin, REWARDS, isLoading } = useDailySpinWheel(customerId)

  const [isSpinning, setIsSpinning] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [showResult, setShowResult] = useState(false)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })

  const wheelRef = useRef<SVGSVGElement>(null)
  const pointerRef = useRef<HTMLDivElement>(null)
  const rotationRef = useRef(0)
  const rafRef = useRef<number | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Stable confetti pieces (so they don't jump on every re-render)
  const confetti = useMemo(
    () =>
      Array.from({ length: 48 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        duration: 2.4 + Math.random() * 2,
        size: 6 + Math.random() * 8,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        drift: (Math.random() - 0.5) * 160,
        spin: 360 + Math.random() * 720,
      })),
    // regenerate for each new result
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [result]
  )

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const applyRotation = (deg: number) => {
    rotationRef.current = deg
    if (wheelRef.current) wheelRef.current.style.transform = `rotate(${deg}deg)`
  }

  const flickPointer = useCallback(() => {
    const el = pointerRef.current
    if (!el) return
    el.style.transition = 'none'
    el.style.transform = 'translateX(-50%) rotate(-26deg)'
    requestAnimationFrame(() => {
      el.style.transition = 'transform 120ms ease-out'
      el.style.transform = 'translateX(-50%) rotate(0deg)'
    })
  }, [])

  const handleSpin = () => {
    if (isSpinning || !canSpinToday) return

    const spinResult = performSpin()
    if (!spinResult) return

    const rewardIndex = REWARD_ORDER.indexOf(spinResult.reward.type)
    if (rewardIndex === -1) return

    setIsSpinning(true)
    setShowResult(false)
    setResult(spinResult)

    // Land the CENTER of the winning slice (± jitter) under the top pointer
    const sliceCenter = rewardIndex * SEGMENT + SEGMENT / 2
    const jitter = (Math.random() - 0.5) * (SEGMENT - 14)
    const start = rotationRef.current
    const delta = mod(POINTER_ANGLE - sliceCenter - jitter - start, 360) + 360 * 6
    const end = start + delta

    const t0 = performance.now()
    let lastIndex = Math.floor(mod(POINTER_ANGLE - start, 360) / SEGMENT)

    const frame = (now: number) => {
      const t = Math.min((now - t0) / SPIN_MS, 1)
      const current = start + (end - start) * easeOutQuart(t)
      applyRotation(current)

      const idx = Math.floor(mod(POINTER_ANGLE - current, 360) / SEGMENT)
      if (idx !== lastIndex) {
        lastIndex = idx
        flickPointer()
      }

      if (t < 1) {
        rafRef.current = requestAnimationFrame(frame)
      } else {
        rafRef.current = null
        setIsSpinning(false)
        timeoutRef.current = setTimeout(() => setShowResult(true), 450)
      }
    }
    rafRef.current = requestAnimationFrame(frame)
  }

  const handleClose = () => {
    if (isSpinning) return
    setResult(null)
    setShowResult(false)
    onClose()
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width - 0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5
    setTilt({ x: -py * 8, y: px * 10 })
  }

  if (!isOpen || isLoading) return null

  const R = 186
  const bulbs = Array.from({ length: BULB_COUNT }, (_, i) => (i / BULB_COUNT) * Math.PI * 2)

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 backdrop-blur-md transition-all duration-300"
        style={{
          background: `radial-gradient(circle at 50% 40%, ${themeColor}22 0%, rgba(2,6,23,0.85) 60%, rgba(0,0,0,0.92) 100%)`,
        }}
        onClick={handleClose}
      />

      {/* Ambient floating sparks */}
      <div className="fixed inset-0 z-40 pointer-events-none overflow-hidden">
        {Array.from({ length: 14 }).map((_, i) => (
          <span
            key={i}
            className="dsw-spark"
            style={{
              left: `${(i * 73) % 100}%`,
              animationDelay: `${(i % 7) * 0.7}s`,
              animationDuration: `${6 + (i % 5)}s`,
              background: themeColor,
            }}
          />
        ))}
      </div>

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto relative w-full max-w-2xl">
          {/* Close */}
          <button
            onClick={handleClose}
            aria-label="Close"
            disabled={isSpinning}
            className="absolute -top-12 right-0 sm:top-0 sm:right-0 sm:-translate-y-full w-10 h-10 rounded-full bg-gradient-to-br from-amber-400/20 to-amber-400/10 border border-amber-400/30 hover:bg-amber-400/20 flex items-center justify-center transition-colors z-20 disabled:opacity-40"
          >
            <XMarkIcon className="w-6 h-6 text-amber-400" />
          </button>

          {!showResult ? (
            <>
              {/* Title */}
              <div className="text-center mb-8 sm:mb-10 dsw-fade-in">
                <h3
                  className="font-extrabold text-3xl sm:text-4xl mb-2 tracking-tight"
                  style={{
                    background: 'linear-gradient(180deg,#fff7d6 0%,#fbbf24 55%,#b45309 100%)',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    color: 'transparent',
                    filter: 'drop-shadow(0 4px 12px rgba(251,191,36,0.35))',
                  }}
                >
                  Daily Spin Wheel
                </h3>
                <p className="text-amber-200/70 text-sm">
                  {canSpinToday ? 'Spin today and win amazing rewards!' : 'Come back tomorrow for another spin!'}
                </p>
              </div>

              {/* 3D stage */}
              <div
                className="flex justify-center mb-8 sm:mb-10"
                style={{ perspective: '1100px' }}
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setTilt({ x: 0, y: 0 })}
              >
                <div
                  className="relative w-72 h-72 sm:w-96 sm:h-96 dsw-float"
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: `rotateX(${28 + tilt.x}deg) rotateY(${tilt.y}deg)`,
                    transition: 'transform 200ms ease-out',
                  }}
                >
                  {/* Ground shadow */}
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      transform: 'translateZ(-70px) scale(1.05)',
                      background: 'radial-gradient(circle, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 70%)',
                      filter: 'blur(18px)',
                    }}
                  />

                  {/* Glow */}
                  <div
                    className="absolute -inset-6 rounded-full blur-3xl opacity-40"
                    style={{ backgroundColor: themeColor, transform: 'translateZ(-40px)' }}
                  />

                  {/* Extruded edge (gives the wheel physical thickness) */}
                  {Array.from({ length: EXTRUSION_LAYERS }).map((_, i) => (
                    <div
                      key={i}
                      className="absolute inset-0 rounded-full"
                      style={{
                        transform: `translateZ(${-(i + 1) * 3}px)`,
                        background: i % 2 === 0
                          ? 'linear-gradient(135deg,#92400e,#451a03)'
                          : 'linear-gradient(135deg,#b45309,#78350f)',
                      }}
                    />
                  ))}

                  {/* Face: metallic rim */}
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      transform: 'translateZ(2px)',
                      background:
                        'conic-gradient(from 210deg,#fde68a,#b45309,#fcd34d,#78350f,#fde68a,#b45309,#fcd34d,#78350f,#fde68a)',
                      boxShadow: `0 0 50px ${themeColor}55, inset 0 0 24px rgba(0,0,0,0.6)`,
                    }}
                  />

                  {/* Rim bulbs */}
                  <div className="absolute inset-0" style={{ transform: 'translateZ(6px)' }}>
                    {bulbs.map((a, i) => (
                      <span
                        key={i}
                        className={`dsw-bulb ${isSpinning ? 'dsw-bulb-fast' : ''}`}
                        style={{
                          left: `${50 + 47 * Math.cos(a)}%`,
                          top: `${50 + 47 * Math.sin(a)}%`,
                          animationDelay: `${(i % 2) * (isSpinning ? 0.09 : 0.5)}s`,
                        }}
                      />
                    ))}
                  </div>

                  {/* Inner dish */}
                  <div
                    className="absolute rounded-full"
                    style={{
                      inset: '5.5%',
                      transform: 'translateZ(10px)',
                      background: 'radial-gradient(circle at 50% 40%,#1e293b,#020617)',
                      boxShadow: 'inset 0 6px 18px rgba(0,0,0,0.9)',
                    }}
                  />

                  {/* Rotating wheel */}
                  <div className="absolute rounded-full overflow-hidden" style={{ inset: '7%', transform: 'translateZ(16px)' }}>
                    <svg
                      ref={wheelRef}
                      className="w-full h-full"
                      viewBox="0 0 400 400"
                      style={{
                        transform: `rotate(${rotationRef.current}deg)`,
                        willChange: 'transform',
                        filter: isSpinning ? 'saturate(1.2) brightness(1.08)' : 'none',
                        transition: 'filter 300ms',
                      }}
                    >
                      <defs>
                        <radialGradient id="dswShade" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#000" stopOpacity="0.55" />
                          <stop offset="45%" stopColor="#000" stopOpacity="0" />
                          <stop offset="88%" stopColor="#fff" stopOpacity="0.06" />
                          <stop offset="100%" stopColor="#fff" stopOpacity="0.28" />
                        </radialGradient>
                        <linearGradient id="dswSheen" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#fff" stopOpacity="0.25" />
                          <stop offset="50%" stopColor="#fff" stopOpacity="0" />
                          <stop offset="100%" stopColor="#000" stopOpacity="0.25" />
                        </linearGradient>
                        <radialGradient id="dswHub" cx="35%" cy="30%" r="80%">
                          <stop offset="0%" stopColor="#fff7d6" />
                          <stop offset="35%" stopColor={themeColor} />
                          <stop offset="75%" stopColor="#b45309" />
                          <stop offset="100%" stopColor="#451a03" />
                        </radialGradient>
                      </defs>

                      {REWARD_ORDER.map((rewardType, index) => {
                        const reward = REWARDS[rewardType]
                        const a1 = (index * SEGMENT * Math.PI) / 180
                        const a2 = ((index + 1) * SEGMENT * Math.PI) / 180
                        const mid = (a1 + a2) / 2
                        const midDeg = (mid * 180) / Math.PI

                        const x1 = 200 + R * Math.cos(a1)
                        const y1 = 200 + R * Math.sin(a1)
                        const x2 = 200 + R * Math.cos(a2)
                        const y2 = 200 + R * Math.sin(a2)
                        const d = `M 200 200 L ${x1} ${y1} A ${R} ${R} 0 0 1 ${x2} ${y2} Z`

                        const tx = 200 + 128 * Math.cos(mid)
                        const ty = 200 + 128 * Math.sin(mid)
                        const lines = String(reward.label).split('\n')

                        return (
                          <g key={rewardType}>
                            <path d={d} fill={reward.color} />
                            <path d={d} fill="url(#dswShade)" />
                            <path d={d} fill="url(#dswSheen)" />
                            <path d={d} fill="none" stroke="#0f172a" strokeWidth="2.5" />

                            {/* Upright-at-pointer, tangential text */}
                            <g transform={`translate(${tx} ${ty}) rotate(${midDeg + 90})`}>
                              <text
                                y={-14}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fontSize="28"
                                className="pointer-events-none select-none"
                                style={{ filter: 'drop-shadow(0 3px 3px rgba(0,0,0,0.7))' }}
                              >
                                {reward.icon}
                              </text>
                              <text
                                textAnchor="middle"
                                fill="white"
                                fontSize="12.5"
                                fontWeight="800"
                                className="pointer-events-none select-none"
                                style={{
                                  paintOrder: 'stroke',
                                  stroke: 'rgba(0,0,0,0.55)',
                                  strokeWidth: '3px',
                                  strokeLinejoin: 'round',
                                }}
                              >
                                {lines.map((line: string, li: number) => (
                                  <tspan key={li} x="0" dy={li === 0 ? 12 : 14}>
                                    {line}
                                  </tspan>
                                ))}
                              </text>
                            </g>
                          </g>
                        )
                      })}

                      {/* Rim pegs at each slice boundary */}
                      {REWARD_ORDER.map((_, i) => {
                        const a = (i * SEGMENT * Math.PI) / 180
                        return (
                          <circle
                            key={i}
                            cx={200 + (R - 4) * Math.cos(a)}
                            cy={200 + (R - 4) * Math.sin(a)}
                            r="5"
                            fill="url(#dswHub)"
                            stroke="#451a03"
                            strokeWidth="1"
                          />
                        )
                      })}
                    </svg>

                    {/* Glass reflection (static, does not rotate) */}
                    <div
                      className="absolute inset-0 rounded-full pointer-events-none"
                      style={{
                        background:
                          'linear-gradient(155deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.05) 32%, transparent 48%)',
                      }}
                    />
                  </div>

                  {/* Raised hub (also the spin button) */}
                  <button
                    onClick={handleSpin}
                    disabled={isSpinning || !canSpinToday}
                    aria-label="Spin the wheel"
                    className="absolute left-1/2 top-1/2 w-24 h-24 sm:w-28 sm:h-28 -ml-12 -mt-12 sm:-ml-14 sm:-mt-14 rounded-full flex items-center justify-center text-white font-black tracking-wide text-lg sm:text-xl transition-transform active:scale-95 disabled:cursor-not-allowed"
                    style={{
                      transform: 'translateZ(42px)',
                      background: 'radial-gradient(circle at 35% 28%,#fff7d6 0%,#fbbf24 30%,#b45309 72%,#451a03 100%)',
                      boxShadow: '0 12px 24px rgba(0,0,0,0.7), inset 0 -6px 12px rgba(0,0,0,0.45), inset 0 4px 8px rgba(255,255,255,0.5)',
                      textShadow: '0 2px 4px rgba(0,0,0,0.7)',
                    }}
                  >
                    <span className={canSpinToday && !isSpinning ? 'dsw-pulse' : ''}>
                      {isSpinning ? '...' : 'SPIN'}
                    </span>
                  </button>

                  {/* Pointer (tilts with the wheel, flicks when it hits a peg) */}
                  <div
                    ref={pointerRef}
                    className="absolute left-1/2 z-20"
                    style={{
                      top: '-4%',
                      width: 0,
                      height: 0,
                      transform: 'translateX(-50%) translateZ(60px)',
                      transformOrigin: '50% 0%',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        left: -18,
                        top: 0,
                        width: 0,
                        height: 0,
                        borderLeft: '18px solid transparent',
                        borderRight: '18px solid transparent',
                        borderTop: '42px solid #fef3c7',
                        filter: `drop-shadow(0 8px 6px rgba(0,0,0,0.7)) drop-shadow(0 0 10px ${themeColor})`,
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        left: -6,
                        top: 4,
                        width: 12,
                        height: 12,
                        borderRadius: 9999,
                        background: 'radial-gradient(circle at 35% 30%,#fff,#dc2626 60%,#7f1d1d)',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Cooldown / hint */}
              <div className="text-center">
                {canSpinToday ? (
                  <button
                    onClick={handleSpin}
                    disabled={isSpinning}
                    className="relative overflow-hidden px-10 sm:px-14 py-3.5 sm:py-4 rounded-full text-slate-950 font-extrabold text-base sm:text-lg tracking-wide mb-4 bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 shadow-[0_8px_0_#78350f,0_14px_28px_rgba(0,0,0,0.6)] active:translate-y-[4px] active:shadow-[0_4px_0_#78350f,0_8px_16px_rgba(0,0,0,0.6)] transition-all disabled:opacity-60 disabled:active:translate-y-0"
                  >
                    <span className="dsw-shine" />
                    <span className="relative">{isSpinning ? 'Spinning...' : 'SPIN NOW'}</span>
                  </button>
                ) : (
                  <div className="inline-block bg-slate-900/60 rounded-3xl px-8 py-4 mb-4 border border-amber-400/25 backdrop-blur-md shadow-[0_0_30px_rgba(251,191,36,0.12)]">
                    <p className="text-white font-semibold mb-1">Next spin available in</p>
                    <p className="text-3xl font-bold text-amber-400 font-mono tabular-nums">
                      {timeUntilNextSpin
                        ? `${String(timeUntilNextSpin.hours).padStart(2, '0')}:${String(timeUntilNextSpin.minutes).padStart(2, '0')}:${String(timeUntilNextSpin.seconds).padStart(2, '0')}`
                        : 'Loading...'}
                    </p>
                  </div>
                )}
                <p className="text-amber-200/50 text-xs">One spin per day. Come back tomorrow!</p>
              </div>
            </>
          ) : result ? (
            <div className="relative text-center py-6 sm:py-10 dsw-pop-in">
              {/* Confetti */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl">
                {confetti.map((c) => (
                  <span
                    key={c.id}
                    className="dsw-confetti"
                    style={{
                      left: `${c.left}%`,
                      width: c.size,
                      height: c.size * 0.5,
                      background: c.color,
                      animationDelay: `${c.delay}s`,
                      animationDuration: `${c.duration}s`,
                      ['--drift' as any]: `${c.drift}px`,
                      ['--spin' as any]: `${c.spin}deg`,
                    }}
                  />
                ))}
              </div>

              {/* Rotating light rays behind the icon */}
              <div className="relative mx-auto mb-6 w-40 h-40 sm:w-48 sm:h-48 flex items-center justify-center">
                <div
                  className="absolute inset-0 dsw-rays rounded-full"
                  style={{
                    background: `repeating-conic-gradient(from 0deg, ${themeColor}55 0deg 10deg, transparent 10deg 20deg)`,
                    WebkitMaskImage: 'radial-gradient(circle, #000 20%, transparent 70%)',
                    maskImage: 'radial-gradient(circle, #000 20%, transparent 70%)',
                  }}
                />
                <div
                  className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full flex items-center justify-center text-6xl sm:text-7xl dsw-bounce-3d"
                  style={{
                    background: 'radial-gradient(circle at 35% 28%,#334155,#0f172a 70%)',
                    border: `3px solid ${themeColor}`,
                    boxShadow: `0 0 40px ${themeColor}88, 0 18px 30px rgba(0,0,0,0.6), inset 0 -8px 16px rgba(0,0,0,0.5)`,
                  }}
                >
                  {result.reward.icon}
                </div>
              </div>

              <h2
                className="text-3xl sm:text-4xl font-extrabold mb-2"
                style={{
                  background: 'linear-gradient(180deg,#fff7d6,#fbbf24 60%,#b45309)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                }}
              >
                Congratulations!
              </h2>
              <p className="text-xl sm:text-2xl font-bold mb-3 text-amber-300 drop-shadow-md whitespace-pre-line">
                {result.reward.label}
              </p>
              <p className="text-white/80 text-base sm:text-lg mb-8 max-w-md mx-auto">{result.reward.description}</p>

              <div className="flex gap-3 sm:gap-4 flex-col sm:flex-row max-w-md mx-auto">
                <button
                  onClick={handleClose}
                  className="flex-1 px-6 py-3 rounded-full text-slate-950 font-extrabold bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 shadow-[0_6px_0_#78350f,0_12px_24px_rgba(0,0,0,0.5)] active:translate-y-[3px] active:shadow-[0_3px_0_#78350f] transition-all"
                >
                  Claim Reward
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 px-6 py-3 rounded-full bg-slate-800/70 hover:bg-slate-700 text-white font-semibold transition-all border border-amber-400/25 hover:border-amber-400/50"
                >
                  Done
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <style>{`
        @keyframes dsw-fade-in { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes dsw-pop-in { from { opacity: 0; transform: scale(0.85) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes dsw-float { 0%,100% { translate: 0 0; } 50% { translate: 0 -8px; } }
        @keyframes dsw-bulb { 0%,100% { opacity: 0.35; box-shadow: 0 0 2px #fde68a; } 50% { opacity: 1; box-shadow: 0 0 10px 3px #fde68a, 0 0 18px 6px rgba(251,191,36,0.6); } }
        @keyframes dsw-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.12); } }
        @keyframes dsw-shine { 0% { transform: translateX(-120%) skewX(-20deg); } 60%,100% { transform: translateX(260%) skewX(-20deg); } }
        @keyframes dsw-spark { 0% { transform: translateY(105vh) scale(0.4); opacity: 0; } 15% { opacity: 0.8; } 100% { transform: translateY(-10vh) scale(1); opacity: 0; } }
        @keyframes dsw-rays { to { transform: rotate(360deg); } }
        @keyframes dsw-bounce-3d { 0%,100% { transform: translateY(0) rotateY(0deg); } 50% { transform: translateY(-14px) rotateY(180deg); } }
        @keyframes dsw-confetti { 0% { transform: translate(0,-20px) rotate(0deg); opacity: 1; } 100% { transform: translate(var(--drift), 480px) rotate(var(--spin)); opacity: 0; } }

        .dsw-fade-in { animation: dsw-fade-in 0.6s ease-out; }
        .dsw-pop-in { animation: dsw-pop-in 0.55s cubic-bezier(0.34,1.56,0.64,1); }
        .dsw-float { animation: dsw-float 4s ease-in-out infinite; }
        .dsw-pulse { display: inline-block; animation: dsw-pulse 1.4s ease-in-out infinite; }
        .dsw-rays { animation: dsw-rays 14s linear infinite; }
        .dsw-bounce-3d { animation: dsw-bounce-3d 2.4s ease-in-out infinite; transform-style: preserve-3d; }

        .dsw-bulb {
          position: absolute; width: 10px; height: 10px; margin: -5px 0 0 -5px; border-radius: 9999px;
          background: radial-gradient(circle at 35% 30%, #fff, #fde68a 55%, #d97706);
          animation: dsw-bulb 1s ease-in-out infinite;
        }
        .dsw-bulb-fast { animation-duration: 0.18s; }

        .dsw-shine {
          position: absolute; top: 0; bottom: 0; left: 0; width: 40%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent);
          animation: dsw-shine 2.6s ease-in-out infinite;
        }

        .dsw-spark {
          position: absolute; bottom: 0; width: 4px; height: 4px; border-radius: 9999px;
          animation: dsw-spark linear infinite; filter: blur(0.5px);
        }
        .dsw-confetti { position: absolute; top: 0; border-radius: 2px; animation: dsw-confetti ease-in forwards; }

        @media (prefers-reduced-motion: reduce) {
          .dsw-float, .dsw-rays, .dsw-bounce-3d, .dsw-shine, .dsw-spark, .dsw-bulb, .dsw-pulse { animation: none !important; }
        }
      `}</style>
    </>
  )
}
