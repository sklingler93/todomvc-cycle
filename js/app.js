(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var xstream_1 = require("xstream");
var adapt_1 = require("@cycle/run/lib/adapt");
var fromEvent_1 = require("./fromEvent");
var BodyDOMSource = (function () {
    function BodyDOMSource(_name) {
        this._name = _name;
    }
    BodyDOMSource.prototype.select = function (selector) {
        // This functionality is still undefined/undecided.
        return this;
    };
    BodyDOMSource.prototype.elements = function () {
        var out = adapt_1.adapt(xstream_1.default.of(document.body));
        out._isCycleSource = this._name;
        return out;
    };
    BodyDOMSource.prototype.events = function (eventType, options) {
        if (options === void 0) { options = {}; }
        var stream;
        stream = fromEvent_1.fromEvent(document.body, eventType, options.useCapture, options.preventDefault);
        var out = adapt_1.adapt(stream);
        out._isCycleSource = this._name;
        return out;
    };
    return BodyDOMSource;
}());
exports.BodyDOMSource = BodyDOMSource;

},{"./fromEvent":9,"@cycle/run/lib/adapt":24,"xstream":140}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var xstream_1 = require("xstream");
var adapt_1 = require("@cycle/run/lib/adapt");
var fromEvent_1 = require("./fromEvent");
var DocumentDOMSource = (function () {
    function DocumentDOMSource(_name) {
        this._name = _name;
    }
    DocumentDOMSource.prototype.select = function (selector) {
        // This functionality is still undefined/undecided.
        return this;
    };
    DocumentDOMSource.prototype.elements = function () {
        var out = adapt_1.adapt(xstream_1.default.of(document));
        out._isCycleSource = this._name;
        return out;
    };
    DocumentDOMSource.prototype.events = function (eventType, options) {
        if (options === void 0) { options = {}; }
        var stream;
        stream = fromEvent_1.fromEvent(document, eventType, options.useCapture, options.preventDefault);
        var out = adapt_1.adapt(stream);
        out._isCycleSource = this._name;
        return out;
    };
    return DocumentDOMSource;
}());
exports.DocumentDOMSource = DocumentDOMSource;

},{"./fromEvent":9,"@cycle/run/lib/adapt":24,"xstream":140}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ScopeChecker_1 = require("./ScopeChecker");
var utils_1 = require("./utils");
var matchesSelector_1 = require("./matchesSelector");
function toElArray(input) {
    return Array.prototype.slice.call(input);
}
var ElementFinder = (function () {
    function ElementFinder(namespace, isolateModule) {
        this.namespace = namespace;
        this.isolateModule = isolateModule;
    }
    ElementFinder.prototype.call = function (rootElement) {
        var namespace = this.namespace;
        var selector = utils_1.getSelectors(namespace);
        if (!selector) {
            return rootElement;
        }
        var fullScope = utils_1.getFullScope(namespace);
        var scopeChecker = new ScopeChecker_1.ScopeChecker(fullScope, this.isolateModule);
        var topNode = fullScope
            ? this.isolateModule.getElement(fullScope) || rootElement
            : rootElement;
        var topNodeMatchesSelector = !!fullScope && !!selector && matchesSelector_1.matchesSelector(topNode, selector);
        return toElArray(topNode.querySelectorAll(selector))
            .filter(scopeChecker.isDirectlyInScope, scopeChecker)
            .concat(topNodeMatchesSelector ? [topNode] : []);
    };
    return ElementFinder;
}());
exports.ElementFinder = ElementFinder;

},{"./ScopeChecker":7,"./matchesSelector":14,"./utils":18}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var xstream_1 = require("xstream");
var ScopeChecker_1 = require("./ScopeChecker");
var utils_1 = require("./utils");
var matchesSelector_1 = require("./matchesSelector");
/**
 * Finds (with binary search) index of the destination that id equal to searchId
 * among the destinations in the given array.
 */
function indexOf(arr, searchId) {
    var minIndex = 0;
    var maxIndex = arr.length - 1;
    var currentIndex;
    var current;
    while (minIndex <= maxIndex) {
        currentIndex = ((minIndex + maxIndex) / 2) | 0; // tslint:disable-line:no-bitwise
        current = arr[currentIndex];
        var currentId = current.id;
        if (currentId < searchId) {
            minIndex = currentIndex + 1;
        }
        else if (currentId > searchId) {
            maxIndex = currentIndex - 1;
        }
        else {
            return currentIndex;
        }
    }
    return -1;
}
/**
 * Manages "Event delegation", by connecting an origin with multiple
 * destinations.
 *
 * Attaches a DOM event listener to the DOM element called the "origin",
 * and delegates events to "destinations", which are subjects as outputs
 * for the DOMSource. Simulates bubbling or capturing, with regards to
 * isolation boundaries too.
 */
var EventDelegator = (function () {
    function EventDelegator(origin, eventType, useCapture, isolateModule, preventDefault) {
        if (preventDefault === void 0) { preventDefault = false; }
        var _this = this;
        this.origin = origin;
        this.eventType = eventType;
        this.useCapture = useCapture;
        this.isolateModule = isolateModule;
        this.preventDefault = preventDefault;
        this.destinations = [];
        this._lastId = 0;
        if (preventDefault) {
            if (useCapture) {
                this.listener = function (ev) {
                    ev.preventDefault();
                    _this.capture(ev);
                };
            }
            else {
                this.listener = function (ev) {
                    ev.preventDefault();
                    _this.bubble(ev);
                };
            }
        }
        else {
            if (useCapture) {
                this.listener = function (ev) { return _this.capture(ev); };
            }
            else {
                this.listener = function (ev) { return _this.bubble(ev); };
            }
        }
        origin.addEventListener(eventType, this.listener, useCapture);
    }
    EventDelegator.prototype.updateOrigin = function (newOrigin) {
        this.origin.removeEventListener(this.eventType, this.listener, this.useCapture);
        newOrigin.addEventListener(this.eventType, this.listener, this.useCapture);
        this.origin = newOrigin;
    };
    /**
     * Creates a *new* destination given the namespace and returns the subject
     * representing the destination of events. Is not referentially transparent,
     * will always return a different output for the same input.
     */
    EventDelegator.prototype.createDestination = function (namespace) {
        var _this = this;
        var id = this._lastId++;
        var selector = utils_1.getSelectors(namespace);
        var scopeChecker = new ScopeChecker_1.ScopeChecker(utils_1.getFullScope(namespace), this.isolateModule);
        var subject = xstream_1.default.create({
            start: function () { },
            stop: function () {
                if ('requestIdleCallback' in window) {
                    requestIdleCallback(function () {
                        _this.removeDestination(id);
                    });
                }
                else {
                    _this.removeDestination(id);
                }
            },
        });
        var destination = { id: id, selector: selector, scopeChecker: scopeChecker, subject: subject };
        this.destinations.push(destination);
        return subject;
    };
    /**
     * Removes the destination that has the given id.
     */
    EventDelegator.prototype.removeDestination = function (id) {
        var i = indexOf(this.destinations, id);
        i >= 0 && this.destinations.splice(i, 1); // tslint:disable-line:no-unused-expression
    };
    EventDelegator.prototype.capture = function (ev) {
        var n = this.destinations.length;
        for (var i = 0; i < n; i++) {
            var dest = this.destinations[i];
            if (matchesSelector_1.matchesSelector(ev.target, dest.selector)) {
                dest.subject._n(ev);
            }
        }
    };
    EventDelegator.prototype.bubble = function (rawEvent) {
        var origin = this.origin;
        if (!origin.contains(rawEvent.currentTarget)) {
            return;
        }
        var roof = origin.parentElement;
        var ev = this.patchEvent(rawEvent);
        for (var el = ev.target; el && el !== roof; el = el.parentElement) {
            if (!origin.contains(el)) {
                ev.stopPropagation();
            }
            if (ev.propagationHasBeenStopped) {
                return;
            }
            this.matchEventAgainstDestinations(el, ev);
        }
    };
    EventDelegator.prototype.patchEvent = function (event) {
        var pEvent = event;
        pEvent.propagationHasBeenStopped = false;
        var oldStopPropagation = pEvent.stopPropagation;
        pEvent.stopPropagation = function stopPropagation() {
            oldStopPropagation.call(this);
            this.propagationHasBeenStopped = true;
        };
        return pEvent;
    };
    EventDelegator.prototype.matchEventAgainstDestinations = function (el, ev) {
        var n = this.destinations.length;
        for (var i = 0; i < n; i++) {
            var dest = this.destinations[i];
            if (!dest.scopeChecker.isDirectlyInScope(el)) {
                continue;
            }
            if (matchesSelector_1.matchesSelector(el, dest.selector)) {
                this.mutateEventCurrentTarget(ev, el);
                dest.subject._n(ev);
            }
        }
    };
    EventDelegator.prototype.mutateEventCurrentTarget = function (event, currentTargetElement) {
        try {
            Object.defineProperty(event, "currentTarget", {
                value: currentTargetElement,
                configurable: true,
            });
        }
        catch (err) {
            console.log("please use event.ownerTarget");
        }
        event.ownerTarget = currentTargetElement;
    };
    return EventDelegator;
}());
exports.EventDelegator = EventDelegator;

},{"./ScopeChecker":7,"./matchesSelector":14,"./utils":18,"xstream":140}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var MapPolyfill = require("es6-map");
var IsolateModule = (function () {
    function IsolateModule() {
        this.elementsByFullScope = new MapPolyfill();
        this.delegatorsByFullScope = new MapPolyfill();
        this.fullScopesBeingUpdated = [];
        this.vnodesBeingRemoved = [];
    }
    IsolateModule.prototype.cleanupVNode = function (_a) {
        var data = _a.data, elm = _a.elm;
        var fullScope = (data || {}).isolate || '';
        var isCurrentElm = this.elementsByFullScope.get(fullScope) === elm;
        var isScopeBeingUpdated = this.fullScopesBeingUpdated.indexOf(fullScope) >= 0;
        if (fullScope && isCurrentElm && !isScopeBeingUpdated) {
            this.elementsByFullScope.delete(fullScope);
            this.delegatorsByFullScope.delete(fullScope);
        }
    };
    IsolateModule.prototype.getElement = function (fullScope) {
        return this.elementsByFullScope.get(fullScope);
    };
    IsolateModule.prototype.getFullScope = function (elm) {
        var iterator = this.elementsByFullScope.entries();
        for (var result = iterator.next(); !!result.value; result = iterator.next()) {
            var _a = result.value, fullScope = _a[0], element = _a[1];
            if (elm === element) {
                return fullScope;
            }
        }
        return '';
    };
    IsolateModule.prototype.addEventDelegator = function (fullScope, eventDelegator) {
        var delegators = this.delegatorsByFullScope.get(fullScope);
        if (!delegators) {
            delegators = [];
            this.delegatorsByFullScope.set(fullScope, delegators);
        }
        delegators[delegators.length] = eventDelegator;
    };
    IsolateModule.prototype.reset = function () {
        this.elementsByFullScope.clear();
        this.delegatorsByFullScope.clear();
        this.fullScopesBeingUpdated = [];
    };
    IsolateModule.prototype.createModule = function () {
        var self = this;
        return {
            create: function (oldVNode, vNode) {
                var _a = oldVNode.data, oldData = _a === void 0 ? {} : _a;
                var elm = vNode.elm, _b = vNode.data, data = _b === void 0 ? {} : _b;
                var oldFullScope = oldData.isolate || '';
                var fullScope = data.isolate || '';
                // Update data structures with the newly-created element
                if (fullScope) {
                    self.fullScopesBeingUpdated.push(fullScope);
                    if (oldFullScope) {
                        self.elementsByFullScope.delete(oldFullScope);
                    }
                    self.elementsByFullScope.set(fullScope, elm);
                    // Update delegators for this scope
                    var delegators = self.delegatorsByFullScope.get(fullScope);
                    if (delegators) {
                        var len = delegators.length;
                        for (var i = 0; i < len; ++i) {
                            delegators[i].updateOrigin(elm);
                        }
                    }
                }
                if (oldFullScope && !fullScope) {
                    self.elementsByFullScope.delete(fullScope);
                }
            },
            update: function (oldVNode, vNode) {
                var _a = oldVNode.data, oldData = _a === void 0 ? {} : _a;
                var elm = vNode.elm, _b = vNode.data, data = _b === void 0 ? {} : _b;
                var oldFullScope = oldData.isolate || '';
                var fullScope = data.isolate || '';
                // Same element, but different scope, so update the data structures
                if (fullScope && fullScope !== oldFullScope) {
                    if (oldFullScope) {
                        self.elementsByFullScope.delete(oldFullScope);
                    }
                    self.elementsByFullScope.set(fullScope, elm);
                    var delegators = self.delegatorsByFullScope.get(oldFullScope);
                    if (delegators) {
                        self.delegatorsByFullScope.delete(oldFullScope);
                        self.delegatorsByFullScope.set(fullScope, delegators);
                    }
                }
                // Same element, but lost the scope, so update the data structures
                if (oldFullScope && !fullScope) {
                    self.elementsByFullScope.delete(oldFullScope);
                    self.delegatorsByFullScope.delete(oldFullScope);
                }
            },
            destroy: function (vNode) {
                self.vnodesBeingRemoved.push(vNode);
            },
            remove: function (vNode, cb) {
                self.vnodesBeingRemoved.push(vNode);
                cb();
            },
            post: function () {
                var vnodesBeingRemoved = self.vnodesBeingRemoved;
                for (var i = vnodesBeingRemoved.length - 1; i >= 0; i--) {
                    self.cleanupVNode(vnodesBeingRemoved[i]);
                }
                self.vnodesBeingRemoved = [];
                self.fullScopesBeingUpdated = [];
            },
        };
    };
    return IsolateModule;
}());
exports.IsolateModule = IsolateModule;

},{"es6-map":87}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var adapt_1 = require("@cycle/run/lib/adapt");
var DocumentDOMSource_1 = require("./DocumentDOMSource");
var BodyDOMSource_1 = require("./BodyDOMSource");
var ElementFinder_1 = require("./ElementFinder");
var fromEvent_1 = require("./fromEvent");
var isolate_1 = require("./isolate");
var EventDelegator_1 = require("./EventDelegator");
var utils_1 = require("./utils");
var eventTypesThatDontBubble = [
    "blur",
    "canplay",
    "canplaythrough",
    "change",
    "durationchange",
    "emptied",
    "ended",
    "focus",
    "load",
    "loadeddata",
    "loadedmetadata",
    "mouseenter",
    "mouseleave",
    "pause",
    "play",
    "playing",
    "ratechange",
    "reset",
    "scroll",
    "seeked",
    "seeking",
    "stalled",
    "submit",
    "suspend",
    "timeupdate",
    "unload",
    "volumechange",
    "waiting",
];
function determineUseCapture(eventType, options) {
    var result = false;
    if (typeof options.useCapture === 'boolean') {
        result = options.useCapture;
    }
    if (eventTypesThatDontBubble.indexOf(eventType) !== -1) {
        result = true;
    }
    return result;
}
function filterBasedOnIsolation(domSource, fullScope) {
    return function filterBasedOnIsolationOperator(rootElement$) {
        var initialState = {
            wasIsolated: false,
            shouldPass: false,
            element: null,
        };
        return rootElement$
            .fold(function checkIfShouldPass(state, element) {
            var isIsolated = !!domSource._isolateModule.getElement(fullScope);
            state.shouldPass = isIsolated && !state.wasIsolated;
            state.wasIsolated = isIsolated;
            state.element = element;
            return state;
        }, initialState)
            .drop(1)
            .filter(function (s) { return s.shouldPass; })
            .map(function (s) { return s.element; });
    };
}
var MainDOMSource = (function () {
    function MainDOMSource(_rootElement$, _sanitation$, _namespace, _isolateModule, _delegators, _name) {
        if (_namespace === void 0) { _namespace = []; }
        var _this = this;
        this._rootElement$ = _rootElement$;
        this._sanitation$ = _sanitation$;
        this._namespace = _namespace;
        this._isolateModule = _isolateModule;
        this._delegators = _delegators;
        this._name = _name;
        this.isolateSource = isolate_1.isolateSource;
        this.isolateSink = function (sink, scope) {
            if (scope === ':root') {
                return sink;
            }
            else if (utils_1.isClassOrId(scope)) {
                return isolate_1.siblingIsolateSink(sink, scope);
            }
            else {
                var prevFullScope = utils_1.getFullScope(_this._namespace);
                var nextFullScope = [prevFullScope, scope].filter(function (x) { return !!x; }).join('-');
                return isolate_1.totalIsolateSink(sink, nextFullScope);
            }
        };
    }
    MainDOMSource.prototype.elements = function () {
        var output$;
        if (this._namespace.length === 0) {
            output$ = this._rootElement$;
        }
        else {
            var elementFinder_1 = new ElementFinder_1.ElementFinder(this._namespace, this._isolateModule);
            output$ = this._rootElement$.map(function (el) { return elementFinder_1.call(el); });
        }
        var out = adapt_1.adapt(output$.remember());
        out._isCycleSource = this._name;
        return out;
    };
    Object.defineProperty(MainDOMSource.prototype, "namespace", {
        get: function () {
            return this._namespace;
        },
        enumerable: true,
        configurable: true
    });
    MainDOMSource.prototype.select = function (selector) {
        if (typeof selector !== 'string') {
            throw new Error("DOM driver's select() expects the argument to be a " +
                "string as a CSS selector");
        }
        if (selector === 'document') {
            return new DocumentDOMSource_1.DocumentDOMSource(this._name);
        }
        if (selector === 'body') {
            return new BodyDOMSource_1.BodyDOMSource(this._name);
        }
        var trimmedSelector = selector.trim();
        var childNamespace = trimmedSelector === ":root"
            ? this._namespace
            : this._namespace.concat(trimmedSelector);
        return new MainDOMSource(this._rootElement$, this._sanitation$, childNamespace, this._isolateModule, this._delegators, this._name);
    };
    MainDOMSource.prototype.events = function (eventType, options) {
        if (options === void 0) { options = {}; }
        if (typeof eventType !== "string") {
            throw new Error("DOM driver's events() expects argument to be a " +
                "string representing the event type to listen for.");
        }
        var useCapture = determineUseCapture(eventType, options);
        var namespace = this._namespace;
        var fullScope = utils_1.getFullScope(namespace);
        var keyParts = [eventType, useCapture];
        if (fullScope) {
            keyParts.push(fullScope);
        }
        var key = keyParts.join('~');
        var domSource = this;
        var rootElement$;
        if (fullScope) {
            rootElement$ = this._rootElement$.compose(filterBasedOnIsolation(domSource, fullScope));
        }
        else {
            rootElement$ = this._rootElement$.take(2);
        }
        var event$ = rootElement$
            .map(function setupEventDelegatorOnTopElement(rootElement) {
            // Event listener just for the root element
            if (!namespace || namespace.length === 0) {
                return fromEvent_1.fromEvent(rootElement, eventType, useCapture, options.preventDefault);
            }
            // Event listener on the origin element as an EventDelegator
            var delegators = domSource._delegators;
            var origin = domSource._isolateModule.getElement(fullScope) || rootElement;
            var delegator;
            if (delegators.has(key)) {
                delegator = delegators.get(key);
                delegator.updateOrigin(origin);
            }
            else {
                delegator = new EventDelegator_1.EventDelegator(origin, eventType, useCapture, domSource._isolateModule, options.preventDefault);
                delegators.set(key, delegator);
            }
            if (fullScope) {
                domSource._isolateModule.addEventDelegator(fullScope, delegator);
            }
            var subject = delegator.createDestination(namespace);
            return subject;
        })
            .flatten();
        var out = adapt_1.adapt(event$);
        out._isCycleSource = domSource._name;
        return out;
    };
    MainDOMSource.prototype.dispose = function () {
        this._sanitation$.shamefullySendNext(null);
        this._isolateModule.reset();
    };
    return MainDOMSource;
}());
exports.MainDOMSource = MainDOMSource;

},{"./BodyDOMSource":1,"./DocumentDOMSource":2,"./ElementFinder":3,"./EventDelegator":4,"./fromEvent":9,"./isolate":12,"./utils":18,"@cycle/run/lib/adapt":24}],7:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ScopeChecker = (function () {
    function ScopeChecker(fullScope, isolateModule) {
        this.fullScope = fullScope;
        this.isolateModule = isolateModule;
    }
    /**
     * Checks whether the given element is *directly* in the scope of this
     * scope checker. Being contained *indirectly* through other scopes
     * is not valid. This is crucial for implementing parent-child isolation,
     * so that the parent selectors don't search inside a child scope.
     */
    ScopeChecker.prototype.isDirectlyInScope = function (leaf) {
        for (var el = leaf; el; el = el.parentElement) {
            var fullScope = this.isolateModule.getFullScope(el);
            if (fullScope && fullScope !== this.fullScope) {
                return false;
            }
            if (fullScope) {
                return true;
            }
        }
        return true;
    };
    return ScopeChecker;
}());
exports.ScopeChecker = ScopeChecker;

},{}],8:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vnode_1 = require("snabbdom/vnode");
var h_1 = require("snabbdom/h");
var classNameFromVNode_1 = require("snabbdom-selector/lib/commonjs/classNameFromVNode");
var selectorParser_1 = require("snabbdom-selector/lib/commonjs/selectorParser");
var utils_1 = require("./utils");
var VNodeWrapper = (function () {
    function VNodeWrapper(rootElement) {
        this.rootElement = rootElement;
    }
    VNodeWrapper.prototype.call = function (vnode) {
        if (utils_1.isDocFrag(this.rootElement)) {
            return this.wrapDocFrag(vnode === null ? [] : [vnode]);
        }
        if (vnode === null) {
            return this.wrap([]);
        }
        var _a = selectorParser_1.selectorParser(vnode), selTagName = _a.tagName, selId = _a.id;
        var vNodeClassName = classNameFromVNode_1.classNameFromVNode(vnode);
        var vNodeData = vnode.data || {};
        var vNodeDataProps = vNodeData.props || {};
        var _b = vNodeDataProps.id, vNodeId = _b === void 0 ? selId : _b;
        var isVNodeAndRootElementIdentical = typeof vNodeId === 'string' &&
            vNodeId.toUpperCase() === this.rootElement.id.toUpperCase() &&
            selTagName.toUpperCase() === this.rootElement.tagName.toUpperCase() &&
            vNodeClassName.toUpperCase() === this.rootElement.className.toUpperCase();
        if (isVNodeAndRootElementIdentical) {
            return vnode;
        }
        return this.wrap([vnode]);
    };
    VNodeWrapper.prototype.wrapDocFrag = function (children) {
        return vnode_1.vnode('', {}, children, undefined, this.rootElement);
    };
    VNodeWrapper.prototype.wrap = function (children) {
        var _a = this.rootElement, tagName = _a.tagName, id = _a.id, className = _a.className;
        var selId = id ? "#" + id : '';
        var selClass = className ? "." + className.split(" ").join(".") : '';
        return h_1.h("" + tagName.toLowerCase() + selId + selClass, {}, children);
    };
    return VNodeWrapper;
}());
exports.VNodeWrapper = VNodeWrapper;

},{"./utils":18,"snabbdom-selector/lib/commonjs/classNameFromVNode":111,"snabbdom-selector/lib/commonjs/selectorParser":112,"snabbdom/h":117,"snabbdom/vnode":128}],9:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var xstream_1 = require("xstream");
function fromEvent(element, eventName, useCapture, preventDefault) {
    if (useCapture === void 0) { useCapture = false; }
    if (preventDefault === void 0) { preventDefault = false; }
    return xstream_1.Stream.create({
        element: element,
        next: null,
        start: function start(listener) {
            if (preventDefault) {
                this.next = function next(event) {
                    event.preventDefault();
                    listener.next(event);
                };
            }
            else {
                this.next = function next(event) {
                    listener.next(event);
                };
            }
            this.element.addEventListener(eventName, this.next, useCapture);
        },
        stop: function stop() {
            this.element.removeEventListener(eventName, this.next, useCapture);
        },
    });
}
exports.fromEvent = fromEvent;

},{"xstream":140}],10:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// tslint:disable:max-file-line-count
var h_1 = require("snabbdom/h");
function isValidString(param) {
    return typeof param === 'string' && param.length > 0;
}
function isSelector(param) {
    return isValidString(param) && (param[0] === '.' || param[0] === '#');
}
function createTagFunction(tagName) {
    return function hyperscript(a, b, c) {
        var hasA = typeof a !== 'undefined';
        var hasB = typeof b !== 'undefined';
        var hasC = typeof c !== 'undefined';
        if (isSelector(a)) {
            if (hasB && hasC) {
                return h_1.h(tagName + a, b, c);
            }
            else if (hasB) {
                return h_1.h(tagName + a, b);
            }
            else {
                return h_1.h(tagName + a, {});
            }
        }
        else if (hasC) {
            return h_1.h(tagName + a, b, c);
        }
        else if (hasB) {
            return h_1.h(tagName, a, b);
        }
        else if (hasA) {
            return h_1.h(tagName, a);
        }
        else {
            return h_1.h(tagName, {});
        }
    };
}
var SVG_TAG_NAMES = [
    'a',
    'altGlyph',
    'altGlyphDef',
    'altGlyphItem',
    'animate',
    'animateColor',
    'animateMotion',
    'animateTransform',
    'circle',
    'clipPath',
    'colorProfile',
    'cursor',
    'defs',
    'desc',
    'ellipse',
    'feBlend',
    'feColorMatrix',
    'feComponentTransfer',
    'feComposite',
    'feConvolveMatrix',
    'feDiffuseLighting',
    'feDisplacementMap',
    'feDistantLight',
    'feFlood',
    'feFuncA',
    'feFuncB',
    'feFuncG',
    'feFuncR',
    'feGaussianBlur',
    'feImage',
    'feMerge',
    'feMergeNode',
    'feMorphology',
    'feOffset',
    'fePointLight',
    'feSpecularLighting',
    'feSpotlight',
    'feTile',
    'feTurbulence',
    'filter',
    'font',
    'fontFace',
    'fontFaceFormat',
    'fontFaceName',
    'fontFaceSrc',
    'fontFaceUri',
    'foreignObject',
    'g',
    'glyph',
    'glyphRef',
    'hkern',
    'image',
    'line',
    'linearGradient',
    'marker',
    'mask',
    'metadata',
    'missingGlyph',
    'mpath',
    'path',
    'pattern',
    'polygon',
    'polyline',
    'radialGradient',
    'rect',
    'script',
    'set',
    'stop',
    'style',
    'switch',
    'symbol',
    'text',
    'textPath',
    'title',
    'tref',
    'tspan',
    'use',
    'view',
    'vkern',
];
var svg = createTagFunction('svg');
SVG_TAG_NAMES.forEach(function (tag) {
    svg[tag] = createTagFunction(tag);
});
var TAG_NAMES = [
    'a',
    'abbr',
    'address',
    'area',
    'article',
    'aside',
    'audio',
    'b',
    'base',
    'bdi',
    'bdo',
    'blockquote',
    'body',
    'br',
    'button',
    'canvas',
    'caption',
    'cite',
    'code',
    'col',
    'colgroup',
    'dd',
    'del',
    'dfn',
    'dir',
    'div',
    'dl',
    'dt',
    'em',
    'embed',
    'fieldset',
    'figcaption',
    'figure',
    'footer',
    'form',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'head',
    'header',
    'hgroup',
    'hr',
    'html',
    'i',
    'iframe',
    'img',
    'input',
    'ins',
    'kbd',
    'keygen',
    'label',
    'legend',
    'li',
    'link',
    'main',
    'map',
    'mark',
    'menu',
    'meta',
    'nav',
    'noscript',
    'object',
    'ol',
    'optgroup',
    'option',
    'p',
    'param',
    'pre',
    'progress',
    'q',
    'rp',
    'rt',
    'ruby',
    's',
    'samp',
    'script',
    'section',
    'select',
    'small',
    'source',
    'span',
    'strong',
    'style',
    'sub',
    'sup',
    'table',
    'tbody',
    'td',
    'textarea',
    'tfoot',
    'th',
    'thead',
    'time',
    'title',
    'tr',
    'u',
    'ul',
    'video',
];
var exported = {
    SVG_TAG_NAMES: SVG_TAG_NAMES,
    TAG_NAMES: TAG_NAMES,
    svg: svg,
    isSelector: isSelector,
    createTagFunction: createTagFunction,
};
TAG_NAMES.forEach(function (n) {
    exported[n] = createTagFunction(n);
});
exports.default = exported;

},{"snabbdom/h":117}],11:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var thunk_1 = require("./thunk");
exports.thunk = thunk_1.thunk;
var MainDOMSource_1 = require("./MainDOMSource");
exports.MainDOMSource = MainDOMSource_1.MainDOMSource;
/**
 * A factory for the DOM driver function.
 *
 * Takes a `container` to define the target on the existing DOM which this
 * driver will operate on, and an `options` object as the second argument. The
 * input to this driver is a stream of virtual DOM objects, or in other words,
 * Snabbdom "VNode" objects. The output of this driver is a "DOMSource": a
 * collection of Observables queried with the methods `select()` and `events()`.
 *
 * `DOMSource.select(selector)` returns a new DOMSource with scope restricted to
 * the element(s) that matches the CSS `selector` given.
 *
 * `DOMSource.events(eventType, options)` returns a stream of events of
 * `eventType` happening on the elements that match the current DOMSource. The
 * event object contains the `ownerTarget` property that behaves exactly like
 * `currentTarget`. The reason for this is that some browsers doesn't allow
 * `currentTarget` property to be mutated, hence a new property is created. The
 * returned stream is an *xstream* Stream if you use `@cycle/xstream-run` to run
 * your app with this driver, or it is an RxJS Observable if you use
 * `@cycle/rxjs-run`, and so forth. The `options` parameter can have the
 * property `useCapture`, which is by default `false`, except it is `true` for
 * event types that do not bubble. Read more here
 * https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener
 * about the `useCapture` and its purpose.
 * The other option is `preventDefault` that is set to false by default.
 * If set to true, the driver will automatically call `preventDefault()` on every event.
 *
 * `DOMSource.elements()` returns a stream of the DOM element(s) matched by the
 * selectors in the DOMSource. Also, `DOMSource.select(':root').elements()`
 * returns a stream of DOM element corresponding to the root (or container) of
 * the app on the DOM.
 *
 * @param {(String|HTMLElement)} container the DOM selector for the element
 * (or the element itself) to contain the rendering of the VTrees.
 * @param {DOMDriverOptions} options an object with two optional properties:
 *
 *   - `modules: array` overrides `@cycle/dom`'s default Snabbdom modules as
 *     as defined in [`src/modules.ts`](./src/modules.ts).
 *   - `transposition: boolean` enables/disables transposition of inner streams
 *     in the virtual DOM tree.
 * @return {Function} the DOM driver function. The function expects a stream of
 * VNode as input, and outputs the DOMSource object.
 * @function makeDOMDriver
 */
var makeDOMDriver_1 = require("./makeDOMDriver");
exports.makeDOMDriver = makeDOMDriver_1.makeDOMDriver;
/**
 * A factory function to create mocked DOMSource objects, for testing purposes.
 *
 * Takes a `mockConfig` object as argument, and returns
 * a DOMSource that can be given to any Cycle.js app that expects a DOMSource in
 * the sources, for testing.
 *
 * The `mockConfig` parameter is an object specifying selectors, eventTypes and
 * their streams. Example:
 *
 * ```js
 * const domSource = mockDOMSource({
 *   '.foo': {
 *     'click': xs.of({target: {}}),
 *     'mouseover': xs.of({target: {}}),
 *   },
 *   '.bar': {
 *     'scroll': xs.of({target: {}}),
 *     elements: xs.of({tagName: 'div'}),
 *   }
 * });
 *
 * // Usage
 * const click$ = domSource.select('.foo').events('click');
 * const element$ = domSource.select('.bar').elements();
 * ```
 *
 * The mocked DOM Source supports isolation. It has the functions `isolateSink`
 * and `isolateSource` attached to it, and performs simple isolation using
 * classNames. *isolateSink* with scope `foo` will append the class `___foo` to
 * the stream of virtual DOM nodes, and *isolateSource* with scope `foo` will
 * perform a conventional `mockedDOMSource.select('.__foo')` call.
 *
 * @param {Object} mockConfig an object where keys are selector strings
 * and values are objects. Those nested objects have `eventType` strings as keys
 * and values are streams you created.
 * @return {Object} fake DOM source object, with an API containing `select()`
 * and `events()` and `elements()` which can be used just like the DOM Driver's
 * DOMSource.
 *
 * @function mockDOMSource
 */
var mockDOMSource_1 = require("./mockDOMSource");
exports.mockDOMSource = mockDOMSource_1.mockDOMSource;
exports.MockedDOMSource = mockDOMSource_1.MockedDOMSource;
/**
 * The hyperscript function `h()` is a function to create virtual DOM objects,
 * also known as VNodes. Call
 *
 * ```js
 * h('div.myClass', {style: {color: 'red'}}, [])
 * ```
 *
 * to create a VNode that represents a `DIV` element with className `myClass`,
 * styled with red color, and no children because the `[]` array was passed. The
 * API is `h(tagOrSelector, optionalData, optionalChildrenOrText)`.
 *
 * However, usually you should use "hyperscript helpers", which are shortcut
 * functions based on hyperscript. There is one hyperscript helper function for
 * each DOM tagName, such as `h1()`, `h2()`, `div()`, `span()`, `label()`,
 * `input()`. For instance, the previous example could have been written
 * as:
 *
 * ```js
 * div('.myClass', {style: {color: 'red'}}, [])
 * ```
 *
 * There are also SVG helper functions, which apply the appropriate SVG
 * namespace to the resulting elements. `svg()` function creates the top-most
 * SVG element, and `svg.g`, `svg.polygon`, `svg.circle`, `svg.path` are for
 * SVG-specific child elements. Example:
 *
 * ```js
 * svg({attrs: {width: 150, height: 150}}, [
 *   svg.polygon({
 *     attrs: {
 *       class: 'triangle',
 *       points: '20 0 20 150 150 20'
 *     }
 *   })
 * ])
 * ```
 *
 * @function h
 */
var h_1 = require("snabbdom/h");
exports.h = h_1.h;
var hyperscript_helpers_1 = require("./hyperscript-helpers");
exports.svg = hyperscript_helpers_1.default.svg;
exports.a = hyperscript_helpers_1.default.a;
exports.abbr = hyperscript_helpers_1.default.abbr;
exports.address = hyperscript_helpers_1.default.address;
exports.area = hyperscript_helpers_1.default.area;
exports.article = hyperscript_helpers_1.default.article;
exports.aside = hyperscript_helpers_1.default.aside;
exports.audio = hyperscript_helpers_1.default.audio;
exports.b = hyperscript_helpers_1.default.b;
exports.base = hyperscript_helpers_1.default.base;
exports.bdi = hyperscript_helpers_1.default.bdi;
exports.bdo = hyperscript_helpers_1.default.bdo;
exports.blockquote = hyperscript_helpers_1.default.blockquote;
exports.body = hyperscript_helpers_1.default.body;
exports.br = hyperscript_helpers_1.default.br;
exports.button = hyperscript_helpers_1.default.button;
exports.canvas = hyperscript_helpers_1.default.canvas;
exports.caption = hyperscript_helpers_1.default.caption;
exports.cite = hyperscript_helpers_1.default.cite;
exports.code = hyperscript_helpers_1.default.code;
exports.col = hyperscript_helpers_1.default.col;
exports.colgroup = hyperscript_helpers_1.default.colgroup;
exports.dd = hyperscript_helpers_1.default.dd;
exports.del = hyperscript_helpers_1.default.del;
exports.dfn = hyperscript_helpers_1.default.dfn;
exports.dir = hyperscript_helpers_1.default.dir;
exports.div = hyperscript_helpers_1.default.div;
exports.dl = hyperscript_helpers_1.default.dl;
exports.dt = hyperscript_helpers_1.default.dt;
exports.em = hyperscript_helpers_1.default.em;
exports.embed = hyperscript_helpers_1.default.embed;
exports.fieldset = hyperscript_helpers_1.default.fieldset;
exports.figcaption = hyperscript_helpers_1.default.figcaption;
exports.figure = hyperscript_helpers_1.default.figure;
exports.footer = hyperscript_helpers_1.default.footer;
exports.form = hyperscript_helpers_1.default.form;
exports.h1 = hyperscript_helpers_1.default.h1;
exports.h2 = hyperscript_helpers_1.default.h2;
exports.h3 = hyperscript_helpers_1.default.h3;
exports.h4 = hyperscript_helpers_1.default.h4;
exports.h5 = hyperscript_helpers_1.default.h5;
exports.h6 = hyperscript_helpers_1.default.h6;
exports.head = hyperscript_helpers_1.default.head;
exports.header = hyperscript_helpers_1.default.header;
exports.hgroup = hyperscript_helpers_1.default.hgroup;
exports.hr = hyperscript_helpers_1.default.hr;
exports.html = hyperscript_helpers_1.default.html;
exports.i = hyperscript_helpers_1.default.i;
exports.iframe = hyperscript_helpers_1.default.iframe;
exports.img = hyperscript_helpers_1.default.img;
exports.input = hyperscript_helpers_1.default.input;
exports.ins = hyperscript_helpers_1.default.ins;
exports.kbd = hyperscript_helpers_1.default.kbd;
exports.keygen = hyperscript_helpers_1.default.keygen;
exports.label = hyperscript_helpers_1.default.label;
exports.legend = hyperscript_helpers_1.default.legend;
exports.li = hyperscript_helpers_1.default.li;
exports.link = hyperscript_helpers_1.default.link;
exports.main = hyperscript_helpers_1.default.main;
exports.map = hyperscript_helpers_1.default.map;
exports.mark = hyperscript_helpers_1.default.mark;
exports.menu = hyperscript_helpers_1.default.menu;
exports.meta = hyperscript_helpers_1.default.meta;
exports.nav = hyperscript_helpers_1.default.nav;
exports.noscript = hyperscript_helpers_1.default.noscript;
exports.object = hyperscript_helpers_1.default.object;
exports.ol = hyperscript_helpers_1.default.ol;
exports.optgroup = hyperscript_helpers_1.default.optgroup;
exports.option = hyperscript_helpers_1.default.option;
exports.p = hyperscript_helpers_1.default.p;
exports.param = hyperscript_helpers_1.default.param;
exports.pre = hyperscript_helpers_1.default.pre;
exports.progress = hyperscript_helpers_1.default.progress;
exports.q = hyperscript_helpers_1.default.q;
exports.rp = hyperscript_helpers_1.default.rp;
exports.rt = hyperscript_helpers_1.default.rt;
exports.ruby = hyperscript_helpers_1.default.ruby;
exports.s = hyperscript_helpers_1.default.s;
exports.samp = hyperscript_helpers_1.default.samp;
exports.script = hyperscript_helpers_1.default.script;
exports.section = hyperscript_helpers_1.default.section;
exports.select = hyperscript_helpers_1.default.select;
exports.small = hyperscript_helpers_1.default.small;
exports.source = hyperscript_helpers_1.default.source;
exports.span = hyperscript_helpers_1.default.span;
exports.strong = hyperscript_helpers_1.default.strong;
exports.style = hyperscript_helpers_1.default.style;
exports.sub = hyperscript_helpers_1.default.sub;
exports.sup = hyperscript_helpers_1.default.sup;
exports.table = hyperscript_helpers_1.default.table;
exports.tbody = hyperscript_helpers_1.default.tbody;
exports.td = hyperscript_helpers_1.default.td;
exports.textarea = hyperscript_helpers_1.default.textarea;
exports.tfoot = hyperscript_helpers_1.default.tfoot;
exports.th = hyperscript_helpers_1.default.th;
exports.thead = hyperscript_helpers_1.default.thead;
exports.title = hyperscript_helpers_1.default.title;
exports.tr = hyperscript_helpers_1.default.tr;
exports.u = hyperscript_helpers_1.default.u;
exports.ul = hyperscript_helpers_1.default.ul;
exports.video = hyperscript_helpers_1.default.video;

},{"./MainDOMSource":6,"./hyperscript-helpers":10,"./makeDOMDriver":13,"./mockDOMSource":15,"./thunk":17,"snabbdom/h":117}],12:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vnode_1 = require("snabbdom/vnode");
var utils_1 = require("./utils");
function totalIsolateSource(source, scope) {
    return source.select(utils_1.SCOPE_PREFIX + scope);
}
function siblingIsolateSource(source, scope) {
    return source.select(scope);
}
function isolateSource(source, scope) {
    if (scope === ':root') {
        return source;
    }
    else if (utils_1.isClassOrId(scope)) {
        return siblingIsolateSource(source, scope);
    }
    else {
        return totalIsolateSource(source, scope);
    }
}
exports.isolateSource = isolateSource;
function siblingIsolateSink(sink, scope) {
    return sink.map(function (node) {
        return node
            ? vnode_1.vnode(node.sel + scope, node.data, node.children, node.text, node.elm)
            : node;
    });
}
exports.siblingIsolateSink = siblingIsolateSink;
function totalIsolateSink(sink, fullScope) {
    return sink.map(function (node) {
        if (!node) {
            return node;
        }
        // Ignore if already had up-to-date full scope in vnode.data.isolate
        if (node.data && node.data.isolate) {
            var isolateData = node.data.isolate;
            var prevFullScopeNum = isolateData.replace(/(cycle|\-)/g, '');
            var fullScopeNum = fullScope.replace(/(cycle|\-)/g, '');
            if (isNaN(parseInt(prevFullScopeNum)) ||
                isNaN(parseInt(fullScopeNum)) ||
                prevFullScopeNum > fullScopeNum) {
                // > is lexicographic string comparison
                return node;
            }
        }
        // Insert up-to-date full scope in vnode.data.isolate, and also a key if needed
        node.data = node.data || {};
        node.data.isolate = fullScope;
        if (typeof node.key === 'undefined') {
            node.key = utils_1.SCOPE_PREFIX + fullScope;
        }
        return node;
    });
}
exports.totalIsolateSink = totalIsolateSink;

},{"./utils":18,"snabbdom/vnode":128}],13:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var snabbdom_1 = require("snabbdom");
var xstream_1 = require("xstream");
var MainDOMSource_1 = require("./MainDOMSource");
var tovnode_1 = require("snabbdom/tovnode");
var VNodeWrapper_1 = require("./VNodeWrapper");
var utils_1 = require("./utils");
var modules_1 = require("./modules");
var IsolateModule_1 = require("./IsolateModule");
var MapPolyfill = require("es6-map");
function makeDOMDriverInputGuard(modules) {
    if (!Array.isArray(modules)) {
        throw new Error("Optional modules option must be " + "an array for snabbdom modules");
    }
}
function domDriverInputGuard(view$) {
    if (!view$ ||
        typeof view$.addListener !== "function" ||
        typeof view$.fold !== "function") {
        throw new Error("The DOM driver function expects as input a Stream of " +
            "virtual DOM elements");
    }
}
function dropCompletion(input) {
    return xstream_1.default.merge(input, xstream_1.default.never());
}
function unwrapElementFromVNode(vnode) {
    return vnode.elm;
}
function reportSnabbdomError(err) {
    (console.error || console.log)(err);
}
function makeDOMDriver(container, options) {
    if (!options) {
        options = {};
    }
    var modules = options.modules || modules_1.default;
    var isolateModule = new IsolateModule_1.IsolateModule();
    var patch = snabbdom_1.init([isolateModule.createModule()].concat(modules));
    var rootElement = utils_1.getValidNode(container) || document.body;
    var vnodeWrapper = new VNodeWrapper_1.VNodeWrapper(rootElement);
    var delegators = new MapPolyfill();
    makeDOMDriverInputGuard(modules);
    function DOMDriver(vnode$, name) {
        if (name === void 0) { name = 'DOM'; }
        domDriverInputGuard(vnode$);
        var sanitation$ = xstream_1.default.create();
        var rootElement$ = xstream_1.default
            .merge(vnode$.endWhen(sanitation$), sanitation$)
            .map(function (vnode) { return vnodeWrapper.call(vnode); })
            .fold(patch, tovnode_1.toVNode(rootElement))
            .drop(1)
            .map(unwrapElementFromVNode)
            .compose(dropCompletion) // don't complete this stream
            .startWith(rootElement);
        // Start the snabbdom patching, over time
        var listener = { error: reportSnabbdomError };
        if (document.readyState === 'loading') {
            document.addEventListener('readystatechange', function () {
                if (document.readyState === 'interactive') {
                    rootElement$.addListener(listener);
                }
            });
        }
        else {
            rootElement$.addListener(listener);
        }
        return new MainDOMSource_1.MainDOMSource(rootElement$, sanitation$, [], isolateModule, delegators, name);
    }
    return DOMDriver;
}
exports.makeDOMDriver = makeDOMDriver;

},{"./IsolateModule":5,"./MainDOMSource":6,"./VNodeWrapper":8,"./modules":16,"./utils":18,"es6-map":87,"snabbdom":125,"snabbdom/tovnode":127,"xstream":140}],14:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function createMatchesSelector() {
    var vendor;
    try {
        var proto = Element.prototype;
        vendor =
            proto.matches ||
                proto.matchesSelector ||
                proto.webkitMatchesSelector ||
                proto.mozMatchesSelector ||
                proto.msMatchesSelector ||
                proto.oMatchesSelector;
    }
    catch (err) {
        vendor = null;
    }
    return function match(elem, selector) {
        if (selector.length === 0) {
            return true;
        }
        if (vendor) {
            return vendor.call(elem, selector);
        }
        var nodes = elem.parentNode.querySelectorAll(selector);
        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i] === elem) {
                return true;
            }
        }
        return false;
    };
}
exports.matchesSelector = createMatchesSelector();

},{}],15:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var xstream_1 = require("xstream");
var adapt_1 = require("@cycle/run/lib/adapt");
var SCOPE_PREFIX = '___';
var MockedDOMSource = (function () {
    function MockedDOMSource(_mockConfig) {
        this._mockConfig = _mockConfig;
        if (_mockConfig['elements']) {
            this._elements = _mockConfig['elements'];
        }
        else {
            this._elements = adapt_1.adapt(xstream_1.default.empty());
        }
    }
    MockedDOMSource.prototype.elements = function () {
        var out = this
            ._elements;
        out._isCycleSource = 'MockedDOM';
        return out;
    };
    MockedDOMSource.prototype.events = function (eventType, options) {
        var streamForEventType = this._mockConfig[eventType];
        var out = adapt_1.adapt(streamForEventType || xstream_1.default.empty());
        out._isCycleSource = 'MockedDOM';
        return out;
    };
    MockedDOMSource.prototype.select = function (selector) {
        var mockConfigForSelector = this._mockConfig[selector] || {};
        return new MockedDOMSource(mockConfigForSelector);
    };
    MockedDOMSource.prototype.isolateSource = function (source, scope) {
        return source.select('.' + SCOPE_PREFIX + scope);
    };
    MockedDOMSource.prototype.isolateSink = function (sink, scope) {
        return sink.map(function (vnode) {
            if (vnode.sel && vnode.sel.indexOf(SCOPE_PREFIX + scope) !== -1) {
                return vnode;
            }
            else {
                vnode.sel += "." + SCOPE_PREFIX + scope;
                return vnode;
            }
        });
    };
    return MockedDOMSource;
}());
exports.MockedDOMSource = MockedDOMSource;
function mockDOMSource(mockConfig) {
    return new MockedDOMSource(mockConfig);
}
exports.mockDOMSource = mockDOMSource;

},{"@cycle/run/lib/adapt":24,"xstream":140}],16:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var class_1 = require("snabbdom/modules/class");
exports.ClassModule = class_1.default;
var props_1 = require("snabbdom/modules/props");
exports.PropsModule = props_1.default;
var attributes_1 = require("snabbdom/modules/attributes");
exports.AttrsModule = attributes_1.default;
var style_1 = require("snabbdom/modules/style");
exports.StyleModule = style_1.default;
var dataset_1 = require("snabbdom/modules/dataset");
exports.DatasetModule = dataset_1.default;
var modules = [
    style_1.default,
    class_1.default,
    props_1.default,
    attributes_1.default,
    dataset_1.default,
];
exports.default = modules;

},{"snabbdom/modules/attributes":120,"snabbdom/modules/class":121,"snabbdom/modules/dataset":122,"snabbdom/modules/props":123,"snabbdom/modules/style":124}],17:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var h_1 = require("snabbdom/h");
function copyToThunk(vnode, thunkVNode) {
    thunkVNode.elm = vnode.elm;
    vnode.data.fn = thunkVNode.data.fn;
    vnode.data.args = thunkVNode.data.args;
    vnode.data.isolate = thunkVNode.data.isolate;
    thunkVNode.data = vnode.data;
    thunkVNode.children = vnode.children;
    thunkVNode.text = vnode.text;
    thunkVNode.elm = vnode.elm;
}
function init(thunkVNode) {
    var cur = thunkVNode.data;
    var vnode = cur.fn.apply(undefined, cur.args);
    copyToThunk(vnode, thunkVNode);
}
function prepatch(oldVnode, thunkVNode) {
    var old = oldVnode.data, cur = thunkVNode.data;
    var i;
    var oldArgs = old.args, args = cur.args;
    if (old.fn !== cur.fn || oldArgs.length !== args.length) {
        copyToThunk(cur.fn.apply(undefined, args), thunkVNode);
    }
    for (i = 0; i < args.length; ++i) {
        if (oldArgs[i] !== args[i]) {
            copyToThunk(cur.fn.apply(undefined, args), thunkVNode);
            return;
        }
    }
    copyToThunk(oldVnode, thunkVNode);
}
function thunk(sel, key, fn, args) {
    if (args === undefined) {
        args = fn;
        fn = key;
        key = undefined;
    }
    return h_1.h(sel, {
        key: key,
        hook: { init: init, prepatch: prepatch },
        fn: fn,
        args: args,
    });
}
exports.thunk = thunk;
exports.default = thunk;

},{"snabbdom/h":117}],18:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isValidNode(obj) {
    var ELEM_TYPE = 1;
    var FRAG_TYPE = 11;
    return typeof HTMLElement === 'object'
        ? obj instanceof HTMLElement || obj instanceof DocumentFragment
        : obj &&
            typeof obj === 'object' &&
            obj !== null &&
            (obj.nodeType === ELEM_TYPE || obj.nodeType === FRAG_TYPE) &&
            typeof obj.nodeName === 'string';
}
function isClassOrId(str) {
    return str.length > 1 && (str[0] === '.' || str[0] === '#');
}
exports.isClassOrId = isClassOrId;
function isDocFrag(el) {
    return el.nodeType === 11;
}
exports.isDocFrag = isDocFrag;
exports.SCOPE_PREFIX = '$$CYCLEDOM$$-';
function getValidNode(selectors) {
    var domElement = typeof selectors === 'string'
        ? document.querySelector(selectors)
        : selectors;
    if (typeof selectors === 'string' && domElement === null) {
        throw new Error("Cannot render into unknown element `" + selectors + "`");
    }
    else if (!isValidNode(domElement)) {
        throw new Error('Given container is not a DOM element neither a ' + 'selector string.');
    }
    return domElement;
}
exports.getValidNode = getValidNode;
/**
 * The full scope of a namespace is the "absolute path" of scopes from
 * parent to child. This is extracted from the namespace, filter only for
 * scopes in the namespace.
 */
function getFullScope(namespace) {
    return namespace
        .filter(function (c) { return c.indexOf(exports.SCOPE_PREFIX) > -1; })
        .map(function (c) { return c.replace(exports.SCOPE_PREFIX, ''); })
        .join('-');
}
exports.getFullScope = getFullScope;
function getSelectors(namespace) {
    return namespace.filter(function (c) { return c.indexOf(exports.SCOPE_PREFIX) === -1; }).join(' ');
}
exports.getSelectors = getSelectors;

},{}],19:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var xstream_1 = require("xstream");
var CLICK_EVENT = typeof document !== 'undefined' && document.ontouchstart
    ? 'touchstart'
    : 'click';
function which(ev) {
    if (typeof window === 'undefined') {
        return false;
    }
    var e = ev || window.event;
    return e.which === null ? e.button : e.which;
}
function sameOrigin(href) {
    if (typeof window === 'undefined') {
        return false;
    }
    return href && href.indexOf(window.location.origin) === 0;
}
function makeClickListener(push) {
    return function clickListener(event) {
        if (which(event) !== 1) {
            return;
        }
        if (event.metaKey || event.ctrlKey || event.shiftKey) {
            return;
        }
        if (event.defaultPrevented) {
            return;
        }
        var element = event.target;
        while (element && element.nodeName !== 'A') {
            element = element.parentNode;
        }
        if (!element || element.nodeName !== 'A') {
            return;
        }
        if (element.hasAttribute('download') ||
            element.getAttribute('rel') === 'external') {
            return;
        }
        if (element.target) {
            return;
        }
        var link = element.getAttribute('href');
        if ((link && link.indexOf('mailto:') > -1) || link.charAt(0) === '#') {
            return;
        }
        if (!sameOrigin(element.href)) {
            return;
        }
        event.preventDefault();
        var pathname = element.pathname, search = element.search, _a = element.hash, hash = _a === void 0 ? '' : _a;
        push(pathname + search + hash);
    };
}
function captureAnchorClicks(push) {
    var listener = makeClickListener(push);
    if (typeof window !== 'undefined') {
        document.addEventListener(CLICK_EVENT, listener, false);
    }
}
function captureClicks(historyDriver) {
    return function historyDriverWithClickCapture(sink$) {
        var internalSink$ = xstream_1.default.create();
        captureAnchorClicks(function (pathname) {
            internalSink$._n({ type: 'push', pathname: pathname });
        });
        sink$._add(internalSink$);
        return historyDriver(internalSink$);
    };
}
exports.captureClicks = captureClicks;

},{"xstream":140}],20:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var xstream_1 = require("xstream");
function createHistory$(history, sink$) {
    var history$ = xstream_1.default.createWithMemory().startWith(history.location);
    var call = makeCallOnHistory(history);
    var unlisten = history.listen(function (loc) {
        history$._n(loc);
    });
    var sub = sink$.subscribe(createObserver(call, unlisten));
    history$.dispose = function () {
        sub.unsubscribe();
        unlisten();
    };
    return history$;
}
exports.createHistory$ = createHistory$;
function makeCallOnHistory(history) {
    return function call(input) {
        if (input.type === 'push') {
            history.push(input.pathname, input.state);
        }
        if (input.type === 'replace') {
            history.replace(input.pathname, input.state);
        }
        if (input.type === 'go') {
            history.go(input.amount);
        }
        if (input.type === 'goBack') {
            history.goBack();
        }
        if (input.type === 'goForward') {
            history.goForward();
        }
    };
}
function createObserver(call, unlisten) {
    return {
        next: function (input) {
            if (typeof input === 'string') {
                call({ type: 'push', pathname: input });
            }
            else {
                call(input);
            }
        },
        error: function (err) {
            unlisten();
        },
        complete: function () {
            setTimeout(unlisten);
        },
    };
}

},{"xstream":140}],21:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var history_1 = require("history");
var createHistory_1 = require("./createHistory$");
function isHistory(x) {
    return !!x.createHref;
}
function makeHistoryDriver(options) {
    var history;
    if (options && isHistory(options)) {
        history = options;
    }
    else {
        history = history_1.createBrowserHistory(options);
    }
    return function historyDriver(sink$) {
        return createHistory_1.createHistory$(history, sink$);
    };
}
exports.makeHistoryDriver = makeHistoryDriver;
function makeServerHistoryDriver(options) {
    var history = history_1.createMemoryHistory(options);
    return function serverHistoryDriver(sink$) {
        return createHistory_1.createHistory$(history, sink$);
    };
}
exports.makeServerHistoryDriver = makeServerHistoryDriver;
function makeHashHistoryDriver(options) {
    var history = history_1.createHashHistory(options);
    return function hashHistoryDriver(sink$) {
        return createHistory_1.createHistory$(history, sink$);
    };
}
exports.makeHashHistoryDriver = makeHashHistoryDriver;

},{"./createHistory$":20,"history":107}],22:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Create a History Driver to be used in the browser.
 *
 * This is a function which, when called, returns a History Driver for Cycle.js
 * apps. The driver is also a function, and it takes a stream of new locations
 * (strings representing pathnames or location objects) as input, and outputs
 * another stream of locations that were applied. Example:
 *
 * ```js
 * import {run} from '@cycle/run';
 * import {makeHistoryDriver} from '@cycle/history';
 *
 * function main(sources){
 *   return {
 *     // updates the browser URL every 500ms
 *     history: xs.periodic(500).map(i => `url-${i}`)
 *   };
 * }
 *
 * const drivers = {
 *   history: makeHistoryDriver()
 * };
 *
 * run(main, drivers);
 * ```
 *
 * @param {object|History|MemoryHistory} options an object with some options specific to
 * this driver. These options are the same as for the corresponding
 * `createBrowserHistory()` function in History v4. Check its
 * [docs](https://github.com/mjackson/history/tree/v4.5.1#usage) for a good
 * description on the options. Alternatively, a History object can also be sent
 * in case the external consumer needs direct access to any of the direct History
 * methods
 * @return {Function} the History Driver function
 * @function makeHistoryDriver
 */
var drivers_1 = require("./drivers");
exports.makeHistoryDriver = drivers_1.makeHistoryDriver;
/**
 * Create a History Driver for older browsers using hash routing.
 *
 * This is a function which, when called, returns a History Driver for Cycle.js
 * apps. The driver is also a function, and it takes a stream of new locations
 * (strings representing pathnames or location objects) as input, and outputs
 * another stream of locations that were applied.
 *
 * @param {object} options an object with some options specific to
 * this driver. These options are the same as for the corresponding
 * `createHashHistory()` function in History v4. Check its
 * [docs](https://github.com/mjackson/history/tree/v4.5.1#usage) for a good
 * description on the options.
 * @return {Function} the History Driver function
 * @function makeHashHistoryDriver
 */
var drivers_2 = require("./drivers");
exports.makeHashHistoryDriver = drivers_2.makeHashHistoryDriver;
/**
 * Wraps a History Driver to add "click capturing" functionality.
 *
 * If you want to intercept and handle any click event that leads to a link,
 * like on an `<a>` element, you pass your existing driver (e.g. created from
 * `makeHistoryDriver()`) as argument and this function will return another
 * driver of the same nature, but including click capturing logic. Example:
 *
 * ```js
 * import {captureClicks, makeHistoryDriver} from '@cycle/history';
 *
 * const drivers = {
 *   history: captureClicks(makeHistoryDriver())
 * };
 * ```
 *
 * @param {Function} driver an existing History Driver function.
 * @return {Function} a History Driver function
 * @function captureClicks
 */
var captureClicks_1 = require("./captureClicks");
exports.captureClicks = captureClicks_1.captureClicks;
/**
 * Create a History Driver to be used in non-browser enviroments such as
 * server-side Node.js.
 *
 * This is a function which, when called, returns a History Driver for Cycle.js
 * apps. The driver is also a function, and it takes a stream of new locations
 * (strings representing pathnames or location objects) as input, and outputs
 * another stream of locations that were applied.
 *
 * @param {object} options an object with some options specific to
 * this driver. These options are the same as for the corresponding
 * `createMemoryHistory()` function in History v4. Check its
 * [docs](https://github.com/mjackson/history/tree/v4.5.1#usage) for a good
 * description on the options.
 * @return {Function} the History Driver function
 * @function makeServerHistoryDriver
 */
var drivers_3 = require("./drivers");
exports.makeServerHistoryDriver = drivers_3.makeServerHistoryDriver;

},{"./captureClicks":19,"./drivers":21}],23:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function checkIsolateArgs(dataflowComponent, scope) {
    if (typeof dataflowComponent !== "function") {
        throw new Error("First argument given to isolate() must be a " +
            "'dataflowComponent' function");
    }
    if (scope === null) {
        throw new Error("Second argument given to isolate() must not be null");
    }
}
function normalizeScopes(sources, scopes, randomScope) {
    var perChannel = {};
    Object.keys(sources).forEach(function (channel) {
        if (typeof scopes === 'string') {
            perChannel[channel] = scopes;
            return;
        }
        var candidate = scopes[channel];
        if (typeof candidate !== 'undefined') {
            perChannel[channel] = candidate;
            return;
        }
        var wildcard = scopes['*'];
        if (typeof wildcard !== 'undefined') {
            perChannel[channel] = wildcard;
            return;
        }
        perChannel[channel] = randomScope;
    });
    return perChannel;
}
function isolateAllSources(outerSources, scopes) {
    var innerSources = {};
    for (var channel in outerSources) {
        var outerSource = outerSources[channel];
        if (outerSources.hasOwnProperty(channel) &&
            outerSource &&
            scopes[channel] !== null &&
            typeof outerSource.isolateSource === 'function') {
            innerSources[channel] = outerSource.isolateSource(outerSource, scopes[channel]);
        }
        else if (outerSources.hasOwnProperty(channel)) {
            innerSources[channel] = outerSources[channel];
        }
    }
    return innerSources;
}
function isolateAllSinks(sources, innerSinks, scopes) {
    var outerSinks = {};
    for (var channel in innerSinks) {
        var source = sources[channel];
        var innerSink = innerSinks[channel];
        if (innerSinks.hasOwnProperty(channel) &&
            source &&
            scopes[channel] !== null &&
            typeof source.isolateSink === 'function') {
            outerSinks[channel] = source.isolateSink(innerSink, scopes[channel]);
        }
        else if (innerSinks.hasOwnProperty(channel)) {
            outerSinks[channel] = innerSinks[channel];
        }
    }
    return outerSinks;
}
var counter = 0;
function newScope() {
    return "cycle" + ++counter;
}
/**
 * Takes a `component` function and a `scope`, and returns an isolated version
 * of the `component` function.
 *
 * When the isolated component is invoked, each source provided to it is
 * isolated to the given `scope` using `source.isolateSource(source, scope)`,
 * if possible. Likewise, the sinks returned from the isolated component are
 * isolated to the given `scope` using `source.isolateSink(sink, scope)`.
 *
 * The `scope` can be a string or an object. If it is anything else than those
 * two types, it will be converted to a string. If `scope` is an object, it
 * represents "scopes per channel", allowing you to specify a different scope
 * for each key of sources/sinks. For instance
 *
 * ```js
 * const childSinks = isolate(Child, {DOM: 'foo', HTTP: 'bar'})(sources);
 * ```
 *
 * You can also use a wildcard `'*'` to use as a default for source/sinks
 * channels that did not receive a specific scope:
 *
 * ```js
 * // Uses 'bar' as the isolation scope for HTTP and other channels
 * const childSinks = isolate(Child, {DOM: 'foo', '*': 'bar'})(sources);
 * ```
 *
 * If a channel's value is null, then that channel's sources and sinks won't be
 * isolated. If the wildcard is null and some channels are unspecified, those
 * channels won't be isolated. If you don't have a wildcard and some channels
 * are unspecified, then `isolate` will generate a random scope.
 *
 * ```js
 * // Does not isolate HTTP requests
 * const childSinks = isolate(Child, {DOM: 'foo', HTTP: null})(sources);
 * ```
 *
 * If the `scope` argument is not provided at all, a new scope will be
 * automatically created. This means that while **`isolate(component, scope)` is
 * pure** (referentially transparent), **`isolate(component)` is impure** (not
 * referentially transparent). Two calls to `isolate(Foo, bar)` will generate
 * the same component. But, two calls to `isolate(Foo)` will generate two
 * distinct components.
 *
 * ```js
 * // Uses some arbitrary string as the isolation scope for HTTP and other channels
 * const childSinks = isolate(Child, {DOM: 'foo'})(sources);
 * ```
 *
 * Note that both `isolateSource()` and `isolateSink()` are static members of
 * `source`. The reason for this is that drivers produce `source` while the
 * application produces `sink`, and it's the driver's responsibility to
 * implement `isolateSource()` and `isolateSink()`.
 *
 * @param {Function} component a function that takes `sources` as input
 * and outputs a collection of `sinks`.
 * @param {String} scope an optional string that is used to isolate each
 * `sources` and `sinks` when the returned scoped component is invoked.
 * @return {Function} the scoped component function that, as the original
 * `component` function, takes `sources` and returns `sinks`.
 * @function isolate
 */
function isolate(component, scope) {
    if (scope === void 0) { scope = newScope(); }
    checkIsolateArgs(component, scope);
    var randomScope = typeof scope === 'object' ? newScope() : '';
    var scopes = typeof scope === 'string' || typeof scope === 'object'
        ? scope
        : scope.toString();
    return function wrappedComponent(outerSources) {
        var rest = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            rest[_i - 1] = arguments[_i];
        }
        var scopesPerChannel = normalizeScopes(outerSources, scopes, randomScope);
        var innerSources = isolateAllSources(outerSources, scopesPerChannel);
        var innerSinks = component.apply(void 0, [innerSources].concat(rest));
        var outerSinks = isolateAllSinks(outerSources, innerSinks, scopesPerChannel);
        return outerSinks;
    };
}
isolate.reset = function () { return (counter = 0); };
exports.default = isolate;

},{}],24:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var adaptStream = function (x) { return x; };
function setAdapt(f) {
    adaptStream = f;
}
exports.setAdapt = setAdapt;
function adapt(stream) {
    return adaptStream(stream);
}
exports.adapt = adapt;

},{}],25:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var xstream_1 = require("xstream");
var adapt_1 = require("./adapt");
function logToConsoleError(err) {
    var target = err.stack || err;
    if (console && console.error) {
        console.error(target);
    }
    else if (console && console.log) {
        console.log(target);
    }
}
function makeSinkProxies(drivers) {
    var sinkProxies = {};
    for (var name_1 in drivers) {
        if (drivers.hasOwnProperty(name_1)) {
            sinkProxies[name_1] = xstream_1.default.createWithMemory();
        }
    }
    return sinkProxies;
}
function callDrivers(drivers, sinkProxies) {
    var sources = {};
    for (var name_2 in drivers) {
        if (drivers.hasOwnProperty(name_2)) {
            sources[name_2] = drivers[name_2](sinkProxies[name_2], name_2);
            if (sources[name_2] && typeof sources[name_2] === 'object') {
                sources[name_2]._isCycleSource = name_2;
            }
        }
    }
    return sources;
}
// NOTE: this will mutate `sources`.
function adaptSources(sources) {
    for (var name_3 in sources) {
        if (sources.hasOwnProperty(name_3) &&
            sources[name_3] &&
            typeof sources[name_3]['shamefullySendNext'] === 'function') {
            sources[name_3] = adapt_1.adapt(sources[name_3]);
        }
    }
    return sources;
}
function replicateMany(sinks, sinkProxies) {
    var sinkNames = Object.keys(sinks).filter(function (name) { return !!sinkProxies[name]; });
    var buffers = {};
    var replicators = {};
    sinkNames.forEach(function (name) {
        buffers[name] = { _n: [], _e: [] };
        replicators[name] = {
            next: function (x) { return buffers[name]._n.push(x); },
            error: function (err) { return buffers[name]._e.push(err); },
            complete: function () { },
        };
    });
    var subscriptions = sinkNames.map(function (name) {
        return xstream_1.default.fromObservable(sinks[name]).subscribe(replicators[name]);
    });
    sinkNames.forEach(function (name) {
        var listener = sinkProxies[name];
        var next = function (x) {
            listener._n(x);
        };
        var error = function (err) {
            logToConsoleError(err);
            listener._e(err);
        };
        buffers[name]._n.forEach(next);
        buffers[name]._e.forEach(error);
        replicators[name].next = next;
        replicators[name].error = error;
        // because sink.subscribe(replicator) had mutated replicator to add
        // _n, _e, _c, we must also update these:
        replicators[name]._n = next;
        replicators[name]._e = error;
    });
    buffers = null; // free up for GC
    return function disposeReplication() {
        subscriptions.forEach(function (s) { return s.unsubscribe(); });
        sinkNames.forEach(function (name) { return sinkProxies[name]._c(); });
    };
}
function disposeSources(sources) {
    for (var k in sources) {
        if (sources.hasOwnProperty(k) &&
            sources[k] &&
            sources[k].dispose) {
            sources[k].dispose();
        }
    }
}
function isObjectEmpty(obj) {
    return Object.keys(obj).length === 0;
}
/**
 * A function that prepares the Cycle application to be executed. Takes a `main`
 * function and prepares to circularly connects it to the given collection of
 * driver functions. As an output, `setup()` returns an object with three
 * properties: `sources`, `sinks` and `run`. Only when `run()` is called will
 * the application actually execute. Refer to the documentation of `run()` for
 * more details.
 *
 * **Example:**
 * ```js
 * import {setup} from '@cycle/run';
 * const {sources, sinks, run} = setup(main, drivers);
 * // ...
 * const dispose = run(); // Executes the application
 * // ...
 * dispose();
 * ```
 *
 * @param {Function} main a function that takes `sources` as input and outputs
 * `sinks`.
 * @param {Object} drivers an object where keys are driver names and values
 * are driver functions.
 * @return {Object} an object with three properties: `sources`, `sinks` and
 * `run`. `sources` is the collection of driver sources, `sinks` is the
 * collection of driver sinks, these can be used for debugging or testing. `run`
 * is the function that once called will execute the application.
 * @function setup
 */
function setup(main, drivers) {
    if (typeof main !== "function") {
        throw new Error("First argument given to Cycle must be the 'main' " + "function.");
    }
    if (typeof drivers !== "object" || drivers === null) {
        throw new Error("Second argument given to Cycle must be an object " +
            "with driver functions as properties.");
    }
    if (isObjectEmpty(drivers)) {
        throw new Error("Second argument given to Cycle must be an object " +
            "with at least one driver function declared as a property.");
    }
    var sinkProxies = makeSinkProxies(drivers);
    var sources = callDrivers(drivers, sinkProxies);
    var adaptedSources = adaptSources(sources);
    var sinks = main(adaptedSources);
    if (typeof window !== 'undefined') {
        window.Cyclejs = window.Cyclejs || {};
        window.Cyclejs.sinks = sinks;
    }
    function _run() {
        var disposeReplication = replicateMany(sinks, sinkProxies);
        return function dispose() {
            disposeSources(sources);
            disposeReplication();
        };
    }
    return { sinks: sinks, sources: sources, run: _run };
}
exports.setup = setup;
/**
 * Takes a `main` function and circularly connects it to the given collection
 * of driver functions.
 *
 * **Example:**
 * ```js
 * import run from '@cycle/run';
 * const dispose = run(main, drivers);
 * // ...
 * dispose();
 * ```
 *
 * The `main` function expects a collection of "source" streams (returned from
 * drivers) as input, and should return a collection of "sink" streams (to be
 * given to drivers). A "collection of streams" is a JavaScript object where
 * keys match the driver names registered by the `drivers` object, and values
 * are the streams. Refer to the documentation of each driver to see more
 * details on what types of sources it outputs and sinks it receives.
 *
 * @param {Function} main a function that takes `sources` as input and outputs
 * `sinks`.
 * @param {Object} drivers an object where keys are driver names and values
 * are driver functions.
 * @return {Function} a dispose function, used to terminate the execution of the
 * Cycle.js program, cleaning up resources used.
 * @function run
 */
function run(main, drivers) {
    var program = setup(main, drivers);
    if (typeof window !== 'undefined' &&
        window['CyclejsDevTool_startGraphSerializer']) {
        window['CyclejsDevTool_startGraphSerializer'](program.sinks);
    }
    return program.run();
}
exports.run = run;
exports.default = run;

},{"./adapt":24,"xstream":140}],26:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var writeToStore_1 = require("./writeToStore");
var responseCollection_1 = require("./responseCollection");
/**
 * Storage Driver.
 *
 * This is a localStorage and sessionStorage Driver for Cycle.js apps. The
 * driver is also a function, and it takes a stream of requests as input, and
 * returns a **`responseCollection`** with functions that allow reading from the
 * storage objects. The functions on the **`responseCollection`** return streams
 * of the storage data that was requested.
 *
 * **Requests**. The stream of requests should emit objects. These should be
 * instructions to write to the desired Storage object. Here are the `request`
 * object properties:
 *
 * - `target` *(String)*: type of storage, can be `local` or `session`, defaults
 * to `local`.
 * - `action` *(String)*: type of action, can be `setItem`, `removeItem` or
 * `clear`, defaults to `setItem`.
 * - `key` *(String)*: storage key.
 * - `value` *(String)*: storage value.
 *
 * **responseCollection**. The **`responseCollection`** is an Object that
 * exposes functions to read from local- and sessionStorage.
 *
 * ```js
 * // Returns key of nth localStorage value.
 * responseCollection.local.getKey(n)
 * // Returns localStorage value of `key`.
 * responseCollection.local.getItem(key)
 * ```
 *
 * @param request$ - a stream of write request objects.
 * @return {Object} the response collection containing functions
 * for reading from storage.
 * @function storageDriver
 */
function storageDriver(request$) {
    // Execute writing actions.
    request$.addListener({
        next: function (request) { return writeToStore_1.default(request); },
    });
    // Return reading functions.
    return responseCollection_1.default(request$);
}
exports.default = storageDriver;

},{"./responseCollection":27,"./writeToStore":29}],27:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var util_1 = require("./util");
function default_1(request$) {
    return {
        // For localStorage.
        get local() {
            return util_1.default(request$);
        },
        // For sessionStorage.
        get session() {
            return util_1.default(request$, 'session');
        },
    };
}
exports.default = default_1;

},{"./util":28}],28:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var dropRepeats_1 = require("xstream/extra/dropRepeats");
var adapt_1 = require("@cycle/run/lib/adapt");
function getStorage$(request$, type) {
    if (type === 'local') {
        return request$.filter(function (req) { return !req.target || req.target === 'local'; });
    }
    else {
        return request$.filter(function (req) { return req.target === 'session'; });
    }
}
function storageKey(n, request$, type) {
    if (type === void 0) { type = 'local'; }
    var storage$ = getStorage$(request$, type);
    var key = type === "local" ? localStorage.key(n) : sessionStorage.key(n);
    return storage$
        .filter(function (req) { return req.key === key; })
        .map(function (req) { return req.key; })
        .startWith(key)
        .compose(dropRepeats_1.default());
}
function storageGetItem(key, request$, type) {
    if (type === void 0) { type = 'local'; }
    var storage$ = getStorage$(request$, type);
    var storageObj = type === "local" ? localStorage : sessionStorage;
    return storage$
        .filter(function (req) { return req.key === key; })
        .map(function (req) { return req.value; })
        .startWith(storageObj.getItem(key));
}
function getResponseObj(request$, type) {
    if (type === void 0) { type = 'local'; }
    return {
        // Function returning stream of the nth key.
        key: function (n) {
            return adapt_1.adapt(storageKey(n, request$, type));
        },
        // Function returning stream of item values.
        getItem: function (key) {
            return adapt_1.adapt(storageGetItem(key, request$, type));
        },
    };
}
exports.default = getResponseObj;

},{"@cycle/run/lib/adapt":24,"xstream/extra/dropRepeats":139}],29:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @function writeToStore
 * @description
 * A universal write function for localStorage and sessionStorage.
 * @param {object} request - the storage request object
 * @param {string} request.target - a string determines which storage to use
 * @param {string} request.action - a string determines the write action
 * @param {string} request.key - the key of a storage item
 * @param {string} request.value - the value of a storage item
 */
function writeToStore(request) {
    var _a = request.target, target = _a === void 0 ? 'local' : _a, _b = request.action, action = _b === void 0 ? 'setItem' : _b;
    var key = request.key;
    var value = request.value;
    // Determine the storage target.
    var storage = target === "local" ? localStorage : sessionStorage;
    // Execute the storage action and pass arguments if they were defined.
    storage[action](key, value);
}
exports.default = writeToStore;

},{}],30:[function(require,module,exports){
"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var xstream_1 = require("xstream");
var adapt_1 = require("@cycle/run/lib/adapt");
var isolate_1 = require("@cycle/isolate");
var pickMerge_1 = require("./pickMerge");
var pickCombine_1 = require("./pickCombine");
/**
 * An object representing all instances in a collection of components. Has the
 * methods pickCombine and pickMerge to get the combined sinks of all instances.
 */
var Instances = (function () {
    function Instances(instances$) {
        this._instances$ = instances$;
    }
    /**
     * Like `merge` in xstream, this operator blends multiple streams together, but
     * picks those streams from a collection of component instances.
     *
     * Use the `selector` string to pick a stream from the sinks object of each
     * component instance, then pickMerge will merge all those picked streams.
     *
     * @param {String} selector a name of a channel in a sinks object belonging to
     * each component in the collection of components.
     * @return {Function} an operator to be used with xstream's `compose` method.
     */
    Instances.prototype.pickMerge = function (selector) {
        return adapt_1.adapt(this._instances$.compose(pickMerge_1.pickMerge(selector)));
    };
    /**
     * Like `combine` in xstream, this operator combines multiple streams together,
     * but picks those streams from a collection of component instances.
     *
     * Use the `selector` string to pick a stream from the sinks object of each
     * component instance, then pickCombine will combine all those picked streams.
     *
     * @param {String} selector a name of a channel in a sinks object belonging to
     * each component in the collection of components.
     * @return {Function} an operator to be used with xstream's `compose` method.
     */
    Instances.prototype.pickCombine = function (selector) {
        return adapt_1.adapt(this._instances$.compose(pickCombine_1.pickCombine(selector)));
    };
    return Instances;
}());
exports.Instances = Instances;
function defaultItemScope(key) {
    return { '*': null };
}
function instanceLens(itemKey, key) {
    return {
        get: function (arr) {
            if (typeof arr === 'undefined') {
                return void 0;
            }
            else {
                for (var i = 0, n = arr.length; i < n; ++i) {
                    if ("" + itemKey(arr[i], i) === key) {
                        return arr[i];
                    }
                }
                return void 0;
            }
        },
        set: function (arr, item) {
            if (typeof arr === 'undefined') {
                return [item];
            }
            else if (typeof item === 'undefined') {
                return arr.filter(function (s, i) { return "" + itemKey(s, i) !== key; });
            }
            else {
                return arr.map(function (s, i) {
                    if ("" + itemKey(s, i) === key) {
                        return item;
                    }
                    else {
                        return s;
                    }
                });
            }
        },
    };
}
var identityLens = {
    get: function (outer) { return outer; },
    set: function (outer, inner) { return inner; },
};
/**
 * Returns a Cycle.js component (a function from sources to sinks) that
 * represents a collection of many item components of the same type.
 *
 * Takes an "options" object as input, with the required properties:
 * - item
 * - collectSinks
 *
 * And the optional properties:
 * - itemKey
 * - itemScope
 * - channel
 *
 * The returned component, the Collection, will use the state source passed to
 * it (through sources) to guide the dynamic growing/shrinking of instances of
 * the item component.
 *
 * Typically the state source should emit arrays, where each entry in the array
 * is an object holding the state for each item component. When the state array
 * grows, the collection will automatically instantiate a new item component.
 * Similarly, when the state array gets smaller, the collection will handle
 * removal of the corresponding item instance.
 */
function makeCollection(opts) {
    return function collectionComponent(sources) {
        var name = opts.channel || 'onion';
        var itemKey = opts.itemKey;
        var itemScope = opts.itemScope || defaultItemScope;
        var itemComp = opts.item;
        var state$ = xstream_1.default.fromObservable(sources[name].state$);
        var instances$ = state$.fold(function (acc, nextState) {
            var dict = acc.dict;
            if (Array.isArray(nextState)) {
                var nextInstArray = Array(nextState.length);
                var nextKeys_1 = new Set();
                // add
                for (var i = 0, n = nextState.length; i < n; ++i) {
                    var key = "" + (itemKey ? itemKey(nextState[i], i) : i);
                    nextKeys_1.add(key);
                    if (!dict.has(key)) {
                        var onionScope = itemKey ? instanceLens(itemKey, key) : "" + i;
                        var otherScopes = itemScope(key);
                        var scopes = typeof otherScopes === 'string' ? (_a = { '*': otherScopes }, _a[name] = onionScope, _a) : __assign({}, otherScopes, (_b = {}, _b[name] = onionScope, _b));
                        var sinks = isolate_1.default(itemComp, scopes)(sources);
                        dict.set(key, sinks);
                        nextInstArray[i] = sinks;
                    }
                    else {
                        nextInstArray[i] = dict.get(key);
                    }
                    nextInstArray[i]._key = key;
                }
                // remove
                dict.forEach(function (_, key) {
                    if (!nextKeys_1.has(key)) {
                        dict.delete(key);
                    }
                });
                nextKeys_1.clear();
                return { dict: dict, arr: nextInstArray };
            }
            else {
                dict.clear();
                var key = "" + (itemKey ? itemKey(nextState, 0) : 'this');
                var onionScope = identityLens;
                var otherScopes = itemScope(key);
                var scopes = typeof otherScopes === 'string' ? (_c = { '*': otherScopes }, _c[name] = onionScope, _c) : __assign({}, otherScopes, (_d = {}, _d[name] = onionScope, _d));
                var sinks = isolate_1.default(itemComp, scopes)(sources);
                dict.set(key, sinks);
                return { dict: dict, arr: [sinks] };
            }
            var _a, _b, _c, _d;
        }, { dict: new Map(), arr: [] });
        return opts.collectSinks(new Instances(instances$));
    };
}
exports.makeCollection = makeCollection;

},{"./pickCombine":34,"./pickMerge":35,"@cycle/isolate":23,"@cycle/run/lib/adapt":24,"xstream":140}],31:[function(require,module,exports){
"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var dropRepeats_1 = require("xstream/extra/dropRepeats");
var adapt_1 = require("@cycle/run/lib/adapt");
function updateArrayEntry(array, scope, newVal) {
    if (newVal === array[scope]) {
        return array;
    }
    var index = parseInt(scope);
    if (typeof newVal === 'undefined') {
        return array.filter(function (val, i) { return i !== index; });
    }
    return array.map(function (val, i) { return i === index ? newVal : val; });
}
function makeGetter(scope) {
    if (typeof scope === 'string' || typeof scope === 'number') {
        return function lensGet(state) {
            if (typeof state === 'undefined') {
                return void 0;
            }
            else {
                return state[scope];
            }
        };
    }
    else {
        return scope.get;
    }
}
function makeSetter(scope) {
    if (typeof scope === 'string' || typeof scope === 'number') {
        return function lensSet(state, childState) {
            if (Array.isArray(state)) {
                return updateArrayEntry(state, scope, childState);
            }
            else if (typeof state === 'undefined') {
                return _a = {}, _a[scope] = childState, _a;
            }
            else {
                return __assign({}, state, (_b = {}, _b[scope] = childState, _b));
            }
            var _a, _b;
        };
    }
    else {
        return scope.set;
    }
}
function isolateSource(source, scope) {
    return source.select(scope);
}
exports.isolateSource = isolateSource;
function isolateSink(innerReducer$, scope) {
    var get = makeGetter(scope);
    var set = makeSetter(scope);
    return innerReducer$
        .map(function (innerReducer) { return function outerReducer(outer) {
        var prevInner = get(outer);
        var nextInner = innerReducer(prevInner);
        if (prevInner === nextInner) {
            return outer;
        }
        else {
            return set(outer, nextInner);
        }
    }; });
}
exports.isolateSink = isolateSink;
/**
 * Represents a piece of application state dynamically changing over time.
 */
var StateSource = (function () {
    function StateSource(stream, name) {
        this.isolateSource = isolateSource;
        this.isolateSink = isolateSink;
        this._state$ = stream
            .filter(function (s) { return typeof s !== 'undefined'; })
            .compose(dropRepeats_1.default())
            .remember();
        this._name = name;
        this.state$ = adapt_1.adapt(this._state$);
        this._state$._isCycleSource = name;
    }
    /**
     * Selects a part (or scope) of the state object and returns a new StateSource
     * dynamically representing that selected part of the state.
     *
     * @param {string|number|lens} scope as a string, this argument represents the
     * property you want to select from the state object. As a number, this
     * represents the array index you want to select from the state array. As a
     * lens object (an object with get() and set()), this argument represents any
     * custom way of selecting something from the state object.
     */
    StateSource.prototype.select = function (scope) {
        var get = makeGetter(scope);
        return new StateSource(this._state$.map(get), this._name);
    };
    return StateSource;
}());
exports.StateSource = StateSource;

},{"@cycle/run/lib/adapt":24,"xstream/extra/dropRepeats":139}],32:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var onionify_1 = require("./onionify");
var StateSource_1 = require("./StateSource");
exports.StateSource = StateSource_1.StateSource;
exports.isolateSource = StateSource_1.isolateSource;
exports.isolateSink = StateSource_1.isolateSink;
var Collection_1 = require("./Collection");
exports.Instances = Collection_1.Instances;
exports.makeCollection = Collection_1.makeCollection;
/**
 * Like `merge` in xstream, this operator blends multiple streams together, but
 * picks those streams from a stream of instances.
 *
 * The instances data structure has a sinks object for each instance. Use the
 * `selector` string to pick a stream from the sinks object of each instance,
 * then pickMerge will merge all those picked streams.
 *
 * @param {String} selector a name of a channel in a sinks object belonging to
 * each component in the collection of instances.
 * @return {Function} an operator to be used with xstream's `compose` method.
 */
var pickMerge_1 = require("./pickMerge");
exports.pickMerge = pickMerge_1.pickMerge;
/**
 * Like `combine` in xstream, this operator combines multiple streams together,
 * but picks those streams from a stream of instances.
 *
 * The instances data structure has a sinks object for each instance. Use the
 * `selector` string to pick a stream from the sinks object of each instance,
 * then pickCombine will combine all those picked streams.
 *
 * @param {String} selector a name of a channel in a sinks object belonging to
 * each component in the collection of instances.
 * @return {Function} an operator to be used with xstream's `compose` method.
 */
var pickCombine_1 = require("./pickCombine");
exports.pickCombine = pickCombine_1.pickCombine;
/**
 * Given a Cycle.js component that expects an onion state *source* and will
 * output onion reducer *sink*, this function sets up the state management
 * mechanics to accumulate state over time and provide the state source. It
 * returns a Cycle.js component which wraps the component given as input.
 * Essentially, it hooks up the onion sink with the onion source as a cycle.
 *
 * Optionally, you can pass a custom name for the onion channel. By default,
 * the name is 'onion' in sources and sinks, but you can change that to be
 * whatever string you wish.
 *
 * @param {Function} main a function that takes `sources` as input and outputs
 * `sinks`.
 * @param {String} name an optional string for the custom name given to the
 * onion channel. By default, it is 'onion'.
 * @return {Function} a component that wraps the main function given as input,
 * adding state accumulation logic to it.
 */
exports.default = onionify_1.onionify;

},{"./Collection":30,"./StateSource":31,"./onionify":33,"./pickCombine":34,"./pickMerge":35}],33:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var xstream_1 = require("xstream");
var StateSource_1 = require("./StateSource");
function onionify(main, name) {
    if (name === void 0) { name = 'onion'; }
    return function mainOnionified(sources) {
        var reducerMimic$ = xstream_1.default.create();
        var state$ = reducerMimic$
            .fold(function (state, reducer) { return reducer(state); }, void 0)
            .drop(1);
        sources[name] = new StateSource_1.StateSource(state$, name);
        var sinks = main(sources);
        if (sinks[name]) {
            var stream$ = xstream_1.default.fromObservable(sinks[name]);
            reducerMimic$.imitate(stream$);
        }
        return sinks;
    };
}
exports.onionify = onionify;

},{"./StateSource":31,"xstream":140}],34:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var xstream_1 = require("xstream");
var PickCombineListener = (function () {
    function PickCombineListener(key, out, p, ins) {
        this.key = key;
        this.out = out;
        this.p = p;
        this.val = xstream_1.NO;
        this.ins = ins;
    }
    PickCombineListener.prototype._n = function (t) {
        var p = this.p, out = this.out;
        this.val = t;
        if (out === null) {
            return;
        }
        this.p.up();
    };
    PickCombineListener.prototype._e = function (err) {
        var out = this.out;
        if (out === null) {
            return;
        }
        out._e(err);
    };
    PickCombineListener.prototype._c = function () {
    };
    return PickCombineListener;
}());
var PickCombine = (function () {
    function PickCombine(sel, ins) {
        this.type = 'combine';
        this.ins = ins;
        this.sel = sel;
        this.out = null;
        this.ils = new Map();
        this.inst = null;
    }
    PickCombine.prototype._start = function (out) {
        this.out = out;
        this.ins._add(this);
    };
    PickCombine.prototype._stop = function () {
        this.ins._remove(this);
        var ils = this.ils;
        ils.forEach(function (il) {
            il.ins._remove(il);
            il.ins = null;
            il.out = null;
            il.val = null;
        });
        ils.clear();
        this.out = null;
        this.ils = new Map();
        this.inst = null;
    };
    PickCombine.prototype.up = function () {
        var arr = this.inst.arr;
        var n = arr.length;
        var ils = this.ils;
        var outArr = Array(n);
        for (var i = 0; i < n; ++i) {
            var sinks = arr[i];
            var key = sinks._key;
            if (!ils.has(key)) {
                return;
            }
            var val = ils.get(key).val;
            if (val === xstream_1.NO) {
                return;
            }
            outArr[i] = val;
        }
        this.out._n(outArr);
    };
    PickCombine.prototype._n = function (inst) {
        this.inst = inst;
        var arrSinks = inst.arr;
        var ils = this.ils;
        var out = this.out;
        var sel = this.sel;
        var dict = inst.dict;
        var n = arrSinks.length;
        // remove
        var removed = false;
        ils.forEach(function (il, key) {
            if (!dict.has(key)) {
                il.ins._remove(il);
                il.ins = null;
                il.out = null;
                il.val = null;
                ils.delete(key);
                removed = true;
            }
        });
        if (n === 0) {
            out._n([]);
            return;
        }
        // add
        for (var i = 0; i < n; ++i) {
            var sinks = arrSinks[i];
            var key = sinks._key;
            var sink = xstream_1.default.fromObservable(sinks[sel]);
            if (!ils.has(key)) {
                ils.set(key, new PickCombineListener(key, out, this, sink));
                sink._add(ils.get(key));
            }
        }
        if (removed) {
            this.up();
        }
    };
    PickCombine.prototype._e = function (e) {
        var out = this.out;
        if (out === null) {
            return;
        }
        out._e(e);
    };
    PickCombine.prototype._c = function () {
        var out = this.out;
        if (out === null) {
            return;
        }
        out._c();
    };
    return PickCombine;
}());
function pickCombine(selector) {
    return function pickCombineOperator(inst$) {
        return new xstream_1.Stream(new PickCombine(selector, inst$));
    };
}
exports.pickCombine = pickCombine;

},{"xstream":140}],35:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var xstream_1 = require("xstream");
var PickMergeListener = (function () {
    function PickMergeListener(out, p, ins) {
        this.ins = ins;
        this.out = out;
        this.p = p;
    }
    PickMergeListener.prototype._n = function (t) {
        var p = this.p, out = this.out;
        if (out === null) {
            return;
        }
        out._n(t);
    };
    PickMergeListener.prototype._e = function (err) {
        var out = this.out;
        if (out === null) {
            return;
        }
        out._e(err);
    };
    PickMergeListener.prototype._c = function () {
    };
    return PickMergeListener;
}());
var PickMerge = (function () {
    function PickMerge(sel, ins) {
        this.type = 'pickMerge';
        this.ins = ins;
        this.out = null;
        this.sel = sel;
        this.ils = new Map();
        this.inst = null;
    }
    PickMerge.prototype._start = function (out) {
        this.out = out;
        this.ins._add(this);
    };
    PickMerge.prototype._stop = function () {
        this.ins._remove(this);
        var ils = this.ils;
        ils.forEach(function (il, key) {
            il.ins._remove(il);
            il.ins = null;
            il.out = null;
            ils.delete(key);
        });
        ils.clear();
        this.out = null;
        this.ils = new Map();
        this.inst = null;
    };
    PickMerge.prototype._n = function (inst) {
        this.inst = inst;
        var arrSinks = inst.arr;
        var ils = this.ils;
        var out = this.out;
        var sel = this.sel;
        var n = arrSinks.length;
        // add
        for (var i = 0; i < n; ++i) {
            var sinks = arrSinks[i];
            var key = sinks._key;
            var sink = xstream_1.default.fromObservable(sinks[sel]);
            if (!ils.has(key)) {
                ils.set(key, new PickMergeListener(out, this, sink));
                sink._add(ils.get(key));
            }
        }
        // remove
        ils.forEach(function (il, key) {
            if (!inst.dict.has(key) || !inst.dict.get(key)) {
                il.ins._remove(il);
                il.ins = null;
                il.out = null;
                ils.delete(key);
            }
        });
    };
    PickMerge.prototype._e = function (err) {
        var u = this.out;
        if (u === null)
            return;
        u._e(err);
    };
    PickMerge.prototype._c = function () {
        var u = this.out;
        if (u === null)
            return;
        u._c();
    };
    return PickMerge;
}());
function pickMerge(selector) {
    return function pickMergeOperator(inst$) {
        return new xstream_1.Stream(new PickMerge(selector, inst$));
    };
}
exports.pickMerge = pickMerge;

},{"xstream":140}],36:[function(require,module,exports){
"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var xstream_1 = require("xstream");
var debounce_1 = require("xstream/extra/debounce");
function serialize(state) {
    return JSON.stringify(state);
}
function deserialize(str) {
    return str === null ? void 0 : JSON.parse(str);
}
function storageify(Component, options) {
    var _options = __assign({ 
        // defaults
        key: 'storageify', serialize: serialize,
        deserialize: deserialize }, options);
    return function (sources) {
        var localStorage$ = sources.storage.local.getItem(_options.key).take(1);
        var storedData$ = localStorage$.map(_options.deserialize);
        var state$ = sources.onion.state$
            .compose(_options.debounce ? debounce_1.default(_options.debounce) : function (x) { return x; });
        var componentSinks = Component(sources);
        // change initial reducer (first reducer) of component
        // to merge default state with stored state
        var childReducer$ = componentSinks.onion;
        var parentReducer$ = storedData$.map(function (storedData) {
            return childReducer$.startWith(function initialStorageReducer(prevState) {
                if (prevState && storedData) {
                    return __assign({}, prevState, storedData);
                }
                else if (prevState) {
                    return prevState;
                }
                else {
                    return storedData;
                }
            });
        }).flatten();
        var storage$ = state$.map(_options.serialize)
            .map(function (value) { return ({ key: _options.key, value: value }); });
        var sinks = __assign({}, componentSinks, { onion: parentReducer$, storage: xstream_1.default.merge(storage$, componentSinks.storage || xstream_1.default.never()) });
        return sinks;
    };
}
exports.default = storageify;

},{"xstream":140,"xstream/extra/debounce":138}],37:[function(require,module,exports){
'use strict';

var copy             = require('es5-ext/object/copy')
  , normalizeOptions = require('es5-ext/object/normalize-options')
  , ensureCallable   = require('es5-ext/object/valid-callable')
  , map              = require('es5-ext/object/map')
  , callable         = require('es5-ext/object/valid-callable')
  , validValue       = require('es5-ext/object/valid-value')

  , bind = Function.prototype.bind, defineProperty = Object.defineProperty
  , hasOwnProperty = Object.prototype.hasOwnProperty
  , define;

define = function (name, desc, options) {
	var value = validValue(desc) && callable(desc.value), dgs;
	dgs = copy(desc);
	delete dgs.writable;
	delete dgs.value;
	dgs.get = function () {
		if (!options.overwriteDefinition && hasOwnProperty.call(this, name)) return value;
		desc.value = bind.call(value, options.resolveContext ? options.resolveContext(this) : this);
		defineProperty(this, name, desc);
		return this[name];
	};
	return dgs;
};

module.exports = function (props/*, options*/) {
	var options = normalizeOptions(arguments[1]);
	if (options.resolveContext != null) ensureCallable(options.resolveContext);
	return map(props, function (desc, name) { return define(name, desc, options); });
};

},{"es5-ext/object/copy":59,"es5-ext/object/map":68,"es5-ext/object/normalize-options":69,"es5-ext/object/valid-callable":74,"es5-ext/object/valid-value":75}],38:[function(require,module,exports){
'use strict';

var assign        = require('es5-ext/object/assign')
  , normalizeOpts = require('es5-ext/object/normalize-options')
  , isCallable    = require('es5-ext/object/is-callable')
  , contains      = require('es5-ext/string/#/contains')

  , d;

d = module.exports = function (dscr, value/*, options*/) {
	var c, e, w, options, desc;
	if ((arguments.length < 2) || (typeof dscr !== 'string')) {
		options = value;
		value = dscr;
		dscr = null;
	} else {
		options = arguments[2];
	}
	if (dscr == null) {
		c = w = true;
		e = false;
	} else {
		c = contains.call(dscr, 'c');
		e = contains.call(dscr, 'e');
		w = contains.call(dscr, 'w');
	}

	desc = { value: value, configurable: c, enumerable: e, writable: w };
	return !options ? desc : assign(normalizeOpts(options), desc);
};

d.gs = function (dscr, get, set/*, options*/) {
	var c, e, options, desc;
	if (typeof dscr !== 'string') {
		options = set;
		set = get;
		get = dscr;
		dscr = null;
	} else {
		options = arguments[3];
	}
	if (get == null) {
		get = undefined;
	} else if (!isCallable(get)) {
		options = get;
		get = set = undefined;
	} else if (set == null) {
		set = undefined;
	} else if (!isCallable(set)) {
		options = set;
		set = undefined;
	}
	if (dscr == null) {
		c = true;
		e = false;
	} else {
		c = contains.call(dscr, 'c');
		e = contains.call(dscr, 'e');
	}

	desc = { get: get, set: set, configurable: c, enumerable: e };
	return !options ? desc : assign(normalizeOpts(options), desc);
};

},{"es5-ext/object/assign":56,"es5-ext/object/is-callable":62,"es5-ext/object/normalize-options":69,"es5-ext/string/#/contains":76}],39:[function(require,module,exports){
// Inspired by Google Closure:
// http://closure-library.googlecode.com/svn/docs/
// closure_goog_array_array.js.html#goog.array.clear

"use strict";

var value = require("../../object/valid-value");

module.exports = function () {
	value(this).length = 0;
	return this;
};

},{"../../object/valid-value":75}],40:[function(require,module,exports){
"use strict";

var numberIsNaN       = require("../../number/is-nan")
  , toPosInt          = require("../../number/to-pos-integer")
  , value             = require("../../object/valid-value")
  , indexOf           = Array.prototype.indexOf
  , objHasOwnProperty = Object.prototype.hasOwnProperty
  , abs               = Math.abs
  , floor             = Math.floor;

module.exports = function (searchElement /*, fromIndex*/) {
	var i, length, fromIndex, val;
	if (!numberIsNaN(searchElement)) return indexOf.apply(this, arguments);

	length = toPosInt(value(this).length);
	fromIndex = arguments[1];
	if (isNaN(fromIndex)) fromIndex = 0;
	else if (fromIndex >= 0) fromIndex = floor(fromIndex);
	else fromIndex = toPosInt(this.length) - floor(abs(fromIndex));

	for (i = fromIndex; i < length; ++i) {
		if (objHasOwnProperty.call(this, i)) {
			val = this[i];
			if (numberIsNaN(val)) return i; // Jslint: ignore
		}
	}
	return -1;
};

},{"../../number/is-nan":50,"../../number/to-pos-integer":54,"../../object/valid-value":75}],41:[function(require,module,exports){
"use strict";

module.exports = require("./is-implemented")()
	? Array.from
	: require("./shim");

},{"./is-implemented":42,"./shim":43}],42:[function(require,module,exports){
"use strict";

module.exports = function () {
	var from = Array.from, arr, result;
	if (typeof from !== "function") return false;
	arr = ["raz", "dwa"];
	result = from(arr);
	return Boolean(result && (result !== arr) && (result[1] === "dwa"));
};

},{}],43:[function(require,module,exports){
"use strict";

var iteratorSymbol = require("es6-symbol").iterator
  , isArguments    = require("../../function/is-arguments")
  , isFunction     = require("../../function/is-function")
  , toPosInt       = require("../../number/to-pos-integer")
  , callable       = require("../../object/valid-callable")
  , validValue     = require("../../object/valid-value")
  , isValue        = require("../../object/is-value")
  , isString       = require("../../string/is-string")
  , isArray        = Array.isArray
  , call           = Function.prototype.call
  , desc           = { configurable: true, enumerable: true, writable: true, value: null }
  , defineProperty = Object.defineProperty;

// eslint-disable-next-line complexity
module.exports = function (arrayLike /*, mapFn, thisArg*/) {
	var mapFn = arguments[1]
	  , thisArg = arguments[2]
	  , Context
	  , i
	  , j
	  , arr
	  , length
	  , code
	  , iterator
	  , result
	  , getIterator
	  , value;

	arrayLike = Object(validValue(arrayLike));

	if (isValue(mapFn)) callable(mapFn);
	if (!this || this === Array || !isFunction(this)) {
		// Result: Plain array
		if (!mapFn) {
			if (isArguments(arrayLike)) {
				// Source: Arguments
				length = arrayLike.length;
				if (length !== 1) return Array.apply(null, arrayLike);
				arr = new Array(1);
				arr[0] = arrayLike[0];
				return arr;
			}
			if (isArray(arrayLike)) {
				// Source: Array
				arr = new Array(length = arrayLike.length);
				for (i = 0; i < length; ++i) arr[i] = arrayLike[i];
				return arr;
			}
		}
		arr = [];
	} else {
		// Result: Non plain array
		Context = this;
	}

	if (!isArray(arrayLike)) {
		if ((getIterator = arrayLike[iteratorSymbol]) !== undefined) {
			// Source: Iterator
			iterator = callable(getIterator).call(arrayLike);
			if (Context) arr = new Context();
			result = iterator.next();
			i = 0;
			while (!result.done) {
				value = mapFn ? call.call(mapFn, thisArg, result.value, i) : result.value;
				if (Context) {
					desc.value = value;
					defineProperty(arr, i, desc);
				} else {
					arr[i] = value;
				}
				result = iterator.next();
				++i;
			}
			length = i;
		} else if (isString(arrayLike)) {
			// Source: String
			length = arrayLike.length;
			if (Context) arr = new Context();
			for (i = 0, j = 0; i < length; ++i) {
				value = arrayLike[i];
				if (i + 1 < length) {
					code = value.charCodeAt(0);
					// eslint-disable-next-line max-depth
					if (code >= 0xd800 && code <= 0xdbff) value += arrayLike[++i];
				}
				value = mapFn ? call.call(mapFn, thisArg, value, j) : value;
				if (Context) {
					desc.value = value;
					defineProperty(arr, j, desc);
				} else {
					arr[j] = value;
				}
				++j;
			}
			length = j;
		}
	}
	if (length === undefined) {
		// Source: array or array-like
		length = toPosInt(arrayLike.length);
		if (Context) arr = new Context(length);
		for (i = 0; i < length; ++i) {
			value = mapFn ? call.call(mapFn, thisArg, arrayLike[i], i) : arrayLike[i];
			if (Context) {
				desc.value = value;
				defineProperty(arr, i, desc);
			} else {
				arr[i] = value;
			}
		}
	}
	if (Context) {
		desc.value = null;
		arr.length = length;
	}
	return arr;
};

},{"../../function/is-arguments":44,"../../function/is-function":45,"../../number/to-pos-integer":54,"../../object/is-value":64,"../../object/valid-callable":74,"../../object/valid-value":75,"../../string/is-string":79,"es6-symbol":93}],44:[function(require,module,exports){
"use strict";

var objToString = Object.prototype.toString
  , id = objToString.call(
	(function () {
		return arguments;
	})()
);

module.exports = function (value) {
	return objToString.call(value) === id;
};

},{}],45:[function(require,module,exports){
"use strict";

var objToString = Object.prototype.toString, id = objToString.call(require("./noop"));

module.exports = function (value) {
	return typeof value === "function" && objToString.call(value) === id;
};

},{"./noop":46}],46:[function(require,module,exports){
"use strict";

// eslint-disable-next-line no-empty-function
module.exports = function () {};

},{}],47:[function(require,module,exports){
"use strict";

module.exports = require("./is-implemented")()
	? Math.sign
	: require("./shim");

},{"./is-implemented":48,"./shim":49}],48:[function(require,module,exports){
"use strict";

module.exports = function () {
	var sign = Math.sign;
	if (typeof sign !== "function") return false;
	return (sign(10) === 1) && (sign(-20) === -1);
};

},{}],49:[function(require,module,exports){
"use strict";

module.exports = function (value) {
	value = Number(value);
	if (isNaN(value) || (value === 0)) return value;
	return value > 0 ? 1 : -1;
};

},{}],50:[function(require,module,exports){
"use strict";

module.exports = require("./is-implemented")()
	? Number.isNaN
	: require("./shim");

},{"./is-implemented":51,"./shim":52}],51:[function(require,module,exports){
"use strict";

module.exports = function () {
	var numberIsNaN = Number.isNaN;
	if (typeof numberIsNaN !== "function") return false;
	return !numberIsNaN({}) && numberIsNaN(NaN) && !numberIsNaN(34);
};

},{}],52:[function(require,module,exports){
"use strict";

module.exports = function (value) {
	// eslint-disable-next-line no-self-compare
	return value !== value;
};

},{}],53:[function(require,module,exports){
"use strict";

var sign = require("../math/sign")

  , abs = Math.abs, floor = Math.floor;

module.exports = function (value) {
	if (isNaN(value)) return 0;
	value = Number(value);
	if ((value === 0) || !isFinite(value)) return value;
	return sign(value) * floor(abs(value));
};

},{"../math/sign":47}],54:[function(require,module,exports){
"use strict";

var toInteger = require("./to-integer")

  , max = Math.max;

module.exports = function (value) {
 return max(0, toInteger(value));
};

},{"./to-integer":53}],55:[function(require,module,exports){
// Internal method, used by iteration functions.
// Calls a function for each key-value pair found in object
// Optionally takes compareFn to iterate object in specific order

"use strict";

var callable                = require("./valid-callable")
  , value                   = require("./valid-value")
  , bind                    = Function.prototype.bind
  , call                    = Function.prototype.call
  , keys                    = Object.keys
  , objPropertyIsEnumerable = Object.prototype.propertyIsEnumerable;

module.exports = function (method, defVal) {
	return function (obj, cb /*, thisArg, compareFn*/) {
		var list, thisArg = arguments[2], compareFn = arguments[3];
		obj = Object(value(obj));
		callable(cb);

		list = keys(obj);
		if (compareFn) {
			list.sort(typeof compareFn === "function" ? bind.call(compareFn, obj) : undefined);
		}
		if (typeof method !== "function") method = list[method];
		return call.call(method, list, function (key, index) {
			if (!objPropertyIsEnumerable.call(obj, key)) return defVal;
			return call.call(cb, thisArg, obj[key], key, obj, index);
		});
	};
};

},{"./valid-callable":74,"./valid-value":75}],56:[function(require,module,exports){
"use strict";

module.exports = require("./is-implemented")()
	? Object.assign
	: require("./shim");

},{"./is-implemented":57,"./shim":58}],57:[function(require,module,exports){
"use strict";

module.exports = function () {
	var assign = Object.assign, obj;
	if (typeof assign !== "function") return false;
	obj = { foo: "raz" };
	assign(obj, { bar: "dwa" }, { trzy: "trzy" });
	return (obj.foo + obj.bar + obj.trzy) === "razdwatrzy";
};

},{}],58:[function(require,module,exports){
"use strict";

var keys  = require("../keys")
  , value = require("../valid-value")
  , max   = Math.max;

module.exports = function (dest, src /*, …srcn*/) {
	var error, i, length = max(arguments.length, 2), assign;
	dest = Object(value(dest));
	assign = function (key) {
		try {
			dest[key] = src[key];
		} catch (e) {
			if (!error) error = e;
		}
	};
	for (i = 1; i < length; ++i) {
		src = arguments[i];
		keys(src).forEach(assign);
	}
	if (error !== undefined) throw error;
	return dest;
};

},{"../keys":65,"../valid-value":75}],59:[function(require,module,exports){
"use strict";

var aFrom  = require("../array/from")
  , assign = require("./assign")
  , value  = require("./valid-value");

module.exports = function (obj/*, propertyNames, options*/) {
	var copy = Object(value(obj)), propertyNames = arguments[1], options = Object(arguments[2]);
	if (copy !== obj && !propertyNames) return copy;
	var result = {};
	if (propertyNames) {
		aFrom(propertyNames, function (propertyName) {
			if (options.ensure || propertyName in obj) result[propertyName] = obj[propertyName];
		});
	} else {
		assign(result, obj);
	}
	return result;
};

},{"../array/from":41,"./assign":56,"./valid-value":75}],60:[function(require,module,exports){
// Workaround for http://code.google.com/p/v8/issues/detail?id=2804

"use strict";

var create = Object.create, shim;

if (!require("./set-prototype-of/is-implemented")()) {
	shim = require("./set-prototype-of/shim");
}

module.exports = (function () {
	var nullObject, polyProps, desc;
	if (!shim) return create;
	if (shim.level !== 1) return create;

	nullObject = {};
	polyProps = {};
	desc = {
		configurable: false,
		enumerable: false,
		writable: true,
		value: undefined
	};
	Object.getOwnPropertyNames(Object.prototype).forEach(function (name) {
		if (name === "__proto__") {
			polyProps[name] = {
				configurable: true,
				enumerable: false,
				writable: true,
				value: undefined
			};
			return;
		}
		polyProps[name] = desc;
	});
	Object.defineProperties(nullObject, polyProps);

	Object.defineProperty(shim, "nullPolyfill", {
		configurable: false,
		enumerable: false,
		writable: false,
		value: nullObject
	});

	return function (prototype, props) {
		return create(prototype === null ? nullObject : prototype, props);
	};
}());

},{"./set-prototype-of/is-implemented":72,"./set-prototype-of/shim":73}],61:[function(require,module,exports){
"use strict";

module.exports = require("./_iterate")("forEach");

},{"./_iterate":55}],62:[function(require,module,exports){
// Deprecated

"use strict";

module.exports = function (obj) {
 return typeof obj === "function";
};

},{}],63:[function(require,module,exports){
"use strict";

var isValue = require("./is-value");

var map = { function: true, object: true };

module.exports = function (value) {
	return (isValue(value) && map[typeof value]) || false;
};

},{"./is-value":64}],64:[function(require,module,exports){
"use strict";

var _undefined = require("../function/noop")(); // Support ES3 engines

module.exports = function (val) {
 return (val !== _undefined) && (val !== null);
};

},{"../function/noop":46}],65:[function(require,module,exports){
"use strict";

module.exports = require("./is-implemented")() ? Object.keys : require("./shim");

},{"./is-implemented":66,"./shim":67}],66:[function(require,module,exports){
"use strict";

module.exports = function () {
	try {
		Object.keys("primitive");
		return true;
	} catch (e) {
		return false;
	}
};

},{}],67:[function(require,module,exports){
"use strict";

var isValue = require("../is-value");

var keys = Object.keys;

module.exports = function (object) { return keys(isValue(object) ? Object(object) : object); };

},{"../is-value":64}],68:[function(require,module,exports){
"use strict";

var callable = require("./valid-callable")
  , forEach  = require("./for-each")
  , call     = Function.prototype.call;

module.exports = function (obj, cb /*, thisArg*/) {
	var result = {}, thisArg = arguments[2];
	callable(cb);
	forEach(obj, function (value, key, targetObj, index) {
		result[key] = call.call(cb, thisArg, value, key, targetObj, index);
	});
	return result;
};

},{"./for-each":61,"./valid-callable":74}],69:[function(require,module,exports){
"use strict";

var isValue = require("./is-value");

var forEach = Array.prototype.forEach, create = Object.create;

var process = function (src, obj) {
	var key;
	for (key in src) obj[key] = src[key];
};

// eslint-disable-next-line no-unused-vars
module.exports = function (opts1 /*, …options*/) {
	var result = create(null);
	forEach.call(arguments, function (options) {
		if (!isValue(options)) return;
		process(Object(options), result);
	});
	return result;
};

},{"./is-value":64}],70:[function(require,module,exports){
"use strict";

var forEach = Array.prototype.forEach, create = Object.create;

// eslint-disable-next-line no-unused-vars
module.exports = function (arg /*, …args*/) {
	var set = create(null);
	forEach.call(arguments, function (name) {
		set[name] = true;
	});
	return set;
};

},{}],71:[function(require,module,exports){
"use strict";

module.exports = require("./is-implemented")()
	? Object.setPrototypeOf
	: require("./shim");

},{"./is-implemented":72,"./shim":73}],72:[function(require,module,exports){
"use strict";

var create = Object.create, getPrototypeOf = Object.getPrototypeOf, plainObject = {};

module.exports = function (/* CustomCreate*/) {
	var setPrototypeOf = Object.setPrototypeOf, customCreate = arguments[0] || create;
	if (typeof setPrototypeOf !== "function") return false;
	return getPrototypeOf(setPrototypeOf(customCreate(null), plainObject)) === plainObject;
};

},{}],73:[function(require,module,exports){
/* eslint no-proto: "off" */

// Big thanks to @WebReflection for sorting this out
// https://gist.github.com/WebReflection/5593554

"use strict";

var isObject        = require("../is-object")
  , value           = require("../valid-value")
  , objIsPrototypeOf = Object.prototype.isPrototypeOf
  , defineProperty  = Object.defineProperty
  , nullDesc        = {
	configurable: true,
	enumerable: false,
	writable: true,
	value: undefined
}
  , validate;

validate = function (obj, prototype) {
	value(obj);
	if (prototype === null || isObject(prototype)) return obj;
	throw new TypeError("Prototype must be null or an object");
};

module.exports = (function (status) {
	var fn, set;
	if (!status) return null;
	if (status.level === 2) {
		if (status.set) {
			set = status.set;
			fn = function (obj, prototype) {
				set.call(validate(obj, prototype), prototype);
				return obj;
			};
		} else {
			fn = function (obj, prototype) {
				validate(obj, prototype).__proto__ = prototype;
				return obj;
			};
		}
	} else {
		fn = function self(obj, prototype) {
			var isNullBase;
			validate(obj, prototype);
			isNullBase = objIsPrototypeOf.call(self.nullPolyfill, obj);
			if (isNullBase) delete self.nullPolyfill.__proto__;
			if (prototype === null) prototype = self.nullPolyfill;
			obj.__proto__ = prototype;
			if (isNullBase) defineProperty(self.nullPolyfill, "__proto__", nullDesc);
			return obj;
		};
	}
	return Object.defineProperty(fn, "level", {
		configurable: false,
		enumerable: false,
		writable: false,
		value: status.level
	});
}(
	(function () {
		var tmpObj1 = Object.create(null)
		  , tmpObj2 = {}
		  , set
		  , desc = Object.getOwnPropertyDescriptor(Object.prototype, "__proto__");

		if (desc) {
			try {
				set = desc.set; // Opera crashes at this point
				set.call(tmpObj1, tmpObj2);
			} catch (ignore) {}
			if (Object.getPrototypeOf(tmpObj1) === tmpObj2) return { set: set, level: 2 };
		}

		tmpObj1.__proto__ = tmpObj2;
		if (Object.getPrototypeOf(tmpObj1) === tmpObj2) return { level: 2 };

		tmpObj1 = {};
		tmpObj1.__proto__ = tmpObj2;
		if (Object.getPrototypeOf(tmpObj1) === tmpObj2) return { level: 1 };

		return false;
	})()
));

require("../create");

},{"../create":60,"../is-object":63,"../valid-value":75}],74:[function(require,module,exports){
"use strict";

module.exports = function (fn) {
	if (typeof fn !== "function") throw new TypeError(fn + " is not a function");
	return fn;
};

},{}],75:[function(require,module,exports){
"use strict";

var isValue = require("./is-value");

module.exports = function (value) {
	if (!isValue(value)) throw new TypeError("Cannot use null or undefined");
	return value;
};

},{"./is-value":64}],76:[function(require,module,exports){
"use strict";

module.exports = require("./is-implemented")()
	? String.prototype.contains
	: require("./shim");

},{"./is-implemented":77,"./shim":78}],77:[function(require,module,exports){
"use strict";

var str = "razdwatrzy";

module.exports = function () {
	if (typeof str.contains !== "function") return false;
	return (str.contains("dwa") === true) && (str.contains("foo") === false);
};

},{}],78:[function(require,module,exports){
"use strict";

var indexOf = String.prototype.indexOf;

module.exports = function (searchString/*, position*/) {
	return indexOf.call(this, searchString, arguments[1]) > -1;
};

},{}],79:[function(require,module,exports){
"use strict";

var objToString = Object.prototype.toString, id = objToString.call("");

module.exports = function (value) {
	return (
		typeof value === "string" ||
		(value &&
			typeof value === "object" &&
			(value instanceof String || objToString.call(value) === id)) ||
		false
	);
};

},{}],80:[function(require,module,exports){
"use strict";

var setPrototypeOf = require("es5-ext/object/set-prototype-of")
  , contains       = require("es5-ext/string/#/contains")
  , d              = require("d")
  , Symbol         = require("es6-symbol")
  , Iterator       = require("./");

var defineProperty = Object.defineProperty, ArrayIterator;

ArrayIterator = module.exports = function (arr, kind) {
	if (!(this instanceof ArrayIterator)) throw new TypeError("Constructor requires 'new'");
	Iterator.call(this, arr);
	if (!kind) kind = "value";
	else if (contains.call(kind, "key+value")) kind = "key+value";
	else if (contains.call(kind, "key")) kind = "key";
	else kind = "value";
	defineProperty(this, "__kind__", d("", kind));
};
if (setPrototypeOf) setPrototypeOf(ArrayIterator, Iterator);

// Internal %ArrayIteratorPrototype% doesn't expose its constructor
delete ArrayIterator.prototype.constructor;

ArrayIterator.prototype = Object.create(Iterator.prototype, {
	_resolve: d(function (i) {
		if (this.__kind__ === "value") return this.__list__[i];
		if (this.__kind__ === "key+value") return [i, this.__list__[i]];
		return i;
	})
});
defineProperty(ArrayIterator.prototype, Symbol.toStringTag, d("c", "Array Iterator"));

},{"./":83,"d":38,"es5-ext/object/set-prototype-of":71,"es5-ext/string/#/contains":76,"es6-symbol":93}],81:[function(require,module,exports){
"use strict";

var isArguments = require("es5-ext/function/is-arguments")
  , callable    = require("es5-ext/object/valid-callable")
  , isString    = require("es5-ext/string/is-string")
  , get         = require("./get");

var isArray = Array.isArray, call = Function.prototype.call, some = Array.prototype.some;

module.exports = function (iterable, cb /*, thisArg*/) {
	var mode, thisArg = arguments[2], result, doBreak, broken, i, length, char, code;
	if (isArray(iterable) || isArguments(iterable)) mode = "array";
	else if (isString(iterable)) mode = "string";
	else iterable = get(iterable);

	callable(cb);
	doBreak = function () {
		broken = true;
	};
	if (mode === "array") {
		some.call(iterable, function (value) {
			call.call(cb, thisArg, value, doBreak);
			return broken;
		});
		return;
	}
	if (mode === "string") {
		length = iterable.length;
		for (i = 0; i < length; ++i) {
			char = iterable[i];
			if (i + 1 < length) {
				code = char.charCodeAt(0);
				if (code >= 0xd800 && code <= 0xdbff) char += iterable[++i];
			}
			call.call(cb, thisArg, char, doBreak);
			if (broken) break;
		}
		return;
	}
	result = iterable.next();

	while (!result.done) {
		call.call(cb, thisArg, result.value, doBreak);
		if (broken) return;
		result = iterable.next();
	}
};

},{"./get":82,"es5-ext/function/is-arguments":44,"es5-ext/object/valid-callable":74,"es5-ext/string/is-string":79}],82:[function(require,module,exports){
"use strict";

var isArguments    = require("es5-ext/function/is-arguments")
  , isString       = require("es5-ext/string/is-string")
  , ArrayIterator  = require("./array")
  , StringIterator = require("./string")
  , iterable       = require("./valid-iterable")
  , iteratorSymbol = require("es6-symbol").iterator;

module.exports = function (obj) {
	if (typeof iterable(obj)[iteratorSymbol] === "function") return obj[iteratorSymbol]();
	if (isArguments(obj)) return new ArrayIterator(obj);
	if (isString(obj)) return new StringIterator(obj);
	return new ArrayIterator(obj);
};

},{"./array":80,"./string":85,"./valid-iterable":86,"es5-ext/function/is-arguments":44,"es5-ext/string/is-string":79,"es6-symbol":93}],83:[function(require,module,exports){
"use strict";

var clear    = require("es5-ext/array/#/clear")
  , assign   = require("es5-ext/object/assign")
  , callable = require("es5-ext/object/valid-callable")
  , value    = require("es5-ext/object/valid-value")
  , d        = require("d")
  , autoBind = require("d/auto-bind")
  , Symbol   = require("es6-symbol");

var defineProperty = Object.defineProperty, defineProperties = Object.defineProperties, Iterator;

module.exports = Iterator = function (list, context) {
	if (!(this instanceof Iterator)) throw new TypeError("Constructor requires 'new'");
	defineProperties(this, {
		__list__: d("w", value(list)),
		__context__: d("w", context),
		__nextIndex__: d("w", 0)
	});
	if (!context) return;
	callable(context.on);
	context.on("_add", this._onAdd);
	context.on("_delete", this._onDelete);
	context.on("_clear", this._onClear);
};

// Internal %IteratorPrototype% doesn't expose its constructor
delete Iterator.prototype.constructor;

defineProperties(
	Iterator.prototype,
	assign(
		{
			_next: d(function () {
				var i;
				if (!this.__list__) return undefined;
				if (this.__redo__) {
					i = this.__redo__.shift();
					if (i !== undefined) return i;
				}
				if (this.__nextIndex__ < this.__list__.length) return this.__nextIndex__++;
				this._unBind();
				return undefined;
			}),
			next: d(function () {
				return this._createResult(this._next());
			}),
			_createResult: d(function (i) {
				if (i === undefined) return { done: true, value: undefined };
				return { done: false, value: this._resolve(i) };
			}),
			_resolve: d(function (i) {
				return this.__list__[i];
			}),
			_unBind: d(function () {
				this.__list__ = null;
				delete this.__redo__;
				if (!this.__context__) return;
				this.__context__.off("_add", this._onAdd);
				this.__context__.off("_delete", this._onDelete);
				this.__context__.off("_clear", this._onClear);
				this.__context__ = null;
			}),
			toString: d(function () {
				return "[object " + (this[Symbol.toStringTag] || "Object") + "]";
			})
		},
		autoBind({
			_onAdd: d(function (index) {
				if (index >= this.__nextIndex__) return;
				++this.__nextIndex__;
				if (!this.__redo__) {
					defineProperty(this, "__redo__", d("c", [index]));
					return;
				}
				this.__redo__.forEach(function (redo, i) {
					if (redo >= index) this.__redo__[i] = ++redo;
				}, this);
				this.__redo__.push(index);
			}),
			_onDelete: d(function (index) {
				var i;
				if (index >= this.__nextIndex__) return;
				--this.__nextIndex__;
				if (!this.__redo__) return;
				i = this.__redo__.indexOf(index);
				if (i !== -1) this.__redo__.splice(i, 1);
				this.__redo__.forEach(function (redo, j) {
					if (redo > index) this.__redo__[j] = --redo;
				}, this);
			}),
			_onClear: d(function () {
				if (this.__redo__) clear.call(this.__redo__);
				this.__nextIndex__ = 0;
			})
		})
	)
);

defineProperty(
	Iterator.prototype,
	Symbol.iterator,
	d(function () {
		return this;
	})
);

},{"d":38,"d/auto-bind":37,"es5-ext/array/#/clear":39,"es5-ext/object/assign":56,"es5-ext/object/valid-callable":74,"es5-ext/object/valid-value":75,"es6-symbol":93}],84:[function(require,module,exports){
"use strict";

var isArguments = require("es5-ext/function/is-arguments")
  , isValue     = require("es5-ext/object/is-value")
  , isString    = require("es5-ext/string/is-string");

var iteratorSymbol = require("es6-symbol").iterator
  , isArray        = Array.isArray;

module.exports = function (value) {
	if (!isValue(value)) return false;
	if (isArray(value)) return true;
	if (isString(value)) return true;
	if (isArguments(value)) return true;
	return typeof value[iteratorSymbol] === "function";
};

},{"es5-ext/function/is-arguments":44,"es5-ext/object/is-value":64,"es5-ext/string/is-string":79,"es6-symbol":93}],85:[function(require,module,exports){
// Thanks @mathiasbynens
// http://mathiasbynens.be/notes/javascript-unicode#iterating-over-symbols

"use strict";

var setPrototypeOf = require("es5-ext/object/set-prototype-of")
  , d              = require("d")
  , Symbol         = require("es6-symbol")
  , Iterator       = require("./");

var defineProperty = Object.defineProperty, StringIterator;

StringIterator = module.exports = function (str) {
	if (!(this instanceof StringIterator)) throw new TypeError("Constructor requires 'new'");
	str = String(str);
	Iterator.call(this, str);
	defineProperty(this, "__length__", d("", str.length));
};
if (setPrototypeOf) setPrototypeOf(StringIterator, Iterator);

// Internal %ArrayIteratorPrototype% doesn't expose its constructor
delete StringIterator.prototype.constructor;

StringIterator.prototype = Object.create(Iterator.prototype, {
	_next: d(function () {
		if (!this.__list__) return undefined;
		if (this.__nextIndex__ < this.__length__) return this.__nextIndex__++;
		this._unBind();
		return undefined;
	}),
	_resolve: d(function (i) {
		var char = this.__list__[i], code;
		if (this.__nextIndex__ === this.__length__) return char;
		code = char.charCodeAt(0);
		if (code >= 0xd800 && code <= 0xdbff) return char + this.__list__[this.__nextIndex__++];
		return char;
	})
});
defineProperty(StringIterator.prototype, Symbol.toStringTag, d("c", "String Iterator"));

},{"./":83,"d":38,"es5-ext/object/set-prototype-of":71,"es6-symbol":93}],86:[function(require,module,exports){
"use strict";

var isIterable = require("./is-iterable");

module.exports = function (value) {
	if (!isIterable(value)) throw new TypeError(value + " is not iterable");
	return value;
};

},{"./is-iterable":84}],87:[function(require,module,exports){
'use strict';

module.exports = require('./is-implemented')() ? Map : require('./polyfill');

},{"./is-implemented":88,"./polyfill":92}],88:[function(require,module,exports){
'use strict';

module.exports = function () {
	var map, iterator, result;
	if (typeof Map !== 'function') return false;
	try {
		// WebKit doesn't support arguments and crashes
		map = new Map([['raz', 'one'], ['dwa', 'two'], ['trzy', 'three']]);
	} catch (e) {
		return false;
	}
	if (String(map) !== '[object Map]') return false;
	if (map.size !== 3) return false;
	if (typeof map.clear !== 'function') return false;
	if (typeof map.delete !== 'function') return false;
	if (typeof map.entries !== 'function') return false;
	if (typeof map.forEach !== 'function') return false;
	if (typeof map.get !== 'function') return false;
	if (typeof map.has !== 'function') return false;
	if (typeof map.keys !== 'function') return false;
	if (typeof map.set !== 'function') return false;
	if (typeof map.values !== 'function') return false;

	iterator = map.entries();
	result = iterator.next();
	if (result.done !== false) return false;
	if (!result.value) return false;
	if (result.value[0] !== 'raz') return false;
	if (result.value[1] !== 'one') return false;

	return true;
};

},{}],89:[function(require,module,exports){
// Exports true if environment provides native `Map` implementation,
// whatever that is.

'use strict';

module.exports = (function () {
	if (typeof Map === 'undefined') return false;
	return (Object.prototype.toString.call(new Map()) === '[object Map]');
}());

},{}],90:[function(require,module,exports){
'use strict';

module.exports = require('es5-ext/object/primitive-set')('key',
	'value', 'key+value');

},{"es5-ext/object/primitive-set":70}],91:[function(require,module,exports){
'use strict';

var setPrototypeOf    = require('es5-ext/object/set-prototype-of')
  , d                 = require('d')
  , Iterator          = require('es6-iterator')
  , toStringTagSymbol = require('es6-symbol').toStringTag
  , kinds             = require('./iterator-kinds')

  , defineProperties = Object.defineProperties
  , unBind = Iterator.prototype._unBind
  , MapIterator;

MapIterator = module.exports = function (map, kind) {
	if (!(this instanceof MapIterator)) return new MapIterator(map, kind);
	Iterator.call(this, map.__mapKeysData__, map);
	if (!kind || !kinds[kind]) kind = 'key+value';
	defineProperties(this, {
		__kind__: d('', kind),
		__values__: d('w', map.__mapValuesData__)
	});
};
if (setPrototypeOf) setPrototypeOf(MapIterator, Iterator);

MapIterator.prototype = Object.create(Iterator.prototype, {
	constructor: d(MapIterator),
	_resolve: d(function (i) {
		if (this.__kind__ === 'value') return this.__values__[i];
		if (this.__kind__ === 'key') return this.__list__[i];
		return [this.__list__[i], this.__values__[i]];
	}),
	_unBind: d(function () {
		this.__values__ = null;
		unBind.call(this);
	}),
	toString: d(function () { return '[object Map Iterator]'; })
});
Object.defineProperty(MapIterator.prototype, toStringTagSymbol,
	d('c', 'Map Iterator'));

},{"./iterator-kinds":90,"d":38,"es5-ext/object/set-prototype-of":71,"es6-iterator":83,"es6-symbol":93}],92:[function(require,module,exports){
'use strict';

var clear          = require('es5-ext/array/#/clear')
  , eIndexOf       = require('es5-ext/array/#/e-index-of')
  , setPrototypeOf = require('es5-ext/object/set-prototype-of')
  , callable       = require('es5-ext/object/valid-callable')
  , validValue     = require('es5-ext/object/valid-value')
  , d              = require('d')
  , ee             = require('event-emitter')
  , Symbol         = require('es6-symbol')
  , iterator       = require('es6-iterator/valid-iterable')
  , forOf          = require('es6-iterator/for-of')
  , Iterator       = require('./lib/iterator')
  , isNative       = require('./is-native-implemented')

  , call = Function.prototype.call
  , defineProperties = Object.defineProperties, getPrototypeOf = Object.getPrototypeOf
  , MapPoly;

module.exports = MapPoly = function (/*iterable*/) {
	var iterable = arguments[0], keys, values, self;
	if (!(this instanceof MapPoly)) throw new TypeError('Constructor requires \'new\'');
	if (isNative && setPrototypeOf && (Map !== MapPoly)) {
		self = setPrototypeOf(new Map(), getPrototypeOf(this));
	} else {
		self = this;
	}
	if (iterable != null) iterator(iterable);
	defineProperties(self, {
		__mapKeysData__: d('c', keys = []),
		__mapValuesData__: d('c', values = [])
	});
	if (!iterable) return self;
	forOf(iterable, function (value) {
		var key = validValue(value)[0];
		value = value[1];
		if (eIndexOf.call(keys, key) !== -1) return;
		keys.push(key);
		values.push(value);
	}, self);
	return self;
};

if (isNative) {
	if (setPrototypeOf) setPrototypeOf(MapPoly, Map);
	MapPoly.prototype = Object.create(Map.prototype, {
		constructor: d(MapPoly)
	});
}

ee(defineProperties(MapPoly.prototype, {
	clear: d(function () {
		if (!this.__mapKeysData__.length) return;
		clear.call(this.__mapKeysData__);
		clear.call(this.__mapValuesData__);
		this.emit('_clear');
	}),
	delete: d(function (key) {
		var index = eIndexOf.call(this.__mapKeysData__, key);
		if (index === -1) return false;
		this.__mapKeysData__.splice(index, 1);
		this.__mapValuesData__.splice(index, 1);
		this.emit('_delete', index, key);
		return true;
	}),
	entries: d(function () { return new Iterator(this, 'key+value'); }),
	forEach: d(function (cb/*, thisArg*/) {
		var thisArg = arguments[1], iterator, result;
		callable(cb);
		iterator = this.entries();
		result = iterator._next();
		while (result !== undefined) {
			call.call(cb, thisArg, this.__mapValuesData__[result],
				this.__mapKeysData__[result], this);
			result = iterator._next();
		}
	}),
	get: d(function (key) {
		var index = eIndexOf.call(this.__mapKeysData__, key);
		if (index === -1) return;
		return this.__mapValuesData__[index];
	}),
	has: d(function (key) {
		return (eIndexOf.call(this.__mapKeysData__, key) !== -1);
	}),
	keys: d(function () { return new Iterator(this, 'key'); }),
	set: d(function (key, value) {
		var index = eIndexOf.call(this.__mapKeysData__, key), emit;
		if (index === -1) {
			index = this.__mapKeysData__.push(key) - 1;
			emit = true;
		}
		this.__mapValuesData__[index] = value;
		if (emit) this.emit('_add', index, key);
		return this;
	}),
	size: d.gs(function () { return this.__mapKeysData__.length; }),
	values: d(function () { return new Iterator(this, 'value'); }),
	toString: d(function () { return '[object Map]'; })
}));
Object.defineProperty(MapPoly.prototype, Symbol.iterator, d(function () {
	return this.entries();
}));
Object.defineProperty(MapPoly.prototype, Symbol.toStringTag, d('c', 'Map'));

},{"./is-native-implemented":89,"./lib/iterator":91,"d":38,"es5-ext/array/#/clear":39,"es5-ext/array/#/e-index-of":40,"es5-ext/object/set-prototype-of":71,"es5-ext/object/valid-callable":74,"es5-ext/object/valid-value":75,"es6-iterator/for-of":81,"es6-iterator/valid-iterable":86,"es6-symbol":93,"event-emitter":98}],93:[function(require,module,exports){
'use strict';

module.exports = require('./is-implemented')() ? Symbol : require('./polyfill');

},{"./is-implemented":94,"./polyfill":96}],94:[function(require,module,exports){
'use strict';

var validTypes = { object: true, symbol: true };

module.exports = function () {
	var symbol;
	if (typeof Symbol !== 'function') return false;
	symbol = Symbol('test symbol');
	try { String(symbol); } catch (e) { return false; }

	// Return 'true' also for polyfills
	if (!validTypes[typeof Symbol.iterator]) return false;
	if (!validTypes[typeof Symbol.toPrimitive]) return false;
	if (!validTypes[typeof Symbol.toStringTag]) return false;

	return true;
};

},{}],95:[function(require,module,exports){
'use strict';

module.exports = function (x) {
	if (!x) return false;
	if (typeof x === 'symbol') return true;
	if (!x.constructor) return false;
	if (x.constructor.name !== 'Symbol') return false;
	return (x[x.constructor.toStringTag] === 'Symbol');
};

},{}],96:[function(require,module,exports){
// ES2015 Symbol polyfill for environments that do not (or partially) support it

'use strict';

var d              = require('d')
  , validateSymbol = require('./validate-symbol')

  , create = Object.create, defineProperties = Object.defineProperties
  , defineProperty = Object.defineProperty, objPrototype = Object.prototype
  , NativeSymbol, SymbolPolyfill, HiddenSymbol, globalSymbols = create(null)
  , isNativeSafe;

if (typeof Symbol === 'function') {
	NativeSymbol = Symbol;
	try {
		String(NativeSymbol());
		isNativeSafe = true;
	} catch (ignore) {}
}

var generateName = (function () {
	var created = create(null);
	return function (desc) {
		var postfix = 0, name, ie11BugWorkaround;
		while (created[desc + (postfix || '')]) ++postfix;
		desc += (postfix || '');
		created[desc] = true;
		name = '@@' + desc;
		defineProperty(objPrototype, name, d.gs(null, function (value) {
			// For IE11 issue see:
			// https://connect.microsoft.com/IE/feedbackdetail/view/1928508/
			//    ie11-broken-getters-on-dom-objects
			// https://github.com/medikoo/es6-symbol/issues/12
			if (ie11BugWorkaround) return;
			ie11BugWorkaround = true;
			defineProperty(this, name, d(value));
			ie11BugWorkaround = false;
		}));
		return name;
	};
}());

// Internal constructor (not one exposed) for creating Symbol instances.
// This one is used to ensure that `someSymbol instanceof Symbol` always return false
HiddenSymbol = function Symbol(description) {
	if (this instanceof HiddenSymbol) throw new TypeError('Symbol is not a constructor');
	return SymbolPolyfill(description);
};

// Exposed `Symbol` constructor
// (returns instances of HiddenSymbol)
module.exports = SymbolPolyfill = function Symbol(description) {
	var symbol;
	if (this instanceof Symbol) throw new TypeError('Symbol is not a constructor');
	if (isNativeSafe) return NativeSymbol(description);
	symbol = create(HiddenSymbol.prototype);
	description = (description === undefined ? '' : String(description));
	return defineProperties(symbol, {
		__description__: d('', description),
		__name__: d('', generateName(description))
	});
};
defineProperties(SymbolPolyfill, {
	for: d(function (key) {
		if (globalSymbols[key]) return globalSymbols[key];
		return (globalSymbols[key] = SymbolPolyfill(String(key)));
	}),
	keyFor: d(function (s) {
		var key;
		validateSymbol(s);
		for (key in globalSymbols) if (globalSymbols[key] === s) return key;
	}),

	// To ensure proper interoperability with other native functions (e.g. Array.from)
	// fallback to eventual native implementation of given symbol
	hasInstance: d('', (NativeSymbol && NativeSymbol.hasInstance) || SymbolPolyfill('hasInstance')),
	isConcatSpreadable: d('', (NativeSymbol && NativeSymbol.isConcatSpreadable) ||
		SymbolPolyfill('isConcatSpreadable')),
	iterator: d('', (NativeSymbol && NativeSymbol.iterator) || SymbolPolyfill('iterator')),
	match: d('', (NativeSymbol && NativeSymbol.match) || SymbolPolyfill('match')),
	replace: d('', (NativeSymbol && NativeSymbol.replace) || SymbolPolyfill('replace')),
	search: d('', (NativeSymbol && NativeSymbol.search) || SymbolPolyfill('search')),
	species: d('', (NativeSymbol && NativeSymbol.species) || SymbolPolyfill('species')),
	split: d('', (NativeSymbol && NativeSymbol.split) || SymbolPolyfill('split')),
	toPrimitive: d('', (NativeSymbol && NativeSymbol.toPrimitive) || SymbolPolyfill('toPrimitive')),
	toStringTag: d('', (NativeSymbol && NativeSymbol.toStringTag) || SymbolPolyfill('toStringTag')),
	unscopables: d('', (NativeSymbol && NativeSymbol.unscopables) || SymbolPolyfill('unscopables'))
});

// Internal tweaks for real symbol producer
defineProperties(HiddenSymbol.prototype, {
	constructor: d(SymbolPolyfill),
	toString: d('', function () { return this.__name__; })
});

// Proper implementation of methods exposed on Symbol.prototype
// They won't be accessible on produced symbol instances as they derive from HiddenSymbol.prototype
defineProperties(SymbolPolyfill.prototype, {
	toString: d(function () { return 'Symbol (' + validateSymbol(this).__description__ + ')'; }),
	valueOf: d(function () { return validateSymbol(this); })
});
defineProperty(SymbolPolyfill.prototype, SymbolPolyfill.toPrimitive, d('', function () {
	var symbol = validateSymbol(this);
	if (typeof symbol === 'symbol') return symbol;
	return symbol.toString();
}));
defineProperty(SymbolPolyfill.prototype, SymbolPolyfill.toStringTag, d('c', 'Symbol'));

// Proper implementaton of toPrimitive and toStringTag for returned symbol instances
defineProperty(HiddenSymbol.prototype, SymbolPolyfill.toStringTag,
	d('c', SymbolPolyfill.prototype[SymbolPolyfill.toStringTag]));

// Note: It's important to define `toPrimitive` as last one, as some implementations
// implement `toPrimitive` natively without implementing `toStringTag` (or other specified symbols)
// And that may invoke error in definition flow:
// See: https://github.com/medikoo/es6-symbol/issues/13#issuecomment-164146149
defineProperty(HiddenSymbol.prototype, SymbolPolyfill.toPrimitive,
	d('c', SymbolPolyfill.prototype[SymbolPolyfill.toPrimitive]));

},{"./validate-symbol":97,"d":38}],97:[function(require,module,exports){
'use strict';

var isSymbol = require('./is-symbol');

module.exports = function (value) {
	if (!isSymbol(value)) throw new TypeError(value + " is not a symbol");
	return value;
};

},{"./is-symbol":95}],98:[function(require,module,exports){
'use strict';

var d        = require('d')
  , callable = require('es5-ext/object/valid-callable')

  , apply = Function.prototype.apply, call = Function.prototype.call
  , create = Object.create, defineProperty = Object.defineProperty
  , defineProperties = Object.defineProperties
  , hasOwnProperty = Object.prototype.hasOwnProperty
  , descriptor = { configurable: true, enumerable: false, writable: true }

  , on, once, off, emit, methods, descriptors, base;

on = function (type, listener) {
	var data;

	callable(listener);

	if (!hasOwnProperty.call(this, '__ee__')) {
		data = descriptor.value = create(null);
		defineProperty(this, '__ee__', descriptor);
		descriptor.value = null;
	} else {
		data = this.__ee__;
	}
	if (!data[type]) data[type] = listener;
	else if (typeof data[type] === 'object') data[type].push(listener);
	else data[type] = [data[type], listener];

	return this;
};

once = function (type, listener) {
	var once, self;

	callable(listener);
	self = this;
	on.call(this, type, once = function () {
		off.call(self, type, once);
		apply.call(listener, this, arguments);
	});

	once.__eeOnceListener__ = listener;
	return this;
};

off = function (type, listener) {
	var data, listeners, candidate, i;

	callable(listener);

	if (!hasOwnProperty.call(this, '__ee__')) return this;
	data = this.__ee__;
	if (!data[type]) return this;
	listeners = data[type];

	if (typeof listeners === 'object') {
		for (i = 0; (candidate = listeners[i]); ++i) {
			if ((candidate === listener) ||
					(candidate.__eeOnceListener__ === listener)) {
				if (listeners.length === 2) data[type] = listeners[i ? 0 : 1];
				else listeners.splice(i, 1);
			}
		}
	} else {
		if ((listeners === listener) ||
				(listeners.__eeOnceListener__ === listener)) {
			delete data[type];
		}
	}

	return this;
};

emit = function (type) {
	var i, l, listener, listeners, args;

	if (!hasOwnProperty.call(this, '__ee__')) return;
	listeners = this.__ee__[type];
	if (!listeners) return;

	if (typeof listeners === 'object') {
		l = arguments.length;
		args = new Array(l - 1);
		for (i = 1; i < l; ++i) args[i - 1] = arguments[i];

		listeners = listeners.slice();
		for (i = 0; (listener = listeners[i]); ++i) {
			apply.call(listener, this, args);
		}
	} else {
		switch (arguments.length) {
		case 1:
			call.call(listeners, this);
			break;
		case 2:
			call.call(listeners, this, arguments[1]);
			break;
		case 3:
			call.call(listeners, this, arguments[1], arguments[2]);
			break;
		default:
			l = arguments.length;
			args = new Array(l - 1);
			for (i = 1; i < l; ++i) {
				args[i - 1] = arguments[i];
			}
			apply.call(listeners, this, args);
		}
	}
};

methods = {
	on: on,
	once: once,
	off: off,
	emit: emit
};

descriptors = {
	on: d(on),
	once: d(once),
	off: d(off),
	emit: d(emit)
};

base = defineProperties({}, descriptors);

module.exports = exports = function (o) {
	return (o == null) ? create(base) : defineProperties(Object(o), descriptors);
};
exports.methods = methods;

},{"d":38,"es5-ext/object/valid-callable":74}],99:[function(require,module,exports){
(function (process){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * The unique id is used for unique hashes.
 */
var uniqueId = 0;
/**
 * Tag styles with this string to get unique hashes.
 */
exports.IS_UNIQUE = '__DO_NOT_DEDUPE_STYLE__';
var upperCasePattern = /[A-Z]/g;
var msPattern = /^ms-/;
var interpolatePattern = /&/g;
var escapePattern = /[ !#$%&()*+,./;<=>?@[\]^`{|}~"'\\]/g;
var propLower = function (m) { return "-" + m.toLowerCase(); };
/**
 * CSS properties that are valid unit-less numbers.
 */
var cssNumberProperties = [
    'animation-iteration-count',
    'box-flex',
    'box-flex-group',
    'column-count',
    'counter-increment',
    'counter-reset',
    'flex',
    'flex-grow',
    'flex-positive',
    'flex-shrink',
    'flex-negative',
    'font-weight',
    'line-clamp',
    'line-height',
    'opacity',
    'order',
    'orphans',
    'tab-size',
    'widows',
    'z-index',
    'zoom',
    // SVG properties.
    'fill-opacity',
    'stroke-dashoffset',
    'stroke-opacity',
    'stroke-width'
];
/**
 * Map of css number properties.
 */
var CSS_NUMBER = Object.create(null);
// Add vendor prefixes to all unit-less properties.
for (var _i = 0, _a = ['-webkit-', '-ms-', '-moz-', '-o-', '']; _i < _a.length; _i++) {
    var prefix = _a[_i];
    for (var _b = 0, cssNumberProperties_1 = cssNumberProperties; _b < cssNumberProperties_1.length; _b++) {
        var property = cssNumberProperties_1[_b];
        CSS_NUMBER[prefix + property] = true;
    }
}
/**
 * Escape a CSS class name.
 */
exports.escape = function (str) { return str.replace(escapePattern, '\\$&'); };
/**
 * Transform a JavaScript property into a CSS property.
 */
function hyphenate(propertyName) {
    return propertyName
        .replace(upperCasePattern, propLower)
        .replace(msPattern, '-ms-'); // Internet Explorer vendor prefix.
}
exports.hyphenate = hyphenate;
/**
 * Generate a hash value from a string.
 */
function stringHash(str) {
    var value = 5381;
    var len = str.length;
    while (len--)
        value = (value * 33) ^ str.charCodeAt(len);
    return (value >>> 0).toString(36);
}
exports.stringHash = stringHash;
/**
 * Transform a style string to a CSS string.
 */
function styleToString(key, value) {
    if (typeof value === 'number' && value !== 0 && !CSS_NUMBER[key]) {
        return key + ":" + value + "px";
    }
    return key + ":" + value;
}
/**
 * Sort an array of tuples by first value.
 */
function sortTuples(value) {
    return value.sort(function (a, b) { return a[0] > b[0] ? 1 : -1; });
}
/**
 * Categorize user styles.
 */
function parseStyles(styles, hasNestedStyles) {
    var properties = [];
    var nestedStyles = [];
    var isUnique = false;
    // Sort keys before adding to styles.
    for (var _i = 0, _a = Object.keys(styles); _i < _a.length; _i++) {
        var key = _a[_i];
        var value = styles[key];
        if (value !== null && value !== undefined) {
            if (key === exports.IS_UNIQUE) {
                isUnique = true;
            }
            else if (typeof value === 'object' && !Array.isArray(value)) {
                nestedStyles.push([key.trim(), value]);
            }
            else {
                properties.push([hyphenate(key.trim()), value]);
            }
        }
    }
    return {
        styleString: stringifyProperties(sortTuples(properties)),
        nestedStyles: hasNestedStyles ? nestedStyles : sortTuples(nestedStyles),
        isUnique: isUnique
    };
}
/**
 * Stringify an array of property tuples.
 */
function stringifyProperties(properties) {
    return properties.map(function (_a) {
        var name = _a[0], value = _a[1];
        if (!Array.isArray(value))
            return styleToString(name, value);
        return value.map(function (x) { return styleToString(name, x); }).join(';');
    }).join(';');
}
/**
 * Interpolate CSS selectors.
 */
function interpolate(selector, parent) {
    if (selector.indexOf('&') > -1) {
        return selector.replace(interpolatePattern, parent);
    }
    return parent + " " + selector;
}
/**
 * Recursive loop building styles with deferred selectors.
 */
function stylize(cache, selector, styles, list, parent) {
    var _a = parseStyles(styles, !!selector), styleString = _a.styleString, nestedStyles = _a.nestedStyles, isUnique = _a.isUnique;
    var pid = styleString;
    if (selector.charCodeAt(0) === 64 /* @ */) {
        var rule = cache.add(new Rule(selector, parent ? undefined : styleString, cache.hash));
        // Nested styles support (e.g. `.foo > @media > .bar`).
        if (styleString && parent) {
            var style = rule.add(new Style(styleString, rule.hash, isUnique ? "u" + (++uniqueId).toString(36) : undefined));
            list.push([parent, style]);
        }
        for (var _i = 0, nestedStyles_1 = nestedStyles; _i < nestedStyles_1.length; _i++) {
            var _b = nestedStyles_1[_i], name = _b[0], value = _b[1];
            pid += name + stylize(rule, name, value, list, parent);
        }
    }
    else {
        var key = parent ? interpolate(selector, parent) : selector;
        if (styleString) {
            var style = cache.add(new Style(styleString, cache.hash, isUnique ? "u" + (++uniqueId).toString(36) : undefined));
            list.push([key, style]);
        }
        for (var _c = 0, nestedStyles_2 = nestedStyles; _c < nestedStyles_2.length; _c++) {
            var _d = nestedStyles_2[_c], name = _d[0], value = _d[1];
            pid += name + stylize(cache, name, value, list, key);
        }
    }
    return pid;
}
/**
 * Register all styles, but collect for selector interpolation using the hash.
 */
function composeStyles(container, selector, styles, isStyle, displayName) {
    var cache = new Cache(container.hash);
    var list = [];
    var pid = stylize(cache, selector, styles, list);
    var hash = "f" + cache.hash(pid);
    var id = displayName ? displayName + "_" + hash : hash;
    for (var _i = 0, list_1 = list; _i < list_1.length; _i++) {
        var _a = list_1[_i], selector_1 = _a[0], style = _a[1];
        var key = isStyle ? interpolate(selector_1, "." + exports.escape(id)) : selector_1;
        style.add(new Selector(key, style.hash, undefined, pid));
    }
    return { cache: cache, pid: pid, id: id };
}
/**
 * Cache to list to styles.
 */
function join(arr) {
    var res = '';
    for (var i = 0; i < arr.length; i++)
        res += arr[i];
    return res;
}
/**
 * Noop changes.
 */
var noopChanges = {
    add: function () { return undefined; },
    change: function () { return undefined; },
    remove: function () { return undefined; }
};
/**
 * Implement a cache/event emitter.
 */
var Cache = /** @class */ (function () {
    function Cache(hash, changes) {
        if (hash === void 0) { hash = stringHash; }
        if (changes === void 0) { changes = noopChanges; }
        this.hash = hash;
        this.changes = changes;
        this.sheet = [];
        this.changeId = 0;
        this._keys = [];
        this._children = Object.create(null);
        this._counters = Object.create(null);
    }
    Cache.prototype.add = function (style) {
        var count = this._counters[style.id] || 0;
        var item = this._children[style.id] || style.clone();
        this._counters[style.id] = count + 1;
        if (count === 0) {
            this._children[item.id] = item;
            this._keys.push(item.id);
            this.sheet.push(item.getStyles());
            this.changeId++;
            this.changes.add(item, this._keys.length - 1);
        }
        else {
            // Check if contents are different.
            if (item.getIdentifier() !== style.getIdentifier()) {
                throw new TypeError("Hash collision: " + style.getStyles() + " === " + item.getStyles());
            }
            var oldIndex = this._keys.indexOf(style.id);
            var newIndex = this._keys.length - 1;
            var prevChangeId = this.changeId;
            if (oldIndex !== newIndex) {
                this._keys.splice(oldIndex, 1);
                this._keys.push(style.id);
                this.changeId++;
            }
            if (item instanceof Cache && style instanceof Cache) {
                var prevChangeId_1 = item.changeId;
                item.merge(style);
                if (item.changeId !== prevChangeId_1) {
                    this.changeId++;
                }
            }
            if (this.changeId !== prevChangeId) {
                if (oldIndex === newIndex) {
                    this.sheet.splice(oldIndex, 1, item.getStyles());
                }
                else {
                    this.sheet.splice(oldIndex, 1);
                    this.sheet.splice(newIndex, 0, item.getStyles());
                }
                this.changes.change(item, oldIndex, newIndex);
            }
        }
        return item;
    };
    Cache.prototype.remove = function (style) {
        var count = this._counters[style.id];
        if (count > 0) {
            this._counters[style.id] = count - 1;
            var item = this._children[style.id];
            var index = this._keys.indexOf(item.id);
            if (count === 1) {
                delete this._counters[style.id];
                delete this._children[style.id];
                this._keys.splice(index, 1);
                this.sheet.splice(index, 1);
                this.changeId++;
                this.changes.remove(item, index);
            }
            else if (item instanceof Cache && style instanceof Cache) {
                var prevChangeId = item.changeId;
                item.unmerge(style);
                if (item.changeId !== prevChangeId) {
                    this.sheet.splice(index, 1, item.getStyles());
                    this.changeId++;
                    this.changes.change(item, index, index);
                }
            }
        }
    };
    Cache.prototype.merge = function (cache) {
        for (var _i = 0, _a = cache._keys; _i < _a.length; _i++) {
            var id = _a[_i];
            this.add(cache._children[id]);
        }
        return this;
    };
    Cache.prototype.unmerge = function (cache) {
        for (var _i = 0, _a = cache._keys; _i < _a.length; _i++) {
            var id = _a[_i];
            this.remove(cache._children[id]);
        }
        return this;
    };
    Cache.prototype.clone = function () {
        return new Cache(this.hash).merge(this);
    };
    return Cache;
}());
exports.Cache = Cache;
/**
 * Selector is a dumb class made to represent nested CSS selectors.
 */
var Selector = /** @class */ (function () {
    function Selector(selector, hash, id, pid) {
        if (id === void 0) { id = "s" + hash(selector); }
        if (pid === void 0) { pid = ''; }
        this.selector = selector;
        this.hash = hash;
        this.id = id;
        this.pid = pid;
    }
    Selector.prototype.getStyles = function () {
        return this.selector;
    };
    Selector.prototype.getIdentifier = function () {
        return this.pid + "." + this.selector;
    };
    Selector.prototype.clone = function () {
        return new Selector(this.selector, this.hash, this.id, this.pid);
    };
    return Selector;
}());
exports.Selector = Selector;
/**
 * The style container registers a style string with selectors.
 */
var Style = /** @class */ (function (_super) {
    __extends(Style, _super);
    function Style(style, hash, id) {
        if (id === void 0) { id = "c" + hash(style); }
        var _this = _super.call(this, hash) || this;
        _this.style = style;
        _this.hash = hash;
        _this.id = id;
        return _this;
    }
    Style.prototype.getStyles = function () {
        return this.sheet.join(',') + "{" + this.style + "}";
    };
    Style.prototype.getIdentifier = function () {
        return this.style;
    };
    Style.prototype.clone = function () {
        return new Style(this.style, this.hash, this.id).merge(this);
    };
    return Style;
}(Cache));
exports.Style = Style;
/**
 * Implement rule logic for style output.
 */
var Rule = /** @class */ (function (_super) {
    __extends(Rule, _super);
    function Rule(rule, style, hash, id, pid) {
        if (style === void 0) { style = ''; }
        if (id === void 0) { id = "a" + hash(rule + "." + style); }
        if (pid === void 0) { pid = ''; }
        var _this = _super.call(this, hash) || this;
        _this.rule = rule;
        _this.style = style;
        _this.hash = hash;
        _this.id = id;
        _this.pid = pid;
        return _this;
    }
    Rule.prototype.getStyles = function () {
        return this.rule + "{" + this.style + join(this.sheet) + "}";
    };
    Rule.prototype.getIdentifier = function () {
        return this.pid + "." + this.rule + "." + this.style;
    };
    Rule.prototype.clone = function () {
        return new Rule(this.rule, this.style, this.hash, this.id, this.pid).merge(this);
    };
    return Rule;
}(Cache));
exports.Rule = Rule;
/**
 * The FreeStyle class implements the API for everything else.
 */
var FreeStyle = /** @class */ (function (_super) {
    __extends(FreeStyle, _super);
    function FreeStyle(hash, debug, id, changes) {
        if (hash === void 0) { hash = stringHash; }
        if (debug === void 0) { debug = typeof process !== 'undefined' && process.env['NODE_ENV'] !== 'production'; }
        if (id === void 0) { id = "f" + (++uniqueId).toString(36); }
        var _this = _super.call(this, hash, changes) || this;
        _this.hash = hash;
        _this.debug = debug;
        _this.id = id;
        return _this;
    }
    FreeStyle.prototype.registerStyle = function (styles, displayName) {
        var debugName = this.debug ? displayName : undefined;
        var _a = composeStyles(this, '&', styles, true, debugName), cache = _a.cache, id = _a.id;
        this.merge(cache);
        return id;
    };
    FreeStyle.prototype.registerKeyframes = function (keyframes, displayName) {
        return this.registerHashRule('@keyframes', keyframes, displayName);
    };
    FreeStyle.prototype.registerHashRule = function (prefix, styles, displayName) {
        var debugName = this.debug ? displayName : undefined;
        var _a = composeStyles(this, '', styles, false, debugName), cache = _a.cache, pid = _a.pid, id = _a.id;
        var rule = new Rule(prefix + " " + exports.escape(id), undefined, this.hash, undefined, pid);
        this.add(rule.merge(cache));
        return id;
    };
    FreeStyle.prototype.registerRule = function (rule, styles) {
        this.merge(composeStyles(this, rule, styles, false).cache);
    };
    FreeStyle.prototype.registerCss = function (styles) {
        this.merge(composeStyles(this, '', styles, false).cache);
    };
    FreeStyle.prototype.getStyles = function () {
        return join(this.sheet);
    };
    FreeStyle.prototype.getIdentifier = function () {
        return this.id;
    };
    FreeStyle.prototype.clone = function () {
        return new FreeStyle(this.hash, this.debug, this.id, this.changes).merge(this);
    };
    return FreeStyle;
}(Cache));
exports.FreeStyle = FreeStyle;
/**
 * Exports a simple function to create a new instance.
 */
function create(hash, debug, changes) {
    return new FreeStyle(hash, debug, undefined, changes);
}
exports.create = create;

}).call(this,require('_process'))

},{"_process":109}],100:[function(require,module,exports){
'use strict';

exports.__esModule = true;
var canUseDOM = exports.canUseDOM = !!(typeof window !== 'undefined' && window.document && window.document.createElement);

var addEventListener = exports.addEventListener = function addEventListener(node, event, listener) {
  return node.addEventListener ? node.addEventListener(event, listener, false) : node.attachEvent('on' + event, listener);
};

var removeEventListener = exports.removeEventListener = function removeEventListener(node, event, listener) {
  return node.removeEventListener ? node.removeEventListener(event, listener, false) : node.detachEvent('on' + event, listener);
};

var getConfirmation = exports.getConfirmation = function getConfirmation(message, callback) {
  return callback(window.confirm(message));
}; // eslint-disable-line no-alert

/**
 * Returns true if the HTML5 history API is supported. Taken from Modernizr.
 *
 * https://github.com/Modernizr/Modernizr/blob/master/LICENSE
 * https://github.com/Modernizr/Modernizr/blob/master/feature-detects/history.js
 * changed to avoid false negatives for Windows Phones: https://github.com/reactjs/react-router/issues/586
 */
var supportsHistory = exports.supportsHistory = function supportsHistory() {
  var ua = window.navigator.userAgent;

  if ((ua.indexOf('Android 2.') !== -1 || ua.indexOf('Android 4.0') !== -1) && ua.indexOf('Mobile Safari') !== -1 && ua.indexOf('Chrome') === -1 && ua.indexOf('Windows Phone') === -1) return false;

  return window.history && 'pushState' in window.history;
};

/**
 * Returns true if browser fires popstate on hash change.
 * IE10 and IE11 do not.
 */
var supportsPopStateOnHashChange = exports.supportsPopStateOnHashChange = function supportsPopStateOnHashChange() {
  return window.navigator.userAgent.indexOf('Trident') === -1;
};

/**
 * Returns false if using go(n) with hash history causes a full page reload.
 */
var supportsGoWithoutReloadUsingHash = exports.supportsGoWithoutReloadUsingHash = function supportsGoWithoutReloadUsingHash() {
  return window.navigator.userAgent.indexOf('Firefox') === -1;
};

/**
 * Returns true if a given popstate event is an extraneous WebKit event.
 * Accounts for the fact that Chrome on iOS fires real popstate events
 * containing undefined state when pressing the back button.
 */
var isExtraneousPopstateEvent = exports.isExtraneousPopstateEvent = function isExtraneousPopstateEvent(event) {
  return event.state === undefined && navigator.userAgent.indexOf('CriOS') === -1;
};
},{}],101:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports.locationsAreEqual = exports.createLocation = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _resolvePathname = require('resolve-pathname');

var _resolvePathname2 = _interopRequireDefault(_resolvePathname);

var _valueEqual = require('value-equal');

var _valueEqual2 = _interopRequireDefault(_valueEqual);

var _PathUtils = require('./PathUtils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var createLocation = exports.createLocation = function createLocation(path, state, key, currentLocation) {
  var location = void 0;
  if (typeof path === 'string') {
    // Two-arg form: push(path, state)
    location = (0, _PathUtils.parsePath)(path);
    location.state = state;
  } else {
    // One-arg form: push(location)
    location = _extends({}, path);

    if (location.pathname === undefined) location.pathname = '';

    if (location.search) {
      if (location.search.charAt(0) !== '?') location.search = '?' + location.search;
    } else {
      location.search = '';
    }

    if (location.hash) {
      if (location.hash.charAt(0) !== '#') location.hash = '#' + location.hash;
    } else {
      location.hash = '';
    }

    if (state !== undefined && location.state === undefined) location.state = state;
  }

  try {
    location.pathname = decodeURI(location.pathname);
  } catch (e) {
    if (e instanceof URIError) {
      throw new URIError('Pathname "' + location.pathname + '" could not be decoded. ' + 'This is likely caused by an invalid percent-encoding.');
    } else {
      throw e;
    }
  }

  if (key) location.key = key;

  if (currentLocation) {
    // Resolve incomplete/relative pathname relative to current location.
    if (!location.pathname) {
      location.pathname = currentLocation.pathname;
    } else if (location.pathname.charAt(0) !== '/') {
      location.pathname = (0, _resolvePathname2.default)(location.pathname, currentLocation.pathname);
    }
  } else {
    // When there is no prior location and pathname is empty, set it to /
    if (!location.pathname) {
      location.pathname = '/';
    }
  }

  return location;
};

var locationsAreEqual = exports.locationsAreEqual = function locationsAreEqual(a, b) {
  return a.pathname === b.pathname && a.search === b.search && a.hash === b.hash && a.key === b.key && (0, _valueEqual2.default)(a.state, b.state);
};
},{"./PathUtils":102,"resolve-pathname":110,"value-equal":136}],102:[function(require,module,exports){
'use strict';

exports.__esModule = true;
var addLeadingSlash = exports.addLeadingSlash = function addLeadingSlash(path) {
  return path.charAt(0) === '/' ? path : '/' + path;
};

var stripLeadingSlash = exports.stripLeadingSlash = function stripLeadingSlash(path) {
  return path.charAt(0) === '/' ? path.substr(1) : path;
};

var hasBasename = exports.hasBasename = function hasBasename(path, prefix) {
  return new RegExp('^' + prefix + '(\\/|\\?|#|$)', 'i').test(path);
};

var stripBasename = exports.stripBasename = function stripBasename(path, prefix) {
  return hasBasename(path, prefix) ? path.substr(prefix.length) : path;
};

var stripTrailingSlash = exports.stripTrailingSlash = function stripTrailingSlash(path) {
  return path.charAt(path.length - 1) === '/' ? path.slice(0, -1) : path;
};

var parsePath = exports.parsePath = function parsePath(path) {
  var pathname = path || '/';
  var search = '';
  var hash = '';

  var hashIndex = pathname.indexOf('#');
  if (hashIndex !== -1) {
    hash = pathname.substr(hashIndex);
    pathname = pathname.substr(0, hashIndex);
  }

  var searchIndex = pathname.indexOf('?');
  if (searchIndex !== -1) {
    search = pathname.substr(searchIndex);
    pathname = pathname.substr(0, searchIndex);
  }

  return {
    pathname: pathname,
    search: search === '?' ? '' : search,
    hash: hash === '#' ? '' : hash
  };
};

var createPath = exports.createPath = function createPath(location) {
  var pathname = location.pathname,
      search = location.search,
      hash = location.hash;


  var path = pathname || '/';

  if (search && search !== '?') path += search.charAt(0) === '?' ? search : '?' + search;

  if (hash && hash !== '#') path += hash.charAt(0) === '#' ? hash : '#' + hash;

  return path;
};
},{}],103:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _warning = require('warning');

var _warning2 = _interopRequireDefault(_warning);

var _invariant = require('invariant');

var _invariant2 = _interopRequireDefault(_invariant);

var _LocationUtils = require('./LocationUtils');

var _PathUtils = require('./PathUtils');

var _createTransitionManager = require('./createTransitionManager');

var _createTransitionManager2 = _interopRequireDefault(_createTransitionManager);

var _DOMUtils = require('./DOMUtils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var PopStateEvent = 'popstate';
var HashChangeEvent = 'hashchange';

var getHistoryState = function getHistoryState() {
  try {
    return window.history.state || {};
  } catch (e) {
    // IE 11 sometimes throws when accessing window.history.state
    // See https://github.com/ReactTraining/history/pull/289
    return {};
  }
};

/**
 * Creates a history object that uses the HTML5 history API including
 * pushState, replaceState, and the popstate event.
 */
var createBrowserHistory = function createBrowserHistory() {
  var props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  (0, _invariant2.default)(_DOMUtils.canUseDOM, 'Browser history needs a DOM');

  var globalHistory = window.history;
  var canUseHistory = (0, _DOMUtils.supportsHistory)();
  var needsHashChangeListener = !(0, _DOMUtils.supportsPopStateOnHashChange)();

  var _props$forceRefresh = props.forceRefresh,
      forceRefresh = _props$forceRefresh === undefined ? false : _props$forceRefresh,
      _props$getUserConfirm = props.getUserConfirmation,
      getUserConfirmation = _props$getUserConfirm === undefined ? _DOMUtils.getConfirmation : _props$getUserConfirm,
      _props$keyLength = props.keyLength,
      keyLength = _props$keyLength === undefined ? 6 : _props$keyLength;

  var basename = props.basename ? (0, _PathUtils.stripTrailingSlash)((0, _PathUtils.addLeadingSlash)(props.basename)) : '';

  var getDOMLocation = function getDOMLocation(historyState) {
    var _ref = historyState || {},
        key = _ref.key,
        state = _ref.state;

    var _window$location = window.location,
        pathname = _window$location.pathname,
        search = _window$location.search,
        hash = _window$location.hash;


    var path = pathname + search + hash;

    (0, _warning2.default)(!basename || (0, _PathUtils.hasBasename)(path, basename), 'You are attempting to use a basename on a page whose URL path does not begin ' + 'with the basename. Expected path "' + path + '" to begin with "' + basename + '".');

    if (basename) path = (0, _PathUtils.stripBasename)(path, basename);

    return (0, _LocationUtils.createLocation)(path, state, key);
  };

  var createKey = function createKey() {
    return Math.random().toString(36).substr(2, keyLength);
  };

  var transitionManager = (0, _createTransitionManager2.default)();

  var setState = function setState(nextState) {
    _extends(history, nextState);

    history.length = globalHistory.length;

    transitionManager.notifyListeners(history.location, history.action);
  };

  var handlePopState = function handlePopState(event) {
    // Ignore extraneous popstate events in WebKit.
    if ((0, _DOMUtils.isExtraneousPopstateEvent)(event)) return;

    handlePop(getDOMLocation(event.state));
  };

  var handleHashChange = function handleHashChange() {
    handlePop(getDOMLocation(getHistoryState()));
  };

  var forceNextPop = false;

  var handlePop = function handlePop(location) {
    if (forceNextPop) {
      forceNextPop = false;
      setState();
    } else {
      var action = 'POP';

      transitionManager.confirmTransitionTo(location, action, getUserConfirmation, function (ok) {
        if (ok) {
          setState({ action: action, location: location });
        } else {
          revertPop(location);
        }
      });
    }
  };

  var revertPop = function revertPop(fromLocation) {
    var toLocation = history.location;

    // TODO: We could probably make this more reliable by
    // keeping a list of keys we've seen in sessionStorage.
    // Instead, we just default to 0 for keys we don't know.

    var toIndex = allKeys.indexOf(toLocation.key);

    if (toIndex === -1) toIndex = 0;

    var fromIndex = allKeys.indexOf(fromLocation.key);

    if (fromIndex === -1) fromIndex = 0;

    var delta = toIndex - fromIndex;

    if (delta) {
      forceNextPop = true;
      go(delta);
    }
  };

  var initialLocation = getDOMLocation(getHistoryState());
  var allKeys = [initialLocation.key];

  // Public interface

  var createHref = function createHref(location) {
    return basename + (0, _PathUtils.createPath)(location);
  };

  var push = function push(path, state) {
    (0, _warning2.default)(!((typeof path === 'undefined' ? 'undefined' : _typeof(path)) === 'object' && path.state !== undefined && state !== undefined), 'You should avoid providing a 2nd state argument to push when the 1st ' + 'argument is a location-like object that already has state; it is ignored');

    var action = 'PUSH';
    var location = (0, _LocationUtils.createLocation)(path, state, createKey(), history.location);

    transitionManager.confirmTransitionTo(location, action, getUserConfirmation, function (ok) {
      if (!ok) return;

      var href = createHref(location);
      var key = location.key,
          state = location.state;


      if (canUseHistory) {
        globalHistory.pushState({ key: key, state: state }, null, href);

        if (forceRefresh) {
          window.location.href = href;
        } else {
          var prevIndex = allKeys.indexOf(history.location.key);
          var nextKeys = allKeys.slice(0, prevIndex === -1 ? 0 : prevIndex + 1);

          nextKeys.push(location.key);
          allKeys = nextKeys;

          setState({ action: action, location: location });
        }
      } else {
        (0, _warning2.default)(state === undefined, 'Browser history cannot push state in browsers that do not support HTML5 history');

        window.location.href = href;
      }
    });
  };

  var replace = function replace(path, state) {
    (0, _warning2.default)(!((typeof path === 'undefined' ? 'undefined' : _typeof(path)) === 'object' && path.state !== undefined && state !== undefined), 'You should avoid providing a 2nd state argument to replace when the 1st ' + 'argument is a location-like object that already has state; it is ignored');

    var action = 'REPLACE';
    var location = (0, _LocationUtils.createLocation)(path, state, createKey(), history.location);

    transitionManager.confirmTransitionTo(location, action, getUserConfirmation, function (ok) {
      if (!ok) return;

      var href = createHref(location);
      var key = location.key,
          state = location.state;


      if (canUseHistory) {
        globalHistory.replaceState({ key: key, state: state }, null, href);

        if (forceRefresh) {
          window.location.replace(href);
        } else {
          var prevIndex = allKeys.indexOf(history.location.key);

          if (prevIndex !== -1) allKeys[prevIndex] = location.key;

          setState({ action: action, location: location });
        }
      } else {
        (0, _warning2.default)(state === undefined, 'Browser history cannot replace state in browsers that do not support HTML5 history');

        window.location.replace(href);
      }
    });
  };

  var go = function go(n) {
    globalHistory.go(n);
  };

  var goBack = function goBack() {
    return go(-1);
  };

  var goForward = function goForward() {
    return go(1);
  };

  var listenerCount = 0;

  var checkDOMListeners = function checkDOMListeners(delta) {
    listenerCount += delta;

    if (listenerCount === 1) {
      (0, _DOMUtils.addEventListener)(window, PopStateEvent, handlePopState);

      if (needsHashChangeListener) (0, _DOMUtils.addEventListener)(window, HashChangeEvent, handleHashChange);
    } else if (listenerCount === 0) {
      (0, _DOMUtils.removeEventListener)(window, PopStateEvent, handlePopState);

      if (needsHashChangeListener) (0, _DOMUtils.removeEventListener)(window, HashChangeEvent, handleHashChange);
    }
  };

  var isBlocked = false;

  var block = function block() {
    var prompt = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

    var unblock = transitionManager.setPrompt(prompt);

    if (!isBlocked) {
      checkDOMListeners(1);
      isBlocked = true;
    }

    return function () {
      if (isBlocked) {
        isBlocked = false;
        checkDOMListeners(-1);
      }

      return unblock();
    };
  };

  var listen = function listen(listener) {
    var unlisten = transitionManager.appendListener(listener);
    checkDOMListeners(1);

    return function () {
      checkDOMListeners(-1);
      unlisten();
    };
  };

  var history = {
    length: globalHistory.length,
    action: 'POP',
    location: initialLocation,
    createHref: createHref,
    push: push,
    replace: replace,
    go: go,
    goBack: goBack,
    goForward: goForward,
    block: block,
    listen: listen
  };
}

  return history;
};

exports.default = createBrowserHistory;
},{"./DOMUtils":100,"./LocationUtils":101,"./PathUtils":102,"./createTransitionManager":106,"invariant":108,"warning":137}],104:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _warning = require('warning');

var _warning2 = _interopRequireDefault(_warning);

var _invariant = require('invariant');

var _invariant2 = _interopRequireDefault(_invariant);

var _LocationUtils = require('./LocationUtils');

var _PathUtils = require('./PathUtils');

var _createTransitionManager = require('./createTransitionManager');

var _createTransitionManager2 = _interopRequireDefault(_createTransitionManager);

var _DOMUtils = require('./DOMUtils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var HashChangeEvent = 'hashchange';

var HashPathCoders = {
  hashbang: {
    encodePath: function encodePath(path) {
      return path.charAt(0) === '!' ? path : '!/' + (0, _PathUtils.stripLeadingSlash)(path);
    },
    decodePath: function decodePath(path) {
      return path.charAt(0) === '!' ? path.substr(1) : path;
    }
  },
  noslash: {
    encodePath: _PathUtils.stripLeadingSlash,
    decodePath: _PathUtils.addLeadingSlash
  },
  slash: {
    encodePath: _PathUtils.addLeadingSlash,
    decodePath: _PathUtils.addLeadingSlash
  }
};

var getHashPath = function getHashPath() {
  // We can't use window.location.hash here because it's not
  // consistent across browsers - Firefox will pre-decode it!
  var href = window.location.href;
  var hashIndex = href.indexOf('#');
  return hashIndex === -1 ? '' : href.substring(hashIndex + 1);
};

var pushHashPath = function pushHashPath(path) {
  return window.location.hash = path;
};

var replaceHashPath = function replaceHashPath(path) {
  var hashIndex = window.location.href.indexOf('#');

  window.location.replace(window.location.href.slice(0, hashIndex >= 0 ? hashIndex : 0) + '#' + path);
};

var createHashHistory = function createHashHistory() {
  var props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  (0, _invariant2.default)(_DOMUtils.canUseDOM, 'Hash history needs a DOM');

  var globalHistory = window.history;
  var canGoWithoutReload = (0, _DOMUtils.supportsGoWithoutReloadUsingHash)();

  var _props$getUserConfirm = props.getUserConfirmation,
      getUserConfirmation = _props$getUserConfirm === undefined ? _DOMUtils.getConfirmation : _props$getUserConfirm,
      _props$hashType = props.hashType,
      hashType = _props$hashType === undefined ? 'slash' : _props$hashType;

  var basename = props.basename ? (0, _PathUtils.stripTrailingSlash)((0, _PathUtils.addLeadingSlash)(props.basename)) : '';

  var _HashPathCoders$hashT = HashPathCoders[hashType],
      encodePath = _HashPathCoders$hashT.encodePath,
      decodePath = _HashPathCoders$hashT.decodePath;


  var getDOMLocation = function getDOMLocation() {
    var path = decodePath(getHashPath());

    (0, _warning2.default)(!basename || (0, _PathUtils.hasBasename)(path, basename), 'You are attempting to use a basename on a page whose URL path does not begin ' + 'with the basename. Expected path "' + path + '" to begin with "' + basename + '".');

    if (basename) path = (0, _PathUtils.stripBasename)(path, basename);

    return (0, _LocationUtils.createLocation)(path);
  };

  var transitionManager = (0, _createTransitionManager2.default)();

  var setState = function setState(nextState) {
    _extends(history, nextState);

    history.length = globalHistory.length;

    transitionManager.notifyListeners(history.location, history.action);
  };

  var forceNextPop = false;
  var ignorePath = null;

  var handleHashChange = function handleHashChange() {
    var path = getHashPath();
    var encodedPath = encodePath(path);

    if (path !== encodedPath) {
      // Ensure we always have a properly-encoded hash.
      replaceHashPath(encodedPath);
    } else {
      var location = getDOMLocation();
      var prevLocation = history.location;

      if (!forceNextPop && (0, _LocationUtils.locationsAreEqual)(prevLocation, location)) return; // A hashchange doesn't always == location change.

      if (ignorePath === (0, _PathUtils.createPath)(location)) return; // Ignore this change; we already setState in push/replace.

      ignorePath = null;

      handlePop(location);
    }
  };

  var handlePop = function handlePop(location) {
    if (forceNextPop) {
      forceNextPop = false;
      setState();
    } else {
      var action = 'POP';

      transitionManager.confirmTransitionTo(location, action, getUserConfirmation, function (ok) {
        if (ok) {
          setState({ action: action, location: location });
        } else {
          revertPop(location);
        }
      });
    }
  };

  var revertPop = function revertPop(fromLocation) {
    var toLocation = history.location;

    // TODO: We could probably make this more reliable by
    // keeping a list of paths we've seen in sessionStorage.
    // Instead, we just default to 0 for paths we don't know.

    var toIndex = allPaths.lastIndexOf((0, _PathUtils.createPath)(toLocation));

    if (toIndex === -1) toIndex = 0;

    var fromIndex = allPaths.lastIndexOf((0, _PathUtils.createPath)(fromLocation));

    if (fromIndex === -1) fromIndex = 0;

    var delta = toIndex - fromIndex;

    if (delta) {
      forceNextPop = true;
      go(delta);
    }
  };

  // Ensure the hash is encoded properly before doing anything else.
  var path = getHashPath();
  var encodedPath = encodePath(path);

  if (path !== encodedPath) replaceHashPath(encodedPath);

  var initialLocation = getDOMLocation();
  var allPaths = [(0, _PathUtils.createPath)(initialLocation)];

  // Public interface

  var createHref = function createHref(location) {
    return '#' + encodePath(basename + (0, _PathUtils.createPath)(location));
  };

  var push = function push(path, state) {
    (0, _warning2.default)(state === undefined, 'Hash history cannot push state; it is ignored');

    var action = 'PUSH';
    var location = (0, _LocationUtils.createLocation)(path, undefined, undefined, history.location);

    transitionManager.confirmTransitionTo(location, action, getUserConfirmation, function (ok) {
      if (!ok) return;

      var path = (0, _PathUtils.createPath)(location);
      var encodedPath = encodePath(basename + path);
      var hashChanged = getHashPath() !== encodedPath;

      if (hashChanged) {
        // We cannot tell if a hashchange was caused by a PUSH, so we'd
        // rather setState here and ignore the hashchange. The caveat here
        // is that other hash histories in the page will consider it a POP.
        ignorePath = path;
        pushHashPath(encodedPath);

        var prevIndex = allPaths.lastIndexOf((0, _PathUtils.createPath)(history.location));
        var nextPaths = allPaths.slice(0, prevIndex === -1 ? 0 : prevIndex + 1);

        nextPaths.push(path);
        allPaths = nextPaths;

        setState({ action: action, location: location });
      } else {
        (0, _warning2.default)(false, 'Hash history cannot PUSH the same path; a new entry will not be added to the history stack');

        setState();
      }
    });
  };

  var replace = function replace(path, state) {
    (0, _warning2.default)(state === undefined, 'Hash history cannot replace state; it is ignored');

    var action = 'REPLACE';
    var location = (0, _LocationUtils.createLocation)(path, undefined, undefined, history.location);

    transitionManager.confirmTransitionTo(location, action, getUserConfirmation, function (ok) {
      if (!ok) return;

      var path = (0, _PathUtils.createPath)(location);
      var encodedPath = encodePath(basename + path);
      var hashChanged = getHashPath() !== encodedPath;

      if (hashChanged) {
        // We cannot tell if a hashchange was caused by a REPLACE, so we'd
        // rather setState here and ignore the hashchange. The caveat here
        // is that other hash histories in the page will consider it a POP.
        ignorePath = path;
        replaceHashPath(encodedPath);
      }

      var prevIndex = allPaths.indexOf((0, _PathUtils.createPath)(history.location));

      if (prevIndex !== -1) allPaths[prevIndex] = path;

      setState({ action: action, location: location });
    });
  };

  var go = function go(n) {
    (0, _warning2.default)(canGoWithoutReload, 'Hash history go(n) causes a full page reload in this browser');

    globalHistory.go(n);
  };

  var goBack = function goBack() {
    return go(-1);
  };

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

  var listenerCount = 0;

  var checkDOMListeners = function checkDOMListeners(delta) {
    listenerCount += delta;

    if (listenerCount === 1) {
      (0, _DOMUtils.addEventListener)(window, HashChangeEvent, handleHashChange);
    } else if (listenerCount === 0) {
      (0, _DOMUtils.removeEventListener)(window, HashChangeEvent, handleHashChange);
    }
  };

  var isBlocked = false;

  var block = function block() {
    var prompt = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

    var unblock = transitionManager.setPrompt(prompt);

    if (!isBlocked) {
      checkDOMListeners(1);
      isBlocked = true;
    }

    return function () {
      if (isBlocked) {
        isBlocked = false;
        checkDOMListeners(-1);
      }

      return unblock();
    };
  };

  var listen = function listen(listener) {
    var unlisten = transitionManager.appendListener(listener);
    checkDOMListeners(1);

    return function () {
      checkDOMListeners(-1);
      unlisten();
    };
  };

  var history = {
    length: globalHistory.length,
    action: 'POP',
    location: initialLocation,
    createHref: createHref,
    push: push,
    replace: replace,
    go: go,
    goBack: goBack,
    goForward: goForward,
    block: block,
    listen: listen
  };

  return history;
};

exports.default = createHashHistory;
},{"./DOMUtils":100,"./LocationUtils":101,"./PathUtils":102,"./createTransitionManager":106,"invariant":108,"warning":137}],105:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function encoderForArrayFormat(opts) {
	switch (opts.arrayFormat) {
		case 'index':
			return function (key, value, index) {
				return value === null ? [
					encode(key, opts),
					'[',
					index,
					']'
				].join('') : [
					encode(key, opts),
					'[',
					encode(index, opts),
					']=',
					encode(value, opts)
				].join('');
			};

		case 'bracket':
			return function (key, value) {
				return value === null ? encode(key, opts) : [
					encode(key, opts),
					'[]=',
					encode(value, opts)
				].join('');
			};

		default:
			return function (key, value) {
				return value === null ? encode(key, opts) : [
					encode(key, opts),
					'=',
					encode(value, opts)
				].join('');
			};
	}
}

function parserForArrayFormat(opts) {
	var result;

	switch (opts.arrayFormat) {
		case 'index':
			return function (key, value, accumulator) {
				result = /\[(\d*)\]$/.exec(key);

var _PathUtils = require('./PathUtils');

var _LocationUtils = require('./LocationUtils');

var _createTransitionManager = require('./createTransitionManager');

var _createTransitionManager2 = _interopRequireDefault(_createTransitionManager);

		default:
			return function (key, value, accumulator) {
				if (accumulator[key] === undefined) {
					accumulator[key] = value;
					return;
				}

var clamp = function clamp(n, lowerBound, upperBound) {
  return Math.min(Math.max(n, lowerBound), upperBound);
};

/**
 * Creates a history object that stores locations in memory.
 */
var createMemoryHistory = function createMemoryHistory() {
  var props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var getUserConfirmation = props.getUserConfirmation,
      _props$initialEntries = props.initialEntries,
      initialEntries = _props$initialEntries === undefined ? ['/'] : _props$initialEntries,
      _props$initialIndex = props.initialIndex,
      initialIndex = _props$initialIndex === undefined ? 0 : _props$initialIndex,
      _props$keyLength = props.keyLength,
      keyLength = _props$keyLength === undefined ? 6 : _props$keyLength;


  var transitionManager = (0, _createTransitionManager2.default)();

  var setState = function setState(nextState) {
    _extends(history, nextState);

    history.length = history.entries.length;

    transitionManager.notifyListeners(history.location, history.action);
  };

  var createKey = function createKey() {
    return Math.random().toString(36).substr(2, keyLength);
  };

  var index = clamp(initialIndex, 0, initialEntries.length - 1);
  var entries = initialEntries.map(function (entry) {
    return typeof entry === 'string' ? (0, _LocationUtils.createLocation)(entry, undefined, createKey()) : (0, _LocationUtils.createLocation)(entry, undefined, entry.key || createKey());
  });

  // Public interface

  var createHref = _PathUtils.createPath;

  var push = function push(path, state) {
    (0, _warning2.default)(!((typeof path === 'undefined' ? 'undefined' : _typeof(path)) === 'object' && path.state !== undefined && state !== undefined), 'You should avoid providing a 2nd state argument to push when the 1st ' + 'argument is a location-like object that already has state; it is ignored');

    var action = 'PUSH';
    var location = (0, _LocationUtils.createLocation)(path, state, createKey(), history.location);

    transitionManager.confirmTransitionTo(location, action, getUserConfirmation, function (ok) {
      if (!ok) return;

      var prevIndex = history.index;
      var nextIndex = prevIndex + 1;

      var nextEntries = history.entries.slice(0);
      if (nextEntries.length > nextIndex) {
        nextEntries.splice(nextIndex, nextEntries.length - nextIndex, location);
      } else {
        nextEntries.push(location);
      }

      setState({
        action: action,
        location: location,
        index: nextIndex,
        entries: nextEntries
      });
    });
  };

  var replace = function replace(path, state) {
    (0, _warning2.default)(!((typeof path === 'undefined' ? 'undefined' : _typeof(path)) === 'object' && path.state !== undefined && state !== undefined), 'You should avoid providing a 2nd state argument to replace when the 1st ' + 'argument is a location-like object that already has state; it is ignored');

    var action = 'REPLACE';
    var location = (0, _LocationUtils.createLocation)(path, state, createKey(), history.location);

    transitionManager.confirmTransitionTo(location, action, getUserConfirmation, function (ok) {
      if (!ok) return;

      history.entries[history.index] = location;

      setState({ action: action, location: location });
    });
  };

  var go = function go(n) {
    var nextIndex = clamp(history.index + n, 0, history.entries.length - 1);

    var action = 'POP';
    var location = history.entries[nextIndex];

    transitionManager.confirmTransitionTo(location, action, getUserConfirmation, function (ok) {
      if (ok) {
        setState({
          action: action,
          location: location,
          index: nextIndex
        });
      } else {
        // Mimic the behavior of DOM histories by
        // causing a render after a cancelled POP.
        setState();
      }
    });
  };

  var goBack = function goBack() {
    return go(-1);
  };

  var goForward = function goForward() {
    return go(1);
  };

  var canGo = function canGo(n) {
    var nextIndex = history.index + n;
    return nextIndex >= 0 && nextIndex < history.entries.length;
  };

  var block = function block() {
    var prompt = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
    return transitionManager.setPrompt(prompt);
  };

  var listen = function listen(listener) {
    return transitionManager.appendListener(listener);
  };

  var history = {
    length: entries.length,
    action: 'POP',
    location: entries[index],
    index: index,
    entries: entries,
    createHref: createHref,
    push: push,
    replace: replace,
    go: go,
    goBack: goBack,
    goForward: goForward,
    canGo: canGo,
    block: block,
    listen: listen
  };

  return history;
};

exports.default = createMemoryHistory;
},{"./LocationUtils":101,"./PathUtils":102,"./createTransitionManager":106,"warning":137}],106:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _browserSplit = require('browser-split');

var _browserSplit2 = _interopRequireDefault(_browserSplit);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var createTransitionManager = function createTransitionManager() {
  var prompt = null;

  var setPrompt = function setPrompt(nextPrompt) {
    (0, _warning2.default)(prompt == null, 'A history supports only one prompt at a time');

    prompt = nextPrompt;

    return function () {
      if (prompt === nextPrompt) prompt = null;
    };
  };

  var confirmTransitionTo = function confirmTransitionTo(location, action, getUserConfirmation, callback) {
    // TODO: If another transition starts while we're still confirming
    // the previous one, we may end up in a weird state. Figure out the
    // best way to handle this.
    if (prompt != null) {
      var result = typeof prompt === 'function' ? prompt(location, action) : prompt;

      if (typeof result === 'string') {
        if (typeof getUserConfirmation === 'function') {
          getUserConfirmation(result, callback);
        } else {
          (0, _warning2.default)(false, 'A history needs a getUserConfirmation function in order to use a prompt message');

          callback(true);
        }
      } else {
        // Return false from a transition hook to cancel the transition.
        callback(result !== false);
      }
    } else {
      callback(true);
    }
  };

  var listeners = [];

  var appendListener = function appendListener(fn) {
    var isActive = true;

    var listener = function listener() {
      if (isActive) fn.apply(undefined, arguments);
    };

    listeners.push(listener);

    return function () {
      isActive = false;
      listeners = listeners.filter(function (item) {
        return item !== listener;
      });
    };
  };

  var notifyListeners = function notifyListeners() {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    listeners.forEach(function (listener) {
      return listener.apply(undefined, args);
    });
  };

  return {
    setPrompt: setPrompt,
    confirmTransitionTo: confirmTransitionTo,
    appendListener: appendListener,
    notifyListeners: notifyListeners
  };
};

exports.default = createTransitionManager;
},{"warning":137}],107:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports.createPath = exports.parsePath = exports.locationsAreEqual = exports.createLocation = exports.createMemoryHistory = exports.createHashHistory = exports.createBrowserHistory = undefined;

var _LocationUtils = require('./LocationUtils');

Object.defineProperty(exports, 'createLocation', {
  enumerable: true,
  get: function get() {
    return _LocationUtils.createLocation;
  }
});
Object.defineProperty(exports, 'locationsAreEqual', {
  enumerable: true,
  get: function get() {
    return _LocationUtils.locationsAreEqual;
  }
});

var _PathUtils = require('./PathUtils');

Object.defineProperty(exports, 'parsePath', {
  enumerable: true,
  get: function get() {
    return _PathUtils.parsePath;
  }
});
Object.defineProperty(exports, 'createPath', {
  enumerable: true,
  get: function get() {
    return _PathUtils.createPath;
  }
});

var _createBrowserHistory2 = require('./createBrowserHistory');

var _createBrowserHistory3 = _interopRequireDefault(_createBrowserHistory2);

var _createHashHistory2 = require('./createHashHistory');

var _createHashHistory3 = _interopRequireDefault(_createHashHistory2);

var _createMemoryHistory2 = require('./createMemoryHistory');

var _createMemoryHistory3 = _interopRequireDefault(_createMemoryHistory2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.createBrowserHistory = _createBrowserHistory3.default;
exports.createHashHistory = _createHashHistory3.default;
exports.createMemoryHistory = _createMemoryHistory3.default;
},{"./LocationUtils":101,"./PathUtils":102,"./createBrowserHistory":103,"./createHashHistory":104,"./createMemoryHistory":105}],108:[function(require,module,exports){
(function (process){
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

/**
 * Use invariant() to assert state which your program assumes to be true.
 *
 * Provide sprintf-style format (only %s is supported) and arguments
 * to provide information about what broke and what you were
 * expecting.
 *
 * The invariant message will be stripped in production, but the invariant
 * will remain to ensure logic does not differ in production.
 */

var invariant = function(condition, format, a, b, c, d, e, f) {
  if (process.env.NODE_ENV !== 'production') {
    if (format === undefined) {
      throw new Error('invariant requires an error message argument');
    }
  }

  if (!condition) {
    var error;
    if (format === undefined) {
      error = new Error(
        'Minified exception occurred; use the non-minified dev environment ' +
        'for the full error message and additional helpful warnings.'
      );
    } else {
      var args = [a, b, c, d, e, f];
      var argIndex = 0;
      error = new Error(
        format.replace(/%s/g, function() { return args[argIndex++]; })
      );
      error.name = 'Invariant Violation';
    }

    error.framesToPop = 1; // we don't care about invariant's own frame
    throw error;
  }
};

module.exports = invariant;

}).call(this,require('_process'))

},{"_process":109}],109:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],110:[function(require,module,exports){
'use strict';

exports.__esModule = true;
function isAbsolute(pathname) {
  return pathname.charAt(0) === '/';
}

// About 1.5x faster than the two-arg version of Array#splice()
function spliceOne(list, index) {
  for (var i = index, k = i + 1, n = list.length; k < n; i += 1, k += 1) {
    list[i] = list[k];
  }

  list.pop();
}

// This implementation is based heavily on node's url.parse
function resolvePathname(to) {
  var from = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';

  var toParts = to && to.split('/') || [];
  var fromParts = from && from.split('/') || [];

  var isToAbs = to && isAbsolute(to);
  var isFromAbs = from && isAbsolute(from);
  var mustEndAbs = isToAbs || isFromAbs;

  if (to && isAbsolute(to)) {
    // to is absolute
    fromParts = toParts;
  } else if (toParts.length) {
    // to is relative, drop the filename
    fromParts.pop();
    fromParts = fromParts.concat(toParts);
  }

  if (!fromParts.length) return '/';

  var hasTrailingSlash = void 0;
  if (fromParts.length) {
    var last = fromParts[fromParts.length - 1];
    hasTrailingSlash = last === '.' || last === '..' || last === '';
  } else {
    hasTrailingSlash = false;
  }

  var up = 0;
  for (var i = fromParts.length; i >= 0; i--) {
    var part = fromParts[i];

    if (part === '.') {
      spliceOne(fromParts, i);
    } else if (part === '..') {
      spliceOne(fromParts, i);
      up++;
    } else if (up) {
      spliceOne(fromParts, i);
      up--;
    }
  }

  if (!mustEndAbs) for (; up--; up) {
    fromParts.unshift('..');
  }if (mustEndAbs && fromParts[0] !== '' && (!fromParts[0] || !isAbsolute(fromParts[0]))) fromParts.unshift('');

  var result = fromParts.join('/');

  if (hasTrailingSlash && result.substr(-1) !== '/') result += '/';

  return result;
}

exports.default = resolvePathname;
module.exports = exports['default'];
},{}],111:[function(require,module,exports){
"use strict";
var selectorParser_1 = require('./selectorParser');
function classNameFromVNode(vNode) {
    var _a = selectorParser_1.selectorParser(vNode).className, cn = _a === void 0 ? '' : _a;
    if (!vNode.data) {
        return cn;
    }
    var _b = vNode.data, dataClass = _b.class, props = _b.props;
    if (dataClass) {
        var c = Object.keys(dataClass)
            .filter(function (cl) { return dataClass[cl]; });
        cn += " " + c.join(" ");
    }
    if (props && props.className) {
        cn += " " + props.className;
    }
    return cn && cn.trim();
}
exports.classNameFromVNode = classNameFromVNode;

},{"./selectorParser":112}],112:[function(require,module,exports){
"use strict";
function selectorParser(node) {
    if (!node.sel) {
        return {
            tagName: '',
            id: '',
            className: '',
        };
    }
    var sel = node.sel;
    var hashIdx = sel.indexOf('#');
    var dotIdx = sel.indexOf('.', hashIdx);
    var hash = hashIdx > 0 ? hashIdx : sel.length;
    var dot = dotIdx > 0 ? dotIdx : sel.length;
    var tagName = hashIdx !== -1 || dotIdx !== -1 ?
        sel.slice(0, Math.min(hash, dot)) :
        sel;
    var id = hash < dot ? sel.slice(hash + 1, dot) : void 0;
    var className = dotIdx > 0 ? sel.slice(dot + 1).replace(/\./g, ' ') : void 0;
    return {
        tagName: tagName,
        id: id,
        className: className,
    };
}
exports.selectorParser = selectorParser;

},{}],113:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("./utils");
var removeElement = function (styleElementSelector) {
    var previousStyleTarget = document.querySelector(styleElementSelector);
    if (previousStyleTarget) {
        previousStyleTarget.remove();
    }
};
var makeDomUpdater = function (styleElementSelector) {
    if (styleElementSelector === void 0) { styleElementSelector = undefined; }
    return function (oldNode, newNode) {
        utils_1.updateVNode(newNode);
        if (typeof styleElementSelector !== 'undefined') {
            removeElement(styleElementSelector);
        }
    };
};
exports.makeModule = function (styleElementSelector) {
    if (styleElementSelector === void 0) { styleElementSelector = undefined; }
    // Serverside styles are only removed the first time updateDOM is called
    var domUpdater = utils_1.alternateFirstInvocation(function () { return makeDomUpdater(styleElementSelector); }, function () { return makeDomUpdater(); });
    var updateDOM = function (oldNode, newNode) { return domUpdater.next().value(oldNode, newNode); };
    return {
        create: updateDOM,
        update: updateDOM
    };
};
exports.default = exports.makeModule();

},{"./utils":116}],114:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var typestyle_1 = require("typestyle");
var utils_1 = require("./utils");
exports.serverSideCssModule = function (node, attributes) {
    return utils_1.updateVNode(node);
};
exports.collectStyles = function (node) {
    var instance = typestyle_1.createTypeStyle();
    exports.traverseVNode(node, instance);
    return instance.getStyles();
};
exports.traverseVNode = function (node, instance) {
    var data = node.data;
    if (data.css) {
        instance.style(data.css);
    }
    if (node.children) {
        node.children.forEach(function (child) { return exports.traverseVNode(child, instance); });
    }
};

},{"./utils":116,"typestyle":131}],115:[function(require,module,exports){
"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("./client");
__export(require("./server"));
exports.makeClientSideCssModule = client_1.makeModule;
exports.default = client_1.default;

},{"./client":113,"./server":114}],116:[function(require,module,exports){
"use strict";
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var typestyle_1 = require("typestyle");
exports.updateVNode = function (vnode) {
    var data = vnode.data;
    if (data.css) {
        data.class = data.class || {};
        data.class[typestyle_1.style(data.css)] = true;
    }
};
function alternateFirstInvocation(first, subsequent) {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, first()];
            case 1:
                _a.sent();
                _a.label = 2;
            case 2:
                if (!true) return [3 /*break*/, 4];
                return [4 /*yield*/, subsequent()];
            case 3:
                _a.sent();
                return [3 /*break*/, 2];
            case 4: return [2 /*return*/];
        }
    });
}
exports.alternateFirstInvocation = alternateFirstInvocation;

},{"typestyle":131}],117:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vnode_1 = require("./vnode");
var is = require("./is");
function addNS(data, children, sel) {
    data.ns = 'http://www.w3.org/2000/svg';
    if (sel !== 'foreignObject' && children !== undefined) {
        for (var i = 0; i < children.length; ++i) {
            var childData = children[i].data;
            if (childData !== undefined) {
                addNS(childData, children[i].children, children[i].sel);
            }
        }
    }
}
function h(sel, b, c) {
    var data = {}, children, text, i;
    if (c !== undefined) {
        data = b;
        if (is.array(c)) {
            children = c;
        }
        else if (is.primitive(c)) {
            text = c;
        }
        else if (c && c.sel) {
            children = [c];
        }
    }
    else if (b !== undefined) {
        if (is.array(b)) {
            children = b;
        }
        else if (is.primitive(b)) {
            text = b;
        }
        else if (b && b.sel) {
            children = [b];
        }
        else {
            data = b;
        }
    }
    if (is.array(children)) {
        for (i = 0; i < children.length; ++i) {
            if (is.primitive(children[i]))
                children[i] = vnode_1.vnode(undefined, undefined, undefined, children[i]);
        }
    }
    if (sel[0] === 's' && sel[1] === 'v' && sel[2] === 'g' &&
        (sel.length === 3 || sel[3] === '.' || sel[3] === '#')) {
        addNS(data, children, sel);
    }
    return vnode_1.vnode(sel, data, children, text, undefined);
}
exports.h = h;
;
exports.default = h;

},{"./is":119,"./vnode":128}],118:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function createElement(tagName) {
    return document.createElement(tagName);
}
function createElementNS(namespaceURI, qualifiedName) {
    return document.createElementNS(namespaceURI, qualifiedName);
}
function createTextNode(text) {
    return document.createTextNode(text);
}
function createComment(text) {
    return document.createComment(text);
}
function insertBefore(parentNode, newNode, referenceNode) {
    parentNode.insertBefore(newNode, referenceNode);
}
function removeChild(node, child) {
    node.removeChild(child);
}
function appendChild(node, child) {
    node.appendChild(child);
}
function parentNode(node) {
    return node.parentNode;
}
function nextSibling(node) {
    return node.nextSibling;
}
function tagName(elm) {
    return elm.tagName;
}
function setTextContent(node, text) {
    node.textContent = text;
}
function getTextContent(node) {
    return node.textContent;
}
function isElement(node) {
    return node.nodeType === 1;
}
function isText(node) {
    return node.nodeType === 3;
}
function isComment(node) {
    return node.nodeType === 8;
}
exports.htmlDomApi = {
    createElement: createElement,
    createElementNS: createElementNS,
    createTextNode: createTextNode,
    createComment: createComment,
    insertBefore: insertBefore,
    removeChild: removeChild,
    appendChild: appendChild,
    parentNode: parentNode,
    nextSibling: nextSibling,
    tagName: tagName,
    setTextContent: setTextContent,
    getTextContent: getTextContent,
    isElement: isElement,
    isText: isText,
    isComment: isComment,
};
exports.default = exports.htmlDomApi;

},{}],119:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.array = Array.isArray;
function primitive(s) {
    return typeof s === 'string' || typeof s === 'number';
}
exports.primitive = primitive;

},{}],120:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var xlinkNS = 'http://www.w3.org/1999/xlink';
var xmlNS = 'http://www.w3.org/XML/1998/namespace';
var colonChar = 58;
var xChar = 120;
function updateAttrs(oldVnode, vnode) {
    var key, elm = vnode.elm, oldAttrs = oldVnode.data.attrs, attrs = vnode.data.attrs;
    if (!oldAttrs && !attrs)
        return;
    if (oldAttrs === attrs)
        return;
    oldAttrs = oldAttrs || {};
    attrs = attrs || {};
    // update modified attributes, add new attributes
    for (key in attrs) {
        var cur = attrs[key];
        var old = oldAttrs[key];
        if (old !== cur) {
            if (cur === true) {
                elm.setAttribute(key, "");
            }
            else if (cur === false) {
                elm.removeAttribute(key);
            }
            else {
                if (key.charCodeAt(0) !== xChar) {
                    elm.setAttribute(key, cur);
                }
                else if (key.charCodeAt(3) === colonChar) {
                    // Assume xml namespace
                    elm.setAttributeNS(xmlNS, key, cur);
                }
                else if (key.charCodeAt(5) === colonChar) {
                    // Assume xlink namespace
                    elm.setAttributeNS(xlinkNS, key, cur);
                }
                else {
                    elm.setAttribute(key, cur);
                }
            }
        }
    }
    // remove removed attributes
    // use `in` operator since the previous `for` iteration uses it (.i.e. add even attributes with undefined value)
    // the other option is to remove all attributes with value == undefined
    for (key in oldAttrs) {
        if (!(key in attrs)) {
            elm.removeAttribute(key);
        }
    }
}
exports.attributesModule = { create: updateAttrs, update: updateAttrs };
exports.default = exports.attributesModule;

},{}],121:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function updateClass(oldVnode, vnode) {
    var cur, name, elm = vnode.elm, oldClass = oldVnode.data.class, klass = vnode.data.class;
    if (!oldClass && !klass)
        return;
    if (oldClass === klass)
        return;
    oldClass = oldClass || {};
    klass = klass || {};
    for (name in oldClass) {
        if (!klass[name]) {
            elm.classList.remove(name);
        }
    }
    for (name in klass) {
        cur = klass[name];
        if (cur !== oldClass[name]) {
            elm.classList[cur ? 'add' : 'remove'](name);
        }
    }
}
exports.classModule = { create: updateClass, update: updateClass };
exports.default = exports.classModule;

},{}],122:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var CAPS_REGEX = /[A-Z]/g;
function updateDataset(oldVnode, vnode) {
    var elm = vnode.elm, oldDataset = oldVnode.data.dataset, dataset = vnode.data.dataset, key;
    if (!oldDataset && !dataset)
        return;
    if (oldDataset === dataset)
        return;
    oldDataset = oldDataset || {};
    dataset = dataset || {};
    var d = elm.dataset;
    for (key in oldDataset) {
        if (!dataset[key]) {
            if (d) {
                if (key in d) {
                    delete d[key];
                }
            }
            else {
                elm.removeAttribute('data-' + key.replace(CAPS_REGEX, '-$&').toLowerCase());
            }
        }
    }
    for (key in dataset) {
        if (oldDataset[key] !== dataset[key]) {
            if (d) {
                d[key] = dataset[key];
            }
            else {
                elm.setAttribute('data-' + key.replace(CAPS_REGEX, '-$&').toLowerCase(), dataset[key]);
            }
        }
    }
}
exports.datasetModule = { create: updateDataset, update: updateDataset };
exports.default = exports.datasetModule;

},{}],123:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function updateProps(oldVnode, vnode) {
    var key, cur, old, elm = vnode.elm, oldProps = oldVnode.data.props, props = vnode.data.props;
    if (!oldProps && !props)
        return;
    if (oldProps === props)
        return;
    oldProps = oldProps || {};
    props = props || {};
    for (key in oldProps) {
        if (!props[key]) {
            delete elm[key];
        }
    }
    for (key in props) {
        cur = props[key];
        old = oldProps[key];
        if (old !== cur && (key !== 'value' || elm[key] !== cur)) {
            elm[key] = cur;
        }
    }
}
exports.propsModule = { create: updateProps, update: updateProps };
exports.default = exports.propsModule;

},{}],124:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var raf = (typeof window !== 'undefined' && window.requestAnimationFrame) || setTimeout;
var nextFrame = function (fn) { raf(function () { raf(fn); }); };
function setNextFrame(obj, prop, val) {
    nextFrame(function () { obj[prop] = val; });
}
function updateStyle(oldVnode, vnode) {
    var cur, name, elm = vnode.elm, oldStyle = oldVnode.data.style, style = vnode.data.style;
    if (!oldStyle && !style)
        return;
    if (oldStyle === style)
        return;
    oldStyle = oldStyle || {};
    style = style || {};
    var oldHasDel = 'delayed' in oldStyle;
    for (name in oldStyle) {
        if (!style[name]) {
            if (name[0] === '-' && name[1] === '-') {
                elm.style.removeProperty(name);
            }
            else {
                elm.style[name] = '';
            }
        }
    }
    for (name in style) {
        cur = style[name];
        if (name === 'delayed' && style.delayed) {
            for (var name2 in style.delayed) {
                cur = style.delayed[name2];
                if (!oldHasDel || cur !== oldStyle.delayed[name2]) {
                    setNextFrame(elm.style, name2, cur);
                }
            }
        }
        else if (name !== 'remove' && cur !== oldStyle[name]) {
            if (name[0] === '-' && name[1] === '-') {
                elm.style.setProperty(name, cur);
            }
            else {
                elm.style[name] = cur;
            }
        }
    }
}
function applyDestroyStyle(vnode) {
    var style, name, elm = vnode.elm, s = vnode.data.style;
    if (!s || !(style = s.destroy))
        return;
    for (name in style) {
        elm.style[name] = style[name];
    }
}
function applyRemoveStyle(vnode, rm) {
    var s = vnode.data.style;
    if (!s || !s.remove) {
        rm();
        return;
    }
    var name, elm = vnode.elm, i = 0, compStyle, style = s.remove, amount = 0, applied = [];
    for (name in style) {
        applied.push(name);
        elm.style[name] = style[name];
    }
    compStyle = getComputedStyle(elm);
    var props = compStyle['transition-property'].split(', ');
    for (; i < props.length; ++i) {
        if (applied.indexOf(props[i]) !== -1)
            amount++;
    }
    elm.addEventListener('transitionend', function (ev) {
        if (ev.target === elm)
            --amount;
        if (amount === 0)
            rm();
    });
}
exports.styleModule = {
    create: updateStyle,
    update: updateStyle,
    destroy: applyDestroyStyle,
    remove: applyRemoveStyle
};
exports.default = exports.styleModule;

},{}],125:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vnode_1 = require("./vnode");
var is = require("./is");
var htmldomapi_1 = require("./htmldomapi");
function isUndef(s) { return s === undefined; }
function isDef(s) { return s !== undefined; }
var emptyNode = vnode_1.default('', {}, [], undefined, undefined);
function sameVnode(vnode1, vnode2) {
    return vnode1.key === vnode2.key && vnode1.sel === vnode2.sel;
}
function isVnode(vnode) {
    return vnode.sel !== undefined;
}
function createKeyToOldIdx(children, beginIdx, endIdx) {
    var i, map = {}, key, ch;
    for (i = beginIdx; i <= endIdx; ++i) {
        ch = children[i];
        if (ch != null) {
            key = ch.key;
            if (key !== undefined)
                map[key] = i;
        }
    }
    return map;
}
var hooks = ['create', 'update', 'remove', 'destroy', 'pre', 'post'];
var h_1 = require("./h");
exports.h = h_1.h;
var thunk_1 = require("./thunk");
exports.thunk = thunk_1.thunk;
function init(modules, domApi) {
    var i, j, cbs = {};
    var api = domApi !== undefined ? domApi : htmldomapi_1.default;
    for (i = 0; i < hooks.length; ++i) {
        cbs[hooks[i]] = [];
        for (j = 0; j < modules.length; ++j) {
            var hook = modules[j][hooks[i]];
            if (hook !== undefined) {
                cbs[hooks[i]].push(hook);
            }
        }
    }
    function emptyNodeAt(elm) {
        var id = elm.id ? '#' + elm.id : '';
        var c = elm.className ? '.' + elm.className.split(' ').join('.') : '';
        return vnode_1.default(api.tagName(elm).toLowerCase() + id + c, {}, [], undefined, elm);
    }
    function createRmCb(childElm, listeners) {
        return function rmCb() {
            if (--listeners === 0) {
                var parent_1 = api.parentNode(childElm);
                api.removeChild(parent_1, childElm);
            }
        };
    }
    function createElm(vnode, insertedVnodeQueue) {
        var i, data = vnode.data;
        if (data !== undefined) {
            if (isDef(i = data.hook) && isDef(i = i.init)) {
                i(vnode);
                data = vnode.data;
            }
        }
        var children = vnode.children, sel = vnode.sel;
        if (sel === '!') {
            if (isUndef(vnode.text)) {
                vnode.text = '';
            }
            vnode.elm = api.createComment(vnode.text);
        }
        else if (sel !== undefined) {
            // Parse selector
            var hashIdx = sel.indexOf('#');
            var dotIdx = sel.indexOf('.', hashIdx);
            var hash = hashIdx > 0 ? hashIdx : sel.length;
            var dot = dotIdx > 0 ? dotIdx : sel.length;
            var tag = hashIdx !== -1 || dotIdx !== -1 ? sel.slice(0, Math.min(hash, dot)) : sel;
            var elm = vnode.elm = isDef(data) && isDef(i = data.ns) ? api.createElementNS(i, tag)
                : api.createElement(tag);
            if (hash < dot)
                elm.setAttribute('id', sel.slice(hash + 1, dot));
            if (dotIdx > 0)
                elm.setAttribute('class', sel.slice(dot + 1).replace(/\./g, ' '));
            for (i = 0; i < cbs.create.length; ++i)
                cbs.create[i](emptyNode, vnode);
            if (is.array(children)) {
                for (i = 0; i < children.length; ++i) {
                    var ch = children[i];
                    if (ch != null) {
                        api.appendChild(elm, createElm(ch, insertedVnodeQueue));
                    }
                }
            }
            else if (is.primitive(vnode.text)) {
                api.appendChild(elm, api.createTextNode(vnode.text));
            }
            i = vnode.data.hook; // Reuse variable
            if (isDef(i)) {
                if (i.create)
                    i.create(emptyNode, vnode);
                if (i.insert)
                    insertedVnodeQueue.push(vnode);
            }
        }
        else {
            vnode.elm = api.createTextNode(vnode.text);
        }
        return vnode.elm;
    }
    function addVnodes(parentElm, before, vnodes, startIdx, endIdx, insertedVnodeQueue) {
        for (; startIdx <= endIdx; ++startIdx) {
            var ch = vnodes[startIdx];
            if (ch != null) {
                api.insertBefore(parentElm, createElm(ch, insertedVnodeQueue), before);
            }
        }
    }
    function invokeDestroyHook(vnode) {
        var i, j, data = vnode.data;
        if (data !== undefined) {
            if (isDef(i = data.hook) && isDef(i = i.destroy))
                i(vnode);
            for (i = 0; i < cbs.destroy.length; ++i)
                cbs.destroy[i](vnode);
            if (vnode.children !== undefined) {
                for (j = 0; j < vnode.children.length; ++j) {
                    i = vnode.children[j];
                    if (i != null && typeof i !== "string") {
                        invokeDestroyHook(i);
                    }
                }
            }
        }
    }
    function removeVnodes(parentElm, vnodes, startIdx, endIdx) {
        for (; startIdx <= endIdx; ++startIdx) {
            var i_1 = void 0, listeners = void 0, rm = void 0, ch = vnodes[startIdx];
            if (ch != null) {
                if (isDef(ch.sel)) {
                    invokeDestroyHook(ch);
                    listeners = cbs.remove.length + 1;
                    rm = createRmCb(ch.elm, listeners);
                    for (i_1 = 0; i_1 < cbs.remove.length; ++i_1)
                        cbs.remove[i_1](ch, rm);
                    if (isDef(i_1 = ch.data) && isDef(i_1 = i_1.hook) && isDef(i_1 = i_1.remove)) {
                        i_1(ch, rm);
                    }
                    else {
                        rm();
                    }
                }
                else {
                    api.removeChild(parentElm, ch.elm);
                }
            }
        }
    }
    function updateChildren(parentElm, oldCh, newCh, insertedVnodeQueue) {
        var oldStartIdx = 0, newStartIdx = 0;
        var oldEndIdx = oldCh.length - 1;
        var oldStartVnode = oldCh[0];
        var oldEndVnode = oldCh[oldEndIdx];
        var newEndIdx = newCh.length - 1;
        var newStartVnode = newCh[0];
        var newEndVnode = newCh[newEndIdx];
        var oldKeyToIdx;
        var idxInOld;
        var elmToMove;
        var before;
        while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
            if (oldStartVnode == null) {
                oldStartVnode = oldCh[++oldStartIdx]; // Vnode might have been moved left
            }
            else if (oldEndVnode == null) {
                oldEndVnode = oldCh[--oldEndIdx];
            }
            else if (newStartVnode == null) {
                newStartVnode = newCh[++newStartIdx];
            }
            else if (newEndVnode == null) {
                newEndVnode = newCh[--newEndIdx];
            }
            else if (sameVnode(oldStartVnode, newStartVnode)) {
                patchVnode(oldStartVnode, newStartVnode, insertedVnodeQueue);
                oldStartVnode = oldCh[++oldStartIdx];
                newStartVnode = newCh[++newStartIdx];
            }
            else if (sameVnode(oldEndVnode, newEndVnode)) {
                patchVnode(oldEndVnode, newEndVnode, insertedVnodeQueue);
                oldEndVnode = oldCh[--oldEndIdx];
                newEndVnode = newCh[--newEndIdx];
            }
            else if (sameVnode(oldStartVnode, newEndVnode)) {
                patchVnode(oldStartVnode, newEndVnode, insertedVnodeQueue);
                api.insertBefore(parentElm, oldStartVnode.elm, api.nextSibling(oldEndVnode.elm));
                oldStartVnode = oldCh[++oldStartIdx];
                newEndVnode = newCh[--newEndIdx];
            }
            else if (sameVnode(oldEndVnode, newStartVnode)) {
                patchVnode(oldEndVnode, newStartVnode, insertedVnodeQueue);
                api.insertBefore(parentElm, oldEndVnode.elm, oldStartVnode.elm);
                oldEndVnode = oldCh[--oldEndIdx];
                newStartVnode = newCh[++newStartIdx];
            }
            else {
                if (oldKeyToIdx === undefined) {
                    oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx);
                }
                idxInOld = oldKeyToIdx[newStartVnode.key];
                if (isUndef(idxInOld)) {
                    api.insertBefore(parentElm, createElm(newStartVnode, insertedVnodeQueue), oldStartVnode.elm);
                    newStartVnode = newCh[++newStartIdx];
                }
                else {
                    elmToMove = oldCh[idxInOld];
                    if (elmToMove.sel !== newStartVnode.sel) {
                        api.insertBefore(parentElm, createElm(newStartVnode, insertedVnodeQueue), oldStartVnode.elm);
                    }
                    else {
                        patchVnode(elmToMove, newStartVnode, insertedVnodeQueue);
                        oldCh[idxInOld] = undefined;
                        api.insertBefore(parentElm, elmToMove.elm, oldStartVnode.elm);
                    }
                    newStartVnode = newCh[++newStartIdx];
                }
            }
        }
        if (oldStartIdx > oldEndIdx) {
            before = newCh[newEndIdx + 1] == null ? null : newCh[newEndIdx + 1].elm;
            addVnodes(parentElm, before, newCh, newStartIdx, newEndIdx, insertedVnodeQueue);
        }
        else if (newStartIdx > newEndIdx) {
            removeVnodes(parentElm, oldCh, oldStartIdx, oldEndIdx);
        }
    }
    function patchVnode(oldVnode, vnode, insertedVnodeQueue) {
        var i, hook;
        if (isDef(i = vnode.data) && isDef(hook = i.hook) && isDef(i = hook.prepatch)) {
            i(oldVnode, vnode);
        }
        var elm = vnode.elm = oldVnode.elm;
        var oldCh = oldVnode.children;
        var ch = vnode.children;
        if (oldVnode === vnode)
            return;
        if (vnode.data !== undefined) {
            for (i = 0; i < cbs.update.length; ++i)
                cbs.update[i](oldVnode, vnode);
            i = vnode.data.hook;
            if (isDef(i) && isDef(i = i.update))
                i(oldVnode, vnode);
        }
        if (isUndef(vnode.text)) {
            if (isDef(oldCh) && isDef(ch)) {
                if (oldCh !== ch)
                    updateChildren(elm, oldCh, ch, insertedVnodeQueue);
            }
            else if (isDef(ch)) {
                if (isDef(oldVnode.text))
                    api.setTextContent(elm, '');
                addVnodes(elm, null, ch, 0, ch.length - 1, insertedVnodeQueue);
            }
            else if (isDef(oldCh)) {
                removeVnodes(elm, oldCh, 0, oldCh.length - 1);
            }
            else if (isDef(oldVnode.text)) {
                api.setTextContent(elm, '');
            }
        }
        else if (oldVnode.text !== vnode.text) {
            api.setTextContent(elm, vnode.text);
        }
        if (isDef(hook) && isDef(i = hook.postpatch)) {
            i(oldVnode, vnode);
        }
    }
    return function patch(oldVnode, vnode) {
        var i, elm, parent;
        var insertedVnodeQueue = [];
        for (i = 0; i < cbs.pre.length; ++i)
            cbs.pre[i]();
        if (!isVnode(oldVnode)) {
            oldVnode = emptyNodeAt(oldVnode);
        }
        if (sameVnode(oldVnode, vnode)) {
            patchVnode(oldVnode, vnode, insertedVnodeQueue);
        }
        else {
            elm = oldVnode.elm;
            parent = api.parentNode(elm);
            createElm(vnode, insertedVnodeQueue);
            if (parent !== null) {
                api.insertBefore(parent, vnode.elm, api.nextSibling(elm));
                removeVnodes(parent, [oldVnode], 0, 0);
            }
        }
        for (i = 0; i < insertedVnodeQueue.length; ++i) {
            insertedVnodeQueue[i].data.hook.insert(insertedVnodeQueue[i]);
        }
        for (i = 0; i < cbs.post.length; ++i)
            cbs.post[i]();
        return vnode;
    };
}
exports.init = init;

},{"./h":117,"./htmldomapi":118,"./is":119,"./thunk":126,"./vnode":128}],126:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var h_1 = require("./h");
function copyToThunk(vnode, thunk) {
    thunk.elm = vnode.elm;
    vnode.data.fn = thunk.data.fn;
    vnode.data.args = thunk.data.args;
    thunk.data = vnode.data;
    thunk.children = vnode.children;
    thunk.text = vnode.text;
    thunk.elm = vnode.elm;
}
function init(thunk) {
    var cur = thunk.data;
    var vnode = cur.fn.apply(undefined, cur.args);
    copyToThunk(vnode, thunk);
}
function prepatch(oldVnode, thunk) {
    var i, old = oldVnode.data, cur = thunk.data;
    var oldArgs = old.args, args = cur.args;
    if (old.fn !== cur.fn || oldArgs.length !== args.length) {
        copyToThunk(cur.fn.apply(undefined, args), thunk);
        return;
    }
    for (i = 0; i < args.length; ++i) {
        if (oldArgs[i] !== args[i]) {
            copyToThunk(cur.fn.apply(undefined, args), thunk);
            return;
        }
    }
    copyToThunk(oldVnode, thunk);
}
exports.thunk = function thunk(sel, key, fn, args) {
    if (args === undefined) {
        args = fn;
        fn = key;
        key = undefined;
    }
    return h_1.h(sel, {
        key: key,
        hook: { init: init, prepatch: prepatch },
        fn: fn,
        args: args
    });
};
exports.default = exports.thunk;

},{"./h":117}],127:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vnode_1 = require("./vnode");
var htmldomapi_1 = require("./htmldomapi");
function toVNode(node, domApi) {
    var api = domApi !== undefined ? domApi : htmldomapi_1.default;
    var text;
    if (api.isElement(node)) {
        var id = node.id ? '#' + node.id : '';
        var cn = node.getAttribute('class');
        var c = cn ? '.' + cn.split(' ').join('.') : '';
        var sel = api.tagName(node).toLowerCase() + id + c;
        var attrs = {};
        var children = [];
        var name_1;
        var i = void 0, n = void 0;
        var elmAttrs = node.attributes;
        var elmChildren = node.childNodes;
        for (i = 0, n = elmAttrs.length; i < n; i++) {
            name_1 = elmAttrs[i].nodeName;
            if (name_1 !== 'id' && name_1 !== 'class') {
                attrs[name_1] = elmAttrs[i].nodeValue;
            }
        }
        for (i = 0, n = elmChildren.length; i < n; i++) {
            children.push(toVNode(elmChildren[i]));
        }
        return vnode_1.default(sel, { attrs: attrs }, children, undefined, node);
    }
    else if (api.isText(node)) {
        text = api.getTextContent(node);
        return vnode_1.default(undefined, undefined, undefined, text, node);
    }
    else if (api.isComment(node)) {
        text = api.getTextContent(node);
        return vnode_1.default('!', {}, [], text, node);
    }
    else {
        return vnode_1.default('', {}, [], undefined, node);
    }
}
exports.toVNode = toVNode;
exports.default = toVNode;

},{"./htmldomapi":118,"./vnode":128}],128:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function vnode(sel, data, children, text, elm) {
    var key = data === undefined ? undefined : data.key;
    return { sel: sel, data: data, children: children,
        text: text, elm: elm, key: key };
}
exports.vnode = vnode;
exports.default = vnode;

},{}],129:[function(require,module,exports){
(function (global){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _ponyfill = require('./ponyfill.js');

var _ponyfill2 = _interopRequireDefault(_ponyfill);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var root; /* global window */


if (typeof self !== 'undefined') {
  root = self;
} else if (typeof window !== 'undefined') {
  root = window;
} else if (typeof global !== 'undefined') {
  root = global;
} else if (typeof module !== 'undefined') {
  root = module;
} else {
  root = Function('return this')();
}

var result = (0, _ponyfill2['default'])(root);
exports['default'] = result;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./ponyfill.js":130}],130:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports['default'] = symbolObservablePonyfill;
function symbolObservablePonyfill(root) {
	var result;
	var _Symbol = root.Symbol;

	if (typeof _Symbol === 'function') {
		if (_Symbol.observable) {
			result = _Symbol.observable;
		} else {
			result = _Symbol('observable');
			_Symbol.observable = result;
		}
	} else {
		result = '@@observable';
	}

	return result;
};
},{}],131:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var typestyle_1 = require("./internal/typestyle");
exports.TypeStyle = typestyle_1.TypeStyle;
/**
 * All the CSS types in the 'types' namespace
 */
var types = require("./types");
exports.types = types;
/**
 * Export certain utilities
 */
var utilities_1 = require("./internal/utilities");
exports.extend = utilities_1.extend;
exports.classes = utilities_1.classes;
exports.media = utilities_1.media;
/** Zero configuration, default instance of TypeStyle */
var ts = new typestyle_1.TypeStyle({ autoGenerateTag: true });
/** Sets the target tag where we write the css on style updates */
exports.setStylesTarget = ts.setStylesTarget;
/**
 * Insert `raw` CSS as a string. This is useful for e.g.
 * - third party CSS that you are customizing with template strings
 * - generating raw CSS in JavaScript
 * - reset libraries like normalize.css that you can use without loaders
 */
exports.cssRaw = ts.cssRaw;
/**
 * Takes CSSProperties and registers it to a global selector (body, html, etc.)
 */
exports.cssRule = ts.cssRule;
/**
 * Renders styles to the singleton tag imediately
 * NOTE: You should only call it on initial render to prevent any non CSS flash.
 * After that it is kept sync using `requestAnimationFrame` and we haven't noticed any bad flashes.
 **/
exports.forceRenderStyles = ts.forceRenderStyles;
/**
 * Utility function to register an @font-face
 */
exports.fontFace = ts.fontFace;
/**
 * Allows use to use the stylesheet in a node.js environment
 */
exports.getStyles = ts.getStyles;
/**
 * Takes keyframes and returns a generated animationName
 */
exports.keyframes = ts.keyframes;
/**
 * Helps with testing. Reinitializes FreeStyle + raw
 */
exports.reinit = ts.reinit;
/**
 * Takes CSSProperties and return a generated className you can use on your component
 */
exports.style = ts.style;
/**
 * Takes an object where property names are ideal class names and property values are CSSProperties, and
 * returns an object where property names are the same ideal class names and the property values are
 * the actual generated class names using the ideal class name as the $debugName
 */
exports.stylesheet = ts.stylesheet;
/**
 * Creates a new instance of TypeStyle separate from the default instance.
 *
 * - Use this for creating a different typestyle instance for a shadow dom component.
 * - Use this if you don't want an auto tag generated and you just want to collect the CSS.
 *
 * NOTE: styles aren't shared between different instances.
 */
function createTypeStyle(target) {
    var instance = new typestyle_1.TypeStyle({ autoGenerateTag: false });
    if (target) {
        instance.setStylesTarget(target);
    }
    return instance;
}
exports.createTypeStyle = createTypeStyle;

},{"./internal/typestyle":133,"./internal/utilities":134,"./types":135}],132:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var FreeStyle = require("free-style");
/**
 * We need to do the following to *our* objects before passing to freestyle:
 * - For any `$nest` directive move up to FreeStyle style nesting
 * - For any `$unique` directive map to FreeStyle Unique
 * - For any `$debugName` directive return the debug name
 */
function ensureStringObj(object) {
    /** The final result we will return */
    var result = {};
    var debugName = '';
    for (var key in object) {
        /** Grab the value upfront */
        var val = object[key];
        /** TypeStyle configuration options */
        if (key === '$unique') {
            result[FreeStyle.IS_UNIQUE] = val;
        }
        else if (key === '$nest') {
            var nested = val;
            for (var selector in nested) {
                var subproperties = nested[selector];
                result[selector] = ensureStringObj(subproperties).result;
            }
        }
        else if (key === '$debugName') {
            debugName = val;
        }
        else {
            result[key] = val;
        }
    }
    return { result: result, debugName: debugName };
}
exports.ensureStringObj = ensureStringObj;
// todo: better name here
function explodeKeyframes(frames) {
    var result = { $debugName: undefined, keyframes: {} };
    for (var offset in frames) {
        var val = frames[offset];
        if (offset === '$debugName') {
            result.$debugName = val;
        }
        else {
            result.keyframes[offset] = val;
        }
    }
    return result;
}
exports.explodeKeyframes = explodeKeyframes;

},{"free-style":99}],133:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var FreeStyle = require("free-style");
var formatting_1 = require("./formatting");
var utilities_1 = require("./utilities");
/**
 * Creates an instance of free style with our options
 */
var createFreeStyle = function () { return FreeStyle.create(
/** Use the default hash function */
undefined, 
/** Preserve $debugName values */
true); };
/**
 * Maintains a single stylesheet and keeps it in sync with requested styles
 */
var TypeStyle = /** @class */ (function () {
    function TypeStyle(_a) {
        var autoGenerateTag = _a.autoGenerateTag;
        var _this = this;
        /**
         * Insert `raw` CSS as a string. This is useful for e.g.
         * - third party CSS that you are customizing with template strings
         * - generating raw CSS in JavaScript
         * - reset libraries like normalize.css that you can use without loaders
         */
        this.cssRaw = function (mustBeValidCSS) {
            if (!mustBeValidCSS) {
                return;
            }
            _this._raw += mustBeValidCSS || '';
            _this._pendingRawChange = true;
            _this._styleUpdated();
        };
        /**
         * Takes CSSProperties and registers it to a global selector (body, html, etc.)
         */
        this.cssRule = function (selector) {
            var objects = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                objects[_i - 1] = arguments[_i];
            }
            var object = formatting_1.ensureStringObj(utilities_1.extend.apply(void 0, objects)).result;
            _this._freeStyle.registerRule(selector, object);
            _this._styleUpdated();
            return;
        };
        /**
         * Renders styles to the singleton tag imediately
         * NOTE: You should only call it on initial render to prevent any non CSS flash.
         * After that it is kept sync using `requestAnimationFrame` and we haven't noticed any bad flashes.
         **/
        this.forceRenderStyles = function () {
            var target = _this._getTag();
            if (!target) {
                return;
            }
            target.textContent = _this.getStyles();
        };
        /**
         * Utility function to register an @font-face
         */
        this.fontFace = function () {
            var fontFace = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                fontFace[_i] = arguments[_i];
            }
            var freeStyle = _this._freeStyle;
            for (var _a = 0, _b = fontFace; _a < _b.length; _a++) {
                var face = _b[_a];
                freeStyle.registerRule('@font-face', face);
            }
            _this._styleUpdated();
            return;
        };
        /**
         * Allows use to use the stylesheet in a node.js environment
         */
        this.getStyles = function () {
            return (_this._raw || '') + _this._freeStyle.getStyles();
        };
        /**
         * Takes keyframes and returns a generated animationName
         */
        this.keyframes = function (frames) {
            var _a = formatting_1.explodeKeyframes(frames), keyframes = _a.keyframes, $debugName = _a.$debugName;
            // TODO: replace $debugName with display name
            var animationName = _this._freeStyle.registerKeyframes(keyframes, $debugName);
            _this._styleUpdated();
            return animationName;
        };
        /**
         * Helps with testing. Reinitializes FreeStyle + raw
         */
        this.reinit = function () {
            /** reinit freestyle */
            var freeStyle = createFreeStyle();
            _this._freeStyle = freeStyle;
            _this._lastFreeStyleChangeId = freeStyle.changeId;
            /** reinit raw */
            _this._raw = '';
            _this._pendingRawChange = false;
            /** Clear any styles that were flushed */
            var target = _this._getTag();
            if (target) {
                target.textContent = '';
            }
        };
        /** Sets the target tag where we write the css on style updates */
        this.setStylesTarget = function (tag) {
            /** Clear any data in any previous tag */
            if (_this._tag) {
                _this._tag.textContent = '';
            }
            _this._tag = tag;
            /** This special time buffer immediately */
            _this.forceRenderStyles();
        };
        /**
         * Takes an object where property names are ideal class names and property values are CSSProperties, and
         * returns an object where property names are the same ideal class names and the property values are
         * the actual generated class names using the ideal class name as the $debugName
         */
        this.stylesheet = function (classes) {
            var classNames = Object.getOwnPropertyNames(classes);
            var result = {};
            for (var _i = 0, classNames_1 = classNames; _i < classNames_1.length; _i++) {
                var className = classNames_1[_i];
                var classDef = classes[className];
                if (classDef) {
                    classDef.$debugName = className;
                    result[className] = _this.style(classDef);
                }
            }
            return result;
        };
        var freeStyle = createFreeStyle();
        this._autoGenerateTag = autoGenerateTag;
        this._freeStyle = freeStyle;
        this._lastFreeStyleChangeId = freeStyle.changeId;
        this._pending = 0;
        this._pendingRawChange = false;
        this._raw = '';
        this._tag = undefined;
        // rebind prototype to TypeStyle.  It might be better to do a function() { return this.style.apply(this, arguments)}
        this.style = this.style.bind(this);
    }
    /**
     * Only calls cb all sync operations settle
     */
    TypeStyle.prototype._afterAllSync = function (cb) {
        var _this = this;
        this._pending++;
        var pending = this._pending;
        utilities_1.raf(function () {
            if (pending !== _this._pending) {
                return;
            }
            cb();
        });
    };
    TypeStyle.prototype._getTag = function () {
        if (this._tag) {
            return this._tag;
        }
        if (this._autoGenerateTag) {
            var tag = typeof window === 'undefined'
                ? { textContent: '' }
                : document.createElement('style');
            if (typeof document !== 'undefined') {
                document.head.appendChild(tag);
            }
            this._tag = tag;
            return tag;
        }
        return undefined;
    };
    /** Checks if the style tag needs updating and if so queues up the change */
    TypeStyle.prototype._styleUpdated = function () {
        var _this = this;
        var changeId = this._freeStyle.changeId;
        var lastChangeId = this._lastFreeStyleChangeId;
        if (!this._pendingRawChange && changeId === lastChangeId) {
            return;
        }
        this._lastFreeStyleChangeId = changeId;
        this._pendingRawChange = false;
        this._afterAllSync(function () { return _this.forceRenderStyles(); });
    };
    TypeStyle.prototype.style = function () {
        var freeStyle = this._freeStyle;
        var _a = formatting_1.ensureStringObj(utilities_1.extend.apply(undefined, arguments)), result = _a.result, debugName = _a.debugName;
        var className = debugName ? freeStyle.registerStyle(result, debugName) : freeStyle.registerStyle(result);
        this._styleUpdated();
        return className;
    };
    return TypeStyle;
}());
exports.TypeStyle = TypeStyle;

},{"./formatting":132,"./utilities":134,"free-style":99}],134:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/** Raf for node + browser */
exports.raf = typeof requestAnimationFrame === 'undefined'
    /**
     * Make sure setTimeout is always invoked with
     * `this` set to `window` or `global` automatically
     **/
    ? function (cb) { return setTimeout(cb); }
    /**
     * Make sure window.requestAnimationFrame is always invoked with `this` window
     * We might have raf without window in case of `raf/polyfill` (recommended by React)
     **/
    : typeof window === 'undefined'
        ? requestAnimationFrame
        : requestAnimationFrame.bind(window);
/**
 * Utility to join classes conditionally
 */
function classes() {
    var classes = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        classes[_i] = arguments[_i];
    }
    return classes.filter(function (c) { return !!c; }).join(' ');
}
exports.classes = classes;
/**
 * Merges various styles into a single style object.
 * Note: if two objects have the same property the last one wins
 */
function extend() {
    var objects = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        objects[_i] = arguments[_i];
    }
    /** The final result we will return */
    var result = {};
    for (var _a = 0, objects_1 = objects; _a < objects_1.length; _a++) {
        var object = objects_1[_a];
        if (object == null || object === false) {
            continue;
        }
        for (var key in object) {
            /** Falsy values except a explicit 0 is ignored */
            var val = object[key];
            if (!val && val !== 0) {
                continue;
            }
            /** if nested media or pseudo selector */
            if (key === '$nest' && val) {
                result[key] = result['$nest'] ? extend(result['$nest'], val) : val;
            }
            else if ((key.indexOf('&') !== -1 || key.indexOf('@media') === 0)) {
                result[key] = result[key] ? extend(result[key], val) : val;
            }
            else {
                result[key] = val;
            }
        }
    }
    return result;
}
exports.extend = extend;
/**
 * Utility to help customize styles with media queries. e.g.
 * ```
 * style(
 *  media({maxWidth:500}, {color:'red'})
 * )
 * ```
 */
exports.media = function (mediaQuery) {
    var objects = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        objects[_i - 1] = arguments[_i];
    }
    var mediaQuerySections = [];
    if (mediaQuery.type)
        mediaQuerySections.push(mediaQuery.type);
    if (mediaQuery.orientation)
        mediaQuerySections.push("(orientation: " + mediaQuery.orientation + ")");
    if (mediaQuery.minWidth)
        mediaQuerySections.push("(min-width: " + mediaLength(mediaQuery.minWidth) + ")");
    if (mediaQuery.maxWidth)
        mediaQuerySections.push("(max-width: " + mediaLength(mediaQuery.maxWidth) + ")");
    if (mediaQuery.minHeight)
        mediaQuerySections.push("(min-height: " + mediaLength(mediaQuery.minHeight) + ")");
    if (mediaQuery.maxHeight)
        mediaQuerySections.push("(max-height: " + mediaLength(mediaQuery.maxHeight) + ")");
    var stringMediaQuery = "@media " + mediaQuerySections.join(' and ');
    var object = {
        $nest: (_a = {},
            _a[stringMediaQuery] = extend.apply(void 0, objects),
            _a)
    };
    return object;
    var _a;
};
var mediaLength = function (value) {
    return typeof value === 'string' ? value : value + "px";
};

},{}],135:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],136:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var valueEqual = function valueEqual(a, b) {
  if (a === b) return true;

  if (a == null || b == null) return false;

  if (Array.isArray(a)) return Array.isArray(b) && a.length === b.length && a.every(function (item, index) {
    return valueEqual(item, b[index]);
  });

  var aType = typeof a === 'undefined' ? 'undefined' : _typeof(a);
  var bType = typeof b === 'undefined' ? 'undefined' : _typeof(b);

  if (aType !== bType) return false;

  if (aType === 'object') {
    var aValue = a.valueOf();
    var bValue = b.valueOf();

    if (aValue !== a || bValue !== b) return valueEqual(aValue, bValue);

    var aKeys = Object.keys(a);
    var bKeys = Object.keys(b);

    if (aKeys.length !== bKeys.length) return false;

    return aKeys.every(function (key) {
      return valueEqual(a[key], b[key]);
    });
  }

  return false;
};

exports.default = valueEqual;
},{}],137:[function(require,module,exports){
(function (process){
/**
 * Copyright 2014-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

/**
 * Similar to invariant but only logs a warning if the condition is not met.
 * This can be used to log issues in development environments in critical
 * paths. Removing the logging code for production environments will keep the
 * same logic and follow the same code paths.
 */

var warning = function() {};

if (process.env.NODE_ENV !== 'production') {
  warning = function(condition, format, args) {
    var len = arguments.length;
    args = new Array(len > 2 ? len - 2 : 0);
    for (var key = 2; key < len; key++) {
      args[key - 2] = arguments[key];
    }
    if (format === undefined) {
      throw new Error(
        '`warning(condition, format, ...args)` requires a warning ' +
        'message argument'
      );
    }

    if (format.length < 10 || (/^[s\W]*$/).test(format)) {
      throw new Error(
        'The warning format should be able to uniquely identify this ' +
        'warning. Please, use a more descriptive format than: ' + format
      );
    }

    if (!condition) {
      var argIndex = 0;
      var message = 'Warning: ' +
        format.replace(/%s/g, function() {
          return args[argIndex++];
        });
      if (typeof console !== 'undefined') {
        console.error(message);
      }
      try {
        // This error was thrown as a convenience so that you can use this stack
        // to find the callsite that caused this warning to fire.
        throw new Error(message);
      } catch(x) {}
    }
  };
}

module.exports = warning;

}).call(this,require('_process'))

},{"_process":109}],138:[function(require,module,exports){
"use strict";
var index_1 = require("../index");
var DebounceOperator = (function () {
    function DebounceOperator(dt, ins) {
        this.dt = dt;
        this.ins = ins;
        this.type = 'debounce';
        this.out = null;
        this.id = null;
    }
    DebounceOperator.prototype._start = function (out) {
        this.out = out;
        this.ins._add(this);
    };
    DebounceOperator.prototype._stop = function () {
        this.ins._remove(this);
        this.out = null;
        this.id = null;
    };
    DebounceOperator.prototype.clearInterval = function () {
        var id = this.id;
        if (id !== null) {
            clearInterval(id);
        }
        this.id = null;
    };
    DebounceOperator.prototype._n = function (t) {
        var _this = this;
        var u = this.out;
        if (!u)
            return;
        this.clearInterval();
        this.id = setInterval(function () {
            _this.clearInterval();
            u._n(t);
        }, this.dt);
    };
    DebounceOperator.prototype._e = function (err) {
        var u = this.out;
        if (!u)
            return;
        this.clearInterval();
        u._e(err);
    };
    DebounceOperator.prototype._c = function () {
        var u = this.out;
        if (!u)
            return;
        this.clearInterval();
        u._c();
    };
    return DebounceOperator;
}());
/**
 * Delays events until a certain amount of silence has passed. If that timespan
 * of silence is not met the event is dropped.
 *
 * Marble diagram:
 *
 * ```text
 * --1----2--3--4----5|
 *     debounce(60)
 * -----1----------4--|
 * ```
 *
 * Example:
 *
 * ```js
 * import fromDiagram from 'xstream/extra/fromDiagram'
 * import debounce from 'xstream/extra/debounce'
 *
 * const stream = fromDiagram('--1----2--3--4----5|')
 *  .compose(debounce(60))
 *
 * stream.addListener({
 *   next: i => console.log(i),
 *   error: err => console.error(err),
 *   complete: () => console.log('completed')
 * })
 * ```
 *
 * ```text
 * > 1
 * > 4
 * > completed
 * ```
 *
 * @param {number} period The amount of silence required in milliseconds.
 * @return {Stream}
 */
function debounce(period) {
    return function debounceOperator(ins) {
        return new index_1.Stream(new DebounceOperator(period, ins));
    };
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = debounce;

},{"../index":140}],139:[function(require,module,exports){
"use strict";
var index_1 = require("../index");
var empty = {};
var DropRepeatsOperator = (function () {
    function DropRepeatsOperator(ins, fn) {
        this.ins = ins;
        this.fn = fn;
        this.type = 'dropRepeats';
        this.out = null;
        this.v = empty;
    }
    DropRepeatsOperator.prototype._start = function (out) {
        this.out = out;
        this.ins._add(this);
    };
    DropRepeatsOperator.prototype._stop = function () {
        this.ins._remove(this);
        this.out = null;
        this.v = empty;
    };
    DropRepeatsOperator.prototype.isEq = function (x, y) {
        return this.fn ? this.fn(x, y) : x === y;
    };
    DropRepeatsOperator.prototype._n = function (t) {
        var u = this.out;
        if (!u)
            return;
        var v = this.v;
        if (v !== empty && this.isEq(t, v))
            return;
        this.v = t;
        u._n(t);
    };
    DropRepeatsOperator.prototype._e = function (err) {
        var u = this.out;
        if (!u)
            return;
        u._e(err);
    };
    DropRepeatsOperator.prototype._c = function () {
        var u = this.out;
        if (!u)
            return;
        u._c();
    };
    return DropRepeatsOperator;
}());
exports.DropRepeatsOperator = DropRepeatsOperator;
/**
 * Drops consecutive duplicate values in a stream.
 *
 * Marble diagram:
 *
 * ```text
 * --1--2--1--1--1--2--3--4--3--3|
 *     dropRepeats
 * --1--2--1--------2--3--4--3---|
 * ```
 *
 * Example:
 *
 * ```js
 * import dropRepeats from 'xstream/extra/dropRepeats'
 *
 * const stream = xs.of(1, 2, 1, 1, 1, 2, 3, 4, 3, 3)
 *   .compose(dropRepeats())
 *
 * stream.addListener({
 *   next: i => console.log(i),
 *   error: err => console.error(err),
 *   complete: () => console.log('completed')
 * })
 * ```
 *
 * ```text
 * > 1
 * > 2
 * > 1
 * > 2
 * > 3
 * > 4
 * > 3
 * > completed
 * ```
 *
 * Example with a custom isEqual function:
 *
 * ```js
 * import dropRepeats from 'xstream/extra/dropRepeats'
 *
 * const stream = xs.of('a', 'b', 'a', 'A', 'B', 'b')
 *   .compose(dropRepeats((x, y) => x.toLowerCase() === y.toLowerCase()))
 *
 * stream.addListener({
 *   next: i => console.log(i),
 *   error: err => console.error(err),
 *   complete: () => console.log('completed')
 * })
 * ```
 *
 * ```text
 * > a
 * > b
 * > a
 * > B
 * > completed
 * ```
 *
 * @param {Function} isEqual An optional function of type
 * `(x: T, y: T) => boolean` that takes an event from the input stream and
 * checks if it is equal to previous event, by returning a boolean.
 * @return {Stream}
 */
function dropRepeats(isEqual) {
    if (isEqual === void 0) { isEqual = void 0; }
    return function dropRepeatsOperator(ins) {
        return new index_1.Stream(new DropRepeatsOperator(ins, isEqual));
    };
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = dropRepeats;

},{"../index":140}],140:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var symbol_observable_1 = require("symbol-observable");
var NO = {};
exports.NO = NO;
function noop() { }
function cp(a) {
    var l = a.length;
    var b = Array(l);
    for (var i = 0; i < l; ++i)
        b[i] = a[i];
    return b;
}
function and(f1, f2) {
    return function andFn(t) {
        return f1(t) && f2(t);
    };
}
function _try(c, t, u) {
    try {
        return c.f(t);
    }
    catch (e) {
        u._e(e);
        return NO;
    }
}
var NO_IL = {
    _n: noop,
    _e: noop,
    _c: noop,
};
exports.NO_IL = NO_IL;
// mutates the input
function internalizeProducer(producer) {
    producer._start = function _start(il) {
        il.next = il._n;
        il.error = il._e;
        il.complete = il._c;
        this.start(il);
    };
    producer._stop = producer.stop;
}
var StreamSub = (function () {
    function StreamSub(_stream, _listener) {
        this._stream = _stream;
        this._listener = _listener;
    }
    StreamSub.prototype.unsubscribe = function () {
        this._stream.removeListener(this._listener);
    };
    return StreamSub;
}());
var Observer = (function () {
    function Observer(_listener) {
        this._listener = _listener;
    }
    Observer.prototype.next = function (value) {
        this._listener._n(value);
    };
    Observer.prototype.error = function (err) {
        this._listener._e(err);
    };
    Observer.prototype.complete = function () {
        this._listener._c();
    };
    return Observer;
}());
var FromObservable = (function () {
    function FromObservable(observable) {
        this.type = 'fromObservable';
        this.ins = observable;
        this.active = false;
    }
    FromObservable.prototype._start = function (out) {
        this.out = out;
        this.active = true;
        this._sub = this.ins.subscribe(new Observer(out));
        if (!this.active)
            this._sub.unsubscribe();
    };
    FromObservable.prototype._stop = function () {
        if (this._sub)
            this._sub.unsubscribe();
        this.active = false;
    };
    return FromObservable;
}());
var Merge = (function () {
    function Merge(insArr) {
        this.type = 'merge';
        this.insArr = insArr;
        this.out = NO;
        this.ac = 0;
    }
    Merge.prototype._start = function (out) {
        this.out = out;
        var s = this.insArr;
        var L = s.length;
        this.ac = L;
        for (var i = 0; i < L; i++)
            s[i]._add(this);
    };
    Merge.prototype._stop = function () {
        var s = this.insArr;
        var L = s.length;
        for (var i = 0; i < L; i++)
            s[i]._remove(this);
        this.out = NO;
    };
    Merge.prototype._n = function (t) {
        var u = this.out;
        if (u === NO)
            return;
        u._n(t);
    };
    Merge.prototype._e = function (err) {
        var u = this.out;
        if (u === NO)
            return;
        u._e(err);
    };
    Merge.prototype._c = function () {
        if (--this.ac <= 0) {
            var u = this.out;
            if (u === NO)
                return;
            u._c();
        }
    };
    return Merge;
}());
var CombineListener = (function () {
    function CombineListener(i, out, p) {
        this.i = i;
        this.out = out;
        this.p = p;
        p.ils.push(this);
    }
    CombineListener.prototype._n = function (t) {
        var p = this.p, out = this.out;
        if (out === NO)
            return;
        if (p.up(t, this.i)) {
            var a = p.vals;
            var l = a.length;
            var b = Array(l);
            for (var i = 0; i < l; ++i)
                b[i] = a[i];
            out._n(b);
        }
    };
    CombineListener.prototype._e = function (err) {
        var out = this.out;
        if (out === NO)
            return;
        out._e(err);
    };
    CombineListener.prototype._c = function () {
        var p = this.p;
        if (p.out === NO)
            return;
        if (--p.Nc === 0)
            p.out._c();
    };
    return CombineListener;
}());
var Combine = (function () {
    function Combine(insArr) {
        this.type = 'combine';
        this.insArr = insArr;
        this.out = NO;
        this.ils = [];
        this.Nc = this.Nn = 0;
        this.vals = [];
    }
    Combine.prototype.up = function (t, i) {
        var v = this.vals[i];
        var Nn = !this.Nn ? 0 : v === NO ? --this.Nn : this.Nn;
        this.vals[i] = t;
        return Nn === 0;
    };
    Combine.prototype._start = function (out) {
        this.out = out;
        var s = this.insArr;
        var n = this.Nc = this.Nn = s.length;
        var vals = this.vals = new Array(n);
        if (n === 0) {
            out._n([]);
            out._c();
        }
        else {
            for (var i = 0; i < n; i++) {
                vals[i] = NO;
                s[i]._add(new CombineListener(i, out, this));
            }
        }
    };
    Combine.prototype._stop = function () {
        var s = this.insArr;
        var n = s.length;
        var ils = this.ils;
        for (var i = 0; i < n; i++)
            s[i]._remove(ils[i]);
        this.out = NO;
        this.ils = [];
        this.vals = [];
    };
    return Combine;
}());
var FromArray = (function () {
    function FromArray(a) {
        this.type = 'fromArray';
        this.a = a;
    }
    FromArray.prototype._start = function (out) {
        var a = this.a;
        for (var i = 0, n = a.length; i < n; i++)
            out._n(a[i]);
        out._c();
    };
    FromArray.prototype._stop = function () {
    };
    return FromArray;
}());
var FromPromise = (function () {
    function FromPromise(p) {
        this.type = 'fromPromise';
        this.on = false;
        this.p = p;
    }
    FromPromise.prototype._start = function (out) {
        var prod = this;
        this.on = true;
        this.p.then(function (v) {
            if (prod.on) {
                out._n(v);
                out._c();
            }
        }, function (e) {
            out._e(e);
        }).then(noop, function (err) {
            setTimeout(function () { throw err; });
        });
    };
    FromPromise.prototype._stop = function () {
        this.on = false;
    };
    return FromPromise;
}());
var Periodic = (function () {
    function Periodic(period) {
        this.type = 'periodic';
        this.period = period;
        this.intervalID = -1;
        this.i = 0;
    }
    Periodic.prototype._start = function (out) {
        var self = this;
        function intervalHandler() { out._n(self.i++); }
        this.intervalID = setInterval(intervalHandler, this.period);
    };
    Periodic.prototype._stop = function () {
        if (this.intervalID !== -1)
            clearInterval(this.intervalID);
        this.intervalID = -1;
        this.i = 0;
    };
    return Periodic;
}());
var Debug = (function () {
    function Debug(ins, arg) {
        this.type = 'debug';
        this.ins = ins;
        this.out = NO;
        this.s = noop;
        this.l = '';
        if (typeof arg === 'string')
            this.l = arg;
        else if (typeof arg === 'function')
            this.s = arg;
    }
    Debug.prototype._start = function (out) {
        this.out = out;
        this.ins._add(this);
    };
    Debug.prototype._stop = function () {
        this.ins._remove(this);
        this.out = NO;
    };
    Debug.prototype._n = function (t) {
        var u = this.out;
        if (u === NO)
            return;
        var s = this.s, l = this.l;
        if (s !== noop) {
            try {
                s(t);
            }
            catch (e) {
                u._e(e);
            }
        }
        else if (l)
            console.log(l + ':', t);
        else
            console.log(t);
        u._n(t);
    };
    Debug.prototype._e = function (err) {
        var u = this.out;
        if (u === NO)
            return;
        u._e(err);
    };
    Debug.prototype._c = function () {
        var u = this.out;
        if (u === NO)
            return;
        u._c();
    };
    return Debug;
}());
var Drop = (function () {
    function Drop(max, ins) {
        this.type = 'drop';
        this.ins = ins;
        this.out = NO;
        this.max = max;
        this.dropped = 0;
    }
    Drop.prototype._start = function (out) {
        this.out = out;
        this.dropped = 0;
        this.ins._add(this);
    };
    Drop.prototype._stop = function () {
        this.ins._remove(this);
        this.out = NO;
    };
    Drop.prototype._n = function (t) {
        var u = this.out;
        if (u === NO)
            return;
        if (this.dropped++ >= this.max)
            u._n(t);
    };
    Drop.prototype._e = function (err) {
        var u = this.out;
        if (u === NO)
            return;
        u._e(err);
    };
    Drop.prototype._c = function () {
        var u = this.out;
        if (u === NO)
            return;
        u._c();
    };
    return Drop;
}());
var EndWhenListener = (function () {
    function EndWhenListener(out, op) {
        this.out = out;
        this.op = op;
    }
    EndWhenListener.prototype._n = function () {
        this.op.end();
    };
    EndWhenListener.prototype._e = function (err) {
        this.out._e(err);
    };
    EndWhenListener.prototype._c = function () {
        this.op.end();
    };
    return EndWhenListener;
}());
var EndWhen = (function () {
    function EndWhen(o, ins) {
        this.type = 'endWhen';
        this.ins = ins;
        this.out = NO;
        this.o = o;
        this.oil = NO_IL;
    }
    EndWhen.prototype._start = function (out) {
        this.out = out;
        this.o._add(this.oil = new EndWhenListener(out, this));
        this.ins._add(this);
    };
    EndWhen.prototype._stop = function () {
        this.ins._remove(this);
        this.o._remove(this.oil);
        this.out = NO;
        this.oil = NO_IL;
    };
    EndWhen.prototype.end = function () {
        var u = this.out;
        if (u === NO)
            return;
        u._c();
    };
    EndWhen.prototype._n = function (t) {
        var u = this.out;
        if (u === NO)
            return;
        u._n(t);
    };
    EndWhen.prototype._e = function (err) {
        var u = this.out;
        if (u === NO)
            return;
        u._e(err);
    };
    EndWhen.prototype._c = function () {
        this.end();
    };
    return EndWhen;
}());
var Filter = (function () {
    function Filter(passes, ins) {
        this.type = 'filter';
        this.ins = ins;
        this.out = NO;
        this.f = passes;
    }
    Filter.prototype._start = function (out) {
        this.out = out;
        this.ins._add(this);
    };
    Filter.prototype._stop = function () {
        this.ins._remove(this);
        this.out = NO;
    };
    Filter.prototype._n = function (t) {
        var u = this.out;
        if (u === NO)
            return;
        var r = _try(this, t, u);
        if (r === NO || !r)
            return;
        u._n(t);
    };
    Filter.prototype._e = function (err) {
        var u = this.out;
        if (u === NO)
            return;
        u._e(err);
    };
    Filter.prototype._c = function () {
        var u = this.out;
        if (u === NO)
            return;
        u._c();
    };
    return Filter;
}());
var FlattenListener = (function () {
    function FlattenListener(out, op) {
        this.out = out;
        this.op = op;
    }
    FlattenListener.prototype._n = function (t) {
        this.out._n(t);
    };
    FlattenListener.prototype._e = function (err) {
        this.out._e(err);
    };
    FlattenListener.prototype._c = function () {
        this.op.inner = NO;
        this.op.less();
    };
    return FlattenListener;
}());
var Flatten = (function () {
    function Flatten(ins) {
        this.type = 'flatten';
        this.ins = ins;
        this.out = NO;
        this.open = true;
        this.inner = NO;
        this.il = NO_IL;
    }
    Flatten.prototype._start = function (out) {
        this.out = out;
        this.open = true;
        this.inner = NO;
        this.il = NO_IL;
        this.ins._add(this);
    };
    Flatten.prototype._stop = function () {
        this.ins._remove(this);
        if (this.inner !== NO)
            this.inner._remove(this.il);
        this.out = NO;
        this.open = true;
        this.inner = NO;
        this.il = NO_IL;
    };
    Flatten.prototype.less = function () {
        var u = this.out;
        if (u === NO)
            return;
        if (!this.open && this.inner === NO)
            u._c();
    };
    Flatten.prototype._n = function (s) {
        var u = this.out;
        if (u === NO)
            return;
        var _a = this, inner = _a.inner, il = _a.il;
        if (inner !== NO && il !== NO_IL)
            inner._remove(il);
        (this.inner = s)._add(this.il = new FlattenListener(u, this));
    };
    Flatten.prototype._e = function (err) {
        var u = this.out;
        if (u === NO)
            return;
        u._e(err);
    };
    Flatten.prototype._c = function () {
        this.open = false;
        this.less();
    };
    return Flatten;
}());
var Fold = (function () {
    function Fold(f, seed, ins) {
        var _this = this;
        this.type = 'fold';
        this.ins = ins;
        this.out = NO;
        this.f = function (t) { return f(_this.acc, t); };
        this.acc = this.seed = seed;
    }
    Fold.prototype._start = function (out) {
        this.out = out;
        this.acc = this.seed;
        out._n(this.acc);
        this.ins._add(this);
    };
    Fold.prototype._stop = function () {
        this.ins._remove(this);
        this.out = NO;
        this.acc = this.seed;
    };
    Fold.prototype._n = function (t) {
        var u = this.out;
        if (u === NO)
            return;
        var r = _try(this, t, u);
        if (r === NO)
            return;
        u._n(this.acc = r);
    };
    Fold.prototype._e = function (err) {
        var u = this.out;
        if (u === NO)
            return;
        u._e(err);
    };
    Fold.prototype._c = function () {
        var u = this.out;
        if (u === NO)
            return;
        u._c();
    };
    return Fold;
}());
var Last = (function () {
    function Last(ins) {
        this.type = 'last';
        this.ins = ins;
        this.out = NO;
        this.has = false;
        this.val = NO;
    }
    Last.prototype._start = function (out) {
        this.out = out;
        this.has = false;
        this.ins._add(this);
    };
    Last.prototype._stop = function () {
        this.ins._remove(this);
        this.out = NO;
        this.val = NO;
    };
    Last.prototype._n = function (t) {
        this.has = true;
        this.val = t;
    };
    Last.prototype._e = function (err) {
        var u = this.out;
        if (u === NO)
            return;
        u._e(err);
    };
    Last.prototype._c = function () {
        var u = this.out;
        if (u === NO)
            return;
        if (this.has) {
            u._n(this.val);
            u._c();
        }
        else
            u._e(new Error('last() failed because input stream completed'));
    };
    return Last;
}());
var MapOp = (function () {
    function MapOp(project, ins) {
        this.type = 'map';
        this.ins = ins;
        this.out = NO;
        this.f = project;
    }
    MapOp.prototype._start = function (out) {
        this.out = out;
        this.ins._add(this);
    };
    MapOp.prototype._stop = function () {
        this.ins._remove(this);
        this.out = NO;
    };
    MapOp.prototype._n = function (t) {
        var u = this.out;
        if (u === NO)
            return;
        var r = _try(this, t, u);
        if (r === NO)
            return;
        u._n(r);
    };
    MapOp.prototype._e = function (err) {
        var u = this.out;
        if (u === NO)
            return;
        u._e(err);
    };
    MapOp.prototype._c = function () {
        var u = this.out;
        if (u === NO)
            return;
        u._c();
    };
    return MapOp;
}());
var Remember = (function () {
    function Remember(ins) {
        this.type = 'remember';
        this.ins = ins;
        this.out = NO;
    }
    Remember.prototype._start = function (out) {
        this.out = out;
        this.ins._add(out);
    };
    Remember.prototype._stop = function () {
        this.ins._remove(this.out);
        this.out = NO;
    };
    return Remember;
}());
var ReplaceError = (function () {
    function ReplaceError(replacer, ins) {
        this.type = 'replaceError';
        this.ins = ins;
        this.out = NO;
        this.f = replacer;
    }
    ReplaceError.prototype._start = function (out) {
        this.out = out;
        this.ins._add(this);
    };
    ReplaceError.prototype._stop = function () {
        this.ins._remove(this);
        this.out = NO;
    };
    ReplaceError.prototype._n = function (t) {
        var u = this.out;
        if (u === NO)
            return;
        u._n(t);
    };
    ReplaceError.prototype._e = function (err) {
        var u = this.out;
        if (u === NO)
            return;
        try {
            this.ins._remove(this);
            (this.ins = this.f(err))._add(this);
        }
        catch (e) {
            u._e(e);
        }
    };
    ReplaceError.prototype._c = function () {
        var u = this.out;
        if (u === NO)
            return;
        u._c();
    };
    return ReplaceError;
}());
var StartWith = (function () {
    function StartWith(ins, val) {
        this.type = 'startWith';
        this.ins = ins;
        this.out = NO;
        this.val = val;
    }
    StartWith.prototype._start = function (out) {
        this.out = out;
        this.out._n(this.val);
        this.ins._add(out);
    };
    StartWith.prototype._stop = function () {
        this.ins._remove(this.out);
        this.out = NO;
    };
    return StartWith;
}());
var Take = (function () {
    function Take(max, ins) {
        this.type = 'take';
        this.ins = ins;
        this.out = NO;
        this.max = max;
        this.taken = 0;
    }
    Take.prototype._start = function (out) {
        this.out = out;
        this.taken = 0;
        if (this.max <= 0)
            out._c();
        else
            this.ins._add(this);
    };
    Take.prototype._stop = function () {
        this.ins._remove(this);
        this.out = NO;
    };
    Take.prototype._n = function (t) {
        var u = this.out;
        if (u === NO)
            return;
        var m = ++this.taken;
        if (m < this.max)
            u._n(t);
        else if (m === this.max) {
            u._n(t);
            u._c();
        }
    };
    Take.prototype._e = function (err) {
        var u = this.out;
        if (u === NO)
            return;
        u._e(err);
    };
    Take.prototype._c = function () {
        var u = this.out;
        if (u === NO)
            return;
        u._c();
    };
    return Take;
}());
var Stream = (function () {
    function Stream(producer) {
        this._prod = producer || NO;
        this._ils = [];
        this._stopID = NO;
        this._dl = NO;
        this._d = false;
        this._target = NO;
        this._err = NO;
    }
    Stream.prototype._n = function (t) {
        var a = this._ils;
        var L = a.length;
        if (this._d)
            this._dl._n(t);
        if (L == 1)
            a[0]._n(t);
        else if (L == 0)
            return;
        else {
            var b = cp(a);
            for (var i = 0; i < L; i++)
                b[i]._n(t);
        }
    };
    Stream.prototype._e = function (err) {
        if (this._err !== NO)
            return;
        this._err = err;
        var a = this._ils;
        var L = a.length;
        this._x();
        if (this._d)
            this._dl._e(err);
        if (L == 1)
            a[0]._e(err);
        else if (L == 0)
            return;
        else {
            var b = cp(a);
            for (var i = 0; i < L; i++)
                b[i]._e(err);
        }
        if (!this._d && L == 0)
            throw this._err;
    };
    Stream.prototype._c = function () {
        var a = this._ils;
        var L = a.length;
        this._x();
        if (this._d)
            this._dl._c();
        if (L == 1)
            a[0]._c();
        else if (L == 0)
            return;
        else {
            var b = cp(a);
            for (var i = 0; i < L; i++)
                b[i]._c();
        }
    };
    Stream.prototype._x = function () {
        if (this._ils.length === 0)
            return;
        if (this._prod !== NO)
            this._prod._stop();
        this._err = NO;
        this._ils = [];
    };
    Stream.prototype._stopNow = function () {
        // WARNING: code that calls this method should
        // first check if this._prod is valid (not `NO`)
        this._prod._stop();
        this._err = NO;
        this._stopID = NO;
    };
    Stream.prototype._add = function (il) {
        var ta = this._target;
        if (ta !== NO)
            return ta._add(il);
        var a = this._ils;
        a.push(il);
        if (a.length > 1)
            return;
        if (this._stopID !== NO) {
            clearTimeout(this._stopID);
            this._stopID = NO;
        }
        else {
            var p = this._prod;
            if (p !== NO)
                p._start(this);
        }
    };
    Stream.prototype._remove = function (il) {
        var _this = this;
        var ta = this._target;
        if (ta !== NO)
            return ta._remove(il);
        var a = this._ils;
        var i = a.indexOf(il);
        if (i > -1) {
            a.splice(i, 1);
            if (this._prod !== NO && a.length <= 0) {
                this._err = NO;
                this._stopID = setTimeout(function () { return _this._stopNow(); });
            }
            else if (a.length === 1) {
                this._pruneCycles();
            }
        }
    };
    // If all paths stemming from `this` stream eventually end at `this`
    // stream, then we remove the single listener of `this` stream, to
    // force it to end its execution and dispose resources. This method
    // assumes as a precondition that this._ils has just one listener.
    Stream.prototype._pruneCycles = function () {
        if (this._hasNoSinks(this, []))
            this._remove(this._ils[0]);
    };
    // Checks whether *there is no* path starting from `x` that leads to an end
    // listener (sink) in the stream graph, following edges A->B where B is a
    // listener of A. This means these paths constitute a cycle somehow. Is given
    // a trace of all visited nodes so far.
    Stream.prototype._hasNoSinks = function (x, trace) {
        if (trace.indexOf(x) !== -1)
            return true;
        else if (x.out === this)
            return true;
        else if (x.out && x.out !== NO)
            return this._hasNoSinks(x.out, trace.concat(x));
        else if (x._ils) {
            for (var i = 0, N = x._ils.length; i < N; i++)
                if (!this._hasNoSinks(x._ils[i], trace.concat(x)))
                    return false;
            return true;
        }
        else
            return false;
    };
    Stream.prototype.ctor = function () {
        return this instanceof MemoryStream ? MemoryStream : Stream;
    };
    /**
     * Adds a Listener to the Stream.
     *
     * @param {Listener} listener
     */
    Stream.prototype.addListener = function (listener) {
        listener._n = listener.next || noop;
        listener._e = listener.error || noop;
        listener._c = listener.complete || noop;
        this._add(listener);
    };
    /**
     * Removes a Listener from the Stream, assuming the Listener was added to it.
     *
     * @param {Listener<T>} listener
     */
    Stream.prototype.removeListener = function (listener) {
        this._remove(listener);
    };
    /**
     * Adds a Listener to the Stream returning a Subscription to remove that
     * listener.
     *
     * @param {Listener} listener
     * @returns {Subscription}
     */
    Stream.prototype.subscribe = function (listener) {
        this.addListener(listener);
        return new StreamSub(this, listener);
    };
    /**
     * Add interop between most.js and RxJS 5
     *
     * @returns {Stream}
     */
    Stream.prototype[symbol_observable_1.default] = function () {
        return this;
    };
    /**
     * Creates a new Stream given a Producer.
     *
     * @factory true
     * @param {Producer} producer An optional Producer that dictates how to
     * start, generate events, and stop the Stream.
     * @return {Stream}
     */
    Stream.create = function (producer) {
        if (producer) {
            if (typeof producer.start !== 'function'
                || typeof producer.stop !== 'function')
                throw new Error('producer requires both start and stop functions');
            internalizeProducer(producer); // mutates the input
        }
        return new Stream(producer);
    };
    /**
     * Creates a new MemoryStream given a Producer.
     *
     * @factory true
     * @param {Producer} producer An optional Producer that dictates how to
     * start, generate events, and stop the Stream.
     * @return {MemoryStream}
     */
    Stream.createWithMemory = function (producer) {
        if (producer)
            internalizeProducer(producer); // mutates the input
        return new MemoryStream(producer);
    };
    /**
     * Creates a Stream that does nothing when started. It never emits any event.
     *
     * Marble diagram:
     *
     * ```text
     *          never
     * -----------------------
     * ```
     *
     * @factory true
     * @return {Stream}
     */
    Stream.never = function () {
        return new Stream({ _start: noop, _stop: noop });
    };
    /**
     * Creates a Stream that immediately emits the "complete" notification when
     * started, and that's it.
     *
     * Marble diagram:
     *
     * ```text
     * empty
     * -|
     * ```
     *
     * @factory true
     * @return {Stream}
     */
    Stream.empty = function () {
        return new Stream({
            _start: function (il) { il._c(); },
            _stop: noop,
        });
    };
    /**
     * Creates a Stream that immediately emits an "error" notification with the
     * value you passed as the `error` argument when the stream starts, and that's
     * it.
     *
     * Marble diagram:
     *
     * ```text
     * throw(X)
     * -X
     * ```
     *
     * @factory true
     * @param error The error event to emit on the created stream.
     * @return {Stream}
     */
    Stream.throw = function (error) {
        return new Stream({
            _start: function (il) { il._e(error); },
            _stop: noop,
        });
    };
    /**
     * Creates a stream from an Array, Promise, or an Observable.
     *
     * @factory true
     * @param {Array|PromiseLike|Observable} input The input to make a stream from.
     * @return {Stream}
     */
    Stream.from = function (input) {
        if (typeof input[symbol_observable_1.default] === 'function')
            return Stream.fromObservable(input);
        else if (typeof input.then === 'function')
            return Stream.fromPromise(input);
        else if (Array.isArray(input))
            return Stream.fromArray(input);
        throw new TypeError("Type of input to from() must be an Array, Promise, or Observable");
    };
    /**
     * Creates a Stream that immediately emits the arguments that you give to
     * *of*, then completes.
     *
     * Marble diagram:
     *
     * ```text
     * of(1,2,3)
     * 123|
     * ```
     *
     * @factory true
     * @param a The first value you want to emit as an event on the stream.
     * @param b The second value you want to emit as an event on the stream. One
     * or more of these values may be given as arguments.
     * @return {Stream}
     */
    Stream.of = function () {
        var items = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            items[_i] = arguments[_i];
        }
        return Stream.fromArray(items);
    };
    /**
     * Converts an array to a stream. The returned stream will emit synchronously
     * all the items in the array, and then complete.
     *
     * Marble diagram:
     *
     * ```text
     * fromArray([1,2,3])
     * 123|
     * ```
     *
     * @factory true
     * @param {Array} array The array to be converted as a stream.
     * @return {Stream}
     */
    Stream.fromArray = function (array) {
        return new Stream(new FromArray(array));
    };
    /**
     * Converts a promise to a stream. The returned stream will emit the resolved
     * value of the promise, and then complete. However, if the promise is
     * rejected, the stream will emit the corresponding error.
     *
     * Marble diagram:
     *
     * ```text
     * fromPromise( ----42 )
     * -----------------42|
     * ```
     *
     * @factory true
     * @param {PromiseLike} promise The promise to be converted as a stream.
     * @return {Stream}
     */
    Stream.fromPromise = function (promise) {
        return new Stream(new FromPromise(promise));
    };
    /**
     * Converts an Observable into a Stream.
     *
     * @factory true
     * @param {any} observable The observable to be converted as a stream.
     * @return {Stream}
     */
    Stream.fromObservable = function (obs) {
        if (obs.endWhen)
            return obs;
        return new Stream(new FromObservable(obs));
    };
    /**
     * Creates a stream that periodically emits incremental numbers, every
     * `period` milliseconds.
     *
     * Marble diagram:
     *
     * ```text
     *     periodic(1000)
     * ---0---1---2---3---4---...
     * ```
     *
     * @factory true
     * @param {number} period The interval in milliseconds to use as a rate of
     * emission.
     * @return {Stream}
     */
    Stream.periodic = function (period) {
        return new Stream(new Periodic(period));
    };
    Stream.prototype._map = function (project) {
        return new (this.ctor())(new MapOp(project, this));
    };
    /**
     * Transforms each event from the input Stream through a `project` function,
     * to get a Stream that emits those transformed events.
     *
     * Marble diagram:
     *
     * ```text
     * --1---3--5-----7------
     *    map(i => i * 10)
     * --10--30-50----70-----
     * ```
     *
     * @param {Function} project A function of type `(t: T) => U` that takes event
     * `t` of type `T` from the input Stream and produces an event of type `U`, to
     * be emitted on the output Stream.
     * @return {Stream}
     */
    Stream.prototype.map = function (project) {
        return this._map(project);
    };
    /**
     * It's like `map`, but transforms each input event to always the same
     * constant value on the output Stream.
     *
     * Marble diagram:
     *
     * ```text
     * --1---3--5-----7-----
     *       mapTo(10)
     * --10--10-10----10----
     * ```
     *
     * @param projectedValue A value to emit on the output Stream whenever the
     * input Stream emits any value.
     * @return {Stream}
     */
    Stream.prototype.mapTo = function (projectedValue) {
        var s = this.map(function () { return projectedValue; });
        var op = s._prod;
        op.type = 'mapTo';
        return s;
    };
    /**
     * Only allows events that pass the test given by the `passes` argument.
     *
     * Each event from the input stream is given to the `passes` function. If the
     * function returns `true`, the event is forwarded to the output stream,
     * otherwise it is ignored and not forwarded.
     *
     * Marble diagram:
     *
     * ```text
     * --1---2--3-----4-----5---6--7-8--
     *     filter(i => i % 2 === 0)
     * ------2--------4---------6----8--
     * ```
     *
     * @param {Function} passes A function of type `(t: T) +> boolean` that takes
     * an event from the input stream and checks if it passes, by returning a
     * boolean.
     * @return {Stream}
     */
    Stream.prototype.filter = function (passes) {
        var p = this._prod;
        if (p instanceof Filter)
            return new Stream(new Filter(and(p.f, passes), p.ins));
        return new Stream(new Filter(passes, this));
    };
    /**
     * Lets the first `amount` many events from the input stream pass to the
     * output stream, then makes the output stream complete.
     *
     * Marble diagram:
     *
     * ```text
     * --a---b--c----d---e--
     *    take(3)
     * --a---b--c|
     * ```
     *
     * @param {number} amount How many events to allow from the input stream
     * before completing the output stream.
     * @return {Stream}
     */
    Stream.prototype.take = function (amount) {
        return new (this.ctor())(new Take(amount, this));
    };
    /**
     * Ignores the first `amount` many events from the input stream, and then
     * after that starts forwarding events from the input stream to the output
     * stream.
     *
     * Marble diagram:
     *
     * ```text
     * --a---b--c----d---e--
     *       drop(3)
     * --------------d---e--
     * ```
     *
     * @param {number} amount How many events to ignore from the input stream
     * before forwarding all events from the input stream to the output stream.
     * @return {Stream}
     */
    Stream.prototype.drop = function (amount) {
        return new Stream(new Drop(amount, this));
    };
    /**
     * When the input stream completes, the output stream will emit the last event
     * emitted by the input stream, and then will also complete.
     *
     * Marble diagram:
     *
     * ```text
     * --a---b--c--d----|
     *       last()
     * -----------------d|
     * ```
     *
     * @return {Stream}
     */
    Stream.prototype.last = function () {
        return new Stream(new Last(this));
    };
    /**
     * Prepends the given `initial` value to the sequence of events emitted by the
     * input stream. The returned stream is a MemoryStream, which means it is
     * already `remember()`'d.
     *
     * Marble diagram:
     *
     * ```text
     * ---1---2-----3---
     *   startWith(0)
     * 0--1---2-----3---
     * ```
     *
     * @param initial The value or event to prepend.
     * @return {MemoryStream}
     */
    Stream.prototype.startWith = function (initial) {
        return new MemoryStream(new StartWith(this, initial));
    };
    /**
     * Uses another stream to determine when to complete the current stream.
     *
     * When the given `other` stream emits an event or completes, the output
     * stream will complete. Before that happens, the output stream will behaves
     * like the input stream.
     *
     * Marble diagram:
     *
     * ```text
     * ---1---2-----3--4----5----6---
     *   endWhen( --------a--b--| )
     * ---1---2-----3--4--|
     * ```
     *
     * @param other Some other stream that is used to know when should the output
     * stream of this operator complete.
     * @return {Stream}
     */
    Stream.prototype.endWhen = function (other) {
        return new (this.ctor())(new EndWhen(other, this));
    };
    /**
     * "Folds" the stream onto itself.
     *
     * Combines events from the past throughout
     * the entire execution of the input stream, allowing you to accumulate them
     * together. It's essentially like `Array.prototype.reduce`. The returned
     * stream is a MemoryStream, which means it is already `remember()`'d.
     *
     * The output stream starts by emitting the `seed` which you give as argument.
     * Then, when an event happens on the input stream, it is combined with that
     * seed value through the `accumulate` function, and the output value is
     * emitted on the output stream. `fold` remembers that output value as `acc`
     * ("accumulator"), and then when a new input event `t` happens, `acc` will be
     * combined with that to produce the new `acc` and so forth.
     *
     * Marble diagram:
     *
     * ```text
     * ------1-----1--2----1----1------
     *   fold((acc, x) => acc + x, 3)
     * 3-----4-----5--7----8----9------
     * ```
     *
     * @param {Function} accumulate A function of type `(acc: R, t: T) => R` that
     * takes the previous accumulated value `acc` and the incoming event from the
     * input stream and produces the new accumulated value.
     * @param seed The initial accumulated value, of type `R`.
     * @return {MemoryStream}
     */
    Stream.prototype.fold = function (accumulate, seed) {
        return new MemoryStream(new Fold(accumulate, seed, this));
    };
    /**
     * Replaces an error with another stream.
     *
     * When (and if) an error happens on the input stream, instead of forwarding
     * that error to the output stream, *replaceError* will call the `replace`
     * function which returns the stream that the output stream will replicate.
     * And, in case that new stream also emits an error, `replace` will be called
     * again to get another stream to start replicating.
     *
     * Marble diagram:
     *
     * ```text
     * --1---2-----3--4-----X
     *   replaceError( () => --10--| )
     * --1---2-----3--4--------10--|
     * ```
     *
     * @param {Function} replace A function of type `(err) => Stream` that takes
     * the error that occurred on the input stream or on the previous replacement
     * stream and returns a new stream. The output stream will behave like the
     * stream that this function returns.
     * @return {Stream}
     */
    Stream.prototype.replaceError = function (replace) {
        return new (this.ctor())(new ReplaceError(replace, this));
    };
    /**
     * Flattens a "stream of streams", handling only one nested stream at a time
     * (no concurrency).
     *
     * If the input stream is a stream that emits streams, then this operator will
     * return an output stream which is a flat stream: emits regular events. The
     * flattening happens without concurrency. It works like this: when the input
     * stream emits a nested stream, *flatten* will start imitating that nested
     * one. However, as soon as the next nested stream is emitted on the input
     * stream, *flatten* will forget the previous nested one it was imitating, and
     * will start imitating the new nested one.
     *
     * Marble diagram:
     *
     * ```text
     * --+--------+---------------
     *   \        \
     *    \       ----1----2---3--
     *    --a--b----c----d--------
     *           flatten
     * -----a--b------1----2---3--
     * ```
     *
     * @return {Stream}
     */
    Stream.prototype.flatten = function () {
        var p = this._prod;
        return new Stream(new Flatten(this));
    };
    /**
     * Passes the input stream to a custom operator, to produce an output stream.
     *
     * *compose* is a handy way of using an existing function in a chained style.
     * Instead of writing `outStream = f(inStream)` you can write
     * `outStream = inStream.compose(f)`.
     *
     * @param {function} operator A function that takes a stream as input and
     * returns a stream as well.
     * @return {Stream}
     */
    Stream.prototype.compose = function (operator) {
        return operator(this);
    };
    /**
     * Returns an output stream that behaves like the input stream, but also
     * remembers the most recent event that happens on the input stream, so that a
     * newly added listener will immediately receive that memorised event.
     *
     * @return {MemoryStream}
     */
    Stream.prototype.remember = function () {
        return new MemoryStream(new Remember(this));
    };
    /**
     * Returns an output stream that identically behaves like the input stream,
     * but also runs a `spy` function for each event, to help you debug your app.
     *
     * *debug* takes a `spy` function as argument, and runs that for each event
     * happening on the input stream. If you don't provide the `spy` argument,
     * then *debug* will just `console.log` each event. This helps you to
     * understand the flow of events through some operator chain.
     *
     * Please note that if the output stream has no listeners, then it will not
     * start, which means `spy` will never run because no actual event happens in
     * that case.
     *
     * Marble diagram:
     *
     * ```text
     * --1----2-----3-----4--
     *         debug
     * --1----2-----3-----4--
     * ```
     *
     * @param {function} labelOrSpy A string to use as the label when printing
     * debug information on the console, or a 'spy' function that takes an event
     * as argument, and does not need to return anything.
     * @return {Stream}
     */
    Stream.prototype.debug = function (labelOrSpy) {
        return new (this.ctor())(new Debug(this, labelOrSpy));
    };
    /**
     * *imitate* changes this current Stream to emit the same events that the
     * `other` given Stream does. This method returns nothing.
     *
     * This method exists to allow one thing: **circular dependency of streams**.
     * For instance, let's imagine that for some reason you need to create a
     * circular dependency where stream `first$` depends on stream `second$`
     * which in turn depends on `first$`:
     *
     * <!-- skip-example -->
     * ```js
     * import delay from 'xstream/extra/delay'
     *
     * var first$ = second$.map(x => x * 10).take(3);
     * var second$ = first$.map(x => x + 1).startWith(1).compose(delay(100));
     * ```
     *
     * However, that is invalid JavaScript, because `second$` is undefined
     * on the first line. This is how *imitate* can help solve it:
     *
     * ```js
     * import delay from 'xstream/extra/delay'
     *
     * var secondProxy$ = xs.create();
     * var first$ = secondProxy$.map(x => x * 10).take(3);
     * var second$ = first$.map(x => x + 1).startWith(1).compose(delay(100));
     * secondProxy$.imitate(second$);
     * ```
     *
     * We create `secondProxy$` before the others, so it can be used in the
     * declaration of `first$`. Then, after both `first$` and `second$` are
     * defined, we hook `secondProxy$` with `second$` with `imitate()` to tell
     * that they are "the same". `imitate` will not trigger the start of any
     * stream, it just binds `secondProxy$` and `second$` together.
     *
     * The following is an example where `imitate()` is important in Cycle.js
     * applications. A parent component contains some child components. A child
     * has an action stream which is given to the parent to define its state:
     *
     * <!-- skip-example -->
     * ```js
     * const childActionProxy$ = xs.create();
     * const parent = Parent({...sources, childAction$: childActionProxy$});
     * const childAction$ = parent.state$.map(s => s.child.action$).flatten();
     * childActionProxy$.imitate(childAction$);
     * ```
     *
     * Note, though, that **`imitate()` does not support MemoryStreams**. If we
     * would attempt to imitate a MemoryStream in a circular dependency, we would
     * either get a race condition (where the symptom would be "nothing happens")
     * or an infinite cyclic emission of values. It's useful to think about
     * MemoryStreams as cells in a spreadsheet. It doesn't make any sense to
     * define a spreadsheet cell `A1` with a formula that depends on `B1` and
     * cell `B1` defined with a formula that depends on `A1`.
     *
     * If you find yourself wanting to use `imitate()` with a
     * MemoryStream, you should rework your code around `imitate()` to use a
     * Stream instead. Look for the stream in the circular dependency that
     * represents an event stream, and that would be a candidate for creating a
     * proxy Stream which then imitates the target Stream.
     *
     * @param {Stream} target The other stream to imitate on the current one. Must
     * not be a MemoryStream.
     */
    Stream.prototype.imitate = function (target) {
        if (target instanceof MemoryStream)
            throw new Error('A MemoryStream was given to imitate(), but it only ' +
                'supports a Stream. Read more about this restriction here: ' +
                'https://github.com/staltz/xstream#faq');
        this._target = target;
        for (var ils = this._ils, N = ils.length, i = 0; i < N; i++)
            target._add(ils[i]);
        this._ils = [];
    };
    /**
     * Forces the Stream to emit the given value to its listeners.
     *
     * As the name indicates, if you use this, you are most likely doing something
     * The Wrong Way. Please try to understand the reactive way before using this
     * method. Use it only when you know what you are doing.
     *
     * @param value The "next" value you want to broadcast to all listeners of
     * this Stream.
     */
    Stream.prototype.shamefullySendNext = function (value) {
        this._n(value);
    };
    /**
     * Forces the Stream to emit the given error to its listeners.
     *
     * As the name indicates, if you use this, you are most likely doing something
     * The Wrong Way. Please try to understand the reactive way before using this
     * method. Use it only when you know what you are doing.
     *
     * @param {any} error The error you want to broadcast to all the listeners of
     * this Stream.
     */
    Stream.prototype.shamefullySendError = function (error) {
        this._e(error);
    };
    /**
     * Forces the Stream to emit the "completed" event to its listeners.
     *
     * As the name indicates, if you use this, you are most likely doing something
     * The Wrong Way. Please try to understand the reactive way before using this
     * method. Use it only when you know what you are doing.
     */
    Stream.prototype.shamefullySendComplete = function () {
        this._c();
    };
    /**
     * Adds a "debug" listener to the stream. There can only be one debug
     * listener, that's why this is 'setDebugListener'. To remove the debug
     * listener, just call setDebugListener(null).
     *
     * A debug listener is like any other listener. The only difference is that a
     * debug listener is "stealthy": its presence/absence does not trigger the
     * start/stop of the stream (or the producer inside the stream). This is
     * useful so you can inspect what is going on without changing the behavior
     * of the program. If you have an idle stream and you add a normal listener to
     * it, the stream will start executing. But if you set a debug listener on an
     * idle stream, it won't start executing (not until the first normal listener
     * is added).
     *
     * As the name indicates, we don't recommend using this method to build app
     * logic. In fact, in most cases the debug operator works just fine. Only use
     * this one if you know what you're doing.
     *
     * @param {Listener<T>} listener
     */
    Stream.prototype.setDebugListener = function (listener) {
        if (!listener) {
            this._d = false;
            this._dl = NO;
        }
        else {
            this._d = true;
            listener._n = listener.next || noop;
            listener._e = listener.error || noop;
            listener._c = listener.complete || noop;
            this._dl = listener;
        }
    };
    return Stream;
}());
/**
 * Blends multiple streams together, emitting events from all of them
 * concurrently.
 *
 * *merge* takes multiple streams as arguments, and creates a stream that
 * behaves like each of the argument streams, in parallel.
 *
 * Marble diagram:
 *
 * ```text
 * --1----2-----3--------4---
 * ----a-----b----c---d------
 *            merge
 * --1-a--2--b--3-c---d--4---
 * ```
 *
 * @factory true
 * @param {Stream} stream1 A stream to merge together with other streams.
 * @param {Stream} stream2 A stream to merge together with other streams. Two
 * or more streams may be given as arguments.
 * @return {Stream}
 */
Stream.merge = function merge() {
    var streams = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        streams[_i] = arguments[_i];
    }
    return new Stream(new Merge(streams));
};
/**
 * Combines multiple input streams together to return a stream whose events
 * are arrays that collect the latest events from each input stream.
 *
 * *combine* internally remembers the most recent event from each of the input
 * streams. When any of the input streams emits an event, that event together
 * with all the other saved events are combined into an array. That array will
 * be emitted on the output stream. It's essentially a way of joining together
 * the events from multiple streams.
 *
 * Marble diagram:
 *
 * ```text
 * --1----2-----3--------4---
 * ----a-----b-----c--d------
 *          combine
 * ----1a-2a-2b-3b-3c-3d-4d--
 * ```
 *
 * Note: to minimize garbage collection, *combine* uses the same array
 * instance for each emission.  If you need to compare emissions over time,
 * cache the values with `map` first:
 *
 * ```js
 * import pairwise from 'xstream/extra/pairwise'
 *
 * const stream1 = xs.of(1);
 * const stream2 = xs.of(2);
 *
 * xs.combine(stream1, stream2).map(
 *   combinedEmissions => ([ ...combinedEmissions ])
 * ).compose(pairwise)
 * ```
 *
 * @factory true
 * @param {Stream} stream1 A stream to combine together with other streams.
 * @param {Stream} stream2 A stream to combine together with other streams.
 * Multiple streams, not just two, may be given as arguments.
 * @return {Stream}
 */
Stream.combine = function combine() {
    var streams = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        streams[_i] = arguments[_i];
    }
    return new Stream(new Combine(streams));
};
exports.Stream = Stream;
var MemoryStream = (function (_super) {
    __extends(MemoryStream, _super);
    function MemoryStream(producer) {
        var _this = _super.call(this, producer) || this;
        _this._has = false;
        return _this;
    }
    MemoryStream.prototype._n = function (x) {
        this._v = x;
        this._has = true;
        _super.prototype._n.call(this, x);
    };
    MemoryStream.prototype._add = function (il) {
        var ta = this._target;
        if (ta !== NO)
            return ta._add(il);
        var a = this._ils;
        a.push(il);
        if (a.length > 1) {
            if (this._has)
                il._n(this._v);
            return;
        }
        if (this._stopID !== NO) {
            if (this._has)
                il._n(this._v);
            clearTimeout(this._stopID);
            this._stopID = NO;
        }
        else if (this._has)
            il._n(this._v);
        else {
            var p = this._prod;
            if (p !== NO)
                p._start(this);
        }
    };
    MemoryStream.prototype._stopNow = function () {
        this._has = false;
        _super.prototype._stopNow.call(this);
    };
    MemoryStream.prototype._x = function () {
        this._has = false;
        _super.prototype._x.call(this);
    };
    MemoryStream.prototype.map = function (project) {
        return this._map(project);
    };
    MemoryStream.prototype.mapTo = function (projectedValue) {
        return _super.prototype.mapTo.call(this, projectedValue);
    };
    MemoryStream.prototype.take = function (amount) {
        return _super.prototype.take.call(this, amount);
    };
    MemoryStream.prototype.endWhen = function (other) {
        return _super.prototype.endWhen.call(this, other);
    };
    MemoryStream.prototype.replaceError = function (replace) {
        return _super.prototype.replaceError.call(this, replace);
    };
    MemoryStream.prototype.remember = function () {
        return this;
    };
    MemoryStream.prototype.debug = function (labelOrSpy) {
        return _super.prototype.debug.call(this, labelOrSpy);
    };
    return MemoryStream;
}(Stream));
exports.MemoryStream = MemoryStream;
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Stream;

},{"symbol-observable":129}],141:[function(require,module,exports){
'use strict';

var _run = require('@cycle/run');

var _dom = require('@cycle/dom');

var _storage = require('@cycle/storage');

var _storage2 = _interopRequireDefault(_storage);

var _history = require('@cycle/history');

var _cycleOnionify = require('cycle-onionify');

var _cycleOnionify2 = _interopRequireDefault(_cycleOnionify);

var _cycleStorageify = require('cycle-storageify');

var _cycleStorageify2 = _interopRequireDefault(_cycleStorageify);

var _TaskList = require('./components/TaskList');

var _TaskList2 = _interopRequireDefault(_TaskList);

var _props = require('snabbdom/modules/props');

var _props2 = _interopRequireDefault(_props);

var _attributes = require('snabbdom/modules/attributes');

var _attributes2 = _interopRequireDefault(_attributes);

var _style = require('snabbdom/modules/style');

var _style2 = _interopRequireDefault(_style);

var _class = require('snabbdom/modules/class');

var _class2 = _interopRequireDefault(_class);

var _snabbdomTypestyle = require('snabbdom-typestyle');

var _snabbdomTypestyle2 = _interopRequireDefault(_snabbdomTypestyle);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var modules = [_props2.default, _attributes2.default, _style2.default, _snabbdomTypestyle2.default, _class2.default];

var main = (0, _cycleOnionify2.default)((0, _cycleStorageify2.default)(_TaskList2.default, { key: 'todos-cycle' }));

(0, _run.run)(main, {
  DOM: (0, _dom.makeDOMDriver)('.todoapp', { modules: modules, transposition: true }),
  history: (0, _history.captureClicks)((0, _history.makeHistoryDriver)()),
  storage: _storage2.default
});

},{"./components/TaskList":148,"@cycle/dom":11,"@cycle/history":22,"@cycle/run":25,"@cycle/storage":26,"cycle-onionify":32,"cycle-storageify":36,"snabbdom-typestyle":115,"snabbdom/modules/attributes":120,"snabbdom/modules/class":121,"snabbdom/modules/props":123,"snabbdom/modules/style":124}],142:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = Task;

var _intent = require('./intent');

var _intent2 = _interopRequireDefault(_intent);

var _model = require('./model');

var _model2 = _interopRequireDefault(_model);

var _view = require('./view');

var _view2 = _interopRequireDefault(_view);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function Task(sources) {
  var actions = (0, _intent2.default)(sources.DOM);
  var reducer$ = (0, _model2.default)(actions);
  var vdom$ = (0, _view2.default)(sources.onion.state$);

  return {
    DOM: vdom$,
    onion: reducer$
  };
}

},{"./intent":143,"./model":144,"./view":146}],143:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = intent;

var _xstream = require('xstream');

var _xstream2 = _interopRequireDefault(_xstream);

var _utils = require('../../utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function intent(domSource) {
  var editEnterEvent$ = domSource.select('.edit').events('keyup').filter(function (ev) {
    return ev.keyCode === _utils.ENTER_KEY;
  });

  var editBlurEvent$ = domSource.select('.edit').events('blur', true);

  return {
    startEdit$: domSource.select('label').events('dblclick').mapTo(null),

    doneEdit$: _xstream2.default.merge(editEnterEvent$, editBlurEvent$).map(function (ev) {
      return ev.target.value;
    }),

    cancelEdit$: domSource.select('.edit').events('keyup').filter(function (ev) {
      return ev.keyCode === _utils.ESC_KEY;
    }).mapTo(null),

    toggle$: domSource.select('.toggle').events('change').map(function (ev) {
      return ev.target.checked;
    }),

    destroy$: domSource.select('.destroy').events('click').mapTo(null),

    hover$: domSource.select('.todo-root').events('mouseover').mapTo(null),

    unhover$: domSource.select('.todo-root').events('mouseleave').mapTo(null)

  };
}

},{"../../utils":154,"xstream":140}],144:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.default = model;

var _xstream = require('xstream');

var _xstream2 = _interopRequireDefault(_xstream);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function model(actions) {
  var startEditReducer$ = actions.startEdit$.mapTo(function startEditReducer(data) {
    return _extends({}, data, { editing: true });
  });

  var doneEditReducer$ = actions.doneEdit$.map(function (content) {
    return function doneEditReducer(data) {
      return _extends({}, data, { title: content, editing: false });
    };
  });

  var cancelEditReducer$ = actions.cancelEdit$.mapTo(function cancelEditReducer(data) {
    return _extends({}, data, { editing: false });
  });

  var toggleReducer$ = actions.toggle$.map(function (isToggled) {
    return function toggleReducer(data) {
      return _extends({}, data, { completed: isToggled });
    };
  });

  var destroyReducer$ = actions.destroy$.mapTo(function destroyReducer(data) {
    return void 0;
  });

  var hoverReducer$ = actions.hover$.mapTo(function hoverReducer(data) {
    return _extends({}, data, { hover: true });
  });

  var unhoverReducer$ = actions.unhover$.mapTo(function unhoverReducer(data) {
    return _extends({}, data, { hover: false });
  });

  return _xstream2.default.merge(startEditReducer$, doneEditReducer$, cancelEditReducer$, toggleReducer$, destroyReducer$, hoverReducer$, unhoverReducer$);
}

},{"xstream":140}],145:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.destroy = exports.label = exports.todoInput = exports.toggle = exports.todoLi = exports.view = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _styles = require('../../styles');

var styles = _interopRequireWildcard(_styles);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var view = exports.view = function view(editing) {
  return {
    'display': editing ? 'none' : 'block'
  };
};

var todoLi = exports.todoLi = function todoLi(editing, last) {
  return _extends({
    'position': 'relative',
    'font-size': '24px'
  }, editing ? {
    'border-bottom': 'none',
    'padding': '0'
  } : {
    'border-bottom': '1px solid #ededed'
  }, last ? { // Instead of using a :last-child selector,
    'border-bottom': 'none' // the element selects the style
  } : {});
};

var toggle = exports.toggle = function toggle() {
  return {
    'text-align': 'center',
    'width': '40px',
    'height': 'auto',
    'position': 'absolute',
    'top': '0',
    'bottom': '0',
    'margin': 'auto 0',
    'border': 'none',
    'appearance': 'none',
    '-webkit-appearance': 'none'
  };
};

var todoInput = exports.todoInput = function todoInput(editing) {
  return _extends({}, styles.input(), editing ? {
    'display': 'block',
    'width': '506px',
    'padding': '13px 17px 12px 17px',
    'margin': '0 0 0 43px'
  } : {
    'display': 'none'
  });
};

var label = exports.label = function label(completed) {
  return _extends({
    'word-break': 'break-all',
    'padding': '15px 15px 15px 60px',
    'display': 'block',
    'line-height': '1.2',
    'transition': 'color 0.4s',
    'background-repeat': 'no-repeat',
    'background-position': 'center left'
  }, completed ? {
    'color': '#d9d9d9',
    'text-decoration': 'line-through',
    'background-image': 'url(\'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%22-10%20-18%20100%20135%22%3E%3Ccircle%20cx%3D%2250%22%20cy%3D%2250%22%20r%3D%2250%22%20fill%3D%22none%22%20stroke%3D%22%23bddad5%22%20stroke-width%3D%223%22/%3E%3Cpath%20fill%3D%22%235dc2af%22%20d%3D%22M72%2025L42%2071%2027%2056l-4%204%2020%2020%2034-52z%22/%3E%3C/svg%3E\')'
  } : {
    'background-image': 'url(\'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%22-10%20-18%20100%20135%22%3E%3Ccircle%20cx%3D%2250%22%20cy%3D%2250%22%20r%3D%2250%22%20fill%3D%22none%22%20stroke%3D%22%23ededed%22%20stroke-width%3D%223%22/%3E%3C/svg%3E\')'
  });
};

var destroy = exports.destroy = function destroy(todoHover) {
  return _extends({}, styles.button(), {
    'display': todoHover ? 'block' : 'none', // Hover can be done in javascript
    'position': 'absolute',
    'top': '0',
    'right': '10px',
    'bottom': '0',
    'width': '40px',
    'height': '40px',
    'margin': 'auto 0',
    'color': '#cc9a9a',
    'font-size': '30px',
    'transition': 'color 0.2s ease-out',
    'margin-bottom': '11px',
    '$nest': {
      '&:hover': { // Hover can also be done in plain css
        'color': '#af5b5e'
      },
      '&:after': {
        'content': '\'\xD7\''
      }
    }
  });
};

},{"../../styles":153}],146:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = view;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var todoLiStyle = exports.todoLiStyle = function todoLiStyle(editing) {
  return _extends({
    'position': 'relative',
    'font-size': '24px'
  }, editing ? {
    'border-bottom': 'none',
    'padding': '0'
  } : {
    'border-bottom': '1px solid #ededed'
  });
};

var fontSmoothingStyle = exports.fontSmoothingStyle = function fontSmoothingStyle() {
  return {
    '-webkit-font-smoothing': 'antialiased',
    '-moz-font-smoothing': 'antialiased',
    'font-smoothing': 'antialiased'
  };
};

var todoInputStyle = exports.todoInputStyle = function todoInputStyle(editing) {
  var _extends2;

  return _extends((_extends2 = {
    'position': 'relative',
    'margin': '0',
    'width': '100%',
    'font-size': '24px',
    'font-family': 'inherit',
    'font-weight': 'inherit',
    'line-height': '1.4em',
    'border': '0',
    'outline': 'none',
    'color': 'inherit',
    'padding': '6px'
  }, _defineProperty(_extends2, 'border', '1px solid #999'), _defineProperty(_extends2, 'box-shadow', 'inset 0 -1px 5px 0 rgba(0, 0, 0, 0.2)'), _defineProperty(_extends2, 'box-sizing', 'border-box'), _extends2), fontSmoothingStyle, editing ? {
    'display': 'block',
    'width': '506px',
    'padding': '13px 17px 12px 17px',
    'margin': '0 0 0 43px'
  } : {
    'display': 'none'
  });
};

},{}],121:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _dom = require('@cycle/dom');

var _styles = require('./styles');

var styles = _interopRequireWildcard(_styles);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function view(state$) {
  return state$.map(function (_ref) {
    var title = _ref.title,
        completed = _ref.completed,
        editing = _ref.editing,
        hover = _ref.hover,
        last = _ref.last;
    return (0, _dom.li)('.todo-root', { css: styles.todoLi(editing, last), class: { completed: completed, editing: editing } }, [(0, _dom.div)('.view', { css: styles.view(editing) }, [(0, _dom.input)('.toggle', {
      props: { type: 'checkbox', checked: completed },
      css: styles.toggle()
    }), (0, _dom.label)({ css: styles.label(completed) }, title), (0, _dom.button)('.destroy', { css: styles.destroy(hover) })]), (0, _dom.input)('.edit', {
      css: styles.todoInput(editing),
      props: { type: 'text' },
      hook: {
        update: function update(oldVNode, _ref) {
          var elm = _ref.elm;

          elm.value = title;
          if (editing) {
            elm.focus();
            elm.selectionStart = elm.value.length;
          }
        }
      }
    })]);
  });
}

},{"./styles":145,"@cycle/dom":11}],147:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.List = undefined;

var _dom = require('@cycle/dom');

var _cycleOnionify = require('cycle-onionify');

var _index = require('../Task/index');

var _index2 = _interopRequireDefault(_index);

var _styles = require('./styles');

var styles = _interopRequireWildcard(_styles);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var List = exports.List = (0, _cycleOnionify.makeCollection)({
  item: _index2.default,
  itemKey: function itemKey(state) {
    return state.key;
  },
  itemScope: function itemScope(key) {
    return key;
  },
  collectSinks: function collectSinks(instances) {
    return {
      DOM: instances.pickCombine('DOM').map(function (vnodes) {
        return (0, _dom.ul)('.todo-list', { css: styles.todoList() }, vnodes);
      }),
      onion: instances.pickMerge('onion')
    };
  }
});

},{"../Task/index":142,"./styles":151,"@cycle/dom":11,"cycle-onionify":32}],148:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.listLens = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.default = TaskList;

var _xstream = require('xstream');

var _xstream2 = _interopRequireDefault(_xstream);

var _isolate = require('@cycle/isolate');

var _isolate2 = _interopRequireDefault(_isolate);

var _intent = require('./intent');

var _intent2 = _interopRequireDefault(_intent);

var _model = require('./model');

var _model2 = _interopRequireDefault(_model);

var _view = require('./view');

var _view2 = _interopRequireDefault(_view);

var _List = require('./List');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function omit(obj, key) {
  var tmp = _extends({}, obj);
  delete tmp[key];
  return tmp;
}

var listLens = exports.listLens = {
  get: function get(state) {
    return state.list.filter(state.filterFn).slice(0, -1).concat(_extends({}, state.list[state.list.length - 1], {
      last: true
    }));
  },
  set: function set(state, nextFilteredList) {
    var prevFilteredList = state.list.filter(state.filterFn);
    var newList = state.list.map(function (task) {
      return nextFilteredList.find(function (t) {
        return t.key === task.key;
      }) || task;
    }).filter(function (task) {
      return prevFilteredList.some(function (t) {
        return t.key === task.key;
      }) && nextFilteredList.some(function (t) {
        return t.key === task.key;
      });
    });

    return _extends({}, state, {
      list: newList.slice(0, -1).concat(omit(newList[newList.length - 1], 'last'))
    });
  }
};

function TaskList(sources) {
  var state$ = sources.onion.state$;
  var actions = (0, _intent2.default)(sources.DOM, sources.history);
  var parentReducer$ = (0, _model2.default)(actions);

  var listSinks = (0, _isolate2.default)(_List.List, { onion: listLens })(sources);
  var listVDom$ = listSinks.DOM;
  var listReducer$ = listSinks.onion;

  var vdom$ = (0, _view2.default)(state$, listVDom$);
  var reducer$ = _xstream2.default.merge(parentReducer$, listReducer$);

  return {
    DOM: vdom$,
    onion: reducer$
  };
}

},{"./List":147,"./intent":149,"./model":150,"./view":152,"@cycle/isolate":23,"xstream":140}],149:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = intent;

var _xstream = require('xstream');

var _xstream2 = _interopRequireDefault(_xstream);

var _dropRepeats = require('xstream/extra/dropRepeats');

var _dropRepeats2 = _interopRequireDefault(_dropRepeats);

var _utils = require('../../utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function intent(domSource, historySource) {
  return {
    changeRoute$: historySource.map(function (location) {
      return location.pathname;
    }).compose((0, _dropRepeats2.default)()),

    updateInputValue$: domSource.select('.new-todo').events('input').map(function (ev) {
      return ev.target.value;
    }),

    cancelInput$: domSource.select('.new-todo').events('keydown').filter(function (ev) {
      return ev.keyCode === _utils.ESC_KEY;
    }),

    insertTodo$: domSource.select('.new-todo').events('keydown').filter(function (ev) {
      var trimmedVal = String(ev.target.value).trim();
      return ev.keyCode === _utils.ENTER_KEY && trimmedVal;
    }).map(function (ev) {
      return String(ev.target.value).trim();
    }),

    toggleAll$: domSource.select('.toggle-all').events('click').map(function (ev) {
      return ev.target.checked;
    }),

    deleteCompleted$: domSource.select('.clear-completed').events('click').mapTo(null)
  };
};

},{"../../utils":154,"xstream":140,"xstream/extra/dropRepeats":139}],150:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.default = model;

var _xstream = require('xstream');

var _xstream2 = _interopRequireDefault(_xstream);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function getFilterFn(route) {
  switch (route) {
    case '/active':
      return function (task) {
        return task.completed === false;
      };
    case '/completed':
      return function (task) {
        return task.completed === true;
      };
    default:
      return function () {
        return true;
      }; // allow anything
  }
}

var uuid = Date.now();

function model(actions) {
  var initialReducer$ = _xstream2.default.of(function initialReducer(prevState) {
    if (prevState) {
      return prevState;
    } else {
      return {
        inputValue: '',
        list: [],
        filter: '',
        filterFn: function filterFn() {
          return true;
        } // allow anything
      };
    }
  });

  var changeRouteReducer$ = actions.changeRoute$.startWith('/').map(function (path) {
    var filterFn = getFilterFn(path);
    return function changeRouteReducer(prevState) {
      return _extends({}, prevState, {
        filter: path.replace('/', '').trim(),
        filterFn: filterFn
      });
    };
  });

  var updateInputValueReducer$ = actions.updateInputValue$.map(function (inputValue) {
    return function updateInputValue(prevState) {
      return _extends({}, prevState, { inputValue: inputValue });
    };
  });

  var clearInputReducer$ = _xstream2.default.merge(actions.cancelInput$, actions.insertTodo$).mapTo(function clearInputReducer(prevState) {
    return _extends({}, prevState, { inputValue: '' });
  });

  var insertTodoReducer$ = actions.insertTodo$.map(function (content) {
    return function insertTodoReducer(prevState) {
      var newTodo = {
        key: uuid++,
        title: content,
        completed: false,
        editing: false,
        hover: false,
        last: false
      };
      return _extends({}, prevState, {
        list: prevState.list.concat(newTodo)
      });
    };
  });

  var toggleAllReducer$ = actions.toggleAll$.map(function (isToggled) {
    return function toggleAllReducer(prevState) {
      return _extends({}, prevState, {
        list: prevState.list.map(function (task) {
          return _extends({}, task, { completed: isToggled });
        })
      });
    };
  });

  var deleteCompletedReducer$ = actions.deleteCompleted$.mapTo(function deleteCompletedsReducer(prevState) {
    return _extends({}, prevState, {
      list: prevState.list.filter(function (task) {
        return task.completed === false;
      })
    });
  });

  return _xstream2.default.merge(initialReducer$, updateInputValueReducer$, changeRouteReducer$, clearInputReducer$, insertTodoReducer$, toggleAllReducer$, deleteCompletedReducer$);
}

},{"xstream":140}],151:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.clearCompleted = exports.toggleAllLabel = exports.toggleAll = exports.filtersA = exports.filtersLi = exports.filters = exports.footer = exports.todoCount = exports.todoList = exports.title = exports.input = exports.main = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _styles = require('../../styles');

var styles = _interopRequireWildcard(_styles);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var main = exports.main = function main(listLength) {
  return {
    'display': listLength ? 'block' : 'none',
    'position': 'relative',
    'z-index': '2',
    'border-top': '1px solid #e6e6e6'
  };
};

var input = exports.input = function input() {
  return _extends({}, styles.input(), {
    'padding': '16px 16px 16px 60px',
    'border': 'none',
    'background': 'rgba(0, 0, 0, 0.003)',
    'box-shadow': 'inset 0 -2px 1px rgba(0,0,0,0.03)'
  });
};

var title = exports.title = function title() {
  return _extends({
    'position': 'absolute',
    'top': '-155px',
    'width': '100%',
    'font-size': '100px',
    'font-weight': '100',
    'text-align': 'center',
    'color': 'rgba(175, 47, 47, 0.15)'
  }, styles.optimizedText());
};

var todoList = exports.todoList = function todoList() {
  return {
    'margin': '0',
    'padding': '0',
    'list-style': 'none'
  };
};

var todoCount = exports.todoCount = function todoCount() {
  return {
    'float': 'left',
    'text-align': 'left'
  };
};

var footer = exports.footer = function footer(listLength) {
  return {
    'display': listLength ? '' : 'none',
    'color': '#777',
    'padding': '10px 15px',
    'height': '20px',
    'text-align': 'center',
    'border-top': '1px solid #e6e6e6',
    '$nest': {
      '&:before': {
        'content': '""',
        'position': 'absolute',
        'right': '0',
        'bottom': '0',
        'left': '0',
        'height': '50px',
        'overflow': 'hidden',
        'box-shadow': '0 1px 1px rgba(0, 0, 0, 0.2),\n                     0 8px 0 -3px #f6f6f6,\n                     0 9px 1px -3px rgba(0, 0, 0, 0.2),\n                     0 16px 0 -6px #f6f6f6,\n                     0 17px 2px -6px rgba(0, 0, 0, 0.2)'
      }
    }
  };
};

var filters = exports.filters = function filters() {
  return {
    'margin': '0',
    'padding': '0',
    'list-style': 'none',
    'position': 'absolute',
    'right': '0',
    'left': '0'
  };
};

var filtersLi = exports.filtersLi = function filtersLi() {
  return {
    'display': 'inline'
  };
};

var filtersA = exports.filtersA = function filtersA(selected) {
  return _extends({
    'color': 'inherit',
    'margin': '3px',
    'padding': '3px 7px',
    'border': '1px solid transparent',
    'border-radius': '3px'
  }, selected ? {
    'border-color': 'rgba(175, 47, 47, 0.1)'
  } : {}, {
    'text-decoration': 'none',
    '$nest': {
      '&:hover': {
        'border-color': 'rgba(175, 47, 47, 0.2)'
      }
    }
  });
};

var toggleAll = exports.toggleAll = function toggleAll() {
  return {
    'text-align': 'center',
    'border': 'none',
    'opacity': '0',
    'position': 'absolute'
  };
};

var toggleAllLabel = exports.toggleAllLabel = function toggleAllLabel(checked) {
  return _extends({
    'width': '60px',
    'height': '34px',
    'font-size': '0',
    'position': 'absolute',
    'top': '-52px',
    'left': '-13px'
  }, styles.rotate(90), {
    '$nest': {
      '&:before': {
        'content': '\'\u276F\'',
        'font-size': '22px',
        'color': checked ? '#737373' : '#e6e6e6',
        'padding': '10px 27px 10px 27px'
      }
    }
  });
};

var clearCompleted = exports.clearCompleted = function clearCompleted() {
  return _extends({}, styles.button(), {
    'float': 'right',
    'position': 'relative',
    'line-height': '20px',
    'text-decoration': 'none',
    'cursor': 'pointer',
    '$nest': {
      '&:hover': {
        'text-decoration': 'underline'
      }
    }
  });
};

},{"../../styles":153}],152:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

exports.default = view;

var _xstream = require('xstream');

var _xstream2 = _interopRequireDefault(_xstream);

var _dom = require('@cycle/dom');

var _styles = require('../../styles');

var globalStyles = _interopRequireWildcard(_styles);

var _styles2 = require('./styles');

var styles = _interopRequireWildcard(_styles2);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function renderHeader(state) {
  return (0, _dom.header)([(0, _dom.h1)({ css: styles.title() }, 'todos'), (0, _dom.input)('.new-todo', {
    props: {
      type: 'text',
      placeholder: 'What needs to be done?',
      autofocus: true,
      name: 'newTodo',
      value: state.inputValue
    },
    css: styles.input()
  })]);
}

function renderMainSection(state, listVDom) {
  var allCompleted = state.list.reduce(function (x, y) {
    return x && y.completed;
  }, true);

  return (0, _dom.section)('.main', { css: styles.main(state.list.length) }, [(0, _dom.input)('#toggle-all.toggle-all', {
    props: { type: 'checkbox', checked: allCompleted },
    css: styles.toggleAll()
  }), (0, _dom.label)('.label', {
    attrs: { for: 'toggle-all' },
    css: styles.toggleAllLabel(allCompleted)
  }, 'Mark all as complete'), listVDom]);
}

function renderFilterButton(state, filterTag, path, label) {
  var selected = state.filter === filterTag;
  return (0, _dom.li)({ css: styles.filtersLi() }, [(0, _dom.a)({
    attrs: { href: path },
    css: styles.filtersA(selected)
  }, label)]);
}

function renderFooter(state) {
  var amountCompleted = state.list.filter(function (task) {
    return task.completed;
  }).length;
  var amountActive = state.list.length - amountCompleted;

  return (0, _dom.footer)('.footer', { css: styles.footer(state.list.length) }, [(0, _dom.span)('.todo-count', { css: styles.todoCount() }, [(0, _dom.strong)({ css: globalStyles.strong() }, String(amountActive)), ' item' + (amountActive !== 1 ? 's' : '') + ' left']), (0, _dom.ul)('.filters', { css: styles.filters() }, [renderFilterButton(state, '', '/', 'All'), renderFilterButton(state, 'active', '/active', 'Active'), renderFilterButton(state, 'completed', '/completed', 'Completed')]), amountCompleted > 0 ? (0, _dom.button)('.clear-completed', { css: styles.clearCompleted() }, 'Clear completed (' + amountCompleted + ')') : null]);
}

function view(state$, listVDom$) {
  return _xstream2.default.combine(state$, listVDom$).map(function (_ref) {
    var _ref2 = _slicedToArray(_ref, 2),
        state = _ref2[0],
        listVDom = _ref2[1];

    return (0, _dom.div)([renderHeader(state), renderMainSection(state, listVDom), renderFooter(state)]);
  });
};

},{"../../styles":153,"./styles":151,"@cycle/dom":11,"xstream":140}],153:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var strong = exports.strong = function strong() {
  return {
    'font-weight': '300'
  };
};

var rotate = exports.rotate = function rotate(degrees) {
  return {
    '-webkit-transform': 'rotate(' + degrees + 'deg)',
    'transform': 'rotate(' + degrees + 'deg)'
  };
};

var fontSmoothing = exports.fontSmoothing = function fontSmoothing() {
  return {
    '-webkit-font-smoothing': 'antialiased',
    '-moz-font-smoothing': 'grayscale'
  };
};

var optimizedText = exports.optimizedText = function optimizedText() {
  return {
    '-webkit-text-rendering': 'optimizeLegibility',
    '-moz-text-rendering': 'optimizeLegibility',
    'text-rendering': 'optimizeLegibility'
  };
};

var normalizeAppearance = exports.normalizeAppearance = function normalizeAppearance() {
  return {
    '-webkit-appearance': 'none',
    'appearance': 'none'
  };
};

var input = exports.input = function input() {
  var _extends2;

  return _extends((_extends2 = {
    'position': 'relative',
    'margin': '0',
    'width': '100%',
    'font-size': '24px',
    'font-family': 'inherit',
    'font-weight': 'inherit',
    'line-height': '1.4em',
    'border': '0',
    'outline': 'none',
    'color': 'inherit',
    'padding': '6px'
  }, _defineProperty(_extends2, 'border', '1px solid #999'), _defineProperty(_extends2, 'box-shadow', 'inset 0 -1px 5px 0 rgba(0, 0, 0, 0.2)'), _defineProperty(_extends2, 'box-sizing', 'border-box'), _extends2), fontSmoothing());
};

var button = exports.button = function button() {
  return _extends({
    'margin': '0',
    'padding': '0',
    'border': '0',
    'background': 'none',
    'font-size': '100%',
    'vertical-align': 'baseline',
    'font-family': 'inherit',
    'font-weight': 'inherit',
    'color': 'inherit'
  }, normalizeAppearance(), fontSmoothing());
};

},{}],154:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var ENTER_KEY = 13;
var ESC_KEY = 27;

exports.ENTER_KEY = ENTER_KEY;
exports.ESC_KEY = ESC_KEY;

},{}]},{},[141])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL2RvbS9saWIvQm9keURPTVNvdXJjZS5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvZG9tL2xpYi9Eb2N1bWVudERPTVNvdXJjZS5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvZG9tL2xpYi9FbGVtZW50RmluZGVyLmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9kb20vbGliL0V2ZW50RGVsZWdhdG9yLmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9kb20vbGliL0lzb2xhdGVNb2R1bGUuanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL2RvbS9saWIvTWFpbkRPTVNvdXJjZS5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvZG9tL2xpYi9TY29wZUNoZWNrZXIuanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL2RvbS9saWIvVk5vZGVXcmFwcGVyLmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9kb20vbGliL2Zyb21FdmVudC5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvZG9tL2xpYi9oeXBlcnNjcmlwdC1oZWxwZXJzLmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9kb20vbGliL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9kb20vbGliL2lzb2xhdGUuanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL2RvbS9saWIvbWFrZURPTURyaXZlci5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvZG9tL2xpYi9tYXRjaGVzU2VsZWN0b3IuanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL2RvbS9saWIvbW9ja0RPTVNvdXJjZS5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvZG9tL2xpYi9tb2R1bGVzLmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9kb20vbGliL3RodW5rLmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9kb20vbGliL3V0aWxzLmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9oaXN0b3J5L2xpYi9jYXB0dXJlQ2xpY2tzLmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9oaXN0b3J5L2xpYi9jcmVhdGVIaXN0b3J5JC5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvaGlzdG9yeS9saWIvZHJpdmVycy5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvaGlzdG9yeS9saWIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL2lzb2xhdGUvbGliL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9ydW4vbGliL2FkYXB0LmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9ydW4vbGliL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9zdG9yYWdlL2xpYi9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvc3RvcmFnZS9saWIvcmVzcG9uc2VDb2xsZWN0aW9uLmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9zdG9yYWdlL2xpYi91dGlsLmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9zdG9yYWdlL2xpYi93cml0ZVRvU3RvcmUuanMiLCJub2RlX21vZHVsZXMvY3ljbGUtb25pb25pZnkvbGliL0NvbGxlY3Rpb24uanMiLCJub2RlX21vZHVsZXMvY3ljbGUtb25pb25pZnkvbGliL1N0YXRlU291cmNlLmpzIiwibm9kZV9tb2R1bGVzL2N5Y2xlLW9uaW9uaWZ5L2xpYi9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9jeWNsZS1vbmlvbmlmeS9saWIvb25pb25pZnkuanMiLCJub2RlX21vZHVsZXMvY3ljbGUtb25pb25pZnkvbGliL3BpY2tDb21iaW5lLmpzIiwibm9kZV9tb2R1bGVzL2N5Y2xlLW9uaW9uaWZ5L2xpYi9waWNrTWVyZ2UuanMiLCJub2RlX21vZHVsZXMvY3ljbGUtc3RvcmFnZWlmeS9saWIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvZC9hdXRvLWJpbmQuanMiLCJub2RlX21vZHVsZXMvZC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9lczUtZXh0L2FycmF5LyMvY2xlYXIuanMiLCJub2RlX21vZHVsZXMvZXM1LWV4dC9hcnJheS8jL2UtaW5kZXgtb2YuanMiLCJub2RlX21vZHVsZXMvZXM1LWV4dC9hcnJheS9mcm9tL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2VzNS1leHQvYXJyYXkvZnJvbS9pcy1pbXBsZW1lbnRlZC5qcyIsIm5vZGVfbW9kdWxlcy9lczUtZXh0L2FycmF5L2Zyb20vc2hpbS5qcyIsIm5vZGVfbW9kdWxlcy9lczUtZXh0L2Z1bmN0aW9uL2lzLWFyZ3VtZW50cy5qcyIsIm5vZGVfbW9kdWxlcy9lczUtZXh0L2Z1bmN0aW9uL2lzLWZ1bmN0aW9uLmpzIiwibm9kZV9tb2R1bGVzL2VzNS1leHQvZnVuY3Rpb24vbm9vcC5qcyIsIm5vZGVfbW9kdWxlcy9lczUtZXh0L21hdGgvc2lnbi9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9lczUtZXh0L21hdGgvc2lnbi9pcy1pbXBsZW1lbnRlZC5qcyIsIm5vZGVfbW9kdWxlcy9lczUtZXh0L21hdGgvc2lnbi9zaGltLmpzIiwibm9kZV9tb2R1bGVzL2VzNS1leHQvbnVtYmVyL2lzLW5hbi9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9lczUtZXh0L251bWJlci9pcy1uYW4vaXMtaW1wbGVtZW50ZWQuanMiLCJub2RlX21vZHVsZXMvZXM1LWV4dC9udW1iZXIvaXMtbmFuL3NoaW0uanMiLCJub2RlX21vZHVsZXMvZXM1LWV4dC9udW1iZXIvdG8taW50ZWdlci5qcyIsIm5vZGVfbW9kdWxlcy9lczUtZXh0L251bWJlci90by1wb3MtaW50ZWdlci5qcyIsIm5vZGVfbW9kdWxlcy9lczUtZXh0L29iamVjdC9faXRlcmF0ZS5qcyIsIm5vZGVfbW9kdWxlcy9lczUtZXh0L29iamVjdC9hc3NpZ24vaW5kZXguanMiLCJub2RlX21vZHVsZXMvZXM1LWV4dC9vYmplY3QvYXNzaWduL2lzLWltcGxlbWVudGVkLmpzIiwibm9kZV9tb2R1bGVzL2VzNS1leHQvb2JqZWN0L2Fzc2lnbi9zaGltLmpzIiwibm9kZV9tb2R1bGVzL2VzNS1leHQvb2JqZWN0L2NvcHkuanMiLCJub2RlX21vZHVsZXMvZXM1LWV4dC9vYmplY3QvY3JlYXRlLmpzIiwibm9kZV9tb2R1bGVzL2VzNS1leHQvb2JqZWN0L2Zvci1lYWNoLmpzIiwibm9kZV9tb2R1bGVzL2VzNS1leHQvb2JqZWN0L2lzLWNhbGxhYmxlLmpzIiwibm9kZV9tb2R1bGVzL2VzNS1leHQvb2JqZWN0L2lzLW9iamVjdC5qcyIsIm5vZGVfbW9kdWxlcy9lczUtZXh0L29iamVjdC9pcy12YWx1ZS5qcyIsIm5vZGVfbW9kdWxlcy9lczUtZXh0L29iamVjdC9rZXlzL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2VzNS1leHQvb2JqZWN0L2tleXMvaXMtaW1wbGVtZW50ZWQuanMiLCJub2RlX21vZHVsZXMvZXM1LWV4dC9vYmplY3Qva2V5cy9zaGltLmpzIiwibm9kZV9tb2R1bGVzL2VzNS1leHQvb2JqZWN0L21hcC5qcyIsIm5vZGVfbW9kdWxlcy9lczUtZXh0L29iamVjdC9ub3JtYWxpemUtb3B0aW9ucy5qcyIsIm5vZGVfbW9kdWxlcy9lczUtZXh0L29iamVjdC9wcmltaXRpdmUtc2V0LmpzIiwibm9kZV9tb2R1bGVzL2VzNS1leHQvb2JqZWN0L3NldC1wcm90b3R5cGUtb2YvaW5kZXguanMiLCJub2RlX21vZHVsZXMvZXM1LWV4dC9vYmplY3Qvc2V0LXByb3RvdHlwZS1vZi9pcy1pbXBsZW1lbnRlZC5qcyIsIm5vZGVfbW9kdWxlcy9lczUtZXh0L29iamVjdC9zZXQtcHJvdG90eXBlLW9mL3NoaW0uanMiLCJub2RlX21vZHVsZXMvZXM1LWV4dC9vYmplY3QvdmFsaWQtY2FsbGFibGUuanMiLCJub2RlX21vZHVsZXMvZXM1LWV4dC9vYmplY3QvdmFsaWQtdmFsdWUuanMiLCJub2RlX21vZHVsZXMvZXM1LWV4dC9zdHJpbmcvIy9jb250YWlucy9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9lczUtZXh0L3N0cmluZy8jL2NvbnRhaW5zL2lzLWltcGxlbWVudGVkLmpzIiwibm9kZV9tb2R1bGVzL2VzNS1leHQvc3RyaW5nLyMvY29udGFpbnMvc2hpbS5qcyIsIm5vZGVfbW9kdWxlcy9lczUtZXh0L3N0cmluZy9pcy1zdHJpbmcuanMiLCJub2RlX21vZHVsZXMvZXM2LWl0ZXJhdG9yL2FycmF5LmpzIiwibm9kZV9tb2R1bGVzL2VzNi1pdGVyYXRvci9mb3Itb2YuanMiLCJub2RlX21vZHVsZXMvZXM2LWl0ZXJhdG9yL2dldC5qcyIsIm5vZGVfbW9kdWxlcy9lczYtaXRlcmF0b3IvaW5kZXguanMiLCJub2RlX21vZHVsZXMvZXM2LWl0ZXJhdG9yL2lzLWl0ZXJhYmxlLmpzIiwibm9kZV9tb2R1bGVzL2VzNi1pdGVyYXRvci9zdHJpbmcuanMiLCJub2RlX21vZHVsZXMvZXM2LWl0ZXJhdG9yL3ZhbGlkLWl0ZXJhYmxlLmpzIiwibm9kZV9tb2R1bGVzL2VzNi1tYXAvaW5kZXguanMiLCJub2RlX21vZHVsZXMvZXM2LW1hcC9pcy1pbXBsZW1lbnRlZC5qcyIsIm5vZGVfbW9kdWxlcy9lczYtbWFwL2lzLW5hdGl2ZS1pbXBsZW1lbnRlZC5qcyIsIm5vZGVfbW9kdWxlcy9lczYtbWFwL2xpYi9pdGVyYXRvci1raW5kcy5qcyIsIm5vZGVfbW9kdWxlcy9lczYtbWFwL2xpYi9pdGVyYXRvci5qcyIsIm5vZGVfbW9kdWxlcy9lczYtbWFwL3BvbHlmaWxsLmpzIiwibm9kZV9tb2R1bGVzL2VzNi1zeW1ib2wvaW5kZXguanMiLCJub2RlX21vZHVsZXMvZXM2LXN5bWJvbC9pcy1pbXBsZW1lbnRlZC5qcyIsIm5vZGVfbW9kdWxlcy9lczYtc3ltYm9sL2lzLXN5bWJvbC5qcyIsIm5vZGVfbW9kdWxlcy9lczYtc3ltYm9sL3BvbHlmaWxsLmpzIiwibm9kZV9tb2R1bGVzL2VzNi1zeW1ib2wvdmFsaWRhdGUtc3ltYm9sLmpzIiwibm9kZV9tb2R1bGVzL2V2ZW50LWVtaXR0ZXIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvZnJlZS1zdHlsZS9kaXN0L2ZyZWUtc3R5bGUuanMiLCJub2RlX21vZHVsZXMvaGlzdG9yeS9ET01VdGlscy5qcyIsIm5vZGVfbW9kdWxlcy9oaXN0b3J5L0xvY2F0aW9uVXRpbHMuanMiLCJub2RlX21vZHVsZXMvaGlzdG9yeS9QYXRoVXRpbHMuanMiLCJub2RlX21vZHVsZXMvaGlzdG9yeS9jcmVhdGVCcm93c2VySGlzdG9yeS5qcyIsIm5vZGVfbW9kdWxlcy9oaXN0b3J5L2NyZWF0ZUhhc2hIaXN0b3J5LmpzIiwibm9kZV9tb2R1bGVzL2hpc3RvcnkvY3JlYXRlTWVtb3J5SGlzdG9yeS5qcyIsIm5vZGVfbW9kdWxlcy9oaXN0b3J5L2NyZWF0ZVRyYW5zaXRpb25NYW5hZ2VyLmpzIiwibm9kZV9tb2R1bGVzL2hpc3RvcnkvaW5kZXguanMiLCJub2RlX21vZHVsZXMvaW52YXJpYW50L2Jyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL3Jlc29sdmUtcGF0aG5hbWUvY2pzL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3NuYWJiZG9tLXNlbGVjdG9yL2xpYi9jb21tb25qcy9jbGFzc05hbWVGcm9tVk5vZGUuanMiLCJub2RlX21vZHVsZXMvc25hYmJkb20tc2VsZWN0b3IvbGliL2NvbW1vbmpzL3NlbGVjdG9yUGFyc2VyLmpzIiwibm9kZV9tb2R1bGVzL3NuYWJiZG9tLXR5cGVzdHlsZS9kaXN0L2NsaWVudC5qcyIsIm5vZGVfbW9kdWxlcy9zbmFiYmRvbS10eXBlc3R5bGUvZGlzdC9zZXJ2ZXIuanMiLCJub2RlX21vZHVsZXMvc25hYmJkb20tdHlwZXN0eWxlL2Rpc3Qvc25hYmJkb20tdHlwZXN0eWxlLmpzIiwibm9kZV9tb2R1bGVzL3NuYWJiZG9tLXR5cGVzdHlsZS9kaXN0L3V0aWxzLmpzIiwibm9kZV9tb2R1bGVzL3NuYWJiZG9tL2guanMiLCJub2RlX21vZHVsZXMvc25hYmJkb20vaHRtbGRvbWFwaS5qcyIsIm5vZGVfbW9kdWxlcy9zbmFiYmRvbS9pcy5qcyIsIm5vZGVfbW9kdWxlcy9zbmFiYmRvbS9tb2R1bGVzL2F0dHJpYnV0ZXMuanMiLCJub2RlX21vZHVsZXMvc25hYmJkb20vbW9kdWxlcy9jbGFzcy5qcyIsIm5vZGVfbW9kdWxlcy9zbmFiYmRvbS9tb2R1bGVzL2RhdGFzZXQuanMiLCJub2RlX21vZHVsZXMvc25hYmJkb20vbW9kdWxlcy9wcm9wcy5qcyIsIm5vZGVfbW9kdWxlcy9zbmFiYmRvbS9tb2R1bGVzL3N0eWxlLmpzIiwibm9kZV9tb2R1bGVzL3NuYWJiZG9tL3NuYWJiZG9tLmpzIiwibm9kZV9tb2R1bGVzL3NuYWJiZG9tL3RodW5rLmpzIiwibm9kZV9tb2R1bGVzL3NuYWJiZG9tL3Rvdm5vZGUuanMiLCJub2RlX21vZHVsZXMvc25hYmJkb20vdm5vZGUuanMiLCJub2RlX21vZHVsZXMvc3ltYm9sLW9ic2VydmFibGUvbGliL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3N5bWJvbC1vYnNlcnZhYmxlL2xpYi9wb255ZmlsbC5qcyIsIm5vZGVfbW9kdWxlcy90eXBlc3R5bGUvbGliL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3R5cGVzdHlsZS9saWIvaW50ZXJuYWwvZm9ybWF0dGluZy5qcyIsIm5vZGVfbW9kdWxlcy90eXBlc3R5bGUvbGliL2ludGVybmFsL3R5cGVzdHlsZS5qcyIsIm5vZGVfbW9kdWxlcy90eXBlc3R5bGUvbGliL2ludGVybmFsL3V0aWxpdGllcy5qcyIsIm5vZGVfbW9kdWxlcy90eXBlc3R5bGUvbGliL3R5cGVzLmpzIiwibm9kZV9tb2R1bGVzL3ZhbHVlLWVxdWFsL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3dhcm5pbmcvYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy94c3RyZWFtL2V4dHJhL2RlYm91bmNlLmpzIiwibm9kZV9tb2R1bGVzL3hzdHJlYW0vZXh0cmEvZHJvcFJlcGVhdHMuanMiLCJub2RlX21vZHVsZXMveHN0cmVhbS9pbmRleC5qcyIsInNyYy9hcHAuanMiLCJzcmMvY29tcG9uZW50cy9UYXNrL2luZGV4LmpzIiwic3JjL2NvbXBvbmVudHMvVGFzay9pbnRlbnQuanMiLCJzcmMvY29tcG9uZW50cy9UYXNrL21vZGVsLmpzIiwic3JjL2NvbXBvbmVudHMvVGFzay9zdHlsZXMuanMiLCJzcmMvY29tcG9uZW50cy9UYXNrL3ZpZXcuanMiLCJzcmMvY29tcG9uZW50cy9UYXNrTGlzdC9MaXN0LmpzIiwic3JjL2NvbXBvbmVudHMvVGFza0xpc3QvaW5kZXguanMiLCJzcmMvY29tcG9uZW50cy9UYXNrTGlzdC9pbnRlbnQuanMiLCJzcmMvY29tcG9uZW50cy9UYXNrTGlzdC9tb2RlbC5qcyIsInNyYy9jb21wb25lbnRzL1Rhc2tMaXN0L3N0eWxlcy5qcyIsInNyYy9jb21wb25lbnRzL1Rhc2tMaXN0L3ZpZXcuanMiLCJzcmMvc3R5bGVzLmpzIiwic3JjL3V0aWxzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL09BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDalBBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25HQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9MQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaERBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1JBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4R0E7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3BJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUMxY0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDblVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDektBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDbkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNqREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4TEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2TUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEdBO0FBQ0E7QUFDQTs7QUNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDdkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDNURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUN6dERBOztBQUNBOztBQUNBOzs7O0FBQ0E7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBRUE7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7Ozs7O0FBRUEsSUFBTSxVQUFVLENBQ2QsZUFEYyxFQUVkLG9CQUZjLEVBR2QsZUFIYyxFQUlkLDJCQUpjLEVBS2QsZUFMYyxDQUFoQjs7QUFRQSxJQUFNLE9BQU8sNkJBQVMsK0JBQVcsa0JBQVgsRUFBcUIsRUFBQyxLQUFLLGFBQU4sRUFBckIsQ0FBVCxDQUFiOztBQUVBLGNBQUksSUFBSixFQUFVO0FBQ1IsT0FBSyx3QkFBYyxVQUFkLEVBQTBCLEVBQUMsZ0JBQUQsRUFBVSxlQUFlLElBQXpCLEVBQTFCLENBREc7QUFFUixXQUFTLDRCQUFjLGlDQUFkLENBRkQ7QUFHUixXQUFTO0FBSEQsQ0FBVjs7Ozs7Ozs7a0JDcEJ3QixJOztBQUp4Qjs7OztBQUNBOzs7O0FBQ0E7Ozs7OztBQUVlLFNBQVMsSUFBVCxDQUFjLE9BQWQsRUFBdUI7QUFDcEMsTUFBTSxVQUFVLHNCQUFPLFFBQVEsR0FBZixDQUFoQjtBQUNBLE1BQU0sV0FBVyxxQkFBTSxPQUFOLENBQWpCO0FBQ0EsTUFBTSxRQUFRLG9CQUFLLFFBQVEsS0FBUixDQUFjLE1BQW5CLENBQWQ7O0FBRUEsU0FBTztBQUNMLFNBQUssS0FEQTtBQUVMLFdBQU87QUFGRixHQUFQO0FBSUQ7Ozs7Ozs7O2tCQ1Z1QixNOztBQUh4Qjs7OztBQUNBOzs7O0FBRWUsU0FBUyxNQUFULENBQWdCLFNBQWhCLEVBQTJCO0FBQ3hDLE1BQU0sa0JBQWtCLFVBQ3JCLE1BRHFCLENBQ2QsT0FEYyxFQUNMLE1BREssQ0FDRSxPQURGLEVBRXJCLE1BRnFCLENBRWQ7QUFBQSxXQUFNLEdBQUcsT0FBSCxLQUFlLGdCQUFyQjtBQUFBLEdBRmMsQ0FBeEI7O0FBSUEsTUFBTSxpQkFBaUIsVUFBVSxNQUFWLENBQWlCLE9BQWpCLEVBQTBCLE1BQTFCLENBQWlDLE1BQWpDLEVBQXlDLElBQXpDLENBQXZCOztBQUVBLFNBQU87QUFDTCxnQkFBWSxVQUNULE1BRFMsQ0FDRixPQURFLEVBQ08sTUFEUCxDQUNjLFVBRGQsRUFFVCxLQUZTLENBRUgsSUFGRyxDQURQOztBQUtMLGVBQVcsa0JBQUcsS0FBSCxDQUFTLGVBQVQsRUFBMEIsY0FBMUIsRUFDUixHQURRLENBQ0o7QUFBQSxhQUFNLEdBQUcsTUFBSCxDQUFVLEtBQWhCO0FBQUEsS0FESSxDQUxOOztBQVFMLGlCQUFhLFVBQ1YsTUFEVSxDQUNILE9BREcsRUFDTSxNQUROLENBQ2EsT0FEYixFQUVWLE1BRlUsQ0FFSDtBQUFBLGFBQU0sR0FBRyxPQUFILEtBQWUsY0FBckI7QUFBQSxLQUZHLEVBR1YsS0FIVSxDQUdKLElBSEksQ0FSUjs7QUFhTCxhQUFTLFVBQ04sTUFETSxDQUNDLFNBREQsRUFDWSxNQURaLENBQ21CLFFBRG5CLEVBRU4sR0FGTSxDQUVGO0FBQUEsYUFBTSxHQUFHLE1BQUgsQ0FBVSxPQUFoQjtBQUFBLEtBRkUsQ0FiSjs7QUFpQkwsY0FBVSxVQUNQLE1BRE8sQ0FDQSxVQURBLEVBQ1ksTUFEWixDQUNtQixPQURuQixFQUVQLEtBRk8sQ0FFRCxJQUZDLENBakJMOztBQXFCTCxZQUFRLFVBQ0wsTUFESyxDQUNFLFlBREYsRUFDZ0IsTUFEaEIsQ0FDdUIsV0FEdkIsRUFFTCxLQUZLLENBRUMsSUFGRCxDQXJCSDs7QUF5QkwsY0FBVSxVQUNQLE1BRE8sQ0FDQSxZQURBLEVBQ2MsTUFEZCxDQUNxQixZQURyQixFQUVQLEtBRk8sQ0FFRCxJQUZDOztBQXpCTCxHQUFQO0FBOEJEOzs7Ozs7Ozs7OztrQkN0Q3VCLEs7O0FBRnhCOzs7Ozs7QUFFZSxTQUFTLEtBQVQsQ0FBZSxPQUFmLEVBQXdCO0FBQ3JDLE1BQU0sb0JBQW9CLFFBQVEsVUFBUixDQUN2QixLQUR1QixDQUNqQixTQUFTLGdCQUFULENBQTBCLElBQTFCLEVBQWdDO0FBQ3JDLHdCQUFXLElBQVgsSUFBaUIsU0FBUyxJQUExQjtBQUNELEdBSHVCLENBQTFCOztBQUtBLE1BQU0sbUJBQW1CLFFBQVEsU0FBUixDQUN0QixHQURzQixDQUNsQjtBQUFBLFdBQVcsU0FBUyxlQUFULENBQXlCLElBQXpCLEVBQStCO0FBQzdDLDBCQUFXLElBQVgsSUFBaUIsT0FBTyxPQUF4QixFQUFpQyxTQUFTLEtBQTFDO0FBQ0QsS0FGSTtBQUFBLEdBRGtCLENBQXpCOztBQUtBLE1BQU0scUJBQXFCLFFBQVEsV0FBUixDQUN4QixLQUR3QixDQUNsQixTQUFTLGlCQUFULENBQTJCLElBQTNCLEVBQWlDO0FBQ3RDLHdCQUFXLElBQVgsSUFBaUIsU0FBUyxLQUExQjtBQUNELEdBSHdCLENBQTNCOztBQUtBLE1BQU0saUJBQWlCLFFBQVEsT0FBUixDQUNwQixHQURvQixDQUNoQjtBQUFBLFdBQWEsU0FBUyxhQUFULENBQXVCLElBQXZCLEVBQTZCO0FBQzdDLDBCQUFXLElBQVgsSUFBaUIsV0FBVyxTQUE1QjtBQUNELEtBRkk7QUFBQSxHQURnQixDQUF2Qjs7QUFLQSxNQUFNLGtCQUFrQixRQUFRLFFBQVIsQ0FDckIsS0FEcUIsQ0FDZixTQUFTLGNBQVQsQ0FBd0IsSUFBeEIsRUFBOEI7QUFDbkMsV0FBTyxLQUFLLENBQVo7QUFDRCxHQUhxQixDQUF4Qjs7QUFLQSxNQUFNLGdCQUFnQixRQUFRLE1BQVIsQ0FDbkIsS0FEbUIsQ0FDYixTQUFTLFlBQVQsQ0FBc0IsSUFBdEIsRUFBNEI7QUFDakMsd0JBQVcsSUFBWCxJQUFpQixPQUFPLElBQXhCO0FBQ0QsR0FIbUIsQ0FBdEI7O0FBS0EsTUFBTSxrQkFBa0IsUUFBUSxRQUFSLENBQ3JCLEtBRHFCLENBQ2YsU0FBUyxjQUFULENBQXdCLElBQXhCLEVBQThCO0FBQ25DLHdCQUFXLElBQVgsSUFBaUIsT0FBTyxLQUF4QjtBQUNELEdBSHFCLENBQXhCOztBQUtBLFNBQU8sa0JBQUcsS0FBSCxDQUNMLGlCQURLLEVBRUwsZ0JBRkssRUFHTCxrQkFISyxFQUlMLGNBSkssRUFLTCxlQUxLLEVBTUwsYUFOSyxFQU9MLGVBUEssQ0FBUDtBQVNEOzs7Ozs7Ozs7Ozs7QUMvQ0Q7O0lBQVksTTs7OztBQUVMLElBQU0sc0JBQU8sU0FBUCxJQUFPLENBQUMsT0FBRDtBQUFBLFNBQWM7QUFDaEMsZUFBVyxVQUFVLE1BQVYsR0FBbUI7QUFERSxHQUFkO0FBQUEsQ0FBYjs7QUFJQSxJQUFNLDBCQUFTLFNBQVQsTUFBUyxDQUFDLE9BQUQsRUFBVSxJQUFWO0FBQUE7QUFDcEIsZ0JBQWMsVUFETTtBQUVwQixpQkFBYztBQUZNLEtBR2hCLFVBQVU7QUFDWixxQkFBaUIsTUFETDtBQUVaLGVBQWlCO0FBRkwsR0FBVixHQUdBO0FBQ0YscUJBQWlCO0FBRGYsR0FOZ0IsRUFTaEIsT0FBTyxFQUE2QjtBQUN0QyxxQkFBaUIsTUFEUixDQUM2QjtBQUQ3QixHQUFQLEdBRUEsRUFYZ0I7QUFBQSxDQUFmOztBQWNBLElBQU0sMEJBQVMsU0FBVCxNQUFTO0FBQUEsU0FBTztBQUMzQixrQkFBYyxRQURhO0FBRTNCLGFBQWMsTUFGYTtBQUczQixjQUFjLE1BSGE7QUFJM0IsZ0JBQWMsVUFKYTtBQUszQixXQUFjLEdBTGE7QUFNM0IsY0FBYyxHQU5hO0FBTzNCLGNBQWMsUUFQYTtBQVEzQixjQUFjLE1BUmE7QUFTM0Isa0JBQWMsTUFUYTtBQVUzQiwwQkFBc0I7QUFWSyxHQUFQO0FBQUEsQ0FBZjs7QUFhQSxJQUFNLGdDQUFZLFNBQVosU0FBWSxDQUFDLE9BQUQ7QUFBQSxzQkFDcEIsT0FBTyxLQUFQLEVBRG9CLEVBRW5CLFVBQVU7QUFDWixlQUFXLE9BREM7QUFFWixhQUFXLE9BRkM7QUFHWixlQUFXLHFCQUhDO0FBSVosY0FBVztBQUpDLEdBQVYsR0FLQTtBQUNGLGVBQVc7QUFEVCxHQVBtQjtBQUFBLENBQWxCOztBQVlBLElBQU0sd0JBQVEsU0FBUixLQUFRLENBQUMsU0FBRDtBQUFBO0FBQ25CLGtCQUFnQixXQURHO0FBRW5CLGVBQWdCLHFCQUZHO0FBR25CLGVBQWdCLE9BSEc7QUFJbkIsbUJBQWdCLEtBSkc7QUFLbkIsa0JBQWdCLFlBTEc7QUFNbkIseUJBQXVCLFdBTko7QUFPbkIsMkJBQXVCO0FBUEosS0FRZixZQUFZO0FBQ2QsYUFBb0IsU0FETjtBQUVkLHVCQUFvQixjQUZOO0FBR2Q7QUFIYyxHQUFaLEdBSUE7QUFDRjtBQURFLEdBWmU7QUFBQSxDQUFkOztBQWlCQSxJQUFNLDRCQUFVLFNBQVYsT0FBVSxDQUFDLFNBQUQ7QUFBQSxzQkFDbEIsT0FBTyxNQUFQLEVBRGtCO0FBRXJCLGVBQVksWUFBWSxPQUFaLEdBQXNCLE1BRmIsRUFFdUI7QUFDNUMsZ0JBQVksVUFIUztBQUlyQixXQUFZLEdBSlM7QUFLckIsYUFBWSxNQUxTO0FBTXJCLGNBQVksR0FOUztBQU9yQixhQUFZLE1BUFM7QUFRckIsY0FBWSxNQVJTO0FBU3JCLGNBQVksUUFUUztBQVVyQixhQUFZLFNBVlM7QUFXckIsaUJBQWMsTUFYTztBQVlyQixrQkFBYyxxQkFaTztBQWFyQixxQkFBaUIsTUFiSTtBQWNyQixhQUFTO0FBQ1AsaUJBQVcsRUFBK0I7QUFDeEMsaUJBQVc7QUFERixPQURKO0FBSVAsaUJBQVc7QUFDVDtBQURTO0FBSko7QUFkWTtBQUFBLENBQWhCOzs7Ozs7OztrQkMzRGlCLEk7O0FBSHhCOztBQUNBOztJQUFZLE07Ozs7QUFFRyxTQUFTLElBQVQsQ0FBYyxNQUFkLEVBQXNCO0FBQ25DLFNBQU8sT0FBTyxHQUFQLENBQVc7QUFBQSxRQUFHLEtBQUgsUUFBRyxLQUFIO0FBQUEsUUFBVSxTQUFWLFFBQVUsU0FBVjtBQUFBLFFBQXFCLE9BQXJCLFFBQXFCLE9BQXJCO0FBQUEsUUFBOEIsS0FBOUIsUUFBOEIsS0FBOUI7QUFBQSxRQUFxQyxJQUFyQyxRQUFxQyxJQUFyQztBQUFBLFdBQ2hCLGFBQUcsWUFBSCxFQUFpQixFQUFFLEtBQUssT0FBTyxNQUFQLENBQWMsT0FBZCxFQUF1QixJQUF2QixDQUFQLEVBQXFDLE9BQU8sRUFBQyxvQkFBRCxFQUFZLGdCQUFaLEVBQTVDLEVBQWpCLEVBQXFGLENBQ25GLGNBQUksT0FBSixFQUFhLEVBQUUsS0FBSyxPQUFPLElBQVAsQ0FBWSxPQUFaLENBQVAsRUFBYixFQUE0QyxDQUMxQyxnQkFBTSxTQUFOLEVBQWlCO0FBQ2YsYUFBTyxFQUFFLE1BQU0sVUFBUixFQUFvQixTQUFTLFNBQTdCLEVBRFE7QUFFZixXQUFLLE9BQU8sTUFBUDtBQUZVLEtBQWpCLENBRDBDLEVBSzFDLGdCQUFNLEVBQUUsS0FBSyxPQUFPLEtBQVAsQ0FBYSxTQUFiLENBQVAsRUFBTixFQUF3QyxLQUF4QyxDQUwwQyxFQU0xQyxpQkFBTyxVQUFQLEVBQW1CLEVBQUUsS0FBSyxPQUFPLE9BQVAsQ0FBZSxLQUFmLENBQVAsRUFBbkIsQ0FOMEMsQ0FBNUMsQ0FEbUYsRUFTbkYsZ0JBQU0sT0FBTixFQUFlO0FBQ2IsV0FBSyxPQUFPLFNBQVAsQ0FBaUIsT0FBakIsQ0FEUTtBQUViLGFBQU8sRUFBRSxNQUFNLE1BQVIsRUFGTTtBQUdiLFlBQU07QUFDSixnQkFBUSxnQkFBQyxRQUFELFNBQXFCO0FBQUEsY0FBVCxHQUFTLFNBQVQsR0FBUzs7QUFDM0IsY0FBSSxLQUFKLEdBQVksS0FBWjtBQUNBLGNBQUksT0FBSixFQUFhO0FBQ1gsZ0JBQUksS0FBSjtBQUNBLGdCQUFJLGNBQUosR0FBcUIsSUFBSSxLQUFKLENBQVUsTUFBL0I7QUFDRDtBQUNGO0FBUEc7QUFITyxLQUFmLENBVG1GLENBQXJGLENBRGdCO0FBQUEsR0FBWCxDQUFQO0FBeUJEOzs7Ozs7Ozs7O0FDN0JEOztBQUNBOztBQUNBOzs7O0FBQ0E7O0lBQVksTTs7Ozs7O0FBRUwsSUFBTSxzQkFBTyxtQ0FBZTtBQUNqQyxRQUFNLGVBRDJCO0FBRWpDLFdBQVM7QUFBQSxXQUFTLE1BQU0sR0FBZjtBQUFBLEdBRndCO0FBR2pDLGFBQVc7QUFBQSxXQUFPLEdBQVA7QUFBQSxHQUhzQjtBQUlqQyxnQkFBYztBQUFBLFdBQWM7QUFDMUIsV0FBSyxVQUFVLFdBQVYsQ0FBc0IsS0FBdEIsRUFDRixHQURFLENBQ0U7QUFBQSxlQUFVLGFBQUcsWUFBSCxFQUFpQixFQUFFLEtBQUssT0FBTyxRQUFQLEVBQVAsRUFBakIsRUFBNkMsTUFBN0MsQ0FBVjtBQUFBLE9BREYsQ0FEcUI7QUFHMUIsYUFBTyxVQUFVLFNBQVYsQ0FBb0IsT0FBcEI7QUFIbUIsS0FBZDtBQUFBO0FBSm1CLENBQWYsQ0FBYjs7Ozs7Ozs7Ozs7O2tCQ2tDaUIsUTs7QUF2Q3hCOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUVBLFNBQVMsSUFBVCxDQUFjLEdBQWQsRUFBbUIsR0FBbkIsRUFBd0I7QUFDdEIsTUFBSSxtQkFBVyxHQUFYLENBQUo7QUFDQSxTQUFPLElBQUksR0FBSixDQUFQO0FBQ0EsU0FBTyxHQUFQO0FBQ0Q7O0FBRU0sSUFBTSw4QkFBVztBQUN0QixPQUFLLGFBQUMsS0FBRDtBQUFBLFdBQVcsTUFBTSxJQUFOLENBQ1gsTUFEVyxDQUNKLE1BQU0sUUFERixFQUVYLEtBRlcsQ0FFTCxDQUZLLEVBRUYsQ0FBQyxDQUZDLEVBR1gsTUFIVyxjQUlMLE1BQU0sSUFBTixDQUFXLE1BQU0sSUFBTixDQUFXLE1BQVgsR0FBb0IsQ0FBL0IsQ0FKSztBQUtSLFlBQU07QUFMRSxPQUFYO0FBQUEsR0FEaUI7QUFRdEIsT0FBSyxhQUFDLEtBQUQsRUFBUSxnQkFBUixFQUE2QjtBQUNoQyxRQUFNLG1CQUFtQixNQUFNLElBQU4sQ0FBVyxNQUFYLENBQWtCLE1BQU0sUUFBeEIsQ0FBekI7QUFDQSxRQUFNLFVBQVUsTUFBTSxJQUFOLENBQ2IsR0FEYSxDQUNUO0FBQUEsYUFBUSxpQkFBaUIsSUFBakIsQ0FBc0I7QUFBQSxlQUFLLEVBQUUsR0FBRixLQUFVLEtBQUssR0FBcEI7QUFBQSxPQUF0QixLQUFrRCxJQUExRDtBQUFBLEtBRFMsRUFFYixNQUZhLENBRU47QUFBQSxhQUNOLGlCQUFpQixJQUFqQixDQUFzQjtBQUFBLGVBQUssRUFBRSxHQUFGLEtBQVUsS0FBSyxHQUFwQjtBQUFBLE9BQXRCLEtBQ0EsaUJBQWlCLElBQWpCLENBQXNCO0FBQUEsZUFBSyxFQUFFLEdBQUYsS0FBVSxLQUFLLEdBQXBCO0FBQUEsT0FBdEIsQ0FGTTtBQUFBLEtBRk0sQ0FBaEI7O0FBT0Esd0JBQ0ssS0FETDtBQUVFLFlBQU0sUUFDSCxLQURHLENBQ0csQ0FESCxFQUNNLENBQUMsQ0FEUCxFQUVILE1BRkcsQ0FFSSxLQUFLLFFBQVEsUUFBUSxNQUFSLEdBQWlCLENBQXpCLENBQUwsRUFBa0MsTUFBbEMsQ0FGSjtBQUZSO0FBTUQ7QUF2QnFCLENBQWpCOztBQTBCUSxTQUFTLFFBQVQsQ0FBa0IsT0FBbEIsRUFBMkI7QUFDeEMsTUFBTSxTQUFTLFFBQVEsS0FBUixDQUFjLE1BQTdCO0FBQ0EsTUFBTSxVQUFVLHNCQUFPLFFBQVEsR0FBZixFQUFvQixRQUFRLE9BQTVCLENBQWhCO0FBQ0EsTUFBTSxpQkFBaUIscUJBQU0sT0FBTixDQUF2Qjs7QUFFQSxNQUFNLFlBQVksdUJBQVEsVUFBUixFQUFjLEVBQUMsT0FBTyxRQUFSLEVBQWQsRUFBaUMsT0FBakMsQ0FBbEI7QUFDQSxNQUFNLFlBQVksVUFBVSxHQUE1QjtBQUNBLE1BQU0sZUFBZSxVQUFVLEtBQS9COztBQUVBLE1BQU0sUUFBUSxvQkFBSyxNQUFMLEVBQWEsU0FBYixDQUFkO0FBQ0EsTUFBTSxXQUFXLGtCQUFHLEtBQUgsQ0FBUyxjQUFULEVBQXlCLFlBQXpCLENBQWpCOztBQUVBLFNBQU87QUFDTCxTQUFLLEtBREE7QUFFTCxXQUFPO0FBRkYsR0FBUDtBQUlEOzs7Ozs7OztrQkNuRHVCLE07O0FBSnhCOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUVlLFNBQVMsTUFBVCxDQUFnQixTQUFoQixFQUEyQixhQUEzQixFQUEwQztBQUN2RCxTQUFPO0FBQ0wsa0JBQWMsY0FDWCxHQURXLENBQ1A7QUFBQSxhQUFZLFNBQVMsUUFBckI7QUFBQSxLQURPLEVBRVgsT0FGVyxDQUVILDRCQUZHLENBRFQ7O0FBS0wsdUJBQW1CLFVBQ2hCLE1BRGdCLENBQ1QsV0FEUyxFQUNJLE1BREosQ0FDVyxPQURYLEVBRWhCLEdBRmdCLENBRVo7QUFBQSxhQUFNLEdBQUcsTUFBSCxDQUFVLEtBQWhCO0FBQUEsS0FGWSxDQUxkOztBQVNMLGtCQUFjLFVBQ1gsTUFEVyxDQUNKLFdBREksRUFDUyxNQURULENBQ2dCLFNBRGhCLEVBRVgsTUFGVyxDQUVKO0FBQUEsYUFBTSxHQUFHLE9BQUgsS0FBZSxjQUFyQjtBQUFBLEtBRkksQ0FUVDs7QUFhTCxpQkFBYSxVQUNWLE1BRFUsQ0FDSCxXQURHLEVBQ1UsTUFEVixDQUNpQixTQURqQixFQUVWLE1BRlUsQ0FFSCxjQUFNO0FBQ1osVUFBTSxhQUFhLE9BQU8sR0FBRyxNQUFILENBQVUsS0FBakIsRUFBd0IsSUFBeEIsRUFBbkI7QUFDQSxhQUFPLEdBQUcsT0FBSCxLQUFlLGdCQUFmLElBQTRCLFVBQW5DO0FBQ0QsS0FMVSxFQU1WLEdBTlUsQ0FNTjtBQUFBLGFBQU0sT0FBTyxHQUFHLE1BQUgsQ0FBVSxLQUFqQixFQUF3QixJQUF4QixFQUFOO0FBQUEsS0FOTSxDQWJSOztBQXFCTCxnQkFBWSxVQUNULE1BRFMsQ0FDRixhQURFLEVBQ2EsTUFEYixDQUNvQixPQURwQixFQUVULEdBRlMsQ0FFTDtBQUFBLGFBQU0sR0FBRyxNQUFILENBQVUsT0FBaEI7QUFBQSxLQUZLLENBckJQOztBQXlCTCxzQkFBa0IsVUFDZixNQURlLENBQ1Isa0JBRFEsRUFDWSxNQURaLENBQ21CLE9BRG5CLEVBRWYsS0FGZSxDQUVULElBRlM7QUF6QmIsR0FBUDtBQTZCRDs7Ozs7Ozs7Ozs7a0JDdEJ1QixLOztBQVp4Qjs7Ozs7O0FBRUEsU0FBUyxXQUFULENBQXFCLEtBQXJCLEVBQTRCO0FBQzFCLFVBQVEsS0FBUjtBQUNFLFNBQUssU0FBTDtBQUFnQixhQUFRO0FBQUEsZUFBUSxLQUFLLFNBQUwsS0FBbUIsS0FBM0I7QUFBQSxPQUFSO0FBQ2hCLFNBQUssWUFBTDtBQUFtQixhQUFRO0FBQUEsZUFBUSxLQUFLLFNBQUwsS0FBbUIsSUFBM0I7QUFBQSxPQUFSO0FBQ25CO0FBQVMsYUFBTztBQUFBLGVBQU0sSUFBTjtBQUFBLE9BQVAsQ0FIWCxDQUc4QjtBQUg5QjtBQUtEOztBQUVELElBQUksT0FBTyxLQUFLLEdBQUwsRUFBWDs7QUFFZSxTQUFTLEtBQVQsQ0FBZSxPQUFmLEVBQXdCO0FBQ3JDLE1BQU0sa0JBQWtCLGtCQUFHLEVBQUgsQ0FBTSxTQUFTLGNBQVQsQ0FBd0IsU0FBeEIsRUFBbUM7QUFDL0QsUUFBSSxTQUFKLEVBQWU7QUFDYixhQUFPLFNBQVA7QUFDRCxLQUZELE1BRU87QUFDTCxhQUFPO0FBQ0wsb0JBQVksRUFEUDtBQUVMLGNBQU0sRUFGRDtBQUdMLGdCQUFRLEVBSEg7QUFJTCxrQkFBVTtBQUFBLGlCQUFNLElBQU47QUFBQSxTQUpMLENBSWlCO0FBSmpCLE9BQVA7QUFNRDtBQUNGLEdBWHVCLENBQXhCOztBQWFBLE1BQU0sc0JBQXNCLFFBQVEsWUFBUixDQUN6QixTQUR5QixDQUNmLEdBRGUsRUFFekIsR0FGeUIsQ0FFckIsZ0JBQVE7QUFDWCxRQUFNLFdBQVcsWUFBWSxJQUFaLENBQWpCO0FBQ0EsV0FBTyxTQUFTLGtCQUFULENBQTRCLFNBQTVCLEVBQXVDO0FBQzVDLDBCQUNLLFNBREw7QUFFRSxnQkFBUSxLQUFLLE9BQUwsQ0FBYSxHQUFiLEVBQWtCLEVBQWxCLEVBQXNCLElBQXRCLEVBRlY7QUFHRSxrQkFBVTtBQUhaO0FBS0QsS0FORDtBQU9ELEdBWHlCLENBQTVCOztBQWFBLE1BQU0sMkJBQTJCLFFBQVEsaUJBQVIsQ0FDOUIsR0FEOEIsQ0FDMUI7QUFBQSxXQUFjLFNBQVMsZ0JBQVQsQ0FBMEIsU0FBMUIsRUFBcUM7QUFDdEQsMEJBQVcsU0FBWCxJQUFzQixZQUFZLFVBQWxDO0FBQ0QsS0FGSTtBQUFBLEdBRDBCLENBQWpDOztBQUtBLE1BQU0scUJBQXFCLGtCQUFHLEtBQUgsQ0FBUyxRQUFRLFlBQWpCLEVBQStCLFFBQVEsV0FBdkMsRUFDeEIsS0FEd0IsQ0FDbEIsU0FBUyxpQkFBVCxDQUEyQixTQUEzQixFQUFzQztBQUMzQyx3QkFBVyxTQUFYLElBQXNCLFlBQVksRUFBbEM7QUFDRCxHQUh3QixDQUEzQjs7QUFLQSxNQUFNLHFCQUFxQixRQUFRLFdBQVIsQ0FDeEIsR0FEd0IsQ0FDcEI7QUFBQSxXQUFXLFNBQVMsaUJBQVQsQ0FBMkIsU0FBM0IsRUFBc0M7QUFDcEQsVUFBTSxVQUFVO0FBQ2QsYUFBSyxNQURTO0FBRWQsZUFBTyxPQUZPO0FBR2QsbUJBQVcsS0FIRztBQUlkLGlCQUFTLEtBSks7QUFLZCxlQUFPLEtBTE87QUFNZCxjQUFNO0FBTlEsT0FBaEI7QUFRQSwwQkFDSyxTQURMO0FBRUUsY0FBTSxVQUFVLElBQVYsQ0FBZSxNQUFmLENBQXNCLE9BQXRCO0FBRlI7QUFJRCxLQWJJO0FBQUEsR0FEb0IsQ0FBM0I7O0FBZ0JBLE1BQU0sb0JBQW9CLFFBQVEsVUFBUixDQUN2QixHQUR1QixDQUNuQjtBQUFBLFdBQWEsU0FBUyxnQkFBVCxDQUEwQixTQUExQixFQUFxQztBQUNyRCwwQkFDSyxTQURMO0FBRUUsY0FBTSxVQUFVLElBQVYsQ0FBZSxHQUFmLENBQW1CO0FBQUEsOEJBQ2xCLElBRGtCLElBQ1osV0FBVyxTQURDO0FBQUEsU0FBbkI7QUFGUjtBQU1ELEtBUEk7QUFBQSxHQURtQixDQUExQjs7QUFVQSxNQUFNLDBCQUEwQixRQUFRLGdCQUFSLENBQzdCLEtBRDZCLENBQ3ZCLFNBQVMsdUJBQVQsQ0FBaUMsU0FBakMsRUFBNEM7QUFDakQsd0JBQ0ssU0FETDtBQUVFLFlBQU0sVUFBVSxJQUFWLENBQWUsTUFBZixDQUFzQjtBQUFBLGVBQVEsS0FBSyxTQUFMLEtBQW1CLEtBQTNCO0FBQUEsT0FBdEI7QUFGUjtBQUlELEdBTjZCLENBQWhDOztBQVFBLFNBQU8sa0JBQUcsS0FBSCxDQUNMLGVBREssRUFFTCx3QkFGSyxFQUdMLG1CQUhLLEVBSUwsa0JBSkssRUFLTCxrQkFMSyxFQU1MLGlCQU5LLEVBT0wsdUJBUEssQ0FBUDtBQVNEOzs7Ozs7Ozs7Ozs7QUM1RkQ7O0lBQVksTTs7OztBQUVMLElBQU0sc0JBQU8sU0FBUCxJQUFPLENBQUMsVUFBRDtBQUFBLFNBQWlCO0FBQ25DLGVBQWMsYUFBYSxPQUFiLEdBQXVCLE1BREY7QUFFbkMsZ0JBQWMsVUFGcUI7QUFHbkMsZUFBYyxHQUhxQjtBQUluQyxrQkFBYztBQUpxQixHQUFqQjtBQUFBLENBQWI7O0FBT0EsSUFBTSx3QkFBUSxTQUFSLEtBQVE7QUFBQSxzQkFDaEIsT0FBTyxLQUFQLEVBRGdCO0FBRW5CLGVBQWMscUJBRks7QUFHbkIsY0FBYyxNQUhLO0FBSW5CLGtCQUFjLHNCQUpLO0FBS25CLGtCQUFjO0FBTEs7QUFBQSxDQUFkOztBQVFBLElBQU0sd0JBQVEsU0FBUixLQUFRO0FBQUE7QUFDbkIsZ0JBQWUsVUFESTtBQUVuQixXQUFlLFFBRkk7QUFHbkIsYUFBZSxNQUhJO0FBSW5CLGlCQUFlLE9BSkk7QUFLbkIsbUJBQWUsS0FMSTtBQU1uQixrQkFBZSxRQU5JO0FBT25CLGFBQWU7QUFQSSxLQVFoQixPQUFPLGFBQVAsRUFSZ0I7QUFBQSxDQUFkOztBQVdBLElBQU0sOEJBQVcsU0FBWCxRQUFXO0FBQUEsU0FBTztBQUM3QixjQUFjLEdBRGU7QUFFN0IsZUFBYyxHQUZlO0FBRzdCLGtCQUFjO0FBSGUsR0FBUDtBQUFBLENBQWpCOztBQU1BLElBQU0sZ0NBQVksU0FBWixTQUFZO0FBQUEsU0FBTztBQUM5QixhQUFjLE1BRGdCO0FBRTlCLGtCQUFjO0FBRmdCLEdBQVA7QUFBQSxDQUFsQjs7QUFLQSxJQUFNLDBCQUFTLFNBQVQsTUFBUyxDQUFDLFVBQUQ7QUFBQSxTQUFpQjtBQUNyQyxlQUFjLGFBQWEsRUFBYixHQUFrQixNQURLO0FBRXJDLGFBQWMsTUFGdUI7QUFHckMsZUFBYyxXQUh1QjtBQUlyQyxjQUFjLE1BSnVCO0FBS3JDLGtCQUFjLFFBTHVCO0FBTXJDLGtCQUFjLG1CQU51QjtBQU9yQyxhQUFTO0FBQ1Asa0JBQVk7QUFDVixtQkFBYyxJQURKO0FBRVYsb0JBQWMsVUFGSjtBQUdWLGlCQUFjLEdBSEo7QUFJVixrQkFBYyxHQUpKO0FBS1YsZ0JBQWMsR0FMSjtBQU1WLGtCQUFjLE1BTko7QUFPVixvQkFBYyxRQVBKO0FBUVY7QUFSVTtBQURMO0FBUDRCLEdBQWpCO0FBQUEsQ0FBZjs7QUF5QkEsSUFBTSw0QkFBVSxTQUFWLE9BQVU7QUFBQSxTQUFPO0FBQzVCLGNBQWMsR0FEYztBQUU1QixlQUFjLEdBRmM7QUFHNUIsa0JBQWMsTUFIYztBQUk1QixnQkFBYyxVQUpjO0FBSzVCLGFBQWMsR0FMYztBQU01QixZQUFjO0FBTmMsR0FBUDtBQUFBLENBQWhCOztBQVNBLElBQU0sZ0NBQVksU0FBWixTQUFZO0FBQUEsU0FBTztBQUM5QixlQUFXO0FBRG1CLEdBQVA7QUFBQSxDQUFsQjs7QUFJQSxJQUFNLDhCQUFXLFNBQVgsUUFBVyxDQUFDLFFBQUQ7QUFBQTtBQUN0QixhQUFXLFNBRFc7QUFFdEIsY0FBVyxLQUZXO0FBR3RCLGVBQVcsU0FIVztBQUl0QixjQUFXLHVCQUpXO0FBS3RCLHFCQUFpQjtBQUxLLEtBTWxCLFdBQVc7QUFDYixvQkFBZ0I7QUFESCxHQUFYLEdBRUEsRUFSa0I7QUFTdEIsdUJBQW1CLE1BVEc7QUFVdEIsYUFBUztBQUNQLGlCQUFXO0FBQ1Qsd0JBQWdCO0FBRFA7QUFESjtBQVZhO0FBQUEsQ0FBakI7O0FBaUJBLElBQU0sZ0NBQVksU0FBWixTQUFZO0FBQUEsU0FBTztBQUM5QixrQkFBYyxRQURnQjtBQUU5QixjQUFjLE1BRmdCO0FBRzlCLGVBQWMsR0FIZ0I7QUFJOUIsZ0JBQWM7QUFKZ0IsR0FBUDtBQUFBLENBQWxCOztBQU9BLElBQU0sMENBQWlCLFNBQWpCLGNBQWlCLENBQUMsT0FBRDtBQUFBO0FBQzVCLGFBQWEsTUFEZTtBQUU1QixjQUFhLE1BRmU7QUFHNUIsaUJBQWEsR0FIZTtBQUk1QixnQkFBYSxVQUplO0FBSzVCLFdBQWEsT0FMZTtBQU01QixZQUFhO0FBTmUsS0FPekIsT0FBTyxNQUFQLENBQWMsRUFBZCxDQVB5QjtBQVE1QixhQUFTO0FBQ1Asa0JBQVk7QUFDViwrQkFEVTtBQUVWLHFCQUFhLE1BRkg7QUFHVixpQkFBYSxVQUFVLFNBQVYsR0FBc0IsU0FIekI7QUFJVixtQkFBYTtBQUpIO0FBREw7QUFSbUI7QUFBQSxDQUF2Qjs7QUFrQkEsSUFBTSwwQ0FBaUIsU0FBakIsY0FBaUI7QUFBQSxzQkFDekIsT0FBTyxNQUFQLEVBRHlCO0FBRTVCLGFBQW1CLE9BRlM7QUFHNUIsZ0JBQW1CLFVBSFM7QUFJNUIsbUJBQW1CLE1BSlM7QUFLNUIsdUJBQW1CLE1BTFM7QUFNNUIsY0FBbUIsU0FOUztBQU81QixhQUFTO0FBQ1AsaUJBQVc7QUFDVCwyQkFBbUI7QUFEVjtBQURKO0FBUG1CO0FBQUEsQ0FBdkI7Ozs7Ozs7Ozs7O2tCQy9DaUIsSTs7QUF4RXhCOzs7O0FBQ0E7O0FBR0E7O0lBQVksWTs7QUFDWjs7SUFBWSxNOzs7Ozs7QUFFWixTQUFTLFlBQVQsQ0FBc0IsS0FBdEIsRUFBNkI7QUFDM0IsU0FBTyxpQkFBTyxDQUNaLGFBQUcsRUFBRSxLQUFLLE9BQU8sS0FBUCxFQUFQLEVBQUgsRUFBNEIsT0FBNUIsQ0FEWSxFQUVaLGdCQUFNLFdBQU4sRUFBbUI7QUFDakIsV0FBTztBQUNMLFlBQU0sTUFERDtBQUVMLG1CQUFhLHdCQUZSO0FBR0wsaUJBQVcsSUFITjtBQUlMLFlBQU0sU0FKRDtBQUtMLGFBQU8sTUFBTTtBQUxSLEtBRFU7QUFRakIsU0FBSyxPQUFPLEtBQVA7QUFSWSxHQUFuQixDQUZZLENBQVAsQ0FBUDtBQWFEOztBQUVELFNBQVMsaUJBQVQsQ0FBMkIsS0FBM0IsRUFBa0MsUUFBbEMsRUFBNEM7QUFDMUMsTUFBTSxlQUFlLE1BQU0sSUFBTixDQUFXLE1BQVgsQ0FBa0IsVUFBQyxDQUFELEVBQUksQ0FBSjtBQUFBLFdBQVUsS0FBSyxFQUFFLFNBQWpCO0FBQUEsR0FBbEIsRUFBOEMsSUFBOUMsQ0FBckI7O0FBRUEsU0FBTyxrQkFBUSxPQUFSLEVBQWlCLEVBQUUsS0FBSyxPQUFPLElBQVAsQ0FBWSxNQUFNLElBQU4sQ0FBVyxNQUF2QixDQUFQLEVBQWpCLEVBQTBELENBQy9ELGdCQUFNLHdCQUFOLEVBQWdDO0FBQzlCLFdBQU8sRUFBRSxNQUFNLFVBQVIsRUFBb0IsU0FBUyxZQUE3QixFQUR1QjtBQUU5QixTQUFLLE9BQU8sU0FBUDtBQUZ5QixHQUFoQyxDQUQrRCxFQUsvRCxnQkFBTSxRQUFOLEVBQWdCO0FBQ2QsV0FBTyxFQUFFLEtBQUssWUFBUCxFQURPO0FBRWQsU0FBSyxPQUFPLGNBQVAsQ0FBc0IsWUFBdEI7QUFGUyxHQUFoQixFQUdHLHNCQUhILENBTCtELEVBUy9ELFFBVCtELENBQTFELENBQVA7QUFXRDs7QUFFRCxTQUFTLGtCQUFULENBQTRCLEtBQTVCLEVBQW1DLFNBQW5DLEVBQThDLElBQTlDLEVBQW9ELEtBQXBELEVBQTJEO0FBQ3pELE1BQU0sV0FBVyxNQUFNLE1BQU4sS0FBaUIsU0FBbEM7QUFDQSxTQUFPLGFBQUcsRUFBRSxLQUFLLE9BQU8sU0FBUCxFQUFQLEVBQUgsRUFBZ0MsQ0FDckMsWUFBRTtBQUNBLFdBQU8sRUFBRSxNQUFNLElBQVIsRUFEUDtBQUVBLFNBQUssT0FBTyxRQUFQLENBQWdCLFFBQWhCO0FBRkwsR0FBRixFQUdHLEtBSEgsQ0FEcUMsQ0FBaEMsQ0FBUDtBQU1EOztBQUVELFNBQVMsWUFBVCxDQUFzQixLQUF0QixFQUE2QjtBQUMzQixNQUFNLGtCQUFrQixNQUFNLElBQU4sQ0FDckIsTUFEcUIsQ0FDZDtBQUFBLFdBQVEsS0FBSyxTQUFiO0FBQUEsR0FEYyxFQUVyQixNQUZIO0FBR0EsTUFBTSxlQUFlLE1BQU0sSUFBTixDQUFXLE1BQVgsR0FBb0IsZUFBekM7O0FBRUEsU0FBTyxpQkFBTyxTQUFQLEVBQWtCLEVBQUUsS0FBSyxPQUFPLE1BQVAsQ0FBYyxNQUFNLElBQU4sQ0FBVyxNQUF6QixDQUFQLEVBQWxCLEVBQTZELENBQ2xFLGVBQUssYUFBTCxFQUFvQixFQUFFLEtBQUssT0FBTyxTQUFQLEVBQVAsRUFBcEIsRUFBaUQsQ0FDL0MsaUJBQU8sRUFBRSxLQUFLLGFBQWEsTUFBYixFQUFQLEVBQVAsRUFBdUMsT0FBTyxZQUFQLENBQXZDLENBRCtDLEVBRS9DLFdBQVcsaUJBQWlCLENBQWpCLEdBQXFCLEdBQXJCLEdBQTJCLEVBQXRDLElBQTRDLE9BRkcsQ0FBakQsQ0FEa0UsRUFLbEUsYUFBRyxVQUFILEVBQWUsRUFBRSxLQUFLLE9BQU8sT0FBUCxFQUFQLEVBQWYsRUFBMEMsQ0FDeEMsbUJBQW1CLEtBQW5CLEVBQTBCLEVBQTFCLEVBQThCLEdBQTlCLEVBQW1DLEtBQW5DLENBRHdDLEVBRXhDLG1CQUFtQixLQUFuQixFQUEwQixRQUExQixFQUFvQyxTQUFwQyxFQUErQyxRQUEvQyxDQUZ3QyxFQUd4QyxtQkFBbUIsS0FBbkIsRUFBMEIsV0FBMUIsRUFBdUMsWUFBdkMsRUFBcUQsV0FBckQsQ0FId0MsQ0FBMUMsQ0FMa0UsRUFVakUsa0JBQWtCLENBQWxCLEdBQ0MsaUJBQU8sa0JBQVAsRUFBMkIsRUFBRSxLQUFLLE9BQU8sY0FBUCxFQUFQLEVBQTNCLEVBQTZELHNCQUFzQixlQUF0QixHQUF3QyxHQUFyRyxDQURELEdBRUcsSUFaOEQsQ0FBN0QsQ0FBUDtBQWVEOztBQUVjLFNBQVMsSUFBVCxDQUFjLE1BQWQsRUFBc0IsU0FBdEIsRUFBaUM7QUFDOUMsU0FBTyxrQkFBRyxPQUFILENBQVcsTUFBWCxFQUFtQixTQUFuQixFQUE4QixHQUE5QixDQUFrQztBQUFBO0FBQUEsUUFBRSxLQUFGO0FBQUEsUUFBUyxRQUFUOztBQUFBLFdBQ3ZDLGNBQUksQ0FDRixhQUFhLEtBQWIsQ0FERSxFQUVGLGtCQUFrQixLQUFsQixFQUF5QixRQUF6QixDQUZFLEVBR0YsYUFBYSxLQUFiLENBSEUsQ0FBSixDQUR1QztBQUFBLEdBQWxDLENBQVA7QUFPRDs7Ozs7Ozs7Ozs7OztBQ2hGTSxJQUFNLDBCQUFTLFNBQVQsTUFBUztBQUFBLFNBQU87QUFDM0IsbUJBQWU7QUFEWSxHQUFQO0FBQUEsQ0FBZjs7QUFJQSxJQUFNLDBCQUFTLFNBQVQsTUFBUyxDQUFDLE9BQUQ7QUFBQSxTQUFjO0FBQ2xDLHFDQUFnQyxPQUFoQyxTQURrQztBQUVsQyw2QkFBZ0MsT0FBaEM7QUFGa0MsR0FBZDtBQUFBLENBQWY7O0FBS0EsSUFBTSx3Q0FBZ0IsU0FBaEIsYUFBZ0I7QUFBQSxTQUFPO0FBQ2xDLDhCQUEwQixhQURRO0FBRWxDLDJCQUEwQjtBQUZRLEdBQVA7QUFBQSxDQUF0Qjs7QUFLQSxJQUFNLHdDQUFnQixTQUFoQixhQUFnQjtBQUFBLFNBQU87QUFDbEMsOEJBQTBCLG9CQURRO0FBRWxDLDJCQUEwQixvQkFGUTtBQUdsQyxzQkFBMEI7QUFIUSxHQUFQO0FBQUEsQ0FBdEI7O0FBTUEsSUFBTSxvREFBc0IsU0FBdEIsbUJBQXNCO0FBQUEsU0FBTztBQUN4QywwQkFBc0IsTUFEa0I7QUFFeEMsa0JBQXNCO0FBRmtCLEdBQVA7QUFBQSxDQUE1Qjs7QUFLQSxJQUFNLHdCQUFRLFNBQVIsS0FBUTtBQUFBOztBQUFBO0FBQ25CLGdCQUFlLFVBREk7QUFFbkIsY0FBZSxHQUZJO0FBR25CLGFBQWUsTUFISTtBQUluQixpQkFBZSxNQUpJO0FBS25CLG1CQUFlLFNBTEk7QUFNbkIsbUJBQWUsU0FOSTtBQU9uQixtQkFBZSxPQVBJO0FBUW5CLGNBQWUsR0FSSTtBQVNuQixlQUFlLE1BVEk7QUFVbkIsYUFBZSxTQVZJO0FBV25CLGVBQWU7QUFYSSwwQ0FZSixnQkFaSSw4QkFhbkIsWUFibUIsRUFhSix1Q0FiSSw4QkFjbkIsWUFkbUIsRUFjSixZQWRJLGVBZWhCLGVBZmdCO0FBQUEsQ0FBZDs7QUFrQkEsSUFBTSwwQkFBUyxTQUFULE1BQVM7QUFBQTtBQUNwQixjQUFrQixHQURFO0FBRXBCLGVBQWtCLEdBRkU7QUFHcEIsY0FBa0IsR0FIRTtBQUlwQixrQkFBa0IsTUFKRTtBQUtwQixpQkFBa0IsTUFMRTtBQU1wQixzQkFBa0IsVUFORTtBQU9wQixtQkFBa0IsU0FQRTtBQVFwQixtQkFBa0IsU0FSRTtBQVNwQixhQUFrQjtBQVRFLEtBVWpCLHFCQVZpQixFQVdqQixlQVhpQjtBQUFBLENBQWY7Ozs7Ozs7O0FDM0NQLElBQU0sWUFBWSxFQUFsQjtBQUNBLElBQU0sVUFBVSxFQUFoQjs7UUFFUSxTLEdBQUEsUztRQUFXLE8sR0FBQSxPIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgeHN0cmVhbV8xID0gcmVxdWlyZShcInhzdHJlYW1cIik7XG52YXIgYWRhcHRfMSA9IHJlcXVpcmUoXCJAY3ljbGUvcnVuL2xpYi9hZGFwdFwiKTtcbnZhciBmcm9tRXZlbnRfMSA9IHJlcXVpcmUoXCIuL2Zyb21FdmVudFwiKTtcbnZhciBCb2R5RE9NU291cmNlID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBCb2R5RE9NU291cmNlKF9uYW1lKSB7XG4gICAgICAgIHRoaXMuX25hbWUgPSBfbmFtZTtcbiAgICB9XG4gICAgQm9keURPTVNvdXJjZS5wcm90b3R5cGUuc2VsZWN0ID0gZnVuY3Rpb24gKHNlbGVjdG9yKSB7XG4gICAgICAgIC8vIFRoaXMgZnVuY3Rpb25hbGl0eSBpcyBzdGlsbCB1bmRlZmluZWQvdW5kZWNpZGVkLlxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIEJvZHlET01Tb3VyY2UucHJvdG90eXBlLmVsZW1lbnRzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgb3V0ID0gYWRhcHRfMS5hZGFwdCh4c3RyZWFtXzEuZGVmYXVsdC5vZihkb2N1bWVudC5ib2R5KSk7XG4gICAgICAgIG91dC5faXNDeWNsZVNvdXJjZSA9IHRoaXMuX25hbWU7XG4gICAgICAgIHJldHVybiBvdXQ7XG4gICAgfTtcbiAgICBCb2R5RE9NU291cmNlLnByb3RvdHlwZS5ldmVudHMgPSBmdW5jdGlvbiAoZXZlbnRUeXBlLCBvcHRpb25zKSB7XG4gICAgICAgIGlmIChvcHRpb25zID09PSB2b2lkIDApIHsgb3B0aW9ucyA9IHt9OyB9XG4gICAgICAgIHZhciBzdHJlYW07XG4gICAgICAgIHN0cmVhbSA9IGZyb21FdmVudF8xLmZyb21FdmVudChkb2N1bWVudC5ib2R5LCBldmVudFR5cGUsIG9wdGlvbnMudXNlQ2FwdHVyZSwgb3B0aW9ucy5wcmV2ZW50RGVmYXVsdCk7XG4gICAgICAgIHZhciBvdXQgPSBhZGFwdF8xLmFkYXB0KHN0cmVhbSk7XG4gICAgICAgIG91dC5faXNDeWNsZVNvdXJjZSA9IHRoaXMuX25hbWU7XG4gICAgICAgIHJldHVybiBvdXQ7XG4gICAgfTtcbiAgICByZXR1cm4gQm9keURPTVNvdXJjZTtcbn0oKSk7XG5leHBvcnRzLkJvZHlET01Tb3VyY2UgPSBCb2R5RE9NU291cmNlO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9Qm9keURPTVNvdXJjZS5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB4c3RyZWFtXzEgPSByZXF1aXJlKFwieHN0cmVhbVwiKTtcbnZhciBhZGFwdF8xID0gcmVxdWlyZShcIkBjeWNsZS9ydW4vbGliL2FkYXB0XCIpO1xudmFyIGZyb21FdmVudF8xID0gcmVxdWlyZShcIi4vZnJvbUV2ZW50XCIpO1xudmFyIERvY3VtZW50RE9NU291cmNlID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBEb2N1bWVudERPTVNvdXJjZShfbmFtZSkge1xuICAgICAgICB0aGlzLl9uYW1lID0gX25hbWU7XG4gICAgfVxuICAgIERvY3VtZW50RE9NU291cmNlLnByb3RvdHlwZS5zZWxlY3QgPSBmdW5jdGlvbiAoc2VsZWN0b3IpIHtcbiAgICAgICAgLy8gVGhpcyBmdW5jdGlvbmFsaXR5IGlzIHN0aWxsIHVuZGVmaW5lZC91bmRlY2lkZWQuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgRG9jdW1lbnRET01Tb3VyY2UucHJvdG90eXBlLmVsZW1lbnRzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgb3V0ID0gYWRhcHRfMS5hZGFwdCh4c3RyZWFtXzEuZGVmYXVsdC5vZihkb2N1bWVudCkpO1xuICAgICAgICBvdXQuX2lzQ3ljbGVTb3VyY2UgPSB0aGlzLl9uYW1lO1xuICAgICAgICByZXR1cm4gb3V0O1xuICAgIH07XG4gICAgRG9jdW1lbnRET01Tb3VyY2UucHJvdG90eXBlLmV2ZW50cyA9IGZ1bmN0aW9uIChldmVudFR5cGUsIG9wdGlvbnMpIHtcbiAgICAgICAgaWYgKG9wdGlvbnMgPT09IHZvaWQgMCkgeyBvcHRpb25zID0ge307IH1cbiAgICAgICAgdmFyIHN0cmVhbTtcbiAgICAgICAgc3RyZWFtID0gZnJvbUV2ZW50XzEuZnJvbUV2ZW50KGRvY3VtZW50LCBldmVudFR5cGUsIG9wdGlvbnMudXNlQ2FwdHVyZSwgb3B0aW9ucy5wcmV2ZW50RGVmYXVsdCk7XG4gICAgICAgIHZhciBvdXQgPSBhZGFwdF8xLmFkYXB0KHN0cmVhbSk7XG4gICAgICAgIG91dC5faXNDeWNsZVNvdXJjZSA9IHRoaXMuX25hbWU7XG4gICAgICAgIHJldHVybiBvdXQ7XG4gICAgfTtcbiAgICByZXR1cm4gRG9jdW1lbnRET01Tb3VyY2U7XG59KCkpO1xuZXhwb3J0cy5Eb2N1bWVudERPTVNvdXJjZSA9IERvY3VtZW50RE9NU291cmNlO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9RG9jdW1lbnRET01Tb3VyY2UuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgU2NvcGVDaGVja2VyXzEgPSByZXF1aXJlKFwiLi9TY29wZUNoZWNrZXJcIik7XG52YXIgdXRpbHNfMSA9IHJlcXVpcmUoXCIuL3V0aWxzXCIpO1xudmFyIG1hdGNoZXNTZWxlY3Rvcl8xID0gcmVxdWlyZShcIi4vbWF0Y2hlc1NlbGVjdG9yXCIpO1xuZnVuY3Rpb24gdG9FbEFycmF5KGlucHV0KSB7XG4gICAgcmV0dXJuIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGlucHV0KTtcbn1cbnZhciBFbGVtZW50RmluZGVyID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBFbGVtZW50RmluZGVyKG5hbWVzcGFjZSwgaXNvbGF0ZU1vZHVsZSkge1xuICAgICAgICB0aGlzLm5hbWVzcGFjZSA9IG5hbWVzcGFjZTtcbiAgICAgICAgdGhpcy5pc29sYXRlTW9kdWxlID0gaXNvbGF0ZU1vZHVsZTtcbiAgICB9XG4gICAgRWxlbWVudEZpbmRlci5wcm90b3R5cGUuY2FsbCA9IGZ1bmN0aW9uIChyb290RWxlbWVudCkge1xuICAgICAgICB2YXIgbmFtZXNwYWNlID0gdGhpcy5uYW1lc3BhY2U7XG4gICAgICAgIHZhciBzZWxlY3RvciA9IHV0aWxzXzEuZ2V0U2VsZWN0b3JzKG5hbWVzcGFjZSk7XG4gICAgICAgIGlmICghc2VsZWN0b3IpIHtcbiAgICAgICAgICAgIHJldHVybiByb290RWxlbWVudDtcbiAgICAgICAgfVxuICAgICAgICB2YXIgZnVsbFNjb3BlID0gdXRpbHNfMS5nZXRGdWxsU2NvcGUobmFtZXNwYWNlKTtcbiAgICAgICAgdmFyIHNjb3BlQ2hlY2tlciA9IG5ldyBTY29wZUNoZWNrZXJfMS5TY29wZUNoZWNrZXIoZnVsbFNjb3BlLCB0aGlzLmlzb2xhdGVNb2R1bGUpO1xuICAgICAgICB2YXIgdG9wTm9kZSA9IGZ1bGxTY29wZVxuICAgICAgICAgICAgPyB0aGlzLmlzb2xhdGVNb2R1bGUuZ2V0RWxlbWVudChmdWxsU2NvcGUpIHx8IHJvb3RFbGVtZW50XG4gICAgICAgICAgICA6IHJvb3RFbGVtZW50O1xuICAgICAgICB2YXIgdG9wTm9kZU1hdGNoZXNTZWxlY3RvciA9ICEhZnVsbFNjb3BlICYmICEhc2VsZWN0b3IgJiYgbWF0Y2hlc1NlbGVjdG9yXzEubWF0Y2hlc1NlbGVjdG9yKHRvcE5vZGUsIHNlbGVjdG9yKTtcbiAgICAgICAgcmV0dXJuIHRvRWxBcnJheSh0b3BOb2RlLnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpKVxuICAgICAgICAgICAgLmZpbHRlcihzY29wZUNoZWNrZXIuaXNEaXJlY3RseUluU2NvcGUsIHNjb3BlQ2hlY2tlcilcbiAgICAgICAgICAgIC5jb25jYXQodG9wTm9kZU1hdGNoZXNTZWxlY3RvciA/IFt0b3BOb2RlXSA6IFtdKTtcbiAgICB9O1xuICAgIHJldHVybiBFbGVtZW50RmluZGVyO1xufSgpKTtcbmV4cG9ydHMuRWxlbWVudEZpbmRlciA9IEVsZW1lbnRGaW5kZXI7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1FbGVtZW50RmluZGVyLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHhzdHJlYW1fMSA9IHJlcXVpcmUoXCJ4c3RyZWFtXCIpO1xudmFyIFNjb3BlQ2hlY2tlcl8xID0gcmVxdWlyZShcIi4vU2NvcGVDaGVja2VyXCIpO1xudmFyIHV0aWxzXzEgPSByZXF1aXJlKFwiLi91dGlsc1wiKTtcbnZhciBtYXRjaGVzU2VsZWN0b3JfMSA9IHJlcXVpcmUoXCIuL21hdGNoZXNTZWxlY3RvclwiKTtcbi8qKlxuICogRmluZHMgKHdpdGggYmluYXJ5IHNlYXJjaCkgaW5kZXggb2YgdGhlIGRlc3RpbmF0aW9uIHRoYXQgaWQgZXF1YWwgdG8gc2VhcmNoSWRcbiAqIGFtb25nIHRoZSBkZXN0aW5hdGlvbnMgaW4gdGhlIGdpdmVuIGFycmF5LlxuICovXG5mdW5jdGlvbiBpbmRleE9mKGFyciwgc2VhcmNoSWQpIHtcbiAgICB2YXIgbWluSW5kZXggPSAwO1xuICAgIHZhciBtYXhJbmRleCA9IGFyci5sZW5ndGggLSAxO1xuICAgIHZhciBjdXJyZW50SW5kZXg7XG4gICAgdmFyIGN1cnJlbnQ7XG4gICAgd2hpbGUgKG1pbkluZGV4IDw9IG1heEluZGV4KSB7XG4gICAgICAgIGN1cnJlbnRJbmRleCA9ICgobWluSW5kZXggKyBtYXhJbmRleCkgLyAyKSB8IDA7IC8vIHRzbGludDpkaXNhYmxlLWxpbmU6bm8tYml0d2lzZVxuICAgICAgICBjdXJyZW50ID0gYXJyW2N1cnJlbnRJbmRleF07XG4gICAgICAgIHZhciBjdXJyZW50SWQgPSBjdXJyZW50LmlkO1xuICAgICAgICBpZiAoY3VycmVudElkIDwgc2VhcmNoSWQpIHtcbiAgICAgICAgICAgIG1pbkluZGV4ID0gY3VycmVudEluZGV4ICsgMTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChjdXJyZW50SWQgPiBzZWFyY2hJZCkge1xuICAgICAgICAgICAgbWF4SW5kZXggPSBjdXJyZW50SW5kZXggLSAxO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGN1cnJlbnRJbmRleDtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gLTE7XG59XG4vKipcbiAqIE1hbmFnZXMgXCJFdmVudCBkZWxlZ2F0aW9uXCIsIGJ5IGNvbm5lY3RpbmcgYW4gb3JpZ2luIHdpdGggbXVsdGlwbGVcbiAqIGRlc3RpbmF0aW9ucy5cbiAqXG4gKiBBdHRhY2hlcyBhIERPTSBldmVudCBsaXN0ZW5lciB0byB0aGUgRE9NIGVsZW1lbnQgY2FsbGVkIHRoZSBcIm9yaWdpblwiLFxuICogYW5kIGRlbGVnYXRlcyBldmVudHMgdG8gXCJkZXN0aW5hdGlvbnNcIiwgd2hpY2ggYXJlIHN1YmplY3RzIGFzIG91dHB1dHNcbiAqIGZvciB0aGUgRE9NU291cmNlLiBTaW11bGF0ZXMgYnViYmxpbmcgb3IgY2FwdHVyaW5nLCB3aXRoIHJlZ2FyZHMgdG9cbiAqIGlzb2xhdGlvbiBib3VuZGFyaWVzIHRvby5cbiAqL1xudmFyIEV2ZW50RGVsZWdhdG9yID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBFdmVudERlbGVnYXRvcihvcmlnaW4sIGV2ZW50VHlwZSwgdXNlQ2FwdHVyZSwgaXNvbGF0ZU1vZHVsZSwgcHJldmVudERlZmF1bHQpIHtcbiAgICAgICAgaWYgKHByZXZlbnREZWZhdWx0ID09PSB2b2lkIDApIHsgcHJldmVudERlZmF1bHQgPSBmYWxzZTsgfVxuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB0aGlzLm9yaWdpbiA9IG9yaWdpbjtcbiAgICAgICAgdGhpcy5ldmVudFR5cGUgPSBldmVudFR5cGU7XG4gICAgICAgIHRoaXMudXNlQ2FwdHVyZSA9IHVzZUNhcHR1cmU7XG4gICAgICAgIHRoaXMuaXNvbGF0ZU1vZHVsZSA9IGlzb2xhdGVNb2R1bGU7XG4gICAgICAgIHRoaXMucHJldmVudERlZmF1bHQgPSBwcmV2ZW50RGVmYXVsdDtcbiAgICAgICAgdGhpcy5kZXN0aW5hdGlvbnMgPSBbXTtcbiAgICAgICAgdGhpcy5fbGFzdElkID0gMDtcbiAgICAgICAgaWYgKHByZXZlbnREZWZhdWx0KSB7XG4gICAgICAgICAgICBpZiAodXNlQ2FwdHVyZSkge1xuICAgICAgICAgICAgICAgIHRoaXMubGlzdGVuZXIgPSBmdW5jdGlvbiAoZXYpIHtcbiAgICAgICAgICAgICAgICAgICAgZXYucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuY2FwdHVyZShldik7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMubGlzdGVuZXIgPSBmdW5jdGlvbiAoZXYpIHtcbiAgICAgICAgICAgICAgICAgICAgZXYucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuYnViYmxlKGV2KTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgaWYgKHVzZUNhcHR1cmUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmxpc3RlbmVyID0gZnVuY3Rpb24gKGV2KSB7IHJldHVybiBfdGhpcy5jYXB0dXJlKGV2KTsgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMubGlzdGVuZXIgPSBmdW5jdGlvbiAoZXYpIHsgcmV0dXJuIF90aGlzLmJ1YmJsZShldik7IH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgb3JpZ2luLmFkZEV2ZW50TGlzdGVuZXIoZXZlbnRUeXBlLCB0aGlzLmxpc3RlbmVyLCB1c2VDYXB0dXJlKTtcbiAgICB9XG4gICAgRXZlbnREZWxlZ2F0b3IucHJvdG90eXBlLnVwZGF0ZU9yaWdpbiA9IGZ1bmN0aW9uIChuZXdPcmlnaW4pIHtcbiAgICAgICAgdGhpcy5vcmlnaW4ucmVtb3ZlRXZlbnRMaXN0ZW5lcih0aGlzLmV2ZW50VHlwZSwgdGhpcy5saXN0ZW5lciwgdGhpcy51c2VDYXB0dXJlKTtcbiAgICAgICAgbmV3T3JpZ2luLmFkZEV2ZW50TGlzdGVuZXIodGhpcy5ldmVudFR5cGUsIHRoaXMubGlzdGVuZXIsIHRoaXMudXNlQ2FwdHVyZSk7XG4gICAgICAgIHRoaXMub3JpZ2luID0gbmV3T3JpZ2luO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhICpuZXcqIGRlc3RpbmF0aW9uIGdpdmVuIHRoZSBuYW1lc3BhY2UgYW5kIHJldHVybnMgdGhlIHN1YmplY3RcbiAgICAgKiByZXByZXNlbnRpbmcgdGhlIGRlc3RpbmF0aW9uIG9mIGV2ZW50cy4gSXMgbm90IHJlZmVyZW50aWFsbHkgdHJhbnNwYXJlbnQsXG4gICAgICogd2lsbCBhbHdheXMgcmV0dXJuIGEgZGlmZmVyZW50IG91dHB1dCBmb3IgdGhlIHNhbWUgaW5wdXQuXG4gICAgICovXG4gICAgRXZlbnREZWxlZ2F0b3IucHJvdG90eXBlLmNyZWF0ZURlc3RpbmF0aW9uID0gZnVuY3Rpb24gKG5hbWVzcGFjZSkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB2YXIgaWQgPSB0aGlzLl9sYXN0SWQrKztcbiAgICAgICAgdmFyIHNlbGVjdG9yID0gdXRpbHNfMS5nZXRTZWxlY3RvcnMobmFtZXNwYWNlKTtcbiAgICAgICAgdmFyIHNjb3BlQ2hlY2tlciA9IG5ldyBTY29wZUNoZWNrZXJfMS5TY29wZUNoZWNrZXIodXRpbHNfMS5nZXRGdWxsU2NvcGUobmFtZXNwYWNlKSwgdGhpcy5pc29sYXRlTW9kdWxlKTtcbiAgICAgICAgdmFyIHN1YmplY3QgPSB4c3RyZWFtXzEuZGVmYXVsdC5jcmVhdGUoe1xuICAgICAgICAgICAgc3RhcnQ6IGZ1bmN0aW9uICgpIHsgfSxcbiAgICAgICAgICAgIHN0b3A6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoJ3JlcXVlc3RJZGxlQ2FsbGJhY2snIGluIHdpbmRvdykge1xuICAgICAgICAgICAgICAgICAgICByZXF1ZXN0SWRsZUNhbGxiYWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLnJlbW92ZURlc3RpbmF0aW9uKGlkKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBfdGhpcy5yZW1vdmVEZXN0aW5hdGlvbihpZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgfSk7XG4gICAgICAgIHZhciBkZXN0aW5hdGlvbiA9IHsgaWQ6IGlkLCBzZWxlY3Rvcjogc2VsZWN0b3IsIHNjb3BlQ2hlY2tlcjogc2NvcGVDaGVja2VyLCBzdWJqZWN0OiBzdWJqZWN0IH07XG4gICAgICAgIHRoaXMuZGVzdGluYXRpb25zLnB1c2goZGVzdGluYXRpb24pO1xuICAgICAgICByZXR1cm4gc3ViamVjdDtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIFJlbW92ZXMgdGhlIGRlc3RpbmF0aW9uIHRoYXQgaGFzIHRoZSBnaXZlbiBpZC5cbiAgICAgKi9cbiAgICBFdmVudERlbGVnYXRvci5wcm90b3R5cGUucmVtb3ZlRGVzdGluYXRpb24gPSBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgdmFyIGkgPSBpbmRleE9mKHRoaXMuZGVzdGluYXRpb25zLCBpZCk7XG4gICAgICAgIGkgPj0gMCAmJiB0aGlzLmRlc3RpbmF0aW9ucy5zcGxpY2UoaSwgMSk7IC8vIHRzbGludDpkaXNhYmxlLWxpbmU6bm8tdW51c2VkLWV4cHJlc3Npb25cbiAgICB9O1xuICAgIEV2ZW50RGVsZWdhdG9yLnByb3RvdHlwZS5jYXB0dXJlID0gZnVuY3Rpb24gKGV2KSB7XG4gICAgICAgIHZhciBuID0gdGhpcy5kZXN0aW5hdGlvbnMubGVuZ3RoO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG47IGkrKykge1xuICAgICAgICAgICAgdmFyIGRlc3QgPSB0aGlzLmRlc3RpbmF0aW9uc1tpXTtcbiAgICAgICAgICAgIGlmIChtYXRjaGVzU2VsZWN0b3JfMS5tYXRjaGVzU2VsZWN0b3IoZXYudGFyZ2V0LCBkZXN0LnNlbGVjdG9yKSkge1xuICAgICAgICAgICAgICAgIGRlc3Quc3ViamVjdC5fbihldik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuICAgIEV2ZW50RGVsZWdhdG9yLnByb3RvdHlwZS5idWJibGUgPSBmdW5jdGlvbiAocmF3RXZlbnQpIHtcbiAgICAgICAgdmFyIG9yaWdpbiA9IHRoaXMub3JpZ2luO1xuICAgICAgICBpZiAoIW9yaWdpbi5jb250YWlucyhyYXdFdmVudC5jdXJyZW50VGFyZ2V0KSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHZhciByb29mID0gb3JpZ2luLnBhcmVudEVsZW1lbnQ7XG4gICAgICAgIHZhciBldiA9IHRoaXMucGF0Y2hFdmVudChyYXdFdmVudCk7XG4gICAgICAgIGZvciAodmFyIGVsID0gZXYudGFyZ2V0OyBlbCAmJiBlbCAhPT0gcm9vZjsgZWwgPSBlbC5wYXJlbnRFbGVtZW50KSB7XG4gICAgICAgICAgICBpZiAoIW9yaWdpbi5jb250YWlucyhlbCkpIHtcbiAgICAgICAgICAgICAgICBldi5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChldi5wcm9wYWdhdGlvbkhhc0JlZW5TdG9wcGVkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5tYXRjaEV2ZW50QWdhaW5zdERlc3RpbmF0aW9ucyhlbCwgZXYpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBFdmVudERlbGVnYXRvci5wcm90b3R5cGUucGF0Y2hFdmVudCA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICB2YXIgcEV2ZW50ID0gZXZlbnQ7XG4gICAgICAgIHBFdmVudC5wcm9wYWdhdGlvbkhhc0JlZW5TdG9wcGVkID0gZmFsc2U7XG4gICAgICAgIHZhciBvbGRTdG9wUHJvcGFnYXRpb24gPSBwRXZlbnQuc3RvcFByb3BhZ2F0aW9uO1xuICAgICAgICBwRXZlbnQuc3RvcFByb3BhZ2F0aW9uID0gZnVuY3Rpb24gc3RvcFByb3BhZ2F0aW9uKCkge1xuICAgICAgICAgICAgb2xkU3RvcFByb3BhZ2F0aW9uLmNhbGwodGhpcyk7XG4gICAgICAgICAgICB0aGlzLnByb3BhZ2F0aW9uSGFzQmVlblN0b3BwZWQgPSB0cnVlO1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gcEV2ZW50O1xuICAgIH07XG4gICAgRXZlbnREZWxlZ2F0b3IucHJvdG90eXBlLm1hdGNoRXZlbnRBZ2FpbnN0RGVzdGluYXRpb25zID0gZnVuY3Rpb24gKGVsLCBldikge1xuICAgICAgICB2YXIgbiA9IHRoaXMuZGVzdGluYXRpb25zLmxlbmd0aDtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBkZXN0ID0gdGhpcy5kZXN0aW5hdGlvbnNbaV07XG4gICAgICAgICAgICBpZiAoIWRlc3Quc2NvcGVDaGVja2VyLmlzRGlyZWN0bHlJblNjb3BlKGVsKSkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG1hdGNoZXNTZWxlY3Rvcl8xLm1hdGNoZXNTZWxlY3RvcihlbCwgZGVzdC5zZWxlY3RvcikpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm11dGF0ZUV2ZW50Q3VycmVudFRhcmdldChldiwgZWwpO1xuICAgICAgICAgICAgICAgIGRlc3Quc3ViamVjdC5fbihldik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuICAgIEV2ZW50RGVsZWdhdG9yLnByb3RvdHlwZS5tdXRhdGVFdmVudEN1cnJlbnRUYXJnZXQgPSBmdW5jdGlvbiAoZXZlbnQsIGN1cnJlbnRUYXJnZXRFbGVtZW50KSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoZXZlbnQsIFwiY3VycmVudFRhcmdldFwiLCB7XG4gICAgICAgICAgICAgICAgdmFsdWU6IGN1cnJlbnRUYXJnZXRFbGVtZW50LFxuICAgICAgICAgICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwicGxlYXNlIHVzZSBldmVudC5vd25lclRhcmdldFwiKTtcbiAgICAgICAgfVxuICAgICAgICBldmVudC5vd25lclRhcmdldCA9IGN1cnJlbnRUYXJnZXRFbGVtZW50O1xuICAgIH07XG4gICAgcmV0dXJuIEV2ZW50RGVsZWdhdG9yO1xufSgpKTtcbmV4cG9ydHMuRXZlbnREZWxlZ2F0b3IgPSBFdmVudERlbGVnYXRvcjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPUV2ZW50RGVsZWdhdG9yLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIE1hcFBvbHlmaWxsID0gcmVxdWlyZShcImVzNi1tYXBcIik7XG52YXIgSXNvbGF0ZU1vZHVsZSA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gSXNvbGF0ZU1vZHVsZSgpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50c0J5RnVsbFNjb3BlID0gbmV3IE1hcFBvbHlmaWxsKCk7XG4gICAgICAgIHRoaXMuZGVsZWdhdG9yc0J5RnVsbFNjb3BlID0gbmV3IE1hcFBvbHlmaWxsKCk7XG4gICAgICAgIHRoaXMuZnVsbFNjb3Blc0JlaW5nVXBkYXRlZCA9IFtdO1xuICAgICAgICB0aGlzLnZub2Rlc0JlaW5nUmVtb3ZlZCA9IFtdO1xuICAgIH1cbiAgICBJc29sYXRlTW9kdWxlLnByb3RvdHlwZS5jbGVhbnVwVk5vZGUgPSBmdW5jdGlvbiAoX2EpIHtcbiAgICAgICAgdmFyIGRhdGEgPSBfYS5kYXRhLCBlbG0gPSBfYS5lbG07XG4gICAgICAgIHZhciBmdWxsU2NvcGUgPSAoZGF0YSB8fCB7fSkuaXNvbGF0ZSB8fCAnJztcbiAgICAgICAgdmFyIGlzQ3VycmVudEVsbSA9IHRoaXMuZWxlbWVudHNCeUZ1bGxTY29wZS5nZXQoZnVsbFNjb3BlKSA9PT0gZWxtO1xuICAgICAgICB2YXIgaXNTY29wZUJlaW5nVXBkYXRlZCA9IHRoaXMuZnVsbFNjb3Blc0JlaW5nVXBkYXRlZC5pbmRleE9mKGZ1bGxTY29wZSkgPj0gMDtcbiAgICAgICAgaWYgKGZ1bGxTY29wZSAmJiBpc0N1cnJlbnRFbG0gJiYgIWlzU2NvcGVCZWluZ1VwZGF0ZWQpIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudHNCeUZ1bGxTY29wZS5kZWxldGUoZnVsbFNjb3BlKTtcbiAgICAgICAgICAgIHRoaXMuZGVsZWdhdG9yc0J5RnVsbFNjb3BlLmRlbGV0ZShmdWxsU2NvcGUpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBJc29sYXRlTW9kdWxlLnByb3RvdHlwZS5nZXRFbGVtZW50ID0gZnVuY3Rpb24gKGZ1bGxTY29wZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50c0J5RnVsbFNjb3BlLmdldChmdWxsU2NvcGUpO1xuICAgIH07XG4gICAgSXNvbGF0ZU1vZHVsZS5wcm90b3R5cGUuZ2V0RnVsbFNjb3BlID0gZnVuY3Rpb24gKGVsbSkge1xuICAgICAgICB2YXIgaXRlcmF0b3IgPSB0aGlzLmVsZW1lbnRzQnlGdWxsU2NvcGUuZW50cmllcygpO1xuICAgICAgICBmb3IgKHZhciByZXN1bHQgPSBpdGVyYXRvci5uZXh0KCk7ICEhcmVzdWx0LnZhbHVlOyByZXN1bHQgPSBpdGVyYXRvci5uZXh0KCkpIHtcbiAgICAgICAgICAgIHZhciBfYSA9IHJlc3VsdC52YWx1ZSwgZnVsbFNjb3BlID0gX2FbMF0sIGVsZW1lbnQgPSBfYVsxXTtcbiAgICAgICAgICAgIGlmIChlbG0gPT09IGVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZnVsbFNjb3BlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiAnJztcbiAgICB9O1xuICAgIElzb2xhdGVNb2R1bGUucHJvdG90eXBlLmFkZEV2ZW50RGVsZWdhdG9yID0gZnVuY3Rpb24gKGZ1bGxTY29wZSwgZXZlbnREZWxlZ2F0b3IpIHtcbiAgICAgICAgdmFyIGRlbGVnYXRvcnMgPSB0aGlzLmRlbGVnYXRvcnNCeUZ1bGxTY29wZS5nZXQoZnVsbFNjb3BlKTtcbiAgICAgICAgaWYgKCFkZWxlZ2F0b3JzKSB7XG4gICAgICAgICAgICBkZWxlZ2F0b3JzID0gW107XG4gICAgICAgICAgICB0aGlzLmRlbGVnYXRvcnNCeUZ1bGxTY29wZS5zZXQoZnVsbFNjb3BlLCBkZWxlZ2F0b3JzKTtcbiAgICAgICAgfVxuICAgICAgICBkZWxlZ2F0b3JzW2RlbGVnYXRvcnMubGVuZ3RoXSA9IGV2ZW50RGVsZWdhdG9yO1xuICAgIH07XG4gICAgSXNvbGF0ZU1vZHVsZS5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuZWxlbWVudHNCeUZ1bGxTY29wZS5jbGVhcigpO1xuICAgICAgICB0aGlzLmRlbGVnYXRvcnNCeUZ1bGxTY29wZS5jbGVhcigpO1xuICAgICAgICB0aGlzLmZ1bGxTY29wZXNCZWluZ1VwZGF0ZWQgPSBbXTtcbiAgICB9O1xuICAgIElzb2xhdGVNb2R1bGUucHJvdG90eXBlLmNyZWF0ZU1vZHVsZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgY3JlYXRlOiBmdW5jdGlvbiAob2xkVk5vZGUsIHZOb2RlKSB7XG4gICAgICAgICAgICAgICAgdmFyIF9hID0gb2xkVk5vZGUuZGF0YSwgb2xkRGF0YSA9IF9hID09PSB2b2lkIDAgPyB7fSA6IF9hO1xuICAgICAgICAgICAgICAgIHZhciBlbG0gPSB2Tm9kZS5lbG0sIF9iID0gdk5vZGUuZGF0YSwgZGF0YSA9IF9iID09PSB2b2lkIDAgPyB7fSA6IF9iO1xuICAgICAgICAgICAgICAgIHZhciBvbGRGdWxsU2NvcGUgPSBvbGREYXRhLmlzb2xhdGUgfHwgJyc7XG4gICAgICAgICAgICAgICAgdmFyIGZ1bGxTY29wZSA9IGRhdGEuaXNvbGF0ZSB8fCAnJztcbiAgICAgICAgICAgICAgICAvLyBVcGRhdGUgZGF0YSBzdHJ1Y3R1cmVzIHdpdGggdGhlIG5ld2x5LWNyZWF0ZWQgZWxlbWVudFxuICAgICAgICAgICAgICAgIGlmIChmdWxsU2NvcGUpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5mdWxsU2NvcGVzQmVpbmdVcGRhdGVkLnB1c2goZnVsbFNjb3BlKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9sZEZ1bGxTY29wZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50c0J5RnVsbFNjb3BlLmRlbGV0ZShvbGRGdWxsU2NvcGUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuZWxlbWVudHNCeUZ1bGxTY29wZS5zZXQoZnVsbFNjb3BlLCBlbG0pO1xuICAgICAgICAgICAgICAgICAgICAvLyBVcGRhdGUgZGVsZWdhdG9ycyBmb3IgdGhpcyBzY29wZVxuICAgICAgICAgICAgICAgICAgICB2YXIgZGVsZWdhdG9ycyA9IHNlbGYuZGVsZWdhdG9yc0J5RnVsbFNjb3BlLmdldChmdWxsU2NvcGUpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZGVsZWdhdG9ycykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGxlbiA9IGRlbGVnYXRvcnMubGVuZ3RoO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47ICsraSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGVnYXRvcnNbaV0udXBkYXRlT3JpZ2luKGVsbSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKG9sZEZ1bGxTY29wZSAmJiAhZnVsbFNjb3BlKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuZWxlbWVudHNCeUZ1bGxTY29wZS5kZWxldGUoZnVsbFNjb3BlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdXBkYXRlOiBmdW5jdGlvbiAob2xkVk5vZGUsIHZOb2RlKSB7XG4gICAgICAgICAgICAgICAgdmFyIF9hID0gb2xkVk5vZGUuZGF0YSwgb2xkRGF0YSA9IF9hID09PSB2b2lkIDAgPyB7fSA6IF9hO1xuICAgICAgICAgICAgICAgIHZhciBlbG0gPSB2Tm9kZS5lbG0sIF9iID0gdk5vZGUuZGF0YSwgZGF0YSA9IF9iID09PSB2b2lkIDAgPyB7fSA6IF9iO1xuICAgICAgICAgICAgICAgIHZhciBvbGRGdWxsU2NvcGUgPSBvbGREYXRhLmlzb2xhdGUgfHwgJyc7XG4gICAgICAgICAgICAgICAgdmFyIGZ1bGxTY29wZSA9IGRhdGEuaXNvbGF0ZSB8fCAnJztcbiAgICAgICAgICAgICAgICAvLyBTYW1lIGVsZW1lbnQsIGJ1dCBkaWZmZXJlbnQgc2NvcGUsIHNvIHVwZGF0ZSB0aGUgZGF0YSBzdHJ1Y3R1cmVzXG4gICAgICAgICAgICAgICAgaWYgKGZ1bGxTY29wZSAmJiBmdWxsU2NvcGUgIT09IG9sZEZ1bGxTY29wZSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAob2xkRnVsbFNjb3BlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnRzQnlGdWxsU2NvcGUuZGVsZXRlKG9sZEZ1bGxTY29wZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50c0J5RnVsbFNjb3BlLnNldChmdWxsU2NvcGUsIGVsbSk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBkZWxlZ2F0b3JzID0gc2VsZi5kZWxlZ2F0b3JzQnlGdWxsU2NvcGUuZ2V0KG9sZEZ1bGxTY29wZSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChkZWxlZ2F0b3JzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmRlbGVnYXRvcnNCeUZ1bGxTY29wZS5kZWxldGUob2xkRnVsbFNjb3BlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuZGVsZWdhdG9yc0J5RnVsbFNjb3BlLnNldChmdWxsU2NvcGUsIGRlbGVnYXRvcnMpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIFNhbWUgZWxlbWVudCwgYnV0IGxvc3QgdGhlIHNjb3BlLCBzbyB1cGRhdGUgdGhlIGRhdGEgc3RydWN0dXJlc1xuICAgICAgICAgICAgICAgIGlmIChvbGRGdWxsU2NvcGUgJiYgIWZ1bGxTY29wZSkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnRzQnlGdWxsU2NvcGUuZGVsZXRlKG9sZEZ1bGxTY29wZSk7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuZGVsZWdhdG9yc0J5RnVsbFNjb3BlLmRlbGV0ZShvbGRGdWxsU2NvcGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkZXN0cm95OiBmdW5jdGlvbiAodk5vZGUpIHtcbiAgICAgICAgICAgICAgICBzZWxmLnZub2Rlc0JlaW5nUmVtb3ZlZC5wdXNoKHZOb2RlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZW1vdmU6IGZ1bmN0aW9uICh2Tm9kZSwgY2IpIHtcbiAgICAgICAgICAgICAgICBzZWxmLnZub2Rlc0JlaW5nUmVtb3ZlZC5wdXNoKHZOb2RlKTtcbiAgICAgICAgICAgICAgICBjYigpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHBvc3Q6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgdm5vZGVzQmVpbmdSZW1vdmVkID0gc2VsZi52bm9kZXNCZWluZ1JlbW92ZWQ7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IHZub2Rlc0JlaW5nUmVtb3ZlZC5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmNsZWFudXBWTm9kZSh2bm9kZXNCZWluZ1JlbW92ZWRbaV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBzZWxmLnZub2Rlc0JlaW5nUmVtb3ZlZCA9IFtdO1xuICAgICAgICAgICAgICAgIHNlbGYuZnVsbFNjb3Blc0JlaW5nVXBkYXRlZCA9IFtdO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfTtcbiAgICB9O1xuICAgIHJldHVybiBJc29sYXRlTW9kdWxlO1xufSgpKTtcbmV4cG9ydHMuSXNvbGF0ZU1vZHVsZSA9IElzb2xhdGVNb2R1bGU7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1Jc29sYXRlTW9kdWxlLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIGFkYXB0XzEgPSByZXF1aXJlKFwiQGN5Y2xlL3J1bi9saWIvYWRhcHRcIik7XG52YXIgRG9jdW1lbnRET01Tb3VyY2VfMSA9IHJlcXVpcmUoXCIuL0RvY3VtZW50RE9NU291cmNlXCIpO1xudmFyIEJvZHlET01Tb3VyY2VfMSA9IHJlcXVpcmUoXCIuL0JvZHlET01Tb3VyY2VcIik7XG52YXIgRWxlbWVudEZpbmRlcl8xID0gcmVxdWlyZShcIi4vRWxlbWVudEZpbmRlclwiKTtcbnZhciBmcm9tRXZlbnRfMSA9IHJlcXVpcmUoXCIuL2Zyb21FdmVudFwiKTtcbnZhciBpc29sYXRlXzEgPSByZXF1aXJlKFwiLi9pc29sYXRlXCIpO1xudmFyIEV2ZW50RGVsZWdhdG9yXzEgPSByZXF1aXJlKFwiLi9FdmVudERlbGVnYXRvclwiKTtcbnZhciB1dGlsc18xID0gcmVxdWlyZShcIi4vdXRpbHNcIik7XG52YXIgZXZlbnRUeXBlc1RoYXREb250QnViYmxlID0gW1xuICAgIFwiYmx1clwiLFxuICAgIFwiY2FucGxheVwiLFxuICAgIFwiY2FucGxheXRocm91Z2hcIixcbiAgICBcImNoYW5nZVwiLFxuICAgIFwiZHVyYXRpb25jaGFuZ2VcIixcbiAgICBcImVtcHRpZWRcIixcbiAgICBcImVuZGVkXCIsXG4gICAgXCJmb2N1c1wiLFxuICAgIFwibG9hZFwiLFxuICAgIFwibG9hZGVkZGF0YVwiLFxuICAgIFwibG9hZGVkbWV0YWRhdGFcIixcbiAgICBcIm1vdXNlZW50ZXJcIixcbiAgICBcIm1vdXNlbGVhdmVcIixcbiAgICBcInBhdXNlXCIsXG4gICAgXCJwbGF5XCIsXG4gICAgXCJwbGF5aW5nXCIsXG4gICAgXCJyYXRlY2hhbmdlXCIsXG4gICAgXCJyZXNldFwiLFxuICAgIFwic2Nyb2xsXCIsXG4gICAgXCJzZWVrZWRcIixcbiAgICBcInNlZWtpbmdcIixcbiAgICBcInN0YWxsZWRcIixcbiAgICBcInN1Ym1pdFwiLFxuICAgIFwic3VzcGVuZFwiLFxuICAgIFwidGltZXVwZGF0ZVwiLFxuICAgIFwidW5sb2FkXCIsXG4gICAgXCJ2b2x1bWVjaGFuZ2VcIixcbiAgICBcIndhaXRpbmdcIixcbl07XG5mdW5jdGlvbiBkZXRlcm1pbmVVc2VDYXB0dXJlKGV2ZW50VHlwZSwgb3B0aW9ucykge1xuICAgIHZhciByZXN1bHQgPSBmYWxzZTtcbiAgICBpZiAodHlwZW9mIG9wdGlvbnMudXNlQ2FwdHVyZSA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgIHJlc3VsdCA9IG9wdGlvbnMudXNlQ2FwdHVyZTtcbiAgICB9XG4gICAgaWYgKGV2ZW50VHlwZXNUaGF0RG9udEJ1YmJsZS5pbmRleE9mKGV2ZW50VHlwZSkgIT09IC0xKSB7XG4gICAgICAgIHJlc3VsdCA9IHRydWU7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG59XG5mdW5jdGlvbiBmaWx0ZXJCYXNlZE9uSXNvbGF0aW9uKGRvbVNvdXJjZSwgZnVsbFNjb3BlKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIGZpbHRlckJhc2VkT25Jc29sYXRpb25PcGVyYXRvcihyb290RWxlbWVudCQpIHtcbiAgICAgICAgdmFyIGluaXRpYWxTdGF0ZSA9IHtcbiAgICAgICAgICAgIHdhc0lzb2xhdGVkOiBmYWxzZSxcbiAgICAgICAgICAgIHNob3VsZFBhc3M6IGZhbHNlLFxuICAgICAgICAgICAgZWxlbWVudDogbnVsbCxcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHJvb3RFbGVtZW50JFxuICAgICAgICAgICAgLmZvbGQoZnVuY3Rpb24gY2hlY2tJZlNob3VsZFBhc3Moc3RhdGUsIGVsZW1lbnQpIHtcbiAgICAgICAgICAgIHZhciBpc0lzb2xhdGVkID0gISFkb21Tb3VyY2UuX2lzb2xhdGVNb2R1bGUuZ2V0RWxlbWVudChmdWxsU2NvcGUpO1xuICAgICAgICAgICAgc3RhdGUuc2hvdWxkUGFzcyA9IGlzSXNvbGF0ZWQgJiYgIXN0YXRlLndhc0lzb2xhdGVkO1xuICAgICAgICAgICAgc3RhdGUud2FzSXNvbGF0ZWQgPSBpc0lzb2xhdGVkO1xuICAgICAgICAgICAgc3RhdGUuZWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgICAgICAgICByZXR1cm4gc3RhdGU7XG4gICAgICAgIH0sIGluaXRpYWxTdGF0ZSlcbiAgICAgICAgICAgIC5kcm9wKDEpXG4gICAgICAgICAgICAuZmlsdGVyKGZ1bmN0aW9uIChzKSB7IHJldHVybiBzLnNob3VsZFBhc3M7IH0pXG4gICAgICAgICAgICAubWFwKGZ1bmN0aW9uIChzKSB7IHJldHVybiBzLmVsZW1lbnQ7IH0pO1xuICAgIH07XG59XG52YXIgTWFpbkRPTVNvdXJjZSA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gTWFpbkRPTVNvdXJjZShfcm9vdEVsZW1lbnQkLCBfc2FuaXRhdGlvbiQsIF9uYW1lc3BhY2UsIF9pc29sYXRlTW9kdWxlLCBfZGVsZWdhdG9ycywgX25hbWUpIHtcbiAgICAgICAgaWYgKF9uYW1lc3BhY2UgPT09IHZvaWQgMCkgeyBfbmFtZXNwYWNlID0gW107IH1cbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdGhpcy5fcm9vdEVsZW1lbnQkID0gX3Jvb3RFbGVtZW50JDtcbiAgICAgICAgdGhpcy5fc2FuaXRhdGlvbiQgPSBfc2FuaXRhdGlvbiQ7XG4gICAgICAgIHRoaXMuX25hbWVzcGFjZSA9IF9uYW1lc3BhY2U7XG4gICAgICAgIHRoaXMuX2lzb2xhdGVNb2R1bGUgPSBfaXNvbGF0ZU1vZHVsZTtcbiAgICAgICAgdGhpcy5fZGVsZWdhdG9ycyA9IF9kZWxlZ2F0b3JzO1xuICAgICAgICB0aGlzLl9uYW1lID0gX25hbWU7XG4gICAgICAgIHRoaXMuaXNvbGF0ZVNvdXJjZSA9IGlzb2xhdGVfMS5pc29sYXRlU291cmNlO1xuICAgICAgICB0aGlzLmlzb2xhdGVTaW5rID0gZnVuY3Rpb24gKHNpbmssIHNjb3BlKSB7XG4gICAgICAgICAgICBpZiAoc2NvcGUgPT09ICc6cm9vdCcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc2luaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHV0aWxzXzEuaXNDbGFzc09ySWQoc2NvcGUpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGlzb2xhdGVfMS5zaWJsaW5nSXNvbGF0ZVNpbmsoc2luaywgc2NvcGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFyIHByZXZGdWxsU2NvcGUgPSB1dGlsc18xLmdldEZ1bGxTY29wZShfdGhpcy5fbmFtZXNwYWNlKTtcbiAgICAgICAgICAgICAgICB2YXIgbmV4dEZ1bGxTY29wZSA9IFtwcmV2RnVsbFNjb3BlLCBzY29wZV0uZmlsdGVyKGZ1bmN0aW9uICh4KSB7IHJldHVybiAhIXg7IH0pLmpvaW4oJy0nKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gaXNvbGF0ZV8xLnRvdGFsSXNvbGF0ZVNpbmsoc2luaywgbmV4dEZ1bGxTY29wZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuICAgIE1haW5ET01Tb3VyY2UucHJvdG90eXBlLmVsZW1lbnRzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgb3V0cHV0JDtcbiAgICAgICAgaWYgKHRoaXMuX25hbWVzcGFjZS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIG91dHB1dCQgPSB0aGlzLl9yb290RWxlbWVudCQ7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB2YXIgZWxlbWVudEZpbmRlcl8xID0gbmV3IEVsZW1lbnRGaW5kZXJfMS5FbGVtZW50RmluZGVyKHRoaXMuX25hbWVzcGFjZSwgdGhpcy5faXNvbGF0ZU1vZHVsZSk7XG4gICAgICAgICAgICBvdXRwdXQkID0gdGhpcy5fcm9vdEVsZW1lbnQkLm1hcChmdW5jdGlvbiAoZWwpIHsgcmV0dXJuIGVsZW1lbnRGaW5kZXJfMS5jYWxsKGVsKTsgfSk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIG91dCA9IGFkYXB0XzEuYWRhcHQob3V0cHV0JC5yZW1lbWJlcigpKTtcbiAgICAgICAgb3V0Ll9pc0N5Y2xlU291cmNlID0gdGhpcy5fbmFtZTtcbiAgICAgICAgcmV0dXJuIG91dDtcbiAgICB9O1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShNYWluRE9NU291cmNlLnByb3RvdHlwZSwgXCJuYW1lc3BhY2VcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9uYW1lc3BhY2U7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE1haW5ET01Tb3VyY2UucHJvdG90eXBlLnNlbGVjdCA9IGZ1bmN0aW9uIChzZWxlY3Rvcikge1xuICAgICAgICBpZiAodHlwZW9mIHNlbGVjdG9yICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRE9NIGRyaXZlcidzIHNlbGVjdCgpIGV4cGVjdHMgdGhlIGFyZ3VtZW50IHRvIGJlIGEgXCIgK1xuICAgICAgICAgICAgICAgIFwic3RyaW5nIGFzIGEgQ1NTIHNlbGVjdG9yXCIpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzZWxlY3RvciA9PT0gJ2RvY3VtZW50Jykge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBEb2N1bWVudERPTVNvdXJjZV8xLkRvY3VtZW50RE9NU291cmNlKHRoaXMuX25hbWUpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzZWxlY3RvciA9PT0gJ2JvZHknKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IEJvZHlET01Tb3VyY2VfMS5Cb2R5RE9NU291cmNlKHRoaXMuX25hbWUpO1xuICAgICAgICB9XG4gICAgICAgIHZhciB0cmltbWVkU2VsZWN0b3IgPSBzZWxlY3Rvci50cmltKCk7XG4gICAgICAgIHZhciBjaGlsZE5hbWVzcGFjZSA9IHRyaW1tZWRTZWxlY3RvciA9PT0gXCI6cm9vdFwiXG4gICAgICAgICAgICA/IHRoaXMuX25hbWVzcGFjZVxuICAgICAgICAgICAgOiB0aGlzLl9uYW1lc3BhY2UuY29uY2F0KHRyaW1tZWRTZWxlY3Rvcik7XG4gICAgICAgIHJldHVybiBuZXcgTWFpbkRPTVNvdXJjZSh0aGlzLl9yb290RWxlbWVudCQsIHRoaXMuX3Nhbml0YXRpb24kLCBjaGlsZE5hbWVzcGFjZSwgdGhpcy5faXNvbGF0ZU1vZHVsZSwgdGhpcy5fZGVsZWdhdG9ycywgdGhpcy5fbmFtZSk7XG4gICAgfTtcbiAgICBNYWluRE9NU291cmNlLnByb3RvdHlwZS5ldmVudHMgPSBmdW5jdGlvbiAoZXZlbnRUeXBlLCBvcHRpb25zKSB7XG4gICAgICAgIGlmIChvcHRpb25zID09PSB2b2lkIDApIHsgb3B0aW9ucyA9IHt9OyB9XG4gICAgICAgIGlmICh0eXBlb2YgZXZlbnRUeXBlICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJET00gZHJpdmVyJ3MgZXZlbnRzKCkgZXhwZWN0cyBhcmd1bWVudCB0byBiZSBhIFwiICtcbiAgICAgICAgICAgICAgICBcInN0cmluZyByZXByZXNlbnRpbmcgdGhlIGV2ZW50IHR5cGUgdG8gbGlzdGVuIGZvci5cIik7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHVzZUNhcHR1cmUgPSBkZXRlcm1pbmVVc2VDYXB0dXJlKGV2ZW50VHlwZSwgb3B0aW9ucyk7XG4gICAgICAgIHZhciBuYW1lc3BhY2UgPSB0aGlzLl9uYW1lc3BhY2U7XG4gICAgICAgIHZhciBmdWxsU2NvcGUgPSB1dGlsc18xLmdldEZ1bGxTY29wZShuYW1lc3BhY2UpO1xuICAgICAgICB2YXIga2V5UGFydHMgPSBbZXZlbnRUeXBlLCB1c2VDYXB0dXJlXTtcbiAgICAgICAgaWYgKGZ1bGxTY29wZSkge1xuICAgICAgICAgICAga2V5UGFydHMucHVzaChmdWxsU2NvcGUpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBrZXkgPSBrZXlQYXJ0cy5qb2luKCd+Jyk7XG4gICAgICAgIHZhciBkb21Tb3VyY2UgPSB0aGlzO1xuICAgICAgICB2YXIgcm9vdEVsZW1lbnQkO1xuICAgICAgICBpZiAoZnVsbFNjb3BlKSB7XG4gICAgICAgICAgICByb290RWxlbWVudCQgPSB0aGlzLl9yb290RWxlbWVudCQuY29tcG9zZShmaWx0ZXJCYXNlZE9uSXNvbGF0aW9uKGRvbVNvdXJjZSwgZnVsbFNjb3BlKSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByb290RWxlbWVudCQgPSB0aGlzLl9yb290RWxlbWVudCQudGFrZSgyKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgZXZlbnQkID0gcm9vdEVsZW1lbnQkXG4gICAgICAgICAgICAubWFwKGZ1bmN0aW9uIHNldHVwRXZlbnREZWxlZ2F0b3JPblRvcEVsZW1lbnQocm9vdEVsZW1lbnQpIHtcbiAgICAgICAgICAgIC8vIEV2ZW50IGxpc3RlbmVyIGp1c3QgZm9yIHRoZSByb290IGVsZW1lbnRcbiAgICAgICAgICAgIGlmICghbmFtZXNwYWNlIHx8IG5hbWVzcGFjZS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZnJvbUV2ZW50XzEuZnJvbUV2ZW50KHJvb3RFbGVtZW50LCBldmVudFR5cGUsIHVzZUNhcHR1cmUsIG9wdGlvbnMucHJldmVudERlZmF1bHQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gRXZlbnQgbGlzdGVuZXIgb24gdGhlIG9yaWdpbiBlbGVtZW50IGFzIGFuIEV2ZW50RGVsZWdhdG9yXG4gICAgICAgICAgICB2YXIgZGVsZWdhdG9ycyA9IGRvbVNvdXJjZS5fZGVsZWdhdG9ycztcbiAgICAgICAgICAgIHZhciBvcmlnaW4gPSBkb21Tb3VyY2UuX2lzb2xhdGVNb2R1bGUuZ2V0RWxlbWVudChmdWxsU2NvcGUpIHx8IHJvb3RFbGVtZW50O1xuICAgICAgICAgICAgdmFyIGRlbGVnYXRvcjtcbiAgICAgICAgICAgIGlmIChkZWxlZ2F0b3JzLmhhcyhrZXkpKSB7XG4gICAgICAgICAgICAgICAgZGVsZWdhdG9yID0gZGVsZWdhdG9ycy5nZXQoa2V5KTtcbiAgICAgICAgICAgICAgICBkZWxlZ2F0b3IudXBkYXRlT3JpZ2luKG9yaWdpbik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBkZWxlZ2F0b3IgPSBuZXcgRXZlbnREZWxlZ2F0b3JfMS5FdmVudERlbGVnYXRvcihvcmlnaW4sIGV2ZW50VHlwZSwgdXNlQ2FwdHVyZSwgZG9tU291cmNlLl9pc29sYXRlTW9kdWxlLCBvcHRpb25zLnByZXZlbnREZWZhdWx0KTtcbiAgICAgICAgICAgICAgICBkZWxlZ2F0b3JzLnNldChrZXksIGRlbGVnYXRvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZnVsbFNjb3BlKSB7XG4gICAgICAgICAgICAgICAgZG9tU291cmNlLl9pc29sYXRlTW9kdWxlLmFkZEV2ZW50RGVsZWdhdG9yKGZ1bGxTY29wZSwgZGVsZWdhdG9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBzdWJqZWN0ID0gZGVsZWdhdG9yLmNyZWF0ZURlc3RpbmF0aW9uKG5hbWVzcGFjZSk7XG4gICAgICAgICAgICByZXR1cm4gc3ViamVjdDtcbiAgICAgICAgfSlcbiAgICAgICAgICAgIC5mbGF0dGVuKCk7XG4gICAgICAgIHZhciBvdXQgPSBhZGFwdF8xLmFkYXB0KGV2ZW50JCk7XG4gICAgICAgIG91dC5faXNDeWNsZVNvdXJjZSA9IGRvbVNvdXJjZS5fbmFtZTtcbiAgICAgICAgcmV0dXJuIG91dDtcbiAgICB9O1xuICAgIE1haW5ET01Tb3VyY2UucHJvdG90eXBlLmRpc3Bvc2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuX3Nhbml0YXRpb24kLnNoYW1lZnVsbHlTZW5kTmV4dChudWxsKTtcbiAgICAgICAgdGhpcy5faXNvbGF0ZU1vZHVsZS5yZXNldCgpO1xuICAgIH07XG4gICAgcmV0dXJuIE1haW5ET01Tb3VyY2U7XG59KCkpO1xuZXhwb3J0cy5NYWluRE9NU291cmNlID0gTWFpbkRPTVNvdXJjZTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPU1haW5ET01Tb3VyY2UuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgU2NvcGVDaGVja2VyID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBTY29wZUNoZWNrZXIoZnVsbFNjb3BlLCBpc29sYXRlTW9kdWxlKSB7XG4gICAgICAgIHRoaXMuZnVsbFNjb3BlID0gZnVsbFNjb3BlO1xuICAgICAgICB0aGlzLmlzb2xhdGVNb2R1bGUgPSBpc29sYXRlTW9kdWxlO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDaGVja3Mgd2hldGhlciB0aGUgZ2l2ZW4gZWxlbWVudCBpcyAqZGlyZWN0bHkqIGluIHRoZSBzY29wZSBvZiB0aGlzXG4gICAgICogc2NvcGUgY2hlY2tlci4gQmVpbmcgY29udGFpbmVkICppbmRpcmVjdGx5KiB0aHJvdWdoIG90aGVyIHNjb3Blc1xuICAgICAqIGlzIG5vdCB2YWxpZC4gVGhpcyBpcyBjcnVjaWFsIGZvciBpbXBsZW1lbnRpbmcgcGFyZW50LWNoaWxkIGlzb2xhdGlvbixcbiAgICAgKiBzbyB0aGF0IHRoZSBwYXJlbnQgc2VsZWN0b3JzIGRvbid0IHNlYXJjaCBpbnNpZGUgYSBjaGlsZCBzY29wZS5cbiAgICAgKi9cbiAgICBTY29wZUNoZWNrZXIucHJvdG90eXBlLmlzRGlyZWN0bHlJblNjb3BlID0gZnVuY3Rpb24gKGxlYWYpIHtcbiAgICAgICAgZm9yICh2YXIgZWwgPSBsZWFmOyBlbDsgZWwgPSBlbC5wYXJlbnRFbGVtZW50KSB7XG4gICAgICAgICAgICB2YXIgZnVsbFNjb3BlID0gdGhpcy5pc29sYXRlTW9kdWxlLmdldEZ1bGxTY29wZShlbCk7XG4gICAgICAgICAgICBpZiAoZnVsbFNjb3BlICYmIGZ1bGxTY29wZSAhPT0gdGhpcy5mdWxsU2NvcGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZnVsbFNjb3BlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfTtcbiAgICByZXR1cm4gU2NvcGVDaGVja2VyO1xufSgpKTtcbmV4cG9ydHMuU2NvcGVDaGVja2VyID0gU2NvcGVDaGVja2VyO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9U2NvcGVDaGVja2VyLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHZub2RlXzEgPSByZXF1aXJlKFwic25hYmJkb20vdm5vZGVcIik7XG52YXIgaF8xID0gcmVxdWlyZShcInNuYWJiZG9tL2hcIik7XG52YXIgY2xhc3NOYW1lRnJvbVZOb2RlXzEgPSByZXF1aXJlKFwic25hYmJkb20tc2VsZWN0b3IvbGliL2NvbW1vbmpzL2NsYXNzTmFtZUZyb21WTm9kZVwiKTtcbnZhciBzZWxlY3RvclBhcnNlcl8xID0gcmVxdWlyZShcInNuYWJiZG9tLXNlbGVjdG9yL2xpYi9jb21tb25qcy9zZWxlY3RvclBhcnNlclwiKTtcbnZhciB1dGlsc18xID0gcmVxdWlyZShcIi4vdXRpbHNcIik7XG52YXIgVk5vZGVXcmFwcGVyID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBWTm9kZVdyYXBwZXIocm9vdEVsZW1lbnQpIHtcbiAgICAgICAgdGhpcy5yb290RWxlbWVudCA9IHJvb3RFbGVtZW50O1xuICAgIH1cbiAgICBWTm9kZVdyYXBwZXIucHJvdG90eXBlLmNhbGwgPSBmdW5jdGlvbiAodm5vZGUpIHtcbiAgICAgICAgaWYgKHV0aWxzXzEuaXNEb2NGcmFnKHRoaXMucm9vdEVsZW1lbnQpKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy53cmFwRG9jRnJhZyh2bm9kZSA9PT0gbnVsbCA/IFtdIDogW3Zub2RlXSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHZub2RlID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy53cmFwKFtdKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgX2EgPSBzZWxlY3RvclBhcnNlcl8xLnNlbGVjdG9yUGFyc2VyKHZub2RlKSwgc2VsVGFnTmFtZSA9IF9hLnRhZ05hbWUsIHNlbElkID0gX2EuaWQ7XG4gICAgICAgIHZhciB2Tm9kZUNsYXNzTmFtZSA9IGNsYXNzTmFtZUZyb21WTm9kZV8xLmNsYXNzTmFtZUZyb21WTm9kZSh2bm9kZSk7XG4gICAgICAgIHZhciB2Tm9kZURhdGEgPSB2bm9kZS5kYXRhIHx8IHt9O1xuICAgICAgICB2YXIgdk5vZGVEYXRhUHJvcHMgPSB2Tm9kZURhdGEucHJvcHMgfHwge307XG4gICAgICAgIHZhciBfYiA9IHZOb2RlRGF0YVByb3BzLmlkLCB2Tm9kZUlkID0gX2IgPT09IHZvaWQgMCA/IHNlbElkIDogX2I7XG4gICAgICAgIHZhciBpc1ZOb2RlQW5kUm9vdEVsZW1lbnRJZGVudGljYWwgPSB0eXBlb2Ygdk5vZGVJZCA9PT0gJ3N0cmluZycgJiZcbiAgICAgICAgICAgIHZOb2RlSWQudG9VcHBlckNhc2UoKSA9PT0gdGhpcy5yb290RWxlbWVudC5pZC50b1VwcGVyQ2FzZSgpICYmXG4gICAgICAgICAgICBzZWxUYWdOYW1lLnRvVXBwZXJDYXNlKCkgPT09IHRoaXMucm9vdEVsZW1lbnQudGFnTmFtZS50b1VwcGVyQ2FzZSgpICYmXG4gICAgICAgICAgICB2Tm9kZUNsYXNzTmFtZS50b1VwcGVyQ2FzZSgpID09PSB0aGlzLnJvb3RFbGVtZW50LmNsYXNzTmFtZS50b1VwcGVyQ2FzZSgpO1xuICAgICAgICBpZiAoaXNWTm9kZUFuZFJvb3RFbGVtZW50SWRlbnRpY2FsKSB7XG4gICAgICAgICAgICByZXR1cm4gdm5vZGU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMud3JhcChbdm5vZGVdKTtcbiAgICB9O1xuICAgIFZOb2RlV3JhcHBlci5wcm90b3R5cGUud3JhcERvY0ZyYWcgPSBmdW5jdGlvbiAoY2hpbGRyZW4pIHtcbiAgICAgICAgcmV0dXJuIHZub2RlXzEudm5vZGUoJycsIHt9LCBjaGlsZHJlbiwgdW5kZWZpbmVkLCB0aGlzLnJvb3RFbGVtZW50KTtcbiAgICB9O1xuICAgIFZOb2RlV3JhcHBlci5wcm90b3R5cGUud3JhcCA9IGZ1bmN0aW9uIChjaGlsZHJlbikge1xuICAgICAgICB2YXIgX2EgPSB0aGlzLnJvb3RFbGVtZW50LCB0YWdOYW1lID0gX2EudGFnTmFtZSwgaWQgPSBfYS5pZCwgY2xhc3NOYW1lID0gX2EuY2xhc3NOYW1lO1xuICAgICAgICB2YXIgc2VsSWQgPSBpZCA/IFwiI1wiICsgaWQgOiAnJztcbiAgICAgICAgdmFyIHNlbENsYXNzID0gY2xhc3NOYW1lID8gXCIuXCIgKyBjbGFzc05hbWUuc3BsaXQoXCIgXCIpLmpvaW4oXCIuXCIpIDogJyc7XG4gICAgICAgIHJldHVybiBoXzEuaChcIlwiICsgdGFnTmFtZS50b0xvd2VyQ2FzZSgpICsgc2VsSWQgKyBzZWxDbGFzcywge30sIGNoaWxkcmVuKTtcbiAgICB9O1xuICAgIHJldHVybiBWTm9kZVdyYXBwZXI7XG59KCkpO1xuZXhwb3J0cy5WTm9kZVdyYXBwZXIgPSBWTm9kZVdyYXBwZXI7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1WTm9kZVdyYXBwZXIuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgeHN0cmVhbV8xID0gcmVxdWlyZShcInhzdHJlYW1cIik7XG5mdW5jdGlvbiBmcm9tRXZlbnQoZWxlbWVudCwgZXZlbnROYW1lLCB1c2VDYXB0dXJlLCBwcmV2ZW50RGVmYXVsdCkge1xuICAgIGlmICh1c2VDYXB0dXJlID09PSB2b2lkIDApIHsgdXNlQ2FwdHVyZSA9IGZhbHNlOyB9XG4gICAgaWYgKHByZXZlbnREZWZhdWx0ID09PSB2b2lkIDApIHsgcHJldmVudERlZmF1bHQgPSBmYWxzZTsgfVxuICAgIHJldHVybiB4c3RyZWFtXzEuU3RyZWFtLmNyZWF0ZSh7XG4gICAgICAgIGVsZW1lbnQ6IGVsZW1lbnQsXG4gICAgICAgIG5leHQ6IG51bGwsXG4gICAgICAgIHN0YXJ0OiBmdW5jdGlvbiBzdGFydChsaXN0ZW5lcikge1xuICAgICAgICAgICAgaWYgKHByZXZlbnREZWZhdWx0KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5uZXh0ID0gZnVuY3Rpb24gbmV4dChldmVudCkge1xuICAgICAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgICBsaXN0ZW5lci5uZXh0KGV2ZW50KTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5uZXh0ID0gZnVuY3Rpb24gbmV4dChldmVudCkge1xuICAgICAgICAgICAgICAgICAgICBsaXN0ZW5lci5uZXh0KGV2ZW50KTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5lbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnROYW1lLCB0aGlzLm5leHQsIHVzZUNhcHR1cmUpO1xuICAgICAgICB9LFxuICAgICAgICBzdG9wOiBmdW5jdGlvbiBzdG9wKCkge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnROYW1lLCB0aGlzLm5leHQsIHVzZUNhcHR1cmUpO1xuICAgICAgICB9LFxuICAgIH0pO1xufVxuZXhwb3J0cy5mcm9tRXZlbnQgPSBmcm9tRXZlbnQ7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1mcm9tRXZlbnQuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG4vLyB0c2xpbnQ6ZGlzYWJsZTptYXgtZmlsZS1saW5lLWNvdW50XG52YXIgaF8xID0gcmVxdWlyZShcInNuYWJiZG9tL2hcIik7XG5mdW5jdGlvbiBpc1ZhbGlkU3RyaW5nKHBhcmFtKSB7XG4gICAgcmV0dXJuIHR5cGVvZiBwYXJhbSA9PT0gJ3N0cmluZycgJiYgcGFyYW0ubGVuZ3RoID4gMDtcbn1cbmZ1bmN0aW9uIGlzU2VsZWN0b3IocGFyYW0pIHtcbiAgICByZXR1cm4gaXNWYWxpZFN0cmluZyhwYXJhbSkgJiYgKHBhcmFtWzBdID09PSAnLicgfHwgcGFyYW1bMF0gPT09ICcjJyk7XG59XG5mdW5jdGlvbiBjcmVhdGVUYWdGdW5jdGlvbih0YWdOYW1lKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIGh5cGVyc2NyaXB0KGEsIGIsIGMpIHtcbiAgICAgICAgdmFyIGhhc0EgPSB0eXBlb2YgYSAhPT0gJ3VuZGVmaW5lZCc7XG4gICAgICAgIHZhciBoYXNCID0gdHlwZW9mIGIgIT09ICd1bmRlZmluZWQnO1xuICAgICAgICB2YXIgaGFzQyA9IHR5cGVvZiBjICE9PSAndW5kZWZpbmVkJztcbiAgICAgICAgaWYgKGlzU2VsZWN0b3IoYSkpIHtcbiAgICAgICAgICAgIGlmIChoYXNCICYmIGhhc0MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaF8xLmgodGFnTmFtZSArIGEsIGIsIGMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoaGFzQikge1xuICAgICAgICAgICAgICAgIHJldHVybiBoXzEuaCh0YWdOYW1lICsgYSwgYik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaF8xLmgodGFnTmFtZSArIGEsIHt9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChoYXNDKSB7XG4gICAgICAgICAgICByZXR1cm4gaF8xLmgodGFnTmFtZSArIGEsIGIsIGMpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGhhc0IpIHtcbiAgICAgICAgICAgIHJldHVybiBoXzEuaCh0YWdOYW1lLCBhLCBiKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChoYXNBKSB7XG4gICAgICAgICAgICByZXR1cm4gaF8xLmgodGFnTmFtZSwgYSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gaF8xLmgodGFnTmFtZSwge30pO1xuICAgICAgICB9XG4gICAgfTtcbn1cbnZhciBTVkdfVEFHX05BTUVTID0gW1xuICAgICdhJyxcbiAgICAnYWx0R2x5cGgnLFxuICAgICdhbHRHbHlwaERlZicsXG4gICAgJ2FsdEdseXBoSXRlbScsXG4gICAgJ2FuaW1hdGUnLFxuICAgICdhbmltYXRlQ29sb3InLFxuICAgICdhbmltYXRlTW90aW9uJyxcbiAgICAnYW5pbWF0ZVRyYW5zZm9ybScsXG4gICAgJ2NpcmNsZScsXG4gICAgJ2NsaXBQYXRoJyxcbiAgICAnY29sb3JQcm9maWxlJyxcbiAgICAnY3Vyc29yJyxcbiAgICAnZGVmcycsXG4gICAgJ2Rlc2MnLFxuICAgICdlbGxpcHNlJyxcbiAgICAnZmVCbGVuZCcsXG4gICAgJ2ZlQ29sb3JNYXRyaXgnLFxuICAgICdmZUNvbXBvbmVudFRyYW5zZmVyJyxcbiAgICAnZmVDb21wb3NpdGUnLFxuICAgICdmZUNvbnZvbHZlTWF0cml4JyxcbiAgICAnZmVEaWZmdXNlTGlnaHRpbmcnLFxuICAgICdmZURpc3BsYWNlbWVudE1hcCcsXG4gICAgJ2ZlRGlzdGFudExpZ2h0JyxcbiAgICAnZmVGbG9vZCcsXG4gICAgJ2ZlRnVuY0EnLFxuICAgICdmZUZ1bmNCJyxcbiAgICAnZmVGdW5jRycsXG4gICAgJ2ZlRnVuY1InLFxuICAgICdmZUdhdXNzaWFuQmx1cicsXG4gICAgJ2ZlSW1hZ2UnLFxuICAgICdmZU1lcmdlJyxcbiAgICAnZmVNZXJnZU5vZGUnLFxuICAgICdmZU1vcnBob2xvZ3knLFxuICAgICdmZU9mZnNldCcsXG4gICAgJ2ZlUG9pbnRMaWdodCcsXG4gICAgJ2ZlU3BlY3VsYXJMaWdodGluZycsXG4gICAgJ2ZlU3BvdGxpZ2h0JyxcbiAgICAnZmVUaWxlJyxcbiAgICAnZmVUdXJidWxlbmNlJyxcbiAgICAnZmlsdGVyJyxcbiAgICAnZm9udCcsXG4gICAgJ2ZvbnRGYWNlJyxcbiAgICAnZm9udEZhY2VGb3JtYXQnLFxuICAgICdmb250RmFjZU5hbWUnLFxuICAgICdmb250RmFjZVNyYycsXG4gICAgJ2ZvbnRGYWNlVXJpJyxcbiAgICAnZm9yZWlnbk9iamVjdCcsXG4gICAgJ2cnLFxuICAgICdnbHlwaCcsXG4gICAgJ2dseXBoUmVmJyxcbiAgICAnaGtlcm4nLFxuICAgICdpbWFnZScsXG4gICAgJ2xpbmUnLFxuICAgICdsaW5lYXJHcmFkaWVudCcsXG4gICAgJ21hcmtlcicsXG4gICAgJ21hc2snLFxuICAgICdtZXRhZGF0YScsXG4gICAgJ21pc3NpbmdHbHlwaCcsXG4gICAgJ21wYXRoJyxcbiAgICAncGF0aCcsXG4gICAgJ3BhdHRlcm4nLFxuICAgICdwb2x5Z29uJyxcbiAgICAncG9seWxpbmUnLFxuICAgICdyYWRpYWxHcmFkaWVudCcsXG4gICAgJ3JlY3QnLFxuICAgICdzY3JpcHQnLFxuICAgICdzZXQnLFxuICAgICdzdG9wJyxcbiAgICAnc3R5bGUnLFxuICAgICdzd2l0Y2gnLFxuICAgICdzeW1ib2wnLFxuICAgICd0ZXh0JyxcbiAgICAndGV4dFBhdGgnLFxuICAgICd0aXRsZScsXG4gICAgJ3RyZWYnLFxuICAgICd0c3BhbicsXG4gICAgJ3VzZScsXG4gICAgJ3ZpZXcnLFxuICAgICd2a2VybicsXG5dO1xudmFyIHN2ZyA9IGNyZWF0ZVRhZ0Z1bmN0aW9uKCdzdmcnKTtcblNWR19UQUdfTkFNRVMuZm9yRWFjaChmdW5jdGlvbiAodGFnKSB7XG4gICAgc3ZnW3RhZ10gPSBjcmVhdGVUYWdGdW5jdGlvbih0YWcpO1xufSk7XG52YXIgVEFHX05BTUVTID0gW1xuICAgICdhJyxcbiAgICAnYWJicicsXG4gICAgJ2FkZHJlc3MnLFxuICAgICdhcmVhJyxcbiAgICAnYXJ0aWNsZScsXG4gICAgJ2FzaWRlJyxcbiAgICAnYXVkaW8nLFxuICAgICdiJyxcbiAgICAnYmFzZScsXG4gICAgJ2JkaScsXG4gICAgJ2JkbycsXG4gICAgJ2Jsb2NrcXVvdGUnLFxuICAgICdib2R5JyxcbiAgICAnYnInLFxuICAgICdidXR0b24nLFxuICAgICdjYW52YXMnLFxuICAgICdjYXB0aW9uJyxcbiAgICAnY2l0ZScsXG4gICAgJ2NvZGUnLFxuICAgICdjb2wnLFxuICAgICdjb2xncm91cCcsXG4gICAgJ2RkJyxcbiAgICAnZGVsJyxcbiAgICAnZGZuJyxcbiAgICAnZGlyJyxcbiAgICAnZGl2JyxcbiAgICAnZGwnLFxuICAgICdkdCcsXG4gICAgJ2VtJyxcbiAgICAnZW1iZWQnLFxuICAgICdmaWVsZHNldCcsXG4gICAgJ2ZpZ2NhcHRpb24nLFxuICAgICdmaWd1cmUnLFxuICAgICdmb290ZXInLFxuICAgICdmb3JtJyxcbiAgICAnaDEnLFxuICAgICdoMicsXG4gICAgJ2gzJyxcbiAgICAnaDQnLFxuICAgICdoNScsXG4gICAgJ2g2JyxcbiAgICAnaGVhZCcsXG4gICAgJ2hlYWRlcicsXG4gICAgJ2hncm91cCcsXG4gICAgJ2hyJyxcbiAgICAnaHRtbCcsXG4gICAgJ2knLFxuICAgICdpZnJhbWUnLFxuICAgICdpbWcnLFxuICAgICdpbnB1dCcsXG4gICAgJ2lucycsXG4gICAgJ2tiZCcsXG4gICAgJ2tleWdlbicsXG4gICAgJ2xhYmVsJyxcbiAgICAnbGVnZW5kJyxcbiAgICAnbGknLFxuICAgICdsaW5rJyxcbiAgICAnbWFpbicsXG4gICAgJ21hcCcsXG4gICAgJ21hcmsnLFxuICAgICdtZW51JyxcbiAgICAnbWV0YScsXG4gICAgJ25hdicsXG4gICAgJ25vc2NyaXB0JyxcbiAgICAnb2JqZWN0JyxcbiAgICAnb2wnLFxuICAgICdvcHRncm91cCcsXG4gICAgJ29wdGlvbicsXG4gICAgJ3AnLFxuICAgICdwYXJhbScsXG4gICAgJ3ByZScsXG4gICAgJ3Byb2dyZXNzJyxcbiAgICAncScsXG4gICAgJ3JwJyxcbiAgICAncnQnLFxuICAgICdydWJ5JyxcbiAgICAncycsXG4gICAgJ3NhbXAnLFxuICAgICdzY3JpcHQnLFxuICAgICdzZWN0aW9uJyxcbiAgICAnc2VsZWN0JyxcbiAgICAnc21hbGwnLFxuICAgICdzb3VyY2UnLFxuICAgICdzcGFuJyxcbiAgICAnc3Ryb25nJyxcbiAgICAnc3R5bGUnLFxuICAgICdzdWInLFxuICAgICdzdXAnLFxuICAgICd0YWJsZScsXG4gICAgJ3Rib2R5JyxcbiAgICAndGQnLFxuICAgICd0ZXh0YXJlYScsXG4gICAgJ3Rmb290JyxcbiAgICAndGgnLFxuICAgICd0aGVhZCcsXG4gICAgJ3RpbWUnLFxuICAgICd0aXRsZScsXG4gICAgJ3RyJyxcbiAgICAndScsXG4gICAgJ3VsJyxcbiAgICAndmlkZW8nLFxuXTtcbnZhciBleHBvcnRlZCA9IHtcbiAgICBTVkdfVEFHX05BTUVTOiBTVkdfVEFHX05BTUVTLFxuICAgIFRBR19OQU1FUzogVEFHX05BTUVTLFxuICAgIHN2Zzogc3ZnLFxuICAgIGlzU2VsZWN0b3I6IGlzU2VsZWN0b3IsXG4gICAgY3JlYXRlVGFnRnVuY3Rpb246IGNyZWF0ZVRhZ0Z1bmN0aW9uLFxufTtcblRBR19OQU1FUy5mb3JFYWNoKGZ1bmN0aW9uIChuKSB7XG4gICAgZXhwb3J0ZWRbbl0gPSBjcmVhdGVUYWdGdW5jdGlvbihuKTtcbn0pO1xuZXhwb3J0cy5kZWZhdWx0ID0gZXhwb3J0ZWQ7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1oeXBlcnNjcmlwdC1oZWxwZXJzLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHRodW5rXzEgPSByZXF1aXJlKFwiLi90aHVua1wiKTtcbmV4cG9ydHMudGh1bmsgPSB0aHVua18xLnRodW5rO1xudmFyIE1haW5ET01Tb3VyY2VfMSA9IHJlcXVpcmUoXCIuL01haW5ET01Tb3VyY2VcIik7XG5leHBvcnRzLk1haW5ET01Tb3VyY2UgPSBNYWluRE9NU291cmNlXzEuTWFpbkRPTVNvdXJjZTtcbi8qKlxuICogQSBmYWN0b3J5IGZvciB0aGUgRE9NIGRyaXZlciBmdW5jdGlvbi5cbiAqXG4gKiBUYWtlcyBhIGBjb250YWluZXJgIHRvIGRlZmluZSB0aGUgdGFyZ2V0IG9uIHRoZSBleGlzdGluZyBET00gd2hpY2ggdGhpc1xuICogZHJpdmVyIHdpbGwgb3BlcmF0ZSBvbiwgYW5kIGFuIGBvcHRpb25zYCBvYmplY3QgYXMgdGhlIHNlY29uZCBhcmd1bWVudC4gVGhlXG4gKiBpbnB1dCB0byB0aGlzIGRyaXZlciBpcyBhIHN0cmVhbSBvZiB2aXJ0dWFsIERPTSBvYmplY3RzLCBvciBpbiBvdGhlciB3b3JkcyxcbiAqIFNuYWJiZG9tIFwiVk5vZGVcIiBvYmplY3RzLiBUaGUgb3V0cHV0IG9mIHRoaXMgZHJpdmVyIGlzIGEgXCJET01Tb3VyY2VcIjogYVxuICogY29sbGVjdGlvbiBvZiBPYnNlcnZhYmxlcyBxdWVyaWVkIHdpdGggdGhlIG1ldGhvZHMgYHNlbGVjdCgpYCBhbmQgYGV2ZW50cygpYC5cbiAqXG4gKiBgRE9NU291cmNlLnNlbGVjdChzZWxlY3RvcilgIHJldHVybnMgYSBuZXcgRE9NU291cmNlIHdpdGggc2NvcGUgcmVzdHJpY3RlZCB0b1xuICogdGhlIGVsZW1lbnQocykgdGhhdCBtYXRjaGVzIHRoZSBDU1MgYHNlbGVjdG9yYCBnaXZlbi5cbiAqXG4gKiBgRE9NU291cmNlLmV2ZW50cyhldmVudFR5cGUsIG9wdGlvbnMpYCByZXR1cm5zIGEgc3RyZWFtIG9mIGV2ZW50cyBvZlxuICogYGV2ZW50VHlwZWAgaGFwcGVuaW5nIG9uIHRoZSBlbGVtZW50cyB0aGF0IG1hdGNoIHRoZSBjdXJyZW50IERPTVNvdXJjZS4gVGhlXG4gKiBldmVudCBvYmplY3QgY29udGFpbnMgdGhlIGBvd25lclRhcmdldGAgcHJvcGVydHkgdGhhdCBiZWhhdmVzIGV4YWN0bHkgbGlrZVxuICogYGN1cnJlbnRUYXJnZXRgLiBUaGUgcmVhc29uIGZvciB0aGlzIGlzIHRoYXQgc29tZSBicm93c2VycyBkb2Vzbid0IGFsbG93XG4gKiBgY3VycmVudFRhcmdldGAgcHJvcGVydHkgdG8gYmUgbXV0YXRlZCwgaGVuY2UgYSBuZXcgcHJvcGVydHkgaXMgY3JlYXRlZC4gVGhlXG4gKiByZXR1cm5lZCBzdHJlYW0gaXMgYW4gKnhzdHJlYW0qIFN0cmVhbSBpZiB5b3UgdXNlIGBAY3ljbGUveHN0cmVhbS1ydW5gIHRvIHJ1blxuICogeW91ciBhcHAgd2l0aCB0aGlzIGRyaXZlciwgb3IgaXQgaXMgYW4gUnhKUyBPYnNlcnZhYmxlIGlmIHlvdSB1c2VcbiAqIGBAY3ljbGUvcnhqcy1ydW5gLCBhbmQgc28gZm9ydGguIFRoZSBgb3B0aW9uc2AgcGFyYW1ldGVyIGNhbiBoYXZlIHRoZVxuICogcHJvcGVydHkgYHVzZUNhcHR1cmVgLCB3aGljaCBpcyBieSBkZWZhdWx0IGBmYWxzZWAsIGV4Y2VwdCBpdCBpcyBgdHJ1ZWAgZm9yXG4gKiBldmVudCB0eXBlcyB0aGF0IGRvIG5vdCBidWJibGUuIFJlYWQgbW9yZSBoZXJlXG4gKiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvRXZlbnRUYXJnZXQvYWRkRXZlbnRMaXN0ZW5lclxuICogYWJvdXQgdGhlIGB1c2VDYXB0dXJlYCBhbmQgaXRzIHB1cnBvc2UuXG4gKiBUaGUgb3RoZXIgb3B0aW9uIGlzIGBwcmV2ZW50RGVmYXVsdGAgdGhhdCBpcyBzZXQgdG8gZmFsc2UgYnkgZGVmYXVsdC5cbiAqIElmIHNldCB0byB0cnVlLCB0aGUgZHJpdmVyIHdpbGwgYXV0b21hdGljYWxseSBjYWxsIGBwcmV2ZW50RGVmYXVsdCgpYCBvbiBldmVyeSBldmVudC5cbiAqXG4gKiBgRE9NU291cmNlLmVsZW1lbnRzKClgIHJldHVybnMgYSBzdHJlYW0gb2YgdGhlIERPTSBlbGVtZW50KHMpIG1hdGNoZWQgYnkgdGhlXG4gKiBzZWxlY3RvcnMgaW4gdGhlIERPTVNvdXJjZS4gQWxzbywgYERPTVNvdXJjZS5zZWxlY3QoJzpyb290JykuZWxlbWVudHMoKWBcbiAqIHJldHVybnMgYSBzdHJlYW0gb2YgRE9NIGVsZW1lbnQgY29ycmVzcG9uZGluZyB0byB0aGUgcm9vdCAob3IgY29udGFpbmVyKSBvZlxuICogdGhlIGFwcCBvbiB0aGUgRE9NLlxuICpcbiAqIEBwYXJhbSB7KFN0cmluZ3xIVE1MRWxlbWVudCl9IGNvbnRhaW5lciB0aGUgRE9NIHNlbGVjdG9yIGZvciB0aGUgZWxlbWVudFxuICogKG9yIHRoZSBlbGVtZW50IGl0c2VsZikgdG8gY29udGFpbiB0aGUgcmVuZGVyaW5nIG9mIHRoZSBWVHJlZXMuXG4gKiBAcGFyYW0ge0RPTURyaXZlck9wdGlvbnN9IG9wdGlvbnMgYW4gb2JqZWN0IHdpdGggdHdvIG9wdGlvbmFsIHByb3BlcnRpZXM6XG4gKlxuICogICAtIGBtb2R1bGVzOiBhcnJheWAgb3ZlcnJpZGVzIGBAY3ljbGUvZG9tYCdzIGRlZmF1bHQgU25hYmJkb20gbW9kdWxlcyBhc1xuICogICAgIGFzIGRlZmluZWQgaW4gW2BzcmMvbW9kdWxlcy50c2BdKC4vc3JjL21vZHVsZXMudHMpLlxuICogICAtIGB0cmFuc3Bvc2l0aW9uOiBib29sZWFuYCBlbmFibGVzL2Rpc2FibGVzIHRyYW5zcG9zaXRpb24gb2YgaW5uZXIgc3RyZWFtc1xuICogICAgIGluIHRoZSB2aXJ0dWFsIERPTSB0cmVlLlxuICogQHJldHVybiB7RnVuY3Rpb259IHRoZSBET00gZHJpdmVyIGZ1bmN0aW9uLiBUaGUgZnVuY3Rpb24gZXhwZWN0cyBhIHN0cmVhbSBvZlxuICogVk5vZGUgYXMgaW5wdXQsIGFuZCBvdXRwdXRzIHRoZSBET01Tb3VyY2Ugb2JqZWN0LlxuICogQGZ1bmN0aW9uIG1ha2VET01Ecml2ZXJcbiAqL1xudmFyIG1ha2VET01Ecml2ZXJfMSA9IHJlcXVpcmUoXCIuL21ha2VET01Ecml2ZXJcIik7XG5leHBvcnRzLm1ha2VET01Ecml2ZXIgPSBtYWtlRE9NRHJpdmVyXzEubWFrZURPTURyaXZlcjtcbi8qKlxuICogQSBmYWN0b3J5IGZ1bmN0aW9uIHRvIGNyZWF0ZSBtb2NrZWQgRE9NU291cmNlIG9iamVjdHMsIGZvciB0ZXN0aW5nIHB1cnBvc2VzLlxuICpcbiAqIFRha2VzIGEgYG1vY2tDb25maWdgIG9iamVjdCBhcyBhcmd1bWVudCwgYW5kIHJldHVybnNcbiAqIGEgRE9NU291cmNlIHRoYXQgY2FuIGJlIGdpdmVuIHRvIGFueSBDeWNsZS5qcyBhcHAgdGhhdCBleHBlY3RzIGEgRE9NU291cmNlIGluXG4gKiB0aGUgc291cmNlcywgZm9yIHRlc3RpbmcuXG4gKlxuICogVGhlIGBtb2NrQ29uZmlnYCBwYXJhbWV0ZXIgaXMgYW4gb2JqZWN0IHNwZWNpZnlpbmcgc2VsZWN0b3JzLCBldmVudFR5cGVzIGFuZFxuICogdGhlaXIgc3RyZWFtcy4gRXhhbXBsZTpcbiAqXG4gKiBgYGBqc1xuICogY29uc3QgZG9tU291cmNlID0gbW9ja0RPTVNvdXJjZSh7XG4gKiAgICcuZm9vJzoge1xuICogICAgICdjbGljayc6IHhzLm9mKHt0YXJnZXQ6IHt9fSksXG4gKiAgICAgJ21vdXNlb3Zlcic6IHhzLm9mKHt0YXJnZXQ6IHt9fSksXG4gKiAgIH0sXG4gKiAgICcuYmFyJzoge1xuICogICAgICdzY3JvbGwnOiB4cy5vZih7dGFyZ2V0OiB7fX0pLFxuICogICAgIGVsZW1lbnRzOiB4cy5vZih7dGFnTmFtZTogJ2Rpdid9KSxcbiAqICAgfVxuICogfSk7XG4gKlxuICogLy8gVXNhZ2VcbiAqIGNvbnN0IGNsaWNrJCA9IGRvbVNvdXJjZS5zZWxlY3QoJy5mb28nKS5ldmVudHMoJ2NsaWNrJyk7XG4gKiBjb25zdCBlbGVtZW50JCA9IGRvbVNvdXJjZS5zZWxlY3QoJy5iYXInKS5lbGVtZW50cygpO1xuICogYGBgXG4gKlxuICogVGhlIG1vY2tlZCBET00gU291cmNlIHN1cHBvcnRzIGlzb2xhdGlvbi4gSXQgaGFzIHRoZSBmdW5jdGlvbnMgYGlzb2xhdGVTaW5rYFxuICogYW5kIGBpc29sYXRlU291cmNlYCBhdHRhY2hlZCB0byBpdCwgYW5kIHBlcmZvcm1zIHNpbXBsZSBpc29sYXRpb24gdXNpbmdcbiAqIGNsYXNzTmFtZXMuICppc29sYXRlU2luayogd2l0aCBzY29wZSBgZm9vYCB3aWxsIGFwcGVuZCB0aGUgY2xhc3MgYF9fX2Zvb2AgdG9cbiAqIHRoZSBzdHJlYW0gb2YgdmlydHVhbCBET00gbm9kZXMsIGFuZCAqaXNvbGF0ZVNvdXJjZSogd2l0aCBzY29wZSBgZm9vYCB3aWxsXG4gKiBwZXJmb3JtIGEgY29udmVudGlvbmFsIGBtb2NrZWRET01Tb3VyY2Uuc2VsZWN0KCcuX19mb28nKWAgY2FsbC5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gbW9ja0NvbmZpZyBhbiBvYmplY3Qgd2hlcmUga2V5cyBhcmUgc2VsZWN0b3Igc3RyaW5nc1xuICogYW5kIHZhbHVlcyBhcmUgb2JqZWN0cy4gVGhvc2UgbmVzdGVkIG9iamVjdHMgaGF2ZSBgZXZlbnRUeXBlYCBzdHJpbmdzIGFzIGtleXNcbiAqIGFuZCB2YWx1ZXMgYXJlIHN0cmVhbXMgeW91IGNyZWF0ZWQuXG4gKiBAcmV0dXJuIHtPYmplY3R9IGZha2UgRE9NIHNvdXJjZSBvYmplY3QsIHdpdGggYW4gQVBJIGNvbnRhaW5pbmcgYHNlbGVjdCgpYFxuICogYW5kIGBldmVudHMoKWAgYW5kIGBlbGVtZW50cygpYCB3aGljaCBjYW4gYmUgdXNlZCBqdXN0IGxpa2UgdGhlIERPTSBEcml2ZXInc1xuICogRE9NU291cmNlLlxuICpcbiAqIEBmdW5jdGlvbiBtb2NrRE9NU291cmNlXG4gKi9cbnZhciBtb2NrRE9NU291cmNlXzEgPSByZXF1aXJlKFwiLi9tb2NrRE9NU291cmNlXCIpO1xuZXhwb3J0cy5tb2NrRE9NU291cmNlID0gbW9ja0RPTVNvdXJjZV8xLm1vY2tET01Tb3VyY2U7XG5leHBvcnRzLk1vY2tlZERPTVNvdXJjZSA9IG1vY2tET01Tb3VyY2VfMS5Nb2NrZWRET01Tb3VyY2U7XG4vKipcbiAqIFRoZSBoeXBlcnNjcmlwdCBmdW5jdGlvbiBgaCgpYCBpcyBhIGZ1bmN0aW9uIHRvIGNyZWF0ZSB2aXJ0dWFsIERPTSBvYmplY3RzLFxuICogYWxzbyBrbm93biBhcyBWTm9kZXMuIENhbGxcbiAqXG4gKiBgYGBqc1xuICogaCgnZGl2Lm15Q2xhc3MnLCB7c3R5bGU6IHtjb2xvcjogJ3JlZCd9fSwgW10pXG4gKiBgYGBcbiAqXG4gKiB0byBjcmVhdGUgYSBWTm9kZSB0aGF0IHJlcHJlc2VudHMgYSBgRElWYCBlbGVtZW50IHdpdGggY2xhc3NOYW1lIGBteUNsYXNzYCxcbiAqIHN0eWxlZCB3aXRoIHJlZCBjb2xvciwgYW5kIG5vIGNoaWxkcmVuIGJlY2F1c2UgdGhlIGBbXWAgYXJyYXkgd2FzIHBhc3NlZC4gVGhlXG4gKiBBUEkgaXMgYGgodGFnT3JTZWxlY3Rvciwgb3B0aW9uYWxEYXRhLCBvcHRpb25hbENoaWxkcmVuT3JUZXh0KWAuXG4gKlxuICogSG93ZXZlciwgdXN1YWxseSB5b3Ugc2hvdWxkIHVzZSBcImh5cGVyc2NyaXB0IGhlbHBlcnNcIiwgd2hpY2ggYXJlIHNob3J0Y3V0XG4gKiBmdW5jdGlvbnMgYmFzZWQgb24gaHlwZXJzY3JpcHQuIFRoZXJlIGlzIG9uZSBoeXBlcnNjcmlwdCBoZWxwZXIgZnVuY3Rpb24gZm9yXG4gKiBlYWNoIERPTSB0YWdOYW1lLCBzdWNoIGFzIGBoMSgpYCwgYGgyKClgLCBgZGl2KClgLCBgc3BhbigpYCwgYGxhYmVsKClgLFxuICogYGlucHV0KClgLiBGb3IgaW5zdGFuY2UsIHRoZSBwcmV2aW91cyBleGFtcGxlIGNvdWxkIGhhdmUgYmVlbiB3cml0dGVuXG4gKiBhczpcbiAqXG4gKiBgYGBqc1xuICogZGl2KCcubXlDbGFzcycsIHtzdHlsZToge2NvbG9yOiAncmVkJ319LCBbXSlcbiAqIGBgYFxuICpcbiAqIFRoZXJlIGFyZSBhbHNvIFNWRyBoZWxwZXIgZnVuY3Rpb25zLCB3aGljaCBhcHBseSB0aGUgYXBwcm9wcmlhdGUgU1ZHXG4gKiBuYW1lc3BhY2UgdG8gdGhlIHJlc3VsdGluZyBlbGVtZW50cy4gYHN2ZygpYCBmdW5jdGlvbiBjcmVhdGVzIHRoZSB0b3AtbW9zdFxuICogU1ZHIGVsZW1lbnQsIGFuZCBgc3ZnLmdgLCBgc3ZnLnBvbHlnb25gLCBgc3ZnLmNpcmNsZWAsIGBzdmcucGF0aGAgYXJlIGZvclxuICogU1ZHLXNwZWNpZmljIGNoaWxkIGVsZW1lbnRzLiBFeGFtcGxlOlxuICpcbiAqIGBgYGpzXG4gKiBzdmcoe2F0dHJzOiB7d2lkdGg6IDE1MCwgaGVpZ2h0OiAxNTB9fSwgW1xuICogICBzdmcucG9seWdvbih7XG4gKiAgICAgYXR0cnM6IHtcbiAqICAgICAgIGNsYXNzOiAndHJpYW5nbGUnLFxuICogICAgICAgcG9pbnRzOiAnMjAgMCAyMCAxNTAgMTUwIDIwJ1xuICogICAgIH1cbiAqICAgfSlcbiAqIF0pXG4gKiBgYGBcbiAqXG4gKiBAZnVuY3Rpb24gaFxuICovXG52YXIgaF8xID0gcmVxdWlyZShcInNuYWJiZG9tL2hcIik7XG5leHBvcnRzLmggPSBoXzEuaDtcbnZhciBoeXBlcnNjcmlwdF9oZWxwZXJzXzEgPSByZXF1aXJlKFwiLi9oeXBlcnNjcmlwdC1oZWxwZXJzXCIpO1xuZXhwb3J0cy5zdmcgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5zdmc7XG5leHBvcnRzLmEgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5hO1xuZXhwb3J0cy5hYmJyID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuYWJicjtcbmV4cG9ydHMuYWRkcmVzcyA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmFkZHJlc3M7XG5leHBvcnRzLmFyZWEgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5hcmVhO1xuZXhwb3J0cy5hcnRpY2xlID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuYXJ0aWNsZTtcbmV4cG9ydHMuYXNpZGUgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5hc2lkZTtcbmV4cG9ydHMuYXVkaW8gPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5hdWRpbztcbmV4cG9ydHMuYiA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmI7XG5leHBvcnRzLmJhc2UgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5iYXNlO1xuZXhwb3J0cy5iZGkgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5iZGk7XG5leHBvcnRzLmJkbyA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmJkbztcbmV4cG9ydHMuYmxvY2txdW90ZSA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmJsb2NrcXVvdGU7XG5leHBvcnRzLmJvZHkgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5ib2R5O1xuZXhwb3J0cy5iciA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmJyO1xuZXhwb3J0cy5idXR0b24gPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5idXR0b247XG5leHBvcnRzLmNhbnZhcyA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmNhbnZhcztcbmV4cG9ydHMuY2FwdGlvbiA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmNhcHRpb247XG5leHBvcnRzLmNpdGUgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5jaXRlO1xuZXhwb3J0cy5jb2RlID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuY29kZTtcbmV4cG9ydHMuY29sID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuY29sO1xuZXhwb3J0cy5jb2xncm91cCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmNvbGdyb3VwO1xuZXhwb3J0cy5kZCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmRkO1xuZXhwb3J0cy5kZWwgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5kZWw7XG5leHBvcnRzLmRmbiA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmRmbjtcbmV4cG9ydHMuZGlyID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuZGlyO1xuZXhwb3J0cy5kaXYgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5kaXY7XG5leHBvcnRzLmRsID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuZGw7XG5leHBvcnRzLmR0ID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuZHQ7XG5leHBvcnRzLmVtID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuZW07XG5leHBvcnRzLmVtYmVkID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuZW1iZWQ7XG5leHBvcnRzLmZpZWxkc2V0ID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuZmllbGRzZXQ7XG5leHBvcnRzLmZpZ2NhcHRpb24gPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5maWdjYXB0aW9uO1xuZXhwb3J0cy5maWd1cmUgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5maWd1cmU7XG5leHBvcnRzLmZvb3RlciA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmZvb3RlcjtcbmV4cG9ydHMuZm9ybSA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmZvcm07XG5leHBvcnRzLmgxID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuaDE7XG5leHBvcnRzLmgyID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuaDI7XG5leHBvcnRzLmgzID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuaDM7XG5leHBvcnRzLmg0ID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuaDQ7XG5leHBvcnRzLmg1ID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuaDU7XG5leHBvcnRzLmg2ID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuaDY7XG5leHBvcnRzLmhlYWQgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5oZWFkO1xuZXhwb3J0cy5oZWFkZXIgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5oZWFkZXI7XG5leHBvcnRzLmhncm91cCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0Lmhncm91cDtcbmV4cG9ydHMuaHIgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5ocjtcbmV4cG9ydHMuaHRtbCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0Lmh0bWw7XG5leHBvcnRzLmkgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5pO1xuZXhwb3J0cy5pZnJhbWUgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5pZnJhbWU7XG5leHBvcnRzLmltZyA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmltZztcbmV4cG9ydHMuaW5wdXQgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5pbnB1dDtcbmV4cG9ydHMuaW5zID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuaW5zO1xuZXhwb3J0cy5rYmQgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5rYmQ7XG5leHBvcnRzLmtleWdlbiA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmtleWdlbjtcbmV4cG9ydHMubGFiZWwgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5sYWJlbDtcbmV4cG9ydHMubGVnZW5kID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQubGVnZW5kO1xuZXhwb3J0cy5saSA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmxpO1xuZXhwb3J0cy5saW5rID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQubGluaztcbmV4cG9ydHMubWFpbiA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0Lm1haW47XG5leHBvcnRzLm1hcCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0Lm1hcDtcbmV4cG9ydHMubWFyayA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0Lm1hcms7XG5leHBvcnRzLm1lbnUgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5tZW51O1xuZXhwb3J0cy5tZXRhID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQubWV0YTtcbmV4cG9ydHMubmF2ID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQubmF2O1xuZXhwb3J0cy5ub3NjcmlwdCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0Lm5vc2NyaXB0O1xuZXhwb3J0cy5vYmplY3QgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5vYmplY3Q7XG5leHBvcnRzLm9sID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQub2w7XG5leHBvcnRzLm9wdGdyb3VwID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQub3B0Z3JvdXA7XG5leHBvcnRzLm9wdGlvbiA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0Lm9wdGlvbjtcbmV4cG9ydHMucCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnA7XG5leHBvcnRzLnBhcmFtID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQucGFyYW07XG5leHBvcnRzLnByZSA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnByZTtcbmV4cG9ydHMucHJvZ3Jlc3MgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5wcm9ncmVzcztcbmV4cG9ydHMucSA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnE7XG5leHBvcnRzLnJwID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQucnA7XG5leHBvcnRzLnJ0ID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQucnQ7XG5leHBvcnRzLnJ1YnkgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5ydWJ5O1xuZXhwb3J0cy5zID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQucztcbmV4cG9ydHMuc2FtcCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnNhbXA7XG5leHBvcnRzLnNjcmlwdCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnNjcmlwdDtcbmV4cG9ydHMuc2VjdGlvbiA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnNlY3Rpb247XG5leHBvcnRzLnNlbGVjdCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnNlbGVjdDtcbmV4cG9ydHMuc21hbGwgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5zbWFsbDtcbmV4cG9ydHMuc291cmNlID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuc291cmNlO1xuZXhwb3J0cy5zcGFuID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuc3BhbjtcbmV4cG9ydHMuc3Ryb25nID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuc3Ryb25nO1xuZXhwb3J0cy5zdHlsZSA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnN0eWxlO1xuZXhwb3J0cy5zdWIgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5zdWI7XG5leHBvcnRzLnN1cCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnN1cDtcbmV4cG9ydHMudGFibGUgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC50YWJsZTtcbmV4cG9ydHMudGJvZHkgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC50Ym9keTtcbmV4cG9ydHMudGQgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC50ZDtcbmV4cG9ydHMudGV4dGFyZWEgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC50ZXh0YXJlYTtcbmV4cG9ydHMudGZvb3QgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC50Zm9vdDtcbmV4cG9ydHMudGggPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC50aDtcbmV4cG9ydHMudGhlYWQgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC50aGVhZDtcbmV4cG9ydHMudGl0bGUgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC50aXRsZTtcbmV4cG9ydHMudHIgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC50cjtcbmV4cG9ydHMudSA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnU7XG5leHBvcnRzLnVsID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQudWw7XG5leHBvcnRzLnZpZGVvID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQudmlkZW87XG4vLyMgc291cmNlTWFwcGluZ1VSTD1pbmRleC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB2bm9kZV8xID0gcmVxdWlyZShcInNuYWJiZG9tL3Zub2RlXCIpO1xudmFyIHV0aWxzXzEgPSByZXF1aXJlKFwiLi91dGlsc1wiKTtcbmZ1bmN0aW9uIHRvdGFsSXNvbGF0ZVNvdXJjZShzb3VyY2UsIHNjb3BlKSB7XG4gICAgcmV0dXJuIHNvdXJjZS5zZWxlY3QodXRpbHNfMS5TQ09QRV9QUkVGSVggKyBzY29wZSk7XG59XG5mdW5jdGlvbiBzaWJsaW5nSXNvbGF0ZVNvdXJjZShzb3VyY2UsIHNjb3BlKSB7XG4gICAgcmV0dXJuIHNvdXJjZS5zZWxlY3Qoc2NvcGUpO1xufVxuZnVuY3Rpb24gaXNvbGF0ZVNvdXJjZShzb3VyY2UsIHNjb3BlKSB7XG4gICAgaWYgKHNjb3BlID09PSAnOnJvb3QnKSB7XG4gICAgICAgIHJldHVybiBzb3VyY2U7XG4gICAgfVxuICAgIGVsc2UgaWYgKHV0aWxzXzEuaXNDbGFzc09ySWQoc2NvcGUpKSB7XG4gICAgICAgIHJldHVybiBzaWJsaW5nSXNvbGF0ZVNvdXJjZShzb3VyY2UsIHNjb3BlKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHJldHVybiB0b3RhbElzb2xhdGVTb3VyY2Uoc291cmNlLCBzY29wZSk7XG4gICAgfVxufVxuZXhwb3J0cy5pc29sYXRlU291cmNlID0gaXNvbGF0ZVNvdXJjZTtcbmZ1bmN0aW9uIHNpYmxpbmdJc29sYXRlU2luayhzaW5rLCBzY29wZSkge1xuICAgIHJldHVybiBzaW5rLm1hcChmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICByZXR1cm4gbm9kZVxuICAgICAgICAgICAgPyB2bm9kZV8xLnZub2RlKG5vZGUuc2VsICsgc2NvcGUsIG5vZGUuZGF0YSwgbm9kZS5jaGlsZHJlbiwgbm9kZS50ZXh0LCBub2RlLmVsbSlcbiAgICAgICAgICAgIDogbm9kZTtcbiAgICB9KTtcbn1cbmV4cG9ydHMuc2libGluZ0lzb2xhdGVTaW5rID0gc2libGluZ0lzb2xhdGVTaW5rO1xuZnVuY3Rpb24gdG90YWxJc29sYXRlU2luayhzaW5rLCBmdWxsU2NvcGUpIHtcbiAgICByZXR1cm4gc2luay5tYXAoZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICByZXR1cm4gbm9kZTtcbiAgICAgICAgfVxuICAgICAgICAvLyBJZ25vcmUgaWYgYWxyZWFkeSBoYWQgdXAtdG8tZGF0ZSBmdWxsIHNjb3BlIGluIHZub2RlLmRhdGEuaXNvbGF0ZVxuICAgICAgICBpZiAobm9kZS5kYXRhICYmIG5vZGUuZGF0YS5pc29sYXRlKSB7XG4gICAgICAgICAgICB2YXIgaXNvbGF0ZURhdGEgPSBub2RlLmRhdGEuaXNvbGF0ZTtcbiAgICAgICAgICAgIHZhciBwcmV2RnVsbFNjb3BlTnVtID0gaXNvbGF0ZURhdGEucmVwbGFjZSgvKGN5Y2xlfFxcLSkvZywgJycpO1xuICAgICAgICAgICAgdmFyIGZ1bGxTY29wZU51bSA9IGZ1bGxTY29wZS5yZXBsYWNlKC8oY3ljbGV8XFwtKS9nLCAnJyk7XG4gICAgICAgICAgICBpZiAoaXNOYU4ocGFyc2VJbnQocHJldkZ1bGxTY29wZU51bSkpIHx8XG4gICAgICAgICAgICAgICAgaXNOYU4ocGFyc2VJbnQoZnVsbFNjb3BlTnVtKSkgfHxcbiAgICAgICAgICAgICAgICBwcmV2RnVsbFNjb3BlTnVtID4gZnVsbFNjb3BlTnVtKSB7XG4gICAgICAgICAgICAgICAgLy8gPiBpcyBsZXhpY29ncmFwaGljIHN0cmluZyBjb21wYXJpc29uXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5vZGU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gSW5zZXJ0IHVwLXRvLWRhdGUgZnVsbCBzY29wZSBpbiB2bm9kZS5kYXRhLmlzb2xhdGUsIGFuZCBhbHNvIGEga2V5IGlmIG5lZWRlZFxuICAgICAgICBub2RlLmRhdGEgPSBub2RlLmRhdGEgfHwge307XG4gICAgICAgIG5vZGUuZGF0YS5pc29sYXRlID0gZnVsbFNjb3BlO1xuICAgICAgICBpZiAodHlwZW9mIG5vZGUua2V5ID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgbm9kZS5rZXkgPSB1dGlsc18xLlNDT1BFX1BSRUZJWCArIGZ1bGxTY29wZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbm9kZTtcbiAgICB9KTtcbn1cbmV4cG9ydHMudG90YWxJc29sYXRlU2luayA9IHRvdGFsSXNvbGF0ZVNpbms7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1pc29sYXRlLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHNuYWJiZG9tXzEgPSByZXF1aXJlKFwic25hYmJkb21cIik7XG52YXIgeHN0cmVhbV8xID0gcmVxdWlyZShcInhzdHJlYW1cIik7XG52YXIgTWFpbkRPTVNvdXJjZV8xID0gcmVxdWlyZShcIi4vTWFpbkRPTVNvdXJjZVwiKTtcbnZhciB0b3Zub2RlXzEgPSByZXF1aXJlKFwic25hYmJkb20vdG92bm9kZVwiKTtcbnZhciBWTm9kZVdyYXBwZXJfMSA9IHJlcXVpcmUoXCIuL1ZOb2RlV3JhcHBlclwiKTtcbnZhciB1dGlsc18xID0gcmVxdWlyZShcIi4vdXRpbHNcIik7XG52YXIgbW9kdWxlc18xID0gcmVxdWlyZShcIi4vbW9kdWxlc1wiKTtcbnZhciBJc29sYXRlTW9kdWxlXzEgPSByZXF1aXJlKFwiLi9Jc29sYXRlTW9kdWxlXCIpO1xudmFyIE1hcFBvbHlmaWxsID0gcmVxdWlyZShcImVzNi1tYXBcIik7XG5mdW5jdGlvbiBtYWtlRE9NRHJpdmVySW5wdXRHdWFyZChtb2R1bGVzKSB7XG4gICAgaWYgKCFBcnJheS5pc0FycmF5KG1vZHVsZXMpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIk9wdGlvbmFsIG1vZHVsZXMgb3B0aW9uIG11c3QgYmUgXCIgKyBcImFuIGFycmF5IGZvciBzbmFiYmRvbSBtb2R1bGVzXCIpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGRvbURyaXZlcklucHV0R3VhcmQodmlldyQpIHtcbiAgICBpZiAoIXZpZXckIHx8XG4gICAgICAgIHR5cGVvZiB2aWV3JC5hZGRMaXN0ZW5lciAhPT0gXCJmdW5jdGlvblwiIHx8XG4gICAgICAgIHR5cGVvZiB2aWV3JC5mb2xkICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVGhlIERPTSBkcml2ZXIgZnVuY3Rpb24gZXhwZWN0cyBhcyBpbnB1dCBhIFN0cmVhbSBvZiBcIiArXG4gICAgICAgICAgICBcInZpcnR1YWwgRE9NIGVsZW1lbnRzXCIpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGRyb3BDb21wbGV0aW9uKGlucHV0KSB7XG4gICAgcmV0dXJuIHhzdHJlYW1fMS5kZWZhdWx0Lm1lcmdlKGlucHV0LCB4c3RyZWFtXzEuZGVmYXVsdC5uZXZlcigpKTtcbn1cbmZ1bmN0aW9uIHVud3JhcEVsZW1lbnRGcm9tVk5vZGUodm5vZGUpIHtcbiAgICByZXR1cm4gdm5vZGUuZWxtO1xufVxuZnVuY3Rpb24gcmVwb3J0U25hYmJkb21FcnJvcihlcnIpIHtcbiAgICAoY29uc29sZS5lcnJvciB8fCBjb25zb2xlLmxvZykoZXJyKTtcbn1cbmZ1bmN0aW9uIG1ha2VET01Ecml2ZXIoY29udGFpbmVyLCBvcHRpb25zKSB7XG4gICAgaWYgKCFvcHRpb25zKSB7XG4gICAgICAgIG9wdGlvbnMgPSB7fTtcbiAgICB9XG4gICAgdmFyIG1vZHVsZXMgPSBvcHRpb25zLm1vZHVsZXMgfHwgbW9kdWxlc18xLmRlZmF1bHQ7XG4gICAgdmFyIGlzb2xhdGVNb2R1bGUgPSBuZXcgSXNvbGF0ZU1vZHVsZV8xLklzb2xhdGVNb2R1bGUoKTtcbiAgICB2YXIgcGF0Y2ggPSBzbmFiYmRvbV8xLmluaXQoW2lzb2xhdGVNb2R1bGUuY3JlYXRlTW9kdWxlKCldLmNvbmNhdChtb2R1bGVzKSk7XG4gICAgdmFyIHJvb3RFbGVtZW50ID0gdXRpbHNfMS5nZXRWYWxpZE5vZGUoY29udGFpbmVyKSB8fCBkb2N1bWVudC5ib2R5O1xuICAgIHZhciB2bm9kZVdyYXBwZXIgPSBuZXcgVk5vZGVXcmFwcGVyXzEuVk5vZGVXcmFwcGVyKHJvb3RFbGVtZW50KTtcbiAgICB2YXIgZGVsZWdhdG9ycyA9IG5ldyBNYXBQb2x5ZmlsbCgpO1xuICAgIG1ha2VET01Ecml2ZXJJbnB1dEd1YXJkKG1vZHVsZXMpO1xuICAgIGZ1bmN0aW9uIERPTURyaXZlcih2bm9kZSQsIG5hbWUpIHtcbiAgICAgICAgaWYgKG5hbWUgPT09IHZvaWQgMCkgeyBuYW1lID0gJ0RPTSc7IH1cbiAgICAgICAgZG9tRHJpdmVySW5wdXRHdWFyZCh2bm9kZSQpO1xuICAgICAgICB2YXIgc2FuaXRhdGlvbiQgPSB4c3RyZWFtXzEuZGVmYXVsdC5jcmVhdGUoKTtcbiAgICAgICAgdmFyIHJvb3RFbGVtZW50JCA9IHhzdHJlYW1fMS5kZWZhdWx0XG4gICAgICAgICAgICAubWVyZ2Uodm5vZGUkLmVuZFdoZW4oc2FuaXRhdGlvbiQpLCBzYW5pdGF0aW9uJClcbiAgICAgICAgICAgIC5tYXAoZnVuY3Rpb24gKHZub2RlKSB7IHJldHVybiB2bm9kZVdyYXBwZXIuY2FsbCh2bm9kZSk7IH0pXG4gICAgICAgICAgICAuZm9sZChwYXRjaCwgdG92bm9kZV8xLnRvVk5vZGUocm9vdEVsZW1lbnQpKVxuICAgICAgICAgICAgLmRyb3AoMSlcbiAgICAgICAgICAgIC5tYXAodW53cmFwRWxlbWVudEZyb21WTm9kZSlcbiAgICAgICAgICAgIC5jb21wb3NlKGRyb3BDb21wbGV0aW9uKSAvLyBkb24ndCBjb21wbGV0ZSB0aGlzIHN0cmVhbVxuICAgICAgICAgICAgLnN0YXJ0V2l0aChyb290RWxlbWVudCk7XG4gICAgICAgIC8vIFN0YXJ0IHRoZSBzbmFiYmRvbSBwYXRjaGluZywgb3ZlciB0aW1lXG4gICAgICAgIHZhciBsaXN0ZW5lciA9IHsgZXJyb3I6IHJlcG9ydFNuYWJiZG9tRXJyb3IgfTtcbiAgICAgICAgaWYgKGRvY3VtZW50LnJlYWR5U3RhdGUgPT09ICdsb2FkaW5nJykge1xuICAgICAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigncmVhZHlzdGF0ZWNoYW5nZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoZG9jdW1lbnQucmVhZHlTdGF0ZSA9PT0gJ2ludGVyYWN0aXZlJykge1xuICAgICAgICAgICAgICAgICAgICByb290RWxlbWVudCQuYWRkTGlzdGVuZXIobGlzdGVuZXIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcm9vdEVsZW1lbnQkLmFkZExpc3RlbmVyKGxpc3RlbmVyKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmV3IE1haW5ET01Tb3VyY2VfMS5NYWluRE9NU291cmNlKHJvb3RFbGVtZW50JCwgc2FuaXRhdGlvbiQsIFtdLCBpc29sYXRlTW9kdWxlLCBkZWxlZ2F0b3JzLCBuYW1lKTtcbiAgICB9XG4gICAgcmV0dXJuIERPTURyaXZlcjtcbn1cbmV4cG9ydHMubWFrZURPTURyaXZlciA9IG1ha2VET01Ecml2ZXI7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1tYWtlRE9NRHJpdmVyLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZnVuY3Rpb24gY3JlYXRlTWF0Y2hlc1NlbGVjdG9yKCkge1xuICAgIHZhciB2ZW5kb3I7XG4gICAgdHJ5IHtcbiAgICAgICAgdmFyIHByb3RvID0gRWxlbWVudC5wcm90b3R5cGU7XG4gICAgICAgIHZlbmRvciA9XG4gICAgICAgICAgICBwcm90by5tYXRjaGVzIHx8XG4gICAgICAgICAgICAgICAgcHJvdG8ubWF0Y2hlc1NlbGVjdG9yIHx8XG4gICAgICAgICAgICAgICAgcHJvdG8ud2Via2l0TWF0Y2hlc1NlbGVjdG9yIHx8XG4gICAgICAgICAgICAgICAgcHJvdG8ubW96TWF0Y2hlc1NlbGVjdG9yIHx8XG4gICAgICAgICAgICAgICAgcHJvdG8ubXNNYXRjaGVzU2VsZWN0b3IgfHxcbiAgICAgICAgICAgICAgICBwcm90by5vTWF0Y2hlc1NlbGVjdG9yO1xuICAgIH1cbiAgICBjYXRjaCAoZXJyKSB7XG4gICAgICAgIHZlbmRvciA9IG51bGw7XG4gICAgfVxuICAgIHJldHVybiBmdW5jdGlvbiBtYXRjaChlbGVtLCBzZWxlY3Rvcikge1xuICAgICAgICBpZiAoc2VsZWN0b3IubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodmVuZG9yKSB7XG4gICAgICAgICAgICByZXR1cm4gdmVuZG9yLmNhbGwoZWxlbSwgc2VsZWN0b3IpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBub2RlcyA9IGVsZW0ucGFyZW50Tm9kZS5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBub2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKG5vZGVzW2ldID09PSBlbGVtKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH07XG59XG5leHBvcnRzLm1hdGNoZXNTZWxlY3RvciA9IGNyZWF0ZU1hdGNoZXNTZWxlY3RvcigpO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9bWF0Y2hlc1NlbGVjdG9yLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHhzdHJlYW1fMSA9IHJlcXVpcmUoXCJ4c3RyZWFtXCIpO1xudmFyIGFkYXB0XzEgPSByZXF1aXJlKFwiQGN5Y2xlL3J1bi9saWIvYWRhcHRcIik7XG52YXIgU0NPUEVfUFJFRklYID0gJ19fXyc7XG52YXIgTW9ja2VkRE9NU291cmNlID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBNb2NrZWRET01Tb3VyY2UoX21vY2tDb25maWcpIHtcbiAgICAgICAgdGhpcy5fbW9ja0NvbmZpZyA9IF9tb2NrQ29uZmlnO1xuICAgICAgICBpZiAoX21vY2tDb25maWdbJ2VsZW1lbnRzJ10pIHtcbiAgICAgICAgICAgIHRoaXMuX2VsZW1lbnRzID0gX21vY2tDb25maWdbJ2VsZW1lbnRzJ107XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9lbGVtZW50cyA9IGFkYXB0XzEuYWRhcHQoeHN0cmVhbV8xLmRlZmF1bHQuZW1wdHkoKSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgTW9ja2VkRE9NU291cmNlLnByb3RvdHlwZS5lbGVtZW50cyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG91dCA9IHRoaXNcbiAgICAgICAgICAgIC5fZWxlbWVudHM7XG4gICAgICAgIG91dC5faXNDeWNsZVNvdXJjZSA9ICdNb2NrZWRET00nO1xuICAgICAgICByZXR1cm4gb3V0O1xuICAgIH07XG4gICAgTW9ja2VkRE9NU291cmNlLnByb3RvdHlwZS5ldmVudHMgPSBmdW5jdGlvbiAoZXZlbnRUeXBlLCBvcHRpb25zKSB7XG4gICAgICAgIHZhciBzdHJlYW1Gb3JFdmVudFR5cGUgPSB0aGlzLl9tb2NrQ29uZmlnW2V2ZW50VHlwZV07XG4gICAgICAgIHZhciBvdXQgPSBhZGFwdF8xLmFkYXB0KHN0cmVhbUZvckV2ZW50VHlwZSB8fCB4c3RyZWFtXzEuZGVmYXVsdC5lbXB0eSgpKTtcbiAgICAgICAgb3V0Ll9pc0N5Y2xlU291cmNlID0gJ01vY2tlZERPTSc7XG4gICAgICAgIHJldHVybiBvdXQ7XG4gICAgfTtcbiAgICBNb2NrZWRET01Tb3VyY2UucHJvdG90eXBlLnNlbGVjdCA9IGZ1bmN0aW9uIChzZWxlY3Rvcikge1xuICAgICAgICB2YXIgbW9ja0NvbmZpZ0ZvclNlbGVjdG9yID0gdGhpcy5fbW9ja0NvbmZpZ1tzZWxlY3Rvcl0gfHwge307XG4gICAgICAgIHJldHVybiBuZXcgTW9ja2VkRE9NU291cmNlKG1vY2tDb25maWdGb3JTZWxlY3Rvcik7XG4gICAgfTtcbiAgICBNb2NrZWRET01Tb3VyY2UucHJvdG90eXBlLmlzb2xhdGVTb3VyY2UgPSBmdW5jdGlvbiAoc291cmNlLCBzY29wZSkge1xuICAgICAgICByZXR1cm4gc291cmNlLnNlbGVjdCgnLicgKyBTQ09QRV9QUkVGSVggKyBzY29wZSk7XG4gICAgfTtcbiAgICBNb2NrZWRET01Tb3VyY2UucHJvdG90eXBlLmlzb2xhdGVTaW5rID0gZnVuY3Rpb24gKHNpbmssIHNjb3BlKSB7XG4gICAgICAgIHJldHVybiBzaW5rLm1hcChmdW5jdGlvbiAodm5vZGUpIHtcbiAgICAgICAgICAgIGlmICh2bm9kZS5zZWwgJiYgdm5vZGUuc2VsLmluZGV4T2YoU0NPUEVfUFJFRklYICsgc2NvcGUpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB2bm9kZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHZub2RlLnNlbCArPSBcIi5cIiArIFNDT1BFX1BSRUZJWCArIHNjb3BlO1xuICAgICAgICAgICAgICAgIHJldHVybiB2bm9kZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICByZXR1cm4gTW9ja2VkRE9NU291cmNlO1xufSgpKTtcbmV4cG9ydHMuTW9ja2VkRE9NU291cmNlID0gTW9ja2VkRE9NU291cmNlO1xuZnVuY3Rpb24gbW9ja0RPTVNvdXJjZShtb2NrQ29uZmlnKSB7XG4gICAgcmV0dXJuIG5ldyBNb2NrZWRET01Tb3VyY2UobW9ja0NvbmZpZyk7XG59XG5leHBvcnRzLm1vY2tET01Tb3VyY2UgPSBtb2NrRE9NU291cmNlO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9bW9ja0RPTVNvdXJjZS5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBjbGFzc18xID0gcmVxdWlyZShcInNuYWJiZG9tL21vZHVsZXMvY2xhc3NcIik7XG5leHBvcnRzLkNsYXNzTW9kdWxlID0gY2xhc3NfMS5kZWZhdWx0O1xudmFyIHByb3BzXzEgPSByZXF1aXJlKFwic25hYmJkb20vbW9kdWxlcy9wcm9wc1wiKTtcbmV4cG9ydHMuUHJvcHNNb2R1bGUgPSBwcm9wc18xLmRlZmF1bHQ7XG52YXIgYXR0cmlidXRlc18xID0gcmVxdWlyZShcInNuYWJiZG9tL21vZHVsZXMvYXR0cmlidXRlc1wiKTtcbmV4cG9ydHMuQXR0cnNNb2R1bGUgPSBhdHRyaWJ1dGVzXzEuZGVmYXVsdDtcbnZhciBzdHlsZV8xID0gcmVxdWlyZShcInNuYWJiZG9tL21vZHVsZXMvc3R5bGVcIik7XG5leHBvcnRzLlN0eWxlTW9kdWxlID0gc3R5bGVfMS5kZWZhdWx0O1xudmFyIGRhdGFzZXRfMSA9IHJlcXVpcmUoXCJzbmFiYmRvbS9tb2R1bGVzL2RhdGFzZXRcIik7XG5leHBvcnRzLkRhdGFzZXRNb2R1bGUgPSBkYXRhc2V0XzEuZGVmYXVsdDtcbnZhciBtb2R1bGVzID0gW1xuICAgIHN0eWxlXzEuZGVmYXVsdCxcbiAgICBjbGFzc18xLmRlZmF1bHQsXG4gICAgcHJvcHNfMS5kZWZhdWx0LFxuICAgIGF0dHJpYnV0ZXNfMS5kZWZhdWx0LFxuICAgIGRhdGFzZXRfMS5kZWZhdWx0LFxuXTtcbmV4cG9ydHMuZGVmYXVsdCA9IG1vZHVsZXM7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1tb2R1bGVzLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIGhfMSA9IHJlcXVpcmUoXCJzbmFiYmRvbS9oXCIpO1xuZnVuY3Rpb24gY29weVRvVGh1bmsodm5vZGUsIHRodW5rVk5vZGUpIHtcbiAgICB0aHVua1ZOb2RlLmVsbSA9IHZub2RlLmVsbTtcbiAgICB2bm9kZS5kYXRhLmZuID0gdGh1bmtWTm9kZS5kYXRhLmZuO1xuICAgIHZub2RlLmRhdGEuYXJncyA9IHRodW5rVk5vZGUuZGF0YS5hcmdzO1xuICAgIHZub2RlLmRhdGEuaXNvbGF0ZSA9IHRodW5rVk5vZGUuZGF0YS5pc29sYXRlO1xuICAgIHRodW5rVk5vZGUuZGF0YSA9IHZub2RlLmRhdGE7XG4gICAgdGh1bmtWTm9kZS5jaGlsZHJlbiA9IHZub2RlLmNoaWxkcmVuO1xuICAgIHRodW5rVk5vZGUudGV4dCA9IHZub2RlLnRleHQ7XG4gICAgdGh1bmtWTm9kZS5lbG0gPSB2bm9kZS5lbG07XG59XG5mdW5jdGlvbiBpbml0KHRodW5rVk5vZGUpIHtcbiAgICB2YXIgY3VyID0gdGh1bmtWTm9kZS5kYXRhO1xuICAgIHZhciB2bm9kZSA9IGN1ci5mbi5hcHBseSh1bmRlZmluZWQsIGN1ci5hcmdzKTtcbiAgICBjb3B5VG9UaHVuayh2bm9kZSwgdGh1bmtWTm9kZSk7XG59XG5mdW5jdGlvbiBwcmVwYXRjaChvbGRWbm9kZSwgdGh1bmtWTm9kZSkge1xuICAgIHZhciBvbGQgPSBvbGRWbm9kZS5kYXRhLCBjdXIgPSB0aHVua1ZOb2RlLmRhdGE7XG4gICAgdmFyIGk7XG4gICAgdmFyIG9sZEFyZ3MgPSBvbGQuYXJncywgYXJncyA9IGN1ci5hcmdzO1xuICAgIGlmIChvbGQuZm4gIT09IGN1ci5mbiB8fCBvbGRBcmdzLmxlbmd0aCAhPT0gYXJncy5sZW5ndGgpIHtcbiAgICAgICAgY29weVRvVGh1bmsoY3VyLmZuLmFwcGx5KHVuZGVmaW5lZCwgYXJncyksIHRodW5rVk5vZGUpO1xuICAgIH1cbiAgICBmb3IgKGkgPSAwOyBpIDwgYXJncy5sZW5ndGg7ICsraSkge1xuICAgICAgICBpZiAob2xkQXJnc1tpXSAhPT0gYXJnc1tpXSkge1xuICAgICAgICAgICAgY29weVRvVGh1bmsoY3VyLmZuLmFwcGx5KHVuZGVmaW5lZCwgYXJncyksIHRodW5rVk5vZGUpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgfVxuICAgIGNvcHlUb1RodW5rKG9sZFZub2RlLCB0aHVua1ZOb2RlKTtcbn1cbmZ1bmN0aW9uIHRodW5rKHNlbCwga2V5LCBmbiwgYXJncykge1xuICAgIGlmIChhcmdzID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgYXJncyA9IGZuO1xuICAgICAgICBmbiA9IGtleTtcbiAgICAgICAga2V5ID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICByZXR1cm4gaF8xLmgoc2VsLCB7XG4gICAgICAgIGtleToga2V5LFxuICAgICAgICBob29rOiB7IGluaXQ6IGluaXQsIHByZXBhdGNoOiBwcmVwYXRjaCB9LFxuICAgICAgICBmbjogZm4sXG4gICAgICAgIGFyZ3M6IGFyZ3MsXG4gICAgfSk7XG59XG5leHBvcnRzLnRodW5rID0gdGh1bms7XG5leHBvcnRzLmRlZmF1bHQgPSB0aHVuaztcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXRodW5rLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZnVuY3Rpb24gaXNWYWxpZE5vZGUob2JqKSB7XG4gICAgdmFyIEVMRU1fVFlQRSA9IDE7XG4gICAgdmFyIEZSQUdfVFlQRSA9IDExO1xuICAgIHJldHVybiB0eXBlb2YgSFRNTEVsZW1lbnQgPT09ICdvYmplY3QnXG4gICAgICAgID8gb2JqIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQgfHwgb2JqIGluc3RhbmNlb2YgRG9jdW1lbnRGcmFnbWVudFxuICAgICAgICA6IG9iaiAmJlxuICAgICAgICAgICAgdHlwZW9mIG9iaiA9PT0gJ29iamVjdCcgJiZcbiAgICAgICAgICAgIG9iaiAhPT0gbnVsbCAmJlxuICAgICAgICAgICAgKG9iai5ub2RlVHlwZSA9PT0gRUxFTV9UWVBFIHx8IG9iai5ub2RlVHlwZSA9PT0gRlJBR19UWVBFKSAmJlxuICAgICAgICAgICAgdHlwZW9mIG9iai5ub2RlTmFtZSA9PT0gJ3N0cmluZyc7XG59XG5mdW5jdGlvbiBpc0NsYXNzT3JJZChzdHIpIHtcbiAgICByZXR1cm4gc3RyLmxlbmd0aCA+IDEgJiYgKHN0clswXSA9PT0gJy4nIHx8IHN0clswXSA9PT0gJyMnKTtcbn1cbmV4cG9ydHMuaXNDbGFzc09ySWQgPSBpc0NsYXNzT3JJZDtcbmZ1bmN0aW9uIGlzRG9jRnJhZyhlbCkge1xuICAgIHJldHVybiBlbC5ub2RlVHlwZSA9PT0gMTE7XG59XG5leHBvcnRzLmlzRG9jRnJhZyA9IGlzRG9jRnJhZztcbmV4cG9ydHMuU0NPUEVfUFJFRklYID0gJyQkQ1lDTEVET00kJC0nO1xuZnVuY3Rpb24gZ2V0VmFsaWROb2RlKHNlbGVjdG9ycykge1xuICAgIHZhciBkb21FbGVtZW50ID0gdHlwZW9mIHNlbGVjdG9ycyA9PT0gJ3N0cmluZydcbiAgICAgICAgPyBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHNlbGVjdG9ycylcbiAgICAgICAgOiBzZWxlY3RvcnM7XG4gICAgaWYgKHR5cGVvZiBzZWxlY3RvcnMgPT09ICdzdHJpbmcnICYmIGRvbUVsZW1lbnQgPT09IG51bGwpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IHJlbmRlciBpbnRvIHVua25vd24gZWxlbWVudCBgXCIgKyBzZWxlY3RvcnMgKyBcImBcIik7XG4gICAgfVxuICAgIGVsc2UgaWYgKCFpc1ZhbGlkTm9kZShkb21FbGVtZW50KSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0dpdmVuIGNvbnRhaW5lciBpcyBub3QgYSBET00gZWxlbWVudCBuZWl0aGVyIGEgJyArICdzZWxlY3RvciBzdHJpbmcuJyk7XG4gICAgfVxuICAgIHJldHVybiBkb21FbGVtZW50O1xufVxuZXhwb3J0cy5nZXRWYWxpZE5vZGUgPSBnZXRWYWxpZE5vZGU7XG4vKipcbiAqIFRoZSBmdWxsIHNjb3BlIG9mIGEgbmFtZXNwYWNlIGlzIHRoZSBcImFic29sdXRlIHBhdGhcIiBvZiBzY29wZXMgZnJvbVxuICogcGFyZW50IHRvIGNoaWxkLiBUaGlzIGlzIGV4dHJhY3RlZCBmcm9tIHRoZSBuYW1lc3BhY2UsIGZpbHRlciBvbmx5IGZvclxuICogc2NvcGVzIGluIHRoZSBuYW1lc3BhY2UuXG4gKi9cbmZ1bmN0aW9uIGdldEZ1bGxTY29wZShuYW1lc3BhY2UpIHtcbiAgICByZXR1cm4gbmFtZXNwYWNlXG4gICAgICAgIC5maWx0ZXIoZnVuY3Rpb24gKGMpIHsgcmV0dXJuIGMuaW5kZXhPZihleHBvcnRzLlNDT1BFX1BSRUZJWCkgPiAtMTsgfSlcbiAgICAgICAgLm1hcChmdW5jdGlvbiAoYykgeyByZXR1cm4gYy5yZXBsYWNlKGV4cG9ydHMuU0NPUEVfUFJFRklYLCAnJyk7IH0pXG4gICAgICAgIC5qb2luKCctJyk7XG59XG5leHBvcnRzLmdldEZ1bGxTY29wZSA9IGdldEZ1bGxTY29wZTtcbmZ1bmN0aW9uIGdldFNlbGVjdG9ycyhuYW1lc3BhY2UpIHtcbiAgICByZXR1cm4gbmFtZXNwYWNlLmZpbHRlcihmdW5jdGlvbiAoYykgeyByZXR1cm4gYy5pbmRleE9mKGV4cG9ydHMuU0NPUEVfUFJFRklYKSA9PT0gLTE7IH0pLmpvaW4oJyAnKTtcbn1cbmV4cG9ydHMuZ2V0U2VsZWN0b3JzID0gZ2V0U2VsZWN0b3JzO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9dXRpbHMuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgeHN0cmVhbV8xID0gcmVxdWlyZShcInhzdHJlYW1cIik7XG52YXIgQ0xJQ0tfRVZFTlQgPSB0eXBlb2YgZG9jdW1lbnQgIT09ICd1bmRlZmluZWQnICYmIGRvY3VtZW50Lm9udG91Y2hzdGFydFxuICAgID8gJ3RvdWNoc3RhcnQnXG4gICAgOiAnY2xpY2snO1xuZnVuY3Rpb24gd2hpY2goZXYpIHtcbiAgICBpZiAodHlwZW9mIHdpbmRvdyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICB2YXIgZSA9IGV2IHx8IHdpbmRvdy5ldmVudDtcbiAgICByZXR1cm4gZS53aGljaCA9PT0gbnVsbCA/IGUuYnV0dG9uIDogZS53aGljaDtcbn1cbmZ1bmN0aW9uIHNhbWVPcmlnaW4oaHJlZikge1xuICAgIGlmICh0eXBlb2Ygd2luZG93ID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiBocmVmICYmIGhyZWYuaW5kZXhPZih3aW5kb3cubG9jYXRpb24ub3JpZ2luKSA9PT0gMDtcbn1cbmZ1bmN0aW9uIG1ha2VDbGlja0xpc3RlbmVyKHB1c2gpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gY2xpY2tMaXN0ZW5lcihldmVudCkge1xuICAgICAgICBpZiAod2hpY2goZXZlbnQpICE9PSAxKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGV2ZW50Lm1ldGFLZXkgfHwgZXZlbnQuY3RybEtleSB8fCBldmVudC5zaGlmdEtleSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChldmVudC5kZWZhdWx0UHJldmVudGVkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGVsZW1lbnQgPSBldmVudC50YXJnZXQ7XG4gICAgICAgIHdoaWxlIChlbGVtZW50ICYmIGVsZW1lbnQubm9kZU5hbWUgIT09ICdBJykge1xuICAgICAgICAgICAgZWxlbWVudCA9IGVsZW1lbnQucGFyZW50Tm9kZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWVsZW1lbnQgfHwgZWxlbWVudC5ub2RlTmFtZSAhPT0gJ0EnKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGVsZW1lbnQuaGFzQXR0cmlidXRlKCdkb3dubG9hZCcpIHx8XG4gICAgICAgICAgICBlbGVtZW50LmdldEF0dHJpYnV0ZSgncmVsJykgPT09ICdleHRlcm5hbCcpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZWxlbWVudC50YXJnZXQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgbGluayA9IGVsZW1lbnQuZ2V0QXR0cmlidXRlKCdocmVmJyk7XG4gICAgICAgIGlmICgobGluayAmJiBsaW5rLmluZGV4T2YoJ21haWx0bzonKSA+IC0xKSB8fCBsaW5rLmNoYXJBdCgwKSA9PT0gJyMnKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFzYW1lT3JpZ2luKGVsZW1lbnQuaHJlZikpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB2YXIgcGF0aG5hbWUgPSBlbGVtZW50LnBhdGhuYW1lLCBzZWFyY2ggPSBlbGVtZW50LnNlYXJjaCwgX2EgPSBlbGVtZW50Lmhhc2gsIGhhc2ggPSBfYSA9PT0gdm9pZCAwID8gJycgOiBfYTtcbiAgICAgICAgcHVzaChwYXRobmFtZSArIHNlYXJjaCArIGhhc2gpO1xuICAgIH07XG59XG5mdW5jdGlvbiBjYXB0dXJlQW5jaG9yQ2xpY2tzKHB1c2gpIHtcbiAgICB2YXIgbGlzdGVuZXIgPSBtYWtlQ2xpY2tMaXN0ZW5lcihwdXNoKTtcbiAgICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihDTElDS19FVkVOVCwgbGlzdGVuZXIsIGZhbHNlKTtcbiAgICB9XG59XG5mdW5jdGlvbiBjYXB0dXJlQ2xpY2tzKGhpc3RvcnlEcml2ZXIpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gaGlzdG9yeURyaXZlcldpdGhDbGlja0NhcHR1cmUoc2luayQpIHtcbiAgICAgICAgdmFyIGludGVybmFsU2luayQgPSB4c3RyZWFtXzEuZGVmYXVsdC5jcmVhdGUoKTtcbiAgICAgICAgY2FwdHVyZUFuY2hvckNsaWNrcyhmdW5jdGlvbiAocGF0aG5hbWUpIHtcbiAgICAgICAgICAgIGludGVybmFsU2luayQuX24oeyB0eXBlOiAncHVzaCcsIHBhdGhuYW1lOiBwYXRobmFtZSB9KTtcbiAgICAgICAgfSk7XG4gICAgICAgIHNpbmskLl9hZGQoaW50ZXJuYWxTaW5rJCk7XG4gICAgICAgIHJldHVybiBoaXN0b3J5RHJpdmVyKGludGVybmFsU2luayQpO1xuICAgIH07XG59XG5leHBvcnRzLmNhcHR1cmVDbGlja3MgPSBjYXB0dXJlQ2xpY2tzO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9Y2FwdHVyZUNsaWNrcy5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB4c3RyZWFtXzEgPSByZXF1aXJlKFwieHN0cmVhbVwiKTtcbmZ1bmN0aW9uIGNyZWF0ZUhpc3RvcnkkKGhpc3RvcnksIHNpbmskKSB7XG4gICAgdmFyIGhpc3RvcnkkID0geHN0cmVhbV8xLmRlZmF1bHQuY3JlYXRlV2l0aE1lbW9yeSgpLnN0YXJ0V2l0aChoaXN0b3J5LmxvY2F0aW9uKTtcbiAgICB2YXIgY2FsbCA9IG1ha2VDYWxsT25IaXN0b3J5KGhpc3RvcnkpO1xuICAgIHZhciB1bmxpc3RlbiA9IGhpc3RvcnkubGlzdGVuKGZ1bmN0aW9uIChsb2MpIHtcbiAgICAgICAgaGlzdG9yeSQuX24obG9jKTtcbiAgICB9KTtcbiAgICB2YXIgc3ViID0gc2luayQuc3Vic2NyaWJlKGNyZWF0ZU9ic2VydmVyKGNhbGwsIHVubGlzdGVuKSk7XG4gICAgaGlzdG9yeSQuZGlzcG9zZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgc3ViLnVuc3Vic2NyaWJlKCk7XG4gICAgICAgIHVubGlzdGVuKCk7XG4gICAgfTtcbiAgICByZXR1cm4gaGlzdG9yeSQ7XG59XG5leHBvcnRzLmNyZWF0ZUhpc3RvcnkkID0gY3JlYXRlSGlzdG9yeSQ7XG5mdW5jdGlvbiBtYWtlQ2FsbE9uSGlzdG9yeShoaXN0b3J5KSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIGNhbGwoaW5wdXQpIHtcbiAgICAgICAgaWYgKGlucHV0LnR5cGUgPT09ICdwdXNoJykge1xuICAgICAgICAgICAgaGlzdG9yeS5wdXNoKGlucHV0LnBhdGhuYW1lLCBpbnB1dC5zdGF0ZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlucHV0LnR5cGUgPT09ICdyZXBsYWNlJykge1xuICAgICAgICAgICAgaGlzdG9yeS5yZXBsYWNlKGlucHV0LnBhdGhuYW1lLCBpbnB1dC5zdGF0ZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlucHV0LnR5cGUgPT09ICdnbycpIHtcbiAgICAgICAgICAgIGhpc3RvcnkuZ28oaW5wdXQuYW1vdW50KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaW5wdXQudHlwZSA9PT0gJ2dvQmFjaycpIHtcbiAgICAgICAgICAgIGhpc3RvcnkuZ29CYWNrKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlucHV0LnR5cGUgPT09ICdnb0ZvcndhcmQnKSB7XG4gICAgICAgICAgICBoaXN0b3J5LmdvRm9yd2FyZCgpO1xuICAgICAgICB9XG4gICAgfTtcbn1cbmZ1bmN0aW9uIGNyZWF0ZU9ic2VydmVyKGNhbGwsIHVubGlzdGVuKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgbmV4dDogZnVuY3Rpb24gKGlucHV0KSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGlucHV0ID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIGNhbGwoeyB0eXBlOiAncHVzaCcsIHBhdGhuYW1lOiBpbnB1dCB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGNhbGwoaW5wdXQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBlcnJvcjogZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgdW5saXN0ZW4oKTtcbiAgICAgICAgfSxcbiAgICAgICAgY29tcGxldGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHNldFRpbWVvdXQodW5saXN0ZW4pO1xuICAgICAgICB9LFxuICAgIH07XG59XG4vLyMgc291cmNlTWFwcGluZ1VSTD1jcmVhdGVIaXN0b3J5JC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBoaXN0b3J5XzEgPSByZXF1aXJlKFwiaGlzdG9yeVwiKTtcbnZhciBjcmVhdGVIaXN0b3J5XzEgPSByZXF1aXJlKFwiLi9jcmVhdGVIaXN0b3J5JFwiKTtcbmZ1bmN0aW9uIGlzSGlzdG9yeSh4KSB7XG4gICAgcmV0dXJuICEheC5jcmVhdGVIcmVmO1xufVxuZnVuY3Rpb24gbWFrZUhpc3RvcnlEcml2ZXIob3B0aW9ucykge1xuICAgIHZhciBoaXN0b3J5O1xuICAgIGlmIChvcHRpb25zICYmIGlzSGlzdG9yeShvcHRpb25zKSkge1xuICAgICAgICBoaXN0b3J5ID0gb3B0aW9ucztcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGhpc3RvcnkgPSBoaXN0b3J5XzEuY3JlYXRlQnJvd3Nlckhpc3Rvcnkob3B0aW9ucyk7XG4gICAgfVxuICAgIHJldHVybiBmdW5jdGlvbiBoaXN0b3J5RHJpdmVyKHNpbmskKSB7XG4gICAgICAgIHJldHVybiBjcmVhdGVIaXN0b3J5XzEuY3JlYXRlSGlzdG9yeSQoaGlzdG9yeSwgc2luayQpO1xuICAgIH07XG59XG5leHBvcnRzLm1ha2VIaXN0b3J5RHJpdmVyID0gbWFrZUhpc3RvcnlEcml2ZXI7XG5mdW5jdGlvbiBtYWtlU2VydmVySGlzdG9yeURyaXZlcihvcHRpb25zKSB7XG4gICAgdmFyIGhpc3RvcnkgPSBoaXN0b3J5XzEuY3JlYXRlTWVtb3J5SGlzdG9yeShvcHRpb25zKTtcbiAgICByZXR1cm4gZnVuY3Rpb24gc2VydmVySGlzdG9yeURyaXZlcihzaW5rJCkge1xuICAgICAgICByZXR1cm4gY3JlYXRlSGlzdG9yeV8xLmNyZWF0ZUhpc3RvcnkkKGhpc3RvcnksIHNpbmskKTtcbiAgICB9O1xufVxuZXhwb3J0cy5tYWtlU2VydmVySGlzdG9yeURyaXZlciA9IG1ha2VTZXJ2ZXJIaXN0b3J5RHJpdmVyO1xuZnVuY3Rpb24gbWFrZUhhc2hIaXN0b3J5RHJpdmVyKG9wdGlvbnMpIHtcbiAgICB2YXIgaGlzdG9yeSA9IGhpc3RvcnlfMS5jcmVhdGVIYXNoSGlzdG9yeShvcHRpb25zKTtcbiAgICByZXR1cm4gZnVuY3Rpb24gaGFzaEhpc3RvcnlEcml2ZXIoc2luayQpIHtcbiAgICAgICAgcmV0dXJuIGNyZWF0ZUhpc3RvcnlfMS5jcmVhdGVIaXN0b3J5JChoaXN0b3J5LCBzaW5rJCk7XG4gICAgfTtcbn1cbmV4cG9ydHMubWFrZUhhc2hIaXN0b3J5RHJpdmVyID0gbWFrZUhhc2hIaXN0b3J5RHJpdmVyO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZHJpdmVycy5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbi8qKlxuICogQ3JlYXRlIGEgSGlzdG9yeSBEcml2ZXIgdG8gYmUgdXNlZCBpbiB0aGUgYnJvd3Nlci5cbiAqXG4gKiBUaGlzIGlzIGEgZnVuY3Rpb24gd2hpY2gsIHdoZW4gY2FsbGVkLCByZXR1cm5zIGEgSGlzdG9yeSBEcml2ZXIgZm9yIEN5Y2xlLmpzXG4gKiBhcHBzLiBUaGUgZHJpdmVyIGlzIGFsc28gYSBmdW5jdGlvbiwgYW5kIGl0IHRha2VzIGEgc3RyZWFtIG9mIG5ldyBsb2NhdGlvbnNcbiAqIChzdHJpbmdzIHJlcHJlc2VudGluZyBwYXRobmFtZXMgb3IgbG9jYXRpb24gb2JqZWN0cykgYXMgaW5wdXQsIGFuZCBvdXRwdXRzXG4gKiBhbm90aGVyIHN0cmVhbSBvZiBsb2NhdGlvbnMgdGhhdCB3ZXJlIGFwcGxpZWQuIEV4YW1wbGU6XG4gKlxuICogYGBganNcbiAqIGltcG9ydCB7cnVufSBmcm9tICdAY3ljbGUvcnVuJztcbiAqIGltcG9ydCB7bWFrZUhpc3RvcnlEcml2ZXJ9IGZyb20gJ0BjeWNsZS9oaXN0b3J5JztcbiAqXG4gKiBmdW5jdGlvbiBtYWluKHNvdXJjZXMpe1xuICogICByZXR1cm4ge1xuICogICAgIC8vIHVwZGF0ZXMgdGhlIGJyb3dzZXIgVVJMIGV2ZXJ5IDUwMG1zXG4gKiAgICAgaGlzdG9yeTogeHMucGVyaW9kaWMoNTAwKS5tYXAoaSA9PiBgdXJsLSR7aX1gKVxuICogICB9O1xuICogfVxuICpcbiAqIGNvbnN0IGRyaXZlcnMgPSB7XG4gKiAgIGhpc3Rvcnk6IG1ha2VIaXN0b3J5RHJpdmVyKClcbiAqIH07XG4gKlxuICogcnVuKG1haW4sIGRyaXZlcnMpO1xuICogYGBgXG4gKlxuICogQHBhcmFtIHtvYmplY3R8SGlzdG9yeXxNZW1vcnlIaXN0b3J5fSBvcHRpb25zIGFuIG9iamVjdCB3aXRoIHNvbWUgb3B0aW9ucyBzcGVjaWZpYyB0b1xuICogdGhpcyBkcml2ZXIuIFRoZXNlIG9wdGlvbnMgYXJlIHRoZSBzYW1lIGFzIGZvciB0aGUgY29ycmVzcG9uZGluZ1xuICogYGNyZWF0ZUJyb3dzZXJIaXN0b3J5KClgIGZ1bmN0aW9uIGluIEhpc3RvcnkgdjQuIENoZWNrIGl0c1xuICogW2RvY3NdKGh0dHBzOi8vZ2l0aHViLmNvbS9tamFja3Nvbi9oaXN0b3J5L3RyZWUvdjQuNS4xI3VzYWdlKSBmb3IgYSBnb29kXG4gKiBkZXNjcmlwdGlvbiBvbiB0aGUgb3B0aW9ucy4gQWx0ZXJuYXRpdmVseSwgYSBIaXN0b3J5IG9iamVjdCBjYW4gYWxzbyBiZSBzZW50XG4gKiBpbiBjYXNlIHRoZSBleHRlcm5hbCBjb25zdW1lciBuZWVkcyBkaXJlY3QgYWNjZXNzIHRvIGFueSBvZiB0aGUgZGlyZWN0IEhpc3RvcnlcbiAqIG1ldGhvZHNcbiAqIEByZXR1cm4ge0Z1bmN0aW9ufSB0aGUgSGlzdG9yeSBEcml2ZXIgZnVuY3Rpb25cbiAqIEBmdW5jdGlvbiBtYWtlSGlzdG9yeURyaXZlclxuICovXG52YXIgZHJpdmVyc18xID0gcmVxdWlyZShcIi4vZHJpdmVyc1wiKTtcbmV4cG9ydHMubWFrZUhpc3RvcnlEcml2ZXIgPSBkcml2ZXJzXzEubWFrZUhpc3RvcnlEcml2ZXI7XG4vKipcbiAqIENyZWF0ZSBhIEhpc3RvcnkgRHJpdmVyIGZvciBvbGRlciBicm93c2VycyB1c2luZyBoYXNoIHJvdXRpbmcuXG4gKlxuICogVGhpcyBpcyBhIGZ1bmN0aW9uIHdoaWNoLCB3aGVuIGNhbGxlZCwgcmV0dXJucyBhIEhpc3RvcnkgRHJpdmVyIGZvciBDeWNsZS5qc1xuICogYXBwcy4gVGhlIGRyaXZlciBpcyBhbHNvIGEgZnVuY3Rpb24sIGFuZCBpdCB0YWtlcyBhIHN0cmVhbSBvZiBuZXcgbG9jYXRpb25zXG4gKiAoc3RyaW5ncyByZXByZXNlbnRpbmcgcGF0aG5hbWVzIG9yIGxvY2F0aW9uIG9iamVjdHMpIGFzIGlucHV0LCBhbmQgb3V0cHV0c1xuICogYW5vdGhlciBzdHJlYW0gb2YgbG9jYXRpb25zIHRoYXQgd2VyZSBhcHBsaWVkLlxuICpcbiAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIGFuIG9iamVjdCB3aXRoIHNvbWUgb3B0aW9ucyBzcGVjaWZpYyB0b1xuICogdGhpcyBkcml2ZXIuIFRoZXNlIG9wdGlvbnMgYXJlIHRoZSBzYW1lIGFzIGZvciB0aGUgY29ycmVzcG9uZGluZ1xuICogYGNyZWF0ZUhhc2hIaXN0b3J5KClgIGZ1bmN0aW9uIGluIEhpc3RvcnkgdjQuIENoZWNrIGl0c1xuICogW2RvY3NdKGh0dHBzOi8vZ2l0aHViLmNvbS9tamFja3Nvbi9oaXN0b3J5L3RyZWUvdjQuNS4xI3VzYWdlKSBmb3IgYSBnb29kXG4gKiBkZXNjcmlwdGlvbiBvbiB0aGUgb3B0aW9ucy5cbiAqIEByZXR1cm4ge0Z1bmN0aW9ufSB0aGUgSGlzdG9yeSBEcml2ZXIgZnVuY3Rpb25cbiAqIEBmdW5jdGlvbiBtYWtlSGFzaEhpc3RvcnlEcml2ZXJcbiAqL1xudmFyIGRyaXZlcnNfMiA9IHJlcXVpcmUoXCIuL2RyaXZlcnNcIik7XG5leHBvcnRzLm1ha2VIYXNoSGlzdG9yeURyaXZlciA9IGRyaXZlcnNfMi5tYWtlSGFzaEhpc3RvcnlEcml2ZXI7XG4vKipcbiAqIFdyYXBzIGEgSGlzdG9yeSBEcml2ZXIgdG8gYWRkIFwiY2xpY2sgY2FwdHVyaW5nXCIgZnVuY3Rpb25hbGl0eS5cbiAqXG4gKiBJZiB5b3Ugd2FudCB0byBpbnRlcmNlcHQgYW5kIGhhbmRsZSBhbnkgY2xpY2sgZXZlbnQgdGhhdCBsZWFkcyB0byBhIGxpbmssXG4gKiBsaWtlIG9uIGFuIGA8YT5gIGVsZW1lbnQsIHlvdSBwYXNzIHlvdXIgZXhpc3RpbmcgZHJpdmVyIChlLmcuIGNyZWF0ZWQgZnJvbVxuICogYG1ha2VIaXN0b3J5RHJpdmVyKClgKSBhcyBhcmd1bWVudCBhbmQgdGhpcyBmdW5jdGlvbiB3aWxsIHJldHVybiBhbm90aGVyXG4gKiBkcml2ZXIgb2YgdGhlIHNhbWUgbmF0dXJlLCBidXQgaW5jbHVkaW5nIGNsaWNrIGNhcHR1cmluZyBsb2dpYy4gRXhhbXBsZTpcbiAqXG4gKiBgYGBqc1xuICogaW1wb3J0IHtjYXB0dXJlQ2xpY2tzLCBtYWtlSGlzdG9yeURyaXZlcn0gZnJvbSAnQGN5Y2xlL2hpc3RvcnknO1xuICpcbiAqIGNvbnN0IGRyaXZlcnMgPSB7XG4gKiAgIGhpc3Rvcnk6IGNhcHR1cmVDbGlja3MobWFrZUhpc3RvcnlEcml2ZXIoKSlcbiAqIH07XG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBkcml2ZXIgYW4gZXhpc3RpbmcgSGlzdG9yeSBEcml2ZXIgZnVuY3Rpb24uXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn0gYSBIaXN0b3J5IERyaXZlciBmdW5jdGlvblxuICogQGZ1bmN0aW9uIGNhcHR1cmVDbGlja3NcbiAqL1xudmFyIGNhcHR1cmVDbGlja3NfMSA9IHJlcXVpcmUoXCIuL2NhcHR1cmVDbGlja3NcIik7XG5leHBvcnRzLmNhcHR1cmVDbGlja3MgPSBjYXB0dXJlQ2xpY2tzXzEuY2FwdHVyZUNsaWNrcztcbi8qKlxuICogQ3JlYXRlIGEgSGlzdG9yeSBEcml2ZXIgdG8gYmUgdXNlZCBpbiBub24tYnJvd3NlciBlbnZpcm9tZW50cyBzdWNoIGFzXG4gKiBzZXJ2ZXItc2lkZSBOb2RlLmpzLlxuICpcbiAqIFRoaXMgaXMgYSBmdW5jdGlvbiB3aGljaCwgd2hlbiBjYWxsZWQsIHJldHVybnMgYSBIaXN0b3J5IERyaXZlciBmb3IgQ3ljbGUuanNcbiAqIGFwcHMuIFRoZSBkcml2ZXIgaXMgYWxzbyBhIGZ1bmN0aW9uLCBhbmQgaXQgdGFrZXMgYSBzdHJlYW0gb2YgbmV3IGxvY2F0aW9uc1xuICogKHN0cmluZ3MgcmVwcmVzZW50aW5nIHBhdGhuYW1lcyBvciBsb2NhdGlvbiBvYmplY3RzKSBhcyBpbnB1dCwgYW5kIG91dHB1dHNcbiAqIGFub3RoZXIgc3RyZWFtIG9mIGxvY2F0aW9ucyB0aGF0IHdlcmUgYXBwbGllZC5cbiAqXG4gKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyBhbiBvYmplY3Qgd2l0aCBzb21lIG9wdGlvbnMgc3BlY2lmaWMgdG9cbiAqIHRoaXMgZHJpdmVyLiBUaGVzZSBvcHRpb25zIGFyZSB0aGUgc2FtZSBhcyBmb3IgdGhlIGNvcnJlc3BvbmRpbmdcbiAqIGBjcmVhdGVNZW1vcnlIaXN0b3J5KClgIGZ1bmN0aW9uIGluIEhpc3RvcnkgdjQuIENoZWNrIGl0c1xuICogW2RvY3NdKGh0dHBzOi8vZ2l0aHViLmNvbS9tamFja3Nvbi9oaXN0b3J5L3RyZWUvdjQuNS4xI3VzYWdlKSBmb3IgYSBnb29kXG4gKiBkZXNjcmlwdGlvbiBvbiB0aGUgb3B0aW9ucy5cbiAqIEByZXR1cm4ge0Z1bmN0aW9ufSB0aGUgSGlzdG9yeSBEcml2ZXIgZnVuY3Rpb25cbiAqIEBmdW5jdGlvbiBtYWtlU2VydmVySGlzdG9yeURyaXZlclxuICovXG52YXIgZHJpdmVyc18zID0gcmVxdWlyZShcIi4vZHJpdmVyc1wiKTtcbmV4cG9ydHMubWFrZVNlcnZlckhpc3RvcnlEcml2ZXIgPSBkcml2ZXJzXzMubWFrZVNlcnZlckhpc3RvcnlEcml2ZXI7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1pbmRleC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmZ1bmN0aW9uIGNoZWNrSXNvbGF0ZUFyZ3MoZGF0YWZsb3dDb21wb25lbnQsIHNjb3BlKSB7XG4gICAgaWYgKHR5cGVvZiBkYXRhZmxvd0NvbXBvbmVudCAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkZpcnN0IGFyZ3VtZW50IGdpdmVuIHRvIGlzb2xhdGUoKSBtdXN0IGJlIGEgXCIgK1xuICAgICAgICAgICAgXCInZGF0YWZsb3dDb21wb25lbnQnIGZ1bmN0aW9uXCIpO1xuICAgIH1cbiAgICBpZiAoc2NvcGUgPT09IG51bGwpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiU2Vjb25kIGFyZ3VtZW50IGdpdmVuIHRvIGlzb2xhdGUoKSBtdXN0IG5vdCBiZSBudWxsXCIpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIG5vcm1hbGl6ZVNjb3Blcyhzb3VyY2VzLCBzY29wZXMsIHJhbmRvbVNjb3BlKSB7XG4gICAgdmFyIHBlckNoYW5uZWwgPSB7fTtcbiAgICBPYmplY3Qua2V5cyhzb3VyY2VzKS5mb3JFYWNoKGZ1bmN0aW9uIChjaGFubmVsKSB7XG4gICAgICAgIGlmICh0eXBlb2Ygc2NvcGVzID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgcGVyQ2hhbm5lbFtjaGFubmVsXSA9IHNjb3BlcztcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgY2FuZGlkYXRlID0gc2NvcGVzW2NoYW5uZWxdO1xuICAgICAgICBpZiAodHlwZW9mIGNhbmRpZGF0ZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHBlckNoYW5uZWxbY2hhbm5lbF0gPSBjYW5kaWRhdGU7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHdpbGRjYXJkID0gc2NvcGVzWycqJ107XG4gICAgICAgIGlmICh0eXBlb2Ygd2lsZGNhcmQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBwZXJDaGFubmVsW2NoYW5uZWxdID0gd2lsZGNhcmQ7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgcGVyQ2hhbm5lbFtjaGFubmVsXSA9IHJhbmRvbVNjb3BlO1xuICAgIH0pO1xuICAgIHJldHVybiBwZXJDaGFubmVsO1xufVxuZnVuY3Rpb24gaXNvbGF0ZUFsbFNvdXJjZXMob3V0ZXJTb3VyY2VzLCBzY29wZXMpIHtcbiAgICB2YXIgaW5uZXJTb3VyY2VzID0ge307XG4gICAgZm9yICh2YXIgY2hhbm5lbCBpbiBvdXRlclNvdXJjZXMpIHtcbiAgICAgICAgdmFyIG91dGVyU291cmNlID0gb3V0ZXJTb3VyY2VzW2NoYW5uZWxdO1xuICAgICAgICBpZiAob3V0ZXJTb3VyY2VzLmhhc093blByb3BlcnR5KGNoYW5uZWwpICYmXG4gICAgICAgICAgICBvdXRlclNvdXJjZSAmJlxuICAgICAgICAgICAgc2NvcGVzW2NoYW5uZWxdICE9PSBudWxsICYmXG4gICAgICAgICAgICB0eXBlb2Ygb3V0ZXJTb3VyY2UuaXNvbGF0ZVNvdXJjZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgaW5uZXJTb3VyY2VzW2NoYW5uZWxdID0gb3V0ZXJTb3VyY2UuaXNvbGF0ZVNvdXJjZShvdXRlclNvdXJjZSwgc2NvcGVzW2NoYW5uZWxdKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChvdXRlclNvdXJjZXMuaGFzT3duUHJvcGVydHkoY2hhbm5lbCkpIHtcbiAgICAgICAgICAgIGlubmVyU291cmNlc1tjaGFubmVsXSA9IG91dGVyU291cmNlc1tjaGFubmVsXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gaW5uZXJTb3VyY2VzO1xufVxuZnVuY3Rpb24gaXNvbGF0ZUFsbFNpbmtzKHNvdXJjZXMsIGlubmVyU2lua3MsIHNjb3Blcykge1xuICAgIHZhciBvdXRlclNpbmtzID0ge307XG4gICAgZm9yICh2YXIgY2hhbm5lbCBpbiBpbm5lclNpbmtzKSB7XG4gICAgICAgIHZhciBzb3VyY2UgPSBzb3VyY2VzW2NoYW5uZWxdO1xuICAgICAgICB2YXIgaW5uZXJTaW5rID0gaW5uZXJTaW5rc1tjaGFubmVsXTtcbiAgICAgICAgaWYgKGlubmVyU2lua3MuaGFzT3duUHJvcGVydHkoY2hhbm5lbCkgJiZcbiAgICAgICAgICAgIHNvdXJjZSAmJlxuICAgICAgICAgICAgc2NvcGVzW2NoYW5uZWxdICE9PSBudWxsICYmXG4gICAgICAgICAgICB0eXBlb2Ygc291cmNlLmlzb2xhdGVTaW5rID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBvdXRlclNpbmtzW2NoYW5uZWxdID0gc291cmNlLmlzb2xhdGVTaW5rKGlubmVyU2luaywgc2NvcGVzW2NoYW5uZWxdKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChpbm5lclNpbmtzLmhhc093blByb3BlcnR5KGNoYW5uZWwpKSB7XG4gICAgICAgICAgICBvdXRlclNpbmtzW2NoYW5uZWxdID0gaW5uZXJTaW5rc1tjaGFubmVsXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gb3V0ZXJTaW5rcztcbn1cbnZhciBjb3VudGVyID0gMDtcbmZ1bmN0aW9uIG5ld1Njb3BlKCkge1xuICAgIHJldHVybiBcImN5Y2xlXCIgKyArK2NvdW50ZXI7XG59XG4vKipcbiAqIFRha2VzIGEgYGNvbXBvbmVudGAgZnVuY3Rpb24gYW5kIGEgYHNjb3BlYCwgYW5kIHJldHVybnMgYW4gaXNvbGF0ZWQgdmVyc2lvblxuICogb2YgdGhlIGBjb21wb25lbnRgIGZ1bmN0aW9uLlxuICpcbiAqIFdoZW4gdGhlIGlzb2xhdGVkIGNvbXBvbmVudCBpcyBpbnZva2VkLCBlYWNoIHNvdXJjZSBwcm92aWRlZCB0byBpdCBpc1xuICogaXNvbGF0ZWQgdG8gdGhlIGdpdmVuIGBzY29wZWAgdXNpbmcgYHNvdXJjZS5pc29sYXRlU291cmNlKHNvdXJjZSwgc2NvcGUpYCxcbiAqIGlmIHBvc3NpYmxlLiBMaWtld2lzZSwgdGhlIHNpbmtzIHJldHVybmVkIGZyb20gdGhlIGlzb2xhdGVkIGNvbXBvbmVudCBhcmVcbiAqIGlzb2xhdGVkIHRvIHRoZSBnaXZlbiBgc2NvcGVgIHVzaW5nIGBzb3VyY2UuaXNvbGF0ZVNpbmsoc2luaywgc2NvcGUpYC5cbiAqXG4gKiBUaGUgYHNjb3BlYCBjYW4gYmUgYSBzdHJpbmcgb3IgYW4gb2JqZWN0LiBJZiBpdCBpcyBhbnl0aGluZyBlbHNlIHRoYW4gdGhvc2VcbiAqIHR3byB0eXBlcywgaXQgd2lsbCBiZSBjb252ZXJ0ZWQgdG8gYSBzdHJpbmcuIElmIGBzY29wZWAgaXMgYW4gb2JqZWN0LCBpdFxuICogcmVwcmVzZW50cyBcInNjb3BlcyBwZXIgY2hhbm5lbFwiLCBhbGxvd2luZyB5b3UgdG8gc3BlY2lmeSBhIGRpZmZlcmVudCBzY29wZVxuICogZm9yIGVhY2gga2V5IG9mIHNvdXJjZXMvc2lua3MuIEZvciBpbnN0YW5jZVxuICpcbiAqIGBgYGpzXG4gKiBjb25zdCBjaGlsZFNpbmtzID0gaXNvbGF0ZShDaGlsZCwge0RPTTogJ2ZvbycsIEhUVFA6ICdiYXInfSkoc291cmNlcyk7XG4gKiBgYGBcbiAqXG4gKiBZb3UgY2FuIGFsc28gdXNlIGEgd2lsZGNhcmQgYCcqJ2AgdG8gdXNlIGFzIGEgZGVmYXVsdCBmb3Igc291cmNlL3NpbmtzXG4gKiBjaGFubmVscyB0aGF0IGRpZCBub3QgcmVjZWl2ZSBhIHNwZWNpZmljIHNjb3BlOlxuICpcbiAqIGBgYGpzXG4gKiAvLyBVc2VzICdiYXInIGFzIHRoZSBpc29sYXRpb24gc2NvcGUgZm9yIEhUVFAgYW5kIG90aGVyIGNoYW5uZWxzXG4gKiBjb25zdCBjaGlsZFNpbmtzID0gaXNvbGF0ZShDaGlsZCwge0RPTTogJ2ZvbycsICcqJzogJ2Jhcid9KShzb3VyY2VzKTtcbiAqIGBgYFxuICpcbiAqIElmIGEgY2hhbm5lbCdzIHZhbHVlIGlzIG51bGwsIHRoZW4gdGhhdCBjaGFubmVsJ3Mgc291cmNlcyBhbmQgc2lua3Mgd29uJ3QgYmVcbiAqIGlzb2xhdGVkLiBJZiB0aGUgd2lsZGNhcmQgaXMgbnVsbCBhbmQgc29tZSBjaGFubmVscyBhcmUgdW5zcGVjaWZpZWQsIHRob3NlXG4gKiBjaGFubmVscyB3b24ndCBiZSBpc29sYXRlZC4gSWYgeW91IGRvbid0IGhhdmUgYSB3aWxkY2FyZCBhbmQgc29tZSBjaGFubmVsc1xuICogYXJlIHVuc3BlY2lmaWVkLCB0aGVuIGBpc29sYXRlYCB3aWxsIGdlbmVyYXRlIGEgcmFuZG9tIHNjb3BlLlxuICpcbiAqIGBgYGpzXG4gKiAvLyBEb2VzIG5vdCBpc29sYXRlIEhUVFAgcmVxdWVzdHNcbiAqIGNvbnN0IGNoaWxkU2lua3MgPSBpc29sYXRlKENoaWxkLCB7RE9NOiAnZm9vJywgSFRUUDogbnVsbH0pKHNvdXJjZXMpO1xuICogYGBgXG4gKlxuICogSWYgdGhlIGBzY29wZWAgYXJndW1lbnQgaXMgbm90IHByb3ZpZGVkIGF0IGFsbCwgYSBuZXcgc2NvcGUgd2lsbCBiZVxuICogYXV0b21hdGljYWxseSBjcmVhdGVkLiBUaGlzIG1lYW5zIHRoYXQgd2hpbGUgKipgaXNvbGF0ZShjb21wb25lbnQsIHNjb3BlKWAgaXNcbiAqIHB1cmUqKiAocmVmZXJlbnRpYWxseSB0cmFuc3BhcmVudCksICoqYGlzb2xhdGUoY29tcG9uZW50KWAgaXMgaW1wdXJlKiogKG5vdFxuICogcmVmZXJlbnRpYWxseSB0cmFuc3BhcmVudCkuIFR3byBjYWxscyB0byBgaXNvbGF0ZShGb28sIGJhcilgIHdpbGwgZ2VuZXJhdGVcbiAqIHRoZSBzYW1lIGNvbXBvbmVudC4gQnV0LCB0d28gY2FsbHMgdG8gYGlzb2xhdGUoRm9vKWAgd2lsbCBnZW5lcmF0ZSB0d29cbiAqIGRpc3RpbmN0IGNvbXBvbmVudHMuXG4gKlxuICogYGBganNcbiAqIC8vIFVzZXMgc29tZSBhcmJpdHJhcnkgc3RyaW5nIGFzIHRoZSBpc29sYXRpb24gc2NvcGUgZm9yIEhUVFAgYW5kIG90aGVyIGNoYW5uZWxzXG4gKiBjb25zdCBjaGlsZFNpbmtzID0gaXNvbGF0ZShDaGlsZCwge0RPTTogJ2Zvbyd9KShzb3VyY2VzKTtcbiAqIGBgYFxuICpcbiAqIE5vdGUgdGhhdCBib3RoIGBpc29sYXRlU291cmNlKClgIGFuZCBgaXNvbGF0ZVNpbmsoKWAgYXJlIHN0YXRpYyBtZW1iZXJzIG9mXG4gKiBgc291cmNlYC4gVGhlIHJlYXNvbiBmb3IgdGhpcyBpcyB0aGF0IGRyaXZlcnMgcHJvZHVjZSBgc291cmNlYCB3aGlsZSB0aGVcbiAqIGFwcGxpY2F0aW9uIHByb2R1Y2VzIGBzaW5rYCwgYW5kIGl0J3MgdGhlIGRyaXZlcidzIHJlc3BvbnNpYmlsaXR5IHRvXG4gKiBpbXBsZW1lbnQgYGlzb2xhdGVTb3VyY2UoKWAgYW5kIGBpc29sYXRlU2luaygpYC5cbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjb21wb25lbnQgYSBmdW5jdGlvbiB0aGF0IHRha2VzIGBzb3VyY2VzYCBhcyBpbnB1dFxuICogYW5kIG91dHB1dHMgYSBjb2xsZWN0aW9uIG9mIGBzaW5rc2AuXG4gKiBAcGFyYW0ge1N0cmluZ30gc2NvcGUgYW4gb3B0aW9uYWwgc3RyaW5nIHRoYXQgaXMgdXNlZCB0byBpc29sYXRlIGVhY2hcbiAqIGBzb3VyY2VzYCBhbmQgYHNpbmtzYCB3aGVuIHRoZSByZXR1cm5lZCBzY29wZWQgY29tcG9uZW50IGlzIGludm9rZWQuXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn0gdGhlIHNjb3BlZCBjb21wb25lbnQgZnVuY3Rpb24gdGhhdCwgYXMgdGhlIG9yaWdpbmFsXG4gKiBgY29tcG9uZW50YCBmdW5jdGlvbiwgdGFrZXMgYHNvdXJjZXNgIGFuZCByZXR1cm5zIGBzaW5rc2AuXG4gKiBAZnVuY3Rpb24gaXNvbGF0ZVxuICovXG5mdW5jdGlvbiBpc29sYXRlKGNvbXBvbmVudCwgc2NvcGUpIHtcbiAgICBpZiAoc2NvcGUgPT09IHZvaWQgMCkgeyBzY29wZSA9IG5ld1Njb3BlKCk7IH1cbiAgICBjaGVja0lzb2xhdGVBcmdzKGNvbXBvbmVudCwgc2NvcGUpO1xuICAgIHZhciByYW5kb21TY29wZSA9IHR5cGVvZiBzY29wZSA9PT0gJ29iamVjdCcgPyBuZXdTY29wZSgpIDogJyc7XG4gICAgdmFyIHNjb3BlcyA9IHR5cGVvZiBzY29wZSA9PT0gJ3N0cmluZycgfHwgdHlwZW9mIHNjb3BlID09PSAnb2JqZWN0J1xuICAgICAgICA/IHNjb3BlXG4gICAgICAgIDogc2NvcGUudG9TdHJpbmcoKTtcbiAgICByZXR1cm4gZnVuY3Rpb24gd3JhcHBlZENvbXBvbmVudChvdXRlclNvdXJjZXMpIHtcbiAgICAgICAgdmFyIHJlc3QgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgX2kgPSAxOyBfaSA8IGFyZ3VtZW50cy5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgICAgIHJlc3RbX2kgLSAxXSA9IGFyZ3VtZW50c1tfaV07XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHNjb3Blc1BlckNoYW5uZWwgPSBub3JtYWxpemVTY29wZXMob3V0ZXJTb3VyY2VzLCBzY29wZXMsIHJhbmRvbVNjb3BlKTtcbiAgICAgICAgdmFyIGlubmVyU291cmNlcyA9IGlzb2xhdGVBbGxTb3VyY2VzKG91dGVyU291cmNlcywgc2NvcGVzUGVyQ2hhbm5lbCk7XG4gICAgICAgIHZhciBpbm5lclNpbmtzID0gY29tcG9uZW50LmFwcGx5KHZvaWQgMCwgW2lubmVyU291cmNlc10uY29uY2F0KHJlc3QpKTtcbiAgICAgICAgdmFyIG91dGVyU2lua3MgPSBpc29sYXRlQWxsU2lua3Mob3V0ZXJTb3VyY2VzLCBpbm5lclNpbmtzLCBzY29wZXNQZXJDaGFubmVsKTtcbiAgICAgICAgcmV0dXJuIG91dGVyU2lua3M7XG4gICAgfTtcbn1cbmlzb2xhdGUucmVzZXQgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAoY291bnRlciA9IDApOyB9O1xuZXhwb3J0cy5kZWZhdWx0ID0gaXNvbGF0ZTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWluZGV4LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIGFkYXB0U3RyZWFtID0gZnVuY3Rpb24gKHgpIHsgcmV0dXJuIHg7IH07XG5mdW5jdGlvbiBzZXRBZGFwdChmKSB7XG4gICAgYWRhcHRTdHJlYW0gPSBmO1xufVxuZXhwb3J0cy5zZXRBZGFwdCA9IHNldEFkYXB0O1xuZnVuY3Rpb24gYWRhcHQoc3RyZWFtKSB7XG4gICAgcmV0dXJuIGFkYXB0U3RyZWFtKHN0cmVhbSk7XG59XG5leHBvcnRzLmFkYXB0ID0gYWRhcHQ7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1hZGFwdC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB4c3RyZWFtXzEgPSByZXF1aXJlKFwieHN0cmVhbVwiKTtcbnZhciBhZGFwdF8xID0gcmVxdWlyZShcIi4vYWRhcHRcIik7XG5mdW5jdGlvbiBsb2dUb0NvbnNvbGVFcnJvcihlcnIpIHtcbiAgICB2YXIgdGFyZ2V0ID0gZXJyLnN0YWNrIHx8IGVycjtcbiAgICBpZiAoY29uc29sZSAmJiBjb25zb2xlLmVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IodGFyZ2V0KTtcbiAgICB9XG4gICAgZWxzZSBpZiAoY29uc29sZSAmJiBjb25zb2xlLmxvZykge1xuICAgICAgICBjb25zb2xlLmxvZyh0YXJnZXQpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIG1ha2VTaW5rUHJveGllcyhkcml2ZXJzKSB7XG4gICAgdmFyIHNpbmtQcm94aWVzID0ge307XG4gICAgZm9yICh2YXIgbmFtZV8xIGluIGRyaXZlcnMpIHtcbiAgICAgICAgaWYgKGRyaXZlcnMuaGFzT3duUHJvcGVydHkobmFtZV8xKSkge1xuICAgICAgICAgICAgc2lua1Byb3hpZXNbbmFtZV8xXSA9IHhzdHJlYW1fMS5kZWZhdWx0LmNyZWF0ZVdpdGhNZW1vcnkoKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gc2lua1Byb3hpZXM7XG59XG5mdW5jdGlvbiBjYWxsRHJpdmVycyhkcml2ZXJzLCBzaW5rUHJveGllcykge1xuICAgIHZhciBzb3VyY2VzID0ge307XG4gICAgZm9yICh2YXIgbmFtZV8yIGluIGRyaXZlcnMpIHtcbiAgICAgICAgaWYgKGRyaXZlcnMuaGFzT3duUHJvcGVydHkobmFtZV8yKSkge1xuICAgICAgICAgICAgc291cmNlc1tuYW1lXzJdID0gZHJpdmVyc1tuYW1lXzJdKHNpbmtQcm94aWVzW25hbWVfMl0sIG5hbWVfMik7XG4gICAgICAgICAgICBpZiAoc291cmNlc1tuYW1lXzJdICYmIHR5cGVvZiBzb3VyY2VzW25hbWVfMl0gPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgc291cmNlc1tuYW1lXzJdLl9pc0N5Y2xlU291cmNlID0gbmFtZV8yO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBzb3VyY2VzO1xufVxuLy8gTk9URTogdGhpcyB3aWxsIG11dGF0ZSBgc291cmNlc2AuXG5mdW5jdGlvbiBhZGFwdFNvdXJjZXMoc291cmNlcykge1xuICAgIGZvciAodmFyIG5hbWVfMyBpbiBzb3VyY2VzKSB7XG4gICAgICAgIGlmIChzb3VyY2VzLmhhc093blByb3BlcnR5KG5hbWVfMykgJiZcbiAgICAgICAgICAgIHNvdXJjZXNbbmFtZV8zXSAmJlxuICAgICAgICAgICAgdHlwZW9mIHNvdXJjZXNbbmFtZV8zXVsnc2hhbWVmdWxseVNlbmROZXh0J10gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHNvdXJjZXNbbmFtZV8zXSA9IGFkYXB0XzEuYWRhcHQoc291cmNlc1tuYW1lXzNdKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gc291cmNlcztcbn1cbmZ1bmN0aW9uIHJlcGxpY2F0ZU1hbnkoc2lua3MsIHNpbmtQcm94aWVzKSB7XG4gICAgdmFyIHNpbmtOYW1lcyA9IE9iamVjdC5rZXlzKHNpbmtzKS5maWx0ZXIoZnVuY3Rpb24gKG5hbWUpIHsgcmV0dXJuICEhc2lua1Byb3hpZXNbbmFtZV07IH0pO1xuICAgIHZhciBidWZmZXJzID0ge307XG4gICAgdmFyIHJlcGxpY2F0b3JzID0ge307XG4gICAgc2lua05hbWVzLmZvckVhY2goZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgYnVmZmVyc1tuYW1lXSA9IHsgX246IFtdLCBfZTogW10gfTtcbiAgICAgICAgcmVwbGljYXRvcnNbbmFtZV0gPSB7XG4gICAgICAgICAgICBuZXh0OiBmdW5jdGlvbiAoeCkgeyByZXR1cm4gYnVmZmVyc1tuYW1lXS5fbi5wdXNoKHgpOyB9LFxuICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uIChlcnIpIHsgcmV0dXJuIGJ1ZmZlcnNbbmFtZV0uX2UucHVzaChlcnIpOyB9LFxuICAgICAgICAgICAgY29tcGxldGU6IGZ1bmN0aW9uICgpIHsgfSxcbiAgICAgICAgfTtcbiAgICB9KTtcbiAgICB2YXIgc3Vic2NyaXB0aW9ucyA9IHNpbmtOYW1lcy5tYXAoZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgcmV0dXJuIHhzdHJlYW1fMS5kZWZhdWx0LmZyb21PYnNlcnZhYmxlKHNpbmtzW25hbWVdKS5zdWJzY3JpYmUocmVwbGljYXRvcnNbbmFtZV0pO1xuICAgIH0pO1xuICAgIHNpbmtOYW1lcy5mb3JFYWNoKGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgIHZhciBsaXN0ZW5lciA9IHNpbmtQcm94aWVzW25hbWVdO1xuICAgICAgICB2YXIgbmV4dCA9IGZ1bmN0aW9uICh4KSB7XG4gICAgICAgICAgICBsaXN0ZW5lci5fbih4KTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIGVycm9yID0gZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgbG9nVG9Db25zb2xlRXJyb3IoZXJyKTtcbiAgICAgICAgICAgIGxpc3RlbmVyLl9lKGVycik7XG4gICAgICAgIH07XG4gICAgICAgIGJ1ZmZlcnNbbmFtZV0uX24uZm9yRWFjaChuZXh0KTtcbiAgICAgICAgYnVmZmVyc1tuYW1lXS5fZS5mb3JFYWNoKGVycm9yKTtcbiAgICAgICAgcmVwbGljYXRvcnNbbmFtZV0ubmV4dCA9IG5leHQ7XG4gICAgICAgIHJlcGxpY2F0b3JzW25hbWVdLmVycm9yID0gZXJyb3I7XG4gICAgICAgIC8vIGJlY2F1c2Ugc2luay5zdWJzY3JpYmUocmVwbGljYXRvcikgaGFkIG11dGF0ZWQgcmVwbGljYXRvciB0byBhZGRcbiAgICAgICAgLy8gX24sIF9lLCBfYywgd2UgbXVzdCBhbHNvIHVwZGF0ZSB0aGVzZTpcbiAgICAgICAgcmVwbGljYXRvcnNbbmFtZV0uX24gPSBuZXh0O1xuICAgICAgICByZXBsaWNhdG9yc1tuYW1lXS5fZSA9IGVycm9yO1xuICAgIH0pO1xuICAgIGJ1ZmZlcnMgPSBudWxsOyAvLyBmcmVlIHVwIGZvciBHQ1xuICAgIHJldHVybiBmdW5jdGlvbiBkaXNwb3NlUmVwbGljYXRpb24oKSB7XG4gICAgICAgIHN1YnNjcmlwdGlvbnMuZm9yRWFjaChmdW5jdGlvbiAocykgeyByZXR1cm4gcy51bnN1YnNjcmliZSgpOyB9KTtcbiAgICAgICAgc2lua05hbWVzLmZvckVhY2goZnVuY3Rpb24gKG5hbWUpIHsgcmV0dXJuIHNpbmtQcm94aWVzW25hbWVdLl9jKCk7IH0pO1xuICAgIH07XG59XG5mdW5jdGlvbiBkaXNwb3NlU291cmNlcyhzb3VyY2VzKSB7XG4gICAgZm9yICh2YXIgayBpbiBzb3VyY2VzKSB7XG4gICAgICAgIGlmIChzb3VyY2VzLmhhc093blByb3BlcnR5KGspICYmXG4gICAgICAgICAgICBzb3VyY2VzW2tdICYmXG4gICAgICAgICAgICBzb3VyY2VzW2tdLmRpc3Bvc2UpIHtcbiAgICAgICAgICAgIHNvdXJjZXNba10uZGlzcG9zZSgpO1xuICAgICAgICB9XG4gICAgfVxufVxuZnVuY3Rpb24gaXNPYmplY3RFbXB0eShvYmopIHtcbiAgICByZXR1cm4gT2JqZWN0LmtleXMob2JqKS5sZW5ndGggPT09IDA7XG59XG4vKipcbiAqIEEgZnVuY3Rpb24gdGhhdCBwcmVwYXJlcyB0aGUgQ3ljbGUgYXBwbGljYXRpb24gdG8gYmUgZXhlY3V0ZWQuIFRha2VzIGEgYG1haW5gXG4gKiBmdW5jdGlvbiBhbmQgcHJlcGFyZXMgdG8gY2lyY3VsYXJseSBjb25uZWN0cyBpdCB0byB0aGUgZ2l2ZW4gY29sbGVjdGlvbiBvZlxuICogZHJpdmVyIGZ1bmN0aW9ucy4gQXMgYW4gb3V0cHV0LCBgc2V0dXAoKWAgcmV0dXJucyBhbiBvYmplY3Qgd2l0aCB0aHJlZVxuICogcHJvcGVydGllczogYHNvdXJjZXNgLCBgc2lua3NgIGFuZCBgcnVuYC4gT25seSB3aGVuIGBydW4oKWAgaXMgY2FsbGVkIHdpbGxcbiAqIHRoZSBhcHBsaWNhdGlvbiBhY3R1YWxseSBleGVjdXRlLiBSZWZlciB0byB0aGUgZG9jdW1lbnRhdGlvbiBvZiBgcnVuKClgIGZvclxuICogbW9yZSBkZXRhaWxzLlxuICpcbiAqICoqRXhhbXBsZToqKlxuICogYGBganNcbiAqIGltcG9ydCB7c2V0dXB9IGZyb20gJ0BjeWNsZS9ydW4nO1xuICogY29uc3Qge3NvdXJjZXMsIHNpbmtzLCBydW59ID0gc2V0dXAobWFpbiwgZHJpdmVycyk7XG4gKiAvLyAuLi5cbiAqIGNvbnN0IGRpc3Bvc2UgPSBydW4oKTsgLy8gRXhlY3V0ZXMgdGhlIGFwcGxpY2F0aW9uXG4gKiAvLyAuLi5cbiAqIGRpc3Bvc2UoKTtcbiAqIGBgYFxuICpcbiAqIEBwYXJhbSB7RnVuY3Rpb259IG1haW4gYSBmdW5jdGlvbiB0aGF0IHRha2VzIGBzb3VyY2VzYCBhcyBpbnB1dCBhbmQgb3V0cHV0c1xuICogYHNpbmtzYC5cbiAqIEBwYXJhbSB7T2JqZWN0fSBkcml2ZXJzIGFuIG9iamVjdCB3aGVyZSBrZXlzIGFyZSBkcml2ZXIgbmFtZXMgYW5kIHZhbHVlc1xuICogYXJlIGRyaXZlciBmdW5jdGlvbnMuXG4gKiBAcmV0dXJuIHtPYmplY3R9IGFuIG9iamVjdCB3aXRoIHRocmVlIHByb3BlcnRpZXM6IGBzb3VyY2VzYCwgYHNpbmtzYCBhbmRcbiAqIGBydW5gLiBgc291cmNlc2AgaXMgdGhlIGNvbGxlY3Rpb24gb2YgZHJpdmVyIHNvdXJjZXMsIGBzaW5rc2AgaXMgdGhlXG4gKiBjb2xsZWN0aW9uIG9mIGRyaXZlciBzaW5rcywgdGhlc2UgY2FuIGJlIHVzZWQgZm9yIGRlYnVnZ2luZyBvciB0ZXN0aW5nLiBgcnVuYFxuICogaXMgdGhlIGZ1bmN0aW9uIHRoYXQgb25jZSBjYWxsZWQgd2lsbCBleGVjdXRlIHRoZSBhcHBsaWNhdGlvbi5cbiAqIEBmdW5jdGlvbiBzZXR1cFxuICovXG5mdW5jdGlvbiBzZXR1cChtYWluLCBkcml2ZXJzKSB7XG4gICAgaWYgKHR5cGVvZiBtYWluICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRmlyc3QgYXJndW1lbnQgZ2l2ZW4gdG8gQ3ljbGUgbXVzdCBiZSB0aGUgJ21haW4nIFwiICsgXCJmdW5jdGlvbi5cIik7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgZHJpdmVycyAhPT0gXCJvYmplY3RcIiB8fCBkcml2ZXJzID09PSBudWxsKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlNlY29uZCBhcmd1bWVudCBnaXZlbiB0byBDeWNsZSBtdXN0IGJlIGFuIG9iamVjdCBcIiArXG4gICAgICAgICAgICBcIndpdGggZHJpdmVyIGZ1bmN0aW9ucyBhcyBwcm9wZXJ0aWVzLlwiKTtcbiAgICB9XG4gICAgaWYgKGlzT2JqZWN0RW1wdHkoZHJpdmVycykpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiU2Vjb25kIGFyZ3VtZW50IGdpdmVuIHRvIEN5Y2xlIG11c3QgYmUgYW4gb2JqZWN0IFwiICtcbiAgICAgICAgICAgIFwid2l0aCBhdCBsZWFzdCBvbmUgZHJpdmVyIGZ1bmN0aW9uIGRlY2xhcmVkIGFzIGEgcHJvcGVydHkuXCIpO1xuICAgIH1cbiAgICB2YXIgc2lua1Byb3hpZXMgPSBtYWtlU2lua1Byb3hpZXMoZHJpdmVycyk7XG4gICAgdmFyIHNvdXJjZXMgPSBjYWxsRHJpdmVycyhkcml2ZXJzLCBzaW5rUHJveGllcyk7XG4gICAgdmFyIGFkYXB0ZWRTb3VyY2VzID0gYWRhcHRTb3VyY2VzKHNvdXJjZXMpO1xuICAgIHZhciBzaW5rcyA9IG1haW4oYWRhcHRlZFNvdXJjZXMpO1xuICAgIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICB3aW5kb3cuQ3ljbGVqcyA9IHdpbmRvdy5DeWNsZWpzIHx8IHt9O1xuICAgICAgICB3aW5kb3cuQ3ljbGVqcy5zaW5rcyA9IHNpbmtzO1xuICAgIH1cbiAgICBmdW5jdGlvbiBfcnVuKCkge1xuICAgICAgICB2YXIgZGlzcG9zZVJlcGxpY2F0aW9uID0gcmVwbGljYXRlTWFueShzaW5rcywgc2lua1Byb3hpZXMpO1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gZGlzcG9zZSgpIHtcbiAgICAgICAgICAgIGRpc3Bvc2VTb3VyY2VzKHNvdXJjZXMpO1xuICAgICAgICAgICAgZGlzcG9zZVJlcGxpY2F0aW9uKCk7XG4gICAgICAgIH07XG4gICAgfVxuICAgIHJldHVybiB7IHNpbmtzOiBzaW5rcywgc291cmNlczogc291cmNlcywgcnVuOiBfcnVuIH07XG59XG5leHBvcnRzLnNldHVwID0gc2V0dXA7XG4vKipcbiAqIFRha2VzIGEgYG1haW5gIGZ1bmN0aW9uIGFuZCBjaXJjdWxhcmx5IGNvbm5lY3RzIGl0IHRvIHRoZSBnaXZlbiBjb2xsZWN0aW9uXG4gKiBvZiBkcml2ZXIgZnVuY3Rpb25zLlxuICpcbiAqICoqRXhhbXBsZToqKlxuICogYGBganNcbiAqIGltcG9ydCBydW4gZnJvbSAnQGN5Y2xlL3J1bic7XG4gKiBjb25zdCBkaXNwb3NlID0gcnVuKG1haW4sIGRyaXZlcnMpO1xuICogLy8gLi4uXG4gKiBkaXNwb3NlKCk7XG4gKiBgYGBcbiAqXG4gKiBUaGUgYG1haW5gIGZ1bmN0aW9uIGV4cGVjdHMgYSBjb2xsZWN0aW9uIG9mIFwic291cmNlXCIgc3RyZWFtcyAocmV0dXJuZWQgZnJvbVxuICogZHJpdmVycykgYXMgaW5wdXQsIGFuZCBzaG91bGQgcmV0dXJuIGEgY29sbGVjdGlvbiBvZiBcInNpbmtcIiBzdHJlYW1zICh0byBiZVxuICogZ2l2ZW4gdG8gZHJpdmVycykuIEEgXCJjb2xsZWN0aW9uIG9mIHN0cmVhbXNcIiBpcyBhIEphdmFTY3JpcHQgb2JqZWN0IHdoZXJlXG4gKiBrZXlzIG1hdGNoIHRoZSBkcml2ZXIgbmFtZXMgcmVnaXN0ZXJlZCBieSB0aGUgYGRyaXZlcnNgIG9iamVjdCwgYW5kIHZhbHVlc1xuICogYXJlIHRoZSBzdHJlYW1zLiBSZWZlciB0byB0aGUgZG9jdW1lbnRhdGlvbiBvZiBlYWNoIGRyaXZlciB0byBzZWUgbW9yZVxuICogZGV0YWlscyBvbiB3aGF0IHR5cGVzIG9mIHNvdXJjZXMgaXQgb3V0cHV0cyBhbmQgc2lua3MgaXQgcmVjZWl2ZXMuXG4gKlxuICogQHBhcmFtIHtGdW5jdGlvbn0gbWFpbiBhIGZ1bmN0aW9uIHRoYXQgdGFrZXMgYHNvdXJjZXNgIGFzIGlucHV0IGFuZCBvdXRwdXRzXG4gKiBgc2lua3NgLlxuICogQHBhcmFtIHtPYmplY3R9IGRyaXZlcnMgYW4gb2JqZWN0IHdoZXJlIGtleXMgYXJlIGRyaXZlciBuYW1lcyBhbmQgdmFsdWVzXG4gKiBhcmUgZHJpdmVyIGZ1bmN0aW9ucy5cbiAqIEByZXR1cm4ge0Z1bmN0aW9ufSBhIGRpc3Bvc2UgZnVuY3Rpb24sIHVzZWQgdG8gdGVybWluYXRlIHRoZSBleGVjdXRpb24gb2YgdGhlXG4gKiBDeWNsZS5qcyBwcm9ncmFtLCBjbGVhbmluZyB1cCByZXNvdXJjZXMgdXNlZC5cbiAqIEBmdW5jdGlvbiBydW5cbiAqL1xuZnVuY3Rpb24gcnVuKG1haW4sIGRyaXZlcnMpIHtcbiAgICB2YXIgcHJvZ3JhbSA9IHNldHVwKG1haW4sIGRyaXZlcnMpO1xuICAgIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJlxuICAgICAgICB3aW5kb3dbJ0N5Y2xlanNEZXZUb29sX3N0YXJ0R3JhcGhTZXJpYWxpemVyJ10pIHtcbiAgICAgICAgd2luZG93WydDeWNsZWpzRGV2VG9vbF9zdGFydEdyYXBoU2VyaWFsaXplciddKHByb2dyYW0uc2lua3MpO1xuICAgIH1cbiAgICByZXR1cm4gcHJvZ3JhbS5ydW4oKTtcbn1cbmV4cG9ydHMucnVuID0gcnVuO1xuZXhwb3J0cy5kZWZhdWx0ID0gcnVuO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aW5kZXguanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgd3JpdGVUb1N0b3JlXzEgPSByZXF1aXJlKFwiLi93cml0ZVRvU3RvcmVcIik7XG52YXIgcmVzcG9uc2VDb2xsZWN0aW9uXzEgPSByZXF1aXJlKFwiLi9yZXNwb25zZUNvbGxlY3Rpb25cIik7XG4vKipcbiAqIFN0b3JhZ2UgRHJpdmVyLlxuICpcbiAqIFRoaXMgaXMgYSBsb2NhbFN0b3JhZ2UgYW5kIHNlc3Npb25TdG9yYWdlIERyaXZlciBmb3IgQ3ljbGUuanMgYXBwcy4gVGhlXG4gKiBkcml2ZXIgaXMgYWxzbyBhIGZ1bmN0aW9uLCBhbmQgaXQgdGFrZXMgYSBzdHJlYW0gb2YgcmVxdWVzdHMgYXMgaW5wdXQsIGFuZFxuICogcmV0dXJucyBhICoqYHJlc3BvbnNlQ29sbGVjdGlvbmAqKiB3aXRoIGZ1bmN0aW9ucyB0aGF0IGFsbG93IHJlYWRpbmcgZnJvbSB0aGVcbiAqIHN0b3JhZ2Ugb2JqZWN0cy4gVGhlIGZ1bmN0aW9ucyBvbiB0aGUgKipgcmVzcG9uc2VDb2xsZWN0aW9uYCoqIHJldHVybiBzdHJlYW1zXG4gKiBvZiB0aGUgc3RvcmFnZSBkYXRhIHRoYXQgd2FzIHJlcXVlc3RlZC5cbiAqXG4gKiAqKlJlcXVlc3RzKiouIFRoZSBzdHJlYW0gb2YgcmVxdWVzdHMgc2hvdWxkIGVtaXQgb2JqZWN0cy4gVGhlc2Ugc2hvdWxkIGJlXG4gKiBpbnN0cnVjdGlvbnMgdG8gd3JpdGUgdG8gdGhlIGRlc2lyZWQgU3RvcmFnZSBvYmplY3QuIEhlcmUgYXJlIHRoZSBgcmVxdWVzdGBcbiAqIG9iamVjdCBwcm9wZXJ0aWVzOlxuICpcbiAqIC0gYHRhcmdldGAgKihTdHJpbmcpKjogdHlwZSBvZiBzdG9yYWdlLCBjYW4gYmUgYGxvY2FsYCBvciBgc2Vzc2lvbmAsIGRlZmF1bHRzXG4gKiB0byBgbG9jYWxgLlxuICogLSBgYWN0aW9uYCAqKFN0cmluZykqOiB0eXBlIG9mIGFjdGlvbiwgY2FuIGJlIGBzZXRJdGVtYCwgYHJlbW92ZUl0ZW1gIG9yXG4gKiBgY2xlYXJgLCBkZWZhdWx0cyB0byBgc2V0SXRlbWAuXG4gKiAtIGBrZXlgICooU3RyaW5nKSo6IHN0b3JhZ2Uga2V5LlxuICogLSBgdmFsdWVgICooU3RyaW5nKSo6IHN0b3JhZ2UgdmFsdWUuXG4gKlxuICogKipyZXNwb25zZUNvbGxlY3Rpb24qKi4gVGhlICoqYHJlc3BvbnNlQ29sbGVjdGlvbmAqKiBpcyBhbiBPYmplY3QgdGhhdFxuICogZXhwb3NlcyBmdW5jdGlvbnMgdG8gcmVhZCBmcm9tIGxvY2FsLSBhbmQgc2Vzc2lvblN0b3JhZ2UuXG4gKlxuICogYGBganNcbiAqIC8vIFJldHVybnMga2V5IG9mIG50aCBsb2NhbFN0b3JhZ2UgdmFsdWUuXG4gKiByZXNwb25zZUNvbGxlY3Rpb24ubG9jYWwuZ2V0S2V5KG4pXG4gKiAvLyBSZXR1cm5zIGxvY2FsU3RvcmFnZSB2YWx1ZSBvZiBga2V5YC5cbiAqIHJlc3BvbnNlQ29sbGVjdGlvbi5sb2NhbC5nZXRJdGVtKGtleSlcbiAqIGBgYFxuICpcbiAqIEBwYXJhbSByZXF1ZXN0JCAtIGEgc3RyZWFtIG9mIHdyaXRlIHJlcXVlc3Qgb2JqZWN0cy5cbiAqIEByZXR1cm4ge09iamVjdH0gdGhlIHJlc3BvbnNlIGNvbGxlY3Rpb24gY29udGFpbmluZyBmdW5jdGlvbnNcbiAqIGZvciByZWFkaW5nIGZyb20gc3RvcmFnZS5cbiAqIEBmdW5jdGlvbiBzdG9yYWdlRHJpdmVyXG4gKi9cbmZ1bmN0aW9uIHN0b3JhZ2VEcml2ZXIocmVxdWVzdCQpIHtcbiAgICAvLyBFeGVjdXRlIHdyaXRpbmcgYWN0aW9ucy5cbiAgICByZXF1ZXN0JC5hZGRMaXN0ZW5lcih7XG4gICAgICAgIG5leHQ6IGZ1bmN0aW9uIChyZXF1ZXN0KSB7IHJldHVybiB3cml0ZVRvU3RvcmVfMS5kZWZhdWx0KHJlcXVlc3QpOyB9LFxuICAgIH0pO1xuICAgIC8vIFJldHVybiByZWFkaW5nIGZ1bmN0aW9ucy5cbiAgICByZXR1cm4gcmVzcG9uc2VDb2xsZWN0aW9uXzEuZGVmYXVsdChyZXF1ZXN0JCk7XG59XG5leHBvcnRzLmRlZmF1bHQgPSBzdG9yYWdlRHJpdmVyO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgdXRpbF8xID0gcmVxdWlyZShcIi4vdXRpbFwiKTtcbmZ1bmN0aW9uIGRlZmF1bHRfMShyZXF1ZXN0JCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIC8vIEZvciBsb2NhbFN0b3JhZ2UuXG4gICAgICAgIGdldCBsb2NhbCgpIHtcbiAgICAgICAgICAgIHJldHVybiB1dGlsXzEuZGVmYXVsdChyZXF1ZXN0JCk7XG4gICAgICAgIH0sXG4gICAgICAgIC8vIEZvciBzZXNzaW9uU3RvcmFnZS5cbiAgICAgICAgZ2V0IHNlc3Npb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gdXRpbF8xLmRlZmF1bHQocmVxdWVzdCQsICdzZXNzaW9uJyk7XG4gICAgICAgIH0sXG4gICAgfTtcbn1cbmV4cG9ydHMuZGVmYXVsdCA9IGRlZmF1bHRfMTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIGRyb3BSZXBlYXRzXzEgPSByZXF1aXJlKFwieHN0cmVhbS9leHRyYS9kcm9wUmVwZWF0c1wiKTtcbnZhciBhZGFwdF8xID0gcmVxdWlyZShcIkBjeWNsZS9ydW4vbGliL2FkYXB0XCIpO1xuZnVuY3Rpb24gZ2V0U3RvcmFnZSQocmVxdWVzdCQsIHR5cGUpIHtcbiAgICBpZiAodHlwZSA9PT0gJ2xvY2FsJykge1xuICAgICAgICByZXR1cm4gcmVxdWVzdCQuZmlsdGVyKGZ1bmN0aW9uIChyZXEpIHsgcmV0dXJuICFyZXEudGFyZ2V0IHx8IHJlcS50YXJnZXQgPT09ICdsb2NhbCc7IH0pO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHJlcXVlc3QkLmZpbHRlcihmdW5jdGlvbiAocmVxKSB7IHJldHVybiByZXEudGFyZ2V0ID09PSAnc2Vzc2lvbic7IH0pO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHN0b3JhZ2VLZXkobiwgcmVxdWVzdCQsIHR5cGUpIHtcbiAgICBpZiAodHlwZSA9PT0gdm9pZCAwKSB7IHR5cGUgPSAnbG9jYWwnOyB9XG4gICAgdmFyIHN0b3JhZ2UkID0gZ2V0U3RvcmFnZSQocmVxdWVzdCQsIHR5cGUpO1xuICAgIHZhciBrZXkgPSB0eXBlID09PSBcImxvY2FsXCIgPyBsb2NhbFN0b3JhZ2Uua2V5KG4pIDogc2Vzc2lvblN0b3JhZ2Uua2V5KG4pO1xuICAgIHJldHVybiBzdG9yYWdlJFxuICAgICAgICAuZmlsdGVyKGZ1bmN0aW9uIChyZXEpIHsgcmV0dXJuIHJlcS5rZXkgPT09IGtleTsgfSlcbiAgICAgICAgLm1hcChmdW5jdGlvbiAocmVxKSB7IHJldHVybiByZXEua2V5OyB9KVxuICAgICAgICAuc3RhcnRXaXRoKGtleSlcbiAgICAgICAgLmNvbXBvc2UoZHJvcFJlcGVhdHNfMS5kZWZhdWx0KCkpO1xufVxuZnVuY3Rpb24gc3RvcmFnZUdldEl0ZW0oa2V5LCByZXF1ZXN0JCwgdHlwZSkge1xuICAgIGlmICh0eXBlID09PSB2b2lkIDApIHsgdHlwZSA9ICdsb2NhbCc7IH1cbiAgICB2YXIgc3RvcmFnZSQgPSBnZXRTdG9yYWdlJChyZXF1ZXN0JCwgdHlwZSk7XG4gICAgdmFyIHN0b3JhZ2VPYmogPSB0eXBlID09PSBcImxvY2FsXCIgPyBsb2NhbFN0b3JhZ2UgOiBzZXNzaW9uU3RvcmFnZTtcbiAgICByZXR1cm4gc3RvcmFnZSRcbiAgICAgICAgLmZpbHRlcihmdW5jdGlvbiAocmVxKSB7IHJldHVybiByZXEua2V5ID09PSBrZXk7IH0pXG4gICAgICAgIC5tYXAoZnVuY3Rpb24gKHJlcSkgeyByZXR1cm4gcmVxLnZhbHVlOyB9KVxuICAgICAgICAuc3RhcnRXaXRoKHN0b3JhZ2VPYmouZ2V0SXRlbShrZXkpKTtcbn1cbmZ1bmN0aW9uIGdldFJlc3BvbnNlT2JqKHJlcXVlc3QkLCB0eXBlKSB7XG4gICAgaWYgKHR5cGUgPT09IHZvaWQgMCkgeyB0eXBlID0gJ2xvY2FsJzsgfVxuICAgIHJldHVybiB7XG4gICAgICAgIC8vIEZ1bmN0aW9uIHJldHVybmluZyBzdHJlYW0gb2YgdGhlIG50aCBrZXkuXG4gICAgICAgIGtleTogZnVuY3Rpb24gKG4pIHtcbiAgICAgICAgICAgIHJldHVybiBhZGFwdF8xLmFkYXB0KHN0b3JhZ2VLZXkobiwgcmVxdWVzdCQsIHR5cGUpKTtcbiAgICAgICAgfSxcbiAgICAgICAgLy8gRnVuY3Rpb24gcmV0dXJuaW5nIHN0cmVhbSBvZiBpdGVtIHZhbHVlcy5cbiAgICAgICAgZ2V0SXRlbTogZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgcmV0dXJuIGFkYXB0XzEuYWRhcHQoc3RvcmFnZUdldEl0ZW0oa2V5LCByZXF1ZXN0JCwgdHlwZSkpO1xuICAgICAgICB9LFxuICAgIH07XG59XG5leHBvcnRzLmRlZmF1bHQgPSBnZXRSZXNwb25zZU9iajtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuLyoqXG4gKiBAZnVuY3Rpb24gd3JpdGVUb1N0b3JlXG4gKiBAZGVzY3JpcHRpb25cbiAqIEEgdW5pdmVyc2FsIHdyaXRlIGZ1bmN0aW9uIGZvciBsb2NhbFN0b3JhZ2UgYW5kIHNlc3Npb25TdG9yYWdlLlxuICogQHBhcmFtIHtvYmplY3R9IHJlcXVlc3QgLSB0aGUgc3RvcmFnZSByZXF1ZXN0IG9iamVjdFxuICogQHBhcmFtIHtzdHJpbmd9IHJlcXVlc3QudGFyZ2V0IC0gYSBzdHJpbmcgZGV0ZXJtaW5lcyB3aGljaCBzdG9yYWdlIHRvIHVzZVxuICogQHBhcmFtIHtzdHJpbmd9IHJlcXVlc3QuYWN0aW9uIC0gYSBzdHJpbmcgZGV0ZXJtaW5lcyB0aGUgd3JpdGUgYWN0aW9uXG4gKiBAcGFyYW0ge3N0cmluZ30gcmVxdWVzdC5rZXkgLSB0aGUga2V5IG9mIGEgc3RvcmFnZSBpdGVtXG4gKiBAcGFyYW0ge3N0cmluZ30gcmVxdWVzdC52YWx1ZSAtIHRoZSB2YWx1ZSBvZiBhIHN0b3JhZ2UgaXRlbVxuICovXG5mdW5jdGlvbiB3cml0ZVRvU3RvcmUocmVxdWVzdCkge1xuICAgIHZhciBfYSA9IHJlcXVlc3QudGFyZ2V0LCB0YXJnZXQgPSBfYSA9PT0gdm9pZCAwID8gJ2xvY2FsJyA6IF9hLCBfYiA9IHJlcXVlc3QuYWN0aW9uLCBhY3Rpb24gPSBfYiA9PT0gdm9pZCAwID8gJ3NldEl0ZW0nIDogX2I7XG4gICAgdmFyIGtleSA9IHJlcXVlc3Qua2V5O1xuICAgIHZhciB2YWx1ZSA9IHJlcXVlc3QudmFsdWU7XG4gICAgLy8gRGV0ZXJtaW5lIHRoZSBzdG9yYWdlIHRhcmdldC5cbiAgICB2YXIgc3RvcmFnZSA9IHRhcmdldCA9PT0gXCJsb2NhbFwiID8gbG9jYWxTdG9yYWdlIDogc2Vzc2lvblN0b3JhZ2U7XG4gICAgLy8gRXhlY3V0ZSB0aGUgc3RvcmFnZSBhY3Rpb24gYW5kIHBhc3MgYXJndW1lbnRzIGlmIHRoZXkgd2VyZSBkZWZpbmVkLlxuICAgIHN0b3JhZ2VbYWN0aW9uXShrZXksIHZhbHVlKTtcbn1cbmV4cG9ydHMuZGVmYXVsdCA9IHdyaXRlVG9TdG9yZTtcbiIsIlwidXNlIHN0cmljdFwiO1xudmFyIF9fYXNzaWduID0gKHRoaXMgJiYgdGhpcy5fX2Fzc2lnbikgfHwgT2JqZWN0LmFzc2lnbiB8fCBmdW5jdGlvbih0KSB7XG4gICAgZm9yICh2YXIgcywgaSA9IDEsIG4gPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgbjsgaSsrKSB7XG4gICAgICAgIHMgPSBhcmd1bWVudHNbaV07XG4gICAgICAgIGZvciAodmFyIHAgaW4gcykgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzLCBwKSlcbiAgICAgICAgICAgIHRbcF0gPSBzW3BdO1xuICAgIH1cbiAgICByZXR1cm4gdDtcbn07XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgeHN0cmVhbV8xID0gcmVxdWlyZShcInhzdHJlYW1cIik7XG52YXIgYWRhcHRfMSA9IHJlcXVpcmUoXCJAY3ljbGUvcnVuL2xpYi9hZGFwdFwiKTtcbnZhciBpc29sYXRlXzEgPSByZXF1aXJlKFwiQGN5Y2xlL2lzb2xhdGVcIik7XG52YXIgcGlja01lcmdlXzEgPSByZXF1aXJlKFwiLi9waWNrTWVyZ2VcIik7XG52YXIgcGlja0NvbWJpbmVfMSA9IHJlcXVpcmUoXCIuL3BpY2tDb21iaW5lXCIpO1xuLyoqXG4gKiBBbiBvYmplY3QgcmVwcmVzZW50aW5nIGFsbCBpbnN0YW5jZXMgaW4gYSBjb2xsZWN0aW9uIG9mIGNvbXBvbmVudHMuIEhhcyB0aGVcbiAqIG1ldGhvZHMgcGlja0NvbWJpbmUgYW5kIHBpY2tNZXJnZSB0byBnZXQgdGhlIGNvbWJpbmVkIHNpbmtzIG9mIGFsbCBpbnN0YW5jZXMuXG4gKi9cbnZhciBJbnN0YW5jZXMgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIEluc3RhbmNlcyhpbnN0YW5jZXMkKSB7XG4gICAgICAgIHRoaXMuX2luc3RhbmNlcyQgPSBpbnN0YW5jZXMkO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBMaWtlIGBtZXJnZWAgaW4geHN0cmVhbSwgdGhpcyBvcGVyYXRvciBibGVuZHMgbXVsdGlwbGUgc3RyZWFtcyB0b2dldGhlciwgYnV0XG4gICAgICogcGlja3MgdGhvc2Ugc3RyZWFtcyBmcm9tIGEgY29sbGVjdGlvbiBvZiBjb21wb25lbnQgaW5zdGFuY2VzLlxuICAgICAqXG4gICAgICogVXNlIHRoZSBgc2VsZWN0b3JgIHN0cmluZyB0byBwaWNrIGEgc3RyZWFtIGZyb20gdGhlIHNpbmtzIG9iamVjdCBvZiBlYWNoXG4gICAgICogY29tcG9uZW50IGluc3RhbmNlLCB0aGVuIHBpY2tNZXJnZSB3aWxsIG1lcmdlIGFsbCB0aG9zZSBwaWNrZWQgc3RyZWFtcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBzZWxlY3RvciBhIG5hbWUgb2YgYSBjaGFubmVsIGluIGEgc2lua3Mgb2JqZWN0IGJlbG9uZ2luZyB0b1xuICAgICAqIGVhY2ggY29tcG9uZW50IGluIHRoZSBjb2xsZWN0aW9uIG9mIGNvbXBvbmVudHMuXG4gICAgICogQHJldHVybiB7RnVuY3Rpb259IGFuIG9wZXJhdG9yIHRvIGJlIHVzZWQgd2l0aCB4c3RyZWFtJ3MgYGNvbXBvc2VgIG1ldGhvZC5cbiAgICAgKi9cbiAgICBJbnN0YW5jZXMucHJvdG90eXBlLnBpY2tNZXJnZSA9IGZ1bmN0aW9uIChzZWxlY3Rvcikge1xuICAgICAgICByZXR1cm4gYWRhcHRfMS5hZGFwdCh0aGlzLl9pbnN0YW5jZXMkLmNvbXBvc2UocGlja01lcmdlXzEucGlja01lcmdlKHNlbGVjdG9yKSkpO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogTGlrZSBgY29tYmluZWAgaW4geHN0cmVhbSwgdGhpcyBvcGVyYXRvciBjb21iaW5lcyBtdWx0aXBsZSBzdHJlYW1zIHRvZ2V0aGVyLFxuICAgICAqIGJ1dCBwaWNrcyB0aG9zZSBzdHJlYW1zIGZyb20gYSBjb2xsZWN0aW9uIG9mIGNvbXBvbmVudCBpbnN0YW5jZXMuXG4gICAgICpcbiAgICAgKiBVc2UgdGhlIGBzZWxlY3RvcmAgc3RyaW5nIHRvIHBpY2sgYSBzdHJlYW0gZnJvbSB0aGUgc2lua3Mgb2JqZWN0IG9mIGVhY2hcbiAgICAgKiBjb21wb25lbnQgaW5zdGFuY2UsIHRoZW4gcGlja0NvbWJpbmUgd2lsbCBjb21iaW5lIGFsbCB0aG9zZSBwaWNrZWQgc3RyZWFtcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBzZWxlY3RvciBhIG5hbWUgb2YgYSBjaGFubmVsIGluIGEgc2lua3Mgb2JqZWN0IGJlbG9uZ2luZyB0b1xuICAgICAqIGVhY2ggY29tcG9uZW50IGluIHRoZSBjb2xsZWN0aW9uIG9mIGNvbXBvbmVudHMuXG4gICAgICogQHJldHVybiB7RnVuY3Rpb259IGFuIG9wZXJhdG9yIHRvIGJlIHVzZWQgd2l0aCB4c3RyZWFtJ3MgYGNvbXBvc2VgIG1ldGhvZC5cbiAgICAgKi9cbiAgICBJbnN0YW5jZXMucHJvdG90eXBlLnBpY2tDb21iaW5lID0gZnVuY3Rpb24gKHNlbGVjdG9yKSB7XG4gICAgICAgIHJldHVybiBhZGFwdF8xLmFkYXB0KHRoaXMuX2luc3RhbmNlcyQuY29tcG9zZShwaWNrQ29tYmluZV8xLnBpY2tDb21iaW5lKHNlbGVjdG9yKSkpO1xuICAgIH07XG4gICAgcmV0dXJuIEluc3RhbmNlcztcbn0oKSk7XG5leHBvcnRzLkluc3RhbmNlcyA9IEluc3RhbmNlcztcbmZ1bmN0aW9uIGRlZmF1bHRJdGVtU2NvcGUoa2V5KSB7XG4gICAgcmV0dXJuIHsgJyonOiBudWxsIH07XG59XG5mdW5jdGlvbiBpbnN0YW5jZUxlbnMoaXRlbUtleSwga2V5KSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoYXJyKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGFyciA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdm9pZCAwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIG4gPSBhcnIubGVuZ3RoOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChcIlwiICsgaXRlbUtleShhcnJbaV0sIGkpID09PSBrZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBhcnJbaV07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZvaWQgMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAoYXJyLCBpdGVtKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGFyciA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gW2l0ZW1dO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAodHlwZW9mIGl0ZW0gPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGFyci5maWx0ZXIoZnVuY3Rpb24gKHMsIGkpIHsgcmV0dXJuIFwiXCIgKyBpdGVtS2V5KHMsIGkpICE9PSBrZXk7IH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGFyci5tYXAoZnVuY3Rpb24gKHMsIGkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKFwiXCIgKyBpdGVtS2V5KHMsIGkpID09PSBrZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBpdGVtO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHM7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICB9O1xufVxudmFyIGlkZW50aXR5TGVucyA9IHtcbiAgICBnZXQ6IGZ1bmN0aW9uIChvdXRlcikgeyByZXR1cm4gb3V0ZXI7IH0sXG4gICAgc2V0OiBmdW5jdGlvbiAob3V0ZXIsIGlubmVyKSB7IHJldHVybiBpbm5lcjsgfSxcbn07XG4vKipcbiAqIFJldHVybnMgYSBDeWNsZS5qcyBjb21wb25lbnQgKGEgZnVuY3Rpb24gZnJvbSBzb3VyY2VzIHRvIHNpbmtzKSB0aGF0XG4gKiByZXByZXNlbnRzIGEgY29sbGVjdGlvbiBvZiBtYW55IGl0ZW0gY29tcG9uZW50cyBvZiB0aGUgc2FtZSB0eXBlLlxuICpcbiAqIFRha2VzIGFuIFwib3B0aW9uc1wiIG9iamVjdCBhcyBpbnB1dCwgd2l0aCB0aGUgcmVxdWlyZWQgcHJvcGVydGllczpcbiAqIC0gaXRlbVxuICogLSBjb2xsZWN0U2lua3NcbiAqXG4gKiBBbmQgdGhlIG9wdGlvbmFsIHByb3BlcnRpZXM6XG4gKiAtIGl0ZW1LZXlcbiAqIC0gaXRlbVNjb3BlXG4gKiAtIGNoYW5uZWxcbiAqXG4gKiBUaGUgcmV0dXJuZWQgY29tcG9uZW50LCB0aGUgQ29sbGVjdGlvbiwgd2lsbCB1c2UgdGhlIHN0YXRlIHNvdXJjZSBwYXNzZWQgdG9cbiAqIGl0ICh0aHJvdWdoIHNvdXJjZXMpIHRvIGd1aWRlIHRoZSBkeW5hbWljIGdyb3dpbmcvc2hyaW5raW5nIG9mIGluc3RhbmNlcyBvZlxuICogdGhlIGl0ZW0gY29tcG9uZW50LlxuICpcbiAqIFR5cGljYWxseSB0aGUgc3RhdGUgc291cmNlIHNob3VsZCBlbWl0IGFycmF5cywgd2hlcmUgZWFjaCBlbnRyeSBpbiB0aGUgYXJyYXlcbiAqIGlzIGFuIG9iamVjdCBob2xkaW5nIHRoZSBzdGF0ZSBmb3IgZWFjaCBpdGVtIGNvbXBvbmVudC4gV2hlbiB0aGUgc3RhdGUgYXJyYXlcbiAqIGdyb3dzLCB0aGUgY29sbGVjdGlvbiB3aWxsIGF1dG9tYXRpY2FsbHkgaW5zdGFudGlhdGUgYSBuZXcgaXRlbSBjb21wb25lbnQuXG4gKiBTaW1pbGFybHksIHdoZW4gdGhlIHN0YXRlIGFycmF5IGdldHMgc21hbGxlciwgdGhlIGNvbGxlY3Rpb24gd2lsbCBoYW5kbGVcbiAqIHJlbW92YWwgb2YgdGhlIGNvcnJlc3BvbmRpbmcgaXRlbSBpbnN0YW5jZS5cbiAqL1xuZnVuY3Rpb24gbWFrZUNvbGxlY3Rpb24ob3B0cykge1xuICAgIHJldHVybiBmdW5jdGlvbiBjb2xsZWN0aW9uQ29tcG9uZW50KHNvdXJjZXMpIHtcbiAgICAgICAgdmFyIG5hbWUgPSBvcHRzLmNoYW5uZWwgfHwgJ29uaW9uJztcbiAgICAgICAgdmFyIGl0ZW1LZXkgPSBvcHRzLml0ZW1LZXk7XG4gICAgICAgIHZhciBpdGVtU2NvcGUgPSBvcHRzLml0ZW1TY29wZSB8fCBkZWZhdWx0SXRlbVNjb3BlO1xuICAgICAgICB2YXIgaXRlbUNvbXAgPSBvcHRzLml0ZW07XG4gICAgICAgIHZhciBzdGF0ZSQgPSB4c3RyZWFtXzEuZGVmYXVsdC5mcm9tT2JzZXJ2YWJsZShzb3VyY2VzW25hbWVdLnN0YXRlJCk7XG4gICAgICAgIHZhciBpbnN0YW5jZXMkID0gc3RhdGUkLmZvbGQoZnVuY3Rpb24gKGFjYywgbmV4dFN0YXRlKSB7XG4gICAgICAgICAgICB2YXIgZGljdCA9IGFjYy5kaWN0O1xuICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkobmV4dFN0YXRlKSkge1xuICAgICAgICAgICAgICAgIHZhciBuZXh0SW5zdEFycmF5ID0gQXJyYXkobmV4dFN0YXRlLmxlbmd0aCk7XG4gICAgICAgICAgICAgICAgdmFyIG5leHRLZXlzXzEgPSBuZXcgU2V0KCk7XG4gICAgICAgICAgICAgICAgLy8gYWRkXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIG4gPSBuZXh0U3RhdGUubGVuZ3RoOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBrZXkgPSBcIlwiICsgKGl0ZW1LZXkgPyBpdGVtS2V5KG5leHRTdGF0ZVtpXSwgaSkgOiBpKTtcbiAgICAgICAgICAgICAgICAgICAgbmV4dEtleXNfMS5hZGQoa2V5KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFkaWN0LmhhcyhrZXkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgb25pb25TY29wZSA9IGl0ZW1LZXkgPyBpbnN0YW5jZUxlbnMoaXRlbUtleSwga2V5KSA6IFwiXCIgKyBpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG90aGVyU2NvcGVzID0gaXRlbVNjb3BlKGtleSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgc2NvcGVzID0gdHlwZW9mIG90aGVyU2NvcGVzID09PSAnc3RyaW5nJyA/IChfYSA9IHsgJyonOiBvdGhlclNjb3BlcyB9LCBfYVtuYW1lXSA9IG9uaW9uU2NvcGUsIF9hKSA6IF9fYXNzaWduKHt9LCBvdGhlclNjb3BlcywgKF9iID0ge30sIF9iW25hbWVdID0gb25pb25TY29wZSwgX2IpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzaW5rcyA9IGlzb2xhdGVfMS5kZWZhdWx0KGl0ZW1Db21wLCBzY29wZXMpKHNvdXJjZXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGljdC5zZXQoa2V5LCBzaW5rcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXh0SW5zdEFycmF5W2ldID0gc2lua3M7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXh0SW5zdEFycmF5W2ldID0gZGljdC5nZXQoa2V5KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBuZXh0SW5zdEFycmF5W2ldLl9rZXkgPSBrZXk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIHJlbW92ZVxuICAgICAgICAgICAgICAgIGRpY3QuZm9yRWFjaChmdW5jdGlvbiAoXywga2V5KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghbmV4dEtleXNfMS5oYXMoa2V5KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGljdC5kZWxldGUoa2V5KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIG5leHRLZXlzXzEuY2xlYXIoKTtcbiAgICAgICAgICAgICAgICByZXR1cm4geyBkaWN0OiBkaWN0LCBhcnI6IG5leHRJbnN0QXJyYXkgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGRpY3QuY2xlYXIoKTtcbiAgICAgICAgICAgICAgICB2YXIga2V5ID0gXCJcIiArIChpdGVtS2V5ID8gaXRlbUtleShuZXh0U3RhdGUsIDApIDogJ3RoaXMnKTtcbiAgICAgICAgICAgICAgICB2YXIgb25pb25TY29wZSA9IGlkZW50aXR5TGVucztcbiAgICAgICAgICAgICAgICB2YXIgb3RoZXJTY29wZXMgPSBpdGVtU2NvcGUoa2V5KTtcbiAgICAgICAgICAgICAgICB2YXIgc2NvcGVzID0gdHlwZW9mIG90aGVyU2NvcGVzID09PSAnc3RyaW5nJyA/IChfYyA9IHsgJyonOiBvdGhlclNjb3BlcyB9LCBfY1tuYW1lXSA9IG9uaW9uU2NvcGUsIF9jKSA6IF9fYXNzaWduKHt9LCBvdGhlclNjb3BlcywgKF9kID0ge30sIF9kW25hbWVdID0gb25pb25TY29wZSwgX2QpKTtcbiAgICAgICAgICAgICAgICB2YXIgc2lua3MgPSBpc29sYXRlXzEuZGVmYXVsdChpdGVtQ29tcCwgc2NvcGVzKShzb3VyY2VzKTtcbiAgICAgICAgICAgICAgICBkaWN0LnNldChrZXksIHNpbmtzKTtcbiAgICAgICAgICAgICAgICByZXR1cm4geyBkaWN0OiBkaWN0LCBhcnI6IFtzaW5rc10gfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBfYSwgX2IsIF9jLCBfZDtcbiAgICAgICAgfSwgeyBkaWN0OiBuZXcgTWFwKCksIGFycjogW10gfSk7XG4gICAgICAgIHJldHVybiBvcHRzLmNvbGxlY3RTaW5rcyhuZXcgSW5zdGFuY2VzKGluc3RhbmNlcyQpKTtcbiAgICB9O1xufVxuZXhwb3J0cy5tYWtlQ29sbGVjdGlvbiA9IG1ha2VDb2xsZWN0aW9uO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9Q29sbGVjdGlvbi5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbnZhciBfX2Fzc2lnbiA9ICh0aGlzICYmIHRoaXMuX19hc3NpZ24pIHx8IE9iamVjdC5hc3NpZ24gfHwgZnVuY3Rpb24odCkge1xuICAgIGZvciAodmFyIHMsIGkgPSAxLCBuID0gYXJndW1lbnRzLmxlbmd0aDsgaSA8IG47IGkrKykge1xuICAgICAgICBzID0gYXJndW1lbnRzW2ldO1xuICAgICAgICBmb3IgKHZhciBwIGluIHMpIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwocywgcCkpXG4gICAgICAgICAgICB0W3BdID0gc1twXTtcbiAgICB9XG4gICAgcmV0dXJuIHQ7XG59O1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIGRyb3BSZXBlYXRzXzEgPSByZXF1aXJlKFwieHN0cmVhbS9leHRyYS9kcm9wUmVwZWF0c1wiKTtcbnZhciBhZGFwdF8xID0gcmVxdWlyZShcIkBjeWNsZS9ydW4vbGliL2FkYXB0XCIpO1xuZnVuY3Rpb24gdXBkYXRlQXJyYXlFbnRyeShhcnJheSwgc2NvcGUsIG5ld1ZhbCkge1xuICAgIGlmIChuZXdWYWwgPT09IGFycmF5W3Njb3BlXSkge1xuICAgICAgICByZXR1cm4gYXJyYXk7XG4gICAgfVxuICAgIHZhciBpbmRleCA9IHBhcnNlSW50KHNjb3BlKTtcbiAgICBpZiAodHlwZW9mIG5ld1ZhbCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgcmV0dXJuIGFycmF5LmZpbHRlcihmdW5jdGlvbiAodmFsLCBpKSB7IHJldHVybiBpICE9PSBpbmRleDsgfSk7XG4gICAgfVxuICAgIHJldHVybiBhcnJheS5tYXAoZnVuY3Rpb24gKHZhbCwgaSkgeyByZXR1cm4gaSA9PT0gaW5kZXggPyBuZXdWYWwgOiB2YWw7IH0pO1xufVxuZnVuY3Rpb24gbWFrZUdldHRlcihzY29wZSkge1xuICAgIGlmICh0eXBlb2Ygc2NvcGUgPT09ICdzdHJpbmcnIHx8IHR5cGVvZiBzY29wZSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIGxlbnNHZXQoc3RhdGUpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygc3RhdGUgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZvaWQgMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBzdGF0ZVtzY29wZV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICByZXR1cm4gc2NvcGUuZ2V0O1xuICAgIH1cbn1cbmZ1bmN0aW9uIG1ha2VTZXR0ZXIoc2NvcGUpIHtcbiAgICBpZiAodHlwZW9mIHNjb3BlID09PSAnc3RyaW5nJyB8fCB0eXBlb2Ygc2NvcGUgPT09ICdudW1iZXInKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBsZW5zU2V0KHN0YXRlLCBjaGlsZFN0YXRlKSB7XG4gICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShzdGF0ZSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdXBkYXRlQXJyYXlFbnRyeShzdGF0ZSwgc2NvcGUsIGNoaWxkU3RhdGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAodHlwZW9mIHN0YXRlID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIHJldHVybiBfYSA9IHt9LCBfYVtzY29wZV0gPSBjaGlsZFN0YXRlLCBfYTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBfX2Fzc2lnbih7fSwgc3RhdGUsIChfYiA9IHt9LCBfYltzY29wZV0gPSBjaGlsZFN0YXRlLCBfYikpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIF9hLCBfYjtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHJldHVybiBzY29wZS5zZXQ7XG4gICAgfVxufVxuZnVuY3Rpb24gaXNvbGF0ZVNvdXJjZShzb3VyY2UsIHNjb3BlKSB7XG4gICAgcmV0dXJuIHNvdXJjZS5zZWxlY3Qoc2NvcGUpO1xufVxuZXhwb3J0cy5pc29sYXRlU291cmNlID0gaXNvbGF0ZVNvdXJjZTtcbmZ1bmN0aW9uIGlzb2xhdGVTaW5rKGlubmVyUmVkdWNlciQsIHNjb3BlKSB7XG4gICAgdmFyIGdldCA9IG1ha2VHZXR0ZXIoc2NvcGUpO1xuICAgIHZhciBzZXQgPSBtYWtlU2V0dGVyKHNjb3BlKTtcbiAgICByZXR1cm4gaW5uZXJSZWR1Y2VyJFxuICAgICAgICAubWFwKGZ1bmN0aW9uIChpbm5lclJlZHVjZXIpIHsgcmV0dXJuIGZ1bmN0aW9uIG91dGVyUmVkdWNlcihvdXRlcikge1xuICAgICAgICB2YXIgcHJldklubmVyID0gZ2V0KG91dGVyKTtcbiAgICAgICAgdmFyIG5leHRJbm5lciA9IGlubmVyUmVkdWNlcihwcmV2SW5uZXIpO1xuICAgICAgICBpZiAocHJldklubmVyID09PSBuZXh0SW5uZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBvdXRlcjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBzZXQob3V0ZXIsIG5leHRJbm5lcik7XG4gICAgICAgIH1cbiAgICB9OyB9KTtcbn1cbmV4cG9ydHMuaXNvbGF0ZVNpbmsgPSBpc29sYXRlU2luaztcbi8qKlxuICogUmVwcmVzZW50cyBhIHBpZWNlIG9mIGFwcGxpY2F0aW9uIHN0YXRlIGR5bmFtaWNhbGx5IGNoYW5naW5nIG92ZXIgdGltZS5cbiAqL1xudmFyIFN0YXRlU291cmNlID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBTdGF0ZVNvdXJjZShzdHJlYW0sIG5hbWUpIHtcbiAgICAgICAgdGhpcy5pc29sYXRlU291cmNlID0gaXNvbGF0ZVNvdXJjZTtcbiAgICAgICAgdGhpcy5pc29sYXRlU2luayA9IGlzb2xhdGVTaW5rO1xuICAgICAgICB0aGlzLl9zdGF0ZSQgPSBzdHJlYW1cbiAgICAgICAgICAgIC5maWx0ZXIoZnVuY3Rpb24gKHMpIHsgcmV0dXJuIHR5cGVvZiBzICE9PSAndW5kZWZpbmVkJzsgfSlcbiAgICAgICAgICAgIC5jb21wb3NlKGRyb3BSZXBlYXRzXzEuZGVmYXVsdCgpKVxuICAgICAgICAgICAgLnJlbWVtYmVyKCk7XG4gICAgICAgIHRoaXMuX25hbWUgPSBuYW1lO1xuICAgICAgICB0aGlzLnN0YXRlJCA9IGFkYXB0XzEuYWRhcHQodGhpcy5fc3RhdGUkKTtcbiAgICAgICAgdGhpcy5fc3RhdGUkLl9pc0N5Y2xlU291cmNlID0gbmFtZTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogU2VsZWN0cyBhIHBhcnQgKG9yIHNjb3BlKSBvZiB0aGUgc3RhdGUgb2JqZWN0IGFuZCByZXR1cm5zIGEgbmV3IFN0YXRlU291cmNlXG4gICAgICogZHluYW1pY2FsbHkgcmVwcmVzZW50aW5nIHRoYXQgc2VsZWN0ZWQgcGFydCBvZiB0aGUgc3RhdGUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ3xudW1iZXJ8bGVuc30gc2NvcGUgYXMgYSBzdHJpbmcsIHRoaXMgYXJndW1lbnQgcmVwcmVzZW50cyB0aGVcbiAgICAgKiBwcm9wZXJ0eSB5b3Ugd2FudCB0byBzZWxlY3QgZnJvbSB0aGUgc3RhdGUgb2JqZWN0LiBBcyBhIG51bWJlciwgdGhpc1xuICAgICAqIHJlcHJlc2VudHMgdGhlIGFycmF5IGluZGV4IHlvdSB3YW50IHRvIHNlbGVjdCBmcm9tIHRoZSBzdGF0ZSBhcnJheS4gQXMgYVxuICAgICAqIGxlbnMgb2JqZWN0IChhbiBvYmplY3Qgd2l0aCBnZXQoKSBhbmQgc2V0KCkpLCB0aGlzIGFyZ3VtZW50IHJlcHJlc2VudHMgYW55XG4gICAgICogY3VzdG9tIHdheSBvZiBzZWxlY3Rpbmcgc29tZXRoaW5nIGZyb20gdGhlIHN0YXRlIG9iamVjdC5cbiAgICAgKi9cbiAgICBTdGF0ZVNvdXJjZS5wcm90b3R5cGUuc2VsZWN0ID0gZnVuY3Rpb24gKHNjb3BlKSB7XG4gICAgICAgIHZhciBnZXQgPSBtYWtlR2V0dGVyKHNjb3BlKTtcbiAgICAgICAgcmV0dXJuIG5ldyBTdGF0ZVNvdXJjZSh0aGlzLl9zdGF0ZSQubWFwKGdldCksIHRoaXMuX25hbWUpO1xuICAgIH07XG4gICAgcmV0dXJuIFN0YXRlU291cmNlO1xufSgpKTtcbmV4cG9ydHMuU3RhdGVTb3VyY2UgPSBTdGF0ZVNvdXJjZTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPVN0YXRlU291cmNlLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIG9uaW9uaWZ5XzEgPSByZXF1aXJlKFwiLi9vbmlvbmlmeVwiKTtcbnZhciBTdGF0ZVNvdXJjZV8xID0gcmVxdWlyZShcIi4vU3RhdGVTb3VyY2VcIik7XG5leHBvcnRzLlN0YXRlU291cmNlID0gU3RhdGVTb3VyY2VfMS5TdGF0ZVNvdXJjZTtcbmV4cG9ydHMuaXNvbGF0ZVNvdXJjZSA9IFN0YXRlU291cmNlXzEuaXNvbGF0ZVNvdXJjZTtcbmV4cG9ydHMuaXNvbGF0ZVNpbmsgPSBTdGF0ZVNvdXJjZV8xLmlzb2xhdGVTaW5rO1xudmFyIENvbGxlY3Rpb25fMSA9IHJlcXVpcmUoXCIuL0NvbGxlY3Rpb25cIik7XG5leHBvcnRzLkluc3RhbmNlcyA9IENvbGxlY3Rpb25fMS5JbnN0YW5jZXM7XG5leHBvcnRzLm1ha2VDb2xsZWN0aW9uID0gQ29sbGVjdGlvbl8xLm1ha2VDb2xsZWN0aW9uO1xuLyoqXG4gKiBMaWtlIGBtZXJnZWAgaW4geHN0cmVhbSwgdGhpcyBvcGVyYXRvciBibGVuZHMgbXVsdGlwbGUgc3RyZWFtcyB0b2dldGhlciwgYnV0XG4gKiBwaWNrcyB0aG9zZSBzdHJlYW1zIGZyb20gYSBzdHJlYW0gb2YgaW5zdGFuY2VzLlxuICpcbiAqIFRoZSBpbnN0YW5jZXMgZGF0YSBzdHJ1Y3R1cmUgaGFzIGEgc2lua3Mgb2JqZWN0IGZvciBlYWNoIGluc3RhbmNlLiBVc2UgdGhlXG4gKiBgc2VsZWN0b3JgIHN0cmluZyB0byBwaWNrIGEgc3RyZWFtIGZyb20gdGhlIHNpbmtzIG9iamVjdCBvZiBlYWNoIGluc3RhbmNlLFxuICogdGhlbiBwaWNrTWVyZ2Ugd2lsbCBtZXJnZSBhbGwgdGhvc2UgcGlja2VkIHN0cmVhbXMuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHNlbGVjdG9yIGEgbmFtZSBvZiBhIGNoYW5uZWwgaW4gYSBzaW5rcyBvYmplY3QgYmVsb25naW5nIHRvXG4gKiBlYWNoIGNvbXBvbmVudCBpbiB0aGUgY29sbGVjdGlvbiBvZiBpbnN0YW5jZXMuXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn0gYW4gb3BlcmF0b3IgdG8gYmUgdXNlZCB3aXRoIHhzdHJlYW0ncyBgY29tcG9zZWAgbWV0aG9kLlxuICovXG52YXIgcGlja01lcmdlXzEgPSByZXF1aXJlKFwiLi9waWNrTWVyZ2VcIik7XG5leHBvcnRzLnBpY2tNZXJnZSA9IHBpY2tNZXJnZV8xLnBpY2tNZXJnZTtcbi8qKlxuICogTGlrZSBgY29tYmluZWAgaW4geHN0cmVhbSwgdGhpcyBvcGVyYXRvciBjb21iaW5lcyBtdWx0aXBsZSBzdHJlYW1zIHRvZ2V0aGVyLFxuICogYnV0IHBpY2tzIHRob3NlIHN0cmVhbXMgZnJvbSBhIHN0cmVhbSBvZiBpbnN0YW5jZXMuXG4gKlxuICogVGhlIGluc3RhbmNlcyBkYXRhIHN0cnVjdHVyZSBoYXMgYSBzaW5rcyBvYmplY3QgZm9yIGVhY2ggaW5zdGFuY2UuIFVzZSB0aGVcbiAqIGBzZWxlY3RvcmAgc3RyaW5nIHRvIHBpY2sgYSBzdHJlYW0gZnJvbSB0aGUgc2lua3Mgb2JqZWN0IG9mIGVhY2ggaW5zdGFuY2UsXG4gKiB0aGVuIHBpY2tDb21iaW5lIHdpbGwgY29tYmluZSBhbGwgdGhvc2UgcGlja2VkIHN0cmVhbXMuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHNlbGVjdG9yIGEgbmFtZSBvZiBhIGNoYW5uZWwgaW4gYSBzaW5rcyBvYmplY3QgYmVsb25naW5nIHRvXG4gKiBlYWNoIGNvbXBvbmVudCBpbiB0aGUgY29sbGVjdGlvbiBvZiBpbnN0YW5jZXMuXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn0gYW4gb3BlcmF0b3IgdG8gYmUgdXNlZCB3aXRoIHhzdHJlYW0ncyBgY29tcG9zZWAgbWV0aG9kLlxuICovXG52YXIgcGlja0NvbWJpbmVfMSA9IHJlcXVpcmUoXCIuL3BpY2tDb21iaW5lXCIpO1xuZXhwb3J0cy5waWNrQ29tYmluZSA9IHBpY2tDb21iaW5lXzEucGlja0NvbWJpbmU7XG4vKipcbiAqIEdpdmVuIGEgQ3ljbGUuanMgY29tcG9uZW50IHRoYXQgZXhwZWN0cyBhbiBvbmlvbiBzdGF0ZSAqc291cmNlKiBhbmQgd2lsbFxuICogb3V0cHV0IG9uaW9uIHJlZHVjZXIgKnNpbmsqLCB0aGlzIGZ1bmN0aW9uIHNldHMgdXAgdGhlIHN0YXRlIG1hbmFnZW1lbnRcbiAqIG1lY2hhbmljcyB0byBhY2N1bXVsYXRlIHN0YXRlIG92ZXIgdGltZSBhbmQgcHJvdmlkZSB0aGUgc3RhdGUgc291cmNlLiBJdFxuICogcmV0dXJucyBhIEN5Y2xlLmpzIGNvbXBvbmVudCB3aGljaCB3cmFwcyB0aGUgY29tcG9uZW50IGdpdmVuIGFzIGlucHV0LlxuICogRXNzZW50aWFsbHksIGl0IGhvb2tzIHVwIHRoZSBvbmlvbiBzaW5rIHdpdGggdGhlIG9uaW9uIHNvdXJjZSBhcyBhIGN5Y2xlLlxuICpcbiAqIE9wdGlvbmFsbHksIHlvdSBjYW4gcGFzcyBhIGN1c3RvbSBuYW1lIGZvciB0aGUgb25pb24gY2hhbm5lbC4gQnkgZGVmYXVsdCxcbiAqIHRoZSBuYW1lIGlzICdvbmlvbicgaW4gc291cmNlcyBhbmQgc2lua3MsIGJ1dCB5b3UgY2FuIGNoYW5nZSB0aGF0IHRvIGJlXG4gKiB3aGF0ZXZlciBzdHJpbmcgeW91IHdpc2guXG4gKlxuICogQHBhcmFtIHtGdW5jdGlvbn0gbWFpbiBhIGZ1bmN0aW9uIHRoYXQgdGFrZXMgYHNvdXJjZXNgIGFzIGlucHV0IGFuZCBvdXRwdXRzXG4gKiBgc2lua3NgLlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgYW4gb3B0aW9uYWwgc3RyaW5nIGZvciB0aGUgY3VzdG9tIG5hbWUgZ2l2ZW4gdG8gdGhlXG4gKiBvbmlvbiBjaGFubmVsLiBCeSBkZWZhdWx0LCBpdCBpcyAnb25pb24nLlxuICogQHJldHVybiB7RnVuY3Rpb259IGEgY29tcG9uZW50IHRoYXQgd3JhcHMgdGhlIG1haW4gZnVuY3Rpb24gZ2l2ZW4gYXMgaW5wdXQsXG4gKiBhZGRpbmcgc3RhdGUgYWNjdW11bGF0aW9uIGxvZ2ljIHRvIGl0LlxuICovXG5leHBvcnRzLmRlZmF1bHQgPSBvbmlvbmlmeV8xLm9uaW9uaWZ5O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aW5kZXguanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgeHN0cmVhbV8xID0gcmVxdWlyZShcInhzdHJlYW1cIik7XG52YXIgU3RhdGVTb3VyY2VfMSA9IHJlcXVpcmUoXCIuL1N0YXRlU291cmNlXCIpO1xuZnVuY3Rpb24gb25pb25pZnkobWFpbiwgbmFtZSkge1xuICAgIGlmIChuYW1lID09PSB2b2lkIDApIHsgbmFtZSA9ICdvbmlvbic7IH1cbiAgICByZXR1cm4gZnVuY3Rpb24gbWFpbk9uaW9uaWZpZWQoc291cmNlcykge1xuICAgICAgICB2YXIgcmVkdWNlck1pbWljJCA9IHhzdHJlYW1fMS5kZWZhdWx0LmNyZWF0ZSgpO1xuICAgICAgICB2YXIgc3RhdGUkID0gcmVkdWNlck1pbWljJFxuICAgICAgICAgICAgLmZvbGQoZnVuY3Rpb24gKHN0YXRlLCByZWR1Y2VyKSB7IHJldHVybiByZWR1Y2VyKHN0YXRlKTsgfSwgdm9pZCAwKVxuICAgICAgICAgICAgLmRyb3AoMSk7XG4gICAgICAgIHNvdXJjZXNbbmFtZV0gPSBuZXcgU3RhdGVTb3VyY2VfMS5TdGF0ZVNvdXJjZShzdGF0ZSQsIG5hbWUpO1xuICAgICAgICB2YXIgc2lua3MgPSBtYWluKHNvdXJjZXMpO1xuICAgICAgICBpZiAoc2lua3NbbmFtZV0pIHtcbiAgICAgICAgICAgIHZhciBzdHJlYW0kID0geHN0cmVhbV8xLmRlZmF1bHQuZnJvbU9ic2VydmFibGUoc2lua3NbbmFtZV0pO1xuICAgICAgICAgICAgcmVkdWNlck1pbWljJC5pbWl0YXRlKHN0cmVhbSQpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzaW5rcztcbiAgICB9O1xufVxuZXhwb3J0cy5vbmlvbmlmeSA9IG9uaW9uaWZ5O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9b25pb25pZnkuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgeHN0cmVhbV8xID0gcmVxdWlyZShcInhzdHJlYW1cIik7XG52YXIgUGlja0NvbWJpbmVMaXN0ZW5lciA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gUGlja0NvbWJpbmVMaXN0ZW5lcihrZXksIG91dCwgcCwgaW5zKSB7XG4gICAgICAgIHRoaXMua2V5ID0ga2V5O1xuICAgICAgICB0aGlzLm91dCA9IG91dDtcbiAgICAgICAgdGhpcy5wID0gcDtcbiAgICAgICAgdGhpcy52YWwgPSB4c3RyZWFtXzEuTk87XG4gICAgICAgIHRoaXMuaW5zID0gaW5zO1xuICAgIH1cbiAgICBQaWNrQ29tYmluZUxpc3RlbmVyLnByb3RvdHlwZS5fbiA9IGZ1bmN0aW9uICh0KSB7XG4gICAgICAgIHZhciBwID0gdGhpcy5wLCBvdXQgPSB0aGlzLm91dDtcbiAgICAgICAgdGhpcy52YWwgPSB0O1xuICAgICAgICBpZiAob3V0ID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5wLnVwKCk7XG4gICAgfTtcbiAgICBQaWNrQ29tYmluZUxpc3RlbmVyLnByb3RvdHlwZS5fZSA9IGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgdmFyIG91dCA9IHRoaXMub3V0O1xuICAgICAgICBpZiAob3V0ID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgb3V0Ll9lKGVycik7XG4gICAgfTtcbiAgICBQaWNrQ29tYmluZUxpc3RlbmVyLnByb3RvdHlwZS5fYyA9IGZ1bmN0aW9uICgpIHtcbiAgICB9O1xuICAgIHJldHVybiBQaWNrQ29tYmluZUxpc3RlbmVyO1xufSgpKTtcbnZhciBQaWNrQ29tYmluZSA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gUGlja0NvbWJpbmUoc2VsLCBpbnMpIHtcbiAgICAgICAgdGhpcy50eXBlID0gJ2NvbWJpbmUnO1xuICAgICAgICB0aGlzLmlucyA9IGlucztcbiAgICAgICAgdGhpcy5zZWwgPSBzZWw7XG4gICAgICAgIHRoaXMub3V0ID0gbnVsbDtcbiAgICAgICAgdGhpcy5pbHMgPSBuZXcgTWFwKCk7XG4gICAgICAgIHRoaXMuaW5zdCA9IG51bGw7XG4gICAgfVxuICAgIFBpY2tDb21iaW5lLnByb3RvdHlwZS5fc3RhcnQgPSBmdW5jdGlvbiAob3V0KSB7XG4gICAgICAgIHRoaXMub3V0ID0gb3V0O1xuICAgICAgICB0aGlzLmlucy5fYWRkKHRoaXMpO1xuICAgIH07XG4gICAgUGlja0NvbWJpbmUucHJvdG90eXBlLl9zdG9wID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmlucy5fcmVtb3ZlKHRoaXMpO1xuICAgICAgICB2YXIgaWxzID0gdGhpcy5pbHM7XG4gICAgICAgIGlscy5mb3JFYWNoKGZ1bmN0aW9uIChpbCkge1xuICAgICAgICAgICAgaWwuaW5zLl9yZW1vdmUoaWwpO1xuICAgICAgICAgICAgaWwuaW5zID0gbnVsbDtcbiAgICAgICAgICAgIGlsLm91dCA9IG51bGw7XG4gICAgICAgICAgICBpbC52YWwgPSBudWxsO1xuICAgICAgICB9KTtcbiAgICAgICAgaWxzLmNsZWFyKCk7XG4gICAgICAgIHRoaXMub3V0ID0gbnVsbDtcbiAgICAgICAgdGhpcy5pbHMgPSBuZXcgTWFwKCk7XG4gICAgICAgIHRoaXMuaW5zdCA9IG51bGw7XG4gICAgfTtcbiAgICBQaWNrQ29tYmluZS5wcm90b3R5cGUudXAgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBhcnIgPSB0aGlzLmluc3QuYXJyO1xuICAgICAgICB2YXIgbiA9IGFyci5sZW5ndGg7XG4gICAgICAgIHZhciBpbHMgPSB0aGlzLmlscztcbiAgICAgICAgdmFyIG91dEFyciA9IEFycmF5KG4pO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG47ICsraSkge1xuICAgICAgICAgICAgdmFyIHNpbmtzID0gYXJyW2ldO1xuICAgICAgICAgICAgdmFyIGtleSA9IHNpbmtzLl9rZXk7XG4gICAgICAgICAgICBpZiAoIWlscy5oYXMoa2V5KSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciB2YWwgPSBpbHMuZ2V0KGtleSkudmFsO1xuICAgICAgICAgICAgaWYgKHZhbCA9PT0geHN0cmVhbV8xLk5PKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgb3V0QXJyW2ldID0gdmFsO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMub3V0Ll9uKG91dEFycik7XG4gICAgfTtcbiAgICBQaWNrQ29tYmluZS5wcm90b3R5cGUuX24gPSBmdW5jdGlvbiAoaW5zdCkge1xuICAgICAgICB0aGlzLmluc3QgPSBpbnN0O1xuICAgICAgICB2YXIgYXJyU2lua3MgPSBpbnN0LmFycjtcbiAgICAgICAgdmFyIGlscyA9IHRoaXMuaWxzO1xuICAgICAgICB2YXIgb3V0ID0gdGhpcy5vdXQ7XG4gICAgICAgIHZhciBzZWwgPSB0aGlzLnNlbDtcbiAgICAgICAgdmFyIGRpY3QgPSBpbnN0LmRpY3Q7XG4gICAgICAgIHZhciBuID0gYXJyU2lua3MubGVuZ3RoO1xuICAgICAgICAvLyByZW1vdmVcbiAgICAgICAgdmFyIHJlbW92ZWQgPSBmYWxzZTtcbiAgICAgICAgaWxzLmZvckVhY2goZnVuY3Rpb24gKGlsLCBrZXkpIHtcbiAgICAgICAgICAgIGlmICghZGljdC5oYXMoa2V5KSkge1xuICAgICAgICAgICAgICAgIGlsLmlucy5fcmVtb3ZlKGlsKTtcbiAgICAgICAgICAgICAgICBpbC5pbnMgPSBudWxsO1xuICAgICAgICAgICAgICAgIGlsLm91dCA9IG51bGw7XG4gICAgICAgICAgICAgICAgaWwudmFsID0gbnVsbDtcbiAgICAgICAgICAgICAgICBpbHMuZGVsZXRlKGtleSk7XG4gICAgICAgICAgICAgICAgcmVtb3ZlZCA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAobiA9PT0gMCkge1xuICAgICAgICAgICAgb3V0Ll9uKFtdKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICAvLyBhZGRcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICAgIHZhciBzaW5rcyA9IGFyclNpbmtzW2ldO1xuICAgICAgICAgICAgdmFyIGtleSA9IHNpbmtzLl9rZXk7XG4gICAgICAgICAgICB2YXIgc2luayA9IHhzdHJlYW1fMS5kZWZhdWx0LmZyb21PYnNlcnZhYmxlKHNpbmtzW3NlbF0pO1xuICAgICAgICAgICAgaWYgKCFpbHMuaGFzKGtleSkpIHtcbiAgICAgICAgICAgICAgICBpbHMuc2V0KGtleSwgbmV3IFBpY2tDb21iaW5lTGlzdGVuZXIoa2V5LCBvdXQsIHRoaXMsIHNpbmspKTtcbiAgICAgICAgICAgICAgICBzaW5rLl9hZGQoaWxzLmdldChrZXkpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAocmVtb3ZlZCkge1xuICAgICAgICAgICAgdGhpcy51cCgpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBQaWNrQ29tYmluZS5wcm90b3R5cGUuX2UgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICB2YXIgb3V0ID0gdGhpcy5vdXQ7XG4gICAgICAgIGlmIChvdXQgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBvdXQuX2UoZSk7XG4gICAgfTtcbiAgICBQaWNrQ29tYmluZS5wcm90b3R5cGUuX2MgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBvdXQgPSB0aGlzLm91dDtcbiAgICAgICAgaWYgKG91dCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIG91dC5fYygpO1xuICAgIH07XG4gICAgcmV0dXJuIFBpY2tDb21iaW5lO1xufSgpKTtcbmZ1bmN0aW9uIHBpY2tDb21iaW5lKHNlbGVjdG9yKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIHBpY2tDb21iaW5lT3BlcmF0b3IoaW5zdCQpIHtcbiAgICAgICAgcmV0dXJuIG5ldyB4c3RyZWFtXzEuU3RyZWFtKG5ldyBQaWNrQ29tYmluZShzZWxlY3RvciwgaW5zdCQpKTtcbiAgICB9O1xufVxuZXhwb3J0cy5waWNrQ29tYmluZSA9IHBpY2tDb21iaW5lO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9cGlja0NvbWJpbmUuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgeHN0cmVhbV8xID0gcmVxdWlyZShcInhzdHJlYW1cIik7XG52YXIgUGlja01lcmdlTGlzdGVuZXIgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFBpY2tNZXJnZUxpc3RlbmVyKG91dCwgcCwgaW5zKSB7XG4gICAgICAgIHRoaXMuaW5zID0gaW5zO1xuICAgICAgICB0aGlzLm91dCA9IG91dDtcbiAgICAgICAgdGhpcy5wID0gcDtcbiAgICB9XG4gICAgUGlja01lcmdlTGlzdGVuZXIucHJvdG90eXBlLl9uID0gZnVuY3Rpb24gKHQpIHtcbiAgICAgICAgdmFyIHAgPSB0aGlzLnAsIG91dCA9IHRoaXMub3V0O1xuICAgICAgICBpZiAob3V0ID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgb3V0Ll9uKHQpO1xuICAgIH07XG4gICAgUGlja01lcmdlTGlzdGVuZXIucHJvdG90eXBlLl9lID0gZnVuY3Rpb24gKGVycikge1xuICAgICAgICB2YXIgb3V0ID0gdGhpcy5vdXQ7XG4gICAgICAgIGlmIChvdXQgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBvdXQuX2UoZXJyKTtcbiAgICB9O1xuICAgIFBpY2tNZXJnZUxpc3RlbmVyLnByb3RvdHlwZS5fYyA9IGZ1bmN0aW9uICgpIHtcbiAgICB9O1xuICAgIHJldHVybiBQaWNrTWVyZ2VMaXN0ZW5lcjtcbn0oKSk7XG52YXIgUGlja01lcmdlID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBQaWNrTWVyZ2Uoc2VsLCBpbnMpIHtcbiAgICAgICAgdGhpcy50eXBlID0gJ3BpY2tNZXJnZSc7XG4gICAgICAgIHRoaXMuaW5zID0gaW5zO1xuICAgICAgICB0aGlzLm91dCA9IG51bGw7XG4gICAgICAgIHRoaXMuc2VsID0gc2VsO1xuICAgICAgICB0aGlzLmlscyA9IG5ldyBNYXAoKTtcbiAgICAgICAgdGhpcy5pbnN0ID0gbnVsbDtcbiAgICB9XG4gICAgUGlja01lcmdlLnByb3RvdHlwZS5fc3RhcnQgPSBmdW5jdGlvbiAob3V0KSB7XG4gICAgICAgIHRoaXMub3V0ID0gb3V0O1xuICAgICAgICB0aGlzLmlucy5fYWRkKHRoaXMpO1xuICAgIH07XG4gICAgUGlja01lcmdlLnByb3RvdHlwZS5fc3RvcCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5pbnMuX3JlbW92ZSh0aGlzKTtcbiAgICAgICAgdmFyIGlscyA9IHRoaXMuaWxzO1xuICAgICAgICBpbHMuZm9yRWFjaChmdW5jdGlvbiAoaWwsIGtleSkge1xuICAgICAgICAgICAgaWwuaW5zLl9yZW1vdmUoaWwpO1xuICAgICAgICAgICAgaWwuaW5zID0gbnVsbDtcbiAgICAgICAgICAgIGlsLm91dCA9IG51bGw7XG4gICAgICAgICAgICBpbHMuZGVsZXRlKGtleSk7XG4gICAgICAgIH0pO1xuICAgICAgICBpbHMuY2xlYXIoKTtcbiAgICAgICAgdGhpcy5vdXQgPSBudWxsO1xuICAgICAgICB0aGlzLmlscyA9IG5ldyBNYXAoKTtcbiAgICAgICAgdGhpcy5pbnN0ID0gbnVsbDtcbiAgICB9O1xuICAgIFBpY2tNZXJnZS5wcm90b3R5cGUuX24gPSBmdW5jdGlvbiAoaW5zdCkge1xuICAgICAgICB0aGlzLmluc3QgPSBpbnN0O1xuICAgICAgICB2YXIgYXJyU2lua3MgPSBpbnN0LmFycjtcbiAgICAgICAgdmFyIGlscyA9IHRoaXMuaWxzO1xuICAgICAgICB2YXIgb3V0ID0gdGhpcy5vdXQ7XG4gICAgICAgIHZhciBzZWwgPSB0aGlzLnNlbDtcbiAgICAgICAgdmFyIG4gPSBhcnJTaW5rcy5sZW5ndGg7XG4gICAgICAgIC8vIGFkZFxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG47ICsraSkge1xuICAgICAgICAgICAgdmFyIHNpbmtzID0gYXJyU2lua3NbaV07XG4gICAgICAgICAgICB2YXIga2V5ID0gc2lua3MuX2tleTtcbiAgICAgICAgICAgIHZhciBzaW5rID0geHN0cmVhbV8xLmRlZmF1bHQuZnJvbU9ic2VydmFibGUoc2lua3Nbc2VsXSk7XG4gICAgICAgICAgICBpZiAoIWlscy5oYXMoa2V5KSkge1xuICAgICAgICAgICAgICAgIGlscy5zZXQoa2V5LCBuZXcgUGlja01lcmdlTGlzdGVuZXIob3V0LCB0aGlzLCBzaW5rKSk7XG4gICAgICAgICAgICAgICAgc2luay5fYWRkKGlscy5nZXQoa2V5KSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gcmVtb3ZlXG4gICAgICAgIGlscy5mb3JFYWNoKGZ1bmN0aW9uIChpbCwga2V5KSB7XG4gICAgICAgICAgICBpZiAoIWluc3QuZGljdC5oYXMoa2V5KSB8fCAhaW5zdC5kaWN0LmdldChrZXkpKSB7XG4gICAgICAgICAgICAgICAgaWwuaW5zLl9yZW1vdmUoaWwpO1xuICAgICAgICAgICAgICAgIGlsLmlucyA9IG51bGw7XG4gICAgICAgICAgICAgICAgaWwub3V0ID0gbnVsbDtcbiAgICAgICAgICAgICAgICBpbHMuZGVsZXRlKGtleSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgUGlja01lcmdlLnByb3RvdHlwZS5fZSA9IGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgdmFyIHUgPSB0aGlzLm91dDtcbiAgICAgICAgaWYgKHUgPT09IG51bGwpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHUuX2UoZXJyKTtcbiAgICB9O1xuICAgIFBpY2tNZXJnZS5wcm90b3R5cGUuX2MgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciB1ID0gdGhpcy5vdXQ7XG4gICAgICAgIGlmICh1ID09PSBudWxsKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB1Ll9jKCk7XG4gICAgfTtcbiAgICByZXR1cm4gUGlja01lcmdlO1xufSgpKTtcbmZ1bmN0aW9uIHBpY2tNZXJnZShzZWxlY3Rvcikge1xuICAgIHJldHVybiBmdW5jdGlvbiBwaWNrTWVyZ2VPcGVyYXRvcihpbnN0JCkge1xuICAgICAgICByZXR1cm4gbmV3IHhzdHJlYW1fMS5TdHJlYW0obmV3IFBpY2tNZXJnZShzZWxlY3RvciwgaW5zdCQpKTtcbiAgICB9O1xufVxuZXhwb3J0cy5waWNrTWVyZ2UgPSBwaWNrTWVyZ2U7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1waWNrTWVyZ2UuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19hc3NpZ24gPSAodGhpcyAmJiB0aGlzLl9fYXNzaWduKSB8fCBPYmplY3QuYXNzaWduIHx8IGZ1bmN0aW9uKHQpIHtcbiAgICBmb3IgKHZhciBzLCBpID0gMSwgbiA9IGFyZ3VtZW50cy5sZW5ndGg7IGkgPCBuOyBpKyspIHtcbiAgICAgICAgcyA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgZm9yICh2YXIgcCBpbiBzKSBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHMsIHApKVxuICAgICAgICAgICAgdFtwXSA9IHNbcF07XG4gICAgfVxuICAgIHJldHVybiB0O1xufTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB4c3RyZWFtXzEgPSByZXF1aXJlKFwieHN0cmVhbVwiKTtcbnZhciBkZWJvdW5jZV8xID0gcmVxdWlyZShcInhzdHJlYW0vZXh0cmEvZGVib3VuY2VcIik7XG5mdW5jdGlvbiBzZXJpYWxpemUoc3RhdGUpIHtcbiAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoc3RhdGUpO1xufVxuZnVuY3Rpb24gZGVzZXJpYWxpemUoc3RyKSB7XG4gICAgcmV0dXJuIHN0ciA9PT0gbnVsbCA/IHZvaWQgMCA6IEpTT04ucGFyc2Uoc3RyKTtcbn1cbmZ1bmN0aW9uIHN0b3JhZ2VpZnkoQ29tcG9uZW50LCBvcHRpb25zKSB7XG4gICAgdmFyIF9vcHRpb25zID0gX19hc3NpZ24oeyBcbiAgICAgICAgLy8gZGVmYXVsdHNcbiAgICAgICAga2V5OiAnc3RvcmFnZWlmeScsIHNlcmlhbGl6ZTogc2VyaWFsaXplLFxuICAgICAgICBkZXNlcmlhbGl6ZTogZGVzZXJpYWxpemUgfSwgb3B0aW9ucyk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChzb3VyY2VzKSB7XG4gICAgICAgIHZhciBsb2NhbFN0b3JhZ2UkID0gc291cmNlcy5zdG9yYWdlLmxvY2FsLmdldEl0ZW0oX29wdGlvbnMua2V5KS50YWtlKDEpO1xuICAgICAgICB2YXIgc3RvcmVkRGF0YSQgPSBsb2NhbFN0b3JhZ2UkLm1hcChfb3B0aW9ucy5kZXNlcmlhbGl6ZSk7XG4gICAgICAgIHZhciBzdGF0ZSQgPSBzb3VyY2VzLm9uaW9uLnN0YXRlJFxuICAgICAgICAgICAgLmNvbXBvc2UoX29wdGlvbnMuZGVib3VuY2UgPyBkZWJvdW5jZV8xLmRlZmF1bHQoX29wdGlvbnMuZGVib3VuY2UpIDogZnVuY3Rpb24gKHgpIHsgcmV0dXJuIHg7IH0pO1xuICAgICAgICB2YXIgY29tcG9uZW50U2lua3MgPSBDb21wb25lbnQoc291cmNlcyk7XG4gICAgICAgIC8vIGNoYW5nZSBpbml0aWFsIHJlZHVjZXIgKGZpcnN0IHJlZHVjZXIpIG9mIGNvbXBvbmVudFxuICAgICAgICAvLyB0byBtZXJnZSBkZWZhdWx0IHN0YXRlIHdpdGggc3RvcmVkIHN0YXRlXG4gICAgICAgIHZhciBjaGlsZFJlZHVjZXIkID0gY29tcG9uZW50U2lua3Mub25pb247XG4gICAgICAgIHZhciBwYXJlbnRSZWR1Y2VyJCA9IHN0b3JlZERhdGEkLm1hcChmdW5jdGlvbiAoc3RvcmVkRGF0YSkge1xuICAgICAgICAgICAgcmV0dXJuIGNoaWxkUmVkdWNlciQuc3RhcnRXaXRoKGZ1bmN0aW9uIGluaXRpYWxTdG9yYWdlUmVkdWNlcihwcmV2U3RhdGUpIHtcbiAgICAgICAgICAgICAgICBpZiAocHJldlN0YXRlICYmIHN0b3JlZERhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIF9fYXNzaWduKHt9LCBwcmV2U3RhdGUsIHN0b3JlZERhdGEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChwcmV2U3RhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHByZXZTdGF0ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzdG9yZWREYXRhO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KS5mbGF0dGVuKCk7XG4gICAgICAgIHZhciBzdG9yYWdlJCA9IHN0YXRlJC5tYXAoX29wdGlvbnMuc2VyaWFsaXplKVxuICAgICAgICAgICAgLm1hcChmdW5jdGlvbiAodmFsdWUpIHsgcmV0dXJuICh7IGtleTogX29wdGlvbnMua2V5LCB2YWx1ZTogdmFsdWUgfSk7IH0pO1xuICAgICAgICB2YXIgc2lua3MgPSBfX2Fzc2lnbih7fSwgY29tcG9uZW50U2lua3MsIHsgb25pb246IHBhcmVudFJlZHVjZXIkLCBzdG9yYWdlOiB4c3RyZWFtXzEuZGVmYXVsdC5tZXJnZShzdG9yYWdlJCwgY29tcG9uZW50U2lua3Muc3RvcmFnZSB8fCB4c3RyZWFtXzEuZGVmYXVsdC5uZXZlcigpKSB9KTtcbiAgICAgICAgcmV0dXJuIHNpbmtzO1xuICAgIH07XG59XG5leHBvcnRzLmRlZmF1bHQgPSBzdG9yYWdlaWZ5O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aW5kZXguanMubWFwIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgY29weSAgICAgICAgICAgICA9IHJlcXVpcmUoJ2VzNS1leHQvb2JqZWN0L2NvcHknKVxuICAsIG5vcm1hbGl6ZU9wdGlvbnMgPSByZXF1aXJlKCdlczUtZXh0L29iamVjdC9ub3JtYWxpemUtb3B0aW9ucycpXG4gICwgZW5zdXJlQ2FsbGFibGUgICA9IHJlcXVpcmUoJ2VzNS1leHQvb2JqZWN0L3ZhbGlkLWNhbGxhYmxlJylcbiAgLCBtYXAgICAgICAgICAgICAgID0gcmVxdWlyZSgnZXM1LWV4dC9vYmplY3QvbWFwJylcbiAgLCBjYWxsYWJsZSAgICAgICAgID0gcmVxdWlyZSgnZXM1LWV4dC9vYmplY3QvdmFsaWQtY2FsbGFibGUnKVxuICAsIHZhbGlkVmFsdWUgICAgICAgPSByZXF1aXJlKCdlczUtZXh0L29iamVjdC92YWxpZC12YWx1ZScpXG5cbiAgLCBiaW5kID0gRnVuY3Rpb24ucHJvdG90eXBlLmJpbmQsIGRlZmluZVByb3BlcnR5ID0gT2JqZWN0LmRlZmluZVByb3BlcnR5XG4gICwgaGFzT3duUHJvcGVydHkgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5XG4gICwgZGVmaW5lO1xuXG5kZWZpbmUgPSBmdW5jdGlvbiAobmFtZSwgZGVzYywgb3B0aW9ucykge1xuXHR2YXIgdmFsdWUgPSB2YWxpZFZhbHVlKGRlc2MpICYmIGNhbGxhYmxlKGRlc2MudmFsdWUpLCBkZ3M7XG5cdGRncyA9IGNvcHkoZGVzYyk7XG5cdGRlbGV0ZSBkZ3Mud3JpdGFibGU7XG5cdGRlbGV0ZSBkZ3MudmFsdWU7XG5cdGRncy5nZXQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0aWYgKCFvcHRpb25zLm92ZXJ3cml0ZURlZmluaXRpb24gJiYgaGFzT3duUHJvcGVydHkuY2FsbCh0aGlzLCBuYW1lKSkgcmV0dXJuIHZhbHVlO1xuXHRcdGRlc2MudmFsdWUgPSBiaW5kLmNhbGwodmFsdWUsIG9wdGlvbnMucmVzb2x2ZUNvbnRleHQgPyBvcHRpb25zLnJlc29sdmVDb250ZXh0KHRoaXMpIDogdGhpcyk7XG5cdFx0ZGVmaW5lUHJvcGVydHkodGhpcywgbmFtZSwgZGVzYyk7XG5cdFx0cmV0dXJuIHRoaXNbbmFtZV07XG5cdH07XG5cdHJldHVybiBkZ3M7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChwcm9wcy8qLCBvcHRpb25zKi8pIHtcblx0dmFyIG9wdGlvbnMgPSBub3JtYWxpemVPcHRpb25zKGFyZ3VtZW50c1sxXSk7XG5cdGlmIChvcHRpb25zLnJlc29sdmVDb250ZXh0ICE9IG51bGwpIGVuc3VyZUNhbGxhYmxlKG9wdGlvbnMucmVzb2x2ZUNvbnRleHQpO1xuXHRyZXR1cm4gbWFwKHByb3BzLCBmdW5jdGlvbiAoZGVzYywgbmFtZSkgeyByZXR1cm4gZGVmaW5lKG5hbWUsIGRlc2MsIG9wdGlvbnMpOyB9KTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBhc3NpZ24gICAgICAgID0gcmVxdWlyZSgnZXM1LWV4dC9vYmplY3QvYXNzaWduJylcbiAgLCBub3JtYWxpemVPcHRzID0gcmVxdWlyZSgnZXM1LWV4dC9vYmplY3Qvbm9ybWFsaXplLW9wdGlvbnMnKVxuICAsIGlzQ2FsbGFibGUgICAgPSByZXF1aXJlKCdlczUtZXh0L29iamVjdC9pcy1jYWxsYWJsZScpXG4gICwgY29udGFpbnMgICAgICA9IHJlcXVpcmUoJ2VzNS1leHQvc3RyaW5nLyMvY29udGFpbnMnKVxuXG4gICwgZDtcblxuZCA9IG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGRzY3IsIHZhbHVlLyosIG9wdGlvbnMqLykge1xuXHR2YXIgYywgZSwgdywgb3B0aW9ucywgZGVzYztcblx0aWYgKChhcmd1bWVudHMubGVuZ3RoIDwgMikgfHwgKHR5cGVvZiBkc2NyICE9PSAnc3RyaW5nJykpIHtcblx0XHRvcHRpb25zID0gdmFsdWU7XG5cdFx0dmFsdWUgPSBkc2NyO1xuXHRcdGRzY3IgPSBudWxsO1xuXHR9IGVsc2Uge1xuXHRcdG9wdGlvbnMgPSBhcmd1bWVudHNbMl07XG5cdH1cblx0aWYgKGRzY3IgPT0gbnVsbCkge1xuXHRcdGMgPSB3ID0gdHJ1ZTtcblx0XHRlID0gZmFsc2U7XG5cdH0gZWxzZSB7XG5cdFx0YyA9IGNvbnRhaW5zLmNhbGwoZHNjciwgJ2MnKTtcblx0XHRlID0gY29udGFpbnMuY2FsbChkc2NyLCAnZScpO1xuXHRcdHcgPSBjb250YWlucy5jYWxsKGRzY3IsICd3Jyk7XG5cdH1cblxuXHRkZXNjID0geyB2YWx1ZTogdmFsdWUsIGNvbmZpZ3VyYWJsZTogYywgZW51bWVyYWJsZTogZSwgd3JpdGFibGU6IHcgfTtcblx0cmV0dXJuICFvcHRpb25zID8gZGVzYyA6IGFzc2lnbihub3JtYWxpemVPcHRzKG9wdGlvbnMpLCBkZXNjKTtcbn07XG5cbmQuZ3MgPSBmdW5jdGlvbiAoZHNjciwgZ2V0LCBzZXQvKiwgb3B0aW9ucyovKSB7XG5cdHZhciBjLCBlLCBvcHRpb25zLCBkZXNjO1xuXHRpZiAodHlwZW9mIGRzY3IgIT09ICdzdHJpbmcnKSB7XG5cdFx0b3B0aW9ucyA9IHNldDtcblx0XHRzZXQgPSBnZXQ7XG5cdFx0Z2V0ID0gZHNjcjtcblx0XHRkc2NyID0gbnVsbDtcblx0fSBlbHNlIHtcblx0XHRvcHRpb25zID0gYXJndW1lbnRzWzNdO1xuXHR9XG5cdGlmIChnZXQgPT0gbnVsbCkge1xuXHRcdGdldCA9IHVuZGVmaW5lZDtcblx0fSBlbHNlIGlmICghaXNDYWxsYWJsZShnZXQpKSB7XG5cdFx0b3B0aW9ucyA9IGdldDtcblx0XHRnZXQgPSBzZXQgPSB1bmRlZmluZWQ7XG5cdH0gZWxzZSBpZiAoc2V0ID09IG51bGwpIHtcblx0XHRzZXQgPSB1bmRlZmluZWQ7XG5cdH0gZWxzZSBpZiAoIWlzQ2FsbGFibGUoc2V0KSkge1xuXHRcdG9wdGlvbnMgPSBzZXQ7XG5cdFx0c2V0ID0gdW5kZWZpbmVkO1xuXHR9XG5cdGlmIChkc2NyID09IG51bGwpIHtcblx0XHRjID0gdHJ1ZTtcblx0XHRlID0gZmFsc2U7XG5cdH0gZWxzZSB7XG5cdFx0YyA9IGNvbnRhaW5zLmNhbGwoZHNjciwgJ2MnKTtcblx0XHRlID0gY29udGFpbnMuY2FsbChkc2NyLCAnZScpO1xuXHR9XG5cblx0ZGVzYyA9IHsgZ2V0OiBnZXQsIHNldDogc2V0LCBjb25maWd1cmFibGU6IGMsIGVudW1lcmFibGU6IGUgfTtcblx0cmV0dXJuICFvcHRpb25zID8gZGVzYyA6IGFzc2lnbihub3JtYWxpemVPcHRzKG9wdGlvbnMpLCBkZXNjKTtcbn07XG4iLCIvLyBJbnNwaXJlZCBieSBHb29nbGUgQ2xvc3VyZTpcbi8vIGh0dHA6Ly9jbG9zdXJlLWxpYnJhcnkuZ29vZ2xlY29kZS5jb20vc3ZuL2RvY3MvXG4vLyBjbG9zdXJlX2dvb2dfYXJyYXlfYXJyYXkuanMuaHRtbCNnb29nLmFycmF5LmNsZWFyXG5cblwidXNlIHN0cmljdFwiO1xuXG52YXIgdmFsdWUgPSByZXF1aXJlKFwiLi4vLi4vb2JqZWN0L3ZhbGlkLXZhbHVlXCIpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICgpIHtcblx0dmFsdWUodGhpcykubGVuZ3RoID0gMDtcblx0cmV0dXJuIHRoaXM7XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBudW1iZXJJc05hTiAgICAgICA9IHJlcXVpcmUoXCIuLi8uLi9udW1iZXIvaXMtbmFuXCIpXG4gICwgdG9Qb3NJbnQgICAgICAgICAgPSByZXF1aXJlKFwiLi4vLi4vbnVtYmVyL3RvLXBvcy1pbnRlZ2VyXCIpXG4gICwgdmFsdWUgICAgICAgICAgICAgPSByZXF1aXJlKFwiLi4vLi4vb2JqZWN0L3ZhbGlkLXZhbHVlXCIpXG4gICwgaW5kZXhPZiAgICAgICAgICAgPSBBcnJheS5wcm90b3R5cGUuaW5kZXhPZlxuICAsIG9iakhhc093blByb3BlcnR5ID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eVxuICAsIGFicyAgICAgICAgICAgICAgID0gTWF0aC5hYnNcbiAgLCBmbG9vciAgICAgICAgICAgICA9IE1hdGguZmxvb3I7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHNlYXJjaEVsZW1lbnQgLyosIGZyb21JbmRleCovKSB7XG5cdHZhciBpLCBsZW5ndGgsIGZyb21JbmRleCwgdmFsO1xuXHRpZiAoIW51bWJlcklzTmFOKHNlYXJjaEVsZW1lbnQpKSByZXR1cm4gaW5kZXhPZi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXG5cdGxlbmd0aCA9IHRvUG9zSW50KHZhbHVlKHRoaXMpLmxlbmd0aCk7XG5cdGZyb21JbmRleCA9IGFyZ3VtZW50c1sxXTtcblx0aWYgKGlzTmFOKGZyb21JbmRleCkpIGZyb21JbmRleCA9IDA7XG5cdGVsc2UgaWYgKGZyb21JbmRleCA+PSAwKSBmcm9tSW5kZXggPSBmbG9vcihmcm9tSW5kZXgpO1xuXHRlbHNlIGZyb21JbmRleCA9IHRvUG9zSW50KHRoaXMubGVuZ3RoKSAtIGZsb29yKGFicyhmcm9tSW5kZXgpKTtcblxuXHRmb3IgKGkgPSBmcm9tSW5kZXg7IGkgPCBsZW5ndGg7ICsraSkge1xuXHRcdGlmIChvYmpIYXNPd25Qcm9wZXJ0eS5jYWxsKHRoaXMsIGkpKSB7XG5cdFx0XHR2YWwgPSB0aGlzW2ldO1xuXHRcdFx0aWYgKG51bWJlcklzTmFOKHZhbCkpIHJldHVybiBpOyAvLyBKc2xpbnQ6IGlnbm9yZVxuXHRcdH1cblx0fVxuXHRyZXR1cm4gLTE7XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4vaXMtaW1wbGVtZW50ZWRcIikoKVxuXHQ/IEFycmF5LmZyb21cblx0OiByZXF1aXJlKFwiLi9zaGltXCIpO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKCkge1xuXHR2YXIgZnJvbSA9IEFycmF5LmZyb20sIGFyciwgcmVzdWx0O1xuXHRpZiAodHlwZW9mIGZyb20gIT09IFwiZnVuY3Rpb25cIikgcmV0dXJuIGZhbHNlO1xuXHRhcnIgPSBbXCJyYXpcIiwgXCJkd2FcIl07XG5cdHJlc3VsdCA9IGZyb20oYXJyKTtcblx0cmV0dXJuIEJvb2xlYW4ocmVzdWx0ICYmIChyZXN1bHQgIT09IGFycikgJiYgKHJlc3VsdFsxXSA9PT0gXCJkd2FcIikpO1xufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG52YXIgaXRlcmF0b3JTeW1ib2wgPSByZXF1aXJlKFwiZXM2LXN5bWJvbFwiKS5pdGVyYXRvclxuICAsIGlzQXJndW1lbnRzICAgID0gcmVxdWlyZShcIi4uLy4uL2Z1bmN0aW9uL2lzLWFyZ3VtZW50c1wiKVxuICAsIGlzRnVuY3Rpb24gICAgID0gcmVxdWlyZShcIi4uLy4uL2Z1bmN0aW9uL2lzLWZ1bmN0aW9uXCIpXG4gICwgdG9Qb3NJbnQgICAgICAgPSByZXF1aXJlKFwiLi4vLi4vbnVtYmVyL3RvLXBvcy1pbnRlZ2VyXCIpXG4gICwgY2FsbGFibGUgICAgICAgPSByZXF1aXJlKFwiLi4vLi4vb2JqZWN0L3ZhbGlkLWNhbGxhYmxlXCIpXG4gICwgdmFsaWRWYWx1ZSAgICAgPSByZXF1aXJlKFwiLi4vLi4vb2JqZWN0L3ZhbGlkLXZhbHVlXCIpXG4gICwgaXNWYWx1ZSAgICAgICAgPSByZXF1aXJlKFwiLi4vLi4vb2JqZWN0L2lzLXZhbHVlXCIpXG4gICwgaXNTdHJpbmcgICAgICAgPSByZXF1aXJlKFwiLi4vLi4vc3RyaW5nL2lzLXN0cmluZ1wiKVxuICAsIGlzQXJyYXkgICAgICAgID0gQXJyYXkuaXNBcnJheVxuICAsIGNhbGwgICAgICAgICAgID0gRnVuY3Rpb24ucHJvdG90eXBlLmNhbGxcbiAgLCBkZXNjICAgICAgICAgICA9IHsgY29uZmlndXJhYmxlOiB0cnVlLCBlbnVtZXJhYmxlOiB0cnVlLCB3cml0YWJsZTogdHJ1ZSwgdmFsdWU6IG51bGwgfVxuICAsIGRlZmluZVByb3BlcnR5ID0gT2JqZWN0LmRlZmluZVByb3BlcnR5O1xuXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgY29tcGxleGl0eVxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoYXJyYXlMaWtlIC8qLCBtYXBGbiwgdGhpc0FyZyovKSB7XG5cdHZhciBtYXBGbiA9IGFyZ3VtZW50c1sxXVxuXHQgICwgdGhpc0FyZyA9IGFyZ3VtZW50c1syXVxuXHQgICwgQ29udGV4dFxuXHQgICwgaVxuXHQgICwgalxuXHQgICwgYXJyXG5cdCAgLCBsZW5ndGhcblx0ICAsIGNvZGVcblx0ICAsIGl0ZXJhdG9yXG5cdCAgLCByZXN1bHRcblx0ICAsIGdldEl0ZXJhdG9yXG5cdCAgLCB2YWx1ZTtcblxuXHRhcnJheUxpa2UgPSBPYmplY3QodmFsaWRWYWx1ZShhcnJheUxpa2UpKTtcblxuXHRpZiAoaXNWYWx1ZShtYXBGbikpIGNhbGxhYmxlKG1hcEZuKTtcblx0aWYgKCF0aGlzIHx8IHRoaXMgPT09IEFycmF5IHx8ICFpc0Z1bmN0aW9uKHRoaXMpKSB7XG5cdFx0Ly8gUmVzdWx0OiBQbGFpbiBhcnJheVxuXHRcdGlmICghbWFwRm4pIHtcblx0XHRcdGlmIChpc0FyZ3VtZW50cyhhcnJheUxpa2UpKSB7XG5cdFx0XHRcdC8vIFNvdXJjZTogQXJndW1lbnRzXG5cdFx0XHRcdGxlbmd0aCA9IGFycmF5TGlrZS5sZW5ndGg7XG5cdFx0XHRcdGlmIChsZW5ndGggIT09IDEpIHJldHVybiBBcnJheS5hcHBseShudWxsLCBhcnJheUxpa2UpO1xuXHRcdFx0XHRhcnIgPSBuZXcgQXJyYXkoMSk7XG5cdFx0XHRcdGFyclswXSA9IGFycmF5TGlrZVswXTtcblx0XHRcdFx0cmV0dXJuIGFycjtcblx0XHRcdH1cblx0XHRcdGlmIChpc0FycmF5KGFycmF5TGlrZSkpIHtcblx0XHRcdFx0Ly8gU291cmNlOiBBcnJheVxuXHRcdFx0XHRhcnIgPSBuZXcgQXJyYXkobGVuZ3RoID0gYXJyYXlMaWtlLmxlbmd0aCk7XG5cdFx0XHRcdGZvciAoaSA9IDA7IGkgPCBsZW5ndGg7ICsraSkgYXJyW2ldID0gYXJyYXlMaWtlW2ldO1xuXHRcdFx0XHRyZXR1cm4gYXJyO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRhcnIgPSBbXTtcblx0fSBlbHNlIHtcblx0XHQvLyBSZXN1bHQ6IE5vbiBwbGFpbiBhcnJheVxuXHRcdENvbnRleHQgPSB0aGlzO1xuXHR9XG5cblx0aWYgKCFpc0FycmF5KGFycmF5TGlrZSkpIHtcblx0XHRpZiAoKGdldEl0ZXJhdG9yID0gYXJyYXlMaWtlW2l0ZXJhdG9yU3ltYm9sXSkgIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0Ly8gU291cmNlOiBJdGVyYXRvclxuXHRcdFx0aXRlcmF0b3IgPSBjYWxsYWJsZShnZXRJdGVyYXRvcikuY2FsbChhcnJheUxpa2UpO1xuXHRcdFx0aWYgKENvbnRleHQpIGFyciA9IG5ldyBDb250ZXh0KCk7XG5cdFx0XHRyZXN1bHQgPSBpdGVyYXRvci5uZXh0KCk7XG5cdFx0XHRpID0gMDtcblx0XHRcdHdoaWxlICghcmVzdWx0LmRvbmUpIHtcblx0XHRcdFx0dmFsdWUgPSBtYXBGbiA/IGNhbGwuY2FsbChtYXBGbiwgdGhpc0FyZywgcmVzdWx0LnZhbHVlLCBpKSA6IHJlc3VsdC52YWx1ZTtcblx0XHRcdFx0aWYgKENvbnRleHQpIHtcblx0XHRcdFx0XHRkZXNjLnZhbHVlID0gdmFsdWU7XG5cdFx0XHRcdFx0ZGVmaW5lUHJvcGVydHkoYXJyLCBpLCBkZXNjKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRhcnJbaV0gPSB2YWx1ZTtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXN1bHQgPSBpdGVyYXRvci5uZXh0KCk7XG5cdFx0XHRcdCsraTtcblx0XHRcdH1cblx0XHRcdGxlbmd0aCA9IGk7XG5cdFx0fSBlbHNlIGlmIChpc1N0cmluZyhhcnJheUxpa2UpKSB7XG5cdFx0XHQvLyBTb3VyY2U6IFN0cmluZ1xuXHRcdFx0bGVuZ3RoID0gYXJyYXlMaWtlLmxlbmd0aDtcblx0XHRcdGlmIChDb250ZXh0KSBhcnIgPSBuZXcgQ29udGV4dCgpO1xuXHRcdFx0Zm9yIChpID0gMCwgaiA9IDA7IGkgPCBsZW5ndGg7ICsraSkge1xuXHRcdFx0XHR2YWx1ZSA9IGFycmF5TGlrZVtpXTtcblx0XHRcdFx0aWYgKGkgKyAxIDwgbGVuZ3RoKSB7XG5cdFx0XHRcdFx0Y29kZSA9IHZhbHVlLmNoYXJDb2RlQXQoMCk7XG5cdFx0XHRcdFx0Ly8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG1heC1kZXB0aFxuXHRcdFx0XHRcdGlmIChjb2RlID49IDB4ZDgwMCAmJiBjb2RlIDw9IDB4ZGJmZikgdmFsdWUgKz0gYXJyYXlMaWtlWysraV07XG5cdFx0XHRcdH1cblx0XHRcdFx0dmFsdWUgPSBtYXBGbiA/IGNhbGwuY2FsbChtYXBGbiwgdGhpc0FyZywgdmFsdWUsIGopIDogdmFsdWU7XG5cdFx0XHRcdGlmIChDb250ZXh0KSB7XG5cdFx0XHRcdFx0ZGVzYy52YWx1ZSA9IHZhbHVlO1xuXHRcdFx0XHRcdGRlZmluZVByb3BlcnR5KGFyciwgaiwgZGVzYyk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0YXJyW2pdID0gdmFsdWU7XG5cdFx0XHRcdH1cblx0XHRcdFx0KytqO1xuXHRcdFx0fVxuXHRcdFx0bGVuZ3RoID0gajtcblx0XHR9XG5cdH1cblx0aWYgKGxlbmd0aCA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0Ly8gU291cmNlOiBhcnJheSBvciBhcnJheS1saWtlXG5cdFx0bGVuZ3RoID0gdG9Qb3NJbnQoYXJyYXlMaWtlLmxlbmd0aCk7XG5cdFx0aWYgKENvbnRleHQpIGFyciA9IG5ldyBDb250ZXh0KGxlbmd0aCk7XG5cdFx0Zm9yIChpID0gMDsgaSA8IGxlbmd0aDsgKytpKSB7XG5cdFx0XHR2YWx1ZSA9IG1hcEZuID8gY2FsbC5jYWxsKG1hcEZuLCB0aGlzQXJnLCBhcnJheUxpa2VbaV0sIGkpIDogYXJyYXlMaWtlW2ldO1xuXHRcdFx0aWYgKENvbnRleHQpIHtcblx0XHRcdFx0ZGVzYy52YWx1ZSA9IHZhbHVlO1xuXHRcdFx0XHRkZWZpbmVQcm9wZXJ0eShhcnIsIGksIGRlc2MpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0YXJyW2ldID0gdmFsdWU7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cdGlmIChDb250ZXh0KSB7XG5cdFx0ZGVzYy52YWx1ZSA9IG51bGw7XG5cdFx0YXJyLmxlbmd0aCA9IGxlbmd0aDtcblx0fVxuXHRyZXR1cm4gYXJyO1xufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG52YXIgb2JqVG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nXG4gICwgaWQgPSBvYmpUb1N0cmluZy5jYWxsKFxuXHQoZnVuY3Rpb24gKCkge1xuXHRcdHJldHVybiBhcmd1bWVudHM7XG5cdH0pKClcbik7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHZhbHVlKSB7XG5cdHJldHVybiBvYmpUb1N0cmluZy5jYWxsKHZhbHVlKSA9PT0gaWQ7XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBvYmpUb1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcsIGlkID0gb2JqVG9TdHJpbmcuY2FsbChyZXF1aXJlKFwiLi9ub29wXCIpKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAodmFsdWUpIHtcblx0cmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gXCJmdW5jdGlvblwiICYmIG9ialRvU3RyaW5nLmNhbGwodmFsdWUpID09PSBpZDtcbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcblxuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWVtcHR5LWZ1bmN0aW9uXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICgpIHt9O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4vaXMtaW1wbGVtZW50ZWRcIikoKVxuXHQ/IE1hdGguc2lnblxuXHQ6IHJlcXVpcmUoXCIuL3NoaW1cIik7XG4iLCJcInVzZSBzdHJpY3RcIjtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoKSB7XG5cdHZhciBzaWduID0gTWF0aC5zaWduO1xuXHRpZiAodHlwZW9mIHNpZ24gIT09IFwiZnVuY3Rpb25cIikgcmV0dXJuIGZhbHNlO1xuXHRyZXR1cm4gKHNpZ24oMTApID09PSAxKSAmJiAoc2lnbigtMjApID09PSAtMSk7XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHZhbHVlKSB7XG5cdHZhbHVlID0gTnVtYmVyKHZhbHVlKTtcblx0aWYgKGlzTmFOKHZhbHVlKSB8fCAodmFsdWUgPT09IDApKSByZXR1cm4gdmFsdWU7XG5cdHJldHVybiB2YWx1ZSA+IDAgPyAxIDogLTE7XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4vaXMtaW1wbGVtZW50ZWRcIikoKVxuXHQ/IE51bWJlci5pc05hTlxuXHQ6IHJlcXVpcmUoXCIuL3NoaW1cIik7XG4iLCJcInVzZSBzdHJpY3RcIjtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoKSB7XG5cdHZhciBudW1iZXJJc05hTiA9IE51bWJlci5pc05hTjtcblx0aWYgKHR5cGVvZiBudW1iZXJJc05hTiAhPT0gXCJmdW5jdGlvblwiKSByZXR1cm4gZmFsc2U7XG5cdHJldHVybiAhbnVtYmVySXNOYU4oe30pICYmIG51bWJlcklzTmFOKE5hTikgJiYgIW51bWJlcklzTmFOKDM0KTtcbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAodmFsdWUpIHtcblx0Ly8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXNlbGYtY29tcGFyZVxuXHRyZXR1cm4gdmFsdWUgIT09IHZhbHVlO1xufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG52YXIgc2lnbiA9IHJlcXVpcmUoXCIuLi9tYXRoL3NpZ25cIilcblxuICAsIGFicyA9IE1hdGguYWJzLCBmbG9vciA9IE1hdGguZmxvb3I7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHZhbHVlKSB7XG5cdGlmIChpc05hTih2YWx1ZSkpIHJldHVybiAwO1xuXHR2YWx1ZSA9IE51bWJlcih2YWx1ZSk7XG5cdGlmICgodmFsdWUgPT09IDApIHx8ICFpc0Zpbml0ZSh2YWx1ZSkpIHJldHVybiB2YWx1ZTtcblx0cmV0dXJuIHNpZ24odmFsdWUpICogZmxvb3IoYWJzKHZhbHVlKSk7XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciB0b0ludGVnZXIgPSByZXF1aXJlKFwiLi90by1pbnRlZ2VyXCIpXG5cbiAgLCBtYXggPSBNYXRoLm1heDtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiByZXR1cm4gbWF4KDAsIHRvSW50ZWdlcih2YWx1ZSkpO1xufTtcbiIsIi8vIEludGVybmFsIG1ldGhvZCwgdXNlZCBieSBpdGVyYXRpb24gZnVuY3Rpb25zLlxuLy8gQ2FsbHMgYSBmdW5jdGlvbiBmb3IgZWFjaCBrZXktdmFsdWUgcGFpciBmb3VuZCBpbiBvYmplY3Rcbi8vIE9wdGlvbmFsbHkgdGFrZXMgY29tcGFyZUZuIHRvIGl0ZXJhdGUgb2JqZWN0IGluIHNwZWNpZmljIG9yZGVyXG5cblwidXNlIHN0cmljdFwiO1xuXG52YXIgY2FsbGFibGUgICAgICAgICAgICAgICAgPSByZXF1aXJlKFwiLi92YWxpZC1jYWxsYWJsZVwiKVxuICAsIHZhbHVlICAgICAgICAgICAgICAgICAgID0gcmVxdWlyZShcIi4vdmFsaWQtdmFsdWVcIilcbiAgLCBiaW5kICAgICAgICAgICAgICAgICAgICA9IEZ1bmN0aW9uLnByb3RvdHlwZS5iaW5kXG4gICwgY2FsbCAgICAgICAgICAgICAgICAgICAgPSBGdW5jdGlvbi5wcm90b3R5cGUuY2FsbFxuICAsIGtleXMgICAgICAgICAgICAgICAgICAgID0gT2JqZWN0LmtleXNcbiAgLCBvYmpQcm9wZXJ0eUlzRW51bWVyYWJsZSA9IE9iamVjdC5wcm90b3R5cGUucHJvcGVydHlJc0VudW1lcmFibGU7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKG1ldGhvZCwgZGVmVmFsKSB7XG5cdHJldHVybiBmdW5jdGlvbiAob2JqLCBjYiAvKiwgdGhpc0FyZywgY29tcGFyZUZuKi8pIHtcblx0XHR2YXIgbGlzdCwgdGhpc0FyZyA9IGFyZ3VtZW50c1syXSwgY29tcGFyZUZuID0gYXJndW1lbnRzWzNdO1xuXHRcdG9iaiA9IE9iamVjdCh2YWx1ZShvYmopKTtcblx0XHRjYWxsYWJsZShjYik7XG5cblx0XHRsaXN0ID0ga2V5cyhvYmopO1xuXHRcdGlmIChjb21wYXJlRm4pIHtcblx0XHRcdGxpc3Quc29ydCh0eXBlb2YgY29tcGFyZUZuID09PSBcImZ1bmN0aW9uXCIgPyBiaW5kLmNhbGwoY29tcGFyZUZuLCBvYmopIDogdW5kZWZpbmVkKTtcblx0XHR9XG5cdFx0aWYgKHR5cGVvZiBtZXRob2QgIT09IFwiZnVuY3Rpb25cIikgbWV0aG9kID0gbGlzdFttZXRob2RdO1xuXHRcdHJldHVybiBjYWxsLmNhbGwobWV0aG9kLCBsaXN0LCBmdW5jdGlvbiAoa2V5LCBpbmRleCkge1xuXHRcdFx0aWYgKCFvYmpQcm9wZXJ0eUlzRW51bWVyYWJsZS5jYWxsKG9iaiwga2V5KSkgcmV0dXJuIGRlZlZhbDtcblx0XHRcdHJldHVybiBjYWxsLmNhbGwoY2IsIHRoaXNBcmcsIG9ialtrZXldLCBrZXksIG9iaiwgaW5kZXgpO1xuXHRcdH0pO1xuXHR9O1xufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCIuL2lzLWltcGxlbWVudGVkXCIpKClcblx0PyBPYmplY3QuYXNzaWduXG5cdDogcmVxdWlyZShcIi4vc2hpbVwiKTtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICgpIHtcblx0dmFyIGFzc2lnbiA9IE9iamVjdC5hc3NpZ24sIG9iajtcblx0aWYgKHR5cGVvZiBhc3NpZ24gIT09IFwiZnVuY3Rpb25cIikgcmV0dXJuIGZhbHNlO1xuXHRvYmogPSB7IGZvbzogXCJyYXpcIiB9O1xuXHRhc3NpZ24ob2JqLCB7IGJhcjogXCJkd2FcIiB9LCB7IHRyenk6IFwidHJ6eVwiIH0pO1xuXHRyZXR1cm4gKG9iai5mb28gKyBvYmouYmFyICsgb2JqLnRyenkpID09PSBcInJhemR3YXRyenlcIjtcbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcblxudmFyIGtleXMgID0gcmVxdWlyZShcIi4uL2tleXNcIilcbiAgLCB2YWx1ZSA9IHJlcXVpcmUoXCIuLi92YWxpZC12YWx1ZVwiKVxuICAsIG1heCAgID0gTWF0aC5tYXg7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGRlc3QsIHNyYyAvKiwg4oCmc3JjbiovKSB7XG5cdHZhciBlcnJvciwgaSwgbGVuZ3RoID0gbWF4KGFyZ3VtZW50cy5sZW5ndGgsIDIpLCBhc3NpZ247XG5cdGRlc3QgPSBPYmplY3QodmFsdWUoZGVzdCkpO1xuXHRhc3NpZ24gPSBmdW5jdGlvbiAoa2V5KSB7XG5cdFx0dHJ5IHtcblx0XHRcdGRlc3Rba2V5XSA9IHNyY1trZXldO1xuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdGlmICghZXJyb3IpIGVycm9yID0gZTtcblx0XHR9XG5cdH07XG5cdGZvciAoaSA9IDE7IGkgPCBsZW5ndGg7ICsraSkge1xuXHRcdHNyYyA9IGFyZ3VtZW50c1tpXTtcblx0XHRrZXlzKHNyYykuZm9yRWFjaChhc3NpZ24pO1xuXHR9XG5cdGlmIChlcnJvciAhPT0gdW5kZWZpbmVkKSB0aHJvdyBlcnJvcjtcblx0cmV0dXJuIGRlc3Q7XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBhRnJvbSAgPSByZXF1aXJlKFwiLi4vYXJyYXkvZnJvbVwiKVxuICAsIGFzc2lnbiA9IHJlcXVpcmUoXCIuL2Fzc2lnblwiKVxuICAsIHZhbHVlICA9IHJlcXVpcmUoXCIuL3ZhbGlkLXZhbHVlXCIpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChvYmovKiwgcHJvcGVydHlOYW1lcywgb3B0aW9ucyovKSB7XG5cdHZhciBjb3B5ID0gT2JqZWN0KHZhbHVlKG9iaikpLCBwcm9wZXJ0eU5hbWVzID0gYXJndW1lbnRzWzFdLCBvcHRpb25zID0gT2JqZWN0KGFyZ3VtZW50c1syXSk7XG5cdGlmIChjb3B5ICE9PSBvYmogJiYgIXByb3BlcnR5TmFtZXMpIHJldHVybiBjb3B5O1xuXHR2YXIgcmVzdWx0ID0ge307XG5cdGlmIChwcm9wZXJ0eU5hbWVzKSB7XG5cdFx0YUZyb20ocHJvcGVydHlOYW1lcywgZnVuY3Rpb24gKHByb3BlcnR5TmFtZSkge1xuXHRcdFx0aWYgKG9wdGlvbnMuZW5zdXJlIHx8IHByb3BlcnR5TmFtZSBpbiBvYmopIHJlc3VsdFtwcm9wZXJ0eU5hbWVdID0gb2JqW3Byb3BlcnR5TmFtZV07XG5cdFx0fSk7XG5cdH0gZWxzZSB7XG5cdFx0YXNzaWduKHJlc3VsdCwgb2JqKTtcblx0fVxuXHRyZXR1cm4gcmVzdWx0O1xufTtcbiIsIi8vIFdvcmthcm91bmQgZm9yIGh0dHA6Ly9jb2RlLmdvb2dsZS5jb20vcC92OC9pc3N1ZXMvZGV0YWlsP2lkPTI4MDRcblxuXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBjcmVhdGUgPSBPYmplY3QuY3JlYXRlLCBzaGltO1xuXG5pZiAoIXJlcXVpcmUoXCIuL3NldC1wcm90b3R5cGUtb2YvaXMtaW1wbGVtZW50ZWRcIikoKSkge1xuXHRzaGltID0gcmVxdWlyZShcIi4vc2V0LXByb3RvdHlwZS1vZi9zaGltXCIpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbiAoKSB7XG5cdHZhciBudWxsT2JqZWN0LCBwb2x5UHJvcHMsIGRlc2M7XG5cdGlmICghc2hpbSkgcmV0dXJuIGNyZWF0ZTtcblx0aWYgKHNoaW0ubGV2ZWwgIT09IDEpIHJldHVybiBjcmVhdGU7XG5cblx0bnVsbE9iamVjdCA9IHt9O1xuXHRwb2x5UHJvcHMgPSB7fTtcblx0ZGVzYyA9IHtcblx0XHRjb25maWd1cmFibGU6IGZhbHNlLFxuXHRcdGVudW1lcmFibGU6IGZhbHNlLFxuXHRcdHdyaXRhYmxlOiB0cnVlLFxuXHRcdHZhbHVlOiB1bmRlZmluZWRcblx0fTtcblx0T2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMoT2JqZWN0LnByb3RvdHlwZSkuZm9yRWFjaChmdW5jdGlvbiAobmFtZSkge1xuXHRcdGlmIChuYW1lID09PSBcIl9fcHJvdG9fX1wiKSB7XG5cdFx0XHRwb2x5UHJvcHNbbmFtZV0gPSB7XG5cdFx0XHRcdGNvbmZpZ3VyYWJsZTogdHJ1ZSxcblx0XHRcdFx0ZW51bWVyYWJsZTogZmFsc2UsXG5cdFx0XHRcdHdyaXRhYmxlOiB0cnVlLFxuXHRcdFx0XHR2YWx1ZTogdW5kZWZpbmVkXG5cdFx0XHR9O1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0XHRwb2x5UHJvcHNbbmFtZV0gPSBkZXNjO1xuXHR9KTtcblx0T2JqZWN0LmRlZmluZVByb3BlcnRpZXMobnVsbE9iamVjdCwgcG9seVByb3BzKTtcblxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoc2hpbSwgXCJudWxsUG9seWZpbGxcIiwge1xuXHRcdGNvbmZpZ3VyYWJsZTogZmFsc2UsXG5cdFx0ZW51bWVyYWJsZTogZmFsc2UsXG5cdFx0d3JpdGFibGU6IGZhbHNlLFxuXHRcdHZhbHVlOiBudWxsT2JqZWN0XG5cdH0pO1xuXG5cdHJldHVybiBmdW5jdGlvbiAocHJvdG90eXBlLCBwcm9wcykge1xuXHRcdHJldHVybiBjcmVhdGUocHJvdG90eXBlID09PSBudWxsID8gbnVsbE9iamVjdCA6IHByb3RvdHlwZSwgcHJvcHMpO1xuXHR9O1xufSgpKTtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCIuL19pdGVyYXRlXCIpKFwiZm9yRWFjaFwiKTtcbiIsIi8vIERlcHJlY2F0ZWRcblxuXCJ1c2Ugc3RyaWN0XCI7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKG9iaikge1xuIHJldHVybiB0eXBlb2Ygb2JqID09PSBcImZ1bmN0aW9uXCI7XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBpc1ZhbHVlID0gcmVxdWlyZShcIi4vaXMtdmFsdWVcIik7XG5cbnZhciBtYXAgPSB7IGZ1bmN0aW9uOiB0cnVlLCBvYmplY3Q6IHRydWUgfTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAodmFsdWUpIHtcblx0cmV0dXJuIChpc1ZhbHVlKHZhbHVlKSAmJiBtYXBbdHlwZW9mIHZhbHVlXSkgfHwgZmFsc2U7XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBfdW5kZWZpbmVkID0gcmVxdWlyZShcIi4uL2Z1bmN0aW9uL25vb3BcIikoKTsgLy8gU3VwcG9ydCBFUzMgZW5naW5lc1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICh2YWwpIHtcbiByZXR1cm4gKHZhbCAhPT0gX3VuZGVmaW5lZCkgJiYgKHZhbCAhPT0gbnVsbCk7XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4vaXMtaW1wbGVtZW50ZWRcIikoKSA/IE9iamVjdC5rZXlzIDogcmVxdWlyZShcIi4vc2hpbVwiKTtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICgpIHtcblx0dHJ5IHtcblx0XHRPYmplY3Qua2V5cyhcInByaW1pdGl2ZVwiKTtcblx0XHRyZXR1cm4gdHJ1ZTtcblx0fSBjYXRjaCAoZSkge1xuXHRcdHJldHVybiBmYWxzZTtcblx0fVxufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG52YXIgaXNWYWx1ZSA9IHJlcXVpcmUoXCIuLi9pcy12YWx1ZVwiKTtcblxudmFyIGtleXMgPSBPYmplY3Qua2V5cztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAob2JqZWN0KSB7IHJldHVybiBrZXlzKGlzVmFsdWUob2JqZWN0KSA/IE9iamVjdChvYmplY3QpIDogb2JqZWN0KTsgfTtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG52YXIgY2FsbGFibGUgPSByZXF1aXJlKFwiLi92YWxpZC1jYWxsYWJsZVwiKVxuICAsIGZvckVhY2ggID0gcmVxdWlyZShcIi4vZm9yLWVhY2hcIilcbiAgLCBjYWxsICAgICA9IEZ1bmN0aW9uLnByb3RvdHlwZS5jYWxsO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChvYmosIGNiIC8qLCB0aGlzQXJnKi8pIHtcblx0dmFyIHJlc3VsdCA9IHt9LCB0aGlzQXJnID0gYXJndW1lbnRzWzJdO1xuXHRjYWxsYWJsZShjYik7XG5cdGZvckVhY2gob2JqLCBmdW5jdGlvbiAodmFsdWUsIGtleSwgdGFyZ2V0T2JqLCBpbmRleCkge1xuXHRcdHJlc3VsdFtrZXldID0gY2FsbC5jYWxsKGNiLCB0aGlzQXJnLCB2YWx1ZSwga2V5LCB0YXJnZXRPYmosIGluZGV4KTtcblx0fSk7XG5cdHJldHVybiByZXN1bHQ7XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBpc1ZhbHVlID0gcmVxdWlyZShcIi4vaXMtdmFsdWVcIik7XG5cbnZhciBmb3JFYWNoID0gQXJyYXkucHJvdG90eXBlLmZvckVhY2gsIGNyZWF0ZSA9IE9iamVjdC5jcmVhdGU7XG5cbnZhciBwcm9jZXNzID0gZnVuY3Rpb24gKHNyYywgb2JqKSB7XG5cdHZhciBrZXk7XG5cdGZvciAoa2V5IGluIHNyYykgb2JqW2tleV0gPSBzcmNba2V5XTtcbn07XG5cbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bnVzZWQtdmFyc1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAob3B0czEgLyosIOKApm9wdGlvbnMqLykge1xuXHR2YXIgcmVzdWx0ID0gY3JlYXRlKG51bGwpO1xuXHRmb3JFYWNoLmNhbGwoYXJndW1lbnRzLCBmdW5jdGlvbiAob3B0aW9ucykge1xuXHRcdGlmICghaXNWYWx1ZShvcHRpb25zKSkgcmV0dXJuO1xuXHRcdHByb2Nlc3MoT2JqZWN0KG9wdGlvbnMpLCByZXN1bHQpO1xuXHR9KTtcblx0cmV0dXJuIHJlc3VsdDtcbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcblxudmFyIGZvckVhY2ggPSBBcnJheS5wcm90b3R5cGUuZm9yRWFjaCwgY3JlYXRlID0gT2JqZWN0LmNyZWF0ZTtcblxuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVudXNlZC12YXJzXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChhcmcgLyosIOKApmFyZ3MqLykge1xuXHR2YXIgc2V0ID0gY3JlYXRlKG51bGwpO1xuXHRmb3JFYWNoLmNhbGwoYXJndW1lbnRzLCBmdW5jdGlvbiAobmFtZSkge1xuXHRcdHNldFtuYW1lXSA9IHRydWU7XG5cdH0pO1xuXHRyZXR1cm4gc2V0O1xufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCIuL2lzLWltcGxlbWVudGVkXCIpKClcblx0PyBPYmplY3Quc2V0UHJvdG90eXBlT2Zcblx0OiByZXF1aXJlKFwiLi9zaGltXCIpO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBjcmVhdGUgPSBPYmplY3QuY3JlYXRlLCBnZXRQcm90b3R5cGVPZiA9IE9iamVjdC5nZXRQcm90b3R5cGVPZiwgcGxhaW5PYmplY3QgPSB7fTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoLyogQ3VzdG9tQ3JlYXRlKi8pIHtcblx0dmFyIHNldFByb3RvdHlwZU9mID0gT2JqZWN0LnNldFByb3RvdHlwZU9mLCBjdXN0b21DcmVhdGUgPSBhcmd1bWVudHNbMF0gfHwgY3JlYXRlO1xuXHRpZiAodHlwZW9mIHNldFByb3RvdHlwZU9mICE9PSBcImZ1bmN0aW9uXCIpIHJldHVybiBmYWxzZTtcblx0cmV0dXJuIGdldFByb3RvdHlwZU9mKHNldFByb3RvdHlwZU9mKGN1c3RvbUNyZWF0ZShudWxsKSwgcGxhaW5PYmplY3QpKSA9PT0gcGxhaW5PYmplY3Q7XG59O1xuIiwiLyogZXNsaW50IG5vLXByb3RvOiBcIm9mZlwiICovXG5cbi8vIEJpZyB0aGFua3MgdG8gQFdlYlJlZmxlY3Rpb24gZm9yIHNvcnRpbmcgdGhpcyBvdXRcbi8vIGh0dHBzOi8vZ2lzdC5naXRodWIuY29tL1dlYlJlZmxlY3Rpb24vNTU5MzU1NFxuXG5cInVzZSBzdHJpY3RcIjtcblxudmFyIGlzT2JqZWN0ICAgICAgICA9IHJlcXVpcmUoXCIuLi9pcy1vYmplY3RcIilcbiAgLCB2YWx1ZSAgICAgICAgICAgPSByZXF1aXJlKFwiLi4vdmFsaWQtdmFsdWVcIilcbiAgLCBvYmpJc1Byb3RvdHlwZU9mID0gT2JqZWN0LnByb3RvdHlwZS5pc1Byb3RvdHlwZU9mXG4gICwgZGVmaW5lUHJvcGVydHkgID0gT2JqZWN0LmRlZmluZVByb3BlcnR5XG4gICwgbnVsbERlc2MgICAgICAgID0ge1xuXHRjb25maWd1cmFibGU6IHRydWUsXG5cdGVudW1lcmFibGU6IGZhbHNlLFxuXHR3cml0YWJsZTogdHJ1ZSxcblx0dmFsdWU6IHVuZGVmaW5lZFxufVxuICAsIHZhbGlkYXRlO1xuXG52YWxpZGF0ZSA9IGZ1bmN0aW9uIChvYmosIHByb3RvdHlwZSkge1xuXHR2YWx1ZShvYmopO1xuXHRpZiAocHJvdG90eXBlID09PSBudWxsIHx8IGlzT2JqZWN0KHByb3RvdHlwZSkpIHJldHVybiBvYmo7XG5cdHRocm93IG5ldyBUeXBlRXJyb3IoXCJQcm90b3R5cGUgbXVzdCBiZSBudWxsIG9yIGFuIG9iamVjdFwiKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uIChzdGF0dXMpIHtcblx0dmFyIGZuLCBzZXQ7XG5cdGlmICghc3RhdHVzKSByZXR1cm4gbnVsbDtcblx0aWYgKHN0YXR1cy5sZXZlbCA9PT0gMikge1xuXHRcdGlmIChzdGF0dXMuc2V0KSB7XG5cdFx0XHRzZXQgPSBzdGF0dXMuc2V0O1xuXHRcdFx0Zm4gPSBmdW5jdGlvbiAob2JqLCBwcm90b3R5cGUpIHtcblx0XHRcdFx0c2V0LmNhbGwodmFsaWRhdGUob2JqLCBwcm90b3R5cGUpLCBwcm90b3R5cGUpO1xuXHRcdFx0XHRyZXR1cm4gb2JqO1xuXHRcdFx0fTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0Zm4gPSBmdW5jdGlvbiAob2JqLCBwcm90b3R5cGUpIHtcblx0XHRcdFx0dmFsaWRhdGUob2JqLCBwcm90b3R5cGUpLl9fcHJvdG9fXyA9IHByb3RvdHlwZTtcblx0XHRcdFx0cmV0dXJuIG9iajtcblx0XHRcdH07XG5cdFx0fVxuXHR9IGVsc2Uge1xuXHRcdGZuID0gZnVuY3Rpb24gc2VsZihvYmosIHByb3RvdHlwZSkge1xuXHRcdFx0dmFyIGlzTnVsbEJhc2U7XG5cdFx0XHR2YWxpZGF0ZShvYmosIHByb3RvdHlwZSk7XG5cdFx0XHRpc051bGxCYXNlID0gb2JqSXNQcm90b3R5cGVPZi5jYWxsKHNlbGYubnVsbFBvbHlmaWxsLCBvYmopO1xuXHRcdFx0aWYgKGlzTnVsbEJhc2UpIGRlbGV0ZSBzZWxmLm51bGxQb2x5ZmlsbC5fX3Byb3RvX187XG5cdFx0XHRpZiAocHJvdG90eXBlID09PSBudWxsKSBwcm90b3R5cGUgPSBzZWxmLm51bGxQb2x5ZmlsbDtcblx0XHRcdG9iai5fX3Byb3RvX18gPSBwcm90b3R5cGU7XG5cdFx0XHRpZiAoaXNOdWxsQmFzZSkgZGVmaW5lUHJvcGVydHkoc2VsZi5udWxsUG9seWZpbGwsIFwiX19wcm90b19fXCIsIG51bGxEZXNjKTtcblx0XHRcdHJldHVybiBvYmo7XG5cdFx0fTtcblx0fVxuXHRyZXR1cm4gT2JqZWN0LmRlZmluZVByb3BlcnR5KGZuLCBcImxldmVsXCIsIHtcblx0XHRjb25maWd1cmFibGU6IGZhbHNlLFxuXHRcdGVudW1lcmFibGU6IGZhbHNlLFxuXHRcdHdyaXRhYmxlOiBmYWxzZSxcblx0XHR2YWx1ZTogc3RhdHVzLmxldmVsXG5cdH0pO1xufShcblx0KGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgdG1wT2JqMSA9IE9iamVjdC5jcmVhdGUobnVsbClcblx0XHQgICwgdG1wT2JqMiA9IHt9XG5cdFx0ICAsIHNldFxuXHRcdCAgLCBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihPYmplY3QucHJvdG90eXBlLCBcIl9fcHJvdG9fX1wiKTtcblxuXHRcdGlmIChkZXNjKSB7XG5cdFx0XHR0cnkge1xuXHRcdFx0XHRzZXQgPSBkZXNjLnNldDsgLy8gT3BlcmEgY3Jhc2hlcyBhdCB0aGlzIHBvaW50XG5cdFx0XHRcdHNldC5jYWxsKHRtcE9iajEsIHRtcE9iajIpO1xuXHRcdFx0fSBjYXRjaCAoaWdub3JlKSB7fVxuXHRcdFx0aWYgKE9iamVjdC5nZXRQcm90b3R5cGVPZih0bXBPYmoxKSA9PT0gdG1wT2JqMikgcmV0dXJuIHsgc2V0OiBzZXQsIGxldmVsOiAyIH07XG5cdFx0fVxuXG5cdFx0dG1wT2JqMS5fX3Byb3RvX18gPSB0bXBPYmoyO1xuXHRcdGlmIChPYmplY3QuZ2V0UHJvdG90eXBlT2YodG1wT2JqMSkgPT09IHRtcE9iajIpIHJldHVybiB7IGxldmVsOiAyIH07XG5cblx0XHR0bXBPYmoxID0ge307XG5cdFx0dG1wT2JqMS5fX3Byb3RvX18gPSB0bXBPYmoyO1xuXHRcdGlmIChPYmplY3QuZ2V0UHJvdG90eXBlT2YodG1wT2JqMSkgPT09IHRtcE9iajIpIHJldHVybiB7IGxldmVsOiAxIH07XG5cblx0XHRyZXR1cm4gZmFsc2U7XG5cdH0pKClcbikpO1xuXG5yZXF1aXJlKFwiLi4vY3JlYXRlXCIpO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGZuKSB7XG5cdGlmICh0eXBlb2YgZm4gIT09IFwiZnVuY3Rpb25cIikgdGhyb3cgbmV3IFR5cGVFcnJvcihmbiArIFwiIGlzIG5vdCBhIGZ1bmN0aW9uXCIpO1xuXHRyZXR1cm4gZm47XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBpc1ZhbHVlID0gcmVxdWlyZShcIi4vaXMtdmFsdWVcIik7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHZhbHVlKSB7XG5cdGlmICghaXNWYWx1ZSh2YWx1ZSkpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgdXNlIG51bGwgb3IgdW5kZWZpbmVkXCIpO1xuXHRyZXR1cm4gdmFsdWU7XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4vaXMtaW1wbGVtZW50ZWRcIikoKVxuXHQ/IFN0cmluZy5wcm90b3R5cGUuY29udGFpbnNcblx0OiByZXF1aXJlKFwiLi9zaGltXCIpO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBzdHIgPSBcInJhemR3YXRyenlcIjtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoKSB7XG5cdGlmICh0eXBlb2Ygc3RyLmNvbnRhaW5zICE9PSBcImZ1bmN0aW9uXCIpIHJldHVybiBmYWxzZTtcblx0cmV0dXJuIChzdHIuY29udGFpbnMoXCJkd2FcIikgPT09IHRydWUpICYmIChzdHIuY29udGFpbnMoXCJmb29cIikgPT09IGZhbHNlKTtcbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcblxudmFyIGluZGV4T2YgPSBTdHJpbmcucHJvdG90eXBlLmluZGV4T2Y7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHNlYXJjaFN0cmluZy8qLCBwb3NpdGlvbiovKSB7XG5cdHJldHVybiBpbmRleE9mLmNhbGwodGhpcywgc2VhcmNoU3RyaW5nLCBhcmd1bWVudHNbMV0pID4gLTE7XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBvYmpUb1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcsIGlkID0gb2JqVG9TdHJpbmcuY2FsbChcIlwiKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAodmFsdWUpIHtcblx0cmV0dXJuIChcblx0XHR0eXBlb2YgdmFsdWUgPT09IFwic3RyaW5nXCIgfHxcblx0XHQodmFsdWUgJiZcblx0XHRcdHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIiAmJlxuXHRcdFx0KHZhbHVlIGluc3RhbmNlb2YgU3RyaW5nIHx8IG9ialRvU3RyaW5nLmNhbGwodmFsdWUpID09PSBpZCkpIHx8XG5cdFx0ZmFsc2Vcblx0KTtcbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcblxudmFyIHNldFByb3RvdHlwZU9mID0gcmVxdWlyZShcImVzNS1leHQvb2JqZWN0L3NldC1wcm90b3R5cGUtb2ZcIilcbiAgLCBjb250YWlucyAgICAgICA9IHJlcXVpcmUoXCJlczUtZXh0L3N0cmluZy8jL2NvbnRhaW5zXCIpXG4gICwgZCAgICAgICAgICAgICAgPSByZXF1aXJlKFwiZFwiKVxuICAsIFN5bWJvbCAgICAgICAgID0gcmVxdWlyZShcImVzNi1zeW1ib2xcIilcbiAgLCBJdGVyYXRvciAgICAgICA9IHJlcXVpcmUoXCIuL1wiKTtcblxudmFyIGRlZmluZVByb3BlcnR5ID0gT2JqZWN0LmRlZmluZVByb3BlcnR5LCBBcnJheUl0ZXJhdG9yO1xuXG5BcnJheUl0ZXJhdG9yID0gbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoYXJyLCBraW5kKSB7XG5cdGlmICghKHRoaXMgaW5zdGFuY2VvZiBBcnJheUl0ZXJhdG9yKSkgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNvbnN0cnVjdG9yIHJlcXVpcmVzICduZXcnXCIpO1xuXHRJdGVyYXRvci5jYWxsKHRoaXMsIGFycik7XG5cdGlmICgha2luZCkga2luZCA9IFwidmFsdWVcIjtcblx0ZWxzZSBpZiAoY29udGFpbnMuY2FsbChraW5kLCBcImtleSt2YWx1ZVwiKSkga2luZCA9IFwia2V5K3ZhbHVlXCI7XG5cdGVsc2UgaWYgKGNvbnRhaW5zLmNhbGwoa2luZCwgXCJrZXlcIikpIGtpbmQgPSBcImtleVwiO1xuXHRlbHNlIGtpbmQgPSBcInZhbHVlXCI7XG5cdGRlZmluZVByb3BlcnR5KHRoaXMsIFwiX19raW5kX19cIiwgZChcIlwiLCBraW5kKSk7XG59O1xuaWYgKHNldFByb3RvdHlwZU9mKSBzZXRQcm90b3R5cGVPZihBcnJheUl0ZXJhdG9yLCBJdGVyYXRvcik7XG5cbi8vIEludGVybmFsICVBcnJheUl0ZXJhdG9yUHJvdG90eXBlJSBkb2Vzbid0IGV4cG9zZSBpdHMgY29uc3RydWN0b3JcbmRlbGV0ZSBBcnJheUl0ZXJhdG9yLnByb3RvdHlwZS5jb25zdHJ1Y3RvcjtcblxuQXJyYXlJdGVyYXRvci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEl0ZXJhdG9yLnByb3RvdHlwZSwge1xuXHRfcmVzb2x2ZTogZChmdW5jdGlvbiAoaSkge1xuXHRcdGlmICh0aGlzLl9fa2luZF9fID09PSBcInZhbHVlXCIpIHJldHVybiB0aGlzLl9fbGlzdF9fW2ldO1xuXHRcdGlmICh0aGlzLl9fa2luZF9fID09PSBcImtleSt2YWx1ZVwiKSByZXR1cm4gW2ksIHRoaXMuX19saXN0X19baV1dO1xuXHRcdHJldHVybiBpO1xuXHR9KVxufSk7XG5kZWZpbmVQcm9wZXJ0eShBcnJheUl0ZXJhdG9yLnByb3RvdHlwZSwgU3ltYm9sLnRvU3RyaW5nVGFnLCBkKFwiY1wiLCBcIkFycmF5IEl0ZXJhdG9yXCIpKTtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG52YXIgaXNBcmd1bWVudHMgPSByZXF1aXJlKFwiZXM1LWV4dC9mdW5jdGlvbi9pcy1hcmd1bWVudHNcIilcbiAgLCBjYWxsYWJsZSAgICA9IHJlcXVpcmUoXCJlczUtZXh0L29iamVjdC92YWxpZC1jYWxsYWJsZVwiKVxuICAsIGlzU3RyaW5nICAgID0gcmVxdWlyZShcImVzNS1leHQvc3RyaW5nL2lzLXN0cmluZ1wiKVxuICAsIGdldCAgICAgICAgID0gcmVxdWlyZShcIi4vZ2V0XCIpO1xuXG52YXIgaXNBcnJheSA9IEFycmF5LmlzQXJyYXksIGNhbGwgPSBGdW5jdGlvbi5wcm90b3R5cGUuY2FsbCwgc29tZSA9IEFycmF5LnByb3RvdHlwZS5zb21lO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChpdGVyYWJsZSwgY2IgLyosIHRoaXNBcmcqLykge1xuXHR2YXIgbW9kZSwgdGhpc0FyZyA9IGFyZ3VtZW50c1syXSwgcmVzdWx0LCBkb0JyZWFrLCBicm9rZW4sIGksIGxlbmd0aCwgY2hhciwgY29kZTtcblx0aWYgKGlzQXJyYXkoaXRlcmFibGUpIHx8IGlzQXJndW1lbnRzKGl0ZXJhYmxlKSkgbW9kZSA9IFwiYXJyYXlcIjtcblx0ZWxzZSBpZiAoaXNTdHJpbmcoaXRlcmFibGUpKSBtb2RlID0gXCJzdHJpbmdcIjtcblx0ZWxzZSBpdGVyYWJsZSA9IGdldChpdGVyYWJsZSk7XG5cblx0Y2FsbGFibGUoY2IpO1xuXHRkb0JyZWFrID0gZnVuY3Rpb24gKCkge1xuXHRcdGJyb2tlbiA9IHRydWU7XG5cdH07XG5cdGlmIChtb2RlID09PSBcImFycmF5XCIpIHtcblx0XHRzb21lLmNhbGwoaXRlcmFibGUsIGZ1bmN0aW9uICh2YWx1ZSkge1xuXHRcdFx0Y2FsbC5jYWxsKGNiLCB0aGlzQXJnLCB2YWx1ZSwgZG9CcmVhayk7XG5cdFx0XHRyZXR1cm4gYnJva2VuO1xuXHRcdH0pO1xuXHRcdHJldHVybjtcblx0fVxuXHRpZiAobW9kZSA9PT0gXCJzdHJpbmdcIikge1xuXHRcdGxlbmd0aCA9IGl0ZXJhYmxlLmxlbmd0aDtcblx0XHRmb3IgKGkgPSAwOyBpIDwgbGVuZ3RoOyArK2kpIHtcblx0XHRcdGNoYXIgPSBpdGVyYWJsZVtpXTtcblx0XHRcdGlmIChpICsgMSA8IGxlbmd0aCkge1xuXHRcdFx0XHRjb2RlID0gY2hhci5jaGFyQ29kZUF0KDApO1xuXHRcdFx0XHRpZiAoY29kZSA+PSAweGQ4MDAgJiYgY29kZSA8PSAweGRiZmYpIGNoYXIgKz0gaXRlcmFibGVbKytpXTtcblx0XHRcdH1cblx0XHRcdGNhbGwuY2FsbChjYiwgdGhpc0FyZywgY2hhciwgZG9CcmVhayk7XG5cdFx0XHRpZiAoYnJva2VuKSBicmVhaztcblx0XHR9XG5cdFx0cmV0dXJuO1xuXHR9XG5cdHJlc3VsdCA9IGl0ZXJhYmxlLm5leHQoKTtcblxuXHR3aGlsZSAoIXJlc3VsdC5kb25lKSB7XG5cdFx0Y2FsbC5jYWxsKGNiLCB0aGlzQXJnLCByZXN1bHQudmFsdWUsIGRvQnJlYWspO1xuXHRcdGlmIChicm9rZW4pIHJldHVybjtcblx0XHRyZXN1bHQgPSBpdGVyYWJsZS5uZXh0KCk7XG5cdH1cbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcblxudmFyIGlzQXJndW1lbnRzICAgID0gcmVxdWlyZShcImVzNS1leHQvZnVuY3Rpb24vaXMtYXJndW1lbnRzXCIpXG4gICwgaXNTdHJpbmcgICAgICAgPSByZXF1aXJlKFwiZXM1LWV4dC9zdHJpbmcvaXMtc3RyaW5nXCIpXG4gICwgQXJyYXlJdGVyYXRvciAgPSByZXF1aXJlKFwiLi9hcnJheVwiKVxuICAsIFN0cmluZ0l0ZXJhdG9yID0gcmVxdWlyZShcIi4vc3RyaW5nXCIpXG4gICwgaXRlcmFibGUgICAgICAgPSByZXF1aXJlKFwiLi92YWxpZC1pdGVyYWJsZVwiKVxuICAsIGl0ZXJhdG9yU3ltYm9sID0gcmVxdWlyZShcImVzNi1zeW1ib2xcIikuaXRlcmF0b3I7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKG9iaikge1xuXHRpZiAodHlwZW9mIGl0ZXJhYmxlKG9iailbaXRlcmF0b3JTeW1ib2xdID09PSBcImZ1bmN0aW9uXCIpIHJldHVybiBvYmpbaXRlcmF0b3JTeW1ib2xdKCk7XG5cdGlmIChpc0FyZ3VtZW50cyhvYmopKSByZXR1cm4gbmV3IEFycmF5SXRlcmF0b3Iob2JqKTtcblx0aWYgKGlzU3RyaW5nKG9iaikpIHJldHVybiBuZXcgU3RyaW5nSXRlcmF0b3Iob2JqKTtcblx0cmV0dXJuIG5ldyBBcnJheUl0ZXJhdG9yKG9iaik7XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBjbGVhciAgICA9IHJlcXVpcmUoXCJlczUtZXh0L2FycmF5LyMvY2xlYXJcIilcbiAgLCBhc3NpZ24gICA9IHJlcXVpcmUoXCJlczUtZXh0L29iamVjdC9hc3NpZ25cIilcbiAgLCBjYWxsYWJsZSA9IHJlcXVpcmUoXCJlczUtZXh0L29iamVjdC92YWxpZC1jYWxsYWJsZVwiKVxuICAsIHZhbHVlICAgID0gcmVxdWlyZShcImVzNS1leHQvb2JqZWN0L3ZhbGlkLXZhbHVlXCIpXG4gICwgZCAgICAgICAgPSByZXF1aXJlKFwiZFwiKVxuICAsIGF1dG9CaW5kID0gcmVxdWlyZShcImQvYXV0by1iaW5kXCIpXG4gICwgU3ltYm9sICAgPSByZXF1aXJlKFwiZXM2LXN5bWJvbFwiKTtcblxudmFyIGRlZmluZVByb3BlcnR5ID0gT2JqZWN0LmRlZmluZVByb3BlcnR5LCBkZWZpbmVQcm9wZXJ0aWVzID0gT2JqZWN0LmRlZmluZVByb3BlcnRpZXMsIEl0ZXJhdG9yO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEl0ZXJhdG9yID0gZnVuY3Rpb24gKGxpc3QsIGNvbnRleHQpIHtcblx0aWYgKCEodGhpcyBpbnN0YW5jZW9mIEl0ZXJhdG9yKSkgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNvbnN0cnVjdG9yIHJlcXVpcmVzICduZXcnXCIpO1xuXHRkZWZpbmVQcm9wZXJ0aWVzKHRoaXMsIHtcblx0XHRfX2xpc3RfXzogZChcIndcIiwgdmFsdWUobGlzdCkpLFxuXHRcdF9fY29udGV4dF9fOiBkKFwid1wiLCBjb250ZXh0KSxcblx0XHRfX25leHRJbmRleF9fOiBkKFwid1wiLCAwKVxuXHR9KTtcblx0aWYgKCFjb250ZXh0KSByZXR1cm47XG5cdGNhbGxhYmxlKGNvbnRleHQub24pO1xuXHRjb250ZXh0Lm9uKFwiX2FkZFwiLCB0aGlzLl9vbkFkZCk7XG5cdGNvbnRleHQub24oXCJfZGVsZXRlXCIsIHRoaXMuX29uRGVsZXRlKTtcblx0Y29udGV4dC5vbihcIl9jbGVhclwiLCB0aGlzLl9vbkNsZWFyKTtcbn07XG5cbi8vIEludGVybmFsICVJdGVyYXRvclByb3RvdHlwZSUgZG9lc24ndCBleHBvc2UgaXRzIGNvbnN0cnVjdG9yXG5kZWxldGUgSXRlcmF0b3IucHJvdG90eXBlLmNvbnN0cnVjdG9yO1xuXG5kZWZpbmVQcm9wZXJ0aWVzKFxuXHRJdGVyYXRvci5wcm90b3R5cGUsXG5cdGFzc2lnbihcblx0XHR7XG5cdFx0XHRfbmV4dDogZChmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdHZhciBpO1xuXHRcdFx0XHRpZiAoIXRoaXMuX19saXN0X18pIHJldHVybiB1bmRlZmluZWQ7XG5cdFx0XHRcdGlmICh0aGlzLl9fcmVkb19fKSB7XG5cdFx0XHRcdFx0aSA9IHRoaXMuX19yZWRvX18uc2hpZnQoKTtcblx0XHRcdFx0XHRpZiAoaSAhPT0gdW5kZWZpbmVkKSByZXR1cm4gaTtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAodGhpcy5fX25leHRJbmRleF9fIDwgdGhpcy5fX2xpc3RfXy5sZW5ndGgpIHJldHVybiB0aGlzLl9fbmV4dEluZGV4X18rKztcblx0XHRcdFx0dGhpcy5fdW5CaW5kKCk7XG5cdFx0XHRcdHJldHVybiB1bmRlZmluZWQ7XG5cdFx0XHR9KSxcblx0XHRcdG5leHQ6IGQoZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRyZXR1cm4gdGhpcy5fY3JlYXRlUmVzdWx0KHRoaXMuX25leHQoKSk7XG5cdFx0XHR9KSxcblx0XHRcdF9jcmVhdGVSZXN1bHQ6IGQoZnVuY3Rpb24gKGkpIHtcblx0XHRcdFx0aWYgKGkgPT09IHVuZGVmaW5lZCkgcmV0dXJuIHsgZG9uZTogdHJ1ZSwgdmFsdWU6IHVuZGVmaW5lZCB9O1xuXHRcdFx0XHRyZXR1cm4geyBkb25lOiBmYWxzZSwgdmFsdWU6IHRoaXMuX3Jlc29sdmUoaSkgfTtcblx0XHRcdH0pLFxuXHRcdFx0X3Jlc29sdmU6IGQoZnVuY3Rpb24gKGkpIHtcblx0XHRcdFx0cmV0dXJuIHRoaXMuX19saXN0X19baV07XG5cdFx0XHR9KSxcblx0XHRcdF91bkJpbmQ6IGQoZnVuY3Rpb24gKCkge1xuXHRcdFx0XHR0aGlzLl9fbGlzdF9fID0gbnVsbDtcblx0XHRcdFx0ZGVsZXRlIHRoaXMuX19yZWRvX187XG5cdFx0XHRcdGlmICghdGhpcy5fX2NvbnRleHRfXykgcmV0dXJuO1xuXHRcdFx0XHR0aGlzLl9fY29udGV4dF9fLm9mZihcIl9hZGRcIiwgdGhpcy5fb25BZGQpO1xuXHRcdFx0XHR0aGlzLl9fY29udGV4dF9fLm9mZihcIl9kZWxldGVcIiwgdGhpcy5fb25EZWxldGUpO1xuXHRcdFx0XHR0aGlzLl9fY29udGV4dF9fLm9mZihcIl9jbGVhclwiLCB0aGlzLl9vbkNsZWFyKTtcblx0XHRcdFx0dGhpcy5fX2NvbnRleHRfXyA9IG51bGw7XG5cdFx0XHR9KSxcblx0XHRcdHRvU3RyaW5nOiBkKGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0cmV0dXJuIFwiW29iamVjdCBcIiArICh0aGlzW1N5bWJvbC50b1N0cmluZ1RhZ10gfHwgXCJPYmplY3RcIikgKyBcIl1cIjtcblx0XHRcdH0pXG5cdFx0fSxcblx0XHRhdXRvQmluZCh7XG5cdFx0XHRfb25BZGQ6IGQoZnVuY3Rpb24gKGluZGV4KSB7XG5cdFx0XHRcdGlmIChpbmRleCA+PSB0aGlzLl9fbmV4dEluZGV4X18pIHJldHVybjtcblx0XHRcdFx0Kyt0aGlzLl9fbmV4dEluZGV4X187XG5cdFx0XHRcdGlmICghdGhpcy5fX3JlZG9fXykge1xuXHRcdFx0XHRcdGRlZmluZVByb3BlcnR5KHRoaXMsIFwiX19yZWRvX19cIiwgZChcImNcIiwgW2luZGV4XSkpO1xuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXHRcdFx0XHR0aGlzLl9fcmVkb19fLmZvckVhY2goZnVuY3Rpb24gKHJlZG8sIGkpIHtcblx0XHRcdFx0XHRpZiAocmVkbyA+PSBpbmRleCkgdGhpcy5fX3JlZG9fX1tpXSA9ICsrcmVkbztcblx0XHRcdFx0fSwgdGhpcyk7XG5cdFx0XHRcdHRoaXMuX19yZWRvX18ucHVzaChpbmRleCk7XG5cdFx0XHR9KSxcblx0XHRcdF9vbkRlbGV0ZTogZChmdW5jdGlvbiAoaW5kZXgpIHtcblx0XHRcdFx0dmFyIGk7XG5cdFx0XHRcdGlmIChpbmRleCA+PSB0aGlzLl9fbmV4dEluZGV4X18pIHJldHVybjtcblx0XHRcdFx0LS10aGlzLl9fbmV4dEluZGV4X187XG5cdFx0XHRcdGlmICghdGhpcy5fX3JlZG9fXykgcmV0dXJuO1xuXHRcdFx0XHRpID0gdGhpcy5fX3JlZG9fXy5pbmRleE9mKGluZGV4KTtcblx0XHRcdFx0aWYgKGkgIT09IC0xKSB0aGlzLl9fcmVkb19fLnNwbGljZShpLCAxKTtcblx0XHRcdFx0dGhpcy5fX3JlZG9fXy5mb3JFYWNoKGZ1bmN0aW9uIChyZWRvLCBqKSB7XG5cdFx0XHRcdFx0aWYgKHJlZG8gPiBpbmRleCkgdGhpcy5fX3JlZG9fX1tqXSA9IC0tcmVkbztcblx0XHRcdFx0fSwgdGhpcyk7XG5cdFx0XHR9KSxcblx0XHRcdF9vbkNsZWFyOiBkKGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0aWYgKHRoaXMuX19yZWRvX18pIGNsZWFyLmNhbGwodGhpcy5fX3JlZG9fXyk7XG5cdFx0XHRcdHRoaXMuX19uZXh0SW5kZXhfXyA9IDA7XG5cdFx0XHR9KVxuXHRcdH0pXG5cdClcbik7XG5cbmRlZmluZVByb3BlcnR5KFxuXHRJdGVyYXRvci5wcm90b3R5cGUsXG5cdFN5bWJvbC5pdGVyYXRvcixcblx0ZChmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH0pXG4pO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBpc0FyZ3VtZW50cyA9IHJlcXVpcmUoXCJlczUtZXh0L2Z1bmN0aW9uL2lzLWFyZ3VtZW50c1wiKVxuICAsIGlzVmFsdWUgICAgID0gcmVxdWlyZShcImVzNS1leHQvb2JqZWN0L2lzLXZhbHVlXCIpXG4gICwgaXNTdHJpbmcgICAgPSByZXF1aXJlKFwiZXM1LWV4dC9zdHJpbmcvaXMtc3RyaW5nXCIpO1xuXG52YXIgaXRlcmF0b3JTeW1ib2wgPSByZXF1aXJlKFwiZXM2LXN5bWJvbFwiKS5pdGVyYXRvclxuICAsIGlzQXJyYXkgICAgICAgID0gQXJyYXkuaXNBcnJheTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAodmFsdWUpIHtcblx0aWYgKCFpc1ZhbHVlKHZhbHVlKSkgcmV0dXJuIGZhbHNlO1xuXHRpZiAoaXNBcnJheSh2YWx1ZSkpIHJldHVybiB0cnVlO1xuXHRpZiAoaXNTdHJpbmcodmFsdWUpKSByZXR1cm4gdHJ1ZTtcblx0aWYgKGlzQXJndW1lbnRzKHZhbHVlKSkgcmV0dXJuIHRydWU7XG5cdHJldHVybiB0eXBlb2YgdmFsdWVbaXRlcmF0b3JTeW1ib2xdID09PSBcImZ1bmN0aW9uXCI7XG59O1xuIiwiLy8gVGhhbmtzIEBtYXRoaWFzYnluZW5zXG4vLyBodHRwOi8vbWF0aGlhc2J5bmVucy5iZS9ub3Rlcy9qYXZhc2NyaXB0LXVuaWNvZGUjaXRlcmF0aW5nLW92ZXItc3ltYm9sc1xuXG5cInVzZSBzdHJpY3RcIjtcblxudmFyIHNldFByb3RvdHlwZU9mID0gcmVxdWlyZShcImVzNS1leHQvb2JqZWN0L3NldC1wcm90b3R5cGUtb2ZcIilcbiAgLCBkICAgICAgICAgICAgICA9IHJlcXVpcmUoXCJkXCIpXG4gICwgU3ltYm9sICAgICAgICAgPSByZXF1aXJlKFwiZXM2LXN5bWJvbFwiKVxuICAsIEl0ZXJhdG9yICAgICAgID0gcmVxdWlyZShcIi4vXCIpO1xuXG52YXIgZGVmaW5lUHJvcGVydHkgPSBPYmplY3QuZGVmaW5lUHJvcGVydHksIFN0cmluZ0l0ZXJhdG9yO1xuXG5TdHJpbmdJdGVyYXRvciA9IG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHN0cikge1xuXHRpZiAoISh0aGlzIGluc3RhbmNlb2YgU3RyaW5nSXRlcmF0b3IpKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ29uc3RydWN0b3IgcmVxdWlyZXMgJ25ldydcIik7XG5cdHN0ciA9IFN0cmluZyhzdHIpO1xuXHRJdGVyYXRvci5jYWxsKHRoaXMsIHN0cik7XG5cdGRlZmluZVByb3BlcnR5KHRoaXMsIFwiX19sZW5ndGhfX1wiLCBkKFwiXCIsIHN0ci5sZW5ndGgpKTtcbn07XG5pZiAoc2V0UHJvdG90eXBlT2YpIHNldFByb3RvdHlwZU9mKFN0cmluZ0l0ZXJhdG9yLCBJdGVyYXRvcik7XG5cbi8vIEludGVybmFsICVBcnJheUl0ZXJhdG9yUHJvdG90eXBlJSBkb2Vzbid0IGV4cG9zZSBpdHMgY29uc3RydWN0b3JcbmRlbGV0ZSBTdHJpbmdJdGVyYXRvci5wcm90b3R5cGUuY29uc3RydWN0b3I7XG5cblN0cmluZ0l0ZXJhdG9yLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoSXRlcmF0b3IucHJvdG90eXBlLCB7XG5cdF9uZXh0OiBkKGZ1bmN0aW9uICgpIHtcblx0XHRpZiAoIXRoaXMuX19saXN0X18pIHJldHVybiB1bmRlZmluZWQ7XG5cdFx0aWYgKHRoaXMuX19uZXh0SW5kZXhfXyA8IHRoaXMuX19sZW5ndGhfXykgcmV0dXJuIHRoaXMuX19uZXh0SW5kZXhfXysrO1xuXHRcdHRoaXMuX3VuQmluZCgpO1xuXHRcdHJldHVybiB1bmRlZmluZWQ7XG5cdH0pLFxuXHRfcmVzb2x2ZTogZChmdW5jdGlvbiAoaSkge1xuXHRcdHZhciBjaGFyID0gdGhpcy5fX2xpc3RfX1tpXSwgY29kZTtcblx0XHRpZiAodGhpcy5fX25leHRJbmRleF9fID09PSB0aGlzLl9fbGVuZ3RoX18pIHJldHVybiBjaGFyO1xuXHRcdGNvZGUgPSBjaGFyLmNoYXJDb2RlQXQoMCk7XG5cdFx0aWYgKGNvZGUgPj0gMHhkODAwICYmIGNvZGUgPD0gMHhkYmZmKSByZXR1cm4gY2hhciArIHRoaXMuX19saXN0X19bdGhpcy5fX25leHRJbmRleF9fKytdO1xuXHRcdHJldHVybiBjaGFyO1xuXHR9KVxufSk7XG5kZWZpbmVQcm9wZXJ0eShTdHJpbmdJdGVyYXRvci5wcm90b3R5cGUsIFN5bWJvbC50b1N0cmluZ1RhZywgZChcImNcIiwgXCJTdHJpbmcgSXRlcmF0b3JcIikpO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBpc0l0ZXJhYmxlID0gcmVxdWlyZShcIi4vaXMtaXRlcmFibGVcIik7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHZhbHVlKSB7XG5cdGlmICghaXNJdGVyYWJsZSh2YWx1ZSkpIHRocm93IG5ldyBUeXBlRXJyb3IodmFsdWUgKyBcIiBpcyBub3QgaXRlcmFibGVcIik7XG5cdHJldHVybiB2YWx1ZTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9pcy1pbXBsZW1lbnRlZCcpKCkgPyBNYXAgOiByZXF1aXJlKCcuL3BvbHlmaWxsJyk7XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKCkge1xuXHR2YXIgbWFwLCBpdGVyYXRvciwgcmVzdWx0O1xuXHRpZiAodHlwZW9mIE1hcCAhPT0gJ2Z1bmN0aW9uJykgcmV0dXJuIGZhbHNlO1xuXHR0cnkge1xuXHRcdC8vIFdlYktpdCBkb2Vzbid0IHN1cHBvcnQgYXJndW1lbnRzIGFuZCBjcmFzaGVzXG5cdFx0bWFwID0gbmV3IE1hcChbWydyYXonLCAnb25lJ10sIFsnZHdhJywgJ3R3byddLCBbJ3RyenknLCAndGhyZWUnXV0pO1xuXHR9IGNhdGNoIChlKSB7XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG5cdGlmIChTdHJpbmcobWFwKSAhPT0gJ1tvYmplY3QgTWFwXScpIHJldHVybiBmYWxzZTtcblx0aWYgKG1hcC5zaXplICE9PSAzKSByZXR1cm4gZmFsc2U7XG5cdGlmICh0eXBlb2YgbWFwLmNsZWFyICE9PSAnZnVuY3Rpb24nKSByZXR1cm4gZmFsc2U7XG5cdGlmICh0eXBlb2YgbWFwLmRlbGV0ZSAhPT0gJ2Z1bmN0aW9uJykgcmV0dXJuIGZhbHNlO1xuXHRpZiAodHlwZW9mIG1hcC5lbnRyaWVzICE9PSAnZnVuY3Rpb24nKSByZXR1cm4gZmFsc2U7XG5cdGlmICh0eXBlb2YgbWFwLmZvckVhY2ggIT09ICdmdW5jdGlvbicpIHJldHVybiBmYWxzZTtcblx0aWYgKHR5cGVvZiBtYXAuZ2V0ICE9PSAnZnVuY3Rpb24nKSByZXR1cm4gZmFsc2U7XG5cdGlmICh0eXBlb2YgbWFwLmhhcyAhPT0gJ2Z1bmN0aW9uJykgcmV0dXJuIGZhbHNlO1xuXHRpZiAodHlwZW9mIG1hcC5rZXlzICE9PSAnZnVuY3Rpb24nKSByZXR1cm4gZmFsc2U7XG5cdGlmICh0eXBlb2YgbWFwLnNldCAhPT0gJ2Z1bmN0aW9uJykgcmV0dXJuIGZhbHNlO1xuXHRpZiAodHlwZW9mIG1hcC52YWx1ZXMgIT09ICdmdW5jdGlvbicpIHJldHVybiBmYWxzZTtcblxuXHRpdGVyYXRvciA9IG1hcC5lbnRyaWVzKCk7XG5cdHJlc3VsdCA9IGl0ZXJhdG9yLm5leHQoKTtcblx0aWYgKHJlc3VsdC5kb25lICE9PSBmYWxzZSkgcmV0dXJuIGZhbHNlO1xuXHRpZiAoIXJlc3VsdC52YWx1ZSkgcmV0dXJuIGZhbHNlO1xuXHRpZiAocmVzdWx0LnZhbHVlWzBdICE9PSAncmF6JykgcmV0dXJuIGZhbHNlO1xuXHRpZiAocmVzdWx0LnZhbHVlWzFdICE9PSAnb25lJykgcmV0dXJuIGZhbHNlO1xuXG5cdHJldHVybiB0cnVlO1xufTtcbiIsIi8vIEV4cG9ydHMgdHJ1ZSBpZiBlbnZpcm9ubWVudCBwcm92aWRlcyBuYXRpdmUgYE1hcGAgaW1wbGVtZW50YXRpb24sXG4vLyB3aGF0ZXZlciB0aGF0IGlzLlxuXG4ndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uICgpIHtcblx0aWYgKHR5cGVvZiBNYXAgPT09ICd1bmRlZmluZWQnKSByZXR1cm4gZmFsc2U7XG5cdHJldHVybiAoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG5ldyBNYXAoKSkgPT09ICdbb2JqZWN0IE1hcF0nKTtcbn0oKSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnZXM1LWV4dC9vYmplY3QvcHJpbWl0aXZlLXNldCcpKCdrZXknLFxuXHQndmFsdWUnLCAna2V5K3ZhbHVlJyk7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBzZXRQcm90b3R5cGVPZiAgICA9IHJlcXVpcmUoJ2VzNS1leHQvb2JqZWN0L3NldC1wcm90b3R5cGUtb2YnKVxuICAsIGQgICAgICAgICAgICAgICAgID0gcmVxdWlyZSgnZCcpXG4gICwgSXRlcmF0b3IgICAgICAgICAgPSByZXF1aXJlKCdlczYtaXRlcmF0b3InKVxuICAsIHRvU3RyaW5nVGFnU3ltYm9sID0gcmVxdWlyZSgnZXM2LXN5bWJvbCcpLnRvU3RyaW5nVGFnXG4gICwga2luZHMgICAgICAgICAgICAgPSByZXF1aXJlKCcuL2l0ZXJhdG9yLWtpbmRzJylcblxuICAsIGRlZmluZVByb3BlcnRpZXMgPSBPYmplY3QuZGVmaW5lUHJvcGVydGllc1xuICAsIHVuQmluZCA9IEl0ZXJhdG9yLnByb3RvdHlwZS5fdW5CaW5kXG4gICwgTWFwSXRlcmF0b3I7XG5cbk1hcEl0ZXJhdG9yID0gbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAobWFwLCBraW5kKSB7XG5cdGlmICghKHRoaXMgaW5zdGFuY2VvZiBNYXBJdGVyYXRvcikpIHJldHVybiBuZXcgTWFwSXRlcmF0b3IobWFwLCBraW5kKTtcblx0SXRlcmF0b3IuY2FsbCh0aGlzLCBtYXAuX19tYXBLZXlzRGF0YV9fLCBtYXApO1xuXHRpZiAoIWtpbmQgfHwgIWtpbmRzW2tpbmRdKSBraW5kID0gJ2tleSt2YWx1ZSc7XG5cdGRlZmluZVByb3BlcnRpZXModGhpcywge1xuXHRcdF9fa2luZF9fOiBkKCcnLCBraW5kKSxcblx0XHRfX3ZhbHVlc19fOiBkKCd3JywgbWFwLl9fbWFwVmFsdWVzRGF0YV9fKVxuXHR9KTtcbn07XG5pZiAoc2V0UHJvdG90eXBlT2YpIHNldFByb3RvdHlwZU9mKE1hcEl0ZXJhdG9yLCBJdGVyYXRvcik7XG5cbk1hcEl0ZXJhdG9yLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoSXRlcmF0b3IucHJvdG90eXBlLCB7XG5cdGNvbnN0cnVjdG9yOiBkKE1hcEl0ZXJhdG9yKSxcblx0X3Jlc29sdmU6IGQoZnVuY3Rpb24gKGkpIHtcblx0XHRpZiAodGhpcy5fX2tpbmRfXyA9PT0gJ3ZhbHVlJykgcmV0dXJuIHRoaXMuX192YWx1ZXNfX1tpXTtcblx0XHRpZiAodGhpcy5fX2tpbmRfXyA9PT0gJ2tleScpIHJldHVybiB0aGlzLl9fbGlzdF9fW2ldO1xuXHRcdHJldHVybiBbdGhpcy5fX2xpc3RfX1tpXSwgdGhpcy5fX3ZhbHVlc19fW2ldXTtcblx0fSksXG5cdF91bkJpbmQ6IGQoZnVuY3Rpb24gKCkge1xuXHRcdHRoaXMuX192YWx1ZXNfXyA9IG51bGw7XG5cdFx0dW5CaW5kLmNhbGwodGhpcyk7XG5cdH0pLFxuXHR0b1N0cmluZzogZChmdW5jdGlvbiAoKSB7IHJldHVybiAnW29iamVjdCBNYXAgSXRlcmF0b3JdJzsgfSlcbn0pO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KE1hcEl0ZXJhdG9yLnByb3RvdHlwZSwgdG9TdHJpbmdUYWdTeW1ib2wsXG5cdGQoJ2MnLCAnTWFwIEl0ZXJhdG9yJykpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgY2xlYXIgICAgICAgICAgPSByZXF1aXJlKCdlczUtZXh0L2FycmF5LyMvY2xlYXInKVxuICAsIGVJbmRleE9mICAgICAgID0gcmVxdWlyZSgnZXM1LWV4dC9hcnJheS8jL2UtaW5kZXgtb2YnKVxuICAsIHNldFByb3RvdHlwZU9mID0gcmVxdWlyZSgnZXM1LWV4dC9vYmplY3Qvc2V0LXByb3RvdHlwZS1vZicpXG4gICwgY2FsbGFibGUgICAgICAgPSByZXF1aXJlKCdlczUtZXh0L29iamVjdC92YWxpZC1jYWxsYWJsZScpXG4gICwgdmFsaWRWYWx1ZSAgICAgPSByZXF1aXJlKCdlczUtZXh0L29iamVjdC92YWxpZC12YWx1ZScpXG4gICwgZCAgICAgICAgICAgICAgPSByZXF1aXJlKCdkJylcbiAgLCBlZSAgICAgICAgICAgICA9IHJlcXVpcmUoJ2V2ZW50LWVtaXR0ZXInKVxuICAsIFN5bWJvbCAgICAgICAgID0gcmVxdWlyZSgnZXM2LXN5bWJvbCcpXG4gICwgaXRlcmF0b3IgICAgICAgPSByZXF1aXJlKCdlczYtaXRlcmF0b3IvdmFsaWQtaXRlcmFibGUnKVxuICAsIGZvck9mICAgICAgICAgID0gcmVxdWlyZSgnZXM2LWl0ZXJhdG9yL2Zvci1vZicpXG4gICwgSXRlcmF0b3IgICAgICAgPSByZXF1aXJlKCcuL2xpYi9pdGVyYXRvcicpXG4gICwgaXNOYXRpdmUgICAgICAgPSByZXF1aXJlKCcuL2lzLW5hdGl2ZS1pbXBsZW1lbnRlZCcpXG5cbiAgLCBjYWxsID0gRnVuY3Rpb24ucHJvdG90eXBlLmNhbGxcbiAgLCBkZWZpbmVQcm9wZXJ0aWVzID0gT2JqZWN0LmRlZmluZVByb3BlcnRpZXMsIGdldFByb3RvdHlwZU9mID0gT2JqZWN0LmdldFByb3RvdHlwZU9mXG4gICwgTWFwUG9seTtcblxubW9kdWxlLmV4cG9ydHMgPSBNYXBQb2x5ID0gZnVuY3Rpb24gKC8qaXRlcmFibGUqLykge1xuXHR2YXIgaXRlcmFibGUgPSBhcmd1bWVudHNbMF0sIGtleXMsIHZhbHVlcywgc2VsZjtcblx0aWYgKCEodGhpcyBpbnN0YW5jZW9mIE1hcFBvbHkpKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdDb25zdHJ1Y3RvciByZXF1aXJlcyBcXCduZXdcXCcnKTtcblx0aWYgKGlzTmF0aXZlICYmIHNldFByb3RvdHlwZU9mICYmIChNYXAgIT09IE1hcFBvbHkpKSB7XG5cdFx0c2VsZiA9IHNldFByb3RvdHlwZU9mKG5ldyBNYXAoKSwgZ2V0UHJvdG90eXBlT2YodGhpcykpO1xuXHR9IGVsc2Uge1xuXHRcdHNlbGYgPSB0aGlzO1xuXHR9XG5cdGlmIChpdGVyYWJsZSAhPSBudWxsKSBpdGVyYXRvcihpdGVyYWJsZSk7XG5cdGRlZmluZVByb3BlcnRpZXMoc2VsZiwge1xuXHRcdF9fbWFwS2V5c0RhdGFfXzogZCgnYycsIGtleXMgPSBbXSksXG5cdFx0X19tYXBWYWx1ZXNEYXRhX186IGQoJ2MnLCB2YWx1ZXMgPSBbXSlcblx0fSk7XG5cdGlmICghaXRlcmFibGUpIHJldHVybiBzZWxmO1xuXHRmb3JPZihpdGVyYWJsZSwgZnVuY3Rpb24gKHZhbHVlKSB7XG5cdFx0dmFyIGtleSA9IHZhbGlkVmFsdWUodmFsdWUpWzBdO1xuXHRcdHZhbHVlID0gdmFsdWVbMV07XG5cdFx0aWYgKGVJbmRleE9mLmNhbGwoa2V5cywga2V5KSAhPT0gLTEpIHJldHVybjtcblx0XHRrZXlzLnB1c2goa2V5KTtcblx0XHR2YWx1ZXMucHVzaCh2YWx1ZSk7XG5cdH0sIHNlbGYpO1xuXHRyZXR1cm4gc2VsZjtcbn07XG5cbmlmIChpc05hdGl2ZSkge1xuXHRpZiAoc2V0UHJvdG90eXBlT2YpIHNldFByb3RvdHlwZU9mKE1hcFBvbHksIE1hcCk7XG5cdE1hcFBvbHkucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShNYXAucHJvdG90eXBlLCB7XG5cdFx0Y29uc3RydWN0b3I6IGQoTWFwUG9seSlcblx0fSk7XG59XG5cbmVlKGRlZmluZVByb3BlcnRpZXMoTWFwUG9seS5wcm90b3R5cGUsIHtcblx0Y2xlYXI6IGQoZnVuY3Rpb24gKCkge1xuXHRcdGlmICghdGhpcy5fX21hcEtleXNEYXRhX18ubGVuZ3RoKSByZXR1cm47XG5cdFx0Y2xlYXIuY2FsbCh0aGlzLl9fbWFwS2V5c0RhdGFfXyk7XG5cdFx0Y2xlYXIuY2FsbCh0aGlzLl9fbWFwVmFsdWVzRGF0YV9fKTtcblx0XHR0aGlzLmVtaXQoJ19jbGVhcicpO1xuXHR9KSxcblx0ZGVsZXRlOiBkKGZ1bmN0aW9uIChrZXkpIHtcblx0XHR2YXIgaW5kZXggPSBlSW5kZXhPZi5jYWxsKHRoaXMuX19tYXBLZXlzRGF0YV9fLCBrZXkpO1xuXHRcdGlmIChpbmRleCA9PT0gLTEpIHJldHVybiBmYWxzZTtcblx0XHR0aGlzLl9fbWFwS2V5c0RhdGFfXy5zcGxpY2UoaW5kZXgsIDEpO1xuXHRcdHRoaXMuX19tYXBWYWx1ZXNEYXRhX18uc3BsaWNlKGluZGV4LCAxKTtcblx0XHR0aGlzLmVtaXQoJ19kZWxldGUnLCBpbmRleCwga2V5KTtcblx0XHRyZXR1cm4gdHJ1ZTtcblx0fSksXG5cdGVudHJpZXM6IGQoZnVuY3Rpb24gKCkgeyByZXR1cm4gbmV3IEl0ZXJhdG9yKHRoaXMsICdrZXkrdmFsdWUnKTsgfSksXG5cdGZvckVhY2g6IGQoZnVuY3Rpb24gKGNiLyosIHRoaXNBcmcqLykge1xuXHRcdHZhciB0aGlzQXJnID0gYXJndW1lbnRzWzFdLCBpdGVyYXRvciwgcmVzdWx0O1xuXHRcdGNhbGxhYmxlKGNiKTtcblx0XHRpdGVyYXRvciA9IHRoaXMuZW50cmllcygpO1xuXHRcdHJlc3VsdCA9IGl0ZXJhdG9yLl9uZXh0KCk7XG5cdFx0d2hpbGUgKHJlc3VsdCAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRjYWxsLmNhbGwoY2IsIHRoaXNBcmcsIHRoaXMuX19tYXBWYWx1ZXNEYXRhX19bcmVzdWx0XSxcblx0XHRcdFx0dGhpcy5fX21hcEtleXNEYXRhX19bcmVzdWx0XSwgdGhpcyk7XG5cdFx0XHRyZXN1bHQgPSBpdGVyYXRvci5fbmV4dCgpO1xuXHRcdH1cblx0fSksXG5cdGdldDogZChmdW5jdGlvbiAoa2V5KSB7XG5cdFx0dmFyIGluZGV4ID0gZUluZGV4T2YuY2FsbCh0aGlzLl9fbWFwS2V5c0RhdGFfXywga2V5KTtcblx0XHRpZiAoaW5kZXggPT09IC0xKSByZXR1cm47XG5cdFx0cmV0dXJuIHRoaXMuX19tYXBWYWx1ZXNEYXRhX19baW5kZXhdO1xuXHR9KSxcblx0aGFzOiBkKGZ1bmN0aW9uIChrZXkpIHtcblx0XHRyZXR1cm4gKGVJbmRleE9mLmNhbGwodGhpcy5fX21hcEtleXNEYXRhX18sIGtleSkgIT09IC0xKTtcblx0fSksXG5cdGtleXM6IGQoZnVuY3Rpb24gKCkgeyByZXR1cm4gbmV3IEl0ZXJhdG9yKHRoaXMsICdrZXknKTsgfSksXG5cdHNldDogZChmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuXHRcdHZhciBpbmRleCA9IGVJbmRleE9mLmNhbGwodGhpcy5fX21hcEtleXNEYXRhX18sIGtleSksIGVtaXQ7XG5cdFx0aWYgKGluZGV4ID09PSAtMSkge1xuXHRcdFx0aW5kZXggPSB0aGlzLl9fbWFwS2V5c0RhdGFfXy5wdXNoKGtleSkgLSAxO1xuXHRcdFx0ZW1pdCA9IHRydWU7XG5cdFx0fVxuXHRcdHRoaXMuX19tYXBWYWx1ZXNEYXRhX19baW5kZXhdID0gdmFsdWU7XG5cdFx0aWYgKGVtaXQpIHRoaXMuZW1pdCgnX2FkZCcsIGluZGV4LCBrZXkpO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9KSxcblx0c2l6ZTogZC5ncyhmdW5jdGlvbiAoKSB7IHJldHVybiB0aGlzLl9fbWFwS2V5c0RhdGFfXy5sZW5ndGg7IH0pLFxuXHR2YWx1ZXM6IGQoZnVuY3Rpb24gKCkgeyByZXR1cm4gbmV3IEl0ZXJhdG9yKHRoaXMsICd2YWx1ZScpOyB9KSxcblx0dG9TdHJpbmc6IGQoZnVuY3Rpb24gKCkgeyByZXR1cm4gJ1tvYmplY3QgTWFwXSc7IH0pXG59KSk7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoTWFwUG9seS5wcm90b3R5cGUsIFN5bWJvbC5pdGVyYXRvciwgZChmdW5jdGlvbiAoKSB7XG5cdHJldHVybiB0aGlzLmVudHJpZXMoKTtcbn0pKTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShNYXBQb2x5LnByb3RvdHlwZSwgU3ltYm9sLnRvU3RyaW5nVGFnLCBkKCdjJywgJ01hcCcpKTtcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL2lzLWltcGxlbWVudGVkJykoKSA/IFN5bWJvbCA6IHJlcXVpcmUoJy4vcG9seWZpbGwnKTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHZhbGlkVHlwZXMgPSB7IG9iamVjdDogdHJ1ZSwgc3ltYm9sOiB0cnVlIH07XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKCkge1xuXHR2YXIgc3ltYm9sO1xuXHRpZiAodHlwZW9mIFN5bWJvbCAhPT0gJ2Z1bmN0aW9uJykgcmV0dXJuIGZhbHNlO1xuXHRzeW1ib2wgPSBTeW1ib2woJ3Rlc3Qgc3ltYm9sJyk7XG5cdHRyeSB7IFN0cmluZyhzeW1ib2wpOyB9IGNhdGNoIChlKSB7IHJldHVybiBmYWxzZTsgfVxuXG5cdC8vIFJldHVybiAndHJ1ZScgYWxzbyBmb3IgcG9seWZpbGxzXG5cdGlmICghdmFsaWRUeXBlc1t0eXBlb2YgU3ltYm9sLml0ZXJhdG9yXSkgcmV0dXJuIGZhbHNlO1xuXHRpZiAoIXZhbGlkVHlwZXNbdHlwZW9mIFN5bWJvbC50b1ByaW1pdGl2ZV0pIHJldHVybiBmYWxzZTtcblx0aWYgKCF2YWxpZFR5cGVzW3R5cGVvZiBTeW1ib2wudG9TdHJpbmdUYWddKSByZXR1cm4gZmFsc2U7XG5cblx0cmV0dXJuIHRydWU7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICh4KSB7XG5cdGlmICgheCkgcmV0dXJuIGZhbHNlO1xuXHRpZiAodHlwZW9mIHggPT09ICdzeW1ib2wnKSByZXR1cm4gdHJ1ZTtcblx0aWYgKCF4LmNvbnN0cnVjdG9yKSByZXR1cm4gZmFsc2U7XG5cdGlmICh4LmNvbnN0cnVjdG9yLm5hbWUgIT09ICdTeW1ib2wnKSByZXR1cm4gZmFsc2U7XG5cdHJldHVybiAoeFt4LmNvbnN0cnVjdG9yLnRvU3RyaW5nVGFnXSA9PT0gJ1N5bWJvbCcpO1xufTtcbiIsIi8vIEVTMjAxNSBTeW1ib2wgcG9seWZpbGwgZm9yIGVudmlyb25tZW50cyB0aGF0IGRvIG5vdCAob3IgcGFydGlhbGx5KSBzdXBwb3J0IGl0XG5cbid1c2Ugc3RyaWN0JztcblxudmFyIGQgICAgICAgICAgICAgID0gcmVxdWlyZSgnZCcpXG4gICwgdmFsaWRhdGVTeW1ib2wgPSByZXF1aXJlKCcuL3ZhbGlkYXRlLXN5bWJvbCcpXG5cbiAgLCBjcmVhdGUgPSBPYmplY3QuY3JlYXRlLCBkZWZpbmVQcm9wZXJ0aWVzID0gT2JqZWN0LmRlZmluZVByb3BlcnRpZXNcbiAgLCBkZWZpbmVQcm9wZXJ0eSA9IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSwgb2JqUHJvdG90eXBlID0gT2JqZWN0LnByb3RvdHlwZVxuICAsIE5hdGl2ZVN5bWJvbCwgU3ltYm9sUG9seWZpbGwsIEhpZGRlblN5bWJvbCwgZ2xvYmFsU3ltYm9scyA9IGNyZWF0ZShudWxsKVxuICAsIGlzTmF0aXZlU2FmZTtcblxuaWYgKHR5cGVvZiBTeW1ib2wgPT09ICdmdW5jdGlvbicpIHtcblx0TmF0aXZlU3ltYm9sID0gU3ltYm9sO1xuXHR0cnkge1xuXHRcdFN0cmluZyhOYXRpdmVTeW1ib2woKSk7XG5cdFx0aXNOYXRpdmVTYWZlID0gdHJ1ZTtcblx0fSBjYXRjaCAoaWdub3JlKSB7fVxufVxuXG52YXIgZ2VuZXJhdGVOYW1lID0gKGZ1bmN0aW9uICgpIHtcblx0dmFyIGNyZWF0ZWQgPSBjcmVhdGUobnVsbCk7XG5cdHJldHVybiBmdW5jdGlvbiAoZGVzYykge1xuXHRcdHZhciBwb3N0Zml4ID0gMCwgbmFtZSwgaWUxMUJ1Z1dvcmthcm91bmQ7XG5cdFx0d2hpbGUgKGNyZWF0ZWRbZGVzYyArIChwb3N0Zml4IHx8ICcnKV0pICsrcG9zdGZpeDtcblx0XHRkZXNjICs9IChwb3N0Zml4IHx8ICcnKTtcblx0XHRjcmVhdGVkW2Rlc2NdID0gdHJ1ZTtcblx0XHRuYW1lID0gJ0BAJyArIGRlc2M7XG5cdFx0ZGVmaW5lUHJvcGVydHkob2JqUHJvdG90eXBlLCBuYW1lLCBkLmdzKG51bGwsIGZ1bmN0aW9uICh2YWx1ZSkge1xuXHRcdFx0Ly8gRm9yIElFMTEgaXNzdWUgc2VlOlxuXHRcdFx0Ly8gaHR0cHM6Ly9jb25uZWN0Lm1pY3Jvc29mdC5jb20vSUUvZmVlZGJhY2tkZXRhaWwvdmlldy8xOTI4NTA4L1xuXHRcdFx0Ly8gICAgaWUxMS1icm9rZW4tZ2V0dGVycy1vbi1kb20tb2JqZWN0c1xuXHRcdFx0Ly8gaHR0cHM6Ly9naXRodWIuY29tL21lZGlrb28vZXM2LXN5bWJvbC9pc3N1ZXMvMTJcblx0XHRcdGlmIChpZTExQnVnV29ya2Fyb3VuZCkgcmV0dXJuO1xuXHRcdFx0aWUxMUJ1Z1dvcmthcm91bmQgPSB0cnVlO1xuXHRcdFx0ZGVmaW5lUHJvcGVydHkodGhpcywgbmFtZSwgZCh2YWx1ZSkpO1xuXHRcdFx0aWUxMUJ1Z1dvcmthcm91bmQgPSBmYWxzZTtcblx0XHR9KSk7XG5cdFx0cmV0dXJuIG5hbWU7XG5cdH07XG59KCkpO1xuXG4vLyBJbnRlcm5hbCBjb25zdHJ1Y3RvciAobm90IG9uZSBleHBvc2VkKSBmb3IgY3JlYXRpbmcgU3ltYm9sIGluc3RhbmNlcy5cbi8vIFRoaXMgb25lIGlzIHVzZWQgdG8gZW5zdXJlIHRoYXQgYHNvbWVTeW1ib2wgaW5zdGFuY2VvZiBTeW1ib2xgIGFsd2F5cyByZXR1cm4gZmFsc2VcbkhpZGRlblN5bWJvbCA9IGZ1bmN0aW9uIFN5bWJvbChkZXNjcmlwdGlvbikge1xuXHRpZiAodGhpcyBpbnN0YW5jZW9mIEhpZGRlblN5bWJvbCkgdGhyb3cgbmV3IFR5cGVFcnJvcignU3ltYm9sIGlzIG5vdCBhIGNvbnN0cnVjdG9yJyk7XG5cdHJldHVybiBTeW1ib2xQb2x5ZmlsbChkZXNjcmlwdGlvbik7XG59O1xuXG4vLyBFeHBvc2VkIGBTeW1ib2xgIGNvbnN0cnVjdG9yXG4vLyAocmV0dXJucyBpbnN0YW5jZXMgb2YgSGlkZGVuU3ltYm9sKVxubW9kdWxlLmV4cG9ydHMgPSBTeW1ib2xQb2x5ZmlsbCA9IGZ1bmN0aW9uIFN5bWJvbChkZXNjcmlwdGlvbikge1xuXHR2YXIgc3ltYm9sO1xuXHRpZiAodGhpcyBpbnN0YW5jZW9mIFN5bWJvbCkgdGhyb3cgbmV3IFR5cGVFcnJvcignU3ltYm9sIGlzIG5vdCBhIGNvbnN0cnVjdG9yJyk7XG5cdGlmIChpc05hdGl2ZVNhZmUpIHJldHVybiBOYXRpdmVTeW1ib2woZGVzY3JpcHRpb24pO1xuXHRzeW1ib2wgPSBjcmVhdGUoSGlkZGVuU3ltYm9sLnByb3RvdHlwZSk7XG5cdGRlc2NyaXB0aW9uID0gKGRlc2NyaXB0aW9uID09PSB1bmRlZmluZWQgPyAnJyA6IFN0cmluZyhkZXNjcmlwdGlvbikpO1xuXHRyZXR1cm4gZGVmaW5lUHJvcGVydGllcyhzeW1ib2wsIHtcblx0XHRfX2Rlc2NyaXB0aW9uX186IGQoJycsIGRlc2NyaXB0aW9uKSxcblx0XHRfX25hbWVfXzogZCgnJywgZ2VuZXJhdGVOYW1lKGRlc2NyaXB0aW9uKSlcblx0fSk7XG59O1xuZGVmaW5lUHJvcGVydGllcyhTeW1ib2xQb2x5ZmlsbCwge1xuXHRmb3I6IGQoZnVuY3Rpb24gKGtleSkge1xuXHRcdGlmIChnbG9iYWxTeW1ib2xzW2tleV0pIHJldHVybiBnbG9iYWxTeW1ib2xzW2tleV07XG5cdFx0cmV0dXJuIChnbG9iYWxTeW1ib2xzW2tleV0gPSBTeW1ib2xQb2x5ZmlsbChTdHJpbmcoa2V5KSkpO1xuXHR9KSxcblx0a2V5Rm9yOiBkKGZ1bmN0aW9uIChzKSB7XG5cdFx0dmFyIGtleTtcblx0XHR2YWxpZGF0ZVN5bWJvbChzKTtcblx0XHRmb3IgKGtleSBpbiBnbG9iYWxTeW1ib2xzKSBpZiAoZ2xvYmFsU3ltYm9sc1trZXldID09PSBzKSByZXR1cm4ga2V5O1xuXHR9KSxcblxuXHQvLyBUbyBlbnN1cmUgcHJvcGVyIGludGVyb3BlcmFiaWxpdHkgd2l0aCBvdGhlciBuYXRpdmUgZnVuY3Rpb25zIChlLmcuIEFycmF5LmZyb20pXG5cdC8vIGZhbGxiYWNrIHRvIGV2ZW50dWFsIG5hdGl2ZSBpbXBsZW1lbnRhdGlvbiBvZiBnaXZlbiBzeW1ib2xcblx0aGFzSW5zdGFuY2U6IGQoJycsIChOYXRpdmVTeW1ib2wgJiYgTmF0aXZlU3ltYm9sLmhhc0luc3RhbmNlKSB8fCBTeW1ib2xQb2x5ZmlsbCgnaGFzSW5zdGFuY2UnKSksXG5cdGlzQ29uY2F0U3ByZWFkYWJsZTogZCgnJywgKE5hdGl2ZVN5bWJvbCAmJiBOYXRpdmVTeW1ib2wuaXNDb25jYXRTcHJlYWRhYmxlKSB8fFxuXHRcdFN5bWJvbFBvbHlmaWxsKCdpc0NvbmNhdFNwcmVhZGFibGUnKSksXG5cdGl0ZXJhdG9yOiBkKCcnLCAoTmF0aXZlU3ltYm9sICYmIE5hdGl2ZVN5bWJvbC5pdGVyYXRvcikgfHwgU3ltYm9sUG9seWZpbGwoJ2l0ZXJhdG9yJykpLFxuXHRtYXRjaDogZCgnJywgKE5hdGl2ZVN5bWJvbCAmJiBOYXRpdmVTeW1ib2wubWF0Y2gpIHx8IFN5bWJvbFBvbHlmaWxsKCdtYXRjaCcpKSxcblx0cmVwbGFjZTogZCgnJywgKE5hdGl2ZVN5bWJvbCAmJiBOYXRpdmVTeW1ib2wucmVwbGFjZSkgfHwgU3ltYm9sUG9seWZpbGwoJ3JlcGxhY2UnKSksXG5cdHNlYXJjaDogZCgnJywgKE5hdGl2ZVN5bWJvbCAmJiBOYXRpdmVTeW1ib2wuc2VhcmNoKSB8fCBTeW1ib2xQb2x5ZmlsbCgnc2VhcmNoJykpLFxuXHRzcGVjaWVzOiBkKCcnLCAoTmF0aXZlU3ltYm9sICYmIE5hdGl2ZVN5bWJvbC5zcGVjaWVzKSB8fCBTeW1ib2xQb2x5ZmlsbCgnc3BlY2llcycpKSxcblx0c3BsaXQ6IGQoJycsIChOYXRpdmVTeW1ib2wgJiYgTmF0aXZlU3ltYm9sLnNwbGl0KSB8fCBTeW1ib2xQb2x5ZmlsbCgnc3BsaXQnKSksXG5cdHRvUHJpbWl0aXZlOiBkKCcnLCAoTmF0aXZlU3ltYm9sICYmIE5hdGl2ZVN5bWJvbC50b1ByaW1pdGl2ZSkgfHwgU3ltYm9sUG9seWZpbGwoJ3RvUHJpbWl0aXZlJykpLFxuXHR0b1N0cmluZ1RhZzogZCgnJywgKE5hdGl2ZVN5bWJvbCAmJiBOYXRpdmVTeW1ib2wudG9TdHJpbmdUYWcpIHx8IFN5bWJvbFBvbHlmaWxsKCd0b1N0cmluZ1RhZycpKSxcblx0dW5zY29wYWJsZXM6IGQoJycsIChOYXRpdmVTeW1ib2wgJiYgTmF0aXZlU3ltYm9sLnVuc2NvcGFibGVzKSB8fCBTeW1ib2xQb2x5ZmlsbCgndW5zY29wYWJsZXMnKSlcbn0pO1xuXG4vLyBJbnRlcm5hbCB0d2Vha3MgZm9yIHJlYWwgc3ltYm9sIHByb2R1Y2VyXG5kZWZpbmVQcm9wZXJ0aWVzKEhpZGRlblN5bWJvbC5wcm90b3R5cGUsIHtcblx0Y29uc3RydWN0b3I6IGQoU3ltYm9sUG9seWZpbGwpLFxuXHR0b1N0cmluZzogZCgnJywgZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpcy5fX25hbWVfXzsgfSlcbn0pO1xuXG4vLyBQcm9wZXIgaW1wbGVtZW50YXRpb24gb2YgbWV0aG9kcyBleHBvc2VkIG9uIFN5bWJvbC5wcm90b3R5cGVcbi8vIFRoZXkgd29uJ3QgYmUgYWNjZXNzaWJsZSBvbiBwcm9kdWNlZCBzeW1ib2wgaW5zdGFuY2VzIGFzIHRoZXkgZGVyaXZlIGZyb20gSGlkZGVuU3ltYm9sLnByb3RvdHlwZVxuZGVmaW5lUHJvcGVydGllcyhTeW1ib2xQb2x5ZmlsbC5wcm90b3R5cGUsIHtcblx0dG9TdHJpbmc6IGQoZnVuY3Rpb24gKCkgeyByZXR1cm4gJ1N5bWJvbCAoJyArIHZhbGlkYXRlU3ltYm9sKHRoaXMpLl9fZGVzY3JpcHRpb25fXyArICcpJzsgfSksXG5cdHZhbHVlT2Y6IGQoZnVuY3Rpb24gKCkgeyByZXR1cm4gdmFsaWRhdGVTeW1ib2wodGhpcyk7IH0pXG59KTtcbmRlZmluZVByb3BlcnR5KFN5bWJvbFBvbHlmaWxsLnByb3RvdHlwZSwgU3ltYm9sUG9seWZpbGwudG9QcmltaXRpdmUsIGQoJycsIGZ1bmN0aW9uICgpIHtcblx0dmFyIHN5bWJvbCA9IHZhbGlkYXRlU3ltYm9sKHRoaXMpO1xuXHRpZiAodHlwZW9mIHN5bWJvbCA9PT0gJ3N5bWJvbCcpIHJldHVybiBzeW1ib2w7XG5cdHJldHVybiBzeW1ib2wudG9TdHJpbmcoKTtcbn0pKTtcbmRlZmluZVByb3BlcnR5KFN5bWJvbFBvbHlmaWxsLnByb3RvdHlwZSwgU3ltYm9sUG9seWZpbGwudG9TdHJpbmdUYWcsIGQoJ2MnLCAnU3ltYm9sJykpO1xuXG4vLyBQcm9wZXIgaW1wbGVtZW50YXRvbiBvZiB0b1ByaW1pdGl2ZSBhbmQgdG9TdHJpbmdUYWcgZm9yIHJldHVybmVkIHN5bWJvbCBpbnN0YW5jZXNcbmRlZmluZVByb3BlcnR5KEhpZGRlblN5bWJvbC5wcm90b3R5cGUsIFN5bWJvbFBvbHlmaWxsLnRvU3RyaW5nVGFnLFxuXHRkKCdjJywgU3ltYm9sUG9seWZpbGwucHJvdG90eXBlW1N5bWJvbFBvbHlmaWxsLnRvU3RyaW5nVGFnXSkpO1xuXG4vLyBOb3RlOiBJdCdzIGltcG9ydGFudCB0byBkZWZpbmUgYHRvUHJpbWl0aXZlYCBhcyBsYXN0IG9uZSwgYXMgc29tZSBpbXBsZW1lbnRhdGlvbnNcbi8vIGltcGxlbWVudCBgdG9QcmltaXRpdmVgIG5hdGl2ZWx5IHdpdGhvdXQgaW1wbGVtZW50aW5nIGB0b1N0cmluZ1RhZ2AgKG9yIG90aGVyIHNwZWNpZmllZCBzeW1ib2xzKVxuLy8gQW5kIHRoYXQgbWF5IGludm9rZSBlcnJvciBpbiBkZWZpbml0aW9uIGZsb3c6XG4vLyBTZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9tZWRpa29vL2VzNi1zeW1ib2wvaXNzdWVzLzEzI2lzc3VlY29tbWVudC0xNjQxNDYxNDlcbmRlZmluZVByb3BlcnR5KEhpZGRlblN5bWJvbC5wcm90b3R5cGUsIFN5bWJvbFBvbHlmaWxsLnRvUHJpbWl0aXZlLFxuXHRkKCdjJywgU3ltYm9sUG9seWZpbGwucHJvdG90eXBlW1N5bWJvbFBvbHlmaWxsLnRvUHJpbWl0aXZlXSkpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgaXNTeW1ib2wgPSByZXF1aXJlKCcuL2lzLXN5bWJvbCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuXHRpZiAoIWlzU3ltYm9sKHZhbHVlKSkgdGhyb3cgbmV3IFR5cGVFcnJvcih2YWx1ZSArIFwiIGlzIG5vdCBhIHN5bWJvbFwiKTtcblx0cmV0dXJuIHZhbHVlO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGQgICAgICAgID0gcmVxdWlyZSgnZCcpXG4gICwgY2FsbGFibGUgPSByZXF1aXJlKCdlczUtZXh0L29iamVjdC92YWxpZC1jYWxsYWJsZScpXG5cbiAgLCBhcHBseSA9IEZ1bmN0aW9uLnByb3RvdHlwZS5hcHBseSwgY2FsbCA9IEZ1bmN0aW9uLnByb3RvdHlwZS5jYWxsXG4gICwgY3JlYXRlID0gT2JqZWN0LmNyZWF0ZSwgZGVmaW5lUHJvcGVydHkgPSBPYmplY3QuZGVmaW5lUHJvcGVydHlcbiAgLCBkZWZpbmVQcm9wZXJ0aWVzID0gT2JqZWN0LmRlZmluZVByb3BlcnRpZXNcbiAgLCBoYXNPd25Qcm9wZXJ0eSA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHlcbiAgLCBkZXNjcmlwdG9yID0geyBjb25maWd1cmFibGU6IHRydWUsIGVudW1lcmFibGU6IGZhbHNlLCB3cml0YWJsZTogdHJ1ZSB9XG5cbiAgLCBvbiwgb25jZSwgb2ZmLCBlbWl0LCBtZXRob2RzLCBkZXNjcmlwdG9ycywgYmFzZTtcblxub24gPSBmdW5jdGlvbiAodHlwZSwgbGlzdGVuZXIpIHtcblx0dmFyIGRhdGE7XG5cblx0Y2FsbGFibGUobGlzdGVuZXIpO1xuXG5cdGlmICghaGFzT3duUHJvcGVydHkuY2FsbCh0aGlzLCAnX19lZV9fJykpIHtcblx0XHRkYXRhID0gZGVzY3JpcHRvci52YWx1ZSA9IGNyZWF0ZShudWxsKTtcblx0XHRkZWZpbmVQcm9wZXJ0eSh0aGlzLCAnX19lZV9fJywgZGVzY3JpcHRvcik7XG5cdFx0ZGVzY3JpcHRvci52YWx1ZSA9IG51bGw7XG5cdH0gZWxzZSB7XG5cdFx0ZGF0YSA9IHRoaXMuX19lZV9fO1xuXHR9XG5cdGlmICghZGF0YVt0eXBlXSkgZGF0YVt0eXBlXSA9IGxpc3RlbmVyO1xuXHRlbHNlIGlmICh0eXBlb2YgZGF0YVt0eXBlXSA9PT0gJ29iamVjdCcpIGRhdGFbdHlwZV0ucHVzaChsaXN0ZW5lcik7XG5cdGVsc2UgZGF0YVt0eXBlXSA9IFtkYXRhW3R5cGVdLCBsaXN0ZW5lcl07XG5cblx0cmV0dXJuIHRoaXM7XG59O1xuXG5vbmNlID0gZnVuY3Rpb24gKHR5cGUsIGxpc3RlbmVyKSB7XG5cdHZhciBvbmNlLCBzZWxmO1xuXG5cdGNhbGxhYmxlKGxpc3RlbmVyKTtcblx0c2VsZiA9IHRoaXM7XG5cdG9uLmNhbGwodGhpcywgdHlwZSwgb25jZSA9IGZ1bmN0aW9uICgpIHtcblx0XHRvZmYuY2FsbChzZWxmLCB0eXBlLCBvbmNlKTtcblx0XHRhcHBseS5jYWxsKGxpc3RlbmVyLCB0aGlzLCBhcmd1bWVudHMpO1xuXHR9KTtcblxuXHRvbmNlLl9fZWVPbmNlTGlzdGVuZXJfXyA9IGxpc3RlbmVyO1xuXHRyZXR1cm4gdGhpcztcbn07XG5cbm9mZiA9IGZ1bmN0aW9uICh0eXBlLCBsaXN0ZW5lcikge1xuXHR2YXIgZGF0YSwgbGlzdGVuZXJzLCBjYW5kaWRhdGUsIGk7XG5cblx0Y2FsbGFibGUobGlzdGVuZXIpO1xuXG5cdGlmICghaGFzT3duUHJvcGVydHkuY2FsbCh0aGlzLCAnX19lZV9fJykpIHJldHVybiB0aGlzO1xuXHRkYXRhID0gdGhpcy5fX2VlX187XG5cdGlmICghZGF0YVt0eXBlXSkgcmV0dXJuIHRoaXM7XG5cdGxpc3RlbmVycyA9IGRhdGFbdHlwZV07XG5cblx0aWYgKHR5cGVvZiBsaXN0ZW5lcnMgPT09ICdvYmplY3QnKSB7XG5cdFx0Zm9yIChpID0gMDsgKGNhbmRpZGF0ZSA9IGxpc3RlbmVyc1tpXSk7ICsraSkge1xuXHRcdFx0aWYgKChjYW5kaWRhdGUgPT09IGxpc3RlbmVyKSB8fFxuXHRcdFx0XHRcdChjYW5kaWRhdGUuX19lZU9uY2VMaXN0ZW5lcl9fID09PSBsaXN0ZW5lcikpIHtcblx0XHRcdFx0aWYgKGxpc3RlbmVycy5sZW5ndGggPT09IDIpIGRhdGFbdHlwZV0gPSBsaXN0ZW5lcnNbaSA/IDAgOiAxXTtcblx0XHRcdFx0ZWxzZSBsaXN0ZW5lcnMuc3BsaWNlKGksIDEpO1xuXHRcdFx0fVxuXHRcdH1cblx0fSBlbHNlIHtcblx0XHRpZiAoKGxpc3RlbmVycyA9PT0gbGlzdGVuZXIpIHx8XG5cdFx0XHRcdChsaXN0ZW5lcnMuX19lZU9uY2VMaXN0ZW5lcl9fID09PSBsaXN0ZW5lcikpIHtcblx0XHRcdGRlbGV0ZSBkYXRhW3R5cGVdO1xuXHRcdH1cblx0fVxuXG5cdHJldHVybiB0aGlzO1xufTtcblxuZW1pdCA9IGZ1bmN0aW9uICh0eXBlKSB7XG5cdHZhciBpLCBsLCBsaXN0ZW5lciwgbGlzdGVuZXJzLCBhcmdzO1xuXG5cdGlmICghaGFzT3duUHJvcGVydHkuY2FsbCh0aGlzLCAnX19lZV9fJykpIHJldHVybjtcblx0bGlzdGVuZXJzID0gdGhpcy5fX2VlX19bdHlwZV07XG5cdGlmICghbGlzdGVuZXJzKSByZXR1cm47XG5cblx0aWYgKHR5cGVvZiBsaXN0ZW5lcnMgPT09ICdvYmplY3QnKSB7XG5cdFx0bCA9IGFyZ3VtZW50cy5sZW5ndGg7XG5cdFx0YXJncyA9IG5ldyBBcnJheShsIC0gMSk7XG5cdFx0Zm9yIChpID0gMTsgaSA8IGw7ICsraSkgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG5cblx0XHRsaXN0ZW5lcnMgPSBsaXN0ZW5lcnMuc2xpY2UoKTtcblx0XHRmb3IgKGkgPSAwOyAobGlzdGVuZXIgPSBsaXN0ZW5lcnNbaV0pOyArK2kpIHtcblx0XHRcdGFwcGx5LmNhbGwobGlzdGVuZXIsIHRoaXMsIGFyZ3MpO1xuXHRcdH1cblx0fSBlbHNlIHtcblx0XHRzd2l0Y2ggKGFyZ3VtZW50cy5sZW5ndGgpIHtcblx0XHRjYXNlIDE6XG5cdFx0XHRjYWxsLmNhbGwobGlzdGVuZXJzLCB0aGlzKTtcblx0XHRcdGJyZWFrO1xuXHRcdGNhc2UgMjpcblx0XHRcdGNhbGwuY2FsbChsaXN0ZW5lcnMsIHRoaXMsIGFyZ3VtZW50c1sxXSk7XG5cdFx0XHRicmVhaztcblx0XHRjYXNlIDM6XG5cdFx0XHRjYWxsLmNhbGwobGlzdGVuZXJzLCB0aGlzLCBhcmd1bWVudHNbMV0sIGFyZ3VtZW50c1syXSk7XG5cdFx0XHRicmVhaztcblx0XHRkZWZhdWx0OlxuXHRcdFx0bCA9IGFyZ3VtZW50cy5sZW5ndGg7XG5cdFx0XHRhcmdzID0gbmV3IEFycmF5KGwgLSAxKTtcblx0XHRcdGZvciAoaSA9IDE7IGkgPCBsOyArK2kpIHtcblx0XHRcdFx0YXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG5cdFx0XHR9XG5cdFx0XHRhcHBseS5jYWxsKGxpc3RlbmVycywgdGhpcywgYXJncyk7XG5cdFx0fVxuXHR9XG59O1xuXG5tZXRob2RzID0ge1xuXHRvbjogb24sXG5cdG9uY2U6IG9uY2UsXG5cdG9mZjogb2ZmLFxuXHRlbWl0OiBlbWl0XG59O1xuXG5kZXNjcmlwdG9ycyA9IHtcblx0b246IGQob24pLFxuXHRvbmNlOiBkKG9uY2UpLFxuXHRvZmY6IGQob2ZmKSxcblx0ZW1pdDogZChlbWl0KVxufTtcblxuYmFzZSA9IGRlZmluZVByb3BlcnRpZXMoe30sIGRlc2NyaXB0b3JzKTtcblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gZnVuY3Rpb24gKG8pIHtcblx0cmV0dXJuIChvID09IG51bGwpID8gY3JlYXRlKGJhc2UpIDogZGVmaW5lUHJvcGVydGllcyhPYmplY3QobyksIGRlc2NyaXB0b3JzKTtcbn07XG5leHBvcnRzLm1ldGhvZHMgPSBtZXRob2RzO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19leHRlbmRzID0gKHRoaXMgJiYgdGhpcy5fX2V4dGVuZHMpIHx8IChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGV4dGVuZFN0YXRpY3MgPSBPYmplY3Quc2V0UHJvdG90eXBlT2YgfHxcbiAgICAgICAgKHsgX19wcm90b19fOiBbXSB9IGluc3RhbmNlb2YgQXJyYXkgJiYgZnVuY3Rpb24gKGQsIGIpIHsgZC5fX3Byb3RvX18gPSBiOyB9KSB8fFxuICAgICAgICBmdW5jdGlvbiAoZCwgYikgeyBmb3IgKHZhciBwIGluIGIpIGlmIChiLmhhc093blByb3BlcnR5KHApKSBkW3BdID0gYltwXTsgfTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGQsIGIpIHtcbiAgICAgICAgZXh0ZW5kU3RhdGljcyhkLCBiKTtcbiAgICAgICAgZnVuY3Rpb24gX18oKSB7IHRoaXMuY29uc3RydWN0b3IgPSBkOyB9XG4gICAgICAgIGQucHJvdG90eXBlID0gYiA9PT0gbnVsbCA/IE9iamVjdC5jcmVhdGUoYikgOiAoX18ucHJvdG90eXBlID0gYi5wcm90b3R5cGUsIG5ldyBfXygpKTtcbiAgICB9O1xufSkoKTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbi8qKlxuICogVGhlIHVuaXF1ZSBpZCBpcyB1c2VkIGZvciB1bmlxdWUgaGFzaGVzLlxuICovXG52YXIgdW5pcXVlSWQgPSAwO1xuLyoqXG4gKiBUYWcgc3R5bGVzIHdpdGggdGhpcyBzdHJpbmcgdG8gZ2V0IHVuaXF1ZSBoYXNoZXMuXG4gKi9cbmV4cG9ydHMuSVNfVU5JUVVFID0gJ19fRE9fTk9UX0RFRFVQRV9TVFlMRV9fJztcbnZhciB1cHBlckNhc2VQYXR0ZXJuID0gL1tBLVpdL2c7XG52YXIgbXNQYXR0ZXJuID0gL15tcy0vO1xudmFyIGludGVycG9sYXRlUGF0dGVybiA9IC8mL2c7XG52YXIgZXNjYXBlUGF0dGVybiA9IC9bICEjJCUmKCkqKywuLzs8PT4/QFtcXF1eYHt8fX5cIidcXFxcXS9nO1xudmFyIHByb3BMb3dlciA9IGZ1bmN0aW9uIChtKSB7IHJldHVybiBcIi1cIiArIG0udG9Mb3dlckNhc2UoKTsgfTtcbi8qKlxuICogQ1NTIHByb3BlcnRpZXMgdGhhdCBhcmUgdmFsaWQgdW5pdC1sZXNzIG51bWJlcnMuXG4gKi9cbnZhciBjc3NOdW1iZXJQcm9wZXJ0aWVzID0gW1xuICAgICdhbmltYXRpb24taXRlcmF0aW9uLWNvdW50JyxcbiAgICAnYm94LWZsZXgnLFxuICAgICdib3gtZmxleC1ncm91cCcsXG4gICAgJ2NvbHVtbi1jb3VudCcsXG4gICAgJ2NvdW50ZXItaW5jcmVtZW50JyxcbiAgICAnY291bnRlci1yZXNldCcsXG4gICAgJ2ZsZXgnLFxuICAgICdmbGV4LWdyb3cnLFxuICAgICdmbGV4LXBvc2l0aXZlJyxcbiAgICAnZmxleC1zaHJpbmsnLFxuICAgICdmbGV4LW5lZ2F0aXZlJyxcbiAgICAnZm9udC13ZWlnaHQnLFxuICAgICdsaW5lLWNsYW1wJyxcbiAgICAnbGluZS1oZWlnaHQnLFxuICAgICdvcGFjaXR5JyxcbiAgICAnb3JkZXInLFxuICAgICdvcnBoYW5zJyxcbiAgICAndGFiLXNpemUnLFxuICAgICd3aWRvd3MnLFxuICAgICd6LWluZGV4JyxcbiAgICAnem9vbScsXG4gICAgLy8gU1ZHIHByb3BlcnRpZXMuXG4gICAgJ2ZpbGwtb3BhY2l0eScsXG4gICAgJ3N0cm9rZS1kYXNob2Zmc2V0JyxcbiAgICAnc3Ryb2tlLW9wYWNpdHknLFxuICAgICdzdHJva2Utd2lkdGgnXG5dO1xuLyoqXG4gKiBNYXAgb2YgY3NzIG51bWJlciBwcm9wZXJ0aWVzLlxuICovXG52YXIgQ1NTX05VTUJFUiA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4vLyBBZGQgdmVuZG9yIHByZWZpeGVzIHRvIGFsbCB1bml0LWxlc3MgcHJvcGVydGllcy5cbmZvciAodmFyIF9pID0gMCwgX2EgPSBbJy13ZWJraXQtJywgJy1tcy0nLCAnLW1vei0nLCAnLW8tJywgJyddOyBfaSA8IF9hLmxlbmd0aDsgX2krKykge1xuICAgIHZhciBwcmVmaXggPSBfYVtfaV07XG4gICAgZm9yICh2YXIgX2IgPSAwLCBjc3NOdW1iZXJQcm9wZXJ0aWVzXzEgPSBjc3NOdW1iZXJQcm9wZXJ0aWVzOyBfYiA8IGNzc051bWJlclByb3BlcnRpZXNfMS5sZW5ndGg7IF9iKyspIHtcbiAgICAgICAgdmFyIHByb3BlcnR5ID0gY3NzTnVtYmVyUHJvcGVydGllc18xW19iXTtcbiAgICAgICAgQ1NTX05VTUJFUltwcmVmaXggKyBwcm9wZXJ0eV0gPSB0cnVlO1xuICAgIH1cbn1cbi8qKlxuICogRXNjYXBlIGEgQ1NTIGNsYXNzIG5hbWUuXG4gKi9cbmV4cG9ydHMuZXNjYXBlID0gZnVuY3Rpb24gKHN0cikgeyByZXR1cm4gc3RyLnJlcGxhY2UoZXNjYXBlUGF0dGVybiwgJ1xcXFwkJicpOyB9O1xuLyoqXG4gKiBUcmFuc2Zvcm0gYSBKYXZhU2NyaXB0IHByb3BlcnR5IGludG8gYSBDU1MgcHJvcGVydHkuXG4gKi9cbmZ1bmN0aW9uIGh5cGhlbmF0ZShwcm9wZXJ0eU5hbWUpIHtcbiAgICByZXR1cm4gcHJvcGVydHlOYW1lXG4gICAgICAgIC5yZXBsYWNlKHVwcGVyQ2FzZVBhdHRlcm4sIHByb3BMb3dlcilcbiAgICAgICAgLnJlcGxhY2UobXNQYXR0ZXJuLCAnLW1zLScpOyAvLyBJbnRlcm5ldCBFeHBsb3JlciB2ZW5kb3IgcHJlZml4LlxufVxuZXhwb3J0cy5oeXBoZW5hdGUgPSBoeXBoZW5hdGU7XG4vKipcbiAqIEdlbmVyYXRlIGEgaGFzaCB2YWx1ZSBmcm9tIGEgc3RyaW5nLlxuICovXG5mdW5jdGlvbiBzdHJpbmdIYXNoKHN0cikge1xuICAgIHZhciB2YWx1ZSA9IDUzODE7XG4gICAgdmFyIGxlbiA9IHN0ci5sZW5ndGg7XG4gICAgd2hpbGUgKGxlbi0tKVxuICAgICAgICB2YWx1ZSA9ICh2YWx1ZSAqIDMzKSBeIHN0ci5jaGFyQ29kZUF0KGxlbik7XG4gICAgcmV0dXJuICh2YWx1ZSA+Pj4gMCkudG9TdHJpbmcoMzYpO1xufVxuZXhwb3J0cy5zdHJpbmdIYXNoID0gc3RyaW5nSGFzaDtcbi8qKlxuICogVHJhbnNmb3JtIGEgc3R5bGUgc3RyaW5nIHRvIGEgQ1NTIHN0cmluZy5cbiAqL1xuZnVuY3Rpb24gc3R5bGVUb1N0cmluZyhrZXksIHZhbHVlKSB7XG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicgJiYgdmFsdWUgIT09IDAgJiYgIUNTU19OVU1CRVJba2V5XSkge1xuICAgICAgICByZXR1cm4ga2V5ICsgXCI6XCIgKyB2YWx1ZSArIFwicHhcIjtcbiAgICB9XG4gICAgcmV0dXJuIGtleSArIFwiOlwiICsgdmFsdWU7XG59XG4vKipcbiAqIFNvcnQgYW4gYXJyYXkgb2YgdHVwbGVzIGJ5IGZpcnN0IHZhbHVlLlxuICovXG5mdW5jdGlvbiBzb3J0VHVwbGVzKHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIGFbMF0gPiBiWzBdID8gMSA6IC0xOyB9KTtcbn1cbi8qKlxuICogQ2F0ZWdvcml6ZSB1c2VyIHN0eWxlcy5cbiAqL1xuZnVuY3Rpb24gcGFyc2VTdHlsZXMoc3R5bGVzLCBoYXNOZXN0ZWRTdHlsZXMpIHtcbiAgICB2YXIgcHJvcGVydGllcyA9IFtdO1xuICAgIHZhciBuZXN0ZWRTdHlsZXMgPSBbXTtcbiAgICB2YXIgaXNVbmlxdWUgPSBmYWxzZTtcbiAgICAvLyBTb3J0IGtleXMgYmVmb3JlIGFkZGluZyB0byBzdHlsZXMuXG4gICAgZm9yICh2YXIgX2kgPSAwLCBfYSA9IE9iamVjdC5rZXlzKHN0eWxlcyk7IF9pIDwgX2EubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgIHZhciBrZXkgPSBfYVtfaV07XG4gICAgICAgIHZhciB2YWx1ZSA9IHN0eWxlc1trZXldO1xuICAgICAgICBpZiAodmFsdWUgIT09IG51bGwgJiYgdmFsdWUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgaWYgKGtleSA9PT0gZXhwb3J0cy5JU19VTklRVUUpIHtcbiAgICAgICAgICAgICAgICBpc1VuaXF1ZSA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmICh0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmICFBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgICAgICAgICAgIG5lc3RlZFN0eWxlcy5wdXNoKFtrZXkudHJpbSgpLCB2YWx1ZV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcHJvcGVydGllcy5wdXNoKFtoeXBoZW5hdGUoa2V5LnRyaW0oKSksIHZhbHVlXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgICAgc3R5bGVTdHJpbmc6IHN0cmluZ2lmeVByb3BlcnRpZXMoc29ydFR1cGxlcyhwcm9wZXJ0aWVzKSksXG4gICAgICAgIG5lc3RlZFN0eWxlczogaGFzTmVzdGVkU3R5bGVzID8gbmVzdGVkU3R5bGVzIDogc29ydFR1cGxlcyhuZXN0ZWRTdHlsZXMpLFxuICAgICAgICBpc1VuaXF1ZTogaXNVbmlxdWVcbiAgICB9O1xufVxuLyoqXG4gKiBTdHJpbmdpZnkgYW4gYXJyYXkgb2YgcHJvcGVydHkgdHVwbGVzLlxuICovXG5mdW5jdGlvbiBzdHJpbmdpZnlQcm9wZXJ0aWVzKHByb3BlcnRpZXMpIHtcbiAgICByZXR1cm4gcHJvcGVydGllcy5tYXAoZnVuY3Rpb24gKF9hKSB7XG4gICAgICAgIHZhciBuYW1lID0gX2FbMF0sIHZhbHVlID0gX2FbMV07XG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheSh2YWx1ZSkpXG4gICAgICAgICAgICByZXR1cm4gc3R5bGVUb1N0cmluZyhuYW1lLCB2YWx1ZSk7XG4gICAgICAgIHJldHVybiB2YWx1ZS5tYXAoZnVuY3Rpb24gKHgpIHsgcmV0dXJuIHN0eWxlVG9TdHJpbmcobmFtZSwgeCk7IH0pLmpvaW4oJzsnKTtcbiAgICB9KS5qb2luKCc7Jyk7XG59XG4vKipcbiAqIEludGVycG9sYXRlIENTUyBzZWxlY3RvcnMuXG4gKi9cbmZ1bmN0aW9uIGludGVycG9sYXRlKHNlbGVjdG9yLCBwYXJlbnQpIHtcbiAgICBpZiAoc2VsZWN0b3IuaW5kZXhPZignJicpID4gLTEpIHtcbiAgICAgICAgcmV0dXJuIHNlbGVjdG9yLnJlcGxhY2UoaW50ZXJwb2xhdGVQYXR0ZXJuLCBwYXJlbnQpO1xuICAgIH1cbiAgICByZXR1cm4gcGFyZW50ICsgXCIgXCIgKyBzZWxlY3Rvcjtcbn1cbi8qKlxuICogUmVjdXJzaXZlIGxvb3AgYnVpbGRpbmcgc3R5bGVzIHdpdGggZGVmZXJyZWQgc2VsZWN0b3JzLlxuICovXG5mdW5jdGlvbiBzdHlsaXplKGNhY2hlLCBzZWxlY3Rvciwgc3R5bGVzLCBsaXN0LCBwYXJlbnQpIHtcbiAgICB2YXIgX2EgPSBwYXJzZVN0eWxlcyhzdHlsZXMsICEhc2VsZWN0b3IpLCBzdHlsZVN0cmluZyA9IF9hLnN0eWxlU3RyaW5nLCBuZXN0ZWRTdHlsZXMgPSBfYS5uZXN0ZWRTdHlsZXMsIGlzVW5pcXVlID0gX2EuaXNVbmlxdWU7XG4gICAgdmFyIHBpZCA9IHN0eWxlU3RyaW5nO1xuICAgIGlmIChzZWxlY3Rvci5jaGFyQ29kZUF0KDApID09PSA2NCAvKiBAICovKSB7XG4gICAgICAgIHZhciBydWxlID0gY2FjaGUuYWRkKG5ldyBSdWxlKHNlbGVjdG9yLCBwYXJlbnQgPyB1bmRlZmluZWQgOiBzdHlsZVN0cmluZywgY2FjaGUuaGFzaCkpO1xuICAgICAgICAvLyBOZXN0ZWQgc3R5bGVzIHN1cHBvcnQgKGUuZy4gYC5mb28gPiBAbWVkaWEgPiAuYmFyYCkuXG4gICAgICAgIGlmIChzdHlsZVN0cmluZyAmJiBwYXJlbnQpIHtcbiAgICAgICAgICAgIHZhciBzdHlsZSA9IHJ1bGUuYWRkKG5ldyBTdHlsZShzdHlsZVN0cmluZywgcnVsZS5oYXNoLCBpc1VuaXF1ZSA/IFwidVwiICsgKCsrdW5pcXVlSWQpLnRvU3RyaW5nKDM2KSA6IHVuZGVmaW5lZCkpO1xuICAgICAgICAgICAgbGlzdC5wdXNoKFtwYXJlbnQsIHN0eWxlXSk7XG4gICAgICAgIH1cbiAgICAgICAgZm9yICh2YXIgX2kgPSAwLCBuZXN0ZWRTdHlsZXNfMSA9IG5lc3RlZFN0eWxlczsgX2kgPCBuZXN0ZWRTdHlsZXNfMS5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgICAgIHZhciBfYiA9IG5lc3RlZFN0eWxlc18xW19pXSwgbmFtZSA9IF9iWzBdLCB2YWx1ZSA9IF9iWzFdO1xuICAgICAgICAgICAgcGlkICs9IG5hbWUgKyBzdHlsaXplKHJ1bGUsIG5hbWUsIHZhbHVlLCBsaXN0LCBwYXJlbnQpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICB2YXIga2V5ID0gcGFyZW50ID8gaW50ZXJwb2xhdGUoc2VsZWN0b3IsIHBhcmVudCkgOiBzZWxlY3RvcjtcbiAgICAgICAgaWYgKHN0eWxlU3RyaW5nKSB7XG4gICAgICAgICAgICB2YXIgc3R5bGUgPSBjYWNoZS5hZGQobmV3IFN0eWxlKHN0eWxlU3RyaW5nLCBjYWNoZS5oYXNoLCBpc1VuaXF1ZSA/IFwidVwiICsgKCsrdW5pcXVlSWQpLnRvU3RyaW5nKDM2KSA6IHVuZGVmaW5lZCkpO1xuICAgICAgICAgICAgbGlzdC5wdXNoKFtrZXksIHN0eWxlXSk7XG4gICAgICAgIH1cbiAgICAgICAgZm9yICh2YXIgX2MgPSAwLCBuZXN0ZWRTdHlsZXNfMiA9IG5lc3RlZFN0eWxlczsgX2MgPCBuZXN0ZWRTdHlsZXNfMi5sZW5ndGg7IF9jKyspIHtcbiAgICAgICAgICAgIHZhciBfZCA9IG5lc3RlZFN0eWxlc18yW19jXSwgbmFtZSA9IF9kWzBdLCB2YWx1ZSA9IF9kWzFdO1xuICAgICAgICAgICAgcGlkICs9IG5hbWUgKyBzdHlsaXplKGNhY2hlLCBuYW1lLCB2YWx1ZSwgbGlzdCwga2V5KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcGlkO1xufVxuLyoqXG4gKiBSZWdpc3RlciBhbGwgc3R5bGVzLCBidXQgY29sbGVjdCBmb3Igc2VsZWN0b3IgaW50ZXJwb2xhdGlvbiB1c2luZyB0aGUgaGFzaC5cbiAqL1xuZnVuY3Rpb24gY29tcG9zZVN0eWxlcyhjb250YWluZXIsIHNlbGVjdG9yLCBzdHlsZXMsIGlzU3R5bGUsIGRpc3BsYXlOYW1lKSB7XG4gICAgdmFyIGNhY2hlID0gbmV3IENhY2hlKGNvbnRhaW5lci5oYXNoKTtcbiAgICB2YXIgbGlzdCA9IFtdO1xuICAgIHZhciBwaWQgPSBzdHlsaXplKGNhY2hlLCBzZWxlY3Rvciwgc3R5bGVzLCBsaXN0KTtcbiAgICB2YXIgaGFzaCA9IFwiZlwiICsgY2FjaGUuaGFzaChwaWQpO1xuICAgIHZhciBpZCA9IGRpc3BsYXlOYW1lID8gZGlzcGxheU5hbWUgKyBcIl9cIiArIGhhc2ggOiBoYXNoO1xuICAgIGZvciAodmFyIF9pID0gMCwgbGlzdF8xID0gbGlzdDsgX2kgPCBsaXN0XzEubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgIHZhciBfYSA9IGxpc3RfMVtfaV0sIHNlbGVjdG9yXzEgPSBfYVswXSwgc3R5bGUgPSBfYVsxXTtcbiAgICAgICAgdmFyIGtleSA9IGlzU3R5bGUgPyBpbnRlcnBvbGF0ZShzZWxlY3Rvcl8xLCBcIi5cIiArIGV4cG9ydHMuZXNjYXBlKGlkKSkgOiBzZWxlY3Rvcl8xO1xuICAgICAgICBzdHlsZS5hZGQobmV3IFNlbGVjdG9yKGtleSwgc3R5bGUuaGFzaCwgdW5kZWZpbmVkLCBwaWQpKTtcbiAgICB9XG4gICAgcmV0dXJuIHsgY2FjaGU6IGNhY2hlLCBwaWQ6IHBpZCwgaWQ6IGlkIH07XG59XG4vKipcbiAqIENhY2hlIHRvIGxpc3QgdG8gc3R5bGVzLlxuICovXG5mdW5jdGlvbiBqb2luKGFycikge1xuICAgIHZhciByZXMgPSAnJztcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKylcbiAgICAgICAgcmVzICs9IGFycltpXTtcbiAgICByZXR1cm4gcmVzO1xufVxuLyoqXG4gKiBOb29wIGNoYW5nZXMuXG4gKi9cbnZhciBub29wQ2hhbmdlcyA9IHtcbiAgICBhZGQ6IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHVuZGVmaW5lZDsgfSxcbiAgICBjaGFuZ2U6IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHVuZGVmaW5lZDsgfSxcbiAgICByZW1vdmU6IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHVuZGVmaW5lZDsgfVxufTtcbi8qKlxuICogSW1wbGVtZW50IGEgY2FjaGUvZXZlbnQgZW1pdHRlci5cbiAqL1xudmFyIENhY2hlID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIENhY2hlKGhhc2gsIGNoYW5nZXMpIHtcbiAgICAgICAgaWYgKGhhc2ggPT09IHZvaWQgMCkgeyBoYXNoID0gc3RyaW5nSGFzaDsgfVxuICAgICAgICBpZiAoY2hhbmdlcyA9PT0gdm9pZCAwKSB7IGNoYW5nZXMgPSBub29wQ2hhbmdlczsgfVxuICAgICAgICB0aGlzLmhhc2ggPSBoYXNoO1xuICAgICAgICB0aGlzLmNoYW5nZXMgPSBjaGFuZ2VzO1xuICAgICAgICB0aGlzLnNoZWV0ID0gW107XG4gICAgICAgIHRoaXMuY2hhbmdlSWQgPSAwO1xuICAgICAgICB0aGlzLl9rZXlzID0gW107XG4gICAgICAgIHRoaXMuX2NoaWxkcmVuID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICAgICAgdGhpcy5fY291bnRlcnMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgIH1cbiAgICBDYWNoZS5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24gKHN0eWxlKSB7XG4gICAgICAgIHZhciBjb3VudCA9IHRoaXMuX2NvdW50ZXJzW3N0eWxlLmlkXSB8fCAwO1xuICAgICAgICB2YXIgaXRlbSA9IHRoaXMuX2NoaWxkcmVuW3N0eWxlLmlkXSB8fCBzdHlsZS5jbG9uZSgpO1xuICAgICAgICB0aGlzLl9jb3VudGVyc1tzdHlsZS5pZF0gPSBjb3VudCArIDE7XG4gICAgICAgIGlmIChjb3VudCA9PT0gMCkge1xuICAgICAgICAgICAgdGhpcy5fY2hpbGRyZW5baXRlbS5pZF0gPSBpdGVtO1xuICAgICAgICAgICAgdGhpcy5fa2V5cy5wdXNoKGl0ZW0uaWQpO1xuICAgICAgICAgICAgdGhpcy5zaGVldC5wdXNoKGl0ZW0uZ2V0U3R5bGVzKCkpO1xuICAgICAgICAgICAgdGhpcy5jaGFuZ2VJZCsrO1xuICAgICAgICAgICAgdGhpcy5jaGFuZ2VzLmFkZChpdGVtLCB0aGlzLl9rZXlzLmxlbmd0aCAtIDEpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgLy8gQ2hlY2sgaWYgY29udGVudHMgYXJlIGRpZmZlcmVudC5cbiAgICAgICAgICAgIGlmIChpdGVtLmdldElkZW50aWZpZXIoKSAhPT0gc3R5bGUuZ2V0SWRlbnRpZmllcigpKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkhhc2ggY29sbGlzaW9uOiBcIiArIHN0eWxlLmdldFN0eWxlcygpICsgXCIgPT09IFwiICsgaXRlbS5nZXRTdHlsZXMoKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgb2xkSW5kZXggPSB0aGlzLl9rZXlzLmluZGV4T2Yoc3R5bGUuaWQpO1xuICAgICAgICAgICAgdmFyIG5ld0luZGV4ID0gdGhpcy5fa2V5cy5sZW5ndGggLSAxO1xuICAgICAgICAgICAgdmFyIHByZXZDaGFuZ2VJZCA9IHRoaXMuY2hhbmdlSWQ7XG4gICAgICAgICAgICBpZiAob2xkSW5kZXggIT09IG5ld0luZGV4KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fa2V5cy5zcGxpY2Uob2xkSW5kZXgsIDEpO1xuICAgICAgICAgICAgICAgIHRoaXMuX2tleXMucHVzaChzdHlsZS5pZCk7XG4gICAgICAgICAgICAgICAgdGhpcy5jaGFuZ2VJZCsrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGl0ZW0gaW5zdGFuY2VvZiBDYWNoZSAmJiBzdHlsZSBpbnN0YW5jZW9mIENhY2hlKSB7XG4gICAgICAgICAgICAgICAgdmFyIHByZXZDaGFuZ2VJZF8xID0gaXRlbS5jaGFuZ2VJZDtcbiAgICAgICAgICAgICAgICBpdGVtLm1lcmdlKHN0eWxlKTtcbiAgICAgICAgICAgICAgICBpZiAoaXRlbS5jaGFuZ2VJZCAhPT0gcHJldkNoYW5nZUlkXzEpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jaGFuZ2VJZCsrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLmNoYW5nZUlkICE9PSBwcmV2Q2hhbmdlSWQpIHtcbiAgICAgICAgICAgICAgICBpZiAob2xkSW5kZXggPT09IG5ld0luZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2hlZXQuc3BsaWNlKG9sZEluZGV4LCAxLCBpdGVtLmdldFN0eWxlcygpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2hlZXQuc3BsaWNlKG9sZEluZGV4LCAxKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zaGVldC5zcGxpY2UobmV3SW5kZXgsIDAsIGl0ZW0uZ2V0U3R5bGVzKCkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLmNoYW5nZXMuY2hhbmdlKGl0ZW0sIG9sZEluZGV4LCBuZXdJbmRleCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGl0ZW07XG4gICAgfTtcbiAgICBDYWNoZS5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24gKHN0eWxlKSB7XG4gICAgICAgIHZhciBjb3VudCA9IHRoaXMuX2NvdW50ZXJzW3N0eWxlLmlkXTtcbiAgICAgICAgaWYgKGNvdW50ID4gMCkge1xuICAgICAgICAgICAgdGhpcy5fY291bnRlcnNbc3R5bGUuaWRdID0gY291bnQgLSAxO1xuICAgICAgICAgICAgdmFyIGl0ZW0gPSB0aGlzLl9jaGlsZHJlbltzdHlsZS5pZF07XG4gICAgICAgICAgICB2YXIgaW5kZXggPSB0aGlzLl9rZXlzLmluZGV4T2YoaXRlbS5pZCk7XG4gICAgICAgICAgICBpZiAoY291bnQgPT09IDEpIHtcbiAgICAgICAgICAgICAgICBkZWxldGUgdGhpcy5fY291bnRlcnNbc3R5bGUuaWRdO1xuICAgICAgICAgICAgICAgIGRlbGV0ZSB0aGlzLl9jaGlsZHJlbltzdHlsZS5pZF07XG4gICAgICAgICAgICAgICAgdGhpcy5fa2V5cy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2hlZXQuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgICAgICB0aGlzLmNoYW5nZUlkKys7XG4gICAgICAgICAgICAgICAgdGhpcy5jaGFuZ2VzLnJlbW92ZShpdGVtLCBpbmRleCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChpdGVtIGluc3RhbmNlb2YgQ2FjaGUgJiYgc3R5bGUgaW5zdGFuY2VvZiBDYWNoZSkge1xuICAgICAgICAgICAgICAgIHZhciBwcmV2Q2hhbmdlSWQgPSBpdGVtLmNoYW5nZUlkO1xuICAgICAgICAgICAgICAgIGl0ZW0udW5tZXJnZShzdHlsZSk7XG4gICAgICAgICAgICAgICAgaWYgKGl0ZW0uY2hhbmdlSWQgIT09IHByZXZDaGFuZ2VJZCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNoZWV0LnNwbGljZShpbmRleCwgMSwgaXRlbS5nZXRTdHlsZXMoKSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2hhbmdlSWQrKztcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jaGFuZ2VzLmNoYW5nZShpdGVtLCBpbmRleCwgaW5kZXgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG4gICAgQ2FjaGUucHJvdG90eXBlLm1lcmdlID0gZnVuY3Rpb24gKGNhY2hlKSB7XG4gICAgICAgIGZvciAodmFyIF9pID0gMCwgX2EgPSBjYWNoZS5fa2V5czsgX2kgPCBfYS5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgICAgIHZhciBpZCA9IF9hW19pXTtcbiAgICAgICAgICAgIHRoaXMuYWRkKGNhY2hlLl9jaGlsZHJlbltpZF0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgQ2FjaGUucHJvdG90eXBlLnVubWVyZ2UgPSBmdW5jdGlvbiAoY2FjaGUpIHtcbiAgICAgICAgZm9yICh2YXIgX2kgPSAwLCBfYSA9IGNhY2hlLl9rZXlzOyBfaSA8IF9hLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgdmFyIGlkID0gX2FbX2ldO1xuICAgICAgICAgICAgdGhpcy5yZW1vdmUoY2FjaGUuX2NoaWxkcmVuW2lkXSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBDYWNoZS5wcm90b3R5cGUuY2xvbmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBuZXcgQ2FjaGUodGhpcy5oYXNoKS5tZXJnZSh0aGlzKTtcbiAgICB9O1xuICAgIHJldHVybiBDYWNoZTtcbn0oKSk7XG5leHBvcnRzLkNhY2hlID0gQ2FjaGU7XG4vKipcbiAqIFNlbGVjdG9yIGlzIGEgZHVtYiBjbGFzcyBtYWRlIHRvIHJlcHJlc2VudCBuZXN0ZWQgQ1NTIHNlbGVjdG9ycy5cbiAqL1xudmFyIFNlbGVjdG9yID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFNlbGVjdG9yKHNlbGVjdG9yLCBoYXNoLCBpZCwgcGlkKSB7XG4gICAgICAgIGlmIChpZCA9PT0gdm9pZCAwKSB7IGlkID0gXCJzXCIgKyBoYXNoKHNlbGVjdG9yKTsgfVxuICAgICAgICBpZiAocGlkID09PSB2b2lkIDApIHsgcGlkID0gJyc7IH1cbiAgICAgICAgdGhpcy5zZWxlY3RvciA9IHNlbGVjdG9yO1xuICAgICAgICB0aGlzLmhhc2ggPSBoYXNoO1xuICAgICAgICB0aGlzLmlkID0gaWQ7XG4gICAgICAgIHRoaXMucGlkID0gcGlkO1xuICAgIH1cbiAgICBTZWxlY3Rvci5wcm90b3R5cGUuZ2V0U3R5bGVzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zZWxlY3RvcjtcbiAgICB9O1xuICAgIFNlbGVjdG9yLnByb3RvdHlwZS5nZXRJZGVudGlmaWVyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5waWQgKyBcIi5cIiArIHRoaXMuc2VsZWN0b3I7XG4gICAgfTtcbiAgICBTZWxlY3Rvci5wcm90b3R5cGUuY2xvbmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBuZXcgU2VsZWN0b3IodGhpcy5zZWxlY3RvciwgdGhpcy5oYXNoLCB0aGlzLmlkLCB0aGlzLnBpZCk7XG4gICAgfTtcbiAgICByZXR1cm4gU2VsZWN0b3I7XG59KCkpO1xuZXhwb3J0cy5TZWxlY3RvciA9IFNlbGVjdG9yO1xuLyoqXG4gKiBUaGUgc3R5bGUgY29udGFpbmVyIHJlZ2lzdGVycyBhIHN0eWxlIHN0cmluZyB3aXRoIHNlbGVjdG9ycy5cbiAqL1xudmFyIFN0eWxlID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKF9zdXBlcikge1xuICAgIF9fZXh0ZW5kcyhTdHlsZSwgX3N1cGVyKTtcbiAgICBmdW5jdGlvbiBTdHlsZShzdHlsZSwgaGFzaCwgaWQpIHtcbiAgICAgICAgaWYgKGlkID09PSB2b2lkIDApIHsgaWQgPSBcImNcIiArIGhhc2goc3R5bGUpOyB9XG4gICAgICAgIHZhciBfdGhpcyA9IF9zdXBlci5jYWxsKHRoaXMsIGhhc2gpIHx8IHRoaXM7XG4gICAgICAgIF90aGlzLnN0eWxlID0gc3R5bGU7XG4gICAgICAgIF90aGlzLmhhc2ggPSBoYXNoO1xuICAgICAgICBfdGhpcy5pZCA9IGlkO1xuICAgICAgICByZXR1cm4gX3RoaXM7XG4gICAgfVxuICAgIFN0eWxlLnByb3RvdHlwZS5nZXRTdHlsZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnNoZWV0LmpvaW4oJywnKSArIFwie1wiICsgdGhpcy5zdHlsZSArIFwifVwiO1xuICAgIH07XG4gICAgU3R5bGUucHJvdG90eXBlLmdldElkZW50aWZpZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnN0eWxlO1xuICAgIH07XG4gICAgU3R5bGUucHJvdG90eXBlLmNsb25lID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gbmV3IFN0eWxlKHRoaXMuc3R5bGUsIHRoaXMuaGFzaCwgdGhpcy5pZCkubWVyZ2UodGhpcyk7XG4gICAgfTtcbiAgICByZXR1cm4gU3R5bGU7XG59KENhY2hlKSk7XG5leHBvcnRzLlN0eWxlID0gU3R5bGU7XG4vKipcbiAqIEltcGxlbWVudCBydWxlIGxvZ2ljIGZvciBzdHlsZSBvdXRwdXQuXG4gKi9cbnZhciBSdWxlID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKF9zdXBlcikge1xuICAgIF9fZXh0ZW5kcyhSdWxlLCBfc3VwZXIpO1xuICAgIGZ1bmN0aW9uIFJ1bGUocnVsZSwgc3R5bGUsIGhhc2gsIGlkLCBwaWQpIHtcbiAgICAgICAgaWYgKHN0eWxlID09PSB2b2lkIDApIHsgc3R5bGUgPSAnJzsgfVxuICAgICAgICBpZiAoaWQgPT09IHZvaWQgMCkgeyBpZCA9IFwiYVwiICsgaGFzaChydWxlICsgXCIuXCIgKyBzdHlsZSk7IH1cbiAgICAgICAgaWYgKHBpZCA9PT0gdm9pZCAwKSB7IHBpZCA9ICcnOyB9XG4gICAgICAgIHZhciBfdGhpcyA9IF9zdXBlci5jYWxsKHRoaXMsIGhhc2gpIHx8IHRoaXM7XG4gICAgICAgIF90aGlzLnJ1bGUgPSBydWxlO1xuICAgICAgICBfdGhpcy5zdHlsZSA9IHN0eWxlO1xuICAgICAgICBfdGhpcy5oYXNoID0gaGFzaDtcbiAgICAgICAgX3RoaXMuaWQgPSBpZDtcbiAgICAgICAgX3RoaXMucGlkID0gcGlkO1xuICAgICAgICByZXR1cm4gX3RoaXM7XG4gICAgfVxuICAgIFJ1bGUucHJvdG90eXBlLmdldFN0eWxlcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucnVsZSArIFwie1wiICsgdGhpcy5zdHlsZSArIGpvaW4odGhpcy5zaGVldCkgKyBcIn1cIjtcbiAgICB9O1xuICAgIFJ1bGUucHJvdG90eXBlLmdldElkZW50aWZpZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnBpZCArIFwiLlwiICsgdGhpcy5ydWxlICsgXCIuXCIgKyB0aGlzLnN0eWxlO1xuICAgIH07XG4gICAgUnVsZS5wcm90b3R5cGUuY2xvbmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBuZXcgUnVsZSh0aGlzLnJ1bGUsIHRoaXMuc3R5bGUsIHRoaXMuaGFzaCwgdGhpcy5pZCwgdGhpcy5waWQpLm1lcmdlKHRoaXMpO1xuICAgIH07XG4gICAgcmV0dXJuIFJ1bGU7XG59KENhY2hlKSk7XG5leHBvcnRzLlJ1bGUgPSBSdWxlO1xuLyoqXG4gKiBUaGUgRnJlZVN0eWxlIGNsYXNzIGltcGxlbWVudHMgdGhlIEFQSSBmb3IgZXZlcnl0aGluZyBlbHNlLlxuICovXG52YXIgRnJlZVN0eWxlID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKF9zdXBlcikge1xuICAgIF9fZXh0ZW5kcyhGcmVlU3R5bGUsIF9zdXBlcik7XG4gICAgZnVuY3Rpb24gRnJlZVN0eWxlKGhhc2gsIGRlYnVnLCBpZCwgY2hhbmdlcykge1xuICAgICAgICBpZiAoaGFzaCA9PT0gdm9pZCAwKSB7IGhhc2ggPSBzdHJpbmdIYXNoOyB9XG4gICAgICAgIGlmIChkZWJ1ZyA9PT0gdm9pZCAwKSB7IGRlYnVnID0gdHlwZW9mIHByb2Nlc3MgIT09ICd1bmRlZmluZWQnICYmIHByb2Nlc3MuZW52WydOT0RFX0VOViddICE9PSAncHJvZHVjdGlvbic7IH1cbiAgICAgICAgaWYgKGlkID09PSB2b2lkIDApIHsgaWQgPSBcImZcIiArICgrK3VuaXF1ZUlkKS50b1N0cmluZygzNik7IH1cbiAgICAgICAgdmFyIF90aGlzID0gX3N1cGVyLmNhbGwodGhpcywgaGFzaCwgY2hhbmdlcykgfHwgdGhpcztcbiAgICAgICAgX3RoaXMuaGFzaCA9IGhhc2g7XG4gICAgICAgIF90aGlzLmRlYnVnID0gZGVidWc7XG4gICAgICAgIF90aGlzLmlkID0gaWQ7XG4gICAgICAgIHJldHVybiBfdGhpcztcbiAgICB9XG4gICAgRnJlZVN0eWxlLnByb3RvdHlwZS5yZWdpc3RlclN0eWxlID0gZnVuY3Rpb24gKHN0eWxlcywgZGlzcGxheU5hbWUpIHtcbiAgICAgICAgdmFyIGRlYnVnTmFtZSA9IHRoaXMuZGVidWcgPyBkaXNwbGF5TmFtZSA6IHVuZGVmaW5lZDtcbiAgICAgICAgdmFyIF9hID0gY29tcG9zZVN0eWxlcyh0aGlzLCAnJicsIHN0eWxlcywgdHJ1ZSwgZGVidWdOYW1lKSwgY2FjaGUgPSBfYS5jYWNoZSwgaWQgPSBfYS5pZDtcbiAgICAgICAgdGhpcy5tZXJnZShjYWNoZSk7XG4gICAgICAgIHJldHVybiBpZDtcbiAgICB9O1xuICAgIEZyZWVTdHlsZS5wcm90b3R5cGUucmVnaXN0ZXJLZXlmcmFtZXMgPSBmdW5jdGlvbiAoa2V5ZnJhbWVzLCBkaXNwbGF5TmFtZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5yZWdpc3Rlckhhc2hSdWxlKCdAa2V5ZnJhbWVzJywga2V5ZnJhbWVzLCBkaXNwbGF5TmFtZSk7XG4gICAgfTtcbiAgICBGcmVlU3R5bGUucHJvdG90eXBlLnJlZ2lzdGVySGFzaFJ1bGUgPSBmdW5jdGlvbiAocHJlZml4LCBzdHlsZXMsIGRpc3BsYXlOYW1lKSB7XG4gICAgICAgIHZhciBkZWJ1Z05hbWUgPSB0aGlzLmRlYnVnID8gZGlzcGxheU5hbWUgOiB1bmRlZmluZWQ7XG4gICAgICAgIHZhciBfYSA9IGNvbXBvc2VTdHlsZXModGhpcywgJycsIHN0eWxlcywgZmFsc2UsIGRlYnVnTmFtZSksIGNhY2hlID0gX2EuY2FjaGUsIHBpZCA9IF9hLnBpZCwgaWQgPSBfYS5pZDtcbiAgICAgICAgdmFyIHJ1bGUgPSBuZXcgUnVsZShwcmVmaXggKyBcIiBcIiArIGV4cG9ydHMuZXNjYXBlKGlkKSwgdW5kZWZpbmVkLCB0aGlzLmhhc2gsIHVuZGVmaW5lZCwgcGlkKTtcbiAgICAgICAgdGhpcy5hZGQocnVsZS5tZXJnZShjYWNoZSkpO1xuICAgICAgICByZXR1cm4gaWQ7XG4gICAgfTtcbiAgICBGcmVlU3R5bGUucHJvdG90eXBlLnJlZ2lzdGVyUnVsZSA9IGZ1bmN0aW9uIChydWxlLCBzdHlsZXMpIHtcbiAgICAgICAgdGhpcy5tZXJnZShjb21wb3NlU3R5bGVzKHRoaXMsIHJ1bGUsIHN0eWxlcywgZmFsc2UpLmNhY2hlKTtcbiAgICB9O1xuICAgIEZyZWVTdHlsZS5wcm90b3R5cGUucmVnaXN0ZXJDc3MgPSBmdW5jdGlvbiAoc3R5bGVzKSB7XG4gICAgICAgIHRoaXMubWVyZ2UoY29tcG9zZVN0eWxlcyh0aGlzLCAnJywgc3R5bGVzLCBmYWxzZSkuY2FjaGUpO1xuICAgIH07XG4gICAgRnJlZVN0eWxlLnByb3RvdHlwZS5nZXRTdHlsZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBqb2luKHRoaXMuc2hlZXQpO1xuICAgIH07XG4gICAgRnJlZVN0eWxlLnByb3RvdHlwZS5nZXRJZGVudGlmaWVyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5pZDtcbiAgICB9O1xuICAgIEZyZWVTdHlsZS5wcm90b3R5cGUuY2xvbmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBuZXcgRnJlZVN0eWxlKHRoaXMuaGFzaCwgdGhpcy5kZWJ1ZywgdGhpcy5pZCwgdGhpcy5jaGFuZ2VzKS5tZXJnZSh0aGlzKTtcbiAgICB9O1xuICAgIHJldHVybiBGcmVlU3R5bGU7XG59KENhY2hlKSk7XG5leHBvcnRzLkZyZWVTdHlsZSA9IEZyZWVTdHlsZTtcbi8qKlxuICogRXhwb3J0cyBhIHNpbXBsZSBmdW5jdGlvbiB0byBjcmVhdGUgYSBuZXcgaW5zdGFuY2UuXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZShoYXNoLCBkZWJ1ZywgY2hhbmdlcykge1xuICAgIHJldHVybiBuZXcgRnJlZVN0eWxlKGhhc2gsIGRlYnVnLCB1bmRlZmluZWQsIGNoYW5nZXMpO1xufVxuZXhwb3J0cy5jcmVhdGUgPSBjcmVhdGU7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1mcmVlLXN0eWxlLmpzLm1hcCIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcbnZhciBjYW5Vc2VET00gPSBleHBvcnRzLmNhblVzZURPTSA9ICEhKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmIHdpbmRvdy5kb2N1bWVudCAmJiB3aW5kb3cuZG9jdW1lbnQuY3JlYXRlRWxlbWVudCk7XG5cbnZhciBhZGRFdmVudExpc3RlbmVyID0gZXhwb3J0cy5hZGRFdmVudExpc3RlbmVyID0gZnVuY3Rpb24gYWRkRXZlbnRMaXN0ZW5lcihub2RlLCBldmVudCwgbGlzdGVuZXIpIHtcbiAgcmV0dXJuIG5vZGUuYWRkRXZlbnRMaXN0ZW5lciA/IG5vZGUuYWRkRXZlbnRMaXN0ZW5lcihldmVudCwgbGlzdGVuZXIsIGZhbHNlKSA6IG5vZGUuYXR0YWNoRXZlbnQoJ29uJyArIGV2ZW50LCBsaXN0ZW5lcik7XG59O1xuXG52YXIgcmVtb3ZlRXZlbnRMaXN0ZW5lciA9IGV4cG9ydHMucmVtb3ZlRXZlbnRMaXN0ZW5lciA9IGZ1bmN0aW9uIHJlbW92ZUV2ZW50TGlzdGVuZXIobm9kZSwgZXZlbnQsIGxpc3RlbmVyKSB7XG4gIHJldHVybiBub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIgPyBub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnQsIGxpc3RlbmVyLCBmYWxzZSkgOiBub2RlLmRldGFjaEV2ZW50KCdvbicgKyBldmVudCwgbGlzdGVuZXIpO1xufTtcblxudmFyIGdldENvbmZpcm1hdGlvbiA9IGV4cG9ydHMuZ2V0Q29uZmlybWF0aW9uID0gZnVuY3Rpb24gZ2V0Q29uZmlybWF0aW9uKG1lc3NhZ2UsIGNhbGxiYWNrKSB7XG4gIHJldHVybiBjYWxsYmFjayh3aW5kb3cuY29uZmlybShtZXNzYWdlKSk7XG59OyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWFsZXJ0XG5cbi8qKlxuICogUmV0dXJucyB0cnVlIGlmIHRoZSBIVE1MNSBoaXN0b3J5IEFQSSBpcyBzdXBwb3J0ZWQuIFRha2VuIGZyb20gTW9kZXJuaXpyLlxuICpcbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS9Nb2Rlcm5penIvTW9kZXJuaXpyL2Jsb2IvbWFzdGVyL0xJQ0VOU0VcbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS9Nb2Rlcm5penIvTW9kZXJuaXpyL2Jsb2IvbWFzdGVyL2ZlYXR1cmUtZGV0ZWN0cy9oaXN0b3J5LmpzXG4gKiBjaGFuZ2VkIHRvIGF2b2lkIGZhbHNlIG5lZ2F0aXZlcyBmb3IgV2luZG93cyBQaG9uZXM6IGh0dHBzOi8vZ2l0aHViLmNvbS9yZWFjdGpzL3JlYWN0LXJvdXRlci9pc3N1ZXMvNTg2XG4gKi9cbnZhciBzdXBwb3J0c0hpc3RvcnkgPSBleHBvcnRzLnN1cHBvcnRzSGlzdG9yeSA9IGZ1bmN0aW9uIHN1cHBvcnRzSGlzdG9yeSgpIHtcbiAgdmFyIHVhID0gd2luZG93Lm5hdmlnYXRvci51c2VyQWdlbnQ7XG5cbiAgaWYgKCh1YS5pbmRleE9mKCdBbmRyb2lkIDIuJykgIT09IC0xIHx8IHVhLmluZGV4T2YoJ0FuZHJvaWQgNC4wJykgIT09IC0xKSAmJiB1YS5pbmRleE9mKCdNb2JpbGUgU2FmYXJpJykgIT09IC0xICYmIHVhLmluZGV4T2YoJ0Nocm9tZScpID09PSAtMSAmJiB1YS5pbmRleE9mKCdXaW5kb3dzIFBob25lJykgPT09IC0xKSByZXR1cm4gZmFsc2U7XG5cbiAgcmV0dXJuIHdpbmRvdy5oaXN0b3J5ICYmICdwdXNoU3RhdGUnIGluIHdpbmRvdy5oaXN0b3J5O1xufTtcblxuLyoqXG4gKiBSZXR1cm5zIHRydWUgaWYgYnJvd3NlciBmaXJlcyBwb3BzdGF0ZSBvbiBoYXNoIGNoYW5nZS5cbiAqIElFMTAgYW5kIElFMTEgZG8gbm90LlxuICovXG52YXIgc3VwcG9ydHNQb3BTdGF0ZU9uSGFzaENoYW5nZSA9IGV4cG9ydHMuc3VwcG9ydHNQb3BTdGF0ZU9uSGFzaENoYW5nZSA9IGZ1bmN0aW9uIHN1cHBvcnRzUG9wU3RhdGVPbkhhc2hDaGFuZ2UoKSB7XG4gIHJldHVybiB3aW5kb3cubmF2aWdhdG9yLnVzZXJBZ2VudC5pbmRleE9mKCdUcmlkZW50JykgPT09IC0xO1xufTtcblxuLyoqXG4gKiBSZXR1cm5zIGZhbHNlIGlmIHVzaW5nIGdvKG4pIHdpdGggaGFzaCBoaXN0b3J5IGNhdXNlcyBhIGZ1bGwgcGFnZSByZWxvYWQuXG4gKi9cbnZhciBzdXBwb3J0c0dvV2l0aG91dFJlbG9hZFVzaW5nSGFzaCA9IGV4cG9ydHMuc3VwcG9ydHNHb1dpdGhvdXRSZWxvYWRVc2luZ0hhc2ggPSBmdW5jdGlvbiBzdXBwb3J0c0dvV2l0aG91dFJlbG9hZFVzaW5nSGFzaCgpIHtcbiAgcmV0dXJuIHdpbmRvdy5uYXZpZ2F0b3IudXNlckFnZW50LmluZGV4T2YoJ0ZpcmVmb3gnKSA9PT0gLTE7XG59O1xuXG4vKipcbiAqIFJldHVybnMgdHJ1ZSBpZiBhIGdpdmVuIHBvcHN0YXRlIGV2ZW50IGlzIGFuIGV4dHJhbmVvdXMgV2ViS2l0IGV2ZW50LlxuICogQWNjb3VudHMgZm9yIHRoZSBmYWN0IHRoYXQgQ2hyb21lIG9uIGlPUyBmaXJlcyByZWFsIHBvcHN0YXRlIGV2ZW50c1xuICogY29udGFpbmluZyB1bmRlZmluZWQgc3RhdGUgd2hlbiBwcmVzc2luZyB0aGUgYmFjayBidXR0b24uXG4gKi9cbnZhciBpc0V4dHJhbmVvdXNQb3BzdGF0ZUV2ZW50ID0gZXhwb3J0cy5pc0V4dHJhbmVvdXNQb3BzdGF0ZUV2ZW50ID0gZnVuY3Rpb24gaXNFeHRyYW5lb3VzUG9wc3RhdGVFdmVudChldmVudCkge1xuICByZXR1cm4gZXZlbnQuc3RhdGUgPT09IHVuZGVmaW5lZCAmJiBuYXZpZ2F0b3IudXNlckFnZW50LmluZGV4T2YoJ0NyaU9TJykgPT09IC0xO1xufTsiLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5leHBvcnRzLmxvY2F0aW9uc0FyZUVxdWFsID0gZXhwb3J0cy5jcmVhdGVMb2NhdGlvbiA9IHVuZGVmaW5lZDtcblxudmFyIF9leHRlbmRzID0gT2JqZWN0LmFzc2lnbiB8fCBmdW5jdGlvbiAodGFyZ2V0KSB7IGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7IHZhciBzb3VyY2UgPSBhcmd1bWVudHNbaV07IGZvciAodmFyIGtleSBpbiBzb3VyY2UpIHsgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzb3VyY2UsIGtleSkpIHsgdGFyZ2V0W2tleV0gPSBzb3VyY2Vba2V5XTsgfSB9IH0gcmV0dXJuIHRhcmdldDsgfTtcblxudmFyIF9yZXNvbHZlUGF0aG5hbWUgPSByZXF1aXJlKCdyZXNvbHZlLXBhdGhuYW1lJyk7XG5cbnZhciBfcmVzb2x2ZVBhdGhuYW1lMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3Jlc29sdmVQYXRobmFtZSk7XG5cbnZhciBfdmFsdWVFcXVhbCA9IHJlcXVpcmUoJ3ZhbHVlLWVxdWFsJyk7XG5cbnZhciBfdmFsdWVFcXVhbDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF92YWx1ZUVxdWFsKTtcblxudmFyIF9QYXRoVXRpbHMgPSByZXF1aXJlKCcuL1BhdGhVdGlscycpO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyBkZWZhdWx0OiBvYmogfTsgfVxuXG52YXIgY3JlYXRlTG9jYXRpb24gPSBleHBvcnRzLmNyZWF0ZUxvY2F0aW9uID0gZnVuY3Rpb24gY3JlYXRlTG9jYXRpb24ocGF0aCwgc3RhdGUsIGtleSwgY3VycmVudExvY2F0aW9uKSB7XG4gIHZhciBsb2NhdGlvbiA9IHZvaWQgMDtcbiAgaWYgKHR5cGVvZiBwYXRoID09PSAnc3RyaW5nJykge1xuICAgIC8vIFR3by1hcmcgZm9ybTogcHVzaChwYXRoLCBzdGF0ZSlcbiAgICBsb2NhdGlvbiA9ICgwLCBfUGF0aFV0aWxzLnBhcnNlUGF0aCkocGF0aCk7XG4gICAgbG9jYXRpb24uc3RhdGUgPSBzdGF0ZTtcbiAgfSBlbHNlIHtcbiAgICAvLyBPbmUtYXJnIGZvcm06IHB1c2gobG9jYXRpb24pXG4gICAgbG9jYXRpb24gPSBfZXh0ZW5kcyh7fSwgcGF0aCk7XG5cbiAgICBpZiAobG9jYXRpb24ucGF0aG5hbWUgPT09IHVuZGVmaW5lZCkgbG9jYXRpb24ucGF0aG5hbWUgPSAnJztcblxuICAgIGlmIChsb2NhdGlvbi5zZWFyY2gpIHtcbiAgICAgIGlmIChsb2NhdGlvbi5zZWFyY2guY2hhckF0KDApICE9PSAnPycpIGxvY2F0aW9uLnNlYXJjaCA9ICc/JyArIGxvY2F0aW9uLnNlYXJjaDtcbiAgICB9IGVsc2Uge1xuICAgICAgbG9jYXRpb24uc2VhcmNoID0gJyc7XG4gICAgfVxuXG4gICAgaWYgKGxvY2F0aW9uLmhhc2gpIHtcbiAgICAgIGlmIChsb2NhdGlvbi5oYXNoLmNoYXJBdCgwKSAhPT0gJyMnKSBsb2NhdGlvbi5oYXNoID0gJyMnICsgbG9jYXRpb24uaGFzaDtcbiAgICB9IGVsc2Uge1xuICAgICAgbG9jYXRpb24uaGFzaCA9ICcnO1xuICAgIH1cblxuICAgIGlmIChzdGF0ZSAhPT0gdW5kZWZpbmVkICYmIGxvY2F0aW9uLnN0YXRlID09PSB1bmRlZmluZWQpIGxvY2F0aW9uLnN0YXRlID0gc3RhdGU7XG4gIH1cblxuICB0cnkge1xuICAgIGxvY2F0aW9uLnBhdGhuYW1lID0gZGVjb2RlVVJJKGxvY2F0aW9uLnBhdGhuYW1lKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGlmIChlIGluc3RhbmNlb2YgVVJJRXJyb3IpIHtcbiAgICAgIHRocm93IG5ldyBVUklFcnJvcignUGF0aG5hbWUgXCInICsgbG9jYXRpb24ucGF0aG5hbWUgKyAnXCIgY291bGQgbm90IGJlIGRlY29kZWQuICcgKyAnVGhpcyBpcyBsaWtlbHkgY2F1c2VkIGJ5IGFuIGludmFsaWQgcGVyY2VudC1lbmNvZGluZy4nKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgZTtcbiAgICB9XG4gIH1cblxuICBpZiAoa2V5KSBsb2NhdGlvbi5rZXkgPSBrZXk7XG5cbiAgaWYgKGN1cnJlbnRMb2NhdGlvbikge1xuICAgIC8vIFJlc29sdmUgaW5jb21wbGV0ZS9yZWxhdGl2ZSBwYXRobmFtZSByZWxhdGl2ZSB0byBjdXJyZW50IGxvY2F0aW9uLlxuICAgIGlmICghbG9jYXRpb24ucGF0aG5hbWUpIHtcbiAgICAgIGxvY2F0aW9uLnBhdGhuYW1lID0gY3VycmVudExvY2F0aW9uLnBhdGhuYW1lO1xuICAgIH0gZWxzZSBpZiAobG9jYXRpb24ucGF0aG5hbWUuY2hhckF0KDApICE9PSAnLycpIHtcbiAgICAgIGxvY2F0aW9uLnBhdGhuYW1lID0gKDAsIF9yZXNvbHZlUGF0aG5hbWUyLmRlZmF1bHQpKGxvY2F0aW9uLnBhdGhuYW1lLCBjdXJyZW50TG9jYXRpb24ucGF0aG5hbWUpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICAvLyBXaGVuIHRoZXJlIGlzIG5vIHByaW9yIGxvY2F0aW9uIGFuZCBwYXRobmFtZSBpcyBlbXB0eSwgc2V0IGl0IHRvIC9cbiAgICBpZiAoIWxvY2F0aW9uLnBhdGhuYW1lKSB7XG4gICAgICBsb2NhdGlvbi5wYXRobmFtZSA9ICcvJztcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbG9jYXRpb247XG59O1xuXG52YXIgbG9jYXRpb25zQXJlRXF1YWwgPSBleHBvcnRzLmxvY2F0aW9uc0FyZUVxdWFsID0gZnVuY3Rpb24gbG9jYXRpb25zQXJlRXF1YWwoYSwgYikge1xuICByZXR1cm4gYS5wYXRobmFtZSA9PT0gYi5wYXRobmFtZSAmJiBhLnNlYXJjaCA9PT0gYi5zZWFyY2ggJiYgYS5oYXNoID09PSBiLmhhc2ggJiYgYS5rZXkgPT09IGIua2V5ICYmICgwLCBfdmFsdWVFcXVhbDIuZGVmYXVsdCkoYS5zdGF0ZSwgYi5zdGF0ZSk7XG59OyIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcbnZhciBhZGRMZWFkaW5nU2xhc2ggPSBleHBvcnRzLmFkZExlYWRpbmdTbGFzaCA9IGZ1bmN0aW9uIGFkZExlYWRpbmdTbGFzaChwYXRoKSB7XG4gIHJldHVybiBwYXRoLmNoYXJBdCgwKSA9PT0gJy8nID8gcGF0aCA6ICcvJyArIHBhdGg7XG59O1xuXG52YXIgc3RyaXBMZWFkaW5nU2xhc2ggPSBleHBvcnRzLnN0cmlwTGVhZGluZ1NsYXNoID0gZnVuY3Rpb24gc3RyaXBMZWFkaW5nU2xhc2gocGF0aCkge1xuICByZXR1cm4gcGF0aC5jaGFyQXQoMCkgPT09ICcvJyA/IHBhdGguc3Vic3RyKDEpIDogcGF0aDtcbn07XG5cbnZhciBoYXNCYXNlbmFtZSA9IGV4cG9ydHMuaGFzQmFzZW5hbWUgPSBmdW5jdGlvbiBoYXNCYXNlbmFtZShwYXRoLCBwcmVmaXgpIHtcbiAgcmV0dXJuIG5ldyBSZWdFeHAoJ14nICsgcHJlZml4ICsgJyhcXFxcL3xcXFxcP3wjfCQpJywgJ2knKS50ZXN0KHBhdGgpO1xufTtcblxudmFyIHN0cmlwQmFzZW5hbWUgPSBleHBvcnRzLnN0cmlwQmFzZW5hbWUgPSBmdW5jdGlvbiBzdHJpcEJhc2VuYW1lKHBhdGgsIHByZWZpeCkge1xuICByZXR1cm4gaGFzQmFzZW5hbWUocGF0aCwgcHJlZml4KSA/IHBhdGguc3Vic3RyKHByZWZpeC5sZW5ndGgpIDogcGF0aDtcbn07XG5cbnZhciBzdHJpcFRyYWlsaW5nU2xhc2ggPSBleHBvcnRzLnN0cmlwVHJhaWxpbmdTbGFzaCA9IGZ1bmN0aW9uIHN0cmlwVHJhaWxpbmdTbGFzaChwYXRoKSB7XG4gIHJldHVybiBwYXRoLmNoYXJBdChwYXRoLmxlbmd0aCAtIDEpID09PSAnLycgPyBwYXRoLnNsaWNlKDAsIC0xKSA6IHBhdGg7XG59O1xuXG52YXIgcGFyc2VQYXRoID0gZXhwb3J0cy5wYXJzZVBhdGggPSBmdW5jdGlvbiBwYXJzZVBhdGgocGF0aCkge1xuICB2YXIgcGF0aG5hbWUgPSBwYXRoIHx8ICcvJztcbiAgdmFyIHNlYXJjaCA9ICcnO1xuICB2YXIgaGFzaCA9ICcnO1xuXG4gIHZhciBoYXNoSW5kZXggPSBwYXRobmFtZS5pbmRleE9mKCcjJyk7XG4gIGlmIChoYXNoSW5kZXggIT09IC0xKSB7XG4gICAgaGFzaCA9IHBhdGhuYW1lLnN1YnN0cihoYXNoSW5kZXgpO1xuICAgIHBhdGhuYW1lID0gcGF0aG5hbWUuc3Vic3RyKDAsIGhhc2hJbmRleCk7XG4gIH1cblxuICB2YXIgc2VhcmNoSW5kZXggPSBwYXRobmFtZS5pbmRleE9mKCc/Jyk7XG4gIGlmIChzZWFyY2hJbmRleCAhPT0gLTEpIHtcbiAgICBzZWFyY2ggPSBwYXRobmFtZS5zdWJzdHIoc2VhcmNoSW5kZXgpO1xuICAgIHBhdGhuYW1lID0gcGF0aG5hbWUuc3Vic3RyKDAsIHNlYXJjaEluZGV4KTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgcGF0aG5hbWU6IHBhdGhuYW1lLFxuICAgIHNlYXJjaDogc2VhcmNoID09PSAnPycgPyAnJyA6IHNlYXJjaCxcbiAgICBoYXNoOiBoYXNoID09PSAnIycgPyAnJyA6IGhhc2hcbiAgfTtcbn07XG5cbnZhciBjcmVhdGVQYXRoID0gZXhwb3J0cy5jcmVhdGVQYXRoID0gZnVuY3Rpb24gY3JlYXRlUGF0aChsb2NhdGlvbikge1xuICB2YXIgcGF0aG5hbWUgPSBsb2NhdGlvbi5wYXRobmFtZSxcbiAgICAgIHNlYXJjaCA9IGxvY2F0aW9uLnNlYXJjaCxcbiAgICAgIGhhc2ggPSBsb2NhdGlvbi5oYXNoO1xuXG5cbiAgdmFyIHBhdGggPSBwYXRobmFtZSB8fCAnLyc7XG5cbiAgaWYgKHNlYXJjaCAmJiBzZWFyY2ggIT09ICc/JykgcGF0aCArPSBzZWFyY2guY2hhckF0KDApID09PSAnPycgPyBzZWFyY2ggOiAnPycgKyBzZWFyY2g7XG5cbiAgaWYgKGhhc2ggJiYgaGFzaCAhPT0gJyMnKSBwYXRoICs9IGhhc2guY2hhckF0KDApID09PSAnIycgPyBoYXNoIDogJyMnICsgaGFzaDtcblxuICByZXR1cm4gcGF0aDtcbn07IiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuXG52YXIgX3R5cGVvZiA9IHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiB0eXBlb2YgU3ltYm9sLml0ZXJhdG9yID09PSBcInN5bWJvbFwiID8gZnVuY3Rpb24gKG9iaikgeyByZXR1cm4gdHlwZW9mIG9iajsgfSA6IGZ1bmN0aW9uIChvYmopIHsgcmV0dXJuIG9iaiAmJiB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgb2JqLmNvbnN0cnVjdG9yID09PSBTeW1ib2wgJiYgb2JqICE9PSBTeW1ib2wucHJvdG90eXBlID8gXCJzeW1ib2xcIiA6IHR5cGVvZiBvYmo7IH07XG5cbnZhciBfZXh0ZW5kcyA9IE9iamVjdC5hc3NpZ24gfHwgZnVuY3Rpb24gKHRhcmdldCkgeyBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykgeyB2YXIgc291cmNlID0gYXJndW1lbnRzW2ldOyBmb3IgKHZhciBrZXkgaW4gc291cmNlKSB7IGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoc291cmNlLCBrZXkpKSB7IHRhcmdldFtrZXldID0gc291cmNlW2tleV07IH0gfSB9IHJldHVybiB0YXJnZXQ7IH07XG5cbnZhciBfd2FybmluZyA9IHJlcXVpcmUoJ3dhcm5pbmcnKTtcblxudmFyIF93YXJuaW5nMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3dhcm5pbmcpO1xuXG52YXIgX2ludmFyaWFudCA9IHJlcXVpcmUoJ2ludmFyaWFudCcpO1xuXG52YXIgX2ludmFyaWFudDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9pbnZhcmlhbnQpO1xuXG52YXIgX0xvY2F0aW9uVXRpbHMgPSByZXF1aXJlKCcuL0xvY2F0aW9uVXRpbHMnKTtcblxudmFyIF9QYXRoVXRpbHMgPSByZXF1aXJlKCcuL1BhdGhVdGlscycpO1xuXG52YXIgX2NyZWF0ZVRyYW5zaXRpb25NYW5hZ2VyID0gcmVxdWlyZSgnLi9jcmVhdGVUcmFuc2l0aW9uTWFuYWdlcicpO1xuXG52YXIgX2NyZWF0ZVRyYW5zaXRpb25NYW5hZ2VyMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX2NyZWF0ZVRyYW5zaXRpb25NYW5hZ2VyKTtcblxudmFyIF9ET01VdGlscyA9IHJlcXVpcmUoJy4vRE9NVXRpbHMnKTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgZGVmYXVsdDogb2JqIH07IH1cblxudmFyIFBvcFN0YXRlRXZlbnQgPSAncG9wc3RhdGUnO1xudmFyIEhhc2hDaGFuZ2VFdmVudCA9ICdoYXNoY2hhbmdlJztcblxudmFyIGdldEhpc3RvcnlTdGF0ZSA9IGZ1bmN0aW9uIGdldEhpc3RvcnlTdGF0ZSgpIHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gd2luZG93Lmhpc3Rvcnkuc3RhdGUgfHwge307XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICAvLyBJRSAxMSBzb21ldGltZXMgdGhyb3dzIHdoZW4gYWNjZXNzaW5nIHdpbmRvdy5oaXN0b3J5LnN0YXRlXG4gICAgLy8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9SZWFjdFRyYWluaW5nL2hpc3RvcnkvcHVsbC8yODlcbiAgICByZXR1cm4ge307XG4gIH1cbn07XG5cbi8qKlxuICogQ3JlYXRlcyBhIGhpc3Rvcnkgb2JqZWN0IHRoYXQgdXNlcyB0aGUgSFRNTDUgaGlzdG9yeSBBUEkgaW5jbHVkaW5nXG4gKiBwdXNoU3RhdGUsIHJlcGxhY2VTdGF0ZSwgYW5kIHRoZSBwb3BzdGF0ZSBldmVudC5cbiAqL1xudmFyIGNyZWF0ZUJyb3dzZXJIaXN0b3J5ID0gZnVuY3Rpb24gY3JlYXRlQnJvd3Nlckhpc3RvcnkoKSB7XG4gIHZhciBwcm9wcyA9IGFyZ3VtZW50cy5sZW5ndGggPiAwICYmIGFyZ3VtZW50c1swXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzBdIDoge307XG5cbiAgKDAsIF9pbnZhcmlhbnQyLmRlZmF1bHQpKF9ET01VdGlscy5jYW5Vc2VET00sICdCcm93c2VyIGhpc3RvcnkgbmVlZHMgYSBET00nKTtcblxuICB2YXIgZ2xvYmFsSGlzdG9yeSA9IHdpbmRvdy5oaXN0b3J5O1xuICB2YXIgY2FuVXNlSGlzdG9yeSA9ICgwLCBfRE9NVXRpbHMuc3VwcG9ydHNIaXN0b3J5KSgpO1xuICB2YXIgbmVlZHNIYXNoQ2hhbmdlTGlzdGVuZXIgPSAhKDAsIF9ET01VdGlscy5zdXBwb3J0c1BvcFN0YXRlT25IYXNoQ2hhbmdlKSgpO1xuXG4gIHZhciBfcHJvcHMkZm9yY2VSZWZyZXNoID0gcHJvcHMuZm9yY2VSZWZyZXNoLFxuICAgICAgZm9yY2VSZWZyZXNoID0gX3Byb3BzJGZvcmNlUmVmcmVzaCA9PT0gdW5kZWZpbmVkID8gZmFsc2UgOiBfcHJvcHMkZm9yY2VSZWZyZXNoLFxuICAgICAgX3Byb3BzJGdldFVzZXJDb25maXJtID0gcHJvcHMuZ2V0VXNlckNvbmZpcm1hdGlvbixcbiAgICAgIGdldFVzZXJDb25maXJtYXRpb24gPSBfcHJvcHMkZ2V0VXNlckNvbmZpcm0gPT09IHVuZGVmaW5lZCA/IF9ET01VdGlscy5nZXRDb25maXJtYXRpb24gOiBfcHJvcHMkZ2V0VXNlckNvbmZpcm0sXG4gICAgICBfcHJvcHMka2V5TGVuZ3RoID0gcHJvcHMua2V5TGVuZ3RoLFxuICAgICAga2V5TGVuZ3RoID0gX3Byb3BzJGtleUxlbmd0aCA9PT0gdW5kZWZpbmVkID8gNiA6IF9wcm9wcyRrZXlMZW5ndGg7XG5cbiAgdmFyIGJhc2VuYW1lID0gcHJvcHMuYmFzZW5hbWUgPyAoMCwgX1BhdGhVdGlscy5zdHJpcFRyYWlsaW5nU2xhc2gpKCgwLCBfUGF0aFV0aWxzLmFkZExlYWRpbmdTbGFzaCkocHJvcHMuYmFzZW5hbWUpKSA6ICcnO1xuXG4gIHZhciBnZXRET01Mb2NhdGlvbiA9IGZ1bmN0aW9uIGdldERPTUxvY2F0aW9uKGhpc3RvcnlTdGF0ZSkge1xuICAgIHZhciBfcmVmID0gaGlzdG9yeVN0YXRlIHx8IHt9LFxuICAgICAgICBrZXkgPSBfcmVmLmtleSxcbiAgICAgICAgc3RhdGUgPSBfcmVmLnN0YXRlO1xuXG4gICAgdmFyIF93aW5kb3ckbG9jYXRpb24gPSB3aW5kb3cubG9jYXRpb24sXG4gICAgICAgIHBhdGhuYW1lID0gX3dpbmRvdyRsb2NhdGlvbi5wYXRobmFtZSxcbiAgICAgICAgc2VhcmNoID0gX3dpbmRvdyRsb2NhdGlvbi5zZWFyY2gsXG4gICAgICAgIGhhc2ggPSBfd2luZG93JGxvY2F0aW9uLmhhc2g7XG5cblxuICAgIHZhciBwYXRoID0gcGF0aG5hbWUgKyBzZWFyY2ggKyBoYXNoO1xuXG4gICAgKDAsIF93YXJuaW5nMi5kZWZhdWx0KSghYmFzZW5hbWUgfHwgKDAsIF9QYXRoVXRpbHMuaGFzQmFzZW5hbWUpKHBhdGgsIGJhc2VuYW1lKSwgJ1lvdSBhcmUgYXR0ZW1wdGluZyB0byB1c2UgYSBiYXNlbmFtZSBvbiBhIHBhZ2Ugd2hvc2UgVVJMIHBhdGggZG9lcyBub3QgYmVnaW4gJyArICd3aXRoIHRoZSBiYXNlbmFtZS4gRXhwZWN0ZWQgcGF0aCBcIicgKyBwYXRoICsgJ1wiIHRvIGJlZ2luIHdpdGggXCInICsgYmFzZW5hbWUgKyAnXCIuJyk7XG5cbiAgICBpZiAoYmFzZW5hbWUpIHBhdGggPSAoMCwgX1BhdGhVdGlscy5zdHJpcEJhc2VuYW1lKShwYXRoLCBiYXNlbmFtZSk7XG5cbiAgICByZXR1cm4gKDAsIF9Mb2NhdGlvblV0aWxzLmNyZWF0ZUxvY2F0aW9uKShwYXRoLCBzdGF0ZSwga2V5KTtcbiAgfTtcblxuICB2YXIgY3JlYXRlS2V5ID0gZnVuY3Rpb24gY3JlYXRlS2V5KCkge1xuICAgIHJldHVybiBNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zdWJzdHIoMiwga2V5TGVuZ3RoKTtcbiAgfTtcblxuICB2YXIgdHJhbnNpdGlvbk1hbmFnZXIgPSAoMCwgX2NyZWF0ZVRyYW5zaXRpb25NYW5hZ2VyMi5kZWZhdWx0KSgpO1xuXG4gIHZhciBzZXRTdGF0ZSA9IGZ1bmN0aW9uIHNldFN0YXRlKG5leHRTdGF0ZSkge1xuICAgIF9leHRlbmRzKGhpc3RvcnksIG5leHRTdGF0ZSk7XG5cbiAgICBoaXN0b3J5Lmxlbmd0aCA9IGdsb2JhbEhpc3RvcnkubGVuZ3RoO1xuXG4gICAgdHJhbnNpdGlvbk1hbmFnZXIubm90aWZ5TGlzdGVuZXJzKGhpc3RvcnkubG9jYXRpb24sIGhpc3RvcnkuYWN0aW9uKTtcbiAgfTtcblxuICB2YXIgaGFuZGxlUG9wU3RhdGUgPSBmdW5jdGlvbiBoYW5kbGVQb3BTdGF0ZShldmVudCkge1xuICAgIC8vIElnbm9yZSBleHRyYW5lb3VzIHBvcHN0YXRlIGV2ZW50cyBpbiBXZWJLaXQuXG4gICAgaWYgKCgwLCBfRE9NVXRpbHMuaXNFeHRyYW5lb3VzUG9wc3RhdGVFdmVudCkoZXZlbnQpKSByZXR1cm47XG5cbiAgICBoYW5kbGVQb3AoZ2V0RE9NTG9jYXRpb24oZXZlbnQuc3RhdGUpKTtcbiAgfTtcblxuICB2YXIgaGFuZGxlSGFzaENoYW5nZSA9IGZ1bmN0aW9uIGhhbmRsZUhhc2hDaGFuZ2UoKSB7XG4gICAgaGFuZGxlUG9wKGdldERPTUxvY2F0aW9uKGdldEhpc3RvcnlTdGF0ZSgpKSk7XG4gIH07XG5cbiAgdmFyIGZvcmNlTmV4dFBvcCA9IGZhbHNlO1xuXG4gIHZhciBoYW5kbGVQb3AgPSBmdW5jdGlvbiBoYW5kbGVQb3AobG9jYXRpb24pIHtcbiAgICBpZiAoZm9yY2VOZXh0UG9wKSB7XG4gICAgICBmb3JjZU5leHRQb3AgPSBmYWxzZTtcbiAgICAgIHNldFN0YXRlKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBhY3Rpb24gPSAnUE9QJztcblxuICAgICAgdHJhbnNpdGlvbk1hbmFnZXIuY29uZmlybVRyYW5zaXRpb25Ubyhsb2NhdGlvbiwgYWN0aW9uLCBnZXRVc2VyQ29uZmlybWF0aW9uLCBmdW5jdGlvbiAob2spIHtcbiAgICAgICAgaWYgKG9rKSB7XG4gICAgICAgICAgc2V0U3RhdGUoeyBhY3Rpb246IGFjdGlvbiwgbG9jYXRpb246IGxvY2F0aW9uIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldmVydFBvcChsb2NhdGlvbik7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfTtcblxuICB2YXIgcmV2ZXJ0UG9wID0gZnVuY3Rpb24gcmV2ZXJ0UG9wKGZyb21Mb2NhdGlvbikge1xuICAgIHZhciB0b0xvY2F0aW9uID0gaGlzdG9yeS5sb2NhdGlvbjtcblxuICAgIC8vIFRPRE86IFdlIGNvdWxkIHByb2JhYmx5IG1ha2UgdGhpcyBtb3JlIHJlbGlhYmxlIGJ5XG4gICAgLy8ga2VlcGluZyBhIGxpc3Qgb2Yga2V5cyB3ZSd2ZSBzZWVuIGluIHNlc3Npb25TdG9yYWdlLlxuICAgIC8vIEluc3RlYWQsIHdlIGp1c3QgZGVmYXVsdCB0byAwIGZvciBrZXlzIHdlIGRvbid0IGtub3cuXG5cbiAgICB2YXIgdG9JbmRleCA9IGFsbEtleXMuaW5kZXhPZih0b0xvY2F0aW9uLmtleSk7XG5cbiAgICBpZiAodG9JbmRleCA9PT0gLTEpIHRvSW5kZXggPSAwO1xuXG4gICAgdmFyIGZyb21JbmRleCA9IGFsbEtleXMuaW5kZXhPZihmcm9tTG9jYXRpb24ua2V5KTtcblxuICAgIGlmIChmcm9tSW5kZXggPT09IC0xKSBmcm9tSW5kZXggPSAwO1xuXG4gICAgdmFyIGRlbHRhID0gdG9JbmRleCAtIGZyb21JbmRleDtcblxuICAgIGlmIChkZWx0YSkge1xuICAgICAgZm9yY2VOZXh0UG9wID0gdHJ1ZTtcbiAgICAgIGdvKGRlbHRhKTtcbiAgICB9XG4gIH07XG5cbiAgdmFyIGluaXRpYWxMb2NhdGlvbiA9IGdldERPTUxvY2F0aW9uKGdldEhpc3RvcnlTdGF0ZSgpKTtcbiAgdmFyIGFsbEtleXMgPSBbaW5pdGlhbExvY2F0aW9uLmtleV07XG5cbiAgLy8gUHVibGljIGludGVyZmFjZVxuXG4gIHZhciBjcmVhdGVIcmVmID0gZnVuY3Rpb24gY3JlYXRlSHJlZihsb2NhdGlvbikge1xuICAgIHJldHVybiBiYXNlbmFtZSArICgwLCBfUGF0aFV0aWxzLmNyZWF0ZVBhdGgpKGxvY2F0aW9uKTtcbiAgfTtcblxuICB2YXIgcHVzaCA9IGZ1bmN0aW9uIHB1c2gocGF0aCwgc3RhdGUpIHtcbiAgICAoMCwgX3dhcm5pbmcyLmRlZmF1bHQpKCEoKHR5cGVvZiBwYXRoID09PSAndW5kZWZpbmVkJyA/ICd1bmRlZmluZWQnIDogX3R5cGVvZihwYXRoKSkgPT09ICdvYmplY3QnICYmIHBhdGguc3RhdGUgIT09IHVuZGVmaW5lZCAmJiBzdGF0ZSAhPT0gdW5kZWZpbmVkKSwgJ1lvdSBzaG91bGQgYXZvaWQgcHJvdmlkaW5nIGEgMm5kIHN0YXRlIGFyZ3VtZW50IHRvIHB1c2ggd2hlbiB0aGUgMXN0ICcgKyAnYXJndW1lbnQgaXMgYSBsb2NhdGlvbi1saWtlIG9iamVjdCB0aGF0IGFscmVhZHkgaGFzIHN0YXRlOyBpdCBpcyBpZ25vcmVkJyk7XG5cbiAgICB2YXIgYWN0aW9uID0gJ1BVU0gnO1xuICAgIHZhciBsb2NhdGlvbiA9ICgwLCBfTG9jYXRpb25VdGlscy5jcmVhdGVMb2NhdGlvbikocGF0aCwgc3RhdGUsIGNyZWF0ZUtleSgpLCBoaXN0b3J5LmxvY2F0aW9uKTtcblxuICAgIHRyYW5zaXRpb25NYW5hZ2VyLmNvbmZpcm1UcmFuc2l0aW9uVG8obG9jYXRpb24sIGFjdGlvbiwgZ2V0VXNlckNvbmZpcm1hdGlvbiwgZnVuY3Rpb24gKG9rKSB7XG4gICAgICBpZiAoIW9rKSByZXR1cm47XG5cbiAgICAgIHZhciBocmVmID0gY3JlYXRlSHJlZihsb2NhdGlvbik7XG4gICAgICB2YXIga2V5ID0gbG9jYXRpb24ua2V5LFxuICAgICAgICAgIHN0YXRlID0gbG9jYXRpb24uc3RhdGU7XG5cblxuICAgICAgaWYgKGNhblVzZUhpc3RvcnkpIHtcbiAgICAgICAgZ2xvYmFsSGlzdG9yeS5wdXNoU3RhdGUoeyBrZXk6IGtleSwgc3RhdGU6IHN0YXRlIH0sIG51bGwsIGhyZWYpO1xuXG4gICAgICAgIGlmIChmb3JjZVJlZnJlc2gpIHtcbiAgICAgICAgICB3aW5kb3cubG9jYXRpb24uaHJlZiA9IGhyZWY7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFyIHByZXZJbmRleCA9IGFsbEtleXMuaW5kZXhPZihoaXN0b3J5LmxvY2F0aW9uLmtleSk7XG4gICAgICAgICAgdmFyIG5leHRLZXlzID0gYWxsS2V5cy5zbGljZSgwLCBwcmV2SW5kZXggPT09IC0xID8gMCA6IHByZXZJbmRleCArIDEpO1xuXG4gICAgICAgICAgbmV4dEtleXMucHVzaChsb2NhdGlvbi5rZXkpO1xuICAgICAgICAgIGFsbEtleXMgPSBuZXh0S2V5cztcblxuICAgICAgICAgIHNldFN0YXRlKHsgYWN0aW9uOiBhY3Rpb24sIGxvY2F0aW9uOiBsb2NhdGlvbiB9KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgKDAsIF93YXJuaW5nMi5kZWZhdWx0KShzdGF0ZSA9PT0gdW5kZWZpbmVkLCAnQnJvd3NlciBoaXN0b3J5IGNhbm5vdCBwdXNoIHN0YXRlIGluIGJyb3dzZXJzIHRoYXQgZG8gbm90IHN1cHBvcnQgSFRNTDUgaGlzdG9yeScpO1xuXG4gICAgICAgIHdpbmRvdy5sb2NhdGlvbi5ocmVmID0gaHJlZjtcbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcblxuICB2YXIgcmVwbGFjZSA9IGZ1bmN0aW9uIHJlcGxhY2UocGF0aCwgc3RhdGUpIHtcbiAgICAoMCwgX3dhcm5pbmcyLmRlZmF1bHQpKCEoKHR5cGVvZiBwYXRoID09PSAndW5kZWZpbmVkJyA/ICd1bmRlZmluZWQnIDogX3R5cGVvZihwYXRoKSkgPT09ICdvYmplY3QnICYmIHBhdGguc3RhdGUgIT09IHVuZGVmaW5lZCAmJiBzdGF0ZSAhPT0gdW5kZWZpbmVkKSwgJ1lvdSBzaG91bGQgYXZvaWQgcHJvdmlkaW5nIGEgMm5kIHN0YXRlIGFyZ3VtZW50IHRvIHJlcGxhY2Ugd2hlbiB0aGUgMXN0ICcgKyAnYXJndW1lbnQgaXMgYSBsb2NhdGlvbi1saWtlIG9iamVjdCB0aGF0IGFscmVhZHkgaGFzIHN0YXRlOyBpdCBpcyBpZ25vcmVkJyk7XG5cbiAgICB2YXIgYWN0aW9uID0gJ1JFUExBQ0UnO1xuICAgIHZhciBsb2NhdGlvbiA9ICgwLCBfTG9jYXRpb25VdGlscy5jcmVhdGVMb2NhdGlvbikocGF0aCwgc3RhdGUsIGNyZWF0ZUtleSgpLCBoaXN0b3J5LmxvY2F0aW9uKTtcblxuICAgIHRyYW5zaXRpb25NYW5hZ2VyLmNvbmZpcm1UcmFuc2l0aW9uVG8obG9jYXRpb24sIGFjdGlvbiwgZ2V0VXNlckNvbmZpcm1hdGlvbiwgZnVuY3Rpb24gKG9rKSB7XG4gICAgICBpZiAoIW9rKSByZXR1cm47XG5cbiAgICAgIHZhciBocmVmID0gY3JlYXRlSHJlZihsb2NhdGlvbik7XG4gICAgICB2YXIga2V5ID0gbG9jYXRpb24ua2V5LFxuICAgICAgICAgIHN0YXRlID0gbG9jYXRpb24uc3RhdGU7XG5cblxuICAgICAgaWYgKGNhblVzZUhpc3RvcnkpIHtcbiAgICAgICAgZ2xvYmFsSGlzdG9yeS5yZXBsYWNlU3RhdGUoeyBrZXk6IGtleSwgc3RhdGU6IHN0YXRlIH0sIG51bGwsIGhyZWYpO1xuXG4gICAgICAgIGlmIChmb3JjZVJlZnJlc2gpIHtcbiAgICAgICAgICB3aW5kb3cubG9jYXRpb24ucmVwbGFjZShocmVmKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2YXIgcHJldkluZGV4ID0gYWxsS2V5cy5pbmRleE9mKGhpc3RvcnkubG9jYXRpb24ua2V5KTtcblxuICAgICAgICAgIGlmIChwcmV2SW5kZXggIT09IC0xKSBhbGxLZXlzW3ByZXZJbmRleF0gPSBsb2NhdGlvbi5rZXk7XG5cbiAgICAgICAgICBzZXRTdGF0ZSh7IGFjdGlvbjogYWN0aW9uLCBsb2NhdGlvbjogbG9jYXRpb24gfSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgICgwLCBfd2FybmluZzIuZGVmYXVsdCkoc3RhdGUgPT09IHVuZGVmaW5lZCwgJ0Jyb3dzZXIgaGlzdG9yeSBjYW5ub3QgcmVwbGFjZSBzdGF0ZSBpbiBicm93c2VycyB0aGF0IGRvIG5vdCBzdXBwb3J0IEhUTUw1IGhpc3RvcnknKTtcblxuICAgICAgICB3aW5kb3cubG9jYXRpb24ucmVwbGFjZShocmVmKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcblxuICB2YXIgZ28gPSBmdW5jdGlvbiBnbyhuKSB7XG4gICAgZ2xvYmFsSGlzdG9yeS5nbyhuKTtcbiAgfTtcblxuICB2YXIgZ29CYWNrID0gZnVuY3Rpb24gZ29CYWNrKCkge1xuICAgIHJldHVybiBnbygtMSk7XG4gIH07XG5cbiAgdmFyIGdvRm9yd2FyZCA9IGZ1bmN0aW9uIGdvRm9yd2FyZCgpIHtcbiAgICByZXR1cm4gZ28oMSk7XG4gIH07XG5cbiAgdmFyIGxpc3RlbmVyQ291bnQgPSAwO1xuXG4gIHZhciBjaGVja0RPTUxpc3RlbmVycyA9IGZ1bmN0aW9uIGNoZWNrRE9NTGlzdGVuZXJzKGRlbHRhKSB7XG4gICAgbGlzdGVuZXJDb3VudCArPSBkZWx0YTtcblxuICAgIGlmIChsaXN0ZW5lckNvdW50ID09PSAxKSB7XG4gICAgICAoMCwgX0RPTVV0aWxzLmFkZEV2ZW50TGlzdGVuZXIpKHdpbmRvdywgUG9wU3RhdGVFdmVudCwgaGFuZGxlUG9wU3RhdGUpO1xuXG4gICAgICBpZiAobmVlZHNIYXNoQ2hhbmdlTGlzdGVuZXIpICgwLCBfRE9NVXRpbHMuYWRkRXZlbnRMaXN0ZW5lcikod2luZG93LCBIYXNoQ2hhbmdlRXZlbnQsIGhhbmRsZUhhc2hDaGFuZ2UpO1xuICAgIH0gZWxzZSBpZiAobGlzdGVuZXJDb3VudCA9PT0gMCkge1xuICAgICAgKDAsIF9ET01VdGlscy5yZW1vdmVFdmVudExpc3RlbmVyKSh3aW5kb3csIFBvcFN0YXRlRXZlbnQsIGhhbmRsZVBvcFN0YXRlKTtcblxuICAgICAgaWYgKG5lZWRzSGFzaENoYW5nZUxpc3RlbmVyKSAoMCwgX0RPTVV0aWxzLnJlbW92ZUV2ZW50TGlzdGVuZXIpKHdpbmRvdywgSGFzaENoYW5nZUV2ZW50LCBoYW5kbGVIYXNoQ2hhbmdlKTtcbiAgICB9XG4gIH07XG5cbiAgdmFyIGlzQmxvY2tlZCA9IGZhbHNlO1xuXG4gIHZhciBibG9jayA9IGZ1bmN0aW9uIGJsb2NrKCkge1xuICAgIHZhciBwcm9tcHQgPSBhcmd1bWVudHMubGVuZ3RoID4gMCAmJiBhcmd1bWVudHNbMF0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1swXSA6IGZhbHNlO1xuXG4gICAgdmFyIHVuYmxvY2sgPSB0cmFuc2l0aW9uTWFuYWdlci5zZXRQcm9tcHQocHJvbXB0KTtcblxuICAgIGlmICghaXNCbG9ja2VkKSB7XG4gICAgICBjaGVja0RPTUxpc3RlbmVycygxKTtcbiAgICAgIGlzQmxvY2tlZCA9IHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmIChpc0Jsb2NrZWQpIHtcbiAgICAgICAgaXNCbG9ja2VkID0gZmFsc2U7XG4gICAgICAgIGNoZWNrRE9NTGlzdGVuZXJzKC0xKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHVuYmxvY2soKTtcbiAgICB9O1xuICB9O1xuXG4gIHZhciBsaXN0ZW4gPSBmdW5jdGlvbiBsaXN0ZW4obGlzdGVuZXIpIHtcbiAgICB2YXIgdW5saXN0ZW4gPSB0cmFuc2l0aW9uTWFuYWdlci5hcHBlbmRMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgY2hlY2tET01MaXN0ZW5lcnMoMSk7XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgY2hlY2tET01MaXN0ZW5lcnMoLTEpO1xuICAgICAgdW5saXN0ZW4oKTtcbiAgICB9O1xuICB9O1xuXG4gIHZhciBoaXN0b3J5ID0ge1xuICAgIGxlbmd0aDogZ2xvYmFsSGlzdG9yeS5sZW5ndGgsXG4gICAgYWN0aW9uOiAnUE9QJyxcbiAgICBsb2NhdGlvbjogaW5pdGlhbExvY2F0aW9uLFxuICAgIGNyZWF0ZUhyZWY6IGNyZWF0ZUhyZWYsXG4gICAgcHVzaDogcHVzaCxcbiAgICByZXBsYWNlOiByZXBsYWNlLFxuICAgIGdvOiBnbyxcbiAgICBnb0JhY2s6IGdvQmFjayxcbiAgICBnb0ZvcndhcmQ6IGdvRm9yd2FyZCxcbiAgICBibG9jazogYmxvY2ssXG4gICAgbGlzdGVuOiBsaXN0ZW5cbiAgfTtcblxuICByZXR1cm4gaGlzdG9yeTtcbn07XG5cbmV4cG9ydHMuZGVmYXVsdCA9IGNyZWF0ZUJyb3dzZXJIaXN0b3J5OyIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcblxudmFyIF9leHRlbmRzID0gT2JqZWN0LmFzc2lnbiB8fCBmdW5jdGlvbiAodGFyZ2V0KSB7IGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7IHZhciBzb3VyY2UgPSBhcmd1bWVudHNbaV07IGZvciAodmFyIGtleSBpbiBzb3VyY2UpIHsgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzb3VyY2UsIGtleSkpIHsgdGFyZ2V0W2tleV0gPSBzb3VyY2Vba2V5XTsgfSB9IH0gcmV0dXJuIHRhcmdldDsgfTtcblxudmFyIF93YXJuaW5nID0gcmVxdWlyZSgnd2FybmluZycpO1xuXG52YXIgX3dhcm5pbmcyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfd2FybmluZyk7XG5cbnZhciBfaW52YXJpYW50ID0gcmVxdWlyZSgnaW52YXJpYW50Jyk7XG5cbnZhciBfaW52YXJpYW50MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX2ludmFyaWFudCk7XG5cbnZhciBfTG9jYXRpb25VdGlscyA9IHJlcXVpcmUoJy4vTG9jYXRpb25VdGlscycpO1xuXG52YXIgX1BhdGhVdGlscyA9IHJlcXVpcmUoJy4vUGF0aFV0aWxzJyk7XG5cbnZhciBfY3JlYXRlVHJhbnNpdGlvbk1hbmFnZXIgPSByZXF1aXJlKCcuL2NyZWF0ZVRyYW5zaXRpb25NYW5hZ2VyJyk7XG5cbnZhciBfY3JlYXRlVHJhbnNpdGlvbk1hbmFnZXIyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfY3JlYXRlVHJhbnNpdGlvbk1hbmFnZXIpO1xuXG52YXIgX0RPTVV0aWxzID0gcmVxdWlyZSgnLi9ET01VdGlscycpO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyBkZWZhdWx0OiBvYmogfTsgfVxuXG52YXIgSGFzaENoYW5nZUV2ZW50ID0gJ2hhc2hjaGFuZ2UnO1xuXG52YXIgSGFzaFBhdGhDb2RlcnMgPSB7XG4gIGhhc2hiYW5nOiB7XG4gICAgZW5jb2RlUGF0aDogZnVuY3Rpb24gZW5jb2RlUGF0aChwYXRoKSB7XG4gICAgICByZXR1cm4gcGF0aC5jaGFyQXQoMCkgPT09ICchJyA/IHBhdGggOiAnIS8nICsgKDAsIF9QYXRoVXRpbHMuc3RyaXBMZWFkaW5nU2xhc2gpKHBhdGgpO1xuICAgIH0sXG4gICAgZGVjb2RlUGF0aDogZnVuY3Rpb24gZGVjb2RlUGF0aChwYXRoKSB7XG4gICAgICByZXR1cm4gcGF0aC5jaGFyQXQoMCkgPT09ICchJyA/IHBhdGguc3Vic3RyKDEpIDogcGF0aDtcbiAgICB9XG4gIH0sXG4gIG5vc2xhc2g6IHtcbiAgICBlbmNvZGVQYXRoOiBfUGF0aFV0aWxzLnN0cmlwTGVhZGluZ1NsYXNoLFxuICAgIGRlY29kZVBhdGg6IF9QYXRoVXRpbHMuYWRkTGVhZGluZ1NsYXNoXG4gIH0sXG4gIHNsYXNoOiB7XG4gICAgZW5jb2RlUGF0aDogX1BhdGhVdGlscy5hZGRMZWFkaW5nU2xhc2gsXG4gICAgZGVjb2RlUGF0aDogX1BhdGhVdGlscy5hZGRMZWFkaW5nU2xhc2hcbiAgfVxufTtcblxudmFyIGdldEhhc2hQYXRoID0gZnVuY3Rpb24gZ2V0SGFzaFBhdGgoKSB7XG4gIC8vIFdlIGNhbid0IHVzZSB3aW5kb3cubG9jYXRpb24uaGFzaCBoZXJlIGJlY2F1c2UgaXQncyBub3RcbiAgLy8gY29uc2lzdGVudCBhY3Jvc3MgYnJvd3NlcnMgLSBGaXJlZm94IHdpbGwgcHJlLWRlY29kZSBpdCFcbiAgdmFyIGhyZWYgPSB3aW5kb3cubG9jYXRpb24uaHJlZjtcbiAgdmFyIGhhc2hJbmRleCA9IGhyZWYuaW5kZXhPZignIycpO1xuICByZXR1cm4gaGFzaEluZGV4ID09PSAtMSA/ICcnIDogaHJlZi5zdWJzdHJpbmcoaGFzaEluZGV4ICsgMSk7XG59O1xuXG52YXIgcHVzaEhhc2hQYXRoID0gZnVuY3Rpb24gcHVzaEhhc2hQYXRoKHBhdGgpIHtcbiAgcmV0dXJuIHdpbmRvdy5sb2NhdGlvbi5oYXNoID0gcGF0aDtcbn07XG5cbnZhciByZXBsYWNlSGFzaFBhdGggPSBmdW5jdGlvbiByZXBsYWNlSGFzaFBhdGgocGF0aCkge1xuICB2YXIgaGFzaEluZGV4ID0gd2luZG93LmxvY2F0aW9uLmhyZWYuaW5kZXhPZignIycpO1xuXG4gIHdpbmRvdy5sb2NhdGlvbi5yZXBsYWNlKHdpbmRvdy5sb2NhdGlvbi5ocmVmLnNsaWNlKDAsIGhhc2hJbmRleCA+PSAwID8gaGFzaEluZGV4IDogMCkgKyAnIycgKyBwYXRoKTtcbn07XG5cbnZhciBjcmVhdGVIYXNoSGlzdG9yeSA9IGZ1bmN0aW9uIGNyZWF0ZUhhc2hIaXN0b3J5KCkge1xuICB2YXIgcHJvcHMgPSBhcmd1bWVudHMubGVuZ3RoID4gMCAmJiBhcmd1bWVudHNbMF0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1swXSA6IHt9O1xuXG4gICgwLCBfaW52YXJpYW50Mi5kZWZhdWx0KShfRE9NVXRpbHMuY2FuVXNlRE9NLCAnSGFzaCBoaXN0b3J5IG5lZWRzIGEgRE9NJyk7XG5cbiAgdmFyIGdsb2JhbEhpc3RvcnkgPSB3aW5kb3cuaGlzdG9yeTtcbiAgdmFyIGNhbkdvV2l0aG91dFJlbG9hZCA9ICgwLCBfRE9NVXRpbHMuc3VwcG9ydHNHb1dpdGhvdXRSZWxvYWRVc2luZ0hhc2gpKCk7XG5cbiAgdmFyIF9wcm9wcyRnZXRVc2VyQ29uZmlybSA9IHByb3BzLmdldFVzZXJDb25maXJtYXRpb24sXG4gICAgICBnZXRVc2VyQ29uZmlybWF0aW9uID0gX3Byb3BzJGdldFVzZXJDb25maXJtID09PSB1bmRlZmluZWQgPyBfRE9NVXRpbHMuZ2V0Q29uZmlybWF0aW9uIDogX3Byb3BzJGdldFVzZXJDb25maXJtLFxuICAgICAgX3Byb3BzJGhhc2hUeXBlID0gcHJvcHMuaGFzaFR5cGUsXG4gICAgICBoYXNoVHlwZSA9IF9wcm9wcyRoYXNoVHlwZSA9PT0gdW5kZWZpbmVkID8gJ3NsYXNoJyA6IF9wcm9wcyRoYXNoVHlwZTtcblxuICB2YXIgYmFzZW5hbWUgPSBwcm9wcy5iYXNlbmFtZSA/ICgwLCBfUGF0aFV0aWxzLnN0cmlwVHJhaWxpbmdTbGFzaCkoKDAsIF9QYXRoVXRpbHMuYWRkTGVhZGluZ1NsYXNoKShwcm9wcy5iYXNlbmFtZSkpIDogJyc7XG5cbiAgdmFyIF9IYXNoUGF0aENvZGVycyRoYXNoVCA9IEhhc2hQYXRoQ29kZXJzW2hhc2hUeXBlXSxcbiAgICAgIGVuY29kZVBhdGggPSBfSGFzaFBhdGhDb2RlcnMkaGFzaFQuZW5jb2RlUGF0aCxcbiAgICAgIGRlY29kZVBhdGggPSBfSGFzaFBhdGhDb2RlcnMkaGFzaFQuZGVjb2RlUGF0aDtcblxuXG4gIHZhciBnZXRET01Mb2NhdGlvbiA9IGZ1bmN0aW9uIGdldERPTUxvY2F0aW9uKCkge1xuICAgIHZhciBwYXRoID0gZGVjb2RlUGF0aChnZXRIYXNoUGF0aCgpKTtcblxuICAgICgwLCBfd2FybmluZzIuZGVmYXVsdCkoIWJhc2VuYW1lIHx8ICgwLCBfUGF0aFV0aWxzLmhhc0Jhc2VuYW1lKShwYXRoLCBiYXNlbmFtZSksICdZb3UgYXJlIGF0dGVtcHRpbmcgdG8gdXNlIGEgYmFzZW5hbWUgb24gYSBwYWdlIHdob3NlIFVSTCBwYXRoIGRvZXMgbm90IGJlZ2luICcgKyAnd2l0aCB0aGUgYmFzZW5hbWUuIEV4cGVjdGVkIHBhdGggXCInICsgcGF0aCArICdcIiB0byBiZWdpbiB3aXRoIFwiJyArIGJhc2VuYW1lICsgJ1wiLicpO1xuXG4gICAgaWYgKGJhc2VuYW1lKSBwYXRoID0gKDAsIF9QYXRoVXRpbHMuc3RyaXBCYXNlbmFtZSkocGF0aCwgYmFzZW5hbWUpO1xuXG4gICAgcmV0dXJuICgwLCBfTG9jYXRpb25VdGlscy5jcmVhdGVMb2NhdGlvbikocGF0aCk7XG4gIH07XG5cbiAgdmFyIHRyYW5zaXRpb25NYW5hZ2VyID0gKDAsIF9jcmVhdGVUcmFuc2l0aW9uTWFuYWdlcjIuZGVmYXVsdCkoKTtcblxuICB2YXIgc2V0U3RhdGUgPSBmdW5jdGlvbiBzZXRTdGF0ZShuZXh0U3RhdGUpIHtcbiAgICBfZXh0ZW5kcyhoaXN0b3J5LCBuZXh0U3RhdGUpO1xuXG4gICAgaGlzdG9yeS5sZW5ndGggPSBnbG9iYWxIaXN0b3J5Lmxlbmd0aDtcblxuICAgIHRyYW5zaXRpb25NYW5hZ2VyLm5vdGlmeUxpc3RlbmVycyhoaXN0b3J5LmxvY2F0aW9uLCBoaXN0b3J5LmFjdGlvbik7XG4gIH07XG5cbiAgdmFyIGZvcmNlTmV4dFBvcCA9IGZhbHNlO1xuICB2YXIgaWdub3JlUGF0aCA9IG51bGw7XG5cbiAgdmFyIGhhbmRsZUhhc2hDaGFuZ2UgPSBmdW5jdGlvbiBoYW5kbGVIYXNoQ2hhbmdlKCkge1xuICAgIHZhciBwYXRoID0gZ2V0SGFzaFBhdGgoKTtcbiAgICB2YXIgZW5jb2RlZFBhdGggPSBlbmNvZGVQYXRoKHBhdGgpO1xuXG4gICAgaWYgKHBhdGggIT09IGVuY29kZWRQYXRoKSB7XG4gICAgICAvLyBFbnN1cmUgd2UgYWx3YXlzIGhhdmUgYSBwcm9wZXJseS1lbmNvZGVkIGhhc2guXG4gICAgICByZXBsYWNlSGFzaFBhdGgoZW5jb2RlZFBhdGgpO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgbG9jYXRpb24gPSBnZXRET01Mb2NhdGlvbigpO1xuICAgICAgdmFyIHByZXZMb2NhdGlvbiA9IGhpc3RvcnkubG9jYXRpb247XG5cbiAgICAgIGlmICghZm9yY2VOZXh0UG9wICYmICgwLCBfTG9jYXRpb25VdGlscy5sb2NhdGlvbnNBcmVFcXVhbCkocHJldkxvY2F0aW9uLCBsb2NhdGlvbikpIHJldHVybjsgLy8gQSBoYXNoY2hhbmdlIGRvZXNuJ3QgYWx3YXlzID09IGxvY2F0aW9uIGNoYW5nZS5cblxuICAgICAgaWYgKGlnbm9yZVBhdGggPT09ICgwLCBfUGF0aFV0aWxzLmNyZWF0ZVBhdGgpKGxvY2F0aW9uKSkgcmV0dXJuOyAvLyBJZ25vcmUgdGhpcyBjaGFuZ2U7IHdlIGFscmVhZHkgc2V0U3RhdGUgaW4gcHVzaC9yZXBsYWNlLlxuXG4gICAgICBpZ25vcmVQYXRoID0gbnVsbDtcblxuICAgICAgaGFuZGxlUG9wKGxvY2F0aW9uKTtcbiAgICB9XG4gIH07XG5cbiAgdmFyIGhhbmRsZVBvcCA9IGZ1bmN0aW9uIGhhbmRsZVBvcChsb2NhdGlvbikge1xuICAgIGlmIChmb3JjZU5leHRQb3ApIHtcbiAgICAgIGZvcmNlTmV4dFBvcCA9IGZhbHNlO1xuICAgICAgc2V0U3RhdGUoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGFjdGlvbiA9ICdQT1AnO1xuXG4gICAgICB0cmFuc2l0aW9uTWFuYWdlci5jb25maXJtVHJhbnNpdGlvblRvKGxvY2F0aW9uLCBhY3Rpb24sIGdldFVzZXJDb25maXJtYXRpb24sIGZ1bmN0aW9uIChvaykge1xuICAgICAgICBpZiAob2spIHtcbiAgICAgICAgICBzZXRTdGF0ZSh7IGFjdGlvbjogYWN0aW9uLCBsb2NhdGlvbjogbG9jYXRpb24gfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV2ZXJ0UG9wKGxvY2F0aW9uKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICB9O1xuXG4gIHZhciByZXZlcnRQb3AgPSBmdW5jdGlvbiByZXZlcnRQb3AoZnJvbUxvY2F0aW9uKSB7XG4gICAgdmFyIHRvTG9jYXRpb24gPSBoaXN0b3J5LmxvY2F0aW9uO1xuXG4gICAgLy8gVE9ETzogV2UgY291bGQgcHJvYmFibHkgbWFrZSB0aGlzIG1vcmUgcmVsaWFibGUgYnlcbiAgICAvLyBrZWVwaW5nIGEgbGlzdCBvZiBwYXRocyB3ZSd2ZSBzZWVuIGluIHNlc3Npb25TdG9yYWdlLlxuICAgIC8vIEluc3RlYWQsIHdlIGp1c3QgZGVmYXVsdCB0byAwIGZvciBwYXRocyB3ZSBkb24ndCBrbm93LlxuXG4gICAgdmFyIHRvSW5kZXggPSBhbGxQYXRocy5sYXN0SW5kZXhPZigoMCwgX1BhdGhVdGlscy5jcmVhdGVQYXRoKSh0b0xvY2F0aW9uKSk7XG5cbiAgICBpZiAodG9JbmRleCA9PT0gLTEpIHRvSW5kZXggPSAwO1xuXG4gICAgdmFyIGZyb21JbmRleCA9IGFsbFBhdGhzLmxhc3RJbmRleE9mKCgwLCBfUGF0aFV0aWxzLmNyZWF0ZVBhdGgpKGZyb21Mb2NhdGlvbikpO1xuXG4gICAgaWYgKGZyb21JbmRleCA9PT0gLTEpIGZyb21JbmRleCA9IDA7XG5cbiAgICB2YXIgZGVsdGEgPSB0b0luZGV4IC0gZnJvbUluZGV4O1xuXG4gICAgaWYgKGRlbHRhKSB7XG4gICAgICBmb3JjZU5leHRQb3AgPSB0cnVlO1xuICAgICAgZ28oZGVsdGEpO1xuICAgIH1cbiAgfTtcblxuICAvLyBFbnN1cmUgdGhlIGhhc2ggaXMgZW5jb2RlZCBwcm9wZXJseSBiZWZvcmUgZG9pbmcgYW55dGhpbmcgZWxzZS5cbiAgdmFyIHBhdGggPSBnZXRIYXNoUGF0aCgpO1xuICB2YXIgZW5jb2RlZFBhdGggPSBlbmNvZGVQYXRoKHBhdGgpO1xuXG4gIGlmIChwYXRoICE9PSBlbmNvZGVkUGF0aCkgcmVwbGFjZUhhc2hQYXRoKGVuY29kZWRQYXRoKTtcblxuICB2YXIgaW5pdGlhbExvY2F0aW9uID0gZ2V0RE9NTG9jYXRpb24oKTtcbiAgdmFyIGFsbFBhdGhzID0gWygwLCBfUGF0aFV0aWxzLmNyZWF0ZVBhdGgpKGluaXRpYWxMb2NhdGlvbildO1xuXG4gIC8vIFB1YmxpYyBpbnRlcmZhY2VcblxuICB2YXIgY3JlYXRlSHJlZiA9IGZ1bmN0aW9uIGNyZWF0ZUhyZWYobG9jYXRpb24pIHtcbiAgICByZXR1cm4gJyMnICsgZW5jb2RlUGF0aChiYXNlbmFtZSArICgwLCBfUGF0aFV0aWxzLmNyZWF0ZVBhdGgpKGxvY2F0aW9uKSk7XG4gIH07XG5cbiAgdmFyIHB1c2ggPSBmdW5jdGlvbiBwdXNoKHBhdGgsIHN0YXRlKSB7XG4gICAgKDAsIF93YXJuaW5nMi5kZWZhdWx0KShzdGF0ZSA9PT0gdW5kZWZpbmVkLCAnSGFzaCBoaXN0b3J5IGNhbm5vdCBwdXNoIHN0YXRlOyBpdCBpcyBpZ25vcmVkJyk7XG5cbiAgICB2YXIgYWN0aW9uID0gJ1BVU0gnO1xuICAgIHZhciBsb2NhdGlvbiA9ICgwLCBfTG9jYXRpb25VdGlscy5jcmVhdGVMb2NhdGlvbikocGF0aCwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIGhpc3RvcnkubG9jYXRpb24pO1xuXG4gICAgdHJhbnNpdGlvbk1hbmFnZXIuY29uZmlybVRyYW5zaXRpb25Ubyhsb2NhdGlvbiwgYWN0aW9uLCBnZXRVc2VyQ29uZmlybWF0aW9uLCBmdW5jdGlvbiAob2spIHtcbiAgICAgIGlmICghb2spIHJldHVybjtcblxuICAgICAgdmFyIHBhdGggPSAoMCwgX1BhdGhVdGlscy5jcmVhdGVQYXRoKShsb2NhdGlvbik7XG4gICAgICB2YXIgZW5jb2RlZFBhdGggPSBlbmNvZGVQYXRoKGJhc2VuYW1lICsgcGF0aCk7XG4gICAgICB2YXIgaGFzaENoYW5nZWQgPSBnZXRIYXNoUGF0aCgpICE9PSBlbmNvZGVkUGF0aDtcblxuICAgICAgaWYgKGhhc2hDaGFuZ2VkKSB7XG4gICAgICAgIC8vIFdlIGNhbm5vdCB0ZWxsIGlmIGEgaGFzaGNoYW5nZSB3YXMgY2F1c2VkIGJ5IGEgUFVTSCwgc28gd2UnZFxuICAgICAgICAvLyByYXRoZXIgc2V0U3RhdGUgaGVyZSBhbmQgaWdub3JlIHRoZSBoYXNoY2hhbmdlLiBUaGUgY2F2ZWF0IGhlcmVcbiAgICAgICAgLy8gaXMgdGhhdCBvdGhlciBoYXNoIGhpc3RvcmllcyBpbiB0aGUgcGFnZSB3aWxsIGNvbnNpZGVyIGl0IGEgUE9QLlxuICAgICAgICBpZ25vcmVQYXRoID0gcGF0aDtcbiAgICAgICAgcHVzaEhhc2hQYXRoKGVuY29kZWRQYXRoKTtcblxuICAgICAgICB2YXIgcHJldkluZGV4ID0gYWxsUGF0aHMubGFzdEluZGV4T2YoKDAsIF9QYXRoVXRpbHMuY3JlYXRlUGF0aCkoaGlzdG9yeS5sb2NhdGlvbikpO1xuICAgICAgICB2YXIgbmV4dFBhdGhzID0gYWxsUGF0aHMuc2xpY2UoMCwgcHJldkluZGV4ID09PSAtMSA/IDAgOiBwcmV2SW5kZXggKyAxKTtcblxuICAgICAgICBuZXh0UGF0aHMucHVzaChwYXRoKTtcbiAgICAgICAgYWxsUGF0aHMgPSBuZXh0UGF0aHM7XG5cbiAgICAgICAgc2V0U3RhdGUoeyBhY3Rpb246IGFjdGlvbiwgbG9jYXRpb246IGxvY2F0aW9uIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgKDAsIF93YXJuaW5nMi5kZWZhdWx0KShmYWxzZSwgJ0hhc2ggaGlzdG9yeSBjYW5ub3QgUFVTSCB0aGUgc2FtZSBwYXRoOyBhIG5ldyBlbnRyeSB3aWxsIG5vdCBiZSBhZGRlZCB0byB0aGUgaGlzdG9yeSBzdGFjaycpO1xuXG4gICAgICAgIHNldFN0YXRlKCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH07XG5cbiAgdmFyIHJlcGxhY2UgPSBmdW5jdGlvbiByZXBsYWNlKHBhdGgsIHN0YXRlKSB7XG4gICAgKDAsIF93YXJuaW5nMi5kZWZhdWx0KShzdGF0ZSA9PT0gdW5kZWZpbmVkLCAnSGFzaCBoaXN0b3J5IGNhbm5vdCByZXBsYWNlIHN0YXRlOyBpdCBpcyBpZ25vcmVkJyk7XG5cbiAgICB2YXIgYWN0aW9uID0gJ1JFUExBQ0UnO1xuICAgIHZhciBsb2NhdGlvbiA9ICgwLCBfTG9jYXRpb25VdGlscy5jcmVhdGVMb2NhdGlvbikocGF0aCwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIGhpc3RvcnkubG9jYXRpb24pO1xuXG4gICAgdHJhbnNpdGlvbk1hbmFnZXIuY29uZmlybVRyYW5zaXRpb25Ubyhsb2NhdGlvbiwgYWN0aW9uLCBnZXRVc2VyQ29uZmlybWF0aW9uLCBmdW5jdGlvbiAob2spIHtcbiAgICAgIGlmICghb2spIHJldHVybjtcblxuICAgICAgdmFyIHBhdGggPSAoMCwgX1BhdGhVdGlscy5jcmVhdGVQYXRoKShsb2NhdGlvbik7XG4gICAgICB2YXIgZW5jb2RlZFBhdGggPSBlbmNvZGVQYXRoKGJhc2VuYW1lICsgcGF0aCk7XG4gICAgICB2YXIgaGFzaENoYW5nZWQgPSBnZXRIYXNoUGF0aCgpICE9PSBlbmNvZGVkUGF0aDtcblxuICAgICAgaWYgKGhhc2hDaGFuZ2VkKSB7XG4gICAgICAgIC8vIFdlIGNhbm5vdCB0ZWxsIGlmIGEgaGFzaGNoYW5nZSB3YXMgY2F1c2VkIGJ5IGEgUkVQTEFDRSwgc28gd2UnZFxuICAgICAgICAvLyByYXRoZXIgc2V0U3RhdGUgaGVyZSBhbmQgaWdub3JlIHRoZSBoYXNoY2hhbmdlLiBUaGUgY2F2ZWF0IGhlcmVcbiAgICAgICAgLy8gaXMgdGhhdCBvdGhlciBoYXNoIGhpc3RvcmllcyBpbiB0aGUgcGFnZSB3aWxsIGNvbnNpZGVyIGl0IGEgUE9QLlxuICAgICAgICBpZ25vcmVQYXRoID0gcGF0aDtcbiAgICAgICAgcmVwbGFjZUhhc2hQYXRoKGVuY29kZWRQYXRoKTtcbiAgICAgIH1cblxuICAgICAgdmFyIHByZXZJbmRleCA9IGFsbFBhdGhzLmluZGV4T2YoKDAsIF9QYXRoVXRpbHMuY3JlYXRlUGF0aCkoaGlzdG9yeS5sb2NhdGlvbikpO1xuXG4gICAgICBpZiAocHJldkluZGV4ICE9PSAtMSkgYWxsUGF0aHNbcHJldkluZGV4XSA9IHBhdGg7XG5cbiAgICAgIHNldFN0YXRlKHsgYWN0aW9uOiBhY3Rpb24sIGxvY2F0aW9uOiBsb2NhdGlvbiB9KTtcbiAgICB9KTtcbiAgfTtcblxuICB2YXIgZ28gPSBmdW5jdGlvbiBnbyhuKSB7XG4gICAgKDAsIF93YXJuaW5nMi5kZWZhdWx0KShjYW5Hb1dpdGhvdXRSZWxvYWQsICdIYXNoIGhpc3RvcnkgZ28obikgY2F1c2VzIGEgZnVsbCBwYWdlIHJlbG9hZCBpbiB0aGlzIGJyb3dzZXInKTtcblxuICAgIGdsb2JhbEhpc3RvcnkuZ28obik7XG4gIH07XG5cbiAgdmFyIGdvQmFjayA9IGZ1bmN0aW9uIGdvQmFjaygpIHtcbiAgICByZXR1cm4gZ28oLTEpO1xuICB9O1xuXG4gIHZhciBnb0ZvcndhcmQgPSBmdW5jdGlvbiBnb0ZvcndhcmQoKSB7XG4gICAgcmV0dXJuIGdvKDEpO1xuICB9O1xuXG4gIHZhciBsaXN0ZW5lckNvdW50ID0gMDtcblxuICB2YXIgY2hlY2tET01MaXN0ZW5lcnMgPSBmdW5jdGlvbiBjaGVja0RPTUxpc3RlbmVycyhkZWx0YSkge1xuICAgIGxpc3RlbmVyQ291bnQgKz0gZGVsdGE7XG5cbiAgICBpZiAobGlzdGVuZXJDb3VudCA9PT0gMSkge1xuICAgICAgKDAsIF9ET01VdGlscy5hZGRFdmVudExpc3RlbmVyKSh3aW5kb3csIEhhc2hDaGFuZ2VFdmVudCwgaGFuZGxlSGFzaENoYW5nZSk7XG4gICAgfSBlbHNlIGlmIChsaXN0ZW5lckNvdW50ID09PSAwKSB7XG4gICAgICAoMCwgX0RPTVV0aWxzLnJlbW92ZUV2ZW50TGlzdGVuZXIpKHdpbmRvdywgSGFzaENoYW5nZUV2ZW50LCBoYW5kbGVIYXNoQ2hhbmdlKTtcbiAgICB9XG4gIH07XG5cbiAgdmFyIGlzQmxvY2tlZCA9IGZhbHNlO1xuXG4gIHZhciBibG9jayA9IGZ1bmN0aW9uIGJsb2NrKCkge1xuICAgIHZhciBwcm9tcHQgPSBhcmd1bWVudHMubGVuZ3RoID4gMCAmJiBhcmd1bWVudHNbMF0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1swXSA6IGZhbHNlO1xuXG4gICAgdmFyIHVuYmxvY2sgPSB0cmFuc2l0aW9uTWFuYWdlci5zZXRQcm9tcHQocHJvbXB0KTtcblxuICAgIGlmICghaXNCbG9ja2VkKSB7XG4gICAgICBjaGVja0RPTUxpc3RlbmVycygxKTtcbiAgICAgIGlzQmxvY2tlZCA9IHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmIChpc0Jsb2NrZWQpIHtcbiAgICAgICAgaXNCbG9ja2VkID0gZmFsc2U7XG4gICAgICAgIGNoZWNrRE9NTGlzdGVuZXJzKC0xKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHVuYmxvY2soKTtcbiAgICB9O1xuICB9O1xuXG4gIHZhciBsaXN0ZW4gPSBmdW5jdGlvbiBsaXN0ZW4obGlzdGVuZXIpIHtcbiAgICB2YXIgdW5saXN0ZW4gPSB0cmFuc2l0aW9uTWFuYWdlci5hcHBlbmRMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgY2hlY2tET01MaXN0ZW5lcnMoMSk7XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgY2hlY2tET01MaXN0ZW5lcnMoLTEpO1xuICAgICAgdW5saXN0ZW4oKTtcbiAgICB9O1xuICB9O1xuXG4gIHZhciBoaXN0b3J5ID0ge1xuICAgIGxlbmd0aDogZ2xvYmFsSGlzdG9yeS5sZW5ndGgsXG4gICAgYWN0aW9uOiAnUE9QJyxcbiAgICBsb2NhdGlvbjogaW5pdGlhbExvY2F0aW9uLFxuICAgIGNyZWF0ZUhyZWY6IGNyZWF0ZUhyZWYsXG4gICAgcHVzaDogcHVzaCxcbiAgICByZXBsYWNlOiByZXBsYWNlLFxuICAgIGdvOiBnbyxcbiAgICBnb0JhY2s6IGdvQmFjayxcbiAgICBnb0ZvcndhcmQ6IGdvRm9yd2FyZCxcbiAgICBibG9jazogYmxvY2ssXG4gICAgbGlzdGVuOiBsaXN0ZW5cbiAgfTtcblxuICByZXR1cm4gaGlzdG9yeTtcbn07XG5cbmV4cG9ydHMuZGVmYXVsdCA9IGNyZWF0ZUhhc2hIaXN0b3J5OyIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcblxudmFyIF90eXBlb2YgPSB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgdHlwZW9mIFN5bWJvbC5pdGVyYXRvciA9PT0gXCJzeW1ib2xcIiA/IGZ1bmN0aW9uIChvYmopIHsgcmV0dXJuIHR5cGVvZiBvYmo7IH0gOiBmdW5jdGlvbiAob2JqKSB7IHJldHVybiBvYmogJiYgdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIG9iai5jb25zdHJ1Y3RvciA9PT0gU3ltYm9sICYmIG9iaiAhPT0gU3ltYm9sLnByb3RvdHlwZSA/IFwic3ltYm9sXCIgOiB0eXBlb2Ygb2JqOyB9O1xuXG52YXIgX2V4dGVuZHMgPSBPYmplY3QuYXNzaWduIHx8IGZ1bmN0aW9uICh0YXJnZXQpIHsgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHsgdmFyIHNvdXJjZSA9IGFyZ3VtZW50c1tpXTsgZm9yICh2YXIga2V5IGluIHNvdXJjZSkgeyBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHNvdXJjZSwga2V5KSkgeyB0YXJnZXRba2V5XSA9IHNvdXJjZVtrZXldOyB9IH0gfSByZXR1cm4gdGFyZ2V0OyB9O1xuXG52YXIgX3dhcm5pbmcgPSByZXF1aXJlKCd3YXJuaW5nJyk7XG5cbnZhciBfd2FybmluZzIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF93YXJuaW5nKTtcblxudmFyIF9QYXRoVXRpbHMgPSByZXF1aXJlKCcuL1BhdGhVdGlscycpO1xuXG52YXIgX0xvY2F0aW9uVXRpbHMgPSByZXF1aXJlKCcuL0xvY2F0aW9uVXRpbHMnKTtcblxudmFyIF9jcmVhdGVUcmFuc2l0aW9uTWFuYWdlciA9IHJlcXVpcmUoJy4vY3JlYXRlVHJhbnNpdGlvbk1hbmFnZXInKTtcblxudmFyIF9jcmVhdGVUcmFuc2l0aW9uTWFuYWdlcjIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9jcmVhdGVUcmFuc2l0aW9uTWFuYWdlcik7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IGRlZmF1bHQ6IG9iaiB9OyB9XG5cbnZhciBjbGFtcCA9IGZ1bmN0aW9uIGNsYW1wKG4sIGxvd2VyQm91bmQsIHVwcGVyQm91bmQpIHtcbiAgcmV0dXJuIE1hdGgubWluKE1hdGgubWF4KG4sIGxvd2VyQm91bmQpLCB1cHBlckJvdW5kKTtcbn07XG5cbi8qKlxuICogQ3JlYXRlcyBhIGhpc3Rvcnkgb2JqZWN0IHRoYXQgc3RvcmVzIGxvY2F0aW9ucyBpbiBtZW1vcnkuXG4gKi9cbnZhciBjcmVhdGVNZW1vcnlIaXN0b3J5ID0gZnVuY3Rpb24gY3JlYXRlTWVtb3J5SGlzdG9yeSgpIHtcbiAgdmFyIHByb3BzID0gYXJndW1lbnRzLmxlbmd0aCA+IDAgJiYgYXJndW1lbnRzWzBdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMF0gOiB7fTtcbiAgdmFyIGdldFVzZXJDb25maXJtYXRpb24gPSBwcm9wcy5nZXRVc2VyQ29uZmlybWF0aW9uLFxuICAgICAgX3Byb3BzJGluaXRpYWxFbnRyaWVzID0gcHJvcHMuaW5pdGlhbEVudHJpZXMsXG4gICAgICBpbml0aWFsRW50cmllcyA9IF9wcm9wcyRpbml0aWFsRW50cmllcyA9PT0gdW5kZWZpbmVkID8gWycvJ10gOiBfcHJvcHMkaW5pdGlhbEVudHJpZXMsXG4gICAgICBfcHJvcHMkaW5pdGlhbEluZGV4ID0gcHJvcHMuaW5pdGlhbEluZGV4LFxuICAgICAgaW5pdGlhbEluZGV4ID0gX3Byb3BzJGluaXRpYWxJbmRleCA9PT0gdW5kZWZpbmVkID8gMCA6IF9wcm9wcyRpbml0aWFsSW5kZXgsXG4gICAgICBfcHJvcHMka2V5TGVuZ3RoID0gcHJvcHMua2V5TGVuZ3RoLFxuICAgICAga2V5TGVuZ3RoID0gX3Byb3BzJGtleUxlbmd0aCA9PT0gdW5kZWZpbmVkID8gNiA6IF9wcm9wcyRrZXlMZW5ndGg7XG5cblxuICB2YXIgdHJhbnNpdGlvbk1hbmFnZXIgPSAoMCwgX2NyZWF0ZVRyYW5zaXRpb25NYW5hZ2VyMi5kZWZhdWx0KSgpO1xuXG4gIHZhciBzZXRTdGF0ZSA9IGZ1bmN0aW9uIHNldFN0YXRlKG5leHRTdGF0ZSkge1xuICAgIF9leHRlbmRzKGhpc3RvcnksIG5leHRTdGF0ZSk7XG5cbiAgICBoaXN0b3J5Lmxlbmd0aCA9IGhpc3RvcnkuZW50cmllcy5sZW5ndGg7XG5cbiAgICB0cmFuc2l0aW9uTWFuYWdlci5ub3RpZnlMaXN0ZW5lcnMoaGlzdG9yeS5sb2NhdGlvbiwgaGlzdG9yeS5hY3Rpb24pO1xuICB9O1xuXG4gIHZhciBjcmVhdGVLZXkgPSBmdW5jdGlvbiBjcmVhdGVLZXkoKSB7XG4gICAgcmV0dXJuIE1hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnN1YnN0cigyLCBrZXlMZW5ndGgpO1xuICB9O1xuXG4gIHZhciBpbmRleCA9IGNsYW1wKGluaXRpYWxJbmRleCwgMCwgaW5pdGlhbEVudHJpZXMubGVuZ3RoIC0gMSk7XG4gIHZhciBlbnRyaWVzID0gaW5pdGlhbEVudHJpZXMubWFwKGZ1bmN0aW9uIChlbnRyeSkge1xuICAgIHJldHVybiB0eXBlb2YgZW50cnkgPT09ICdzdHJpbmcnID8gKDAsIF9Mb2NhdGlvblV0aWxzLmNyZWF0ZUxvY2F0aW9uKShlbnRyeSwgdW5kZWZpbmVkLCBjcmVhdGVLZXkoKSkgOiAoMCwgX0xvY2F0aW9uVXRpbHMuY3JlYXRlTG9jYXRpb24pKGVudHJ5LCB1bmRlZmluZWQsIGVudHJ5LmtleSB8fCBjcmVhdGVLZXkoKSk7XG4gIH0pO1xuXG4gIC8vIFB1YmxpYyBpbnRlcmZhY2VcblxuICB2YXIgY3JlYXRlSHJlZiA9IF9QYXRoVXRpbHMuY3JlYXRlUGF0aDtcblxuICB2YXIgcHVzaCA9IGZ1bmN0aW9uIHB1c2gocGF0aCwgc3RhdGUpIHtcbiAgICAoMCwgX3dhcm5pbmcyLmRlZmF1bHQpKCEoKHR5cGVvZiBwYXRoID09PSAndW5kZWZpbmVkJyA/ICd1bmRlZmluZWQnIDogX3R5cGVvZihwYXRoKSkgPT09ICdvYmplY3QnICYmIHBhdGguc3RhdGUgIT09IHVuZGVmaW5lZCAmJiBzdGF0ZSAhPT0gdW5kZWZpbmVkKSwgJ1lvdSBzaG91bGQgYXZvaWQgcHJvdmlkaW5nIGEgMm5kIHN0YXRlIGFyZ3VtZW50IHRvIHB1c2ggd2hlbiB0aGUgMXN0ICcgKyAnYXJndW1lbnQgaXMgYSBsb2NhdGlvbi1saWtlIG9iamVjdCB0aGF0IGFscmVhZHkgaGFzIHN0YXRlOyBpdCBpcyBpZ25vcmVkJyk7XG5cbiAgICB2YXIgYWN0aW9uID0gJ1BVU0gnO1xuICAgIHZhciBsb2NhdGlvbiA9ICgwLCBfTG9jYXRpb25VdGlscy5jcmVhdGVMb2NhdGlvbikocGF0aCwgc3RhdGUsIGNyZWF0ZUtleSgpLCBoaXN0b3J5LmxvY2F0aW9uKTtcblxuICAgIHRyYW5zaXRpb25NYW5hZ2VyLmNvbmZpcm1UcmFuc2l0aW9uVG8obG9jYXRpb24sIGFjdGlvbiwgZ2V0VXNlckNvbmZpcm1hdGlvbiwgZnVuY3Rpb24gKG9rKSB7XG4gICAgICBpZiAoIW9rKSByZXR1cm47XG5cbiAgICAgIHZhciBwcmV2SW5kZXggPSBoaXN0b3J5LmluZGV4O1xuICAgICAgdmFyIG5leHRJbmRleCA9IHByZXZJbmRleCArIDE7XG5cbiAgICAgIHZhciBuZXh0RW50cmllcyA9IGhpc3RvcnkuZW50cmllcy5zbGljZSgwKTtcbiAgICAgIGlmIChuZXh0RW50cmllcy5sZW5ndGggPiBuZXh0SW5kZXgpIHtcbiAgICAgICAgbmV4dEVudHJpZXMuc3BsaWNlKG5leHRJbmRleCwgbmV4dEVudHJpZXMubGVuZ3RoIC0gbmV4dEluZGV4LCBsb2NhdGlvbik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBuZXh0RW50cmllcy5wdXNoKGxvY2F0aW9uKTtcbiAgICAgIH1cblxuICAgICAgc2V0U3RhdGUoe1xuICAgICAgICBhY3Rpb246IGFjdGlvbixcbiAgICAgICAgbG9jYXRpb246IGxvY2F0aW9uLFxuICAgICAgICBpbmRleDogbmV4dEluZGV4LFxuICAgICAgICBlbnRyaWVzOiBuZXh0RW50cmllc1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH07XG5cbiAgdmFyIHJlcGxhY2UgPSBmdW5jdGlvbiByZXBsYWNlKHBhdGgsIHN0YXRlKSB7XG4gICAgKDAsIF93YXJuaW5nMi5kZWZhdWx0KSghKCh0eXBlb2YgcGF0aCA9PT0gJ3VuZGVmaW5lZCcgPyAndW5kZWZpbmVkJyA6IF90eXBlb2YocGF0aCkpID09PSAnb2JqZWN0JyAmJiBwYXRoLnN0YXRlICE9PSB1bmRlZmluZWQgJiYgc3RhdGUgIT09IHVuZGVmaW5lZCksICdZb3Ugc2hvdWxkIGF2b2lkIHByb3ZpZGluZyBhIDJuZCBzdGF0ZSBhcmd1bWVudCB0byByZXBsYWNlIHdoZW4gdGhlIDFzdCAnICsgJ2FyZ3VtZW50IGlzIGEgbG9jYXRpb24tbGlrZSBvYmplY3QgdGhhdCBhbHJlYWR5IGhhcyBzdGF0ZTsgaXQgaXMgaWdub3JlZCcpO1xuXG4gICAgdmFyIGFjdGlvbiA9ICdSRVBMQUNFJztcbiAgICB2YXIgbG9jYXRpb24gPSAoMCwgX0xvY2F0aW9uVXRpbHMuY3JlYXRlTG9jYXRpb24pKHBhdGgsIHN0YXRlLCBjcmVhdGVLZXkoKSwgaGlzdG9yeS5sb2NhdGlvbik7XG5cbiAgICB0cmFuc2l0aW9uTWFuYWdlci5jb25maXJtVHJhbnNpdGlvblRvKGxvY2F0aW9uLCBhY3Rpb24sIGdldFVzZXJDb25maXJtYXRpb24sIGZ1bmN0aW9uIChvaykge1xuICAgICAgaWYgKCFvaykgcmV0dXJuO1xuXG4gICAgICBoaXN0b3J5LmVudHJpZXNbaGlzdG9yeS5pbmRleF0gPSBsb2NhdGlvbjtcblxuICAgICAgc2V0U3RhdGUoeyBhY3Rpb246IGFjdGlvbiwgbG9jYXRpb246IGxvY2F0aW9uIH0pO1xuICAgIH0pO1xuICB9O1xuXG4gIHZhciBnbyA9IGZ1bmN0aW9uIGdvKG4pIHtcbiAgICB2YXIgbmV4dEluZGV4ID0gY2xhbXAoaGlzdG9yeS5pbmRleCArIG4sIDAsIGhpc3RvcnkuZW50cmllcy5sZW5ndGggLSAxKTtcblxuICAgIHZhciBhY3Rpb24gPSAnUE9QJztcbiAgICB2YXIgbG9jYXRpb24gPSBoaXN0b3J5LmVudHJpZXNbbmV4dEluZGV4XTtcblxuICAgIHRyYW5zaXRpb25NYW5hZ2VyLmNvbmZpcm1UcmFuc2l0aW9uVG8obG9jYXRpb24sIGFjdGlvbiwgZ2V0VXNlckNvbmZpcm1hdGlvbiwgZnVuY3Rpb24gKG9rKSB7XG4gICAgICBpZiAob2spIHtcbiAgICAgICAgc2V0U3RhdGUoe1xuICAgICAgICAgIGFjdGlvbjogYWN0aW9uLFxuICAgICAgICAgIGxvY2F0aW9uOiBsb2NhdGlvbixcbiAgICAgICAgICBpbmRleDogbmV4dEluZGV4XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gTWltaWMgdGhlIGJlaGF2aW9yIG9mIERPTSBoaXN0b3JpZXMgYnlcbiAgICAgICAgLy8gY2F1c2luZyBhIHJlbmRlciBhZnRlciBhIGNhbmNlbGxlZCBQT1AuXG4gICAgICAgIHNldFN0YXRlKCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH07XG5cbiAgdmFyIGdvQmFjayA9IGZ1bmN0aW9uIGdvQmFjaygpIHtcbiAgICByZXR1cm4gZ28oLTEpO1xuICB9O1xuXG4gIHZhciBnb0ZvcndhcmQgPSBmdW5jdGlvbiBnb0ZvcndhcmQoKSB7XG4gICAgcmV0dXJuIGdvKDEpO1xuICB9O1xuXG4gIHZhciBjYW5HbyA9IGZ1bmN0aW9uIGNhbkdvKG4pIHtcbiAgICB2YXIgbmV4dEluZGV4ID0gaGlzdG9yeS5pbmRleCArIG47XG4gICAgcmV0dXJuIG5leHRJbmRleCA+PSAwICYmIG5leHRJbmRleCA8IGhpc3RvcnkuZW50cmllcy5sZW5ndGg7XG4gIH07XG5cbiAgdmFyIGJsb2NrID0gZnVuY3Rpb24gYmxvY2soKSB7XG4gICAgdmFyIHByb21wdCA9IGFyZ3VtZW50cy5sZW5ndGggPiAwICYmIGFyZ3VtZW50c1swXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzBdIDogZmFsc2U7XG4gICAgcmV0dXJuIHRyYW5zaXRpb25NYW5hZ2VyLnNldFByb21wdChwcm9tcHQpO1xuICB9O1xuXG4gIHZhciBsaXN0ZW4gPSBmdW5jdGlvbiBsaXN0ZW4obGlzdGVuZXIpIHtcbiAgICByZXR1cm4gdHJhbnNpdGlvbk1hbmFnZXIuYXBwZW5kTGlzdGVuZXIobGlzdGVuZXIpO1xuICB9O1xuXG4gIHZhciBoaXN0b3J5ID0ge1xuICAgIGxlbmd0aDogZW50cmllcy5sZW5ndGgsXG4gICAgYWN0aW9uOiAnUE9QJyxcbiAgICBsb2NhdGlvbjogZW50cmllc1tpbmRleF0sXG4gICAgaW5kZXg6IGluZGV4LFxuICAgIGVudHJpZXM6IGVudHJpZXMsXG4gICAgY3JlYXRlSHJlZjogY3JlYXRlSHJlZixcbiAgICBwdXNoOiBwdXNoLFxuICAgIHJlcGxhY2U6IHJlcGxhY2UsXG4gICAgZ286IGdvLFxuICAgIGdvQmFjazogZ29CYWNrLFxuICAgIGdvRm9yd2FyZDogZ29Gb3J3YXJkLFxuICAgIGNhbkdvOiBjYW5HbyxcbiAgICBibG9jazogYmxvY2ssXG4gICAgbGlzdGVuOiBsaXN0ZW5cbiAgfTtcblxuICByZXR1cm4gaGlzdG9yeTtcbn07XG5cbmV4cG9ydHMuZGVmYXVsdCA9IGNyZWF0ZU1lbW9yeUhpc3Rvcnk7IiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuXG52YXIgX3dhcm5pbmcgPSByZXF1aXJlKCd3YXJuaW5nJyk7XG5cbnZhciBfd2FybmluZzIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF93YXJuaW5nKTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgZGVmYXVsdDogb2JqIH07IH1cblxudmFyIGNyZWF0ZVRyYW5zaXRpb25NYW5hZ2VyID0gZnVuY3Rpb24gY3JlYXRlVHJhbnNpdGlvbk1hbmFnZXIoKSB7XG4gIHZhciBwcm9tcHQgPSBudWxsO1xuXG4gIHZhciBzZXRQcm9tcHQgPSBmdW5jdGlvbiBzZXRQcm9tcHQobmV4dFByb21wdCkge1xuICAgICgwLCBfd2FybmluZzIuZGVmYXVsdCkocHJvbXB0ID09IG51bGwsICdBIGhpc3Rvcnkgc3VwcG9ydHMgb25seSBvbmUgcHJvbXB0IGF0IGEgdGltZScpO1xuXG4gICAgcHJvbXB0ID0gbmV4dFByb21wdDtcblxuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAocHJvbXB0ID09PSBuZXh0UHJvbXB0KSBwcm9tcHQgPSBudWxsO1xuICAgIH07XG4gIH07XG5cbiAgdmFyIGNvbmZpcm1UcmFuc2l0aW9uVG8gPSBmdW5jdGlvbiBjb25maXJtVHJhbnNpdGlvblRvKGxvY2F0aW9uLCBhY3Rpb24sIGdldFVzZXJDb25maXJtYXRpb24sIGNhbGxiYWNrKSB7XG4gICAgLy8gVE9ETzogSWYgYW5vdGhlciB0cmFuc2l0aW9uIHN0YXJ0cyB3aGlsZSB3ZSdyZSBzdGlsbCBjb25maXJtaW5nXG4gICAgLy8gdGhlIHByZXZpb3VzIG9uZSwgd2UgbWF5IGVuZCB1cCBpbiBhIHdlaXJkIHN0YXRlLiBGaWd1cmUgb3V0IHRoZVxuICAgIC8vIGJlc3Qgd2F5IHRvIGhhbmRsZSB0aGlzLlxuICAgIGlmIChwcm9tcHQgIT0gbnVsbCkge1xuICAgICAgdmFyIHJlc3VsdCA9IHR5cGVvZiBwcm9tcHQgPT09ICdmdW5jdGlvbicgPyBwcm9tcHQobG9jYXRpb24sIGFjdGlvbikgOiBwcm9tcHQ7XG5cbiAgICAgIGlmICh0eXBlb2YgcmVzdWx0ID09PSAnc3RyaW5nJykge1xuICAgICAgICBpZiAodHlwZW9mIGdldFVzZXJDb25maXJtYXRpb24gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICBnZXRVc2VyQ29uZmlybWF0aW9uKHJlc3VsdCwgY2FsbGJhY2spO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICgwLCBfd2FybmluZzIuZGVmYXVsdCkoZmFsc2UsICdBIGhpc3RvcnkgbmVlZHMgYSBnZXRVc2VyQ29uZmlybWF0aW9uIGZ1bmN0aW9uIGluIG9yZGVyIHRvIHVzZSBhIHByb21wdCBtZXNzYWdlJyk7XG5cbiAgICAgICAgICBjYWxsYmFjayh0cnVlKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gUmV0dXJuIGZhbHNlIGZyb20gYSB0cmFuc2l0aW9uIGhvb2sgdG8gY2FuY2VsIHRoZSB0cmFuc2l0aW9uLlxuICAgICAgICBjYWxsYmFjayhyZXN1bHQgIT09IGZhbHNlKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgY2FsbGJhY2sodHJ1ZSk7XG4gICAgfVxuICB9O1xuXG4gIHZhciBsaXN0ZW5lcnMgPSBbXTtcblxuICB2YXIgYXBwZW5kTGlzdGVuZXIgPSBmdW5jdGlvbiBhcHBlbmRMaXN0ZW5lcihmbikge1xuICAgIHZhciBpc0FjdGl2ZSA9IHRydWU7XG5cbiAgICB2YXIgbGlzdGVuZXIgPSBmdW5jdGlvbiBsaXN0ZW5lcigpIHtcbiAgICAgIGlmIChpc0FjdGl2ZSkgZm4uYXBwbHkodW5kZWZpbmVkLCBhcmd1bWVudHMpO1xuICAgIH07XG5cbiAgICBsaXN0ZW5lcnMucHVzaChsaXN0ZW5lcik7XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgaXNBY3RpdmUgPSBmYWxzZTtcbiAgICAgIGxpc3RlbmVycyA9IGxpc3RlbmVycy5maWx0ZXIoZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgcmV0dXJuIGl0ZW0gIT09IGxpc3RlbmVyO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfTtcblxuICB2YXIgbm90aWZ5TGlzdGVuZXJzID0gZnVuY3Rpb24gbm90aWZ5TGlzdGVuZXJzKCkge1xuICAgIGZvciAodmFyIF9sZW4gPSBhcmd1bWVudHMubGVuZ3RoLCBhcmdzID0gQXJyYXkoX2xlbiksIF9rZXkgPSAwOyBfa2V5IDwgX2xlbjsgX2tleSsrKSB7XG4gICAgICBhcmdzW19rZXldID0gYXJndW1lbnRzW19rZXldO1xuICAgIH1cblxuICAgIGxpc3RlbmVycy5mb3JFYWNoKGZ1bmN0aW9uIChsaXN0ZW5lcikge1xuICAgICAgcmV0dXJuIGxpc3RlbmVyLmFwcGx5KHVuZGVmaW5lZCwgYXJncyk7XG4gICAgfSk7XG4gIH07XG5cbiAgcmV0dXJuIHtcbiAgICBzZXRQcm9tcHQ6IHNldFByb21wdCxcbiAgICBjb25maXJtVHJhbnNpdGlvblRvOiBjb25maXJtVHJhbnNpdGlvblRvLFxuICAgIGFwcGVuZExpc3RlbmVyOiBhcHBlbmRMaXN0ZW5lcixcbiAgICBub3RpZnlMaXN0ZW5lcnM6IG5vdGlmeUxpc3RlbmVyc1xuICB9O1xufTtcblxuZXhwb3J0cy5kZWZhdWx0ID0gY3JlYXRlVHJhbnNpdGlvbk1hbmFnZXI7IiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuZXhwb3J0cy5jcmVhdGVQYXRoID0gZXhwb3J0cy5wYXJzZVBhdGggPSBleHBvcnRzLmxvY2F0aW9uc0FyZUVxdWFsID0gZXhwb3J0cy5jcmVhdGVMb2NhdGlvbiA9IGV4cG9ydHMuY3JlYXRlTWVtb3J5SGlzdG9yeSA9IGV4cG9ydHMuY3JlYXRlSGFzaEhpc3RvcnkgPSBleHBvcnRzLmNyZWF0ZUJyb3dzZXJIaXN0b3J5ID0gdW5kZWZpbmVkO1xuXG52YXIgX0xvY2F0aW9uVXRpbHMgPSByZXF1aXJlKCcuL0xvY2F0aW9uVXRpbHMnKTtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdjcmVhdGVMb2NhdGlvbicsIHtcbiAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgcmV0dXJuIF9Mb2NhdGlvblV0aWxzLmNyZWF0ZUxvY2F0aW9uO1xuICB9XG59KTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnbG9jYXRpb25zQXJlRXF1YWwnLCB7XG4gIGVudW1lcmFibGU6IHRydWUsXG4gIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgIHJldHVybiBfTG9jYXRpb25VdGlscy5sb2NhdGlvbnNBcmVFcXVhbDtcbiAgfVxufSk7XG5cbnZhciBfUGF0aFV0aWxzID0gcmVxdWlyZSgnLi9QYXRoVXRpbHMnKTtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdwYXJzZVBhdGgnLCB7XG4gIGVudW1lcmFibGU6IHRydWUsXG4gIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgIHJldHVybiBfUGF0aFV0aWxzLnBhcnNlUGF0aDtcbiAgfVxufSk7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ2NyZWF0ZVBhdGgnLCB7XG4gIGVudW1lcmFibGU6IHRydWUsXG4gIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgIHJldHVybiBfUGF0aFV0aWxzLmNyZWF0ZVBhdGg7XG4gIH1cbn0pO1xuXG52YXIgX2NyZWF0ZUJyb3dzZXJIaXN0b3J5MiA9IHJlcXVpcmUoJy4vY3JlYXRlQnJvd3Nlckhpc3RvcnknKTtcblxudmFyIF9jcmVhdGVCcm93c2VySGlzdG9yeTMgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9jcmVhdGVCcm93c2VySGlzdG9yeTIpO1xuXG52YXIgX2NyZWF0ZUhhc2hIaXN0b3J5MiA9IHJlcXVpcmUoJy4vY3JlYXRlSGFzaEhpc3RvcnknKTtcblxudmFyIF9jcmVhdGVIYXNoSGlzdG9yeTMgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9jcmVhdGVIYXNoSGlzdG9yeTIpO1xuXG52YXIgX2NyZWF0ZU1lbW9yeUhpc3RvcnkyID0gcmVxdWlyZSgnLi9jcmVhdGVNZW1vcnlIaXN0b3J5Jyk7XG5cbnZhciBfY3JlYXRlTWVtb3J5SGlzdG9yeTMgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9jcmVhdGVNZW1vcnlIaXN0b3J5Mik7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IGRlZmF1bHQ6IG9iaiB9OyB9XG5cbmV4cG9ydHMuY3JlYXRlQnJvd3Nlckhpc3RvcnkgPSBfY3JlYXRlQnJvd3Nlckhpc3RvcnkzLmRlZmF1bHQ7XG5leHBvcnRzLmNyZWF0ZUhhc2hIaXN0b3J5ID0gX2NyZWF0ZUhhc2hIaXN0b3J5My5kZWZhdWx0O1xuZXhwb3J0cy5jcmVhdGVNZW1vcnlIaXN0b3J5ID0gX2NyZWF0ZU1lbW9yeUhpc3RvcnkzLmRlZmF1bHQ7IiwiLyoqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTMtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZSBmb3VuZCBpbiB0aGVcbiAqIExJQ0VOU0UgZmlsZSBpbiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbi8qKlxuICogVXNlIGludmFyaWFudCgpIHRvIGFzc2VydCBzdGF0ZSB3aGljaCB5b3VyIHByb2dyYW0gYXNzdW1lcyB0byBiZSB0cnVlLlxuICpcbiAqIFByb3ZpZGUgc3ByaW50Zi1zdHlsZSBmb3JtYXQgKG9ubHkgJXMgaXMgc3VwcG9ydGVkKSBhbmQgYXJndW1lbnRzXG4gKiB0byBwcm92aWRlIGluZm9ybWF0aW9uIGFib3V0IHdoYXQgYnJva2UgYW5kIHdoYXQgeW91IHdlcmVcbiAqIGV4cGVjdGluZy5cbiAqXG4gKiBUaGUgaW52YXJpYW50IG1lc3NhZ2Ugd2lsbCBiZSBzdHJpcHBlZCBpbiBwcm9kdWN0aW9uLCBidXQgdGhlIGludmFyaWFudFxuICogd2lsbCByZW1haW4gdG8gZW5zdXJlIGxvZ2ljIGRvZXMgbm90IGRpZmZlciBpbiBwcm9kdWN0aW9uLlxuICovXG5cbnZhciBpbnZhcmlhbnQgPSBmdW5jdGlvbihjb25kaXRpb24sIGZvcm1hdCwgYSwgYiwgYywgZCwgZSwgZikge1xuICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgIGlmIChmb3JtYXQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdpbnZhcmlhbnQgcmVxdWlyZXMgYW4gZXJyb3IgbWVzc2FnZSBhcmd1bWVudCcpO1xuICAgIH1cbiAgfVxuXG4gIGlmICghY29uZGl0aW9uKSB7XG4gICAgdmFyIGVycm9yO1xuICAgIGlmIChmb3JtYXQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgZXJyb3IgPSBuZXcgRXJyb3IoXG4gICAgICAgICdNaW5pZmllZCBleGNlcHRpb24gb2NjdXJyZWQ7IHVzZSB0aGUgbm9uLW1pbmlmaWVkIGRldiBlbnZpcm9ubWVudCAnICtcbiAgICAgICAgJ2ZvciB0aGUgZnVsbCBlcnJvciBtZXNzYWdlIGFuZCBhZGRpdGlvbmFsIGhlbHBmdWwgd2FybmluZ3MuJ1xuICAgICAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGFyZ3MgPSBbYSwgYiwgYywgZCwgZSwgZl07XG4gICAgICB2YXIgYXJnSW5kZXggPSAwO1xuICAgICAgZXJyb3IgPSBuZXcgRXJyb3IoXG4gICAgICAgIGZvcm1hdC5yZXBsYWNlKC8lcy9nLCBmdW5jdGlvbigpIHsgcmV0dXJuIGFyZ3NbYXJnSW5kZXgrK107IH0pXG4gICAgICApO1xuICAgICAgZXJyb3IubmFtZSA9ICdJbnZhcmlhbnQgVmlvbGF0aW9uJztcbiAgICB9XG5cbiAgICBlcnJvci5mcmFtZXNUb1BvcCA9IDE7IC8vIHdlIGRvbid0IGNhcmUgYWJvdXQgaW52YXJpYW50J3Mgb3duIGZyYW1lXG4gICAgdGhyb3cgZXJyb3I7XG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gaW52YXJpYW50O1xuIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG5cbi8vIGNhY2hlZCBmcm9tIHdoYXRldmVyIGdsb2JhbCBpcyBwcmVzZW50IHNvIHRoYXQgdGVzdCBydW5uZXJzIHRoYXQgc3R1YiBpdFxuLy8gZG9uJ3QgYnJlYWsgdGhpbmdzLiAgQnV0IHdlIG5lZWQgdG8gd3JhcCBpdCBpbiBhIHRyeSBjYXRjaCBpbiBjYXNlIGl0IGlzXG4vLyB3cmFwcGVkIGluIHN0cmljdCBtb2RlIGNvZGUgd2hpY2ggZG9lc24ndCBkZWZpbmUgYW55IGdsb2JhbHMuICBJdCdzIGluc2lkZSBhXG4vLyBmdW5jdGlvbiBiZWNhdXNlIHRyeS9jYXRjaGVzIGRlb3B0aW1pemUgaW4gY2VydGFpbiBlbmdpbmVzLlxuXG52YXIgY2FjaGVkU2V0VGltZW91dDtcbnZhciBjYWNoZWRDbGVhclRpbWVvdXQ7XG5cbmZ1bmN0aW9uIGRlZmF1bHRTZXRUaW1vdXQoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdzZXRUaW1lb3V0IGhhcyBub3QgYmVlbiBkZWZpbmVkJyk7XG59XG5mdW5jdGlvbiBkZWZhdWx0Q2xlYXJUaW1lb3V0ICgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2NsZWFyVGltZW91dCBoYXMgbm90IGJlZW4gZGVmaW5lZCcpO1xufVxuKGZ1bmN0aW9uICgpIHtcbiAgICB0cnkge1xuICAgICAgICBpZiAodHlwZW9mIHNldFRpbWVvdXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBzZXRUaW1lb3V0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IGRlZmF1bHRTZXRUaW1vdXQ7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBkZWZhdWx0U2V0VGltb3V0O1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICBpZiAodHlwZW9mIGNsZWFyVGltZW91dCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gY2xlYXJUaW1lb3V0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gZGVmYXVsdENsZWFyVGltZW91dDtcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gZGVmYXVsdENsZWFyVGltZW91dDtcbiAgICB9XG59ICgpKVxuZnVuY3Rpb24gcnVuVGltZW91dChmdW4pIHtcbiAgICBpZiAoY2FjaGVkU2V0VGltZW91dCA9PT0gc2V0VGltZW91dCkge1xuICAgICAgICAvL25vcm1hbCBlbnZpcm9tZW50cyBpbiBzYW5lIHNpdHVhdGlvbnNcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9XG4gICAgLy8gaWYgc2V0VGltZW91dCB3YXNuJ3QgYXZhaWxhYmxlIGJ1dCB3YXMgbGF0dGVyIGRlZmluZWRcbiAgICBpZiAoKGNhY2hlZFNldFRpbWVvdXQgPT09IGRlZmF1bHRTZXRUaW1vdXQgfHwgIWNhY2hlZFNldFRpbWVvdXQpICYmIHNldFRpbWVvdXQpIHtcbiAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IHNldFRpbWVvdXQ7XG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIC8vIHdoZW4gd2hlbiBzb21lYm9keSBoYXMgc2NyZXdlZCB3aXRoIHNldFRpbWVvdXQgYnV0IG5vIEkuRS4gbWFkZG5lc3NcbiAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9IGNhdGNoKGUpe1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gV2hlbiB3ZSBhcmUgaW4gSS5FLiBidXQgdGhlIHNjcmlwdCBoYXMgYmVlbiBldmFsZWQgc28gSS5FLiBkb2Vzbid0IHRydXN0IHRoZSBnbG9iYWwgb2JqZWN0IHdoZW4gY2FsbGVkIG5vcm1hbGx5XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dC5jYWxsKG51bGwsIGZ1biwgMCk7XG4gICAgICAgIH0gY2F0Y2goZSl7XG4gICAgICAgICAgICAvLyBzYW1lIGFzIGFib3ZlIGJ1dCB3aGVuIGl0J3MgYSB2ZXJzaW9uIG9mIEkuRS4gdGhhdCBtdXN0IGhhdmUgdGhlIGdsb2JhbCBvYmplY3QgZm9yICd0aGlzJywgaG9wZnVsbHkgb3VyIGNvbnRleHQgY29ycmVjdCBvdGhlcndpc2UgaXQgd2lsbCB0aHJvdyBhIGdsb2JhbCBlcnJvclxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQuY2FsbCh0aGlzLCBmdW4sIDApO1xuICAgICAgICB9XG4gICAgfVxuXG5cbn1cbmZ1bmN0aW9uIHJ1bkNsZWFyVGltZW91dChtYXJrZXIpIHtcbiAgICBpZiAoY2FjaGVkQ2xlYXJUaW1lb3V0ID09PSBjbGVhclRpbWVvdXQpIHtcbiAgICAgICAgLy9ub3JtYWwgZW52aXJvbWVudHMgaW4gc2FuZSBzaXR1YXRpb25zXG4gICAgICAgIHJldHVybiBjbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9XG4gICAgLy8gaWYgY2xlYXJUaW1lb3V0IHdhc24ndCBhdmFpbGFibGUgYnV0IHdhcyBsYXR0ZXIgZGVmaW5lZFxuICAgIGlmICgoY2FjaGVkQ2xlYXJUaW1lb3V0ID09PSBkZWZhdWx0Q2xlYXJUaW1lb3V0IHx8ICFjYWNoZWRDbGVhclRpbWVvdXQpICYmIGNsZWFyVGltZW91dCkge1xuICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBjbGVhclRpbWVvdXQ7XG4gICAgICAgIHJldHVybiBjbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgLy8gd2hlbiB3aGVuIHNvbWVib2R5IGhhcyBzY3Jld2VkIHdpdGggc2V0VGltZW91dCBidXQgbm8gSS5FLiBtYWRkbmVzc1xuICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfSBjYXRjaCAoZSl7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBXaGVuIHdlIGFyZSBpbiBJLkUuIGJ1dCB0aGUgc2NyaXB0IGhhcyBiZWVuIGV2YWxlZCBzbyBJLkUuIGRvZXNuJ3QgIHRydXN0IHRoZSBnbG9iYWwgb2JqZWN0IHdoZW4gY2FsbGVkIG5vcm1hbGx5XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0LmNhbGwobnVsbCwgbWFya2VyKTtcbiAgICAgICAgfSBjYXRjaCAoZSl7XG4gICAgICAgICAgICAvLyBzYW1lIGFzIGFib3ZlIGJ1dCB3aGVuIGl0J3MgYSB2ZXJzaW9uIG9mIEkuRS4gdGhhdCBtdXN0IGhhdmUgdGhlIGdsb2JhbCBvYmplY3QgZm9yICd0aGlzJywgaG9wZnVsbHkgb3VyIGNvbnRleHQgY29ycmVjdCBvdGhlcndpc2UgaXQgd2lsbCB0aHJvdyBhIGdsb2JhbCBlcnJvci5cbiAgICAgICAgICAgIC8vIFNvbWUgdmVyc2lvbnMgb2YgSS5FLiBoYXZlIGRpZmZlcmVudCBydWxlcyBmb3IgY2xlYXJUaW1lb3V0IHZzIHNldFRpbWVvdXRcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQuY2FsbCh0aGlzLCBtYXJrZXIpO1xuICAgICAgICB9XG4gICAgfVxuXG5cblxufVxudmFyIHF1ZXVlID0gW107XG52YXIgZHJhaW5pbmcgPSBmYWxzZTtcbnZhciBjdXJyZW50UXVldWU7XG52YXIgcXVldWVJbmRleCA9IC0xO1xuXG5mdW5jdGlvbiBjbGVhblVwTmV4dFRpY2soKSB7XG4gICAgaWYgKCFkcmFpbmluZyB8fCAhY3VycmVudFF1ZXVlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBpZiAoY3VycmVudFF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBxdWV1ZSA9IGN1cnJlbnRRdWV1ZS5jb25jYXQocXVldWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICB9XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBkcmFpblF1ZXVlKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBkcmFpblF1ZXVlKCkge1xuICAgIGlmIChkcmFpbmluZykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciB0aW1lb3V0ID0gcnVuVGltZW91dChjbGVhblVwTmV4dFRpY2spO1xuICAgIGRyYWluaW5nID0gdHJ1ZTtcblxuICAgIHZhciBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgd2hpbGUobGVuKSB7XG4gICAgICAgIGN1cnJlbnRRdWV1ZSA9IHF1ZXVlO1xuICAgICAgICBxdWV1ZSA9IFtdO1xuICAgICAgICB3aGlsZSAoKytxdWV1ZUluZGV4IDwgbGVuKSB7XG4gICAgICAgICAgICBpZiAoY3VycmVudFF1ZXVlKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudFF1ZXVlW3F1ZXVlSW5kZXhdLnJ1bigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICAgICAgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIH1cbiAgICBjdXJyZW50UXVldWUgPSBudWxsO1xuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgcnVuQ2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xufVxuXG5wcm9jZXNzLm5leHRUaWNrID0gZnVuY3Rpb24gKGZ1bikge1xuICAgIHZhciBhcmdzID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGggLSAxKTtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgICAgICB9XG4gICAgfVxuICAgIHF1ZXVlLnB1c2gobmV3IEl0ZW0oZnVuLCBhcmdzKSk7XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCA9PT0gMSAmJiAhZHJhaW5pbmcpIHtcbiAgICAgICAgcnVuVGltZW91dChkcmFpblF1ZXVlKTtcbiAgICB9XG59O1xuXG4vLyB2OCBsaWtlcyBwcmVkaWN0aWJsZSBvYmplY3RzXG5mdW5jdGlvbiBJdGVtKGZ1biwgYXJyYXkpIHtcbiAgICB0aGlzLmZ1biA9IGZ1bjtcbiAgICB0aGlzLmFycmF5ID0gYXJyYXk7XG59XG5JdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5mdW4uYXBwbHkobnVsbCwgdGhpcy5hcnJheSk7XG59O1xucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5wcm9jZXNzLnZlcnNpb24gPSAnJzsgLy8gZW1wdHkgc3RyaW5nIHRvIGF2b2lkIHJlZ2V4cCBpc3N1ZXNcbnByb2Nlc3MudmVyc2lvbnMgPSB7fTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnByb2Nlc3Mub24gPSBub29wO1xucHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLm9uY2UgPSBub29wO1xucHJvY2Vzcy5vZmYgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5wcm9jZXNzLmVtaXQgPSBub29wO1xucHJvY2Vzcy5wcmVwZW5kTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5wcmVwZW5kT25jZUxpc3RlbmVyID0gbm9vcDtcblxucHJvY2Vzcy5saXN0ZW5lcnMgPSBmdW5jdGlvbiAobmFtZSkgeyByZXR1cm4gW10gfVxuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5cbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xucHJvY2Vzcy51bWFzayA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gMDsgfTtcbiIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcbmZ1bmN0aW9uIGlzQWJzb2x1dGUocGF0aG5hbWUpIHtcbiAgcmV0dXJuIHBhdGhuYW1lLmNoYXJBdCgwKSA9PT0gJy8nO1xufVxuXG4vLyBBYm91dCAxLjV4IGZhc3RlciB0aGFuIHRoZSB0d28tYXJnIHZlcnNpb24gb2YgQXJyYXkjc3BsaWNlKClcbmZ1bmN0aW9uIHNwbGljZU9uZShsaXN0LCBpbmRleCkge1xuICBmb3IgKHZhciBpID0gaW5kZXgsIGsgPSBpICsgMSwgbiA9IGxpc3QubGVuZ3RoOyBrIDwgbjsgaSArPSAxLCBrICs9IDEpIHtcbiAgICBsaXN0W2ldID0gbGlzdFtrXTtcbiAgfVxuXG4gIGxpc3QucG9wKCk7XG59XG5cbi8vIFRoaXMgaW1wbGVtZW50YXRpb24gaXMgYmFzZWQgaGVhdmlseSBvbiBub2RlJ3MgdXJsLnBhcnNlXG5mdW5jdGlvbiByZXNvbHZlUGF0aG5hbWUodG8pIHtcbiAgdmFyIGZyb20gPSBhcmd1bWVudHMubGVuZ3RoID4gMSAmJiBhcmd1bWVudHNbMV0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1sxXSA6ICcnO1xuXG4gIHZhciB0b1BhcnRzID0gdG8gJiYgdG8uc3BsaXQoJy8nKSB8fCBbXTtcbiAgdmFyIGZyb21QYXJ0cyA9IGZyb20gJiYgZnJvbS5zcGxpdCgnLycpIHx8IFtdO1xuXG4gIHZhciBpc1RvQWJzID0gdG8gJiYgaXNBYnNvbHV0ZSh0byk7XG4gIHZhciBpc0Zyb21BYnMgPSBmcm9tICYmIGlzQWJzb2x1dGUoZnJvbSk7XG4gIHZhciBtdXN0RW5kQWJzID0gaXNUb0FicyB8fCBpc0Zyb21BYnM7XG5cbiAgaWYgKHRvICYmIGlzQWJzb2x1dGUodG8pKSB7XG4gICAgLy8gdG8gaXMgYWJzb2x1dGVcbiAgICBmcm9tUGFydHMgPSB0b1BhcnRzO1xuICB9IGVsc2UgaWYgKHRvUGFydHMubGVuZ3RoKSB7XG4gICAgLy8gdG8gaXMgcmVsYXRpdmUsIGRyb3AgdGhlIGZpbGVuYW1lXG4gICAgZnJvbVBhcnRzLnBvcCgpO1xuICAgIGZyb21QYXJ0cyA9IGZyb21QYXJ0cy5jb25jYXQodG9QYXJ0cyk7XG4gIH1cblxuICBpZiAoIWZyb21QYXJ0cy5sZW5ndGgpIHJldHVybiAnLyc7XG5cbiAgdmFyIGhhc1RyYWlsaW5nU2xhc2ggPSB2b2lkIDA7XG4gIGlmIChmcm9tUGFydHMubGVuZ3RoKSB7XG4gICAgdmFyIGxhc3QgPSBmcm9tUGFydHNbZnJvbVBhcnRzLmxlbmd0aCAtIDFdO1xuICAgIGhhc1RyYWlsaW5nU2xhc2ggPSBsYXN0ID09PSAnLicgfHwgbGFzdCA9PT0gJy4uJyB8fCBsYXN0ID09PSAnJztcbiAgfSBlbHNlIHtcbiAgICBoYXNUcmFpbGluZ1NsYXNoID0gZmFsc2U7XG4gIH1cblxuICB2YXIgdXAgPSAwO1xuICBmb3IgKHZhciBpID0gZnJvbVBhcnRzLmxlbmd0aDsgaSA+PSAwOyBpLS0pIHtcbiAgICB2YXIgcGFydCA9IGZyb21QYXJ0c1tpXTtcblxuICAgIGlmIChwYXJ0ID09PSAnLicpIHtcbiAgICAgIHNwbGljZU9uZShmcm9tUGFydHMsIGkpO1xuICAgIH0gZWxzZSBpZiAocGFydCA9PT0gJy4uJykge1xuICAgICAgc3BsaWNlT25lKGZyb21QYXJ0cywgaSk7XG4gICAgICB1cCsrO1xuICAgIH0gZWxzZSBpZiAodXApIHtcbiAgICAgIHNwbGljZU9uZShmcm9tUGFydHMsIGkpO1xuICAgICAgdXAtLTtcbiAgICB9XG4gIH1cblxuICBpZiAoIW11c3RFbmRBYnMpIGZvciAoOyB1cC0tOyB1cCkge1xuICAgIGZyb21QYXJ0cy51bnNoaWZ0KCcuLicpO1xuICB9aWYgKG11c3RFbmRBYnMgJiYgZnJvbVBhcnRzWzBdICE9PSAnJyAmJiAoIWZyb21QYXJ0c1swXSB8fCAhaXNBYnNvbHV0ZShmcm9tUGFydHNbMF0pKSkgZnJvbVBhcnRzLnVuc2hpZnQoJycpO1xuXG4gIHZhciByZXN1bHQgPSBmcm9tUGFydHMuam9pbignLycpO1xuXG4gIGlmIChoYXNUcmFpbGluZ1NsYXNoICYmIHJlc3VsdC5zdWJzdHIoLTEpICE9PSAnLycpIHJlc3VsdCArPSAnLyc7XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuZXhwb3J0cy5kZWZhdWx0ID0gcmVzb2x2ZVBhdGhuYW1lO1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgc2VsZWN0b3JQYXJzZXJfMSA9IHJlcXVpcmUoJy4vc2VsZWN0b3JQYXJzZXInKTtcbmZ1bmN0aW9uIGNsYXNzTmFtZUZyb21WTm9kZSh2Tm9kZSkge1xuICAgIHZhciBfYSA9IHNlbGVjdG9yUGFyc2VyXzEuc2VsZWN0b3JQYXJzZXIodk5vZGUpLmNsYXNzTmFtZSwgY24gPSBfYSA9PT0gdm9pZCAwID8gJycgOiBfYTtcbiAgICBpZiAoIXZOb2RlLmRhdGEpIHtcbiAgICAgICAgcmV0dXJuIGNuO1xuICAgIH1cbiAgICB2YXIgX2IgPSB2Tm9kZS5kYXRhLCBkYXRhQ2xhc3MgPSBfYi5jbGFzcywgcHJvcHMgPSBfYi5wcm9wcztcbiAgICBpZiAoZGF0YUNsYXNzKSB7XG4gICAgICAgIHZhciBjID0gT2JqZWN0LmtleXMoZGF0YUNsYXNzKVxuICAgICAgICAgICAgLmZpbHRlcihmdW5jdGlvbiAoY2wpIHsgcmV0dXJuIGRhdGFDbGFzc1tjbF07IH0pO1xuICAgICAgICBjbiArPSBcIiBcIiArIGMuam9pbihcIiBcIik7XG4gICAgfVxuICAgIGlmIChwcm9wcyAmJiBwcm9wcy5jbGFzc05hbWUpIHtcbiAgICAgICAgY24gKz0gXCIgXCIgKyBwcm9wcy5jbGFzc05hbWU7XG4gICAgfVxuICAgIHJldHVybiBjbiAmJiBjbi50cmltKCk7XG59XG5leHBvcnRzLmNsYXNzTmFtZUZyb21WTm9kZSA9IGNsYXNzTmFtZUZyb21WTm9kZTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWNsYXNzTmFtZUZyb21WTm9kZS5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbmZ1bmN0aW9uIHNlbGVjdG9yUGFyc2VyKG5vZGUpIHtcbiAgICBpZiAoIW5vZGUuc2VsKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0YWdOYW1lOiAnJyxcbiAgICAgICAgICAgIGlkOiAnJyxcbiAgICAgICAgICAgIGNsYXNzTmFtZTogJycsXG4gICAgICAgIH07XG4gICAgfVxuICAgIHZhciBzZWwgPSBub2RlLnNlbDtcbiAgICB2YXIgaGFzaElkeCA9IHNlbC5pbmRleE9mKCcjJyk7XG4gICAgdmFyIGRvdElkeCA9IHNlbC5pbmRleE9mKCcuJywgaGFzaElkeCk7XG4gICAgdmFyIGhhc2ggPSBoYXNoSWR4ID4gMCA/IGhhc2hJZHggOiBzZWwubGVuZ3RoO1xuICAgIHZhciBkb3QgPSBkb3RJZHggPiAwID8gZG90SWR4IDogc2VsLmxlbmd0aDtcbiAgICB2YXIgdGFnTmFtZSA9IGhhc2hJZHggIT09IC0xIHx8IGRvdElkeCAhPT0gLTEgP1xuICAgICAgICBzZWwuc2xpY2UoMCwgTWF0aC5taW4oaGFzaCwgZG90KSkgOlxuICAgICAgICBzZWw7XG4gICAgdmFyIGlkID0gaGFzaCA8IGRvdCA/IHNlbC5zbGljZShoYXNoICsgMSwgZG90KSA6IHZvaWQgMDtcbiAgICB2YXIgY2xhc3NOYW1lID0gZG90SWR4ID4gMCA/IHNlbC5zbGljZShkb3QgKyAxKS5yZXBsYWNlKC9cXC4vZywgJyAnKSA6IHZvaWQgMDtcbiAgICByZXR1cm4ge1xuICAgICAgICB0YWdOYW1lOiB0YWdOYW1lLFxuICAgICAgICBpZDogaWQsXG4gICAgICAgIGNsYXNzTmFtZTogY2xhc3NOYW1lLFxuICAgIH07XG59XG5leHBvcnRzLnNlbGVjdG9yUGFyc2VyID0gc2VsZWN0b3JQYXJzZXI7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1zZWxlY3RvclBhcnNlci5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB1dGlsc18xID0gcmVxdWlyZShcIi4vdXRpbHNcIik7XG52YXIgcmVtb3ZlRWxlbWVudCA9IGZ1bmN0aW9uIChzdHlsZUVsZW1lbnRTZWxlY3Rvcikge1xuICAgIHZhciBwcmV2aW91c1N0eWxlVGFyZ2V0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihzdHlsZUVsZW1lbnRTZWxlY3Rvcik7XG4gICAgaWYgKHByZXZpb3VzU3R5bGVUYXJnZXQpIHtcbiAgICAgICAgcHJldmlvdXNTdHlsZVRhcmdldC5yZW1vdmUoKTtcbiAgICB9XG59O1xudmFyIG1ha2VEb21VcGRhdGVyID0gZnVuY3Rpb24gKHN0eWxlRWxlbWVudFNlbGVjdG9yKSB7XG4gICAgaWYgKHN0eWxlRWxlbWVudFNlbGVjdG9yID09PSB2b2lkIDApIHsgc3R5bGVFbGVtZW50U2VsZWN0b3IgPSB1bmRlZmluZWQ7IH1cbiAgICByZXR1cm4gZnVuY3Rpb24gKG9sZE5vZGUsIG5ld05vZGUpIHtcbiAgICAgICAgdXRpbHNfMS51cGRhdGVWTm9kZShuZXdOb2RlKTtcbiAgICAgICAgaWYgKHR5cGVvZiBzdHlsZUVsZW1lbnRTZWxlY3RvciAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHJlbW92ZUVsZW1lbnQoc3R5bGVFbGVtZW50U2VsZWN0b3IpO1xuICAgICAgICB9XG4gICAgfTtcbn07XG5leHBvcnRzLm1ha2VNb2R1bGUgPSBmdW5jdGlvbiAoc3R5bGVFbGVtZW50U2VsZWN0b3IpIHtcbiAgICBpZiAoc3R5bGVFbGVtZW50U2VsZWN0b3IgPT09IHZvaWQgMCkgeyBzdHlsZUVsZW1lbnRTZWxlY3RvciA9IHVuZGVmaW5lZDsgfVxuICAgIC8vIFNlcnZlcnNpZGUgc3R5bGVzIGFyZSBvbmx5IHJlbW92ZWQgdGhlIGZpcnN0IHRpbWUgdXBkYXRlRE9NIGlzIGNhbGxlZFxuICAgIHZhciBkb21VcGRhdGVyID0gdXRpbHNfMS5hbHRlcm5hdGVGaXJzdEludm9jYXRpb24oZnVuY3Rpb24gKCkgeyByZXR1cm4gbWFrZURvbVVwZGF0ZXIoc3R5bGVFbGVtZW50U2VsZWN0b3IpOyB9LCBmdW5jdGlvbiAoKSB7IHJldHVybiBtYWtlRG9tVXBkYXRlcigpOyB9KTtcbiAgICB2YXIgdXBkYXRlRE9NID0gZnVuY3Rpb24gKG9sZE5vZGUsIG5ld05vZGUpIHsgcmV0dXJuIGRvbVVwZGF0ZXIubmV4dCgpLnZhbHVlKG9sZE5vZGUsIG5ld05vZGUpOyB9O1xuICAgIHJldHVybiB7XG4gICAgICAgIGNyZWF0ZTogdXBkYXRlRE9NLFxuICAgICAgICB1cGRhdGU6IHVwZGF0ZURPTVxuICAgIH07XG59O1xuZXhwb3J0cy5kZWZhdWx0ID0gZXhwb3J0cy5tYWtlTW9kdWxlKCk7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB0eXBlc3R5bGVfMSA9IHJlcXVpcmUoXCJ0eXBlc3R5bGVcIik7XG52YXIgdXRpbHNfMSA9IHJlcXVpcmUoXCIuL3V0aWxzXCIpO1xuZXhwb3J0cy5zZXJ2ZXJTaWRlQ3NzTW9kdWxlID0gZnVuY3Rpb24gKG5vZGUsIGF0dHJpYnV0ZXMpIHtcbiAgICByZXR1cm4gdXRpbHNfMS51cGRhdGVWTm9kZShub2RlKTtcbn07XG5leHBvcnRzLmNvbGxlY3RTdHlsZXMgPSBmdW5jdGlvbiAobm9kZSkge1xuICAgIHZhciBpbnN0YW5jZSA9IHR5cGVzdHlsZV8xLmNyZWF0ZVR5cGVTdHlsZSgpO1xuICAgIGV4cG9ydHMudHJhdmVyc2VWTm9kZShub2RlLCBpbnN0YW5jZSk7XG4gICAgcmV0dXJuIGluc3RhbmNlLmdldFN0eWxlcygpO1xufTtcbmV4cG9ydHMudHJhdmVyc2VWTm9kZSA9IGZ1bmN0aW9uIChub2RlLCBpbnN0YW5jZSkge1xuICAgIHZhciBkYXRhID0gbm9kZS5kYXRhO1xuICAgIGlmIChkYXRhLmNzcykge1xuICAgICAgICBpbnN0YW5jZS5zdHlsZShkYXRhLmNzcyk7XG4gICAgfVxuICAgIGlmIChub2RlLmNoaWxkcmVuKSB7XG4gICAgICAgIG5vZGUuY2hpbGRyZW4uZm9yRWFjaChmdW5jdGlvbiAoY2hpbGQpIHsgcmV0dXJuIGV4cG9ydHMudHJhdmVyc2VWTm9kZShjaGlsZCwgaW5zdGFuY2UpOyB9KTtcbiAgICB9XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5mdW5jdGlvbiBfX2V4cG9ydChtKSB7XG4gICAgZm9yICh2YXIgcCBpbiBtKSBpZiAoIWV4cG9ydHMuaGFzT3duUHJvcGVydHkocCkpIGV4cG9ydHNbcF0gPSBtW3BdO1xufVxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIGNsaWVudF8xID0gcmVxdWlyZShcIi4vY2xpZW50XCIpO1xuX19leHBvcnQocmVxdWlyZShcIi4vc2VydmVyXCIpKTtcbmV4cG9ydHMubWFrZUNsaWVudFNpZGVDc3NNb2R1bGUgPSBjbGllbnRfMS5tYWtlTW9kdWxlO1xuZXhwb3J0cy5kZWZhdWx0ID0gY2xpZW50XzEuZGVmYXVsdDtcbiIsIlwidXNlIHN0cmljdFwiO1xudmFyIF9fZ2VuZXJhdG9yID0gKHRoaXMgJiYgdGhpcy5fX2dlbmVyYXRvcikgfHwgZnVuY3Rpb24gKHRoaXNBcmcsIGJvZHkpIHtcbiAgICB2YXIgXyA9IHsgbGFiZWw6IDAsIHNlbnQ6IGZ1bmN0aW9uKCkgeyBpZiAodFswXSAmIDEpIHRocm93IHRbMV07IHJldHVybiB0WzFdOyB9LCB0cnlzOiBbXSwgb3BzOiBbXSB9LCBmLCB5LCB0LCBnO1xuICAgIHJldHVybiBnID0geyBuZXh0OiB2ZXJiKDApLCBcInRocm93XCI6IHZlcmIoMSksIFwicmV0dXJuXCI6IHZlcmIoMikgfSwgdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIChnW1N5bWJvbC5pdGVyYXRvcl0gPSBmdW5jdGlvbigpIHsgcmV0dXJuIHRoaXM7IH0pLCBnO1xuICAgIGZ1bmN0aW9uIHZlcmIobikgeyByZXR1cm4gZnVuY3Rpb24gKHYpIHsgcmV0dXJuIHN0ZXAoW24sIHZdKTsgfTsgfVxuICAgIGZ1bmN0aW9uIHN0ZXAob3ApIHtcbiAgICAgICAgaWYgKGYpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJHZW5lcmF0b3IgaXMgYWxyZWFkeSBleGVjdXRpbmcuXCIpO1xuICAgICAgICB3aGlsZSAoXykgdHJ5IHtcbiAgICAgICAgICAgIGlmIChmID0gMSwgeSAmJiAodCA9IHlbb3BbMF0gJiAyID8gXCJyZXR1cm5cIiA6IG9wWzBdID8gXCJ0aHJvd1wiIDogXCJuZXh0XCJdKSAmJiAhKHQgPSB0LmNhbGwoeSwgb3BbMV0pKS5kb25lKSByZXR1cm4gdDtcbiAgICAgICAgICAgIGlmICh5ID0gMCwgdCkgb3AgPSBbMCwgdC52YWx1ZV07XG4gICAgICAgICAgICBzd2l0Y2ggKG9wWzBdKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAwOiBjYXNlIDE6IHQgPSBvcDsgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSA0OiBfLmxhYmVsKys7IHJldHVybiB7IHZhbHVlOiBvcFsxXSwgZG9uZTogZmFsc2UgfTtcbiAgICAgICAgICAgICAgICBjYXNlIDU6IF8ubGFiZWwrKzsgeSA9IG9wWzFdOyBvcCA9IFswXTsgY29udGludWU7XG4gICAgICAgICAgICAgICAgY2FzZSA3OiBvcCA9IF8ub3BzLnBvcCgpOyBfLnRyeXMucG9wKCk7IGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgIGlmICghKHQgPSBfLnRyeXMsIHQgPSB0Lmxlbmd0aCA+IDAgJiYgdFt0Lmxlbmd0aCAtIDFdKSAmJiAob3BbMF0gPT09IDYgfHwgb3BbMF0gPT09IDIpKSB7IF8gPSAwOyBjb250aW51ZTsgfVxuICAgICAgICAgICAgICAgICAgICBpZiAob3BbMF0gPT09IDMgJiYgKCF0IHx8IChvcFsxXSA+IHRbMF0gJiYgb3BbMV0gPCB0WzNdKSkpIHsgXy5sYWJlbCA9IG9wWzFdOyBicmVhazsgfVxuICAgICAgICAgICAgICAgICAgICBpZiAob3BbMF0gPT09IDYgJiYgXy5sYWJlbCA8IHRbMV0pIHsgXy5sYWJlbCA9IHRbMV07IHQgPSBvcDsgYnJlYWs7IH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHQgJiYgXy5sYWJlbCA8IHRbMl0pIHsgXy5sYWJlbCA9IHRbMl07IF8ub3BzLnB1c2gob3ApOyBicmVhazsgfVxuICAgICAgICAgICAgICAgICAgICBpZiAodFsyXSkgXy5vcHMucG9wKCk7XG4gICAgICAgICAgICAgICAgICAgIF8udHJ5cy5wb3AoKTsgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBvcCA9IGJvZHkuY2FsbCh0aGlzQXJnLCBfKTtcbiAgICAgICAgfSBjYXRjaCAoZSkgeyBvcCA9IFs2LCBlXTsgeSA9IDA7IH0gZmluYWxseSB7IGYgPSB0ID0gMDsgfVxuICAgICAgICBpZiAob3BbMF0gJiA1KSB0aHJvdyBvcFsxXTsgcmV0dXJuIHsgdmFsdWU6IG9wWzBdID8gb3BbMV0gOiB2b2lkIDAsIGRvbmU6IHRydWUgfTtcbiAgICB9XG59O1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHR5cGVzdHlsZV8xID0gcmVxdWlyZShcInR5cGVzdHlsZVwiKTtcbmV4cG9ydHMudXBkYXRlVk5vZGUgPSBmdW5jdGlvbiAodm5vZGUpIHtcbiAgICB2YXIgZGF0YSA9IHZub2RlLmRhdGE7XG4gICAgaWYgKGRhdGEuY3NzKSB7XG4gICAgICAgIGRhdGEuY2xhc3MgPSBkYXRhLmNsYXNzIHx8IHt9O1xuICAgICAgICBkYXRhLmNsYXNzW3R5cGVzdHlsZV8xLnN0eWxlKGRhdGEuY3NzKV0gPSB0cnVlO1xuICAgIH1cbn07XG5mdW5jdGlvbiBhbHRlcm5hdGVGaXJzdEludm9jYXRpb24oZmlyc3QsIHN1YnNlcXVlbnQpIHtcbiAgICByZXR1cm4gX19nZW5lcmF0b3IodGhpcywgZnVuY3Rpb24gKF9hKSB7XG4gICAgICAgIHN3aXRjaCAoX2EubGFiZWwpIHtcbiAgICAgICAgICAgIGNhc2UgMDogcmV0dXJuIFs0IC8qeWllbGQqLywgZmlyc3QoKV07XG4gICAgICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgICAgICAgX2Euc2VudCgpO1xuICAgICAgICAgICAgICAgIF9hLmxhYmVsID0gMjtcbiAgICAgICAgICAgIGNhc2UgMjpcbiAgICAgICAgICAgICAgICBpZiAoIXRydWUpIHJldHVybiBbMyAvKmJyZWFrKi8sIDRdO1xuICAgICAgICAgICAgICAgIHJldHVybiBbNCAvKnlpZWxkKi8sIHN1YnNlcXVlbnQoKV07XG4gICAgICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgICAgICAgX2Euc2VudCgpO1xuICAgICAgICAgICAgICAgIHJldHVybiBbMyAvKmJyZWFrKi8sIDJdO1xuICAgICAgICAgICAgY2FzZSA0OiByZXR1cm4gWzIgLypyZXR1cm4qL107XG4gICAgICAgIH1cbiAgICB9KTtcbn1cbmV4cG9ydHMuYWx0ZXJuYXRlRmlyc3RJbnZvY2F0aW9uID0gYWx0ZXJuYXRlRmlyc3RJbnZvY2F0aW9uO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgdm5vZGVfMSA9IHJlcXVpcmUoXCIuL3Zub2RlXCIpO1xudmFyIGlzID0gcmVxdWlyZShcIi4vaXNcIik7XG5mdW5jdGlvbiBhZGROUyhkYXRhLCBjaGlsZHJlbiwgc2VsKSB7XG4gICAgZGF0YS5ucyA9ICdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Zyc7XG4gICAgaWYgKHNlbCAhPT0gJ2ZvcmVpZ25PYmplY3QnICYmIGNoaWxkcmVuICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgdmFyIGNoaWxkRGF0YSA9IGNoaWxkcmVuW2ldLmRhdGE7XG4gICAgICAgICAgICBpZiAoY2hpbGREYXRhICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBhZGROUyhjaGlsZERhdGEsIGNoaWxkcmVuW2ldLmNoaWxkcmVuLCBjaGlsZHJlbltpXS5zZWwpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuZnVuY3Rpb24gaChzZWwsIGIsIGMpIHtcbiAgICB2YXIgZGF0YSA9IHt9LCBjaGlsZHJlbiwgdGV4dCwgaTtcbiAgICBpZiAoYyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGRhdGEgPSBiO1xuICAgICAgICBpZiAoaXMuYXJyYXkoYykpIHtcbiAgICAgICAgICAgIGNoaWxkcmVuID0gYztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChpcy5wcmltaXRpdmUoYykpIHtcbiAgICAgICAgICAgIHRleHQgPSBjO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGMgJiYgYy5zZWwpIHtcbiAgICAgICAgICAgIGNoaWxkcmVuID0gW2NdO1xuICAgICAgICB9XG4gICAgfVxuICAgIGVsc2UgaWYgKGIgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBpZiAoaXMuYXJyYXkoYikpIHtcbiAgICAgICAgICAgIGNoaWxkcmVuID0gYjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChpcy5wcmltaXRpdmUoYikpIHtcbiAgICAgICAgICAgIHRleHQgPSBiO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGIgJiYgYi5zZWwpIHtcbiAgICAgICAgICAgIGNoaWxkcmVuID0gW2JdO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZGF0YSA9IGI7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKGlzLmFycmF5KGNoaWxkcmVuKSkge1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIGlmIChpcy5wcmltaXRpdmUoY2hpbGRyZW5baV0pKVxuICAgICAgICAgICAgICAgIGNoaWxkcmVuW2ldID0gdm5vZGVfMS52bm9kZSh1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCBjaGlsZHJlbltpXSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKHNlbFswXSA9PT0gJ3MnICYmIHNlbFsxXSA9PT0gJ3YnICYmIHNlbFsyXSA9PT0gJ2cnICYmXG4gICAgICAgIChzZWwubGVuZ3RoID09PSAzIHx8IHNlbFszXSA9PT0gJy4nIHx8IHNlbFszXSA9PT0gJyMnKSkge1xuICAgICAgICBhZGROUyhkYXRhLCBjaGlsZHJlbiwgc2VsKTtcbiAgICB9XG4gICAgcmV0dXJuIHZub2RlXzEudm5vZGUoc2VsLCBkYXRhLCBjaGlsZHJlbiwgdGV4dCwgdW5kZWZpbmVkKTtcbn1cbmV4cG9ydHMuaCA9IGg7XG47XG5leHBvcnRzLmRlZmF1bHQgPSBoO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmZ1bmN0aW9uIGNyZWF0ZUVsZW1lbnQodGFnTmFtZSkge1xuICAgIHJldHVybiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHRhZ05hbWUpO1xufVxuZnVuY3Rpb24gY3JlYXRlRWxlbWVudE5TKG5hbWVzcGFjZVVSSSwgcXVhbGlmaWVkTmFtZSkge1xuICAgIHJldHVybiBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMobmFtZXNwYWNlVVJJLCBxdWFsaWZpZWROYW1lKTtcbn1cbmZ1bmN0aW9uIGNyZWF0ZVRleHROb2RlKHRleHQpIHtcbiAgICByZXR1cm4gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUodGV4dCk7XG59XG5mdW5jdGlvbiBjcmVhdGVDb21tZW50KHRleHQpIHtcbiAgICByZXR1cm4gZG9jdW1lbnQuY3JlYXRlQ29tbWVudCh0ZXh0KTtcbn1cbmZ1bmN0aW9uIGluc2VydEJlZm9yZShwYXJlbnROb2RlLCBuZXdOb2RlLCByZWZlcmVuY2VOb2RlKSB7XG4gICAgcGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUobmV3Tm9kZSwgcmVmZXJlbmNlTm9kZSk7XG59XG5mdW5jdGlvbiByZW1vdmVDaGlsZChub2RlLCBjaGlsZCkge1xuICAgIG5vZGUucmVtb3ZlQ2hpbGQoY2hpbGQpO1xufVxuZnVuY3Rpb24gYXBwZW5kQ2hpbGQobm9kZSwgY2hpbGQpIHtcbiAgICBub2RlLmFwcGVuZENoaWxkKGNoaWxkKTtcbn1cbmZ1bmN0aW9uIHBhcmVudE5vZGUobm9kZSkge1xuICAgIHJldHVybiBub2RlLnBhcmVudE5vZGU7XG59XG5mdW5jdGlvbiBuZXh0U2libGluZyhub2RlKSB7XG4gICAgcmV0dXJuIG5vZGUubmV4dFNpYmxpbmc7XG59XG5mdW5jdGlvbiB0YWdOYW1lKGVsbSkge1xuICAgIHJldHVybiBlbG0udGFnTmFtZTtcbn1cbmZ1bmN0aW9uIHNldFRleHRDb250ZW50KG5vZGUsIHRleHQpIHtcbiAgICBub2RlLnRleHRDb250ZW50ID0gdGV4dDtcbn1cbmZ1bmN0aW9uIGdldFRleHRDb250ZW50KG5vZGUpIHtcbiAgICByZXR1cm4gbm9kZS50ZXh0Q29udGVudDtcbn1cbmZ1bmN0aW9uIGlzRWxlbWVudChub2RlKSB7XG4gICAgcmV0dXJuIG5vZGUubm9kZVR5cGUgPT09IDE7XG59XG5mdW5jdGlvbiBpc1RleHQobm9kZSkge1xuICAgIHJldHVybiBub2RlLm5vZGVUeXBlID09PSAzO1xufVxuZnVuY3Rpb24gaXNDb21tZW50KG5vZGUpIHtcbiAgICByZXR1cm4gbm9kZS5ub2RlVHlwZSA9PT0gODtcbn1cbmV4cG9ydHMuaHRtbERvbUFwaSA9IHtcbiAgICBjcmVhdGVFbGVtZW50OiBjcmVhdGVFbGVtZW50LFxuICAgIGNyZWF0ZUVsZW1lbnROUzogY3JlYXRlRWxlbWVudE5TLFxuICAgIGNyZWF0ZVRleHROb2RlOiBjcmVhdGVUZXh0Tm9kZSxcbiAgICBjcmVhdGVDb21tZW50OiBjcmVhdGVDb21tZW50LFxuICAgIGluc2VydEJlZm9yZTogaW5zZXJ0QmVmb3JlLFxuICAgIHJlbW92ZUNoaWxkOiByZW1vdmVDaGlsZCxcbiAgICBhcHBlbmRDaGlsZDogYXBwZW5kQ2hpbGQsXG4gICAgcGFyZW50Tm9kZTogcGFyZW50Tm9kZSxcbiAgICBuZXh0U2libGluZzogbmV4dFNpYmxpbmcsXG4gICAgdGFnTmFtZTogdGFnTmFtZSxcbiAgICBzZXRUZXh0Q29udGVudDogc2V0VGV4dENvbnRlbnQsXG4gICAgZ2V0VGV4dENvbnRlbnQ6IGdldFRleHRDb250ZW50LFxuICAgIGlzRWxlbWVudDogaXNFbGVtZW50LFxuICAgIGlzVGV4dDogaXNUZXh0LFxuICAgIGlzQ29tbWVudDogaXNDb21tZW50LFxufTtcbmV4cG9ydHMuZGVmYXVsdCA9IGV4cG9ydHMuaHRtbERvbUFwaTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWh0bWxkb21hcGkuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLmFycmF5ID0gQXJyYXkuaXNBcnJheTtcbmZ1bmN0aW9uIHByaW1pdGl2ZShzKSB7XG4gICAgcmV0dXJuIHR5cGVvZiBzID09PSAnc3RyaW5nJyB8fCB0eXBlb2YgcyA9PT0gJ251bWJlcic7XG59XG5leHBvcnRzLnByaW1pdGl2ZSA9IHByaW1pdGl2ZTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWlzLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHhsaW5rTlMgPSAnaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayc7XG52YXIgeG1sTlMgPSAnaHR0cDovL3d3dy53My5vcmcvWE1MLzE5OTgvbmFtZXNwYWNlJztcbnZhciBjb2xvbkNoYXIgPSA1ODtcbnZhciB4Q2hhciA9IDEyMDtcbmZ1bmN0aW9uIHVwZGF0ZUF0dHJzKG9sZFZub2RlLCB2bm9kZSkge1xuICAgIHZhciBrZXksIGVsbSA9IHZub2RlLmVsbSwgb2xkQXR0cnMgPSBvbGRWbm9kZS5kYXRhLmF0dHJzLCBhdHRycyA9IHZub2RlLmRhdGEuYXR0cnM7XG4gICAgaWYgKCFvbGRBdHRycyAmJiAhYXR0cnMpXG4gICAgICAgIHJldHVybjtcbiAgICBpZiAob2xkQXR0cnMgPT09IGF0dHJzKVxuICAgICAgICByZXR1cm47XG4gICAgb2xkQXR0cnMgPSBvbGRBdHRycyB8fCB7fTtcbiAgICBhdHRycyA9IGF0dHJzIHx8IHt9O1xuICAgIC8vIHVwZGF0ZSBtb2RpZmllZCBhdHRyaWJ1dGVzLCBhZGQgbmV3IGF0dHJpYnV0ZXNcbiAgICBmb3IgKGtleSBpbiBhdHRycykge1xuICAgICAgICB2YXIgY3VyID0gYXR0cnNba2V5XTtcbiAgICAgICAgdmFyIG9sZCA9IG9sZEF0dHJzW2tleV07XG4gICAgICAgIGlmIChvbGQgIT09IGN1cikge1xuICAgICAgICAgICAgaWYgKGN1ciA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgIGVsbS5zZXRBdHRyaWJ1dGUoa2V5LCBcIlwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGN1ciA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICBlbG0ucmVtb3ZlQXR0cmlidXRlKGtleSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoa2V5LmNoYXJDb2RlQXQoMCkgIT09IHhDaGFyKSB7XG4gICAgICAgICAgICAgICAgICAgIGVsbS5zZXRBdHRyaWJ1dGUoa2V5LCBjdXIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChrZXkuY2hhckNvZGVBdCgzKSA9PT0gY29sb25DaGFyKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEFzc3VtZSB4bWwgbmFtZXNwYWNlXG4gICAgICAgICAgICAgICAgICAgIGVsbS5zZXRBdHRyaWJ1dGVOUyh4bWxOUywga2V5LCBjdXIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChrZXkuY2hhckNvZGVBdCg1KSA9PT0gY29sb25DaGFyKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEFzc3VtZSB4bGluayBuYW1lc3BhY2VcbiAgICAgICAgICAgICAgICAgICAgZWxtLnNldEF0dHJpYnV0ZU5TKHhsaW5rTlMsIGtleSwgY3VyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGVsbS5zZXRBdHRyaWJ1dGUoa2V5LCBjdXIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICAvLyByZW1vdmUgcmVtb3ZlZCBhdHRyaWJ1dGVzXG4gICAgLy8gdXNlIGBpbmAgb3BlcmF0b3Igc2luY2UgdGhlIHByZXZpb3VzIGBmb3JgIGl0ZXJhdGlvbiB1c2VzIGl0ICguaS5lLiBhZGQgZXZlbiBhdHRyaWJ1dGVzIHdpdGggdW5kZWZpbmVkIHZhbHVlKVxuICAgIC8vIHRoZSBvdGhlciBvcHRpb24gaXMgdG8gcmVtb3ZlIGFsbCBhdHRyaWJ1dGVzIHdpdGggdmFsdWUgPT0gdW5kZWZpbmVkXG4gICAgZm9yIChrZXkgaW4gb2xkQXR0cnMpIHtcbiAgICAgICAgaWYgKCEoa2V5IGluIGF0dHJzKSkge1xuICAgICAgICAgICAgZWxtLnJlbW92ZUF0dHJpYnV0ZShrZXkpO1xuICAgICAgICB9XG4gICAgfVxufVxuZXhwb3J0cy5hdHRyaWJ1dGVzTW9kdWxlID0geyBjcmVhdGU6IHVwZGF0ZUF0dHJzLCB1cGRhdGU6IHVwZGF0ZUF0dHJzIH07XG5leHBvcnRzLmRlZmF1bHQgPSBleHBvcnRzLmF0dHJpYnV0ZXNNb2R1bGU7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1hdHRyaWJ1dGVzLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZnVuY3Rpb24gdXBkYXRlQ2xhc3Mob2xkVm5vZGUsIHZub2RlKSB7XG4gICAgdmFyIGN1ciwgbmFtZSwgZWxtID0gdm5vZGUuZWxtLCBvbGRDbGFzcyA9IG9sZFZub2RlLmRhdGEuY2xhc3MsIGtsYXNzID0gdm5vZGUuZGF0YS5jbGFzcztcbiAgICBpZiAoIW9sZENsYXNzICYmICFrbGFzcylcbiAgICAgICAgcmV0dXJuO1xuICAgIGlmIChvbGRDbGFzcyA9PT0ga2xhc3MpXG4gICAgICAgIHJldHVybjtcbiAgICBvbGRDbGFzcyA9IG9sZENsYXNzIHx8IHt9O1xuICAgIGtsYXNzID0ga2xhc3MgfHwge307XG4gICAgZm9yIChuYW1lIGluIG9sZENsYXNzKSB7XG4gICAgICAgIGlmICgha2xhc3NbbmFtZV0pIHtcbiAgICAgICAgICAgIGVsbS5jbGFzc0xpc3QucmVtb3ZlKG5hbWUpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGZvciAobmFtZSBpbiBrbGFzcykge1xuICAgICAgICBjdXIgPSBrbGFzc1tuYW1lXTtcbiAgICAgICAgaWYgKGN1ciAhPT0gb2xkQ2xhc3NbbmFtZV0pIHtcbiAgICAgICAgICAgIGVsbS5jbGFzc0xpc3RbY3VyID8gJ2FkZCcgOiAncmVtb3ZlJ10obmFtZSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5leHBvcnRzLmNsYXNzTW9kdWxlID0geyBjcmVhdGU6IHVwZGF0ZUNsYXNzLCB1cGRhdGU6IHVwZGF0ZUNsYXNzIH07XG5leHBvcnRzLmRlZmF1bHQgPSBleHBvcnRzLmNsYXNzTW9kdWxlO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9Y2xhc3MuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgQ0FQU19SRUdFWCA9IC9bQS1aXS9nO1xuZnVuY3Rpb24gdXBkYXRlRGF0YXNldChvbGRWbm9kZSwgdm5vZGUpIHtcbiAgICB2YXIgZWxtID0gdm5vZGUuZWxtLCBvbGREYXRhc2V0ID0gb2xkVm5vZGUuZGF0YS5kYXRhc2V0LCBkYXRhc2V0ID0gdm5vZGUuZGF0YS5kYXRhc2V0LCBrZXk7XG4gICAgaWYgKCFvbGREYXRhc2V0ICYmICFkYXRhc2V0KVxuICAgICAgICByZXR1cm47XG4gICAgaWYgKG9sZERhdGFzZXQgPT09IGRhdGFzZXQpXG4gICAgICAgIHJldHVybjtcbiAgICBvbGREYXRhc2V0ID0gb2xkRGF0YXNldCB8fCB7fTtcbiAgICBkYXRhc2V0ID0gZGF0YXNldCB8fCB7fTtcbiAgICB2YXIgZCA9IGVsbS5kYXRhc2V0O1xuICAgIGZvciAoa2V5IGluIG9sZERhdGFzZXQpIHtcbiAgICAgICAgaWYgKCFkYXRhc2V0W2tleV0pIHtcbiAgICAgICAgICAgIGlmIChkKSB7XG4gICAgICAgICAgICAgICAgaWYgKGtleSBpbiBkKSB7XG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBkW2tleV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgZWxtLnJlbW92ZUF0dHJpYnV0ZSgnZGF0YS0nICsga2V5LnJlcGxhY2UoQ0FQU19SRUdFWCwgJy0kJicpLnRvTG93ZXJDYXNlKCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGZvciAoa2V5IGluIGRhdGFzZXQpIHtcbiAgICAgICAgaWYgKG9sZERhdGFzZXRba2V5XSAhPT0gZGF0YXNldFtrZXldKSB7XG4gICAgICAgICAgICBpZiAoZCkge1xuICAgICAgICAgICAgICAgIGRba2V5XSA9IGRhdGFzZXRba2V5XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGVsbS5zZXRBdHRyaWJ1dGUoJ2RhdGEtJyArIGtleS5yZXBsYWNlKENBUFNfUkVHRVgsICctJCYnKS50b0xvd2VyQ2FzZSgpLCBkYXRhc2V0W2tleV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuZXhwb3J0cy5kYXRhc2V0TW9kdWxlID0geyBjcmVhdGU6IHVwZGF0ZURhdGFzZXQsIHVwZGF0ZTogdXBkYXRlRGF0YXNldCB9O1xuZXhwb3J0cy5kZWZhdWx0ID0gZXhwb3J0cy5kYXRhc2V0TW9kdWxlO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YXNldC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmZ1bmN0aW9uIHVwZGF0ZVByb3BzKG9sZFZub2RlLCB2bm9kZSkge1xuICAgIHZhciBrZXksIGN1ciwgb2xkLCBlbG0gPSB2bm9kZS5lbG0sIG9sZFByb3BzID0gb2xkVm5vZGUuZGF0YS5wcm9wcywgcHJvcHMgPSB2bm9kZS5kYXRhLnByb3BzO1xuICAgIGlmICghb2xkUHJvcHMgJiYgIXByb3BzKVxuICAgICAgICByZXR1cm47XG4gICAgaWYgKG9sZFByb3BzID09PSBwcm9wcylcbiAgICAgICAgcmV0dXJuO1xuICAgIG9sZFByb3BzID0gb2xkUHJvcHMgfHwge307XG4gICAgcHJvcHMgPSBwcm9wcyB8fCB7fTtcbiAgICBmb3IgKGtleSBpbiBvbGRQcm9wcykge1xuICAgICAgICBpZiAoIXByb3BzW2tleV0pIHtcbiAgICAgICAgICAgIGRlbGV0ZSBlbG1ba2V5XTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBmb3IgKGtleSBpbiBwcm9wcykge1xuICAgICAgICBjdXIgPSBwcm9wc1trZXldO1xuICAgICAgICBvbGQgPSBvbGRQcm9wc1trZXldO1xuICAgICAgICBpZiAob2xkICE9PSBjdXIgJiYgKGtleSAhPT0gJ3ZhbHVlJyB8fCBlbG1ba2V5XSAhPT0gY3VyKSkge1xuICAgICAgICAgICAgZWxtW2tleV0gPSBjdXI7XG4gICAgICAgIH1cbiAgICB9XG59XG5leHBvcnRzLnByb3BzTW9kdWxlID0geyBjcmVhdGU6IHVwZGF0ZVByb3BzLCB1cGRhdGU6IHVwZGF0ZVByb3BzIH07XG5leHBvcnRzLmRlZmF1bHQgPSBleHBvcnRzLnByb3BzTW9kdWxlO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9cHJvcHMuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgcmFmID0gKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUpIHx8IHNldFRpbWVvdXQ7XG52YXIgbmV4dEZyYW1lID0gZnVuY3Rpb24gKGZuKSB7IHJhZihmdW5jdGlvbiAoKSB7IHJhZihmbik7IH0pOyB9O1xuZnVuY3Rpb24gc2V0TmV4dEZyYW1lKG9iaiwgcHJvcCwgdmFsKSB7XG4gICAgbmV4dEZyYW1lKGZ1bmN0aW9uICgpIHsgb2JqW3Byb3BdID0gdmFsOyB9KTtcbn1cbmZ1bmN0aW9uIHVwZGF0ZVN0eWxlKG9sZFZub2RlLCB2bm9kZSkge1xuICAgIHZhciBjdXIsIG5hbWUsIGVsbSA9IHZub2RlLmVsbSwgb2xkU3R5bGUgPSBvbGRWbm9kZS5kYXRhLnN0eWxlLCBzdHlsZSA9IHZub2RlLmRhdGEuc3R5bGU7XG4gICAgaWYgKCFvbGRTdHlsZSAmJiAhc3R5bGUpXG4gICAgICAgIHJldHVybjtcbiAgICBpZiAob2xkU3R5bGUgPT09IHN0eWxlKVxuICAgICAgICByZXR1cm47XG4gICAgb2xkU3R5bGUgPSBvbGRTdHlsZSB8fCB7fTtcbiAgICBzdHlsZSA9IHN0eWxlIHx8IHt9O1xuICAgIHZhciBvbGRIYXNEZWwgPSAnZGVsYXllZCcgaW4gb2xkU3R5bGU7XG4gICAgZm9yIChuYW1lIGluIG9sZFN0eWxlKSB7XG4gICAgICAgIGlmICghc3R5bGVbbmFtZV0pIHtcbiAgICAgICAgICAgIGlmIChuYW1lWzBdID09PSAnLScgJiYgbmFtZVsxXSA9PT0gJy0nKSB7XG4gICAgICAgICAgICAgICAgZWxtLnN0eWxlLnJlbW92ZVByb3BlcnR5KG5hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgZWxtLnN0eWxlW25hbWVdID0gJyc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgZm9yIChuYW1lIGluIHN0eWxlKSB7XG4gICAgICAgIGN1ciA9IHN0eWxlW25hbWVdO1xuICAgICAgICBpZiAobmFtZSA9PT0gJ2RlbGF5ZWQnICYmIHN0eWxlLmRlbGF5ZWQpIHtcbiAgICAgICAgICAgIGZvciAodmFyIG5hbWUyIGluIHN0eWxlLmRlbGF5ZWQpIHtcbiAgICAgICAgICAgICAgICBjdXIgPSBzdHlsZS5kZWxheWVkW25hbWUyXTtcbiAgICAgICAgICAgICAgICBpZiAoIW9sZEhhc0RlbCB8fCBjdXIgIT09IG9sZFN0eWxlLmRlbGF5ZWRbbmFtZTJdKSB7XG4gICAgICAgICAgICAgICAgICAgIHNldE5leHRGcmFtZShlbG0uc3R5bGUsIG5hbWUyLCBjdXIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChuYW1lICE9PSAncmVtb3ZlJyAmJiBjdXIgIT09IG9sZFN0eWxlW25hbWVdKSB7XG4gICAgICAgICAgICBpZiAobmFtZVswXSA9PT0gJy0nICYmIG5hbWVbMV0gPT09ICctJykge1xuICAgICAgICAgICAgICAgIGVsbS5zdHlsZS5zZXRQcm9wZXJ0eShuYW1lLCBjdXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgZWxtLnN0eWxlW25hbWVdID0gY3VyO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuZnVuY3Rpb24gYXBwbHlEZXN0cm95U3R5bGUodm5vZGUpIHtcbiAgICB2YXIgc3R5bGUsIG5hbWUsIGVsbSA9IHZub2RlLmVsbSwgcyA9IHZub2RlLmRhdGEuc3R5bGU7XG4gICAgaWYgKCFzIHx8ICEoc3R5bGUgPSBzLmRlc3Ryb3kpKVxuICAgICAgICByZXR1cm47XG4gICAgZm9yIChuYW1lIGluIHN0eWxlKSB7XG4gICAgICAgIGVsbS5zdHlsZVtuYW1lXSA9IHN0eWxlW25hbWVdO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGFwcGx5UmVtb3ZlU3R5bGUodm5vZGUsIHJtKSB7XG4gICAgdmFyIHMgPSB2bm9kZS5kYXRhLnN0eWxlO1xuICAgIGlmICghcyB8fCAhcy5yZW1vdmUpIHtcbiAgICAgICAgcm0oKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgbmFtZSwgZWxtID0gdm5vZGUuZWxtLCBpID0gMCwgY29tcFN0eWxlLCBzdHlsZSA9IHMucmVtb3ZlLCBhbW91bnQgPSAwLCBhcHBsaWVkID0gW107XG4gICAgZm9yIChuYW1lIGluIHN0eWxlKSB7XG4gICAgICAgIGFwcGxpZWQucHVzaChuYW1lKTtcbiAgICAgICAgZWxtLnN0eWxlW25hbWVdID0gc3R5bGVbbmFtZV07XG4gICAgfVxuICAgIGNvbXBTdHlsZSA9IGdldENvbXB1dGVkU3R5bGUoZWxtKTtcbiAgICB2YXIgcHJvcHMgPSBjb21wU3R5bGVbJ3RyYW5zaXRpb24tcHJvcGVydHknXS5zcGxpdCgnLCAnKTtcbiAgICBmb3IgKDsgaSA8IHByb3BzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIGlmIChhcHBsaWVkLmluZGV4T2YocHJvcHNbaV0pICE9PSAtMSlcbiAgICAgICAgICAgIGFtb3VudCsrO1xuICAgIH1cbiAgICBlbG0uYWRkRXZlbnRMaXN0ZW5lcigndHJhbnNpdGlvbmVuZCcsIGZ1bmN0aW9uIChldikge1xuICAgICAgICBpZiAoZXYudGFyZ2V0ID09PSBlbG0pXG4gICAgICAgICAgICAtLWFtb3VudDtcbiAgICAgICAgaWYgKGFtb3VudCA9PT0gMClcbiAgICAgICAgICAgIHJtKCk7XG4gICAgfSk7XG59XG5leHBvcnRzLnN0eWxlTW9kdWxlID0ge1xuICAgIGNyZWF0ZTogdXBkYXRlU3R5bGUsXG4gICAgdXBkYXRlOiB1cGRhdGVTdHlsZSxcbiAgICBkZXN0cm95OiBhcHBseURlc3Ryb3lTdHlsZSxcbiAgICByZW1vdmU6IGFwcGx5UmVtb3ZlU3R5bGVcbn07XG5leHBvcnRzLmRlZmF1bHQgPSBleHBvcnRzLnN0eWxlTW9kdWxlO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9c3R5bGUuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgdm5vZGVfMSA9IHJlcXVpcmUoXCIuL3Zub2RlXCIpO1xudmFyIGlzID0gcmVxdWlyZShcIi4vaXNcIik7XG52YXIgaHRtbGRvbWFwaV8xID0gcmVxdWlyZShcIi4vaHRtbGRvbWFwaVwiKTtcbmZ1bmN0aW9uIGlzVW5kZWYocykgeyByZXR1cm4gcyA9PT0gdW5kZWZpbmVkOyB9XG5mdW5jdGlvbiBpc0RlZihzKSB7IHJldHVybiBzICE9PSB1bmRlZmluZWQ7IH1cbnZhciBlbXB0eU5vZGUgPSB2bm9kZV8xLmRlZmF1bHQoJycsIHt9LCBbXSwgdW5kZWZpbmVkLCB1bmRlZmluZWQpO1xuZnVuY3Rpb24gc2FtZVZub2RlKHZub2RlMSwgdm5vZGUyKSB7XG4gICAgcmV0dXJuIHZub2RlMS5rZXkgPT09IHZub2RlMi5rZXkgJiYgdm5vZGUxLnNlbCA9PT0gdm5vZGUyLnNlbDtcbn1cbmZ1bmN0aW9uIGlzVm5vZGUodm5vZGUpIHtcbiAgICByZXR1cm4gdm5vZGUuc2VsICE9PSB1bmRlZmluZWQ7XG59XG5mdW5jdGlvbiBjcmVhdGVLZXlUb09sZElkeChjaGlsZHJlbiwgYmVnaW5JZHgsIGVuZElkeCkge1xuICAgIHZhciBpLCBtYXAgPSB7fSwga2V5LCBjaDtcbiAgICBmb3IgKGkgPSBiZWdpbklkeDsgaSA8PSBlbmRJZHg7ICsraSkge1xuICAgICAgICBjaCA9IGNoaWxkcmVuW2ldO1xuICAgICAgICBpZiAoY2ggIT0gbnVsbCkge1xuICAgICAgICAgICAga2V5ID0gY2gua2V5O1xuICAgICAgICAgICAgaWYgKGtleSAhPT0gdW5kZWZpbmVkKVxuICAgICAgICAgICAgICAgIG1hcFtrZXldID0gaTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbWFwO1xufVxudmFyIGhvb2tzID0gWydjcmVhdGUnLCAndXBkYXRlJywgJ3JlbW92ZScsICdkZXN0cm95JywgJ3ByZScsICdwb3N0J107XG52YXIgaF8xID0gcmVxdWlyZShcIi4vaFwiKTtcbmV4cG9ydHMuaCA9IGhfMS5oO1xudmFyIHRodW5rXzEgPSByZXF1aXJlKFwiLi90aHVua1wiKTtcbmV4cG9ydHMudGh1bmsgPSB0aHVua18xLnRodW5rO1xuZnVuY3Rpb24gaW5pdChtb2R1bGVzLCBkb21BcGkpIHtcbiAgICB2YXIgaSwgaiwgY2JzID0ge307XG4gICAgdmFyIGFwaSA9IGRvbUFwaSAhPT0gdW5kZWZpbmVkID8gZG9tQXBpIDogaHRtbGRvbWFwaV8xLmRlZmF1bHQ7XG4gICAgZm9yIChpID0gMDsgaSA8IGhvb2tzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIGNic1tob29rc1tpXV0gPSBbXTtcbiAgICAgICAgZm9yIChqID0gMDsgaiA8IG1vZHVsZXMubGVuZ3RoOyArK2opIHtcbiAgICAgICAgICAgIHZhciBob29rID0gbW9kdWxlc1tqXVtob29rc1tpXV07XG4gICAgICAgICAgICBpZiAoaG9vayAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgY2JzW2hvb2tzW2ldXS5wdXNoKGhvb2spO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIGVtcHR5Tm9kZUF0KGVsbSkge1xuICAgICAgICB2YXIgaWQgPSBlbG0uaWQgPyAnIycgKyBlbG0uaWQgOiAnJztcbiAgICAgICAgdmFyIGMgPSBlbG0uY2xhc3NOYW1lID8gJy4nICsgZWxtLmNsYXNzTmFtZS5zcGxpdCgnICcpLmpvaW4oJy4nKSA6ICcnO1xuICAgICAgICByZXR1cm4gdm5vZGVfMS5kZWZhdWx0KGFwaS50YWdOYW1lKGVsbSkudG9Mb3dlckNhc2UoKSArIGlkICsgYywge30sIFtdLCB1bmRlZmluZWQsIGVsbSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGNyZWF0ZVJtQ2IoY2hpbGRFbG0sIGxpc3RlbmVycykge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gcm1DYigpIHtcbiAgICAgICAgICAgIGlmICgtLWxpc3RlbmVycyA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHZhciBwYXJlbnRfMSA9IGFwaS5wYXJlbnROb2RlKGNoaWxkRWxtKTtcbiAgICAgICAgICAgICAgICBhcGkucmVtb3ZlQ2hpbGQocGFyZW50XzEsIGNoaWxkRWxtKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG4gICAgZnVuY3Rpb24gY3JlYXRlRWxtKHZub2RlLCBpbnNlcnRlZFZub2RlUXVldWUpIHtcbiAgICAgICAgdmFyIGksIGRhdGEgPSB2bm9kZS5kYXRhO1xuICAgICAgICBpZiAoZGF0YSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBpZiAoaXNEZWYoaSA9IGRhdGEuaG9vaykgJiYgaXNEZWYoaSA9IGkuaW5pdCkpIHtcbiAgICAgICAgICAgICAgICBpKHZub2RlKTtcbiAgICAgICAgICAgICAgICBkYXRhID0gdm5vZGUuZGF0YTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB2YXIgY2hpbGRyZW4gPSB2bm9kZS5jaGlsZHJlbiwgc2VsID0gdm5vZGUuc2VsO1xuICAgICAgICBpZiAoc2VsID09PSAnIScpIHtcbiAgICAgICAgICAgIGlmIChpc1VuZGVmKHZub2RlLnRleHQpKSB7XG4gICAgICAgICAgICAgICAgdm5vZGUudGV4dCA9ICcnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdm5vZGUuZWxtID0gYXBpLmNyZWF0ZUNvbW1lbnQodm5vZGUudGV4dCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoc2VsICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIC8vIFBhcnNlIHNlbGVjdG9yXG4gICAgICAgICAgICB2YXIgaGFzaElkeCA9IHNlbC5pbmRleE9mKCcjJyk7XG4gICAgICAgICAgICB2YXIgZG90SWR4ID0gc2VsLmluZGV4T2YoJy4nLCBoYXNoSWR4KTtcbiAgICAgICAgICAgIHZhciBoYXNoID0gaGFzaElkeCA+IDAgPyBoYXNoSWR4IDogc2VsLmxlbmd0aDtcbiAgICAgICAgICAgIHZhciBkb3QgPSBkb3RJZHggPiAwID8gZG90SWR4IDogc2VsLmxlbmd0aDtcbiAgICAgICAgICAgIHZhciB0YWcgPSBoYXNoSWR4ICE9PSAtMSB8fCBkb3RJZHggIT09IC0xID8gc2VsLnNsaWNlKDAsIE1hdGgubWluKGhhc2gsIGRvdCkpIDogc2VsO1xuICAgICAgICAgICAgdmFyIGVsbSA9IHZub2RlLmVsbSA9IGlzRGVmKGRhdGEpICYmIGlzRGVmKGkgPSBkYXRhLm5zKSA/IGFwaS5jcmVhdGVFbGVtZW50TlMoaSwgdGFnKVxuICAgICAgICAgICAgICAgIDogYXBpLmNyZWF0ZUVsZW1lbnQodGFnKTtcbiAgICAgICAgICAgIGlmIChoYXNoIDwgZG90KVxuICAgICAgICAgICAgICAgIGVsbS5zZXRBdHRyaWJ1dGUoJ2lkJywgc2VsLnNsaWNlKGhhc2ggKyAxLCBkb3QpKTtcbiAgICAgICAgICAgIGlmIChkb3RJZHggPiAwKVxuICAgICAgICAgICAgICAgIGVsbS5zZXRBdHRyaWJ1dGUoJ2NsYXNzJywgc2VsLnNsaWNlKGRvdCArIDEpLnJlcGxhY2UoL1xcLi9nLCAnICcpKTtcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBjYnMuY3JlYXRlLmxlbmd0aDsgKytpKVxuICAgICAgICAgICAgICAgIGNicy5jcmVhdGVbaV0oZW1wdHlOb2RlLCB2bm9kZSk7XG4gICAgICAgICAgICBpZiAoaXMuYXJyYXkoY2hpbGRyZW4pKSB7XG4gICAgICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjaCA9IGNoaWxkcmVuW2ldO1xuICAgICAgICAgICAgICAgICAgICBpZiAoY2ggIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXBpLmFwcGVuZENoaWxkKGVsbSwgY3JlYXRlRWxtKGNoLCBpbnNlcnRlZFZub2RlUXVldWUpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGlzLnByaW1pdGl2ZSh2bm9kZS50ZXh0KSkge1xuICAgICAgICAgICAgICAgIGFwaS5hcHBlbmRDaGlsZChlbG0sIGFwaS5jcmVhdGVUZXh0Tm9kZSh2bm9kZS50ZXh0KSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpID0gdm5vZGUuZGF0YS5ob29rOyAvLyBSZXVzZSB2YXJpYWJsZVxuICAgICAgICAgICAgaWYgKGlzRGVmKGkpKSB7XG4gICAgICAgICAgICAgICAgaWYgKGkuY3JlYXRlKVxuICAgICAgICAgICAgICAgICAgICBpLmNyZWF0ZShlbXB0eU5vZGUsIHZub2RlKTtcbiAgICAgICAgICAgICAgICBpZiAoaS5pbnNlcnQpXG4gICAgICAgICAgICAgICAgICAgIGluc2VydGVkVm5vZGVRdWV1ZS5wdXNoKHZub2RlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHZub2RlLmVsbSA9IGFwaS5jcmVhdGVUZXh0Tm9kZSh2bm9kZS50ZXh0KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdm5vZGUuZWxtO1xuICAgIH1cbiAgICBmdW5jdGlvbiBhZGRWbm9kZXMocGFyZW50RWxtLCBiZWZvcmUsIHZub2Rlcywgc3RhcnRJZHgsIGVuZElkeCwgaW5zZXJ0ZWRWbm9kZVF1ZXVlKSB7XG4gICAgICAgIGZvciAoOyBzdGFydElkeCA8PSBlbmRJZHg7ICsrc3RhcnRJZHgpIHtcbiAgICAgICAgICAgIHZhciBjaCA9IHZub2Rlc1tzdGFydElkeF07XG4gICAgICAgICAgICBpZiAoY2ggIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGFwaS5pbnNlcnRCZWZvcmUocGFyZW50RWxtLCBjcmVhdGVFbG0oY2gsIGluc2VydGVkVm5vZGVRdWV1ZSksIGJlZm9yZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgZnVuY3Rpb24gaW52b2tlRGVzdHJveUhvb2sodm5vZGUpIHtcbiAgICAgICAgdmFyIGksIGosIGRhdGEgPSB2bm9kZS5kYXRhO1xuICAgICAgICBpZiAoZGF0YSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBpZiAoaXNEZWYoaSA9IGRhdGEuaG9vaykgJiYgaXNEZWYoaSA9IGkuZGVzdHJveSkpXG4gICAgICAgICAgICAgICAgaSh2bm9kZSk7XG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgY2JzLmRlc3Ryb3kubGVuZ3RoOyArK2kpXG4gICAgICAgICAgICAgICAgY2JzLmRlc3Ryb3lbaV0odm5vZGUpO1xuICAgICAgICAgICAgaWYgKHZub2RlLmNoaWxkcmVuICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGogPSAwOyBqIDwgdm5vZGUuY2hpbGRyZW4ubGVuZ3RoOyArK2opIHtcbiAgICAgICAgICAgICAgICAgICAgaSA9IHZub2RlLmNoaWxkcmVuW2pdO1xuICAgICAgICAgICAgICAgICAgICBpZiAoaSAhPSBudWxsICYmIHR5cGVvZiBpICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbnZva2VEZXN0cm95SG9vayhpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBmdW5jdGlvbiByZW1vdmVWbm9kZXMocGFyZW50RWxtLCB2bm9kZXMsIHN0YXJ0SWR4LCBlbmRJZHgpIHtcbiAgICAgICAgZm9yICg7IHN0YXJ0SWR4IDw9IGVuZElkeDsgKytzdGFydElkeCkge1xuICAgICAgICAgICAgdmFyIGlfMSA9IHZvaWQgMCwgbGlzdGVuZXJzID0gdm9pZCAwLCBybSA9IHZvaWQgMCwgY2ggPSB2bm9kZXNbc3RhcnRJZHhdO1xuICAgICAgICAgICAgaWYgKGNoICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBpZiAoaXNEZWYoY2guc2VsKSkge1xuICAgICAgICAgICAgICAgICAgICBpbnZva2VEZXN0cm95SG9vayhjaCk7XG4gICAgICAgICAgICAgICAgICAgIGxpc3RlbmVycyA9IGNicy5yZW1vdmUubGVuZ3RoICsgMTtcbiAgICAgICAgICAgICAgICAgICAgcm0gPSBjcmVhdGVSbUNiKGNoLmVsbSwgbGlzdGVuZXJzKTtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChpXzEgPSAwOyBpXzEgPCBjYnMucmVtb3ZlLmxlbmd0aDsgKytpXzEpXG4gICAgICAgICAgICAgICAgICAgICAgICBjYnMucmVtb3ZlW2lfMV0oY2gsIHJtKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlzRGVmKGlfMSA9IGNoLmRhdGEpICYmIGlzRGVmKGlfMSA9IGlfMS5ob29rKSAmJiBpc0RlZihpXzEgPSBpXzEucmVtb3ZlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaV8xKGNoLCBybSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBybSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBhcGkucmVtb3ZlQ2hpbGQocGFyZW50RWxtLCBjaC5lbG0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBmdW5jdGlvbiB1cGRhdGVDaGlsZHJlbihwYXJlbnRFbG0sIG9sZENoLCBuZXdDaCwgaW5zZXJ0ZWRWbm9kZVF1ZXVlKSB7XG4gICAgICAgIHZhciBvbGRTdGFydElkeCA9IDAsIG5ld1N0YXJ0SWR4ID0gMDtcbiAgICAgICAgdmFyIG9sZEVuZElkeCA9IG9sZENoLmxlbmd0aCAtIDE7XG4gICAgICAgIHZhciBvbGRTdGFydFZub2RlID0gb2xkQ2hbMF07XG4gICAgICAgIHZhciBvbGRFbmRWbm9kZSA9IG9sZENoW29sZEVuZElkeF07XG4gICAgICAgIHZhciBuZXdFbmRJZHggPSBuZXdDaC5sZW5ndGggLSAxO1xuICAgICAgICB2YXIgbmV3U3RhcnRWbm9kZSA9IG5ld0NoWzBdO1xuICAgICAgICB2YXIgbmV3RW5kVm5vZGUgPSBuZXdDaFtuZXdFbmRJZHhdO1xuICAgICAgICB2YXIgb2xkS2V5VG9JZHg7XG4gICAgICAgIHZhciBpZHhJbk9sZDtcbiAgICAgICAgdmFyIGVsbVRvTW92ZTtcbiAgICAgICAgdmFyIGJlZm9yZTtcbiAgICAgICAgd2hpbGUgKG9sZFN0YXJ0SWR4IDw9IG9sZEVuZElkeCAmJiBuZXdTdGFydElkeCA8PSBuZXdFbmRJZHgpIHtcbiAgICAgICAgICAgIGlmIChvbGRTdGFydFZub2RlID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBvbGRTdGFydFZub2RlID0gb2xkQ2hbKytvbGRTdGFydElkeF07IC8vIFZub2RlIG1pZ2h0IGhhdmUgYmVlbiBtb3ZlZCBsZWZ0XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChvbGRFbmRWbm9kZSA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgb2xkRW5kVm5vZGUgPSBvbGRDaFstLW9sZEVuZElkeF07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChuZXdTdGFydFZub2RlID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBuZXdTdGFydFZub2RlID0gbmV3Q2hbKytuZXdTdGFydElkeF07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChuZXdFbmRWbm9kZSA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgbmV3RW5kVm5vZGUgPSBuZXdDaFstLW5ld0VuZElkeF07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChzYW1lVm5vZGUob2xkU3RhcnRWbm9kZSwgbmV3U3RhcnRWbm9kZSkpIHtcbiAgICAgICAgICAgICAgICBwYXRjaFZub2RlKG9sZFN0YXJ0Vm5vZGUsIG5ld1N0YXJ0Vm5vZGUsIGluc2VydGVkVm5vZGVRdWV1ZSk7XG4gICAgICAgICAgICAgICAgb2xkU3RhcnRWbm9kZSA9IG9sZENoWysrb2xkU3RhcnRJZHhdO1xuICAgICAgICAgICAgICAgIG5ld1N0YXJ0Vm5vZGUgPSBuZXdDaFsrK25ld1N0YXJ0SWR4XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHNhbWVWbm9kZShvbGRFbmRWbm9kZSwgbmV3RW5kVm5vZGUpKSB7XG4gICAgICAgICAgICAgICAgcGF0Y2hWbm9kZShvbGRFbmRWbm9kZSwgbmV3RW5kVm5vZGUsIGluc2VydGVkVm5vZGVRdWV1ZSk7XG4gICAgICAgICAgICAgICAgb2xkRW5kVm5vZGUgPSBvbGRDaFstLW9sZEVuZElkeF07XG4gICAgICAgICAgICAgICAgbmV3RW5kVm5vZGUgPSBuZXdDaFstLW5ld0VuZElkeF07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChzYW1lVm5vZGUob2xkU3RhcnRWbm9kZSwgbmV3RW5kVm5vZGUpKSB7XG4gICAgICAgICAgICAgICAgcGF0Y2hWbm9kZShvbGRTdGFydFZub2RlLCBuZXdFbmRWbm9kZSwgaW5zZXJ0ZWRWbm9kZVF1ZXVlKTtcbiAgICAgICAgICAgICAgICBhcGkuaW5zZXJ0QmVmb3JlKHBhcmVudEVsbSwgb2xkU3RhcnRWbm9kZS5lbG0sIGFwaS5uZXh0U2libGluZyhvbGRFbmRWbm9kZS5lbG0pKTtcbiAgICAgICAgICAgICAgICBvbGRTdGFydFZub2RlID0gb2xkQ2hbKytvbGRTdGFydElkeF07XG4gICAgICAgICAgICAgICAgbmV3RW5kVm5vZGUgPSBuZXdDaFstLW5ld0VuZElkeF07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChzYW1lVm5vZGUob2xkRW5kVm5vZGUsIG5ld1N0YXJ0Vm5vZGUpKSB7XG4gICAgICAgICAgICAgICAgcGF0Y2hWbm9kZShvbGRFbmRWbm9kZSwgbmV3U3RhcnRWbm9kZSwgaW5zZXJ0ZWRWbm9kZVF1ZXVlKTtcbiAgICAgICAgICAgICAgICBhcGkuaW5zZXJ0QmVmb3JlKHBhcmVudEVsbSwgb2xkRW5kVm5vZGUuZWxtLCBvbGRTdGFydFZub2RlLmVsbSk7XG4gICAgICAgICAgICAgICAgb2xkRW5kVm5vZGUgPSBvbGRDaFstLW9sZEVuZElkeF07XG4gICAgICAgICAgICAgICAgbmV3U3RhcnRWbm9kZSA9IG5ld0NoWysrbmV3U3RhcnRJZHhdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKG9sZEtleVRvSWR4ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgb2xkS2V5VG9JZHggPSBjcmVhdGVLZXlUb09sZElkeChvbGRDaCwgb2xkU3RhcnRJZHgsIG9sZEVuZElkeCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlkeEluT2xkID0gb2xkS2V5VG9JZHhbbmV3U3RhcnRWbm9kZS5rZXldO1xuICAgICAgICAgICAgICAgIGlmIChpc1VuZGVmKGlkeEluT2xkKSkge1xuICAgICAgICAgICAgICAgICAgICBhcGkuaW5zZXJ0QmVmb3JlKHBhcmVudEVsbSwgY3JlYXRlRWxtKG5ld1N0YXJ0Vm5vZGUsIGluc2VydGVkVm5vZGVRdWV1ZSksIG9sZFN0YXJ0Vm5vZGUuZWxtKTtcbiAgICAgICAgICAgICAgICAgICAgbmV3U3RhcnRWbm9kZSA9IG5ld0NoWysrbmV3U3RhcnRJZHhdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZWxtVG9Nb3ZlID0gb2xkQ2hbaWR4SW5PbGRdO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZWxtVG9Nb3ZlLnNlbCAhPT0gbmV3U3RhcnRWbm9kZS5zZWwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFwaS5pbnNlcnRCZWZvcmUocGFyZW50RWxtLCBjcmVhdGVFbG0obmV3U3RhcnRWbm9kZSwgaW5zZXJ0ZWRWbm9kZVF1ZXVlKSwgb2xkU3RhcnRWbm9kZS5lbG0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcGF0Y2hWbm9kZShlbG1Ub01vdmUsIG5ld1N0YXJ0Vm5vZGUsIGluc2VydGVkVm5vZGVRdWV1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBvbGRDaFtpZHhJbk9sZF0gPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBhcGkuaW5zZXJ0QmVmb3JlKHBhcmVudEVsbSwgZWxtVG9Nb3ZlLmVsbSwgb2xkU3RhcnRWbm9kZS5lbG0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIG5ld1N0YXJ0Vm5vZGUgPSBuZXdDaFsrK25ld1N0YXJ0SWR4XTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9sZFN0YXJ0SWR4ID4gb2xkRW5kSWR4KSB7XG4gICAgICAgICAgICBiZWZvcmUgPSBuZXdDaFtuZXdFbmRJZHggKyAxXSA9PSBudWxsID8gbnVsbCA6IG5ld0NoW25ld0VuZElkeCArIDFdLmVsbTtcbiAgICAgICAgICAgIGFkZFZub2RlcyhwYXJlbnRFbG0sIGJlZm9yZSwgbmV3Q2gsIG5ld1N0YXJ0SWR4LCBuZXdFbmRJZHgsIGluc2VydGVkVm5vZGVRdWV1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAobmV3U3RhcnRJZHggPiBuZXdFbmRJZHgpIHtcbiAgICAgICAgICAgIHJlbW92ZVZub2RlcyhwYXJlbnRFbG0sIG9sZENoLCBvbGRTdGFydElkeCwgb2xkRW5kSWR4KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBmdW5jdGlvbiBwYXRjaFZub2RlKG9sZFZub2RlLCB2bm9kZSwgaW5zZXJ0ZWRWbm9kZVF1ZXVlKSB7XG4gICAgICAgIHZhciBpLCBob29rO1xuICAgICAgICBpZiAoaXNEZWYoaSA9IHZub2RlLmRhdGEpICYmIGlzRGVmKGhvb2sgPSBpLmhvb2spICYmIGlzRGVmKGkgPSBob29rLnByZXBhdGNoKSkge1xuICAgICAgICAgICAgaShvbGRWbm9kZSwgdm5vZGUpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBlbG0gPSB2bm9kZS5lbG0gPSBvbGRWbm9kZS5lbG07XG4gICAgICAgIHZhciBvbGRDaCA9IG9sZFZub2RlLmNoaWxkcmVuO1xuICAgICAgICB2YXIgY2ggPSB2bm9kZS5jaGlsZHJlbjtcbiAgICAgICAgaWYgKG9sZFZub2RlID09PSB2bm9kZSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgaWYgKHZub2RlLmRhdGEgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGNicy51cGRhdGUubGVuZ3RoOyArK2kpXG4gICAgICAgICAgICAgICAgY2JzLnVwZGF0ZVtpXShvbGRWbm9kZSwgdm5vZGUpO1xuICAgICAgICAgICAgaSA9IHZub2RlLmRhdGEuaG9vaztcbiAgICAgICAgICAgIGlmIChpc0RlZihpKSAmJiBpc0RlZihpID0gaS51cGRhdGUpKVxuICAgICAgICAgICAgICAgIGkob2xkVm5vZGUsIHZub2RlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaXNVbmRlZih2bm9kZS50ZXh0KSkge1xuICAgICAgICAgICAgaWYgKGlzRGVmKG9sZENoKSAmJiBpc0RlZihjaCkpIHtcbiAgICAgICAgICAgICAgICBpZiAob2xkQ2ggIT09IGNoKVxuICAgICAgICAgICAgICAgICAgICB1cGRhdGVDaGlsZHJlbihlbG0sIG9sZENoLCBjaCwgaW5zZXJ0ZWRWbm9kZVF1ZXVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGlzRGVmKGNoKSkge1xuICAgICAgICAgICAgICAgIGlmIChpc0RlZihvbGRWbm9kZS50ZXh0KSlcbiAgICAgICAgICAgICAgICAgICAgYXBpLnNldFRleHRDb250ZW50KGVsbSwgJycpO1xuICAgICAgICAgICAgICAgIGFkZFZub2RlcyhlbG0sIG51bGwsIGNoLCAwLCBjaC5sZW5ndGggLSAxLCBpbnNlcnRlZFZub2RlUXVldWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoaXNEZWYob2xkQ2gpKSB7XG4gICAgICAgICAgICAgICAgcmVtb3ZlVm5vZGVzKGVsbSwgb2xkQ2gsIDAsIG9sZENoLmxlbmd0aCAtIDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoaXNEZWYob2xkVm5vZGUudGV4dCkpIHtcbiAgICAgICAgICAgICAgICBhcGkuc2V0VGV4dENvbnRlbnQoZWxtLCAnJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAob2xkVm5vZGUudGV4dCAhPT0gdm5vZGUudGV4dCkge1xuICAgICAgICAgICAgYXBpLnNldFRleHRDb250ZW50KGVsbSwgdm5vZGUudGV4dCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlzRGVmKGhvb2spICYmIGlzRGVmKGkgPSBob29rLnBvc3RwYXRjaCkpIHtcbiAgICAgICAgICAgIGkob2xkVm5vZGUsIHZub2RlKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZnVuY3Rpb24gcGF0Y2gob2xkVm5vZGUsIHZub2RlKSB7XG4gICAgICAgIHZhciBpLCBlbG0sIHBhcmVudDtcbiAgICAgICAgdmFyIGluc2VydGVkVm5vZGVRdWV1ZSA9IFtdO1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgY2JzLnByZS5sZW5ndGg7ICsraSlcbiAgICAgICAgICAgIGNicy5wcmVbaV0oKTtcbiAgICAgICAgaWYgKCFpc1Zub2RlKG9sZFZub2RlKSkge1xuICAgICAgICAgICAgb2xkVm5vZGUgPSBlbXB0eU5vZGVBdChvbGRWbm9kZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHNhbWVWbm9kZShvbGRWbm9kZSwgdm5vZGUpKSB7XG4gICAgICAgICAgICBwYXRjaFZub2RlKG9sZFZub2RlLCB2bm9kZSwgaW5zZXJ0ZWRWbm9kZVF1ZXVlKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGVsbSA9IG9sZFZub2RlLmVsbTtcbiAgICAgICAgICAgIHBhcmVudCA9IGFwaS5wYXJlbnROb2RlKGVsbSk7XG4gICAgICAgICAgICBjcmVhdGVFbG0odm5vZGUsIGluc2VydGVkVm5vZGVRdWV1ZSk7XG4gICAgICAgICAgICBpZiAocGFyZW50ICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgYXBpLmluc2VydEJlZm9yZShwYXJlbnQsIHZub2RlLmVsbSwgYXBpLm5leHRTaWJsaW5nKGVsbSkpO1xuICAgICAgICAgICAgICAgIHJlbW92ZVZub2RlcyhwYXJlbnQsIFtvbGRWbm9kZV0sIDAsIDApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBpbnNlcnRlZFZub2RlUXVldWUubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIGluc2VydGVkVm5vZGVRdWV1ZVtpXS5kYXRhLmhvb2suaW5zZXJ0KGluc2VydGVkVm5vZGVRdWV1ZVtpXSk7XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGNicy5wb3N0Lmxlbmd0aDsgKytpKVxuICAgICAgICAgICAgY2JzLnBvc3RbaV0oKTtcbiAgICAgICAgcmV0dXJuIHZub2RlO1xuICAgIH07XG59XG5leHBvcnRzLmluaXQgPSBpbml0O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9c25hYmJkb20uanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgaF8xID0gcmVxdWlyZShcIi4vaFwiKTtcbmZ1bmN0aW9uIGNvcHlUb1RodW5rKHZub2RlLCB0aHVuaykge1xuICAgIHRodW5rLmVsbSA9IHZub2RlLmVsbTtcbiAgICB2bm9kZS5kYXRhLmZuID0gdGh1bmsuZGF0YS5mbjtcbiAgICB2bm9kZS5kYXRhLmFyZ3MgPSB0aHVuay5kYXRhLmFyZ3M7XG4gICAgdGh1bmsuZGF0YSA9IHZub2RlLmRhdGE7XG4gICAgdGh1bmsuY2hpbGRyZW4gPSB2bm9kZS5jaGlsZHJlbjtcbiAgICB0aHVuay50ZXh0ID0gdm5vZGUudGV4dDtcbiAgICB0aHVuay5lbG0gPSB2bm9kZS5lbG07XG59XG5mdW5jdGlvbiBpbml0KHRodW5rKSB7XG4gICAgdmFyIGN1ciA9IHRodW5rLmRhdGE7XG4gICAgdmFyIHZub2RlID0gY3VyLmZuLmFwcGx5KHVuZGVmaW5lZCwgY3VyLmFyZ3MpO1xuICAgIGNvcHlUb1RodW5rKHZub2RlLCB0aHVuayk7XG59XG5mdW5jdGlvbiBwcmVwYXRjaChvbGRWbm9kZSwgdGh1bmspIHtcbiAgICB2YXIgaSwgb2xkID0gb2xkVm5vZGUuZGF0YSwgY3VyID0gdGh1bmsuZGF0YTtcbiAgICB2YXIgb2xkQXJncyA9IG9sZC5hcmdzLCBhcmdzID0gY3VyLmFyZ3M7XG4gICAgaWYgKG9sZC5mbiAhPT0gY3VyLmZuIHx8IG9sZEFyZ3MubGVuZ3RoICE9PSBhcmdzLmxlbmd0aCkge1xuICAgICAgICBjb3B5VG9UaHVuayhjdXIuZm4uYXBwbHkodW5kZWZpbmVkLCBhcmdzKSwgdGh1bmspO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGZvciAoaSA9IDA7IGkgPCBhcmdzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIGlmIChvbGRBcmdzW2ldICE9PSBhcmdzW2ldKSB7XG4gICAgICAgICAgICBjb3B5VG9UaHVuayhjdXIuZm4uYXBwbHkodW5kZWZpbmVkLCBhcmdzKSwgdGh1bmspO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgfVxuICAgIGNvcHlUb1RodW5rKG9sZFZub2RlLCB0aHVuayk7XG59XG5leHBvcnRzLnRodW5rID0gZnVuY3Rpb24gdGh1bmsoc2VsLCBrZXksIGZuLCBhcmdzKSB7XG4gICAgaWYgKGFyZ3MgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBhcmdzID0gZm47XG4gICAgICAgIGZuID0ga2V5O1xuICAgICAgICBrZXkgPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHJldHVybiBoXzEuaChzZWwsIHtcbiAgICAgICAga2V5OiBrZXksXG4gICAgICAgIGhvb2s6IHsgaW5pdDogaW5pdCwgcHJlcGF0Y2g6IHByZXBhdGNoIH0sXG4gICAgICAgIGZuOiBmbixcbiAgICAgICAgYXJnczogYXJnc1xuICAgIH0pO1xufTtcbmV4cG9ydHMuZGVmYXVsdCA9IGV4cG9ydHMudGh1bms7XG4vLyMgc291cmNlTWFwcGluZ1VSTD10aHVuay5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB2bm9kZV8xID0gcmVxdWlyZShcIi4vdm5vZGVcIik7XG52YXIgaHRtbGRvbWFwaV8xID0gcmVxdWlyZShcIi4vaHRtbGRvbWFwaVwiKTtcbmZ1bmN0aW9uIHRvVk5vZGUobm9kZSwgZG9tQXBpKSB7XG4gICAgdmFyIGFwaSA9IGRvbUFwaSAhPT0gdW5kZWZpbmVkID8gZG9tQXBpIDogaHRtbGRvbWFwaV8xLmRlZmF1bHQ7XG4gICAgdmFyIHRleHQ7XG4gICAgaWYgKGFwaS5pc0VsZW1lbnQobm9kZSkpIHtcbiAgICAgICAgdmFyIGlkID0gbm9kZS5pZCA/ICcjJyArIG5vZGUuaWQgOiAnJztcbiAgICAgICAgdmFyIGNuID0gbm9kZS5nZXRBdHRyaWJ1dGUoJ2NsYXNzJyk7XG4gICAgICAgIHZhciBjID0gY24gPyAnLicgKyBjbi5zcGxpdCgnICcpLmpvaW4oJy4nKSA6ICcnO1xuICAgICAgICB2YXIgc2VsID0gYXBpLnRhZ05hbWUobm9kZSkudG9Mb3dlckNhc2UoKSArIGlkICsgYztcbiAgICAgICAgdmFyIGF0dHJzID0ge307XG4gICAgICAgIHZhciBjaGlsZHJlbiA9IFtdO1xuICAgICAgICB2YXIgbmFtZV8xO1xuICAgICAgICB2YXIgaSA9IHZvaWQgMCwgbiA9IHZvaWQgMDtcbiAgICAgICAgdmFyIGVsbUF0dHJzID0gbm9kZS5hdHRyaWJ1dGVzO1xuICAgICAgICB2YXIgZWxtQ2hpbGRyZW4gPSBub2RlLmNoaWxkTm9kZXM7XG4gICAgICAgIGZvciAoaSA9IDAsIG4gPSBlbG1BdHRycy5sZW5ndGg7IGkgPCBuOyBpKyspIHtcbiAgICAgICAgICAgIG5hbWVfMSA9IGVsbUF0dHJzW2ldLm5vZGVOYW1lO1xuICAgICAgICAgICAgaWYgKG5hbWVfMSAhPT0gJ2lkJyAmJiBuYW1lXzEgIT09ICdjbGFzcycpIHtcbiAgICAgICAgICAgICAgICBhdHRyc1tuYW1lXzFdID0gZWxtQXR0cnNbaV0ubm9kZVZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGZvciAoaSA9IDAsIG4gPSBlbG1DaGlsZHJlbi5sZW5ndGg7IGkgPCBuOyBpKyspIHtcbiAgICAgICAgICAgIGNoaWxkcmVuLnB1c2godG9WTm9kZShlbG1DaGlsZHJlbltpXSkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB2bm9kZV8xLmRlZmF1bHQoc2VsLCB7IGF0dHJzOiBhdHRycyB9LCBjaGlsZHJlbiwgdW5kZWZpbmVkLCBub2RlKTtcbiAgICB9XG4gICAgZWxzZSBpZiAoYXBpLmlzVGV4dChub2RlKSkge1xuICAgICAgICB0ZXh0ID0gYXBpLmdldFRleHRDb250ZW50KG5vZGUpO1xuICAgICAgICByZXR1cm4gdm5vZGVfMS5kZWZhdWx0KHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIHRleHQsIG5vZGUpO1xuICAgIH1cbiAgICBlbHNlIGlmIChhcGkuaXNDb21tZW50KG5vZGUpKSB7XG4gICAgICAgIHRleHQgPSBhcGkuZ2V0VGV4dENvbnRlbnQobm9kZSk7XG4gICAgICAgIHJldHVybiB2bm9kZV8xLmRlZmF1bHQoJyEnLCB7fSwgW10sIHRleHQsIG5vZGUpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHZub2RlXzEuZGVmYXVsdCgnJywge30sIFtdLCB1bmRlZmluZWQsIG5vZGUpO1xuICAgIH1cbn1cbmV4cG9ydHMudG9WTm9kZSA9IHRvVk5vZGU7XG5leHBvcnRzLmRlZmF1bHQgPSB0b1ZOb2RlO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9dG92bm9kZS5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmZ1bmN0aW9uIHZub2RlKHNlbCwgZGF0YSwgY2hpbGRyZW4sIHRleHQsIGVsbSkge1xuICAgIHZhciBrZXkgPSBkYXRhID09PSB1bmRlZmluZWQgPyB1bmRlZmluZWQgOiBkYXRhLmtleTtcbiAgICByZXR1cm4geyBzZWw6IHNlbCwgZGF0YTogZGF0YSwgY2hpbGRyZW46IGNoaWxkcmVuLFxuICAgICAgICB0ZXh0OiB0ZXh0LCBlbG06IGVsbSwga2V5OiBrZXkgfTtcbn1cbmV4cG9ydHMudm5vZGUgPSB2bm9kZTtcbmV4cG9ydHMuZGVmYXVsdCA9IHZub2RlO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9dm5vZGUuanMubWFwIiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuXG52YXIgX3BvbnlmaWxsID0gcmVxdWlyZSgnLi9wb255ZmlsbC5qcycpO1xuXG52YXIgX3BvbnlmaWxsMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3BvbnlmaWxsKTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgJ2RlZmF1bHQnOiBvYmogfTsgfVxuXG52YXIgcm9vdDsgLyogZ2xvYmFsIHdpbmRvdyAqL1xuXG5cbmlmICh0eXBlb2Ygc2VsZiAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgcm9vdCA9IHNlbGY7XG59IGVsc2UgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSB7XG4gIHJvb3QgPSB3aW5kb3c7XG59IGVsc2UgaWYgKHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnKSB7XG4gIHJvb3QgPSBnbG9iYWw7XG59IGVsc2UgaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnKSB7XG4gIHJvb3QgPSBtb2R1bGU7XG59IGVsc2Uge1xuICByb290ID0gRnVuY3Rpb24oJ3JldHVybiB0aGlzJykoKTtcbn1cblxudmFyIHJlc3VsdCA9ICgwLCBfcG9ueWZpbGwyWydkZWZhdWx0J10pKHJvb3QpO1xuZXhwb3J0c1snZGVmYXVsdCddID0gcmVzdWx0OyIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG5cdHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IHN5bWJvbE9ic2VydmFibGVQb255ZmlsbDtcbmZ1bmN0aW9uIHN5bWJvbE9ic2VydmFibGVQb255ZmlsbChyb290KSB7XG5cdHZhciByZXN1bHQ7XG5cdHZhciBfU3ltYm9sID0gcm9vdC5TeW1ib2w7XG5cblx0aWYgKHR5cGVvZiBfU3ltYm9sID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0aWYgKF9TeW1ib2wub2JzZXJ2YWJsZSkge1xuXHRcdFx0cmVzdWx0ID0gX1N5bWJvbC5vYnNlcnZhYmxlO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXN1bHQgPSBfU3ltYm9sKCdvYnNlcnZhYmxlJyk7XG5cdFx0XHRfU3ltYm9sLm9ic2VydmFibGUgPSByZXN1bHQ7XG5cdFx0fVxuXHR9IGVsc2Uge1xuXHRcdHJlc3VsdCA9ICdAQG9ic2VydmFibGUnO1xuXHR9XG5cblx0cmV0dXJuIHJlc3VsdDtcbn07IiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxudmFyIHR5cGVzdHlsZV8xID0gcmVxdWlyZShcIi4vaW50ZXJuYWwvdHlwZXN0eWxlXCIpO1xyXG5leHBvcnRzLlR5cGVTdHlsZSA9IHR5cGVzdHlsZV8xLlR5cGVTdHlsZTtcclxuLyoqXHJcbiAqIEFsbCB0aGUgQ1NTIHR5cGVzIGluIHRoZSAndHlwZXMnIG5hbWVzcGFjZVxyXG4gKi9cclxudmFyIHR5cGVzID0gcmVxdWlyZShcIi4vdHlwZXNcIik7XHJcbmV4cG9ydHMudHlwZXMgPSB0eXBlcztcclxuLyoqXHJcbiAqIEV4cG9ydCBjZXJ0YWluIHV0aWxpdGllc1xyXG4gKi9cclxudmFyIHV0aWxpdGllc18xID0gcmVxdWlyZShcIi4vaW50ZXJuYWwvdXRpbGl0aWVzXCIpO1xyXG5leHBvcnRzLmV4dGVuZCA9IHV0aWxpdGllc18xLmV4dGVuZDtcclxuZXhwb3J0cy5jbGFzc2VzID0gdXRpbGl0aWVzXzEuY2xhc3NlcztcclxuZXhwb3J0cy5tZWRpYSA9IHV0aWxpdGllc18xLm1lZGlhO1xyXG4vKiogWmVybyBjb25maWd1cmF0aW9uLCBkZWZhdWx0IGluc3RhbmNlIG9mIFR5cGVTdHlsZSAqL1xyXG52YXIgdHMgPSBuZXcgdHlwZXN0eWxlXzEuVHlwZVN0eWxlKHsgYXV0b0dlbmVyYXRlVGFnOiB0cnVlIH0pO1xyXG4vKiogU2V0cyB0aGUgdGFyZ2V0IHRhZyB3aGVyZSB3ZSB3cml0ZSB0aGUgY3NzIG9uIHN0eWxlIHVwZGF0ZXMgKi9cclxuZXhwb3J0cy5zZXRTdHlsZXNUYXJnZXQgPSB0cy5zZXRTdHlsZXNUYXJnZXQ7XHJcbi8qKlxyXG4gKiBJbnNlcnQgYHJhd2AgQ1NTIGFzIGEgc3RyaW5nLiBUaGlzIGlzIHVzZWZ1bCBmb3IgZS5nLlxyXG4gKiAtIHRoaXJkIHBhcnR5IENTUyB0aGF0IHlvdSBhcmUgY3VzdG9taXppbmcgd2l0aCB0ZW1wbGF0ZSBzdHJpbmdzXHJcbiAqIC0gZ2VuZXJhdGluZyByYXcgQ1NTIGluIEphdmFTY3JpcHRcclxuICogLSByZXNldCBsaWJyYXJpZXMgbGlrZSBub3JtYWxpemUuY3NzIHRoYXQgeW91IGNhbiB1c2Ugd2l0aG91dCBsb2FkZXJzXHJcbiAqL1xyXG5leHBvcnRzLmNzc1JhdyA9IHRzLmNzc1JhdztcclxuLyoqXHJcbiAqIFRha2VzIENTU1Byb3BlcnRpZXMgYW5kIHJlZ2lzdGVycyBpdCB0byBhIGdsb2JhbCBzZWxlY3RvciAoYm9keSwgaHRtbCwgZXRjLilcclxuICovXHJcbmV4cG9ydHMuY3NzUnVsZSA9IHRzLmNzc1J1bGU7XHJcbi8qKlxyXG4gKiBSZW5kZXJzIHN0eWxlcyB0byB0aGUgc2luZ2xldG9uIHRhZyBpbWVkaWF0ZWx5XHJcbiAqIE5PVEU6IFlvdSBzaG91bGQgb25seSBjYWxsIGl0IG9uIGluaXRpYWwgcmVuZGVyIHRvIHByZXZlbnQgYW55IG5vbiBDU1MgZmxhc2guXHJcbiAqIEFmdGVyIHRoYXQgaXQgaXMga2VwdCBzeW5jIHVzaW5nIGByZXF1ZXN0QW5pbWF0aW9uRnJhbWVgIGFuZCB3ZSBoYXZlbid0IG5vdGljZWQgYW55IGJhZCBmbGFzaGVzLlxyXG4gKiovXHJcbmV4cG9ydHMuZm9yY2VSZW5kZXJTdHlsZXMgPSB0cy5mb3JjZVJlbmRlclN0eWxlcztcclxuLyoqXHJcbiAqIFV0aWxpdHkgZnVuY3Rpb24gdG8gcmVnaXN0ZXIgYW4gQGZvbnQtZmFjZVxyXG4gKi9cclxuZXhwb3J0cy5mb250RmFjZSA9IHRzLmZvbnRGYWNlO1xyXG4vKipcclxuICogQWxsb3dzIHVzZSB0byB1c2UgdGhlIHN0eWxlc2hlZXQgaW4gYSBub2RlLmpzIGVudmlyb25tZW50XHJcbiAqL1xyXG5leHBvcnRzLmdldFN0eWxlcyA9IHRzLmdldFN0eWxlcztcclxuLyoqXHJcbiAqIFRha2VzIGtleWZyYW1lcyBhbmQgcmV0dXJucyBhIGdlbmVyYXRlZCBhbmltYXRpb25OYW1lXHJcbiAqL1xyXG5leHBvcnRzLmtleWZyYW1lcyA9IHRzLmtleWZyYW1lcztcclxuLyoqXHJcbiAqIEhlbHBzIHdpdGggdGVzdGluZy4gUmVpbml0aWFsaXplcyBGcmVlU3R5bGUgKyByYXdcclxuICovXHJcbmV4cG9ydHMucmVpbml0ID0gdHMucmVpbml0O1xyXG4vKipcclxuICogVGFrZXMgQ1NTUHJvcGVydGllcyBhbmQgcmV0dXJuIGEgZ2VuZXJhdGVkIGNsYXNzTmFtZSB5b3UgY2FuIHVzZSBvbiB5b3VyIGNvbXBvbmVudFxyXG4gKi9cclxuZXhwb3J0cy5zdHlsZSA9IHRzLnN0eWxlO1xyXG4vKipcclxuICogVGFrZXMgYW4gb2JqZWN0IHdoZXJlIHByb3BlcnR5IG5hbWVzIGFyZSBpZGVhbCBjbGFzcyBuYW1lcyBhbmQgcHJvcGVydHkgdmFsdWVzIGFyZSBDU1NQcm9wZXJ0aWVzLCBhbmRcclxuICogcmV0dXJucyBhbiBvYmplY3Qgd2hlcmUgcHJvcGVydHkgbmFtZXMgYXJlIHRoZSBzYW1lIGlkZWFsIGNsYXNzIG5hbWVzIGFuZCB0aGUgcHJvcGVydHkgdmFsdWVzIGFyZVxyXG4gKiB0aGUgYWN0dWFsIGdlbmVyYXRlZCBjbGFzcyBuYW1lcyB1c2luZyB0aGUgaWRlYWwgY2xhc3MgbmFtZSBhcyB0aGUgJGRlYnVnTmFtZVxyXG4gKi9cclxuZXhwb3J0cy5zdHlsZXNoZWV0ID0gdHMuc3R5bGVzaGVldDtcclxuLyoqXHJcbiAqIENyZWF0ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgVHlwZVN0eWxlIHNlcGFyYXRlIGZyb20gdGhlIGRlZmF1bHQgaW5zdGFuY2UuXHJcbiAqXHJcbiAqIC0gVXNlIHRoaXMgZm9yIGNyZWF0aW5nIGEgZGlmZmVyZW50IHR5cGVzdHlsZSBpbnN0YW5jZSBmb3IgYSBzaGFkb3cgZG9tIGNvbXBvbmVudC5cclxuICogLSBVc2UgdGhpcyBpZiB5b3UgZG9uJ3Qgd2FudCBhbiBhdXRvIHRhZyBnZW5lcmF0ZWQgYW5kIHlvdSBqdXN0IHdhbnQgdG8gY29sbGVjdCB0aGUgQ1NTLlxyXG4gKlxyXG4gKiBOT1RFOiBzdHlsZXMgYXJlbid0IHNoYXJlZCBiZXR3ZWVuIGRpZmZlcmVudCBpbnN0YW5jZXMuXHJcbiAqL1xyXG5mdW5jdGlvbiBjcmVhdGVUeXBlU3R5bGUodGFyZ2V0KSB7XHJcbiAgICB2YXIgaW5zdGFuY2UgPSBuZXcgdHlwZXN0eWxlXzEuVHlwZVN0eWxlKHsgYXV0b0dlbmVyYXRlVGFnOiBmYWxzZSB9KTtcclxuICAgIGlmICh0YXJnZXQpIHtcclxuICAgICAgICBpbnN0YW5jZS5zZXRTdHlsZXNUYXJnZXQodGFyZ2V0KTtcclxuICAgIH1cclxuICAgIHJldHVybiBpbnN0YW5jZTtcclxufVxyXG5leHBvcnRzLmNyZWF0ZVR5cGVTdHlsZSA9IGNyZWF0ZVR5cGVTdHlsZTtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxudmFyIEZyZWVTdHlsZSA9IHJlcXVpcmUoXCJmcmVlLXN0eWxlXCIpO1xyXG4vKipcclxuICogV2UgbmVlZCB0byBkbyB0aGUgZm9sbG93aW5nIHRvICpvdXIqIG9iamVjdHMgYmVmb3JlIHBhc3NpbmcgdG8gZnJlZXN0eWxlOlxyXG4gKiAtIEZvciBhbnkgYCRuZXN0YCBkaXJlY3RpdmUgbW92ZSB1cCB0byBGcmVlU3R5bGUgc3R5bGUgbmVzdGluZ1xyXG4gKiAtIEZvciBhbnkgYCR1bmlxdWVgIGRpcmVjdGl2ZSBtYXAgdG8gRnJlZVN0eWxlIFVuaXF1ZVxyXG4gKiAtIEZvciBhbnkgYCRkZWJ1Z05hbWVgIGRpcmVjdGl2ZSByZXR1cm4gdGhlIGRlYnVnIG5hbWVcclxuICovXHJcbmZ1bmN0aW9uIGVuc3VyZVN0cmluZ09iaihvYmplY3QpIHtcclxuICAgIC8qKiBUaGUgZmluYWwgcmVzdWx0IHdlIHdpbGwgcmV0dXJuICovXHJcbiAgICB2YXIgcmVzdWx0ID0ge307XHJcbiAgICB2YXIgZGVidWdOYW1lID0gJyc7XHJcbiAgICBmb3IgKHZhciBrZXkgaW4gb2JqZWN0KSB7XHJcbiAgICAgICAgLyoqIEdyYWIgdGhlIHZhbHVlIHVwZnJvbnQgKi9cclxuICAgICAgICB2YXIgdmFsID0gb2JqZWN0W2tleV07XHJcbiAgICAgICAgLyoqIFR5cGVTdHlsZSBjb25maWd1cmF0aW9uIG9wdGlvbnMgKi9cclxuICAgICAgICBpZiAoa2V5ID09PSAnJHVuaXF1ZScpIHtcclxuICAgICAgICAgICAgcmVzdWx0W0ZyZWVTdHlsZS5JU19VTklRVUVdID0gdmFsO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmIChrZXkgPT09ICckbmVzdCcpIHtcclxuICAgICAgICAgICAgdmFyIG5lc3RlZCA9IHZhbDtcclxuICAgICAgICAgICAgZm9yICh2YXIgc2VsZWN0b3IgaW4gbmVzdGVkKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgc3VicHJvcGVydGllcyA9IG5lc3RlZFtzZWxlY3Rvcl07XHJcbiAgICAgICAgICAgICAgICByZXN1bHRbc2VsZWN0b3JdID0gZW5zdXJlU3RyaW5nT2JqKHN1YnByb3BlcnRpZXMpLnJlc3VsdDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmIChrZXkgPT09ICckZGVidWdOYW1lJykge1xyXG4gICAgICAgICAgICBkZWJ1Z05hbWUgPSB2YWw7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICByZXN1bHRba2V5XSA9IHZhbDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4geyByZXN1bHQ6IHJlc3VsdCwgZGVidWdOYW1lOiBkZWJ1Z05hbWUgfTtcclxufVxyXG5leHBvcnRzLmVuc3VyZVN0cmluZ09iaiA9IGVuc3VyZVN0cmluZ09iajtcclxuLy8gdG9kbzogYmV0dGVyIG5hbWUgaGVyZVxyXG5mdW5jdGlvbiBleHBsb2RlS2V5ZnJhbWVzKGZyYW1lcykge1xyXG4gICAgdmFyIHJlc3VsdCA9IHsgJGRlYnVnTmFtZTogdW5kZWZpbmVkLCBrZXlmcmFtZXM6IHt9IH07XHJcbiAgICBmb3IgKHZhciBvZmZzZXQgaW4gZnJhbWVzKSB7XHJcbiAgICAgICAgdmFyIHZhbCA9IGZyYW1lc1tvZmZzZXRdO1xyXG4gICAgICAgIGlmIChvZmZzZXQgPT09ICckZGVidWdOYW1lJykge1xyXG4gICAgICAgICAgICByZXN1bHQuJGRlYnVnTmFtZSA9IHZhbDtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHJlc3VsdC5rZXlmcmFtZXNbb2Zmc2V0XSA9IHZhbDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG59XHJcbmV4cG9ydHMuZXhwbG9kZUtleWZyYW1lcyA9IGV4cGxvZGVLZXlmcmFtZXM7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbnZhciBGcmVlU3R5bGUgPSByZXF1aXJlKFwiZnJlZS1zdHlsZVwiKTtcclxudmFyIGZvcm1hdHRpbmdfMSA9IHJlcXVpcmUoXCIuL2Zvcm1hdHRpbmdcIik7XHJcbnZhciB1dGlsaXRpZXNfMSA9IHJlcXVpcmUoXCIuL3V0aWxpdGllc1wiKTtcclxuLyoqXHJcbiAqIENyZWF0ZXMgYW4gaW5zdGFuY2Ugb2YgZnJlZSBzdHlsZSB3aXRoIG91ciBvcHRpb25zXHJcbiAqL1xyXG52YXIgY3JlYXRlRnJlZVN0eWxlID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gRnJlZVN0eWxlLmNyZWF0ZShcclxuLyoqIFVzZSB0aGUgZGVmYXVsdCBoYXNoIGZ1bmN0aW9uICovXHJcbnVuZGVmaW5lZCwgXHJcbi8qKiBQcmVzZXJ2ZSAkZGVidWdOYW1lIHZhbHVlcyAqL1xyXG50cnVlKTsgfTtcclxuLyoqXHJcbiAqIE1haW50YWlucyBhIHNpbmdsZSBzdHlsZXNoZWV0IGFuZCBrZWVwcyBpdCBpbiBzeW5jIHdpdGggcmVxdWVzdGVkIHN0eWxlc1xyXG4gKi9cclxudmFyIFR5cGVTdHlsZSA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcclxuICAgIGZ1bmN0aW9uIFR5cGVTdHlsZShfYSkge1xyXG4gICAgICAgIHZhciBhdXRvR2VuZXJhdGVUYWcgPSBfYS5hdXRvR2VuZXJhdGVUYWc7XHJcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBJbnNlcnQgYHJhd2AgQ1NTIGFzIGEgc3RyaW5nLiBUaGlzIGlzIHVzZWZ1bCBmb3IgZS5nLlxyXG4gICAgICAgICAqIC0gdGhpcmQgcGFydHkgQ1NTIHRoYXQgeW91IGFyZSBjdXN0b21pemluZyB3aXRoIHRlbXBsYXRlIHN0cmluZ3NcclxuICAgICAgICAgKiAtIGdlbmVyYXRpbmcgcmF3IENTUyBpbiBKYXZhU2NyaXB0XHJcbiAgICAgICAgICogLSByZXNldCBsaWJyYXJpZXMgbGlrZSBub3JtYWxpemUuY3NzIHRoYXQgeW91IGNhbiB1c2Ugd2l0aG91dCBsb2FkZXJzXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5jc3NSYXcgPSBmdW5jdGlvbiAobXVzdEJlVmFsaWRDU1MpIHtcclxuICAgICAgICAgICAgaWYgKCFtdXN0QmVWYWxpZENTUykge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIF90aGlzLl9yYXcgKz0gbXVzdEJlVmFsaWRDU1MgfHwgJyc7XHJcbiAgICAgICAgICAgIF90aGlzLl9wZW5kaW5nUmF3Q2hhbmdlID0gdHJ1ZTtcclxuICAgICAgICAgICAgX3RoaXMuX3N0eWxlVXBkYXRlZCgpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogVGFrZXMgQ1NTUHJvcGVydGllcyBhbmQgcmVnaXN0ZXJzIGl0IHRvIGEgZ2xvYmFsIHNlbGVjdG9yIChib2R5LCBodG1sLCBldGMuKVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMuY3NzUnVsZSA9IGZ1bmN0aW9uIChzZWxlY3Rvcikge1xyXG4gICAgICAgICAgICB2YXIgb2JqZWN0cyA9IFtdO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBfaSA9IDE7IF9pIDwgYXJndW1lbnRzLmxlbmd0aDsgX2krKykge1xyXG4gICAgICAgICAgICAgICAgb2JqZWN0c1tfaSAtIDFdID0gYXJndW1lbnRzW19pXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB2YXIgb2JqZWN0ID0gZm9ybWF0dGluZ18xLmVuc3VyZVN0cmluZ09iaih1dGlsaXRpZXNfMS5leHRlbmQuYXBwbHkodm9pZCAwLCBvYmplY3RzKSkucmVzdWx0O1xyXG4gICAgICAgICAgICBfdGhpcy5fZnJlZVN0eWxlLnJlZ2lzdGVyUnVsZShzZWxlY3Rvciwgb2JqZWN0KTtcclxuICAgICAgICAgICAgX3RoaXMuX3N0eWxlVXBkYXRlZCgpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfTtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBSZW5kZXJzIHN0eWxlcyB0byB0aGUgc2luZ2xldG9uIHRhZyBpbWVkaWF0ZWx5XHJcbiAgICAgICAgICogTk9URTogWW91IHNob3VsZCBvbmx5IGNhbGwgaXQgb24gaW5pdGlhbCByZW5kZXIgdG8gcHJldmVudCBhbnkgbm9uIENTUyBmbGFzaC5cclxuICAgICAgICAgKiBBZnRlciB0aGF0IGl0IGlzIGtlcHQgc3luYyB1c2luZyBgcmVxdWVzdEFuaW1hdGlvbkZyYW1lYCBhbmQgd2UgaGF2ZW4ndCBub3RpY2VkIGFueSBiYWQgZmxhc2hlcy5cclxuICAgICAgICAgKiovXHJcbiAgICAgICAgdGhpcy5mb3JjZVJlbmRlclN0eWxlcyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyIHRhcmdldCA9IF90aGlzLl9nZXRUYWcoKTtcclxuICAgICAgICAgICAgaWYgKCF0YXJnZXQpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0YXJnZXQudGV4dENvbnRlbnQgPSBfdGhpcy5nZXRTdHlsZXMoKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFV0aWxpdHkgZnVuY3Rpb24gdG8gcmVnaXN0ZXIgYW4gQGZvbnQtZmFjZVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMuZm9udEZhY2UgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciBmb250RmFjZSA9IFtdO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBfaSA9IDA7IF9pIDwgYXJndW1lbnRzLmxlbmd0aDsgX2krKykge1xyXG4gICAgICAgICAgICAgICAgZm9udEZhY2VbX2ldID0gYXJndW1lbnRzW19pXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB2YXIgZnJlZVN0eWxlID0gX3RoaXMuX2ZyZWVTdHlsZTtcclxuICAgICAgICAgICAgZm9yICh2YXIgX2EgPSAwLCBfYiA9IGZvbnRGYWNlOyBfYSA8IF9iLmxlbmd0aDsgX2ErKykge1xyXG4gICAgICAgICAgICAgICAgdmFyIGZhY2UgPSBfYltfYV07XHJcbiAgICAgICAgICAgICAgICBmcmVlU3R5bGUucmVnaXN0ZXJSdWxlKCdAZm9udC1mYWNlJywgZmFjZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgX3RoaXMuX3N0eWxlVXBkYXRlZCgpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfTtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBBbGxvd3MgdXNlIHRvIHVzZSB0aGUgc3R5bGVzaGVldCBpbiBhIG5vZGUuanMgZW52aXJvbm1lbnRcclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLmdldFN0eWxlcyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIChfdGhpcy5fcmF3IHx8ICcnKSArIF90aGlzLl9mcmVlU3R5bGUuZ2V0U3R5bGVzKCk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBUYWtlcyBrZXlmcmFtZXMgYW5kIHJldHVybnMgYSBnZW5lcmF0ZWQgYW5pbWF0aW9uTmFtZVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMua2V5ZnJhbWVzID0gZnVuY3Rpb24gKGZyYW1lcykge1xyXG4gICAgICAgICAgICB2YXIgX2EgPSBmb3JtYXR0aW5nXzEuZXhwbG9kZUtleWZyYW1lcyhmcmFtZXMpLCBrZXlmcmFtZXMgPSBfYS5rZXlmcmFtZXMsICRkZWJ1Z05hbWUgPSBfYS4kZGVidWdOYW1lO1xyXG4gICAgICAgICAgICAvLyBUT0RPOiByZXBsYWNlICRkZWJ1Z05hbWUgd2l0aCBkaXNwbGF5IG5hbWVcclxuICAgICAgICAgICAgdmFyIGFuaW1hdGlvbk5hbWUgPSBfdGhpcy5fZnJlZVN0eWxlLnJlZ2lzdGVyS2V5ZnJhbWVzKGtleWZyYW1lcywgJGRlYnVnTmFtZSk7XHJcbiAgICAgICAgICAgIF90aGlzLl9zdHlsZVVwZGF0ZWQoKTtcclxuICAgICAgICAgICAgcmV0dXJuIGFuaW1hdGlvbk5hbWU7XHJcbiAgICAgICAgfTtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBIZWxwcyB3aXRoIHRlc3RpbmcuIFJlaW5pdGlhbGl6ZXMgRnJlZVN0eWxlICsgcmF3XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5yZWluaXQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIC8qKiByZWluaXQgZnJlZXN0eWxlICovXHJcbiAgICAgICAgICAgIHZhciBmcmVlU3R5bGUgPSBjcmVhdGVGcmVlU3R5bGUoKTtcclxuICAgICAgICAgICAgX3RoaXMuX2ZyZWVTdHlsZSA9IGZyZWVTdHlsZTtcclxuICAgICAgICAgICAgX3RoaXMuX2xhc3RGcmVlU3R5bGVDaGFuZ2VJZCA9IGZyZWVTdHlsZS5jaGFuZ2VJZDtcclxuICAgICAgICAgICAgLyoqIHJlaW5pdCByYXcgKi9cclxuICAgICAgICAgICAgX3RoaXMuX3JhdyA9ICcnO1xyXG4gICAgICAgICAgICBfdGhpcy5fcGVuZGluZ1Jhd0NoYW5nZSA9IGZhbHNlO1xyXG4gICAgICAgICAgICAvKiogQ2xlYXIgYW55IHN0eWxlcyB0aGF0IHdlcmUgZmx1c2hlZCAqL1xyXG4gICAgICAgICAgICB2YXIgdGFyZ2V0ID0gX3RoaXMuX2dldFRhZygpO1xyXG4gICAgICAgICAgICBpZiAodGFyZ2V0KSB7XHJcbiAgICAgICAgICAgICAgICB0YXJnZXQudGV4dENvbnRlbnQgPSAnJztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgLyoqIFNldHMgdGhlIHRhcmdldCB0YWcgd2hlcmUgd2Ugd3JpdGUgdGhlIGNzcyBvbiBzdHlsZSB1cGRhdGVzICovXHJcbiAgICAgICAgdGhpcy5zZXRTdHlsZXNUYXJnZXQgPSBmdW5jdGlvbiAodGFnKSB7XHJcbiAgICAgICAgICAgIC8qKiBDbGVhciBhbnkgZGF0YSBpbiBhbnkgcHJldmlvdXMgdGFnICovXHJcbiAgICAgICAgICAgIGlmIChfdGhpcy5fdGFnKSB7XHJcbiAgICAgICAgICAgICAgICBfdGhpcy5fdGFnLnRleHRDb250ZW50ID0gJyc7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgX3RoaXMuX3RhZyA9IHRhZztcclxuICAgICAgICAgICAgLyoqIFRoaXMgc3BlY2lhbCB0aW1lIGJ1ZmZlciBpbW1lZGlhdGVseSAqL1xyXG4gICAgICAgICAgICBfdGhpcy5mb3JjZVJlbmRlclN0eWxlcygpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogVGFrZXMgYW4gb2JqZWN0IHdoZXJlIHByb3BlcnR5IG5hbWVzIGFyZSBpZGVhbCBjbGFzcyBuYW1lcyBhbmQgcHJvcGVydHkgdmFsdWVzIGFyZSBDU1NQcm9wZXJ0aWVzLCBhbmRcclxuICAgICAgICAgKiByZXR1cm5zIGFuIG9iamVjdCB3aGVyZSBwcm9wZXJ0eSBuYW1lcyBhcmUgdGhlIHNhbWUgaWRlYWwgY2xhc3MgbmFtZXMgYW5kIHRoZSBwcm9wZXJ0eSB2YWx1ZXMgYXJlXHJcbiAgICAgICAgICogdGhlIGFjdHVhbCBnZW5lcmF0ZWQgY2xhc3MgbmFtZXMgdXNpbmcgdGhlIGlkZWFsIGNsYXNzIG5hbWUgYXMgdGhlICRkZWJ1Z05hbWVcclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLnN0eWxlc2hlZXQgPSBmdW5jdGlvbiAoY2xhc3Nlcykge1xyXG4gICAgICAgICAgICB2YXIgY2xhc3NOYW1lcyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKGNsYXNzZXMpO1xyXG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0ge307XHJcbiAgICAgICAgICAgIGZvciAodmFyIF9pID0gMCwgY2xhc3NOYW1lc18xID0gY2xhc3NOYW1lczsgX2kgPCBjbGFzc05hbWVzXzEubGVuZ3RoOyBfaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgY2xhc3NOYW1lID0gY2xhc3NOYW1lc18xW19pXTtcclxuICAgICAgICAgICAgICAgIHZhciBjbGFzc0RlZiA9IGNsYXNzZXNbY2xhc3NOYW1lXTtcclxuICAgICAgICAgICAgICAgIGlmIChjbGFzc0RlZikge1xyXG4gICAgICAgICAgICAgICAgICAgIGNsYXNzRGVmLiRkZWJ1Z05hbWUgPSBjbGFzc05hbWU7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0W2NsYXNzTmFtZV0gPSBfdGhpcy5zdHlsZShjbGFzc0RlZik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICB9O1xyXG4gICAgICAgIHZhciBmcmVlU3R5bGUgPSBjcmVhdGVGcmVlU3R5bGUoKTtcclxuICAgICAgICB0aGlzLl9hdXRvR2VuZXJhdGVUYWcgPSBhdXRvR2VuZXJhdGVUYWc7XHJcbiAgICAgICAgdGhpcy5fZnJlZVN0eWxlID0gZnJlZVN0eWxlO1xyXG4gICAgICAgIHRoaXMuX2xhc3RGcmVlU3R5bGVDaGFuZ2VJZCA9IGZyZWVTdHlsZS5jaGFuZ2VJZDtcclxuICAgICAgICB0aGlzLl9wZW5kaW5nID0gMDtcclxuICAgICAgICB0aGlzLl9wZW5kaW5nUmF3Q2hhbmdlID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5fcmF3ID0gJyc7XHJcbiAgICAgICAgdGhpcy5fdGFnID0gdW5kZWZpbmVkO1xyXG4gICAgICAgIC8vIHJlYmluZCBwcm90b3R5cGUgdG8gVHlwZVN0eWxlLiAgSXQgbWlnaHQgYmUgYmV0dGVyIHRvIGRvIGEgZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzLnN0eWxlLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyl9XHJcbiAgICAgICAgdGhpcy5zdHlsZSA9IHRoaXMuc3R5bGUuYmluZCh0aGlzKTtcclxuICAgIH1cclxuICAgIC8qKlxyXG4gICAgICogT25seSBjYWxscyBjYiBhbGwgc3luYyBvcGVyYXRpb25zIHNldHRsZVxyXG4gICAgICovXHJcbiAgICBUeXBlU3R5bGUucHJvdG90eXBlLl9hZnRlckFsbFN5bmMgPSBmdW5jdGlvbiAoY2IpIHtcclxuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xyXG4gICAgICAgIHRoaXMuX3BlbmRpbmcrKztcclxuICAgICAgICB2YXIgcGVuZGluZyA9IHRoaXMuX3BlbmRpbmc7XHJcbiAgICAgICAgdXRpbGl0aWVzXzEucmFmKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgaWYgKHBlbmRpbmcgIT09IF90aGlzLl9wZW5kaW5nKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY2IoKTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcbiAgICBUeXBlU3R5bGUucHJvdG90eXBlLl9nZXRUYWcgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuX3RhZykge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fdGFnO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5fYXV0b0dlbmVyYXRlVGFnKSB7XHJcbiAgICAgICAgICAgIHZhciB0YWcgPSB0eXBlb2Ygd2luZG93ID09PSAndW5kZWZpbmVkJ1xyXG4gICAgICAgICAgICAgICAgPyB7IHRleHRDb250ZW50OiAnJyB9XHJcbiAgICAgICAgICAgICAgICA6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZG9jdW1lbnQgIT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHRhZyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5fdGFnID0gdGFnO1xyXG4gICAgICAgICAgICByZXR1cm4gdGFnO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgfTtcclxuICAgIC8qKiBDaGVja3MgaWYgdGhlIHN0eWxlIHRhZyBuZWVkcyB1cGRhdGluZyBhbmQgaWYgc28gcXVldWVzIHVwIHRoZSBjaGFuZ2UgKi9cclxuICAgIFR5cGVTdHlsZS5wcm90b3R5cGUuX3N0eWxlVXBkYXRlZCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xyXG4gICAgICAgIHZhciBjaGFuZ2VJZCA9IHRoaXMuX2ZyZWVTdHlsZS5jaGFuZ2VJZDtcclxuICAgICAgICB2YXIgbGFzdENoYW5nZUlkID0gdGhpcy5fbGFzdEZyZWVTdHlsZUNoYW5nZUlkO1xyXG4gICAgICAgIGlmICghdGhpcy5fcGVuZGluZ1Jhd0NoYW5nZSAmJiBjaGFuZ2VJZCA9PT0gbGFzdENoYW5nZUlkKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5fbGFzdEZyZWVTdHlsZUNoYW5nZUlkID0gY2hhbmdlSWQ7XHJcbiAgICAgICAgdGhpcy5fcGVuZGluZ1Jhd0NoYW5nZSA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMuX2FmdGVyQWxsU3luYyhmdW5jdGlvbiAoKSB7IHJldHVybiBfdGhpcy5mb3JjZVJlbmRlclN0eWxlcygpOyB9KTtcclxuICAgIH07XHJcbiAgICBUeXBlU3R5bGUucHJvdG90eXBlLnN0eWxlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBmcmVlU3R5bGUgPSB0aGlzLl9mcmVlU3R5bGU7XHJcbiAgICAgICAgdmFyIF9hID0gZm9ybWF0dGluZ18xLmVuc3VyZVN0cmluZ09iaih1dGlsaXRpZXNfMS5leHRlbmQuYXBwbHkodW5kZWZpbmVkLCBhcmd1bWVudHMpKSwgcmVzdWx0ID0gX2EucmVzdWx0LCBkZWJ1Z05hbWUgPSBfYS5kZWJ1Z05hbWU7XHJcbiAgICAgICAgdmFyIGNsYXNzTmFtZSA9IGRlYnVnTmFtZSA/IGZyZWVTdHlsZS5yZWdpc3RlclN0eWxlKHJlc3VsdCwgZGVidWdOYW1lKSA6IGZyZWVTdHlsZS5yZWdpc3RlclN0eWxlKHJlc3VsdCk7XHJcbiAgICAgICAgdGhpcy5fc3R5bGVVcGRhdGVkKCk7XHJcbiAgICAgICAgcmV0dXJuIGNsYXNzTmFtZTtcclxuICAgIH07XHJcbiAgICByZXR1cm4gVHlwZVN0eWxlO1xyXG59KCkpO1xyXG5leHBvcnRzLlR5cGVTdHlsZSA9IFR5cGVTdHlsZTtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuLyoqIFJhZiBmb3Igbm9kZSArIGJyb3dzZXIgKi9cclxuZXhwb3J0cy5yYWYgPSB0eXBlb2YgcmVxdWVzdEFuaW1hdGlvbkZyYW1lID09PSAndW5kZWZpbmVkJ1xyXG4gICAgLyoqXHJcbiAgICAgKiBNYWtlIHN1cmUgc2V0VGltZW91dCBpcyBhbHdheXMgaW52b2tlZCB3aXRoXHJcbiAgICAgKiBgdGhpc2Agc2V0IHRvIGB3aW5kb3dgIG9yIGBnbG9iYWxgIGF1dG9tYXRpY2FsbHlcclxuICAgICAqKi9cclxuICAgID8gZnVuY3Rpb24gKGNiKSB7IHJldHVybiBzZXRUaW1lb3V0KGNiKTsgfVxyXG4gICAgLyoqXHJcbiAgICAgKiBNYWtlIHN1cmUgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSBpcyBhbHdheXMgaW52b2tlZCB3aXRoIGB0aGlzYCB3aW5kb3dcclxuICAgICAqIFdlIG1pZ2h0IGhhdmUgcmFmIHdpdGhvdXQgd2luZG93IGluIGNhc2Ugb2YgYHJhZi9wb2x5ZmlsbGAgKHJlY29tbWVuZGVkIGJ5IFJlYWN0KVxyXG4gICAgICoqL1xyXG4gICAgOiB0eXBlb2Ygd2luZG93ID09PSAndW5kZWZpbmVkJ1xyXG4gICAgICAgID8gcmVxdWVzdEFuaW1hdGlvbkZyYW1lXHJcbiAgICAgICAgOiByZXF1ZXN0QW5pbWF0aW9uRnJhbWUuYmluZCh3aW5kb3cpO1xyXG4vKipcclxuICogVXRpbGl0eSB0byBqb2luIGNsYXNzZXMgY29uZGl0aW9uYWxseVxyXG4gKi9cclxuZnVuY3Rpb24gY2xhc3NlcygpIHtcclxuICAgIHZhciBjbGFzc2VzID0gW107XHJcbiAgICBmb3IgKHZhciBfaSA9IDA7IF9pIDwgYXJndW1lbnRzLmxlbmd0aDsgX2krKykge1xyXG4gICAgICAgIGNsYXNzZXNbX2ldID0gYXJndW1lbnRzW19pXTtcclxuICAgIH1cclxuICAgIHJldHVybiBjbGFzc2VzLmZpbHRlcihmdW5jdGlvbiAoYykgeyByZXR1cm4gISFjOyB9KS5qb2luKCcgJyk7XHJcbn1cclxuZXhwb3J0cy5jbGFzc2VzID0gY2xhc3NlcztcclxuLyoqXHJcbiAqIE1lcmdlcyB2YXJpb3VzIHN0eWxlcyBpbnRvIGEgc2luZ2xlIHN0eWxlIG9iamVjdC5cclxuICogTm90ZTogaWYgdHdvIG9iamVjdHMgaGF2ZSB0aGUgc2FtZSBwcm9wZXJ0eSB0aGUgbGFzdCBvbmUgd2luc1xyXG4gKi9cclxuZnVuY3Rpb24gZXh0ZW5kKCkge1xyXG4gICAgdmFyIG9iamVjdHMgPSBbXTtcclxuICAgIGZvciAodmFyIF9pID0gMDsgX2kgPCBhcmd1bWVudHMubGVuZ3RoOyBfaSsrKSB7XHJcbiAgICAgICAgb2JqZWN0c1tfaV0gPSBhcmd1bWVudHNbX2ldO1xyXG4gICAgfVxyXG4gICAgLyoqIFRoZSBmaW5hbCByZXN1bHQgd2Ugd2lsbCByZXR1cm4gKi9cclxuICAgIHZhciByZXN1bHQgPSB7fTtcclxuICAgIGZvciAodmFyIF9hID0gMCwgb2JqZWN0c18xID0gb2JqZWN0czsgX2EgPCBvYmplY3RzXzEubGVuZ3RoOyBfYSsrKSB7XHJcbiAgICAgICAgdmFyIG9iamVjdCA9IG9iamVjdHNfMVtfYV07XHJcbiAgICAgICAgaWYgKG9iamVjdCA9PSBudWxsIHx8IG9iamVjdCA9PT0gZmFsc2UpIHtcclxuICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZvciAodmFyIGtleSBpbiBvYmplY3QpIHtcclxuICAgICAgICAgICAgLyoqIEZhbHN5IHZhbHVlcyBleGNlcHQgYSBleHBsaWNpdCAwIGlzIGlnbm9yZWQgKi9cclxuICAgICAgICAgICAgdmFyIHZhbCA9IG9iamVjdFtrZXldO1xyXG4gICAgICAgICAgICBpZiAoIXZhbCAmJiB2YWwgIT09IDApIHtcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8qKiBpZiBuZXN0ZWQgbWVkaWEgb3IgcHNldWRvIHNlbGVjdG9yICovXHJcbiAgICAgICAgICAgIGlmIChrZXkgPT09ICckbmVzdCcgJiYgdmFsKSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHRba2V5XSA9IHJlc3VsdFsnJG5lc3QnXSA/IGV4dGVuZChyZXN1bHRbJyRuZXN0J10sIHZhbCkgOiB2YWw7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSBpZiAoKGtleS5pbmRleE9mKCcmJykgIT09IC0xIHx8IGtleS5pbmRleE9mKCdAbWVkaWEnKSA9PT0gMCkpIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdFtrZXldID0gcmVzdWx0W2tleV0gPyBleHRlbmQocmVzdWx0W2tleV0sIHZhbCkgOiB2YWw7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHRba2V5XSA9IHZhbDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiByZXN1bHQ7XHJcbn1cclxuZXhwb3J0cy5leHRlbmQgPSBleHRlbmQ7XHJcbi8qKlxyXG4gKiBVdGlsaXR5IHRvIGhlbHAgY3VzdG9taXplIHN0eWxlcyB3aXRoIG1lZGlhIHF1ZXJpZXMuIGUuZy5cclxuICogYGBgXHJcbiAqIHN0eWxlKFxyXG4gKiAgbWVkaWEoe21heFdpZHRoOjUwMH0sIHtjb2xvcjoncmVkJ30pXHJcbiAqIClcclxuICogYGBgXHJcbiAqL1xyXG5leHBvcnRzLm1lZGlhID0gZnVuY3Rpb24gKG1lZGlhUXVlcnkpIHtcclxuICAgIHZhciBvYmplY3RzID0gW107XHJcbiAgICBmb3IgKHZhciBfaSA9IDE7IF9pIDwgYXJndW1lbnRzLmxlbmd0aDsgX2krKykge1xyXG4gICAgICAgIG9iamVjdHNbX2kgLSAxXSA9IGFyZ3VtZW50c1tfaV07XHJcbiAgICB9XHJcbiAgICB2YXIgbWVkaWFRdWVyeVNlY3Rpb25zID0gW107XHJcbiAgICBpZiAobWVkaWFRdWVyeS50eXBlKVxyXG4gICAgICAgIG1lZGlhUXVlcnlTZWN0aW9ucy5wdXNoKG1lZGlhUXVlcnkudHlwZSk7XHJcbiAgICBpZiAobWVkaWFRdWVyeS5vcmllbnRhdGlvbilcclxuICAgICAgICBtZWRpYVF1ZXJ5U2VjdGlvbnMucHVzaChcIihvcmllbnRhdGlvbjogXCIgKyBtZWRpYVF1ZXJ5Lm9yaWVudGF0aW9uICsgXCIpXCIpO1xyXG4gICAgaWYgKG1lZGlhUXVlcnkubWluV2lkdGgpXHJcbiAgICAgICAgbWVkaWFRdWVyeVNlY3Rpb25zLnB1c2goXCIobWluLXdpZHRoOiBcIiArIG1lZGlhTGVuZ3RoKG1lZGlhUXVlcnkubWluV2lkdGgpICsgXCIpXCIpO1xyXG4gICAgaWYgKG1lZGlhUXVlcnkubWF4V2lkdGgpXHJcbiAgICAgICAgbWVkaWFRdWVyeVNlY3Rpb25zLnB1c2goXCIobWF4LXdpZHRoOiBcIiArIG1lZGlhTGVuZ3RoKG1lZGlhUXVlcnkubWF4V2lkdGgpICsgXCIpXCIpO1xyXG4gICAgaWYgKG1lZGlhUXVlcnkubWluSGVpZ2h0KVxyXG4gICAgICAgIG1lZGlhUXVlcnlTZWN0aW9ucy5wdXNoKFwiKG1pbi1oZWlnaHQ6IFwiICsgbWVkaWFMZW5ndGgobWVkaWFRdWVyeS5taW5IZWlnaHQpICsgXCIpXCIpO1xyXG4gICAgaWYgKG1lZGlhUXVlcnkubWF4SGVpZ2h0KVxyXG4gICAgICAgIG1lZGlhUXVlcnlTZWN0aW9ucy5wdXNoKFwiKG1heC1oZWlnaHQ6IFwiICsgbWVkaWFMZW5ndGgobWVkaWFRdWVyeS5tYXhIZWlnaHQpICsgXCIpXCIpO1xyXG4gICAgdmFyIHN0cmluZ01lZGlhUXVlcnkgPSBcIkBtZWRpYSBcIiArIG1lZGlhUXVlcnlTZWN0aW9ucy5qb2luKCcgYW5kICcpO1xyXG4gICAgdmFyIG9iamVjdCA9IHtcclxuICAgICAgICAkbmVzdDogKF9hID0ge30sXHJcbiAgICAgICAgICAgIF9hW3N0cmluZ01lZGlhUXVlcnldID0gZXh0ZW5kLmFwcGx5KHZvaWQgMCwgb2JqZWN0cyksXHJcbiAgICAgICAgICAgIF9hKVxyXG4gICAgfTtcclxuICAgIHJldHVybiBvYmplY3Q7XHJcbiAgICB2YXIgX2E7XHJcbn07XHJcbnZhciBtZWRpYUxlbmd0aCA9IGZ1bmN0aW9uICh2YWx1ZSkge1xyXG4gICAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycgPyB2YWx1ZSA6IHZhbHVlICsgXCJweFwiO1xyXG59O1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG4iLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5cbnZhciBfdHlwZW9mID0gdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIHR5cGVvZiBTeW1ib2wuaXRlcmF0b3IgPT09IFwic3ltYm9sXCIgPyBmdW5jdGlvbiAob2JqKSB7IHJldHVybiB0eXBlb2Ygb2JqOyB9IDogZnVuY3Rpb24gKG9iaikgeyByZXR1cm4gb2JqICYmIHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiBvYmouY29uc3RydWN0b3IgPT09IFN5bWJvbCAmJiBvYmogIT09IFN5bWJvbC5wcm90b3R5cGUgPyBcInN5bWJvbFwiIDogdHlwZW9mIG9iajsgfTtcblxudmFyIHZhbHVlRXF1YWwgPSBmdW5jdGlvbiB2YWx1ZUVxdWFsKGEsIGIpIHtcbiAgaWYgKGEgPT09IGIpIHJldHVybiB0cnVlO1xuXG4gIGlmIChhID09IG51bGwgfHwgYiA9PSBudWxsKSByZXR1cm4gZmFsc2U7XG5cbiAgaWYgKEFycmF5LmlzQXJyYXkoYSkpIHJldHVybiBBcnJheS5pc0FycmF5KGIpICYmIGEubGVuZ3RoID09PSBiLmxlbmd0aCAmJiBhLmV2ZXJ5KGZ1bmN0aW9uIChpdGVtLCBpbmRleCkge1xuICAgIHJldHVybiB2YWx1ZUVxdWFsKGl0ZW0sIGJbaW5kZXhdKTtcbiAgfSk7XG5cbiAgdmFyIGFUeXBlID0gdHlwZW9mIGEgPT09ICd1bmRlZmluZWQnID8gJ3VuZGVmaW5lZCcgOiBfdHlwZW9mKGEpO1xuICB2YXIgYlR5cGUgPSB0eXBlb2YgYiA9PT0gJ3VuZGVmaW5lZCcgPyAndW5kZWZpbmVkJyA6IF90eXBlb2YoYik7XG5cbiAgaWYgKGFUeXBlICE9PSBiVHlwZSkgcmV0dXJuIGZhbHNlO1xuXG4gIGlmIChhVHlwZSA9PT0gJ29iamVjdCcpIHtcbiAgICB2YXIgYVZhbHVlID0gYS52YWx1ZU9mKCk7XG4gICAgdmFyIGJWYWx1ZSA9IGIudmFsdWVPZigpO1xuXG4gICAgaWYgKGFWYWx1ZSAhPT0gYSB8fCBiVmFsdWUgIT09IGIpIHJldHVybiB2YWx1ZUVxdWFsKGFWYWx1ZSwgYlZhbHVlKTtcblxuICAgIHZhciBhS2V5cyA9IE9iamVjdC5rZXlzKGEpO1xuICAgIHZhciBiS2V5cyA9IE9iamVjdC5rZXlzKGIpO1xuXG4gICAgaWYgKGFLZXlzLmxlbmd0aCAhPT0gYktleXMubGVuZ3RoKSByZXR1cm4gZmFsc2U7XG5cbiAgICByZXR1cm4gYUtleXMuZXZlcnkoZnVuY3Rpb24gKGtleSkge1xuICAgICAgcmV0dXJuIHZhbHVlRXF1YWwoYVtrZXldLCBiW2tleV0pO1xuICAgIH0pO1xuICB9XG5cbiAgcmV0dXJuIGZhbHNlO1xufTtcblxuZXhwb3J0cy5kZWZhdWx0ID0gdmFsdWVFcXVhbDsiLCIvKipcbiAqIENvcHlyaWdodCAyMDE0LTIwMTUsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIEJTRC1zdHlsZSBsaWNlbnNlIGZvdW5kIGluIHRoZVxuICogTElDRU5TRSBmaWxlIGluIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLiBBbiBhZGRpdGlvbmFsIGdyYW50XG4gKiBvZiBwYXRlbnQgcmlnaHRzIGNhbiBiZSBmb3VuZCBpbiB0aGUgUEFURU5UUyBmaWxlIGluIHRoZSBzYW1lIGRpcmVjdG9yeS5cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbi8qKlxuICogU2ltaWxhciB0byBpbnZhcmlhbnQgYnV0IG9ubHkgbG9ncyBhIHdhcm5pbmcgaWYgdGhlIGNvbmRpdGlvbiBpcyBub3QgbWV0LlxuICogVGhpcyBjYW4gYmUgdXNlZCB0byBsb2cgaXNzdWVzIGluIGRldmVsb3BtZW50IGVudmlyb25tZW50cyBpbiBjcml0aWNhbFxuICogcGF0aHMuIFJlbW92aW5nIHRoZSBsb2dnaW5nIGNvZGUgZm9yIHByb2R1Y3Rpb24gZW52aXJvbm1lbnRzIHdpbGwga2VlcCB0aGVcbiAqIHNhbWUgbG9naWMgYW5kIGZvbGxvdyB0aGUgc2FtZSBjb2RlIHBhdGhzLlxuICovXG5cbnZhciB3YXJuaW5nID0gZnVuY3Rpb24oKSB7fTtcblxuaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgd2FybmluZyA9IGZ1bmN0aW9uKGNvbmRpdGlvbiwgZm9ybWF0LCBhcmdzKSB7XG4gICAgdmFyIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgYXJncyA9IG5ldyBBcnJheShsZW4gPiAyID8gbGVuIC0gMiA6IDApO1xuICAgIGZvciAodmFyIGtleSA9IDI7IGtleSA8IGxlbjsga2V5KyspIHtcbiAgICAgIGFyZ3Nba2V5IC0gMl0gPSBhcmd1bWVudHNba2V5XTtcbiAgICB9XG4gICAgaWYgKGZvcm1hdCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICdgd2FybmluZyhjb25kaXRpb24sIGZvcm1hdCwgLi4uYXJncylgIHJlcXVpcmVzIGEgd2FybmluZyAnICtcbiAgICAgICAgJ21lc3NhZ2UgYXJndW1lbnQnXG4gICAgICApO1xuICAgIH1cblxuICAgIGlmIChmb3JtYXQubGVuZ3RoIDwgMTAgfHwgKC9eW3NcXFddKiQvKS50ZXN0KGZvcm1hdCkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgJ1RoZSB3YXJuaW5nIGZvcm1hdCBzaG91bGQgYmUgYWJsZSB0byB1bmlxdWVseSBpZGVudGlmeSB0aGlzICcgK1xuICAgICAgICAnd2FybmluZy4gUGxlYXNlLCB1c2UgYSBtb3JlIGRlc2NyaXB0aXZlIGZvcm1hdCB0aGFuOiAnICsgZm9ybWF0XG4gICAgICApO1xuICAgIH1cblxuICAgIGlmICghY29uZGl0aW9uKSB7XG4gICAgICB2YXIgYXJnSW5kZXggPSAwO1xuICAgICAgdmFyIG1lc3NhZ2UgPSAnV2FybmluZzogJyArXG4gICAgICAgIGZvcm1hdC5yZXBsYWNlKC8lcy9nLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICByZXR1cm4gYXJnc1thcmdJbmRleCsrXTtcbiAgICAgICAgfSk7XG4gICAgICBpZiAodHlwZW9mIGNvbnNvbGUgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IobWVzc2FnZSk7XG4gICAgICB9XG4gICAgICB0cnkge1xuICAgICAgICAvLyBUaGlzIGVycm9yIHdhcyB0aHJvd24gYXMgYSBjb252ZW5pZW5jZSBzbyB0aGF0IHlvdSBjYW4gdXNlIHRoaXMgc3RhY2tcbiAgICAgICAgLy8gdG8gZmluZCB0aGUgY2FsbHNpdGUgdGhhdCBjYXVzZWQgdGhpcyB3YXJuaW5nIHRvIGZpcmUuXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihtZXNzYWdlKTtcbiAgICAgIH0gY2F0Y2goeCkge31cbiAgICB9XG4gIH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gd2FybmluZztcbiIsIlwidXNlIHN0cmljdFwiO1xudmFyIGluZGV4XzEgPSByZXF1aXJlKFwiLi4vaW5kZXhcIik7XG52YXIgRGVib3VuY2VPcGVyYXRvciA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gRGVib3VuY2VPcGVyYXRvcihkdCwgaW5zKSB7XG4gICAgICAgIHRoaXMuZHQgPSBkdDtcbiAgICAgICAgdGhpcy5pbnMgPSBpbnM7XG4gICAgICAgIHRoaXMudHlwZSA9ICdkZWJvdW5jZSc7XG4gICAgICAgIHRoaXMub3V0ID0gbnVsbDtcbiAgICAgICAgdGhpcy5pZCA9IG51bGw7XG4gICAgfVxuICAgIERlYm91bmNlT3BlcmF0b3IucHJvdG90eXBlLl9zdGFydCA9IGZ1bmN0aW9uIChvdXQpIHtcbiAgICAgICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgICAgIHRoaXMuaW5zLl9hZGQodGhpcyk7XG4gICAgfTtcbiAgICBEZWJvdW5jZU9wZXJhdG9yLnByb3RvdHlwZS5fc3RvcCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5pbnMuX3JlbW92ZSh0aGlzKTtcbiAgICAgICAgdGhpcy5vdXQgPSBudWxsO1xuICAgICAgICB0aGlzLmlkID0gbnVsbDtcbiAgICB9O1xuICAgIERlYm91bmNlT3BlcmF0b3IucHJvdG90eXBlLmNsZWFySW50ZXJ2YWwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBpZCA9IHRoaXMuaWQ7XG4gICAgICAgIGlmIChpZCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChpZCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5pZCA9IG51bGw7XG4gICAgfTtcbiAgICBEZWJvdW5jZU9wZXJhdG9yLnByb3RvdHlwZS5fbiA9IGZ1bmN0aW9uICh0KSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHZhciB1ID0gdGhpcy5vdXQ7XG4gICAgICAgIGlmICghdSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdGhpcy5jbGVhckludGVydmFsKCk7XG4gICAgICAgIHRoaXMuaWQgPSBzZXRJbnRlcnZhbChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBfdGhpcy5jbGVhckludGVydmFsKCk7XG4gICAgICAgICAgICB1Ll9uKHQpO1xuICAgICAgICB9LCB0aGlzLmR0KTtcbiAgICB9O1xuICAgIERlYm91bmNlT3BlcmF0b3IucHJvdG90eXBlLl9lID0gZnVuY3Rpb24gKGVycikge1xuICAgICAgICB2YXIgdSA9IHRoaXMub3V0O1xuICAgICAgICBpZiAoIXUpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHRoaXMuY2xlYXJJbnRlcnZhbCgpO1xuICAgICAgICB1Ll9lKGVycik7XG4gICAgfTtcbiAgICBEZWJvdW5jZU9wZXJhdG9yLnByb3RvdHlwZS5fYyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHUgPSB0aGlzLm91dDtcbiAgICAgICAgaWYgKCF1KVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB0aGlzLmNsZWFySW50ZXJ2YWwoKTtcbiAgICAgICAgdS5fYygpO1xuICAgIH07XG4gICAgcmV0dXJuIERlYm91bmNlT3BlcmF0b3I7XG59KCkpO1xuLyoqXG4gKiBEZWxheXMgZXZlbnRzIHVudGlsIGEgY2VydGFpbiBhbW91bnQgb2Ygc2lsZW5jZSBoYXMgcGFzc2VkLiBJZiB0aGF0IHRpbWVzcGFuXG4gKiBvZiBzaWxlbmNlIGlzIG5vdCBtZXQgdGhlIGV2ZW50IGlzIGRyb3BwZWQuXG4gKlxuICogTWFyYmxlIGRpYWdyYW06XG4gKlxuICogYGBgdGV4dFxuICogLS0xLS0tLTItLTMtLTQtLS0tNXxcbiAqICAgICBkZWJvdW5jZSg2MClcbiAqIC0tLS0tMS0tLS0tLS0tLS00LS18XG4gKiBgYGBcbiAqXG4gKiBFeGFtcGxlOlxuICpcbiAqIGBgYGpzXG4gKiBpbXBvcnQgZnJvbURpYWdyYW0gZnJvbSAneHN0cmVhbS9leHRyYS9mcm9tRGlhZ3JhbSdcbiAqIGltcG9ydCBkZWJvdW5jZSBmcm9tICd4c3RyZWFtL2V4dHJhL2RlYm91bmNlJ1xuICpcbiAqIGNvbnN0IHN0cmVhbSA9IGZyb21EaWFncmFtKCctLTEtLS0tMi0tMy0tNC0tLS01fCcpXG4gKiAgLmNvbXBvc2UoZGVib3VuY2UoNjApKVxuICpcbiAqIHN0cmVhbS5hZGRMaXN0ZW5lcih7XG4gKiAgIG5leHQ6IGkgPT4gY29uc29sZS5sb2coaSksXG4gKiAgIGVycm9yOiBlcnIgPT4gY29uc29sZS5lcnJvcihlcnIpLFxuICogICBjb21wbGV0ZTogKCkgPT4gY29uc29sZS5sb2coJ2NvbXBsZXRlZCcpXG4gKiB9KVxuICogYGBgXG4gKlxuICogYGBgdGV4dFxuICogPiAxXG4gKiA+IDRcbiAqID4gY29tcGxldGVkXG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0ge251bWJlcn0gcGVyaW9kIFRoZSBhbW91bnQgb2Ygc2lsZW5jZSByZXF1aXJlZCBpbiBtaWxsaXNlY29uZHMuXG4gKiBAcmV0dXJuIHtTdHJlYW19XG4gKi9cbmZ1bmN0aW9uIGRlYm91bmNlKHBlcmlvZCkge1xuICAgIHJldHVybiBmdW5jdGlvbiBkZWJvdW5jZU9wZXJhdG9yKGlucykge1xuICAgICAgICByZXR1cm4gbmV3IGluZGV4XzEuU3RyZWFtKG5ldyBEZWJvdW5jZU9wZXJhdG9yKHBlcmlvZCwgaW5zKSk7XG4gICAgfTtcbn1cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuZGVmYXVsdCA9IGRlYm91bmNlO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGVib3VuY2UuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgaW5kZXhfMSA9IHJlcXVpcmUoXCIuLi9pbmRleFwiKTtcbnZhciBlbXB0eSA9IHt9O1xudmFyIERyb3BSZXBlYXRzT3BlcmF0b3IgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIERyb3BSZXBlYXRzT3BlcmF0b3IoaW5zLCBmbikge1xuICAgICAgICB0aGlzLmlucyA9IGlucztcbiAgICAgICAgdGhpcy5mbiA9IGZuO1xuICAgICAgICB0aGlzLnR5cGUgPSAnZHJvcFJlcGVhdHMnO1xuICAgICAgICB0aGlzLm91dCA9IG51bGw7XG4gICAgICAgIHRoaXMudiA9IGVtcHR5O1xuICAgIH1cbiAgICBEcm9wUmVwZWF0c09wZXJhdG9yLnByb3RvdHlwZS5fc3RhcnQgPSBmdW5jdGlvbiAob3V0KSB7XG4gICAgICAgIHRoaXMub3V0ID0gb3V0O1xuICAgICAgICB0aGlzLmlucy5fYWRkKHRoaXMpO1xuICAgIH07XG4gICAgRHJvcFJlcGVhdHNPcGVyYXRvci5wcm90b3R5cGUuX3N0b3AgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuaW5zLl9yZW1vdmUodGhpcyk7XG4gICAgICAgIHRoaXMub3V0ID0gbnVsbDtcbiAgICAgICAgdGhpcy52ID0gZW1wdHk7XG4gICAgfTtcbiAgICBEcm9wUmVwZWF0c09wZXJhdG9yLnByb3RvdHlwZS5pc0VxID0gZnVuY3Rpb24gKHgsIHkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZm4gPyB0aGlzLmZuKHgsIHkpIDogeCA9PT0geTtcbiAgICB9O1xuICAgIERyb3BSZXBlYXRzT3BlcmF0b3IucHJvdG90eXBlLl9uID0gZnVuY3Rpb24gKHQpIHtcbiAgICAgICAgdmFyIHUgPSB0aGlzLm91dDtcbiAgICAgICAgaWYgKCF1KVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB2YXIgdiA9IHRoaXMudjtcbiAgICAgICAgaWYgKHYgIT09IGVtcHR5ICYmIHRoaXMuaXNFcSh0LCB2KSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdGhpcy52ID0gdDtcbiAgICAgICAgdS5fbih0KTtcbiAgICB9O1xuICAgIERyb3BSZXBlYXRzT3BlcmF0b3IucHJvdG90eXBlLl9lID0gZnVuY3Rpb24gKGVycikge1xuICAgICAgICB2YXIgdSA9IHRoaXMub3V0O1xuICAgICAgICBpZiAoIXUpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHUuX2UoZXJyKTtcbiAgICB9O1xuICAgIERyb3BSZXBlYXRzT3BlcmF0b3IucHJvdG90eXBlLl9jID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgdSA9IHRoaXMub3V0O1xuICAgICAgICBpZiAoIXUpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHUuX2MoKTtcbiAgICB9O1xuICAgIHJldHVybiBEcm9wUmVwZWF0c09wZXJhdG9yO1xufSgpKTtcbmV4cG9ydHMuRHJvcFJlcGVhdHNPcGVyYXRvciA9IERyb3BSZXBlYXRzT3BlcmF0b3I7XG4vKipcbiAqIERyb3BzIGNvbnNlY3V0aXZlIGR1cGxpY2F0ZSB2YWx1ZXMgaW4gYSBzdHJlYW0uXG4gKlxuICogTWFyYmxlIGRpYWdyYW06XG4gKlxuICogYGBgdGV4dFxuICogLS0xLS0yLS0xLS0xLS0xLS0yLS0zLS00LS0zLS0zfFxuICogICAgIGRyb3BSZXBlYXRzXG4gKiAtLTEtLTItLTEtLS0tLS0tLTItLTMtLTQtLTMtLS18XG4gKiBgYGBcbiAqXG4gKiBFeGFtcGxlOlxuICpcbiAqIGBgYGpzXG4gKiBpbXBvcnQgZHJvcFJlcGVhdHMgZnJvbSAneHN0cmVhbS9leHRyYS9kcm9wUmVwZWF0cydcbiAqXG4gKiBjb25zdCBzdHJlYW0gPSB4cy5vZigxLCAyLCAxLCAxLCAxLCAyLCAzLCA0LCAzLCAzKVxuICogICAuY29tcG9zZShkcm9wUmVwZWF0cygpKVxuICpcbiAqIHN0cmVhbS5hZGRMaXN0ZW5lcih7XG4gKiAgIG5leHQ6IGkgPT4gY29uc29sZS5sb2coaSksXG4gKiAgIGVycm9yOiBlcnIgPT4gY29uc29sZS5lcnJvcihlcnIpLFxuICogICBjb21wbGV0ZTogKCkgPT4gY29uc29sZS5sb2coJ2NvbXBsZXRlZCcpXG4gKiB9KVxuICogYGBgXG4gKlxuICogYGBgdGV4dFxuICogPiAxXG4gKiA+IDJcbiAqID4gMVxuICogPiAyXG4gKiA+IDNcbiAqID4gNFxuICogPiAzXG4gKiA+IGNvbXBsZXRlZFxuICogYGBgXG4gKlxuICogRXhhbXBsZSB3aXRoIGEgY3VzdG9tIGlzRXF1YWwgZnVuY3Rpb246XG4gKlxuICogYGBganNcbiAqIGltcG9ydCBkcm9wUmVwZWF0cyBmcm9tICd4c3RyZWFtL2V4dHJhL2Ryb3BSZXBlYXRzJ1xuICpcbiAqIGNvbnN0IHN0cmVhbSA9IHhzLm9mKCdhJywgJ2InLCAnYScsICdBJywgJ0InLCAnYicpXG4gKiAgIC5jb21wb3NlKGRyb3BSZXBlYXRzKCh4LCB5KSA9PiB4LnRvTG93ZXJDYXNlKCkgPT09IHkudG9Mb3dlckNhc2UoKSkpXG4gKlxuICogc3RyZWFtLmFkZExpc3RlbmVyKHtcbiAqICAgbmV4dDogaSA9PiBjb25zb2xlLmxvZyhpKSxcbiAqICAgZXJyb3I6IGVyciA9PiBjb25zb2xlLmVycm9yKGVyciksXG4gKiAgIGNvbXBsZXRlOiAoKSA9PiBjb25zb2xlLmxvZygnY29tcGxldGVkJylcbiAqIH0pXG4gKiBgYGBcbiAqXG4gKiBgYGB0ZXh0XG4gKiA+IGFcbiAqID4gYlxuICogPiBhXG4gKiA+IEJcbiAqID4gY29tcGxldGVkXG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBpc0VxdWFsIEFuIG9wdGlvbmFsIGZ1bmN0aW9uIG9mIHR5cGVcbiAqIGAoeDogVCwgeTogVCkgPT4gYm9vbGVhbmAgdGhhdCB0YWtlcyBhbiBldmVudCBmcm9tIHRoZSBpbnB1dCBzdHJlYW0gYW5kXG4gKiBjaGVja3MgaWYgaXQgaXMgZXF1YWwgdG8gcHJldmlvdXMgZXZlbnQsIGJ5IHJldHVybmluZyBhIGJvb2xlYW4uXG4gKiBAcmV0dXJuIHtTdHJlYW19XG4gKi9cbmZ1bmN0aW9uIGRyb3BSZXBlYXRzKGlzRXF1YWwpIHtcbiAgICBpZiAoaXNFcXVhbCA9PT0gdm9pZCAwKSB7IGlzRXF1YWwgPSB2b2lkIDA7IH1cbiAgICByZXR1cm4gZnVuY3Rpb24gZHJvcFJlcGVhdHNPcGVyYXRvcihpbnMpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBpbmRleF8xLlN0cmVhbShuZXcgRHJvcFJlcGVhdHNPcGVyYXRvcihpbnMsIGlzRXF1YWwpKTtcbiAgICB9O1xufVxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5kZWZhdWx0ID0gZHJvcFJlcGVhdHM7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1kcm9wUmVwZWF0cy5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbnZhciBfX2V4dGVuZHMgPSAodGhpcyAmJiB0aGlzLl9fZXh0ZW5kcykgfHwgZnVuY3Rpb24gKGQsIGIpIHtcbiAgICBmb3IgKHZhciBwIGluIGIpIGlmIChiLmhhc093blByb3BlcnR5KHApKSBkW3BdID0gYltwXTtcbiAgICBmdW5jdGlvbiBfXygpIHsgdGhpcy5jb25zdHJ1Y3RvciA9IGQ7IH1cbiAgICBkLnByb3RvdHlwZSA9IGIgPT09IG51bGwgPyBPYmplY3QuY3JlYXRlKGIpIDogKF9fLnByb3RvdHlwZSA9IGIucHJvdG90eXBlLCBuZXcgX18oKSk7XG59O1xudmFyIHN5bWJvbF9vYnNlcnZhYmxlXzEgPSByZXF1aXJlKFwic3ltYm9sLW9ic2VydmFibGVcIik7XG52YXIgTk8gPSB7fTtcbmV4cG9ydHMuTk8gPSBOTztcbmZ1bmN0aW9uIG5vb3AoKSB7IH1cbmZ1bmN0aW9uIGNwKGEpIHtcbiAgICB2YXIgbCA9IGEubGVuZ3RoO1xuICAgIHZhciBiID0gQXJyYXkobCk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsOyArK2kpXG4gICAgICAgIGJbaV0gPSBhW2ldO1xuICAgIHJldHVybiBiO1xufVxuZnVuY3Rpb24gYW5kKGYxLCBmMikge1xuICAgIHJldHVybiBmdW5jdGlvbiBhbmRGbih0KSB7XG4gICAgICAgIHJldHVybiBmMSh0KSAmJiBmMih0KTtcbiAgICB9O1xufVxuZnVuY3Rpb24gX3RyeShjLCB0LCB1KSB7XG4gICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIGMuZih0KTtcbiAgICB9XG4gICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgdS5fZShlKTtcbiAgICAgICAgcmV0dXJuIE5PO1xuICAgIH1cbn1cbnZhciBOT19JTCA9IHtcbiAgICBfbjogbm9vcCxcbiAgICBfZTogbm9vcCxcbiAgICBfYzogbm9vcCxcbn07XG5leHBvcnRzLk5PX0lMID0gTk9fSUw7XG4vLyBtdXRhdGVzIHRoZSBpbnB1dFxuZnVuY3Rpb24gaW50ZXJuYWxpemVQcm9kdWNlcihwcm9kdWNlcikge1xuICAgIHByb2R1Y2VyLl9zdGFydCA9IGZ1bmN0aW9uIF9zdGFydChpbCkge1xuICAgICAgICBpbC5uZXh0ID0gaWwuX247XG4gICAgICAgIGlsLmVycm9yID0gaWwuX2U7XG4gICAgICAgIGlsLmNvbXBsZXRlID0gaWwuX2M7XG4gICAgICAgIHRoaXMuc3RhcnQoaWwpO1xuICAgIH07XG4gICAgcHJvZHVjZXIuX3N0b3AgPSBwcm9kdWNlci5zdG9wO1xufVxudmFyIFN0cmVhbVN1YiA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gU3RyZWFtU3ViKF9zdHJlYW0sIF9saXN0ZW5lcikge1xuICAgICAgICB0aGlzLl9zdHJlYW0gPSBfc3RyZWFtO1xuICAgICAgICB0aGlzLl9saXN0ZW5lciA9IF9saXN0ZW5lcjtcbiAgICB9XG4gICAgU3RyZWFtU3ViLnByb3RvdHlwZS51bnN1YnNjcmliZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5fc3RyZWFtLnJlbW92ZUxpc3RlbmVyKHRoaXMuX2xpc3RlbmVyKTtcbiAgICB9O1xuICAgIHJldHVybiBTdHJlYW1TdWI7XG59KCkpO1xudmFyIE9ic2VydmVyID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBPYnNlcnZlcihfbGlzdGVuZXIpIHtcbiAgICAgICAgdGhpcy5fbGlzdGVuZXIgPSBfbGlzdGVuZXI7XG4gICAgfVxuICAgIE9ic2VydmVyLnByb3RvdHlwZS5uZXh0ID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIHRoaXMuX2xpc3RlbmVyLl9uKHZhbHVlKTtcbiAgICB9O1xuICAgIE9ic2VydmVyLnByb3RvdHlwZS5lcnJvciA9IGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgdGhpcy5fbGlzdGVuZXIuX2UoZXJyKTtcbiAgICB9O1xuICAgIE9ic2VydmVyLnByb3RvdHlwZS5jb21wbGV0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5fbGlzdGVuZXIuX2MoKTtcbiAgICB9O1xuICAgIHJldHVybiBPYnNlcnZlcjtcbn0oKSk7XG52YXIgRnJvbU9ic2VydmFibGUgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIEZyb21PYnNlcnZhYmxlKG9ic2VydmFibGUpIHtcbiAgICAgICAgdGhpcy50eXBlID0gJ2Zyb21PYnNlcnZhYmxlJztcbiAgICAgICAgdGhpcy5pbnMgPSBvYnNlcnZhYmxlO1xuICAgICAgICB0aGlzLmFjdGl2ZSA9IGZhbHNlO1xuICAgIH1cbiAgICBGcm9tT2JzZXJ2YWJsZS5wcm90b3R5cGUuX3N0YXJ0ID0gZnVuY3Rpb24gKG91dCkge1xuICAgICAgICB0aGlzLm91dCA9IG91dDtcbiAgICAgICAgdGhpcy5hY3RpdmUgPSB0cnVlO1xuICAgICAgICB0aGlzLl9zdWIgPSB0aGlzLmlucy5zdWJzY3JpYmUobmV3IE9ic2VydmVyKG91dCkpO1xuICAgICAgICBpZiAoIXRoaXMuYWN0aXZlKVxuICAgICAgICAgICAgdGhpcy5fc3ViLnVuc3Vic2NyaWJlKCk7XG4gICAgfTtcbiAgICBGcm9tT2JzZXJ2YWJsZS5wcm90b3R5cGUuX3N0b3AgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0aGlzLl9zdWIpXG4gICAgICAgICAgICB0aGlzLl9zdWIudW5zdWJzY3JpYmUoKTtcbiAgICAgICAgdGhpcy5hY3RpdmUgPSBmYWxzZTtcbiAgICB9O1xuICAgIHJldHVybiBGcm9tT2JzZXJ2YWJsZTtcbn0oKSk7XG52YXIgTWVyZ2UgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIE1lcmdlKGluc0Fycikge1xuICAgICAgICB0aGlzLnR5cGUgPSAnbWVyZ2UnO1xuICAgICAgICB0aGlzLmluc0FyciA9IGluc0FycjtcbiAgICAgICAgdGhpcy5vdXQgPSBOTztcbiAgICAgICAgdGhpcy5hYyA9IDA7XG4gICAgfVxuICAgIE1lcmdlLnByb3RvdHlwZS5fc3RhcnQgPSBmdW5jdGlvbiAob3V0KSB7XG4gICAgICAgIHRoaXMub3V0ID0gb3V0O1xuICAgICAgICB2YXIgcyA9IHRoaXMuaW5zQXJyO1xuICAgICAgICB2YXIgTCA9IHMubGVuZ3RoO1xuICAgICAgICB0aGlzLmFjID0gTDtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBMOyBpKyspXG4gICAgICAgICAgICBzW2ldLl9hZGQodGhpcyk7XG4gICAgfTtcbiAgICBNZXJnZS5wcm90b3R5cGUuX3N0b3AgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBzID0gdGhpcy5pbnNBcnI7XG4gICAgICAgIHZhciBMID0gcy5sZW5ndGg7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgTDsgaSsrKVxuICAgICAgICAgICAgc1tpXS5fcmVtb3ZlKHRoaXMpO1xuICAgICAgICB0aGlzLm91dCA9IE5PO1xuICAgIH07XG4gICAgTWVyZ2UucHJvdG90eXBlLl9uID0gZnVuY3Rpb24gKHQpIHtcbiAgICAgICAgdmFyIHUgPSB0aGlzLm91dDtcbiAgICAgICAgaWYgKHUgPT09IE5PKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB1Ll9uKHQpO1xuICAgIH07XG4gICAgTWVyZ2UucHJvdG90eXBlLl9lID0gZnVuY3Rpb24gKGVycikge1xuICAgICAgICB2YXIgdSA9IHRoaXMub3V0O1xuICAgICAgICBpZiAodSA9PT0gTk8pXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHUuX2UoZXJyKTtcbiAgICB9O1xuICAgIE1lcmdlLnByb3RvdHlwZS5fYyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKC0tdGhpcy5hYyA8PSAwKSB7XG4gICAgICAgICAgICB2YXIgdSA9IHRoaXMub3V0O1xuICAgICAgICAgICAgaWYgKHUgPT09IE5PKVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIHUuX2MoKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgcmV0dXJuIE1lcmdlO1xufSgpKTtcbnZhciBDb21iaW5lTGlzdGVuZXIgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIENvbWJpbmVMaXN0ZW5lcihpLCBvdXQsIHApIHtcbiAgICAgICAgdGhpcy5pID0gaTtcbiAgICAgICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgICAgIHRoaXMucCA9IHA7XG4gICAgICAgIHAuaWxzLnB1c2godGhpcyk7XG4gICAgfVxuICAgIENvbWJpbmVMaXN0ZW5lci5wcm90b3R5cGUuX24gPSBmdW5jdGlvbiAodCkge1xuICAgICAgICB2YXIgcCA9IHRoaXMucCwgb3V0ID0gdGhpcy5vdXQ7XG4gICAgICAgIGlmIChvdXQgPT09IE5PKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBpZiAocC51cCh0LCB0aGlzLmkpKSB7XG4gICAgICAgICAgICB2YXIgYSA9IHAudmFscztcbiAgICAgICAgICAgIHZhciBsID0gYS5sZW5ndGg7XG4gICAgICAgICAgICB2YXIgYiA9IEFycmF5KGwpO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsOyArK2kpXG4gICAgICAgICAgICAgICAgYltpXSA9IGFbaV07XG4gICAgICAgICAgICBvdXQuX24oYik7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIENvbWJpbmVMaXN0ZW5lci5wcm90b3R5cGUuX2UgPSBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgIHZhciBvdXQgPSB0aGlzLm91dDtcbiAgICAgICAgaWYgKG91dCA9PT0gTk8pXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIG91dC5fZShlcnIpO1xuICAgIH07XG4gICAgQ29tYmluZUxpc3RlbmVyLnByb3RvdHlwZS5fYyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHAgPSB0aGlzLnA7XG4gICAgICAgIGlmIChwLm91dCA9PT0gTk8pXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGlmICgtLXAuTmMgPT09IDApXG4gICAgICAgICAgICBwLm91dC5fYygpO1xuICAgIH07XG4gICAgcmV0dXJuIENvbWJpbmVMaXN0ZW5lcjtcbn0oKSk7XG52YXIgQ29tYmluZSA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gQ29tYmluZShpbnNBcnIpIHtcbiAgICAgICAgdGhpcy50eXBlID0gJ2NvbWJpbmUnO1xuICAgICAgICB0aGlzLmluc0FyciA9IGluc0FycjtcbiAgICAgICAgdGhpcy5vdXQgPSBOTztcbiAgICAgICAgdGhpcy5pbHMgPSBbXTtcbiAgICAgICAgdGhpcy5OYyA9IHRoaXMuTm4gPSAwO1xuICAgICAgICB0aGlzLnZhbHMgPSBbXTtcbiAgICB9XG4gICAgQ29tYmluZS5wcm90b3R5cGUudXAgPSBmdW5jdGlvbiAodCwgaSkge1xuICAgICAgICB2YXIgdiA9IHRoaXMudmFsc1tpXTtcbiAgICAgICAgdmFyIE5uID0gIXRoaXMuTm4gPyAwIDogdiA9PT0gTk8gPyAtLXRoaXMuTm4gOiB0aGlzLk5uO1xuICAgICAgICB0aGlzLnZhbHNbaV0gPSB0O1xuICAgICAgICByZXR1cm4gTm4gPT09IDA7XG4gICAgfTtcbiAgICBDb21iaW5lLnByb3RvdHlwZS5fc3RhcnQgPSBmdW5jdGlvbiAob3V0KSB7XG4gICAgICAgIHRoaXMub3V0ID0gb3V0O1xuICAgICAgICB2YXIgcyA9IHRoaXMuaW5zQXJyO1xuICAgICAgICB2YXIgbiA9IHRoaXMuTmMgPSB0aGlzLk5uID0gcy5sZW5ndGg7XG4gICAgICAgIHZhciB2YWxzID0gdGhpcy52YWxzID0gbmV3IEFycmF5KG4pO1xuICAgICAgICBpZiAobiA9PT0gMCkge1xuICAgICAgICAgICAgb3V0Ll9uKFtdKTtcbiAgICAgICAgICAgIG91dC5fYygpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YWxzW2ldID0gTk87XG4gICAgICAgICAgICAgICAgc1tpXS5fYWRkKG5ldyBDb21iaW5lTGlzdGVuZXIoaSwgb3V0LCB0aGlzKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuICAgIENvbWJpbmUucHJvdG90eXBlLl9zdG9wID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgcyA9IHRoaXMuaW5zQXJyO1xuICAgICAgICB2YXIgbiA9IHMubGVuZ3RoO1xuICAgICAgICB2YXIgaWxzID0gdGhpcy5pbHM7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbjsgaSsrKVxuICAgICAgICAgICAgc1tpXS5fcmVtb3ZlKGlsc1tpXSk7XG4gICAgICAgIHRoaXMub3V0ID0gTk87XG4gICAgICAgIHRoaXMuaWxzID0gW107XG4gICAgICAgIHRoaXMudmFscyA9IFtdO1xuICAgIH07XG4gICAgcmV0dXJuIENvbWJpbmU7XG59KCkpO1xudmFyIEZyb21BcnJheSA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gRnJvbUFycmF5KGEpIHtcbiAgICAgICAgdGhpcy50eXBlID0gJ2Zyb21BcnJheSc7XG4gICAgICAgIHRoaXMuYSA9IGE7XG4gICAgfVxuICAgIEZyb21BcnJheS5wcm90b3R5cGUuX3N0YXJ0ID0gZnVuY3Rpb24gKG91dCkge1xuICAgICAgICB2YXIgYSA9IHRoaXMuYTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIG4gPSBhLmxlbmd0aDsgaSA8IG47IGkrKylcbiAgICAgICAgICAgIG91dC5fbihhW2ldKTtcbiAgICAgICAgb3V0Ll9jKCk7XG4gICAgfTtcbiAgICBGcm9tQXJyYXkucHJvdG90eXBlLl9zdG9wID0gZnVuY3Rpb24gKCkge1xuICAgIH07XG4gICAgcmV0dXJuIEZyb21BcnJheTtcbn0oKSk7XG52YXIgRnJvbVByb21pc2UgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIEZyb21Qcm9taXNlKHApIHtcbiAgICAgICAgdGhpcy50eXBlID0gJ2Zyb21Qcm9taXNlJztcbiAgICAgICAgdGhpcy5vbiA9IGZhbHNlO1xuICAgICAgICB0aGlzLnAgPSBwO1xuICAgIH1cbiAgICBGcm9tUHJvbWlzZS5wcm90b3R5cGUuX3N0YXJ0ID0gZnVuY3Rpb24gKG91dCkge1xuICAgICAgICB2YXIgcHJvZCA9IHRoaXM7XG4gICAgICAgIHRoaXMub24gPSB0cnVlO1xuICAgICAgICB0aGlzLnAudGhlbihmdW5jdGlvbiAodikge1xuICAgICAgICAgICAgaWYgKHByb2Qub24pIHtcbiAgICAgICAgICAgICAgICBvdXQuX24odik7XG4gICAgICAgICAgICAgICAgb3V0Ll9jKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICBvdXQuX2UoZSk7XG4gICAgICAgIH0pLnRoZW4obm9vcCwgZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7IHRocm93IGVycjsgfSk7XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgRnJvbVByb21pc2UucHJvdG90eXBlLl9zdG9wID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLm9uID0gZmFsc2U7XG4gICAgfTtcbiAgICByZXR1cm4gRnJvbVByb21pc2U7XG59KCkpO1xudmFyIFBlcmlvZGljID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBQZXJpb2RpYyhwZXJpb2QpIHtcbiAgICAgICAgdGhpcy50eXBlID0gJ3BlcmlvZGljJztcbiAgICAgICAgdGhpcy5wZXJpb2QgPSBwZXJpb2Q7XG4gICAgICAgIHRoaXMuaW50ZXJ2YWxJRCA9IC0xO1xuICAgICAgICB0aGlzLmkgPSAwO1xuICAgIH1cbiAgICBQZXJpb2RpYy5wcm90b3R5cGUuX3N0YXJ0ID0gZnVuY3Rpb24gKG91dCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIGZ1bmN0aW9uIGludGVydmFsSGFuZGxlcigpIHsgb3V0Ll9uKHNlbGYuaSsrKTsgfVxuICAgICAgICB0aGlzLmludGVydmFsSUQgPSBzZXRJbnRlcnZhbChpbnRlcnZhbEhhbmRsZXIsIHRoaXMucGVyaW9kKTtcbiAgICB9O1xuICAgIFBlcmlvZGljLnByb3RvdHlwZS5fc3RvcCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMuaW50ZXJ2YWxJRCAhPT0gLTEpXG4gICAgICAgICAgICBjbGVhckludGVydmFsKHRoaXMuaW50ZXJ2YWxJRCk7XG4gICAgICAgIHRoaXMuaW50ZXJ2YWxJRCA9IC0xO1xuICAgICAgICB0aGlzLmkgPSAwO1xuICAgIH07XG4gICAgcmV0dXJuIFBlcmlvZGljO1xufSgpKTtcbnZhciBEZWJ1ZyA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gRGVidWcoaW5zLCBhcmcpIHtcbiAgICAgICAgdGhpcy50eXBlID0gJ2RlYnVnJztcbiAgICAgICAgdGhpcy5pbnMgPSBpbnM7XG4gICAgICAgIHRoaXMub3V0ID0gTk87XG4gICAgICAgIHRoaXMucyA9IG5vb3A7XG4gICAgICAgIHRoaXMubCA9ICcnO1xuICAgICAgICBpZiAodHlwZW9mIGFyZyA9PT0gJ3N0cmluZycpXG4gICAgICAgICAgICB0aGlzLmwgPSBhcmc7XG4gICAgICAgIGVsc2UgaWYgKHR5cGVvZiBhcmcgPT09ICdmdW5jdGlvbicpXG4gICAgICAgICAgICB0aGlzLnMgPSBhcmc7XG4gICAgfVxuICAgIERlYnVnLnByb3RvdHlwZS5fc3RhcnQgPSBmdW5jdGlvbiAob3V0KSB7XG4gICAgICAgIHRoaXMub3V0ID0gb3V0O1xuICAgICAgICB0aGlzLmlucy5fYWRkKHRoaXMpO1xuICAgIH07XG4gICAgRGVidWcucHJvdG90eXBlLl9zdG9wID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmlucy5fcmVtb3ZlKHRoaXMpO1xuICAgICAgICB0aGlzLm91dCA9IE5PO1xuICAgIH07XG4gICAgRGVidWcucHJvdG90eXBlLl9uID0gZnVuY3Rpb24gKHQpIHtcbiAgICAgICAgdmFyIHUgPSB0aGlzLm91dDtcbiAgICAgICAgaWYgKHUgPT09IE5PKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB2YXIgcyA9IHRoaXMucywgbCA9IHRoaXMubDtcbiAgICAgICAgaWYgKHMgIT09IG5vb3ApIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgcyh0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgdS5fZShlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChsKVxuICAgICAgICAgICAgY29uc29sZS5sb2cobCArICc6JywgdCk7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHQpO1xuICAgICAgICB1Ll9uKHQpO1xuICAgIH07XG4gICAgRGVidWcucHJvdG90eXBlLl9lID0gZnVuY3Rpb24gKGVycikge1xuICAgICAgICB2YXIgdSA9IHRoaXMub3V0O1xuICAgICAgICBpZiAodSA9PT0gTk8pXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHUuX2UoZXJyKTtcbiAgICB9O1xuICAgIERlYnVnLnByb3RvdHlwZS5fYyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHUgPSB0aGlzLm91dDtcbiAgICAgICAgaWYgKHUgPT09IE5PKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB1Ll9jKCk7XG4gICAgfTtcbiAgICByZXR1cm4gRGVidWc7XG59KCkpO1xudmFyIERyb3AgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIERyb3AobWF4LCBpbnMpIHtcbiAgICAgICAgdGhpcy50eXBlID0gJ2Ryb3AnO1xuICAgICAgICB0aGlzLmlucyA9IGlucztcbiAgICAgICAgdGhpcy5vdXQgPSBOTztcbiAgICAgICAgdGhpcy5tYXggPSBtYXg7XG4gICAgICAgIHRoaXMuZHJvcHBlZCA9IDA7XG4gICAgfVxuICAgIERyb3AucHJvdG90eXBlLl9zdGFydCA9IGZ1bmN0aW9uIChvdXQpIHtcbiAgICAgICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgICAgIHRoaXMuZHJvcHBlZCA9IDA7XG4gICAgICAgIHRoaXMuaW5zLl9hZGQodGhpcyk7XG4gICAgfTtcbiAgICBEcm9wLnByb3RvdHlwZS5fc3RvcCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5pbnMuX3JlbW92ZSh0aGlzKTtcbiAgICAgICAgdGhpcy5vdXQgPSBOTztcbiAgICB9O1xuICAgIERyb3AucHJvdG90eXBlLl9uID0gZnVuY3Rpb24gKHQpIHtcbiAgICAgICAgdmFyIHUgPSB0aGlzLm91dDtcbiAgICAgICAgaWYgKHUgPT09IE5PKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBpZiAodGhpcy5kcm9wcGVkKysgPj0gdGhpcy5tYXgpXG4gICAgICAgICAgICB1Ll9uKHQpO1xuICAgIH07XG4gICAgRHJvcC5wcm90b3R5cGUuX2UgPSBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgIHZhciB1ID0gdGhpcy5vdXQ7XG4gICAgICAgIGlmICh1ID09PSBOTylcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdS5fZShlcnIpO1xuICAgIH07XG4gICAgRHJvcC5wcm90b3R5cGUuX2MgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciB1ID0gdGhpcy5vdXQ7XG4gICAgICAgIGlmICh1ID09PSBOTylcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdS5fYygpO1xuICAgIH07XG4gICAgcmV0dXJuIERyb3A7XG59KCkpO1xudmFyIEVuZFdoZW5MaXN0ZW5lciA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gRW5kV2hlbkxpc3RlbmVyKG91dCwgb3ApIHtcbiAgICAgICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgICAgIHRoaXMub3AgPSBvcDtcbiAgICB9XG4gICAgRW5kV2hlbkxpc3RlbmVyLnByb3RvdHlwZS5fbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5vcC5lbmQoKTtcbiAgICB9O1xuICAgIEVuZFdoZW5MaXN0ZW5lci5wcm90b3R5cGUuX2UgPSBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgIHRoaXMub3V0Ll9lKGVycik7XG4gICAgfTtcbiAgICBFbmRXaGVuTGlzdGVuZXIucHJvdG90eXBlLl9jID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLm9wLmVuZCgpO1xuICAgIH07XG4gICAgcmV0dXJuIEVuZFdoZW5MaXN0ZW5lcjtcbn0oKSk7XG52YXIgRW5kV2hlbiA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gRW5kV2hlbihvLCBpbnMpIHtcbiAgICAgICAgdGhpcy50eXBlID0gJ2VuZFdoZW4nO1xuICAgICAgICB0aGlzLmlucyA9IGlucztcbiAgICAgICAgdGhpcy5vdXQgPSBOTztcbiAgICAgICAgdGhpcy5vID0gbztcbiAgICAgICAgdGhpcy5vaWwgPSBOT19JTDtcbiAgICB9XG4gICAgRW5kV2hlbi5wcm90b3R5cGUuX3N0YXJ0ID0gZnVuY3Rpb24gKG91dCkge1xuICAgICAgICB0aGlzLm91dCA9IG91dDtcbiAgICAgICAgdGhpcy5vLl9hZGQodGhpcy5vaWwgPSBuZXcgRW5kV2hlbkxpc3RlbmVyKG91dCwgdGhpcykpO1xuICAgICAgICB0aGlzLmlucy5fYWRkKHRoaXMpO1xuICAgIH07XG4gICAgRW5kV2hlbi5wcm90b3R5cGUuX3N0b3AgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuaW5zLl9yZW1vdmUodGhpcyk7XG4gICAgICAgIHRoaXMuby5fcmVtb3ZlKHRoaXMub2lsKTtcbiAgICAgICAgdGhpcy5vdXQgPSBOTztcbiAgICAgICAgdGhpcy5vaWwgPSBOT19JTDtcbiAgICB9O1xuICAgIEVuZFdoZW4ucHJvdG90eXBlLmVuZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHUgPSB0aGlzLm91dDtcbiAgICAgICAgaWYgKHUgPT09IE5PKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB1Ll9jKCk7XG4gICAgfTtcbiAgICBFbmRXaGVuLnByb3RvdHlwZS5fbiA9IGZ1bmN0aW9uICh0KSB7XG4gICAgICAgIHZhciB1ID0gdGhpcy5vdXQ7XG4gICAgICAgIGlmICh1ID09PSBOTylcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdS5fbih0KTtcbiAgICB9O1xuICAgIEVuZFdoZW4ucHJvdG90eXBlLl9lID0gZnVuY3Rpb24gKGVycikge1xuICAgICAgICB2YXIgdSA9IHRoaXMub3V0O1xuICAgICAgICBpZiAodSA9PT0gTk8pXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHUuX2UoZXJyKTtcbiAgICB9O1xuICAgIEVuZFdoZW4ucHJvdG90eXBlLl9jID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmVuZCgpO1xuICAgIH07XG4gICAgcmV0dXJuIEVuZFdoZW47XG59KCkpO1xudmFyIEZpbHRlciA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gRmlsdGVyKHBhc3NlcywgaW5zKSB7XG4gICAgICAgIHRoaXMudHlwZSA9ICdmaWx0ZXInO1xuICAgICAgICB0aGlzLmlucyA9IGlucztcbiAgICAgICAgdGhpcy5vdXQgPSBOTztcbiAgICAgICAgdGhpcy5mID0gcGFzc2VzO1xuICAgIH1cbiAgICBGaWx0ZXIucHJvdG90eXBlLl9zdGFydCA9IGZ1bmN0aW9uIChvdXQpIHtcbiAgICAgICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgICAgIHRoaXMuaW5zLl9hZGQodGhpcyk7XG4gICAgfTtcbiAgICBGaWx0ZXIucHJvdG90eXBlLl9zdG9wID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmlucy5fcmVtb3ZlKHRoaXMpO1xuICAgICAgICB0aGlzLm91dCA9IE5PO1xuICAgIH07XG4gICAgRmlsdGVyLnByb3RvdHlwZS5fbiA9IGZ1bmN0aW9uICh0KSB7XG4gICAgICAgIHZhciB1ID0gdGhpcy5vdXQ7XG4gICAgICAgIGlmICh1ID09PSBOTylcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdmFyIHIgPSBfdHJ5KHRoaXMsIHQsIHUpO1xuICAgICAgICBpZiAociA9PT0gTk8gfHwgIXIpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHUuX24odCk7XG4gICAgfTtcbiAgICBGaWx0ZXIucHJvdG90eXBlLl9lID0gZnVuY3Rpb24gKGVycikge1xuICAgICAgICB2YXIgdSA9IHRoaXMub3V0O1xuICAgICAgICBpZiAodSA9PT0gTk8pXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHUuX2UoZXJyKTtcbiAgICB9O1xuICAgIEZpbHRlci5wcm90b3R5cGUuX2MgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciB1ID0gdGhpcy5vdXQ7XG4gICAgICAgIGlmICh1ID09PSBOTylcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdS5fYygpO1xuICAgIH07XG4gICAgcmV0dXJuIEZpbHRlcjtcbn0oKSk7XG52YXIgRmxhdHRlbkxpc3RlbmVyID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBGbGF0dGVuTGlzdGVuZXIob3V0LCBvcCkge1xuICAgICAgICB0aGlzLm91dCA9IG91dDtcbiAgICAgICAgdGhpcy5vcCA9IG9wO1xuICAgIH1cbiAgICBGbGF0dGVuTGlzdGVuZXIucHJvdG90eXBlLl9uID0gZnVuY3Rpb24gKHQpIHtcbiAgICAgICAgdGhpcy5vdXQuX24odCk7XG4gICAgfTtcbiAgICBGbGF0dGVuTGlzdGVuZXIucHJvdG90eXBlLl9lID0gZnVuY3Rpb24gKGVycikge1xuICAgICAgICB0aGlzLm91dC5fZShlcnIpO1xuICAgIH07XG4gICAgRmxhdHRlbkxpc3RlbmVyLnByb3RvdHlwZS5fYyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5vcC5pbm5lciA9IE5PO1xuICAgICAgICB0aGlzLm9wLmxlc3MoKTtcbiAgICB9O1xuICAgIHJldHVybiBGbGF0dGVuTGlzdGVuZXI7XG59KCkpO1xudmFyIEZsYXR0ZW4gPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIEZsYXR0ZW4oaW5zKSB7XG4gICAgICAgIHRoaXMudHlwZSA9ICdmbGF0dGVuJztcbiAgICAgICAgdGhpcy5pbnMgPSBpbnM7XG4gICAgICAgIHRoaXMub3V0ID0gTk87XG4gICAgICAgIHRoaXMub3BlbiA9IHRydWU7XG4gICAgICAgIHRoaXMuaW5uZXIgPSBOTztcbiAgICAgICAgdGhpcy5pbCA9IE5PX0lMO1xuICAgIH1cbiAgICBGbGF0dGVuLnByb3RvdHlwZS5fc3RhcnQgPSBmdW5jdGlvbiAob3V0KSB7XG4gICAgICAgIHRoaXMub3V0ID0gb3V0O1xuICAgICAgICB0aGlzLm9wZW4gPSB0cnVlO1xuICAgICAgICB0aGlzLmlubmVyID0gTk87XG4gICAgICAgIHRoaXMuaWwgPSBOT19JTDtcbiAgICAgICAgdGhpcy5pbnMuX2FkZCh0aGlzKTtcbiAgICB9O1xuICAgIEZsYXR0ZW4ucHJvdG90eXBlLl9zdG9wID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmlucy5fcmVtb3ZlKHRoaXMpO1xuICAgICAgICBpZiAodGhpcy5pbm5lciAhPT0gTk8pXG4gICAgICAgICAgICB0aGlzLmlubmVyLl9yZW1vdmUodGhpcy5pbCk7XG4gICAgICAgIHRoaXMub3V0ID0gTk87XG4gICAgICAgIHRoaXMub3BlbiA9IHRydWU7XG4gICAgICAgIHRoaXMuaW5uZXIgPSBOTztcbiAgICAgICAgdGhpcy5pbCA9IE5PX0lMO1xuICAgIH07XG4gICAgRmxhdHRlbi5wcm90b3R5cGUubGVzcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHUgPSB0aGlzLm91dDtcbiAgICAgICAgaWYgKHUgPT09IE5PKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBpZiAoIXRoaXMub3BlbiAmJiB0aGlzLmlubmVyID09PSBOTylcbiAgICAgICAgICAgIHUuX2MoKTtcbiAgICB9O1xuICAgIEZsYXR0ZW4ucHJvdG90eXBlLl9uID0gZnVuY3Rpb24gKHMpIHtcbiAgICAgICAgdmFyIHUgPSB0aGlzLm91dDtcbiAgICAgICAgaWYgKHUgPT09IE5PKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB2YXIgX2EgPSB0aGlzLCBpbm5lciA9IF9hLmlubmVyLCBpbCA9IF9hLmlsO1xuICAgICAgICBpZiAoaW5uZXIgIT09IE5PICYmIGlsICE9PSBOT19JTClcbiAgICAgICAgICAgIGlubmVyLl9yZW1vdmUoaWwpO1xuICAgICAgICAodGhpcy5pbm5lciA9IHMpLl9hZGQodGhpcy5pbCA9IG5ldyBGbGF0dGVuTGlzdGVuZXIodSwgdGhpcykpO1xuICAgIH07XG4gICAgRmxhdHRlbi5wcm90b3R5cGUuX2UgPSBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgIHZhciB1ID0gdGhpcy5vdXQ7XG4gICAgICAgIGlmICh1ID09PSBOTylcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdS5fZShlcnIpO1xuICAgIH07XG4gICAgRmxhdHRlbi5wcm90b3R5cGUuX2MgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMub3BlbiA9IGZhbHNlO1xuICAgICAgICB0aGlzLmxlc3MoKTtcbiAgICB9O1xuICAgIHJldHVybiBGbGF0dGVuO1xufSgpKTtcbnZhciBGb2xkID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBGb2xkKGYsIHNlZWQsIGlucykge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB0aGlzLnR5cGUgPSAnZm9sZCc7XG4gICAgICAgIHRoaXMuaW5zID0gaW5zO1xuICAgICAgICB0aGlzLm91dCA9IE5PO1xuICAgICAgICB0aGlzLmYgPSBmdW5jdGlvbiAodCkgeyByZXR1cm4gZihfdGhpcy5hY2MsIHQpOyB9O1xuICAgICAgICB0aGlzLmFjYyA9IHRoaXMuc2VlZCA9IHNlZWQ7XG4gICAgfVxuICAgIEZvbGQucHJvdG90eXBlLl9zdGFydCA9IGZ1bmN0aW9uIChvdXQpIHtcbiAgICAgICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgICAgIHRoaXMuYWNjID0gdGhpcy5zZWVkO1xuICAgICAgICBvdXQuX24odGhpcy5hY2MpO1xuICAgICAgICB0aGlzLmlucy5fYWRkKHRoaXMpO1xuICAgIH07XG4gICAgRm9sZC5wcm90b3R5cGUuX3N0b3AgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuaW5zLl9yZW1vdmUodGhpcyk7XG4gICAgICAgIHRoaXMub3V0ID0gTk87XG4gICAgICAgIHRoaXMuYWNjID0gdGhpcy5zZWVkO1xuICAgIH07XG4gICAgRm9sZC5wcm90b3R5cGUuX24gPSBmdW5jdGlvbiAodCkge1xuICAgICAgICB2YXIgdSA9IHRoaXMub3V0O1xuICAgICAgICBpZiAodSA9PT0gTk8pXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHZhciByID0gX3RyeSh0aGlzLCB0LCB1KTtcbiAgICAgICAgaWYgKHIgPT09IE5PKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB1Ll9uKHRoaXMuYWNjID0gcik7XG4gICAgfTtcbiAgICBGb2xkLnByb3RvdHlwZS5fZSA9IGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgdmFyIHUgPSB0aGlzLm91dDtcbiAgICAgICAgaWYgKHUgPT09IE5PKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB1Ll9lKGVycik7XG4gICAgfTtcbiAgICBGb2xkLnByb3RvdHlwZS5fYyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHUgPSB0aGlzLm91dDtcbiAgICAgICAgaWYgKHUgPT09IE5PKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB1Ll9jKCk7XG4gICAgfTtcbiAgICByZXR1cm4gRm9sZDtcbn0oKSk7XG52YXIgTGFzdCA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gTGFzdChpbnMpIHtcbiAgICAgICAgdGhpcy50eXBlID0gJ2xhc3QnO1xuICAgICAgICB0aGlzLmlucyA9IGlucztcbiAgICAgICAgdGhpcy5vdXQgPSBOTztcbiAgICAgICAgdGhpcy5oYXMgPSBmYWxzZTtcbiAgICAgICAgdGhpcy52YWwgPSBOTztcbiAgICB9XG4gICAgTGFzdC5wcm90b3R5cGUuX3N0YXJ0ID0gZnVuY3Rpb24gKG91dCkge1xuICAgICAgICB0aGlzLm91dCA9IG91dDtcbiAgICAgICAgdGhpcy5oYXMgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5pbnMuX2FkZCh0aGlzKTtcbiAgICB9O1xuICAgIExhc3QucHJvdG90eXBlLl9zdG9wID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmlucy5fcmVtb3ZlKHRoaXMpO1xuICAgICAgICB0aGlzLm91dCA9IE5PO1xuICAgICAgICB0aGlzLnZhbCA9IE5PO1xuICAgIH07XG4gICAgTGFzdC5wcm90b3R5cGUuX24gPSBmdW5jdGlvbiAodCkge1xuICAgICAgICB0aGlzLmhhcyA9IHRydWU7XG4gICAgICAgIHRoaXMudmFsID0gdDtcbiAgICB9O1xuICAgIExhc3QucHJvdG90eXBlLl9lID0gZnVuY3Rpb24gKGVycikge1xuICAgICAgICB2YXIgdSA9IHRoaXMub3V0O1xuICAgICAgICBpZiAodSA9PT0gTk8pXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHUuX2UoZXJyKTtcbiAgICB9O1xuICAgIExhc3QucHJvdG90eXBlLl9jID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgdSA9IHRoaXMub3V0O1xuICAgICAgICBpZiAodSA9PT0gTk8pXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGlmICh0aGlzLmhhcykge1xuICAgICAgICAgICAgdS5fbih0aGlzLnZhbCk7XG4gICAgICAgICAgICB1Ll9jKCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgdS5fZShuZXcgRXJyb3IoJ2xhc3QoKSBmYWlsZWQgYmVjYXVzZSBpbnB1dCBzdHJlYW0gY29tcGxldGVkJykpO1xuICAgIH07XG4gICAgcmV0dXJuIExhc3Q7XG59KCkpO1xudmFyIE1hcE9wID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBNYXBPcChwcm9qZWN0LCBpbnMpIHtcbiAgICAgICAgdGhpcy50eXBlID0gJ21hcCc7XG4gICAgICAgIHRoaXMuaW5zID0gaW5zO1xuICAgICAgICB0aGlzLm91dCA9IE5PO1xuICAgICAgICB0aGlzLmYgPSBwcm9qZWN0O1xuICAgIH1cbiAgICBNYXBPcC5wcm90b3R5cGUuX3N0YXJ0ID0gZnVuY3Rpb24gKG91dCkge1xuICAgICAgICB0aGlzLm91dCA9IG91dDtcbiAgICAgICAgdGhpcy5pbnMuX2FkZCh0aGlzKTtcbiAgICB9O1xuICAgIE1hcE9wLnByb3RvdHlwZS5fc3RvcCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5pbnMuX3JlbW92ZSh0aGlzKTtcbiAgICAgICAgdGhpcy5vdXQgPSBOTztcbiAgICB9O1xuICAgIE1hcE9wLnByb3RvdHlwZS5fbiA9IGZ1bmN0aW9uICh0KSB7XG4gICAgICAgIHZhciB1ID0gdGhpcy5vdXQ7XG4gICAgICAgIGlmICh1ID09PSBOTylcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdmFyIHIgPSBfdHJ5KHRoaXMsIHQsIHUpO1xuICAgICAgICBpZiAociA9PT0gTk8pXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHUuX24ocik7XG4gICAgfTtcbiAgICBNYXBPcC5wcm90b3R5cGUuX2UgPSBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgIHZhciB1ID0gdGhpcy5vdXQ7XG4gICAgICAgIGlmICh1ID09PSBOTylcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdS5fZShlcnIpO1xuICAgIH07XG4gICAgTWFwT3AucHJvdG90eXBlLl9jID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgdSA9IHRoaXMub3V0O1xuICAgICAgICBpZiAodSA9PT0gTk8pXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHUuX2MoKTtcbiAgICB9O1xuICAgIHJldHVybiBNYXBPcDtcbn0oKSk7XG52YXIgUmVtZW1iZXIgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFJlbWVtYmVyKGlucykge1xuICAgICAgICB0aGlzLnR5cGUgPSAncmVtZW1iZXInO1xuICAgICAgICB0aGlzLmlucyA9IGlucztcbiAgICAgICAgdGhpcy5vdXQgPSBOTztcbiAgICB9XG4gICAgUmVtZW1iZXIucHJvdG90eXBlLl9zdGFydCA9IGZ1bmN0aW9uIChvdXQpIHtcbiAgICAgICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgICAgIHRoaXMuaW5zLl9hZGQob3V0KTtcbiAgICB9O1xuICAgIFJlbWVtYmVyLnByb3RvdHlwZS5fc3RvcCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5pbnMuX3JlbW92ZSh0aGlzLm91dCk7XG4gICAgICAgIHRoaXMub3V0ID0gTk87XG4gICAgfTtcbiAgICByZXR1cm4gUmVtZW1iZXI7XG59KCkpO1xudmFyIFJlcGxhY2VFcnJvciA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gUmVwbGFjZUVycm9yKHJlcGxhY2VyLCBpbnMpIHtcbiAgICAgICAgdGhpcy50eXBlID0gJ3JlcGxhY2VFcnJvcic7XG4gICAgICAgIHRoaXMuaW5zID0gaW5zO1xuICAgICAgICB0aGlzLm91dCA9IE5PO1xuICAgICAgICB0aGlzLmYgPSByZXBsYWNlcjtcbiAgICB9XG4gICAgUmVwbGFjZUVycm9yLnByb3RvdHlwZS5fc3RhcnQgPSBmdW5jdGlvbiAob3V0KSB7XG4gICAgICAgIHRoaXMub3V0ID0gb3V0O1xuICAgICAgICB0aGlzLmlucy5fYWRkKHRoaXMpO1xuICAgIH07XG4gICAgUmVwbGFjZUVycm9yLnByb3RvdHlwZS5fc3RvcCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5pbnMuX3JlbW92ZSh0aGlzKTtcbiAgICAgICAgdGhpcy5vdXQgPSBOTztcbiAgICB9O1xuICAgIFJlcGxhY2VFcnJvci5wcm90b3R5cGUuX24gPSBmdW5jdGlvbiAodCkge1xuICAgICAgICB2YXIgdSA9IHRoaXMub3V0O1xuICAgICAgICBpZiAodSA9PT0gTk8pXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHUuX24odCk7XG4gICAgfTtcbiAgICBSZXBsYWNlRXJyb3IucHJvdG90eXBlLl9lID0gZnVuY3Rpb24gKGVycikge1xuICAgICAgICB2YXIgdSA9IHRoaXMub3V0O1xuICAgICAgICBpZiAodSA9PT0gTk8pXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB0aGlzLmlucy5fcmVtb3ZlKHRoaXMpO1xuICAgICAgICAgICAgKHRoaXMuaW5zID0gdGhpcy5mKGVycikpLl9hZGQodGhpcyk7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHUuX2UoZSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIFJlcGxhY2VFcnJvci5wcm90b3R5cGUuX2MgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciB1ID0gdGhpcy5vdXQ7XG4gICAgICAgIGlmICh1ID09PSBOTylcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdS5fYygpO1xuICAgIH07XG4gICAgcmV0dXJuIFJlcGxhY2VFcnJvcjtcbn0oKSk7XG52YXIgU3RhcnRXaXRoID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBTdGFydFdpdGgoaW5zLCB2YWwpIHtcbiAgICAgICAgdGhpcy50eXBlID0gJ3N0YXJ0V2l0aCc7XG4gICAgICAgIHRoaXMuaW5zID0gaW5zO1xuICAgICAgICB0aGlzLm91dCA9IE5PO1xuICAgICAgICB0aGlzLnZhbCA9IHZhbDtcbiAgICB9XG4gICAgU3RhcnRXaXRoLnByb3RvdHlwZS5fc3RhcnQgPSBmdW5jdGlvbiAob3V0KSB7XG4gICAgICAgIHRoaXMub3V0ID0gb3V0O1xuICAgICAgICB0aGlzLm91dC5fbih0aGlzLnZhbCk7XG4gICAgICAgIHRoaXMuaW5zLl9hZGQob3V0KTtcbiAgICB9O1xuICAgIFN0YXJ0V2l0aC5wcm90b3R5cGUuX3N0b3AgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuaW5zLl9yZW1vdmUodGhpcy5vdXQpO1xuICAgICAgICB0aGlzLm91dCA9IE5PO1xuICAgIH07XG4gICAgcmV0dXJuIFN0YXJ0V2l0aDtcbn0oKSk7XG52YXIgVGFrZSA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gVGFrZShtYXgsIGlucykge1xuICAgICAgICB0aGlzLnR5cGUgPSAndGFrZSc7XG4gICAgICAgIHRoaXMuaW5zID0gaW5zO1xuICAgICAgICB0aGlzLm91dCA9IE5PO1xuICAgICAgICB0aGlzLm1heCA9IG1heDtcbiAgICAgICAgdGhpcy50YWtlbiA9IDA7XG4gICAgfVxuICAgIFRha2UucHJvdG90eXBlLl9zdGFydCA9IGZ1bmN0aW9uIChvdXQpIHtcbiAgICAgICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgICAgIHRoaXMudGFrZW4gPSAwO1xuICAgICAgICBpZiAodGhpcy5tYXggPD0gMClcbiAgICAgICAgICAgIG91dC5fYygpO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICB0aGlzLmlucy5fYWRkKHRoaXMpO1xuICAgIH07XG4gICAgVGFrZS5wcm90b3R5cGUuX3N0b3AgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuaW5zLl9yZW1vdmUodGhpcyk7XG4gICAgICAgIHRoaXMub3V0ID0gTk87XG4gICAgfTtcbiAgICBUYWtlLnByb3RvdHlwZS5fbiA9IGZ1bmN0aW9uICh0KSB7XG4gICAgICAgIHZhciB1ID0gdGhpcy5vdXQ7XG4gICAgICAgIGlmICh1ID09PSBOTylcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdmFyIG0gPSArK3RoaXMudGFrZW47XG4gICAgICAgIGlmIChtIDwgdGhpcy5tYXgpXG4gICAgICAgICAgICB1Ll9uKHQpO1xuICAgICAgICBlbHNlIGlmIChtID09PSB0aGlzLm1heCkge1xuICAgICAgICAgICAgdS5fbih0KTtcbiAgICAgICAgICAgIHUuX2MoKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgVGFrZS5wcm90b3R5cGUuX2UgPSBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgIHZhciB1ID0gdGhpcy5vdXQ7XG4gICAgICAgIGlmICh1ID09PSBOTylcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdS5fZShlcnIpO1xuICAgIH07XG4gICAgVGFrZS5wcm90b3R5cGUuX2MgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciB1ID0gdGhpcy5vdXQ7XG4gICAgICAgIGlmICh1ID09PSBOTylcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdS5fYygpO1xuICAgIH07XG4gICAgcmV0dXJuIFRha2U7XG59KCkpO1xudmFyIFN0cmVhbSA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gU3RyZWFtKHByb2R1Y2VyKSB7XG4gICAgICAgIHRoaXMuX3Byb2QgPSBwcm9kdWNlciB8fCBOTztcbiAgICAgICAgdGhpcy5faWxzID0gW107XG4gICAgICAgIHRoaXMuX3N0b3BJRCA9IE5PO1xuICAgICAgICB0aGlzLl9kbCA9IE5PO1xuICAgICAgICB0aGlzLl9kID0gZmFsc2U7XG4gICAgICAgIHRoaXMuX3RhcmdldCA9IE5PO1xuICAgICAgICB0aGlzLl9lcnIgPSBOTztcbiAgICB9XG4gICAgU3RyZWFtLnByb3RvdHlwZS5fbiA9IGZ1bmN0aW9uICh0KSB7XG4gICAgICAgIHZhciBhID0gdGhpcy5faWxzO1xuICAgICAgICB2YXIgTCA9IGEubGVuZ3RoO1xuICAgICAgICBpZiAodGhpcy5fZClcbiAgICAgICAgICAgIHRoaXMuX2RsLl9uKHQpO1xuICAgICAgICBpZiAoTCA9PSAxKVxuICAgICAgICAgICAgYVswXS5fbih0KTtcbiAgICAgICAgZWxzZSBpZiAoTCA9PSAwKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHZhciBiID0gY3AoYSk7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IEw7IGkrKylcbiAgICAgICAgICAgICAgICBiW2ldLl9uKHQpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBTdHJlYW0ucHJvdG90eXBlLl9lID0gZnVuY3Rpb24gKGVycikge1xuICAgICAgICBpZiAodGhpcy5fZXJyICE9PSBOTylcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdGhpcy5fZXJyID0gZXJyO1xuICAgICAgICB2YXIgYSA9IHRoaXMuX2lscztcbiAgICAgICAgdmFyIEwgPSBhLmxlbmd0aDtcbiAgICAgICAgdGhpcy5feCgpO1xuICAgICAgICBpZiAodGhpcy5fZClcbiAgICAgICAgICAgIHRoaXMuX2RsLl9lKGVycik7XG4gICAgICAgIGlmIChMID09IDEpXG4gICAgICAgICAgICBhWzBdLl9lKGVycik7XG4gICAgICAgIGVsc2UgaWYgKEwgPT0gMClcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB2YXIgYiA9IGNwKGEpO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBMOyBpKyspXG4gICAgICAgICAgICAgICAgYltpXS5fZShlcnIpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdGhpcy5fZCAmJiBMID09IDApXG4gICAgICAgICAgICB0aHJvdyB0aGlzLl9lcnI7XG4gICAgfTtcbiAgICBTdHJlYW0ucHJvdG90eXBlLl9jID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgYSA9IHRoaXMuX2lscztcbiAgICAgICAgdmFyIEwgPSBhLmxlbmd0aDtcbiAgICAgICAgdGhpcy5feCgpO1xuICAgICAgICBpZiAodGhpcy5fZClcbiAgICAgICAgICAgIHRoaXMuX2RsLl9jKCk7XG4gICAgICAgIGlmIChMID09IDEpXG4gICAgICAgICAgICBhWzBdLl9jKCk7XG4gICAgICAgIGVsc2UgaWYgKEwgPT0gMClcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB2YXIgYiA9IGNwKGEpO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBMOyBpKyspXG4gICAgICAgICAgICAgICAgYltpXS5fYygpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBTdHJlYW0ucHJvdG90eXBlLl94ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodGhpcy5faWxzLmxlbmd0aCA9PT0gMClcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgaWYgKHRoaXMuX3Byb2QgIT09IE5PKVxuICAgICAgICAgICAgdGhpcy5fcHJvZC5fc3RvcCgpO1xuICAgICAgICB0aGlzLl9lcnIgPSBOTztcbiAgICAgICAgdGhpcy5faWxzID0gW107XG4gICAgfTtcbiAgICBTdHJlYW0ucHJvdG90eXBlLl9zdG9wTm93ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAvLyBXQVJOSU5HOiBjb2RlIHRoYXQgY2FsbHMgdGhpcyBtZXRob2Qgc2hvdWxkXG4gICAgICAgIC8vIGZpcnN0IGNoZWNrIGlmIHRoaXMuX3Byb2QgaXMgdmFsaWQgKG5vdCBgTk9gKVxuICAgICAgICB0aGlzLl9wcm9kLl9zdG9wKCk7XG4gICAgICAgIHRoaXMuX2VyciA9IE5PO1xuICAgICAgICB0aGlzLl9zdG9wSUQgPSBOTztcbiAgICB9O1xuICAgIFN0cmVhbS5wcm90b3R5cGUuX2FkZCA9IGZ1bmN0aW9uIChpbCkge1xuICAgICAgICB2YXIgdGEgPSB0aGlzLl90YXJnZXQ7XG4gICAgICAgIGlmICh0YSAhPT0gTk8pXG4gICAgICAgICAgICByZXR1cm4gdGEuX2FkZChpbCk7XG4gICAgICAgIHZhciBhID0gdGhpcy5faWxzO1xuICAgICAgICBhLnB1c2goaWwpO1xuICAgICAgICBpZiAoYS5sZW5ndGggPiAxKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBpZiAodGhpcy5fc3RvcElEICE9PSBOTykge1xuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuX3N0b3BJRCk7XG4gICAgICAgICAgICB0aGlzLl9zdG9wSUQgPSBOTztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHZhciBwID0gdGhpcy5fcHJvZDtcbiAgICAgICAgICAgIGlmIChwICE9PSBOTylcbiAgICAgICAgICAgICAgICBwLl9zdGFydCh0aGlzKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgU3RyZWFtLnByb3RvdHlwZS5fcmVtb3ZlID0gZnVuY3Rpb24gKGlsKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHZhciB0YSA9IHRoaXMuX3RhcmdldDtcbiAgICAgICAgaWYgKHRhICE9PSBOTylcbiAgICAgICAgICAgIHJldHVybiB0YS5fcmVtb3ZlKGlsKTtcbiAgICAgICAgdmFyIGEgPSB0aGlzLl9pbHM7XG4gICAgICAgIHZhciBpID0gYS5pbmRleE9mKGlsKTtcbiAgICAgICAgaWYgKGkgPiAtMSkge1xuICAgICAgICAgICAgYS5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICBpZiAodGhpcy5fcHJvZCAhPT0gTk8gJiYgYS5sZW5ndGggPD0gMCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2VyciA9IE5PO1xuICAgICAgICAgICAgICAgIHRoaXMuX3N0b3BJRCA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkgeyByZXR1cm4gX3RoaXMuX3N0b3BOb3coKTsgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChhLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3BydW5lQ3ljbGVzKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuICAgIC8vIElmIGFsbCBwYXRocyBzdGVtbWluZyBmcm9tIGB0aGlzYCBzdHJlYW0gZXZlbnR1YWxseSBlbmQgYXQgYHRoaXNgXG4gICAgLy8gc3RyZWFtLCB0aGVuIHdlIHJlbW92ZSB0aGUgc2luZ2xlIGxpc3RlbmVyIG9mIGB0aGlzYCBzdHJlYW0sIHRvXG4gICAgLy8gZm9yY2UgaXQgdG8gZW5kIGl0cyBleGVjdXRpb24gYW5kIGRpc3Bvc2UgcmVzb3VyY2VzLiBUaGlzIG1ldGhvZFxuICAgIC8vIGFzc3VtZXMgYXMgYSBwcmVjb25kaXRpb24gdGhhdCB0aGlzLl9pbHMgaGFzIGp1c3Qgb25lIGxpc3RlbmVyLlxuICAgIFN0cmVhbS5wcm90b3R5cGUuX3BydW5lQ3ljbGVzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodGhpcy5faGFzTm9TaW5rcyh0aGlzLCBbXSkpXG4gICAgICAgICAgICB0aGlzLl9yZW1vdmUodGhpcy5faWxzWzBdKTtcbiAgICB9O1xuICAgIC8vIENoZWNrcyB3aGV0aGVyICp0aGVyZSBpcyBubyogcGF0aCBzdGFydGluZyBmcm9tIGB4YCB0aGF0IGxlYWRzIHRvIGFuIGVuZFxuICAgIC8vIGxpc3RlbmVyIChzaW5rKSBpbiB0aGUgc3RyZWFtIGdyYXBoLCBmb2xsb3dpbmcgZWRnZXMgQS0+QiB3aGVyZSBCIGlzIGFcbiAgICAvLyBsaXN0ZW5lciBvZiBBLiBUaGlzIG1lYW5zIHRoZXNlIHBhdGhzIGNvbnN0aXR1dGUgYSBjeWNsZSBzb21laG93LiBJcyBnaXZlblxuICAgIC8vIGEgdHJhY2Ugb2YgYWxsIHZpc2l0ZWQgbm9kZXMgc28gZmFyLlxuICAgIFN0cmVhbS5wcm90b3R5cGUuX2hhc05vU2lua3MgPSBmdW5jdGlvbiAoeCwgdHJhY2UpIHtcbiAgICAgICAgaWYgKHRyYWNlLmluZGV4T2YoeCkgIT09IC0xKVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIGVsc2UgaWYgKHgub3V0ID09PSB0aGlzKVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIGVsc2UgaWYgKHgub3V0ICYmIHgub3V0ICE9PSBOTylcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9oYXNOb1NpbmtzKHgub3V0LCB0cmFjZS5jb25jYXQoeCkpO1xuICAgICAgICBlbHNlIGlmICh4Ll9pbHMpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBOID0geC5faWxzLmxlbmd0aDsgaSA8IE47IGkrKylcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuX2hhc05vU2lua3MoeC5faWxzW2ldLCB0cmFjZS5jb25jYXQoeCkpKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfTtcbiAgICBTdHJlYW0ucHJvdG90eXBlLmN0b3IgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzIGluc3RhbmNlb2YgTWVtb3J5U3RyZWFtID8gTWVtb3J5U3RyZWFtIDogU3RyZWFtO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogQWRkcyBhIExpc3RlbmVyIHRvIHRoZSBTdHJlYW0uXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0xpc3RlbmVyfSBsaXN0ZW5lclxuICAgICAqL1xuICAgIFN0cmVhbS5wcm90b3R5cGUuYWRkTGlzdGVuZXIgPSBmdW5jdGlvbiAobGlzdGVuZXIpIHtcbiAgICAgICAgbGlzdGVuZXIuX24gPSBsaXN0ZW5lci5uZXh0IHx8IG5vb3A7XG4gICAgICAgIGxpc3RlbmVyLl9lID0gbGlzdGVuZXIuZXJyb3IgfHwgbm9vcDtcbiAgICAgICAgbGlzdGVuZXIuX2MgPSBsaXN0ZW5lci5jb21wbGV0ZSB8fCBub29wO1xuICAgICAgICB0aGlzLl9hZGQobGlzdGVuZXIpO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogUmVtb3ZlcyBhIExpc3RlbmVyIGZyb20gdGhlIFN0cmVhbSwgYXNzdW1pbmcgdGhlIExpc3RlbmVyIHdhcyBhZGRlZCB0byBpdC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7TGlzdGVuZXI8VD59IGxpc3RlbmVyXG4gICAgICovXG4gICAgU3RyZWFtLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lciA9IGZ1bmN0aW9uIChsaXN0ZW5lcikge1xuICAgICAgICB0aGlzLl9yZW1vdmUobGlzdGVuZXIpO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogQWRkcyBhIExpc3RlbmVyIHRvIHRoZSBTdHJlYW0gcmV0dXJuaW5nIGEgU3Vic2NyaXB0aW9uIHRvIHJlbW92ZSB0aGF0XG4gICAgICogbGlzdGVuZXIuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0xpc3RlbmVyfSBsaXN0ZW5lclxuICAgICAqIEByZXR1cm5zIHtTdWJzY3JpcHRpb259XG4gICAgICovXG4gICAgU3RyZWFtLnByb3RvdHlwZS5zdWJzY3JpYmUgPSBmdW5jdGlvbiAobGlzdGVuZXIpIHtcbiAgICAgICAgdGhpcy5hZGRMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgICAgIHJldHVybiBuZXcgU3RyZWFtU3ViKHRoaXMsIGxpc3RlbmVyKTtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIEFkZCBpbnRlcm9wIGJldHdlZW4gbW9zdC5qcyBhbmQgUnhKUyA1XG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7U3RyZWFtfVxuICAgICAqL1xuICAgIFN0cmVhbS5wcm90b3R5cGVbc3ltYm9sX29ic2VydmFibGVfMS5kZWZhdWx0XSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgbmV3IFN0cmVhbSBnaXZlbiBhIFByb2R1Y2VyLlxuICAgICAqXG4gICAgICogQGZhY3RvcnkgdHJ1ZVxuICAgICAqIEBwYXJhbSB7UHJvZHVjZXJ9IHByb2R1Y2VyIEFuIG9wdGlvbmFsIFByb2R1Y2VyIHRoYXQgZGljdGF0ZXMgaG93IHRvXG4gICAgICogc3RhcnQsIGdlbmVyYXRlIGV2ZW50cywgYW5kIHN0b3AgdGhlIFN0cmVhbS5cbiAgICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAgICovXG4gICAgU3RyZWFtLmNyZWF0ZSA9IGZ1bmN0aW9uIChwcm9kdWNlcikge1xuICAgICAgICBpZiAocHJvZHVjZXIpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcHJvZHVjZXIuc3RhcnQgIT09ICdmdW5jdGlvbidcbiAgICAgICAgICAgICAgICB8fCB0eXBlb2YgcHJvZHVjZXIuc3RvcCAhPT0gJ2Z1bmN0aW9uJylcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2R1Y2VyIHJlcXVpcmVzIGJvdGggc3RhcnQgYW5kIHN0b3AgZnVuY3Rpb25zJyk7XG4gICAgICAgICAgICBpbnRlcm5hbGl6ZVByb2R1Y2VyKHByb2R1Y2VyKTsgLy8gbXV0YXRlcyB0aGUgaW5wdXRcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmV3IFN0cmVhbShwcm9kdWNlcik7XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgbmV3IE1lbW9yeVN0cmVhbSBnaXZlbiBhIFByb2R1Y2VyLlxuICAgICAqXG4gICAgICogQGZhY3RvcnkgdHJ1ZVxuICAgICAqIEBwYXJhbSB7UHJvZHVjZXJ9IHByb2R1Y2VyIEFuIG9wdGlvbmFsIFByb2R1Y2VyIHRoYXQgZGljdGF0ZXMgaG93IHRvXG4gICAgICogc3RhcnQsIGdlbmVyYXRlIGV2ZW50cywgYW5kIHN0b3AgdGhlIFN0cmVhbS5cbiAgICAgKiBAcmV0dXJuIHtNZW1vcnlTdHJlYW19XG4gICAgICovXG4gICAgU3RyZWFtLmNyZWF0ZVdpdGhNZW1vcnkgPSBmdW5jdGlvbiAocHJvZHVjZXIpIHtcbiAgICAgICAgaWYgKHByb2R1Y2VyKVxuICAgICAgICAgICAgaW50ZXJuYWxpemVQcm9kdWNlcihwcm9kdWNlcik7IC8vIG11dGF0ZXMgdGhlIGlucHV0XG4gICAgICAgIHJldHVybiBuZXcgTWVtb3J5U3RyZWFtKHByb2R1Y2VyKTtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBTdHJlYW0gdGhhdCBkb2VzIG5vdGhpbmcgd2hlbiBzdGFydGVkLiBJdCBuZXZlciBlbWl0cyBhbnkgZXZlbnQuXG4gICAgICpcbiAgICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICAgKlxuICAgICAqIGBgYHRleHRcbiAgICAgKiAgICAgICAgICBuZXZlclxuICAgICAqIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICogYGBgXG4gICAgICpcbiAgICAgKiBAZmFjdG9yeSB0cnVlXG4gICAgICogQHJldHVybiB7U3RyZWFtfVxuICAgICAqL1xuICAgIFN0cmVhbS5uZXZlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBTdHJlYW0oeyBfc3RhcnQ6IG5vb3AsIF9zdG9wOiBub29wIH0pO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIFN0cmVhbSB0aGF0IGltbWVkaWF0ZWx5IGVtaXRzIHRoZSBcImNvbXBsZXRlXCIgbm90aWZpY2F0aW9uIHdoZW5cbiAgICAgKiBzdGFydGVkLCBhbmQgdGhhdCdzIGl0LlxuICAgICAqXG4gICAgICogTWFyYmxlIGRpYWdyYW06XG4gICAgICpcbiAgICAgKiBgYGB0ZXh0XG4gICAgICogZW1wdHlcbiAgICAgKiAtfFxuICAgICAqIGBgYFxuICAgICAqXG4gICAgICogQGZhY3RvcnkgdHJ1ZVxuICAgICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICAgKi9cbiAgICBTdHJlYW0uZW1wdHkgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBuZXcgU3RyZWFtKHtcbiAgICAgICAgICAgIF9zdGFydDogZnVuY3Rpb24gKGlsKSB7IGlsLl9jKCk7IH0sXG4gICAgICAgICAgICBfc3RvcDogbm9vcCxcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgU3RyZWFtIHRoYXQgaW1tZWRpYXRlbHkgZW1pdHMgYW4gXCJlcnJvclwiIG5vdGlmaWNhdGlvbiB3aXRoIHRoZVxuICAgICAqIHZhbHVlIHlvdSBwYXNzZWQgYXMgdGhlIGBlcnJvcmAgYXJndW1lbnQgd2hlbiB0aGUgc3RyZWFtIHN0YXJ0cywgYW5kIHRoYXQnc1xuICAgICAqIGl0LlxuICAgICAqXG4gICAgICogTWFyYmxlIGRpYWdyYW06XG4gICAgICpcbiAgICAgKiBgYGB0ZXh0XG4gICAgICogdGhyb3coWClcbiAgICAgKiAtWFxuICAgICAqIGBgYFxuICAgICAqXG4gICAgICogQGZhY3RvcnkgdHJ1ZVxuICAgICAqIEBwYXJhbSBlcnJvciBUaGUgZXJyb3IgZXZlbnQgdG8gZW1pdCBvbiB0aGUgY3JlYXRlZCBzdHJlYW0uXG4gICAgICogQHJldHVybiB7U3RyZWFtfVxuICAgICAqL1xuICAgIFN0cmVhbS50aHJvdyA9IGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgICByZXR1cm4gbmV3IFN0cmVhbSh7XG4gICAgICAgICAgICBfc3RhcnQ6IGZ1bmN0aW9uIChpbCkgeyBpbC5fZShlcnJvcik7IH0sXG4gICAgICAgICAgICBfc3RvcDogbm9vcCxcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgc3RyZWFtIGZyb20gYW4gQXJyYXksIFByb21pc2UsIG9yIGFuIE9ic2VydmFibGUuXG4gICAgICpcbiAgICAgKiBAZmFjdG9yeSB0cnVlXG4gICAgICogQHBhcmFtIHtBcnJheXxQcm9taXNlTGlrZXxPYnNlcnZhYmxlfSBpbnB1dCBUaGUgaW5wdXQgdG8gbWFrZSBhIHN0cmVhbSBmcm9tLlxuICAgICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICAgKi9cbiAgICBTdHJlYW0uZnJvbSA9IGZ1bmN0aW9uIChpbnB1dCkge1xuICAgICAgICBpZiAodHlwZW9mIGlucHV0W3N5bWJvbF9vYnNlcnZhYmxlXzEuZGVmYXVsdF0gPT09ICdmdW5jdGlvbicpXG4gICAgICAgICAgICByZXR1cm4gU3RyZWFtLmZyb21PYnNlcnZhYmxlKGlucHV0KTtcbiAgICAgICAgZWxzZSBpZiAodHlwZW9mIGlucHV0LnRoZW4gPT09ICdmdW5jdGlvbicpXG4gICAgICAgICAgICByZXR1cm4gU3RyZWFtLmZyb21Qcm9taXNlKGlucHV0KTtcbiAgICAgICAgZWxzZSBpZiAoQXJyYXkuaXNBcnJheShpbnB1dCkpXG4gICAgICAgICAgICByZXR1cm4gU3RyZWFtLmZyb21BcnJheShpbnB1dCk7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJUeXBlIG9mIGlucHV0IHRvIGZyb20oKSBtdXN0IGJlIGFuIEFycmF5LCBQcm9taXNlLCBvciBPYnNlcnZhYmxlXCIpO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIFN0cmVhbSB0aGF0IGltbWVkaWF0ZWx5IGVtaXRzIHRoZSBhcmd1bWVudHMgdGhhdCB5b3UgZ2l2ZSB0b1xuICAgICAqICpvZiosIHRoZW4gY29tcGxldGVzLlxuICAgICAqXG4gICAgICogTWFyYmxlIGRpYWdyYW06XG4gICAgICpcbiAgICAgKiBgYGB0ZXh0XG4gICAgICogb2YoMSwyLDMpXG4gICAgICogMTIzfFxuICAgICAqIGBgYFxuICAgICAqXG4gICAgICogQGZhY3RvcnkgdHJ1ZVxuICAgICAqIEBwYXJhbSBhIFRoZSBmaXJzdCB2YWx1ZSB5b3Ugd2FudCB0byBlbWl0IGFzIGFuIGV2ZW50IG9uIHRoZSBzdHJlYW0uXG4gICAgICogQHBhcmFtIGIgVGhlIHNlY29uZCB2YWx1ZSB5b3Ugd2FudCB0byBlbWl0IGFzIGFuIGV2ZW50IG9uIHRoZSBzdHJlYW0uIE9uZVxuICAgICAqIG9yIG1vcmUgb2YgdGhlc2UgdmFsdWVzIG1heSBiZSBnaXZlbiBhcyBhcmd1bWVudHMuXG4gICAgICogQHJldHVybiB7U3RyZWFtfVxuICAgICAqL1xuICAgIFN0cmVhbS5vZiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGl0ZW1zID0gW107XG4gICAgICAgIGZvciAodmFyIF9pID0gMDsgX2kgPCBhcmd1bWVudHMubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICBpdGVtc1tfaV0gPSBhcmd1bWVudHNbX2ldO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBTdHJlYW0uZnJvbUFycmF5KGl0ZW1zKTtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIENvbnZlcnRzIGFuIGFycmF5IHRvIGEgc3RyZWFtLiBUaGUgcmV0dXJuZWQgc3RyZWFtIHdpbGwgZW1pdCBzeW5jaHJvbm91c2x5XG4gICAgICogYWxsIHRoZSBpdGVtcyBpbiB0aGUgYXJyYXksIGFuZCB0aGVuIGNvbXBsZXRlLlxuICAgICAqXG4gICAgICogTWFyYmxlIGRpYWdyYW06XG4gICAgICpcbiAgICAgKiBgYGB0ZXh0XG4gICAgICogZnJvbUFycmF5KFsxLDIsM10pXG4gICAgICogMTIzfFxuICAgICAqIGBgYFxuICAgICAqXG4gICAgICogQGZhY3RvcnkgdHJ1ZVxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGFycmF5IFRoZSBhcnJheSB0byBiZSBjb252ZXJ0ZWQgYXMgYSBzdHJlYW0uXG4gICAgICogQHJldHVybiB7U3RyZWFtfVxuICAgICAqL1xuICAgIFN0cmVhbS5mcm9tQXJyYXkgPSBmdW5jdGlvbiAoYXJyYXkpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBTdHJlYW0obmV3IEZyb21BcnJheShhcnJheSkpO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogQ29udmVydHMgYSBwcm9taXNlIHRvIGEgc3RyZWFtLiBUaGUgcmV0dXJuZWQgc3RyZWFtIHdpbGwgZW1pdCB0aGUgcmVzb2x2ZWRcbiAgICAgKiB2YWx1ZSBvZiB0aGUgcHJvbWlzZSwgYW5kIHRoZW4gY29tcGxldGUuIEhvd2V2ZXIsIGlmIHRoZSBwcm9taXNlIGlzXG4gICAgICogcmVqZWN0ZWQsIHRoZSBzdHJlYW0gd2lsbCBlbWl0IHRoZSBjb3JyZXNwb25kaW5nIGVycm9yLlxuICAgICAqXG4gICAgICogTWFyYmxlIGRpYWdyYW06XG4gICAgICpcbiAgICAgKiBgYGB0ZXh0XG4gICAgICogZnJvbVByb21pc2UoIC0tLS00MiApXG4gICAgICogLS0tLS0tLS0tLS0tLS0tLS00MnxcbiAgICAgKiBgYGBcbiAgICAgKlxuICAgICAqIEBmYWN0b3J5IHRydWVcbiAgICAgKiBAcGFyYW0ge1Byb21pc2VMaWtlfSBwcm9taXNlIFRoZSBwcm9taXNlIHRvIGJlIGNvbnZlcnRlZCBhcyBhIHN0cmVhbS5cbiAgICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAgICovXG4gICAgU3RyZWFtLmZyb21Qcm9taXNlID0gZnVuY3Rpb24gKHByb21pc2UpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBTdHJlYW0obmV3IEZyb21Qcm9taXNlKHByb21pc2UpKTtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIENvbnZlcnRzIGFuIE9ic2VydmFibGUgaW50byBhIFN0cmVhbS5cbiAgICAgKlxuICAgICAqIEBmYWN0b3J5IHRydWVcbiAgICAgKiBAcGFyYW0ge2FueX0gb2JzZXJ2YWJsZSBUaGUgb2JzZXJ2YWJsZSB0byBiZSBjb252ZXJ0ZWQgYXMgYSBzdHJlYW0uXG4gICAgICogQHJldHVybiB7U3RyZWFtfVxuICAgICAqL1xuICAgIFN0cmVhbS5mcm9tT2JzZXJ2YWJsZSA9IGZ1bmN0aW9uIChvYnMpIHtcbiAgICAgICAgaWYgKG9icy5lbmRXaGVuKVxuICAgICAgICAgICAgcmV0dXJuIG9icztcbiAgICAgICAgcmV0dXJuIG5ldyBTdHJlYW0obmV3IEZyb21PYnNlcnZhYmxlKG9icykpO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIHN0cmVhbSB0aGF0IHBlcmlvZGljYWxseSBlbWl0cyBpbmNyZW1lbnRhbCBudW1iZXJzLCBldmVyeVxuICAgICAqIGBwZXJpb2RgIG1pbGxpc2Vjb25kcy5cbiAgICAgKlxuICAgICAqIE1hcmJsZSBkaWFncmFtOlxuICAgICAqXG4gICAgICogYGBgdGV4dFxuICAgICAqICAgICBwZXJpb2RpYygxMDAwKVxuICAgICAqIC0tLTAtLS0xLS0tMi0tLTMtLS00LS0tLi4uXG4gICAgICogYGBgXG4gICAgICpcbiAgICAgKiBAZmFjdG9yeSB0cnVlXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHBlcmlvZCBUaGUgaW50ZXJ2YWwgaW4gbWlsbGlzZWNvbmRzIHRvIHVzZSBhcyBhIHJhdGUgb2ZcbiAgICAgKiBlbWlzc2lvbi5cbiAgICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAgICovXG4gICAgU3RyZWFtLnBlcmlvZGljID0gZnVuY3Rpb24gKHBlcmlvZCkge1xuICAgICAgICByZXR1cm4gbmV3IFN0cmVhbShuZXcgUGVyaW9kaWMocGVyaW9kKSk7XG4gICAgfTtcbiAgICBTdHJlYW0ucHJvdG90eXBlLl9tYXAgPSBmdW5jdGlvbiAocHJvamVjdCkge1xuICAgICAgICByZXR1cm4gbmV3ICh0aGlzLmN0b3IoKSkobmV3IE1hcE9wKHByb2plY3QsIHRoaXMpKTtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIFRyYW5zZm9ybXMgZWFjaCBldmVudCBmcm9tIHRoZSBpbnB1dCBTdHJlYW0gdGhyb3VnaCBhIGBwcm9qZWN0YCBmdW5jdGlvbixcbiAgICAgKiB0byBnZXQgYSBTdHJlYW0gdGhhdCBlbWl0cyB0aG9zZSB0cmFuc2Zvcm1lZCBldmVudHMuXG4gICAgICpcbiAgICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICAgKlxuICAgICAqIGBgYHRleHRcbiAgICAgKiAtLTEtLS0zLS01LS0tLS03LS0tLS0tXG4gICAgICogICAgbWFwKGkgPT4gaSAqIDEwKVxuICAgICAqIC0tMTAtLTMwLTUwLS0tLTcwLS0tLS1cbiAgICAgKiBgYGBcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IHByb2plY3QgQSBmdW5jdGlvbiBvZiB0eXBlIGAodDogVCkgPT4gVWAgdGhhdCB0YWtlcyBldmVudFxuICAgICAqIGB0YCBvZiB0eXBlIGBUYCBmcm9tIHRoZSBpbnB1dCBTdHJlYW0gYW5kIHByb2R1Y2VzIGFuIGV2ZW50IG9mIHR5cGUgYFVgLCB0b1xuICAgICAqIGJlIGVtaXR0ZWQgb24gdGhlIG91dHB1dCBTdHJlYW0uXG4gICAgICogQHJldHVybiB7U3RyZWFtfVxuICAgICAqL1xuICAgIFN0cmVhbS5wcm90b3R5cGUubWFwID0gZnVuY3Rpb24gKHByb2plY3QpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX21hcChwcm9qZWN0KTtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIEl0J3MgbGlrZSBgbWFwYCwgYnV0IHRyYW5zZm9ybXMgZWFjaCBpbnB1dCBldmVudCB0byBhbHdheXMgdGhlIHNhbWVcbiAgICAgKiBjb25zdGFudCB2YWx1ZSBvbiB0aGUgb3V0cHV0IFN0cmVhbS5cbiAgICAgKlxuICAgICAqIE1hcmJsZSBkaWFncmFtOlxuICAgICAqXG4gICAgICogYGBgdGV4dFxuICAgICAqIC0tMS0tLTMtLTUtLS0tLTctLS0tLVxuICAgICAqICAgICAgIG1hcFRvKDEwKVxuICAgICAqIC0tMTAtLTEwLTEwLS0tLTEwLS0tLVxuICAgICAqIGBgYFxuICAgICAqXG4gICAgICogQHBhcmFtIHByb2plY3RlZFZhbHVlIEEgdmFsdWUgdG8gZW1pdCBvbiB0aGUgb3V0cHV0IFN0cmVhbSB3aGVuZXZlciB0aGVcbiAgICAgKiBpbnB1dCBTdHJlYW0gZW1pdHMgYW55IHZhbHVlLlxuICAgICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICAgKi9cbiAgICBTdHJlYW0ucHJvdG90eXBlLm1hcFRvID0gZnVuY3Rpb24gKHByb2plY3RlZFZhbHVlKSB7XG4gICAgICAgIHZhciBzID0gdGhpcy5tYXAoZnVuY3Rpb24gKCkgeyByZXR1cm4gcHJvamVjdGVkVmFsdWU7IH0pO1xuICAgICAgICB2YXIgb3AgPSBzLl9wcm9kO1xuICAgICAgICBvcC50eXBlID0gJ21hcFRvJztcbiAgICAgICAgcmV0dXJuIHM7XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBPbmx5IGFsbG93cyBldmVudHMgdGhhdCBwYXNzIHRoZSB0ZXN0IGdpdmVuIGJ5IHRoZSBgcGFzc2VzYCBhcmd1bWVudC5cbiAgICAgKlxuICAgICAqIEVhY2ggZXZlbnQgZnJvbSB0aGUgaW5wdXQgc3RyZWFtIGlzIGdpdmVuIHRvIHRoZSBgcGFzc2VzYCBmdW5jdGlvbi4gSWYgdGhlXG4gICAgICogZnVuY3Rpb24gcmV0dXJucyBgdHJ1ZWAsIHRoZSBldmVudCBpcyBmb3J3YXJkZWQgdG8gdGhlIG91dHB1dCBzdHJlYW0sXG4gICAgICogb3RoZXJ3aXNlIGl0IGlzIGlnbm9yZWQgYW5kIG5vdCBmb3J3YXJkZWQuXG4gICAgICpcbiAgICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICAgKlxuICAgICAqIGBgYHRleHRcbiAgICAgKiAtLTEtLS0yLS0zLS0tLS00LS0tLS01LS0tNi0tNy04LS1cbiAgICAgKiAgICAgZmlsdGVyKGkgPT4gaSAlIDIgPT09IDApXG4gICAgICogLS0tLS0tMi0tLS0tLS0tNC0tLS0tLS0tLTYtLS0tOC0tXG4gICAgICogYGBgXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBwYXNzZXMgQSBmdW5jdGlvbiBvZiB0eXBlIGAodDogVCkgKz4gYm9vbGVhbmAgdGhhdCB0YWtlc1xuICAgICAqIGFuIGV2ZW50IGZyb20gdGhlIGlucHV0IHN0cmVhbSBhbmQgY2hlY2tzIGlmIGl0IHBhc3NlcywgYnkgcmV0dXJuaW5nIGFcbiAgICAgKiBib29sZWFuLlxuICAgICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICAgKi9cbiAgICBTdHJlYW0ucHJvdG90eXBlLmZpbHRlciA9IGZ1bmN0aW9uIChwYXNzZXMpIHtcbiAgICAgICAgdmFyIHAgPSB0aGlzLl9wcm9kO1xuICAgICAgICBpZiAocCBpbnN0YW5jZW9mIEZpbHRlcilcbiAgICAgICAgICAgIHJldHVybiBuZXcgU3RyZWFtKG5ldyBGaWx0ZXIoYW5kKHAuZiwgcGFzc2VzKSwgcC5pbnMpKTtcbiAgICAgICAgcmV0dXJuIG5ldyBTdHJlYW0obmV3IEZpbHRlcihwYXNzZXMsIHRoaXMpKTtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIExldHMgdGhlIGZpcnN0IGBhbW91bnRgIG1hbnkgZXZlbnRzIGZyb20gdGhlIGlucHV0IHN0cmVhbSBwYXNzIHRvIHRoZVxuICAgICAqIG91dHB1dCBzdHJlYW0sIHRoZW4gbWFrZXMgdGhlIG91dHB1dCBzdHJlYW0gY29tcGxldGUuXG4gICAgICpcbiAgICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICAgKlxuICAgICAqIGBgYHRleHRcbiAgICAgKiAtLWEtLS1iLS1jLS0tLWQtLS1lLS1cbiAgICAgKiAgICB0YWtlKDMpXG4gICAgICogLS1hLS0tYi0tY3xcbiAgICAgKiBgYGBcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBhbW91bnQgSG93IG1hbnkgZXZlbnRzIHRvIGFsbG93IGZyb20gdGhlIGlucHV0IHN0cmVhbVxuICAgICAqIGJlZm9yZSBjb21wbGV0aW5nIHRoZSBvdXRwdXQgc3RyZWFtLlxuICAgICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICAgKi9cbiAgICBTdHJlYW0ucHJvdG90eXBlLnRha2UgPSBmdW5jdGlvbiAoYW1vdW50KSB7XG4gICAgICAgIHJldHVybiBuZXcgKHRoaXMuY3RvcigpKShuZXcgVGFrZShhbW91bnQsIHRoaXMpKTtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIElnbm9yZXMgdGhlIGZpcnN0IGBhbW91bnRgIG1hbnkgZXZlbnRzIGZyb20gdGhlIGlucHV0IHN0cmVhbSwgYW5kIHRoZW5cbiAgICAgKiBhZnRlciB0aGF0IHN0YXJ0cyBmb3J3YXJkaW5nIGV2ZW50cyBmcm9tIHRoZSBpbnB1dCBzdHJlYW0gdG8gdGhlIG91dHB1dFxuICAgICAqIHN0cmVhbS5cbiAgICAgKlxuICAgICAqIE1hcmJsZSBkaWFncmFtOlxuICAgICAqXG4gICAgICogYGBgdGV4dFxuICAgICAqIC0tYS0tLWItLWMtLS0tZC0tLWUtLVxuICAgICAqICAgICAgIGRyb3AoMylcbiAgICAgKiAtLS0tLS0tLS0tLS0tLWQtLS1lLS1cbiAgICAgKiBgYGBcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBhbW91bnQgSG93IG1hbnkgZXZlbnRzIHRvIGlnbm9yZSBmcm9tIHRoZSBpbnB1dCBzdHJlYW1cbiAgICAgKiBiZWZvcmUgZm9yd2FyZGluZyBhbGwgZXZlbnRzIGZyb20gdGhlIGlucHV0IHN0cmVhbSB0byB0aGUgb3V0cHV0IHN0cmVhbS5cbiAgICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAgICovXG4gICAgU3RyZWFtLnByb3RvdHlwZS5kcm9wID0gZnVuY3Rpb24gKGFtb3VudCkge1xuICAgICAgICByZXR1cm4gbmV3IFN0cmVhbShuZXcgRHJvcChhbW91bnQsIHRoaXMpKTtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIFdoZW4gdGhlIGlucHV0IHN0cmVhbSBjb21wbGV0ZXMsIHRoZSBvdXRwdXQgc3RyZWFtIHdpbGwgZW1pdCB0aGUgbGFzdCBldmVudFxuICAgICAqIGVtaXR0ZWQgYnkgdGhlIGlucHV0IHN0cmVhbSwgYW5kIHRoZW4gd2lsbCBhbHNvIGNvbXBsZXRlLlxuICAgICAqXG4gICAgICogTWFyYmxlIGRpYWdyYW06XG4gICAgICpcbiAgICAgKiBgYGB0ZXh0XG4gICAgICogLS1hLS0tYi0tYy0tZC0tLS18XG4gICAgICogICAgICAgbGFzdCgpXG4gICAgICogLS0tLS0tLS0tLS0tLS0tLS1kfFxuICAgICAqIGBgYFxuICAgICAqXG4gICAgICogQHJldHVybiB7U3RyZWFtfVxuICAgICAqL1xuICAgIFN0cmVhbS5wcm90b3R5cGUubGFzdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBTdHJlYW0obmV3IExhc3QodGhpcykpO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogUHJlcGVuZHMgdGhlIGdpdmVuIGBpbml0aWFsYCB2YWx1ZSB0byB0aGUgc2VxdWVuY2Ugb2YgZXZlbnRzIGVtaXR0ZWQgYnkgdGhlXG4gICAgICogaW5wdXQgc3RyZWFtLiBUaGUgcmV0dXJuZWQgc3RyZWFtIGlzIGEgTWVtb3J5U3RyZWFtLCB3aGljaCBtZWFucyBpdCBpc1xuICAgICAqIGFscmVhZHkgYHJlbWVtYmVyKClgJ2QuXG4gICAgICpcbiAgICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICAgKlxuICAgICAqIGBgYHRleHRcbiAgICAgKiAtLS0xLS0tMi0tLS0tMy0tLVxuICAgICAqICAgc3RhcnRXaXRoKDApXG4gICAgICogMC0tMS0tLTItLS0tLTMtLS1cbiAgICAgKiBgYGBcbiAgICAgKlxuICAgICAqIEBwYXJhbSBpbml0aWFsIFRoZSB2YWx1ZSBvciBldmVudCB0byBwcmVwZW5kLlxuICAgICAqIEByZXR1cm4ge01lbW9yeVN0cmVhbX1cbiAgICAgKi9cbiAgICBTdHJlYW0ucHJvdG90eXBlLnN0YXJ0V2l0aCA9IGZ1bmN0aW9uIChpbml0aWFsKSB7XG4gICAgICAgIHJldHVybiBuZXcgTWVtb3J5U3RyZWFtKG5ldyBTdGFydFdpdGgodGhpcywgaW5pdGlhbCkpO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogVXNlcyBhbm90aGVyIHN0cmVhbSB0byBkZXRlcm1pbmUgd2hlbiB0byBjb21wbGV0ZSB0aGUgY3VycmVudCBzdHJlYW0uXG4gICAgICpcbiAgICAgKiBXaGVuIHRoZSBnaXZlbiBgb3RoZXJgIHN0cmVhbSBlbWl0cyBhbiBldmVudCBvciBjb21wbGV0ZXMsIHRoZSBvdXRwdXRcbiAgICAgKiBzdHJlYW0gd2lsbCBjb21wbGV0ZS4gQmVmb3JlIHRoYXQgaGFwcGVucywgdGhlIG91dHB1dCBzdHJlYW0gd2lsbCBiZWhhdmVzXG4gICAgICogbGlrZSB0aGUgaW5wdXQgc3RyZWFtLlxuICAgICAqXG4gICAgICogTWFyYmxlIGRpYWdyYW06XG4gICAgICpcbiAgICAgKiBgYGB0ZXh0XG4gICAgICogLS0tMS0tLTItLS0tLTMtLTQtLS0tNS0tLS02LS0tXG4gICAgICogICBlbmRXaGVuKCAtLS0tLS0tLWEtLWItLXwgKVxuICAgICAqIC0tLTEtLS0yLS0tLS0zLS00LS18XG4gICAgICogYGBgXG4gICAgICpcbiAgICAgKiBAcGFyYW0gb3RoZXIgU29tZSBvdGhlciBzdHJlYW0gdGhhdCBpcyB1c2VkIHRvIGtub3cgd2hlbiBzaG91bGQgdGhlIG91dHB1dFxuICAgICAqIHN0cmVhbSBvZiB0aGlzIG9wZXJhdG9yIGNvbXBsZXRlLlxuICAgICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICAgKi9cbiAgICBTdHJlYW0ucHJvdG90eXBlLmVuZFdoZW4gPSBmdW5jdGlvbiAob3RoZXIpIHtcbiAgICAgICAgcmV0dXJuIG5ldyAodGhpcy5jdG9yKCkpKG5ldyBFbmRXaGVuKG90aGVyLCB0aGlzKSk7XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBcIkZvbGRzXCIgdGhlIHN0cmVhbSBvbnRvIGl0c2VsZi5cbiAgICAgKlxuICAgICAqIENvbWJpbmVzIGV2ZW50cyBmcm9tIHRoZSBwYXN0IHRocm91Z2hvdXRcbiAgICAgKiB0aGUgZW50aXJlIGV4ZWN1dGlvbiBvZiB0aGUgaW5wdXQgc3RyZWFtLCBhbGxvd2luZyB5b3UgdG8gYWNjdW11bGF0ZSB0aGVtXG4gICAgICogdG9nZXRoZXIuIEl0J3MgZXNzZW50aWFsbHkgbGlrZSBgQXJyYXkucHJvdG90eXBlLnJlZHVjZWAuIFRoZSByZXR1cm5lZFxuICAgICAqIHN0cmVhbSBpcyBhIE1lbW9yeVN0cmVhbSwgd2hpY2ggbWVhbnMgaXQgaXMgYWxyZWFkeSBgcmVtZW1iZXIoKWAnZC5cbiAgICAgKlxuICAgICAqIFRoZSBvdXRwdXQgc3RyZWFtIHN0YXJ0cyBieSBlbWl0dGluZyB0aGUgYHNlZWRgIHdoaWNoIHlvdSBnaXZlIGFzIGFyZ3VtZW50LlxuICAgICAqIFRoZW4sIHdoZW4gYW4gZXZlbnQgaGFwcGVucyBvbiB0aGUgaW5wdXQgc3RyZWFtLCBpdCBpcyBjb21iaW5lZCB3aXRoIHRoYXRcbiAgICAgKiBzZWVkIHZhbHVlIHRocm91Z2ggdGhlIGBhY2N1bXVsYXRlYCBmdW5jdGlvbiwgYW5kIHRoZSBvdXRwdXQgdmFsdWUgaXNcbiAgICAgKiBlbWl0dGVkIG9uIHRoZSBvdXRwdXQgc3RyZWFtLiBgZm9sZGAgcmVtZW1iZXJzIHRoYXQgb3V0cHV0IHZhbHVlIGFzIGBhY2NgXG4gICAgICogKFwiYWNjdW11bGF0b3JcIiksIGFuZCB0aGVuIHdoZW4gYSBuZXcgaW5wdXQgZXZlbnQgYHRgIGhhcHBlbnMsIGBhY2NgIHdpbGwgYmVcbiAgICAgKiBjb21iaW5lZCB3aXRoIHRoYXQgdG8gcHJvZHVjZSB0aGUgbmV3IGBhY2NgIGFuZCBzbyBmb3J0aC5cbiAgICAgKlxuICAgICAqIE1hcmJsZSBkaWFncmFtOlxuICAgICAqXG4gICAgICogYGBgdGV4dFxuICAgICAqIC0tLS0tLTEtLS0tLTEtLTItLS0tMS0tLS0xLS0tLS0tXG4gICAgICogICBmb2xkKChhY2MsIHgpID0+IGFjYyArIHgsIDMpXG4gICAgICogMy0tLS0tNC0tLS0tNS0tNy0tLS04LS0tLTktLS0tLS1cbiAgICAgKiBgYGBcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGFjY3VtdWxhdGUgQSBmdW5jdGlvbiBvZiB0eXBlIGAoYWNjOiBSLCB0OiBUKSA9PiBSYCB0aGF0XG4gICAgICogdGFrZXMgdGhlIHByZXZpb3VzIGFjY3VtdWxhdGVkIHZhbHVlIGBhY2NgIGFuZCB0aGUgaW5jb21pbmcgZXZlbnQgZnJvbSB0aGVcbiAgICAgKiBpbnB1dCBzdHJlYW0gYW5kIHByb2R1Y2VzIHRoZSBuZXcgYWNjdW11bGF0ZWQgdmFsdWUuXG4gICAgICogQHBhcmFtIHNlZWQgVGhlIGluaXRpYWwgYWNjdW11bGF0ZWQgdmFsdWUsIG9mIHR5cGUgYFJgLlxuICAgICAqIEByZXR1cm4ge01lbW9yeVN0cmVhbX1cbiAgICAgKi9cbiAgICBTdHJlYW0ucHJvdG90eXBlLmZvbGQgPSBmdW5jdGlvbiAoYWNjdW11bGF0ZSwgc2VlZCkge1xuICAgICAgICByZXR1cm4gbmV3IE1lbW9yeVN0cmVhbShuZXcgRm9sZChhY2N1bXVsYXRlLCBzZWVkLCB0aGlzKSk7XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBSZXBsYWNlcyBhbiBlcnJvciB3aXRoIGFub3RoZXIgc3RyZWFtLlxuICAgICAqXG4gICAgICogV2hlbiAoYW5kIGlmKSBhbiBlcnJvciBoYXBwZW5zIG9uIHRoZSBpbnB1dCBzdHJlYW0sIGluc3RlYWQgb2YgZm9yd2FyZGluZ1xuICAgICAqIHRoYXQgZXJyb3IgdG8gdGhlIG91dHB1dCBzdHJlYW0sICpyZXBsYWNlRXJyb3IqIHdpbGwgY2FsbCB0aGUgYHJlcGxhY2VgXG4gICAgICogZnVuY3Rpb24gd2hpY2ggcmV0dXJucyB0aGUgc3RyZWFtIHRoYXQgdGhlIG91dHB1dCBzdHJlYW0gd2lsbCByZXBsaWNhdGUuXG4gICAgICogQW5kLCBpbiBjYXNlIHRoYXQgbmV3IHN0cmVhbSBhbHNvIGVtaXRzIGFuIGVycm9yLCBgcmVwbGFjZWAgd2lsbCBiZSBjYWxsZWRcbiAgICAgKiBhZ2FpbiB0byBnZXQgYW5vdGhlciBzdHJlYW0gdG8gc3RhcnQgcmVwbGljYXRpbmcuXG4gICAgICpcbiAgICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICAgKlxuICAgICAqIGBgYHRleHRcbiAgICAgKiAtLTEtLS0yLS0tLS0zLS00LS0tLS1YXG4gICAgICogICByZXBsYWNlRXJyb3IoICgpID0+IC0tMTAtLXwgKVxuICAgICAqIC0tMS0tLTItLS0tLTMtLTQtLS0tLS0tLTEwLS18XG4gICAgICogYGBgXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSByZXBsYWNlIEEgZnVuY3Rpb24gb2YgdHlwZSBgKGVycikgPT4gU3RyZWFtYCB0aGF0IHRha2VzXG4gICAgICogdGhlIGVycm9yIHRoYXQgb2NjdXJyZWQgb24gdGhlIGlucHV0IHN0cmVhbSBvciBvbiB0aGUgcHJldmlvdXMgcmVwbGFjZW1lbnRcbiAgICAgKiBzdHJlYW0gYW5kIHJldHVybnMgYSBuZXcgc3RyZWFtLiBUaGUgb3V0cHV0IHN0cmVhbSB3aWxsIGJlaGF2ZSBsaWtlIHRoZVxuICAgICAqIHN0cmVhbSB0aGF0IHRoaXMgZnVuY3Rpb24gcmV0dXJucy5cbiAgICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAgICovXG4gICAgU3RyZWFtLnByb3RvdHlwZS5yZXBsYWNlRXJyb3IgPSBmdW5jdGlvbiAocmVwbGFjZSkge1xuICAgICAgICByZXR1cm4gbmV3ICh0aGlzLmN0b3IoKSkobmV3IFJlcGxhY2VFcnJvcihyZXBsYWNlLCB0aGlzKSk7XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBGbGF0dGVucyBhIFwic3RyZWFtIG9mIHN0cmVhbXNcIiwgaGFuZGxpbmcgb25seSBvbmUgbmVzdGVkIHN0cmVhbSBhdCBhIHRpbWVcbiAgICAgKiAobm8gY29uY3VycmVuY3kpLlxuICAgICAqXG4gICAgICogSWYgdGhlIGlucHV0IHN0cmVhbSBpcyBhIHN0cmVhbSB0aGF0IGVtaXRzIHN0cmVhbXMsIHRoZW4gdGhpcyBvcGVyYXRvciB3aWxsXG4gICAgICogcmV0dXJuIGFuIG91dHB1dCBzdHJlYW0gd2hpY2ggaXMgYSBmbGF0IHN0cmVhbTogZW1pdHMgcmVndWxhciBldmVudHMuIFRoZVxuICAgICAqIGZsYXR0ZW5pbmcgaGFwcGVucyB3aXRob3V0IGNvbmN1cnJlbmN5LiBJdCB3b3JrcyBsaWtlIHRoaXM6IHdoZW4gdGhlIGlucHV0XG4gICAgICogc3RyZWFtIGVtaXRzIGEgbmVzdGVkIHN0cmVhbSwgKmZsYXR0ZW4qIHdpbGwgc3RhcnQgaW1pdGF0aW5nIHRoYXQgbmVzdGVkXG4gICAgICogb25lLiBIb3dldmVyLCBhcyBzb29uIGFzIHRoZSBuZXh0IG5lc3RlZCBzdHJlYW0gaXMgZW1pdHRlZCBvbiB0aGUgaW5wdXRcbiAgICAgKiBzdHJlYW0sICpmbGF0dGVuKiB3aWxsIGZvcmdldCB0aGUgcHJldmlvdXMgbmVzdGVkIG9uZSBpdCB3YXMgaW1pdGF0aW5nLCBhbmRcbiAgICAgKiB3aWxsIHN0YXJ0IGltaXRhdGluZyB0aGUgbmV3IG5lc3RlZCBvbmUuXG4gICAgICpcbiAgICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICAgKlxuICAgICAqIGBgYHRleHRcbiAgICAgKiAtLSstLS0tLS0tLSstLS0tLS0tLS0tLS0tLS1cbiAgICAgKiAgIFxcICAgICAgICBcXFxuICAgICAqICAgIFxcICAgICAgIC0tLS0xLS0tLTItLS0zLS1cbiAgICAgKiAgICAtLWEtLWItLS0tYy0tLS1kLS0tLS0tLS1cbiAgICAgKiAgICAgICAgICAgZmxhdHRlblxuICAgICAqIC0tLS0tYS0tYi0tLS0tLTEtLS0tMi0tLTMtLVxuICAgICAqIGBgYFxuICAgICAqXG4gICAgICogQHJldHVybiB7U3RyZWFtfVxuICAgICAqL1xuICAgIFN0cmVhbS5wcm90b3R5cGUuZmxhdHRlbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHAgPSB0aGlzLl9wcm9kO1xuICAgICAgICByZXR1cm4gbmV3IFN0cmVhbShuZXcgRmxhdHRlbih0aGlzKSk7XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBQYXNzZXMgdGhlIGlucHV0IHN0cmVhbSB0byBhIGN1c3RvbSBvcGVyYXRvciwgdG8gcHJvZHVjZSBhbiBvdXRwdXQgc3RyZWFtLlxuICAgICAqXG4gICAgICogKmNvbXBvc2UqIGlzIGEgaGFuZHkgd2F5IG9mIHVzaW5nIGFuIGV4aXN0aW5nIGZ1bmN0aW9uIGluIGEgY2hhaW5lZCBzdHlsZS5cbiAgICAgKiBJbnN0ZWFkIG9mIHdyaXRpbmcgYG91dFN0cmVhbSA9IGYoaW5TdHJlYW0pYCB5b3UgY2FuIHdyaXRlXG4gICAgICogYG91dFN0cmVhbSA9IGluU3RyZWFtLmNvbXBvc2UoZilgLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gb3BlcmF0b3IgQSBmdW5jdGlvbiB0aGF0IHRha2VzIGEgc3RyZWFtIGFzIGlucHV0IGFuZFxuICAgICAqIHJldHVybnMgYSBzdHJlYW0gYXMgd2VsbC5cbiAgICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAgICovXG4gICAgU3RyZWFtLnByb3RvdHlwZS5jb21wb3NlID0gZnVuY3Rpb24gKG9wZXJhdG9yKSB7XG4gICAgICAgIHJldHVybiBvcGVyYXRvcih0aGlzKTtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIFJldHVybnMgYW4gb3V0cHV0IHN0cmVhbSB0aGF0IGJlaGF2ZXMgbGlrZSB0aGUgaW5wdXQgc3RyZWFtLCBidXQgYWxzb1xuICAgICAqIHJlbWVtYmVycyB0aGUgbW9zdCByZWNlbnQgZXZlbnQgdGhhdCBoYXBwZW5zIG9uIHRoZSBpbnB1dCBzdHJlYW0sIHNvIHRoYXQgYVxuICAgICAqIG5ld2x5IGFkZGVkIGxpc3RlbmVyIHdpbGwgaW1tZWRpYXRlbHkgcmVjZWl2ZSB0aGF0IG1lbW9yaXNlZCBldmVudC5cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge01lbW9yeVN0cmVhbX1cbiAgICAgKi9cbiAgICBTdHJlYW0ucHJvdG90eXBlLnJlbWVtYmVyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gbmV3IE1lbW9yeVN0cmVhbShuZXcgUmVtZW1iZXIodGhpcykpO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhbiBvdXRwdXQgc3RyZWFtIHRoYXQgaWRlbnRpY2FsbHkgYmVoYXZlcyBsaWtlIHRoZSBpbnB1dCBzdHJlYW0sXG4gICAgICogYnV0IGFsc28gcnVucyBhIGBzcHlgIGZ1bmN0aW9uIGZvciBlYWNoIGV2ZW50LCB0byBoZWxwIHlvdSBkZWJ1ZyB5b3VyIGFwcC5cbiAgICAgKlxuICAgICAqICpkZWJ1ZyogdGFrZXMgYSBgc3B5YCBmdW5jdGlvbiBhcyBhcmd1bWVudCwgYW5kIHJ1bnMgdGhhdCBmb3IgZWFjaCBldmVudFxuICAgICAqIGhhcHBlbmluZyBvbiB0aGUgaW5wdXQgc3RyZWFtLiBJZiB5b3UgZG9uJ3QgcHJvdmlkZSB0aGUgYHNweWAgYXJndW1lbnQsXG4gICAgICogdGhlbiAqZGVidWcqIHdpbGwganVzdCBgY29uc29sZS5sb2dgIGVhY2ggZXZlbnQuIFRoaXMgaGVscHMgeW91IHRvXG4gICAgICogdW5kZXJzdGFuZCB0aGUgZmxvdyBvZiBldmVudHMgdGhyb3VnaCBzb21lIG9wZXJhdG9yIGNoYWluLlxuICAgICAqXG4gICAgICogUGxlYXNlIG5vdGUgdGhhdCBpZiB0aGUgb3V0cHV0IHN0cmVhbSBoYXMgbm8gbGlzdGVuZXJzLCB0aGVuIGl0IHdpbGwgbm90XG4gICAgICogc3RhcnQsIHdoaWNoIG1lYW5zIGBzcHlgIHdpbGwgbmV2ZXIgcnVuIGJlY2F1c2Ugbm8gYWN0dWFsIGV2ZW50IGhhcHBlbnMgaW5cbiAgICAgKiB0aGF0IGNhc2UuXG4gICAgICpcbiAgICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICAgKlxuICAgICAqIGBgYHRleHRcbiAgICAgKiAtLTEtLS0tMi0tLS0tMy0tLS0tNC0tXG4gICAgICogICAgICAgICBkZWJ1Z1xuICAgICAqIC0tMS0tLS0yLS0tLS0zLS0tLS00LS1cbiAgICAgKiBgYGBcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGxhYmVsT3JTcHkgQSBzdHJpbmcgdG8gdXNlIGFzIHRoZSBsYWJlbCB3aGVuIHByaW50aW5nXG4gICAgICogZGVidWcgaW5mb3JtYXRpb24gb24gdGhlIGNvbnNvbGUsIG9yIGEgJ3NweScgZnVuY3Rpb24gdGhhdCB0YWtlcyBhbiBldmVudFxuICAgICAqIGFzIGFyZ3VtZW50LCBhbmQgZG9lcyBub3QgbmVlZCB0byByZXR1cm4gYW55dGhpbmcuXG4gICAgICogQHJldHVybiB7U3RyZWFtfVxuICAgICAqL1xuICAgIFN0cmVhbS5wcm90b3R5cGUuZGVidWcgPSBmdW5jdGlvbiAobGFiZWxPclNweSkge1xuICAgICAgICByZXR1cm4gbmV3ICh0aGlzLmN0b3IoKSkobmV3IERlYnVnKHRoaXMsIGxhYmVsT3JTcHkpKTtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqICppbWl0YXRlKiBjaGFuZ2VzIHRoaXMgY3VycmVudCBTdHJlYW0gdG8gZW1pdCB0aGUgc2FtZSBldmVudHMgdGhhdCB0aGVcbiAgICAgKiBgb3RoZXJgIGdpdmVuIFN0cmVhbSBkb2VzLiBUaGlzIG1ldGhvZCByZXR1cm5zIG5vdGhpbmcuXG4gICAgICpcbiAgICAgKiBUaGlzIG1ldGhvZCBleGlzdHMgdG8gYWxsb3cgb25lIHRoaW5nOiAqKmNpcmN1bGFyIGRlcGVuZGVuY3kgb2Ygc3RyZWFtcyoqLlxuICAgICAqIEZvciBpbnN0YW5jZSwgbGV0J3MgaW1hZ2luZSB0aGF0IGZvciBzb21lIHJlYXNvbiB5b3UgbmVlZCB0byBjcmVhdGUgYVxuICAgICAqIGNpcmN1bGFyIGRlcGVuZGVuY3kgd2hlcmUgc3RyZWFtIGBmaXJzdCRgIGRlcGVuZHMgb24gc3RyZWFtIGBzZWNvbmQkYFxuICAgICAqIHdoaWNoIGluIHR1cm4gZGVwZW5kcyBvbiBgZmlyc3QkYDpcbiAgICAgKlxuICAgICAqIDwhLS0gc2tpcC1leGFtcGxlIC0tPlxuICAgICAqIGBgYGpzXG4gICAgICogaW1wb3J0IGRlbGF5IGZyb20gJ3hzdHJlYW0vZXh0cmEvZGVsYXknXG4gICAgICpcbiAgICAgKiB2YXIgZmlyc3QkID0gc2Vjb25kJC5tYXAoeCA9PiB4ICogMTApLnRha2UoMyk7XG4gICAgICogdmFyIHNlY29uZCQgPSBmaXJzdCQubWFwKHggPT4geCArIDEpLnN0YXJ0V2l0aCgxKS5jb21wb3NlKGRlbGF5KDEwMCkpO1xuICAgICAqIGBgYFxuICAgICAqXG4gICAgICogSG93ZXZlciwgdGhhdCBpcyBpbnZhbGlkIEphdmFTY3JpcHQsIGJlY2F1c2UgYHNlY29uZCRgIGlzIHVuZGVmaW5lZFxuICAgICAqIG9uIHRoZSBmaXJzdCBsaW5lLiBUaGlzIGlzIGhvdyAqaW1pdGF0ZSogY2FuIGhlbHAgc29sdmUgaXQ6XG4gICAgICpcbiAgICAgKiBgYGBqc1xuICAgICAqIGltcG9ydCBkZWxheSBmcm9tICd4c3RyZWFtL2V4dHJhL2RlbGF5J1xuICAgICAqXG4gICAgICogdmFyIHNlY29uZFByb3h5JCA9IHhzLmNyZWF0ZSgpO1xuICAgICAqIHZhciBmaXJzdCQgPSBzZWNvbmRQcm94eSQubWFwKHggPT4geCAqIDEwKS50YWtlKDMpO1xuICAgICAqIHZhciBzZWNvbmQkID0gZmlyc3QkLm1hcCh4ID0+IHggKyAxKS5zdGFydFdpdGgoMSkuY29tcG9zZShkZWxheSgxMDApKTtcbiAgICAgKiBzZWNvbmRQcm94eSQuaW1pdGF0ZShzZWNvbmQkKTtcbiAgICAgKiBgYGBcbiAgICAgKlxuICAgICAqIFdlIGNyZWF0ZSBgc2Vjb25kUHJveHkkYCBiZWZvcmUgdGhlIG90aGVycywgc28gaXQgY2FuIGJlIHVzZWQgaW4gdGhlXG4gICAgICogZGVjbGFyYXRpb24gb2YgYGZpcnN0JGAuIFRoZW4sIGFmdGVyIGJvdGggYGZpcnN0JGAgYW5kIGBzZWNvbmQkYCBhcmVcbiAgICAgKiBkZWZpbmVkLCB3ZSBob29rIGBzZWNvbmRQcm94eSRgIHdpdGggYHNlY29uZCRgIHdpdGggYGltaXRhdGUoKWAgdG8gdGVsbFxuICAgICAqIHRoYXQgdGhleSBhcmUgXCJ0aGUgc2FtZVwiLiBgaW1pdGF0ZWAgd2lsbCBub3QgdHJpZ2dlciB0aGUgc3RhcnQgb2YgYW55XG4gICAgICogc3RyZWFtLCBpdCBqdXN0IGJpbmRzIGBzZWNvbmRQcm94eSRgIGFuZCBgc2Vjb25kJGAgdG9nZXRoZXIuXG4gICAgICpcbiAgICAgKiBUaGUgZm9sbG93aW5nIGlzIGFuIGV4YW1wbGUgd2hlcmUgYGltaXRhdGUoKWAgaXMgaW1wb3J0YW50IGluIEN5Y2xlLmpzXG4gICAgICogYXBwbGljYXRpb25zLiBBIHBhcmVudCBjb21wb25lbnQgY29udGFpbnMgc29tZSBjaGlsZCBjb21wb25lbnRzLiBBIGNoaWxkXG4gICAgICogaGFzIGFuIGFjdGlvbiBzdHJlYW0gd2hpY2ggaXMgZ2l2ZW4gdG8gdGhlIHBhcmVudCB0byBkZWZpbmUgaXRzIHN0YXRlOlxuICAgICAqXG4gICAgICogPCEtLSBza2lwLWV4YW1wbGUgLS0+XG4gICAgICogYGBganNcbiAgICAgKiBjb25zdCBjaGlsZEFjdGlvblByb3h5JCA9IHhzLmNyZWF0ZSgpO1xuICAgICAqIGNvbnN0IHBhcmVudCA9IFBhcmVudCh7Li4uc291cmNlcywgY2hpbGRBY3Rpb24kOiBjaGlsZEFjdGlvblByb3h5JH0pO1xuICAgICAqIGNvbnN0IGNoaWxkQWN0aW9uJCA9IHBhcmVudC5zdGF0ZSQubWFwKHMgPT4gcy5jaGlsZC5hY3Rpb24kKS5mbGF0dGVuKCk7XG4gICAgICogY2hpbGRBY3Rpb25Qcm94eSQuaW1pdGF0ZShjaGlsZEFjdGlvbiQpO1xuICAgICAqIGBgYFxuICAgICAqXG4gICAgICogTm90ZSwgdGhvdWdoLCB0aGF0ICoqYGltaXRhdGUoKWAgZG9lcyBub3Qgc3VwcG9ydCBNZW1vcnlTdHJlYW1zKiouIElmIHdlXG4gICAgICogd291bGQgYXR0ZW1wdCB0byBpbWl0YXRlIGEgTWVtb3J5U3RyZWFtIGluIGEgY2lyY3VsYXIgZGVwZW5kZW5jeSwgd2Ugd291bGRcbiAgICAgKiBlaXRoZXIgZ2V0IGEgcmFjZSBjb25kaXRpb24gKHdoZXJlIHRoZSBzeW1wdG9tIHdvdWxkIGJlIFwibm90aGluZyBoYXBwZW5zXCIpXG4gICAgICogb3IgYW4gaW5maW5pdGUgY3ljbGljIGVtaXNzaW9uIG9mIHZhbHVlcy4gSXQncyB1c2VmdWwgdG8gdGhpbmsgYWJvdXRcbiAgICAgKiBNZW1vcnlTdHJlYW1zIGFzIGNlbGxzIGluIGEgc3ByZWFkc2hlZXQuIEl0IGRvZXNuJ3QgbWFrZSBhbnkgc2Vuc2UgdG9cbiAgICAgKiBkZWZpbmUgYSBzcHJlYWRzaGVldCBjZWxsIGBBMWAgd2l0aCBhIGZvcm11bGEgdGhhdCBkZXBlbmRzIG9uIGBCMWAgYW5kXG4gICAgICogY2VsbCBgQjFgIGRlZmluZWQgd2l0aCBhIGZvcm11bGEgdGhhdCBkZXBlbmRzIG9uIGBBMWAuXG4gICAgICpcbiAgICAgKiBJZiB5b3UgZmluZCB5b3Vyc2VsZiB3YW50aW5nIHRvIHVzZSBgaW1pdGF0ZSgpYCB3aXRoIGFcbiAgICAgKiBNZW1vcnlTdHJlYW0sIHlvdSBzaG91bGQgcmV3b3JrIHlvdXIgY29kZSBhcm91bmQgYGltaXRhdGUoKWAgdG8gdXNlIGFcbiAgICAgKiBTdHJlYW0gaW5zdGVhZC4gTG9vayBmb3IgdGhlIHN0cmVhbSBpbiB0aGUgY2lyY3VsYXIgZGVwZW5kZW5jeSB0aGF0XG4gICAgICogcmVwcmVzZW50cyBhbiBldmVudCBzdHJlYW0sIGFuZCB0aGF0IHdvdWxkIGJlIGEgY2FuZGlkYXRlIGZvciBjcmVhdGluZyBhXG4gICAgICogcHJveHkgU3RyZWFtIHdoaWNoIHRoZW4gaW1pdGF0ZXMgdGhlIHRhcmdldCBTdHJlYW0uXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmVhbX0gdGFyZ2V0IFRoZSBvdGhlciBzdHJlYW0gdG8gaW1pdGF0ZSBvbiB0aGUgY3VycmVudCBvbmUuIE11c3RcbiAgICAgKiBub3QgYmUgYSBNZW1vcnlTdHJlYW0uXG4gICAgICovXG4gICAgU3RyZWFtLnByb3RvdHlwZS5pbWl0YXRlID0gZnVuY3Rpb24gKHRhcmdldCkge1xuICAgICAgICBpZiAodGFyZ2V0IGluc3RhbmNlb2YgTWVtb3J5U3RyZWFtKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdBIE1lbW9yeVN0cmVhbSB3YXMgZ2l2ZW4gdG8gaW1pdGF0ZSgpLCBidXQgaXQgb25seSAnICtcbiAgICAgICAgICAgICAgICAnc3VwcG9ydHMgYSBTdHJlYW0uIFJlYWQgbW9yZSBhYm91dCB0aGlzIHJlc3RyaWN0aW9uIGhlcmU6ICcgK1xuICAgICAgICAgICAgICAgICdodHRwczovL2dpdGh1Yi5jb20vc3RhbHR6L3hzdHJlYW0jZmFxJyk7XG4gICAgICAgIHRoaXMuX3RhcmdldCA9IHRhcmdldDtcbiAgICAgICAgZm9yICh2YXIgaWxzID0gdGhpcy5faWxzLCBOID0gaWxzLmxlbmd0aCwgaSA9IDA7IGkgPCBOOyBpKyspXG4gICAgICAgICAgICB0YXJnZXQuX2FkZChpbHNbaV0pO1xuICAgICAgICB0aGlzLl9pbHMgPSBbXTtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIEZvcmNlcyB0aGUgU3RyZWFtIHRvIGVtaXQgdGhlIGdpdmVuIHZhbHVlIHRvIGl0cyBsaXN0ZW5lcnMuXG4gICAgICpcbiAgICAgKiBBcyB0aGUgbmFtZSBpbmRpY2F0ZXMsIGlmIHlvdSB1c2UgdGhpcywgeW91IGFyZSBtb3N0IGxpa2VseSBkb2luZyBzb21ldGhpbmdcbiAgICAgKiBUaGUgV3JvbmcgV2F5LiBQbGVhc2UgdHJ5IHRvIHVuZGVyc3RhbmQgdGhlIHJlYWN0aXZlIHdheSBiZWZvcmUgdXNpbmcgdGhpc1xuICAgICAqIG1ldGhvZC4gVXNlIGl0IG9ubHkgd2hlbiB5b3Uga25vdyB3aGF0IHlvdSBhcmUgZG9pbmcuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdmFsdWUgVGhlIFwibmV4dFwiIHZhbHVlIHlvdSB3YW50IHRvIGJyb2FkY2FzdCB0byBhbGwgbGlzdGVuZXJzIG9mXG4gICAgICogdGhpcyBTdHJlYW0uXG4gICAgICovXG4gICAgU3RyZWFtLnByb3RvdHlwZS5zaGFtZWZ1bGx5U2VuZE5leHQgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgdGhpcy5fbih2YWx1ZSk7XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBGb3JjZXMgdGhlIFN0cmVhbSB0byBlbWl0IHRoZSBnaXZlbiBlcnJvciB0byBpdHMgbGlzdGVuZXJzLlxuICAgICAqXG4gICAgICogQXMgdGhlIG5hbWUgaW5kaWNhdGVzLCBpZiB5b3UgdXNlIHRoaXMsIHlvdSBhcmUgbW9zdCBsaWtlbHkgZG9pbmcgc29tZXRoaW5nXG4gICAgICogVGhlIFdyb25nIFdheS4gUGxlYXNlIHRyeSB0byB1bmRlcnN0YW5kIHRoZSByZWFjdGl2ZSB3YXkgYmVmb3JlIHVzaW5nIHRoaXNcbiAgICAgKiBtZXRob2QuIFVzZSBpdCBvbmx5IHdoZW4geW91IGtub3cgd2hhdCB5b3UgYXJlIGRvaW5nLlxuICAgICAqXG4gICAgICogQHBhcmFtIHthbnl9IGVycm9yIFRoZSBlcnJvciB5b3Ugd2FudCB0byBicm9hZGNhc3QgdG8gYWxsIHRoZSBsaXN0ZW5lcnMgb2ZcbiAgICAgKiB0aGlzIFN0cmVhbS5cbiAgICAgKi9cbiAgICBTdHJlYW0ucHJvdG90eXBlLnNoYW1lZnVsbHlTZW5kRXJyb3IgPSBmdW5jdGlvbiAoZXJyb3IpIHtcbiAgICAgICAgdGhpcy5fZShlcnJvcik7XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBGb3JjZXMgdGhlIFN0cmVhbSB0byBlbWl0IHRoZSBcImNvbXBsZXRlZFwiIGV2ZW50IHRvIGl0cyBsaXN0ZW5lcnMuXG4gICAgICpcbiAgICAgKiBBcyB0aGUgbmFtZSBpbmRpY2F0ZXMsIGlmIHlvdSB1c2UgdGhpcywgeW91IGFyZSBtb3N0IGxpa2VseSBkb2luZyBzb21ldGhpbmdcbiAgICAgKiBUaGUgV3JvbmcgV2F5LiBQbGVhc2UgdHJ5IHRvIHVuZGVyc3RhbmQgdGhlIHJlYWN0aXZlIHdheSBiZWZvcmUgdXNpbmcgdGhpc1xuICAgICAqIG1ldGhvZC4gVXNlIGl0IG9ubHkgd2hlbiB5b3Uga25vdyB3aGF0IHlvdSBhcmUgZG9pbmcuXG4gICAgICovXG4gICAgU3RyZWFtLnByb3RvdHlwZS5zaGFtZWZ1bGx5U2VuZENvbXBsZXRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLl9jKCk7XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBBZGRzIGEgXCJkZWJ1Z1wiIGxpc3RlbmVyIHRvIHRoZSBzdHJlYW0uIFRoZXJlIGNhbiBvbmx5IGJlIG9uZSBkZWJ1Z1xuICAgICAqIGxpc3RlbmVyLCB0aGF0J3Mgd2h5IHRoaXMgaXMgJ3NldERlYnVnTGlzdGVuZXInLiBUbyByZW1vdmUgdGhlIGRlYnVnXG4gICAgICogbGlzdGVuZXIsIGp1c3QgY2FsbCBzZXREZWJ1Z0xpc3RlbmVyKG51bGwpLlxuICAgICAqXG4gICAgICogQSBkZWJ1ZyBsaXN0ZW5lciBpcyBsaWtlIGFueSBvdGhlciBsaXN0ZW5lci4gVGhlIG9ubHkgZGlmZmVyZW5jZSBpcyB0aGF0IGFcbiAgICAgKiBkZWJ1ZyBsaXN0ZW5lciBpcyBcInN0ZWFsdGh5XCI6IGl0cyBwcmVzZW5jZS9hYnNlbmNlIGRvZXMgbm90IHRyaWdnZXIgdGhlXG4gICAgICogc3RhcnQvc3RvcCBvZiB0aGUgc3RyZWFtIChvciB0aGUgcHJvZHVjZXIgaW5zaWRlIHRoZSBzdHJlYW0pLiBUaGlzIGlzXG4gICAgICogdXNlZnVsIHNvIHlvdSBjYW4gaW5zcGVjdCB3aGF0IGlzIGdvaW5nIG9uIHdpdGhvdXQgY2hhbmdpbmcgdGhlIGJlaGF2aW9yXG4gICAgICogb2YgdGhlIHByb2dyYW0uIElmIHlvdSBoYXZlIGFuIGlkbGUgc3RyZWFtIGFuZCB5b3UgYWRkIGEgbm9ybWFsIGxpc3RlbmVyIHRvXG4gICAgICogaXQsIHRoZSBzdHJlYW0gd2lsbCBzdGFydCBleGVjdXRpbmcuIEJ1dCBpZiB5b3Ugc2V0IGEgZGVidWcgbGlzdGVuZXIgb24gYW5cbiAgICAgKiBpZGxlIHN0cmVhbSwgaXQgd29uJ3Qgc3RhcnQgZXhlY3V0aW5nIChub3QgdW50aWwgdGhlIGZpcnN0IG5vcm1hbCBsaXN0ZW5lclxuICAgICAqIGlzIGFkZGVkKS5cbiAgICAgKlxuICAgICAqIEFzIHRoZSBuYW1lIGluZGljYXRlcywgd2UgZG9uJ3QgcmVjb21tZW5kIHVzaW5nIHRoaXMgbWV0aG9kIHRvIGJ1aWxkIGFwcFxuICAgICAqIGxvZ2ljLiBJbiBmYWN0LCBpbiBtb3N0IGNhc2VzIHRoZSBkZWJ1ZyBvcGVyYXRvciB3b3JrcyBqdXN0IGZpbmUuIE9ubHkgdXNlXG4gICAgICogdGhpcyBvbmUgaWYgeW91IGtub3cgd2hhdCB5b3UncmUgZG9pbmcuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0xpc3RlbmVyPFQ+fSBsaXN0ZW5lclxuICAgICAqL1xuICAgIFN0cmVhbS5wcm90b3R5cGUuc2V0RGVidWdMaXN0ZW5lciA9IGZ1bmN0aW9uIChsaXN0ZW5lcikge1xuICAgICAgICBpZiAoIWxpc3RlbmVyKSB7XG4gICAgICAgICAgICB0aGlzLl9kID0gZmFsc2U7XG4gICAgICAgICAgICB0aGlzLl9kbCA9IE5PO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fZCA9IHRydWU7XG4gICAgICAgICAgICBsaXN0ZW5lci5fbiA9IGxpc3RlbmVyLm5leHQgfHwgbm9vcDtcbiAgICAgICAgICAgIGxpc3RlbmVyLl9lID0gbGlzdGVuZXIuZXJyb3IgfHwgbm9vcDtcbiAgICAgICAgICAgIGxpc3RlbmVyLl9jID0gbGlzdGVuZXIuY29tcGxldGUgfHwgbm9vcDtcbiAgICAgICAgICAgIHRoaXMuX2RsID0gbGlzdGVuZXI7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHJldHVybiBTdHJlYW07XG59KCkpO1xuLyoqXG4gKiBCbGVuZHMgbXVsdGlwbGUgc3RyZWFtcyB0b2dldGhlciwgZW1pdHRpbmcgZXZlbnRzIGZyb20gYWxsIG9mIHRoZW1cbiAqIGNvbmN1cnJlbnRseS5cbiAqXG4gKiAqbWVyZ2UqIHRha2VzIG11bHRpcGxlIHN0cmVhbXMgYXMgYXJndW1lbnRzLCBhbmQgY3JlYXRlcyBhIHN0cmVhbSB0aGF0XG4gKiBiZWhhdmVzIGxpa2UgZWFjaCBvZiB0aGUgYXJndW1lbnQgc3RyZWFtcywgaW4gcGFyYWxsZWwuXG4gKlxuICogTWFyYmxlIGRpYWdyYW06XG4gKlxuICogYGBgdGV4dFxuICogLS0xLS0tLTItLS0tLTMtLS0tLS0tLTQtLS1cbiAqIC0tLS1hLS0tLS1iLS0tLWMtLS1kLS0tLS0tXG4gKiAgICAgICAgICAgIG1lcmdlXG4gKiAtLTEtYS0tMi0tYi0tMy1jLS0tZC0tNC0tLVxuICogYGBgXG4gKlxuICogQGZhY3RvcnkgdHJ1ZVxuICogQHBhcmFtIHtTdHJlYW19IHN0cmVhbTEgQSBzdHJlYW0gdG8gbWVyZ2UgdG9nZXRoZXIgd2l0aCBvdGhlciBzdHJlYW1zLlxuICogQHBhcmFtIHtTdHJlYW19IHN0cmVhbTIgQSBzdHJlYW0gdG8gbWVyZ2UgdG9nZXRoZXIgd2l0aCBvdGhlciBzdHJlYW1zLiBUd29cbiAqIG9yIG1vcmUgc3RyZWFtcyBtYXkgYmUgZ2l2ZW4gYXMgYXJndW1lbnRzLlxuICogQHJldHVybiB7U3RyZWFtfVxuICovXG5TdHJlYW0ubWVyZ2UgPSBmdW5jdGlvbiBtZXJnZSgpIHtcbiAgICB2YXIgc3RyZWFtcyA9IFtdO1xuICAgIGZvciAodmFyIF9pID0gMDsgX2kgPCBhcmd1bWVudHMubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgIHN0cmVhbXNbX2ldID0gYXJndW1lbnRzW19pXTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBTdHJlYW0obmV3IE1lcmdlKHN0cmVhbXMpKTtcbn07XG4vKipcbiAqIENvbWJpbmVzIG11bHRpcGxlIGlucHV0IHN0cmVhbXMgdG9nZXRoZXIgdG8gcmV0dXJuIGEgc3RyZWFtIHdob3NlIGV2ZW50c1xuICogYXJlIGFycmF5cyB0aGF0IGNvbGxlY3QgdGhlIGxhdGVzdCBldmVudHMgZnJvbSBlYWNoIGlucHV0IHN0cmVhbS5cbiAqXG4gKiAqY29tYmluZSogaW50ZXJuYWxseSByZW1lbWJlcnMgdGhlIG1vc3QgcmVjZW50IGV2ZW50IGZyb20gZWFjaCBvZiB0aGUgaW5wdXRcbiAqIHN0cmVhbXMuIFdoZW4gYW55IG9mIHRoZSBpbnB1dCBzdHJlYW1zIGVtaXRzIGFuIGV2ZW50LCB0aGF0IGV2ZW50IHRvZ2V0aGVyXG4gKiB3aXRoIGFsbCB0aGUgb3RoZXIgc2F2ZWQgZXZlbnRzIGFyZSBjb21iaW5lZCBpbnRvIGFuIGFycmF5LiBUaGF0IGFycmF5IHdpbGxcbiAqIGJlIGVtaXR0ZWQgb24gdGhlIG91dHB1dCBzdHJlYW0uIEl0J3MgZXNzZW50aWFsbHkgYSB3YXkgb2Ygam9pbmluZyB0b2dldGhlclxuICogdGhlIGV2ZW50cyBmcm9tIG11bHRpcGxlIHN0cmVhbXMuXG4gKlxuICogTWFyYmxlIGRpYWdyYW06XG4gKlxuICogYGBgdGV4dFxuICogLS0xLS0tLTItLS0tLTMtLS0tLS0tLTQtLS1cbiAqIC0tLS1hLS0tLS1iLS0tLS1jLS1kLS0tLS0tXG4gKiAgICAgICAgICBjb21iaW5lXG4gKiAtLS0tMWEtMmEtMmItM2ItM2MtM2QtNGQtLVxuICogYGBgXG4gKlxuICogTm90ZTogdG8gbWluaW1pemUgZ2FyYmFnZSBjb2xsZWN0aW9uLCAqY29tYmluZSogdXNlcyB0aGUgc2FtZSBhcnJheVxuICogaW5zdGFuY2UgZm9yIGVhY2ggZW1pc3Npb24uICBJZiB5b3UgbmVlZCB0byBjb21wYXJlIGVtaXNzaW9ucyBvdmVyIHRpbWUsXG4gKiBjYWNoZSB0aGUgdmFsdWVzIHdpdGggYG1hcGAgZmlyc3Q6XG4gKlxuICogYGBganNcbiAqIGltcG9ydCBwYWlyd2lzZSBmcm9tICd4c3RyZWFtL2V4dHJhL3BhaXJ3aXNlJ1xuICpcbiAqIGNvbnN0IHN0cmVhbTEgPSB4cy5vZigxKTtcbiAqIGNvbnN0IHN0cmVhbTIgPSB4cy5vZigyKTtcbiAqXG4gKiB4cy5jb21iaW5lKHN0cmVhbTEsIHN0cmVhbTIpLm1hcChcbiAqICAgY29tYmluZWRFbWlzc2lvbnMgPT4gKFsgLi4uY29tYmluZWRFbWlzc2lvbnMgXSlcbiAqICkuY29tcG9zZShwYWlyd2lzZSlcbiAqIGBgYFxuICpcbiAqIEBmYWN0b3J5IHRydWVcbiAqIEBwYXJhbSB7U3RyZWFtfSBzdHJlYW0xIEEgc3RyZWFtIHRvIGNvbWJpbmUgdG9nZXRoZXIgd2l0aCBvdGhlciBzdHJlYW1zLlxuICogQHBhcmFtIHtTdHJlYW19IHN0cmVhbTIgQSBzdHJlYW0gdG8gY29tYmluZSB0b2dldGhlciB3aXRoIG90aGVyIHN0cmVhbXMuXG4gKiBNdWx0aXBsZSBzdHJlYW1zLCBub3QganVzdCB0d28sIG1heSBiZSBnaXZlbiBhcyBhcmd1bWVudHMuXG4gKiBAcmV0dXJuIHtTdHJlYW19XG4gKi9cblN0cmVhbS5jb21iaW5lID0gZnVuY3Rpb24gY29tYmluZSgpIHtcbiAgICB2YXIgc3RyZWFtcyA9IFtdO1xuICAgIGZvciAodmFyIF9pID0gMDsgX2kgPCBhcmd1bWVudHMubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgIHN0cmVhbXNbX2ldID0gYXJndW1lbnRzW19pXTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBTdHJlYW0obmV3IENvbWJpbmUoc3RyZWFtcykpO1xufTtcbmV4cG9ydHMuU3RyZWFtID0gU3RyZWFtO1xudmFyIE1lbW9yeVN0cmVhbSA9IChmdW5jdGlvbiAoX3N1cGVyKSB7XG4gICAgX19leHRlbmRzKE1lbW9yeVN0cmVhbSwgX3N1cGVyKTtcbiAgICBmdW5jdGlvbiBNZW1vcnlTdHJlYW0ocHJvZHVjZXIpIHtcbiAgICAgICAgdmFyIF90aGlzID0gX3N1cGVyLmNhbGwodGhpcywgcHJvZHVjZXIpIHx8IHRoaXM7XG4gICAgICAgIF90aGlzLl9oYXMgPSBmYWxzZTtcbiAgICAgICAgcmV0dXJuIF90aGlzO1xuICAgIH1cbiAgICBNZW1vcnlTdHJlYW0ucHJvdG90eXBlLl9uID0gZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgdGhpcy5fdiA9IHg7XG4gICAgICAgIHRoaXMuX2hhcyA9IHRydWU7XG4gICAgICAgIF9zdXBlci5wcm90b3R5cGUuX24uY2FsbCh0aGlzLCB4KTtcbiAgICB9O1xuICAgIE1lbW9yeVN0cmVhbS5wcm90b3R5cGUuX2FkZCA9IGZ1bmN0aW9uIChpbCkge1xuICAgICAgICB2YXIgdGEgPSB0aGlzLl90YXJnZXQ7XG4gICAgICAgIGlmICh0YSAhPT0gTk8pXG4gICAgICAgICAgICByZXR1cm4gdGEuX2FkZChpbCk7XG4gICAgICAgIHZhciBhID0gdGhpcy5faWxzO1xuICAgICAgICBhLnB1c2goaWwpO1xuICAgICAgICBpZiAoYS5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5faGFzKVxuICAgICAgICAgICAgICAgIGlsLl9uKHRoaXMuX3YpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLl9zdG9wSUQgIT09IE5PKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5faGFzKVxuICAgICAgICAgICAgICAgIGlsLl9uKHRoaXMuX3YpO1xuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuX3N0b3BJRCk7XG4gICAgICAgICAgICB0aGlzLl9zdG9wSUQgPSBOTztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh0aGlzLl9oYXMpXG4gICAgICAgICAgICBpbC5fbih0aGlzLl92KTtcbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB2YXIgcCA9IHRoaXMuX3Byb2Q7XG4gICAgICAgICAgICBpZiAocCAhPT0gTk8pXG4gICAgICAgICAgICAgICAgcC5fc3RhcnQodGhpcyk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIE1lbW9yeVN0cmVhbS5wcm90b3R5cGUuX3N0b3BOb3cgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuX2hhcyA9IGZhbHNlO1xuICAgICAgICBfc3VwZXIucHJvdG90eXBlLl9zdG9wTm93LmNhbGwodGhpcyk7XG4gICAgfTtcbiAgICBNZW1vcnlTdHJlYW0ucHJvdG90eXBlLl94ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLl9oYXMgPSBmYWxzZTtcbiAgICAgICAgX3N1cGVyLnByb3RvdHlwZS5feC5jYWxsKHRoaXMpO1xuICAgIH07XG4gICAgTWVtb3J5U3RyZWFtLnByb3RvdHlwZS5tYXAgPSBmdW5jdGlvbiAocHJvamVjdCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fbWFwKHByb2plY3QpO1xuICAgIH07XG4gICAgTWVtb3J5U3RyZWFtLnByb3RvdHlwZS5tYXBUbyA9IGZ1bmN0aW9uIChwcm9qZWN0ZWRWYWx1ZSkge1xuICAgICAgICByZXR1cm4gX3N1cGVyLnByb3RvdHlwZS5tYXBUby5jYWxsKHRoaXMsIHByb2plY3RlZFZhbHVlKTtcbiAgICB9O1xuICAgIE1lbW9yeVN0cmVhbS5wcm90b3R5cGUudGFrZSA9IGZ1bmN0aW9uIChhbW91bnQpIHtcbiAgICAgICAgcmV0dXJuIF9zdXBlci5wcm90b3R5cGUudGFrZS5jYWxsKHRoaXMsIGFtb3VudCk7XG4gICAgfTtcbiAgICBNZW1vcnlTdHJlYW0ucHJvdG90eXBlLmVuZFdoZW4gPSBmdW5jdGlvbiAob3RoZXIpIHtcbiAgICAgICAgcmV0dXJuIF9zdXBlci5wcm90b3R5cGUuZW5kV2hlbi5jYWxsKHRoaXMsIG90aGVyKTtcbiAgICB9O1xuICAgIE1lbW9yeVN0cmVhbS5wcm90b3R5cGUucmVwbGFjZUVycm9yID0gZnVuY3Rpb24gKHJlcGxhY2UpIHtcbiAgICAgICAgcmV0dXJuIF9zdXBlci5wcm90b3R5cGUucmVwbGFjZUVycm9yLmNhbGwodGhpcywgcmVwbGFjZSk7XG4gICAgfTtcbiAgICBNZW1vcnlTdHJlYW0ucHJvdG90eXBlLnJlbWVtYmVyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIE1lbW9yeVN0cmVhbS5wcm90b3R5cGUuZGVidWcgPSBmdW5jdGlvbiAobGFiZWxPclNweSkge1xuICAgICAgICByZXR1cm4gX3N1cGVyLnByb3RvdHlwZS5kZWJ1Zy5jYWxsKHRoaXMsIGxhYmVsT3JTcHkpO1xuICAgIH07XG4gICAgcmV0dXJuIE1lbW9yeVN0cmVhbTtcbn0oU3RyZWFtKSk7XG5leHBvcnRzLk1lbW9yeVN0cmVhbSA9IE1lbW9yeVN0cmVhbTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuZGVmYXVsdCA9IFN0cmVhbTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWluZGV4LmpzLm1hcCIsImltcG9ydCB7cnVufSBmcm9tICdAY3ljbGUvcnVuJztcbmltcG9ydCB7bWFrZURPTURyaXZlcn0gZnJvbSAnQGN5Y2xlL2RvbSc7XG5pbXBvcnQgc3RvcmFnZURyaXZlciBmcm9tICdAY3ljbGUvc3RvcmFnZSc7XG5pbXBvcnQge2NhcHR1cmVDbGlja3MsIG1ha2VIaXN0b3J5RHJpdmVyfSBmcm9tICdAY3ljbGUvaGlzdG9yeSdcbmltcG9ydCBvbmlvbmlmeSBmcm9tICdjeWNsZS1vbmlvbmlmeSc7XG5pbXBvcnQgc3RvcmFnZWlmeSBmcm9tICdjeWNsZS1zdG9yYWdlaWZ5JztcbmltcG9ydCBUYXNrTGlzdCBmcm9tICcuL2NvbXBvbmVudHMvVGFza0xpc3QnO1xuXG5pbXBvcnQgUHJvcHNNb2R1bGUgZnJvbSAnc25hYmJkb20vbW9kdWxlcy9wcm9wcyc7XG5pbXBvcnQgQXR0cnNNb2R1bGUgZnJvbSAnc25hYmJkb20vbW9kdWxlcy9hdHRyaWJ1dGVzJztcbmltcG9ydCBTdHlsZU1vZHVsZSBmcm9tICdzbmFiYmRvbS9tb2R1bGVzL3N0eWxlJztcbmltcG9ydCBDbGFzc01vZHVsZSBmcm9tICdzbmFiYmRvbS9tb2R1bGVzL2NsYXNzJztcbmltcG9ydCBDc3NNb2R1bGUgZnJvbSAnc25hYmJkb20tdHlwZXN0eWxlJztcblxuY29uc3QgbW9kdWxlcyA9IFtcbiAgUHJvcHNNb2R1bGUsXG4gIEF0dHJzTW9kdWxlLFxuICBTdHlsZU1vZHVsZSxcbiAgQ3NzTW9kdWxlLFxuICBDbGFzc01vZHVsZVxuXTtcblxuY29uc3QgbWFpbiA9IG9uaW9uaWZ5KHN0b3JhZ2VpZnkoVGFza0xpc3QsIHtrZXk6ICd0b2Rvcy1jeWNsZSd9KSk7XG5cbnJ1bihtYWluLCB7XG4gIERPTTogbWFrZURPTURyaXZlcignLnRvZG9hcHAnLCB7bW9kdWxlcywgdHJhbnNwb3NpdGlvbjogdHJ1ZX0pLFxuICBoaXN0b3J5OiBjYXB0dXJlQ2xpY2tzKG1ha2VIaXN0b3J5RHJpdmVyKCkpLFxuICBzdG9yYWdlOiBzdG9yYWdlRHJpdmVyLFxufSk7XG4iLCJpbXBvcnQgaW50ZW50IGZyb20gJy4vaW50ZW50JztcbmltcG9ydCBtb2RlbCBmcm9tICcuL21vZGVsJztcbmltcG9ydCB2aWV3IGZyb20gJy4vdmlldyc7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIFRhc2soc291cmNlcykge1xuICBjb25zdCBhY3Rpb25zID0gaW50ZW50KHNvdXJjZXMuRE9NKTtcbiAgY29uc3QgcmVkdWNlciQgPSBtb2RlbChhY3Rpb25zKTtcbiAgY29uc3QgdmRvbSQgPSB2aWV3KHNvdXJjZXMub25pb24uc3RhdGUkKTtcblxuICByZXR1cm4ge1xuICAgIERPTTogdmRvbSQsXG4gICAgb25pb246IHJlZHVjZXIkLFxuICB9O1xufVxuIiwiaW1wb3J0IHhzIGZyb20gJ3hzdHJlYW0nO1xuaW1wb3J0IHtFTlRFUl9LRVksIEVTQ19LRVl9IGZyb20gJy4uLy4uL3V0aWxzJztcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gaW50ZW50KGRvbVNvdXJjZSkge1xuICBjb25zdCBlZGl0RW50ZXJFdmVudCQgPSBkb21Tb3VyY2VcbiAgICAuc2VsZWN0KCcuZWRpdCcpLmV2ZW50cygna2V5dXAnKVxuICAgIC5maWx0ZXIoZXYgPT4gZXYua2V5Q29kZSA9PT0gRU5URVJfS0VZKTtcblxuICBjb25zdCBlZGl0Qmx1ckV2ZW50JCA9IGRvbVNvdXJjZS5zZWxlY3QoJy5lZGl0JykuZXZlbnRzKCdibHVyJywgdHJ1ZSk7XG5cbiAgcmV0dXJuIHtcbiAgICBzdGFydEVkaXQkOiBkb21Tb3VyY2VcbiAgICAgIC5zZWxlY3QoJ2xhYmVsJykuZXZlbnRzKCdkYmxjbGljaycpXG4gICAgICAubWFwVG8obnVsbCksXG5cbiAgICBkb25lRWRpdCQ6IHhzLm1lcmdlKGVkaXRFbnRlckV2ZW50JCwgZWRpdEJsdXJFdmVudCQpXG4gICAgICAubWFwKGV2ID0+IGV2LnRhcmdldC52YWx1ZSksXG5cbiAgICBjYW5jZWxFZGl0JDogZG9tU291cmNlXG4gICAgICAuc2VsZWN0KCcuZWRpdCcpLmV2ZW50cygna2V5dXAnKVxuICAgICAgLmZpbHRlcihldiA9PiBldi5rZXlDb2RlID09PSBFU0NfS0VZKVxuICAgICAgLm1hcFRvKG51bGwpLFxuXG4gICAgdG9nZ2xlJDogZG9tU291cmNlXG4gICAgICAuc2VsZWN0KCcudG9nZ2xlJykuZXZlbnRzKCdjaGFuZ2UnKVxuICAgICAgLm1hcChldiA9PiBldi50YXJnZXQuY2hlY2tlZCksXG5cbiAgICBkZXN0cm95JDogZG9tU291cmNlXG4gICAgICAuc2VsZWN0KCcuZGVzdHJveScpLmV2ZW50cygnY2xpY2snKVxuICAgICAgLm1hcFRvKG51bGwpLFxuXG4gICAgaG92ZXIkOiBkb21Tb3VyY2VcbiAgICAgIC5zZWxlY3QoJy50b2RvLXJvb3QnKS5ldmVudHMoJ21vdXNlb3ZlcicpXG4gICAgICAubWFwVG8obnVsbCksXG5cbiAgICB1bmhvdmVyJDogZG9tU291cmNlXG4gICAgICAuc2VsZWN0KCcudG9kby1yb290JykuZXZlbnRzKCdtb3VzZWxlYXZlJylcbiAgICAgIC5tYXBUbyhudWxsKSxcblxuICB9XG59XG4iLCJpbXBvcnQgeHMgZnJvbSAneHN0cmVhbSc7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIG1vZGVsKGFjdGlvbnMpIHtcbiAgY29uc3Qgc3RhcnRFZGl0UmVkdWNlciQgPSBhY3Rpb25zLnN0YXJ0RWRpdCRcbiAgICAubWFwVG8oZnVuY3Rpb24gc3RhcnRFZGl0UmVkdWNlcihkYXRhKSB7XG4gICAgICByZXR1cm4gey4uLmRhdGEsIGVkaXRpbmc6IHRydWV9O1xuICAgIH0pO1xuXG4gIGNvbnN0IGRvbmVFZGl0UmVkdWNlciQgPSBhY3Rpb25zLmRvbmVFZGl0JFxuICAgIC5tYXAoY29udGVudCA9PiBmdW5jdGlvbiBkb25lRWRpdFJlZHVjZXIoZGF0YSkge1xuICAgICAgcmV0dXJuIHsuLi5kYXRhLCB0aXRsZTogY29udGVudCwgZWRpdGluZzogZmFsc2V9O1xuICAgIH0pO1xuXG4gIGNvbnN0IGNhbmNlbEVkaXRSZWR1Y2VyJCA9IGFjdGlvbnMuY2FuY2VsRWRpdCRcbiAgICAubWFwVG8oZnVuY3Rpb24gY2FuY2VsRWRpdFJlZHVjZXIoZGF0YSkge1xuICAgICAgcmV0dXJuIHsuLi5kYXRhLCBlZGl0aW5nOiBmYWxzZX07XG4gICAgfSk7XG5cbiAgY29uc3QgdG9nZ2xlUmVkdWNlciQgPSBhY3Rpb25zLnRvZ2dsZSRcbiAgICAubWFwKGlzVG9nZ2xlZCA9PiBmdW5jdGlvbiB0b2dnbGVSZWR1Y2VyKGRhdGEpIHtcbiAgICAgIHJldHVybiB7Li4uZGF0YSwgY29tcGxldGVkOiBpc1RvZ2dsZWR9O1xuICAgIH0pO1xuXG4gIGNvbnN0IGRlc3Ryb3lSZWR1Y2VyJCA9IGFjdGlvbnMuZGVzdHJveSRcbiAgICAubWFwVG8oZnVuY3Rpb24gZGVzdHJveVJlZHVjZXIoZGF0YSkge1xuICAgICAgcmV0dXJuIHZvaWQgMDtcbiAgICB9KTtcblxuICBjb25zdCBob3ZlclJlZHVjZXIkID0gYWN0aW9ucy5ob3ZlciRcbiAgICAubWFwVG8oZnVuY3Rpb24gaG92ZXJSZWR1Y2VyKGRhdGEpIHtcbiAgICAgIHJldHVybiB7Li4uZGF0YSwgaG92ZXI6IHRydWV9O1xuICAgIH0pO1xuXG4gIGNvbnN0IHVuaG92ZXJSZWR1Y2VyJCA9IGFjdGlvbnMudW5ob3ZlciRcbiAgICAubWFwVG8oZnVuY3Rpb24gdW5ob3ZlclJlZHVjZXIoZGF0YSkge1xuICAgICAgcmV0dXJuIHsuLi5kYXRhLCBob3ZlcjogZmFsc2V9O1xuICAgIH0pO1xuXG4gIHJldHVybiB4cy5tZXJnZShcbiAgICBzdGFydEVkaXRSZWR1Y2VyJCxcbiAgICBkb25lRWRpdFJlZHVjZXIkLFxuICAgIGNhbmNlbEVkaXRSZWR1Y2VyJCxcbiAgICB0b2dnbGVSZWR1Y2VyJCxcbiAgICBkZXN0cm95UmVkdWNlciQsXG4gICAgaG92ZXJSZWR1Y2VyJCxcbiAgICB1bmhvdmVyUmVkdWNlciQsXG4gICk7XG59XG4iLCJpbXBvcnQgKiBhcyBzdHlsZXMgZnJvbSAnLi4vLi4vc3R5bGVzJztcblxuZXhwb3J0IGNvbnN0IHZpZXcgPSAoZWRpdGluZykgPT4gKHtcbiAgJ2Rpc3BsYXknOiBlZGl0aW5nID8gJ25vbmUnIDogJ2Jsb2NrJyxcbn0pO1xuXG5leHBvcnQgY29uc3QgdG9kb0xpID0gKGVkaXRpbmcsIGxhc3QpID0+ICh7XG4gICdwb3NpdGlvbicgIDogJ3JlbGF0aXZlJyxcbiAgJ2ZvbnQtc2l6ZScgOiAnMjRweCcsXG4gIC4uLihlZGl0aW5nID8ge1xuICAgICdib3JkZXItYm90dG9tJzogJ25vbmUnLFxuICAgICdwYWRkaW5nJyAgICAgIDogJzAnLFxuICB9IDoge1xuICAgICdib3JkZXItYm90dG9tJzogJzFweCBzb2xpZCAjZWRlZGVkJyxcbiAgfSksXG4gIC4uLihsYXN0ID8geyAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJbnN0ZWFkIG9mIHVzaW5nIGEgOmxhc3QtY2hpbGQgc2VsZWN0b3IsXG4gICAgJ2JvcmRlci1ib3R0b20nOiAnbm9uZScsICAgICAgICAgICAgICAvLyB0aGUgZWxlbWVudCBzZWxlY3RzIHRoZSBzdHlsZVxuICB9IDoge30pLFxufSk7XG5cbmV4cG9ydCBjb25zdCB0b2dnbGUgPSAoKSA9PiAoe1xuICAndGV4dC1hbGlnbic6ICdjZW50ZXInLFxuICAnd2lkdGgnICAgICA6ICc0MHB4JyxcbiAgJ2hlaWdodCcgICAgOiAnYXV0bycsXG4gICdwb3NpdGlvbicgIDogJ2Fic29sdXRlJyxcbiAgJ3RvcCcgICAgICAgOiAnMCcsXG4gICdib3R0b20nICAgIDogJzAnLFxuICAnbWFyZ2luJyAgICA6ICdhdXRvIDAnLFxuICAnYm9yZGVyJyAgICA6ICdub25lJyxcbiAgJ2FwcGVhcmFuY2UnOiAnbm9uZScsXG4gICctd2Via2l0LWFwcGVhcmFuY2UnOiAnbm9uZScsXG59KTtcblxuZXhwb3J0IGNvbnN0IHRvZG9JbnB1dCA9IChlZGl0aW5nKSA9PiAoe1xuICAuLi5zdHlsZXMuaW5wdXQoKSxcbiAgLi4uKGVkaXRpbmcgPyB7XG4gICAgJ2Rpc3BsYXknOiAnYmxvY2snLFxuICAgICd3aWR0aCcgIDogJzUwNnB4JyxcbiAgICAncGFkZGluZyc6ICcxM3B4IDE3cHggMTJweCAxN3B4JyxcbiAgICAnbWFyZ2luJyA6ICcwIDAgMCA0M3B4JyxcbiAgfSA6IHtcbiAgICAnZGlzcGxheSc6ICdub25lJyxcbiAgfSlcbn0pO1xuXG5leHBvcnQgY29uc3QgbGFiZWwgPSAoY29tcGxldGVkKSA9PiAoe1xuICAnd29yZC1icmVhaycgIDogJ2JyZWFrLWFsbCcsXG4gICdwYWRkaW5nJyAgICAgOiAnMTVweCAxNXB4IDE1cHggNjBweCcsXG4gICdkaXNwbGF5JyAgICAgOiAnYmxvY2snLFxuICAnbGluZS1oZWlnaHQnIDogJzEuMicsXG4gICd0cmFuc2l0aW9uJyAgOiAnY29sb3IgMC40cycsXG4gICdiYWNrZ3JvdW5kLXJlcGVhdCcgIDogJ25vLXJlcGVhdCcsXG4gICdiYWNrZ3JvdW5kLXBvc2l0aW9uJzogJ2NlbnRlciBsZWZ0JyxcbiAgLi4uKGNvbXBsZXRlZCA/IHtcbiAgICAnY29sb3InICAgICAgICAgICA6ICcjZDlkOWQ5JyxcbiAgICAndGV4dC1kZWNvcmF0aW9uJyA6ICdsaW5lLXRocm91Z2gnLFxuICAgICdiYWNrZ3JvdW5kLWltYWdlJzogYHVybCgnZGF0YTppbWFnZS9zdmcreG1sO3V0ZjgsJTNDc3ZnJTIweG1sbnMlM0QlMjJodHRwJTNBLy93d3cudzMub3JnLzIwMDAvc3ZnJTIyJTIwd2lkdGglM0QlMjI0MCUyMiUyMGhlaWdodCUzRCUyMjQwJTIyJTIwdmlld0JveCUzRCUyMi0xMCUyMC0xOCUyMDEwMCUyMDEzNSUyMiUzRSUzQ2NpcmNsZSUyMGN4JTNEJTIyNTAlMjIlMjBjeSUzRCUyMjUwJTIyJTIwciUzRCUyMjUwJTIyJTIwZmlsbCUzRCUyMm5vbmUlMjIlMjBzdHJva2UlM0QlMjIlMjNiZGRhZDUlMjIlMjBzdHJva2Utd2lkdGglM0QlMjIzJTIyLyUzRSUzQ3BhdGglMjBmaWxsJTNEJTIyJTIzNWRjMmFmJTIyJTIwZCUzRCUyMk03MiUyMDI1TDQyJTIwNzElMjAyNyUyMDU2bC00JTIwNCUyMDIwJTIwMjAlMjAzNC01MnolMjIvJTNFJTNDL3N2ZyUzRScpYCxcbiAgfSA6IHtcbiAgICAnYmFja2dyb3VuZC1pbWFnZSc6IGB1cmwoJ2RhdGE6aW1hZ2Uvc3ZnK3htbDt1dGY4LCUzQ3N2ZyUyMHhtbG5zJTNEJTIyaHR0cCUzQS8vd3d3LnczLm9yZy8yMDAwL3N2ZyUyMiUyMHdpZHRoJTNEJTIyNDAlMjIlMjBoZWlnaHQlM0QlMjI0MCUyMiUyMHZpZXdCb3glM0QlMjItMTAlMjAtMTglMjAxMDAlMjAxMzUlMjIlM0UlM0NjaXJjbGUlMjBjeCUzRCUyMjUwJTIyJTIwY3klM0QlMjI1MCUyMiUyMHIlM0QlMjI1MCUyMiUyMGZpbGwlM0QlMjJub25lJTIyJTIwc3Ryb2tlJTNEJTIyJTIzZWRlZGVkJTIyJTIwc3Ryb2tlLXdpZHRoJTNEJTIyMyUyMi8lM0UlM0Mvc3ZnJTNFJylgLFxuICB9KVxufSk7XG5cbmV4cG9ydCBjb25zdCBkZXN0cm95ID0gKHRvZG9Ib3ZlcikgPT4gKHtcbiAgLi4uc3R5bGVzLmJ1dHRvbigpLFxuICAnZGlzcGxheScgOiB0b2RvSG92ZXIgPyAnYmxvY2snIDogJ25vbmUnLCAgIC8vIEhvdmVyIGNhbiBiZSBkb25lIGluIGphdmFzY3JpcHRcbiAgJ3Bvc2l0aW9uJzogJ2Fic29sdXRlJyxcbiAgJ3RvcCcgICAgIDogJzAnLFxuICAncmlnaHQnICAgOiAnMTBweCcsXG4gICdib3R0b20nICA6ICcwJyxcbiAgJ3dpZHRoJyAgIDogJzQwcHgnLFxuICAnaGVpZ2h0JyAgOiAnNDBweCcsXG4gICdtYXJnaW4nICA6ICdhdXRvIDAnLFxuICAnY29sb3InICAgOiAnI2NjOWE5YScsXG4gICdmb250LXNpemUnIDogJzMwcHgnLFxuICAndHJhbnNpdGlvbic6ICdjb2xvciAwLjJzIGVhc2Utb3V0JyxcbiAgJ21hcmdpbi1ib3R0b20nOiAnMTFweCcsXG4gICckbmVzdCc6IHtcbiAgICAnJjpob3Zlcic6IHsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBIb3ZlciBjYW4gYWxzbyBiZSBkb25lIGluIHBsYWluIGNzc1xuICAgICAgJ2NvbG9yJyAgOiAnI2FmNWI1ZScsXG4gICAgfSxcbiAgICAnJjphZnRlcic6IHtcbiAgICAgICdjb250ZW50JzogYCfDlydgLFxuICAgIH0sXG4gIH1cbn0pO1xuIiwiaW1wb3J0IHtidXR0b24sIGRpdiwgaW5wdXQsIGxhYmVsLCBsaX0gZnJvbSAnQGN5Y2xlL2RvbSc7XG5pbXBvcnQgKiBhcyBzdHlsZXMgZnJvbSAnLi9zdHlsZXMnO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiB2aWV3KHN0YXRlJCkge1xuICByZXR1cm4gc3RhdGUkLm1hcCgoeyB0aXRsZSwgY29tcGxldGVkLCBlZGl0aW5nLCBob3ZlciwgbGFzdCB9KSA9PlxuICAgIGxpKCcudG9kby1yb290JywgeyBjc3M6IHN0eWxlcy50b2RvTGkoZWRpdGluZywgbGFzdCksIGNsYXNzOiB7Y29tcGxldGVkLCBlZGl0aW5nfSB9LCBbXG4gICAgICBkaXYoJy52aWV3JywgeyBjc3M6IHN0eWxlcy52aWV3KGVkaXRpbmcpIH0sIFtcbiAgICAgICAgaW5wdXQoJy50b2dnbGUnLCB7XG4gICAgICAgICAgcHJvcHM6IHsgdHlwZTogJ2NoZWNrYm94JywgY2hlY2tlZDogY29tcGxldGVkIH0sXG4gICAgICAgICAgY3NzOiBzdHlsZXMudG9nZ2xlKClcbiAgICAgICAgfSksXG4gICAgICAgIGxhYmVsKHsgY3NzOiBzdHlsZXMubGFiZWwoY29tcGxldGVkKSB9LCB0aXRsZSksXG4gICAgICAgIGJ1dHRvbignLmRlc3Ryb3knLCB7IGNzczogc3R5bGVzLmRlc3Ryb3koaG92ZXIpIH0pXG4gICAgICBdKSxcbiAgICAgIGlucHV0KCcuZWRpdCcsIHtcbiAgICAgICAgY3NzOiBzdHlsZXMudG9kb0lucHV0KGVkaXRpbmcpLFxuICAgICAgICBwcm9wczogeyB0eXBlOiAndGV4dCcgfSxcbiAgICAgICAgaG9vazoge1xuICAgICAgICAgIHVwZGF0ZTogKG9sZFZOb2RlLCB7ZWxtfSkgPT4ge1xuICAgICAgICAgICAgZWxtLnZhbHVlID0gdGl0bGU7XG4gICAgICAgICAgICBpZiAoZWRpdGluZykge1xuICAgICAgICAgICAgICBlbG0uZm9jdXMoKTtcbiAgICAgICAgICAgICAgZWxtLnNlbGVjdGlvblN0YXJ0ID0gZWxtLnZhbHVlLmxlbmd0aDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgXSlcbiAgKTtcbn1cbiIsImltcG9ydCB7dWx9IGZyb20gJ0BjeWNsZS9kb20nO1xuaW1wb3J0IHttYWtlQ29sbGVjdGlvbn0gZnJvbSAnY3ljbGUtb25pb25pZnknO1xuaW1wb3J0IFRhc2sgZnJvbSAnLi4vVGFzay9pbmRleCc7XG5pbXBvcnQgKiBhcyBzdHlsZXMgZnJvbSAnLi9zdHlsZXMnO1xuXG5leHBvcnQgY29uc3QgTGlzdCA9IG1ha2VDb2xsZWN0aW9uKHtcbiAgaXRlbTogVGFzayxcbiAgaXRlbUtleTogc3RhdGUgPT4gc3RhdGUua2V5LFxuICBpdGVtU2NvcGU6IGtleSA9PiBrZXksXG4gIGNvbGxlY3RTaW5rczogaW5zdGFuY2VzID0+ICh7XG4gICAgRE9NOiBpbnN0YW5jZXMucGlja0NvbWJpbmUoJ0RPTScpXG4gICAgICAubWFwKHZub2RlcyA9PiB1bCgnLnRvZG8tbGlzdCcsIHsgY3NzOiBzdHlsZXMudG9kb0xpc3QoKSB9LCB2bm9kZXMpKSxcbiAgICBvbmlvbjogaW5zdGFuY2VzLnBpY2tNZXJnZSgnb25pb24nKSxcbiAgfSlcbn0pO1xuIiwiaW1wb3J0IHhzIGZyb20gJ3hzdHJlYW0nO1xuaW1wb3J0IGlzb2xhdGUgZnJvbSAnQGN5Y2xlL2lzb2xhdGUnO1xuaW1wb3J0IGludGVudCBmcm9tICcuL2ludGVudCc7XG5pbXBvcnQgbW9kZWwgZnJvbSAnLi9tb2RlbCc7XG5pbXBvcnQgdmlldyBmcm9tICcuL3ZpZXcnO1xuaW1wb3J0IHtMaXN0fSBmcm9tICcuL0xpc3QnO1xuXG5mdW5jdGlvbiBvbWl0KG9iaiwga2V5KSB7XG4gIGxldCB0bXAgPSB7IC4uLm9iaiB9O1xuICBkZWxldGUgdG1wW2tleV07XG4gIHJldHVybiB0bXA7XG59XG5cbmV4cG9ydCBjb25zdCBsaXN0TGVucyA9IHtcbiAgZ2V0OiAoc3RhdGUpID0+IHN0YXRlLmxpc3RcbiAgICAgIC5maWx0ZXIoc3RhdGUuZmlsdGVyRm4pXG4gICAgICAuc2xpY2UoMCwgLTEpXG4gICAgICAuY29uY2F0KHtcbiAgICAgICAgICAuLi5zdGF0ZS5saXN0W3N0YXRlLmxpc3QubGVuZ3RoIC0gMV0sXG4gICAgICAgICAgbGFzdDogdHJ1ZVxuICAgICAgfSksXG4gIHNldDogKHN0YXRlLCBuZXh0RmlsdGVyZWRMaXN0KSA9PiB7XG4gICAgY29uc3QgcHJldkZpbHRlcmVkTGlzdCA9IHN0YXRlLmxpc3QuZmlsdGVyKHN0YXRlLmZpbHRlckZuKTtcbiAgICBjb25zdCBuZXdMaXN0ID0gc3RhdGUubGlzdFxuICAgICAgLm1hcCh0YXNrID0+IG5leHRGaWx0ZXJlZExpc3QuZmluZCh0ID0+IHQua2V5ID09PSB0YXNrLmtleSkgfHwgdGFzaylcbiAgICAgIC5maWx0ZXIodGFzayA9PlxuICAgICAgICBwcmV2RmlsdGVyZWRMaXN0LnNvbWUodCA9PiB0LmtleSA9PT0gdGFzay5rZXkpICYmXG4gICAgICAgIG5leHRGaWx0ZXJlZExpc3Quc29tZSh0ID0+IHQua2V5ID09PSB0YXNrLmtleSlcbiAgICAgICk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgLi4uc3RhdGUsXG4gICAgICBsaXN0OiBuZXdMaXN0XG4gICAgICAgIC5zbGljZSgwLCAtMSlcbiAgICAgICAgLmNvbmNhdChvbWl0KG5ld0xpc3RbbmV3TGlzdC5sZW5ndGggLSAxXSwgJ2xhc3QnKSlcbiAgICB9O1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIFRhc2tMaXN0KHNvdXJjZXMpIHtcbiAgY29uc3Qgc3RhdGUkID0gc291cmNlcy5vbmlvbi5zdGF0ZSQ7XG4gIGNvbnN0IGFjdGlvbnMgPSBpbnRlbnQoc291cmNlcy5ET00sIHNvdXJjZXMuaGlzdG9yeSk7XG4gIGNvbnN0IHBhcmVudFJlZHVjZXIkID0gbW9kZWwoYWN0aW9ucyk7XG5cbiAgY29uc3QgbGlzdFNpbmtzID0gaXNvbGF0ZShMaXN0LCB7b25pb246IGxpc3RMZW5zfSkoc291cmNlcyk7XG4gIGNvbnN0IGxpc3RWRG9tJCA9IGxpc3RTaW5rcy5ET007XG4gIGNvbnN0IGxpc3RSZWR1Y2VyJCA9IGxpc3RTaW5rcy5vbmlvbjtcblxuICBjb25zdCB2ZG9tJCA9IHZpZXcoc3RhdGUkLCBsaXN0VkRvbSQpO1xuICBjb25zdCByZWR1Y2VyJCA9IHhzLm1lcmdlKHBhcmVudFJlZHVjZXIkLCBsaXN0UmVkdWNlciQpO1xuXG4gIHJldHVybiB7XG4gICAgRE9NOiB2ZG9tJCxcbiAgICBvbmlvbjogcmVkdWNlciQsXG4gIH07XG59XG4iLCJpbXBvcnQgeHMgZnJvbSAneHN0cmVhbSc7XG5pbXBvcnQgZHJvcFJlcGVhdHMgZnJvbSAneHN0cmVhbS9leHRyYS9kcm9wUmVwZWF0cyc7XG5pbXBvcnQge0VOVEVSX0tFWSwgRVNDX0tFWX0gZnJvbSAnLi4vLi4vdXRpbHMnO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBpbnRlbnQoZG9tU291cmNlLCBoaXN0b3J5U291cmNlKSB7XG4gIHJldHVybiB7XG4gICAgY2hhbmdlUm91dGUkOiBoaXN0b3J5U291cmNlXG4gICAgICAubWFwKGxvY2F0aW9uID0+IGxvY2F0aW9uLnBhdGhuYW1lKVxuICAgICAgLmNvbXBvc2UoZHJvcFJlcGVhdHMoKSksXG5cbiAgICB1cGRhdGVJbnB1dFZhbHVlJDogZG9tU291cmNlXG4gICAgICAuc2VsZWN0KCcubmV3LXRvZG8nKS5ldmVudHMoJ2lucHV0JylcbiAgICAgIC5tYXAoZXYgPT4gZXYudGFyZ2V0LnZhbHVlKSxcblxuICAgIGNhbmNlbElucHV0JDogZG9tU291cmNlXG4gICAgICAuc2VsZWN0KCcubmV3LXRvZG8nKS5ldmVudHMoJ2tleWRvd24nKVxuICAgICAgLmZpbHRlcihldiA9PiBldi5rZXlDb2RlID09PSBFU0NfS0VZKSxcblxuICAgIGluc2VydFRvZG8kOiBkb21Tb3VyY2VcbiAgICAgIC5zZWxlY3QoJy5uZXctdG9kbycpLmV2ZW50cygna2V5ZG93bicpXG4gICAgICAuZmlsdGVyKGV2ID0+IHtcbiAgICAgICAgY29uc3QgdHJpbW1lZFZhbCA9IFN0cmluZyhldi50YXJnZXQudmFsdWUpLnRyaW0oKTtcbiAgICAgICAgcmV0dXJuIGV2LmtleUNvZGUgPT09IEVOVEVSX0tFWSAmJiB0cmltbWVkVmFsO1xuICAgICAgfSlcbiAgICAgIC5tYXAoZXYgPT4gU3RyaW5nKGV2LnRhcmdldC52YWx1ZSkudHJpbSgpKSxcblxuICAgIHRvZ2dsZUFsbCQ6IGRvbVNvdXJjZVxuICAgICAgLnNlbGVjdCgnLnRvZ2dsZS1hbGwnKS5ldmVudHMoJ2NsaWNrJylcbiAgICAgIC5tYXAoZXYgPT4gZXYudGFyZ2V0LmNoZWNrZWQpLFxuXG4gICAgZGVsZXRlQ29tcGxldGVkJDogZG9tU291cmNlXG4gICAgICAuc2VsZWN0KCcuY2xlYXItY29tcGxldGVkJykuZXZlbnRzKCdjbGljaycpXG4gICAgICAubWFwVG8obnVsbCksXG4gIH07XG59O1xuIiwiaW1wb3J0IHhzIGZyb20gJ3hzdHJlYW0nO1xuXG5mdW5jdGlvbiBnZXRGaWx0ZXJGbihyb3V0ZSkge1xuICBzd2l0Y2ggKHJvdXRlKSB7XG4gICAgY2FzZSAnL2FjdGl2ZSc6IHJldHVybiAodGFzayA9PiB0YXNrLmNvbXBsZXRlZCA9PT0gZmFsc2UpO1xuICAgIGNhc2UgJy9jb21wbGV0ZWQnOiByZXR1cm4gKHRhc2sgPT4gdGFzay5jb21wbGV0ZWQgPT09IHRydWUpO1xuICAgIGRlZmF1bHQ6IHJldHVybiAoKSA9PiB0cnVlOyAvLyBhbGxvdyBhbnl0aGluZ1xuICB9XG59XG5cbmxldCB1dWlkID0gRGF0ZS5ub3coKTtcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gbW9kZWwoYWN0aW9ucykge1xuICBjb25zdCBpbml0aWFsUmVkdWNlciQgPSB4cy5vZihmdW5jdGlvbiBpbml0aWFsUmVkdWNlcihwcmV2U3RhdGUpIHtcbiAgICBpZiAocHJldlN0YXRlKSB7XG4gICAgICByZXR1cm4gcHJldlN0YXRlO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBpbnB1dFZhbHVlOiAnJyxcbiAgICAgICAgbGlzdDogW10sXG4gICAgICAgIGZpbHRlcjogJycsXG4gICAgICAgIGZpbHRlckZuOiAoKSA9PiB0cnVlLCAvLyBhbGxvdyBhbnl0aGluZ1xuICAgICAgfTtcbiAgICB9XG4gIH0pO1xuXG4gIGNvbnN0IGNoYW5nZVJvdXRlUmVkdWNlciQgPSBhY3Rpb25zLmNoYW5nZVJvdXRlJFxuICAgIC5zdGFydFdpdGgoJy8nKVxuICAgIC5tYXAocGF0aCA9PiB7XG4gICAgICBjb25zdCBmaWx0ZXJGbiA9IGdldEZpbHRlckZuKHBhdGgpO1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uIGNoYW5nZVJvdXRlUmVkdWNlcihwcmV2U3RhdGUpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAuLi5wcmV2U3RhdGUsXG4gICAgICAgICAgZmlsdGVyOiBwYXRoLnJlcGxhY2UoJy8nLCAnJykudHJpbSgpLFxuICAgICAgICAgIGZpbHRlckZuOiBmaWx0ZXJGbixcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9KTtcblxuICBjb25zdCB1cGRhdGVJbnB1dFZhbHVlUmVkdWNlciQgPSBhY3Rpb25zLnVwZGF0ZUlucHV0VmFsdWUkXG4gICAgLm1hcChpbnB1dFZhbHVlID0+IGZ1bmN0aW9uIHVwZGF0ZUlucHV0VmFsdWUocHJldlN0YXRlKSB7XG4gICAgICByZXR1cm4gey4uLnByZXZTdGF0ZSwgaW5wdXRWYWx1ZTogaW5wdXRWYWx1ZX07XG4gICAgfSk7XG5cbiAgY29uc3QgY2xlYXJJbnB1dFJlZHVjZXIkID0geHMubWVyZ2UoYWN0aW9ucy5jYW5jZWxJbnB1dCQsIGFjdGlvbnMuaW5zZXJ0VG9kbyQpXG4gICAgLm1hcFRvKGZ1bmN0aW9uIGNsZWFySW5wdXRSZWR1Y2VyKHByZXZTdGF0ZSkge1xuICAgICAgcmV0dXJuIHsuLi5wcmV2U3RhdGUsIGlucHV0VmFsdWU6ICcnfTtcbiAgICB9KTtcblxuICBjb25zdCBpbnNlcnRUb2RvUmVkdWNlciQgPSBhY3Rpb25zLmluc2VydFRvZG8kXG4gICAgLm1hcChjb250ZW50ID0+IGZ1bmN0aW9uIGluc2VydFRvZG9SZWR1Y2VyKHByZXZTdGF0ZSkge1xuICAgICAgY29uc3QgbmV3VG9kbyA9IHtcbiAgICAgICAga2V5OiB1dWlkKyssXG4gICAgICAgIHRpdGxlOiBjb250ZW50LFxuICAgICAgICBjb21wbGV0ZWQ6IGZhbHNlLFxuICAgICAgICBlZGl0aW5nOiBmYWxzZSxcbiAgICAgICAgaG92ZXI6IGZhbHNlLFxuICAgICAgICBsYXN0OiBmYWxzZSxcbiAgICAgIH07XG4gICAgICByZXR1cm4ge1xuICAgICAgICAuLi5wcmV2U3RhdGUsXG4gICAgICAgIGxpc3Q6IHByZXZTdGF0ZS5saXN0LmNvbmNhdChuZXdUb2RvKSxcbiAgICAgIH1cbiAgICB9KTtcblxuICBjb25zdCB0b2dnbGVBbGxSZWR1Y2VyJCA9IGFjdGlvbnMudG9nZ2xlQWxsJFxuICAgIC5tYXAoaXNUb2dnbGVkID0+IGZ1bmN0aW9uIHRvZ2dsZUFsbFJlZHVjZXIocHJldlN0YXRlKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICAuLi5wcmV2U3RhdGUsXG4gICAgICAgIGxpc3Q6IHByZXZTdGF0ZS5saXN0Lm1hcCh0YXNrID0+XG4gICAgICAgICAgKHsuLi50YXNrLCBjb21wbGV0ZWQ6IGlzVG9nZ2xlZH0pXG4gICAgICAgICksXG4gICAgICB9XG4gICAgfSk7XG5cbiAgY29uc3QgZGVsZXRlQ29tcGxldGVkUmVkdWNlciQgPSBhY3Rpb25zLmRlbGV0ZUNvbXBsZXRlZCRcbiAgICAubWFwVG8oZnVuY3Rpb24gZGVsZXRlQ29tcGxldGVkc1JlZHVjZXIocHJldlN0YXRlKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICAuLi5wcmV2U3RhdGUsXG4gICAgICAgIGxpc3Q6IHByZXZTdGF0ZS5saXN0LmZpbHRlcih0YXNrID0+IHRhc2suY29tcGxldGVkID09PSBmYWxzZSksXG4gICAgICB9O1xuICAgIH0pO1xuXG4gIHJldHVybiB4cy5tZXJnZShcbiAgICBpbml0aWFsUmVkdWNlciQsXG4gICAgdXBkYXRlSW5wdXRWYWx1ZVJlZHVjZXIkLFxuICAgIGNoYW5nZVJvdXRlUmVkdWNlciQsXG4gICAgY2xlYXJJbnB1dFJlZHVjZXIkLFxuICAgIGluc2VydFRvZG9SZWR1Y2VyJCxcbiAgICB0b2dnbGVBbGxSZWR1Y2VyJCxcbiAgICBkZWxldGVDb21wbGV0ZWRSZWR1Y2VyJFxuICApO1xufVxuIiwiaW1wb3J0ICogYXMgc3R5bGVzIGZyb20gJy4uLy4uL3N0eWxlcyc7XG5cbmV4cG9ydCBjb25zdCBtYWluID0gKGxpc3RMZW5ndGgpID0+ICh7XG4gICdkaXNwbGF5JyAgIDogbGlzdExlbmd0aCA/ICdibG9jaycgOiAnbm9uZScsXG4gICdwb3NpdGlvbicgIDogJ3JlbGF0aXZlJyxcbiAgJ3otaW5kZXgnICAgOiAnMicsXG4gICdib3JkZXItdG9wJzogJzFweCBzb2xpZCAjZTZlNmU2Jyxcbn0pO1xuXG5leHBvcnQgY29uc3QgaW5wdXQgPSAoKSA9PiAoe1xuICAuLi5zdHlsZXMuaW5wdXQoKSxcbiAgJ3BhZGRpbmcnICAgOiAnMTZweCAxNnB4IDE2cHggNjBweCcsXG4gICdib3JkZXInICAgIDogJ25vbmUnLFxuICAnYmFja2dyb3VuZCc6ICdyZ2JhKDAsIDAsIDAsIDAuMDAzKScsXG4gICdib3gtc2hhZG93JzogJ2luc2V0IDAgLTJweCAxcHggcmdiYSgwLDAsMCwwLjAzKScsXG59KTtcblxuZXhwb3J0IGNvbnN0IHRpdGxlID0gKCkgPT4gKHtcbiAgJ3Bvc2l0aW9uJyAgIDogJ2Fic29sdXRlJyxcbiAgJ3RvcCcgICAgICAgIDogJy0xNTVweCcsXG4gICd3aWR0aCcgICAgICA6ICcxMDAlJyxcbiAgJ2ZvbnQtc2l6ZScgIDogJzEwMHB4JyxcbiAgJ2ZvbnQtd2VpZ2h0JzogJzEwMCcsXG4gICd0ZXh0LWFsaWduJyA6ICdjZW50ZXInLFxuICAnY29sb3InICAgICAgOiAncmdiYSgxNzUsIDQ3LCA0NywgMC4xNSknLFxuICAuLi5zdHlsZXMub3B0aW1pemVkVGV4dCgpLFxufSk7XG5cbmV4cG9ydCBjb25zdCB0b2RvTGlzdCA9ICgpID0+ICh7XG4gICdtYXJnaW4nICAgIDogJzAnLFxuICAncGFkZGluZycgICA6ICcwJyxcbiAgJ2xpc3Qtc3R5bGUnOiAnbm9uZScsXG59KTtcblxuZXhwb3J0IGNvbnN0IHRvZG9Db3VudCA9ICgpID0+ICh7XG4gICdmbG9hdCcgICAgIDogJ2xlZnQnLFxuICAndGV4dC1hbGlnbic6ICdsZWZ0Jyxcbn0pO1xuXG5leHBvcnQgY29uc3QgZm9vdGVyID0gKGxpc3RMZW5ndGgpID0+ICh7XG4gICdkaXNwbGF5JyAgIDogbGlzdExlbmd0aCA/ICcnIDogJ25vbmUnLFxuICAnY29sb3InICAgICA6ICcjNzc3JyxcbiAgJ3BhZGRpbmcnICAgOiAnMTBweCAxNXB4JyxcbiAgJ2hlaWdodCcgICAgOiAnMjBweCcsXG4gICd0ZXh0LWFsaWduJzogJ2NlbnRlcicsXG4gICdib3JkZXItdG9wJzogJzFweCBzb2xpZCAjZTZlNmU2JyxcbiAgJyRuZXN0Jzoge1xuICAgICcmOmJlZm9yZSc6IHtcbiAgICAgICdjb250ZW50JyAgIDogJ1wiXCInLFxuICAgICAgJ3Bvc2l0aW9uJyAgOiAnYWJzb2x1dGUnLFxuICAgICAgJ3JpZ2h0JyAgICAgOiAnMCcsXG4gICAgICAnYm90dG9tJyAgICA6ICcwJyxcbiAgICAgICdsZWZ0JyAgICAgIDogJzAnLFxuICAgICAgJ2hlaWdodCcgICAgOiAnNTBweCcsXG4gICAgICAnb3ZlcmZsb3cnICA6ICdoaWRkZW4nLFxuICAgICAgJ2JveC1zaGFkb3cnOiBgMCAxcHggMXB4IHJnYmEoMCwgMCwgMCwgMC4yKSxcbiAgICAgICAgICAgICAgICAgICAgIDAgOHB4IDAgLTNweCAjZjZmNmY2LFxuICAgICAgICAgICAgICAgICAgICAgMCA5cHggMXB4IC0zcHggcmdiYSgwLCAwLCAwLCAwLjIpLFxuICAgICAgICAgICAgICAgICAgICAgMCAxNnB4IDAgLTZweCAjZjZmNmY2LFxuICAgICAgICAgICAgICAgICAgICAgMCAxN3B4IDJweCAtNnB4IHJnYmEoMCwgMCwgMCwgMC4yKWAsXG4gICAgfVxuICB9XG59KTtcblxuZXhwb3J0IGNvbnN0IGZpbHRlcnMgPSAoKSA9PiAoe1xuICAnbWFyZ2luJyAgICA6ICcwJyxcbiAgJ3BhZGRpbmcnICAgOiAnMCcsXG4gICdsaXN0LXN0eWxlJzogJ25vbmUnLFxuICAncG9zaXRpb24nICA6ICdhYnNvbHV0ZScsXG4gICdyaWdodCcgICAgIDogJzAnLFxuICAnbGVmdCcgICAgICA6ICcwJyxcbn0pO1xuXG5leHBvcnQgY29uc3QgZmlsdGVyc0xpID0gKCkgPT4gKHtcbiAgJ2Rpc3BsYXknOiAnaW5saW5lJyxcbn0pO1xuXG5leHBvcnQgY29uc3QgZmlsdGVyc0EgPSAoc2VsZWN0ZWQpID0+ICh7XG4gICdjb2xvcicgIDogJ2luaGVyaXQnLFxuICAnbWFyZ2luJyA6ICczcHgnLFxuICAncGFkZGluZyc6ICczcHggN3B4JyxcbiAgJ2JvcmRlcicgOiAnMXB4IHNvbGlkIHRyYW5zcGFyZW50JyxcbiAgJ2JvcmRlci1yYWRpdXMnOiAnM3B4JyxcbiAgLi4uKHNlbGVjdGVkID8ge1xuICAgICdib3JkZXItY29sb3InOiAncmdiYSgxNzUsIDQ3LCA0NywgMC4xKScsXG4gIH0gOiB7fSksXG4gICd0ZXh0LWRlY29yYXRpb24nOiAnbm9uZScsXG4gICckbmVzdCc6IHtcbiAgICAnJjpob3Zlcic6IHtcbiAgICAgICdib3JkZXItY29sb3InOiAncmdiYSgxNzUsIDQ3LCA0NywgMC4yKScsXG4gICAgfSxcbiAgfSxcbn0pO1xuXG5leHBvcnQgY29uc3QgdG9nZ2xlQWxsID0gKCkgPT4gKHtcbiAgJ3RleHQtYWxpZ24nOiAnY2VudGVyJyxcbiAgJ2JvcmRlcicgICAgOiAnbm9uZScsXG4gICdvcGFjaXR5JyAgIDogJzAnLFxuICAncG9zaXRpb24nICA6ICdhYnNvbHV0ZScsXG59KTtcblxuZXhwb3J0IGNvbnN0IHRvZ2dsZUFsbExhYmVsID0gKGNoZWNrZWQpID0+ICh7XG4gICd3aWR0aCcgICAgOiAnNjBweCcsXG4gICdoZWlnaHQnICAgOiAnMzRweCcsXG4gICdmb250LXNpemUnOiAnMCcsXG4gICdwb3NpdGlvbicgOiAnYWJzb2x1dGUnLFxuICAndG9wJyAgICAgIDogJy01MnB4JyxcbiAgJ2xlZnQnICAgICA6ICctMTNweCcsXG4gIC4uLnN0eWxlcy5yb3RhdGUoOTApLFxuICAnJG5lc3QnOiB7XG4gICAgJyY6YmVmb3JlJzoge1xuICAgICAgJ2NvbnRlbnQnICA6IGAn4p2vJ2AsXG4gICAgICAnZm9udC1zaXplJzogJzIycHgnLFxuICAgICAgJ2NvbG9yJyAgICA6IGNoZWNrZWQgPyAnIzczNzM3MycgOiAnI2U2ZTZlNicsXG4gICAgICAncGFkZGluZycgIDogJzEwcHggMjdweCAxMHB4IDI3cHgnLFxuICAgIH1cbiAgfVxufSk7XG5cbmV4cG9ydCBjb25zdCBjbGVhckNvbXBsZXRlZCA9ICgpID0+ICh7XG4gIC4uLnN0eWxlcy5idXR0b24oKSxcbiAgJ2Zsb2F0JyAgICAgICAgICA6ICdyaWdodCcsXG4gICdwb3NpdGlvbicgICAgICAgOiAncmVsYXRpdmUnLFxuICAnbGluZS1oZWlnaHQnICAgIDogJzIwcHgnLFxuICAndGV4dC1kZWNvcmF0aW9uJzogJ25vbmUnLFxuICAnY3Vyc29yJyAgICAgICAgIDogJ3BvaW50ZXInLFxuICAnJG5lc3QnOiB7XG4gICAgJyY6aG92ZXInOiB7XG4gICAgICAndGV4dC1kZWNvcmF0aW9uJzogJ3VuZGVybGluZScsXG4gICAgfSxcbiAgfSxcbn0pO1xuIiwiaW1wb3J0IHhzIGZyb20gJ3hzdHJlYW0nO1xuaW1wb3J0IHtcbiAgYSwgYnV0dG9uLCBkaXYsIGZvb3RlciwgaDEsIGhlYWRlciwgaW5wdXQsIGxpLCBzZWN0aW9uLCBzcGFuLCBzdHJvbmcsIHVsLCBsYWJlbFxufSBmcm9tICdAY3ljbGUvZG9tJztcbmltcG9ydCAqIGFzIGdsb2JhbFN0eWxlcyBmcm9tICcuLi8uLi9zdHlsZXMnO1xuaW1wb3J0ICogYXMgc3R5bGVzIGZyb20gJy4vc3R5bGVzJztcblxuZnVuY3Rpb24gcmVuZGVySGVhZGVyKHN0YXRlKSB7XG4gIHJldHVybiBoZWFkZXIoW1xuICAgIGgxKHsgY3NzOiBzdHlsZXMudGl0bGUoKSB9LCAndG9kb3MnKSxcbiAgICBpbnB1dCgnLm5ldy10b2RvJywge1xuICAgICAgcHJvcHM6IHtcbiAgICAgICAgdHlwZTogJ3RleHQnLFxuICAgICAgICBwbGFjZWhvbGRlcjogJ1doYXQgbmVlZHMgdG8gYmUgZG9uZT8nLFxuICAgICAgICBhdXRvZm9jdXM6IHRydWUsXG4gICAgICAgIG5hbWU6ICduZXdUb2RvJyxcbiAgICAgICAgdmFsdWU6IHN0YXRlLmlucHV0VmFsdWVcbiAgICAgIH0sXG4gICAgICBjc3M6IHN0eWxlcy5pbnB1dCgpLFxuICAgIH0pXG4gIF0pO1xufVxuXG5mdW5jdGlvbiByZW5kZXJNYWluU2VjdGlvbihzdGF0ZSwgbGlzdFZEb20pIHtcbiAgY29uc3QgYWxsQ29tcGxldGVkID0gc3RhdGUubGlzdC5yZWR1Y2UoKHgsIHkpID0+IHggJiYgeS5jb21wbGV0ZWQsIHRydWUpO1xuXG4gIHJldHVybiBzZWN0aW9uKCcubWFpbicsIHsgY3NzOiBzdHlsZXMubWFpbihzdGF0ZS5saXN0Lmxlbmd0aCkgfSwgW1xuICAgIGlucHV0KCcjdG9nZ2xlLWFsbC50b2dnbGUtYWxsJywge1xuICAgICAgcHJvcHM6IHsgdHlwZTogJ2NoZWNrYm94JywgY2hlY2tlZDogYWxsQ29tcGxldGVkIH0sXG4gICAgICBjc3M6IHN0eWxlcy50b2dnbGVBbGwoKSxcbiAgICB9KSxcbiAgICBsYWJlbCgnLmxhYmVsJywge1xuICAgICAgYXR0cnM6IHsgZm9yOiAndG9nZ2xlLWFsbCcgfSxcbiAgICAgIGNzczogc3R5bGVzLnRvZ2dsZUFsbExhYmVsKGFsbENvbXBsZXRlZCksXG4gICAgfSwgJ01hcmsgYWxsIGFzIGNvbXBsZXRlJyksXG4gICAgbGlzdFZEb21cbiAgXSk7XG59XG5cbmZ1bmN0aW9uIHJlbmRlckZpbHRlckJ1dHRvbihzdGF0ZSwgZmlsdGVyVGFnLCBwYXRoLCBsYWJlbCkge1xuICBjb25zdCBzZWxlY3RlZCA9IHN0YXRlLmZpbHRlciA9PT0gZmlsdGVyVGFnO1xuICByZXR1cm4gbGkoeyBjc3M6IHN0eWxlcy5maWx0ZXJzTGkoKSB9LCBbXG4gICAgYSh7XG4gICAgICBhdHRyczogeyBocmVmOiBwYXRoIH0sXG4gICAgICBjc3M6IHN0eWxlcy5maWx0ZXJzQShzZWxlY3RlZClcbiAgICB9LCBsYWJlbClcbiAgXSk7XG59XG5cbmZ1bmN0aW9uIHJlbmRlckZvb3RlcihzdGF0ZSkge1xuICBjb25zdCBhbW91bnRDb21wbGV0ZWQgPSBzdGF0ZS5saXN0XG4gICAgLmZpbHRlcih0YXNrID0+IHRhc2suY29tcGxldGVkKVxuICAgIC5sZW5ndGg7XG4gIGNvbnN0IGFtb3VudEFjdGl2ZSA9IHN0YXRlLmxpc3QubGVuZ3RoIC0gYW1vdW50Q29tcGxldGVkO1xuXG4gIHJldHVybiBmb290ZXIoJy5mb290ZXInLCB7IGNzczogc3R5bGVzLmZvb3RlcihzdGF0ZS5saXN0Lmxlbmd0aCkgfSwgW1xuICAgIHNwYW4oJy50b2RvLWNvdW50JywgeyBjc3M6IHN0eWxlcy50b2RvQ291bnQoKSB9LCBbXG4gICAgICBzdHJvbmcoeyBjc3M6IGdsb2JhbFN0eWxlcy5zdHJvbmcoKSB9LCBTdHJpbmcoYW1vdW50QWN0aXZlKSksXG4gICAgICAnIGl0ZW0nICsgKGFtb3VudEFjdGl2ZSAhPT0gMSA/ICdzJyA6ICcnKSArICcgbGVmdCdcbiAgICBdKSxcbiAgICB1bCgnLmZpbHRlcnMnLCB7IGNzczogc3R5bGVzLmZpbHRlcnMoKSB9LCBbXG4gICAgICByZW5kZXJGaWx0ZXJCdXR0b24oc3RhdGUsICcnLCAnLycsICdBbGwnKSxcbiAgICAgIHJlbmRlckZpbHRlckJ1dHRvbihzdGF0ZSwgJ2FjdGl2ZScsICcvYWN0aXZlJywgJ0FjdGl2ZScpLFxuICAgICAgcmVuZGVyRmlsdGVyQnV0dG9uKHN0YXRlLCAnY29tcGxldGVkJywgJy9jb21wbGV0ZWQnLCAnQ29tcGxldGVkJyksXG4gICAgXSksXG4gICAgKGFtb3VudENvbXBsZXRlZCA+IDAgP1xuICAgICAgYnV0dG9uKCcuY2xlYXItY29tcGxldGVkJywgeyBjc3M6IHN0eWxlcy5jbGVhckNvbXBsZXRlZCgpIH0sICdDbGVhciBjb21wbGV0ZWQgKCcgKyBhbW91bnRDb21wbGV0ZWQgKyAnKScpXG4gICAgICA6IG51bGxcbiAgICApXG4gIF0pO1xufVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiB2aWV3KHN0YXRlJCwgbGlzdFZEb20kKSB7XG4gIHJldHVybiB4cy5jb21iaW5lKHN0YXRlJCwgbGlzdFZEb20kKS5tYXAoKFtzdGF0ZSwgbGlzdFZEb21dKSA9PlxuICAgIGRpdihbXG4gICAgICByZW5kZXJIZWFkZXIoc3RhdGUpLFxuICAgICAgcmVuZGVyTWFpblNlY3Rpb24oc3RhdGUsIGxpc3RWRG9tKSxcbiAgICAgIHJlbmRlckZvb3RlcihzdGF0ZSlcbiAgICBdKVxuICApO1xufTtcbiIsImV4cG9ydCBjb25zdCBzdHJvbmcgPSAoKSA9PiAoe1xuICAnZm9udC13ZWlnaHQnOiAnMzAwJyxcbn0pO1xuXG5leHBvcnQgY29uc3Qgcm90YXRlID0gKGRlZ3JlZXMpID0+ICh7XG4gICctd2Via2l0LXRyYW5zZm9ybSc6IGByb3RhdGUoJHsgZGVncmVlcyB9ZGVnKWAsXG4gICd0cmFuc2Zvcm0nICAgICAgICA6IGByb3RhdGUoJHsgZGVncmVlcyB9ZGVnKWAsXG59KTtcblxuZXhwb3J0IGNvbnN0IGZvbnRTbW9vdGhpbmcgPSAoKSA9PiAoe1xuICAnLXdlYmtpdC1mb250LXNtb290aGluZyc6ICdhbnRpYWxpYXNlZCcsXG4gICctbW96LWZvbnQtc21vb3RoaW5nJyAgIDogJ2dyYXlzY2FsZScsXG59KTtcblxuZXhwb3J0IGNvbnN0IG9wdGltaXplZFRleHQgPSAoKSA9PiAoe1xuICAnLXdlYmtpdC10ZXh0LXJlbmRlcmluZyc6ICdvcHRpbWl6ZUxlZ2liaWxpdHknLFxuICAnLW1vei10ZXh0LXJlbmRlcmluZycgICA6ICdvcHRpbWl6ZUxlZ2liaWxpdHknLFxuICAndGV4dC1yZW5kZXJpbmcnICAgICAgICA6ICdvcHRpbWl6ZUxlZ2liaWxpdHknLFxufSk7XG5cbmV4cG9ydCBjb25zdCBub3JtYWxpemVBcHBlYXJhbmNlID0gKCkgPT4gKHtcbiAgJy13ZWJraXQtYXBwZWFyYW5jZSc6ICdub25lJyxcbiAgJ2FwcGVhcmFuY2UnICAgICAgICA6ICdub25lJyxcbn0pO1xuXG5leHBvcnQgY29uc3QgaW5wdXQgPSAoKSA9PiAoe1xuICAncG9zaXRpb24nICAgOiAncmVsYXRpdmUnLFxuICAnbWFyZ2luJyAgICAgOiAnMCcsXG4gICd3aWR0aCcgICAgICA6ICcxMDAlJyxcbiAgJ2ZvbnQtc2l6ZScgIDogJzI0cHgnLFxuICAnZm9udC1mYW1pbHknOiAnaW5oZXJpdCcsXG4gICdmb250LXdlaWdodCc6ICdpbmhlcml0JyxcbiAgJ2xpbmUtaGVpZ2h0JzogJzEuNGVtJyxcbiAgJ2JvcmRlcicgICAgIDogJzAnLFxuICAnb3V0bGluZScgICAgOiAnbm9uZScsXG4gICdjb2xvcicgICAgICA6ICdpbmhlcml0JyxcbiAgJ3BhZGRpbmcnICAgIDogJzZweCcsXG4gICdib3JkZXInICAgICA6ICcxcHggc29saWQgIzk5OScsXG4gICdib3gtc2hhZG93JyA6ICdpbnNldCAwIC0xcHggNXB4IDAgcmdiYSgwLCAwLCAwLCAwLjIpJyxcbiAgJ2JveC1zaXppbmcnIDogJ2JvcmRlci1ib3gnLFxuICAuLi5mb250U21vb3RoaW5nKClcbn0pO1xuXG5leHBvcnQgY29uc3QgYnV0dG9uID0gKCkgPT4gKHtcbiAgJ21hcmdpbicgICAgICAgIDogJzAnLFxuICAncGFkZGluZycgICAgICAgOiAnMCcsXG4gICdib3JkZXInICAgICAgICA6ICcwJyxcbiAgJ2JhY2tncm91bmQnICAgIDogJ25vbmUnLFxuICAnZm9udC1zaXplJyAgICAgOiAnMTAwJScsXG4gICd2ZXJ0aWNhbC1hbGlnbic6ICdiYXNlbGluZScsXG4gICdmb250LWZhbWlseScgICA6ICdpbmhlcml0JyxcbiAgJ2ZvbnQtd2VpZ2h0JyAgIDogJ2luaGVyaXQnLFxuICAnY29sb3InICAgICAgICAgOiAnaW5oZXJpdCcsXG4gIC4uLm5vcm1hbGl6ZUFwcGVhcmFuY2UoKSxcbiAgLi4uZm9udFNtb290aGluZygpLFxufSlcbiIsImNvbnN0IEVOVEVSX0tFWSA9IDEzO1xuY29uc3QgRVNDX0tFWSA9IDI3O1xuXG5leHBvcnQge0VOVEVSX0tFWSwgRVNDX0tFWX07XG4iXX0=
