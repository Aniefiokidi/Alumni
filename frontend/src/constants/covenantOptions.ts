export const COVENANT_START_GRAD_YEAR = 2006;

export const graduationYears = Array.from(
  { length: new Date().getFullYear() - COVENANT_START_GRAD_YEAR + 1 },
  (_, i) => String(new Date().getFullYear() - i)
);

export const covenantDepartments = [
  'Accounting',
  'Architecture',
  'Banking and Finance',
  'Biochemistry',
  'Building Technology',
  'Business Administration',
  'Chemical Engineering',
  'Civil Engineering',
  'Computer and Information Sciences',
  'Economics',
  'Electrical and Information Engineering',
  'Estate Management',
  'Industrial Chemistry',
  'Industrial Relations and Human Resource Management',
  'Information and Communication Engineering',
  'International Relations',
  'Mass Communication',
  'Mechanical Engineering',
  'Microbiology',
  'Petroleum Engineering',
  'Political Science',
  'Psychology',
  'Sociology'
];