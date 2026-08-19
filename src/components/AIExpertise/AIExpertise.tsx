import styles from "./AIExpertise.module.css";

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
                <p className={styles.aiExpertiseCardDescription}>Recognized with an Awesome Serverless Award for <a href="https://github.com/andygolubev/nebius-serverless-challenge-2026" target="_blank" rel="noopener noreferrer">Sim2Policy</a> — an NVIDIA H100-powered platform that trains robots in simulation using Nebius Serverless Jobs.</p>
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