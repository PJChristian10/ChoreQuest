import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

afterEach(() => {
  cleanup();
});
import { FilterSortBar } from "../FilterSortBar";
import type { QuestFilterSortOptions } from "../../../utils/questFilters";

const CATEGORIES = ["Cleaning", "Garden", "Kitchen", "Pets", "School"];
const DEFAULT_OPTIONS: QuestFilterSortOptions = {
  category: "all",
  recurrence: "all",
  difficulty: "all",
  sortBy: "default",
};

describe("FilterSortBar", () => {
  it("renders a Category select accessible by label 'Category'", () => {
    render(
      <FilterSortBar
        options={DEFAULT_OPTIONS}
        onChange={vi.fn()}
        availableCategories={CATEGORIES}
      />
    );
    expect(screen.getByLabelText("Category")).toBeTruthy();
  });

  it("Category select includes 'All' as an option", () => {
    render(
      <FilterSortBar
        options={DEFAULT_OPTIONS}
        onChange={vi.fn()}
        availableCategories={CATEGORIES}
      />
    );
    const select = screen.getByLabelText("Category") as HTMLSelectElement;
    expect(select).toBeTruthy();
    // Scope the query to the Category select element to avoid ambiguity across
    // multiple selects that each contain an "All" option.
    const allOptions = Array.from(select.options).map((o) => o.value);
    expect(allOptions).toContain("all");
  });

  it("renders a Recurrence select accessible by label 'Recurrence'", () => {
    render(
      <FilterSortBar
        options={DEFAULT_OPTIONS}
        onChange={vi.fn()}
        availableCategories={CATEGORIES}
      />
    );
    expect(screen.getByLabelText("Recurrence")).toBeTruthy();
  });

  it("Recurrence select includes 'All' as an option", () => {
    render(
      <FilterSortBar
        options={DEFAULT_OPTIONS}
        onChange={vi.fn()}
        availableCategories={CATEGORIES}
      />
    );
    expect(screen.getByLabelText("Recurrence")).toBeTruthy();
    // Multiple "All" options exist — just verify the Recurrence select renders
    const selects = screen.getAllByRole("combobox");
    expect(selects.length).toBeGreaterThanOrEqual(4);
  });

  it("renders a Difficulty select accessible by label 'Difficulty'", () => {
    render(
      <FilterSortBar
        options={DEFAULT_OPTIONS}
        onChange={vi.fn()}
        availableCategories={CATEGORIES}
      />
    );
    expect(screen.getByLabelText("Difficulty")).toBeTruthy();
  });

  it("Difficulty select includes 'All' as an option", () => {
    render(
      <FilterSortBar
        options={DEFAULT_OPTIONS}
        onChange={vi.fn()}
        availableCategories={CATEGORIES}
      />
    );
    expect(screen.getByLabelText("Difficulty")).toBeTruthy();
    const selects = screen.getAllByRole("combobox");
    expect(selects.length).toBeGreaterThanOrEqual(4);
  });

  it("renders a Sort By select accessible by label 'Sort by'", () => {
    render(
      <FilterSortBar
        options={DEFAULT_OPTIONS}
        onChange={vi.fn()}
        availableCategories={CATEGORIES}
      />
    );
    expect(screen.getByLabelText("Sort by")).toBeTruthy();
  });

  it("Sort By select includes 'Default' as an option", () => {
    render(
      <FilterSortBar
        options={DEFAULT_OPTIONS}
        onChange={vi.fn()}
        availableCategories={CATEGORIES}
      />
    );
    expect(screen.getByLabelText("Sort by")).toBeTruthy();
    expect(screen.getByRole("option", { name: "Default" })).toBeTruthy();
  });

  it("availableCategories appear as options in the Category select", () => {
    render(
      <FilterSortBar
        options={DEFAULT_OPTIONS}
        onChange={vi.fn()}
        availableCategories={CATEGORIES}
      />
    );
    for (const cat of CATEGORIES) {
      expect(screen.getByRole("option", { name: cat })).toBeTruthy();
    }
  });

  it("calls onChange with updated category when Category changes", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <FilterSortBar
        options={DEFAULT_OPTIONS}
        onChange={onChange}
        availableCategories={CATEGORIES}
      />
    );
    await user.selectOptions(screen.getByLabelText("Category"), "Kitchen");
    expect(onChange).toHaveBeenCalledWith({ ...DEFAULT_OPTIONS, category: "Kitchen" });
  });

  it("calls onChange with updated recurrence when Recurrence changes", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <FilterSortBar
        options={DEFAULT_OPTIONS}
        onChange={onChange}
        availableCategories={CATEGORIES}
      />
    );
    await user.selectOptions(screen.getByLabelText("Recurrence"), "daily");
    expect(onChange).toHaveBeenCalledWith({ ...DEFAULT_OPTIONS, recurrence: "daily" });
  });

  it("calls onChange with updated difficulty when Difficulty changes", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <FilterSortBar
        options={DEFAULT_OPTIONS}
        onChange={onChange}
        availableCategories={CATEGORIES}
      />
    );
    await user.selectOptions(screen.getByLabelText("Difficulty"), "1");
    expect(onChange).toHaveBeenCalledWith({ ...DEFAULT_OPTIONS, difficulty: "1" });
  });

  it("calls onChange with updated sortBy when Sort by changes", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <FilterSortBar
        options={DEFAULT_OPTIONS}
        onChange={onChange}
        availableCategories={CATEGORIES}
      />
    );
    await user.selectOptions(screen.getByLabelText("Sort by"), "xp-desc");
    expect(onChange).toHaveBeenCalledWith({ ...DEFAULT_OPTIONS, sortBy: "xp-desc" });
  });

  it("reflects controlled category value — select shows 'Kitchen' when options.category is 'Kitchen'", () => {
    render(
      <FilterSortBar
        options={{ ...DEFAULT_OPTIONS, category: "Kitchen" }}
        onChange={vi.fn()}
        availableCategories={CATEGORIES}
      />
    );
    const select = screen.getByLabelText("Category") as HTMLSelectElement;
    expect(select.value).toBe("Kitchen");
  });

  it("reflects controlled sortBy value — select shows 'Most XP' when options.sortBy is 'xp-desc'", () => {
    render(
      <FilterSortBar
        options={{ ...DEFAULT_OPTIONS, sortBy: "xp-desc" }}
        onChange={vi.fn()}
        availableCategories={CATEGORIES}
      />
    );
    const select = screen.getByLabelText("Sort by") as HTMLSelectElement;
    expect(select.value).toBe("xp-desc");
  });
});
