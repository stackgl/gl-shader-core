gl-shader-core
==============
The core of [gl-shader](https://github.com/mikolalysenko/gl-shader), without the parser.  It can be used to compile shaders without including the (relatively large) glsl-parser dependencies, or invoked directly by libraries which use a transform.

## Install

    npm install gl-shader-core
    
## API

```javascript
var createShader = require('gl-shader-core')
```

### Constructor

There are two main usages for the constructor.  First,

#### `var shader = createShader(vertexSource, fragmentSource[, uniforms, attributes])`

Constructs a wrapped shader object with shims for all of the uniforms and attributes in the program.

* `gl` is the webgl context in which the program will be created
* `vertexSource` is the source code for the vertex shader
* `fragmentSource` is the source code for the fragment shader
* `uniforms` is an (optional) list of all uniforms exported by the shader program
* `attributes` is an (optional) list of all attributes exported by the shader program

The format of `uniforms` and `attributes` is consistent with `glslify`'s output

**Returns** A compiled shader object.

You can specify a default `location` number for each attribute, otherwise WebGL will bind it automatically. 

#### `var shader = createShader(gl, glslifyResult)`

Constructs a shader object from the output of `glslify`.

* `gl` is a WebGL context
* `glslify` is the output of `glslify`

**Returns** A wrapped shader object

### Methods

#### `shader.bind()`
Binds the shader for rendering

#### `shader.update(vertSource, fragSource[, uniforms, attributes])`
Rebuilds the shader object with new vertex and fragment shaders (same behavior as constructor)

#### `shader.update(glslifyResult)`
Rebuilds the shader object with new vertex and fragment shaders (same behavior as constructor)

#### `shader.dispose()`
Deletes the shader program and associated resources.

### Properties

#### `gl`
The WebGL context associated to the shader

#### `program`
A reference to the underlying program object in the WebGL context

#### `vertShader`
A reference to the underlying vertex shader object

#### `fragShader`
A reference to the underlying fragment shader object

### Uniforms
The uniforms for the shader program are packaged up as properties in the `shader.uniforms` object.  For example, to update a scalar uniform you can just assign to it:

```javascript
shader.uniforms.scalar = 1.0
```

While you can update vector uniforms by writing an array to them:

```javascript
shader.uniforms.vector = [1,0,1,0]
```

Matrix uniforms must have their arrays flattened first:

```javascript
shader.uniforms.matrix = [ 1, 0, 1, 0,
                           0, 1, 0, 0,
                           0, 0, 1, 1,
                           0, 0, 0, 1 ]
```

You can also read the value of uniform too if the underlying shader is currently bound.  For example,

```javascript
console.log(shader.uniforms.scalar)
console.log(shader.uniforms.vector)
console.log(shader.uniforms.matrix)
```

Struct uniforms can also be accessed using the normal dot property syntax.  For example,

```javascript
shader.uniforms.light[0].color = [1, 0, 0, 1]
```

### Attributes

The basic idea behind the attribute interface is similar to that for uniforms, however because attributes can be either a constant value or get values from a vertex array they have a slightly more complicated interface.  All of the attributes are stored in the `shader.attributes` property.

#### `attrib = constant`
For non-array attributes you can set the constant value to be broadcast across all vertices.  For example, to set the vertex color of a shader to a constant you could do:

```javascript
shader.attributes.color = [1, 0, 0, 1]
```

This internally uses [`gl.vertexAttribnf`](http://www.khronos.org/opengles/sdk/docs/man/xhtml/glVertexAttrib.xml). Setting the attribute will also call `gl.disableVertexAttribArray` on the attribute's location.

### `attrib.location`
This property accesses the location of the attribute.  You can assign/read from it to modify the location of the attribute.  For example, you can update the location by doing:

```javascript
attrib.location = 0
```

Or you can read the currently bound location back by just accessing it:

```javascript
console.log(attrib.location)
```

**WARNING** Changing the attribute location requires recompiling the program. This recompilation is deferred until the next call to `.bind()`

### `attrib.pointer([type, normalized, stride, offset])`
A shortcut for `gl.vertexAttribPointer`/`gl.enableVertexAttribArray`.  See the [OpenGL man page for details on how this works](http://www.khronos.org/opengles/sdk/docs/man/xhtml/glVertexAttribPointer.xml).  The main difference here is that the WebGL context, size and index are known and so these parameters are bound.

* `type` is the type of the pointer (default `gl.FLOAT`)
* `normalized` specifies whether fixed-point data values should be normalized (`true`) or converted directly as fixed-point values (`false`) when they are accessed.  (Default `false`)
* `stride` the byte offset between consecutive generic vertex attributes.  (Default: `0`)
* `offset` offset of the first element of the array in bytes. (Default `0`)

### Reflection

Finally, the library supports some reflection capabilities.  The set of all uniforms and data types are stored in the "type" property of the shader object,

```javascript
console.log(shader.types)
```

This reflects the uniform and attribute parameters that were passed to the shader constructor.

## Credits
(c) 2013-2014 Mikola Lysenko. MIT License