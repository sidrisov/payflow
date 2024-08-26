import { useEffect, useState } from 'react';

export function usePwa() {
  const [isPwa, setPwa] = useState(false);

  useEffect(() => {
    const checkIfPwa = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      setPwa(isStandalone);
    };

    checkIfPwa();

    // Optionally, add a listener for changes in display mode
    window.matchMedia('(display-mode: standalone)').addEventListener('change', checkIfPwa);

    return () => {
      window.matchMedia('(display-mode: standalone)').removeEventListener('change', checkIfPwa);
    };
  }, []);

  return isPwa;
}
