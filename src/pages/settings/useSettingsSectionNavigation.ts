import { useEffect, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { Location } from "react-router-dom";
import { SETTINGS_SECTIONS, SETTINGS_SECTION_IDS } from "./utils";

interface UseSettingsSectionNavigationResult {
  activeSectionId: string;
  setActiveSectionId: Dispatch<SetStateAction<string>>;
  isAuditConfigurationFocused: boolean;
  setIsAuditConfigurationFocused: Dispatch<SetStateAction<boolean>>;
}

export function useSettingsSectionNavigation(location: Location): UseSettingsSectionNavigationResult {
  const [activeSectionId, setActiveSectionId] = useState<string>(() => {
    const hashSection = location.hash.replace("#", "");
    return SETTINGS_SECTION_IDS.has(hashSection) ? hashSection : SETTINGS_SECTIONS[0].id;
  });
  const [isAuditConfigurationFocused, setIsAuditConfigurationFocused] = useState(false);

  useEffect(() => {
    const hash = location.hash.replace("#", "");
    const hasKnownSection = SETTINGS_SECTION_IDS.has(hash);
    const target = hash ? document.getElementById(hash) : null;
    const shouldHighlightAudit =
      hash === "audit-configuration" && target instanceof HTMLElement;

    const frameId = window.requestAnimationFrame(() => {
      if (hasKnownSection) {
        setActiveSectionId(hash);
      }
      if (target instanceof HTMLElement) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      setIsAuditConfigurationFocused(shouldHighlightAudit);
    });

    if (!shouldHighlightAudit) {
      return () => {
        window.cancelAnimationFrame(frameId);
      };
    }

    const clearHighlightTimer = window.setTimeout(() => {
      setIsAuditConfigurationFocused(false);
    }, 3000);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(clearHighlightTimer);
    };
  }, [location.hash]);

  useEffect(() => {
    const sections = SETTINGS_SECTIONS.map((section) => document.getElementById(section.id)).filter(
      (section): section is HTMLElement => section instanceof HTMLElement
    );
    if (sections.length === 0) {
      return;
    }

    const scrollContainerCandidate = sections[0]?.closest("main");
    const scrollContainer =
      scrollContainerCandidate instanceof HTMLElement ? scrollContainerCandidate : null;

    const markerOffset = 96;
    const updateActiveSection = () => {
      const markerTop = scrollContainer
        ? scrollContainer.getBoundingClientRect().top + markerOffset
        : markerOffset;

      let nextSectionId = sections[0]?.id ?? "";
      let smallestDistance = Number.POSITIVE_INFINITY;

      for (const section of sections) {
        const distance = Math.abs(section.getBoundingClientRect().top - markerTop);
        if (distance < smallestDistance) {
          smallestDistance = distance;
          nextSectionId = section.id;
        }
      }

      const nearBottom = scrollContainer
        ? scrollContainer.scrollTop + scrollContainer.clientHeight >= scrollContainer.scrollHeight - 4
        : window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      if (nearBottom) {
        nextSectionId = sections[sections.length - 1].id;
      }

      setActiveSectionId((current) => (current === nextSectionId ? current : nextSectionId));
    };

    updateActiveSection();
    const scrollTarget: EventTarget = scrollContainer ?? window;
    scrollTarget.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);

    return () => {
      scrollTarget.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
    };
  }, []);

  return {
    activeSectionId,
    setActiveSectionId,
    isAuditConfigurationFocused,
    setIsAuditConfigurationFocused,
  };
}
