# Stage Detection Fix - COM Pattern

## Problem

The regex pattern `/\bCOM\b/i` for detecting COM stage was incorrectly matching ".com" in email addresses like `test-chain@exnoria.com`, causing false stage detection.

## Root Cause

In the email address `test-chain@exnoria.com`:

- The `.` character is a word boundary
- The letters `c`, `o`, `m` are word characters
- The end of string is a word boundary
- Therefore `\bcom\b` matches at positions 19-21

## Solution Implemented

Changed line 22 in `layers/cognitive/src/channels/telegram.ts` from:

```javascript
{ pattern: /\bCOM\b/i, stage: 'COM' }
```

To:

```javascript
{ pattern: /(?<![.@])\bCOM\b/i, stage: 'COM' }
```

This adds a negative lookbehind assertion `(?<![.@])` that prevents matching if COM is immediately preceded by either `.` or `@`.

## Before Fix

- Text: `"Please contact john.doe@exnoria.com"`
- Result: Stage detected as `COM` (INCORRECT)

## After Fix

- Text: `"Please contact john.doe@exnoria.com"`
- Result: No stage detected (CORRECT)

## Still Works Correctly

- Text: `"COM department needs this report"`
- Result: Stage detected as `COM` (CORRECT)

- Text: `"Publicar contenido en redes sociales"`
- Result: Stage detected as `COM` (CORRECT)

## Notes

1. This fix only affects the explicit COM acronym pattern, not the semantic patterns
2. Other stage patterns may have similar issues with email addresses but were not part of the scope of this fix
3. The fix uses negative lookbehind assertions which are supported in modern JavaScript environments
