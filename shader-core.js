"use strict"

//Shader object
function Shader(gl, prog, uniforms, attributes, typeInfo) {
  this.gl = gl
  this.program = prog
  this.uniforms = uniforms
  this.attributes = attributes
  this.types = typeInfo
}

//Binds the shader
Shader.prototype.bind = function() {
  this.gl.useProgram(this.program)
}

//Adds properties etc. to obj to get proper name
function getRootObj(obj, name) {
  return {
      obj: obj
    , name: name
  }
}

//Create a dummy uniform
function addDummyUniform(localObj, localName) {
  Object.defineProperty(localObj, localName, {
      get: function() {}
    , set: function(x) {return x}
  })
}

//Create a vector uniform
function addVectorUniform(gl, program, location, type, dimension, obj, name, fullName) {
  if(d > 1) {
    type = type + "v"
  }
  var setter = new Function("gl", "prog", "return function(v){gl.uniform" + d + type + "(gl.getUniformLocation(prog,'"+fullName+"'),v);return v;}")
  var getter = new Function("gl", "prog", "return function(){return gl.getUniform(prog, gl.getUniformLocation(prog,'"+fullName+"'))}")
  Object.defineProperty(obj, name, {
      set: setter(gl, program)
    , get: getter(gl, program)
    , enumerable: true
  })
}

//Create a matrix uniform
function addMatrixUniform(gl, program, location, type, dimension, obj, name, fullName) {
  var setter = new Function("gl", "prog", "return function(v){gl.uniformMatrix" + d + "fv(gl.getUniformLocation(prog,'"+fullName+"'), false, v);return v}")
  var getter = new Function("gl", "prog", "return function(){return gl.getUniform(prog, gl.getUniformLocation(prog,'"+name+"'))}")
  Object.defineProperty(obj, name, {
      set: setter(gl, prog)
    , get: getter(gl, prog)
    , enumerable: true
  })
}

//Create shims for uniforms
function createUniformWrapper(gl, program, uniforms) {
  var obj = {}
  for(var i=0, n=uniforms.length; i<n; ++i) {
    var u = uniforms[i]
    var name = u.name
    var type = u.type
    var location = gl.getUniformLocation(program, name)
    var root = getRootObj(obj, name)
    var localObj = root.obj
    var localName = root.name
    
    if(!location) {
      addDummyObj(localObj, localName)
      continue
    }
    
    switch(type) {
      case "bool":
      case "int":
      case "sampler2D":
      case "samplerCube":
        addVectorUniform(gl, program, location, "i", 1, localObj, localName, name)
      break
      
      case "float":
        addVectorUniform(gl, program, location, "f", 1, localObj, localName, name)
      break
      
      default:
        if(type.indexOf("vec") >= 0 && type.length === 5) {
          var d = type.charCodeAt(type.length-1) - 48
          if(d < 2 || d > 4) {
            throw new Error("Invalid data type")
          }
          switch(type.charAt(0)) {
            case "b":
            case "i":
              addVectorUniform(gl, program, location, "i", d, localObj, localName, name)
            break
            
            case "v":
              addVectorUniform(gl, program, location, "f", d, localObj, localName, name)
            break
            
            default:
              throw new Error("Unrecognized data type for vector " + name + ": " + type)
          }
        } else if(type.charAt(0) === "m" && type.length === 5) {
          var d = type.charCodeAt(type.length-1) - 48
          if(d < 2 || d > 4) {
            throw new Error("Invalid uniform dimension type for matrix " + name + ": " + type)
          }
          addMatrixUniform(gl, program, location, d, localObj, localName, name)
        } else {
          throw new Error("Unknown uniform data type for " + name + ": " + type)
        }
      break
    }
  }
  return obj
}

//Shader attribute class
function ShaderAttribute(gl, program, location, dimension, name, constFunc) {
  this._gl = gl
  this._program = program
  this._location = location
  this._dimension = dimension
  this._name = name
  this._constFunc = constFunc
}

var proto = ShaderAttribute.prototype

