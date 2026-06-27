# tinymce-cursor-position

Get the cursor position (character index) inside a TinyMCE editor.

## Install

Copy `index.js` into your project or load it via a `<script>` tag.

## Usage

```js
var position = getTinyMCECursorPosition();
console.log('Cursor is at index:', position);
```

The function returns the character index of the cursor in the editor's HTML content.

## How it works

1. Bookmarks the current cursor position
2. Inserts a temporary `<span>` at the cursor location
3. Finds the index of that span in the full HTML string
4. Removes the span and restores the cursor

## Requirements

- TinyMCE (any version that exposes `tinyMCE.activeEditor`)

## License

MIT © [nadimtuhin](https://github.com/nadimtuhin)
