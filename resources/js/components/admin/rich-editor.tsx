import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import InputError from '@/components/input-error';
import { Toggle } from '@/components/ui/toggle';
import { cn } from '@/lib/utils';
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    Strikethrough,
    Heading2,
    Heading3,
    List,
    ListOrdered,
    Quote,
    Link as LinkIcon,
    Undo,
    Redo,
} from 'lucide-react';

type RichEditorProps = {
    id?: string;
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
    error?: string;
};

export function RichEditor({ id, value, onChange, placeholder, error }: RichEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: { levels: [2, 3] },
                link: {
                    openOnClick: false,
                    HTMLAttributes: { class: 'underline text-primary' },
                },
            }),
            Placeholder.configure({
                placeholder: placeholder ?? 'Write something...',
            }),
        ],
        content: value || '',
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            // Treat empty editor as empty string
            onChange(html === '<p></p>' ? '' : html);
        },
    });

    if (!editor) {
        return null;
    }

    const handleLink = () => {
        if (editor.isActive('link')) {
            editor.chain().focus().unsetLink().run();
            return;
        }

        const url = window.prompt('Enter URL:');
        if (url) {
            editor.chain().focus().setLink({ href: url }).run();
        }
    };

    return (
        <div className="space-y-2">
            <div
                className={cn(
                    'rounded-md border border-input shadow-xs transition-[color,box-shadow]',
                    'focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]',
                    error && 'border-destructive ring-destructive/20 dark:ring-destructive/40',
                )}
            >
                {/* Toolbar */}
                <div className="flex flex-wrap gap-0.5 border-b border-input px-1 py-1">
                    <Toggle
                        size="sm"
                        pressed={editor.isActive('bold')}
                        onPressedChange={() => editor.chain().focus().toggleBold().run()}
                        aria-label="Bold"
                    >
                        <Bold className="size-4" />
                    </Toggle>
                    <Toggle
                        size="sm"
                        pressed={editor.isActive('italic')}
                        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
                        aria-label="Italic"
                    >
                        <Italic className="size-4" />
                    </Toggle>
                    <Toggle
                        size="sm"
                        pressed={editor.isActive('underline')}
                        onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
                        aria-label="Underline"
                    >
                        <UnderlineIcon className="size-4" />
                    </Toggle>
                    <Toggle
                        size="sm"
                        pressed={editor.isActive('strike')}
                        onPressedChange={() => editor.chain().focus().toggleStrike().run()}
                        aria-label="Strikethrough"
                    >
                        <Strikethrough className="size-4" />
                    </Toggle>

                    <div className="mx-1 w-px self-stretch bg-border" />

                    <Toggle
                        size="sm"
                        pressed={editor.isActive('heading', { level: 2 })}
                        onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                        aria-label="Heading 2"
                    >
                        <Heading2 className="size-4" />
                    </Toggle>
                    <Toggle
                        size="sm"
                        pressed={editor.isActive('heading', { level: 3 })}
                        onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                        aria-label="Heading 3"
                    >
                        <Heading3 className="size-4" />
                    </Toggle>

                    <div className="mx-1 w-px self-stretch bg-border" />

                    <Toggle
                        size="sm"
                        pressed={editor.isActive('bulletList')}
                        onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
                        aria-label="Bullet List"
                    >
                        <List className="size-4" />
                    </Toggle>
                    <Toggle
                        size="sm"
                        pressed={editor.isActive('orderedList')}
                        onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
                        aria-label="Ordered List"
                    >
                        <ListOrdered className="size-4" />
                    </Toggle>
                    <Toggle
                        size="sm"
                        pressed={editor.isActive('blockquote')}
                        onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
                        aria-label="Blockquote"
                    >
                        <Quote className="size-4" />
                    </Toggle>

                    <div className="mx-1 w-px self-stretch bg-border" />

                    <Toggle
                        size="sm"
                        pressed={editor.isActive('link')}
                        onPressedChange={handleLink}
                        aria-label="Link"
                    >
                        <LinkIcon className="size-4" />
                    </Toggle>

                    <div className="mx-1 w-px self-stretch bg-border" />

                    <Toggle
                        size="sm"
                        pressed={false}
                        onPressedChange={() => editor.chain().focus().undo().run()}
                        disabled={!editor.can().undo()}
                        aria-label="Undo"
                    >
                        <Undo className="size-4" />
                    </Toggle>
                    <Toggle
                        size="sm"
                        pressed={false}
                        onPressedChange={() => editor.chain().focus().redo().run()}
                        disabled={!editor.can().redo()}
                        aria-label="Redo"
                    >
                        <Redo className="size-4" />
                    </Toggle>
                </div>

                {/* Editor content */}
                <EditorContent id={id} editor={editor} className="rich-editor-content" />
            </div>

            <InputError message={error} />
        </div>
    );
}
