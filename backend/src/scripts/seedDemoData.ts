import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User';
import Event from '../models/Event';
import EventRsvp from '../models/EventRsvp';
import Donation from '../models/Donation';
import Announcement from '../models/Announcement';
import MentorshipRequest from '../models/MentorshipRequest';
import MentorshipSession from '../models/MentorshipSession';
import Message from '../models/Message';
import Notification from '../models/Notification';

dotenv.config();

type DemoUserSeed = {
  name: string;
  email: string;
  graduationYear: number;
  department: string;
  employmentStatus: 'employed' | 'self-employed' | 'student' | 'seeking-opportunities';
  jobTitle: string;
  company: string;
  location: string;
  bio: string;
  linkedIn?: string;
  openToMentorship: boolean;
  mentorshipTopics: string[];
  skills: string[];
  mentorshipAvailability: 'not-available' | 'weekdays-evenings' | 'weekends' | 'flexible';
  mentorshipCapacity: number;
};

const DEMO_PASSWORD = process.env.DEMO_USER_PASSWORD || 'Test@12345';
const TARGET_DEMO_ALUMNI_COUNT = 60;

const demoUsers: DemoUserSeed[] = [
  {
    name: 'Chiamaka Okafor',
    email: 'chiamaka.okafor@alumni.demo',
    graduationYear: 2015,
    department: 'Computer Science',
    employmentStatus: 'employed',
    jobTitle: 'Senior Product Designer',
    company: 'Paystack',
    location: 'Lagos',
    bio: 'Design leader focused on fintech experiences, design systems, and mentorship for junior creatives.',
    linkedIn: 'https://www.linkedin.com/in/chiamaka-okafor',
    openToMentorship: true,
    mentorshipTopics: ['Product design', 'Portfolio review', 'Career growth'],
    skills: ['Figma', 'User research', 'Design systems'],
    mentorshipAvailability: 'weekdays-evenings',
    mentorshipCapacity: 3
  },
  {
    name: 'Tosin Adeyemi',
    email: 'tosin.adeyemi@alumni.demo',
    graduationYear: 2014,
    department: 'Computer Engineering',
    employmentStatus: 'employed',
    jobTitle: 'Engineering Manager',
    company: 'Flutterwave',
    location: 'Abuja',
    bio: 'Engineering manager helping teams ship reliable products and scale backend architecture.',
    openToMentorship: true,
    mentorshipTopics: ['Backend architecture', 'Leadership', 'Interview prep'],
    skills: ['Node.js', 'System design', 'People management'],
    mentorshipAvailability: 'flexible',
    mentorshipCapacity: 4
  },
  {
    name: 'Ijeoma Nwosu',
    email: 'ijeoma.nwosu@alumni.demo',
    graduationYear: 2018,
    department: 'Information Systems',
    employmentStatus: 'employed',
    jobTitle: 'Data Analyst',
    company: 'Andela',
    location: 'Port Harcourt',
    bio: 'Data storyteller with a passion for analytics dashboards and data-driven growth decisions.',
    openToMentorship: true,
    mentorshipTopics: ['Data analytics', 'SQL', 'Career transition'],
    skills: ['SQL', 'Power BI', 'Python'],
    mentorshipAvailability: 'weekdays-evenings',
    mentorshipCapacity: 2
  },
  {
    name: 'Emeka Obi',
    email: 'emeka.obi@alumni.demo',
    graduationYear: 2013,
    department: 'Electrical Engineering',
    employmentStatus: 'self-employed',
    jobTitle: 'Founder',
    company: 'GridSpark Energy',
    location: 'Enugu',
    bio: 'Founder building renewable energy products and mentoring early-stage founders.',
    openToMentorship: true,
    mentorshipTopics: ['Startups', 'Fundraising', 'Execution'],
    skills: ['Product strategy', 'Operations', 'Pitching'],
    mentorshipAvailability: 'weekends',
    mentorshipCapacity: 2
  },
  {
    name: 'Amarachi Umeh',
    email: 'amarachi.umeh@alumni.demo',
    graduationYear: 2019,
    department: 'Mass Communication',
    employmentStatus: 'employed',
    jobTitle: 'Brand Strategist',
    company: 'Nestle Nigeria',
    location: 'Lagos',
    bio: 'Brand strategist specializing in storytelling campaigns and high-impact communications.',
    openToMentorship: true,
    mentorshipTopics: ['Brand strategy', 'Content marketing'],
    skills: ['Storytelling', 'Campaign planning', 'Public speaking'],
    mentorshipAvailability: 'weekdays-evenings',
    mentorshipCapacity: 2
  },
  {
    name: 'Femi Adebayo',
    email: 'femi.adebayo@alumni.demo',
    graduationYear: 2012,
    department: 'Business Administration',
    employmentStatus: 'employed',
    jobTitle: 'Operations Director',
    company: 'Interswitch',
    location: 'Ibadan',
    bio: 'Operations leader improving execution discipline and scaling business processes.',
    openToMentorship: false,
    mentorshipTopics: [],
    skills: ['Operations', 'Business analysis', 'Process design'],
    mentorshipAvailability: 'not-available',
    mentorshipCapacity: 1
  },
  {
    name: 'Ngozi Eze',
    email: 'ngozi.eze@alumni.demo',
    graduationYear: 2020,
    department: 'Accounting',
    employmentStatus: 'employed',
    jobTitle: 'Finance Associate',
    company: 'KPMG Nigeria',
    location: 'Lagos',
    bio: 'Finance professional with interests in reporting automation and startup finance.',
    openToMentorship: true,
    mentorshipTopics: ['Finance careers', 'Professional development'],
    skills: ['Financial modeling', 'Excel', 'Reporting'],
    mentorshipAvailability: 'weekends',
    mentorshipCapacity: 1
  },
  {
    name: 'Uchechukwu Nnamdi',
    email: 'uchechukwu.nnamdi@alumni.demo',
    graduationYear: 2017,
    department: 'Mechanical Engineering',
    employmentStatus: 'employed',
    jobTitle: 'Project Engineer',
    company: 'Dangote Group',
    location: 'Kaduna',
    bio: 'Project engineer delivering large-scale industrial projects and coaching young engineers.',
    openToMentorship: true,
    mentorshipTopics: ['Engineering careers', 'Project delivery'],
    skills: ['Project management', 'CAD', 'Team coordination'],
    mentorshipAvailability: 'weekends',
    mentorshipCapacity: 2
  },
  {
    name: 'Blessing Ojo',
    email: 'blessing.ojo@alumni.demo',
    graduationYear: 2021,
    department: 'Economics',
    employmentStatus: 'student',
    jobTitle: 'MBA Candidate',
    company: 'University of Lagos',
    location: 'Lagos',
    bio: 'Early-career analyst pursuing an MBA and exploring opportunities in consulting.',
    openToMentorship: false,
    mentorshipTopics: [],
    skills: ['Research', 'Analysis', 'Communication'],
    mentorshipAvailability: 'not-available',
    mentorshipCapacity: 1
  },
  {
    name: 'Damilola Sanni',
    email: 'damilola.sanni@alumni.demo',
    graduationYear: 2016,
    department: 'Computer Science',
    employmentStatus: 'employed',
    jobTitle: 'Frontend Engineer',
    company: 'Moniepoint',
    location: 'Lagos',
    bio: 'Frontend engineer building web experiences for financial products across Africa.',
    openToMentorship: true,
    mentorshipTopics: ['React', 'Frontend architecture'],
    skills: ['React', 'TypeScript', 'Performance optimization'],
    mentorshipAvailability: 'weekdays-evenings',
    mentorshipCapacity: 3
  },
  {
    name: 'Kelechi Madu',
    email: 'kelechi.madu@alumni.demo',
    graduationYear: 2011,
    department: 'Civil Engineering',
    employmentStatus: 'employed',
    jobTitle: 'Infrastructure Consultant',
    company: 'Julius Berger',
    location: 'Abuja',
    bio: 'Infrastructure consultant working on roads and public facility projects.',
    openToMentorship: false,
    mentorshipTopics: [],
    skills: ['Infrastructure planning', 'Site management', 'Documentation'],
    mentorshipAvailability: 'not-available',
    mentorshipCapacity: 1
  },
  {
    name: 'Aisha Bello',
    email: 'aisha.bello@alumni.demo',
    graduationYear: 2019,
    department: 'Biochemistry',
    employmentStatus: 'seeking-opportunities',
    jobTitle: 'Research Assistant',
    company: 'Self-directed',
    location: 'Kano',
    bio: 'Research-minded alumna transitioning into health-tech operations roles.',
    openToMentorship: true,
    mentorshipTopics: ['Career transition', 'CV review'],
    skills: ['Research', 'Documentation', 'Teamwork'],
    mentorshipAvailability: 'flexible',
    mentorshipCapacity: 1
  }
];

