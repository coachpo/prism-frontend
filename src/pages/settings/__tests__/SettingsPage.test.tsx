import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useSettingsPageSectionState } from "../useSettingsPageSectionState";

describe("useSettingsPageSectionState", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/settings");
  });

  it("activates the profile tab and writes the section hash when jumping to a profile section", () => {
    const { result } = renderHook(() => useSettingsPageSectionState());

    act(() => {
      result.current.jumpToSection("audit-configuration");
    });

    expect(result.current.activeTab).toBe("profile");
    expect(result.current.activeSectionId).toBe("audit-configuration");
    expect(window.location.hash).toBe("#audit-configuration");
  });

  it("clears the active section when switching to the global tab", () => {
    const { result } = renderHook(() => useSettingsPageSectionState());

    act(() => {
      result.current.jumpToSection("audit-configuration");
      result.current.setActiveTab("global");
    });

    expect(result.current.activeTab).toBe("global");
    expect(result.current.activeSectionId).toBeNull();
  });
});
