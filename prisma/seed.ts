/**
 * Phase 2 seed data.
 *
 * Standards below are transcribed from official public sources, not
 * AI-invented placeholders — see the citation on each block. This is a
 * curated subset (not the complete official standards documents); admins
 * can add more through the Standards library once that UI exists
 * (ROADMAP.md Phase 12). Every code the AI Curriculum Builder invents that
 * isn't in this table gets auto-registered at generation time (see
 * lib/ai/curriculum-service.ts:resolveStandards) so coverage grows with use.
 */
import { PrismaClient, Role, EquipmentCategory } from "@prisma/client";

const db = new PrismaClient();

// Source: California CTE Model Curriculum Standards, Arts, Media & Entertainment
// sector, Foundation Standards 1.0-11.0 (shared across all AME pathways).
// https://www.cde.ca.gov/ci/ct/sf/documents/ctestandards.pdf
const CTE_FOUNDATION_STANDARDS = [
  { code: "F1.0", description: "Academics: Students understand the academic content required for entry into postsecondary education and employment in the Arts, Media, and Entertainment sector." },
  { code: "F2.0", description: "Communications: Students understand the principles of effective oral, written, and multimedia communication in a variety of formats and contexts." },
  { code: "F3.0", description: "Career Planning and Management: Students understand how to make effective decisions, use career information, and manage personal career plans." },
  { code: "F4.0", description: "Technology: Students know how to use contemporary and emerging technological resources in diverse and changing personal, community, and workplace environments." },
  { code: "F5.0", description: "Problem Solving and Critical Thinking: Students understand how to create alternative solutions by using critical and creative thinking skills, such as logical reasoning, analytical thinking, and problem-solving techniques." },
  { code: "F6.0", description: "Health and Safety: Students understand health and safety policies, procedures, regulations, and practices, including the use of personal protective equipment." },
  { code: "F7.0", description: "Responsibility and Flexibility: Students know the behaviors associated with being a responsible and flexible individual member of a career and technical education community." },
  { code: "F8.0", description: "Ethics and Legal Responsibilities: Students understand professional, ethical, and legal behavior consistent with applicable laws, regulations, and industry standards." },
  { code: "F9.0", description: "Leadership and Teamwork: Students understand effective leadership styles, key concepts of group dynamics, team and individual decision making, and the ability to lead and inspire others." },
  { code: "F10.0", description: "Technical Knowledge and Skills: Students understand the essential knowledge and skills common to all pathways in the Arts, Media, and Entertainment sector." },
  { code: "F11.0", description: "Demonstration and Application: Students demonstrate and apply the knowledge and skills of the Arts, Media, and Entertainment sector core subject matter and, where applicable, its pathways." },
] as const;

// Source: California CTE Model Curriculum Standards, Production and
// Managerial Arts Pathway (Arts, Media & Entertainment sector).
// https://www2.cde.ca.gov/cacs/id/web/24392, /24394, /24398
const PRODUCTION_MANAGERIAL_ARTS_STANDARDS = [
  {
    code: "C.1.2",
    description:
      "Demonstrate knowledge of industry safety standards and practices in all areas of technical production. Performance indicator: Demonstrate knowledge of basic electrical safety.",
  },
  {
    code: "C.1.4",
    description:
      "Demonstrate knowledge of industry safety standards and practices in all areas of technical production. Performance indicator: Apply safety related decision making and problem-solving techniques to live, recorded, or multimedia generated production.",
  },
  {
    code: "C.2.3",
    description:
      "Understand the technical support functions and artistic competencies in film, video, and live production. Performance indicator: Plan one technical component of a production from design to performance.",
  },
] as const;

