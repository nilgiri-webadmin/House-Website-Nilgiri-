import React, { useEffect, useState } from 'react';
import client from '../../api/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Mail, User, Trash2 } from 'lucide-react';
import { ROLE_OPTIONS } from '@/lib/permissions';
import '../ResourcesPage.css';

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
    <div className="resources-page admin-contacts-admin-page">
      <style>{`
        .admin-contacts-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 1.5rem;
        }

        .admin-contacts-actions button {
          display: inline-flex;
          align-items: center;
          gap: 0.65rem;
          border: none;
          cursor: pointer;
          background: #34d399;
          color: black;
          padding: 0.95rem 1.35rem;
          font-family: var(--font-body);
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
          font-family: var(--font-heading);
          font-size: 2rem;
          color: white;
        }

        .modal-subtitle {
          margin: 0.5rem 0 0;
          color: #cbd5e1;
          font-family: var(--font-body);
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
          font-family: var(--font-body);
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
          font-family: var(--font-body);
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
          font-family: var(--font-body);
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
          .admin-contacts-actions {
            justify-content: stretch;
          }
          .admin-contacts-actions button {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>

      <div className="resources-header-wrapper section-header">
        <span className="section-tag">Administrative Directory</span>
        <h1 className="section-title">Important Contacts</h1>
        <div className="resources-intro-text">
          Create and maintain the official student contact directory for UHC, LHC, Web Administrators, Community Admin, and Mentor roles.
        </div>
      </div>

      <div className="admin-contacts-actions">
        <button onClick={() => openForm()}>
          <Plus size={16} /> Add Contact
        </button>
      </div>

      {loading ? (
        <div className="resources-loading">Loading contacts...</div>
      ) : contacts.length === 0 ? (
        <div className="resources-empty">No contacts created yet.</div>
      ) : (
        <div className="resource-grid">
          {contacts.map((contact) => (
            <div key={contact.id} className="resource-card">
              <div className="resource-card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div className="resource-section-icon">
                    <User size={20} />
                  </div>
                  <div>
                    <p className="contact-role">{contact.role}</p>
                    <h4 className="resource-card-title">{contact.name}</h4>
                  </div>
                </div>
              </div>

              <div className="resource-card-body" style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
                <div className="contact-detail">
                  <Mail size={14} />
                  <span>{contact.email}</span>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button className="contact-button" onClick={() => openForm(contact)}>
                    <User size={14} /> Edit
                  </button>
                  <button className="contact-button delete-button" onClick={() => handleDelete(contact.id)}>
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
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
    </div>
  );
};

export default AdminContacts;
