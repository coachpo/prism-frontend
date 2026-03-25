import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import { EndpointsSummaryCards } from "../EndpointsSummaryCards";

describe("EndpointsSummaryCards", () => {
  it("renders the shared metric card content with the expected endpoint summary copy", () => {
    render(
      <LocaleProvider>
        <EndpointsSummaryCards
          endpointsCount={4}
          totalAttachedModels={9}
          uniqueAttachedModels={3}
          endpointsInUse={2}
        />
      </LocaleProvider>
    );

    expect(screen.getByText("Configured Endpoints")).toBeInTheDocument();
    expect(screen.getByText("Attached Models")).toBeInTheDocument();
    expect(screen.getByText("Unique Models In Use")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("9")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("2 of 4 endpoints mapped")).toBeInTheDocument();
  });
});
