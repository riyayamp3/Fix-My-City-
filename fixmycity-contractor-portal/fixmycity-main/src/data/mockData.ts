export type Severity = "low" | "medium" | "high" | "critical";
export type JobStatus = "open" | "bid_submitted" | "awarded" | "accepted" | "en_route" | "in_progress" | "completed";
export type BidStatus = "pending" | "won" | "lost";
export type JobCategory = "Roads" | "Drainage" | "Electrical" | "Water" | "Sanitation" | "Parks";

export interface Job {
  id: string;
  title: string;
  description: string;
  category: JobCategory;
  location: string;
  ward: string;
  severity: Severity;
  deadline: string;
  status: JobStatus;
  postedDate: string;
  estimatedBudget?: string;
}

export interface Bid {
  id: string;
  jobId: string;
  jobTitle: string;
  amount?: number;
  completionTime: string;
  note: string;
  status: BidStatus;
  submittedDate: string;
}

export interface ActiveJob extends Job {
  currentStatus: "accepted" | "en_route" | "in_progress" | "completed";
  notes: string[];
  photos: string[];
  awardedDate: string;
}

export interface ActivityItem {
  id: string;
  type: "bid_submitted" | "job_awarded" | "status_change" | "job_completed";
  message: string;
  timestamp: string;
}

export const openJobs: Job[] = [
  {
    id: "J001",
    title: "Pothole Repair – MG Road",
    description: "Large pothole near MG Road junction causing traffic hazard. Approximately 2m x 1m, 30cm deep. Requires asphalt patching and compaction.",
    category: "Roads",
    location: "MG Road, Near Junction 4",
    ward: "Ward 12 – Koramangala",
    severity: "high",
    deadline: "2026-04-08",
    status: "open",
    postedDate: "2026-03-30",
    estimatedBudget: "₹45,000",
  },
  {
    id: "J002",
    title: "Streetlight Replacement – Jayanagar",
    description: "4 non-functional LED streetlights on 4th Block main road. Poles intact, fixtures need replacement.",
    category: "Electrical",
    location: "4th Block Main Road",
    ward: "Ward 34 – Jayanagar",
    severity: "medium",
    deadline: "2026-04-12",
    status: "open",
    postedDate: "2026-03-31",
    estimatedBudget: "₹28,000",
  },
  {
    id: "J003",
    title: "Storm Drain Clearing – Indiranagar",
    description: "Blocked storm drain causing waterlogging during rains. Needs debris removal and pipe inspection.",
    category: "Drainage",
    location: "100 Feet Road, Indiranagar",
    ward: "Ward 56 – Indiranagar",
    severity: "critical",
    deadline: "2026-04-05",
    status: "open",
    postedDate: "2026-03-29",
    estimatedBudget: "₹62,000",
  },
  {
    id: "J004",
    title: "Park Bench Installation – Cubbon Park",
    description: "Install 8 new concrete benches along the walking path. Foundation work and bench fixing required.",
    category: "Parks",
    location: "Cubbon Park, East Wing",
    ward: "Ward 89 – Shivajinagar",
    severity: "low",
    deadline: "2026-04-20",
    status: "open",
    postedDate: "2026-04-01",
    estimatedBudget: "₹1,20,000",
  },
  {
    id: "J005",
    title: "Water Pipe Leak – Malleshwaram",
    description: "Major water pipeline leak at 8th Cross. Water wastage and road erosion. Urgent repair needed.",
    category: "Water",
    location: "8th Cross, Malleshwaram",
    ward: "Ward 45 – Malleshwaram",
    severity: "critical",
    deadline: "2026-04-04",
    status: "open",
    postedDate: "2026-03-31",
    estimatedBudget: "₹55,000",
  },
  {
    id: "J006",
    title: "Public Toilet Maintenance – KR Market",
    description: "Sulabh complex requires plumbing repair, tile replacement, and deep cleaning.",
    category: "Sanitation",
    location: "KR Market, South Gate",
    ward: "Ward 22 – Chickpet",
    severity: "medium",
    deadline: "2026-04-10",
    status: "open",
    postedDate: "2026-04-01",
    estimatedBudget: "₹35,000",
  },
];

export const myBids: Bid[] = [
  {
    id: "B001",
    jobId: "J010",
    jobTitle: "Road Resurfacing – Whitefield Main Rd",
    amount: 185000,
    completionTime: "5 days",
    note: "Have all equipment ready. Can start immediately.",
    status: "pending",
    submittedDate: "2026-03-28",
  },
  {
    id: "B002",
    jobId: "J011",
    jobTitle: "Drainage Upgrade – HSR Layout",
    amount: 92000,
    completionTime: "3 days",
    note: "Experienced with similar drainage work in BTM Layout.",
    status: "won",
    submittedDate: "2026-03-25",
  },
  {
    id: "B003",
    jobId: "J012",
    jobTitle: "Streetlight Installation – Electronic City",
    amount: 45000,
    completionTime: "2 days",
    note: "Licensed electrician team available.",
    status: "lost",
    submittedDate: "2026-03-22",
  },
];

export const activeJobs: ActiveJob[] = [
  {
    id: "J020",
    title: "Manhole Cover Replacement – BTM Layout",
    description: "Replace 3 damaged manhole covers on 16th Main Road. Covers are cracked and pose pedestrian risk.",
    category: "Roads",
    location: "16th Main, BTM 2nd Stage",
    ward: "Ward 67 – BTM Layout",
    severity: "high",
    deadline: "2026-04-06",
    status: "awarded",
    currentStatus: "in_progress",
    postedDate: "2026-03-25",
    awardedDate: "2026-03-28",
    notes: ["Arrived at site, assessed damage", "Ordered replacement covers from vendor"],
    photos: [],
  },
  {
    id: "J021",
    title: "Tree Trimming – Sadashivanagar",
    description: "Overgrown branches blocking streetlights and power lines on 1st Main Road.",
    category: "Parks",
    location: "1st Main Road, Sadashivanagar",
    ward: "Ward 14 – Sadashivanagar",
    severity: "medium",
    deadline: "2026-04-09",
    status: "awarded",
    currentStatus: "accepted",
    postedDate: "2026-03-27",
    awardedDate: "2026-03-30",
    notes: [],
    photos: [],
  },
];

export const recentActivity: ActivityItem[] = [
  {
    id: "A001",
    type: "bid_submitted",
    message: "Bid submitted for Road Resurfacing – Whitefield",
    timestamp: "2 hours ago",
  },
  {
    id: "A002",
    type: "job_awarded",
    message: "You won the bid for Drainage Upgrade – HSR Layout",
    timestamp: "1 day ago",
  },
  {
    id: "A003",
    type: "status_change",
    message: "Manhole Cover Replacement status → In Progress",
    timestamp: "1 day ago",
  },
  {
    id: "A004",
    type: "job_completed",
    message: "Footpath Repair – Rajajinagar marked Complete",
    timestamp: "3 days ago",
  },
  {
    id: "A005",
    type: "bid_submitted",
    message: "Bid submitted for Streetlight Installation – E-City",
    timestamp: "5 days ago",
  },
];

export const contractorProfile = {
  name: "Rajesh Kumar",
  company: "Kumar Infrastructure Solutions",
  phone: "+91 98765 43210",
  email: "rajesh@kumarinfra.in",
  avatar: "RK",
  reputationScore: 87,
  timeliness: 92,
  quality: 85,
  jobsCompleted: 34,
  totalEarnings: "₹12,45,000",
  memberSince: "June 2024",
};
