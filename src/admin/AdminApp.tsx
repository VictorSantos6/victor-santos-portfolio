import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Eye,
  EyeOff,
  FileUp,
  LogOut,
  Plus,
  Rocket,
  Save,
  Trash2,
} from 'lucide-react'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import App from '../App'
import { defaultPortfolio } from '../data/portfolio'
import { validatePortfolio, type ValidationErrors } from '../data/validation'
import type { Certification, Experience, PortfolioContent, PortfolioRevision, Project, SkillGroup } from '../types'
import './AdminApp.css'

type Section = 'general' | 'education' | 'certifications' | 'skills' | 'experience' | 'projects' | 'contact'

const sections: Array<{ id: Section; label: string }> = [
  { id: 'general', label: 'General' },
  { id: 'education', label: 'Education' },
  { id: 'certifications', label: 'Certifications' },
  { id: 'skills', label: 'Skills' },
  { id: 'experience', label: 'Experience' },
  { id: 'projects', label: 'Projects' },
  { id: 'contact', label: 'Contact & résumé' },
]

interface ApiError extends Error {
  errors?: ValidationErrors
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    credentials: 'same-origin',
    ...init,
    headers: {
      ...(init?.body && typeof init.body === 'string' ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  })
  const payload = await response.json().catch(() => ({})) as { error?: string; errors?: ValidationErrors }
  if (!response.ok) {
    const error = new Error(payload.error || 'Something went wrong. Please try again.') as ApiError
    error.errors = payload.errors
    throw error
  }
  return payload as T
}

function navigate(path: string) {
  window.history.pushState(null, '', path)
  window.dispatchEvent(new Event('portfolio:navigate'))
}

function clone<T>(value: T): T {
  return structuredClone(value)
}

function slug(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `item-${Date.now()}`
}

interface FieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  multiline?: boolean
  type?: 'text' | 'email' | 'url'
  helper?: string
}

function Field({ label, value, onChange, error, multiline = false, type = 'text', helper }: FieldProps) {
  const reactId = useId()
  const id = `field-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${reactId.replace(/:/g, '')}`
  const control = multiline ? (
    <textarea id={id} value={value} onChange={(event) => onChange(event.target.value)} aria-invalid={Boolean(error)} aria-describedby={error || helper ? `${id}-help` : undefined} rows={4} />
  ) : (
    <input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} aria-invalid={Boolean(error)} aria-describedby={error || helper ? `${id}-help` : undefined} />
  )
  return (
    <label className="admin-field" htmlFor={id}>
      <span>{label}</span>
      {control}
      {(error || helper) && <small id={`${id}-help`} className={error ? 'field-error' : undefined}>{error || helper}</small>}
    </label>
  )
}

interface ListActionsProps {
  index: number
  length: number
  onMove: (from: number, to: number) => void
  onRemove: () => void
  name: string
}

function ListActions({ index, length, onMove, onRemove, name }: ListActionsProps) {
  return (
    <div className="item-actions">
      <button type="button" onClick={() => onMove(index, index - 1)} disabled={index === 0} aria-label={`Move ${name} up`}><ArrowUp size={17} /></button>
      <button type="button" onClick={() => onMove(index, index + 1)} disabled={index === length - 1} aria-label={`Move ${name} down`}><ArrowDown size={17} /></button>
      <button className="danger-icon" type="button" onClick={onRemove} aria-label={`Delete ${name}`}><Trash2 size={17} /></button>
    </div>
  )
}

interface TextListProps {
  label: string
  values: string[]
  onChange: (values: string[]) => void
  errors: ValidationErrors
  path: string
  addLabel: string
}

function TextList({ label, values, onChange, errors, path, addLabel }: TextListProps) {
  const move = (from: number, to: number) => {
    if (to < 0 || to >= values.length) return
    const next = [...values]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    onChange(next)
  }
  return (
    <fieldset className="text-list">
      <legend>{label}</legend>
      {values.map((value, index) => (
        <div className="text-list-row" key={`${path}-${index}`}>
          <Field label={`${label} ${index + 1}`} value={value} onChange={(entry) => onChange(values.map((item, itemIndex) => itemIndex === index ? entry : item))} error={errors[`${path}.${index}`]} />
          <ListActions index={index} length={values.length} onMove={move} onRemove={() => onChange(values.filter((_, itemIndex) => itemIndex !== index))} name={`${label} ${index + 1}`} />
        </div>
      ))}
      <button className="secondary-button compact" type="button" onClick={() => onChange([...values, ''])}><Plus size={16} /> {addLabel}</button>
    </fieldset>
  )
}

