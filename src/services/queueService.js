const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const queueService = {
  async getStatus(showId) {
    const res = await fetch(`${API_URL}/api/queue/${showId}/status`, {
      credentials: 'include'
    });
    if (!res.ok) throw new Error('Error getting queue status');
    return res.json();
  },

  async join(showId, userId) {
    const res = await fetch(`${API_URL}/api/queue/${showId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ userId })
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw { status: res.status, ...error };
    }
    return res.json();
  },

  async getPosition(showId, userId) {
    const res = await fetch(
      `${API_URL}/api/queue/${showId}/position?userId=${userId}`,
      { credentials: 'include' }
    );
    
    if (!res.ok) {
      throw { status: res.status };
    }
    return res.json();
  },

  async claimAccess(showId, userId) {
    const res = await fetch(`${API_URL}/api/queue/${showId}/claim-access`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ userId })
    });
    
    if (!res.ok) throw new Error('Error claiming access');
    return res.json();
  },

  async leave(showId, userId) {
    await fetch(`${API_URL}/api/queue/${showId}/leave`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ userId })
    });
  }
};
