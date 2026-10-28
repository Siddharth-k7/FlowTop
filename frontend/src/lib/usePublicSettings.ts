'use client';

import { useState, useEffect } from 'react';
import { api } from './api';
import type { PublicSettingsResponse } from './types-pending';

let cachedSettings: PublicSettingsResponse | null = null;
let pendingPromise: Promise<PublicSettingsResponse> | null = null;

/**
 * Hook to retrieve public settings (WhatsApp number & templates)
 * Cached client-side to ensure single fetch across page lifecycle.
 */
export function usePublicSettings() {
  const [settings, setSettings] = useState<PublicSettingsResponse | null>(cachedSettings);
  const [isLoading, setIsLoading] = useState(!cachedSettings);

  useEffect(() => {
    if (cachedSettings) {
      setSettings(cachedSettings);
      setIsLoading(false);
      return;
    }

    if (!pendingPromise) {
      pendingPromise = api
        .getPublicSettings()
        .then((res) => {
          cachedSettings = res.data;
          return res.data;
        })
        .catch((err) => {
          console.warn('[usePublicSettings] Failed fetching public settings from API:', err);
          const fallback: PublicSettingsResponse = {
            whatsapp: {
              number: '+919876543210',
              generalTemplate: "Hi, I'd like to know more about Flowtop products.",
              productTemplate: "Hi, I'm interested in {productName} (SKU: {sku}) in {finish}. {url}",
            },
          };
          cachedSettings = fallback;
          return fallback;
        });
    }

    pendingPromise.then((data) => {
      setSettings(data);
      setIsLoading(false);
    });
  }, []);

  return { settings, isLoading };
}