// Source: California Arts Standards for Media Arts, High School Proficient
// level (National Core Arts Standards framework, adopted by the CA State
// Board of Education 2019). https://www.rcoe.us/media/arxdxlua/ca-arts-standards-media-arts.pdf
const VAPA_MEDIA_ARTS_STANDARDS = [
  {
    code: "Prof.MA:Cr1",
    description:
      "Generate and conceptualize artistic ideas and work. Use identified generative methods to formulate multiple ideas, develop artistic goals, and problem solve in media arts creation processes.",
  },
  {
    code: "Prof.MA:Cr2",
    description:
      "Organize and develop artistic ideas and work. Apply aesthetic criteria in developing, and refining artistic ideas, plans, prototypes, and production processes for media arts productions, considering original inspirations, goals, and presentation context.",
  },
  {
    code: "Prof.MA:Pr4",
    description:
      "Select, analyze, and interpret artistic work for presentation. Integrate various arts, media arts forms, and content into unified media arts productions, considering the reaction and interaction of the audience and experiential design.",
  },
  {
    code: "Prof.MA:Pr5",
    description:
      "Develop and refine artistic techniques and work for presentation. Demonstrate progression in artistic, design, technical, and soft skills as a result of selecting and fulfilling specified roles in the production of a variety of media artworks; develop and refine a determined range of creative and innovative abilities in addressing identified challenges and constraints within media arts productions.",
  },
  {
    code: "Prof.MA:Re7",
    description:
      "Perceive and analyze artistic work. Analyze and describe the qualities of and relationships between the components, content, and intentions of various media artworks, and how a variety of media artworks manage audience experience and create intention through multimodal perception.",
  },
  {
    code: "Prof.MA:Cn10",
    description:
      "Synthesize and relate knowledge and personal experiences to make art. Access, evaluate, and integrate personal and external resources to inform the creation of original media artworks; explain and demonstrate the use of media artworks to expand meaning and knowledge and create cultural experiences.",
  },
  {
    code: "Prof.MA:Cn11",
    description:
      "Relate artistic ideas and works with societal, cultural, and historical context to deepen understanding. Demonstrate and explain how media artworks relate to various contexts, purposes, and values; critically evaluate and effectively interact with legal, technological, systemic, and vocational contexts of media arts, considering civic values, media literacy, and digital identity.",
  },
] as const;

// Source: ISTE Standards for Students (2016), the seven student standards.
// https://www.iste.org/standards/iste-standards-for-students
const ISTE_STANDARDS = [
  { code: "1", description: "Empowered Learner: Students leverage technology to take an active role in choosing, achieving, and demonstrating competency in their learning goals." },
  { code: "2", description: "Digital Citizen: Students recognize the rights, responsibilities, and opportunities of living, learning, and working in an interconnected digital world, and act in ways that are safe, legal, and ethical." },
  { code: "3", description: "Knowledge Constructor: Students critically curate a variety of resources using digital tools to construct knowledge, produce creative artifacts, and make meaningful learning experiences." },
  { code: "4", description: "Innovative Designer: Students use a variety of technologies within a design process to identify and solve problems by creating new, useful, or imaginative solutions." },
  { code: "5", description: "Computational Thinker: Students develop and employ strategies for understanding and solving problems in ways that leverage the power of technological methods to develop and test solutions." },
  { code: "6", description: "Creative Communicator: Students communicate clearly and express themselves creatively for a variety of purposes using the platforms, tools, styles, formats, and digital media appropriate to their goals." },
  { code: "7", description: "Global Collaborator: Students use digital tools to broaden their perspectives and enrich their learning by collaborating with others and working effectively in teams locally and globally." },
] as const;

async function seedStandards() {
  await db.standard.createMany({
    data: CTE_FOUNDATION_STANDARDS.map((s) => ({ framework: "CA_CTE_AME" as const, strand: "Foundation", ...s })),
    skipDuplicates: true,
  });
  await db.standard.createMany({
    data: PRODUCTION_MANAGERIAL_ARTS_STANDARDS.map((s) => ({
      framework: "CA_CTE_AME" as const,
      strand: "Production and Managerial Arts Pathway",
      ...s,
    })),
    skipDuplicates: true,
  });
  await db.standard.createMany({
    data: VAPA_MEDIA_ARTS_STANDARDS.map((s) => ({
      framework: "CA_VAPA_MEDIA_ARTS" as const,
      strand: "Media Arts — High School Proficient",
      ...s,
    })),
    skipDuplicates: true,
  });
  await db.standard.createMany({
    data: ISTE_STANDARDS.map((s) => ({ framework: "ISTE" as const, strand: "Students", ...s })),
    skipDuplicates: true,
  });

  console.log(
    `Seeded ${CTE_FOUNDATION_STANDARDS.length + PRODUCTION_MANAGERIAL_ARTS_STANDARDS.length} CTE, ${VAPA_MEDIA_ARTS_STANDARDS.length} VAPA, and ${ISTE_STANDARDS.length} ISTE standards.`,
  );
}

