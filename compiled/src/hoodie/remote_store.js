// Generated by CoffeeScript 1.4.0
var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __slice = [].slice;

Hoodie.RemoteStore = (function(_super) {

  __extends(RemoteStore, _super);

  function RemoteStore(hoodie, remote) {
    this.hoodie = hoodie;
    this.remote = remote;
    this._mapDocsFromFindAll = __bind(this._mapDocsFromFindAll, this);

    this.parseAllFromRemote = __bind(this.parseAllFromRemote, this);

    this.parseFromRemote = __bind(this.parseFromRemote, this);

  }

  RemoteStore.prototype.find = function(type, id) {
    var defer, path;
    defer = RemoteStore.__super__.find.apply(this, arguments);
    if (this.hoodie.isPromise(defer)) {
      return defer;
    }
    path = "/" + encodeURIComponent("" + type + "/" + id);
    return this.remote.request("GET", path).pipe(this.parseFromRemote);
  };

  RemoteStore.prototype.findAll = function(type) {
    var defer, keyPrefix, path, promise;
    defer = RemoteStore.__super__.findAll.apply(this, arguments);
    if (this.hoodie.isPromise(defer)) {
      return defer;
    }
    path = "/_all_docs?include_docs=true";
    switch (true) {
      case (type != null) && this.remote.prefix !== '':
        keyPrefix = "" + this.remote.prefix + "/" + type;
        break;
      case type != null:
        keyPrefix = type;
        break;
      case this.remote.prefix !== '':
        keyPrefix = this.remote.prefix;
        break;
      default:
        keyPrefix = '';
    }
    if (keyPrefix) {
      path = "" + path + "&startkey=\"" + keyPrefix + "\/\"&endkey=\"" + keyPrefix + "0\"";
    }
    promise = this.remote.request("GET", path);
    promise.fail(defer.reject);
    promise.pipe(this._mapDocsFromFindAll).pipe(this.parseAllFromRemote).done(defer.resolve);
    return defer.promise();
  };

  RemoteStore.prototype.save = function(type, id, object) {
    var defer, doc, path;
    defer = RemoteStore.__super__.save.apply(this, arguments);
    if (this.hoodie.isPromise(defer)) {
      return defer;
    }
    if (!id) {
      id = this.hoodie.uuid();
    }
    object = $.extend({
      type: type,
      id: id
    }, object);
    doc = this.parseForRemote(object);
    path = "/" + encodeURIComponent(doc._id);
    return this.remote.request("PUT", path, {
      data: doc
    });
  };

  RemoteStore.prototype.remove = function(type, id) {
    return this.update(type, id, {
      _deleted: true
    });
  };

  RemoteStore.prototype.removeAll = function(type) {
    return this.updateAll(type, {
      _deleted: true
    });
  };

  RemoteStore.prototype.parseForRemote = function(obj) {
    var attr, attributes;
    attributes = $.extend({}, obj);
    for (attr in attributes) {
      if (~this._validSpecialAttributes.indexOf(attr)) {
        continue;
      }
      if (!/^_/.test(attr)) {
        continue;
      }
      delete attributes[attr];
    }
    attributes._id = "" + attributes.type + "/" + attributes.id;
    if (this.remote.prefix) {
      attributes._id = "" + this.remote.prefix + "/" + attributes._id;
    }
    delete attributes.id;
    return attributes;
  };

  RemoteStore.prototype.parseFromRemote = function(obj) {
    var id, _ref;
    id = obj._id || obj.id;
    delete obj._id;
    if (this.remote.prefix) {
      id = id.replace(RegExp('^' + this.remote.prefix + '/'), '');
    }
    _ref = id.split(/\//), obj.type = _ref[0], obj.id = _ref[1];
    if (obj.createdAt) {
      obj.createdAt = new Date(Date.parse(obj.createdAt));
    }
    if (obj.updatedAt) {
      obj.updatedAt = new Date(Date.parse(obj.updatedAt));
    }
    if (obj.rev) {
      obj._rev = obj.rev;
      delete obj.rev;
    }
    return obj;
  };

  RemoteStore.prototype.parseAllFromRemote = function(objects) {
    var object, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = objects.length; _i < _len; _i++) {
      object = objects[_i];
      _results.push(this.parseFromRemote(object));
    }
    return _results;
  };

  RemoteStore.prototype.addRevisionTo = function(attributes) {
    var currentRevId, currentRevNr, newRevisionId, _ref;
    try {
      _ref = attributes._rev.split(/-/), currentRevNr = _ref[0], currentRevId = _ref[1];
    } catch (_error) {}
    currentRevNr = parseInt(currentRevNr, 10) || 0;
    newRevisionId = this._generateNewRevisionId();
    attributes._rev = "" + (currentRevNr + 1) + "-" + newRevisionId;
    attributes._revisions = {
      start: 1,
      ids: [newRevisionId]
    };
    if (currentRevId) {
      attributes._revisions.start += currentRevNr;
      return attributes._revisions.ids.push(currentRevId);
    }
  };

  RemoteStore.prototype.on = function(event, cb) {
    event = event.replace(/(^| )([^ ]+)/g, "$1" + this.remote.name + ":store:$2");
    return this.hoodie.on(event, cb);
  };

  RemoteStore.prototype.one = function(event, cb) {
    event = event.replace(/(^| )([^ ]+)/g, "$1" + this.remote.name + ":store:$2");
    return this.hoodie.one(event, cb);
  };

  RemoteStore.prototype.trigger = function() {
    var event, parameters, _ref;
    event = arguments[0], parameters = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    return (_ref = this.hoodie).trigger.apply(_ref, ["" + this.remote.name + ":store:" + event].concat(__slice.call(parameters)));
  };

  RemoteStore.prototype._validSpecialAttributes = ['_id', '_rev', '_deleted', '_revisions', '_attachments'];

  RemoteStore.prototype._generateNewRevisionId = function() {
    return this.hoodie.uuid(9);
  };

  RemoteStore.prototype._mapDocsFromFindAll = function(response) {
    return response.rows.map(function(row) {
      return row.doc;
    });
  };

  return RemoteStore;

})(Hoodie.Store);
