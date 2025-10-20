import React from 'react';
import { SafeAreaView, StyleSheet, ViewStyle } from 'react-native';

interface LayoutProps {
  children: React.ReactNode;
  backgroundColor?: string;
}

export default function Layout({ children, backgroundColor = '#F5F7FA' }: LayoutProps) {
  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});