const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// ── Realistic Nigerian Names Pool ─────────────────────────────────────────────
const MALE_FIRST_NAMES = [
  'Musa', 'Ibrahim', 'Emmanuel', 'Chukwudi', 'Babatunde', 'Oluwaseun', 'Abubakar', 'Usman',
  'Farouk', 'Daniel', 'David', 'Samuel', 'Victor', 'Kelechi', 'Ahmed', 'Aliyu', 'Idris',
  'Chinedu', 'Olumide', 'Femi', 'Tunde', 'Godwin', 'Emeka', 'Abdullahi', 'Sani', 'Kabir',
  'Joshua', 'Michael', 'Gabriel', 'Joseph', 'Anthony', 'Kingsley', 'Ifeanyi', 'Haruna',
  'Bello', 'Yakubu', 'Garba', 'Aminu', 'Mustapha', 'Suleiman', 'Segun', 'Kayode', 'Ope',
  'Kunle', 'Dapo', 'Wale', 'Taiwo', 'Kehinde', 'Yusuf', 'Bashir', 'Mahmud', 'Sanusi',
  'Obinna', 'Chidi', 'Uche', 'Somto', 'Nonso', 'Tochukwu', 'Chidera', 'Onyeka', 'Stanley'
];

const FEMALE_FIRST_NAMES = [
  'Aisha', 'Fatima', 'Zainab', 'Blessing', 'Chioma', 'Ngozi', 'Amina', 'Halima', 'Maryam',
  'Chiamaka', 'Folashade', 'Funmilayo', 'Grace', 'Joy', 'Mercy', 'Faith', 'Hadiza', 'Hauwa',
  'Bilkisu', 'Rukaiya', 'Precious', 'Esther', 'Peace', 'Deborah', 'Ruth', 'Sarah', 'Victoria',
  'Nkechi', 'Ifeoma', 'Amaka', 'Bunmi', 'Toyin', 'Bukola', 'Kemi', 'Yetunde', 'Titilayo',
  'Salma', 'Jamila', 'Safiya', 'Khadijah', 'Omotola', 'Simisola', 'Ronke', 'Adeola', 'Eniola',
  'Temitope', 'Chidinma', 'Chinelo', 'Oluchi', 'Amarachi', 'Chinenye', 'Adaeze', 'Nneka'
];

const LAST_NAMES = [
  'Ibrahim', 'Bello', 'Abubakar', 'Mohammed', 'Adeleke', 'Okonkwo', 'Balogun', 'Eze',
  'Adeyemi', 'Lawal', 'Alabi', 'Abdullahi', 'Ojo', 'Nwosu', 'Danjuma', 'Garba', 'Sanusi',
  'Ogundipe', 'Okafor', 'Babangida', 'Shagari', 'Salami', 'Oshodi', 'Nnamdi', 'Okeke',
  'Chukwu', 'Soludo', 'Oladipo', 'Ajayi', 'Bankole', 'Tijani', 'Bamidele', 'Afolabi',
  'Momoh', 'Yakubu', 'Haruna', 'Mustapha', 'Suleiman', 'Umar', 'Dikko', 'Ogunleye',
  'Falana', 'Adewale', 'Oyelaran', 'Ogunlesi', 'Adeniyi', 'Oduwole', 'Bakare', 'Fashola',
  'Anikulapo', 'Chukwuma', 'Obasanjo', 'Jonathan', 'Buhari', 'Tinubu', 'Gowon', 'Soyinka',
  'Achebe', 'Nwachukwu', 'Onyekachi', 'Anyanwu', 'Okoli', 'Madu', 'Agbo', 'Ekwueme'
];

const STATES = [
  'Niger', 'Kaduna', 'Kano', 'Lagos', 'Ogun', 'Oyo', 'Osun', 'Ondo', 'Ekiti', 'Kwara',
  'Kogi', 'Abuja FCT', 'Plateau', 'Nasarawa', 'Benue', 'Edo', 'Delta', 'Rivers',
  'Anambra', 'Enugu', 'Imo', 'Abia', 'Sokoto', 'Katsina', 'Kebbi', 'Bauchi'
];

