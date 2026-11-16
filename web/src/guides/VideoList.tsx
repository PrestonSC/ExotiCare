import { Link } from 'react-router-dom'
import { GUIDES } from './index'
import { VIDEOS, videoUrl, type Video } from './videos'

export function VideoItem({ v }: { v: Video }) {
  return (
    <li className="video-item">
      <a href={videoUrl(v.id)} target="_blank" rel="noopener noreferrer">
        <span className="play" aria-hidden>▶</span>
        <span className="video-text">
          <span className="video-title">{v.title}</span>
          <span className="video-note">{v.note}</span>
          {v.by && <span className="video-note">By {v.by}</span>}
          <span className="video-open">Opens YouTube in a new tab</span>
        </span>
      </a>
    </li>
  )
}

/** All videos, grouped by the guide they belong with. */
export default function VideoList() {
  const groups = GUIDES.map((g) => ({ g, videos: VIDEOS.filter((v) => v.topic === g.slug) })).filter((x) => x.videos.length > 0)
  if (groups.length === 0) return <p className="muted">No videos yet.</p>
  return (
    <div className="video-list">
      {groups.map(({ g, videos }) => (
        <section key={g.slug}>
          <h3>{g.emoji} {g.title}</h3>
          <ul>{videos.map((v) => <VideoItem key={v.id} v={v} />)}</ul>
          <p className="small"><Link to={`/guides/${g.slug}`}>Read the written guide →</Link></p>
        </section>
      ))}
    </div>
  )
}
