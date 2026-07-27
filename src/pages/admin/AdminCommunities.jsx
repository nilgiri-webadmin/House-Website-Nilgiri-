import React, { useState, useEffect, useRef } from 'react';
import client from '../../api/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Upload, ImageIcon } from 'lucide-react';

const AdminCommunities = () => {
    const [communities, setCommunities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [uploadError, setUploadError] = useState('');
    const fileInputRef = useRef(null);

    const emptyForm = { name: '', description: '', image: '', lead: '', joining_form: '' };
    const [formData, setFormData] = useState(emptyForm);

    useEffect(() => { fetchCommunities(); }, []);

    /* ── BACKEND LOGIC UNCHANGED ── */
    const fetchCommunities = async () => {
        try {
            const response = await client.get('/communities?cache=false');
            setCommunities(response.data);
        } catch (error) {
            console.error("Fetch failed:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setFormData({ name: item.name || '', description: item.description || '', image: item.image || '', lead: item.lead || '', joining_form: item.joining_form || '' });
        setImagePreview(item.image || '');
        setSelectedFile(null);
        setUploadError('');
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Purge this community?")) return;
        try {
            await client.delete(`/communities/${id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setCommunities(communities.filter(c => c.id !== id));
        } catch (error) {
            console.error("Delete failed:", error);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) { setUploadError('File must be an image.'); return; }
        if (file.size > 5 * 1024 * 1024) { setUploadError('Image must be under 5MB.'); return; }
        setUploadError('');
        setSelectedFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
            let finalImageUrl = formData.image;

            if (selectedFile) {
                const uploadData = new FormData();
                uploadData.append('file', selectedFile);
                uploadData.append('folder', 'Communities');
                const upRes = await client.post('/upload', uploadData, {
                    headers: { 'Content-Type': 'multipart/form-data', ...config.headers }
                });
                finalImageUrl = upRes.data.url;
            }

            const payload = { ...formData, image: finalImageUrl };
            if (editingItem) {
                await client.put(`/communities/${editingItem.id}`, payload, config);
            } else {
                await client.post('/communities', payload, config);
            }
            setShowModal(false);
            setSelectedFile(null);
            setImagePreview('');
            fetchCommunities();
        } catch (error) {
            console.error("Save failed:", error);
            setUploadError('Save failed. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40vh' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ position: 'relative', width: '2.5rem', height: '2.5rem' }}>
                        <div style={{ position: 'absolute', inset: 0, border: '1px solid rgba(52,211,153,0.1)', transform: 'rotate(45deg)' }} />
                        <div style={{ position: 'absolute', inset: '4px', border: '1px solid rgba(52,211,153,0.25)', transform: 'rotate(45deg)', animation: 'spin 3s linear infinite' }} />
                    </div>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.55rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5em', color: 'rgba(52,211,153,0.4)' }}>Loading</span>
                </div>
            </div>
        );
    }

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500&display=swap');

                .comm-card {
                    background: #0d0d0d;
                    border: 1px solid rgba(255,255,255,0.05);
                    display: flex; gap: 1.75rem; align-items: center;
                    padding: 1.75rem; position: relative; overflow: hidden;
                    transition: border-color 0.4s, background 0.4s;
                }
                .comm-card::after {
                    content: ''; position: absolute; left: 0; top: 0; bottom: 0;
                    width: 2px; background: #34d399;
                    transform: scaleY(0); transform-origin: bottom; transition: transform 0.4s;
                }
                .comm-card:hover { border-color: rgba(52,211,153,0.18); background: #111; }
                .comm-card:hover::after { transform: scaleY(1); }
                .comm-card:hover .comm-name { color: #34d399; }
                .comm-card:hover .comm-img { opacity: 1; }
                .comm-card:hover .comm-img-wrap { border-color: rgba(52,211,153,0.2); }

                .comm-img-wrap {
                    width: 4.5rem; height: 4.5rem; flex-shrink: 0;
                    border: 1px solid rgba(255,255,255,0.06);
                    overflow: hidden; background: #0a0a0a; transition: border-color 0.4s;
                }
                .comm-img { width: 100%; height: 100%; object-fit: cover; opacity: 0.55; transition: opacity 0.4s; }
                .comm-placeholder {
                    width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
                    font-family: 'Bebas Neue', sans-serif; font-size: 1.5rem; color: #27272a; letter-spacing: 0.05em;
                }
                .comm-name {
                    font-family: 'Bebas Neue', sans-serif; font-size: 1.35rem;
                    letter-spacing: 0.06em; color: white; transition: color 0.3s;
                    overflow: hidden; text-overflow: ellipsis; white-space: nowrap; line-height: 1; margin-bottom: 0.4rem;
                }
                .comm-desc {
                    font-family: 'DM Mono', monospace; font-size: 0.6rem; font-weight: 400;
                    text-transform: uppercase; letter-spacing: 0.12em; color: #3f3f46;
                    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                }
                .comm-actions {
                    display: flex; align-items: center; gap: 1.5rem;
                    margin-top: 1rem; padding-top: 0.75rem; border-top: 1px solid rgba(255,255,255,0.04);
                }
                .action-btn {
                    font-family: 'DM Mono', monospace; font-size: 0.58rem; font-weight: 500;
                    text-transform: uppercase; letter-spacing: 0.2em;
                    background: none; border: none; cursor: pointer; padding: 0; transition: color 0.2s;
                }
                .action-btn.edit  { color: rgba(52,211,153,0.45); }
                .action-btn.edit:hover  { color: #34d399; }
                .action-btn.purge { color: #3f1010; margin-left: auto; }
                .action-btn.purge:hover { color: #f87171; }

                .new-btn {
                    display: flex; align-items: center; gap: 0.5rem;
                    height: 2.5rem; padding: 0 1.5rem; background: #34d399; color: black;
                    font-family: 'DM Mono', monospace; font-size: 0.65rem; font-weight: 500;
                    text-transform: uppercase; letter-spacing: 0.2em;
                    border: none; cursor: pointer; transition: background 0.2s, transform 0.15s;
                }
                .new-btn:hover { background: #6ee7b7; }
                .new-btn:active { transform: scale(0.97); }

                /* Modal */
                .modal-overlay {
                    position: fixed; inset: 0; z-index: 100;
                    display: flex; align-items: center; justify-content: center;
                    padding: 1.5rem; background: rgba(0,0,0,0.88); backdrop-filter: blur(6px);
                }
                .modal-box {
                    width: 100%; max-width: 480px; background: #0d0d0d;
                    border: 1px solid rgba(255,255,255,0.08);
                    box-shadow: 0 32px 80px rgba(0,0,0,0.6);
                    position: relative; overflow-y: auto; max-height: 92vh;
                }
                .modal-box::-webkit-scrollbar { width: 4px; }
                .modal-box::-webkit-scrollbar-track { background: #0d0d0d; }
                .modal-box::-webkit-scrollbar-thumb { background: #1b3d29; }

                .modal-header {
                    padding: 2rem 2.5rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.05);
                    position: sticky; top: 0; background: #0d0d0d; z-index: 10;
                }
                .modal-body { padding: 2rem 2.5rem; display: flex; flex-direction: column; gap: 1.25rem; }
                .modal-footer-row {
                    padding: 1.5rem 2.5rem; border-top: 1px solid rgba(255,255,255,0.05);
                    display: flex; gap: 0.75rem; position: sticky; bottom: 0; background: #0d0d0d;
                }
                .modal-title {
                    font-family: 'Bebas Neue', sans-serif; font-size: 2rem; letter-spacing: 0.05em; color: white; line-height: 1;
                }
                .modal-sub {
                    font-family: 'DM Mono', monospace; font-size: 0.55rem; font-weight: 500;
                    text-transform: uppercase; letter-spacing: 0.35em; color: rgba(52,211,153,0.4); margin-top: 0.3rem;
                }
                .modal-close {
                    position: absolute; top: 1.25rem; right: 1.25rem;
                    width: 2rem; height: 2rem; display: flex; align-items: center; justify-content: center;
                    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06);
                    color: #52525b; cursor: pointer; transition: color 0.2s, background 0.2s;
                }
                .modal-close:hover { color: white; background: rgba(255,255,255,0.08); }

                .field-label {
                    font-family: 'DM Mono', monospace; font-size: 0.55rem; font-weight: 500;
                    text-transform: uppercase; letter-spacing: 0.3em; color: rgba(52,211,153,0.45);
                    display: block; margin-bottom: 0.5rem;
                }
                .field-input, .field-textarea {
                    width: 100%; background: #080808; border: 1px solid rgba(255,255,255,0.06);
                    color: white; font-family: 'DM Mono', monospace; font-size: 0.8rem; font-weight: 400;
                    outline: none; transition: border-color 0.2s; box-sizing: border-box;
                }
                .field-input { padding: 0 1rem; height: 3rem; }
                .field-textarea { padding: 0.75rem 1rem; resize: none; }
                .field-input:focus, .field-textarea:focus { border-color: rgba(52,211,153,0.35); }

                /* Image upload zone — square for community thumbnail */
                .img-upload-zone {
                    width: 100%; aspect-ratio: 3/1;
                    border: 1px dashed rgba(255,255,255,0.1); background: #080808;
                    display: flex; flex-direction: column; align-items: center; justify-content: center;
                    gap: 0.75rem; cursor: pointer; position: relative; overflow: hidden;
                    transition: border-color 0.25s, background 0.25s;
                }
                .img-upload-zone:hover { border-color: rgba(52,211,153,0.3); background: rgba(52,211,153,0.03); }
                .img-upload-zone.has-image { border-style: solid; border-color: rgba(52,211,153,0.2); }
                .img-upload-zone img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0.7; }
                .img-upload-overlay {
                    position: absolute; inset: 0; display: flex; flex-direction: column;
                    align-items: center; justify-content: center; gap: 0.5rem;
                    background: rgba(0,0,0,0.5); opacity: 0; transition: opacity 0.25s;
                }
                .img-upload-zone:hover .img-upload-overlay { opacity: 1; }
                .img-upload-hint {
                    font-family: 'DM Mono', monospace; font-size: 0.58rem; font-weight: 500;
                    text-transform: uppercase; letter-spacing: 0.2em; color: #52525b;
                }

                .modal-btn {
                    flex: 1; height: 3rem; font-family: 'DM Mono', monospace;
                    font-size: 0.65rem; font-weight: 500;
                    text-transform: uppercase; letter-spacing: 0.2em; border: none; cursor: pointer; transition: all 0.2s;
                }
                .modal-btn.abort { background: rgba(255,255,255,0.04); color: #71717a; border: 1px solid rgba(255,255,255,0.06); }
                .modal-btn.abort:hover { color: white; background: rgba(255,255,255,0.07); }
                .modal-btn.authorize { background: #34d399; color: black; }
                .modal-btn.authorize:hover { background: #6ee7b7; }
                .modal-btn.authorize:disabled { background: rgba(52,211,153,0.2); color: rgba(0,0,0,0.4); cursor: not-allowed; }

                .error-msg {
                    font-family: 'DM Mono', monospace; font-size: 0.6rem; font-weight: 500;
                    text-transform: uppercase; letter-spacing: 0.15em; color: #f87171;
                    padding: 0.75rem 1rem; border: 1px solid rgba(248,113,113,0.2); background: rgba(248,113,113,0.05);
                }
                .empty-state {
                    grid-column: 1 / -1; padding: 5rem; text-align: center;
                    border: 1px dashed rgba(255,255,255,0.05);
                    font-family: 'DM Mono', monospace; font-size: 0.6rem; font-weight: 500;
                    text-transform: uppercase; letter-spacing: 0.5em; color: #1c1c1e;
                }
            `}</style>

            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}
            >
                {/* ── Page header ── */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                            <div style={{ width: '1.5rem', height: '1px', background: 'rgba(52,211,153,0.5)' }} />
                            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.55rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.4em', color: 'rgba(52,211,153,0.6)' }}>
                                Node Governance
                            </span>
                        </div>
                        <h1 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 'clamp(2.5rem,5vw,4rem)', lineHeight: 0.9, color: 'white', letterSpacing: '0.03em', marginBottom: '0.6rem' }}>
                            Communities
                        </h1>
                        <p style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.6rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.25em', color: '#3f3f46' }}>
                            {communities.length} node{communities.length !== 1 ? 's' : ''} registered
                        </p>
                    </div>
                    <button className="new-btn" onClick={() => { setEditingItem(null); setFormData(emptyForm); setImagePreview(''); setSelectedFile(null); setUploadError(''); setShowModal(true); }}>
                        <Plus size={13} strokeWidth={2.5} />
                        New Node
                    </button>
                </div>

                {/* ── Grid ── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1px', background: 'rgba(255,255,255,0.04)' }}>
                    {communities.length > 0 ? communities.map((comm) => (
                        <div key={comm.id} className="comm-card">
                            <div className="comm-img-wrap">
                                {comm.image
                                    ? <img src={comm.image} alt="" className="comm-img" />
                                    : <div className="comm-placeholder">{comm.name?.[0] || 'N'}</div>
                                }
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div className="comm-name">{comm.name}</div>
                                <div className="comm-desc">{comm.description || 'No description'}</div>
                                <div className="comm-actions">
                                    <button className="action-btn edit" onClick={() => handleEdit(comm)}>Refine</button>
                                    <button className="action-btn purge" onClick={() => handleDelete(comm.id)}>Purge</button>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="empty-state">No Nodes Registered</div>
                    )}
                </div>
            </motion.div>

            {/* ── Modal ── */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <motion.div
                            className="modal-box"
                            initial={{ scale: 0.94, opacity: 0, y: 12 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.94, opacity: 0, y: 12 }}
                            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, #34d399, transparent)' }} />

                            <div className="modal-header">
                                <div className="modal-title">{editingItem ? 'Refine Node' : 'New Node'}</div>
                                <div className="modal-sub">Node Protocol // {editingItem ? 'Edit' : 'Register'}</div>
                                <button className="modal-close" onClick={() => setShowModal(false)}><X size={14} /></button>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">

                                    {/* ── Image upload ── */}
                                    <div>
                                        <label className="field-label">
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                <ImageIcon size={10} /> Community Image
                                            </span>
                                        </label>
                                        <div
                                            className={`img-upload-zone ${imagePreview ? 'has-image' : ''}`}
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            {imagePreview && <img src={imagePreview} alt="Preview" />}
                                            {imagePreview ? (
                                                <div className="img-upload-overlay">
                                                    <Upload size={16} color="white" strokeWidth={1.5} />
                                                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.6rem', color: 'white', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Change</span>
                                                </div>
                                            ) : (
                                                <>
                                                    <Upload size={18} color="#3f3f46" strokeWidth={1.5} />
                                                    <span className="img-upload-hint">Click to upload image</span>
                                                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.5rem', color: '#27272a', textTransform: 'uppercase', letterSpacing: '0.2em' }}>PNG, JPG, WEBP · max 5MB</span>
                                                </>
                                            )}
                                        </div>
                                        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
                                        {uploadError && <div className="error-msg" style={{ marginTop: '0.5rem' }}>{uploadError}</div>}
                                    </div>

                                    {/* Identity */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div>
                                            <label className="field-label">Identity (Name)</label>
                                            <input className="field-input" type="text" required placeholder="Community name"
                                                value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="field-label">Lead (Required)</label>
                                            <input className="field-input" type="text" required placeholder="Lead name"
                                                value={formData.lead} onChange={e => setFormData({ ...formData, lead: e.target.value })} />
                                        </div>
                                    </div>

                                    {/* Links */}
                                    <div>
                                        <label className="field-label">Joining Form Link</label>
                                        <input className="field-input" type="url" placeholder="https://forms.google.com/..."
                                            value={formData.joining_form} onChange={e => setFormData({ ...formData, joining_form: e.target.value })} />
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label className="field-label">Objective</label>
                                        <textarea className="field-textarea" rows="3" required placeholder="Brief description"
                                            value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                                    </div>

                                </div>

                                <div className="modal-footer-row">
                                    <button type="button" className="modal-btn abort" onClick={() => setShowModal(false)}>Abort</button>
                                    <button type="submit" className="modal-btn authorize" disabled={submitting}>
                                        {submitting ? 'Processing…' : 'Authorize'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default AdminCommunities;