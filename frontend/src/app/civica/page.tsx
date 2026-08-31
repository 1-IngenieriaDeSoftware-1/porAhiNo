import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import ProblemSection from './components/ProblemSection';
import ProposalSection from './components/ProposalSection';
import EnrollmentSection from './components/EnrollmentSection';
import UXSection from './components/UXSection';
import ArchitectureSection from './components/ArchitectureSection';
import SecuritySection from './components/SecuritySection';
import ImpactSection from './components/ImpactSection';
import RoadmapSection from './components/RoadmapSection';
import VisionSection from './components/VisionSection';
import ComparisonSection from './components/ComparisonSection';
import AboutSection from './components/AboutSection';
import DocumentSection from './components/DocumentSection';
import Footer from './components/Footer';

export default function CivicaLandingPage() {
  return (
    <main className="min-h-screen bg-slate-50 font-sans selection:bg-blue-200 selection:text-blue-900">
      <Navbar />
      <HeroSection />
      <ProblemSection />
      <ProposalSection />
      <EnrollmentSection />
      <UXSection />
      <ArchitectureSection />
      <SecuritySection />
      <ImpactSection />
      <RoadmapSection />
      <VisionSection />
      <ComparisonSection />
      <AboutSection />
      <DocumentSection />
      <Footer />
    </main>
  );
}