proto.pointer = function setAttribPointer(type, normalized, stride, offset) {
  var gl = this.gl
  gl.vertexAttribPointer(this._location, this._dimension, type||gl.FLOAT, normalized?gl.TRUE:gl.FALSE, stride||0, offset||0)
}

proto.enable = function enableAttrib() {
  this.gl.enableVertexAttribArray(this._location)
}

proto.disable = function disableAttrib() {
  this.gl.disableVertexAttribArray(this._location)
}

proto.set = function setAttribConstant(x, y, z, w) {
  this._constFunc(this._gl, this._location, x, y, z, w)
}

Object.defineProperty(proto, "location", {
  get: function() {
    return this._location
  }
  , set: function(v) {
    if(v !== this.location) {
      this._location = v
      this.gl.bindAttribLocation(this._program, v, this._name)
      this.gl.linkProgram(this._program)
    }
  }
})


//Adds a vector attribute to obj
function addVectorAttribute(gl, program, location, dimension, obj, name, fullName) {
  var constFuncArgs = [ "gl", "v" ]
  var varNames = []
  for(var i=0; i<d; ++i) {
    constFuncArgs.push("x"+i)
    varNames.push("x"+i)
  }
  constFuncArgs.push([
    "if(x0.length===undefined){return gl.vertexAttrib",d,"f(v,", var_names.join(","),")}else{return gl.vertexAttrib", d, "fv(v,x0)}"
  ].join(""))
  
  var attr = new ShaderAttribute(gl, program, location, dimension, fullName, constFunc)
  Object.defineProperty(obj, name, {
    set: function(x) {
      constFunc(gl, location, x)
      return x
    }
    , get: function() {
      return attr
    }
    , enumerable: true
  })
}

//Create shims for attributes
function createAttributeWrapper(gl, program, attributes) {
  var obj = {}
  for(var i=0, n=attributes.length; i<n; ++i) {
    var a = attributes[i]
    var name = a.name
    var type = a.type
    var location = gl.getAttributeLocation(program, name)
    var root = getRootObj(obj, name)
    var localObj = root.obj
    var localName = root.name
    
    switch(type) {
      case "bool":
      case "int":
      case "float":
        addVectorAttrib(gl, program, location, 1, localObj, localName, name)
      break
      
      default:
        if(type.indexOf("vec") >= 0) {
          var d = type.charCodeAt(type.length-1) - 48
          if(d < 2 || d > 4) {
            throw new Error("Invalid data type for attribute " + name + ": " + type)
          }
          addVectorAttrib(gl, program, location, d, localObj, localName, name)
        } else {
          throw new Error("Unknown data type for attribute " + name + ": " + type)
        }
      break
    }
  }
  return obj
}

//Compiles and links a shader program with the given attribute and vertex list
function createShader(
    gl
  , vertSource
  , fragSource
  , uniforms
  , attributes) {
  
  //Compile vertex shader
  var vertShader = gl.createShader(gl.VERTEX_SHADER)
  gl.shaderSource(vertShader, vertSource)
  gl.compileShader(vertShader)
  if(!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS)) {
    throw new Error("Error compiling vertex shader: " + gl.getShaderInfoLog(vertShader))
  }
  
  //Compile fragment shader
  var fragShader = gl.createShader(gl.FRAGMENT_SHADER)
  gl.shaderSource(fragShader, fragSource)
  gl.compileShader(fragShader)
  if(!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
    throw new Error("Error compiling fragment shader: " + gl.getShaderInfoLog(fragShader))
  }
  
  //Link program
  var program = gl.createProgram()
  gl.attachShader(program, fragShader)
  gl.attachShader(program, vertShader)
  gl.linkProgram(program)
  if(!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error("Error linking shader program: " + gl.getProgramInfoLog (program))
  }
  
  //Compile wrappers
  var uniformWrapper = createUniformWrapper(gl, prog, uniforms)
  var attributeWrapper = createAttributeWrapper(gl, prog, attributes)
  
  //Return final linked shader object
  return new Shader(gl, prog, uniformWrapper, attributeWrapper, { uniforms: uniforms, attributes: attributes })
}

module.exports = createShader
