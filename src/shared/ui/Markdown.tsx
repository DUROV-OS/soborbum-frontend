import ReactMarkdown, { Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'

const components: Components = {
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-brand-dark underline underline-offset-2">
      {children}
    </a>
  ),
  ul: ({ children }) => <ul className="mb-2 list-disc space-y-0.5 pl-4 last:mb-0">{children}</ul>,
  ol: ({ children }) => <ol className="mb-2 list-decimal space-y-0.5 pl-4 last:mb-0">{children}</ol>,
  li: ({ children }) => <li>{children}</li>,
  code: ({ children }) => (
    <code className="rounded-sm bg-black/10 px-1 py-0.5 font-mono text-[12px]">{children}</code>
  ),
  pre: ({ children }) => (
    <pre className="mb-2 overflow-x-auto rounded-sm bg-black/10 p-2 font-mono text-[12px] last:mb-0">{children}</pre>
  ),
  blockquote: ({ children }) => (
    <blockquote className="mb-2 border-l-2 border-current/30 pl-2 opacity-80 last:mb-0">{children}</blockquote>
  ),
  h1: ({ children }) => <h1 className="mb-1 text-[15px] font-semibold">{children}</h1>,
  h2: ({ children }) => <h2 className="mb-1 text-[14px] font-semibold">{children}</h2>,
  h3: ({ children }) => <h3 className="mb-1 text-[13px] font-semibold">{children}</h3>,
  hr: () => <hr className="my-2 border-current/20" />,
  table: ({ children }) => (
    <div className="mb-2 overflow-x-auto last:mb-0">
      <table className="w-full border-collapse text-left">{children}</table>
    </div>
  ),
  th: ({ children }) => <th className="border-b border-current/20 px-2 py-1 font-medium">{children}</th>,
  td: ({ children }) => <td className="border-b border-current/10 px-2 py-1">{children}</td>,
}

export function Markdown({ text, className }: { text: string; className?: string }) {
  return (
    <div className={className}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {text}
      </ReactMarkdown>
    </div>
  )
}