async function seedDemoOrg() {
  const org = await db.organization.upsert({
    where: { id: "demo-org" },
    update: {},
    create: {
      id: "demo-org",
      name: "Riverside Media Arts Academy",
      district: "Riverside Unified School District",
      cdsCode: "33-67472-0000000",
    },
  });

  const teacher = await db.user.upsert({
    where: { email: "teacher@demo.filmstudioclassroom.ai" },
    update: {},
    create: {
      email: "teacher@demo.filmstudioclassroom.ai",
      name: "Jordan Alvarez",
      role: Role.TEACHER,
      organizationId: org.id,
    },
  });

  await db.user.upsert({
    where: { email: "admin@demo.filmstudioclassroom.ai" },
    update: {},
    create: {
      email: "admin@demo.filmstudioclassroom.ai",
      name: "Priya Nathan",
      role: Role.ADMIN,
      organizationId: org.id,
    },
  });

  await db.user.upsert({
    where: { email: "mentor@demo.filmstudioclassroom.ai" },
    update: {},
    create: {
      email: "mentor@demo.filmstudioclassroom.ai",
      name: "Sam Okafor",
      role: Role.MENTOR,
      organizationId: org.id,
    },
  });

  const classPeriod = await db.classPeriod.upsert({
    where: { id: "demo-class-period" },
    update: {},
    create: {
      id: "demo-class-period",
      name: "Intro to Film Production — Period 3",
      period: "3",
      gradeLevel: "10",
      organizationId: org.id,
      teacherId: teacher.id,
    },
  });

  const studentNames = [
    "Maya Chen",
    "Diego Ramirez",
    "Aaliyah Johnson",
    "Ethan Park",
    "Sofia Rossi",
  ];

  const students = await Promise.all(
    studentNames.map((name, i) =>
      db.user.upsert({
        where: { email: `student${i + 1}@demo.filmstudioclassroom.ai` },
        update: {},
        create: {
          email: `student${i + 1}@demo.filmstudioclassroom.ai`,
          name,
          role: Role.STUDENT,
          organizationId: org.id,
        },
      }),
    ),
  );

  await Promise.all(
    students.map((student) =>
      db.enrollment.upsert({
        where: { studentId_classPeriodId: { studentId: student.id, classPeriodId: classPeriod.id } },
        update: {},
        create: { studentId: student.id, classPeriodId: classPeriod.id },
      }),
    ),
  );

  const parent = await db.user.upsert({
    where: { email: "parent@demo.filmstudioclassroom.ai" },
    update: {},
    create: { email: "parent@demo.filmstudioclassroom.ai", name: "Lin Chen", role: Role.PARENT },
  });

  await db.parentLink.upsert({
    where: { parentId_studentId: { parentId: parent.id, studentId: students[0]!.id } },
    update: {},
    create: { parentId: parent.id, studentId: students[0]!.id },
  });

  const equipment: Array<{ name: string; category: EquipmentCategory; assetTag: string }> = [
    { name: "Sony FX30", category: EquipmentCategory.CAMERA, assetTag: "CAM-001" },
    { name: "Sony FX30", category: EquipmentCategory.CAMERA, assetTag: "CAM-002" },
    { name: "Rode Wireless GO II", category: EquipmentCategory.AUDIO, assetTag: "AUD-001" },
    { name: "Aputure 120D II", category: EquipmentCategory.LIGHTING, assetTag: "LGT-001" },
    { name: "DJI RS 3 Mini Gimbal", category: EquipmentCategory.GIMBAL, assetTag: "GIM-001" },
    { name: "DJI Mini 4 Pro Drone", category: EquipmentCategory.DRONE, assetTag: "DRN-001" },
  ];

  await Promise.all(
    equipment.map((item) =>
      db.equipmentItem.upsert({
        where: { assetTag: item.assetTag },
        update: {},
        create: { ...item, organizationId: org.id },
      }),
    ),
  );

  console.log(
    `Seeded demo org "${org.name}" with 1 teacher, 1 admin, 1 mentor, 1 parent, ${students.length} students, 1 class period, and ${equipment.length} equipment items.`,
  );
}

async function main() {
  await seedStandards();
  await seedDemoOrg();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
