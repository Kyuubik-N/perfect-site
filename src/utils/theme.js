// Apply theme on first load based on localStorage or OS preference.
// Guard against environments where localStorage or matchMedia may throw/behave oddly.
;(function () {
  try {
    let storage = null
    try {
      storage = window.localStorage ? localStorage.getItem('theme') : null
    } catch (_) {
      storage = null
    }
    let prefersDark = false
    try {
      prefersDark = !!window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    } catch (_) {}
    const theme = storage ?? (prefersDark ? 'dark' : 'light')
    if (theme === 'dark') document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')

    if (!storage && window.matchMedia) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      const apply = (e) => {
        try {
          if (window.localStorage && localStorage.getItem('theme')) return
        } catch (_) {
          /* ignore */
        }
        if (e.matches) document.documentElement.classList.add('dark')
        else document.documentElement.classList.remove('dark')
      }
      // addEventListener fallback for older Safari
      if (typeof mq.addEventListener === 'function') mq.addEventListener('change', apply)
      else if (typeof mq.addListener === 'function') mq.addListener(apply)
    }
  } catch (_) {
    // As a last resort, don't crash — keep default styles
  }
})()
