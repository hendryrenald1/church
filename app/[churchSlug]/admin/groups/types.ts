export type BranchOption = {
  id: string;
  name: string;
};

export type GroupSummary = {
  id: string;
  name: string;
  type: string | null;
  description: string | null;
  memberCount: number;
  branch?: BranchOption | null;
};

export type GroupDetail = {
  id: string;
  name: string;
  type: string | null;
  description: string | null;
  branch?: BranchOption | null;
};

export type GroupMember = {
  id: string;
  member: {
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
    date_of_birth: string | null;
    status: string;
    branch?: BranchOption | null;
  };
};

export type MemberCandidate = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  status: string;
  date_of_birth: string | null;
  branch?: BranchOption | null;
};

export type GroupAnnouncement = {
  id: string;
  title: string;
  body: string;
  created_at: string;
  created_by: string | null;
};
