'use client'

import { useEffect } from 'react'
import { useProgress } from '@/lib/use-progress'

export function TrackModuleView({ slug }: { slug: string }) {
  const { recordModuleView } = useProgress()
  useEffect(() => { recordModuleView(slug) }, [slug, recordModuleView])
  return null
}
