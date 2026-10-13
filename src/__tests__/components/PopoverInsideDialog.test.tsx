import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Dialogs sit at z-[10050]. A date picker / popover opened from inside a
// dialog used to render at z-[700] - behind the dialog - so it could not be used.
describe("Popover stacking", () => {
  it("opens above the dialog when rendered inside one", () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>חלונית</DialogTitle>
          <Popover open>
            <PopoverTrigger>פתח</PopoverTrigger>
            <PopoverContent>תוכן בתוך חלונית</PopoverContent>
          </Popover>
        </DialogContent>
      </Dialog>,
    );
    const content = screen.getByText("תוכן בתוך חלונית");
    expect(content.className).toContain("z-[10070]");
    expect(content.className).not.toContain("z-[700]");
  });

  it("keeps the regular layer outside dialogs", () => {
    render(
      <Popover open>
        <PopoverTrigger>פתח</PopoverTrigger>
        <PopoverContent>תוכן רגיל</PopoverContent>
      </Popover>,
    );
    expect(screen.getByText("תוכן רגיל").className).toContain("z-[700]");
  });
});
