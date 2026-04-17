import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function Md({
  children,
}: {
  children: string | null | undefined;
}) {
  return (
    <Markdown remarkPlugins={[remarkGfm]} skipHtml>
      {children}
    </Markdown>
  );
}
