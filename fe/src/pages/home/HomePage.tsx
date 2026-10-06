import {
  HeroSection,
  HowItWorksSection,
  VocabularySection,
  CtaSection,
} from '../../features/onboarding';
import { MeetupSection } from '../../features/meetup';
import { ReviewSection } from '../../features/review';

function HomePage() {
  return (
    <>
      <HeroSection />
      <HowItWorksSection />
      <MeetupSection />
      <ReviewSection />
      <VocabularySection />
      <CtaSection />
    </>
  );
}

export default HomePage;
