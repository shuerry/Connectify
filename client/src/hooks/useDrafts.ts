import api from '../services/config';
import { PopulatedDatabaseDraft } from '@fake-stack-overflow/shared';

const DRAFT_API = '/api/question';

const saveDraft = async (payload: any) => {
  const res = await api.post(`${DRAFT_API}/saveDraft`, payload);
  if (res.status !== 201) throw new Error('Failed to save draft');
  return res.data as PopulatedDatabaseDraft;
};

const updateDraft = async (draftId: string, payload: any) => {
  const res = await api.put(`${DRAFT_API}/updateDraft/${draftId}`, payload);
  if (res.status !== 200) throw new Error('Failed to update draft');
  return res.data as PopulatedDatabaseDraft;
};

const getUserDrafts = async (username: string) => {
  const res = await api.get(`${DRAFT_API}/getUserDrafts?username=${encodeURIComponent(username)}`);
  if (res.status !== 200) throw new Error('Failed to get drafts');
  return res.data as PopulatedDatabaseDraft[];
};

const deleteDraft = async (draftId: string, username: string) => {
  const res = await api.delete(`${DRAFT_API}/deleteDraft/${draftId}`, { data: { username } });
  if (res.status !== 200) throw new Error('Failed to delete draft');
  return res.data;
};

export default function useDrafts() {
  return { saveDraft, updateDraft, getUserDrafts, deleteDraft };
}
