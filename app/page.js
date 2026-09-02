'use client';

import { useEffect, useRef, useState } from 'react';

function handleImgError(e) {
  const card = e.currentTarget.closest('.carousel-card');
  if (card) card.classList.add('img-fallback');
}

export default function Home() {
  const [year, setYear] = useState('');
  const cursorRef = useRef(null);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  // ---- Custom round cursor (v2, new) ----
  useEffect(() => {
    const isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!isFinePointer) return;

    const cursor = cursorRef.current;
    if (!cursor) return;

    function onMove(e) {
      cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%,-50%)`;
      cursor.classList.add('is-visible');
    }
    function onOver(e) {
      if (e.target.closest('a, button, .theme-switch')) {
        cursor.classList.add('is-hovering');
      }
    }
    function onOut(e) {
      if (e.target.closest('a, button, .theme-switch')) {
        cursor.classList.remove('is-hovering');
      }
    }
    function onLeaveWindow() {
      cursor.classList.remove('is-visible');
    }

    window.addEventListener('mousemove', onMove);
    document.addEventListener('mouseover', onOver);
    document.addEventListener('mouseout', onOut);
    document.addEventListener('mouseleave', onLeaveWindow);

    return () => {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseover', onOver);
      document.removeEventListener('mouseout', onOut);
      document.removeEventListener('mouseleave', onLeaveWindow);
    };
  }, []);

  // ---- Theme toggle: always starts on night, no persistence between visits ----
  function toggleTheme() {
    const html = document.documentElement;
    const isDay = html.getAttribute('data-theme') === 'day';
    const btn = document.getElementById('theme-toggle');
    const label = document.getElementById('theme-label');
    if (isDay) {
      html.removeAttribute('data-theme');
      if (btn) btn.setAttribute('aria-checked', 'false');
      if (label) label.textContent = 'NIGHT';
    } else {
      html.setAttribute('data-theme', 'day');
      if (btn) btn.setAttribute('aria-checked', 'true');
      if (label) label.textContent = 'DAY';
    }
  }

  // ---- Hero photo alignment: match the photo's vertical center to the headline+subhead block ----
  useEffect(() => {
    const headline = document.querySelector('.headline');
    const sub = document.querySelector('.hero-sub');
    const scope = document.querySelector('.scope');
    if (!headline || !sub || !scope) return;

    function align() {
      if (getComputedStyle(scope).display === 'none') return;
      scope.style.marginTop = '0px';
      const textTop = headline.getBoundingClientRect().top;
      const textBottom = sub.getBoundingClientRect().bottom;
      const textCenter = (textTop + textBottom) / 2;
      const scopeRect = scope.getBoundingClientRect();
      const scopeCenter = (scopeRect.top + scopeRect.bottom) / 2;
      const delta = textCenter - scopeCenter;
      scope.style.marginTop = delta + 'px';
    }

    align();
    let resizeTimer;
    function onResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(align, 150);
    }
    window.addEventListener('resize', onResize);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(align);
    }
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // ---- Scrub ruler: scroll position -> fake timecode ----
  useEffect(() => {
    const rulerFill = document.getElementById('ruler-fill');
    const rulerCode = document.getElementById('ruler-code');
    if (!rulerFill || !rulerCode) return;
    const FPS = 24;

    function pad(n) {
      return String(n).padStart(2, '0');
    }
    function formatTimecode(frac) {
      const totalFrames = Math.floor(frac * 60 * FPS);
      const ff = totalFrames % FPS;
      const totalSeconds = Math.floor(totalFrames / FPS);
      const ss = totalSeconds % 60;
      const mm = Math.floor(totalSeconds / 60);
      return '00:' + pad(mm) + ':' + pad(ss) + ':' + pad(ff);
    }
    function updateRuler() {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const frac = docHeight > 0 ? Math.min(1, Math.max(0, scrollTop / docHeight)) : 0;
      rulerFill.style.width = frac * 100 + '%';
      rulerCode.textContent = formatTimecode(frac);
    }
    window.addEventListener('scroll', updateRuler, { passive: true });
    updateRuler();
    return () => window.removeEventListener('scroll', updateRuler);
  }, []);

  // ---- GSAP reveals: hero kinetic type + scroll-triggered section/clip reveals ----
  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduceMotion) {
      document.querySelectorAll('.headline .line span').forEach((s) => {
        s.style.transform = 'translateY(0%)';
      });
      document.querySelectorAll('.reveal, .clip').forEach((el) => {
        el.style.opacity = 1;
        el.style.transform = 'none';
      });
      return;
    }

    let ctx;
    (async () => {
      const { gsap } = await import('gsap');
      const { ScrollTrigger } = await import('gsap/ScrollTrigger');
      gsap.registerPlugin(ScrollTrigger);

      ctx = gsap.context(() => {
        gsap
          .timeline({ delay: 0.2 })
          .to('.headline .line span', {
            y: '0%',
            duration: 0.9,
            ease: 'power4.out',
            stagger: 0.12
          })
          .from('.hero-sub', { opacity: 0, y: 14, duration: 0.7 }, '-=0.5')
          .from('.cta-row', { opacity: 0, y: 14, duration: 0.7 }, '-=0.5')
          .from('.scope', { opacity: 0, scale: 0.92, duration: 0.9 }, '-=0.8');

        gsap.utils.toArray('.reveal').forEach((el) => {
          gsap.to(el, {
            opacity: 1,
            y: 0,
            duration: 0.9,
            ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none reverse' }
          });
        });

        gsap.utils.toArray('.clip').forEach((el, i) => {
          gsap.to(el, {
            opacity: 1,
            y: 0,
            duration: 0.8,
            delay: i * 0.06,
            ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 90%', toggleActions: 'play none none reverse' }
          });
        });
      });
    })();

    return () => {
      if (ctx) ctx.revert();
    };
  }, []);

  return (
    <>
      <div className="custom-cursor" ref={cursorRef} aria-hidden="true"></div>

      {/* SCRUB RULER */}
      <div className="ruler">
        <div className="ruler-track">
          <div className="ruler-fill" id="ruler-fill"></div>
          <div className="ruler-ticks">
            <span>00%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
          </div>
        </div>
        <div className="ruler-code" id="ruler-code">00:00:00:00</div>
      </div>

      {/* NAV */}
      <nav className="nav">
        <div className="nav-mark"><span className="dot"></span>Yusuf Afolabi</div>
        <div className="nav-links">
          <a href="#work">Work</a>
          <a href="#about">About</a>
          <a href="#history">History</a>
          <a href="#contact">Collaborate</a>
          <div className="theme-switch-wrap">
            <span id="theme-label">NIGHT</span>
            <button
              type="button"
              id="theme-toggle"
              className="theme-switch"
              role="switch"
              aria-checked="false"
              aria-label="Toggle day and night mode"
              onClick={toggleTheme}
            >
              <span className="theme-switch-knob"></span>
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <header className="hero wrap" id="hero">
        <div className="hero-grid">
          <div>
            <h1 className="headline">
              <span className="line"><span>I TURN COMPLEX</span></span>
              <span className="line"><span>PROBLEMS INTO</span></span>
              <span className="line"><span className="accent">SIMPLE DIGITAL</span></span>
              <span className="line"><span className="accent">EXPERIENCES</span></span>
            </h1>
            <p className="hero-sub">Product Designer (UI/UX) and Product Manager, specializing in interactive design and AI design. 5+ years turning business goals into user-centered, data-informed digital products.</p>
            <div className="cta-row">
              <a href="#work" className="btn btn-primary">View the work</a>
              <a href="#contact" className="btn btn-ghost">Let&apos;s collaborate</a>
            </div>
          </div>
          <div className="scope" aria-hidden="true">
            <img
              id="hero-photo"
              src="/hero-photo.png"
              alt=""
              onLoad={(e) => e.currentTarget.classList.add('loaded')}
              onError={(e) => {
                e.currentTarget.classList.add('loaded');
                e.currentTarget.style.opacity = 1;
              }}
            />
          </div>
        </div>
      </header>

      {/* WORK */}
      <section id="work" className="wrap">
        <div className="section-head reveal">
          <div>
            <div className="section-tag">SELECTED WORK</div>
            <div className="section-title">Clips from the reel</div>
          </div>
          <p style={{ color: 'var(--mist)', maxWidth: '36ch', fontSize: '0.9rem' }}>Every project below links through to the live product and the full Figma file.</p>
        </div>

        <div className="clip-list">
          <article className="clip reveal">
            <div className="clip-code">CLIP 01</div>
            <div className="clip-body">
              <h3>Rock Foundation Church Website</h3>
              <p>Solo product design and PM on a church web platform: translated stakeholder goals into a technical roadmap and cut manual content updates by 40% with a custom CMS structure, built in sync with a Next.js engineering handoff.</p>
            </div>
            <div className="clip-links">
              <a href="https://rfc-website.vercel.app/" target="_blank" rel="noopener">View live site ↗</a>
              <a href="https://www.figma.com/design/V8oUqMvIkim6FHmofF7NCY/Untitled?node-id=0-1&t=Gv5U1yIDv6NvoLTO-1" target="_blank" rel="noopener">View in Figma ↗</a>
            </div>
          </article>

          <article className="clip reveal">
            <div className="clip-code">CLIP 02</div>
            <div className="clip-body">
              <h3>Promix Accounting Software</h3>
              <p>End-to-end UI/UX for a fintech accounting product, simplifying complex financial data visualization for non-accountants and lifting user onboarding efficiency by 25%.</p>
            </div>
            <div className="clip-links">
              <a href="https://promixaccounting.com/" target="_blank" rel="noopener">View live site ↗</a>
              <a href="https://www.figma.com/design/4d7kiraiF8JfRroEhfSdP1/PROMIX-ON-PORTFOLIO?node-id=0-1&t=KECPL18BFvaRjwA2-1" target="_blank" rel="noopener">View in Figma ↗</a>
            </div>
          </article>

          <article className="clip reveal">
            <div className="clip-code">CLIP 03</div>
            <div className="clip-body">
              <h3>Mopcare Initiative: Senior Care Platform</h3>
              <p>Led product strategy and UX for a senior-care platform in Nigeria, architecting an accessibility-first design system that scaled digital outreach to 10,000+ consultations and 200+ relief distributions across 20+ community programs.</p>
            </div>
            <div className="clip-links">
              <a href="https://mopcare.netlify.app/" target="_blank" rel="noopener">View live site ↗</a>
              <a href="https://www.figma.com/design/UfaPQE9ra8ssKcg1BHoQnl/MOPCARE-PORTFOLIO-SITE?node-id=0-1&t=iQkMTNQch5XaBKgU-1" target="_blank" rel="noopener">View in Figma ↗</a>
            </div>
          </article>
        </div>

        <div className="behance-strip reveal">
          <div className="behance-strip-head">
            <span className="section-tag">MORE ON BEHANCE</span>
            <a href="https://github.com/YSAFO1733" target="_blank" rel="noopener" className="behance-github-link">GitHub ↗</a>
          </div>
          <div className="carousel" id="behance-carousel">
            <div className="carousel-track" id="behance-track">
              <a className="carousel-card kb-card" href="https://www.behance.net/gallery/156683443/RAVEN-APP-REVAMP-A-MOBILE-UIUX-CASE-STUDY" target="_blank" rel="noopener">
                <img src="https://mir-s3-cdn-cf.behance.net/projects/404/2d2116156683443.Y3JvcCwyNjEzLDIwNDMsMCwxOQ.png" alt="Raven App Revamp case study cover" loading="lazy" onError={handleImgError} />
                <span className="carousel-card-title">Raven App Revamp</span>
              </a>
              <a className="carousel-card kb-card" href="https://www.behance.net/gallery/170297609/HYGGE-EXPRESS" target="_blank" rel="noopener">
                <img src="/hygge-cover.png" alt="Hygge Express case study cover" loading="lazy" onError={handleImgError} />
                <span className="carousel-card-title">Hygge Express</span>
              </a>
              <a className="carousel-card kb-card" href="https://www.behance.net/gallery/159577891/YUSAFO-AIRLINE" target="_blank" rel="noopener">
                <img src="https://mir-s3-cdn-cf.behance.net/projects/404/93639b159577891.Y3JvcCwxNDAwLDEwOTUsMCwxMDA.png" alt="YUSAFO Airline case study cover" loading="lazy" onError={handleImgError} />
                <span className="carousel-card-title">YUSAFO Airline</span>
              </a>
              <a className="carousel-card kb-card" href="https://www.behance.net/gallery/156631215/YUSAFO-REAL-ESTATE-A-MOBILE-UIUX-CASE-STUDY" target="_blank" rel="noopener">
                <img src="/realestate-cover.jpg" alt="YUSAFO Real Estate case study cover" loading="lazy" onError={handleImgError} />
                <span className="carousel-card-title">YUSAFO Real Estate</span>
              </a>
              {/* duplicate set, aria-hidden, purely for the seamless marquee loop */}
              <a className="carousel-card kb-card" href="https://www.behance.net/gallery/156683443/RAVEN-APP-REVAMP-A-MOBILE-UIUX-CASE-STUDY" target="_blank" rel="noopener" aria-hidden="true" tabIndex={-1}>
                <img src="https://mir-s3-cdn-cf.behance.net/projects/404/2d2116156683443.Y3JvcCwyNjEzLDIwNDMsMCwxOQ.png" alt="" loading="lazy" onError={handleImgError} />
                <span className="carousel-card-title">Raven App Revamp</span>
              </a>
              <a className="carousel-card kb-card" href="https://www.behance.net/gallery/170297609/HYGGE-EXPRESS" target="_blank" rel="noopener" aria-hidden="true" tabIndex={-1}>
                <img src="/hygge-cover.png" alt="" loading="lazy" onError={handleImgError} />
                <span className="carousel-card-title">Hygge Express</span>
              </a>
              <a className="carousel-card kb-card" href="https://www.behance.net/gallery/159577891/YUSAFO-AIRLINE" target="_blank" rel="noopener" aria-hidden="true" tabIndex={-1}>
                <img src="https://mir-s3-cdn-cf.behance.net/projects/404/93639b159577891.Y3JvcCwxNDAwLDEwOTUsMCwxMDA.png" alt="" loading="lazy" onError={handleImgError} />
                <span className="carousel-card-title">YUSAFO Airline</span>
              </a>
              <a className="carousel-card kb-card" href="https://www.behance.net/gallery/156631215/YUSAFO-REAL-ESTATE-A-MOBILE-UIUX-CASE-STUDY" target="_blank" rel="noopener" aria-hidden="true" tabIndex={-1}>
                <img src="/realestate-cover.jpg" alt="" loading="lazy" onError={handleImgError} />
                <span className="carousel-card-title">YUSAFO Real Estate</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="wrap">
        <div className="section-head reveal">
          <div>
            <div className="section-tag">ABOUT</div>
            <div className="section-title">Behind the reel</div>
          </div>
        </div>
        <div className="about-grid">
          <p className="about-bio reveal">I&apos;m a Product Designer and Product Manager based in Nigeria, working across the full product lifecycle, from research and strategy through to high-fidelity UI execution. I&apos;ve led design solo on live products, working closely with engineering to ship pixel-accurate, responsive builds. My background in QA and customer experience shapes how I approach product design: data-informed, cross-functionally aligned, and built to hold up in the real world.</p>
          <div className="signal-list reveal">
            <div className="signal-item"><b>Focus</b>Product design, interactive design, AI design, product management</div>
            <div className="signal-item"><b>Tools</b>Figma, Next.js (dev collaboration), Jira, GitHub, Canva</div>
            <div className="signal-item"><b>Based</b>Nigeria</div>
          </div>
        </div>
      </section>

      {/* HISTORY */}
      <section id="history" className="wrap">
        <div className="section-head reveal">
          <div>
            <div className="section-tag">HISTORY</div>
            <div className="section-title">How I got here</div>
          </div>
        </div>
        <div className="history-track">
          <div className="history-item reveal">
            <div className="history-date">2018 – 2021</div>
            <div className="history-body">
              <h3>United Bank for Africa (UBA)</h3>
              <p>Started in customer experience, then led a CX team, then moved into quality assurance as a QA Expert and Trainer, using customer sentiment data to shape product updates for UBA&apos;s digital banking suite and automating a cloud-based QA workflow across African markets.</p>
            </div>
          </div>

          <div className="history-split reveal">
            <span>FROM 2021, TWO ROLES RAN AT THE SAME TIME</span>
          </div>

          <div className="history-item reveal">
            <div className="history-date">2021 – Present</div>
            <div className="history-body">
              <h3>Federal Medical Centre, Abeokuta</h3>
              <p>Administrative Officer supporting store and IT operations, including the institutional deployment of the Government Integrated Financial Management Information System (GIFMIS) and ongoing systems and workflow support for staff. Part of the team that championed the centre&apos;s integration into the Federal Government of Nigeria&apos;s Performance Management System (PMS), a modern evaluation framework introduced to replace the old, static Annual Performance Evaluation Report (APER) across the public and civil service.</p>
            </div>
          </div>

          <div className="history-item reveal">
            <div className="history-date">2021 – Present</div>
            <div className="history-body">
              <h3>Freelance Product Design &amp; Consulting</h3>
              <p>Independent product design and PM work, running end to end on live projects including Rock Foundation Church, Promix Accounting Software, and Mopcare Initiative.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="wrap contact">
        <div className="reveal">
          <div className="section-tag">COLLABORATE</div>
          <h2 className="contact-title" style={{ marginTop: '16px' }}>Let&apos;s build <span className="accent">something</span></h2>
          <p className="contact-sub">Open to product design and product management collaborations, from a single feature to a full product build. Reach out directly, or take a look at the CV first.</p>
          <div className="contact-actions">
            <a href="mailto:yusufafolabi74@gmail.com" className="btn btn-primary">Email me</a>
            <a href="/Yusuf-Afolabi-CV.pdf" target="_blank" rel="noopener" className="btn btn-ghost">View CV</a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="wrap">
        <div className="footer-row">
          <div style={{ marginTop: '10px' }}>© <span id="year">{year}</span> Yusuf Afolabi</div>
          <div className="footer-links">
            <a className="footer-chip" href="mailto:yusufafolabi74@gmail.com" title="Email">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="5" width="18" height="14" rx="1.5" /><path d="M3 6l9 7 9-7" /></svg>
              Email
            </a>
            <a className="footer-chip" href="/Yusuf-Afolabi-CV.pdf" target="_blank" rel="noopener" title="CV">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M6 3h9l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" /><path d="M14 3v5h5" /></svg>
              CV
            </a>
            <a className="footer-chip" href="https://www.linkedin.com/in/afolabi-yusuf-581773417/" target="_blank" rel="noopener" title="LinkedIn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M7.5 10.5v6M7.5 7.75v.01M11.5 16.5v-3.5c0-1.4 1-2.2 2.2-2.2 1.2 0 1.8.9 1.8 2.2v3.5" /></svg>
              LinkedIn
            </a>
            <a className="footer-chip" href="https://github.com/YSAFO1733" target="_blank" rel="noopener" title="GitHub">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M8 20l1-3M16 20l-1-3M6 15l-2 -2 M18 15l2-2" /><rect x="7" y="6" width="10" height="9" rx="2" /></svg>
              GitHub
            </a>
            <a className="footer-chip" href="https://www.behance.net/yusufafolabi2" target="_blank" rel="noopener" title="Behance">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="3" width="18" height="18" rx="2" /></svg>
              Behance
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}
