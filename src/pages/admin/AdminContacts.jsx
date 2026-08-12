import React, { useEffect, useState } from 'react';
import client from '../../api/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Mail, User, Trash2 } from 'lucide-react';
import { ROLE_OPTIONS } from '@/lib/permissions';

const AdminContacts = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', role: ROLE_OPTIONS[0] });

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const response = await client.get('/contacts');
      setContacts(response.data.contacts || []);
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', role: ROLE_OPTIONS[0] });
    setEditing(null);
  };

  const openForm = (item = null) => {
    if (item) {
      setEditing(item);
      setFormData({ name: item.name || '', email: item.email || '', role: item.role || ROLE_OPTIONS[0] });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      role: formData.role.trim()
    };

    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };

      if (editing) {
        await client.put(`/contacts/${editing.id}`, payload, config);
      } else {
        await client.post('/contacts', payload, config);
      }

      setShowModal(false);
      resetForm();
      fetchContacts();
    } catch (error) {
      console.error('Failed to save contact:', error);
      alert('Unable to save contact. Please try again.');
    }
  };

  const handleDelete = async (contactId) => {
    if (!window.confirm('Delete this contact?')) {
      return;
    }

    try {
      await client.delete(`/contacts/${contactId}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setContacts((prev) => prev.filter((contact) => contact.id !== contactId));
    } catch (error) {
      console.error('Failed to delete contact:', error);
      alert('Unable to delete contact.');
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500;700&display=swap');

        .admin-contacts-header {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          gap: 1.5rem;
          align-items: flex-end;
          margin-bottom: 2.5rem;
        }

        .admin-contacts-meta {
          display: grid;
          gap: 0.75rem;
        }

        .admin-contacts-subtitle {
          font-family: 'DM Mono', monospace;
          text-transform: uppercase;
          letter-spacing: 0.3em;
          color: #34d399;
          font-size: 0.68rem;
        }

        .admin-contacts-title {
          margin: 0;
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(2.4rem, 4vw, 3.4rem);
          color: white;
          line-height: 0.95;
        }

        .admin-contacts-description {
          margin: 0;
          max-width: 680px;
          color: #cbd5e1;
          font-family: 'DM Mono', monospace;
          font-size: 0.92rem;
          line-height: 1.8;
        }

        .contacts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1rem;
        }

        .contact-card {
          background: #090b12;
          border: 1px solid rgba(255,255,255,.06);
          border-radius: 1.25rem;
          padding: 1.5rem;
          display: grid;
          gap: 1rem;
        }

        .contact-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }

        .contact-person {
          display: grid;
          gap: 0.45rem;
        }

        .contact-person-name {
          margin: 0;
          color: white;
          font-size: 1.15rem;
          font-weight: 700;
          font-family: 'DM Mono', monospace;
        }

        .contact-person-role {
          margin: 0;
          color: #9ca3af;
          font-size: 0.8rem;
          font-family: 'DM Mono', monospace;
          text-transform: uppercase;
          letter-spacing: 0.18em;
        }

        .contact-email-link {
          color: #a5b4fc;
          display: inline-flex;
          align-items: center;
          gap: 0.55rem;
          text-decoration: none;
          font-family: 'DM Mono', monospace;
          font-size: 0.9rem;
        }

        .contact-actions {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
          margin-top: 0.5rem;
        }

        .contact-button {
          font-family: 'DM Mono', monospace;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          padding: 0.8rem 1rem;
          border: 1px solid rgba(255,255,255,.08);
          background: rgba(255,255,255,.03);
          color: #cbd5e1;
          cursor: pointer;
          transition: background 0.2s, color 0.2s, transform 0.15s;
        }

        .contact-button:hover {
          background: rgba(52,211,153,.12);
          color: white;
        }

        .delete-button {
          border-color: rgba(248,113,113,.25);
        }

        .delete-button:hover {
          background: rgba(248,113,113,.16);
          color: #fecaca;
        }

        .new-contact-button {
          display: inline-flex;
          align-items: center;
          gap: 0.65rem;
          border: none;
          cursor: pointer;
          background: #34d399;
          color: black;
          padding: 0.95rem 1.35rem;
          font-family: 'DM Mono', monospace;
          font-size: 0.82rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0,0,0,.92);
          backdrop-filter: blur(4px);
        }

        .modal-box {
          width: min(560px, calc(100% - 2rem));
          border: 1px solid rgba(255,255,255,.08);
          background: #0b1220;
          border-radius: 1rem;
          box-shadow: 0 32px 80px rgba(0,0,0,.55);
          overflow: hidden;
        }

        .modal-header {
          padding: 2rem 2.25rem 1.5rem;
          border-bottom: 1px solid rgba(255,255,255,.05);
        }

        .modal-title {
          margin: 0;
          font-family: 'Bebas Neue', sans-serif;
          font-size: 2rem;
          color: white;
        }

        .modal-subtitle {
          margin: 0.5rem 0 0;
          color: #cbd5e1;
          font-family: 'DM Mono', monospace;
          font-size: 0.75rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        .modal-body {
          padding: 1.75rem 2.25rem 2rem;
          display: grid;
          gap: 1.25rem;
        }

        .field-label {
          display: block;
          margin-bottom: 0.5rem;
          color: #94a3b8;
          font-family: 'DM Mono', monospace;
          font-size: 0.75rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        .field-input,
        .field-select {
          width: 100%;
          border-radius: 0.85rem;
          border: 1px solid rgba(255,255,255,.08);
          background: #071018;
          color: white;
          padding: 0.95rem 1rem;
          font-family: 'DM Mono', monospace;
          font-size: 0.95rem;
          outline: none;
        }

        .field-input:focus,
        .field-select:focus {
          border-color: rgba(52,211,153,.4);
          box-shadow: 0 0 0 3px rgba(52,211,153,.12);
        }

        .modal-actions {
          display: flex;
          gap: 1rem;
          padding: 1.5rem 2.25rem 2rem;
          border-top: 1px solid rgba(255,255,255,.05);
          justify-content: flex-end;
        }

        .modal-action-button {
          border: none;
          cursor: pointer;
          border-radius: 0.85rem;
          padding: 0.95rem 1.25rem;
          font-family: 'DM Mono', monospace;
          font-size: 0.85rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        .modal-action-button.cancel {
          background: rgba(255,255,255,.04);
          color: #cbd5e1;
        }

        .modal-action-button.save {
          background: #34d399;
          color: black;
        }

        @media (max-width: 720px) {
          .admin-contacts-header {
            align-items: stretch;
          }
          .admin-contacts-title {
            font-size: 2.2rem;
          }
        }
      `}</style>

      <div className="admin-contacts-header">
        <div className="admin-contacts-meta">
          <span className="admin-contacts-subtitle">Administrative Directory</span>
          <h1 className="admin-contacts-title">Important Contacts</h1>
          <p className="admin-contacts-description">
            Create and maintain the official student contact directory for the secretary team, web admin, and other key roles.
          </p>
        </div>
        <button className="new-contact-button" onClick={() => openForm()}>
          <Plus size={16} /> Add Contact
        </button>
      </div>

      {loading ? (
        <div style={{ color: '#94a3b8', fontFamily: 'DM Mono, monospace' }}>Loading contacts...</div>
      ) : contacts.length === 0 ? (
        <div style={{ color: '#94a3b8', fontFamily: 'DM Mono, monospace' }}>No contacts created yet.</div>
      ) : (
        <div className="contacts-grid">
          {contacts.map((contact) => (
            <div key={contact.id} className="contact-card">
              <div className="contact-card-top">
                <div className="contact-person">
                  <p className="contact-person-name">{contact.name}</p>
                  <p className="contact-person-role">{contact.role}</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="contact-button" onClick={() => openForm(contact)}>
                    <User size={14} /> Edit
                  </button>
                  <button className="contact-button delete-button" onClick={() => handleDelete(contact.id)}>
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
              <a className="contact-email-link" href={`mailto:${contact.email}`}>
                <Mail size={14} /> <span>{contact.email}</span>
              </a>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="modal-box"
              initial={{ y: 24, opacity: 0, scale: 0.97 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 24, opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <div className="modal-header">
                <h2 className="modal-title">{editing ? 'Edit Contact' : 'New Contact'}</h2>
                <p className="modal-subtitle">Use only name, email, and role</p>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div>
                    <label className="field-label" htmlFor="contact-name">Name</label>
                    <input
                      id="contact-name"
                      className="field-input"
                      type="text"
                      required
                      placeholder="Full name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="field-label" htmlFor="contact-email">Email address</label>
                    <input
                      id="contact-email"
                      className="field-input"
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="field-label" htmlFor="contact-role">Role</label>
                    <select
                      id="contact-role"
                      className="field-select"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    >
                      {ROLE_OPTIONS.map((role) => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="modal-actions">
                  <button type="button" className="modal-action-button cancel" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="modal-action-button save">
                    {editing ? 'Save Changes' : 'Create Contact'}
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

export default AdminContacts;
