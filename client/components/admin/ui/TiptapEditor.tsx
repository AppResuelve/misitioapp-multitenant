// @ts-nocheck
"use client";
import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
} from "lucide-react";

const ToolbarButton = ({ onClick, isActive, children, title }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={`p-1.5 rounded transition-colors ${
      isActive
        ? "bg-cyan-500/20 text-cyan-400"
        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700"
    }`}
  >
    {children}
  </button>
);

export default function TiptapEditor({
  value = "",
  onChange,
  maxLength = 2000,
  label,
  placeholder = "Descripción del producto...",
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2] },
        code: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
        strike: false,
      }),
      Placeholder.configure({ placeholder }),
      CharacterCount.configure({ limit: maxLength }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "focus:outline-none min-h-[100px] px-3 py-2 text-sm text-zinc-200",
      },
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '');
    }
  }, [value, editor]);

  if (!editor) return null;

  const charCount = editor.storage.characterCount.characters();
  const overLimit = charCount > maxLength;
  const nearLimit = charCount / maxLength >= 0.8 && !overLimit;

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-zinc-400 mb-1.5">
          {label}
        </label>
      )}

      <div className="rounded-lg border border-zinc-700 bg-zinc-800 overflow-hidden focus-within:border-cyan-500 focus-within:ring-1 focus-within:ring-cyan-500 transition-colors">
        <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-zinc-700 bg-zinc-800/50">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive("heading", { level: 2 })}
            title="Subtítulo (H2)"
          >
            <Heading2 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive("bold")}
            title="Negrita"
          >
            <Bold className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive("italic")}
            title="Cursiva"
          >
            <Italic className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive("bulletList")}
            title="Lista"
          >
            <List className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive("orderedList")}
            title="Lista numerada"
          >
            <ListOrdered className="w-4 h-4" />
          </ToolbarButton>
        </div>

        <EditorContent editor={editor} className="tiptap-editor" />
      </div>

      <div className="flex items-center justify-between mt-1">
        <p className="text-xs text-zinc-600">
          Seleccioná texto y usá los botones para formatear
        </p>
        <p
          className={`text-xs ${
            overLimit
              ? "text-red-400"
              : nearLimit
                ? "text-yellow-400"
                : "text-zinc-500"
          }`}
        >
          {charCount.toLocaleString()} / {maxLength.toLocaleString()}
        </p>
      </div>
    </div>
  );
}
