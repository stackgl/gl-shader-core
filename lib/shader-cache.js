'use strict'

module.exports = createProgram

var weakMap = typeof WeakMap === 'undefined' ? require('weakmap') : WeakMap
var CACHE = new weakMap()

function ContextCache(gl) {
  this.gl       = gl
  this.shaders  = [{}, {}]
  this.programs = {}
}

var proto = ContextCache.prototype

function compileShader(gl, type, src) {
  var shader = gl.createShader(type)
  gl.shaderSource(shader, src)
  gl.compileShader(shader)
  if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    var errLog = gl.getShaderInfoLog(shader)
    console.error('gl-shader: Error compiling shader:', errLog)
    throw new Error('gl-shader: Error compiling shader:', errLog)
  }
  return shader
}

proto.getShader = function(src, type) {
  var gl      = this.gl
  var shaders = this.shaders[(type === gl.FRAGMENT_SHADER)|0]
  var shader  = shaders[src]
  if(!shader) {
    shaders[src] = shader = compileShader(gl, type, src)
  }
  return shader
}

proto.linkProgram = function(vsrc, fsrc, attribs, locations) {
  var gl      = this.gl
  var vshader = this.getShader(vsrc, gl.VERTEX_SHADER)
  var fshader = this.getShader(fsrc, gl.FRAGMENT_SHADER)
  var program = gl.createProgram()
  gl.attachShader(program, vshader)
  gl.attachShader(program, fshader)
  for(var i=0; i<attribs.length; ++i) {
    gl.bindAttribLocation(program, locations[i], attribs[i])
  }
  gl.linkProgram(program)
  return program
}

proto.getProgram = function(vsrc, fsrc, attribs, locations) {
  var token = [vsrc, fsrc, attribs.join(':')].join()
  var prog  = this.programs[token]
  if(!prog) {
    this.programs[token] = prog = this.linkProgram(
      vsrc,
      fsrc,
      attribs,
      locations)
  }
  return prog
}

function createProgram(gl, vsrc, fsrc, attribs, locations) {
  var ctxCache = CACHE.get(gl)
  if(!ctxCache) {
    ctxCache = new ContextCache(gl)
    CACHE.set(gl, ctxCache)
  }
  return ctxCache.getProgram(vsrc, fsrc, attribs, locations)
}