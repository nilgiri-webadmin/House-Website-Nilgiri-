import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, ExternalLink, Leaf, Waves, Mail, User, Phone, Calendar, Clock, HelpCircle, Check } from 'lucide-react';
import client from '../api/client';
import { getCommunityFormUrl } from '../data/communityForms';
import './JoinPage.css';

const TARGET_STEPS = 3;

const getInitialValue = (field) => field.type === 'checkboxes' ? [] : '';

const chunkFields = (fields) => {
  if (!fields || fields.length === 0) return [[]];
  const totalFields = fields.length;
  const fieldsPerStep = Math.max(1, Math.ceil(totalFields / TARGET_STEPS));
  const chunks = [];
  for (let index = 0; index < totalFields; index += fieldsPerStep) {
    chunks.push(fields.slice(index, index + fieldsPerStep));
  }
  // Ensure we don't have more than TARGET_STEPS chunks
  if (chunks.length > TARGET_STEPS) {
    // Redistribute last chunk into previous ones
    const lastChunk = chunks.pop();
    chunks[chunks.length - 1] = [...chunks[chunks.length - 1], ...lastChunk];
  }
  return chunks;
};

const NotFoundJoin = () => (
  <main className="join-page join-page-404">
    <div className="join-bg" />
    <section className="join-locked-panel">
      <span className="join-kicker">404</span>
      <h1>Join Trail Not Found</h1>
      <p>
        Community forms open only from a Join Community button. Return to the communities
        page and choose the community you want to join.
      </p>
      <Link to="/community" className="join-back-link">
        <ArrowLeft size={16} />
        Back to Communities
      </Link>
    </section>
  </main>
);

/* ---------- Step progress ---------- */
const StepProgress = ({ total, current }) => {
  if (total <= 1) return null;
  return (
    <div className="join-progress" role="progressbar" aria-valuenow={current + 1} aria-valuemin={1} aria-valuemax={total}>
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} className={`join-progress-seg ${i <= current ? 'filled' : ''} ${i === current ? 'active' : ''}`} />
      ))}
      <span className="join-progress-label">Section {current + 1} of {total}</span>
    </div>
  );
};

/* ---------- Text / textarea / select inputs ---------- */
const GlassInput = ({ icon, type = "text", placeholder, value, onChange, onBlur, onFocus, required }) => {
  const [isFocused, setIsFocused] = useState(false);
  const isActive = isFocused || (value && value.length > 0);

  const handleFocus = (e) => { setIsFocused(true); onFocus?.(e); };
  const handleBlur = (e) => { setIsFocused(false); onBlur?.(e); };

  return (
    <div className="join-glass-input">
      <div className="join-input-wrapper">
        <div className="join-input-icon-area">{icon}</div>
        <div className="join-input-inner">
          <label className={`join-floating-label ${isActive ? 'active' : ''}`}>
            {placeholder}{required && <span className="required">*</span>}
          </label>
          <input 
            type={type} 
            value={value || ''} 
            onChange={(e) => onChange(e.target.value)} 
            onFocus={handleFocus} 
            onBlur={handleBlur} 
            autoComplete="off" 
            className="join-input" 
            placeholder={placeholder}
          />
        </div>
      </div>
      <div className="join-input-line"><div className={`join-input-line-fill ${isActive ? 'filled' : ''}`} /></div>
    </div>
  );
};

