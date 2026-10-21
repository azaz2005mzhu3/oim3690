# Spending Tracker Debugging Record

Source: https://oim3690.github.io/topics/ai-debugging/slides/#/24

Starter: https://oim3690.github.io/downloads/spending-tracker.html

## Expected result

Adding Coffee for 5 and Lunch for 12 should keep both expenses and show a total of $17.00. Deleting Coffee should leave Lunch and show $12.00.

## Prediction from reading the starter

The original script runs in the head before the form is parsed. The form selector therefore returns null, and registering its submit listener throws an error. No working expense list will be created; the initial total remains $0. The requested add-and-delete sequence cannot complete until this first problem is fixed. Clicking Add without a registered handler can trigger the form's normal submission/reload instead.

## Browser evidence from the original

The agent opened the actual starter in a browser and captured this page error:

```text
TypeError: Cannot read properties of null (reading 'addEventListener')
    at https://oim3690.github.io/downloads/spending-tracker.html:82:12
```

The rendered page contained an empty list and Total: $0, consistent with the code-reading prediction.

## Error + relevant code + expected behavior

Relevant starter code:

```js
// This script is in the head, before the form markup.
const form = document.querySelector("#expense-form");
form.addEventListener("submit", (event) => {
  event.preventDefault();
  const expenses = [];
  // Read inputs and render expenses.
});
```

Debugging question: Why does registering the submit handler fail here? The expected behavior is to add Coffee and Lunch, show $17, and then update the data and total to Lunch and $12 when Coffee is deleted. Explain the first error, then review the remaining calculation and deletion code one fix at a time.

## Five fixes in order

| Step | Bug | Fix | Result after adding Coffee and Lunch |
| --- | --- | --- | --- |
| 1 | Script runs before the form exists. | Move the inline script to the end of the body. | Add works, but only Lunch remains and the total is $undefined. |
| 2 | The expenses array is recreated inside every submission. | Declare it once outside the submit handler. | Both rows remain; the total is still $undefined. |
| 3 | totalOf calculates a value without returning it. | Return the total after the loop. | The total becomes $0512 because costs are strings. |
| 4 | Input.value returns a string. | Convert it with Number and validate it. | The total is $17; deleting Coffee still leaves the total at $17. |
| 5 | Delete removes only the list element. | Remove the matching array entry with splice and render again. | Deleting Coffee leaves Lunch and a total of $12. |

## Personalization

- Added an expense count under the total.
- Added the largest expense and its amount below the count.
- Both statistics update after additions and deletions, including an empty list.
- Formatted money with two decimal places and added totals in cents to avoid floating-point display problems.
- Kept user-entered names as textContent.

## Verification completed by the agent

- Executed the original and five incremental versions against a scripted DOM test harness, one version at a time.
- Verified the intermediate results in the table above.
- Checked the final Coffee/Lunch sequence, deleting everything, adding another expense after a deletion, duplicate names, largest-expense updates, blank names, empty amounts, zero, negative and invalid amounts, non-finite and oversized amounts, amounts below one cent, extra decimal places, decimal addition, and HTML-like input displayed as text.
- The scripted checks passed. These are programmatic checks, not a claim that the student personally opened DevTools or performed the steps.

## Browser reproduction to complete on your computer

The agent confirmed the original browser error. The final file's browser interaction and visual checks still need to be completed locally: this environment had no working local browser installation, and the cloud browser did not permit loading the local test HTML through a data URL.

For the teacher's one-fix-at-a-time workflow, download the original starter to a temporary working folder, save your prediction, and repeat the five edits in the order above. Reload and inspect Console after each change. Keep the final spending-tracker.html in the course repository.

Final checks with Console open:

1. Add Coffee, 5: total $5.00, count 1, largest Coffee: $5.00.
2. Add Lunch, 12: total $17.00, count 2, largest Lunch: $12.00.
3. Delete Coffee: total $12.00, count 1, largest Lunch: $12.00.
4. Add Tea, 3: Coffee must not return; total $15.00, count 2.
5. Delete all expenses: total $0.00, count 0, largest None yet.
6. Submit a blank name, a blank amount, zero, or a negative amount: an error appears and the list does not change.
7. Check a narrow browser window and confirm the form remains usable.

## Repository submission

- Put spending-tracker.html in the root of the existing oim3690 repository.
- Optionally keep this record in logs/spending-tracker-debugging.md. The slide explicitly requires the HTML file; it does not require this separate record.
- Commit and push the change, then verify the file on GitHub.
- The fixed HTML and this record were prepared in a local checkout of azaz2005mzhu3/oim3690. Check the repository commit history to confirm the remote submission.
- After personally completing the browser checks, describe the actual observations in the weekly notes if useful.
