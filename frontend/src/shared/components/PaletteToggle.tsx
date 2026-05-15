import { usePaletteStore, type Palette } from '@/shared/theme/paletteStore';
import { Palette as PaletteIcon, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';

const PALETTES: { id: Palette; label: string }[] = [
  { id: 'navy-amber', label: 'Navy & Amber' },
  { id: 'teal-steel', label: 'Teal & Steel' },
];

export function PaletteToggle() {
  const { palette, setPalette } = usePaletteStore();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Switch palette"
        className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-[var(--color-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
      >
        <PaletteIcon className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {PALETTES.map(({ id, label }) => (
          <DropdownMenuItem key={id} onClick={() => setPalette(id)}>
            <span>{label}</span>
            {palette === id && <Check className="ml-auto h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
