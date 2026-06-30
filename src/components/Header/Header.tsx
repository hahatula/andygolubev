"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import styles from "./Header.module.css";
import Link from "next/link";

const homePaths = new Set(["/", "/devops", "/cloud"]);
const homePathStorageKey = "preferredHomePath";

const normalizePath = (path: string) =>
    path === "/" ? path : path.replace(/\/+$/, "");

const Header = () => {
    const pathname = usePathname();
    const normalizedPath = normalizePath(pathname);
    const isHomePage = homePaths.has(normalizedPath);
    const [homeHref, setHomeHref] = useState("/");

    useEffect(() => {
        if (homePaths.has(normalizedPath)) {
            sessionStorage.setItem(homePathStorageKey, normalizedPath);
            setHomeHref(normalizedPath);
            return;
        }

        const storedHomePath = sessionStorage.getItem(homePathStorageKey);
        if (storedHomePath && homePaths.has(storedHomePath)) {
            setHomeHref(storedHomePath);
        }
    }, [normalizedPath]);

    return (
        <header className={styles.header}>
            <div className={styles.rect}></div>
            <nav className={styles.nav}>
                {!isHomePage && <Link href={homeHref}>Home</Link>}
                <a href="mailto:andygolubevcontact@gmail.com" target="_blank">Contact</a>
                {normalizedPath !== "/articles" && <Link href="/articles">Articles</Link>}
                <a href="https://github.com/andygolubev" target="_blank">GitHub</a>
                <a href="https://www.linkedin.com/in/andy-golubev/" target="_blank">LinkedIn</a>
            </nav>
        </header>
    );
}
export default Header;
