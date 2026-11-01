import { useRef } from 'react'
import * as homeStyle from './home.styled'
import Hero from './components/hero/hero'
import Topics from './components/topics/topics'
import Personalize from './components/personalize/personalize'
import Benefit from './components/benefits/benefits'
import Experience from './components/experience/experience'
import Cta from './components/cta/cta'
import Footer from '../../components/footer/footer'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText)

// Motion follows DESIGN.md: content settles in with a slow-out ease, one continuous
// effect per viewport (the conic CTA border), everything gated on reduced motion.
const EASE = 'power3.out'

const Home = () => {

  const scope = useRef<HTMLDivElement>(null)

  useGSAP(()=>{
    const mm = gsap.matchMedia()

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const split = SplitText.create('[data-hero-title]', { type : 'words', mask : 'words' })
      // background-clip text doesn't reach into the masked word wrappers, so carry the gradient onto each word
      split.words.forEach((word) => {
        if(word.parentElement?.closest('.text-gradient-primary')) word.classList.add('text-gradient-primary')
      })

      gsap.timeline({ defaults : { ease : EASE } })
        .from(split.words, { yPercent : 110, duration : 0.9, stagger : 0.05 })
        .from('[data-hero-fade]', { y : 16, autoAlpha : 0, duration : 0.6, stagger : 0.08 }, '-=0.6')
        .from('[data-hero-visual]', { y : 40, autoAlpha : 0, scale : 0.98, duration : 1 }, '-=0.8')
        .from('[data-float]', { y : 24, autoAlpha : 0, duration : 0.6 }, '-=0.4')

      gsap.to('[data-hero-visual]', {
        y : -40,
        ease : 'none',
        scrollTrigger : { trigger : '[data-hero-visual]', start : 'top 60%', end : 'bottom top', scrub : true },
      })

      gsap.to('[data-marquee]', { xPercent : -50, duration : 40, ease : 'none', repeat : -1 })

      gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
        gsap.from(el, {
          y : 32, autoAlpha : 0, duration : 0.8, ease : EASE,
          scrollTrigger : { trigger : el, start : 'top 85%', once : true },
        })
      })

      gsap.utils.toArray<HTMLElement>('[data-stagger]').forEach((el) => {
        gsap.from(el.children, {
          y : 28, autoAlpha : 0, duration : 0.7, ease : EASE, stagger : 0.08,
          scrollTrigger : { trigger : el, start : 'top 85%', once : true },
        })
      })

      gsap.from('[data-thread]', {
        x : 24, autoAlpha : 0, duration : 0.6, ease : EASE, stagger : 0.15,
        scrollTrigger : { trigger : '[data-thread]', start : 'top 85%', once : true },
      })

      return () => split.revert()
    })
  }, { scope })

  return (
    <homeStyle.Main ref={scope}>
      <Hero />
      <Topics />
      <Personalize />
      <Experience />
      <Benefit />
      <Cta />
      <Footer />
    </homeStyle.Main>
  )
}

export default Home
