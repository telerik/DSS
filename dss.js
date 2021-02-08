const _ = require('lodash');

// DSS Object
let dss = ( function() {

    // Store reference
    let _dss = function() {};

    // Default detect function
    _dss.detect = function() {
        return true;
    };

    /**
     * Modify detector method.
     *
     * @param {function} callback - The callback to be used to detect variables.
     */
    _dss.detector = function( callback ) {
        _dss.detect = callback;
    };

    // Store parsers
    _dss.parsers = {};

    /**
     * Add a parser for a specific variable.
     *
     * @param {string} name - The name of the variable.
     * @param {function} callback - The callback to be executed at parse time.
     */
    _dss.parser = function( name, callback ) {
        _dss.parsers[ name ] = callback;
    };

    /**
     * Add an alias for a parser.
     *
     * @param {String} newName - The name of the new variable.
     * @param {String} oldName - The name of the existing parser to use.
     */
    _dss.alias = function( newName, oldName ) {
        _dss.parsers[ newName ] = _dss.parsers[ oldName ];
    };

    /**
     * Trim whitespace from string.
     *
     * @param {string} str - The string to be trimmed.
     * @returns {string} - The trimmed string.
     */
    _dss.trim = function( str, arr ) {
        /* eslint-disable no-param-reassign */
        let defaults = [ /^\s\s*/, /\s\s*$/ ];
        arr = ( _dss.isArray( arr ) ) ? arr.concat( defaults ) : defaults;
        arr.forEach( function( regEx ) {
            str = str.replace( regEx, '' );
        } );
        return str;
        /* eslint-enable no-param-reassign */
    };

    /**
     * Check if object is an array.
     *
     * @param {object} obj - The object to check.
     * @returns {boolean} - The result of the test.
     */
    _dss.isArray = function( obj ) {
        return toString.call( obj ) === '[object Array]';
    };

    /**
     * Check the size of an object.
     *
     * @param {object} obj - The object to check.
     * @returns {boolean} - The result of the test.
     */
    _dss.size = function( obj ) {
        let size = 0;
        for ( let key in obj ) {
            if ( Object.prototype.hasOwnProperty.call( obj, key ) ) {size++;}
        }
        return size;
    };

    /**
     * Iterate over an object.
     *
     * @param {object} obj - The object to iterate over.
     * @param {function} iterator - Callback function to use when iterating.
     * @param {object} context - Optional context to pass to iterator.
     */
    _dss.each = function( obj, iterator, context ) {
        if ( obj === null ) {
            return;
        }
        if ( obj.length === Number(obj.length) ) {
            for ( let i = 0, l = obj.length; i < l; i++ ) {
                if ( iterator.call( context, obj[ i ], i, obj ) === {} ) {
                    return;
                }
            }
        } else {
            for ( let key in obj ) {
                if ( _.has( obj, key ) ) {
                    if ( iterator.call( context, obj[ key ], key, obj ) === {} ) {
                        return;
                    }
                }
            }
        }
    };

    /**
     * Extend an object.
     *
     * @param {object} obj - The object to extend.
     */
    _dss.extend = function( obj ) {
        _dss.each( Array.prototype.slice.call( arguments, 1 ), function( source ) {
            if ( source ) {
                for ( let prop in source ) {
                    obj[ prop ] = source[ prop ];
                }
            }
        });
        return obj;
    };

    /**
     * Squeeze unnecessary extra characters/string.
     *
     * @param {string} str - The string to be squeeze.
     * @param {string} def - The string to be matched.
     * @returns {string} - The modified string.
     */
    _dss.squeeze = function( str, def ) {
        return str.replace( /\s{2,}/g, def );
    };

    /**
     * Normalizes the comment block to ignore any consistent preceding
     * whitespace. Consistent means the same amount of whitespace on every line
     * of the comment block. Also strips any whitespace at the start and end of
     * the whole block.
     *
     * @param {string} block - Text block.
     * @returns {string} - A cleaned up text block.
     */
    _dss.normalize = function( block ) {

        // Strip out any preceding [whitespace]* that occur on every line. Not
        // the smartest, but I wonder if I care.
        let textBlock = block.replace( /^(\s*\*+)/, '' );

        // Strip consistent indenting by measuring first line's whitespace
        let indentSize = false;
        // eslint-disable-next-line no-unused-vars
        let unindented = ( function( lines ) {
            return lines.map( function( line ) {
                let precedingWhitespace = line.match( /^\s*/ )[ 0 ].length;
                if ( !indentSize ) {
                    indentSize = precedingWhitespace;
                }
                if ( line === '' ) {
                    return '';
                } else if ( indentSize <= precedingWhitespace && indentSize > 0 ) {
                    return line.slice( indentSize, ( line.length - 1 ) );
                }
                return line;

            } ).join( '\n' );
        } )( textBlock.split( '\n' ) );

        return _dss.trim( textBlock );

    };

    /**
     * Takes a file and extracts comments from it.
     *
     * @param {string} lines - Lines to parse.
     * @param {object} options - Options.
     * @param {function} callback - Callback.
     */
    _dss.parse = function( lines, options, callback ) {

        // Options
        // eslint-disable-next-line no-param-reassign
        options = ( options ) ? options : {};
        options.preserveWhitespace = Boolean(options.preserveWhitespace);

        // Setup
        let currentBlock = '';
        let insideSingleLineBlock = false;
        let insideMultiLineBlock = false;
        let _blocks = [];
        let _blockValues = [];
        let parsed = '';
        let blocks = [];
        let temp = {};
        let lineNum = 0;
        const overridableNames = [ 'key', 'type' ];

        /**
         * Parses a line.
         *
         * @param {object} temp - The temporary object value.
         * @param {string} line - The line to parse.
         * @param {string} block - Parsed block.
         * @param {string} file - Parsed file.
         * @returns {object} - Result of parsing.
         */
        let parser = function( temp, line, block, file ) {
            /* eslint-disable no-param-reassign */
            let indexer = function( str, find ) {
                return ( str.indexOf( find ) > 0 ) ? str.indexOf( find ) : false;
            };
            let parts = line.replace( /[^@]*@/, '' );
            let i = indexer( parts, ' ' ) || indexer( parts, '\n' ) || indexer( parts, '\r' ) || parts.length;
            let name = _dss.trim( parts.substr( 0, i ) );
            let description = _dss.trim( parts.substr( i ) );
            let variable = _dss.parsers[ name ];
            let index = block.indexOf( line );

            line = {};
            line[ name ] = ( variable ) ? variable.apply( null, [ index, description, block, file, name ] ) : ''; // eslint-disable-line no-useless-call

            if ( (overridableNames.indexOf(name) === -1) && temp[ name ] ) {
                if ( !_dss.isArray( temp[ name ] ) ) {
                    temp[name] = [ temp[ name ] ];
                }
                if ( !_dss.isArray( line[ name ] ) ) {
                    temp[ name ].push( line[ name ] );
                } else {
                    temp[ name ].push( line[ name ][ 0 ] );
                }
            } else {
                temp = _dss.extend( temp, line );
            }
            return temp;
            /* eslint-enable no-param-reassign */
        };

        /**
         * Check for single-line comment.
         *
         * @param {string} line - Line to parse/check.
         * @returns {boolean} - Result of check.
         */
        let singleLineComment = function( line ) {
            return Boolean(line.match( /^\s*\/\/\// ));
        };

        /**
         * Checks for start of a multi-line comment.
         *
         * @param {string} line - Line to parse/check.
         * @returns {boolean} - Result of check.
         */
        let startMultiLineComment = function( line ) {
            return Boolean(line.match( /^\s*\/\*/ ));
        };

        /**
         * Check for end of a multi-line comment.
         *
         * @param {string} line - Line to parse/check.
         * @returns {boolean} - Result of check.
         */
        let endMultiLineComment = function( line ) {
            if ( singleLineComment( line ) ) {
                return false;
            }
            return Boolean(line.match( /.*\*\// ));
        };

        /**
         * Removes comment identifiers for single-line comments.
         *
         * @param {string} line - Line to parse/check.
         * @returns {boolean} - Result of check.
         */
        let parseSingleLine = function( line ) {
            return line.replace( /\s*\/\/\//, '' );
        };

        /**
         * Remove comment identifiers for multi-line comments.
         *
         * @param {string} line - Line to parse/check.
         * @returns {boolean} - Result of check.
         */
        let parseMultiLine = function( line ) {
            let cleaned = line.replace( /\s*\/\*/, '' );
            return cleaned.replace( /\*\//, '' );
        };
        /* eslint-disable no-param-reassign */
        lines = String(lines);
        lines.split( /\n/ ).forEach( function( line ) {

            lineNum = lineNum + 1;
            line = String(line);

            // Parse Single line comment
            if ( singleLineComment( line ) ) {
                parsed = parseSingleLine( line );
                if ( insideSingleLineBlock ) {
                    currentBlock += '\n' + parsed;
                } else {
                    currentBlock = parsed;
                    insideSingleLineBlock = true;
                }
            }

            // Parse multi-line comments
            if ( startMultiLineComment( line ) || insideMultiLineBlock ) {
                parsed = parseMultiLine( line );
                if ( insideMultiLineBlock ) {
                    currentBlock += '\n' + parsed;
                } else {
                    currentBlock += parsed;
                    insideMultiLineBlock = true;
                }
            }

            // End a multi-line block
            if ( endMultiLineComment( line ) ) {
                insideMultiLineBlock = false;
            }

            // Store current block if done
            if ( !singleLineComment( line ) && !insideMultiLineBlock ) {
                if ( currentBlock ) {
                    let type = _dss.getKeyType(_dss.trim(line));
                    let key = _dss.getKey(_dss.trim(line), type);

                    _blocks.push( _dss.normalize( currentBlock ) );
                    _blockValues.push({
                        'type': type,
                        'key': key
                    });
                }
                insideSingleLineBlock = false;
                currentBlock = '';
            }

        });
        /* eslint-enable no-param-reassign */

        // Create new blocks with custom parsing
        _blocks.forEach( function( block, i ) {
            /* eslint-disable no-param-reassign */
            // Remove extra whitespace
            let currentBlockValues = _blockValues[i];

            for ( let key in currentBlockValues ) {
                temp[key] = currentBlockValues[key];
            }

            block = block.split( '\n' ).filter( function( line ) {
                return ( _dss.trim( _dss.normalize( line ) ) );
            } ).join( '\n' );

            // Split block into lines
            block.split( '\n' ).forEach( function( line ) {
                if ( _dss.detect( line ) ) {
                    temp = parser( temp, _dss.normalize( line ), block, lines );
                }
            });

            // Push to blocks if object isn't empty
            if ( _dss.size( temp ) ) {
                blocks.push( temp );
            }
            temp = {};
            /* eslint-enable no-param-reassign */
        });

        // Execute callback with filename and blocks
        callback( { blocks: blocks } );

    };

    /**
     * Used by parsers to get the content of multi-line annotations.
     *
     * @param {number} i - Index of the parser.
     * @param {string} line - Line to parse.
     * @param {string} block - Parsed block.
     * @param {string} file - Parsed file.
     * @param {string} parserName - Name of the parser.
     * @returns {string} - Result of parsing.
     */
    _dss.getMultiLineContent = (i, line, block, file, parserName) => {
        /* eslint-disable no-param-reassign */
        // find the next instance of a parser (if there is one based on the @ symbol)
        // in order to isolate the current multi-line parser
        let nextParserIndex = block.indexOf('\n @', i + 1);
        let markupLength = (nextParserIndex > -1) ? nextParserIndex - i : block.length;
        let markup = _dss.trim(block.split('').splice(i, markupLength).join(''));
        let parserMarker = '@' + parserName;

        markup = ((markup) => {
            let ret = [];
            let lines = markup.split('\n');

            lines.forEach((line) => {
                let pattern = '*';
                let index = line.indexOf(pattern);

                if (index > 0 && index < 10) {
                    line = line.split('').splice((index + pattern.length), line.length).join('');
                }

                // multiline
                if (lines.length <= 2) {
                    line = _dss.trim(line);
                }

                if (line && line.indexOf(parserMarker) === -1) {
                    ret.push(line);
                }

                if (line.indexOf(parserMarker) !== -1) {
                    line = _dss.trim(line.replace(parserMarker, ''));

                    if (line.length > 0) {
                        ret.push(line);
                    }
                }
            });

            return ret.join('\n');
        })( markup );
        /* eslint-enable no-param-reassign */

        return markup;
    };

    /**
     * Get the tags information.
     *
     * @param {string} line - Line to parse.
     * @returns {arr} - The array with the values.
     */
    _dss.extractJSDocTags = (line) => {
        let currentLine = line;
        const state = {};
        const typeRegEx = /\{[^]+\}/;
        const nameRegEx = /[^-]*/;
        const descriptionRegEx = /[^-]*-\s/;
        const match = currentLine.match(typeRegEx);

        if (match) {
            state.type = match[0];
            currentLine = currentLine.replace(typeRegEx, '');
        } else {
            state.type = null;
        }

        currentLine = _dss.trim(currentLine);

        if (currentLine.indexOf('-') === -1) {
            state.name = currentLine;
            state.description = null;
        } else {
            state.name = _dss.trim(currentLine.match(nameRegEx)[0]);

            if (state.name.length === 0) {
                state.name = null;
            }

            currentLine = currentLine.replace(nameRegEx, '');
            currentLine = currentLine.replace(descriptionRegEx, '');
            currentLine = _dss.trim(currentLine);
            state.description = currentLine;
        }

        return state;
    };

    /**
     * Get the Key of the block.
     *
     * @param {string} line - Line to parse.
     * @param {string} type - Type of the key.
     * @returns - The key if defined.
     */
    _dss.getKey = (line, type) => {
        let key = null;
        let match = null;
        const matchers = {
            'variable': /\$[^:]+/,
            'selector': /\.[^\s,{]+/,
            'function': /(?<=@function[\s]+)([^(\s]+)/
        };

        if (type === null) {
            return key;
        }

        match = line.match(matchers[type]);

        if ( match ) {
            key = match[0];
        }

        return key;
    };

    /**
     * Get the KeyType of the block.
     *
     * @param {string} line - Line to parse.
     * @returns - The KeyType if defined.
     */
    _dss.getKeyType = (line) => {

        if ( line.indexOf('$') === 0 ) {
            return 'variable';
        }

        if ( line.indexOf('.') === 0 ) {
            return 'selector';
        }

        if ( line.indexOf('@function') === 0 ) {
            return 'function';
        }

        return null;
    };

    // Return function
    return _dss;
})();

// Describe detection pattern
dss.detector((line) => {
    if (typeof line !== 'string') {
        return false;
    }
    let reference = line.split( '\n\n' ).pop();
    return Boolean(reference.match(/.*@/));
});

// Describe parsing a name
dss.parser('name', (i, line, block, file) => { // eslint-disable-line no-unused-vars
    return line;
});

// Describe parsing a description
dss.parser('description', (i, line, block, file, parserName) => {
    const description = dss.getMultiLineContent(i, line, block, file, parserName);

    return description;
});

// Describe parsing a state
dss.parser('state', (i, line, block, file) => { // eslint-disable-line no-unused-vars
    let state = line.split(' - ');

    return [ {
        name: (state[0]) ? dss.trim(state[0]) : '',
        escaped: (state[0]) ? dss.trim(state[0].replace('.', ' ').replace(':', ' pseudo-class-')) : '',
        description: (state[1]) ? dss.trim(state[1]) : ''
    } ];
});

// Describe parsing markup
dss.parser('markup', (i, line, block, file, parserName) => {
    const markup = dss.getMultiLineContent(i, line, block, file, parserName);

    return {
        example: markup,
        escaped: markup.replace(/</g, '&lt;').replace(/>/g, '&gt;')
    };
});

// Describe parsing a deprecated version
dss.parser('deprecated', (i, line, block, file) => { // eslint-disable-line no-unused-vars
    return line;
});

// Describe parsing a deprecated description
dss.parser('deprecatedDescription', (i, line, block, file) => { // eslint-disable-line no-unused-vars
    return line;
});

// Describe parsing a group
dss.parser('group', (i, line, block, file) => { // eslint-disable-line no-unused-vars
    return line.toLowerCase();
});

// Describe parsing a type
dss.parser('type', (i, line, block, file) => { // eslint-disable-line no-unused-vars
    return line.toLowerCase();
});

// Describe parsing a subtype
dss.parser('subtype', (i, line, block, file) => { // eslint-disable-line no-unused-vars
    return line.toLowerCase();
});

// Describe parsing a key
dss.parser('key', (i, line, block, file) => { // eslint-disable-line no-unused-vars
    return line;
});

// Describe parsing a param
dss.parser('param', (i, line, block, file) => { // eslint-disable-line no-unused-vars
    const state = dss.extractJSDocTags(line);

    return [ {
        type: state.type,
        name: state.name,
        description: state.description
    } ];
});

// Describe parsing a return
dss.parser('returns', (i, line, block, file) => { // eslint-disable-line no-unused-vars
    const state = dss.extractJSDocTags(line);

    return {
        type: state.type,
        name: state.name,
        description: state.description
    };
});

module.exports = dss;
