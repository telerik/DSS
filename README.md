# DSS

**DSS**, Documented Style Sheets, is a comment styleguide and parser for CSS, LESS, SASS and SCSS code.

## Generating Documentation

In most cases, you will want to include the **DSS** parser in a build step that will generate documentation files automatically.

## Parser Example

#### Example Comment Block

```css
/**
  * @name Button
  * @description Your standard form button.
  *
  * @state :hover - Highlights when hovering.
  * @state :disabled - Dims the button when disabled.
  * @state .primary - Indicates button is the primary action.
  * @state .smaller - A smaller button.
  *
  * @markup
  * <span>
  *     <button>This is a button</button>
  * </span>
  *
  * @deprecated 123.321
  * @deprecatedDescription This is deprecated.
  *
  * @group Buttons
  * @type Color
  * @subtype Text-Color
  * @key $button-bg
  *
  * @param {string} par1 - ParmOne description.
  * @param {function} par2 - ParamTwo description.
  * @returns {number} - Return description.
  */
```
#### or

```scss
/// @name Button
/// @description Your standard form button.
///
/// @state :hover - Highlights when hovering.
/// @state :disabled - Dims the button when disabled.
/// @state .primary - Indicates button is the primary action.
/// @state .smaller - A smaller button.
///
/// @markup
/// <span>
///     <button>This is a button</button>
/// </span>
///
/// @deprecated 123.321
/// @deprecatedDescription This is deprecated.
///
/// @group Buttons
/// @type Color
/// @subtype Text-Color
/// @key $button-bg
///
/// @param {string} par1 - ParmOne description.
/// @param {function} par2 - ParamTwo description.
/// @returns {number} - Return description.
///
```

## Basic Usage

```javascript
// Require/read a file
const fs = require('fs');
const dss = require('dss');
const file = fs.readFileSync('styles.scss');

// Run DSS Parser
dss.parse(file, {}, (parsed) => {
  console.log(parsed.blocks);
});
```

#### Example Generated Object

```json
[{
  "name": "Button",
  "description": "Your standard form button.",
  "state": [
    {
      "name": ":hover",
      "escaped": "pseudo-class-hover",
      "description": "Highlights when hovering."
    },
    {
      "name": ":disabled",
      "escaped": "pseudo-class-disabled",
      "description": "Dims the button when disabled."
    },
    {
      "name": ".primary",
      "escaped": "primary",
      "description": "Indicates button is the primary action."
    },
    {
      "name": ".smaller",
      "escaped": "smaller",
      "description": "A smaller button."
    }
  ],
  "markup": {
    "example": " <span>\n     <button>This is a button</button>\n </span>",
    "escaped": " &lt;span&gt;\n     &lt;button&gt;This is a button&lt;/button&gt;\n &lt;/span&gt;"
  },
  "deprecated": "123.321",
  "deprecatedDescription": "This is deprecated.",
  "group": "buttons",
  "type": "color",
  "subtype": "text-color",
  "key": "$button-bg",
  "param": [
    {
      "type": "{string}",
      "name": "par1",
      "description": "ParmOne description."
    },
    {
      "type": "{function}",
      "name": "par2",
      "description": "ParmTwo description."
    }
  ],
  "returns": {
    "type": "{number}",
    "name": null,
    "description": "Return description."
  }
}]
```

## Parsers Specifics

1. Only the `description` and `markup` parsers allow usage of multi-line comments.
1. The `state` and `param` parsers are returning an array of all the relevant annotations.
1. If not defined, the parser tries to assume the `type` and `key` values based on the next line.
1. The `group`, `type`, and `subtype` parsers convert the string annotation to lowercase letters.

## Modifying Parsers

**DSS**, by default, includes the `name`, `description`, `state`, `markup`, `deprecated`, `deprecatedDescription`, `group`, `type`, `subtype`, `key`, `param`, and `returns` parsers of a comment block. You can add to or override these default parsers using the following:

```javascript
// Matches @link
dss.parser('link', (i, line, block, file) => {
  // Replace link with HTML wrapped version
  const exp = /(b(https?|ftp|file)://[-A-Z0-9+&@#/%?=~_|!:,.;]*[-A-Z0-9+&@#/%=~_|])/ig;

  return line.replace(exp, "<a href='$1'>$1</a>");
});
```

```javascript
// Matches @version
dss.parser('version', (i, line, block, file) => {
  return line;
});
```
