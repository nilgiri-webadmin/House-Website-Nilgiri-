import React, { useState, useEffect, useRef } from 'react';
import client from '../../api/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Upload, ImageIcon, MapPin, Calendar, Clock, User, Instagram, Link2, Hash } from 'lucide-react';

const AdminMeetups = () => {
    const [meetups, setMeetups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [uploadError, setUploadError] = useState('');
    const fileInputRef = useRef(null);

    const emptyForm = {
        title: '', description: '', meetup_number: '',
        location: '', date: '', time: '', organiser: '',
        insta_link: '', img_url: '', register_link: '', is_past: false
    };
    const [formData, setFormData] = useState(emptyForm);

    useEffect(() => { fetchMeetups(); }, []);

    /* ── BACKEND LOGIC UNCHANGED ── */
    const fetchMeetups = async () => {
        try {
            const response = await client.get('/meetups?limit=100');
            setMeetups(response.data.meetups || []);
        } catch (error) {
            console.error("Failed to fetch meetups:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Purge this meetup protocol?")) return;
        try {
            await client.delete(`/meetups/${id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setMeetups(meetups.filter(m => m.id !== id));
        } catch (error) {
            console.error("Delete failed:", error);
        }
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setFormData({
            title: item.title || '',
            description: item.description || '',
            meetup_number: item.meetup_number?.toString() || '',
            location: item.location || '',
            date: item.date ? item.date.split('T')[0] : '',
            time: item.time || '',
            organiser: item.organiser || '',
            insta_link: item.insta_link || '',
            img_url: item.img_url || '',
            register_link: item.register_link || '',
            is_past: item.is_past || false
        });
        setImagePreview(item.img_url || '');
        setSelectedFile(null);
        setUploadError('');
        setShowModal(true);
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
            let finalImageUrl = formData.img_url;

            if (selectedFile) {
                const uploadData = new FormData();
                uploadData.append('file', selectedFile);
                uploadData.append('folder', 'Meetups');
                const upRes = await client.post('/upload', uploadData, {
                    headers: { 'Content-Type': 'multipart/form-data', ...config.headers }
                });
                finalImageUrl = upRes.data.url;
            }

            const payload = { ...formData, img_url: finalImageUrl };
            if (editingItem) {
                await client.put(`/meetups/${editingItem.id}`, payload, config);
            } else {
                await client.post('/meetups', payload, config);
            }
            setShowModal(false);
            setSelectedFile(null);
            setImagePreview('');
            fetchMeetups();
        } catch (error) {
            console.error("Save failed:", error);
            setUploadError('Save failed. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const openNew = () => {
        setEditingItem(null);
        setFormData(emptyForm);
        setImagePreview('');
        setSelectedFile(null);
        setUploadError('');
        setShowModal(true);
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

                /* ── Meetup card ── */
                .mu-card {
                    background: #0d0d0d;
                    border: 1px solid rgba(255,255,255,0.05);
                    display: flex; align-items: center; gap: 1.5rem;
                    padding: 1.5rem 1.75rem;
                    position: relative; overflow: hidden;
                    transition: border-color 0.4s, background 0.4s;
                }
                .mu-card::after {
                    content: ''; position: absolute; left: 0; top: 0; bottom: 0;
                    width: 2px; background: #34d399;
                    transform: scaleY(0); transform-origin: bottom; transition: transform 0.4s;
                }
                .mu-card:hover { border-color: rgba(52,211,153,0.18); background: #111; }
                .mu-card:hover::after { transform: scaleY(1); }
                .mu-card:hover .mu-title { color: #34d399; }
                .mu-card:hover .mu-img { opacity: 1; }
                .mu-card:hover .mu-img-wrap { border-color: rgba(52,211,153,0.2); }

                .mu-img-wrap {
                    width: 4.5rem; height: 4.5rem; flex-shrink: 0;
                    border: 1px solid rgba(255,255,255,0.06);
                    overflow: hidden; background: #0a0a0a; transition: border-color 0.4s;
                }
                .mu-img { width: 100%; height: 100%; object-fit: cover; opacity: 0.55; transition: opacity 0.4s; }
                .mu-img-placeholder {
                    width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
                    font-family: 'Bebas Neue', sans-serif; font-size: 1.5rem; color: #27272a;
                }

                .mu-badge {
                    display: inline-block; padding: 0.2rem 0.6rem;
                    font-family: 'DM Mono', monospace; font-size: 0.55rem; font-weight: 500;
                    text-transform: uppercase; letter-spacing: 0.15em;
                }
                .mu-badge.active { background: rgba(52,211,153,0.08); border: 1px solid rgba(52,211,153,0.18); color: #34d399; }
                .mu-badge.archived { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); color: #52525b; }

                .mu-number {
                    font-family: 'Bebas Neue', sans-serif; font-size: 1rem;
                    color: rgba(52,211,153,0.35); letter-spacing: 0.08em; margin-right: 0.4rem;
                }
                .mu-title {
                    font-family: 'Bebas Neue', sans-serif; font-size: 1.3rem;
                    letter-spacing: 0.06em; color: white; transition: color 0.3s;
                    overflow: hidden; text-overflow: ellipsis; white-space: nowrap; line-height: 1;
                }
                .mu-meta {
                    font-family: 'DM Mono', monospace; font-size: 0.58rem; font-weight: 400;
                    text-transform: uppercase; letter-spacing: 0.12em; color: #3f3f46;
                }
                .mu-actions {
                    display: flex; align-items: center; gap: 1.5rem;
                    margin-top: 0.75rem; padding-top: 0.65rem;
                    border-top: 1px solid rgba(255,255,255,0.04);
                }
                .mu-action-btn {
                    font-family: 'DM Mono', monospace; font-size: 0.58rem; font-weight: 500;
                    text-transform: uppercase; letter-spacing: 0.2em;
                    background: none; border: none; cursor: pointer; padding: 0; transition: color 0.2s;
                }
                .mu-action-btn.edit  { color: rgba(52,211,153,0.45); }
                .mu-action-btn.edit:hover  { color: #34d399; }
                .mu-action-btn.purge { color: #3f1010; margin-left: auto; }
                .mu-action-btn.purge:hover { color: #f87171; }

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
                    width: 100%; max-width: 580px; background: #0d0d0d;
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
                .modal-body  { padding: 2rem 2.5rem; display: flex; flex-direction: column; gap: 1.25rem; }
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
                    display: flex; align-items: center; gap: 0.35rem; margin-bottom: 0.5rem;
                }
                .field-input, .field-select, .field-textarea {
                    width: 100%; background: #080808; border: 1px solid rgba(255,255,255,0.06);
                    color: white; font-family: 'DM Mono', monospace; font-size: 0.8rem; font-weight: 400;
                    outline: none; transition: border-color 0.2s; box-sizing: border-box;
                }
                .field-input  { padding: 0 1rem; height: 3rem; }
                .field-select { padding: 0 1rem; height: 3rem; appearance: none; }
                .field-textarea { padding: 0.75rem 1rem; resize: none; }
                .field-input:focus, .field-select:focus, .field-textarea:focus { border-color: rgba(52,211,153,0.35); }
                .field-select option { background: #111; }

                .two-col   { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
                .three-col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; }

                /* Image upload */
                .img-upload-zone {
                    width: 100%; aspect-ratio: 16/7;
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

                /* Toggle */
                .toggle-row {
                    display: flex; align-items: center; justify-content: space-between;
                    padding: 0.875rem 1rem; background: #080808;
                    border: 1px solid rgba(255,255,255,0.06); cursor: pointer;
                    transition: border-color 0.2s;
                }
                .toggle-row:hover { border-color: rgba(52,211,153,0.2); }
                .toggle-label {
                    font-family: 'DM Mono', monospace; font-size: 0.7rem; font-weight: 500;
                    text-transform: uppercase; letter-spacing: 0.2em; color: #71717a;
                }
                .toggle-pill {
                    width: 2.5rem; height: 1.25rem; border-radius: 9999px;
                    position: relative; transition: background 0.25s; flex-shrink: 0;
                }
                .toggle-pill.on  { background: #34d399; }
                .toggle-pill.off { background: rgba(255,255,255,0.1); }
                .toggle-knob {
                    position: absolute; top: 2px;
                    width: 1rem; height: 1rem; border-radius: 50%; background: white;
                    transition: left 0.25s; box-shadow: 0 1px 4px rgba(0,0,0,0.4);
                }
                .toggle-knob.on  { left: calc(100% - 1.125rem); }
                .toggle-knob.off { left: 2px; }

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

                /* Section divider inside modal */
                .form-section {
                    font-family: 'DM Mono', monospace; font-size: 0.5rem; font-weight: 500;
                    text-transform: uppercase; letter-spacing: 0.4em; color: #27272a;
                    padding-bottom: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.04);
                    margin-bottom: 0.25rem;
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
                                Station Coordination
                            </span>
                        </div>
                        <h1 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 'clamp(2.5rem,5vw,4rem)', lineHeight: 0.9, color: 'white', letterSpacing: '0.03em', marginBottom: '0.6rem' }}>
                            Meetups
                        </h1>
                        <p style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.6rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.25em', color: '#3f3f46' }}>
                            {meetups.length} protocol{meetups.length !== 1 ? 's' : ''} on record
                        </p>
                    </div>
                    <button className="new-btn" onClick={openNew}>
                        <Plus size={13} strokeWidth={2.5} />
                        Deploy Meetup
                    </button>
                </div>

                {/* ── Cards grid ── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1px', background: 'rgba(255,255,255,0.04)' }}>
                    {meetups.length > 0 ? meetups.map((m) => (
                        <div key={m.id} className="mu-card">
                            <div className="mu-img-wrap">
                                {m.img_url
                                    ? <img src={m.img_url} alt="" className="mu-img" />
                                    : <div className="mu-img-placeholder"><ImageIcon size={18} strokeWidth={1} /></div>
                                }
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                                    <span className={`mu-badge ${m.is_past ? 'archived' : 'active'}`}>
                                        {m.is_past ? 'Archived' : 'Active'}
                                    </span>
                                    <span className="mu-meta">{m.date ? new Date(m.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'TBD'}</span>
                                </div>
                                <div className="mu-title">
                                    <span className="mu-number">#{String(m.meetup_number || 0).padStart(2, '0')}</span>
                                    {m.title}
                                </div>
                                <div className="mu-meta" style={{ marginTop: '0.25rem' }}>{m.location || 'Location TBD'}</div>
                                <div className="mu-actions">
                                    <button className="mu-action-btn edit" onClick={() => handleEdit(m)}>Refine</button>
                                    <button className="mu-action-btn purge" onClick={() => handleDelete(m.id)}>Purge</button>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="empty-state">No Protocols On Record</div>
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

                            {/* Header */}
                            <div className="modal-header">
                                <div className="modal-title">{editingItem ? 'Refine Protocol' : 'Deploy Meetup'}</div>
                                <div className="modal-sub">Meetup Protocol // {editingItem ? 'Edit' : 'New'}</div>
                                <button className="modal-close" onClick={() => setShowModal(false)}><X size={14} /></button>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">

                                    {/* Image */}
                                    <div>
                                        <label className="field-label"><ImageIcon size={9} /> Cover Image</label>
                                        <div
                                            className={`img-upload-zone ${imagePreview ? 'has-image' : ''}`}
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            {imagePreview && <img src={imagePreview} alt="Preview" />}
                                            {imagePreview ? (
                                                <div className="img-upload-overlay">
                                                    <Upload size={18} color="white" strokeWidth={1.5} />
                                                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.6rem', color: 'white', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Change</span>
                                                </div>
                                            ) : (
                                                <>
                                                    <Upload size={20} color="#3f3f46" strokeWidth={1.5} />
                                                    <span className="img-upload-hint">Click to upload image</span>
                                                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.5rem', color: '#27272a', textTransform: 'uppercase', letterSpacing: '0.2em' }}>PNG, JPG, WEBP · max 5MB</span>
                                                </>
                                            )}
                                        </div>
                                        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
                                        {uploadError && <div className="error-msg" style={{ marginTop: '0.5rem' }}>{uploadError}</div>}
                                    </div>

                                    {/* Identity */}
                                    <div className="form-section">Identity</div>
                                    <div className="two-col">
                                        <div>
                                            <label className="field-label">Title</label>
                                            <input className="field-input" type="text" required placeholder="Meetup name"
                                                value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="field-label"><Hash size={9} /> Number</label>
                                            <input className="field-input" type="number" placeholder="01"
                                                value={formData.meetup_number} onChange={e => setFormData({ ...formData, meetup_number: e.target.value })} />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="field-label"><User size={9} /> Organiser</label>
                                        <input className="field-input" type="text" placeholder="Organiser name"
                                            value={formData.organiser} onChange={e => setFormData({ ...formData, organiser: e.target.value })} />
                                    </div>

                                    {/* Scheduling */}
                                    <div className="form-section">Scheduling</div>
                                    <div className="three-col">
                                        <div style={{ gridColumn: 'span 1' }}>
                                            <label className="field-label"><Calendar size={9} /> Date</label>
                                            <input className="field-input" type="date" required
                                                value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="field-label"><Clock size={9} /> Time</label>
                                            <input className="field-input" type="time"
                                                value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="field-label"><MapPin size={9} /> Location</label>
                                            <input className="field-input" type="text" required placeholder="Venue"
                                                value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div className="form-section">Content</div>
                                    <div>
                                        <label className="field-label">Description</label>
                                        <textarea className="field-textarea" rows="3" required placeholder="Meetup details and directives"
                                            value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                                    </div>

                                    {/* Links */}
                                    <div className="form-section">Links</div>
                                    <div className="two-col">
                                        <div>
                                            <label className="field-label"><Link2 size={9} /> Register Link</label>
                                            <input className="field-input" type="url" placeholder="https://..."
                                                value={formData.register_link} onChange={e => setFormData({ ...formData, register_link: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="field-label"><Instagram size={9} /> Instagram</label>
                                            <input className="field-input" type="url" placeholder="https://instagram.com/..."
                                                value={formData.insta_link} onChange={e => setFormData({ ...formData, insta_link: e.target.value })} />
                                        </div>
                                    </div>

                                    {/* Status toggle */}
                                    <div className="form-section">Status</div>
                                    <div
                                        className="toggle-row"
                                        onClick={() => setFormData({ ...formData, is_past: !formData.is_past })}
                                    >
                                        <span className="toggle-label">Mark as Past / Archived</span>
                                        <div className={`toggle-pill ${formData.is_past ? 'on' : 'off'}`}>
                                            <div className={`toggle-knob ${formData.is_past ? 'on' : 'off'}`} />
                                        </div>
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

export default AdminMeetups;