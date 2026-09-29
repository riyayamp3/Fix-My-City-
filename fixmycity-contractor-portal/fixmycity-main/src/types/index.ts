export interface Complaint {
  _id: string;
  description: string;
  imageUrl: string;
  status: string;
  category?: string;
  createdAt?: string;
  updatedAt?: string;
}
