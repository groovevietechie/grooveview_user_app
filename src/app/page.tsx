'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import {
  ArrowRightIcon,
  CalendarDaysIcon,
  ChevronDownIcon,
  ClockIcon,
  MapPinIcon,
  PlayIcon,
  SparklesIcon,
  CakeIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline'
import type { Menu, MenuCategory, MenuItem, ServiceConfiguration } from '@/types/database'

const LOUNGE_SLUG = 'groovevie-serviced-lounge'
const MENU_PATH = '/b/groovevie-serviced-lounge?tab=a03564a6-344e-471e-86c6-1581ba9ff929'
const DRINK_WORDS = ['drink', 'beverage', 'juice', 'water', 'soda', 'coffee', 'tea', 'cocktail', 'beer', 'wine', 'smoothie', 'shake', 'latte']

interface MenuPayload { menus: Menu[]; categories: MenuCategory[]; items: MenuItem[] }
interface ServicePayload { services: ServiceConfiguration[] }
interface ServiceCard { key: 'game' | 'party'; title: string; eyebrow: string; description: string; image: string; features: string[]; icon: typeof PlayIcon }

const serviceCards: ServiceCard[] = [
  { key: 'game', title: 'Game Time', eyebrow: 'PLAY / COMPETE / REPEAT', description: 'Switch on the energy with immersive gaming, friendly competition, and a lounge built for your next high-score moment.', image: '/back2.png', features: ['Console sessions', 'Competitive play', 'All-night atmosphere'], icon: PlayIcon },
  { key: 'party', title: 'Party Time', eyebrow: 'CELEBRATE IN YOUR FREQUENCY', description: 'Bring your people into the signal with music, lights, drinks, and a flexible setting for celebrations that feel unmistakably yours.', image: '/services.jpeg', features: ['Curated celebrations', 'Music and lighting', 'Event-ready spaces'], icon: CalendarDaysIcon },
]

function scrollTo(id: string) { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }
function isDrinks(menu: Menu) { return DRINK_WORDS.some((word) => menu.name.toLowerCase().includes(word)) }

