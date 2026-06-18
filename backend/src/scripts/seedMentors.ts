import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User';

dotenv.config();

const mentors = [
  {
    name: 'Ada Nwosu',
    email: 'mentor.ada@alumni.demo',
    password: 'Test@12345',
    graduationYear: 2016,
    department: 'Computer Science',
    employmentStatus: 'employed',
    jobTitle: 'Frontend Engineer',
    company: 'Paystack',
    location: 'Lagos',
    bio: 'Frontend engineer focused on product execution, mentorship, and growing junior developers.',
    openToMentorship: true,
    mentorshipTopics: ['Frontend development', 'Career growth', 'Interview prep'],
    skills: ['React', 'TypeScript', 'UI engineering'],
    mentorshipAvailability: 'weekdays-evenings',
    mentorshipCapacity: 3
  },
  {
    name: 'Tunde Bello',
    email: 'mentor.tunde@alumni.demo',
    password: 'Test@12345',
    graduationYear: 2014,
    department: 'Computer Science',
    employmentStatus: 'employed',
    jobTitle: 'Backend Engineer',
    company: 'Flutterwave',
    location: 'Abuja',
    bio: 'Backend systems mentor with experience in APIs, scaling services, and career strategy.',
    openToMentorship: true,
    mentorshipTopics: ['Backend development', 'System design', 'Interview prep'],
    skills: ['Node.js', 'MongoDB', 'API design'],
    mentorshipAvailability: 'weekends',
    mentorshipCapacity: 2
  },
  {
    name: 'Grace Etim',
    email: 'mentor.grace@alumni.demo',
    password: 'Test@12345',
    graduationYear: 2015,
    department: 'Information Systems',
    employmentStatus: 'employed',
    jobTitle: 'Product Manager',
    company: 'Moniepoint',
    location: 'Lagos',
    bio: 'Product mentor helping alumni move from execution roles into strategy and product leadership.',
    openToMentorship: true,
    mentorshipTopics: ['Product management', 'Career growth', 'Leadership'],
    skills: ['Roadmapping', 'Stakeholder management', 'Product strategy'],
    mentorshipAvailability: 'flexible',
    mentorshipCapacity: 4
  },
  {
    name: 'Chinedu Okafor',
    email: 'mentor.chinedu@alumni.demo',
    password: 'Test@12345',
    graduationYear: 2013,
    department: 'Electrical Engineering',
    employmentStatus: 'self-employed',
    jobTitle: 'Startup Founder',
    company: 'GridSpark',
    location: 'Port Harcourt',
    bio: 'Founder mentoring on startups, business models, and technical leadership.',
    openToMentorship: true,
    mentorshipTopics: ['Startups', 'Entrepreneurship', 'Leadership'],
    skills: ['Pitching', 'Product validation', 'Business development'],
    mentorshipAvailability: 'weekends',
    mentorshipCapacity: 2
  },
  {
    name: 'Ifeoma Adeyemi',
    email: 'mentor.ifeoma@alumni.demo',
    password: 'Test@12345',
    graduationYear: 2018,
    department: 'Computer Science',
    employmentStatus: 'employed',
    jobTitle: 'Data Analyst',
    company: 'Andela',
    location: 'Ibadan',
    bio: 'Data mentor for analytics, SQL, dashboards, and data career transitions.',
    openToMentorship: true,
    mentorshipTopics: ['Data analytics', 'Career switch', 'Portfolio building'],
    skills: ['SQL', 'Python', 'Power BI'],
    mentorshipAvailability: 'weekdays-evenings',
    mentorshipCapacity: 3
  },
  {
    name: 'Samuel Ajayi',
    email: 'mentor.samuel@alumni.demo',
    password: 'Test@12345',
    graduationYear: 2012,
    department: 'Business Administration',
    employmentStatus: 'employed',
    jobTitle: 'HR Business Partner',
    company: 'Access Bank',
    location: 'Lagos',
    bio: 'HR mentor focused on CVs, interviews, professional presence, and workplace growth.',
    openToMentorship: true,
    mentorshipTopics: ['Interview prep', 'CV review', 'Career growth'],
    skills: ['Recruitment', 'Coaching', 'Communication'],
    mentorshipAvailability: 'flexible',
    mentorshipCapacity: 5
  },
  {
    name: 'Ruth Danjuma',
    email: 'mentor.ruth@alumni.demo',
    password: 'Test@12345',
    graduationYear: 2017,
    department: 'Mass Communication',
    employmentStatus: 'employed',
    jobTitle: 'Brand Strategist',
    company: 'Nestle',
    location: 'Abuja',
    bio: 'Brand and communications mentor for storytelling, content strategy, and career clarity.',
    openToMentorship: true,
    mentorshipTopics: ['Brand strategy', 'Content', 'Career growth'],
    skills: ['Brand marketing', 'Writing', 'Presentation'],
    mentorshipAvailability: 'weekdays-evenings',
    mentorshipCapacity: 2
  },
  {
    name: 'Emeka Obi',
    email: 'mentor.emeka@alumni.demo',
    password: 'Test@12345',
    graduationYear: 2011,
    department: 'Computer Engineering',
    employmentStatus: 'employed',
    jobTitle: 'DevOps Engineer',
    company: 'Nomba',
    location: 'Enugu',
    bio: 'Infrastructure mentor for cloud, reliability, deployment pipelines, and production readiness.',
    openToMentorship: true,
    mentorshipTopics: ['DevOps', 'Cloud', 'System design'],
    skills: ['AWS', 'Docker', 'CI/CD'],
    mentorshipAvailability: 'weekends',
    mentorshipCapacity: 2
  }
];

async function run() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI is not configured');
  }

  await mongoose.connect(mongoUri);

  for (const mentor of mentors) {
    const existing = await User.findOne({ email: mentor.email });
    if (existing) {
      await User.findByIdAndUpdate(existing._id, mentor, { new: true, runValidators: true });
      console.log(`updated ${mentor.email}`);
    } else {
      await User.create(mentor);
      console.log(`created ${mentor.email}`);
    }
  }

  console.log(`seeded ${mentors.length} demo mentors`);
  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
