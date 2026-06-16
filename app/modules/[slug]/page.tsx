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
  const related = (mod.relatedSlugs ?? []).map(s => modules[s]).filter(Boolean)
  return (
    <>
      <TrackModuleView slug={mod.slug} />
      <ModuleContent mod={mod} related={related} />
    </>
  )
}
