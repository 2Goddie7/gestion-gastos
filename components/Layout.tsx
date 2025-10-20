import React from 'react';
import { SafeAreaView, StyleSheet, View, StatusBar } from 'react-native';

interface LayoutProps {
  children: React.ReactNode;
  backgroundColor?: string;
  headerColor?: string;
}

export default function Layout({ 
  children, 
  backgroundColor = '#F5F7FA',
  headerColor
}: LayoutProps) {
  return (
    <>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={headerColor || backgroundColor} 
      />
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <View style={styles.content}>
          {children}
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});