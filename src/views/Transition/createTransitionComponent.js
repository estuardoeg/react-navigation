// @flow

import React from 'react';
import {
  View,
  UIManager,
  findNodeHandle,
  Animated,
} from 'react-native';

import { TransitionItem } from './TransitionItems';
import TransitionConfigs from '../TransitionConfigs';

const statefulize = Component => {
  class Statefulized extends React.Component {
    render() { return <Component {...this.props} />; }
  }
  return Statefulized;
};

const createAnimatedComponent = Component => {
  const isStatelessComponent = type => type.prototype && !!!type.prototype.render;
  let C = Component;
  if (isStatelessComponent(Component)) {
    C = statefulize(Component);
  }
  return Animated.createAnimatedComponent(C);
};

function findTransitionConfig(transitionConfigs: Array<*>, routeName: string, prevRouteName: string) {
  return transitionConfigs.find(c => c.from === prevRouteName && c.to === routeName);
}

function createTransitionComponent(Component) {
  class TransitionComponent extends React.Component {
    _component: any;
    static contextTypes = {
      registerTransitionView: React.PropTypes.func,
      unregisterTransitionView: React.PropTypes.func,
      transitionProps: React.PropTypes.object,
      transitionConfigs: React.PropTypes.array,
      routeName: React.PropTypes.string,
      prevRouteName: React.PropTypes.string,
    };

    // This is needed to pass the invariant in PointerEventsContainer
    setNativeProps(props) {
      this._component.setNativeProps(props);
    }

    _createAnimatedStyle() {
      const {id} = this.props;
      const {routeName, prevRouteName, transitionProps, transitionConfigs} = this.context;
      const transitionConfig = findTransitionConfig(transitionConfigs, routeName, prevRouteName);
      const transition = transitionConfig && transitionConfig.transition;
      const appliesToMe = transition && (!!!transition.filter || transition.filter(id));
      if (transition && appliesToMe) {
        return (transition.shouldClone && transition.shouldClone(id, routeName)
          ? this._hideTransitionViewUntilDone(transitionProps)
          : transition.createAnimatedStyle(id, routeName, transitionProps)
        );
      } else {
        // TODO this default should be set somewhere else
        return {};//TransitionConfigs.defaultTransitionConfig(transitionProps).screenInterpolator(transitionProps));
      }
    }

    render() {
      // collapsable={false} is required for UIManager.measureInWindow to get the actual measurements
      // instead of undefined, see https://github.com/facebook/react-native/issues/9382
      /*return (
        <View collapsable={false}
          ref={c => this._component = c} style={{ flex: 1 }}>
          {this._getAnimatedChild()}
        </View>
      )*/
      const {id, ...rest} = this.props;
      const AnimatedComponent = createAnimatedComponent(Component);
      const animatedStyle = this._createAnimatedStyle();
      return (
        <AnimatedComponent {...rest}
          ref={c => this._component = c}
          collapsable={false}
          style={[this.props.style, animatedStyle]}
        />
      );
    }

    componentDidMount() {
      const { registerTransitionView } = this.context;
      if (!registerTransitionView) return;

      const nativeHandle = findNodeHandle(this._component);
      registerTransitionView(new TransitionItem
        (
        this.props.id,
        this.context.routeName,
        this.render(),
        nativeHandle,
      ));
    }

    componentWillUnmount() {
      const { unregisterTransitionView } = this.context;
      if (!unregisterTransitionView) return;

      unregisterTransitionView(this.props.id, this.context.routeName);
    }
  }
  return TransitionComponent;
}

export default createTransitionComponent;