import React, {useReducer, useEffect, useState} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  Modal,
  Vibration,
  Linking,
} from 'react-native';
import Spinner from 'react-native-loading-spinner-overlay';
import {Colors} from 'react-native/Libraries/NewAppScreen';
import {
  Button,
  Separator,
  Section,
  MessageGenerator,
} from './Components/CustomComponents';
import ImagePicker from 'react-native-image-crop-picker';
import {login, publish} from './Network/networkManager';
import {debugLog, isEmpty} from './utils/utils';
import Config from 'react-native-config';
import MapContainer from './Components/MapContainer';
import {Marker} from 'react-native-maps';
import {
  ShowAdd,
  initialAdsCheck,
  interstitial,
  subscribeInterstitial,
} from './AdMob/AdMob';

const API_KEY = Config.API_KEY ?? '';

interface Marker {
  latitude?: number;
  longitude?: number;
}

interface State {
  accessToken: string;
  refreshToken: string;
  isTokenValid: boolean;
  accessTokenExpirationDate: string;
  tokenType: string;
  image: Image | {};
  isErrorState: boolean;
  errorMessage: string;
  isSuccessState: boolean;
  success: Record<string, any>;
  isLoading: boolean;
  isGPSError: boolean;
  isMapOpen: boolean;
  marker: Marker;
}

const initialState = {
  accessToken: '',
  refreshToken: '',
  isTokenValid: false,
  accessTokenExpirationDate: '',
  tokenType: '',
  image: {},
  isErrorState: false,
  errorMessage: '',
  isSuccessState: false,
  success: {},
  isLoading: false,
  isGPSError: false,
  isMapOpen: false,
  marker: {},
} as State;

export interface Image {
  creationDate: string;
  filename: string;
  height: number;
  localIdentifier: string;
  mime: string;
  modificationDate: string;
  path: string;
  size: number;
  sourceURL: string;
  width: number;
  exif: {
    '{GPS}': {
      ImgDirection: number;
      LatitudeRef: 'N' | 'S';
      Latitude: number;
      TimeStamp: string;
      LongitudeRef: 'E' | 'W';
      AltitudeRef: number;
      GPSVersion: number[];
      Altitude: number;
      Longitude: number;
      DateStamp: string;
      ImgDirectionRef: string;
      MapDatum: string;
    };
    '{TIFF}': {
      Copyright: string;
      ResolutionUnit: number;
      Software: string;
      DateTime: string;
      XResolution: number;
      ImageDescription: number;
      YResolution: number;
      Model: string;
      Make: string;
      Orientation: number;
    };
  };
}

interface Result {
  scopes: string[]; // ["https://www.googleapis.com/auth/streetviewpublish"]
  accessTokenExpirationDate: string; // "2023-07-09T02:21:30Z"
  refreshToken: string;
  tokenType: string;
  accessToken: string;
  tokenAdditionalParameters: Record<string, unknown>;
  idToken: string;
  authorizeAdditionalParameters: Record<string, unknown>;
}

interface Error {
  code: string;
  domain: string;
  message: string;
  nativeStackIOS: string[];
  userInfo: Record<string, unknown>;
  stack: string;
  isGPSError: boolean;
}

export interface Success {
  message: string;
  shareLink?: string;
  mapsPublishStatus?: string;
  uploadTime?: string;
  captureTime?: string;
}

type AppActions =
  | {
      type: 'login-success';
      payload: Result;
    }
  | {
      type: 'error';
      payload: Error;
    }
  | {
      type: 'reset-errorState';
    }
  | {
      type: 'select-image';
      payload: Image;
    }
  | {
      type: 'remove-image';
    }
  | {
      type: 'success';
      payload: Success;
    }
  | {type: 'reset-successState'}
  | {type: 'loading'}
  | {type: 'open-map'}
  | {
      type: 'update-marker';
      payload: Marker;
    }
  | {
      type: 'reset-errorState-update-image';
    };

