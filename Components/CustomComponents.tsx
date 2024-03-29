import React, {useState} from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  Text,
  View,
  useColorScheme,
  Linking,
} from 'react-native';
import {Colors} from 'react-native/Libraries/NewAppScreen';
import type {PropsWithChildren} from 'react';
import {Success} from '../App';
import Clipboard from '@react-native-clipboard/clipboard';

type SectionProps = PropsWithChildren<{
  title: string;
}>;
interface ButtonProps {
  title: string;
  onPress: () => void;
}

export const Button = ({onPress, title}: ButtonProps) => (
  <TouchableOpacity onPress={onPress} style={styles.appButtonContainer}>
    <Text style={styles.appButtonText}>{title}</Text>
  </TouchableOpacity>
);

export const Separator = () => <View style={styles.separator} />;

type MessageGeneratorProps = PropsWithChildren<{
  values: Success;
}>;
export const MessageGenerator = ({values}: MessageGeneratorProps) => {
  const [toast, setToast] = useState(false);
  const jsx = [];
  const {message, ...rest} = values;
  const copyAndToast = value => {
    setToast(true);
    Clipboard.setString(value);
    setTimeout(() => {
      setToast(false);
    }, 2000);
  };
  for (const [key, value] of Object.entries(rest)) {
    if (typeof value !== 'string') {
      continue;
    }
    const _key = key.replace(/([A-Z])/g, ' $1');
    jsx.push(
      <Text style={styles.lineSeparation} key={key}>
        <Text style={styles.highlight}>{`${_key}: `}</Text>
        {key === 'shareLink' ? (
          <View>
            {toast && (
              <View
                style={{
                  backgroundColor: 'orange',
                  borderRadius: 5,
                }}>
                <Text>Copied!</Text>
              </View>
            )}
            <Text
              style={styles.link}
              onPress={() => Linking.openURL(value)}
              onLongPress={() => copyAndToast(value)}>
              {value}
            </Text>
            <Text style={styles.lineSeparation}>
              ⬆️ Link may take a few minutes to activate
            </Text>
          </View>
        ) : (
          <Text>
            {key === 'uploadTime' || key === 'captureTime'
              ? new Date(value).toString()
              : value}
          </Text>
        )}
      </Text>,
    );
  }
  return (
    <View>
      <Text style={styles.centerTitle}>{message}</Text>
      <Separator />
      {jsx}
    </View>
  );
};

/**
 * Text is a react component for natively showing text
 * style is jss
 */
export const Section = ({children, title}: SectionProps): JSX.Element => {
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
};

const styles = StyleSheet.create({
  appButtonContainer: {
    elevation: 8,
    backgroundColor: '#009688',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  appButtonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
    alignSelf: 'center',
    textTransform: 'uppercase',
  },
  separator: {
    marginVertical: 8,
    borderBottomColor: '#737373',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
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
  centerTitle: {
    fontSize: 24,
    fontWeight: '600',
    alignSelf: 'center',
  },
  lineSeparation: {
    marginTop: 12,
  },
  highlight: {
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  link: {
    color: '#0174CC',
  },
});
