interface NavigationIconProps {
  name: 'territory' | 'analysis' | 'assistant' | 'report'
}

export function NavigationIcon({ name }: NavigationIconProps) {
  const commonProps = {
    'aria-hidden': true,
    fill: 'none',
    focusable: 'false',
    viewBox: '0 0 24 24',
  } as const

  if (name === 'territory') {
    return (
      <svg {...commonProps}>
        <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z" />
        <path d="M9 3v15M15 6v15" />
      </svg>
    )
  }

  if (name === 'analysis') {
    return (
      <svg {...commonProps}>
        <path d="M4 19V9M10 19V5M16 19v-7M22 19H2" />
        <path d="m3 7 6-4 6 6 6-5" />
      </svg>
    )
  }

  if (name === 'assistant') {
    return (
      <svg {...commonProps}>
        <path d="M4 5h16v11H9l-5 4V5Z" />
        <path d="M8 9h8M8 12h5" />
      </svg>
    )
  }

  return (
    <svg {...commonProps}>
      <path d="M6 3h9l4 4v14H6V3Z" />
      <path d="M15 3v5h4M9 12h7M9 16h7" />
    </svg>
  )
}