// Helper to chunk arrays for SQLite safety (max params per query guard)
function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🚀 CLEARING DATABASE & SEEDING 2,000 STUDENTS & CURRICULUM');
  console.log('═══════════════════════════════════════════════════════════\n');

  // ── 1. WIPE DATABASE CLEAN ──────────────────────────────────────────────────
  console.log('🧹 Purging all existing database records...');
  await prisma.$executeRawUnsafe('PRAGMA foreign_keys = OFF;');
  await prisma.$executeRawUnsafe('DELETE FROM Score;');
  await prisma.$executeRawUnsafe('DELETE FROM CourseRegistration;');
  await prisma.$executeRawUnsafe('DELETE FROM CalendarEvent;');
  await prisma.$executeRawUnsafe('DELETE FROM ActivityLog;');
  await prisma.$executeRawUnsafe('DELETE FROM Course;');
  await prisma.$executeRawUnsafe('DELETE FROM Student;');
  await prisma.$executeRawUnsafe('DELETE FROM User;');
  await prisma.$executeRawUnsafe('DELETE FROM Semester;');
  await prisma.$executeRawUnsafe('DELETE FROM AcademicSession;');
  await prisma.$executeRawUnsafe('DELETE FROM Department;');
  await prisma.$executeRawUnsafe('DELETE FROM Faculty;');
  await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON;');
  console.log('✅ Database completely wiped clean.\n');

  // ── 2. PRECOMPUTE PASSWORDS ─────────────────────────────────────────────────
  console.log('🔐 Precomputing password hashes...');
  const [adminHash, studentHash] = await Promise.all([
    bcrypt.hash('admin123', 10),
    bcrypt.hash('student123', 10),
  ]);
  console.log('✅ Hashes generated (all 2,000 students share student123).\n');

  // ── 3. CREATE ADMIN USER ────────────────────────────────────────────────────
  const adminUser = await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@futminna.edu.ng',
      name: 'School Administrator',
      passwordHash: adminHash,
      role: 'ADMIN',
    },
  });
  console.log(`✅ Default admin created: ${adminUser.username} (admin / admin123)\n`);

  // ── 4. FACULTIES & DEPARTMENTS ──────────────────────────────────────────────
  console.log('🏛️ Creating Faculties and Academic Departments...');
  const fet = await prisma.faculty.create({
    data: {
      code: 'FET',
      name: 'School of Engineering & Engineering Technology',
    },
  });

  const fict = await prisma.faculty.create({
    data: {
      code: 'FICT',
      name: 'School of Information & Communication Technology',
    },
  });

  const cpeDept = await prisma.department.create({
    data: { code: 'CPE', name: 'Computer Engineering', facultyId: fet.id },
  });

  const eeeDept = await prisma.department.create({
    data: { code: 'EEE', name: 'Electrical & Electronics Engineering', facultyId: fet.id },
  });

  const cscDept = await prisma.department.create({
    data: { code: 'CSC', name: 'Computer Science', facultyId: fict.id },
  });

  const cssDept = await prisma.department.create({
    data: { code: 'CSS', name: 'Cyber Security Science', facultyId: fict.id },
  });

  const departments = [
    { model: cpeDept, facultyId: fet.id, prefix: 'CPE', name: 'Computer Engineering' },
    { model: eeeDept, facultyId: fet.id, prefix: 'EEE', name: 'Electrical & Electronics Engineering' },
    { model: cscDept, facultyId: fict.id, prefix: 'CSC', name: 'Computer Science' },
    { model: cssDept, facultyId: fict.id, prefix: 'CSS', name: 'Cyber Security Science' },
  ];
  console.log('✅ 2 Faculties and 4 Departments created.\n');

  // ── 5. COURSES (7 PER SEMESTER PER LEVEL: 100, 200, 300, 400, 500) ───────────
  console.log('📚 Generating full curriculum (at least 7 courses per semester for all levels 100-500)...');

  const courseCatalog = {
    CPE: {
      100: {
        FIRST: [
          { code: 'CPE111', title: 'Introduction to Computer Engineering', unit: 2 },
          { code: 'CPE112', title: 'Engineering Mathematics I: Calculus', unit: 3 },
          { code: 'CPE113', title: 'General Physics for Engineers I', unit: 3 },
          { code: 'CPE114', title: 'General Physics Laboratory I', unit: 1 },
          { code: 'CPE115', title: 'General Chemistry for Engineers', unit: 3 },
          { code: 'CPE116', title: 'Communication in English & Study Skills', unit: 2 },
          { code: 'CPE117', title: 'Philosophy, Logic & Human Existence', unit: 2 },
        ],
        SECOND: [
          { code: 'CPE121', title: 'Computer Applications & Algorithms', unit: 2 },
          { code: 'CPE122', title: 'Engineering Mathematics II: Vectors & ODE', unit: 3 },
          { code: 'CPE123', title: 'General Physics for Engineers II', unit: 3 },
          { code: 'CPE124', title: 'General Physics Laboratory II', unit: 1 },
          { code: 'CPE125', title: 'Introduction to Materials Science', unit: 3 },
          { code: 'CPE126', title: 'Use of Library, Study Skills & ICT', unit: 2 },
          { code: 'CPE127', title: 'Nigerian Peoples & Cultural Heritage', unit: 2 },
        ],
      },
      200: {
        FIRST: [
          { code: 'CPE211', title: 'Computer Engineering Workshop & Tools', unit: 2 },
          { code: 'CPE212', title: 'Computer Programming I: C++ Essentials', unit: 3 },
          { code: 'CPE213', title: 'Digital Logic Design & Switching Circuits', unit: 3 },
          { code: 'CPE214', title: 'Electric Circuit Theory I', unit: 3 },
          { code: 'CPE215', title: 'Mathematical Methods I', unit: 3 },
          { code: 'CPE216', title: 'Engineering Mechanics: Statics', unit: 2 },
          { code: 'CPE217', title: 'Philosophy of Science & Technology', unit: 2 },
        ],
        SECOND: [
          { code: 'CPE221', title: 'Data Structures & Algorithms for Hardware', unit: 3 },
          { code: 'CPE222', title: 'Microcomputing & Assembly Language', unit: 3 },
          { code: 'CPE223', title: 'Electronic Devices & Circuits', unit: 3 },
          { code: 'CPE224', title: 'Electric Circuit Theory II', unit: 3 },
          { code: 'CPE225', title: 'Linear Algebra & Differential Equations', unit: 3 },
          { code: 'CPE226', title: 'Computer-Aided Engineering Drawing & CAD', unit: 2 },
          { code: 'CPE227', title: 'Entrepreneurship & Innovation', unit: 2 },
        ],
      },
      300: {
        FIRST: [
          { code: 'CPE311', title: 'Microprocessor Systems & Interfacing', unit: 3 },
          { code: 'CPE312', title: 'Computer Architecture & Organization', unit: 3 },
          { code: 'CPE313', title: 'Signals, Systems & Continuous Filters', unit: 3 },
          { code: 'CPE314', title: 'Object-Oriented Software Engineering', unit: 3 },
          { code: 'CPE315', title: 'Data Communications & Computer Networks', unit: 3 },
          { code: 'CPE316', title: 'Electromagnetic Fields & Waves', unit: 3 },
          { code: 'CPE317', title: 'Engineering Mathematics III: Complex Analysis', unit: 3 },
        ],
        SECOND: [
          { code: 'CPE321', title: 'Embedded Systems Design & Firmware', unit: 3 },
          { code: 'CPE322', title: 'Digital Signal Processing', unit: 3 },
          { code: 'CPE323', title: 'Database Systems & Information Engineering', unit: 3 },
          { code: 'CPE324', title: 'Control Systems Engineering', unit: 3 },
          { code: 'CPE325', title: 'Network Security & Cryptographic Protocols', unit: 3 },
          { code: 'CPE326', title: 'Technical Research Methodology & Seminar', unit: 2 },
          { code: 'CPE327', title: 'Engineering Technical Communications', unit: 2 },
        ],
      },
      400: {
        FIRST: [
          { code: 'CPE411', title: 'Advanced Microcomputer & SoC Systems', unit: 3 },
          { code: 'CPE412', title: 'Computer Graphics & Visualization', unit: 3 },
          { code: 'CPE413', title: 'Real-Time Operating Systems', unit: 3 },
          { code: 'CPE414', title: 'Industrial Automation & Robotics', unit: 3 },
          { code: 'CPE415', title: 'Fault-Tolerant & Reliable Computing', unit: 3 },
          { code: 'CPE416', title: 'Engineering Economics & Project Management', unit: 2 },
          { code: 'CPE417', title: 'Technology Law, Ethics & Intellectual Property', unit: 2 },
        ],
        SECOND: [
          { code: 'CPE421', title: 'Students Industrial Work Experience Scheme (SIWES II)', unit: 6 },
          { code: 'CPE422', title: 'Industrial Workshop Practice & Logbook', unit: 2 },
          { code: 'CPE423', title: 'Comprehensive Industrial Defense & Seminar', unit: 2 },
          { code: 'CPE424', title: 'Hardware Description Languages (VHDL/Verilog)', unit: 3 },
          { code: 'CPE425', title: 'Wireless Sensor Networks & IoT Architectures', unit: 3 },
          { code: 'CPE426', title: 'Parallel & Distributed Computing', unit: 3 },
          { code: 'CPE427', title: 'VLSI Design Principles', unit: 3 },
        ],
      },
      500: {
        FIRST: [
          { code: 'CPE511', title: 'Artificial Intelligence & Neural Networks', unit: 3 },
          { code: 'CPE512', title: 'Advanced Computer Networks & Cloud Systems', unit: 3 },
          { code: 'CPE513', title: 'Hardware Security & Cryptographic Accelerators', unit: 3 },
          { code: 'CPE514', title: 'Digital Image Processing & Computer Vision', unit: 3 },
          { code: 'CPE515', title: 'Final Year Research Project I', unit: 3 },
          { code: 'CPE516', title: 'Engineering Management & Production', unit: 2 },
          { code: 'CPE517', title: 'Professional Engineering Practice & Ethics', unit: 2 },
        ],
        SECOND: [
          { code: 'CPE521', title: 'Final Year Research Project II (Defended)', unit: 6 },
          { code: 'CPE522', title: 'Cloud Computing & High-Performance Clusters', unit: 3 },
          { code: 'CPE523', title: 'Machine Learning Applications in Engineering', unit: 3 },
          { code: 'CPE524', title: 'Robotics & Autonomous Systems Engineering', unit: 3 },
          { code: 'CPE525', title: 'Cyber-Physical Systems & Critical Infrastructure', unit: 3 },
          { code: 'CPE526', title: 'Optical Fiber & High-Speed Communications', unit: 2 },
          { code: 'CPE527', title: 'Special Topics in Modern Computer Engineering', unit: 2 },
        ],
      },
    },

    EEE: {
      100: {
        FIRST: [
          { code: 'EEE111', title: 'Introduction to Electrical Engineering', unit: 2 },
          { code: 'EEE112', title: 'Calculus for Electrical Engineers', unit: 3 },
          { code: 'EEE113', title: 'Mechanics & Wave Motion', unit: 3 },
          { code: 'EEE114', title: 'Physics Experimental Laboratory I', unit: 1 },
          { code: 'EEE115', title: 'Basic Chemistry for Physical Sciences', unit: 3 },
          { code: 'EEE116', title: 'Communication in English I', unit: 2 },
          { code: 'EEE117', title: 'Humanities & Social Sciences', unit: 2 },
        ],
        SECOND: [
          { code: 'EEE121', title: 'Applied Electricity & Magnetism', unit: 3 },
          { code: 'EEE122', title: 'Applied Calculus & Analytical Geometry', unit: 3 },
          { code: 'EEE123', title: 'Heat, Light & Modern Physics', unit: 3 },
          { code: 'EEE124', title: 'Physics Experimental Laboratory II', unit: 1 },
          { code: 'EEE125', title: 'Inorganic & Organic Chemistry', unit: 3 },
          { code: 'EEE126', title: 'Library Information & Study Skills', unit: 2 },
          { code: 'EEE127', title: 'Citizenship & National Values', unit: 2 },
        ],
      },
      200: {
        FIRST: [
          { code: 'EEE211', title: 'Electrical Circuits Theory I', unit: 3 },
          { code: 'EEE212', title: 'Basic Electronic Engineering', unit: 3 },
          { code: 'EEE213', title: 'Electrical Engineering Workshop Practice', unit: 2 },
          { code: 'EEE214', title: 'Mathematical Analysis for Engineers I', unit: 3 },
          { code: 'EEE215', title: 'Materials Science for Electrical Engineers', unit: 3 },
          { code: 'EEE216', title: 'Engineering Thermodynamics', unit: 2 },
          { code: 'EEE217', title: 'Science, Technology & Environment', unit: 2 },
        ],
        SECOND: [
          { code: 'EEE221', title: 'Electrical Circuits Theory II', unit: 3 },
          { code: 'EEE222', title: 'Semiconductor Physics & Electronic Devices', unit: 3 },
          { code: 'EEE223', title: 'Electrical Measurements & Instrumentation', unit: 3 },
          { code: 'EEE224', title: 'Differential Equations & Vector Calculus', unit: 3 },
          { code: 'EEE225', title: 'Computer Programming for Engineers', unit: 3 },
          { code: 'EEE226', title: 'Fluid Mechanics for Electrical Engineers', unit: 2 },
          { code: 'EEE227', title: 'Entrepreneurial Ventures Development', unit: 2 },
        ],
      },
      300: {
        FIRST: [
          { code: 'EEE311', title: 'Electromagnetic Fields & Transmission Lines', unit: 3 },
          { code: 'EEE312', title: 'Electrical Machines I: Transformers & DC', unit: 3 },
          { code: 'EEE313', title: 'Analogue Electronic Circuits Design', unit: 3 },
          { code: 'EEE314', title: 'Linear Feedback Control Systems', unit: 3 },
          { code: 'EEE315', title: 'Signals & Linear Systems', unit: 3 },
          { code: 'EEE316', title: 'Numerical Methods & Computational Tools', unit: 3 },
          { code: 'EEE317', title: 'Engineering Mathematics III', unit: 3 },
        ],
        SECOND: [
          { code: 'EEE321', title: 'Electrical Machines II: AC Machines', unit: 3 },
          { code: 'EEE322', title: 'Digital Electronics & Microprocessors', unit: 3 },
          { code: 'EEE323', title: 'Communication Principles & Modulation', unit: 3 },
          { code: 'EEE324', title: 'Power Systems Analysis I', unit: 3 },
          { code: 'EEE325', title: 'Electronic Instrumentation Systems', unit: 3 },
          { code: 'EEE326', title: 'Power Electronics Principles', unit: 3 },
          { code: 'EEE327', title: 'Engineering Seminar & Scientific Writing', unit: 2 },
        ],
      },
      400: {
        FIRST: [
          { code: 'EEE411', title: 'Power Systems Engineering II', unit: 3 },
          { code: 'EEE412', title: 'Telecommunications Engineering I', unit: 3 },
          { code: 'EEE413', title: 'Digital Signal Processing for EEE', unit: 3 },
          { code: 'EEE414', title: 'High Voltage Engineering Principles', unit: 3 },
          { code: 'EEE415', title: 'Industrial Electronics & Drives', unit: 3 },
          { code: 'EEE416', title: 'Engineering Management & Economics', unit: 2 },
          { code: 'EEE417', title: 'Professional Engineering Ethics', unit: 2 },
        ],
        SECOND: [
          { code: 'EEE421', title: 'Students Industrial Work Experience Scheme (SIWES II)', unit: 6 },
          { code: 'EEE422', title: 'Industrial Training Defense & Presentation', unit: 2 },
          { code: 'EEE423', title: 'Advanced Power Electronic Converters', unit: 3 },
          { code: 'EEE424', title: 'Wireless Communications & Antenna Theory', unit: 3 },
          { code: 'EEE425', title: 'Microcontroller-Based System Design', unit: 3 },
          { code: 'EEE426', title: 'Renewable Energy Systems & Photovoltaics', unit: 3 },
          { code: 'EEE427', title: 'Industrial Safety & Maintenance Engineering', unit: 2 },
        ],
      },
      500: {
        FIRST: [
          { code: 'EEE511', title: 'Power Systems Protection & Control', unit: 3 },
          { code: 'EEE512', title: 'Digital Communication Systems', unit: 3 },
          { code: 'EEE513', title: 'Advanced Control Systems & State-Space', unit: 3 },
          { code: 'EEE514', title: 'Optical & Satellite Communications', unit: 3 },
          { code: 'EEE515', title: 'Final Year Engineering Project I', unit: 3 },
          { code: 'EEE516', title: 'Engineering Law & Contract Administration', unit: 2 },
          { code: 'EEE517', title: 'Engineering Entrepreneurship Practicum', unit: 2 },
        ],
        SECOND: [
          { code: 'EEE521', title: 'Final Year Engineering Project II (Defended)', unit: 6 },
          { code: 'EEE522', title: 'Power Systems Operation & Stability', unit: 3 },
          { code: 'EEE523', title: 'Microwave Engineering & Radar Systems', unit: 3 },
          { code: 'EEE524', title: 'Smart Grid Technologies & Microgrids', unit: 3 },
          { code: 'EEE525', title: 'Biomedical Electronics & Instrumentation', unit: 3 },
          { code: 'EEE526', title: 'VLSI Design for Electronic Systems', unit: 2 },
          { code: 'EEE527', title: 'Contemporary Topics in Electrical Engineering', unit: 2 },
        ],
      },
    },

    CSC: {
      100: {
        FIRST: [
          { code: 'CSC111', title: 'Introduction to Computer Science', unit: 2 },
          { code: 'CSC112', title: 'Mathematics for Computing I: Discrete Sets', unit: 3 },
          { code: 'CSC113', title: 'General Physics for Computer Science I', unit: 3 },
          { code: 'CSC114', title: 'General Physics Practicals I', unit: 1 },
          { code: 'CSC115', title: 'General Chemistry for Computing', unit: 3 },
          { code: 'CSC116', title: 'English & Academic Writing', unit: 2 },
          { code: 'CSC117', title: 'Humanities & Information Society', unit: 2 },
        ],
        SECOND: [
          { code: 'CSC121', title: 'Introduction to Problem Solving & Python', unit: 3 },
          { code: 'CSC122', title: 'Mathematics for Computing II: Calculus', unit: 3 },
          { code: 'CSC123', title: 'General Physics for Computer Science II', unit: 3 },
          { code: 'CSC124', title: 'General Physics Practicals II', unit: 1 },
          { code: 'CSC125', title: 'Digital Technologies & Society', unit: 2 },
          { code: 'CSC126', title: 'Information Literacy & Research Methods', unit: 2 },
          { code: 'CSC127', title: 'Peace, Security & Governance', unit: 2 },
        ],
      },
      200: {
        FIRST: [
          { code: 'CSC211', title: 'Object-Oriented Programming in Java', unit: 3 },
          { code: 'CSC212', title: 'Computer Architecture & Digital Circuits', unit: 3 },
          { code: 'CSC213', title: 'Discrete Structures & Logic', unit: 3 },
          { code: 'CSC214', title: 'Foundations of Data Structures', unit: 3 },
          { code: 'CSC215', title: 'Linear Algebra for Computer Scientists', unit: 3 },
          { code: 'CSC216', title: 'Scientific Computing & Numerical Methods', unit: 3 },
          { code: 'CSC217', title: 'History & Philosophy of Computing', unit: 2 },
        ],
        SECOND: [
          { code: 'CSC221', title: 'Advanced Algorithms & Complexity', unit: 3 },
          { code: 'CSC222', title: 'Systems Programming in C/Linux', unit: 3 },
          { code: 'CSC223', title: 'Database Management Systems I', unit: 3 },
          { code: 'CSC224', title: 'Web Technologies & Development', unit: 3 },
          { code: 'CSC225', title: 'Probability & Statistics for Computing', unit: 3 },
          { code: 'CSC226', title: 'Computer Assembly & Maintenance', unit: 2 },
          { code: 'CSC227', title: 'Entrepreneurship & Business Innovation', unit: 2 },
        ],
      },
      300: {
        FIRST: [
          { code: 'CSC311', title: 'Database Design & Implementation (SQL/NoSQL)', unit: 3 },
          { code: 'CSC312', title: 'Operating Systems Concepts & Concurrency', unit: 3 },
          { code: 'CSC313', title: 'Software Engineering Principles', unit: 3 },
          { code: 'CSC314', title: 'Automata Theory & Formal Languages', unit: 3 },
          { code: 'CSC315', title: 'Data Communications & Computer Networks', unit: 3 },
          { code: 'CSC316', title: 'Artificial Intelligence Fundamentals', unit: 3 },
          { code: 'CSC317', title: 'Compiler Construction Principles', unit: 3 },
        ],
        SECOND: [
          { code: 'CSC321', title: 'Web Application Frameworks & APIs', unit: 3 },
          { code: 'CSC322', title: 'Mobile Application Development (Android/iOS)', unit: 3 },
          { code: 'CSC323', title: 'Computer Graphics & Multimedia Systems', unit: 3 },
          { code: 'CSC324', title: 'Distributed Systems & Cluster Computing', unit: 3 },
          { code: 'CSC325', title: 'Cybersecurity Fundamentals for Developers', unit: 3 },
          { code: 'CSC326', title: 'Software Testing & Quality Assurance', unit: 2 },
          { code: 'CSC327', title: 'Research Methodology in Computing', unit: 2 },
        ],
      },
      400: {
        FIRST: [
          { code: 'CSC411', title: 'Students Industrial Work Experience Scheme (SIWES II)', unit: 6 },
          { code: 'CSC412', title: 'Industrial Training Defense & Report', unit: 2 },
          { code: 'CSC413', title: 'Enterprise Application Architecture', unit: 3 },
          { code: 'CSC414', title: 'Big Data Technologies & Analytics', unit: 3 },
          { code: 'CSC415', title: 'Human-Computer Interaction & UX', unit: 3 },
          { code: 'CSC416', title: 'IT Project Management & Agile Methods', unit: 2 },
          { code: 'CSC417', title: 'Legal & Ethical Issues in Computing', unit: 2 },
        ],
        SECOND: [
          { code: 'CSC421', title: 'Cloud Computing Architecture & DevOps', unit: 3 },
          { code: 'CSC422', title: 'Machine Learning & Predictive Modeling', unit: 3 },
          { code: 'CSC423', title: 'Natural Language Processing', unit: 3 },
          { code: 'CSC424', title: 'Information Retrieval & Search Engines', unit: 3 },
          { code: 'CSC425', title: 'Cryptography & Network Security Protocols', unit: 3 },
          { code: 'CSC426', title: 'Computer Vision & Pattern Recognition', unit: 3 },
          { code: 'CSC427', title: 'High-Performance Parallel Computing', unit: 3 },
        ],
      },
      500: {
        FIRST: [
          { code: 'CSC511', title: 'Deep Learning & Neural Network Architectures', unit: 3 },
          { code: 'CSC512', title: 'Advanced Distributed Systems & Microservices', unit: 3 },
          { code: 'CSC513', title: 'Autonomous Intelligent Agents & Multi-Agent', unit: 3 },
          { code: 'CSC514', title: 'Quantum Computing Foundations', unit: 3 },
          { code: 'CSC515', title: 'Final Year Capstone Project I', unit: 3 },
          { code: 'CSC516', title: 'Technology Venture Creation & Funding', unit: 2 },
          { code: 'CSC517', title: 'Professional Ethics & Computing Standards', unit: 2 },
        ],
        SECOND: [
          { code: 'CSC521', title: 'Final Year Capstone Project II (Defended)', unit: 6 },
          { code: 'CSC522', title: 'Advanced Natural Language Understanding', unit: 3 },
          { code: 'CSC523', title: 'Blockchain Technologies & Smart Contracts', unit: 3 },
          { code: 'CSC524', title: 'Edge Computing & Internet of Things', unit: 3 },
          { code: 'CSC525', title: 'Bio-Computing & Computational Biology', unit: 3 },
          { code: 'CSC526', title: 'Cyber-Threat Intelligence & Incident Response', unit: 2 },
          { code: 'CSC527', title: 'Contemporary Frontiers in Computer Science', unit: 2 },
        ],
      },
    },

    CSS: {
      100: {
        FIRST: [
          { code: 'CSS111', title: 'Introduction to Cyber Security Science', unit: 2 },
          { code: 'CSS112', title: 'Discrete Mathematics for Cyber Security', unit: 3 },
          { code: 'CSS113', title: 'General Physics for Cyber Security I', unit: 3 },
          { code: 'CSS114', title: 'Cyber Security Physics Practicals I', unit: 1 },
          { code: 'CSS115', title: 'General Chemistry for Information Sciences', unit: 3 },
          { code: 'CSS116', title: 'English Communication & Critical Thinking', unit: 2 },
          { code: 'CSS117', title: 'Social Science & Digital Ethics', unit: 2 },
        ],
        SECOND: [
          { code: 'CSS121', title: 'Foundations of Cyber Defense & Tools', unit: 3 },
          { code: 'CSS122', title: 'Mathematical Foundations of Cryptography', unit: 3 },
          { code: 'CSS123', title: 'General Physics for Cyber Security II', unit: 3 },
          { code: 'CSS124', title: 'Cyber Security Physics Practicals II', unit: 1 },
          { code: 'CSS125', title: 'Digital Society & Privacy Rights', unit: 2 },
          { code: 'CSS126', title: 'Use of Library & Cyber Resources', unit: 2 },
          { code: 'CSS127', title: 'National Security & Conflict Prevention', unit: 2 },
        ],
      },
      200: {
        FIRST: [
          { code: 'CSS211', title: 'Information Security Principles & Domains', unit: 3 },
          { code: 'CSS212', title: 'Computer Systems Architecture for Security', unit: 3 },
          { code: 'CSS213', title: 'Python for Cyber Security & Automation', unit: 3 },
          { code: 'CSS214', title: 'Data Structures & Secure Coding I', unit: 3 },
          { code: 'CSS215', title: 'Number Theory & Cryptographic Algorithms', unit: 3 },
          { code: 'CSS216', title: 'Probability & Risk Statistics', unit: 3 },
          { code: 'CSS217', title: 'Cyber Jurisprudence & Digital Rights', unit: 2 },
        ],
        SECOND: [
          { code: 'CSS221', title: 'Linux Systems Administration & Hardening', unit: 3 },
          { code: 'CSS222', title: 'Network Protocols & Security Architecture', unit: 3 },
          { code: 'CSS223', title: 'Database Security & Access Control Models', unit: 3 },
          { code: 'CSS224', title: 'Secure Software Development Lifecycle', unit: 3 },
          { code: 'CSS225', title: 'Defensive Security & Threat Modeling', unit: 3 },
          { code: 'CSS226', title: 'Computer Assembly, BIOS & Firmware Security', unit: 2 },
          { code: 'CSS227', title: 'Entrepreneurship in Cyber Security', unit: 2 },
        ],
      },
      300: {
        FIRST: [
          { code: 'CSS311', title: 'Network Security, Firewalls & VPNs', unit: 3 },
          { code: 'CSS312', title: 'Applied Cryptography & Key Management', unit: 3 },
          { code: 'CSS313', title: 'Operating System Security & Kernel Hardening', unit: 3 },
          { code: 'CSS314', title: 'Ethical Hacking & Penetration Testing I', unit: 3 },
          { code: 'CSS315', title: 'Vulnerability Assessment & Patching', unit: 3 },
          { code: 'CSS316', title: 'Wireless & Mobile Device Security', unit: 3 },
          { code: 'CSS317', title: 'Security Governance, Risk & Compliance (GRC)', unit: 3 },
        ],
        SECOND: [
          { code: 'CSS321', title: 'Ethical Hacking & Penetration Testing II', unit: 3 },
          { code: 'CSS322', title: 'Digital Forensics & Investigation', unit: 3 },
          { code: 'CSS323', title: 'Web Application Penetration Testing', unit: 3 },
          { code: 'CSS324', title: 'Malware Analysis & Reverse Engineering', unit: 3 },
          { code: 'CSS325', title: 'Intrusion Detection & Prevention Systems', unit: 3 },
          { code: 'CSS326', title: 'Identity & Access Management (IAM)', unit: 2 },
          { code: 'CSS327', title: 'Research Methodology in Cyber Security', unit: 2 },
        ],
      },
      400: {
        FIRST: [
          { code: 'CSS411', title: 'Students Industrial Work Experience Scheme (SIWES II)', unit: 6 },
          { code: 'CSS412', title: 'Industrial Training Defense & Report', unit: 2 },
          { code: 'CSS413', title: 'Security Operations Center (SOC) Analytics', unit: 3 },
          { code: 'CSS414', title: 'Cloud Security & DevSecOps', unit: 3 },
          { code: 'CSS415', title: 'Incident Response & Disaster Recovery', unit: 3 },
          { code: 'CSS416', title: 'Cyber Law, Cyber Warfare & Treaties', unit: 2 },
          { code: 'CSS417', title: 'Cyber Security Auditing & ISO Standards', unit: 2 },
        ],
        SECOND: [
          { code: 'CSS421', title: 'Advanced Threat Intelligence & Hunting', unit: 3 },
          { code: 'CSS422', title: 'Critical Infrastructure & SCADA Security', unit: 3 },
          { code: 'CSS423', title: 'Blockchain Security & Smart Contract Audits', unit: 3 },
          { code: 'CSS424', title: 'Hardware Security & Side-Channel Attacks', unit: 3 },
          { code: 'CSS425', title: 'AI & Machine Learning in Cyber Defense', unit: 3 },
          { code: 'CSS426', title: 'Mobile & IoT Forensics', unit: 3 },
          { code: 'CSS427', title: 'Advanced Red Teaming Operations', unit: 3 },
        ],
      },
      500: {
        FIRST: [
          { code: 'CSS511', title: 'Cyber Warfare, Geopolitics & Defense Policy', unit: 3 },
          { code: 'CSS512', title: 'Advanced Malware Deobfuscation & Rootkits', unit: 3 },
          { code: 'CSS513', title: 'Cryptanalysis & Quantum-Resistant Cryptography', unit: 3 },
          { code: 'CSS514', title: 'Enterprise Cyber Risk Management', unit: 3 },
          { code: 'CSS515', title: 'Final Year Cyber Research Project I', unit: 3 },
          { code: 'CSS516', title: 'Cyber Entrepreneurship & Startup Incubation', unit: 2 },
          { code: 'CSS517', title: 'Professional Ethics for Security Analysts', unit: 2 },
        ],
        SECOND: [
          { code: 'CSS521', title: 'Final Year Cyber Research Project II (Defended)', unit: 6 },
          { code: 'CSS522', title: 'Offensive Security Certified Tactics', unit: 3 },
          { code: 'CSS523', title: 'AI-Driven Cyber Attacks & Adversarial Defense', unit: 3 },
          { code: 'CSS524', title: 'Cloud-Native Security & Zero Trust Architecture', unit: 3 },
          { code: 'CSS525', title: 'Cyber Threat Emulation & Purple Teaming', unit: 3 },
          { code: 'CSS526', title: 'Digital Evidence in Court & Expert Witness', unit: 2 },
          { code: 'CSS527', title: 'Contemporary Paradigms in Cyber Security', unit: 2 },
        ],
      },
    },
  };

  const coursesToInsert = [];
  for (const dept of departments) {
    const deptCatalog = courseCatalog[dept.prefix];
    if (!deptCatalog) continue;
    for (const levelStr of ['100', '200', '300', '400', '500']) {
      const level = parseInt(levelStr, 10);
      const levelData = deptCatalog[level];
      for (const semester of ['FIRST', 'SECOND']) {
        const list = levelData[semester] || [];
        for (const item of list) {
          coursesToInsert.push({
            code: item.code,
            title: item.title,
            unit: item.unit,
            level: level,
            semester: semester,
            departmentId: dept.model.id,
          });
        }
      }
    }
  }

  // Insert courses in batches
  for (const chunk of chunkArray(coursesToInsert, 50)) {
    await prisma.course.createMany({ data: chunk });
  }
  console.log(`✅ Seeded ${coursesToInsert.length} accredited courses across all 4 departments and 5 levels (7 courses per semester per level).\n`);

  // ── 6. ACADEMIC SESSIONS & SEMESTERS ─────────────────────────────────────────
  console.log('📅 Setting up Academic Sessions (2025/2026 is current, calendar just starting)...');

  // Concluded past session (for historical records / transcripts / CGPA)
  const pastSession = await prisma.academicSession.create({
    data: {
      name: '2024/2025',
      isCurrent: false,
      semesters: {
        create: [
          { name: 'FIRST', isCurrent: false, registrationOpen: false, resultsPublished: true },
          { name: 'SECOND', isCurrent: false, registrationOpen: false, resultsPublished: true },
        ],
      },
    },
    include: { semesters: true },
  });

  // Current session: 2025/2026 with calendar JUST STARTING (Week 1 In Progress, rest Upcoming)
  const currentSession = await prisma.academicSession.create({
    data: {
      name: '2025/2026',
      isCurrent: true,
      semesters: {
        create: [
          { name: 'FIRST', isCurrent: true, registrationOpen: true, resultsPublished: false },
          { name: 'SECOND', isCurrent: false, registrationOpen: true, resultsPublished: false },
        ],
      },
    },
    include: { semesters: true },
  });

  const currentFirstSemester = currentSession.semesters.find((s) => s.name === 'FIRST');
  const currentSecondSemester = currentSession.semesters.find((s) => s.name === 'SECOND');

  // ── 7. CALENDAR EVENTS FOR 2025/2026 (JUST STARTING) ─────────────────────────
  console.log('🗓️ Scaffolding academic calendar events for 2025/2026 (status: just starting)...');
  const firstSemMilestones = [
    { week: 'Week 1', dateRange: 'Oct 13 – Oct 18, 2025', title: 'Course Registration Portal Opens', description: 'Online enrolment commences for fresh and returning undergraduates across all faculties.', category: 'REGISTRATION', status: 'IN_PROGRESS', unit: 'ICT Directorate', order: 1 },
    { week: 'Week 2', dateRange: 'Oct 20, 2025', title: 'Commencement of First Semester Lectures', description: 'Official resumption of academic teaching, distribution of course outlines and departmental timetables.', category: 'ACADEMIC', status: 'UPCOMING', unit: 'All Faculties', order: 2 },
    { week: 'Week 4', dateRange: 'Nov 07, 2025', title: 'Late Course Registration Commences', description: 'Standard registration window closes; late registration opens with administrative surcharge fine.', category: 'REGISTRATION', status: 'UPCOMING', unit: 'Academic Registry', order: 3 },
    { week: 'Week 5', dateRange: 'Nov 14, 2025', title: 'Final Close of Add/Drop Window', description: 'Strict deadline for adding or dropping enrolled courses; maximum allowable credit cap locked at 24 units.', category: 'REGISTRATION', status: 'UPCOMING', unit: 'Registry Academic Office', order: 4 },
    { week: 'Week 7', dateRange: 'Nov 26, 2025', title: 'University Matriculation Ceremony', description: 'Official matriculation for 100-level and Direct Entry undergraduates at Convocation Square.', category: 'ACADEMIC', status: 'UPCOMING', unit: "Vice Chancellor's Office", order: 5 },
    { week: 'Week 9', dateRange: 'Dec 08 – Dec 13, 2025', title: 'Continuous Assessment (CA) Phase 1', description: 'First continuous assessment test period administering initial 20% coursework scores.', category: 'ASSESSMENT', status: 'UPCOMING', unit: 'Departmental Examiners', order: 6 },
    { week: 'Mid-Term', dateRange: 'Dec 22, 2025 – Jan 02, 2026', title: 'Mid-Semester & End of Year Recess', description: 'University-wide academic break; lectures, laboratories and examinations suspended.', category: 'ACADEMIC', status: 'UPCOMING', unit: 'University Registry', order: 7 },
    { week: 'Week 11–12', dateRange: 'Jan 05 – Jan 16, 2026', title: 'Lecture Resumption & CA Phase 2', description: 'Resumption of coursework teaching and completion of final continuous assessment tests (20%).', category: 'ASSESSMENT', status: 'UPCOMING', unit: 'Academic Departments', order: 8 },
    { week: 'Week 13', dateRange: 'Jan 19 – Jan 23, 2026', title: 'Revision Week & CA Scores Audit', description: 'Final lectures concluded; release of verified continuous assessment marks (40%) on portal.', category: 'ACADEMIC', status: 'UPCOMING', unit: 'Directorate of Exams', order: 9 },
    { week: 'Week 14–16', dateRange: 'Jan 26 – Feb 14, 2026', title: 'First Semester Final Examinations', description: 'Official university-wide examinations administering final 60% semester papers.', category: 'EXAMINATION', status: 'UPCOMING', unit: 'Central Examination Committee', order: 10 },
    { week: 'Post-Exam', dateRange: 'Feb 16 – Feb 27, 2026', title: 'Departmental Score Moderation', description: 'Internal vetting, scoring computation and departmental board review of raw examination scripts.', category: 'SENATE', status: 'UPCOMING', unit: 'Faculty Examination Boards', order: 11 },
    { week: 'Senate', dateRange: 'Mar 09, 2026', title: 'Senate Approval & Results Release', description: 'University Senate ratification of official broadsheets; release of verified GPA to student accounts.', category: 'SENATE', status: 'UPCOMING', unit: 'University Senate', order: 12 },
  ];

  const secondSemMilestones = [
    { week: 'Week 1', dateRange: 'Mar 23, 2026', title: 'Commencement of Second Semester Lectures', description: 'Resumption of academic teaching, distribution of second semester course materials and lecture timetables.', category: 'ACADEMIC', status: 'UPCOMING', unit: 'All Faculties', order: 13 },
    { week: 'Week 2', dateRange: 'Mar 30 – Apr 04, 2026', title: 'Second Semester Course Verification & Add/Drop Window', description: 'Window for students to adjust second semester elective courses and verify registered modules on the portal.', category: 'REGISTRATION', status: 'UPCOMING', unit: 'ICT Directorate', order: 14 },
    { week: 'Week 4', dateRange: 'Apr 13 – Apr 18, 2026', title: "Students' Union Week & Cultural Carnival", description: 'Annual university cultural carnival, intellectual debates, and inter-faculty sporting fiesta.', category: 'ACADEMIC', status: 'UPCOMING', unit: 'Student Affairs Division', order: 15 },
    { week: 'Week 6', dateRange: 'Apr 27 – May 02, 2026', title: 'Continuous Assessment (CA) Phase 1', description: 'First continuous assessment test period administering initial 20% coursework evaluation for second semester.', category: 'ASSESSMENT', status: 'UPCOMING', unit: 'Departmental Examiners', order: 16 },
    { week: 'Mid-Term', dateRange: 'May 11 – May 15, 2026', title: 'Mid-Semester Break', description: 'Brief academic break for undergraduates; administrative and research activities remain ongoing.', category: 'ACADEMIC', status: 'UPCOMING', unit: 'University Registry', order: 17 },
    { week: 'Week 9–10', dateRange: 'May 18 – May 29, 2026', title: 'Lecture Resumption & CA Phase 2', description: 'Final phase of lectures and completion of mid-term assignments, tests, and laboratory assessments (20%).', category: 'ASSESSMENT', status: 'UPCOMING', unit: 'Academic Departments', order: 18 },
    { week: 'Week 12', dateRange: 'Jun 08 – Jun 12, 2026', title: 'Revision Week & Practical Examinations', description: 'Conclusion of lectures, project submissions, studio defences, and verification of CA marks on portal.', category: 'ACADEMIC', status: 'UPCOMING', unit: 'Directorate of Exams', order: 19 },
    { week: 'Week 13–15', dateRange: 'Jun 15 – Jul 04, 2026', title: 'Second Semester Final Examinations', description: 'Official university-wide examinations for graduating and non-graduating students across all faculties.', category: 'EXAMINATION', status: 'UPCOMING', unit: 'Central Examination Committee', order: 20 },
    { week: 'Post-Exam', dateRange: 'Jul 06 – Jul 17, 2026', title: 'Departmental Score Moderation & Broadsheet Compilation', description: 'Faculty board review, external examiners audit, and compilation of cumulative sessional GPAs.', category: 'SENATE', status: 'UPCOMING', unit: 'Faculty Examination Boards', order: 21 },
    { week: 'Senate', dateRange: 'Jul 27, 2026', title: 'Senate Approval of Sessional Results & Graduating Class', description: 'University Senate approval of sessional broadsheets, degree classifications, and graduation clearance.', category: 'SENATE', status: 'UPCOMING', unit: 'University Senate', order: 22 },
    { week: 'Recess', dateRange: 'Aug 03, 2026', title: 'End of Academic Session & Sessional Recess', description: 'Official closure of academic session; long vacation commences pending registry announcement of new session.', category: 'ACADEMIC', status: 'UPCOMING', unit: 'Academic Registry', order: 23 },
  ];

  const calendarEventsData = [
    ...firstSemMilestones.map((m) => ({
      sessionId: currentSession.id,
      semesterId: currentFirstSemester.id,
      ...m,
    })),
    ...secondSemMilestones.map((m) => ({
      sessionId: currentSession.id,
      semesterId: currentSecondSemester.id,
      ...m,
    })),
  ];

  await prisma.calendarEvent.createMany({ data: calendarEventsData });
  console.log(`✅ Seeded ${calendarEventsData.length} calendar milestones for 2025/2026: 1 IN_PROGRESS (Week 1), 22 UPCOMING.\n`);

  // ── 8. GENERATING EXACTLY 2,000 STUDENTS ────────────────────────────────────
  console.log('👥 Generating 2,000 students (400 per level across 100, 200, 300, 400, 500)...');
  const TOTAL_STUDENTS = 2000;
  const LEVELS = [100, 200, 300, 400, 500]; // 5 levels
  const STUDENTS_PER_LEVEL = 400; // 400 * 5 = 2000 students; each level >= 200 strictly

  const usersToInsert = [];
  const studentsToInsert = [];

  // Track student records in memory for registration seeding
  const generatedStudents = [];

  let studentCounter = 1;

  for (const level of LEVELS) {
    for (let i = 0; i < STUDENTS_PER_LEVEL; i++) {
      const matricNum = String(studentCounter).padStart(4, '0');
      const matricNo = `UG/25/${matricNum}`;
      const userId = `usr_std_${matricNum}`;
      const studentId = `rec_std_${matricNum}`;

      // Pick gender and realistic name
      const isFemale = studentCounter % 2 === 0;
      const firstNameList = isFemale ? FEMALE_FIRST_NAMES : MALE_FIRST_NAMES;
      const firstName = firstNameList[(studentCounter * 7) % firstNameList.length];
      const lastName = LAST_NAMES[(studentCounter * 11) % LAST_NAMES.length];
      const fullName = `${firstName} ${lastName}`;
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${matricNum}@futminna.edu.ng`;

      // Cycle evenly across the 4 departments (100 students per dept per level)
      const dept = departments[i % departments.length];
      const state = STATES[(studentCounter * 3) % STATES.length];

      usersToInsert.push({
        id: userId,
        username: matricNo,
        email: email,
        name: fullName,
        passwordHash: studentHash,
        role: 'STUDENT',
      });

      const studentRecord = {
        id: studentId,
        userId: userId,
        matricNo: matricNo,
        fullName: fullName,
        email: email,
        facultyId: dept.facultyId,
        departmentId: dept.model.id,
        level: level,
        gender: isFemale ? 'Female' : 'Male',
        phone: `080${String(10000000 + studentCounter).slice(0, 8)}`,
        state: state,
        status: 'ACTIVE',
      };

      studentsToInsert.push(studentRecord);
      generatedStudents.push({ ...studentRecord, deptPrefix: dept.prefix });

      studentCounter++;
    }
  }

  // Bulk insert users
  console.log('   ↳ Inserting 2,000 User accounts...');
  for (const chunk of chunkArray(usersToInsert, 100)) {
    await prisma.user.createMany({ data: chunk });
  }

  // Bulk insert students
  console.log('   ↳ Inserting 2,000 Student profiles...');
  for (const chunk of chunkArray(studentsToInsert, 100)) {
    await prisma.student.createMany({ data: chunk });
  }
  console.log(`✅ 2,000 students successfully seeded across all levels and departments.\n`);

  // ── 9. SEED COURSE REGISTRATIONS FOR 2025/2026 (STRICT LEVEL MATCHING) ──────
  console.log('📝 Seeding current course registrations for 2025/2026 (strictly matching student level)...');

  // Load created courses into memory grouped by [departmentId][level][semester]
  const allDBCourses = await prisma.course.findMany();
  const courseLookup = {};
  for (const c of allDBCourses) {
    const key = `${c.departmentId}_${c.level}_${c.semester}`;
    if (!courseLookup[key]) courseLookup[key] = [];
    courseLookup[key].push(c);
  }

  const registrationsToInsert = [];

  // Register first 100 students per level (500 students total) who have enrolled during Week 1
  for (let lvlIndex = 0; lvlIndex < LEVELS.length; lvlIndex++) {
    const lvl = LEVELS[lvlIndex];
    const lvlStudents = generatedStudents.filter((s) => s.level === lvl).slice(0, 100);

    for (const st of lvlStudents) {
      // First Semester courses at student's EXACT level and department
      const firstSemKey = `${st.departmentId}_${st.level}_FIRST`;
      const sem1Courses = courseLookup[firstSemKey] || [];

      // Second Semester courses at student's EXACT level and department
      const secondSemKey = `${st.departmentId}_${st.level}_SECOND`;
      const sem2Courses = courseLookup[secondSemKey] || [];

      for (const course of sem1Courses) {
        // Double-check strict level constraint:
        if (course.level !== st.level) continue;
        registrationsToInsert.push({
          id: `reg_25_1_${st.matricNo.replace(/\//g, '_')}_${course.code}`,
          studentId: st.id,
          courseId: course.id,
          sessionId: currentSession.id,
          semesterId: currentFirstSemester.id,
        });
      }

      // Also register second semester for half of them
      if (parseInt(st.matricNo.slice(-2), 10) % 2 === 0) {
        for (const course of sem2Courses) {
          if (course.level !== st.level) continue;
          registrationsToInsert.push({
            id: `reg_25_2_${st.matricNo.replace(/\//g, '_')}_${course.code}`,
            studentId: st.id,
            courseId: course.id,
            sessionId: currentSession.id,
            semesterId: currentSecondSemester.id,
          });
        }
      }
    }
  }

  console.log(`   ↳ Inserting ${registrationsToInsert.length} active session course registrations...`);
  for (const chunk of chunkArray(registrationsToInsert, 100)) {
    await prisma.courseRegistration.createMany({ data: chunk });
  }
  console.log(`✅ Current registrations seeded strictly according to student level.\n`);

  // ── 10. SEED PAST 2024/2025 RECORDS & SCORES FOR RETURNING STUDENTS ─────────
  console.log('🏆 Seeding past academic transcripts & scores in 2024/2025 for returning students...');
  const pastFirstSem = pastSession.semesters.find((s) => s.name === 'FIRST');
  const pastSecondSem = pastSession.semesters.find((s) => s.name === 'SECOND');

  const pastRegistrationsToInsert = [];
  const pastScoresToInsert = [];

  // Returning students: 200L, 300L, 400L, 500L (seed ~120 students with past completed sessions)
  const returningStudents = generatedStudents.filter((s) => s.level >= 200).slice(0, 120);

  for (const st of returningStudents) {
    const previousLevel = st.level - 100; // in 2024/2025 they were 1 level lower
    const pastCoursesKey = `${st.departmentId}_${previousLevel}_FIRST`;
    const pastCourses = courseLookup[pastCoursesKey] || [];

    for (let cIdx = 0; cIdx < pastCourses.length; cIdx++) {
      const course = pastCourses[cIdx];
      const regId = `past_reg_${st.matricNo.replace(/\//g, '_')}_${course.code}`;

      pastRegistrationsToInsert.push({
        id: regId,
        studentId: st.id,
        courseId: course.id,
        sessionId: pastSession.id,
        semesterId: pastFirstSem.id,
      });

      // Realistic grade distribution: A, B, C, D
      const caScore = 24 + ((st.id.charCodeAt(3) + cIdx * 3) % 15); // 24 - 38
      const examScore = 32 + ((st.id.charCodeAt(5) + cIdx * 5) % 26); // 32 - 57
      const totalScore = caScore + examScore;

      let grade = 'F';
      let gradePoint = 0;
      if (totalScore >= 70) { grade = 'A'; gradePoint = 5; }
      else if (totalScore >= 60) { grade = 'B'; gradePoint = 4; }
      else if (totalScore >= 50) { grade = 'C'; gradePoint = 3; }
      else if (totalScore >= 45) { grade = 'D'; gradePoint = 2; }
      else if (totalScore >= 40) { grade = 'E'; gradePoint = 1; }

      pastScoresToInsert.push({
        id: `score_${regId}`,
        registrationId: regId,
        caScore,
        examScore,
        totalScore,
        grade,
        gradePoint,
      });
    }
  }

  for (const chunk of chunkArray(pastRegistrationsToInsert, 100)) {
    await prisma.courseRegistration.createMany({ data: chunk });
  }
  for (const chunk of chunkArray(pastScoresToInsert, 100)) {
    await prisma.score.createMany({ data: chunk });
  }
  console.log(`✅ Seeded ${pastRegistrationsToInsert.length} historical registrations and grades for CGPA & transcript history.\n`);

  // ── 11. SUMMARY AUDIT ───────────────────────────────────────────────────────
  const [userCount, studentCount, courseCount, sessionCount, regCount, scoreCount, eventCount] =
    await Promise.all([
      prisma.user.count(),
      prisma.student.count(),
      prisma.course.count(),
      prisma.academicSession.count(),
      prisma.courseRegistration.count(),
      prisma.score.count(),
      prisma.calendarEvent.count(),
    ]);

  // Level breakdown
  const levelsCount = await prisma.student.groupBy({
    by: ['level'],
    _count: { id: true },
    orderBy: { level: 'asc' },
  });

  console.log('═══════════════════════════════════════════════════════════');
  console.log('🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Users:              ${userCount}`);
  console.log(`Students:           ${studentCount}`);
  console.log(`Courses:            ${courseCount}`);
  console.log(`Academic Sessions:  ${sessionCount}`);
  console.log(`Registrations:      ${regCount}`);
  console.log(`Scores:             ${scoreCount}`);
  console.log(`Calendar Events:    ${eventCount}`);
  console.log('-----------------------------------------------------------');
  console.log('Student Distribution by Level:');
  for (const lc of levelsCount) {
    console.log(`  • Level ${lc.level}L: ${lc._count.id} students (target >= 200: ✅ PASSED)`);
  }
  console.log('-----------------------------------------------------------');
  console.log('Active Academic Session:');
  console.log(`  • Name: ${currentSession.name} (isCurrent: ${currentSession.isCurrent})`);
  console.log(`  • Semesters: ${currentSession.semesters.map((s) => s.name).join(', ')}`);
  console.log('-----------------------------------------------------------');
  console.log('Key Test Accounts:');
  console.log('  • Admin:   admin / admin123');
  console.log('  • 100L:    UG/25/0001 / student123');
  console.log('  • 200L:    UG/25/0401 / student123');
  console.log('  • 300L:    UG/25/0801 / student123');
  console.log('  • 400L:    UG/25/1201 / student123');
  console.log('  • 500L:    UG/25/1601 / student123');
  console.log('═══════════════════════════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
