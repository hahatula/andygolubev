import { notFound } from 'next/navigation';
import { articles } from '@/data/articles';
import styles from './page.module.css';

type MDXComponent = () => Promise<{ default: React.ComponentType }>;

// 1. Static mapping from slug to MDX import
const articleComponents: Record<string, MDXComponent> = {
    'automate-publishing-markdown-files-from-github-to-confluence-with-github-to-confluence-publisher-tool': () => import('@/../public/articles/automate-publishing-markdown-files-from-github-to-confluence-with-github-to-confluence-publisher-tool/index.mdx'),
    'aws-cloud-formation-doing-crazy': () => import('@/../public/articles/aws-cloud-formation-doing-crazy/index.mdx'),
    'aws-serverless-image-recognition-telegram-bot-using-terraform': () => import('@/../public/articles/aws-serverless-image-recognition-telegram-bot-using-terraform/index.mdx'),
    'backup-tool-using-aws-batch-ecs-and-fargate-for-backuping-objects-from-other-clouds': () => import('@/../public/articles/backup-tool-using-aws-batch-ecs-and-fargate-for-backuping-objects-from-other-clouds/index.mdx'),
    'building-an-offline-ai-platform-with-k3s-ansible-argo-cd-vllm-and-nvidia-gpu': () => import('@/../public/articles/building-an-offline-ai-platform-with-k3s-ansible-argo-cd-vllm-and-nvidia-gpu/index.mdx'),
    'how-llm-d-prefix-cache-routing-made-qwen-7b-on-eks-2-3x-faster': () => import('@/../public/articles/how-llm-d-prefix-cache-routing-made-qwen-7b-on-eks-2-3x-faster/index.mdx'),
    'kubernetes-the-hard-way-on-aws-with-packer-and-terraform': () => import('@/../public/articles/kubernetes-the-hard-way-on-aws-with-packer-and-terraform/index.mdx'),
    'monitoring-multiple-k8s-clusters-with-prometheus-and-grafana-deployed-using-terraform-and-ansible-role': () => import('@/../public/articles/monitoring-multiple-k8s-clusters-with-prometheus-and-grafana-deployed-using-terraform-and-ansible-role/index.mdx'),
    'terraform-and-digitalocean-automating-infrastructure-and-catching-the-hidden-load-balancer': () => import('@/../public/articles/terraform-and-digitalocean-automating-infrastructure-and-catching-the-hidden-load-balancer/index.mdx'),
};

// 2. generateStaticParams for static export
export async function generateStaticParams() {
    return articles.map(article => ({ slug: article.slug }));
}

// Await params for compatibility with Next.js static export
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    if (!articles.some(article => article.slug === slug)) {
        notFound();
    }
    const importMDX = articleComponents[slug];
    if (!importMDX) {
        notFound();
    }
    const { default: ArticleContent } = await importMDX();
    // If you use custom MDX components, ensure they are server-compatible and not client-only.
    return (
        <div className={styles.articleContainer}>
            <ArticleContent />
        </div>
    );
}