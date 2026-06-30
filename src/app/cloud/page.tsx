import styles from "../page.module.css";
import HeroSection from "@/components/HeroSection/HeroSection";
import IntroSection from "@/components/Intro/Intro";
import Achievements from "@/components/Achievements/Achievements";
import Articles from "@/components/Articles/Articles";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <HeroSection role="Cloud Solutions Architect" />
        <IntroSection role="Cloud Solutions Architect" />
        <Achievements />
        <Articles />
      </main>
    </div>
  );
}
