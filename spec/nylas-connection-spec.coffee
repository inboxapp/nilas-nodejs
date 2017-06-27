_ = require 'underscore'
NylasConnection = require '../src/nylas-connection'

PACKAGE_JSON = require '../package.json'
SDK_VERSION = PACKAGE_JSON.version

describe "NylasConnection", ->
  beforeEach ->
    @connection = new NylasConnection('test-access-token')

  describe 'requestOptions', ->
    it "should pass view='expanded' when expanded param is provided", ->
      options = { method : 'GET', path : '/threads/123', qs: {expanded: true} }
      result = @connection.requestOptions(options)
      expect(result.qs.expanded).toBeUndefined()
      expect(result.qs.view).toEqual('expanded')
      expect(result.headers['User-Agent']).toEqual("Nylas Node SDK v#{SDK_VERSION}")
