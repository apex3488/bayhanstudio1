import { ContactCta } from '../sections/ContactCta';
import { Hero } from '../sections/Hero';
import { Manifesto } from '../sections/Manifesto';
import { Process } from '../sections/Process';
import { ServicesShowcase } from '../sections/ServicesShowcase';
import { WhyBayhan } from '../sections/WhyBayhan';

export default function HomePage() {
  return (
    <>
      <Hero />
      <Manifesto />
      <ServicesShowcase />
      <Process />
      <WhyBayhan />
      <ContactCta />
    </>
  );
}
