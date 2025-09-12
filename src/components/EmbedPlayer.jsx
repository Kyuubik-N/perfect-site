import _React from 'react'
// Detect supported providers and build embed src
export function getEmbedInfo(rawUrl = '') {
  if (typeof rawUrl !== 'string' || !rawUrl) return null
  const url = rawUrl.trim()

  // YouTube
  try {
    const u = new URL(url)
    if (u.hostname.includes('youtube.com') || u.hostname === 'youtu.be') {
      let id = ''
      if (u.hostname === 'youtu.be') {
        id = u.pathname.slice(1).split('/')[0]
      } else if (u.pathname.startsWith('/watch')) {
        id = u.searchParams.get('v') || ''
      } else if (u.pathname.startsWith('/shorts/')) {
        id = u.pathname.split('/')[2] || ''
      } else if (u.pathname.startsWith('/embed/')) {
        id = u.pathname.split('/')[2] || ''
      }
      if (id)
        return {
          provider: 'youtube',
          src: `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`,
        }
    }
  } catch {}

  // Vimeo
  const vimeo = url.match(/^https?:\/\/(?:www\.)?vimeo\.com\/(\d+)/i)
  if (vimeo) return { provider: 'vimeo', src: `https://player.vimeo.com/video/${vimeo[1]}` }

  // Dailymotion
  const dm = url.match(/^https?:\/\/(?:www\.)?dailymotion\.com\/video\/([a-z0-9]+)/i)
  if (dm)
    return { provider: 'dailymotion', src: `https://www.dailymotion.com/embed/video/${dm[1]}` }

  // RuTube (UUID)
  const rt = url.match(/^https?:\/\/(?:www\.)?rutube\.ru\/video\/([a-f0-9-]{10,})/i)
  if (rt) return { provider: 'rutube', src: `https://rutube.ru/play/embed/${rt[1]}` }

  // SoundCloud (use their universal player)
  if (/^https?:\/\/soundcloud\.com\//i.test(url)) {
    const src = `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%2334d399`
    return { provider: 'soundcloud', src }
  }

  return null
}

export default function EmbedPlayer({ url, title = 'Embedded media', className = '' }) {
  const info = getEmbedInfo(url)
  if (!info) return null
  const allow =
    'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
  return (
    <div
      className={`relative w-full rounded-lg overflow-hidden bg-black/30 ${className}`}
      style={{ paddingTop: '56.25%' }}
    >
      <iframe
        src={info.src}
        title={title}
        allow={allow}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="absolute inset-0 w-full h-full"
      />
    </div>
  )
}
