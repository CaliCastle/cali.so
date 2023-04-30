import localFont from 'next/font/local'

const sansFont = localFont({
  src: [
    {
      path: './fonts/Satoshi-Variable.woff2',
      weight: '300 900',
      style: 'normal',
    },
    {
      path: './fonts/Satoshi-VariableItalic.woff2',
      weight: '300 900',
      style: 'italic',
    },
  ],
  variable: '--font-sans',
  display: 'swap',
})

export { sansFont }
