-- CreateEnum
CREATE TYPE "Role" AS ENUM ('STUDENT', 'TEACHER', 'ADMIN', 'PARENT', 'MENTOR');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'TARDY', 'EXCUSED');

-- CreateEnum
CREATE TYPE "StandardFramework" AS ENUM ('CA_CTE_AME', 'CA_VAPA_MEDIA_ARTS', 'CA_COMMON_CORE_ELA', 'ISTE', 'DIGITAL_CITIZENSHIP', 'EMPLOYABILITY');

-- CreateEnum
CREATE TYPE "ProjectCategory" AS ENUM ('COMMERCIAL', 'MOVIE_TRAILER', 'MUSIC_VIDEO', 'DOCUMENTARY', 'PSA', 'NEWS_BROADCAST', 'SPORTS_BROADCAST', 'WEATHER_REPORT', 'INTERVIEW', 'PODCAST', 'STOP_MOTION', 'ANIMATION', 'SHORT_FILM', 'FEATURE_UNIT', 'TRAVEL_VIDEO', 'PRODUCT_VIDEO', 'YOUTUBE_VIDEO', 'SOCIAL_VIDEO', 'VERTICAL_VIDEO', 'EXPERIMENTAL', 'HORROR', 'COMEDY_GENRE', 'SCI_FI', 'MYSTERY', 'WESTERN', 'FILM_NOIR', 'HISTORICAL', 'GREEN_SCREEN', 'VIRTUAL_PRODUCTION', 'MULTI_CAM_STUDIO', 'LIVE_STREAM', 'DRONE', 'VIDEO_360', 'VR_PRODUCTION', 'AR_PRODUCTION');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('DRAFT', 'GENERATING', 'READY', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "LessonDay" AS ENUM ('MONDAY_LAUNCH', 'TUESDAY_PREPRODUCTION', 'WEDNESDAY_PRODUCTION', 'THURSDAY_EDITING', 'FRIDAY_SHOWCASE');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'REVIEWED', 'GRADED');

-- CreateEnum
CREATE TYPE "EquipmentCategory" AS ENUM ('CAMERA', 'LENS', 'LIGHTING', 'AUDIO', 'DRONE', 'TRIPOD', 'GIMBAL', 'SD_CARD', 'BATTERY', 'OTHER');

-- CreateEnum
CREATE TYPE "PortfolioItemType" AS ENUM ('PROJECT_ARCHIVE', 'CERTIFICATE', 'BADGE', 'RESUME', 'DEMO_REEL');

-- CreateEnum
CREATE TYPE "ChatRole" AS ENUM ('USER', 'ASSISTANT');

-- CreateEnum
CREATE TYPE "IntegrationProviderType" AS ENUM ('GOOGLE_CLASSROOM', 'CANVAS', 'SCHOOLOGY', 'BLACKBOARD', 'INFINITE_CAMPUS', 'GOOGLE_WORKSPACE', 'MICROSOFT_365', 'ADOBE_CREATIVE_CLOUD', 'YOUTUBE', 'VIMEO', 'FRAME_IO', 'ZAPIER', 'SLACK');

-- CreateEnum
CREATE TYPE "AIJobStatus" AS ENUM ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED');

