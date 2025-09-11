import React from "react";

import { FeaturesSection } from "./_components/features-section";
import { Footer } from "./_components/footer";
import { Header } from "./_components/header";
import { HeroSection } from "./_components/hero-section";
import { IntegrationsSection } from "./_components/integrations-section";
import { WorkflowSection } from "./_components/workflow-section";

import "./preview.css";

const Preview = () => {
  return (
    <div className="font-sans antialiased">
      <Header />
      <main className="contained-page text-center">
        <HeroSection />
        <WorkflowSection />
        <FeaturesSection />
        <IntegrationsSection />
      </main>
      <Footer />
    </div>
  );
};

export default Preview;
