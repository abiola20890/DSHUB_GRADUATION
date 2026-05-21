/**
 * @file seed.js
 * @description Database seeder — bootstraps only the data that cannot be
 * created through the API: admin/mentor accounts and program milestones.
 *
 * WHY only these three:
 * - Admin accounts cannot self-register (role is restricted on POST /auth/register)
 * - Mentor accounts same reason
 * - Milestones are static program data, identical across every environment
 *
 * Everything else (intern users, intern profiles, testimonials, media) is
 * created through the real API flow via Postman or Swagger — this keeps
 * production data clean and avoids fake records on the live showcase.
 *
 * Usage:
 *   node src/config/seed.js            → seed admin, mentors, milestones
 *   node src/config/seed.js --destroy  → wipe all collections (no re-seed)
 *
 * Add to package.json scripts:
 *   "seed":    "node src/config/seed.js"
 *   "destroy": "node src/config/seed.js --destroy"
 *
 * IMPORTANT: Never run --destroy in production.
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from './db.js';
import User from '../models/user.model.js';
import Intern from '../models/intern.model.js';
import Testimonial from '../models/testimonial.model.js';
import Milestone from '../models/milestone.model.js';
import Media from '../models/media.model.js';
import Analytics from '../models/analytics.model.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const log  = (msg) => console.log(`\n[Seed] ${msg}`);
const line = ()    => console.log('[Seed] ─────────────────────────────────────');

// ---------------------------------------------------------------------------
// Seed Data
// ---------------------------------------------------------------------------

/**
 * Admin and mentor accounts.
 * Passwords are plain text — the User pre-save hook hashes them automatically.
 * Change these credentials immediately after first login in production.
 */
const accountData = [
  {
    fullName:      'DSHub Admin',
    email:         'admin@dshub.com',
    password:      'Admin@123456',
    role:          'admin',
    emailVerified: true,
    isActive:      true,
  },
  {
    fullName:      'DSHub Mentor',
    email:         'mentor@dshub.com',
    password:      'Mentor@123456',
    role:          'mentor',
    emailVerified: true,
    isActive:      true,
  },
];

/**
 * Program milestones — one per week covering the full 9-week cohort.
 * These are static and identical across dev, staging, and production.
 * Track-specific milestones have a track value; program-wide ones are null.
 */
