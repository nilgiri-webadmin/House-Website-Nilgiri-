import React, { useEffect, useState } from 'react';
import { Mail, User, Briefcase } from 'lucide-react';
import client from '../api/client';
import './ImportantContactsPage.css';

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
        <div className="important-contacts-grid">
          {contacts.map((contact) => (
            <article key={contact.id} className="contact-card">
              <div className="contact-card-top">
                <div className="contact-card-icon">
                  <User size={20} />
                </div>
                <div>
                  <p className="contact-role">{contact.role}</p>
                  <h2 className="contact-name">{contact.name}</h2>
                </div>
              </div>

              <div className="contact-card-body">
                <div className="contact-detail">
                  <Briefcase size={14} />
                  <span>{contact.role}</span>
                </div>
                <a href={`mailto:${contact.email}`} className="contact-email">
                  <Mail size={14} />
                  <span>{contact.email}</span>
                </a>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImportantContactsPage;
