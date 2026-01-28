import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AnnualEstimatesEditor } from "../AnnualEstimatesEditor";

describe("AnnualEstimatesEditor", () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render with empty estimates", () => {
      render(
        <AnnualEstimatesEditor
          estimates={{}}
          estimatedTotal={0}
          onChange={mockOnChange}
        />,
      );

      expect(screen.getByText("Annual Estimates")).toBeInTheDocument();
      expect(
        screen.getByText("No annual estimates defined"),
      ).toBeInTheDocument();
    });

    it("should render with existing estimates", () => {
      render(
        <AnnualEstimatesEditor
          estimates={{ "2024": 50000, "2025": 75000 }}
          estimatedTotal={125000}
          onChange={mockOnChange}
        />,
      );

      expect(screen.getByDisplayValue("2024")).toBeInTheDocument();
      expect(screen.getByDisplayValue("50000")).toBeInTheDocument();
      expect(screen.getByDisplayValue("2025")).toBeInTheDocument();
      expect(screen.getByDisplayValue("75000")).toBeInTheDocument();
    });

    it("should show validation success when total matches", () => {
      render(
        <AnnualEstimatesEditor
          estimates={{ "2024": 50000, "2025": 50000 }}
          estimatedTotal={100000}
          onChange={mockOnChange}
        />,
      );

      expect(screen.getByText("Matches estimated spend")).toBeInTheDocument();
    });

    it("should show validation error when total does not match", () => {
      render(
        <AnnualEstimatesEditor
          estimates={{ "2024": 50000, "2025": 40000 }}
          estimatedTotal={100000}
          onChange={mockOnChange}
        />,
      );

      expect(screen.getByText(/Mismatch:/)).toBeInTheDocument();
    });

    it("should display total correctly", () => {
      render(
        <AnnualEstimatesEditor
          estimates={{ "2024": 50000, "2025": 75000 }}
          estimatedTotal={125000}
          onChange={mockOnChange}
        />,
      );

      expect(screen.getByText("$125,000.00")).toBeInTheDocument();
    });
  });

  describe("Adding Years", () => {
    it("should call onChange when adding a year", () => {
      render(
        <AnnualEstimatesEditor
          estimates={{}}
          estimatedTotal={0}
          onChange={mockOnChange}
        />,
      );

      const addButton = screen.getAllByRole("button", { name: /add year/i })[0];
      fireEvent.click(addButton);

      expect(mockOnChange).toHaveBeenCalledTimes(1);
      const call = mockOnChange.mock.calls[0][0];
      expect(call).toHaveProperty(new Date().getFullYear().toString());
      expect(call[new Date().getFullYear().toString()]).toBe(0);
    });

    it("should add year with zero amount by default", () => {
      render(
        <AnnualEstimatesEditor
          estimates={{ "2024": 50000 }}
          estimatedTotal={50000}
          onChange={mockOnChange}
        />,
      );

      const addButton = screen.getByRole("button", { name: /add year/i });
      fireEvent.click(addButton);

      const call = mockOnChange.mock.calls[0][0];
      const currentYear = new Date().getFullYear().toString();
      expect(call[currentYear]).toBe(0);
      expect(call["2024"]).toBe(50000); // Existing year preserved
    });
  });

  describe("Removing Years", () => {
    it("should call onChange when removing a year", () => {
      render(
        <AnnualEstimatesEditor
          estimates={{ "2024": 50000, "2025": 75000 }}
          estimatedTotal={125000}
          onChange={mockOnChange}
        />,
      );

      const removeButtons = screen.getAllByRole("button", { name: "" });
      fireEvent.click(removeButtons[0]); // Remove first year

      expect(mockOnChange).toHaveBeenCalledTimes(1);
      const call = mockOnChange.mock.calls[0][0];
      expect(call).not.toHaveProperty("2024");
      expect(call["2025"]).toBe(75000); // Other year preserved
    });

    it("should not show remove buttons when disabled", () => {
      render(
        <AnnualEstimatesEditor
          estimates={{ "2024": 50000 }}
          estimatedTotal={50000}
          onChange={mockOnChange}
          disabled={true}
        />,
      );

      const removeButtons = screen.queryAllByRole("button", { name: "" });
      expect(removeButtons.length).toBe(0);
    });
  });

  describe("Editing Year", () => {
    it("should call onChange when year is changed", () => {
      render(
        <AnnualEstimatesEditor
          estimates={{ "2024": 50000 }}
          estimatedTotal={50000}
          onChange={mockOnChange}
        />,
      );

      const yearInput = screen.getByDisplayValue("2024");
      fireEvent.change(yearInput, { target: { value: "2025" } });

      expect(mockOnChange).toHaveBeenCalledTimes(1);
      const call = mockOnChange.mock.calls[0][0];
      expect(call).not.toHaveProperty("2024");
      expect(call["2025"]).toBe(50000);
    });

    it("should not call onChange when year is changed to same value", () => {
      render(
        <AnnualEstimatesEditor
          estimates={{ "2024": 50000 }}
          estimatedTotal={50000}
          onChange={mockOnChange}
        />,
      );

      const yearInput = screen.getByDisplayValue("2024");
      fireEvent.change(yearInput, { target: { value: "2024" } });

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it("should preserve amount when changing year", () => {
      render(
        <AnnualEstimatesEditor
          estimates={{ "2024": 50000, "2025": 75000 }}
          estimatedTotal={125000}
          onChange={mockOnChange}
        />,
      );

      const yearInputs = screen.getAllByDisplayValue(/202[45]/);
      fireEvent.change(yearInputs[0], { target: { value: "2026" } });

      const call = mockOnChange.mock.calls[0][0];
      expect(call["2026"]).toBe(50000);
      expect(call["2025"]).toBe(75000);
    });
  });

  describe("Editing Amount", () => {
    it("should call onChange when amount is changed", () => {
      render(
        <AnnualEstimatesEditor
          estimates={{ "2024": 50000 }}
          estimatedTotal={50000}
          onChange={mockOnChange}
        />,
      );

      const amountInput = screen.getByDisplayValue("50000");
      fireEvent.change(amountInput, { target: { value: "60000" } });

      expect(mockOnChange).toHaveBeenCalledTimes(1);
      const call = mockOnChange.mock.calls[0][0];
      expect(call["2024"]).toBe(60000);
    });

    it("should handle decimal amounts", () => {
      render(
        <AnnualEstimatesEditor
          estimates={{ "2024": 50000 }}
          estimatedTotal={50000}
          onChange={mockOnChange}
        />,
      );

      const amountInput = screen.getByDisplayValue("50000");
      fireEvent.change(amountInput, { target: { value: "50000.50" } });

      const call = mockOnChange.mock.calls[0][0];
      expect(call["2024"]).toBe(50000.5);
    });

    it("should handle empty amount as zero", () => {
      render(
        <AnnualEstimatesEditor
          estimates={{ "2024": 50000 }}
          estimatedTotal={50000}
          onChange={mockOnChange}
        />,
      );

      const amountInput = screen.getByDisplayValue("50000");
      fireEvent.change(amountInput, { target: { value: "" } });

      const call = mockOnChange.mock.calls[0][0];
      expect(call["2024"]).toBe(0);
    });

    it("should handle invalid amount as zero", () => {
      render(
        <AnnualEstimatesEditor
          estimates={{ "2024": 50000 }}
          estimatedTotal={50000}
          onChange={mockOnChange}
        />,
      );

      const amountInput = screen.getByDisplayValue("50000");
      fireEvent.change(amountInput, { target: { value: "invalid" } });

      const call = mockOnChange.mock.calls[0][0];
      expect(call["2024"]).toBe(0);
    });
  });

  describe("Validation", () => {
    it("should validate sum equals estimated total", () => {
      const { rerender } = render(
        <AnnualEstimatesEditor
          estimates={{ "2024": 50000, "2025": 50000 }}
          estimatedTotal={100000}
          onChange={mockOnChange}
        />,
      );

      expect(screen.getByText("Matches estimated spend")).toBeInTheDocument();

      // Change to invalid sum
      rerender(
        <AnnualEstimatesEditor
          estimates={{ "2024": 50000, "2025": 40000 }}
          estimatedTotal={100000}
          onChange={mockOnChange}
        />,
      );

      expect(
        screen.queryByText("Matches estimated spend"),
      ).not.toBeInTheDocument();
      expect(screen.getByText(/Mismatch:/)).toBeInTheDocument();
    });

    it("should handle floating point precision in validation", () => {
      render(
        <AnnualEstimatesEditor
          estimates={{ "2024": 33.33, "2025": 33.33, "2026": 33.34 }}
          estimatedTotal={100}
          onChange={mockOnChange}
        />,
      );

      expect(screen.getByText("Matches estimated spend")).toBeInTheDocument();
    });

    it("should calculate total correctly with multiple years", () => {
      render(
        <AnnualEstimatesEditor
          estimates={{
            "2024": 25000,
            "2025": 30000,
            "2026": 20000,
            "2027": 25000,
          }}
          estimatedTotal={100000}
          onChange={mockOnChange}
        />,
      );

      expect(screen.getByText("$100,000.00")).toBeInTheDocument();
      expect(screen.getByText("Matches estimated spend")).toBeInTheDocument();
    });
  });

  describe("Disabled State", () => {
    it("should disable all inputs when disabled prop is true", () => {
      render(
        <AnnualEstimatesEditor
          estimates={{ "2024": 50000 }}
          estimatedTotal={50000}
          onChange={mockOnChange}
          disabled={true}
        />,
      );

      const yearInput = screen.getByDisplayValue("2024");
      const amountInput = screen.getByDisplayValue("50000");

      expect(yearInput).toBeDisabled();
      expect(amountInput).toBeDisabled();
    });

    it("should not show add year button when disabled", () => {
      render(
        <AnnualEstimatesEditor
          estimates={{ "2024": 50000 }}
          estimatedTotal={50000}
          onChange={mockOnChange}
          disabled={true}
        />,
      );

      expect(
        screen.queryByRole("button", { name: /add year/i }),
      ).not.toBeInTheDocument();
    });

    it("should not show remove buttons when disabled", () => {
      render(
        <AnnualEstimatesEditor
          estimates={{ "2024": 50000, "2025": 75000 }}
          estimatedTotal={125000}
          onChange={mockOnChange}
          disabled={true}
        />,
      );

      const removeButtons = screen.queryAllByRole("button");
      expect(removeButtons.length).toBe(0);
    });
  });

  describe("Edge Cases", () => {
    it("should handle zero estimated total", () => {
      render(
        <AnnualEstimatesEditor
          estimates={{}}
          estimatedTotal={0}
          onChange={mockOnChange}
        />,
      );

      expect(screen.getByText("Annual Estimates")).toBeInTheDocument();
    });

    it("should handle very large numbers", () => {
      render(
        <AnnualEstimatesEditor
          estimates={{ "2024": 1000000000 }}
          estimatedTotal={1000000000}
          onChange={mockOnChange}
        />,
      );

      expect(screen.getByText("$1,000,000,000.00")).toBeInTheDocument();
    });

    it("should handle multiple years in random order", () => {
      render(
        <AnnualEstimatesEditor
          estimates={{
            "2026": 30000,
            "2024": 25000,
            "2025": 45000,
          }}
          estimatedTotal={100000}
          onChange={mockOnChange}
        />,
      );

      expect(screen.getByText("$100,000.00")).toBeInTheDocument();
    });
  });
});