function reducer(state: State, action: AppActions): State {
  switch (action.type) {
    case 'login-success':
      const {accessToken, refreshToken, tokenType, accessTokenExpirationDate} =
        action.payload ?? {};
      return {
        ...state,
        accessToken,
        refreshToken,
        tokenType,
        accessTokenExpirationDate,
        isTokenValid: true,
      };
    case 'error':
      return {
        ...state,
        isErrorState: true,
        isLoading: false,
        errorMessage: action.payload?.message,
        isGPSError: action.payload?.isGPSError ?? false,
      };
    case 'select-image':
      return {
        ...state,
        image: action.payload,
        marker: {},
      };
    case 'remove-image':
      return {
        ...state,
        image: {},
        marker: {},
      };
    case 'reset-errorState':
      return {
        ...state,
        isErrorState: false,
        errorMessage: '',
        isGPSError: false,
        isMapOpen: false,
      };
    case 'reset-errorState-update-image':
      //convert to camera format
      const m_gps = {...(state.image as Image)?.exif?.['{GPS}']} ?? {};
      m_gps.Latitude = Math.abs(state.marker.latitude);
      m_gps.LatitudeRef = state.marker.latitude >= 0 ? 'N' : 'S';
      m_gps.Longitude = Math.abs(state.marker.longitude);
      m_gps.LongitudeRef = state.marker.longitude >= 0 ? 'E' : 'W';

      //first establish the presence of the object before assigning new key/value to it.
      if ((state.image as Image).exif) {
        (state.image as Image).exif['{GPS}'] = m_gps;
      }

      return {
        ...state,
        isErrorState: false,
        errorMessage: '',
        isGPSError: false,
        isMapOpen: false,
      };
    case 'success':
      return {
        ...state,
        isSuccessState: true,
        isLoading: false,
        success: action.payload,
      };
    case 'reset-successState':
      return {
        ...state,
        isSuccessState: false,
        success: {},
        marker: {},
      };
    case 'loading':
      return {
        ...state,
        isLoading: true,
      };
    case 'open-map':
      return {
        ...state,
        isMapOpen: true,
      };
    case 'update-marker':
      return {
        ...state,
        marker: action.payload,
      };
  }
}

