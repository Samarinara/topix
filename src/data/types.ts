export type Topic = {
  id: string;
  name: string;
  color: string;
  createdAt: number;
};

export type Entry = {
  id: string;
  topicId: string;
  text: string;
  createdAt: number;
};
