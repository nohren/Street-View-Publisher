import React, {useState, useCallback, useReducer} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  Modal,
} from 'react-native';

import {Colors} from 'react-native/Libraries/NewAppScreen';
import {
  Button,
  DisplayCameraRoll,
  Separator,
  Section,
} from './Components/CustomComponents';
import {
  CameraRoll,
  PhotoIdentifier,
} from '@react-native-camera-roll/camera-roll';
import {handleAuthorize} from './Network/networkHandler';

interface State {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  accessTokenExpirationDate: string;
  isTokenValid: boolean;
  image: Record<string, string | number | null>;
  location: Record<string, number>;
  modificationTimestamp: number;
  timestamp: number;
  isErrorState: boolean;
  errorMessage: string;
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
}

type AppActions =
  | {
      type: 'login-success';
      payload: Result;
    }
  | {
      type: 'login-error';
      payload: Error;
    }
  | {
      type: 'reset-errorState';
    }
  | {
      type: 'select-image';
      payload: {
        image: Record<string, string | number | null>;
        location: Record<string, number>;
        modificationTimeStamp: number;
        timestamp: number;
      };
    };

function reducer(state: State, action: AppActions) {
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
    case 'login-error':
      const {message} = action.payload ?? {};
      return {
        ...state,
        isErrorState: true,
        errorMessage: message,
      };
    case 'select-image':
      const {image, location, modificationTimeStamp, timestamp} =
        action.payload ?? {};
      return {
        ...state,
        image,
        location,
        modificationTimeStamp,
        timestamp,
      };
    case 'reset-errorState':
      return {
        ...state,
        isErrorState: false,
        errorMessage: '',
      };
  }
}

const initialState = {
  accessToken: '',
  refreshToken: '',
  isTokenValid: false,
  isErrorState: false,
  errorMessage: '',
  accessTokenExpirationDate: '',
  tokenType: '',
  image: {},
  location: {},
  modificationTimestamp: 0,
  timestamp: 0,
} as State;

function App(): JSX.Element {
  /**
   * state management
   * access token and camera selections
   */
  const [state, dispatch] = useReducer(reducer, initialState);
  const {isTokenValid, accessTokenExpirationDate, isErrorState, errorMessage} =
    state;
  /**
   * Check app color scheme
   */
  const isDarkMode = useColorScheme() === 'dark';

  const [photos, setPhotos] = useState({
    open: false,
    content: [] as PhotoIdentifier[],
    selectedPhoto: {},
  });

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  const openCameraRoll = useCallback(() => {
    CameraRoll.getPhotos({
      first: 20,
      assetType: 'Photos',
      mimeTypes: ['image/jpeg'],
    })
      .then(p => {
        setPhotos({open: true, content: p.edges});
      })
      .catch(err => {
        console.log(err);
      });
  }, []);

  const selectPhoto = photo => {
    setPhotos({open: false, content: [], selectedPhoto: photo});
  };

  const handleLogin = async () => {
    try {
      const result = (await handleAuthorize()) as Result;
      dispatch({type: 'login-success', payload: result});
    } catch (e) {
      dispatch({type: 'login-error', payload: e as Error});
    }
  };

  const resetErrorState = () => {
    dispatch({type: 'reset-errorState'});
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
          {isErrorState && (
            <View style={styles.centeredView}>
              <Modal animationType="slide" visible={true} transparent={false}>
                <View style={styles.centeredView}>
                  <View style={styles.modalView}>
                    <Text>{errorMessage}</Text>
                    <Separator />
                    <Button title="Close" onPress={resetErrorState} />
                  </View>
                </View>
              </Modal>
            </View>
          )}
          <Section title="Step One">
            <Text style={styles.highlight}>Login</Text> to your Google account
          </Section>
          <Separator />
          <View style={styles.screenContainer}>
            {!isTokenValid ? (
              <Button title="Login" onPress={handleLogin} />
            ) : (
              <Text style={styles.success}>
                ✅ Success! Token expires {`${accessTokenExpirationDate}`}
              </Text>
            )}
          </View>
          <Section title="Step Two">
            <Text style={styles.highlight}>Select</Text> a 360 photo from the
            camera roll
          </Section>
          <Separator />
          <View style={styles.screenContainer}>
            <Button title="Select" onPress={openCameraRoll} />
            <View>
              <DisplayCameraRoll
                photos={photos.content}
                onSelect={selectPhoto}
              />
              <Text>{photos.content.length} Photos content</Text>
              <Text>{photos.selectedPhoto?.node?.image?.filename}</Text>
            </View>
          </View>
          <Section title="Step Three">
            <Text style={styles.highlight}>Publish</Text> to GoogleEarth
            streetview
          </Section>
          <Separator />
          <View style={styles.screenContainer}>
            <Button title="Publish" onPress={() => {}} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  highlight: {
    fontWeight: '700',
  },
  screenContainer: {
    flex: 1,
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
});

export default App;
