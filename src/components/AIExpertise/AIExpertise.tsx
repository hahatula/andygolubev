import styles from "./AIExpertise.module.css";
import Link from "next/link";

export default function AIExpertise() {
    return <section className={styles.aiExpertiseSection}>
        <h2 className={styles.aiExpertiseTitle}>AI Expertise</h2>
        <div className={styles.aiExpertiseCards}>
            <div className={styles.aiExpertiseCard}>
                <h3 className={styles.aiExpertiseCardTitle}>Professional AI Training</h3>
                <p className={styles.aiExpertiseCardDescription}>Completed Nebius Academy’s hybrid <a href="https://academy.nebius.com/ai-engineering-il" target="_blank" rel="noopener noreferrer">AI Performance Engineering program</a> at Tel Aviv University campus.</p>
            </div>
            <div className={styles.aiExpertiseCard}>
                <h3 className={styles.aiExpertiseCardTitle}>Serverless AI Builder’s Challenge Winner</h3>
                <p className={styles.aiExpertiseCardDescription}>Recognized with an Awesome Serverless Award for <Link href="/articles/Sim2Policy-the-serverless-RL-platform-that-trains-the-robot-you-upload" target="_blank">Sim2Policy</Link> — an NVIDIA H100-powered platform that trains robots in simulation using Nebius Serverless Jobs.</p>
            </div>
            <div className={styles.aiExpertiseCard}>
                <h3 className={styles.aiExpertiseCardTitle}>Production AI Implementation</h3>
                <p className={styles.aiExpertiseCardDescription}>Designed and implemented AI pipelines at my two most recent workplaces: Global Remit and Rhino Federated Computing.</p>
            </div>
            <div className={styles.aiExpertiseCard}>
                <h3 className={styles.aiExpertiseCardTitle}>Self-Hosted Open Models</h3>
                <p className={styles.aiExpertiseCardDescription}>Deploy and operate open-weight AI models on self-managed infrastructure.</p>
            </div>
        </div>
    </section>;
}