import { TutorialCategory } from "@prisma/client";

export const TUTORIAL_CATEGORY_LABELS: Record<TutorialCategory, string> = {
  CAMERA_OPERATION: "Camera Operation",
  LIGHTING: "Lighting",
  AUDIO: "Audio",
  EDITING: "Editing",
  DIRECTING: "Directing",
  SCREENWRITING: "Screenwriting",
  BROADCAST_JOURNALISM: "Broadcast Journalism",
  ANIMATION: "Animation",
  SAFETY: "Safety",
  CAREER: "Career",
  OTHER: "Other",
};

export const TUTORIAL_CATEGORY_OPTIONS = Object.entries(TUTORIAL_CATEGORY_LABELS).map(
  ([value, label]) => ({ value: value as TutorialCategory, label }),
);
