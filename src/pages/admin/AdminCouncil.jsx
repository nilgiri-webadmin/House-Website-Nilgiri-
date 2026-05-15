import React, { useState, useEffect, useRef } from 'react';
import client from '../../api/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Upload, ImageIcon, User, Briefcase, Mail, Globe, Calendar, Linkedin, RefreshCw } from 'lucide-react';

const AdminCouncil = () => {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [uploadError, setUploadError] = useState('');
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncMessage, setSyncMessage] = useState('');
    const fileInputRef = useRef(null);

    const emptyForm = { name: '', position: '', region: '', team: 'UHC', email: '', linkedin: '', profile_photo_url: '', tenure_year: new Date().getFullYear().toString() };
    const [formData, setFormData] = useState(emptyForm);

    useEffect(() => { fetchMembers(); }, []);

    /* ── BACKEND LOGIC UNCHANGED ── */
    const fetchMembers = async () => {
        try { const r = await client.get('/council'); setMembers(r.data); }
        catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Remove this officer from the registry?")) return;
        try {
            await client.delete(`/council/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
            setMembers(members.filter(m => m.id !== id));
        } catch (e) { console.error(e); }
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setFormData({ name: item.name || '', position: item.position || '', region: item.region || '', team: item.team || 'UHC', email: item.email || '', linkedin: item.linkedin || '', profile_photo_url: item.profile_photo_url || '', tenure_year: item.tenure_year?.toString() || new Date().getFullYear().toString() });
        setImagePreview(item.profile_photo_url || ''); setSelectedFile(null); setUploadError(''); setShowModal(true);
    };

    const handleFileChange = (e) => {
        const f = e.target.files[0]; if (!f) return;
        if (!f.type.startsWith('image/')) { setUploadError('File must be an image.'); return; }
        if (f.size > 5 * 1024 * 1024) { setUploadError('Max 5MB.'); return; }
        setUploadError(''); setSelectedFile(f); setImagePreview(URL.createObjectURL(f));
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); setSubmitting(true);
        try {
            const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
            let img = formData.profile_photo_url;
            if (selectedFile) {
                const fd = new FormData(); fd.append('file', selectedFile); fd.append('folder', 'Council');
                const up = await client.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data', ...config.headers } });
                img = up.data.url;
            }
            const payload = { ...formData, profile_photo_url: img };
            if (editingItem) await client.put(`/council/${editingItem.id}`, payload, config);
            else await client.post('/council', payload, config);
            setShowModal(false); setSelectedFile(null); setImagePreview(''); fetchMembers();
        } catch (e) { console.error(e); setUploadError('Save failed.'); } finally { setSubmitting(false); }
    };

    const openNew = () => { setEditingItem(null); setFormData(emptyForm); setImagePreview(''); setSelectedFile(null); setUploadError(''); setShowModal(true); };

    const handleSyncToYaml = async () => {
        if (!window.confirm("Sync all council data to the public website? This will update the live council page.")) return;
        setIsSyncing(true);
        setSyncMessage('');
        try {
            const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
            const response = await client.post('/council/sync-yaml', {}, config);
            setSyncMessage(`Synced successfully! ${response.data.stats.total} members updated.`);
            setTimeout(() => setSyncMessage(''), 3000);
        } catch (e) {
            console.error(e);
            setSyncMessage('Sync failed. Please try again.');
            setTimeout(() => setSyncMessage(''), 3000);
        } finally {
            setIsSyncing(false);
        }
    };

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40vh' }}>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '.55rem', letterSpacing: '.5em', color: 'rgba(52,211,153,.4)', textTransform: 'uppercase' }}>Loading</span>
        </div>
    );

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500&display=swap');
                .new-btn{display:flex;align-items:center;gap:.5rem;height:2.5rem;padding:0 1.5rem;background:#34d399;color:black;font-family:'DM Mono',monospace;font-size:.65rem;font-weight:500;text-transform:uppercase;letter-spacing:.2em;border:none;cursor:pointer;transition:background .2s,transform .15s;}
                .new-btn:hover{background:#6ee7b7;}.new-btn:active{transform:scale(.97);}
                .sync-btn{display:flex;align-items:center;gap:.5rem;height:2.5rem;padding:0 1.5rem;background:transparent;color:#34d399;font-family:'DM Mono',monospace;font-size:.65rem;font-weight:500;text-transform:uppercase;letter-spacing:.2em;border:1px solid rgba(52,211,153,.4);cursor:pointer;transition:all .2s;}
                .sync-btn:hover{background:rgba(52,211,153,.1);border-color:#34d399;}.sync-btn:active{transform:scale(.97);}
                .sync-btn:disabled{opacity:.5;cursor:not-allowed;}
                .sync-message{font-family:'DM Mono',monospace;font-size:.6rem;font-weight:500;text-transform:uppercase;letter-spacing:.15em;margin-top:.5rem;}
                .sync-message.success{color:#34d399;}
                .sync-message.error{color:#f87171;}
                @keyframes spin{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
                .ds-card{background:#0d0d0d;border:1px solid rgba(255,255,255,.05);display:flex;align-items:center;gap:1.5rem;padding:1.5rem 1.75rem;position:relative;overflow:hidden;transition:border-color .4s,background .4s;}
                .ds-card::after{content:'';position:absolute;left:0;top:0;bottom:0;width:2px;background:#34d399;transform:scaleY(0);transform-origin:bottom;transition:transform .4s;}
                .ds-card:hover{border-color:rgba(52,211,153,.18);background:#111;}.ds-card:hover::after{transform:scaleY(1);}
                .ds-card:hover .ds-title{color:#34d399;}.ds-card:hover .ds-img{opacity:1;}.ds-card:hover .ds-img-wrap{border-color:rgba(52,211,153,.2);}
                .ds-img-wrap{width:4.5rem;height:4.5rem;flex-shrink:0;border:1px solid rgba(255,255,255,.06);overflow:hidden;background:#0a0a0a;transition:border-color .4s;border-radius:0;}
                .ds-img{width:100%;height:100%;object-fit:cover;opacity:.55;transition:opacity .4s;}
                .ds-placeholder{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-family:'Bebas Neue',sans-serif;font-size:1.5rem;color:#27272a;}
                .ds-badge{display:inline-block;padding:.2rem .6rem;background:rgba(52,211,153,.08);border:1px solid rgba(52,211,153,.18);color:#34d399;font-family:'DM Mono',monospace;font-size:.55rem;font-weight:500;text-transform:uppercase;letter-spacing:.15em;}
                .ds-title{font-family:'Bebas Neue',sans-serif;font-size:1.3rem;letter-spacing:.06em;color:white;transition:color .3s;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;line-height:1;}
                .ds-meta{font-family:'DM Mono',monospace;font-size:.58rem;font-weight:400;text-transform:uppercase;letter-spacing:.12em;color:#3f3f46;}
                .ds-actions{display:flex;align-items:center;gap:1.5rem;margin-top:.75rem;padding-top:.65rem;border-top:1px solid rgba(255,255,255,.04);}
                .ds-action-btn{font-family:'DM Mono',monospace;font-size:.58rem;font-weight:500;text-transform:uppercase;letter-spacing:.2em;background:none;border:none;cursor:pointer;padding:0;transition:color .2s;}
                .ds-action-btn.edit{color:rgba(52,211,153,.45);}.ds-action-btn.edit:hover{color:#34d399;}
                .ds-action-btn.purge{color:#3f1010;margin-left:auto;}.ds-action-btn.purge:hover{color:#f87171;}
                .modal-overlay{position:fixed;inset:0;z-index:100;display:flex;align-items:center;justify-content:center;padding:1.5rem;background:rgba(0,0,0,.88);backdrop-filter:blur(6px);}
                .modal-box{width:100%;max-width:540px;background:#0d0d0d;border:1px solid rgba(255,255,255,.08);box-shadow:0 32px 80px rgba(0,0,0,.6);position:relative;overflow-y:auto;max-height:92vh;}
                .modal-box::-webkit-scrollbar{width:4px;}.modal-box::-webkit-scrollbar-track{background:#0d0d0d;}.modal-box::-webkit-scrollbar-thumb{background:#1b3d29;}
                .modal-header{padding:2rem 2.5rem 1.5rem;border-bottom:1px solid rgba(255,255,255,.05);position:sticky;top:0;background:#0d0d0d;z-index:10;}
                .modal-body{padding:2rem 2.5rem;display:flex;flex-direction:column;gap:1.25rem;}
                .modal-footer-row{padding:1.5rem 2.5rem;border-top:1px solid rgba(255,255,255,.05);display:flex;gap:.75rem;position:sticky;bottom:0;background:#0d0d0d;}
                .modal-title{font-family:'Bebas Neue',sans-serif;font-size:2rem;letter-spacing:.05em;color:white;line-height:1;}
                .modal-sub{font-family:'DM Mono',monospace;font-size:.55rem;font-weight:500;text-transform:uppercase;letter-spacing:.35em;color:rgba(52,211,153,.4);margin-top:.3rem;}
                .modal-close{position:absolute;top:1.25rem;right:1.25rem;width:2rem;height:2rem;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06);color:#52525b;cursor:pointer;transition:color .2s,background .2s;}
                .modal-close:hover{color:white;background:rgba(255,255,255,.08);}
                .field-label{font-family:'DM Mono',monospace;font-size:.55rem;font-weight:500;text-transform:uppercase;letter-spacing:.3em;color:rgba(52,211,153,.45);display:flex;align-items:center;gap:.35rem;margin-bottom:.5rem;}
                .field-input,.field-select{width:100%;background:#080808;border:1px solid rgba(255,255,255,.06);color:white;font-family:'DM Mono',monospace;font-size:.8rem;font-weight:400;outline:none;transition:border-color .2s;box-sizing:border-box;padding:0 1rem;height:3rem;}
                .field-select{appearance:none;}.field-input:focus,.field-select:focus{border-color:rgba(52,211,153,.35);}
                .field-select option{background:#111;}
                .two-col{display:grid;grid-template-columns:1fr 1fr;gap:1rem;}
                /* Square photo upload */
                .photo-upload-zone{width:100%;aspect-ratio:1/1;border:1px dashed rgba(255,255,255,.1);background:#080808;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.5rem;cursor:pointer;position:relative;overflow:hidden;transition:border-color .25s,background .25s;}
                .photo-upload-zone:hover{border-color:rgba(52,211,153,.3);background:rgba(52,211,153,.03);}
                .photo-upload-zone.has-image{border-style:solid;border-color:rgba(52,211,153,.2);}
                .photo-upload-zone img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.8;}
                .photo-upload-overlay{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.4rem;background:rgba(0,0,0,.6);opacity:0;transition:opacity .25s;}
                .photo-upload-zone:hover .photo-upload-overlay{opacity:1;}
                .modal-btn{flex:1;height:3rem;font-family:'DM Mono',monospace;font-size:.65rem;font-weight:500;text-transform:uppercase;letter-spacing:.2em;border:none;cursor:pointer;transition:all .2s;}
                .modal-btn.abort{background:rgba(255,255,255,.04);color:#71717a;border:1px solid rgba(255,255,255,.06);}.modal-btn.abort:hover{color:white;background:rgba(255,255,255,.07);}
                .modal-btn.authorize{background:#34d399;color:black;}.modal-btn.authorize:hover{background:#6ee7b7;}
                .modal-btn.authorize:disabled{background:rgba(52,211,153,.2);color:rgba(0,0,0,.4);cursor:not-allowed;}
                .error-msg{font-family:'DM Mono',monospace;font-size:.6rem;font-weight:500;text-transform:uppercase;letter-spacing:.15em;color:#f87171;padding:.75rem 1rem;border:1px solid rgba(248,113,113,.2);background:rgba(248,113,113,.05);}
                .empty-state{grid-column:1/-1;padding:5rem;text-align:center;border:1px dashed rgba(255,255,255,.05);font-family:'DM Mono',monospace;font-size:.6rem;font-weight:500;text-transform:uppercase;letter-spacing:.5em;color:#1c1c1e;}
                .form-section{font-family:'DM Mono',monospace;font-size:.5rem;font-weight:500;text-transform:uppercase;letter-spacing:.4em;color:#27272a;padding-bottom:.5rem;border-bottom:1px solid rgba(255,255,255,.04);margin-bottom:.25rem;}
            `}</style>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5, ease: [.16, 1, .3, 1] }} style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '1rem' }}>
                            <div style={{ width: '1.5rem', height: '1px', background: 'rgba(52,211,153,.5)' }} />
                            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '.55rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.4em', color: 'rgba(52,211,153,.6)' }}>Officer Registry</span>
                        </div>
                        <h1 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 'clamp(2.5rem,5vw,4rem)', lineHeight: .9, color: 'white', letterSpacing: '.03em', marginBottom: '.6rem' }}>Council</h1>
                        <p style={{ fontFamily: "'DM Mono',monospace", fontSize: '.6rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.25em', color: '#3f3f46' }}>{members.length} officer{members.length !== 1 ? 's' : ''} on registry</p>
                        {syncMessage && (
                            <div className={`sync-message ${syncMessage.includes('failed') ? 'error' : 'success'}`}>
                                {syncMessage}
                            </div>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button className="sync-btn" onClick={handleSyncToYaml} disabled={isSyncing}>
                            <RefreshCw size={13} strokeWidth={2.5} style={{ animation: isSyncing ? 'spin 1s linear infinite' : 'none' }} />
                            {isSyncing ? 'Syncing...' : 'Sync to Public'}
                        </button>
                        <button className="new-btn" onClick={openNew}><Plus size={13} strokeWidth={2.5} />Appoint Officer</button>
                    </div>
                </div>

                {/* Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: '1px', background: 'rgba(255,255,255,.04)' }}>
                    {members.length > 0 ? members.map((m) => (
                        <div key={m.id} className="ds-card">
                            <div className="ds-img-wrap">
                                {m.profile_photo_url ? <img src={m.profile_photo_url} alt="" className="ds-img" /> : <div className="ds-placeholder">{m.name?.[0] || 'O'}</div>}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.3rem' }}>
                                    <span className="ds-badge">{m.team}</span>
                                    <span className="ds-meta">{m.tenure_year}</span>
                                </div>
                                <div className="ds-title">{m.name}</div>
                                <div className="ds-meta" style={{ marginTop: '.25rem' }}>{m.position}{m.region ? ` · ${m.region}` : ''}</div>
                                <div className="ds-actions">
                                    <button className="ds-action-btn edit" onClick={() => handleEdit(m)}>Update</button>
                                    <button className="ds-action-btn purge" onClick={() => handleDelete(m.id)}>Remove</button>
                                </div>
                            </div>
                        </div>
                    )) : <div className="empty-state">No Officers On Registry</div>}
                </div>
            </motion.div>

            <AnimatePresence>
                {showModal && (
                    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .2 }}>
                        <motion.div className="modal-box" initial={{ scale: .94, opacity: 0, y: 12 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: .94, opacity: 0, y: 12 }} transition={{ duration: .25, ease: [.16, 1, .3, 1] }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg,#34d399,transparent)' }} />
                            <div className="modal-header">
                                <div className="modal-title">{editingItem ? 'Update Officer' : 'Appoint Officer'}</div>
                                <div className="modal-sub">Officer Protocol // {editingItem ? 'Edit' : 'Register'}</div>
                                <button className="modal-close" onClick={() => setShowModal(false)}><X size={14} /></button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    {/* Photo + core info side by side */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '1.25rem', alignItems: 'start' }}>
                                        <div>
                                            <label className="field-label"><ImageIcon size={9} />Photo</label>
                                            <div className={`photo-upload-zone ${imagePreview ? 'has-image' : ''}`} onClick={() => fileInputRef.current?.click()}>
                                                {imagePreview && <img src={imagePreview} alt="Preview" />}
                                                {imagePreview
                                                    ? <div className="photo-upload-overlay"><Upload size={14} color="white" strokeWidth={1.5} /><span style={{ fontFamily: "'DM Mono',monospace", fontSize: '.55rem', color: 'white', textTransform: 'uppercase', letterSpacing: '.15em' }}>Change</span></div>
                                                    : <><User size={22} color="#3f3f46" strokeWidth={1} /><span style={{ fontFamily: "'DM Mono',monospace", fontSize: '.52rem', color: '#3f3f46', textTransform: 'uppercase', letterSpacing: '.18em', textAlign: 'center', padding: '0 .5rem' }}>Click to upload</span></>
                                                }
                                            </div>
                                            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            <div>
                                                <label className="field-label"><User size={9} />Full Name</label>
                                                <input className="field-input" type="text" required placeholder="Officer name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="field-label"><Briefcase size={9} />Position</label>
                                                <input className="field-input" type="text" required placeholder="e.g. Secretary" value={formData.position} onChange={e => setFormData({ ...formData, position: e.target.value })} />
                                            </div>
                                        </div>
                                    </div>
                                    {uploadError && <div className="error-msg">{uploadError}</div>}

                                    {/* Team + Tenure */}
                                    <div className="two-col">
                                        <div>
                                            <label className="field-label">Team</label>
                                            <select className="field-select" value={formData.team} onChange={e => setFormData({ ...formData, team: e.target.value })}>
                                                {['UHC', 'RC', 'Operations', 'Community Admins', 'Mentor'].map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="field-label"><Calendar size={9} />Tenure Year</label>
                                            <input className="field-input" type="text" placeholder={new Date().getFullYear().toString()} value={formData.tenure_year} onChange={e => setFormData({ ...formData, tenure_year: e.target.value })} />
                                        </div>
                                    </div>

                                    {/* Region */}
                                    <div>
                                        <label className="field-label"><Globe size={9} />Region</label>
                                        <input className="field-input" type="text" placeholder="e.g. South Block" value={formData.region} onChange={e => setFormData({ ...formData, region: e.target.value })} />
                                    </div>

                                    {/* Email + LinkedIn */}
                                    <div className="two-col">
                                        <div>
                                            <label className="field-label"><Mail size={9} />Email</label>
                                            <input className="field-input" type="email" placeholder="officer@example.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="field-label"><Linkedin size={9} />LinkedIn</label>
                                            <input className="field-input" type="url" placeholder="https://linkedin.com/in/..." value={formData.linkedin} onChange={e => setFormData({ ...formData, linkedin: e.target.value })} />
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer-row">
                                    <button type="button" className="modal-btn abort" onClick={() => setShowModal(false)}>Abort</button>
                                    <button type="submit" className="modal-btn authorize" disabled={submitting}>{submitting ? 'Processing…' : 'Authorize'}</button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default AdminCouncil;