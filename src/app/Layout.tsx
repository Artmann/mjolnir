import { ReactElement, ReactNode } from 'react'

export function Layout({ children }: { children: ReactNode }): ReactElement {
  return <div className="p-3 sm:p-6">{children}</div>
}
