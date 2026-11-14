(() => {
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const headerWrap = document.querySelector('.header-wrap');
  const updateHeader = () => headerWrap.classList.toggle('is-scrolled', window.scrollY > 24);
  const menu = document.getElementById('siteNav');
  const menuToggle = document.getElementById('menuToggle');
  function setMenuOpen(open) {
    menu.classList.toggle('open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menuToggle.querySelector('use').setAttribute('href', 'assets/icons/ui-sprite.svg#' + (open ? 'close' : 'menu'));
    updateSticky();
  }
  menuToggle.addEventListener('click', () => setMenuOpen(!menu.classList.contains('open')));
  menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenuOpen(false)));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.classList.contains('open')) {
      setMenuOpen(false);
      menuToggle.focus();
    }
  });
  document.addEventListener('click', event => {
    if (menu.classList.contains('open') && !event.target.closest('.header')) setMenuOpen(false);
  });

  const revealEls = document.querySelectorAll('.reveal');
  let revealObserver;
  const revealAll = () => {
    revealObserver?.disconnect();
    revealEls.forEach(el => el.classList.add('visible'));
  };
  if ('IntersectionObserver' in window && !motionPreference.matches) {
    revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    }), { threshold: .12 });
    document.documentElement.classList.add('reveal-ready');
    revealEls.forEach(el => {
      const finishReveal = event => {
        if (event.target === el && event.propertyName === 'opacity' && el.classList.contains('visible')) {
          el.classList.remove('delay-1', 'delay-2');
          el.removeEventListener('transitionend', finishReveal);
        }
      };
      el.addEventListener('transitionend', finishReveal);
      revealObserver.observe(el);
    });
  } else revealAll();
  motionPreference.addEventListener('change', event => { if (event.matches) revealAll(); });

  document.querySelectorAll('.faq-question').forEach(button => button.addEventListener('click', () => {
    const item = button.closest('.faq-item'); const isOpen = item.classList.toggle('open');
    button.setAttribute('aria-expanded', String(isOpen));
  }));

  const slides = [...document.querySelectorAll('.review-slide')];
  const dots = document.querySelectorAll('.review-dots i');
  let reviewIndex = 0;
  function showReview(index) {
    reviewIndex = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      const active = i === reviewIndex;
      slide.classList.toggle('is-active', active);
      slide.setAttribute('aria-hidden', String(!active));
      dots[i].classList.toggle('active', active);
    });
  }
  document.getElementById('prevReview').addEventListener('click', () => showReview(reviewIndex - 1));
  document.getElementById('nextReview').addEventListener('click', () => showReview(reviewIndex + 1));

  const form = document.getElementById('bookingForm');
  const formError = document.getElementById('formError');
  const service = document.getElementById('service');
  const serviceTrigger = document.getElementById('serviceTrigger');
  const serviceValue = document.getElementById('serviceValue');
  const serviceMenu = document.getElementById('serviceOptions');
  const serviceOptions = [...serviceMenu.querySelectorAll('[role="option"]')];
  function setService(value) {
    service.value = value || '';
    const selected = serviceOptions.find(option => option.dataset.value === service.value);
    serviceValue.textContent = selected ? selected.textContent : 'Choose a stay';
    serviceTrigger.classList.toggle('is-placeholder', !selected);
    serviceTrigger.classList.remove('is-invalid');
    serviceTrigger.setAttribute('aria-invalid', 'false');
    formError.textContent = '';
    serviceOptions.forEach(option => option.setAttribute('aria-selected', String(option === selected)));
    serviceMenu.hidden = true;
    serviceTrigger.setAttribute('aria-expanded', 'false');
    updateEstimate();
  }
  function openServiceMenu() {
    dateControls.forEach(control => control.closePicker());
    serviceMenu.hidden = false;
    serviceTrigger.setAttribute('aria-expanded', 'true');
    const selected = serviceOptions.find(option => option.dataset.value === service.value);
    (selected || serviceOptions[0]).focus();
  }
  function closeServiceMenu(returnFocus = false) {
    serviceMenu.hidden = true;
    serviceTrigger.setAttribute('aria-expanded', 'false');
    if (returnFocus) serviceTrigger.focus();
  }
  serviceTrigger.addEventListener('click', () => serviceMenu.hidden ? openServiceMenu() : closeServiceMenu());
  serviceTrigger.addEventListener('keydown', event => {
    if (['ArrowDown','ArrowUp','Enter',' '].includes(event.key)) { event.preventDefault(); openServiceMenu(); }
  });
  serviceOptions.forEach((option, index) => {
    option.addEventListener('click', () => { setService(option.dataset.value); serviceTrigger.focus(); });
    option.addEventListener('keydown', event => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        const offset = event.key === 'ArrowDown' ? 1 : -1;
        serviceOptions[(index + offset + serviceOptions.length) % serviceOptions.length].focus();
      } else if (event.key === 'Home' || event.key === 'End') {
        event.preventDefault(); serviceOptions[event.key === 'Home' ? 0 : serviceOptions.length - 1].focus();
      } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault(); setService(option.dataset.value); serviceTrigger.focus();
      } else if (event.key === 'Escape') { event.preventDefault(); closeServiceMenu(true); }
    });
  });
  document.addEventListener('pointerdown', event => { if (!event.target.closest('.service-picker')) closeServiceMenu(); });

  serviceTrigger.closest('.service-picker').addEventListener('focusout', event => {
    if (!event.currentTarget.contains(event.relatedTarget)) closeServiceMenu();
  });

  const from = document.getElementById('dateFrom');
  const to = document.getElementById('dateTo');
  const fromDisplay = document.getElementById('dateFromDisplay');
  const toDisplay = document.getElementById('dateToDisplay');
  const estimate = document.getElementById('formEstimate');
  const moneyFormatter = new Intl.NumberFormat('en-US');
  const priceOptions = new Map([...document.querySelectorAll('.service-select')].map(link => [link.dataset.service, link.closest('.service-card').dataset]));
  function updateEstimate() {
    if (!service.value || service.value === 'Help me choose') {
      estimate.hidden = true; estimate.textContent = ''; return;
    }
    estimate.hidden = false;
    const option = priceOptions.get(service.value);
    const rate = Number(option?.estimateRate);
    if (!rate) { estimate.textContent = 'Price on request'; return; }
    const money = amount => '₴' + moneyFormatter.format(amount);
    const start = from.value ? Date.parse(from.value + 'T00:00:00Z') : NaN;
    const end = to.value ? Date.parse(to.value + 'T00:00:00Z') : NaN;
    const days = Math.round((end - start) / 86400000);
    const nights = option.estimateUnit === 'night';
    if (Number.isFinite(days) && (nights ? days > 0 : days >= 0)) {
      const count = nights ? days : days + 1;
      const unit = nights ? 'night' : 'day';
      estimate.textContent = `Approx. ${money(rate * count)} · ${count} ${unit}${count === 1 ? '' : 's'}`;
    } else estimate.textContent = `From ${money(rate)} / ${nights ? 'night' : 'day'}`;
  }
  form.addEventListener('change', updateEstimate);

  const today = new Date(); today.setHours(0,0,0,0);
  const pad = number => String(number).padStart(2, '0');
  const toISO = date => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const fromISO = value => { const [year, month, day] = value.split('-').map(Number); return new Date(year, month - 1, day); };
  const formatDate = date => `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`;
  const localDate = toISO(today);
  const monthLabel = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' });
  const fullDateLabel = new Intl.DateTimeFormat('en-GB', { dateStyle: 'full' });
  const dateControls = [...document.querySelectorAll('.date-control')].map(wrapper => {
    const hiddenInput = wrapper.querySelector('input[type="hidden"]');
    const displayInput = wrapper.querySelector('.date-display');
    const picker = wrapper.querySelector('.date-picker');
    const calendarTrigger = wrapper.querySelector('[data-open-calendar]');
    const monthHeading = wrapper.querySelector('.calendar-month');
    const daysGrid = wrapper.querySelector('.calendar-days');
    const isEndDate = hiddenInput.id === 'dateTo';
    let visibleMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const minValue = () => isEndDate ? (from.value || localDate) : localDate;
    function closePicker(returnFocus = false) {
      picker.hidden = true;
      calendarTrigger.setAttribute('aria-expanded', 'false');
      if (returnFocus) displayInput.focus();
    }
    function selectDate(value) {
      if (value < minValue()) return;
      hiddenInput.value = value;
      displayInput.value = formatDate(fromISO(value));
      displayInput.classList.remove('is-invalid');
      displayInput.setAttribute('aria-invalid', 'false');
      hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
      formError.textContent = '';
      closePicker(true);
    }
    function renderCalendar() {
      monthHeading.textContent = monthLabel.format(visibleMonth).replace(/^./u, letter => letter.toLocaleUpperCase('en-GB'));
      daysGrid.replaceChildren();
      const firstDay = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
      const mondayOffset = (firstDay.getDay() + 6) % 7;
      const start = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1 - mondayOffset);
      for (let index = 0; index < 42; index++) {
        const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index);
        const value = toISO(date);
        const button = document.createElement('button');
        button.type = 'button'; button.className = 'calendar-day'; button.textContent = date.getDate();
        button.dataset.date = value;
        button.setAttribute('aria-label', fullDateLabel.format(date));
        button.setAttribute('aria-pressed', String(hiddenInput.value === value));
        if (date.getMonth() !== visibleMonth.getMonth()) button.classList.add('is-outside');
        if (value === localDate) button.classList.add('is-today');
        if (value < minValue()) button.disabled = true;
        daysGrid.append(button);
      }
      const todayButton = picker.querySelector('[data-today]');
      todayButton.disabled = localDate < minValue();
      todayButton.setAttribute('aria-disabled', String(todayButton.disabled));
    }
    daysGrid.addEventListener('click', event => {
      const button = event.target.closest('[data-date]');
      if (button && !button.disabled) selectDate(button.dataset.date);
    });
    function openPicker() {
      closeServiceMenu();
      dateControls.forEach(control => { if (control.wrapper !== wrapper) control.closePicker(); });
      const seed = hiddenInput.value || (isEndDate && from.value) || localDate;
      const date = fromISO(seed);
      visibleMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      renderCalendar(); picker.hidden = false; calendarTrigger.setAttribute('aria-expanded', 'true');
      const focusTarget = daysGrid.querySelector(`[data-date="${hiddenInput.value || minValue()}"]:not(:disabled)`) || daysGrid.querySelector('.calendar-day:not(:disabled)');
      focusTarget?.focus();
    }
    wrapper.querySelector('[data-open-calendar]').addEventListener('click', () => picker.hidden ? openPicker() : closePicker(true));
    displayInput.addEventListener('click', openPicker);
    displayInput.addEventListener('keydown', event => {
      if (['Enter',' ','ArrowDown'].includes(event.key)) { event.preventDefault(); openPicker(); }
      if (event.key === 'Escape') closePicker();
    });
    picker.querySelector('[data-prev-month]').addEventListener('click', () => { visibleMonth.setMonth(visibleMonth.getMonth() - 1); renderCalendar(); });
    picker.querySelector('[data-next-month]').addEventListener('click', () => { visibleMonth.setMonth(visibleMonth.getMonth() + 1); renderCalendar(); });
    picker.querySelector('[data-clear-date]').addEventListener('click', () => {
      hiddenInput.value = ''; displayInput.value = ''; displayInput.classList.remove('is-invalid');
      displayInput.setAttribute('aria-invalid', 'false');
      hiddenInput.dispatchEvent(new Event('change', { bubbles: true })); formError.textContent = ''; closePicker(true);
    });
    picker.querySelector('[data-today]').addEventListener('click', () => { if (!picker.querySelector('[data-today]').disabled) selectDate(localDate); });
    wrapper.addEventListener('focusout', event => {
      if (!wrapper.contains(event.relatedTarget)) closePicker();
    });
    return { wrapper, picker, closePicker, renderCalendar };
  });
  document.addEventListener('pointerdown', event => dateControls.forEach(control => { if (!control.wrapper.contains(event.target)) control.closePicker(); }));
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    const openControl = dateControls.find(control => !control.picker.hidden);
    openControl?.closePicker(true);
  });
  from.addEventListener('change', () => {
    if (to.value && from.value && to.value < from.value) { to.value = ''; toDisplay.value = ''; }
    dateControls.forEach(control => { if (!control.picker.hidden) control.renderCalendar(); });
  });
  form.addEventListener('submit', event => {
    event.preventDefault(); formError.textContent = '';
    if (!service.value) { serviceTrigger.classList.add('is-invalid'); serviceTrigger.setAttribute('aria-invalid', 'true'); formError.textContent = 'Please choose a type of care.'; serviceTrigger.focus(); return; }
    if (!from.value) { fromDisplay.classList.add('is-invalid'); fromDisplay.setAttribute('aria-invalid', 'true'); formError.textContent = 'Please choose your preferred start date.'; fromDisplay.focus(); return; }
    if (!form.reportValidity()) { formError.textContent = 'Please check the required fields.'; return; }
    if (to.value && from.value && to.value < from.value) { formError.textContent = 'The end date cannot be before the start date.'; toDisplay.focus(); return; }
    document.getElementById('bookingFormWrap').style.display = 'none';
    const success = document.getElementById('formSuccess');
    success.classList.add('show');
    success.focus({ preventScroll: true });
  });
  document.querySelectorAll('.service-select').forEach(link => link.addEventListener('click', () => {
    setService(link.dataset.service);
    window.setTimeout(() => serviceTrigger.focus({ preventScroll: true }), motionPreference.matches ? 0 : 450);
  }));

  const sticky = document.getElementById('mobileSticky');
  const contact = document.getElementById('contact');
  const heroAction = document.querySelector('.hero-actions .btn-primary');
  const mobileViewport = window.matchMedia('(max-width: 600px)');
  const menuViewport = window.matchMedia('(max-width: 1200px), (max-width: 1400px) and (hover: none) and (pointer: coarse)');
  let stickyVisible = false;
  function setStickyVisible(show) {
    if (show === stickyVisible) return;
    stickyVisible = show;
    sticky.classList.toggle('hidden', !show);
    sticky.setAttribute('aria-hidden', String(!show));
    sticky.inert = !show;
  }
  let heroActionPassed = false, contactVisible = false, stickyObserver;
  let stickyHeaderBottom = 0;
  function observeStickyRegions() {
    if (!('IntersectionObserver' in window)) return;
    const bottom = Math.ceil(headerWrap.getBoundingClientRect().bottom);
    if (stickyObserver && bottom === stickyHeaderBottom) return;
    stickyHeaderBottom = bottom;
    stickyObserver?.disconnect();
    stickyObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.target === heroAction) heroActionPassed = entry.boundingClientRect.bottom <= stickyHeaderBottom;
        if (entry.target === contact) contactVisible = entry.isIntersecting;
      });
      updateSticky();
    }, { rootMargin: `-${bottom}px 0px 0px 0px` });
    stickyObserver.observe(heroAction);
    stickyObserver.observe(contact);
  }
  if ('ResizeObserver' in window) new ResizeObserver(observeStickyRegions).observe(headerWrap);
  else window.addEventListener('resize', observeStickyRegions);
  requestAnimationFrame(observeStickyRegions);
  function updateSticky() {
    if (!mobileViewport.matches || menu.classList.contains('open')) {
      setStickyVisible(false);
      return;
    }
    if (!('IntersectionObserver' in window)) {
      const headerBottom = headerWrap.getBoundingClientRect().bottom;
      const contactRect = contact.getBoundingClientRect();
      contactVisible = contactRect.top < window.innerHeight && contactRect.bottom > headerBottom;
      heroActionPassed = heroAction.getBoundingClientRect().bottom <= headerBottom;
    }
    const show = window.scrollY > 24 && heroActionPassed && !contactVisible;
    setStickyVisible(show);
  }
  function updateViewport() {
    // Read mobile geometry before changing the header's style.
    updateSticky();
    updateHeader();
  }
  let viewportFrame = 0;
  function scheduleViewportUpdate() {
    if (viewportFrame) return;
    viewportFrame = window.requestAnimationFrame(() => {
      viewportFrame = 0;
      updateViewport();
    });
  }
  window.addEventListener('scroll', scheduleViewportUpdate, { passive: true });
  window.addEventListener('resize', () => {
    if (!menuViewport.matches && menu.classList.contains('open')) setMenuOpen(false);
    scheduleViewportUpdate();
  });
  window.addEventListener('pageshow', scheduleViewportUpdate);
  scheduleViewportUpdate();
})();

