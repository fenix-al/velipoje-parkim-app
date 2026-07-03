interface Props {
  title: string
  description?: string
  /** Veprime (butona etj.) të shfaqura djathtas titullit. */
  children?: React.ReactNode
}

/** Header standard faqeje — titull, përshkrim opsional dhe veprime djathtas. */
export default function PageHeader({ title, description, children }: Props) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-xl font-bold tracking-tight text-gray-900 md:text-2xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children && <div className="flex shrink-0 items-center gap-2">{children}</div>}
    </div>
  )
}
