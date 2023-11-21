/**
 * next-tailwind -> next/tailwind
 * next-unocss -> next/unocss
 *
 * vite-react-unocss -> vite/react/unocss
 * vite-react-tailwind -> vite/react/tailwind
 * vite-react_ts-tailwind -> vite/react_ts/tailwind
 */

const allDesigns = [
  {
    value: 'tailwind',
    title: 'TailwindCSS',
  },
  {
    value: 'unocss',
    title: 'UnoCSS',
  },
]

export const TEMPLATES = [
  {
    value: 'vite',
    title: 'Vite',
    variant: [
      {
        value: 'react',
        title: 'ReactJS',
        design: allDesigns,
      },
      {
        value: 'react_ts',
        title: 'ReactJS con TypeScript',
        design: allDesigns,
      },
      {
        value: 'vue',
        title: 'VueJS',
        design: allDesigns,
      },
      {
        value: 'vue_ts',
        title: 'VueJS con TypeScript',
        design: allDesigns,
      },
    ],
  },
  {
    value: 'next',
    title: 'NextJS',
    design: allDesigns,
  },
  {
    value: 'astro',
    title: 'Astro',
    design: allDesigns,
  },
]

export function getAllTemplates (item: any[], parentKey: string | undefined, defaultAcc: Array<string>): Array<string> {
  return item.reduce((acc, i) => {
    const newKey = parentKey ? [parentKey, i.value].join('-') : i.value

    if (i.variant) {
      return getAllTemplates(i.variant, newKey, acc)
    }

    if (i.design) {
      return getAllTemplates(i.design, newKey, acc)
    }

    return [...acc, newKey]
  }, defaultAcc)
}

export function getPathTemplate (results: Record<'framework' | 'variant' | 'design', string>): string {
  return ['framework', 'variant', 'design'].reduce((acc, item) => {
    const value = results[item as keyof typeof results]
    if (value) {
      return acc + value + '/'
    }

    return acc
  }, '')
}