const nigerianFirstNames = [
  'Adebimpe', 'Adenike', 'Adesola', 'Amaka', 'Amarachi', 'Amina', 'Bisi', 'Bolanle', 'Chidera', 'Chinaza',
  'Chinonso', 'Chisom', 'Ebuka', 'Efe', 'Ejiro', 'Emmanuel', 'Eniola', 'Ezinne', 'Favour', 'Folake',
  'Gbenga', 'Halima', 'Ibrahim', 'Ifeanyi', 'Ihuoma', 'Inioluwa', 'Ireti', 'Kehinde', 'Khadijat', 'Kingsley',
  'Mayowa', 'Mfon', 'Ndidiamaka', 'Ndubisi', 'Nkechi', 'Nnamdi', 'Obinna', 'Ololade', 'Oluwadamilola', 'Oluwaseun',
  'Onome', 'Opeyemi', 'Osas', 'Rasheedat', 'Sade', 'Segun', 'Temidayo', 'Titilayo', 'Uchenna', 'Yemisi'
];

const nigerianLastNames = [
  'Abiola', 'Adegoke', 'Akinola', 'Ameh', 'Anyanwu', 'Babatunde', 'Balogun', 'Danjuma', 'Ekanem', 'Ekwueme',
  'Eze', 'Fashina', 'Ibrahim', 'Igbinedion', 'Iloanusi', 'Isibor', 'James', 'Lawal', 'Madu', 'Mba',
  'Ndukwe', 'Nnaji', 'Nwankwo', 'Nwosu', 'Obasi', 'Obinna', 'Ogundele', 'Okafor', 'Okeke', 'Okoli',
  'Olawale', 'Olatunji', 'Onwuka', 'Oyedepo', 'Sanni', 'Shittu', 'Udo', 'Ugwu', 'Umeh', 'Yakubu'
];

