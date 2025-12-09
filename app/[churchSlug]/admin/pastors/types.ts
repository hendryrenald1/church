export type PastorMember = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  branchId: string | null;
  branchName: string | null;
  status: "ACTIVE" | "INACTIVE";
};

export type BranchSummary = {
  id: string;
  name: string;
  city: string | null;
  isActive: boolean;
};

export type PastorProfile = {
  id: string;
  memberId: string;
  churchId: string;
  title: string;
  ordinationDate: string | null;
  bio: string | null;
  loginEmail: string | null;
  branches: BranchSummary[];
  member: PastorMember | null;
};

export type PastorListRow = {
  id: string;
  title: string;
  ordinationDate: string | null;
  member: PastorMember | null;
  branches: BranchSummary[];
};

export type MemberSearchResult = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  branchId: string | null;
  branchName: string | null;
  status: "ACTIVE" | "INACTIVE";
};
