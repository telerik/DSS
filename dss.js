const _ = require('lodash');

// DSS Object
let dss = ( function() {

    // Store reference
    let _dss = function() {};

    // Default detect function
    _dss.detect = function() {
        return true;
    };

    /*
   * Modify detector method
   *
   * @param (Function) The callback to be used to detect variables
   */
    _dss.detector = function( callback ) {
        _dss.detect = callback;
    };

    // Store parsers
    _dss.parsers = {};

    /*
   * Add a parser for a specific variable
   *
   * @param (String) The name of the variable
   * @param (Function) The callback to be executed at parse time
   */
    _dss.parser = function( name, callback ) {
        _dss.parsers[ name ] = callback;
    };

    /*
   * Add an alias for a parser
   *
   * @param (String) The name of the new variable
   * @param (String) The name of the existing parser to use
   */
    _dss.alias = function( newName, oldName ) {
        _dss.parsers[ newName ] = _dss.parsers[ oldName ];
    };

    /*
   * Trim whitespace from string
   *
   * @param (String) The string to be trimmed
   * @return (String) The trimmed string
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

    /*
   * Check if object is an array
   *
   * @param (Object) The object to check
   * @return (Boolean) The result of the test
   */
    _dss.isArray = function( obj ) {
        return toString.call( obj ) === '[object Array]';
    };

    /*
   * Check the size of an object
   *
   * @param (Object) The object to check
   * @return (Boolean) The result of the test
   */
    _dss.size = function( obj ) {
        let size = 0;
        for ( let key in obj ) {
            if ( Object.prototype.hasOwnProperty.call( obj, key ) ) {size++;}
        }
        return size;
    };

    /*
   * Iterate over an object
   *
   * @param (Object) The object to iterate over
   * @param (Function) Callback function to use when iterating
   * @param (Object) Optional context to pass to iterator
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

    /*
   * Extend an object
   *
   * @param (Object) The object to extend
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

    /*
   * Squeeze unnecessary extra characters/string
   *
   * @param (String) The string to be squeeze
   * @param (String) The string to be matched
   * @return (String) The modified string
   */
    _dss.squeeze = function( str, def ) {
        return str.replace( /\s{2,}/g, def );
    };

    /*
   * Normalizes the comment block to ignore any consistent preceding
   * whitespace. Consistent means the same amount of whitespace on every line
   * of the comment block. Also strips any whitespace at the start and end of
   * the whole block.
   *
   * @param (String) Text block
   * @return (String) A cleaned up text block
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

    /*
   * Takes a file and extracts comments from it.
   *
   * @param (Object) options
   * @param (Function) callback
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
        let parsed = '';
        let blocks = [];
        let temp = {};
        let lineNum = 0;

        /*
     * Parses line
     *
     * @param (Num) the line number
     * @param (Num) number of lines
     * @param (String) line to parse/check
     * @return (Boolean) result of parsing
     */
        let parser = function( temp, line, block, file ) {
            /* eslint-disable no-param-reassign */
            let indexer = function( str, find ) {
                return ( str.indexOf( find ) > 0 ) ? str.indexOf( find ) : false;
            };
            let parts = line.replace( /.*@/, '' );
            let i = indexer( parts, ' ' ) || indexer( parts, '\n' ) || indexer( parts, '\r' ) || parts.length;
            let name = _dss.trim( parts.substr( 0, i ) );
            let description = _dss.trim( parts.substr( i ) );
            let variable = _dss.parsers[ name ];
            let index = block.indexOf( line );
            line = {};
            line[ name ] = ( variable ) ? variable.apply( null, [ index, description, block, file, name ] ) : ''; // eslint-disable-line no-useless-call
            if ( temp[ name ] ) {
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

        /*
     * Check for single-line comment
     *
     * @param (String) line to parse/check
     * @return (Boolean) result of check
     */
        let singleLineComment = function( line ) {
            return Boolean(line.match( /^\s*\/\// ));
        };

        /*
     * Checks for start of a multi-line comment
     *
     * @param (String) line to parse/check
     * @return (Boolean) result of check
     */
        let startMultiLineComment = function( line ) {
            return Boolean(line.match( /^\s*\/\*/ ));
        };

        /*
     * Check for end of a multi-line comment
     *
     * @parse (String) line to parse/check
     * @return (Boolean) result of check
     */
        let endMultiLineComment = function( line ) {
            if ( singleLineComment( line ) ) {
                return false;
            }
            return Boolean(line.match( /.*\*\// ));
        };

        /*
     * Removes comment identifiers for single-line comments.
     *
     * @param (String) line to parse/check
     * @return (Boolean) result of check
     */
        let parseSingleLine = function( line ) {
            return line.replace( /\s*\/\//, '' );
        };

        /*
     * Remove comment identifiers for multi-line comments.
     *
     * @param (String) line to parse/check
     * @return (Boolean) result of check
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
                    _blocks.push( _dss.normalize( currentBlock ) );
                }
                insideSingleLineBlock = false;
                currentBlock = '';
            }

        });
        /* eslint-enable no-param-reassign */

        // Create new blocks with custom parsing
        _blocks.forEach( function( block ) {
            /* eslint-disable no-param-reassign */
            // Remove extra whitespace
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

    // Return function
    return _dss;

})();

// Describe detection pattern
dss.detector( function( line ) {
    if ( typeof line !== 'string' ) {
        return false;
    }
    let reference = line.split( '\n\n' ).pop();
    return Boolean(reference.match( /.*@/ ));
});

// Describe parsing a name
dss.parser( 'name', function( i, line, block, file ) { // eslint-disable-line no-unused-vars
    return line;
});

// Describe parsing a description
dss.parser( 'description', function( i, line, block, file ) { // eslint-disable-line no-unused-vars
    return line;
});

// Describe parsing a state
dss.parser( 'state', function( i, line, block, file ) { // eslint-disable-line no-unused-vars
    let state = line.split( ' - ' );
    return [ {
        name: ( state[ 0 ] ) ? dss.trim( state[ 0 ] ) : '',
        escaped: ( state[ 0 ] ) ? dss.trim( state[ 0 ].replace( '.', ' ' ).replace( ':', ' pseudo-class-' ) ) : '',
        description: ( state[ 1 ] ) ? dss.trim( state[ 1 ] ) : ''
    } ];
});

// Describe parsing markup
dss.parser( 'markup', function( i, line, block, file, parserName ) {
    /* eslint-disable no-param-reassign */
    // find the next instance of a parser (if there is one based on the @ symbol)
    // in order to isolate the current multi-line parser
    let nextParserIndex = block.indexOf( '* @', i + 1 );
    let markupLength = ( nextParserIndex > -1 ) ? nextParserIndex - i : block.length;
    let markup = block.split( '' ).splice( i, markupLength ).join( '' );
    let parserMarker = '@' + parserName;

    markup = ( function( markup ) {
        let ret = [];
        let lines = markup.split( '\n' );

        lines.forEach( function( line ) {
            let pattern = '*';
            let index = line.indexOf( pattern );

            if ( index > 0 && index < 10 ) {
                line = line.split( '' ).splice( ( index + pattern.length ), line.length ).join( '' );
            }

            // multiline
            if ( lines.length <= 2 ) {
                line = dss.trim( line );
            }

            if ( line && line.indexOf( parserMarker ) === -1 ) {
                ret.push( line );
            }

        });

        return ret.join( '\n' );
        /* eslint-enable no-param-reassign */
    })( markup );

    return {
        example: markup,
        escaped: markup.replace( /</g, '&lt;' ).replace( />/g, '&gt;' )
    };

});

module.exports = dss;
