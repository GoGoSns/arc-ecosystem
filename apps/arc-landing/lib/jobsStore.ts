import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type JobCategory = 'engineering' | 'design' | 'product' | 'marketing' | 'community' | 'business';
export type JobType = 'full-time' | 'part-time' | 'contract' | 'freelance';
export type ExperienceLevel = 'entry' | 'mid' | 'senior' | 'lead';
export type RemotePolicy = 'remote' | 'hybrid' | 'onsite';
export type JobStatus = 'open' | 'closed' | 'filled';

export interface Job {
  id: string;
  title: string;
  company: string;
  description: string;
  category: JobCategory;
  type: JobType;
  experienceLevel: ExperienceLevel;
  remotePolicy: RemotePolicy;
  location?: string;
  salaryMin: number;  // in USDC
  salaryMax: number;
  techStack: string[];
  benefits: string[];
  status: JobStatus;
  posterAddress: string;
  posterName?: string;
  createdAt: number;
  applicationCount: number;
}

export interface JobApplication {
  id: string;
  jobId: string;
  applicantAddress: string;
  applicantName?: string;
  email: string;
  coverLetter: string;
  portfolioUrl?: string;
  appliedAt: number;
}

const MOCK_JOBS: Job[] = [
  {
    id: 'job-1',
    title: 'Senior Solidity Engineer',
    company: 'Arc Labs',
    description: 'We are looking for a Senior Solidity Engineer to lead the development of our core protocol. You will be responsible for designing and implementing smart contracts that power the Arc Ecosystem.',
    category: 'engineering',
    type: 'full-time',
    experienceLevel: 'senior',
    remotePolicy: 'remote',
    salaryMin: 120000,
    salaryMax: 180000,
    techStack: ['Solidity', 'Foundry', 'TypeScript', 'Ethers.js'],
    benefits: ['Token incentives', 'Health insurance', 'Flexible hours', 'Remote setup stipend'],
    status: 'open',
    posterAddress: '0x1234567890123456789012345678901234567890',
    posterName: 'Alice',
    createdAt: Date.now() - 86400000 * 2,
    applicationCount: 5,
  },
  {
    id: 'job-2',
    title: 'Product Manager (USDC Rails)',
    company: 'StablePay',
    description: 'Lead the product strategy for our USDC-native payment rails. Work closely with engineering and design to build the future of global payments.',
    category: 'product',
    type: 'full-time',
    experienceLevel: 'lead',
    remotePolicy: 'hybrid',
    location: 'New York, NY',
    salaryMin: 140000,
    salaryMax: 200000,
    techStack: ['Agile', 'Product Discovery', 'SQL', 'Web3'],
    benefits: ['Equity', 'Unlimited PTO', 'Commuter benefits'],
    status: 'open',
    posterAddress: '0x2345678901234567890123456789012345678901',
    posterName: 'Bob',
    createdAt: Date.now() - 86400000 * 5,
    applicationCount: 12,
  },
  {
    id: 'job-3',
    title: 'UI/UX Designer',
    company: 'DeFi Pulse',
    description: 'Design intuitive interfaces for the next generation of DeFi users. Create wireframes, mockups, and prototypes for our web and mobile applications.',
    category: 'design',
    type: 'contract',
    experienceLevel: 'mid',
    remotePolicy: 'remote',
    salaryMin: 80000,
    salaryMax: 120000,
    techStack: ['Figma', 'Adobe Creative Suite', 'Prototyping'],
    benefits: ['Competitive hourly rate', 'Project bonuses', 'Flexible schedule'],
    status: 'open',
    posterAddress: '0x3456789012345678901234567890123456789012',
    posterName: 'Charlie',
    createdAt: Date.now() - 86400000 * 1,
    applicationCount: 3,
  },
  {
    id: 'job-4',
    title: 'Community Manager',
    company: 'Arc Play',
    description: 'Grow and engage our vibrant gaming community. Manage Discord, Twitter, and other social channels to build a strong brand presence.',
    category: 'community',
    type: 'full-time',
    experienceLevel: 'entry',
    remotePolicy: 'remote',
    salaryMin: 50000,
    salaryMax: 80000,
    techStack: ['Discord', 'Twitter', 'Content Creation'],
    benefits: ['Social events', 'Growth opportunities', 'Company merch'],
    status: 'open',
    posterAddress: '0x4567890123456789012345678901234567890123',
    posterName: 'Diana',
    createdAt: Date.now() - 86400000 * 3,
    applicationCount: 20,
  },
  {
    id: 'job-5',
    title: 'Rust Backend Developer',
    company: 'ChainLinkers',
    description: 'Build high-performance backend systems using Rust. Scale our infrastructure to support millions of transactions per second.',
    category: 'engineering',
    type: 'full-time',
    experienceLevel: 'senior',
    remotePolicy: 'remote',
    salaryMin: 150000,
    salaryMax: 220000,
    techStack: ['Rust', 'Tokio', 'PostgreSQL', 'Docker'],
    benefits: ['Relocation assistance', 'Conference budget', 'Fitness allowance'],
    status: 'open',
    posterAddress: '0x5678901234567890123456789012345678901234',
    posterName: 'Eve',
    createdAt: Date.now() - 86400000 * 7,
    applicationCount: 8,
  },
  {
    id: 'job-6',
    title: 'Marketing Lead',
    company: 'TokenTrend',
    description: 'Drive user acquisition and brand awareness for our token analysis platform. Develop and execute marketing campaigns across multiple channels.',
    category: 'marketing',
    type: 'full-time',
    experienceLevel: 'lead',
    remotePolicy: 'onsite',
    location: 'London, UK',
    salaryMin: 100000,
    salaryMax: 150000,
    techStack: ['Digital Marketing', 'SEO', 'Analytics'],
    benefits: ['Pension plan', 'Office snacks', 'Team retreats'],
    status: 'open',
    posterAddress: '0x6789012345678901234567890123456789012345',
    posterName: 'Frank',
    createdAt: Date.now() - 86400000 * 10,
    applicationCount: 15,
  },
  {
    id: 'job-7',
    title: 'Business Development Manager',
    company: 'WalletConnect',
    description: 'Identify and forge strategic partnerships with key players in the Web3 space. Drive growth through ecosystem integrations.',
    category: 'business',
    type: 'full-time',
    experienceLevel: 'senior',
    remotePolicy: 'hybrid',
    location: 'Berlin, DE',
    salaryMin: 90000,
    salaryMax: 140000,
    techStack: ['Salesforce', 'Partnership Management', 'Public Speaking'],
    benefits: ['Travel opportunities', 'Training budget', 'Home office setup'],
    status: 'open',
    posterAddress: '0x7890123456789012345678901234567890123456',
    posterName: 'Grace',
    createdAt: Date.now() - 86400000 * 4,
    applicationCount: 6,
  },
  {
    id: 'job-8',
    title: 'Full Stack Web3 Developer',
    company: 'Arc Creator',
    description: 'Build end-to-end features for Arc Creator. Work with Next.js, Tailwind CSS, and Web3 libraries to deliver a seamless user experience.',
    category: 'engineering',
    type: 'full-time',
    experienceLevel: 'mid',
    remotePolicy: 'remote',
    salaryMin: 100000,
    salaryMax: 150000,
    techStack: ['Next.js', 'React', 'Tailwind CSS', 'Wagmi'],
    benefits: ['Learning stipend', 'Modern tech stack', 'Mentorship'],
    status: 'open',
    posterAddress: '0x8901234567890123456789012345678901234567',
    posterName: 'Hank',
    createdAt: Date.now() - 86400000 * 2,
    applicationCount: 9,
  },
];

