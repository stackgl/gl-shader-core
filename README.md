gl-shader-core
==============
The core of [gl-shader](https://github.com/mikolalysenko/gl-shader), without the parser.  It can be used to compile shaders without including the (relatively large) glsl-parser dependencies, or invoked directly by libraries which use a transform.

## Install

    npm install gl-shader-core
    
## API

### `var shader = require("gl-shader-core")(gl, vertexSource, fragmentSource, uniforms, attributes)`
Constructs a packaged gl-shader object with shims for all of the uniforms and attributes in the program.

* `gl` is the webgl context in which the program will be created
* `vertexSource` is the source code for the vertex shader
* `fragmentSource` is the source code for the fragment shader
* `uniforms` is a list of all uniforms exported by the shader program
* `attributes` is a list of all attributes exported by the shader program

**Returns** A compiled shader object.

## Credits
(c) 2013 Mikola Lysenko. MIT License