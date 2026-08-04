import { getImageProvider } from "./image-registry";
import { uploadGeneratedImage } from "@/lib/integrations/cloudinary";
import type { ImageGenerateOptions } from "./image-provider";

const STYLE_SUFFIX =
  "Cinematic reference image for a high school film production classroom. " +
  "No text, no watermarks, no logos.";

export function buildStoryboardShotPrompt(input: {
  description: string;
  shotType: string;
  movement: string;
  lighting: string;
  visualTheme: { palette: string[]; lighting: string; lensCharacter: string; aesthetic: string };
}): string {
  return [
    `${input.shotType} shot, camera ${input.movement.toLowerCase()}: ${input.description}.`,
    `Lighting: ${input.lighting}.`,
    `Overall visual style: ${input.visualTheme.aesthetic}, ${input.visualTheme.lensCharacter} lens character,`,
    `color palette ${input.visualTheme.palette.join(", ")}.`,
    STYLE_SUFFIX,
  ].join(" ");
}

export function buildPosterPrompt(input: {
  title: string;
  genre: string;
  logline: string;
  posterConcept: string;
}): string {
  return [
    `Movie poster concept art for a ${input.genre} student film titled "${input.title}".`,
    `Logline: ${input.logline}.`,
    `Concept: ${input.posterConcept}.`,
    STYLE_SUFFIX,
  ].join(" ");
}

export function buildProjectCoverPrompt(input: { title: string; category: string; brief: string }): string {
  return [
    `Cover image for a student ${input.category.toLowerCase().replace(/_/g, " ")} project titled "${input.title}".`,
    `Project brief: ${input.brief}.`,
    STYLE_SUFFIX,
  ].join(" ");
}

async function generateAndStore(
  prompt: string,
  size: ImageGenerateOptions["size"],
  folder: string,
  publicId: string,
): Promise<string> {
  const provider = getImageProvider();
  const { base64, mediaType } = await provider.generateImage({ prompt, size });
  const { secureUrl } = await uploadGeneratedImage({ base64, mediaType, folder, publicId });
  return secureUrl;
}

export function generateStoryboardShotImage(input: {
  projectId: string;
  shotNumber: number;
  description: string;
  shotType: string;
  movement: string;
  lighting: string;
  visualTheme: { palette: string[]; lighting: string; lensCharacter: string; aesthetic: string };
}): Promise<string> {
  return generateAndStore(
    buildStoryboardShotPrompt(input),
    "landscape",
    `film-studio-classroom-ai/storyboards/${input.projectId}`,
    `shot-${input.shotNumber}`,
  );
}

export function generatePosterImage(input: {
  filmStudioProjectId: string;
  title: string;
  genre: string;
  logline: string;
  posterConcept: string;
}): Promise<string> {
  return generateAndStore(
    buildPosterPrompt(input),
    "portrait",
    `film-studio-classroom-ai/posters/${input.filmStudioProjectId}`,
    "poster",
  );
}

export function generateProjectCoverImage(input: {
  projectId: string;
  title: string;
  category: string;
  brief: string;
}): Promise<string> {
  return generateAndStore(
    buildProjectCoverPrompt(input),
    "landscape",
    `film-studio-classroom-ai/project-covers/${input.projectId}`,
    "cover",
  );
}
