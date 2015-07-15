import utils from './utils.js'
import { Promise } from './events.js'

var noop = utils.noop

var min = {}
export default min

/**
 * Set the field in the hash on the key with the value
 * @param  {String}   key      Hash key
 * @param  {String}   field    field to set
 * @param  {Mix}   value       value
 * @param  {Function} callback Callback
 * @return {Promise}           promise object
 */
min.hset = function(key, field, value, callback = noop) {
  var promise = new Promise()

  // check the key status
  this.exists(key, (err, exists) => {
    if (err) {
      promise.reject(err)
      return callback(err)
    }

    if (exists) {
      // fetch the value
      this.get(key, (err, body) => {
        if (err) {
          promise.reject(err)
          return callback(err)
        }

        // update the hash
        body[field] = value

        this.set(key, body, err => {
          if (err) {
            promise.reject(err)
            return callback(err)
          }

          promise.resolve(key, field, value)
          callback(null, key, field, value)
        })
      })
    } else {
      // create a hash
      var body = {}

      body[field] = value

      this.set(key, body, err => {
        if (err) {
          reject(err)
          return callback(err)
        }

        this._keys[key] = 1

        promise.resolve([key, field, value])
        callback(null, key, field, value)
      })
    }

  })
  promise.then(_ => {
    this.emit('hset', key, field, value)
  })


  return promise
}

/**
 * Set the value of a hash field, only if the field does not exist
 * @param  {String}   key      key
 * @param  {String}   field    hash field
 * @param  {Mix}   value       value
 * @param  {Function} callback Callback
 * @return {Promise}            promise
 */
min.hsetnx = function(key, field, value, callback = noop) {
  var promise = new Promise()

  this.hexists(key, field, (err, exists) => {
    if (err) {
      promise.reject(err)
      return callback(err)
    }

    if (!exists) {
      this.hset(key, field, value, (err) => {
        if (err) {
          reject(err)
          callback(err)
        }

        promise.resolve('OK')
        callback(null, 'OK')
      })
    } else {
      var err = new Error('The field of the hash is exists')

      promise.reject(err)
      return callback(err)
    }
  })

  return promise
}

/**
 * Set multiple hash fields to multiple values
 * @param  {String}   key      key
 * @param  {Object}   docs     values
 * @param  {Function} callback Callback
 * @return {Promise}           promise
 */
min.hmset = function(key, docs, callback = noop) {
  var promise = new Promise()

  var keys = Object.keys(docs)

  var multi = this.multi()

  keys.forEach((field) => {
    multi.hset(key, field, docs[field])
  })

  multi.exec((err, replies) => {
    callback(null, replies)
    promise.resolve(replies)
  })

  return promise
}

/**
 * Get the value of a hash field
 * @param  {String}   key      key
 * @param  {String}   field    hash field
 * @param  {Function} callback Callback
 * @return {Promise}           promise
 */
min.hget = function(key, field, callback = noop) {
  var promise = new Promise()

  this.hexists(key, field, (err, exists) => {
    if (err) {
      promise.reject(err)
      return callback(err)
    }

    if (exists) {
      this.get(key)
        .then(
          value => {
            var data = value[field]
            promise.resolve(data)
            callback(null, data)
          },
          err => {
            promise.reject(err)
            callback(err)
          }
        )
    } else {
      var err = new Error('no such field')

      promise.reject(err)
      callback(err)
    }
  })

  return promise
}

/**
 * Get the values of all the given hash fields
 * @param  {String}   key      key
 * @param  {Array}   fields    hash fields
 * @param  {Function} callback Callback
 * @return {Promise}           promise
 */
min.hmget = function(key, fields, callback = noop) {
  var promise = new Promise()

  var values = []

  var multi = this.multi()

  fields.forEach(field => {
    multi.hget(key, field)
  })

  multi.exec((err, replies) => {
    if (err) {
      callback(err)
      return promise.reject(err)
    }

    values = replies.map(row => {
      return row[0]
    })

    promise.resolve(values)
    callback(null, values)
  })

  return promise
}

/**
 * Get all the fields and values in a hash
 * @param  {String}   key      key
 * @param  {Function} callback Callback
 * @return {Promise}           promise
 */
min.hgetall = function(key, callback = noop) {
  var promise = new Promise()

  this.exists(key, (err, exists) => {
    if (err) {
      callback(err)
      return promise.reject(err)
    }

    if (exists) {
      this.get(key)
        .then(data => {
          promise.resolve(data)
          callback(null, data)
        })
        .catch(err => {
          promise.reject(err)
          callback(err)
        })
    } else {
      var err = new Error('no such key')

      callback(err)
      return promise.reject(err)
    }
  })

  return promise
}

/**
 * Delete one hash field
 * @param  {String}   key      key
 * @param  {String}   field    hash field
 * @param  {Function} callback Callback
 * @return {Promise}           promise
 */
min.hdel = function(key, field, callback = noop) {
  var promise = new Promise()

  promise.then(([key, field, value]) => {
    this.emit('hdel', key, field, value)
  })

  this.hexists(key. field, (err, exists) => {
    if (err) {
      callback(err)
      return promise.reject(err)
    }

    if (exists) {
      this.get(key)
        .then(
          data => {
            var removed = data[field]
            delete data[field]

            this.set(key, data)
              .then(
                _ => {
                  promise.resolve([key, field, removed])
                  callback(null, key, field, removed)
                },
                err => {
                  promise.reject(err)
                  callback(err)
                }
              )
          },
          err => {
            callback(err)
          }
        )
    } else {
      var err = new Error('no such key')

      callback(err)
      return promise.reject(err)
    }
  })

  return promise
}

