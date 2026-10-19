export type Segment = "Private" | "Premier" | "Core";
export type ClientStatus = "Active" | "Prospect" | "At risk" | "Churned";
export type ClientType = "Individual" | "Business";
export type RiskProfile = "Conservative" | "Balanced" | "Growth" | "Aggressive";

export interface Advisor {
  id: string;
  name: string;
  title: string;
  email: string;
}

export interface Account {
  id: string;
  clientId: string;
  type: "Brokerage" | "Retirement" | "Trust" | "Savings" | "Mortgage" | "Business loan";
  name: string;
  number: string;
  balance: number;
  /** Year-to-date change as a ratio. */
  ytd: number;
  openedAt: string;
}

export interface Client {
  id: string;
  name: string;
  type: ClientType;
  company?: string;
  email: string;
  phone: string;
  location: string;
  segment: Segment;
  status: ClientStatus;
  risk: RiskProfile;
  advisorId: string;
  aum: number;
  since: string;
  lastContact: string;
  nextReview: string;
  tags: string[];
}

export type Stage = "Lead" | "Qualified" | "Proposal" | "Negotiation" | "Won" | "Lost";
export const STAGES: Stage[] = ["Lead", "Qualified", "Proposal", "Negotiation", "Won", "Lost"];

export type Product =
  | "Portfolio management"
  | "Retirement plan"
  | "Mortgage"
  | "Business loan"
  | "Estate planning"
  | "Insurance";

export interface Deal {
  id: string;
  title: string;
  clientId: string;
  product: Product;
  value: number;
  probability: number;
  stage: Stage;
  ownerId: string;
  closeDate: string;
  createdAt: string;
  notes?: string;
}

export type TaskType = "Call" | "Meeting" | "Review" | "Document" | "Email";
export type Priority = "High" | "Medium" | "Low";

export interface Task {
  id: string;
  title: string;
  type: TaskType;
  priority: Priority;
  clientId?: string;
  dealId?: string;
  assigneeId: string;
  dueAt: string;
  done: boolean;
}

export type ActivityKind = "call" | "meeting" | "email" | "note" | "deal" | "document" | "task";

export interface Activity {
  id: string;
  clientId: string;
  kind: ActivityKind;
  title: string;
  detail?: string;
  actorId: string;
  at: string;
}

export interface Note {
  id: string;
  clientId: string;
  body: string;
  authorId: string;
  at: string;
}

export interface Document {
  id: string;
  clientId: string;
  name: string;
  kind: "PDF" | "Spreadsheet" | "Image" | "Contract";
  size: string;
  uploadedAt: string;
}
