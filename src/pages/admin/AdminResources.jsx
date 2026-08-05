import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Link2, Tag, AlignLeft } from 'lucide-react';

const AdminResources = () => {
    const [links, setLinks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const emptyForm = { title: '', url: '', section: 'Academics' };
    const [formData, setFormData] = useState(emptyForm);

    const SECTIONS = ['Academics', 'Quick Links', 'Student Activity', 'Annual Fest', 'Other'];

    useEffect(() => { fetchLinks(); }, []);

    /* ── BACKEND LOGIC UNCHANGED ── */
    const fetchLinks = async () => {
        try { const r = await client.get('/links'); const sorted = (r.data.links || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); setLinks(sorted); }
        catch (e) { console.error("Failed to fetch links:", e); }
        finally { setLoading(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this link?")) return;
        try {
            await client.delete(`/links/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
            setLinks(links.filter(l => l.id !== id));
        } catch (e) { console.error("Failed to delete link:", e); alert("Failed to delete link"); }
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setFormData({ title: item.title || '', url: item.url || '', section: item.category || 'Academics' });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
            const payload = { 
                ...formData, 
                category: formData.section 
            };
            delete payload.section;

            if (editingItem) await client.put(`/links/${editingItem.id}`, payload, config);
            else await client.post('/links', payload, config);
            setShowModal(false); setEditingItem(null); setFormData(emptyForm); fetchLinks();
        } catch (e) { console.error("Failed to save link:", e); alert("Failed to save link"); }
    };

    const openNew = () => { setEditingItem(null); setFormData(emptyForm); setShowModal(true); };

    /* Category accent colors */
    const CAT_COLOR = { Academics: '#a78bfa', 'Quick Links': '#60a5fa', 'Student Activity': '#34d399', 'Annual Fest': '#f59e0b', Other: '#a1a1aa' };
    const catColor = (cat) => {
        const mainCat = (cat || '').split(' > ')[0];
        return CAT_COLOR[mainCat] || '#34d399';
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

                /* Link card */
                .link-card{background:#0d0d0d;border:1px solid rgba(255,255,255,.05);display:flex;align-items:center;gap:1.5rem;padding:1.5rem 1.75rem;position:relative;overflow:hidden;transition:border-color .4s,background .4s;}
                .link-card:hover{background:#111;}
                .link-card:hover .link-title{color:var(--cat-color);}
                .link-card:hover .link-icon-wrap{border-color:var(--cat-color);color:var(--cat-color);}
                .link-card::after{content:'';position:absolute;left:0;top:0;bottom:0;width:2px;background:var(--cat-color);transform:scaleY(0);transform-origin:bottom;transition:transform .4s;}
                .link-card:hover::after{transform:scaleY(1);}

                .link-icon-wrap{width:3.5rem;height:3.5rem;flex-shrink:0;border:1px solid rgba(255,255,255,.06);display:flex;align-items:center;justify-content:center;color:#3f3f46;transition:color .3s,border-color .3s;}

                .link-cat{display:inline-block;padding:.15rem .5rem;font-family:'DM Mono',monospace;font-size:.52rem;font-weight:500;text-transform:uppercase;letter-spacing:.18em;border:1px solid;margin-bottom:.35rem;}
                .link-title{font-family:'Bebas Neue',sans-serif;font-size:1.25rem;letter-spacing:.06em;color:white;transition:color .3s;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;line-height:1;}
                .link-url{font-family:'DM Mono',monospace;font-size:.55rem;font-weight:400;color:#3f3f46;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;letter-spacing:.05em;margin-top:.25rem;}
                .link-desc{font-family:'DM Mono',monospace;font-size:.6rem;font-weight:400;color:#52525b;margin-top:.35rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
                .link-actions{display:flex;align-items:center;gap:1.5rem;margin-top:.75rem;padding-top:.65rem;border-top:1px solid rgba(255,255,255,.04);}
                .link-action-btn{font-family:'DM Mono',monospace;font-size:.58rem;font-weight:500;text-transform:uppercase;letter-spacing:.2em;background:none;border:none;cursor:pointer;padding:0;transition:color .2s;}
                .link-action-btn.edit{color:rgba(52,211,153,.45);}.link-action-btn.edit:hover{color:#34d399;}
                .link-action-btn.purge{color:#3f1010;margin-left:auto;}.link-action-btn.purge:hover{color:#f87171;}

                /* Visit button */
                .visit-btn{font-family:'DM Mono',monospace;font-size:.55rem;font-weight:500;text-transform:uppercase;letter-spacing:.18em;background:none;border:1px solid rgba(255,255,255,.06);color:#52525b;padding:.3rem .75rem;cursor:pointer;transition:all .2s;text-decoration:none;display:inline-block;}
                .visit-btn:hover{color:white;border-color:rgba(255,255,255,.15);}

                /* Modal */
                .modal-overlay{position:fixed;inset:0;z-index:100;display:flex;align-items:center;justify-content:center;padding:1.5rem;background:rgba(0,0,0,.88);backdrop-filter:blur(6px);}
                .modal-box{width:100%;max-width:500px;background:#0d0d0d;border:1px solid rgba(255,255,255,.08);box-shadow:0 32px 80px rgba(0,0,0,.6);position:relative;}
                .modal-header{padding:2rem 2.5rem 1.5rem;border-bottom:1px solid rgba(255,255,255,.05);}
                .modal-body{padding:2rem 2.5rem;display:flex;flex-direction:column;gap:1.25rem;}
                .modal-footer-row{padding:1.5rem 2.5rem;border-top:1px solid rgba(255,255,255,.05);display:flex;gap:.75rem;}
                .modal-title{font-family:'Bebas Neue',sans-serif;font-size:2rem;letter-spacing:.05em;color:white;line-height:1;}
                .modal-sub{font-family:'DM Mono',monospace;font-size:.55rem;font-weight:500;text-transform:uppercase;letter-spacing:.35em;color:rgba(52,211,153,.4);margin-top:.3rem;}
                .modal-close{position:absolute;top:1.25rem;right:1.25rem;width:2rem;height:2rem;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06);color:#52525b;cursor:pointer;transition:color .2s,background .2s;}
                .modal-close:hover{color:white;background:rgba(255,255,255,.08);}
                .field-label{font-family:'DM Mono',monospace;font-size:.55rem;font-weight:500;text-transform:uppercase;letter-spacing:.3em;color:rgba(52,211,153,.45);display:flex;align-items:center;gap:.35rem;margin-bottom:.5rem;}
                .field-input,.field-select,.field-textarea{width:100%;background:#080808;border:1px solid rgba(255,255,255,.06);color:white;font-family:'DM Mono',monospace;font-size:.8rem;font-weight:400;outline:none;transition:border-color .2s;box-sizing:border-box;}
                .field-input{padding:0 1rem;height:3rem;}.field-select{padding:0 1rem;height:3rem;appearance:none;}.field-textarea{padding:.75rem 1rem;resize:none;}
                .field-input:focus,.field-select:focus,.field-textarea:focus{border-color:rgba(52,211,153,.35);}
                .field-select option{background:#111;}
                .modal-btn{flex:1;height:3rem;font-family:'DM Mono',monospace;font-size:.65rem;font-weight:500;text-transform:uppercase;letter-spacing:.2em;border:none;cursor:pointer;transition:all .2s;}
                .modal-btn.abort{background:rgba(255,255,255,.04);color:#71717a;border:1px solid rgba(255,255,255,.06);}.modal-btn.abort:hover{color:white;background:rgba(255,255,255,.07);}
                .modal-btn.confirm{background:#34d399;color:black;}.modal-btn.confirm:hover{background:#6ee7b7;}
                .empty-state{padding:5rem;text-align:center;border:1px dashed rgba(255,255,255,.05);font-family:'DM Mono',monospace;font-size:.6rem;font-weight:500;text-transform:uppercase;letter-spacing:.5em;color:#1c1c1e;}
            `}</style>

            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: .5, ease: [.16, 1, .3, 1] }}
                style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}
            >
                {/* ── Header ── */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '1rem' }}>
                            <div style={{ width: '1.5rem', height: '1px', background: 'rgba(52,211,153,.5)' }} />
                            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '.55rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.4em', color: 'rgba(52,211,153,.6)' }}>
                                Central Archives
                            </span>
                        </div>
                        <h1 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 'clamp(2.5rem,5vw,4rem)', lineHeight: .9, color: 'white', letterSpacing: '.03em', marginBottom: '.6rem' }}>
                            Resources
                        </h1>
                        <p style={{ fontFamily: "'DM Mono',monospace", fontSize: '.6rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.25em', color: '#3f3f46' }}>
                            {links.length} resource{links.length !== 1 ? 's' : ''} archived
                        </p>
                    </div>
                    <button className="new-btn" onClick={openNew}><Plus size={13} strokeWidth={2.5} />New Resource</button>
                </div>

                {/* ── Grid ── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(360px,1fr))', gap: '1px', background: 'rgba(255,255,255,.04)' }}>
                    {links.length > 0 ? links.map((link) => {
                        const cc = catColor(link.category);
                        return (
                            <div key={link.id} className="link-card" style={{ '--cat-color': cc }}>
                                <div className="link-icon-wrap">
                                    <Link2 size={18} strokeWidth={1.5} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <span className="link-cat" style={{ color: cc, background: `${cc}12`, borderColor: `${cc}30` }}>{link.category}</span>
                                    <div className="link-title">{link.title}</div>
                                    <div className="link-url">{link.url}</div>
                                    {link.description && <div className="link-desc">{link.description}</div>}
                                    <div className="link-actions">
                                        <button className="link-action-btn edit" onClick={() => handleEdit(link)}>Modify</button>
                                        <a href={link.url} target="_blank" rel="noopener noreferrer" className="visit-btn">Visit →</a>
                                        <button className="link-action-btn purge" onClick={() => handleDelete(link.id)}>Purge</button>
                                    </div>
                                </div>
                            </div>
                        );
                    }) : (
                        <div className="empty-state">Empty Database — Knowledge Is Power</div>
                    )}
                </div>
            </motion.div>

            {/* ── Modal ── */}
            <AnimatePresence>
                {showModal && (
                    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .2 }}>
                        <motion.div className="modal-box" initial={{ scale: .94, opacity: 0, y: 12 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: .94, opacity: 0, y: 12 }} transition={{ duration: .25, ease: [.16, 1, .3, 1] }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg,#34d399,transparent)' }} />

                            <div className="modal-header">
                                <div className="modal-title">{editingItem ? 'Refine Resource' : 'Archive Entry'}</div>
                                <div className="modal-sub">Archive Protocol // {editingItem ? 'Edit' : 'New'}</div>
                                <button className="modal-close" onClick={() => setShowModal(false)}><X size={14} /></button>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    <div>
                                        <label className="field-label">Resource Title</label>
                                        <input className="field-input" type="text" required placeholder="e.g. Course Registration Guide"
                                            value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="field-label"><Link2 size={9} />Destination URL</label>
                                        <input className="field-input" type="url" required placeholder="https://..."
                                            value={formData.url} onChange={e => setFormData({ ...formData, url: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="field-label"><Tag size={9} />Section</label>
                                        <select className="field-select" value={formData.section} onChange={e => setFormData({ ...formData, section: e.target.value })}>
                                            {SECTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>

                                </div>
                                <div className="modal-footer-row">
                                    <button type="button" className="modal-btn abort" onClick={() => setShowModal(false)}>Discard</button>
                                    <button type="submit" className="modal-btn confirm">{editingItem ? 'Confirm Refinement' : 'Confirm Archive'}</button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default AdminResources;