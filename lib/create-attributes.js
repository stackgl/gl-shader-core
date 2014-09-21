'use strict'

module.exports = createAttributeWrapper

//Shader attribute class
function ShaderAttribute(gl, program, location, dimension, name, constFunc, relink) {
  this._gl = gl
  this._program = program
  this._location = location
  this._dimension = dimension
  this._name = name
  this._constFunc = constFunc
  this._relink = relink
}

var proto = ShaderAttribute.prototype

proto.pointer = function setAttribPointer(type, normalized, stride, offset) {
  var gl = this._gl
  gl.vertexAttribPointer(this._location, this._dimension, type||gl.FLOAT, !!normalized, stride||0, offset||0)
  this._gl.enableVertexAttribArray(this._location)
}

Object.defineProperty(proto, 'location', {
  get: function() {
    return this._location
  }
  , set: function(v) {
    if(v !== this._location) {
      this._location = v
      this._gl.bindAttribLocation(this._program, v, this._name)
      this._gl.linkProgram(this._program)
      this._relink()
    }
  }
})


//Adds a vector attribute to obj
function addVectorAttribute(gl, program, location, dimension, obj, name, doLink) {
  var constFuncArgs = [ 'gl', 'v' ]
  var varNames = []
  for(var i=0; i<dimension; ++i) {
    constFuncArgs.push('x'+i)
    varNames.push('x'+i)
  }
  constFuncArgs.push([
    'if(x0.length===void 0){return gl.vertexAttrib', dimension, 'f(v,', varNames.join(), ')}else{return gl.vertexAttrib', dimension, 'fv(v,x0)}'
  ].join(''))
  var constFunc = Function.apply(undefined, constFuncArgs)
  var attr = new ShaderAttribute(gl, program, location, dimension, name, constFunc, doLink)
  Object.defineProperty(obj, name, {
    set: function(x) {
      gl.disableVertexAttribArray(attr._location)
      constFunc(gl, attr._location, x)
      return x
    }
    , get: function() {
      return attr
    }
    , enumerable: true
  })
}

//Create shims for attributes
function createAttributeWrapper(gl, program, attributes, doLink) {
  var obj = {}
  for(var i=0, n=attributes.length; i<n; ++i) {
    var a = attributes[i]
    var name = a.name
    var type = a.type
    var location = gl.getAttribLocation(program, name)
    
    switch(type) {
      case 'bool':
      case 'int':
      case 'float':
        addVectorAttribute(gl, program, location, 1, obj, name, doLink)
      break
      
      default:
        if(type.indexOf('vec') >= 0) {
          var d = type.charCodeAt(type.length-1) - 48
          if(d < 2 || d > 4) {
            throw new Error('gl-shader: Invalid data type for attribute ' + name + ': ' + type)
          }
          addVectorAttribute(gl, program, location, d, obj, name, doLink)
        } else {
          throw new Error('gl-shader: Unknown data type for attribute ' + name + ': ' + type)
        }
      break
    }
  }
  return obj
}