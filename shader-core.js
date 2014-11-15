'use strict'

var createUniformWrapper   = require('./lib/create-uniforms')
var createAttributeWrapper = require('./lib/create-attributes')
var makeReflect            = require('./lib/reflect')
var createProgram          = require('./lib/shader-cache')

//Shader object
function Shader(gl, vsrc, fsrc) {
  this.gl                   = gl
  this._vertSource          = vsrc
  this._fragSource          = fsrc
  
  //Temporarily zero out
  this.program    =
  this.attributes =
  this.uniforms   =
  this.types      = null
}

var proto = Shader.prototype

//Binds the shader
proto.bind = function() {
  this.gl.useProgram(this.program)
}

proto.dispose = function() {
  //TODO:  How to manage this?
  //
  //Leaking shader/progs seems reasonable since they are
  //small resources and rebuilding them is expensive
  //
}

function defaultLocations(names) {
  var zipped = names.map(function(n, i) {
    return [n,i]
  })
  zipped.sort(function(a,b) {
    return a < b ? 1 : 0
  })
  return zipped.map(function(p) {
    return p[1]
  })
}

//Update export hook for glslify-live
proto.updateExports = function(
    uniforms
  , attributes
  , attributeLocations) {

  var wrapper = this
  var gl      = wrapper.gl
  var uniformLocations = new Array(uniforms.length)  
  var attributeNames = attributes.map(function(attr) {
    return attr.name
  })

  //Read in attribute locations
  if(!Array.isArray(attributeLocations) ||
      attributes.length !== attributeLocations.length) {
    attributeLocations = defaultLocations(attributeNames)
  } else {
    attributeLocations = attributeLocations.slice()
  }


  //Relinks all uniforms
  function relink() {

    //Build program
    wrapper.program = createProgram(
        gl
      , wrapper.vsrc
      , wrapper.fsrc
      , attributeNames
      , attributeLocations)

    //Get all the uniform locations
    for(var i=0; i<uniforms.length; ++i) {
      uniformLocations[i] = gl.getUniformLocation(
          wrapper.program
        , uniforms[i].name)
    }
  }

  //Relink the program
  relink()

  //Generate type info
  this.types = {
    uniforms:   makeReflect(uniforms),
    attributes: makeReflect(attributes)
  }

  //Generate attribute wrappers
  this.attributes = createAttributeWrapper(
      gl
    , program
    , attributes
    , attributeLocations
    , relink)

  //Generate uniform wrappers
  Object.defineProperty(this, 'uniforms', createUniformWrapper(
      gl
    , program
    , uniforms
    , uniformLocations))
}

//Compiles and links a shader program with the given attribute and vertex list
function createShader(
    gl
  , vertSource
  , fragSource
  , uniforms
  , attributes
  , attributeLocations) {

  var shader = new Shader(
      gl
    , vertShader
    , fragShader
    , attributeLocations)
  shader.updateExports(uniforms, attributes)

  return shader
}

module.exports = createShader