const nigerianCities = [
  'Lagos', 'Abuja', 'Port Harcourt', 'Ibadan', 'Enugu', 'Kano', 'Kaduna', 'Abeokuta', 'Benin City', 'Jos'
];

const departments = [
  'Computer Science', 'Computer Engineering', 'Information Systems', 'Business Administration', 'Accounting',
  'Economics', 'Mass Communication', 'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering', 'Biochemistry'
];

const companies = [
  'Paystack', 'Flutterwave', 'Moniepoint', 'Interswitch', 'Andela', 'KPMG Nigeria', 'Access Bank', 'GTBank',
  'Deloitte Nigeria', 'MTN Nigeria', 'Dangote Group', 'Jumia Nigeria', 'Sterling Bank', 'UBA', 'Nestle Nigeria'
];

const jobTitles = [
  'Software Engineer', 'Product Manager', 'Data Analyst', 'Business Analyst', 'DevOps Engineer', 'Project Manager',
  'Frontend Engineer', 'Backend Engineer', 'Finance Analyst', 'Operations Associate', 'UX Designer', 'Marketing Strategist'
];

const topicBank = [
  'Career growth', 'Interview prep', 'Product design', 'Frontend architecture', 'Backend development', 'Data analytics',
  'Leadership', 'Business strategy', 'Communication', 'Portfolio review', 'Cloud engineering', 'Startup execution'
];

