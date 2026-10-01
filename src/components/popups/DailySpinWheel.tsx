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
const BULB_COUNT = 16
const R = 186
const CONFETTI_COLORS = ['#fbbf24', '#f59e0b', '#fde68a', '#34d399', '#60a5fa', '#f472b6', '#ffffff']

// Alternating slice styles (cream / deep amber) for maximum label contrast
const SLICE_STYLES = [
  { fill: '#fff6df', text: '#4a1d04', halo: 'rgba(255,255,255,0.0)' },
  { fill: '#b45309', text: '#ffffff', halo: 'rgba(60,20,0,0.65)' },
]

const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4)
const mod = (n: number, m: number) => ((n % m) + m) % m

// Use the label's own line breaks; otherwise wrap long labels onto two lines
function wrapLabel(label: string): string[] {
  const raw = String(label ?? '')
  if (raw.includes('\n')) return raw.split('\n').slice(0, 3)
  if (raw.length <= 10 || !raw.includes(' ')) return [raw]
  const words = raw.split(' ')
  let best = 1
  let bestDiff = Infinity
  for (let i = 1; i < words.length; i++) {
    const diff = Math.abs(words.slice(0, i).join(' ').length - words.slice(i).join(' ').length)
    if (diff < bestDiff) { bestDiff = diff; best = i }
  }
  return [words.slice(0, best).join(' '), words.slice(best).join(' ')]
}

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

  const wheelRef = useRef<SVGSVGElement>(null)
  const pointerRef = useRef<HTMLDivElement>(null)
  const rotationRef = useRef(0)
  const rafRef = useRef<number | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  // Pointer swings back and forth around the hub each time it passes a peg
  const flickPointer = useCallback(() => {
    const el = pointerRef.current
    if (!el) return
    el.style.transition = 'none'
    el.style.transform = 'rotate(-16deg)'
    requestAnimationFrame(() => {
      el.style.transition = 'transform 130ms ease-out'
      el.style.transform = 'rotate(0deg)'
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

    // Land the winning slice (± jitter, never on a divider) under the top pointer
    const sliceCenter = rewardIndex * SEGMENT + SEGMENT / 2
    const jitter = (Math.random() - 0.5) * (SEGMENT - 16)
    const start = rotationRef.current
    const end = start + mod(POINTER_ANGLE - sliceCenter - jitter - start, 360) + 360 * 6

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
        timeoutRef.current = setTimeout(() => setShowResult(true), 500)
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

  if (!isOpen || isLoading) return null

  const bulbs = Array.from({ length: BULB_COUNT }, (_, i) => (i / BULB_COUNT) * Math.PI * 2)
  const countdown = timeUntilNextSpin
    ? `${String(timeUntilNextSpin.hours).padStart(2, '0')}:${String(timeUntilNextSpin.minutes).padStart(2, '0')}:${String(timeUntilNextSpin.seconds).padStart(2, '0')}`
    : '--:--:--'

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 backdrop-blur-md"
        style={{
          background: `radial-gradient(circle at 50% 35%, ${themeColor}2e 0%, rgba(2,6,23,0.88) 58%, rgba(0,0,0,0.95) 100%)`,
        }}
        onClick={handleClose}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none overflow-y-auto">
        <div className="pointer-events-auto relative w-full max-w-md my-auto">
          <button
            onClick={handleClose}
            aria-label="Close"
            disabled={isSpinning}
            className="absolute -top-2 right-0 w-10 h-10 rounded-full bg-white/10 border border-white/20 hover:bg-white/20 flex items-center justify-center transition-colors z-20 disabled:opacity-40"
          >
            <XMarkIcon className="w-6 h-6 text-white" />
          </button>

          {!showResult ? (
            <>
              {/* Title */}
              <div className="text-center pt-8 mb-6 dsw-fade-in">
                <h3
                  className="font-black text-3xl sm:text-4xl tracking-tight uppercase"
                  style={{
                    background: 'linear-gradient(180deg,#ffffff 0%,#fde68a 45%,#f59e0b 100%)',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    color: 'transparent',
                    filter: 'drop-shadow(0 3px 0 rgba(120,53,15,0.8)) drop-shadow(0 8px 14px rgba(0,0,0,0.5))',
                  }}
                >
                  Daily Spin
                </h3>
                <p className="mt-3 inline-block px-4 py-1 rounded-full bg-black/40 border border-amber-300/40 text-amber-100 text-sm font-semibold">
                  1 free spin every day
                </p>
              </div>

              {/* Wheel */}
              <div className="relative mx-auto w-[19.5rem] sm:w-[25rem] aspect-square">
                {/* ground glow + shadow */}
                <div
                  className="absolute -inset-4 rounded-full blur-3xl opacity-40"
                  style={{ backgroundColor: themeColor }}
                />

                {/* Gold rim */}
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background:
                      'conic-gradient(from 200deg,#fff1b8,#e0a526,#fff1b8,#c68a15,#fff1b8,#e0a526,#fff1b8,#c68a15,#fff1b8)',
                    boxShadow:
                      '0 18px 40px rgba(0,0,0,0.65), inset 0 0 0 3px rgba(120,70,5,0.55), inset 0 0 0 7px rgba(255,241,184,0.55), inset 0 -10px 18px rgba(120,70,5,0.45)',
                  }}
                />

                {/* Rim bulbs */}
                {bulbs.map((a, i) => (
                  <span
                    key={i}
                    className={`dsw-bulb ${isSpinning ? 'dsw-bulb-fast' : ''}`}
                    style={{
                      left: `${50 + 46.6 * Math.cos(a)}%`,
                      top: `${50 + 46.6 * Math.sin(a)}%`,
                      animationDelay: `${(i % 2) * (isSpinning ? 0.09 : 0.6)}s`,
                    }}
                  />
                ))}

                {/* Slice dish */}
                <div
                  className="absolute rounded-full overflow-hidden"
                  style={{ inset: '7.2%', boxShadow: 'inset 0 0 0 3px rgba(120,70,5,0.7), 0 0 0 2px rgba(255,241,184,0.7)' }}
                >
                  <svg
                    ref={wheelRef}
                    className="w-full h-full"
                    viewBox="0 0 400 400"
                    style={{ transform: `rotate(${rotationRef.current}deg)`, willChange: 'transform' }}
                  >
                    <defs>
                      <radialGradient id="dswDepth" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#000" stopOpacity="0.28" />
                        <stop offset="40%" stopColor="#000" stopOpacity="0" />
                        <stop offset="100%" stopColor="#000" stopOpacity="0.18" />
                      </radialGradient>
                      <radialGradient id="dswCoin" cx="35%" cy="30%" r="80%">
                        <stop offset="0%" stopColor="#fffbe0" />
                        <stop offset="45%" stopColor="#fcd34d" />
                        <stop offset="100%" stopColor="#b7791f" />
                      </radialGradient>
                      <radialGradient id="dswPeg" cx="35%" cy="30%" r="80%">
                        <stop offset="0%" stopColor="#fff" />
                        <stop offset="100%" stopColor="#d99a1e" />
                      </radialGradient>
                    </defs>

                    {REWARD_ORDER.map((rewardType, index) => {
                      const reward = REWARDS[rewardType]
                      const style = SLICE_STYLES[index % 2]
                      const a1 = (index * SEGMENT * Math.PI) / 180
                      const a2 = ((index + 1) * SEGMENT * Math.PI) / 180
                      const midDeg = (index * SEGMENT) + SEGMENT / 2

                      const d = `M 200 200 L ${200 + R * Math.cos(a1)} ${200 + R * Math.sin(a1)} A ${R} ${R} 0 0 1 ${200 + R * Math.cos(a2)} ${200 + R * Math.sin(a2)} Z`
                      const lines = wrapLabel(reward.label)
                      const fontSize = lines.some((l) => l.length > 12) ? 16 : 18

                      return (
                        <g key={rewardType}>
                          <path d={d} fill={style.fill} />
                          <path d={d} fill="url(#dswDepth)" />
                          <path d={d} fill="none" stroke="rgba(120,53,15,0.55)" strokeWidth="2" />

                          {/* Local frame: -y points to the rim, text is upright when slice is at the top */}
                          <g transform={`translate(200 200) rotate(${midDeg + 90})`}>
                            {/* Label near the rim */}
                            <text
                              textAnchor="middle"
                              fontWeight="800"
                              fontSize={fontSize}
                              fill={style.text}
                              className="pointer-events-none select-none"
                              style={{
                                paintOrder: 'stroke',
                                stroke: style.halo,
                                strokeWidth: '3px',
                                strokeLinejoin: 'round',
                              }}
                            >
                              {lines.map((line, li) => (
                                <tspan
                                  key={li}
                                  x="0"
                                  y={-150 + (li - (lines.length - 1) / 2) * (fontSize + 3) + fontSize / 3}
                                >
                                  {line}
                                </tspan>
                              ))}
                            </text>

                            {/* Icon coin, tinted with the reward colour */}
                            <circle cx="0" cy="-92" r="28" fill="url(#dswCoin)" stroke={reward.color} strokeWidth="5" />
                            <circle cx="0" cy="-92" r="22" fill="none" stroke="rgba(120,70,5,0.35)" strokeWidth="1.5" />
                            <text
                              x="0"
                              y="-91"
                              textAnchor="middle"
                              dominantBaseline="middle"
                              fontSize="26"
                              className="pointer-events-none select-none"
                            >
                              {reward.icon}
                            </text>
                          </g>
                        </g>
                      )
                    })}

                    {/* Pegs at slice boundaries */}
                    {REWARD_ORDER.map((_, i) => {
                      const a = (i * SEGMENT * Math.PI) / 180
                      return (
                        <circle
                          key={i}
                          cx={200 + (R - 3) * Math.cos(a)}
                          cy={200 + (R - 3) * Math.sin(a)}
                          r="5.5"
                          fill="url(#dswPeg)"
                          stroke="#78350f"
                          strokeWidth="1"
                        />
                      )
                    })}
                  </svg>
                </div>

                {/* Pointer: a teardrop that sits on the hub and swings on every peg */}
                <div ref={pointerRef} className="absolute inset-0 pointer-events-none z-10" style={{ transformOrigin: '50% 50%' }}>
                  <div
                    className="absolute"
                    style={{
                      left: '50%',
                      top: '29%',
                      width: '9.5%',
                      aspectRatio: '1',
                      marginLeft: '-4.75%',
                      borderRadius: '0 50% 50% 50%',
                      transform: 'rotate(45deg)',
                      background: 'radial-gradient(circle at 35% 30%,#fffbe0,#fcd34d 45%,#b7791f)',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.5), inset 0 0 0 2px rgba(120,70,5,0.45)',
                    }}
                  />
                </div>

                {/* Hub (also the spin button) */}
                <button
                  onClick={handleSpin}
                  disabled={isSpinning || !canSpinToday}
                  aria-label="Spin the wheel"
                  className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center font-black text-base sm:text-lg transition-transform active:scale-95 disabled:cursor-not-allowed"
                  style={{
                    width: '23%',
                    aspectRatio: '1',
                    color: '#5b2a06',
                    background: 'radial-gradient(circle at 35% 28%,#fffbe0 0%,#fcd34d 38%,#d99a1e 75%,#9a6410 100%)',
                    boxShadow:
                      '0 8px 16px rgba(0,0,0,0.55), inset 0 0 0 3px rgba(255,241,184,0.8), inset 0 -5px 10px rgba(120,70,5,0.5), 0 0 0 4px #c68a15',
                    textShadow: '0 1px 0 rgba(255,255,255,0.7)',
                    opacity: canSpinToday ? 1 : 0.75,
                  }}
                >
                  <span className={canSpinToday && !isSpinning ? 'dsw-pulse' : ''}>SPIN</span>
                </button>

                {/* Stand */}
                <svg
                  className="absolute left-1/2 -translate-x-1/2 -bottom-[13%] w-[44%] -z-10"
                  viewBox="0 0 180 60"
                  aria-hidden
                >
                  <defs>
                    <linearGradient id="dswStand" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#fff1b8" />
                      <stop offset="50%" stopColor="#e0a526" />
                      <stop offset="100%" stopColor="#9a6410" />
                    </linearGradient>
                  </defs>
                  <path d="M62 0 H118 L134 38 H46 Z" fill="url(#dswStand)" />
                  <path d="M22 38 H158 Q172 38 172 48 V54 Q172 60 164 60 H16 Q8 60 8 54 V48 Q8 38 22 38 Z" fill="url(#dswStand)" stroke="#78450a" strokeWidth="1.5" />
                </svg>
              </div>

              {/* Action + status */}
              <div className="mt-[18%] sm:mt-[16%]">
                <button
                  onClick={handleSpin}
                  disabled={isSpinning || !canSpinToday}
                  className={`relative overflow-hidden w-full py-4 rounded-full font-extrabold text-lg tracking-wide transition-all ${
                    canSpinToday
                      ? 'text-amber-950 bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 shadow-[0_6px_0_#78350f,0_14px_26px_rgba(0,0,0,0.55)] active:translate-y-[3px] active:shadow-[0_3px_0_#78350f] disabled:opacity-70'
                      : 'text-white/60 bg-white/10 border border-white/15 cursor-not-allowed'
                  }`}
                >
                  {canSpinToday && !isSpinning && <span className="dsw-shine" />}
                  <span className="relative">
                    {isSpinning ? 'Spinning...' : canSpinToday ? 'Spin Now' : 'Spin used today'}
                  </span>
                </button>

                <div className="mt-4 rounded-2xl bg-white/95 text-slate-800 px-5 py-4 shadow-[0_10px_30px_rgba(0,0,0,0.4)]">
                  {canSpinToday ? (
                    <p className="text-center font-semibold">Your free spin for today is ready</p>
                  ) : (
                    <div className="text-center">
                      <p className="text-sm font-semibold text-slate-500">Next spin available in</p>
                      <p className="text-3xl font-black text-amber-600 font-mono tabular-nums">{countdown}</p>
                    </div>
                  )}
                  <p className="mt-2 pt-2 border-t border-slate-200 text-center text-xs text-slate-500">
                    One spin per day. Come back tomorrow!
                  </p>
                </div>
              </div>
            </>
          ) : result ? (
            <div className="relative text-center py-8 sm:py-10 dsw-pop-in">
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

              <div className="relative mx-auto mb-6 w-44 h-44 flex items-center justify-center">
                <div
                  className="absolute inset-0 dsw-rays rounded-full"
                  style={{
                    background: `repeating-conic-gradient(from 0deg, ${themeColor}55 0deg 10deg, transparent 10deg 20deg)`,
                    WebkitMaskImage: 'radial-gradient(circle, #000 20%, transparent 70%)',
                    maskImage: 'radial-gradient(circle, #000 20%, transparent 70%)',
                  }}
                />
                <div
                  className="relative w-32 h-32 rounded-full flex items-center justify-center text-7xl dsw-bounce"
                  style={{
                    background: 'radial-gradient(circle at 35% 28%,#fffbe0,#fcd34d 45%,#b7791f)',
                    border: '4px solid #fff1b8',
                    boxShadow: `0 0 40px ${themeColor}99, 0 18px 30px rgba(0,0,0,0.55), inset 0 -8px 14px rgba(120,70,5,0.45)`,
                  }}
                >
                  {result.reward.icon}
                </div>
              </div>

              <h2
                className="text-3xl sm:text-4xl font-black mb-2"
                style={{
                  background: 'linear-gradient(180deg,#fff,#fde68a 50%,#f59e0b)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                }}
              >
                Congratulations!
              </h2>
              <p className="text-xl sm:text-2xl font-bold mb-3 text-amber-300 whitespace-pre-line">{result.reward.label}</p>
              <p className="text-white/80 text-base sm:text-lg mb-8 max-w-sm mx-auto">{result.reward.description}</p>

              <div className="flex gap-3 flex-col sm:flex-row max-w-sm mx-auto">
                <button
                  onClick={() => {
                    // Dispatch event to notify that reward token has been claimed
                    window.dispatchEvent(new CustomEvent('rewardTokenClaimed'))
                    handleClose()
                  }}
                  className="flex-1 px-6 py-3 rounded-full text-amber-950 font-extrabold bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 shadow-[0_6px_0_#78350f,0_12px_24px_rgba(0,0,0,0.5)] active:translate-y-[3px] active:shadow-[0_3px_0_#78350f] transition-all"
                >
                  Claim Reward
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold transition-all border border-white/20"
                >
                  Done
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <style>{`
        @keyframes dsw-fade-in { from { opacity: 0; transform: translateY(-16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes dsw-pop-in { from { opacity: 0; transform: scale(0.85) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes dsw-bulb { 0%,100% { opacity: 0.55; box-shadow: 0 0 2px rgba(255,255,255,0.6); } 50% { opacity: 1; box-shadow: 0 0 8px 3px rgba(255,255,255,0.95), 0 0 16px 6px rgba(253,224,71,0.6); } }
        @keyframes dsw-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.12); } }
        @keyframes dsw-shine { 0% { transform: translateX(-120%) skewX(-20deg); } 60%,100% { transform: translateX(260%) skewX(-20deg); } }
        @keyframes dsw-rays { to { transform: rotate(360deg); } }
        @keyframes dsw-bounce { 0%,100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-12px) scale(1.04); } }
        @keyframes dsw-confetti { 0% { transform: translate(0,-20px) rotate(0deg); opacity: 1; } 100% { transform: translate(var(--drift), 480px) rotate(var(--spin)); opacity: 0; } }

        .dsw-fade-in { animation: dsw-fade-in 0.6s ease-out; }
        .dsw-pop-in { animation: dsw-pop-in 0.55s cubic-bezier(0.34,1.56,0.64,1); }
        .dsw-pulse { display: inline-block; animation: dsw-pulse 1.4s ease-in-out infinite; }
        .dsw-rays { animation: dsw-rays 14s linear infinite; }
        .dsw-bounce { animation: dsw-bounce 2.2s ease-in-out infinite; }

        .dsw-bulb {
          position: absolute; width: 3.2%; aspect-ratio: 1; margin-left: -1.6%; margin-top: -1.6%;
          border-radius: 9999px;
          background: radial-gradient(circle at 35% 30%, #fff, #fff7d6 60%, #f5d36b);
          animation: dsw-bulb 1.2s ease-in-out infinite;
        }
        .dsw-bulb-fast { animation-duration: 0.18s; }

        .dsw-shine {
          position: absolute; top: 0; bottom: 0; left: 0; width: 35%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent);
          animation: dsw-shine 2.6s ease-in-out infinite;
        }
        .dsw-confetti { position: absolute; top: 0; border-radius: 2px; animation: dsw-confetti ease-in forwards; }

        @media (prefers-reduced-motion: reduce) {
          .dsw-rays, .dsw-bounce, .dsw-shine, .dsw-bulb, .dsw-pulse { animation: none !important; }
        }
      `}</style>
    </>
  )
}