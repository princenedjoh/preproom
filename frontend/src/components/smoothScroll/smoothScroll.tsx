import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

let lenis : Lenis | null = null

export const getLenis = () => lenis

// Lenis driven from GSAP's ticker so ScrollTrigger stays in sync with the smoothed scroll
const SmoothScroll = () => {

    const location = useLocation().pathname

    useEffect(()=>{
        if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

        lenis = new Lenis({
            autoRaf : false,
            anchors : { offset : -72 },
            allowNestedScroll : true,
        })
        lenis.on('scroll', ScrollTrigger.update)

        const tick = (time : number) => lenis?.raf(time * 1000)
        gsap.ticker.add(tick)
        gsap.ticker.lagSmoothing(0)

        return () => {
            gsap.ticker.remove(tick)
            lenis?.destroy()
            lenis = null
        }
    },[])

    useEffect(()=>{
        lenis ? lenis.scrollTo(0, { immediate : true }) : window.scrollTo(0, 0)
        ScrollTrigger.refresh()
    },[location])

    return null
}

export default SmoothScroll
