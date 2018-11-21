'use strict'

const STATE = {
  PENDING: Symbol('pending'),
  RESOLVED: Symbol('resolved'),
  REJECTED: Symbol('rejected')
}

const isFunction = obj => typeof obj === 'function'
const isObject = obj => Object.prototype.toString.call(obj) === '[object Object]'
const isThenable = obj => (isObject(obj) || isFunction(obj)) && 'then' in obj
const isPromiseee = obj => obj instanceof Promiseee
const asyncFun = func => { setTimeout(func, 0) }

class Promiseee {
  constructor(executor) {
    let self = this
    self.state = STATE.PENDING
    self.value = undefined
    self.onResolvedCallback = []
    self.onRejectedCallback = []

    /**
    * Change the state of the promiseee to 'resolved'
    * @param val the value of the promiseee when it is 'resolved'
    * it can be any legal JavaScript value (including undefined, a thenable, or a promiseee)
    */
    function resolve(val) {
      if (val instanceof Promiseee) {
        return val.then(resolve, reject)
      }
      if (self.state === STATE.PENDING) {
        asyncFun(() => {
          self.state = STATE.RESOLVED
          self.value = val
          for (let cb of self.onResolvedCallback) {
            cb(val)
          }
        })
      }
    }

    /**
    * Change the state of the promiseee to 'rejected'
    * @param reason the reason of the promiseee when it is 'rejected'
    */
    function reject(reason) {
      if (self.state === STATE.PENDING) {
        asyncFun(() => {
          self.state = STATE.REJECTED
          self.data = reason
          for (let cb of self.onRejectedCallback) {
            cb(reason)
          }
        })
      }
    }

    try {
      executor(resolve, reject)
    } catch (error) {
      reject(error)
    }
  }
}

/**
 * register the callback for promiseee
 * @param onResolved the resolved callback for promiseee
 * @param onRejected the rejected callback for the promiseee
 * @return a new promiseee should be returned
 */
Promiseee.prototype.then = function(onResolved, onRejected) {
  onResolved = isFunction(onResolved) ? onResolved : (val) => val
  onRejected = isFunction(onRejected) ? onRejected : (reason) => { throw reason }

  const promiseee2 = new Promiseee((resolve, reject) => {
    if (this.state === STATE.RESOLVED) {
      asyncFun(() => {
        try {
          const x = onResolved(this.value)
          resolvePromiseee(promiseee2, x, resolve, reject)
        } catch (error) {
          reject(error)
        }
      })
      return
    }
    if (this.state === STATE.REJECTED) {
      asyncFun(() => {
        try {
          const x = onRejected(this.value)
          resolvePromiseee(promiseee2, x, resolve, reject)
        } catch (error) {
          reject(error)
        }
      })
      return
    }
    if (this.state === STATE.PENDING) {
      this.onResolvedCallback.push((value) => {
        asyncFun(() => {
          try {
            const x = onResolved(value)
            resolvePromiseee(promiseee2, x, resolve, reject)
          } catch (error) {
            reject(error)
          }
        })
      })

      this.onRejectedCallback.push((reason) => {
        asyncFun(() => {
          try {
            const x = onRejected(reason)
            resolvePromiseee(promiseee2, x, resolve, reject)
          } catch (error) {
            reject(error)
          }
        })
      })
    }
  })
  return promiseee2
}

Promiseee.prototype.catch = function(onRejected) {
  return this.then(null, onRejected)
}

/**
 * using the value of the x to decide the state and value of the promiseee2
 * @param promiseee2
 * @param x the return value of the onResolved or on onRejected
 * @param resolve comes from the rsolve function of the promiseee2
 * @param reject comes from the reject function of the the promiseee2
 */
function resolvePromiseee(promiseee2, x, resolve, reject) {
  if (promiseee2 === x) return reject(new TypeError())

  if (isPromiseee(x)) {
    x.then(resolve, reject)
    return
  }

  if (isThenable(x)) {
    let called = false
    const then = x.then
    if (isFunction(then)) {
      try {
        then.call(x,
          (y) => {
            if (called) return
            called = true
            resolvePromiseee(promiseee2, y, resolve, reject)
          },
          (r) => {
            if (called) return
            called = true
            reject(r)
          })
      } catch (error) {
        if (called) return
        called = true
        return reject(error)
      }
    }
  }
  resolve(x)
}

module.exports.deferred = () => {
  let dfd = {}
  dfd.promise = new Promiseee(function(resolve, reject) {
    dfd.resolve = resolve
    dfd.reject = reject
  })
  return dfd
}
