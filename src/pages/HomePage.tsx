import { Experience } from '../features/experience/Experience';
import { Finale } from '../sections/Finale';
import { Hero } from '../sections/Hero';
import { Manifesto } from '../sections/Manifesto';
import { Process } from '../sections/Process';
import { ServicesIndex } from '../sections/ServicesIndex';
import { WhyBayhan } from '../sections/WhyBayhan';
import { Work } from '../sections/Work';

/**
 * One continuous sequence over a single 3D scene: awakening → philosophy (dive) →
 * capabilities → work → process → studio → the head returns for the finale.
 */
export default function HomePage() {
  return (
    <>
      <Experience />
      <Hero />
      <Manifesto />
      <ServicesIndex />
      <Work />
      <Process />
      <WhyBayhan />
      <Finale />
    </>
  );
}
