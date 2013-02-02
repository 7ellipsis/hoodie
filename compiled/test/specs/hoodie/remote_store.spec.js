// Generated by CoffeeScript 1.4.0

describe("Hoodie.RemoteStore", function() {
  beforeEach(function() {
    this.hoodie = new Mocks.Hoodie;
    spyOn(this.hoodie, "on");
    spyOn(this.hoodie, "trigger");
    spyOn(this.hoodie, "one");
    spyOn(this.hoodie, "unbind");
    spyOn(window, "setTimeout");
    spyOn(this.hoodie.account, "db").andReturn('joe$example.com');
    this.remote = new Hoodie.Remote(this.hoodie);
    this.remote.prefix = 'remote_prefix';
    this.remote.name = 'remote_name';
    this.requestDefer = this.hoodie.defer();
    spyOn(this.remote, "request").andReturn(this.requestDefer.promise());
    return this.remoteStore = new Hoodie.RemoteStore(this.hoodie, this.remote);
  });
  describe("constructor(@remote)", function() {
    return it("should set @remote", function() {
      var remoteStore;
      remoteStore = new Hoodie.RemoteStore(this.hoodie, this.remote);
      return expect(remoteStore.remote).toBe(this.remote);
    });
  });
  describe("#find(type, id)", function() {
    return _when("request successful", function() {
      beforeEach(function() {
        this.remoteStore.remote.prefix = 'store_prefix';
        return this.requestDefer.resolve({
          _id: 'store_prefix/car/fresh',
          createdAt: '2012-12-12T22:00:00.000Z',
          updatedAt: '2012-12-21T22:00:00.000Z'
        });
      });
      return it("should resolve with the doc", function() {
        return expect(this.remoteStore.find("todo", "1")).toBeResolvedWith({
          id: 'fresh',
          type: 'car',
          createdAt: new Date(Date.parse('2012-12-12T22:00:00.000Z')),
          updatedAt: new Date(Date.parse('2012-12-21T22:00:00.000Z'))
        });
      });
    });
  });
  describe("#findAll(type)", function() {
    it("should return a promise", function() {
      return expect(this.remoteStore.findAll()).toBePromise();
    });
    _when("type is not set", function() {
      _and("prefix is empty", function() {
        beforeEach(function() {
          return this.remoteStore.remote.prefix = '';
        });
        return it("should send a GET to /_all_docs?include_docs=true", function() {
          this.remoteStore.findAll();
          return expect(this.remoteStore.remote.request).wasCalledWith("GET", "/_all_docs?include_docs=true");
        });
      });
      return _and("prefix is '$public'", function() {
        beforeEach(function() {
          return this.remoteStore.remote.prefix = '$public';
        });
        return it("should send a GET to /_all_docs?include_docs=true", function() {
          this.remoteStore.findAll();
          return expect(this.remoteStore.remote.request).wasCalledWith("GET", '/_all_docs?include_docs=true&startkey="$public/"&endkey="$public0"');
        });
      });
    });
    _when("type is todo", function() {
      return it('should send a GET to /_all_docs?include_docs=true&startkey="todo/"&endkey="todo0"', function() {
        this.remoteStore.findAll('todo');
        return expect(this.remoteStore.remote.request).wasCalledWith("GET", '/_all_docs?include_docs=true&startkey="remote_prefix/todo/"&endkey="remote_prefix/todo0"');
      });
    });
    _when("request success", function() {
      beforeEach(function() {
        this.doc = {
          _id: 'car/fresh',
          createdAt: '2012-12-12T22:00:00.000Z',
          updatedAt: '2012-12-21T22:00:00.000Z'
        };
        return this.requestDefer.resolve({
          total_rows: 3,
          offset: 0,
          rows: [
            {
              doc: this.doc
            }
          ]
        });
      });
      return it("should be resolved with array of objects", function() {
        var object;
        object = {
          id: 'fresh',
          type: 'car',
          createdAt: new Date(Date.parse('2012-12-12T22:00:00.000Z')),
          updatedAt: new Date(Date.parse('2012-12-21T22:00:00.000Z'))
        };
        return expect(this.remoteStore.findAll()).toBeResolvedWith([object]);
      });
    });
    return _when("request has an error", function() {
      beforeEach(function() {
        return this.requestDefer.reject("error");
      });
      return it("should be rejected with the response error", function() {
        var promise;
        promise = this.remoteStore.findAll();
        return expect(promise).toBeRejectedWith("error");
      });
    });
  });
  describe("#save(type, id, object)", function() {
    beforeEach(function() {
      return spyOn(this.hoodie, "uuid").andReturn("uuid567");
    });
    it("should generate an id if it is undefined", function() {
      this.remoteStore.save("car", void 0, {});
      return expect(this.hoodie.uuid).wasCalled();
    });
    it("should not generate an id if id is set", function() {
      spyOn(this.remoteStore, "_generateNewRevisionId").andReturn('newRevId');
      this.remoteStore.save("car", 123, {});
      return expect(this.hoodie.uuid).wasNotCalled();
    });
    it("should return promise by @request", function() {
      this.remote.request.andReturn('request_promise');
      return expect(this.remoteStore.save("car", 123, {})).toBe('request_promise');
    });
    return _when("saving car/123 with color: red", function() {
      beforeEach(function() {
        var _ref, _ref1;
        this.remoteStore.save("car", 123, {
          color: "red"
        });
        return _ref = this.remoteStore.remote.request.mostRecentCall.args, this.type = _ref[0], this.path = _ref[1], (_ref1 = _ref[2], this.data = _ref1.data), _ref;
      });
      it("should send a PUT request to `/remote_prefix%2Fcar%2F123`", function() {
        expect(this.type).toBe('PUT');
        return expect(this.path).toBe('/remote_prefix%2Fcar%2F123');
      });
      it("should add type to saved object", function() {
        return expect(this.data.type).toBe('car');
      });
      it("should set _id to `car/123`", function() {
        return expect(this.data._id).toBe('remote_prefix/car/123');
      });
      return it("should not generate a _rev", function() {
        return expect(this.data._rev).toBeUndefined();
      });
    });
  });
  describe("#remove(type, id)", function() {
    beforeEach(function() {
      return spyOn(this.remoteStore, "update").andReturn("update_promise");
    });
    it("should proxy to update with _deleted: true", function() {
      this.remoteStore.remove('car', 123);
      return expect(this.remoteStore.update).wasCalledWith('car', 123, {
        _deleted: true
      });
    });
    return it("should return promise of update", function() {
      return expect(this.remoteStore.remove('car', 123)).toBe('update_promise');
    });
  });
  describe("#removeAll(type)", function() {
    beforeEach(function() {
      return spyOn(this.remoteStore, "updateAll").andReturn("updateAll_promise");
    });
    it("should proxy to updateAll with _deleted: true", function() {
      this.remoteStore.removeAll('car');
      return expect(this.remoteStore.updateAll).wasCalledWith('car', {
        _deleted: true
      });
    });
    return it("should return promise of updateAll", function() {
      return expect(this.remoteStore.removeAll('car')).toBe('updateAll_promise');
    });
  });
  describe("#on(event, callback)", function() {
    it("should namespace events with `name`", function() {
      var cb;
      cb = jasmine.createSpy('test');
      this.remoteStore.on('funky', cb);
      return expect(this.hoodie.on).wasCalledWith('remote_name:store:funky', cb);
    });
    return it("should namespace multiple events correctly", function() {
      var cb;
      cb = jasmine.createSpy('test');
      this.remoteStore.on('super funky fresh', cb);
      return expect(this.hoodie.on).wasCalledWith('remote_name:store:super remote_name:store:funky remote_name:store:fresh', cb);
    });
  });
  describe("#one(event, callback)", function() {
    it("should namespace events with `name`", function() {
      var cb;
      cb = jasmine.createSpy('test');
      this.remoteStore.on('funky', cb);
      return expect(this.hoodie.on).wasCalledWith('remote_name:store:funky', cb);
    });
    return it("should namespace multiple events correctly", function() {
      var cb;
      cb = jasmine.createSpy('test');
      this.remoteStore.on('super funky fresh', cb);
      return expect(this.hoodie.on).wasCalledWith('remote_name:store:super remote_name:store:funky remote_name:store:fresh', cb);
    });
  });
  return describe("#trigger(event, parameters...)", function() {
    return it("should namespace events with `name`", function() {
      var cb;
      cb = jasmine.createSpy('test');
      this.remoteStore.trigger('funky', cb);
      return expect(this.hoodie.trigger).wasCalledWith('remote_name:store:funky', cb);
    });
  });
});
