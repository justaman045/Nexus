"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getSiteSettings, SiteSettings, defaultSiteSettings } from "@/lib/siteSettings";

const SiteSettingsContext = createContext<SiteSettings>(defaultSiteSettings);

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(defaultSiteSettings);

  useEffect(() => {
    getSiteSettings().then(setSettings);
  }, []);

  return (
    <SiteSettingsContext.Provider value={settings}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}