const GlassTextarea = ({ icon, placeholder, value, onChange, onBlur, onFocus, required, rows = 4 }) => {
  const [isFocused, setIsFocused] = useState(false);
  const isActive = isFocused || (value && value.length > 0);

  const handleFocus = (e) => { setIsFocused(true); onFocus?.(e); };
  const handleBlur = (e) => { setIsFocused(false); onBlur?.(e); };

  return (
    <div className="join-glass-input join-glass-textarea">
      <div className="join-input-wrapper">
        <div className="join-input-icon-area">{icon}</div>
        <div className="join-input-inner join-textarea-inner">
          <label className={`join-floating-label ${isActive ? 'active' : ''}`}>
            {placeholder}{required && <span className="required">*</span>}
          </label>
          <textarea value={value || ''} onChange={(e) => onChange(e.target.value)} onFocus={handleFocus} onBlur={handleBlur} rows={rows} className="join-input join-textarea" placeholder=" " />
        </div>
      </div>
      <div className="join-input-line"><div className={`join-input-line-fill ${isActive ? 'filled' : ''}`} /></div>
    </div>
  );
};

const GlassSelect = ({ icon, field, value, onChange, onBlur, onFocus, required }) => {
  const [isFocused, setIsFocused] = useState(false);
  const isActive = isFocused || (value && value.length > 0);
  const handleFocus = (e) => { setIsFocused(true); onFocus?.(e); };
  const handleBlur = (e) => { setIsFocused(false); onBlur?.(e); };
  return (
    <div className={`join-glass-input ${isFocused ? 'focused' : ''}`}>
      <div className="join-input-wrapper">
        <div className="join-input-icon-area">{icon}</div>
        <div className="join-input-inner">
          <label className={`join-floating-label ${isActive ? 'active' : ''}`}>{field.title}{required && <span className="required">*</span>}</label>
          <select value={value || ''} onChange={(e) => onChange(e.target.value)} onFocus={handleFocus} onBlur={handleBlur} className="join-input join-select">
            <option value="">Choose an option</option>
            {field.options.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </div>
      </div>
      <div className="join-input-line"><div className={`join-input-line-fill ${isActive ? 'filled' : ''}`} /></div>
    </div>
  );
};

/* ---------- Card-grid option groups (radio + checkbox) ---------- */
const GlassRadioGroup = ({ field, value, onChange, required }) => (
  <div className="join-glass-radio-group">
    <label className="join-field-label">{field.title}{required && <span className="required">*</span>}</label>
    <div className="join-option-grid">
      {field.options.map((option) => {
        const selected = value === option;
        return (
          <label key={option} className={`join-option-card join-option-radio ${selected ? 'selected' : ''}`}>
            <input type="radio" name={field.entryId} value={option} checked={selected} required={required} onChange={(e) => onChange(e.target.value)} className="join-option-input" />
            <span className="join-option-marker join-marker-radio"><span className="join-radio-dot" /></span>
            <span className="join-option-text">{option}</span>
          </label>
        );
      })}
    </div>
  </div>
);

const GlassCheckboxGroup = ({ field, value, onChange, required }) => {
  const handleChange = (option) => {
    const current = Array.isArray(value) ? value : [];
    onChange(current.includes(option) ? current.filter(v => v !== option) : [...current, option]);
  };
  return (
    <div className="join-glass-checkbox-group">
      <label className="join-field-label">{field.title}{required && <span className="required">*</span>}</label>
      <div className="join-option-grid">
        {field.options.map((option) => {
          const checked = Array.isArray(value) && value.includes(option);
          return (
            <label key={option} className={`join-option-card join-option-checkbox ${checked ? 'selected' : ''}`}>
              <input type="checkbox" value={option} checked={checked} onChange={() => handleChange(option)} className="join-option-input" />
              <span className="join-option-marker join-marker-checkbox"><Check size={13} strokeWidth={3} className="join-checkbox-check" /></span>
              <span className="join-option-text">{option}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
};

const JoinPage = () => {
  const location = useLocation();
  const initialCommunity = location.state?.fromJoinButton ? location.state.community : null;
  const initialFormUrl = initialCommunity?.joining_form || getCommunityFormUrl(initialCommunity?.name);

  const [community, setCommunity] = useState(initialCommunity ? { ...initialCommunity, joining_form: initialFormUrl } : null);
  const [schema, setSchema] = useState(null);
  const [answers, setAnswers] = useState({});
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(Boolean(initialCommunity?.id));
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');

  useEffect(() => {
    let mounted = true;
    const fetchCommunity = async () => {
      if (!initialCommunity?.id) return;
      try {
        setLoading(true); setError('');
        const response = await client.get(`/communities/${initialCommunity.id}`);
        if (!mounted) return;
        const fetched = response.data?.community || response.data;
        const resolvedFormUrl = fetched?.joining_form || getCommunityFormUrl(fetched?.name);
        if (!resolvedFormUrl) { setError('This community is not accepting applications right now.'); return; }
        setCommunity({ id: fetched.id, name: fetched.name, description: fetched.description || '', image: fetched.image || initialCommunity.image || null, joining_form: resolvedFormUrl });
      } catch (err) { console.error('Failed to load join form:', err); if (mounted) setError('Unable to load this community form. Please try again from the communities page.'); }
      finally { if (mounted) setLoading(false); }
    };
    fetchCommunity(); return () => { mounted = false; };
  }, [initialCommunity?.id, initialCommunity?.image]);

  useEffect(() => {
    let mounted = true;
    const loadSchema = async () => {
      if (!community?.joining_form) return;
      try {
        setLoading(true); setError('');
        const response = await client.get('/google-forms/schema', { params: { formUrl: community.joining_form } });
        if (!mounted) return;
        const fields = response.data?.fields || [];
        setSchema(response.data);
        setAnswers(fields.reduce((acc, field) => ({ ...acc, [field.entryId]: getInitialValue(field) }), {}));
        setStep(0);
      } catch (err) { console.error('Failed to load Google Form schema:', err); if (mounted) setError('Unable to load the custom form. Use the backup link or try again later.'); }
      finally { if (mounted) setLoading(false); }
    };
    loadSchema(); return () => { mounted = false; };
  }, [community?.joining_form]);

  const steps = useMemo(() => {
    const result = chunkFields(schema?.fields || []);
    console.log('Steps:', result.length, 'chunks', result.map(c => c.length));
    return result;
  }, [schema?.fields]);
  const activeFields = steps[step] || [];
  const isLastStep = step >= steps.length - 1;

  if (!initialFormUrl) return <NotFoundJoin />;

  const updateAnswer = (entryId, value) => setAnswers(current => ({ ...current, [entryId]: value }));

  const getFieldIcon = (field) => {
    const t = field.title.toLowerCase();
    if (t.includes('email') || t.includes('mail')) return <Mail className="w-5 h-5" />;
    if (t.includes('name')) return <User className="w-5 h-5" />;
    if (t.includes('phone') || t.includes('mobile') || t.includes('contact') || t.includes('whatsapp')) return <Phone className="w-5 h-5" />;
    if (t.includes('date') || field.type === 'date') return <Calendar className="w-5 h-5" />;
    if (t.includes('time') || field.type === 'time') return <Clock className="w-5 h-5" />;
    return <HelpCircle className="w-5 h-5" />;
  };

  const validateFields = (fields) => {
    const missing = fields.find(f => !f.required ? false : (Array.isArray(answers[f.entryId]) ? answers[f.entryId].length === 0 : !String(answers[f.entryId] || '').trim()));
    if (missing) { setError(`Please fill: ${missing.title}`); return false; }
    setError(''); return true;
  };

  const handleNext = () => { if (!validateFields(activeFields)) return; setStep(c => Math.min(c + 1, steps.length - 1)); };
  const handleBack = () => { setError(''); setStep(c => Math.max(c - 1, 0)); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateFields(activeFields)) return;
    try {
      setSubmitting(true); setError('');
      const res = await client.post('/google-forms/submit', { formUrl: community.joining_form, answers });
      if (res.data?.confirmationMessage) setConfirmationMessage(res.data.confirmationMessage);
      setSubmitted(true);
    } catch (err) { console.error('Submit failed:', err); setError('Submission failed. Please check your answers and try again.'); }
    finally { setSubmitting(false); }
  };

  const communityName = community?.name || initialCommunity.name;
  const communityDesc = community?.description || initialCommunity.description;
  const communityImage = community?.image || initialCommunity.image || '/file.png';
  const backupLink = community?.joining_form || initialCommunity.joining_form;

  return (
    <main className="join-page">
      <div className="join-bg" />
      <section className="join-hero">
        <Link to="/community" className="join-back-link"><ArrowLeft size={16} /> Communities</Link>
        <div className="join-hero-centered">
          <div className="join-copy">
            <span className="join-kicker">Nilgiri Community Trail</span>
            <h1>{communityName}</h1>
            {communityDesc && <p>{communityDesc}</p>}
            <div className="join-signals">
              <span><Leaf size={15} /> Forest page</span>
              <span><Waves size={15} /> Form stays here</span>
              <span><CheckCircle2 size={15} /> Records go to Google Forms</span>
            </div>
          </div>
        </div>
      </section>

      <section className="join-form-section">
        <form className="join-form" onSubmit={handleSubmit}>
          <div className="join-form-header">
            <span>Application Path</span>
            <a href={backupLink} target="_blank" rel="noreferrer" className="join-backup-link">Backup link <ExternalLink size={13} /></a>
          </div>

          <StepProgress total={steps.length} current={step} />

          {loading ? <div className="join-loading">Loading the community form...</div> : error ? <div className="join-error">{error}</div> : null}

          {!loading && !submitted && (
            <div className="join-field-stack" key={step} data-step={step}>
              {activeFields.length === 0 ? (
                <div className="join-empty-step">No fields in this section</div>
              ) : (
                activeFields.map(field => {
                  const value = answers[field.entryId];
                  const icon = getFieldIcon(field);
                  const props = { field, value, onChange: v => updateAnswer(field.entryId, v), required: field.required };
                  return (
                    <div className="join-field-block" key={field.entryId}>
                      {field.type === 'paragraph' && <GlassTextarea icon={icon} {...props} />}
                      {field.type === 'multiple_choice' && <GlassRadioGroup {...props} />}
                      {field.type === 'checkboxes' && <GlassCheckboxGroup {...props} />}
                      {field.type === 'dropdown' && <GlassSelect icon={icon} {...props} />}
                      {!['paragraph', 'multiple_choice', 'checkboxes', 'dropdown'].includes(field.type) && (
                        <GlassInput icon={icon} type={field.type === 'date' ? 'date' : field.type === 'time' ? 'time' : 'text'} {...props} />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {!loading && !submitted && schema && (
            <div className="join-form-actions">
              {step > 0 && <button type="button" className="join-btn join-btn-back" onClick={handleBack}>Back</button>}
              {!isLastStep ? <button type="button" className="join-btn join-btn-next" onClick={handleNext}>Next</button> : <button type="submit" className="join-btn join-btn-submit" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit'}</button>}
            </div>
          )}
        </form>

        <div className={`join-after-submit ${submitted ? 'visible' : ''}`}>
          {submitted && confirmationMessage ? (
            <div className="join-confirmation"><CheckCircle2 size={24} className="join-confirm-icon" /><div className="join-confirm-text" dangerouslySetInnerHTML={{ __html: confirmationMessage }} /></div>
          ) : submitted ? (
            <div className="join-confirmation"><CheckCircle2 size={24} className="join-confirm-icon" /><div className="join-confirm-text"><strong>Submitted inside Nilgiri.</strong><span>Your response has been sent to the original Google Form responses.</span></div></div>
          ) : (
            <div className="join-confirmation"><CheckCircle2 size={24} className="join-confirm-icon" /><div className="join-confirm-text"><strong>Ready for your application.</strong><span>Complete the custom form here. The final response is stored in Google Forms.</span></div></div>
          )}
        </div>
      </section>
    </main>
  );
};

export default JoinPage;