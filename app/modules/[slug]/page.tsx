import { notFound } from 'next/navigation'
import { modules, moduleList } from '@/lib/content/modules'
import type { ModuleSlug } from '@/lib/types'
import { ModuleContent } from '@/components/module-content'

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
  return <ModuleContent mod={mod} related={related} />
}
