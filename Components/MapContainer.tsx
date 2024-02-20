import React from 'react';
import {View, StyleSheet} from 'react-native';
import MapView, {Marker} from 'react-native-maps';

const EPSILON = 1000;

export default function MapContainer(props) {
  const {marker: latLng, ...rest} = props;
  //TODO
  //expose all the events, I drag, long press and set marker

  const styles = StyleSheet.create({
    container: {
      ...StyleSheet.absoluteFillObject,
      height: 'auto',
      width: 'auto',
      justifyContent: 'flex-end',
      alignItems: 'center',
    },
    map: {
      ...StyleSheet.absoluteFillObject,
    },
  });

  return (
    <View style={styles.container}>
      <MapView
        {...rest}
        style={styles.map}
        initialRegion={{
          latitude: latLng.latitude ?? 37.78825,
          longitude: latLng.longitude ?? -122.4324,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}>
        <Marker
          key={Math.random()}
          coordinate={latLng}
          title={`${Math.round(latLng.latitude * EPSILON) / EPSILON}, ${
            Math.round(latLng.longitude * EPSILON) / EPSILON
          }`}
          description={'Tap the select button'}
        />
      </MapView>
    </View>
  );
}
