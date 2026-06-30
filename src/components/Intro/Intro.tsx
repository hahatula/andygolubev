import styles from "./Intro.module.css";

export default function IntroSection({ role }: { role: string }) {
    let interests: string;

    switch (role) {
        case "Cloud Solutions Architect":
            interests = "Cloud architecture, DevOps practices, and Kubernetes.";
            break;
        case "AI Solutions Architect":
            interests = "MLOps, Cloud Architecture, and building production-ready platforms for intelligent systems.";
            break;
        case "DevOps Engineer":
        default:
            interests = "DevOps practices, Infrastructure as a Code, CI/CD, Kubernetes and Cloud Architecture.";
            break;
    }

    return <section className={styles.introSection}>
        <p>Hi there! 👋<br></br>I&apos;m a {role} passionate about</p>
        <h2 className={styles.introTitle}>{interests}</h2>
    </section>
}
