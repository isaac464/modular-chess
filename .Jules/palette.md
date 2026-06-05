## 2025-05-15 - [Accessible Interactive Cards]
**Learning:** When using `div` elements as interactive cards, adding `role="button"` and `tabindex="0"` is essential, but mapping labels and descriptions via `aria-labelledby` and `aria-describedby` provides a more robust and maintainable experience than static `aria-label` strings.
**Action:** Always prefer linking to existing text content for accessibility labels to ensure the screen reader experience stays in sync with visual text.
