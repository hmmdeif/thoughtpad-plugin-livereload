var should = require('should'),
    app = require('./../src/main'),
    co = require('co'),
    fs = require('co-fs'),
    man = require('thoughtpad-plugin-manager'),
    thoughtpad;

describe("live reload plugin", function () {
    it("should register correctly to events", function (done) {
        thoughtpad = man.registerPlugins([app]);
        thoughtpad.config = {
            jsbundle: {
                one: [
                    'stuff'
                ],
                two: [
                    'more stuff'
                ]
            }            
        };

        thoughtpad.subscribe("javascript-precompile-complete", function *() {
            true.should.be.true;
        });

        co(function *() {
            yield thoughtpad.notify("javascript-precompile-request", {});
            done();
        })();
    });

    it("should yield twice with each primus script", function (done) {
        var count = 0;

        thoughtpad = man.registerPlugins([app]);
        thoughtpad.config = {
            jsbundle: {
                one: [
                    'stuff'
                ],
                two: [
                    'more stuff'
                ]
            }            
        };

        thoughtpad.subscribe("javascript-precompile-complete", function *(contents) {
            count++;
            contents.ext.should.equal('js');
        });

        co(function *() {
            yield thoughtpad.notify("javascript-precompile-request", {});
            count.should.equal(2);
            done();
        })();
    });

    it("should put the primus script into the config", function (done) {
        thoughtpad = man.registerPlugins([app]);
        thoughtpad.config = {
            jsbundle: {
                one: [
                    'stuff'
                ],
                two: [
                    'more stuff'
                ]
            }            
        };

        thoughtpad.subscribe("javascript-precompile-complete", function *(contents) {
            contents.ext.should.equal('js');
        });

        co(function *() {
            yield thoughtpad.notify("javascript-precompile-request", {});
            thoughtpad.config.jsbundle.one.should.eql(['stuff', 'primus-browser', 'primus']);
            thoughtpad.config.jsbundle.one.should.eql(['stuff', 'primus-browser', 'primus']);
            done();
        })();
    });
});