// Start the seamless photo loop once every frame is decoded.
(() => {
  const gallery = document.getElementById('photoGallery');
  if (!gallery) return;
  const prepare = async () => {
    await Promise.all(Array.from(gallery.querySelectorAll('img'), img => {
      img.loading = 'eager';
      return img.decode().catch(() => {});
    }));
    gallery.classList.add('is-ready');
  };
  if (!('IntersectionObserver' in window)) { prepare(); return; }
  const observer = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) { observer.disconnect(); prepare(); }
  }, { rootMargin: '400px' });
  observer.observe(gallery);
})();

// Keep continuous loops dormant outside the viewport and in background tabs.
(() => {
  const root = document.documentElement;
  const updateVisibility = () => root.classList.toggle('page-hidden', document.hidden);
  document.addEventListener('visibilitychange', updateVisibility);
  updateVisibility();
  if (!('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => entry.target.classList.toggle('motion-paused', !entry.isIntersecting));
  }, { rootMargin: '100px' });
  document.querySelectorAll('.benefit-marquee, .photo-gallery').forEach(el => {
    el.classList.add('motion-paused');
    observer.observe(el);
  });
})();

Promise.resolve(document.fonts?.ready).then(() => {
  document.querySelector('.benefit-marquee').classList.add('is-ready');
});

