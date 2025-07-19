export interface Blog {
  id: number;
  title: string;
  metaDescription: string | null;
  content: string;
  image: string | null;
  topic: string;
  createdAt: string;
}
