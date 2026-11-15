import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { QuizCheckButton } from "./quiz-check-button";

function renderQuiz() {
  render(
    <>
      <form id="quiz">
        <label>
          <input type="radio" name="h" value="up" required />
          Up
        </label>
      </form>
      <QuizCheckButton formId="quiz" className="">
        Check
      </QuizCheckButton>
    </>,
  );
  return screen.getByRole("button", { name: "Check" });
}

describe("QuizCheckButton", () => {
  it("stays inactive until a choice in its form is checked", () => {
    const button = renderQuiz();
    expect(button).toHaveAttribute("aria-disabled", "true");
    expect(button).toHaveAttribute("form", "quiz");

    fireEvent.click(screen.getByRole("radio", { name: "Up" }));
    expect(button).not.toHaveAttribute("aria-disabled");
  });

  it("shows the form's own hint when pressed before a choice", () => {
    const button = renderQuiz();
    const form = document.getElementById("quiz") as HTMLFormElement;
    const reportValidity = vi.spyOn(form, "reportValidity");
    const submit = vi.fn<(event: Event) => void>((event) => event.preventDefault());
    form.addEventListener("submit", submit);

    fireEvent.click(button);
    expect(reportValidity).toHaveBeenCalledOnce();
    expect(submit).not.toHaveBeenCalled();
  });
});