function App(): JSX.Element {
  /**
   State management
   */
  const [state, dispatch] = useReducer(reducer, initialState);
  const {
    isTokenValid,
    accessTokenExpirationDate,
    isErrorState,
    errorMessage,
    image,
    accessToken,
    isSuccessState,
    success,
    isLoading,
    isGPSError,
    isMapOpen,
    marker,
  } = state;

  /**
   * adMob logic
   */
  const [isLoaded, setLoaded] = useState(false);
  // const [isLoadedRew, setLoadedRew] = useState(false);

  useEffect(() => {
    //consent screen
    initialAdsCheck()
      .then(adapterStatuses => {
        debugLog(adapterStatuses);
      })
      .catch(e => debugLog(e));

    const [a, b] = subscribeInterstitial(setLoaded);
    // const [c, d] = subscribeRewarded(setLoadedRew);

    interstitial.load();
    // rewarded.load();

    return () => {
      //unsubscribe
      a();
      b();
      // c();
      // d();
    };
  }, []);

  //load again
  useEffect(() => {
    if (!isSuccessState) {
      interstitial.load();
      // rewarded.load();
    }
  }, [isSuccessState]);

  /**
   * Check app color scheme
   */
  const isDarkMode = useColorScheme() === 'dark';
  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
    flex: 1,
  };

  /**
   * Click handlers
   */
  const handleLogin = async () => {
    try {
      const result = (await login()) as Result;
      dispatch({type: 'login-success', payload: result});
    } catch (e) {
      dispatch({type: 'error', payload: e as Error});
    }
  };

  const handlePick = () => {
    ImagePicker.openPicker({
      cropping: false,
      includeExif: true,
      multiple: false,
    })
      .then(image => {
        dispatch({type: 'select-image', payload: image as Image});
      })
      .catch(e => {
        //we don't want to remove an image when we cancel selection
        //commented the below out for now
        //dispatch({type: 'remove-image'});
      });
  };

  const handlePublish = async () => {
    if (!isTokenValid) {
      dispatch({
        type: 'error',
        payload: {message: 'Whoops, please first login!'} as Error,
      });
      return;
    }
    if (isEmpty(image)) {
      dispatch({
        type: 'error',
        payload: {message: 'Whoops, please first select an image!'} as Error,
      });
      return;
    }

    //no gps data || lat or long data is 0
    if (
      !(image as Image)?.exif?.['{GPS}']?.Latitude ||
      !(image as Image)?.exif?.['{GPS}']?.Longitude
    ) {
      dispatch({
        type: 'error',
        payload: {
          message:
            'Whoops, this image has no GPS Data or has 0 for lat or long!  Long press on the map to select coordinates.',
          isGPSError: true,
        } as Error,
      });
      return;
    }

    dispatch({type: 'loading'});

    publish(API_KEY, accessToken, image as Image)
      .then(response => {
        const {captureTime, shareLink, mapsPublishStatus, uploadTime} =
          response;
        debugLog(response);
        dispatch({
          type: 'success',
          payload: {
            captureTime,
            shareLink,
            mapsPublishStatus,
            uploadTime,
            message: 'Success!',
          },
        });
      })
      .catch(e => {
        debugLog(e);
        dispatch({
          type: 'error',
          payload: e as Error,
        });
      });
  };

  const resetErrorState = () => {
    dispatch({type: 'reset-errorState'});
  };

  const resetSuccessState = () => {
    dispatch({type: 'reset-successState'});
  };

  const handlePickGPS = () => {
    dispatch({type: 'open-map'});
  };

  const onMapPress = event => {
    Vibration.vibrate(25);
    dispatch({type: 'update-marker', payload: event.nativeEvent.coordinate});
  };

  const resetErrorStateAndUpdateImageCoordinates = () => {
    dispatch({type: 'reset-errorState-update-image'});
  };

  /**
   * Render area
   *
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
      <View style={{height: '100%'}}>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          style={backgroundStyle}
          contentContainerStyle={{flexGrow: 1}}>
          <View
            style={{
              backgroundColor: isDarkMode ? Colors.black : Colors.white,
              flex: 1,
            }}>
            {isLoading && (
              <Spinner
                visible={true}
                textContent="Loading"
                textStyle={styles.spinnerTextStyle}
              />
            )}
            {isErrorState && (
              <View style={styles.centeredView}>
                <Modal animationType="slide" visible={true} transparent={false}>
                  <SafeAreaView style={backgroundStyle}>
                    <View style={styles.centeredView}>
                      {isMapOpen && (
                        <>
                          <MapContainer
                            onLongPress={onMapPress}
                            marker={marker}
                          />
                          {Boolean(Object.keys(marker).length) && (
                            <View
                              style={{
                                position: 'absolute',
                                bottom: '10%',
                                left: '10%',
                                width: '30%',
                              }}>
                              <Button
                                title="Select"
                                onPress={
                                  resetErrorStateAndUpdateImageCoordinates
                                }
                              />
                            </View>
                          )}
                        </>
                      )}
                      {!isMapOpen && (
                        <View style={styles.modalView}>
                          {!isMapOpen && (
                            <>
                              <Text>{errorMessage}</Text>
                              <Separator />
                              <Button
                                title="Close"
                                onPress={
                                  isGPSError ? handlePickGPS : resetErrorState
                                }
                              />
                            </>
                          )}
                        </View>
                      )}
                    </View>
                  </SafeAreaView>
                </Modal>
              </View>
            )}
            {isSuccessState && (
              <View style={styles.centeredView}>
                <Modal animationType="slide" visible={true} transparent={false}>
                  <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                      {isLoaded && <ShowAdd show={() => interstitial.show()} />}
                      <MessageGenerator values={success} />
                      <Separator />
                      <Button title="Close" onPress={resetSuccessState} />
                    </View>
                  </View>
                </Modal>
              </View>
            )}

            <View style={styles.steps}>
              <Section title="Step One">
                <Text style={styles.highlight}>Login</Text> to your Google
                account
              </Section>
              <Separator />
              <View style={styles.screenContainer}>
                {!isTokenValid ? (
                  <Button title="Login" onPress={handleLogin} />
                ) : (
                  <Text style={styles.success}>
                    ✅ Success! Token expires{' '}
                    {`${new Date(accessTokenExpirationDate)}`}
                  </Text>
                )}
              </View>
            </View>
            <View style={styles.steps}>
              <Section title="Step Two">
                <Text style={styles.highlight}>Select</Text> a 360 photo from
                the camera roll
              </Section>
              <Separator />
              <View style={styles.screenContainer}>
                <Button title="Select" onPress={handlePick} />
                {!isEmpty(image) && (
                  <Text style={{marginTop: 20}}>
                    ✅ {(image as Image).filename} selected
                  </Text>
                )}
              </View>
            </View>
            <View style={styles.steps}>
              <Section title="Step Three">
                <Text style={styles.highlight}>Publish</Text> to GoogleEarth
                streetview
              </Section>
              <Separator />
              <View style={styles.screenContainer}>
                <Button title="Publish" onPress={handlePublish} />
              </View>
            </View>
            <View
              style={{
                flex: 1,
                justifyContent: 'center',
              }}>
              <Text
                style={{textAlign: 'center', color: '#0174CC'}}
                onPress={() =>
                  Linking.openURL(
                    'https://support.google.com/contributionpolicy/answer/13780397',
                  )
                }>
                Google Maps user-generated content policy violations
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  highlight: {
    fontWeight: '700',
  },
  screenContainer: {
    justifyContent: 'center',
    padding: 20,
  },
  success: {
    // backgroundColor: 'green',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  spinnerTextStyle: {
    color: '#FFF',
  },
  steps: {
    flex: 1,
  },
});

export default App;