const skillBank = [
  'TypeScript', 'React', 'Node.js', 'SQL', 'Python', 'Figma', 'Project management', 'Public speaking',
  'Data visualization', 'System design', 'Stakeholder management', 'Financial modeling'
];

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '.')
    .replace(/-+/g, '.');

const buildGeneratedDemoUsers = (count: number): DemoUserSeed[] => {
  const generated: DemoUserSeed[] = [];

  for (let i = 0; i < count; i += 1) {
    const firstName = pick(nigerianFirstNames, i);
    const lastName = pick(nigerianLastNames, i + 7);
    const fullName = `${firstName} ${lastName}`;
    const emailBase = slugify(fullName);

    generated.push({
      name: fullName,
      email: `${emailBase}.${i + 1}@alumni.demo`,
      graduationYear: 2010 + (i % 15),
      department: pick(departments, i),
      employmentStatus: i % 11 === 0 ? 'seeking-opportunities' : i % 9 === 0 ? 'student' : i % 5 === 0 ? 'self-employed' : 'employed',
      jobTitle: pick(jobTitles, i),
      company: pick(companies, i + 4),
      location: pick(nigerianCities, i),
      bio: `${fullName} is an active alumnus contributing to the Covenant alumni network through events, mentorship, and career collaboration.`,
      linkedIn: `https://www.linkedin.com/in/${emailBase}-${i + 1}`,
      openToMentorship: i % 4 !== 0,
      mentorshipTopics: [pick(topicBank, i), pick(topicBank, i + 3)],
      skills: [pick(skillBank, i), pick(skillBank, i + 2), pick(skillBank, i + 5)],
      mentorshipAvailability: i % 3 === 0 ? 'weekdays-evenings' : i % 3 === 1 ? 'weekends' : 'flexible',
      mentorshipCapacity: (i % 4) + 1
    });
  }

  return generated;
};

const allDemoUsers: DemoUserSeed[] = [
  ...demoUsers,
  ...buildGeneratedDemoUsers(Math.max(0, TARGET_DEMO_ALUMNI_COUNT - demoUsers.length))
];

const eventSeeds = [
  {
    title: 'Lagos Alumni Networking Mixer',
    description: 'A city-wide mixer bringing alumni founders, professionals, and recent graduates together for collaboration.',
    dateOffsetDays: 7,
    location: 'Landmark Event Centre, Lagos',
    organizer: 'Alumni Affairs Office',
    maxAttendees: 250,
    status: 'upcoming' as const
  },
  {
    title: 'Career Acceleration Bootcamp',
    description: 'Hands-on workshops on CV optimization, technical interviews, and salary negotiation for early and mid-level alumni.',
    dateOffsetDays: 21,
    location: 'Covenant University Extension Hub, Lagos',
    organizer: 'Career Services Team',
    maxAttendees: 180,
    status: 'upcoming' as const
  },
  {
    title: 'Abuja Tech & Product Roundtable',
    description: 'Quarterly roundtable for alumni in technology, product, and data roles to share insights and opportunities.',
    dateOffsetDays: 35,
    location: 'Transcorp Hilton, Abuja',
    organizer: 'Technology Alumni Chapter',
    maxAttendees: 120,
    status: 'upcoming' as const
  },
  {
    title: 'Alumni Impact Summit 2026',
    description: 'Signature summit highlighting alumni achievements, mentorship impact, and strategic giving initiatives.',
    dateOffsetDays: 50,
    location: 'Main Auditorium, Covenant University',
    organizer: 'Alumni Relations Directorate',
    maxAttendees: 500,
    status: 'upcoming' as const
  },
  {
    title: 'Women in Leadership Fireside',
    description: 'Leadership stories and practical strategies from accomplished alumnae across industries.',
    dateOffsetDays: -5,
    location: 'Radisson Blu, Ikeja',
    organizer: 'Women Alumni Network',
    maxAttendees: 140,
    status: 'completed' as const
  },
  {
    title: 'Mentor Match Day',
    description: 'Structured mentor-mentee pairing sessions with panel Q&A and follow-up clinics.',
    dateOffsetDays: -18,
    location: 'Innovation Centre, Covenant University',
    organizer: 'Mentorship Program Team',
    maxAttendees: 200,
    status: 'completed' as const
  }
];

