import styles from "./Credits.module.css";

export default function Credits() {
    return <div className={styles.credits}>
        {/* <p>© 2025 Andy Golubev</p> */}
        <a href="https://www.linkedin.com/in/olgagolubev/" target="_blank">Developed and designed by Olga Golubev</a>
    </div>;
}