import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import { MonitoringSection } from "../sections/MonitoringSection";

describe("MonitoringSection", () => {
  it("renders the cadence form and triggers save", () => {
    const handleSaveMonitoringSettings = vi.fn().mockResolvedValue(undefined);
    const setMonitoringIntervalSeconds = vi.fn();

    render(
      <LocaleProvider>
        <MonitoringSection
          handleSaveMonitoringSettings={handleSaveMonitoringSettings}
          monitoringDirty={true}
          monitoringError={null}
          monitoringIntervalSeconds="300"
          monitoringLoading={false}
          monitoringSaving={false}
          monitoringUnavailable={false}
          renderSectionSaveState={() => null}
          setMonitoringIntervalSeconds={setMonitoringIntervalSeconds}
        />
      </LocaleProvider>,
    );

    fireEvent.change(screen.getByLabelText("Probe interval (seconds)"), {
      target: { value: "120" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save cadence" }));

    expect(setMonitoringIntervalSeconds).toHaveBeenCalledWith("120");
    expect(handleSaveMonitoringSettings).toHaveBeenCalledTimes(1);
  });
});