const announcementSeeds = [
  {
    title: 'Welcome to the Alumni Platform 2026',
    content: 'We are excited to welcome all returning and new alumni to a more connected platform. Update your profile and explore mentorship opportunities this month.',
    category: 'general' as const,
    isPinned: true,
    views: 214
  },
  {
    title: 'Applications Open: Alumni Career Accelerator',
    content: 'Applications are now open for the 6-week career accelerator focused on interview preparation and role transition planning.',
    category: 'opportunity' as const,
    isPinned: true,
    views: 173
  },
  {
    title: 'Alumni Impact Summit Registration Live',
    content: 'Registration is now live for Alumni Impact Summit 2026. Reserve your seat early as capacity is limited.',
    category: 'event' as const,
    isPinned: false,
    views: 121
  },
  {
    title: 'Celebrating 100 New Mentorship Matches',
    content: 'Our mentorship program crossed 100 active mentor-mentee matches this quarter. Thank you to everyone who volunteered time and expertise.',
    category: 'achievement' as const,
    isPinned: false,
    views: 98
  },
  {
    title: 'Quarterly Giving Campaign Update',
    content: 'Donations from alumni this quarter are funding student support grants, startup projects, and skills labs.',
    category: 'general' as const,
    isPinned: false,
    views: 88
  }
];

const donationPurposes = [
  'General Fund',
  'Student Scholarships',
  'Innovation Lab',
  'Library Upgrade',
  'Mentorship Program'
];

const messageSeeds = [
  {
    subject: 'Great connecting at the networking mixer',
    body: 'Hi, it was great meeting you at the alumni mixer. I would love to continue our discussion on product roles next week.'
  },
  {
    subject: 'Mentorship follow-up',
    body: 'Thank you for the session yesterday. I have started working on the action items we discussed and will share progress before our next call.'
  },
  {
    subject: 'Referral request for backend role',
    body: 'I saw an opening on your team and I would appreciate a referral if my profile aligns. Happy to share my updated CV.'
  },
  {
    subject: 'Collaboration on community project',
    body: 'Our chapter is launching a community project and we would love to have your support on planning and execution.'
  }
];

function pick<T>(items: T[], index: number): T {
  return items[index % items.length];
}

function createDateFromOffset(daysOffset: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date;
}

async function upsertDemoUsers(): Promise<Map<string, mongoose.Types.ObjectId>> {
  const idMap = new Map<string, mongoose.Types.ObjectId>();

  for (const seed of allDemoUsers) {
    const existing = await User.findOne({ email: seed.email });

    if (existing) {
      existing.name = seed.name;
      existing.role = 'alumni';
      existing.graduationYear = seed.graduationYear;
      existing.department = seed.department;
      existing.employmentStatus = seed.employmentStatus;
      existing.jobTitle = seed.jobTitle;
      existing.company = seed.company;
      existing.location = seed.location;
      existing.bio = seed.bio;
      existing.linkedIn = seed.linkedIn;
      existing.openToMentorship = seed.openToMentorship;
      existing.mentorshipTopics = seed.mentorshipTopics;
      existing.skills = seed.skills;
      existing.mentorshipAvailability = seed.mentorshipAvailability;
      existing.mentorshipCapacity = seed.mentorshipCapacity;
      await existing.save();
      idMap.set(seed.email, existing._id as mongoose.Types.ObjectId);
      continue;
    }

    const created = await User.create({
      name: seed.name,
      email: seed.email,
      password: DEMO_PASSWORD,
      role: 'alumni',
      graduationYear: seed.graduationYear,
      department: seed.department,
      employmentStatus: seed.employmentStatus,
      jobTitle: seed.jobTitle,
      company: seed.company,
      location: seed.location,
      bio: seed.bio,
      linkedIn: seed.linkedIn,
      openToMentorship: seed.openToMentorship,
      mentorshipTopics: seed.mentorshipTopics,
      skills: seed.skills,
      mentorshipAvailability: seed.mentorshipAvailability,
      mentorshipCapacity: seed.mentorshipCapacity
    });

    idMap.set(seed.email, created._id as mongoose.Types.ObjectId);
  }

  return idMap;
}

