import React, { useEffect, useState } from 'react';
import { Mail, User, Briefcase } from 'lucide-react';
import client from '../api/client';
import './ResourcesPage.css';

const ImportantContactsPage = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const response = await client.get('/contacts');
        setContacts(response.data.contacts || []);
      } catch (fetchError) {
        console.error('Failed to load important contacts:', fetchError);
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
  }, []);

  const hasContacts = contacts.length > 0;

  return (
    <div className="resources-page important-contacts-page">
      <div className="resources-header-wrapper section-header">
        <span className="section-tag">Student Essentials</span>
        <h1 className="section-title">Important Contacts</h1>
        <div className="resources-intro-text">
          <p>
            Nilgiri House maintains a concise directory of student body contacts for the Secretary, Deputy Secretary, Web Admin, and other essential roles.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="resources-loading">Loading contacts…</div>
      ) : !hasContacts ? (
        <div className="resources-empty">the forest is quite right now, come back later to find something new here</div>
      ) : (
        <div className="resource-grid">
          {contacts.map((contact) => (
            <div key={contact.id} className="resource-card">
              <div className="resource-card-accent" style={{ background: '#34d399' }}></div>
              <div className="resource-card-header">
                <h4 className="resource-card-title">{contact.name}</h4>
                <User size={16} className="resource-card-icon" style={{ '--hover-color': '#34d399' }} />
              </div>

              <div className="resource-card-desc-wrap">
                <Briefcase size={12} className="resource-card-desc-icon" />
                <p className="resource-card-desc">{contact.role}</p>
              </div>
              <div className="resource-card-desc-wrap" style={{ marginTop: '0.5rem' }}>
                <Mail size={12} className="resource-card-desc-icon" />
                <a href={`mailto:${contact.email}`} className="resource-card-desc" style={{ color: 'inherit', textDecoration: 'none' }}>
                  {contact.email}
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImportantContactsPage;
