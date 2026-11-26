"use client";

import { accentStyle } from "./_components/accent";
import { FeaturesSection } from "./_components/features-section";
import { Footer } from "./_components/footer";
import { Header } from "./_components/header";
import type { QuestionMode } from "./_components/hero-example";
import { HeroSection } from "./_components/hero-section";
import { IntegrationsSection } from "./_components/integrations-section";
import { WorkflowSection } from "./_components/workflow-section";

import "./preview.css";

export const controls = {
  hueShift: {
    default: 0,
    group: "Style",
    label: "Hue shift",
    max: 359,
    min: 0,
    step: 1,
    type: "number",
  },
  heroVideo: { default: true, group: "Style", label: "Hero video", type: "boolean" },
  gridPattern: { default: true, group: "Style", label: "Grid pattern", type: "boolean" },
  focusBlur: { default: true, group: "Style", label: "Focus blur", type: "boolean" },
  scrollTilt: { default: true, group: "Style", label: "Scroll to play", type: "boolean" },
  tiltAngle: {
    default: 40,
    group: "Style",
    label: "Tilt angle",
    max: 60,
    min: 0,
    step: 1,
    type: "number",
  },
  marqueeSpeed: {
    default: 1,
    group: "Style",
    label: "Marquee speed",
    max: 4,
    min: 0.25,
    step: 0.25,
    type: "number",
  },
  headline: {
    default: "Generate software products",
    group: "Copy",
    label: "Headline",
    type: "text",
  },
  subheadline: {
    default: "on your organization data",
    group: "Copy",
    label: "Subheadline",
    type: "text",
  },
  tagline: {
    default:
      "Everyone on your team should be able to build software to automate their own day to day workflows",
    group: "Copy",
    label: "Tagline",
    type: "text",
  },
  ctaLabel: { default: "Start Building", group: "Copy", label: "Button", type: "text" },
  question: {
    default: "cycle",
    group: "Demo",
    label: "Demo question",
    options: [
      { label: "Cycle all", value: "cycle" },
      { label: "Changelog", value: "changelog" },
      { label: "Ownership", value: "ownership" },
      { label: "Remote work", value: "remote" },
    ],
    type: "select",
  },
  typeDelay: {
    default: 25,
    group: "Demo",
    label: "Keystroke (ms)",
    max: 100,
    min: 5,
    step: 5,
    type: "number",
  },
  stepDuration: {
    default: 800,
    group: "Demo",
    label: "Step (ms)",
    max: 2000,
    min: 300,
    step: 100,
    type: "number",
  },
  answerHold: {
    default: 5000,
    group: "Demo",
    label: "Answer hold (ms)",
    max: 10_000,
    min: 1500,
    step: 500,
    type: "number",
  },
  showWorkflow: { default: true, group: "Sections", label: "Workflow", type: "boolean" },
  showFeatures: { default: true, group: "Sections", label: "Features", type: "boolean" },
  showIntegrations: { default: true, group: "Sections", label: "Integrations", type: "boolean" },
} as const;

interface PreviewProps {
  answerHold: number;
  ctaLabel: string;
  focusBlur: boolean;
  gridPattern: boolean;
  headline: string;
  heroVideo: boolean;
  hueShift: number;
  marqueeSpeed: number;
  question: QuestionMode;
  scrollTilt: boolean;
  showFeatures: boolean;
  showIntegrations: boolean;
  showWorkflow: boolean;
  stepDuration: number;
  subheadline: string;
  tagline: string;
  tiltAngle: number;
  typeDelay: number;
}

const heroDemo = ({
  answerHold = controls.answerHold.default,
  focusBlur = controls.focusBlur.default,
  question = controls.question.default,
  scrollTilt = controls.scrollTilt.default,
  stepDuration = controls.stepDuration.default,
  tiltAngle = controls.tiltAngle.default,
  typeDelay = controls.typeDelay.default,
}: Partial<PreviewProps>) => ({
  answerHold,
  focusBlur,
  question,
  scrollTilt,
  stepDuration,
  tiltAngle,
  typeDelay,
});

const Preview = ({
  ctaLabel = controls.ctaLabel.default,
  gridPattern = controls.gridPattern.default,
  headline = controls.headline.default,
  heroVideo = controls.heroVideo.default,
  hueShift = controls.hueShift.default,
  marqueeSpeed = controls.marqueeSpeed.default,
  showFeatures = controls.showFeatures.default,
  showIntegrations = controls.showIntegrations.default,
  showWorkflow = controls.showWorkflow.default,
  subheadline = controls.subheadline.default,
  tagline = controls.tagline.default,
  ...props
}: Partial<PreviewProps>) => (
  <div className="emerald-template font-sans antialiased" style={accentStyle(hueShift)}>
    <Header />
    <main className="contained-page text-center">
      <HeroSection
        ctaLabel={ctaLabel}
        demo={heroDemo(props)}
        gridPattern={gridPattern}
        headline={headline}
        heroVideo={heroVideo}
        hueShift={hueShift}
        subheadline={subheadline}
        tagline={tagline}
      />
      {showWorkflow && <WorkflowSection />}
      {showFeatures && <FeaturesSection />}
      {showIntegrations && <IntegrationsSection marqueeSpeed={marqueeSpeed} />}
    </main>
    <Footer />
  </div>
);

export default Preview;