/**
 * Get the number of fields in a hash
 * @param  {String}   key      key
 * @param  {Function} callback Callback
 * @return {Promise}           promise
 */
min.hlen = function(key, callback = noop) {
  var promise = new Promise()

  this.exists(key, (err, exists) => {
    if (err) {
      promise.reject(err)
      return callback(err)
    }

    if (exists) {
      this.get(key)
        .then(
          data => {
            var length = Object.keys(data).length

            promise.resolve(length)
            callback(null, length)
          },
          err => {
            promise.reject(err)
            callback(err)
          }
        )
    } else {
      promise.resolve(0)
      callback(null, 0)
    }
  })

  return promise
}

/**
 * Get all the fields in a hash
 * @param  {String}   key      key
 * @param  {Function} callback Callback
 * @return {Promise}           promise
 */
min.hkeys = function(key, callback = noop) {
  var promise = new Promise()

  this.exists(key, (err, exists) => {
    if (err) {
      promise.reject(err)
      return callback(err)
    }

    if (exists) {
      this.get(key)
        .then(
          data => {
            var keys = Object.keys(data)

            promise.resolve(keys)
            callback(null, keys)
          },
          err => {
            promise.reject(err)
            callback(err)
          }
        )
    } else {
      promise.resolve(0)
      callback(null, 0)
    }
  })

  return promise
}

/**
 * Determine if a hash field exists
 * @param  {String}   key      key of the hash
 * @param  {String}   field    the field
 * @param  {Function} callback Callback
 * @return {Promise}           promise object
 */
min.hexists = function(key, field, callback = noop) {
  var promise = new Promise()

  this.exists(key)
    .then(exists => {
      if (exists) {
        return this.get(key)
      } else {
        promise.resolve(false)
        callback(null, false)
      }
    })
    .then(value => {
      if (value.hasOwnProperty(field)) {
        promise.resolve(true)
        callback(null, true)
      } else {
        promise.resolve(false)
        callback(null, false)
      }
    }, err => {
      promise.reject(err)
      callback(err)
    })

  return promise
}

min.hincr = function(key, field, callback = noop) {
  var promise = new Promise()

  promise.then(curr => {
    this.emit('hincr', key, field, curr)
  })

  this.hexists(key, field)
    .then(exists => {
      if (exists) {
        return this.hget(exists)
      } else {
        var p = new Promise()

        p.resolve(0)

        return p
      }
    })
    .then(curr => {
      if (isNaN(parseFloat(curr))) {
        promise.reject('value wrong')
        return callback('value wrong')
      }

      curr = parseFloat(curr)

      return this.hset(key, field, ++curr)
    })
    .then((key, field, value) => {
      promise.resolve(value)
      callback(null, value)
    }, err => {
      promise.reject(err)
      callback(null, err)
    })

  return promise
}

min.hincrby = function(key, field, increment, callback = noop) {
  var promise = new Promise()

  promise.then(curr => {
    this.emit('hincr', key, field, curr)
  })

  this.hexists(key, field)
    .then(exists => {
      if (exists) {
        return this.hget(exists)
      } else {
        var p = new Promise()

        p.resolve(0)

        return p
      }
    })
    .then(curr => {
      if (isNaN(parseFloat(curr))) {
        promise.reject('value wrong')
        return callback('value wrong')
      }

      curr = parseFloat(curr)

      return this.hset(key, field, curr + increment)
    })
    .then((key, field, value) => {
      promise.resolve(value)
      callback(null, value)
    }, err => {
      promise.reject(err)
      callback(null, err)
    })

  return promise
}

min.hincrbyfloat = min.hincrby

min.hdecr = function(key, field, callback = noop) {
  var promise = new Promise()

  promise.then(curr => {
    this.emit('hdecr', key, field, curr)
  })

  this.hexists(key, field)
    .then(exists => {
      if (exists) {
        return this.hget(key, field)
      } else {
        var p = new Promise()

        p.resolve(0)

        return p
      }
    })
    .then(curr => {
      if (isNaN(parseFloat(curr))) {
        promise.reject('value wrong')
        return callback('value wrong')
      }

      curr = parseFloat(curr)

      return this.hset(key, field, --curr)
    })
    .then((key, field, value) => {
      promise.resolve(value)
      callback(null, value)
    }, err => {
      promise.reject(err)
      callback(err)
    })

  return promise
}

min.hdecrby = function(key, field, decrement, callback = noop) {
  var promise = new Promise()

  promise.then(curr => {
    this.emit('hincr', key, field, curr)
  })

  this.hexists(key, field)
    .then(exists => {
      if (exists) {
        return this.hget(exists)
      } else {
        var p = new Promise()

        p.resolve(0)

        return p
      }
    })
    .then(curr => {
      if (isNaN(parseFloat(curr))) {
        promise.reject('value wrong')
        return callback('value wrong')
      }

      curr = parseFloat(curr)

      return this.hset(key, field, curr - decrement)
    })
    .then((key, field, value) => {
      promise.resolve(value)
      callback(null, value)
    }, err => {
      promise.reject(err)
      callback(null, err)
    })

  return promise
}