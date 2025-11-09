import { useQuery } from '@tanstack/react-query'
import { ReactElement } from 'react'
import { useParams } from 'react-router-dom'
import invariant from 'tiny-invariant'
import { log } from 'tiny-typescript-logger'
import { Skeleton } from '../components/ui/skeleton'
import { Card } from '../components/ui/card'

async function fetchApp(id: string) {
  const response = await fetch(`/api/apps/${id}`)

  if (!response.ok) {
    log.error(
      `Failed to fetch app. ${response.status} - ${response.statusText}`
    )

    throw new Error('Failed to fetch app. Please try again later.')
  }

  const data = await response.json()

  if (data.error) {
    log.error(`Error fetching app with id ${id}: ${data.error}`)

    throw new Error(data.error)
  }

  if (!data.app) {
    log.error(`App with id ${id} not found.`)

    throw new Error('App not found.')
  }

  return data.app
}

export function AppPage(): ReactElement {
  const { id } = useParams()

  invariant(id, 'id is required.')

  const {
    data: app,
    error,
    isPending
  } = useQuery({
    queryKey: ['app', id],
    queryFn: () => fetchApp(id)
  })

  console.log({ app, error, isPending })

  if (error) {
  }

  if (!app && !isPending) {
    return <div>App not found.</div>
  }

  return (
    <div className="w-full flex flex-col gap-8">
      <div>
        <div className="mb-1">
          {isPending ? (
            <Skeleton className="w-60 h-6" />
          ) : (
            <h1 className="font-medium text-xl md:text-3xl">{app.name}</h1>
          )}
        </div>
        <div>
          {isPending ? (
            <Skeleton className="w-40 h-4" />
          ) : (
            <p className="text-sm text-muted-foreground">{app.domain}</p>
          )}
        </div>
      </div>

      <Card>
        <h2 className="font-medium text-base">Recent Health Checks</h2>

        <div></div>
      </Card>
    </div>
  )
}
