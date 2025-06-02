import styles from "./Footer.module.css";
import Image from "next/image";
import DisintegratingImage from "@/components/DisintegratingImage/DisintegratingImage";

export default function Footer() {
    return <footer className={styles.footer}>
        <div className={styles.footerContainer}>
            <DisintegratingImage
                src="/images/sky/hero.jpg"
                alt="Footer background"
                className={styles.footerBackgroundImage}
            />
            <h2>Run in the cloud. Reach the world.</h2>
            <div className={styles.footerLinks}>
                <a href="https://github.com/andygolubev" target="_blank"><Image src="/images/icons/github.svg" alt="GitHub" width={24} height={24} /></a>
                <a href="https://www.linkedin.com/in/andy-golubev/" target="_blank"><Image src="/images/icons/linkedin.svg" alt="LinkedIn" width={24} height={24} /></a>
                <a href="mailto:andygolubevcontact@gmail.com" target="_blank"><Image src="/images/icons/email.svg" alt="Send email" width={24} height={24} /></a>
            </div>
        </div>
    </footer>;
}