async function getAdminId(): Promise<mongoose.Types.ObjectId> {
  const adminEmail = String(process.env.ADMIN_EMAIL || 'admin@example.com').trim().toLowerCase();
  const admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    throw new Error(`Admin account not found (${adminEmail}). Start backend once so admin bootstrap can run.`);
  }
  return admin._id as mongoose.Types.ObjectId;
}

async function seedAnnouncements(adminId: mongoose.Types.ObjectId): Promise<void> {
  const generatedAnnouncements = Array.from({ length: 12 }).map((_, index) => ({
    title: `Community Update ${index + 1}: ${pick(['Career', 'Mentorship', 'Events', 'Giving', 'Partnerships'], index)} Highlights`,
    content: `This is a monthly alumni community update covering participation growth, chapter activities, and opportunities for collaboration. Edition ${index + 1}.`,
    category: pick(['general', 'event', 'opportunity', 'achievement'], index) as 'general' | 'event' | 'opportunity' | 'achievement',
    isPinned: index < 2,
    views: 120 + index * 11
  }));

  const allAnnouncements = [...announcementSeeds, ...generatedAnnouncements];

  await Announcement.deleteMany({ title: { $in: allAnnouncements.map((a) => a.title) } });

  await Announcement.insertMany(
    allAnnouncements.map((item) => ({
      title: item.title,
      content: item.content,
      category: item.category,
      isPinned: item.isPinned,
      views: item.views,
      author: adminId
    }))
  );
}

async function seedEventsAndRsvps(
  adminId: mongoose.Types.ObjectId,
  userIds: mongoose.Types.ObjectId[]
): Promise<mongoose.Types.ObjectId[]> {
  const generatedEvents = Array.from({ length: 12 }).map((_, index) => ({
    title: `Alumni Chapter Meetup ${index + 1}`,
    description: 'Chapter meetup focused on networking, professional growth, and collaboration opportunities.',
    dateOffsetDays: -180 + index * 21,
    location: `${pick(nigerianCities, index)} Chapter Hub`,
    organizer: `${pick(['Tech', 'Finance', 'Healthcare', 'Entrepreneurship'], index)} Alumni Chapter`,
    maxAttendees: 100 + (index % 4) * 30,
    status: index > 8 ? ('upcoming' as const) : ('completed' as const)
  }));

  const allEventSeeds = [...eventSeeds, ...generatedEvents];

  const existingDemoEvents = await Event.find({ title: { $in: allEventSeeds.map((event) => event.title) } }).select('_id');
  const existingIds = existingDemoEvents.map((event) => event._id);

  if (existingIds.length > 0) {
    await EventRsvp.deleteMany({ event: { $in: existingIds } });
    await Event.deleteMany({ _id: { $in: existingIds } });
  }

  const createdEvents = await Event.insertMany(
    allEventSeeds.map((event, index) => ({
      title: event.title,
      description: event.description,
      date: createDateFromOffset(event.dateOffsetDays),
      location: event.location,
      organizer: event.organizer,
      maxAttendees: event.maxAttendees,
      status: event.status,
      createdBy: index % 2 === 0 ? adminId : pick(userIds, index),
      attendees: []
    }))
  );

  for (let eventIndex = 0; eventIndex < createdEvents.length; eventIndex += 1) {
    const event = createdEvents[eventIndex];
    const attendeeCount = 18 + (eventIndex % 9);
    const attendees: mongoose.Types.ObjectId[] = [];

    for (let i = 0; i < attendeeCount; i += 1) {
      attendees.push(pick(userIds, eventIndex + i));
    }

    await Event.findByIdAndUpdate(event._id, { attendees });

    for (let attendeeIndex = 0; attendeeIndex < attendees.length; attendeeIndex += 1) {
      const attendeeId = attendees[attendeeIndex];
      const checkedInForPastEvent = event.status === 'completed' && attendeeIndex < Math.ceil(attendees.length * 0.55);

      await EventRsvp.create({
        event: event._id,
        user: attendeeId,
        status: 'going',
        checkedInAt: checkedInForPastEvent ? createDateFromOffset(-3) : undefined,
        checkedInBy: checkedInForPastEvent ? adminId : undefined
      });
    }
  }

  return createdEvents.map((event) => event._id as mongoose.Types.ObjectId);
}

