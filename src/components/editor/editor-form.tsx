'use client'
import { useReducer, useRef } from 'react'
import { EditorContainer } from './editor-container'
import EditorImage from './editor-image'
import EditorButton from './editor-button'
import { cn } from '@/lib/utils'
import type { ActionType, Content, EditorMethods, UploadFiles } from '@/types/type'
import { toast } from '@/components/ui/use-toast'

type EditorProps = {
  className?: string;
  initialContent?: Content;
  editorAddStatus?: 'add_sub' | 'add';
  titlePlaceholder?: string;
  onSubmit: (content: Content) => Promise<void>;
  hideEditor: () => void;
}

type ContentAction =
  | { type: 'SET_TITLE'; payload: string }
  | { type: 'SET_CONTENT'; payload?: string }
  | { type: 'SET_UPLOAD_FILES'; payload: UploadFiles }
  | { type: 'RESET' }

const contentReducer = (state: Content, action: ContentAction): Content => {
  switch (action.type) {
    case 'SET_TITLE':
      return { ...state, title: action.payload }
    case 'SET_CONTENT':
      return { ...state, content: action.payload }
    case 'SET_UPLOAD_FILES':
      return { ...state, uploadFiles: action.payload }
    case 'RESET':
      return { title: '', content: '', uploadFiles: [] }
    default:
      return state
  }
}

export default function EditorForm(props: EditorProps) {
  const { onSubmit, hideEditor, className, initialContent, titlePlaceholder } = props
  const initialState = {
    title: '',
    content: '',
    uploadFiles: [],
  }
  const [content, dispatch] = useReducer(contentReducer, initialContent || initialState)
  const editorRef = useRef<EditorMethods>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    try {
      const newContent = {
        ...content,
        title: content.title as string,
        content: content.content,
        uploadFiles: content.uploadFiles,
      }

      await onSubmit(newContent)
      dispatch({ type: 'RESET' })
      if (editorRef.current) {
        editorRef.current.reset()
      }

      // 如果是编辑，需要隐藏编辑器
      if (newContent.id) {
        hideEditor()
      }
    } catch (error) {
      toast({
        title: '提交失败',
        description: '请重试',
      })
    }
  }

  const handleFilesChange = (files?: UploadFiles) => {
    dispatch({ type: 'SET_UPLOAD_FILES', payload: files || [] })
  }

  const handleContentUpdate = (newContent: Content, actionType: ActionType) => {
    if (actionType === 'SET_TITLE') {
      dispatch({ type: 'SET_TITLE', payload: newContent.title })
    }

    if (actionType === 'SET_CONTENT') {
      dispatch({ type: 'SET_CONTENT', payload: newContent.content })
    }
  }

  return (
    <form onSubmit={handleSubmit} className={cn('editor-container', className)}>
      <div className="border rounded-[6px] p-3 overflow-auto bg-white relative">
        <EditorContainer
          titlePlaceholder={titlePlaceholder}
          initialContent={content}
          onContentUpdate={handleContentUpdate}
          ref={editorRef}
        />
        <div className="editor-footer">
          <EditorImage onFilesChange={handleFilesChange} uploadFiles={content.uploadFiles} />
          <EditorButton
            hideEditor={hideEditor}
            onFilesChange={handleFilesChange}
            disabled={!editorRef || !!editorRef.current?.isEmpty()}
            uploadFiles={content.uploadFiles}
          />
        </div>
      </div>
    </form>
  )
}