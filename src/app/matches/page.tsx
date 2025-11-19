// src/app/matches/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { collection, query, getDocs, DocumentData, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function MatchesPage() {
  const [matches, setMatches] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      setLoading(true);
      try {
        const matchesCollection = collection(db, 'matches');
        const q = query(matchesCollection, orderBy('info.dates.0', 'desc'));
        
        const querySnapshot = await getDocs(q);
        const matchesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMatches(matchesData);
      } catch (error) {
        console.error("Error fetching matches: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

  if (loading) {
    return (
      <div className="text-center mt-10">
        <p className="text-lg text-gray-400">Loading matches...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold text-white mb-6">Matches</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {matches.map(match => (
          <div key={match.id} className="bg-gray-800 rounded-lg shadow-lg p-5 border border-gray-700 hover:border-cyan-500 transition-colors duration-300">
            <p className="font-bold text-lg text-cyan-400">{match.info.teams.join(' vs ')}</p>
            <p className="text-md text-gray-300 mt-1">{match.info.event?.name || 'One-off Match'}</p>
            <p className="text-sm text-gray-400 mt-2">{match.info.venue}</p>
            <p className="text-sm text-gray-500">{new Date(match.info.dates[0]).toLocaleDateString()}</p>
             <div className="mt-3 bg-gray-700 p-2 rounded-md text-xs">
                <p><strong>Toss:</strong> {match.info.toss.winner} ({match.info.toss.decision})</p>
                {match.info.outcome?.winner && <p><strong>Winner:</strong> {match.info.outcome.winner}</p>}
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}