interface JobsStore {
  jobs: Job[];
  applications: JobApplication[];
  addJob: (job: Omit<Job, 'id' | 'createdAt' | 'applicationCount' | 'status'>) => void;
  applyForJob: (application: Omit<JobApplication, 'id' | 'appliedAt'>) => void;
  getJobById: (id: string) => Job | undefined;
  getApplicationsByAddress: (address: string) => (JobApplication & { jobTitle: string; company: string })[];
  getApplicationsForJob: (jobId: string) => JobApplication[];
}

export const useJobsStore = create<JobsStore>()(
  persist(
    (set, get) => ({
      jobs: MOCK_JOBS,
      applications: [],
      addJob: (jobData) => {
        const newJob: Job = {
          ...jobData,
          id: `job-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: Date.now(),
          applicationCount: 0,
          status: 'open',
        };
        set((state) => ({ jobs: [newJob, ...state.jobs] }));
      },
      applyForJob: (appData) => {
        const newApp: JobApplication = {
          ...appData,
          id: `app-${Math.random().toString(36).substr(2, 9)}`,
          appliedAt: Date.now(),
        };
        set((state) => {
          const updatedJobs = state.jobs.map((job) =>
            job.id === appData.jobId
              ? { ...job, applicationCount: job.applicationCount + 1 }
              : job
          );
          return {
            applications: [...state.applications, newApp],
            jobs: updatedJobs,
          };
        });
      },
      getJobById: (id) => get().jobs.find((j) => j.id === id),
      getApplicationsByAddress: (address) => {
        const addr = address.toLowerCase();
        return get().applications
          .filter((app) => app.applicantAddress.toLowerCase() === addr)
          .map((app) => {
            const job = get().jobs.find((j) => j.id === app.jobId);
            return {
              ...app,
              jobTitle: job?.title || 'Unknown Job',
              company: job?.company || 'Unknown Company',
            };
          });
      },
      getApplicationsForJob: (jobId) =>
        get().applications.filter((app) => app.jobId === jobId),
    }),
    {
      name: 'arclanding:jobs',
    }
  )
);
