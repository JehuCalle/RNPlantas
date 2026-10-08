import { Image, StyleSheet } from 'react-native';

import '../assets/menu/NoHaceNada.png';

import '../assets/menu/NoHaceNada2.png';

import '../assets/menu/Girasol.webp';

import AntDesign from 'react-native-vector-icons/AntDesign';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Sprout } from 'lucide-react-native';


export const NoHaceNada = (props) => (
  <Image source={require('../assets/menu/NoHaceNada.png')}/>
);

export const Girasol = () => (
  <Image source={require('../assets/menu/Girasol.webp')} style={styles.img1}/>
);


export const SnowOutline = (props) => (
  <Ionicons name="snow-outline" size={props.tamaño} color={props.color}/>
);

export const Sunny = (props) => (
  <Ionicons name="sunny" size={props.tamaño} color={props.color}/>
);

export const Logout = (props) => (
  <Ionicons name="log-in-outline" size={props.tamaño} color={props.color}/>
);

export const OjoAbierto = (props) => (
  <Ionicons name="eye" size={props.tamaño} color={props.color}/>
);

export const OjoCerrado = (props) => (
  <Ionicons name="eye-off" size={props.tamaño} color={props.color}/>
);

export const Chat = (props) => (
  <Ionicons name="chatbox-ellipses-outline" size={props.tamaño} color={props.color}/>
);

export const Ajustes = (props) => (
  <Ionicons name="settings-outline" size={props.tamaño} color={props.color}/>
);

export const Brote = (props) => (
  <Sprout name="sprout" size={props.tamaño} color={props.color}/>
);

export const PlusCircle = (props) => (
  <AntDesign name="pluscircleo" size={props.tamaño} color={props.color}/>
);

export const PlusCheck = (props) => (
  <AntDesign name="checkcircleo" size={props.tamaño} color={props.color}/>
);

export const PlusVerticalP = (props) => (
  <AntDesign name="bars" size={props.tamaño} color={props.color}/>
);

export const Edit = (props) => (
  <AntDesign name="edit" size={props.tamaño} color={props.color}/>
);

export const Delete = (props) => (
  <AntDesign name="delete" size={props.tamaño} color={props.color}/>
);

export const Cancel = (props) => (
  <AntDesign name="close" size={props.tamaño} color={props.color}/>
);

const styles = StyleSheet.create({
  img1: {
    width: 160,
    height: 160,
  },
});
