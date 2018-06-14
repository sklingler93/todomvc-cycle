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

  var goForward = function goForward() {
    return go(1);
  };

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

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _warning = require('warning');

var _warning2 = _interopRequireDefault(_warning);

var _PathUtils = require('./PathUtils');

var _LocationUtils = require('./LocationUtils');

var _createTransitionManager = require('./createTransitionManager');

var _createTransitionManager2 = _interopRequireDefault(_createTransitionManager);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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

var _warning = require('warning');

var _warning2 = _interopRequireDefault(_warning);

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

    destroy$: domSource.select('.destroy').events('click').mapTo(null)
  };
}

},{"../../utils":153,"xstream":140}],144:[function(require,module,exports){
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

  return _xstream2.default.merge(startEditReducer$, doneEditReducer$, cancelEditReducer$, toggleReducer$, destroyReducer$);
}

},{"xstream":140}],145:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var viewStyle = exports.viewStyle = function viewStyle(editing) {
  return {
    'display': editing ? 'none' : 'block'
  };
};

var todoLiStyle = exports.todoLiStyle = function todoLiStyle(editing, last) {
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

},{}],146:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = view;

var _dom = require('@cycle/dom');

var _styles = require('./styles');

function view(state$) {
  return state$.map(function (_ref) {
    var title = _ref.title,
        completed = _ref.completed,
        editing = _ref.editing,
        last = _ref.last;
    return (0, _dom.li)('.todoRoot', { css: (0, _styles.todoLiStyle)(editing, last), class: { completed: completed, editing: editing } }, [(0, _dom.div)('.view', [(0, _dom.input)('.toggle', {
      props: { type: 'checkbox', checked: completed },
      style: { color: 'red' }
    }), (0, _dom.label)(title), (0, _dom.button)('.destroy')]), (0, _dom.input)('.edit', {
      css: (0, _styles.todoInputStyle)(editing),
      props: { type: 'text' },
      hook: {
        update: function update(oldVNode, _ref2) {
          var elm = _ref2.elm;

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
        return (0, _dom.ul)('.todo-list', vnodes);
      }),
      onion: instances.pickMerge('onion')
    };
  }
});

},{"../Task/index":142,"@cycle/dom":11,"cycle-onionify":32}],148:[function(require,module,exports){
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

},{"../../utils":153,"xstream":140,"xstream/extra/dropRepeats":139}],150:[function(require,module,exports){
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
        editing: false
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
var todoListStyle = exports.todoListStyle = function todoListStyle() {
  return {
    'margin': '0',
    'padding': '0',
    'list-style': 'none'
  };
};

var footerStyle = exports.footerStyle = function footerStyle(listLength) {
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

},{}],152:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

exports.default = view;

var _xstream = require('xstream');

var _xstream2 = _interopRequireDefault(_xstream);

var _dom = require('@cycle/dom');

var _styles = require('./styles');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function renderHeader(state) {
  return (0, _dom.header)('.header', [(0, _dom.h1)('todos'), (0, _dom.input)('.new-todo', {
    props: {
      type: 'text',
      placeholder: 'What needs to be done?',
      autofocus: true,
      name: 'newTodo',
      value: state.inputValue
    }
  })]);
}

function renderMainSection(state, listVDom) {
  var allCompleted = state.list.reduce(function (x, y) {
    return x && y.completed;
  }, true);
  var sectionStyle = { 'display': state.list.length ? '' : 'none' };

  return (0, _dom.section)('.main', { style: sectionStyle }, [(0, _dom.input)('.toggle-all', {
    props: { type: 'checkbox', checked: allCompleted }
  }), listVDom]);
}

function renderFilterButton(state, filterTag, path, label) {
  return (0, _dom.li)([(0, _dom.a)({
    attrs: { href: path },
    class: { selected: state.filter === filterTag }
  }, label)]);
}

function renderFooter(state) {
  var amountCompleted = state.list.filter(function (task) {
    return task.completed;
  }).length;
  var amountActive = state.list.length - amountCompleted;

  return (0, _dom.footer)('.footer', { css: (0, _styles.footerStyle)(state.list.length) }, [(0, _dom.span)('.todo-count', [(0, _dom.strong)(String(amountActive)), ' item' + (amountActive !== 1 ? 's' : '') + ' left']), (0, _dom.ul)('.filters', [renderFilterButton(state, '', '/', 'All'), renderFilterButton(state, 'active', '/active', 'Active'), renderFilterButton(state, 'completed', '/completed', 'Completed')]), amountCompleted > 0 ? (0, _dom.button)('.clear-completed', 'Clear completed (' + amountCompleted + ')') : null]);
}

function view(state$, listVDom$) {
  return _xstream2.default.combine(state$, listVDom$).map(function (_ref) {
    var _ref2 = _slicedToArray(_ref, 2),
        state = _ref2[0],
        listVDom = _ref2[1];

    return (0, _dom.div)([renderHeader(state), renderMainSection(state, listVDom), renderFooter(state)]);
  });
};

},{"./styles":151,"@cycle/dom":11,"xstream":140}],153:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var ENTER_KEY = 13;
var ESC_KEY = 27;

exports.ENTER_KEY = ENTER_KEY;
exports.ESC_KEY = ESC_KEY;

},{}]},{},[141])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL2RvbS9saWIvQm9keURPTVNvdXJjZS5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvZG9tL2xpYi9Eb2N1bWVudERPTVNvdXJjZS5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvZG9tL2xpYi9FbGVtZW50RmluZGVyLmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9kb20vbGliL0V2ZW50RGVsZWdhdG9yLmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9kb20vbGliL0lzb2xhdGVNb2R1bGUuanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL2RvbS9saWIvTWFpbkRPTVNvdXJjZS5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvZG9tL2xpYi9TY29wZUNoZWNrZXIuanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL2RvbS9saWIvVk5vZGVXcmFwcGVyLmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9kb20vbGliL2Zyb21FdmVudC5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvZG9tL2xpYi9oeXBlcnNjcmlwdC1oZWxwZXJzLmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9kb20vbGliL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9kb20vbGliL2lzb2xhdGUuanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL2RvbS9saWIvbWFrZURPTURyaXZlci5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvZG9tL2xpYi9tYXRjaGVzU2VsZWN0b3IuanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL2RvbS9saWIvbW9ja0RPTVNvdXJjZS5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvZG9tL2xpYi9tb2R1bGVzLmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9kb20vbGliL3RodW5rLmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9kb20vbGliL3V0aWxzLmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9oaXN0b3J5L2xpYi9jYXB0dXJlQ2xpY2tzLmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9oaXN0b3J5L2xpYi9jcmVhdGVIaXN0b3J5JC5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvaGlzdG9yeS9saWIvZHJpdmVycy5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvaGlzdG9yeS9saWIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL2lzb2xhdGUvbGliL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9ydW4vbGliL2FkYXB0LmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9ydW4vbGliL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9zdG9yYWdlL2xpYi9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvc3RvcmFnZS9saWIvcmVzcG9uc2VDb2xsZWN0aW9uLmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9zdG9yYWdlL2xpYi91dGlsLmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9zdG9yYWdlL2xpYi93cml0ZVRvU3RvcmUuanMiLCJub2RlX21vZHVsZXMvY3ljbGUtb25pb25pZnkvbGliL0NvbGxlY3Rpb24uanMiLCJub2RlX21vZHVsZXMvY3ljbGUtb25pb25pZnkvbGliL1N0YXRlU291cmNlLmpzIiwibm9kZV9tb2R1bGVzL2N5Y2xlLW9uaW9uaWZ5L2xpYi9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9jeWNsZS1vbmlvbmlmeS9saWIvb25pb25pZnkuanMiLCJub2RlX21vZHVsZXMvY3ljbGUtb25pb25pZnkvbGliL3BpY2tDb21iaW5lLmpzIiwibm9kZV9tb2R1bGVzL2N5Y2xlLW9uaW9uaWZ5L2xpYi9waWNrTWVyZ2UuanMiLCJub2RlX21vZHVsZXMvY3ljbGUtc3RvcmFnZWlmeS9saWIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvZC9hdXRvLWJpbmQuanMiLCJub2RlX21vZHVsZXMvZC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9lczUtZXh0L2FycmF5LyMvY2xlYXIuanMiLCJub2RlX21vZHVsZXMvZXM1LWV4dC9hcnJheS8jL2UtaW5kZXgtb2YuanMiLCJub2RlX21vZHVsZXMvZXM1LWV4dC9hcnJheS9mcm9tL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2VzNS1leHQvYXJyYXkvZnJvbS9pcy1pbXBsZW1lbnRlZC5qcyIsIm5vZGVfbW9kdWxlcy9lczUtZXh0L2FycmF5L2Zyb20vc2hpbS5qcyIsIm5vZGVfbW9kdWxlcy9lczUtZXh0L2Z1bmN0aW9uL2lzLWFyZ3VtZW50cy5qcyIsIm5vZGVfbW9kdWxlcy9lczUtZXh0L2Z1bmN0aW9uL2lzLWZ1bmN0aW9uLmpzIiwibm9kZV9tb2R1bGVzL2VzNS1leHQvZnVuY3Rpb24vbm9vcC5qcyIsIm5vZGVfbW9kdWxlcy9lczUtZXh0L21hdGgvc2lnbi9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9lczUtZXh0L21hdGgvc2lnbi9pcy1pbXBsZW1lbnRlZC5qcyIsIm5vZGVfbW9kdWxlcy9lczUtZXh0L21hdGgvc2lnbi9zaGltLmpzIiwibm9kZV9tb2R1bGVzL2VzNS1leHQvbnVtYmVyL2lzLW5hbi9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9lczUtZXh0L251bWJlci9pcy1uYW4vaXMtaW1wbGVtZW50ZWQuanMiLCJub2RlX21vZHVsZXMvZXM1LWV4dC9udW1iZXIvaXMtbmFuL3NoaW0uanMiLCJub2RlX21vZHVsZXMvZXM1LWV4dC9udW1iZXIvdG8taW50ZWdlci5qcyIsIm5vZGVfbW9kdWxlcy9lczUtZXh0L251bWJlci90by1wb3MtaW50ZWdlci5qcyIsIm5vZGVfbW9kdWxlcy9lczUtZXh0L29iamVjdC9faXRlcmF0ZS5qcyIsIm5vZGVfbW9kdWxlcy9lczUtZXh0L29iamVjdC9hc3NpZ24vaW5kZXguanMiLCJub2RlX21vZHVsZXMvZXM1LWV4dC9vYmplY3QvYXNzaWduL2lzLWltcGxlbWVudGVkLmpzIiwibm9kZV9tb2R1bGVzL2VzNS1leHQvb2JqZWN0L2Fzc2lnbi9zaGltLmpzIiwibm9kZV9tb2R1bGVzL2VzNS1leHQvb2JqZWN0L2NvcHkuanMiLCJub2RlX21vZHVsZXMvZXM1LWV4dC9vYmplY3QvY3JlYXRlLmpzIiwibm9kZV9tb2R1bGVzL2VzNS1leHQvb2JqZWN0L2Zvci1lYWNoLmpzIiwibm9kZV9tb2R1bGVzL2VzNS1leHQvb2JqZWN0L2lzLWNhbGxhYmxlLmpzIiwibm9kZV9tb2R1bGVzL2VzNS1leHQvb2JqZWN0L2lzLW9iamVjdC5qcyIsIm5vZGVfbW9kdWxlcy9lczUtZXh0L29iamVjdC9pcy12YWx1ZS5qcyIsIm5vZGVfbW9kdWxlcy9lczUtZXh0L29iamVjdC9rZXlzL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2VzNS1leHQvb2JqZWN0L2tleXMvaXMtaW1wbGVtZW50ZWQuanMiLCJub2RlX21vZHVsZXMvZXM1LWV4dC9vYmplY3Qva2V5cy9zaGltLmpzIiwibm9kZV9tb2R1bGVzL2VzNS1leHQvb2JqZWN0L21hcC5qcyIsIm5vZGVfbW9kdWxlcy9lczUtZXh0L29iamVjdC9ub3JtYWxpemUtb3B0aW9ucy5qcyIsIm5vZGVfbW9kdWxlcy9lczUtZXh0L29iamVjdC9wcmltaXRpdmUtc2V0LmpzIiwibm9kZV9tb2R1bGVzL2VzNS1leHQvb2JqZWN0L3NldC1wcm90b3R5cGUtb2YvaW5kZXguanMiLCJub2RlX21vZHVsZXMvZXM1LWV4dC9vYmplY3Qvc2V0LXByb3RvdHlwZS1vZi9pcy1pbXBsZW1lbnRlZC5qcyIsIm5vZGVfbW9kdWxlcy9lczUtZXh0L29iamVjdC9zZXQtcHJvdG90eXBlLW9mL3NoaW0uanMiLCJub2RlX21vZHVsZXMvZXM1LWV4dC9vYmplY3QvdmFsaWQtY2FsbGFibGUuanMiLCJub2RlX21vZHVsZXMvZXM1LWV4dC9vYmplY3QvdmFsaWQtdmFsdWUuanMiLCJub2RlX21vZHVsZXMvZXM1LWV4dC9zdHJpbmcvIy9jb250YWlucy9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9lczUtZXh0L3N0cmluZy8jL2NvbnRhaW5zL2lzLWltcGxlbWVudGVkLmpzIiwibm9kZV9tb2R1bGVzL2VzNS1leHQvc3RyaW5nLyMvY29udGFpbnMvc2hpbS5qcyIsIm5vZGVfbW9kdWxlcy9lczUtZXh0L3N0cmluZy9pcy1zdHJpbmcuanMiLCJub2RlX21vZHVsZXMvZXM2LWl0ZXJhdG9yL2FycmF5LmpzIiwibm9kZV9tb2R1bGVzL2VzNi1pdGVyYXRvci9mb3Itb2YuanMiLCJub2RlX21vZHVsZXMvZXM2LWl0ZXJhdG9yL2dldC5qcyIsIm5vZGVfbW9kdWxlcy9lczYtaXRlcmF0b3IvaW5kZXguanMiLCJub2RlX21vZHVsZXMvZXM2LWl0ZXJhdG9yL2lzLWl0ZXJhYmxlLmpzIiwibm9kZV9tb2R1bGVzL2VzNi1pdGVyYXRvci9zdHJpbmcuanMiLCJub2RlX21vZHVsZXMvZXM2LWl0ZXJhdG9yL3ZhbGlkLWl0ZXJhYmxlLmpzIiwibm9kZV9tb2R1bGVzL2VzNi1tYXAvaW5kZXguanMiLCJub2RlX21vZHVsZXMvZXM2LW1hcC9pcy1pbXBsZW1lbnRlZC5qcyIsIm5vZGVfbW9kdWxlcy9lczYtbWFwL2lzLW5hdGl2ZS1pbXBsZW1lbnRlZC5qcyIsIm5vZGVfbW9kdWxlcy9lczYtbWFwL2xpYi9pdGVyYXRvci1raW5kcy5qcyIsIm5vZGVfbW9kdWxlcy9lczYtbWFwL2xpYi9pdGVyYXRvci5qcyIsIm5vZGVfbW9kdWxlcy9lczYtbWFwL3BvbHlmaWxsLmpzIiwibm9kZV9tb2R1bGVzL2VzNi1zeW1ib2wvaW5kZXguanMiLCJub2RlX21vZHVsZXMvZXM2LXN5bWJvbC9pcy1pbXBsZW1lbnRlZC5qcyIsIm5vZGVfbW9kdWxlcy9lczYtc3ltYm9sL2lzLXN5bWJvbC5qcyIsIm5vZGVfbW9kdWxlcy9lczYtc3ltYm9sL3BvbHlmaWxsLmpzIiwibm9kZV9tb2R1bGVzL2VzNi1zeW1ib2wvdmFsaWRhdGUtc3ltYm9sLmpzIiwibm9kZV9tb2R1bGVzL2V2ZW50LWVtaXR0ZXIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvZnJlZS1zdHlsZS9kaXN0L2ZyZWUtc3R5bGUuanMiLCJub2RlX21vZHVsZXMvaGlzdG9yeS9ET01VdGlscy5qcyIsIm5vZGVfbW9kdWxlcy9oaXN0b3J5L0xvY2F0aW9uVXRpbHMuanMiLCJub2RlX21vZHVsZXMvaGlzdG9yeS9QYXRoVXRpbHMuanMiLCJub2RlX21vZHVsZXMvaGlzdG9yeS9jcmVhdGVCcm93c2VySGlzdG9yeS5qcyIsIm5vZGVfbW9kdWxlcy9oaXN0b3J5L2NyZWF0ZUhhc2hIaXN0b3J5LmpzIiwibm9kZV9tb2R1bGVzL2hpc3RvcnkvY3JlYXRlTWVtb3J5SGlzdG9yeS5qcyIsIm5vZGVfbW9kdWxlcy9oaXN0b3J5L2NyZWF0ZVRyYW5zaXRpb25NYW5hZ2VyLmpzIiwibm9kZV9tb2R1bGVzL2hpc3RvcnkvaW5kZXguanMiLCJub2RlX21vZHVsZXMvaW52YXJpYW50L2Jyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL3Jlc29sdmUtcGF0aG5hbWUvY2pzL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3NuYWJiZG9tLXNlbGVjdG9yL2xpYi9jb21tb25qcy9jbGFzc05hbWVGcm9tVk5vZGUuanMiLCJub2RlX21vZHVsZXMvc25hYmJkb20tc2VsZWN0b3IvbGliL2NvbW1vbmpzL3NlbGVjdG9yUGFyc2VyLmpzIiwibm9kZV9tb2R1bGVzL3NuYWJiZG9tLXR5cGVzdHlsZS9kaXN0L2NsaWVudC5qcyIsIm5vZGVfbW9kdWxlcy9zbmFiYmRvbS10eXBlc3R5bGUvZGlzdC9zZXJ2ZXIuanMiLCJub2RlX21vZHVsZXMvc25hYmJkb20tdHlwZXN0eWxlL2Rpc3Qvc25hYmJkb20tdHlwZXN0eWxlLmpzIiwibm9kZV9tb2R1bGVzL3NuYWJiZG9tLXR5cGVzdHlsZS9kaXN0L3V0aWxzLmpzIiwibm9kZV9tb2R1bGVzL3NuYWJiZG9tL2guanMiLCJub2RlX21vZHVsZXMvc25hYmJkb20vaHRtbGRvbWFwaS5qcyIsIm5vZGVfbW9kdWxlcy9zbmFiYmRvbS9pcy5qcyIsIm5vZGVfbW9kdWxlcy9zbmFiYmRvbS9tb2R1bGVzL2F0dHJpYnV0ZXMuanMiLCJub2RlX21vZHVsZXMvc25hYmJkb20vbW9kdWxlcy9jbGFzcy5qcyIsIm5vZGVfbW9kdWxlcy9zbmFiYmRvbS9tb2R1bGVzL2RhdGFzZXQuanMiLCJub2RlX21vZHVsZXMvc25hYmJkb20vbW9kdWxlcy9wcm9wcy5qcyIsIm5vZGVfbW9kdWxlcy9zbmFiYmRvbS9tb2R1bGVzL3N0eWxlLmpzIiwibm9kZV9tb2R1bGVzL3NuYWJiZG9tL3NuYWJiZG9tLmpzIiwibm9kZV9tb2R1bGVzL3NuYWJiZG9tL3RodW5rLmpzIiwibm9kZV9tb2R1bGVzL3NuYWJiZG9tL3Rvdm5vZGUuanMiLCJub2RlX21vZHVsZXMvc25hYmJkb20vdm5vZGUuanMiLCJub2RlX21vZHVsZXMvc3ltYm9sLW9ic2VydmFibGUvbGliL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3N5bWJvbC1vYnNlcnZhYmxlL2xpYi9wb255ZmlsbC5qcyIsIm5vZGVfbW9kdWxlcy90eXBlc3R5bGUvbGliL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3R5cGVzdHlsZS9saWIvaW50ZXJuYWwvZm9ybWF0dGluZy5qcyIsIm5vZGVfbW9kdWxlcy90eXBlc3R5bGUvbGliL2ludGVybmFsL3R5cGVzdHlsZS5qcyIsIm5vZGVfbW9kdWxlcy90eXBlc3R5bGUvbGliL2ludGVybmFsL3V0aWxpdGllcy5qcyIsIm5vZGVfbW9kdWxlcy90eXBlc3R5bGUvbGliL3R5cGVzLmpzIiwibm9kZV9tb2R1bGVzL3ZhbHVlLWVxdWFsL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3dhcm5pbmcvYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy94c3RyZWFtL2V4dHJhL2RlYm91bmNlLmpzIiwibm9kZV9tb2R1bGVzL3hzdHJlYW0vZXh0cmEvZHJvcFJlcGVhdHMuanMiLCJub2RlX21vZHVsZXMveHN0cmVhbS9pbmRleC5qcyIsInNyYy9hcHAuanMiLCJzcmMvY29tcG9uZW50cy9UYXNrL2luZGV4LmpzIiwic3JjL2NvbXBvbmVudHMvVGFzay9pbnRlbnQuanMiLCJzcmMvY29tcG9uZW50cy9UYXNrL21vZGVsLmpzIiwic3JjL2NvbXBvbmVudHMvVGFzay9zdHlsZXMuanMiLCJzcmMvY29tcG9uZW50cy9UYXNrL3ZpZXcuanMiLCJzcmMvY29tcG9uZW50cy9UYXNrTGlzdC9MaXN0LmpzIiwic3JjL2NvbXBvbmVudHMvVGFza0xpc3QvaW5kZXguanMiLCJzcmMvY29tcG9uZW50cy9UYXNrTGlzdC9pbnRlbnQuanMiLCJzcmMvY29tcG9uZW50cy9UYXNrTGlzdC9tb2RlbC5qcyIsInNyYy9jb21wb25lbnRzL1Rhc2tMaXN0L3N0eWxlcy5qcyIsInNyYy9jb21wb25lbnRzL1Rhc2tMaXN0L3ZpZXcuanMiLCJzcmMvdXRpbHMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNySEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5TEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvT0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoREE7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUkE7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hHQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDcElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzFjQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbFRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuVUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNuREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9FQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0R0E7QUFDQTtBQUNBOztBQ0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUN2Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUM1REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3p0REE7O0FBQ0E7O0FBQ0E7Ozs7QUFDQTs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFFQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7Ozs7QUFFQSxJQUFNLFVBQVUsQ0FDZCxlQURjLEVBRWQsb0JBRmMsRUFHZCxlQUhjLEVBSWQsMkJBSmMsRUFLZCxlQUxjLENBQWhCOztBQVFBLElBQU0sT0FBTyw2QkFBUywrQkFBVyxrQkFBWCxFQUFxQixFQUFDLEtBQUssYUFBTixFQUFyQixDQUFULENBQWI7O0FBRUEsY0FBSSxJQUFKLEVBQVU7QUFDUixPQUFLLHdCQUFjLFVBQWQsRUFBMEIsRUFBQyxnQkFBRCxFQUFVLGVBQWUsSUFBekIsRUFBMUIsQ0FERztBQUVSLFdBQVMsNEJBQWMsaUNBQWQsQ0FGRDtBQUdSLFdBQVM7QUFIRCxDQUFWOzs7Ozs7OztrQkNwQndCLEk7O0FBSnhCOzs7O0FBQ0E7Ozs7QUFDQTs7Ozs7O0FBRWUsU0FBUyxJQUFULENBQWMsT0FBZCxFQUF1QjtBQUNwQyxNQUFNLFVBQVUsc0JBQU8sUUFBUSxHQUFmLENBQWhCO0FBQ0EsTUFBTSxXQUFXLHFCQUFNLE9BQU4sQ0FBakI7QUFDQSxNQUFNLFFBQVEsb0JBQUssUUFBUSxLQUFSLENBQWMsTUFBbkIsQ0FBZDs7QUFFQSxTQUFPO0FBQ0wsU0FBSyxLQURBO0FBRUwsV0FBTztBQUZGLEdBQVA7QUFJRDs7Ozs7Ozs7a0JDVnVCLE07O0FBSHhCOzs7O0FBQ0E7Ozs7QUFFZSxTQUFTLE1BQVQsQ0FBZ0IsU0FBaEIsRUFBMkI7QUFDeEMsTUFBTSxrQkFBa0IsVUFDckIsTUFEcUIsQ0FDZCxPQURjLEVBQ0wsTUFESyxDQUNFLE9BREYsRUFFckIsTUFGcUIsQ0FFZDtBQUFBLFdBQU0sR0FBRyxPQUFILEtBQWUsZ0JBQXJCO0FBQUEsR0FGYyxDQUF4Qjs7QUFJQSxNQUFNLGlCQUFpQixVQUFVLE1BQVYsQ0FBaUIsT0FBakIsRUFBMEIsTUFBMUIsQ0FBaUMsTUFBakMsRUFBeUMsSUFBekMsQ0FBdkI7O0FBRUEsU0FBTztBQUNMLGdCQUFZLFVBQ1QsTUFEUyxDQUNGLE9BREUsRUFDTyxNQURQLENBQ2MsVUFEZCxFQUVULEtBRlMsQ0FFSCxJQUZHLENBRFA7O0FBS0wsZUFBVyxrQkFBRyxLQUFILENBQVMsZUFBVCxFQUEwQixjQUExQixFQUNSLEdBRFEsQ0FDSjtBQUFBLGFBQU0sR0FBRyxNQUFILENBQVUsS0FBaEI7QUFBQSxLQURJLENBTE47O0FBUUwsaUJBQWEsVUFDVixNQURVLENBQ0gsT0FERyxFQUNNLE1BRE4sQ0FDYSxPQURiLEVBRVYsTUFGVSxDQUVIO0FBQUEsYUFBTSxHQUFHLE9BQUgsS0FBZSxjQUFyQjtBQUFBLEtBRkcsRUFHVixLQUhVLENBR0osSUFISSxDQVJSOztBQWFMLGFBQVMsVUFDTixNQURNLENBQ0MsU0FERCxFQUNZLE1BRFosQ0FDbUIsUUFEbkIsRUFFTixHQUZNLENBRUY7QUFBQSxhQUFNLEdBQUcsTUFBSCxDQUFVLE9BQWhCO0FBQUEsS0FGRSxDQWJKOztBQWlCTCxjQUFVLFVBQ1AsTUFETyxDQUNBLFVBREEsRUFDWSxNQURaLENBQ21CLE9BRG5CLEVBRVAsS0FGTyxDQUVELElBRkM7QUFqQkwsR0FBUDtBQXFCRDs7Ozs7Ozs7Ozs7a0JDN0J1QixLOztBQUZ4Qjs7Ozs7O0FBRWUsU0FBUyxLQUFULENBQWUsT0FBZixFQUF3QjtBQUNyQyxNQUFNLG9CQUFvQixRQUFRLFVBQVIsQ0FDdkIsS0FEdUIsQ0FDakIsU0FBUyxnQkFBVCxDQUEwQixJQUExQixFQUFnQztBQUNyQyx3QkFBVyxJQUFYLElBQWlCLFNBQVMsSUFBMUI7QUFDRCxHQUh1QixDQUExQjs7QUFLQSxNQUFNLG1CQUFtQixRQUFRLFNBQVIsQ0FDdEIsR0FEc0IsQ0FDbEI7QUFBQSxXQUFXLFNBQVMsZUFBVCxDQUF5QixJQUF6QixFQUErQjtBQUM3QywwQkFBVyxJQUFYLElBQWlCLE9BQU8sT0FBeEIsRUFBaUMsU0FBUyxLQUExQztBQUNELEtBRkk7QUFBQSxHQURrQixDQUF6Qjs7QUFLQSxNQUFNLHFCQUFxQixRQUFRLFdBQVIsQ0FDeEIsS0FEd0IsQ0FDbEIsU0FBUyxpQkFBVCxDQUEyQixJQUEzQixFQUFpQztBQUN0Qyx3QkFBVyxJQUFYLElBQWlCLFNBQVMsS0FBMUI7QUFDRCxHQUh3QixDQUEzQjs7QUFLQSxNQUFNLGlCQUFpQixRQUFRLE9BQVIsQ0FDcEIsR0FEb0IsQ0FDaEI7QUFBQSxXQUFhLFNBQVMsYUFBVCxDQUF1QixJQUF2QixFQUE2QjtBQUM3QywwQkFBVyxJQUFYLElBQWlCLFdBQVcsU0FBNUI7QUFDRCxLQUZJO0FBQUEsR0FEZ0IsQ0FBdkI7O0FBS0EsTUFBTSxrQkFBa0IsUUFBUSxRQUFSLENBQ3JCLEtBRHFCLENBQ2YsU0FBUyxjQUFULENBQXdCLElBQXhCLEVBQThCO0FBQ25DLFdBQU8sS0FBSyxDQUFaO0FBQ0QsR0FIcUIsQ0FBeEI7O0FBS0EsU0FBTyxrQkFBRyxLQUFILENBQ0wsaUJBREssRUFFTCxnQkFGSyxFQUdMLGtCQUhLLEVBSUwsY0FKSyxFQUtMLGVBTEssQ0FBUDtBQU9EOzs7Ozs7Ozs7Ozs7O0FDbkNNLElBQU0sZ0NBQVksU0FBWixTQUFZLENBQUMsT0FBRDtBQUFBLFNBQWM7QUFDckMsZUFBVyxVQUFVLE1BQVYsR0FBbUI7QUFETyxHQUFkO0FBQUEsQ0FBbEI7O0FBSUEsSUFBTSxvQ0FBYyxTQUFkLFdBQWMsQ0FBQyxPQUFELEVBQVUsSUFBVjtBQUFBO0FBQ3pCLGdCQUFjLFVBRFc7QUFFekIsaUJBQWM7QUFGVyxLQUdyQixVQUFVO0FBQ1oscUJBQWlCLE1BREw7QUFFWixlQUFpQjtBQUZMLEdBQVYsR0FHQTtBQUNGLHFCQUFpQjtBQURmLEdBTnFCLEVBU3JCLE9BQU8sRUFBNkI7QUFDdEMscUJBQWlCLE1BRFIsQ0FDNkI7QUFEN0IsR0FBUCxHQUVBLEVBWHFCO0FBQUEsQ0FBcEI7O0FBY0EsSUFBTSxrREFBcUIsU0FBckIsa0JBQXFCO0FBQUEsU0FBTztBQUN2Qyw4QkFBMEIsYUFEYTtBQUV2QywyQkFBMEIsYUFGYTtBQUd2QyxzQkFBMEI7QUFIYSxHQUFQO0FBQUEsQ0FBM0I7O0FBTUEsSUFBTSwwQ0FBaUIsU0FBakIsY0FBaUIsQ0FBQyxPQUFEO0FBQUE7O0FBQUE7QUFDNUIsZ0JBQWUsVUFEYTtBQUU1QixjQUFlLEdBRmE7QUFHNUIsYUFBZSxNQUhhO0FBSTVCLGlCQUFlLE1BSmE7QUFLNUIsbUJBQWUsU0FMYTtBQU01QixtQkFBZSxTQU5hO0FBTzVCLG1CQUFlLE9BUGE7QUFRNUIsY0FBZSxHQVJhO0FBUzVCLGVBQWUsTUFUYTtBQVU1QixhQUFlLFNBVmE7QUFXNUIsZUFBZTtBQVhhLDBDQVliLGdCQVphLDhCQWE1QixZQWI0QixFQWFiLHVDQWJhLDhCQWM1QixZQWQ0QixFQWNiLFlBZGEsZUFlekIsa0JBZnlCLEVBZ0J4QixVQUFVO0FBQ1osZUFBVyxPQURDO0FBRVosYUFBVyxPQUZDO0FBR1osZUFBVyxxQkFIQztBQUlaLGNBQVc7QUFKQyxHQUFWLEdBS0E7QUFDRixlQUFXO0FBRFQsR0FyQndCO0FBQUEsQ0FBdkI7Ozs7Ozs7O2tCQ3JCaUIsSTs7QUFIeEI7O0FBQ0E7O0FBRWUsU0FBUyxJQUFULENBQWMsTUFBZCxFQUFzQjtBQUNuQyxTQUFPLE9BQU8sR0FBUCxDQUFXO0FBQUEsUUFBRSxLQUFGLFFBQUUsS0FBRjtBQUFBLFFBQVMsU0FBVCxRQUFTLFNBQVQ7QUFBQSxRQUFvQixPQUFwQixRQUFvQixPQUFwQjtBQUFBLFFBQTZCLElBQTdCLFFBQTZCLElBQTdCO0FBQUEsV0FDaEIsYUFBRyxXQUFILEVBQWdCLEVBQUMsS0FBSyx5QkFBWSxPQUFaLEVBQXFCLElBQXJCLENBQU4sRUFBa0MsT0FBTyxFQUFDLG9CQUFELEVBQVksZ0JBQVosRUFBekMsRUFBaEIsRUFBZ0YsQ0FDOUUsY0FBSSxPQUFKLEVBQWEsQ0FDWCxnQkFBTSxTQUFOLEVBQWlCO0FBQ2YsYUFBTyxFQUFDLE1BQU0sVUFBUCxFQUFtQixTQUFTLFNBQTVCLEVBRFE7QUFFZixhQUFPLEVBQUMsT0FBTyxLQUFSO0FBRlEsS0FBakIsQ0FEVyxFQUtYLGdCQUFNLEtBQU4sQ0FMVyxFQU1YLGlCQUFPLFVBQVAsQ0FOVyxDQUFiLENBRDhFLEVBUzlFLGdCQUFNLE9BQU4sRUFBZTtBQUNiLFdBQUssNEJBQWUsT0FBZixDQURRO0FBRWIsYUFBTyxFQUFDLE1BQU0sTUFBUCxFQUZNO0FBR2IsWUFBTTtBQUNKLGdCQUFRLGdCQUFDLFFBQUQsU0FBcUI7QUFBQSxjQUFULEdBQVMsU0FBVCxHQUFTOztBQUMzQixjQUFJLEtBQUosR0FBWSxLQUFaO0FBQ0EsY0FBSSxPQUFKLEVBQWE7QUFDWCxnQkFBSSxLQUFKO0FBQ0EsZ0JBQUksY0FBSixHQUFxQixJQUFJLEtBQUosQ0FBVSxNQUEvQjtBQUNEO0FBQ0Y7QUFQRztBQUhPLEtBQWYsQ0FUOEUsQ0FBaEYsQ0FEZ0I7QUFBQSxHQUFYLENBQVA7QUF5QkQ7Ozs7Ozs7Ozs7QUM3QkQ7O0FBQ0E7O0FBQ0E7Ozs7OztBQUVPLElBQU0sc0JBQU8sbUNBQWU7QUFDakMsUUFBTSxlQUQyQjtBQUVqQyxXQUFTO0FBQUEsV0FBUyxNQUFNLEdBQWY7QUFBQSxHQUZ3QjtBQUdqQyxhQUFXO0FBQUEsV0FBTyxHQUFQO0FBQUEsR0FIc0I7QUFJakMsZ0JBQWM7QUFBQSxXQUFjO0FBQzFCLFdBQUssVUFBVSxXQUFWLENBQXNCLEtBQXRCLEVBQ0YsR0FERSxDQUNFO0FBQUEsZUFBVSxhQUFHLFlBQUgsRUFBaUIsTUFBakIsQ0FBVjtBQUFBLE9BREYsQ0FEcUI7QUFHMUIsYUFBTyxVQUFVLFNBQVYsQ0FBb0IsT0FBcEI7QUFIbUIsS0FBZDtBQUFBO0FBSm1CLENBQWYsQ0FBYjs7Ozs7Ozs7Ozs7O2tCQ21DaUIsUTs7QUF2Q3hCOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUVBLFNBQVMsSUFBVCxDQUFjLEdBQWQsRUFBbUIsR0FBbkIsRUFBd0I7QUFDdEIsTUFBSSxtQkFBVyxHQUFYLENBQUo7QUFDQSxTQUFPLElBQUksR0FBSixDQUFQO0FBQ0EsU0FBTyxHQUFQO0FBQ0Q7O0FBRU0sSUFBTSw4QkFBVztBQUN0QixPQUFLLGFBQUMsS0FBRDtBQUFBLFdBQVcsTUFBTSxJQUFOLENBQ1gsTUFEVyxDQUNKLE1BQU0sUUFERixFQUVYLEtBRlcsQ0FFTCxDQUZLLEVBRUYsQ0FBQyxDQUZDLEVBR1gsTUFIVyxjQUlMLE1BQU0sSUFBTixDQUFXLE1BQU0sSUFBTixDQUFXLE1BQVgsR0FBb0IsQ0FBL0IsQ0FKSztBQUtSLFlBQU07QUFMRSxPQUFYO0FBQUEsR0FEaUI7QUFRdEIsT0FBSyxhQUFDLEtBQUQsRUFBUSxnQkFBUixFQUE2QjtBQUNoQyxRQUFNLG1CQUFtQixNQUFNLElBQU4sQ0FBVyxNQUFYLENBQWtCLE1BQU0sUUFBeEIsQ0FBekI7QUFDQSxRQUFNLFVBQVUsTUFBTSxJQUFOLENBQ2IsR0FEYSxDQUNUO0FBQUEsYUFBUSxpQkFBaUIsSUFBakIsQ0FBc0I7QUFBQSxlQUFLLEVBQUUsR0FBRixLQUFVLEtBQUssR0FBcEI7QUFBQSxPQUF0QixLQUFrRCxJQUExRDtBQUFBLEtBRFMsRUFFYixNQUZhLENBRU47QUFBQSxhQUNOLGlCQUFpQixJQUFqQixDQUFzQjtBQUFBLGVBQUssRUFBRSxHQUFGLEtBQVUsS0FBSyxHQUFwQjtBQUFBLE9BQXRCLEtBQ0EsaUJBQWlCLElBQWpCLENBQXNCO0FBQUEsZUFBSyxFQUFFLEdBQUYsS0FBVSxLQUFLLEdBQXBCO0FBQUEsT0FBdEIsQ0FGTTtBQUFBLEtBRk0sQ0FBaEI7O0FBT0Esd0JBQ0ssS0FETDtBQUVFLFlBQU0sUUFDSCxLQURHLENBQ0csQ0FESCxFQUNNLENBQUMsQ0FEUCxFQUVILE1BRkcsQ0FFSSxLQUFLLFFBQVEsUUFBUSxNQUFSLEdBQWlCLENBQXpCLENBQUwsRUFBa0MsTUFBbEMsQ0FGSjtBQUZSO0FBTUQ7QUF2QnFCLENBQWpCOztBQTBCUSxTQUFTLFFBQVQsQ0FBa0IsT0FBbEIsRUFBMkI7QUFDeEMsTUFBTSxTQUFTLFFBQVEsS0FBUixDQUFjLE1BQTdCO0FBQ0EsTUFBTSxVQUFVLHNCQUFPLFFBQVEsR0FBZixFQUFvQixRQUFRLE9BQTVCLENBQWhCO0FBQ0EsTUFBTSxpQkFBaUIscUJBQU0sT0FBTixDQUF2Qjs7QUFFQSxNQUFNLFlBQVksdUJBQVEsVUFBUixFQUFjLEVBQUMsT0FBTyxRQUFSLEVBQWQsRUFBaUMsT0FBakMsQ0FBbEI7QUFDQSxNQUFNLFlBQVksVUFBVSxHQUE1QjtBQUNBLE1BQU0sZUFBZSxVQUFVLEtBQS9COztBQUVBLE1BQU0sUUFBUSxvQkFBSyxNQUFMLEVBQWEsU0FBYixDQUFkO0FBQ0EsTUFBTSxXQUFXLGtCQUFHLEtBQUgsQ0FBUyxjQUFULEVBQXlCLFlBQXpCLENBQWpCOztBQUVBLFNBQU87QUFDTCxTQUFLLEtBREE7QUFFTCxXQUFPO0FBRkYsR0FBUDtBQUlEOzs7Ozs7OztrQkNuRHVCLE07O0FBSnhCOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUVlLFNBQVMsTUFBVCxDQUFnQixTQUFoQixFQUEyQixhQUEzQixFQUEwQztBQUN2RCxTQUFPO0FBQ0wsa0JBQWMsY0FDWCxHQURXLENBQ1A7QUFBQSxhQUFZLFNBQVMsUUFBckI7QUFBQSxLQURPLEVBRVgsT0FGVyxDQUVILDRCQUZHLENBRFQ7O0FBS0wsdUJBQW1CLFVBQ2hCLE1BRGdCLENBQ1QsV0FEUyxFQUNJLE1BREosQ0FDVyxPQURYLEVBRWhCLEdBRmdCLENBRVo7QUFBQSxhQUFNLEdBQUcsTUFBSCxDQUFVLEtBQWhCO0FBQUEsS0FGWSxDQUxkOztBQVNMLGtCQUFjLFVBQ1gsTUFEVyxDQUNKLFdBREksRUFDUyxNQURULENBQ2dCLFNBRGhCLEVBRVgsTUFGVyxDQUVKO0FBQUEsYUFBTSxHQUFHLE9BQUgsS0FBZSxjQUFyQjtBQUFBLEtBRkksQ0FUVDs7QUFhTCxpQkFBYSxVQUNWLE1BRFUsQ0FDSCxXQURHLEVBQ1UsTUFEVixDQUNpQixTQURqQixFQUVWLE1BRlUsQ0FFSCxjQUFNO0FBQ1osVUFBTSxhQUFhLE9BQU8sR0FBRyxNQUFILENBQVUsS0FBakIsRUFBd0IsSUFBeEIsRUFBbkI7QUFDQSxhQUFPLEdBQUcsT0FBSCxLQUFlLGdCQUFmLElBQTRCLFVBQW5DO0FBQ0QsS0FMVSxFQU1WLEdBTlUsQ0FNTjtBQUFBLGFBQU0sT0FBTyxHQUFHLE1BQUgsQ0FBVSxLQUFqQixFQUF3QixJQUF4QixFQUFOO0FBQUEsS0FOTSxDQWJSOztBQXFCTCxnQkFBWSxVQUNULE1BRFMsQ0FDRixhQURFLEVBQ2EsTUFEYixDQUNvQixPQURwQixFQUVULEdBRlMsQ0FFTDtBQUFBLGFBQU0sR0FBRyxNQUFILENBQVUsT0FBaEI7QUFBQSxLQUZLLENBckJQOztBQXlCTCxzQkFBa0IsVUFDZixNQURlLENBQ1Isa0JBRFEsRUFDWSxNQURaLENBQ21CLE9BRG5CLEVBRWYsS0FGZSxDQUVULElBRlM7QUF6QmIsR0FBUDtBQTZCRDs7Ozs7Ozs7Ozs7a0JDdEJ1QixLOztBQVp4Qjs7Ozs7O0FBRUEsU0FBUyxXQUFULENBQXFCLEtBQXJCLEVBQTRCO0FBQzFCLFVBQVEsS0FBUjtBQUNFLFNBQUssU0FBTDtBQUFnQixhQUFRO0FBQUEsZUFBUSxLQUFLLFNBQUwsS0FBbUIsS0FBM0I7QUFBQSxPQUFSO0FBQ2hCLFNBQUssWUFBTDtBQUFtQixhQUFRO0FBQUEsZUFBUSxLQUFLLFNBQUwsS0FBbUIsSUFBM0I7QUFBQSxPQUFSO0FBQ25CO0FBQVMsYUFBTztBQUFBLGVBQU0sSUFBTjtBQUFBLE9BQVAsQ0FIWCxDQUc4QjtBQUg5QjtBQUtEOztBQUVELElBQUksT0FBTyxLQUFLLEdBQUwsRUFBWDs7QUFFZSxTQUFTLEtBQVQsQ0FBZSxPQUFmLEVBQXdCO0FBQ3JDLE1BQU0sa0JBQWtCLGtCQUFHLEVBQUgsQ0FBTSxTQUFTLGNBQVQsQ0FBd0IsU0FBeEIsRUFBbUM7QUFDL0QsUUFBSSxTQUFKLEVBQWU7QUFDYixhQUFPLFNBQVA7QUFDRCxLQUZELE1BRU87QUFDTCxhQUFPO0FBQ0wsb0JBQVksRUFEUDtBQUVMLGNBQU0sRUFGRDtBQUdMLGdCQUFRLEVBSEg7QUFJTCxrQkFBVTtBQUFBLGlCQUFNLElBQU47QUFBQSxTQUpMLENBSWlCO0FBSmpCLE9BQVA7QUFNRDtBQUNGLEdBWHVCLENBQXhCOztBQWFBLE1BQU0sc0JBQXNCLFFBQVEsWUFBUixDQUN6QixTQUR5QixDQUNmLEdBRGUsRUFFekIsR0FGeUIsQ0FFckIsZ0JBQVE7QUFDWCxRQUFNLFdBQVcsWUFBWSxJQUFaLENBQWpCO0FBQ0EsV0FBTyxTQUFTLGtCQUFULENBQTRCLFNBQTVCLEVBQXVDO0FBQzVDLDBCQUNLLFNBREw7QUFFRSxnQkFBUSxLQUFLLE9BQUwsQ0FBYSxHQUFiLEVBQWtCLEVBQWxCLEVBQXNCLElBQXRCLEVBRlY7QUFHRSxrQkFBVTtBQUhaO0FBS0QsS0FORDtBQU9ELEdBWHlCLENBQTVCOztBQWFBLE1BQU0sMkJBQTJCLFFBQVEsaUJBQVIsQ0FDOUIsR0FEOEIsQ0FDMUI7QUFBQSxXQUFjLFNBQVMsZ0JBQVQsQ0FBMEIsU0FBMUIsRUFBcUM7QUFDdEQsMEJBQVcsU0FBWCxJQUFzQixZQUFZLFVBQWxDO0FBQ0QsS0FGSTtBQUFBLEdBRDBCLENBQWpDOztBQUtBLE1BQU0scUJBQXFCLGtCQUFHLEtBQUgsQ0FBUyxRQUFRLFlBQWpCLEVBQStCLFFBQVEsV0FBdkMsRUFDeEIsS0FEd0IsQ0FDbEIsU0FBUyxpQkFBVCxDQUEyQixTQUEzQixFQUFzQztBQUMzQyx3QkFBVyxTQUFYLElBQXNCLFlBQVksRUFBbEM7QUFDRCxHQUh3QixDQUEzQjs7QUFLQSxNQUFNLHFCQUFxQixRQUFRLFdBQVIsQ0FDeEIsR0FEd0IsQ0FDcEI7QUFBQSxXQUFXLFNBQVMsaUJBQVQsQ0FBMkIsU0FBM0IsRUFBc0M7QUFDcEQsVUFBTSxVQUFVO0FBQ2QsYUFBSyxNQURTO0FBRWQsZUFBTyxPQUZPO0FBR2QsbUJBQVcsS0FIRztBQUlkLGlCQUFTO0FBSkssT0FBaEI7QUFNQSwwQkFDSyxTQURMO0FBRUUsY0FBTSxVQUFVLElBQVYsQ0FBZSxNQUFmLENBQXNCLE9BQXRCO0FBRlI7QUFJRCxLQVhJO0FBQUEsR0FEb0IsQ0FBM0I7O0FBY0EsTUFBTSxvQkFBb0IsUUFBUSxVQUFSLENBQ3ZCLEdBRHVCLENBQ25CO0FBQUEsV0FBYSxTQUFTLGdCQUFULENBQTBCLFNBQTFCLEVBQXFDO0FBQ3JELDBCQUNLLFNBREw7QUFFRSxjQUFNLFVBQVUsSUFBVixDQUFlLEdBQWYsQ0FBbUI7QUFBQSw4QkFDbEIsSUFEa0IsSUFDWixXQUFXLFNBREM7QUFBQSxTQUFuQjtBQUZSO0FBTUQsS0FQSTtBQUFBLEdBRG1CLENBQTFCOztBQVVBLE1BQU0sMEJBQTBCLFFBQVEsZ0JBQVIsQ0FDN0IsS0FENkIsQ0FDdkIsU0FBUyx1QkFBVCxDQUFpQyxTQUFqQyxFQUE0QztBQUNqRCx3QkFDSyxTQURMO0FBRUUsWUFBTSxVQUFVLElBQVYsQ0FBZSxNQUFmLENBQXNCO0FBQUEsZUFBUSxLQUFLLFNBQUwsS0FBbUIsS0FBM0I7QUFBQSxPQUF0QjtBQUZSO0FBSUQsR0FONkIsQ0FBaEM7O0FBUUEsU0FBTyxrQkFBRyxLQUFILENBQ0wsZUFESyxFQUVMLHdCQUZLLEVBR0wsbUJBSEssRUFJTCxrQkFKSyxFQUtMLGtCQUxLLEVBTUwsaUJBTkssRUFPTCx1QkFQSyxDQUFQO0FBU0Q7Ozs7Ozs7O0FDMUZNLElBQU0sd0NBQWdCLFNBQWhCLGFBQWdCO0FBQUEsU0FBTztBQUNsQyxjQUFjLEdBRG9CO0FBRWxDLGVBQWMsR0FGb0I7QUFHbEMsa0JBQWM7QUFIb0IsR0FBUDtBQUFBLENBQXRCOztBQU1BLElBQU0sb0NBQWMsU0FBZCxXQUFjLENBQUMsVUFBRDtBQUFBLFNBQWlCO0FBQzFDLGVBQWMsYUFBYSxFQUFiLEdBQWtCLE1BRFU7QUFFMUMsYUFBYyxNQUY0QjtBQUcxQyxlQUFjLFdBSDRCO0FBSTFDLGNBQWMsTUFKNEI7QUFLMUMsa0JBQWMsUUFMNEI7QUFNMUMsa0JBQWMsbUJBTjRCO0FBTzFDLGFBQVM7QUFDUCxrQkFBWTtBQUNWLG1CQUFjLElBREo7QUFFVixvQkFBYyxVQUZKO0FBR1YsaUJBQWMsR0FISjtBQUlWLGtCQUFjLEdBSko7QUFLVixnQkFBYyxHQUxKO0FBTVYsa0JBQWMsTUFOSjtBQU9WLG9CQUFjLFFBUEo7QUFRVjtBQVJVO0FBREw7QUFQaUMsR0FBakI7QUFBQSxDQUFwQjs7Ozs7Ozs7Ozs7a0JDMkRpQixJOztBQWpFeEI7Ozs7QUFDQTs7QUFHQTs7OztBQUVBLFNBQVMsWUFBVCxDQUFzQixLQUF0QixFQUE2QjtBQUMzQixTQUFPLGlCQUFPLFNBQVAsRUFBa0IsQ0FDdkIsYUFBRyxPQUFILENBRHVCLEVBRXZCLGdCQUFNLFdBQU4sRUFBbUI7QUFDakIsV0FBTztBQUNMLFlBQU0sTUFERDtBQUVMLG1CQUFhLHdCQUZSO0FBR0wsaUJBQVcsSUFITjtBQUlMLFlBQU0sU0FKRDtBQUtMLGFBQU8sTUFBTTtBQUxSO0FBRFUsR0FBbkIsQ0FGdUIsQ0FBbEIsQ0FBUDtBQVlEOztBQUVELFNBQVMsaUJBQVQsQ0FBMkIsS0FBM0IsRUFBa0MsUUFBbEMsRUFBNEM7QUFDMUMsTUFBTSxlQUFlLE1BQU0sSUFBTixDQUFXLE1BQVgsQ0FBa0IsVUFBQyxDQUFELEVBQUksQ0FBSjtBQUFBLFdBQVUsS0FBSyxFQUFFLFNBQWpCO0FBQUEsR0FBbEIsRUFBOEMsSUFBOUMsQ0FBckI7QUFDQSxNQUFNLGVBQWUsRUFBQyxXQUFXLE1BQU0sSUFBTixDQUFXLE1BQVgsR0FBb0IsRUFBcEIsR0FBeUIsTUFBckMsRUFBckI7O0FBRUEsU0FBTyxrQkFBUSxPQUFSLEVBQWlCLEVBQUMsT0FBTyxZQUFSLEVBQWpCLEVBQXdDLENBQzdDLGdCQUFNLGFBQU4sRUFBcUI7QUFDbkIsV0FBTyxFQUFDLE1BQU0sVUFBUCxFQUFtQixTQUFTLFlBQTVCO0FBRFksR0FBckIsQ0FENkMsRUFJN0MsUUFKNkMsQ0FBeEMsQ0FBUDtBQU1EOztBQUVELFNBQVMsa0JBQVQsQ0FBNEIsS0FBNUIsRUFBbUMsU0FBbkMsRUFBOEMsSUFBOUMsRUFBb0QsS0FBcEQsRUFBMkQ7QUFDekQsU0FBTyxhQUFHLENBQ1IsWUFBRTtBQUNBLFdBQU8sRUFBQyxNQUFNLElBQVAsRUFEUDtBQUVBLFdBQU8sRUFBQyxVQUFVLE1BQU0sTUFBTixLQUFpQixTQUE1QjtBQUZQLEdBQUYsRUFHRyxLQUhILENBRFEsQ0FBSCxDQUFQO0FBTUQ7O0FBRUQsU0FBUyxZQUFULENBQXNCLEtBQXRCLEVBQTZCO0FBQzNCLE1BQU0sa0JBQWtCLE1BQU0sSUFBTixDQUNyQixNQURxQixDQUNkO0FBQUEsV0FBUSxLQUFLLFNBQWI7QUFBQSxHQURjLEVBRXJCLE1BRkg7QUFHQSxNQUFNLGVBQWUsTUFBTSxJQUFOLENBQVcsTUFBWCxHQUFvQixlQUF6Qzs7QUFFQSxTQUFPLGlCQUFPLFNBQVAsRUFBa0IsRUFBQyxLQUFLLHlCQUFZLE1BQU0sSUFBTixDQUFXLE1BQXZCLENBQU4sRUFBbEIsRUFBeUQsQ0FDOUQsZUFBSyxhQUFMLEVBQW9CLENBQ2xCLGlCQUFPLE9BQU8sWUFBUCxDQUFQLENBRGtCLEVBRWxCLFdBQVcsaUJBQWlCLENBQWpCLEdBQXFCLEdBQXJCLEdBQTJCLEVBQXRDLElBQTRDLE9BRjFCLENBQXBCLENBRDhELEVBSzlELGFBQUcsVUFBSCxFQUFlLENBQ2IsbUJBQW1CLEtBQW5CLEVBQTBCLEVBQTFCLEVBQThCLEdBQTlCLEVBQW1DLEtBQW5DLENBRGEsRUFFYixtQkFBbUIsS0FBbkIsRUFBMEIsUUFBMUIsRUFBb0MsU0FBcEMsRUFBK0MsUUFBL0MsQ0FGYSxFQUdiLG1CQUFtQixLQUFuQixFQUEwQixXQUExQixFQUF1QyxZQUF2QyxFQUFxRCxXQUFyRCxDQUhhLENBQWYsQ0FMOEQsRUFVN0Qsa0JBQWtCLENBQWxCLEdBQ0MsaUJBQU8sa0JBQVAsRUFBMkIsc0JBQXNCLGVBQXRCLEdBQXdDLEdBQW5FLENBREQsR0FFRyxJQVowRCxDQUF6RCxDQUFQO0FBZUQ7O0FBRWMsU0FBUyxJQUFULENBQWMsTUFBZCxFQUFzQixTQUF0QixFQUFpQztBQUM5QyxTQUFPLGtCQUFHLE9BQUgsQ0FBVyxNQUFYLEVBQW1CLFNBQW5CLEVBQThCLEdBQTlCLENBQWtDO0FBQUE7QUFBQSxRQUFFLEtBQUY7QUFBQSxRQUFTLFFBQVQ7O0FBQUEsV0FDdkMsY0FBSSxDQUNGLGFBQWEsS0FBYixDQURFLEVBRUYsa0JBQWtCLEtBQWxCLEVBQXlCLFFBQXpCLENBRkUsRUFHRixhQUFhLEtBQWIsQ0FIRSxDQUFKLENBRHVDO0FBQUEsR0FBbEMsQ0FBUDtBQU9EOzs7Ozs7OztBQ3pFRCxJQUFNLFlBQVksRUFBbEI7QUFDQSxJQUFNLFVBQVUsRUFBaEI7O1FBRVEsUyxHQUFBLFM7UUFBVyxPLEdBQUEsTyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHhzdHJlYW1fMSA9IHJlcXVpcmUoXCJ4c3RyZWFtXCIpO1xudmFyIGFkYXB0XzEgPSByZXF1aXJlKFwiQGN5Y2xlL3J1bi9saWIvYWRhcHRcIik7XG52YXIgZnJvbUV2ZW50XzEgPSByZXF1aXJlKFwiLi9mcm9tRXZlbnRcIik7XG52YXIgQm9keURPTVNvdXJjZSA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gQm9keURPTVNvdXJjZShfbmFtZSkge1xuICAgICAgICB0aGlzLl9uYW1lID0gX25hbWU7XG4gICAgfVxuICAgIEJvZHlET01Tb3VyY2UucHJvdG90eXBlLnNlbGVjdCA9IGZ1bmN0aW9uIChzZWxlY3Rvcikge1xuICAgICAgICAvLyBUaGlzIGZ1bmN0aW9uYWxpdHkgaXMgc3RpbGwgdW5kZWZpbmVkL3VuZGVjaWRlZC5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBCb2R5RE9NU291cmNlLnByb3RvdHlwZS5lbGVtZW50cyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG91dCA9IGFkYXB0XzEuYWRhcHQoeHN0cmVhbV8xLmRlZmF1bHQub2YoZG9jdW1lbnQuYm9keSkpO1xuICAgICAgICBvdXQuX2lzQ3ljbGVTb3VyY2UgPSB0aGlzLl9uYW1lO1xuICAgICAgICByZXR1cm4gb3V0O1xuICAgIH07XG4gICAgQm9keURPTVNvdXJjZS5wcm90b3R5cGUuZXZlbnRzID0gZnVuY3Rpb24gKGV2ZW50VHlwZSwgb3B0aW9ucykge1xuICAgICAgICBpZiAob3B0aW9ucyA9PT0gdm9pZCAwKSB7IG9wdGlvbnMgPSB7fTsgfVxuICAgICAgICB2YXIgc3RyZWFtO1xuICAgICAgICBzdHJlYW0gPSBmcm9tRXZlbnRfMS5mcm9tRXZlbnQoZG9jdW1lbnQuYm9keSwgZXZlbnRUeXBlLCBvcHRpb25zLnVzZUNhcHR1cmUsIG9wdGlvbnMucHJldmVudERlZmF1bHQpO1xuICAgICAgICB2YXIgb3V0ID0gYWRhcHRfMS5hZGFwdChzdHJlYW0pO1xuICAgICAgICBvdXQuX2lzQ3ljbGVTb3VyY2UgPSB0aGlzLl9uYW1lO1xuICAgICAgICByZXR1cm4gb3V0O1xuICAgIH07XG4gICAgcmV0dXJuIEJvZHlET01Tb3VyY2U7XG59KCkpO1xuZXhwb3J0cy5Cb2R5RE9NU291cmNlID0gQm9keURPTVNvdXJjZTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPUJvZHlET01Tb3VyY2UuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgeHN0cmVhbV8xID0gcmVxdWlyZShcInhzdHJlYW1cIik7XG52YXIgYWRhcHRfMSA9IHJlcXVpcmUoXCJAY3ljbGUvcnVuL2xpYi9hZGFwdFwiKTtcbnZhciBmcm9tRXZlbnRfMSA9IHJlcXVpcmUoXCIuL2Zyb21FdmVudFwiKTtcbnZhciBEb2N1bWVudERPTVNvdXJjZSA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gRG9jdW1lbnRET01Tb3VyY2UoX25hbWUpIHtcbiAgICAgICAgdGhpcy5fbmFtZSA9IF9uYW1lO1xuICAgIH1cbiAgICBEb2N1bWVudERPTVNvdXJjZS5wcm90b3R5cGUuc2VsZWN0ID0gZnVuY3Rpb24gKHNlbGVjdG9yKSB7XG4gICAgICAgIC8vIFRoaXMgZnVuY3Rpb25hbGl0eSBpcyBzdGlsbCB1bmRlZmluZWQvdW5kZWNpZGVkLlxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIERvY3VtZW50RE9NU291cmNlLnByb3RvdHlwZS5lbGVtZW50cyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG91dCA9IGFkYXB0XzEuYWRhcHQoeHN0cmVhbV8xLmRlZmF1bHQub2YoZG9jdW1lbnQpKTtcbiAgICAgICAgb3V0Ll9pc0N5Y2xlU291cmNlID0gdGhpcy5fbmFtZTtcbiAgICAgICAgcmV0dXJuIG91dDtcbiAgICB9O1xuICAgIERvY3VtZW50RE9NU291cmNlLnByb3RvdHlwZS5ldmVudHMgPSBmdW5jdGlvbiAoZXZlbnRUeXBlLCBvcHRpb25zKSB7XG4gICAgICAgIGlmIChvcHRpb25zID09PSB2b2lkIDApIHsgb3B0aW9ucyA9IHt9OyB9XG4gICAgICAgIHZhciBzdHJlYW07XG4gICAgICAgIHN0cmVhbSA9IGZyb21FdmVudF8xLmZyb21FdmVudChkb2N1bWVudCwgZXZlbnRUeXBlLCBvcHRpb25zLnVzZUNhcHR1cmUsIG9wdGlvbnMucHJldmVudERlZmF1bHQpO1xuICAgICAgICB2YXIgb3V0ID0gYWRhcHRfMS5hZGFwdChzdHJlYW0pO1xuICAgICAgICBvdXQuX2lzQ3ljbGVTb3VyY2UgPSB0aGlzLl9uYW1lO1xuICAgICAgICByZXR1cm4gb3V0O1xuICAgIH07XG4gICAgcmV0dXJuIERvY3VtZW50RE9NU291cmNlO1xufSgpKTtcbmV4cG9ydHMuRG9jdW1lbnRET01Tb3VyY2UgPSBEb2N1bWVudERPTVNvdXJjZTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPURvY3VtZW50RE9NU291cmNlLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIFNjb3BlQ2hlY2tlcl8xID0gcmVxdWlyZShcIi4vU2NvcGVDaGVja2VyXCIpO1xudmFyIHV0aWxzXzEgPSByZXF1aXJlKFwiLi91dGlsc1wiKTtcbnZhciBtYXRjaGVzU2VsZWN0b3JfMSA9IHJlcXVpcmUoXCIuL21hdGNoZXNTZWxlY3RvclwiKTtcbmZ1bmN0aW9uIHRvRWxBcnJheShpbnB1dCkge1xuICAgIHJldHVybiBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChpbnB1dCk7XG59XG52YXIgRWxlbWVudEZpbmRlciA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gRWxlbWVudEZpbmRlcihuYW1lc3BhY2UsIGlzb2xhdGVNb2R1bGUpIHtcbiAgICAgICAgdGhpcy5uYW1lc3BhY2UgPSBuYW1lc3BhY2U7XG4gICAgICAgIHRoaXMuaXNvbGF0ZU1vZHVsZSA9IGlzb2xhdGVNb2R1bGU7XG4gICAgfVxuICAgIEVsZW1lbnRGaW5kZXIucHJvdG90eXBlLmNhbGwgPSBmdW5jdGlvbiAocm9vdEVsZW1lbnQpIHtcbiAgICAgICAgdmFyIG5hbWVzcGFjZSA9IHRoaXMubmFtZXNwYWNlO1xuICAgICAgICB2YXIgc2VsZWN0b3IgPSB1dGlsc18xLmdldFNlbGVjdG9ycyhuYW1lc3BhY2UpO1xuICAgICAgICBpZiAoIXNlbGVjdG9yKSB7XG4gICAgICAgICAgICByZXR1cm4gcm9vdEVsZW1lbnQ7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGZ1bGxTY29wZSA9IHV0aWxzXzEuZ2V0RnVsbFNjb3BlKG5hbWVzcGFjZSk7XG4gICAgICAgIHZhciBzY29wZUNoZWNrZXIgPSBuZXcgU2NvcGVDaGVja2VyXzEuU2NvcGVDaGVja2VyKGZ1bGxTY29wZSwgdGhpcy5pc29sYXRlTW9kdWxlKTtcbiAgICAgICAgdmFyIHRvcE5vZGUgPSBmdWxsU2NvcGVcbiAgICAgICAgICAgID8gdGhpcy5pc29sYXRlTW9kdWxlLmdldEVsZW1lbnQoZnVsbFNjb3BlKSB8fCByb290RWxlbWVudFxuICAgICAgICAgICAgOiByb290RWxlbWVudDtcbiAgICAgICAgdmFyIHRvcE5vZGVNYXRjaGVzU2VsZWN0b3IgPSAhIWZ1bGxTY29wZSAmJiAhIXNlbGVjdG9yICYmIG1hdGNoZXNTZWxlY3Rvcl8xLm1hdGNoZXNTZWxlY3Rvcih0b3BOb2RlLCBzZWxlY3Rvcik7XG4gICAgICAgIHJldHVybiB0b0VsQXJyYXkodG9wTm9kZS5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKSlcbiAgICAgICAgICAgIC5maWx0ZXIoc2NvcGVDaGVja2VyLmlzRGlyZWN0bHlJblNjb3BlLCBzY29wZUNoZWNrZXIpXG4gICAgICAgICAgICAuY29uY2F0KHRvcE5vZGVNYXRjaGVzU2VsZWN0b3IgPyBbdG9wTm9kZV0gOiBbXSk7XG4gICAgfTtcbiAgICByZXR1cm4gRWxlbWVudEZpbmRlcjtcbn0oKSk7XG5leHBvcnRzLkVsZW1lbnRGaW5kZXIgPSBFbGVtZW50RmluZGVyO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9RWxlbWVudEZpbmRlci5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB4c3RyZWFtXzEgPSByZXF1aXJlKFwieHN0cmVhbVwiKTtcbnZhciBTY29wZUNoZWNrZXJfMSA9IHJlcXVpcmUoXCIuL1Njb3BlQ2hlY2tlclwiKTtcbnZhciB1dGlsc18xID0gcmVxdWlyZShcIi4vdXRpbHNcIik7XG52YXIgbWF0Y2hlc1NlbGVjdG9yXzEgPSByZXF1aXJlKFwiLi9tYXRjaGVzU2VsZWN0b3JcIik7XG4vKipcbiAqIEZpbmRzICh3aXRoIGJpbmFyeSBzZWFyY2gpIGluZGV4IG9mIHRoZSBkZXN0aW5hdGlvbiB0aGF0IGlkIGVxdWFsIHRvIHNlYXJjaElkXG4gKiBhbW9uZyB0aGUgZGVzdGluYXRpb25zIGluIHRoZSBnaXZlbiBhcnJheS5cbiAqL1xuZnVuY3Rpb24gaW5kZXhPZihhcnIsIHNlYXJjaElkKSB7XG4gICAgdmFyIG1pbkluZGV4ID0gMDtcbiAgICB2YXIgbWF4SW5kZXggPSBhcnIubGVuZ3RoIC0gMTtcbiAgICB2YXIgY3VycmVudEluZGV4O1xuICAgIHZhciBjdXJyZW50O1xuICAgIHdoaWxlIChtaW5JbmRleCA8PSBtYXhJbmRleCkge1xuICAgICAgICBjdXJyZW50SW5kZXggPSAoKG1pbkluZGV4ICsgbWF4SW5kZXgpIC8gMikgfCAwOyAvLyB0c2xpbnQ6ZGlzYWJsZS1saW5lOm5vLWJpdHdpc2VcbiAgICAgICAgY3VycmVudCA9IGFycltjdXJyZW50SW5kZXhdO1xuICAgICAgICB2YXIgY3VycmVudElkID0gY3VycmVudC5pZDtcbiAgICAgICAgaWYgKGN1cnJlbnRJZCA8IHNlYXJjaElkKSB7XG4gICAgICAgICAgICBtaW5JbmRleCA9IGN1cnJlbnRJbmRleCArIDE7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoY3VycmVudElkID4gc2VhcmNoSWQpIHtcbiAgICAgICAgICAgIG1heEluZGV4ID0gY3VycmVudEluZGV4IC0gMTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBjdXJyZW50SW5kZXg7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIC0xO1xufVxuLyoqXG4gKiBNYW5hZ2VzIFwiRXZlbnQgZGVsZWdhdGlvblwiLCBieSBjb25uZWN0aW5nIGFuIG9yaWdpbiB3aXRoIG11bHRpcGxlXG4gKiBkZXN0aW5hdGlvbnMuXG4gKlxuICogQXR0YWNoZXMgYSBET00gZXZlbnQgbGlzdGVuZXIgdG8gdGhlIERPTSBlbGVtZW50IGNhbGxlZCB0aGUgXCJvcmlnaW5cIixcbiAqIGFuZCBkZWxlZ2F0ZXMgZXZlbnRzIHRvIFwiZGVzdGluYXRpb25zXCIsIHdoaWNoIGFyZSBzdWJqZWN0cyBhcyBvdXRwdXRzXG4gKiBmb3IgdGhlIERPTVNvdXJjZS4gU2ltdWxhdGVzIGJ1YmJsaW5nIG9yIGNhcHR1cmluZywgd2l0aCByZWdhcmRzIHRvXG4gKiBpc29sYXRpb24gYm91bmRhcmllcyB0b28uXG4gKi9cbnZhciBFdmVudERlbGVnYXRvciA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gRXZlbnREZWxlZ2F0b3Iob3JpZ2luLCBldmVudFR5cGUsIHVzZUNhcHR1cmUsIGlzb2xhdGVNb2R1bGUsIHByZXZlbnREZWZhdWx0KSB7XG4gICAgICAgIGlmIChwcmV2ZW50RGVmYXVsdCA9PT0gdm9pZCAwKSB7IHByZXZlbnREZWZhdWx0ID0gZmFsc2U7IH1cbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdGhpcy5vcmlnaW4gPSBvcmlnaW47XG4gICAgICAgIHRoaXMuZXZlbnRUeXBlID0gZXZlbnRUeXBlO1xuICAgICAgICB0aGlzLnVzZUNhcHR1cmUgPSB1c2VDYXB0dXJlO1xuICAgICAgICB0aGlzLmlzb2xhdGVNb2R1bGUgPSBpc29sYXRlTW9kdWxlO1xuICAgICAgICB0aGlzLnByZXZlbnREZWZhdWx0ID0gcHJldmVudERlZmF1bHQ7XG4gICAgICAgIHRoaXMuZGVzdGluYXRpb25zID0gW107XG4gICAgICAgIHRoaXMuX2xhc3RJZCA9IDA7XG4gICAgICAgIGlmIChwcmV2ZW50RGVmYXVsdCkge1xuICAgICAgICAgICAgaWYgKHVzZUNhcHR1cmUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmxpc3RlbmVyID0gZnVuY3Rpb24gKGV2KSB7XG4gICAgICAgICAgICAgICAgICAgIGV2LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzLmNhcHR1cmUoZXYpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLmxpc3RlbmVyID0gZnVuY3Rpb24gKGV2KSB7XG4gICAgICAgICAgICAgICAgICAgIGV2LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzLmJ1YmJsZShldik7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGlmICh1c2VDYXB0dXJlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5saXN0ZW5lciA9IGZ1bmN0aW9uIChldikgeyByZXR1cm4gX3RoaXMuY2FwdHVyZShldik7IH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLmxpc3RlbmVyID0gZnVuY3Rpb24gKGV2KSB7IHJldHVybiBfdGhpcy5idWJibGUoZXYpOyB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIG9yaWdpbi5hZGRFdmVudExpc3RlbmVyKGV2ZW50VHlwZSwgdGhpcy5saXN0ZW5lciwgdXNlQ2FwdHVyZSk7XG4gICAgfVxuICAgIEV2ZW50RGVsZWdhdG9yLnByb3RvdHlwZS51cGRhdGVPcmlnaW4gPSBmdW5jdGlvbiAobmV3T3JpZ2luKSB7XG4gICAgICAgIHRoaXMub3JpZ2luLnJlbW92ZUV2ZW50TGlzdGVuZXIodGhpcy5ldmVudFR5cGUsIHRoaXMubGlzdGVuZXIsIHRoaXMudXNlQ2FwdHVyZSk7XG4gICAgICAgIG5ld09yaWdpbi5hZGRFdmVudExpc3RlbmVyKHRoaXMuZXZlbnRUeXBlLCB0aGlzLmxpc3RlbmVyLCB0aGlzLnVzZUNhcHR1cmUpO1xuICAgICAgICB0aGlzLm9yaWdpbiA9IG5ld09yaWdpbjtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSAqbmV3KiBkZXN0aW5hdGlvbiBnaXZlbiB0aGUgbmFtZXNwYWNlIGFuZCByZXR1cm5zIHRoZSBzdWJqZWN0XG4gICAgICogcmVwcmVzZW50aW5nIHRoZSBkZXN0aW5hdGlvbiBvZiBldmVudHMuIElzIG5vdCByZWZlcmVudGlhbGx5IHRyYW5zcGFyZW50LFxuICAgICAqIHdpbGwgYWx3YXlzIHJldHVybiBhIGRpZmZlcmVudCBvdXRwdXQgZm9yIHRoZSBzYW1lIGlucHV0LlxuICAgICAqL1xuICAgIEV2ZW50RGVsZWdhdG9yLnByb3RvdHlwZS5jcmVhdGVEZXN0aW5hdGlvbiA9IGZ1bmN0aW9uIChuYW1lc3BhY2UpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdmFyIGlkID0gdGhpcy5fbGFzdElkKys7XG4gICAgICAgIHZhciBzZWxlY3RvciA9IHV0aWxzXzEuZ2V0U2VsZWN0b3JzKG5hbWVzcGFjZSk7XG4gICAgICAgIHZhciBzY29wZUNoZWNrZXIgPSBuZXcgU2NvcGVDaGVja2VyXzEuU2NvcGVDaGVja2VyKHV0aWxzXzEuZ2V0RnVsbFNjb3BlKG5hbWVzcGFjZSksIHRoaXMuaXNvbGF0ZU1vZHVsZSk7XG4gICAgICAgIHZhciBzdWJqZWN0ID0geHN0cmVhbV8xLmRlZmF1bHQuY3JlYXRlKHtcbiAgICAgICAgICAgIHN0YXJ0OiBmdW5jdGlvbiAoKSB7IH0sXG4gICAgICAgICAgICBzdG9wOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKCdyZXF1ZXN0SWRsZUNhbGxiYWNrJyBpbiB3aW5kb3cpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVxdWVzdElkbGVDYWxsYmFjayhmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy5yZW1vdmVEZXN0aW5hdGlvbihpZCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMucmVtb3ZlRGVzdGluYXRpb24oaWQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0pO1xuICAgICAgICB2YXIgZGVzdGluYXRpb24gPSB7IGlkOiBpZCwgc2VsZWN0b3I6IHNlbGVjdG9yLCBzY29wZUNoZWNrZXI6IHNjb3BlQ2hlY2tlciwgc3ViamVjdDogc3ViamVjdCB9O1xuICAgICAgICB0aGlzLmRlc3RpbmF0aW9ucy5wdXNoKGRlc3RpbmF0aW9uKTtcbiAgICAgICAgcmV0dXJuIHN1YmplY3Q7XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBSZW1vdmVzIHRoZSBkZXN0aW5hdGlvbiB0aGF0IGhhcyB0aGUgZ2l2ZW4gaWQuXG4gICAgICovXG4gICAgRXZlbnREZWxlZ2F0b3IucHJvdG90eXBlLnJlbW92ZURlc3RpbmF0aW9uID0gZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgIHZhciBpID0gaW5kZXhPZih0aGlzLmRlc3RpbmF0aW9ucywgaWQpO1xuICAgICAgICBpID49IDAgJiYgdGhpcy5kZXN0aW5hdGlvbnMuc3BsaWNlKGksIDEpOyAvLyB0c2xpbnQ6ZGlzYWJsZS1saW5lOm5vLXVudXNlZC1leHByZXNzaW9uXG4gICAgfTtcbiAgICBFdmVudERlbGVnYXRvci5wcm90b3R5cGUuY2FwdHVyZSA9IGZ1bmN0aW9uIChldikge1xuICAgICAgICB2YXIgbiA9IHRoaXMuZGVzdGluYXRpb25zLmxlbmd0aDtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBkZXN0ID0gdGhpcy5kZXN0aW5hdGlvbnNbaV07XG4gICAgICAgICAgICBpZiAobWF0Y2hlc1NlbGVjdG9yXzEubWF0Y2hlc1NlbGVjdG9yKGV2LnRhcmdldCwgZGVzdC5zZWxlY3RvcikpIHtcbiAgICAgICAgICAgICAgICBkZXN0LnN1YmplY3QuX24oZXYpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbiAgICBFdmVudERlbGVnYXRvci5wcm90b3R5cGUuYnViYmxlID0gZnVuY3Rpb24gKHJhd0V2ZW50KSB7XG4gICAgICAgIHZhciBvcmlnaW4gPSB0aGlzLm9yaWdpbjtcbiAgICAgICAgaWYgKCFvcmlnaW4uY29udGFpbnMocmF3RXZlbnQuY3VycmVudFRhcmdldCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcm9vZiA9IG9yaWdpbi5wYXJlbnRFbGVtZW50O1xuICAgICAgICB2YXIgZXYgPSB0aGlzLnBhdGNoRXZlbnQocmF3RXZlbnQpO1xuICAgICAgICBmb3IgKHZhciBlbCA9IGV2LnRhcmdldDsgZWwgJiYgZWwgIT09IHJvb2Y7IGVsID0gZWwucGFyZW50RWxlbWVudCkge1xuICAgICAgICAgICAgaWYgKCFvcmlnaW4uY29udGFpbnMoZWwpKSB7XG4gICAgICAgICAgICAgICAgZXYuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZXYucHJvcGFnYXRpb25IYXNCZWVuU3RvcHBlZCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMubWF0Y2hFdmVudEFnYWluc3REZXN0aW5hdGlvbnMoZWwsIGV2KTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgRXZlbnREZWxlZ2F0b3IucHJvdG90eXBlLnBhdGNoRXZlbnQgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgdmFyIHBFdmVudCA9IGV2ZW50O1xuICAgICAgICBwRXZlbnQucHJvcGFnYXRpb25IYXNCZWVuU3RvcHBlZCA9IGZhbHNlO1xuICAgICAgICB2YXIgb2xkU3RvcFByb3BhZ2F0aW9uID0gcEV2ZW50LnN0b3BQcm9wYWdhdGlvbjtcbiAgICAgICAgcEV2ZW50LnN0b3BQcm9wYWdhdGlvbiA9IGZ1bmN0aW9uIHN0b3BQcm9wYWdhdGlvbigpIHtcbiAgICAgICAgICAgIG9sZFN0b3BQcm9wYWdhdGlvbi5jYWxsKHRoaXMpO1xuICAgICAgICAgICAgdGhpcy5wcm9wYWdhdGlvbkhhc0JlZW5TdG9wcGVkID0gdHJ1ZTtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHBFdmVudDtcbiAgICB9O1xuICAgIEV2ZW50RGVsZWdhdG9yLnByb3RvdHlwZS5tYXRjaEV2ZW50QWdhaW5zdERlc3RpbmF0aW9ucyA9IGZ1bmN0aW9uIChlbCwgZXYpIHtcbiAgICAgICAgdmFyIG4gPSB0aGlzLmRlc3RpbmF0aW9ucy5sZW5ndGg7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbjsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgZGVzdCA9IHRoaXMuZGVzdGluYXRpb25zW2ldO1xuICAgICAgICAgICAgaWYgKCFkZXN0LnNjb3BlQ2hlY2tlci5pc0RpcmVjdGx5SW5TY29wZShlbCkpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChtYXRjaGVzU2VsZWN0b3JfMS5tYXRjaGVzU2VsZWN0b3IoZWwsIGRlc3Quc2VsZWN0b3IpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5tdXRhdGVFdmVudEN1cnJlbnRUYXJnZXQoZXYsIGVsKTtcbiAgICAgICAgICAgICAgICBkZXN0LnN1YmplY3QuX24oZXYpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbiAgICBFdmVudERlbGVnYXRvci5wcm90b3R5cGUubXV0YXRlRXZlbnRDdXJyZW50VGFyZ2V0ID0gZnVuY3Rpb24gKGV2ZW50LCBjdXJyZW50VGFyZ2V0RWxlbWVudCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGV2ZW50LCBcImN1cnJlbnRUYXJnZXRcIiwge1xuICAgICAgICAgICAgICAgIHZhbHVlOiBjdXJyZW50VGFyZ2V0RWxlbWVudCxcbiAgICAgICAgICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcInBsZWFzZSB1c2UgZXZlbnQub3duZXJUYXJnZXRcIik7XG4gICAgICAgIH1cbiAgICAgICAgZXZlbnQub3duZXJUYXJnZXQgPSBjdXJyZW50VGFyZ2V0RWxlbWVudDtcbiAgICB9O1xuICAgIHJldHVybiBFdmVudERlbGVnYXRvcjtcbn0oKSk7XG5leHBvcnRzLkV2ZW50RGVsZWdhdG9yID0gRXZlbnREZWxlZ2F0b3I7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1FdmVudERlbGVnYXRvci5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBNYXBQb2x5ZmlsbCA9IHJlcXVpcmUoXCJlczYtbWFwXCIpO1xudmFyIElzb2xhdGVNb2R1bGUgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIElzb2xhdGVNb2R1bGUoKSB7XG4gICAgICAgIHRoaXMuZWxlbWVudHNCeUZ1bGxTY29wZSA9IG5ldyBNYXBQb2x5ZmlsbCgpO1xuICAgICAgICB0aGlzLmRlbGVnYXRvcnNCeUZ1bGxTY29wZSA9IG5ldyBNYXBQb2x5ZmlsbCgpO1xuICAgICAgICB0aGlzLmZ1bGxTY29wZXNCZWluZ1VwZGF0ZWQgPSBbXTtcbiAgICAgICAgdGhpcy52bm9kZXNCZWluZ1JlbW92ZWQgPSBbXTtcbiAgICB9XG4gICAgSXNvbGF0ZU1vZHVsZS5wcm90b3R5cGUuY2xlYW51cFZOb2RlID0gZnVuY3Rpb24gKF9hKSB7XG4gICAgICAgIHZhciBkYXRhID0gX2EuZGF0YSwgZWxtID0gX2EuZWxtO1xuICAgICAgICB2YXIgZnVsbFNjb3BlID0gKGRhdGEgfHwge30pLmlzb2xhdGUgfHwgJyc7XG4gICAgICAgIHZhciBpc0N1cnJlbnRFbG0gPSB0aGlzLmVsZW1lbnRzQnlGdWxsU2NvcGUuZ2V0KGZ1bGxTY29wZSkgPT09IGVsbTtcbiAgICAgICAgdmFyIGlzU2NvcGVCZWluZ1VwZGF0ZWQgPSB0aGlzLmZ1bGxTY29wZXNCZWluZ1VwZGF0ZWQuaW5kZXhPZihmdWxsU2NvcGUpID49IDA7XG4gICAgICAgIGlmIChmdWxsU2NvcGUgJiYgaXNDdXJyZW50RWxtICYmICFpc1Njb3BlQmVpbmdVcGRhdGVkKSB7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnRzQnlGdWxsU2NvcGUuZGVsZXRlKGZ1bGxTY29wZSk7XG4gICAgICAgICAgICB0aGlzLmRlbGVnYXRvcnNCeUZ1bGxTY29wZS5kZWxldGUoZnVsbFNjb3BlKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgSXNvbGF0ZU1vZHVsZS5wcm90b3R5cGUuZ2V0RWxlbWVudCA9IGZ1bmN0aW9uIChmdWxsU2NvcGUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudHNCeUZ1bGxTY29wZS5nZXQoZnVsbFNjb3BlKTtcbiAgICB9O1xuICAgIElzb2xhdGVNb2R1bGUucHJvdG90eXBlLmdldEZ1bGxTY29wZSA9IGZ1bmN0aW9uIChlbG0pIHtcbiAgICAgICAgdmFyIGl0ZXJhdG9yID0gdGhpcy5lbGVtZW50c0J5RnVsbFNjb3BlLmVudHJpZXMoKTtcbiAgICAgICAgZm9yICh2YXIgcmVzdWx0ID0gaXRlcmF0b3IubmV4dCgpOyAhIXJlc3VsdC52YWx1ZTsgcmVzdWx0ID0gaXRlcmF0b3IubmV4dCgpKSB7XG4gICAgICAgICAgICB2YXIgX2EgPSByZXN1bHQudmFsdWUsIGZ1bGxTY29wZSA9IF9hWzBdLCBlbGVtZW50ID0gX2FbMV07XG4gICAgICAgICAgICBpZiAoZWxtID09PSBlbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZ1bGxTY29wZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gJyc7XG4gICAgfTtcbiAgICBJc29sYXRlTW9kdWxlLnByb3RvdHlwZS5hZGRFdmVudERlbGVnYXRvciA9IGZ1bmN0aW9uIChmdWxsU2NvcGUsIGV2ZW50RGVsZWdhdG9yKSB7XG4gICAgICAgIHZhciBkZWxlZ2F0b3JzID0gdGhpcy5kZWxlZ2F0b3JzQnlGdWxsU2NvcGUuZ2V0KGZ1bGxTY29wZSk7XG4gICAgICAgIGlmICghZGVsZWdhdG9ycykge1xuICAgICAgICAgICAgZGVsZWdhdG9ycyA9IFtdO1xuICAgICAgICAgICAgdGhpcy5kZWxlZ2F0b3JzQnlGdWxsU2NvcGUuc2V0KGZ1bGxTY29wZSwgZGVsZWdhdG9ycyk7XG4gICAgICAgIH1cbiAgICAgICAgZGVsZWdhdG9yc1tkZWxlZ2F0b3JzLmxlbmd0aF0gPSBldmVudERlbGVnYXRvcjtcbiAgICB9O1xuICAgIElzb2xhdGVNb2R1bGUucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmVsZW1lbnRzQnlGdWxsU2NvcGUuY2xlYXIoKTtcbiAgICAgICAgdGhpcy5kZWxlZ2F0b3JzQnlGdWxsU2NvcGUuY2xlYXIoKTtcbiAgICAgICAgdGhpcy5mdWxsU2NvcGVzQmVpbmdVcGRhdGVkID0gW107XG4gICAgfTtcbiAgICBJc29sYXRlTW9kdWxlLnByb3RvdHlwZS5jcmVhdGVNb2R1bGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGNyZWF0ZTogZnVuY3Rpb24gKG9sZFZOb2RlLCB2Tm9kZSkge1xuICAgICAgICAgICAgICAgIHZhciBfYSA9IG9sZFZOb2RlLmRhdGEsIG9sZERhdGEgPSBfYSA9PT0gdm9pZCAwID8ge30gOiBfYTtcbiAgICAgICAgICAgICAgICB2YXIgZWxtID0gdk5vZGUuZWxtLCBfYiA9IHZOb2RlLmRhdGEsIGRhdGEgPSBfYiA9PT0gdm9pZCAwID8ge30gOiBfYjtcbiAgICAgICAgICAgICAgICB2YXIgb2xkRnVsbFNjb3BlID0gb2xkRGF0YS5pc29sYXRlIHx8ICcnO1xuICAgICAgICAgICAgICAgIHZhciBmdWxsU2NvcGUgPSBkYXRhLmlzb2xhdGUgfHwgJyc7XG4gICAgICAgICAgICAgICAgLy8gVXBkYXRlIGRhdGEgc3RydWN0dXJlcyB3aXRoIHRoZSBuZXdseS1jcmVhdGVkIGVsZW1lbnRcbiAgICAgICAgICAgICAgICBpZiAoZnVsbFNjb3BlKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuZnVsbFNjb3Blc0JlaW5nVXBkYXRlZC5wdXNoKGZ1bGxTY29wZSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChvbGRGdWxsU2NvcGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuZWxlbWVudHNCeUZ1bGxTY29wZS5kZWxldGUob2xkRnVsbFNjb3BlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnRzQnlGdWxsU2NvcGUuc2V0KGZ1bGxTY29wZSwgZWxtKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gVXBkYXRlIGRlbGVnYXRvcnMgZm9yIHRoaXMgc2NvcGVcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRlbGVnYXRvcnMgPSBzZWxmLmRlbGVnYXRvcnNCeUZ1bGxTY29wZS5nZXQoZnVsbFNjb3BlKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRlbGVnYXRvcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBsZW4gPSBkZWxlZ2F0b3JzLmxlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxlZ2F0b3JzW2ldLnVwZGF0ZU9yaWdpbihlbG0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChvbGRGdWxsU2NvcGUgJiYgIWZ1bGxTY29wZSkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnRzQnlGdWxsU2NvcGUuZGVsZXRlKGZ1bGxTY29wZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHVwZGF0ZTogZnVuY3Rpb24gKG9sZFZOb2RlLCB2Tm9kZSkge1xuICAgICAgICAgICAgICAgIHZhciBfYSA9IG9sZFZOb2RlLmRhdGEsIG9sZERhdGEgPSBfYSA9PT0gdm9pZCAwID8ge30gOiBfYTtcbiAgICAgICAgICAgICAgICB2YXIgZWxtID0gdk5vZGUuZWxtLCBfYiA9IHZOb2RlLmRhdGEsIGRhdGEgPSBfYiA9PT0gdm9pZCAwID8ge30gOiBfYjtcbiAgICAgICAgICAgICAgICB2YXIgb2xkRnVsbFNjb3BlID0gb2xkRGF0YS5pc29sYXRlIHx8ICcnO1xuICAgICAgICAgICAgICAgIHZhciBmdWxsU2NvcGUgPSBkYXRhLmlzb2xhdGUgfHwgJyc7XG4gICAgICAgICAgICAgICAgLy8gU2FtZSBlbGVtZW50LCBidXQgZGlmZmVyZW50IHNjb3BlLCBzbyB1cGRhdGUgdGhlIGRhdGEgc3RydWN0dXJlc1xuICAgICAgICAgICAgICAgIGlmIChmdWxsU2NvcGUgJiYgZnVsbFNjb3BlICE9PSBvbGRGdWxsU2NvcGUpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9sZEZ1bGxTY29wZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50c0J5RnVsbFNjb3BlLmRlbGV0ZShvbGRGdWxsU2NvcGUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuZWxlbWVudHNCeUZ1bGxTY29wZS5zZXQoZnVsbFNjb3BlLCBlbG0pO1xuICAgICAgICAgICAgICAgICAgICB2YXIgZGVsZWdhdG9ycyA9IHNlbGYuZGVsZWdhdG9yc0J5RnVsbFNjb3BlLmdldChvbGRGdWxsU2NvcGUpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZGVsZWdhdG9ycykge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5kZWxlZ2F0b3JzQnlGdWxsU2NvcGUuZGVsZXRlKG9sZEZ1bGxTY29wZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmRlbGVnYXRvcnNCeUZ1bGxTY29wZS5zZXQoZnVsbFNjb3BlLCBkZWxlZ2F0b3JzKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBTYW1lIGVsZW1lbnQsIGJ1dCBsb3N0IHRoZSBzY29wZSwgc28gdXBkYXRlIHRoZSBkYXRhIHN0cnVjdHVyZXNcbiAgICAgICAgICAgICAgICBpZiAob2xkRnVsbFNjb3BlICYmICFmdWxsU2NvcGUpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50c0J5RnVsbFNjb3BlLmRlbGV0ZShvbGRGdWxsU2NvcGUpO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmRlbGVnYXRvcnNCeUZ1bGxTY29wZS5kZWxldGUob2xkRnVsbFNjb3BlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZGVzdHJveTogZnVuY3Rpb24gKHZOb2RlKSB7XG4gICAgICAgICAgICAgICAgc2VsZi52bm9kZXNCZWluZ1JlbW92ZWQucHVzaCh2Tm9kZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVtb3ZlOiBmdW5jdGlvbiAodk5vZGUsIGNiKSB7XG4gICAgICAgICAgICAgICAgc2VsZi52bm9kZXNCZWluZ1JlbW92ZWQucHVzaCh2Tm9kZSk7XG4gICAgICAgICAgICAgICAgY2IoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwb3N0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIHZub2Rlc0JlaW5nUmVtb3ZlZCA9IHNlbGYudm5vZGVzQmVpbmdSZW1vdmVkO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSB2bm9kZXNCZWluZ1JlbW92ZWQubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5jbGVhbnVwVk5vZGUodm5vZGVzQmVpbmdSZW1vdmVkW2ldKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgc2VsZi52bm9kZXNCZWluZ1JlbW92ZWQgPSBbXTtcbiAgICAgICAgICAgICAgICBzZWxmLmZ1bGxTY29wZXNCZWluZ1VwZGF0ZWQgPSBbXTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH07XG4gICAgfTtcbiAgICByZXR1cm4gSXNvbGF0ZU1vZHVsZTtcbn0oKSk7XG5leHBvcnRzLklzb2xhdGVNb2R1bGUgPSBJc29sYXRlTW9kdWxlO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9SXNvbGF0ZU1vZHVsZS5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBhZGFwdF8xID0gcmVxdWlyZShcIkBjeWNsZS9ydW4vbGliL2FkYXB0XCIpO1xudmFyIERvY3VtZW50RE9NU291cmNlXzEgPSByZXF1aXJlKFwiLi9Eb2N1bWVudERPTVNvdXJjZVwiKTtcbnZhciBCb2R5RE9NU291cmNlXzEgPSByZXF1aXJlKFwiLi9Cb2R5RE9NU291cmNlXCIpO1xudmFyIEVsZW1lbnRGaW5kZXJfMSA9IHJlcXVpcmUoXCIuL0VsZW1lbnRGaW5kZXJcIik7XG52YXIgZnJvbUV2ZW50XzEgPSByZXF1aXJlKFwiLi9mcm9tRXZlbnRcIik7XG52YXIgaXNvbGF0ZV8xID0gcmVxdWlyZShcIi4vaXNvbGF0ZVwiKTtcbnZhciBFdmVudERlbGVnYXRvcl8xID0gcmVxdWlyZShcIi4vRXZlbnREZWxlZ2F0b3JcIik7XG52YXIgdXRpbHNfMSA9IHJlcXVpcmUoXCIuL3V0aWxzXCIpO1xudmFyIGV2ZW50VHlwZXNUaGF0RG9udEJ1YmJsZSA9IFtcbiAgICBcImJsdXJcIixcbiAgICBcImNhbnBsYXlcIixcbiAgICBcImNhbnBsYXl0aHJvdWdoXCIsXG4gICAgXCJjaGFuZ2VcIixcbiAgICBcImR1cmF0aW9uY2hhbmdlXCIsXG4gICAgXCJlbXB0aWVkXCIsXG4gICAgXCJlbmRlZFwiLFxuICAgIFwiZm9jdXNcIixcbiAgICBcImxvYWRcIixcbiAgICBcImxvYWRlZGRhdGFcIixcbiAgICBcImxvYWRlZG1ldGFkYXRhXCIsXG4gICAgXCJtb3VzZWVudGVyXCIsXG4gICAgXCJtb3VzZWxlYXZlXCIsXG4gICAgXCJwYXVzZVwiLFxuICAgIFwicGxheVwiLFxuICAgIFwicGxheWluZ1wiLFxuICAgIFwicmF0ZWNoYW5nZVwiLFxuICAgIFwicmVzZXRcIixcbiAgICBcInNjcm9sbFwiLFxuICAgIFwic2Vla2VkXCIsXG4gICAgXCJzZWVraW5nXCIsXG4gICAgXCJzdGFsbGVkXCIsXG4gICAgXCJzdWJtaXRcIixcbiAgICBcInN1c3BlbmRcIixcbiAgICBcInRpbWV1cGRhdGVcIixcbiAgICBcInVubG9hZFwiLFxuICAgIFwidm9sdW1lY2hhbmdlXCIsXG4gICAgXCJ3YWl0aW5nXCIsXG5dO1xuZnVuY3Rpb24gZGV0ZXJtaW5lVXNlQ2FwdHVyZShldmVudFR5cGUsIG9wdGlvbnMpIHtcbiAgICB2YXIgcmVzdWx0ID0gZmFsc2U7XG4gICAgaWYgKHR5cGVvZiBvcHRpb25zLnVzZUNhcHR1cmUgPT09ICdib29sZWFuJykge1xuICAgICAgICByZXN1bHQgPSBvcHRpb25zLnVzZUNhcHR1cmU7XG4gICAgfVxuICAgIGlmIChldmVudFR5cGVzVGhhdERvbnRCdWJibGUuaW5kZXhPZihldmVudFR5cGUpICE9PSAtMSkge1xuICAgICAgICByZXN1bHQgPSB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xufVxuZnVuY3Rpb24gZmlsdGVyQmFzZWRPbklzb2xhdGlvbihkb21Tb3VyY2UsIGZ1bGxTY29wZSkge1xuICAgIHJldHVybiBmdW5jdGlvbiBmaWx0ZXJCYXNlZE9uSXNvbGF0aW9uT3BlcmF0b3Iocm9vdEVsZW1lbnQkKSB7XG4gICAgICAgIHZhciBpbml0aWFsU3RhdGUgPSB7XG4gICAgICAgICAgICB3YXNJc29sYXRlZDogZmFsc2UsXG4gICAgICAgICAgICBzaG91bGRQYXNzOiBmYWxzZSxcbiAgICAgICAgICAgIGVsZW1lbnQ6IG51bGwsXG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiByb290RWxlbWVudCRcbiAgICAgICAgICAgIC5mb2xkKGZ1bmN0aW9uIGNoZWNrSWZTaG91bGRQYXNzKHN0YXRlLCBlbGVtZW50KSB7XG4gICAgICAgICAgICB2YXIgaXNJc29sYXRlZCA9ICEhZG9tU291cmNlLl9pc29sYXRlTW9kdWxlLmdldEVsZW1lbnQoZnVsbFNjb3BlKTtcbiAgICAgICAgICAgIHN0YXRlLnNob3VsZFBhc3MgPSBpc0lzb2xhdGVkICYmICFzdGF0ZS53YXNJc29sYXRlZDtcbiAgICAgICAgICAgIHN0YXRlLndhc0lzb2xhdGVkID0gaXNJc29sYXRlZDtcbiAgICAgICAgICAgIHN0YXRlLmVsZW1lbnQgPSBlbGVtZW50O1xuICAgICAgICAgICAgcmV0dXJuIHN0YXRlO1xuICAgICAgICB9LCBpbml0aWFsU3RhdGUpXG4gICAgICAgICAgICAuZHJvcCgxKVxuICAgICAgICAgICAgLmZpbHRlcihmdW5jdGlvbiAocykgeyByZXR1cm4gcy5zaG91bGRQYXNzOyB9KVxuICAgICAgICAgICAgLm1hcChmdW5jdGlvbiAocykgeyByZXR1cm4gcy5lbGVtZW50OyB9KTtcbiAgICB9O1xufVxudmFyIE1haW5ET01Tb3VyY2UgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIE1haW5ET01Tb3VyY2UoX3Jvb3RFbGVtZW50JCwgX3Nhbml0YXRpb24kLCBfbmFtZXNwYWNlLCBfaXNvbGF0ZU1vZHVsZSwgX2RlbGVnYXRvcnMsIF9uYW1lKSB7XG4gICAgICAgIGlmIChfbmFtZXNwYWNlID09PSB2b2lkIDApIHsgX25hbWVzcGFjZSA9IFtdOyB9XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHRoaXMuX3Jvb3RFbGVtZW50JCA9IF9yb290RWxlbWVudCQ7XG4gICAgICAgIHRoaXMuX3Nhbml0YXRpb24kID0gX3Nhbml0YXRpb24kO1xuICAgICAgICB0aGlzLl9uYW1lc3BhY2UgPSBfbmFtZXNwYWNlO1xuICAgICAgICB0aGlzLl9pc29sYXRlTW9kdWxlID0gX2lzb2xhdGVNb2R1bGU7XG4gICAgICAgIHRoaXMuX2RlbGVnYXRvcnMgPSBfZGVsZWdhdG9ycztcbiAgICAgICAgdGhpcy5fbmFtZSA9IF9uYW1lO1xuICAgICAgICB0aGlzLmlzb2xhdGVTb3VyY2UgPSBpc29sYXRlXzEuaXNvbGF0ZVNvdXJjZTtcbiAgICAgICAgdGhpcy5pc29sYXRlU2luayA9IGZ1bmN0aW9uIChzaW5rLCBzY29wZSkge1xuICAgICAgICAgICAgaWYgKHNjb3BlID09PSAnOnJvb3QnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNpbms7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmICh1dGlsc18xLmlzQ2xhc3NPcklkKHNjb3BlKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBpc29sYXRlXzEuc2libGluZ0lzb2xhdGVTaW5rKHNpbmssIHNjb3BlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHZhciBwcmV2RnVsbFNjb3BlID0gdXRpbHNfMS5nZXRGdWxsU2NvcGUoX3RoaXMuX25hbWVzcGFjZSk7XG4gICAgICAgICAgICAgICAgdmFyIG5leHRGdWxsU2NvcGUgPSBbcHJldkZ1bGxTY29wZSwgc2NvcGVdLmZpbHRlcihmdW5jdGlvbiAoeCkgeyByZXR1cm4gISF4OyB9KS5qb2luKCctJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGlzb2xhdGVfMS50b3RhbElzb2xhdGVTaW5rKHNpbmssIG5leHRGdWxsU2NvcGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbiAgICBNYWluRE9NU291cmNlLnByb3RvdHlwZS5lbGVtZW50cyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG91dHB1dCQ7XG4gICAgICAgIGlmICh0aGlzLl9uYW1lc3BhY2UubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICBvdXRwdXQkID0gdGhpcy5fcm9vdEVsZW1lbnQkO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdmFyIGVsZW1lbnRGaW5kZXJfMSA9IG5ldyBFbGVtZW50RmluZGVyXzEuRWxlbWVudEZpbmRlcih0aGlzLl9uYW1lc3BhY2UsIHRoaXMuX2lzb2xhdGVNb2R1bGUpO1xuICAgICAgICAgICAgb3V0cHV0JCA9IHRoaXMuX3Jvb3RFbGVtZW50JC5tYXAoZnVuY3Rpb24gKGVsKSB7IHJldHVybiBlbGVtZW50RmluZGVyXzEuY2FsbChlbCk7IH0pO1xuICAgICAgICB9XG4gICAgICAgIHZhciBvdXQgPSBhZGFwdF8xLmFkYXB0KG91dHB1dCQucmVtZW1iZXIoKSk7XG4gICAgICAgIG91dC5faXNDeWNsZVNvdXJjZSA9IHRoaXMuX25hbWU7XG4gICAgICAgIHJldHVybiBvdXQ7XG4gICAgfTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoTWFpbkRPTVNvdXJjZS5wcm90b3R5cGUsIFwibmFtZXNwYWNlXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fbmFtZXNwYWNlO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBNYWluRE9NU291cmNlLnByb3RvdHlwZS5zZWxlY3QgPSBmdW5jdGlvbiAoc2VsZWN0b3IpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBzZWxlY3RvciAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkRPTSBkcml2ZXIncyBzZWxlY3QoKSBleHBlY3RzIHRoZSBhcmd1bWVudCB0byBiZSBhIFwiICtcbiAgICAgICAgICAgICAgICBcInN0cmluZyBhcyBhIENTUyBzZWxlY3RvclwiKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc2VsZWN0b3IgPT09ICdkb2N1bWVudCcpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgRG9jdW1lbnRET01Tb3VyY2VfMS5Eb2N1bWVudERPTVNvdXJjZSh0aGlzLl9uYW1lKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc2VsZWN0b3IgPT09ICdib2R5Jykge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBCb2R5RE9NU291cmNlXzEuQm9keURPTVNvdXJjZSh0aGlzLl9uYW1lKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgdHJpbW1lZFNlbGVjdG9yID0gc2VsZWN0b3IudHJpbSgpO1xuICAgICAgICB2YXIgY2hpbGROYW1lc3BhY2UgPSB0cmltbWVkU2VsZWN0b3IgPT09IFwiOnJvb3RcIlxuICAgICAgICAgICAgPyB0aGlzLl9uYW1lc3BhY2VcbiAgICAgICAgICAgIDogdGhpcy5fbmFtZXNwYWNlLmNvbmNhdCh0cmltbWVkU2VsZWN0b3IpO1xuICAgICAgICByZXR1cm4gbmV3IE1haW5ET01Tb3VyY2UodGhpcy5fcm9vdEVsZW1lbnQkLCB0aGlzLl9zYW5pdGF0aW9uJCwgY2hpbGROYW1lc3BhY2UsIHRoaXMuX2lzb2xhdGVNb2R1bGUsIHRoaXMuX2RlbGVnYXRvcnMsIHRoaXMuX25hbWUpO1xuICAgIH07XG4gICAgTWFpbkRPTVNvdXJjZS5wcm90b3R5cGUuZXZlbnRzID0gZnVuY3Rpb24gKGV2ZW50VHlwZSwgb3B0aW9ucykge1xuICAgICAgICBpZiAob3B0aW9ucyA9PT0gdm9pZCAwKSB7IG9wdGlvbnMgPSB7fTsgfVxuICAgICAgICBpZiAodHlwZW9mIGV2ZW50VHlwZSAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRE9NIGRyaXZlcidzIGV2ZW50cygpIGV4cGVjdHMgYXJndW1lbnQgdG8gYmUgYSBcIiArXG4gICAgICAgICAgICAgICAgXCJzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSBldmVudCB0eXBlIHRvIGxpc3RlbiBmb3IuXCIpO1xuICAgICAgICB9XG4gICAgICAgIHZhciB1c2VDYXB0dXJlID0gZGV0ZXJtaW5lVXNlQ2FwdHVyZShldmVudFR5cGUsIG9wdGlvbnMpO1xuICAgICAgICB2YXIgbmFtZXNwYWNlID0gdGhpcy5fbmFtZXNwYWNlO1xuICAgICAgICB2YXIgZnVsbFNjb3BlID0gdXRpbHNfMS5nZXRGdWxsU2NvcGUobmFtZXNwYWNlKTtcbiAgICAgICAgdmFyIGtleVBhcnRzID0gW2V2ZW50VHlwZSwgdXNlQ2FwdHVyZV07XG4gICAgICAgIGlmIChmdWxsU2NvcGUpIHtcbiAgICAgICAgICAgIGtleVBhcnRzLnB1c2goZnVsbFNjb3BlKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIga2V5ID0ga2V5UGFydHMuam9pbignficpO1xuICAgICAgICB2YXIgZG9tU291cmNlID0gdGhpcztcbiAgICAgICAgdmFyIHJvb3RFbGVtZW50JDtcbiAgICAgICAgaWYgKGZ1bGxTY29wZSkge1xuICAgICAgICAgICAgcm9vdEVsZW1lbnQkID0gdGhpcy5fcm9vdEVsZW1lbnQkLmNvbXBvc2UoZmlsdGVyQmFzZWRPbklzb2xhdGlvbihkb21Tb3VyY2UsIGZ1bGxTY29wZSkpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcm9vdEVsZW1lbnQkID0gdGhpcy5fcm9vdEVsZW1lbnQkLnRha2UoMik7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGV2ZW50JCA9IHJvb3RFbGVtZW50JFxuICAgICAgICAgICAgLm1hcChmdW5jdGlvbiBzZXR1cEV2ZW50RGVsZWdhdG9yT25Ub3BFbGVtZW50KHJvb3RFbGVtZW50KSB7XG4gICAgICAgICAgICAvLyBFdmVudCBsaXN0ZW5lciBqdXN0IGZvciB0aGUgcm9vdCBlbGVtZW50XG4gICAgICAgICAgICBpZiAoIW5hbWVzcGFjZSB8fCBuYW1lc3BhY2UubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZyb21FdmVudF8xLmZyb21FdmVudChyb290RWxlbWVudCwgZXZlbnRUeXBlLCB1c2VDYXB0dXJlLCBvcHRpb25zLnByZXZlbnREZWZhdWx0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIEV2ZW50IGxpc3RlbmVyIG9uIHRoZSBvcmlnaW4gZWxlbWVudCBhcyBhbiBFdmVudERlbGVnYXRvclxuICAgICAgICAgICAgdmFyIGRlbGVnYXRvcnMgPSBkb21Tb3VyY2UuX2RlbGVnYXRvcnM7XG4gICAgICAgICAgICB2YXIgb3JpZ2luID0gZG9tU291cmNlLl9pc29sYXRlTW9kdWxlLmdldEVsZW1lbnQoZnVsbFNjb3BlKSB8fCByb290RWxlbWVudDtcbiAgICAgICAgICAgIHZhciBkZWxlZ2F0b3I7XG4gICAgICAgICAgICBpZiAoZGVsZWdhdG9ycy5oYXMoa2V5KSkge1xuICAgICAgICAgICAgICAgIGRlbGVnYXRvciA9IGRlbGVnYXRvcnMuZ2V0KGtleSk7XG4gICAgICAgICAgICAgICAgZGVsZWdhdG9yLnVwZGF0ZU9yaWdpbihvcmlnaW4pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgZGVsZWdhdG9yID0gbmV3IEV2ZW50RGVsZWdhdG9yXzEuRXZlbnREZWxlZ2F0b3Iob3JpZ2luLCBldmVudFR5cGUsIHVzZUNhcHR1cmUsIGRvbVNvdXJjZS5faXNvbGF0ZU1vZHVsZSwgb3B0aW9ucy5wcmV2ZW50RGVmYXVsdCk7XG4gICAgICAgICAgICAgICAgZGVsZWdhdG9ycy5zZXQoa2V5LCBkZWxlZ2F0b3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGZ1bGxTY29wZSkge1xuICAgICAgICAgICAgICAgIGRvbVNvdXJjZS5faXNvbGF0ZU1vZHVsZS5hZGRFdmVudERlbGVnYXRvcihmdWxsU2NvcGUsIGRlbGVnYXRvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgc3ViamVjdCA9IGRlbGVnYXRvci5jcmVhdGVEZXN0aW5hdGlvbihuYW1lc3BhY2UpO1xuICAgICAgICAgICAgcmV0dXJuIHN1YmplY3Q7XG4gICAgICAgIH0pXG4gICAgICAgICAgICAuZmxhdHRlbigpO1xuICAgICAgICB2YXIgb3V0ID0gYWRhcHRfMS5hZGFwdChldmVudCQpO1xuICAgICAgICBvdXQuX2lzQ3ljbGVTb3VyY2UgPSBkb21Tb3VyY2UuX25hbWU7XG4gICAgICAgIHJldHVybiBvdXQ7XG4gICAgfTtcbiAgICBNYWluRE9NU291cmNlLnByb3RvdHlwZS5kaXNwb3NlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLl9zYW5pdGF0aW9uJC5zaGFtZWZ1bGx5U2VuZE5leHQobnVsbCk7XG4gICAgICAgIHRoaXMuX2lzb2xhdGVNb2R1bGUucmVzZXQoKTtcbiAgICB9O1xuICAgIHJldHVybiBNYWluRE9NU291cmNlO1xufSgpKTtcbmV4cG9ydHMuTWFpbkRPTVNvdXJjZSA9IE1haW5ET01Tb3VyY2U7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1NYWluRE9NU291cmNlLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIFNjb3BlQ2hlY2tlciA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gU2NvcGVDaGVja2VyKGZ1bGxTY29wZSwgaXNvbGF0ZU1vZHVsZSkge1xuICAgICAgICB0aGlzLmZ1bGxTY29wZSA9IGZ1bGxTY29wZTtcbiAgICAgICAgdGhpcy5pc29sYXRlTW9kdWxlID0gaXNvbGF0ZU1vZHVsZTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ2hlY2tzIHdoZXRoZXIgdGhlIGdpdmVuIGVsZW1lbnQgaXMgKmRpcmVjdGx5KiBpbiB0aGUgc2NvcGUgb2YgdGhpc1xuICAgICAqIHNjb3BlIGNoZWNrZXIuIEJlaW5nIGNvbnRhaW5lZCAqaW5kaXJlY3RseSogdGhyb3VnaCBvdGhlciBzY29wZXNcbiAgICAgKiBpcyBub3QgdmFsaWQuIFRoaXMgaXMgY3J1Y2lhbCBmb3IgaW1wbGVtZW50aW5nIHBhcmVudC1jaGlsZCBpc29sYXRpb24sXG4gICAgICogc28gdGhhdCB0aGUgcGFyZW50IHNlbGVjdG9ycyBkb24ndCBzZWFyY2ggaW5zaWRlIGEgY2hpbGQgc2NvcGUuXG4gICAgICovXG4gICAgU2NvcGVDaGVja2VyLnByb3RvdHlwZS5pc0RpcmVjdGx5SW5TY29wZSA9IGZ1bmN0aW9uIChsZWFmKSB7XG4gICAgICAgIGZvciAodmFyIGVsID0gbGVhZjsgZWw7IGVsID0gZWwucGFyZW50RWxlbWVudCkge1xuICAgICAgICAgICAgdmFyIGZ1bGxTY29wZSA9IHRoaXMuaXNvbGF0ZU1vZHVsZS5nZXRGdWxsU2NvcGUoZWwpO1xuICAgICAgICAgICAgaWYgKGZ1bGxTY29wZSAmJiBmdWxsU2NvcGUgIT09IHRoaXMuZnVsbFNjb3BlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGZ1bGxTY29wZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH07XG4gICAgcmV0dXJuIFNjb3BlQ2hlY2tlcjtcbn0oKSk7XG5leHBvcnRzLlNjb3BlQ2hlY2tlciA9IFNjb3BlQ2hlY2tlcjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPVNjb3BlQ2hlY2tlci5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB2bm9kZV8xID0gcmVxdWlyZShcInNuYWJiZG9tL3Zub2RlXCIpO1xudmFyIGhfMSA9IHJlcXVpcmUoXCJzbmFiYmRvbS9oXCIpO1xudmFyIGNsYXNzTmFtZUZyb21WTm9kZV8xID0gcmVxdWlyZShcInNuYWJiZG9tLXNlbGVjdG9yL2xpYi9jb21tb25qcy9jbGFzc05hbWVGcm9tVk5vZGVcIik7XG52YXIgc2VsZWN0b3JQYXJzZXJfMSA9IHJlcXVpcmUoXCJzbmFiYmRvbS1zZWxlY3Rvci9saWIvY29tbW9uanMvc2VsZWN0b3JQYXJzZXJcIik7XG52YXIgdXRpbHNfMSA9IHJlcXVpcmUoXCIuL3V0aWxzXCIpO1xudmFyIFZOb2RlV3JhcHBlciA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gVk5vZGVXcmFwcGVyKHJvb3RFbGVtZW50KSB7XG4gICAgICAgIHRoaXMucm9vdEVsZW1lbnQgPSByb290RWxlbWVudDtcbiAgICB9XG4gICAgVk5vZGVXcmFwcGVyLnByb3RvdHlwZS5jYWxsID0gZnVuY3Rpb24gKHZub2RlKSB7XG4gICAgICAgIGlmICh1dGlsc18xLmlzRG9jRnJhZyh0aGlzLnJvb3RFbGVtZW50KSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMud3JhcERvY0ZyYWcodm5vZGUgPT09IG51bGwgPyBbXSA6IFt2bm9kZV0pO1xuICAgICAgICB9XG4gICAgICAgIGlmICh2bm9kZSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMud3JhcChbXSk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIF9hID0gc2VsZWN0b3JQYXJzZXJfMS5zZWxlY3RvclBhcnNlcih2bm9kZSksIHNlbFRhZ05hbWUgPSBfYS50YWdOYW1lLCBzZWxJZCA9IF9hLmlkO1xuICAgICAgICB2YXIgdk5vZGVDbGFzc05hbWUgPSBjbGFzc05hbWVGcm9tVk5vZGVfMS5jbGFzc05hbWVGcm9tVk5vZGUodm5vZGUpO1xuICAgICAgICB2YXIgdk5vZGVEYXRhID0gdm5vZGUuZGF0YSB8fCB7fTtcbiAgICAgICAgdmFyIHZOb2RlRGF0YVByb3BzID0gdk5vZGVEYXRhLnByb3BzIHx8IHt9O1xuICAgICAgICB2YXIgX2IgPSB2Tm9kZURhdGFQcm9wcy5pZCwgdk5vZGVJZCA9IF9iID09PSB2b2lkIDAgPyBzZWxJZCA6IF9iO1xuICAgICAgICB2YXIgaXNWTm9kZUFuZFJvb3RFbGVtZW50SWRlbnRpY2FsID0gdHlwZW9mIHZOb2RlSWQgPT09ICdzdHJpbmcnICYmXG4gICAgICAgICAgICB2Tm9kZUlkLnRvVXBwZXJDYXNlKCkgPT09IHRoaXMucm9vdEVsZW1lbnQuaWQudG9VcHBlckNhc2UoKSAmJlxuICAgICAgICAgICAgc2VsVGFnTmFtZS50b1VwcGVyQ2FzZSgpID09PSB0aGlzLnJvb3RFbGVtZW50LnRhZ05hbWUudG9VcHBlckNhc2UoKSAmJlxuICAgICAgICAgICAgdk5vZGVDbGFzc05hbWUudG9VcHBlckNhc2UoKSA9PT0gdGhpcy5yb290RWxlbWVudC5jbGFzc05hbWUudG9VcHBlckNhc2UoKTtcbiAgICAgICAgaWYgKGlzVk5vZGVBbmRSb290RWxlbWVudElkZW50aWNhbCkge1xuICAgICAgICAgICAgcmV0dXJuIHZub2RlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLndyYXAoW3Zub2RlXSk7XG4gICAgfTtcbiAgICBWTm9kZVdyYXBwZXIucHJvdG90eXBlLndyYXBEb2NGcmFnID0gZnVuY3Rpb24gKGNoaWxkcmVuKSB7XG4gICAgICAgIHJldHVybiB2bm9kZV8xLnZub2RlKCcnLCB7fSwgY2hpbGRyZW4sIHVuZGVmaW5lZCwgdGhpcy5yb290RWxlbWVudCk7XG4gICAgfTtcbiAgICBWTm9kZVdyYXBwZXIucHJvdG90eXBlLndyYXAgPSBmdW5jdGlvbiAoY2hpbGRyZW4pIHtcbiAgICAgICAgdmFyIF9hID0gdGhpcy5yb290RWxlbWVudCwgdGFnTmFtZSA9IF9hLnRhZ05hbWUsIGlkID0gX2EuaWQsIGNsYXNzTmFtZSA9IF9hLmNsYXNzTmFtZTtcbiAgICAgICAgdmFyIHNlbElkID0gaWQgPyBcIiNcIiArIGlkIDogJyc7XG4gICAgICAgIHZhciBzZWxDbGFzcyA9IGNsYXNzTmFtZSA/IFwiLlwiICsgY2xhc3NOYW1lLnNwbGl0KFwiIFwiKS5qb2luKFwiLlwiKSA6ICcnO1xuICAgICAgICByZXR1cm4gaF8xLmgoXCJcIiArIHRhZ05hbWUudG9Mb3dlckNhc2UoKSArIHNlbElkICsgc2VsQ2xhc3MsIHt9LCBjaGlsZHJlbik7XG4gICAgfTtcbiAgICByZXR1cm4gVk5vZGVXcmFwcGVyO1xufSgpKTtcbmV4cG9ydHMuVk5vZGVXcmFwcGVyID0gVk5vZGVXcmFwcGVyO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9Vk5vZGVXcmFwcGVyLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHhzdHJlYW1fMSA9IHJlcXVpcmUoXCJ4c3RyZWFtXCIpO1xuZnVuY3Rpb24gZnJvbUV2ZW50KGVsZW1lbnQsIGV2ZW50TmFtZSwgdXNlQ2FwdHVyZSwgcHJldmVudERlZmF1bHQpIHtcbiAgICBpZiAodXNlQ2FwdHVyZSA9PT0gdm9pZCAwKSB7IHVzZUNhcHR1cmUgPSBmYWxzZTsgfVxuICAgIGlmIChwcmV2ZW50RGVmYXVsdCA9PT0gdm9pZCAwKSB7IHByZXZlbnREZWZhdWx0ID0gZmFsc2U7IH1cbiAgICByZXR1cm4geHN0cmVhbV8xLlN0cmVhbS5jcmVhdGUoe1xuICAgICAgICBlbGVtZW50OiBlbGVtZW50LFxuICAgICAgICBuZXh0OiBudWxsLFxuICAgICAgICBzdGFydDogZnVuY3Rpb24gc3RhcnQobGlzdGVuZXIpIHtcbiAgICAgICAgICAgIGlmIChwcmV2ZW50RGVmYXVsdCkge1xuICAgICAgICAgICAgICAgIHRoaXMubmV4dCA9IGZ1bmN0aW9uIG5leHQoZXZlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgbGlzdGVuZXIubmV4dChldmVudCk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMubmV4dCA9IGZ1bmN0aW9uIG5leHQoZXZlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgbGlzdGVuZXIubmV4dChldmVudCk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKGV2ZW50TmFtZSwgdGhpcy5uZXh0LCB1c2VDYXB0dXJlKTtcbiAgICAgICAgfSxcbiAgICAgICAgc3RvcDogZnVuY3Rpb24gc3RvcCgpIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50TmFtZSwgdGhpcy5uZXh0LCB1c2VDYXB0dXJlKTtcbiAgICAgICAgfSxcbiAgICB9KTtcbn1cbmV4cG9ydHMuZnJvbUV2ZW50ID0gZnJvbUV2ZW50O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZnJvbUV2ZW50LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuLy8gdHNsaW50OmRpc2FibGU6bWF4LWZpbGUtbGluZS1jb3VudFxudmFyIGhfMSA9IHJlcXVpcmUoXCJzbmFiYmRvbS9oXCIpO1xuZnVuY3Rpb24gaXNWYWxpZFN0cmluZyhwYXJhbSkge1xuICAgIHJldHVybiB0eXBlb2YgcGFyYW0gPT09ICdzdHJpbmcnICYmIHBhcmFtLmxlbmd0aCA+IDA7XG59XG5mdW5jdGlvbiBpc1NlbGVjdG9yKHBhcmFtKSB7XG4gICAgcmV0dXJuIGlzVmFsaWRTdHJpbmcocGFyYW0pICYmIChwYXJhbVswXSA9PT0gJy4nIHx8IHBhcmFtWzBdID09PSAnIycpO1xufVxuZnVuY3Rpb24gY3JlYXRlVGFnRnVuY3Rpb24odGFnTmFtZSkge1xuICAgIHJldHVybiBmdW5jdGlvbiBoeXBlcnNjcmlwdChhLCBiLCBjKSB7XG4gICAgICAgIHZhciBoYXNBID0gdHlwZW9mIGEgIT09ICd1bmRlZmluZWQnO1xuICAgICAgICB2YXIgaGFzQiA9IHR5cGVvZiBiICE9PSAndW5kZWZpbmVkJztcbiAgICAgICAgdmFyIGhhc0MgPSB0eXBlb2YgYyAhPT0gJ3VuZGVmaW5lZCc7XG4gICAgICAgIGlmIChpc1NlbGVjdG9yKGEpKSB7XG4gICAgICAgICAgICBpZiAoaGFzQiAmJiBoYXNDKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGhfMS5oKHRhZ05hbWUgKyBhLCBiLCBjKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGhhc0IpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaF8xLmgodGFnTmFtZSArIGEsIGIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGhfMS5oKHRhZ05hbWUgKyBhLCB7fSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoaGFzQykge1xuICAgICAgICAgICAgcmV0dXJuIGhfMS5oKHRhZ05hbWUgKyBhLCBiLCBjKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChoYXNCKSB7XG4gICAgICAgICAgICByZXR1cm4gaF8xLmgodGFnTmFtZSwgYSwgYik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoaGFzQSkge1xuICAgICAgICAgICAgcmV0dXJuIGhfMS5oKHRhZ05hbWUsIGEpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGhfMS5oKHRhZ05hbWUsIHt9KTtcbiAgICAgICAgfVxuICAgIH07XG59XG52YXIgU1ZHX1RBR19OQU1FUyA9IFtcbiAgICAnYScsXG4gICAgJ2FsdEdseXBoJyxcbiAgICAnYWx0R2x5cGhEZWYnLFxuICAgICdhbHRHbHlwaEl0ZW0nLFxuICAgICdhbmltYXRlJyxcbiAgICAnYW5pbWF0ZUNvbG9yJyxcbiAgICAnYW5pbWF0ZU1vdGlvbicsXG4gICAgJ2FuaW1hdGVUcmFuc2Zvcm0nLFxuICAgICdjaXJjbGUnLFxuICAgICdjbGlwUGF0aCcsXG4gICAgJ2NvbG9yUHJvZmlsZScsXG4gICAgJ2N1cnNvcicsXG4gICAgJ2RlZnMnLFxuICAgICdkZXNjJyxcbiAgICAnZWxsaXBzZScsXG4gICAgJ2ZlQmxlbmQnLFxuICAgICdmZUNvbG9yTWF0cml4JyxcbiAgICAnZmVDb21wb25lbnRUcmFuc2ZlcicsXG4gICAgJ2ZlQ29tcG9zaXRlJyxcbiAgICAnZmVDb252b2x2ZU1hdHJpeCcsXG4gICAgJ2ZlRGlmZnVzZUxpZ2h0aW5nJyxcbiAgICAnZmVEaXNwbGFjZW1lbnRNYXAnLFxuICAgICdmZURpc3RhbnRMaWdodCcsXG4gICAgJ2ZlRmxvb2QnLFxuICAgICdmZUZ1bmNBJyxcbiAgICAnZmVGdW5jQicsXG4gICAgJ2ZlRnVuY0cnLFxuICAgICdmZUZ1bmNSJyxcbiAgICAnZmVHYXVzc2lhbkJsdXInLFxuICAgICdmZUltYWdlJyxcbiAgICAnZmVNZXJnZScsXG4gICAgJ2ZlTWVyZ2VOb2RlJyxcbiAgICAnZmVNb3JwaG9sb2d5JyxcbiAgICAnZmVPZmZzZXQnLFxuICAgICdmZVBvaW50TGlnaHQnLFxuICAgICdmZVNwZWN1bGFyTGlnaHRpbmcnLFxuICAgICdmZVNwb3RsaWdodCcsXG4gICAgJ2ZlVGlsZScsXG4gICAgJ2ZlVHVyYnVsZW5jZScsXG4gICAgJ2ZpbHRlcicsXG4gICAgJ2ZvbnQnLFxuICAgICdmb250RmFjZScsXG4gICAgJ2ZvbnRGYWNlRm9ybWF0JyxcbiAgICAnZm9udEZhY2VOYW1lJyxcbiAgICAnZm9udEZhY2VTcmMnLFxuICAgICdmb250RmFjZVVyaScsXG4gICAgJ2ZvcmVpZ25PYmplY3QnLFxuICAgICdnJyxcbiAgICAnZ2x5cGgnLFxuICAgICdnbHlwaFJlZicsXG4gICAgJ2hrZXJuJyxcbiAgICAnaW1hZ2UnLFxuICAgICdsaW5lJyxcbiAgICAnbGluZWFyR3JhZGllbnQnLFxuICAgICdtYXJrZXInLFxuICAgICdtYXNrJyxcbiAgICAnbWV0YWRhdGEnLFxuICAgICdtaXNzaW5nR2x5cGgnLFxuICAgICdtcGF0aCcsXG4gICAgJ3BhdGgnLFxuICAgICdwYXR0ZXJuJyxcbiAgICAncG9seWdvbicsXG4gICAgJ3BvbHlsaW5lJyxcbiAgICAncmFkaWFsR3JhZGllbnQnLFxuICAgICdyZWN0JyxcbiAgICAnc2NyaXB0JyxcbiAgICAnc2V0JyxcbiAgICAnc3RvcCcsXG4gICAgJ3N0eWxlJyxcbiAgICAnc3dpdGNoJyxcbiAgICAnc3ltYm9sJyxcbiAgICAndGV4dCcsXG4gICAgJ3RleHRQYXRoJyxcbiAgICAndGl0bGUnLFxuICAgICd0cmVmJyxcbiAgICAndHNwYW4nLFxuICAgICd1c2UnLFxuICAgICd2aWV3JyxcbiAgICAndmtlcm4nLFxuXTtcbnZhciBzdmcgPSBjcmVhdGVUYWdGdW5jdGlvbignc3ZnJyk7XG5TVkdfVEFHX05BTUVTLmZvckVhY2goZnVuY3Rpb24gKHRhZykge1xuICAgIHN2Z1t0YWddID0gY3JlYXRlVGFnRnVuY3Rpb24odGFnKTtcbn0pO1xudmFyIFRBR19OQU1FUyA9IFtcbiAgICAnYScsXG4gICAgJ2FiYnInLFxuICAgICdhZGRyZXNzJyxcbiAgICAnYXJlYScsXG4gICAgJ2FydGljbGUnLFxuICAgICdhc2lkZScsXG4gICAgJ2F1ZGlvJyxcbiAgICAnYicsXG4gICAgJ2Jhc2UnLFxuICAgICdiZGknLFxuICAgICdiZG8nLFxuICAgICdibG9ja3F1b3RlJyxcbiAgICAnYm9keScsXG4gICAgJ2JyJyxcbiAgICAnYnV0dG9uJyxcbiAgICAnY2FudmFzJyxcbiAgICAnY2FwdGlvbicsXG4gICAgJ2NpdGUnLFxuICAgICdjb2RlJyxcbiAgICAnY29sJyxcbiAgICAnY29sZ3JvdXAnLFxuICAgICdkZCcsXG4gICAgJ2RlbCcsXG4gICAgJ2RmbicsXG4gICAgJ2RpcicsXG4gICAgJ2RpdicsXG4gICAgJ2RsJyxcbiAgICAnZHQnLFxuICAgICdlbScsXG4gICAgJ2VtYmVkJyxcbiAgICAnZmllbGRzZXQnLFxuICAgICdmaWdjYXB0aW9uJyxcbiAgICAnZmlndXJlJyxcbiAgICAnZm9vdGVyJyxcbiAgICAnZm9ybScsXG4gICAgJ2gxJyxcbiAgICAnaDInLFxuICAgICdoMycsXG4gICAgJ2g0JyxcbiAgICAnaDUnLFxuICAgICdoNicsXG4gICAgJ2hlYWQnLFxuICAgICdoZWFkZXInLFxuICAgICdoZ3JvdXAnLFxuICAgICdocicsXG4gICAgJ2h0bWwnLFxuICAgICdpJyxcbiAgICAnaWZyYW1lJyxcbiAgICAnaW1nJyxcbiAgICAnaW5wdXQnLFxuICAgICdpbnMnLFxuICAgICdrYmQnLFxuICAgICdrZXlnZW4nLFxuICAgICdsYWJlbCcsXG4gICAgJ2xlZ2VuZCcsXG4gICAgJ2xpJyxcbiAgICAnbGluaycsXG4gICAgJ21haW4nLFxuICAgICdtYXAnLFxuICAgICdtYXJrJyxcbiAgICAnbWVudScsXG4gICAgJ21ldGEnLFxuICAgICduYXYnLFxuICAgICdub3NjcmlwdCcsXG4gICAgJ29iamVjdCcsXG4gICAgJ29sJyxcbiAgICAnb3B0Z3JvdXAnLFxuICAgICdvcHRpb24nLFxuICAgICdwJyxcbiAgICAncGFyYW0nLFxuICAgICdwcmUnLFxuICAgICdwcm9ncmVzcycsXG4gICAgJ3EnLFxuICAgICdycCcsXG4gICAgJ3J0JyxcbiAgICAncnVieScsXG4gICAgJ3MnLFxuICAgICdzYW1wJyxcbiAgICAnc2NyaXB0JyxcbiAgICAnc2VjdGlvbicsXG4gICAgJ3NlbGVjdCcsXG4gICAgJ3NtYWxsJyxcbiAgICAnc291cmNlJyxcbiAgICAnc3BhbicsXG4gICAgJ3N0cm9uZycsXG4gICAgJ3N0eWxlJyxcbiAgICAnc3ViJyxcbiAgICAnc3VwJyxcbiAgICAndGFibGUnLFxuICAgICd0Ym9keScsXG4gICAgJ3RkJyxcbiAgICAndGV4dGFyZWEnLFxuICAgICd0Zm9vdCcsXG4gICAgJ3RoJyxcbiAgICAndGhlYWQnLFxuICAgICd0aW1lJyxcbiAgICAndGl0bGUnLFxuICAgICd0cicsXG4gICAgJ3UnLFxuICAgICd1bCcsXG4gICAgJ3ZpZGVvJyxcbl07XG52YXIgZXhwb3J0ZWQgPSB7XG4gICAgU1ZHX1RBR19OQU1FUzogU1ZHX1RBR19OQU1FUyxcbiAgICBUQUdfTkFNRVM6IFRBR19OQU1FUyxcbiAgICBzdmc6IHN2ZyxcbiAgICBpc1NlbGVjdG9yOiBpc1NlbGVjdG9yLFxuICAgIGNyZWF0ZVRhZ0Z1bmN0aW9uOiBjcmVhdGVUYWdGdW5jdGlvbixcbn07XG5UQUdfTkFNRVMuZm9yRWFjaChmdW5jdGlvbiAobikge1xuICAgIGV4cG9ydGVkW25dID0gY3JlYXRlVGFnRnVuY3Rpb24obik7XG59KTtcbmV4cG9ydHMuZGVmYXVsdCA9IGV4cG9ydGVkO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aHlwZXJzY3JpcHQtaGVscGVycy5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB0aHVua18xID0gcmVxdWlyZShcIi4vdGh1bmtcIik7XG5leHBvcnRzLnRodW5rID0gdGh1bmtfMS50aHVuaztcbnZhciBNYWluRE9NU291cmNlXzEgPSByZXF1aXJlKFwiLi9NYWluRE9NU291cmNlXCIpO1xuZXhwb3J0cy5NYWluRE9NU291cmNlID0gTWFpbkRPTVNvdXJjZV8xLk1haW5ET01Tb3VyY2U7XG4vKipcbiAqIEEgZmFjdG9yeSBmb3IgdGhlIERPTSBkcml2ZXIgZnVuY3Rpb24uXG4gKlxuICogVGFrZXMgYSBgY29udGFpbmVyYCB0byBkZWZpbmUgdGhlIHRhcmdldCBvbiB0aGUgZXhpc3RpbmcgRE9NIHdoaWNoIHRoaXNcbiAqIGRyaXZlciB3aWxsIG9wZXJhdGUgb24sIGFuZCBhbiBgb3B0aW9uc2Agb2JqZWN0IGFzIHRoZSBzZWNvbmQgYXJndW1lbnQuIFRoZVxuICogaW5wdXQgdG8gdGhpcyBkcml2ZXIgaXMgYSBzdHJlYW0gb2YgdmlydHVhbCBET00gb2JqZWN0cywgb3IgaW4gb3RoZXIgd29yZHMsXG4gKiBTbmFiYmRvbSBcIlZOb2RlXCIgb2JqZWN0cy4gVGhlIG91dHB1dCBvZiB0aGlzIGRyaXZlciBpcyBhIFwiRE9NU291cmNlXCI6IGFcbiAqIGNvbGxlY3Rpb24gb2YgT2JzZXJ2YWJsZXMgcXVlcmllZCB3aXRoIHRoZSBtZXRob2RzIGBzZWxlY3QoKWAgYW5kIGBldmVudHMoKWAuXG4gKlxuICogYERPTVNvdXJjZS5zZWxlY3Qoc2VsZWN0b3IpYCByZXR1cm5zIGEgbmV3IERPTVNvdXJjZSB3aXRoIHNjb3BlIHJlc3RyaWN0ZWQgdG9cbiAqIHRoZSBlbGVtZW50KHMpIHRoYXQgbWF0Y2hlcyB0aGUgQ1NTIGBzZWxlY3RvcmAgZ2l2ZW4uXG4gKlxuICogYERPTVNvdXJjZS5ldmVudHMoZXZlbnRUeXBlLCBvcHRpb25zKWAgcmV0dXJucyBhIHN0cmVhbSBvZiBldmVudHMgb2ZcbiAqIGBldmVudFR5cGVgIGhhcHBlbmluZyBvbiB0aGUgZWxlbWVudHMgdGhhdCBtYXRjaCB0aGUgY3VycmVudCBET01Tb3VyY2UuIFRoZVxuICogZXZlbnQgb2JqZWN0IGNvbnRhaW5zIHRoZSBgb3duZXJUYXJnZXRgIHByb3BlcnR5IHRoYXQgYmVoYXZlcyBleGFjdGx5IGxpa2VcbiAqIGBjdXJyZW50VGFyZ2V0YC4gVGhlIHJlYXNvbiBmb3IgdGhpcyBpcyB0aGF0IHNvbWUgYnJvd3NlcnMgZG9lc24ndCBhbGxvd1xuICogYGN1cnJlbnRUYXJnZXRgIHByb3BlcnR5IHRvIGJlIG11dGF0ZWQsIGhlbmNlIGEgbmV3IHByb3BlcnR5IGlzIGNyZWF0ZWQuIFRoZVxuICogcmV0dXJuZWQgc3RyZWFtIGlzIGFuICp4c3RyZWFtKiBTdHJlYW0gaWYgeW91IHVzZSBgQGN5Y2xlL3hzdHJlYW0tcnVuYCB0byBydW5cbiAqIHlvdXIgYXBwIHdpdGggdGhpcyBkcml2ZXIsIG9yIGl0IGlzIGFuIFJ4SlMgT2JzZXJ2YWJsZSBpZiB5b3UgdXNlXG4gKiBgQGN5Y2xlL3J4anMtcnVuYCwgYW5kIHNvIGZvcnRoLiBUaGUgYG9wdGlvbnNgIHBhcmFtZXRlciBjYW4gaGF2ZSB0aGVcbiAqIHByb3BlcnR5IGB1c2VDYXB0dXJlYCwgd2hpY2ggaXMgYnkgZGVmYXVsdCBgZmFsc2VgLCBleGNlcHQgaXQgaXMgYHRydWVgIGZvclxuICogZXZlbnQgdHlwZXMgdGhhdCBkbyBub3QgYnViYmxlLiBSZWFkIG1vcmUgaGVyZVxuICogaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0V2ZW50VGFyZ2V0L2FkZEV2ZW50TGlzdGVuZXJcbiAqIGFib3V0IHRoZSBgdXNlQ2FwdHVyZWAgYW5kIGl0cyBwdXJwb3NlLlxuICogVGhlIG90aGVyIG9wdGlvbiBpcyBgcHJldmVudERlZmF1bHRgIHRoYXQgaXMgc2V0IHRvIGZhbHNlIGJ5IGRlZmF1bHQuXG4gKiBJZiBzZXQgdG8gdHJ1ZSwgdGhlIGRyaXZlciB3aWxsIGF1dG9tYXRpY2FsbHkgY2FsbCBgcHJldmVudERlZmF1bHQoKWAgb24gZXZlcnkgZXZlbnQuXG4gKlxuICogYERPTVNvdXJjZS5lbGVtZW50cygpYCByZXR1cm5zIGEgc3RyZWFtIG9mIHRoZSBET00gZWxlbWVudChzKSBtYXRjaGVkIGJ5IHRoZVxuICogc2VsZWN0b3JzIGluIHRoZSBET01Tb3VyY2UuIEFsc28sIGBET01Tb3VyY2Uuc2VsZWN0KCc6cm9vdCcpLmVsZW1lbnRzKClgXG4gKiByZXR1cm5zIGEgc3RyZWFtIG9mIERPTSBlbGVtZW50IGNvcnJlc3BvbmRpbmcgdG8gdGhlIHJvb3QgKG9yIGNvbnRhaW5lcikgb2ZcbiAqIHRoZSBhcHAgb24gdGhlIERPTS5cbiAqXG4gKiBAcGFyYW0geyhTdHJpbmd8SFRNTEVsZW1lbnQpfSBjb250YWluZXIgdGhlIERPTSBzZWxlY3RvciBmb3IgdGhlIGVsZW1lbnRcbiAqIChvciB0aGUgZWxlbWVudCBpdHNlbGYpIHRvIGNvbnRhaW4gdGhlIHJlbmRlcmluZyBvZiB0aGUgVlRyZWVzLlxuICogQHBhcmFtIHtET01Ecml2ZXJPcHRpb25zfSBvcHRpb25zIGFuIG9iamVjdCB3aXRoIHR3byBvcHRpb25hbCBwcm9wZXJ0aWVzOlxuICpcbiAqICAgLSBgbW9kdWxlczogYXJyYXlgIG92ZXJyaWRlcyBgQGN5Y2xlL2RvbWAncyBkZWZhdWx0IFNuYWJiZG9tIG1vZHVsZXMgYXNcbiAqICAgICBhcyBkZWZpbmVkIGluIFtgc3JjL21vZHVsZXMudHNgXSguL3NyYy9tb2R1bGVzLnRzKS5cbiAqICAgLSBgdHJhbnNwb3NpdGlvbjogYm9vbGVhbmAgZW5hYmxlcy9kaXNhYmxlcyB0cmFuc3Bvc2l0aW9uIG9mIGlubmVyIHN0cmVhbXNcbiAqICAgICBpbiB0aGUgdmlydHVhbCBET00gdHJlZS5cbiAqIEByZXR1cm4ge0Z1bmN0aW9ufSB0aGUgRE9NIGRyaXZlciBmdW5jdGlvbi4gVGhlIGZ1bmN0aW9uIGV4cGVjdHMgYSBzdHJlYW0gb2ZcbiAqIFZOb2RlIGFzIGlucHV0LCBhbmQgb3V0cHV0cyB0aGUgRE9NU291cmNlIG9iamVjdC5cbiAqIEBmdW5jdGlvbiBtYWtlRE9NRHJpdmVyXG4gKi9cbnZhciBtYWtlRE9NRHJpdmVyXzEgPSByZXF1aXJlKFwiLi9tYWtlRE9NRHJpdmVyXCIpO1xuZXhwb3J0cy5tYWtlRE9NRHJpdmVyID0gbWFrZURPTURyaXZlcl8xLm1ha2VET01Ecml2ZXI7XG4vKipcbiAqIEEgZmFjdG9yeSBmdW5jdGlvbiB0byBjcmVhdGUgbW9ja2VkIERPTVNvdXJjZSBvYmplY3RzLCBmb3IgdGVzdGluZyBwdXJwb3Nlcy5cbiAqXG4gKiBUYWtlcyBhIGBtb2NrQ29uZmlnYCBvYmplY3QgYXMgYXJndW1lbnQsIGFuZCByZXR1cm5zXG4gKiBhIERPTVNvdXJjZSB0aGF0IGNhbiBiZSBnaXZlbiB0byBhbnkgQ3ljbGUuanMgYXBwIHRoYXQgZXhwZWN0cyBhIERPTVNvdXJjZSBpblxuICogdGhlIHNvdXJjZXMsIGZvciB0ZXN0aW5nLlxuICpcbiAqIFRoZSBgbW9ja0NvbmZpZ2AgcGFyYW1ldGVyIGlzIGFuIG9iamVjdCBzcGVjaWZ5aW5nIHNlbGVjdG9ycywgZXZlbnRUeXBlcyBhbmRcbiAqIHRoZWlyIHN0cmVhbXMuIEV4YW1wbGU6XG4gKlxuICogYGBganNcbiAqIGNvbnN0IGRvbVNvdXJjZSA9IG1vY2tET01Tb3VyY2Uoe1xuICogICAnLmZvbyc6IHtcbiAqICAgICAnY2xpY2snOiB4cy5vZih7dGFyZ2V0OiB7fX0pLFxuICogICAgICdtb3VzZW92ZXInOiB4cy5vZih7dGFyZ2V0OiB7fX0pLFxuICogICB9LFxuICogICAnLmJhcic6IHtcbiAqICAgICAnc2Nyb2xsJzogeHMub2Yoe3RhcmdldDoge319KSxcbiAqICAgICBlbGVtZW50czogeHMub2Yoe3RhZ05hbWU6ICdkaXYnfSksXG4gKiAgIH1cbiAqIH0pO1xuICpcbiAqIC8vIFVzYWdlXG4gKiBjb25zdCBjbGljayQgPSBkb21Tb3VyY2Uuc2VsZWN0KCcuZm9vJykuZXZlbnRzKCdjbGljaycpO1xuICogY29uc3QgZWxlbWVudCQgPSBkb21Tb3VyY2Uuc2VsZWN0KCcuYmFyJykuZWxlbWVudHMoKTtcbiAqIGBgYFxuICpcbiAqIFRoZSBtb2NrZWQgRE9NIFNvdXJjZSBzdXBwb3J0cyBpc29sYXRpb24uIEl0IGhhcyB0aGUgZnVuY3Rpb25zIGBpc29sYXRlU2lua2BcbiAqIGFuZCBgaXNvbGF0ZVNvdXJjZWAgYXR0YWNoZWQgdG8gaXQsIGFuZCBwZXJmb3JtcyBzaW1wbGUgaXNvbGF0aW9uIHVzaW5nXG4gKiBjbGFzc05hbWVzLiAqaXNvbGF0ZVNpbmsqIHdpdGggc2NvcGUgYGZvb2Agd2lsbCBhcHBlbmQgdGhlIGNsYXNzIGBfX19mb29gIHRvXG4gKiB0aGUgc3RyZWFtIG9mIHZpcnR1YWwgRE9NIG5vZGVzLCBhbmQgKmlzb2xhdGVTb3VyY2UqIHdpdGggc2NvcGUgYGZvb2Agd2lsbFxuICogcGVyZm9ybSBhIGNvbnZlbnRpb25hbCBgbW9ja2VkRE9NU291cmNlLnNlbGVjdCgnLl9fZm9vJylgIGNhbGwuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG1vY2tDb25maWcgYW4gb2JqZWN0IHdoZXJlIGtleXMgYXJlIHNlbGVjdG9yIHN0cmluZ3NcbiAqIGFuZCB2YWx1ZXMgYXJlIG9iamVjdHMuIFRob3NlIG5lc3RlZCBvYmplY3RzIGhhdmUgYGV2ZW50VHlwZWAgc3RyaW5ncyBhcyBrZXlzXG4gKiBhbmQgdmFsdWVzIGFyZSBzdHJlYW1zIHlvdSBjcmVhdGVkLlxuICogQHJldHVybiB7T2JqZWN0fSBmYWtlIERPTSBzb3VyY2Ugb2JqZWN0LCB3aXRoIGFuIEFQSSBjb250YWluaW5nIGBzZWxlY3QoKWBcbiAqIGFuZCBgZXZlbnRzKClgIGFuZCBgZWxlbWVudHMoKWAgd2hpY2ggY2FuIGJlIHVzZWQganVzdCBsaWtlIHRoZSBET00gRHJpdmVyJ3NcbiAqIERPTVNvdXJjZS5cbiAqXG4gKiBAZnVuY3Rpb24gbW9ja0RPTVNvdXJjZVxuICovXG52YXIgbW9ja0RPTVNvdXJjZV8xID0gcmVxdWlyZShcIi4vbW9ja0RPTVNvdXJjZVwiKTtcbmV4cG9ydHMubW9ja0RPTVNvdXJjZSA9IG1vY2tET01Tb3VyY2VfMS5tb2NrRE9NU291cmNlO1xuZXhwb3J0cy5Nb2NrZWRET01Tb3VyY2UgPSBtb2NrRE9NU291cmNlXzEuTW9ja2VkRE9NU291cmNlO1xuLyoqXG4gKiBUaGUgaHlwZXJzY3JpcHQgZnVuY3Rpb24gYGgoKWAgaXMgYSBmdW5jdGlvbiB0byBjcmVhdGUgdmlydHVhbCBET00gb2JqZWN0cyxcbiAqIGFsc28ga25vd24gYXMgVk5vZGVzLiBDYWxsXG4gKlxuICogYGBganNcbiAqIGgoJ2Rpdi5teUNsYXNzJywge3N0eWxlOiB7Y29sb3I6ICdyZWQnfX0sIFtdKVxuICogYGBgXG4gKlxuICogdG8gY3JlYXRlIGEgVk5vZGUgdGhhdCByZXByZXNlbnRzIGEgYERJVmAgZWxlbWVudCB3aXRoIGNsYXNzTmFtZSBgbXlDbGFzc2AsXG4gKiBzdHlsZWQgd2l0aCByZWQgY29sb3IsIGFuZCBubyBjaGlsZHJlbiBiZWNhdXNlIHRoZSBgW11gIGFycmF5IHdhcyBwYXNzZWQuIFRoZVxuICogQVBJIGlzIGBoKHRhZ09yU2VsZWN0b3IsIG9wdGlvbmFsRGF0YSwgb3B0aW9uYWxDaGlsZHJlbk9yVGV4dClgLlxuICpcbiAqIEhvd2V2ZXIsIHVzdWFsbHkgeW91IHNob3VsZCB1c2UgXCJoeXBlcnNjcmlwdCBoZWxwZXJzXCIsIHdoaWNoIGFyZSBzaG9ydGN1dFxuICogZnVuY3Rpb25zIGJhc2VkIG9uIGh5cGVyc2NyaXB0LiBUaGVyZSBpcyBvbmUgaHlwZXJzY3JpcHQgaGVscGVyIGZ1bmN0aW9uIGZvclxuICogZWFjaCBET00gdGFnTmFtZSwgc3VjaCBhcyBgaDEoKWAsIGBoMigpYCwgYGRpdigpYCwgYHNwYW4oKWAsIGBsYWJlbCgpYCxcbiAqIGBpbnB1dCgpYC4gRm9yIGluc3RhbmNlLCB0aGUgcHJldmlvdXMgZXhhbXBsZSBjb3VsZCBoYXZlIGJlZW4gd3JpdHRlblxuICogYXM6XG4gKlxuICogYGBganNcbiAqIGRpdignLm15Q2xhc3MnLCB7c3R5bGU6IHtjb2xvcjogJ3JlZCd9fSwgW10pXG4gKiBgYGBcbiAqXG4gKiBUaGVyZSBhcmUgYWxzbyBTVkcgaGVscGVyIGZ1bmN0aW9ucywgd2hpY2ggYXBwbHkgdGhlIGFwcHJvcHJpYXRlIFNWR1xuICogbmFtZXNwYWNlIHRvIHRoZSByZXN1bHRpbmcgZWxlbWVudHMuIGBzdmcoKWAgZnVuY3Rpb24gY3JlYXRlcyB0aGUgdG9wLW1vc3RcbiAqIFNWRyBlbGVtZW50LCBhbmQgYHN2Zy5nYCwgYHN2Zy5wb2x5Z29uYCwgYHN2Zy5jaXJjbGVgLCBgc3ZnLnBhdGhgIGFyZSBmb3JcbiAqIFNWRy1zcGVjaWZpYyBjaGlsZCBlbGVtZW50cy4gRXhhbXBsZTpcbiAqXG4gKiBgYGBqc1xuICogc3ZnKHthdHRyczoge3dpZHRoOiAxNTAsIGhlaWdodDogMTUwfX0sIFtcbiAqICAgc3ZnLnBvbHlnb24oe1xuICogICAgIGF0dHJzOiB7XG4gKiAgICAgICBjbGFzczogJ3RyaWFuZ2xlJyxcbiAqICAgICAgIHBvaW50czogJzIwIDAgMjAgMTUwIDE1MCAyMCdcbiAqICAgICB9XG4gKiAgIH0pXG4gKiBdKVxuICogYGBgXG4gKlxuICogQGZ1bmN0aW9uIGhcbiAqL1xudmFyIGhfMSA9IHJlcXVpcmUoXCJzbmFiYmRvbS9oXCIpO1xuZXhwb3J0cy5oID0gaF8xLmg7XG52YXIgaHlwZXJzY3JpcHRfaGVscGVyc18xID0gcmVxdWlyZShcIi4vaHlwZXJzY3JpcHQtaGVscGVyc1wiKTtcbmV4cG9ydHMuc3ZnID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuc3ZnO1xuZXhwb3J0cy5hID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuYTtcbmV4cG9ydHMuYWJiciA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmFiYnI7XG5leHBvcnRzLmFkZHJlc3MgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5hZGRyZXNzO1xuZXhwb3J0cy5hcmVhID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuYXJlYTtcbmV4cG9ydHMuYXJ0aWNsZSA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmFydGljbGU7XG5leHBvcnRzLmFzaWRlID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuYXNpZGU7XG5leHBvcnRzLmF1ZGlvID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuYXVkaW87XG5leHBvcnRzLmIgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5iO1xuZXhwb3J0cy5iYXNlID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuYmFzZTtcbmV4cG9ydHMuYmRpID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuYmRpO1xuZXhwb3J0cy5iZG8gPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5iZG87XG5leHBvcnRzLmJsb2NrcXVvdGUgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5ibG9ja3F1b3RlO1xuZXhwb3J0cy5ib2R5ID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuYm9keTtcbmV4cG9ydHMuYnIgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5icjtcbmV4cG9ydHMuYnV0dG9uID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuYnV0dG9uO1xuZXhwb3J0cy5jYW52YXMgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5jYW52YXM7XG5leHBvcnRzLmNhcHRpb24gPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5jYXB0aW9uO1xuZXhwb3J0cy5jaXRlID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuY2l0ZTtcbmV4cG9ydHMuY29kZSA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmNvZGU7XG5leHBvcnRzLmNvbCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmNvbDtcbmV4cG9ydHMuY29sZ3JvdXAgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5jb2xncm91cDtcbmV4cG9ydHMuZGQgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5kZDtcbmV4cG9ydHMuZGVsID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuZGVsO1xuZXhwb3J0cy5kZm4gPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5kZm47XG5leHBvcnRzLmRpciA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmRpcjtcbmV4cG9ydHMuZGl2ID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuZGl2O1xuZXhwb3J0cy5kbCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmRsO1xuZXhwb3J0cy5kdCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmR0O1xuZXhwb3J0cy5lbSA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmVtO1xuZXhwb3J0cy5lbWJlZCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmVtYmVkO1xuZXhwb3J0cy5maWVsZHNldCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmZpZWxkc2V0O1xuZXhwb3J0cy5maWdjYXB0aW9uID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuZmlnY2FwdGlvbjtcbmV4cG9ydHMuZmlndXJlID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuZmlndXJlO1xuZXhwb3J0cy5mb290ZXIgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5mb290ZXI7XG5leHBvcnRzLmZvcm0gPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5mb3JtO1xuZXhwb3J0cy5oMSA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmgxO1xuZXhwb3J0cy5oMiA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmgyO1xuZXhwb3J0cy5oMyA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmgzO1xuZXhwb3J0cy5oNCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0Lmg0O1xuZXhwb3J0cy5oNSA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0Lmg1O1xuZXhwb3J0cy5oNiA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0Lmg2O1xuZXhwb3J0cy5oZWFkID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuaGVhZDtcbmV4cG9ydHMuaGVhZGVyID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuaGVhZGVyO1xuZXhwb3J0cy5oZ3JvdXAgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5oZ3JvdXA7XG5leHBvcnRzLmhyID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuaHI7XG5leHBvcnRzLmh0bWwgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5odG1sO1xuZXhwb3J0cy5pID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuaTtcbmV4cG9ydHMuaWZyYW1lID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuaWZyYW1lO1xuZXhwb3J0cy5pbWcgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5pbWc7XG5leHBvcnRzLmlucHV0ID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuaW5wdXQ7XG5leHBvcnRzLmlucyA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmlucztcbmV4cG9ydHMua2JkID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQua2JkO1xuZXhwb3J0cy5rZXlnZW4gPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5rZXlnZW47XG5leHBvcnRzLmxhYmVsID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQubGFiZWw7XG5leHBvcnRzLmxlZ2VuZCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmxlZ2VuZDtcbmV4cG9ydHMubGkgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5saTtcbmV4cG9ydHMubGluayA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0Lmxpbms7XG5leHBvcnRzLm1haW4gPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5tYWluO1xuZXhwb3J0cy5tYXAgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5tYXA7XG5leHBvcnRzLm1hcmsgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5tYXJrO1xuZXhwb3J0cy5tZW51ID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQubWVudTtcbmV4cG9ydHMubWV0YSA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0Lm1ldGE7XG5leHBvcnRzLm5hdiA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0Lm5hdjtcbmV4cG9ydHMubm9zY3JpcHQgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5ub3NjcmlwdDtcbmV4cG9ydHMub2JqZWN0ID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQub2JqZWN0O1xuZXhwb3J0cy5vbCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0Lm9sO1xuZXhwb3J0cy5vcHRncm91cCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0Lm9wdGdyb3VwO1xuZXhwb3J0cy5vcHRpb24gPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5vcHRpb247XG5leHBvcnRzLnAgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5wO1xuZXhwb3J0cy5wYXJhbSA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnBhcmFtO1xuZXhwb3J0cy5wcmUgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5wcmU7XG5leHBvcnRzLnByb2dyZXNzID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQucHJvZ3Jlc3M7XG5leHBvcnRzLnEgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5xO1xuZXhwb3J0cy5ycCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnJwO1xuZXhwb3J0cy5ydCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnJ0O1xuZXhwb3J0cy5ydWJ5ID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQucnVieTtcbmV4cG9ydHMucyA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnM7XG5leHBvcnRzLnNhbXAgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5zYW1wO1xuZXhwb3J0cy5zY3JpcHQgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5zY3JpcHQ7XG5leHBvcnRzLnNlY3Rpb24gPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5zZWN0aW9uO1xuZXhwb3J0cy5zZWxlY3QgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5zZWxlY3Q7XG5leHBvcnRzLnNtYWxsID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuc21hbGw7XG5leHBvcnRzLnNvdXJjZSA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnNvdXJjZTtcbmV4cG9ydHMuc3BhbiA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnNwYW47XG5leHBvcnRzLnN0cm9uZyA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnN0cm9uZztcbmV4cG9ydHMuc3R5bGUgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5zdHlsZTtcbmV4cG9ydHMuc3ViID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuc3ViO1xuZXhwb3J0cy5zdXAgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5zdXA7XG5leHBvcnRzLnRhYmxlID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQudGFibGU7XG5leHBvcnRzLnRib2R5ID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQudGJvZHk7XG5leHBvcnRzLnRkID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQudGQ7XG5leHBvcnRzLnRleHRhcmVhID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQudGV4dGFyZWE7XG5leHBvcnRzLnRmb290ID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQudGZvb3Q7XG5leHBvcnRzLnRoID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQudGg7XG5leHBvcnRzLnRoZWFkID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQudGhlYWQ7XG5leHBvcnRzLnRpdGxlID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQudGl0bGU7XG5leHBvcnRzLnRyID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQudHI7XG5leHBvcnRzLnUgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC51O1xuZXhwb3J0cy51bCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnVsO1xuZXhwb3J0cy52aWRlbyA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnZpZGVvO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aW5kZXguanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgdm5vZGVfMSA9IHJlcXVpcmUoXCJzbmFiYmRvbS92bm9kZVwiKTtcbnZhciB1dGlsc18xID0gcmVxdWlyZShcIi4vdXRpbHNcIik7XG5mdW5jdGlvbiB0b3RhbElzb2xhdGVTb3VyY2Uoc291cmNlLCBzY29wZSkge1xuICAgIHJldHVybiBzb3VyY2Uuc2VsZWN0KHV0aWxzXzEuU0NPUEVfUFJFRklYICsgc2NvcGUpO1xufVxuZnVuY3Rpb24gc2libGluZ0lzb2xhdGVTb3VyY2Uoc291cmNlLCBzY29wZSkge1xuICAgIHJldHVybiBzb3VyY2Uuc2VsZWN0KHNjb3BlKTtcbn1cbmZ1bmN0aW9uIGlzb2xhdGVTb3VyY2Uoc291cmNlLCBzY29wZSkge1xuICAgIGlmIChzY29wZSA9PT0gJzpyb290Jykge1xuICAgICAgICByZXR1cm4gc291cmNlO1xuICAgIH1cbiAgICBlbHNlIGlmICh1dGlsc18xLmlzQ2xhc3NPcklkKHNjb3BlKSkge1xuICAgICAgICByZXR1cm4gc2libGluZ0lzb2xhdGVTb3VyY2Uoc291cmNlLCBzY29wZSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICByZXR1cm4gdG90YWxJc29sYXRlU291cmNlKHNvdXJjZSwgc2NvcGUpO1xuICAgIH1cbn1cbmV4cG9ydHMuaXNvbGF0ZVNvdXJjZSA9IGlzb2xhdGVTb3VyY2U7XG5mdW5jdGlvbiBzaWJsaW5nSXNvbGF0ZVNpbmsoc2luaywgc2NvcGUpIHtcbiAgICByZXR1cm4gc2luay5tYXAoZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgICAgcmV0dXJuIG5vZGVcbiAgICAgICAgICAgID8gdm5vZGVfMS52bm9kZShub2RlLnNlbCArIHNjb3BlLCBub2RlLmRhdGEsIG5vZGUuY2hpbGRyZW4sIG5vZGUudGV4dCwgbm9kZS5lbG0pXG4gICAgICAgICAgICA6IG5vZGU7XG4gICAgfSk7XG59XG5leHBvcnRzLnNpYmxpbmdJc29sYXRlU2luayA9IHNpYmxpbmdJc29sYXRlU2luaztcbmZ1bmN0aW9uIHRvdGFsSXNvbGF0ZVNpbmsoc2luaywgZnVsbFNjb3BlKSB7XG4gICAgcmV0dXJuIHNpbmsubWFwKGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuIG5vZGU7XG4gICAgICAgIH1cbiAgICAgICAgLy8gSWdub3JlIGlmIGFscmVhZHkgaGFkIHVwLXRvLWRhdGUgZnVsbCBzY29wZSBpbiB2bm9kZS5kYXRhLmlzb2xhdGVcbiAgICAgICAgaWYgKG5vZGUuZGF0YSAmJiBub2RlLmRhdGEuaXNvbGF0ZSkge1xuICAgICAgICAgICAgdmFyIGlzb2xhdGVEYXRhID0gbm9kZS5kYXRhLmlzb2xhdGU7XG4gICAgICAgICAgICB2YXIgcHJldkZ1bGxTY29wZU51bSA9IGlzb2xhdGVEYXRhLnJlcGxhY2UoLyhjeWNsZXxcXC0pL2csICcnKTtcbiAgICAgICAgICAgIHZhciBmdWxsU2NvcGVOdW0gPSBmdWxsU2NvcGUucmVwbGFjZSgvKGN5Y2xlfFxcLSkvZywgJycpO1xuICAgICAgICAgICAgaWYgKGlzTmFOKHBhcnNlSW50KHByZXZGdWxsU2NvcGVOdW0pKSB8fFxuICAgICAgICAgICAgICAgIGlzTmFOKHBhcnNlSW50KGZ1bGxTY29wZU51bSkpIHx8XG4gICAgICAgICAgICAgICAgcHJldkZ1bGxTY29wZU51bSA+IGZ1bGxTY29wZU51bSkge1xuICAgICAgICAgICAgICAgIC8vID4gaXMgbGV4aWNvZ3JhcGhpYyBzdHJpbmcgY29tcGFyaXNvblxuICAgICAgICAgICAgICAgIHJldHVybiBub2RlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIEluc2VydCB1cC10by1kYXRlIGZ1bGwgc2NvcGUgaW4gdm5vZGUuZGF0YS5pc29sYXRlLCBhbmQgYWxzbyBhIGtleSBpZiBuZWVkZWRcbiAgICAgICAgbm9kZS5kYXRhID0gbm9kZS5kYXRhIHx8IHt9O1xuICAgICAgICBub2RlLmRhdGEuaXNvbGF0ZSA9IGZ1bGxTY29wZTtcbiAgICAgICAgaWYgKHR5cGVvZiBub2RlLmtleSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIG5vZGUua2V5ID0gdXRpbHNfMS5TQ09QRV9QUkVGSVggKyBmdWxsU2NvcGU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5vZGU7XG4gICAgfSk7XG59XG5leHBvcnRzLnRvdGFsSXNvbGF0ZVNpbmsgPSB0b3RhbElzb2xhdGVTaW5rO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aXNvbGF0ZS5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBzbmFiYmRvbV8xID0gcmVxdWlyZShcInNuYWJiZG9tXCIpO1xudmFyIHhzdHJlYW1fMSA9IHJlcXVpcmUoXCJ4c3RyZWFtXCIpO1xudmFyIE1haW5ET01Tb3VyY2VfMSA9IHJlcXVpcmUoXCIuL01haW5ET01Tb3VyY2VcIik7XG52YXIgdG92bm9kZV8xID0gcmVxdWlyZShcInNuYWJiZG9tL3Rvdm5vZGVcIik7XG52YXIgVk5vZGVXcmFwcGVyXzEgPSByZXF1aXJlKFwiLi9WTm9kZVdyYXBwZXJcIik7XG52YXIgdXRpbHNfMSA9IHJlcXVpcmUoXCIuL3V0aWxzXCIpO1xudmFyIG1vZHVsZXNfMSA9IHJlcXVpcmUoXCIuL21vZHVsZXNcIik7XG52YXIgSXNvbGF0ZU1vZHVsZV8xID0gcmVxdWlyZShcIi4vSXNvbGF0ZU1vZHVsZVwiKTtcbnZhciBNYXBQb2x5ZmlsbCA9IHJlcXVpcmUoXCJlczYtbWFwXCIpO1xuZnVuY3Rpb24gbWFrZURPTURyaXZlcklucHV0R3VhcmQobW9kdWxlcykge1xuICAgIGlmICghQXJyYXkuaXNBcnJheShtb2R1bGVzKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJPcHRpb25hbCBtb2R1bGVzIG9wdGlvbiBtdXN0IGJlIFwiICsgXCJhbiBhcnJheSBmb3Igc25hYmJkb20gbW9kdWxlc1wiKTtcbiAgICB9XG59XG5mdW5jdGlvbiBkb21Ecml2ZXJJbnB1dEd1YXJkKHZpZXckKSB7XG4gICAgaWYgKCF2aWV3JCB8fFxuICAgICAgICB0eXBlb2YgdmlldyQuYWRkTGlzdGVuZXIgIT09IFwiZnVuY3Rpb25cIiB8fFxuICAgICAgICB0eXBlb2YgdmlldyQuZm9sZCAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlRoZSBET00gZHJpdmVyIGZ1bmN0aW9uIGV4cGVjdHMgYXMgaW5wdXQgYSBTdHJlYW0gb2YgXCIgK1xuICAgICAgICAgICAgXCJ2aXJ0dWFsIERPTSBlbGVtZW50c1wiKTtcbiAgICB9XG59XG5mdW5jdGlvbiBkcm9wQ29tcGxldGlvbihpbnB1dCkge1xuICAgIHJldHVybiB4c3RyZWFtXzEuZGVmYXVsdC5tZXJnZShpbnB1dCwgeHN0cmVhbV8xLmRlZmF1bHQubmV2ZXIoKSk7XG59XG5mdW5jdGlvbiB1bndyYXBFbGVtZW50RnJvbVZOb2RlKHZub2RlKSB7XG4gICAgcmV0dXJuIHZub2RlLmVsbTtcbn1cbmZ1bmN0aW9uIHJlcG9ydFNuYWJiZG9tRXJyb3IoZXJyKSB7XG4gICAgKGNvbnNvbGUuZXJyb3IgfHwgY29uc29sZS5sb2cpKGVycik7XG59XG5mdW5jdGlvbiBtYWtlRE9NRHJpdmVyKGNvbnRhaW5lciwgb3B0aW9ucykge1xuICAgIGlmICghb3B0aW9ucykge1xuICAgICAgICBvcHRpb25zID0ge307XG4gICAgfVxuICAgIHZhciBtb2R1bGVzID0gb3B0aW9ucy5tb2R1bGVzIHx8IG1vZHVsZXNfMS5kZWZhdWx0O1xuICAgIHZhciBpc29sYXRlTW9kdWxlID0gbmV3IElzb2xhdGVNb2R1bGVfMS5Jc29sYXRlTW9kdWxlKCk7XG4gICAgdmFyIHBhdGNoID0gc25hYmJkb21fMS5pbml0KFtpc29sYXRlTW9kdWxlLmNyZWF0ZU1vZHVsZSgpXS5jb25jYXQobW9kdWxlcykpO1xuICAgIHZhciByb290RWxlbWVudCA9IHV0aWxzXzEuZ2V0VmFsaWROb2RlKGNvbnRhaW5lcikgfHwgZG9jdW1lbnQuYm9keTtcbiAgICB2YXIgdm5vZGVXcmFwcGVyID0gbmV3IFZOb2RlV3JhcHBlcl8xLlZOb2RlV3JhcHBlcihyb290RWxlbWVudCk7XG4gICAgdmFyIGRlbGVnYXRvcnMgPSBuZXcgTWFwUG9seWZpbGwoKTtcbiAgICBtYWtlRE9NRHJpdmVySW5wdXRHdWFyZChtb2R1bGVzKTtcbiAgICBmdW5jdGlvbiBET01Ecml2ZXIodm5vZGUkLCBuYW1lKSB7XG4gICAgICAgIGlmIChuYW1lID09PSB2b2lkIDApIHsgbmFtZSA9ICdET00nOyB9XG4gICAgICAgIGRvbURyaXZlcklucHV0R3VhcmQodm5vZGUkKTtcbiAgICAgICAgdmFyIHNhbml0YXRpb24kID0geHN0cmVhbV8xLmRlZmF1bHQuY3JlYXRlKCk7XG4gICAgICAgIHZhciByb290RWxlbWVudCQgPSB4c3RyZWFtXzEuZGVmYXVsdFxuICAgICAgICAgICAgLm1lcmdlKHZub2RlJC5lbmRXaGVuKHNhbml0YXRpb24kKSwgc2FuaXRhdGlvbiQpXG4gICAgICAgICAgICAubWFwKGZ1bmN0aW9uICh2bm9kZSkgeyByZXR1cm4gdm5vZGVXcmFwcGVyLmNhbGwodm5vZGUpOyB9KVxuICAgICAgICAgICAgLmZvbGQocGF0Y2gsIHRvdm5vZGVfMS50b1ZOb2RlKHJvb3RFbGVtZW50KSlcbiAgICAgICAgICAgIC5kcm9wKDEpXG4gICAgICAgICAgICAubWFwKHVud3JhcEVsZW1lbnRGcm9tVk5vZGUpXG4gICAgICAgICAgICAuY29tcG9zZShkcm9wQ29tcGxldGlvbikgLy8gZG9uJ3QgY29tcGxldGUgdGhpcyBzdHJlYW1cbiAgICAgICAgICAgIC5zdGFydFdpdGgocm9vdEVsZW1lbnQpO1xuICAgICAgICAvLyBTdGFydCB0aGUgc25hYmJkb20gcGF0Y2hpbmcsIG92ZXIgdGltZVxuICAgICAgICB2YXIgbGlzdGVuZXIgPSB7IGVycm9yOiByZXBvcnRTbmFiYmRvbUVycm9yIH07XG4gICAgICAgIGlmIChkb2N1bWVudC5yZWFkeVN0YXRlID09PSAnbG9hZGluZycpIHtcbiAgICAgICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3JlYWR5c3RhdGVjaGFuZ2UnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKGRvY3VtZW50LnJlYWR5U3RhdGUgPT09ICdpbnRlcmFjdGl2ZScpIHtcbiAgICAgICAgICAgICAgICAgICAgcm9vdEVsZW1lbnQkLmFkZExpc3RlbmVyKGxpc3RlbmVyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJvb3RFbGVtZW50JC5hZGRMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5ldyBNYWluRE9NU291cmNlXzEuTWFpbkRPTVNvdXJjZShyb290RWxlbWVudCQsIHNhbml0YXRpb24kLCBbXSwgaXNvbGF0ZU1vZHVsZSwgZGVsZWdhdG9ycywgbmFtZSk7XG4gICAgfVxuICAgIHJldHVybiBET01Ecml2ZXI7XG59XG5leHBvcnRzLm1ha2VET01Ecml2ZXIgPSBtYWtlRE9NRHJpdmVyO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9bWFrZURPTURyaXZlci5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmZ1bmN0aW9uIGNyZWF0ZU1hdGNoZXNTZWxlY3RvcigpIHtcbiAgICB2YXIgdmVuZG9yO1xuICAgIHRyeSB7XG4gICAgICAgIHZhciBwcm90byA9IEVsZW1lbnQucHJvdG90eXBlO1xuICAgICAgICB2ZW5kb3IgPVxuICAgICAgICAgICAgcHJvdG8ubWF0Y2hlcyB8fFxuICAgICAgICAgICAgICAgIHByb3RvLm1hdGNoZXNTZWxlY3RvciB8fFxuICAgICAgICAgICAgICAgIHByb3RvLndlYmtpdE1hdGNoZXNTZWxlY3RvciB8fFxuICAgICAgICAgICAgICAgIHByb3RvLm1vek1hdGNoZXNTZWxlY3RvciB8fFxuICAgICAgICAgICAgICAgIHByb3RvLm1zTWF0Y2hlc1NlbGVjdG9yIHx8XG4gICAgICAgICAgICAgICAgcHJvdG8ub01hdGNoZXNTZWxlY3RvcjtcbiAgICB9XG4gICAgY2F0Y2ggKGVycikge1xuICAgICAgICB2ZW5kb3IgPSBudWxsO1xuICAgIH1cbiAgICByZXR1cm4gZnVuY3Rpb24gbWF0Y2goZWxlbSwgc2VsZWN0b3IpIHtcbiAgICAgICAgaWYgKHNlbGVjdG9yLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHZlbmRvcikge1xuICAgICAgICAgICAgcmV0dXJuIHZlbmRvci5jYWxsKGVsZW0sIHNlbGVjdG9yKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgbm9kZXMgPSBlbGVtLnBhcmVudE5vZGUucXVlcnlTZWxlY3RvckFsbChzZWxlY3Rvcik7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChub2Rlc1tpXSA9PT0gZWxlbSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9O1xufVxuZXhwb3J0cy5tYXRjaGVzU2VsZWN0b3IgPSBjcmVhdGVNYXRjaGVzU2VsZWN0b3IoKTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPW1hdGNoZXNTZWxlY3Rvci5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB4c3RyZWFtXzEgPSByZXF1aXJlKFwieHN0cmVhbVwiKTtcbnZhciBhZGFwdF8xID0gcmVxdWlyZShcIkBjeWNsZS9ydW4vbGliL2FkYXB0XCIpO1xudmFyIFNDT1BFX1BSRUZJWCA9ICdfX18nO1xudmFyIE1vY2tlZERPTVNvdXJjZSA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gTW9ja2VkRE9NU291cmNlKF9tb2NrQ29uZmlnKSB7XG4gICAgICAgIHRoaXMuX21vY2tDb25maWcgPSBfbW9ja0NvbmZpZztcbiAgICAgICAgaWYgKF9tb2NrQ29uZmlnWydlbGVtZW50cyddKSB7XG4gICAgICAgICAgICB0aGlzLl9lbGVtZW50cyA9IF9tb2NrQ29uZmlnWydlbGVtZW50cyddO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fZWxlbWVudHMgPSBhZGFwdF8xLmFkYXB0KHhzdHJlYW1fMS5kZWZhdWx0LmVtcHR5KCkpO1xuICAgICAgICB9XG4gICAgfVxuICAgIE1vY2tlZERPTVNvdXJjZS5wcm90b3R5cGUuZWxlbWVudHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBvdXQgPSB0aGlzXG4gICAgICAgICAgICAuX2VsZW1lbnRzO1xuICAgICAgICBvdXQuX2lzQ3ljbGVTb3VyY2UgPSAnTW9ja2VkRE9NJztcbiAgICAgICAgcmV0dXJuIG91dDtcbiAgICB9O1xuICAgIE1vY2tlZERPTVNvdXJjZS5wcm90b3R5cGUuZXZlbnRzID0gZnVuY3Rpb24gKGV2ZW50VHlwZSwgb3B0aW9ucykge1xuICAgICAgICB2YXIgc3RyZWFtRm9yRXZlbnRUeXBlID0gdGhpcy5fbW9ja0NvbmZpZ1tldmVudFR5cGVdO1xuICAgICAgICB2YXIgb3V0ID0gYWRhcHRfMS5hZGFwdChzdHJlYW1Gb3JFdmVudFR5cGUgfHwgeHN0cmVhbV8xLmRlZmF1bHQuZW1wdHkoKSk7XG4gICAgICAgIG91dC5faXNDeWNsZVNvdXJjZSA9ICdNb2NrZWRET00nO1xuICAgICAgICByZXR1cm4gb3V0O1xuICAgIH07XG4gICAgTW9ja2VkRE9NU291cmNlLnByb3RvdHlwZS5zZWxlY3QgPSBmdW5jdGlvbiAoc2VsZWN0b3IpIHtcbiAgICAgICAgdmFyIG1vY2tDb25maWdGb3JTZWxlY3RvciA9IHRoaXMuX21vY2tDb25maWdbc2VsZWN0b3JdIHx8IHt9O1xuICAgICAgICByZXR1cm4gbmV3IE1vY2tlZERPTVNvdXJjZShtb2NrQ29uZmlnRm9yU2VsZWN0b3IpO1xuICAgIH07XG4gICAgTW9ja2VkRE9NU291cmNlLnByb3RvdHlwZS5pc29sYXRlU291cmNlID0gZnVuY3Rpb24gKHNvdXJjZSwgc2NvcGUpIHtcbiAgICAgICAgcmV0dXJuIHNvdXJjZS5zZWxlY3QoJy4nICsgU0NPUEVfUFJFRklYICsgc2NvcGUpO1xuICAgIH07XG4gICAgTW9ja2VkRE9NU291cmNlLnByb3RvdHlwZS5pc29sYXRlU2luayA9IGZ1bmN0aW9uIChzaW5rLCBzY29wZSkge1xuICAgICAgICByZXR1cm4gc2luay5tYXAoZnVuY3Rpb24gKHZub2RlKSB7XG4gICAgICAgICAgICBpZiAodm5vZGUuc2VsICYmIHZub2RlLnNlbC5pbmRleE9mKFNDT1BFX1BSRUZJWCArIHNjb3BlKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdm5vZGU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB2bm9kZS5zZWwgKz0gXCIuXCIgKyBTQ09QRV9QUkVGSVggKyBzY29wZTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdm5vZGU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgcmV0dXJuIE1vY2tlZERPTVNvdXJjZTtcbn0oKSk7XG5leHBvcnRzLk1vY2tlZERPTVNvdXJjZSA9IE1vY2tlZERPTVNvdXJjZTtcbmZ1bmN0aW9uIG1vY2tET01Tb3VyY2UobW9ja0NvbmZpZykge1xuICAgIHJldHVybiBuZXcgTW9ja2VkRE9NU291cmNlKG1vY2tDb25maWcpO1xufVxuZXhwb3J0cy5tb2NrRE9NU291cmNlID0gbW9ja0RPTVNvdXJjZTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPW1vY2tET01Tb3VyY2UuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgY2xhc3NfMSA9IHJlcXVpcmUoXCJzbmFiYmRvbS9tb2R1bGVzL2NsYXNzXCIpO1xuZXhwb3J0cy5DbGFzc01vZHVsZSA9IGNsYXNzXzEuZGVmYXVsdDtcbnZhciBwcm9wc18xID0gcmVxdWlyZShcInNuYWJiZG9tL21vZHVsZXMvcHJvcHNcIik7XG5leHBvcnRzLlByb3BzTW9kdWxlID0gcHJvcHNfMS5kZWZhdWx0O1xudmFyIGF0dHJpYnV0ZXNfMSA9IHJlcXVpcmUoXCJzbmFiYmRvbS9tb2R1bGVzL2F0dHJpYnV0ZXNcIik7XG5leHBvcnRzLkF0dHJzTW9kdWxlID0gYXR0cmlidXRlc18xLmRlZmF1bHQ7XG52YXIgc3R5bGVfMSA9IHJlcXVpcmUoXCJzbmFiYmRvbS9tb2R1bGVzL3N0eWxlXCIpO1xuZXhwb3J0cy5TdHlsZU1vZHVsZSA9IHN0eWxlXzEuZGVmYXVsdDtcbnZhciBkYXRhc2V0XzEgPSByZXF1aXJlKFwic25hYmJkb20vbW9kdWxlcy9kYXRhc2V0XCIpO1xuZXhwb3J0cy5EYXRhc2V0TW9kdWxlID0gZGF0YXNldF8xLmRlZmF1bHQ7XG52YXIgbW9kdWxlcyA9IFtcbiAgICBzdHlsZV8xLmRlZmF1bHQsXG4gICAgY2xhc3NfMS5kZWZhdWx0LFxuICAgIHByb3BzXzEuZGVmYXVsdCxcbiAgICBhdHRyaWJ1dGVzXzEuZGVmYXVsdCxcbiAgICBkYXRhc2V0XzEuZGVmYXVsdCxcbl07XG5leHBvcnRzLmRlZmF1bHQgPSBtb2R1bGVzO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9bW9kdWxlcy5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBoXzEgPSByZXF1aXJlKFwic25hYmJkb20vaFwiKTtcbmZ1bmN0aW9uIGNvcHlUb1RodW5rKHZub2RlLCB0aHVua1ZOb2RlKSB7XG4gICAgdGh1bmtWTm9kZS5lbG0gPSB2bm9kZS5lbG07XG4gICAgdm5vZGUuZGF0YS5mbiA9IHRodW5rVk5vZGUuZGF0YS5mbjtcbiAgICB2bm9kZS5kYXRhLmFyZ3MgPSB0aHVua1ZOb2RlLmRhdGEuYXJncztcbiAgICB2bm9kZS5kYXRhLmlzb2xhdGUgPSB0aHVua1ZOb2RlLmRhdGEuaXNvbGF0ZTtcbiAgICB0aHVua1ZOb2RlLmRhdGEgPSB2bm9kZS5kYXRhO1xuICAgIHRodW5rVk5vZGUuY2hpbGRyZW4gPSB2bm9kZS5jaGlsZHJlbjtcbiAgICB0aHVua1ZOb2RlLnRleHQgPSB2bm9kZS50ZXh0O1xuICAgIHRodW5rVk5vZGUuZWxtID0gdm5vZGUuZWxtO1xufVxuZnVuY3Rpb24gaW5pdCh0aHVua1ZOb2RlKSB7XG4gICAgdmFyIGN1ciA9IHRodW5rVk5vZGUuZGF0YTtcbiAgICB2YXIgdm5vZGUgPSBjdXIuZm4uYXBwbHkodW5kZWZpbmVkLCBjdXIuYXJncyk7XG4gICAgY29weVRvVGh1bmsodm5vZGUsIHRodW5rVk5vZGUpO1xufVxuZnVuY3Rpb24gcHJlcGF0Y2gob2xkVm5vZGUsIHRodW5rVk5vZGUpIHtcbiAgICB2YXIgb2xkID0gb2xkVm5vZGUuZGF0YSwgY3VyID0gdGh1bmtWTm9kZS5kYXRhO1xuICAgIHZhciBpO1xuICAgIHZhciBvbGRBcmdzID0gb2xkLmFyZ3MsIGFyZ3MgPSBjdXIuYXJncztcbiAgICBpZiAob2xkLmZuICE9PSBjdXIuZm4gfHwgb2xkQXJncy5sZW5ndGggIT09IGFyZ3MubGVuZ3RoKSB7XG4gICAgICAgIGNvcHlUb1RodW5rKGN1ci5mbi5hcHBseSh1bmRlZmluZWQsIGFyZ3MpLCB0aHVua1ZOb2RlKTtcbiAgICB9XG4gICAgZm9yIChpID0gMDsgaSA8IGFyZ3MubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgaWYgKG9sZEFyZ3NbaV0gIT09IGFyZ3NbaV0pIHtcbiAgICAgICAgICAgIGNvcHlUb1RodW5rKGN1ci5mbi5hcHBseSh1bmRlZmluZWQsIGFyZ3MpLCB0aHVua1ZOb2RlKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgIH1cbiAgICBjb3B5VG9UaHVuayhvbGRWbm9kZSwgdGh1bmtWTm9kZSk7XG59XG5mdW5jdGlvbiB0aHVuayhzZWwsIGtleSwgZm4sIGFyZ3MpIHtcbiAgICBpZiAoYXJncyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGFyZ3MgPSBmbjtcbiAgICAgICAgZm4gPSBrZXk7XG4gICAgICAgIGtleSA9IHVuZGVmaW5lZDtcbiAgICB9XG4gICAgcmV0dXJuIGhfMS5oKHNlbCwge1xuICAgICAgICBrZXk6IGtleSxcbiAgICAgICAgaG9vazogeyBpbml0OiBpbml0LCBwcmVwYXRjaDogcHJlcGF0Y2ggfSxcbiAgICAgICAgZm46IGZuLFxuICAgICAgICBhcmdzOiBhcmdzLFxuICAgIH0pO1xufVxuZXhwb3J0cy50aHVuayA9IHRodW5rO1xuZXhwb3J0cy5kZWZhdWx0ID0gdGh1bms7XG4vLyMgc291cmNlTWFwcGluZ1VSTD10aHVuay5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmZ1bmN0aW9uIGlzVmFsaWROb2RlKG9iaikge1xuICAgIHZhciBFTEVNX1RZUEUgPSAxO1xuICAgIHZhciBGUkFHX1RZUEUgPSAxMTtcbiAgICByZXR1cm4gdHlwZW9mIEhUTUxFbGVtZW50ID09PSAnb2JqZWN0J1xuICAgICAgICA/IG9iaiBpbnN0YW5jZW9mIEhUTUxFbGVtZW50IHx8IG9iaiBpbnN0YW5jZW9mIERvY3VtZW50RnJhZ21lbnRcbiAgICAgICAgOiBvYmogJiZcbiAgICAgICAgICAgIHR5cGVvZiBvYmogPT09ICdvYmplY3QnICYmXG4gICAgICAgICAgICBvYmogIT09IG51bGwgJiZcbiAgICAgICAgICAgIChvYmoubm9kZVR5cGUgPT09IEVMRU1fVFlQRSB8fCBvYmoubm9kZVR5cGUgPT09IEZSQUdfVFlQRSkgJiZcbiAgICAgICAgICAgIHR5cGVvZiBvYmoubm9kZU5hbWUgPT09ICdzdHJpbmcnO1xufVxuZnVuY3Rpb24gaXNDbGFzc09ySWQoc3RyKSB7XG4gICAgcmV0dXJuIHN0ci5sZW5ndGggPiAxICYmIChzdHJbMF0gPT09ICcuJyB8fCBzdHJbMF0gPT09ICcjJyk7XG59XG5leHBvcnRzLmlzQ2xhc3NPcklkID0gaXNDbGFzc09ySWQ7XG5mdW5jdGlvbiBpc0RvY0ZyYWcoZWwpIHtcbiAgICByZXR1cm4gZWwubm9kZVR5cGUgPT09IDExO1xufVxuZXhwb3J0cy5pc0RvY0ZyYWcgPSBpc0RvY0ZyYWc7XG5leHBvcnRzLlNDT1BFX1BSRUZJWCA9ICckJENZQ0xFRE9NJCQtJztcbmZ1bmN0aW9uIGdldFZhbGlkTm9kZShzZWxlY3RvcnMpIHtcbiAgICB2YXIgZG9tRWxlbWVudCA9IHR5cGVvZiBzZWxlY3RvcnMgPT09ICdzdHJpbmcnXG4gICAgICAgID8gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihzZWxlY3RvcnMpXG4gICAgICAgIDogc2VsZWN0b3JzO1xuICAgIGlmICh0eXBlb2Ygc2VsZWN0b3JzID09PSAnc3RyaW5nJyAmJiBkb21FbGVtZW50ID09PSBudWxsKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNhbm5vdCByZW5kZXIgaW50byB1bmtub3duIGVsZW1lbnQgYFwiICsgc2VsZWN0b3JzICsgXCJgXCIpO1xuICAgIH1cbiAgICBlbHNlIGlmICghaXNWYWxpZE5vZGUoZG9tRWxlbWVudCkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdHaXZlbiBjb250YWluZXIgaXMgbm90IGEgRE9NIGVsZW1lbnQgbmVpdGhlciBhICcgKyAnc2VsZWN0b3Igc3RyaW5nLicpO1xuICAgIH1cbiAgICByZXR1cm4gZG9tRWxlbWVudDtcbn1cbmV4cG9ydHMuZ2V0VmFsaWROb2RlID0gZ2V0VmFsaWROb2RlO1xuLyoqXG4gKiBUaGUgZnVsbCBzY29wZSBvZiBhIG5hbWVzcGFjZSBpcyB0aGUgXCJhYnNvbHV0ZSBwYXRoXCIgb2Ygc2NvcGVzIGZyb21cbiAqIHBhcmVudCB0byBjaGlsZC4gVGhpcyBpcyBleHRyYWN0ZWQgZnJvbSB0aGUgbmFtZXNwYWNlLCBmaWx0ZXIgb25seSBmb3JcbiAqIHNjb3BlcyBpbiB0aGUgbmFtZXNwYWNlLlxuICovXG5mdW5jdGlvbiBnZXRGdWxsU2NvcGUobmFtZXNwYWNlKSB7XG4gICAgcmV0dXJuIG5hbWVzcGFjZVxuICAgICAgICAuZmlsdGVyKGZ1bmN0aW9uIChjKSB7IHJldHVybiBjLmluZGV4T2YoZXhwb3J0cy5TQ09QRV9QUkVGSVgpID4gLTE7IH0pXG4gICAgICAgIC5tYXAoZnVuY3Rpb24gKGMpIHsgcmV0dXJuIGMucmVwbGFjZShleHBvcnRzLlNDT1BFX1BSRUZJWCwgJycpOyB9KVxuICAgICAgICAuam9pbignLScpO1xufVxuZXhwb3J0cy5nZXRGdWxsU2NvcGUgPSBnZXRGdWxsU2NvcGU7XG5mdW5jdGlvbiBnZXRTZWxlY3RvcnMobmFtZXNwYWNlKSB7XG4gICAgcmV0dXJuIG5hbWVzcGFjZS5maWx0ZXIoZnVuY3Rpb24gKGMpIHsgcmV0dXJuIGMuaW5kZXhPZihleHBvcnRzLlNDT1BFX1BSRUZJWCkgPT09IC0xOyB9KS5qb2luKCcgJyk7XG59XG5leHBvcnRzLmdldFNlbGVjdG9ycyA9IGdldFNlbGVjdG9ycztcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXV0aWxzLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHhzdHJlYW1fMSA9IHJlcXVpcmUoXCJ4c3RyZWFtXCIpO1xudmFyIENMSUNLX0VWRU5UID0gdHlwZW9mIGRvY3VtZW50ICE9PSAndW5kZWZpbmVkJyAmJiBkb2N1bWVudC5vbnRvdWNoc3RhcnRcbiAgICA/ICd0b3VjaHN0YXJ0J1xuICAgIDogJ2NsaWNrJztcbmZ1bmN0aW9uIHdoaWNoKGV2KSB7XG4gICAgaWYgKHR5cGVvZiB3aW5kb3cgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgdmFyIGUgPSBldiB8fCB3aW5kb3cuZXZlbnQ7XG4gICAgcmV0dXJuIGUud2hpY2ggPT09IG51bGwgPyBlLmJ1dHRvbiA6IGUud2hpY2g7XG59XG5mdW5jdGlvbiBzYW1lT3JpZ2luKGhyZWYpIHtcbiAgICBpZiAodHlwZW9mIHdpbmRvdyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gaHJlZiAmJiBocmVmLmluZGV4T2Yod2luZG93LmxvY2F0aW9uLm9yaWdpbikgPT09IDA7XG59XG5mdW5jdGlvbiBtYWtlQ2xpY2tMaXN0ZW5lcihwdXNoKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIGNsaWNrTGlzdGVuZXIoZXZlbnQpIHtcbiAgICAgICAgaWYgKHdoaWNoKGV2ZW50KSAhPT0gMSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChldmVudC5tZXRhS2V5IHx8IGV2ZW50LmN0cmxLZXkgfHwgZXZlbnQuc2hpZnRLZXkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZXZlbnQuZGVmYXVsdFByZXZlbnRlZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHZhciBlbGVtZW50ID0gZXZlbnQudGFyZ2V0O1xuICAgICAgICB3aGlsZSAoZWxlbWVudCAmJiBlbGVtZW50Lm5vZGVOYW1lICE9PSAnQScpIHtcbiAgICAgICAgICAgIGVsZW1lbnQgPSBlbGVtZW50LnBhcmVudE5vZGU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFlbGVtZW50IHx8IGVsZW1lbnQubm9kZU5hbWUgIT09ICdBJykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChlbGVtZW50Lmhhc0F0dHJpYnV0ZSgnZG93bmxvYWQnKSB8fFxuICAgICAgICAgICAgZWxlbWVudC5nZXRBdHRyaWJ1dGUoJ3JlbCcpID09PSAnZXh0ZXJuYWwnKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGVsZW1lbnQudGFyZ2V0KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGxpbmsgPSBlbGVtZW50LmdldEF0dHJpYnV0ZSgnaHJlZicpO1xuICAgICAgICBpZiAoKGxpbmsgJiYgbGluay5pbmRleE9mKCdtYWlsdG86JykgPiAtMSkgfHwgbGluay5jaGFyQXQoMCkgPT09ICcjJykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICghc2FtZU9yaWdpbihlbGVtZW50LmhyZWYpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgdmFyIHBhdGhuYW1lID0gZWxlbWVudC5wYXRobmFtZSwgc2VhcmNoID0gZWxlbWVudC5zZWFyY2gsIF9hID0gZWxlbWVudC5oYXNoLCBoYXNoID0gX2EgPT09IHZvaWQgMCA/ICcnIDogX2E7XG4gICAgICAgIHB1c2gocGF0aG5hbWUgKyBzZWFyY2ggKyBoYXNoKTtcbiAgICB9O1xufVxuZnVuY3Rpb24gY2FwdHVyZUFuY2hvckNsaWNrcyhwdXNoKSB7XG4gICAgdmFyIGxpc3RlbmVyID0gbWFrZUNsaWNrTGlzdGVuZXIocHVzaCk7XG4gICAgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoQ0xJQ0tfRVZFTlQsIGxpc3RlbmVyLCBmYWxzZSk7XG4gICAgfVxufVxuZnVuY3Rpb24gY2FwdHVyZUNsaWNrcyhoaXN0b3J5RHJpdmVyKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIGhpc3RvcnlEcml2ZXJXaXRoQ2xpY2tDYXB0dXJlKHNpbmskKSB7XG4gICAgICAgIHZhciBpbnRlcm5hbFNpbmskID0geHN0cmVhbV8xLmRlZmF1bHQuY3JlYXRlKCk7XG4gICAgICAgIGNhcHR1cmVBbmNob3JDbGlja3MoZnVuY3Rpb24gKHBhdGhuYW1lKSB7XG4gICAgICAgICAgICBpbnRlcm5hbFNpbmskLl9uKHsgdHlwZTogJ3B1c2gnLCBwYXRobmFtZTogcGF0aG5hbWUgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICBzaW5rJC5fYWRkKGludGVybmFsU2luayQpO1xuICAgICAgICByZXR1cm4gaGlzdG9yeURyaXZlcihpbnRlcm5hbFNpbmskKTtcbiAgICB9O1xufVxuZXhwb3J0cy5jYXB0dXJlQ2xpY2tzID0gY2FwdHVyZUNsaWNrcztcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWNhcHR1cmVDbGlja3MuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgeHN0cmVhbV8xID0gcmVxdWlyZShcInhzdHJlYW1cIik7XG5mdW5jdGlvbiBjcmVhdGVIaXN0b3J5JChoaXN0b3J5LCBzaW5rJCkge1xuICAgIHZhciBoaXN0b3J5JCA9IHhzdHJlYW1fMS5kZWZhdWx0LmNyZWF0ZVdpdGhNZW1vcnkoKS5zdGFydFdpdGgoaGlzdG9yeS5sb2NhdGlvbik7XG4gICAgdmFyIGNhbGwgPSBtYWtlQ2FsbE9uSGlzdG9yeShoaXN0b3J5KTtcbiAgICB2YXIgdW5saXN0ZW4gPSBoaXN0b3J5Lmxpc3RlbihmdW5jdGlvbiAobG9jKSB7XG4gICAgICAgIGhpc3RvcnkkLl9uKGxvYyk7XG4gICAgfSk7XG4gICAgdmFyIHN1YiA9IHNpbmskLnN1YnNjcmliZShjcmVhdGVPYnNlcnZlcihjYWxsLCB1bmxpc3RlbikpO1xuICAgIGhpc3RvcnkkLmRpc3Bvc2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHN1Yi51bnN1YnNjcmliZSgpO1xuICAgICAgICB1bmxpc3RlbigpO1xuICAgIH07XG4gICAgcmV0dXJuIGhpc3RvcnkkO1xufVxuZXhwb3J0cy5jcmVhdGVIaXN0b3J5JCA9IGNyZWF0ZUhpc3RvcnkkO1xuZnVuY3Rpb24gbWFrZUNhbGxPbkhpc3RvcnkoaGlzdG9yeSkge1xuICAgIHJldHVybiBmdW5jdGlvbiBjYWxsKGlucHV0KSB7XG4gICAgICAgIGlmIChpbnB1dC50eXBlID09PSAncHVzaCcpIHtcbiAgICAgICAgICAgIGhpc3RvcnkucHVzaChpbnB1dC5wYXRobmFtZSwgaW5wdXQuc3RhdGUpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpbnB1dC50eXBlID09PSAncmVwbGFjZScpIHtcbiAgICAgICAgICAgIGhpc3RvcnkucmVwbGFjZShpbnB1dC5wYXRobmFtZSwgaW5wdXQuc3RhdGUpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpbnB1dC50eXBlID09PSAnZ28nKSB7XG4gICAgICAgICAgICBoaXN0b3J5LmdvKGlucHV0LmFtb3VudCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlucHV0LnR5cGUgPT09ICdnb0JhY2snKSB7XG4gICAgICAgICAgICBoaXN0b3J5LmdvQmFjaygpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpbnB1dC50eXBlID09PSAnZ29Gb3J3YXJkJykge1xuICAgICAgICAgICAgaGlzdG9yeS5nb0ZvcndhcmQoKTtcbiAgICAgICAgfVxuICAgIH07XG59XG5mdW5jdGlvbiBjcmVhdGVPYnNlcnZlcihjYWxsLCB1bmxpc3Rlbikge1xuICAgIHJldHVybiB7XG4gICAgICAgIG5leHQ6IGZ1bmN0aW9uIChpbnB1dCkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBpbnB1dCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICBjYWxsKHsgdHlwZTogJ3B1c2gnLCBwYXRobmFtZTogaW5wdXQgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBjYWxsKGlucHV0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgZXJyb3I6IGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgIHVubGlzdGVuKCk7XG4gICAgICAgIH0sXG4gICAgICAgIGNvbXBsZXRlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KHVubGlzdGVuKTtcbiAgICAgICAgfSxcbiAgICB9O1xufVxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9Y3JlYXRlSGlzdG9yeSQuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgaGlzdG9yeV8xID0gcmVxdWlyZShcImhpc3RvcnlcIik7XG52YXIgY3JlYXRlSGlzdG9yeV8xID0gcmVxdWlyZShcIi4vY3JlYXRlSGlzdG9yeSRcIik7XG5mdW5jdGlvbiBpc0hpc3RvcnkoeCkge1xuICAgIHJldHVybiAhIXguY3JlYXRlSHJlZjtcbn1cbmZ1bmN0aW9uIG1ha2VIaXN0b3J5RHJpdmVyKG9wdGlvbnMpIHtcbiAgICB2YXIgaGlzdG9yeTtcbiAgICBpZiAob3B0aW9ucyAmJiBpc0hpc3Rvcnkob3B0aW9ucykpIHtcbiAgICAgICAgaGlzdG9yeSA9IG9wdGlvbnM7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBoaXN0b3J5ID0gaGlzdG9yeV8xLmNyZWF0ZUJyb3dzZXJIaXN0b3J5KG9wdGlvbnMpO1xuICAgIH1cbiAgICByZXR1cm4gZnVuY3Rpb24gaGlzdG9yeURyaXZlcihzaW5rJCkge1xuICAgICAgICByZXR1cm4gY3JlYXRlSGlzdG9yeV8xLmNyZWF0ZUhpc3RvcnkkKGhpc3RvcnksIHNpbmskKTtcbiAgICB9O1xufVxuZXhwb3J0cy5tYWtlSGlzdG9yeURyaXZlciA9IG1ha2VIaXN0b3J5RHJpdmVyO1xuZnVuY3Rpb24gbWFrZVNlcnZlckhpc3RvcnlEcml2ZXIob3B0aW9ucykge1xuICAgIHZhciBoaXN0b3J5ID0gaGlzdG9yeV8xLmNyZWF0ZU1lbW9yeUhpc3Rvcnkob3B0aW9ucyk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIHNlcnZlckhpc3RvcnlEcml2ZXIoc2luayQpIHtcbiAgICAgICAgcmV0dXJuIGNyZWF0ZUhpc3RvcnlfMS5jcmVhdGVIaXN0b3J5JChoaXN0b3J5LCBzaW5rJCk7XG4gICAgfTtcbn1cbmV4cG9ydHMubWFrZVNlcnZlckhpc3RvcnlEcml2ZXIgPSBtYWtlU2VydmVySGlzdG9yeURyaXZlcjtcbmZ1bmN0aW9uIG1ha2VIYXNoSGlzdG9yeURyaXZlcihvcHRpb25zKSB7XG4gICAgdmFyIGhpc3RvcnkgPSBoaXN0b3J5XzEuY3JlYXRlSGFzaEhpc3Rvcnkob3B0aW9ucyk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIGhhc2hIaXN0b3J5RHJpdmVyKHNpbmskKSB7XG4gICAgICAgIHJldHVybiBjcmVhdGVIaXN0b3J5XzEuY3JlYXRlSGlzdG9yeSQoaGlzdG9yeSwgc2luayQpO1xuICAgIH07XG59XG5leHBvcnRzLm1ha2VIYXNoSGlzdG9yeURyaXZlciA9IG1ha2VIYXNoSGlzdG9yeURyaXZlcjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRyaXZlcnMuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG4vKipcbiAqIENyZWF0ZSBhIEhpc3RvcnkgRHJpdmVyIHRvIGJlIHVzZWQgaW4gdGhlIGJyb3dzZXIuXG4gKlxuICogVGhpcyBpcyBhIGZ1bmN0aW9uIHdoaWNoLCB3aGVuIGNhbGxlZCwgcmV0dXJucyBhIEhpc3RvcnkgRHJpdmVyIGZvciBDeWNsZS5qc1xuICogYXBwcy4gVGhlIGRyaXZlciBpcyBhbHNvIGEgZnVuY3Rpb24sIGFuZCBpdCB0YWtlcyBhIHN0cmVhbSBvZiBuZXcgbG9jYXRpb25zXG4gKiAoc3RyaW5ncyByZXByZXNlbnRpbmcgcGF0aG5hbWVzIG9yIGxvY2F0aW9uIG9iamVjdHMpIGFzIGlucHV0LCBhbmQgb3V0cHV0c1xuICogYW5vdGhlciBzdHJlYW0gb2YgbG9jYXRpb25zIHRoYXQgd2VyZSBhcHBsaWVkLiBFeGFtcGxlOlxuICpcbiAqIGBgYGpzXG4gKiBpbXBvcnQge3J1bn0gZnJvbSAnQGN5Y2xlL3J1bic7XG4gKiBpbXBvcnQge21ha2VIaXN0b3J5RHJpdmVyfSBmcm9tICdAY3ljbGUvaGlzdG9yeSc7XG4gKlxuICogZnVuY3Rpb24gbWFpbihzb3VyY2VzKXtcbiAqICAgcmV0dXJuIHtcbiAqICAgICAvLyB1cGRhdGVzIHRoZSBicm93c2VyIFVSTCBldmVyeSA1MDBtc1xuICogICAgIGhpc3Rvcnk6IHhzLnBlcmlvZGljKDUwMCkubWFwKGkgPT4gYHVybC0ke2l9YClcbiAqICAgfTtcbiAqIH1cbiAqXG4gKiBjb25zdCBkcml2ZXJzID0ge1xuICogICBoaXN0b3J5OiBtYWtlSGlzdG9yeURyaXZlcigpXG4gKiB9O1xuICpcbiAqIHJ1bihtYWluLCBkcml2ZXJzKTtcbiAqIGBgYFxuICpcbiAqIEBwYXJhbSB7b2JqZWN0fEhpc3Rvcnl8TWVtb3J5SGlzdG9yeX0gb3B0aW9ucyBhbiBvYmplY3Qgd2l0aCBzb21lIG9wdGlvbnMgc3BlY2lmaWMgdG9cbiAqIHRoaXMgZHJpdmVyLiBUaGVzZSBvcHRpb25zIGFyZSB0aGUgc2FtZSBhcyBmb3IgdGhlIGNvcnJlc3BvbmRpbmdcbiAqIGBjcmVhdGVCcm93c2VySGlzdG9yeSgpYCBmdW5jdGlvbiBpbiBIaXN0b3J5IHY0LiBDaGVjayBpdHNcbiAqIFtkb2NzXShodHRwczovL2dpdGh1Yi5jb20vbWphY2tzb24vaGlzdG9yeS90cmVlL3Y0LjUuMSN1c2FnZSkgZm9yIGEgZ29vZFxuICogZGVzY3JpcHRpb24gb24gdGhlIG9wdGlvbnMuIEFsdGVybmF0aXZlbHksIGEgSGlzdG9yeSBvYmplY3QgY2FuIGFsc28gYmUgc2VudFxuICogaW4gY2FzZSB0aGUgZXh0ZXJuYWwgY29uc3VtZXIgbmVlZHMgZGlyZWN0IGFjY2VzcyB0byBhbnkgb2YgdGhlIGRpcmVjdCBIaXN0b3J5XG4gKiBtZXRob2RzXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn0gdGhlIEhpc3RvcnkgRHJpdmVyIGZ1bmN0aW9uXG4gKiBAZnVuY3Rpb24gbWFrZUhpc3RvcnlEcml2ZXJcbiAqL1xudmFyIGRyaXZlcnNfMSA9IHJlcXVpcmUoXCIuL2RyaXZlcnNcIik7XG5leHBvcnRzLm1ha2VIaXN0b3J5RHJpdmVyID0gZHJpdmVyc18xLm1ha2VIaXN0b3J5RHJpdmVyO1xuLyoqXG4gKiBDcmVhdGUgYSBIaXN0b3J5IERyaXZlciBmb3Igb2xkZXIgYnJvd3NlcnMgdXNpbmcgaGFzaCByb3V0aW5nLlxuICpcbiAqIFRoaXMgaXMgYSBmdW5jdGlvbiB3aGljaCwgd2hlbiBjYWxsZWQsIHJldHVybnMgYSBIaXN0b3J5IERyaXZlciBmb3IgQ3ljbGUuanNcbiAqIGFwcHMuIFRoZSBkcml2ZXIgaXMgYWxzbyBhIGZ1bmN0aW9uLCBhbmQgaXQgdGFrZXMgYSBzdHJlYW0gb2YgbmV3IGxvY2F0aW9uc1xuICogKHN0cmluZ3MgcmVwcmVzZW50aW5nIHBhdGhuYW1lcyBvciBsb2NhdGlvbiBvYmplY3RzKSBhcyBpbnB1dCwgYW5kIG91dHB1dHNcbiAqIGFub3RoZXIgc3RyZWFtIG9mIGxvY2F0aW9ucyB0aGF0IHdlcmUgYXBwbGllZC5cbiAqXG4gKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyBhbiBvYmplY3Qgd2l0aCBzb21lIG9wdGlvbnMgc3BlY2lmaWMgdG9cbiAqIHRoaXMgZHJpdmVyLiBUaGVzZSBvcHRpb25zIGFyZSB0aGUgc2FtZSBhcyBmb3IgdGhlIGNvcnJlc3BvbmRpbmdcbiAqIGBjcmVhdGVIYXNoSGlzdG9yeSgpYCBmdW5jdGlvbiBpbiBIaXN0b3J5IHY0LiBDaGVjayBpdHNcbiAqIFtkb2NzXShodHRwczovL2dpdGh1Yi5jb20vbWphY2tzb24vaGlzdG9yeS90cmVlL3Y0LjUuMSN1c2FnZSkgZm9yIGEgZ29vZFxuICogZGVzY3JpcHRpb24gb24gdGhlIG9wdGlvbnMuXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn0gdGhlIEhpc3RvcnkgRHJpdmVyIGZ1bmN0aW9uXG4gKiBAZnVuY3Rpb24gbWFrZUhhc2hIaXN0b3J5RHJpdmVyXG4gKi9cbnZhciBkcml2ZXJzXzIgPSByZXF1aXJlKFwiLi9kcml2ZXJzXCIpO1xuZXhwb3J0cy5tYWtlSGFzaEhpc3RvcnlEcml2ZXIgPSBkcml2ZXJzXzIubWFrZUhhc2hIaXN0b3J5RHJpdmVyO1xuLyoqXG4gKiBXcmFwcyBhIEhpc3RvcnkgRHJpdmVyIHRvIGFkZCBcImNsaWNrIGNhcHR1cmluZ1wiIGZ1bmN0aW9uYWxpdHkuXG4gKlxuICogSWYgeW91IHdhbnQgdG8gaW50ZXJjZXB0IGFuZCBoYW5kbGUgYW55IGNsaWNrIGV2ZW50IHRoYXQgbGVhZHMgdG8gYSBsaW5rLFxuICogbGlrZSBvbiBhbiBgPGE+YCBlbGVtZW50LCB5b3UgcGFzcyB5b3VyIGV4aXN0aW5nIGRyaXZlciAoZS5nLiBjcmVhdGVkIGZyb21cbiAqIGBtYWtlSGlzdG9yeURyaXZlcigpYCkgYXMgYXJndW1lbnQgYW5kIHRoaXMgZnVuY3Rpb24gd2lsbCByZXR1cm4gYW5vdGhlclxuICogZHJpdmVyIG9mIHRoZSBzYW1lIG5hdHVyZSwgYnV0IGluY2x1ZGluZyBjbGljayBjYXB0dXJpbmcgbG9naWMuIEV4YW1wbGU6XG4gKlxuICogYGBganNcbiAqIGltcG9ydCB7Y2FwdHVyZUNsaWNrcywgbWFrZUhpc3RvcnlEcml2ZXJ9IGZyb20gJ0BjeWNsZS9oaXN0b3J5JztcbiAqXG4gKiBjb25zdCBkcml2ZXJzID0ge1xuICogICBoaXN0b3J5OiBjYXB0dXJlQ2xpY2tzKG1ha2VIaXN0b3J5RHJpdmVyKCkpXG4gKiB9O1xuICogYGBgXG4gKlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZHJpdmVyIGFuIGV4aXN0aW5nIEhpc3RvcnkgRHJpdmVyIGZ1bmN0aW9uLlxuICogQHJldHVybiB7RnVuY3Rpb259IGEgSGlzdG9yeSBEcml2ZXIgZnVuY3Rpb25cbiAqIEBmdW5jdGlvbiBjYXB0dXJlQ2xpY2tzXG4gKi9cbnZhciBjYXB0dXJlQ2xpY2tzXzEgPSByZXF1aXJlKFwiLi9jYXB0dXJlQ2xpY2tzXCIpO1xuZXhwb3J0cy5jYXB0dXJlQ2xpY2tzID0gY2FwdHVyZUNsaWNrc18xLmNhcHR1cmVDbGlja3M7XG4vKipcbiAqIENyZWF0ZSBhIEhpc3RvcnkgRHJpdmVyIHRvIGJlIHVzZWQgaW4gbm9uLWJyb3dzZXIgZW52aXJvbWVudHMgc3VjaCBhc1xuICogc2VydmVyLXNpZGUgTm9kZS5qcy5cbiAqXG4gKiBUaGlzIGlzIGEgZnVuY3Rpb24gd2hpY2gsIHdoZW4gY2FsbGVkLCByZXR1cm5zIGEgSGlzdG9yeSBEcml2ZXIgZm9yIEN5Y2xlLmpzXG4gKiBhcHBzLiBUaGUgZHJpdmVyIGlzIGFsc28gYSBmdW5jdGlvbiwgYW5kIGl0IHRha2VzIGEgc3RyZWFtIG9mIG5ldyBsb2NhdGlvbnNcbiAqIChzdHJpbmdzIHJlcHJlc2VudGluZyBwYXRobmFtZXMgb3IgbG9jYXRpb24gb2JqZWN0cykgYXMgaW5wdXQsIGFuZCBvdXRwdXRzXG4gKiBhbm90aGVyIHN0cmVhbSBvZiBsb2NhdGlvbnMgdGhhdCB3ZXJlIGFwcGxpZWQuXG4gKlxuICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMgYW4gb2JqZWN0IHdpdGggc29tZSBvcHRpb25zIHNwZWNpZmljIHRvXG4gKiB0aGlzIGRyaXZlci4gVGhlc2Ugb3B0aW9ucyBhcmUgdGhlIHNhbWUgYXMgZm9yIHRoZSBjb3JyZXNwb25kaW5nXG4gKiBgY3JlYXRlTWVtb3J5SGlzdG9yeSgpYCBmdW5jdGlvbiBpbiBIaXN0b3J5IHY0LiBDaGVjayBpdHNcbiAqIFtkb2NzXShodHRwczovL2dpdGh1Yi5jb20vbWphY2tzb24vaGlzdG9yeS90cmVlL3Y0LjUuMSN1c2FnZSkgZm9yIGEgZ29vZFxuICogZGVzY3JpcHRpb24gb24gdGhlIG9wdGlvbnMuXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn0gdGhlIEhpc3RvcnkgRHJpdmVyIGZ1bmN0aW9uXG4gKiBAZnVuY3Rpb24gbWFrZVNlcnZlckhpc3RvcnlEcml2ZXJcbiAqL1xudmFyIGRyaXZlcnNfMyA9IHJlcXVpcmUoXCIuL2RyaXZlcnNcIik7XG5leHBvcnRzLm1ha2VTZXJ2ZXJIaXN0b3J5RHJpdmVyID0gZHJpdmVyc18zLm1ha2VTZXJ2ZXJIaXN0b3J5RHJpdmVyO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aW5kZXguanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5mdW5jdGlvbiBjaGVja0lzb2xhdGVBcmdzKGRhdGFmbG93Q29tcG9uZW50LCBzY29wZSkge1xuICAgIGlmICh0eXBlb2YgZGF0YWZsb3dDb21wb25lbnQgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJGaXJzdCBhcmd1bWVudCBnaXZlbiB0byBpc29sYXRlKCkgbXVzdCBiZSBhIFwiICtcbiAgICAgICAgICAgIFwiJ2RhdGFmbG93Q29tcG9uZW50JyBmdW5jdGlvblwiKTtcbiAgICB9XG4gICAgaWYgKHNjb3BlID09PSBudWxsKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlNlY29uZCBhcmd1bWVudCBnaXZlbiB0byBpc29sYXRlKCkgbXVzdCBub3QgYmUgbnVsbFwiKTtcbiAgICB9XG59XG5mdW5jdGlvbiBub3JtYWxpemVTY29wZXMoc291cmNlcywgc2NvcGVzLCByYW5kb21TY29wZSkge1xuICAgIHZhciBwZXJDaGFubmVsID0ge307XG4gICAgT2JqZWN0LmtleXMoc291cmNlcykuZm9yRWFjaChmdW5jdGlvbiAoY2hhbm5lbCkge1xuICAgICAgICBpZiAodHlwZW9mIHNjb3BlcyA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHBlckNoYW5uZWxbY2hhbm5lbF0gPSBzY29wZXM7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGNhbmRpZGF0ZSA9IHNjb3Blc1tjaGFubmVsXTtcbiAgICAgICAgaWYgKHR5cGVvZiBjYW5kaWRhdGUgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBwZXJDaGFubmVsW2NoYW5uZWxdID0gY2FuZGlkYXRlO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHZhciB3aWxkY2FyZCA9IHNjb3Blc1snKiddO1xuICAgICAgICBpZiAodHlwZW9mIHdpbGRjYXJkICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgcGVyQ2hhbm5lbFtjaGFubmVsXSA9IHdpbGRjYXJkO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHBlckNoYW5uZWxbY2hhbm5lbF0gPSByYW5kb21TY29wZTtcbiAgICB9KTtcbiAgICByZXR1cm4gcGVyQ2hhbm5lbDtcbn1cbmZ1bmN0aW9uIGlzb2xhdGVBbGxTb3VyY2VzKG91dGVyU291cmNlcywgc2NvcGVzKSB7XG4gICAgdmFyIGlubmVyU291cmNlcyA9IHt9O1xuICAgIGZvciAodmFyIGNoYW5uZWwgaW4gb3V0ZXJTb3VyY2VzKSB7XG4gICAgICAgIHZhciBvdXRlclNvdXJjZSA9IG91dGVyU291cmNlc1tjaGFubmVsXTtcbiAgICAgICAgaWYgKG91dGVyU291cmNlcy5oYXNPd25Qcm9wZXJ0eShjaGFubmVsKSAmJlxuICAgICAgICAgICAgb3V0ZXJTb3VyY2UgJiZcbiAgICAgICAgICAgIHNjb3Blc1tjaGFubmVsXSAhPT0gbnVsbCAmJlxuICAgICAgICAgICAgdHlwZW9mIG91dGVyU291cmNlLmlzb2xhdGVTb3VyY2UgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGlubmVyU291cmNlc1tjaGFubmVsXSA9IG91dGVyU291cmNlLmlzb2xhdGVTb3VyY2Uob3V0ZXJTb3VyY2UsIHNjb3Blc1tjaGFubmVsXSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAob3V0ZXJTb3VyY2VzLmhhc093blByb3BlcnR5KGNoYW5uZWwpKSB7XG4gICAgICAgICAgICBpbm5lclNvdXJjZXNbY2hhbm5lbF0gPSBvdXRlclNvdXJjZXNbY2hhbm5lbF07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGlubmVyU291cmNlcztcbn1cbmZ1bmN0aW9uIGlzb2xhdGVBbGxTaW5rcyhzb3VyY2VzLCBpbm5lclNpbmtzLCBzY29wZXMpIHtcbiAgICB2YXIgb3V0ZXJTaW5rcyA9IHt9O1xuICAgIGZvciAodmFyIGNoYW5uZWwgaW4gaW5uZXJTaW5rcykge1xuICAgICAgICB2YXIgc291cmNlID0gc291cmNlc1tjaGFubmVsXTtcbiAgICAgICAgdmFyIGlubmVyU2luayA9IGlubmVyU2lua3NbY2hhbm5lbF07XG4gICAgICAgIGlmIChpbm5lclNpbmtzLmhhc093blByb3BlcnR5KGNoYW5uZWwpICYmXG4gICAgICAgICAgICBzb3VyY2UgJiZcbiAgICAgICAgICAgIHNjb3Blc1tjaGFubmVsXSAhPT0gbnVsbCAmJlxuICAgICAgICAgICAgdHlwZW9mIHNvdXJjZS5pc29sYXRlU2luayA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgb3V0ZXJTaW5rc1tjaGFubmVsXSA9IHNvdXJjZS5pc29sYXRlU2luayhpbm5lclNpbmssIHNjb3Blc1tjaGFubmVsXSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoaW5uZXJTaW5rcy5oYXNPd25Qcm9wZXJ0eShjaGFubmVsKSkge1xuICAgICAgICAgICAgb3V0ZXJTaW5rc1tjaGFubmVsXSA9IGlubmVyU2lua3NbY2hhbm5lbF07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG91dGVyU2lua3M7XG59XG52YXIgY291bnRlciA9IDA7XG5mdW5jdGlvbiBuZXdTY29wZSgpIHtcbiAgICByZXR1cm4gXCJjeWNsZVwiICsgKytjb3VudGVyO1xufVxuLyoqXG4gKiBUYWtlcyBhIGBjb21wb25lbnRgIGZ1bmN0aW9uIGFuZCBhIGBzY29wZWAsIGFuZCByZXR1cm5zIGFuIGlzb2xhdGVkIHZlcnNpb25cbiAqIG9mIHRoZSBgY29tcG9uZW50YCBmdW5jdGlvbi5cbiAqXG4gKiBXaGVuIHRoZSBpc29sYXRlZCBjb21wb25lbnQgaXMgaW52b2tlZCwgZWFjaCBzb3VyY2UgcHJvdmlkZWQgdG8gaXQgaXNcbiAqIGlzb2xhdGVkIHRvIHRoZSBnaXZlbiBgc2NvcGVgIHVzaW5nIGBzb3VyY2UuaXNvbGF0ZVNvdXJjZShzb3VyY2UsIHNjb3BlKWAsXG4gKiBpZiBwb3NzaWJsZS4gTGlrZXdpc2UsIHRoZSBzaW5rcyByZXR1cm5lZCBmcm9tIHRoZSBpc29sYXRlZCBjb21wb25lbnQgYXJlXG4gKiBpc29sYXRlZCB0byB0aGUgZ2l2ZW4gYHNjb3BlYCB1c2luZyBgc291cmNlLmlzb2xhdGVTaW5rKHNpbmssIHNjb3BlKWAuXG4gKlxuICogVGhlIGBzY29wZWAgY2FuIGJlIGEgc3RyaW5nIG9yIGFuIG9iamVjdC4gSWYgaXQgaXMgYW55dGhpbmcgZWxzZSB0aGFuIHRob3NlXG4gKiB0d28gdHlwZXMsIGl0IHdpbGwgYmUgY29udmVydGVkIHRvIGEgc3RyaW5nLiBJZiBgc2NvcGVgIGlzIGFuIG9iamVjdCwgaXRcbiAqIHJlcHJlc2VudHMgXCJzY29wZXMgcGVyIGNoYW5uZWxcIiwgYWxsb3dpbmcgeW91IHRvIHNwZWNpZnkgYSBkaWZmZXJlbnQgc2NvcGVcbiAqIGZvciBlYWNoIGtleSBvZiBzb3VyY2VzL3NpbmtzLiBGb3IgaW5zdGFuY2VcbiAqXG4gKiBgYGBqc1xuICogY29uc3QgY2hpbGRTaW5rcyA9IGlzb2xhdGUoQ2hpbGQsIHtET006ICdmb28nLCBIVFRQOiAnYmFyJ30pKHNvdXJjZXMpO1xuICogYGBgXG4gKlxuICogWW91IGNhbiBhbHNvIHVzZSBhIHdpbGRjYXJkIGAnKidgIHRvIHVzZSBhcyBhIGRlZmF1bHQgZm9yIHNvdXJjZS9zaW5rc1xuICogY2hhbm5lbHMgdGhhdCBkaWQgbm90IHJlY2VpdmUgYSBzcGVjaWZpYyBzY29wZTpcbiAqXG4gKiBgYGBqc1xuICogLy8gVXNlcyAnYmFyJyBhcyB0aGUgaXNvbGF0aW9uIHNjb3BlIGZvciBIVFRQIGFuZCBvdGhlciBjaGFubmVsc1xuICogY29uc3QgY2hpbGRTaW5rcyA9IGlzb2xhdGUoQ2hpbGQsIHtET006ICdmb28nLCAnKic6ICdiYXInfSkoc291cmNlcyk7XG4gKiBgYGBcbiAqXG4gKiBJZiBhIGNoYW5uZWwncyB2YWx1ZSBpcyBudWxsLCB0aGVuIHRoYXQgY2hhbm5lbCdzIHNvdXJjZXMgYW5kIHNpbmtzIHdvbid0IGJlXG4gKiBpc29sYXRlZC4gSWYgdGhlIHdpbGRjYXJkIGlzIG51bGwgYW5kIHNvbWUgY2hhbm5lbHMgYXJlIHVuc3BlY2lmaWVkLCB0aG9zZVxuICogY2hhbm5lbHMgd29uJ3QgYmUgaXNvbGF0ZWQuIElmIHlvdSBkb24ndCBoYXZlIGEgd2lsZGNhcmQgYW5kIHNvbWUgY2hhbm5lbHNcbiAqIGFyZSB1bnNwZWNpZmllZCwgdGhlbiBgaXNvbGF0ZWAgd2lsbCBnZW5lcmF0ZSBhIHJhbmRvbSBzY29wZS5cbiAqXG4gKiBgYGBqc1xuICogLy8gRG9lcyBub3QgaXNvbGF0ZSBIVFRQIHJlcXVlc3RzXG4gKiBjb25zdCBjaGlsZFNpbmtzID0gaXNvbGF0ZShDaGlsZCwge0RPTTogJ2ZvbycsIEhUVFA6IG51bGx9KShzb3VyY2VzKTtcbiAqIGBgYFxuICpcbiAqIElmIHRoZSBgc2NvcGVgIGFyZ3VtZW50IGlzIG5vdCBwcm92aWRlZCBhdCBhbGwsIGEgbmV3IHNjb3BlIHdpbGwgYmVcbiAqIGF1dG9tYXRpY2FsbHkgY3JlYXRlZC4gVGhpcyBtZWFucyB0aGF0IHdoaWxlICoqYGlzb2xhdGUoY29tcG9uZW50LCBzY29wZSlgIGlzXG4gKiBwdXJlKiogKHJlZmVyZW50aWFsbHkgdHJhbnNwYXJlbnQpLCAqKmBpc29sYXRlKGNvbXBvbmVudClgIGlzIGltcHVyZSoqIChub3RcbiAqIHJlZmVyZW50aWFsbHkgdHJhbnNwYXJlbnQpLiBUd28gY2FsbHMgdG8gYGlzb2xhdGUoRm9vLCBiYXIpYCB3aWxsIGdlbmVyYXRlXG4gKiB0aGUgc2FtZSBjb21wb25lbnQuIEJ1dCwgdHdvIGNhbGxzIHRvIGBpc29sYXRlKEZvbylgIHdpbGwgZ2VuZXJhdGUgdHdvXG4gKiBkaXN0aW5jdCBjb21wb25lbnRzLlxuICpcbiAqIGBgYGpzXG4gKiAvLyBVc2VzIHNvbWUgYXJiaXRyYXJ5IHN0cmluZyBhcyB0aGUgaXNvbGF0aW9uIHNjb3BlIGZvciBIVFRQIGFuZCBvdGhlciBjaGFubmVsc1xuICogY29uc3QgY2hpbGRTaW5rcyA9IGlzb2xhdGUoQ2hpbGQsIHtET006ICdmb28nfSkoc291cmNlcyk7XG4gKiBgYGBcbiAqXG4gKiBOb3RlIHRoYXQgYm90aCBgaXNvbGF0ZVNvdXJjZSgpYCBhbmQgYGlzb2xhdGVTaW5rKClgIGFyZSBzdGF0aWMgbWVtYmVycyBvZlxuICogYHNvdXJjZWAuIFRoZSByZWFzb24gZm9yIHRoaXMgaXMgdGhhdCBkcml2ZXJzIHByb2R1Y2UgYHNvdXJjZWAgd2hpbGUgdGhlXG4gKiBhcHBsaWNhdGlvbiBwcm9kdWNlcyBgc2lua2AsIGFuZCBpdCdzIHRoZSBkcml2ZXIncyByZXNwb25zaWJpbGl0eSB0b1xuICogaW1wbGVtZW50IGBpc29sYXRlU291cmNlKClgIGFuZCBgaXNvbGF0ZVNpbmsoKWAuXG4gKlxuICogQHBhcmFtIHtGdW5jdGlvbn0gY29tcG9uZW50IGEgZnVuY3Rpb24gdGhhdCB0YWtlcyBgc291cmNlc2AgYXMgaW5wdXRcbiAqIGFuZCBvdXRwdXRzIGEgY29sbGVjdGlvbiBvZiBgc2lua3NgLlxuICogQHBhcmFtIHtTdHJpbmd9IHNjb3BlIGFuIG9wdGlvbmFsIHN0cmluZyB0aGF0IGlzIHVzZWQgdG8gaXNvbGF0ZSBlYWNoXG4gKiBgc291cmNlc2AgYW5kIGBzaW5rc2Agd2hlbiB0aGUgcmV0dXJuZWQgc2NvcGVkIGNvbXBvbmVudCBpcyBpbnZva2VkLlxuICogQHJldHVybiB7RnVuY3Rpb259IHRoZSBzY29wZWQgY29tcG9uZW50IGZ1bmN0aW9uIHRoYXQsIGFzIHRoZSBvcmlnaW5hbFxuICogYGNvbXBvbmVudGAgZnVuY3Rpb24sIHRha2VzIGBzb3VyY2VzYCBhbmQgcmV0dXJucyBgc2lua3NgLlxuICogQGZ1bmN0aW9uIGlzb2xhdGVcbiAqL1xuZnVuY3Rpb24gaXNvbGF0ZShjb21wb25lbnQsIHNjb3BlKSB7XG4gICAgaWYgKHNjb3BlID09PSB2b2lkIDApIHsgc2NvcGUgPSBuZXdTY29wZSgpOyB9XG4gICAgY2hlY2tJc29sYXRlQXJncyhjb21wb25lbnQsIHNjb3BlKTtcbiAgICB2YXIgcmFuZG9tU2NvcGUgPSB0eXBlb2Ygc2NvcGUgPT09ICdvYmplY3QnID8gbmV3U2NvcGUoKSA6ICcnO1xuICAgIHZhciBzY29wZXMgPSB0eXBlb2Ygc2NvcGUgPT09ICdzdHJpbmcnIHx8IHR5cGVvZiBzY29wZSA9PT0gJ29iamVjdCdcbiAgICAgICAgPyBzY29wZVxuICAgICAgICA6IHNjb3BlLnRvU3RyaW5nKCk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIHdyYXBwZWRDb21wb25lbnQob3V0ZXJTb3VyY2VzKSB7XG4gICAgICAgIHZhciByZXN0ID0gW107XG4gICAgICAgIGZvciAodmFyIF9pID0gMTsgX2kgPCBhcmd1bWVudHMubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICByZXN0W19pIC0gMV0gPSBhcmd1bWVudHNbX2ldO1xuICAgICAgICB9XG4gICAgICAgIHZhciBzY29wZXNQZXJDaGFubmVsID0gbm9ybWFsaXplU2NvcGVzKG91dGVyU291cmNlcywgc2NvcGVzLCByYW5kb21TY29wZSk7XG4gICAgICAgIHZhciBpbm5lclNvdXJjZXMgPSBpc29sYXRlQWxsU291cmNlcyhvdXRlclNvdXJjZXMsIHNjb3Blc1BlckNoYW5uZWwpO1xuICAgICAgICB2YXIgaW5uZXJTaW5rcyA9IGNvbXBvbmVudC5hcHBseSh2b2lkIDAsIFtpbm5lclNvdXJjZXNdLmNvbmNhdChyZXN0KSk7XG4gICAgICAgIHZhciBvdXRlclNpbmtzID0gaXNvbGF0ZUFsbFNpbmtzKG91dGVyU291cmNlcywgaW5uZXJTaW5rcywgc2NvcGVzUGVyQ2hhbm5lbCk7XG4gICAgICAgIHJldHVybiBvdXRlclNpbmtzO1xuICAgIH07XG59XG5pc29sYXRlLnJlc2V0ID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gKGNvdW50ZXIgPSAwKTsgfTtcbmV4cG9ydHMuZGVmYXVsdCA9IGlzb2xhdGU7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1pbmRleC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBhZGFwdFN0cmVhbSA9IGZ1bmN0aW9uICh4KSB7IHJldHVybiB4OyB9O1xuZnVuY3Rpb24gc2V0QWRhcHQoZikge1xuICAgIGFkYXB0U3RyZWFtID0gZjtcbn1cbmV4cG9ydHMuc2V0QWRhcHQgPSBzZXRBZGFwdDtcbmZ1bmN0aW9uIGFkYXB0KHN0cmVhbSkge1xuICAgIHJldHVybiBhZGFwdFN0cmVhbShzdHJlYW0pO1xufVxuZXhwb3J0cy5hZGFwdCA9IGFkYXB0O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9YWRhcHQuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgeHN0cmVhbV8xID0gcmVxdWlyZShcInhzdHJlYW1cIik7XG52YXIgYWRhcHRfMSA9IHJlcXVpcmUoXCIuL2FkYXB0XCIpO1xuZnVuY3Rpb24gbG9nVG9Db25zb2xlRXJyb3IoZXJyKSB7XG4gICAgdmFyIHRhcmdldCA9IGVyci5zdGFjayB8fCBlcnI7XG4gICAgaWYgKGNvbnNvbGUgJiYgY29uc29sZS5lcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKHRhcmdldCk7XG4gICAgfVxuICAgIGVsc2UgaWYgKGNvbnNvbGUgJiYgY29uc29sZS5sb2cpIHtcbiAgICAgICAgY29uc29sZS5sb2codGFyZ2V0KTtcbiAgICB9XG59XG5mdW5jdGlvbiBtYWtlU2lua1Byb3hpZXMoZHJpdmVycykge1xuICAgIHZhciBzaW5rUHJveGllcyA9IHt9O1xuICAgIGZvciAodmFyIG5hbWVfMSBpbiBkcml2ZXJzKSB7XG4gICAgICAgIGlmIChkcml2ZXJzLmhhc093blByb3BlcnR5KG5hbWVfMSkpIHtcbiAgICAgICAgICAgIHNpbmtQcm94aWVzW25hbWVfMV0gPSB4c3RyZWFtXzEuZGVmYXVsdC5jcmVhdGVXaXRoTWVtb3J5KCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHNpbmtQcm94aWVzO1xufVxuZnVuY3Rpb24gY2FsbERyaXZlcnMoZHJpdmVycywgc2lua1Byb3hpZXMpIHtcbiAgICB2YXIgc291cmNlcyA9IHt9O1xuICAgIGZvciAodmFyIG5hbWVfMiBpbiBkcml2ZXJzKSB7XG4gICAgICAgIGlmIChkcml2ZXJzLmhhc093blByb3BlcnR5KG5hbWVfMikpIHtcbiAgICAgICAgICAgIHNvdXJjZXNbbmFtZV8yXSA9IGRyaXZlcnNbbmFtZV8yXShzaW5rUHJveGllc1tuYW1lXzJdLCBuYW1lXzIpO1xuICAgICAgICAgICAgaWYgKHNvdXJjZXNbbmFtZV8yXSAmJiB0eXBlb2Ygc291cmNlc1tuYW1lXzJdID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgIHNvdXJjZXNbbmFtZV8yXS5faXNDeWNsZVNvdXJjZSA9IG5hbWVfMjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gc291cmNlcztcbn1cbi8vIE5PVEU6IHRoaXMgd2lsbCBtdXRhdGUgYHNvdXJjZXNgLlxuZnVuY3Rpb24gYWRhcHRTb3VyY2VzKHNvdXJjZXMpIHtcbiAgICBmb3IgKHZhciBuYW1lXzMgaW4gc291cmNlcykge1xuICAgICAgICBpZiAoc291cmNlcy5oYXNPd25Qcm9wZXJ0eShuYW1lXzMpICYmXG4gICAgICAgICAgICBzb3VyY2VzW25hbWVfM10gJiZcbiAgICAgICAgICAgIHR5cGVvZiBzb3VyY2VzW25hbWVfM11bJ3NoYW1lZnVsbHlTZW5kTmV4dCddID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBzb3VyY2VzW25hbWVfM10gPSBhZGFwdF8xLmFkYXB0KHNvdXJjZXNbbmFtZV8zXSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHNvdXJjZXM7XG59XG5mdW5jdGlvbiByZXBsaWNhdGVNYW55KHNpbmtzLCBzaW5rUHJveGllcykge1xuICAgIHZhciBzaW5rTmFtZXMgPSBPYmplY3Qua2V5cyhzaW5rcykuZmlsdGVyKGZ1bmN0aW9uIChuYW1lKSB7IHJldHVybiAhIXNpbmtQcm94aWVzW25hbWVdOyB9KTtcbiAgICB2YXIgYnVmZmVycyA9IHt9O1xuICAgIHZhciByZXBsaWNhdG9ycyA9IHt9O1xuICAgIHNpbmtOYW1lcy5mb3JFYWNoKGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgIGJ1ZmZlcnNbbmFtZV0gPSB7IF9uOiBbXSwgX2U6IFtdIH07XG4gICAgICAgIHJlcGxpY2F0b3JzW25hbWVdID0ge1xuICAgICAgICAgICAgbmV4dDogZnVuY3Rpb24gKHgpIHsgcmV0dXJuIGJ1ZmZlcnNbbmFtZV0uX24ucHVzaCh4KTsgfSxcbiAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiAoZXJyKSB7IHJldHVybiBidWZmZXJzW25hbWVdLl9lLnB1c2goZXJyKTsgfSxcbiAgICAgICAgICAgIGNvbXBsZXRlOiBmdW5jdGlvbiAoKSB7IH0sXG4gICAgICAgIH07XG4gICAgfSk7XG4gICAgdmFyIHN1YnNjcmlwdGlvbnMgPSBzaW5rTmFtZXMubWFwKGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgIHJldHVybiB4c3RyZWFtXzEuZGVmYXVsdC5mcm9tT2JzZXJ2YWJsZShzaW5rc1tuYW1lXSkuc3Vic2NyaWJlKHJlcGxpY2F0b3JzW25hbWVdKTtcbiAgICB9KTtcbiAgICBzaW5rTmFtZXMuZm9yRWFjaChmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICB2YXIgbGlzdGVuZXIgPSBzaW5rUHJveGllc1tuYW1lXTtcbiAgICAgICAgdmFyIG5leHQgPSBmdW5jdGlvbiAoeCkge1xuICAgICAgICAgICAgbGlzdGVuZXIuX24oeCk7XG4gICAgICAgIH07XG4gICAgICAgIHZhciBlcnJvciA9IGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgIGxvZ1RvQ29uc29sZUVycm9yKGVycik7XG4gICAgICAgICAgICBsaXN0ZW5lci5fZShlcnIpO1xuICAgICAgICB9O1xuICAgICAgICBidWZmZXJzW25hbWVdLl9uLmZvckVhY2gobmV4dCk7XG4gICAgICAgIGJ1ZmZlcnNbbmFtZV0uX2UuZm9yRWFjaChlcnJvcik7XG4gICAgICAgIHJlcGxpY2F0b3JzW25hbWVdLm5leHQgPSBuZXh0O1xuICAgICAgICByZXBsaWNhdG9yc1tuYW1lXS5lcnJvciA9IGVycm9yO1xuICAgICAgICAvLyBiZWNhdXNlIHNpbmsuc3Vic2NyaWJlKHJlcGxpY2F0b3IpIGhhZCBtdXRhdGVkIHJlcGxpY2F0b3IgdG8gYWRkXG4gICAgICAgIC8vIF9uLCBfZSwgX2MsIHdlIG11c3QgYWxzbyB1cGRhdGUgdGhlc2U6XG4gICAgICAgIHJlcGxpY2F0b3JzW25hbWVdLl9uID0gbmV4dDtcbiAgICAgICAgcmVwbGljYXRvcnNbbmFtZV0uX2UgPSBlcnJvcjtcbiAgICB9KTtcbiAgICBidWZmZXJzID0gbnVsbDsgLy8gZnJlZSB1cCBmb3IgR0NcbiAgICByZXR1cm4gZnVuY3Rpb24gZGlzcG9zZVJlcGxpY2F0aW9uKCkge1xuICAgICAgICBzdWJzY3JpcHRpb25zLmZvckVhY2goZnVuY3Rpb24gKHMpIHsgcmV0dXJuIHMudW5zdWJzY3JpYmUoKTsgfSk7XG4gICAgICAgIHNpbmtOYW1lcy5mb3JFYWNoKGZ1bmN0aW9uIChuYW1lKSB7IHJldHVybiBzaW5rUHJveGllc1tuYW1lXS5fYygpOyB9KTtcbiAgICB9O1xufVxuZnVuY3Rpb24gZGlzcG9zZVNvdXJjZXMoc291cmNlcykge1xuICAgIGZvciAodmFyIGsgaW4gc291cmNlcykge1xuICAgICAgICBpZiAoc291cmNlcy5oYXNPd25Qcm9wZXJ0eShrKSAmJlxuICAgICAgICAgICAgc291cmNlc1trXSAmJlxuICAgICAgICAgICAgc291cmNlc1trXS5kaXNwb3NlKSB7XG4gICAgICAgICAgICBzb3VyY2VzW2tdLmRpc3Bvc2UoKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbmZ1bmN0aW9uIGlzT2JqZWN0RW1wdHkob2JqKSB7XG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKG9iaikubGVuZ3RoID09PSAwO1xufVxuLyoqXG4gKiBBIGZ1bmN0aW9uIHRoYXQgcHJlcGFyZXMgdGhlIEN5Y2xlIGFwcGxpY2F0aW9uIHRvIGJlIGV4ZWN1dGVkLiBUYWtlcyBhIGBtYWluYFxuICogZnVuY3Rpb24gYW5kIHByZXBhcmVzIHRvIGNpcmN1bGFybHkgY29ubmVjdHMgaXQgdG8gdGhlIGdpdmVuIGNvbGxlY3Rpb24gb2ZcbiAqIGRyaXZlciBmdW5jdGlvbnMuIEFzIGFuIG91dHB1dCwgYHNldHVwKClgIHJldHVybnMgYW4gb2JqZWN0IHdpdGggdGhyZWVcbiAqIHByb3BlcnRpZXM6IGBzb3VyY2VzYCwgYHNpbmtzYCBhbmQgYHJ1bmAuIE9ubHkgd2hlbiBgcnVuKClgIGlzIGNhbGxlZCB3aWxsXG4gKiB0aGUgYXBwbGljYXRpb24gYWN0dWFsbHkgZXhlY3V0ZS4gUmVmZXIgdG8gdGhlIGRvY3VtZW50YXRpb24gb2YgYHJ1bigpYCBmb3JcbiAqIG1vcmUgZGV0YWlscy5cbiAqXG4gKiAqKkV4YW1wbGU6KipcbiAqIGBgYGpzXG4gKiBpbXBvcnQge3NldHVwfSBmcm9tICdAY3ljbGUvcnVuJztcbiAqIGNvbnN0IHtzb3VyY2VzLCBzaW5rcywgcnVufSA9IHNldHVwKG1haW4sIGRyaXZlcnMpO1xuICogLy8gLi4uXG4gKiBjb25zdCBkaXNwb3NlID0gcnVuKCk7IC8vIEV4ZWN1dGVzIHRoZSBhcHBsaWNhdGlvblxuICogLy8gLi4uXG4gKiBkaXNwb3NlKCk7XG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBtYWluIGEgZnVuY3Rpb24gdGhhdCB0YWtlcyBgc291cmNlc2AgYXMgaW5wdXQgYW5kIG91dHB1dHNcbiAqIGBzaW5rc2AuXG4gKiBAcGFyYW0ge09iamVjdH0gZHJpdmVycyBhbiBvYmplY3Qgd2hlcmUga2V5cyBhcmUgZHJpdmVyIG5hbWVzIGFuZCB2YWx1ZXNcbiAqIGFyZSBkcml2ZXIgZnVuY3Rpb25zLlxuICogQHJldHVybiB7T2JqZWN0fSBhbiBvYmplY3Qgd2l0aCB0aHJlZSBwcm9wZXJ0aWVzOiBgc291cmNlc2AsIGBzaW5rc2AgYW5kXG4gKiBgcnVuYC4gYHNvdXJjZXNgIGlzIHRoZSBjb2xsZWN0aW9uIG9mIGRyaXZlciBzb3VyY2VzLCBgc2lua3NgIGlzIHRoZVxuICogY29sbGVjdGlvbiBvZiBkcml2ZXIgc2lua3MsIHRoZXNlIGNhbiBiZSB1c2VkIGZvciBkZWJ1Z2dpbmcgb3IgdGVzdGluZy4gYHJ1bmBcbiAqIGlzIHRoZSBmdW5jdGlvbiB0aGF0IG9uY2UgY2FsbGVkIHdpbGwgZXhlY3V0ZSB0aGUgYXBwbGljYXRpb24uXG4gKiBAZnVuY3Rpb24gc2V0dXBcbiAqL1xuZnVuY3Rpb24gc2V0dXAobWFpbiwgZHJpdmVycykge1xuICAgIGlmICh0eXBlb2YgbWFpbiAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkZpcnN0IGFyZ3VtZW50IGdpdmVuIHRvIEN5Y2xlIG11c3QgYmUgdGhlICdtYWluJyBcIiArIFwiZnVuY3Rpb24uXCIpO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIGRyaXZlcnMgIT09IFwib2JqZWN0XCIgfHwgZHJpdmVycyA9PT0gbnVsbCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJTZWNvbmQgYXJndW1lbnQgZ2l2ZW4gdG8gQ3ljbGUgbXVzdCBiZSBhbiBvYmplY3QgXCIgK1xuICAgICAgICAgICAgXCJ3aXRoIGRyaXZlciBmdW5jdGlvbnMgYXMgcHJvcGVydGllcy5cIik7XG4gICAgfVxuICAgIGlmIChpc09iamVjdEVtcHR5KGRyaXZlcnMpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlNlY29uZCBhcmd1bWVudCBnaXZlbiB0byBDeWNsZSBtdXN0IGJlIGFuIG9iamVjdCBcIiArXG4gICAgICAgICAgICBcIndpdGggYXQgbGVhc3Qgb25lIGRyaXZlciBmdW5jdGlvbiBkZWNsYXJlZCBhcyBhIHByb3BlcnR5LlwiKTtcbiAgICB9XG4gICAgdmFyIHNpbmtQcm94aWVzID0gbWFrZVNpbmtQcm94aWVzKGRyaXZlcnMpO1xuICAgIHZhciBzb3VyY2VzID0gY2FsbERyaXZlcnMoZHJpdmVycywgc2lua1Byb3hpZXMpO1xuICAgIHZhciBhZGFwdGVkU291cmNlcyA9IGFkYXB0U291cmNlcyhzb3VyY2VzKTtcbiAgICB2YXIgc2lua3MgPSBtYWluKGFkYXB0ZWRTb3VyY2VzKTtcbiAgICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgd2luZG93LkN5Y2xlanMgPSB3aW5kb3cuQ3ljbGVqcyB8fCB7fTtcbiAgICAgICAgd2luZG93LkN5Y2xlanMuc2lua3MgPSBzaW5rcztcbiAgICB9XG4gICAgZnVuY3Rpb24gX3J1bigpIHtcbiAgICAgICAgdmFyIGRpc3Bvc2VSZXBsaWNhdGlvbiA9IHJlcGxpY2F0ZU1hbnkoc2lua3MsIHNpbmtQcm94aWVzKTtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIGRpc3Bvc2UoKSB7XG4gICAgICAgICAgICBkaXNwb3NlU291cmNlcyhzb3VyY2VzKTtcbiAgICAgICAgICAgIGRpc3Bvc2VSZXBsaWNhdGlvbigpO1xuICAgICAgICB9O1xuICAgIH1cbiAgICByZXR1cm4geyBzaW5rczogc2lua3MsIHNvdXJjZXM6IHNvdXJjZXMsIHJ1bjogX3J1biB9O1xufVxuZXhwb3J0cy5zZXR1cCA9IHNldHVwO1xuLyoqXG4gKiBUYWtlcyBhIGBtYWluYCBmdW5jdGlvbiBhbmQgY2lyY3VsYXJseSBjb25uZWN0cyBpdCB0byB0aGUgZ2l2ZW4gY29sbGVjdGlvblxuICogb2YgZHJpdmVyIGZ1bmN0aW9ucy5cbiAqXG4gKiAqKkV4YW1wbGU6KipcbiAqIGBgYGpzXG4gKiBpbXBvcnQgcnVuIGZyb20gJ0BjeWNsZS9ydW4nO1xuICogY29uc3QgZGlzcG9zZSA9IHJ1bihtYWluLCBkcml2ZXJzKTtcbiAqIC8vIC4uLlxuICogZGlzcG9zZSgpO1xuICogYGBgXG4gKlxuICogVGhlIGBtYWluYCBmdW5jdGlvbiBleHBlY3RzIGEgY29sbGVjdGlvbiBvZiBcInNvdXJjZVwiIHN0cmVhbXMgKHJldHVybmVkIGZyb21cbiAqIGRyaXZlcnMpIGFzIGlucHV0LCBhbmQgc2hvdWxkIHJldHVybiBhIGNvbGxlY3Rpb24gb2YgXCJzaW5rXCIgc3RyZWFtcyAodG8gYmVcbiAqIGdpdmVuIHRvIGRyaXZlcnMpLiBBIFwiY29sbGVjdGlvbiBvZiBzdHJlYW1zXCIgaXMgYSBKYXZhU2NyaXB0IG9iamVjdCB3aGVyZVxuICoga2V5cyBtYXRjaCB0aGUgZHJpdmVyIG5hbWVzIHJlZ2lzdGVyZWQgYnkgdGhlIGBkcml2ZXJzYCBvYmplY3QsIGFuZCB2YWx1ZXNcbiAqIGFyZSB0aGUgc3RyZWFtcy4gUmVmZXIgdG8gdGhlIGRvY3VtZW50YXRpb24gb2YgZWFjaCBkcml2ZXIgdG8gc2VlIG1vcmVcbiAqIGRldGFpbHMgb24gd2hhdCB0eXBlcyBvZiBzb3VyY2VzIGl0IG91dHB1dHMgYW5kIHNpbmtzIGl0IHJlY2VpdmVzLlxuICpcbiAqIEBwYXJhbSB7RnVuY3Rpb259IG1haW4gYSBmdW5jdGlvbiB0aGF0IHRha2VzIGBzb3VyY2VzYCBhcyBpbnB1dCBhbmQgb3V0cHV0c1xuICogYHNpbmtzYC5cbiAqIEBwYXJhbSB7T2JqZWN0fSBkcml2ZXJzIGFuIG9iamVjdCB3aGVyZSBrZXlzIGFyZSBkcml2ZXIgbmFtZXMgYW5kIHZhbHVlc1xuICogYXJlIGRyaXZlciBmdW5jdGlvbnMuXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn0gYSBkaXNwb3NlIGZ1bmN0aW9uLCB1c2VkIHRvIHRlcm1pbmF0ZSB0aGUgZXhlY3V0aW9uIG9mIHRoZVxuICogQ3ljbGUuanMgcHJvZ3JhbSwgY2xlYW5pbmcgdXAgcmVzb3VyY2VzIHVzZWQuXG4gKiBAZnVuY3Rpb24gcnVuXG4gKi9cbmZ1bmN0aW9uIHJ1bihtYWluLCBkcml2ZXJzKSB7XG4gICAgdmFyIHByb2dyYW0gPSBzZXR1cChtYWluLCBkcml2ZXJzKTtcbiAgICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiZcbiAgICAgICAgd2luZG93WydDeWNsZWpzRGV2VG9vbF9zdGFydEdyYXBoU2VyaWFsaXplciddKSB7XG4gICAgICAgIHdpbmRvd1snQ3ljbGVqc0RldlRvb2xfc3RhcnRHcmFwaFNlcmlhbGl6ZXInXShwcm9ncmFtLnNpbmtzKTtcbiAgICB9XG4gICAgcmV0dXJuIHByb2dyYW0ucnVuKCk7XG59XG5leHBvcnRzLnJ1biA9IHJ1bjtcbmV4cG9ydHMuZGVmYXVsdCA9IHJ1bjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWluZGV4LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHdyaXRlVG9TdG9yZV8xID0gcmVxdWlyZShcIi4vd3JpdGVUb1N0b3JlXCIpO1xudmFyIHJlc3BvbnNlQ29sbGVjdGlvbl8xID0gcmVxdWlyZShcIi4vcmVzcG9uc2VDb2xsZWN0aW9uXCIpO1xuLyoqXG4gKiBTdG9yYWdlIERyaXZlci5cbiAqXG4gKiBUaGlzIGlzIGEgbG9jYWxTdG9yYWdlIGFuZCBzZXNzaW9uU3RvcmFnZSBEcml2ZXIgZm9yIEN5Y2xlLmpzIGFwcHMuIFRoZVxuICogZHJpdmVyIGlzIGFsc28gYSBmdW5jdGlvbiwgYW5kIGl0IHRha2VzIGEgc3RyZWFtIG9mIHJlcXVlc3RzIGFzIGlucHV0LCBhbmRcbiAqIHJldHVybnMgYSAqKmByZXNwb25zZUNvbGxlY3Rpb25gKiogd2l0aCBmdW5jdGlvbnMgdGhhdCBhbGxvdyByZWFkaW5nIGZyb20gdGhlXG4gKiBzdG9yYWdlIG9iamVjdHMuIFRoZSBmdW5jdGlvbnMgb24gdGhlICoqYHJlc3BvbnNlQ29sbGVjdGlvbmAqKiByZXR1cm4gc3RyZWFtc1xuICogb2YgdGhlIHN0b3JhZ2UgZGF0YSB0aGF0IHdhcyByZXF1ZXN0ZWQuXG4gKlxuICogKipSZXF1ZXN0cyoqLiBUaGUgc3RyZWFtIG9mIHJlcXVlc3RzIHNob3VsZCBlbWl0IG9iamVjdHMuIFRoZXNlIHNob3VsZCBiZVxuICogaW5zdHJ1Y3Rpb25zIHRvIHdyaXRlIHRvIHRoZSBkZXNpcmVkIFN0b3JhZ2Ugb2JqZWN0LiBIZXJlIGFyZSB0aGUgYHJlcXVlc3RgXG4gKiBvYmplY3QgcHJvcGVydGllczpcbiAqXG4gKiAtIGB0YXJnZXRgICooU3RyaW5nKSo6IHR5cGUgb2Ygc3RvcmFnZSwgY2FuIGJlIGBsb2NhbGAgb3IgYHNlc3Npb25gLCBkZWZhdWx0c1xuICogdG8gYGxvY2FsYC5cbiAqIC0gYGFjdGlvbmAgKihTdHJpbmcpKjogdHlwZSBvZiBhY3Rpb24sIGNhbiBiZSBgc2V0SXRlbWAsIGByZW1vdmVJdGVtYCBvclxuICogYGNsZWFyYCwgZGVmYXVsdHMgdG8gYHNldEl0ZW1gLlxuICogLSBga2V5YCAqKFN0cmluZykqOiBzdG9yYWdlIGtleS5cbiAqIC0gYHZhbHVlYCAqKFN0cmluZykqOiBzdG9yYWdlIHZhbHVlLlxuICpcbiAqICoqcmVzcG9uc2VDb2xsZWN0aW9uKiouIFRoZSAqKmByZXNwb25zZUNvbGxlY3Rpb25gKiogaXMgYW4gT2JqZWN0IHRoYXRcbiAqIGV4cG9zZXMgZnVuY3Rpb25zIHRvIHJlYWQgZnJvbSBsb2NhbC0gYW5kIHNlc3Npb25TdG9yYWdlLlxuICpcbiAqIGBgYGpzXG4gKiAvLyBSZXR1cm5zIGtleSBvZiBudGggbG9jYWxTdG9yYWdlIHZhbHVlLlxuICogcmVzcG9uc2VDb2xsZWN0aW9uLmxvY2FsLmdldEtleShuKVxuICogLy8gUmV0dXJucyBsb2NhbFN0b3JhZ2UgdmFsdWUgb2YgYGtleWAuXG4gKiByZXNwb25zZUNvbGxlY3Rpb24ubG9jYWwuZ2V0SXRlbShrZXkpXG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0gcmVxdWVzdCQgLSBhIHN0cmVhbSBvZiB3cml0ZSByZXF1ZXN0IG9iamVjdHMuXG4gKiBAcmV0dXJuIHtPYmplY3R9IHRoZSByZXNwb25zZSBjb2xsZWN0aW9uIGNvbnRhaW5pbmcgZnVuY3Rpb25zXG4gKiBmb3IgcmVhZGluZyBmcm9tIHN0b3JhZ2UuXG4gKiBAZnVuY3Rpb24gc3RvcmFnZURyaXZlclxuICovXG5mdW5jdGlvbiBzdG9yYWdlRHJpdmVyKHJlcXVlc3QkKSB7XG4gICAgLy8gRXhlY3V0ZSB3cml0aW5nIGFjdGlvbnMuXG4gICAgcmVxdWVzdCQuYWRkTGlzdGVuZXIoe1xuICAgICAgICBuZXh0OiBmdW5jdGlvbiAocmVxdWVzdCkgeyByZXR1cm4gd3JpdGVUb1N0b3JlXzEuZGVmYXVsdChyZXF1ZXN0KTsgfSxcbiAgICB9KTtcbiAgICAvLyBSZXR1cm4gcmVhZGluZyBmdW5jdGlvbnMuXG4gICAgcmV0dXJuIHJlc3BvbnNlQ29sbGVjdGlvbl8xLmRlZmF1bHQocmVxdWVzdCQpO1xufVxuZXhwb3J0cy5kZWZhdWx0ID0gc3RvcmFnZURyaXZlcjtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHV0aWxfMSA9IHJlcXVpcmUoXCIuL3V0aWxcIik7XG5mdW5jdGlvbiBkZWZhdWx0XzEocmVxdWVzdCQpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICAvLyBGb3IgbG9jYWxTdG9yYWdlLlxuICAgICAgICBnZXQgbG9jYWwoKSB7XG4gICAgICAgICAgICByZXR1cm4gdXRpbF8xLmRlZmF1bHQocmVxdWVzdCQpO1xuICAgICAgICB9LFxuICAgICAgICAvLyBGb3Igc2Vzc2lvblN0b3JhZ2UuXG4gICAgICAgIGdldCBzZXNzaW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIHV0aWxfMS5kZWZhdWx0KHJlcXVlc3QkLCAnc2Vzc2lvbicpO1xuICAgICAgICB9LFxuICAgIH07XG59XG5leHBvcnRzLmRlZmF1bHQgPSBkZWZhdWx0XzE7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBkcm9wUmVwZWF0c18xID0gcmVxdWlyZShcInhzdHJlYW0vZXh0cmEvZHJvcFJlcGVhdHNcIik7XG52YXIgYWRhcHRfMSA9IHJlcXVpcmUoXCJAY3ljbGUvcnVuL2xpYi9hZGFwdFwiKTtcbmZ1bmN0aW9uIGdldFN0b3JhZ2UkKHJlcXVlc3QkLCB0eXBlKSB7XG4gICAgaWYgKHR5cGUgPT09ICdsb2NhbCcpIHtcbiAgICAgICAgcmV0dXJuIHJlcXVlc3QkLmZpbHRlcihmdW5jdGlvbiAocmVxKSB7IHJldHVybiAhcmVxLnRhcmdldCB8fCByZXEudGFyZ2V0ID09PSAnbG9jYWwnOyB9KTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHJldHVybiByZXF1ZXN0JC5maWx0ZXIoZnVuY3Rpb24gKHJlcSkgeyByZXR1cm4gcmVxLnRhcmdldCA9PT0gJ3Nlc3Npb24nOyB9KTtcbiAgICB9XG59XG5mdW5jdGlvbiBzdG9yYWdlS2V5KG4sIHJlcXVlc3QkLCB0eXBlKSB7XG4gICAgaWYgKHR5cGUgPT09IHZvaWQgMCkgeyB0eXBlID0gJ2xvY2FsJzsgfVxuICAgIHZhciBzdG9yYWdlJCA9IGdldFN0b3JhZ2UkKHJlcXVlc3QkLCB0eXBlKTtcbiAgICB2YXIga2V5ID0gdHlwZSA9PT0gXCJsb2NhbFwiID8gbG9jYWxTdG9yYWdlLmtleShuKSA6IHNlc3Npb25TdG9yYWdlLmtleShuKTtcbiAgICByZXR1cm4gc3RvcmFnZSRcbiAgICAgICAgLmZpbHRlcihmdW5jdGlvbiAocmVxKSB7IHJldHVybiByZXEua2V5ID09PSBrZXk7IH0pXG4gICAgICAgIC5tYXAoZnVuY3Rpb24gKHJlcSkgeyByZXR1cm4gcmVxLmtleTsgfSlcbiAgICAgICAgLnN0YXJ0V2l0aChrZXkpXG4gICAgICAgIC5jb21wb3NlKGRyb3BSZXBlYXRzXzEuZGVmYXVsdCgpKTtcbn1cbmZ1bmN0aW9uIHN0b3JhZ2VHZXRJdGVtKGtleSwgcmVxdWVzdCQsIHR5cGUpIHtcbiAgICBpZiAodHlwZSA9PT0gdm9pZCAwKSB7IHR5cGUgPSAnbG9jYWwnOyB9XG4gICAgdmFyIHN0b3JhZ2UkID0gZ2V0U3RvcmFnZSQocmVxdWVzdCQsIHR5cGUpO1xuICAgIHZhciBzdG9yYWdlT2JqID0gdHlwZSA9PT0gXCJsb2NhbFwiID8gbG9jYWxTdG9yYWdlIDogc2Vzc2lvblN0b3JhZ2U7XG4gICAgcmV0dXJuIHN0b3JhZ2UkXG4gICAgICAgIC5maWx0ZXIoZnVuY3Rpb24gKHJlcSkgeyByZXR1cm4gcmVxLmtleSA9PT0ga2V5OyB9KVxuICAgICAgICAubWFwKGZ1bmN0aW9uIChyZXEpIHsgcmV0dXJuIHJlcS52YWx1ZTsgfSlcbiAgICAgICAgLnN0YXJ0V2l0aChzdG9yYWdlT2JqLmdldEl0ZW0oa2V5KSk7XG59XG5mdW5jdGlvbiBnZXRSZXNwb25zZU9iaihyZXF1ZXN0JCwgdHlwZSkge1xuICAgIGlmICh0eXBlID09PSB2b2lkIDApIHsgdHlwZSA9ICdsb2NhbCc7IH1cbiAgICByZXR1cm4ge1xuICAgICAgICAvLyBGdW5jdGlvbiByZXR1cm5pbmcgc3RyZWFtIG9mIHRoZSBudGgga2V5LlxuICAgICAgICBrZXk6IGZ1bmN0aW9uIChuKSB7XG4gICAgICAgICAgICByZXR1cm4gYWRhcHRfMS5hZGFwdChzdG9yYWdlS2V5KG4sIHJlcXVlc3QkLCB0eXBlKSk7XG4gICAgICAgIH0sXG4gICAgICAgIC8vIEZ1bmN0aW9uIHJldHVybmluZyBzdHJlYW0gb2YgaXRlbSB2YWx1ZXMuXG4gICAgICAgIGdldEl0ZW06IGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgIHJldHVybiBhZGFwdF8xLmFkYXB0KHN0b3JhZ2VHZXRJdGVtKGtleSwgcmVxdWVzdCQsIHR5cGUpKTtcbiAgICAgICAgfSxcbiAgICB9O1xufVxuZXhwb3J0cy5kZWZhdWx0ID0gZ2V0UmVzcG9uc2VPYmo7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbi8qKlxuICogQGZ1bmN0aW9uIHdyaXRlVG9TdG9yZVxuICogQGRlc2NyaXB0aW9uXG4gKiBBIHVuaXZlcnNhbCB3cml0ZSBmdW5jdGlvbiBmb3IgbG9jYWxTdG9yYWdlIGFuZCBzZXNzaW9uU3RvcmFnZS5cbiAqIEBwYXJhbSB7b2JqZWN0fSByZXF1ZXN0IC0gdGhlIHN0b3JhZ2UgcmVxdWVzdCBvYmplY3RcbiAqIEBwYXJhbSB7c3RyaW5nfSByZXF1ZXN0LnRhcmdldCAtIGEgc3RyaW5nIGRldGVybWluZXMgd2hpY2ggc3RvcmFnZSB0byB1c2VcbiAqIEBwYXJhbSB7c3RyaW5nfSByZXF1ZXN0LmFjdGlvbiAtIGEgc3RyaW5nIGRldGVybWluZXMgdGhlIHdyaXRlIGFjdGlvblxuICogQHBhcmFtIHtzdHJpbmd9IHJlcXVlc3Qua2V5IC0gdGhlIGtleSBvZiBhIHN0b3JhZ2UgaXRlbVxuICogQHBhcmFtIHtzdHJpbmd9IHJlcXVlc3QudmFsdWUgLSB0aGUgdmFsdWUgb2YgYSBzdG9yYWdlIGl0ZW1cbiAqL1xuZnVuY3Rpb24gd3JpdGVUb1N0b3JlKHJlcXVlc3QpIHtcbiAgICB2YXIgX2EgPSByZXF1ZXN0LnRhcmdldCwgdGFyZ2V0ID0gX2EgPT09IHZvaWQgMCA/ICdsb2NhbCcgOiBfYSwgX2IgPSByZXF1ZXN0LmFjdGlvbiwgYWN0aW9uID0gX2IgPT09IHZvaWQgMCA/ICdzZXRJdGVtJyA6IF9iO1xuICAgIHZhciBrZXkgPSByZXF1ZXN0LmtleTtcbiAgICB2YXIgdmFsdWUgPSByZXF1ZXN0LnZhbHVlO1xuICAgIC8vIERldGVybWluZSB0aGUgc3RvcmFnZSB0YXJnZXQuXG4gICAgdmFyIHN0b3JhZ2UgPSB0YXJnZXQgPT09IFwibG9jYWxcIiA/IGxvY2FsU3RvcmFnZSA6IHNlc3Npb25TdG9yYWdlO1xuICAgIC8vIEV4ZWN1dGUgdGhlIHN0b3JhZ2UgYWN0aW9uIGFuZCBwYXNzIGFyZ3VtZW50cyBpZiB0aGV5IHdlcmUgZGVmaW5lZC5cbiAgICBzdG9yYWdlW2FjdGlvbl0oa2V5LCB2YWx1ZSk7XG59XG5leHBvcnRzLmRlZmF1bHQgPSB3cml0ZVRvU3RvcmU7XG4iLCJcInVzZSBzdHJpY3RcIjtcbnZhciBfX2Fzc2lnbiA9ICh0aGlzICYmIHRoaXMuX19hc3NpZ24pIHx8IE9iamVjdC5hc3NpZ24gfHwgZnVuY3Rpb24odCkge1xuICAgIGZvciAodmFyIHMsIGkgPSAxLCBuID0gYXJndW1lbnRzLmxlbmd0aDsgaSA8IG47IGkrKykge1xuICAgICAgICBzID0gYXJndW1lbnRzW2ldO1xuICAgICAgICBmb3IgKHZhciBwIGluIHMpIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwocywgcCkpXG4gICAgICAgICAgICB0W3BdID0gc1twXTtcbiAgICB9XG4gICAgcmV0dXJuIHQ7XG59O1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHhzdHJlYW1fMSA9IHJlcXVpcmUoXCJ4c3RyZWFtXCIpO1xudmFyIGFkYXB0XzEgPSByZXF1aXJlKFwiQGN5Y2xlL3J1bi9saWIvYWRhcHRcIik7XG52YXIgaXNvbGF0ZV8xID0gcmVxdWlyZShcIkBjeWNsZS9pc29sYXRlXCIpO1xudmFyIHBpY2tNZXJnZV8xID0gcmVxdWlyZShcIi4vcGlja01lcmdlXCIpO1xudmFyIHBpY2tDb21iaW5lXzEgPSByZXF1aXJlKFwiLi9waWNrQ29tYmluZVwiKTtcbi8qKlxuICogQW4gb2JqZWN0IHJlcHJlc2VudGluZyBhbGwgaW5zdGFuY2VzIGluIGEgY29sbGVjdGlvbiBvZiBjb21wb25lbnRzLiBIYXMgdGhlXG4gKiBtZXRob2RzIHBpY2tDb21iaW5lIGFuZCBwaWNrTWVyZ2UgdG8gZ2V0IHRoZSBjb21iaW5lZCBzaW5rcyBvZiBhbGwgaW5zdGFuY2VzLlxuICovXG52YXIgSW5zdGFuY2VzID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBJbnN0YW5jZXMoaW5zdGFuY2VzJCkge1xuICAgICAgICB0aGlzLl9pbnN0YW5jZXMkID0gaW5zdGFuY2VzJDtcbiAgICB9XG4gICAgLyoqXG4gICAgICogTGlrZSBgbWVyZ2VgIGluIHhzdHJlYW0sIHRoaXMgb3BlcmF0b3IgYmxlbmRzIG11bHRpcGxlIHN0cmVhbXMgdG9nZXRoZXIsIGJ1dFxuICAgICAqIHBpY2tzIHRob3NlIHN0cmVhbXMgZnJvbSBhIGNvbGxlY3Rpb24gb2YgY29tcG9uZW50IGluc3RhbmNlcy5cbiAgICAgKlxuICAgICAqIFVzZSB0aGUgYHNlbGVjdG9yYCBzdHJpbmcgdG8gcGljayBhIHN0cmVhbSBmcm9tIHRoZSBzaW5rcyBvYmplY3Qgb2YgZWFjaFxuICAgICAqIGNvbXBvbmVudCBpbnN0YW5jZSwgdGhlbiBwaWNrTWVyZ2Ugd2lsbCBtZXJnZSBhbGwgdGhvc2UgcGlja2VkIHN0cmVhbXMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gc2VsZWN0b3IgYSBuYW1lIG9mIGEgY2hhbm5lbCBpbiBhIHNpbmtzIG9iamVjdCBiZWxvbmdpbmcgdG9cbiAgICAgKiBlYWNoIGNvbXBvbmVudCBpbiB0aGUgY29sbGVjdGlvbiBvZiBjb21wb25lbnRzLlxuICAgICAqIEByZXR1cm4ge0Z1bmN0aW9ufSBhbiBvcGVyYXRvciB0byBiZSB1c2VkIHdpdGggeHN0cmVhbSdzIGBjb21wb3NlYCBtZXRob2QuXG4gICAgICovXG4gICAgSW5zdGFuY2VzLnByb3RvdHlwZS5waWNrTWVyZ2UgPSBmdW5jdGlvbiAoc2VsZWN0b3IpIHtcbiAgICAgICAgcmV0dXJuIGFkYXB0XzEuYWRhcHQodGhpcy5faW5zdGFuY2VzJC5jb21wb3NlKHBpY2tNZXJnZV8xLnBpY2tNZXJnZShzZWxlY3RvcikpKTtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIExpa2UgYGNvbWJpbmVgIGluIHhzdHJlYW0sIHRoaXMgb3BlcmF0b3IgY29tYmluZXMgbXVsdGlwbGUgc3RyZWFtcyB0b2dldGhlcixcbiAgICAgKiBidXQgcGlja3MgdGhvc2Ugc3RyZWFtcyBmcm9tIGEgY29sbGVjdGlvbiBvZiBjb21wb25lbnQgaW5zdGFuY2VzLlxuICAgICAqXG4gICAgICogVXNlIHRoZSBgc2VsZWN0b3JgIHN0cmluZyB0byBwaWNrIGEgc3RyZWFtIGZyb20gdGhlIHNpbmtzIG9iamVjdCBvZiBlYWNoXG4gICAgICogY29tcG9uZW50IGluc3RhbmNlLCB0aGVuIHBpY2tDb21iaW5lIHdpbGwgY29tYmluZSBhbGwgdGhvc2UgcGlja2VkIHN0cmVhbXMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gc2VsZWN0b3IgYSBuYW1lIG9mIGEgY2hhbm5lbCBpbiBhIHNpbmtzIG9iamVjdCBiZWxvbmdpbmcgdG9cbiAgICAgKiBlYWNoIGNvbXBvbmVudCBpbiB0aGUgY29sbGVjdGlvbiBvZiBjb21wb25lbnRzLlxuICAgICAqIEByZXR1cm4ge0Z1bmN0aW9ufSBhbiBvcGVyYXRvciB0byBiZSB1c2VkIHdpdGggeHN0cmVhbSdzIGBjb21wb3NlYCBtZXRob2QuXG4gICAgICovXG4gICAgSW5zdGFuY2VzLnByb3RvdHlwZS5waWNrQ29tYmluZSA9IGZ1bmN0aW9uIChzZWxlY3Rvcikge1xuICAgICAgICByZXR1cm4gYWRhcHRfMS5hZGFwdCh0aGlzLl9pbnN0YW5jZXMkLmNvbXBvc2UocGlja0NvbWJpbmVfMS5waWNrQ29tYmluZShzZWxlY3RvcikpKTtcbiAgICB9O1xuICAgIHJldHVybiBJbnN0YW5jZXM7XG59KCkpO1xuZXhwb3J0cy5JbnN0YW5jZXMgPSBJbnN0YW5jZXM7XG5mdW5jdGlvbiBkZWZhdWx0SXRlbVNjb3BlKGtleSkge1xuICAgIHJldHVybiB7ICcqJzogbnVsbCB9O1xufVxuZnVuY3Rpb24gaW5zdGFuY2VMZW5zKGl0ZW1LZXksIGtleSkge1xuICAgIHJldHVybiB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKGFycikge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBhcnIgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZvaWQgMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBuID0gYXJyLmxlbmd0aDsgaSA8IG47ICsraSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoXCJcIiArIGl0ZW1LZXkoYXJyW2ldLCBpKSA9PT0ga2V5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYXJyW2ldO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiB2b2lkIDA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKGFyciwgaXRlbSkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBhcnIgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFtpdGVtXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHR5cGVvZiBpdGVtID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIHJldHVybiBhcnIuZmlsdGVyKGZ1bmN0aW9uIChzLCBpKSB7IHJldHVybiBcIlwiICsgaXRlbUtleShzLCBpKSAhPT0ga2V5OyB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBhcnIubWFwKGZ1bmN0aW9uIChzLCBpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChcIlwiICsgaXRlbUtleShzLCBpKSA9PT0ga2V5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gaXRlbTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBzO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgfTtcbn1cbnZhciBpZGVudGl0eUxlbnMgPSB7XG4gICAgZ2V0OiBmdW5jdGlvbiAob3V0ZXIpIHsgcmV0dXJuIG91dGVyOyB9LFxuICAgIHNldDogZnVuY3Rpb24gKG91dGVyLCBpbm5lcikgeyByZXR1cm4gaW5uZXI7IH0sXG59O1xuLyoqXG4gKiBSZXR1cm5zIGEgQ3ljbGUuanMgY29tcG9uZW50IChhIGZ1bmN0aW9uIGZyb20gc291cmNlcyB0byBzaW5rcykgdGhhdFxuICogcmVwcmVzZW50cyBhIGNvbGxlY3Rpb24gb2YgbWFueSBpdGVtIGNvbXBvbmVudHMgb2YgdGhlIHNhbWUgdHlwZS5cbiAqXG4gKiBUYWtlcyBhbiBcIm9wdGlvbnNcIiBvYmplY3QgYXMgaW5wdXQsIHdpdGggdGhlIHJlcXVpcmVkIHByb3BlcnRpZXM6XG4gKiAtIGl0ZW1cbiAqIC0gY29sbGVjdFNpbmtzXG4gKlxuICogQW5kIHRoZSBvcHRpb25hbCBwcm9wZXJ0aWVzOlxuICogLSBpdGVtS2V5XG4gKiAtIGl0ZW1TY29wZVxuICogLSBjaGFubmVsXG4gKlxuICogVGhlIHJldHVybmVkIGNvbXBvbmVudCwgdGhlIENvbGxlY3Rpb24sIHdpbGwgdXNlIHRoZSBzdGF0ZSBzb3VyY2UgcGFzc2VkIHRvXG4gKiBpdCAodGhyb3VnaCBzb3VyY2VzKSB0byBndWlkZSB0aGUgZHluYW1pYyBncm93aW5nL3Nocmlua2luZyBvZiBpbnN0YW5jZXMgb2ZcbiAqIHRoZSBpdGVtIGNvbXBvbmVudC5cbiAqXG4gKiBUeXBpY2FsbHkgdGhlIHN0YXRlIHNvdXJjZSBzaG91bGQgZW1pdCBhcnJheXMsIHdoZXJlIGVhY2ggZW50cnkgaW4gdGhlIGFycmF5XG4gKiBpcyBhbiBvYmplY3QgaG9sZGluZyB0aGUgc3RhdGUgZm9yIGVhY2ggaXRlbSBjb21wb25lbnQuIFdoZW4gdGhlIHN0YXRlIGFycmF5XG4gKiBncm93cywgdGhlIGNvbGxlY3Rpb24gd2lsbCBhdXRvbWF0aWNhbGx5IGluc3RhbnRpYXRlIGEgbmV3IGl0ZW0gY29tcG9uZW50LlxuICogU2ltaWxhcmx5LCB3aGVuIHRoZSBzdGF0ZSBhcnJheSBnZXRzIHNtYWxsZXIsIHRoZSBjb2xsZWN0aW9uIHdpbGwgaGFuZGxlXG4gKiByZW1vdmFsIG9mIHRoZSBjb3JyZXNwb25kaW5nIGl0ZW0gaW5zdGFuY2UuXG4gKi9cbmZ1bmN0aW9uIG1ha2VDb2xsZWN0aW9uKG9wdHMpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gY29sbGVjdGlvbkNvbXBvbmVudChzb3VyY2VzKSB7XG4gICAgICAgIHZhciBuYW1lID0gb3B0cy5jaGFubmVsIHx8ICdvbmlvbic7XG4gICAgICAgIHZhciBpdGVtS2V5ID0gb3B0cy5pdGVtS2V5O1xuICAgICAgICB2YXIgaXRlbVNjb3BlID0gb3B0cy5pdGVtU2NvcGUgfHwgZGVmYXVsdEl0ZW1TY29wZTtcbiAgICAgICAgdmFyIGl0ZW1Db21wID0gb3B0cy5pdGVtO1xuICAgICAgICB2YXIgc3RhdGUkID0geHN0cmVhbV8xLmRlZmF1bHQuZnJvbU9ic2VydmFibGUoc291cmNlc1tuYW1lXS5zdGF0ZSQpO1xuICAgICAgICB2YXIgaW5zdGFuY2VzJCA9IHN0YXRlJC5mb2xkKGZ1bmN0aW9uIChhY2MsIG5leHRTdGF0ZSkge1xuICAgICAgICAgICAgdmFyIGRpY3QgPSBhY2MuZGljdDtcbiAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KG5leHRTdGF0ZSkpIHtcbiAgICAgICAgICAgICAgICB2YXIgbmV4dEluc3RBcnJheSA9IEFycmF5KG5leHRTdGF0ZS5sZW5ndGgpO1xuICAgICAgICAgICAgICAgIHZhciBuZXh0S2V5c18xID0gbmV3IFNldCgpO1xuICAgICAgICAgICAgICAgIC8vIGFkZFxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBuID0gbmV4dFN0YXRlLmxlbmd0aDsgaSA8IG47ICsraSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIga2V5ID0gXCJcIiArIChpdGVtS2V5ID8gaXRlbUtleShuZXh0U3RhdGVbaV0sIGkpIDogaSk7XG4gICAgICAgICAgICAgICAgICAgIG5leHRLZXlzXzEuYWRkKGtleSk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghZGljdC5oYXMoa2V5KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG9uaW9uU2NvcGUgPSBpdGVtS2V5ID8gaW5zdGFuY2VMZW5zKGl0ZW1LZXksIGtleSkgOiBcIlwiICsgaTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBvdGhlclNjb3BlcyA9IGl0ZW1TY29wZShrZXkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHNjb3BlcyA9IHR5cGVvZiBvdGhlclNjb3BlcyA9PT0gJ3N0cmluZycgPyAoX2EgPSB7ICcqJzogb3RoZXJTY29wZXMgfSwgX2FbbmFtZV0gPSBvbmlvblNjb3BlLCBfYSkgOiBfX2Fzc2lnbih7fSwgb3RoZXJTY29wZXMsIChfYiA9IHt9LCBfYltuYW1lXSA9IG9uaW9uU2NvcGUsIF9iKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgc2lua3MgPSBpc29sYXRlXzEuZGVmYXVsdChpdGVtQ29tcCwgc2NvcGVzKShzb3VyY2VzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpY3Quc2V0KGtleSwgc2lua3MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV4dEluc3RBcnJheVtpXSA9IHNpbmtzO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV4dEluc3RBcnJheVtpXSA9IGRpY3QuZ2V0KGtleSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgbmV4dEluc3RBcnJheVtpXS5fa2V5ID0ga2V5O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyByZW1vdmVcbiAgICAgICAgICAgICAgICBkaWN0LmZvckVhY2goZnVuY3Rpb24gKF8sIGtleSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIW5leHRLZXlzXzEuaGFzKGtleSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpY3QuZGVsZXRlKGtleSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBuZXh0S2V5c18xLmNsZWFyKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgZGljdDogZGljdCwgYXJyOiBuZXh0SW5zdEFycmF5IH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBkaWN0LmNsZWFyKCk7XG4gICAgICAgICAgICAgICAgdmFyIGtleSA9IFwiXCIgKyAoaXRlbUtleSA/IGl0ZW1LZXkobmV4dFN0YXRlLCAwKSA6ICd0aGlzJyk7XG4gICAgICAgICAgICAgICAgdmFyIG9uaW9uU2NvcGUgPSBpZGVudGl0eUxlbnM7XG4gICAgICAgICAgICAgICAgdmFyIG90aGVyU2NvcGVzID0gaXRlbVNjb3BlKGtleSk7XG4gICAgICAgICAgICAgICAgdmFyIHNjb3BlcyA9IHR5cGVvZiBvdGhlclNjb3BlcyA9PT0gJ3N0cmluZycgPyAoX2MgPSB7ICcqJzogb3RoZXJTY29wZXMgfSwgX2NbbmFtZV0gPSBvbmlvblNjb3BlLCBfYykgOiBfX2Fzc2lnbih7fSwgb3RoZXJTY29wZXMsIChfZCA9IHt9LCBfZFtuYW1lXSA9IG9uaW9uU2NvcGUsIF9kKSk7XG4gICAgICAgICAgICAgICAgdmFyIHNpbmtzID0gaXNvbGF0ZV8xLmRlZmF1bHQoaXRlbUNvbXAsIHNjb3Blcykoc291cmNlcyk7XG4gICAgICAgICAgICAgICAgZGljdC5zZXQoa2V5LCBzaW5rcyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgZGljdDogZGljdCwgYXJyOiBbc2lua3NdIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgX2EsIF9iLCBfYywgX2Q7XG4gICAgICAgIH0sIHsgZGljdDogbmV3IE1hcCgpLCBhcnI6IFtdIH0pO1xuICAgICAgICByZXR1cm4gb3B0cy5jb2xsZWN0U2lua3MobmV3IEluc3RhbmNlcyhpbnN0YW5jZXMkKSk7XG4gICAgfTtcbn1cbmV4cG9ydHMubWFrZUNvbGxlY3Rpb24gPSBtYWtlQ29sbGVjdGlvbjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPUNvbGxlY3Rpb24uanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19hc3NpZ24gPSAodGhpcyAmJiB0aGlzLl9fYXNzaWduKSB8fCBPYmplY3QuYXNzaWduIHx8IGZ1bmN0aW9uKHQpIHtcbiAgICBmb3IgKHZhciBzLCBpID0gMSwgbiA9IGFyZ3VtZW50cy5sZW5ndGg7IGkgPCBuOyBpKyspIHtcbiAgICAgICAgcyA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgZm9yICh2YXIgcCBpbiBzKSBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHMsIHApKVxuICAgICAgICAgICAgdFtwXSA9IHNbcF07XG4gICAgfVxuICAgIHJldHVybiB0O1xufTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBkcm9wUmVwZWF0c18xID0gcmVxdWlyZShcInhzdHJlYW0vZXh0cmEvZHJvcFJlcGVhdHNcIik7XG52YXIgYWRhcHRfMSA9IHJlcXVpcmUoXCJAY3ljbGUvcnVuL2xpYi9hZGFwdFwiKTtcbmZ1bmN0aW9uIHVwZGF0ZUFycmF5RW50cnkoYXJyYXksIHNjb3BlLCBuZXdWYWwpIHtcbiAgICBpZiAobmV3VmFsID09PSBhcnJheVtzY29wZV0pIHtcbiAgICAgICAgcmV0dXJuIGFycmF5O1xuICAgIH1cbiAgICB2YXIgaW5kZXggPSBwYXJzZUludChzY29wZSk7XG4gICAgaWYgKHR5cGVvZiBuZXdWYWwgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHJldHVybiBhcnJheS5maWx0ZXIoZnVuY3Rpb24gKHZhbCwgaSkgeyByZXR1cm4gaSAhPT0gaW5kZXg7IH0pO1xuICAgIH1cbiAgICByZXR1cm4gYXJyYXkubWFwKGZ1bmN0aW9uICh2YWwsIGkpIHsgcmV0dXJuIGkgPT09IGluZGV4ID8gbmV3VmFsIDogdmFsOyB9KTtcbn1cbmZ1bmN0aW9uIG1ha2VHZXR0ZXIoc2NvcGUpIHtcbiAgICBpZiAodHlwZW9mIHNjb3BlID09PSAnc3RyaW5nJyB8fCB0eXBlb2Ygc2NvcGUgPT09ICdudW1iZXInKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBsZW5zR2V0KHN0YXRlKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHN0YXRlID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIHJldHVybiB2b2lkIDA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RhdGVbc2NvcGVdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHNjb3BlLmdldDtcbiAgICB9XG59XG5mdW5jdGlvbiBtYWtlU2V0dGVyKHNjb3BlKSB7XG4gICAgaWYgKHR5cGVvZiBzY29wZSA9PT0gJ3N0cmluZycgfHwgdHlwZW9mIHNjb3BlID09PSAnbnVtYmVyJykge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gbGVuc1NldChzdGF0ZSwgY2hpbGRTdGF0ZSkge1xuICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoc3RhdGUpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHVwZGF0ZUFycmF5RW50cnkoc3RhdGUsIHNjb3BlLCBjaGlsZFN0YXRlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHR5cGVvZiBzdGF0ZSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gX2EgPSB7fSwgX2Fbc2NvcGVdID0gY2hpbGRTdGF0ZSwgX2E7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gX19hc3NpZ24oe30sIHN0YXRlLCAoX2IgPSB7fSwgX2Jbc2NvcGVdID0gY2hpbGRTdGF0ZSwgX2IpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBfYSwgX2I7XG4gICAgICAgIH07XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICByZXR1cm4gc2NvcGUuc2V0O1xuICAgIH1cbn1cbmZ1bmN0aW9uIGlzb2xhdGVTb3VyY2Uoc291cmNlLCBzY29wZSkge1xuICAgIHJldHVybiBzb3VyY2Uuc2VsZWN0KHNjb3BlKTtcbn1cbmV4cG9ydHMuaXNvbGF0ZVNvdXJjZSA9IGlzb2xhdGVTb3VyY2U7XG5mdW5jdGlvbiBpc29sYXRlU2luayhpbm5lclJlZHVjZXIkLCBzY29wZSkge1xuICAgIHZhciBnZXQgPSBtYWtlR2V0dGVyKHNjb3BlKTtcbiAgICB2YXIgc2V0ID0gbWFrZVNldHRlcihzY29wZSk7XG4gICAgcmV0dXJuIGlubmVyUmVkdWNlciRcbiAgICAgICAgLm1hcChmdW5jdGlvbiAoaW5uZXJSZWR1Y2VyKSB7IHJldHVybiBmdW5jdGlvbiBvdXRlclJlZHVjZXIob3V0ZXIpIHtcbiAgICAgICAgdmFyIHByZXZJbm5lciA9IGdldChvdXRlcik7XG4gICAgICAgIHZhciBuZXh0SW5uZXIgPSBpbm5lclJlZHVjZXIocHJldklubmVyKTtcbiAgICAgICAgaWYgKHByZXZJbm5lciA9PT0gbmV4dElubmVyKSB7XG4gICAgICAgICAgICByZXR1cm4gb3V0ZXI7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gc2V0KG91dGVyLCBuZXh0SW5uZXIpO1xuICAgICAgICB9XG4gICAgfTsgfSk7XG59XG5leHBvcnRzLmlzb2xhdGVTaW5rID0gaXNvbGF0ZVNpbms7XG4vKipcbiAqIFJlcHJlc2VudHMgYSBwaWVjZSBvZiBhcHBsaWNhdGlvbiBzdGF0ZSBkeW5hbWljYWxseSBjaGFuZ2luZyBvdmVyIHRpbWUuXG4gKi9cbnZhciBTdGF0ZVNvdXJjZSA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gU3RhdGVTb3VyY2Uoc3RyZWFtLCBuYW1lKSB7XG4gICAgICAgIHRoaXMuaXNvbGF0ZVNvdXJjZSA9IGlzb2xhdGVTb3VyY2U7XG4gICAgICAgIHRoaXMuaXNvbGF0ZVNpbmsgPSBpc29sYXRlU2luaztcbiAgICAgICAgdGhpcy5fc3RhdGUkID0gc3RyZWFtXG4gICAgICAgICAgICAuZmlsdGVyKGZ1bmN0aW9uIChzKSB7IHJldHVybiB0eXBlb2YgcyAhPT0gJ3VuZGVmaW5lZCc7IH0pXG4gICAgICAgICAgICAuY29tcG9zZShkcm9wUmVwZWF0c18xLmRlZmF1bHQoKSlcbiAgICAgICAgICAgIC5yZW1lbWJlcigpO1xuICAgICAgICB0aGlzLl9uYW1lID0gbmFtZTtcbiAgICAgICAgdGhpcy5zdGF0ZSQgPSBhZGFwdF8xLmFkYXB0KHRoaXMuX3N0YXRlJCk7XG4gICAgICAgIHRoaXMuX3N0YXRlJC5faXNDeWNsZVNvdXJjZSA9IG5hbWU7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFNlbGVjdHMgYSBwYXJ0IChvciBzY29wZSkgb2YgdGhlIHN0YXRlIG9iamVjdCBhbmQgcmV0dXJucyBhIG5ldyBTdGF0ZVNvdXJjZVxuICAgICAqIGR5bmFtaWNhbGx5IHJlcHJlc2VudGluZyB0aGF0IHNlbGVjdGVkIHBhcnQgb2YgdGhlIHN0YXRlLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd8bnVtYmVyfGxlbnN9IHNjb3BlIGFzIGEgc3RyaW5nLCB0aGlzIGFyZ3VtZW50IHJlcHJlc2VudHMgdGhlXG4gICAgICogcHJvcGVydHkgeW91IHdhbnQgdG8gc2VsZWN0IGZyb20gdGhlIHN0YXRlIG9iamVjdC4gQXMgYSBudW1iZXIsIHRoaXNcbiAgICAgKiByZXByZXNlbnRzIHRoZSBhcnJheSBpbmRleCB5b3Ugd2FudCB0byBzZWxlY3QgZnJvbSB0aGUgc3RhdGUgYXJyYXkuIEFzIGFcbiAgICAgKiBsZW5zIG9iamVjdCAoYW4gb2JqZWN0IHdpdGggZ2V0KCkgYW5kIHNldCgpKSwgdGhpcyBhcmd1bWVudCByZXByZXNlbnRzIGFueVxuICAgICAqIGN1c3RvbSB3YXkgb2Ygc2VsZWN0aW5nIHNvbWV0aGluZyBmcm9tIHRoZSBzdGF0ZSBvYmplY3QuXG4gICAgICovXG4gICAgU3RhdGVTb3VyY2UucHJvdG90eXBlLnNlbGVjdCA9IGZ1bmN0aW9uIChzY29wZSkge1xuICAgICAgICB2YXIgZ2V0ID0gbWFrZUdldHRlcihzY29wZSk7XG4gICAgICAgIHJldHVybiBuZXcgU3RhdGVTb3VyY2UodGhpcy5fc3RhdGUkLm1hcChnZXQpLCB0aGlzLl9uYW1lKTtcbiAgICB9O1xuICAgIHJldHVybiBTdGF0ZVNvdXJjZTtcbn0oKSk7XG5leHBvcnRzLlN0YXRlU291cmNlID0gU3RhdGVTb3VyY2U7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1TdGF0ZVNvdXJjZS5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBvbmlvbmlmeV8xID0gcmVxdWlyZShcIi4vb25pb25pZnlcIik7XG52YXIgU3RhdGVTb3VyY2VfMSA9IHJlcXVpcmUoXCIuL1N0YXRlU291cmNlXCIpO1xuZXhwb3J0cy5TdGF0ZVNvdXJjZSA9IFN0YXRlU291cmNlXzEuU3RhdGVTb3VyY2U7XG5leHBvcnRzLmlzb2xhdGVTb3VyY2UgPSBTdGF0ZVNvdXJjZV8xLmlzb2xhdGVTb3VyY2U7XG5leHBvcnRzLmlzb2xhdGVTaW5rID0gU3RhdGVTb3VyY2VfMS5pc29sYXRlU2luaztcbnZhciBDb2xsZWN0aW9uXzEgPSByZXF1aXJlKFwiLi9Db2xsZWN0aW9uXCIpO1xuZXhwb3J0cy5JbnN0YW5jZXMgPSBDb2xsZWN0aW9uXzEuSW5zdGFuY2VzO1xuZXhwb3J0cy5tYWtlQ29sbGVjdGlvbiA9IENvbGxlY3Rpb25fMS5tYWtlQ29sbGVjdGlvbjtcbi8qKlxuICogTGlrZSBgbWVyZ2VgIGluIHhzdHJlYW0sIHRoaXMgb3BlcmF0b3IgYmxlbmRzIG11bHRpcGxlIHN0cmVhbXMgdG9nZXRoZXIsIGJ1dFxuICogcGlja3MgdGhvc2Ugc3RyZWFtcyBmcm9tIGEgc3RyZWFtIG9mIGluc3RhbmNlcy5cbiAqXG4gKiBUaGUgaW5zdGFuY2VzIGRhdGEgc3RydWN0dXJlIGhhcyBhIHNpbmtzIG9iamVjdCBmb3IgZWFjaCBpbnN0YW5jZS4gVXNlIHRoZVxuICogYHNlbGVjdG9yYCBzdHJpbmcgdG8gcGljayBhIHN0cmVhbSBmcm9tIHRoZSBzaW5rcyBvYmplY3Qgb2YgZWFjaCBpbnN0YW5jZSxcbiAqIHRoZW4gcGlja01lcmdlIHdpbGwgbWVyZ2UgYWxsIHRob3NlIHBpY2tlZCBzdHJlYW1zLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBzZWxlY3RvciBhIG5hbWUgb2YgYSBjaGFubmVsIGluIGEgc2lua3Mgb2JqZWN0IGJlbG9uZ2luZyB0b1xuICogZWFjaCBjb21wb25lbnQgaW4gdGhlIGNvbGxlY3Rpb24gb2YgaW5zdGFuY2VzLlxuICogQHJldHVybiB7RnVuY3Rpb259IGFuIG9wZXJhdG9yIHRvIGJlIHVzZWQgd2l0aCB4c3RyZWFtJ3MgYGNvbXBvc2VgIG1ldGhvZC5cbiAqL1xudmFyIHBpY2tNZXJnZV8xID0gcmVxdWlyZShcIi4vcGlja01lcmdlXCIpO1xuZXhwb3J0cy5waWNrTWVyZ2UgPSBwaWNrTWVyZ2VfMS5waWNrTWVyZ2U7XG4vKipcbiAqIExpa2UgYGNvbWJpbmVgIGluIHhzdHJlYW0sIHRoaXMgb3BlcmF0b3IgY29tYmluZXMgbXVsdGlwbGUgc3RyZWFtcyB0b2dldGhlcixcbiAqIGJ1dCBwaWNrcyB0aG9zZSBzdHJlYW1zIGZyb20gYSBzdHJlYW0gb2YgaW5zdGFuY2VzLlxuICpcbiAqIFRoZSBpbnN0YW5jZXMgZGF0YSBzdHJ1Y3R1cmUgaGFzIGEgc2lua3Mgb2JqZWN0IGZvciBlYWNoIGluc3RhbmNlLiBVc2UgdGhlXG4gKiBgc2VsZWN0b3JgIHN0cmluZyB0byBwaWNrIGEgc3RyZWFtIGZyb20gdGhlIHNpbmtzIG9iamVjdCBvZiBlYWNoIGluc3RhbmNlLFxuICogdGhlbiBwaWNrQ29tYmluZSB3aWxsIGNvbWJpbmUgYWxsIHRob3NlIHBpY2tlZCBzdHJlYW1zLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBzZWxlY3RvciBhIG5hbWUgb2YgYSBjaGFubmVsIGluIGEgc2lua3Mgb2JqZWN0IGJlbG9uZ2luZyB0b1xuICogZWFjaCBjb21wb25lbnQgaW4gdGhlIGNvbGxlY3Rpb24gb2YgaW5zdGFuY2VzLlxuICogQHJldHVybiB7RnVuY3Rpb259IGFuIG9wZXJhdG9yIHRvIGJlIHVzZWQgd2l0aCB4c3RyZWFtJ3MgYGNvbXBvc2VgIG1ldGhvZC5cbiAqL1xudmFyIHBpY2tDb21iaW5lXzEgPSByZXF1aXJlKFwiLi9waWNrQ29tYmluZVwiKTtcbmV4cG9ydHMucGlja0NvbWJpbmUgPSBwaWNrQ29tYmluZV8xLnBpY2tDb21iaW5lO1xuLyoqXG4gKiBHaXZlbiBhIEN5Y2xlLmpzIGNvbXBvbmVudCB0aGF0IGV4cGVjdHMgYW4gb25pb24gc3RhdGUgKnNvdXJjZSogYW5kIHdpbGxcbiAqIG91dHB1dCBvbmlvbiByZWR1Y2VyICpzaW5rKiwgdGhpcyBmdW5jdGlvbiBzZXRzIHVwIHRoZSBzdGF0ZSBtYW5hZ2VtZW50XG4gKiBtZWNoYW5pY3MgdG8gYWNjdW11bGF0ZSBzdGF0ZSBvdmVyIHRpbWUgYW5kIHByb3ZpZGUgdGhlIHN0YXRlIHNvdXJjZS4gSXRcbiAqIHJldHVybnMgYSBDeWNsZS5qcyBjb21wb25lbnQgd2hpY2ggd3JhcHMgdGhlIGNvbXBvbmVudCBnaXZlbiBhcyBpbnB1dC5cbiAqIEVzc2VudGlhbGx5LCBpdCBob29rcyB1cCB0aGUgb25pb24gc2luayB3aXRoIHRoZSBvbmlvbiBzb3VyY2UgYXMgYSBjeWNsZS5cbiAqXG4gKiBPcHRpb25hbGx5LCB5b3UgY2FuIHBhc3MgYSBjdXN0b20gbmFtZSBmb3IgdGhlIG9uaW9uIGNoYW5uZWwuIEJ5IGRlZmF1bHQsXG4gKiB0aGUgbmFtZSBpcyAnb25pb24nIGluIHNvdXJjZXMgYW5kIHNpbmtzLCBidXQgeW91IGNhbiBjaGFuZ2UgdGhhdCB0byBiZVxuICogd2hhdGV2ZXIgc3RyaW5nIHlvdSB3aXNoLlxuICpcbiAqIEBwYXJhbSB7RnVuY3Rpb259IG1haW4gYSBmdW5jdGlvbiB0aGF0IHRha2VzIGBzb3VyY2VzYCBhcyBpbnB1dCBhbmQgb3V0cHV0c1xuICogYHNpbmtzYC5cbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIGFuIG9wdGlvbmFsIHN0cmluZyBmb3IgdGhlIGN1c3RvbSBuYW1lIGdpdmVuIHRvIHRoZVxuICogb25pb24gY2hhbm5lbC4gQnkgZGVmYXVsdCwgaXQgaXMgJ29uaW9uJy5cbiAqIEByZXR1cm4ge0Z1bmN0aW9ufSBhIGNvbXBvbmVudCB0aGF0IHdyYXBzIHRoZSBtYWluIGZ1bmN0aW9uIGdpdmVuIGFzIGlucHV0LFxuICogYWRkaW5nIHN0YXRlIGFjY3VtdWxhdGlvbiBsb2dpYyB0byBpdC5cbiAqL1xuZXhwb3J0cy5kZWZhdWx0ID0gb25pb25pZnlfMS5vbmlvbmlmeTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWluZGV4LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHhzdHJlYW1fMSA9IHJlcXVpcmUoXCJ4c3RyZWFtXCIpO1xudmFyIFN0YXRlU291cmNlXzEgPSByZXF1aXJlKFwiLi9TdGF0ZVNvdXJjZVwiKTtcbmZ1bmN0aW9uIG9uaW9uaWZ5KG1haW4sIG5hbWUpIHtcbiAgICBpZiAobmFtZSA9PT0gdm9pZCAwKSB7IG5hbWUgPSAnb25pb24nOyB9XG4gICAgcmV0dXJuIGZ1bmN0aW9uIG1haW5PbmlvbmlmaWVkKHNvdXJjZXMpIHtcbiAgICAgICAgdmFyIHJlZHVjZXJNaW1pYyQgPSB4c3RyZWFtXzEuZGVmYXVsdC5jcmVhdGUoKTtcbiAgICAgICAgdmFyIHN0YXRlJCA9IHJlZHVjZXJNaW1pYyRcbiAgICAgICAgICAgIC5mb2xkKGZ1bmN0aW9uIChzdGF0ZSwgcmVkdWNlcikgeyByZXR1cm4gcmVkdWNlcihzdGF0ZSk7IH0sIHZvaWQgMClcbiAgICAgICAgICAgIC5kcm9wKDEpO1xuICAgICAgICBzb3VyY2VzW25hbWVdID0gbmV3IFN0YXRlU291cmNlXzEuU3RhdGVTb3VyY2Uoc3RhdGUkLCBuYW1lKTtcbiAgICAgICAgdmFyIHNpbmtzID0gbWFpbihzb3VyY2VzKTtcbiAgICAgICAgaWYgKHNpbmtzW25hbWVdKSB7XG4gICAgICAgICAgICB2YXIgc3RyZWFtJCA9IHhzdHJlYW1fMS5kZWZhdWx0LmZyb21PYnNlcnZhYmxlKHNpbmtzW25hbWVdKTtcbiAgICAgICAgICAgIHJlZHVjZXJNaW1pYyQuaW1pdGF0ZShzdHJlYW0kKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc2lua3M7XG4gICAgfTtcbn1cbmV4cG9ydHMub25pb25pZnkgPSBvbmlvbmlmeTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPW9uaW9uaWZ5LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHhzdHJlYW1fMSA9IHJlcXVpcmUoXCJ4c3RyZWFtXCIpO1xudmFyIFBpY2tDb21iaW5lTGlzdGVuZXIgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFBpY2tDb21iaW5lTGlzdGVuZXIoa2V5LCBvdXQsIHAsIGlucykge1xuICAgICAgICB0aGlzLmtleSA9IGtleTtcbiAgICAgICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgICAgIHRoaXMucCA9IHA7XG4gICAgICAgIHRoaXMudmFsID0geHN0cmVhbV8xLk5PO1xuICAgICAgICB0aGlzLmlucyA9IGlucztcbiAgICB9XG4gICAgUGlja0NvbWJpbmVMaXN0ZW5lci5wcm90b3R5cGUuX24gPSBmdW5jdGlvbiAodCkge1xuICAgICAgICB2YXIgcCA9IHRoaXMucCwgb3V0ID0gdGhpcy5vdXQ7XG4gICAgICAgIHRoaXMudmFsID0gdDtcbiAgICAgICAgaWYgKG91dCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucC51cCgpO1xuICAgIH07XG4gICAgUGlja0NvbWJpbmVMaXN0ZW5lci5wcm90b3R5cGUuX2UgPSBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgIHZhciBvdXQgPSB0aGlzLm91dDtcbiAgICAgICAgaWYgKG91dCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIG91dC5fZShlcnIpO1xuICAgIH07XG4gICAgUGlja0NvbWJpbmVMaXN0ZW5lci5wcm90b3R5cGUuX2MgPSBmdW5jdGlvbiAoKSB7XG4gICAgfTtcbiAgICByZXR1cm4gUGlja0NvbWJpbmVMaXN0ZW5lcjtcbn0oKSk7XG52YXIgUGlja0NvbWJpbmUgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFBpY2tDb21iaW5lKHNlbCwgaW5zKSB7XG4gICAgICAgIHRoaXMudHlwZSA9ICdjb21iaW5lJztcbiAgICAgICAgdGhpcy5pbnMgPSBpbnM7XG4gICAgICAgIHRoaXMuc2VsID0gc2VsO1xuICAgICAgICB0aGlzLm91dCA9IG51bGw7XG4gICAgICAgIHRoaXMuaWxzID0gbmV3IE1hcCgpO1xuICAgICAgICB0aGlzLmluc3QgPSBudWxsO1xuICAgIH1cbiAgICBQaWNrQ29tYmluZS5wcm90b3R5cGUuX3N0YXJ0ID0gZnVuY3Rpb24gKG91dCkge1xuICAgICAgICB0aGlzLm91dCA9IG91dDtcbiAgICAgICAgdGhpcy5pbnMuX2FkZCh0aGlzKTtcbiAgICB9O1xuICAgIFBpY2tDb21iaW5lLnByb3RvdHlwZS5fc3RvcCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5pbnMuX3JlbW92ZSh0aGlzKTtcbiAgICAgICAgdmFyIGlscyA9IHRoaXMuaWxzO1xuICAgICAgICBpbHMuZm9yRWFjaChmdW5jdGlvbiAoaWwpIHtcbiAgICAgICAgICAgIGlsLmlucy5fcmVtb3ZlKGlsKTtcbiAgICAgICAgICAgIGlsLmlucyA9IG51bGw7XG4gICAgICAgICAgICBpbC5vdXQgPSBudWxsO1xuICAgICAgICAgICAgaWwudmFsID0gbnVsbDtcbiAgICAgICAgfSk7XG4gICAgICAgIGlscy5jbGVhcigpO1xuICAgICAgICB0aGlzLm91dCA9IG51bGw7XG4gICAgICAgIHRoaXMuaWxzID0gbmV3IE1hcCgpO1xuICAgICAgICB0aGlzLmluc3QgPSBudWxsO1xuICAgIH07XG4gICAgUGlja0NvbWJpbmUucHJvdG90eXBlLnVwID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgYXJyID0gdGhpcy5pbnN0LmFycjtcbiAgICAgICAgdmFyIG4gPSBhcnIubGVuZ3RoO1xuICAgICAgICB2YXIgaWxzID0gdGhpcy5pbHM7XG4gICAgICAgIHZhciBvdXRBcnIgPSBBcnJheShuKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICAgIHZhciBzaW5rcyA9IGFycltpXTtcbiAgICAgICAgICAgIHZhciBrZXkgPSBzaW5rcy5fa2V5O1xuICAgICAgICAgICAgaWYgKCFpbHMuaGFzKGtleSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgdmFsID0gaWxzLmdldChrZXkpLnZhbDtcbiAgICAgICAgICAgIGlmICh2YWwgPT09IHhzdHJlYW1fMS5OTykge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG91dEFycltpXSA9IHZhbDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLm91dC5fbihvdXRBcnIpO1xuICAgIH07XG4gICAgUGlja0NvbWJpbmUucHJvdG90eXBlLl9uID0gZnVuY3Rpb24gKGluc3QpIHtcbiAgICAgICAgdGhpcy5pbnN0ID0gaW5zdDtcbiAgICAgICAgdmFyIGFyclNpbmtzID0gaW5zdC5hcnI7XG4gICAgICAgIHZhciBpbHMgPSB0aGlzLmlscztcbiAgICAgICAgdmFyIG91dCA9IHRoaXMub3V0O1xuICAgICAgICB2YXIgc2VsID0gdGhpcy5zZWw7XG4gICAgICAgIHZhciBkaWN0ID0gaW5zdC5kaWN0O1xuICAgICAgICB2YXIgbiA9IGFyclNpbmtzLmxlbmd0aDtcbiAgICAgICAgLy8gcmVtb3ZlXG4gICAgICAgIHZhciByZW1vdmVkID0gZmFsc2U7XG4gICAgICAgIGlscy5mb3JFYWNoKGZ1bmN0aW9uIChpbCwga2V5KSB7XG4gICAgICAgICAgICBpZiAoIWRpY3QuaGFzKGtleSkpIHtcbiAgICAgICAgICAgICAgICBpbC5pbnMuX3JlbW92ZShpbCk7XG4gICAgICAgICAgICAgICAgaWwuaW5zID0gbnVsbDtcbiAgICAgICAgICAgICAgICBpbC5vdXQgPSBudWxsO1xuICAgICAgICAgICAgICAgIGlsLnZhbCA9IG51bGw7XG4gICAgICAgICAgICAgICAgaWxzLmRlbGV0ZShrZXkpO1xuICAgICAgICAgICAgICAgIHJlbW92ZWQgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgaWYgKG4gPT09IDApIHtcbiAgICAgICAgICAgIG91dC5fbihbXSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgLy8gYWRkXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgICB2YXIgc2lua3MgPSBhcnJTaW5rc1tpXTtcbiAgICAgICAgICAgIHZhciBrZXkgPSBzaW5rcy5fa2V5O1xuICAgICAgICAgICAgdmFyIHNpbmsgPSB4c3RyZWFtXzEuZGVmYXVsdC5mcm9tT2JzZXJ2YWJsZShzaW5rc1tzZWxdKTtcbiAgICAgICAgICAgIGlmICghaWxzLmhhcyhrZXkpKSB7XG4gICAgICAgICAgICAgICAgaWxzLnNldChrZXksIG5ldyBQaWNrQ29tYmluZUxpc3RlbmVyKGtleSwgb3V0LCB0aGlzLCBzaW5rKSk7XG4gICAgICAgICAgICAgICAgc2luay5fYWRkKGlscy5nZXQoa2V5KSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJlbW92ZWQpIHtcbiAgICAgICAgICAgIHRoaXMudXAoKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgUGlja0NvbWJpbmUucHJvdG90eXBlLl9lID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgdmFyIG91dCA9IHRoaXMub3V0O1xuICAgICAgICBpZiAob3V0ID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgb3V0Ll9lKGUpO1xuICAgIH07XG4gICAgUGlja0NvbWJpbmUucHJvdG90eXBlLl9jID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgb3V0ID0gdGhpcy5vdXQ7XG4gICAgICAgIGlmIChvdXQgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBvdXQuX2MoKTtcbiAgICB9O1xuICAgIHJldHVybiBQaWNrQ29tYmluZTtcbn0oKSk7XG5mdW5jdGlvbiBwaWNrQ29tYmluZShzZWxlY3Rvcikge1xuICAgIHJldHVybiBmdW5jdGlvbiBwaWNrQ29tYmluZU9wZXJhdG9yKGluc3QkKSB7XG4gICAgICAgIHJldHVybiBuZXcgeHN0cmVhbV8xLlN0cmVhbShuZXcgUGlja0NvbWJpbmUoc2VsZWN0b3IsIGluc3QkKSk7XG4gICAgfTtcbn1cbmV4cG9ydHMucGlja0NvbWJpbmUgPSBwaWNrQ29tYmluZTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXBpY2tDb21iaW5lLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHhzdHJlYW1fMSA9IHJlcXVpcmUoXCJ4c3RyZWFtXCIpO1xudmFyIFBpY2tNZXJnZUxpc3RlbmVyID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBQaWNrTWVyZ2VMaXN0ZW5lcihvdXQsIHAsIGlucykge1xuICAgICAgICB0aGlzLmlucyA9IGlucztcbiAgICAgICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgICAgIHRoaXMucCA9IHA7XG4gICAgfVxuICAgIFBpY2tNZXJnZUxpc3RlbmVyLnByb3RvdHlwZS5fbiA9IGZ1bmN0aW9uICh0KSB7XG4gICAgICAgIHZhciBwID0gdGhpcy5wLCBvdXQgPSB0aGlzLm91dDtcbiAgICAgICAgaWYgKG91dCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIG91dC5fbih0KTtcbiAgICB9O1xuICAgIFBpY2tNZXJnZUxpc3RlbmVyLnByb3RvdHlwZS5fZSA9IGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgdmFyIG91dCA9IHRoaXMub3V0O1xuICAgICAgICBpZiAob3V0ID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgb3V0Ll9lKGVycik7XG4gICAgfTtcbiAgICBQaWNrTWVyZ2VMaXN0ZW5lci5wcm90b3R5cGUuX2MgPSBmdW5jdGlvbiAoKSB7XG4gICAgfTtcbiAgICByZXR1cm4gUGlja01lcmdlTGlzdGVuZXI7XG59KCkpO1xudmFyIFBpY2tNZXJnZSA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gUGlja01lcmdlKHNlbCwgaW5zKSB7XG4gICAgICAgIHRoaXMudHlwZSA9ICdwaWNrTWVyZ2UnO1xuICAgICAgICB0aGlzLmlucyA9IGlucztcbiAgICAgICAgdGhpcy5vdXQgPSBudWxsO1xuICAgICAgICB0aGlzLnNlbCA9IHNlbDtcbiAgICAgICAgdGhpcy5pbHMgPSBuZXcgTWFwKCk7XG4gICAgICAgIHRoaXMuaW5zdCA9IG51bGw7XG4gICAgfVxuICAgIFBpY2tNZXJnZS5wcm90b3R5cGUuX3N0YXJ0ID0gZnVuY3Rpb24gKG91dCkge1xuICAgICAgICB0aGlzLm91dCA9IG91dDtcbiAgICAgICAgdGhpcy5pbnMuX2FkZCh0aGlzKTtcbiAgICB9O1xuICAgIFBpY2tNZXJnZS5wcm90b3R5cGUuX3N0b3AgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuaW5zLl9yZW1vdmUodGhpcyk7XG4gICAgICAgIHZhciBpbHMgPSB0aGlzLmlscztcbiAgICAgICAgaWxzLmZvckVhY2goZnVuY3Rpb24gKGlsLCBrZXkpIHtcbiAgICAgICAgICAgIGlsLmlucy5fcmVtb3ZlKGlsKTtcbiAgICAgICAgICAgIGlsLmlucyA9IG51bGw7XG4gICAgICAgICAgICBpbC5vdXQgPSBudWxsO1xuICAgICAgICAgICAgaWxzLmRlbGV0ZShrZXkpO1xuICAgICAgICB9KTtcbiAgICAgICAgaWxzLmNsZWFyKCk7XG4gICAgICAgIHRoaXMub3V0ID0gbnVsbDtcbiAgICAgICAgdGhpcy5pbHMgPSBuZXcgTWFwKCk7XG4gICAgICAgIHRoaXMuaW5zdCA9IG51bGw7XG4gICAgfTtcbiAgICBQaWNrTWVyZ2UucHJvdG90eXBlLl9uID0gZnVuY3Rpb24gKGluc3QpIHtcbiAgICAgICAgdGhpcy5pbnN0ID0gaW5zdDtcbiAgICAgICAgdmFyIGFyclNpbmtzID0gaW5zdC5hcnI7XG4gICAgICAgIHZhciBpbHMgPSB0aGlzLmlscztcbiAgICAgICAgdmFyIG91dCA9IHRoaXMub3V0O1xuICAgICAgICB2YXIgc2VsID0gdGhpcy5zZWw7XG4gICAgICAgIHZhciBuID0gYXJyU2lua3MubGVuZ3RoO1xuICAgICAgICAvLyBhZGRcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICAgIHZhciBzaW5rcyA9IGFyclNpbmtzW2ldO1xuICAgICAgICAgICAgdmFyIGtleSA9IHNpbmtzLl9rZXk7XG4gICAgICAgICAgICB2YXIgc2luayA9IHhzdHJlYW1fMS5kZWZhdWx0LmZyb21PYnNlcnZhYmxlKHNpbmtzW3NlbF0pO1xuICAgICAgICAgICAgaWYgKCFpbHMuaGFzKGtleSkpIHtcbiAgICAgICAgICAgICAgICBpbHMuc2V0KGtleSwgbmV3IFBpY2tNZXJnZUxpc3RlbmVyKG91dCwgdGhpcywgc2luaykpO1xuICAgICAgICAgICAgICAgIHNpbmsuX2FkZChpbHMuZ2V0KGtleSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIHJlbW92ZVxuICAgICAgICBpbHMuZm9yRWFjaChmdW5jdGlvbiAoaWwsIGtleSkge1xuICAgICAgICAgICAgaWYgKCFpbnN0LmRpY3QuaGFzKGtleSkgfHwgIWluc3QuZGljdC5nZXQoa2V5KSkge1xuICAgICAgICAgICAgICAgIGlsLmlucy5fcmVtb3ZlKGlsKTtcbiAgICAgICAgICAgICAgICBpbC5pbnMgPSBudWxsO1xuICAgICAgICAgICAgICAgIGlsLm91dCA9IG51bGw7XG4gICAgICAgICAgICAgICAgaWxzLmRlbGV0ZShrZXkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9O1xuICAgIFBpY2tNZXJnZS5wcm90b3R5cGUuX2UgPSBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgIHZhciB1ID0gdGhpcy5vdXQ7XG4gICAgICAgIGlmICh1ID09PSBudWxsKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB1Ll9lKGVycik7XG4gICAgfTtcbiAgICBQaWNrTWVyZ2UucHJvdG90eXBlLl9jID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgdSA9IHRoaXMub3V0O1xuICAgICAgICBpZiAodSA9PT0gbnVsbClcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdS5fYygpO1xuICAgIH07XG4gICAgcmV0dXJuIFBpY2tNZXJnZTtcbn0oKSk7XG5mdW5jdGlvbiBwaWNrTWVyZ2Uoc2VsZWN0b3IpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gcGlja01lcmdlT3BlcmF0b3IoaW5zdCQpIHtcbiAgICAgICAgcmV0dXJuIG5ldyB4c3RyZWFtXzEuU3RyZWFtKG5ldyBQaWNrTWVyZ2Uoc2VsZWN0b3IsIGluc3QkKSk7XG4gICAgfTtcbn1cbmV4cG9ydHMucGlja01lcmdlID0gcGlja01lcmdlO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9cGlja01lcmdlLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xudmFyIF9fYXNzaWduID0gKHRoaXMgJiYgdGhpcy5fX2Fzc2lnbikgfHwgT2JqZWN0LmFzc2lnbiB8fCBmdW5jdGlvbih0KSB7XG4gICAgZm9yICh2YXIgcywgaSA9IDEsIG4gPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgbjsgaSsrKSB7XG4gICAgICAgIHMgPSBhcmd1bWVudHNbaV07XG4gICAgICAgIGZvciAodmFyIHAgaW4gcykgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzLCBwKSlcbiAgICAgICAgICAgIHRbcF0gPSBzW3BdO1xuICAgIH1cbiAgICByZXR1cm4gdDtcbn07XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgeHN0cmVhbV8xID0gcmVxdWlyZShcInhzdHJlYW1cIik7XG52YXIgZGVib3VuY2VfMSA9IHJlcXVpcmUoXCJ4c3RyZWFtL2V4dHJhL2RlYm91bmNlXCIpO1xuZnVuY3Rpb24gc2VyaWFsaXplKHN0YXRlKSB7XG4gICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHN0YXRlKTtcbn1cbmZ1bmN0aW9uIGRlc2VyaWFsaXplKHN0cikge1xuICAgIHJldHVybiBzdHIgPT09IG51bGwgPyB2b2lkIDAgOiBKU09OLnBhcnNlKHN0cik7XG59XG5mdW5jdGlvbiBzdG9yYWdlaWZ5KENvbXBvbmVudCwgb3B0aW9ucykge1xuICAgIHZhciBfb3B0aW9ucyA9IF9fYXNzaWduKHsgXG4gICAgICAgIC8vIGRlZmF1bHRzXG4gICAgICAgIGtleTogJ3N0b3JhZ2VpZnknLCBzZXJpYWxpemU6IHNlcmlhbGl6ZSxcbiAgICAgICAgZGVzZXJpYWxpemU6IGRlc2VyaWFsaXplIH0sIG9wdGlvbnMpO1xuICAgIHJldHVybiBmdW5jdGlvbiAoc291cmNlcykge1xuICAgICAgICB2YXIgbG9jYWxTdG9yYWdlJCA9IHNvdXJjZXMuc3RvcmFnZS5sb2NhbC5nZXRJdGVtKF9vcHRpb25zLmtleSkudGFrZSgxKTtcbiAgICAgICAgdmFyIHN0b3JlZERhdGEkID0gbG9jYWxTdG9yYWdlJC5tYXAoX29wdGlvbnMuZGVzZXJpYWxpemUpO1xuICAgICAgICB2YXIgc3RhdGUkID0gc291cmNlcy5vbmlvbi5zdGF0ZSRcbiAgICAgICAgICAgIC5jb21wb3NlKF9vcHRpb25zLmRlYm91bmNlID8gZGVib3VuY2VfMS5kZWZhdWx0KF9vcHRpb25zLmRlYm91bmNlKSA6IGZ1bmN0aW9uICh4KSB7IHJldHVybiB4OyB9KTtcbiAgICAgICAgdmFyIGNvbXBvbmVudFNpbmtzID0gQ29tcG9uZW50KHNvdXJjZXMpO1xuICAgICAgICAvLyBjaGFuZ2UgaW5pdGlhbCByZWR1Y2VyIChmaXJzdCByZWR1Y2VyKSBvZiBjb21wb25lbnRcbiAgICAgICAgLy8gdG8gbWVyZ2UgZGVmYXVsdCBzdGF0ZSB3aXRoIHN0b3JlZCBzdGF0ZVxuICAgICAgICB2YXIgY2hpbGRSZWR1Y2VyJCA9IGNvbXBvbmVudFNpbmtzLm9uaW9uO1xuICAgICAgICB2YXIgcGFyZW50UmVkdWNlciQgPSBzdG9yZWREYXRhJC5tYXAoZnVuY3Rpb24gKHN0b3JlZERhdGEpIHtcbiAgICAgICAgICAgIHJldHVybiBjaGlsZFJlZHVjZXIkLnN0YXJ0V2l0aChmdW5jdGlvbiBpbml0aWFsU3RvcmFnZVJlZHVjZXIocHJldlN0YXRlKSB7XG4gICAgICAgICAgICAgICAgaWYgKHByZXZTdGF0ZSAmJiBzdG9yZWREYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBfX2Fzc2lnbih7fSwgcHJldlN0YXRlLCBzdG9yZWREYXRhKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAocHJldlN0YXRlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBwcmV2U3RhdGU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc3RvcmVkRGF0YTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSkuZmxhdHRlbigpO1xuICAgICAgICB2YXIgc3RvcmFnZSQgPSBzdGF0ZSQubWFwKF9vcHRpb25zLnNlcmlhbGl6ZSlcbiAgICAgICAgICAgIC5tYXAoZnVuY3Rpb24gKHZhbHVlKSB7IHJldHVybiAoeyBrZXk6IF9vcHRpb25zLmtleSwgdmFsdWU6IHZhbHVlIH0pOyB9KTtcbiAgICAgICAgdmFyIHNpbmtzID0gX19hc3NpZ24oe30sIGNvbXBvbmVudFNpbmtzLCB7IG9uaW9uOiBwYXJlbnRSZWR1Y2VyJCwgc3RvcmFnZTogeHN0cmVhbV8xLmRlZmF1bHQubWVyZ2Uoc3RvcmFnZSQsIGNvbXBvbmVudFNpbmtzLnN0b3JhZ2UgfHwgeHN0cmVhbV8xLmRlZmF1bHQubmV2ZXIoKSkgfSk7XG4gICAgICAgIHJldHVybiBzaW5rcztcbiAgICB9O1xufVxuZXhwb3J0cy5kZWZhdWx0ID0gc3RvcmFnZWlmeTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWluZGV4LmpzLm1hcCIsIid1c2Ugc3RyaWN0JztcblxudmFyIGNvcHkgICAgICAgICAgICAgPSByZXF1aXJlKCdlczUtZXh0L29iamVjdC9jb3B5JylcbiAgLCBub3JtYWxpemVPcHRpb25zID0gcmVxdWlyZSgnZXM1LWV4dC9vYmplY3Qvbm9ybWFsaXplLW9wdGlvbnMnKVxuICAsIGVuc3VyZUNhbGxhYmxlICAgPSByZXF1aXJlKCdlczUtZXh0L29iamVjdC92YWxpZC1jYWxsYWJsZScpXG4gICwgbWFwICAgICAgICAgICAgICA9IHJlcXVpcmUoJ2VzNS1leHQvb2JqZWN0L21hcCcpXG4gICwgY2FsbGFibGUgICAgICAgICA9IHJlcXVpcmUoJ2VzNS1leHQvb2JqZWN0L3ZhbGlkLWNhbGxhYmxlJylcbiAgLCB2YWxpZFZhbHVlICAgICAgID0gcmVxdWlyZSgnZXM1LWV4dC9vYmplY3QvdmFsaWQtdmFsdWUnKVxuXG4gICwgYmluZCA9IEZ1bmN0aW9uLnByb3RvdHlwZS5iaW5kLCBkZWZpbmVQcm9wZXJ0eSA9IE9iamVjdC5kZWZpbmVQcm9wZXJ0eVxuICAsIGhhc093blByb3BlcnR5ID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eVxuICAsIGRlZmluZTtcblxuZGVmaW5lID0gZnVuY3Rpb24gKG5hbWUsIGRlc2MsIG9wdGlvbnMpIHtcblx0dmFyIHZhbHVlID0gdmFsaWRWYWx1ZShkZXNjKSAmJiBjYWxsYWJsZShkZXNjLnZhbHVlKSwgZGdzO1xuXHRkZ3MgPSBjb3B5KGRlc2MpO1xuXHRkZWxldGUgZGdzLndyaXRhYmxlO1xuXHRkZWxldGUgZGdzLnZhbHVlO1xuXHRkZ3MuZ2V0ID0gZnVuY3Rpb24gKCkge1xuXHRcdGlmICghb3B0aW9ucy5vdmVyd3JpdGVEZWZpbml0aW9uICYmIGhhc093blByb3BlcnR5LmNhbGwodGhpcywgbmFtZSkpIHJldHVybiB2YWx1ZTtcblx0XHRkZXNjLnZhbHVlID0gYmluZC5jYWxsKHZhbHVlLCBvcHRpb25zLnJlc29sdmVDb250ZXh0ID8gb3B0aW9ucy5yZXNvbHZlQ29udGV4dCh0aGlzKSA6IHRoaXMpO1xuXHRcdGRlZmluZVByb3BlcnR5KHRoaXMsIG5hbWUsIGRlc2MpO1xuXHRcdHJldHVybiB0aGlzW25hbWVdO1xuXHR9O1xuXHRyZXR1cm4gZGdzO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAocHJvcHMvKiwgb3B0aW9ucyovKSB7XG5cdHZhciBvcHRpb25zID0gbm9ybWFsaXplT3B0aW9ucyhhcmd1bWVudHNbMV0pO1xuXHRpZiAob3B0aW9ucy5yZXNvbHZlQ29udGV4dCAhPSBudWxsKSBlbnN1cmVDYWxsYWJsZShvcHRpb25zLnJlc29sdmVDb250ZXh0KTtcblx0cmV0dXJuIG1hcChwcm9wcywgZnVuY3Rpb24gKGRlc2MsIG5hbWUpIHsgcmV0dXJuIGRlZmluZShuYW1lLCBkZXNjLCBvcHRpb25zKTsgfSk7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgYXNzaWduICAgICAgICA9IHJlcXVpcmUoJ2VzNS1leHQvb2JqZWN0L2Fzc2lnbicpXG4gICwgbm9ybWFsaXplT3B0cyA9IHJlcXVpcmUoJ2VzNS1leHQvb2JqZWN0L25vcm1hbGl6ZS1vcHRpb25zJylcbiAgLCBpc0NhbGxhYmxlICAgID0gcmVxdWlyZSgnZXM1LWV4dC9vYmplY3QvaXMtY2FsbGFibGUnKVxuICAsIGNvbnRhaW5zICAgICAgPSByZXF1aXJlKCdlczUtZXh0L3N0cmluZy8jL2NvbnRhaW5zJylcblxuICAsIGQ7XG5cbmQgPSBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChkc2NyLCB2YWx1ZS8qLCBvcHRpb25zKi8pIHtcblx0dmFyIGMsIGUsIHcsIG9wdGlvbnMsIGRlc2M7XG5cdGlmICgoYXJndW1lbnRzLmxlbmd0aCA8IDIpIHx8ICh0eXBlb2YgZHNjciAhPT0gJ3N0cmluZycpKSB7XG5cdFx0b3B0aW9ucyA9IHZhbHVlO1xuXHRcdHZhbHVlID0gZHNjcjtcblx0XHRkc2NyID0gbnVsbDtcblx0fSBlbHNlIHtcblx0XHRvcHRpb25zID0gYXJndW1lbnRzWzJdO1xuXHR9XG5cdGlmIChkc2NyID09IG51bGwpIHtcblx0XHRjID0gdyA9IHRydWU7XG5cdFx0ZSA9IGZhbHNlO1xuXHR9IGVsc2Uge1xuXHRcdGMgPSBjb250YWlucy5jYWxsKGRzY3IsICdjJyk7XG5cdFx0ZSA9IGNvbnRhaW5zLmNhbGwoZHNjciwgJ2UnKTtcblx0XHR3ID0gY29udGFpbnMuY2FsbChkc2NyLCAndycpO1xuXHR9XG5cblx0ZGVzYyA9IHsgdmFsdWU6IHZhbHVlLCBjb25maWd1cmFibGU6IGMsIGVudW1lcmFibGU6IGUsIHdyaXRhYmxlOiB3IH07XG5cdHJldHVybiAhb3B0aW9ucyA/IGRlc2MgOiBhc3NpZ24obm9ybWFsaXplT3B0cyhvcHRpb25zKSwgZGVzYyk7XG59O1xuXG5kLmdzID0gZnVuY3Rpb24gKGRzY3IsIGdldCwgc2V0LyosIG9wdGlvbnMqLykge1xuXHR2YXIgYywgZSwgb3B0aW9ucywgZGVzYztcblx0aWYgKHR5cGVvZiBkc2NyICE9PSAnc3RyaW5nJykge1xuXHRcdG9wdGlvbnMgPSBzZXQ7XG5cdFx0c2V0ID0gZ2V0O1xuXHRcdGdldCA9IGRzY3I7XG5cdFx0ZHNjciA9IG51bGw7XG5cdH0gZWxzZSB7XG5cdFx0b3B0aW9ucyA9IGFyZ3VtZW50c1szXTtcblx0fVxuXHRpZiAoZ2V0ID09IG51bGwpIHtcblx0XHRnZXQgPSB1bmRlZmluZWQ7XG5cdH0gZWxzZSBpZiAoIWlzQ2FsbGFibGUoZ2V0KSkge1xuXHRcdG9wdGlvbnMgPSBnZXQ7XG5cdFx0Z2V0ID0gc2V0ID0gdW5kZWZpbmVkO1xuXHR9IGVsc2UgaWYgKHNldCA9PSBudWxsKSB7XG5cdFx0c2V0ID0gdW5kZWZpbmVkO1xuXHR9IGVsc2UgaWYgKCFpc0NhbGxhYmxlKHNldCkpIHtcblx0XHRvcHRpb25zID0gc2V0O1xuXHRcdHNldCA9IHVuZGVmaW5lZDtcblx0fVxuXHRpZiAoZHNjciA9PSBudWxsKSB7XG5cdFx0YyA9IHRydWU7XG5cdFx0ZSA9IGZhbHNlO1xuXHR9IGVsc2Uge1xuXHRcdGMgPSBjb250YWlucy5jYWxsKGRzY3IsICdjJyk7XG5cdFx0ZSA9IGNvbnRhaW5zLmNhbGwoZHNjciwgJ2UnKTtcblx0fVxuXG5cdGRlc2MgPSB7IGdldDogZ2V0LCBzZXQ6IHNldCwgY29uZmlndXJhYmxlOiBjLCBlbnVtZXJhYmxlOiBlIH07XG5cdHJldHVybiAhb3B0aW9ucyA/IGRlc2MgOiBhc3NpZ24obm9ybWFsaXplT3B0cyhvcHRpb25zKSwgZGVzYyk7XG59O1xuIiwiLy8gSW5zcGlyZWQgYnkgR29vZ2xlIENsb3N1cmU6XG4vLyBodHRwOi8vY2xvc3VyZS1saWJyYXJ5Lmdvb2dsZWNvZGUuY29tL3N2bi9kb2NzL1xuLy8gY2xvc3VyZV9nb29nX2FycmF5X2FycmF5LmpzLmh0bWwjZ29vZy5hcnJheS5jbGVhclxuXG5cInVzZSBzdHJpY3RcIjtcblxudmFyIHZhbHVlID0gcmVxdWlyZShcIi4uLy4uL29iamVjdC92YWxpZC12YWx1ZVwiKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoKSB7XG5cdHZhbHVlKHRoaXMpLmxlbmd0aCA9IDA7XG5cdHJldHVybiB0aGlzO1xufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG52YXIgbnVtYmVySXNOYU4gICAgICAgPSByZXF1aXJlKFwiLi4vLi4vbnVtYmVyL2lzLW5hblwiKVxuICAsIHRvUG9zSW50ICAgICAgICAgID0gcmVxdWlyZShcIi4uLy4uL251bWJlci90by1wb3MtaW50ZWdlclwiKVxuICAsIHZhbHVlICAgICAgICAgICAgID0gcmVxdWlyZShcIi4uLy4uL29iamVjdC92YWxpZC12YWx1ZVwiKVxuICAsIGluZGV4T2YgICAgICAgICAgID0gQXJyYXkucHJvdG90eXBlLmluZGV4T2ZcbiAgLCBvYmpIYXNPd25Qcm9wZXJ0eSA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHlcbiAgLCBhYnMgICAgICAgICAgICAgICA9IE1hdGguYWJzXG4gICwgZmxvb3IgICAgICAgICAgICAgPSBNYXRoLmZsb29yO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChzZWFyY2hFbGVtZW50IC8qLCBmcm9tSW5kZXgqLykge1xuXHR2YXIgaSwgbGVuZ3RoLCBmcm9tSW5kZXgsIHZhbDtcblx0aWYgKCFudW1iZXJJc05hTihzZWFyY2hFbGVtZW50KSkgcmV0dXJuIGluZGV4T2YuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblxuXHRsZW5ndGggPSB0b1Bvc0ludCh2YWx1ZSh0aGlzKS5sZW5ndGgpO1xuXHRmcm9tSW5kZXggPSBhcmd1bWVudHNbMV07XG5cdGlmIChpc05hTihmcm9tSW5kZXgpKSBmcm9tSW5kZXggPSAwO1xuXHRlbHNlIGlmIChmcm9tSW5kZXggPj0gMCkgZnJvbUluZGV4ID0gZmxvb3IoZnJvbUluZGV4KTtcblx0ZWxzZSBmcm9tSW5kZXggPSB0b1Bvc0ludCh0aGlzLmxlbmd0aCkgLSBmbG9vcihhYnMoZnJvbUluZGV4KSk7XG5cblx0Zm9yIChpID0gZnJvbUluZGV4OyBpIDwgbGVuZ3RoOyArK2kpIHtcblx0XHRpZiAob2JqSGFzT3duUHJvcGVydHkuY2FsbCh0aGlzLCBpKSkge1xuXHRcdFx0dmFsID0gdGhpc1tpXTtcblx0XHRcdGlmIChudW1iZXJJc05hTih2YWwpKSByZXR1cm4gaTsgLy8gSnNsaW50OiBpZ25vcmVcblx0XHR9XG5cdH1cblx0cmV0dXJuIC0xO1xufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCIuL2lzLWltcGxlbWVudGVkXCIpKClcblx0PyBBcnJheS5mcm9tXG5cdDogcmVxdWlyZShcIi4vc2hpbVwiKTtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICgpIHtcblx0dmFyIGZyb20gPSBBcnJheS5mcm9tLCBhcnIsIHJlc3VsdDtcblx0aWYgKHR5cGVvZiBmcm9tICE9PSBcImZ1bmN0aW9uXCIpIHJldHVybiBmYWxzZTtcblx0YXJyID0gW1wicmF6XCIsIFwiZHdhXCJdO1xuXHRyZXN1bHQgPSBmcm9tKGFycik7XG5cdHJldHVybiBCb29sZWFuKHJlc3VsdCAmJiAocmVzdWx0ICE9PSBhcnIpICYmIChyZXN1bHRbMV0gPT09IFwiZHdhXCIpKTtcbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcblxudmFyIGl0ZXJhdG9yU3ltYm9sID0gcmVxdWlyZShcImVzNi1zeW1ib2xcIikuaXRlcmF0b3JcbiAgLCBpc0FyZ3VtZW50cyAgICA9IHJlcXVpcmUoXCIuLi8uLi9mdW5jdGlvbi9pcy1hcmd1bWVudHNcIilcbiAgLCBpc0Z1bmN0aW9uICAgICA9IHJlcXVpcmUoXCIuLi8uLi9mdW5jdGlvbi9pcy1mdW5jdGlvblwiKVxuICAsIHRvUG9zSW50ICAgICAgID0gcmVxdWlyZShcIi4uLy4uL251bWJlci90by1wb3MtaW50ZWdlclwiKVxuICAsIGNhbGxhYmxlICAgICAgID0gcmVxdWlyZShcIi4uLy4uL29iamVjdC92YWxpZC1jYWxsYWJsZVwiKVxuICAsIHZhbGlkVmFsdWUgICAgID0gcmVxdWlyZShcIi4uLy4uL29iamVjdC92YWxpZC12YWx1ZVwiKVxuICAsIGlzVmFsdWUgICAgICAgID0gcmVxdWlyZShcIi4uLy4uL29iamVjdC9pcy12YWx1ZVwiKVxuICAsIGlzU3RyaW5nICAgICAgID0gcmVxdWlyZShcIi4uLy4uL3N0cmluZy9pcy1zdHJpbmdcIilcbiAgLCBpc0FycmF5ICAgICAgICA9IEFycmF5LmlzQXJyYXlcbiAgLCBjYWxsICAgICAgICAgICA9IEZ1bmN0aW9uLnByb3RvdHlwZS5jYWxsXG4gICwgZGVzYyAgICAgICAgICAgPSB7IGNvbmZpZ3VyYWJsZTogdHJ1ZSwgZW51bWVyYWJsZTogdHJ1ZSwgd3JpdGFibGU6IHRydWUsIHZhbHVlOiBudWxsIH1cbiAgLCBkZWZpbmVQcm9wZXJ0eSA9IE9iamVjdC5kZWZpbmVQcm9wZXJ0eTtcblxuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGNvbXBsZXhpdHlcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGFycmF5TGlrZSAvKiwgbWFwRm4sIHRoaXNBcmcqLykge1xuXHR2YXIgbWFwRm4gPSBhcmd1bWVudHNbMV1cblx0ICAsIHRoaXNBcmcgPSBhcmd1bWVudHNbMl1cblx0ICAsIENvbnRleHRcblx0ICAsIGlcblx0ICAsIGpcblx0ICAsIGFyclxuXHQgICwgbGVuZ3RoXG5cdCAgLCBjb2RlXG5cdCAgLCBpdGVyYXRvclxuXHQgICwgcmVzdWx0XG5cdCAgLCBnZXRJdGVyYXRvclxuXHQgICwgdmFsdWU7XG5cblx0YXJyYXlMaWtlID0gT2JqZWN0KHZhbGlkVmFsdWUoYXJyYXlMaWtlKSk7XG5cblx0aWYgKGlzVmFsdWUobWFwRm4pKSBjYWxsYWJsZShtYXBGbik7XG5cdGlmICghdGhpcyB8fCB0aGlzID09PSBBcnJheSB8fCAhaXNGdW5jdGlvbih0aGlzKSkge1xuXHRcdC8vIFJlc3VsdDogUGxhaW4gYXJyYXlcblx0XHRpZiAoIW1hcEZuKSB7XG5cdFx0XHRpZiAoaXNBcmd1bWVudHMoYXJyYXlMaWtlKSkge1xuXHRcdFx0XHQvLyBTb3VyY2U6IEFyZ3VtZW50c1xuXHRcdFx0XHRsZW5ndGggPSBhcnJheUxpa2UubGVuZ3RoO1xuXHRcdFx0XHRpZiAobGVuZ3RoICE9PSAxKSByZXR1cm4gQXJyYXkuYXBwbHkobnVsbCwgYXJyYXlMaWtlKTtcblx0XHRcdFx0YXJyID0gbmV3IEFycmF5KDEpO1xuXHRcdFx0XHRhcnJbMF0gPSBhcnJheUxpa2VbMF07XG5cdFx0XHRcdHJldHVybiBhcnI7XG5cdFx0XHR9XG5cdFx0XHRpZiAoaXNBcnJheShhcnJheUxpa2UpKSB7XG5cdFx0XHRcdC8vIFNvdXJjZTogQXJyYXlcblx0XHRcdFx0YXJyID0gbmV3IEFycmF5KGxlbmd0aCA9IGFycmF5TGlrZS5sZW5ndGgpO1xuXHRcdFx0XHRmb3IgKGkgPSAwOyBpIDwgbGVuZ3RoOyArK2kpIGFycltpXSA9IGFycmF5TGlrZVtpXTtcblx0XHRcdFx0cmV0dXJuIGFycjtcblx0XHRcdH1cblx0XHR9XG5cdFx0YXJyID0gW107XG5cdH0gZWxzZSB7XG5cdFx0Ly8gUmVzdWx0OiBOb24gcGxhaW4gYXJyYXlcblx0XHRDb250ZXh0ID0gdGhpcztcblx0fVxuXG5cdGlmICghaXNBcnJheShhcnJheUxpa2UpKSB7XG5cdFx0aWYgKChnZXRJdGVyYXRvciA9IGFycmF5TGlrZVtpdGVyYXRvclN5bWJvbF0pICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdC8vIFNvdXJjZTogSXRlcmF0b3Jcblx0XHRcdGl0ZXJhdG9yID0gY2FsbGFibGUoZ2V0SXRlcmF0b3IpLmNhbGwoYXJyYXlMaWtlKTtcblx0XHRcdGlmIChDb250ZXh0KSBhcnIgPSBuZXcgQ29udGV4dCgpO1xuXHRcdFx0cmVzdWx0ID0gaXRlcmF0b3IubmV4dCgpO1xuXHRcdFx0aSA9IDA7XG5cdFx0XHR3aGlsZSAoIXJlc3VsdC5kb25lKSB7XG5cdFx0XHRcdHZhbHVlID0gbWFwRm4gPyBjYWxsLmNhbGwobWFwRm4sIHRoaXNBcmcsIHJlc3VsdC52YWx1ZSwgaSkgOiByZXN1bHQudmFsdWU7XG5cdFx0XHRcdGlmIChDb250ZXh0KSB7XG5cdFx0XHRcdFx0ZGVzYy52YWx1ZSA9IHZhbHVlO1xuXHRcdFx0XHRcdGRlZmluZVByb3BlcnR5KGFyciwgaSwgZGVzYyk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0YXJyW2ldID0gdmFsdWU7XG5cdFx0XHRcdH1cblx0XHRcdFx0cmVzdWx0ID0gaXRlcmF0b3IubmV4dCgpO1xuXHRcdFx0XHQrK2k7XG5cdFx0XHR9XG5cdFx0XHRsZW5ndGggPSBpO1xuXHRcdH0gZWxzZSBpZiAoaXNTdHJpbmcoYXJyYXlMaWtlKSkge1xuXHRcdFx0Ly8gU291cmNlOiBTdHJpbmdcblx0XHRcdGxlbmd0aCA9IGFycmF5TGlrZS5sZW5ndGg7XG5cdFx0XHRpZiAoQ29udGV4dCkgYXJyID0gbmV3IENvbnRleHQoKTtcblx0XHRcdGZvciAoaSA9IDAsIGogPSAwOyBpIDwgbGVuZ3RoOyArK2kpIHtcblx0XHRcdFx0dmFsdWUgPSBhcnJheUxpa2VbaV07XG5cdFx0XHRcdGlmIChpICsgMSA8IGxlbmd0aCkge1xuXHRcdFx0XHRcdGNvZGUgPSB2YWx1ZS5jaGFyQ29kZUF0KDApO1xuXHRcdFx0XHRcdC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBtYXgtZGVwdGhcblx0XHRcdFx0XHRpZiAoY29kZSA+PSAweGQ4MDAgJiYgY29kZSA8PSAweGRiZmYpIHZhbHVlICs9IGFycmF5TGlrZVsrK2ldO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHZhbHVlID0gbWFwRm4gPyBjYWxsLmNhbGwobWFwRm4sIHRoaXNBcmcsIHZhbHVlLCBqKSA6IHZhbHVlO1xuXHRcdFx0XHRpZiAoQ29udGV4dCkge1xuXHRcdFx0XHRcdGRlc2MudmFsdWUgPSB2YWx1ZTtcblx0XHRcdFx0XHRkZWZpbmVQcm9wZXJ0eShhcnIsIGosIGRlc2MpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGFycltqXSA9IHZhbHVlO1xuXHRcdFx0XHR9XG5cdFx0XHRcdCsrajtcblx0XHRcdH1cblx0XHRcdGxlbmd0aCA9IGo7XG5cdFx0fVxuXHR9XG5cdGlmIChsZW5ndGggPT09IHVuZGVmaW5lZCkge1xuXHRcdC8vIFNvdXJjZTogYXJyYXkgb3IgYXJyYXktbGlrZVxuXHRcdGxlbmd0aCA9IHRvUG9zSW50KGFycmF5TGlrZS5sZW5ndGgpO1xuXHRcdGlmIChDb250ZXh0KSBhcnIgPSBuZXcgQ29udGV4dChsZW5ndGgpO1xuXHRcdGZvciAoaSA9IDA7IGkgPCBsZW5ndGg7ICsraSkge1xuXHRcdFx0dmFsdWUgPSBtYXBGbiA/IGNhbGwuY2FsbChtYXBGbiwgdGhpc0FyZywgYXJyYXlMaWtlW2ldLCBpKSA6IGFycmF5TGlrZVtpXTtcblx0XHRcdGlmIChDb250ZXh0KSB7XG5cdFx0XHRcdGRlc2MudmFsdWUgPSB2YWx1ZTtcblx0XHRcdFx0ZGVmaW5lUHJvcGVydHkoYXJyLCBpLCBkZXNjKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGFycltpXSA9IHZhbHVlO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXHRpZiAoQ29udGV4dCkge1xuXHRcdGRlc2MudmFsdWUgPSBudWxsO1xuXHRcdGFyci5sZW5ndGggPSBsZW5ndGg7XG5cdH1cblx0cmV0dXJuIGFycjtcbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcblxudmFyIG9ialRvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZ1xuICAsIGlkID0gb2JqVG9TdHJpbmcuY2FsbChcblx0KGZ1bmN0aW9uICgpIHtcblx0XHRyZXR1cm4gYXJndW1lbnRzO1xuXHR9KSgpXG4pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuXHRyZXR1cm4gb2JqVG9TdHJpbmcuY2FsbCh2YWx1ZSkgPT09IGlkO1xufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG52YXIgb2JqVG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLCBpZCA9IG9ialRvU3RyaW5nLmNhbGwocmVxdWlyZShcIi4vbm9vcFwiKSk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHZhbHVlKSB7XG5cdHJldHVybiB0eXBlb2YgdmFsdWUgPT09IFwiZnVuY3Rpb25cIiAmJiBvYmpUb1N0cmluZy5jYWxsKHZhbHVlKSA9PT0gaWQ7XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1lbXB0eS1mdW5jdGlvblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoKSB7fTtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCIuL2lzLWltcGxlbWVudGVkXCIpKClcblx0PyBNYXRoLnNpZ25cblx0OiByZXF1aXJlKFwiLi9zaGltXCIpO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKCkge1xuXHR2YXIgc2lnbiA9IE1hdGguc2lnbjtcblx0aWYgKHR5cGVvZiBzaWduICE9PSBcImZ1bmN0aW9uXCIpIHJldHVybiBmYWxzZTtcblx0cmV0dXJuIChzaWduKDEwKSA9PT0gMSkgJiYgKHNpZ24oLTIwKSA9PT0gLTEpO1xufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuXHR2YWx1ZSA9IE51bWJlcih2YWx1ZSk7XG5cdGlmIChpc05hTih2YWx1ZSkgfHwgKHZhbHVlID09PSAwKSkgcmV0dXJuIHZhbHVlO1xuXHRyZXR1cm4gdmFsdWUgPiAwID8gMSA6IC0xO1xufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCIuL2lzLWltcGxlbWVudGVkXCIpKClcblx0PyBOdW1iZXIuaXNOYU5cblx0OiByZXF1aXJlKFwiLi9zaGltXCIpO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKCkge1xuXHR2YXIgbnVtYmVySXNOYU4gPSBOdW1iZXIuaXNOYU47XG5cdGlmICh0eXBlb2YgbnVtYmVySXNOYU4gIT09IFwiZnVuY3Rpb25cIikgcmV0dXJuIGZhbHNlO1xuXHRyZXR1cm4gIW51bWJlcklzTmFOKHt9KSAmJiBudW1iZXJJc05hTihOYU4pICYmICFudW1iZXJJc05hTigzNCk7XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHZhbHVlKSB7XG5cdC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1zZWxmLWNvbXBhcmVcblx0cmV0dXJuIHZhbHVlICE9PSB2YWx1ZTtcbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcblxudmFyIHNpZ24gPSByZXF1aXJlKFwiLi4vbWF0aC9zaWduXCIpXG5cbiAgLCBhYnMgPSBNYXRoLmFicywgZmxvb3IgPSBNYXRoLmZsb29yO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuXHRpZiAoaXNOYU4odmFsdWUpKSByZXR1cm4gMDtcblx0dmFsdWUgPSBOdW1iZXIodmFsdWUpO1xuXHRpZiAoKHZhbHVlID09PSAwKSB8fCAhaXNGaW5pdGUodmFsdWUpKSByZXR1cm4gdmFsdWU7XG5cdHJldHVybiBzaWduKHZhbHVlKSAqIGZsb29yKGFicyh2YWx1ZSkpO1xufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG52YXIgdG9JbnRlZ2VyID0gcmVxdWlyZShcIi4vdG8taW50ZWdlclwiKVxuXG4gICwgbWF4ID0gTWF0aC5tYXg7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gcmV0dXJuIG1heCgwLCB0b0ludGVnZXIodmFsdWUpKTtcbn07XG4iLCIvLyBJbnRlcm5hbCBtZXRob2QsIHVzZWQgYnkgaXRlcmF0aW9uIGZ1bmN0aW9ucy5cbi8vIENhbGxzIGEgZnVuY3Rpb24gZm9yIGVhY2gga2V5LXZhbHVlIHBhaXIgZm91bmQgaW4gb2JqZWN0XG4vLyBPcHRpb25hbGx5IHRha2VzIGNvbXBhcmVGbiB0byBpdGVyYXRlIG9iamVjdCBpbiBzcGVjaWZpYyBvcmRlclxuXG5cInVzZSBzdHJpY3RcIjtcblxudmFyIGNhbGxhYmxlICAgICAgICAgICAgICAgID0gcmVxdWlyZShcIi4vdmFsaWQtY2FsbGFibGVcIilcbiAgLCB2YWx1ZSAgICAgICAgICAgICAgICAgICA9IHJlcXVpcmUoXCIuL3ZhbGlkLXZhbHVlXCIpXG4gICwgYmluZCAgICAgICAgICAgICAgICAgICAgPSBGdW5jdGlvbi5wcm90b3R5cGUuYmluZFxuICAsIGNhbGwgICAgICAgICAgICAgICAgICAgID0gRnVuY3Rpb24ucHJvdG90eXBlLmNhbGxcbiAgLCBrZXlzICAgICAgICAgICAgICAgICAgICA9IE9iamVjdC5rZXlzXG4gICwgb2JqUHJvcGVydHlJc0VudW1lcmFibGUgPSBPYmplY3QucHJvdG90eXBlLnByb3BlcnR5SXNFbnVtZXJhYmxlO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChtZXRob2QsIGRlZlZhbCkge1xuXHRyZXR1cm4gZnVuY3Rpb24gKG9iaiwgY2IgLyosIHRoaXNBcmcsIGNvbXBhcmVGbiovKSB7XG5cdFx0dmFyIGxpc3QsIHRoaXNBcmcgPSBhcmd1bWVudHNbMl0sIGNvbXBhcmVGbiA9IGFyZ3VtZW50c1szXTtcblx0XHRvYmogPSBPYmplY3QodmFsdWUob2JqKSk7XG5cdFx0Y2FsbGFibGUoY2IpO1xuXG5cdFx0bGlzdCA9IGtleXMob2JqKTtcblx0XHRpZiAoY29tcGFyZUZuKSB7XG5cdFx0XHRsaXN0LnNvcnQodHlwZW9mIGNvbXBhcmVGbiA9PT0gXCJmdW5jdGlvblwiID8gYmluZC5jYWxsKGNvbXBhcmVGbiwgb2JqKSA6IHVuZGVmaW5lZCk7XG5cdFx0fVxuXHRcdGlmICh0eXBlb2YgbWV0aG9kICE9PSBcImZ1bmN0aW9uXCIpIG1ldGhvZCA9IGxpc3RbbWV0aG9kXTtcblx0XHRyZXR1cm4gY2FsbC5jYWxsKG1ldGhvZCwgbGlzdCwgZnVuY3Rpb24gKGtleSwgaW5kZXgpIHtcblx0XHRcdGlmICghb2JqUHJvcGVydHlJc0VudW1lcmFibGUuY2FsbChvYmosIGtleSkpIHJldHVybiBkZWZWYWw7XG5cdFx0XHRyZXR1cm4gY2FsbC5jYWxsKGNiLCB0aGlzQXJnLCBvYmpba2V5XSwga2V5LCBvYmosIGluZGV4KTtcblx0XHR9KTtcblx0fTtcbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcblxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi9pcy1pbXBsZW1lbnRlZFwiKSgpXG5cdD8gT2JqZWN0LmFzc2lnblxuXHQ6IHJlcXVpcmUoXCIuL3NoaW1cIik7XG4iLCJcInVzZSBzdHJpY3RcIjtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoKSB7XG5cdHZhciBhc3NpZ24gPSBPYmplY3QuYXNzaWduLCBvYmo7XG5cdGlmICh0eXBlb2YgYXNzaWduICE9PSBcImZ1bmN0aW9uXCIpIHJldHVybiBmYWxzZTtcblx0b2JqID0geyBmb286IFwicmF6XCIgfTtcblx0YXNzaWduKG9iaiwgeyBiYXI6IFwiZHdhXCIgfSwgeyB0cnp5OiBcInRyenlcIiB9KTtcblx0cmV0dXJuIChvYmouZm9vICsgb2JqLmJhciArIG9iai50cnp5KSA9PT0gXCJyYXpkd2F0cnp5XCI7XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBrZXlzICA9IHJlcXVpcmUoXCIuLi9rZXlzXCIpXG4gICwgdmFsdWUgPSByZXF1aXJlKFwiLi4vdmFsaWQtdmFsdWVcIilcbiAgLCBtYXggICA9IE1hdGgubWF4O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChkZXN0LCBzcmMgLyosIOKApnNyY24qLykge1xuXHR2YXIgZXJyb3IsIGksIGxlbmd0aCA9IG1heChhcmd1bWVudHMubGVuZ3RoLCAyKSwgYXNzaWduO1xuXHRkZXN0ID0gT2JqZWN0KHZhbHVlKGRlc3QpKTtcblx0YXNzaWduID0gZnVuY3Rpb24gKGtleSkge1xuXHRcdHRyeSB7XG5cdFx0XHRkZXN0W2tleV0gPSBzcmNba2V5XTtcblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRpZiAoIWVycm9yKSBlcnJvciA9IGU7XG5cdFx0fVxuXHR9O1xuXHRmb3IgKGkgPSAxOyBpIDwgbGVuZ3RoOyArK2kpIHtcblx0XHRzcmMgPSBhcmd1bWVudHNbaV07XG5cdFx0a2V5cyhzcmMpLmZvckVhY2goYXNzaWduKTtcblx0fVxuXHRpZiAoZXJyb3IgIT09IHVuZGVmaW5lZCkgdGhyb3cgZXJyb3I7XG5cdHJldHVybiBkZXN0O1xufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG52YXIgYUZyb20gID0gcmVxdWlyZShcIi4uL2FycmF5L2Zyb21cIilcbiAgLCBhc3NpZ24gPSByZXF1aXJlKFwiLi9hc3NpZ25cIilcbiAgLCB2YWx1ZSAgPSByZXF1aXJlKFwiLi92YWxpZC12YWx1ZVwiKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAob2JqLyosIHByb3BlcnR5TmFtZXMsIG9wdGlvbnMqLykge1xuXHR2YXIgY29weSA9IE9iamVjdCh2YWx1ZShvYmopKSwgcHJvcGVydHlOYW1lcyA9IGFyZ3VtZW50c1sxXSwgb3B0aW9ucyA9IE9iamVjdChhcmd1bWVudHNbMl0pO1xuXHRpZiAoY29weSAhPT0gb2JqICYmICFwcm9wZXJ0eU5hbWVzKSByZXR1cm4gY29weTtcblx0dmFyIHJlc3VsdCA9IHt9O1xuXHRpZiAocHJvcGVydHlOYW1lcykge1xuXHRcdGFGcm9tKHByb3BlcnR5TmFtZXMsIGZ1bmN0aW9uIChwcm9wZXJ0eU5hbWUpIHtcblx0XHRcdGlmIChvcHRpb25zLmVuc3VyZSB8fCBwcm9wZXJ0eU5hbWUgaW4gb2JqKSByZXN1bHRbcHJvcGVydHlOYW1lXSA9IG9ialtwcm9wZXJ0eU5hbWVdO1xuXHRcdH0pO1xuXHR9IGVsc2Uge1xuXHRcdGFzc2lnbihyZXN1bHQsIG9iaik7XG5cdH1cblx0cmV0dXJuIHJlc3VsdDtcbn07XG4iLCIvLyBXb3JrYXJvdW5kIGZvciBodHRwOi8vY29kZS5nb29nbGUuY29tL3AvdjgvaXNzdWVzL2RldGFpbD9pZD0yODA0XG5cblwidXNlIHN0cmljdFwiO1xuXG52YXIgY3JlYXRlID0gT2JqZWN0LmNyZWF0ZSwgc2hpbTtcblxuaWYgKCFyZXF1aXJlKFwiLi9zZXQtcHJvdG90eXBlLW9mL2lzLWltcGxlbWVudGVkXCIpKCkpIHtcblx0c2hpbSA9IHJlcXVpcmUoXCIuL3NldC1wcm90b3R5cGUtb2Yvc2hpbVwiKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24gKCkge1xuXHR2YXIgbnVsbE9iamVjdCwgcG9seVByb3BzLCBkZXNjO1xuXHRpZiAoIXNoaW0pIHJldHVybiBjcmVhdGU7XG5cdGlmIChzaGltLmxldmVsICE9PSAxKSByZXR1cm4gY3JlYXRlO1xuXG5cdG51bGxPYmplY3QgPSB7fTtcblx0cG9seVByb3BzID0ge307XG5cdGRlc2MgPSB7XG5cdFx0Y29uZmlndXJhYmxlOiBmYWxzZSxcblx0XHRlbnVtZXJhYmxlOiBmYWxzZSxcblx0XHR3cml0YWJsZTogdHJ1ZSxcblx0XHR2YWx1ZTogdW5kZWZpbmVkXG5cdH07XG5cdE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKE9iamVjdC5wcm90b3R5cGUpLmZvckVhY2goZnVuY3Rpb24gKG5hbWUpIHtcblx0XHRpZiAobmFtZSA9PT0gXCJfX3Byb3RvX19cIikge1xuXHRcdFx0cG9seVByb3BzW25hbWVdID0ge1xuXHRcdFx0XHRjb25maWd1cmFibGU6IHRydWUsXG5cdFx0XHRcdGVudW1lcmFibGU6IGZhbHNlLFxuXHRcdFx0XHR3cml0YWJsZTogdHJ1ZSxcblx0XHRcdFx0dmFsdWU6IHVuZGVmaW5lZFxuXHRcdFx0fTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0cG9seVByb3BzW25hbWVdID0gZGVzYztcblx0fSk7XG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKG51bGxPYmplY3QsIHBvbHlQcm9wcyk7XG5cblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KHNoaW0sIFwibnVsbFBvbHlmaWxsXCIsIHtcblx0XHRjb25maWd1cmFibGU6IGZhbHNlLFxuXHRcdGVudW1lcmFibGU6IGZhbHNlLFxuXHRcdHdyaXRhYmxlOiBmYWxzZSxcblx0XHR2YWx1ZTogbnVsbE9iamVjdFxuXHR9KTtcblxuXHRyZXR1cm4gZnVuY3Rpb24gKHByb3RvdHlwZSwgcHJvcHMpIHtcblx0XHRyZXR1cm4gY3JlYXRlKHByb3RvdHlwZSA9PT0gbnVsbCA/IG51bGxPYmplY3QgOiBwcm90b3R5cGUsIHByb3BzKTtcblx0fTtcbn0oKSk7XG4iLCJcInVzZSBzdHJpY3RcIjtcblxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi9faXRlcmF0ZVwiKShcImZvckVhY2hcIik7XG4iLCIvLyBEZXByZWNhdGVkXG5cblwidXNlIHN0cmljdFwiO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChvYmopIHtcbiByZXR1cm4gdHlwZW9mIG9iaiA9PT0gXCJmdW5jdGlvblwiO1xufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG52YXIgaXNWYWx1ZSA9IHJlcXVpcmUoXCIuL2lzLXZhbHVlXCIpO1xuXG52YXIgbWFwID0geyBmdW5jdGlvbjogdHJ1ZSwgb2JqZWN0OiB0cnVlIH07XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHZhbHVlKSB7XG5cdHJldHVybiAoaXNWYWx1ZSh2YWx1ZSkgJiYgbWFwW3R5cGVvZiB2YWx1ZV0pIHx8IGZhbHNlO1xufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG52YXIgX3VuZGVmaW5lZCA9IHJlcXVpcmUoXCIuLi9mdW5jdGlvbi9ub29wXCIpKCk7IC8vIFN1cHBvcnQgRVMzIGVuZ2luZXNcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAodmFsKSB7XG4gcmV0dXJuICh2YWwgIT09IF91bmRlZmluZWQpICYmICh2YWwgIT09IG51bGwpO1xufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCIuL2lzLWltcGxlbWVudGVkXCIpKCkgPyBPYmplY3Qua2V5cyA6IHJlcXVpcmUoXCIuL3NoaW1cIik7XG4iLCJcInVzZSBzdHJpY3RcIjtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoKSB7XG5cdHRyeSB7XG5cdFx0T2JqZWN0LmtleXMoXCJwcmltaXRpdmVcIik7XG5cdFx0cmV0dXJuIHRydWU7XG5cdH0gY2F0Y2ggKGUpIHtcblx0XHRyZXR1cm4gZmFsc2U7XG5cdH1cbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcblxudmFyIGlzVmFsdWUgPSByZXF1aXJlKFwiLi4vaXMtdmFsdWVcIik7XG5cbnZhciBrZXlzID0gT2JqZWN0LmtleXM7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKG9iamVjdCkgeyByZXR1cm4ga2V5cyhpc1ZhbHVlKG9iamVjdCkgPyBPYmplY3Qob2JqZWN0KSA6IG9iamVjdCk7IH07XG4iLCJcInVzZSBzdHJpY3RcIjtcblxudmFyIGNhbGxhYmxlID0gcmVxdWlyZShcIi4vdmFsaWQtY2FsbGFibGVcIilcbiAgLCBmb3JFYWNoICA9IHJlcXVpcmUoXCIuL2Zvci1lYWNoXCIpXG4gICwgY2FsbCAgICAgPSBGdW5jdGlvbi5wcm90b3R5cGUuY2FsbDtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAob2JqLCBjYiAvKiwgdGhpc0FyZyovKSB7XG5cdHZhciByZXN1bHQgPSB7fSwgdGhpc0FyZyA9IGFyZ3VtZW50c1syXTtcblx0Y2FsbGFibGUoY2IpO1xuXHRmb3JFYWNoKG9iaiwgZnVuY3Rpb24gKHZhbHVlLCBrZXksIHRhcmdldE9iaiwgaW5kZXgpIHtcblx0XHRyZXN1bHRba2V5XSA9IGNhbGwuY2FsbChjYiwgdGhpc0FyZywgdmFsdWUsIGtleSwgdGFyZ2V0T2JqLCBpbmRleCk7XG5cdH0pO1xuXHRyZXR1cm4gcmVzdWx0O1xufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG52YXIgaXNWYWx1ZSA9IHJlcXVpcmUoXCIuL2lzLXZhbHVlXCIpO1xuXG52YXIgZm9yRWFjaCA9IEFycmF5LnByb3RvdHlwZS5mb3JFYWNoLCBjcmVhdGUgPSBPYmplY3QuY3JlYXRlO1xuXG52YXIgcHJvY2VzcyA9IGZ1bmN0aW9uIChzcmMsIG9iaikge1xuXHR2YXIga2V5O1xuXHRmb3IgKGtleSBpbiBzcmMpIG9ialtrZXldID0gc3JjW2tleV07XG59O1xuXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW51c2VkLXZhcnNcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKG9wdHMxIC8qLCDigKZvcHRpb25zKi8pIHtcblx0dmFyIHJlc3VsdCA9IGNyZWF0ZShudWxsKTtcblx0Zm9yRWFjaC5jYWxsKGFyZ3VtZW50cywgZnVuY3Rpb24gKG9wdGlvbnMpIHtcblx0XHRpZiAoIWlzVmFsdWUob3B0aW9ucykpIHJldHVybjtcblx0XHRwcm9jZXNzKE9iamVjdChvcHRpb25zKSwgcmVzdWx0KTtcblx0fSk7XG5cdHJldHVybiByZXN1bHQ7XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBmb3JFYWNoID0gQXJyYXkucHJvdG90eXBlLmZvckVhY2gsIGNyZWF0ZSA9IE9iamVjdC5jcmVhdGU7XG5cbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bnVzZWQtdmFyc1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoYXJnIC8qLCDigKZhcmdzKi8pIHtcblx0dmFyIHNldCA9IGNyZWF0ZShudWxsKTtcblx0Zm9yRWFjaC5jYWxsKGFyZ3VtZW50cywgZnVuY3Rpb24gKG5hbWUpIHtcblx0XHRzZXRbbmFtZV0gPSB0cnVlO1xuXHR9KTtcblx0cmV0dXJuIHNldDtcbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcblxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi9pcy1pbXBsZW1lbnRlZFwiKSgpXG5cdD8gT2JqZWN0LnNldFByb3RvdHlwZU9mXG5cdDogcmVxdWlyZShcIi4vc2hpbVwiKTtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG52YXIgY3JlYXRlID0gT2JqZWN0LmNyZWF0ZSwgZ2V0UHJvdG90eXBlT2YgPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YsIHBsYWluT2JqZWN0ID0ge307XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKC8qIEN1c3RvbUNyZWF0ZSovKSB7XG5cdHZhciBzZXRQcm90b3R5cGVPZiA9IE9iamVjdC5zZXRQcm90b3R5cGVPZiwgY3VzdG9tQ3JlYXRlID0gYXJndW1lbnRzWzBdIHx8IGNyZWF0ZTtcblx0aWYgKHR5cGVvZiBzZXRQcm90b3R5cGVPZiAhPT0gXCJmdW5jdGlvblwiKSByZXR1cm4gZmFsc2U7XG5cdHJldHVybiBnZXRQcm90b3R5cGVPZihzZXRQcm90b3R5cGVPZihjdXN0b21DcmVhdGUobnVsbCksIHBsYWluT2JqZWN0KSkgPT09IHBsYWluT2JqZWN0O1xufTtcbiIsIi8qIGVzbGludCBuby1wcm90bzogXCJvZmZcIiAqL1xuXG4vLyBCaWcgdGhhbmtzIHRvIEBXZWJSZWZsZWN0aW9uIGZvciBzb3J0aW5nIHRoaXMgb3V0XG4vLyBodHRwczovL2dpc3QuZ2l0aHViLmNvbS9XZWJSZWZsZWN0aW9uLzU1OTM1NTRcblxuXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBpc09iamVjdCAgICAgICAgPSByZXF1aXJlKFwiLi4vaXMtb2JqZWN0XCIpXG4gICwgdmFsdWUgICAgICAgICAgID0gcmVxdWlyZShcIi4uL3ZhbGlkLXZhbHVlXCIpXG4gICwgb2JqSXNQcm90b3R5cGVPZiA9IE9iamVjdC5wcm90b3R5cGUuaXNQcm90b3R5cGVPZlxuICAsIGRlZmluZVByb3BlcnR5ICA9IE9iamVjdC5kZWZpbmVQcm9wZXJ0eVxuICAsIG51bGxEZXNjICAgICAgICA9IHtcblx0Y29uZmlndXJhYmxlOiB0cnVlLFxuXHRlbnVtZXJhYmxlOiBmYWxzZSxcblx0d3JpdGFibGU6IHRydWUsXG5cdHZhbHVlOiB1bmRlZmluZWRcbn1cbiAgLCB2YWxpZGF0ZTtcblxudmFsaWRhdGUgPSBmdW5jdGlvbiAob2JqLCBwcm90b3R5cGUpIHtcblx0dmFsdWUob2JqKTtcblx0aWYgKHByb3RvdHlwZSA9PT0gbnVsbCB8fCBpc09iamVjdChwcm90b3R5cGUpKSByZXR1cm4gb2JqO1xuXHR0aHJvdyBuZXcgVHlwZUVycm9yKFwiUHJvdG90eXBlIG11c3QgYmUgbnVsbCBvciBhbiBvYmplY3RcIik7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbiAoc3RhdHVzKSB7XG5cdHZhciBmbiwgc2V0O1xuXHRpZiAoIXN0YXR1cykgcmV0dXJuIG51bGw7XG5cdGlmIChzdGF0dXMubGV2ZWwgPT09IDIpIHtcblx0XHRpZiAoc3RhdHVzLnNldCkge1xuXHRcdFx0c2V0ID0gc3RhdHVzLnNldDtcblx0XHRcdGZuID0gZnVuY3Rpb24gKG9iaiwgcHJvdG90eXBlKSB7XG5cdFx0XHRcdHNldC5jYWxsKHZhbGlkYXRlKG9iaiwgcHJvdG90eXBlKSwgcHJvdG90eXBlKTtcblx0XHRcdFx0cmV0dXJuIG9iajtcblx0XHRcdH07XG5cdFx0fSBlbHNlIHtcblx0XHRcdGZuID0gZnVuY3Rpb24gKG9iaiwgcHJvdG90eXBlKSB7XG5cdFx0XHRcdHZhbGlkYXRlKG9iaiwgcHJvdG90eXBlKS5fX3Byb3RvX18gPSBwcm90b3R5cGU7XG5cdFx0XHRcdHJldHVybiBvYmo7XG5cdFx0XHR9O1xuXHRcdH1cblx0fSBlbHNlIHtcblx0XHRmbiA9IGZ1bmN0aW9uIHNlbGYob2JqLCBwcm90b3R5cGUpIHtcblx0XHRcdHZhciBpc051bGxCYXNlO1xuXHRcdFx0dmFsaWRhdGUob2JqLCBwcm90b3R5cGUpO1xuXHRcdFx0aXNOdWxsQmFzZSA9IG9iaklzUHJvdG90eXBlT2YuY2FsbChzZWxmLm51bGxQb2x5ZmlsbCwgb2JqKTtcblx0XHRcdGlmIChpc051bGxCYXNlKSBkZWxldGUgc2VsZi5udWxsUG9seWZpbGwuX19wcm90b19fO1xuXHRcdFx0aWYgKHByb3RvdHlwZSA9PT0gbnVsbCkgcHJvdG90eXBlID0gc2VsZi5udWxsUG9seWZpbGw7XG5cdFx0XHRvYmouX19wcm90b19fID0gcHJvdG90eXBlO1xuXHRcdFx0aWYgKGlzTnVsbEJhc2UpIGRlZmluZVByb3BlcnR5KHNlbGYubnVsbFBvbHlmaWxsLCBcIl9fcHJvdG9fX1wiLCBudWxsRGVzYyk7XG5cdFx0XHRyZXR1cm4gb2JqO1xuXHRcdH07XG5cdH1cblx0cmV0dXJuIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShmbiwgXCJsZXZlbFwiLCB7XG5cdFx0Y29uZmlndXJhYmxlOiBmYWxzZSxcblx0XHRlbnVtZXJhYmxlOiBmYWxzZSxcblx0XHR3cml0YWJsZTogZmFsc2UsXG5cdFx0dmFsdWU6IHN0YXR1cy5sZXZlbFxuXHR9KTtcbn0oXG5cdChmdW5jdGlvbiAoKSB7XG5cdFx0dmFyIHRtcE9iajEgPSBPYmplY3QuY3JlYXRlKG51bGwpXG5cdFx0ICAsIHRtcE9iajIgPSB7fVxuXHRcdCAgLCBzZXRcblx0XHQgICwgZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IoT2JqZWN0LnByb3RvdHlwZSwgXCJfX3Byb3RvX19cIik7XG5cblx0XHRpZiAoZGVzYykge1xuXHRcdFx0dHJ5IHtcblx0XHRcdFx0c2V0ID0gZGVzYy5zZXQ7IC8vIE9wZXJhIGNyYXNoZXMgYXQgdGhpcyBwb2ludFxuXHRcdFx0XHRzZXQuY2FsbCh0bXBPYmoxLCB0bXBPYmoyKTtcblx0XHRcdH0gY2F0Y2ggKGlnbm9yZSkge31cblx0XHRcdGlmIChPYmplY3QuZ2V0UHJvdG90eXBlT2YodG1wT2JqMSkgPT09IHRtcE9iajIpIHJldHVybiB7IHNldDogc2V0LCBsZXZlbDogMiB9O1xuXHRcdH1cblxuXHRcdHRtcE9iajEuX19wcm90b19fID0gdG1wT2JqMjtcblx0XHRpZiAoT2JqZWN0LmdldFByb3RvdHlwZU9mKHRtcE9iajEpID09PSB0bXBPYmoyKSByZXR1cm4geyBsZXZlbDogMiB9O1xuXG5cdFx0dG1wT2JqMSA9IHt9O1xuXHRcdHRtcE9iajEuX19wcm90b19fID0gdG1wT2JqMjtcblx0XHRpZiAoT2JqZWN0LmdldFByb3RvdHlwZU9mKHRtcE9iajEpID09PSB0bXBPYmoyKSByZXR1cm4geyBsZXZlbDogMSB9O1xuXG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9KSgpXG4pKTtcblxucmVxdWlyZShcIi4uL2NyZWF0ZVwiKTtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChmbikge1xuXHRpZiAodHlwZW9mIGZuICE9PSBcImZ1bmN0aW9uXCIpIHRocm93IG5ldyBUeXBlRXJyb3IoZm4gKyBcIiBpcyBub3QgYSBmdW5jdGlvblwiKTtcblx0cmV0dXJuIGZuO1xufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG52YXIgaXNWYWx1ZSA9IHJlcXVpcmUoXCIuL2lzLXZhbHVlXCIpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuXHRpZiAoIWlzVmFsdWUodmFsdWUpKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IHVzZSBudWxsIG9yIHVuZGVmaW5lZFwiKTtcblx0cmV0dXJuIHZhbHVlO1xufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCIuL2lzLWltcGxlbWVudGVkXCIpKClcblx0PyBTdHJpbmcucHJvdG90eXBlLmNvbnRhaW5zXG5cdDogcmVxdWlyZShcIi4vc2hpbVwiKTtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG52YXIgc3RyID0gXCJyYXpkd2F0cnp5XCI7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKCkge1xuXHRpZiAodHlwZW9mIHN0ci5jb250YWlucyAhPT0gXCJmdW5jdGlvblwiKSByZXR1cm4gZmFsc2U7XG5cdHJldHVybiAoc3RyLmNvbnRhaW5zKFwiZHdhXCIpID09PSB0cnVlKSAmJiAoc3RyLmNvbnRhaW5zKFwiZm9vXCIpID09PSBmYWxzZSk7XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBpbmRleE9mID0gU3RyaW5nLnByb3RvdHlwZS5pbmRleE9mO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChzZWFyY2hTdHJpbmcvKiwgcG9zaXRpb24qLykge1xuXHRyZXR1cm4gaW5kZXhPZi5jYWxsKHRoaXMsIHNlYXJjaFN0cmluZywgYXJndW1lbnRzWzFdKSA+IC0xO1xufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG52YXIgb2JqVG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLCBpZCA9IG9ialRvU3RyaW5nLmNhbGwoXCJcIik7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHZhbHVlKSB7XG5cdHJldHVybiAoXG5cdFx0dHlwZW9mIHZhbHVlID09PSBcInN0cmluZ1wiIHx8XG5cdFx0KHZhbHVlICYmXG5cdFx0XHR0eXBlb2YgdmFsdWUgPT09IFwib2JqZWN0XCIgJiZcblx0XHRcdCh2YWx1ZSBpbnN0YW5jZW9mIFN0cmluZyB8fCBvYmpUb1N0cmluZy5jYWxsKHZhbHVlKSA9PT0gaWQpKSB8fFxuXHRcdGZhbHNlXG5cdCk7XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBzZXRQcm90b3R5cGVPZiA9IHJlcXVpcmUoXCJlczUtZXh0L29iamVjdC9zZXQtcHJvdG90eXBlLW9mXCIpXG4gICwgY29udGFpbnMgICAgICAgPSByZXF1aXJlKFwiZXM1LWV4dC9zdHJpbmcvIy9jb250YWluc1wiKVxuICAsIGQgICAgICAgICAgICAgID0gcmVxdWlyZShcImRcIilcbiAgLCBTeW1ib2wgICAgICAgICA9IHJlcXVpcmUoXCJlczYtc3ltYm9sXCIpXG4gICwgSXRlcmF0b3IgICAgICAgPSByZXF1aXJlKFwiLi9cIik7XG5cbnZhciBkZWZpbmVQcm9wZXJ0eSA9IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSwgQXJyYXlJdGVyYXRvcjtcblxuQXJyYXlJdGVyYXRvciA9IG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGFyciwga2luZCkge1xuXHRpZiAoISh0aGlzIGluc3RhbmNlb2YgQXJyYXlJdGVyYXRvcikpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJDb25zdHJ1Y3RvciByZXF1aXJlcyAnbmV3J1wiKTtcblx0SXRlcmF0b3IuY2FsbCh0aGlzLCBhcnIpO1xuXHRpZiAoIWtpbmQpIGtpbmQgPSBcInZhbHVlXCI7XG5cdGVsc2UgaWYgKGNvbnRhaW5zLmNhbGwoa2luZCwgXCJrZXkrdmFsdWVcIikpIGtpbmQgPSBcImtleSt2YWx1ZVwiO1xuXHRlbHNlIGlmIChjb250YWlucy5jYWxsKGtpbmQsIFwia2V5XCIpKSBraW5kID0gXCJrZXlcIjtcblx0ZWxzZSBraW5kID0gXCJ2YWx1ZVwiO1xuXHRkZWZpbmVQcm9wZXJ0eSh0aGlzLCBcIl9fa2luZF9fXCIsIGQoXCJcIiwga2luZCkpO1xufTtcbmlmIChzZXRQcm90b3R5cGVPZikgc2V0UHJvdG90eXBlT2YoQXJyYXlJdGVyYXRvciwgSXRlcmF0b3IpO1xuXG4vLyBJbnRlcm5hbCAlQXJyYXlJdGVyYXRvclByb3RvdHlwZSUgZG9lc24ndCBleHBvc2UgaXRzIGNvbnN0cnVjdG9yXG5kZWxldGUgQXJyYXlJdGVyYXRvci5wcm90b3R5cGUuY29uc3RydWN0b3I7XG5cbkFycmF5SXRlcmF0b3IucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShJdGVyYXRvci5wcm90b3R5cGUsIHtcblx0X3Jlc29sdmU6IGQoZnVuY3Rpb24gKGkpIHtcblx0XHRpZiAodGhpcy5fX2tpbmRfXyA9PT0gXCJ2YWx1ZVwiKSByZXR1cm4gdGhpcy5fX2xpc3RfX1tpXTtcblx0XHRpZiAodGhpcy5fX2tpbmRfXyA9PT0gXCJrZXkrdmFsdWVcIikgcmV0dXJuIFtpLCB0aGlzLl9fbGlzdF9fW2ldXTtcblx0XHRyZXR1cm4gaTtcblx0fSlcbn0pO1xuZGVmaW5lUHJvcGVydHkoQXJyYXlJdGVyYXRvci5wcm90b3R5cGUsIFN5bWJvbC50b1N0cmluZ1RhZywgZChcImNcIiwgXCJBcnJheSBJdGVyYXRvclwiKSk7XG4iLCJcInVzZSBzdHJpY3RcIjtcblxudmFyIGlzQXJndW1lbnRzID0gcmVxdWlyZShcImVzNS1leHQvZnVuY3Rpb24vaXMtYXJndW1lbnRzXCIpXG4gICwgY2FsbGFibGUgICAgPSByZXF1aXJlKFwiZXM1LWV4dC9vYmplY3QvdmFsaWQtY2FsbGFibGVcIilcbiAgLCBpc1N0cmluZyAgICA9IHJlcXVpcmUoXCJlczUtZXh0L3N0cmluZy9pcy1zdHJpbmdcIilcbiAgLCBnZXQgICAgICAgICA9IHJlcXVpcmUoXCIuL2dldFwiKTtcblxudmFyIGlzQXJyYXkgPSBBcnJheS5pc0FycmF5LCBjYWxsID0gRnVuY3Rpb24ucHJvdG90eXBlLmNhbGwsIHNvbWUgPSBBcnJheS5wcm90b3R5cGUuc29tZTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoaXRlcmFibGUsIGNiIC8qLCB0aGlzQXJnKi8pIHtcblx0dmFyIG1vZGUsIHRoaXNBcmcgPSBhcmd1bWVudHNbMl0sIHJlc3VsdCwgZG9CcmVhaywgYnJva2VuLCBpLCBsZW5ndGgsIGNoYXIsIGNvZGU7XG5cdGlmIChpc0FycmF5KGl0ZXJhYmxlKSB8fCBpc0FyZ3VtZW50cyhpdGVyYWJsZSkpIG1vZGUgPSBcImFycmF5XCI7XG5cdGVsc2UgaWYgKGlzU3RyaW5nKGl0ZXJhYmxlKSkgbW9kZSA9IFwic3RyaW5nXCI7XG5cdGVsc2UgaXRlcmFibGUgPSBnZXQoaXRlcmFibGUpO1xuXG5cdGNhbGxhYmxlKGNiKTtcblx0ZG9CcmVhayA9IGZ1bmN0aW9uICgpIHtcblx0XHRicm9rZW4gPSB0cnVlO1xuXHR9O1xuXHRpZiAobW9kZSA9PT0gXCJhcnJheVwiKSB7XG5cdFx0c29tZS5jYWxsKGl0ZXJhYmxlLCBmdW5jdGlvbiAodmFsdWUpIHtcblx0XHRcdGNhbGwuY2FsbChjYiwgdGhpc0FyZywgdmFsdWUsIGRvQnJlYWspO1xuXHRcdFx0cmV0dXJuIGJyb2tlbjtcblx0XHR9KTtcblx0XHRyZXR1cm47XG5cdH1cblx0aWYgKG1vZGUgPT09IFwic3RyaW5nXCIpIHtcblx0XHRsZW5ndGggPSBpdGVyYWJsZS5sZW5ndGg7XG5cdFx0Zm9yIChpID0gMDsgaSA8IGxlbmd0aDsgKytpKSB7XG5cdFx0XHRjaGFyID0gaXRlcmFibGVbaV07XG5cdFx0XHRpZiAoaSArIDEgPCBsZW5ndGgpIHtcblx0XHRcdFx0Y29kZSA9IGNoYXIuY2hhckNvZGVBdCgwKTtcblx0XHRcdFx0aWYgKGNvZGUgPj0gMHhkODAwICYmIGNvZGUgPD0gMHhkYmZmKSBjaGFyICs9IGl0ZXJhYmxlWysraV07XG5cdFx0XHR9XG5cdFx0XHRjYWxsLmNhbGwoY2IsIHRoaXNBcmcsIGNoYXIsIGRvQnJlYWspO1xuXHRcdFx0aWYgKGJyb2tlbikgYnJlYWs7XG5cdFx0fVxuXHRcdHJldHVybjtcblx0fVxuXHRyZXN1bHQgPSBpdGVyYWJsZS5uZXh0KCk7XG5cblx0d2hpbGUgKCFyZXN1bHQuZG9uZSkge1xuXHRcdGNhbGwuY2FsbChjYiwgdGhpc0FyZywgcmVzdWx0LnZhbHVlLCBkb0JyZWFrKTtcblx0XHRpZiAoYnJva2VuKSByZXR1cm47XG5cdFx0cmVzdWx0ID0gaXRlcmFibGUubmV4dCgpO1xuXHR9XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBpc0FyZ3VtZW50cyAgICA9IHJlcXVpcmUoXCJlczUtZXh0L2Z1bmN0aW9uL2lzLWFyZ3VtZW50c1wiKVxuICAsIGlzU3RyaW5nICAgICAgID0gcmVxdWlyZShcImVzNS1leHQvc3RyaW5nL2lzLXN0cmluZ1wiKVxuICAsIEFycmF5SXRlcmF0b3IgID0gcmVxdWlyZShcIi4vYXJyYXlcIilcbiAgLCBTdHJpbmdJdGVyYXRvciA9IHJlcXVpcmUoXCIuL3N0cmluZ1wiKVxuICAsIGl0ZXJhYmxlICAgICAgID0gcmVxdWlyZShcIi4vdmFsaWQtaXRlcmFibGVcIilcbiAgLCBpdGVyYXRvclN5bWJvbCA9IHJlcXVpcmUoXCJlczYtc3ltYm9sXCIpLml0ZXJhdG9yO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChvYmopIHtcblx0aWYgKHR5cGVvZiBpdGVyYWJsZShvYmopW2l0ZXJhdG9yU3ltYm9sXSA9PT0gXCJmdW5jdGlvblwiKSByZXR1cm4gb2JqW2l0ZXJhdG9yU3ltYm9sXSgpO1xuXHRpZiAoaXNBcmd1bWVudHMob2JqKSkgcmV0dXJuIG5ldyBBcnJheUl0ZXJhdG9yKG9iaik7XG5cdGlmIChpc1N0cmluZyhvYmopKSByZXR1cm4gbmV3IFN0cmluZ0l0ZXJhdG9yKG9iaik7XG5cdHJldHVybiBuZXcgQXJyYXlJdGVyYXRvcihvYmopO1xufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG52YXIgY2xlYXIgICAgPSByZXF1aXJlKFwiZXM1LWV4dC9hcnJheS8jL2NsZWFyXCIpXG4gICwgYXNzaWduICAgPSByZXF1aXJlKFwiZXM1LWV4dC9vYmplY3QvYXNzaWduXCIpXG4gICwgY2FsbGFibGUgPSByZXF1aXJlKFwiZXM1LWV4dC9vYmplY3QvdmFsaWQtY2FsbGFibGVcIilcbiAgLCB2YWx1ZSAgICA9IHJlcXVpcmUoXCJlczUtZXh0L29iamVjdC92YWxpZC12YWx1ZVwiKVxuICAsIGQgICAgICAgID0gcmVxdWlyZShcImRcIilcbiAgLCBhdXRvQmluZCA9IHJlcXVpcmUoXCJkL2F1dG8tYmluZFwiKVxuICAsIFN5bWJvbCAgID0gcmVxdWlyZShcImVzNi1zeW1ib2xcIik7XG5cbnZhciBkZWZpbmVQcm9wZXJ0eSA9IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSwgZGVmaW5lUHJvcGVydGllcyA9IE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzLCBJdGVyYXRvcjtcblxubW9kdWxlLmV4cG9ydHMgPSBJdGVyYXRvciA9IGZ1bmN0aW9uIChsaXN0LCBjb250ZXh0KSB7XG5cdGlmICghKHRoaXMgaW5zdGFuY2VvZiBJdGVyYXRvcikpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJDb25zdHJ1Y3RvciByZXF1aXJlcyAnbmV3J1wiKTtcblx0ZGVmaW5lUHJvcGVydGllcyh0aGlzLCB7XG5cdFx0X19saXN0X186IGQoXCJ3XCIsIHZhbHVlKGxpc3QpKSxcblx0XHRfX2NvbnRleHRfXzogZChcIndcIiwgY29udGV4dCksXG5cdFx0X19uZXh0SW5kZXhfXzogZChcIndcIiwgMClcblx0fSk7XG5cdGlmICghY29udGV4dCkgcmV0dXJuO1xuXHRjYWxsYWJsZShjb250ZXh0Lm9uKTtcblx0Y29udGV4dC5vbihcIl9hZGRcIiwgdGhpcy5fb25BZGQpO1xuXHRjb250ZXh0Lm9uKFwiX2RlbGV0ZVwiLCB0aGlzLl9vbkRlbGV0ZSk7XG5cdGNvbnRleHQub24oXCJfY2xlYXJcIiwgdGhpcy5fb25DbGVhcik7XG59O1xuXG4vLyBJbnRlcm5hbCAlSXRlcmF0b3JQcm90b3R5cGUlIGRvZXNuJ3QgZXhwb3NlIGl0cyBjb25zdHJ1Y3RvclxuZGVsZXRlIEl0ZXJhdG9yLnByb3RvdHlwZS5jb25zdHJ1Y3RvcjtcblxuZGVmaW5lUHJvcGVydGllcyhcblx0SXRlcmF0b3IucHJvdG90eXBlLFxuXHRhc3NpZ24oXG5cdFx0e1xuXHRcdFx0X25leHQ6IGQoZnVuY3Rpb24gKCkge1xuXHRcdFx0XHR2YXIgaTtcblx0XHRcdFx0aWYgKCF0aGlzLl9fbGlzdF9fKSByZXR1cm4gdW5kZWZpbmVkO1xuXHRcdFx0XHRpZiAodGhpcy5fX3JlZG9fXykge1xuXHRcdFx0XHRcdGkgPSB0aGlzLl9fcmVkb19fLnNoaWZ0KCk7XG5cdFx0XHRcdFx0aWYgKGkgIT09IHVuZGVmaW5lZCkgcmV0dXJuIGk7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKHRoaXMuX19uZXh0SW5kZXhfXyA8IHRoaXMuX19saXN0X18ubGVuZ3RoKSByZXR1cm4gdGhpcy5fX25leHRJbmRleF9fKys7XG5cdFx0XHRcdHRoaXMuX3VuQmluZCgpO1xuXHRcdFx0XHRyZXR1cm4gdW5kZWZpbmVkO1xuXHRcdFx0fSksXG5cdFx0XHRuZXh0OiBkKGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0cmV0dXJuIHRoaXMuX2NyZWF0ZVJlc3VsdCh0aGlzLl9uZXh0KCkpO1xuXHRcdFx0fSksXG5cdFx0XHRfY3JlYXRlUmVzdWx0OiBkKGZ1bmN0aW9uIChpKSB7XG5cdFx0XHRcdGlmIChpID09PSB1bmRlZmluZWQpIHJldHVybiB7IGRvbmU6IHRydWUsIHZhbHVlOiB1bmRlZmluZWQgfTtcblx0XHRcdFx0cmV0dXJuIHsgZG9uZTogZmFsc2UsIHZhbHVlOiB0aGlzLl9yZXNvbHZlKGkpIH07XG5cdFx0XHR9KSxcblx0XHRcdF9yZXNvbHZlOiBkKGZ1bmN0aW9uIChpKSB7XG5cdFx0XHRcdHJldHVybiB0aGlzLl9fbGlzdF9fW2ldO1xuXHRcdFx0fSksXG5cdFx0XHRfdW5CaW5kOiBkKGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0dGhpcy5fX2xpc3RfXyA9IG51bGw7XG5cdFx0XHRcdGRlbGV0ZSB0aGlzLl9fcmVkb19fO1xuXHRcdFx0XHRpZiAoIXRoaXMuX19jb250ZXh0X18pIHJldHVybjtcblx0XHRcdFx0dGhpcy5fX2NvbnRleHRfXy5vZmYoXCJfYWRkXCIsIHRoaXMuX29uQWRkKTtcblx0XHRcdFx0dGhpcy5fX2NvbnRleHRfXy5vZmYoXCJfZGVsZXRlXCIsIHRoaXMuX29uRGVsZXRlKTtcblx0XHRcdFx0dGhpcy5fX2NvbnRleHRfXy5vZmYoXCJfY2xlYXJcIiwgdGhpcy5fb25DbGVhcik7XG5cdFx0XHRcdHRoaXMuX19jb250ZXh0X18gPSBudWxsO1xuXHRcdFx0fSksXG5cdFx0XHR0b1N0cmluZzogZChmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdHJldHVybiBcIltvYmplY3QgXCIgKyAodGhpc1tTeW1ib2wudG9TdHJpbmdUYWddIHx8IFwiT2JqZWN0XCIpICsgXCJdXCI7XG5cdFx0XHR9KVxuXHRcdH0sXG5cdFx0YXV0b0JpbmQoe1xuXHRcdFx0X29uQWRkOiBkKGZ1bmN0aW9uIChpbmRleCkge1xuXHRcdFx0XHRpZiAoaW5kZXggPj0gdGhpcy5fX25leHRJbmRleF9fKSByZXR1cm47XG5cdFx0XHRcdCsrdGhpcy5fX25leHRJbmRleF9fO1xuXHRcdFx0XHRpZiAoIXRoaXMuX19yZWRvX18pIHtcblx0XHRcdFx0XHRkZWZpbmVQcm9wZXJ0eSh0aGlzLCBcIl9fcmVkb19fXCIsIGQoXCJjXCIsIFtpbmRleF0pKTtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblx0XHRcdFx0dGhpcy5fX3JlZG9fXy5mb3JFYWNoKGZ1bmN0aW9uIChyZWRvLCBpKSB7XG5cdFx0XHRcdFx0aWYgKHJlZG8gPj0gaW5kZXgpIHRoaXMuX19yZWRvX19baV0gPSArK3JlZG87XG5cdFx0XHRcdH0sIHRoaXMpO1xuXHRcdFx0XHR0aGlzLl9fcmVkb19fLnB1c2goaW5kZXgpO1xuXHRcdFx0fSksXG5cdFx0XHRfb25EZWxldGU6IGQoZnVuY3Rpb24gKGluZGV4KSB7XG5cdFx0XHRcdHZhciBpO1xuXHRcdFx0XHRpZiAoaW5kZXggPj0gdGhpcy5fX25leHRJbmRleF9fKSByZXR1cm47XG5cdFx0XHRcdC0tdGhpcy5fX25leHRJbmRleF9fO1xuXHRcdFx0XHRpZiAoIXRoaXMuX19yZWRvX18pIHJldHVybjtcblx0XHRcdFx0aSA9IHRoaXMuX19yZWRvX18uaW5kZXhPZihpbmRleCk7XG5cdFx0XHRcdGlmIChpICE9PSAtMSkgdGhpcy5fX3JlZG9fXy5zcGxpY2UoaSwgMSk7XG5cdFx0XHRcdHRoaXMuX19yZWRvX18uZm9yRWFjaChmdW5jdGlvbiAocmVkbywgaikge1xuXHRcdFx0XHRcdGlmIChyZWRvID4gaW5kZXgpIHRoaXMuX19yZWRvX19bal0gPSAtLXJlZG87XG5cdFx0XHRcdH0sIHRoaXMpO1xuXHRcdFx0fSksXG5cdFx0XHRfb25DbGVhcjogZChmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdGlmICh0aGlzLl9fcmVkb19fKSBjbGVhci5jYWxsKHRoaXMuX19yZWRvX18pO1xuXHRcdFx0XHR0aGlzLl9fbmV4dEluZGV4X18gPSAwO1xuXHRcdFx0fSlcblx0XHR9KVxuXHQpXG4pO1xuXG5kZWZpbmVQcm9wZXJ0eShcblx0SXRlcmF0b3IucHJvdG90eXBlLFxuXHRTeW1ib2wuaXRlcmF0b3IsXG5cdGQoZnVuY3Rpb24gKCkge1xuXHRcdHJldHVybiB0aGlzO1xuXHR9KVxuKTtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG52YXIgaXNBcmd1bWVudHMgPSByZXF1aXJlKFwiZXM1LWV4dC9mdW5jdGlvbi9pcy1hcmd1bWVudHNcIilcbiAgLCBpc1ZhbHVlICAgICA9IHJlcXVpcmUoXCJlczUtZXh0L29iamVjdC9pcy12YWx1ZVwiKVxuICAsIGlzU3RyaW5nICAgID0gcmVxdWlyZShcImVzNS1leHQvc3RyaW5nL2lzLXN0cmluZ1wiKTtcblxudmFyIGl0ZXJhdG9yU3ltYm9sID0gcmVxdWlyZShcImVzNi1zeW1ib2xcIikuaXRlcmF0b3JcbiAgLCBpc0FycmF5ICAgICAgICA9IEFycmF5LmlzQXJyYXk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHZhbHVlKSB7XG5cdGlmICghaXNWYWx1ZSh2YWx1ZSkpIHJldHVybiBmYWxzZTtcblx0aWYgKGlzQXJyYXkodmFsdWUpKSByZXR1cm4gdHJ1ZTtcblx0aWYgKGlzU3RyaW5nKHZhbHVlKSkgcmV0dXJuIHRydWU7XG5cdGlmIChpc0FyZ3VtZW50cyh2YWx1ZSkpIHJldHVybiB0cnVlO1xuXHRyZXR1cm4gdHlwZW9mIHZhbHVlW2l0ZXJhdG9yU3ltYm9sXSA9PT0gXCJmdW5jdGlvblwiO1xufTtcbiIsIi8vIFRoYW5rcyBAbWF0aGlhc2J5bmVuc1xuLy8gaHR0cDovL21hdGhpYXNieW5lbnMuYmUvbm90ZXMvamF2YXNjcmlwdC11bmljb2RlI2l0ZXJhdGluZy1vdmVyLXN5bWJvbHNcblxuXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBzZXRQcm90b3R5cGVPZiA9IHJlcXVpcmUoXCJlczUtZXh0L29iamVjdC9zZXQtcHJvdG90eXBlLW9mXCIpXG4gICwgZCAgICAgICAgICAgICAgPSByZXF1aXJlKFwiZFwiKVxuICAsIFN5bWJvbCAgICAgICAgID0gcmVxdWlyZShcImVzNi1zeW1ib2xcIilcbiAgLCBJdGVyYXRvciAgICAgICA9IHJlcXVpcmUoXCIuL1wiKTtcblxudmFyIGRlZmluZVByb3BlcnR5ID0gT2JqZWN0LmRlZmluZVByb3BlcnR5LCBTdHJpbmdJdGVyYXRvcjtcblxuU3RyaW5nSXRlcmF0b3IgPSBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChzdHIpIHtcblx0aWYgKCEodGhpcyBpbnN0YW5jZW9mIFN0cmluZ0l0ZXJhdG9yKSkgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNvbnN0cnVjdG9yIHJlcXVpcmVzICduZXcnXCIpO1xuXHRzdHIgPSBTdHJpbmcoc3RyKTtcblx0SXRlcmF0b3IuY2FsbCh0aGlzLCBzdHIpO1xuXHRkZWZpbmVQcm9wZXJ0eSh0aGlzLCBcIl9fbGVuZ3RoX19cIiwgZChcIlwiLCBzdHIubGVuZ3RoKSk7XG59O1xuaWYgKHNldFByb3RvdHlwZU9mKSBzZXRQcm90b3R5cGVPZihTdHJpbmdJdGVyYXRvciwgSXRlcmF0b3IpO1xuXG4vLyBJbnRlcm5hbCAlQXJyYXlJdGVyYXRvclByb3RvdHlwZSUgZG9lc24ndCBleHBvc2UgaXRzIGNvbnN0cnVjdG9yXG5kZWxldGUgU3RyaW5nSXRlcmF0b3IucHJvdG90eXBlLmNvbnN0cnVjdG9yO1xuXG5TdHJpbmdJdGVyYXRvci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEl0ZXJhdG9yLnByb3RvdHlwZSwge1xuXHRfbmV4dDogZChmdW5jdGlvbiAoKSB7XG5cdFx0aWYgKCF0aGlzLl9fbGlzdF9fKSByZXR1cm4gdW5kZWZpbmVkO1xuXHRcdGlmICh0aGlzLl9fbmV4dEluZGV4X18gPCB0aGlzLl9fbGVuZ3RoX18pIHJldHVybiB0aGlzLl9fbmV4dEluZGV4X18rKztcblx0XHR0aGlzLl91bkJpbmQoKTtcblx0XHRyZXR1cm4gdW5kZWZpbmVkO1xuXHR9KSxcblx0X3Jlc29sdmU6IGQoZnVuY3Rpb24gKGkpIHtcblx0XHR2YXIgY2hhciA9IHRoaXMuX19saXN0X19baV0sIGNvZGU7XG5cdFx0aWYgKHRoaXMuX19uZXh0SW5kZXhfXyA9PT0gdGhpcy5fX2xlbmd0aF9fKSByZXR1cm4gY2hhcjtcblx0XHRjb2RlID0gY2hhci5jaGFyQ29kZUF0KDApO1xuXHRcdGlmIChjb2RlID49IDB4ZDgwMCAmJiBjb2RlIDw9IDB4ZGJmZikgcmV0dXJuIGNoYXIgKyB0aGlzLl9fbGlzdF9fW3RoaXMuX19uZXh0SW5kZXhfXysrXTtcblx0XHRyZXR1cm4gY2hhcjtcblx0fSlcbn0pO1xuZGVmaW5lUHJvcGVydHkoU3RyaW5nSXRlcmF0b3IucHJvdG90eXBlLCBTeW1ib2wudG9TdHJpbmdUYWcsIGQoXCJjXCIsIFwiU3RyaW5nIEl0ZXJhdG9yXCIpKTtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG52YXIgaXNJdGVyYWJsZSA9IHJlcXVpcmUoXCIuL2lzLWl0ZXJhYmxlXCIpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuXHRpZiAoIWlzSXRlcmFibGUodmFsdWUpKSB0aHJvdyBuZXcgVHlwZUVycm9yKHZhbHVlICsgXCIgaXMgbm90IGl0ZXJhYmxlXCIpO1xuXHRyZXR1cm4gdmFsdWU7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vaXMtaW1wbGVtZW50ZWQnKSgpID8gTWFwIDogcmVxdWlyZSgnLi9wb2x5ZmlsbCcpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICgpIHtcblx0dmFyIG1hcCwgaXRlcmF0b3IsIHJlc3VsdDtcblx0aWYgKHR5cGVvZiBNYXAgIT09ICdmdW5jdGlvbicpIHJldHVybiBmYWxzZTtcblx0dHJ5IHtcblx0XHQvLyBXZWJLaXQgZG9lc24ndCBzdXBwb3J0IGFyZ3VtZW50cyBhbmQgY3Jhc2hlc1xuXHRcdG1hcCA9IG5ldyBNYXAoW1sncmF6JywgJ29uZSddLCBbJ2R3YScsICd0d28nXSwgWyd0cnp5JywgJ3RocmVlJ11dKTtcblx0fSBjYXRjaCAoZSkge1xuXHRcdHJldHVybiBmYWxzZTtcblx0fVxuXHRpZiAoU3RyaW5nKG1hcCkgIT09ICdbb2JqZWN0IE1hcF0nKSByZXR1cm4gZmFsc2U7XG5cdGlmIChtYXAuc2l6ZSAhPT0gMykgcmV0dXJuIGZhbHNlO1xuXHRpZiAodHlwZW9mIG1hcC5jbGVhciAhPT0gJ2Z1bmN0aW9uJykgcmV0dXJuIGZhbHNlO1xuXHRpZiAodHlwZW9mIG1hcC5kZWxldGUgIT09ICdmdW5jdGlvbicpIHJldHVybiBmYWxzZTtcblx0aWYgKHR5cGVvZiBtYXAuZW50cmllcyAhPT0gJ2Z1bmN0aW9uJykgcmV0dXJuIGZhbHNlO1xuXHRpZiAodHlwZW9mIG1hcC5mb3JFYWNoICE9PSAnZnVuY3Rpb24nKSByZXR1cm4gZmFsc2U7XG5cdGlmICh0eXBlb2YgbWFwLmdldCAhPT0gJ2Z1bmN0aW9uJykgcmV0dXJuIGZhbHNlO1xuXHRpZiAodHlwZW9mIG1hcC5oYXMgIT09ICdmdW5jdGlvbicpIHJldHVybiBmYWxzZTtcblx0aWYgKHR5cGVvZiBtYXAua2V5cyAhPT0gJ2Z1bmN0aW9uJykgcmV0dXJuIGZhbHNlO1xuXHRpZiAodHlwZW9mIG1hcC5zZXQgIT09ICdmdW5jdGlvbicpIHJldHVybiBmYWxzZTtcblx0aWYgKHR5cGVvZiBtYXAudmFsdWVzICE9PSAnZnVuY3Rpb24nKSByZXR1cm4gZmFsc2U7XG5cblx0aXRlcmF0b3IgPSBtYXAuZW50cmllcygpO1xuXHRyZXN1bHQgPSBpdGVyYXRvci5uZXh0KCk7XG5cdGlmIChyZXN1bHQuZG9uZSAhPT0gZmFsc2UpIHJldHVybiBmYWxzZTtcblx0aWYgKCFyZXN1bHQudmFsdWUpIHJldHVybiBmYWxzZTtcblx0aWYgKHJlc3VsdC52YWx1ZVswXSAhPT0gJ3JheicpIHJldHVybiBmYWxzZTtcblx0aWYgKHJlc3VsdC52YWx1ZVsxXSAhPT0gJ29uZScpIHJldHVybiBmYWxzZTtcblxuXHRyZXR1cm4gdHJ1ZTtcbn07XG4iLCIvLyBFeHBvcnRzIHRydWUgaWYgZW52aXJvbm1lbnQgcHJvdmlkZXMgbmF0aXZlIGBNYXBgIGltcGxlbWVudGF0aW9uLFxuLy8gd2hhdGV2ZXIgdGhhdCBpcy5cblxuJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbiAoKSB7XG5cdGlmICh0eXBlb2YgTWFwID09PSAndW5kZWZpbmVkJykgcmV0dXJuIGZhbHNlO1xuXHRyZXR1cm4gKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChuZXcgTWFwKCkpID09PSAnW29iamVjdCBNYXBdJyk7XG59KCkpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJ2VzNS1leHQvb2JqZWN0L3ByaW1pdGl2ZS1zZXQnKSgna2V5Jyxcblx0J3ZhbHVlJywgJ2tleSt2YWx1ZScpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgc2V0UHJvdG90eXBlT2YgICAgPSByZXF1aXJlKCdlczUtZXh0L29iamVjdC9zZXQtcHJvdG90eXBlLW9mJylcbiAgLCBkICAgICAgICAgICAgICAgICA9IHJlcXVpcmUoJ2QnKVxuICAsIEl0ZXJhdG9yICAgICAgICAgID0gcmVxdWlyZSgnZXM2LWl0ZXJhdG9yJylcbiAgLCB0b1N0cmluZ1RhZ1N5bWJvbCA9IHJlcXVpcmUoJ2VzNi1zeW1ib2wnKS50b1N0cmluZ1RhZ1xuICAsIGtpbmRzICAgICAgICAgICAgID0gcmVxdWlyZSgnLi9pdGVyYXRvci1raW5kcycpXG5cbiAgLCBkZWZpbmVQcm9wZXJ0aWVzID0gT2JqZWN0LmRlZmluZVByb3BlcnRpZXNcbiAgLCB1bkJpbmQgPSBJdGVyYXRvci5wcm90b3R5cGUuX3VuQmluZFxuICAsIE1hcEl0ZXJhdG9yO1xuXG5NYXBJdGVyYXRvciA9IG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKG1hcCwga2luZCkge1xuXHRpZiAoISh0aGlzIGluc3RhbmNlb2YgTWFwSXRlcmF0b3IpKSByZXR1cm4gbmV3IE1hcEl0ZXJhdG9yKG1hcCwga2luZCk7XG5cdEl0ZXJhdG9yLmNhbGwodGhpcywgbWFwLl9fbWFwS2V5c0RhdGFfXywgbWFwKTtcblx0aWYgKCFraW5kIHx8ICFraW5kc1traW5kXSkga2luZCA9ICdrZXkrdmFsdWUnO1xuXHRkZWZpbmVQcm9wZXJ0aWVzKHRoaXMsIHtcblx0XHRfX2tpbmRfXzogZCgnJywga2luZCksXG5cdFx0X192YWx1ZXNfXzogZCgndycsIG1hcC5fX21hcFZhbHVlc0RhdGFfXylcblx0fSk7XG59O1xuaWYgKHNldFByb3RvdHlwZU9mKSBzZXRQcm90b3R5cGVPZihNYXBJdGVyYXRvciwgSXRlcmF0b3IpO1xuXG5NYXBJdGVyYXRvci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEl0ZXJhdG9yLnByb3RvdHlwZSwge1xuXHRjb25zdHJ1Y3RvcjogZChNYXBJdGVyYXRvciksXG5cdF9yZXNvbHZlOiBkKGZ1bmN0aW9uIChpKSB7XG5cdFx0aWYgKHRoaXMuX19raW5kX18gPT09ICd2YWx1ZScpIHJldHVybiB0aGlzLl9fdmFsdWVzX19baV07XG5cdFx0aWYgKHRoaXMuX19raW5kX18gPT09ICdrZXknKSByZXR1cm4gdGhpcy5fX2xpc3RfX1tpXTtcblx0XHRyZXR1cm4gW3RoaXMuX19saXN0X19baV0sIHRoaXMuX192YWx1ZXNfX1tpXV07XG5cdH0pLFxuXHRfdW5CaW5kOiBkKGZ1bmN0aW9uICgpIHtcblx0XHR0aGlzLl9fdmFsdWVzX18gPSBudWxsO1xuXHRcdHVuQmluZC5jYWxsKHRoaXMpO1xuXHR9KSxcblx0dG9TdHJpbmc6IGQoZnVuY3Rpb24gKCkgeyByZXR1cm4gJ1tvYmplY3QgTWFwIEl0ZXJhdG9yXSc7IH0pXG59KTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShNYXBJdGVyYXRvci5wcm90b3R5cGUsIHRvU3RyaW5nVGFnU3ltYm9sLFxuXHRkKCdjJywgJ01hcCBJdGVyYXRvcicpKTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGNsZWFyICAgICAgICAgID0gcmVxdWlyZSgnZXM1LWV4dC9hcnJheS8jL2NsZWFyJylcbiAgLCBlSW5kZXhPZiAgICAgICA9IHJlcXVpcmUoJ2VzNS1leHQvYXJyYXkvIy9lLWluZGV4LW9mJylcbiAgLCBzZXRQcm90b3R5cGVPZiA9IHJlcXVpcmUoJ2VzNS1leHQvb2JqZWN0L3NldC1wcm90b3R5cGUtb2YnKVxuICAsIGNhbGxhYmxlICAgICAgID0gcmVxdWlyZSgnZXM1LWV4dC9vYmplY3QvdmFsaWQtY2FsbGFibGUnKVxuICAsIHZhbGlkVmFsdWUgICAgID0gcmVxdWlyZSgnZXM1LWV4dC9vYmplY3QvdmFsaWQtdmFsdWUnKVxuICAsIGQgICAgICAgICAgICAgID0gcmVxdWlyZSgnZCcpXG4gICwgZWUgICAgICAgICAgICAgPSByZXF1aXJlKCdldmVudC1lbWl0dGVyJylcbiAgLCBTeW1ib2wgICAgICAgICA9IHJlcXVpcmUoJ2VzNi1zeW1ib2wnKVxuICAsIGl0ZXJhdG9yICAgICAgID0gcmVxdWlyZSgnZXM2LWl0ZXJhdG9yL3ZhbGlkLWl0ZXJhYmxlJylcbiAgLCBmb3JPZiAgICAgICAgICA9IHJlcXVpcmUoJ2VzNi1pdGVyYXRvci9mb3Itb2YnKVxuICAsIEl0ZXJhdG9yICAgICAgID0gcmVxdWlyZSgnLi9saWIvaXRlcmF0b3InKVxuICAsIGlzTmF0aXZlICAgICAgID0gcmVxdWlyZSgnLi9pcy1uYXRpdmUtaW1wbGVtZW50ZWQnKVxuXG4gICwgY2FsbCA9IEZ1bmN0aW9uLnByb3RvdHlwZS5jYWxsXG4gICwgZGVmaW5lUHJvcGVydGllcyA9IE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzLCBnZXRQcm90b3R5cGVPZiA9IE9iamVjdC5nZXRQcm90b3R5cGVPZlxuICAsIE1hcFBvbHk7XG5cbm1vZHVsZS5leHBvcnRzID0gTWFwUG9seSA9IGZ1bmN0aW9uICgvKml0ZXJhYmxlKi8pIHtcblx0dmFyIGl0ZXJhYmxlID0gYXJndW1lbnRzWzBdLCBrZXlzLCB2YWx1ZXMsIHNlbGY7XG5cdGlmICghKHRoaXMgaW5zdGFuY2VvZiBNYXBQb2x5KSkgdGhyb3cgbmV3IFR5cGVFcnJvcignQ29uc3RydWN0b3IgcmVxdWlyZXMgXFwnbmV3XFwnJyk7XG5cdGlmIChpc05hdGl2ZSAmJiBzZXRQcm90b3R5cGVPZiAmJiAoTWFwICE9PSBNYXBQb2x5KSkge1xuXHRcdHNlbGYgPSBzZXRQcm90b3R5cGVPZihuZXcgTWFwKCksIGdldFByb3RvdHlwZU9mKHRoaXMpKTtcblx0fSBlbHNlIHtcblx0XHRzZWxmID0gdGhpcztcblx0fVxuXHRpZiAoaXRlcmFibGUgIT0gbnVsbCkgaXRlcmF0b3IoaXRlcmFibGUpO1xuXHRkZWZpbmVQcm9wZXJ0aWVzKHNlbGYsIHtcblx0XHRfX21hcEtleXNEYXRhX186IGQoJ2MnLCBrZXlzID0gW10pLFxuXHRcdF9fbWFwVmFsdWVzRGF0YV9fOiBkKCdjJywgdmFsdWVzID0gW10pXG5cdH0pO1xuXHRpZiAoIWl0ZXJhYmxlKSByZXR1cm4gc2VsZjtcblx0Zm9yT2YoaXRlcmFibGUsIGZ1bmN0aW9uICh2YWx1ZSkge1xuXHRcdHZhciBrZXkgPSB2YWxpZFZhbHVlKHZhbHVlKVswXTtcblx0XHR2YWx1ZSA9IHZhbHVlWzFdO1xuXHRcdGlmIChlSW5kZXhPZi5jYWxsKGtleXMsIGtleSkgIT09IC0xKSByZXR1cm47XG5cdFx0a2V5cy5wdXNoKGtleSk7XG5cdFx0dmFsdWVzLnB1c2godmFsdWUpO1xuXHR9LCBzZWxmKTtcblx0cmV0dXJuIHNlbGY7XG59O1xuXG5pZiAoaXNOYXRpdmUpIHtcblx0aWYgKHNldFByb3RvdHlwZU9mKSBzZXRQcm90b3R5cGVPZihNYXBQb2x5LCBNYXApO1xuXHRNYXBQb2x5LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoTWFwLnByb3RvdHlwZSwge1xuXHRcdGNvbnN0cnVjdG9yOiBkKE1hcFBvbHkpXG5cdH0pO1xufVxuXG5lZShkZWZpbmVQcm9wZXJ0aWVzKE1hcFBvbHkucHJvdG90eXBlLCB7XG5cdGNsZWFyOiBkKGZ1bmN0aW9uICgpIHtcblx0XHRpZiAoIXRoaXMuX19tYXBLZXlzRGF0YV9fLmxlbmd0aCkgcmV0dXJuO1xuXHRcdGNsZWFyLmNhbGwodGhpcy5fX21hcEtleXNEYXRhX18pO1xuXHRcdGNsZWFyLmNhbGwodGhpcy5fX21hcFZhbHVlc0RhdGFfXyk7XG5cdFx0dGhpcy5lbWl0KCdfY2xlYXInKTtcblx0fSksXG5cdGRlbGV0ZTogZChmdW5jdGlvbiAoa2V5KSB7XG5cdFx0dmFyIGluZGV4ID0gZUluZGV4T2YuY2FsbCh0aGlzLl9fbWFwS2V5c0RhdGFfXywga2V5KTtcblx0XHRpZiAoaW5kZXggPT09IC0xKSByZXR1cm4gZmFsc2U7XG5cdFx0dGhpcy5fX21hcEtleXNEYXRhX18uc3BsaWNlKGluZGV4LCAxKTtcblx0XHR0aGlzLl9fbWFwVmFsdWVzRGF0YV9fLnNwbGljZShpbmRleCwgMSk7XG5cdFx0dGhpcy5lbWl0KCdfZGVsZXRlJywgaW5kZXgsIGtleSk7XG5cdFx0cmV0dXJuIHRydWU7XG5cdH0pLFxuXHRlbnRyaWVzOiBkKGZ1bmN0aW9uICgpIHsgcmV0dXJuIG5ldyBJdGVyYXRvcih0aGlzLCAna2V5K3ZhbHVlJyk7IH0pLFxuXHRmb3JFYWNoOiBkKGZ1bmN0aW9uIChjYi8qLCB0aGlzQXJnKi8pIHtcblx0XHR2YXIgdGhpc0FyZyA9IGFyZ3VtZW50c1sxXSwgaXRlcmF0b3IsIHJlc3VsdDtcblx0XHRjYWxsYWJsZShjYik7XG5cdFx0aXRlcmF0b3IgPSB0aGlzLmVudHJpZXMoKTtcblx0XHRyZXN1bHQgPSBpdGVyYXRvci5fbmV4dCgpO1xuXHRcdHdoaWxlIChyZXN1bHQgIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0Y2FsbC5jYWxsKGNiLCB0aGlzQXJnLCB0aGlzLl9fbWFwVmFsdWVzRGF0YV9fW3Jlc3VsdF0sXG5cdFx0XHRcdHRoaXMuX19tYXBLZXlzRGF0YV9fW3Jlc3VsdF0sIHRoaXMpO1xuXHRcdFx0cmVzdWx0ID0gaXRlcmF0b3IuX25leHQoKTtcblx0XHR9XG5cdH0pLFxuXHRnZXQ6IGQoZnVuY3Rpb24gKGtleSkge1xuXHRcdHZhciBpbmRleCA9IGVJbmRleE9mLmNhbGwodGhpcy5fX21hcEtleXNEYXRhX18sIGtleSk7XG5cdFx0aWYgKGluZGV4ID09PSAtMSkgcmV0dXJuO1xuXHRcdHJldHVybiB0aGlzLl9fbWFwVmFsdWVzRGF0YV9fW2luZGV4XTtcblx0fSksXG5cdGhhczogZChmdW5jdGlvbiAoa2V5KSB7XG5cdFx0cmV0dXJuIChlSW5kZXhPZi5jYWxsKHRoaXMuX19tYXBLZXlzRGF0YV9fLCBrZXkpICE9PSAtMSk7XG5cdH0pLFxuXHRrZXlzOiBkKGZ1bmN0aW9uICgpIHsgcmV0dXJuIG5ldyBJdGVyYXRvcih0aGlzLCAna2V5Jyk7IH0pLFxuXHRzZXQ6IGQoZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcblx0XHR2YXIgaW5kZXggPSBlSW5kZXhPZi5jYWxsKHRoaXMuX19tYXBLZXlzRGF0YV9fLCBrZXkpLCBlbWl0O1xuXHRcdGlmIChpbmRleCA9PT0gLTEpIHtcblx0XHRcdGluZGV4ID0gdGhpcy5fX21hcEtleXNEYXRhX18ucHVzaChrZXkpIC0gMTtcblx0XHRcdGVtaXQgPSB0cnVlO1xuXHRcdH1cblx0XHR0aGlzLl9fbWFwVmFsdWVzRGF0YV9fW2luZGV4XSA9IHZhbHVlO1xuXHRcdGlmIChlbWl0KSB0aGlzLmVtaXQoJ19hZGQnLCBpbmRleCwga2V5KTtcblx0XHRyZXR1cm4gdGhpcztcblx0fSksXG5cdHNpemU6IGQuZ3MoZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpcy5fX21hcEtleXNEYXRhX18ubGVuZ3RoOyB9KSxcblx0dmFsdWVzOiBkKGZ1bmN0aW9uICgpIHsgcmV0dXJuIG5ldyBJdGVyYXRvcih0aGlzLCAndmFsdWUnKTsgfSksXG5cdHRvU3RyaW5nOiBkKGZ1bmN0aW9uICgpIHsgcmV0dXJuICdbb2JqZWN0IE1hcF0nOyB9KVxufSkpO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KE1hcFBvbHkucHJvdG90eXBlLCBTeW1ib2wuaXRlcmF0b3IsIGQoZnVuY3Rpb24gKCkge1xuXHRyZXR1cm4gdGhpcy5lbnRyaWVzKCk7XG59KSk7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoTWFwUG9seS5wcm90b3R5cGUsIFN5bWJvbC50b1N0cmluZ1RhZywgZCgnYycsICdNYXAnKSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9pcy1pbXBsZW1lbnRlZCcpKCkgPyBTeW1ib2wgOiByZXF1aXJlKCcuL3BvbHlmaWxsJyk7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciB2YWxpZFR5cGVzID0geyBvYmplY3Q6IHRydWUsIHN5bWJvbDogdHJ1ZSB9O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICgpIHtcblx0dmFyIHN5bWJvbDtcblx0aWYgKHR5cGVvZiBTeW1ib2wgIT09ICdmdW5jdGlvbicpIHJldHVybiBmYWxzZTtcblx0c3ltYm9sID0gU3ltYm9sKCd0ZXN0IHN5bWJvbCcpO1xuXHR0cnkgeyBTdHJpbmcoc3ltYm9sKTsgfSBjYXRjaCAoZSkgeyByZXR1cm4gZmFsc2U7IH1cblxuXHQvLyBSZXR1cm4gJ3RydWUnIGFsc28gZm9yIHBvbHlmaWxsc1xuXHRpZiAoIXZhbGlkVHlwZXNbdHlwZW9mIFN5bWJvbC5pdGVyYXRvcl0pIHJldHVybiBmYWxzZTtcblx0aWYgKCF2YWxpZFR5cGVzW3R5cGVvZiBTeW1ib2wudG9QcmltaXRpdmVdKSByZXR1cm4gZmFsc2U7XG5cdGlmICghdmFsaWRUeXBlc1t0eXBlb2YgU3ltYm9sLnRvU3RyaW5nVGFnXSkgcmV0dXJuIGZhbHNlO1xuXG5cdHJldHVybiB0cnVlO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoeCkge1xuXHRpZiAoIXgpIHJldHVybiBmYWxzZTtcblx0aWYgKHR5cGVvZiB4ID09PSAnc3ltYm9sJykgcmV0dXJuIHRydWU7XG5cdGlmICgheC5jb25zdHJ1Y3RvcikgcmV0dXJuIGZhbHNlO1xuXHRpZiAoeC5jb25zdHJ1Y3Rvci5uYW1lICE9PSAnU3ltYm9sJykgcmV0dXJuIGZhbHNlO1xuXHRyZXR1cm4gKHhbeC5jb25zdHJ1Y3Rvci50b1N0cmluZ1RhZ10gPT09ICdTeW1ib2wnKTtcbn07XG4iLCIvLyBFUzIwMTUgU3ltYm9sIHBvbHlmaWxsIGZvciBlbnZpcm9ubWVudHMgdGhhdCBkbyBub3QgKG9yIHBhcnRpYWxseSkgc3VwcG9ydCBpdFxuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBkICAgICAgICAgICAgICA9IHJlcXVpcmUoJ2QnKVxuICAsIHZhbGlkYXRlU3ltYm9sID0gcmVxdWlyZSgnLi92YWxpZGF0ZS1zeW1ib2wnKVxuXG4gICwgY3JlYXRlID0gT2JqZWN0LmNyZWF0ZSwgZGVmaW5lUHJvcGVydGllcyA9IE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzXG4gICwgZGVmaW5lUHJvcGVydHkgPSBPYmplY3QuZGVmaW5lUHJvcGVydHksIG9ialByb3RvdHlwZSA9IE9iamVjdC5wcm90b3R5cGVcbiAgLCBOYXRpdmVTeW1ib2wsIFN5bWJvbFBvbHlmaWxsLCBIaWRkZW5TeW1ib2wsIGdsb2JhbFN5bWJvbHMgPSBjcmVhdGUobnVsbClcbiAgLCBpc05hdGl2ZVNhZmU7XG5cbmlmICh0eXBlb2YgU3ltYm9sID09PSAnZnVuY3Rpb24nKSB7XG5cdE5hdGl2ZVN5bWJvbCA9IFN5bWJvbDtcblx0dHJ5IHtcblx0XHRTdHJpbmcoTmF0aXZlU3ltYm9sKCkpO1xuXHRcdGlzTmF0aXZlU2FmZSA9IHRydWU7XG5cdH0gY2F0Y2ggKGlnbm9yZSkge31cbn1cblxudmFyIGdlbmVyYXRlTmFtZSA9IChmdW5jdGlvbiAoKSB7XG5cdHZhciBjcmVhdGVkID0gY3JlYXRlKG51bGwpO1xuXHRyZXR1cm4gZnVuY3Rpb24gKGRlc2MpIHtcblx0XHR2YXIgcG9zdGZpeCA9IDAsIG5hbWUsIGllMTFCdWdXb3JrYXJvdW5kO1xuXHRcdHdoaWxlIChjcmVhdGVkW2Rlc2MgKyAocG9zdGZpeCB8fCAnJyldKSArK3Bvc3RmaXg7XG5cdFx0ZGVzYyArPSAocG9zdGZpeCB8fCAnJyk7XG5cdFx0Y3JlYXRlZFtkZXNjXSA9IHRydWU7XG5cdFx0bmFtZSA9ICdAQCcgKyBkZXNjO1xuXHRcdGRlZmluZVByb3BlcnR5KG9ialByb3RvdHlwZSwgbmFtZSwgZC5ncyhudWxsLCBmdW5jdGlvbiAodmFsdWUpIHtcblx0XHRcdC8vIEZvciBJRTExIGlzc3VlIHNlZTpcblx0XHRcdC8vIGh0dHBzOi8vY29ubmVjdC5taWNyb3NvZnQuY29tL0lFL2ZlZWRiYWNrZGV0YWlsL3ZpZXcvMTkyODUwOC9cblx0XHRcdC8vICAgIGllMTEtYnJva2VuLWdldHRlcnMtb24tZG9tLW9iamVjdHNcblx0XHRcdC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9tZWRpa29vL2VzNi1zeW1ib2wvaXNzdWVzLzEyXG5cdFx0XHRpZiAoaWUxMUJ1Z1dvcmthcm91bmQpIHJldHVybjtcblx0XHRcdGllMTFCdWdXb3JrYXJvdW5kID0gdHJ1ZTtcblx0XHRcdGRlZmluZVByb3BlcnR5KHRoaXMsIG5hbWUsIGQodmFsdWUpKTtcblx0XHRcdGllMTFCdWdXb3JrYXJvdW5kID0gZmFsc2U7XG5cdFx0fSkpO1xuXHRcdHJldHVybiBuYW1lO1xuXHR9O1xufSgpKTtcblxuLy8gSW50ZXJuYWwgY29uc3RydWN0b3IgKG5vdCBvbmUgZXhwb3NlZCkgZm9yIGNyZWF0aW5nIFN5bWJvbCBpbnN0YW5jZXMuXG4vLyBUaGlzIG9uZSBpcyB1c2VkIHRvIGVuc3VyZSB0aGF0IGBzb21lU3ltYm9sIGluc3RhbmNlb2YgU3ltYm9sYCBhbHdheXMgcmV0dXJuIGZhbHNlXG5IaWRkZW5TeW1ib2wgPSBmdW5jdGlvbiBTeW1ib2woZGVzY3JpcHRpb24pIHtcblx0aWYgKHRoaXMgaW5zdGFuY2VvZiBIaWRkZW5TeW1ib2wpIHRocm93IG5ldyBUeXBlRXJyb3IoJ1N5bWJvbCBpcyBub3QgYSBjb25zdHJ1Y3RvcicpO1xuXHRyZXR1cm4gU3ltYm9sUG9seWZpbGwoZGVzY3JpcHRpb24pO1xufTtcblxuLy8gRXhwb3NlZCBgU3ltYm9sYCBjb25zdHJ1Y3RvclxuLy8gKHJldHVybnMgaW5zdGFuY2VzIG9mIEhpZGRlblN5bWJvbClcbm1vZHVsZS5leHBvcnRzID0gU3ltYm9sUG9seWZpbGwgPSBmdW5jdGlvbiBTeW1ib2woZGVzY3JpcHRpb24pIHtcblx0dmFyIHN5bWJvbDtcblx0aWYgKHRoaXMgaW5zdGFuY2VvZiBTeW1ib2wpIHRocm93IG5ldyBUeXBlRXJyb3IoJ1N5bWJvbCBpcyBub3QgYSBjb25zdHJ1Y3RvcicpO1xuXHRpZiAoaXNOYXRpdmVTYWZlKSByZXR1cm4gTmF0aXZlU3ltYm9sKGRlc2NyaXB0aW9uKTtcblx0c3ltYm9sID0gY3JlYXRlKEhpZGRlblN5bWJvbC5wcm90b3R5cGUpO1xuXHRkZXNjcmlwdGlvbiA9IChkZXNjcmlwdGlvbiA9PT0gdW5kZWZpbmVkID8gJycgOiBTdHJpbmcoZGVzY3JpcHRpb24pKTtcblx0cmV0dXJuIGRlZmluZVByb3BlcnRpZXMoc3ltYm9sLCB7XG5cdFx0X19kZXNjcmlwdGlvbl9fOiBkKCcnLCBkZXNjcmlwdGlvbiksXG5cdFx0X19uYW1lX186IGQoJycsIGdlbmVyYXRlTmFtZShkZXNjcmlwdGlvbikpXG5cdH0pO1xufTtcbmRlZmluZVByb3BlcnRpZXMoU3ltYm9sUG9seWZpbGwsIHtcblx0Zm9yOiBkKGZ1bmN0aW9uIChrZXkpIHtcblx0XHRpZiAoZ2xvYmFsU3ltYm9sc1trZXldKSByZXR1cm4gZ2xvYmFsU3ltYm9sc1trZXldO1xuXHRcdHJldHVybiAoZ2xvYmFsU3ltYm9sc1trZXldID0gU3ltYm9sUG9seWZpbGwoU3RyaW5nKGtleSkpKTtcblx0fSksXG5cdGtleUZvcjogZChmdW5jdGlvbiAocykge1xuXHRcdHZhciBrZXk7XG5cdFx0dmFsaWRhdGVTeW1ib2wocyk7XG5cdFx0Zm9yIChrZXkgaW4gZ2xvYmFsU3ltYm9scykgaWYgKGdsb2JhbFN5bWJvbHNba2V5XSA9PT0gcykgcmV0dXJuIGtleTtcblx0fSksXG5cblx0Ly8gVG8gZW5zdXJlIHByb3BlciBpbnRlcm9wZXJhYmlsaXR5IHdpdGggb3RoZXIgbmF0aXZlIGZ1bmN0aW9ucyAoZS5nLiBBcnJheS5mcm9tKVxuXHQvLyBmYWxsYmFjayB0byBldmVudHVhbCBuYXRpdmUgaW1wbGVtZW50YXRpb24gb2YgZ2l2ZW4gc3ltYm9sXG5cdGhhc0luc3RhbmNlOiBkKCcnLCAoTmF0aXZlU3ltYm9sICYmIE5hdGl2ZVN5bWJvbC5oYXNJbnN0YW5jZSkgfHwgU3ltYm9sUG9seWZpbGwoJ2hhc0luc3RhbmNlJykpLFxuXHRpc0NvbmNhdFNwcmVhZGFibGU6IGQoJycsIChOYXRpdmVTeW1ib2wgJiYgTmF0aXZlU3ltYm9sLmlzQ29uY2F0U3ByZWFkYWJsZSkgfHxcblx0XHRTeW1ib2xQb2x5ZmlsbCgnaXNDb25jYXRTcHJlYWRhYmxlJykpLFxuXHRpdGVyYXRvcjogZCgnJywgKE5hdGl2ZVN5bWJvbCAmJiBOYXRpdmVTeW1ib2wuaXRlcmF0b3IpIHx8IFN5bWJvbFBvbHlmaWxsKCdpdGVyYXRvcicpKSxcblx0bWF0Y2g6IGQoJycsIChOYXRpdmVTeW1ib2wgJiYgTmF0aXZlU3ltYm9sLm1hdGNoKSB8fCBTeW1ib2xQb2x5ZmlsbCgnbWF0Y2gnKSksXG5cdHJlcGxhY2U6IGQoJycsIChOYXRpdmVTeW1ib2wgJiYgTmF0aXZlU3ltYm9sLnJlcGxhY2UpIHx8IFN5bWJvbFBvbHlmaWxsKCdyZXBsYWNlJykpLFxuXHRzZWFyY2g6IGQoJycsIChOYXRpdmVTeW1ib2wgJiYgTmF0aXZlU3ltYm9sLnNlYXJjaCkgfHwgU3ltYm9sUG9seWZpbGwoJ3NlYXJjaCcpKSxcblx0c3BlY2llczogZCgnJywgKE5hdGl2ZVN5bWJvbCAmJiBOYXRpdmVTeW1ib2wuc3BlY2llcykgfHwgU3ltYm9sUG9seWZpbGwoJ3NwZWNpZXMnKSksXG5cdHNwbGl0OiBkKCcnLCAoTmF0aXZlU3ltYm9sICYmIE5hdGl2ZVN5bWJvbC5zcGxpdCkgfHwgU3ltYm9sUG9seWZpbGwoJ3NwbGl0JykpLFxuXHR0b1ByaW1pdGl2ZTogZCgnJywgKE5hdGl2ZVN5bWJvbCAmJiBOYXRpdmVTeW1ib2wudG9QcmltaXRpdmUpIHx8IFN5bWJvbFBvbHlmaWxsKCd0b1ByaW1pdGl2ZScpKSxcblx0dG9TdHJpbmdUYWc6IGQoJycsIChOYXRpdmVTeW1ib2wgJiYgTmF0aXZlU3ltYm9sLnRvU3RyaW5nVGFnKSB8fCBTeW1ib2xQb2x5ZmlsbCgndG9TdHJpbmdUYWcnKSksXG5cdHVuc2NvcGFibGVzOiBkKCcnLCAoTmF0aXZlU3ltYm9sICYmIE5hdGl2ZVN5bWJvbC51bnNjb3BhYmxlcykgfHwgU3ltYm9sUG9seWZpbGwoJ3Vuc2NvcGFibGVzJykpXG59KTtcblxuLy8gSW50ZXJuYWwgdHdlYWtzIGZvciByZWFsIHN5bWJvbCBwcm9kdWNlclxuZGVmaW5lUHJvcGVydGllcyhIaWRkZW5TeW1ib2wucHJvdG90eXBlLCB7XG5cdGNvbnN0cnVjdG9yOiBkKFN5bWJvbFBvbHlmaWxsKSxcblx0dG9TdHJpbmc6IGQoJycsIGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRoaXMuX19uYW1lX187IH0pXG59KTtcblxuLy8gUHJvcGVyIGltcGxlbWVudGF0aW9uIG9mIG1ldGhvZHMgZXhwb3NlZCBvbiBTeW1ib2wucHJvdG90eXBlXG4vLyBUaGV5IHdvbid0IGJlIGFjY2Vzc2libGUgb24gcHJvZHVjZWQgc3ltYm9sIGluc3RhbmNlcyBhcyB0aGV5IGRlcml2ZSBmcm9tIEhpZGRlblN5bWJvbC5wcm90b3R5cGVcbmRlZmluZVByb3BlcnRpZXMoU3ltYm9sUG9seWZpbGwucHJvdG90eXBlLCB7XG5cdHRvU3RyaW5nOiBkKGZ1bmN0aW9uICgpIHsgcmV0dXJuICdTeW1ib2wgKCcgKyB2YWxpZGF0ZVN5bWJvbCh0aGlzKS5fX2Rlc2NyaXB0aW9uX18gKyAnKSc7IH0pLFxuXHR2YWx1ZU9mOiBkKGZ1bmN0aW9uICgpIHsgcmV0dXJuIHZhbGlkYXRlU3ltYm9sKHRoaXMpOyB9KVxufSk7XG5kZWZpbmVQcm9wZXJ0eShTeW1ib2xQb2x5ZmlsbC5wcm90b3R5cGUsIFN5bWJvbFBvbHlmaWxsLnRvUHJpbWl0aXZlLCBkKCcnLCBmdW5jdGlvbiAoKSB7XG5cdHZhciBzeW1ib2wgPSB2YWxpZGF0ZVN5bWJvbCh0aGlzKTtcblx0aWYgKHR5cGVvZiBzeW1ib2wgPT09ICdzeW1ib2wnKSByZXR1cm4gc3ltYm9sO1xuXHRyZXR1cm4gc3ltYm9sLnRvU3RyaW5nKCk7XG59KSk7XG5kZWZpbmVQcm9wZXJ0eShTeW1ib2xQb2x5ZmlsbC5wcm90b3R5cGUsIFN5bWJvbFBvbHlmaWxsLnRvU3RyaW5nVGFnLCBkKCdjJywgJ1N5bWJvbCcpKTtcblxuLy8gUHJvcGVyIGltcGxlbWVudGF0b24gb2YgdG9QcmltaXRpdmUgYW5kIHRvU3RyaW5nVGFnIGZvciByZXR1cm5lZCBzeW1ib2wgaW5zdGFuY2VzXG5kZWZpbmVQcm9wZXJ0eShIaWRkZW5TeW1ib2wucHJvdG90eXBlLCBTeW1ib2xQb2x5ZmlsbC50b1N0cmluZ1RhZyxcblx0ZCgnYycsIFN5bWJvbFBvbHlmaWxsLnByb3RvdHlwZVtTeW1ib2xQb2x5ZmlsbC50b1N0cmluZ1RhZ10pKTtcblxuLy8gTm90ZTogSXQncyBpbXBvcnRhbnQgdG8gZGVmaW5lIGB0b1ByaW1pdGl2ZWAgYXMgbGFzdCBvbmUsIGFzIHNvbWUgaW1wbGVtZW50YXRpb25zXG4vLyBpbXBsZW1lbnQgYHRvUHJpbWl0aXZlYCBuYXRpdmVseSB3aXRob3V0IGltcGxlbWVudGluZyBgdG9TdHJpbmdUYWdgIChvciBvdGhlciBzcGVjaWZpZWQgc3ltYm9scylcbi8vIEFuZCB0aGF0IG1heSBpbnZva2UgZXJyb3IgaW4gZGVmaW5pdGlvbiBmbG93OlxuLy8gU2VlOiBodHRwczovL2dpdGh1Yi5jb20vbWVkaWtvby9lczYtc3ltYm9sL2lzc3Vlcy8xMyNpc3N1ZWNvbW1lbnQtMTY0MTQ2MTQ5XG5kZWZpbmVQcm9wZXJ0eShIaWRkZW5TeW1ib2wucHJvdG90eXBlLCBTeW1ib2xQb2x5ZmlsbC50b1ByaW1pdGl2ZSxcblx0ZCgnYycsIFN5bWJvbFBvbHlmaWxsLnByb3RvdHlwZVtTeW1ib2xQb2x5ZmlsbC50b1ByaW1pdGl2ZV0pKTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGlzU3ltYm9sID0gcmVxdWlyZSgnLi9pcy1zeW1ib2wnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAodmFsdWUpIHtcblx0aWYgKCFpc1N5bWJvbCh2YWx1ZSkpIHRocm93IG5ldyBUeXBlRXJyb3IodmFsdWUgKyBcIiBpcyBub3QgYSBzeW1ib2xcIik7XG5cdHJldHVybiB2YWx1ZTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBkICAgICAgICA9IHJlcXVpcmUoJ2QnKVxuICAsIGNhbGxhYmxlID0gcmVxdWlyZSgnZXM1LWV4dC9vYmplY3QvdmFsaWQtY2FsbGFibGUnKVxuXG4gICwgYXBwbHkgPSBGdW5jdGlvbi5wcm90b3R5cGUuYXBwbHksIGNhbGwgPSBGdW5jdGlvbi5wcm90b3R5cGUuY2FsbFxuICAsIGNyZWF0ZSA9IE9iamVjdC5jcmVhdGUsIGRlZmluZVByb3BlcnR5ID0gT2JqZWN0LmRlZmluZVByb3BlcnR5XG4gICwgZGVmaW5lUHJvcGVydGllcyA9IE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzXG4gICwgaGFzT3duUHJvcGVydHkgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5XG4gICwgZGVzY3JpcHRvciA9IHsgY29uZmlndXJhYmxlOiB0cnVlLCBlbnVtZXJhYmxlOiBmYWxzZSwgd3JpdGFibGU6IHRydWUgfVxuXG4gICwgb24sIG9uY2UsIG9mZiwgZW1pdCwgbWV0aG9kcywgZGVzY3JpcHRvcnMsIGJhc2U7XG5cbm9uID0gZnVuY3Rpb24gKHR5cGUsIGxpc3RlbmVyKSB7XG5cdHZhciBkYXRhO1xuXG5cdGNhbGxhYmxlKGxpc3RlbmVyKTtcblxuXHRpZiAoIWhhc093blByb3BlcnR5LmNhbGwodGhpcywgJ19fZWVfXycpKSB7XG5cdFx0ZGF0YSA9IGRlc2NyaXB0b3IudmFsdWUgPSBjcmVhdGUobnVsbCk7XG5cdFx0ZGVmaW5lUHJvcGVydHkodGhpcywgJ19fZWVfXycsIGRlc2NyaXB0b3IpO1xuXHRcdGRlc2NyaXB0b3IudmFsdWUgPSBudWxsO1xuXHR9IGVsc2Uge1xuXHRcdGRhdGEgPSB0aGlzLl9fZWVfXztcblx0fVxuXHRpZiAoIWRhdGFbdHlwZV0pIGRhdGFbdHlwZV0gPSBsaXN0ZW5lcjtcblx0ZWxzZSBpZiAodHlwZW9mIGRhdGFbdHlwZV0gPT09ICdvYmplY3QnKSBkYXRhW3R5cGVdLnB1c2gobGlzdGVuZXIpO1xuXHRlbHNlIGRhdGFbdHlwZV0gPSBbZGF0YVt0eXBlXSwgbGlzdGVuZXJdO1xuXG5cdHJldHVybiB0aGlzO1xufTtcblxub25jZSA9IGZ1bmN0aW9uICh0eXBlLCBsaXN0ZW5lcikge1xuXHR2YXIgb25jZSwgc2VsZjtcblxuXHRjYWxsYWJsZShsaXN0ZW5lcik7XG5cdHNlbGYgPSB0aGlzO1xuXHRvbi5jYWxsKHRoaXMsIHR5cGUsIG9uY2UgPSBmdW5jdGlvbiAoKSB7XG5cdFx0b2ZmLmNhbGwoc2VsZiwgdHlwZSwgb25jZSk7XG5cdFx0YXBwbHkuY2FsbChsaXN0ZW5lciwgdGhpcywgYXJndW1lbnRzKTtcblx0fSk7XG5cblx0b25jZS5fX2VlT25jZUxpc3RlbmVyX18gPSBsaXN0ZW5lcjtcblx0cmV0dXJuIHRoaXM7XG59O1xuXG5vZmYgPSBmdW5jdGlvbiAodHlwZSwgbGlzdGVuZXIpIHtcblx0dmFyIGRhdGEsIGxpc3RlbmVycywgY2FuZGlkYXRlLCBpO1xuXG5cdGNhbGxhYmxlKGxpc3RlbmVyKTtcblxuXHRpZiAoIWhhc093blByb3BlcnR5LmNhbGwodGhpcywgJ19fZWVfXycpKSByZXR1cm4gdGhpcztcblx0ZGF0YSA9IHRoaXMuX19lZV9fO1xuXHRpZiAoIWRhdGFbdHlwZV0pIHJldHVybiB0aGlzO1xuXHRsaXN0ZW5lcnMgPSBkYXRhW3R5cGVdO1xuXG5cdGlmICh0eXBlb2YgbGlzdGVuZXJzID09PSAnb2JqZWN0Jykge1xuXHRcdGZvciAoaSA9IDA7IChjYW5kaWRhdGUgPSBsaXN0ZW5lcnNbaV0pOyArK2kpIHtcblx0XHRcdGlmICgoY2FuZGlkYXRlID09PSBsaXN0ZW5lcikgfHxcblx0XHRcdFx0XHQoY2FuZGlkYXRlLl9fZWVPbmNlTGlzdGVuZXJfXyA9PT0gbGlzdGVuZXIpKSB7XG5cdFx0XHRcdGlmIChsaXN0ZW5lcnMubGVuZ3RoID09PSAyKSBkYXRhW3R5cGVdID0gbGlzdGVuZXJzW2kgPyAwIDogMV07XG5cdFx0XHRcdGVsc2UgbGlzdGVuZXJzLnNwbGljZShpLCAxKTtcblx0XHRcdH1cblx0XHR9XG5cdH0gZWxzZSB7XG5cdFx0aWYgKChsaXN0ZW5lcnMgPT09IGxpc3RlbmVyKSB8fFxuXHRcdFx0XHQobGlzdGVuZXJzLl9fZWVPbmNlTGlzdGVuZXJfXyA9PT0gbGlzdGVuZXIpKSB7XG5cdFx0XHRkZWxldGUgZGF0YVt0eXBlXTtcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gdGhpcztcbn07XG5cbmVtaXQgPSBmdW5jdGlvbiAodHlwZSkge1xuXHR2YXIgaSwgbCwgbGlzdGVuZXIsIGxpc3RlbmVycywgYXJncztcblxuXHRpZiAoIWhhc093blByb3BlcnR5LmNhbGwodGhpcywgJ19fZWVfXycpKSByZXR1cm47XG5cdGxpc3RlbmVycyA9IHRoaXMuX19lZV9fW3R5cGVdO1xuXHRpZiAoIWxpc3RlbmVycykgcmV0dXJuO1xuXG5cdGlmICh0eXBlb2YgbGlzdGVuZXJzID09PSAnb2JqZWN0Jykge1xuXHRcdGwgPSBhcmd1bWVudHMubGVuZ3RoO1xuXHRcdGFyZ3MgPSBuZXcgQXJyYXkobCAtIDEpO1xuXHRcdGZvciAoaSA9IDE7IGkgPCBsOyArK2kpIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuXG5cdFx0bGlzdGVuZXJzID0gbGlzdGVuZXJzLnNsaWNlKCk7XG5cdFx0Zm9yIChpID0gMDsgKGxpc3RlbmVyID0gbGlzdGVuZXJzW2ldKTsgKytpKSB7XG5cdFx0XHRhcHBseS5jYWxsKGxpc3RlbmVyLCB0aGlzLCBhcmdzKTtcblx0XHR9XG5cdH0gZWxzZSB7XG5cdFx0c3dpdGNoIChhcmd1bWVudHMubGVuZ3RoKSB7XG5cdFx0Y2FzZSAxOlxuXHRcdFx0Y2FsbC5jYWxsKGxpc3RlbmVycywgdGhpcyk7XG5cdFx0XHRicmVhaztcblx0XHRjYXNlIDI6XG5cdFx0XHRjYWxsLmNhbGwobGlzdGVuZXJzLCB0aGlzLCBhcmd1bWVudHNbMV0pO1xuXHRcdFx0YnJlYWs7XG5cdFx0Y2FzZSAzOlxuXHRcdFx0Y2FsbC5jYWxsKGxpc3RlbmVycywgdGhpcywgYXJndW1lbnRzWzFdLCBhcmd1bWVudHNbMl0pO1xuXHRcdFx0YnJlYWs7XG5cdFx0ZGVmYXVsdDpcblx0XHRcdGwgPSBhcmd1bWVudHMubGVuZ3RoO1xuXHRcdFx0YXJncyA9IG5ldyBBcnJheShsIC0gMSk7XG5cdFx0XHRmb3IgKGkgPSAxOyBpIDwgbDsgKytpKSB7XG5cdFx0XHRcdGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuXHRcdFx0fVxuXHRcdFx0YXBwbHkuY2FsbChsaXN0ZW5lcnMsIHRoaXMsIGFyZ3MpO1xuXHRcdH1cblx0fVxufTtcblxubWV0aG9kcyA9IHtcblx0b246IG9uLFxuXHRvbmNlOiBvbmNlLFxuXHRvZmY6IG9mZixcblx0ZW1pdDogZW1pdFxufTtcblxuZGVzY3JpcHRvcnMgPSB7XG5cdG9uOiBkKG9uKSxcblx0b25jZTogZChvbmNlKSxcblx0b2ZmOiBkKG9mZiksXG5cdGVtaXQ6IGQoZW1pdClcbn07XG5cbmJhc2UgPSBkZWZpbmVQcm9wZXJ0aWVzKHt9LCBkZXNjcmlwdG9ycyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cyA9IGZ1bmN0aW9uIChvKSB7XG5cdHJldHVybiAobyA9PSBudWxsKSA/IGNyZWF0ZShiYXNlKSA6IGRlZmluZVByb3BlcnRpZXMoT2JqZWN0KG8pLCBkZXNjcmlwdG9ycyk7XG59O1xuZXhwb3J0cy5tZXRob2RzID0gbWV0aG9kcztcbiIsIlwidXNlIHN0cmljdFwiO1xudmFyIF9fZXh0ZW5kcyA9ICh0aGlzICYmIHRoaXMuX19leHRlbmRzKSB8fCAoZnVuY3Rpb24gKCkge1xuICAgIHZhciBleHRlbmRTdGF0aWNzID0gT2JqZWN0LnNldFByb3RvdHlwZU9mIHx8XG4gICAgICAgICh7IF9fcHJvdG9fXzogW10gfSBpbnN0YW5jZW9mIEFycmF5ICYmIGZ1bmN0aW9uIChkLCBiKSB7IGQuX19wcm90b19fID0gYjsgfSkgfHxcbiAgICAgICAgZnVuY3Rpb24gKGQsIGIpIHsgZm9yICh2YXIgcCBpbiBiKSBpZiAoYi5oYXNPd25Qcm9wZXJ0eShwKSkgZFtwXSA9IGJbcF07IH07XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChkLCBiKSB7XG4gICAgICAgIGV4dGVuZFN0YXRpY3MoZCwgYik7XG4gICAgICAgIGZ1bmN0aW9uIF9fKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gZDsgfVxuICAgICAgICBkLnByb3RvdHlwZSA9IGIgPT09IG51bGwgPyBPYmplY3QuY3JlYXRlKGIpIDogKF9fLnByb3RvdHlwZSA9IGIucHJvdG90eXBlLCBuZXcgX18oKSk7XG4gICAgfTtcbn0pKCk7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG4vKipcbiAqIFRoZSB1bmlxdWUgaWQgaXMgdXNlZCBmb3IgdW5pcXVlIGhhc2hlcy5cbiAqL1xudmFyIHVuaXF1ZUlkID0gMDtcbi8qKlxuICogVGFnIHN0eWxlcyB3aXRoIHRoaXMgc3RyaW5nIHRvIGdldCB1bmlxdWUgaGFzaGVzLlxuICovXG5leHBvcnRzLklTX1VOSVFVRSA9ICdfX0RPX05PVF9ERURVUEVfU1RZTEVfXyc7XG52YXIgdXBwZXJDYXNlUGF0dGVybiA9IC9bQS1aXS9nO1xudmFyIG1zUGF0dGVybiA9IC9ebXMtLztcbnZhciBpbnRlcnBvbGF0ZVBhdHRlcm4gPSAvJi9nO1xudmFyIGVzY2FwZVBhdHRlcm4gPSAvWyAhIyQlJigpKissLi87PD0+P0BbXFxdXmB7fH1+XCInXFxcXF0vZztcbnZhciBwcm9wTG93ZXIgPSBmdW5jdGlvbiAobSkgeyByZXR1cm4gXCItXCIgKyBtLnRvTG93ZXJDYXNlKCk7IH07XG4vKipcbiAqIENTUyBwcm9wZXJ0aWVzIHRoYXQgYXJlIHZhbGlkIHVuaXQtbGVzcyBudW1iZXJzLlxuICovXG52YXIgY3NzTnVtYmVyUHJvcGVydGllcyA9IFtcbiAgICAnYW5pbWF0aW9uLWl0ZXJhdGlvbi1jb3VudCcsXG4gICAgJ2JveC1mbGV4JyxcbiAgICAnYm94LWZsZXgtZ3JvdXAnLFxuICAgICdjb2x1bW4tY291bnQnLFxuICAgICdjb3VudGVyLWluY3JlbWVudCcsXG4gICAgJ2NvdW50ZXItcmVzZXQnLFxuICAgICdmbGV4JyxcbiAgICAnZmxleC1ncm93JyxcbiAgICAnZmxleC1wb3NpdGl2ZScsXG4gICAgJ2ZsZXgtc2hyaW5rJyxcbiAgICAnZmxleC1uZWdhdGl2ZScsXG4gICAgJ2ZvbnQtd2VpZ2h0JyxcbiAgICAnbGluZS1jbGFtcCcsXG4gICAgJ2xpbmUtaGVpZ2h0JyxcbiAgICAnb3BhY2l0eScsXG4gICAgJ29yZGVyJyxcbiAgICAnb3JwaGFucycsXG4gICAgJ3RhYi1zaXplJyxcbiAgICAnd2lkb3dzJyxcbiAgICAnei1pbmRleCcsXG4gICAgJ3pvb20nLFxuICAgIC8vIFNWRyBwcm9wZXJ0aWVzLlxuICAgICdmaWxsLW9wYWNpdHknLFxuICAgICdzdHJva2UtZGFzaG9mZnNldCcsXG4gICAgJ3N0cm9rZS1vcGFjaXR5JyxcbiAgICAnc3Ryb2tlLXdpZHRoJ1xuXTtcbi8qKlxuICogTWFwIG9mIGNzcyBudW1iZXIgcHJvcGVydGllcy5cbiAqL1xudmFyIENTU19OVU1CRVIgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuLy8gQWRkIHZlbmRvciBwcmVmaXhlcyB0byBhbGwgdW5pdC1sZXNzIHByb3BlcnRpZXMuXG5mb3IgKHZhciBfaSA9IDAsIF9hID0gWyctd2Via2l0LScsICctbXMtJywgJy1tb3otJywgJy1vLScsICcnXTsgX2kgPCBfYS5sZW5ndGg7IF9pKyspIHtcbiAgICB2YXIgcHJlZml4ID0gX2FbX2ldO1xuICAgIGZvciAodmFyIF9iID0gMCwgY3NzTnVtYmVyUHJvcGVydGllc18xID0gY3NzTnVtYmVyUHJvcGVydGllczsgX2IgPCBjc3NOdW1iZXJQcm9wZXJ0aWVzXzEubGVuZ3RoOyBfYisrKSB7XG4gICAgICAgIHZhciBwcm9wZXJ0eSA9IGNzc051bWJlclByb3BlcnRpZXNfMVtfYl07XG4gICAgICAgIENTU19OVU1CRVJbcHJlZml4ICsgcHJvcGVydHldID0gdHJ1ZTtcbiAgICB9XG59XG4vKipcbiAqIEVzY2FwZSBhIENTUyBjbGFzcyBuYW1lLlxuICovXG5leHBvcnRzLmVzY2FwZSA9IGZ1bmN0aW9uIChzdHIpIHsgcmV0dXJuIHN0ci5yZXBsYWNlKGVzY2FwZVBhdHRlcm4sICdcXFxcJCYnKTsgfTtcbi8qKlxuICogVHJhbnNmb3JtIGEgSmF2YVNjcmlwdCBwcm9wZXJ0eSBpbnRvIGEgQ1NTIHByb3BlcnR5LlxuICovXG5mdW5jdGlvbiBoeXBoZW5hdGUocHJvcGVydHlOYW1lKSB7XG4gICAgcmV0dXJuIHByb3BlcnR5TmFtZVxuICAgICAgICAucmVwbGFjZSh1cHBlckNhc2VQYXR0ZXJuLCBwcm9wTG93ZXIpXG4gICAgICAgIC5yZXBsYWNlKG1zUGF0dGVybiwgJy1tcy0nKTsgLy8gSW50ZXJuZXQgRXhwbG9yZXIgdmVuZG9yIHByZWZpeC5cbn1cbmV4cG9ydHMuaHlwaGVuYXRlID0gaHlwaGVuYXRlO1xuLyoqXG4gKiBHZW5lcmF0ZSBhIGhhc2ggdmFsdWUgZnJvbSBhIHN0cmluZy5cbiAqL1xuZnVuY3Rpb24gc3RyaW5nSGFzaChzdHIpIHtcbiAgICB2YXIgdmFsdWUgPSA1MzgxO1xuICAgIHZhciBsZW4gPSBzdHIubGVuZ3RoO1xuICAgIHdoaWxlIChsZW4tLSlcbiAgICAgICAgdmFsdWUgPSAodmFsdWUgKiAzMykgXiBzdHIuY2hhckNvZGVBdChsZW4pO1xuICAgIHJldHVybiAodmFsdWUgPj4+IDApLnRvU3RyaW5nKDM2KTtcbn1cbmV4cG9ydHMuc3RyaW5nSGFzaCA9IHN0cmluZ0hhc2g7XG4vKipcbiAqIFRyYW5zZm9ybSBhIHN0eWxlIHN0cmluZyB0byBhIENTUyBzdHJpbmcuXG4gKi9cbmZ1bmN0aW9uIHN0eWxlVG9TdHJpbmcoa2V5LCB2YWx1ZSkge1xuICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInICYmIHZhbHVlICE9PSAwICYmICFDU1NfTlVNQkVSW2tleV0pIHtcbiAgICAgICAgcmV0dXJuIGtleSArIFwiOlwiICsgdmFsdWUgKyBcInB4XCI7XG4gICAgfVxuICAgIHJldHVybiBrZXkgKyBcIjpcIiArIHZhbHVlO1xufVxuLyoqXG4gKiBTb3J0IGFuIGFycmF5IG9mIHR1cGxlcyBieSBmaXJzdCB2YWx1ZS5cbiAqL1xuZnVuY3Rpb24gc29ydFR1cGxlcyh2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZS5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiBhWzBdID4gYlswXSA/IDEgOiAtMTsgfSk7XG59XG4vKipcbiAqIENhdGVnb3JpemUgdXNlciBzdHlsZXMuXG4gKi9cbmZ1bmN0aW9uIHBhcnNlU3R5bGVzKHN0eWxlcywgaGFzTmVzdGVkU3R5bGVzKSB7XG4gICAgdmFyIHByb3BlcnRpZXMgPSBbXTtcbiAgICB2YXIgbmVzdGVkU3R5bGVzID0gW107XG4gICAgdmFyIGlzVW5pcXVlID0gZmFsc2U7XG4gICAgLy8gU29ydCBrZXlzIGJlZm9yZSBhZGRpbmcgdG8gc3R5bGVzLlxuICAgIGZvciAodmFyIF9pID0gMCwgX2EgPSBPYmplY3Qua2V5cyhzdHlsZXMpOyBfaSA8IF9hLmxlbmd0aDsgX2krKykge1xuICAgICAgICB2YXIga2V5ID0gX2FbX2ldO1xuICAgICAgICB2YXIgdmFsdWUgPSBzdHlsZXNba2V5XTtcbiAgICAgICAgaWYgKHZhbHVlICE9PSBudWxsICYmIHZhbHVlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGlmIChrZXkgPT09IGV4cG9ydHMuSVNfVU5JUVVFKSB7XG4gICAgICAgICAgICAgICAgaXNVbmlxdWUgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAodHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiAhQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICBuZXN0ZWRTdHlsZXMucHVzaChba2V5LnRyaW0oKSwgdmFsdWVdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHByb3BlcnRpZXMucHVzaChbaHlwaGVuYXRlKGtleS50cmltKCkpLCB2YWx1ZV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICAgIHN0eWxlU3RyaW5nOiBzdHJpbmdpZnlQcm9wZXJ0aWVzKHNvcnRUdXBsZXMocHJvcGVydGllcykpLFxuICAgICAgICBuZXN0ZWRTdHlsZXM6IGhhc05lc3RlZFN0eWxlcyA/IG5lc3RlZFN0eWxlcyA6IHNvcnRUdXBsZXMobmVzdGVkU3R5bGVzKSxcbiAgICAgICAgaXNVbmlxdWU6IGlzVW5pcXVlXG4gICAgfTtcbn1cbi8qKlxuICogU3RyaW5naWZ5IGFuIGFycmF5IG9mIHByb3BlcnR5IHR1cGxlcy5cbiAqL1xuZnVuY3Rpb24gc3RyaW5naWZ5UHJvcGVydGllcyhwcm9wZXJ0aWVzKSB7XG4gICAgcmV0dXJuIHByb3BlcnRpZXMubWFwKGZ1bmN0aW9uIChfYSkge1xuICAgICAgICB2YXIgbmFtZSA9IF9hWzBdLCB2YWx1ZSA9IF9hWzFdO1xuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkodmFsdWUpKVxuICAgICAgICAgICAgcmV0dXJuIHN0eWxlVG9TdHJpbmcobmFtZSwgdmFsdWUpO1xuICAgICAgICByZXR1cm4gdmFsdWUubWFwKGZ1bmN0aW9uICh4KSB7IHJldHVybiBzdHlsZVRvU3RyaW5nKG5hbWUsIHgpOyB9KS5qb2luKCc7Jyk7XG4gICAgfSkuam9pbignOycpO1xufVxuLyoqXG4gKiBJbnRlcnBvbGF0ZSBDU1Mgc2VsZWN0b3JzLlxuICovXG5mdW5jdGlvbiBpbnRlcnBvbGF0ZShzZWxlY3RvciwgcGFyZW50KSB7XG4gICAgaWYgKHNlbGVjdG9yLmluZGV4T2YoJyYnKSA+IC0xKSB7XG4gICAgICAgIHJldHVybiBzZWxlY3Rvci5yZXBsYWNlKGludGVycG9sYXRlUGF0dGVybiwgcGFyZW50KTtcbiAgICB9XG4gICAgcmV0dXJuIHBhcmVudCArIFwiIFwiICsgc2VsZWN0b3I7XG59XG4vKipcbiAqIFJlY3Vyc2l2ZSBsb29wIGJ1aWxkaW5nIHN0eWxlcyB3aXRoIGRlZmVycmVkIHNlbGVjdG9ycy5cbiAqL1xuZnVuY3Rpb24gc3R5bGl6ZShjYWNoZSwgc2VsZWN0b3IsIHN0eWxlcywgbGlzdCwgcGFyZW50KSB7XG4gICAgdmFyIF9hID0gcGFyc2VTdHlsZXMoc3R5bGVzLCAhIXNlbGVjdG9yKSwgc3R5bGVTdHJpbmcgPSBfYS5zdHlsZVN0cmluZywgbmVzdGVkU3R5bGVzID0gX2EubmVzdGVkU3R5bGVzLCBpc1VuaXF1ZSA9IF9hLmlzVW5pcXVlO1xuICAgIHZhciBwaWQgPSBzdHlsZVN0cmluZztcbiAgICBpZiAoc2VsZWN0b3IuY2hhckNvZGVBdCgwKSA9PT0gNjQgLyogQCAqLykge1xuICAgICAgICB2YXIgcnVsZSA9IGNhY2hlLmFkZChuZXcgUnVsZShzZWxlY3RvciwgcGFyZW50ID8gdW5kZWZpbmVkIDogc3R5bGVTdHJpbmcsIGNhY2hlLmhhc2gpKTtcbiAgICAgICAgLy8gTmVzdGVkIHN0eWxlcyBzdXBwb3J0IChlLmcuIGAuZm9vID4gQG1lZGlhID4gLmJhcmApLlxuICAgICAgICBpZiAoc3R5bGVTdHJpbmcgJiYgcGFyZW50KSB7XG4gICAgICAgICAgICB2YXIgc3R5bGUgPSBydWxlLmFkZChuZXcgU3R5bGUoc3R5bGVTdHJpbmcsIHJ1bGUuaGFzaCwgaXNVbmlxdWUgPyBcInVcIiArICgrK3VuaXF1ZUlkKS50b1N0cmluZygzNikgOiB1bmRlZmluZWQpKTtcbiAgICAgICAgICAgIGxpc3QucHVzaChbcGFyZW50LCBzdHlsZV0pO1xuICAgICAgICB9XG4gICAgICAgIGZvciAodmFyIF9pID0gMCwgbmVzdGVkU3R5bGVzXzEgPSBuZXN0ZWRTdHlsZXM7IF9pIDwgbmVzdGVkU3R5bGVzXzEubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICB2YXIgX2IgPSBuZXN0ZWRTdHlsZXNfMVtfaV0sIG5hbWUgPSBfYlswXSwgdmFsdWUgPSBfYlsxXTtcbiAgICAgICAgICAgIHBpZCArPSBuYW1lICsgc3R5bGl6ZShydWxlLCBuYW1lLCB2YWx1ZSwgbGlzdCwgcGFyZW50KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgdmFyIGtleSA9IHBhcmVudCA/IGludGVycG9sYXRlKHNlbGVjdG9yLCBwYXJlbnQpIDogc2VsZWN0b3I7XG4gICAgICAgIGlmIChzdHlsZVN0cmluZykge1xuICAgICAgICAgICAgdmFyIHN0eWxlID0gY2FjaGUuYWRkKG5ldyBTdHlsZShzdHlsZVN0cmluZywgY2FjaGUuaGFzaCwgaXNVbmlxdWUgPyBcInVcIiArICgrK3VuaXF1ZUlkKS50b1N0cmluZygzNikgOiB1bmRlZmluZWQpKTtcbiAgICAgICAgICAgIGxpc3QucHVzaChba2V5LCBzdHlsZV0pO1xuICAgICAgICB9XG4gICAgICAgIGZvciAodmFyIF9jID0gMCwgbmVzdGVkU3R5bGVzXzIgPSBuZXN0ZWRTdHlsZXM7IF9jIDwgbmVzdGVkU3R5bGVzXzIubGVuZ3RoOyBfYysrKSB7XG4gICAgICAgICAgICB2YXIgX2QgPSBuZXN0ZWRTdHlsZXNfMltfY10sIG5hbWUgPSBfZFswXSwgdmFsdWUgPSBfZFsxXTtcbiAgICAgICAgICAgIHBpZCArPSBuYW1lICsgc3R5bGl6ZShjYWNoZSwgbmFtZSwgdmFsdWUsIGxpc3QsIGtleSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHBpZDtcbn1cbi8qKlxuICogUmVnaXN0ZXIgYWxsIHN0eWxlcywgYnV0IGNvbGxlY3QgZm9yIHNlbGVjdG9yIGludGVycG9sYXRpb24gdXNpbmcgdGhlIGhhc2guXG4gKi9cbmZ1bmN0aW9uIGNvbXBvc2VTdHlsZXMoY29udGFpbmVyLCBzZWxlY3Rvciwgc3R5bGVzLCBpc1N0eWxlLCBkaXNwbGF5TmFtZSkge1xuICAgIHZhciBjYWNoZSA9IG5ldyBDYWNoZShjb250YWluZXIuaGFzaCk7XG4gICAgdmFyIGxpc3QgPSBbXTtcbiAgICB2YXIgcGlkID0gc3R5bGl6ZShjYWNoZSwgc2VsZWN0b3IsIHN0eWxlcywgbGlzdCk7XG4gICAgdmFyIGhhc2ggPSBcImZcIiArIGNhY2hlLmhhc2gocGlkKTtcbiAgICB2YXIgaWQgPSBkaXNwbGF5TmFtZSA/IGRpc3BsYXlOYW1lICsgXCJfXCIgKyBoYXNoIDogaGFzaDtcbiAgICBmb3IgKHZhciBfaSA9IDAsIGxpc3RfMSA9IGxpc3Q7IF9pIDwgbGlzdF8xLmxlbmd0aDsgX2krKykge1xuICAgICAgICB2YXIgX2EgPSBsaXN0XzFbX2ldLCBzZWxlY3Rvcl8xID0gX2FbMF0sIHN0eWxlID0gX2FbMV07XG4gICAgICAgIHZhciBrZXkgPSBpc1N0eWxlID8gaW50ZXJwb2xhdGUoc2VsZWN0b3JfMSwgXCIuXCIgKyBleHBvcnRzLmVzY2FwZShpZCkpIDogc2VsZWN0b3JfMTtcbiAgICAgICAgc3R5bGUuYWRkKG5ldyBTZWxlY3RvcihrZXksIHN0eWxlLmhhc2gsIHVuZGVmaW5lZCwgcGlkKSk7XG4gICAgfVxuICAgIHJldHVybiB7IGNhY2hlOiBjYWNoZSwgcGlkOiBwaWQsIGlkOiBpZCB9O1xufVxuLyoqXG4gKiBDYWNoZSB0byBsaXN0IHRvIHN0eWxlcy5cbiAqL1xuZnVuY3Rpb24gam9pbihhcnIpIHtcbiAgICB2YXIgcmVzID0gJyc7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyBpKyspXG4gICAgICAgIHJlcyArPSBhcnJbaV07XG4gICAgcmV0dXJuIHJlcztcbn1cbi8qKlxuICogTm9vcCBjaGFuZ2VzLlxuICovXG52YXIgbm9vcENoYW5nZXMgPSB7XG4gICAgYWRkOiBmdW5jdGlvbiAoKSB7IHJldHVybiB1bmRlZmluZWQ7IH0sXG4gICAgY2hhbmdlOiBmdW5jdGlvbiAoKSB7IHJldHVybiB1bmRlZmluZWQ7IH0sXG4gICAgcmVtb3ZlOiBmdW5jdGlvbiAoKSB7IHJldHVybiB1bmRlZmluZWQ7IH1cbn07XG4vKipcbiAqIEltcGxlbWVudCBhIGNhY2hlL2V2ZW50IGVtaXR0ZXIuXG4gKi9cbnZhciBDYWNoZSA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBDYWNoZShoYXNoLCBjaGFuZ2VzKSB7XG4gICAgICAgIGlmIChoYXNoID09PSB2b2lkIDApIHsgaGFzaCA9IHN0cmluZ0hhc2g7IH1cbiAgICAgICAgaWYgKGNoYW5nZXMgPT09IHZvaWQgMCkgeyBjaGFuZ2VzID0gbm9vcENoYW5nZXM7IH1cbiAgICAgICAgdGhpcy5oYXNoID0gaGFzaDtcbiAgICAgICAgdGhpcy5jaGFuZ2VzID0gY2hhbmdlcztcbiAgICAgICAgdGhpcy5zaGVldCA9IFtdO1xuICAgICAgICB0aGlzLmNoYW5nZUlkID0gMDtcbiAgICAgICAgdGhpcy5fa2V5cyA9IFtdO1xuICAgICAgICB0aGlzLl9jaGlsZHJlbiA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gICAgICAgIHRoaXMuX2NvdW50ZXJzID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICB9XG4gICAgQ2FjaGUucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uIChzdHlsZSkge1xuICAgICAgICB2YXIgY291bnQgPSB0aGlzLl9jb3VudGVyc1tzdHlsZS5pZF0gfHwgMDtcbiAgICAgICAgdmFyIGl0ZW0gPSB0aGlzLl9jaGlsZHJlbltzdHlsZS5pZF0gfHwgc3R5bGUuY2xvbmUoKTtcbiAgICAgICAgdGhpcy5fY291bnRlcnNbc3R5bGUuaWRdID0gY291bnQgKyAxO1xuICAgICAgICBpZiAoY291bnQgPT09IDApIHtcbiAgICAgICAgICAgIHRoaXMuX2NoaWxkcmVuW2l0ZW0uaWRdID0gaXRlbTtcbiAgICAgICAgICAgIHRoaXMuX2tleXMucHVzaChpdGVtLmlkKTtcbiAgICAgICAgICAgIHRoaXMuc2hlZXQucHVzaChpdGVtLmdldFN0eWxlcygpKTtcbiAgICAgICAgICAgIHRoaXMuY2hhbmdlSWQrKztcbiAgICAgICAgICAgIHRoaXMuY2hhbmdlcy5hZGQoaXRlbSwgdGhpcy5fa2V5cy5sZW5ndGggLSAxKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIC8vIENoZWNrIGlmIGNvbnRlbnRzIGFyZSBkaWZmZXJlbnQuXG4gICAgICAgICAgICBpZiAoaXRlbS5nZXRJZGVudGlmaWVyKCkgIT09IHN0eWxlLmdldElkZW50aWZpZXIoKSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJIYXNoIGNvbGxpc2lvbjogXCIgKyBzdHlsZS5nZXRTdHlsZXMoKSArIFwiID09PSBcIiArIGl0ZW0uZ2V0U3R5bGVzKCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIG9sZEluZGV4ID0gdGhpcy5fa2V5cy5pbmRleE9mKHN0eWxlLmlkKTtcbiAgICAgICAgICAgIHZhciBuZXdJbmRleCA9IHRoaXMuX2tleXMubGVuZ3RoIC0gMTtcbiAgICAgICAgICAgIHZhciBwcmV2Q2hhbmdlSWQgPSB0aGlzLmNoYW5nZUlkO1xuICAgICAgICAgICAgaWYgKG9sZEluZGV4ICE9PSBuZXdJbmRleCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2tleXMuc3BsaWNlKG9sZEluZGV4LCAxKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9rZXlzLnB1c2goc3R5bGUuaWQpO1xuICAgICAgICAgICAgICAgIHRoaXMuY2hhbmdlSWQrKztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpdGVtIGluc3RhbmNlb2YgQ2FjaGUgJiYgc3R5bGUgaW5zdGFuY2VvZiBDYWNoZSkge1xuICAgICAgICAgICAgICAgIHZhciBwcmV2Q2hhbmdlSWRfMSA9IGl0ZW0uY2hhbmdlSWQ7XG4gICAgICAgICAgICAgICAgaXRlbS5tZXJnZShzdHlsZSk7XG4gICAgICAgICAgICAgICAgaWYgKGl0ZW0uY2hhbmdlSWQgIT09IHByZXZDaGFuZ2VJZF8xKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2hhbmdlSWQrKztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5jaGFuZ2VJZCAhPT0gcHJldkNoYW5nZUlkKSB7XG4gICAgICAgICAgICAgICAgaWYgKG9sZEluZGV4ID09PSBuZXdJbmRleCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNoZWV0LnNwbGljZShvbGRJbmRleCwgMSwgaXRlbS5nZXRTdHlsZXMoKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNoZWV0LnNwbGljZShvbGRJbmRleCwgMSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2hlZXQuc3BsaWNlKG5ld0luZGV4LCAwLCBpdGVtLmdldFN0eWxlcygpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5jaGFuZ2VzLmNoYW5nZShpdGVtLCBvbGRJbmRleCwgbmV3SW5kZXgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBpdGVtO1xuICAgIH07XG4gICAgQ2FjaGUucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uIChzdHlsZSkge1xuICAgICAgICB2YXIgY291bnQgPSB0aGlzLl9jb3VudGVyc1tzdHlsZS5pZF07XG4gICAgICAgIGlmIChjb3VudCA+IDApIHtcbiAgICAgICAgICAgIHRoaXMuX2NvdW50ZXJzW3N0eWxlLmlkXSA9IGNvdW50IC0gMTtcbiAgICAgICAgICAgIHZhciBpdGVtID0gdGhpcy5fY2hpbGRyZW5bc3R5bGUuaWRdO1xuICAgICAgICAgICAgdmFyIGluZGV4ID0gdGhpcy5fa2V5cy5pbmRleE9mKGl0ZW0uaWQpO1xuICAgICAgICAgICAgaWYgKGNvdW50ID09PSAxKSB7XG4gICAgICAgICAgICAgICAgZGVsZXRlIHRoaXMuX2NvdW50ZXJzW3N0eWxlLmlkXTtcbiAgICAgICAgICAgICAgICBkZWxldGUgdGhpcy5fY2hpbGRyZW5bc3R5bGUuaWRdO1xuICAgICAgICAgICAgICAgIHRoaXMuX2tleXMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgICAgICB0aGlzLnNoZWV0LnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICAgICAgdGhpcy5jaGFuZ2VJZCsrO1xuICAgICAgICAgICAgICAgIHRoaXMuY2hhbmdlcy5yZW1vdmUoaXRlbSwgaW5kZXgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoaXRlbSBpbnN0YW5jZW9mIENhY2hlICYmIHN0eWxlIGluc3RhbmNlb2YgQ2FjaGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgcHJldkNoYW5nZUlkID0gaXRlbS5jaGFuZ2VJZDtcbiAgICAgICAgICAgICAgICBpdGVtLnVubWVyZ2Uoc3R5bGUpO1xuICAgICAgICAgICAgICAgIGlmIChpdGVtLmNoYW5nZUlkICE9PSBwcmV2Q2hhbmdlSWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zaGVldC5zcGxpY2UoaW5kZXgsIDEsIGl0ZW0uZ2V0U3R5bGVzKCkpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmNoYW5nZUlkKys7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2hhbmdlcy5jaGFuZ2UoaXRlbSwgaW5kZXgsIGluZGV4KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuICAgIENhY2hlLnByb3RvdHlwZS5tZXJnZSA9IGZ1bmN0aW9uIChjYWNoZSkge1xuICAgICAgICBmb3IgKHZhciBfaSA9IDAsIF9hID0gY2FjaGUuX2tleXM7IF9pIDwgX2EubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICB2YXIgaWQgPSBfYVtfaV07XG4gICAgICAgICAgICB0aGlzLmFkZChjYWNoZS5fY2hpbGRyZW5baWRdKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIENhY2hlLnByb3RvdHlwZS51bm1lcmdlID0gZnVuY3Rpb24gKGNhY2hlKSB7XG4gICAgICAgIGZvciAodmFyIF9pID0gMCwgX2EgPSBjYWNoZS5fa2V5czsgX2kgPCBfYS5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgICAgIHZhciBpZCA9IF9hW19pXTtcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlKGNhY2hlLl9jaGlsZHJlbltpZF0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgQ2FjaGUucHJvdG90eXBlLmNsb25lID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gbmV3IENhY2hlKHRoaXMuaGFzaCkubWVyZ2UodGhpcyk7XG4gICAgfTtcbiAgICByZXR1cm4gQ2FjaGU7XG59KCkpO1xuZXhwb3J0cy5DYWNoZSA9IENhY2hlO1xuLyoqXG4gKiBTZWxlY3RvciBpcyBhIGR1bWIgY2xhc3MgbWFkZSB0byByZXByZXNlbnQgbmVzdGVkIENTUyBzZWxlY3RvcnMuXG4gKi9cbnZhciBTZWxlY3RvciA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBTZWxlY3RvcihzZWxlY3RvciwgaGFzaCwgaWQsIHBpZCkge1xuICAgICAgICBpZiAoaWQgPT09IHZvaWQgMCkgeyBpZCA9IFwic1wiICsgaGFzaChzZWxlY3Rvcik7IH1cbiAgICAgICAgaWYgKHBpZCA9PT0gdm9pZCAwKSB7IHBpZCA9ICcnOyB9XG4gICAgICAgIHRoaXMuc2VsZWN0b3IgPSBzZWxlY3RvcjtcbiAgICAgICAgdGhpcy5oYXNoID0gaGFzaDtcbiAgICAgICAgdGhpcy5pZCA9IGlkO1xuICAgICAgICB0aGlzLnBpZCA9IHBpZDtcbiAgICB9XG4gICAgU2VsZWN0b3IucHJvdG90eXBlLmdldFN0eWxlcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2VsZWN0b3I7XG4gICAgfTtcbiAgICBTZWxlY3Rvci5wcm90b3R5cGUuZ2V0SWRlbnRpZmllciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucGlkICsgXCIuXCIgKyB0aGlzLnNlbGVjdG9yO1xuICAgIH07XG4gICAgU2VsZWN0b3IucHJvdG90eXBlLmNsb25lID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gbmV3IFNlbGVjdG9yKHRoaXMuc2VsZWN0b3IsIHRoaXMuaGFzaCwgdGhpcy5pZCwgdGhpcy5waWQpO1xuICAgIH07XG4gICAgcmV0dXJuIFNlbGVjdG9yO1xufSgpKTtcbmV4cG9ydHMuU2VsZWN0b3IgPSBTZWxlY3Rvcjtcbi8qKlxuICogVGhlIHN0eWxlIGNvbnRhaW5lciByZWdpc3RlcnMgYSBzdHlsZSBzdHJpbmcgd2l0aCBzZWxlY3RvcnMuXG4gKi9cbnZhciBTdHlsZSA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uIChfc3VwZXIpIHtcbiAgICBfX2V4dGVuZHMoU3R5bGUsIF9zdXBlcik7XG4gICAgZnVuY3Rpb24gU3R5bGUoc3R5bGUsIGhhc2gsIGlkKSB7XG4gICAgICAgIGlmIChpZCA9PT0gdm9pZCAwKSB7IGlkID0gXCJjXCIgKyBoYXNoKHN0eWxlKTsgfVxuICAgICAgICB2YXIgX3RoaXMgPSBfc3VwZXIuY2FsbCh0aGlzLCBoYXNoKSB8fCB0aGlzO1xuICAgICAgICBfdGhpcy5zdHlsZSA9IHN0eWxlO1xuICAgICAgICBfdGhpcy5oYXNoID0gaGFzaDtcbiAgICAgICAgX3RoaXMuaWQgPSBpZDtcbiAgICAgICAgcmV0dXJuIF90aGlzO1xuICAgIH1cbiAgICBTdHlsZS5wcm90b3R5cGUuZ2V0U3R5bGVzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zaGVldC5qb2luKCcsJykgKyBcIntcIiArIHRoaXMuc3R5bGUgKyBcIn1cIjtcbiAgICB9O1xuICAgIFN0eWxlLnByb3RvdHlwZS5nZXRJZGVudGlmaWVyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zdHlsZTtcbiAgICB9O1xuICAgIFN0eWxlLnByb3RvdHlwZS5jbG9uZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBTdHlsZSh0aGlzLnN0eWxlLCB0aGlzLmhhc2gsIHRoaXMuaWQpLm1lcmdlKHRoaXMpO1xuICAgIH07XG4gICAgcmV0dXJuIFN0eWxlO1xufShDYWNoZSkpO1xuZXhwb3J0cy5TdHlsZSA9IFN0eWxlO1xuLyoqXG4gKiBJbXBsZW1lbnQgcnVsZSBsb2dpYyBmb3Igc3R5bGUgb3V0cHV0LlxuICovXG52YXIgUnVsZSA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uIChfc3VwZXIpIHtcbiAgICBfX2V4dGVuZHMoUnVsZSwgX3N1cGVyKTtcbiAgICBmdW5jdGlvbiBSdWxlKHJ1bGUsIHN0eWxlLCBoYXNoLCBpZCwgcGlkKSB7XG4gICAgICAgIGlmIChzdHlsZSA9PT0gdm9pZCAwKSB7IHN0eWxlID0gJyc7IH1cbiAgICAgICAgaWYgKGlkID09PSB2b2lkIDApIHsgaWQgPSBcImFcIiArIGhhc2gocnVsZSArIFwiLlwiICsgc3R5bGUpOyB9XG4gICAgICAgIGlmIChwaWQgPT09IHZvaWQgMCkgeyBwaWQgPSAnJzsgfVxuICAgICAgICB2YXIgX3RoaXMgPSBfc3VwZXIuY2FsbCh0aGlzLCBoYXNoKSB8fCB0aGlzO1xuICAgICAgICBfdGhpcy5ydWxlID0gcnVsZTtcbiAgICAgICAgX3RoaXMuc3R5bGUgPSBzdHlsZTtcbiAgICAgICAgX3RoaXMuaGFzaCA9IGhhc2g7XG4gICAgICAgIF90aGlzLmlkID0gaWQ7XG4gICAgICAgIF90aGlzLnBpZCA9IHBpZDtcbiAgICAgICAgcmV0dXJuIF90aGlzO1xuICAgIH1cbiAgICBSdWxlLnByb3RvdHlwZS5nZXRTdHlsZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJ1bGUgKyBcIntcIiArIHRoaXMuc3R5bGUgKyBqb2luKHRoaXMuc2hlZXQpICsgXCJ9XCI7XG4gICAgfTtcbiAgICBSdWxlLnByb3RvdHlwZS5nZXRJZGVudGlmaWVyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5waWQgKyBcIi5cIiArIHRoaXMucnVsZSArIFwiLlwiICsgdGhpcy5zdHlsZTtcbiAgICB9O1xuICAgIFJ1bGUucHJvdG90eXBlLmNsb25lID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gbmV3IFJ1bGUodGhpcy5ydWxlLCB0aGlzLnN0eWxlLCB0aGlzLmhhc2gsIHRoaXMuaWQsIHRoaXMucGlkKS5tZXJnZSh0aGlzKTtcbiAgICB9O1xuICAgIHJldHVybiBSdWxlO1xufShDYWNoZSkpO1xuZXhwb3J0cy5SdWxlID0gUnVsZTtcbi8qKlxuICogVGhlIEZyZWVTdHlsZSBjbGFzcyBpbXBsZW1lbnRzIHRoZSBBUEkgZm9yIGV2ZXJ5dGhpbmcgZWxzZS5cbiAqL1xudmFyIEZyZWVTdHlsZSA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uIChfc3VwZXIpIHtcbiAgICBfX2V4dGVuZHMoRnJlZVN0eWxlLCBfc3VwZXIpO1xuICAgIGZ1bmN0aW9uIEZyZWVTdHlsZShoYXNoLCBkZWJ1ZywgaWQsIGNoYW5nZXMpIHtcbiAgICAgICAgaWYgKGhhc2ggPT09IHZvaWQgMCkgeyBoYXNoID0gc3RyaW5nSGFzaDsgfVxuICAgICAgICBpZiAoZGVidWcgPT09IHZvaWQgMCkgeyBkZWJ1ZyA9IHR5cGVvZiBwcm9jZXNzICE9PSAndW5kZWZpbmVkJyAmJiBwcm9jZXNzLmVudlsnTk9ERV9FTlYnXSAhPT0gJ3Byb2R1Y3Rpb24nOyB9XG4gICAgICAgIGlmIChpZCA9PT0gdm9pZCAwKSB7IGlkID0gXCJmXCIgKyAoKyt1bmlxdWVJZCkudG9TdHJpbmcoMzYpOyB9XG4gICAgICAgIHZhciBfdGhpcyA9IF9zdXBlci5jYWxsKHRoaXMsIGhhc2gsIGNoYW5nZXMpIHx8IHRoaXM7XG4gICAgICAgIF90aGlzLmhhc2ggPSBoYXNoO1xuICAgICAgICBfdGhpcy5kZWJ1ZyA9IGRlYnVnO1xuICAgICAgICBfdGhpcy5pZCA9IGlkO1xuICAgICAgICByZXR1cm4gX3RoaXM7XG4gICAgfVxuICAgIEZyZWVTdHlsZS5wcm90b3R5cGUucmVnaXN0ZXJTdHlsZSA9IGZ1bmN0aW9uIChzdHlsZXMsIGRpc3BsYXlOYW1lKSB7XG4gICAgICAgIHZhciBkZWJ1Z05hbWUgPSB0aGlzLmRlYnVnID8gZGlzcGxheU5hbWUgOiB1bmRlZmluZWQ7XG4gICAgICAgIHZhciBfYSA9IGNvbXBvc2VTdHlsZXModGhpcywgJyYnLCBzdHlsZXMsIHRydWUsIGRlYnVnTmFtZSksIGNhY2hlID0gX2EuY2FjaGUsIGlkID0gX2EuaWQ7XG4gICAgICAgIHRoaXMubWVyZ2UoY2FjaGUpO1xuICAgICAgICByZXR1cm4gaWQ7XG4gICAgfTtcbiAgICBGcmVlU3R5bGUucHJvdG90eXBlLnJlZ2lzdGVyS2V5ZnJhbWVzID0gZnVuY3Rpb24gKGtleWZyYW1lcywgZGlzcGxheU5hbWUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmVnaXN0ZXJIYXNoUnVsZSgnQGtleWZyYW1lcycsIGtleWZyYW1lcywgZGlzcGxheU5hbWUpO1xuICAgIH07XG4gICAgRnJlZVN0eWxlLnByb3RvdHlwZS5yZWdpc3Rlckhhc2hSdWxlID0gZnVuY3Rpb24gKHByZWZpeCwgc3R5bGVzLCBkaXNwbGF5TmFtZSkge1xuICAgICAgICB2YXIgZGVidWdOYW1lID0gdGhpcy5kZWJ1ZyA/IGRpc3BsYXlOYW1lIDogdW5kZWZpbmVkO1xuICAgICAgICB2YXIgX2EgPSBjb21wb3NlU3R5bGVzKHRoaXMsICcnLCBzdHlsZXMsIGZhbHNlLCBkZWJ1Z05hbWUpLCBjYWNoZSA9IF9hLmNhY2hlLCBwaWQgPSBfYS5waWQsIGlkID0gX2EuaWQ7XG4gICAgICAgIHZhciBydWxlID0gbmV3IFJ1bGUocHJlZml4ICsgXCIgXCIgKyBleHBvcnRzLmVzY2FwZShpZCksIHVuZGVmaW5lZCwgdGhpcy5oYXNoLCB1bmRlZmluZWQsIHBpZCk7XG4gICAgICAgIHRoaXMuYWRkKHJ1bGUubWVyZ2UoY2FjaGUpKTtcbiAgICAgICAgcmV0dXJuIGlkO1xuICAgIH07XG4gICAgRnJlZVN0eWxlLnByb3RvdHlwZS5yZWdpc3RlclJ1bGUgPSBmdW5jdGlvbiAocnVsZSwgc3R5bGVzKSB7XG4gICAgICAgIHRoaXMubWVyZ2UoY29tcG9zZVN0eWxlcyh0aGlzLCBydWxlLCBzdHlsZXMsIGZhbHNlKS5jYWNoZSk7XG4gICAgfTtcbiAgICBGcmVlU3R5bGUucHJvdG90eXBlLnJlZ2lzdGVyQ3NzID0gZnVuY3Rpb24gKHN0eWxlcykge1xuICAgICAgICB0aGlzLm1lcmdlKGNvbXBvc2VTdHlsZXModGhpcywgJycsIHN0eWxlcywgZmFsc2UpLmNhY2hlKTtcbiAgICB9O1xuICAgIEZyZWVTdHlsZS5wcm90b3R5cGUuZ2V0U3R5bGVzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gam9pbih0aGlzLnNoZWV0KTtcbiAgICB9O1xuICAgIEZyZWVTdHlsZS5wcm90b3R5cGUuZ2V0SWRlbnRpZmllciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaWQ7XG4gICAgfTtcbiAgICBGcmVlU3R5bGUucHJvdG90eXBlLmNsb25lID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gbmV3IEZyZWVTdHlsZSh0aGlzLmhhc2gsIHRoaXMuZGVidWcsIHRoaXMuaWQsIHRoaXMuY2hhbmdlcykubWVyZ2UodGhpcyk7XG4gICAgfTtcbiAgICByZXR1cm4gRnJlZVN0eWxlO1xufShDYWNoZSkpO1xuZXhwb3J0cy5GcmVlU3R5bGUgPSBGcmVlU3R5bGU7XG4vKipcbiAqIEV4cG9ydHMgYSBzaW1wbGUgZnVuY3Rpb24gdG8gY3JlYXRlIGEgbmV3IGluc3RhbmNlLlxuICovXG5mdW5jdGlvbiBjcmVhdGUoaGFzaCwgZGVidWcsIGNoYW5nZXMpIHtcbiAgICByZXR1cm4gbmV3IEZyZWVTdHlsZShoYXNoLCBkZWJ1ZywgdW5kZWZpbmVkLCBjaGFuZ2VzKTtcbn1cbmV4cG9ydHMuY3JlYXRlID0gY3JlYXRlO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZnJlZS1zdHlsZS5qcy5tYXAiLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG52YXIgY2FuVXNlRE9NID0gZXhwb3J0cy5jYW5Vc2VET00gPSAhISh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB3aW5kb3cuZG9jdW1lbnQgJiYgd2luZG93LmRvY3VtZW50LmNyZWF0ZUVsZW1lbnQpO1xuXG52YXIgYWRkRXZlbnRMaXN0ZW5lciA9IGV4cG9ydHMuYWRkRXZlbnRMaXN0ZW5lciA9IGZ1bmN0aW9uIGFkZEV2ZW50TGlzdGVuZXIobm9kZSwgZXZlbnQsIGxpc3RlbmVyKSB7XG4gIHJldHVybiBub2RlLmFkZEV2ZW50TGlzdGVuZXIgPyBub2RlLmFkZEV2ZW50TGlzdGVuZXIoZXZlbnQsIGxpc3RlbmVyLCBmYWxzZSkgOiBub2RlLmF0dGFjaEV2ZW50KCdvbicgKyBldmVudCwgbGlzdGVuZXIpO1xufTtcblxudmFyIHJlbW92ZUV2ZW50TGlzdGVuZXIgPSBleHBvcnRzLnJlbW92ZUV2ZW50TGlzdGVuZXIgPSBmdW5jdGlvbiByZW1vdmVFdmVudExpc3RlbmVyKG5vZGUsIGV2ZW50LCBsaXN0ZW5lcikge1xuICByZXR1cm4gbm9kZS5yZW1vdmVFdmVudExpc3RlbmVyID8gbm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50LCBsaXN0ZW5lciwgZmFsc2UpIDogbm9kZS5kZXRhY2hFdmVudCgnb24nICsgZXZlbnQsIGxpc3RlbmVyKTtcbn07XG5cbnZhciBnZXRDb25maXJtYXRpb24gPSBleHBvcnRzLmdldENvbmZpcm1hdGlvbiA9IGZ1bmN0aW9uIGdldENvbmZpcm1hdGlvbihtZXNzYWdlLCBjYWxsYmFjaykge1xuICByZXR1cm4gY2FsbGJhY2sod2luZG93LmNvbmZpcm0obWVzc2FnZSkpO1xufTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1hbGVydFxuXG4vKipcbiAqIFJldHVybnMgdHJ1ZSBpZiB0aGUgSFRNTDUgaGlzdG9yeSBBUEkgaXMgc3VwcG9ydGVkLiBUYWtlbiBmcm9tIE1vZGVybml6ci5cbiAqXG4gKiBodHRwczovL2dpdGh1Yi5jb20vTW9kZXJuaXpyL01vZGVybml6ci9ibG9iL21hc3Rlci9MSUNFTlNFXG4gKiBodHRwczovL2dpdGh1Yi5jb20vTW9kZXJuaXpyL01vZGVybml6ci9ibG9iL21hc3Rlci9mZWF0dXJlLWRldGVjdHMvaGlzdG9yeS5qc1xuICogY2hhbmdlZCB0byBhdm9pZCBmYWxzZSBuZWdhdGl2ZXMgZm9yIFdpbmRvd3MgUGhvbmVzOiBodHRwczovL2dpdGh1Yi5jb20vcmVhY3Rqcy9yZWFjdC1yb3V0ZXIvaXNzdWVzLzU4NlxuICovXG52YXIgc3VwcG9ydHNIaXN0b3J5ID0gZXhwb3J0cy5zdXBwb3J0c0hpc3RvcnkgPSBmdW5jdGlvbiBzdXBwb3J0c0hpc3RvcnkoKSB7XG4gIHZhciB1YSA9IHdpbmRvdy5uYXZpZ2F0b3IudXNlckFnZW50O1xuXG4gIGlmICgodWEuaW5kZXhPZignQW5kcm9pZCAyLicpICE9PSAtMSB8fCB1YS5pbmRleE9mKCdBbmRyb2lkIDQuMCcpICE9PSAtMSkgJiYgdWEuaW5kZXhPZignTW9iaWxlIFNhZmFyaScpICE9PSAtMSAmJiB1YS5pbmRleE9mKCdDaHJvbWUnKSA9PT0gLTEgJiYgdWEuaW5kZXhPZignV2luZG93cyBQaG9uZScpID09PSAtMSkgcmV0dXJuIGZhbHNlO1xuXG4gIHJldHVybiB3aW5kb3cuaGlzdG9yeSAmJiAncHVzaFN0YXRlJyBpbiB3aW5kb3cuaGlzdG9yeTtcbn07XG5cbi8qKlxuICogUmV0dXJucyB0cnVlIGlmIGJyb3dzZXIgZmlyZXMgcG9wc3RhdGUgb24gaGFzaCBjaGFuZ2UuXG4gKiBJRTEwIGFuZCBJRTExIGRvIG5vdC5cbiAqL1xudmFyIHN1cHBvcnRzUG9wU3RhdGVPbkhhc2hDaGFuZ2UgPSBleHBvcnRzLnN1cHBvcnRzUG9wU3RhdGVPbkhhc2hDaGFuZ2UgPSBmdW5jdGlvbiBzdXBwb3J0c1BvcFN0YXRlT25IYXNoQ2hhbmdlKCkge1xuICByZXR1cm4gd2luZG93Lm5hdmlnYXRvci51c2VyQWdlbnQuaW5kZXhPZignVHJpZGVudCcpID09PSAtMTtcbn07XG5cbi8qKlxuICogUmV0dXJucyBmYWxzZSBpZiB1c2luZyBnbyhuKSB3aXRoIGhhc2ggaGlzdG9yeSBjYXVzZXMgYSBmdWxsIHBhZ2UgcmVsb2FkLlxuICovXG52YXIgc3VwcG9ydHNHb1dpdGhvdXRSZWxvYWRVc2luZ0hhc2ggPSBleHBvcnRzLnN1cHBvcnRzR29XaXRob3V0UmVsb2FkVXNpbmdIYXNoID0gZnVuY3Rpb24gc3VwcG9ydHNHb1dpdGhvdXRSZWxvYWRVc2luZ0hhc2goKSB7XG4gIHJldHVybiB3aW5kb3cubmF2aWdhdG9yLnVzZXJBZ2VudC5pbmRleE9mKCdGaXJlZm94JykgPT09IC0xO1xufTtcblxuLyoqXG4gKiBSZXR1cm5zIHRydWUgaWYgYSBnaXZlbiBwb3BzdGF0ZSBldmVudCBpcyBhbiBleHRyYW5lb3VzIFdlYktpdCBldmVudC5cbiAqIEFjY291bnRzIGZvciB0aGUgZmFjdCB0aGF0IENocm9tZSBvbiBpT1MgZmlyZXMgcmVhbCBwb3BzdGF0ZSBldmVudHNcbiAqIGNvbnRhaW5pbmcgdW5kZWZpbmVkIHN0YXRlIHdoZW4gcHJlc3NpbmcgdGhlIGJhY2sgYnV0dG9uLlxuICovXG52YXIgaXNFeHRyYW5lb3VzUG9wc3RhdGVFdmVudCA9IGV4cG9ydHMuaXNFeHRyYW5lb3VzUG9wc3RhdGVFdmVudCA9IGZ1bmN0aW9uIGlzRXh0cmFuZW91c1BvcHN0YXRlRXZlbnQoZXZlbnQpIHtcbiAgcmV0dXJuIGV2ZW50LnN0YXRlID09PSB1bmRlZmluZWQgJiYgbmF2aWdhdG9yLnVzZXJBZ2VudC5pbmRleE9mKCdDcmlPUycpID09PSAtMTtcbn07IiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuZXhwb3J0cy5sb2NhdGlvbnNBcmVFcXVhbCA9IGV4cG9ydHMuY3JlYXRlTG9jYXRpb24gPSB1bmRlZmluZWQ7XG5cbnZhciBfZXh0ZW5kcyA9IE9iamVjdC5hc3NpZ24gfHwgZnVuY3Rpb24gKHRhcmdldCkgeyBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykgeyB2YXIgc291cmNlID0gYXJndW1lbnRzW2ldOyBmb3IgKHZhciBrZXkgaW4gc291cmNlKSB7IGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoc291cmNlLCBrZXkpKSB7IHRhcmdldFtrZXldID0gc291cmNlW2tleV07IH0gfSB9IHJldHVybiB0YXJnZXQ7IH07XG5cbnZhciBfcmVzb2x2ZVBhdGhuYW1lID0gcmVxdWlyZSgncmVzb2x2ZS1wYXRobmFtZScpO1xuXG52YXIgX3Jlc29sdmVQYXRobmFtZTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9yZXNvbHZlUGF0aG5hbWUpO1xuXG52YXIgX3ZhbHVlRXF1YWwgPSByZXF1aXJlKCd2YWx1ZS1lcXVhbCcpO1xuXG52YXIgX3ZhbHVlRXF1YWwyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfdmFsdWVFcXVhbCk7XG5cbnZhciBfUGF0aFV0aWxzID0gcmVxdWlyZSgnLi9QYXRoVXRpbHMnKTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgZGVmYXVsdDogb2JqIH07IH1cblxudmFyIGNyZWF0ZUxvY2F0aW9uID0gZXhwb3J0cy5jcmVhdGVMb2NhdGlvbiA9IGZ1bmN0aW9uIGNyZWF0ZUxvY2F0aW9uKHBhdGgsIHN0YXRlLCBrZXksIGN1cnJlbnRMb2NhdGlvbikge1xuICB2YXIgbG9jYXRpb24gPSB2b2lkIDA7XG4gIGlmICh0eXBlb2YgcGF0aCA9PT0gJ3N0cmluZycpIHtcbiAgICAvLyBUd28tYXJnIGZvcm06IHB1c2gocGF0aCwgc3RhdGUpXG4gICAgbG9jYXRpb24gPSAoMCwgX1BhdGhVdGlscy5wYXJzZVBhdGgpKHBhdGgpO1xuICAgIGxvY2F0aW9uLnN0YXRlID0gc3RhdGU7XG4gIH0gZWxzZSB7XG4gICAgLy8gT25lLWFyZyBmb3JtOiBwdXNoKGxvY2F0aW9uKVxuICAgIGxvY2F0aW9uID0gX2V4dGVuZHMoe30sIHBhdGgpO1xuXG4gICAgaWYgKGxvY2F0aW9uLnBhdGhuYW1lID09PSB1bmRlZmluZWQpIGxvY2F0aW9uLnBhdGhuYW1lID0gJyc7XG5cbiAgICBpZiAobG9jYXRpb24uc2VhcmNoKSB7XG4gICAgICBpZiAobG9jYXRpb24uc2VhcmNoLmNoYXJBdCgwKSAhPT0gJz8nKSBsb2NhdGlvbi5zZWFyY2ggPSAnPycgKyBsb2NhdGlvbi5zZWFyY2g7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxvY2F0aW9uLnNlYXJjaCA9ICcnO1xuICAgIH1cblxuICAgIGlmIChsb2NhdGlvbi5oYXNoKSB7XG4gICAgICBpZiAobG9jYXRpb24uaGFzaC5jaGFyQXQoMCkgIT09ICcjJykgbG9jYXRpb24uaGFzaCA9ICcjJyArIGxvY2F0aW9uLmhhc2g7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxvY2F0aW9uLmhhc2ggPSAnJztcbiAgICB9XG5cbiAgICBpZiAoc3RhdGUgIT09IHVuZGVmaW5lZCAmJiBsb2NhdGlvbi5zdGF0ZSA9PT0gdW5kZWZpbmVkKSBsb2NhdGlvbi5zdGF0ZSA9IHN0YXRlO1xuICB9XG5cbiAgdHJ5IHtcbiAgICBsb2NhdGlvbi5wYXRobmFtZSA9IGRlY29kZVVSSShsb2NhdGlvbi5wYXRobmFtZSk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBpZiAoZSBpbnN0YW5jZW9mIFVSSUVycm9yKSB7XG4gICAgICB0aHJvdyBuZXcgVVJJRXJyb3IoJ1BhdGhuYW1lIFwiJyArIGxvY2F0aW9uLnBhdGhuYW1lICsgJ1wiIGNvdWxkIG5vdCBiZSBkZWNvZGVkLiAnICsgJ1RoaXMgaXMgbGlrZWx5IGNhdXNlZCBieSBhbiBpbnZhbGlkIHBlcmNlbnQtZW5jb2RpbmcuJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IGU7XG4gICAgfVxuICB9XG5cbiAgaWYgKGtleSkgbG9jYXRpb24ua2V5ID0ga2V5O1xuXG4gIGlmIChjdXJyZW50TG9jYXRpb24pIHtcbiAgICAvLyBSZXNvbHZlIGluY29tcGxldGUvcmVsYXRpdmUgcGF0aG5hbWUgcmVsYXRpdmUgdG8gY3VycmVudCBsb2NhdGlvbi5cbiAgICBpZiAoIWxvY2F0aW9uLnBhdGhuYW1lKSB7XG4gICAgICBsb2NhdGlvbi5wYXRobmFtZSA9IGN1cnJlbnRMb2NhdGlvbi5wYXRobmFtZTtcbiAgICB9IGVsc2UgaWYgKGxvY2F0aW9uLnBhdGhuYW1lLmNoYXJBdCgwKSAhPT0gJy8nKSB7XG4gICAgICBsb2NhdGlvbi5wYXRobmFtZSA9ICgwLCBfcmVzb2x2ZVBhdGhuYW1lMi5kZWZhdWx0KShsb2NhdGlvbi5wYXRobmFtZSwgY3VycmVudExvY2F0aW9uLnBhdGhuYW1lKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgLy8gV2hlbiB0aGVyZSBpcyBubyBwcmlvciBsb2NhdGlvbiBhbmQgcGF0aG5hbWUgaXMgZW1wdHksIHNldCBpdCB0byAvXG4gICAgaWYgKCFsb2NhdGlvbi5wYXRobmFtZSkge1xuICAgICAgbG9jYXRpb24ucGF0aG5hbWUgPSAnLyc7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGxvY2F0aW9uO1xufTtcblxudmFyIGxvY2F0aW9uc0FyZUVxdWFsID0gZXhwb3J0cy5sb2NhdGlvbnNBcmVFcXVhbCA9IGZ1bmN0aW9uIGxvY2F0aW9uc0FyZUVxdWFsKGEsIGIpIHtcbiAgcmV0dXJuIGEucGF0aG5hbWUgPT09IGIucGF0aG5hbWUgJiYgYS5zZWFyY2ggPT09IGIuc2VhcmNoICYmIGEuaGFzaCA9PT0gYi5oYXNoICYmIGEua2V5ID09PSBiLmtleSAmJiAoMCwgX3ZhbHVlRXF1YWwyLmRlZmF1bHQpKGEuc3RhdGUsIGIuc3RhdGUpO1xufTsiLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG52YXIgYWRkTGVhZGluZ1NsYXNoID0gZXhwb3J0cy5hZGRMZWFkaW5nU2xhc2ggPSBmdW5jdGlvbiBhZGRMZWFkaW5nU2xhc2gocGF0aCkge1xuICByZXR1cm4gcGF0aC5jaGFyQXQoMCkgPT09ICcvJyA/IHBhdGggOiAnLycgKyBwYXRoO1xufTtcblxudmFyIHN0cmlwTGVhZGluZ1NsYXNoID0gZXhwb3J0cy5zdHJpcExlYWRpbmdTbGFzaCA9IGZ1bmN0aW9uIHN0cmlwTGVhZGluZ1NsYXNoKHBhdGgpIHtcbiAgcmV0dXJuIHBhdGguY2hhckF0KDApID09PSAnLycgPyBwYXRoLnN1YnN0cigxKSA6IHBhdGg7XG59O1xuXG52YXIgaGFzQmFzZW5hbWUgPSBleHBvcnRzLmhhc0Jhc2VuYW1lID0gZnVuY3Rpb24gaGFzQmFzZW5hbWUocGF0aCwgcHJlZml4KSB7XG4gIHJldHVybiBuZXcgUmVnRXhwKCdeJyArIHByZWZpeCArICcoXFxcXC98XFxcXD98I3wkKScsICdpJykudGVzdChwYXRoKTtcbn07XG5cbnZhciBzdHJpcEJhc2VuYW1lID0gZXhwb3J0cy5zdHJpcEJhc2VuYW1lID0gZnVuY3Rpb24gc3RyaXBCYXNlbmFtZShwYXRoLCBwcmVmaXgpIHtcbiAgcmV0dXJuIGhhc0Jhc2VuYW1lKHBhdGgsIHByZWZpeCkgPyBwYXRoLnN1YnN0cihwcmVmaXgubGVuZ3RoKSA6IHBhdGg7XG59O1xuXG52YXIgc3RyaXBUcmFpbGluZ1NsYXNoID0gZXhwb3J0cy5zdHJpcFRyYWlsaW5nU2xhc2ggPSBmdW5jdGlvbiBzdHJpcFRyYWlsaW5nU2xhc2gocGF0aCkge1xuICByZXR1cm4gcGF0aC5jaGFyQXQocGF0aC5sZW5ndGggLSAxKSA9PT0gJy8nID8gcGF0aC5zbGljZSgwLCAtMSkgOiBwYXRoO1xufTtcblxudmFyIHBhcnNlUGF0aCA9IGV4cG9ydHMucGFyc2VQYXRoID0gZnVuY3Rpb24gcGFyc2VQYXRoKHBhdGgpIHtcbiAgdmFyIHBhdGhuYW1lID0gcGF0aCB8fCAnLyc7XG4gIHZhciBzZWFyY2ggPSAnJztcbiAgdmFyIGhhc2ggPSAnJztcblxuICB2YXIgaGFzaEluZGV4ID0gcGF0aG5hbWUuaW5kZXhPZignIycpO1xuICBpZiAoaGFzaEluZGV4ICE9PSAtMSkge1xuICAgIGhhc2ggPSBwYXRobmFtZS5zdWJzdHIoaGFzaEluZGV4KTtcbiAgICBwYXRobmFtZSA9IHBhdGhuYW1lLnN1YnN0cigwLCBoYXNoSW5kZXgpO1xuICB9XG5cbiAgdmFyIHNlYXJjaEluZGV4ID0gcGF0aG5hbWUuaW5kZXhPZignPycpO1xuICBpZiAoc2VhcmNoSW5kZXggIT09IC0xKSB7XG4gICAgc2VhcmNoID0gcGF0aG5hbWUuc3Vic3RyKHNlYXJjaEluZGV4KTtcbiAgICBwYXRobmFtZSA9IHBhdGhuYW1lLnN1YnN0cigwLCBzZWFyY2hJbmRleCk7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHBhdGhuYW1lOiBwYXRobmFtZSxcbiAgICBzZWFyY2g6IHNlYXJjaCA9PT0gJz8nID8gJycgOiBzZWFyY2gsXG4gICAgaGFzaDogaGFzaCA9PT0gJyMnID8gJycgOiBoYXNoXG4gIH07XG59O1xuXG52YXIgY3JlYXRlUGF0aCA9IGV4cG9ydHMuY3JlYXRlUGF0aCA9IGZ1bmN0aW9uIGNyZWF0ZVBhdGgobG9jYXRpb24pIHtcbiAgdmFyIHBhdGhuYW1lID0gbG9jYXRpb24ucGF0aG5hbWUsXG4gICAgICBzZWFyY2ggPSBsb2NhdGlvbi5zZWFyY2gsXG4gICAgICBoYXNoID0gbG9jYXRpb24uaGFzaDtcblxuXG4gIHZhciBwYXRoID0gcGF0aG5hbWUgfHwgJy8nO1xuXG4gIGlmIChzZWFyY2ggJiYgc2VhcmNoICE9PSAnPycpIHBhdGggKz0gc2VhcmNoLmNoYXJBdCgwKSA9PT0gJz8nID8gc2VhcmNoIDogJz8nICsgc2VhcmNoO1xuXG4gIGlmIChoYXNoICYmIGhhc2ggIT09ICcjJykgcGF0aCArPSBoYXNoLmNoYXJBdCgwKSA9PT0gJyMnID8gaGFzaCA6ICcjJyArIGhhc2g7XG5cbiAgcmV0dXJuIHBhdGg7XG59OyIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcblxudmFyIF90eXBlb2YgPSB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgdHlwZW9mIFN5bWJvbC5pdGVyYXRvciA9PT0gXCJzeW1ib2xcIiA/IGZ1bmN0aW9uIChvYmopIHsgcmV0dXJuIHR5cGVvZiBvYmo7IH0gOiBmdW5jdGlvbiAob2JqKSB7IHJldHVybiBvYmogJiYgdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIG9iai5jb25zdHJ1Y3RvciA9PT0gU3ltYm9sICYmIG9iaiAhPT0gU3ltYm9sLnByb3RvdHlwZSA/IFwic3ltYm9sXCIgOiB0eXBlb2Ygb2JqOyB9O1xuXG52YXIgX2V4dGVuZHMgPSBPYmplY3QuYXNzaWduIHx8IGZ1bmN0aW9uICh0YXJnZXQpIHsgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHsgdmFyIHNvdXJjZSA9IGFyZ3VtZW50c1tpXTsgZm9yICh2YXIga2V5IGluIHNvdXJjZSkgeyBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHNvdXJjZSwga2V5KSkgeyB0YXJnZXRba2V5XSA9IHNvdXJjZVtrZXldOyB9IH0gfSByZXR1cm4gdGFyZ2V0OyB9O1xuXG52YXIgX3dhcm5pbmcgPSByZXF1aXJlKCd3YXJuaW5nJyk7XG5cbnZhciBfd2FybmluZzIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF93YXJuaW5nKTtcblxudmFyIF9pbnZhcmlhbnQgPSByZXF1aXJlKCdpbnZhcmlhbnQnKTtcblxudmFyIF9pbnZhcmlhbnQyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfaW52YXJpYW50KTtcblxudmFyIF9Mb2NhdGlvblV0aWxzID0gcmVxdWlyZSgnLi9Mb2NhdGlvblV0aWxzJyk7XG5cbnZhciBfUGF0aFV0aWxzID0gcmVxdWlyZSgnLi9QYXRoVXRpbHMnKTtcblxudmFyIF9jcmVhdGVUcmFuc2l0aW9uTWFuYWdlciA9IHJlcXVpcmUoJy4vY3JlYXRlVHJhbnNpdGlvbk1hbmFnZXInKTtcblxudmFyIF9jcmVhdGVUcmFuc2l0aW9uTWFuYWdlcjIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9jcmVhdGVUcmFuc2l0aW9uTWFuYWdlcik7XG5cbnZhciBfRE9NVXRpbHMgPSByZXF1aXJlKCcuL0RPTVV0aWxzJyk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IGRlZmF1bHQ6IG9iaiB9OyB9XG5cbnZhciBQb3BTdGF0ZUV2ZW50ID0gJ3BvcHN0YXRlJztcbnZhciBIYXNoQ2hhbmdlRXZlbnQgPSAnaGFzaGNoYW5nZSc7XG5cbnZhciBnZXRIaXN0b3J5U3RhdGUgPSBmdW5jdGlvbiBnZXRIaXN0b3J5U3RhdGUoKSB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIHdpbmRvdy5oaXN0b3J5LnN0YXRlIHx8IHt9O1xuICB9IGNhdGNoIChlKSB7XG4gICAgLy8gSUUgMTEgc29tZXRpbWVzIHRocm93cyB3aGVuIGFjY2Vzc2luZyB3aW5kb3cuaGlzdG9yeS5zdGF0ZVxuICAgIC8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vUmVhY3RUcmFpbmluZy9oaXN0b3J5L3B1bGwvMjg5XG4gICAgcmV0dXJuIHt9O1xuICB9XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBoaXN0b3J5IG9iamVjdCB0aGF0IHVzZXMgdGhlIEhUTUw1IGhpc3RvcnkgQVBJIGluY2x1ZGluZ1xuICogcHVzaFN0YXRlLCByZXBsYWNlU3RhdGUsIGFuZCB0aGUgcG9wc3RhdGUgZXZlbnQuXG4gKi9cbnZhciBjcmVhdGVCcm93c2VySGlzdG9yeSA9IGZ1bmN0aW9uIGNyZWF0ZUJyb3dzZXJIaXN0b3J5KCkge1xuICB2YXIgcHJvcHMgPSBhcmd1bWVudHMubGVuZ3RoID4gMCAmJiBhcmd1bWVudHNbMF0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1swXSA6IHt9O1xuXG4gICgwLCBfaW52YXJpYW50Mi5kZWZhdWx0KShfRE9NVXRpbHMuY2FuVXNlRE9NLCAnQnJvd3NlciBoaXN0b3J5IG5lZWRzIGEgRE9NJyk7XG5cbiAgdmFyIGdsb2JhbEhpc3RvcnkgPSB3aW5kb3cuaGlzdG9yeTtcbiAgdmFyIGNhblVzZUhpc3RvcnkgPSAoMCwgX0RPTVV0aWxzLnN1cHBvcnRzSGlzdG9yeSkoKTtcbiAgdmFyIG5lZWRzSGFzaENoYW5nZUxpc3RlbmVyID0gISgwLCBfRE9NVXRpbHMuc3VwcG9ydHNQb3BTdGF0ZU9uSGFzaENoYW5nZSkoKTtcblxuICB2YXIgX3Byb3BzJGZvcmNlUmVmcmVzaCA9IHByb3BzLmZvcmNlUmVmcmVzaCxcbiAgICAgIGZvcmNlUmVmcmVzaCA9IF9wcm9wcyRmb3JjZVJlZnJlc2ggPT09IHVuZGVmaW5lZCA/IGZhbHNlIDogX3Byb3BzJGZvcmNlUmVmcmVzaCxcbiAgICAgIF9wcm9wcyRnZXRVc2VyQ29uZmlybSA9IHByb3BzLmdldFVzZXJDb25maXJtYXRpb24sXG4gICAgICBnZXRVc2VyQ29uZmlybWF0aW9uID0gX3Byb3BzJGdldFVzZXJDb25maXJtID09PSB1bmRlZmluZWQgPyBfRE9NVXRpbHMuZ2V0Q29uZmlybWF0aW9uIDogX3Byb3BzJGdldFVzZXJDb25maXJtLFxuICAgICAgX3Byb3BzJGtleUxlbmd0aCA9IHByb3BzLmtleUxlbmd0aCxcbiAgICAgIGtleUxlbmd0aCA9IF9wcm9wcyRrZXlMZW5ndGggPT09IHVuZGVmaW5lZCA/IDYgOiBfcHJvcHMka2V5TGVuZ3RoO1xuXG4gIHZhciBiYXNlbmFtZSA9IHByb3BzLmJhc2VuYW1lID8gKDAsIF9QYXRoVXRpbHMuc3RyaXBUcmFpbGluZ1NsYXNoKSgoMCwgX1BhdGhVdGlscy5hZGRMZWFkaW5nU2xhc2gpKHByb3BzLmJhc2VuYW1lKSkgOiAnJztcblxuICB2YXIgZ2V0RE9NTG9jYXRpb24gPSBmdW5jdGlvbiBnZXRET01Mb2NhdGlvbihoaXN0b3J5U3RhdGUpIHtcbiAgICB2YXIgX3JlZiA9IGhpc3RvcnlTdGF0ZSB8fCB7fSxcbiAgICAgICAga2V5ID0gX3JlZi5rZXksXG4gICAgICAgIHN0YXRlID0gX3JlZi5zdGF0ZTtcblxuICAgIHZhciBfd2luZG93JGxvY2F0aW9uID0gd2luZG93LmxvY2F0aW9uLFxuICAgICAgICBwYXRobmFtZSA9IF93aW5kb3ckbG9jYXRpb24ucGF0aG5hbWUsXG4gICAgICAgIHNlYXJjaCA9IF93aW5kb3ckbG9jYXRpb24uc2VhcmNoLFxuICAgICAgICBoYXNoID0gX3dpbmRvdyRsb2NhdGlvbi5oYXNoO1xuXG5cbiAgICB2YXIgcGF0aCA9IHBhdGhuYW1lICsgc2VhcmNoICsgaGFzaDtcblxuICAgICgwLCBfd2FybmluZzIuZGVmYXVsdCkoIWJhc2VuYW1lIHx8ICgwLCBfUGF0aFV0aWxzLmhhc0Jhc2VuYW1lKShwYXRoLCBiYXNlbmFtZSksICdZb3UgYXJlIGF0dGVtcHRpbmcgdG8gdXNlIGEgYmFzZW5hbWUgb24gYSBwYWdlIHdob3NlIFVSTCBwYXRoIGRvZXMgbm90IGJlZ2luICcgKyAnd2l0aCB0aGUgYmFzZW5hbWUuIEV4cGVjdGVkIHBhdGggXCInICsgcGF0aCArICdcIiB0byBiZWdpbiB3aXRoIFwiJyArIGJhc2VuYW1lICsgJ1wiLicpO1xuXG4gICAgaWYgKGJhc2VuYW1lKSBwYXRoID0gKDAsIF9QYXRoVXRpbHMuc3RyaXBCYXNlbmFtZSkocGF0aCwgYmFzZW5hbWUpO1xuXG4gICAgcmV0dXJuICgwLCBfTG9jYXRpb25VdGlscy5jcmVhdGVMb2NhdGlvbikocGF0aCwgc3RhdGUsIGtleSk7XG4gIH07XG5cbiAgdmFyIGNyZWF0ZUtleSA9IGZ1bmN0aW9uIGNyZWF0ZUtleSgpIHtcbiAgICByZXR1cm4gTWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc3Vic3RyKDIsIGtleUxlbmd0aCk7XG4gIH07XG5cbiAgdmFyIHRyYW5zaXRpb25NYW5hZ2VyID0gKDAsIF9jcmVhdGVUcmFuc2l0aW9uTWFuYWdlcjIuZGVmYXVsdCkoKTtcblxuICB2YXIgc2V0U3RhdGUgPSBmdW5jdGlvbiBzZXRTdGF0ZShuZXh0U3RhdGUpIHtcbiAgICBfZXh0ZW5kcyhoaXN0b3J5LCBuZXh0U3RhdGUpO1xuXG4gICAgaGlzdG9yeS5sZW5ndGggPSBnbG9iYWxIaXN0b3J5Lmxlbmd0aDtcblxuICAgIHRyYW5zaXRpb25NYW5hZ2VyLm5vdGlmeUxpc3RlbmVycyhoaXN0b3J5LmxvY2F0aW9uLCBoaXN0b3J5LmFjdGlvbik7XG4gIH07XG5cbiAgdmFyIGhhbmRsZVBvcFN0YXRlID0gZnVuY3Rpb24gaGFuZGxlUG9wU3RhdGUoZXZlbnQpIHtcbiAgICAvLyBJZ25vcmUgZXh0cmFuZW91cyBwb3BzdGF0ZSBldmVudHMgaW4gV2ViS2l0LlxuICAgIGlmICgoMCwgX0RPTVV0aWxzLmlzRXh0cmFuZW91c1BvcHN0YXRlRXZlbnQpKGV2ZW50KSkgcmV0dXJuO1xuXG4gICAgaGFuZGxlUG9wKGdldERPTUxvY2F0aW9uKGV2ZW50LnN0YXRlKSk7XG4gIH07XG5cbiAgdmFyIGhhbmRsZUhhc2hDaGFuZ2UgPSBmdW5jdGlvbiBoYW5kbGVIYXNoQ2hhbmdlKCkge1xuICAgIGhhbmRsZVBvcChnZXRET01Mb2NhdGlvbihnZXRIaXN0b3J5U3RhdGUoKSkpO1xuICB9O1xuXG4gIHZhciBmb3JjZU5leHRQb3AgPSBmYWxzZTtcblxuICB2YXIgaGFuZGxlUG9wID0gZnVuY3Rpb24gaGFuZGxlUG9wKGxvY2F0aW9uKSB7XG4gICAgaWYgKGZvcmNlTmV4dFBvcCkge1xuICAgICAgZm9yY2VOZXh0UG9wID0gZmFsc2U7XG4gICAgICBzZXRTdGF0ZSgpO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgYWN0aW9uID0gJ1BPUCc7XG5cbiAgICAgIHRyYW5zaXRpb25NYW5hZ2VyLmNvbmZpcm1UcmFuc2l0aW9uVG8obG9jYXRpb24sIGFjdGlvbiwgZ2V0VXNlckNvbmZpcm1hdGlvbiwgZnVuY3Rpb24gKG9rKSB7XG4gICAgICAgIGlmIChvaykge1xuICAgICAgICAgIHNldFN0YXRlKHsgYWN0aW9uOiBhY3Rpb24sIGxvY2F0aW9uOiBsb2NhdGlvbiB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXZlcnRQb3AobG9jYXRpb24pO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH07XG5cbiAgdmFyIHJldmVydFBvcCA9IGZ1bmN0aW9uIHJldmVydFBvcChmcm9tTG9jYXRpb24pIHtcbiAgICB2YXIgdG9Mb2NhdGlvbiA9IGhpc3RvcnkubG9jYXRpb247XG5cbiAgICAvLyBUT0RPOiBXZSBjb3VsZCBwcm9iYWJseSBtYWtlIHRoaXMgbW9yZSByZWxpYWJsZSBieVxuICAgIC8vIGtlZXBpbmcgYSBsaXN0IG9mIGtleXMgd2UndmUgc2VlbiBpbiBzZXNzaW9uU3RvcmFnZS5cbiAgICAvLyBJbnN0ZWFkLCB3ZSBqdXN0IGRlZmF1bHQgdG8gMCBmb3Iga2V5cyB3ZSBkb24ndCBrbm93LlxuXG4gICAgdmFyIHRvSW5kZXggPSBhbGxLZXlzLmluZGV4T2YodG9Mb2NhdGlvbi5rZXkpO1xuXG4gICAgaWYgKHRvSW5kZXggPT09IC0xKSB0b0luZGV4ID0gMDtcblxuICAgIHZhciBmcm9tSW5kZXggPSBhbGxLZXlzLmluZGV4T2YoZnJvbUxvY2F0aW9uLmtleSk7XG5cbiAgICBpZiAoZnJvbUluZGV4ID09PSAtMSkgZnJvbUluZGV4ID0gMDtcblxuICAgIHZhciBkZWx0YSA9IHRvSW5kZXggLSBmcm9tSW5kZXg7XG5cbiAgICBpZiAoZGVsdGEpIHtcbiAgICAgIGZvcmNlTmV4dFBvcCA9IHRydWU7XG4gICAgICBnbyhkZWx0YSk7XG4gICAgfVxuICB9O1xuXG4gIHZhciBpbml0aWFsTG9jYXRpb24gPSBnZXRET01Mb2NhdGlvbihnZXRIaXN0b3J5U3RhdGUoKSk7XG4gIHZhciBhbGxLZXlzID0gW2luaXRpYWxMb2NhdGlvbi5rZXldO1xuXG4gIC8vIFB1YmxpYyBpbnRlcmZhY2VcblxuICB2YXIgY3JlYXRlSHJlZiA9IGZ1bmN0aW9uIGNyZWF0ZUhyZWYobG9jYXRpb24pIHtcbiAgICByZXR1cm4gYmFzZW5hbWUgKyAoMCwgX1BhdGhVdGlscy5jcmVhdGVQYXRoKShsb2NhdGlvbik7XG4gIH07XG5cbiAgdmFyIHB1c2ggPSBmdW5jdGlvbiBwdXNoKHBhdGgsIHN0YXRlKSB7XG4gICAgKDAsIF93YXJuaW5nMi5kZWZhdWx0KSghKCh0eXBlb2YgcGF0aCA9PT0gJ3VuZGVmaW5lZCcgPyAndW5kZWZpbmVkJyA6IF90eXBlb2YocGF0aCkpID09PSAnb2JqZWN0JyAmJiBwYXRoLnN0YXRlICE9PSB1bmRlZmluZWQgJiYgc3RhdGUgIT09IHVuZGVmaW5lZCksICdZb3Ugc2hvdWxkIGF2b2lkIHByb3ZpZGluZyBhIDJuZCBzdGF0ZSBhcmd1bWVudCB0byBwdXNoIHdoZW4gdGhlIDFzdCAnICsgJ2FyZ3VtZW50IGlzIGEgbG9jYXRpb24tbGlrZSBvYmplY3QgdGhhdCBhbHJlYWR5IGhhcyBzdGF0ZTsgaXQgaXMgaWdub3JlZCcpO1xuXG4gICAgdmFyIGFjdGlvbiA9ICdQVVNIJztcbiAgICB2YXIgbG9jYXRpb24gPSAoMCwgX0xvY2F0aW9uVXRpbHMuY3JlYXRlTG9jYXRpb24pKHBhdGgsIHN0YXRlLCBjcmVhdGVLZXkoKSwgaGlzdG9yeS5sb2NhdGlvbik7XG5cbiAgICB0cmFuc2l0aW9uTWFuYWdlci5jb25maXJtVHJhbnNpdGlvblRvKGxvY2F0aW9uLCBhY3Rpb24sIGdldFVzZXJDb25maXJtYXRpb24sIGZ1bmN0aW9uIChvaykge1xuICAgICAgaWYgKCFvaykgcmV0dXJuO1xuXG4gICAgICB2YXIgaHJlZiA9IGNyZWF0ZUhyZWYobG9jYXRpb24pO1xuICAgICAgdmFyIGtleSA9IGxvY2F0aW9uLmtleSxcbiAgICAgICAgICBzdGF0ZSA9IGxvY2F0aW9uLnN0YXRlO1xuXG5cbiAgICAgIGlmIChjYW5Vc2VIaXN0b3J5KSB7XG4gICAgICAgIGdsb2JhbEhpc3RvcnkucHVzaFN0YXRlKHsga2V5OiBrZXksIHN0YXRlOiBzdGF0ZSB9LCBudWxsLCBocmVmKTtcblxuICAgICAgICBpZiAoZm9yY2VSZWZyZXNoKSB7XG4gICAgICAgICAgd2luZG93LmxvY2F0aW9uLmhyZWYgPSBocmVmO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhciBwcmV2SW5kZXggPSBhbGxLZXlzLmluZGV4T2YoaGlzdG9yeS5sb2NhdGlvbi5rZXkpO1xuICAgICAgICAgIHZhciBuZXh0S2V5cyA9IGFsbEtleXMuc2xpY2UoMCwgcHJldkluZGV4ID09PSAtMSA/IDAgOiBwcmV2SW5kZXggKyAxKTtcblxuICAgICAgICAgIG5leHRLZXlzLnB1c2gobG9jYXRpb24ua2V5KTtcbiAgICAgICAgICBhbGxLZXlzID0gbmV4dEtleXM7XG5cbiAgICAgICAgICBzZXRTdGF0ZSh7IGFjdGlvbjogYWN0aW9uLCBsb2NhdGlvbjogbG9jYXRpb24gfSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgICgwLCBfd2FybmluZzIuZGVmYXVsdCkoc3RhdGUgPT09IHVuZGVmaW5lZCwgJ0Jyb3dzZXIgaGlzdG9yeSBjYW5ub3QgcHVzaCBzdGF0ZSBpbiBicm93c2VycyB0aGF0IGRvIG5vdCBzdXBwb3J0IEhUTUw1IGhpc3RvcnknKTtcblxuICAgICAgICB3aW5kb3cubG9jYXRpb24uaHJlZiA9IGhyZWY7XG4gICAgICB9XG4gICAgfSk7XG4gIH07XG5cbiAgdmFyIHJlcGxhY2UgPSBmdW5jdGlvbiByZXBsYWNlKHBhdGgsIHN0YXRlKSB7XG4gICAgKDAsIF93YXJuaW5nMi5kZWZhdWx0KSghKCh0eXBlb2YgcGF0aCA9PT0gJ3VuZGVmaW5lZCcgPyAndW5kZWZpbmVkJyA6IF90eXBlb2YocGF0aCkpID09PSAnb2JqZWN0JyAmJiBwYXRoLnN0YXRlICE9PSB1bmRlZmluZWQgJiYgc3RhdGUgIT09IHVuZGVmaW5lZCksICdZb3Ugc2hvdWxkIGF2b2lkIHByb3ZpZGluZyBhIDJuZCBzdGF0ZSBhcmd1bWVudCB0byByZXBsYWNlIHdoZW4gdGhlIDFzdCAnICsgJ2FyZ3VtZW50IGlzIGEgbG9jYXRpb24tbGlrZSBvYmplY3QgdGhhdCBhbHJlYWR5IGhhcyBzdGF0ZTsgaXQgaXMgaWdub3JlZCcpO1xuXG4gICAgdmFyIGFjdGlvbiA9ICdSRVBMQUNFJztcbiAgICB2YXIgbG9jYXRpb24gPSAoMCwgX0xvY2F0aW9uVXRpbHMuY3JlYXRlTG9jYXRpb24pKHBhdGgsIHN0YXRlLCBjcmVhdGVLZXkoKSwgaGlzdG9yeS5sb2NhdGlvbik7XG5cbiAgICB0cmFuc2l0aW9uTWFuYWdlci5jb25maXJtVHJhbnNpdGlvblRvKGxvY2F0aW9uLCBhY3Rpb24sIGdldFVzZXJDb25maXJtYXRpb24sIGZ1bmN0aW9uIChvaykge1xuICAgICAgaWYgKCFvaykgcmV0dXJuO1xuXG4gICAgICB2YXIgaHJlZiA9IGNyZWF0ZUhyZWYobG9jYXRpb24pO1xuICAgICAgdmFyIGtleSA9IGxvY2F0aW9uLmtleSxcbiAgICAgICAgICBzdGF0ZSA9IGxvY2F0aW9uLnN0YXRlO1xuXG5cbiAgICAgIGlmIChjYW5Vc2VIaXN0b3J5KSB7XG4gICAgICAgIGdsb2JhbEhpc3RvcnkucmVwbGFjZVN0YXRlKHsga2V5OiBrZXksIHN0YXRlOiBzdGF0ZSB9LCBudWxsLCBocmVmKTtcblxuICAgICAgICBpZiAoZm9yY2VSZWZyZXNoKSB7XG4gICAgICAgICAgd2luZG93LmxvY2F0aW9uLnJlcGxhY2UoaHJlZik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFyIHByZXZJbmRleCA9IGFsbEtleXMuaW5kZXhPZihoaXN0b3J5LmxvY2F0aW9uLmtleSk7XG5cbiAgICAgICAgICBpZiAocHJldkluZGV4ICE9PSAtMSkgYWxsS2V5c1twcmV2SW5kZXhdID0gbG9jYXRpb24ua2V5O1xuXG4gICAgICAgICAgc2V0U3RhdGUoeyBhY3Rpb246IGFjdGlvbiwgbG9jYXRpb246IGxvY2F0aW9uIH0pO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAoMCwgX3dhcm5pbmcyLmRlZmF1bHQpKHN0YXRlID09PSB1bmRlZmluZWQsICdCcm93c2VyIGhpc3RvcnkgY2Fubm90IHJlcGxhY2Ugc3RhdGUgaW4gYnJvd3NlcnMgdGhhdCBkbyBub3Qgc3VwcG9ydCBIVE1MNSBoaXN0b3J5Jyk7XG5cbiAgICAgICAgd2luZG93LmxvY2F0aW9uLnJlcGxhY2UoaHJlZik7XG4gICAgICB9XG4gICAgfSk7XG4gIH07XG5cbiAgdmFyIGdvID0gZnVuY3Rpb24gZ28obikge1xuICAgIGdsb2JhbEhpc3RvcnkuZ28obik7XG4gIH07XG5cbiAgdmFyIGdvQmFjayA9IGZ1bmN0aW9uIGdvQmFjaygpIHtcbiAgICByZXR1cm4gZ28oLTEpO1xuICB9O1xuXG4gIHZhciBnb0ZvcndhcmQgPSBmdW5jdGlvbiBnb0ZvcndhcmQoKSB7XG4gICAgcmV0dXJuIGdvKDEpO1xuICB9O1xuXG4gIHZhciBsaXN0ZW5lckNvdW50ID0gMDtcblxuICB2YXIgY2hlY2tET01MaXN0ZW5lcnMgPSBmdW5jdGlvbiBjaGVja0RPTUxpc3RlbmVycyhkZWx0YSkge1xuICAgIGxpc3RlbmVyQ291bnQgKz0gZGVsdGE7XG5cbiAgICBpZiAobGlzdGVuZXJDb3VudCA9PT0gMSkge1xuICAgICAgKDAsIF9ET01VdGlscy5hZGRFdmVudExpc3RlbmVyKSh3aW5kb3csIFBvcFN0YXRlRXZlbnQsIGhhbmRsZVBvcFN0YXRlKTtcblxuICAgICAgaWYgKG5lZWRzSGFzaENoYW5nZUxpc3RlbmVyKSAoMCwgX0RPTVV0aWxzLmFkZEV2ZW50TGlzdGVuZXIpKHdpbmRvdywgSGFzaENoYW5nZUV2ZW50LCBoYW5kbGVIYXNoQ2hhbmdlKTtcbiAgICB9IGVsc2UgaWYgKGxpc3RlbmVyQ291bnQgPT09IDApIHtcbiAgICAgICgwLCBfRE9NVXRpbHMucmVtb3ZlRXZlbnRMaXN0ZW5lcikod2luZG93LCBQb3BTdGF0ZUV2ZW50LCBoYW5kbGVQb3BTdGF0ZSk7XG5cbiAgICAgIGlmIChuZWVkc0hhc2hDaGFuZ2VMaXN0ZW5lcikgKDAsIF9ET01VdGlscy5yZW1vdmVFdmVudExpc3RlbmVyKSh3aW5kb3csIEhhc2hDaGFuZ2VFdmVudCwgaGFuZGxlSGFzaENoYW5nZSk7XG4gICAgfVxuICB9O1xuXG4gIHZhciBpc0Jsb2NrZWQgPSBmYWxzZTtcblxuICB2YXIgYmxvY2sgPSBmdW5jdGlvbiBibG9jaygpIHtcbiAgICB2YXIgcHJvbXB0ID0gYXJndW1lbnRzLmxlbmd0aCA+IDAgJiYgYXJndW1lbnRzWzBdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMF0gOiBmYWxzZTtcblxuICAgIHZhciB1bmJsb2NrID0gdHJhbnNpdGlvbk1hbmFnZXIuc2V0UHJvbXB0KHByb21wdCk7XG5cbiAgICBpZiAoIWlzQmxvY2tlZCkge1xuICAgICAgY2hlY2tET01MaXN0ZW5lcnMoMSk7XG4gICAgICBpc0Jsb2NrZWQgPSB0cnVlO1xuICAgIH1cblxuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAoaXNCbG9ja2VkKSB7XG4gICAgICAgIGlzQmxvY2tlZCA9IGZhbHNlO1xuICAgICAgICBjaGVja0RPTUxpc3RlbmVycygtMSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB1bmJsb2NrKCk7XG4gICAgfTtcbiAgfTtcblxuICB2YXIgbGlzdGVuID0gZnVuY3Rpb24gbGlzdGVuKGxpc3RlbmVyKSB7XG4gICAgdmFyIHVubGlzdGVuID0gdHJhbnNpdGlvbk1hbmFnZXIuYXBwZW5kTGlzdGVuZXIobGlzdGVuZXIpO1xuICAgIGNoZWNrRE9NTGlzdGVuZXJzKDEpO1xuXG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgIGNoZWNrRE9NTGlzdGVuZXJzKC0xKTtcbiAgICAgIHVubGlzdGVuKCk7XG4gICAgfTtcbiAgfTtcblxuICB2YXIgaGlzdG9yeSA9IHtcbiAgICBsZW5ndGg6IGdsb2JhbEhpc3RvcnkubGVuZ3RoLFxuICAgIGFjdGlvbjogJ1BPUCcsXG4gICAgbG9jYXRpb246IGluaXRpYWxMb2NhdGlvbixcbiAgICBjcmVhdGVIcmVmOiBjcmVhdGVIcmVmLFxuICAgIHB1c2g6IHB1c2gsXG4gICAgcmVwbGFjZTogcmVwbGFjZSxcbiAgICBnbzogZ28sXG4gICAgZ29CYWNrOiBnb0JhY2ssXG4gICAgZ29Gb3J3YXJkOiBnb0ZvcndhcmQsXG4gICAgYmxvY2s6IGJsb2NrLFxuICAgIGxpc3RlbjogbGlzdGVuXG4gIH07XG5cbiAgcmV0dXJuIGhpc3Rvcnk7XG59O1xuXG5leHBvcnRzLmRlZmF1bHQgPSBjcmVhdGVCcm93c2VySGlzdG9yeTsiLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5cbnZhciBfZXh0ZW5kcyA9IE9iamVjdC5hc3NpZ24gfHwgZnVuY3Rpb24gKHRhcmdldCkgeyBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykgeyB2YXIgc291cmNlID0gYXJndW1lbnRzW2ldOyBmb3IgKHZhciBrZXkgaW4gc291cmNlKSB7IGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoc291cmNlLCBrZXkpKSB7IHRhcmdldFtrZXldID0gc291cmNlW2tleV07IH0gfSB9IHJldHVybiB0YXJnZXQ7IH07XG5cbnZhciBfd2FybmluZyA9IHJlcXVpcmUoJ3dhcm5pbmcnKTtcblxudmFyIF93YXJuaW5nMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3dhcm5pbmcpO1xuXG52YXIgX2ludmFyaWFudCA9IHJlcXVpcmUoJ2ludmFyaWFudCcpO1xuXG52YXIgX2ludmFyaWFudDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9pbnZhcmlhbnQpO1xuXG52YXIgX0xvY2F0aW9uVXRpbHMgPSByZXF1aXJlKCcuL0xvY2F0aW9uVXRpbHMnKTtcblxudmFyIF9QYXRoVXRpbHMgPSByZXF1aXJlKCcuL1BhdGhVdGlscycpO1xuXG52YXIgX2NyZWF0ZVRyYW5zaXRpb25NYW5hZ2VyID0gcmVxdWlyZSgnLi9jcmVhdGVUcmFuc2l0aW9uTWFuYWdlcicpO1xuXG52YXIgX2NyZWF0ZVRyYW5zaXRpb25NYW5hZ2VyMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX2NyZWF0ZVRyYW5zaXRpb25NYW5hZ2VyKTtcblxudmFyIF9ET01VdGlscyA9IHJlcXVpcmUoJy4vRE9NVXRpbHMnKTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgZGVmYXVsdDogb2JqIH07IH1cblxudmFyIEhhc2hDaGFuZ2VFdmVudCA9ICdoYXNoY2hhbmdlJztcblxudmFyIEhhc2hQYXRoQ29kZXJzID0ge1xuICBoYXNoYmFuZzoge1xuICAgIGVuY29kZVBhdGg6IGZ1bmN0aW9uIGVuY29kZVBhdGgocGF0aCkge1xuICAgICAgcmV0dXJuIHBhdGguY2hhckF0KDApID09PSAnIScgPyBwYXRoIDogJyEvJyArICgwLCBfUGF0aFV0aWxzLnN0cmlwTGVhZGluZ1NsYXNoKShwYXRoKTtcbiAgICB9LFxuICAgIGRlY29kZVBhdGg6IGZ1bmN0aW9uIGRlY29kZVBhdGgocGF0aCkge1xuICAgICAgcmV0dXJuIHBhdGguY2hhckF0KDApID09PSAnIScgPyBwYXRoLnN1YnN0cigxKSA6IHBhdGg7XG4gICAgfVxuICB9LFxuICBub3NsYXNoOiB7XG4gICAgZW5jb2RlUGF0aDogX1BhdGhVdGlscy5zdHJpcExlYWRpbmdTbGFzaCxcbiAgICBkZWNvZGVQYXRoOiBfUGF0aFV0aWxzLmFkZExlYWRpbmdTbGFzaFxuICB9LFxuICBzbGFzaDoge1xuICAgIGVuY29kZVBhdGg6IF9QYXRoVXRpbHMuYWRkTGVhZGluZ1NsYXNoLFxuICAgIGRlY29kZVBhdGg6IF9QYXRoVXRpbHMuYWRkTGVhZGluZ1NsYXNoXG4gIH1cbn07XG5cbnZhciBnZXRIYXNoUGF0aCA9IGZ1bmN0aW9uIGdldEhhc2hQYXRoKCkge1xuICAvLyBXZSBjYW4ndCB1c2Ugd2luZG93LmxvY2F0aW9uLmhhc2ggaGVyZSBiZWNhdXNlIGl0J3Mgbm90XG4gIC8vIGNvbnNpc3RlbnQgYWNyb3NzIGJyb3dzZXJzIC0gRmlyZWZveCB3aWxsIHByZS1kZWNvZGUgaXQhXG4gIHZhciBocmVmID0gd2luZG93LmxvY2F0aW9uLmhyZWY7XG4gIHZhciBoYXNoSW5kZXggPSBocmVmLmluZGV4T2YoJyMnKTtcbiAgcmV0dXJuIGhhc2hJbmRleCA9PT0gLTEgPyAnJyA6IGhyZWYuc3Vic3RyaW5nKGhhc2hJbmRleCArIDEpO1xufTtcblxudmFyIHB1c2hIYXNoUGF0aCA9IGZ1bmN0aW9uIHB1c2hIYXNoUGF0aChwYXRoKSB7XG4gIHJldHVybiB3aW5kb3cubG9jYXRpb24uaGFzaCA9IHBhdGg7XG59O1xuXG52YXIgcmVwbGFjZUhhc2hQYXRoID0gZnVuY3Rpb24gcmVwbGFjZUhhc2hQYXRoKHBhdGgpIHtcbiAgdmFyIGhhc2hJbmRleCA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmLmluZGV4T2YoJyMnKTtcblxuICB3aW5kb3cubG9jYXRpb24ucmVwbGFjZSh3aW5kb3cubG9jYXRpb24uaHJlZi5zbGljZSgwLCBoYXNoSW5kZXggPj0gMCA/IGhhc2hJbmRleCA6IDApICsgJyMnICsgcGF0aCk7XG59O1xuXG52YXIgY3JlYXRlSGFzaEhpc3RvcnkgPSBmdW5jdGlvbiBjcmVhdGVIYXNoSGlzdG9yeSgpIHtcbiAgdmFyIHByb3BzID0gYXJndW1lbnRzLmxlbmd0aCA+IDAgJiYgYXJndW1lbnRzWzBdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMF0gOiB7fTtcblxuICAoMCwgX2ludmFyaWFudDIuZGVmYXVsdCkoX0RPTVV0aWxzLmNhblVzZURPTSwgJ0hhc2ggaGlzdG9yeSBuZWVkcyBhIERPTScpO1xuXG4gIHZhciBnbG9iYWxIaXN0b3J5ID0gd2luZG93Lmhpc3Rvcnk7XG4gIHZhciBjYW5Hb1dpdGhvdXRSZWxvYWQgPSAoMCwgX0RPTVV0aWxzLnN1cHBvcnRzR29XaXRob3V0UmVsb2FkVXNpbmdIYXNoKSgpO1xuXG4gIHZhciBfcHJvcHMkZ2V0VXNlckNvbmZpcm0gPSBwcm9wcy5nZXRVc2VyQ29uZmlybWF0aW9uLFxuICAgICAgZ2V0VXNlckNvbmZpcm1hdGlvbiA9IF9wcm9wcyRnZXRVc2VyQ29uZmlybSA9PT0gdW5kZWZpbmVkID8gX0RPTVV0aWxzLmdldENvbmZpcm1hdGlvbiA6IF9wcm9wcyRnZXRVc2VyQ29uZmlybSxcbiAgICAgIF9wcm9wcyRoYXNoVHlwZSA9IHByb3BzLmhhc2hUeXBlLFxuICAgICAgaGFzaFR5cGUgPSBfcHJvcHMkaGFzaFR5cGUgPT09IHVuZGVmaW5lZCA/ICdzbGFzaCcgOiBfcHJvcHMkaGFzaFR5cGU7XG5cbiAgdmFyIGJhc2VuYW1lID0gcHJvcHMuYmFzZW5hbWUgPyAoMCwgX1BhdGhVdGlscy5zdHJpcFRyYWlsaW5nU2xhc2gpKCgwLCBfUGF0aFV0aWxzLmFkZExlYWRpbmdTbGFzaCkocHJvcHMuYmFzZW5hbWUpKSA6ICcnO1xuXG4gIHZhciBfSGFzaFBhdGhDb2RlcnMkaGFzaFQgPSBIYXNoUGF0aENvZGVyc1toYXNoVHlwZV0sXG4gICAgICBlbmNvZGVQYXRoID0gX0hhc2hQYXRoQ29kZXJzJGhhc2hULmVuY29kZVBhdGgsXG4gICAgICBkZWNvZGVQYXRoID0gX0hhc2hQYXRoQ29kZXJzJGhhc2hULmRlY29kZVBhdGg7XG5cblxuICB2YXIgZ2V0RE9NTG9jYXRpb24gPSBmdW5jdGlvbiBnZXRET01Mb2NhdGlvbigpIHtcbiAgICB2YXIgcGF0aCA9IGRlY29kZVBhdGgoZ2V0SGFzaFBhdGgoKSk7XG5cbiAgICAoMCwgX3dhcm5pbmcyLmRlZmF1bHQpKCFiYXNlbmFtZSB8fCAoMCwgX1BhdGhVdGlscy5oYXNCYXNlbmFtZSkocGF0aCwgYmFzZW5hbWUpLCAnWW91IGFyZSBhdHRlbXB0aW5nIHRvIHVzZSBhIGJhc2VuYW1lIG9uIGEgcGFnZSB3aG9zZSBVUkwgcGF0aCBkb2VzIG5vdCBiZWdpbiAnICsgJ3dpdGggdGhlIGJhc2VuYW1lLiBFeHBlY3RlZCBwYXRoIFwiJyArIHBhdGggKyAnXCIgdG8gYmVnaW4gd2l0aCBcIicgKyBiYXNlbmFtZSArICdcIi4nKTtcblxuICAgIGlmIChiYXNlbmFtZSkgcGF0aCA9ICgwLCBfUGF0aFV0aWxzLnN0cmlwQmFzZW5hbWUpKHBhdGgsIGJhc2VuYW1lKTtcblxuICAgIHJldHVybiAoMCwgX0xvY2F0aW9uVXRpbHMuY3JlYXRlTG9jYXRpb24pKHBhdGgpO1xuICB9O1xuXG4gIHZhciB0cmFuc2l0aW9uTWFuYWdlciA9ICgwLCBfY3JlYXRlVHJhbnNpdGlvbk1hbmFnZXIyLmRlZmF1bHQpKCk7XG5cbiAgdmFyIHNldFN0YXRlID0gZnVuY3Rpb24gc2V0U3RhdGUobmV4dFN0YXRlKSB7XG4gICAgX2V4dGVuZHMoaGlzdG9yeSwgbmV4dFN0YXRlKTtcblxuICAgIGhpc3RvcnkubGVuZ3RoID0gZ2xvYmFsSGlzdG9yeS5sZW5ndGg7XG5cbiAgICB0cmFuc2l0aW9uTWFuYWdlci5ub3RpZnlMaXN0ZW5lcnMoaGlzdG9yeS5sb2NhdGlvbiwgaGlzdG9yeS5hY3Rpb24pO1xuICB9O1xuXG4gIHZhciBmb3JjZU5leHRQb3AgPSBmYWxzZTtcbiAgdmFyIGlnbm9yZVBhdGggPSBudWxsO1xuXG4gIHZhciBoYW5kbGVIYXNoQ2hhbmdlID0gZnVuY3Rpb24gaGFuZGxlSGFzaENoYW5nZSgpIHtcbiAgICB2YXIgcGF0aCA9IGdldEhhc2hQYXRoKCk7XG4gICAgdmFyIGVuY29kZWRQYXRoID0gZW5jb2RlUGF0aChwYXRoKTtcblxuICAgIGlmIChwYXRoICE9PSBlbmNvZGVkUGF0aCkge1xuICAgICAgLy8gRW5zdXJlIHdlIGFsd2F5cyBoYXZlIGEgcHJvcGVybHktZW5jb2RlZCBoYXNoLlxuICAgICAgcmVwbGFjZUhhc2hQYXRoKGVuY29kZWRQYXRoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGxvY2F0aW9uID0gZ2V0RE9NTG9jYXRpb24oKTtcbiAgICAgIHZhciBwcmV2TG9jYXRpb24gPSBoaXN0b3J5LmxvY2F0aW9uO1xuXG4gICAgICBpZiAoIWZvcmNlTmV4dFBvcCAmJiAoMCwgX0xvY2F0aW9uVXRpbHMubG9jYXRpb25zQXJlRXF1YWwpKHByZXZMb2NhdGlvbiwgbG9jYXRpb24pKSByZXR1cm47IC8vIEEgaGFzaGNoYW5nZSBkb2Vzbid0IGFsd2F5cyA9PSBsb2NhdGlvbiBjaGFuZ2UuXG5cbiAgICAgIGlmIChpZ25vcmVQYXRoID09PSAoMCwgX1BhdGhVdGlscy5jcmVhdGVQYXRoKShsb2NhdGlvbikpIHJldHVybjsgLy8gSWdub3JlIHRoaXMgY2hhbmdlOyB3ZSBhbHJlYWR5IHNldFN0YXRlIGluIHB1c2gvcmVwbGFjZS5cblxuICAgICAgaWdub3JlUGF0aCA9IG51bGw7XG5cbiAgICAgIGhhbmRsZVBvcChsb2NhdGlvbik7XG4gICAgfVxuICB9O1xuXG4gIHZhciBoYW5kbGVQb3AgPSBmdW5jdGlvbiBoYW5kbGVQb3AobG9jYXRpb24pIHtcbiAgICBpZiAoZm9yY2VOZXh0UG9wKSB7XG4gICAgICBmb3JjZU5leHRQb3AgPSBmYWxzZTtcbiAgICAgIHNldFN0YXRlKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBhY3Rpb24gPSAnUE9QJztcblxuICAgICAgdHJhbnNpdGlvbk1hbmFnZXIuY29uZmlybVRyYW5zaXRpb25Ubyhsb2NhdGlvbiwgYWN0aW9uLCBnZXRVc2VyQ29uZmlybWF0aW9uLCBmdW5jdGlvbiAob2spIHtcbiAgICAgICAgaWYgKG9rKSB7XG4gICAgICAgICAgc2V0U3RhdGUoeyBhY3Rpb246IGFjdGlvbiwgbG9jYXRpb246IGxvY2F0aW9uIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldmVydFBvcChsb2NhdGlvbik7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfTtcblxuICB2YXIgcmV2ZXJ0UG9wID0gZnVuY3Rpb24gcmV2ZXJ0UG9wKGZyb21Mb2NhdGlvbikge1xuICAgIHZhciB0b0xvY2F0aW9uID0gaGlzdG9yeS5sb2NhdGlvbjtcblxuICAgIC8vIFRPRE86IFdlIGNvdWxkIHByb2JhYmx5IG1ha2UgdGhpcyBtb3JlIHJlbGlhYmxlIGJ5XG4gICAgLy8ga2VlcGluZyBhIGxpc3Qgb2YgcGF0aHMgd2UndmUgc2VlbiBpbiBzZXNzaW9uU3RvcmFnZS5cbiAgICAvLyBJbnN0ZWFkLCB3ZSBqdXN0IGRlZmF1bHQgdG8gMCBmb3IgcGF0aHMgd2UgZG9uJ3Qga25vdy5cblxuICAgIHZhciB0b0luZGV4ID0gYWxsUGF0aHMubGFzdEluZGV4T2YoKDAsIF9QYXRoVXRpbHMuY3JlYXRlUGF0aCkodG9Mb2NhdGlvbikpO1xuXG4gICAgaWYgKHRvSW5kZXggPT09IC0xKSB0b0luZGV4ID0gMDtcblxuICAgIHZhciBmcm9tSW5kZXggPSBhbGxQYXRocy5sYXN0SW5kZXhPZigoMCwgX1BhdGhVdGlscy5jcmVhdGVQYXRoKShmcm9tTG9jYXRpb24pKTtcblxuICAgIGlmIChmcm9tSW5kZXggPT09IC0xKSBmcm9tSW5kZXggPSAwO1xuXG4gICAgdmFyIGRlbHRhID0gdG9JbmRleCAtIGZyb21JbmRleDtcblxuICAgIGlmIChkZWx0YSkge1xuICAgICAgZm9yY2VOZXh0UG9wID0gdHJ1ZTtcbiAgICAgIGdvKGRlbHRhKTtcbiAgICB9XG4gIH07XG5cbiAgLy8gRW5zdXJlIHRoZSBoYXNoIGlzIGVuY29kZWQgcHJvcGVybHkgYmVmb3JlIGRvaW5nIGFueXRoaW5nIGVsc2UuXG4gIHZhciBwYXRoID0gZ2V0SGFzaFBhdGgoKTtcbiAgdmFyIGVuY29kZWRQYXRoID0gZW5jb2RlUGF0aChwYXRoKTtcblxuICBpZiAocGF0aCAhPT0gZW5jb2RlZFBhdGgpIHJlcGxhY2VIYXNoUGF0aChlbmNvZGVkUGF0aCk7XG5cbiAgdmFyIGluaXRpYWxMb2NhdGlvbiA9IGdldERPTUxvY2F0aW9uKCk7XG4gIHZhciBhbGxQYXRocyA9IFsoMCwgX1BhdGhVdGlscy5jcmVhdGVQYXRoKShpbml0aWFsTG9jYXRpb24pXTtcblxuICAvLyBQdWJsaWMgaW50ZXJmYWNlXG5cbiAgdmFyIGNyZWF0ZUhyZWYgPSBmdW5jdGlvbiBjcmVhdGVIcmVmKGxvY2F0aW9uKSB7XG4gICAgcmV0dXJuICcjJyArIGVuY29kZVBhdGgoYmFzZW5hbWUgKyAoMCwgX1BhdGhVdGlscy5jcmVhdGVQYXRoKShsb2NhdGlvbikpO1xuICB9O1xuXG4gIHZhciBwdXNoID0gZnVuY3Rpb24gcHVzaChwYXRoLCBzdGF0ZSkge1xuICAgICgwLCBfd2FybmluZzIuZGVmYXVsdCkoc3RhdGUgPT09IHVuZGVmaW5lZCwgJ0hhc2ggaGlzdG9yeSBjYW5ub3QgcHVzaCBzdGF0ZTsgaXQgaXMgaWdub3JlZCcpO1xuXG4gICAgdmFyIGFjdGlvbiA9ICdQVVNIJztcbiAgICB2YXIgbG9jYXRpb24gPSAoMCwgX0xvY2F0aW9uVXRpbHMuY3JlYXRlTG9jYXRpb24pKHBhdGgsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCBoaXN0b3J5LmxvY2F0aW9uKTtcblxuICAgIHRyYW5zaXRpb25NYW5hZ2VyLmNvbmZpcm1UcmFuc2l0aW9uVG8obG9jYXRpb24sIGFjdGlvbiwgZ2V0VXNlckNvbmZpcm1hdGlvbiwgZnVuY3Rpb24gKG9rKSB7XG4gICAgICBpZiAoIW9rKSByZXR1cm47XG5cbiAgICAgIHZhciBwYXRoID0gKDAsIF9QYXRoVXRpbHMuY3JlYXRlUGF0aCkobG9jYXRpb24pO1xuICAgICAgdmFyIGVuY29kZWRQYXRoID0gZW5jb2RlUGF0aChiYXNlbmFtZSArIHBhdGgpO1xuICAgICAgdmFyIGhhc2hDaGFuZ2VkID0gZ2V0SGFzaFBhdGgoKSAhPT0gZW5jb2RlZFBhdGg7XG5cbiAgICAgIGlmIChoYXNoQ2hhbmdlZCkge1xuICAgICAgICAvLyBXZSBjYW5ub3QgdGVsbCBpZiBhIGhhc2hjaGFuZ2Ugd2FzIGNhdXNlZCBieSBhIFBVU0gsIHNvIHdlJ2RcbiAgICAgICAgLy8gcmF0aGVyIHNldFN0YXRlIGhlcmUgYW5kIGlnbm9yZSB0aGUgaGFzaGNoYW5nZS4gVGhlIGNhdmVhdCBoZXJlXG4gICAgICAgIC8vIGlzIHRoYXQgb3RoZXIgaGFzaCBoaXN0b3JpZXMgaW4gdGhlIHBhZ2Ugd2lsbCBjb25zaWRlciBpdCBhIFBPUC5cbiAgICAgICAgaWdub3JlUGF0aCA9IHBhdGg7XG4gICAgICAgIHB1c2hIYXNoUGF0aChlbmNvZGVkUGF0aCk7XG5cbiAgICAgICAgdmFyIHByZXZJbmRleCA9IGFsbFBhdGhzLmxhc3RJbmRleE9mKCgwLCBfUGF0aFV0aWxzLmNyZWF0ZVBhdGgpKGhpc3RvcnkubG9jYXRpb24pKTtcbiAgICAgICAgdmFyIG5leHRQYXRocyA9IGFsbFBhdGhzLnNsaWNlKDAsIHByZXZJbmRleCA9PT0gLTEgPyAwIDogcHJldkluZGV4ICsgMSk7XG5cbiAgICAgICAgbmV4dFBhdGhzLnB1c2gocGF0aCk7XG4gICAgICAgIGFsbFBhdGhzID0gbmV4dFBhdGhzO1xuXG4gICAgICAgIHNldFN0YXRlKHsgYWN0aW9uOiBhY3Rpb24sIGxvY2F0aW9uOiBsb2NhdGlvbiB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgICgwLCBfd2FybmluZzIuZGVmYXVsdCkoZmFsc2UsICdIYXNoIGhpc3RvcnkgY2Fubm90IFBVU0ggdGhlIHNhbWUgcGF0aDsgYSBuZXcgZW50cnkgd2lsbCBub3QgYmUgYWRkZWQgdG8gdGhlIGhpc3Rvcnkgc3RhY2snKTtcblxuICAgICAgICBzZXRTdGF0ZSgpO1xuICAgICAgfVxuICAgIH0pO1xuICB9O1xuXG4gIHZhciByZXBsYWNlID0gZnVuY3Rpb24gcmVwbGFjZShwYXRoLCBzdGF0ZSkge1xuICAgICgwLCBfd2FybmluZzIuZGVmYXVsdCkoc3RhdGUgPT09IHVuZGVmaW5lZCwgJ0hhc2ggaGlzdG9yeSBjYW5ub3QgcmVwbGFjZSBzdGF0ZTsgaXQgaXMgaWdub3JlZCcpO1xuXG4gICAgdmFyIGFjdGlvbiA9ICdSRVBMQUNFJztcbiAgICB2YXIgbG9jYXRpb24gPSAoMCwgX0xvY2F0aW9uVXRpbHMuY3JlYXRlTG9jYXRpb24pKHBhdGgsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCBoaXN0b3J5LmxvY2F0aW9uKTtcblxuICAgIHRyYW5zaXRpb25NYW5hZ2VyLmNvbmZpcm1UcmFuc2l0aW9uVG8obG9jYXRpb24sIGFjdGlvbiwgZ2V0VXNlckNvbmZpcm1hdGlvbiwgZnVuY3Rpb24gKG9rKSB7XG4gICAgICBpZiAoIW9rKSByZXR1cm47XG5cbiAgICAgIHZhciBwYXRoID0gKDAsIF9QYXRoVXRpbHMuY3JlYXRlUGF0aCkobG9jYXRpb24pO1xuICAgICAgdmFyIGVuY29kZWRQYXRoID0gZW5jb2RlUGF0aChiYXNlbmFtZSArIHBhdGgpO1xuICAgICAgdmFyIGhhc2hDaGFuZ2VkID0gZ2V0SGFzaFBhdGgoKSAhPT0gZW5jb2RlZFBhdGg7XG5cbiAgICAgIGlmIChoYXNoQ2hhbmdlZCkge1xuICAgICAgICAvLyBXZSBjYW5ub3QgdGVsbCBpZiBhIGhhc2hjaGFuZ2Ugd2FzIGNhdXNlZCBieSBhIFJFUExBQ0UsIHNvIHdlJ2RcbiAgICAgICAgLy8gcmF0aGVyIHNldFN0YXRlIGhlcmUgYW5kIGlnbm9yZSB0aGUgaGFzaGNoYW5nZS4gVGhlIGNhdmVhdCBoZXJlXG4gICAgICAgIC8vIGlzIHRoYXQgb3RoZXIgaGFzaCBoaXN0b3JpZXMgaW4gdGhlIHBhZ2Ugd2lsbCBjb25zaWRlciBpdCBhIFBPUC5cbiAgICAgICAgaWdub3JlUGF0aCA9IHBhdGg7XG4gICAgICAgIHJlcGxhY2VIYXNoUGF0aChlbmNvZGVkUGF0aCk7XG4gICAgICB9XG5cbiAgICAgIHZhciBwcmV2SW5kZXggPSBhbGxQYXRocy5pbmRleE9mKCgwLCBfUGF0aFV0aWxzLmNyZWF0ZVBhdGgpKGhpc3RvcnkubG9jYXRpb24pKTtcblxuICAgICAgaWYgKHByZXZJbmRleCAhPT0gLTEpIGFsbFBhdGhzW3ByZXZJbmRleF0gPSBwYXRoO1xuXG4gICAgICBzZXRTdGF0ZSh7IGFjdGlvbjogYWN0aW9uLCBsb2NhdGlvbjogbG9jYXRpb24gfSk7XG4gICAgfSk7XG4gIH07XG5cbiAgdmFyIGdvID0gZnVuY3Rpb24gZ28obikge1xuICAgICgwLCBfd2FybmluZzIuZGVmYXVsdCkoY2FuR29XaXRob3V0UmVsb2FkLCAnSGFzaCBoaXN0b3J5IGdvKG4pIGNhdXNlcyBhIGZ1bGwgcGFnZSByZWxvYWQgaW4gdGhpcyBicm93c2VyJyk7XG5cbiAgICBnbG9iYWxIaXN0b3J5LmdvKG4pO1xuICB9O1xuXG4gIHZhciBnb0JhY2sgPSBmdW5jdGlvbiBnb0JhY2soKSB7XG4gICAgcmV0dXJuIGdvKC0xKTtcbiAgfTtcblxuICB2YXIgZ29Gb3J3YXJkID0gZnVuY3Rpb24gZ29Gb3J3YXJkKCkge1xuICAgIHJldHVybiBnbygxKTtcbiAgfTtcblxuICB2YXIgbGlzdGVuZXJDb3VudCA9IDA7XG5cbiAgdmFyIGNoZWNrRE9NTGlzdGVuZXJzID0gZnVuY3Rpb24gY2hlY2tET01MaXN0ZW5lcnMoZGVsdGEpIHtcbiAgICBsaXN0ZW5lckNvdW50ICs9IGRlbHRhO1xuXG4gICAgaWYgKGxpc3RlbmVyQ291bnQgPT09IDEpIHtcbiAgICAgICgwLCBfRE9NVXRpbHMuYWRkRXZlbnRMaXN0ZW5lcikod2luZG93LCBIYXNoQ2hhbmdlRXZlbnQsIGhhbmRsZUhhc2hDaGFuZ2UpO1xuICAgIH0gZWxzZSBpZiAobGlzdGVuZXJDb3VudCA9PT0gMCkge1xuICAgICAgKDAsIF9ET01VdGlscy5yZW1vdmVFdmVudExpc3RlbmVyKSh3aW5kb3csIEhhc2hDaGFuZ2VFdmVudCwgaGFuZGxlSGFzaENoYW5nZSk7XG4gICAgfVxuICB9O1xuXG4gIHZhciBpc0Jsb2NrZWQgPSBmYWxzZTtcblxuICB2YXIgYmxvY2sgPSBmdW5jdGlvbiBibG9jaygpIHtcbiAgICB2YXIgcHJvbXB0ID0gYXJndW1lbnRzLmxlbmd0aCA+IDAgJiYgYXJndW1lbnRzWzBdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMF0gOiBmYWxzZTtcblxuICAgIHZhciB1bmJsb2NrID0gdHJhbnNpdGlvbk1hbmFnZXIuc2V0UHJvbXB0KHByb21wdCk7XG5cbiAgICBpZiAoIWlzQmxvY2tlZCkge1xuICAgICAgY2hlY2tET01MaXN0ZW5lcnMoMSk7XG4gICAgICBpc0Jsb2NrZWQgPSB0cnVlO1xuICAgIH1cblxuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAoaXNCbG9ja2VkKSB7XG4gICAgICAgIGlzQmxvY2tlZCA9IGZhbHNlO1xuICAgICAgICBjaGVja0RPTUxpc3RlbmVycygtMSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB1bmJsb2NrKCk7XG4gICAgfTtcbiAgfTtcblxuICB2YXIgbGlzdGVuID0gZnVuY3Rpb24gbGlzdGVuKGxpc3RlbmVyKSB7XG4gICAgdmFyIHVubGlzdGVuID0gdHJhbnNpdGlvbk1hbmFnZXIuYXBwZW5kTGlzdGVuZXIobGlzdGVuZXIpO1xuICAgIGNoZWNrRE9NTGlzdGVuZXJzKDEpO1xuXG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgIGNoZWNrRE9NTGlzdGVuZXJzKC0xKTtcbiAgICAgIHVubGlzdGVuKCk7XG4gICAgfTtcbiAgfTtcblxuICB2YXIgaGlzdG9yeSA9IHtcbiAgICBsZW5ndGg6IGdsb2JhbEhpc3RvcnkubGVuZ3RoLFxuICAgIGFjdGlvbjogJ1BPUCcsXG4gICAgbG9jYXRpb246IGluaXRpYWxMb2NhdGlvbixcbiAgICBjcmVhdGVIcmVmOiBjcmVhdGVIcmVmLFxuICAgIHB1c2g6IHB1c2gsXG4gICAgcmVwbGFjZTogcmVwbGFjZSxcbiAgICBnbzogZ28sXG4gICAgZ29CYWNrOiBnb0JhY2ssXG4gICAgZ29Gb3J3YXJkOiBnb0ZvcndhcmQsXG4gICAgYmxvY2s6IGJsb2NrLFxuICAgIGxpc3RlbjogbGlzdGVuXG4gIH07XG5cbiAgcmV0dXJuIGhpc3Rvcnk7XG59O1xuXG5leHBvcnRzLmRlZmF1bHQgPSBjcmVhdGVIYXNoSGlzdG9yeTsiLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5cbnZhciBfdHlwZW9mID0gdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIHR5cGVvZiBTeW1ib2wuaXRlcmF0b3IgPT09IFwic3ltYm9sXCIgPyBmdW5jdGlvbiAob2JqKSB7IHJldHVybiB0eXBlb2Ygb2JqOyB9IDogZnVuY3Rpb24gKG9iaikgeyByZXR1cm4gb2JqICYmIHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiBvYmouY29uc3RydWN0b3IgPT09IFN5bWJvbCAmJiBvYmogIT09IFN5bWJvbC5wcm90b3R5cGUgPyBcInN5bWJvbFwiIDogdHlwZW9mIG9iajsgfTtcblxudmFyIF9leHRlbmRzID0gT2JqZWN0LmFzc2lnbiB8fCBmdW5jdGlvbiAodGFyZ2V0KSB7IGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7IHZhciBzb3VyY2UgPSBhcmd1bWVudHNbaV07IGZvciAodmFyIGtleSBpbiBzb3VyY2UpIHsgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzb3VyY2UsIGtleSkpIHsgdGFyZ2V0W2tleV0gPSBzb3VyY2Vba2V5XTsgfSB9IH0gcmV0dXJuIHRhcmdldDsgfTtcblxudmFyIF93YXJuaW5nID0gcmVxdWlyZSgnd2FybmluZycpO1xuXG52YXIgX3dhcm5pbmcyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfd2FybmluZyk7XG5cbnZhciBfUGF0aFV0aWxzID0gcmVxdWlyZSgnLi9QYXRoVXRpbHMnKTtcblxudmFyIF9Mb2NhdGlvblV0aWxzID0gcmVxdWlyZSgnLi9Mb2NhdGlvblV0aWxzJyk7XG5cbnZhciBfY3JlYXRlVHJhbnNpdGlvbk1hbmFnZXIgPSByZXF1aXJlKCcuL2NyZWF0ZVRyYW5zaXRpb25NYW5hZ2VyJyk7XG5cbnZhciBfY3JlYXRlVHJhbnNpdGlvbk1hbmFnZXIyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfY3JlYXRlVHJhbnNpdGlvbk1hbmFnZXIpO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyBkZWZhdWx0OiBvYmogfTsgfVxuXG52YXIgY2xhbXAgPSBmdW5jdGlvbiBjbGFtcChuLCBsb3dlckJvdW5kLCB1cHBlckJvdW5kKSB7XG4gIHJldHVybiBNYXRoLm1pbihNYXRoLm1heChuLCBsb3dlckJvdW5kKSwgdXBwZXJCb3VuZCk7XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBoaXN0b3J5IG9iamVjdCB0aGF0IHN0b3JlcyBsb2NhdGlvbnMgaW4gbWVtb3J5LlxuICovXG52YXIgY3JlYXRlTWVtb3J5SGlzdG9yeSA9IGZ1bmN0aW9uIGNyZWF0ZU1lbW9yeUhpc3RvcnkoKSB7XG4gIHZhciBwcm9wcyA9IGFyZ3VtZW50cy5sZW5ndGggPiAwICYmIGFyZ3VtZW50c1swXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzBdIDoge307XG4gIHZhciBnZXRVc2VyQ29uZmlybWF0aW9uID0gcHJvcHMuZ2V0VXNlckNvbmZpcm1hdGlvbixcbiAgICAgIF9wcm9wcyRpbml0aWFsRW50cmllcyA9IHByb3BzLmluaXRpYWxFbnRyaWVzLFxuICAgICAgaW5pdGlhbEVudHJpZXMgPSBfcHJvcHMkaW5pdGlhbEVudHJpZXMgPT09IHVuZGVmaW5lZCA/IFsnLyddIDogX3Byb3BzJGluaXRpYWxFbnRyaWVzLFxuICAgICAgX3Byb3BzJGluaXRpYWxJbmRleCA9IHByb3BzLmluaXRpYWxJbmRleCxcbiAgICAgIGluaXRpYWxJbmRleCA9IF9wcm9wcyRpbml0aWFsSW5kZXggPT09IHVuZGVmaW5lZCA/IDAgOiBfcHJvcHMkaW5pdGlhbEluZGV4LFxuICAgICAgX3Byb3BzJGtleUxlbmd0aCA9IHByb3BzLmtleUxlbmd0aCxcbiAgICAgIGtleUxlbmd0aCA9IF9wcm9wcyRrZXlMZW5ndGggPT09IHVuZGVmaW5lZCA/IDYgOiBfcHJvcHMka2V5TGVuZ3RoO1xuXG5cbiAgdmFyIHRyYW5zaXRpb25NYW5hZ2VyID0gKDAsIF9jcmVhdGVUcmFuc2l0aW9uTWFuYWdlcjIuZGVmYXVsdCkoKTtcblxuICB2YXIgc2V0U3RhdGUgPSBmdW5jdGlvbiBzZXRTdGF0ZShuZXh0U3RhdGUpIHtcbiAgICBfZXh0ZW5kcyhoaXN0b3J5LCBuZXh0U3RhdGUpO1xuXG4gICAgaGlzdG9yeS5sZW5ndGggPSBoaXN0b3J5LmVudHJpZXMubGVuZ3RoO1xuXG4gICAgdHJhbnNpdGlvbk1hbmFnZXIubm90aWZ5TGlzdGVuZXJzKGhpc3RvcnkubG9jYXRpb24sIGhpc3RvcnkuYWN0aW9uKTtcbiAgfTtcblxuICB2YXIgY3JlYXRlS2V5ID0gZnVuY3Rpb24gY3JlYXRlS2V5KCkge1xuICAgIHJldHVybiBNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zdWJzdHIoMiwga2V5TGVuZ3RoKTtcbiAgfTtcblxuICB2YXIgaW5kZXggPSBjbGFtcChpbml0aWFsSW5kZXgsIDAsIGluaXRpYWxFbnRyaWVzLmxlbmd0aCAtIDEpO1xuICB2YXIgZW50cmllcyA9IGluaXRpYWxFbnRyaWVzLm1hcChmdW5jdGlvbiAoZW50cnkpIHtcbiAgICByZXR1cm4gdHlwZW9mIGVudHJ5ID09PSAnc3RyaW5nJyA/ICgwLCBfTG9jYXRpb25VdGlscy5jcmVhdGVMb2NhdGlvbikoZW50cnksIHVuZGVmaW5lZCwgY3JlYXRlS2V5KCkpIDogKDAsIF9Mb2NhdGlvblV0aWxzLmNyZWF0ZUxvY2F0aW9uKShlbnRyeSwgdW5kZWZpbmVkLCBlbnRyeS5rZXkgfHwgY3JlYXRlS2V5KCkpO1xuICB9KTtcblxuICAvLyBQdWJsaWMgaW50ZXJmYWNlXG5cbiAgdmFyIGNyZWF0ZUhyZWYgPSBfUGF0aFV0aWxzLmNyZWF0ZVBhdGg7XG5cbiAgdmFyIHB1c2ggPSBmdW5jdGlvbiBwdXNoKHBhdGgsIHN0YXRlKSB7XG4gICAgKDAsIF93YXJuaW5nMi5kZWZhdWx0KSghKCh0eXBlb2YgcGF0aCA9PT0gJ3VuZGVmaW5lZCcgPyAndW5kZWZpbmVkJyA6IF90eXBlb2YocGF0aCkpID09PSAnb2JqZWN0JyAmJiBwYXRoLnN0YXRlICE9PSB1bmRlZmluZWQgJiYgc3RhdGUgIT09IHVuZGVmaW5lZCksICdZb3Ugc2hvdWxkIGF2b2lkIHByb3ZpZGluZyBhIDJuZCBzdGF0ZSBhcmd1bWVudCB0byBwdXNoIHdoZW4gdGhlIDFzdCAnICsgJ2FyZ3VtZW50IGlzIGEgbG9jYXRpb24tbGlrZSBvYmplY3QgdGhhdCBhbHJlYWR5IGhhcyBzdGF0ZTsgaXQgaXMgaWdub3JlZCcpO1xuXG4gICAgdmFyIGFjdGlvbiA9ICdQVVNIJztcbiAgICB2YXIgbG9jYXRpb24gPSAoMCwgX0xvY2F0aW9uVXRpbHMuY3JlYXRlTG9jYXRpb24pKHBhdGgsIHN0YXRlLCBjcmVhdGVLZXkoKSwgaGlzdG9yeS5sb2NhdGlvbik7XG5cbiAgICB0cmFuc2l0aW9uTWFuYWdlci5jb25maXJtVHJhbnNpdGlvblRvKGxvY2F0aW9uLCBhY3Rpb24sIGdldFVzZXJDb25maXJtYXRpb24sIGZ1bmN0aW9uIChvaykge1xuICAgICAgaWYgKCFvaykgcmV0dXJuO1xuXG4gICAgICB2YXIgcHJldkluZGV4ID0gaGlzdG9yeS5pbmRleDtcbiAgICAgIHZhciBuZXh0SW5kZXggPSBwcmV2SW5kZXggKyAxO1xuXG4gICAgICB2YXIgbmV4dEVudHJpZXMgPSBoaXN0b3J5LmVudHJpZXMuc2xpY2UoMCk7XG4gICAgICBpZiAobmV4dEVudHJpZXMubGVuZ3RoID4gbmV4dEluZGV4KSB7XG4gICAgICAgIG5leHRFbnRyaWVzLnNwbGljZShuZXh0SW5kZXgsIG5leHRFbnRyaWVzLmxlbmd0aCAtIG5leHRJbmRleCwgbG9jYXRpb24pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbmV4dEVudHJpZXMucHVzaChsb2NhdGlvbik7XG4gICAgICB9XG5cbiAgICAgIHNldFN0YXRlKHtcbiAgICAgICAgYWN0aW9uOiBhY3Rpb24sXG4gICAgICAgIGxvY2F0aW9uOiBsb2NhdGlvbixcbiAgICAgICAgaW5kZXg6IG5leHRJbmRleCxcbiAgICAgICAgZW50cmllczogbmV4dEVudHJpZXNcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9O1xuXG4gIHZhciByZXBsYWNlID0gZnVuY3Rpb24gcmVwbGFjZShwYXRoLCBzdGF0ZSkge1xuICAgICgwLCBfd2FybmluZzIuZGVmYXVsdCkoISgodHlwZW9mIHBhdGggPT09ICd1bmRlZmluZWQnID8gJ3VuZGVmaW5lZCcgOiBfdHlwZW9mKHBhdGgpKSA9PT0gJ29iamVjdCcgJiYgcGF0aC5zdGF0ZSAhPT0gdW5kZWZpbmVkICYmIHN0YXRlICE9PSB1bmRlZmluZWQpLCAnWW91IHNob3VsZCBhdm9pZCBwcm92aWRpbmcgYSAybmQgc3RhdGUgYXJndW1lbnQgdG8gcmVwbGFjZSB3aGVuIHRoZSAxc3QgJyArICdhcmd1bWVudCBpcyBhIGxvY2F0aW9uLWxpa2Ugb2JqZWN0IHRoYXQgYWxyZWFkeSBoYXMgc3RhdGU7IGl0IGlzIGlnbm9yZWQnKTtcblxuICAgIHZhciBhY3Rpb24gPSAnUkVQTEFDRSc7XG4gICAgdmFyIGxvY2F0aW9uID0gKDAsIF9Mb2NhdGlvblV0aWxzLmNyZWF0ZUxvY2F0aW9uKShwYXRoLCBzdGF0ZSwgY3JlYXRlS2V5KCksIGhpc3RvcnkubG9jYXRpb24pO1xuXG4gICAgdHJhbnNpdGlvbk1hbmFnZXIuY29uZmlybVRyYW5zaXRpb25Ubyhsb2NhdGlvbiwgYWN0aW9uLCBnZXRVc2VyQ29uZmlybWF0aW9uLCBmdW5jdGlvbiAob2spIHtcbiAgICAgIGlmICghb2spIHJldHVybjtcblxuICAgICAgaGlzdG9yeS5lbnRyaWVzW2hpc3RvcnkuaW5kZXhdID0gbG9jYXRpb247XG5cbiAgICAgIHNldFN0YXRlKHsgYWN0aW9uOiBhY3Rpb24sIGxvY2F0aW9uOiBsb2NhdGlvbiB9KTtcbiAgICB9KTtcbiAgfTtcblxuICB2YXIgZ28gPSBmdW5jdGlvbiBnbyhuKSB7XG4gICAgdmFyIG5leHRJbmRleCA9IGNsYW1wKGhpc3RvcnkuaW5kZXggKyBuLCAwLCBoaXN0b3J5LmVudHJpZXMubGVuZ3RoIC0gMSk7XG5cbiAgICB2YXIgYWN0aW9uID0gJ1BPUCc7XG4gICAgdmFyIGxvY2F0aW9uID0gaGlzdG9yeS5lbnRyaWVzW25leHRJbmRleF07XG5cbiAgICB0cmFuc2l0aW9uTWFuYWdlci5jb25maXJtVHJhbnNpdGlvblRvKGxvY2F0aW9uLCBhY3Rpb24sIGdldFVzZXJDb25maXJtYXRpb24sIGZ1bmN0aW9uIChvaykge1xuICAgICAgaWYgKG9rKSB7XG4gICAgICAgIHNldFN0YXRlKHtcbiAgICAgICAgICBhY3Rpb246IGFjdGlvbixcbiAgICAgICAgICBsb2NhdGlvbjogbG9jYXRpb24sXG4gICAgICAgICAgaW5kZXg6IG5leHRJbmRleFxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIE1pbWljIHRoZSBiZWhhdmlvciBvZiBET00gaGlzdG9yaWVzIGJ5XG4gICAgICAgIC8vIGNhdXNpbmcgYSByZW5kZXIgYWZ0ZXIgYSBjYW5jZWxsZWQgUE9QLlxuICAgICAgICBzZXRTdGF0ZSgpO1xuICAgICAgfVxuICAgIH0pO1xuICB9O1xuXG4gIHZhciBnb0JhY2sgPSBmdW5jdGlvbiBnb0JhY2soKSB7XG4gICAgcmV0dXJuIGdvKC0xKTtcbiAgfTtcblxuICB2YXIgZ29Gb3J3YXJkID0gZnVuY3Rpb24gZ29Gb3J3YXJkKCkge1xuICAgIHJldHVybiBnbygxKTtcbiAgfTtcblxuICB2YXIgY2FuR28gPSBmdW5jdGlvbiBjYW5HbyhuKSB7XG4gICAgdmFyIG5leHRJbmRleCA9IGhpc3RvcnkuaW5kZXggKyBuO1xuICAgIHJldHVybiBuZXh0SW5kZXggPj0gMCAmJiBuZXh0SW5kZXggPCBoaXN0b3J5LmVudHJpZXMubGVuZ3RoO1xuICB9O1xuXG4gIHZhciBibG9jayA9IGZ1bmN0aW9uIGJsb2NrKCkge1xuICAgIHZhciBwcm9tcHQgPSBhcmd1bWVudHMubGVuZ3RoID4gMCAmJiBhcmd1bWVudHNbMF0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1swXSA6IGZhbHNlO1xuICAgIHJldHVybiB0cmFuc2l0aW9uTWFuYWdlci5zZXRQcm9tcHQocHJvbXB0KTtcbiAgfTtcblxuICB2YXIgbGlzdGVuID0gZnVuY3Rpb24gbGlzdGVuKGxpc3RlbmVyKSB7XG4gICAgcmV0dXJuIHRyYW5zaXRpb25NYW5hZ2VyLmFwcGVuZExpc3RlbmVyKGxpc3RlbmVyKTtcbiAgfTtcblxuICB2YXIgaGlzdG9yeSA9IHtcbiAgICBsZW5ndGg6IGVudHJpZXMubGVuZ3RoLFxuICAgIGFjdGlvbjogJ1BPUCcsXG4gICAgbG9jYXRpb246IGVudHJpZXNbaW5kZXhdLFxuICAgIGluZGV4OiBpbmRleCxcbiAgICBlbnRyaWVzOiBlbnRyaWVzLFxuICAgIGNyZWF0ZUhyZWY6IGNyZWF0ZUhyZWYsXG4gICAgcHVzaDogcHVzaCxcbiAgICByZXBsYWNlOiByZXBsYWNlLFxuICAgIGdvOiBnbyxcbiAgICBnb0JhY2s6IGdvQmFjayxcbiAgICBnb0ZvcndhcmQ6IGdvRm9yd2FyZCxcbiAgICBjYW5HbzogY2FuR28sXG4gICAgYmxvY2s6IGJsb2NrLFxuICAgIGxpc3RlbjogbGlzdGVuXG4gIH07XG5cbiAgcmV0dXJuIGhpc3Rvcnk7XG59O1xuXG5leHBvcnRzLmRlZmF1bHQgPSBjcmVhdGVNZW1vcnlIaXN0b3J5OyIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcblxudmFyIF93YXJuaW5nID0gcmVxdWlyZSgnd2FybmluZycpO1xuXG52YXIgX3dhcm5pbmcyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfd2FybmluZyk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IGRlZmF1bHQ6IG9iaiB9OyB9XG5cbnZhciBjcmVhdGVUcmFuc2l0aW9uTWFuYWdlciA9IGZ1bmN0aW9uIGNyZWF0ZVRyYW5zaXRpb25NYW5hZ2VyKCkge1xuICB2YXIgcHJvbXB0ID0gbnVsbDtcblxuICB2YXIgc2V0UHJvbXB0ID0gZnVuY3Rpb24gc2V0UHJvbXB0KG5leHRQcm9tcHQpIHtcbiAgICAoMCwgX3dhcm5pbmcyLmRlZmF1bHQpKHByb21wdCA9PSBudWxsLCAnQSBoaXN0b3J5IHN1cHBvcnRzIG9ubHkgb25lIHByb21wdCBhdCBhIHRpbWUnKTtcblxuICAgIHByb21wdCA9IG5leHRQcm9tcHQ7XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKHByb21wdCA9PT0gbmV4dFByb21wdCkgcHJvbXB0ID0gbnVsbDtcbiAgICB9O1xuICB9O1xuXG4gIHZhciBjb25maXJtVHJhbnNpdGlvblRvID0gZnVuY3Rpb24gY29uZmlybVRyYW5zaXRpb25Ubyhsb2NhdGlvbiwgYWN0aW9uLCBnZXRVc2VyQ29uZmlybWF0aW9uLCBjYWxsYmFjaykge1xuICAgIC8vIFRPRE86IElmIGFub3RoZXIgdHJhbnNpdGlvbiBzdGFydHMgd2hpbGUgd2UncmUgc3RpbGwgY29uZmlybWluZ1xuICAgIC8vIHRoZSBwcmV2aW91cyBvbmUsIHdlIG1heSBlbmQgdXAgaW4gYSB3ZWlyZCBzdGF0ZS4gRmlndXJlIG91dCB0aGVcbiAgICAvLyBiZXN0IHdheSB0byBoYW5kbGUgdGhpcy5cbiAgICBpZiAocHJvbXB0ICE9IG51bGwpIHtcbiAgICAgIHZhciByZXN1bHQgPSB0eXBlb2YgcHJvbXB0ID09PSAnZnVuY3Rpb24nID8gcHJvbXB0KGxvY2F0aW9uLCBhY3Rpb24pIDogcHJvbXB0O1xuXG4gICAgICBpZiAodHlwZW9mIHJlc3VsdCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBnZXRVc2VyQ29uZmlybWF0aW9uID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgZ2V0VXNlckNvbmZpcm1hdGlvbihyZXN1bHQsIGNhbGxiYWNrKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAoMCwgX3dhcm5pbmcyLmRlZmF1bHQpKGZhbHNlLCAnQSBoaXN0b3J5IG5lZWRzIGEgZ2V0VXNlckNvbmZpcm1hdGlvbiBmdW5jdGlvbiBpbiBvcmRlciB0byB1c2UgYSBwcm9tcHQgbWVzc2FnZScpO1xuXG4gICAgICAgICAgY2FsbGJhY2sodHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFJldHVybiBmYWxzZSBmcm9tIGEgdHJhbnNpdGlvbiBob29rIHRvIGNhbmNlbCB0aGUgdHJhbnNpdGlvbi5cbiAgICAgICAgY2FsbGJhY2socmVzdWx0ICE9PSBmYWxzZSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGNhbGxiYWNrKHRydWUpO1xuICAgIH1cbiAgfTtcblxuICB2YXIgbGlzdGVuZXJzID0gW107XG5cbiAgdmFyIGFwcGVuZExpc3RlbmVyID0gZnVuY3Rpb24gYXBwZW5kTGlzdGVuZXIoZm4pIHtcbiAgICB2YXIgaXNBY3RpdmUgPSB0cnVlO1xuXG4gICAgdmFyIGxpc3RlbmVyID0gZnVuY3Rpb24gbGlzdGVuZXIoKSB7XG4gICAgICBpZiAoaXNBY3RpdmUpIGZuLmFwcGx5KHVuZGVmaW5lZCwgYXJndW1lbnRzKTtcbiAgICB9O1xuXG4gICAgbGlzdGVuZXJzLnB1c2gobGlzdGVuZXIpO1xuXG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgIGlzQWN0aXZlID0gZmFsc2U7XG4gICAgICBsaXN0ZW5lcnMgPSBsaXN0ZW5lcnMuZmlsdGVyKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgIHJldHVybiBpdGVtICE9PSBsaXN0ZW5lcjtcbiAgICAgIH0pO1xuICAgIH07XG4gIH07XG5cbiAgdmFyIG5vdGlmeUxpc3RlbmVycyA9IGZ1bmN0aW9uIG5vdGlmeUxpc3RlbmVycygpIHtcbiAgICBmb3IgKHZhciBfbGVuID0gYXJndW1lbnRzLmxlbmd0aCwgYXJncyA9IEFycmF5KF9sZW4pLCBfa2V5ID0gMDsgX2tleSA8IF9sZW47IF9rZXkrKykge1xuICAgICAgYXJnc1tfa2V5XSA9IGFyZ3VtZW50c1tfa2V5XTtcbiAgICB9XG5cbiAgICBsaXN0ZW5lcnMuZm9yRWFjaChmdW5jdGlvbiAobGlzdGVuZXIpIHtcbiAgICAgIHJldHVybiBsaXN0ZW5lci5hcHBseSh1bmRlZmluZWQsIGFyZ3MpO1xuICAgIH0pO1xuICB9O1xuXG4gIHJldHVybiB7XG4gICAgc2V0UHJvbXB0OiBzZXRQcm9tcHQsXG4gICAgY29uZmlybVRyYW5zaXRpb25UbzogY29uZmlybVRyYW5zaXRpb25UbyxcbiAgICBhcHBlbmRMaXN0ZW5lcjogYXBwZW5kTGlzdGVuZXIsXG4gICAgbm90aWZ5TGlzdGVuZXJzOiBub3RpZnlMaXN0ZW5lcnNcbiAgfTtcbn07XG5cbmV4cG9ydHMuZGVmYXVsdCA9IGNyZWF0ZVRyYW5zaXRpb25NYW5hZ2VyOyIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcbmV4cG9ydHMuY3JlYXRlUGF0aCA9IGV4cG9ydHMucGFyc2VQYXRoID0gZXhwb3J0cy5sb2NhdGlvbnNBcmVFcXVhbCA9IGV4cG9ydHMuY3JlYXRlTG9jYXRpb24gPSBleHBvcnRzLmNyZWF0ZU1lbW9yeUhpc3RvcnkgPSBleHBvcnRzLmNyZWF0ZUhhc2hIaXN0b3J5ID0gZXhwb3J0cy5jcmVhdGVCcm93c2VySGlzdG9yeSA9IHVuZGVmaW5lZDtcblxudmFyIF9Mb2NhdGlvblV0aWxzID0gcmVxdWlyZSgnLi9Mb2NhdGlvblV0aWxzJyk7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnY3JlYXRlTG9jYXRpb24nLCB7XG4gIGVudW1lcmFibGU6IHRydWUsXG4gIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgIHJldHVybiBfTG9jYXRpb25VdGlscy5jcmVhdGVMb2NhdGlvbjtcbiAgfVxufSk7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ2xvY2F0aW9uc0FyZUVxdWFsJywge1xuICBlbnVtZXJhYmxlOiB0cnVlLFxuICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICByZXR1cm4gX0xvY2F0aW9uVXRpbHMubG9jYXRpb25zQXJlRXF1YWw7XG4gIH1cbn0pO1xuXG52YXIgX1BhdGhVdGlscyA9IHJlcXVpcmUoJy4vUGF0aFV0aWxzJyk7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAncGFyc2VQYXRoJywge1xuICBlbnVtZXJhYmxlOiB0cnVlLFxuICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICByZXR1cm4gX1BhdGhVdGlscy5wYXJzZVBhdGg7XG4gIH1cbn0pO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdjcmVhdGVQYXRoJywge1xuICBlbnVtZXJhYmxlOiB0cnVlLFxuICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICByZXR1cm4gX1BhdGhVdGlscy5jcmVhdGVQYXRoO1xuICB9XG59KTtcblxudmFyIF9jcmVhdGVCcm93c2VySGlzdG9yeTIgPSByZXF1aXJlKCcuL2NyZWF0ZUJyb3dzZXJIaXN0b3J5Jyk7XG5cbnZhciBfY3JlYXRlQnJvd3Nlckhpc3RvcnkzID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfY3JlYXRlQnJvd3Nlckhpc3RvcnkyKTtcblxudmFyIF9jcmVhdGVIYXNoSGlzdG9yeTIgPSByZXF1aXJlKCcuL2NyZWF0ZUhhc2hIaXN0b3J5Jyk7XG5cbnZhciBfY3JlYXRlSGFzaEhpc3RvcnkzID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfY3JlYXRlSGFzaEhpc3RvcnkyKTtcblxudmFyIF9jcmVhdGVNZW1vcnlIaXN0b3J5MiA9IHJlcXVpcmUoJy4vY3JlYXRlTWVtb3J5SGlzdG9yeScpO1xuXG52YXIgX2NyZWF0ZU1lbW9yeUhpc3RvcnkzID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfY3JlYXRlTWVtb3J5SGlzdG9yeTIpO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyBkZWZhdWx0OiBvYmogfTsgfVxuXG5leHBvcnRzLmNyZWF0ZUJyb3dzZXJIaXN0b3J5ID0gX2NyZWF0ZUJyb3dzZXJIaXN0b3J5My5kZWZhdWx0O1xuZXhwb3J0cy5jcmVhdGVIYXNoSGlzdG9yeSA9IF9jcmVhdGVIYXNoSGlzdG9yeTMuZGVmYXVsdDtcbmV4cG9ydHMuY3JlYXRlTWVtb3J5SGlzdG9yeSA9IF9jcmVhdGVNZW1vcnlIaXN0b3J5My5kZWZhdWx0OyIsIi8qKlxuICogQ29weXJpZ2h0IChjKSAyMDEzLXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2UgZm91bmQgaW4gdGhlXG4gKiBMSUNFTlNFIGZpbGUgaW4gdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIFVzZSBpbnZhcmlhbnQoKSB0byBhc3NlcnQgc3RhdGUgd2hpY2ggeW91ciBwcm9ncmFtIGFzc3VtZXMgdG8gYmUgdHJ1ZS5cbiAqXG4gKiBQcm92aWRlIHNwcmludGYtc3R5bGUgZm9ybWF0IChvbmx5ICVzIGlzIHN1cHBvcnRlZCkgYW5kIGFyZ3VtZW50c1xuICogdG8gcHJvdmlkZSBpbmZvcm1hdGlvbiBhYm91dCB3aGF0IGJyb2tlIGFuZCB3aGF0IHlvdSB3ZXJlXG4gKiBleHBlY3RpbmcuXG4gKlxuICogVGhlIGludmFyaWFudCBtZXNzYWdlIHdpbGwgYmUgc3RyaXBwZWQgaW4gcHJvZHVjdGlvbiwgYnV0IHRoZSBpbnZhcmlhbnRcbiAqIHdpbGwgcmVtYWluIHRvIGVuc3VyZSBsb2dpYyBkb2VzIG5vdCBkaWZmZXIgaW4gcHJvZHVjdGlvbi5cbiAqL1xuXG52YXIgaW52YXJpYW50ID0gZnVuY3Rpb24oY29uZGl0aW9uLCBmb3JtYXQsIGEsIGIsIGMsIGQsIGUsIGYpIHtcbiAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICBpZiAoZm9ybWF0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignaW52YXJpYW50IHJlcXVpcmVzIGFuIGVycm9yIG1lc3NhZ2UgYXJndW1lbnQnKTtcbiAgICB9XG4gIH1cblxuICBpZiAoIWNvbmRpdGlvbikge1xuICAgIHZhciBlcnJvcjtcbiAgICBpZiAoZm9ybWF0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGVycm9yID0gbmV3IEVycm9yKFxuICAgICAgICAnTWluaWZpZWQgZXhjZXB0aW9uIG9jY3VycmVkOyB1c2UgdGhlIG5vbi1taW5pZmllZCBkZXYgZW52aXJvbm1lbnQgJyArXG4gICAgICAgICdmb3IgdGhlIGZ1bGwgZXJyb3IgbWVzc2FnZSBhbmQgYWRkaXRpb25hbCBoZWxwZnVsIHdhcm5pbmdzLidcbiAgICAgICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBhcmdzID0gW2EsIGIsIGMsIGQsIGUsIGZdO1xuICAgICAgdmFyIGFyZ0luZGV4ID0gMDtcbiAgICAgIGVycm9yID0gbmV3IEVycm9yKFxuICAgICAgICBmb3JtYXQucmVwbGFjZSgvJXMvZywgZnVuY3Rpb24oKSB7IHJldHVybiBhcmdzW2FyZ0luZGV4KytdOyB9KVxuICAgICAgKTtcbiAgICAgIGVycm9yLm5hbWUgPSAnSW52YXJpYW50IFZpb2xhdGlvbic7XG4gICAgfVxuXG4gICAgZXJyb3IuZnJhbWVzVG9Qb3AgPSAxOyAvLyB3ZSBkb24ndCBjYXJlIGFib3V0IGludmFyaWFudCdzIG93biBmcmFtZVxuICAgIHRocm93IGVycm9yO1xuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGludmFyaWFudDtcbiIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG4vLyBjYWNoZWQgZnJvbSB3aGF0ZXZlciBnbG9iYWwgaXMgcHJlc2VudCBzbyB0aGF0IHRlc3QgcnVubmVycyB0aGF0IHN0dWIgaXRcbi8vIGRvbid0IGJyZWFrIHRoaW5ncy4gIEJ1dCB3ZSBuZWVkIHRvIHdyYXAgaXQgaW4gYSB0cnkgY2F0Y2ggaW4gY2FzZSBpdCBpc1xuLy8gd3JhcHBlZCBpbiBzdHJpY3QgbW9kZSBjb2RlIHdoaWNoIGRvZXNuJ3QgZGVmaW5lIGFueSBnbG9iYWxzLiAgSXQncyBpbnNpZGUgYVxuLy8gZnVuY3Rpb24gYmVjYXVzZSB0cnkvY2F0Y2hlcyBkZW9wdGltaXplIGluIGNlcnRhaW4gZW5naW5lcy5cblxudmFyIGNhY2hlZFNldFRpbWVvdXQ7XG52YXIgY2FjaGVkQ2xlYXJUaW1lb3V0O1xuXG5mdW5jdGlvbiBkZWZhdWx0U2V0VGltb3V0KCkge1xuICAgIHRocm93IG5ldyBFcnJvcignc2V0VGltZW91dCBoYXMgbm90IGJlZW4gZGVmaW5lZCcpO1xufVxuZnVuY3Rpb24gZGVmYXVsdENsZWFyVGltZW91dCAoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdjbGVhclRpbWVvdXQgaGFzIG5vdCBiZWVuIGRlZmluZWQnKTtcbn1cbihmdW5jdGlvbiAoKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBzZXRUaW1lb3V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gc2V0VGltZW91dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBkZWZhdWx0U2V0VGltb3V0O1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gZGVmYXVsdFNldFRpbW91dDtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBjbGVhclRpbWVvdXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGNsZWFyVGltZW91dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGRlZmF1bHRDbGVhclRpbWVvdXQ7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGRlZmF1bHRDbGVhclRpbWVvdXQ7XG4gICAgfVxufSAoKSlcbmZ1bmN0aW9uIHJ1blRpbWVvdXQoZnVuKSB7XG4gICAgaWYgKGNhY2hlZFNldFRpbWVvdXQgPT09IHNldFRpbWVvdXQpIHtcbiAgICAgICAgLy9ub3JtYWwgZW52aXJvbWVudHMgaW4gc2FuZSBzaXR1YXRpb25zXG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfVxuICAgIC8vIGlmIHNldFRpbWVvdXQgd2Fzbid0IGF2YWlsYWJsZSBidXQgd2FzIGxhdHRlciBkZWZpbmVkXG4gICAgaWYgKChjYWNoZWRTZXRUaW1lb3V0ID09PSBkZWZhdWx0U2V0VGltb3V0IHx8ICFjYWNoZWRTZXRUaW1lb3V0KSAmJiBzZXRUaW1lb3V0KSB7XG4gICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBzZXRUaW1lb3V0O1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW4sIDApO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICAvLyB3aGVuIHdoZW4gc29tZWJvZHkgaGFzIHNjcmV3ZWQgd2l0aCBzZXRUaW1lb3V0IGJ1dCBubyBJLkUuIG1hZGRuZXNzXG4gICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfSBjYXRjaChlKXtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFdoZW4gd2UgYXJlIGluIEkuRS4gYnV0IHRoZSBzY3JpcHQgaGFzIGJlZW4gZXZhbGVkIHNvIEkuRS4gZG9lc24ndCB0cnVzdCB0aGUgZ2xvYmFsIG9iamVjdCB3aGVuIGNhbGxlZCBub3JtYWxseVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQuY2FsbChudWxsLCBmdW4sIDApO1xuICAgICAgICB9IGNhdGNoKGUpe1xuICAgICAgICAgICAgLy8gc2FtZSBhcyBhYm92ZSBidXQgd2hlbiBpdCdzIGEgdmVyc2lvbiBvZiBJLkUuIHRoYXQgbXVzdCBoYXZlIHRoZSBnbG9iYWwgb2JqZWN0IGZvciAndGhpcycsIGhvcGZ1bGx5IG91ciBjb250ZXh0IGNvcnJlY3Qgb3RoZXJ3aXNlIGl0IHdpbGwgdGhyb3cgYSBnbG9iYWwgZXJyb3JcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0LmNhbGwodGhpcywgZnVuLCAwKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG59XG5mdW5jdGlvbiBydW5DbGVhclRpbWVvdXQobWFya2VyKSB7XG4gICAgaWYgKGNhY2hlZENsZWFyVGltZW91dCA9PT0gY2xlYXJUaW1lb3V0KSB7XG4gICAgICAgIC8vbm9ybWFsIGVudmlyb21lbnRzIGluIHNhbmUgc2l0dWF0aW9uc1xuICAgICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfVxuICAgIC8vIGlmIGNsZWFyVGltZW91dCB3YXNuJ3QgYXZhaWxhYmxlIGJ1dCB3YXMgbGF0dGVyIGRlZmluZWRcbiAgICBpZiAoKGNhY2hlZENsZWFyVGltZW91dCA9PT0gZGVmYXVsdENsZWFyVGltZW91dCB8fCAhY2FjaGVkQ2xlYXJUaW1lb3V0KSAmJiBjbGVhclRpbWVvdXQpIHtcbiAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gY2xlYXJUaW1lb3V0O1xuICAgICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIC8vIHdoZW4gd2hlbiBzb21lYm9keSBoYXMgc2NyZXdlZCB3aXRoIHNldFRpbWVvdXQgYnV0IG5vIEkuRS4gbWFkZG5lc3NcbiAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH0gY2F0Y2ggKGUpe1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gV2hlbiB3ZSBhcmUgaW4gSS5FLiBidXQgdGhlIHNjcmlwdCBoYXMgYmVlbiBldmFsZWQgc28gSS5FLiBkb2Vzbid0ICB0cnVzdCB0aGUgZ2xvYmFsIG9iamVjdCB3aGVuIGNhbGxlZCBub3JtYWxseVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dC5jYWxsKG51bGwsIG1hcmtlcik7XG4gICAgICAgIH0gY2F0Y2ggKGUpe1xuICAgICAgICAgICAgLy8gc2FtZSBhcyBhYm92ZSBidXQgd2hlbiBpdCdzIGEgdmVyc2lvbiBvZiBJLkUuIHRoYXQgbXVzdCBoYXZlIHRoZSBnbG9iYWwgb2JqZWN0IGZvciAndGhpcycsIGhvcGZ1bGx5IG91ciBjb250ZXh0IGNvcnJlY3Qgb3RoZXJ3aXNlIGl0IHdpbGwgdGhyb3cgYSBnbG9iYWwgZXJyb3IuXG4gICAgICAgICAgICAvLyBTb21lIHZlcnNpb25zIG9mIEkuRS4gaGF2ZSBkaWZmZXJlbnQgcnVsZXMgZm9yIGNsZWFyVGltZW91dCB2cyBzZXRUaW1lb3V0XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0LmNhbGwodGhpcywgbWFya2VyKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG5cbn1cbnZhciBxdWV1ZSA9IFtdO1xudmFyIGRyYWluaW5nID0gZmFsc2U7XG52YXIgY3VycmVudFF1ZXVlO1xudmFyIHF1ZXVlSW5kZXggPSAtMTtcblxuZnVuY3Rpb24gY2xlYW5VcE5leHRUaWNrKCkge1xuICAgIGlmICghZHJhaW5pbmcgfHwgIWN1cnJlbnRRdWV1ZSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgaWYgKGN1cnJlbnRRdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgcXVldWUgPSBjdXJyZW50UXVldWUuY29uY2F0KHF1ZXVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgfVxuICAgIGlmIChxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgZHJhaW5RdWV1ZSgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZHJhaW5RdWV1ZSgpIHtcbiAgICBpZiAoZHJhaW5pbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdGltZW91dCA9IHJ1blRpbWVvdXQoY2xlYW5VcE5leHRUaWNrKTtcbiAgICBkcmFpbmluZyA9IHRydWU7XG5cbiAgICB2YXIgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIHdoaWxlKGxlbikge1xuICAgICAgICBjdXJyZW50UXVldWUgPSBxdWV1ZTtcbiAgICAgICAgcXVldWUgPSBbXTtcbiAgICAgICAgd2hpbGUgKCsrcXVldWVJbmRleCA8IGxlbikge1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRRdWV1ZSkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRRdWV1ZVtxdWV1ZUluZGV4XS5ydW4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgICAgIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB9XG4gICAgY3VycmVudFF1ZXVlID0gbnVsbDtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIHJ1bkNsZWFyVGltZW91dCh0aW1lb3V0KTtcbn1cblxucHJvY2Vzcy5uZXh0VGljayA9IGZ1bmN0aW9uIChmdW4pIHtcbiAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSk7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBxdWV1ZS5wdXNoKG5ldyBJdGVtKGZ1biwgYXJncykpO1xuICAgIGlmIChxdWV1ZS5sZW5ndGggPT09IDEgJiYgIWRyYWluaW5nKSB7XG4gICAgICAgIHJ1blRpbWVvdXQoZHJhaW5RdWV1ZSk7XG4gICAgfVxufTtcblxuLy8gdjggbGlrZXMgcHJlZGljdGlibGUgb2JqZWN0c1xuZnVuY3Rpb24gSXRlbShmdW4sIGFycmF5KSB7XG4gICAgdGhpcy5mdW4gPSBmdW47XG4gICAgdGhpcy5hcnJheSA9IGFycmF5O1xufVxuSXRlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZnVuLmFwcGx5KG51bGwsIHRoaXMuYXJyYXkpO1xufTtcbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xucHJvY2Vzcy52ZXJzaW9uID0gJyc7IC8vIGVtcHR5IHN0cmluZyB0byBhdm9pZCByZWdleHAgaXNzdWVzXG5wcm9jZXNzLnZlcnNpb25zID0ge307XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcbnByb2Nlc3MucHJlcGVuZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucHJlcGVuZE9uY2VMaXN0ZW5lciA9IG5vb3A7XG5cbnByb2Nlc3MubGlzdGVuZXJzID0gZnVuY3Rpb24gKG5hbWUpIHsgcmV0dXJuIFtdIH1cblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbnByb2Nlc3MudW1hc2sgPSBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH07XG4iLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5mdW5jdGlvbiBpc0Fic29sdXRlKHBhdGhuYW1lKSB7XG4gIHJldHVybiBwYXRobmFtZS5jaGFyQXQoMCkgPT09ICcvJztcbn1cblxuLy8gQWJvdXQgMS41eCBmYXN0ZXIgdGhhbiB0aGUgdHdvLWFyZyB2ZXJzaW9uIG9mIEFycmF5I3NwbGljZSgpXG5mdW5jdGlvbiBzcGxpY2VPbmUobGlzdCwgaW5kZXgpIHtcbiAgZm9yICh2YXIgaSA9IGluZGV4LCBrID0gaSArIDEsIG4gPSBsaXN0Lmxlbmd0aDsgayA8IG47IGkgKz0gMSwgayArPSAxKSB7XG4gICAgbGlzdFtpXSA9IGxpc3Rba107XG4gIH1cblxuICBsaXN0LnBvcCgpO1xufVxuXG4vLyBUaGlzIGltcGxlbWVudGF0aW9uIGlzIGJhc2VkIGhlYXZpbHkgb24gbm9kZSdzIHVybC5wYXJzZVxuZnVuY3Rpb24gcmVzb2x2ZVBhdGhuYW1lKHRvKSB7XG4gIHZhciBmcm9tID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgJiYgYXJndW1lbnRzWzFdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMV0gOiAnJztcblxuICB2YXIgdG9QYXJ0cyA9IHRvICYmIHRvLnNwbGl0KCcvJykgfHwgW107XG4gIHZhciBmcm9tUGFydHMgPSBmcm9tICYmIGZyb20uc3BsaXQoJy8nKSB8fCBbXTtcblxuICB2YXIgaXNUb0FicyA9IHRvICYmIGlzQWJzb2x1dGUodG8pO1xuICB2YXIgaXNGcm9tQWJzID0gZnJvbSAmJiBpc0Fic29sdXRlKGZyb20pO1xuICB2YXIgbXVzdEVuZEFicyA9IGlzVG9BYnMgfHwgaXNGcm9tQWJzO1xuXG4gIGlmICh0byAmJiBpc0Fic29sdXRlKHRvKSkge1xuICAgIC8vIHRvIGlzIGFic29sdXRlXG4gICAgZnJvbVBhcnRzID0gdG9QYXJ0cztcbiAgfSBlbHNlIGlmICh0b1BhcnRzLmxlbmd0aCkge1xuICAgIC8vIHRvIGlzIHJlbGF0aXZlLCBkcm9wIHRoZSBmaWxlbmFtZVxuICAgIGZyb21QYXJ0cy5wb3AoKTtcbiAgICBmcm9tUGFydHMgPSBmcm9tUGFydHMuY29uY2F0KHRvUGFydHMpO1xuICB9XG5cbiAgaWYgKCFmcm9tUGFydHMubGVuZ3RoKSByZXR1cm4gJy8nO1xuXG4gIHZhciBoYXNUcmFpbGluZ1NsYXNoID0gdm9pZCAwO1xuICBpZiAoZnJvbVBhcnRzLmxlbmd0aCkge1xuICAgIHZhciBsYXN0ID0gZnJvbVBhcnRzW2Zyb21QYXJ0cy5sZW5ndGggLSAxXTtcbiAgICBoYXNUcmFpbGluZ1NsYXNoID0gbGFzdCA9PT0gJy4nIHx8IGxhc3QgPT09ICcuLicgfHwgbGFzdCA9PT0gJyc7XG4gIH0gZWxzZSB7XG4gICAgaGFzVHJhaWxpbmdTbGFzaCA9IGZhbHNlO1xuICB9XG5cbiAgdmFyIHVwID0gMDtcbiAgZm9yICh2YXIgaSA9IGZyb21QYXJ0cy5sZW5ndGg7IGkgPj0gMDsgaS0tKSB7XG4gICAgdmFyIHBhcnQgPSBmcm9tUGFydHNbaV07XG5cbiAgICBpZiAocGFydCA9PT0gJy4nKSB7XG4gICAgICBzcGxpY2VPbmUoZnJvbVBhcnRzLCBpKTtcbiAgICB9IGVsc2UgaWYgKHBhcnQgPT09ICcuLicpIHtcbiAgICAgIHNwbGljZU9uZShmcm9tUGFydHMsIGkpO1xuICAgICAgdXArKztcbiAgICB9IGVsc2UgaWYgKHVwKSB7XG4gICAgICBzcGxpY2VPbmUoZnJvbVBhcnRzLCBpKTtcbiAgICAgIHVwLS07XG4gICAgfVxuICB9XG5cbiAgaWYgKCFtdXN0RW5kQWJzKSBmb3IgKDsgdXAtLTsgdXApIHtcbiAgICBmcm9tUGFydHMudW5zaGlmdCgnLi4nKTtcbiAgfWlmIChtdXN0RW5kQWJzICYmIGZyb21QYXJ0c1swXSAhPT0gJycgJiYgKCFmcm9tUGFydHNbMF0gfHwgIWlzQWJzb2x1dGUoZnJvbVBhcnRzWzBdKSkpIGZyb21QYXJ0cy51bnNoaWZ0KCcnKTtcblxuICB2YXIgcmVzdWx0ID0gZnJvbVBhcnRzLmpvaW4oJy8nKTtcblxuICBpZiAoaGFzVHJhaWxpbmdTbGFzaCAmJiByZXN1bHQuc3Vic3RyKC0xKSAhPT0gJy8nKSByZXN1bHQgKz0gJy8nO1xuXG4gIHJldHVybiByZXN1bHQ7XG59XG5cbmV4cG9ydHMuZGVmYXVsdCA9IHJlc29sdmVQYXRobmFtZTtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsIlwidXNlIHN0cmljdFwiO1xudmFyIHNlbGVjdG9yUGFyc2VyXzEgPSByZXF1aXJlKCcuL3NlbGVjdG9yUGFyc2VyJyk7XG5mdW5jdGlvbiBjbGFzc05hbWVGcm9tVk5vZGUodk5vZGUpIHtcbiAgICB2YXIgX2EgPSBzZWxlY3RvclBhcnNlcl8xLnNlbGVjdG9yUGFyc2VyKHZOb2RlKS5jbGFzc05hbWUsIGNuID0gX2EgPT09IHZvaWQgMCA/ICcnIDogX2E7XG4gICAgaWYgKCF2Tm9kZS5kYXRhKSB7XG4gICAgICAgIHJldHVybiBjbjtcbiAgICB9XG4gICAgdmFyIF9iID0gdk5vZGUuZGF0YSwgZGF0YUNsYXNzID0gX2IuY2xhc3MsIHByb3BzID0gX2IucHJvcHM7XG4gICAgaWYgKGRhdGFDbGFzcykge1xuICAgICAgICB2YXIgYyA9IE9iamVjdC5rZXlzKGRhdGFDbGFzcylcbiAgICAgICAgICAgIC5maWx0ZXIoZnVuY3Rpb24gKGNsKSB7IHJldHVybiBkYXRhQ2xhc3NbY2xdOyB9KTtcbiAgICAgICAgY24gKz0gXCIgXCIgKyBjLmpvaW4oXCIgXCIpO1xuICAgIH1cbiAgICBpZiAocHJvcHMgJiYgcHJvcHMuY2xhc3NOYW1lKSB7XG4gICAgICAgIGNuICs9IFwiIFwiICsgcHJvcHMuY2xhc3NOYW1lO1xuICAgIH1cbiAgICByZXR1cm4gY24gJiYgY24udHJpbSgpO1xufVxuZXhwb3J0cy5jbGFzc05hbWVGcm9tVk5vZGUgPSBjbGFzc05hbWVGcm9tVk5vZGU7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1jbGFzc05hbWVGcm9tVk5vZGUuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5mdW5jdGlvbiBzZWxlY3RvclBhcnNlcihub2RlKSB7XG4gICAgaWYgKCFub2RlLnNlbCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdGFnTmFtZTogJycsXG4gICAgICAgICAgICBpZDogJycsXG4gICAgICAgICAgICBjbGFzc05hbWU6ICcnLFxuICAgICAgICB9O1xuICAgIH1cbiAgICB2YXIgc2VsID0gbm9kZS5zZWw7XG4gICAgdmFyIGhhc2hJZHggPSBzZWwuaW5kZXhPZignIycpO1xuICAgIHZhciBkb3RJZHggPSBzZWwuaW5kZXhPZignLicsIGhhc2hJZHgpO1xuICAgIHZhciBoYXNoID0gaGFzaElkeCA+IDAgPyBoYXNoSWR4IDogc2VsLmxlbmd0aDtcbiAgICB2YXIgZG90ID0gZG90SWR4ID4gMCA/IGRvdElkeCA6IHNlbC5sZW5ndGg7XG4gICAgdmFyIHRhZ05hbWUgPSBoYXNoSWR4ICE9PSAtMSB8fCBkb3RJZHggIT09IC0xID9cbiAgICAgICAgc2VsLnNsaWNlKDAsIE1hdGgubWluKGhhc2gsIGRvdCkpIDpcbiAgICAgICAgc2VsO1xuICAgIHZhciBpZCA9IGhhc2ggPCBkb3QgPyBzZWwuc2xpY2UoaGFzaCArIDEsIGRvdCkgOiB2b2lkIDA7XG4gICAgdmFyIGNsYXNzTmFtZSA9IGRvdElkeCA+IDAgPyBzZWwuc2xpY2UoZG90ICsgMSkucmVwbGFjZSgvXFwuL2csICcgJykgOiB2b2lkIDA7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgdGFnTmFtZTogdGFnTmFtZSxcbiAgICAgICAgaWQ6IGlkLFxuICAgICAgICBjbGFzc05hbWU6IGNsYXNzTmFtZSxcbiAgICB9O1xufVxuZXhwb3J0cy5zZWxlY3RvclBhcnNlciA9IHNlbGVjdG9yUGFyc2VyO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9c2VsZWN0b3JQYXJzZXIuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgdXRpbHNfMSA9IHJlcXVpcmUoXCIuL3V0aWxzXCIpO1xudmFyIHJlbW92ZUVsZW1lbnQgPSBmdW5jdGlvbiAoc3R5bGVFbGVtZW50U2VsZWN0b3IpIHtcbiAgICB2YXIgcHJldmlvdXNTdHlsZVRhcmdldCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3Ioc3R5bGVFbGVtZW50U2VsZWN0b3IpO1xuICAgIGlmIChwcmV2aW91c1N0eWxlVGFyZ2V0KSB7XG4gICAgICAgIHByZXZpb3VzU3R5bGVUYXJnZXQucmVtb3ZlKCk7XG4gICAgfVxufTtcbnZhciBtYWtlRG9tVXBkYXRlciA9IGZ1bmN0aW9uIChzdHlsZUVsZW1lbnRTZWxlY3Rvcikge1xuICAgIGlmIChzdHlsZUVsZW1lbnRTZWxlY3RvciA9PT0gdm9pZCAwKSB7IHN0eWxlRWxlbWVudFNlbGVjdG9yID0gdW5kZWZpbmVkOyB9XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChvbGROb2RlLCBuZXdOb2RlKSB7XG4gICAgICAgIHV0aWxzXzEudXBkYXRlVk5vZGUobmV3Tm9kZSk7XG4gICAgICAgIGlmICh0eXBlb2Ygc3R5bGVFbGVtZW50U2VsZWN0b3IgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICByZW1vdmVFbGVtZW50KHN0eWxlRWxlbWVudFNlbGVjdG9yKTtcbiAgICAgICAgfVxuICAgIH07XG59O1xuZXhwb3J0cy5tYWtlTW9kdWxlID0gZnVuY3Rpb24gKHN0eWxlRWxlbWVudFNlbGVjdG9yKSB7XG4gICAgaWYgKHN0eWxlRWxlbWVudFNlbGVjdG9yID09PSB2b2lkIDApIHsgc3R5bGVFbGVtZW50U2VsZWN0b3IgPSB1bmRlZmluZWQ7IH1cbiAgICAvLyBTZXJ2ZXJzaWRlIHN0eWxlcyBhcmUgb25seSByZW1vdmVkIHRoZSBmaXJzdCB0aW1lIHVwZGF0ZURPTSBpcyBjYWxsZWRcbiAgICB2YXIgZG9tVXBkYXRlciA9IHV0aWxzXzEuYWx0ZXJuYXRlRmlyc3RJbnZvY2F0aW9uKGZ1bmN0aW9uICgpIHsgcmV0dXJuIG1ha2VEb21VcGRhdGVyKHN0eWxlRWxlbWVudFNlbGVjdG9yKTsgfSwgZnVuY3Rpb24gKCkgeyByZXR1cm4gbWFrZURvbVVwZGF0ZXIoKTsgfSk7XG4gICAgdmFyIHVwZGF0ZURPTSA9IGZ1bmN0aW9uIChvbGROb2RlLCBuZXdOb2RlKSB7IHJldHVybiBkb21VcGRhdGVyLm5leHQoKS52YWx1ZShvbGROb2RlLCBuZXdOb2RlKTsgfTtcbiAgICByZXR1cm4ge1xuICAgICAgICBjcmVhdGU6IHVwZGF0ZURPTSxcbiAgICAgICAgdXBkYXRlOiB1cGRhdGVET01cbiAgICB9O1xufTtcbmV4cG9ydHMuZGVmYXVsdCA9IGV4cG9ydHMubWFrZU1vZHVsZSgpO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgdHlwZXN0eWxlXzEgPSByZXF1aXJlKFwidHlwZXN0eWxlXCIpO1xudmFyIHV0aWxzXzEgPSByZXF1aXJlKFwiLi91dGlsc1wiKTtcbmV4cG9ydHMuc2VydmVyU2lkZUNzc01vZHVsZSA9IGZ1bmN0aW9uIChub2RlLCBhdHRyaWJ1dGVzKSB7XG4gICAgcmV0dXJuIHV0aWxzXzEudXBkYXRlVk5vZGUobm9kZSk7XG59O1xuZXhwb3J0cy5jb2xsZWN0U3R5bGVzID0gZnVuY3Rpb24gKG5vZGUpIHtcbiAgICB2YXIgaW5zdGFuY2UgPSB0eXBlc3R5bGVfMS5jcmVhdGVUeXBlU3R5bGUoKTtcbiAgICBleHBvcnRzLnRyYXZlcnNlVk5vZGUobm9kZSwgaW5zdGFuY2UpO1xuICAgIHJldHVybiBpbnN0YW5jZS5nZXRTdHlsZXMoKTtcbn07XG5leHBvcnRzLnRyYXZlcnNlVk5vZGUgPSBmdW5jdGlvbiAobm9kZSwgaW5zdGFuY2UpIHtcbiAgICB2YXIgZGF0YSA9IG5vZGUuZGF0YTtcbiAgICBpZiAoZGF0YS5jc3MpIHtcbiAgICAgICAgaW5zdGFuY2Uuc3R5bGUoZGF0YS5jc3MpO1xuICAgIH1cbiAgICBpZiAobm9kZS5jaGlsZHJlbikge1xuICAgICAgICBub2RlLmNoaWxkcmVuLmZvckVhY2goZnVuY3Rpb24gKGNoaWxkKSB7IHJldHVybiBleHBvcnRzLnRyYXZlcnNlVk5vZGUoY2hpbGQsIGluc3RhbmNlKTsgfSk7XG4gICAgfVxufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuZnVuY3Rpb24gX19leHBvcnQobSkge1xuICAgIGZvciAodmFyIHAgaW4gbSkgaWYgKCFleHBvcnRzLmhhc093blByb3BlcnR5KHApKSBleHBvcnRzW3BdID0gbVtwXTtcbn1cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBjbGllbnRfMSA9IHJlcXVpcmUoXCIuL2NsaWVudFwiKTtcbl9fZXhwb3J0KHJlcXVpcmUoXCIuL3NlcnZlclwiKSk7XG5leHBvcnRzLm1ha2VDbGllbnRTaWRlQ3NzTW9kdWxlID0gY2xpZW50XzEubWFrZU1vZHVsZTtcbmV4cG9ydHMuZGVmYXVsdCA9IGNsaWVudF8xLmRlZmF1bHQ7XG4iLCJcInVzZSBzdHJpY3RcIjtcbnZhciBfX2dlbmVyYXRvciA9ICh0aGlzICYmIHRoaXMuX19nZW5lcmF0b3IpIHx8IGZ1bmN0aW9uICh0aGlzQXJnLCBib2R5KSB7XG4gICAgdmFyIF8gPSB7IGxhYmVsOiAwLCBzZW50OiBmdW5jdGlvbigpIHsgaWYgKHRbMF0gJiAxKSB0aHJvdyB0WzFdOyByZXR1cm4gdFsxXTsgfSwgdHJ5czogW10sIG9wczogW10gfSwgZiwgeSwgdCwgZztcbiAgICByZXR1cm4gZyA9IHsgbmV4dDogdmVyYigwKSwgXCJ0aHJvd1wiOiB2ZXJiKDEpLCBcInJldHVyblwiOiB2ZXJiKDIpIH0sIHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiAoZ1tTeW1ib2wuaXRlcmF0b3JdID0gZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzOyB9KSwgZztcbiAgICBmdW5jdGlvbiB2ZXJiKG4pIHsgcmV0dXJuIGZ1bmN0aW9uICh2KSB7IHJldHVybiBzdGVwKFtuLCB2XSk7IH07IH1cbiAgICBmdW5jdGlvbiBzdGVwKG9wKSB7XG4gICAgICAgIGlmIChmKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiR2VuZXJhdG9yIGlzIGFscmVhZHkgZXhlY3V0aW5nLlwiKTtcbiAgICAgICAgd2hpbGUgKF8pIHRyeSB7XG4gICAgICAgICAgICBpZiAoZiA9IDEsIHkgJiYgKHQgPSB5W29wWzBdICYgMiA/IFwicmV0dXJuXCIgOiBvcFswXSA/IFwidGhyb3dcIiA6IFwibmV4dFwiXSkgJiYgISh0ID0gdC5jYWxsKHksIG9wWzFdKSkuZG9uZSkgcmV0dXJuIHQ7XG4gICAgICAgICAgICBpZiAoeSA9IDAsIHQpIG9wID0gWzAsIHQudmFsdWVdO1xuICAgICAgICAgICAgc3dpdGNoIChvcFswXSkge1xuICAgICAgICAgICAgICAgIGNhc2UgMDogY2FzZSAxOiB0ID0gb3A7IGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgNDogXy5sYWJlbCsrOyByZXR1cm4geyB2YWx1ZTogb3BbMV0sIGRvbmU6IGZhbHNlIH07XG4gICAgICAgICAgICAgICAgY2FzZSA1OiBfLmxhYmVsKys7IHkgPSBvcFsxXTsgb3AgPSBbMF07IGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIGNhc2UgNzogb3AgPSBfLm9wcy5wb3AoKTsgXy50cnlzLnBvcCgpOyBjb250aW51ZTtcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICBpZiAoISh0ID0gXy50cnlzLCB0ID0gdC5sZW5ndGggPiAwICYmIHRbdC5sZW5ndGggLSAxXSkgJiYgKG9wWzBdID09PSA2IHx8IG9wWzBdID09PSAyKSkgeyBfID0gMDsgY29udGludWU7IH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wWzBdID09PSAzICYmICghdCB8fCAob3BbMV0gPiB0WzBdICYmIG9wWzFdIDwgdFszXSkpKSB7IF8ubGFiZWwgPSBvcFsxXTsgYnJlYWs7IH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wWzBdID09PSA2ICYmIF8ubGFiZWwgPCB0WzFdKSB7IF8ubGFiZWwgPSB0WzFdOyB0ID0gb3A7IGJyZWFrOyB9XG4gICAgICAgICAgICAgICAgICAgIGlmICh0ICYmIF8ubGFiZWwgPCB0WzJdKSB7IF8ubGFiZWwgPSB0WzJdOyBfLm9wcy5wdXNoKG9wKTsgYnJlYWs7IH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHRbMl0pIF8ub3BzLnBvcCgpO1xuICAgICAgICAgICAgICAgICAgICBfLnRyeXMucG9wKCk7IGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgb3AgPSBib2R5LmNhbGwodGhpc0FyZywgXyk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHsgb3AgPSBbNiwgZV07IHkgPSAwOyB9IGZpbmFsbHkgeyBmID0gdCA9IDA7IH1cbiAgICAgICAgaWYgKG9wWzBdICYgNSkgdGhyb3cgb3BbMV07IHJldHVybiB7IHZhbHVlOiBvcFswXSA/IG9wWzFdIDogdm9pZCAwLCBkb25lOiB0cnVlIH07XG4gICAgfVxufTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB0eXBlc3R5bGVfMSA9IHJlcXVpcmUoXCJ0eXBlc3R5bGVcIik7XG5leHBvcnRzLnVwZGF0ZVZOb2RlID0gZnVuY3Rpb24gKHZub2RlKSB7XG4gICAgdmFyIGRhdGEgPSB2bm9kZS5kYXRhO1xuICAgIGlmIChkYXRhLmNzcykge1xuICAgICAgICBkYXRhLmNsYXNzID0gZGF0YS5jbGFzcyB8fCB7fTtcbiAgICAgICAgZGF0YS5jbGFzc1t0eXBlc3R5bGVfMS5zdHlsZShkYXRhLmNzcyldID0gdHJ1ZTtcbiAgICB9XG59O1xuZnVuY3Rpb24gYWx0ZXJuYXRlRmlyc3RJbnZvY2F0aW9uKGZpcnN0LCBzdWJzZXF1ZW50KSB7XG4gICAgcmV0dXJuIF9fZ2VuZXJhdG9yKHRoaXMsIGZ1bmN0aW9uIChfYSkge1xuICAgICAgICBzd2l0Y2ggKF9hLmxhYmVsKSB7XG4gICAgICAgICAgICBjYXNlIDA6IHJldHVybiBbNCAvKnlpZWxkKi8sIGZpcnN0KCldO1xuICAgICAgICAgICAgY2FzZSAxOlxuICAgICAgICAgICAgICAgIF9hLnNlbnQoKTtcbiAgICAgICAgICAgICAgICBfYS5sYWJlbCA9IDI7XG4gICAgICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgICAgICAgaWYgKCF0cnVlKSByZXR1cm4gWzMgLypicmVhayovLCA0XTtcbiAgICAgICAgICAgICAgICByZXR1cm4gWzQgLyp5aWVsZCovLCBzdWJzZXF1ZW50KCldO1xuICAgICAgICAgICAgY2FzZSAzOlxuICAgICAgICAgICAgICAgIF9hLnNlbnQoKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gWzMgLypicmVhayovLCAyXTtcbiAgICAgICAgICAgIGNhc2UgNDogcmV0dXJuIFsyIC8qcmV0dXJuKi9dO1xuICAgICAgICB9XG4gICAgfSk7XG59XG5leHBvcnRzLmFsdGVybmF0ZUZpcnN0SW52b2NhdGlvbiA9IGFsdGVybmF0ZUZpcnN0SW52b2NhdGlvbjtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHZub2RlXzEgPSByZXF1aXJlKFwiLi92bm9kZVwiKTtcbnZhciBpcyA9IHJlcXVpcmUoXCIuL2lzXCIpO1xuZnVuY3Rpb24gYWRkTlMoZGF0YSwgY2hpbGRyZW4sIHNlbCkge1xuICAgIGRhdGEubnMgPSAnaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnO1xuICAgIGlmIChzZWwgIT09ICdmb3JlaWduT2JqZWN0JyAmJiBjaGlsZHJlbiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIHZhciBjaGlsZERhdGEgPSBjaGlsZHJlbltpXS5kYXRhO1xuICAgICAgICAgICAgaWYgKGNoaWxkRGF0YSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgYWRkTlMoY2hpbGREYXRhLCBjaGlsZHJlbltpXS5jaGlsZHJlbiwgY2hpbGRyZW5baV0uc2VsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cbmZ1bmN0aW9uIGgoc2VsLCBiLCBjKSB7XG4gICAgdmFyIGRhdGEgPSB7fSwgY2hpbGRyZW4sIHRleHQsIGk7XG4gICAgaWYgKGMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBkYXRhID0gYjtcbiAgICAgICAgaWYgKGlzLmFycmF5KGMpKSB7XG4gICAgICAgICAgICBjaGlsZHJlbiA9IGM7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoaXMucHJpbWl0aXZlKGMpKSB7XG4gICAgICAgICAgICB0ZXh0ID0gYztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChjICYmIGMuc2VsKSB7XG4gICAgICAgICAgICBjaGlsZHJlbiA9IFtjXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBlbHNlIGlmIChiICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgaWYgKGlzLmFycmF5KGIpKSB7XG4gICAgICAgICAgICBjaGlsZHJlbiA9IGI7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoaXMucHJpbWl0aXZlKGIpKSB7XG4gICAgICAgICAgICB0ZXh0ID0gYjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChiICYmIGIuc2VsKSB7XG4gICAgICAgICAgICBjaGlsZHJlbiA9IFtiXTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGRhdGEgPSBiO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmIChpcy5hcnJheShjaGlsZHJlbikpIHtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICBpZiAoaXMucHJpbWl0aXZlKGNoaWxkcmVuW2ldKSlcbiAgICAgICAgICAgICAgICBjaGlsZHJlbltpXSA9IHZub2RlXzEudm5vZGUodW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgY2hpbGRyZW5baV0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmIChzZWxbMF0gPT09ICdzJyAmJiBzZWxbMV0gPT09ICd2JyAmJiBzZWxbMl0gPT09ICdnJyAmJlxuICAgICAgICAoc2VsLmxlbmd0aCA9PT0gMyB8fCBzZWxbM10gPT09ICcuJyB8fCBzZWxbM10gPT09ICcjJykpIHtcbiAgICAgICAgYWRkTlMoZGF0YSwgY2hpbGRyZW4sIHNlbCk7XG4gICAgfVxuICAgIHJldHVybiB2bm9kZV8xLnZub2RlKHNlbCwgZGF0YSwgY2hpbGRyZW4sIHRleHQsIHVuZGVmaW5lZCk7XG59XG5leHBvcnRzLmggPSBoO1xuO1xuZXhwb3J0cy5kZWZhdWx0ID0gaDtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWguanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5mdW5jdGlvbiBjcmVhdGVFbGVtZW50KHRhZ05hbWUpIHtcbiAgICByZXR1cm4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0YWdOYW1lKTtcbn1cbmZ1bmN0aW9uIGNyZWF0ZUVsZW1lbnROUyhuYW1lc3BhY2VVUkksIHF1YWxpZmllZE5hbWUpIHtcbiAgICByZXR1cm4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKG5hbWVzcGFjZVVSSSwgcXVhbGlmaWVkTmFtZSk7XG59XG5mdW5jdGlvbiBjcmVhdGVUZXh0Tm9kZSh0ZXh0KSB7XG4gICAgcmV0dXJuIGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHRleHQpO1xufVxuZnVuY3Rpb24gY3JlYXRlQ29tbWVudCh0ZXh0KSB7XG4gICAgcmV0dXJuIGRvY3VtZW50LmNyZWF0ZUNvbW1lbnQodGV4dCk7XG59XG5mdW5jdGlvbiBpbnNlcnRCZWZvcmUocGFyZW50Tm9kZSwgbmV3Tm9kZSwgcmVmZXJlbmNlTm9kZSkge1xuICAgIHBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKG5ld05vZGUsIHJlZmVyZW5jZU5vZGUpO1xufVxuZnVuY3Rpb24gcmVtb3ZlQ2hpbGQobm9kZSwgY2hpbGQpIHtcbiAgICBub2RlLnJlbW92ZUNoaWxkKGNoaWxkKTtcbn1cbmZ1bmN0aW9uIGFwcGVuZENoaWxkKG5vZGUsIGNoaWxkKSB7XG4gICAgbm9kZS5hcHBlbmRDaGlsZChjaGlsZCk7XG59XG5mdW5jdGlvbiBwYXJlbnROb2RlKG5vZGUpIHtcbiAgICByZXR1cm4gbm9kZS5wYXJlbnROb2RlO1xufVxuZnVuY3Rpb24gbmV4dFNpYmxpbmcobm9kZSkge1xuICAgIHJldHVybiBub2RlLm5leHRTaWJsaW5nO1xufVxuZnVuY3Rpb24gdGFnTmFtZShlbG0pIHtcbiAgICByZXR1cm4gZWxtLnRhZ05hbWU7XG59XG5mdW5jdGlvbiBzZXRUZXh0Q29udGVudChub2RlLCB0ZXh0KSB7XG4gICAgbm9kZS50ZXh0Q29udGVudCA9IHRleHQ7XG59XG5mdW5jdGlvbiBnZXRUZXh0Q29udGVudChub2RlKSB7XG4gICAgcmV0dXJuIG5vZGUudGV4dENvbnRlbnQ7XG59XG5mdW5jdGlvbiBpc0VsZW1lbnQobm9kZSkge1xuICAgIHJldHVybiBub2RlLm5vZGVUeXBlID09PSAxO1xufVxuZnVuY3Rpb24gaXNUZXh0KG5vZGUpIHtcbiAgICByZXR1cm4gbm9kZS5ub2RlVHlwZSA9PT0gMztcbn1cbmZ1bmN0aW9uIGlzQ29tbWVudChub2RlKSB7XG4gICAgcmV0dXJuIG5vZGUubm9kZVR5cGUgPT09IDg7XG59XG5leHBvcnRzLmh0bWxEb21BcGkgPSB7XG4gICAgY3JlYXRlRWxlbWVudDogY3JlYXRlRWxlbWVudCxcbiAgICBjcmVhdGVFbGVtZW50TlM6IGNyZWF0ZUVsZW1lbnROUyxcbiAgICBjcmVhdGVUZXh0Tm9kZTogY3JlYXRlVGV4dE5vZGUsXG4gICAgY3JlYXRlQ29tbWVudDogY3JlYXRlQ29tbWVudCxcbiAgICBpbnNlcnRCZWZvcmU6IGluc2VydEJlZm9yZSxcbiAgICByZW1vdmVDaGlsZDogcmVtb3ZlQ2hpbGQsXG4gICAgYXBwZW5kQ2hpbGQ6IGFwcGVuZENoaWxkLFxuICAgIHBhcmVudE5vZGU6IHBhcmVudE5vZGUsXG4gICAgbmV4dFNpYmxpbmc6IG5leHRTaWJsaW5nLFxuICAgIHRhZ05hbWU6IHRhZ05hbWUsXG4gICAgc2V0VGV4dENvbnRlbnQ6IHNldFRleHRDb250ZW50LFxuICAgIGdldFRleHRDb250ZW50OiBnZXRUZXh0Q29udGVudCxcbiAgICBpc0VsZW1lbnQ6IGlzRWxlbWVudCxcbiAgICBpc1RleHQ6IGlzVGV4dCxcbiAgICBpc0NvbW1lbnQ6IGlzQ29tbWVudCxcbn07XG5leHBvcnRzLmRlZmF1bHQgPSBleHBvcnRzLmh0bWxEb21BcGk7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1odG1sZG9tYXBpLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5hcnJheSA9IEFycmF5LmlzQXJyYXk7XG5mdW5jdGlvbiBwcmltaXRpdmUocykge1xuICAgIHJldHVybiB0eXBlb2YgcyA9PT0gJ3N0cmluZycgfHwgdHlwZW9mIHMgPT09ICdudW1iZXInO1xufVxuZXhwb3J0cy5wcmltaXRpdmUgPSBwcmltaXRpdmU7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1pcy5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB4bGlua05TID0gJ2h0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsnO1xudmFyIHhtbE5TID0gJ2h0dHA6Ly93d3cudzMub3JnL1hNTC8xOTk4L25hbWVzcGFjZSc7XG52YXIgY29sb25DaGFyID0gNTg7XG52YXIgeENoYXIgPSAxMjA7XG5mdW5jdGlvbiB1cGRhdGVBdHRycyhvbGRWbm9kZSwgdm5vZGUpIHtcbiAgICB2YXIga2V5LCBlbG0gPSB2bm9kZS5lbG0sIG9sZEF0dHJzID0gb2xkVm5vZGUuZGF0YS5hdHRycywgYXR0cnMgPSB2bm9kZS5kYXRhLmF0dHJzO1xuICAgIGlmICghb2xkQXR0cnMgJiYgIWF0dHJzKVxuICAgICAgICByZXR1cm47XG4gICAgaWYgKG9sZEF0dHJzID09PSBhdHRycylcbiAgICAgICAgcmV0dXJuO1xuICAgIG9sZEF0dHJzID0gb2xkQXR0cnMgfHwge307XG4gICAgYXR0cnMgPSBhdHRycyB8fCB7fTtcbiAgICAvLyB1cGRhdGUgbW9kaWZpZWQgYXR0cmlidXRlcywgYWRkIG5ldyBhdHRyaWJ1dGVzXG4gICAgZm9yIChrZXkgaW4gYXR0cnMpIHtcbiAgICAgICAgdmFyIGN1ciA9IGF0dHJzW2tleV07XG4gICAgICAgIHZhciBvbGQgPSBvbGRBdHRyc1trZXldO1xuICAgICAgICBpZiAob2xkICE9PSBjdXIpIHtcbiAgICAgICAgICAgIGlmIChjdXIgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICBlbG0uc2V0QXR0cmlidXRlKGtleSwgXCJcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChjdXIgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgZWxtLnJlbW92ZUF0dHJpYnV0ZShrZXkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKGtleS5jaGFyQ29kZUF0KDApICE9PSB4Q2hhcikge1xuICAgICAgICAgICAgICAgICAgICBlbG0uc2V0QXR0cmlidXRlKGtleSwgY3VyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoa2V5LmNoYXJDb2RlQXQoMykgPT09IGNvbG9uQ2hhcikge1xuICAgICAgICAgICAgICAgICAgICAvLyBBc3N1bWUgeG1sIG5hbWVzcGFjZVxuICAgICAgICAgICAgICAgICAgICBlbG0uc2V0QXR0cmlidXRlTlMoeG1sTlMsIGtleSwgY3VyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoa2V5LmNoYXJDb2RlQXQoNSkgPT09IGNvbG9uQ2hhcikge1xuICAgICAgICAgICAgICAgICAgICAvLyBBc3N1bWUgeGxpbmsgbmFtZXNwYWNlXG4gICAgICAgICAgICAgICAgICAgIGVsbS5zZXRBdHRyaWJ1dGVOUyh4bGlua05TLCBrZXksIGN1cik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBlbG0uc2V0QXR0cmlidXRlKGtleSwgY3VyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgLy8gcmVtb3ZlIHJlbW92ZWQgYXR0cmlidXRlc1xuICAgIC8vIHVzZSBgaW5gIG9wZXJhdG9yIHNpbmNlIHRoZSBwcmV2aW91cyBgZm9yYCBpdGVyYXRpb24gdXNlcyBpdCAoLmkuZS4gYWRkIGV2ZW4gYXR0cmlidXRlcyB3aXRoIHVuZGVmaW5lZCB2YWx1ZSlcbiAgICAvLyB0aGUgb3RoZXIgb3B0aW9uIGlzIHRvIHJlbW92ZSBhbGwgYXR0cmlidXRlcyB3aXRoIHZhbHVlID09IHVuZGVmaW5lZFxuICAgIGZvciAoa2V5IGluIG9sZEF0dHJzKSB7XG4gICAgICAgIGlmICghKGtleSBpbiBhdHRycykpIHtcbiAgICAgICAgICAgIGVsbS5yZW1vdmVBdHRyaWJ1dGUoa2V5KTtcbiAgICAgICAgfVxuICAgIH1cbn1cbmV4cG9ydHMuYXR0cmlidXRlc01vZHVsZSA9IHsgY3JlYXRlOiB1cGRhdGVBdHRycywgdXBkYXRlOiB1cGRhdGVBdHRycyB9O1xuZXhwb3J0cy5kZWZhdWx0ID0gZXhwb3J0cy5hdHRyaWJ1dGVzTW9kdWxlO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9YXR0cmlidXRlcy5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmZ1bmN0aW9uIHVwZGF0ZUNsYXNzKG9sZFZub2RlLCB2bm9kZSkge1xuICAgIHZhciBjdXIsIG5hbWUsIGVsbSA9IHZub2RlLmVsbSwgb2xkQ2xhc3MgPSBvbGRWbm9kZS5kYXRhLmNsYXNzLCBrbGFzcyA9IHZub2RlLmRhdGEuY2xhc3M7XG4gICAgaWYgKCFvbGRDbGFzcyAmJiAha2xhc3MpXG4gICAgICAgIHJldHVybjtcbiAgICBpZiAob2xkQ2xhc3MgPT09IGtsYXNzKVxuICAgICAgICByZXR1cm47XG4gICAgb2xkQ2xhc3MgPSBvbGRDbGFzcyB8fCB7fTtcbiAgICBrbGFzcyA9IGtsYXNzIHx8IHt9O1xuICAgIGZvciAobmFtZSBpbiBvbGRDbGFzcykge1xuICAgICAgICBpZiAoIWtsYXNzW25hbWVdKSB7XG4gICAgICAgICAgICBlbG0uY2xhc3NMaXN0LnJlbW92ZShuYW1lKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBmb3IgKG5hbWUgaW4ga2xhc3MpIHtcbiAgICAgICAgY3VyID0ga2xhc3NbbmFtZV07XG4gICAgICAgIGlmIChjdXIgIT09IG9sZENsYXNzW25hbWVdKSB7XG4gICAgICAgICAgICBlbG0uY2xhc3NMaXN0W2N1ciA/ICdhZGQnIDogJ3JlbW92ZSddKG5hbWUpO1xuICAgICAgICB9XG4gICAgfVxufVxuZXhwb3J0cy5jbGFzc01vZHVsZSA9IHsgY3JlYXRlOiB1cGRhdGVDbGFzcywgdXBkYXRlOiB1cGRhdGVDbGFzcyB9O1xuZXhwb3J0cy5kZWZhdWx0ID0gZXhwb3J0cy5jbGFzc01vZHVsZTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWNsYXNzLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIENBUFNfUkVHRVggPSAvW0EtWl0vZztcbmZ1bmN0aW9uIHVwZGF0ZURhdGFzZXQob2xkVm5vZGUsIHZub2RlKSB7XG4gICAgdmFyIGVsbSA9IHZub2RlLmVsbSwgb2xkRGF0YXNldCA9IG9sZFZub2RlLmRhdGEuZGF0YXNldCwgZGF0YXNldCA9IHZub2RlLmRhdGEuZGF0YXNldCwga2V5O1xuICAgIGlmICghb2xkRGF0YXNldCAmJiAhZGF0YXNldClcbiAgICAgICAgcmV0dXJuO1xuICAgIGlmIChvbGREYXRhc2V0ID09PSBkYXRhc2V0KVxuICAgICAgICByZXR1cm47XG4gICAgb2xkRGF0YXNldCA9IG9sZERhdGFzZXQgfHwge307XG4gICAgZGF0YXNldCA9IGRhdGFzZXQgfHwge307XG4gICAgdmFyIGQgPSBlbG0uZGF0YXNldDtcbiAgICBmb3IgKGtleSBpbiBvbGREYXRhc2V0KSB7XG4gICAgICAgIGlmICghZGF0YXNldFtrZXldKSB7XG4gICAgICAgICAgICBpZiAoZCkge1xuICAgICAgICAgICAgICAgIGlmIChrZXkgaW4gZCkge1xuICAgICAgICAgICAgICAgICAgICBkZWxldGUgZFtrZXldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGVsbS5yZW1vdmVBdHRyaWJ1dGUoJ2RhdGEtJyArIGtleS5yZXBsYWNlKENBUFNfUkVHRVgsICctJCYnKS50b0xvd2VyQ2FzZSgpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBmb3IgKGtleSBpbiBkYXRhc2V0KSB7XG4gICAgICAgIGlmIChvbGREYXRhc2V0W2tleV0gIT09IGRhdGFzZXRba2V5XSkge1xuICAgICAgICAgICAgaWYgKGQpIHtcbiAgICAgICAgICAgICAgICBkW2tleV0gPSBkYXRhc2V0W2tleV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBlbG0uc2V0QXR0cmlidXRlKCdkYXRhLScgKyBrZXkucmVwbGFjZShDQVBTX1JFR0VYLCAnLSQmJykudG9Mb3dlckNhc2UoKSwgZGF0YXNldFtrZXldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cbmV4cG9ydHMuZGF0YXNldE1vZHVsZSA9IHsgY3JlYXRlOiB1cGRhdGVEYXRhc2V0LCB1cGRhdGU6IHVwZGF0ZURhdGFzZXQgfTtcbmV4cG9ydHMuZGVmYXVsdCA9IGV4cG9ydHMuZGF0YXNldE1vZHVsZTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGFzZXQuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5mdW5jdGlvbiB1cGRhdGVQcm9wcyhvbGRWbm9kZSwgdm5vZGUpIHtcbiAgICB2YXIga2V5LCBjdXIsIG9sZCwgZWxtID0gdm5vZGUuZWxtLCBvbGRQcm9wcyA9IG9sZFZub2RlLmRhdGEucHJvcHMsIHByb3BzID0gdm5vZGUuZGF0YS5wcm9wcztcbiAgICBpZiAoIW9sZFByb3BzICYmICFwcm9wcylcbiAgICAgICAgcmV0dXJuO1xuICAgIGlmIChvbGRQcm9wcyA9PT0gcHJvcHMpXG4gICAgICAgIHJldHVybjtcbiAgICBvbGRQcm9wcyA9IG9sZFByb3BzIHx8IHt9O1xuICAgIHByb3BzID0gcHJvcHMgfHwge307XG4gICAgZm9yIChrZXkgaW4gb2xkUHJvcHMpIHtcbiAgICAgICAgaWYgKCFwcm9wc1trZXldKSB7XG4gICAgICAgICAgICBkZWxldGUgZWxtW2tleV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgZm9yIChrZXkgaW4gcHJvcHMpIHtcbiAgICAgICAgY3VyID0gcHJvcHNba2V5XTtcbiAgICAgICAgb2xkID0gb2xkUHJvcHNba2V5XTtcbiAgICAgICAgaWYgKG9sZCAhPT0gY3VyICYmIChrZXkgIT09ICd2YWx1ZScgfHwgZWxtW2tleV0gIT09IGN1cikpIHtcbiAgICAgICAgICAgIGVsbVtrZXldID0gY3VyO1xuICAgICAgICB9XG4gICAgfVxufVxuZXhwb3J0cy5wcm9wc01vZHVsZSA9IHsgY3JlYXRlOiB1cGRhdGVQcm9wcywgdXBkYXRlOiB1cGRhdGVQcm9wcyB9O1xuZXhwb3J0cy5kZWZhdWx0ID0gZXhwb3J0cy5wcm9wc01vZHVsZTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXByb3BzLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHJhZiA9ICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKSB8fCBzZXRUaW1lb3V0O1xudmFyIG5leHRGcmFtZSA9IGZ1bmN0aW9uIChmbikgeyByYWYoZnVuY3Rpb24gKCkgeyByYWYoZm4pOyB9KTsgfTtcbmZ1bmN0aW9uIHNldE5leHRGcmFtZShvYmosIHByb3AsIHZhbCkge1xuICAgIG5leHRGcmFtZShmdW5jdGlvbiAoKSB7IG9ialtwcm9wXSA9IHZhbDsgfSk7XG59XG5mdW5jdGlvbiB1cGRhdGVTdHlsZShvbGRWbm9kZSwgdm5vZGUpIHtcbiAgICB2YXIgY3VyLCBuYW1lLCBlbG0gPSB2bm9kZS5lbG0sIG9sZFN0eWxlID0gb2xkVm5vZGUuZGF0YS5zdHlsZSwgc3R5bGUgPSB2bm9kZS5kYXRhLnN0eWxlO1xuICAgIGlmICghb2xkU3R5bGUgJiYgIXN0eWxlKVxuICAgICAgICByZXR1cm47XG4gICAgaWYgKG9sZFN0eWxlID09PSBzdHlsZSlcbiAgICAgICAgcmV0dXJuO1xuICAgIG9sZFN0eWxlID0gb2xkU3R5bGUgfHwge307XG4gICAgc3R5bGUgPSBzdHlsZSB8fCB7fTtcbiAgICB2YXIgb2xkSGFzRGVsID0gJ2RlbGF5ZWQnIGluIG9sZFN0eWxlO1xuICAgIGZvciAobmFtZSBpbiBvbGRTdHlsZSkge1xuICAgICAgICBpZiAoIXN0eWxlW25hbWVdKSB7XG4gICAgICAgICAgICBpZiAobmFtZVswXSA9PT0gJy0nICYmIG5hbWVbMV0gPT09ICctJykge1xuICAgICAgICAgICAgICAgIGVsbS5zdHlsZS5yZW1vdmVQcm9wZXJ0eShuYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGVsbS5zdHlsZVtuYW1lXSA9ICcnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGZvciAobmFtZSBpbiBzdHlsZSkge1xuICAgICAgICBjdXIgPSBzdHlsZVtuYW1lXTtcbiAgICAgICAgaWYgKG5hbWUgPT09ICdkZWxheWVkJyAmJiBzdHlsZS5kZWxheWVkKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBuYW1lMiBpbiBzdHlsZS5kZWxheWVkKSB7XG4gICAgICAgICAgICAgICAgY3VyID0gc3R5bGUuZGVsYXllZFtuYW1lMl07XG4gICAgICAgICAgICAgICAgaWYgKCFvbGRIYXNEZWwgfHwgY3VyICE9PSBvbGRTdHlsZS5kZWxheWVkW25hbWUyXSkge1xuICAgICAgICAgICAgICAgICAgICBzZXROZXh0RnJhbWUoZWxtLnN0eWxlLCBuYW1lMiwgY3VyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAobmFtZSAhPT0gJ3JlbW92ZScgJiYgY3VyICE9PSBvbGRTdHlsZVtuYW1lXSkge1xuICAgICAgICAgICAgaWYgKG5hbWVbMF0gPT09ICctJyAmJiBuYW1lWzFdID09PSAnLScpIHtcbiAgICAgICAgICAgICAgICBlbG0uc3R5bGUuc2V0UHJvcGVydHkobmFtZSwgY3VyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGVsbS5zdHlsZVtuYW1lXSA9IGN1cjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cbmZ1bmN0aW9uIGFwcGx5RGVzdHJveVN0eWxlKHZub2RlKSB7XG4gICAgdmFyIHN0eWxlLCBuYW1lLCBlbG0gPSB2bm9kZS5lbG0sIHMgPSB2bm9kZS5kYXRhLnN0eWxlO1xuICAgIGlmICghcyB8fCAhKHN0eWxlID0gcy5kZXN0cm95KSlcbiAgICAgICAgcmV0dXJuO1xuICAgIGZvciAobmFtZSBpbiBzdHlsZSkge1xuICAgICAgICBlbG0uc3R5bGVbbmFtZV0gPSBzdHlsZVtuYW1lXTtcbiAgICB9XG59XG5mdW5jdGlvbiBhcHBseVJlbW92ZVN0eWxlKHZub2RlLCBybSkge1xuICAgIHZhciBzID0gdm5vZGUuZGF0YS5zdHlsZTtcbiAgICBpZiAoIXMgfHwgIXMucmVtb3ZlKSB7XG4gICAgICAgIHJtKCk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIG5hbWUsIGVsbSA9IHZub2RlLmVsbSwgaSA9IDAsIGNvbXBTdHlsZSwgc3R5bGUgPSBzLnJlbW92ZSwgYW1vdW50ID0gMCwgYXBwbGllZCA9IFtdO1xuICAgIGZvciAobmFtZSBpbiBzdHlsZSkge1xuICAgICAgICBhcHBsaWVkLnB1c2gobmFtZSk7XG4gICAgICAgIGVsbS5zdHlsZVtuYW1lXSA9IHN0eWxlW25hbWVdO1xuICAgIH1cbiAgICBjb21wU3R5bGUgPSBnZXRDb21wdXRlZFN0eWxlKGVsbSk7XG4gICAgdmFyIHByb3BzID0gY29tcFN0eWxlWyd0cmFuc2l0aW9uLXByb3BlcnR5J10uc3BsaXQoJywgJyk7XG4gICAgZm9yICg7IGkgPCBwcm9wcy5sZW5ndGg7ICsraSkge1xuICAgICAgICBpZiAoYXBwbGllZC5pbmRleE9mKHByb3BzW2ldKSAhPT0gLTEpXG4gICAgICAgICAgICBhbW91bnQrKztcbiAgICB9XG4gICAgZWxtLmFkZEV2ZW50TGlzdGVuZXIoJ3RyYW5zaXRpb25lbmQnLCBmdW5jdGlvbiAoZXYpIHtcbiAgICAgICAgaWYgKGV2LnRhcmdldCA9PT0gZWxtKVxuICAgICAgICAgICAgLS1hbW91bnQ7XG4gICAgICAgIGlmIChhbW91bnQgPT09IDApXG4gICAgICAgICAgICBybSgpO1xuICAgIH0pO1xufVxuZXhwb3J0cy5zdHlsZU1vZHVsZSA9IHtcbiAgICBjcmVhdGU6IHVwZGF0ZVN0eWxlLFxuICAgIHVwZGF0ZTogdXBkYXRlU3R5bGUsXG4gICAgZGVzdHJveTogYXBwbHlEZXN0cm95U3R5bGUsXG4gICAgcmVtb3ZlOiBhcHBseVJlbW92ZVN0eWxlXG59O1xuZXhwb3J0cy5kZWZhdWx0ID0gZXhwb3J0cy5zdHlsZU1vZHVsZTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXN0eWxlLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHZub2RlXzEgPSByZXF1aXJlKFwiLi92bm9kZVwiKTtcbnZhciBpcyA9IHJlcXVpcmUoXCIuL2lzXCIpO1xudmFyIGh0bWxkb21hcGlfMSA9IHJlcXVpcmUoXCIuL2h0bWxkb21hcGlcIik7XG5mdW5jdGlvbiBpc1VuZGVmKHMpIHsgcmV0dXJuIHMgPT09IHVuZGVmaW5lZDsgfVxuZnVuY3Rpb24gaXNEZWYocykgeyByZXR1cm4gcyAhPT0gdW5kZWZpbmVkOyB9XG52YXIgZW1wdHlOb2RlID0gdm5vZGVfMS5kZWZhdWx0KCcnLCB7fSwgW10sIHVuZGVmaW5lZCwgdW5kZWZpbmVkKTtcbmZ1bmN0aW9uIHNhbWVWbm9kZSh2bm9kZTEsIHZub2RlMikge1xuICAgIHJldHVybiB2bm9kZTEua2V5ID09PSB2bm9kZTIua2V5ICYmIHZub2RlMS5zZWwgPT09IHZub2RlMi5zZWw7XG59XG5mdW5jdGlvbiBpc1Zub2RlKHZub2RlKSB7XG4gICAgcmV0dXJuIHZub2RlLnNlbCAhPT0gdW5kZWZpbmVkO1xufVxuZnVuY3Rpb24gY3JlYXRlS2V5VG9PbGRJZHgoY2hpbGRyZW4sIGJlZ2luSWR4LCBlbmRJZHgpIHtcbiAgICB2YXIgaSwgbWFwID0ge30sIGtleSwgY2g7XG4gICAgZm9yIChpID0gYmVnaW5JZHg7IGkgPD0gZW5kSWR4OyArK2kpIHtcbiAgICAgICAgY2ggPSBjaGlsZHJlbltpXTtcbiAgICAgICAgaWYgKGNoICE9IG51bGwpIHtcbiAgICAgICAgICAgIGtleSA9IGNoLmtleTtcbiAgICAgICAgICAgIGlmIChrZXkgIT09IHVuZGVmaW5lZClcbiAgICAgICAgICAgICAgICBtYXBba2V5XSA9IGk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG1hcDtcbn1cbnZhciBob29rcyA9IFsnY3JlYXRlJywgJ3VwZGF0ZScsICdyZW1vdmUnLCAnZGVzdHJveScsICdwcmUnLCAncG9zdCddO1xudmFyIGhfMSA9IHJlcXVpcmUoXCIuL2hcIik7XG5leHBvcnRzLmggPSBoXzEuaDtcbnZhciB0aHVua18xID0gcmVxdWlyZShcIi4vdGh1bmtcIik7XG5leHBvcnRzLnRodW5rID0gdGh1bmtfMS50aHVuaztcbmZ1bmN0aW9uIGluaXQobW9kdWxlcywgZG9tQXBpKSB7XG4gICAgdmFyIGksIGosIGNicyA9IHt9O1xuICAgIHZhciBhcGkgPSBkb21BcGkgIT09IHVuZGVmaW5lZCA/IGRvbUFwaSA6IGh0bWxkb21hcGlfMS5kZWZhdWx0O1xuICAgIGZvciAoaSA9IDA7IGkgPCBob29rcy5sZW5ndGg7ICsraSkge1xuICAgICAgICBjYnNbaG9va3NbaV1dID0gW107XG4gICAgICAgIGZvciAoaiA9IDA7IGogPCBtb2R1bGVzLmxlbmd0aDsgKytqKSB7XG4gICAgICAgICAgICB2YXIgaG9vayA9IG1vZHVsZXNbal1baG9va3NbaV1dO1xuICAgICAgICAgICAgaWYgKGhvb2sgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIGNic1tob29rc1tpXV0ucHVzaChob29rKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBmdW5jdGlvbiBlbXB0eU5vZGVBdChlbG0pIHtcbiAgICAgICAgdmFyIGlkID0gZWxtLmlkID8gJyMnICsgZWxtLmlkIDogJyc7XG4gICAgICAgIHZhciBjID0gZWxtLmNsYXNzTmFtZSA/ICcuJyArIGVsbS5jbGFzc05hbWUuc3BsaXQoJyAnKS5qb2luKCcuJykgOiAnJztcbiAgICAgICAgcmV0dXJuIHZub2RlXzEuZGVmYXVsdChhcGkudGFnTmFtZShlbG0pLnRvTG93ZXJDYXNlKCkgKyBpZCArIGMsIHt9LCBbXSwgdW5kZWZpbmVkLCBlbG0pO1xuICAgIH1cbiAgICBmdW5jdGlvbiBjcmVhdGVSbUNiKGNoaWxkRWxtLCBsaXN0ZW5lcnMpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIHJtQ2IoKSB7XG4gICAgICAgICAgICBpZiAoLS1saXN0ZW5lcnMgPT09IDApIHtcbiAgICAgICAgICAgICAgICB2YXIgcGFyZW50XzEgPSBhcGkucGFyZW50Tm9kZShjaGlsZEVsbSk7XG4gICAgICAgICAgICAgICAgYXBpLnJlbW92ZUNoaWxkKHBhcmVudF8xLCBjaGlsZEVsbSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuICAgIGZ1bmN0aW9uIGNyZWF0ZUVsbSh2bm9kZSwgaW5zZXJ0ZWRWbm9kZVF1ZXVlKSB7XG4gICAgICAgIHZhciBpLCBkYXRhID0gdm5vZGUuZGF0YTtcbiAgICAgICAgaWYgKGRhdGEgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgaWYgKGlzRGVmKGkgPSBkYXRhLmhvb2spICYmIGlzRGVmKGkgPSBpLmluaXQpKSB7XG4gICAgICAgICAgICAgICAgaSh2bm9kZSk7XG4gICAgICAgICAgICAgICAgZGF0YSA9IHZub2RlLmRhdGE7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGNoaWxkcmVuID0gdm5vZGUuY2hpbGRyZW4sIHNlbCA9IHZub2RlLnNlbDtcbiAgICAgICAgaWYgKHNlbCA9PT0gJyEnKSB7XG4gICAgICAgICAgICBpZiAoaXNVbmRlZih2bm9kZS50ZXh0KSkge1xuICAgICAgICAgICAgICAgIHZub2RlLnRleHQgPSAnJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZub2RlLmVsbSA9IGFwaS5jcmVhdGVDb21tZW50KHZub2RlLnRleHQpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHNlbCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAvLyBQYXJzZSBzZWxlY3RvclxuICAgICAgICAgICAgdmFyIGhhc2hJZHggPSBzZWwuaW5kZXhPZignIycpO1xuICAgICAgICAgICAgdmFyIGRvdElkeCA9IHNlbC5pbmRleE9mKCcuJywgaGFzaElkeCk7XG4gICAgICAgICAgICB2YXIgaGFzaCA9IGhhc2hJZHggPiAwID8gaGFzaElkeCA6IHNlbC5sZW5ndGg7XG4gICAgICAgICAgICB2YXIgZG90ID0gZG90SWR4ID4gMCA/IGRvdElkeCA6IHNlbC5sZW5ndGg7XG4gICAgICAgICAgICB2YXIgdGFnID0gaGFzaElkeCAhPT0gLTEgfHwgZG90SWR4ICE9PSAtMSA/IHNlbC5zbGljZSgwLCBNYXRoLm1pbihoYXNoLCBkb3QpKSA6IHNlbDtcbiAgICAgICAgICAgIHZhciBlbG0gPSB2bm9kZS5lbG0gPSBpc0RlZihkYXRhKSAmJiBpc0RlZihpID0gZGF0YS5ucykgPyBhcGkuY3JlYXRlRWxlbWVudE5TKGksIHRhZylcbiAgICAgICAgICAgICAgICA6IGFwaS5jcmVhdGVFbGVtZW50KHRhZyk7XG4gICAgICAgICAgICBpZiAoaGFzaCA8IGRvdClcbiAgICAgICAgICAgICAgICBlbG0uc2V0QXR0cmlidXRlKCdpZCcsIHNlbC5zbGljZShoYXNoICsgMSwgZG90KSk7XG4gICAgICAgICAgICBpZiAoZG90SWR4ID4gMClcbiAgICAgICAgICAgICAgICBlbG0uc2V0QXR0cmlidXRlKCdjbGFzcycsIHNlbC5zbGljZShkb3QgKyAxKS5yZXBsYWNlKC9cXC4vZywgJyAnKSk7XG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgY2JzLmNyZWF0ZS5sZW5ndGg7ICsraSlcbiAgICAgICAgICAgICAgICBjYnMuY3JlYXRlW2ldKGVtcHR5Tm9kZSwgdm5vZGUpO1xuICAgICAgICAgICAgaWYgKGlzLmFycmF5KGNoaWxkcmVuKSkge1xuICAgICAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY2ggPSBjaGlsZHJlbltpXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNoICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFwaS5hcHBlbmRDaGlsZChlbG0sIGNyZWF0ZUVsbShjaCwgaW5zZXJ0ZWRWbm9kZVF1ZXVlKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChpcy5wcmltaXRpdmUodm5vZGUudGV4dCkpIHtcbiAgICAgICAgICAgICAgICBhcGkuYXBwZW5kQ2hpbGQoZWxtLCBhcGkuY3JlYXRlVGV4dE5vZGUodm5vZGUudGV4dCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaSA9IHZub2RlLmRhdGEuaG9vazsgLy8gUmV1c2UgdmFyaWFibGVcbiAgICAgICAgICAgIGlmIChpc0RlZihpKSkge1xuICAgICAgICAgICAgICAgIGlmIChpLmNyZWF0ZSlcbiAgICAgICAgICAgICAgICAgICAgaS5jcmVhdGUoZW1wdHlOb2RlLCB2bm9kZSk7XG4gICAgICAgICAgICAgICAgaWYgKGkuaW5zZXJ0KVxuICAgICAgICAgICAgICAgICAgICBpbnNlcnRlZFZub2RlUXVldWUucHVzaCh2bm9kZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB2bm9kZS5lbG0gPSBhcGkuY3JlYXRlVGV4dE5vZGUodm5vZGUudGV4dCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHZub2RlLmVsbTtcbiAgICB9XG4gICAgZnVuY3Rpb24gYWRkVm5vZGVzKHBhcmVudEVsbSwgYmVmb3JlLCB2bm9kZXMsIHN0YXJ0SWR4LCBlbmRJZHgsIGluc2VydGVkVm5vZGVRdWV1ZSkge1xuICAgICAgICBmb3IgKDsgc3RhcnRJZHggPD0gZW5kSWR4OyArK3N0YXJ0SWR4KSB7XG4gICAgICAgICAgICB2YXIgY2ggPSB2bm9kZXNbc3RhcnRJZHhdO1xuICAgICAgICAgICAgaWYgKGNoICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBhcGkuaW5zZXJ0QmVmb3JlKHBhcmVudEVsbSwgY3JlYXRlRWxtKGNoLCBpbnNlcnRlZFZub2RlUXVldWUpLCBiZWZvcmUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIGludm9rZURlc3Ryb3lIb29rKHZub2RlKSB7XG4gICAgICAgIHZhciBpLCBqLCBkYXRhID0gdm5vZGUuZGF0YTtcbiAgICAgICAgaWYgKGRhdGEgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgaWYgKGlzRGVmKGkgPSBkYXRhLmhvb2spICYmIGlzRGVmKGkgPSBpLmRlc3Ryb3kpKVxuICAgICAgICAgICAgICAgIGkodm5vZGUpO1xuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGNicy5kZXN0cm95Lmxlbmd0aDsgKytpKVxuICAgICAgICAgICAgICAgIGNicy5kZXN0cm95W2ldKHZub2RlKTtcbiAgICAgICAgICAgIGlmICh2bm9kZS5jaGlsZHJlbiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgZm9yIChqID0gMDsgaiA8IHZub2RlLmNoaWxkcmVuLmxlbmd0aDsgKytqKSB7XG4gICAgICAgICAgICAgICAgICAgIGkgPSB2bm9kZS5jaGlsZHJlbltqXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGkgIT0gbnVsbCAmJiB0eXBlb2YgaSAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgaW52b2tlRGVzdHJveUhvb2soaSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgZnVuY3Rpb24gcmVtb3ZlVm5vZGVzKHBhcmVudEVsbSwgdm5vZGVzLCBzdGFydElkeCwgZW5kSWR4KSB7XG4gICAgICAgIGZvciAoOyBzdGFydElkeCA8PSBlbmRJZHg7ICsrc3RhcnRJZHgpIHtcbiAgICAgICAgICAgIHZhciBpXzEgPSB2b2lkIDAsIGxpc3RlbmVycyA9IHZvaWQgMCwgcm0gPSB2b2lkIDAsIGNoID0gdm5vZGVzW3N0YXJ0SWR4XTtcbiAgICAgICAgICAgIGlmIChjaCAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgaWYgKGlzRGVmKGNoLnNlbCkpIHtcbiAgICAgICAgICAgICAgICAgICAgaW52b2tlRGVzdHJveUhvb2soY2gpO1xuICAgICAgICAgICAgICAgICAgICBsaXN0ZW5lcnMgPSBjYnMucmVtb3ZlLmxlbmd0aCArIDE7XG4gICAgICAgICAgICAgICAgICAgIHJtID0gY3JlYXRlUm1DYihjaC5lbG0sIGxpc3RlbmVycyk7XG4gICAgICAgICAgICAgICAgICAgIGZvciAoaV8xID0gMDsgaV8xIDwgY2JzLnJlbW92ZS5sZW5ndGg7ICsraV8xKVxuICAgICAgICAgICAgICAgICAgICAgICAgY2JzLnJlbW92ZVtpXzFdKGNoLCBybSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpc0RlZihpXzEgPSBjaC5kYXRhKSAmJiBpc0RlZihpXzEgPSBpXzEuaG9vaykgJiYgaXNEZWYoaV8xID0gaV8xLnJlbW92ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlfMShjaCwgcm0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcm0oKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgYXBpLnJlbW92ZUNoaWxkKHBhcmVudEVsbSwgY2guZWxtKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgZnVuY3Rpb24gdXBkYXRlQ2hpbGRyZW4ocGFyZW50RWxtLCBvbGRDaCwgbmV3Q2gsIGluc2VydGVkVm5vZGVRdWV1ZSkge1xuICAgICAgICB2YXIgb2xkU3RhcnRJZHggPSAwLCBuZXdTdGFydElkeCA9IDA7XG4gICAgICAgIHZhciBvbGRFbmRJZHggPSBvbGRDaC5sZW5ndGggLSAxO1xuICAgICAgICB2YXIgb2xkU3RhcnRWbm9kZSA9IG9sZENoWzBdO1xuICAgICAgICB2YXIgb2xkRW5kVm5vZGUgPSBvbGRDaFtvbGRFbmRJZHhdO1xuICAgICAgICB2YXIgbmV3RW5kSWR4ID0gbmV3Q2gubGVuZ3RoIC0gMTtcbiAgICAgICAgdmFyIG5ld1N0YXJ0Vm5vZGUgPSBuZXdDaFswXTtcbiAgICAgICAgdmFyIG5ld0VuZFZub2RlID0gbmV3Q2hbbmV3RW5kSWR4XTtcbiAgICAgICAgdmFyIG9sZEtleVRvSWR4O1xuICAgICAgICB2YXIgaWR4SW5PbGQ7XG4gICAgICAgIHZhciBlbG1Ub01vdmU7XG4gICAgICAgIHZhciBiZWZvcmU7XG4gICAgICAgIHdoaWxlIChvbGRTdGFydElkeCA8PSBvbGRFbmRJZHggJiYgbmV3U3RhcnRJZHggPD0gbmV3RW5kSWR4KSB7XG4gICAgICAgICAgICBpZiAob2xkU3RhcnRWbm9kZSA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgb2xkU3RhcnRWbm9kZSA9IG9sZENoWysrb2xkU3RhcnRJZHhdOyAvLyBWbm9kZSBtaWdodCBoYXZlIGJlZW4gbW92ZWQgbGVmdFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAob2xkRW5kVm5vZGUgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIG9sZEVuZFZub2RlID0gb2xkQ2hbLS1vbGRFbmRJZHhdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAobmV3U3RhcnRWbm9kZSA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgbmV3U3RhcnRWbm9kZSA9IG5ld0NoWysrbmV3U3RhcnRJZHhdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAobmV3RW5kVm5vZGUgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIG5ld0VuZFZub2RlID0gbmV3Q2hbLS1uZXdFbmRJZHhdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoc2FtZVZub2RlKG9sZFN0YXJ0Vm5vZGUsIG5ld1N0YXJ0Vm5vZGUpKSB7XG4gICAgICAgICAgICAgICAgcGF0Y2hWbm9kZShvbGRTdGFydFZub2RlLCBuZXdTdGFydFZub2RlLCBpbnNlcnRlZFZub2RlUXVldWUpO1xuICAgICAgICAgICAgICAgIG9sZFN0YXJ0Vm5vZGUgPSBvbGRDaFsrK29sZFN0YXJ0SWR4XTtcbiAgICAgICAgICAgICAgICBuZXdTdGFydFZub2RlID0gbmV3Q2hbKytuZXdTdGFydElkeF07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChzYW1lVm5vZGUob2xkRW5kVm5vZGUsIG5ld0VuZFZub2RlKSkge1xuICAgICAgICAgICAgICAgIHBhdGNoVm5vZGUob2xkRW5kVm5vZGUsIG5ld0VuZFZub2RlLCBpbnNlcnRlZFZub2RlUXVldWUpO1xuICAgICAgICAgICAgICAgIG9sZEVuZFZub2RlID0gb2xkQ2hbLS1vbGRFbmRJZHhdO1xuICAgICAgICAgICAgICAgIG5ld0VuZFZub2RlID0gbmV3Q2hbLS1uZXdFbmRJZHhdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoc2FtZVZub2RlKG9sZFN0YXJ0Vm5vZGUsIG5ld0VuZFZub2RlKSkge1xuICAgICAgICAgICAgICAgIHBhdGNoVm5vZGUob2xkU3RhcnRWbm9kZSwgbmV3RW5kVm5vZGUsIGluc2VydGVkVm5vZGVRdWV1ZSk7XG4gICAgICAgICAgICAgICAgYXBpLmluc2VydEJlZm9yZShwYXJlbnRFbG0sIG9sZFN0YXJ0Vm5vZGUuZWxtLCBhcGkubmV4dFNpYmxpbmcob2xkRW5kVm5vZGUuZWxtKSk7XG4gICAgICAgICAgICAgICAgb2xkU3RhcnRWbm9kZSA9IG9sZENoWysrb2xkU3RhcnRJZHhdO1xuICAgICAgICAgICAgICAgIG5ld0VuZFZub2RlID0gbmV3Q2hbLS1uZXdFbmRJZHhdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoc2FtZVZub2RlKG9sZEVuZFZub2RlLCBuZXdTdGFydFZub2RlKSkge1xuICAgICAgICAgICAgICAgIHBhdGNoVm5vZGUob2xkRW5kVm5vZGUsIG5ld1N0YXJ0Vm5vZGUsIGluc2VydGVkVm5vZGVRdWV1ZSk7XG4gICAgICAgICAgICAgICAgYXBpLmluc2VydEJlZm9yZShwYXJlbnRFbG0sIG9sZEVuZFZub2RlLmVsbSwgb2xkU3RhcnRWbm9kZS5lbG0pO1xuICAgICAgICAgICAgICAgIG9sZEVuZFZub2RlID0gb2xkQ2hbLS1vbGRFbmRJZHhdO1xuICAgICAgICAgICAgICAgIG5ld1N0YXJ0Vm5vZGUgPSBuZXdDaFsrK25ld1N0YXJ0SWR4XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChvbGRLZXlUb0lkeCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIG9sZEtleVRvSWR4ID0gY3JlYXRlS2V5VG9PbGRJZHgob2xkQ2gsIG9sZFN0YXJ0SWR4LCBvbGRFbmRJZHgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZHhJbk9sZCA9IG9sZEtleVRvSWR4W25ld1N0YXJ0Vm5vZGUua2V5XTtcbiAgICAgICAgICAgICAgICBpZiAoaXNVbmRlZihpZHhJbk9sZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgYXBpLmluc2VydEJlZm9yZShwYXJlbnRFbG0sIGNyZWF0ZUVsbShuZXdTdGFydFZub2RlLCBpbnNlcnRlZFZub2RlUXVldWUpLCBvbGRTdGFydFZub2RlLmVsbSk7XG4gICAgICAgICAgICAgICAgICAgIG5ld1N0YXJ0Vm5vZGUgPSBuZXdDaFsrK25ld1N0YXJ0SWR4XTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGVsbVRvTW92ZSA9IG9sZENoW2lkeEluT2xkXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVsbVRvTW92ZS5zZWwgIT09IG5ld1N0YXJ0Vm5vZGUuc2VsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhcGkuaW5zZXJ0QmVmb3JlKHBhcmVudEVsbSwgY3JlYXRlRWxtKG5ld1N0YXJ0Vm5vZGUsIGluc2VydGVkVm5vZGVRdWV1ZSksIG9sZFN0YXJ0Vm5vZGUuZWxtKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdGNoVm5vZGUoZWxtVG9Nb3ZlLCBuZXdTdGFydFZub2RlLCBpbnNlcnRlZFZub2RlUXVldWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgb2xkQ2hbaWR4SW5PbGRdID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgICAgICAgICAgYXBpLmluc2VydEJlZm9yZShwYXJlbnRFbG0sIGVsbVRvTW92ZS5lbG0sIG9sZFN0YXJ0Vm5vZGUuZWxtKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBuZXdTdGFydFZub2RlID0gbmV3Q2hbKytuZXdTdGFydElkeF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChvbGRTdGFydElkeCA+IG9sZEVuZElkeCkge1xuICAgICAgICAgICAgYmVmb3JlID0gbmV3Q2hbbmV3RW5kSWR4ICsgMV0gPT0gbnVsbCA/IG51bGwgOiBuZXdDaFtuZXdFbmRJZHggKyAxXS5lbG07XG4gICAgICAgICAgICBhZGRWbm9kZXMocGFyZW50RWxtLCBiZWZvcmUsIG5ld0NoLCBuZXdTdGFydElkeCwgbmV3RW5kSWR4LCBpbnNlcnRlZFZub2RlUXVldWUpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKG5ld1N0YXJ0SWR4ID4gbmV3RW5kSWR4KSB7XG4gICAgICAgICAgICByZW1vdmVWbm9kZXMocGFyZW50RWxtLCBvbGRDaCwgb2xkU3RhcnRJZHgsIG9sZEVuZElkeCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZnVuY3Rpb24gcGF0Y2hWbm9kZShvbGRWbm9kZSwgdm5vZGUsIGluc2VydGVkVm5vZGVRdWV1ZSkge1xuICAgICAgICB2YXIgaSwgaG9vaztcbiAgICAgICAgaWYgKGlzRGVmKGkgPSB2bm9kZS5kYXRhKSAmJiBpc0RlZihob29rID0gaS5ob29rKSAmJiBpc0RlZihpID0gaG9vay5wcmVwYXRjaCkpIHtcbiAgICAgICAgICAgIGkob2xkVm5vZGUsIHZub2RlKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgZWxtID0gdm5vZGUuZWxtID0gb2xkVm5vZGUuZWxtO1xuICAgICAgICB2YXIgb2xkQ2ggPSBvbGRWbm9kZS5jaGlsZHJlbjtcbiAgICAgICAgdmFyIGNoID0gdm5vZGUuY2hpbGRyZW47XG4gICAgICAgIGlmIChvbGRWbm9kZSA9PT0gdm5vZGUpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGlmICh2bm9kZS5kYXRhICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBjYnMudXBkYXRlLmxlbmd0aDsgKytpKVxuICAgICAgICAgICAgICAgIGNicy51cGRhdGVbaV0ob2xkVm5vZGUsIHZub2RlKTtcbiAgICAgICAgICAgIGkgPSB2bm9kZS5kYXRhLmhvb2s7XG4gICAgICAgICAgICBpZiAoaXNEZWYoaSkgJiYgaXNEZWYoaSA9IGkudXBkYXRlKSlcbiAgICAgICAgICAgICAgICBpKG9sZFZub2RlLCB2bm9kZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlzVW5kZWYodm5vZGUudGV4dCkpIHtcbiAgICAgICAgICAgIGlmIChpc0RlZihvbGRDaCkgJiYgaXNEZWYoY2gpKSB7XG4gICAgICAgICAgICAgICAgaWYgKG9sZENoICE9PSBjaClcbiAgICAgICAgICAgICAgICAgICAgdXBkYXRlQ2hpbGRyZW4oZWxtLCBvbGRDaCwgY2gsIGluc2VydGVkVm5vZGVRdWV1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChpc0RlZihjaCkpIHtcbiAgICAgICAgICAgICAgICBpZiAoaXNEZWYob2xkVm5vZGUudGV4dCkpXG4gICAgICAgICAgICAgICAgICAgIGFwaS5zZXRUZXh0Q29udGVudChlbG0sICcnKTtcbiAgICAgICAgICAgICAgICBhZGRWbm9kZXMoZWxtLCBudWxsLCBjaCwgMCwgY2gubGVuZ3RoIC0gMSwgaW5zZXJ0ZWRWbm9kZVF1ZXVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGlzRGVmKG9sZENoKSkge1xuICAgICAgICAgICAgICAgIHJlbW92ZVZub2RlcyhlbG0sIG9sZENoLCAwLCBvbGRDaC5sZW5ndGggLSAxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGlzRGVmKG9sZFZub2RlLnRleHQpKSB7XG4gICAgICAgICAgICAgICAgYXBpLnNldFRleHRDb250ZW50KGVsbSwgJycpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKG9sZFZub2RlLnRleHQgIT09IHZub2RlLnRleHQpIHtcbiAgICAgICAgICAgIGFwaS5zZXRUZXh0Q29udGVudChlbG0sIHZub2RlLnRleHQpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpc0RlZihob29rKSAmJiBpc0RlZihpID0gaG9vay5wb3N0cGF0Y2gpKSB7XG4gICAgICAgICAgICBpKG9sZFZub2RlLCB2bm9kZSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZ1bmN0aW9uIHBhdGNoKG9sZFZub2RlLCB2bm9kZSkge1xuICAgICAgICB2YXIgaSwgZWxtLCBwYXJlbnQ7XG4gICAgICAgIHZhciBpbnNlcnRlZFZub2RlUXVldWUgPSBbXTtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGNicy5wcmUubGVuZ3RoOyArK2kpXG4gICAgICAgICAgICBjYnMucHJlW2ldKCk7XG4gICAgICAgIGlmICghaXNWbm9kZShvbGRWbm9kZSkpIHtcbiAgICAgICAgICAgIG9sZFZub2RlID0gZW1wdHlOb2RlQXQob2xkVm5vZGUpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzYW1lVm5vZGUob2xkVm5vZGUsIHZub2RlKSkge1xuICAgICAgICAgICAgcGF0Y2hWbm9kZShvbGRWbm9kZSwgdm5vZGUsIGluc2VydGVkVm5vZGVRdWV1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBlbG0gPSBvbGRWbm9kZS5lbG07XG4gICAgICAgICAgICBwYXJlbnQgPSBhcGkucGFyZW50Tm9kZShlbG0pO1xuICAgICAgICAgICAgY3JlYXRlRWxtKHZub2RlLCBpbnNlcnRlZFZub2RlUXVldWUpO1xuICAgICAgICAgICAgaWYgKHBhcmVudCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGFwaS5pbnNlcnRCZWZvcmUocGFyZW50LCB2bm9kZS5lbG0sIGFwaS5uZXh0U2libGluZyhlbG0pKTtcbiAgICAgICAgICAgICAgICByZW1vdmVWbm9kZXMocGFyZW50LCBbb2xkVm5vZGVdLCAwLCAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgaW5zZXJ0ZWRWbm9kZVF1ZXVlLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICBpbnNlcnRlZFZub2RlUXVldWVbaV0uZGF0YS5ob29rLmluc2VydChpbnNlcnRlZFZub2RlUXVldWVbaV0pO1xuICAgICAgICB9XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBjYnMucG9zdC5sZW5ndGg7ICsraSlcbiAgICAgICAgICAgIGNicy5wb3N0W2ldKCk7XG4gICAgICAgIHJldHVybiB2bm9kZTtcbiAgICB9O1xufVxuZXhwb3J0cy5pbml0ID0gaW5pdDtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXNuYWJiZG9tLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIGhfMSA9IHJlcXVpcmUoXCIuL2hcIik7XG5mdW5jdGlvbiBjb3B5VG9UaHVuayh2bm9kZSwgdGh1bmspIHtcbiAgICB0aHVuay5lbG0gPSB2bm9kZS5lbG07XG4gICAgdm5vZGUuZGF0YS5mbiA9IHRodW5rLmRhdGEuZm47XG4gICAgdm5vZGUuZGF0YS5hcmdzID0gdGh1bmsuZGF0YS5hcmdzO1xuICAgIHRodW5rLmRhdGEgPSB2bm9kZS5kYXRhO1xuICAgIHRodW5rLmNoaWxkcmVuID0gdm5vZGUuY2hpbGRyZW47XG4gICAgdGh1bmsudGV4dCA9IHZub2RlLnRleHQ7XG4gICAgdGh1bmsuZWxtID0gdm5vZGUuZWxtO1xufVxuZnVuY3Rpb24gaW5pdCh0aHVuaykge1xuICAgIHZhciBjdXIgPSB0aHVuay5kYXRhO1xuICAgIHZhciB2bm9kZSA9IGN1ci5mbi5hcHBseSh1bmRlZmluZWQsIGN1ci5hcmdzKTtcbiAgICBjb3B5VG9UaHVuayh2bm9kZSwgdGh1bmspO1xufVxuZnVuY3Rpb24gcHJlcGF0Y2gob2xkVm5vZGUsIHRodW5rKSB7XG4gICAgdmFyIGksIG9sZCA9IG9sZFZub2RlLmRhdGEsIGN1ciA9IHRodW5rLmRhdGE7XG4gICAgdmFyIG9sZEFyZ3MgPSBvbGQuYXJncywgYXJncyA9IGN1ci5hcmdzO1xuICAgIGlmIChvbGQuZm4gIT09IGN1ci5mbiB8fCBvbGRBcmdzLmxlbmd0aCAhPT0gYXJncy5sZW5ndGgpIHtcbiAgICAgICAgY29weVRvVGh1bmsoY3VyLmZuLmFwcGx5KHVuZGVmaW5lZCwgYXJncyksIHRodW5rKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBmb3IgKGkgPSAwOyBpIDwgYXJncy5sZW5ndGg7ICsraSkge1xuICAgICAgICBpZiAob2xkQXJnc1tpXSAhPT0gYXJnc1tpXSkge1xuICAgICAgICAgICAgY29weVRvVGh1bmsoY3VyLmZuLmFwcGx5KHVuZGVmaW5lZCwgYXJncyksIHRodW5rKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgIH1cbiAgICBjb3B5VG9UaHVuayhvbGRWbm9kZSwgdGh1bmspO1xufVxuZXhwb3J0cy50aHVuayA9IGZ1bmN0aW9uIHRodW5rKHNlbCwga2V5LCBmbiwgYXJncykge1xuICAgIGlmIChhcmdzID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgYXJncyA9IGZuO1xuICAgICAgICBmbiA9IGtleTtcbiAgICAgICAga2V5ID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICByZXR1cm4gaF8xLmgoc2VsLCB7XG4gICAgICAgIGtleToga2V5LFxuICAgICAgICBob29rOiB7IGluaXQ6IGluaXQsIHByZXBhdGNoOiBwcmVwYXRjaCB9LFxuICAgICAgICBmbjogZm4sXG4gICAgICAgIGFyZ3M6IGFyZ3NcbiAgICB9KTtcbn07XG5leHBvcnRzLmRlZmF1bHQgPSBleHBvcnRzLnRodW5rO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9dGh1bmsuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgdm5vZGVfMSA9IHJlcXVpcmUoXCIuL3Zub2RlXCIpO1xudmFyIGh0bWxkb21hcGlfMSA9IHJlcXVpcmUoXCIuL2h0bWxkb21hcGlcIik7XG5mdW5jdGlvbiB0b1ZOb2RlKG5vZGUsIGRvbUFwaSkge1xuICAgIHZhciBhcGkgPSBkb21BcGkgIT09IHVuZGVmaW5lZCA/IGRvbUFwaSA6IGh0bWxkb21hcGlfMS5kZWZhdWx0O1xuICAgIHZhciB0ZXh0O1xuICAgIGlmIChhcGkuaXNFbGVtZW50KG5vZGUpKSB7XG4gICAgICAgIHZhciBpZCA9IG5vZGUuaWQgPyAnIycgKyBub2RlLmlkIDogJyc7XG4gICAgICAgIHZhciBjbiA9IG5vZGUuZ2V0QXR0cmlidXRlKCdjbGFzcycpO1xuICAgICAgICB2YXIgYyA9IGNuID8gJy4nICsgY24uc3BsaXQoJyAnKS5qb2luKCcuJykgOiAnJztcbiAgICAgICAgdmFyIHNlbCA9IGFwaS50YWdOYW1lKG5vZGUpLnRvTG93ZXJDYXNlKCkgKyBpZCArIGM7XG4gICAgICAgIHZhciBhdHRycyA9IHt9O1xuICAgICAgICB2YXIgY2hpbGRyZW4gPSBbXTtcbiAgICAgICAgdmFyIG5hbWVfMTtcbiAgICAgICAgdmFyIGkgPSB2b2lkIDAsIG4gPSB2b2lkIDA7XG4gICAgICAgIHZhciBlbG1BdHRycyA9IG5vZGUuYXR0cmlidXRlcztcbiAgICAgICAgdmFyIGVsbUNoaWxkcmVuID0gbm9kZS5jaGlsZE5vZGVzO1xuICAgICAgICBmb3IgKGkgPSAwLCBuID0gZWxtQXR0cnMubGVuZ3RoOyBpIDwgbjsgaSsrKSB7XG4gICAgICAgICAgICBuYW1lXzEgPSBlbG1BdHRyc1tpXS5ub2RlTmFtZTtcbiAgICAgICAgICAgIGlmIChuYW1lXzEgIT09ICdpZCcgJiYgbmFtZV8xICE9PSAnY2xhc3MnKSB7XG4gICAgICAgICAgICAgICAgYXR0cnNbbmFtZV8xXSA9IGVsbUF0dHJzW2ldLm5vZGVWYWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmb3IgKGkgPSAwLCBuID0gZWxtQ2hpbGRyZW4ubGVuZ3RoOyBpIDwgbjsgaSsrKSB7XG4gICAgICAgICAgICBjaGlsZHJlbi5wdXNoKHRvVk5vZGUoZWxtQ2hpbGRyZW5baV0pKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdm5vZGVfMS5kZWZhdWx0KHNlbCwgeyBhdHRyczogYXR0cnMgfSwgY2hpbGRyZW4sIHVuZGVmaW5lZCwgbm9kZSk7XG4gICAgfVxuICAgIGVsc2UgaWYgKGFwaS5pc1RleHQobm9kZSkpIHtcbiAgICAgICAgdGV4dCA9IGFwaS5nZXRUZXh0Q29udGVudChub2RlKTtcbiAgICAgICAgcmV0dXJuIHZub2RlXzEuZGVmYXVsdCh1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB0ZXh0LCBub2RlKTtcbiAgICB9XG4gICAgZWxzZSBpZiAoYXBpLmlzQ29tbWVudChub2RlKSkge1xuICAgICAgICB0ZXh0ID0gYXBpLmdldFRleHRDb250ZW50KG5vZGUpO1xuICAgICAgICByZXR1cm4gdm5vZGVfMS5kZWZhdWx0KCchJywge30sIFtdLCB0ZXh0LCBub2RlKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHJldHVybiB2bm9kZV8xLmRlZmF1bHQoJycsIHt9LCBbXSwgdW5kZWZpbmVkLCBub2RlKTtcbiAgICB9XG59XG5leHBvcnRzLnRvVk5vZGUgPSB0b1ZOb2RlO1xuZXhwb3J0cy5kZWZhdWx0ID0gdG9WTm9kZTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXRvdm5vZGUuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5mdW5jdGlvbiB2bm9kZShzZWwsIGRhdGEsIGNoaWxkcmVuLCB0ZXh0LCBlbG0pIHtcbiAgICB2YXIga2V5ID0gZGF0YSA9PT0gdW5kZWZpbmVkID8gdW5kZWZpbmVkIDogZGF0YS5rZXk7XG4gICAgcmV0dXJuIHsgc2VsOiBzZWwsIGRhdGE6IGRhdGEsIGNoaWxkcmVuOiBjaGlsZHJlbixcbiAgICAgICAgdGV4dDogdGV4dCwgZWxtOiBlbG0sIGtleToga2V5IH07XG59XG5leHBvcnRzLnZub2RlID0gdm5vZGU7XG5leHBvcnRzLmRlZmF1bHQgPSB2bm9kZTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXZub2RlLmpzLm1hcCIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcblxudmFyIF9wb255ZmlsbCA9IHJlcXVpcmUoJy4vcG9ueWZpbGwuanMnKTtcblxudmFyIF9wb255ZmlsbDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9wb255ZmlsbCk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7ICdkZWZhdWx0Jzogb2JqIH07IH1cblxudmFyIHJvb3Q7IC8qIGdsb2JhbCB3aW5kb3cgKi9cblxuXG5pZiAodHlwZW9mIHNlbGYgIT09ICd1bmRlZmluZWQnKSB7XG4gIHJvb3QgPSBzZWxmO1xufSBlbHNlIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykge1xuICByb290ID0gd2luZG93O1xufSBlbHNlIGlmICh0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJykge1xuICByb290ID0gZ2xvYmFsO1xufSBlbHNlIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJykge1xuICByb290ID0gbW9kdWxlO1xufSBlbHNlIHtcbiAgcm9vdCA9IEZ1bmN0aW9uKCdyZXR1cm4gdGhpcycpKCk7XG59XG5cbnZhciByZXN1bHQgPSAoMCwgX3BvbnlmaWxsMlsnZGVmYXVsdCddKShyb290KTtcbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IHJlc3VsdDsiLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuXHR2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzWydkZWZhdWx0J10gPSBzeW1ib2xPYnNlcnZhYmxlUG9ueWZpbGw7XG5mdW5jdGlvbiBzeW1ib2xPYnNlcnZhYmxlUG9ueWZpbGwocm9vdCkge1xuXHR2YXIgcmVzdWx0O1xuXHR2YXIgX1N5bWJvbCA9IHJvb3QuU3ltYm9sO1xuXG5cdGlmICh0eXBlb2YgX1N5bWJvbCA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdGlmIChfU3ltYm9sLm9ic2VydmFibGUpIHtcblx0XHRcdHJlc3VsdCA9IF9TeW1ib2wub2JzZXJ2YWJsZTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmVzdWx0ID0gX1N5bWJvbCgnb2JzZXJ2YWJsZScpO1xuXHRcdFx0X1N5bWJvbC5vYnNlcnZhYmxlID0gcmVzdWx0O1xuXHRcdH1cblx0fSBlbHNlIHtcblx0XHRyZXN1bHQgPSAnQEBvYnNlcnZhYmxlJztcblx0fVxuXG5cdHJldHVybiByZXN1bHQ7XG59OyIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbnZhciB0eXBlc3R5bGVfMSA9IHJlcXVpcmUoXCIuL2ludGVybmFsL3R5cGVzdHlsZVwiKTtcclxuZXhwb3J0cy5UeXBlU3R5bGUgPSB0eXBlc3R5bGVfMS5UeXBlU3R5bGU7XHJcbi8qKlxyXG4gKiBBbGwgdGhlIENTUyB0eXBlcyBpbiB0aGUgJ3R5cGVzJyBuYW1lc3BhY2VcclxuICovXHJcbnZhciB0eXBlcyA9IHJlcXVpcmUoXCIuL3R5cGVzXCIpO1xyXG5leHBvcnRzLnR5cGVzID0gdHlwZXM7XHJcbi8qKlxyXG4gKiBFeHBvcnQgY2VydGFpbiB1dGlsaXRpZXNcclxuICovXHJcbnZhciB1dGlsaXRpZXNfMSA9IHJlcXVpcmUoXCIuL2ludGVybmFsL3V0aWxpdGllc1wiKTtcclxuZXhwb3J0cy5leHRlbmQgPSB1dGlsaXRpZXNfMS5leHRlbmQ7XHJcbmV4cG9ydHMuY2xhc3NlcyA9IHV0aWxpdGllc18xLmNsYXNzZXM7XHJcbmV4cG9ydHMubWVkaWEgPSB1dGlsaXRpZXNfMS5tZWRpYTtcclxuLyoqIFplcm8gY29uZmlndXJhdGlvbiwgZGVmYXVsdCBpbnN0YW5jZSBvZiBUeXBlU3R5bGUgKi9cclxudmFyIHRzID0gbmV3IHR5cGVzdHlsZV8xLlR5cGVTdHlsZSh7IGF1dG9HZW5lcmF0ZVRhZzogdHJ1ZSB9KTtcclxuLyoqIFNldHMgdGhlIHRhcmdldCB0YWcgd2hlcmUgd2Ugd3JpdGUgdGhlIGNzcyBvbiBzdHlsZSB1cGRhdGVzICovXHJcbmV4cG9ydHMuc2V0U3R5bGVzVGFyZ2V0ID0gdHMuc2V0U3R5bGVzVGFyZ2V0O1xyXG4vKipcclxuICogSW5zZXJ0IGByYXdgIENTUyBhcyBhIHN0cmluZy4gVGhpcyBpcyB1c2VmdWwgZm9yIGUuZy5cclxuICogLSB0aGlyZCBwYXJ0eSBDU1MgdGhhdCB5b3UgYXJlIGN1c3RvbWl6aW5nIHdpdGggdGVtcGxhdGUgc3RyaW5nc1xyXG4gKiAtIGdlbmVyYXRpbmcgcmF3IENTUyBpbiBKYXZhU2NyaXB0XHJcbiAqIC0gcmVzZXQgbGlicmFyaWVzIGxpa2Ugbm9ybWFsaXplLmNzcyB0aGF0IHlvdSBjYW4gdXNlIHdpdGhvdXQgbG9hZGVyc1xyXG4gKi9cclxuZXhwb3J0cy5jc3NSYXcgPSB0cy5jc3NSYXc7XHJcbi8qKlxyXG4gKiBUYWtlcyBDU1NQcm9wZXJ0aWVzIGFuZCByZWdpc3RlcnMgaXQgdG8gYSBnbG9iYWwgc2VsZWN0b3IgKGJvZHksIGh0bWwsIGV0Yy4pXHJcbiAqL1xyXG5leHBvcnRzLmNzc1J1bGUgPSB0cy5jc3NSdWxlO1xyXG4vKipcclxuICogUmVuZGVycyBzdHlsZXMgdG8gdGhlIHNpbmdsZXRvbiB0YWcgaW1lZGlhdGVseVxyXG4gKiBOT1RFOiBZb3Ugc2hvdWxkIG9ubHkgY2FsbCBpdCBvbiBpbml0aWFsIHJlbmRlciB0byBwcmV2ZW50IGFueSBub24gQ1NTIGZsYXNoLlxyXG4gKiBBZnRlciB0aGF0IGl0IGlzIGtlcHQgc3luYyB1c2luZyBgcmVxdWVzdEFuaW1hdGlvbkZyYW1lYCBhbmQgd2UgaGF2ZW4ndCBub3RpY2VkIGFueSBiYWQgZmxhc2hlcy5cclxuICoqL1xyXG5leHBvcnRzLmZvcmNlUmVuZGVyU3R5bGVzID0gdHMuZm9yY2VSZW5kZXJTdHlsZXM7XHJcbi8qKlxyXG4gKiBVdGlsaXR5IGZ1bmN0aW9uIHRvIHJlZ2lzdGVyIGFuIEBmb250LWZhY2VcclxuICovXHJcbmV4cG9ydHMuZm9udEZhY2UgPSB0cy5mb250RmFjZTtcclxuLyoqXHJcbiAqIEFsbG93cyB1c2UgdG8gdXNlIHRoZSBzdHlsZXNoZWV0IGluIGEgbm9kZS5qcyBlbnZpcm9ubWVudFxyXG4gKi9cclxuZXhwb3J0cy5nZXRTdHlsZXMgPSB0cy5nZXRTdHlsZXM7XHJcbi8qKlxyXG4gKiBUYWtlcyBrZXlmcmFtZXMgYW5kIHJldHVybnMgYSBnZW5lcmF0ZWQgYW5pbWF0aW9uTmFtZVxyXG4gKi9cclxuZXhwb3J0cy5rZXlmcmFtZXMgPSB0cy5rZXlmcmFtZXM7XHJcbi8qKlxyXG4gKiBIZWxwcyB3aXRoIHRlc3RpbmcuIFJlaW5pdGlhbGl6ZXMgRnJlZVN0eWxlICsgcmF3XHJcbiAqL1xyXG5leHBvcnRzLnJlaW5pdCA9IHRzLnJlaW5pdDtcclxuLyoqXHJcbiAqIFRha2VzIENTU1Byb3BlcnRpZXMgYW5kIHJldHVybiBhIGdlbmVyYXRlZCBjbGFzc05hbWUgeW91IGNhbiB1c2Ugb24geW91ciBjb21wb25lbnRcclxuICovXHJcbmV4cG9ydHMuc3R5bGUgPSB0cy5zdHlsZTtcclxuLyoqXHJcbiAqIFRha2VzIGFuIG9iamVjdCB3aGVyZSBwcm9wZXJ0eSBuYW1lcyBhcmUgaWRlYWwgY2xhc3MgbmFtZXMgYW5kIHByb3BlcnR5IHZhbHVlcyBhcmUgQ1NTUHJvcGVydGllcywgYW5kXHJcbiAqIHJldHVybnMgYW4gb2JqZWN0IHdoZXJlIHByb3BlcnR5IG5hbWVzIGFyZSB0aGUgc2FtZSBpZGVhbCBjbGFzcyBuYW1lcyBhbmQgdGhlIHByb3BlcnR5IHZhbHVlcyBhcmVcclxuICogdGhlIGFjdHVhbCBnZW5lcmF0ZWQgY2xhc3MgbmFtZXMgdXNpbmcgdGhlIGlkZWFsIGNsYXNzIG5hbWUgYXMgdGhlICRkZWJ1Z05hbWVcclxuICovXHJcbmV4cG9ydHMuc3R5bGVzaGVldCA9IHRzLnN0eWxlc2hlZXQ7XHJcbi8qKlxyXG4gKiBDcmVhdGVzIGEgbmV3IGluc3RhbmNlIG9mIFR5cGVTdHlsZSBzZXBhcmF0ZSBmcm9tIHRoZSBkZWZhdWx0IGluc3RhbmNlLlxyXG4gKlxyXG4gKiAtIFVzZSB0aGlzIGZvciBjcmVhdGluZyBhIGRpZmZlcmVudCB0eXBlc3R5bGUgaW5zdGFuY2UgZm9yIGEgc2hhZG93IGRvbSBjb21wb25lbnQuXHJcbiAqIC0gVXNlIHRoaXMgaWYgeW91IGRvbid0IHdhbnQgYW4gYXV0byB0YWcgZ2VuZXJhdGVkIGFuZCB5b3UganVzdCB3YW50IHRvIGNvbGxlY3QgdGhlIENTUy5cclxuICpcclxuICogTk9URTogc3R5bGVzIGFyZW4ndCBzaGFyZWQgYmV0d2VlbiBkaWZmZXJlbnQgaW5zdGFuY2VzLlxyXG4gKi9cclxuZnVuY3Rpb24gY3JlYXRlVHlwZVN0eWxlKHRhcmdldCkge1xyXG4gICAgdmFyIGluc3RhbmNlID0gbmV3IHR5cGVzdHlsZV8xLlR5cGVTdHlsZSh7IGF1dG9HZW5lcmF0ZVRhZzogZmFsc2UgfSk7XHJcbiAgICBpZiAodGFyZ2V0KSB7XHJcbiAgICAgICAgaW5zdGFuY2Uuc2V0U3R5bGVzVGFyZ2V0KHRhcmdldCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gaW5zdGFuY2U7XHJcbn1cclxuZXhwb3J0cy5jcmVhdGVUeXBlU3R5bGUgPSBjcmVhdGVUeXBlU3R5bGU7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbnZhciBGcmVlU3R5bGUgPSByZXF1aXJlKFwiZnJlZS1zdHlsZVwiKTtcclxuLyoqXHJcbiAqIFdlIG5lZWQgdG8gZG8gdGhlIGZvbGxvd2luZyB0byAqb3VyKiBvYmplY3RzIGJlZm9yZSBwYXNzaW5nIHRvIGZyZWVzdHlsZTpcclxuICogLSBGb3IgYW55IGAkbmVzdGAgZGlyZWN0aXZlIG1vdmUgdXAgdG8gRnJlZVN0eWxlIHN0eWxlIG5lc3RpbmdcclxuICogLSBGb3IgYW55IGAkdW5pcXVlYCBkaXJlY3RpdmUgbWFwIHRvIEZyZWVTdHlsZSBVbmlxdWVcclxuICogLSBGb3IgYW55IGAkZGVidWdOYW1lYCBkaXJlY3RpdmUgcmV0dXJuIHRoZSBkZWJ1ZyBuYW1lXHJcbiAqL1xyXG5mdW5jdGlvbiBlbnN1cmVTdHJpbmdPYmoob2JqZWN0KSB7XHJcbiAgICAvKiogVGhlIGZpbmFsIHJlc3VsdCB3ZSB3aWxsIHJldHVybiAqL1xyXG4gICAgdmFyIHJlc3VsdCA9IHt9O1xyXG4gICAgdmFyIGRlYnVnTmFtZSA9ICcnO1xyXG4gICAgZm9yICh2YXIga2V5IGluIG9iamVjdCkge1xyXG4gICAgICAgIC8qKiBHcmFiIHRoZSB2YWx1ZSB1cGZyb250ICovXHJcbiAgICAgICAgdmFyIHZhbCA9IG9iamVjdFtrZXldO1xyXG4gICAgICAgIC8qKiBUeXBlU3R5bGUgY29uZmlndXJhdGlvbiBvcHRpb25zICovXHJcbiAgICAgICAgaWYgKGtleSA9PT0gJyR1bmlxdWUnKSB7XHJcbiAgICAgICAgICAgIHJlc3VsdFtGcmVlU3R5bGUuSVNfVU5JUVVFXSA9IHZhbDtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoa2V5ID09PSAnJG5lc3QnKSB7XHJcbiAgICAgICAgICAgIHZhciBuZXN0ZWQgPSB2YWw7XHJcbiAgICAgICAgICAgIGZvciAodmFyIHNlbGVjdG9yIGluIG5lc3RlZCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHN1YnByb3BlcnRpZXMgPSBuZXN0ZWRbc2VsZWN0b3JdO1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0W3NlbGVjdG9yXSA9IGVuc3VyZVN0cmluZ09iaihzdWJwcm9wZXJ0aWVzKS5yZXN1bHQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoa2V5ID09PSAnJGRlYnVnTmFtZScpIHtcclxuICAgICAgICAgICAgZGVidWdOYW1lID0gdmFsO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgcmVzdWx0W2tleV0gPSB2YWw7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHsgcmVzdWx0OiByZXN1bHQsIGRlYnVnTmFtZTogZGVidWdOYW1lIH07XHJcbn1cclxuZXhwb3J0cy5lbnN1cmVTdHJpbmdPYmogPSBlbnN1cmVTdHJpbmdPYmo7XHJcbi8vIHRvZG86IGJldHRlciBuYW1lIGhlcmVcclxuZnVuY3Rpb24gZXhwbG9kZUtleWZyYW1lcyhmcmFtZXMpIHtcclxuICAgIHZhciByZXN1bHQgPSB7ICRkZWJ1Z05hbWU6IHVuZGVmaW5lZCwga2V5ZnJhbWVzOiB7fSB9O1xyXG4gICAgZm9yICh2YXIgb2Zmc2V0IGluIGZyYW1lcykge1xyXG4gICAgICAgIHZhciB2YWwgPSBmcmFtZXNbb2Zmc2V0XTtcclxuICAgICAgICBpZiAob2Zmc2V0ID09PSAnJGRlYnVnTmFtZScpIHtcclxuICAgICAgICAgICAgcmVzdWx0LiRkZWJ1Z05hbWUgPSB2YWw7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICByZXN1bHQua2V5ZnJhbWVzW29mZnNldF0gPSB2YWw7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxufVxyXG5leHBvcnRzLmV4cGxvZGVLZXlmcmFtZXMgPSBleHBsb2RlS2V5ZnJhbWVzO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG52YXIgRnJlZVN0eWxlID0gcmVxdWlyZShcImZyZWUtc3R5bGVcIik7XHJcbnZhciBmb3JtYXR0aW5nXzEgPSByZXF1aXJlKFwiLi9mb3JtYXR0aW5nXCIpO1xyXG52YXIgdXRpbGl0aWVzXzEgPSByZXF1aXJlKFwiLi91dGlsaXRpZXNcIik7XHJcbi8qKlxyXG4gKiBDcmVhdGVzIGFuIGluc3RhbmNlIG9mIGZyZWUgc3R5bGUgd2l0aCBvdXIgb3B0aW9uc1xyXG4gKi9cclxudmFyIGNyZWF0ZUZyZWVTdHlsZSA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIEZyZWVTdHlsZS5jcmVhdGUoXHJcbi8qKiBVc2UgdGhlIGRlZmF1bHQgaGFzaCBmdW5jdGlvbiAqL1xyXG51bmRlZmluZWQsIFxyXG4vKiogUHJlc2VydmUgJGRlYnVnTmFtZSB2YWx1ZXMgKi9cclxudHJ1ZSk7IH07XHJcbi8qKlxyXG4gKiBNYWludGFpbnMgYSBzaW5nbGUgc3R5bGVzaGVldCBhbmQga2VlcHMgaXQgaW4gc3luYyB3aXRoIHJlcXVlc3RlZCBzdHlsZXNcclxuICovXHJcbnZhciBUeXBlU3R5bGUgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XHJcbiAgICBmdW5jdGlvbiBUeXBlU3R5bGUoX2EpIHtcclxuICAgICAgICB2YXIgYXV0b0dlbmVyYXRlVGFnID0gX2EuYXV0b0dlbmVyYXRlVGFnO1xyXG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogSW5zZXJ0IGByYXdgIENTUyBhcyBhIHN0cmluZy4gVGhpcyBpcyB1c2VmdWwgZm9yIGUuZy5cclxuICAgICAgICAgKiAtIHRoaXJkIHBhcnR5IENTUyB0aGF0IHlvdSBhcmUgY3VzdG9taXppbmcgd2l0aCB0ZW1wbGF0ZSBzdHJpbmdzXHJcbiAgICAgICAgICogLSBnZW5lcmF0aW5nIHJhdyBDU1MgaW4gSmF2YVNjcmlwdFxyXG4gICAgICAgICAqIC0gcmVzZXQgbGlicmFyaWVzIGxpa2Ugbm9ybWFsaXplLmNzcyB0aGF0IHlvdSBjYW4gdXNlIHdpdGhvdXQgbG9hZGVyc1xyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMuY3NzUmF3ID0gZnVuY3Rpb24gKG11c3RCZVZhbGlkQ1NTKSB7XHJcbiAgICAgICAgICAgIGlmICghbXVzdEJlVmFsaWRDU1MpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBfdGhpcy5fcmF3ICs9IG11c3RCZVZhbGlkQ1NTIHx8ICcnO1xyXG4gICAgICAgICAgICBfdGhpcy5fcGVuZGluZ1Jhd0NoYW5nZSA9IHRydWU7XHJcbiAgICAgICAgICAgIF90aGlzLl9zdHlsZVVwZGF0ZWQoKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFRha2VzIENTU1Byb3BlcnRpZXMgYW5kIHJlZ2lzdGVycyBpdCB0byBhIGdsb2JhbCBzZWxlY3RvciAoYm9keSwgaHRtbCwgZXRjLilcclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLmNzc1J1bGUgPSBmdW5jdGlvbiAoc2VsZWN0b3IpIHtcclxuICAgICAgICAgICAgdmFyIG9iamVjdHMgPSBbXTtcclxuICAgICAgICAgICAgZm9yICh2YXIgX2kgPSAxOyBfaSA8IGFyZ3VtZW50cy5sZW5ndGg7IF9pKyspIHtcclxuICAgICAgICAgICAgICAgIG9iamVjdHNbX2kgLSAxXSA9IGFyZ3VtZW50c1tfaV07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdmFyIG9iamVjdCA9IGZvcm1hdHRpbmdfMS5lbnN1cmVTdHJpbmdPYmoodXRpbGl0aWVzXzEuZXh0ZW5kLmFwcGx5KHZvaWQgMCwgb2JqZWN0cykpLnJlc3VsdDtcclxuICAgICAgICAgICAgX3RoaXMuX2ZyZWVTdHlsZS5yZWdpc3RlclJ1bGUoc2VsZWN0b3IsIG9iamVjdCk7XHJcbiAgICAgICAgICAgIF90aGlzLl9zdHlsZVVwZGF0ZWQoKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogUmVuZGVycyBzdHlsZXMgdG8gdGhlIHNpbmdsZXRvbiB0YWcgaW1lZGlhdGVseVxyXG4gICAgICAgICAqIE5PVEU6IFlvdSBzaG91bGQgb25seSBjYWxsIGl0IG9uIGluaXRpYWwgcmVuZGVyIHRvIHByZXZlbnQgYW55IG5vbiBDU1MgZmxhc2guXHJcbiAgICAgICAgICogQWZ0ZXIgdGhhdCBpdCBpcyBrZXB0IHN5bmMgdXNpbmcgYHJlcXVlc3RBbmltYXRpb25GcmFtZWAgYW5kIHdlIGhhdmVuJ3Qgbm90aWNlZCBhbnkgYmFkIGZsYXNoZXMuXHJcbiAgICAgICAgICoqL1xyXG4gICAgICAgIHRoaXMuZm9yY2VSZW5kZXJTdHlsZXMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciB0YXJnZXQgPSBfdGhpcy5fZ2V0VGFnKCk7XHJcbiAgICAgICAgICAgIGlmICghdGFyZ2V0KSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGFyZ2V0LnRleHRDb250ZW50ID0gX3RoaXMuZ2V0U3R5bGVzKCk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBVdGlsaXR5IGZ1bmN0aW9uIHRvIHJlZ2lzdGVyIGFuIEBmb250LWZhY2VcclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLmZvbnRGYWNlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgZm9udEZhY2UgPSBbXTtcclxuICAgICAgICAgICAgZm9yICh2YXIgX2kgPSAwOyBfaSA8IGFyZ3VtZW50cy5sZW5ndGg7IF9pKyspIHtcclxuICAgICAgICAgICAgICAgIGZvbnRGYWNlW19pXSA9IGFyZ3VtZW50c1tfaV07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdmFyIGZyZWVTdHlsZSA9IF90aGlzLl9mcmVlU3R5bGU7XHJcbiAgICAgICAgICAgIGZvciAodmFyIF9hID0gMCwgX2IgPSBmb250RmFjZTsgX2EgPCBfYi5sZW5ndGg7IF9hKyspIHtcclxuICAgICAgICAgICAgICAgIHZhciBmYWNlID0gX2JbX2FdO1xyXG4gICAgICAgICAgICAgICAgZnJlZVN0eWxlLnJlZ2lzdGVyUnVsZSgnQGZvbnQtZmFjZScsIGZhY2UpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIF90aGlzLl9zdHlsZVVwZGF0ZWQoKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQWxsb3dzIHVzZSB0byB1c2UgdGhlIHN0eWxlc2hlZXQgaW4gYSBub2RlLmpzIGVudmlyb25tZW50XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5nZXRTdHlsZXMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAoX3RoaXMuX3JhdyB8fCAnJykgKyBfdGhpcy5fZnJlZVN0eWxlLmdldFN0eWxlcygpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogVGFrZXMga2V5ZnJhbWVzIGFuZCByZXR1cm5zIGEgZ2VuZXJhdGVkIGFuaW1hdGlvbk5hbWVcclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLmtleWZyYW1lcyA9IGZ1bmN0aW9uIChmcmFtZXMpIHtcclxuICAgICAgICAgICAgdmFyIF9hID0gZm9ybWF0dGluZ18xLmV4cGxvZGVLZXlmcmFtZXMoZnJhbWVzKSwga2V5ZnJhbWVzID0gX2Eua2V5ZnJhbWVzLCAkZGVidWdOYW1lID0gX2EuJGRlYnVnTmFtZTtcclxuICAgICAgICAgICAgLy8gVE9ETzogcmVwbGFjZSAkZGVidWdOYW1lIHdpdGggZGlzcGxheSBuYW1lXHJcbiAgICAgICAgICAgIHZhciBhbmltYXRpb25OYW1lID0gX3RoaXMuX2ZyZWVTdHlsZS5yZWdpc3RlcktleWZyYW1lcyhrZXlmcmFtZXMsICRkZWJ1Z05hbWUpO1xyXG4gICAgICAgICAgICBfdGhpcy5fc3R5bGVVcGRhdGVkKCk7XHJcbiAgICAgICAgICAgIHJldHVybiBhbmltYXRpb25OYW1lO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogSGVscHMgd2l0aCB0ZXN0aW5nLiBSZWluaXRpYWxpemVzIEZyZWVTdHlsZSArIHJhd1xyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMucmVpbml0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAvKiogcmVpbml0IGZyZWVzdHlsZSAqL1xyXG4gICAgICAgICAgICB2YXIgZnJlZVN0eWxlID0gY3JlYXRlRnJlZVN0eWxlKCk7XHJcbiAgICAgICAgICAgIF90aGlzLl9mcmVlU3R5bGUgPSBmcmVlU3R5bGU7XHJcbiAgICAgICAgICAgIF90aGlzLl9sYXN0RnJlZVN0eWxlQ2hhbmdlSWQgPSBmcmVlU3R5bGUuY2hhbmdlSWQ7XHJcbiAgICAgICAgICAgIC8qKiByZWluaXQgcmF3ICovXHJcbiAgICAgICAgICAgIF90aGlzLl9yYXcgPSAnJztcclxuICAgICAgICAgICAgX3RoaXMuX3BlbmRpbmdSYXdDaGFuZ2UgPSBmYWxzZTtcclxuICAgICAgICAgICAgLyoqIENsZWFyIGFueSBzdHlsZXMgdGhhdCB3ZXJlIGZsdXNoZWQgKi9cclxuICAgICAgICAgICAgdmFyIHRhcmdldCA9IF90aGlzLl9nZXRUYWcoKTtcclxuICAgICAgICAgICAgaWYgKHRhcmdldCkge1xyXG4gICAgICAgICAgICAgICAgdGFyZ2V0LnRleHRDb250ZW50ID0gJyc7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgICAgIC8qKiBTZXRzIHRoZSB0YXJnZXQgdGFnIHdoZXJlIHdlIHdyaXRlIHRoZSBjc3Mgb24gc3R5bGUgdXBkYXRlcyAqL1xyXG4gICAgICAgIHRoaXMuc2V0U3R5bGVzVGFyZ2V0ID0gZnVuY3Rpb24gKHRhZykge1xyXG4gICAgICAgICAgICAvKiogQ2xlYXIgYW55IGRhdGEgaW4gYW55IHByZXZpb3VzIHRhZyAqL1xyXG4gICAgICAgICAgICBpZiAoX3RoaXMuX3RhZykge1xyXG4gICAgICAgICAgICAgICAgX3RoaXMuX3RhZy50ZXh0Q29udGVudCA9ICcnO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIF90aGlzLl90YWcgPSB0YWc7XHJcbiAgICAgICAgICAgIC8qKiBUaGlzIHNwZWNpYWwgdGltZSBidWZmZXIgaW1tZWRpYXRlbHkgKi9cclxuICAgICAgICAgICAgX3RoaXMuZm9yY2VSZW5kZXJTdHlsZXMoKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFRha2VzIGFuIG9iamVjdCB3aGVyZSBwcm9wZXJ0eSBuYW1lcyBhcmUgaWRlYWwgY2xhc3MgbmFtZXMgYW5kIHByb3BlcnR5IHZhbHVlcyBhcmUgQ1NTUHJvcGVydGllcywgYW5kXHJcbiAgICAgICAgICogcmV0dXJucyBhbiBvYmplY3Qgd2hlcmUgcHJvcGVydHkgbmFtZXMgYXJlIHRoZSBzYW1lIGlkZWFsIGNsYXNzIG5hbWVzIGFuZCB0aGUgcHJvcGVydHkgdmFsdWVzIGFyZVxyXG4gICAgICAgICAqIHRoZSBhY3R1YWwgZ2VuZXJhdGVkIGNsYXNzIG5hbWVzIHVzaW5nIHRoZSBpZGVhbCBjbGFzcyBuYW1lIGFzIHRoZSAkZGVidWdOYW1lXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5zdHlsZXNoZWV0ID0gZnVuY3Rpb24gKGNsYXNzZXMpIHtcclxuICAgICAgICAgICAgdmFyIGNsYXNzTmFtZXMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhjbGFzc2VzKTtcclxuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHt9O1xyXG4gICAgICAgICAgICBmb3IgKHZhciBfaSA9IDAsIGNsYXNzTmFtZXNfMSA9IGNsYXNzTmFtZXM7IF9pIDwgY2xhc3NOYW1lc18xLmxlbmd0aDsgX2krKykge1xyXG4gICAgICAgICAgICAgICAgdmFyIGNsYXNzTmFtZSA9IGNsYXNzTmFtZXNfMVtfaV07XHJcbiAgICAgICAgICAgICAgICB2YXIgY2xhc3NEZWYgPSBjbGFzc2VzW2NsYXNzTmFtZV07XHJcbiAgICAgICAgICAgICAgICBpZiAoY2xhc3NEZWYpIHtcclxuICAgICAgICAgICAgICAgICAgICBjbGFzc0RlZi4kZGVidWdOYW1lID0gY2xhc3NOYW1lO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdFtjbGFzc05hbWVdID0gX3RoaXMuc3R5bGUoY2xhc3NEZWYpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgfTtcclxuICAgICAgICB2YXIgZnJlZVN0eWxlID0gY3JlYXRlRnJlZVN0eWxlKCk7XHJcbiAgICAgICAgdGhpcy5fYXV0b0dlbmVyYXRlVGFnID0gYXV0b0dlbmVyYXRlVGFnO1xyXG4gICAgICAgIHRoaXMuX2ZyZWVTdHlsZSA9IGZyZWVTdHlsZTtcclxuICAgICAgICB0aGlzLl9sYXN0RnJlZVN0eWxlQ2hhbmdlSWQgPSBmcmVlU3R5bGUuY2hhbmdlSWQ7XHJcbiAgICAgICAgdGhpcy5fcGVuZGluZyA9IDA7XHJcbiAgICAgICAgdGhpcy5fcGVuZGluZ1Jhd0NoYW5nZSA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMuX3JhdyA9ICcnO1xyXG4gICAgICAgIHRoaXMuX3RhZyA9IHVuZGVmaW5lZDtcclxuICAgICAgICAvLyByZWJpbmQgcHJvdG90eXBlIHRvIFR5cGVTdHlsZS4gIEl0IG1pZ2h0IGJlIGJldHRlciB0byBkbyBhIGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpcy5zdHlsZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpfVxyXG4gICAgICAgIHRoaXMuc3R5bGUgPSB0aGlzLnN0eWxlLmJpbmQodGhpcyk7XHJcbiAgICB9XHJcbiAgICAvKipcclxuICAgICAqIE9ubHkgY2FsbHMgY2IgYWxsIHN5bmMgb3BlcmF0aW9ucyBzZXR0bGVcclxuICAgICAqL1xyXG4gICAgVHlwZVN0eWxlLnByb3RvdHlwZS5fYWZ0ZXJBbGxTeW5jID0gZnVuY3Rpb24gKGNiKSB7XHJcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcclxuICAgICAgICB0aGlzLl9wZW5kaW5nKys7XHJcbiAgICAgICAgdmFyIHBlbmRpbmcgPSB0aGlzLl9wZW5kaW5nO1xyXG4gICAgICAgIHV0aWxpdGllc18xLnJhZihmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGlmIChwZW5kaW5nICE9PSBfdGhpcy5fcGVuZGluZykge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNiKCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG4gICAgVHlwZVN0eWxlLnByb3RvdHlwZS5fZ2V0VGFnID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGlmICh0aGlzLl90YWcpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3RhZztcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMuX2F1dG9HZW5lcmF0ZVRhZykge1xyXG4gICAgICAgICAgICB2YXIgdGFnID0gdHlwZW9mIHdpbmRvdyA9PT0gJ3VuZGVmaW5lZCdcclxuICAgICAgICAgICAgICAgID8geyB0ZXh0Q29udGVudDogJycgfVxyXG4gICAgICAgICAgICAgICAgOiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpO1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mIGRvY3VtZW50ICE9PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgICAgICAgICAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZCh0YWcpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuX3RhZyA9IHRhZztcclxuICAgICAgICAgICAgcmV0dXJuIHRhZztcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICAgIH07XHJcbiAgICAvKiogQ2hlY2tzIGlmIHRoZSBzdHlsZSB0YWcgbmVlZHMgdXBkYXRpbmcgYW5kIGlmIHNvIHF1ZXVlcyB1cCB0aGUgY2hhbmdlICovXHJcbiAgICBUeXBlU3R5bGUucHJvdG90eXBlLl9zdHlsZVVwZGF0ZWQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcclxuICAgICAgICB2YXIgY2hhbmdlSWQgPSB0aGlzLl9mcmVlU3R5bGUuY2hhbmdlSWQ7XHJcbiAgICAgICAgdmFyIGxhc3RDaGFuZ2VJZCA9IHRoaXMuX2xhc3RGcmVlU3R5bGVDaGFuZ2VJZDtcclxuICAgICAgICBpZiAoIXRoaXMuX3BlbmRpbmdSYXdDaGFuZ2UgJiYgY2hhbmdlSWQgPT09IGxhc3RDaGFuZ2VJZCkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuX2xhc3RGcmVlU3R5bGVDaGFuZ2VJZCA9IGNoYW5nZUlkO1xyXG4gICAgICAgIHRoaXMuX3BlbmRpbmdSYXdDaGFuZ2UgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLl9hZnRlckFsbFN5bmMoZnVuY3Rpb24gKCkgeyByZXR1cm4gX3RoaXMuZm9yY2VSZW5kZXJTdHlsZXMoKTsgfSk7XHJcbiAgICB9O1xyXG4gICAgVHlwZVN0eWxlLnByb3RvdHlwZS5zdHlsZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgZnJlZVN0eWxlID0gdGhpcy5fZnJlZVN0eWxlO1xyXG4gICAgICAgIHZhciBfYSA9IGZvcm1hdHRpbmdfMS5lbnN1cmVTdHJpbmdPYmoodXRpbGl0aWVzXzEuZXh0ZW5kLmFwcGx5KHVuZGVmaW5lZCwgYXJndW1lbnRzKSksIHJlc3VsdCA9IF9hLnJlc3VsdCwgZGVidWdOYW1lID0gX2EuZGVidWdOYW1lO1xyXG4gICAgICAgIHZhciBjbGFzc05hbWUgPSBkZWJ1Z05hbWUgPyBmcmVlU3R5bGUucmVnaXN0ZXJTdHlsZShyZXN1bHQsIGRlYnVnTmFtZSkgOiBmcmVlU3R5bGUucmVnaXN0ZXJTdHlsZShyZXN1bHQpO1xyXG4gICAgICAgIHRoaXMuX3N0eWxlVXBkYXRlZCgpO1xyXG4gICAgICAgIHJldHVybiBjbGFzc05hbWU7XHJcbiAgICB9O1xyXG4gICAgcmV0dXJuIFR5cGVTdHlsZTtcclxufSgpKTtcclxuZXhwb3J0cy5UeXBlU3R5bGUgPSBUeXBlU3R5bGU7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbi8qKiBSYWYgZm9yIG5vZGUgKyBicm93c2VyICovXHJcbmV4cG9ydHMucmFmID0gdHlwZW9mIHJlcXVlc3RBbmltYXRpb25GcmFtZSA9PT0gJ3VuZGVmaW5lZCdcclxuICAgIC8qKlxyXG4gICAgICogTWFrZSBzdXJlIHNldFRpbWVvdXQgaXMgYWx3YXlzIGludm9rZWQgd2l0aFxyXG4gICAgICogYHRoaXNgIHNldCB0byBgd2luZG93YCBvciBgZ2xvYmFsYCBhdXRvbWF0aWNhbGx5XHJcbiAgICAgKiovXHJcbiAgICA/IGZ1bmN0aW9uIChjYikgeyByZXR1cm4gc2V0VGltZW91dChjYik7IH1cclxuICAgIC8qKlxyXG4gICAgICogTWFrZSBzdXJlIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgaXMgYWx3YXlzIGludm9rZWQgd2l0aCBgdGhpc2Agd2luZG93XHJcbiAgICAgKiBXZSBtaWdodCBoYXZlIHJhZiB3aXRob3V0IHdpbmRvdyBpbiBjYXNlIG9mIGByYWYvcG9seWZpbGxgIChyZWNvbW1lbmRlZCBieSBSZWFjdClcclxuICAgICAqKi9cclxuICAgIDogdHlwZW9mIHdpbmRvdyA9PT0gJ3VuZGVmaW5lZCdcclxuICAgICAgICA/IHJlcXVlc3RBbmltYXRpb25GcmFtZVxyXG4gICAgICAgIDogcmVxdWVzdEFuaW1hdGlvbkZyYW1lLmJpbmQod2luZG93KTtcclxuLyoqXHJcbiAqIFV0aWxpdHkgdG8gam9pbiBjbGFzc2VzIGNvbmRpdGlvbmFsbHlcclxuICovXHJcbmZ1bmN0aW9uIGNsYXNzZXMoKSB7XHJcbiAgICB2YXIgY2xhc3NlcyA9IFtdO1xyXG4gICAgZm9yICh2YXIgX2kgPSAwOyBfaSA8IGFyZ3VtZW50cy5sZW5ndGg7IF9pKyspIHtcclxuICAgICAgICBjbGFzc2VzW19pXSA9IGFyZ3VtZW50c1tfaV07XHJcbiAgICB9XHJcbiAgICByZXR1cm4gY2xhc3Nlcy5maWx0ZXIoZnVuY3Rpb24gKGMpIHsgcmV0dXJuICEhYzsgfSkuam9pbignICcpO1xyXG59XHJcbmV4cG9ydHMuY2xhc3NlcyA9IGNsYXNzZXM7XHJcbi8qKlxyXG4gKiBNZXJnZXMgdmFyaW91cyBzdHlsZXMgaW50byBhIHNpbmdsZSBzdHlsZSBvYmplY3QuXHJcbiAqIE5vdGU6IGlmIHR3byBvYmplY3RzIGhhdmUgdGhlIHNhbWUgcHJvcGVydHkgdGhlIGxhc3Qgb25lIHdpbnNcclxuICovXHJcbmZ1bmN0aW9uIGV4dGVuZCgpIHtcclxuICAgIHZhciBvYmplY3RzID0gW107XHJcbiAgICBmb3IgKHZhciBfaSA9IDA7IF9pIDwgYXJndW1lbnRzLmxlbmd0aDsgX2krKykge1xyXG4gICAgICAgIG9iamVjdHNbX2ldID0gYXJndW1lbnRzW19pXTtcclxuICAgIH1cclxuICAgIC8qKiBUaGUgZmluYWwgcmVzdWx0IHdlIHdpbGwgcmV0dXJuICovXHJcbiAgICB2YXIgcmVzdWx0ID0ge307XHJcbiAgICBmb3IgKHZhciBfYSA9IDAsIG9iamVjdHNfMSA9IG9iamVjdHM7IF9hIDwgb2JqZWN0c18xLmxlbmd0aDsgX2ErKykge1xyXG4gICAgICAgIHZhciBvYmplY3QgPSBvYmplY3RzXzFbX2FdO1xyXG4gICAgICAgIGlmIChvYmplY3QgPT0gbnVsbCB8fCBvYmplY3QgPT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmb3IgKHZhciBrZXkgaW4gb2JqZWN0KSB7XHJcbiAgICAgICAgICAgIC8qKiBGYWxzeSB2YWx1ZXMgZXhjZXB0IGEgZXhwbGljaXQgMCBpcyBpZ25vcmVkICovXHJcbiAgICAgICAgICAgIHZhciB2YWwgPSBvYmplY3Rba2V5XTtcclxuICAgICAgICAgICAgaWYgKCF2YWwgJiYgdmFsICE9PSAwKSB7XHJcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvKiogaWYgbmVzdGVkIG1lZGlhIG9yIHBzZXVkbyBzZWxlY3RvciAqL1xyXG4gICAgICAgICAgICBpZiAoa2V5ID09PSAnJG5lc3QnICYmIHZhbCkge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0W2tleV0gPSByZXN1bHRbJyRuZXN0J10gPyBleHRlbmQocmVzdWx0WyckbmVzdCddLCB2YWwpIDogdmFsO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKChrZXkuaW5kZXhPZignJicpICE9PSAtMSB8fCBrZXkuaW5kZXhPZignQG1lZGlhJykgPT09IDApKSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHRba2V5XSA9IHJlc3VsdFtrZXldID8gZXh0ZW5kKHJlc3VsdFtrZXldLCB2YWwpIDogdmFsO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0W2tleV0gPSB2YWw7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG59XHJcbmV4cG9ydHMuZXh0ZW5kID0gZXh0ZW5kO1xyXG4vKipcclxuICogVXRpbGl0eSB0byBoZWxwIGN1c3RvbWl6ZSBzdHlsZXMgd2l0aCBtZWRpYSBxdWVyaWVzLiBlLmcuXHJcbiAqIGBgYFxyXG4gKiBzdHlsZShcclxuICogIG1lZGlhKHttYXhXaWR0aDo1MDB9LCB7Y29sb3I6J3JlZCd9KVxyXG4gKiApXHJcbiAqIGBgYFxyXG4gKi9cclxuZXhwb3J0cy5tZWRpYSA9IGZ1bmN0aW9uIChtZWRpYVF1ZXJ5KSB7XHJcbiAgICB2YXIgb2JqZWN0cyA9IFtdO1xyXG4gICAgZm9yICh2YXIgX2kgPSAxOyBfaSA8IGFyZ3VtZW50cy5sZW5ndGg7IF9pKyspIHtcclxuICAgICAgICBvYmplY3RzW19pIC0gMV0gPSBhcmd1bWVudHNbX2ldO1xyXG4gICAgfVxyXG4gICAgdmFyIG1lZGlhUXVlcnlTZWN0aW9ucyA9IFtdO1xyXG4gICAgaWYgKG1lZGlhUXVlcnkudHlwZSlcclxuICAgICAgICBtZWRpYVF1ZXJ5U2VjdGlvbnMucHVzaChtZWRpYVF1ZXJ5LnR5cGUpO1xyXG4gICAgaWYgKG1lZGlhUXVlcnkub3JpZW50YXRpb24pXHJcbiAgICAgICAgbWVkaWFRdWVyeVNlY3Rpb25zLnB1c2goXCIob3JpZW50YXRpb246IFwiICsgbWVkaWFRdWVyeS5vcmllbnRhdGlvbiArIFwiKVwiKTtcclxuICAgIGlmIChtZWRpYVF1ZXJ5Lm1pbldpZHRoKVxyXG4gICAgICAgIG1lZGlhUXVlcnlTZWN0aW9ucy5wdXNoKFwiKG1pbi13aWR0aDogXCIgKyBtZWRpYUxlbmd0aChtZWRpYVF1ZXJ5Lm1pbldpZHRoKSArIFwiKVwiKTtcclxuICAgIGlmIChtZWRpYVF1ZXJ5Lm1heFdpZHRoKVxyXG4gICAgICAgIG1lZGlhUXVlcnlTZWN0aW9ucy5wdXNoKFwiKG1heC13aWR0aDogXCIgKyBtZWRpYUxlbmd0aChtZWRpYVF1ZXJ5Lm1heFdpZHRoKSArIFwiKVwiKTtcclxuICAgIGlmIChtZWRpYVF1ZXJ5Lm1pbkhlaWdodClcclxuICAgICAgICBtZWRpYVF1ZXJ5U2VjdGlvbnMucHVzaChcIihtaW4taGVpZ2h0OiBcIiArIG1lZGlhTGVuZ3RoKG1lZGlhUXVlcnkubWluSGVpZ2h0KSArIFwiKVwiKTtcclxuICAgIGlmIChtZWRpYVF1ZXJ5Lm1heEhlaWdodClcclxuICAgICAgICBtZWRpYVF1ZXJ5U2VjdGlvbnMucHVzaChcIihtYXgtaGVpZ2h0OiBcIiArIG1lZGlhTGVuZ3RoKG1lZGlhUXVlcnkubWF4SGVpZ2h0KSArIFwiKVwiKTtcclxuICAgIHZhciBzdHJpbmdNZWRpYVF1ZXJ5ID0gXCJAbWVkaWEgXCIgKyBtZWRpYVF1ZXJ5U2VjdGlvbnMuam9pbignIGFuZCAnKTtcclxuICAgIHZhciBvYmplY3QgPSB7XHJcbiAgICAgICAgJG5lc3Q6IChfYSA9IHt9LFxyXG4gICAgICAgICAgICBfYVtzdHJpbmdNZWRpYVF1ZXJ5XSA9IGV4dGVuZC5hcHBseSh2b2lkIDAsIG9iamVjdHMpLFxyXG4gICAgICAgICAgICBfYSlcclxuICAgIH07XHJcbiAgICByZXR1cm4gb2JqZWN0O1xyXG4gICAgdmFyIF9hO1xyXG59O1xyXG52YXIgbWVkaWFMZW5ndGggPSBmdW5jdGlvbiAodmFsdWUpIHtcclxuICAgIHJldHVybiB0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnID8gdmFsdWUgOiB2YWx1ZSArIFwicHhcIjtcclxufTtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuIiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuXG52YXIgX3R5cGVvZiA9IHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiB0eXBlb2YgU3ltYm9sLml0ZXJhdG9yID09PSBcInN5bWJvbFwiID8gZnVuY3Rpb24gKG9iaikgeyByZXR1cm4gdHlwZW9mIG9iajsgfSA6IGZ1bmN0aW9uIChvYmopIHsgcmV0dXJuIG9iaiAmJiB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgb2JqLmNvbnN0cnVjdG9yID09PSBTeW1ib2wgJiYgb2JqICE9PSBTeW1ib2wucHJvdG90eXBlID8gXCJzeW1ib2xcIiA6IHR5cGVvZiBvYmo7IH07XG5cbnZhciB2YWx1ZUVxdWFsID0gZnVuY3Rpb24gdmFsdWVFcXVhbChhLCBiKSB7XG4gIGlmIChhID09PSBiKSByZXR1cm4gdHJ1ZTtcblxuICBpZiAoYSA9PSBudWxsIHx8IGIgPT0gbnVsbCkgcmV0dXJuIGZhbHNlO1xuXG4gIGlmIChBcnJheS5pc0FycmF5KGEpKSByZXR1cm4gQXJyYXkuaXNBcnJheShiKSAmJiBhLmxlbmd0aCA9PT0gYi5sZW5ndGggJiYgYS5ldmVyeShmdW5jdGlvbiAoaXRlbSwgaW5kZXgpIHtcbiAgICByZXR1cm4gdmFsdWVFcXVhbChpdGVtLCBiW2luZGV4XSk7XG4gIH0pO1xuXG4gIHZhciBhVHlwZSA9IHR5cGVvZiBhID09PSAndW5kZWZpbmVkJyA/ICd1bmRlZmluZWQnIDogX3R5cGVvZihhKTtcbiAgdmFyIGJUeXBlID0gdHlwZW9mIGIgPT09ICd1bmRlZmluZWQnID8gJ3VuZGVmaW5lZCcgOiBfdHlwZW9mKGIpO1xuXG4gIGlmIChhVHlwZSAhPT0gYlR5cGUpIHJldHVybiBmYWxzZTtcblxuICBpZiAoYVR5cGUgPT09ICdvYmplY3QnKSB7XG4gICAgdmFyIGFWYWx1ZSA9IGEudmFsdWVPZigpO1xuICAgIHZhciBiVmFsdWUgPSBiLnZhbHVlT2YoKTtcblxuICAgIGlmIChhVmFsdWUgIT09IGEgfHwgYlZhbHVlICE9PSBiKSByZXR1cm4gdmFsdWVFcXVhbChhVmFsdWUsIGJWYWx1ZSk7XG5cbiAgICB2YXIgYUtleXMgPSBPYmplY3Qua2V5cyhhKTtcbiAgICB2YXIgYktleXMgPSBPYmplY3Qua2V5cyhiKTtcblxuICAgIGlmIChhS2V5cy5sZW5ndGggIT09IGJLZXlzLmxlbmd0aCkgcmV0dXJuIGZhbHNlO1xuXG4gICAgcmV0dXJuIGFLZXlzLmV2ZXJ5KGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgIHJldHVybiB2YWx1ZUVxdWFsKGFba2V5XSwgYltrZXldKTtcbiAgICB9KTtcbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn07XG5cbmV4cG9ydHMuZGVmYXVsdCA9IHZhbHVlRXF1YWw7IiwiLyoqXG4gKiBDb3B5cmlnaHQgMjAxNC0yMDE1LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBCU0Qtc3R5bGUgbGljZW5zZSBmb3VuZCBpbiB0aGVcbiAqIExJQ0VOU0UgZmlsZSBpbiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS4gQW4gYWRkaXRpb25hbCBncmFudFxuICogb2YgcGF0ZW50IHJpZ2h0cyBjYW4gYmUgZm91bmQgaW4gdGhlIFBBVEVOVFMgZmlsZSBpbiB0aGUgc2FtZSBkaXJlY3RvcnkuXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIFNpbWlsYXIgdG8gaW52YXJpYW50IGJ1dCBvbmx5IGxvZ3MgYSB3YXJuaW5nIGlmIHRoZSBjb25kaXRpb24gaXMgbm90IG1ldC5cbiAqIFRoaXMgY2FuIGJlIHVzZWQgdG8gbG9nIGlzc3VlcyBpbiBkZXZlbG9wbWVudCBlbnZpcm9ubWVudHMgaW4gY3JpdGljYWxcbiAqIHBhdGhzLiBSZW1vdmluZyB0aGUgbG9nZ2luZyBjb2RlIGZvciBwcm9kdWN0aW9uIGVudmlyb25tZW50cyB3aWxsIGtlZXAgdGhlXG4gKiBzYW1lIGxvZ2ljIGFuZCBmb2xsb3cgdGhlIHNhbWUgY29kZSBwYXRocy5cbiAqL1xuXG52YXIgd2FybmluZyA9IGZ1bmN0aW9uKCkge307XG5cbmlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gIHdhcm5pbmcgPSBmdW5jdGlvbihjb25kaXRpb24sIGZvcm1hdCwgYXJncykge1xuICAgIHZhciBsZW4gPSBhcmd1bWVudHMubGVuZ3RoO1xuICAgIGFyZ3MgPSBuZXcgQXJyYXkobGVuID4gMiA/IGxlbiAtIDIgOiAwKTtcbiAgICBmb3IgKHZhciBrZXkgPSAyOyBrZXkgPCBsZW47IGtleSsrKSB7XG4gICAgICBhcmdzW2tleSAtIDJdID0gYXJndW1lbnRzW2tleV07XG4gICAgfVxuICAgIGlmIChmb3JtYXQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAnYHdhcm5pbmcoY29uZGl0aW9uLCBmb3JtYXQsIC4uLmFyZ3MpYCByZXF1aXJlcyBhIHdhcm5pbmcgJyArXG4gICAgICAgICdtZXNzYWdlIGFyZ3VtZW50J1xuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZiAoZm9ybWF0Lmxlbmd0aCA8IDEwIHx8ICgvXltzXFxXXSokLykudGVzdChmb3JtYXQpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICdUaGUgd2FybmluZyBmb3JtYXQgc2hvdWxkIGJlIGFibGUgdG8gdW5pcXVlbHkgaWRlbnRpZnkgdGhpcyAnICtcbiAgICAgICAgJ3dhcm5pbmcuIFBsZWFzZSwgdXNlIGEgbW9yZSBkZXNjcmlwdGl2ZSBmb3JtYXQgdGhhbjogJyArIGZvcm1hdFxuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZiAoIWNvbmRpdGlvbikge1xuICAgICAgdmFyIGFyZ0luZGV4ID0gMDtcbiAgICAgIHZhciBtZXNzYWdlID0gJ1dhcm5pbmc6ICcgK1xuICAgICAgICBmb3JtYXQucmVwbGFjZSgvJXMvZywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgcmV0dXJuIGFyZ3NbYXJnSW5kZXgrK107XG4gICAgICAgIH0pO1xuICAgICAgaWYgKHR5cGVvZiBjb25zb2xlICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBjb25zb2xlLmVycm9yKG1lc3NhZ2UpO1xuICAgICAgfVxuICAgICAgdHJ5IHtcbiAgICAgICAgLy8gVGhpcyBlcnJvciB3YXMgdGhyb3duIGFzIGEgY29udmVuaWVuY2Ugc28gdGhhdCB5b3UgY2FuIHVzZSB0aGlzIHN0YWNrXG4gICAgICAgIC8vIHRvIGZpbmQgdGhlIGNhbGxzaXRlIHRoYXQgY2F1c2VkIHRoaXMgd2FybmluZyB0byBmaXJlLlxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IobWVzc2FnZSk7XG4gICAgICB9IGNhdGNoKHgpIHt9XG4gICAgfVxuICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHdhcm5pbmc7XG4iLCJcInVzZSBzdHJpY3RcIjtcbnZhciBpbmRleF8xID0gcmVxdWlyZShcIi4uL2luZGV4XCIpO1xudmFyIERlYm91bmNlT3BlcmF0b3IgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIERlYm91bmNlT3BlcmF0b3IoZHQsIGlucykge1xuICAgICAgICB0aGlzLmR0ID0gZHQ7XG4gICAgICAgIHRoaXMuaW5zID0gaW5zO1xuICAgICAgICB0aGlzLnR5cGUgPSAnZGVib3VuY2UnO1xuICAgICAgICB0aGlzLm91dCA9IG51bGw7XG4gICAgICAgIHRoaXMuaWQgPSBudWxsO1xuICAgIH1cbiAgICBEZWJvdW5jZU9wZXJhdG9yLnByb3RvdHlwZS5fc3RhcnQgPSBmdW5jdGlvbiAob3V0KSB7XG4gICAgICAgIHRoaXMub3V0ID0gb3V0O1xuICAgICAgICB0aGlzLmlucy5fYWRkKHRoaXMpO1xuICAgIH07XG4gICAgRGVib3VuY2VPcGVyYXRvci5wcm90b3R5cGUuX3N0b3AgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuaW5zLl9yZW1vdmUodGhpcyk7XG4gICAgICAgIHRoaXMub3V0ID0gbnVsbDtcbiAgICAgICAgdGhpcy5pZCA9IG51bGw7XG4gICAgfTtcbiAgICBEZWJvdW5jZU9wZXJhdG9yLnByb3RvdHlwZS5jbGVhckludGVydmFsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgaWQgPSB0aGlzLmlkO1xuICAgICAgICBpZiAoaWQgIT09IG51bGwpIHtcbiAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwoaWQpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuaWQgPSBudWxsO1xuICAgIH07XG4gICAgRGVib3VuY2VPcGVyYXRvci5wcm90b3R5cGUuX24gPSBmdW5jdGlvbiAodCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB2YXIgdSA9IHRoaXMub3V0O1xuICAgICAgICBpZiAoIXUpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHRoaXMuY2xlYXJJbnRlcnZhbCgpO1xuICAgICAgICB0aGlzLmlkID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgX3RoaXMuY2xlYXJJbnRlcnZhbCgpO1xuICAgICAgICAgICAgdS5fbih0KTtcbiAgICAgICAgfSwgdGhpcy5kdCk7XG4gICAgfTtcbiAgICBEZWJvdW5jZU9wZXJhdG9yLnByb3RvdHlwZS5fZSA9IGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgdmFyIHUgPSB0aGlzLm91dDtcbiAgICAgICAgaWYgKCF1KVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB0aGlzLmNsZWFySW50ZXJ2YWwoKTtcbiAgICAgICAgdS5fZShlcnIpO1xuICAgIH07XG4gICAgRGVib3VuY2VPcGVyYXRvci5wcm90b3R5cGUuX2MgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciB1ID0gdGhpcy5vdXQ7XG4gICAgICAgIGlmICghdSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdGhpcy5jbGVhckludGVydmFsKCk7XG4gICAgICAgIHUuX2MoKTtcbiAgICB9O1xuICAgIHJldHVybiBEZWJvdW5jZU9wZXJhdG9yO1xufSgpKTtcbi8qKlxuICogRGVsYXlzIGV2ZW50cyB1bnRpbCBhIGNlcnRhaW4gYW1vdW50IG9mIHNpbGVuY2UgaGFzIHBhc3NlZC4gSWYgdGhhdCB0aW1lc3BhblxuICogb2Ygc2lsZW5jZSBpcyBub3QgbWV0IHRoZSBldmVudCBpcyBkcm9wcGVkLlxuICpcbiAqIE1hcmJsZSBkaWFncmFtOlxuICpcbiAqIGBgYHRleHRcbiAqIC0tMS0tLS0yLS0zLS00LS0tLTV8XG4gKiAgICAgZGVib3VuY2UoNjApXG4gKiAtLS0tLTEtLS0tLS0tLS0tNC0tfFxuICogYGBgXG4gKlxuICogRXhhbXBsZTpcbiAqXG4gKiBgYGBqc1xuICogaW1wb3J0IGZyb21EaWFncmFtIGZyb20gJ3hzdHJlYW0vZXh0cmEvZnJvbURpYWdyYW0nXG4gKiBpbXBvcnQgZGVib3VuY2UgZnJvbSAneHN0cmVhbS9leHRyYS9kZWJvdW5jZSdcbiAqXG4gKiBjb25zdCBzdHJlYW0gPSBmcm9tRGlhZ3JhbSgnLS0xLS0tLTItLTMtLTQtLS0tNXwnKVxuICogIC5jb21wb3NlKGRlYm91bmNlKDYwKSlcbiAqXG4gKiBzdHJlYW0uYWRkTGlzdGVuZXIoe1xuICogICBuZXh0OiBpID0+IGNvbnNvbGUubG9nKGkpLFxuICogICBlcnJvcjogZXJyID0+IGNvbnNvbGUuZXJyb3IoZXJyKSxcbiAqICAgY29tcGxldGU6ICgpID0+IGNvbnNvbGUubG9nKCdjb21wbGV0ZWQnKVxuICogfSlcbiAqIGBgYFxuICpcbiAqIGBgYHRleHRcbiAqID4gMVxuICogPiA0XG4gKiA+IGNvbXBsZXRlZFxuICogYGBgXG4gKlxuICogQHBhcmFtIHtudW1iZXJ9IHBlcmlvZCBUaGUgYW1vdW50IG9mIHNpbGVuY2UgcmVxdWlyZWQgaW4gbWlsbGlzZWNvbmRzLlxuICogQHJldHVybiB7U3RyZWFtfVxuICovXG5mdW5jdGlvbiBkZWJvdW5jZShwZXJpb2QpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gZGVib3VuY2VPcGVyYXRvcihpbnMpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBpbmRleF8xLlN0cmVhbShuZXcgRGVib3VuY2VPcGVyYXRvcihwZXJpb2QsIGlucykpO1xuICAgIH07XG59XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLmRlZmF1bHQgPSBkZWJvdW5jZTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRlYm91bmNlLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xudmFyIGluZGV4XzEgPSByZXF1aXJlKFwiLi4vaW5kZXhcIik7XG52YXIgZW1wdHkgPSB7fTtcbnZhciBEcm9wUmVwZWF0c09wZXJhdG9yID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBEcm9wUmVwZWF0c09wZXJhdG9yKGlucywgZm4pIHtcbiAgICAgICAgdGhpcy5pbnMgPSBpbnM7XG4gICAgICAgIHRoaXMuZm4gPSBmbjtcbiAgICAgICAgdGhpcy50eXBlID0gJ2Ryb3BSZXBlYXRzJztcbiAgICAgICAgdGhpcy5vdXQgPSBudWxsO1xuICAgICAgICB0aGlzLnYgPSBlbXB0eTtcbiAgICB9XG4gICAgRHJvcFJlcGVhdHNPcGVyYXRvci5wcm90b3R5cGUuX3N0YXJ0ID0gZnVuY3Rpb24gKG91dCkge1xuICAgICAgICB0aGlzLm91dCA9IG91dDtcbiAgICAgICAgdGhpcy5pbnMuX2FkZCh0aGlzKTtcbiAgICB9O1xuICAgIERyb3BSZXBlYXRzT3BlcmF0b3IucHJvdG90eXBlLl9zdG9wID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmlucy5fcmVtb3ZlKHRoaXMpO1xuICAgICAgICB0aGlzLm91dCA9IG51bGw7XG4gICAgICAgIHRoaXMudiA9IGVtcHR5O1xuICAgIH07XG4gICAgRHJvcFJlcGVhdHNPcGVyYXRvci5wcm90b3R5cGUuaXNFcSA9IGZ1bmN0aW9uICh4LCB5KSB7XG4gICAgICAgIHJldHVybiB0aGlzLmZuID8gdGhpcy5mbih4LCB5KSA6IHggPT09IHk7XG4gICAgfTtcbiAgICBEcm9wUmVwZWF0c09wZXJhdG9yLnByb3RvdHlwZS5fbiA9IGZ1bmN0aW9uICh0KSB7XG4gICAgICAgIHZhciB1ID0gdGhpcy5vdXQ7XG4gICAgICAgIGlmICghdSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdmFyIHYgPSB0aGlzLnY7XG4gICAgICAgIGlmICh2ICE9PSBlbXB0eSAmJiB0aGlzLmlzRXEodCwgdikpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHRoaXMudiA9IHQ7XG4gICAgICAgIHUuX24odCk7XG4gICAgfTtcbiAgICBEcm9wUmVwZWF0c09wZXJhdG9yLnByb3RvdHlwZS5fZSA9IGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgdmFyIHUgPSB0aGlzLm91dDtcbiAgICAgICAgaWYgKCF1KVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB1Ll9lKGVycik7XG4gICAgfTtcbiAgICBEcm9wUmVwZWF0c09wZXJhdG9yLnByb3RvdHlwZS5fYyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHUgPSB0aGlzLm91dDtcbiAgICAgICAgaWYgKCF1KVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB1Ll9jKCk7XG4gICAgfTtcbiAgICByZXR1cm4gRHJvcFJlcGVhdHNPcGVyYXRvcjtcbn0oKSk7XG5leHBvcnRzLkRyb3BSZXBlYXRzT3BlcmF0b3IgPSBEcm9wUmVwZWF0c09wZXJhdG9yO1xuLyoqXG4gKiBEcm9wcyBjb25zZWN1dGl2ZSBkdXBsaWNhdGUgdmFsdWVzIGluIGEgc3RyZWFtLlxuICpcbiAqIE1hcmJsZSBkaWFncmFtOlxuICpcbiAqIGBgYHRleHRcbiAqIC0tMS0tMi0tMS0tMS0tMS0tMi0tMy0tNC0tMy0tM3xcbiAqICAgICBkcm9wUmVwZWF0c1xuICogLS0xLS0yLS0xLS0tLS0tLS0yLS0zLS00LS0zLS0tfFxuICogYGBgXG4gKlxuICogRXhhbXBsZTpcbiAqXG4gKiBgYGBqc1xuICogaW1wb3J0IGRyb3BSZXBlYXRzIGZyb20gJ3hzdHJlYW0vZXh0cmEvZHJvcFJlcGVhdHMnXG4gKlxuICogY29uc3Qgc3RyZWFtID0geHMub2YoMSwgMiwgMSwgMSwgMSwgMiwgMywgNCwgMywgMylcbiAqICAgLmNvbXBvc2UoZHJvcFJlcGVhdHMoKSlcbiAqXG4gKiBzdHJlYW0uYWRkTGlzdGVuZXIoe1xuICogICBuZXh0OiBpID0+IGNvbnNvbGUubG9nKGkpLFxuICogICBlcnJvcjogZXJyID0+IGNvbnNvbGUuZXJyb3IoZXJyKSxcbiAqICAgY29tcGxldGU6ICgpID0+IGNvbnNvbGUubG9nKCdjb21wbGV0ZWQnKVxuICogfSlcbiAqIGBgYFxuICpcbiAqIGBgYHRleHRcbiAqID4gMVxuICogPiAyXG4gKiA+IDFcbiAqID4gMlxuICogPiAzXG4gKiA+IDRcbiAqID4gM1xuICogPiBjb21wbGV0ZWRcbiAqIGBgYFxuICpcbiAqIEV4YW1wbGUgd2l0aCBhIGN1c3RvbSBpc0VxdWFsIGZ1bmN0aW9uOlxuICpcbiAqIGBgYGpzXG4gKiBpbXBvcnQgZHJvcFJlcGVhdHMgZnJvbSAneHN0cmVhbS9leHRyYS9kcm9wUmVwZWF0cydcbiAqXG4gKiBjb25zdCBzdHJlYW0gPSB4cy5vZignYScsICdiJywgJ2EnLCAnQScsICdCJywgJ2InKVxuICogICAuY29tcG9zZShkcm9wUmVwZWF0cygoeCwgeSkgPT4geC50b0xvd2VyQ2FzZSgpID09PSB5LnRvTG93ZXJDYXNlKCkpKVxuICpcbiAqIHN0cmVhbS5hZGRMaXN0ZW5lcih7XG4gKiAgIG5leHQ6IGkgPT4gY29uc29sZS5sb2coaSksXG4gKiAgIGVycm9yOiBlcnIgPT4gY29uc29sZS5lcnJvcihlcnIpLFxuICogICBjb21wbGV0ZTogKCkgPT4gY29uc29sZS5sb2coJ2NvbXBsZXRlZCcpXG4gKiB9KVxuICogYGBgXG4gKlxuICogYGBgdGV4dFxuICogPiBhXG4gKiA+IGJcbiAqID4gYVxuICogPiBCXG4gKiA+IGNvbXBsZXRlZFxuICogYGBgXG4gKlxuICogQHBhcmFtIHtGdW5jdGlvbn0gaXNFcXVhbCBBbiBvcHRpb25hbCBmdW5jdGlvbiBvZiB0eXBlXG4gKiBgKHg6IFQsIHk6IFQpID0+IGJvb2xlYW5gIHRoYXQgdGFrZXMgYW4gZXZlbnQgZnJvbSB0aGUgaW5wdXQgc3RyZWFtIGFuZFxuICogY2hlY2tzIGlmIGl0IGlzIGVxdWFsIHRvIHByZXZpb3VzIGV2ZW50LCBieSByZXR1cm5pbmcgYSBib29sZWFuLlxuICogQHJldHVybiB7U3RyZWFtfVxuICovXG5mdW5jdGlvbiBkcm9wUmVwZWF0cyhpc0VxdWFsKSB7XG4gICAgaWYgKGlzRXF1YWwgPT09IHZvaWQgMCkgeyBpc0VxdWFsID0gdm9pZCAwOyB9XG4gICAgcmV0dXJuIGZ1bmN0aW9uIGRyb3BSZXBlYXRzT3BlcmF0b3IoaW5zKSB7XG4gICAgICAgIHJldHVybiBuZXcgaW5kZXhfMS5TdHJlYW0obmV3IERyb3BSZXBlYXRzT3BlcmF0b3IoaW5zLCBpc0VxdWFsKSk7XG4gICAgfTtcbn1cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuZGVmYXVsdCA9IGRyb3BSZXBlYXRzO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZHJvcFJlcGVhdHMuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19leHRlbmRzID0gKHRoaXMgJiYgdGhpcy5fX2V4dGVuZHMpIHx8IGZ1bmN0aW9uIChkLCBiKSB7XG4gICAgZm9yICh2YXIgcCBpbiBiKSBpZiAoYi5oYXNPd25Qcm9wZXJ0eShwKSkgZFtwXSA9IGJbcF07XG4gICAgZnVuY3Rpb24gX18oKSB7IHRoaXMuY29uc3RydWN0b3IgPSBkOyB9XG4gICAgZC5wcm90b3R5cGUgPSBiID09PSBudWxsID8gT2JqZWN0LmNyZWF0ZShiKSA6IChfXy5wcm90b3R5cGUgPSBiLnByb3RvdHlwZSwgbmV3IF9fKCkpO1xufTtcbnZhciBzeW1ib2xfb2JzZXJ2YWJsZV8xID0gcmVxdWlyZShcInN5bWJvbC1vYnNlcnZhYmxlXCIpO1xudmFyIE5PID0ge307XG5leHBvcnRzLk5PID0gTk87XG5mdW5jdGlvbiBub29wKCkgeyB9XG5mdW5jdGlvbiBjcChhKSB7XG4gICAgdmFyIGwgPSBhLmxlbmd0aDtcbiAgICB2YXIgYiA9IEFycmF5KGwpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbDsgKytpKVxuICAgICAgICBiW2ldID0gYVtpXTtcbiAgICByZXR1cm4gYjtcbn1cbmZ1bmN0aW9uIGFuZChmMSwgZjIpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gYW5kRm4odCkge1xuICAgICAgICByZXR1cm4gZjEodCkgJiYgZjIodCk7XG4gICAgfTtcbn1cbmZ1bmN0aW9uIF90cnkoYywgdCwgdSkge1xuICAgIHRyeSB7XG4gICAgICAgIHJldHVybiBjLmYodCk7XG4gICAgfVxuICAgIGNhdGNoIChlKSB7XG4gICAgICAgIHUuX2UoZSk7XG4gICAgICAgIHJldHVybiBOTztcbiAgICB9XG59XG52YXIgTk9fSUwgPSB7XG4gICAgX246IG5vb3AsXG4gICAgX2U6IG5vb3AsXG4gICAgX2M6IG5vb3AsXG59O1xuZXhwb3J0cy5OT19JTCA9IE5PX0lMO1xuLy8gbXV0YXRlcyB0aGUgaW5wdXRcbmZ1bmN0aW9uIGludGVybmFsaXplUHJvZHVjZXIocHJvZHVjZXIpIHtcbiAgICBwcm9kdWNlci5fc3RhcnQgPSBmdW5jdGlvbiBfc3RhcnQoaWwpIHtcbiAgICAgICAgaWwubmV4dCA9IGlsLl9uO1xuICAgICAgICBpbC5lcnJvciA9IGlsLl9lO1xuICAgICAgICBpbC5jb21wbGV0ZSA9IGlsLl9jO1xuICAgICAgICB0aGlzLnN0YXJ0KGlsKTtcbiAgICB9O1xuICAgIHByb2R1Y2VyLl9zdG9wID0gcHJvZHVjZXIuc3RvcDtcbn1cbnZhciBTdHJlYW1TdWIgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFN0cmVhbVN1Yihfc3RyZWFtLCBfbGlzdGVuZXIpIHtcbiAgICAgICAgdGhpcy5fc3RyZWFtID0gX3N0cmVhbTtcbiAgICAgICAgdGhpcy5fbGlzdGVuZXIgPSBfbGlzdGVuZXI7XG4gICAgfVxuICAgIFN0cmVhbVN1Yi5wcm90b3R5cGUudW5zdWJzY3JpYmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuX3N0cmVhbS5yZW1vdmVMaXN0ZW5lcih0aGlzLl9saXN0ZW5lcik7XG4gICAgfTtcbiAgICByZXR1cm4gU3RyZWFtU3ViO1xufSgpKTtcbnZhciBPYnNlcnZlciA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gT2JzZXJ2ZXIoX2xpc3RlbmVyKSB7XG4gICAgICAgIHRoaXMuX2xpc3RlbmVyID0gX2xpc3RlbmVyO1xuICAgIH1cbiAgICBPYnNlcnZlci5wcm90b3R5cGUubmV4dCA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICB0aGlzLl9saXN0ZW5lci5fbih2YWx1ZSk7XG4gICAgfTtcbiAgICBPYnNlcnZlci5wcm90b3R5cGUuZXJyb3IgPSBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgIHRoaXMuX2xpc3RlbmVyLl9lKGVycik7XG4gICAgfTtcbiAgICBPYnNlcnZlci5wcm90b3R5cGUuY29tcGxldGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuX2xpc3RlbmVyLl9jKCk7XG4gICAgfTtcbiAgICByZXR1cm4gT2JzZXJ2ZXI7XG59KCkpO1xudmFyIEZyb21PYnNlcnZhYmxlID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBGcm9tT2JzZXJ2YWJsZShvYnNlcnZhYmxlKSB7XG4gICAgICAgIHRoaXMudHlwZSA9ICdmcm9tT2JzZXJ2YWJsZSc7XG4gICAgICAgIHRoaXMuaW5zID0gb2JzZXJ2YWJsZTtcbiAgICAgICAgdGhpcy5hY3RpdmUgPSBmYWxzZTtcbiAgICB9XG4gICAgRnJvbU9ic2VydmFibGUucHJvdG90eXBlLl9zdGFydCA9IGZ1bmN0aW9uIChvdXQpIHtcbiAgICAgICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgICAgIHRoaXMuYWN0aXZlID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5fc3ViID0gdGhpcy5pbnMuc3Vic2NyaWJlKG5ldyBPYnNlcnZlcihvdXQpKTtcbiAgICAgICAgaWYgKCF0aGlzLmFjdGl2ZSlcbiAgICAgICAgICAgIHRoaXMuX3N1Yi51bnN1YnNjcmliZSgpO1xuICAgIH07XG4gICAgRnJvbU9ic2VydmFibGUucHJvdG90eXBlLl9zdG9wID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodGhpcy5fc3ViKVxuICAgICAgICAgICAgdGhpcy5fc3ViLnVuc3Vic2NyaWJlKCk7XG4gICAgICAgIHRoaXMuYWN0aXZlID0gZmFsc2U7XG4gICAgfTtcbiAgICByZXR1cm4gRnJvbU9ic2VydmFibGU7XG59KCkpO1xudmFyIE1lcmdlID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBNZXJnZShpbnNBcnIpIHtcbiAgICAgICAgdGhpcy50eXBlID0gJ21lcmdlJztcbiAgICAgICAgdGhpcy5pbnNBcnIgPSBpbnNBcnI7XG4gICAgICAgIHRoaXMub3V0ID0gTk87XG4gICAgICAgIHRoaXMuYWMgPSAwO1xuICAgIH1cbiAgICBNZXJnZS5wcm90b3R5cGUuX3N0YXJ0ID0gZnVuY3Rpb24gKG91dCkge1xuICAgICAgICB0aGlzLm91dCA9IG91dDtcbiAgICAgICAgdmFyIHMgPSB0aGlzLmluc0FycjtcbiAgICAgICAgdmFyIEwgPSBzLmxlbmd0aDtcbiAgICAgICAgdGhpcy5hYyA9IEw7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgTDsgaSsrKVxuICAgICAgICAgICAgc1tpXS5fYWRkKHRoaXMpO1xuICAgIH07XG4gICAgTWVyZ2UucHJvdG90eXBlLl9zdG9wID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgcyA9IHRoaXMuaW5zQXJyO1xuICAgICAgICB2YXIgTCA9IHMubGVuZ3RoO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IEw7IGkrKylcbiAgICAgICAgICAgIHNbaV0uX3JlbW92ZSh0aGlzKTtcbiAgICAgICAgdGhpcy5vdXQgPSBOTztcbiAgICB9O1xuICAgIE1lcmdlLnByb3RvdHlwZS5fbiA9IGZ1bmN0aW9uICh0KSB7XG4gICAgICAgIHZhciB1ID0gdGhpcy5vdXQ7XG4gICAgICAgIGlmICh1ID09PSBOTylcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdS5fbih0KTtcbiAgICB9O1xuICAgIE1lcmdlLnByb3RvdHlwZS5fZSA9IGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgdmFyIHUgPSB0aGlzLm91dDtcbiAgICAgICAgaWYgKHUgPT09IE5PKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB1Ll9lKGVycik7XG4gICAgfTtcbiAgICBNZXJnZS5wcm90b3R5cGUuX2MgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICgtLXRoaXMuYWMgPD0gMCkge1xuICAgICAgICAgICAgdmFyIHUgPSB0aGlzLm91dDtcbiAgICAgICAgICAgIGlmICh1ID09PSBOTylcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB1Ll9jKCk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHJldHVybiBNZXJnZTtcbn0oKSk7XG52YXIgQ29tYmluZUxpc3RlbmVyID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBDb21iaW5lTGlzdGVuZXIoaSwgb3V0LCBwKSB7XG4gICAgICAgIHRoaXMuaSA9IGk7XG4gICAgICAgIHRoaXMub3V0ID0gb3V0O1xuICAgICAgICB0aGlzLnAgPSBwO1xuICAgICAgICBwLmlscy5wdXNoKHRoaXMpO1xuICAgIH1cbiAgICBDb21iaW5lTGlzdGVuZXIucHJvdG90eXBlLl9uID0gZnVuY3Rpb24gKHQpIHtcbiAgICAgICAgdmFyIHAgPSB0aGlzLnAsIG91dCA9IHRoaXMub3V0O1xuICAgICAgICBpZiAob3V0ID09PSBOTylcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgaWYgKHAudXAodCwgdGhpcy5pKSkge1xuICAgICAgICAgICAgdmFyIGEgPSBwLnZhbHM7XG4gICAgICAgICAgICB2YXIgbCA9IGEubGVuZ3RoO1xuICAgICAgICAgICAgdmFyIGIgPSBBcnJheShsKTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbDsgKytpKVxuICAgICAgICAgICAgICAgIGJbaV0gPSBhW2ldO1xuICAgICAgICAgICAgb3V0Ll9uKGIpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBDb21iaW5lTGlzdGVuZXIucHJvdG90eXBlLl9lID0gZnVuY3Rpb24gKGVycikge1xuICAgICAgICB2YXIgb3V0ID0gdGhpcy5vdXQ7XG4gICAgICAgIGlmIChvdXQgPT09IE5PKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBvdXQuX2UoZXJyKTtcbiAgICB9O1xuICAgIENvbWJpbmVMaXN0ZW5lci5wcm90b3R5cGUuX2MgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBwID0gdGhpcy5wO1xuICAgICAgICBpZiAocC5vdXQgPT09IE5PKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBpZiAoLS1wLk5jID09PSAwKVxuICAgICAgICAgICAgcC5vdXQuX2MoKTtcbiAgICB9O1xuICAgIHJldHVybiBDb21iaW5lTGlzdGVuZXI7XG59KCkpO1xudmFyIENvbWJpbmUgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIENvbWJpbmUoaW5zQXJyKSB7XG4gICAgICAgIHRoaXMudHlwZSA9ICdjb21iaW5lJztcbiAgICAgICAgdGhpcy5pbnNBcnIgPSBpbnNBcnI7XG4gICAgICAgIHRoaXMub3V0ID0gTk87XG4gICAgICAgIHRoaXMuaWxzID0gW107XG4gICAgICAgIHRoaXMuTmMgPSB0aGlzLk5uID0gMDtcbiAgICAgICAgdGhpcy52YWxzID0gW107XG4gICAgfVxuICAgIENvbWJpbmUucHJvdG90eXBlLnVwID0gZnVuY3Rpb24gKHQsIGkpIHtcbiAgICAgICAgdmFyIHYgPSB0aGlzLnZhbHNbaV07XG4gICAgICAgIHZhciBObiA9ICF0aGlzLk5uID8gMCA6IHYgPT09IE5PID8gLS10aGlzLk5uIDogdGhpcy5ObjtcbiAgICAgICAgdGhpcy52YWxzW2ldID0gdDtcbiAgICAgICAgcmV0dXJuIE5uID09PSAwO1xuICAgIH07XG4gICAgQ29tYmluZS5wcm90b3R5cGUuX3N0YXJ0ID0gZnVuY3Rpb24gKG91dCkge1xuICAgICAgICB0aGlzLm91dCA9IG91dDtcbiAgICAgICAgdmFyIHMgPSB0aGlzLmluc0FycjtcbiAgICAgICAgdmFyIG4gPSB0aGlzLk5jID0gdGhpcy5ObiA9IHMubGVuZ3RoO1xuICAgICAgICB2YXIgdmFscyA9IHRoaXMudmFscyA9IG5ldyBBcnJheShuKTtcbiAgICAgICAgaWYgKG4gPT09IDApIHtcbiAgICAgICAgICAgIG91dC5fbihbXSk7XG4gICAgICAgICAgICBvdXQuX2MoKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFsc1tpXSA9IE5PO1xuICAgICAgICAgICAgICAgIHNbaV0uX2FkZChuZXcgQ29tYmluZUxpc3RlbmVyKGksIG91dCwgdGhpcykpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbiAgICBDb21iaW5lLnByb3RvdHlwZS5fc3RvcCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHMgPSB0aGlzLmluc0FycjtcbiAgICAgICAgdmFyIG4gPSBzLmxlbmd0aDtcbiAgICAgICAgdmFyIGlscyA9IHRoaXMuaWxzO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG47IGkrKylcbiAgICAgICAgICAgIHNbaV0uX3JlbW92ZShpbHNbaV0pO1xuICAgICAgICB0aGlzLm91dCA9IE5PO1xuICAgICAgICB0aGlzLmlscyA9IFtdO1xuICAgICAgICB0aGlzLnZhbHMgPSBbXTtcbiAgICB9O1xuICAgIHJldHVybiBDb21iaW5lO1xufSgpKTtcbnZhciBGcm9tQXJyYXkgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIEZyb21BcnJheShhKSB7XG4gICAgICAgIHRoaXMudHlwZSA9ICdmcm9tQXJyYXknO1xuICAgICAgICB0aGlzLmEgPSBhO1xuICAgIH1cbiAgICBGcm9tQXJyYXkucHJvdG90eXBlLl9zdGFydCA9IGZ1bmN0aW9uIChvdXQpIHtcbiAgICAgICAgdmFyIGEgPSB0aGlzLmE7XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBuID0gYS5sZW5ndGg7IGkgPCBuOyBpKyspXG4gICAgICAgICAgICBvdXQuX24oYVtpXSk7XG4gICAgICAgIG91dC5fYygpO1xuICAgIH07XG4gICAgRnJvbUFycmF5LnByb3RvdHlwZS5fc3RvcCA9IGZ1bmN0aW9uICgpIHtcbiAgICB9O1xuICAgIHJldHVybiBGcm9tQXJyYXk7XG59KCkpO1xudmFyIEZyb21Qcm9taXNlID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBGcm9tUHJvbWlzZShwKSB7XG4gICAgICAgIHRoaXMudHlwZSA9ICdmcm9tUHJvbWlzZSc7XG4gICAgICAgIHRoaXMub24gPSBmYWxzZTtcbiAgICAgICAgdGhpcy5wID0gcDtcbiAgICB9XG4gICAgRnJvbVByb21pc2UucHJvdG90eXBlLl9zdGFydCA9IGZ1bmN0aW9uIChvdXQpIHtcbiAgICAgICAgdmFyIHByb2QgPSB0aGlzO1xuICAgICAgICB0aGlzLm9uID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5wLnRoZW4oZnVuY3Rpb24gKHYpIHtcbiAgICAgICAgICAgIGlmIChwcm9kLm9uKSB7XG4gICAgICAgICAgICAgICAgb3V0Ll9uKHYpO1xuICAgICAgICAgICAgICAgIG91dC5fYygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgb3V0Ll9lKGUpO1xuICAgICAgICB9KS50aGVuKG5vb3AsIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkgeyB0aHJvdyBlcnI7IH0pO1xuICAgICAgICB9KTtcbiAgICB9O1xuICAgIEZyb21Qcm9taXNlLnByb3RvdHlwZS5fc3RvcCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5vbiA9IGZhbHNlO1xuICAgIH07XG4gICAgcmV0dXJuIEZyb21Qcm9taXNlO1xufSgpKTtcbnZhciBQZXJpb2RpYyA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gUGVyaW9kaWMocGVyaW9kKSB7XG4gICAgICAgIHRoaXMudHlwZSA9ICdwZXJpb2RpYyc7XG4gICAgICAgIHRoaXMucGVyaW9kID0gcGVyaW9kO1xuICAgICAgICB0aGlzLmludGVydmFsSUQgPSAtMTtcbiAgICAgICAgdGhpcy5pID0gMDtcbiAgICB9XG4gICAgUGVyaW9kaWMucHJvdG90eXBlLl9zdGFydCA9IGZ1bmN0aW9uIChvdXQpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICBmdW5jdGlvbiBpbnRlcnZhbEhhbmRsZXIoKSB7IG91dC5fbihzZWxmLmkrKyk7IH1cbiAgICAgICAgdGhpcy5pbnRlcnZhbElEID0gc2V0SW50ZXJ2YWwoaW50ZXJ2YWxIYW5kbGVyLCB0aGlzLnBlcmlvZCk7XG4gICAgfTtcbiAgICBQZXJpb2RpYy5wcm90b3R5cGUuX3N0b3AgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0aGlzLmludGVydmFsSUQgIT09IC0xKVxuICAgICAgICAgICAgY2xlYXJJbnRlcnZhbCh0aGlzLmludGVydmFsSUQpO1xuICAgICAgICB0aGlzLmludGVydmFsSUQgPSAtMTtcbiAgICAgICAgdGhpcy5pID0gMDtcbiAgICB9O1xuICAgIHJldHVybiBQZXJpb2RpYztcbn0oKSk7XG52YXIgRGVidWcgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIERlYnVnKGlucywgYXJnKSB7XG4gICAgICAgIHRoaXMudHlwZSA9ICdkZWJ1Zyc7XG4gICAgICAgIHRoaXMuaW5zID0gaW5zO1xuICAgICAgICB0aGlzLm91dCA9IE5PO1xuICAgICAgICB0aGlzLnMgPSBub29wO1xuICAgICAgICB0aGlzLmwgPSAnJztcbiAgICAgICAgaWYgKHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnKVxuICAgICAgICAgICAgdGhpcy5sID0gYXJnO1xuICAgICAgICBlbHNlIGlmICh0eXBlb2YgYXJnID09PSAnZnVuY3Rpb24nKVxuICAgICAgICAgICAgdGhpcy5zID0gYXJnO1xuICAgIH1cbiAgICBEZWJ1Zy5wcm90b3R5cGUuX3N0YXJ0ID0gZnVuY3Rpb24gKG91dCkge1xuICAgICAgICB0aGlzLm91dCA9IG91dDtcbiAgICAgICAgdGhpcy5pbnMuX2FkZCh0aGlzKTtcbiAgICB9O1xuICAgIERlYnVnLnByb3RvdHlwZS5fc3RvcCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5pbnMuX3JlbW92ZSh0aGlzKTtcbiAgICAgICAgdGhpcy5vdXQgPSBOTztcbiAgICB9O1xuICAgIERlYnVnLnByb3RvdHlwZS5fbiA9IGZ1bmN0aW9uICh0KSB7XG4gICAgICAgIHZhciB1ID0gdGhpcy5vdXQ7XG4gICAgICAgIGlmICh1ID09PSBOTylcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdmFyIHMgPSB0aGlzLnMsIGwgPSB0aGlzLmw7XG4gICAgICAgIGlmIChzICE9PSBub29wKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHModCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIHUuX2UoZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAobClcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGwgKyAnOicsIHQpO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBjb25zb2xlLmxvZyh0KTtcbiAgICAgICAgdS5fbih0KTtcbiAgICB9O1xuICAgIERlYnVnLnByb3RvdHlwZS5fZSA9IGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgdmFyIHUgPSB0aGlzLm91dDtcbiAgICAgICAgaWYgKHUgPT09IE5PKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB1Ll9lKGVycik7XG4gICAgfTtcbiAgICBEZWJ1Zy5wcm90b3R5cGUuX2MgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciB1ID0gdGhpcy5vdXQ7XG4gICAgICAgIGlmICh1ID09PSBOTylcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdS5fYygpO1xuICAgIH07XG4gICAgcmV0dXJuIERlYnVnO1xufSgpKTtcbnZhciBEcm9wID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBEcm9wKG1heCwgaW5zKSB7XG4gICAgICAgIHRoaXMudHlwZSA9ICdkcm9wJztcbiAgICAgICAgdGhpcy5pbnMgPSBpbnM7XG4gICAgICAgIHRoaXMub3V0ID0gTk87XG4gICAgICAgIHRoaXMubWF4ID0gbWF4O1xuICAgICAgICB0aGlzLmRyb3BwZWQgPSAwO1xuICAgIH1cbiAgICBEcm9wLnByb3RvdHlwZS5fc3RhcnQgPSBmdW5jdGlvbiAob3V0KSB7XG4gICAgICAgIHRoaXMub3V0ID0gb3V0O1xuICAgICAgICB0aGlzLmRyb3BwZWQgPSAwO1xuICAgICAgICB0aGlzLmlucy5fYWRkKHRoaXMpO1xuICAgIH07XG4gICAgRHJvcC5wcm90b3R5cGUuX3N0b3AgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuaW5zLl9yZW1vdmUodGhpcyk7XG4gICAgICAgIHRoaXMub3V0ID0gTk87XG4gICAgfTtcbiAgICBEcm9wLnByb3RvdHlwZS5fbiA9IGZ1bmN0aW9uICh0KSB7XG4gICAgICAgIHZhciB1ID0gdGhpcy5vdXQ7XG4gICAgICAgIGlmICh1ID09PSBOTylcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgaWYgKHRoaXMuZHJvcHBlZCsrID49IHRoaXMubWF4KVxuICAgICAgICAgICAgdS5fbih0KTtcbiAgICB9O1xuICAgIERyb3AucHJvdG90eXBlLl9lID0gZnVuY3Rpb24gKGVycikge1xuICAgICAgICB2YXIgdSA9IHRoaXMub3V0O1xuICAgICAgICBpZiAodSA9PT0gTk8pXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHUuX2UoZXJyKTtcbiAgICB9O1xuICAgIERyb3AucHJvdG90eXBlLl9jID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgdSA9IHRoaXMub3V0O1xuICAgICAgICBpZiAodSA9PT0gTk8pXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHUuX2MoKTtcbiAgICB9O1xuICAgIHJldHVybiBEcm9wO1xufSgpKTtcbnZhciBFbmRXaGVuTGlzdGVuZXIgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIEVuZFdoZW5MaXN0ZW5lcihvdXQsIG9wKSB7XG4gICAgICAgIHRoaXMub3V0ID0gb3V0O1xuICAgICAgICB0aGlzLm9wID0gb3A7XG4gICAgfVxuICAgIEVuZFdoZW5MaXN0ZW5lci5wcm90b3R5cGUuX24gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMub3AuZW5kKCk7XG4gICAgfTtcbiAgICBFbmRXaGVuTGlzdGVuZXIucHJvdG90eXBlLl9lID0gZnVuY3Rpb24gKGVycikge1xuICAgICAgICB0aGlzLm91dC5fZShlcnIpO1xuICAgIH07XG4gICAgRW5kV2hlbkxpc3RlbmVyLnByb3RvdHlwZS5fYyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5vcC5lbmQoKTtcbiAgICB9O1xuICAgIHJldHVybiBFbmRXaGVuTGlzdGVuZXI7XG59KCkpO1xudmFyIEVuZFdoZW4gPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIEVuZFdoZW4obywgaW5zKSB7XG4gICAgICAgIHRoaXMudHlwZSA9ICdlbmRXaGVuJztcbiAgICAgICAgdGhpcy5pbnMgPSBpbnM7XG4gICAgICAgIHRoaXMub3V0ID0gTk87XG4gICAgICAgIHRoaXMubyA9IG87XG4gICAgICAgIHRoaXMub2lsID0gTk9fSUw7XG4gICAgfVxuICAgIEVuZFdoZW4ucHJvdG90eXBlLl9zdGFydCA9IGZ1bmN0aW9uIChvdXQpIHtcbiAgICAgICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgICAgIHRoaXMuby5fYWRkKHRoaXMub2lsID0gbmV3IEVuZFdoZW5MaXN0ZW5lcihvdXQsIHRoaXMpKTtcbiAgICAgICAgdGhpcy5pbnMuX2FkZCh0aGlzKTtcbiAgICB9O1xuICAgIEVuZFdoZW4ucHJvdG90eXBlLl9zdG9wID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmlucy5fcmVtb3ZlKHRoaXMpO1xuICAgICAgICB0aGlzLm8uX3JlbW92ZSh0aGlzLm9pbCk7XG4gICAgICAgIHRoaXMub3V0ID0gTk87XG4gICAgICAgIHRoaXMub2lsID0gTk9fSUw7XG4gICAgfTtcbiAgICBFbmRXaGVuLnByb3RvdHlwZS5lbmQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciB1ID0gdGhpcy5vdXQ7XG4gICAgICAgIGlmICh1ID09PSBOTylcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdS5fYygpO1xuICAgIH07XG4gICAgRW5kV2hlbi5wcm90b3R5cGUuX24gPSBmdW5jdGlvbiAodCkge1xuICAgICAgICB2YXIgdSA9IHRoaXMub3V0O1xuICAgICAgICBpZiAodSA9PT0gTk8pXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHUuX24odCk7XG4gICAgfTtcbiAgICBFbmRXaGVuLnByb3RvdHlwZS5fZSA9IGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgdmFyIHUgPSB0aGlzLm91dDtcbiAgICAgICAgaWYgKHUgPT09IE5PKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB1Ll9lKGVycik7XG4gICAgfTtcbiAgICBFbmRXaGVuLnByb3RvdHlwZS5fYyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5lbmQoKTtcbiAgICB9O1xuICAgIHJldHVybiBFbmRXaGVuO1xufSgpKTtcbnZhciBGaWx0ZXIgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIEZpbHRlcihwYXNzZXMsIGlucykge1xuICAgICAgICB0aGlzLnR5cGUgPSAnZmlsdGVyJztcbiAgICAgICAgdGhpcy5pbnMgPSBpbnM7XG4gICAgICAgIHRoaXMub3V0ID0gTk87XG4gICAgICAgIHRoaXMuZiA9IHBhc3NlcztcbiAgICB9XG4gICAgRmlsdGVyLnByb3RvdHlwZS5fc3RhcnQgPSBmdW5jdGlvbiAob3V0KSB7XG4gICAgICAgIHRoaXMub3V0ID0gb3V0O1xuICAgICAgICB0aGlzLmlucy5fYWRkKHRoaXMpO1xuICAgIH07XG4gICAgRmlsdGVyLnByb3RvdHlwZS5fc3RvcCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5pbnMuX3JlbW92ZSh0aGlzKTtcbiAgICAgICAgdGhpcy5vdXQgPSBOTztcbiAgICB9O1xuICAgIEZpbHRlci5wcm90b3R5cGUuX24gPSBmdW5jdGlvbiAodCkge1xuICAgICAgICB2YXIgdSA9IHRoaXMub3V0O1xuICAgICAgICBpZiAodSA9PT0gTk8pXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHZhciByID0gX3RyeSh0aGlzLCB0LCB1KTtcbiAgICAgICAgaWYgKHIgPT09IE5PIHx8ICFyKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB1Ll9uKHQpO1xuICAgIH07XG4gICAgRmlsdGVyLnByb3RvdHlwZS5fZSA9IGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgdmFyIHUgPSB0aGlzLm91dDtcbiAgICAgICAgaWYgKHUgPT09IE5PKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB1Ll9lKGVycik7XG4gICAgfTtcbiAgICBGaWx0ZXIucHJvdG90eXBlLl9jID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgdSA9IHRoaXMub3V0O1xuICAgICAgICBpZiAodSA9PT0gTk8pXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHUuX2MoKTtcbiAgICB9O1xuICAgIHJldHVybiBGaWx0ZXI7XG59KCkpO1xudmFyIEZsYXR0ZW5MaXN0ZW5lciA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gRmxhdHRlbkxpc3RlbmVyKG91dCwgb3ApIHtcbiAgICAgICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgICAgIHRoaXMub3AgPSBvcDtcbiAgICB9XG4gICAgRmxhdHRlbkxpc3RlbmVyLnByb3RvdHlwZS5fbiA9IGZ1bmN0aW9uICh0KSB7XG4gICAgICAgIHRoaXMub3V0Ll9uKHQpO1xuICAgIH07XG4gICAgRmxhdHRlbkxpc3RlbmVyLnByb3RvdHlwZS5fZSA9IGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgdGhpcy5vdXQuX2UoZXJyKTtcbiAgICB9O1xuICAgIEZsYXR0ZW5MaXN0ZW5lci5wcm90b3R5cGUuX2MgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMub3AuaW5uZXIgPSBOTztcbiAgICAgICAgdGhpcy5vcC5sZXNzKCk7XG4gICAgfTtcbiAgICByZXR1cm4gRmxhdHRlbkxpc3RlbmVyO1xufSgpKTtcbnZhciBGbGF0dGVuID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBGbGF0dGVuKGlucykge1xuICAgICAgICB0aGlzLnR5cGUgPSAnZmxhdHRlbic7XG4gICAgICAgIHRoaXMuaW5zID0gaW5zO1xuICAgICAgICB0aGlzLm91dCA9IE5PO1xuICAgICAgICB0aGlzLm9wZW4gPSB0cnVlO1xuICAgICAgICB0aGlzLmlubmVyID0gTk87XG4gICAgICAgIHRoaXMuaWwgPSBOT19JTDtcbiAgICB9XG4gICAgRmxhdHRlbi5wcm90b3R5cGUuX3N0YXJ0ID0gZnVuY3Rpb24gKG91dCkge1xuICAgICAgICB0aGlzLm91dCA9IG91dDtcbiAgICAgICAgdGhpcy5vcGVuID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5pbm5lciA9IE5PO1xuICAgICAgICB0aGlzLmlsID0gTk9fSUw7XG4gICAgICAgIHRoaXMuaW5zLl9hZGQodGhpcyk7XG4gICAgfTtcbiAgICBGbGF0dGVuLnByb3RvdHlwZS5fc3RvcCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5pbnMuX3JlbW92ZSh0aGlzKTtcbiAgICAgICAgaWYgKHRoaXMuaW5uZXIgIT09IE5PKVxuICAgICAgICAgICAgdGhpcy5pbm5lci5fcmVtb3ZlKHRoaXMuaWwpO1xuICAgICAgICB0aGlzLm91dCA9IE5PO1xuICAgICAgICB0aGlzLm9wZW4gPSB0cnVlO1xuICAgICAgICB0aGlzLmlubmVyID0gTk87XG4gICAgICAgIHRoaXMuaWwgPSBOT19JTDtcbiAgICB9O1xuICAgIEZsYXR0ZW4ucHJvdG90eXBlLmxlc3MgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciB1ID0gdGhpcy5vdXQ7XG4gICAgICAgIGlmICh1ID09PSBOTylcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgaWYgKCF0aGlzLm9wZW4gJiYgdGhpcy5pbm5lciA9PT0gTk8pXG4gICAgICAgICAgICB1Ll9jKCk7XG4gICAgfTtcbiAgICBGbGF0dGVuLnByb3RvdHlwZS5fbiA9IGZ1bmN0aW9uIChzKSB7XG4gICAgICAgIHZhciB1ID0gdGhpcy5vdXQ7XG4gICAgICAgIGlmICh1ID09PSBOTylcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdmFyIF9hID0gdGhpcywgaW5uZXIgPSBfYS5pbm5lciwgaWwgPSBfYS5pbDtcbiAgICAgICAgaWYgKGlubmVyICE9PSBOTyAmJiBpbCAhPT0gTk9fSUwpXG4gICAgICAgICAgICBpbm5lci5fcmVtb3ZlKGlsKTtcbiAgICAgICAgKHRoaXMuaW5uZXIgPSBzKS5fYWRkKHRoaXMuaWwgPSBuZXcgRmxhdHRlbkxpc3RlbmVyKHUsIHRoaXMpKTtcbiAgICB9O1xuICAgIEZsYXR0ZW4ucHJvdG90eXBlLl9lID0gZnVuY3Rpb24gKGVycikge1xuICAgICAgICB2YXIgdSA9IHRoaXMub3V0O1xuICAgICAgICBpZiAodSA9PT0gTk8pXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHUuX2UoZXJyKTtcbiAgICB9O1xuICAgIEZsYXR0ZW4ucHJvdG90eXBlLl9jID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLm9wZW4gPSBmYWxzZTtcbiAgICAgICAgdGhpcy5sZXNzKCk7XG4gICAgfTtcbiAgICByZXR1cm4gRmxhdHRlbjtcbn0oKSk7XG52YXIgRm9sZCA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gRm9sZChmLCBzZWVkLCBpbnMpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdGhpcy50eXBlID0gJ2ZvbGQnO1xuICAgICAgICB0aGlzLmlucyA9IGlucztcbiAgICAgICAgdGhpcy5vdXQgPSBOTztcbiAgICAgICAgdGhpcy5mID0gZnVuY3Rpb24gKHQpIHsgcmV0dXJuIGYoX3RoaXMuYWNjLCB0KTsgfTtcbiAgICAgICAgdGhpcy5hY2MgPSB0aGlzLnNlZWQgPSBzZWVkO1xuICAgIH1cbiAgICBGb2xkLnByb3RvdHlwZS5fc3RhcnQgPSBmdW5jdGlvbiAob3V0KSB7XG4gICAgICAgIHRoaXMub3V0ID0gb3V0O1xuICAgICAgICB0aGlzLmFjYyA9IHRoaXMuc2VlZDtcbiAgICAgICAgb3V0Ll9uKHRoaXMuYWNjKTtcbiAgICAgICAgdGhpcy5pbnMuX2FkZCh0aGlzKTtcbiAgICB9O1xuICAgIEZvbGQucHJvdG90eXBlLl9zdG9wID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmlucy5fcmVtb3ZlKHRoaXMpO1xuICAgICAgICB0aGlzLm91dCA9IE5PO1xuICAgICAgICB0aGlzLmFjYyA9IHRoaXMuc2VlZDtcbiAgICB9O1xuICAgIEZvbGQucHJvdG90eXBlLl9uID0gZnVuY3Rpb24gKHQpIHtcbiAgICAgICAgdmFyIHUgPSB0aGlzLm91dDtcbiAgICAgICAgaWYgKHUgPT09IE5PKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB2YXIgciA9IF90cnkodGhpcywgdCwgdSk7XG4gICAgICAgIGlmIChyID09PSBOTylcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdS5fbih0aGlzLmFjYyA9IHIpO1xuICAgIH07XG4gICAgRm9sZC5wcm90b3R5cGUuX2UgPSBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgIHZhciB1ID0gdGhpcy5vdXQ7XG4gICAgICAgIGlmICh1ID09PSBOTylcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdS5fZShlcnIpO1xuICAgIH07XG4gICAgRm9sZC5wcm90b3R5cGUuX2MgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciB1ID0gdGhpcy5vdXQ7XG4gICAgICAgIGlmICh1ID09PSBOTylcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdS5fYygpO1xuICAgIH07XG4gICAgcmV0dXJuIEZvbGQ7XG59KCkpO1xudmFyIExhc3QgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIExhc3QoaW5zKSB7XG4gICAgICAgIHRoaXMudHlwZSA9ICdsYXN0JztcbiAgICAgICAgdGhpcy5pbnMgPSBpbnM7XG4gICAgICAgIHRoaXMub3V0ID0gTk87XG4gICAgICAgIHRoaXMuaGFzID0gZmFsc2U7XG4gICAgICAgIHRoaXMudmFsID0gTk87XG4gICAgfVxuICAgIExhc3QucHJvdG90eXBlLl9zdGFydCA9IGZ1bmN0aW9uIChvdXQpIHtcbiAgICAgICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgICAgIHRoaXMuaGFzID0gZmFsc2U7XG4gICAgICAgIHRoaXMuaW5zLl9hZGQodGhpcyk7XG4gICAgfTtcbiAgICBMYXN0LnByb3RvdHlwZS5fc3RvcCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5pbnMuX3JlbW92ZSh0aGlzKTtcbiAgICAgICAgdGhpcy5vdXQgPSBOTztcbiAgICAgICAgdGhpcy52YWwgPSBOTztcbiAgICB9O1xuICAgIExhc3QucHJvdG90eXBlLl9uID0gZnVuY3Rpb24gKHQpIHtcbiAgICAgICAgdGhpcy5oYXMgPSB0cnVlO1xuICAgICAgICB0aGlzLnZhbCA9IHQ7XG4gICAgfTtcbiAgICBMYXN0LnByb3RvdHlwZS5fZSA9IGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgdmFyIHUgPSB0aGlzLm91dDtcbiAgICAgICAgaWYgKHUgPT09IE5PKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB1Ll9lKGVycik7XG4gICAgfTtcbiAgICBMYXN0LnByb3RvdHlwZS5fYyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHUgPSB0aGlzLm91dDtcbiAgICAgICAgaWYgKHUgPT09IE5PKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBpZiAodGhpcy5oYXMpIHtcbiAgICAgICAgICAgIHUuX24odGhpcy52YWwpO1xuICAgICAgICAgICAgdS5fYygpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHUuX2UobmV3IEVycm9yKCdsYXN0KCkgZmFpbGVkIGJlY2F1c2UgaW5wdXQgc3RyZWFtIGNvbXBsZXRlZCcpKTtcbiAgICB9O1xuICAgIHJldHVybiBMYXN0O1xufSgpKTtcbnZhciBNYXBPcCA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gTWFwT3AocHJvamVjdCwgaW5zKSB7XG4gICAgICAgIHRoaXMudHlwZSA9ICdtYXAnO1xuICAgICAgICB0aGlzLmlucyA9IGlucztcbiAgICAgICAgdGhpcy5vdXQgPSBOTztcbiAgICAgICAgdGhpcy5mID0gcHJvamVjdDtcbiAgICB9XG4gICAgTWFwT3AucHJvdG90eXBlLl9zdGFydCA9IGZ1bmN0aW9uIChvdXQpIHtcbiAgICAgICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgICAgIHRoaXMuaW5zLl9hZGQodGhpcyk7XG4gICAgfTtcbiAgICBNYXBPcC5wcm90b3R5cGUuX3N0b3AgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuaW5zLl9yZW1vdmUodGhpcyk7XG4gICAgICAgIHRoaXMub3V0ID0gTk87XG4gICAgfTtcbiAgICBNYXBPcC5wcm90b3R5cGUuX24gPSBmdW5jdGlvbiAodCkge1xuICAgICAgICB2YXIgdSA9IHRoaXMub3V0O1xuICAgICAgICBpZiAodSA9PT0gTk8pXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHZhciByID0gX3RyeSh0aGlzLCB0LCB1KTtcbiAgICAgICAgaWYgKHIgPT09IE5PKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB1Ll9uKHIpO1xuICAgIH07XG4gICAgTWFwT3AucHJvdG90eXBlLl9lID0gZnVuY3Rpb24gKGVycikge1xuICAgICAgICB2YXIgdSA9IHRoaXMub3V0O1xuICAgICAgICBpZiAodSA9PT0gTk8pXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHUuX2UoZXJyKTtcbiAgICB9O1xuICAgIE1hcE9wLnByb3RvdHlwZS5fYyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHUgPSB0aGlzLm91dDtcbiAgICAgICAgaWYgKHUgPT09IE5PKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB1Ll9jKCk7XG4gICAgfTtcbiAgICByZXR1cm4gTWFwT3A7XG59KCkpO1xudmFyIFJlbWVtYmVyID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBSZW1lbWJlcihpbnMpIHtcbiAgICAgICAgdGhpcy50eXBlID0gJ3JlbWVtYmVyJztcbiAgICAgICAgdGhpcy5pbnMgPSBpbnM7XG4gICAgICAgIHRoaXMub3V0ID0gTk87XG4gICAgfVxuICAgIFJlbWVtYmVyLnByb3RvdHlwZS5fc3RhcnQgPSBmdW5jdGlvbiAob3V0KSB7XG4gICAgICAgIHRoaXMub3V0ID0gb3V0O1xuICAgICAgICB0aGlzLmlucy5fYWRkKG91dCk7XG4gICAgfTtcbiAgICBSZW1lbWJlci5wcm90b3R5cGUuX3N0b3AgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuaW5zLl9yZW1vdmUodGhpcy5vdXQpO1xuICAgICAgICB0aGlzLm91dCA9IE5PO1xuICAgIH07XG4gICAgcmV0dXJuIFJlbWVtYmVyO1xufSgpKTtcbnZhciBSZXBsYWNlRXJyb3IgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFJlcGxhY2VFcnJvcihyZXBsYWNlciwgaW5zKSB7XG4gICAgICAgIHRoaXMudHlwZSA9ICdyZXBsYWNlRXJyb3InO1xuICAgICAgICB0aGlzLmlucyA9IGlucztcbiAgICAgICAgdGhpcy5vdXQgPSBOTztcbiAgICAgICAgdGhpcy5mID0gcmVwbGFjZXI7XG4gICAgfVxuICAgIFJlcGxhY2VFcnJvci5wcm90b3R5cGUuX3N0YXJ0ID0gZnVuY3Rpb24gKG91dCkge1xuICAgICAgICB0aGlzLm91dCA9IG91dDtcbiAgICAgICAgdGhpcy5pbnMuX2FkZCh0aGlzKTtcbiAgICB9O1xuICAgIFJlcGxhY2VFcnJvci5wcm90b3R5cGUuX3N0b3AgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuaW5zLl9yZW1vdmUodGhpcyk7XG4gICAgICAgIHRoaXMub3V0ID0gTk87XG4gICAgfTtcbiAgICBSZXBsYWNlRXJyb3IucHJvdG90eXBlLl9uID0gZnVuY3Rpb24gKHQpIHtcbiAgICAgICAgdmFyIHUgPSB0aGlzLm91dDtcbiAgICAgICAgaWYgKHUgPT09IE5PKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB1Ll9uKHQpO1xuICAgIH07XG4gICAgUmVwbGFjZUVycm9yLnByb3RvdHlwZS5fZSA9IGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgdmFyIHUgPSB0aGlzLm91dDtcbiAgICAgICAgaWYgKHUgPT09IE5PKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdGhpcy5pbnMuX3JlbW92ZSh0aGlzKTtcbiAgICAgICAgICAgICh0aGlzLmlucyA9IHRoaXMuZihlcnIpKS5fYWRkKHRoaXMpO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICB1Ll9lKGUpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBSZXBsYWNlRXJyb3IucHJvdG90eXBlLl9jID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgdSA9IHRoaXMub3V0O1xuICAgICAgICBpZiAodSA9PT0gTk8pXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHUuX2MoKTtcbiAgICB9O1xuICAgIHJldHVybiBSZXBsYWNlRXJyb3I7XG59KCkpO1xudmFyIFN0YXJ0V2l0aCA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gU3RhcnRXaXRoKGlucywgdmFsKSB7XG4gICAgICAgIHRoaXMudHlwZSA9ICdzdGFydFdpdGgnO1xuICAgICAgICB0aGlzLmlucyA9IGlucztcbiAgICAgICAgdGhpcy5vdXQgPSBOTztcbiAgICAgICAgdGhpcy52YWwgPSB2YWw7XG4gICAgfVxuICAgIFN0YXJ0V2l0aC5wcm90b3R5cGUuX3N0YXJ0ID0gZnVuY3Rpb24gKG91dCkge1xuICAgICAgICB0aGlzLm91dCA9IG91dDtcbiAgICAgICAgdGhpcy5vdXQuX24odGhpcy52YWwpO1xuICAgICAgICB0aGlzLmlucy5fYWRkKG91dCk7XG4gICAgfTtcbiAgICBTdGFydFdpdGgucHJvdG90eXBlLl9zdG9wID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmlucy5fcmVtb3ZlKHRoaXMub3V0KTtcbiAgICAgICAgdGhpcy5vdXQgPSBOTztcbiAgICB9O1xuICAgIHJldHVybiBTdGFydFdpdGg7XG59KCkpO1xudmFyIFRha2UgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFRha2UobWF4LCBpbnMpIHtcbiAgICAgICAgdGhpcy50eXBlID0gJ3Rha2UnO1xuICAgICAgICB0aGlzLmlucyA9IGlucztcbiAgICAgICAgdGhpcy5vdXQgPSBOTztcbiAgICAgICAgdGhpcy5tYXggPSBtYXg7XG4gICAgICAgIHRoaXMudGFrZW4gPSAwO1xuICAgIH1cbiAgICBUYWtlLnByb3RvdHlwZS5fc3RhcnQgPSBmdW5jdGlvbiAob3V0KSB7XG4gICAgICAgIHRoaXMub3V0ID0gb3V0O1xuICAgICAgICB0aGlzLnRha2VuID0gMDtcbiAgICAgICAgaWYgKHRoaXMubWF4IDw9IDApXG4gICAgICAgICAgICBvdXQuX2MoKTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgdGhpcy5pbnMuX2FkZCh0aGlzKTtcbiAgICB9O1xuICAgIFRha2UucHJvdG90eXBlLl9zdG9wID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmlucy5fcmVtb3ZlKHRoaXMpO1xuICAgICAgICB0aGlzLm91dCA9IE5PO1xuICAgIH07XG4gICAgVGFrZS5wcm90b3R5cGUuX24gPSBmdW5jdGlvbiAodCkge1xuICAgICAgICB2YXIgdSA9IHRoaXMub3V0O1xuICAgICAgICBpZiAodSA9PT0gTk8pXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHZhciBtID0gKyt0aGlzLnRha2VuO1xuICAgICAgICBpZiAobSA8IHRoaXMubWF4KVxuICAgICAgICAgICAgdS5fbih0KTtcbiAgICAgICAgZWxzZSBpZiAobSA9PT0gdGhpcy5tYXgpIHtcbiAgICAgICAgICAgIHUuX24odCk7XG4gICAgICAgICAgICB1Ll9jKCk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIFRha2UucHJvdG90eXBlLl9lID0gZnVuY3Rpb24gKGVycikge1xuICAgICAgICB2YXIgdSA9IHRoaXMub3V0O1xuICAgICAgICBpZiAodSA9PT0gTk8pXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHUuX2UoZXJyKTtcbiAgICB9O1xuICAgIFRha2UucHJvdG90eXBlLl9jID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgdSA9IHRoaXMub3V0O1xuICAgICAgICBpZiAodSA9PT0gTk8pXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHUuX2MoKTtcbiAgICB9O1xuICAgIHJldHVybiBUYWtlO1xufSgpKTtcbnZhciBTdHJlYW0gPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFN0cmVhbShwcm9kdWNlcikge1xuICAgICAgICB0aGlzLl9wcm9kID0gcHJvZHVjZXIgfHwgTk87XG4gICAgICAgIHRoaXMuX2lscyA9IFtdO1xuICAgICAgICB0aGlzLl9zdG9wSUQgPSBOTztcbiAgICAgICAgdGhpcy5fZGwgPSBOTztcbiAgICAgICAgdGhpcy5fZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLl90YXJnZXQgPSBOTztcbiAgICAgICAgdGhpcy5fZXJyID0gTk87XG4gICAgfVxuICAgIFN0cmVhbS5wcm90b3R5cGUuX24gPSBmdW5jdGlvbiAodCkge1xuICAgICAgICB2YXIgYSA9IHRoaXMuX2lscztcbiAgICAgICAgdmFyIEwgPSBhLmxlbmd0aDtcbiAgICAgICAgaWYgKHRoaXMuX2QpXG4gICAgICAgICAgICB0aGlzLl9kbC5fbih0KTtcbiAgICAgICAgaWYgKEwgPT0gMSlcbiAgICAgICAgICAgIGFbMF0uX24odCk7XG4gICAgICAgIGVsc2UgaWYgKEwgPT0gMClcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB2YXIgYiA9IGNwKGEpO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBMOyBpKyspXG4gICAgICAgICAgICAgICAgYltpXS5fbih0KTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgU3RyZWFtLnByb3RvdHlwZS5fZSA9IGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgaWYgKHRoaXMuX2VyciAhPT0gTk8pXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHRoaXMuX2VyciA9IGVycjtcbiAgICAgICAgdmFyIGEgPSB0aGlzLl9pbHM7XG4gICAgICAgIHZhciBMID0gYS5sZW5ndGg7XG4gICAgICAgIHRoaXMuX3goKTtcbiAgICAgICAgaWYgKHRoaXMuX2QpXG4gICAgICAgICAgICB0aGlzLl9kbC5fZShlcnIpO1xuICAgICAgICBpZiAoTCA9PSAxKVxuICAgICAgICAgICAgYVswXS5fZShlcnIpO1xuICAgICAgICBlbHNlIGlmIChMID09IDApXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdmFyIGIgPSBjcChhKTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgTDsgaSsrKVxuICAgICAgICAgICAgICAgIGJbaV0uX2UoZXJyKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRoaXMuX2QgJiYgTCA9PSAwKVxuICAgICAgICAgICAgdGhyb3cgdGhpcy5fZXJyO1xuICAgIH07XG4gICAgU3RyZWFtLnByb3RvdHlwZS5fYyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGEgPSB0aGlzLl9pbHM7XG4gICAgICAgIHZhciBMID0gYS5sZW5ndGg7XG4gICAgICAgIHRoaXMuX3goKTtcbiAgICAgICAgaWYgKHRoaXMuX2QpXG4gICAgICAgICAgICB0aGlzLl9kbC5fYygpO1xuICAgICAgICBpZiAoTCA9PSAxKVxuICAgICAgICAgICAgYVswXS5fYygpO1xuICAgICAgICBlbHNlIGlmIChMID09IDApXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdmFyIGIgPSBjcChhKTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgTDsgaSsrKVxuICAgICAgICAgICAgICAgIGJbaV0uX2MoKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgU3RyZWFtLnByb3RvdHlwZS5feCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMuX2lscy5sZW5ndGggPT09IDApXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGlmICh0aGlzLl9wcm9kICE9PSBOTylcbiAgICAgICAgICAgIHRoaXMuX3Byb2QuX3N0b3AoKTtcbiAgICAgICAgdGhpcy5fZXJyID0gTk87XG4gICAgICAgIHRoaXMuX2lscyA9IFtdO1xuICAgIH07XG4gICAgU3RyZWFtLnByb3RvdHlwZS5fc3RvcE5vdyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLy8gV0FSTklORzogY29kZSB0aGF0IGNhbGxzIHRoaXMgbWV0aG9kIHNob3VsZFxuICAgICAgICAvLyBmaXJzdCBjaGVjayBpZiB0aGlzLl9wcm9kIGlzIHZhbGlkIChub3QgYE5PYClcbiAgICAgICAgdGhpcy5fcHJvZC5fc3RvcCgpO1xuICAgICAgICB0aGlzLl9lcnIgPSBOTztcbiAgICAgICAgdGhpcy5fc3RvcElEID0gTk87XG4gICAgfTtcbiAgICBTdHJlYW0ucHJvdG90eXBlLl9hZGQgPSBmdW5jdGlvbiAoaWwpIHtcbiAgICAgICAgdmFyIHRhID0gdGhpcy5fdGFyZ2V0O1xuICAgICAgICBpZiAodGEgIT09IE5PKVxuICAgICAgICAgICAgcmV0dXJuIHRhLl9hZGQoaWwpO1xuICAgICAgICB2YXIgYSA9IHRoaXMuX2lscztcbiAgICAgICAgYS5wdXNoKGlsKTtcbiAgICAgICAgaWYgKGEubGVuZ3RoID4gMSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgaWYgKHRoaXMuX3N0b3BJRCAhPT0gTk8pIHtcbiAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aGlzLl9zdG9wSUQpO1xuICAgICAgICAgICAgdGhpcy5fc3RvcElEID0gTk87XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB2YXIgcCA9IHRoaXMuX3Byb2Q7XG4gICAgICAgICAgICBpZiAocCAhPT0gTk8pXG4gICAgICAgICAgICAgICAgcC5fc3RhcnQodGhpcyk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIFN0cmVhbS5wcm90b3R5cGUuX3JlbW92ZSA9IGZ1bmN0aW9uIChpbCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB2YXIgdGEgPSB0aGlzLl90YXJnZXQ7XG4gICAgICAgIGlmICh0YSAhPT0gTk8pXG4gICAgICAgICAgICByZXR1cm4gdGEuX3JlbW92ZShpbCk7XG4gICAgICAgIHZhciBhID0gdGhpcy5faWxzO1xuICAgICAgICB2YXIgaSA9IGEuaW5kZXhPZihpbCk7XG4gICAgICAgIGlmIChpID4gLTEpIHtcbiAgICAgICAgICAgIGEuc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgaWYgKHRoaXMuX3Byb2QgIT09IE5PICYmIGEubGVuZ3RoIDw9IDApIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9lcnIgPSBOTztcbiAgICAgICAgICAgICAgICB0aGlzLl9zdG9wSUQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHsgcmV0dXJuIF90aGlzLl9zdG9wTm93KCk7IH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoYS5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9wcnVuZUN5Y2xlcygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbiAgICAvLyBJZiBhbGwgcGF0aHMgc3RlbW1pbmcgZnJvbSBgdGhpc2Agc3RyZWFtIGV2ZW50dWFsbHkgZW5kIGF0IGB0aGlzYFxuICAgIC8vIHN0cmVhbSwgdGhlbiB3ZSByZW1vdmUgdGhlIHNpbmdsZSBsaXN0ZW5lciBvZiBgdGhpc2Agc3RyZWFtLCB0b1xuICAgIC8vIGZvcmNlIGl0IHRvIGVuZCBpdHMgZXhlY3V0aW9uIGFuZCBkaXNwb3NlIHJlc291cmNlcy4gVGhpcyBtZXRob2RcbiAgICAvLyBhc3N1bWVzIGFzIGEgcHJlY29uZGl0aW9uIHRoYXQgdGhpcy5faWxzIGhhcyBqdXN0IG9uZSBsaXN0ZW5lci5cbiAgICBTdHJlYW0ucHJvdG90eXBlLl9wcnVuZUN5Y2xlcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMuX2hhc05vU2lua3ModGhpcywgW10pKVxuICAgICAgICAgICAgdGhpcy5fcmVtb3ZlKHRoaXMuX2lsc1swXSk7XG4gICAgfTtcbiAgICAvLyBDaGVja3Mgd2hldGhlciAqdGhlcmUgaXMgbm8qIHBhdGggc3RhcnRpbmcgZnJvbSBgeGAgdGhhdCBsZWFkcyB0byBhbiBlbmRcbiAgICAvLyBsaXN0ZW5lciAoc2luaykgaW4gdGhlIHN0cmVhbSBncmFwaCwgZm9sbG93aW5nIGVkZ2VzIEEtPkIgd2hlcmUgQiBpcyBhXG4gICAgLy8gbGlzdGVuZXIgb2YgQS4gVGhpcyBtZWFucyB0aGVzZSBwYXRocyBjb25zdGl0dXRlIGEgY3ljbGUgc29tZWhvdy4gSXMgZ2l2ZW5cbiAgICAvLyBhIHRyYWNlIG9mIGFsbCB2aXNpdGVkIG5vZGVzIHNvIGZhci5cbiAgICBTdHJlYW0ucHJvdG90eXBlLl9oYXNOb1NpbmtzID0gZnVuY3Rpb24gKHgsIHRyYWNlKSB7XG4gICAgICAgIGlmICh0cmFjZS5pbmRleE9mKHgpICE9PSAtMSlcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICBlbHNlIGlmICh4Lm91dCA9PT0gdGhpcylcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICBlbHNlIGlmICh4Lm91dCAmJiB4Lm91dCAhPT0gTk8pXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5faGFzTm9TaW5rcyh4Lm91dCwgdHJhY2UuY29uY2F0KHgpKTtcbiAgICAgICAgZWxzZSBpZiAoeC5faWxzKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgTiA9IHguX2lscy5sZW5ndGg7IGkgPCBOOyBpKyspXG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLl9oYXNOb1NpbmtzKHguX2lsc1tpXSwgdHJhY2UuY29uY2F0KHgpKSlcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH07XG4gICAgU3RyZWFtLnByb3RvdHlwZS5jdG9yID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcyBpbnN0YW5jZW9mIE1lbW9yeVN0cmVhbSA/IE1lbW9yeVN0cmVhbSA6IFN0cmVhbTtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIEFkZHMgYSBMaXN0ZW5lciB0byB0aGUgU3RyZWFtLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtMaXN0ZW5lcn0gbGlzdGVuZXJcbiAgICAgKi9cbiAgICBTdHJlYW0ucHJvdG90eXBlLmFkZExpc3RlbmVyID0gZnVuY3Rpb24gKGxpc3RlbmVyKSB7XG4gICAgICAgIGxpc3RlbmVyLl9uID0gbGlzdGVuZXIubmV4dCB8fCBub29wO1xuICAgICAgICBsaXN0ZW5lci5fZSA9IGxpc3RlbmVyLmVycm9yIHx8IG5vb3A7XG4gICAgICAgIGxpc3RlbmVyLl9jID0gbGlzdGVuZXIuY29tcGxldGUgfHwgbm9vcDtcbiAgICAgICAgdGhpcy5fYWRkKGxpc3RlbmVyKTtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIFJlbW92ZXMgYSBMaXN0ZW5lciBmcm9tIHRoZSBTdHJlYW0sIGFzc3VtaW5nIHRoZSBMaXN0ZW5lciB3YXMgYWRkZWQgdG8gaXQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0xpc3RlbmVyPFQ+fSBsaXN0ZW5lclxuICAgICAqL1xuICAgIFN0cmVhbS5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXIgPSBmdW5jdGlvbiAobGlzdGVuZXIpIHtcbiAgICAgICAgdGhpcy5fcmVtb3ZlKGxpc3RlbmVyKTtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIEFkZHMgYSBMaXN0ZW5lciB0byB0aGUgU3RyZWFtIHJldHVybmluZyBhIFN1YnNjcmlwdGlvbiB0byByZW1vdmUgdGhhdFxuICAgICAqIGxpc3RlbmVyLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtMaXN0ZW5lcn0gbGlzdGVuZXJcbiAgICAgKiBAcmV0dXJucyB7U3Vic2NyaXB0aW9ufVxuICAgICAqL1xuICAgIFN0cmVhbS5wcm90b3R5cGUuc3Vic2NyaWJlID0gZnVuY3Rpb24gKGxpc3RlbmVyKSB7XG4gICAgICAgIHRoaXMuYWRkTGlzdGVuZXIobGlzdGVuZXIpO1xuICAgICAgICByZXR1cm4gbmV3IFN0cmVhbVN1Yih0aGlzLCBsaXN0ZW5lcik7XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBBZGQgaW50ZXJvcCBiZXR3ZWVuIG1vc3QuanMgYW5kIFJ4SlMgNVxuICAgICAqXG4gICAgICogQHJldHVybnMge1N0cmVhbX1cbiAgICAgKi9cbiAgICBTdHJlYW0ucHJvdG90eXBlW3N5bWJvbF9vYnNlcnZhYmxlXzEuZGVmYXVsdF0gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIG5ldyBTdHJlYW0gZ2l2ZW4gYSBQcm9kdWNlci5cbiAgICAgKlxuICAgICAqIEBmYWN0b3J5IHRydWVcbiAgICAgKiBAcGFyYW0ge1Byb2R1Y2VyfSBwcm9kdWNlciBBbiBvcHRpb25hbCBQcm9kdWNlciB0aGF0IGRpY3RhdGVzIGhvdyB0b1xuICAgICAqIHN0YXJ0LCBnZW5lcmF0ZSBldmVudHMsIGFuZCBzdG9wIHRoZSBTdHJlYW0uXG4gICAgICogQHJldHVybiB7U3RyZWFtfVxuICAgICAqL1xuICAgIFN0cmVhbS5jcmVhdGUgPSBmdW5jdGlvbiAocHJvZHVjZXIpIHtcbiAgICAgICAgaWYgKHByb2R1Y2VyKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHByb2R1Y2VyLnN0YXJ0ICE9PSAnZnVuY3Rpb24nXG4gICAgICAgICAgICAgICAgfHwgdHlwZW9mIHByb2R1Y2VyLnN0b3AgIT09ICdmdW5jdGlvbicpXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdwcm9kdWNlciByZXF1aXJlcyBib3RoIHN0YXJ0IGFuZCBzdG9wIGZ1bmN0aW9ucycpO1xuICAgICAgICAgICAgaW50ZXJuYWxpemVQcm9kdWNlcihwcm9kdWNlcik7IC8vIG11dGF0ZXMgdGhlIGlucHV0XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5ldyBTdHJlYW0ocHJvZHVjZXIpO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIG5ldyBNZW1vcnlTdHJlYW0gZ2l2ZW4gYSBQcm9kdWNlci5cbiAgICAgKlxuICAgICAqIEBmYWN0b3J5IHRydWVcbiAgICAgKiBAcGFyYW0ge1Byb2R1Y2VyfSBwcm9kdWNlciBBbiBvcHRpb25hbCBQcm9kdWNlciB0aGF0IGRpY3RhdGVzIGhvdyB0b1xuICAgICAqIHN0YXJ0LCBnZW5lcmF0ZSBldmVudHMsIGFuZCBzdG9wIHRoZSBTdHJlYW0uXG4gICAgICogQHJldHVybiB7TWVtb3J5U3RyZWFtfVxuICAgICAqL1xuICAgIFN0cmVhbS5jcmVhdGVXaXRoTWVtb3J5ID0gZnVuY3Rpb24gKHByb2R1Y2VyKSB7XG4gICAgICAgIGlmIChwcm9kdWNlcilcbiAgICAgICAgICAgIGludGVybmFsaXplUHJvZHVjZXIocHJvZHVjZXIpOyAvLyBtdXRhdGVzIHRoZSBpbnB1dFxuICAgICAgICByZXR1cm4gbmV3IE1lbW9yeVN0cmVhbShwcm9kdWNlcik7XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgU3RyZWFtIHRoYXQgZG9lcyBub3RoaW5nIHdoZW4gc3RhcnRlZC4gSXQgbmV2ZXIgZW1pdHMgYW55IGV2ZW50LlxuICAgICAqXG4gICAgICogTWFyYmxlIGRpYWdyYW06XG4gICAgICpcbiAgICAgKiBgYGB0ZXh0XG4gICAgICogICAgICAgICAgbmV2ZXJcbiAgICAgKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAqIGBgYFxuICAgICAqXG4gICAgICogQGZhY3RvcnkgdHJ1ZVxuICAgICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICAgKi9cbiAgICBTdHJlYW0ubmV2ZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBuZXcgU3RyZWFtKHsgX3N0YXJ0OiBub29wLCBfc3RvcDogbm9vcCB9KTtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBTdHJlYW0gdGhhdCBpbW1lZGlhdGVseSBlbWl0cyB0aGUgXCJjb21wbGV0ZVwiIG5vdGlmaWNhdGlvbiB3aGVuXG4gICAgICogc3RhcnRlZCwgYW5kIHRoYXQncyBpdC5cbiAgICAgKlxuICAgICAqIE1hcmJsZSBkaWFncmFtOlxuICAgICAqXG4gICAgICogYGBgdGV4dFxuICAgICAqIGVtcHR5XG4gICAgICogLXxcbiAgICAgKiBgYGBcbiAgICAgKlxuICAgICAqIEBmYWN0b3J5IHRydWVcbiAgICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAgICovXG4gICAgU3RyZWFtLmVtcHR5ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gbmV3IFN0cmVhbSh7XG4gICAgICAgICAgICBfc3RhcnQ6IGZ1bmN0aW9uIChpbCkgeyBpbC5fYygpOyB9LFxuICAgICAgICAgICAgX3N0b3A6IG5vb3AsXG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIFN0cmVhbSB0aGF0IGltbWVkaWF0ZWx5IGVtaXRzIGFuIFwiZXJyb3JcIiBub3RpZmljYXRpb24gd2l0aCB0aGVcbiAgICAgKiB2YWx1ZSB5b3UgcGFzc2VkIGFzIHRoZSBgZXJyb3JgIGFyZ3VtZW50IHdoZW4gdGhlIHN0cmVhbSBzdGFydHMsIGFuZCB0aGF0J3NcbiAgICAgKiBpdC5cbiAgICAgKlxuICAgICAqIE1hcmJsZSBkaWFncmFtOlxuICAgICAqXG4gICAgICogYGBgdGV4dFxuICAgICAqIHRocm93KFgpXG4gICAgICogLVhcbiAgICAgKiBgYGBcbiAgICAgKlxuICAgICAqIEBmYWN0b3J5IHRydWVcbiAgICAgKiBAcGFyYW0gZXJyb3IgVGhlIGVycm9yIGV2ZW50IHRvIGVtaXQgb24gdGhlIGNyZWF0ZWQgc3RyZWFtLlxuICAgICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICAgKi9cbiAgICBTdHJlYW0udGhyb3cgPSBmdW5jdGlvbiAoZXJyb3IpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBTdHJlYW0oe1xuICAgICAgICAgICAgX3N0YXJ0OiBmdW5jdGlvbiAoaWwpIHsgaWwuX2UoZXJyb3IpOyB9LFxuICAgICAgICAgICAgX3N0b3A6IG5vb3AsXG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIHN0cmVhbSBmcm9tIGFuIEFycmF5LCBQcm9taXNlLCBvciBhbiBPYnNlcnZhYmxlLlxuICAgICAqXG4gICAgICogQGZhY3RvcnkgdHJ1ZVxuICAgICAqIEBwYXJhbSB7QXJyYXl8UHJvbWlzZUxpa2V8T2JzZXJ2YWJsZX0gaW5wdXQgVGhlIGlucHV0IHRvIG1ha2UgYSBzdHJlYW0gZnJvbS5cbiAgICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAgICovXG4gICAgU3RyZWFtLmZyb20gPSBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBpbnB1dFtzeW1ib2xfb2JzZXJ2YWJsZV8xLmRlZmF1bHRdID09PSAnZnVuY3Rpb24nKVxuICAgICAgICAgICAgcmV0dXJuIFN0cmVhbS5mcm9tT2JzZXJ2YWJsZShpbnB1dCk7XG4gICAgICAgIGVsc2UgaWYgKHR5cGVvZiBpbnB1dC50aGVuID09PSAnZnVuY3Rpb24nKVxuICAgICAgICAgICAgcmV0dXJuIFN0cmVhbS5mcm9tUHJvbWlzZShpbnB1dCk7XG4gICAgICAgIGVsc2UgaWYgKEFycmF5LmlzQXJyYXkoaW5wdXQpKVxuICAgICAgICAgICAgcmV0dXJuIFN0cmVhbS5mcm9tQXJyYXkoaW5wdXQpO1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiVHlwZSBvZiBpbnB1dCB0byBmcm9tKCkgbXVzdCBiZSBhbiBBcnJheSwgUHJvbWlzZSwgb3IgT2JzZXJ2YWJsZVwiKTtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBTdHJlYW0gdGhhdCBpbW1lZGlhdGVseSBlbWl0cyB0aGUgYXJndW1lbnRzIHRoYXQgeW91IGdpdmUgdG9cbiAgICAgKiAqb2YqLCB0aGVuIGNvbXBsZXRlcy5cbiAgICAgKlxuICAgICAqIE1hcmJsZSBkaWFncmFtOlxuICAgICAqXG4gICAgICogYGBgdGV4dFxuICAgICAqIG9mKDEsMiwzKVxuICAgICAqIDEyM3xcbiAgICAgKiBgYGBcbiAgICAgKlxuICAgICAqIEBmYWN0b3J5IHRydWVcbiAgICAgKiBAcGFyYW0gYSBUaGUgZmlyc3QgdmFsdWUgeW91IHdhbnQgdG8gZW1pdCBhcyBhbiBldmVudCBvbiB0aGUgc3RyZWFtLlxuICAgICAqIEBwYXJhbSBiIFRoZSBzZWNvbmQgdmFsdWUgeW91IHdhbnQgdG8gZW1pdCBhcyBhbiBldmVudCBvbiB0aGUgc3RyZWFtLiBPbmVcbiAgICAgKiBvciBtb3JlIG9mIHRoZXNlIHZhbHVlcyBtYXkgYmUgZ2l2ZW4gYXMgYXJndW1lbnRzLlxuICAgICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICAgKi9cbiAgICBTdHJlYW0ub2YgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBpdGVtcyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBfaSA9IDA7IF9pIDwgYXJndW1lbnRzLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgaXRlbXNbX2ldID0gYXJndW1lbnRzW19pXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gU3RyZWFtLmZyb21BcnJheShpdGVtcyk7XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBDb252ZXJ0cyBhbiBhcnJheSB0byBhIHN0cmVhbS4gVGhlIHJldHVybmVkIHN0cmVhbSB3aWxsIGVtaXQgc3luY2hyb25vdXNseVxuICAgICAqIGFsbCB0aGUgaXRlbXMgaW4gdGhlIGFycmF5LCBhbmQgdGhlbiBjb21wbGV0ZS5cbiAgICAgKlxuICAgICAqIE1hcmJsZSBkaWFncmFtOlxuICAgICAqXG4gICAgICogYGBgdGV4dFxuICAgICAqIGZyb21BcnJheShbMSwyLDNdKVxuICAgICAqIDEyM3xcbiAgICAgKiBgYGBcbiAgICAgKlxuICAgICAqIEBmYWN0b3J5IHRydWVcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBhcnJheSBUaGUgYXJyYXkgdG8gYmUgY29udmVydGVkIGFzIGEgc3RyZWFtLlxuICAgICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICAgKi9cbiAgICBTdHJlYW0uZnJvbUFycmF5ID0gZnVuY3Rpb24gKGFycmF5KSB7XG4gICAgICAgIHJldHVybiBuZXcgU3RyZWFtKG5ldyBGcm9tQXJyYXkoYXJyYXkpKTtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIENvbnZlcnRzIGEgcHJvbWlzZSB0byBhIHN0cmVhbS4gVGhlIHJldHVybmVkIHN0cmVhbSB3aWxsIGVtaXQgdGhlIHJlc29sdmVkXG4gICAgICogdmFsdWUgb2YgdGhlIHByb21pc2UsIGFuZCB0aGVuIGNvbXBsZXRlLiBIb3dldmVyLCBpZiB0aGUgcHJvbWlzZSBpc1xuICAgICAqIHJlamVjdGVkLCB0aGUgc3RyZWFtIHdpbGwgZW1pdCB0aGUgY29ycmVzcG9uZGluZyBlcnJvci5cbiAgICAgKlxuICAgICAqIE1hcmJsZSBkaWFncmFtOlxuICAgICAqXG4gICAgICogYGBgdGV4dFxuICAgICAqIGZyb21Qcm9taXNlKCAtLS0tNDIgKVxuICAgICAqIC0tLS0tLS0tLS0tLS0tLS0tNDJ8XG4gICAgICogYGBgXG4gICAgICpcbiAgICAgKiBAZmFjdG9yeSB0cnVlXG4gICAgICogQHBhcmFtIHtQcm9taXNlTGlrZX0gcHJvbWlzZSBUaGUgcHJvbWlzZSB0byBiZSBjb252ZXJ0ZWQgYXMgYSBzdHJlYW0uXG4gICAgICogQHJldHVybiB7U3RyZWFtfVxuICAgICAqL1xuICAgIFN0cmVhbS5mcm9tUHJvbWlzZSA9IGZ1bmN0aW9uIChwcm9taXNlKSB7XG4gICAgICAgIHJldHVybiBuZXcgU3RyZWFtKG5ldyBGcm9tUHJvbWlzZShwcm9taXNlKSk7XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBDb252ZXJ0cyBhbiBPYnNlcnZhYmxlIGludG8gYSBTdHJlYW0uXG4gICAgICpcbiAgICAgKiBAZmFjdG9yeSB0cnVlXG4gICAgICogQHBhcmFtIHthbnl9IG9ic2VydmFibGUgVGhlIG9ic2VydmFibGUgdG8gYmUgY29udmVydGVkIGFzIGEgc3RyZWFtLlxuICAgICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICAgKi9cbiAgICBTdHJlYW0uZnJvbU9ic2VydmFibGUgPSBmdW5jdGlvbiAob2JzKSB7XG4gICAgICAgIGlmIChvYnMuZW5kV2hlbilcbiAgICAgICAgICAgIHJldHVybiBvYnM7XG4gICAgICAgIHJldHVybiBuZXcgU3RyZWFtKG5ldyBGcm9tT2JzZXJ2YWJsZShvYnMpKTtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBzdHJlYW0gdGhhdCBwZXJpb2RpY2FsbHkgZW1pdHMgaW5jcmVtZW50YWwgbnVtYmVycywgZXZlcnlcbiAgICAgKiBgcGVyaW9kYCBtaWxsaXNlY29uZHMuXG4gICAgICpcbiAgICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICAgKlxuICAgICAqIGBgYHRleHRcbiAgICAgKiAgICAgcGVyaW9kaWMoMTAwMClcbiAgICAgKiAtLS0wLS0tMS0tLTItLS0zLS0tNC0tLS4uLlxuICAgICAqIGBgYFxuICAgICAqXG4gICAgICogQGZhY3RvcnkgdHJ1ZVxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBwZXJpb2QgVGhlIGludGVydmFsIGluIG1pbGxpc2Vjb25kcyB0byB1c2UgYXMgYSByYXRlIG9mXG4gICAgICogZW1pc3Npb24uXG4gICAgICogQHJldHVybiB7U3RyZWFtfVxuICAgICAqL1xuICAgIFN0cmVhbS5wZXJpb2RpYyA9IGZ1bmN0aW9uIChwZXJpb2QpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBTdHJlYW0obmV3IFBlcmlvZGljKHBlcmlvZCkpO1xuICAgIH07XG4gICAgU3RyZWFtLnByb3RvdHlwZS5fbWFwID0gZnVuY3Rpb24gKHByb2plY3QpIHtcbiAgICAgICAgcmV0dXJuIG5ldyAodGhpcy5jdG9yKCkpKG5ldyBNYXBPcChwcm9qZWN0LCB0aGlzKSk7XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBUcmFuc2Zvcm1zIGVhY2ggZXZlbnQgZnJvbSB0aGUgaW5wdXQgU3RyZWFtIHRocm91Z2ggYSBgcHJvamVjdGAgZnVuY3Rpb24sXG4gICAgICogdG8gZ2V0IGEgU3RyZWFtIHRoYXQgZW1pdHMgdGhvc2UgdHJhbnNmb3JtZWQgZXZlbnRzLlxuICAgICAqXG4gICAgICogTWFyYmxlIGRpYWdyYW06XG4gICAgICpcbiAgICAgKiBgYGB0ZXh0XG4gICAgICogLS0xLS0tMy0tNS0tLS0tNy0tLS0tLVxuICAgICAqICAgIG1hcChpID0+IGkgKiAxMClcbiAgICAgKiAtLTEwLS0zMC01MC0tLS03MC0tLS0tXG4gICAgICogYGBgXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBwcm9qZWN0IEEgZnVuY3Rpb24gb2YgdHlwZSBgKHQ6IFQpID0+IFVgIHRoYXQgdGFrZXMgZXZlbnRcbiAgICAgKiBgdGAgb2YgdHlwZSBgVGAgZnJvbSB0aGUgaW5wdXQgU3RyZWFtIGFuZCBwcm9kdWNlcyBhbiBldmVudCBvZiB0eXBlIGBVYCwgdG9cbiAgICAgKiBiZSBlbWl0dGVkIG9uIHRoZSBvdXRwdXQgU3RyZWFtLlxuICAgICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICAgKi9cbiAgICBTdHJlYW0ucHJvdG90eXBlLm1hcCA9IGZ1bmN0aW9uIChwcm9qZWN0KSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9tYXAocHJvamVjdCk7XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBJdCdzIGxpa2UgYG1hcGAsIGJ1dCB0cmFuc2Zvcm1zIGVhY2ggaW5wdXQgZXZlbnQgdG8gYWx3YXlzIHRoZSBzYW1lXG4gICAgICogY29uc3RhbnQgdmFsdWUgb24gdGhlIG91dHB1dCBTdHJlYW0uXG4gICAgICpcbiAgICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICAgKlxuICAgICAqIGBgYHRleHRcbiAgICAgKiAtLTEtLS0zLS01LS0tLS03LS0tLS1cbiAgICAgKiAgICAgICBtYXBUbygxMClcbiAgICAgKiAtLTEwLS0xMC0xMC0tLS0xMC0tLS1cbiAgICAgKiBgYGBcbiAgICAgKlxuICAgICAqIEBwYXJhbSBwcm9qZWN0ZWRWYWx1ZSBBIHZhbHVlIHRvIGVtaXQgb24gdGhlIG91dHB1dCBTdHJlYW0gd2hlbmV2ZXIgdGhlXG4gICAgICogaW5wdXQgU3RyZWFtIGVtaXRzIGFueSB2YWx1ZS5cbiAgICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAgICovXG4gICAgU3RyZWFtLnByb3RvdHlwZS5tYXBUbyA9IGZ1bmN0aW9uIChwcm9qZWN0ZWRWYWx1ZSkge1xuICAgICAgICB2YXIgcyA9IHRoaXMubWFwKGZ1bmN0aW9uICgpIHsgcmV0dXJuIHByb2plY3RlZFZhbHVlOyB9KTtcbiAgICAgICAgdmFyIG9wID0gcy5fcHJvZDtcbiAgICAgICAgb3AudHlwZSA9ICdtYXBUbyc7XG4gICAgICAgIHJldHVybiBzO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogT25seSBhbGxvd3MgZXZlbnRzIHRoYXQgcGFzcyB0aGUgdGVzdCBnaXZlbiBieSB0aGUgYHBhc3Nlc2AgYXJndW1lbnQuXG4gICAgICpcbiAgICAgKiBFYWNoIGV2ZW50IGZyb20gdGhlIGlucHV0IHN0cmVhbSBpcyBnaXZlbiB0byB0aGUgYHBhc3Nlc2AgZnVuY3Rpb24uIElmIHRoZVxuICAgICAqIGZ1bmN0aW9uIHJldHVybnMgYHRydWVgLCB0aGUgZXZlbnQgaXMgZm9yd2FyZGVkIHRvIHRoZSBvdXRwdXQgc3RyZWFtLFxuICAgICAqIG90aGVyd2lzZSBpdCBpcyBpZ25vcmVkIGFuZCBub3QgZm9yd2FyZGVkLlxuICAgICAqXG4gICAgICogTWFyYmxlIGRpYWdyYW06XG4gICAgICpcbiAgICAgKiBgYGB0ZXh0XG4gICAgICogLS0xLS0tMi0tMy0tLS0tNC0tLS0tNS0tLTYtLTctOC0tXG4gICAgICogICAgIGZpbHRlcihpID0+IGkgJSAyID09PSAwKVxuICAgICAqIC0tLS0tLTItLS0tLS0tLTQtLS0tLS0tLS02LS0tLTgtLVxuICAgICAqIGBgYFxuICAgICAqXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gcGFzc2VzIEEgZnVuY3Rpb24gb2YgdHlwZSBgKHQ6IFQpICs+IGJvb2xlYW5gIHRoYXQgdGFrZXNcbiAgICAgKiBhbiBldmVudCBmcm9tIHRoZSBpbnB1dCBzdHJlYW0gYW5kIGNoZWNrcyBpZiBpdCBwYXNzZXMsIGJ5IHJldHVybmluZyBhXG4gICAgICogYm9vbGVhbi5cbiAgICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAgICovXG4gICAgU3RyZWFtLnByb3RvdHlwZS5maWx0ZXIgPSBmdW5jdGlvbiAocGFzc2VzKSB7XG4gICAgICAgIHZhciBwID0gdGhpcy5fcHJvZDtcbiAgICAgICAgaWYgKHAgaW5zdGFuY2VvZiBGaWx0ZXIpXG4gICAgICAgICAgICByZXR1cm4gbmV3IFN0cmVhbShuZXcgRmlsdGVyKGFuZChwLmYsIHBhc3NlcyksIHAuaW5zKSk7XG4gICAgICAgIHJldHVybiBuZXcgU3RyZWFtKG5ldyBGaWx0ZXIocGFzc2VzLCB0aGlzKSk7XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBMZXRzIHRoZSBmaXJzdCBgYW1vdW50YCBtYW55IGV2ZW50cyBmcm9tIHRoZSBpbnB1dCBzdHJlYW0gcGFzcyB0byB0aGVcbiAgICAgKiBvdXRwdXQgc3RyZWFtLCB0aGVuIG1ha2VzIHRoZSBvdXRwdXQgc3RyZWFtIGNvbXBsZXRlLlxuICAgICAqXG4gICAgICogTWFyYmxlIGRpYWdyYW06XG4gICAgICpcbiAgICAgKiBgYGB0ZXh0XG4gICAgICogLS1hLS0tYi0tYy0tLS1kLS0tZS0tXG4gICAgICogICAgdGFrZSgzKVxuICAgICAqIC0tYS0tLWItLWN8XG4gICAgICogYGBgXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gYW1vdW50IEhvdyBtYW55IGV2ZW50cyB0byBhbGxvdyBmcm9tIHRoZSBpbnB1dCBzdHJlYW1cbiAgICAgKiBiZWZvcmUgY29tcGxldGluZyB0aGUgb3V0cHV0IHN0cmVhbS5cbiAgICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAgICovXG4gICAgU3RyZWFtLnByb3RvdHlwZS50YWtlID0gZnVuY3Rpb24gKGFtb3VudCkge1xuICAgICAgICByZXR1cm4gbmV3ICh0aGlzLmN0b3IoKSkobmV3IFRha2UoYW1vdW50LCB0aGlzKSk7XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBJZ25vcmVzIHRoZSBmaXJzdCBgYW1vdW50YCBtYW55IGV2ZW50cyBmcm9tIHRoZSBpbnB1dCBzdHJlYW0sIGFuZCB0aGVuXG4gICAgICogYWZ0ZXIgdGhhdCBzdGFydHMgZm9yd2FyZGluZyBldmVudHMgZnJvbSB0aGUgaW5wdXQgc3RyZWFtIHRvIHRoZSBvdXRwdXRcbiAgICAgKiBzdHJlYW0uXG4gICAgICpcbiAgICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICAgKlxuICAgICAqIGBgYHRleHRcbiAgICAgKiAtLWEtLS1iLS1jLS0tLWQtLS1lLS1cbiAgICAgKiAgICAgICBkcm9wKDMpXG4gICAgICogLS0tLS0tLS0tLS0tLS1kLS0tZS0tXG4gICAgICogYGBgXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gYW1vdW50IEhvdyBtYW55IGV2ZW50cyB0byBpZ25vcmUgZnJvbSB0aGUgaW5wdXQgc3RyZWFtXG4gICAgICogYmVmb3JlIGZvcndhcmRpbmcgYWxsIGV2ZW50cyBmcm9tIHRoZSBpbnB1dCBzdHJlYW0gdG8gdGhlIG91dHB1dCBzdHJlYW0uXG4gICAgICogQHJldHVybiB7U3RyZWFtfVxuICAgICAqL1xuICAgIFN0cmVhbS5wcm90b3R5cGUuZHJvcCA9IGZ1bmN0aW9uIChhbW91bnQpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBTdHJlYW0obmV3IERyb3AoYW1vdW50LCB0aGlzKSk7XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBXaGVuIHRoZSBpbnB1dCBzdHJlYW0gY29tcGxldGVzLCB0aGUgb3V0cHV0IHN0cmVhbSB3aWxsIGVtaXQgdGhlIGxhc3QgZXZlbnRcbiAgICAgKiBlbWl0dGVkIGJ5IHRoZSBpbnB1dCBzdHJlYW0sIGFuZCB0aGVuIHdpbGwgYWxzbyBjb21wbGV0ZS5cbiAgICAgKlxuICAgICAqIE1hcmJsZSBkaWFncmFtOlxuICAgICAqXG4gICAgICogYGBgdGV4dFxuICAgICAqIC0tYS0tLWItLWMtLWQtLS0tfFxuICAgICAqICAgICAgIGxhc3QoKVxuICAgICAqIC0tLS0tLS0tLS0tLS0tLS0tZHxcbiAgICAgKiBgYGBcbiAgICAgKlxuICAgICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICAgKi9cbiAgICBTdHJlYW0ucHJvdG90eXBlLmxhc3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBuZXcgU3RyZWFtKG5ldyBMYXN0KHRoaXMpKTtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIFByZXBlbmRzIHRoZSBnaXZlbiBgaW5pdGlhbGAgdmFsdWUgdG8gdGhlIHNlcXVlbmNlIG9mIGV2ZW50cyBlbWl0dGVkIGJ5IHRoZVxuICAgICAqIGlucHV0IHN0cmVhbS4gVGhlIHJldHVybmVkIHN0cmVhbSBpcyBhIE1lbW9yeVN0cmVhbSwgd2hpY2ggbWVhbnMgaXQgaXNcbiAgICAgKiBhbHJlYWR5IGByZW1lbWJlcigpYCdkLlxuICAgICAqXG4gICAgICogTWFyYmxlIGRpYWdyYW06XG4gICAgICpcbiAgICAgKiBgYGB0ZXh0XG4gICAgICogLS0tMS0tLTItLS0tLTMtLS1cbiAgICAgKiAgIHN0YXJ0V2l0aCgwKVxuICAgICAqIDAtLTEtLS0yLS0tLS0zLS0tXG4gICAgICogYGBgXG4gICAgICpcbiAgICAgKiBAcGFyYW0gaW5pdGlhbCBUaGUgdmFsdWUgb3IgZXZlbnQgdG8gcHJlcGVuZC5cbiAgICAgKiBAcmV0dXJuIHtNZW1vcnlTdHJlYW19XG4gICAgICovXG4gICAgU3RyZWFtLnByb3RvdHlwZS5zdGFydFdpdGggPSBmdW5jdGlvbiAoaW5pdGlhbCkge1xuICAgICAgICByZXR1cm4gbmV3IE1lbW9yeVN0cmVhbShuZXcgU3RhcnRXaXRoKHRoaXMsIGluaXRpYWwpKTtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIFVzZXMgYW5vdGhlciBzdHJlYW0gdG8gZGV0ZXJtaW5lIHdoZW4gdG8gY29tcGxldGUgdGhlIGN1cnJlbnQgc3RyZWFtLlxuICAgICAqXG4gICAgICogV2hlbiB0aGUgZ2l2ZW4gYG90aGVyYCBzdHJlYW0gZW1pdHMgYW4gZXZlbnQgb3IgY29tcGxldGVzLCB0aGUgb3V0cHV0XG4gICAgICogc3RyZWFtIHdpbGwgY29tcGxldGUuIEJlZm9yZSB0aGF0IGhhcHBlbnMsIHRoZSBvdXRwdXQgc3RyZWFtIHdpbGwgYmVoYXZlc1xuICAgICAqIGxpa2UgdGhlIGlucHV0IHN0cmVhbS5cbiAgICAgKlxuICAgICAqIE1hcmJsZSBkaWFncmFtOlxuICAgICAqXG4gICAgICogYGBgdGV4dFxuICAgICAqIC0tLTEtLS0yLS0tLS0zLS00LS0tLTUtLS0tNi0tLVxuICAgICAqICAgZW5kV2hlbiggLS0tLS0tLS1hLS1iLS18IClcbiAgICAgKiAtLS0xLS0tMi0tLS0tMy0tNC0tfFxuICAgICAqIGBgYFxuICAgICAqXG4gICAgICogQHBhcmFtIG90aGVyIFNvbWUgb3RoZXIgc3RyZWFtIHRoYXQgaXMgdXNlZCB0byBrbm93IHdoZW4gc2hvdWxkIHRoZSBvdXRwdXRcbiAgICAgKiBzdHJlYW0gb2YgdGhpcyBvcGVyYXRvciBjb21wbGV0ZS5cbiAgICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAgICovXG4gICAgU3RyZWFtLnByb3RvdHlwZS5lbmRXaGVuID0gZnVuY3Rpb24gKG90aGVyKSB7XG4gICAgICAgIHJldHVybiBuZXcgKHRoaXMuY3RvcigpKShuZXcgRW5kV2hlbihvdGhlciwgdGhpcykpO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogXCJGb2xkc1wiIHRoZSBzdHJlYW0gb250byBpdHNlbGYuXG4gICAgICpcbiAgICAgKiBDb21iaW5lcyBldmVudHMgZnJvbSB0aGUgcGFzdCB0aHJvdWdob3V0XG4gICAgICogdGhlIGVudGlyZSBleGVjdXRpb24gb2YgdGhlIGlucHV0IHN0cmVhbSwgYWxsb3dpbmcgeW91IHRvIGFjY3VtdWxhdGUgdGhlbVxuICAgICAqIHRvZ2V0aGVyLiBJdCdzIGVzc2VudGlhbGx5IGxpa2UgYEFycmF5LnByb3RvdHlwZS5yZWR1Y2VgLiBUaGUgcmV0dXJuZWRcbiAgICAgKiBzdHJlYW0gaXMgYSBNZW1vcnlTdHJlYW0sIHdoaWNoIG1lYW5zIGl0IGlzIGFscmVhZHkgYHJlbWVtYmVyKClgJ2QuXG4gICAgICpcbiAgICAgKiBUaGUgb3V0cHV0IHN0cmVhbSBzdGFydHMgYnkgZW1pdHRpbmcgdGhlIGBzZWVkYCB3aGljaCB5b3UgZ2l2ZSBhcyBhcmd1bWVudC5cbiAgICAgKiBUaGVuLCB3aGVuIGFuIGV2ZW50IGhhcHBlbnMgb24gdGhlIGlucHV0IHN0cmVhbSwgaXQgaXMgY29tYmluZWQgd2l0aCB0aGF0XG4gICAgICogc2VlZCB2YWx1ZSB0aHJvdWdoIHRoZSBgYWNjdW11bGF0ZWAgZnVuY3Rpb24sIGFuZCB0aGUgb3V0cHV0IHZhbHVlIGlzXG4gICAgICogZW1pdHRlZCBvbiB0aGUgb3V0cHV0IHN0cmVhbS4gYGZvbGRgIHJlbWVtYmVycyB0aGF0IG91dHB1dCB2YWx1ZSBhcyBgYWNjYFxuICAgICAqIChcImFjY3VtdWxhdG9yXCIpLCBhbmQgdGhlbiB3aGVuIGEgbmV3IGlucHV0IGV2ZW50IGB0YCBoYXBwZW5zLCBgYWNjYCB3aWxsIGJlXG4gICAgICogY29tYmluZWQgd2l0aCB0aGF0IHRvIHByb2R1Y2UgdGhlIG5ldyBgYWNjYCBhbmQgc28gZm9ydGguXG4gICAgICpcbiAgICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICAgKlxuICAgICAqIGBgYHRleHRcbiAgICAgKiAtLS0tLS0xLS0tLS0xLS0yLS0tLTEtLS0tMS0tLS0tLVxuICAgICAqICAgZm9sZCgoYWNjLCB4KSA9PiBhY2MgKyB4LCAzKVxuICAgICAqIDMtLS0tLTQtLS0tLTUtLTctLS0tOC0tLS05LS0tLS0tXG4gICAgICogYGBgXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBhY2N1bXVsYXRlIEEgZnVuY3Rpb24gb2YgdHlwZSBgKGFjYzogUiwgdDogVCkgPT4gUmAgdGhhdFxuICAgICAqIHRha2VzIHRoZSBwcmV2aW91cyBhY2N1bXVsYXRlZCB2YWx1ZSBgYWNjYCBhbmQgdGhlIGluY29taW5nIGV2ZW50IGZyb20gdGhlXG4gICAgICogaW5wdXQgc3RyZWFtIGFuZCBwcm9kdWNlcyB0aGUgbmV3IGFjY3VtdWxhdGVkIHZhbHVlLlxuICAgICAqIEBwYXJhbSBzZWVkIFRoZSBpbml0aWFsIGFjY3VtdWxhdGVkIHZhbHVlLCBvZiB0eXBlIGBSYC5cbiAgICAgKiBAcmV0dXJuIHtNZW1vcnlTdHJlYW19XG4gICAgICovXG4gICAgU3RyZWFtLnByb3RvdHlwZS5mb2xkID0gZnVuY3Rpb24gKGFjY3VtdWxhdGUsIHNlZWQpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBNZW1vcnlTdHJlYW0obmV3IEZvbGQoYWNjdW11bGF0ZSwgc2VlZCwgdGhpcykpO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogUmVwbGFjZXMgYW4gZXJyb3Igd2l0aCBhbm90aGVyIHN0cmVhbS5cbiAgICAgKlxuICAgICAqIFdoZW4gKGFuZCBpZikgYW4gZXJyb3IgaGFwcGVucyBvbiB0aGUgaW5wdXQgc3RyZWFtLCBpbnN0ZWFkIG9mIGZvcndhcmRpbmdcbiAgICAgKiB0aGF0IGVycm9yIHRvIHRoZSBvdXRwdXQgc3RyZWFtLCAqcmVwbGFjZUVycm9yKiB3aWxsIGNhbGwgdGhlIGByZXBsYWNlYFxuICAgICAqIGZ1bmN0aW9uIHdoaWNoIHJldHVybnMgdGhlIHN0cmVhbSB0aGF0IHRoZSBvdXRwdXQgc3RyZWFtIHdpbGwgcmVwbGljYXRlLlxuICAgICAqIEFuZCwgaW4gY2FzZSB0aGF0IG5ldyBzdHJlYW0gYWxzbyBlbWl0cyBhbiBlcnJvciwgYHJlcGxhY2VgIHdpbGwgYmUgY2FsbGVkXG4gICAgICogYWdhaW4gdG8gZ2V0IGFub3RoZXIgc3RyZWFtIHRvIHN0YXJ0IHJlcGxpY2F0aW5nLlxuICAgICAqXG4gICAgICogTWFyYmxlIGRpYWdyYW06XG4gICAgICpcbiAgICAgKiBgYGB0ZXh0XG4gICAgICogLS0xLS0tMi0tLS0tMy0tNC0tLS0tWFxuICAgICAqICAgcmVwbGFjZUVycm9yKCAoKSA9PiAtLTEwLS18IClcbiAgICAgKiAtLTEtLS0yLS0tLS0zLS00LS0tLS0tLS0xMC0tfFxuICAgICAqIGBgYFxuICAgICAqXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gcmVwbGFjZSBBIGZ1bmN0aW9uIG9mIHR5cGUgYChlcnIpID0+IFN0cmVhbWAgdGhhdCB0YWtlc1xuICAgICAqIHRoZSBlcnJvciB0aGF0IG9jY3VycmVkIG9uIHRoZSBpbnB1dCBzdHJlYW0gb3Igb24gdGhlIHByZXZpb3VzIHJlcGxhY2VtZW50XG4gICAgICogc3RyZWFtIGFuZCByZXR1cm5zIGEgbmV3IHN0cmVhbS4gVGhlIG91dHB1dCBzdHJlYW0gd2lsbCBiZWhhdmUgbGlrZSB0aGVcbiAgICAgKiBzdHJlYW0gdGhhdCB0aGlzIGZ1bmN0aW9uIHJldHVybnMuXG4gICAgICogQHJldHVybiB7U3RyZWFtfVxuICAgICAqL1xuICAgIFN0cmVhbS5wcm90b3R5cGUucmVwbGFjZUVycm9yID0gZnVuY3Rpb24gKHJlcGxhY2UpIHtcbiAgICAgICAgcmV0dXJuIG5ldyAodGhpcy5jdG9yKCkpKG5ldyBSZXBsYWNlRXJyb3IocmVwbGFjZSwgdGhpcykpO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogRmxhdHRlbnMgYSBcInN0cmVhbSBvZiBzdHJlYW1zXCIsIGhhbmRsaW5nIG9ubHkgb25lIG5lc3RlZCBzdHJlYW0gYXQgYSB0aW1lXG4gICAgICogKG5vIGNvbmN1cnJlbmN5KS5cbiAgICAgKlxuICAgICAqIElmIHRoZSBpbnB1dCBzdHJlYW0gaXMgYSBzdHJlYW0gdGhhdCBlbWl0cyBzdHJlYW1zLCB0aGVuIHRoaXMgb3BlcmF0b3Igd2lsbFxuICAgICAqIHJldHVybiBhbiBvdXRwdXQgc3RyZWFtIHdoaWNoIGlzIGEgZmxhdCBzdHJlYW06IGVtaXRzIHJlZ3VsYXIgZXZlbnRzLiBUaGVcbiAgICAgKiBmbGF0dGVuaW5nIGhhcHBlbnMgd2l0aG91dCBjb25jdXJyZW5jeS4gSXQgd29ya3MgbGlrZSB0aGlzOiB3aGVuIHRoZSBpbnB1dFxuICAgICAqIHN0cmVhbSBlbWl0cyBhIG5lc3RlZCBzdHJlYW0sICpmbGF0dGVuKiB3aWxsIHN0YXJ0IGltaXRhdGluZyB0aGF0IG5lc3RlZFxuICAgICAqIG9uZS4gSG93ZXZlciwgYXMgc29vbiBhcyB0aGUgbmV4dCBuZXN0ZWQgc3RyZWFtIGlzIGVtaXR0ZWQgb24gdGhlIGlucHV0XG4gICAgICogc3RyZWFtLCAqZmxhdHRlbiogd2lsbCBmb3JnZXQgdGhlIHByZXZpb3VzIG5lc3RlZCBvbmUgaXQgd2FzIGltaXRhdGluZywgYW5kXG4gICAgICogd2lsbCBzdGFydCBpbWl0YXRpbmcgdGhlIG5ldyBuZXN0ZWQgb25lLlxuICAgICAqXG4gICAgICogTWFyYmxlIGRpYWdyYW06XG4gICAgICpcbiAgICAgKiBgYGB0ZXh0XG4gICAgICogLS0rLS0tLS0tLS0rLS0tLS0tLS0tLS0tLS0tXG4gICAgICogICBcXCAgICAgICAgXFxcbiAgICAgKiAgICBcXCAgICAgICAtLS0tMS0tLS0yLS0tMy0tXG4gICAgICogICAgLS1hLS1iLS0tLWMtLS0tZC0tLS0tLS0tXG4gICAgICogICAgICAgICAgIGZsYXR0ZW5cbiAgICAgKiAtLS0tLWEtLWItLS0tLS0xLS0tLTItLS0zLS1cbiAgICAgKiBgYGBcbiAgICAgKlxuICAgICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICAgKi9cbiAgICBTdHJlYW0ucHJvdG90eXBlLmZsYXR0ZW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBwID0gdGhpcy5fcHJvZDtcbiAgICAgICAgcmV0dXJuIG5ldyBTdHJlYW0obmV3IEZsYXR0ZW4odGhpcykpO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogUGFzc2VzIHRoZSBpbnB1dCBzdHJlYW0gdG8gYSBjdXN0b20gb3BlcmF0b3IsIHRvIHByb2R1Y2UgYW4gb3V0cHV0IHN0cmVhbS5cbiAgICAgKlxuICAgICAqICpjb21wb3NlKiBpcyBhIGhhbmR5IHdheSBvZiB1c2luZyBhbiBleGlzdGluZyBmdW5jdGlvbiBpbiBhIGNoYWluZWQgc3R5bGUuXG4gICAgICogSW5zdGVhZCBvZiB3cml0aW5nIGBvdXRTdHJlYW0gPSBmKGluU3RyZWFtKWAgeW91IGNhbiB3cml0ZVxuICAgICAqIGBvdXRTdHJlYW0gPSBpblN0cmVhbS5jb21wb3NlKGYpYC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IG9wZXJhdG9yIEEgZnVuY3Rpb24gdGhhdCB0YWtlcyBhIHN0cmVhbSBhcyBpbnB1dCBhbmRcbiAgICAgKiByZXR1cm5zIGEgc3RyZWFtIGFzIHdlbGwuXG4gICAgICogQHJldHVybiB7U3RyZWFtfVxuICAgICAqL1xuICAgIFN0cmVhbS5wcm90b3R5cGUuY29tcG9zZSA9IGZ1bmN0aW9uIChvcGVyYXRvcikge1xuICAgICAgICByZXR1cm4gb3BlcmF0b3IodGhpcyk7XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGFuIG91dHB1dCBzdHJlYW0gdGhhdCBiZWhhdmVzIGxpa2UgdGhlIGlucHV0IHN0cmVhbSwgYnV0IGFsc29cbiAgICAgKiByZW1lbWJlcnMgdGhlIG1vc3QgcmVjZW50IGV2ZW50IHRoYXQgaGFwcGVucyBvbiB0aGUgaW5wdXQgc3RyZWFtLCBzbyB0aGF0IGFcbiAgICAgKiBuZXdseSBhZGRlZCBsaXN0ZW5lciB3aWxsIGltbWVkaWF0ZWx5IHJlY2VpdmUgdGhhdCBtZW1vcmlzZWQgZXZlbnQuXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtNZW1vcnlTdHJlYW19XG4gICAgICovXG4gICAgU3RyZWFtLnByb3RvdHlwZS5yZW1lbWJlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBNZW1vcnlTdHJlYW0obmV3IFJlbWVtYmVyKHRoaXMpKTtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIFJldHVybnMgYW4gb3V0cHV0IHN0cmVhbSB0aGF0IGlkZW50aWNhbGx5IGJlaGF2ZXMgbGlrZSB0aGUgaW5wdXQgc3RyZWFtLFxuICAgICAqIGJ1dCBhbHNvIHJ1bnMgYSBgc3B5YCBmdW5jdGlvbiBmb3IgZWFjaCBldmVudCwgdG8gaGVscCB5b3UgZGVidWcgeW91ciBhcHAuXG4gICAgICpcbiAgICAgKiAqZGVidWcqIHRha2VzIGEgYHNweWAgZnVuY3Rpb24gYXMgYXJndW1lbnQsIGFuZCBydW5zIHRoYXQgZm9yIGVhY2ggZXZlbnRcbiAgICAgKiBoYXBwZW5pbmcgb24gdGhlIGlucHV0IHN0cmVhbS4gSWYgeW91IGRvbid0IHByb3ZpZGUgdGhlIGBzcHlgIGFyZ3VtZW50LFxuICAgICAqIHRoZW4gKmRlYnVnKiB3aWxsIGp1c3QgYGNvbnNvbGUubG9nYCBlYWNoIGV2ZW50LiBUaGlzIGhlbHBzIHlvdSB0b1xuICAgICAqIHVuZGVyc3RhbmQgdGhlIGZsb3cgb2YgZXZlbnRzIHRocm91Z2ggc29tZSBvcGVyYXRvciBjaGFpbi5cbiAgICAgKlxuICAgICAqIFBsZWFzZSBub3RlIHRoYXQgaWYgdGhlIG91dHB1dCBzdHJlYW0gaGFzIG5vIGxpc3RlbmVycywgdGhlbiBpdCB3aWxsIG5vdFxuICAgICAqIHN0YXJ0LCB3aGljaCBtZWFucyBgc3B5YCB3aWxsIG5ldmVyIHJ1biBiZWNhdXNlIG5vIGFjdHVhbCBldmVudCBoYXBwZW5zIGluXG4gICAgICogdGhhdCBjYXNlLlxuICAgICAqXG4gICAgICogTWFyYmxlIGRpYWdyYW06XG4gICAgICpcbiAgICAgKiBgYGB0ZXh0XG4gICAgICogLS0xLS0tLTItLS0tLTMtLS0tLTQtLVxuICAgICAqICAgICAgICAgZGVidWdcbiAgICAgKiAtLTEtLS0tMi0tLS0tMy0tLS0tNC0tXG4gICAgICogYGBgXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBsYWJlbE9yU3B5IEEgc3RyaW5nIHRvIHVzZSBhcyB0aGUgbGFiZWwgd2hlbiBwcmludGluZ1xuICAgICAqIGRlYnVnIGluZm9ybWF0aW9uIG9uIHRoZSBjb25zb2xlLCBvciBhICdzcHknIGZ1bmN0aW9uIHRoYXQgdGFrZXMgYW4gZXZlbnRcbiAgICAgKiBhcyBhcmd1bWVudCwgYW5kIGRvZXMgbm90IG5lZWQgdG8gcmV0dXJuIGFueXRoaW5nLlxuICAgICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICAgKi9cbiAgICBTdHJlYW0ucHJvdG90eXBlLmRlYnVnID0gZnVuY3Rpb24gKGxhYmVsT3JTcHkpIHtcbiAgICAgICAgcmV0dXJuIG5ldyAodGhpcy5jdG9yKCkpKG5ldyBEZWJ1Zyh0aGlzLCBsYWJlbE9yU3B5KSk7XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiAqaW1pdGF0ZSogY2hhbmdlcyB0aGlzIGN1cnJlbnQgU3RyZWFtIHRvIGVtaXQgdGhlIHNhbWUgZXZlbnRzIHRoYXQgdGhlXG4gICAgICogYG90aGVyYCBnaXZlbiBTdHJlYW0gZG9lcy4gVGhpcyBtZXRob2QgcmV0dXJucyBub3RoaW5nLlxuICAgICAqXG4gICAgICogVGhpcyBtZXRob2QgZXhpc3RzIHRvIGFsbG93IG9uZSB0aGluZzogKipjaXJjdWxhciBkZXBlbmRlbmN5IG9mIHN0cmVhbXMqKi5cbiAgICAgKiBGb3IgaW5zdGFuY2UsIGxldCdzIGltYWdpbmUgdGhhdCBmb3Igc29tZSByZWFzb24geW91IG5lZWQgdG8gY3JlYXRlIGFcbiAgICAgKiBjaXJjdWxhciBkZXBlbmRlbmN5IHdoZXJlIHN0cmVhbSBgZmlyc3QkYCBkZXBlbmRzIG9uIHN0cmVhbSBgc2Vjb25kJGBcbiAgICAgKiB3aGljaCBpbiB0dXJuIGRlcGVuZHMgb24gYGZpcnN0JGA6XG4gICAgICpcbiAgICAgKiA8IS0tIHNraXAtZXhhbXBsZSAtLT5cbiAgICAgKiBgYGBqc1xuICAgICAqIGltcG9ydCBkZWxheSBmcm9tICd4c3RyZWFtL2V4dHJhL2RlbGF5J1xuICAgICAqXG4gICAgICogdmFyIGZpcnN0JCA9IHNlY29uZCQubWFwKHggPT4geCAqIDEwKS50YWtlKDMpO1xuICAgICAqIHZhciBzZWNvbmQkID0gZmlyc3QkLm1hcCh4ID0+IHggKyAxKS5zdGFydFdpdGgoMSkuY29tcG9zZShkZWxheSgxMDApKTtcbiAgICAgKiBgYGBcbiAgICAgKlxuICAgICAqIEhvd2V2ZXIsIHRoYXQgaXMgaW52YWxpZCBKYXZhU2NyaXB0LCBiZWNhdXNlIGBzZWNvbmQkYCBpcyB1bmRlZmluZWRcbiAgICAgKiBvbiB0aGUgZmlyc3QgbGluZS4gVGhpcyBpcyBob3cgKmltaXRhdGUqIGNhbiBoZWxwIHNvbHZlIGl0OlxuICAgICAqXG4gICAgICogYGBganNcbiAgICAgKiBpbXBvcnQgZGVsYXkgZnJvbSAneHN0cmVhbS9leHRyYS9kZWxheSdcbiAgICAgKlxuICAgICAqIHZhciBzZWNvbmRQcm94eSQgPSB4cy5jcmVhdGUoKTtcbiAgICAgKiB2YXIgZmlyc3QkID0gc2Vjb25kUHJveHkkLm1hcCh4ID0+IHggKiAxMCkudGFrZSgzKTtcbiAgICAgKiB2YXIgc2Vjb25kJCA9IGZpcnN0JC5tYXAoeCA9PiB4ICsgMSkuc3RhcnRXaXRoKDEpLmNvbXBvc2UoZGVsYXkoMTAwKSk7XG4gICAgICogc2Vjb25kUHJveHkkLmltaXRhdGUoc2Vjb25kJCk7XG4gICAgICogYGBgXG4gICAgICpcbiAgICAgKiBXZSBjcmVhdGUgYHNlY29uZFByb3h5JGAgYmVmb3JlIHRoZSBvdGhlcnMsIHNvIGl0IGNhbiBiZSB1c2VkIGluIHRoZVxuICAgICAqIGRlY2xhcmF0aW9uIG9mIGBmaXJzdCRgLiBUaGVuLCBhZnRlciBib3RoIGBmaXJzdCRgIGFuZCBgc2Vjb25kJGAgYXJlXG4gICAgICogZGVmaW5lZCwgd2UgaG9vayBgc2Vjb25kUHJveHkkYCB3aXRoIGBzZWNvbmQkYCB3aXRoIGBpbWl0YXRlKClgIHRvIHRlbGxcbiAgICAgKiB0aGF0IHRoZXkgYXJlIFwidGhlIHNhbWVcIi4gYGltaXRhdGVgIHdpbGwgbm90IHRyaWdnZXIgdGhlIHN0YXJ0IG9mIGFueVxuICAgICAqIHN0cmVhbSwgaXQganVzdCBiaW5kcyBgc2Vjb25kUHJveHkkYCBhbmQgYHNlY29uZCRgIHRvZ2V0aGVyLlxuICAgICAqXG4gICAgICogVGhlIGZvbGxvd2luZyBpcyBhbiBleGFtcGxlIHdoZXJlIGBpbWl0YXRlKClgIGlzIGltcG9ydGFudCBpbiBDeWNsZS5qc1xuICAgICAqIGFwcGxpY2F0aW9ucy4gQSBwYXJlbnQgY29tcG9uZW50IGNvbnRhaW5zIHNvbWUgY2hpbGQgY29tcG9uZW50cy4gQSBjaGlsZFxuICAgICAqIGhhcyBhbiBhY3Rpb24gc3RyZWFtIHdoaWNoIGlzIGdpdmVuIHRvIHRoZSBwYXJlbnQgdG8gZGVmaW5lIGl0cyBzdGF0ZTpcbiAgICAgKlxuICAgICAqIDwhLS0gc2tpcC1leGFtcGxlIC0tPlxuICAgICAqIGBgYGpzXG4gICAgICogY29uc3QgY2hpbGRBY3Rpb25Qcm94eSQgPSB4cy5jcmVhdGUoKTtcbiAgICAgKiBjb25zdCBwYXJlbnQgPSBQYXJlbnQoey4uLnNvdXJjZXMsIGNoaWxkQWN0aW9uJDogY2hpbGRBY3Rpb25Qcm94eSR9KTtcbiAgICAgKiBjb25zdCBjaGlsZEFjdGlvbiQgPSBwYXJlbnQuc3RhdGUkLm1hcChzID0+IHMuY2hpbGQuYWN0aW9uJCkuZmxhdHRlbigpO1xuICAgICAqIGNoaWxkQWN0aW9uUHJveHkkLmltaXRhdGUoY2hpbGRBY3Rpb24kKTtcbiAgICAgKiBgYGBcbiAgICAgKlxuICAgICAqIE5vdGUsIHRob3VnaCwgdGhhdCAqKmBpbWl0YXRlKClgIGRvZXMgbm90IHN1cHBvcnQgTWVtb3J5U3RyZWFtcyoqLiBJZiB3ZVxuICAgICAqIHdvdWxkIGF0dGVtcHQgdG8gaW1pdGF0ZSBhIE1lbW9yeVN0cmVhbSBpbiBhIGNpcmN1bGFyIGRlcGVuZGVuY3ksIHdlIHdvdWxkXG4gICAgICogZWl0aGVyIGdldCBhIHJhY2UgY29uZGl0aW9uICh3aGVyZSB0aGUgc3ltcHRvbSB3b3VsZCBiZSBcIm5vdGhpbmcgaGFwcGVuc1wiKVxuICAgICAqIG9yIGFuIGluZmluaXRlIGN5Y2xpYyBlbWlzc2lvbiBvZiB2YWx1ZXMuIEl0J3MgdXNlZnVsIHRvIHRoaW5rIGFib3V0XG4gICAgICogTWVtb3J5U3RyZWFtcyBhcyBjZWxscyBpbiBhIHNwcmVhZHNoZWV0LiBJdCBkb2Vzbid0IG1ha2UgYW55IHNlbnNlIHRvXG4gICAgICogZGVmaW5lIGEgc3ByZWFkc2hlZXQgY2VsbCBgQTFgIHdpdGggYSBmb3JtdWxhIHRoYXQgZGVwZW5kcyBvbiBgQjFgIGFuZFxuICAgICAqIGNlbGwgYEIxYCBkZWZpbmVkIHdpdGggYSBmb3JtdWxhIHRoYXQgZGVwZW5kcyBvbiBgQTFgLlxuICAgICAqXG4gICAgICogSWYgeW91IGZpbmQgeW91cnNlbGYgd2FudGluZyB0byB1c2UgYGltaXRhdGUoKWAgd2l0aCBhXG4gICAgICogTWVtb3J5U3RyZWFtLCB5b3Ugc2hvdWxkIHJld29yayB5b3VyIGNvZGUgYXJvdW5kIGBpbWl0YXRlKClgIHRvIHVzZSBhXG4gICAgICogU3RyZWFtIGluc3RlYWQuIExvb2sgZm9yIHRoZSBzdHJlYW0gaW4gdGhlIGNpcmN1bGFyIGRlcGVuZGVuY3kgdGhhdFxuICAgICAqIHJlcHJlc2VudHMgYW4gZXZlbnQgc3RyZWFtLCBhbmQgdGhhdCB3b3VsZCBiZSBhIGNhbmRpZGF0ZSBmb3IgY3JlYXRpbmcgYVxuICAgICAqIHByb3h5IFN0cmVhbSB3aGljaCB0aGVuIGltaXRhdGVzIHRoZSB0YXJnZXQgU3RyZWFtLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJlYW19IHRhcmdldCBUaGUgb3RoZXIgc3RyZWFtIHRvIGltaXRhdGUgb24gdGhlIGN1cnJlbnQgb25lLiBNdXN0XG4gICAgICogbm90IGJlIGEgTWVtb3J5U3RyZWFtLlxuICAgICAqL1xuICAgIFN0cmVhbS5wcm90b3R5cGUuaW1pdGF0ZSA9IGZ1bmN0aW9uICh0YXJnZXQpIHtcbiAgICAgICAgaWYgKHRhcmdldCBpbnN0YW5jZW9mIE1lbW9yeVN0cmVhbSlcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQSBNZW1vcnlTdHJlYW0gd2FzIGdpdmVuIHRvIGltaXRhdGUoKSwgYnV0IGl0IG9ubHkgJyArXG4gICAgICAgICAgICAgICAgJ3N1cHBvcnRzIGEgU3RyZWFtLiBSZWFkIG1vcmUgYWJvdXQgdGhpcyByZXN0cmljdGlvbiBoZXJlOiAnICtcbiAgICAgICAgICAgICAgICAnaHR0cHM6Ly9naXRodWIuY29tL3N0YWx0ei94c3RyZWFtI2ZhcScpO1xuICAgICAgICB0aGlzLl90YXJnZXQgPSB0YXJnZXQ7XG4gICAgICAgIGZvciAodmFyIGlscyA9IHRoaXMuX2lscywgTiA9IGlscy5sZW5ndGgsIGkgPSAwOyBpIDwgTjsgaSsrKVxuICAgICAgICAgICAgdGFyZ2V0Ll9hZGQoaWxzW2ldKTtcbiAgICAgICAgdGhpcy5faWxzID0gW107XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBGb3JjZXMgdGhlIFN0cmVhbSB0byBlbWl0IHRoZSBnaXZlbiB2YWx1ZSB0byBpdHMgbGlzdGVuZXJzLlxuICAgICAqXG4gICAgICogQXMgdGhlIG5hbWUgaW5kaWNhdGVzLCBpZiB5b3UgdXNlIHRoaXMsIHlvdSBhcmUgbW9zdCBsaWtlbHkgZG9pbmcgc29tZXRoaW5nXG4gICAgICogVGhlIFdyb25nIFdheS4gUGxlYXNlIHRyeSB0byB1bmRlcnN0YW5kIHRoZSByZWFjdGl2ZSB3YXkgYmVmb3JlIHVzaW5nIHRoaXNcbiAgICAgKiBtZXRob2QuIFVzZSBpdCBvbmx5IHdoZW4geW91IGtub3cgd2hhdCB5b3UgYXJlIGRvaW5nLlxuICAgICAqXG4gICAgICogQHBhcmFtIHZhbHVlIFRoZSBcIm5leHRcIiB2YWx1ZSB5b3Ugd2FudCB0byBicm9hZGNhc3QgdG8gYWxsIGxpc3RlbmVycyBvZlxuICAgICAqIHRoaXMgU3RyZWFtLlxuICAgICAqL1xuICAgIFN0cmVhbS5wcm90b3R5cGUuc2hhbWVmdWxseVNlbmROZXh0ID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIHRoaXMuX24odmFsdWUpO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogRm9yY2VzIHRoZSBTdHJlYW0gdG8gZW1pdCB0aGUgZ2l2ZW4gZXJyb3IgdG8gaXRzIGxpc3RlbmVycy5cbiAgICAgKlxuICAgICAqIEFzIHRoZSBuYW1lIGluZGljYXRlcywgaWYgeW91IHVzZSB0aGlzLCB5b3UgYXJlIG1vc3QgbGlrZWx5IGRvaW5nIHNvbWV0aGluZ1xuICAgICAqIFRoZSBXcm9uZyBXYXkuIFBsZWFzZSB0cnkgdG8gdW5kZXJzdGFuZCB0aGUgcmVhY3RpdmUgd2F5IGJlZm9yZSB1c2luZyB0aGlzXG4gICAgICogbWV0aG9kLiBVc2UgaXQgb25seSB3aGVuIHlvdSBrbm93IHdoYXQgeW91IGFyZSBkb2luZy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7YW55fSBlcnJvciBUaGUgZXJyb3IgeW91IHdhbnQgdG8gYnJvYWRjYXN0IHRvIGFsbCB0aGUgbGlzdGVuZXJzIG9mXG4gICAgICogdGhpcyBTdHJlYW0uXG4gICAgICovXG4gICAgU3RyZWFtLnByb3RvdHlwZS5zaGFtZWZ1bGx5U2VuZEVycm9yID0gZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICAgIHRoaXMuX2UoZXJyb3IpO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogRm9yY2VzIHRoZSBTdHJlYW0gdG8gZW1pdCB0aGUgXCJjb21wbGV0ZWRcIiBldmVudCB0byBpdHMgbGlzdGVuZXJzLlxuICAgICAqXG4gICAgICogQXMgdGhlIG5hbWUgaW5kaWNhdGVzLCBpZiB5b3UgdXNlIHRoaXMsIHlvdSBhcmUgbW9zdCBsaWtlbHkgZG9pbmcgc29tZXRoaW5nXG4gICAgICogVGhlIFdyb25nIFdheS4gUGxlYXNlIHRyeSB0byB1bmRlcnN0YW5kIHRoZSByZWFjdGl2ZSB3YXkgYmVmb3JlIHVzaW5nIHRoaXNcbiAgICAgKiBtZXRob2QuIFVzZSBpdCBvbmx5IHdoZW4geW91IGtub3cgd2hhdCB5b3UgYXJlIGRvaW5nLlxuICAgICAqL1xuICAgIFN0cmVhbS5wcm90b3R5cGUuc2hhbWVmdWxseVNlbmRDb21wbGV0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5fYygpO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogQWRkcyBhIFwiZGVidWdcIiBsaXN0ZW5lciB0byB0aGUgc3RyZWFtLiBUaGVyZSBjYW4gb25seSBiZSBvbmUgZGVidWdcbiAgICAgKiBsaXN0ZW5lciwgdGhhdCdzIHdoeSB0aGlzIGlzICdzZXREZWJ1Z0xpc3RlbmVyJy4gVG8gcmVtb3ZlIHRoZSBkZWJ1Z1xuICAgICAqIGxpc3RlbmVyLCBqdXN0IGNhbGwgc2V0RGVidWdMaXN0ZW5lcihudWxsKS5cbiAgICAgKlxuICAgICAqIEEgZGVidWcgbGlzdGVuZXIgaXMgbGlrZSBhbnkgb3RoZXIgbGlzdGVuZXIuIFRoZSBvbmx5IGRpZmZlcmVuY2UgaXMgdGhhdCBhXG4gICAgICogZGVidWcgbGlzdGVuZXIgaXMgXCJzdGVhbHRoeVwiOiBpdHMgcHJlc2VuY2UvYWJzZW5jZSBkb2VzIG5vdCB0cmlnZ2VyIHRoZVxuICAgICAqIHN0YXJ0L3N0b3Agb2YgdGhlIHN0cmVhbSAob3IgdGhlIHByb2R1Y2VyIGluc2lkZSB0aGUgc3RyZWFtKS4gVGhpcyBpc1xuICAgICAqIHVzZWZ1bCBzbyB5b3UgY2FuIGluc3BlY3Qgd2hhdCBpcyBnb2luZyBvbiB3aXRob3V0IGNoYW5naW5nIHRoZSBiZWhhdmlvclxuICAgICAqIG9mIHRoZSBwcm9ncmFtLiBJZiB5b3UgaGF2ZSBhbiBpZGxlIHN0cmVhbSBhbmQgeW91IGFkZCBhIG5vcm1hbCBsaXN0ZW5lciB0b1xuICAgICAqIGl0LCB0aGUgc3RyZWFtIHdpbGwgc3RhcnQgZXhlY3V0aW5nLiBCdXQgaWYgeW91IHNldCBhIGRlYnVnIGxpc3RlbmVyIG9uIGFuXG4gICAgICogaWRsZSBzdHJlYW0sIGl0IHdvbid0IHN0YXJ0IGV4ZWN1dGluZyAobm90IHVudGlsIHRoZSBmaXJzdCBub3JtYWwgbGlzdGVuZXJcbiAgICAgKiBpcyBhZGRlZCkuXG4gICAgICpcbiAgICAgKiBBcyB0aGUgbmFtZSBpbmRpY2F0ZXMsIHdlIGRvbid0IHJlY29tbWVuZCB1c2luZyB0aGlzIG1ldGhvZCB0byBidWlsZCBhcHBcbiAgICAgKiBsb2dpYy4gSW4gZmFjdCwgaW4gbW9zdCBjYXNlcyB0aGUgZGVidWcgb3BlcmF0b3Igd29ya3MganVzdCBmaW5lLiBPbmx5IHVzZVxuICAgICAqIHRoaXMgb25lIGlmIHlvdSBrbm93IHdoYXQgeW91J3JlIGRvaW5nLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtMaXN0ZW5lcjxUPn0gbGlzdGVuZXJcbiAgICAgKi9cbiAgICBTdHJlYW0ucHJvdG90eXBlLnNldERlYnVnTGlzdGVuZXIgPSBmdW5jdGlvbiAobGlzdGVuZXIpIHtcbiAgICAgICAgaWYgKCFsaXN0ZW5lcikge1xuICAgICAgICAgICAgdGhpcy5fZCA9IGZhbHNlO1xuICAgICAgICAgICAgdGhpcy5fZGwgPSBOTztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX2QgPSB0cnVlO1xuICAgICAgICAgICAgbGlzdGVuZXIuX24gPSBsaXN0ZW5lci5uZXh0IHx8IG5vb3A7XG4gICAgICAgICAgICBsaXN0ZW5lci5fZSA9IGxpc3RlbmVyLmVycm9yIHx8IG5vb3A7XG4gICAgICAgICAgICBsaXN0ZW5lci5fYyA9IGxpc3RlbmVyLmNvbXBsZXRlIHx8IG5vb3A7XG4gICAgICAgICAgICB0aGlzLl9kbCA9IGxpc3RlbmVyO1xuICAgICAgICB9XG4gICAgfTtcbiAgICByZXR1cm4gU3RyZWFtO1xufSgpKTtcbi8qKlxuICogQmxlbmRzIG11bHRpcGxlIHN0cmVhbXMgdG9nZXRoZXIsIGVtaXR0aW5nIGV2ZW50cyBmcm9tIGFsbCBvZiB0aGVtXG4gKiBjb25jdXJyZW50bHkuXG4gKlxuICogKm1lcmdlKiB0YWtlcyBtdWx0aXBsZSBzdHJlYW1zIGFzIGFyZ3VtZW50cywgYW5kIGNyZWF0ZXMgYSBzdHJlYW0gdGhhdFxuICogYmVoYXZlcyBsaWtlIGVhY2ggb2YgdGhlIGFyZ3VtZW50IHN0cmVhbXMsIGluIHBhcmFsbGVsLlxuICpcbiAqIE1hcmJsZSBkaWFncmFtOlxuICpcbiAqIGBgYHRleHRcbiAqIC0tMS0tLS0yLS0tLS0zLS0tLS0tLS00LS0tXG4gKiAtLS0tYS0tLS0tYi0tLS1jLS0tZC0tLS0tLVxuICogICAgICAgICAgICBtZXJnZVxuICogLS0xLWEtLTItLWItLTMtYy0tLWQtLTQtLS1cbiAqIGBgYFxuICpcbiAqIEBmYWN0b3J5IHRydWVcbiAqIEBwYXJhbSB7U3RyZWFtfSBzdHJlYW0xIEEgc3RyZWFtIHRvIG1lcmdlIHRvZ2V0aGVyIHdpdGggb3RoZXIgc3RyZWFtcy5cbiAqIEBwYXJhbSB7U3RyZWFtfSBzdHJlYW0yIEEgc3RyZWFtIHRvIG1lcmdlIHRvZ2V0aGVyIHdpdGggb3RoZXIgc3RyZWFtcy4gVHdvXG4gKiBvciBtb3JlIHN0cmVhbXMgbWF5IGJlIGdpdmVuIGFzIGFyZ3VtZW50cy5cbiAqIEByZXR1cm4ge1N0cmVhbX1cbiAqL1xuU3RyZWFtLm1lcmdlID0gZnVuY3Rpb24gbWVyZ2UoKSB7XG4gICAgdmFyIHN0cmVhbXMgPSBbXTtcbiAgICBmb3IgKHZhciBfaSA9IDA7IF9pIDwgYXJndW1lbnRzLmxlbmd0aDsgX2krKykge1xuICAgICAgICBzdHJlYW1zW19pXSA9IGFyZ3VtZW50c1tfaV07XG4gICAgfVxuICAgIHJldHVybiBuZXcgU3RyZWFtKG5ldyBNZXJnZShzdHJlYW1zKSk7XG59O1xuLyoqXG4gKiBDb21iaW5lcyBtdWx0aXBsZSBpbnB1dCBzdHJlYW1zIHRvZ2V0aGVyIHRvIHJldHVybiBhIHN0cmVhbSB3aG9zZSBldmVudHNcbiAqIGFyZSBhcnJheXMgdGhhdCBjb2xsZWN0IHRoZSBsYXRlc3QgZXZlbnRzIGZyb20gZWFjaCBpbnB1dCBzdHJlYW0uXG4gKlxuICogKmNvbWJpbmUqIGludGVybmFsbHkgcmVtZW1iZXJzIHRoZSBtb3N0IHJlY2VudCBldmVudCBmcm9tIGVhY2ggb2YgdGhlIGlucHV0XG4gKiBzdHJlYW1zLiBXaGVuIGFueSBvZiB0aGUgaW5wdXQgc3RyZWFtcyBlbWl0cyBhbiBldmVudCwgdGhhdCBldmVudCB0b2dldGhlclxuICogd2l0aCBhbGwgdGhlIG90aGVyIHNhdmVkIGV2ZW50cyBhcmUgY29tYmluZWQgaW50byBhbiBhcnJheS4gVGhhdCBhcnJheSB3aWxsXG4gKiBiZSBlbWl0dGVkIG9uIHRoZSBvdXRwdXQgc3RyZWFtLiBJdCdzIGVzc2VudGlhbGx5IGEgd2F5IG9mIGpvaW5pbmcgdG9nZXRoZXJcbiAqIHRoZSBldmVudHMgZnJvbSBtdWx0aXBsZSBzdHJlYW1zLlxuICpcbiAqIE1hcmJsZSBkaWFncmFtOlxuICpcbiAqIGBgYHRleHRcbiAqIC0tMS0tLS0yLS0tLS0zLS0tLS0tLS00LS0tXG4gKiAtLS0tYS0tLS0tYi0tLS0tYy0tZC0tLS0tLVxuICogICAgICAgICAgY29tYmluZVxuICogLS0tLTFhLTJhLTJiLTNiLTNjLTNkLTRkLS1cbiAqIGBgYFxuICpcbiAqIE5vdGU6IHRvIG1pbmltaXplIGdhcmJhZ2UgY29sbGVjdGlvbiwgKmNvbWJpbmUqIHVzZXMgdGhlIHNhbWUgYXJyYXlcbiAqIGluc3RhbmNlIGZvciBlYWNoIGVtaXNzaW9uLiAgSWYgeW91IG5lZWQgdG8gY29tcGFyZSBlbWlzc2lvbnMgb3ZlciB0aW1lLFxuICogY2FjaGUgdGhlIHZhbHVlcyB3aXRoIGBtYXBgIGZpcnN0OlxuICpcbiAqIGBgYGpzXG4gKiBpbXBvcnQgcGFpcndpc2UgZnJvbSAneHN0cmVhbS9leHRyYS9wYWlyd2lzZSdcbiAqXG4gKiBjb25zdCBzdHJlYW0xID0geHMub2YoMSk7XG4gKiBjb25zdCBzdHJlYW0yID0geHMub2YoMik7XG4gKlxuICogeHMuY29tYmluZShzdHJlYW0xLCBzdHJlYW0yKS5tYXAoXG4gKiAgIGNvbWJpbmVkRW1pc3Npb25zID0+IChbIC4uLmNvbWJpbmVkRW1pc3Npb25zIF0pXG4gKiApLmNvbXBvc2UocGFpcndpc2UpXG4gKiBgYGBcbiAqXG4gKiBAZmFjdG9yeSB0cnVlXG4gKiBAcGFyYW0ge1N0cmVhbX0gc3RyZWFtMSBBIHN0cmVhbSB0byBjb21iaW5lIHRvZ2V0aGVyIHdpdGggb3RoZXIgc3RyZWFtcy5cbiAqIEBwYXJhbSB7U3RyZWFtfSBzdHJlYW0yIEEgc3RyZWFtIHRvIGNvbWJpbmUgdG9nZXRoZXIgd2l0aCBvdGhlciBzdHJlYW1zLlxuICogTXVsdGlwbGUgc3RyZWFtcywgbm90IGp1c3QgdHdvLCBtYXkgYmUgZ2l2ZW4gYXMgYXJndW1lbnRzLlxuICogQHJldHVybiB7U3RyZWFtfVxuICovXG5TdHJlYW0uY29tYmluZSA9IGZ1bmN0aW9uIGNvbWJpbmUoKSB7XG4gICAgdmFyIHN0cmVhbXMgPSBbXTtcbiAgICBmb3IgKHZhciBfaSA9IDA7IF9pIDwgYXJndW1lbnRzLmxlbmd0aDsgX2krKykge1xuICAgICAgICBzdHJlYW1zW19pXSA9IGFyZ3VtZW50c1tfaV07XG4gICAgfVxuICAgIHJldHVybiBuZXcgU3RyZWFtKG5ldyBDb21iaW5lKHN0cmVhbXMpKTtcbn07XG5leHBvcnRzLlN0cmVhbSA9IFN0cmVhbTtcbnZhciBNZW1vcnlTdHJlYW0gPSAoZnVuY3Rpb24gKF9zdXBlcikge1xuICAgIF9fZXh0ZW5kcyhNZW1vcnlTdHJlYW0sIF9zdXBlcik7XG4gICAgZnVuY3Rpb24gTWVtb3J5U3RyZWFtKHByb2R1Y2VyKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IF9zdXBlci5jYWxsKHRoaXMsIHByb2R1Y2VyKSB8fCB0aGlzO1xuICAgICAgICBfdGhpcy5faGFzID0gZmFsc2U7XG4gICAgICAgIHJldHVybiBfdGhpcztcbiAgICB9XG4gICAgTWVtb3J5U3RyZWFtLnByb3RvdHlwZS5fbiA9IGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHRoaXMuX3YgPSB4O1xuICAgICAgICB0aGlzLl9oYXMgPSB0cnVlO1xuICAgICAgICBfc3VwZXIucHJvdG90eXBlLl9uLmNhbGwodGhpcywgeCk7XG4gICAgfTtcbiAgICBNZW1vcnlTdHJlYW0ucHJvdG90eXBlLl9hZGQgPSBmdW5jdGlvbiAoaWwpIHtcbiAgICAgICAgdmFyIHRhID0gdGhpcy5fdGFyZ2V0O1xuICAgICAgICBpZiAodGEgIT09IE5PKVxuICAgICAgICAgICAgcmV0dXJuIHRhLl9hZGQoaWwpO1xuICAgICAgICB2YXIgYSA9IHRoaXMuX2lscztcbiAgICAgICAgYS5wdXNoKGlsKTtcbiAgICAgICAgaWYgKGEubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgaWYgKHRoaXMuX2hhcylcbiAgICAgICAgICAgICAgICBpbC5fbih0aGlzLl92KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5fc3RvcElEICE9PSBOTykge1xuICAgICAgICAgICAgaWYgKHRoaXMuX2hhcylcbiAgICAgICAgICAgICAgICBpbC5fbih0aGlzLl92KTtcbiAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aGlzLl9zdG9wSUQpO1xuICAgICAgICAgICAgdGhpcy5fc3RvcElEID0gTk87XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodGhpcy5faGFzKVxuICAgICAgICAgICAgaWwuX24odGhpcy5fdik7XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdmFyIHAgPSB0aGlzLl9wcm9kO1xuICAgICAgICAgICAgaWYgKHAgIT09IE5PKVxuICAgICAgICAgICAgICAgIHAuX3N0YXJ0KHRoaXMpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBNZW1vcnlTdHJlYW0ucHJvdG90eXBlLl9zdG9wTm93ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLl9oYXMgPSBmYWxzZTtcbiAgICAgICAgX3N1cGVyLnByb3RvdHlwZS5fc3RvcE5vdy5jYWxsKHRoaXMpO1xuICAgIH07XG4gICAgTWVtb3J5U3RyZWFtLnByb3RvdHlwZS5feCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5faGFzID0gZmFsc2U7XG4gICAgICAgIF9zdXBlci5wcm90b3R5cGUuX3guY2FsbCh0aGlzKTtcbiAgICB9O1xuICAgIE1lbW9yeVN0cmVhbS5wcm90b3R5cGUubWFwID0gZnVuY3Rpb24gKHByb2plY3QpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX21hcChwcm9qZWN0KTtcbiAgICB9O1xuICAgIE1lbW9yeVN0cmVhbS5wcm90b3R5cGUubWFwVG8gPSBmdW5jdGlvbiAocHJvamVjdGVkVmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIF9zdXBlci5wcm90b3R5cGUubWFwVG8uY2FsbCh0aGlzLCBwcm9qZWN0ZWRWYWx1ZSk7XG4gICAgfTtcbiAgICBNZW1vcnlTdHJlYW0ucHJvdG90eXBlLnRha2UgPSBmdW5jdGlvbiAoYW1vdW50KSB7XG4gICAgICAgIHJldHVybiBfc3VwZXIucHJvdG90eXBlLnRha2UuY2FsbCh0aGlzLCBhbW91bnQpO1xuICAgIH07XG4gICAgTWVtb3J5U3RyZWFtLnByb3RvdHlwZS5lbmRXaGVuID0gZnVuY3Rpb24gKG90aGVyKSB7XG4gICAgICAgIHJldHVybiBfc3VwZXIucHJvdG90eXBlLmVuZFdoZW4uY2FsbCh0aGlzLCBvdGhlcik7XG4gICAgfTtcbiAgICBNZW1vcnlTdHJlYW0ucHJvdG90eXBlLnJlcGxhY2VFcnJvciA9IGZ1bmN0aW9uIChyZXBsYWNlKSB7XG4gICAgICAgIHJldHVybiBfc3VwZXIucHJvdG90eXBlLnJlcGxhY2VFcnJvci5jYWxsKHRoaXMsIHJlcGxhY2UpO1xuICAgIH07XG4gICAgTWVtb3J5U3RyZWFtLnByb3RvdHlwZS5yZW1lbWJlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBNZW1vcnlTdHJlYW0ucHJvdG90eXBlLmRlYnVnID0gZnVuY3Rpb24gKGxhYmVsT3JTcHkpIHtcbiAgICAgICAgcmV0dXJuIF9zdXBlci5wcm90b3R5cGUuZGVidWcuY2FsbCh0aGlzLCBsYWJlbE9yU3B5KTtcbiAgICB9O1xuICAgIHJldHVybiBNZW1vcnlTdHJlYW07XG59KFN0cmVhbSkpO1xuZXhwb3J0cy5NZW1vcnlTdHJlYW0gPSBNZW1vcnlTdHJlYW07XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLmRlZmF1bHQgPSBTdHJlYW07XG4vLyMgc291cmNlTWFwcGluZ1VSTD1pbmRleC5qcy5tYXAiLCJpbXBvcnQge3J1bn0gZnJvbSAnQGN5Y2xlL3J1bic7XG5pbXBvcnQge21ha2VET01Ecml2ZXJ9IGZyb20gJ0BjeWNsZS9kb20nO1xuaW1wb3J0IHN0b3JhZ2VEcml2ZXIgZnJvbSAnQGN5Y2xlL3N0b3JhZ2UnO1xuaW1wb3J0IHtjYXB0dXJlQ2xpY2tzLCBtYWtlSGlzdG9yeURyaXZlcn0gZnJvbSAnQGN5Y2xlL2hpc3RvcnknXG5pbXBvcnQgb25pb25pZnkgZnJvbSAnY3ljbGUtb25pb25pZnknO1xuaW1wb3J0IHN0b3JhZ2VpZnkgZnJvbSAnY3ljbGUtc3RvcmFnZWlmeSc7XG5pbXBvcnQgVGFza0xpc3QgZnJvbSAnLi9jb21wb25lbnRzL1Rhc2tMaXN0JztcblxuaW1wb3J0IFByb3BzTW9kdWxlIGZyb20gJ3NuYWJiZG9tL21vZHVsZXMvcHJvcHMnO1xuaW1wb3J0IEF0dHJzTW9kdWxlIGZyb20gJ3NuYWJiZG9tL21vZHVsZXMvYXR0cmlidXRlcyc7XG5pbXBvcnQgU3R5bGVNb2R1bGUgZnJvbSAnc25hYmJkb20vbW9kdWxlcy9zdHlsZSc7XG5pbXBvcnQgQ2xhc3NNb2R1bGUgZnJvbSAnc25hYmJkb20vbW9kdWxlcy9jbGFzcyc7XG5pbXBvcnQgQ3NzTW9kdWxlIGZyb20gJ3NuYWJiZG9tLXR5cGVzdHlsZSc7XG5cbmNvbnN0IG1vZHVsZXMgPSBbXG4gIFByb3BzTW9kdWxlLFxuICBBdHRyc01vZHVsZSxcbiAgU3R5bGVNb2R1bGUsXG4gIENzc01vZHVsZSxcbiAgQ2xhc3NNb2R1bGVcbl07XG5cbmNvbnN0IG1haW4gPSBvbmlvbmlmeShzdG9yYWdlaWZ5KFRhc2tMaXN0LCB7a2V5OiAndG9kb3MtY3ljbGUnfSkpO1xuXG5ydW4obWFpbiwge1xuICBET006IG1ha2VET01Ecml2ZXIoJy50b2RvYXBwJywge21vZHVsZXMsIHRyYW5zcG9zaXRpb246IHRydWV9KSxcbiAgaGlzdG9yeTogY2FwdHVyZUNsaWNrcyhtYWtlSGlzdG9yeURyaXZlcigpKSxcbiAgc3RvcmFnZTogc3RvcmFnZURyaXZlcixcbn0pO1xuIiwiaW1wb3J0IGludGVudCBmcm9tICcuL2ludGVudCc7XG5pbXBvcnQgbW9kZWwgZnJvbSAnLi9tb2RlbCc7XG5pbXBvcnQgdmlldyBmcm9tICcuL3ZpZXcnO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBUYXNrKHNvdXJjZXMpIHtcbiAgY29uc3QgYWN0aW9ucyA9IGludGVudChzb3VyY2VzLkRPTSk7XG4gIGNvbnN0IHJlZHVjZXIkID0gbW9kZWwoYWN0aW9ucyk7XG4gIGNvbnN0IHZkb20kID0gdmlldyhzb3VyY2VzLm9uaW9uLnN0YXRlJCk7XG5cbiAgcmV0dXJuIHtcbiAgICBET006IHZkb20kLFxuICAgIG9uaW9uOiByZWR1Y2VyJCxcbiAgfTtcbn1cbiIsImltcG9ydCB4cyBmcm9tICd4c3RyZWFtJztcbmltcG9ydCB7RU5URVJfS0VZLCBFU0NfS0VZfSBmcm9tICcuLi8uLi91dGlscyc7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGludGVudChkb21Tb3VyY2UpIHtcbiAgY29uc3QgZWRpdEVudGVyRXZlbnQkID0gZG9tU291cmNlXG4gICAgLnNlbGVjdCgnLmVkaXQnKS5ldmVudHMoJ2tleXVwJylcbiAgICAuZmlsdGVyKGV2ID0+IGV2LmtleUNvZGUgPT09IEVOVEVSX0tFWSk7XG5cbiAgY29uc3QgZWRpdEJsdXJFdmVudCQgPSBkb21Tb3VyY2Uuc2VsZWN0KCcuZWRpdCcpLmV2ZW50cygnYmx1cicsIHRydWUpO1xuXG4gIHJldHVybiB7XG4gICAgc3RhcnRFZGl0JDogZG9tU291cmNlXG4gICAgICAuc2VsZWN0KCdsYWJlbCcpLmV2ZW50cygnZGJsY2xpY2snKVxuICAgICAgLm1hcFRvKG51bGwpLFxuXG4gICAgZG9uZUVkaXQkOiB4cy5tZXJnZShlZGl0RW50ZXJFdmVudCQsIGVkaXRCbHVyRXZlbnQkKVxuICAgICAgLm1hcChldiA9PiBldi50YXJnZXQudmFsdWUpLFxuXG4gICAgY2FuY2VsRWRpdCQ6IGRvbVNvdXJjZVxuICAgICAgLnNlbGVjdCgnLmVkaXQnKS5ldmVudHMoJ2tleXVwJylcbiAgICAgIC5maWx0ZXIoZXYgPT4gZXYua2V5Q29kZSA9PT0gRVNDX0tFWSlcbiAgICAgIC5tYXBUbyhudWxsKSxcblxuICAgIHRvZ2dsZSQ6IGRvbVNvdXJjZVxuICAgICAgLnNlbGVjdCgnLnRvZ2dsZScpLmV2ZW50cygnY2hhbmdlJylcbiAgICAgIC5tYXAoZXYgPT4gZXYudGFyZ2V0LmNoZWNrZWQpLFxuXG4gICAgZGVzdHJveSQ6IGRvbVNvdXJjZVxuICAgICAgLnNlbGVjdCgnLmRlc3Ryb3knKS5ldmVudHMoJ2NsaWNrJylcbiAgICAgIC5tYXBUbyhudWxsKSxcbiAgfVxufVxuIiwiaW1wb3J0IHhzIGZyb20gJ3hzdHJlYW0nO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBtb2RlbChhY3Rpb25zKSB7XG4gIGNvbnN0IHN0YXJ0RWRpdFJlZHVjZXIkID0gYWN0aW9ucy5zdGFydEVkaXQkXG4gICAgLm1hcFRvKGZ1bmN0aW9uIHN0YXJ0RWRpdFJlZHVjZXIoZGF0YSkge1xuICAgICAgcmV0dXJuIHsuLi5kYXRhLCBlZGl0aW5nOiB0cnVlfTtcbiAgICB9KTtcblxuICBjb25zdCBkb25lRWRpdFJlZHVjZXIkID0gYWN0aW9ucy5kb25lRWRpdCRcbiAgICAubWFwKGNvbnRlbnQgPT4gZnVuY3Rpb24gZG9uZUVkaXRSZWR1Y2VyKGRhdGEpIHtcbiAgICAgIHJldHVybiB7Li4uZGF0YSwgdGl0bGU6IGNvbnRlbnQsIGVkaXRpbmc6IGZhbHNlfTtcbiAgICB9KTtcblxuICBjb25zdCBjYW5jZWxFZGl0UmVkdWNlciQgPSBhY3Rpb25zLmNhbmNlbEVkaXQkXG4gICAgLm1hcFRvKGZ1bmN0aW9uIGNhbmNlbEVkaXRSZWR1Y2VyKGRhdGEpIHtcbiAgICAgIHJldHVybiB7Li4uZGF0YSwgZWRpdGluZzogZmFsc2V9O1xuICAgIH0pO1xuXG4gIGNvbnN0IHRvZ2dsZVJlZHVjZXIkID0gYWN0aW9ucy50b2dnbGUkXG4gICAgLm1hcChpc1RvZ2dsZWQgPT4gZnVuY3Rpb24gdG9nZ2xlUmVkdWNlcihkYXRhKSB7XG4gICAgICByZXR1cm4gey4uLmRhdGEsIGNvbXBsZXRlZDogaXNUb2dnbGVkfTtcbiAgICB9KTtcblxuICBjb25zdCBkZXN0cm95UmVkdWNlciQgPSBhY3Rpb25zLmRlc3Ryb3kkXG4gICAgLm1hcFRvKGZ1bmN0aW9uIGRlc3Ryb3lSZWR1Y2VyKGRhdGEpIHtcbiAgICAgIHJldHVybiB2b2lkIDA7XG4gICAgfSk7XG5cbiAgcmV0dXJuIHhzLm1lcmdlKFxuICAgIHN0YXJ0RWRpdFJlZHVjZXIkLFxuICAgIGRvbmVFZGl0UmVkdWNlciQsXG4gICAgY2FuY2VsRWRpdFJlZHVjZXIkLFxuICAgIHRvZ2dsZVJlZHVjZXIkLFxuICAgIGRlc3Ryb3lSZWR1Y2VyJFxuICApO1xufVxuIiwiZXhwb3J0IGNvbnN0IHZpZXdTdHlsZSA9IChlZGl0aW5nKSA9PiAoe1xuICAnZGlzcGxheSc6IGVkaXRpbmcgPyAnbm9uZScgOiAnYmxvY2snLFxufSk7XG5cbmV4cG9ydCBjb25zdCB0b2RvTGlTdHlsZSA9IChlZGl0aW5nLCBsYXN0KSA9PiAoe1xuICAncG9zaXRpb24nICA6ICdyZWxhdGl2ZScsXG4gICdmb250LXNpemUnIDogJzI0cHgnLFxuICAuLi4oZWRpdGluZyA/IHtcbiAgICAnYm9yZGVyLWJvdHRvbSc6ICdub25lJyxcbiAgICAncGFkZGluZycgICAgICA6ICcwJyxcbiAgfSA6IHtcbiAgICAnYm9yZGVyLWJvdHRvbSc6ICcxcHggc29saWQgI2VkZWRlZCcsXG4gIH0pLFxuICAuLi4obGFzdCA/IHsgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSW5zdGVhZCBvZiB1c2luZyBhIDpsYXN0LWNoaWxkIHNlbGVjdG9yLFxuICAgICdib3JkZXItYm90dG9tJzogJ25vbmUnLCAgICAgICAgICAgICAgLy8gdGhlIGVsZW1lbnQgc2VsZWN0cyB0aGUgc3R5bGVcbiAgfSA6IHt9KSxcbn0pO1xuXG5leHBvcnQgY29uc3QgZm9udFNtb290aGluZ1N0eWxlID0gKCkgPT4gKHtcbiAgJy13ZWJraXQtZm9udC1zbW9vdGhpbmcnOiAnYW50aWFsaWFzZWQnLFxuICAnLW1vei1mb250LXNtb290aGluZycgICA6ICdhbnRpYWxpYXNlZCcsXG4gICdmb250LXNtb290aGluZycgICAgICAgIDogJ2FudGlhbGlhc2VkJyxcbn0pO1xuXG5leHBvcnQgY29uc3QgdG9kb0lucHV0U3R5bGUgPSAoZWRpdGluZykgPT4gKHtcbiAgJ3Bvc2l0aW9uJyAgIDogJ3JlbGF0aXZlJyxcbiAgJ21hcmdpbicgICAgIDogJzAnLFxuICAnd2lkdGgnICAgICAgOiAnMTAwJScsXG4gICdmb250LXNpemUnICA6ICcyNHB4JyxcbiAgJ2ZvbnQtZmFtaWx5JzogJ2luaGVyaXQnLFxuICAnZm9udC13ZWlnaHQnOiAnaW5oZXJpdCcsXG4gICdsaW5lLWhlaWdodCc6ICcxLjRlbScsXG4gICdib3JkZXInICAgICA6ICcwJyxcbiAgJ291dGxpbmUnICAgIDogJ25vbmUnLFxuICAnY29sb3InICAgICAgOiAnaW5oZXJpdCcsXG4gICdwYWRkaW5nJyAgICA6ICc2cHgnLFxuICAnYm9yZGVyJyAgICAgOiAnMXB4IHNvbGlkICM5OTknLFxuICAnYm94LXNoYWRvdycgOiAnaW5zZXQgMCAtMXB4IDVweCAwIHJnYmEoMCwgMCwgMCwgMC4yKScsXG4gICdib3gtc2l6aW5nJyA6ICdib3JkZXItYm94JyxcbiAgLi4uZm9udFNtb290aGluZ1N0eWxlLFxuICAuLi4oZWRpdGluZyA/IHtcbiAgICAnZGlzcGxheSc6ICdibG9jaycsXG4gICAgJ3dpZHRoJyAgOiAnNTA2cHgnLFxuICAgICdwYWRkaW5nJzogJzEzcHggMTdweCAxMnB4IDE3cHgnLFxuICAgICdtYXJnaW4nIDogJzAgMCAwIDQzcHgnLFxuICB9IDoge1xuICAgICdkaXNwbGF5JzogJ25vbmUnLFxuICB9KVxufSk7IiwiaW1wb3J0IHtidXR0b24sIGRpdiwgaW5wdXQsIGxhYmVsLCBsaX0gZnJvbSAnQGN5Y2xlL2RvbSc7XG5pbXBvcnQge3RvZG9MaVN0eWxlLCB0b2RvSW5wdXRTdHlsZSwgdmlld1N0eWxlfSBmcm9tICcuL3N0eWxlcyc7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIHZpZXcoc3RhdGUkKSB7XG4gIHJldHVybiBzdGF0ZSQubWFwKCh7dGl0bGUsIGNvbXBsZXRlZCwgZWRpdGluZywgbGFzdH0pID0+XG4gICAgbGkoJy50b2RvUm9vdCcsIHtjc3M6IHRvZG9MaVN0eWxlKGVkaXRpbmcsIGxhc3QpLCBjbGFzczoge2NvbXBsZXRlZCwgZWRpdGluZ319LCBbXG4gICAgICBkaXYoJy52aWV3JywgW1xuICAgICAgICBpbnB1dCgnLnRvZ2dsZScsIHtcbiAgICAgICAgICBwcm9wczoge3R5cGU6ICdjaGVja2JveCcsIGNoZWNrZWQ6IGNvbXBsZXRlZH0sXG4gICAgICAgICAgc3R5bGU6IHtjb2xvcjogJ3JlZCd9XG4gICAgICAgIH0pLFxuICAgICAgICBsYWJlbCh0aXRsZSksXG4gICAgICAgIGJ1dHRvbignLmRlc3Ryb3knKVxuICAgICAgXSksXG4gICAgICBpbnB1dCgnLmVkaXQnLCB7XG4gICAgICAgIGNzczogdG9kb0lucHV0U3R5bGUoZWRpdGluZyksXG4gICAgICAgIHByb3BzOiB7dHlwZTogJ3RleHQnfSxcbiAgICAgICAgaG9vazoge1xuICAgICAgICAgIHVwZGF0ZTogKG9sZFZOb2RlLCB7ZWxtfSkgPT4ge1xuICAgICAgICAgICAgZWxtLnZhbHVlID0gdGl0bGU7XG4gICAgICAgICAgICBpZiAoZWRpdGluZykge1xuICAgICAgICAgICAgICBlbG0uZm9jdXMoKTtcbiAgICAgICAgICAgICAgZWxtLnNlbGVjdGlvblN0YXJ0ID0gZWxtLnZhbHVlLmxlbmd0aDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgXSlcbiAgKTtcbn1cbiIsImltcG9ydCB7dWx9IGZyb20gJ0BjeWNsZS9kb20nO1xuaW1wb3J0IHttYWtlQ29sbGVjdGlvbn0gZnJvbSAnY3ljbGUtb25pb25pZnknO1xuaW1wb3J0IFRhc2sgZnJvbSAnLi4vVGFzay9pbmRleCc7XG5cbmV4cG9ydCBjb25zdCBMaXN0ID0gbWFrZUNvbGxlY3Rpb24oe1xuICBpdGVtOiBUYXNrLFxuICBpdGVtS2V5OiBzdGF0ZSA9PiBzdGF0ZS5rZXksXG4gIGl0ZW1TY29wZToga2V5ID0+IGtleSxcbiAgY29sbGVjdFNpbmtzOiBpbnN0YW5jZXMgPT4gKHtcbiAgICBET006IGluc3RhbmNlcy5waWNrQ29tYmluZSgnRE9NJylcbiAgICAgIC5tYXAodm5vZGVzID0+IHVsKCcudG9kby1saXN0Jywgdm5vZGVzKSksXG4gICAgb25pb246IGluc3RhbmNlcy5waWNrTWVyZ2UoJ29uaW9uJyksXG4gIH0pXG59KTtcbiIsImltcG9ydCB4cyBmcm9tICd4c3RyZWFtJztcbmltcG9ydCBpc29sYXRlIGZyb20gJ0BjeWNsZS9pc29sYXRlJztcbmltcG9ydCBpbnRlbnQgZnJvbSAnLi9pbnRlbnQnO1xuaW1wb3J0IG1vZGVsIGZyb20gJy4vbW9kZWwnO1xuaW1wb3J0IHZpZXcgZnJvbSAnLi92aWV3JztcbmltcG9ydCB7TGlzdH0gZnJvbSAnLi9MaXN0JztcblxuZnVuY3Rpb24gb21pdChvYmosIGtleSkge1xuICBsZXQgdG1wID0geyAuLi5vYmogfTtcbiAgZGVsZXRlIHRtcFtrZXldO1xuICByZXR1cm4gdG1wO1xufVxuXG5leHBvcnQgY29uc3QgbGlzdExlbnMgPSB7XG4gIGdldDogKHN0YXRlKSA9PiBzdGF0ZS5saXN0XG4gICAgICAuZmlsdGVyKHN0YXRlLmZpbHRlckZuKVxuICAgICAgLnNsaWNlKDAsIC0xKVxuICAgICAgLmNvbmNhdCh7XG4gICAgICAgICAgLi4uc3RhdGUubGlzdFtzdGF0ZS5saXN0Lmxlbmd0aCAtIDFdLFxuICAgICAgICAgIGxhc3Q6IHRydWVcbiAgICAgIH0pLFxuICBzZXQ6IChzdGF0ZSwgbmV4dEZpbHRlcmVkTGlzdCkgPT4ge1xuICAgIGNvbnN0IHByZXZGaWx0ZXJlZExpc3QgPSBzdGF0ZS5saXN0LmZpbHRlcihzdGF0ZS5maWx0ZXJGbik7XG4gICAgY29uc3QgbmV3TGlzdCA9IHN0YXRlLmxpc3RcbiAgICAgIC5tYXAodGFzayA9PiBuZXh0RmlsdGVyZWRMaXN0LmZpbmQodCA9PiB0LmtleSA9PT0gdGFzay5rZXkpIHx8IHRhc2spXG4gICAgICAuZmlsdGVyKHRhc2sgPT5cbiAgICAgICAgcHJldkZpbHRlcmVkTGlzdC5zb21lKHQgPT4gdC5rZXkgPT09IHRhc2sua2V5KSAmJlxuICAgICAgICBuZXh0RmlsdGVyZWRMaXN0LnNvbWUodCA9PiB0LmtleSA9PT0gdGFzay5rZXkpXG4gICAgICApO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIC4uLnN0YXRlLFxuICAgICAgbGlzdDogbmV3TGlzdFxuICAgICAgICAuc2xpY2UoMCwgLTEpXG4gICAgICAgIC5jb25jYXQob21pdChuZXdMaXN0W25ld0xpc3QubGVuZ3RoIC0gMV0sICdsYXN0JykpXG4gICAgfTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBUYXNrTGlzdChzb3VyY2VzKSB7XG4gIGNvbnN0IHN0YXRlJCA9IHNvdXJjZXMub25pb24uc3RhdGUkO1xuICBjb25zdCBhY3Rpb25zID0gaW50ZW50KHNvdXJjZXMuRE9NLCBzb3VyY2VzLmhpc3RvcnkpO1xuICBjb25zdCBwYXJlbnRSZWR1Y2VyJCA9IG1vZGVsKGFjdGlvbnMpO1xuXG4gIGNvbnN0IGxpc3RTaW5rcyA9IGlzb2xhdGUoTGlzdCwge29uaW9uOiBsaXN0TGVuc30pKHNvdXJjZXMpO1xuICBjb25zdCBsaXN0VkRvbSQgPSBsaXN0U2lua3MuRE9NO1xuICBjb25zdCBsaXN0UmVkdWNlciQgPSBsaXN0U2lua3Mub25pb247XG5cbiAgY29uc3QgdmRvbSQgPSB2aWV3KHN0YXRlJCwgbGlzdFZEb20kKTtcbiAgY29uc3QgcmVkdWNlciQgPSB4cy5tZXJnZShwYXJlbnRSZWR1Y2VyJCwgbGlzdFJlZHVjZXIkKTtcblxuICByZXR1cm4ge1xuICAgIERPTTogdmRvbSQsXG4gICAgb25pb246IHJlZHVjZXIkLFxuICB9O1xufVxuIiwiaW1wb3J0IHhzIGZyb20gJ3hzdHJlYW0nO1xuaW1wb3J0IGRyb3BSZXBlYXRzIGZyb20gJ3hzdHJlYW0vZXh0cmEvZHJvcFJlcGVhdHMnO1xuaW1wb3J0IHtFTlRFUl9LRVksIEVTQ19LRVl9IGZyb20gJy4uLy4uL3V0aWxzJztcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gaW50ZW50KGRvbVNvdXJjZSwgaGlzdG9yeVNvdXJjZSkge1xuICByZXR1cm4ge1xuICAgIGNoYW5nZVJvdXRlJDogaGlzdG9yeVNvdXJjZVxuICAgICAgLm1hcChsb2NhdGlvbiA9PiBsb2NhdGlvbi5wYXRobmFtZSlcbiAgICAgIC5jb21wb3NlKGRyb3BSZXBlYXRzKCkpLFxuXG4gICAgdXBkYXRlSW5wdXRWYWx1ZSQ6IGRvbVNvdXJjZVxuICAgICAgLnNlbGVjdCgnLm5ldy10b2RvJykuZXZlbnRzKCdpbnB1dCcpXG4gICAgICAubWFwKGV2ID0+IGV2LnRhcmdldC52YWx1ZSksXG5cbiAgICBjYW5jZWxJbnB1dCQ6IGRvbVNvdXJjZVxuICAgICAgLnNlbGVjdCgnLm5ldy10b2RvJykuZXZlbnRzKCdrZXlkb3duJylcbiAgICAgIC5maWx0ZXIoZXYgPT4gZXYua2V5Q29kZSA9PT0gRVNDX0tFWSksXG5cbiAgICBpbnNlcnRUb2RvJDogZG9tU291cmNlXG4gICAgICAuc2VsZWN0KCcubmV3LXRvZG8nKS5ldmVudHMoJ2tleWRvd24nKVxuICAgICAgLmZpbHRlcihldiA9PiB7XG4gICAgICAgIGNvbnN0IHRyaW1tZWRWYWwgPSBTdHJpbmcoZXYudGFyZ2V0LnZhbHVlKS50cmltKCk7XG4gICAgICAgIHJldHVybiBldi5rZXlDb2RlID09PSBFTlRFUl9LRVkgJiYgdHJpbW1lZFZhbDtcbiAgICAgIH0pXG4gICAgICAubWFwKGV2ID0+IFN0cmluZyhldi50YXJnZXQudmFsdWUpLnRyaW0oKSksXG5cbiAgICB0b2dnbGVBbGwkOiBkb21Tb3VyY2VcbiAgICAgIC5zZWxlY3QoJy50b2dnbGUtYWxsJykuZXZlbnRzKCdjbGljaycpXG4gICAgICAubWFwKGV2ID0+IGV2LnRhcmdldC5jaGVja2VkKSxcblxuICAgIGRlbGV0ZUNvbXBsZXRlZCQ6IGRvbVNvdXJjZVxuICAgICAgLnNlbGVjdCgnLmNsZWFyLWNvbXBsZXRlZCcpLmV2ZW50cygnY2xpY2snKVxuICAgICAgLm1hcFRvKG51bGwpLFxuICB9O1xufTtcbiIsImltcG9ydCB4cyBmcm9tICd4c3RyZWFtJztcblxuZnVuY3Rpb24gZ2V0RmlsdGVyRm4ocm91dGUpIHtcbiAgc3dpdGNoIChyb3V0ZSkge1xuICAgIGNhc2UgJy9hY3RpdmUnOiByZXR1cm4gKHRhc2sgPT4gdGFzay5jb21wbGV0ZWQgPT09IGZhbHNlKTtcbiAgICBjYXNlICcvY29tcGxldGVkJzogcmV0dXJuICh0YXNrID0+IHRhc2suY29tcGxldGVkID09PSB0cnVlKTtcbiAgICBkZWZhdWx0OiByZXR1cm4gKCkgPT4gdHJ1ZTsgLy8gYWxsb3cgYW55dGhpbmdcbiAgfVxufVxuXG5sZXQgdXVpZCA9IERhdGUubm93KCk7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIG1vZGVsKGFjdGlvbnMpIHtcbiAgY29uc3QgaW5pdGlhbFJlZHVjZXIkID0geHMub2YoZnVuY3Rpb24gaW5pdGlhbFJlZHVjZXIocHJldlN0YXRlKSB7XG4gICAgaWYgKHByZXZTdGF0ZSkge1xuICAgICAgcmV0dXJuIHByZXZTdGF0ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgaW5wdXRWYWx1ZTogJycsXG4gICAgICAgIGxpc3Q6IFtdLFxuICAgICAgICBmaWx0ZXI6ICcnLFxuICAgICAgICBmaWx0ZXJGbjogKCkgPT4gdHJ1ZSwgLy8gYWxsb3cgYW55dGhpbmdcbiAgICAgIH07XG4gICAgfVxuICB9KTtcblxuICBjb25zdCBjaGFuZ2VSb3V0ZVJlZHVjZXIkID0gYWN0aW9ucy5jaGFuZ2VSb3V0ZSRcbiAgICAuc3RhcnRXaXRoKCcvJylcbiAgICAubWFwKHBhdGggPT4ge1xuICAgICAgY29uc3QgZmlsdGVyRm4gPSBnZXRGaWx0ZXJGbihwYXRoKTtcbiAgICAgIHJldHVybiBmdW5jdGlvbiBjaGFuZ2VSb3V0ZVJlZHVjZXIocHJldlN0YXRlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgLi4ucHJldlN0YXRlLFxuICAgICAgICAgIGZpbHRlcjogcGF0aC5yZXBsYWNlKCcvJywgJycpLnRyaW0oKSxcbiAgICAgICAgICBmaWx0ZXJGbjogZmlsdGVyRm4sXG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfSk7XG5cbiAgY29uc3QgdXBkYXRlSW5wdXRWYWx1ZVJlZHVjZXIkID0gYWN0aW9ucy51cGRhdGVJbnB1dFZhbHVlJFxuICAgIC5tYXAoaW5wdXRWYWx1ZSA9PiBmdW5jdGlvbiB1cGRhdGVJbnB1dFZhbHVlKHByZXZTdGF0ZSkge1xuICAgICAgcmV0dXJuIHsuLi5wcmV2U3RhdGUsIGlucHV0VmFsdWU6IGlucHV0VmFsdWV9O1xuICAgIH0pO1xuXG4gIGNvbnN0IGNsZWFySW5wdXRSZWR1Y2VyJCA9IHhzLm1lcmdlKGFjdGlvbnMuY2FuY2VsSW5wdXQkLCBhY3Rpb25zLmluc2VydFRvZG8kKVxuICAgIC5tYXBUbyhmdW5jdGlvbiBjbGVhcklucHV0UmVkdWNlcihwcmV2U3RhdGUpIHtcbiAgICAgIHJldHVybiB7Li4ucHJldlN0YXRlLCBpbnB1dFZhbHVlOiAnJ307XG4gICAgfSk7XG5cbiAgY29uc3QgaW5zZXJ0VG9kb1JlZHVjZXIkID0gYWN0aW9ucy5pbnNlcnRUb2RvJFxuICAgIC5tYXAoY29udGVudCA9PiBmdW5jdGlvbiBpbnNlcnRUb2RvUmVkdWNlcihwcmV2U3RhdGUpIHtcbiAgICAgIGNvbnN0IG5ld1RvZG8gPSB7XG4gICAgICAgIGtleTogdXVpZCsrLFxuICAgICAgICB0aXRsZTogY29udGVudCxcbiAgICAgICAgY29tcGxldGVkOiBmYWxzZSxcbiAgICAgICAgZWRpdGluZzogZmFsc2UsXG4gICAgICB9O1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgLi4ucHJldlN0YXRlLFxuICAgICAgICBsaXN0OiBwcmV2U3RhdGUubGlzdC5jb25jYXQobmV3VG9kbyksXG4gICAgICB9XG4gICAgfSk7XG5cbiAgY29uc3QgdG9nZ2xlQWxsUmVkdWNlciQgPSBhY3Rpb25zLnRvZ2dsZUFsbCRcbiAgICAubWFwKGlzVG9nZ2xlZCA9PiBmdW5jdGlvbiB0b2dnbGVBbGxSZWR1Y2VyKHByZXZTdGF0ZSkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgLi4ucHJldlN0YXRlLFxuICAgICAgICBsaXN0OiBwcmV2U3RhdGUubGlzdC5tYXAodGFzayA9PlxuICAgICAgICAgICh7Li4udGFzaywgY29tcGxldGVkOiBpc1RvZ2dsZWR9KVxuICAgICAgICApLFxuICAgICAgfVxuICAgIH0pO1xuXG4gIGNvbnN0IGRlbGV0ZUNvbXBsZXRlZFJlZHVjZXIkID0gYWN0aW9ucy5kZWxldGVDb21wbGV0ZWQkXG4gICAgLm1hcFRvKGZ1bmN0aW9uIGRlbGV0ZUNvbXBsZXRlZHNSZWR1Y2VyKHByZXZTdGF0ZSkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgLi4ucHJldlN0YXRlLFxuICAgICAgICBsaXN0OiBwcmV2U3RhdGUubGlzdC5maWx0ZXIodGFzayA9PiB0YXNrLmNvbXBsZXRlZCA9PT0gZmFsc2UpLFxuICAgICAgfTtcbiAgICB9KTtcblxuICByZXR1cm4geHMubWVyZ2UoXG4gICAgaW5pdGlhbFJlZHVjZXIkLFxuICAgIHVwZGF0ZUlucHV0VmFsdWVSZWR1Y2VyJCxcbiAgICBjaGFuZ2VSb3V0ZVJlZHVjZXIkLFxuICAgIGNsZWFySW5wdXRSZWR1Y2VyJCxcbiAgICBpbnNlcnRUb2RvUmVkdWNlciQsXG4gICAgdG9nZ2xlQWxsUmVkdWNlciQsXG4gICAgZGVsZXRlQ29tcGxldGVkUmVkdWNlciRcbiAgKTtcbn1cbiIsImV4cG9ydCBjb25zdCB0b2RvTGlzdFN0eWxlID0gKCkgPT4gKHtcbiAgJ21hcmdpbicgICAgOiAnMCcsXG4gICdwYWRkaW5nJyAgIDogJzAnLFxuICAnbGlzdC1zdHlsZSc6ICdub25lJyxcbn0pO1xuXG5leHBvcnQgY29uc3QgZm9vdGVyU3R5bGUgPSAobGlzdExlbmd0aCkgPT4gKHtcbiAgJ2Rpc3BsYXknICAgOiBsaXN0TGVuZ3RoID8gJycgOiAnbm9uZScsXG4gICdjb2xvcicgICAgIDogJyM3NzcnLFxuICAncGFkZGluZycgICA6ICcxMHB4IDE1cHgnLFxuICAnaGVpZ2h0JyAgICA6ICcyMHB4JyxcbiAgJ3RleHQtYWxpZ24nOiAnY2VudGVyJyxcbiAgJ2JvcmRlci10b3AnOiAnMXB4IHNvbGlkICNlNmU2ZTYnLFxuICAnJG5lc3QnOiB7XG4gICAgJyY6YmVmb3JlJzoge1xuICAgICAgJ2NvbnRlbnQnICAgOiAnXCJcIicsXG4gICAgICAncG9zaXRpb24nICA6ICdhYnNvbHV0ZScsXG4gICAgICAncmlnaHQnICAgICA6ICcwJyxcbiAgICAgICdib3R0b20nICAgIDogJzAnLFxuICAgICAgJ2xlZnQnICAgICAgOiAnMCcsXG4gICAgICAnaGVpZ2h0JyAgICA6ICc1MHB4JyxcbiAgICAgICdvdmVyZmxvdycgIDogJ2hpZGRlbicsXG4gICAgICAnYm94LXNoYWRvdyc6IGAwIDFweCAxcHggcmdiYSgwLCAwLCAwLCAwLjIpLFxuICAgICAgICAgICAgICAgICAgICAgMCA4cHggMCAtM3B4ICNmNmY2ZjYsXG4gICAgICAgICAgICAgICAgICAgICAwIDlweCAxcHggLTNweCByZ2JhKDAsIDAsIDAsIDAuMiksXG4gICAgICAgICAgICAgICAgICAgICAwIDE2cHggMCAtNnB4ICNmNmY2ZjYsXG4gICAgICAgICAgICAgICAgICAgICAwIDE3cHggMnB4IC02cHggcmdiYSgwLCAwLCAwLCAwLjIpYCxcbiAgICB9XG4gIH1cbn0pO1xuIiwiaW1wb3J0IHhzIGZyb20gJ3hzdHJlYW0nO1xuaW1wb3J0IHtcbiAgYSwgYnV0dG9uLCBkaXYsIGZvb3RlciwgaDEsIGhlYWRlciwgaW5wdXQsIGxpLCBzZWN0aW9uLCBzcGFuLCBzdHJvbmcsIHVsXG59IGZyb20gJ0BjeWNsZS9kb20nO1xuaW1wb3J0IHt0b2RvTGlzdFN0eWxlLCBmb290ZXJTdHlsZX0gZnJvbSAnLi9zdHlsZXMnO1xuXG5mdW5jdGlvbiByZW5kZXJIZWFkZXIoc3RhdGUpIHtcbiAgcmV0dXJuIGhlYWRlcignLmhlYWRlcicsIFtcbiAgICBoMSgndG9kb3MnKSxcbiAgICBpbnB1dCgnLm5ldy10b2RvJywge1xuICAgICAgcHJvcHM6IHtcbiAgICAgICAgdHlwZTogJ3RleHQnLFxuICAgICAgICBwbGFjZWhvbGRlcjogJ1doYXQgbmVlZHMgdG8gYmUgZG9uZT8nLFxuICAgICAgICBhdXRvZm9jdXM6IHRydWUsXG4gICAgICAgIG5hbWU6ICduZXdUb2RvJyxcbiAgICAgICAgdmFsdWU6IHN0YXRlLmlucHV0VmFsdWVcbiAgICAgIH1cbiAgICB9KVxuICBdKTtcbn1cblxuZnVuY3Rpb24gcmVuZGVyTWFpblNlY3Rpb24oc3RhdGUsIGxpc3RWRG9tKSB7XG4gIGNvbnN0IGFsbENvbXBsZXRlZCA9IHN0YXRlLmxpc3QucmVkdWNlKCh4LCB5KSA9PiB4ICYmIHkuY29tcGxldGVkLCB0cnVlKTtcbiAgY29uc3Qgc2VjdGlvblN0eWxlID0geydkaXNwbGF5Jzogc3RhdGUubGlzdC5sZW5ndGggPyAnJyA6ICdub25lJ307XG5cbiAgcmV0dXJuIHNlY3Rpb24oJy5tYWluJywge3N0eWxlOiBzZWN0aW9uU3R5bGV9LCBbXG4gICAgaW5wdXQoJy50b2dnbGUtYWxsJywge1xuICAgICAgcHJvcHM6IHt0eXBlOiAnY2hlY2tib3gnLCBjaGVja2VkOiBhbGxDb21wbGV0ZWR9LFxuICAgIH0pLFxuICAgIGxpc3RWRG9tXG4gIF0pO1xufVxuXG5mdW5jdGlvbiByZW5kZXJGaWx0ZXJCdXR0b24oc3RhdGUsIGZpbHRlclRhZywgcGF0aCwgbGFiZWwpIHtcbiAgcmV0dXJuIGxpKFtcbiAgICBhKHtcbiAgICAgIGF0dHJzOiB7aHJlZjogcGF0aH0sXG4gICAgICBjbGFzczoge3NlbGVjdGVkOiBzdGF0ZS5maWx0ZXIgPT09IGZpbHRlclRhZ31cbiAgICB9LCBsYWJlbClcbiAgXSk7XG59XG5cbmZ1bmN0aW9uIHJlbmRlckZvb3RlcihzdGF0ZSkge1xuICBjb25zdCBhbW91bnRDb21wbGV0ZWQgPSBzdGF0ZS5saXN0XG4gICAgLmZpbHRlcih0YXNrID0+IHRhc2suY29tcGxldGVkKVxuICAgIC5sZW5ndGg7XG4gIGNvbnN0IGFtb3VudEFjdGl2ZSA9IHN0YXRlLmxpc3QubGVuZ3RoIC0gYW1vdW50Q29tcGxldGVkO1xuXG4gIHJldHVybiBmb290ZXIoJy5mb290ZXInLCB7Y3NzOiBmb290ZXJTdHlsZShzdGF0ZS5saXN0Lmxlbmd0aCl9LCBbXG4gICAgc3BhbignLnRvZG8tY291bnQnLCBbXG4gICAgICBzdHJvbmcoU3RyaW5nKGFtb3VudEFjdGl2ZSkpLFxuICAgICAgJyBpdGVtJyArIChhbW91bnRBY3RpdmUgIT09IDEgPyAncycgOiAnJykgKyAnIGxlZnQnXG4gICAgXSksXG4gICAgdWwoJy5maWx0ZXJzJywgW1xuICAgICAgcmVuZGVyRmlsdGVyQnV0dG9uKHN0YXRlLCAnJywgJy8nLCAnQWxsJyksXG4gICAgICByZW5kZXJGaWx0ZXJCdXR0b24oc3RhdGUsICdhY3RpdmUnLCAnL2FjdGl2ZScsICdBY3RpdmUnKSxcbiAgICAgIHJlbmRlckZpbHRlckJ1dHRvbihzdGF0ZSwgJ2NvbXBsZXRlZCcsICcvY29tcGxldGVkJywgJ0NvbXBsZXRlZCcpLFxuICAgIF0pLFxuICAgIChhbW91bnRDb21wbGV0ZWQgPiAwID9cbiAgICAgIGJ1dHRvbignLmNsZWFyLWNvbXBsZXRlZCcsICdDbGVhciBjb21wbGV0ZWQgKCcgKyBhbW91bnRDb21wbGV0ZWQgKyAnKScpXG4gICAgICA6IG51bGxcbiAgICApXG4gIF0pO1xufVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiB2aWV3KHN0YXRlJCwgbGlzdFZEb20kKSB7XG4gIHJldHVybiB4cy5jb21iaW5lKHN0YXRlJCwgbGlzdFZEb20kKS5tYXAoKFtzdGF0ZSwgbGlzdFZEb21dKSA9PlxuICAgIGRpdihbXG4gICAgICByZW5kZXJIZWFkZXIoc3RhdGUpLFxuICAgICAgcmVuZGVyTWFpblNlY3Rpb24oc3RhdGUsIGxpc3RWRG9tKSxcbiAgICAgIHJlbmRlckZvb3RlcihzdGF0ZSlcbiAgICBdKVxuICApO1xufTtcbiIsImNvbnN0IEVOVEVSX0tFWSA9IDEzO1xuY29uc3QgRVNDX0tFWSA9IDI3O1xuXG5leHBvcnQge0VOVEVSX0tFWSwgRVNDX0tFWX07XG4iXX0=
