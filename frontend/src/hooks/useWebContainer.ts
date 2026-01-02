import { useEffect, useState, useRef } from "react";
import { WebContainer } from '@webcontainer/api';

let webContainerInstance: WebContainer | null = null;

export function useWebContainer() {
  const [webcontainer, setWebcontainer] = useState<WebContainer>();
  const isBooting = useRef(false);

  useEffect(() => {
    async function bootContainer() {
      // If already booted, use the existing instance
      if (webContainerInstance) {
        setWebcontainer(webContainerInstance);
        return;
      }

      // Prevent multiple boot attempts
      if (isBooting.current) return;
      isBooting.current = true;

      try {
        console.log('Booting WebContainer...');
        const instance = await WebContainer.boot();
        console.log('WebContainer booted successfully');
        webContainerInstance = instance;
        setWebcontainer(instance);
      } catch (error) {
        console.error('Failed to boot WebContainer:', error);
        isBooting.current = false;
      }
    }

    bootContainer();
  }, []);

  return webcontainer;
}
