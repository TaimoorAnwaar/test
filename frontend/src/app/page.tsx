"use client";
import React, { useState } from 'react';
import Link from 'next/link';

export default function HomePage() {
  const [appointmentId, setAppointmentId] = useState('');
  const [startTime, setStartTime] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('60');
  const [createdRooms, setCreatedRooms] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [copyMessage, setCopyMessage] = useState('');

  const showCopyMessage = (message: string) => {
    setCopyMessage(message);
    setTimeout(() => setCopyMessage(''), 3000);
  };

  const copyToClipboard = async (text: string, message: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showCopyMessage(message);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      showCopyMessage(message);
    }
  };

  const createAppointmentRooms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointmentId) return;

    setIsCreating(true);
    try {
      const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
      const api = process.env.NEXT_PUBLIC_API_URL || `${window.location.protocol}//${hostname}:3000`;
      
      const response = await fetch(`${api}/agora/create-appointment-rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appointmentId: parseInt(appointmentId),
          startTime: startTime || undefined,
          durationMinutes: parseInt(durationMinutes) || 60,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCreatedRooms(data);
      } else {
        const error = await response.text();
        alert(`Error: ${error}`);
      }
    } catch (error) {
      console.error('Error creating rooms:', error);
      alert('Failed to create appointment rooms');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="home-container">
      <header className="home-header">
        <h1>🏥 Video Call System</h1>
        <p>Create appointment rooms for doctors and patients</p>
        {copyMessage && (
          <div className="copy-notification">
            {copyMessage}
          </div>
        )}
      </header>

      <main className="home-main">
        <section className="create-rooms-section">
          <h2>Create Appointment Rooms</h2>
          <form onSubmit={createAppointmentRooms} className="create-rooms-form">
            <div className="form-group">
              <label htmlFor="appointmentId">Appointment ID *</label>
              <input
                type="number"
                id="appointmentId"
                value={appointmentId}
                onChange={(e) => setAppointmentId(e.target.value)}
                placeholder="Enter appointment ID"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="startTime">Start Time </label>
              <input
                type="datetime-local"
                id="startTime"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
              <small>Leave empty to start immediately</small>
            </div>

            <div className="form-group">
              <label htmlFor="durationMinutes">Duration (minutes)</label>
              <input
                type="number"
                id="durationMinutes"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                min="15"
                max="480"
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create Rooms'}
            </button>
          </form>
        </section>

        {createdRooms && (
          <section className="rooms-created-section">
            <h2>✅ Rooms Created Successfully!</h2>
            <div className="rooms-grid">
              <div className="room-card doctor">
                <h3>👨‍⚕️ Doctor Room</h3>
                <p><strong>Room ID:</strong> {createdRooms.rooms.doctor.roomId}</p>
                <p><strong>User Type:</strong> {createdRooms.rooms.doctor.userType}</p>
                <div className="link-display">
                  <strong>Doctor Link:</strong>
                  <a href={createdRooms.rooms.doctor.link} target="_blank" rel="noopener noreferrer" className="room-link">
                    {createdRooms.rooms.doctor.link}
                  </a>
                </div>
                <Link href={createdRooms.rooms.doctor.link} className="btn btn-success">
                  Join Doctor Lobby
                </Link>
              </div>

              <div className="room-card patient">
                <h3>🏥 Patient Room</h3>
                <p><strong>Room ID:</strong> {createdRooms.rooms.patient.roomId}</p>
                <p><strong>User Type:</strong> {createdRooms.rooms.patient.userType}</p>
                <div className="link-display">
                  <strong>Patient Link:</strong>
                  <a href={createdRooms.rooms.patient.link} target="_blank" rel="noopener noreferrer" className="room-link">
                    {createdRooms.rooms.patient.link}
                  </a>
                </div>
                <Link href={createdRooms.rooms.patient.link} className="btn btn-success">
                  Join Patient Lobby
                </Link>
              </div>
            </div>

            <div className="appointment-info">
              <h3>Appointment Details</h3>
              <p><strong>Appointment ID:</strong> {createdRooms.appointmentId}</p>
              <p><strong>Start Time:</strong> {new Date(createdRooms.startTimeMs).toLocaleString()}</p>
              <p><strong>Duration:</strong> {Math.round((createdRooms.endTimeMs - createdRooms.startTimeMs) / 1000 / 60)} minutes</p>
            </div>

            <div className="shared-room-info">
              <h3>🔄 Shared Video Call Room</h3>
              <p><strong>Important:</strong> Both doctor and patient will join the same video call room: <strong>{createdRooms.sharedRoomId}</strong></p>
              <p>This ensures they can see and hear each other during the appointment.</p>
              <div className="room-flow">
                <div className="flow-step">
                  <span className="step-number">1</span>
                  <span>Doctor clicks "Join Doctor Lobby"</span>
                </div>
                <div className="flow-step">
                  <span className="step-number">2</span>
                  <span>Patient clicks "Join Patient Lobby"</span>
                </div>
                <div className="flow-step">
                  <span className="step-number">3</span>
                  <span>Both join the same video call room</span>
                </div>
              </div>
            </div>

            <div className="copy-links-section">
              <h3>📋 Copy Links</h3>
              <p>Share these links with doctors and patients:</p>
              <div className="copy-buttons">
                <button 
                  className="btn btn-outline copy-btn" 
                  onClick={() => copyToClipboard(createdRooms.rooms.doctor.link, 'Doctor link copied to clipboard!')}
                >
                  📋 Copy Doctor Link
                </button>
                <button 
                  className="btn btn-outline copy-btn" 
                  onClick={() => copyToClipboard(createdRooms.rooms.patient.link, 'Patient link copied to clipboard!')}
                >
                  📋 Copy Patient Link
                </button>
                <button 
                  className="btn btn-primary copy-btn" 
                  onClick={() => {
                    const allLinks = `Doctor Link: ${createdRooms.rooms.doctor.link}\nPatient Link: ${createdRooms.rooms.patient.link}`;
                    copyToClipboard(allLinks, 'Both links copied to clipboard!');
                  }}
                >
                  📋 Copy All Links
                </button>
              </div>
            </div>
          </section>
        )}

        <section className="testing-section">
          <h2>🧪 Test the System</h2>
          <div className="test-links">
            <p>You can also test with these pre-created rooms:</p>
            <div className="test-buttons">
              <Link href="/lobby/test-doctor-room" className="btn btn-outline">
                Test Doctor Lobby
              </Link>
              <Link href="/lobby/test-patient-room" className="btn btn-outline">
                Test Patient Lobby
              </Link>
            </div>
          </div>
        </section>
      </main>

      <style jsx>{`
        .home-container {
          min-height: 100vh;
          background: linear-gradient(180deg, #0f172a 0%, #0b1022 100%);
          color: #e5e7eb;
          padding: 24px clamp(16px, 4vw, 48px);
        }

        .home-header {
          text-align: center;
          margin-bottom: 48px;
        }

        .home-header h1 {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 16px;
          background: linear-gradient(135deg, #60a5fa, #34d399);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .home-header p {
          font-size: 1.1rem;
          color: #94a3b8;
        }

        .home-main {
          max-width: 800px;
          margin: 0 auto;
        }

        .create-rooms-section {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 32px;
          margin-bottom: 32px;
        }

        .create-rooms-section h2 {
          margin: 0 0 24px 0;
          font-size: 1.5rem;
          font-weight: 600;
        }

        .create-rooms-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group label {
          font-weight: 500;
          color: #cbd5e1;
        }

        .form-group input {
          padding: 12px 16px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.05);
          color: #e5e7eb;
          font-size: 16px;
        }

        .form-group input:focus {
          outline: none;
          border-color: #60a5fa;
          box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1);
        }

        .form-group small {
          color: #94a3b8;
          font-size: 14px;
        }

        .btn {
          padding: 12px 24px;
          border-radius: 8px;
          border: none;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
          text-align: center;
          transition: all 0.2s ease;
        }

        .btn-primary {
          background: #2563eb;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #1d4ed8;
          transform: translateY(-1px);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .btn-success {
          background: #10b981;
          color: white;
        }

        .btn-success:hover {
          background: #059669;
          transform: translateY(-1px);
        }

        .btn-outline {
          background: transparent;
          color: #60a5fa;
          border: 1px solid #60a5fa;
        }

        .btn-outline:hover {
          background: #60a5fa;
          color: white;
        }

        .rooms-created-section {
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.2);
          border-radius: 16px;
          padding: 32px;
          margin-bottom: 32px;
        }

        .rooms-created-section h2 {
          margin: 0 0 24px 0;
          color: #10b981;
        }

        .rooms-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 24px;
        }

        @media (max-width: 600px) {
          .rooms-grid {
            grid-template-columns: 1fr;
          }
        }

        .room-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 20px;
        }

        .room-card h3 {
          margin: 0 0 16px 0;
          font-size: 1.2rem;
        }

        .room-card p {
          margin: 8px 0;
          color: #cbd5e1;
        }

        .appointment-info {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 20px;
        }

        .appointment-info h3 {
          margin: 0 0 16px 0;
          font-size: 1.2rem;
        }

        .appointment-info p {
          margin: 8px 0;
          color: #cbd5e1;
        }

        .shared-room-info {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 20px;
          margin-top: 24px;
        }

        .shared-room-info h3 {
          margin: 0 0 16px 0;
          font-size: 1.2rem;
        }

        .shared-room-info p {
          margin: 8px 0;
          color: #cbd5e1;
        }

        .room-flow {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 16px;
        }

        .flow-step {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #cbd5e1;
          font-size: 14px;
        }

        .step-number {
          background-color: #60a5fa;
          color: white;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 14px;
        }

        .testing-section {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 32px;
        }

        .testing-section h2 {
          margin: 0 0 16px 0;
          font-size: 1.5rem;
        }

        .test-links p {
          margin: 0 0 16px 0;
          color: #94a3b8;
        }

        .test-buttons {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }

        .copy-btn {
          padding: 10px 20px;
          font-size: 14px;
        }

        .link-display {
          background: rgba(96, 165, 250, 0.1);
          border: 1px solid rgba(96, 165, 250, 0.2);
          border-radius: 8px;
          padding: 12px;
          margin: 16px 0;
        }

        .room-link {
          display: block;
          color: #60a5fa;
          text-decoration: none;
          word-break: break-all;
          font-family: monospace;
          font-size: 13px;
          background: rgba(0, 0, 0, 0.2);
          padding: 8px;
          border-radius: 4px;
          margin-top: 8px;
          border: 1px solid rgba(96, 165, 250, 0.3);
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .room-link:hover {
          text-decoration: underline;
          background: rgba(0, 0, 0, 0.3);
          border-color: rgba(96, 165, 250, 0.5);
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(96, 165, 250, 0.2);
        }

        .room-link:active {
          transform: translateY(0);
        }

        .copy-links-section {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 20px;
          margin-top: 24px;
        }

        .copy-links-section h3 {
          margin: 0 0 16px 0;
          font-size: 1.2rem;
        }

        .copy-links-section p {
          margin: 0 0 16px 0;
          color: #94a3b8;
        }

        .copy-buttons {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }

        .copy-btn {
          padding: 10px 20px;
          font-size: 14px;
        }

        .copy-notification {
          position: fixed;
          top: 20px;
          right: 20px;
          background-color: #10b981;
          color: white;
          padding: 12px 20px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          z-index: 1000;
          opacity: 0.9;
          font-size: 14px;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}