const milestoneData = [
  {
    title:       'Cohort A 2026 Kickoff',
    description: 'Official launch of DSHub Cohort A 2026. Interns across all 8 tracks met their mentors, got onboarded to the program structure, and set goals for the 9-week journey.',
    week:        1,
    date:        new Date('2026-01-06'),
    track:       null,
    type:        'achievement',
    icon:        '🚀',
    isHighlight: true,
  },
  {
    title:       'Week 2 — BSF-Nutrifeed Repositioning',
    description: 'Theme: Repositioning — Changing the Narrative. Interns worked on the BSF-Nutrifeed case study, focusing on advanced API design, database optimization, field research, data security, and compliance best practices. Case Partner: Otondo Team by DSHub.',
    week:        2,
    date:        new Date('2026-03-30'),
    track:       null,
    type:        'technical',
    icon:        '📦',
    isHighlight: false,
  },
  {
    title:       'Week 3 — Resilience Beyond Controversy',
    description: 'Theme: Resilience Beyond Controversy. Interns tackled a reputation crisis and brand recovery challenge for Otondo Team. Backend track focused on secure API redesign, data integrity systems, compliance layers, and malware risk mitigation.',
    week:        3,
    date:        new Date('2026-04-06'),
    track:       null,
    type:        'achievement',
    icon:        '🔍',
    isHighlight: false,
  },
  {
    title:       'Week 4 — Project Cold Response (OpenGuard)',
    description: 'Theme: Project Cold Response. All tracks collaborated on the OpenGuard system — a real-world codebase challenge. Backend refactored APIs and implemented JWT auth, frontend built a security dashboard, and cybersecurity performed STRIDE threat modeling and penetration testing.',
    week:        4,
    date:        new Date('2026-04-13'),
    track:       null,
    type:        'collaboration',
    icon:        '🤝',
    isHighlight: true,
  },
  {
    title:       'Week 5 — LinkedIn Personal Branding',
    description: 'All interns worked on positioning themselves professionally on LinkedIn. This included optimising profiles, crafting personal brand statements, building their network, and learning how to showcase their DSHub work to potential employers.',
    week:        5,
    date:        new Date('2026-04-21'),
    track:       null,
    type:        'achievement',
    icon:        '💼',
    isHighlight: false,
  },
  {
    title:       'Weeks 6 & 7 — Farm Wizard App Sprint',
    description: 'Theme: From Novice to Digital Leader — The Power of Resilience. Double week cross-track sprint building the Farm Wizard App — a gamified digital agriculture platform. Frontend built the UI, backend developed the growth logic engine and REST APIs, cybersecurity secured the architecture. Case Partner: Otondo Team by DSHub. SDG 3.',
    week:        6,
    date:        new Date('2026-04-27'),
    track:       null,
    type:        'collaboration',
    icon:        '🌱',
    isHighlight: true,
  },
  {
    title:       'Weeks 6 & 7 — Farm Wizard App Sprint (Continued)',
    description: 'Continuation of the Farm Wizard double week sprint. Hotseat and Coldseat presentations delivered. All tracks integrated their deliverables — API integration, real-time growth simulation UI, penetration testing, and deployment. Final submission: Monday 11th May 2026.',
    week:        7,
    date:        new Date('2026-05-04'),
    track:       null,
    type:        'collaboration',
    icon:        '🔗',
    isHighlight: false,
  },
  {
    title:       'Weeks 8 & 9 — DSHub Graduation Platform',
    description: 'Theme: From Learning to Legacy — Telling the Story of DSHub Internship. All tracks collaborated to build the official DSHub Graduation Digital Experience Platform — featuring intern profiles, cohort showcase, analytics dashboard, media gallery, authentication system, and DevOps pipeline. SDG 8 & 9.',
    week:        8,
    date:        new Date('2026-05-12'),
    track:       null,
    type:        'collaboration',
    icon:        '🏁',
    isHighlight: true,
  },
  {
    title:       'DSHub Cohort A 2026 Graduation Ceremony',
    description: 'The DSHub Graduation Digital Experience Platform went live. Interns from all 8 tracks — backend, frontend, cybersecurity, data science & analytics, product management, AI/ML, digital marketing, and content creation — officially graduated from DSHub Cohort A 2026. Final submission deadline: Sunday 24th May 2026.',
    week:        9,
    date:        new Date('2026-05-24'),
    track:       null,
    type:        'achievement',
    icon:        '🎓',
    isHighlight: true,
  },
];

// ---------------------------------------------------------------------------
// Destroy — wipe all collections
// ---------------------------------------------------------------------------

const destroy = async () => {
  log('Destroying all collections...');

  await Promise.all([
    Analytics.deleteMany({}),
    Media.deleteMany({}),
    Milestone.deleteMany({}),
    Testimonial.deleteMany({}),
    Intern.deleteMany({}),
    User.deleteMany({}),
  ]);

  log('All collections wiped.');
};

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

const seed = async () => {
  // 1. Admin and mentor accounts
  log('Creating admin and mentor accounts...');
  const accounts = await User.create(accountData);
  log(`Created ${accounts.length} accounts.`);

  // 2. Milestones
  log('Creating milestones...');
  const milestones = await Milestone.create(milestoneData);
  log(`Created ${milestones.length} milestones.`);
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const run = async () => {
  try {
    await connectDB();

    const isDestroy = process.argv.includes('--destroy');

    await destroy();

    if (isDestroy) {
      log('--destroy flag detected. Database wiped. No data seeded.');
    } else {
      await seed();

      line();
      log('✅ Seed complete. Use these credentials to get started:\n');
      console.log('  Admin:   admin@dshub.com   /  Admin@123456');
      console.log('  Mentor:  mentor@dshub.com  /  Mentor@123456');
      line();
      log('Next steps:');
      console.log('  1. Log in as admin via POST /api/v1/auth/login');
      console.log('  2. Register intern accounts via POST /api/v1/auth/register');
      console.log('  3. Create intern profiles via POST /api/v1/interns');
      console.log('  4. Upload media via POST /api/v1/media');
      line();
    }

    process.exit(0);
  } catch (err) {
    console.error('\n[Seed] ❌ Failed:', err.message);
    if (process.env.NODE_ENV !== 'production') {
      console.error(err.stack);
    }
    process.exit(1);
  }
};

run();