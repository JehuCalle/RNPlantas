import React from 'react';
import { StyleSheet, SafeAreaView } from 'react-native';

export default function _layout({ children }){
  return(
    <SafeAreaView className="bg-emerald-50" style={styles.safeContainer}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer:{
    flex: 1,
  },
});