// Three still-photo chapters: hold, reveal the next frame, then release to content.
// Native scroll works in both directions, including touch, keyboard and anchors.
(() => {
  const track = document.querySelector('.hero-scroll-track');
  if (!track) return;
  const hero = track.querySelector('.hero');
  const marquee = document.querySelector('.benefit-marquee');
  const marqueeSlot = document.querySelector('.benefit-marquee-slot');
  const frames = [...hero.querySelectorAll('.hero-frame')];
  const photos = frames.map(frame => frame.querySelector('img'));
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const ready = [true, false, false];
  const clamp = value => Math.max(0, Math.min(1, value));
  const smooth = value => { const p = clamp(value); return p * p * (3 - 2 * p); };
  let height = 1, trackTop = 0, marqueeTop = 0, marqueeHeight = 48, frame = 0, previous = '';
  let pinned = !preference.matches, measured = false, measureFrame = 0;
  marquee.classList.toggle('is-hero-pinned', pinned);
  document.documentElement.classList.remove('desktop-marquee-initial');
  const update = () => {
    frame = 0;
    if (!measured) return;
    const shouldPin = !preference.matches && window.scrollY < marqueeTop - height + marqueeHeight;
    if (shouldPin !== pinned) {
      pinned = shouldPin;
      marquee.classList.toggle('is-hero-pinned', pinned);
    }
    if (preference.matches) {
      frames.forEach(item => { item.style.removeProperty('clip-path'); item.style.removeProperty('transform'); item.style.removeProperty('border-radius'); });
      previous = ''; return;
    }
    const progress = Math.max(0, window.scrollY - trackTop) / height;
    const second = ready[1] ? smooth((progress - 0.35) / 0.5) : 0;
    const third = ready[2] ? smooth((progress - 1.15) / 0.5) : 0;
    const state = `${second}:${third}`;
    if (state === previous) return;
    previous = state;
    frames[1].style.clipPath = `inset(${(1 - second) * 100}% 0 0 0)`;
    frames[2].style.clipPath = `inset(${(1 - third) * 100}% 0 0 0)`;
    [second, third].forEach((amount, i) => {
      frames[i].style.transform = `translateY(${-amount * 2}%) scale(${1 - amount * 0.035})`;
      frames[i].style.borderRadius = `${amount * 32}px`;
    });
  };
  const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
  const measure = () => {
    height = Math.max(1, hero.getBoundingClientRect().height);
    trackTop = track.getBoundingClientRect().top + window.scrollY;
    marqueeHeight = marquee.offsetHeight;
    marqueeTop = marqueeSlot.getBoundingClientRect().top + window.scrollY;
    if (marqueeSlot.style.height !== `${marqueeHeight}px`) marqueeSlot.style.height = `${marqueeHeight}px`;
    measured = true;
    previous = ''; schedule();
  };
  const scheduleMeasure = () => {
    if (!measureFrame) measureFrame = requestAnimationFrame(() => { measureFrame = 0; measure(); });
  };
  const preparePhotos = () => {
    if (preference.matches) return;
    photos.slice(1).forEach((photo, offset) => {
      if (photo.dataset.prepared) return;
      photo.dataset.prepared = 'true'; photo.loading = 'eager';
      const complete = () => { ready[offset + 1] = photo.naturalWidth > 0; previous = ''; schedule(); };
      // An unavailable photo never covers the previous chapter with an empty frame.
      photo.addEventListener('load', complete, { once: true });
      photo.addEventListener('error', () => { ready[offset + 1] = false; schedule(); }, { once: true });
      photo.src = photo.dataset.src;
      if (photo.complete) complete();
    });
  };
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', scheduleMeasure, { passive: true });
  addEventListener('pageshow', scheduleMeasure);
  preference.addEventListener('change', () => { preparePhotos(); scheduleMeasure(); });
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(scheduleMeasure);
    observer.observe(hero); observer.observe(track);
  }
  Promise.resolve(document.fonts?.ready).then(scheduleMeasure);
  requestAnimationFrame(scheduleMeasure);
  photos[0].decode().catch(() => {}).then(preparePhotos);
})();


