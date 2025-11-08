import { useQuery } from '@tanstack/react-query'
import { ReactElement, ReactNode } from 'react'
import { log } from 'tiny-typescript-logger'

import { Badge } from '../components/ui/badge'
import { Card } from '../components/ui/card'
import { Skeleton } from '../components/ui/skeleton'
interface FetchAppsResponse {
  apps: any[]
}

async function fetchApps() {
  const response = await fetch('/api/apps')

  if (!response.ok) {
    log.error(
      `Failed to fetch apps.${response.status} - ${response.statusText}`
    )

    throw new Error('Failed to fetch apps. Please try again later.')
  }

  const data: FetchAppsResponse = await response.json()

  return data.apps
}

export function OverviewPage(): ReactElement {
  const {
    isPending,
    error,
    data: apps
  } = useQuery({
    queryKey: ['apps'],
    queryFn: () => fetchApps()
  })

  console.log({ isPending, error, apps })

  return (
    <div className="w-full flex flex-col gap-8">
      <div>
        <h1 className="font-medium text-xl md:text-3xl">All Apps</h1>
      </div>

      <div className="w-full flex flex-wrap gap-4">
        {isPending && (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        )}

        {!isPending &&
          apps &&
          apps.map((app) => (
            <AppCard
              key={app.id}
              app={app}
            />
          ))}
      </div>
    </div>
  )
}

function AppCard({ app }: { app: any }): ReactElement {
  return (
    <Card className="w-full max-w-104 gap-4">
      <div>
        <CardHeader>
          <h2 className="font-medium text-lg">
            <a
              className="hover:underline"
              href={`/apps/${app.id}`}
            >
              {app.name}
            </a>
          </h2>

          <div>
            <Badge>Up</Badge>
          </div>
        </CardHeader>

        <div>
          <p className="text-sm text-muted-foreground">{app.domain}</p>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">145ms</div>
      </div>
    </Card>
  )
}

function SkeletonCard(): ReactElement {
  return (
    <Card className="w-full max-w-104 gap-4">
      <div>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-6 w-12" />
        </CardHeader>

        <div>
          <Skeleton className="h-3 w-full" />
        </div>
      </div>

      <div className="flex justify-between items-center">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-20" />
      </div>
    </Card>
  )
}

function CardHeader({ children }: { children: ReactNode }): ReactElement {
  return (
    <div className="flex justify-between items-center mb-1">{children}</div>
  )
}
