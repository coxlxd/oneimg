'use client'
import { useEffect, useRef, useState } from 'react'
import { addContent, deleteContent, getContents, updateContent } from '@/lib/indexed-db'
import { useToast } from '@/components/ui/use-toast'
import { ToastAction } from '@/components/ui/toast'
import { Workspace } from '@/components/workspace/workspace'
import { Header } from '@/components/header/header'
import { Preview } from '@/components/preview/preview'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import type { Content, PreviewRef, ThemeColor, ThemeContent } from '@/types/common'
import { cn, getPreviewWidthClass, getThemeBaseClass } from '@/lib/utils'

export default function Home() {
  const [contents, setContents] = useState<Content[]>([])
  const [theme, setTheme] = useState('')
  const [themeColor, setThemeColor] = useState<ThemeColor>('tech_blue')
  const [tabValue, setTabValue] = useState('workspace')
  const { toast } = useToast()
  const previewRef = useRef<PreviewRef>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const currentTheme = localStorage.getItem('currentTheme') || 'wechat-post-1'
      setTheme(currentTheme)
      const currentThemeColor = localStorage.getItem('currentThemeColor') || 'tech_blue'
      setThemeColor(currentThemeColor as ThemeColor)
    }
  }, [])

  useEffect(() => {
    const fetchContents = async () => {
      try {
        const data = await getContents()
        setContents(data)
      } catch (error) {
        toast({
          title: 'Failed to load contents',
          description: 'Please refresh the page.',
          duration: 1000,
        })
      }
    }

    fetchContents()
  }, [toast])

  async function handleThemeContentSubmit(content: ThemeContent) {
    try {
      if ('id' in content) {
        await updateContent(content)
        setContents(contents.map(item => (item.id === content.id ? content : item)))
      } else {
        const newContent = {
          ...content,
          type: 'theme_content',
        } as Content
        const id = await addContent(newContent)
        setContents(prevContents => [...prevContents, { ...newContent, id }])
        setTheme(content.theme)
        window.localStorage.setItem('currentTheme', content.theme)
      }
    } catch (error) {
      toast({
        title: 'Failed to add theme content',
        description: 'Please try again.',
      })
    }
  }

  async function handleContentSubmit(content: Content) {
    try {
      if ('id' in content) {
        await updateContent(content)
        setContents(contents.map(item => (item.id === content.id ? content : item)))
        // toast({
        //   title: 'Content updated',
        //   description: 'Content updated successfully.',
        //   duration: 1000,
        // })
      } else {
        const newContent = {
          ...content,
          type: 'normal_content',
        } as Content
        const id = await addContent(newContent)
        setContents(prevContents => [...prevContents, { ...newContent, id }])
      }
    } catch (error) {
      toast({
        title: 'Failed to add content',
        description: 'Please try again.',
      })
    }
  }

  async function handleContentDelete(content: Content) {
    try {
      setContents(contents.filter(item => item.id !== content.id))
      await deleteContent(content.id!)
      toast({
        title: 'Content deleted',
        description: 'Content deleted successfully',
        duration: 5000,
        action: <ToastAction altText="undo" onClick={() => handeleContenUndo(content)}>Undo</ToastAction>,
      })
    } catch (error) {
      toast({
        title: 'Failed to delete content',
        description: 'Please try again.',
      })
    }
  }

  async function handeleContenUndo(content: Content) {
    try {
      await addContent(content)
      setContents(contents.map(item => (item.id === content.id ? content : item)))
    } catch (error) {
      toast({
        title: 'Failed to add content',
        description: 'Please try again.',
      })
    }
  }

  return (
    <div className="flex flex-col h-full">
      <Header
        contents={contents}
        setContents={setContents}
        previewRef={previewRef}
        theme={theme}
        setTheme={setTheme}
        themeColor={themeColor}
        setThemeColor={setThemeColor}
        setTableValue={setTabValue}
      />
      <main className="h-[calc(100%-58px)]">
        <Tabs
          defaultValue="workspace"
          activationMode="manual"
          value={tabValue}
          onValueChange={setTabValue}
          className="h-full flex flex-col sm:flex-row"
        >
          <TabsList className="grid w-full grid-cols-2 sm:hidden">
            <TabsTrigger value="workspace">编辑器</TabsTrigger>
            <TabsTrigger value="preview">预览</TabsTrigger>
          </TabsList>
          <TabsContent value="preview" forceMount className="data-[state=inactive]:hidden flex-grow sm:flex-grow-0 sm:!block overflow-y-auto sm:mt-0">
            <div className={cn(theme, themeColor, getThemeBaseClass(theme), 'one w-full scroll-smooth h-full mx-auto', getPreviewWidthClass(theme))}>
              <Preview ref={previewRef} contents={contents} theme={theme} className="w-full flex flex-col m-auto" />
            </div>
          </TabsContent>
          <TabsContent value="workspace" forceMount className="data-[state=inactive]:hidden sm:flex-grow sm:!block overflow-auto">
            <div className="h-full flex-grow flex justify-center items-start bg-card text-card-foreground">
              <Workspace
                contents={contents}
                onContentSubmit={handleContentSubmit}
                onContentDelete={handleContentDelete}
                onThemeContentSubmit={handleThemeContentSubmit}
              />
          </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
