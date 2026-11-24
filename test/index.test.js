const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const LIB = fs.readFileSync(path.join(__dirname, "..", "index.js"), "utf8");
const VERSIONS = ["tinymce4", "tinymce5", "tinymce6", "tinymce7", "tinymce8"];

function loadWindow(pkg) {
  var dom = new JSDOM('<!doctype html><body><div id="ed"></div></body>', {
    runScripts: "outside-only",
    pretendToBeVisual: true,
    url: "http://localhost/"
  });
  var win = dom.window;
  /** jsdom lacks these; TinyMCE needs them to boot */
  win.matchMedia = function () {
    return { matches: false, addListener: function () {}, removeListener: function () {}, addEventListener: function () {}, removeEventListener: function () {} };
  };
  win.CSS = { escape: function (s) { return String(s).replace(/[^a-zA-Z0-9_-]/g, "\\$&"); } };

  var dir = path.dirname(require.resolve(pkg + "/package.json"));
  ["tinymce.js", "models/dom/model.js", "icons/default/icons.js"].forEach(function (file) {
    var full = path.join(dir, file);
    if (fs.existsSync(full)) win.eval(fs.readFileSync(full, "utf8"));
  });
  win.eval(LIB);
  return win;
}

async function initEditor(win) {
  var editors = await win.tinymce.init({
    selector: "#ed",
    inline: true,
    skin: false,
    content_css: false,
    menubar: false,
    toolbar: false,
    theme: false,
    license_key: "gpl"
  });
  return editors[0];
}

function placeCaret(editor, node, offset) {
  var rng = editor.dom.createRng();
  rng.setStart(node, offset);
  rng.collapse(true);
  editor.selection.setRng(rng);
}

VERSIONS.forEach(function (pkg) {
  test(pkg + ": returns the cursor index in the editor HTML", async function () {
    var win = loadWindow(pkg);
    var editor = await initEditor(win);

    editor.setContent("<p>Hello world</p>");
    placeCaret(editor, editor.getBody().querySelector("p").firstChild, 5);
    assert.strictEqual(win.getTinyMCECursorPosition(), "<p>Hello".length);

    editor.setContent("<p>Hello <strong>bo<em>ld</em></strong> x</p>");
    placeCaret(editor, editor.getBody().querySelector("em").firstChild, 1);
    assert.strictEqual(win.getTinyMCECursorPosition(), "<p>Hello <strong>bo<em>l".length);

    editor.setContent("<p>ab</p><p>cd</p>");
    placeCaret(editor, editor.getBody().lastChild.firstChild, 2);
    assert.strictEqual(win.getTinyMCECursorPosition(), "<p>ab</p>\n<p>cd".length);

    win.close();
  });

  test(pkg + ": leaves content, selection and undo history untouched", async function () {
    var win = loadWindow(pkg);
    var editor = await initEditor(win);
    editor.setContent("<p>Hello world</p>");
    editor.undoManager.clear();
    editor.setDirty(false);

    var text = editor.getBody().querySelector("p").firstChild;
    var rng = editor.dom.createRng();
    rng.setStart(text, 2);
    rng.setEnd(text, 7);
    editor.selection.setRng(rng);

    assert.strictEqual(win.getTinyMCECursorPosition(), "<p>He".length);
    assert.strictEqual(editor.getContent(), "<p>Hello world</p>");
    assert.strictEqual(editor.selection.getContent(), "llo w");
    assert.strictEqual(editor.undoManager.hasUndo(), false);
    assert.strictEqual(editor.isDirty(), false);

    win.close();
  });

  test(pkg + ": does not call deprecated TinyMCE APIs", async function () {
    var win = loadWindow(pkg);
    var editor = await initEditor(win);
    var warnings = [];
    win.console.warn = function (message) { warnings.push(String(message)); };

    editor.setContent("<p>Hello world</p>");
    placeCaret(editor, editor.getBody().querySelector("p").firstChild, 5);
    win.getTinyMCECursorPosition();

    assert.deepStrictEqual(warnings.filter(function (w) { return /deprecated/i.test(w); }), []);
    win.close();
  });
});
