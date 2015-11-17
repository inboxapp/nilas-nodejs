_ = require 'underscore'
clone = require 'clone'
request = require 'request'
Promise = require 'bluebird'
RestfulModel = require './models/restful-model'
RestfulModelCollection = require './models/restful-model-collection'
RestfulModelInstance = require './models/restful-model-instance'
Account = require './models/account'
ManagementAccount = require './models/management-account'
ManagementModelCollection = require './models/management-model-collection'
Thread = require './models/thread'
Contact = require './models/contact'
Message = require './models/message'
Draft = require './models/draft'
File = require './models/file'
Calendar = require './models/calendar'
Event = require './models/event'
Tag = require './models/tag'
Delta = require './models/delta'
Label = require('./models/folder').Label
Folder = require('./models/folder').Folder

Attributes = require './models/attributes'


module.exports =
class NylasConnection

  constructor: (@accessToken) ->
    @threads = new RestfulModelCollection(Thread, @)
    @contacts = new RestfulModelCollection(Contact, @)
    @messages = new RestfulModelCollection(Message, @)
    @drafts = new RestfulModelCollection(Draft, @)
    @files = new RestfulModelCollection(File, @)
    @calendars = new RestfulModelCollection(Calendar, @)
    @events = new RestfulModelCollection(Event, @)
    @tags = new RestfulModelCollection(Tag, @)
    @deltas = new Delta(@)
    @labels = new RestfulModelCollection(Label, @)
    @folders = new RestfulModelCollection(Folder, @)
    @account = new RestfulModelInstance(Account, @)

  requestOptions: (options={}) ->
    options = clone(options)
    Nylas = require './nylas'
    options.method ?= 'GET'
    options.url ?= "#{Nylas.apiServer}#{options.path}" if options.path
    options.body ?= {} unless options.formData
    options.json ?= true

    user = if options.path.substr(0,3) == '/a/' then Nylas.appSecret else @accessToken

    if user
      options.auth =
        'user': user
        'pass': '',
        'sendImmediately': true
    return options

  request: (options={}) ->
    options = @requestOptions(options)

    new Promise (resolve, reject) ->
      request options, (error, response, body) ->
        if error or _.isUndefined(response) or response.statusCode > 299
          error ?= new Error(body.message)
          reject(error)
        else
          if options.url and options.url.split('/').pop() == 'download'
            return resolve(response)
          else
            try
              body = JSON.parse(body) if _.isString body
              resolve(body)
            catch error
              reject(error)

  # /send endpoint used for sending messages via direct or MIME methods
  send: (message, callback) ->
    opts =
      method: 'POST'
      body: message
      path: '/send'

    if _.isString(message)
      # raw MIME send
      opts.headers =
        'Content-Type': 'message/rfc822'
      opts.json = false

    @request opts
    .then (json) =>
      msg = new Message(@, json)
      callback(null, msg) if callback
      Promise.resolve(msg)
    .catch (err) ->
      callback(err) if callback
      Promise.reject(err)
