export type Severity = "critical" | "medium" | "low";
export type Status = "open" | "in-progress" | "completed";
export type JobStatus = "open" | "in-progress" | "completed";

export interface Complaint {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: Severity;
  status: Status;
  location: string;
  lat: number;
  lng: number;
  image: string;
  reportedAt: string;
  aiCategory: string;
  aiSeverity: Severity;
}

export interface Job {
  id: string;
  complaintId: string;
  complaintTitle: string;
  status: JobStatus;
  bidsCount: number;
  eta: string;
  assignedTo?: string;
  createdAt: string;
}

export const complaints: Complaint[] = [
  {
    id: "CMP-001",
    title: "Massive pothole on Main Street",
    description: "A large pothole approximately 2 feet wide has formed on Main Street near the intersection with Oak Avenue. Multiple vehicles have reported tire damage.",
    category: "Roads",
    severity: "critical",
    status: "open",
    location: "Main St & Oak Ave",
    lat: 40.7128,
    lng: -74.006,
    image: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=400&h=300&fit=crop",
    reportedAt: "2024-03-15T08:30:00Z",
    aiCategory: "Road Infrastructure",
    aiSeverity: "critical",
  },
  {
    id: "CMP-002",
    title: "Broken street light on Elm Drive",
    description: "Street light #4521 on Elm Drive has been out for over a week. The area is very dark at night causing safety concerns for pedestrians.",
    category: "Lighting",
    severity: "medium",
    status: "in-progress",
    location: "Elm Drive, Block 12",
    lat: 40.7148,
    lng: -74.003,
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop",
    reportedAt: "2024-03-14T14:20:00Z",
    aiCategory: "Street Lighting",
    aiSeverity: "medium",
  },
  {
    id: "CMP-003",
    title: "Overflowing garbage bins at Central Park",
    description: "Multiple garbage bins at the Central Park south entrance have been overflowing for 3 days. Attracts pests and creates unsanitary conditions.",
    category: "Sanitation",
    severity: "medium",
    status: "open",
    location: "Central Park South",
    lat: 40.7112,
    lng: -74.008,
    image: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=400&h=300&fit=crop",
    reportedAt: "2024-03-13T09:15:00Z",
    aiCategory: "Waste Management",
    aiSeverity: "medium",
  },
  {
    id: "CMP-004",
    title: "Water pipe burst on 5th Avenue",
    description: "A water main has burst causing flooding on 5th Avenue between 42nd and 43rd Street. Water is spreading to nearby buildings.",
    category: "Water",
    severity: "critical",
    status: "in-progress",
    location: "5th Ave, 42nd-43rd St",
    lat: 40.7138,
    lng: -74.001,
    image: "https://images.unsplash.com/photo-1504297050568-910d24c426d3?w=400&h=300&fit=crop",
    reportedAt: "2024-03-15T06:45:00Z",
    aiCategory: "Water Infrastructure",
    aiSeverity: "critical",
  },
  {
    id: "CMP-005",
    title: "Graffiti on public library wall",
    description: "Vandals have spray-painted graffiti on the north wall of the Public Library. Covers approximately 20 square feet.",
    category: "Vandalism",
    severity: "low",
    status: "open",
    location: "Public Library, North Wall",
    lat: 40.7158,
    lng: -74.005,
    image: "https://images.unsplash.com/photo-1567095761054-7a02e69e5c43?w=400&h=300&fit=crop",
    reportedAt: "2024-03-12T11:30:00Z",
    aiCategory: "Public Property Damage",
    aiSeverity: "low",
  },
  {
    id: "CMP-006",
    title: "Fallen tree blocking sidewalk",
    description: "A large oak tree has fallen across the sidewalk on Maple Lane, completely blocking pedestrian access. Root system appears rotted.",
    category: "Trees",
    severity: "critical",
    status: "completed",
    location: "Maple Lane, Block 8",
    lat: 40.7168,
    lng: -74.009,
    image: "https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=400&h=300&fit=crop",
    reportedAt: "2024-03-10T16:00:00Z",
    aiCategory: "Urban Forestry",
    aiSeverity: "critical",
  },
  {
    id: "CMP-007",
    title: "Damaged pedestrian crossing signal",
    description: "The pedestrian crossing signal at Broadway and 34th is malfunctioning, showing walk signal during vehicle green phase.",
    category: "Traffic",
    severity: "critical",
    status: "open",
    location: "Broadway & 34th St",
    lat: 40.7098,
    lng: -74.004,
    image: "https://images.unsplash.com/photo-1517732306149-e8f829eb588a?w=400&h=300&fit=crop",
    reportedAt: "2024-03-15T10:00:00Z",
    aiCategory: "Traffic Safety",
    aiSeverity: "critical",
  },
  {
    id: "CMP-008",
    title: "Noise complaint from construction site",
    description: "Construction at the new development on River Road is operating outside permitted hours, starting work at 5 AM.",
    category: "Noise",
    severity: "low",
    status: "in-progress",
    location: "River Road, Lot 45",
    lat: 40.7178,
    lng: -74.002,
    image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&h=300&fit=crop",
    reportedAt: "2024-03-14T05:30:00Z",
    aiCategory: "Noise Violation",
    aiSeverity: "low",
  },
];

export const jobs: Job[] = [
  {
    id: "JOB-001",
    complaintId: "CMP-001",
    complaintTitle: "Massive pothole on Main Street",
    status: "open",
    bidsCount: 5,
    eta: "2024-03-20",
    createdAt: "2024-03-15T10:00:00Z",
  },
  {
    id: "JOB-002",
    complaintId: "CMP-002",
    complaintTitle: "Broken street light on Elm Drive",
    status: "in-progress",
    bidsCount: 3,
    eta: "2024-03-18",
    assignedTo: "CityLight Corp",
    createdAt: "2024-03-14T16:00:00Z",
  },
  {
    id: "JOB-003",
    complaintId: "CMP-004",
    complaintTitle: "Water pipe burst on 5th Avenue",
    status: "in-progress",
    bidsCount: 7,
    eta: "2024-03-16",
    assignedTo: "AquaFix LLC",
    createdAt: "2024-03-15T08:00:00Z",
  },
  {
    id: "JOB-004",
    complaintId: "CMP-006",
    complaintTitle: "Fallen tree blocking sidewalk",
    status: "completed",
    bidsCount: 4,
    eta: "2024-03-12",
    assignedTo: "GreenTeam Services",
    createdAt: "2024-03-10T18:00:00Z",
  },
  {
    id: "JOB-005",
    complaintId: "CMP-008",
    complaintTitle: "Noise complaint from construction site",
    status: "in-progress",
    bidsCount: 0,
    eta: "2024-03-17",
    assignedTo: "City Enforcement",
    createdAt: "2024-03-14T08:00:00Z",
  },
];

export const stats = {
  totalComplaints: 247,
  activeJobs: 18,
  completedIssues: 189,
  criticalAlerts: 12,
};
