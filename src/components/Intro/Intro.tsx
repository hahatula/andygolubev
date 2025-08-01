import styles from "./Intro.module.css";

export default function IntroSection({ role }: { role: string }) {
    const interests = role === "Cloud Solutions Architect"
        ? "Cloud architecture, DevOps practices,  and Kubernetes."
        : "DevOps practices, Infrastructure as a Code, CI/CD, Kubernetes and Cloud architecture.";

    return <section className={styles.introSection}>
        <p>Hi there! 👋<br></br>I&apos;m a {role} passionate about</p>
        <h2 className={styles.introTitle}>{interests}</h2>
    </section>
}