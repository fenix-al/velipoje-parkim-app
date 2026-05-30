'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import { Button } from '@/components/ui/button'

type PageItem = number | 'ellipsis'

interface Props {
  page: number
  pageSize: number
  total: number
}

function getPageItems(currentPage: number, totalPages: number): PageItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const pages = new Set<number>([1, totalPages, currentPage])
  if (currentPage > 1) pages.add(currentPage - 1)
  if (currentPage < totalPages) pages.add(currentPage + 1)
  if (currentPage <= 3) {
    pages.add(2)
    pages.add(3)
    pages.add(4)
  }
  if (currentPage >= totalPages - 2) {
    pages.add(totalPages - 3)
    pages.add(totalPages - 2)
    pages.add(totalPages - 1)
  }

  const sorted = Array.from(pages)
    .filter((item) => item >= 1 && item <= totalPages)
    .sort((a, b) => a - b)

  const items: PageItem[] = []
  sorted.forEach((item, index) => {
    const previous = sorted[index - 1]
    if (previous && item - previous > 1) items.push('ellipsis')
    items.push(item)
  })
  return items
}

export default function ReportsPagination({ page, pageSize, total }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const items = getPageItems(page, totalPages)

  function goToPage(nextPage: number) {
    const params = new URLSearchParams(searchParams.toString())
    if (nextPage <= 1) {
      params.delete('page')
    } else {
      params.set('page', String(nextPage))
    }
    startTransition(() => router.replace(`${pathname}?${params.toString()}`, { scroll: false }))
  }

  return (
    <div className="flex flex-col gap-3 border-t px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
      <p className="text-xs text-muted-foreground">
        Faqja {page} nga {totalPages}
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          disabled={pending || page <= 1}
          onClick={() => goToPage(page - 1)}
        >
          Mbrapa
        </Button>
        {items.map((item, index) => (
          item === 'ellipsis' ? (
            <span key={`ellipsis-${index}`} className="px-1.5 text-sm text-muted-foreground">
              ...
            </span>
          ) : (
            <Button
              key={item}
              variant={item === page ? 'default' : 'outline'}
              size="sm"
              disabled={pending || item === page}
              aria-current={item === page ? 'page' : undefined}
              className="h-8 min-w-8 px-2"
              onClick={() => goToPage(item)}
            >
              {item}
            </Button>
          )
        ))}
        <Button
          variant="outline"
          size="sm"
          disabled={pending || page >= totalPages}
          onClick={() => goToPage(page + 1)}
        >
          Para
        </Button>
        {totalPages > 1 && (
          <Button
            variant="outline"
            size="sm"
            disabled={pending || page >= totalPages}
            onClick={() => goToPage(totalPages)}
          >
            E fundit
          </Button>
        )}
      </div>
    </div>
  )
}
