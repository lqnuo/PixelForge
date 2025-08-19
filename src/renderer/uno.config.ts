import { defineConfig, presetWind, transformerDirectives, transformerVariantGroup } from 'unocss'

export default defineConfig({
  presets: [presetWind()],
  transformers: [transformerDirectives(), transformerVariantGroup()],
  theme: {},
  shortcuts: [
    // Buttons
    [
      'btn',
      'inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors border border-transparent disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-0',
    ],
    [
      'btn-primary',
      'btn bg-[hsl(var(--primary))] text-white hover:bg-[hsl(var(--primary))]/90',
    ],
    [
      'btn-outline',
      'btn bg-[hsl(var(--card))] text-[hsl(var(--foreground))] border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]',
    ],
    // Surfaces
    [
      'card',
      'rounded-md border border-[hsl(var(--border))] p-3 bg-[hsl(var(--card))] text-[hsl(var(--card-foreground))] shadow-sm',
    ],
    // Badges
    [
      'badge',
      'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium border border-[hsl(var(--border))] bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'
    ],
    // Inputs
    [
      'input',
      'h-9 px-3 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] placeholder:text-neutral-400 outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:ring-offset-0',
    ],
    ['select', 'input pr-8 appearance-none bg-[url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'%3E%3C/polyline%3E%3C/svg%3E")] bg-[right_0.5rem_center] bg-[length:14px_14px] bg-no-repeat'],
    // Segmented control
    ['segmented', 'inline-flex items-center rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-0.5'],
    [
      'segmented-item',
      'px-3 h-8 inline-flex items-center justify-center rounded-[calc(var(--radius)-2px)] text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] data-[active=true]:bg-[hsl(var(--muted))] data-[active=true]:text-[hsl(var(--foreground))] transition-colors',
    ],
    // Toolbar container
    ['toolbar', 'p-3 border-b bg-[hsl(var(--background))] flex items-center justify-between gap-3'],
    // Status badges
    ['badge-success', 'badge text-green-700 border-green-200 bg-green-50'],
    ['badge-danger', 'badge text-red-700 border-red-200 bg-red-50'],
    ['badge-warn', 'badge text-amber-700 border-amber-200 bg-amber-50'],
    // Side navigation
    [
      'nav-item',
      'px-3 h-9 rounded-md text-sm inline-flex items-center gap-2 w-full text-left hover:bg-[hsl(var(--muted))] transition-colors whitespace-nowrap truncate',
    ],
    [
      'nav-item-active',
      'relative bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] font-medium before:content-[\"\"] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-5 before:w-[3px] before:rounded-full before:bg-[hsl(var(--primary))] pl-2',
    ],
  ],
})
