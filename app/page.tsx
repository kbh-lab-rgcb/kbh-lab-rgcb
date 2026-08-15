import content from "./content.generated";

const Arrow = () => <span aria-hidden="true">↗</span>;

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label={`${content.lab.shortName} home`}>
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
          <span>{content.lab.shortName}</span>
        </a>
        <nav aria-label="Main navigation">
          <a href="#research">Research</a><a href="#people">People</a><a href="#publications">Publications</a>
          <a className="nav-cta" href="#join">Join the lab <Arrow /></a>
        </nav>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="kicker"><span /> {content.lab.eyebrow}</p>
          <h1>{content.lab.title}</h1>
          <p className="hero-intro">{content.pages.about}</p>
          <div className="hero-actions">
            <a className="button primary" href="#research">Explore our research <Arrow /></a>
            <a className="text-link" href="#people">Meet the team <span aria-hidden="true">↓</span></a>
          </div>
        </div>
        <div className="hero-visual" aria-label="Abstract visualization of connected biological systems">
          <div className="orbit orbit-one"><span /></div><div className="orbit orbit-two"><span /></div><div className="orbit orbit-three"><span /></div>
          <div className="core"><b>01</b><small>Observe</small></div>
          <div className="data-note note-a"><b>2.4×</b><small>signal resolution</small></div><div className="data-note note-b"><b>12</b><small>active studies</small></div>
        </div>
      </section>

      <section className="signal-strip" aria-label="Lab highlights"><span>Systems biology</span><i /><span>Spatial dynamics</span><i /><span>Open science</span><i /><span>Human health</span></section>

      <section className="section research" id="research">
        <div className="section-heading">
          <div><p className="section-number">01 — Research</p><h2>Questions that move<br />between scales.</h2></div><p>{content.pages.research}</p>
        </div>
        <div className="research-grid">
          {content.research.map((item, index) => (
            <article className="research-card" key={item.title}>
              <div className={`research-art art-${index + 1}`} aria-hidden="true"><span /><span /><span /></div>
              <p className="card-index">0{index + 1}</p><h3>{item.title}</h3><p>{item.description}</p>
              <a href="#publications" aria-label={`Read work about ${item.title}`}>Selected work <Arrow /></a>
            </article>
          ))}
        </div>
      </section>

      <section className="section people" id="people">
        <div className="section-heading compact">
          <div><p className="section-number">02 — People</p><h2>Curious minds,<br />shared momentum.</h2></div><p>{content.pages.people}</p>
        </div>
        <div className="people-grid">
          {content.members.map((member, index) => (
            <article className="person-card" key={member.slug}>
              <div className="portrait-wrap"><img src={member.photo} alt={`${member.name}, ${member.role}`} /><span>0{index + 1}</span></div>
              <h3>{member.name}</h3><p className="role">{member.role}</p><p className="bio">{member.bio}</p>
              {member.email && <a href={`mailto:${member.email}`}>{member.email} <Arrow /></a>}
            </article>
          ))}
        </div>
      </section>

      <section className="section publications" id="publications">
        <div className="section-heading compact">
          <div><p className="section-number">03 — Selected publications</p><h2>Recent work.</h2></div><p>Representative papers from the lab. Replace these entries in <code>content/publications.json</code>.</p>
        </div>
        <div className="publication-list">
          {content.publications.map((publication) => (
            <article key={publication.title}><p>{publication.year} <span>{publication.journal}</span></p><h3>{publication.title}</h3><a href={publication.url || "#"} aria-label={`Open ${publication.title}`}><Arrow /></a></article>
          ))}
        </div>
      </section>

      <section className="join" id="join">
        <p className="section-number">04 — Join us</p><div><h2>Bring your questions.<br /><em>Build the answer with us.</em></h2><p>{content.pages.join}</p><a className="button light" href={`mailto:${content.lab.email}`}>Start a conversation <Arrow /></a></div>
      </section>

      <footer>
        <div className="brand footer-brand"><span className="brand-mark" aria-hidden="true"><i /><i /><i /></span><span>{content.lab.name}</span></div>
        <p>{content.lab.location}<br /><a href={`mailto:${content.lab.email}`}>{content.lab.email}</a></p>
        <p className="edit-note">Built to be edited from simple files.<br />© {new Date().getFullYear()} {content.lab.shortName}</p>
      </footer>
    </main>
  );
}
