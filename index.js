function getTinyMCECursorPosition() {
  /**
   * get active editor
   * @type {tinymce.Editor}
   */
  var editor = tinyMCE.activeEditor;

  /** no editor yet (not initialised or already removed), so no cursor */
  if (!editor) {
    return -1;
  }

  /**
   * bookmark the current cursor position
   * @type {string|{name, index}|{start, end}|{rng}|{id}|*}
   */
  var bookmark = editor.selection.getBookmark(0);

  /** select all the bookmarks */
  var bookmarkSelector = "[data-mce-type=bookmark]";
  var bookmarks = editor.dom.select(bookmarkSelector);

  /**
   * create a dummy span element with a dummy id
   * remember the id it will be important later,
   * so we could remove the element easily when
   * are done
   * @type {string}
   */
  var id = "nt-tmce-bm-cursor";
  var dummySpan = '<span id="' + id + '"></span>';

  /**
   * put the dummy span right after the first bookmark as its where the cursor is.
   * plain DOM insertion: selection.setContent is deprecated in TinyMCE 8
   */
  editor.dom.insertAfter(editor.dom.create("span", {id: id}), bookmarks[0]);

  /** get html of the editor */
  var content = editor.getContent({format: "html"});

  /** get the index of our dummy span */
  var cursorIndex = content.indexOf(dummySpan);

  /** remember the dummy span? remove it with its id from the editor DOM :D */
  editor.dom.remove(id, !1);

  /** go back to our bookmark where our cursor wass */
  editor.selection.moveToBookmark(bookmark);

  /** return the index of our cursor */
  return cursorIndex;
}
