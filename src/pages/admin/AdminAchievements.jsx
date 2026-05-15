import React, { useState, useEffect, useRef } from 'react';
import client from '../../api/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Upload, ImageIcon, User, Tag, Calendar } from 'lucide-react';

const SHARED_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500&display=swap');
.ds-card{background:#0d0d0d;border:1px solid rgba(255,255,255,0.05);display:flex;align-items:center;gap:1.5rem;padding:1.5rem 1.75rem;position:relative;overflow:hidden;transition:border-color .4s,background .4s;}
.ds-card::after{content:'';position:absolute;left:0;top:0;bottom:0;width:2px;background:#34d399;transform:scaleY(0);transform-origin:bottom;transition:transform .4s;}
.ds-card:hover{border-color:rgba(52,211,153,.18);background:#111;}
.ds-card:hover::after{transform:scaleY(1);}
.ds-card:hover .ds-title{color:#34d399;}
.ds-card:hover .ds-img{opacity:1;}
.ds-card:hover .ds-img-wrap{border-color:rgba(52,211,153,.2);}
.ds-img-wrap{width:4.5rem;height:4.5rem;flex-shrink:0;border:1px solid rgba(255,255,255,.06);overflow:hidden;background:#0a0a0a;transition:border-color .4s;}
.ds-img{width:100%;height:100%;object-fit:cover;opacity:.55;transition:opacity .4s;}
.ds-placeholder{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-family:'Bebas Neue',sans-serif;font-size:1.5rem;color:#27272a;}
.ds-badge{display:inline-block;padding:.2rem .6rem;background:rgba(52,211,153,.08);border:1px solid rgba(52,211,153,.18);color:#34d399;font-family:'DM Mono',monospace;font-size:.55rem;font-weight:500;text-transform:uppercase;letter-spacing:.15em;}
.ds-title{font-family:'Bebas Neue',sans-serif;font-size:1.3rem;letter-spacing:.06em;color:white;transition:color .3s;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;line-height:1;}
.ds-meta{font-family:'DM Mono',monospace;font-size:.58rem;font-weight:400;text-transform:uppercase;letter-spacing:.12em;color:#3f3f46;}
.ds-actions{display:flex;align-items:center;gap:1.5rem;margin-top:.75rem;padding-top:.65rem;border-top:1px solid rgba(255,255,255,.04);}
.ds-action-btn{font-family:'DM Mono',monospace;font-size:.58rem;font-weight:500;text-transform:uppercase;letter-spacing:.2em;background:none;border:none;cursor:pointer;padding:0;transition:color .2s;}
.ds-action-btn.edit{color:rgba(52,211,153,.45);}.ds-action-btn.edit:hover{color:#34d399;}
.ds-action-btn.purge{color:#3f1010;margin-left:auto;}.ds-action-btn.purge:hover{color:#f87171;}
.new-btn{display:flex;align-items:center;gap:.5rem;height:2.5rem;padding:0 1.5rem;background:#34d399;color:black;font-family:'DM Mono',monospace;font-size:.65rem;font-weight:500;text-transform:uppercase;letter-spacing:.2em;border:none;cursor:pointer;transition:background .2s,transform .15s;}
.new-btn:hover{background:#6ee7b7;}.new-btn:active{transform:scale(.97);}
.modal-overlay{position:fixed;inset:0;z-index:100;display:flex;align-items:center;justify-content:center;padding:1.5rem;background:rgba(0,0,0,.88);backdrop-filter:blur(6px);}
.modal-box{width:100%;max-width:520px;background:#0d0d0d;border:1px solid rgba(255,255,255,.08);box-shadow:0 32px 80px rgba(0,0,0,.6);position:relative;overflow-y:auto;max-height:92vh;}
.modal-box::-webkit-scrollbar{width:4px;}.modal-box::-webkit-scrollbar-track{background:#0d0d0d;}.modal-box::-webkit-scrollbar-thumb{background:#1b3d29;}
.modal-header{padding:2rem 2.5rem 1.5rem;border-bottom:1px solid rgba(255,255,255,.05);position:sticky;top:0;background:#0d0d0d;z-index:10;}
.modal-body{padding:2rem 2.5rem;display:flex;flex-direction:column;gap:1.25rem;}
.modal-footer-row{padding:1.5rem 2.5rem;border-top:1px solid rgba(255,255,255,.05);display:flex;gap:.75rem;position:sticky;bottom:0;background:#0d0d0d;}
.modal-title{font-family:'Bebas Neue',sans-serif;font-size:2rem;letter-spacing:.05em;color:white;line-height:1;}
.modal-sub{font-family:'DM Mono',monospace;font-size:.55rem;font-weight:500;text-transform:uppercase;letter-spacing:.35em;color:rgba(52,211,153,.4);margin-top:.3rem;}
.modal-close{position:absolute;top:1.25rem;right:1.25rem;width:2rem;height:2rem;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06);color:#52525b;cursor:pointer;transition:color .2s,background .2s;}
.modal-close:hover{color:white;background:rgba(255,255,255,.08);}
.field-label{font-family:'DM Mono',monospace;font-size:.55rem;font-weight:500;text-transform:uppercase;letter-spacing:.3em;color:rgba(52,211,153,.45);display:flex;align-items:center;gap:.35rem;margin-bottom:.5rem;}
.field-input,.field-select,.field-textarea{width:100%;background:#080808;border:1px solid rgba(255,255,255,.06);color:white;font-family:'DM Mono',monospace;font-size:.8rem;font-weight:400;outline:none;transition:border-color .2s;box-sizing:border-box;}
.field-input{padding:0 1rem;height:3rem;}.field-select{padding:0 1rem;height:3rem;appearance:none;}.field-textarea{padding:.75rem 1rem;resize:none;}
.field-input:focus,.field-select:focus,.field-textarea:focus{border-color:rgba(52,211,153,.35);}
.field-select option{background:#111;}
.two-col{display:grid;grid-template-columns:1fr 1fr;gap:1rem;}
.img-upload-zone{width:100%;aspect-ratio:16/7;border:1px dashed rgba(255,255,255,.1);background:#080808;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.75rem;cursor:pointer;position:relative;overflow:hidden;transition:border-color .25s,background .25s;}
.img-upload-zone:hover{border-color:rgba(52,211,153,.3);background:rgba(52,211,153,.03);}
.img-upload-zone.has-image{border-style:solid;border-color:rgba(52,211,153,.2);}
.img-upload-zone img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.7;}
.img-upload-overlay{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.5rem;background:rgba(0,0,0,.5);opacity:0;transition:opacity .25s;}
.img-upload-zone:hover .img-upload-overlay{opacity:1;}
.img-upload-hint{font-family:'DM Mono',monospace;font-size:.58rem;font-weight:500;text-transform:uppercase;letter-spacing:.2em;color:#52525b;}
.modal-btn{flex:1;height:3rem;font-family:'DM Mono',monospace;font-size:.65rem;font-weight:500;text-transform:uppercase;letter-spacing:.2em;border:none;cursor:pointer;transition:all .2s;}
.modal-btn.abort{background:rgba(255,255,255,.04);color:#71717a;border:1px solid rgba(255,255,255,.06);}.modal-btn.abort:hover{color:white;background:rgba(255,255,255,.07);}
.modal-btn.authorize{background:#34d399;color:black;}.modal-btn.authorize:hover{background:#6ee7b7;}
.modal-btn.authorize:disabled{background:rgba(52,211,153,.2);color:rgba(0,0,0,.4);cursor:not-allowed;}
.error-msg{font-family:'DM Mono',monospace;font-size:.6rem;font-weight:500;text-transform:uppercase;letter-spacing:.15em;color:#f87171;padding:.75rem 1rem;border:1px solid rgba(248,113,113,.2);background:rgba(248,113,113,.05);}
.empty-state{grid-column:1/-1;padding:5rem;text-align:center;border:1px dashed rgba(255,255,255,.05);font-family:'DM Mono',monospace;font-size:.6rem;font-weight:500;text-transform:uppercase;letter-spacing:.5em;color:#1c1c1e;}
.form-section{font-family:'DM Mono',monospace;font-size:.5rem;font-weight:500;text-transform:uppercase;letter-spacing:.4em;color:#27272a;padding-bottom:.5rem;border-bottom:1px solid rgba(255,255,255,.04);margin-bottom:.25rem;}
`;

const AdminAchievements = () => {
    const [achievements, setAchievements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [uploadError, setUploadError] = useState('');
    const fileInputRef = useRef(null);

    const emptyForm = { student_name: '', title: '', description: '', date: '', category: 'Academic', image: '' };
    const [formData, setFormData] = useState(emptyForm);

    useEffect(() => { fetchAchievements(); }, []);

    /* ── BACKEND LOGIC UNCHANGED ── */
    const fetchAchievements = async () => {
        try {
            const response = await client.get('/achievements');
            setAchievements(response.data);
        } catch (error) { console.error("Failed to fetch achievements:", error); }
        finally { setLoading(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Purge this achievement record?")) return;
        try {
            await client.delete(`/achievements/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
            setAchievements(achievements.filter(a => a.id !== id));
        } catch (error) { console.error("Delete failed:", error); }
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setFormData({ student_name: item.student_name || '', title: item.title || '', description: item.description || '', date: item.date ? item.date.split('T')[0] : '', category: item.category || 'Academic', image: item.image || '' });
        setImagePreview(item.image || '');
        setSelectedFile(null); setUploadError('');
        setShowModal(true);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) { setUploadError('File must be an image.'); return; }
        if (file.size > 5 * 1024 * 1024) { setUploadError('Image must be under 5MB.'); return; }
        setUploadError(''); setSelectedFile(file); setImagePreview(URL.createObjectURL(file));
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); setSubmitting(true);
        try {
            const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
            let finalImageUrl = formData.image;
            if (selectedFile) {
                const uploadData = new FormData();
                uploadData.append('file', selectedFile); uploadData.append('folder', 'Achievements');
                const upRes = await client.post('/upload', uploadData, { headers: { 'Content-Type': 'multipart/form-data', ...config.headers } });
                finalImageUrl = upRes.data.url;
            }
            const payload = { ...formData, image: finalImageUrl };
            if (editingItem) { await client.put(`/achievements/${editingItem.id}`, payload, config); }
            else { await client.post('/achievements', payload, config); }
            setShowModal(false); setSelectedFile(null); setImagePreview(''); fetchAchievements();
        } catch (error) { console.error("Save failed:", error); setUploadError('Save failed.'); }
        finally { setSubmitting(false); }
    };

    const openNew = () => { setEditingItem(null); setFormData(emptyForm); setImagePreview(''); setSelectedFile(null); setUploadError(''); setShowModal(true); };

    if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40vh' }}><span style={{ fontFamily: "'DM Mono',monospace", fontSize: '.55rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.5em', color: 'rgba(52,211,153,.4)' }}>Loading</span></div>;

    return (
        <>
            <style>{SHARED_STYLES}</style>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5, ease: [0.16, 1, 0.3, 1] }} style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '1rem' }}>
                            <div style={{ width: '1.5rem', height: '1px', background: 'rgba(52,211,153,.5)' }} />
                            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '.55rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.4em', color: 'rgba(52,211,153,.6)' }}>Excellence Tracking</span>
                        </div>
                        <h1 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 'clamp(2.5rem,5vw,4rem)', lineHeight: .9, color: 'white', letterSpacing: '.03em', marginBottom: '.6rem' }}>Hall of Fame</h1>
                        <p style={{ fontFamily: "'DM Mono',monospace", fontSize: '.6rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.25em', color: '#3f3f46' }}>{achievements.length} record{achievements.length !== 1 ? 's' : ''} logged</p>
                    </div>
                    <button className="new-btn" onClick={openNew}><Plus size={13} strokeWidth={2.5} />New Entry</button>
                </div>

                {/* Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: '1px', background: 'rgba(255,255,255,.04)' }}>
                    {achievements.length > 0 ? achievements.map((item) => (
                        <div key={item.id} className="ds-card">
                            <div className="ds-img-wrap">
                                {item.image ? <img src={item.image} alt="" className="ds-img" /> : <div className="ds-placeholder">{item.student_name?.[0] || 'A'}</div>}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.3rem' }}>
                                    <span className="ds-badge">{item.category}</span>
                                    <span className="ds-meta">{item.date ? new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'TBD'}</span>
                                </div>
                                <div className="ds-title">{item.title}</div>
                                <div className="ds-meta" style={{ marginTop: '.25rem' }}>{item.student_name}</div>
                                <div className="ds-actions">
                                    <button className="ds-action-btn edit" onClick={() => handleEdit(item)}>Modify</button>
                                    <button className="ds-action-btn purge" onClick={() => handleDelete(item.id)}>Purge</button>
                                </div>
                            </div>
                        </div>
                    )) : <div className="empty-state">No Records Logged</div>}
                </div>
            </motion.div>

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .2 }}>
                        <motion.div className="modal-box" initial={{ scale: .94, opacity: 0, y: 12 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: .94, opacity: 0, y: 12 }} transition={{ duration: .25, ease: [0.16, 1, 0.3, 1] }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg,#34d399,transparent)' }} />
                            <div className="modal-header">
                                <div className="modal-title">{editingItem ? 'Modify Entry' : 'New Entry'}</div>
                                <div className="modal-sub">Achievement Protocol // {editingItem ? 'Edit' : 'Register'}</div>
                                <button className="modal-close" onClick={() => setShowModal(false)}><X size={14} /></button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    {/* Image */}
                                    <div>
                                        <label className="field-label"><ImageIcon size={9} />Achievement Image</label>
                                        <div className={`img-upload-zone ${imagePreview ? 'has-image' : ''}`} onClick={() => fileInputRef.current?.click()}>
                                            {imagePreview && <img src={imagePreview} alt="Preview" />}
                                            {imagePreview ? <div className="img-upload-overlay"><Upload size={18} color="white" strokeWidth={1.5} /><span style={{ fontFamily: "'DM Mono',monospace", fontSize: '.6rem', color: 'white', textTransform: 'uppercase', letterSpacing: '.2em' }}>Change</span></div>
                                                : <><Upload size={20} color="#3f3f46" strokeWidth={1.5} /><span className="img-upload-hint">Click to upload image</span><span style={{ fontFamily: "'DM Mono',monospace", fontSize: '.5rem', color: '#27272a', textTransform: 'uppercase', letterSpacing: '.2em' }}>PNG, JPG, WEBP · max 5MB</span></>}
                                        </div>
                                        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
                                        {uploadError && <div className="error-msg" style={{ marginTop: '.5rem' }}>{uploadError}</div>}
                                    </div>
                                    {/* Student + Category */}
                                    <div className="two-col">
                                        <div>
                                            <label className="field-label"><User size={9} />Student Name</label>
                                            <input className="field-input" type="text" required placeholder="Full name" value={formData.student_name} onChange={e => setFormData({ ...formData, student_name: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="field-label"><Tag size={9} />Category</label>
                                            <select className="field-select" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                                {['Academic', 'Sports', 'Cultural', 'Technical', 'Other'].map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    {/* Title + Date */}
                                    <div className="two-col">
                                        <div>
                                            <label className="field-label">Achievement Title</label>
                                            <input className="field-input" type="text" required placeholder="Award or title" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="field-label"><Calendar size={9} />Date</label>
                                            <input className="field-input" type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                                        </div>
                                    </div>
                                    {/* Description */}
                                    <div>
                                        <label className="field-label">Description</label>
                                        <textarea className="field-textarea" rows="3" placeholder="Details about the achievement" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
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

export default AdminAchievements;