export default function Home() {
  const [data, setData] = useState<MenuPayload>({ menus: [], categories: [], items: [] })
  const [services, setServices] = useState<ServiceConfiguration[]>([])
  const [active, setActive] = useState<'drinks' | 'food'>('drinks')
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      fetch(`/api/menu/categories?slug=${LOUNGE_SLUG}&landing=1`, { cache: 'no-store' }),
      fetch(`/api/services?slug=${LOUNGE_SLUG}&landing=1`, { cache: 'no-store' }),
    ])
      .then(async ([menuResponse, serviceResponse]) => {
        if (!menuResponse.ok) throw new Error('Menu request failed')
        const menu = (await menuResponse.json()) as MenuPayload
        const service = serviceResponse.ok ? ((await serviceResponse.json()) as ServicePayload) : { services: [] }
        if (!cancelled) {
          setData({ menus: menu.menus || [], categories: menu.categories || [], items: menu.items || [] })
          setServices(service.services || [])
        }
      })
      .catch((error) => { console.error('[Home] Landing data failed:', error); if (!cancelled) setFailed(true) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const groups = useMemo(() => {
    const result = { drinks: [] as MenuItem[], food: [] as MenuItem[], categories: { drinks: [] as MenuCategory[], food: [] as MenuCategory[] } }
    data.menus.forEach((menu) => {
      const categories = data.categories.filter((category) => category.menu_id === menu.id)
      const items = data.items.filter((item) => categories.some((category) => category.id === item.category_id))
      const kind = isDrinks(menu) ? 'drinks' : 'food'
      result[kind].push(...items)
      result.categories[kind].push(...categories)
    })
    return result
  }, [data])

  const visibleItems = groups[active]
  const visibleCategories = groups.categories[active]
  const resolvedServices = serviceCards.map((card) => {
    const match = services.find((service) => `${service.title} ${service.service_type || ''}`.toLowerCase().includes(card.key))
    return { ...card, description: match?.description || card.description }
  })

  return (
    <main className="gv-landing">
      <div className="gv-landing__grid" aria-hidden="true" />
      <header className="gv-landing__nav">
        <a className="gv-landing__brand" href="#top" aria-label="GrooveVie home">
          <span className="gv-landing__brand-mark"><Image src="/groovevielogo.png" alt="GrooveVie" fill priority sizes="42px" /></span>
          <span><strong>GROOVEVIE</strong><small>SERVICED LOUNGE</small></span>
        </a>
        <nav><button onClick={() => scrollTo('menu')}>Menu</button><button onClick={() => scrollTo('services')}>Services</button><button onClick={() => scrollTo('signal')}>The lounge</button></nav>
        <a className="gv-landing__nav-cta" href={MENU_PATH}>Enter lounge <ArrowRightIcon /></a>
      </header>

      <section id="top" className="gv-landing__hero">
        <div className="gv-landing__hero-art" aria-hidden="true" />
        <div className="gv-landing__hero-overlay" aria-hidden="true" />
        <div className="gv-landing__hero-copy">
          <p className="gv-landing__kicker"><span /> NOW TRANSMITTING FROM GROOVEVIE</p>
          <div className="gv-landing__lockup"><span><Image src="/groovevielogo.png" alt="" fill priority sizes="96px" /></span><i /><small>GV / 001</small></div>
          <h1>Good drinks.<br /><em>Great frequencies.</em></h1>
          <p className="gv-landing__lead">GrooveVie Serviced Lounge is your after-hours destination for sharp pours, easy plates, game energy, and celebrations tuned to your people.</p>
          <div className="gv-landing__actions"><a className="gv-landing__gold-button" href={MENU_PATH}>Explore the lounge <ArrowRightIcon /></a><button className="gv-landing__browse" onClick={() => scrollTo('menu')}>Browse the menu <ChevronDownIcon /></button></div>
        </div>
        <div className="gv-landing__hero-meta"><span><MapPinIcon /> GrooveVie Serviced Lounge</span><span><ClockIcon /> Open for your next moment</span></div>
        <div className="gv-landing__scroll">SCROLL TO DISCOVER <i /></div>
      </section>

      <section id="signal" className="gv-landing__section gv-landing__signal">
        <div className="gv-landing__label"><span>01</span><i /> THE GROOVEVIE SIGNAL</div>
        <div className="gv-landing__signal-layout"><h2>A lounge with a little more <em>voltage.</em></h2><div><p>Every visit is designed as a smooth switch from ordinary to unforgettable. Pull up, pick your frequency, and let the room do the rest.</p><div className="gv-landing__stats"><span><b>01</b>Curated menu</span><span><b>02</b>Game energy</span><span><b>03</b>Party mode</span></div></div></div>
      </section>

      <section id="menu" className="gv-landing__section gv-landing__menu">
        <div className="gv-landing__section-head"><div><div className="gv-landing__label"><span>02</span><i /> LIVE FROM THE MENU</div><h2>Pick your <em>frequency.</em></h2></div><a href={MENU_PATH}>Open full menu <ArrowRightIcon /></a></div>
        <div className="gv-landing__tabs" role="tablist">
          <button className={active === 'drinks' ? 'is-active' : ''} onClick={() => setActive('drinks')} role="tab" aria-selected={active === 'drinks'}><span><SparklesIcon /> Drinks</span><small>{groups.drinks.length} selections</small></button>
          <button className={active === 'food' ? 'is-active' : ''} onClick={() => setActive('food')} role="tab" aria-selected={active === 'food'}><span><CakeIcon /> Food</span><small>{groups.food.length} selections</small></button>
        </div>
        {loading ? <div className="gv-landing__empty"><SparklesIcon /><p>Syncing the lounge menu...</p></div> : failed ? <div className="gv-landing__empty"><p>Our menu signal is taking a moment.</p><a href={MENU_PATH}>Open the ordering lounge <ArrowRightIcon /></a></div> : visibleItems.length === 0 ? <div className="gv-landing__empty"><p>New {active} selections are being tuned.</p><a href={MENU_PATH}>Enter the full menu <ArrowRightIcon /></a></div> : <>
          <div className="gv-landing__category-line">{visibleCategories.slice(0, 7).map((category) => <span key={category.id}>{category.name}</span>)}</div>
          <div className="gv-landing__menu-grid">{visibleItems.slice(0, 12).map((item, index) => { const category = data.categories.find((entry) => entry.id === item.category_id); return <article className="gv-landing__menu-card" key={item.id} style={{ '--delay': `${index * 60}ms` } as React.CSSProperties}><div className="gv-landing__menu-image">{item.image_url ? <Image src={item.image_url} alt={item.name} fill sizes="(max-width: 700px) 50vw, 25vw" /> : <div><SparklesIcon /></div>}<small>0{(index % 9) + 1}</small></div><div className="gv-landing__menu-copy"><small>{category?.name || (active === 'drinks' ? 'Drinks' : 'Kitchen')}</small><h3>{item.name}</h3>{item.description && <p>{item.description}</p>}</div></article> })}</div>
        </>}
        <div className="gv-landing__menu-footer"><span>Live selection from our {active} collection. Prices are available inside the ordering menu.</span><a href={MENU_PATH}>View everything <ArrowRightIcon /></a></div>
      </section>

      <section id="services" className="gv-landing__section gv-landing__services"><div className="gv-landing__label"><span>03</span><i /> SERVICES / AFTER HOURS</div><div className="gv-landing__section-head"><div><h2>Choose your <em>mode.</em></h2><p>Come for the menu. Stay for the atmosphere.</p></div><WrenchScrewdriverIcon /></div><div className="gv-landing__service-grid">{resolvedServices.map((service) => { const Icon = service.icon; return <article className="gv-landing__service-card" key={service.key}><Image src={service.image} alt="" fill sizes="(max-width: 800px) 100vw, 50vw" /><div className="gv-landing__service-shade" /><div className="gv-landing__service-copy"><span className="gv-landing__service-icon"><Icon /></span><small>{service.eyebrow}</small><h3>{service.title}</h3><p>{service.description}</p><ul>{service.features.map((feature) => <li key={feature}><i />{feature}</li>)}</ul><a href={MENU_PATH + '&mode=services'}>Explore {service.title} <ArrowRightIcon /></a></div></article> })}</div></section>

      <section className="gv-landing__final"><div /><Image src="/groovevielogo.png" alt="GrooveVie" width={74} height={74} /><p>Your table is waiting.</p><a className="gv-landing__gold-button" href={MENU_PATH}>Enter GrooveVie <ArrowRightIcon /></a></section>
      <footer className="gv-landing__footer"><span>GROOVEVIE SERVICED LOUNGE</span><span>GV / 001</span><span>© {new Date().getFullYear()} GrooveVie</span></footer>

      <style>{`
        .gv-landing{--ink:#030b19;--navy:#071a36;--gold:#edc75b;--bright:#ffe89a;--muted:#aebed4;position:relative;min-height:100vh;overflow:hidden;color:#f5f7fb;background:var(--ink)}.gv-landing__grid{position:fixed;inset:0;z-index:0;pointer-events:none;opacity:.12;background-image:linear-gradient(rgba(208,181,91,.25) 1px,transparent 1px),linear-gradient(90deg,rgba(208,181,91,.25) 1px,transparent 1px);background-size:72px 72px;mask-image:linear-gradient(#000,transparent 70%)}.gv-landing__nav{position:fixed;z-index:30;inset:0 0 auto;display:flex;align-items:center;gap:25px;padding:13px clamp(18px,4vw,64px);background:rgba(3,11,25,.84);border-bottom:1px solid rgba(216,183,77,.18);backdrop-filter:blur(18px)}.gv-landing__brand{display:flex;align-items:center;gap:10px;color:#fff;text-decoration:none}.gv-landing__brand-mark{position:relative;width:40px;height:40px}.gv-landing__brand-mark img,.gv-landing__lockup img{object-fit:contain}.gv-landing__brand strong{display:block;color:var(--bright);font-size:13px;letter-spacing:.18em}.gv-landing__brand small{display:block;color:#91a5c5;font-size:8px;letter-spacing:.2em}.gv-landing__nav nav{display:flex;gap:8px;margin-left:auto}.gv-landing__nav nav button,.gv-landing__nav-cta{color:#dbe5f5;font:inherit;font-size:11px;font-weight:700;letter-spacing:.13em;text-transform:uppercase}.gv-landing__nav nav button{padding:9px 11px;border:0;background:transparent;cursor:pointer}.gv-landing__nav nav button:hover{color:var(--bright)}.gv-landing__nav-cta{display:inline-flex;align-items:center;gap:8px;padding:10px 15px;color:#111;background:var(--gold);border:1px solid var(--bright);border-radius:999px;text-decoration:none}.gv-landing svg{width:16px;height:16px}.gv-landing__hero{position:relative;z-index:1;min-height:min(850px,100vh);display:flex;align-items:center;padding:142px clamp(20px,8vw,140px) 105px;border-bottom:1px solid rgba(216,183,77,.25);overflow:hidden}.gv-landing__hero-art{position:absolute;inset:0;background:url("/menu_page_background.jpeg") center/cover;filter:saturate(.8) contrast(1.16);transform:scale(1.03)}.gv-landing__hero-overlay{position:absolute;inset:0;background:linear-gradient(90deg,rgba(3,11,25,.98),rgba(3,11,25,.83) 39%,rgba(3,11,25,.3) 78%,rgba(3,11,25,.7)),linear-gradient(0deg,rgba(3,11,25,1),transparent 30%,rgba(3,11,25,.62))}.gv-landing__hero-copy{position:relative;z-index:2;max-width:700px}.gv-landing__kicker,.gv-landing__label{display:flex;align-items:center;gap:9px;color:var(--gold);font-size:10px;font-weight:800;letter-spacing:.2em;text-transform:uppercase}.gv-landing__kicker{margin-bottom:25px}.gv-landing__kicker span{width:7px;height:7px;border-radius:50%;background:var(--gold);box-shadow:0 0 14px var(--gold)}.gv-landing__lockup{display:flex;align-items:center;gap:16px;margin-bottom:22px}.gv-landing__lockup>span{position:relative;width:86px;height:86px}.gv-landing__lockup i{width:90px;height:1px;background:var(--gold)}.gv-landing__lockup small{color:#a6b5cc;font-size:10px;letter-spacing:.17em}.gv-landing h1{margin:0;color:#f8fbff;font-size:clamp(3.4rem,8vw,7.8rem);font-weight:800;line-height:.88;letter-spacing:-.075em}.gv-landing h1 em,.gv-landing h2 em{color:var(--bright);font-style:normal}.gv-landing__lead{max-width:540px;margin:29px 0 0;color:#c3d0e4;font-size:clamp(15px,1.7vw,19px);line-height:1.6}.gv-landing__actions{display:flex;align-items:center;gap:24px;margin-top:33px}.gv-landing__gold-button{display:inline-flex;align-items:center;gap:12px;padding:14px 18px;color:#111;font-size:12px;font-weight:800;letter-spacing:.08em;text-decoration:none;text-transform:uppercase;background:linear-gradient(135deg,#ffe98d,#d5a82f);border-radius:999px;box-shadow:0 15px 35px rgba(213,168,47,.2)}.gv-landing__gold-button:hover{transform:translateY(-2px);box-shadow:0 19px 42px rgba(213,168,47,.35)}.gv-landing__browse{display:inline-flex;align-items:center;gap:8px;color:#dbe5f4;font:inherit;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;background:transparent;border:0;cursor:pointer}.gv-landing__browse:hover{color:var(--bright)}.gv-landing__hero-meta{position:absolute;z-index:2;right:clamp(20px,8vw,140px);bottom:45px;display:grid;gap:9px;color:#b7c5d9;font-size:10px;letter-spacing:.1em;text-transform:uppercase}.gv-landing__hero-meta span{display:flex;align-items:center;gap:8px}.gv-landing__hero-meta svg{color:var(--gold)}.gv-landing__scroll{position:absolute;z-index:2;bottom:44px;left:clamp(20px,8vw,140px);display:flex;align-items:center;gap:12px;color:#8fa1bb;font-size:9px;letter-spacing:.2em}.gv-landing__scroll i{width:52px;height:1px;background:var(--gold)}.gv-landing__section{position:relative;z-index:1;max-width:1220px;margin:auto;padding:116px clamp(20px,4vw,56px);scroll-margin-top:75px}.gv-landing__label{margin-bottom:25px}.gv-landing__label span{color:#99aac3}.gv-landing__label i{width:34px;height:1px;background:var(--gold)}.gv-landing__signal{border-bottom:1px solid rgba(215,184,80,.18)}.gv-landing__signal-layout{display:grid;grid-template-columns:1.15fr .85fr;gap:90px;align-items:end}.gv-landing h2{margin:0;color:#f3f7ff;font-size:clamp(2.5rem,5vw,5.4rem);font-weight:800;line-height:.95;letter-spacing:-.065em}.gv-landing__signal-layout p,.gv-landing__section-head p{color:var(--muted);font-size:16px;line-height:1.7}.gv-landing__signal-layout p{margin:0 0 27px}.gv-landing__stats{display:flex;gap:24px;padding-top:20px;border-top:1px solid rgba(191,173,104,.25)}.gv-landing__stats span{display:grid;gap:4px;color:#899bb6;font-size:9px;letter-spacing:.1em;text-transform:uppercase}.gv-landing__stats b{color:var(--gold);font-size:20px}.gv-landing__section-head{display:flex;align-items:end;justify-content:space-between;gap:30px;margin-bottom:31px}.gv-landing__section-head>a,.gv-landing__menu-footer a,.gv-landing__service-copy>a{display:inline-flex;align-items:center;gap:8px;color:var(--gold);font-size:11px;font-weight:800;letter-spacing:.12em;text-decoration:none;text-transform:uppercase;white-space:nowrap}.gv-landing__tabs{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;max-width:680px;margin-bottom:25px;padding:7px;background:rgba(10,27,54,.78);border:1px solid rgba(157,176,207,.16);border-radius:15px}.gv-landing__tabs button{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;color:#a9bad1;font:inherit;background:transparent;border:1px solid transparent;border-radius:10px;cursor:pointer}.gv-landing__tabs button.is-active{color:#111;background:linear-gradient(135deg,#f9dc7a,#c99629);box-shadow:0 8px 20px rgba(200,150,40,.18)}.gv-landing__tabs span{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:800;letter-spacing:.1em;text-transform:uppercase}.gv-landing__tabs small{font-size:10px;opacity:.72}.gv-landing__category-line{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px}.gv-landing__category-line span{padding:7px 10px;color:#aebdd1;font-size:9px;letter-spacing:.14em;text-transform:uppercase;background:rgba(16,47,92,.44);border:1px solid rgba(174,150,61,.26);border-radius:999px}.gv-landing__menu-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}.gv-landing__menu-card{overflow:hidden;background:linear-gradient(145deg,rgba(16,42,80,.9),rgba(4,15,33,.95));border:1px solid rgba(178,151,59,.28);border-radius:15px;animation:gv-card-in .6s ease var(--delay) both}.gv-landing__menu-card:hover{transform:translateY(-4px);border-color:rgba(245,212,107,.8);box-shadow:0 20px 34px rgba(0,0,0,.25)}.gv-landing__menu-image{position:relative;height:180px;overflow:hidden;background:#0d264a}.gv-landing__menu-image img{object-fit:cover;transition:transform .5s ease}.gv-landing__menu-card:hover img{transform:scale(1.07)}.gv-landing__menu-image>div{display:grid;width:100%;height:100%;color:rgba(238,201,93,.4);place-items:center;background:linear-gradient(135deg,#153b71,#07152e)}.gv-landing__menu-image small{position:absolute;top:10px;left:10px;padding:5px 7px;color:#f9e9ae;font-size:9px;letter-spacing:.14em;background:rgba(2,9,23,.72);border:1px solid rgba(239,199,75,.42);border-radius:5px}.gv-landing__menu-copy{min-height:112px;padding:15px}.gv-landing__menu-copy small{color:var(--gold);font-size:9px;font-weight:800;letter-spacing:.13em;text-transform:uppercase}.gv-landing__menu-copy h3{margin:8px 0 0;color:#f7f9fd;font-size:16px}.gv-landing__menu-copy p{display:-webkit-box;overflow:hidden;margin:7px 0 0;color:#9fb1c9;font-size:12px;line-height:1.45;-webkit-box-orient:vertical;-webkit-line-clamp:2}.gv-landing__menu-footer{display:flex;align-items:center;justify-content:space-between;gap:20px;margin-top:24px;color:#8295b0;font-size:11px}.gv-landing__empty{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:230px;gap:14px;color:#9eafc8;text-align:center;background:rgba(9,26,52,.65);border:1px solid rgba(218,184,75,.2);border-radius:16px}.gv-landing__empty svg{width:28px;height:28px;color:var(--gold);animation:gv-spin 1.2s linear infinite}.gv-landing__empty a{display:inline-flex;align-items:center;gap:8px;color:var(--gold);font-size:11px;font-weight:800;letter-spacing:.12em;text-decoration:none;text-transform:uppercase}.gv-landing__services{max-width:none;padding-right:clamp(20px,8vw,140px);padding-left:clamp(20px,8vw,140px);background:linear-gradient(180deg,transparent,rgba(11,30,59,.56),transparent);border-top:1px solid rgba(215,184,80,.16);border-bottom:1px solid rgba(215,184,80,.16)}.gv-landing__services>.gv-landing__section-head>svg{width:34px;height:34px;color:var(--gold)}.gv-landing__service-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:18px}.gv-landing__service-card{position:relative;min-height:410px;overflow:hidden;background:#081a35;border:1px solid rgba(214,180,68,.3);border-radius:18px}.gv-landing__service-card>img{object-fit:cover;filter:saturate(.72) contrast(1.1);transition:transform .7s ease}.gv-landing__service-card:hover>img{transform:scale(1.06)}.gv-landing__service-shade{position:absolute;inset:0;background:linear-gradient(90deg,rgba(3,12,27,.98),rgba(3,12,27,.82) 48%,rgba(3,12,27,.22)),linear-gradient(0deg,rgba(3,12,27,.9),transparent 55%)}.gv-landing__service-copy{position:relative;z-index:1;max-width:430px;padding:34px}.gv-landing__service-icon{display:grid;width:45px;height:45px;margin-bottom:28px;color:#111;background:var(--gold);border-radius:12px;place-items:center}.gv-landing__service-copy>small{color:var(--gold);font-size:10px;font-weight:800;letter-spacing:.16em}.gv-landing__service-copy h3{margin:13px 0 0;color:#f5d875;font-size:clamp(2.1rem,4vw,3.7rem);font-weight:800;letter-spacing:-.06em}.gv-landing__service-copy>p{margin:15px 0 20px;color:#c6d3e6;font-size:14px;line-height:1.62}.gv-landing__service-copy ul{display:grid;gap:8px;margin:0 0 24px;padding:0;color:#aebed3;font-size:11px;list-style:none}.gv-landing__service-copy li{display:flex;align-items:center;gap:8px}.gv-landing__service-copy li i{width:5px;height:5px;background:var(--gold);border-radius:50%}.gv-landing__final{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;gap:20px;padding:130px 20px;text-align:center}.gv-landing__final>div{width:min(260px,60vw);height:1px;background:linear-gradient(90deg,transparent,var(--gold),transparent)}.gv-landing__final p{margin:0;color:#e9edf5;font-size:clamp(1.5rem,3vw,2.7rem);font-weight:700;letter-spacing:-.04em}.gv-landing__footer{position:relative;z-index:1;display:flex;justify-content:space-between;gap:20px;padding:22px clamp(20px,4vw,56px);color:#778ba9;font-size:9px;letter-spacing:.16em;text-transform:uppercase;border-top:1px solid rgba(210,177,72,.2)}@keyframes gv-card-in{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}@keyframes gv-spin{to{transform:rotate(360deg)}}@media(max-width:900px){.gv-landing__nav nav{display:none}.gv-landing__hero{min-height:760px}.gv-landing__signal-layout{grid-template-columns:1fr;gap:34px}.gv-landing__menu-grid{grid-template-columns:repeat(3,1fr)}.gv-landing__services{padding-right:20px;padding-left:20px}}@media(max-width:650px){.gv-landing__nav-cta{padding:9px 11px;font-size:9px}.gv-landing__hero{min-height:740px;align-items:flex-start;padding:125px 20px 135px}.gv-landing__hero-art{background-position:62% center}.gv-landing__lockup{margin-top:25px}.gv-landing__hero-meta{right:20px;bottom:32px;align-items:flex-end;font-size:8px}.gv-landing__actions{align-items:flex-start;flex-direction:column;gap:18px}.gv-landing__section{padding-top:82px;padding-bottom:82px}.gv-landing__section-head{align-items:flex-start;flex-direction:column;gap:18px}.gv-landing__tabs button{align-items:flex-start;flex-direction:column;gap:5px;padding:13px 12px}.gv-landing__tabs small{font-size:8px}.gv-landing__menu-grid{grid-template-columns:repeat(2,1fr);gap:10px}.gv-landing__menu-image{height:142px}.gv-landing__menu-copy{min-height:108px;padding:12px}.gv-landing__menu-copy h3{font-size:14px}.gv-landing__menu-footer{align-items:flex-start;flex-direction:column}.gv-landing__service-grid{grid-template-columns:1fr}.gv-landing__service-card{min-height:430px}.gv-landing__service-copy{padding:24px}.gv-landing__footer{align-items:flex-start;flex-direction:column}}@media(prefers-reduced-motion:reduce){.gv-landing *{animation-duration:.01ms!important;animation-iteration-count:1!important;scroll-behavior:auto!important;transition-duration:.01ms!important}}
      `}</style>
    </main>
  )
}

