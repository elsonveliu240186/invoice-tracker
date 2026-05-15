import { useState, useEffect } from 'react';

export function useThemeColor(varName: string): string {
  const [color, setColor] = useState<string>(() =>
    getComputedStyle(document.documentElement).getPropertyValue(varName).trim(),
  );

  useEffect(() => {
    const obs = new MutationObserver(() => {
      setColor(getComputedStyle(document.documentElement).getPropertyValue(varName).trim());
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, [varName]);

  return color;
}