-- CreateEnum
CREATE TYPE "TutorialCategory" AS ENUM ('CAMERA_OPERATION', 'LIGHTING', 'AUDIO', 'EDITING', 'DIRECTING', 'SCREENWRITING', 'BROADCAST_JOURNALISM', 'ANIMATION', 'SAFETY', 'CAREER', 'OTHER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "image" TEXT,
    "role" "Role" NOT NULL DEFAULT 'STUDENT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "emailVerified" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParentLink" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,

    CONSTRAINT "ParentLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "district" TEXT,
    "cdsCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invite" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "token" TEXT NOT NULL,
    "studentId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassPeriod" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "period" TEXT,
    "gradeLevel" TEXT NOT NULL,
    "pathway" TEXT NOT NULL DEFAULT 'Production and Managerial Arts',
    "organizationId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClassPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enrollment" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "classPeriodId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceRecord" (
    "id" TEXT NOT NULL,
    "classPeriodId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "notes" TEXT,
    "recordedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Standard" (
    "id" TEXT NOT NULL,
    "framework" "StandardFramework" NOT NULL,
    "code" TEXT NOT NULL,
    "strand" TEXT,
    "description" TEXT NOT NULL,

    CONSTRAINT "Standard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "ProjectCategory" NOT NULL,
    "status" "ProjectStatus" NOT NULL DEFAULT 'DRAFT',
    "classPeriodId" TEXT NOT NULL,
    "weekOf" TIMESTAMP(3),
    "brief" TEXT NOT NULL,
    "gammaUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectStandard" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "standardId" TEXT NOT NULL,

    CONSTRAINT "ProjectStandard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lesson" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "day" "LessonDay" NOT NULL,
    "title" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "iCanStatement" TEXT NOT NULL,
    "agenda" JSONB NOT NULL,
    "slidesUrl" TEXT,
    "worksheet" JSONB,
    "differentiation" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonStandard" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "standardId" TEXT NOT NULL,

    CONSTRAINT "LessonStandard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rubric" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "criteria" JSONB NOT NULL,

    CONSTRAINT "Rubric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quiz" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "questions" JSONB NOT NULL,

    CONSTRAINT "Quiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VocabularyTerm" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "definition" TEXT NOT NULL,

    CONSTRAINT "VocabularyTerm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Storyboard" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "visualTheme" JSONB NOT NULL,
    "shots" JSONB NOT NULL,

    CONSTRAINT "Storyboard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionPlan" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "callSheet" JSONB NOT NULL,
    "crewRoles" JSONB NOT NULL,
    "equipmentList" JSONB NOT NULL,
    "schedule" JSONB NOT NULL,

    CONSTRAINT "ProductionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "videoUrl" TEXT,
    "reflection" TEXT,
    "peerReview" JSONB,
    "selfAssess" JSONB,
    "grade" JSONB,
    "aiReview" JSONB,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeacherMessage" (
    "id" TEXT NOT NULL,
    "classPeriodId" TEXT NOT NULL,
    "sentById" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeacherMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EquipmentItem" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "EquipmentCategory" NOT NULL,
    "assetTag" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',

    CONSTRAINT "EquipmentItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EquipmentCheckout" (
    "id" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "checkedOutAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueAt" TIMESTAMP(3),
    "returnedAt" TIMESTAMP(3),
    "damageNotes" TEXT,

    CONSTRAINT "EquipmentCheckout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortfolioItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT,
    "type" "PortfolioItemType" NOT NULL,
    "title" TEXT NOT NULL,
    "assetUrl" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PortfolioItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TutorMessage" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "role" "ChatRole" NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TutorMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationConnection" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "provider" "IntegrationProviderType" NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "scopes" TEXT[],
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIGenerationJob" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "requestedById" TEXT NOT NULL,
    "status" "AIJobStatus" NOT NULL DEFAULT 'QUEUED',
    "input" JSONB NOT NULL,
    "output" JSONB,
    "error" TEXT,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIGenerationJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TutorialVideo" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "category" "TutorialCategory" NOT NULL,
    "learningObjective" TEXT NOT NULL,
    "teacherScript" TEXT NOT NULL,
    "segments" JSONB NOT NULL,
    "practiceActivity" JSONB NOT NULL,
    "quiz" JSONB NOT NULL,
    "transcript" TEXT NOT NULL,
    "captionsSrt" TEXT NOT NULL,
    "gammaUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TutorialVideo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssistantMessage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assistantId" TEXT NOT NULL,
    "role" "ChatRole" NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssistantMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FilmStudioProject" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "logline" TEXT NOT NULL,
    "genre" TEXT NOT NULL,
    "screenplay" JSONB NOT NULL,
    "shotList" JSONB NOT NULL,
    "callSheet" JSONB NOT NULL,
    "budget" JSONB NOT NULL,
    "equipmentList" JSONB NOT NULL,
    "locationPlan" JSONB NOT NULL,
    "castingSheet" JSONB NOT NULL,
    "marketingPlan" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FilmStudioProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillsUsaPractice" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "contestName" TEXT NOT NULL,
    "competitionOverview" TEXT NOT NULL,
    "timedChallenge" JSONB NOT NULL,
    "rubric" JSONB NOT NULL,
    "judgeSheet" JSONB NOT NULL,
    "mockCompetitionSchedule" JSONB NOT NULL,
    "scenarioBank" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SkillsUsaPractice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_organizationId_idx" ON "User"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "ParentLink_parentId_studentId_key" ON "ParentLink"("parentId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "Invite_token_key" ON "Invite"("token");

-- CreateIndex
CREATE INDEX "Invite_organizationId_idx" ON "Invite"("organizationId");

-- CreateIndex
CREATE INDEX "Invite_email_idx" ON "Invite"("email");

-- CreateIndex
CREATE INDEX "ClassPeriod_organizationId_idx" ON "ClassPeriod"("organizationId");

-- CreateIndex
CREATE INDEX "ClassPeriod_teacherId_idx" ON "ClassPeriod"("teacherId");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_studentId_classPeriodId_key" ON "Enrollment"("studentId", "classPeriodId");

-- CreateIndex
CREATE INDEX "AttendanceRecord_classPeriodId_date_idx" ON "AttendanceRecord"("classPeriodId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceRecord_classPeriodId_studentId_date_key" ON "AttendanceRecord"("classPeriodId", "studentId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Standard_framework_code_key" ON "Standard"("framework", "code");

-- CreateIndex
CREATE INDEX "Project_classPeriodId_idx" ON "Project"("classPeriodId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectStandard_projectId_standardId_key" ON "ProjectStandard"("projectId", "standardId");

-- CreateIndex
CREATE UNIQUE INDEX "Lesson_projectId_day_key" ON "Lesson"("projectId", "day");

-- CreateIndex
CREATE UNIQUE INDEX "LessonStandard_lessonId_standardId_key" ON "LessonStandard"("lessonId", "standardId");

-- CreateIndex
CREATE UNIQUE INDEX "Rubric_projectId_key" ON "Rubric"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Quiz_projectId_key" ON "Quiz"("projectId");

-- CreateIndex
CREATE INDEX "VocabularyTerm_projectId_idx" ON "VocabularyTerm"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Storyboard_projectId_key" ON "Storyboard"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductionPlan_projectId_key" ON "ProductionPlan"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Submission_projectId_studentId_key" ON "Submission"("projectId", "studentId");

-- CreateIndex
CREATE INDEX "TeacherMessage_classPeriodId_idx" ON "TeacherMessage"("classPeriodId");

-- CreateIndex
CREATE UNIQUE INDEX "EquipmentItem_assetTag_key" ON "EquipmentItem"("assetTag");

-- CreateIndex
CREATE INDEX "EquipmentItem_organizationId_idx" ON "EquipmentItem"("organizationId");

-- CreateIndex
CREATE INDEX "EquipmentCheckout_equipmentId_idx" ON "EquipmentCheckout"("equipmentId");

-- CreateIndex
CREATE INDEX "EquipmentCheckout_userId_idx" ON "EquipmentCheckout"("userId");

-- CreateIndex
CREATE INDEX "PortfolioItem_userId_idx" ON "PortfolioItem"("userId");

-- CreateIndex
CREATE INDEX "TutorMessage_studentId_createdAt_idx" ON "TutorMessage"("studentId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationConnection_organizationId_provider_key" ON "IntegrationConnection"("organizationId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "AIGenerationJob_projectId_key" ON "AIGenerationJob"("projectId");

-- CreateIndex
CREATE INDEX "TutorialVideo_organizationId_idx" ON "TutorialVideo"("organizationId");

-- CreateIndex
CREATE INDEX "AssistantMessage_userId_assistantId_createdAt_idx" ON "AssistantMessage"("userId", "assistantId", "createdAt");

-- CreateIndex
CREATE INDEX "FilmStudioProject_organizationId_idx" ON "FilmStudioProject"("organizationId");

-- CreateIndex
CREATE INDEX "SkillsUsaPractice_organizationId_idx" ON "SkillsUsaPractice"("organizationId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentLink" ADD CONSTRAINT "ParentLink_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentLink" ADD CONSTRAINT "ParentLink_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassPeriod" ADD CONSTRAINT "ClassPeriod_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassPeriod" ADD CONSTRAINT "ClassPeriod_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_classPeriodId_fkey" FOREIGN KEY ("classPeriodId") REFERENCES "ClassPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_classPeriodId_fkey" FOREIGN KEY ("classPeriodId") REFERENCES "ClassPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_classPeriodId_fkey" FOREIGN KEY ("classPeriodId") REFERENCES "ClassPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectStandard" ADD CONSTRAINT "ProjectStandard_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectStandard" ADD CONSTRAINT "ProjectStandard_standardId_fkey" FOREIGN KEY ("standardId") REFERENCES "Standard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonStandard" ADD CONSTRAINT "LessonStandard_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonStandard" ADD CONSTRAINT "LessonStandard_standardId_fkey" FOREIGN KEY ("standardId") REFERENCES "Standard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rubric" ADD CONSTRAINT "Rubric_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VocabularyTerm" ADD CONSTRAINT "VocabularyTerm_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Storyboard" ADD CONSTRAINT "Storyboard_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionPlan" ADD CONSTRAINT "ProductionPlan_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherMessage" ADD CONSTRAINT "TeacherMessage_classPeriodId_fkey" FOREIGN KEY ("classPeriodId") REFERENCES "ClassPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherMessage" ADD CONSTRAINT "TeacherMessage_sentById_fkey" FOREIGN KEY ("sentById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentItem" ADD CONSTRAINT "EquipmentItem_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentCheckout" ADD CONSTRAINT "EquipmentCheckout_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "EquipmentItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentCheckout" ADD CONSTRAINT "EquipmentCheckout_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioItem" ADD CONSTRAINT "PortfolioItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioItem" ADD CONSTRAINT "PortfolioItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TutorMessage" ADD CONSTRAINT "TutorMessage_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationConnection" ADD CONSTRAINT "IntegrationConnection_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIGenerationJob" ADD CONSTRAINT "AIGenerationJob_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIGenerationJob" ADD CONSTRAINT "AIGenerationJob_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TutorialVideo" ADD CONSTRAINT "TutorialVideo_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TutorialVideo" ADD CONSTRAINT "TutorialVideo_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssistantMessage" ADD CONSTRAINT "AssistantMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FilmStudioProject" ADD CONSTRAINT "FilmStudioProject_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FilmStudioProject" ADD CONSTRAINT "FilmStudioProject_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillsUsaPractice" ADD CONSTRAINT "SkillsUsaPractice_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillsUsaPractice" ADD CONSTRAINT "SkillsUsaPractice_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

