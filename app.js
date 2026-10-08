    document.addEventListener('DOMContentLoaded', () => {
        // Init Language
        const savedLang = localStorage.getItem('site_lang') || 'kr';
        setLanguage(savedLang);
        setupModal();

        // Init Clock
        initClock();

        // 챗봇 환영 말풍선 표시 (3.5초 뒤 시작)
        setTimeout(() => {
            showChatWelcomeBubble();
            startWelcomeMessageRotation();
        }, 3500);

        // 푸터 타자기 효과 시작
        initFooterTyping();
    });

    // --- Clock Logic (Project 18 Legacy) ---
    function initClock() {
        updateClock(true);
        const now = new Date();
        const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
        const dayStr = days[now.getDay()];
        const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}.${dayStr}`;

        const dateDisplay = document.getElementById('dateDisplay');
        if (dateDisplay) dateDisplay.innerText = dateStr;

        // Start Interval
        setInterval(() => updateClock(false), 1000);
    }

    function updateClock(isInit = false) {
        const now = new Date();
        const h = String(now.getHours()).padStart(2, '0');
        const m = String(now.getMinutes()).padStart(2, '0');
        const s = String(now.getSeconds()).padStart(2, '0');

        const hEl = document.getElementById('hh');
        const mEl = document.getElementById('mm');
        const sEl = document.getElementById('ss');

        if (!hEl || !mEl || !sEl) return;

        if (isInit) {
            hEl.innerText = h;
            mEl.innerText = m;
            sEl.innerText = s;
            return;
        }

        if (hEl.innerText !== h) flipClockAnim(hEl, h);
        if (mEl.innerText !== m) flipClockAnim(mEl, m);
        if (sEl.innerText !== s) flipClockAnim(sEl, s);
    }

    function flipClockAnim(el, val) {
        el.style.transform = 'scaleY(0)';
        el.style.transition = 'transform 0.15s ease-in';
        setTimeout(() => {
            el.innerText = val;
            el.style.transform = 'scaleY(1)';
            el.style.transition = 'transform 0.15s ease-out';
        }, 150);
    }

    // --- Navigation Logic ---
    function scrollToSection(id) {
        const element = document.getElementById(id);
        if (element) {
            const headerOffset = 80;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
            });

            // 인디케이터 즉시 업데이트
            const targetLink = document.querySelector(`.nav-links a[onclick*="'${id}'"]`);
            if (targetLink) updateNavIndicator(targetLink);

            // 섹션 이동 로그 기록 (백그라운드)
            logFootprint(id, '섹션 이동');
        }
    }

    // --- Sliding Nav Indicator Logic ---
    function updateNavIndicator(target) {
        const indicator = document.querySelector('.nav-indicator');
        if (!indicator || !target) return;

        const rect = target.getBoundingClientRect();
        const parentRect = target.parentElement.getBoundingClientRect();

        // 부모 요소 기준 상대 위치 및 너비 계산
        indicator.style.width = `${rect.width}px`;
        indicator.style.left = `${rect.left - parentRect.left}px`;
        indicator.classList.add('visible');

        // 내비게이션 링크 활성화 상태 처리
        document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
        target.classList.add('active');
    }

    // Scroll Spy: 스크롤 위치에 따라 메뉴 인디케이터 이동
    function handleScrollSpy() {
        const sections = ['hero', 'about', 'systems', 'tools'];
        let currentSection = '';

        sections.forEach(id => {
            const section = document.getElementById(id);
            if (section) {
                const rect = section.getBoundingClientRect();
                // 화면 상단에서 일정 거리(150px) 안에 들어오면 활성화
                if (rect.top <= 150) {
                    currentSection = id;
                }
            }
        });

        if (currentSection) {
            const targetLink = document.querySelector(`.nav-links a[onclick*="'${currentSection}'"]`);
            if (targetLink) updateNavIndicator(targetLink);
        }
    }

    // 초기화 및 이벤트 리스너 등록
    window.addEventListener('scroll', handleScrollSpy);
    window.addEventListener('resize', () => {
        const activeLink = document.querySelector('.nav-links a.active');
        if (activeLink) updateNavIndicator(activeLink);
    });

    // 페이지 로드 시 초기 위치 설정
    setTimeout(() => handleScrollSpy(), 500);

    // ─────────────────────────────────────────────────────────
    // 풀페이지 스냅 스크롤 v2 (개선)
    //   Hero ↔ About ↔ Systems 스냅 이동
    //   Systems 상단에서 위로 스크롤 → About 스냅
    //   Systems 하단 이하 → 일반 스크롤
    // ─────────────────────────────────────────────────────────
    (function initSnapScroll() {

        const COOLDOWN_MS = 950;   // 스냅 애니메이션 완료까지 추가 입력 차단 시간
        let cooldown = false;

        // 헤더 높이 반환
        function headerH() {
            const h = document.querySelector('.header');
            return h ? h.offsetHeight : 0;
        }

        // 섹션별 정확한 스크롤 목표 Y값 반환
        function sectionY(id) {
            const el = document.getElementById(id);
            if (!el) return 0;
            return id === 'hero' ? 0 : el.offsetTop - headerH();
        }

        // 현재 스크롤 위치 기준으로 어느 구간인지 판별
        //   'hero'    : 히어로 구간
        //   'about'   : 어바웃 구간
        //   'systems' : 솔루션 섹션 상단(화면 1개 이내) → 위로 스냅 가능 구간
        //   'deep'    : 솔루션 섹션 깊이 진입 → 일반 스크롤
        function currentZone() {
            const aboutTop = sectionY('about');
            const systemsTop = sectionY('systems');
            const sy = window.scrollY;

            if (sy < aboutTop - 10) return 'hero';
            if (sy < systemsTop - 10) return 'about';
            if (sy < systemsTop + window.innerHeight * 0.8) return 'systems';
            return 'deep';
        }

        // 부드럽게 정확한 Y 위치로 스냅 이동
        function snapTo(id) {
            if (cooldown) return;
            cooldown = true;
            const targetY = sectionY(id);
            window.scrollTo({ top: targetY, behavior: 'smooth' });
            setTimeout(() => { cooldown = false; }, COOLDOWN_MS);
        }

        // ── 마우스 휠 이벤트 ──
        function onWheel(e) {
            const zone = currentZone();

            // 깊은 솔루션 구간은 일반 스크롤
            if (zone === 'deep') return;

            // 쿨다운 중이면 입력 차단(브라우저 기본 스크롤도 막음)
            if (cooldown) {
                e.preventDefault();
                return;
            }

            const dir = e.deltaY > 0 ? 1 : -1;   // 1: 아래, -1: 위

            if (zone === 'hero') {
                e.preventDefault();
                if (dir > 0) snapTo('about');
                // 위로는 이미 맨 위 → 무동작
            } else if (zone === 'about') {
                e.preventDefault();
                if (dir > 0) snapTo('systems');
                else snapTo('hero');
            } else if (zone === 'systems') {
                // 솔루션 상단에서 위로 → About 스냅
                if (dir < 0) {
                    e.preventDefault();
                    snapTo('about');
                }
                // 아래로는 일반 스크롤 허용
            }
        }

        // ── 모바일 터치 스와이프 ──
        let touchStartY = 0;
        function onTouchStart(e) {
            touchStartY = e.touches[0].clientY;
        }
        function onTouchEnd(e) {
            if (cooldown) return;
            const diff = touchStartY - e.changedTouches[0].clientY;
            if (Math.abs(diff) < 40) return;   // 40px 미만 스와이프 무시

            const dir = diff > 0 ? 1 : -1;
            const zone = currentZone();

            if (zone === 'hero' && dir > 0) snapTo('about');
            else if (zone === 'about' && dir > 0) snapTo('systems');
            else if (zone === 'about' && dir < 0) snapTo('hero');
            else if (zone === 'systems' && dir < 0) snapTo('about');
        }

        // 이벤트 등록
        window.addEventListener('wheel', onWheel, { passive: false });
        window.addEventListener('touchstart', onTouchStart, { passive: true });
        window.addEventListener('touchend', onTouchEnd, { passive: true });

    })();

    // --- Mobile Menu Logic ---
    function toggleMobileMenu() {
        const overlay = document.getElementById('mobile-menu-overlay');
        const hamburger = document.querySelector('.hamburger');
        const isOpen = overlay.classList.contains('open');

        if (isOpen) {
            closeMobileMenu();
        } else {
            overlay.classList.add('open');
            hamburger.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent background scroll
        }
    }

    function closeMobileMenu() {
        const overlay = document.getElementById('mobile-menu-overlay');
        const hamburger = document.querySelector('.hamburger');

        overlay.classList.remove('open');
        hamburger.classList.remove('active');
        document.body.style.overflow = ''; // Restore scroll
    }

    // --- Translations ---
    // Note: Footer translations removed from here as they are now fully Sheet-driven.
    // Kept Nav/Section titles for static switching speed.
    const translations = {
        kr: {
            nav_home: "홈",
            nav_about: "운영철학",
            nav_solutions: "솔루션",
            nav_tech: "기술 스택",
            nav_contact: "문의하기",
            about_label: "PHILOSOPHY",
            about_title_sub: "코딩하는 사무국장",
            about_slogan: "\"주말의 코드로 복지의 월요일을 혁신하다\"",
            about_bio_1: "모두가 잠든 밤, 저는 사회복지 기관을 위한 알고리즘을 설계합니다.",
            about_bio_2: "손이 많이 가는 행정은 AI에게 맡기고, 우리 선생님들의 눈길은 이용자에게 머물게 하는 것.",
            about_bio_3: "그것이 제가 주말을 반납하고 코드를 짜는 유일한 이유입니다.",
            about_signature: "코딩하는 사무국장 장진현",
            sect_solutions_title: "검증된 솔루션",
            sect_solutions_desc: "실제 현장에 도입되어 데이터로 검증된 자동화 행정 시스템",
            sect_tech_title: "기술 스택",
            sect_tech_desc: "구글 클라우드 인프라 기반의 강력한 보안과 안정성",
            contact_title: "문의하기",
            form_subject: "제목",
            form_name: "작성자",
            form_contact: "연락처 (이메일/전화번호)",
            form_message: "문의 내용",
            form_submit: "보내기",
            modal_func: "주요 기능",
            modal_effect: "기대 효과",
            modal_detail: "상세 설명",
            demo_btn: "시연해보기"
        },
        en: {
            nav_home: "Home",
            nav_about: "Philosophy",
            nav_solutions: "Solutions",
            nav_tech: "Tech Stack",
            nav_contact: "Contact",
            about_label: "PHILOSOPHY",
            about_title_sub: "The Coding Secretary",
            about_slogan: "\"Innovating Welfare Mondays with Weekend Code\"",
            about_bio_1: "While everyone sleeps, I design algorithms for social welfare organizations.",
            about_bio_2: "Delegate the heavy admin to AI, so our staff can keep their eyes on the people who matter.",
            about_bio_3: "That is the only reason I give up my weekends to write code.",
            about_signature: "The Coding Secretary, Jang Jin-hyun",
            sect_solutions_title: "Verified Solutions",
            sect_solutions_desc: "Data-driven automated systems deployed in real-world scenarios.",
            sect_tech_title: "Technology Stack",
            sect_tech_desc: "Built on Google's robust cloud infrastructure for maximum reliability.",
            contact_title: "Contact Us",
            form_subject: "Subject",
            form_name: "Name",
            form_contact: "Contact Info",
            form_message: "Message",
            form_submit: "Send Message",
            modal_func: "Functions",
            modal_effect: "Expected Effects",
            modal_detail: "Description",
            demo_btn: "Try Demo"
        }
    };

    let currentLang = 'kr';

    function toggleLanguage() {
        const newLang = currentLang === 'kr' ? 'en' : 'kr';
        setLanguage(newLang);
    }

    function setLanguage(lang) {
        currentLang = lang;
        localStorage.setItem('site_lang', lang);

        // Toggle UI (Desktop)
        document.getElementById('lang-kr').classList.toggle('active', lang === 'kr');
        document.getElementById('lang-en').classList.toggle('active', lang === 'en');

        // Toggle UI (Mobile)
        document.getElementById('lang-kr-mobile').classList.toggle('active', lang === 'kr');
        document.getElementById('lang-en-mobile').classList.toggle('active', lang === 'en');

        // Static Translations
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (translations[lang] && translations[lang][key]) {
                el.innerText = translations[lang][key];
            }
        });

        // Logo Switching - JINHYUN.AI 브랜딩 유지
        // (언어 전환 시에도 JINHYUN.AI 로고는 고정)
        // 필요 시 아래 주석 해제하여 국문/영문 전환 가능
        // const logoContainer = document.querySelector('.logo');
        // logoContainer.innerHTML = lang === 'kr'
        //     ? `JINHYUN<span class="logo-highlight">.AI</span>`
        //     : `JINHYUN<span class="logo-highlight">.AI</span>`;

        // Reload Data
        loadBanner(lang);
        loadSystems(lang);
        loadTools(lang);
        loadFooter(lang);
        loadAboutData();
        loadPromoVideo();
    }

    function loadAboutData() {
        google.script.run
            .withSuccessHandler(data => {
                if (!data) return;

                // 슬로건
                document.getElementById('about-slogan').innerText = data.slogan;

                // 미션 & 철학 (줄바꿈 처리)
                const bioContainer = document.getElementById('about-bio');
                if (data.philosophy) {
                    const paragraphs = data.philosophy.split('\n').filter(p => p.trim() !== '');
                    bioContainer.innerHTML = paragraphs.map(p => `<p>${p}</p>`).join('');
                }

                // 퍼스널 브랜딩 (서명)
                document.getElementById('about-signature').innerText = data.branding;
            })
            .getAboutData(currentLang);
    }

    // --- Carousel Logic (Mantine Style) ---
    let currentSlide = 0;
    let slidesData = [];
    let slideInterval;

    function loadBanner(lang) {
        const carousel = document.getElementById('hero-carousel');
        const dotsContainer = document.getElementById('carousel-dots');

        const spinnerHtml = `
            <div class="loader-skeleton">
                <div class="ios-spinner">
                    <div></div><div></div><div></div><div></div><div></div><div></div>
                    <div></div><div></div><div></div><div></div><div></div><div></div>
                </div>
            </div>`;
        carousel.innerHTML = spinnerHtml;

        google.script.run
            .withSuccessHandler(data => {
                slidesData = data;
                if (!slidesData || slidesData.length === 0) {
                    carousel.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--mantine-color-dark-1);">No slides available.</div>';
                    return;
                }

                carousel.innerHTML = '';
                dotsContainer.innerHTML = '';

                slidesData.forEach((slide, index) => {
                    const slideEl = document.createElement('div');
                    slideEl.className = `carousel-slide ${index === 0 ? 'active' : ''}`;

                    const bgUrl = slide.image || 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1600&q=80';

                    slideEl.innerHTML = `
                        <div class="slide-bg-container">
                             <img src="${bgUrl}" class="slide-bg" alt="Slide Background">
                             <div class="slide-overlay"></div>
                        </div>
                        <div class="slide-content animate-enter">
                            ${slide.subtitle ? `<div class="mantine-Badge" style="background:var(--mantine-color-blue-9); color:white; margin-bottom:1rem;">${slide.subtitle}</div>` : ''}
                            <h1 class="slide-title">${slide.title}</h1>
                            ${slide.linkText ? `
                                <a href="${slide.linkUrl || '#'}" class="btn btn-primary" style="margin-top: 1rem;"
                                   onclick="${slide.linkUrl.startsWith('#') ?
                                `event.preventDefault(); document.querySelector('${slide.linkUrl}').scrollIntoView({behavior: 'smooth'})` : ''}">
                                   ${slide.linkText}
                                </a>` : ''}
                        </div>
                    `;
                    carousel.appendChild(slideEl);

                    const dot = document.createElement('div');
                    dot.className = `dot ${index === 0 ? 'active' : ''}`;
                    dot.onclick = () => goToSlide(index);
                    dotsContainer.appendChild(dot);
                });

                startAutoSlide();
            })
            .withFailureHandler(err => {
                carousel.innerHTML = `<div style="color:red;padding:20px;">Failed to load banner: ${err.message}</div>`;
            })
            .getBannerData(lang);
    }

    function moveSlide(n) {
        let next = currentSlide + n;
        if (next >= slidesData.length) next = 0;
        if (next < 0) next = slidesData.length - 1;
        goToSlide(next);
    }

    function goToSlide(n) {
        resetAutoSlide();
        const slides = document.querySelectorAll('.carousel-slide');
        const dots = document.querySelectorAll('.dot');

        if (slides[currentSlide]) slides[currentSlide].classList.remove('active');
        if (dots[currentSlide]) dots[currentSlide].classList.remove('active');

        currentSlide = n;

        if (slides[currentSlide]) slides[currentSlide].classList.add('active');
        if (dots[currentSlide]) dots[currentSlide].classList.add('active');
    }

    function startAutoSlide() {
        if (slideInterval) clearInterval(slideInterval);
        slideInterval = setInterval(() => {
            moveSlide(1);
        }, 6000);
    }

    function resetAutoSlide() {
        startAutoSlide();
    }


    // --- System Cards Logic (Mantine Cards) ---
    let systemsData = [];
    const sysTranslations = {
        all: { kr: "전체보기", en: "All" }
    };

    function loadSystems(lang) {
        const container = document.getElementById('systems-container');
        const tabsContainer = document.getElementById('systems-tabs');

        google.script.run
            .withSuccessHandler(data => {
                systemsData = data || [];
                if (systemsData.length === 0) {
                    container.innerHTML = '<p>No systems found.</p>';
                    return;
                }

                // Extract unique categories
                const categories = [...new Set(systemsData.map(item => item.category || 'Other'))];

                // Render Tabs
                tabsContainer.innerHTML = '';

                // Add "All" tab
                const allTab = document.createElement('div');
                allTab.className = 'tab-item active';
                allTab.innerText = sysTranslations.all[lang] || sysTranslations.all.kr;
                allTab.onclick = (e) => switchTab(e, 'All');
                tabsContainer.appendChild(allTab);

                categories.forEach(cat => {
                    const tab = document.createElement('div');
                    tab.className = 'tab-item';
                    tab.innerText = cat;
                    tab.onclick = (e) => switchTab(e, cat);
                    tabsContainer.appendChild(tab);
                });

                // Initial Render (All)
                renderSystems('All');
            })
            .withFailureHandler(err => {
                container.innerHTML = `<p style="color:red">Failed to load systems: ${err.message}</p>`;
            })
            .getSystemData(lang);
    }

    function switchTab(e, category) {
        // Remove active class from all tabs
        const tabs = document.querySelectorAll('.tab-item');
        tabs.forEach(t => t.classList.remove('active'));

        // Add to current
        if (e && e.currentTarget) {
            e.currentTarget.classList.add('active');
        }

        // Render
        renderSystems(category);
    }

    function renderSystems(filterCategory) {
        const container = document.getElementById('systems-container');
        container.innerHTML = '<div class="grid animate-enter"></div>';
        const grid = container.querySelector('.grid');

        const filtered = filterCategory === 'All'
            ? systemsData
            : systemsData.filter(s => s.category === filterCategory);

        filtered.forEach((sys, idx) => {
            const card = document.createElement('div');
            card.className = 'mantine-Card';
            card.style.animationDelay = `${idx * 0.05}s`;
            card.onclick = () => openModal(sys);

            const imageUrl = sys.image && sys.image.startsWith('http')
                ? sys.image
                : 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80';

            const truncate = (text, len) => {
                if (!text) return "";
                return text.length > len ? text.substring(0, len) + '...' : text;
            };

            // 시연 영상 배지 로직 (demoUrl 유무에 따라)
            const demoBadge = (sys.demoUrl && sys.demoUrl.trim().startsWith('http'))
                ? `<div class="card-demo-badge">🎬 시연영상 업로드</div>`
                : '';

            card.innerHTML = `
                <div class="card-image">
                    <img src="${imageUrl}" alt="${sys.name}">
                    ${demoBadge}
                </div>
                <div class="card-content">
                    <div class="card-header">
                        <div class="mantine-Badge" style="background:var(--mantine-color-dark-5); color:var(--mantine-color-dark-1);">${sys.goal ? truncate(sys.goal, 15) : 'SYSTEM'}</div>
                    </div>
                    <h3 class="card-title">${sys.name}</h3>
                    <p style="font-size:0.9rem; color:var(--mantine-color-dark-2); margin-top:8px; line-height:1.5;">${sys.functions ? truncate(sys.functions, 60) : ''}</p>
                    
                    <div class="card-meta">
                        <span class="card-link">View Details &rarr;</span>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    function loadTools(lang) {
        const container = document.getElementById('tech-grid');

        google.script.run
            .withSuccessHandler(groups => {
                container.innerHTML = '';
                groups.forEach((group, idx) => {
                    const div = document.createElement('div');
                    div.className = 'tech-group animate-enter';
                    div.style.animationDelay = `${idx * 0.1 + 0.3}s`;

                    const tags = group.items.map(item => `<span class="tech-badge">${item}</span>`).join('');
                    div.innerHTML = `
                      <h3>${group.category}</h3>
                      <div class="tech-list">${tags}</div>
                    `;
                    container.appendChild(div);
                });
            })
            .withFailureHandler(err => {
                container.innerHTML = `<p style="color:red">Failed to load tech stack: ${err.message}</p>`;
            })
            .getTools(lang);
    }


    // --- Footer Logic ---
    function loadFooter(lang) {
        google.script.run
            .withSuccessHandler(data => {
                // 설명 문구 업데이트 (시트 데이터가 있으면 덮어쓰고, 없으면 기본 HTML 문구 유지)
                if (data && data.description) {
                    const descEl = document.getElementById('footer-desc');
                    if (descEl) descEl.innerText = data.description;
                }

                // 국장님 성함 업데이트
                if (data && data.director) {
                    const directorEl = document.getElementById('footer-director');
                    if (directorEl) directorEl.innerText = data.director;
                }

                // 이메일 업데이트
                if (data && data.email) {
                    const emailEl = document.getElementById('footer-email');
                    if (emailEl) emailEl.innerText = data.email;
                }

                // 저작권 정보 업데이트
                if (data && data.copyright) {
                    const copyrightEl = document.getElementById('footer-copyright');
                    if (copyrightEl) copyrightEl.innerHTML = data.copyright;
                }
            })
            .withFailureHandler(err => {
                console.error("Footer load failed", err);
            })
            .getFooterData(lang);
    }

    // --- Modal Logic ---

    // Generic Close helper
    // Generic Close helper
    function closeModal(id) {
        document.getElementById(id).classList.remove('open');
    }

    // Contact Modal
    function openContactModal(e) {
        if (e) e.preventDefault();
        document.getElementById('contact-modal').classList.add('open');
    }

    function submitContact(e) {
        e.preventDefault();
        const btn = e.target.querySelector('button');
        const status = document.getElementById('contact-status');

        const originalText = btn.innerText;
        btn.disabled = true;
        btn.innerText = "Sending...";
        status.innerText = "";
        status.style.color = "var(--mantine-color-dark-1)";

        const formData = {
            title: document.getElementById('contact-title').value,
            name: document.getElementById('contact-name').value,
            contact: document.getElementById('contact-contact').value,
            content: document.getElementById('contact-content').value
        };

        const consent = document.getElementById('contact-consent-hidden').value;
        if (consent !== 'true') {
            status.innerText = "개인정보 수집 및 이용에 동의해 주세요.";
            status.style.color = "#fa5252";
            btn.disabled = false;
            btn.innerText = originalText;
            return;
        }

        google.script.run
            .withSuccessHandler(res => {
                btn.disabled = false;
                btn.innerText = originalText;
                if (res.success) {
                    status.innerText = res.message;
                    status.style.color = "var(--mantine-color-teal-6)";
                    document.getElementById('contact-form').reset();
                    // 동의 상태 초기화
                    document.getElementById('contact-consent-hidden').value = 'false';
                    document.getElementById('contact-consent-area').style.display = 'block';
                    document.getElementById('contact-submit-btn').style.display = 'none';
                    setTimeout(() => closeModal('contact-modal'), 2000);
                } else {
                    status.innerText = "Error: " + res.message;
                    status.style.color = "#fa5252";
                }
            })
            .withFailureHandler(err => {
                btn.disabled = false;
                btn.innerText = originalText;
                status.innerText = "Connection Error: " + err.message;
                status.style.color = "#fa5252";
            })
            .sendInquiryEmail(formData, []); // 게시판은 대화 이력이 없으므로 빈 배열
    }

    // 개인정보동의 버튼 이벤트 바인딩 (DOM 로드 후)
    document.addEventListener('DOMContentLoaded', () => {
        setupChatScrollIsolation();
        const cy = document.getElementById('consent-yes');
        const cn = document.getElementById('consent-no');
        if (cy) cy.onclick = () => {
            document.getElementById('contact-consent-hidden').value = 'true';
            document.getElementById('contact-consent-area').style.display = 'none';
            document.getElementById('contact-submit-btn').style.display = 'block';
        };
        if (cn) cn.onclick = () => {
            alert("개인정보 수집에 동의하셔야 문의 접수가 가능합니다.");
        };
    });

    // System Modal
    function setupModal() {
        const modal = document.getElementById('modal-overlay');
        // Click outside to close
        modal.onclick = (e) => { if (e.target === modal) modal.classList.remove('open'); };
        document.getElementById('contact-modal').onclick = (e) => { if (e.target === document.getElementById('contact-modal')) closeModal('contact-modal'); };
    }

    function openModal(data) {
        document.getElementById('modal-title').textContent = data.name;
        document.getElementById('modal-goal').textContent = data.goal || '-';
        document.getElementById('modal-functions').textContent = data.functions || '-';
        document.getElementById('modal-effects').textContent = data.effects || '-';
        document.getElementById('modal-detail').textContent = data.detail || '-';

        const img = document.getElementById('modal-image');
        img.src = data.image && data.image.startsWith('http')
            ? data.image
            : 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80';

        document.getElementById('modal-overlay').classList.add('open');

        // 상세보기 클릭 로그 기록 (백그라운드)
        logFootprint('Systems', '카드 상세보기', data.name);

        // Demo Button Logic (Dynamic Text)
        const demoContainer = document.getElementById('modal-demo-container');
        const demoBtn = document.getElementById('modal-demo-btn');
        const demoBtnText = demoBtn.querySelector('[data-i18n="demo_btn"]') || demoBtn;

        demoContainer.style.display = 'block'; // 버튼 컨테이너는 항상 표시

        if (data.demoUrl && data.demoUrl.trim().startsWith('http')) {
            // 링크가 있는 경우
            demoBtnText.innerText = currentLang === 'kr' ? "시연영상 보기" : "View Demo";
            demoBtn.style.opacity = "1";
            demoBtn.style.cursor = "pointer";
            demoBtn.onclick = () => {
                // 시연 영상 클릭 로그 기록
                logFootprint('Demo', '영상 시연 클릭', data.name);
                window.open(data.demoUrl, '_blank');
            };
        } else {
            // 링크가 없는 경우
            demoBtnText.innerText = currentLang === 'kr' ? "시연영상 준비중..." : "Demo Coming Soon...";
            demoBtn.style.opacity = "0.6";
            demoBtn.style.cursor = "default";
            demoBtn.onclick = (e) => {
                e.preventDefault();
                alert(currentLang === 'kr' ? "현재 시연 영상을 준비하고 있습니다. 조금만 기다려 주세요!" : "We are preparing the demo video. Please check back soon!");
            };
        }
    }

    function loadPromoVideo() {
        google.script.run
            .withSuccessHandler(url => {
                if (!url) return;
                const container = document.getElementById('promo-video-container');

                // YouTube ID extraction
                const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
                const match = url.match(regExp);
                const videoId = (match && match[7].length == 11) ? match[7] : false;

                if (videoId) {
                    container.innerHTML = `<iframe 
                        src="https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&rel=0&modestbranding=1" 
                        allow="autoplay; encrypted-media" 
                        allowfullscreen></iframe>`;
                }
            })
            .getPromoVideoUrl();
    }

    // --- AI Assistant Chat Logic ---
    let chatHistory = [];
    let isChatOpen = false;
    let isGreetingLoaded = false;
    let isChatScrollBound = false;

    function setupChatScrollIsolation() {
        if (isChatScrollBound) return;
        const chatWindow = document.getElementById('chat-window');
        const chatMessages = document.getElementById('chat-messages');
        if (!chatWindow || !chatMessages) return;

        chatWindow.addEventListener('wheel', function (e) {
            chatMessages.scrollTop += e.deltaY;
            e.preventDefault();
            e.stopPropagation();
        }, { passive: false });

        isChatScrollBound = true;
    }

    function addContactActionBtnToUI() {
        const container = document.getElementById('chat-messages');
        if (!container) return;
        const btnDiv = document.createElement('div');
        btnDiv.className = 'message bot';
        btnDiv.style.background = 'transparent';
        btnDiv.style.padding = '4px 0';
        btnDiv.innerHTML = `
            <button class="chat-action-btn" onclick="openContactModal(event)">
                <span>📨 강의의뢰 / 문의하기 양식 열기</span>
            </button>
        `;
        container.appendChild(btnDiv);
        container.scrollTop = container.scrollHeight;
    }

    function toggleChat() {
        const chatWindow = document.getElementById('chat-window');
        isChatOpen = !isChatOpen;
        if (isChatOpen) {
            chatWindow.classList.add('open');
            document.getElementById('chat-input').focus();
            setupChatScrollIsolation();

            // 채팅창 열릴 때 말풍선 숨김
            hideChatWelcomeBubble();

            // 첫 오픈 시 동적 인사말 로드
            if (!isGreetingLoaded) {
                loadInitialGreeting();
            }
        } else {
            chatWindow.classList.remove('open');
        }
    }

    // 챗봇 환영 말풍선 제어 (신규)
    const welcomeMessages = [
        "반갑습니다! 장진현 국장님 AI 비서입니다. 무엇을 도와드릴까요? ✨",
        "사회복지 행정 자동화, 실제 현장에서는 어떻게 쓰이는지 궁금하신가요? 🤖",
        "현장의 수고를 덜어내는 AI 기술, 그 비전을 비서가 상세히 안내해 드립니다. 🏢",
        "국장님의 20가지가 넘는 혁신 솔루션들! 제가 하나씩 설명해 드릴 수 있습니다. 🛠️",
        "어려운 복지 업무, AI와 함께라면 더 즐거워집니다. 대화를 시작해 보세요! 🙌"
    ];
    let welcomeMsgIndex = 0;
    let welcomeRotationInterval;

    function showChatWelcomeBubble() {
        if (isChatOpen) return;
        const bubble = document.getElementById('chat-welcome-bubble');
        if (bubble) {
            bubble.style.display = 'block';
            updateWelcomeText();
        }
    }

    function hideChatWelcomeBubble() {
        const bubble = document.getElementById('chat-welcome-bubble');
        if (bubble) {
            bubble.style.display = 'none';
            if (welcomeRotationInterval) clearInterval(welcomeRotationInterval);
        }
    }

    function updateWelcomeText() {
        const textEl = document.querySelector('#chat-welcome-bubble .bubble-text');
        if (textEl) {
            // 부드러운 전환 효과 준비
            textEl.style.opacity = '0';
            setTimeout(() => {
                textEl.innerText = welcomeMessages[welcomeMsgIndex];
                textEl.style.opacity = '1';
                welcomeMsgIndex = (welcomeMsgIndex + 1) % welcomeMessages.length;
            }, 300);
        }
    }

    function startWelcomeMessageRotation() {
        if (welcomeRotationInterval) clearInterval(welcomeRotationInterval);
        welcomeRotationInterval = setInterval(() => {
            if (!isChatOpen) {
                updateWelcomeText();
            }
        }, 20000); // 20초 주기
    }

    function loadInitialGreeting() {
        // 기존 환영 메시지 삭제
        const container = document.getElementById('chat-messages');
        container.innerHTML = '';

        const loadingId = addLoadingMessage();

        google.script.run
            .withSuccessHandler(greeting => {
                removeLoadingMessage(loadingId);
                addMessageToUI('bot', greeting);
                isGreetingLoaded = true;
            })
            .generateInitialGreeting();
    }

    function handleChatKey(e) {
        if (e.key === 'Enter') {
            sendChatMessage();
        }
    }

    function sendChatMessage() {
        const input = document.getElementById('chat-input');
        const message = input.value.trim();
        if (!message) return;

        // User message
        addMessageToUI('user', message);
        input.value = '';

        // Add loading state
        const loadingId = addLoadingMessage();

        // ✅ [수정4] chatHistory에서 text가 비어있는 항목을 미리 정제한 뒤 전송
        // user↔model 쌍이 맞지 않거나 빈 text가 있으면 Gemini API가 거부하므로 사전 필터링
        const safeHistory = chatHistory
            .filter(item => item && item.parts && item.parts[0] &&
                typeof item.parts[0].text === 'string' &&
                item.parts[0].text.trim() !== '')
            .slice(-6); // 최근 6개 교환만 유지

        google.script.run
            .withSuccessHandler(response => {
                removeLoadingMessage(loadingId);
                if (response.success && response.text && response.text.trim() !== '') {
                    // 액션 태그 추출 및 정제
                    const cleanText = response.text.replace(/\[ACTION:.*\]/g, '').trim();
                    addMessageToUI('bot', cleanText);

                    // ✅ 성공 시에만 대화 기록에 추가
                    chatHistory.push({ role: "user", parts: [{ text: message }] });
                    chatHistory.push({ role: "model", parts: [{ text: cleanText }] });

                    // 강의의뢰 및 공식 문의 연동 ([ACTION:OPEN_CONTACT] 또는 질문 키워드 감지 시 버튼 생성)
                    const isContactIntent = response.text.includes('[ACTION:OPEN_CONTACT]') ||
                                            /강의|특강|강연|교육 의뢰|세미나/i.test(message);
                    if (isContactIntent) {
                        addContactActionBtnToUI();
                    }

                    // 메일 발송 액션 감지
                    if (response.text.includes('[ACTION:SEND_EMAIL')) {
                        handleEmailAction(response.text);
                    }

                    if (response.botInfo) {
                        const infoText = response.botInfo.keyIndex 
                            ? `API.${response.botInfo.keyIndex}` 
                            : (response.botInfo.model || 'Gemini');
                        document.getElementById('chat-bot-info').innerText = `JINHYUN.AI 비서 (${infoText})`;
                    }
                } else {
                    const errMsg = response.message || "서버 응답 오류가 발생했습니다.";
                    addMessageToUI('bot', errMsg);
                    console.error("Chatbot Error:", response);
                }
            })
            .withFailureHandler(err => {
                removeLoadingMessage(loadingId);
                addMessageToUI('bot', "네트워크 통신 오류가 발생했습니다: " + err.message);
            })
            .getAssistantChatResponse(message, chatHistory.slice(-10)); // 넉넉하게 최근 10개 전송
    }

    function addMessageToUI(sender, text) {
        const container = document.getElementById('chat-messages');
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${sender}`;
        msgDiv.innerText = text;
        container.appendChild(msgDiv);
        container.scrollTop = container.scrollHeight;
    }

    function addLoadingMessage() {
        const container = document.getElementById('chat-messages');
        const loadingId = 'loading-' + Date.now();
        const msgDiv = document.createElement('div');
        msgDiv.className = 'message bot loading';
        msgDiv.id = loadingId;
        msgDiv.innerHTML = '<div class="dot-loading"></div><div class="dot-loading"></div><div class="dot-loading"></div>';
        container.appendChild(msgDiv);
        container.scrollTop = container.scrollHeight;
        return loadingId;
    }

    function removeLoadingMessage(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }

    function handleEmailAction(text) {
        const tagMatch = text.match(/\[ACTION:SEND_EMAIL\|(.*)\]/);
        if (!tagMatch) return;

        const parts = tagMatch[1].split('|');
        const formData = {};
        parts.forEach(p => {
            const colonIndex = p.indexOf(':');
            if (colonIndex === -1) return;
            const key = p.substring(0, colonIndex).trim();
            const val = p.substring(colonIndex + 1).trim();

            if (key === '제목') formData.title = val;
            if (key === '성함') formData.name = val;
            if (key === '연락처') formData.contact = val;
            if (key === '내용') formData.content = val;
        });

        if (formData.title && formData.name && formData.content) {
            addMessageToUI('bot', "국장님께 내용을 전달해 드리기 전, 개인정보 수집 및 이용 동의가 필요합니다. 동의하시나요?");

            showChatbotConsent((agreed) => {
                if (agreed) {
                    addMessageToUI('bot', "감사합니다. 국장님께 지금 즉시 브리핑을 전달하겠습니다.");
                    google.script.run
                        .withSuccessHandler(res => {
                            if (res.success) {
                                addMessageToUI('bot', "알람: 국장님께 문의 내용과 대화 원문이 안전하게 전달되었습니다. 확인 후 연락드리겠습니다.");
                            }
                        })
                        .sendInquiryEmail(formData, chatHistory);
                } else {
                    addMessageToUI('bot', "동의하지 않으셔서 접수가 취소되었습니다. 더 궁금한 점이 있으시면 언제든 말씀해 주세요.");
                }
            });
        }
    }

    function showChatbotConsent(callback) {
        const container = document.getElementById('chat-messages');
        const msgDiv = document.createElement('div');
        msgDiv.className = 'message bot';
        msgDiv.innerHTML = `
            <div style="display: flex; gap: 10px; margin-top: 10px; width: 100%; flex-wrap: nowrap;">
                <button id="cb-yes" class="consent-btn consent-btn-agree" style="flex:1; height:40px;">✅ 동의함</button>
                <button id="cb-no" class="consent-btn consent-btn-disagree" style="flex:1; height:40px;">❌ 동의안함</button>
            </div>
        `;
        container.appendChild(msgDiv);
        container.scrollTop = container.scrollHeight;

        document.getElementById('cb-yes').onclick = () => {
            msgDiv.remove();
            callback(true);
        };
        document.getElementById('cb-no').onclick = () => {
            msgDiv.remove();
            callback(false);
        };
    }

    // ===================================================
    // Admin Dashboard Logic
    // ===================================================
    let currentRecentChats = []; // 최근 챗봇 대화 상세보기를 위한 임시 저장소

    /**
     * 세션 ID 생성 및 가져오기 (브라우저 탭 세션 동안 유지)
     */
    function getSessionId() {
        let sessionId = sessionStorage.getItem('JH_SESSION_ID');
        if (!sessionId) {
            const now = new Date();
            const datePart = now.getFullYear() +
                String(now.getMonth() + 1).padStart(2, '0') +
                String(now.getDate()).padStart(2, '0');
            const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
            sessionId = `JH_${datePart}_${randomPart}`;
            sessionStorage.setItem('JH_SESSION_ID', sessionId);
        }
        return sessionId;
    }

    /**
     * 서버로 방문 로그 전송 (세션 ID 포함)
     */
    function logFootprint(section, action, detail = '') {
        const sessionId = getSessionId();
        const ua = navigator.userAgent;
        const isMobile = /Mobi|Android|iPhone|iPad/i.test(ua) ? '모바일' : 'PC';
        const osBrowser = ua.substring(0, 80);

        const visitInfo = {
            sessionId: sessionId,
            device: isMobile,
            osBrowser: osBrowser,
            section: section,
            action: action,
            detail: detail,
            lang: typeof currentLang !== 'undefined' ? currentLang : 'kr'
        };

        // 백그라운드 기록
        google.script.run.logVisit(visitInfo);
    }

    // 페이지 로드 시 방문 기록 자동 저장
    window.addEventListener('load', () => {
        logFootprint('Home', '페이지 접속');
    });

    // 관리자 버튼 클릭 → 로그인 모달 오픈
    function openAdminModal() {
        document.getElementById('admin-password').value = '';
        document.getElementById('admin-login-status').innerText = '';
        document.getElementById('admin-login-modal').classList.add('open');
        setTimeout(() => document.getElementById('admin-password').focus(), 300);
    }

    // 관리자 암호 제출
    function submitAdminLogin() {
        const pw = document.getElementById('admin-password').value;
        const statusEl = document.getElementById('admin-login-status');

        if (!pw) {
            statusEl.innerText = '암호를 입력해 주세요.';
            return;
        }

        statusEl.style.color = 'var(--mantine-color-dark-2)';
        statusEl.innerText = '인증 중...';

        google.script.run
            .withSuccessHandler(isValid => {
                if (isValid) {
                    window.__adminPw = pw;
                    closeModal('admin-login-modal');
                    openAdminDashboard();
                } else {
                    statusEl.style.color = '#fa5252';
                    statusEl.innerText = '❌ 암호가 올바르지 않습니다.';
                    document.getElementById('admin-password').value = '';
                    document.getElementById('admin-password').focus();
                }
            })
            .withFailureHandler(err => {
                statusEl.style.color = '#fa5252';
                statusEl.innerText = '연결 오류: ' + err.message;
            })
            .verifyAdminPassword(pw);
    }

    // 대시보드 모달 오픈 및 데이터 로드
    function openAdminDashboard() {
        document.getElementById('admin-dashboard-modal').classList.add('open');

        // 헤더 타이틀에 새로고침 버튼 추가 (중복 방지)
        const titleEl = document.getElementById('dashboard-refresh-time');
        if (titleEl && !document.getElementById('admin-refresh-btn')) {
            const refreshBtn = document.createElement('button');
            refreshBtn.id = 'admin-refresh-btn';
            refreshBtn.className = 'dashboard-refresh-btn';
            refreshBtn.innerText = '🔄 새로고침';
            refreshBtn.onclick = loadAdminDashboard;
            titleEl.parentElement.appendChild(refreshBtn);
        }

        loadAdminDashboard();
    }

    // 대시보드 데이터 로드
    function loadAdminDashboard() {
        const visitBody = document.getElementById('visit-log-body');
        const chatContainer = document.getElementById('chat-log-container');
        const timeEl = document.getElementById('dashboard-refresh-time');

        // 로딩 상태 표시
        visitBody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:20px; color:var(--mantine-color-dark-3);">⏳ 데이터 로드 중...</td></tr>`;
        chatContainer.innerHTML = `<div class="dashboard-loading">⏳ 대화 기록 로드 중...</div>`;

        google.script.run
            .withSuccessHandler(data => {
                const now = new Date();
                const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} 기준`;
                if (timeEl) timeEl.innerText = timeStr;

                if (!data.success) {
                    visitBody.innerHTML = `<tr><td colspan="3" style="color:#fa5252; padding:10px;">데이터 로드 실패: ${data.message}</td></tr>`;
                    return;
                }

                renderDashboard(data);
            })
            .withFailureHandler(err => {
                visitBody.innerHTML = `<tr><td colspan="3" style="color:#fa5252; padding:10px;">연결 오류: ${err.message}</td></tr>`;
            })
            .getAdminDashboardData(window.__adminPw);
    }

    // 대시보드 데이터 렌더링
    function renderDashboard(data) {
        // 1. 통계 카드
        const todayEl = document.getElementById('stat-today');
        const totalEl = document.getElementById('stat-total');
        const topSystemsEl = document.getElementById('stat-top-systems');

        if (todayEl) todayEl.innerText = data.stats.today || 0;
        if (totalEl) totalEl.innerText = data.stats.total || 0;

        // 인기 솔루션 렌더링
        if (topSystemsEl) {
            const topSystems = data.stats.topSystems || [];
            if (topSystems.length === 0) {
                topSystemsEl.innerHTML = `<div style="font-size: 0.85rem; color: var(--mantine-color-dark-2);">데이터 수집 중...</div>`;
            } else {
                topSystemsEl.innerHTML = topSystems.map((s, i) => `
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-size:0.9rem; color:white; font-weight:600;">${i + 1}. ${s.name}</span>
                        <span style="font-size:0.75rem; color:var(--jh-blue); font-weight:700;">${s.count} clicks</span>
                    </div>
                `).join('');
            }
        }

        // 2. 방문 로그 테이블
        const visitBody = document.getElementById('visit-log-body');
        if (!data.recentVisits || data.recentVisits.length === 0) {
            visitBody.innerHTML = `<tr><td colspan="3" class="dashboard-empty">방문 기록이 없습니다.</td></tr>`;
        } else {
            visitBody.innerHTML = data.recentVisits.map(v => {
                // 시간 포맷 (HH:MM만 표시)
                const timeStr = String(v.time || '').substring(11, 16) || v.time;
                const dateStr = String(v.time || '').substring(0, 10);
                return `
                    <tr>
                        <td title="${v.time}">${dateStr}<br><span style="color:var(--mantine-color-dark-3);font-size:0.7rem;">${timeStr}</span></td>
                        <td title="${v.device}">${v.device || '-'}</td>
                        <td title="${v.action}">${v.action || '접속'}</td>
                    </tr>
                `;
            }).join('');
        }

        // 3. 챗봇 대화 로그
        const chatContainer = document.getElementById('chat-log-container');
        currentRecentChats = data.recentChats || []; // 데이터 저장

        if (currentRecentChats.length === 0) {
            chatContainer.innerHTML = `<div class="dashboard-empty">최근 챗봇 대화가 없습니다.</div>`;
        } else {
            chatContainer.innerHTML = currentRecentChats.map((c, idx) => {
                const timeStr = String(c.time || '').substring(0, 16).replace('T', ' ');
                // 목록에서는 적절히 생략 (상세보기에서 전체 확인)
                const q = String(c.question || '').length > 45 ? String(c.question).substring(0, 45) + '...' : c.question;
                const a = String(c.answer || '').length > 45 ? String(c.answer).substring(0, 45) + '...' : c.answer;

                return `
                    <div class="chat-log-item" onclick="openChatDetail(${idx})" style="cursor:pointer;">
                        <div class="chat-log-time">🕒 ${timeStr}</div>
                        <div class="chat-log-question">👤 ${q}</div>
                        <div class="chat-log-answer">🤖 ${a}</div>
                    </div>
                `;
            }).join('');
        }
    }

    // 챗봇 대화 상세보기 모달 열기
    function openChatDetail(idx) {
        const chat = currentRecentChats[idx];
        if (!chat) return;

        document.getElementById('detail-chat-time').innerText = `🕒 ${chat.time}`;
        document.getElementById('detail-chat-question').innerText = chat.question;
        document.getElementById('detail-chat-answer').innerText = chat.answer;

        document.getElementById('chat-detail-modal').classList.add('open');
    }

    // 대시보드 모달 바깥 클릭 닫기
    document.addEventListener('DOMContentLoaded', () => {
        const adminLoginModal = document.getElementById('admin-login-modal');
        const adminDashboardModal = document.getElementById('admin-dashboard-modal');
        if (adminLoginModal) {
            adminLoginModal.onclick = (e) => {
                if (e.target === adminLoginModal) closeModal('admin-login-modal');
            };
        }
        if (adminDashboardModal) {
            adminDashboardModal.onclick = (e) => {
                if (e.target === adminDashboardModal) closeModal('admin-dashboard-modal');
            };
        }
    });

    /**
     * 푸터 타자기 효과 (Typewriter Effect)
     * "코딩하는 사회복지사, 장진현" 문구를 타이핑 후 10초 대기, 다시 반복
     */
    function initFooterTyping() {
        const text = "코딩하는 사회복지사, 장진현";
        const element = document.getElementById('footer-typing');
        if (!element) return;

        let index = 0;
        let isDeleting = false;

        function type() {
            const currentContent = text.substring(0, index);
            element.innerText = currentContent;

            if (!isDeleting) {
                // 한 글자씩 추가
                if (index < text.length) {
                    index++;
                    setTimeout(type, 120 + Math.random() * 50); // 타이핑 속도 (약간의 랜덤성)
                } else {
                    // 전체 타이핑 완료 -> 10초 대기 후 삭제 시작
                    isDeleting = true;
                    setTimeout(type, 10000);
                }
            } else {
                // 한 글자씩 삭제 (빠르게)
                if (index > 0) {
                    index--;
                    setTimeout(type, 50);
                } else {
                    // 삭제 완료 -> 다시 타이핑 시작
                    isDeleting = false;
                    setTimeout(type, 500);
                }
            }
        }

        type();
    }

