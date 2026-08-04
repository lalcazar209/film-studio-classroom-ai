import React from "react";
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import type { Prisma } from "@prisma/client";

type ProjectForExport = Prisma.ProjectGetPayload<{
  include: {
    classPeriod: true;
    lessons: { include: { standards: { include: { standard: true } } } };
    rubric: true;
    quiz: true;
    vocabulary: true;
    storyboard: true;
  };
}>;

const DAY_LABELS: Record<string, string> = {
  MONDAY_LAUNCH: "Monday — Launch",
  TUESDAY_PREPRODUCTION: "Tuesday — Pre-Production",
  WEDNESDAY_PRODUCTION: "Wednesday — Production",
  THURSDAY_EDITING: "Thursday — Editing",
  FRIDAY_SHOWCASE: "Friday — Showcase",
};
const DAY_ORDER = Object.keys(DAY_LABELS);

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica" },
  title: { fontSize: 20, marginBottom: 4, fontFamily: "Helvetica-Bold" },
  subtitle: { fontSize: 11, color: "#555", marginBottom: 16 },
  sectionTitle: { fontSize: 13, fontFamily: "Helvetica-Bold", marginTop: 16, marginBottom: 6 },
  label: { fontFamily: "Helvetica-Bold" },
  paragraph: { marginBottom: 4, lineHeight: 1.4 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 },
  divider: { borderBottomWidth: 1, borderBottomColor: "#ddd", marginVertical: 8 },
});

interface RubricCriterion {
  name: string;
  weightPercent: number;
}

interface QuizQuestion {
  prompt: string;
  answer: string;
}

interface VisualTheme {
  palette: string[];
  lighting: string;
  lensCharacter: string;
  aesthetic: string;
}

interface StoryboardShot {
  number: number;
  description: string;
  shotType: string;
  durationSec: number;
}

export function renderProjectPdf(project: ProjectForExport): Promise<Buffer> {
  const lessons = [...project.lessons].sort((a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day));
  const criteria = (project.rubric?.criteria as unknown as RubricCriterion[] | undefined) ?? [];
  const questions = (project.quiz?.questions as unknown as QuizQuestion[] | undefined) ?? [];
  const visualTheme = project.storyboard?.visualTheme as unknown as VisualTheme | undefined;
  const shots = (project.storyboard?.shots as unknown as StoryboardShot[] | undefined) ?? [];

  return renderToBuffer(
    <Document>
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.title}>{project.title}</Text>
        <Text style={styles.subtitle}>
          {project.classPeriod.name} — Teacher Guide
        </Text>
        <Text style={styles.paragraph}>{project.brief}</Text>

        {lessons.map((lesson) => (
          <View key={lesson.id} wrap={false}>
            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>
              {DAY_LABELS[lesson.day]}: {lesson.title}
            </Text>
            <Text style={styles.paragraph}>
              <Text style={styles.label}>Objective: </Text>
              {lesson.objective}
            </Text>
            <Text style={styles.paragraph}>
              <Text style={styles.label}>I can: </Text>
              {lesson.iCanStatement}
            </Text>
            {lesson.standards.length > 0 && (
              <Text style={styles.paragraph}>
                <Text style={styles.label}>Standards: </Text>
                {lesson.standards.map((s) => s.standard.code).join(", ")}
              </Text>
            )}
          </View>
        ))}

        {project.rubric && (
          <View wrap={false}>
            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>Rubric — {project.rubric.title}</Text>
            {criteria.map((c) => (
              <View key={c.name} style={styles.row}>
                <Text>{c.name}</Text>
                <Text>{c.weightPercent}%</Text>
              </View>
            ))}
          </View>
        )}

        {project.quiz && (
          <View wrap={false}>
            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>Quiz — {project.quiz.title}</Text>
            {questions.map((q, i) => (
              <Text key={i} style={styles.paragraph}>
                {i + 1}. {q.prompt}
              </Text>
            ))}
          </View>
        )}

        {project.storyboard && (
          <View wrap={false}>
            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>Storyboard</Text>
            {visualTheme && (
              <Text style={styles.paragraph}>
                <Text style={styles.label}>Visual theme: </Text>
                {visualTheme.aesthetic} — {visualTheme.lighting} lighting, {visualTheme.lensCharacter} lens,
                palette: {visualTheme.palette.join(", ")}
              </Text>
            )}
            {shots.map((shot) => (
              <View key={shot.number} style={styles.row}>
                <Text>
                  {shot.number}. {shot.shotType} — {shot.description}
                </Text>
                <Text>{shot.durationSec}s</Text>
              </View>
            ))}
          </View>
        )}

        {project.vocabulary.length > 0 && (
          <View wrap={false}>
            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>Vocabulary</Text>
            {project.vocabulary.map((v) => (
              <Text key={v.id} style={styles.paragraph}>
                <Text style={styles.label}>{v.term}: </Text>
                {v.definition}
              </Text>
            ))}
          </View>
        )}
      </Page>
    </Document>,
  );
}
