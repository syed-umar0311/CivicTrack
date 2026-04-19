export type UserRole = 'resident' | 'admin';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: any; // Firestore Timestamp or Date
}

export type ComplaintCategory = 'water' | 'garbage' | 'electricity' | 'infrastructure' | 'other';
export type ComplaintStatus = 'Pending' | 'In Progress' | 'Resolved';

export interface Complaint {
  id?: string;
  userId: string;
  userName: string;
  title: string;
  description: string;
  category: ComplaintCategory;
  location: string;
  status: ComplaintStatus;
  attachmentUrl?: string;
  attachmentType?: 'image' | 'video';
  adminComment?: string;
  createdAt: any;
  updatedAt: any;
}
