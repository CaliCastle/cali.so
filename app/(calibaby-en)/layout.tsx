import '../globals.css'

import {
  CaliBabyDocument,
  caliBabyRootMetadata,
} from '../_components/calibaby-document'

export const metadata = caliBabyRootMetadata

export default function EnglishCaliBabyRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <CaliBabyDocument locale="en">{children}</CaliBabyDocument>
}