// Manual tabs: stable layout, keyboard navigation and no automatic switching.
(() => {
  const list = document.querySelector('.stay-tabs');
  if (!list) return;
  const tabs = [...list.querySelectorAll('[role="tab"]')];
  const activate = (tab, focus = false) => {
    tabs.forEach(item => {
      const selected = item === tab;
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
      const panel = document.getElementById(item.getAttribute('aria-controls'));
      panel.classList.toggle('is-active', selected);
      panel.setAttribute('aria-hidden', String(!selected));
      panel.inert = !selected;
    });
    if (focus) tab.focus();
  };
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activate(tab));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      activate(tabs[next], true);
    });
  });
})();


// Lazy-load the care clip and pause it outside the viewport or in background tabs.
(() => {
  const video = document.querySelector('.care-video');
  if (!video) return;
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const dialog = document.getElementById('privacyDialog');
  let visible = false, loaded = false;
  const sync = () => {
    const playing = visible && !document.hidden && !preference.matches && !dialog?.open;
    video.parentElement.classList.toggle('care-motion-active', playing);
    if (playing) {
      if (!loaded) {
        loaded = true;
        const source = video.querySelector('source');
        source.src = source.dataset.src;
        video.load();
      }
      video.play().catch(() => {});
    } else video.pause();
  };
  video.muted = true;
  dialog?.addEventListener('close', sync);
  document.getElementById('openPrivacy')?.addEventListener('click', () => queueMicrotask(sync));
  document.addEventListener('visibilitychange', sync);
  preference.addEventListener('change', sync);
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting && entries[0].intersectionRatio >= .15;
      sync();
    }, { threshold: [0, .15] });
    observer.observe(video);
  } else { visible = true; sync(); }
})();


// Native modal provides focus trapping, Escape dismissal and focus return.
(() => {
  const dialog = document.getElementById('privacyDialog');
  const trigger = document.getElementById('openPrivacy');
  if (!dialog || !trigger) return;
  trigger.addEventListener('click', () => {
    dialog.showModal();
    document.documentElement.classList.add('privacy-modal-open');
  });
  dialog.addEventListener('close', () => document.documentElement.classList.remove('privacy-modal-open'));
  document.getElementById('closePrivacy').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
  });
})();
