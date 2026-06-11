import { useState, useCallback } from 'react';
import API from '../lib/api';

export interface Team {
  _id: string;
  name: string;
  description: string;
  owner: { _id: string; name: string };
  members: { userId: { _id: string; name: string; email: string }; role: string }[];
  createdAt: string;
}

export function useTeams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeams = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get('/api/teams');
      setTeams(res.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.msg || 'Failed to fetch teams');
    } finally {
      setLoading(false);
    }
  }, []);

  const createTeam = async (name: string, description: string) => {
    const res = await API.post('/api/teams', { name, description });
    await fetchTeams();
    return res.data;
  };

  const getTeamById = async (id: string) => {
    const res = await API.get(`/api/teams/${id}`);
    return res.data;
  };

  const inviteMember = async (teamId: string, email: string, role: string) => {
    const res = await API.post(`/api/teams/${teamId}/members`, { email, role });
    await fetchTeams();
    return res.data;
  };

  const leaveTeam = async (teamId: string) => {
    const res = await API.delete(`/api/teams/${teamId}/members/me`);
    await fetchTeams();
    return res.data;
  };

  const getTeamDocuments = async (teamId: string) => {
    const res = await API.get(`/api/teams/${teamId}/documents`);
    return res.data;
  };

  const createTeamDocument = async (teamId: string, title: string) => {
    const res = await API.post(`/api/teams/${teamId}/documents`, { title });
    return res.data;
  };

  return {
    teams,
    loading,
    error,
    createTeam,
    getTeamById,
    inviteMember,
    leaveTeam,
    getTeamDocuments,
    createTeamDocument,
    refresh: fetchTeams
  };
}
