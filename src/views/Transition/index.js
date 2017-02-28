import {
  View,
  Image,
  Text,
} from 'react-native';
import TransitionItems from './TransitionItems';
import createTransitionComponent from './createTransitionComponent';
import createTransition from './createTransition';
import {together} from './composition';

export default {
  View: createTransitionComponent(View),
  Image: createTransitionComponent(Image),
  Text: createTransitionComponent(Text),
  createTransitionComponent,
  createTransition,
  together,
}