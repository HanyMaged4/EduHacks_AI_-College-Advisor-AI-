const API_URL = 'http://localhost:3000/chat';

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
});

export type Conversation = {
  id: string;
  createdAt: string;
};

export const createConversation = async (): Promise<Conversation> => {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to create conversation: ${res.status}`);
  return res.json();
};

export const listConversations = async (): Promise<Conversation[]> => {
  const res = await fetch(API_URL, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to list conversations: ${res.status}`);
  return res.json();
};
