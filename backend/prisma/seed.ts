import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create default admin user
  const adminPassword = await bcrypt.hash('Admin123!@#', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@donor-oversight.local' },
    update: {},
    create: {
      email: 'admin@donor-oversight.local',
      passwordHash: adminPassword,
      fullName: 'System Administrator',
      role: 'Admin',
      isActive: true,
    },
  });
  console.log('Created admin user:', admin.email);

  // Create test users for each role
  const testUsers = [
    { email: 'pm@donor-oversight.local', password: 'PM123!@#', fullName: 'Project Manager', role: 'ProjectManager' },
    { email: 'finance@donor-oversight.local', password: 'Finance123!@#', fullName: 'Finance Officer', role: 'Finance' },
    { email: 'committee@donor-oversight.local', password: 'Committee123!@#', fullName: 'Committee Member', role: 'CommitteeMember' },
    { email: 'auditor@donor-oversight.local', password: 'Auditor123!@#', fullName: 'Auditor', role: 'Auditor' },
    { email: 'viewer@donor-oversight.local', password: 'Viewer123!@#', fullName: 'Viewer', role: 'Viewer' },
  ];

  for (const user of testUsers) {
    const hashedPassword = await bcrypt.hash(user.password, 12);
    const created = await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        email: user.email,
        passwordHash: hashedPassword,
        fullName: user.fullName,
        role: user.role,
        isActive: true,
      },
    });
    console.log('Created user:', created.email);
  }

  // Create default system settings
  const settings = [
    {
      key: 'yearRangeMin',
      value: 2020,
      description: 'Minimum supported year for annual estimates',
    },
    {
      key: 'yearRangeMax',
      value: 2040,
      description: 'Maximum supported year for annual estimates',
    },
    {
      key: 'approvalThresholdUsd',
      value: 5000,
      description: 'Changes below this amount skip Finance approval (single-step)',
    },
    {
      key: 'approvalThresholdPercent',
      value: 10,
      description: 'Changes below this % skip Finance approval (single-step)',
    },
    {
      key: 'maxImportRows',
      value: 5000,
      description: 'Maximum rows allowed in Excel import',
    },
    {
      key: 'maxAttachmentSizeMb',
      value: 50,
      description: 'Maximum attachment file size in MB',
    },
    {
      key: 'auditRetentionDays',
      value: 2555,
      description: 'Audit log retention period (7 years default)',
    },
    {
      key: 'sessionIdleMinutes',
      value: 30,
      description: 'Session idle timeout',
    },
    {
      key: 'sessionAbsoluteHours',
      value: 8,
      description: 'Session absolute timeout',
    },
    {
      key: 'emailNotificationsEnabled',
      value: false,
      description: 'Enable email notifications',
    },
    {
      key: 'smtpHost',
      value: '',
      description: 'SMTP server host',
    },
    {
      key: 'smtpPort',
      value: 587,
      description: 'SMTP server port',
    },
    {
      key: 'smtpUser',
      value: '',
      description: 'SMTP username',
    },
    {
      key: 'smtpPassword',
      value: '',
      description: 'SMTP password (encrypted)',
    },
    {
      key: 'emailFromAddress',
      value: 'noreply@donor-oversight.org',
      description: 'From email address',
    },
    {
      key: 'maxLoginAttempts',
      value: 5,
      description: 'Maximum failed login attempts before lockout',
    },
    {
      key: 'allowedMimeTypes',
      value: [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png',
      ],
      description: 'Allowed MIME types for attachments',
    },
    {
      key: 'nigerianStates',
      value: [
        'Abia',
        'Adamawa',
        'Akwa Ibom',
        'Bauchi',
        'Bayelsa',
        'Benue',
        'Borno',
        'Cross River',
        'Delta',
        'Ebonyi',
        'Edo',
        'Ekiti',
        'Enugu',
        'Gombe',
        'Imo',
        'Jigawa',
        'Kaduna',
        'Kano',
        'Katsina',
        'Kebbi',
        'Kogi',
        'Kwara',
        'Lagos',
        'Nasarawa',
        'Niger',
        'Ogun',
        'Ondo',
        'Osun',
        'Oyo',
        'Plateau',
        'Rivers',
        'Sokoto',
        'Taraba',
        'Yobe',
        'Zamfara',
        'FCT',
      ],
      description: 'Valid Nigerian states for investment objectives',
    },
  ];

  for (const setting of settings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: {
        key: setting.key,
        value: setting.value,
        description: setting.description,
      },
    });
  }
  console.log('Created system settings');

  // --- Create Custom Data for Manual Testing ---

  // 1. Get the admin user to be the creator
  const adminUser = await prisma.user.findUnique({ where: { email: 'admin@donor-oversight.local' } });
  if (!adminUser) throw new Error('Admin user not found for data creation');

  // 2. Define 6 Investment Objectives
  const objectivesData = [
    {
      title: 'Sustainable Agriculture Initiative',
      shortDescription: 'Enhancing crop yields and market access for smallholder farmers.',
      longDescription: 'A comprehensive program aimed at introducing sustainable farming practices, providing high-quality seeds, and establishing direct links to markets for farmers in rural areas.',
      states: ['Benue', 'Taraba', 'Niger'],
      regions: ['North-Central', 'North-East'],
      overallStartYear: 2024,
      overallEndYear: 2027,
      status: 'Active',
      tags: ['Agriculture', 'Sustainability', 'Rural Development'],
    },
    {
      title: 'Urban Youth Education Program',
      shortDescription: 'Improving literacy and vocational skills for urban youth.',
      longDescription: 'Targeting underprivileged youth in major urban centers, this objective focuses on digital literacy, vocational training, and scholarships for higher education.',
      states: ['Lagos', 'Rivers', 'Kano'],
      regions: ['South-West', 'South-South', 'North-West'],
      overallStartYear: 2023,
      overallEndYear: 2026,
      status: 'Active',
      tags: ['Education', 'Youth', 'Urban'],
    },
    {
      title: 'Healthcare Access Expansion',
      shortDescription: 'Building clinics and supplying medical equipment to underserved regions.',
      longDescription: 'Constructing community health centers, providing mobile clinics, and ensuring a steady supply of essential medicines to remote villages.',
      states: ['Sokoto', 'Kebbi', 'Zamfara'],
      regions: ['North-West'],
      overallStartYear: 2024,
      overallEndYear: 2028,
      status: 'Active',
      tags: ['Healthcare', 'Infrastructure', 'Community'],
    },
    {
      title: 'Clean Water for All',
      shortDescription: 'Drilling boreholes and installing water purification systems.',
      longDescription: 'Aims to reduce waterborne diseases by providing access to clean, potable water through solar-powered boreholes and community water treatment plants.',
      states: ['Bauchi', 'Gombe', 'Yobe'],
      regions: ['North-East'],
      overallStartYear: 2025,
      overallEndYear: 2029,
      status: 'Planned',
      tags: ['Water', 'Sanitation', 'Health'],
    },
    {
      title: 'Renewable Energy Pilot',
      shortDescription: 'Implementing solar micro-grids in off-grid communities.',
      longDescription: 'Deploying solar home systems and micro-grids to power homes, schools, and small businesses in communities unconnected to the national grid.',
      states: ['Ekiti', 'Ondo', 'Osun'],
      regions: ['South-West'],
      overallStartYear: 2023,
      overallEndYear: 2025,
      status: 'Active',
      tags: ['Energy', 'Solar', 'Environment'],
    },
    {
      title: 'Women Economic Empowerment',
      shortDescription: 'Grants and training for women-led SMEs.',
      longDescription: 'Providing financial grants, business management training, and mentorship to women entrepreneurs to help them scale their businesses.',
      states: ['Enugu', 'Ebonyi', 'Abia'],
      regions: ['South-East'],
      overallStartYear: 2024,
      overallEndYear: 2026,
      status: 'Active',
      tags: ['Women', 'Business', 'Empowerment'],
    },
  ];

  console.log('Creating 6 Investment Objectives...');
  const createdObjectives = [];
  for (const obj of objectivesData) {
    const created = await prisma.investmentObjective.create({
      data: {
        ...obj,
        createdById: adminUser.id,
        updatedById: adminUser.id,
        computedEstimatedSpendUsd: 0, // Will update later
      },
    });
    createdObjectives.push(created);
    console.log(`Created Objective: ${created.title}`);
  }

  // 3. Define 15 Activities
  const activitiesData = [
    { title: 'Distribution of High-Yield Seeds', estimatedSpendUsdTotal: 150000, status: 'Completed', progressPercent: 100 },
    { title: 'Construction of Grain Storage Silos', estimatedSpendUsdTotal: 300000, status: 'InProgress', progressPercent: 45 },
    { title: 'Farmer Cooperative Training Workshops', estimatedSpendUsdTotal: 50000, status: 'Active', progressPercent: 20 },
    
    { title: 'Renovation of Lagos City Schools', estimatedSpendUsdTotal: 500000, status: 'InProgress', progressPercent: 60 },
    { title: 'Digital Literacy Bootcamp for 500 Youths', estimatedSpendUsdTotal: 75000, status: 'Completed', progressPercent: 100 },
    { title: 'Vocational Center Equipment Procurement', estimatedSpendUsdTotal: 200000, status: 'Planned', progressPercent: 0 },
    
    { title: 'Construction of Sokoto Primary Health Center', estimatedSpendUsdTotal: 450000, status: 'InProgress', progressPercent: 30 },
    { title: 'Deployment of 5 Mobile Clinics', estimatedSpendUsdTotal: 250000, status: 'Active', progressPercent: 10 },
    
    { title: 'Geophysical Survey for Borehole Sites', estimatedSpendUsdTotal: 20000, status: 'Completed', progressPercent: 100 },
    { title: 'Drilling of 50 Solar-Powered Boreholes', estimatedSpendUsdTotal: 600000, status: 'Planned', progressPercent: 0 },
    
    { title: 'Solar Panel Installation in Community Center', estimatedSpendUsdTotal: 80000, status: 'Completed', progressPercent: 100 },
    { title: 'Maintenance Training for Local Technicians', estimatedSpendUsdTotal: 15000, status: 'Active', progressPercent: 50 },
    
    { title: 'Micro-Grant Disbursement Phase 1', estimatedSpendUsdTotal: 100000, status: 'Completed', progressPercent: 100 },
    { title: 'SME Management Workshop Series', estimatedSpendUsdTotal: 40000, status: 'InProgress', progressPercent: 75 },
    { title: 'Annual Women Business Summit', estimatedSpendUsdTotal: 60000, status: 'Planned', progressPercent: 0 },
  ];

  console.log('Creating 15 Activities...');
  
  // Helper to get random dates within range
  const getRandomDate = (start: Date, end: Date) => {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  };

  // Distribute activities randomly among objectives
  for (const act of activitiesData) {
    const randomObjIndex = Math.floor(Math.random() * createdObjectives.length);
    const objective = createdObjectives[randomObjIndex];
    
    // Generate dates within objective range
    const startDate = new Date(`${objective.overallStartYear}-01-01`);
    const endDate = new Date(`${objective.overallEndYear}-12-31`);
    const actStart = getRandomDate(startDate, new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000)); // Start at least 30 days before end
    const actEnd = getRandomDate(actStart, endDate);

    // Map string status to enum
    let statusEnum: 'Planned' | 'InProgress' | 'Completed' | 'OnHold' | 'Cancelled' = 'Planned';
    if (act.status === 'Active') statusEnum = 'InProgress';
    else if (act.status === 'Completed') statusEnum = 'Completed';
    else if (act.status === 'InProgress') statusEnum = 'InProgress';

    await prisma.activity.create({
      data: {
        title: act.title,
        investmentObjectiveId: objective.id,
        startDate: actStart,
        endDate: actEnd,
        status: statusEnum,
        progressPercent: act.progressPercent,
        estimatedSpendUsdTotal: act.estimatedSpendUsdTotal,
        actualSpendUsdTotal: act.progressPercent > 0 ? act.estimatedSpendUsdTotal * (act.progressPercent / 100) * 0.9 : 0, // Simulate some actuals
        lead: 'Test User',
        createdById: adminUser.id,
        updatedById: adminUser.id,
        annualEstimates: {}, // Simplified for seed
      },
    });
    console.log(`Created Activity: "${act.title}" for Objective: "${objective.title}"`);
  }

  // 4. Update Computed Spend on Objectives
  console.log('Updating objective totals...');
  for (const obj of createdObjectives) {
    const activities = await prisma.activity.findMany({
      where: { investmentObjectiveId: obj.id },
      select: { estimatedSpendUsdTotal: true }
    });
    
    const total = activities.reduce((sum, a) => sum + (Number(a.estimatedSpendUsdTotal) || 0), 0);
    
    await prisma.investmentObjective.update({
      where: { id: obj.id },
      data: { computedEstimatedSpendUsd: total }
    });
  }

  console.log('Seeding complete');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
