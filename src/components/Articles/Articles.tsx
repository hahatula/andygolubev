"use client";

import { useState } from "react";
import styles from "./Articles.module.css";
import { articles } from "@/data/articles";
import ArticleItem from "@/components/ArticleItem/ArticleItem";

const INITIAL_VISIBLE_ARTICLES = 6;
const ARTICLES_PER_CLICK = 10;

export default function Articles() {
    const [visibleArticleCount, setVisibleArticleCount] = useState(INITIAL_VISIBLE_ARTICLES);
    const hasMoreArticles = visibleArticleCount < articles.length;

    const showMoreArticles = () => {
        setVisibleArticleCount((currentCount) =>
            Math.min(currentCount + ARTICLES_PER_CLICK, articles.length)
        );
    };

    return <section className={styles.articlesSection}>
        {articles.slice(0, visibleArticleCount).map((article) => (
            <ArticleItem key={article.id} {...article} />
        ))}
        {hasMoreArticles && (
            <button
                type="button"
                className={styles.showMoreButton}
                onClick={showMoreArticles}
            >
                Show more articles
            </button>
        )}
        <div className={styles.articlesTitleContainer}>
            <h2 className={styles.articlesTitle}>Latest Articles</h2>
            <p>I regularly share my hands-on experience through technical articles on Dev.to, focusing on cloud-native solutions, infrastructure as code, and automation.</p>
        </div>
    </section>;
}
