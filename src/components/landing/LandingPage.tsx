'use client'

import Navbar from './Navbar'
import Footer from './Footer'
import { HeroSection } from './HeroSection'
import { LiveDemoSection } from './LiveDemoSection'
import { UIShowcaseSection } from './UIShowcaseSection'
import { UseCasesSection } from './UseCasesSection'
import { FeaturesSection } from './FeaturesSection'
import { BotIntegrationsSection } from './BotIntegrationsSection'
import { VoiceFeaturesSection } from './VoiceFeaturesSection'
import { CodeExamplesSection } from './CodeExamplesSection'
import { StatsSection } from './StatsSection'
import { CTASection } from './CTASection'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <HeroSection />
      <LiveDemoSection />
      <UIShowcaseSection />
      <UseCasesSection />
      <FeaturesSection />
      <BotIntegrationsSection />
      <VoiceFeaturesSection />
      <CodeExamplesSection />
      <StatsSection />
      <CTASection />
      <Footer />
    </div>
  )
}