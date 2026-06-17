import { notFound } from 'next/navigation'
import { modules, moduleList } from '@/lib/content/modules'
import type { ModuleSlug } from '@/lib/types'
import { ModuleContent } from '@/components/module-content'
import { TrackModuleView } from '@/components/track-module-view'

export function generateStaticParams() {
  return moduleList.map(m => ({ slug: m.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const mod = modules[params.slug as ModuleSlug]
  if (!mod) return {}
  return { title: `${mod.title} — AI Engineer Roadmap`, description: mod.tagline }
}

export default function ModulePage({ params }: { params: { slug: string } }) {
  const mod = modules[params.slug as ModuleSlug]
  if (!mod) notFound()
  const idx = moduleList.findIndex(m => m.slug === mod.slug)
  const prev = idx > 0 ? moduleList[idx - 1] : undefined
  const next = idx >= 0 && idx < moduleList.length - 1 ? moduleList[idx + 1] : undefined
  return (
    <>
      <TrackModuleView slug={mod.slug} />
      <ModuleContent mod={mod} prev={prev} next={next} />
    </>
  )
}