async function seedDonations(userIds: mongoose.Types.ObjectId[]): Promise<void> {
  await Donation.deleteMany({ transactionId: { $regex: '^NG-DEMO-' } });

  const donations = Array.from({ length: 220 }).map((_, index) => {
    const createdAt = createDateFromOffset(-(index % 320));
    const month = createdAt.getMonth();
    const seasonalMultiplier = month === 11 ? 2.2 : month === 8 ? 1.7 : month === 3 ? 1.4 : 1;
    const baseAmount = 20000 + (index % 18) * 15000;
    const amount = Math.round(baseAmount * seasonalMultiplier);

    return {
      alumniId: pick(userIds, index),
      amount,
      currency: 'NGN',
      paymentMethod: pick(['credit_card', 'bank_transfer', 'debit_card', 'paypal'], index),
      paymentStatus: index % 19 === 0 ? 'pending' : index % 37 === 0 ? 'failed' : 'completed',
      transactionId: `NG-DEMO-${String(index + 1).padStart(4, '0')}`,
      purpose: pick(donationPurposes, index),
      message: index % 4 === 0 ? 'Proud to give back and support the next generation of Eagles.' : undefined,
      isAnonymous: index % 6 === 0,
      createdAt,
      updatedAt: createdAt
    };
  });

  await Donation.insertMany(donations);
}

async function seedMentorship(
  adminId: mongoose.Types.ObjectId,
  userIds: mongoose.Types.ObjectId[]
): Promise<void> {
  await MentorshipSession.deleteMany({
    $or: [
      { mentor: { $in: userIds } },
      { mentee: { $in: userIds } }
    ]
  });

  await MentorshipRequest.deleteMany({
    $or: [
      { mentor: { $in: userIds } },
      { mentee: { $in: userIds } }
    ]
  });

  const mentorshipRequests = Array.from({ length: 55 }).map((_, index) => {
    const status = index % 4 === 0 ? 'pending' : index % 5 === 0 ? 'rejected' : 'accepted';
    return {
      mentor: pick(userIds, index),
      mentee: pick(userIds, index + 11),
      goals: `I want guidance on ${pick(['career progression', 'technical depth', 'leadership growth', 'transitioning roles'], index)} and measurable monthly milestones.`,
      message: 'I am committed to weekly follow-up and execution on agreed action items.',
      status: status as 'pending' | 'accepted' | 'rejected'
    };
  });

  const createdRequests = await MentorshipRequest.insertMany(
    mentorshipRequests.map((request, index) => ({
      ...request,
      respondedAt: request.status === 'accepted' ? createDateFromOffset(-(index + 2)) : undefined,
      createdAt: createDateFromOffset(-(index + 5)),
      updatedAt: createDateFromOffset(-(index + 2))
    }))
  );

  const acceptedRequests = createdRequests.filter((item) => item.status === 'accepted');

  await MentorshipSession.insertMany(
    acceptedRequests.slice(0, 28).map((request, index) => ({
      mentorshipRequest: request._id,
      mentor: request.mentor,
      mentee: request.mentee,
      scheduledFor: createDateFromOffset(index % 2 === 0 ? (index + 2) : -(index % 12)),
      durationMinutes: 45 + (index % 3) * 15,
      agenda: 'Career roadmap review, goals alignment, and next 30-day action plan.',
      meetingLink: 'https://meet.google.com/demo-alumni-session',
      status: index % 6 === 0 ? 'completed' : 'scheduled',
      scheduledBy: adminId,
      completedAt: index % 6 === 0 ? createDateFromOffset(-(index % 10)) : undefined,
      createdAt: createDateFromOffset(-(index % 60)),
      updatedAt: createDateFromOffset(-(index % 30))
    }))
  );
}

