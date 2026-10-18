export interface DefaultAICategory {
  id: string;
  name: string;
  description: string;
}

export const DEFAULT_AI_CATEGORIES: DefaultAICategory[] = [
  {
    id: 'everyday-english',
    name: 'Everyday English',
    description: 'Practice common expressions and conversations from daily life.',
  },
  {
    id: 'travel',
    name: 'Travel',
    description: 'Practice airports, hotels, transport, directions, and restaurants.',
  },
  {
    id: 'work',
    name: 'Work',
    description: 'Practice interviews, meetings, professional writing, and workplace English.',
  },
  {
    id: 'school',
    name: 'School',
    description: 'Practice classroom language, studying, and academic communication.',
  },
  {
    id: 'free-conversation',
    name: 'Free conversation',
    description: 'Talk about any topic with your personal language tutor.',
  },
];

export const DEFAULT_TARGET_LANGUAGE = 'English';
export const MAX_CHAT_MESSAGE_LENGTH = 4000;
export const MAX_CONVERSATION_TITLE_LENGTH = 80;
export const MAX_CATEGORY_NAME_LENGTH = 40;
export const MAX_MESSAGES_PER_CONTEXT = 20;
export const DEFAULT_PAGE_SIZE = 30;
export const MAX_PAGE_SIZE = 100;
