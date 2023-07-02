import React from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  Text,
  View,
  ScrollView,
  Image,
  Pressable,
} from 'react-native';

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

export const DisplayCameraRoll = ({photos, onSelect}) => {
  //todo, some way to select a photo
  return (
    <View>
      <Separator />
      <ScrollView>
        {photos.map(p => {
          return (
            <TouchableOpacity
              onPress={() => onSelect(p)}
              key={p.node.image.filename}
              style={styles.appButtonContainer}>
              <Image
                style={{
                  width: 100,
                  height: 100,
                }}
                source={{uri: p.node.image.uri}}
              />
            </TouchableOpacity>
          );
        })}
      </ScrollView>
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
});
