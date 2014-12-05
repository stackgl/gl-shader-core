'use strict'

var createUniformWrapper   = require('./lib/create-uniforms')
var createAttributeWrapper = require('./lib/create-attributes')
var makeReflect            = require('./lib/reflect')
var shaderCache            = require('./lib/shader-cache')

//Shader object
function Shader(gl, vref, fref) {
  this.gl         = gl
  this._vref      = vref
  this._fref      = fref
  
  //Temporarily zero out
  this._relink    =
  this.program    =
  this.attributes =
  this.uniforms   =
  this.types      = null
}

var proto = Shader.prototype

//Binds the shader
proto.bind = function() {
  if(!this.program) {
    this._relink()
  }
  this.gl.useProgram(this.program)
}

proto.dispose = function() {
  this._fref.dispose()
  this._vref.dispose()
  this.program = 
  this._relink = 
  this._fref   = 
  this._vref   = null
}

//Update export hook for glslify-live
proto.updateExports = function(
    uniforms
  , attributes) {

  var wrapper = this
  var gl      = wrapper.gl
  var uniformLocations = new Array(uniforms.length)

  //Sort attributes lexicographically
  attributes = attributes.slice()
  attributes.sort(function(a, b) {
    if(a.name < b.name) {
      return -1
    } else if(a.name > b.name) {
      return 1
    }
    return 0
  })

  //Extract names
  var attributeNames = attributes.map(function(attr) {
    return attr.name
  })

  //Get default location
  var attributeLocations = attributes.map(function(attr) {
    if('location' in attr) {
      return attr.location|0
    } else {
      return -1
    }
  })

  //For all unspecified attributes, assign them lexicographically min attribute
  var curLocation = 0
  for(var i=0; i<attributeLocations.length; ++i) {
    if(attributeLocations[i] < 0) {
      while(attributeLocations.indexOf(curLocation) >= 0) {
        curLocation += 1
      }
      attributeLocations[i] = curLocation
    }
  }

  //Relinks all uniforms
  function relink() {

    //Build program
    wrapper.program = shaderCache.program(
        gl
      , wrapper._vref
      , wrapper._fref
      , attributeNames
      , attributeLocations)

    //Get all the uniform locations
    for(var i=0; i<uniforms.length; ++i) {
      uniformLocations[i] = gl.getUniformLocation(
          wrapper.program
        , uniforms[i].name)
    }
  }

  //Perform initial linking
  relink()

  //Save relinking procedure, defer until runtime
  wrapper._relink = relink

  //Generate type info
  wrapper.types = {
    uniforms:   makeReflect(uniforms),
    attributes: makeReflect(attributes)
  }

  //Generate attribute wrappers
  wrapper.attributes = createAttributeWrapper(
      gl
    , wrapper
    , attributes
    , attributeLocations
    , relink)

  //Generate uniform wrappers
  Object.defineProperty(wrapper, 'uniforms', createUniformWrapper(
      gl
    , wrapper
    , uniforms
    , uniformLocations))
}

//Compiles and links a shader program with the given attribute and vertex list
function createShader(
    gl
  , vertSource
  , fragSource
  , uniforms
  , attributes) {

  var shader = new Shader(
      gl
    , shaderCache.shader(gl, gl.VERTEX_SHADER,   vertSource)
    , shaderCache.shader(gl, gl.FRAGMENT_SHADER, fragSource))
  shader.updateExports(uniforms, attributes)

  return shader
}

module.exports = createShader