import React from 'react'

const host = (u) => {
  try {
    return new URL(u).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

export function getEmbedInfo(url) {
  if (!url) return null
  const h = host(url)
  const parent = window.location.hostname

  // YouTube
  if (h.includes('youtube.com') || h === 'youtu.be') {
    let id = ''
    try {
      const u = new URL(url)
      if (u.hostname === 'youtu.be') id = u.pathname.slice(1)
      else if (u.pathname.startsWith('/shorts/')) id = u.pathname.split('/')[2]
      else id = u.searchParams.get('v') || ''
    } catch {}
    if (id)
      return {
        title: 'YouTube',
        src: `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`,
        allow:
          'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
        type: 'iframe',
      }
  }

  // Vimeo
  if (h.includes('vimeo.com')) {
    const m = url.match(/vimeo\.com\/(\d+)/)
    if (m)
      return {
        title: 'Vimeo',
        src: `https://player.vimeo.com/video/${m[1]}`,
        allow: 'autoplay; fullscreen; picture-in-picture',
        type: 'iframe',
      }
  }

  // Dailymotion
  if (h.includes('dailymotion.com')) {
    const m = url.match(/video\/([a-zA-Z0-9]+)/)
    if (m)
      return {
        title: 'Dailymotion',
        src: `https://www.dailymotion.com/embed/video/${m[1]}`,
        allow: 'autoplay; fullscreen; picture-in-picture',
        type: 'iframe',
      }
  }

  // Twitch (нужно parent=)
  if (h.includes('twitch.tv')) {
    const vid = url.match(/videos\/(\d+)/)?.[1]
    const ch = url.match(/twitch\.tv\/([^/]+)$/)?.[1]
    if (vid || ch) {
      return {
        title: 'Twitch',
        src: vid
          ? `https://player.twitch.tv/?video=${vid}&parent=${parent}`
          : `https://player.twitch.tv/?channel=${ch}&parent=${parent}`,
        allow: 'autoplay; fullscreen; picture-in-picture',
        type: 'iframe',
      }
    }
  }

  // SoundCloud
  if (h.includes('soundcloud.com')) {
    return {
      title: 'SoundCloud',
      src: `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23a7f3d0&auto_play=false`,
      allow: 'autoplay',
      type: 'iframe',
    }
  }

  // Spotify
  if (h.includes('open.spotify.com')) {
    const u = new URL(url)
    const path = u.pathname.replace(
      /^\/(track|album|playlist|episode|show)\//,
      (m) => `/embed/${m}`,
    )
    return {
      title: 'Spotify',
      src: `https://open.spotify.com${path}`,
      allow: 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture',
      type: 'iframe',
    }
  }

  return {
    title: h || 'Сайт',
    src: url,
    sandbox: 'allow-scripts allow-same-origin allow-popups allow-forms',
    type: 'iframe',
  }
}

export default function EmbedPlayer({ url }) {
  const info = React.useMemo(() => getEmbedInfo(url), [url])
  if (!info) return null
  return (
    <div className="embed-wrap">
      {info.type === 'iframe' && (
        <iframe
          src={info.src}
          title={info.title}
          allow={info.allow}
          sandbox={info.sandbox}
          loading="lazy"
          referrerPolicy="no-referrer"
          allowFullScreen
          className="embed-iframe"
        />
      )}
    </div>
  )
}
