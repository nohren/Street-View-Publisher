/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import type {PropsWithChildren} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';

import {Colors} from 'react-native/Libraries/NewAppScreen';
import {Button, Separator} from './Components/CustomComponents';

type SectionProps = PropsWithChildren<{
  title: string;
}>;

/**
 * Text is a react component for natively showing text
 * style is jss
 */
function Section({children, title}: SectionProps): JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  return (
    <View style={styles.sectionContainer}>
      <Text
        style={[
          styles.sectionTitle,
          {
            color: isDarkMode ? Colors.white : Colors.black,
          },
        ]}>
        {title}
      </Text>
      <Text
        style={[
          styles.sectionDescription,
          {
            color: isDarkMode ? Colors.light : Colors.dark,
          },
        ]}>
        {children}
      </Text>
    </View>
  );
}

const openCameraRoll = () => {
  console.log('opened');
};

function App(): JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  /**
   * SafeAreaView - applicable only on iOS, for rendering content only in view
   * StatusBar - the zone a the top with wifi signal, time, battery
   * ScrollView - a component where everything inside can scroll
   * View - the most fundamental component of UI.  It supports layouts with flexbox, steyle, some touch handling, and accessibility controls. It maps directly to native view equivalent
   *
   */
  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={backgroundStyle}>
        <View
          style={{
            backgroundColor: isDarkMode ? Colors.black : Colors.white,
          }}>
          <Section title="Step One">
            Open <Text style={styles.highlight}>Camera Roll</Text> to select 360
            photo.
          </Section>
          <Separator />
          <View style={styles.screenContainer}>
            <Button title="open" onPress={openCameraRoll} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
  highlight: {
    fontWeight: '700',
  },
  screenContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
});

export default App;
