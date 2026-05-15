import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import client from '../../api/client';
import { Plus, X } from 'lucide-react';

const AdminComplaints = () => {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ title: '', description: '' });

    useEffect(() => { fetchComplaints(); }, [filter]);

    /* ── BACKEND LOGIC UNCHANGED ── */
    const fetchComplaints = async () => {
        try {
            setLoading(true);
            const response = await client.get(`/complaints?status=${filter}`);
            setComplaints(response.data);
        } catch (error) { console.error("Failed to fetch complaints:", error); }
        finally { setLoading(false); }
    };

    const handleAddComplaint = async (e) => {
        e.preventDefault();
        try {
            await client.post('/complaints', formData);
            setShowModal(false);
            setFormData({ title: '', description: '' });
            fetchComplaints();
        } catch (error) { console.error("Failed to add complaint:", error); }
    };

    const updateStatus = async (id, newStatus) => {
        try {
            await client.patch(`/complaints/${id}`, { status: newStatus }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            fetchComplaints();
        } catch (error) { console.error("Status update failed:", error); }
    };

    const STATUS = {
        resolved: { color: '#34d399', bg: 'rgba(52,211,153,.08)', border: 'rgba(52,211,153,.2)' },
        'in-progress': { color: '#60a5fa', bg: 'rgba(96,165,250,.08)', border: 'rgba(96,165,250,.2)' },
        pending: { color: '#fbbf24', bg: 'rgba(251,191,36,.08)', border: 'rgba(251,191,36,.2)' },
    };
    const getStatus = (s) => STATUS[s] || STATUS.pending;

    const FILTERS = ['all', 'pending', 'in-progress', 'resolved'];

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500&display=swap');

                .new-btn{display:flex;align-items:center;gap:.5rem;height:2.5rem;padding:0 1.5rem;background:#34d399;color:black;font-family:'DM Mono',monospace;font-size:.65rem;font-weight:500;text-transform:uppercase;letter-spacing:.2em;border:none;cursor:pointer;transition:background .2s,transform .15s;}
                .new-btn:hover{background:#6ee7b7;}.new-btn:active{transform:scale(.97);}

                /* Filter tabs */
                .filter-tab{font-family:'DM Mono',monospace;font-size:.58rem;font-weight:500;text-transform:uppercase;letter-spacing:.2em;padding:.4rem 1rem;border:1px solid rgba(255,255,255,.06);background:rgba(255,255,255,.03);color:#52525b;cursor:pointer;transition:all .2s;}
                .filter-tab:hover{color:white;background:rgba(255,255,255,.05);}
                .filter-tab.active{color:#34d399;background:rgba(52,211,153,.08);border-color:rgba(52,211,153,.25);}

                /* Complaint card */
                .complaint-card{background:#0d0d0d;border:1px solid rgba(255,255,255,.05);padding:1.75rem 2rem;position:relative;overflow:hidden;transition:border-color .4s,background .4s;}
                .complaint-card::after{content:'';position:absolute;left:0;top:0;bottom:0;width:2px;transform:scaleY(0);transform-origin:bottom;transition:transform .4s;}
                .complaint-card:hover{border-color:rgba(52,211,153,.15);background:#111;}
                .complaint-card:hover::after{transform:scaleY(1);}

                .complaint-title{font-family:'Bebas Neue',sans-serif;font-size:1.4rem;letter-spacing:.05em;color:white;transition:color .3s;line-height:1.1;margin:.4rem 0;}
                .complaint-card:hover .complaint-title{color:#34d399;}

                .complaint-desc{font-family:'DM Mono',monospace;font-size:.7rem;font-weight:400;line-height:1.7;color:#52525b;margin:.75rem 0 1.25rem;}

                .status-badge{display:inline-block;padding:.2rem .7rem;font-family:'DM Mono',monospace;font-size:.55rem;font-weight:500;text-transform:uppercase;letter-spacing:.18em;}

                .status-select{background:#080808;border:1px solid rgba(255,255,255,.08);color:#34d399;font-family:'DM Mono',monospace;font-size:.58rem;font-weight:500;text-transform:uppercase;letter-spacing:.18em;padding:.4rem .8rem;appearance:none;cursor:pointer;outline:none;transition:border-color .2s;}
                .status-select:focus{border-color:rgba(52,211,153,.35);}
                .status-select option{background:#111;}

                .note-btn{font-family:'DM Mono',monospace;font-size:.58rem;font-weight:500;text-transform:uppercase;letter-spacing:.2em;color:rgba(52,211,153,.4);background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.05);padding:.4rem 1rem;cursor:pointer;transition:all .2s;}
                .note-btn:hover{color:#34d399;border-color:rgba(52,211,153,.2);}

                /* Modal */
                .modal-overlay{position:fixed;inset:0;z-index:100;display:flex;align-items:center;justify-content:center;padding:1.5rem;background:rgba(0,0,0,.88);backdrop-filter:blur(6px);}
                .modal-box{width:100%;max-width:460px;background:#0d0d0d;border:1px solid rgba(255,255,255,.08);box-shadow:0 32px 80px rgba(0,0,0,.6);position:relative;}
                .modal-header{padding:2rem 2.5rem 1.5rem;border-bottom:1px solid rgba(255,255,255,.05);}
                .modal-body{padding:2rem 2.5rem;display:flex;flex-direction:column;gap:1.25rem;}
                .modal-footer-row{padding:1.5rem 2.5rem;border-top:1px solid rgba(255,255,255,.05);display:flex;gap:.75rem;}
                .modal-title{font-family:'Bebas Neue',sans-serif;font-size:2rem;letter-spacing:.05em;color:white;line-height:1;}
                .modal-sub{font-family:'DM Mono',monospace;font-size:.55rem;font-weight:500;text-transform:uppercase;letter-spacing:.35em;color:rgba(52,211,153,.4);margin-top:.3rem;}
                .modal-close{position:absolute;top:1.25rem;right:1.25rem;width:2rem;height:2rem;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06);color:#52525b;cursor:pointer;transition:color .2s,background .2s;}
                .modal-close:hover{color:white;background:rgba(255,255,255,.08);}
                .field-label{font-family:'DM Mono',monospace;font-size:.55rem;font-weight:500;text-transform:uppercase;letter-spacing:.3em;color:rgba(52,211,153,.45);display:block;margin-bottom:.5rem;}
                .field-input,.field-textarea{width:100%;background:#080808;border:1px solid rgba(255,255,255,.06);color:white;font-family:'DM Mono',monospace;font-size:.8rem;font-weight:400;outline:none;transition:border-color .2s;box-sizing:border-box;}
                .field-input{padding:0 1rem;height:3rem;}.field-textarea{padding:.75rem 1rem;resize:none;}
                .field-input:focus,.field-textarea:focus{border-color:rgba(52,211,153,.35);}
                .modal-btn{flex:1;height:3rem;font-family:'DM Mono',monospace;font-size:.65rem;font-weight:500;text-transform:uppercase;letter-spacing:.2em;border:none;cursor:pointer;transition:all .2s;}
                .modal-btn.abort{background:rgba(255,255,255,.04);color:#71717a;border:1px solid rgba(255,255,255,.06);}.modal-btn.abort:hover{color:white;background:rgba(255,255,255,.07);}
                .modal-btn.transmit{background:#34d399;color:black;}.modal-btn.transmit:hover{background:#6ee7b7;}

                .empty-state{padding:5rem;text-align:center;border:1px dashed rgba(255,255,255,.05);font-family:'DM Mono',monospace;font-size:.6rem;font-weight:500;text-transform:uppercase;letter-spacing:.5em;color:#1c1c1e;}
                .scanning{padding:5rem;text-align:center;font-family:'DM Mono',monospace;font-size:.6rem;font-weight:500;text-transform:uppercase;letter-spacing:.5em;color:#1c1c1e;animation:pulse 2s infinite;}
                @keyframes pulse{0%,100%{opacity:.3;}50%{opacity:1;}}
            `}</style>

            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: .5, ease: [.16, 1, .3, 1] }}
                style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}
            >

                {/* ── Page header ── */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '1rem' }}>
                            <div style={{ width: '1.5rem', height: '1px', background: 'rgba(52,211,153,.5)' }} />
                            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '.55rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.4em', color: 'rgba(52,211,153,.6)' }}>
                                Resolution Protocol
                            </span>
                        </div>
                        <h1 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 'clamp(2.5rem,5vw,4rem)', lineHeight: .9, color: 'white', letterSpacing: '.03em', marginBottom: '.6rem' }}>
                            Grievances
                        </h1>
                        <p style={{ fontFamily: "'DM Mono',monospace", fontSize: '.6rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.25em', color: '#3f3f46' }}>
                            {complaints.length} report{complaints.length !== 1 ? 's' : ''} on record
                        </p>
                    </div>
                    <button className="new-btn" onClick={() => setShowModal(true)}>
                        <Plus size={13} strokeWidth={2.5} /> New Entry
                    </button>
                </div>

                {/* ── Filter tabs ── */}
                <div style={{ display: 'flex', gap: '2px', background: 'rgba(255,255,255,.03)', padding: '2px', width: 'fit-content' }}>
                    {FILTERS.map(f => (
                        <button key={f} className={`filter-tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                            {f.replace('-', ' ')}
                        </button>
                    ))}
                </div>

                {/* ── Complaints list ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'rgba(255,255,255,.04)' }}>
                    {loading ? (
                        <div className="scanning">Scanning…</div>
                    ) : complaints.length > 0 ? complaints.map((c) => {
                        const s = getStatus(c.status);
                        return (
                            <div
                                key={c.id}
                                className="complaint-card"
                                style={{ '--accent': s.color }}
                            >
                                {/* dynamic left bar color per status */}
                                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '2px', background: s.color, transform: 'scaleY(0)', transformOrigin: 'bottom', transition: 'transform .4s' }}
                                    ref={el => { if (el) { el.parentElement.addEventListener('mouseenter', () => el.style.transform = 'scaleY(1)'); el.parentElement.addEventListener('mouseleave', () => el.style.transform = 'scaleY(0)'); } }} />

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <span className="status-badge" style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color }}>
                                            {c.status}
                                        </span>
                                        <div className="complaint-title">{c.title}</div>
                                    </div>
                                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '.58rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.12em', color: '#3f3f46', flexShrink: 0, marginLeft: '1rem' }}>
                                        {new Date(c.created_at || c.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </span>
                                </div>

                                <p className="complaint-desc">{c.description}</p>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '.875rem', borderTop: '1px solid rgba(255,255,255,.04)' }}>
                                    <select
                                        className="status-select"
                                        value={c.status}
                                        onChange={e => updateStatus(c.id, e.target.value)}
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="in-progress">In-Progress</option>
                                        <option value="resolved">Resolved</option>
                                    </select>
                                    <button className="note-btn">Add Note</button>
                                </div>
                            </div>
                        );
                    }) : (
                        <div className="empty-state">Frequency Clear</div>
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
                                <div className="modal-title">Log Grievance</div>
                                <div className="modal-sub">Complaint Protocol // New</div>
                                <button className="modal-close" onClick={() => setShowModal(false)}><X size={14} /></button>
                            </div>

                            <form onSubmit={handleAddComplaint}>
                                <div className="modal-body">
                                    <div>
                                        <label className="field-label">Title</label>
                                        <input className="field-input" type="text" required placeholder="Grievance header"
                                            value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="field-label">Description</label>
                                        <textarea className="field-textarea" rows="4" required placeholder="Full details of the grievance"
                                            value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                                    </div>
                                </div>
                                <div className="modal-footer-row">
                                    <button type="button" className="modal-btn abort" onClick={() => setShowModal(false)}>Abort</button>
                                    <button type="submit" className="modal-btn transmit">Transmit</button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default AdminComplaints;