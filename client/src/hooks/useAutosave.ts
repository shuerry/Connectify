import { useEffect, Dispatch, SetStateAction } from 'react';
import logger from '../utils/logger';
import { DatabaseCommunity } from '../types/types';

type Setters = {
  setTitle: (v: string) => void;
  setText: (v: string) => void;
  setTagNames: (v: string) => void;
  setCommunity: Dispatch<SetStateAction<DatabaseCommunity | null>>;
};

type Values = {
  title: string;
  text: string;
  tagNames: string;
  community: DatabaseCommunity | null;
};

/**
 * useAutosave
 * - Restores saved values from localStorage under `key` when component mounts
 * - Debounces writes to localStorage when values change
 * - Skips restore when `skipRestore` is true (e.g., editing a server-side draft)
 */
const useAutosave = (
  key: string,
  values: Values,
  setters: Setters,
  options?: { skipRestore?: boolean; communityList?: DatabaseCommunity[] },
) => {
  const { title, text, tagNames, community } = values;
  const { setTitle, setText, setTagNames, setCommunity } = setters;

  useEffect(() => {
    if (options?.skipRestore) return;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const parsed = JSON.parse(raw);

      // Only restore when form is empty
      if (!title && !text && (!tagNames || tagNames.trim() === '')) {
        if (parsed.title) setTitle(parsed.title);
        if (parsed.text) setText(parsed.text);
        if (parsed.tagNames) setTagNames(parsed.tagNames);
        if (parsed.communityId && options?.communityList) {
          const com = options.communityList.find(c => String(c._id) === String(parsed.communityId));
          if (com) setCommunity(com);
        }
      }
    } catch (e) {
      // ignore
      logger.warn('Failed to restore autosave', e);
    }
    // We only want to run this on mount (and when communityList becomes available)
  }, [
    key,
    options?.skipRestore,
    options?.communityList,
    title,
    text,
    tagNames,
    setTitle,
    setText,
    setTagNames,
    setCommunity,
  ]);

  const communityId = community ? community._id : null;

  useEffect(() => {
    const payload = {
      title,
      text,
      tagNames,
      communityId,
      updatedAt: Date.now(),
    };

    const id = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(payload));
      } catch (e) {
        // ignore quota errors
        logger.warn('Failed to autosave', e);
      }
    }, 800);

    return () => clearTimeout(id);
  }, [key, title, text, tagNames, community, communityId]);
};

export default useAutosave;
