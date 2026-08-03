-- AlterTable
ALTER TABLE "ClassPeriod" ADD COLUMN     "googleClassroomCourseId" TEXT;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "classroomUrl" TEXT,
ADD COLUMN     "googleDocUrl" TEXT;