function Login({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => inputRef.current?.focus(), [])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await api('/api/admin/login', { method: 'POST', body: JSON.stringify({ password }) })
      onAuthenticated()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to sign in.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="admin-login">
      <button className="back-link" type="button" onClick={() => navigate('/')}><ArrowLeft size={18} /> Back to portfolio</button>
      <form className="login-card" onSubmit={submit}>
        <div className="admin-brand">VS</div>
        <p className="admin-eyebrow">Private controls</p>
        <h1>Portfolio admin</h1>
        <p>Enter the administrator password to edit the private draft.</p>
        <label className="admin-field" htmlFor="admin-password">
          <span>Password</span>
          <span className="password-control">
            <input ref={inputRef} id="admin-password" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required />
            <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
          </span>
        </label>
        {error && <p className="admin-alert error" role="alert">{error}</p>}
        <button className="primary-admin-button" type="submit" disabled={busy || !password}>{busy ? 'Checking…' : 'Unlock editor'}</button>
      </form>
    </main>
  )
}

export default function AdminApp() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null)
  const [revision, setRevision] = useState<PortfolioRevision | null>(null)
  const [draft, setDraft] = useState<PortfolioContent | null>(null)
  const [baseline, setBaseline] = useState<PortfolioContent | null>(null)
  const [activeSection, setActiveSection] = useState<Section>('general')
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [notice, setNotice] = useState('')
  const [problem, setProblem] = useState('')
  const [busy, setBusy] = useState(false)
  const [preview, setPreview] = useState(false)

  const dirty = useMemo(() => Boolean(draft && baseline && JSON.stringify(draft) !== JSON.stringify(baseline)), [draft, baseline])

  const loadDraft = async () => {
    setBusy(true)
    setProblem('')
    try {
      const result = await api<{ revision: PortfolioRevision }>('/api/admin/draft')
      setRevision(result.revision)
      setDraft(clone(result.revision.content))
      setBaseline(clone(result.revision.content))
      setAuthenticated(true)
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'Unable to load the draft.'
      if (message.toLowerCase().includes('sign in')) setAuthenticated(false)
      else setProblem(message)
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    api<{ authenticated: boolean }>('/api/admin/session')
      .then((result) => result.authenticated ? loadDraft() : setAuthenticated(false))
      .catch(() => setAuthenticated(false))
  }, [])

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!dirty) return
      event.preventDefault()
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  if (authenticated === null) return <main className="admin-loading" aria-live="polite">Opening private controls…</main>
  if (!authenticated) return <Login onAuthenticated={loadDraft} />
  if (preview && draft) return <App initialContent={draft} loadPublished={false} preview onExitPreview={() => setPreview(false)} />

  const update = (mutate: (content: PortfolioContent) => void) => {
    if (!draft) return
    const next = clone(draft)
    mutate(next)
    setDraft(next)
    setNotice('')
  }

  const move = <T,>(items: T[], from: number, to: number): T[] => {
    if (to < 0 || to >= items.length) return items
    const next = [...items]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    return next
  }

  const save = async (): Promise<boolean> => {
    if (!draft) return false
    const nextErrors = validatePortfolio(draft)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      setProblem('Review the highlighted fields before saving.')
      return false
    }
    setBusy(true)
    setProblem('')
    try {
      const result = await api<{ revision: PortfolioRevision }>('/api/admin/draft', { method: 'PUT', body: JSON.stringify(draft) })
      setRevision(result.revision)
      setDraft(clone(result.revision.content))
      setBaseline(clone(result.revision.content))
      setNotice('Draft saved.')
      return true
    } catch (reason) {
      const apiError = reason as ApiError
      if (apiError.errors) setErrors(apiError.errors)
      setProblem(reason instanceof Error ? reason.message : 'Unable to save the draft.')
      return false
    } finally {
      setBusy(false)
    }
  }

  const showPreview = async () => {
    if (dirty && !await save()) return
    setPreview(true)
    window.scrollTo(0, 0)
  }

  const publish = async () => {
    if (!draft || !window.confirm('Publish this complete draft to the public portfolio?')) return
    if (dirty && !await save()) return
    setBusy(true)
    setProblem('')
    try {
      const result = await api<{ revision: PortfolioRevision }>('/api/admin/publish', { method: 'POST', body: '{}' })
      setRevision(result.revision)
      setDraft(clone(result.revision.content))
      setBaseline(clone(result.revision.content))
      setNotice('Published. The public portfolio now uses this revision.')
    } catch (reason) {
      setProblem(reason instanceof Error ? reason.message : 'Unable to publish the draft.')
    } finally {
      setBusy(false)
    }
  }

  const logout = async () => {
    if (dirty && !window.confirm('Log out and discard your unsaved browser changes?')) return
    await api('/api/admin/logout', { method: 'POST', body: '{}' }).catch(() => undefined)
    setAuthenticated(false)
    setDraft(null)
  }

  const uploadResume = async (file?: File) => {
    if (!file) return
    setBusy(true)
    setProblem('')
    try {
      const result = await api<{ revision: PortfolioRevision }>('/api/admin/resume', {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type || 'application/pdf', 'X-File-Name': file.name },
      })
      setRevision(result.revision)
      setDraft(clone(result.revision.content))
      setBaseline(clone(result.revision.content))
      setNotice('Résumé uploaded to the draft. Publish when you are ready.')
    } catch (reason) {
      setProblem(reason instanceof Error ? reason.message : 'Unable to upload the résumé.')
    } finally {
      setBusy(false)
    }
  }

  const uploadCertificationImage = async (certificationId: string, file?: File) => {
    if (!file) return
    if (dirty && !await save()) return
    setBusy(true)
    setProblem('')
    try {
      const result = await api<{ revision: PortfolioRevision }>(`/api/admin/certification-image?id=${encodeURIComponent(certificationId)}`, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type, 'X-File-Name': file.name },
      })
      setRevision(result.revision)
      setDraft(clone(result.revision.content))
      setBaseline(clone(result.revision.content))
      setNotice('Certificate image uploaded to the draft. Publish when you are ready.')
    } catch (reason) {
      setProblem(reason instanceof Error ? reason.message : 'Unable to upload the certificate image.')
    } finally {
      setBusy(false)
    }
  }

  if (!draft) {
    return <main className="admin-loading"><p>{problem || 'Loading the editor…'}</p>{problem && <button className="secondary-button" type="button" onClick={loadDraft}>Try again</button>}</main>
  }

  const addExperience = () => update((content) => content.experiences.push({
    id: slug(`experience-${content.experiences.length + 1}`), organization: 'New organization', role: 'Role', location: 'Location', period: 'Dates', eyebrow: 'Area of work', summary: 'Describe the work and your contribution.', highlights: ['Add a measurable highlight.'],
  }))
  const addProject = () => update((content) => content.projects.push({
    id: slug(`project-${content.projects.length + 1}`), name: 'New project', period: 'Dates', stack: ['Technology'], signal: `${String(content.projects.length + 1).padStart(2, '0')} / PROJECT`, problem: 'Describe the problem.', contribution: 'Describe what you built.', outcomes: ['Add an outcome.'], accent: 'cyan',
  }))
  const addCertification = () => update((content) => content.certifications.push({
    id: slug(`certification-${content.certifications.length + 1}`), name: 'New certification', issuer: 'Issuing organization', issued: 'Issue date', detail: 'Certification details', credentialId: 'Credential ID', verificationUrl: 'https://example.com/verify', imageKey: null, imageName: 'certificate.webp',
  }))

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <button className="admin-home" type="button" onClick={() => navigate('/')} aria-label="Back to public portfolio"><span>VS</span><span><strong>Portfolio admin</strong><small>Private draft workspace</small></span></button>
        <div className="admin-header-actions">
          <button className="secondary-button" type="button" onClick={showPreview} disabled={busy}><Eye size={17} /> Preview draft</button>
          <button className="secondary-button" type="button" onClick={logout}><LogOut size={17} /> Log out</button>
        </div>
      </header>

      <aside className="admin-sidebar" aria-label="Editor sections">
        <p>Content</p>
        <nav>
          {sections.map((section) => <button type="button" key={section.id} className={activeSection === section.id ? 'active' : ''} aria-current={activeSection === section.id ? 'page' : undefined} onClick={() => setActiveSection(section.id)}>{section.label}</button>)}
        </nav>
        <div className="revision-note"><span>Draft revision</span><strong>#{revision?.id ?? '—'}</strong><small>{revision?.updatedAt ? `Saved ${new Date(revision.updatedAt).toLocaleString()}` : 'Not saved yet'}</small></div>
      </aside>

      <main className="admin-main" id="admin-main">
        <div className="admin-page-heading">
          <div><p className="admin-eyebrow">Portfolio content</p><h1>{sections.find((section) => section.id === activeSection)?.label}</h1></div>
          <span className={`draft-state ${dirty ? 'dirty' : ''}`}>{dirty ? 'Unsaved changes' : 'Draft saved'}</span>
        </div>

        {(problem || notice) && <div className={`admin-alert ${problem ? 'error' : 'success'}`} role={problem ? 'alert' : 'status'}>{problem || notice}</div>}

        {activeSection === 'general' && (
          <section className="editor-panel" aria-labelledby="general-title">
            <div className="panel-heading"><div><h2 id="general-title">Identity and introduction</h2><p>The primary story shown in the first viewport.</p></div></div>
            <div className="field-grid two-column">
              <Field label="Name" value={draft.identity.name} onChange={(value) => update((content) => { content.identity.name = value })} error={errors['identity.name']} />
              <Field label="Role" value={draft.identity.role} onChange={(value) => update((content) => { content.identity.role = value })} error={errors['identity.role']} />
              <Field label="Intro kicker" value={draft.identity.kicker} onChange={(value) => update((content) => { content.identity.kicker = value })} error={errors['identity.kicker']} />
              <Field label="Location" value={draft.identity.location} onChange={(value) => update((content) => { content.identity.location = value })} error={errors['identity.location']} />
              <Field label="Headline line 1" value={draft.identity.headlineLead} onChange={(value) => update((content) => { content.identity.headlineLead = value })} error={errors['identity.headlineLead']} />
              <Field label="Headline line 2" value={draft.identity.headlineMiddle} onChange={(value) => update((content) => { content.identity.headlineMiddle = value })} error={errors['identity.headlineMiddle']} />
              <Field label="Headline emphasis" value={draft.identity.headlineEmphasis} onChange={(value) => update((content) => { content.identity.headlineEmphasis = value })} error={errors['identity.headlineEmphasis']} />
            </div>
            <Field label="Hero summary" value={draft.identity.summary} onChange={(value) => update((content) => { content.identity.summary = value })} error={errors['identity.summary']} multiline />
            <div className="admin-subsection">
              <div>
                <h3>Hero status card</h3>
                <p>Edit the short updates shown in the “Currently” card beside the hero.</p>
              </div>
              <div className="field-grid two-column">
                <Field label="Working on" value={draft.identity.building} onChange={(value) => update((content) => { content.identity.building = value })} error={errors['identity.building']} helper="Replaces the current “LiDRON research and MiUni features” text." />
                <Field label="Looking for" value={draft.identity.status} onChange={(value) => update((content) => { content.identity.status = value })} error={errors['identity.status']} helper="Controls the availability line beneath Working on." />
              </div>
            </div>
          </section>
        )}

        {activeSection === 'education' && (
          <section className="editor-panel" aria-labelledby="education-title">
            <div className="panel-heading"><div><h2 id="education-title">Education</h2><p>School details and the ordered coursework list.</p></div></div>
            <div className="field-grid two-column">
              {(['institution', 'location', 'degree', 'graduation', 'gpa'] as const).map((key) => <Field key={key} label={key[0].toUpperCase() + key.slice(1)} value={draft.education[key]} onChange={(value) => update((content) => { content.education[key] = value })} error={errors[`education.${key}`]} />)}
            </div>
            <TextList label="Coursework" values={draft.education.coursework} onChange={(values) => update((content) => { content.education.coursework = values })} errors={errors} path="education.coursework" addLabel="Add course" />
          </section>
        )}

        {activeSection === 'skills' && (
          <section className="editor-panel" aria-labelledby="skills-title">
            <div className="panel-heading"><div><h2 id="skills-title">Skill groups</h2><p>Group related tools and reorder them without dragging.</p></div><button className="secondary-button compact" type="button" onClick={() => update((content) => content.skillGroups.push({ label: 'New group', skills: ['New skill'] }))}><Plus size={16} /> Add group</button></div>
            <div className="editor-stack">
              {draft.skillGroups.map((group: SkillGroup, index) => (
                <article className="editor-card" key={`skill-${index}`}>
                  <div className="card-toolbar"><h3>{group.label || `Group ${index + 1}`}</h3><ListActions index={index} length={draft.skillGroups.length} onMove={(from, to) => update((content) => { content.skillGroups = move(content.skillGroups, from, to) })} onRemove={() => window.confirm('Delete this skill group from the draft?') && update((content) => { content.skillGroups.splice(index, 1) })} name={group.label || `group ${index + 1}`} /></div>
                  <Field label="Group label" value={group.label} onChange={(value) => update((content) => { content.skillGroups[index].label = value })} error={errors[`skillGroups.${index}.label`]} />
                  <TextList label="Skills" values={group.skills} onChange={(values) => update((content) => { content.skillGroups[index].skills = values })} errors={errors} path={`skillGroups.${index}.skills`} addLabel="Add skill" />
                </article>
              ))}
            </div>
          </section>
        )}

        {activeSection === 'certifications' && (
          <section className="editor-panel" aria-labelledby="certifications-editor-title">
            <div className="panel-heading"><div><h2 id="certifications-editor-title">Certifications</h2><p>Add, edit, reorder, and attach verification details for completed certifications.</p></div><button className="secondary-button compact" type="button" onClick={addCertification}><Plus size={16} /> Add certification</button></div>
            <div className="editor-stack">
              {draft.certifications.map((certification: Certification, index) => (
                <article className="editor-card" key={`${certification.id}-${index}`}>
                  <div className="card-toolbar"><div><span className="card-index">{String(index + 1).padStart(2, '0')}</span><h3>{certification.name}</h3></div><ListActions index={index} length={draft.certifications.length} onMove={(from, to) => update((content) => { content.certifications = move(content.certifications, from, to) })} onRemove={() => window.confirm('Delete this certification from the draft?') && update((content) => { content.certifications.splice(index, 1) })} name={certification.name} /></div>
                  <div className="certificate-admin-preview">
                    {(certification.imageKey || certification.id === 'responsible-conduct-research-engineers') && <img src={`/api/admin/certification-image?id=${encodeURIComponent(certification.id)}&revision=${revision?.updatedAt ?? ''}`} alt={`${certification.name} certificate preview`} />}
                    <div><p className="admin-eyebrow">Certificate image</p><strong>{certification.imageName}</strong><small>WEBP, PNG, or JPEG · 10 MB maximum</small><label className={`secondary-button compact ${busy ? 'disabled' : ''}`}><FileUp size={16} /> Replace image<input type="file" accept="image/webp,image/png,image/jpeg,.webp,.png,.jpg,.jpeg" disabled={busy} onChange={(event) => uploadCertificationImage(certification.id, event.target.files?.[0])} /></label></div>
                  </div>
                  <div className="field-grid two-column">
                    <Field label="ID / URL slug" value={certification.id} onChange={(value) => update((content) => { content.certifications[index].id = value })} error={errors[`certifications.${index}.id`]} />
                    <Field label="Name" value={certification.name} onChange={(value) => update((content) => { content.certifications[index].name = value })} error={errors[`certifications.${index}.name`]} />
                    <Field label="Issuer" value={certification.issuer} onChange={(value) => update((content) => { content.certifications[index].issuer = value })} error={errors[`certifications.${index}.issuer`]} />
                    <Field label="Issued" value={certification.issued} onChange={(value) => update((content) => { content.certifications[index].issued = value })} error={errors[`certifications.${index}.issued`]} />
                    <Field label="Credential ID" value={certification.credentialId} onChange={(value) => update((content) => { content.certifications[index].credentialId = value })} error={errors[`certifications.${index}.credentialId`]} />
                    <Field label="Verification URL" type="url" value={certification.verificationUrl} onChange={(value) => update((content) => { content.certifications[index].verificationUrl = value })} error={errors[`certifications.${index}.verificationUrl`]} />
                  </div>
                  <Field label="Details" value={certification.detail} onChange={(value) => update((content) => { content.certifications[index].detail = value })} error={errors[`certifications.${index}.detail`]} multiline />
                </article>
              ))}
              {!draft.certifications.length && <p className="empty-editor-state">No certifications in this draft.</p>}
            </div>
          </section>
        )}

        {activeSection === 'experience' && (
          <section className="editor-panel" aria-labelledby="experience-editor-title">
            <div className="panel-heading"><div><h2 id="experience-editor-title">Experience</h2><p>Add roles, order them, and describe measurable work.</p></div><button className="secondary-button compact" type="button" onClick={addExperience}><Plus size={16} /> Add experience</button></div>
            <Field label="Section introduction" value={draft.experienceIntro} onChange={(value) => update((content) => { content.experienceIntro = value })} error={errors.experienceIntro} multiline />
            <div className="editor-stack">
              {draft.experiences.map((experience: Experience, index) => (
                <article className="editor-card" key={`${experience.id}-${index}`}>
                  <div className="card-toolbar"><div><span className="card-index">{String(index + 1).padStart(2, '0')}</span><h3>{experience.organization}</h3></div><ListActions index={index} length={draft.experiences.length} onMove={(from, to) => update((content) => { content.experiences = move(content.experiences, from, to) })} onRemove={() => window.confirm('Delete this experience from the draft?') && update((content) => { content.experiences.splice(index, 1) })} name={experience.organization} /></div>
                  <div className="field-grid two-column">
                    {(['id', 'organization', 'role', 'location', 'period', 'eyebrow'] as const).map((key) => <Field key={key} label={key === 'id' ? 'ID / URL slug' : key[0].toUpperCase() + key.slice(1)} value={String(experience[key])} onChange={(value) => update((content) => { content.experiences[index][key] = value })} error={errors[`experiences.${index}.${key}`]} />)}
                  </div>
                  <Field label="Summary" value={experience.summary} onChange={(value) => update((content) => { content.experiences[index].summary = value })} error={errors[`experiences.${index}.summary`]} multiline />
                  <TextList label="Highlights" values={experience.highlights} onChange={(values) => update((content) => { content.experiences[index].highlights = values })} errors={errors} path={`experiences.${index}.highlights`} addLabel="Add highlight" />
                  <label className="check-field"><input type="checkbox" checked={Boolean(experience.featured)} onChange={(event) => update((content) => { content.experiences[index].featured = event.target.checked; if (event.target.checked && !content.experiences[index].impact) content.experiences[index].impact = [{ value: '100%', label: 'impact' }] })} /><span>Show featured impact metrics</span></label>
                  {experience.featured && <div className="impact-editor">{(experience.impact ?? []).map((impact, impactIndex) => <div className="field-grid impact-row" key={`impact-${impactIndex}`}><Field label="Impact value" value={impact.value} onChange={(value) => update((content) => { content.experiences[index].impact![impactIndex].value = value })} error={errors[`experiences.${index}.impact.${impactIndex}.value`]} /><Field label="Impact label" value={impact.label} onChange={(value) => update((content) => { content.experiences[index].impact![impactIndex].label = value })} error={errors[`experiences.${index}.impact.${impactIndex}.label`]} /><button className="danger-icon" type="button" onClick={() => update((content) => { content.experiences[index].impact!.splice(impactIndex, 1) })} aria-label={`Delete impact ${impactIndex + 1}`}><Trash2 size={17} /></button></div>)}<button className="secondary-button compact" type="button" onClick={() => update((content) => { (content.experiences[index].impact ??= []).push({ value: '', label: '' }) })}><Plus size={16} /> Add impact</button></div>}
                </article>
              ))}
            </div>
          </section>
        )}

        {activeSection === 'projects' && (
          <section className="editor-panel" aria-labelledby="projects-editor-title">
            <div className="panel-heading"><div><h2 id="projects-editor-title">Projects</h2><p>Manage the project cards and their detailed case studies.</p></div><button className="secondary-button compact" type="button" onClick={addProject}><Plus size={16} /> Add project</button></div>
            <Field label="Section introduction" value={draft.projectsIntro} onChange={(value) => update((content) => { content.projectsIntro = value })} error={errors.projectsIntro} multiline />
            <div className="editor-stack">
              {draft.projects.map((project: Project, index) => (
                <article className="editor-card" key={`${project.id}-${index}`}>
                  <div className="card-toolbar"><div><span className="card-index">{String(index + 1).padStart(2, '0')}</span><h3>{project.name}</h3></div><ListActions index={index} length={draft.projects.length} onMove={(from, to) => update((content) => { content.projects = move(content.projects, from, to) })} onRemove={() => window.confirm('Delete this project from the draft?') && update((content) => { content.projects.splice(index, 1) })} name={project.name} /></div>
                  <div className="field-grid two-column">
                    {(['id', 'name', 'period', 'signal'] as const).map((key) => <Field key={key} label={key === 'id' ? 'ID / URL slug' : key[0].toUpperCase() + key.slice(1)} value={project[key]} onChange={(value) => update((content) => { content.projects[index][key] = value })} error={errors[`projects.${index}.${key}`]} />)}
                    <label className="admin-field"><span>Accent</span><select value={project.accent} onChange={(event) => update((content) => { content.projects[index].accent = event.target.value as Project['accent'] })}>{['cyan', 'blue', 'amber', 'violet'].map((accent) => <option key={accent} value={accent}>{accent[0].toUpperCase() + accent.slice(1)}</option>)}</select></label>
                  </div>
                  <TextList label="Technology" values={project.stack} onChange={(values) => update((content) => { content.projects[index].stack = values })} errors={errors} path={`projects.${index}.stack`} addLabel="Add technology" />
                  <Field label="Problem" value={project.problem} onChange={(value) => update((content) => { content.projects[index].problem = value })} error={errors[`projects.${index}.problem`]} multiline />
                  <Field label="Contribution" value={project.contribution} onChange={(value) => update((content) => { content.projects[index].contribution = value })} error={errors[`projects.${index}.contribution`]} multiline />
                  <TextList label="Outcome" values={project.outcomes} onChange={(values) => update((content) => { content.projects[index].outcomes = values })} errors={errors} path={`projects.${index}.outcomes`} addLabel="Add outcome" />
                </article>
              ))}
            </div>
          </section>
        )}

        {activeSection === 'contact' && (
          <section className="editor-panel" aria-labelledby="contact-editor-title">
            <div className="panel-heading"><div><h2 id="contact-editor-title">Contact and résumé</h2><p>Public contact details and the PDF attached to the résumé button.</p></div></div>
            <div className="field-grid two-column"><Field label="Email" type="email" value={draft.contact.email} onChange={(value) => update((content) => { content.contact.email = value })} error={errors['contact.email']} /><Field label="LinkedIn URL" type="url" value={draft.contact.linkedin} onChange={(value) => update((content) => { content.contact.linkedin = value })} error={errors['contact.linkedin']} /><Field label="GitHub URL" type="url" value={draft.contact.github ?? defaultPortfolio.contact.github ?? ''} onChange={(value) => update((content) => { content.contact.github = value })} error={errors['contact.github']} /></div>
            <Field label="Contact introduction" value={draft.contact.intro} onChange={(value) => update((content) => { content.contact.intro = value })} error={errors['contact.intro']} multiline />
            <div className="resume-panel"><div><p className="admin-eyebrow">Draft résumé</p><strong>{draft.contact.resumeName}</strong><small>{draft.contact.resumeKey ? 'Stored securely and ready to publish.' : 'Using the résumé bundled with the site.'}</small></div><label className={`secondary-button ${busy ? 'disabled' : ''}`}><FileUp size={17} /> Replace PDF<input type="file" accept="application/pdf,.pdf" disabled={busy} onChange={(event) => uploadResume(event.target.files?.[0])} /></label></div>
          </section>
        )}
      </main>

      <footer className="admin-action-bar">
        <div aria-live="polite">{dirty ? 'You have unsaved changes.' : notice || 'All changes are saved to the private draft.'}</div>
        <div><button className="secondary-button" type="button" onClick={save} disabled={busy || !dirty}><Save size={17} /> {busy ? 'Working…' : 'Save draft'}</button><button className="primary-admin-button" type="button" onClick={publish} disabled={busy}><Rocket size={17} /> Publish portfolio</button></div>
      </footer>
    </div>
  )
}
