"use client";
import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function DoctorCallPage() {
  const params = useParams<{ room: string }>();
  const router = useRouter();
  const room = params?.room;

  useEffect(() => {
    if (room) {
      // Redirect to the lobby page for doctor
      router.replace(`/lobby/${room}`);
    }
  }, [room, router]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'grid',
      placeItems: 'center',
      background: '#0b1022',
      color: '#e5e7eb'
    }}>
      <div style={{textAlign: 'center'}}>
        <h2>👨‍⚕️ Doctor Call</h2>
        <p>Redirecting to lobby...</p>
      </div>
    </div>
  );
}
