import { Map } from 'immutable'
import { createStore, applyMiddleware, compose, } from 'redux'
import createSagaMiddleware from 'redux-saga'
import { createLogger } from 'redux-logger'

const createStoreWithMiddleware = (rootReducer) => {
  const middlewareBeforeEmitter = () => next => action => {
    const beforeAction = {
      ...action,
      type: `BEFORE_${action.type}`
    }
    next(beforeAction) // 'beforeEmitter' emit a 'before-action' for every action
    return next(action)
  }

  const middlewareSaga = createSagaMiddleware()

  const middlewares = [
    middlewareBeforeEmitter,
    middlewareSaga,
  ]

  let enhancers = undefined
  const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose

  if (__DEV__ === true) {
    const middlewareLogger = createLogger({
      level: ({ error = false }) => error ? `error` : `log`,
      stateTransformer: state => state.toJS(),
      actionTransformer: ({ payload, ...action }) => ({
        ...action,
        ...payload,
      }),
      predicate: (getState, action) => __DEV__,
      collapsed: true,
      duration: true,
    })

    middlewares.push(middlewareLogger)
    enhancers = composeEnhancers(
      applyMiddleware(...middlewares),
      window.devToolsExtension ? window.devToolsExtension() : f => f
    )

  } else {
    enhancers = composeEnhancers(applyMiddleware(...middlewares))
  }

  return {
    createStore: () => {
      return createStore(rootReducer, Map({}), enhancers)
    },
    runSaga: (...args) => middlewareSaga.run(...args),
  }
}

export default createStoreWithMiddleware