async function seedMessagesAndNotifications(
  userIds: mongoose.Types.ObjectId[],
  eventIds: mongoose.Types.ObjectId[]
): Promise<void> {
  await Message.deleteMany({
    $or: [
      { sender: { $in: userIds } },
      { receiver: { $in: userIds } }
    ]
  });

  await Notification.deleteMany({ user: { $in: userIds } });

  const messages = Array.from({ length: 260 }).map((_, index) => {
    const sender = pick(userIds, index);
    const receiver = pick(userIds, index + 3);
    const seed = pick(messageSeeds, index);

    return {
      sender,
      receiver,
      subject: seed.subject,
      message: seed.body,
      isRead: index % 5 !== 0,
      createdAt: createDateFromOffset(-(index % 240)),
      updatedAt: createDateFromOffset(-(index % 220))
    };
  });

  await Message.insertMany(messages);

  const notifications = userIds.flatMap((userId, index) => [
    {
      user: userId,
      type: 'message:new' as const,
      title: 'New message received',
      body: 'You have a new message from an alumnus in your network.',
      metadata: { priority: 'normal' },
      isRead: index % 2 === 0,
      createdAt: createDateFromOffset(-(index % 40)),
      updatedAt: createDateFromOffset(-(index % 40))
    },
    {
      user: userId,
      type: 'event:rsvp' as const,
      title: 'Event RSVP confirmed',
      body: 'Your RSVP has been confirmed. We look forward to seeing you there.',
      metadata: { eventId: pick(eventIds, index).toString() },
      isRead: index % 3 === 0,
      createdAt: createDateFromOffset(-(index % 60)),
      updatedAt: createDateFromOffset(-(index % 60))
    },
    {
      user: userId,
      type: 'mentorship:request' as const,
      title: 'Mentorship request activity',
      body: 'A mentorship request has been updated. Review and respond on your dashboard.',
      metadata: { category: 'mentorship' },
      isRead: false,
      createdAt: createDateFromOffset(-(index % 35)),
      updatedAt: createDateFromOffset(-(index % 35))
    },
    {
      user: userId,
      type: 'mentorship:session' as const,
      title: 'Mentorship session scheduled',
      body: 'A session was scheduled with your mentorship partner this week.',
      metadata: { source: 'seed-demo' },
      isRead: index % 4 === 0,
      createdAt: createDateFromOffset(-(index % 45)),
      updatedAt: createDateFromOffset(-(index % 45))
    },
    {
      user: userId,
      type: 'message:new' as const,
      title: 'Community message digest',
      body: 'You have unread conversations from your alumni chapter peers.',
      metadata: { digest: true },
      isRead: index % 7 === 0,
      createdAt: createDateFromOffset(-(index % 75)),
      updatedAt: createDateFromOffset(-(index % 75))
    }
  ]);

  await Notification.insertMany(notifications);
}

async function run(): Promise<void> {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error('MONGODB_URI is not configured.');
  }

  await mongoose.connect(mongoUri);

  const adminId = await getAdminId();
  const demoUserIdMap = await upsertDemoUsers();
  const userIds = Array.from(demoUserIdMap.values());

  await seedAnnouncements(adminId);
  const eventIds = await seedEventsAndRsvps(adminId, userIds);
  await seedDonations(userIds);
  await seedMentorship(adminId, userIds);
  await seedMessagesAndNotifications(userIds, eventIds);

  console.log('✅ Demo data seeded successfully');
  console.log(`- Alumni: ${userIds.length}`);
  console.log(`- Events: ${eventIds.length}`);
  console.log('- Donations, announcements, mentorship records, messages, and notifications created');

  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error('❌ Demo seed failed:', error);
  await mongoose.disconnect();
  process.exit(1);
});
